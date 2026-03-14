/**
 * Repair Script: Fix Refund Classification
 *
 * The initial backfill incorrectly tagged ALL refunds on settled milestones
 * as DISPUTE_SETTLEMENT. This script corrects the classification using
 * timestamp correlation:
 *
 * Settlement transactions always produce ESCROW_RELEASE, PLATFORM_FEE, and
 * REFUND entries with the SAME createdAt timestamp. Operational refunds
 * occur at different timestamps.
 *
 * Logic:
 *   1. For each milestone with ESCROW_RELEASE, get the release timestamp
 *   2. REFUND rows matching that timestamp → DISPUTE_SETTLEMENT
 *   3. REFUND rows NOT matching that timestamp → OPERATIONAL
 *
 * Usage: npx tsx scripts/repair-refund-classification.ts
 */

import { PrismaClient, WalletTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function run(): Promise<void> {
    console.log('');
    console.log('========================================');
    console.log('Repair: Refund Classification');
    console.log('========================================');
    console.log('');

    let settlementCount = 0;
    let operationalCount = 0;

    await prisma.$transaction(async (tx) => {
        // 1. Find all milestones with ESCROW_RELEASE entries
        const releaseEntries = await tx.walletLedger.findMany({
            where: {
                type: WalletTransactionType.ESCROW_RELEASE,
                milestoneId: { not: null },
            },
            select: { milestoneId: true, createdAt: true },
        });

        // Build map: milestoneId → release timestamp
        const releaseTimestamps = new Map<string, Date>();
        for (const entry of releaseEntries) {
            if (entry.milestoneId) {
                releaseTimestamps.set(entry.milestoneId, entry.createdAt);
            }
        }

        console.log(`  Found ${releaseTimestamps.size} milestones with ESCROW_RELEASE entries`);

        if (releaseTimestamps.size === 0) {
            console.log('  Nothing to repair.');
            return;
        }

        // 2. Get ALL refund rows for these milestones
        const allRefunds = await tx.walletLedger.findMany({
            where: {
                type: WalletTransactionType.REFUND,
                milestoneId: { in: [...releaseTimestamps.keys()] },
            },
            select: { id: true, milestoneId: true, amount: true, createdAt: true, refundReason: true },
        });

        console.log(`  Found ${allRefunds.length} total refund rows on settled milestones`);

        const toSettlement: string[] = [];
        const toOperational: string[] = [];

        for (const refund of allRefunds) {
            if (!refund.milestoneId) continue;

            const releaseTime = releaseTimestamps.get(refund.milestoneId);
            if (!releaseTime) continue;

            // Compare timestamps — settlement refunds share the same createdAt as ESCROW_RELEASE
            const isSettlement = refund.createdAt.getTime() === releaseTime.getTime();

            if (isSettlement) {
                if (refund.refundReason !== 'DISPUTE_SETTLEMENT') {
                    toSettlement.push(refund.id);
                    console.log(`    → DISPUTE_SETTLEMENT: ledger ${refund.id} | ms ${refund.milestoneId} | $${refund.amount} | ${refund.createdAt.toISOString()}`);
                }
            } else {
                if (refund.refundReason !== 'OPERATIONAL') {
                    toOperational.push(refund.id);
                    console.log(`    → OPERATIONAL:        ledger ${refund.id} | ms ${refund.milestoneId} | $${refund.amount} | ${refund.createdAt.toISOString()}`);
                }
            }
        }

        // 3. Apply corrections
        if (toSettlement.length > 0) {
            const result = await tx.walletLedger.updateMany({
                where: { id: { in: toSettlement } },
                data: { refundReason: 'DISPUTE_SETTLEMENT' },
            });
            settlementCount = result.count;
        }

        if (toOperational.length > 0) {
            const result = await tx.walletLedger.updateMany({
                where: { id: { in: toOperational } },
                data: { refundReason: 'OPERATIONAL' },
            });
            operationalCount = result.count;
        }
    });

    console.log('');
    console.log('Repair complete:');
    console.log(`  ${settlementCount} rows → DISPUTE_SETTLEMENT`);
    console.log(`  ${operationalCount} rows → OPERATIONAL`);
    console.log('');
    console.log('Next step: npm run validate:finance');
    console.log('');

    await prisma.$disconnect();
    process.exit(0);
}

run().catch(async (err) => {
    console.error('Repair failed:', err);
    await prisma.$disconnect();
    process.exit(1);
});
