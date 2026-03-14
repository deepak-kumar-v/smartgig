'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';
import { assertDecimalNonNegative } from '@/lib/financial-assertions';
import { getPlatformWallet } from '@/lib/platform-wallet';
import { emitScopedUpdate } from '@/lib/emit-scoped-update';
import {
    ContractStatus,
    EscrowStatus,
    MilestoneStatus,
    WalletTransactionType,
    Prisma,
} from '@prisma/client';

// ============================================================================
// Escrow Release Actions — Lock-Release Pattern with Commission Distribution
// ============================================================================

/**
 * Releases escrowed funds for a specific milestone with atomic commission split.
 *
 * All critical assertions happen INSIDE db.$transaction to prevent race conditions:
 *
 *  A. Ensure freelancer wallet exists inside tx
 *  B. Re-fetch EscrowLock using tx (not pre-fetched value)
 *  C. Re-fetch milestone and contract status using tx
 *  D. Assert: lock exists, released === false, amount > 0
 *  E. Assert: milestone.status === APPROVED
 *  F. Assert: contract.status === ACTIVE
 *  G. Read contract.commissionRate (immutable, snapshotted at FINALIZED)
 *  H. Compute: commission = lockAmount * commissionRate
 *  I. Compute: freelancerPayout = lockAmount - commission
 *  J. Create WalletLedger credit for freelancer (+freelancerPayout, ESCROW_RELEASE)
 *  K. Create WalletLedger credit for platform (+commission, PLATFORM_FEE)
 *  L. Mark EscrowLock.released = true
 *  M. Milestone → PAID
 *  N. If all milestones PAID → contract COMPLETED, escrow CLOSED
 *  O. assertEscrowIntegrity (cross-checks locks vs ledger)
 *  P. Wallet consistency assertions (freelancer, platform available >= 0)
 */
