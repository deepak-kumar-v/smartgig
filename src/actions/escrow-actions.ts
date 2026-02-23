'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';
import {
    ContractStatus,
    EscrowStatus,
    WalletTransactionType,
    Prisma,
} from '@prisma/client';

// ============================================================================
// Escrow Server Actions — Wallet-First Architecture (Decimal-Safe)
// ============================================================================

/**
 * Funds a contract's escrow by locking funds per milestone.
 *
 * ALL guards and financial operations happen inside a single db.$transaction:
 *
 *  A. Ensure client wallet exists inside tx
 *  B. Compute walletBalance and lockedBalance inside tx
 *  C. Assert available = walletBalance - lockedBalance >= fundingAmount
 *  D. For each milestone:
 *     - Assert amount > 0
 *     - Assert no existing EscrowLock (double-lock prevention)
 *     - Create EscrowLock
 *     - Create WalletLedger debit (ESCROW_LOCK, negative amount)
 *  E. Assert SUM(lock.amount) === fundingAmount (lock total match)
 *  F. Contract → FUNDED
 *  G. assertEscrowIntegrity (cross-checks locks vs ledger)
 *  H. Recompute available inside tx → assert >= 0 (wallet consistency)
 *
 * No pre-transaction balance checks. No race condition window.
 * All Decimal arithmetic uses Prisma.Decimal methods.
 */
