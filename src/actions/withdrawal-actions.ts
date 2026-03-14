'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { emitDataUpdated } from '@/lib/emit-data-updated';

// ============================================================================
// Withdrawal Actions — No immediate ledger mutation
// ============================================================================

/**
 * Request a withdrawal — creates a PENDING WithdrawalRequest.
 * NO ledger mutation at this stage.
 *
 * Runs inside db.$transaction (Serializable) to prevent concurrent
 * requests from bypassing the available balance check.
 *
 * Available = SUM(ledger) - SUM(unreleased escrow locks) - SUM(pending withdrawals)
 */
export async function requestWithdrawal(amount: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        if (amount <= 0) return { error: 'Amount must be positive' };

        const userId = session.user.id;

        const result = await db.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new Error('No wallet found');

            // Derive available balance from ledger — inside tx
            const balanceAgg = await tx.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });

            const lockedAgg = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { client: { userId } } },
                },
                _sum: { amount: true },
            });

            // Subtract pending withdrawal requests — prevents double-spend
            const pendingWithdrawals = await tx.withdrawalRequest.aggregate({
                where: { userId, status: 'PENDING' },
                _sum: { amount: true },
            });

            const totalBalance = new Prisma.Decimal(balanceAgg._sum.amount ?? 0);
            const lockedBalance = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);
            const pendingAmount = new Prisma.Decimal(pendingWithdrawals._sum.amount ?? 0);
            const availableBalance = totalBalance.minus(lockedBalance).minus(pendingAmount);

            const requestAmount = new Prisma.Decimal(amount);

            if (requestAmount.greaterThan(availableBalance)) {
                throw new Error(`Insufficient available balance. Available: $${availableBalance.toFixed(2)}`);
            }

            const request = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: requestAmount,
                    status: 'PENDING',
                },
            });

            // Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'REQUEST_WITHDRAWAL',
                    userId,
                    metadata: { amount: requestAmount.toFixed(2), requestId: request.id },
                },
            });

            return { success: true as const, requestId: request.id };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        revalidatePath('/client/wallet');
        revalidatePath('/freelancer/wallet');
        revalidatePath('/freelancer/wallet/withdraw');

        emitDataUpdated();

        return result;
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'REQUEST_WITHDRAWAL',
                userId: undefined,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        return { error: error instanceof Error ? error.message : 'Failed to submit withdrawal request' };
    }
}

/**
 * Approve a withdrawal — creates WalletLedger debit entry inside a transaction.
 * Admin-only action.
 *
 * Inside db.$transaction (Serializable):
 *   1. Re-fetch WithdrawalRequest → assert status === PENDING
 *   2. Recompute available balance
 *   3. Assert request.amount <= available
 *   4. Create WalletLedger entry: amount = -amount, type = WITHDRAWAL
 *   5. Update WithdrawalRequest status → COMPLETED
 *   6. Post-debit assertion: new available >= 0
 */
