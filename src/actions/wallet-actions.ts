'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { emitDataUpdated } from '@/lib/emit-data-updated';

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
    const [ledgerTotal, lockedBalance, pendingAgg] = await Promise.all([
        // Source of truth: SUM of ALL ledger entries (deposits positive, locks negative)
        (async () => {
            const wallet = await db.wallet.findUnique({ where: { userId } });
            if (!wallet) return new Prisma.Decimal(0);
            const result = await db.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });
            return new Prisma.Decimal(result._sum.amount ?? 0);
        })(),
        getLockedBalance(userId),
        db.withdrawalRequest.aggregate({
            where: { userId, status: 'PENDING' },
            _sum: { amount: true },
        }),
    ]);

    const pendingWithdrawals = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
    // Available = ledger total - pending withdrawals
    // Ledger already contains ESCROW_LOCK debits as negative entries.
    const rawAvailable = ledgerTotal.minus(pendingWithdrawals);

    // Financial integrity guard
    if (rawAvailable.isNegative()) {
        console.error(`[FINANCIAL INTEGRITY] Negative available balance for user ${userId}: ledgerTotal=${ledgerTotal}, locked=${lockedBalance}, pending=${pendingWithdrawals}, raw=${rawAvailable}`);
    }

    const availableBalance = rawAvailable.isNegative() ? new Prisma.Decimal(0) : rawAvailable;

    console.log(`[Wallet Audit] userId=${userId} | ledgerTotal=${ledgerTotal.toFixed(2)} | locked=${lockedBalance.toFixed(2)} | pending=${pendingWithdrawals.toFixed(2)} | available=${availableBalance.toFixed(2)}`);

    return {
        totalBalance: ledgerTotal,
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

            // Mutation log (append-only, inside tx)
            await tx.financialMutationLog.create({
                data: {
                    action: 'DEPOSIT_TO_WALLET',
                    userId,
                    metadata: { amount: depositAmount.toFixed(2) },
                },
            });
        }, { isolationLevel: 'Serializable' });

        // Compute new balance after deposit
        const newBalance = await getWalletBalance(userId);

        revalidatePath('/client/wallet');
        revalidatePath('/client/wallet/deposit');
        revalidatePath('/freelancer/wallet');
        revalidatePath('/freelancer/wallet/withdraw');

        emitDataUpdated();

        return { success: true, balance: newBalance.toFixed(2) };
    } catch (error) {
        db.financialErrorLog.create({
            data: {
                action: 'DEPOSIT_TO_WALLET',
                userId: undefined,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack ?? null : null,
            },
        }).catch(() => { });
        return { error: error instanceof Error ? error.message : 'Financial operation failed' };
    }
}

// ============================================================================
// Wallet Dashboard Data (Ledger-Derived, No Stored Balances)
// ============================================================================

export interface WalletDashboardData {
    lockedBalance: string;
    pendingWithdrawals: string;
    availableBalance: string;
    ledgerEntries: {
        id: string;
        type: string;
        amount: string;
        runningBalance: string;
        contractId: string | null;
        milestoneId: string | null;
        contractTitle: string | null;
        milestoneTitle: string | null;
        createdAt: string;
    }[];
}

/**
 * Returns all wallet dashboard data in one server call.
 * ALL ledger entries fetched — no pagination, no truncation.
 * Running balance reconstructed from zero (ASC), then reversed for display (top=latest).
 */
export async function getWalletDashboardData(): Promise<WalletDashboardData | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const userId = session.user.id;

        const wallet = await db.wallet.findUnique({ where: { userId } });

        if (!wallet) {
            return {
                lockedBalance: '0.00',
                pendingWithdrawals: '0.00',
                availableBalance: '0.00',
                ledgerEntries: [],
            };
        }

        // ── Parallel: source-of-truth aggregates + ALL ledger entries (ASC) ──
        const [ledgerTotalAgg, lockedAgg, pendingAgg, allEntries] = await Promise.all([
            // SUM of ALL ledger entries — the single source of truth for wallet total
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
            // ALL entries, ASC order — mandatory for balance reconstruction
            db.walletLedger.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        const ledgerTotal = new Prisma.Decimal(ledgerTotalAgg._sum.amount ?? 0);
        const lockedBalance = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);
        const pendingWithdrawals = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);

        // Available = ledger total - pending withdrawals
        // Ledger already contains ESCROW_LOCK debits as negative entries.
        // Do NOT subtract lockedBalance — that would double-count.
        const rawAvailable = ledgerTotal.minus(pendingWithdrawals);
        if (rawAvailable.isNegative()) {
            console.error(`[FINANCIAL INTEGRITY] Negative available balance: ledgerTotal=${ledgerTotal}, locked=${lockedBalance}, pending=${pendingWithdrawals}, raw=${rawAvailable}`);
        }
        const availableBalance = rawAvailable.isNegative() ? new Prisma.Decimal(0) : rawAvailable;

        // ── Reconstruct running balance from zero (ASC order) ──
        let running = new Prisma.Decimal(0);
        const computedEntries = allEntries.map(e => {
            running = running.plus(e.amount);
            return { ...e, runningBalance: running };
        });

        // ── Financial invariant check ──
        // Running balance after last entry must equal the aggregate ledger total
        const totalFromLedger = running;
        if (!totalFromLedger.equals(ledgerTotal)) {
            console.error(`[FINANCIAL INTEGRITY ERROR] Ledger running sum (${totalFromLedger.toFixed(2)}) != aggregate (${ledgerTotal.toFixed(2)})`);
        }
        console.log(`[Wallet Audit] userId=${userId} | ledgerTotal=${ledgerTotal.toFixed(2)} | locked=${lockedBalance.toFixed(2)} | pending=${pendingWithdrawals.toFixed(2)} | available=${availableBalance.toFixed(2)}`);

        // ── Reverse for display: top = latest ──
        const displayEntries = [...computedEntries].reverse();

        // ── Bulk lookup contract + milestone titles ──
        const contractIds = [...new Set(displayEntries.map(e => e.contractId).filter(Boolean))] as string[];
        const milestoneIds = [...new Set(displayEntries.map(e => e.milestoneId).filter(Boolean))] as string[];

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

        const ledgerEntries = displayEntries.map(e => ({
            id: e.id,
            type: e.type,
            amount: new Prisma.Decimal(e.amount).toFixed(2),
            runningBalance: e.runningBalance.toFixed(2),
            contractId: e.contractId,
            milestoneId: e.milestoneId,
            contractTitle: e.contractId ? contractMap.get(e.contractId) ?? null : null,
            milestoneTitle: e.milestoneId ? milestoneMap.get(e.milestoneId) ?? null : null,
            createdAt: e.createdAt.toISOString(),
        }));

        return {
            lockedBalance: lockedBalance.toFixed(2),
            pendingWithdrawals: pendingWithdrawals.toFixed(2),
            availableBalance: availableBalance.toFixed(2),
            ledgerEntries,
        };
    } catch (error) {
        console.error('[getWalletDashboardData] Error:', error);
        return { error: 'Failed to load wallet data' };
    }
}
