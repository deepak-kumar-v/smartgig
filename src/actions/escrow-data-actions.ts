'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Escrow Data Actions — Ledger-Derived Contract-Level Financial Breakdown
// ============================================================================

export type MilestoneFinancialState = 'NOT_FUNDED' | 'FUNDED' | 'RELEASED' | 'REFUNDED';

export interface MilestoneLockData {
    milestoneId: string;
    milestoneTitle: string;
    milestoneStatus: string;
    lockAmount: string;
    platformFee: string;
    freelancerReceives: string;
    released: boolean;
    financialState: MilestoneFinancialState;
}

export interface ContractEscrowData {
    escrowStatus: string;
    totalFunded: string;
    currentlyLocked: string;
    totalReleased: string;
    totalRefunded: string;
    remaining: string;
    platformRevenue: string;
    freelancerNetReceived: string;
    commissionRate: string; // e.g. "0.1000" for 10%
    milestoneLocks: MilestoneLockData[];
}

/**
 * Returns per-contract escrow breakdown.
 * All values derived from EscrowLock + WalletLedger aggregation.
 * Commission breakdown computed server-side using Decimal math.
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
                milestones: { select: { id: true, title: true, status: true } },
            },
        });

        if (!contract) return { error: 'Contract not found' };

        // Auth: must be client, freelancer, or admin on this contract
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
        if (!isClient && !isFreelancer && !isAdmin) {
            return { error: 'Unauthorized' };
        }

        // Read commission rate from contract (immutable, non-nullable after FINALIZED)
        const commissionRate = new Prisma.Decimal(contract.commissionRate);
        const commissionRateStr = commissionRate.toFixed(4);

        if (!contract.escrowAccount) {
            return {
                escrowStatus: 'PENDING',
                totalFunded: '0.00',
                currentlyLocked: '0.00',
                totalReleased: '0.00',
                totalRefunded: '0.00',
                remaining: '0.00',
                platformRevenue: '0.00',
                freelancerNetReceived: '0.00',
                commissionRate: commissionRateStr,
                milestoneLocks: contract.milestones.map(m => ({
                    milestoneId: m.id,
                    milestoneTitle: m.title,
                    milestoneStatus: m.status,
                    lockAmount: '0.00',
                    platformFee: '0.00',
                    freelancerReceives: '0.00',
                    released: false,
                    financialState: 'NOT_FUNDED' as const,
                })),
            };
        }

        const locks = contract.escrowAccount.locks;
        const milestoneIds = contract.milestones.map(m => m.id);

        const totalFunded = locks.reduce(
            (sum, l) => sum.plus(new Prisma.Decimal(l.amount)),
            new Prisma.Decimal(0)
        );
        const currentlyLocked = locks
            .filter(l => !l.released)
            .reduce((sum, l) => sum.plus(new Prisma.Decimal(l.amount)), new Prisma.Decimal(0));
        const totalReleased = locks
            .filter(l => l.released)
            .reduce((sum, l) => sum.plus(new Prisma.Decimal(l.amount)), new Prisma.Decimal(0));

        // Refund ledger — milestoneId-scoped (no contractId-only aggregation)
        const refundEntries = milestoneIds.length > 0
            ? await db.walletLedger.findMany({
                where: {
                    milestoneId: { in: milestoneIds },
                    type: WalletTransactionType.REFUND,
                },
                select: { milestoneId: true, amount: true },
            })
            : [];

        // Build per-milestone refund lookup
        const refundByMilestone = new Map<string, boolean>();
        let totalRefunded = new Prisma.Decimal(0);
        for (const entry of refundEntries) {
            if (entry.milestoneId) {
                refundByMilestone.set(entry.milestoneId, true);
                totalRefunded = totalRefunded.plus(new Prisma.Decimal(entry.amount));
            }
        }

        const remaining = currentlyLocked;

        // Commission breakdown from ledger — milestoneId-scoped
        const [platformFeeEntries, escrowReleaseEntries] = milestoneIds.length > 0
            ? await Promise.all([
                db.walletLedger.aggregate({
                    where: {
                        milestoneId: { in: milestoneIds },
                        type: WalletTransactionType.PLATFORM_FEE,
                    },
                    _sum: { amount: true },
                }),
                db.walletLedger.aggregate({
                    where: {
                        milestoneId: { in: milestoneIds },
                        type: WalletTransactionType.ESCROW_RELEASE,
                    },
                    _sum: { amount: true },
                }),
            ])
            : [{ _sum: { amount: null } }, { _sum: { amount: null } }];

        const platformRevenue = new Prisma.Decimal(platformFeeEntries._sum.amount ?? 0);
        const freelancerNetReceived = new Prisma.Decimal(escrowReleaseEntries._sum.amount ?? 0);

        // Derive financial state per milestone
        const milestoneLocks: MilestoneLockData[] = contract.milestones.map(m => {
            const lock = locks.find(l => l.milestoneId === m.id);
            const lockAmt = lock ? new Prisma.Decimal(lock.amount) : new Prisma.Decimal(0);
            const fee = lockAmt.mul(commissionRate);
            const payout = lockAmt.minus(fee);

            // Deterministic financial state derivation:
            // No EscrowLock → NOT_FUNDED
            // lock.released === false → FUNDED
            // lock.released === true + refund ledger entry → REFUNDED
            // lock.released === true otherwise → RELEASED
            let financialState: MilestoneFinancialState;
            if (!lock) {
                financialState = 'NOT_FUNDED';
            } else if (!lock.released) {
                financialState = 'FUNDED';
            } else if (refundByMilestone.has(m.id)) {
                financialState = 'REFUNDED';
            } else {
                financialState = 'RELEASED';
            }

            return {
                milestoneId: m.id,
                milestoneTitle: m.title,
                milestoneStatus: m.status,
                lockAmount: lockAmt.toFixed(2),
                platformFee: fee.toFixed(2),
                freelancerReceives: payout.toFixed(2),
                released: lock?.released ?? false,
                financialState,
            };
        });

        return {
            escrowStatus: contract.escrowAccount.status,
            totalFunded: totalFunded.toFixed(2),
            currentlyLocked: currentlyLocked.toFixed(2),
            totalReleased: totalReleased.toFixed(2),
            totalRefunded: totalRefunded.toFixed(2),
            remaining: remaining.toFixed(2),
            platformRevenue: platformRevenue.toFixed(2),
            freelancerNetReceived: freelancerNetReceived.toFixed(2),
            commissionRate: commissionRateStr,
            milestoneLocks,
        };
    } catch (error) {
        console.error('[getContractEscrowData] Error:', error);
        return { error: 'Failed to load escrow data' };
    }
}