export async function fundEscrow(contractId: string, idempotencyKey?: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        // ── Fetch contract with relations (outside tx, read-only) ──
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { include: { user: true } },
                escrowAccount: true,
                milestones: true,
            },
        });

        if (!contract) return { error: 'Contract not found' };

        // ── Ownership: Must be the client ──
        if (contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized access' };
        }

        // ── Status guard ──
        if (contract.status !== ContractStatus.FINALIZED) {
            return { error: 'Contract must be in FINALIZED status to fund escrow' };
        }

        // ── Double-fund guard ──
        if (contract.escrowAccount) {
            return { error: 'Escrow account already exists for this contract' };
        }

        // ── Milestone guard ──
        if (!contract.milestones || contract.milestones.length === 0) {
            return { error: 'Contract must have at least one milestone to fund' };
        }

        // ── Trial invariant check ──
        if (contract.type === 'TRIAL') {
            const milestone = contract.milestones[0];
            const errors: string[] = [];
            if (contract.milestones.length !== 1) errors.push('Trial must have exactly one milestone');
            if (!milestone.title?.trim()) errors.push('Milestone Title');
            if (!milestone.description?.trim()) errors.push('Milestone Description');
            if (new Prisma.Decimal(milestone.amount).isNegative() || new Prisma.Decimal(milestone.amount).isZero()) errors.push('Milestone Amount');
            if (!milestone.dueDate) errors.push('Milestone Due Date');
            if (!contract.startDate) errors.push('Contract Start Date');
            if (!contract.endDate) errors.push('Contract End Date');
            if (errors.length > 0) return { error: `Trial validation failed: ${errors.join(', ')}` };
        }

        const clientUserId = contract.client.userId;
        let fundingAmount = new Prisma.Decimal(0);

        // ── Idempotency pre-check (quiet duplicate rejection) ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        // ── Atomic transaction: ALL financial logic inside ──
        await db.$transaction(async (tx) => {

            // 0. Idempotency guard inside tx (authoritative)
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'FUND_ESCROW' },
                });
            }

            // A. Ensure client wallet exists inside tx
            let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
            if (!clientWallet) {
                clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
            }

            // B. Re-fetch contract + milestones + escrowAccount INSIDE tx
            const freshContract = await tx.contract.findUnique({
                where: { id: contractId },
                include: { milestones: true, escrowAccount: true },
            });
            if (!freshContract) {
                throw new Error('CONTRACT_NOT_FOUND_IN_TX');
            }
            if (freshContract.status !== ContractStatus.FINALIZED) {
                throw new Error(`CONTRACT_NOT_FINALIZED: status=${freshContract.status}`);
            }
            if (freshContract.escrowAccount) {
                throw new Error('ESCROW_ALREADY_EXISTS: double-fund prevention inside tx');
            }
            if (!freshContract.milestones.length) {
                throw new Error('NO_MILESTONES_IN_TX');
            }

            // C. Recompute fundingAmount from FRESH milestone data
            fundingAmount = freshContract.milestones.reduce(
                (sum, m) => sum.plus(m.amount),
                new Prisma.Decimal(0)
            );
            if (!fundingAmount.isPositive()) {
                throw new Error('FUNDING_AMOUNT_NOT_POSITIVE');
            }

            // D. Compute walletBalance inside tx
            const walletLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const walletBalance = new Prisma.Decimal(walletLedgerSum._sum.amount ?? 0);

            // E. Compute lockedBalance inside tx
            const lockedLockSum = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { clientId: freshContract.clientId } },
                },
                _sum: { amount: true },
            });
            const lockedBalance = new Prisma.Decimal(lockedLockSum._sum.amount ?? 0);

            // F. Assert available >= fundingAmount (inside tx — no race condition)
            const available = walletBalance.minus(lockedBalance);
            if (available.minus(fundingAmount).isNegative()) {
                throw new Error(
                    `INSUFFICIENT_BALANCE: Required=${fundingAmount}, Available=${available}`
                );
            }

            // G. Create EscrowAccount
            const escrowAccount = await tx.escrowAccount.create({
                data: {
                    contractId,
                    status: EscrowStatus.FUNDED,
                },
            });

            // H. Per-milestone: validate + lock + ledger debit (using FRESH milestones)
            let lockTotal = new Prisma.Decimal(0);

            for (const milestone of freshContract.milestones) {
                const milestoneAmount = new Prisma.Decimal(milestone.amount);

                // No zero or negative lock amounts
                if (!milestoneAmount.isPositive()) {
                    throw new Error(
                        `ESCROW_ZERO_AMOUNT_VIOLATION: milestone ${milestone.id} has non-positive amount ${milestone.amount}`
                    );
                }

                // Double-lock prevention inside tx
                const existingLock = await tx.escrowLock.findUnique({
                    where: {
                        escrowId_milestoneId: {
                            escrowId: escrowAccount.id,
                            milestoneId: milestone.id,
                        },
                    },
                });
                if (existingLock) {
                    throw new Error(
                        `ESCROW_DUPLICATE_LOCK: milestone ${milestone.id} is already locked`
                    );
                }

                // Create EscrowLock
                await tx.escrowLock.create({
                    data: {
                        escrowId: escrowAccount.id,
                        milestoneId: milestone.id,
                        amount: milestoneAmount,
                    },
                });

                // Create WalletLedger debit (negative amount)
                await tx.walletLedger.create({
                    data: {
                        walletId: clientWallet.id,
                        amount: milestoneAmount.negated(),
                        type: WalletTransactionType.ESCROW_LOCK,
                        contractId,
                        milestoneId: milestone.id,
                    },
                });

                lockTotal = lockTotal.plus(milestoneAmount);
            }

            // I. Assert SUM(lock.amount) === fundingAmount
            if (!lockTotal.equals(fundingAmount)) {
                throw new Error(
                    `ESCROW_LOCK_TOTAL_MISMATCH: lock total=${lockTotal}, expected=${fundingAmount}`
                );
            }

            // J. Contract → FUNDED (optimistic concurrency via where clause)
            await tx.contract.update({
                where: { id: contractId, status: ContractStatus.FINALIZED },
                data: { status: ContractStatus.FUNDED },
            });

            // K. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrowAccount.id, contractId);

            // L. Wallet consistency — recompute available and assert >= 0
            const postLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const postLockedSum = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { clientId: freshContract.clientId } },
                },
                _sum: { amount: true },
            });
            const postAvailable = new Prisma.Decimal(postLedgerSum._sum.amount ?? 0)
                .minus(new Prisma.Decimal(postLockedSum._sum.amount ?? 0));

            if (postAvailable.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_AVAILABLE_ERROR: available=${postAvailable} after funding`
                );
            }
        }, { isolationLevel: 'Serializable' });

        // ── Post-transaction logging (fire-and-forget) ──
        recordLifecycleEvent({
            contractId,
            eventType: 'ESCROW_FUNDED',
            devState: 'FUNDED',
            userMessage: 'Client funded escrow',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: {
                amount: fundingAmount.toNumber(),
                milestoneCount: contract.milestones.length,
            },
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'ESCROW_DEPOSITED',
                    entityType: 'ESCROW',
                    entityId: contractId,
                    details: {
                        amount: fundingAmount.toNumber(),
                        contractId,
                        milestoneCount: contract.milestones.length,
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log ESCROW_DEPOSITED:', err);
            });

        // ── Revalidate ──
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[fundEscrow] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fund escrow';
        return { error: message };
    }
}

// ============================================================================
// Escrow Refund — All-or-Nothing Atomic Refund (Wallet-First, Decimal-Safe)
// ============================================================================

/**
 * Refunds ALL unreleased escrow locks back to the client's wallet.
 *
 * Rules:
 *  - CLIENT or ADMIN only
 *  - Contract must be FUNDED, ACTIVE, or DISPUTED
 *  - All-or-nothing: every unreleased lock is refunded atomically
 *
 * Inside db.$transaction:
 *  A. Re-fetch escrow + all locks
 *  B. Ensure client wallet exists
 *  C. Per unreleased lock: +REFUND ledger entry, mark released = true
 *  D. EscrowAccount → CLOSED, Contract → CANCELLED
 *  E. assertEscrowIntegrity
 *  F. Client wallet consistency (available >= 0)
 */
export async function refundEscrow(contractId: string, idempotencyKey?: string): Promise<{ success?: boolean; error?: string }> {
    try {
        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        // ── Fetch contract (outside tx, read-only for auth + early guards) ──
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { include: { user: true } },
                escrowAccount: true,
            },
        });

        if (!contract) return { error: 'Contract not found' };

        // ── Auth: CLIENT (contract owner) or ADMIN ──
        const isClient = contract.client.userId === session.user.id;
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
        if (!isClient && !isAdmin) {
            return { error: 'Unauthorized. Only the contract client or an admin can refund escrow.' };
        }

        // ── Status guard: FUNDED, ACTIVE, or DISPUTED ──
        const allowedStatuses: ContractStatus[] = [
            ContractStatus.FUNDED,
            ContractStatus.ACTIVE,
            ContractStatus.DISPUTED,
        ];
        if (!allowedStatuses.includes(contract.status)) {
            return { error: `Cannot refund escrow. Contract status is ${contract.status}, must be FUNDED, ACTIVE, or DISPUTED.` };
        }

        // ── Escrow existence guard ──
        if (!contract.escrowAccount) {
            return { error: 'No escrow account found for this contract' };
        }

        const clientUserId = contract.client.userId;
        const escrowId = contract.escrowAccount.id;
        let totalRefunded = new Prisma.Decimal(0);

        // ── Idempotency pre-check (quiet duplicate rejection) ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        // ── Atomic transaction: ALL financial logic inside ──
        await db.$transaction(async (tx) => {

            // 0. Idempotency guard inside tx (authoritative)
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'REFUND_ESCROW' },
                });
            }

            // A. Re-fetch escrow + all locks INSIDE tx
            const freshEscrow = await tx.escrowAccount.findUnique({
                where: { id: escrowId },
                include: { locks: true },
            });
            if (!freshEscrow) {
                throw new Error('ESCROW_NOT_FOUND_IN_TX');
            }

            // B. Re-fetch contract status inside tx
            const freshContract = await tx.contract.findUnique({
                where: { id: contractId },
                select: { status: true, clientId: true },
            });
            if (!freshContract) {
                throw new Error('CONTRACT_NOT_FOUND_IN_TX');
            }
            if (!allowedStatuses.includes(freshContract.status)) {
                throw new Error(`CONTRACT_STATUS_INVALID: status=${freshContract.status}`);
            }

            // C. Ensure client wallet exists inside tx
            let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
            if (!clientWallet) {
                clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
            }

            // D. Per unreleased lock: create REFUND ledger credit + mark released
            const unreleasedLocks = freshEscrow.locks.filter(l => !l.released);

            // No-op refund guard — prevent silent empty refunds
            if (unreleasedLocks.length === 0) {
                throw new Error('NO_REFUNDABLE_LOCKS: all locks already released, nothing to refund');
            }

            for (const lock of unreleasedLocks) {
                const lockAmount = new Prisma.Decimal(lock.amount);

                if (!lockAmount.isPositive()) {
                    throw new Error(`ESCROW_LOCK_ZERO_AMOUNT: lock ${lock.id} has non-positive amount`);
                }

                // Create REFUND ledger entry (+amount back to client)
                await tx.walletLedger.create({
                    data: {
                        walletId: clientWallet.id,
                        amount: lockAmount,
                        type: WalletTransactionType.REFUND,
                        contractId,
                        milestoneId: lock.milestoneId,
                    },
                });

                // Mark lock as released
                await tx.escrowLock.update({
                    where: { id: lock.id },
                    data: { released: true },
                });

                totalRefunded = totalRefunded.plus(lockAmount);
            }

            // E. EscrowAccount → CLOSED
            await tx.escrowAccount.update({
                where: { id: escrowId },
                data: { status: EscrowStatus.CLOSED },
            });

            // F. Contract → CANCELLED
            await tx.contract.update({
                where: { id: contractId },
                data: { status: ContractStatus.CANCELLED },
            });

            // G. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrowId, contractId);

            // H. Client wallet consistency — available balance must be >= 0
            const clientLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const clientLockedSum = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { clientId: freshContract.clientId } },
                },
                _sum: { amount: true },
            });
            const clientAvailable = new Prisma.Decimal(clientLedgerSum._sum.amount ?? 0)
                .minus(new Prisma.Decimal(clientLockedSum._sum.amount ?? 0));

            if (clientAvailable.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_AVAILABLE_ERROR: client available=${clientAvailable} after refund`
                );
            }
        }, { isolationLevel: 'Serializable' });

        // ── Post-transaction logging ──
        recordLifecycleEvent({
            contractId,
            eventType: 'ESCROW_REFUNDED',
            devState: 'CANCELLED',
            userMessage: 'Escrow refunded — all funds returned to client',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { totalRefunded: totalRefunded.toNumber() },
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: isAdmin ? 'ADMIN' : 'CLIENT',
                    action: 'ESCROW_REFUNDED',
                    entityType: 'ESCROW',
                    entityId: contractId,
                    details: {
                        totalRefunded: totalRefunded.toNumber(),
                        contractId,
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log ESCROW_REFUNDED:', err);
            });

        // ── Revalidate ──
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[refundEscrow] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to refund escrow';
        return { error: message };
    }
}
