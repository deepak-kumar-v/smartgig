import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { TrustDashboard } from '@/components/dashboard/trust-dashboard';

async function getUserTrustData(userId: string) {
    if (userId === 'demo-user-id') {
        // Mock data for demo
        return {
            trustScore: 98,
            strikes: [],
            totalStrikes: 0
        };
    }

    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            strikes: {
                orderBy: { createdAt: 'desc' }
                // appeals relation not available - Appeal model doesn't exist
            }
        }
    });

    if (!user) return null;

    const strikes = user.strikes.map(s => ({
        id: s.id,
        reason: s.reason,
        severity: parseInt(s.severity, 10) || 1,
        createdAt: s.createdAt,
        expiresAt: new Date(s.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from createdAt
        appeal: undefined
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
