'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Contract Financial Timeline — Ledger-Derived, Read-Only
//
// INVARIANTS:
//   - All aggregations milestoneId-scoped (no contractId-only queries)
//   - All monetary math via Prisma.Decimal
//   - All type references via WalletTransactionType enum
//   - ESCROW_FUNDED derived from EscrowLock rows (not ledger)
//   - MILESTONE_RELEASED merges ESCROW_RELEASE + PLATFORM_FEE by milestoneId
//   - No WITHDRAWAL events (wallet-wide, not contract-scoped)
//   - Deterministic grouping only — no createdAt proximity heuristics
// ============================================================================

// --- Public Types ---

export type ContractTimelineEvent =
    | {
        type: 'ESCROW_FUNDED';
        milestoneId: string;
        milestoneTitle: string;
        date: string; // ISO string
        totalLocked: string;
    }
    | {
        type: 'MILESTONE_RELEASED';
        milestoneId: string;
        milestoneTitle: string;
        date: string;
        lockAmount: string;
        freelancerReceived: string;
        platformFee: string;
    }
    | {
        type: 'REFUND';
        milestoneId: string;
        milestoneTitle: string;
        date: string;
        amount: string;
    };

export interface ContractFinancialTimelineResult {
    contractTitle: string;
    events: ContractTimelineEvent[];
}

// --- Server Action ---

export async function getContractFinancialTimeline(
    contractId: string
): Promise<ContractFinancialTimelineResult | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        // 1. Fetch contract with ownership data + milestones + escrow locks
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { select: { userId: true } },
                freelancer: { select: { userId: true } },
                milestones: { select: { id: true, title: true } },
                escrowAccount: {
                    include: {
                        locks: {
                            select: {
                                id: true,
                                milestoneId: true,
                                amount: true,
                                released: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!contract) return { error: 'Contract not found' };

        // 2. Authorization — client, freelancer, admin, or system
        const userId = session.user.id;
        const userRole = (session.user as { role?: string }).role;
        const isClient = contract.client.userId === userId;
        const isFreelancer = contract.freelancer.userId === userId;
        const isAdmin = userRole === 'ADMIN';
        const isSystem = (session.user as { isSystem?: boolean }).isSystem === true;

        if (!isClient && !isFreelancer && !isAdmin && !isSystem) {
            return { error: 'Unauthorized' };
        }

        // 3. Build milestone ID → title lookup
        const milestoneMap = new Map<string, string>();
        for (const m of contract.milestones) {
            milestoneMap.set(m.id, m.title);
        }
        const milestoneIds = Array.from(milestoneMap.keys());

        // 4. Early return for contracts with no financial activity
        if (milestoneIds.length === 0 || !contract.escrowAccount) {
            return {
                contractTitle: contract.title,
                events: [],
            };
        }

        // 5. Single ledger query — scoped by milestoneId IN [...]
        //    Fetch ESCROW_RELEASE, PLATFORM_FEE, REFUND only
        //    (ESCROW_LOCK is derived from EscrowLock rows, not ledger)
        const ledgerEntries = await db.walletLedger.findMany({
            where: {
                milestoneId: { in: milestoneIds },
                type: {
                    in: [
                        WalletTransactionType.ESCROW_RELEASE,
                        WalletTransactionType.PLATFORM_FEE,
                        WalletTransactionType.REFUND,
                    ],
                },
            },
            select: {
                type: true,
                amount: true,
                milestoneId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // 6. Build events

        const events: ContractTimelineEvent[] = [];

        // 6a. ESCROW_FUNDED — one event per EscrowLock row (deterministic)
        for (const lock of contract.escrowAccount.locks) {
            const title = milestoneMap.get(lock.milestoneId) ?? 'Unknown Milestone';
            events.push({
                type: 'ESCROW_FUNDED',
                milestoneId: lock.milestoneId,
                milestoneTitle: title,
                date: lock.createdAt.toISOString(),
                totalLocked: new Prisma.Decimal(lock.amount).toFixed(2),
            });
        }

        // 6b. Group ledger entries by milestoneId for release merging
        const releaseByMilestone = new Map<
            string,
            { releaseAmount: Prisma.Decimal; platformFee: Prisma.Decimal; date: Date }
        >();
        const refundEntries: { milestoneId: string; amount: Prisma.Decimal; date: Date }[] = [];

        for (const entry of ledgerEntries) {
            const mid = entry.milestoneId;
            if (!mid) continue; // Safety — should never happen with our query

            if (entry.type === WalletTransactionType.ESCROW_RELEASE) {
                const existing = releaseByMilestone.get(mid);
                if (existing) {
                    existing.releaseAmount = existing.releaseAmount.plus(new Prisma.Decimal(entry.amount));
                    // Use latest date
                    if (entry.createdAt > existing.date) existing.date = entry.createdAt;
                } else {
                    releaseByMilestone.set(mid, {
                        releaseAmount: new Prisma.Decimal(entry.amount),
                        platformFee: new Prisma.Decimal(0),
                        date: entry.createdAt,
                    });
                }
            } else if (entry.type === WalletTransactionType.PLATFORM_FEE) {
                const existing = releaseByMilestone.get(mid);
                if (existing) {
                    existing.platformFee = existing.platformFee.plus(new Prisma.Decimal(entry.amount));
                } else {
                    releaseByMilestone.set(mid, {
                        releaseAmount: new Prisma.Decimal(0),
                        platformFee: new Prisma.Decimal(entry.amount),
                        date: entry.createdAt,
                    });
                }
            } else if (entry.type === WalletTransactionType.REFUND) {
                refundEntries.push({
                    milestoneId: mid,
                    amount: new Prisma.Decimal(entry.amount),
                    date: entry.createdAt,
                });
            }
        }

        // 6c. MILESTONE_RELEASED — one event per milestone with release data
        for (const [mid, data] of releaseByMilestone) {
            const title = milestoneMap.get(mid) ?? 'Unknown Milestone';
            // lockAmount = freelancerReceived + platformFee
            const lockAmount = data.releaseAmount.plus(data.platformFee);
            events.push({
                type: 'MILESTONE_RELEASED',
                milestoneId: mid,
                milestoneTitle: title,
                date: data.date.toISOString(),
                lockAmount: lockAmount.toFixed(2),
                freelancerReceived: data.releaseAmount.toFixed(2),
                platformFee: data.platformFee.toFixed(2),
            });
        }

        // 6d. REFUND — one event per refund entry
        for (const refund of refundEntries) {
            const title = milestoneMap.get(refund.milestoneId) ?? 'Unknown Milestone';
            events.push({
                type: 'REFUND',
                milestoneId: refund.milestoneId,
                milestoneTitle: title,
                date: refund.date.toISOString(),
                amount: refund.amount.toFixed(2),
            });
        }

        // 7. Sort all events chronologically ASC
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            contractTitle: contract.title,
            events,
        };
    } catch (error) {
        console.error('[getContractFinancialTimeline] Error:', error);
        return { error: 'Failed to load financial timeline' };
    }
}
