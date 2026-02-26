/**
 * ESCROW INTEGRITY DIAGNOSTIC & REPAIR
 *
 * Investigates and repairs escrow accounting corruption for TRIAL contracts.
 *
 * Run: npx tsx scripts/repair-escrow-integrity.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('');
    console.log('========================================');
    console.log('ESCROW INTEGRITY DIAGNOSTIC & REPAIR');
    console.log('========================================');
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 1 — QUERY ALL DATA
    // ═══════════════════════════════════════════════════════════════

    console.log('━━━ STEP 1: DATA QUERY ━━━');
    console.log('');

    // 1a. All contracts with escrow data
    const contracts = await prisma.contract.findMany({
        include: {
            milestones: true,
            escrowAccount: { include: { locks: true } },
            client: { include: { user: { select: { id: true } } } },
        },
    });

    let totalViolations = 0;

    for (const contract of contracts) {
        const escrowAccounts = contract.escrowAccount ? [contract.escrowAccount] : [];
        const allLocks = escrowAccounts.flatMap(e => e.locks);

        // Skip contracts with no escrow activity
        if (escrowAccounts.length === 0 && allLocks.length === 0) continue;

        console.log(`── Contract: ${contract.id} (${contract.type}) ──`);
        console.log(`   Status: ${contract.status}`);
        console.log(`   Milestones: ${contract.milestones.length}`);

        // 1b. EscrowAccounts
        for (const ea of escrowAccounts) {
            console.log(`   EscrowAccount: ${ea.id} | status=${ea.status} | created=${ea.createdAt.toISOString()}`);
        }

        // 1c. EscrowLocks
        for (const lock of allLocks) {
            console.log(`   EscrowLock: ${lock.id} | milestoneId=${lock.milestoneId} | amount=${lock.amount} | released=${lock.released} | created=${lock.createdAt.toISOString()}`);
        }

        // 1d. WalletLedger entries for this contract's milestones
        const milestoneIds = contract.milestones.map(m => m.id);
        const ledgerEntries = await prisma.walletLedger.findMany({
            where: { milestoneId: { in: milestoneIds } },
            orderBy: { createdAt: 'asc' },
        });

        for (const le of ledgerEntries) {
            console.log(`   WalletLedger: ${le.id} | type=${le.type} | amount=${le.amount} | milestoneId=${le.milestoneId} | walletId=${le.walletId} | created=${le.createdAt.toISOString()}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2 — VALIDATE INVARIANTS
        // ═══════════════════════════════════════════════════════════════

        const violations: string[] = [];

        // 2a. Only ONE EscrowAccount per contract (enforced by schema @unique)
        // Since schema enforces this, there can only be 0 or 1. Check anyway.
        if (escrowAccounts.length > 1) {
            violations.push(`Multiple EscrowAccounts found: ${escrowAccounts.length}`);
        }

        // 2b. Only ONE EscrowLock per milestone
        const locksByMilestone = new Map<string, typeof allLocks>();
        for (const lock of allLocks) {
            const existing = locksByMilestone.get(lock.milestoneId) ?? [];
            existing.push(lock);
            locksByMilestone.set(lock.milestoneId, existing);
        }

        for (const [msId, locks] of locksByMilestone) {
            if (locks.length > 1) {
                violations.push(`Milestone ${msId} has ${locks.length} EscrowLocks (expected 1)`);
            }
        }

        // 2c. Each lock amount must match milestone amount
        for (const ms of contract.milestones) {
            const msLocks = locksByMilestone.get(ms.id) ?? [];
            const lockTotal = msLocks.reduce((sum, l) => sum.plus(l.amount), new Prisma.Decimal(0));
            const msAmount = new Prisma.Decimal(ms.amount);

            if (msLocks.length > 0 && !lockTotal.equals(msAmount)) {
                violations.push(`Milestone ${ms.id} (${ms.title}): lock total ${lockTotal.toFixed(2)} ≠ milestone amount ${msAmount.toFixed(2)}`);
            }
        }

        // 2d. ESCROW_LOCK ledger entries must match lock amounts
        const lockLedger = ledgerEntries.filter(e => e.type === 'ESCROW_LOCK');
        const lockLedgerTotal = lockLedger.reduce((sum, e) => sum.plus(new Prisma.Decimal(e.amount).abs()), new Prisma.Decimal(0));
        const unreleasedLockTotal = allLocks
            .filter(l => !l.released)
            .reduce((sum, l) => sum.plus(l.amount), new Prisma.Decimal(0));

        if (lockLedger.length > allLocks.length) {
            violations.push(`More ESCROW_LOCK ledger entries (${lockLedger.length}) than EscrowLocks (${allLocks.length}) — possible duplicates`);
        }

        // 2e. For trial: total locked should equal single milestone amount
        if (contract.type === 'TRIAL' && contract.milestones.length === 1) {
            const expectedAmount = new Prisma.Decimal(contract.milestones[0].amount);
            if (lockLedgerTotal.greaterThan(expectedAmount)) {
                violations.push(`TRIAL: Ledger shows ${lockLedgerTotal.toFixed(2)} locked but milestone is only ${expectedAmount.toFixed(2)} — OVER-LOCKED`);
            }
        }

        if (violations.length > 0) {
            totalViolations += violations.length;
            console.log('');
            console.log('   ⚠️  VIOLATIONS:');
            for (const v of violations) {
                console.log(`     ✗ ${v}`);
            }
        } else {
            console.log('   ✓ All invariants valid');
        }

        console.log('');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3 — REPAIR
    // ═══════════════════════════════════════════════════════════════

    if (totalViolations === 0) {
        console.log('━━━ NO VIOLATIONS FOUND — No repair needed ━━━');
    } else {
        console.log('━━━ STEP 3: REPAIRING VIOLATIONS ━━━');
        console.log('');

        for (const contract of contracts) {
            if (!contract.escrowAccount) continue;

            const allLocks = contract.escrowAccount.locks;
            const milestoneIds = contract.milestones.map(m => m.id);

            // 3a. Remove duplicate EscrowLocks per milestone (keep earliest)
            // Note: @@unique([escrowId, milestoneId]) prevents this at DB level,
            // but there could be locks from different (now deleted) escrow accounts.

            // 3b. Remove orphan ESCROW_LOCK ledger entries (more entries than locks)
            for (const ms of contract.milestones) {
                const msLocks = allLocks.filter(l => l.milestoneId === ms.id);
                const msLedger = await prisma.walletLedger.findMany({
                    where: { milestoneId: ms.id, type: 'ESCROW_LOCK' },
                    orderBy: { createdAt: 'asc' },
                });

                if (msLedger.length > msLocks.length) {
                    // Keep first N entries (matching lock count), delete rest
                    const orphanLedger = msLedger.slice(msLocks.length);
                    console.log(`   Deleting ${orphanLedger.length} orphan ESCROW_LOCK ledger entries for milestone ${ms.id} (${ms.title})`);

                    for (const orphan of orphanLedger) {
                        await prisma.walletLedger.delete({ where: { id: orphan.id } });
                        console.log(`     Deleted ledger entry ${orphan.id} (amount: ${orphan.amount})`);
                    }
                }

                // If lock amount doesn't match milestone amount, fix the lock
                if (msLocks.length === 1) {
                    const lock = msLocks[0];
                    const msAmount = new Prisma.Decimal(ms.amount);
                    const lockAmount = new Prisma.Decimal(lock.amount);

                    if (!lockAmount.equals(msAmount)) {
                        console.log(`   Fixing EscrowLock ${lock.id}: ${lockAmount.toFixed(2)} → ${msAmount.toFixed(2)}`);
                        await prisma.escrowLock.update({
                            where: { id: lock.id },
                            data: { amount: msAmount },
                        });
                    }
                }
            }

            // 3c. Fix ledger amounts to match corrected locks
            for (const ms of contract.milestones) {
                const msLocks = allLocks.filter(l => l.milestoneId === ms.id);
                if (msLocks.length !== 1) continue;

                const correctedAmount = new Prisma.Decimal(ms.amount);
                const remainingLedger = await prisma.walletLedger.findMany({
                    where: { milestoneId: ms.id, type: 'ESCROW_LOCK' },
                });

                if (remainingLedger.length === 1) {
                    const entry = remainingLedger[0];
                    const entryAmount = new Prisma.Decimal(entry.amount).abs();

                    if (!entryAmount.equals(correctedAmount)) {
                        console.log(`   Fixing ESCROW_LOCK ledger ${entry.id}: ${entry.amount} → -${correctedAmount.toFixed(2)}`);
                        await prisma.walletLedger.update({
                            where: { id: entry.id },
                            data: { amount: correctedAmount.negated() },
                        });
                    }
                }
            }
        }

        // 3d. Recalculate wallet totals
        console.log('');
        console.log('   Recalculating wallet balances...');
        const wallets = await prisma.wallet.findMany({ select: { id: true, userId: true } });

        for (const wallet of wallets) {
            const agg = await prisma.walletLedger.aggregate({
                where: { walletId: wallet.id },
                _sum: { amount: true },
            });
            const derivedTotal = new Prisma.Decimal(agg._sum?.amount ?? 0);
            console.log(`   Wallet ${wallet.id} (user ${wallet.userId}): derived balance = $${derivedTotal.toFixed(2)}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4 — RE-VALIDATE
    // ═══════════════════════════════════════════════════════════════

    console.log('');
    console.log('━━━ POST-REPAIR VALIDATION ━━━');

    let postViolations = 0;

    for (const contract of contracts) {
        if (!contract.escrowAccount) continue;

        const freshEscrow = await prisma.escrowAccount.findUnique({
            where: { id: contract.escrowAccount.id },
            include: { locks: true },
        });
        if (!freshEscrow) continue;

        for (const ms of contract.milestones) {
            const locks = freshEscrow.locks.filter(l => l.milestoneId === ms.id);
            const ledger = await prisma.walletLedger.findMany({
                where: { milestoneId: ms.id, type: 'ESCROW_LOCK' },
            });

            if (locks.length > 1) {
                console.log(`   ✗ Milestone ${ms.id} still has ${locks.length} locks`);
                postViolations++;
            }
            if (ledger.length > 1) {
                console.log(`   ✗ Milestone ${ms.id} still has ${ledger.length} ESCROW_LOCK ledger entries`);
                postViolations++;
            }
            if (locks.length === 1 && ledger.length === 1) {
                const lockAmt = new Prisma.Decimal(locks[0].amount);
                const ledgerAmt = new Prisma.Decimal(ledger[0].amount).abs();
                const msAmt = new Prisma.Decimal(ms.amount);

                if (!lockAmt.equals(msAmt)) {
                    console.log(`   ✗ Lock amount ${lockAmt} ≠ milestone amount ${msAmt}`);
                    postViolations++;
                }
                if (!ledgerAmt.equals(msAmt)) {
                    console.log(`   ✗ Ledger amount ${ledgerAmt} ≠ milestone amount ${msAmt}`);
                    postViolations++;
                }
            }
        }
    }

    if (postViolations === 0) {
        console.log('   ✓ All post-repair invariants valid');
    } else {
        console.log(`   ✗ ${postViolations} violations remain — manual intervention needed`);
    }

    console.log('');
    console.log('========================================');
    console.log('DIAGNOSTIC COMPLETE');
    console.log('========================================');
    console.log('');

    await prisma.$disconnect();
}

run().catch(async (err) => {
    console.error('[Escrow Repair] Error:', err);
    await prisma.$disconnect();
    process.exit(1);
});
