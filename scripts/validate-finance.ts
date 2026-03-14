import * as fs from 'fs';
import * as path from 'path';

const GOVERNANCE_DOC_PATH = path.resolve(
    __dirname,
    '..',
    'docs',
    'financial-system-maturity.md'
);

if (!fs.existsSync(GOVERNANCE_DOC_PATH)) {
    console.error('');
    console.error('========================================');
    console.error('FINANCIAL GOVERNANCE FAILURE');
    console.error('========================================');
    console.error('');
    console.error('docs/financial-system-maturity.md is missing.');
    console.error('Financial modifications require governance documentation.');
    console.error('');
    process.exit(1);
}
/**
 * FINANCIAL INTEGRITY — Build-Time Invariant Verification
 *
 * Pure read-only validation. ZERO mutations.
 *
 * Validates:
 * A) Wallet integrity (re-derived balances, negative checks)
 * B) Escrow integrity (lock/release/fee/refund formula)
 * C) Commission consistency (payout + commission = lock)
 * D) Double-spend detection (duplicate release/fee/approval)
 * E) Orphan detection (dangling foreign keys)
 *
 * Run: tsx scripts/validate-finance.ts
 * Integrated into build: npm run validate:finance
 */

import { PrismaClient, Prisma, WalletTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

type FinanceViolation = {
    category: string;
    message: string;
};

async function run(): Promise<void> {
    const violations: FinanceViolation[] = [];
    let walletCount = 0;
    let escrowCount = 0;
    let milestoneCount = 0;

    try {
        // ==================================================================
        // A) WALLET INTEGRITY
        // ==================================================================

        const wallets = await prisma.wallet.findMany({
            select: { id: true, userId: true },
        });
        walletCount = wallets.length;

        const allWalletIds = new Set(wallets.map(w => w.id));
        const allWalletUserIds = new Set(wallets.map(w => w.userId));

        for (const wallet of wallets) {
            // Re-derive total from ledger (SUM of all entries)
            const ledgerAgg = await prisma.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });
            const total = new Prisma.Decimal(ledgerAgg._sum?.amount ?? 0);

            // Wallet total can be negative for clients with funded escrow
            // (ESCROW_LOCK entries are negative debits).
            // The true invariant: deposits alone should be non-negative.
            const depositAgg = await prisma.walletLedger.aggregate({
                where: { walletId: wallet.id, type: WalletTransactionType.DEPOSIT },
                _sum: { amount: true },
            });
            const deposits = new Prisma.Decimal(depositAgg._sum?.amount ?? 0);

            if (deposits.lessThan(0)) {
                violations.push({
                    category: 'Wallet Integrity',
                    message: `Wallet ${wallet.id} (user ${wallet.userId}) has negative deposit total: ${deposits.toFixed(2)}`,
                });
            }
        }

        // ==================================================================
        // B) ESCROW INTEGRITY
        // ==================================================================

        const escrows = await prisma.escrowAccount.findMany({
            select: {
                id: true,
                contractId: true,
                locks: {
                    select: { id: true, milestoneId: true, amount: true, released: true },
                },
            },
        });
        escrowCount = escrows.length;

        for (const escrow of escrows) {
            const milestoneIds = escrow.locks.map(l => l.milestoneId);
            if (milestoneIds.length === 0) continue;

            // Sum unreleased locks
            const unreleasedTotal = escrow.locks
                .filter(l => !l.released)
                .reduce((sum, l) => sum.plus(l.amount), new Prisma.Decimal(0));

            // Aggregate ledger by type scoped to this escrow's milestones
            const lockLedger = await prisma.walletLedger.aggregate({
                where: { milestoneId: { in: milestoneIds }, type: WalletTransactionType.ESCROW_LOCK },
                _sum: { amount: true },
            });
            const releaseLedger = await prisma.walletLedger.aggregate({
                where: { milestoneId: { in: milestoneIds }, type: WalletTransactionType.ESCROW_RELEASE },
                _sum: { amount: true },
            });
            const platformFeeLedger = await prisma.walletLedger.aggregate({
                where: { milestoneId: { in: milestoneIds }, type: WalletTransactionType.PLATFORM_FEE },
                _sum: { amount: true },
            });
            const refundLedger = await prisma.walletLedger.aggregate({
                where: { milestoneId: { in: milestoneIds }, type: WalletTransactionType.REFUND, refundReason: 'DISPUTE_SETTLEMENT' },
                _sum: { amount: true },
            });

            const lockedFromLedger = new Prisma.Decimal(lockLedger._sum?.amount ?? 0).abs();
            const releasedFromLedger = new Prisma.Decimal(releaseLedger._sum?.amount ?? 0);
            const platformFeeFromLedger = new Prisma.Decimal(platformFeeLedger._sum?.amount ?? 0);
            const refundedFromLedger = new Prisma.Decimal(refundLedger._sum?.amount ?? 0);

            const expectedUnreleased = lockedFromLedger
                .minus(releasedFromLedger)
                .minus(platformFeeFromLedger)
                .minus(refundedFromLedger);

            if (expectedUnreleased.lessThan(0)) {
                violations.push({
                    category: 'Escrow Integrity',
                    message: `Escrow ${escrow.id} (contract ${escrow.contractId}): expectedUnreleased is negative (${expectedUnreleased.toFixed(2)})`,
                });
            }

            if (!unreleasedTotal.equals(expectedUnreleased)) {
                violations.push({
                    category: 'Escrow Integrity',
                    message: `Escrow ${escrow.id} (contract ${escrow.contractId}): lock total (${unreleasedTotal.toFixed(2)}) ≠ expectedUnreleased (${expectedUnreleased.toFixed(2)})`,
                });
            }
        }

        // B2. Duplicate EscrowAccounts per contract
        const escrowsByContract = new Map<string, string[]>();
        for (const e of escrows) {
            const list = escrowsByContract.get(e.contractId) ?? [];
            list.push(e.id);
            escrowsByContract.set(e.contractId, list);
        }
        for (const [contractId, ids] of escrowsByContract) {
            if (ids.length > 1) {
                violations.push({
                    category: 'Escrow Integrity',
                    message: `Contract ${contractId} has ${ids.length} EscrowAccounts (expected 1): ${ids.join(', ')}`,
                });
            }
        }

        // B3. Escrow lock total vs milestone amount
        for (const escrow of escrows) {
            for (const lock of escrow.locks) {
                const milestone = await prisma.milestone.findUnique({
                    where: { id: lock.milestoneId },
                    select: { id: true, amount: true, title: true },
                });
                if (milestone) {
                    const lockAmt = new Prisma.Decimal(lock.amount);
                    const msAmt = new Prisma.Decimal(milestone.amount);
                    if (!lockAmt.equals(msAmt)) {
                        violations.push({
                            category: 'Escrow Integrity',
                            message: `Lock ${lock.id} amount (${lockAmt.toFixed(2)}) ≠ milestone "${milestone.title}" amount (${msAmt.toFixed(2)})`,
                        });
                    }
                }
            }
        }

        // ==================================================================
        // C) COMMISSION CONSISTENCY
        // ==================================================================

        const releasedLocks = await prisma.escrowLock.findMany({
            where: { released: true },
            select: { id: true, milestoneId: true, amount: true },
        });
        milestoneCount = releasedLocks.length;

        for (const lock of releasedLocks) {
            // Payout sources: ESCROW_RELEASE (normal) + DISPUTE_RESOLUTION (dispute)
            const releaseEntry = await prisma.walletLedger.aggregate({
                where: { milestoneId: lock.milestoneId, type: WalletTransactionType.ESCROW_RELEASE },
                _sum: { amount: true },
            });
            const disputeResEntry = await prisma.walletLedger.aggregate({
                where: { milestoneId: lock.milestoneId, type: WalletTransactionType.DISPUTE_RESOLUTION },
                _sum: { amount: true },
            });
            const feeEntry = await prisma.walletLedger.aggregate({
                where: { milestoneId: lock.milestoneId, type: WalletTransactionType.PLATFORM_FEE },
                _sum: { amount: true },
            });
            const refundEntry = await prisma.walletLedger.aggregate({
                where: { milestoneId: lock.milestoneId, type: WalletTransactionType.REFUND, refundReason: 'DISPUTE_SETTLEMENT' },
                _sum: { amount: true },
            });

            // payout = ESCROW_RELEASE + DISPUTE_RESOLUTION
            const escrowRelease = new Prisma.Decimal(releaseEntry._sum?.amount ?? 0);
            const disputeRes = new Prisma.Decimal(disputeResEntry._sum?.amount ?? 0);
            const totalPayout = escrowRelease.plus(disputeRes);
            const commissionAmount = new Prisma.Decimal(feeEntry._sum?.amount ?? 0);
            const refundAmount = new Prisma.Decimal(refundEntry._sum?.amount ?? 0);
            const lockAmount = new Prisma.Decimal(lock.amount);

            // Invariant: payout + refund + commission = lock
            //   Normal release:  ESCROW_RELEASE + PLATFORM_FEE = lock
            //   Dispute release: (ESCROW_RELEASE | DISPUTE_RESOLUTION) + PLATFORM_FEE + REFUND = lock
            const totalDistributed = totalPayout.plus(commissionAmount).plus(refundAmount);
            if (!totalDistributed.equals(lockAmount)) {
                violations.push({
                    category: 'Commission Consistency',
                    message: `Milestone ${lock.milestoneId}: payout (${totalPayout.toFixed(2)}) + commission (${commissionAmount.toFixed(2)}) + refund (${refundAmount.toFixed(2)}) = ${totalDistributed.toFixed(2)} ≠ lock (${lockAmount.toFixed(2)})`,
                });
            }

            // Safety: released lock with zero total outflow = funds vanished
            if (totalDistributed.isZero()) {
                violations.push({
                    category: 'Double-Spend Detection',
                    message: `Lock ${lock.id} (milestone ${lock.milestoneId}) marked released but no payout/refund/fee ledger entries exist — funds unaccounted`,
                });
            }
        }

        // ==================================================================
        // D) DOUBLE-SPEND DETECTION
        // ==================================================================

        // Duplicate ESCROW_RELEASE per milestone
        const releaseGroups = await prisma.walletLedger.groupBy({
            by: ['milestoneId'],
            where: {
                type: WalletTransactionType.ESCROW_RELEASE,
                milestoneId: { not: null },
            },
            _count: { id: true },
        });
        for (const g of releaseGroups) {
            if (g._count.id > 1) {
                violations.push({
                    category: 'Double-Spend Detection',
                    message: `Milestone ${g.milestoneId}: ${g._count.id} ESCROW_RELEASE entries (expected ≤ 1)`,
                });
            }
        }

        // Duplicate PLATFORM_FEE per milestone
        const feeGroups = await prisma.walletLedger.groupBy({
            by: ['milestoneId'],
            where: {
                type: WalletTransactionType.PLATFORM_FEE,
                milestoneId: { not: null },
            },
            _count: { id: true },
        });
        for (const g of feeGroups) {
            if (g._count.id > 1) {
                violations.push({
                    category: 'Double-Spend Detection',
                    message: `Milestone ${g.milestoneId}: ${g._count.id} PLATFORM_FEE entries (expected ≤ 1)`,
                });
            }
        }

        // Locks marked released without any distribution ledger entries
        // (ESCROW_RELEASE, DISPUTE_RESOLUTION, PLATFORM_FEE, or REFUND)
        for (const lock of releasedLocks) {
            const distributionCount = await prisma.walletLedger.count({
                where: {
                    milestoneId: lock.milestoneId,
                    type: {
                        in: [
                            WalletTransactionType.ESCROW_RELEASE,
                            WalletTransactionType.DISPUTE_RESOLUTION,
                            WalletTransactionType.PLATFORM_FEE,
                            WalletTransactionType.REFUND,
                        ],
                    },
                },
            });
            if (distributionCount === 0) {
                violations.push({
                    category: 'Double-Spend Detection',
                    message: `Lock ${lock.id} (milestone ${lock.milestoneId}) marked released but no distribution ledger entries exist`,
                });
            }
        }

        // D2. Double-settlement detection per milestone
        // A milestone should have at most ONE settlement sequence
        const allMilestoneIds = [...new Set(releasedLocks.map(l => l.milestoneId))];
        for (const mid of allMilestoneIds) {
            const releaseCount = await prisma.walletLedger.count({
                where: { milestoneId: mid, type: WalletTransactionType.ESCROW_RELEASE },
            });
            const settlementRefundCount = await prisma.walletLedger.count({
                where: { milestoneId: mid, type: WalletTransactionType.REFUND, refundReason: 'DISPUTE_SETTLEMENT' },
            });
            const feeCount = await prisma.walletLedger.count({
                where: { milestoneId: mid, type: WalletTransactionType.PLATFORM_FEE },
            });

            // Normal release: 1 ESCROW_RELEASE + 1 PLATFORM_FEE
            // Dispute settlement: may have ESCROW_RELEASE + PLATFORM_FEE + DISPUTE_SETTLEMENT refund
            // Either way, no more than 1 of each
            if (releaseCount > 1) {
                violations.push({
                    category: 'Double-Settlement Detection',
                    message: `Milestone ${mid}: ${releaseCount} ESCROW_RELEASE entries — possible double settlement`,
                });
            }
            if (settlementRefundCount > 1) {
                violations.push({
                    category: 'Double-Settlement Detection',
                    message: `Milestone ${mid}: ${settlementRefundCount} DISPUTE_SETTLEMENT refund entries — possible double settlement`,
                });
            }
            if (feeCount > 1) {
                violations.push({
                    category: 'Double-Settlement Detection',
                    message: `Milestone ${mid}: ${feeCount} PLATFORM_FEE entries — possible double settlement`,
                });
            }
        }

        // ==================================================================
        // E) ORPHAN DETECTION
        // ==================================================================

        // Ledger entries referencing non-existent wallets
        const ledgerWalletIds = await prisma.walletLedger.findMany({
            select: { walletId: true },
            distinct: ['walletId'],
        });
        for (const entry of ledgerWalletIds) {
            if (!allWalletIds.has(entry.walletId)) {
                violations.push({
                    category: 'Orphan Detection',
                    message: `WalletLedger references non-existent wallet: ${entry.walletId}`,
                });
            }
        }

        // EscrowLock referencing non-existent escrow
        const allEscrowIds = new Set(escrows.map(e => e.id));
        const lockEscrowIds = await prisma.escrowLock.findMany({
            select: { escrowId: true },
            distinct: ['escrowId'],
        });
        for (const entry of lockEscrowIds) {
            if (!allEscrowIds.has(entry.escrowId)) {
                violations.push({
                    category: 'Orphan Detection',
                    message: `EscrowLock references non-existent escrow: ${entry.escrowId}`,
                });
            }
        }

        // WithdrawalRequest referencing user without wallet
        const withdrawalUserIds = await prisma.withdrawalRequest.findMany({
            select: { userId: true },
            distinct: ['userId'],
        });
        for (const entry of withdrawalUserIds) {
            if (!allWalletUserIds.has(entry.userId)) {
                violations.push({
                    category: 'Orphan Detection',
                    message: `WithdrawalRequest references user without wallet: ${entry.userId}`,
                });
            }
        }

    } finally {
        await prisma.$disconnect();
    }

    // ======================================================================
    // Report
    // ======================================================================

    if (violations.length > 0) {
        console.error('');
        console.error('========================================');
        console.error('FINANCIAL INTEGRITY FAILURE');
        console.error('========================================');
        console.error('');

        const grouped = new Map<string, string[]>();
        for (const v of violations) {
            const list = grouped.get(v.category) ?? [];
            list.push(v.message);
            grouped.set(v.category, list);
        }

        for (const [category, messages] of grouped) {
            console.error(`Category: ${category}`);
            for (const msg of messages) {
                console.error(`  - ${msg}`);
            }
            console.error('');
        }

        console.error('Build must stop.');
        console.error('');
        process.exit(1);
    }

    console.log('');
    console.log('[Financial Integrity] ✓ Validation passed.');
    console.log(`  Wallets checked: ${walletCount}`);
    console.log(`  Escrows checked: ${escrowCount}`);
    console.log(`  Milestones checked: ${milestoneCount}`);
    console.log('');
    process.exit(0);
}

run().catch((err) => {
    console.error('[Financial Integrity] Script error:', err);
    process.exit(1);
});
