/**
 * One-time data correction script.
 *
 * Finds FULL (STANDARD) contracts incorrectly marked as COMPLETED
 * while they still have milestones that are not PAID.
 * Reverts their status to ACTIVE.
 *
 * Safe to run multiple times — only affects contracts matching the criteria.
 * Does NOT touch wallet, escrow, ledger, or financial logs.
 *
 * Usage:
 *   npx tsx scripts/fix-broken-contract-status.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    console.log('=== Fix Broken Contract Status ===\n');

    // Find FULL contracts marked COMPLETED that still have unpaid milestones
    const brokenContracts = await db.contract.findMany({
        where: {
            type: 'FULL',
            status: 'COMPLETED',
            milestones: {
                some: {
                    status: { not: 'PAID' },
                },
            },
        },
        include: {
            milestones: {
                select: { id: true, title: true, status: true },
                orderBy: { id: 'asc' },
            },
        },
    });

    if (brokenContracts.length === 0) {
        console.log('No broken contracts found. Nothing to fix.');
        return;
    }

    console.log(`Found ${brokenContracts.length} broken contract(s):\n`);

    for (const contract of brokenContracts) {
        const paid = contract.milestones.filter(m => m.status === 'PAID').length;
        const total = contract.milestones.length;
        console.log(`  Contract: ${contract.id}`);
        console.log(`    Title:  ${contract.title}`);
        console.log(`    Milestones: ${paid}/${total} PAID`);
        contract.milestones.forEach((m, i) => {
            console.log(`      #${i + 1} [${m.status}] ${m.title}`);
        });
        console.log();
    }

    // Batch update all broken contracts back to ACTIVE
    const result = await db.contract.updateMany({
        where: {
            id: { in: brokenContracts.map(c => c.id) },
        },
        data: {
            status: 'ACTIVE',
        },
    });

    console.log(`\n✅ Corrected ${result.count} contract(s) → ACTIVE`);
}

main()
    .catch((err) => {
        console.error('Script failed:', err);
        process.exit(1);
    })
    .finally(() => db.$disconnect());
