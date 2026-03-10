'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';
import { assertDecimalNonNegative } from '@/lib/financial-assertions';
import {
    ContractStatus,
    EscrowStatus,
    MilestoneStatus,
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

        // ── TRIAL contracts must use fundMilestone() instead ──
        // Trial lifecycle: FINALIZED → Start Work → ACTIVE → Fund Milestone
        if (contract.type === 'TRIAL') {
            return { error: 'Trial contracts use per-milestone funding. Freelancer must start work first, then fund via the milestone card.' };
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

            // L. Wallet consistency — ledger total must be >= 0
            // The ledger already contains ESCROW_LOCK debits as negative entries.
            // Do NOT subtract EscrowLock amounts again — that double-counts.
            const postLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const postTotal = new Prisma.Decimal(postLedgerSum._sum.amount ?? 0);

            if (postTotal.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_BALANCE: ledger total=${postTotal} after funding`
                );
            }

            // M. Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'FUND_ESCROW',
                    userId: clientUserId,
                    contractId,
                    metadata: { fundingAmount: fundingAmount.toFixed(2), milestoneCount: freshContract.milestones.length },
                },
            });
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
        db.financialErrorLog.create({
            data: {
                action: 'FUND_ESCROW',
                userId: undefined,
                contractId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        const message = error instanceof Error ? error.message : 'Failed to fund escrow';
        return { error: message };
    }
}

// ============================================================================
// Per-Milestone Funding — Strict Sequential Order (FULL Contracts Only)
// ============================================================================

/**
 * Funds a single milestone's escrow for an ACTIVE FULL contract.
 *
 * STRICT SEQUENTIAL RULES:
 *  1. Contract must be ACTIVE
 *  2. Milestone must be PENDING
 *  3. All previous milestones (ordered by createdAt) must be PAID
 *  4. No existing EscrowLock for this milestone
 *
 * Inside db.$transaction (Serializable):
 *  A. Ensure EscrowAccount exists (create if first funding)
 *  B. Ensure client wallet exists
 *  C. Re-validate sequential ordering inside tx
 *  D. Compute available balance, assert >= milestone amount
 *  E. Create EscrowLock
 *  F. Create WalletLedger debit (ESCROW_LOCK, negative)
 *  G. assertEscrowIntegrity
 *  H. Wallet consistency assertion
 *  I. FinancialMutationLog
 */
export async function fundMilestone(milestoneId: string, idempotencyKey?: string): Promise<{ success?: boolean; error?: string }> {
    try {
        console.log('[fundMilestone] ENTRY — milestoneId:', milestoneId);

        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        // ── Fetch milestone with contract + all milestones ──
        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: {
                        client: { include: { user: true } },
                        milestones: { orderBy: { sequence: 'asc' } },
                        escrowAccount: { include: { locks: true } },
                    },
                },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };

        const contract = milestone.contract;

        // ── Ownership: Must be the client ──
        if (contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. Only the contract client can fund milestones.' };
        }

        // ── Contract must be ACTIVE ──
        if (contract.status !== ContractStatus.ACTIVE) {
            return { error: `Contract must be ACTIVE to fund milestones. Current status: ${contract.status}` };
        }

        // ── Milestone must be PENDING ──
        if (milestone.status !== 'PENDING') {
            return { error: `Cannot fund milestone. Current status: ${milestone.status}, must be PENDING.` };
        }

        // ── Sequential ordering: all previous milestones must be PAID ──
        const allMilestones = contract.milestones;
        const milestoneIndex = allMilestones.findIndex(m => m.id === milestoneId);
        if (milestoneIndex === -1) return { error: 'Milestone not found in contract' };

        for (let i = 0; i < milestoneIndex; i++) {
            if (allMilestones[i].status !== 'PAID') {
                return { error: 'Previous milestone must be completed before funding this one.' };
            }
        }

        // ── Double-lock prevention (pre-check) ──
        const existingLock = contract.escrowAccount?.locks.find(l => l.milestoneId === milestoneId);
        if (existingLock) {
            return { error: 'Milestone is already funded.' };
        }

        // ── Milestone amount must be positive ──
        const milestoneAmount = new Prisma.Decimal(milestone.amount);
        if (!milestoneAmount.isPositive()) {
            return { error: 'Milestone amount must be greater than zero.' };
        }

        const clientUserId = contract.client.userId;

        // ── Idempotency pre-check ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        console.log('[fundMilestone] VALIDATION PASSED — funding milestone:', milestone.title,
            '| amount:', milestoneAmount.toFixed(2));

        let escrowAccountId: string;

        // ── Atomic transaction ──
        await db.$transaction(async (tx) => {

            // 0. Idempotency guard inside tx
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'FUND_MILESTONE' },
                });
            }

            // A. Ensure client wallet exists
            let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
            if (!clientWallet) {
                clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
            }

            // B. Re-fetch contract + milestones + escrow INSIDE tx
            const freshContract = await tx.contract.findUnique({
                where: { id: contract.id },
                include: {
                    milestones: { orderBy: { sequence: 'asc' } },
                    escrowAccount: { include: { locks: true } },
                },
            });
            if (!freshContract) throw new Error('CONTRACT_NOT_FOUND_IN_TX');
            if (freshContract.status !== ContractStatus.ACTIVE) {
                throw new Error(`CONTRACT_NOT_ACTIVE: status=${freshContract.status}`);
            }

            // C. Re-validate sequential ordering inside tx
            const freshMilestones = freshContract.milestones;
            const freshIndex = freshMilestones.findIndex(m => m.id === milestoneId);
            if (freshIndex === -1) throw new Error('MILESTONE_NOT_IN_CONTRACT_TX');

            const freshMilestone = freshMilestones[freshIndex];
            if (freshMilestone.status !== 'PENDING') {
                throw new Error(`MILESTONE_NOT_PENDING: status=${freshMilestone.status}`);
            }

            for (let i = 0; i < freshIndex; i++) {
                if (freshMilestones[i].status !== 'PAID') {
                    throw new Error(`SEQUENTIAL_VIOLATION: milestone ${freshMilestones[i].id} is ${freshMilestones[i].status}, not PAID`);
                }
            }

            // D. Ensure/create EscrowAccount
            let escrowAccount = freshContract.escrowAccount;
            if (!escrowAccount) {
                escrowAccount = await tx.escrowAccount.create({
                    data: {
                        contractId: contract.id,
                        status: EscrowStatus.FUNDED,
                    },
                }) as typeof escrowAccount & { locks: never[] };
                (escrowAccount as any).locks = [];
            }
            escrowAccountId = escrowAccount!.id;

            // E. Double-lock prevention inside tx
            const existingLockTx = await tx.escrowLock.findFirst({
                where: { escrowId: escrowAccountId, milestoneId },
            });
            if (existingLockTx) {
                throw new Error(`ESCROW_DUPLICATE_LOCK: milestone ${milestoneId} already locked`);
            }

            // F. VALIDATE BALANCE BEFORE ANY WRITES
            // Single source of truth — matches getWalletDashboardData() exactly:
            //   available = SUM(all ledger) - SUM(pending withdrawals)
            // Ledger already contains ESCROW_LOCK debits as negative entries.
            const [ledgerTotalAgg, pendingWithdrawalAgg] = await Promise.all([
                tx.walletLedger.aggregate({
                    where: { walletId: clientWallet.id },
                    _sum: { amount: true },
                }),
                tx.withdrawalRequest.aggregate({
                    where: { userId: clientUserId, status: 'PENDING' },
                    _sum: { amount: true },
                }),
            ]);

            const ledgerTotal = new Prisma.Decimal(ledgerTotalAgg._sum.amount ?? 0);
            const pendingWithdrawals = new Prisma.Decimal(pendingWithdrawalAgg._sum.amount ?? 0);
            const available = ledgerTotal.minus(pendingWithdrawals);

            const freshAmount = new Prisma.Decimal(freshMilestone.amount);
            if (available.minus(freshAmount).isNegative()) {
                throw new Error(`INSUFFICIENT_BALANCE: Required=${freshAmount}, Available=${available} (ledgerTotal=${ledgerTotal}, pending=${pendingWithdrawals})`);
            }

            // G. Create EscrowLock (ONLY after balance validated)
            await tx.escrowLock.create({
                data: {
                    escrowId: escrowAccountId,
                    milestoneId,
                    amount: freshAmount,
                },
            });

            // H. Create WalletLedger debit (ONLY after balance validated)
            await tx.walletLedger.create({
                data: {
                    walletId: clientWallet.id,
                    amount: freshAmount.negated(),
                    type: WalletTransactionType.ESCROW_LOCK,
                    contractId: contract.id,
                    milestoneId,
                },
            });

            // I. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrowAccountId, contract.id);

            // J. Post-insert wallet consistency
            // The ledger SUM already includes the escrow debit (-amount).
            // EscrowLock tracks the same amount separately.
            // So: total_from_ledger = deposits - escrow_debits + releases
            // Correct post-check: ledger total must be >= 0 (no overdraft).
            // Do NOT subtract locks again — that double-counts.
            const postLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const postTotal = new Prisma.Decimal(postLedgerSum._sum.amount ?? 0);

            if (postTotal.isNegative()) {
                throw new Error(`WALLET_NEGATIVE_BALANCE: ledger total=${postTotal} after milestone funding`);
            }

            // K. Mutation log
            await tx.financialMutationLog.create({
                data: {
                    action: 'FUND_MILESTONE',
                    userId: clientUserId,
                    contractId: contract.id,
                    milestoneId,
                    metadata: { amount: freshAmount.toFixed(2), milestoneTitle: freshMilestone.title },
                },
            });
        }, { isolationLevel: 'Serializable' });

        console.log('[fundMilestone] SUCCESS — milestone funded:', milestoneId);

        // ── Post-transaction logging ──
        recordLifecycleEvent({
            contractId: contract.id,
            milestoneId,
            eventType: 'MILESTONE_FUNDED',
            devState: 'ACTIVE',
            userMessage: `Client funded milestone: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { amount: milestoneAmount.toNumber() },
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'MILESTONE_FUNDED',
                    entityType: 'ESCROW',
                    entityId: contract.id,
                    details: {
                        milestoneId,
                        amount: milestoneAmount.toNumber(),
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log MILESTONE_FUNDED:', err);
            });

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contract.id}`);
        revalidatePath(`/freelancer/contracts/${contract.id}`);

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'FUND_MILESTONE',
                userId: undefined,
                milestoneId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });

        // Clean user-facing errors — do not leak internal invariant messages
        const raw = error instanceof Error ? error.message : 'Failed to fund milestone';
        let userMessage = 'Failed to fund milestone';
        if (raw.startsWith('INSUFFICIENT_BALANCE')) {
            userMessage = 'Insufficient available balance to fund this milestone.';
        } else if (raw.startsWith('ESCROW_DUPLICATE_LOCK')) {
            userMessage = 'Milestone is already funded.';
        } else if (raw.startsWith('SEQUENTIAL_VIOLATION')) {
            userMessage = 'Previous milestone must be completed before funding this one.';
        } else if (raw.startsWith('CONTRACT_NOT_ACTIVE')) {
            userMessage = 'Contract must be ACTIVE to fund milestones.';
        }

        console.error('[fundMilestone] ERROR:', raw);
        return { error: userMessage };
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
                freelancer: { include: { user: true } },
                milestones: { select: { id: true, status: true, title: true } },
                escrowAccount: true,
            },
        });

        if (!contract) return { error: 'Contract not found' };

        // ── Auth: ADMIN ONLY — full contract refund is admin-only ──
        const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
        if (!isAdmin) {
            return { error: 'Full contract refund is admin-only. Use per-milestone refund instead.' };
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

        // ── P0 SAFETY: Block refund when milestones have progressed past PENDING ──
        const blockedStatuses: MilestoneStatus[] = [
            MilestoneStatus.IN_PROGRESS,
            MilestoneStatus.SUBMITTED,
            MilestoneStatus.APPROVED,
        ];
        const activeMilestones = contract.milestones.filter((m: { status: MilestoneStatus }) =>
            blockedStatuses.includes(m.status)
        );
        if (activeMilestones.length > 0) {
            const details = activeMilestones.map((m: { title: string; status: MilestoneStatus }) => `"${m.title}" (${m.status})`).join(', ');
            return {
                error: `Cannot refund: ${activeMilestones.length} milestone(s) have active work — ${details}. You must resolve or dispute these milestones before refunding.`,
            };
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
            // The ledger already contains ESCROW_LOCK debits as negative entries
            // and REFUND entries as positive. Do NOT subtract EscrowLock amounts
            // again — that double-counts the locked funds.
            const clientLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const clientAvailable = new Prisma.Decimal(clientLedgerSum._sum.amount ?? 0);

            if (clientAvailable.isNegative()) {
                throw new Error(
                    `WALLET_NEGATIVE_AVAILABLE_ERROR: client available=${clientAvailable} after refund`
                );
            }

            // I. Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'REFUND_ESCROW',
                    userId: clientUserId,
                    contractId,
                    metadata: { totalRefunded: totalRefunded.toFixed(2), locksRefunded: unreleasedLocks.length },
                },
            });
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

        // ── P0 SAFETY: Notify freelancer about refund ──
        const freelancerUserId = contract.freelancer.userId;
        db.notification
            .create({
                data: {
                    userId: freelancerUserId,
                    title: 'Escrow Refunded',
                    message: `The escrow for contract "${contract.title}" has been refunded by the client. The contract has been cancelled. If you believe this is unfair, please contact support.`,
                    type: 'ESCROW_REFUNDED',
                },
            })
            .catch((err: unknown) => {
                console.error('[Notification] Failed to notify freelancer about refund:', err);
            });

        // ── Revalidate ──
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'REFUND_ESCROW',
                userId: undefined,
                contractId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        const message = error instanceof Error ? error.message : 'Failed to refund escrow';
        return { error: message };
    }
}

// ============================================================================
// refundMilestone — Per-milestone refund (CLIENT only, PENDING milestones only)
// ============================================================================

export async function refundMilestone(
    milestoneId: string,
    idempotencyKey?: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        // ── Fetch milestone + contract + escrow + deliverables ──
        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: {
                        client: { include: { user: true } },
                        freelancer: { include: { user: true } },
                        escrowAccount: { include: { locks: true } },
                    },
                },
                deliverables: { select: { id: true } },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };

        const contract = milestone.contract;

        // ── Auth: CLIENT owner only ──
        if (contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. Only the contract client can refund a milestone.' };
        }

        // ── Contract status guard: must be ACTIVE or FUNDED ──
        if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.FUNDED) {
            return { error: `Cannot refund milestone. Contract status is ${contract.status}, must be ACTIVE or FUNDED.` };
        }

        // ── Milestone status guard: PENDING only ──
        if (milestone.status !== MilestoneStatus.PENDING) {
            return { error: `Cannot refund milestone "${milestone.title}". Status is ${milestone.status} — refund is only allowed before work starts (PENDING).` };
        }

        // ── Deliverables guard ──
        if (milestone.deliverables.length > 0) {
            return { error: `Cannot refund milestone "${milestone.title}". ${milestone.deliverables.length} deliverable(s) already uploaded.` };
        }

        // ── Escrow lock guard ──
        if (!contract.escrowAccount) {
            return { error: 'No escrow account found for this contract.' };
        }

        const lock = contract.escrowAccount.locks.find(
            (l: { milestoneId: string | null; released: boolean }) => l.milestoneId === milestoneId && !l.released
        );
        if (!lock) {
            return { error: `No unreleased escrow lock found for milestone "${milestone.title}". It may not be funded.` };
        }

        const lockAmount = new Prisma.Decimal(lock.amount);
        if (!lockAmount.isPositive()) {
            return { error: 'Escrow lock has zero or negative amount.' };
        }

        // ── Idempotency pre-check ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        const clientUserId = contract.client.userId;
        const escrowId = contract.escrowAccount.id;
        const contractId = contract.id;

        // ── Atomic transaction ──
        await db.$transaction(async (tx) => {

            // 0. Idempotency guard inside tx
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'REFUND_MILESTONE' },
                });
            }

            // A. Re-fetch lock inside tx to prevent race
            const freshLock = await tx.escrowLock.findUnique({ where: { id: lock.id } });
            if (!freshLock || freshLock.released) {
                throw new Error('LOCK_ALREADY_RELEASED: concurrent refund/release detected');
            }

            // B. Ensure client wallet exists
            let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
            if (!clientWallet) {
                clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
            }

            // C. Create REFUND ledger entry
            await tx.walletLedger.create({
                data: {
                    walletId: clientWallet.id,
                    amount: lockAmount,
                    type: WalletTransactionType.REFUND,
                    contractId,
                    milestoneId,
                },
            });

            // D. Delete lock (allows re-funding — unique constraint safe)
            await tx.escrowLock.delete({
                where: { id: lock.id },
            });

            // E. Check if any unreleased locks remain → conditionally close escrow
            const remainingLocks = await tx.escrowLock.count({
                where: { escrow: { id: escrowId }, released: false },
            });
            if (remainingLocks === 0) {
                await tx.escrowAccount.update({
                    where: { id: escrowId },
                    data: { status: EscrowStatus.CLOSED },
                });
            }

            // F. Assert escrow integrity
            await assertEscrowIntegrity(tx, escrowId, contractId);

            // G. Client wallet consistency
            // The ledger already contains ESCROW_LOCK debits as negative entries
            // and REFUND entries as positive. Do NOT subtract EscrowLock amounts
            // again — that double-counts the locked funds.
            const clientLedgerSum = await tx.walletLedger.aggregate({
                where: { walletId: clientWallet.id },
                _sum: { amount: true },
            });
            const clientAvailable = new Prisma.Decimal(clientLedgerSum._sum.amount ?? 0);
            if (clientAvailable.isNegative()) {
                throw new Error(`WALLET_NEGATIVE_AVAILABLE_ERROR: client available=${clientAvailable} after milestone refund`);
            }

            // H. Mutation log
            await tx.financialMutationLog.create({
                data: {
                    action: 'REFUND_MILESTONE',
                    userId: clientUserId,
                    contractId,
                    metadata: {
                        milestoneId,
                        milestoneTitle: milestone.title,
                        amount: lockAmount.toFixed(2),
                    },
                },
            });
        }, { isolationLevel: 'Serializable' });

        // ── Post-transaction logging ──
        recordLifecycleEvent({
            contractId,
            eventType: 'MILESTONE_REFUNDED',
            devState: contract.status,
            userMessage: `Milestone "${milestone.title}" refunded — $${lockAmount.toFixed(2)} returned to client`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { milestoneId, amount: lockAmount.toNumber() },
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'MILESTONE_REFUNDED',
                    entityType: 'MILESTONE',
                    entityId: milestoneId,
                    details: {
                        milestoneTitle: milestone.title,
                        amount: lockAmount.toNumber(),
                        contractId,
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log MILESTONE_REFUNDED:', err);
            });

        // ── Notify freelancer ──
        const freelancerUserId = contract.freelancer.userId;
        db.notification
            .create({
                data: {
                    userId: freelancerUserId,
                    title: 'Milestone Refunded',
                    message: `Client refunded milestone "${milestone.title}" ($${lockAmount.toFixed(2)}) before work started.`,
                    type: 'MILESTONE_REFUNDED',
                },
            })
            .catch((err: unknown) => {
                console.error('[Notification] Failed to notify freelancer about milestone refund:', err);
            });

        // ── Revalidate ──
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'REFUND_MILESTONE',
                userId: undefined,
                contractId: undefined,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        const message = error instanceof Error ? error.message : 'Failed to refund milestone';
        return { error: message };
    }
}
