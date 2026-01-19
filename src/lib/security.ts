import { db } from '@/lib/db';

export async function checkDeviceBan(deviceHash: string) {
    // Find all users who have used this device
    const usersOnDevice = await db.deviceFingerprint.findMany({
        where: { deviceHash },
        include: {
            user: {
                include: {
                    strikes: {
                        where: { expiresAt: { gt: new Date() } }
                    }
                }
            }
        }
    });

    // Check if any of these users are banned (e.g., > 4 active strikes or trust score <= 0)
    for (const record of usersOnDevice) {
        const activeStrikes = record.user.strikes.length;
        if (activeStrikes >= 5 || record.user.trustScore <= 0) {
            return {
                banned: true,
                reason: `This device is associated with a banned account (${record.user.email}).`
            };
        }
    }

    return { banned: false };
}

export async function recordDevice(userId: string, deviceHash: string, ipHash: string) {
    // Check if fingerprint exists for this user
    const existing = await db.deviceFingerprint.findFirst({
        where: { userId, deviceHash }
    });

    if (existing) {
        await db.deviceFingerprint.update({
            where: { id: existing.id },
            data: { lastSeen: new Date(), ipHash }
        });
    } else {
        await db.deviceFingerprint.create({
            data: {
                userId,
                deviceHash,
                ipHash,
                lastSeen: new Date()
            }
        });
    }
}
