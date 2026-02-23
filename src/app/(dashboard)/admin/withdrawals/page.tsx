import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPendingWithdrawalRequests } from '@/actions/withdrawal-actions';
import AdminWithdrawalsPanel from '@/components/admin/admin-withdrawals-panel';

export default async function AdminWithdrawalsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    if (session.user.role !== 'ADMIN') redirect('/login');

    const result = await getPendingWithdrawalRequests();

    if ('error' in result) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F14' }}>
                <p className="text-red-400 text-sm">{result.error}</p>
            </div>
        );
    }

    return <AdminWithdrawalsPanel initialRequests={result.requests} />;
}
