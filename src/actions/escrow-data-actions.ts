'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Escrow Data Actions — Ledger-Derived, Role-Aware Contract Financial Data
// ============================================================================

export type MilestoneFinancialState = 'NOT_FUNDED' | 'FUNDED' | 'RELEASED' | 'REFUNDED';

export interface MilestoneFinancialData {
    milestoneId: string;
    milestoneTitle: string;
    milestoneStatus: string;
    financialState: MilestoneFinancialState;
    lockAmount: string;
    freelancerReceived: string;
    platformFee: string;
    refundedAmount: string;
}

export interface ContractEscrowData {
    escrowStatus: string;
    contractValue: string;
    commissionRate: string;
    // Ledger-derived aggregates (all milestoneId-scoped)
    totalFunded: string;
    currentlyLocked: string;
    totalReleased: string;
    releasedToFreelancer: string;
    platformFeesPaid: string;
    totalRefunded: string;
    settlementRefunded: string;
    historicalRefunds: string;
    // Refund history entries
    refundHistory: { date: string; reason: string; amount: string; milestoneTitle: string }[];
    // Milestones
    milestones: MilestoneFinancialData[];
}

/**
 * Returns per-contract escrow breakdown.
 * All values derived from EscrowLock + WalletLedger aggregation.
 * All ledger queries are milestoneId-scoped — no contractId-only aggregations.
 */
