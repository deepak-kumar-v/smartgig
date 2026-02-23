'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Wallet Server Actions — Fintech-Grade Wallet System (Decimal-Safe)
// ============================================================================

/**
 * Ensures a wallet exists for the given userId.
 * Creates one if it doesn't exist (idempotent).
 * Returns the wallet with its ID.
 */
export async function ensureWallet(userId: string) {
    const existing = await db.wallet.findUnique({ where: { userId } });
    if (existing) return existing;

    return db.wallet.create({
        data: { userId },
    });
}

/**
 * Computes wallet balance from ledger aggregation.
 * Balance = SUM(all ledger amounts).
 * Returns a Prisma.Decimal — the ONLY source of truth for balance.
 */
export async function getWalletBalance(userId: string): Promise<Prisma.Decimal> {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) return new Prisma.Decimal(0);

    const result = await db.walletLedger.aggregate({
        where: { walletId: wallet.id },
        _sum: { amount: true },
    });

    return new Prisma.Decimal(result._sum.amount ?? 0);
}

/**
 * Computes locked balance for a user.
 * Locked = SUM(EscrowLock.amount) where released === false,
 * scoped to escrow accounts on contracts where the user is the client.
 * Returns a Prisma.Decimal.
 */
export async function getLockedBalance(userId: string): Promise<Prisma.Decimal> {
    const result = await db.escrowLock.aggregate({
        where: {
            released: false,
            escrow: {
                contract: {
                    client: { userId },
                },
            },
        },
        _sum: { amount: true },
    });

    return new Prisma.Decimal(result._sum.amount ?? 0);
}

/**
 * Available balance = total balance - locked funds.
 * Returns a Prisma.Decimal.
 */
export async function getAvailableBalance(userId: string): Promise<Prisma.Decimal> {
    const snapshot = await getWalletSnapshot(userId);
    return snapshot.availableBalance;
}

// ============================================================================
// Wallet Snapshot — Single Source of Truth for All Balance Values
//
// INVARIANT:
//   availableBalance = totalBalance - lockedBalance - pendingWithdrawals
//
// This formula MUST match requestWithdrawal() validation.
// UI must consume ONLY this function — no duplicate formulas.
// ============================================================================

export interface WalletSnapshot {
    totalBalance: Prisma.Decimal;
    lockedBalance: Prisma.Decimal;
    pendingWithdrawals: Prisma.Decimal;
    availableBalance: Prisma.Decimal;
}

export async function getWalletSnapshot(userId: string): Promise<WalletSnapshot> {
    const [totalBalance, lockedBalance, pendingAgg] = await Promise.all([
        getWalletBalance(userId),
        getLockedBalance(userId),
        db.withdrawalRequest.aggregate({
            where: { userId, status: 'PENDING' },
            _sum: { amount: true },
        }),
    ]);

    const pendingWithdrawals = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
    const availableBalance = totalBalance.minus(lockedBalance).minus(pendingWithdrawals);

    return {
        totalBalance,
        lockedBalance,
        pendingWithdrawals,
        availableBalance,
    };
}

/**
 * Deposits funds into the authenticated user's wallet.
 *
 * Inside db.$transaction:
 *   1. Ensure wallet exists
 *   2. Create WalletLedger entry: amount = +amount, type = DEPOSIT
 *
 * No other money creation path is allowed.
 */
export async function depositToWallet(
    amount: number,
    idempotencyKey?: string
): Promise<{ success?: boolean; error?: string; balance?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        const userId = session.user.id;
        const depositAmount = new Prisma.Decimal(amount);

        if (!depositAmount.isPositive()) {
            return { error: 'Deposit amount must be positive' };
        }

        // ── Idempotency pre-check (quiet duplicate rejection) ──
        if (idempotencyKey) {
            const existing = await db.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
            if (existing) return { error: 'DUPLICATE_REQUEST' };
        }

        await db.$transaction(async (tx) => {
            // 0. Idempotency guard inside tx (authoritative)
            if (idempotencyKey) {
                await tx.idempotencyKey.create({
                    data: { key: idempotencyKey, action: 'DEPOSIT_TO_WALLET' },
                });
            }

            // 1. Ensure wallet exists inside transaction
            let wallet = await tx.wallet.findUnique({
                where: { userId },
            });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { userId },
                });
            }

            // 2. Append ledger entry (DEPOSIT, positive amount)
            await tx.walletLedger.create({
                data: {
                    walletId: wallet.id,
                    amount: depositAmount,
                    type: WalletTransactionType.DEPOSIT,
                },
            });
        }, { isolationLevel: 'Serializable' });

        // Compute new balance after deposit
        const newBalance = await getWalletBalance(userId);

        return { success: true, balance: newBalance.toFixed(2) };
    } catch (error) {
        console.error('[depositToWallet] Error:', error);
        return { error: 'Failed to deposit to wallet' };
    }
}

