
import { db } from '@/lib/db';
import { Prisma, WalletTransactionType } from '@prisma/client';

// ============================================================================
// Escrow Integrity Helper — Decimal-Safe, Milestone-Scoped (Wallet-First)
// ============================================================================

// Type for Prisma interactive transaction client
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

interface EscrowLockRow {
    id: string;
    milestoneId: string;
    amount: Prisma.Decimal;
    released: boolean;
}

/**
 * Asserts escrow integrity inside a db.$transaction.
 *
 * Validates:
 *  1. Every EscrowLock amount > 0
 *  2. No duplicate milestoneId within the same escrow
 *  3. Sum of unreleased locks matches:
 *     lockedFromLedger - releasedFromLedger - platformFeeFromLedger - refundedFromLedger
 *
 *     Scoped to the exact milestoneIds belonging to this escrow
 *     (not contractId, to prevent cross-contract contamination).
 *
 *     PLATFORM_FEE is included because commission is derived from released funds.
 *     When a lock is released, outflow = ESCROW_RELEASE + PLATFORM_FEE = original lock amount.
 *
 * All comparisons use Prisma.Decimal methods — no floating point JS arithmetic.
 * All type references use WalletTransactionType enum constants.
 * Throws on violation — rolling back the entire transaction.
 */
export async function assertEscrowIntegrity(
    tx: TxClient,
    escrowId: string,
    _contractId: string, // retained for signature compatibility
): Promise<void> {
    // 1. Fetch all locks for this escrow
    const locks: EscrowLockRow[] = await tx.escrowLock.findMany({
        where: { escrowId },
        select: { id: true, milestoneId: true, amount: true, released: true },
    });

    // 2. Every lock amount must be positive
    for (const lock of locks) {
        if (!new Prisma.Decimal(lock.amount).isPositive()) {
            throw new Error(
                `ESCROW_LOCK_AMOUNT_VIOLATION: lock ${lock.id} has non-positive amount ${lock.amount}`
            );
        }
    }

    // 3. No duplicate milestoneIds
    const milestoneIds = locks.map((l: EscrowLockRow) => l.milestoneId);
    const uniqueIds = new Set(milestoneIds);
    if (uniqueIds.size !== milestoneIds.length) {
        throw new Error(
            `ESCROW_DUPLICATE_LOCK_VIOLATION: duplicate milestoneId in escrow ${escrowId}`
        );
    }

    // 4. Sum of unreleased locks (Decimal arithmetic)
    const unreleasedTotal = locks
        .filter((l: EscrowLockRow) => !l.released)
        .reduce(
            (sum: Prisma.Decimal, l: EscrowLockRow) => sum.plus(l.amount),
            new Prisma.Decimal(0)
        );

    // 5. Scope ledger aggregation to this escrow's milestoneIds only
    //    (prevents cross-contract contamination)
    if (milestoneIds.length === 0) {
        // No locks yet — nothing to cross-check
        return;
    }

    // All aggregations scoped by milestoneId, using WalletTransactionType enum
    const lockLedger = await tx.walletLedger.aggregate({
        where: {
            milestoneId: { in: milestoneIds },
            type: WalletTransactionType.ESCROW_LOCK,
        },
        _sum: { amount: true },
    });

    const releaseLedger = await tx.walletLedger.aggregate({
        where: {
            milestoneId: { in: milestoneIds },
            type: WalletTransactionType.ESCROW_RELEASE,
        },
        _sum: { amount: true },
    });

    const platformFeeLedger = await tx.walletLedger.aggregate({
        where: {
            milestoneId: { in: milestoneIds },
            type: WalletTransactionType.PLATFORM_FEE,
        },
        _sum: { amount: true },
    });

    const refundLedger = await tx.walletLedger.aggregate({
        where: {
            milestoneId: { in: milestoneIds },
            type: WalletTransactionType.REFUND,
        },
        _sum: { amount: true },
    });

    // Lock entries are negative in the ledger — take absolute value
    const lockedFromLedger = new Prisma.Decimal(lockLedger._sum?.amount ?? 0).abs();
    const releasedFromLedger = new Prisma.Decimal(releaseLedger._sum?.amount ?? 0);
    const platformFeeFromLedger = new Prisma.Decimal(platformFeeLedger._sum?.amount ?? 0);
    const refundedFromLedger = new Prisma.Decimal(refundLedger._sum?.amount ?? 0);

    // expectedUnreleased = locked - released - platformFee - refunded
    //
    // Normal release:  ESCROW_RELEASE (freelancerNet) + PLATFORM_FEE (commission) = lockAmount
    // Dispute release: ESCROW_RELEASE (freelancerNet) + PLATFORM_FEE (arbitrationFee) + REFUND (clientRefund) = lockAmount
    // Both patterns produce: locked - totalOutflow = 0
    const expectedUnreleased = lockedFromLedger
        .minus(releasedFromLedger)
        .minus(platformFeeFromLedger)
        .minus(refundedFromLedger);

    // Tolerance: 0.001 (sub-cent, covers any Decimal rounding edge)
    if (!unreleasedTotal.equals(expectedUnreleased)) {
        throw new Error(
            `ESCROW_INTEGRITY_VIOLATION: lock total=${unreleasedTotal}, ` +
            `ledger expected=${expectedUnreleased} (locked=${lockedFromLedger}, ` +
            `released=${releasedFromLedger}, platformFee=${platformFeeFromLedger}, ` +
            `refunded=${refundedFromLedger})`
        );
    }
}