export async function releaseMilestoneFunds(milestoneId: string, idempotencyKey?: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        // ── Fetch milestone with contract, escrow (outside tx, read-only) ──
        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: {
                        client: { include: { user: true } },
                        freelancer: { include: { user: true } },
                        escrowAccount: {
                            include: { locks: true },
                        },
                        milestones: { select: { id: true, status: true } },
                    },
                },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };

        const contract = milestone.contract;
        const escrow = contract.escrowAccount;

        // ── Ownership: CLIENT only ──
        if (contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. Only the contract client can release funds.' };
        }

        // ── Pre-checks (non-financial, safe to be outside tx) ──
        if (contract.status !== ContractStatus.ACTIVE) {
            return { error: `Cannot release funds. Contract status is ${contract.status}, must be ACTIVE.` };
        }
        if (!escrow) {
            return { error: 'Escrow account not found for this contract' };
        }
        if (milestone.status === MilestoneStatus.DISPUTED) {
            return { error: 'Cannot release funds for a disputed milestone' };
        }
        if (milestone.status !== MilestoneStatus.APPROVED) {
            return { error: `Cannot release funds. Milestone status is ${milestone.status}, must be APPROVED.` };
        }

        const freelancerUserId = contract.freelancer.userId;
        let releaseAmount: Prisma.Decimal = new Prisma.Decimal(0);
        let commissionAmount: Prisma.Decimal = new Prisma.Decimal(0);
        let freelancerPayout: Prisma.Decimal = new Prisma.Decimal(0);

        // ── Idempotency pre-check (quiet duplicate rejection) ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        // ── Atomic transaction: ALL financial assertions inside ──
        await db.$transaction(async (tx) => {

            // 0. Idempotency guard inside tx (authoritative)
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'RELEASE_MILESTONE_FUNDS' },
                });
            }

            // A. Ensure freelancer wallet exists inside tx
            let freelancerWallet = await tx.wallet.findUnique({ where: { userId: freelancerUserId } });
            if (!freelancerWallet) {
                freelancerWallet = await tx.wallet.create({ data: { userId: freelancerUserId } });
            }

            // B. Re-fetch the EscrowLock inside tx (strict in-tx validation)
            const lock = await tx.escrowLock.findFirst({
                where: {
                    milestoneId,
                    escrowId: escrow.id,
                },
            });

            // C. Assert lock exists
            if (!lock) {
                throw new Error('ESCROW_LOCK_NOT_FOUND: No escrow lock found for this milestone');
            }

            // D. Assert released === false (double-release prevention inside tx)
            if (lock.released) {
                throw new Error('ESCROW_ALREADY_RELEASED: Funds already released for this milestone');
            }

            // E. Assert non-zero lock amount
            const lockAmount = new Prisma.Decimal(lock.amount);
            if (!lockAmount.isPositive()) {
                throw new Error(`ESCROW_LOCK_ZERO_AMOUNT: lock ${lock.id} has non-positive amount`);
            }

            // F. Re-fetch milestone status inside tx
            const freshMilestone = await tx.milestone.findUnique({
                where: { id: milestoneId },
                select: { status: true },
            });
            if (freshMilestone?.status !== MilestoneStatus.APPROVED) {
                throw new Error(`MILESTONE_NOT_APPROVED: status=${freshMilestone?.status}`);
            }

            // G. Re-fetch contract inside tx — read commissionRate
            const freshContract = await tx.contract.findUnique({
                where: { id: contract.id },
                select: { status: true, commissionRate: true },
            });
            if (freshContract?.status !== ContractStatus.ACTIVE) {
                throw new Error(`CONTRACT_NOT_ACTIVE: status=${freshContract?.status}`);
            }

            // H. Read immutable commission rate — must exist (non-nullable after backfill)
            if (freshContract.commissionRate === null || freshContract.commissionRate === undefined) {
                throw new Error('COMMISSION_RATE_MISSING: contract.commissionRate is null');
            }
            const commissionRate = new Prisma.Decimal(freshContract.commissionRate);

            // I. Compute commission split
            commissionAmount = lockAmount.mul(commissionRate);
            freelancerPayout = lockAmount.minus(commissionAmount);
            releaseAmount = lockAmount;

            // I.1 COMMISSION_SPLIT_INCONSISTENT assertion (MANDATORY)
            if (!freelancerPayout.plus(commissionAmount).equals(lockAmount)) {
                throw new Error(
                    `COMMISSION_SPLIT_INCONSISTENT: freelancer=${freelancerPayout} + commission=${commissionAmount} != lock=${lockAmount}`
                );
            }

            // Sanity checks
            if (freelancerPayout.isNegative()) {
                throw new Error(`COMMISSION_EXCEEDS_LOCK: commission=${commissionAmount}, lock=${lockAmount}`);
            }
            assertDecimalNonNegative(commissionAmount, 'commissionAmount');
            assertDecimalNonNegative(freelancerPayout, 'freelancerPayout');

            // J. WalletLedger credit for freelancer (payout after commission)
            await tx.walletLedger.create({
                data: {
                    walletId: freelancerWallet.id,
                    amount: freelancerPayout,
                    type: WalletTransactionType.ESCROW_RELEASE,
                    contractId: contract.id,
                    milestoneId,
                },
            });

            // K. WalletLedger credit for platform (commission)
            if (commissionAmount.isPositive()) {
                const platformWallet = await getPlatformWallet(tx);
                await tx.walletLedger.create({
                    data: {
                        walletId: platformWallet.id,
                        amount: commissionAmount,
                        type: WalletTransactionType.PLATFORM_FEE,
                        contractId: contract.id,
                        milestoneId,
                    },
                });
            }

            // L. Mark EscrowLock.released = true
            await tx.escrowLock.update({
                where: { id: lock.id },
                data: { released: true },
            });

            // M. Milestone → PAID
            await tx.milestone.update({
                where: { id: milestoneId },
                data: { status: MilestoneStatus.PAID },
            });

            // N. Check if ALL milestones for this contract are PAID
            //    Only then mark contract as COMPLETED.
            //    Previous bug: checked only escrow locks (unfunded milestones have no lock,
            //    causing premature COMPLETED after first milestone paid).
            const remainingUnpaid = await tx.milestone.findFirst({
                where: {
                    contractId: contract.id,
                    status: { not: MilestoneStatus.PAID },
                },
                select: { id: true },
            });

            const disputedMilestones = await tx.milestone.findMany({
                where: { contractId: contract.id, status: MilestoneStatus.DISPUTED },
                select: { id: true },
            });

            if (!remainingUnpaid && disputedMilestones.length === 0) {
                await tx.contract.update({
                    where: { id: contract.id },
                    data: { status: ContractStatus.COMPLETED },
                });
                await tx.escrowAccount.update({
                    where: { id: escrow.id },
                    data: { status: EscrowStatus.CLOSED },
                });
            }

            // O. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrow.id, contract.id);

            // P. Wallet consistency — freelancer available balance must be >= 0
            const freelancerLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: freelancerWallet.id },
                _sum: { amount: true },
            });
            const freelancerLockedSum = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { freelancerId: contract.freelancerId } },
                },
                _sum: { amount: true },
            });
            const freelancerAvailable = new Prisma.Decimal(freelancerLedgerSum._sum.amount ?? 0)
                .minus(new Prisma.Decimal(freelancerLockedSum._sum.amount ?? 0));

            if (freelancerAvailable.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_AVAILABLE_ERROR: freelancer available=${freelancerAvailable} after release`
                );
            }

            // Q. Platform wallet consistency check
            if (commissionAmount.isPositive()) {
                const platformWallet = await getPlatformWallet(tx);
                const platformLedgerSum = await tx.walletLedger.aggregate({
                    where: { walletId: platformWallet.id },
                    _sum: { amount: true },
                });
                const platformAvailable = new Prisma.Decimal(platformLedgerSum._sum.amount ?? 0);
                if (platformAvailable.isNegative()) {
                    throw new Error(
                        `PLATFORM_WALLET_NEGATIVE: available=${platformAvailable} after commission credit`
                    );
                }
            }

            // R. Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'RELEASE_MILESTONE_FUNDS',
                    userId: session.user.id,
                    contractId: contract.id,
                    milestoneId,
                    metadata: {
                        lockAmount: releaseAmount.toFixed(2),
                        commission: commissionAmount.toFixed(2),
                        payout: freelancerPayout.toFixed(2),
                    },
                },
            });

        }, { isolationLevel: 'Serializable' });

        // ── Post-transaction logging ──
        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId,
            eventType: 'MILESTONE_FUNDS_RELEASED',
            devState: 'ACTIVE',
            userMessage: `Funds released for milestone: ${milestone.title} (payout: $${freelancerPayout.toFixed(2)}, fee: $${commissionAmount.toFixed(2)})`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: {
                lockAmount: releaseAmount.toNumber(),
                commission: commissionAmount.toNumber(),
                freelancerPayout: freelancerPayout.toNumber(),
            },
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'ESCROW_RELEASED',
                    entityType: 'MILESTONE',
                    entityId: milestoneId,
                    details: {
                        lockAmount: releaseAmount.toNumber(),
                        commission: commissionAmount.toNumber(),
                        freelancerPayout: freelancerPayout.toNumber(),
                        contractId: contract.id,
                        milestoneTitle: milestone.title,
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log ESCROW_RELEASED:', err);
            });

        // ── Revalidate ──
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contract.id}`);
        revalidatePath(`/freelancer/contracts/${contract.id}`);

        emitScopedUpdate('contract:updated');

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'RELEASE_MILESTONE_FUNDS',
                userId: undefined,
                milestoneId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        const message = error instanceof Error ? error.message : 'Failed to release milestone funds';
        return { error: message };
    }
}
