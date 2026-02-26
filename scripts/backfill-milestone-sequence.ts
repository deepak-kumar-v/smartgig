/**
 * Backfill milestone.sequence for all existing milestones.
 * Assigns sequence = 1,2,3... based on current id ASC order per contract.
 * Run ONCE after adding nullable sequence field.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const contracts = await prisma.contract.findMany({
        select: { id: true },
    });

    console.log(`Found ${contracts.length} contracts to process.`);
    let updated = 0;
    let skipped = 0;

    for (const contract of contracts) {
        const milestones = await prisma.milestone.findMany({
            where: { contractId: contract.id },
            orderBy: { id: 'asc' },
            select: { id: true, sequence: true },
        });

        if (milestones.length === 0) continue;

        // Check if already backfilled
        if (milestones.every(m => m.sequence !== null)) {
            skipped++;
            continue;
        }

        await prisma.$transaction(
            milestones.map((m, idx) =>
                prisma.milestone.update({
                    where: { id: m.id },
                    data: { sequence: idx + 1 },
                })
            )
        );

        updated++;
        console.log(`  Contract ${contract.id}: assigned sequences 1..${milestones.length}`);
    }

    console.log(`\nDone. Updated: ${updated}, Skipped (already backfilled): ${skipped}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
