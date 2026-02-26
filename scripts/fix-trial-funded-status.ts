/**
 * ONE-TIME CORRECTION: Fix TRIAL contracts stuck in FUNDED status.
 *
 * The legacy fundEscrow() path bulk-funded trial contracts and set them to FUNDED.
 * TRIAL contracts should never reach FUNDED — their lifecycle is:
 *   FINALIZED → ACTIVE → (fund milestone) → IN_PROGRESS → SUBMITTED → PAID → COMPLETED
 *
 * This script:
 * 1. Finds all contracts where type=TRIAL and status=FUNDED
 * 2. Verifies escrow + lock exist (safety check)
 * 3. Updates status to ACTIVE
 * 4. Logs to AuditLog and FinancialMutationLog
 *
 * Run: npx tsx scripts/fix-trial-funded-status.ts
 */

import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('');
    console.log('========================================');
    console.log('FIX TRIAL FUNDED STATUS');
    console.log('========================================');
    console.log('');

    // Find all TRIAL contracts stuck in FUNDED status
    const fundedTrials = await prisma.contract.findMany({
        where: {
            type: 'TRIAL',
            status: ContractStatus.FUNDED,
        },
        include: {
            escrowAccount: { include: { locks: true } },
            client: { include: { user: { select: { id: true, name: true } } } },
            milestones: { select: { id: true, title: true, amount: true, status: true } },
        },
    });

    if (fundedTrials.length === 0) {
        console.log('✓ No TRIAL contracts in FUNDED status. Nothing to fix.');
        await prisma.$disconnect();
        return;
    }

    console.log(`Found ${fundedTrials.length} TRIAL contract(s) in FUNDED status.`);
    console.log('');

    let corrected = 0;
    let skipped = 0;

    for (const contract of fundedTrials) {
        console.log(`── Contract: ${contract.id} ──`);
        console.log(`   Title: ${contract.title}`);
        console.log(`   Client: ${contract.client.user.name} (${contract.client.userId})`);
        console.log(`   Milestones: ${contract.milestones.length}`);

        // Safety: only correct if escrow + lock exist
        if (!contract.escrowAccount) {
            console.log('   ⚠ SKIPPED — No EscrowAccount exists. Manual review needed.');
            skipped++;
            continue;
        }

        if (contract.escrowAccount.locks.length === 0) {
            console.log('   ⚠ SKIPPED — EscrowAccount exists but has no locks. Manual review needed.');
            skipped++;
            continue;
        }

        console.log(`   EscrowAccount: ${contract.escrowAccount.id} (${contract.escrowAccount.status})`);
        console.log(`   Locks: ${contract.escrowAccount.locks.length}`);

        // Perform the correction
        await prisma.$transaction(async (tx) => {
            // 1. Update contract status: FUNDED → ACTIVE
            await tx.contract.update({
                where: { id: contract.id },
                data: { status: ContractStatus.ACTIVE },
            });

            // 2. AuditLog
            await tx.auditLog.create({
                data: {
                    userId: contract.client.userId,
                    actorRole: 'SYSTEM',
                    action: 'TRIAL_STATUS_CORRECTION',
                    entityType: 'CONTRACT',
                    entityId: contract.id,
                    details: {
                        previousStatus: 'FUNDED',
                        newStatus: 'ACTIVE',
                        reason: 'Legacy fundEscrow() set TRIAL contract to FUNDED. Corrected to ACTIVE.',
                        correctedAt: new Date().toISOString(),
                    },
                },
            });

            // 3. FinancialMutationLog
            await tx.financialMutationLog.create({
                data: {
                    action: 'TRIAL_STATUS_CORRECTION',
                    userId: contract.client.userId,
                    contractId: contract.id,
                    metadata: {
                        previousStatus: 'FUNDED',
                        newStatus: 'ACTIVE',
                        escrowAccountId: contract.escrowAccount!.id,
                        lockCount: contract.escrowAccount!.locks.length,
                        reason: 'One-time correction: TRIAL FUNDED → ACTIVE',
                    },
                },
            });
        });

        console.log('   ✓ CORRECTED — FUNDED → ACTIVE');
        corrected++;
        console.log('');
    }

    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`  Total found:  ${fundedTrials.length}`);
    console.log(`  Corrected:    ${corrected}`);
    console.log(`  Skipped:      ${skipped}`);
    console.log('========================================');
    console.log('');

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('[Fix Trial Funded] Error:', err);
    await prisma.$disconnect();
    process.exit(1);
});