export async function approveWithdrawal(requestId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return { error: 'Admin only' };
        }

        const result = await db.$transaction(async (tx) => {
            // 1. Re-fetch & guard status
            const request = await tx.withdrawalRequest.findUnique({
                where: { id: requestId },
            });

            if (!request) throw new Error('Request not found');
            if (request.status !== 'PENDING') throw new Error('Request is not pending');

            // 2. Recompute available balance inside tx
            const wallet = await tx.wallet.findUnique({
                where: { userId: request.userId },
            });

            if (!wallet) throw new Error('Wallet not found');

            const balanceAgg = await tx.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });

            const lockedAgg = await tx.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: { contract: { client: { userId: request.userId } } },
                },
                _sum: { amount: true },
            });

            const totalBalance = new Prisma.Decimal(balanceAgg._sum.amount ?? 0);
            const lockedBalance = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);

            // Subtract OTHER pending withdrawals (exclude this request being approved)
            const otherPendingAgg = await tx.withdrawalRequest.aggregate({
                where: { userId: request.userId, status: 'PENDING', id: { not: requestId } },
                _sum: { amount: true },
            });
            const otherPending = new Prisma.Decimal(otherPendingAgg._sum.amount ?? 0);
            const availableBalance = totalBalance.minus(lockedBalance).minus(otherPending);

            // 3. Pre-debit assertion
            if (request.amount.greaterThan(availableBalance)) {
                throw new Error('Insufficient balance at approval time');
            }

            // 4. Create ledger debit
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: request.amount.negated(),
                    type: 'WITHDRAWAL',
                },
            });

            // 5. Update request status → COMPLETED
            await tx.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: 'COMPLETED' },
            });

            // 6. Post-debit assertion
            const postDebitAgg = await tx.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });
            const postDebitBalance = new Prisma.Decimal(postDebitAgg._sum.amount ?? 0);
            const postDebitAvailable = postDebitBalance.minus(lockedBalance);

            if (postDebitAvailable.lessThan(0)) {
                throw new Error(`Post-debit invariant violated: available = ${postDebitAvailable.toFixed(2)}`);
            }

            // Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'APPROVE_WITHDRAWAL',
                    userId: request.userId,
                    metadata: { requestId, withdrawalAmount: request.amount.toFixed(2) },
                },
            });

            return { success: true as const };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        revalidatePath('/client/wallet');
        revalidatePath('/freelancer/wallet');
        revalidatePath('/freelancer/wallet/withdraw');
        revalidatePath('/admin/withdrawals');

        emitDataUpdated();

        return result;
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'APPROVE_WITHDRAWAL',
                userId: undefined,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        return { error: error instanceof Error ? error.message : 'Failed to approve withdrawal' };
    }
}

/**
 * Reject a withdrawal request. Admin-only.
 * Only PENDING requests can be rejected.
 * No ledger mutation.
 */
export async function rejectWithdrawal(requestId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return { error: 'Admin only' };
        }

        await db.$transaction(async (tx) => {
            const request = await tx.withdrawalRequest.findUnique({
                where: { id: requestId },
            });

            if (!request) throw new Error('Withdrawal request not found');
            if (request.status !== 'PENDING') {
                throw new Error(`Cannot reject: request is already ${request.status}`);
            }

            await tx.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' },
            });

            // Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'REJECT_WITHDRAWAL',
                    userId: request.userId,
                    metadata: { requestId },
                },
            });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        revalidatePath('/client/wallet');
        revalidatePath('/freelancer/wallet');
        revalidatePath('/freelancer/wallet/withdraw');
        revalidatePath('/admin/withdrawals');

        emitDataUpdated();

        return { success: true };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'REJECT_WITHDRAWAL',
                userId: undefined,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        return { error: error instanceof Error ? error.message : 'Failed to reject withdrawal' };
    }
}

/**
 * Get withdrawal requests for the current user.
 */
export async function getMyWithdrawalRequests() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const requests = await db.withdrawalRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return {
            requests: requests.map((r: { id: string; amount: Prisma.Decimal; status: string; createdAt: Date; updatedAt: Date }) => ({
                id: r.id,
                amount: new Prisma.Decimal(r.amount).toFixed(2),
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
            })),
        };
    } catch (error) {
        console.error('[getMyWithdrawalRequests] Error:', error);
        return { error: 'Failed to load withdrawal requests' };
    }
}

// ============================================================================
// Admin: Get Pending Withdrawal Requests
// ============================================================================

export interface PendingWithdrawalRow {
    id: string;
    userId: string;
    userEmail: string;
    userName: string | null;
    amount: string;
    createdAt: string;
}

/**
 * Fetches all PENDING withdrawal requests for admin review.
 * Admin-only. Returns typed rows with Decimal-safe amounts.
 */
export async function getPendingWithdrawalRequests(): Promise<
    { requests: PendingWithdrawalRow[] } | { error: string }
> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const userRole = (session.user as { role?: string }).role;
        if (userRole !== 'ADMIN') {
            return { error: 'Unauthorized. Admin access required.' };
        }

        const requests = await db.withdrawalRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        return {
            requests: requests.map((r) => ({
                id: r.id,
                userId: r.user.id,
                userEmail: r.user.email,
                userName: r.user.name,
                amount: new Prisma.Decimal(r.amount).toFixed(2),
                createdAt: r.createdAt.toISOString(),
            })),
        };
    } catch (error) {
        console.error('[getPendingWithdrawalRequests] Error:', error);
        return { error: 'Failed to load pending withdrawal requests' };
    }
}
