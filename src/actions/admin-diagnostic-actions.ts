'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { assertEscrowIntegrity } from '@/lib/escrow-integrity';

// ============================================================================
// Admin Financial Diagnostics — Read-Only Observability Actions
// ============================================================================

// --- Types ---

export interface EscrowHealthResult {
    totalScanned: number;
    passed: number;
    failed: {
        escrowId: string;
        contractId: string;
        error: string;
    }[];
}

export interface FinancialMutationRow {
    id: string;
    action: string;
    userId: string | null;
    contractId: string | null;
    milestoneId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface FinancialErrorRow {
    id: string;
    action: string;
    userId: string | null;
    contractId: string | null;
    milestoneId: string | null;
    errorMessage: string;
    stackTrace: string | null;
    createdAt: string;
}

export interface WithdrawalSnapshot {
    totalPending: number;
    totalPendingAmount: string;
    oldestPendingAt: string | null;
}

// --- Auth Helper ---

async function requireAdmin(): Promise<string | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    if ((session.user as { role?: string }).role !== 'ADMIN') return null;
    return session.user.id;
}

// --- Escrow Health Scanner (Batched, Bounded) ---

export async function scanEscrowIntegrity(
    limit: number = 200
): Promise<EscrowHealthResult | { error: string }> {
    const adminId = await requireAdmin();
    if (!adminId) return { error: 'Unauthorized. Admin access required.' };

    const escrows = await db.escrowAccount.findMany({
        select: { id: true, contractId: true },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });

    const totalScanned = escrows.length;
    let passed = 0;
    const failed: EscrowHealthResult['failed'] = [];

    for (const escrow of escrows) {
        try {
            await db.$transaction(async (tx) => {
                await assertEscrowIntegrity(tx, escrow.id, escrow.contractId);
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            passed++;
        } catch (err) {
            failed.push({
                escrowId: escrow.id,
                contractId: escrow.contractId,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    return { totalScanned, passed, failed };
}

// --- Recent Mutations (bounded: 50) ---

export async function getRecentFinancialMutations(): Promise<
    { mutations: FinancialMutationRow[] } | { error: string }
> {
    const adminId = await requireAdmin();
    if (!adminId) return { error: 'Unauthorized' };

    const rows = await db.financialMutationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return {
        mutations: rows.map((r) => ({
            id: r.id,
            action: r.action,
            userId: r.userId,
            contractId: r.contractId,
            milestoneId: r.milestoneId,
            metadata: r.metadata as Record<string, unknown>,
            createdAt: r.createdAt.toISOString(),
        })),
    };
}

// --- Recent Errors (bounded: 50) ---

export async function getRecentFinancialErrors(): Promise<
    { errors: FinancialErrorRow[] } | { error: string }
> {
    const adminId = await requireAdmin();
    if (!adminId) return { error: 'Unauthorized' };

    const rows = await db.financialErrorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return {
        errors: rows.map((r) => ({
            id: r.id,
            action: r.action,
            userId: r.userId,
            contractId: r.contractId,
            milestoneId: r.milestoneId,
            errorMessage: r.errorMessage,
            stackTrace: r.stackTrace,
            createdAt: r.createdAt.toISOString(),
        })),
    };
}

// --- Withdrawal Snapshot ---

export async function getWithdrawalSnapshot(): Promise<
    WithdrawalSnapshot | { error: string }
> {
    const adminId = await requireAdmin();
    if (!adminId) return { error: 'Unauthorized' };

    const [countResult, sumResult, oldestResult] = await Promise.all([
        db.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        db.withdrawalRequest.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true },
        }),
        db.withdrawalRequest.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
        }),
    ]);

    return {
        totalPending: countResult,
        totalPendingAmount: new Prisma.Decimal(sumResult._sum.amount ?? 0).toFixed(2),
        oldestPendingAt: oldestResult?.createdAt.toISOString() ?? null,
    };
}
