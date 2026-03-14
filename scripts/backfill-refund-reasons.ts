/**
 * One-Time Backfill: Tag Historical Settlement Refunds
 *
 * Finds REFUND ledger rows where refundReason IS NULL and the same milestoneId
 * has an ESCROW_RELEASE entry (indicating it was part of a settlement, not an
 * operational refund). Tags those rows as DISPUTE_SETTLEMENT.
 *
 * Safe: runs in a single Prisma transaction, read-only detection, targeted update.
 *
 * Usage: npx tsx scripts/backfill-refund-reasons.ts
 */

import { PrismaClient, WalletTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function run(): Promise<void> {
    console.log('');
    console.log('========================================');
    console.log('Backfill: Historical Settlement Refunds');
    console.log('========================================');
    console.log('');

    const result = await prisma.$transaction(async (tx) => {
        // 1. Find milestoneIds that have an ESCROW_RELEASE entry
        //    (these milestones went through settlement — normal or dispute)
        const releasedMilestones = await tx.walletLedger.findMany({
            where: { type: WalletTransactionType.ESCROW_RELEASE, milestoneId: { not: null } },
            select: { milestoneId: true },
            distinct: ['milestoneId'],
        });

        const settledMilestoneIds = releasedMilestones
            .map(r => r.milestoneId)
            .filter((id): id is string => id !== null);

        console.log(`  Found ${settledMilestoneIds.length} milestones with ESCROW_RELEASE entries`);

        if (settledMilestoneIds.length === 0) {
            console.log('  No settled milestones found — nothing to backfill.');
            return 0;
        }

        // 2. Find REFUND rows for those milestones where refundReason is NULL
        const refundsToTag = await tx.walletLedger.findMany({
            where: {
                type: WalletTransactionType.REFUND,
                refundReason: null,
                milestoneId: { in: settledMilestoneIds },
            },
            select: { id: true, milestoneId: true, amount: true },
        });

        console.log(`  Found ${refundsToTag.length} NULL-reason refund rows on settled milestones`);

        if (refundsToTag.length === 0) {
            console.log('  Nothing to update.');
            return 0;
        }

        // 3. Update those rows to DISPUTE_SETTLEMENT
        const ids = refundsToTag.map(r => r.id);
        const updateResult = await tx.walletLedger.updateMany({
            where: { id: { in: ids } },
            data: { refundReason: 'DISPUTE_SETTLEMENT' },
        });

        console.log(`  Updated ${updateResult.count} rows → refundReason = DISPUTE_SETTLEMENT`);

        // Log details
        for (const r of refundsToTag) {
            console.log(`    - Ledger ${r.id} | milestone ${r.milestoneId} | amount ${r.amount}`);
        }

        return updateResult.count;
    });

    console.log('');
    console.log(`Backfill complete. ${result} rows updated.`);
    console.log('');
    console.log('Next step: run  npm run validate:finance');
    console.log('');

    await prisma.$disconnect();
    process.exit(0);
}

run().catch(async (err) => {
    console.error('Backfill failed:', err);
    await prisma.$disconnect();
    process.exit(1);
});