export async function getContractEscrowData(
    contractId: string
): Promise<ContractEscrowData | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { select: { userId: true } },
                freelancer: { select: { userId: true } },
                escrowAccount: {
                    include: {
                        locks: {
                            include: {
                                milestone: { select: { title: true, status: true } },
                            },
                        },
                    },
                },
                milestones: { select: { id: true, title: true, status: true, amount: true }, orderBy: { sequence: 'asc' } },
            },
        });

        if (!contract) return { error: 'Contract not found' };

        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
        if (!isClient && !isFreelancer && !isAdmin) {
            return { error: 'Unauthorized' };
        }

        const commissionRate = new Prisma.Decimal(contract.commissionRate);
        const contractValue = new Prisma.Decimal(contract.totalBudget).toFixed(2);

        const milestoneIds = contract.milestones.map(m => m.id);

        if (!contract.escrowAccount) {
            return {
                escrowStatus: 'PENDING',
                contractValue,
                commissionRate: commissionRate.toFixed(4),
                totalFunded: '0.00',
                currentlyLocked: '0.00',
                totalReleased: '0.00',
                releasedToFreelancer: '0.00',
                platformFeesPaid: '0.00',
                totalRefunded: '0.00',
                settlementRefunded: '0.00',
                historicalRefunds: '0.00',
                refundHistory: [],
                milestones: contract.milestones.map(m => ({
                    milestoneId: m.id,
                    milestoneTitle: m.title,
                    milestoneStatus: m.status,
                    financialState: 'NOT_FUNDED' as const,
                    lockAmount: '0.00',
                    freelancerReceived: '0.00',
                    platformFee: '0.00',
                    refundedAmount: '0.00',
                })),
            };
        }

        const locks = contract.escrowAccount.locks;

        // ── Contract-level aggregates from EscrowLock ──
        const totalFunded = locks.reduce(
            (sum, l) => sum.plus(new Prisma.Decimal(l.amount)),
            new Prisma.Decimal(0)
        );
        const currentlyLocked = locks
            .filter(l => !l.released)
            .reduce((sum, l) => sum.plus(new Prisma.Decimal(l.amount)), new Prisma.Decimal(0));

        // ── All ledger queries: milestoneId-scoped ──
        const [releaseAgg, feeAgg, refundEntries] = milestoneIds.length > 0
            ? await Promise.all([
                db.walletLedger.aggregate({
                    where: {
                        milestoneId: { in: milestoneIds },
                        type: WalletTransactionType.ESCROW_RELEASE,
                    },
                    _sum: { amount: true },
                }),
                db.walletLedger.aggregate({
                    where: {
                        milestoneId: { in: milestoneIds },
                        type: WalletTransactionType.PLATFORM_FEE,
                    },
                    _sum: { amount: true },
                }),
                db.walletLedger.findMany({
                    where: {
                        milestoneId: { in: milestoneIds },
                        type: WalletTransactionType.REFUND,
                    },
                    select: { milestoneId: true, amount: true, refundReason: true, createdAt: true },
                }),
            ])
            : [
                { _sum: { amount: null } },
                { _sum: { amount: null } },
                [] as { milestoneId: string | null; amount: Prisma.Decimal; refundReason: string | null; createdAt: Date }[],
            ];

        const releasedToFreelancer = new Prisma.Decimal(releaseAgg._sum.amount ?? 0);
        const platformFeesPaid = new Prisma.Decimal(feeAgg._sum.amount ?? 0);

        // Build per-milestone refund lookup and split by reason
        const refundByMilestone = new Map<string, Prisma.Decimal>();
        let totalRefunded = new Prisma.Decimal(0);
        let settlementRefunded = new Prisma.Decimal(0);
        let historicalRefunds = new Prisma.Decimal(0);

        // Build milestone title lookup
        const milestoneTitleMap = new Map<string, string>();
        for (const m of contract.milestones) {
            milestoneTitleMap.set(m.id, m.title);
        }

        const refundHistory: { date: string; reason: string; amount: string; milestoneTitle: string }[] = [];

        for (const entry of refundEntries) {
            const amt = new Prisma.Decimal(entry.amount);
            totalRefunded = totalRefunded.plus(amt);

            const isSettlement = entry.refundReason === 'DISPUTE_SETTLEMENT';
            if (isSettlement) {
                settlementRefunded = settlementRefunded.plus(amt);
            } else {
                historicalRefunds = historicalRefunds.plus(amt);
            }

            if (entry.milestoneId) {
                const prev = refundByMilestone.get(entry.milestoneId) ?? new Prisma.Decimal(0);
                refundByMilestone.set(entry.milestoneId, prev.plus(amt));
            }

            // Map reason to human-readable label
            const reasonLabels: Record<string, string> = {
                OPERATIONAL: 'Escrow Cancelled',
                DISPUTE_SETTLEMENT: 'Dispute Settlement',
                CONTRACT_CANCELLED: 'Contract Cancelled',
                MANUAL_ADMIN_REFUND: 'Admin Refund',
            };
            const reasonLabel = reasonLabels[entry.refundReason ?? ''] ?? 'Escrow Cancelled';

            refundHistory.push({
                date: entry.createdAt.toISOString(),
                reason: reasonLabel,
                amount: amt.toFixed(2),
                milestoneTitle: entry.milestoneId ? (milestoneTitleMap.get(entry.milestoneId) ?? 'Unknown') : 'Unknown',
            });
        }

        // Sort refund history by date descending
        refundHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // ── Per-milestone ledger queries (milestoneId-scoped) ──
        const perMilestoneRelease = milestoneIds.length > 0
            ? await db.walletLedger.groupBy({
                by: ['milestoneId'],
                where: {
                    milestoneId: { in: milestoneIds },
                    type: WalletTransactionType.ESCROW_RELEASE,
                },
                _sum: { amount: true },
            })
            : [];

        const perMilestoneFee = milestoneIds.length > 0
            ? await db.walletLedger.groupBy({
                by: ['milestoneId'],
                where: {
                    milestoneId: { in: milestoneIds },
                    type: WalletTransactionType.PLATFORM_FEE,
                },
                _sum: { amount: true },
            })
            : [];

        const releaseByMs = new Map<string, Prisma.Decimal>();
        for (const row of perMilestoneRelease) {
            if (row.milestoneId) releaseByMs.set(row.milestoneId, new Prisma.Decimal(row._sum.amount ?? 0));
        }
        const feeByMs = new Map<string, Prisma.Decimal>();
        for (const row of perMilestoneFee) {
            if (row.milestoneId) feeByMs.set(row.milestoneId, new Prisma.Decimal(row._sum.amount ?? 0));
        }

        // ── Derive per-milestone financial data ──
        const milestones: MilestoneFinancialData[] = contract.milestones.map(m => {
            const lock = locks.find(l => l.milestoneId === m.id);
            const lockAmt = lock ? new Prisma.Decimal(lock.amount) : new Prisma.Decimal(0);
            const msRelease = releaseByMs.get(m.id) ?? new Prisma.Decimal(0);
            const msFee = feeByMs.get(m.id) ?? new Prisma.Decimal(0);
            const msRefund = refundByMilestone.get(m.id) ?? new Prisma.Decimal(0);

            // Deterministic financial state derivation
            // Order matters: RELEASED must be checked before REFUNDED because
            // a milestone that was refunded, then re-funded and released, will
            // have both REFUND and ESCROW_RELEASE ledger entries.
            let financialState: MilestoneFinancialState;
            if (!lock) {
                financialState = 'NOT_FUNDED';
            } else if (!lock.released) {
                financialState = 'FUNDED';
            } else if (releaseByMs.has(m.id)) {
                financialState = 'RELEASED';
            } else if (refundByMilestone.has(m.id)) {
                financialState = 'REFUNDED';
            } else {
                financialState = 'RELEASED';
            }

            return {
                milestoneId: m.id,
                milestoneTitle: m.title,
                milestoneStatus: m.status,
                financialState,
                lockAmount: lockAmt.toFixed(2),
                freelancerReceived: msRelease.toFixed(2),
                platformFee: msFee.toFixed(2),
                refundedAmount: msRefund.toFixed(2),
            };
        });

        return {
            escrowStatus: contract.escrowAccount.status,
            contractValue,
            commissionRate: commissionRate.toFixed(4),
            totalFunded: totalFunded.toFixed(2),
            currentlyLocked: currentlyLocked.toFixed(2),
            totalReleased: releasedToFreelancer.plus(platformFeesPaid).toFixed(2),
            releasedToFreelancer: releasedToFreelancer.toFixed(2),
            platformFeesPaid: platformFeesPaid.toFixed(2),
            totalRefunded: totalRefunded.toFixed(2),
            settlementRefunded: settlementRefunded.toFixed(2),
            historicalRefunds: historicalRefunds.toFixed(2),
            refundHistory,
            milestones,
        };
    } catch (error) {
        console.error('[getContractEscrowData] Error:', error);
        return { error: 'Failed to load escrow data' };
    }
}
