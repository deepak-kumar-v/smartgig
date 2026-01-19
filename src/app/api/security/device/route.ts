
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkDeviceBan, recordDevice } from '@/lib/security';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { deviceHash } = await req.json();

        if (!deviceHash) {
            return new NextResponse('Device hash required', { status: 400 });
        }

        // Check ban status first - blocks even anonymous requests if we wanted (but we need user context for strikes usually, unless we store banned hashes separately)
        // Currently logic relies on associating device with user history.
        const banStatus = await checkDeviceBan(deviceHash);

        if (banStatus.banned) {
            return NextResponse.json({
                banned: true,
                message: 'Access Denied: This device has been flagged for security violations.'
            }, { status: 403 });
        }

        // If user is logged in, record the device
        const session = await auth();
        if (session?.user?.id) {
            // Hash IP for privacy
            const headersList = await headers();
            const ip = headersList.get('x-forwarded-for') || 'unknown';
            const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

            await recordDevice(session.user.id, deviceHash, ipHash);
        }

        return NextResponse.json({ banned: false });
    } catch (error) {
        console.error('Device security check failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
