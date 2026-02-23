import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAdminFinancialOverview, PlatformFinancialOverview } from '@/actions/admin-financial-actions';

const typeLabels: Record<string, string> = {
    DEPOSIT: 'Deposits',
    WITHDRAWAL: 'Withdrawals',
    ESCROW_LOCK: 'Escrow Locks',
    ESCROW_RELEASE: 'Escrow Releases',
    REFUND: 'Refunds',
    PLATFORM_FEE: 'Platform Fees',
    BONUS: 'Bonuses',
    ADJUSTMENT: 'Adjustments',
};

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div
            className="px-6 py-5 rounded"
            style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
        >
            <span className="text-[11px] uppercase tracking-widest block mb-1" style={{ color: '#71717a' }}>
                {label}
            </span>
            <span className="text-[24px] font-semibold tabular-nums" style={{ color }}>
                {value}
            </span>
        </div>
    );
}

export default async function AdminFinancialOverviewPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    if ((session.user as { role?: string }).role !== 'ADMIN') {
        redirect('/admin/dashboard');
    }

    const data = await getAdminFinancialOverview();

    if ('error' in data) {
        return (
            <div className="w-full p-8" style={{ color: '#e4e4e7' }}>
                <h1 className="text-[22px] font-semibold" style={{ color: '#ffffff' }}>Financial Overview</h1>
                <p className="text-[13px] mt-2" style={{ color: '#ef4444' }}>{data.error}</p>
            </div>
        );
    }

    const overview = data as PlatformFinancialOverview;

    return (
        <div className="w-full" style={{ color: '#e4e4e7' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: '#ffffff' }}>
                    Platform Financial Overview
                </h1>
                <p className="text-[13px] mt-1" style={{ color: '#71717a' }}>
                    Read-only system-wide financial snapshot — all values ledger-derived
                </p>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatBlock label="Total Locked" value={`$${Number(overview.totalLocked).toLocaleString()}`} color="#fbbf24" />
                <StatBlock label="Total Released" value={`$${Number(overview.totalReleased).toLocaleString()}`} color="#34d399" />
                <StatBlock label="Total Refunded" value={`$${Number(overview.totalRefunded).toLocaleString()}`} color="#ef4444" />
                <StatBlock label="Platform Revenue" value={`$${Number(overview.totalPlatformRevenue).toLocaleString()}`} color="#a78bfa" />
                <StatBlock label="Active Escrows" value={overview.activeEscrowCount.toString()} color="#60a5fa" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <StatBlock
                    label="Completed Contracts"
                    value={overview.completedContractCount.toString()}
                    color="#34d399"
                />
                <StatBlock
                    label="Active Escrow Accounts"
                    value={overview.activeEscrowCount.toString()}
                    color="#fbbf24"
                />
            </div>

            {/* Volume by Transaction Type */}
            <div
                className="rounded"
                style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
            >
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #1E2328' }}>
                    <h2 className="text-[14px] font-semibold" style={{ color: '#ffffff' }}>
                        Ledger Volume by Type
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: '#52525b' }}>
                        Sum of all WalletLedger entries grouped by transaction type
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid #1E2328' }}>
                                <th className="text-left text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>
                                    Type
                                </th>
                                <th className="text-right text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>
                                    Total Volume
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {overview.volumeByType.map((v) => (
                                <tr
                                    key={v.type}
                                    style={{ borderBottom: '1px solid #1E2328' }}
                                >
                                    <td className="px-6 py-3 text-[13px] font-medium" style={{ color: '#e4e4e7' }}>
                                        {typeLabels[v.type] || v.type}
                                    </td>
                                    <td className="px-6 py-3 text-right text-[14px] font-semibold tabular-nums" style={{ color: '#ffffff' }}>
                                        ${Number(v.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {overview.volumeByType.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-[13px]" style={{ color: '#52525b' }}>
                                        No ledger entries recorded
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Revenue by Month */}
            {overview.revenueByMonth.length > 0 && (
                <div
                    className="rounded mt-6"
                    style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                >
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid #1E2328' }}>
                        <h2 className="text-[14px] font-semibold" style={{ color: '#ffffff' }}>
                            Platform Revenue by Month
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: '#52525b' }}>
                            Sum of PLATFORM_FEE ledger entries grouped by month
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #1E2328' }}>
                                    <th className="text-left text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>Month</th>
                                    <th className="text-right text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.revenueByMonth.map((r) => (
                                    <tr key={r.month} style={{ borderBottom: '1px solid #1E2328' }}>
                                        <td className="px-6 py-3 text-[13px] font-medium" style={{ color: '#e4e4e7' }}>{r.month}</td>
                                        <td className="px-6 py-3 text-right text-[14px] font-semibold tabular-nums" style={{ color: '#a78bfa' }}>${Number(r.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Revenue by Contract */}
            {overview.revenueByContract.length > 0 && (
                <div
                    className="rounded mt-6"
                    style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                >
                    <div className="px-6 py-4" style={{ borderBottom: '1px solid #1E2328' }}>
                        <h2 className="text-[14px] font-semibold" style={{ color: '#ffffff' }}>
                            Revenue by Contract
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: '#52525b' }}>
                            Sum of PLATFORM_FEE ledger entries grouped by contract
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #1E2328' }}>
                                    <th className="text-left text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>Contract</th>
                                    <th className="text-right text-[11px] uppercase tracking-widest font-medium px-6 py-3" style={{ color: '#71717a' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.revenueByContract.map((r) => (
                                    <tr key={r.contractId} style={{ borderBottom: '1px solid #1E2328' }}>
                                        <td className="px-6 py-3 text-[13px] font-medium" style={{ color: '#e4e4e7' }}>{r.contractTitle}</td>
                                        <td className="px-6 py-3 text-right text-[14px] font-semibold tabular-nums" style={{ color: '#a78bfa' }}>${Number(r.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
