'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';
import { assertDecimalNonNegative } from '@/lib/financial-assertions';
import { getPlatformWallet } from '@/lib/platform-wallet';
import {
    ContractStatus,
    EscrowStatus,
    MilestoneStatus,
    WalletTransactionType,
    Prisma,
} from '@prisma/client';

// ============================================================================
// Trial Actions — Wallet-First Architecture
// ============================================================================

/**
 * CLIENT: Approves trial work and releases escrow funds with commission split.
 *
 * Lock-release pattern (same as releaseMilestoneFunds):
 *  1. Find the EscrowLock for the trial milestone
 *  2. Read commissionRate from contract (immutable, snapshotted at FINALIZED)
 *  3. Compute: commission = lockAmount * commissionRate
 *  4. Credit freelancer wallet (lockAmount - commission)
 *  5. Credit platform wallet (commission) via PLATFORM_FEE
 *  6. Assert: freelancerPayout + commission === lockAmount
 *  7. Mark lock as released
 *  8. Milestone → PAID, Contract → COMPLETED, Escrow → CLOSED
 */
export async function approveTrialWork(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { include: { user: true } },
                freelancer: { include: { user: true } },
                escrowAccount: {
                    include: { locks: true },
                },
                milestones: { select: { id: true, amount: true, title: true } },
            },
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };
        if (contract.type !== 'TRIAL') return { error: 'Not a trial contract' };
        if (contract.status !== ContractStatus.ACTIVE) return { error: 'Contract not active' };

        const escrow = contract.escrowAccount;
        if (!escrow) return { error: 'Escrow account not found' };

        // Trial = exactly 1 milestone
        const milestone = contract.milestones[0];
        if (!milestone) return { error: 'No milestone found for trial' };

        const freelancerUserId = contract.freelancer.userId;
        let releaseAmount: Prisma.Decimal = new Prisma.Decimal(0);
        let commissionAmount: Prisma.Decimal = new Prisma.Decimal(0);
        let freelancerPayout: Prisma.Decimal = new Prisma.Decimal(0);

        // Atomic transaction: all financial assertions inside
        await db.$transaction(async (tx) => {
            // A. Ensure freelancer wallet exists inside tx
            let freelancerWallet = await tx.wallet.findUnique({ where: { userId: freelancerUserId } });
            if (!freelancerWallet) {
                freelancerWallet = await tx.wallet.create({ data: { userId: freelancerUserId } });
            }

            // B. Re-fetch contract.status + commissionRate inside tx
            const freshContract = await tx.contract.findUnique({
                where: { id: contractId },
                select: { status: true, commissionRate: true },
            });
            if (freshContract?.status !== ContractStatus.ACTIVE) {
                throw new Error(`CONTRACT_NOT_ACTIVE: status=${freshContract?.status}`);
            }

            // C. Read immutable commission rate
            if (freshContract.commissionRate === null || freshContract.commissionRate === undefined) {
                throw new Error('COMMISSION_RATE_MISSING: contract.commissionRate is null');
            }
            const commissionRate = new Prisma.Decimal(freshContract.commissionRate);

            // D. Re-fetch milestone status inside tx (mirrors releaseMilestoneFunds)
            const freshMilestone = await tx.milestone.findUnique({
                where: { id: milestone.id },
                select: { status: true },
            });
            if (!freshMilestone) {
                throw new Error('MILESTONE_NOT_FOUND_IN_TX: trial milestone missing');
            }
            if (freshMilestone.status !== 'SUBMITTED' && freshMilestone.status !== 'IN_PROGRESS' && freshMilestone.status !== 'APPROVED') {
                throw new Error(`MILESTONE_STATUS_INVALID: status=${freshMilestone.status}, not eligible for trial approval`);
            }

            // E. Re-fetch the EscrowLock inside tx
            const lock = await tx.escrowLock.findFirst({
                where: { milestoneId: milestone.id, escrowId: escrow.id },
            });

            if (!lock) throw new Error('ESCROW_LOCK_NOT_FOUND: No lock for trial milestone');

            // E. Assert not already released (double-release prevention inside tx)
            if (lock.released) throw new Error('ESCROW_ALREADY_RELEASED: Trial funds already released');

            // F. Assert non-zero lock amount
            const lockAmount = new Prisma.Decimal(lock.amount);
            if (!lockAmount.isPositive()) {
                throw new Error(`ESCROW_LOCK_ZERO_AMOUNT: lock ${lock.id} has non-positive amount`);
            }

            // G. Compute commission split
            commissionAmount = lockAmount.mul(commissionRate);
            freelancerPayout = lockAmount.minus(commissionAmount);
            releaseAmount = lockAmount;

            // H. COMMISSION_SPLIT_INCONSISTENT assertion (MANDATORY)
            if (!freelancerPayout.plus(commissionAmount).equals(lockAmount)) {
                throw new Error(
                    `COMMISSION_SPLIT_INCONSISTENT: freelancer=${freelancerPayout} + commission=${commissionAmount} != lock=${lockAmount}`
                );
            }

            // I. Sanity: freelancer payout must not be negative
            if (freelancerPayout.isNegative()) {
                throw new Error(`COMMISSION_EXCEEDS_LOCK: commission=${commissionAmount}, lock=${lockAmount}`);
            }
            assertDecimalNonNegative(commissionAmount, 'commissionAmount');
            assertDecimalNonNegative(freelancerPayout, 'freelancerPayout');

            // J. Credit freelancer wallet (payout after commission)
            await tx.walletLedger.create({
                data: {
                    walletId: freelancerWallet.id,
                    amount: freelancerPayout,
                    type: WalletTransactionType.ESCROW_RELEASE,
                    contractId,
                    milestoneId: milestone.id,
                },
            });

            // K. Credit platform wallet (commission)
            if (commissionAmount.isPositive()) {
                const platformWallet = await getPlatformWallet(tx);
                await tx.walletLedger.create({
                    data: {
                        walletId: platformWallet.id,
                        amount: commissionAmount,
                        type: WalletTransactionType.PLATFORM_FEE,
                        contractId,
                        milestoneId: milestone.id,
                    },
                });
            }

            // F. Mark lock as released
            await tx.escrowLock.update({
                where: { id: lock.id },
                data: { released: true },
            });

            // G. Milestone → PAID
            await tx.milestone.update({
                where: { id: milestone.id },
                data: { status: MilestoneStatus.PAID, approvedAt: new Date() },
            });

            // H. Contract → COMPLETED
            await tx.contract.update({
                where: { id: contractId },
                data: { status: ContractStatus.COMPLETED },
            });

            // I. Escrow → CLOSED
            await tx.escrowAccount.update({
                where: { id: escrow.id },
                data: { status: EscrowStatus.CLOSED },
            });

            // J. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrow.id, contractId);

            // K. Item 7: Wallet consistency — freelancer available balance must be >= 0
            const freelancerLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: freelancerWallet.id },
                _sum: { amount: true },
            });
            const freelancerAvailable = new Prisma.Decimal(freelancerLedgerSum._sum.amount ?? 0);
            if (freelancerAvailable.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_AVAILABLE_ERROR: freelancer available=${freelancerAvailable} after trial approval`
                );
            }

            // Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'APPROVE_TRIAL_WORK',
                    userId: session.user.id,
                    contractId,
                    milestoneId: milestone.id,
                    metadata: {
                        lockAmount: releaseAmount.toFixed(2),
                        commission: commissionAmount.toFixed(2),
                        payout: freelancerPayout.toFixed(2),
                    },
                },
            });
        }, { isolationLevel: 'Serializable' });

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        recordLifecycleEvent({
            contractId,
            eventType: 'TRIAL_APPROVED',
            devState: 'COMPLETED',
            userMessage: 'Client approved trial work — funds released',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'TRIAL_APPROVED',
                    entityType: 'CONTRACT',
                    entityId: contractId,
                    details: { amount: releaseAmount.toNumber() },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log TRIAL_APPROVED:', err);
            });

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'APPROVE_TRIAL_WORK',
                userId: undefined,
                contractId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        const message = error instanceof Error ? error.message : 'Failed to approve trial work';
        return { error: message };
    }
}

export async function rejectTrialWork(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { client: true }
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };
        if (contract.type !== 'TRIAL') return { error: 'Not a trial contract' };

        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.REJECTED }
        });

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);

        recordLifecycleEvent({
            contractId,
            eventType: 'TRIAL_REJECTED',
            devState: 'REJECTED',
            userMessage: 'Client rejected trial work',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        return { success: true };
    } catch (error) {
        console.error('Reject Trial Error:', error);
        return { error: 'Failed to reject trial work' };
    }
}

export async function raiseDispute(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { freelancer: true }
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.freelancer.userId !== session.user.id) return { error: 'Unauthorized Access' };

        if (contract.status !== ContractStatus.REJECTED) return { error: 'Can only dispute rejected work' };

        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.DISPUTED }
        });

        recordLifecycleEvent({
            contractId,
            eventType: 'DISPUTE_RAISED',
            devState: 'DISPUTED',
            userMessage: 'Freelancer raised a dispute',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath('/freelancer/contracts');
        revalidatePath(`/freelancer/contracts/${contractId}`);
        return { success: true };
    } catch (error) {
        console.error('Raise Dispute Error:', error);
        return { error: 'Failed to raise dispute' };
    }
}

/**
 * CLIENT: Upgrades a completed TRIAL contract to a FULL contract.
 * Creates in DRAFT status with totalBudget: 0 (must add milestones).
 *
 * STRICT GATING — upgrade is allowed ONLY when:
 *  1. contract.type === "TRIAL"
 *  2. contract.status === COMPLETED
 *  3. Current user is the CLIENT of the contract
 *  4. No FULL contract already exists for the same proposal
 */
export async function upgradeToStandard(trialContractId: string) {
    console.log('[upgradeToStandard] ENTRY — trialContractId:', trialContractId);

    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        // 1. Fetch contract
        const trialContract = await db.contract.findUnique({
            where: { id: trialContractId },
            include: {
                client: true,
                proposal: {
                    include: { job: { select: { title: true } } }
                },
                conversation: true
            }
        });

        console.log('[upgradeToStandard] VALIDATION — contract found:', !!trialContract,
            '| type:', trialContract?.type,
            '| status:', trialContract?.status);

        // 2. Contract must exist
        if (!trialContract) return { error: 'Trial contract not found' };

        // 3. Must be a TRIAL type — no exceptions
        if (trialContract.type !== 'TRIAL') return { error: 'Source must be a trial contract' };

        // 4. Must be COMPLETED — no other status allowed
        if (trialContract.status !== ContractStatus.COMPLETED) {
            return { error: 'Trial must be COMPLETED before upgrading.' };
        }

        // 5. Only the owning CLIENT can upgrade
        if (trialContract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };

        // 6. Prevent duplicate FULL contract for the same proposal
        const existingFull = await db.contract.findFirst({
            where: { proposalId: trialContract.proposalId, type: 'FULL' }
        });
        if (existingFull) {
            console.log('[upgradeToStandard] BLOCKED — FULL contract already exists:', existingFull.id);
            return { error: 'A full contract already exists for this proposal.' };
        }

        // ALL validations passed — create FULL contract
        console.log('[upgradeToStandard] CREATING FULL contract from trial:', trialContractId,
            '| proposalId:', trialContract.proposalId);

        const newContract = await db.contract.create({
            data: {
                proposalId: trialContract.proposalId,
                clientId: trialContract.clientId,
                freelancerId: trialContract.freelancerId,
                title: trialContract.proposal.job.title,
                totalBudget: trialContract.totalBudget,
                status: ContractStatus.DRAFT,
                terms: trialContract.terms,
                type: 'FULL',
                sourceTrialId: trialContractId,
                commissionRate: trialContract.commissionRate,
                startDate: null,
                endDate: null,
            }
        });

        console.log('[upgradeToStandard] SUCCESS — new FULL contract created:', newContract.id);

        // Update Conversation to point to new contract
        if (trialContract.conversation) {
            await db.conversation.update({
                where: { id: trialContract.conversation.id },
                data: { contractId: newContract.id }
            });
        }

        recordLifecycleEvent({
            contractId: newContract.id,
            eventType: 'TRIAL_UPGRADED',
            devState: 'DRAFT',
            userMessage: 'Trial upgraded to standard contract (DRAFT)',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { sourceTrialId: trialContractId },
        });

        revalidatePath('/client/contracts');
        revalidatePath('/messages');
        return { success: true, newContractId: newContract.id };
    } catch (error) {
        console.error('[upgradeToStandard] ERROR:', error);
        return { error: 'Failed to upgrade contract' };
    }
}
