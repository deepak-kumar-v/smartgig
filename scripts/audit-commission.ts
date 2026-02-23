// Diagnostic script for commission audit
// Run with: npx tsx scripts/audit-commission.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    console.log('=== COMMISSION DISTRIBUTION AUDIT ===\n');

    // 1. Check SystemConfig
    const config = await db.systemConfig.findUnique({
        where: { key: 'platformCommissionRate' },
    });
    console.log('SystemConfig platformCommissionRate:', config?.value ?? 'NOT FOUND');

    // 2. Check all contracts with commissionRate
    const contracts = await db.contract.findMany({
        select: {
            id: true,
            title: true,
            status: true,
            commissionRate: true,
            type: true,
        },
        orderBy: { id: 'desc' },
    });

    console.log(`\nContracts (${contracts.length} total):`);
    for (const c of contracts) {
        console.log(`  [${c.status}] ${c.title} | commissionRate=${c.commissionRate} | type=${c.type} | id=${c.id}`);
    }

    // 3. Check all PLATFORM_FEE ledger entries
    const platformFees = await db.walletLedger.findMany({
        where: { type: 'PLATFORM_FEE' },
        select: { id: true, amount: true, contractId: true, milestoneId: true, createdAt: true },
    });
    console.log(`\nPLATFORM_FEE ledger entries: ${platformFees.length}`);
    for (const f of platformFees) {
        console.log(`  amount=${f.amount} contractId=${f.contractId} milestoneId=${f.milestoneId}`);
    }

    // 4. Check all ESCROW_RELEASE entries
    const releases = await db.walletLedger.findMany({
        where: { type: 'ESCROW_RELEASE' },
        select: { id: true, amount: true, contractId: true, milestoneId: true, createdAt: true },
    });
    console.log(`\nESCROW_RELEASE ledger entries: ${releases.length}`);
    for (const r of releases) {
        console.log(`  amount=${r.amount} contractId=${r.contractId} milestoneId=${r.milestoneId}`);
    }

    // 5. Check all released EscrowLocks
    const releasedLocks = await db.escrowLock.findMany({
        where: { released: true },
        select: { id: true, amount: true, milestoneId: true, escrow: { select: { contractId: true } } },
    });
    console.log(`\nReleased EscrowLocks: ${releasedLocks.length}`);
    for (const l of releasedLocks) {
        console.log(`  lockAmount=${l.amount} milestoneId=${l.milestoneId} contractId=${l.escrow.contractId}`);
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
