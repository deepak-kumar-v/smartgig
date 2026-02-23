// @ts-nocheck — Completed one-time migration script (ran before commissionRate became non-nullable)
/**
 * Backfill Script: Set commissionRate on all existing contracts.
 *
 * Run AFTER the first migration (with nullable commissionRate).
 * Run BEFORE the second migration (making commissionRate non-nullable).
 *
 * Usage: npx tsx scripts/backfill-commission-rate.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_COMMISSION_RATE = new Prisma.Decimal('0.1000'); // 10%

async function main() {
    console.log('── Backfilling commissionRate on all contracts ──');

    // 1. Ensure SystemConfig has the platformCommissionRate
    const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: 'platformCommissionRate' },
    });

    if (!existingConfig) {
        await prisma.systemConfig.create({
            data: {
                key: 'platformCommissionRate',
                value: DEFAULT_COMMISSION_RATE.toFixed(4),
            },
        });
        console.log(`Created SystemConfig: platformCommissionRate = ${DEFAULT_COMMISSION_RATE.toFixed(4)}`);
    } else {
        console.log(`SystemConfig already exists: platformCommissionRate = ${existingConfig.value}`);
    }

    // 2. Read the configured rate
    const configRow = await prisma.systemConfig.findUnique({
        where: { key: 'platformCommissionRate' },
    });
    const rate = new Prisma.Decimal(configRow!.value);

    // 3. Backfill all contracts with null commissionRate
    const result = await prisma.contract.updateMany({
        where: { commissionRate: null },
        data: { commissionRate: rate },
    });

    console.log(`Backfilled ${result.count} contracts with commissionRate = ${rate.toFixed(4)}`);

    // 4. Verify no nulls remain
    const nullCount = await prisma.contract.count({
        where: { commissionRate: null },
    });
    if (nullCount > 0) {
        throw new Error(`BACKFILL INCOMPLETE: ${nullCount} contracts still have null commissionRate`);
    }

    console.log('✔ All contracts have commissionRate set. Safe to make non-nullable.');
}

main()
    .catch((e) => {
        console.error('BACKFILL FAILED:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