// ============================================================================
// Wallet Dashboard Data (Ledger-Derived, No Stored Balances)
// ============================================================================

export interface WalletDashboardData {
    totalBalance: string;
    lockedBalance: string;
    pendingWithdrawals: string;
    availableBalance: string;
    ledgerEntries: {
        id: string;
        type: string;
        amount: string;
        contractId: string | null;
        milestoneId: string | null;
        contractTitle: string | null;
        milestoneTitle: string | null;
        createdAt: string;
    }[];
    hasMore: boolean;
}

/**
 * Returns all wallet dashboard data in one server call.
 * All balances are ledger-derived. No stored balance fields.
 */
export async function getWalletDashboardData(
    offset: number = 0,
    limit: number = 50
): Promise<WalletDashboardData | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const userId = session.user.id;

        const wallet = await db.wallet.findUnique({ where: { userId } });

        if (!wallet) {
            return {
                totalBalance: '0.00',
                lockedBalance: '0.00',
                pendingWithdrawals: '0.00',
                availableBalance: '0.00',
                ledgerEntries: [],
                hasMore: false,
            };
        }

        // Parallel: balances + ledger entries + pending withdrawals
        const [balanceAgg, lockedAgg, pendingAgg, entries] = await Promise.all([
            db.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            }),
            db.escrowLock.aggregate({
                where: {
                    released: false,
                    escrow: {
                        contract: {
                            client: { userId },
                        },
                    },
                },
                _sum: { amount: true },
            }),
            db.withdrawalRequest.aggregate({
                where: { userId, status: 'PENDING' },
                _sum: { amount: true },
            }),
            db.walletLedger.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                take: limit + 1,
                skip: offset,
            }),
        ]);

        const totalBalance = new Prisma.Decimal(balanceAgg._sum.amount ?? 0);
        const lockedBalance = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);
        const pendingWithdrawals = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
        const availableBalance = totalBalance.minus(lockedBalance).minus(pendingWithdrawals);

        const hasMore = entries.length > limit;
        const sliced = entries.slice(0, limit);

        // Bulk lookup contract + milestone titles
        const contractIds = [...new Set(sliced.map(e => e.contractId).filter(Boolean))] as string[];
        const milestoneIds = [...new Set(sliced.map(e => e.milestoneId).filter(Boolean))] as string[];

        const [contracts, milestones] = await Promise.all([
            contractIds.length > 0
                ? db.contract.findMany({ where: { id: { in: contractIds } }, select: { id: true, title: true } })
                : [],
            milestoneIds.length > 0
                ? db.milestone.findMany({ where: { id: { in: milestoneIds } }, select: { id: true, title: true } })
                : [],
        ]);

        const contractMap = new Map(contracts.map(c => [c.id, c.title]));
        const milestoneMap = new Map(milestones.map(m => [m.id, m.title]));

        const ledgerEntries = sliced.map(e => ({
            id: e.id,
            type: e.type,
            amount: new Prisma.Decimal(e.amount).toFixed(2),
            contractId: e.contractId,
            milestoneId: e.milestoneId,
            contractTitle: e.contractId ? contractMap.get(e.contractId) ?? null : null,
            milestoneTitle: e.milestoneId ? milestoneMap.get(e.milestoneId) ?? null : null,
            createdAt: e.createdAt.toISOString(),
        }));

        return {
            totalBalance: totalBalance.toFixed(2),
            lockedBalance: lockedBalance.toFixed(2),
            pendingWithdrawals: pendingWithdrawals.toFixed(2),
            availableBalance: availableBalance.toFixed(2),
            ledgerEntries,
            hasMore,
        };
    } catch (error) {
        console.error('[getWalletDashboardData] Error:', error);
        return { error: 'Failed to load wallet data' };
    }
}

