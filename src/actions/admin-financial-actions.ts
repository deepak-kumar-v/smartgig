'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Admin Financial Overview — Read-Only Platform Stats (Ledger-Derived)
// ============================================================================

export interface RevenueByMonth {
    month: string; // YYYY-MM
    total: string;
}

export interface RevenueByContract {
    contractId: string;
    contractTitle: string;
    total: string;
}

export interface PlatformFinancialOverview {
    volumeByType: { type: string; total: string }[];
    totalLocked: string;
    totalReleased: string;
    totalRefunded: string;
    totalPlatformRevenue: string;
    revenueByMonth: RevenueByMonth[];
    revenueByContract: RevenueByContract[];
    activeEscrowCount: number;
    completedContractCount: number;
}

/**
 * Returns platform-wide financial overview, all values ledger-derived.
 * Admin-only, read-only.
 */
export async function getAdminFinancialOverview(): Promise<PlatformFinancialOverview | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return { error: 'Admin only' };
        }

        const [
            volumeByType,
            lockedAgg,
            releasedAgg,
            refundAgg,
            platformRevenueAgg,
            platformFeeEntries,
            activeEscrows,
            completedContracts,
        ] = await Promise.all([
            // Volume grouped by transaction type
            db.walletLedger.groupBy({
                by: ['type'],
                _sum: { amount: true },
            }),
            // Total locked (unreleased escrow locks)
            db.escrowLock.aggregate({
                where: { released: false },
                _sum: { amount: true },
            }),
            // Total released (released escrow locks)
            db.escrowLock.aggregate({
                where: { released: true },
                _sum: { amount: true },
            }),
            // Total refunded
            db.walletLedger.aggregate({
                where: { type: WalletTransactionType.REFUND },
                _sum: { amount: true },
            }),
            // Total platform revenue (SUM of PLATFORM_FEE)
            db.walletLedger.aggregate({
                where: { type: WalletTransactionType.PLATFORM_FEE },
                _sum: { amount: true },
            }),
            // Individual PLATFORM_FEE entries for month/contract breakdown
            db.walletLedger.findMany({
                where: { type: WalletTransactionType.PLATFORM_FEE },
                select: {
                    amount: true,
                    contractId: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 1000,
            }),
            // Active escrow accounts
            db.escrowAccount.count({
                where: { status: 'FUNDED' },
            }),
            // Completed contracts
            db.contract.count({
                where: { status: 'COMPLETED' },
            }),
        ]);

        // ── Revenue by month (aggregated from individual entries) ──
        const monthMap = new Map<string, Prisma.Decimal>();
        for (const entry of platformFeeEntries) {
            const month = entry.createdAt.toISOString().substring(0, 7); // YYYY-MM
            const current = monthMap.get(month) ?? new Prisma.Decimal(0);
            monthMap.set(month, current.plus(new Prisma.Decimal(entry.amount)));
        }
        const revenueByMonth: RevenueByMonth[] = Array.from(monthMap.entries())
            .sort(([a], [b]) => b.localeCompare(a)) // newest first
            .map(([month, total]) => ({ month, total: total.toFixed(2) }));

        // ── Revenue by contract (aggregated from individual entries) ──
        const contractMap = new Map<string, Prisma.Decimal>();
        for (const entry of platformFeeEntries) {
            if (!entry.contractId) continue;
            const current = contractMap.get(entry.contractId) ?? new Prisma.Decimal(0);
            contractMap.set(entry.contractId, current.plus(new Prisma.Decimal(entry.amount)));
        }

        // Fetch contract titles
        const contractIds = Array.from(contractMap.keys());
        const contracts = contractIds.length > 0
            ? await db.contract.findMany({
                where: { id: { in: contractIds } },
                select: { id: true, title: true },
            })
            : [];
        const titleMap = new Map(contracts.map(c => [c.id, c.title]));

        const revenueByContract: RevenueByContract[] = Array.from(contractMap.entries())
            .sort(([, a], [, b]) => b.minus(a).toNumber()) // highest revenue first
            .map(([contractId, total]) => ({
                contractId,
                contractTitle: titleMap.get(contractId) ?? 'Unknown',
                total: total.toFixed(2),
            }));

        return {
            volumeByType: volumeByType.map(v => ({
                type: v.type,
                total: new Prisma.Decimal(v._sum.amount ?? 0).toFixed(2),
            })),
            totalLocked: new Prisma.Decimal(lockedAgg._sum.amount ?? 0).toFixed(2),
            totalReleased: new Prisma.Decimal(releasedAgg._sum.amount ?? 0).toFixed(2),
            totalRefunded: new Prisma.Decimal(refundAgg._sum.amount ?? 0).toFixed(2),
            totalPlatformRevenue: new Prisma.Decimal(platformRevenueAgg._sum.amount ?? 0).toFixed(2),
            revenueByMonth,
            revenueByContract,
            activeEscrowCount: activeEscrows,
            completedContractCount: completedContracts,
        };
    } catch (error) {
        console.error('[getAdminFinancialOverview] Error:', error);
        return { error: 'Failed to load financial overview' };
    }
}
