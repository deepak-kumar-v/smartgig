import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWalletDashboardData, WalletDashboardData } from '@/actions/wallet-actions';
import WalletDashboard from '@/components/wallet/wallet-dashboard';

async function loadMoreEntries(offset: number) {
    'use server';
    const result = await getWalletDashboardData(offset, 50);
    if ('error' in result) return result;
    return {
        ledgerEntries: result.ledgerEntries,
        hasMore: result.hasMore,
    };
}

export default async function ClientWalletPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const data = await getWalletDashboardData(0, 50);

    if ('error' in data) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
                <p className="text-red-400 text-sm">{data.error}</p>
            </div>
        );
    }

    return <WalletDashboard data={data} role="CLIENT" loadMore={loadMoreEntries} />;
}
