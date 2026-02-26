'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';

// ============================================================================
// Financial Anomaly Detector — Deterministic, No Heuristics
// ============================================================================

export interface AnomalyResult {
    walletNegative: { walletId: string; userId: string; available: string }[];
    escrowMismatch: { escrowId: string; contractId: string; error: string }[];
    orphanPlatformFees: { milestoneId: string; platformFee: string }[];
    invalidCommissionContracts: { contractId: string; commissionRate: string }[];
    duplicateSystemUsers: number;
}

export async function detectFinancialAnomalies(): Promise<AnomalyResult | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };
    if ((session.user as { role?: string }).role !== 'ADMIN') {
        return { error: 'Unauthorized. Admin access required.' };
    }

    // 1. Wallets with negative available balance
    const wallets = await db.wallet.findMany({
        select: { id: true, userId: true },
        take: 500,
    });

    const walletNegative: AnomalyResult['walletNegative'] = [];

    for (const w of wallets) {
        const ledgerSum = await db.walletLedger.aggregate({
            where: { walletId: w.id },
            _sum: { amount: true },
        });
        const lockedSum = await db.escrowLock.aggregate({
            where: {
                released: false,
                escrow: { contract: { client: { userId: w.userId } } },
            },
            _sum: { amount: true },
        });
        const total = new Prisma.Decimal(ledgerSum._sum.amount ?? 0);
        const locked = new Prisma.Decimal(lockedSum._sum.amount ?? 0);
        const available = total.minus(locked);

        if (available.isNegative()) {
            walletNegative.push({
                walletId: w.id,
                userId: w.userId,
                available: available.toFixed(2),
            });
        }
    }

    // 2. Escrow mismatches (batched, max 200)
    const escrows = await db.escrowAccount.findMany({
        select: { id: true, contractId: true },
        take: 200,
    });

    const escrowMismatch: AnomalyResult['escrowMismatch'] = [];

    for (const escrow of escrows) {
        try {
            await db.$transaction(async (tx) => {
                await assertEscrowIntegrity(tx, escrow.id, escrow.contractId);
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (err) {
            escrowMismatch.push({
                escrowId: escrow.id,
                contractId: escrow.contractId,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    // 3. Orphan PLATFORM_FEE — has PLATFORM_FEE but no matching ESCROW_RELEASE for same milestoneId
    const platformFees = await db.walletLedger.findMany({
        where: { type: WalletTransactionType.PLATFORM_FEE, milestoneId: { not: null } },
        select: { milestoneId: true, amount: true },
        take: 500,
    });

    const orphanPlatformFees: AnomalyResult['orphanPlatformFees'] = [];

    const feeByMilestone = new Map<string, Prisma.Decimal>();
    for (const pf of platformFees) {
        if (!pf.milestoneId) continue;
        const existing = feeByMilestone.get(pf.milestoneId) ?? new Prisma.Decimal(0);
        feeByMilestone.set(pf.milestoneId, existing.plus(pf.amount));
    }

    for (const [mid, feeTotal] of feeByMilestone) {
        const releaseCount = await db.walletLedger.count({
            where: { milestoneId: mid, type: WalletTransactionType.ESCROW_RELEASE },
        });
        if (releaseCount === 0) {
            orphanPlatformFees.push({
                milestoneId: mid,
                platformFee: feeTotal.toFixed(2),
            });
        }
    }

    // 4. Contracts with commissionRate outside [0, 1)
    const contracts = await db.contract.findMany({
        select: { id: true, commissionRate: true },
        take: 1000,
    });

    const invalidCommissionContracts: AnomalyResult['invalidCommissionContracts'] = [];

    for (const c of contracts) {
        const rate = new Prisma.Decimal(c.commissionRate);
        if (rate.isNegative() || rate.greaterThanOrEqualTo(1)) {
            invalidCommissionContracts.push({
                contractId: c.id,
                commissionRate: rate.toFixed(4),
            });
        }
    }

    // 5. Duplicate SYSTEM users
    const systemUserCount = await db.user.count({
        where: { isSystem: true },
    });
    const duplicateSystemUsers = systemUserCount > 1 ? systemUserCount : 0;

    return {
        walletNegative,
        escrowMismatch,
        orphanPlatformFees,
        invalidCommissionContracts,
        duplicateSystemUsers,
    };
}
