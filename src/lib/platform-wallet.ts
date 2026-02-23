'use server';

import { db } from '@/lib/db';

// ============================================================================
// Platform Wallet Helper — isSystem-based identity (no email dependency)
//
// INVARIANT: Exactly ONE isSystem=true User may exist platform-wide.
//            Enforced at both application layer (count-check below) and
//            database layer (unique partial index in migration SQL).
// ============================================================================

// Transaction client type
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Resolves the platform (SYSTEM) wallet inside a transaction.
 *
 * Identity is resolved via `isSystem: true` on the User model.
 * Self-healing: creates the SYSTEM user + wallet on first invocation.
 * Duplication guard: throws if more than one isSystem user exists.
 *
 * Must ONLY be called inside db.$transaction.
 */
export async function getPlatformWallet(tx: TxClient) {
    // 1. Count all isSystem users — must be 0 or 1, never >1
    const systemUserCount = await tx.user.count({
        where: { isSystem: true },
    });

    if (systemUserCount > 1) {
        throw new Error(
            `DUPLICATE_SYSTEM_USER: found ${systemUserCount} users with isSystem=true. ` +
            `Platform integrity violated — exactly one SYSTEM user is allowed.`
        );
    }

    // 2. Find existing SYSTEM user
    let systemUser = systemUserCount === 1
        ? await tx.user.findFirst({ where: { isSystem: true } })
        : null;

    // 3. Self-heal: create if none exists
    if (!systemUser) {
        systemUser = await tx.user.create({
            data: {
                name: 'Platform',
                email: `system-${Date.now()}@internal.platform`,
                role: 'SYSTEM',
                isSystem: true,
                isVerified: true,
            },
        });
    }

    // 4. Post-creation guard: verify still exactly one
    const postCount = await tx.user.count({
        where: { isSystem: true },
    });
    if (postCount !== 1) {
        throw new Error(
            `SYSTEM_USER_RACE_CONDITION: expected exactly 1 isSystem user after create, got ${postCount}`
        );
    }

    // 5. Ensure wallet exists
    let wallet = await tx.wallet.findUnique({
        where: { userId: systemUser.id },
    });

    if (!wallet) {
        wallet = await tx.wallet.create({
            data: { userId: systemUser.id },
        });
    }

    return wallet;
}
