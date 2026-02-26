import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getWalletDashboardData } from '@/actions/wallet-actions';
import DepositForm from './deposit-form';

export default async function DepositPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const data = await getWalletDashboardData();
    if ('error' in data) redirect('/client/wallet');

    return (
        <DepositForm
            available={data.availableBalance}
            locked={data.lockedBalance}
            pendingWithdrawals={data.pendingWithdrawals}
        />
    );
}
