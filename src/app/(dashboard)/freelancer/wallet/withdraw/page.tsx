import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getWalletDashboardData } from '@/actions/wallet-actions';
import { getMyWithdrawalRequests } from '@/actions/withdrawal-actions';
import WithdrawView from './withdraw-view';

export default async function WithdrawPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [walletData, withdrawalData] = await Promise.all([
        getWalletDashboardData(),
        getMyWithdrawalRequests(),
    ]);

    if ('error' in walletData) redirect('/freelancer/wallet');

    const requests = ('requests' in withdrawalData && withdrawalData.requests)
        ? withdrawalData.requests
        : [] as { id: string; amount: string; status: string; createdAt: string; updatedAt: string }[];

    return (
        <WithdrawView
            available={walletData.availableBalance}
            locked={walletData.lockedBalance}
            pendingWithdrawals={walletData.pendingWithdrawals}
            requests={requests}
        />
    );
}
