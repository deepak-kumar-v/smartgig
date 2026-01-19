import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { TrustDashboard } from '@/components/dashboard/trust-dashboard';

async function getUserTrustData(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            strikes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    appeals: {
                        orderBy: { id: 'desc' }, // Assuming appeals don't have createdAt, checking schema... appeals use cuids which aren't time ordered reliably, but let's check schema again. Appeal model doesn't have createdAt. cuid implies time, but it's not guaranteed sorted by DB. Let's just take the first one found or we need to look closer.
                        // Schema: model Appeal { id, strikeId, reason, status }
                        // No createdAt on Appeal.
                    }
                }
            }
        }
    });

    if (!user) return null;

    const strikes = user.strikes.map(s => ({
        id: s.id,
        reason: s.reason,
        severity: s.severity,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        appeal: s.appeals[0] ? {
            id: s.appeals[0].id,
            reason: s.appeals[0].reason,
            status: s.appeals[0].status
        } : undefined
    }));

    return {
        trustScore: user.trustScore,
        strikes,
        totalStrikes: await db.strike.count({ where: { userId } })
    };
}

export default async function FreelancerTrustPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const data = await getUserTrustData(session.user.id);

    if (!data) {
        return <div>User not found</div>;
    }

    return (
        <DashboardShell role="freelancer">
            <div>
                <h1 className="text-2xl font-bold text-white mb-6">Trust & Safety Center</h1>
                <TrustDashboard
                    trustScore={data.trustScore}
                    strikes={data.strikes}
                    totalStrikes={data.totalStrikes}
                />
            </div>
        </DashboardShell>
    );
}
