import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWalletDashboardData } from '@/actions/wallet-actions';
import { getMyWithdrawalRequests } from '@/actions/withdrawal-actions';
import WalletDashboard from '@/components/wallet/wallet-dashboard';

export default async function ClientWalletPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [data, withdrawalResult] = await Promise.all([
        getWalletDashboardData(),
        getMyWithdrawalRequests(),
    ]);

    if ('error' in data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
                <p className="text-red-400 text-sm">{data.error}</p>
            </div>
        );
    }

    const withdrawalRequests = 'requests' in withdrawalResult ? withdrawalResult.requests : [];

    return <WalletDashboard data={data} role="CLIENT" withdrawalRequests={withdrawalRequests} />;
}

