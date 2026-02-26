'use client';

import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface LedgerEntry {
    id: string;
    type: string;
    amount: string;
    runningBalance: string;
    contractId: string | null;
    milestoneId: string | null;
    contractTitle: string | null;
    milestoneTitle: string | null;
    createdAt: string;
}

interface WalletData {
    lockedBalance: string;
    pendingWithdrawals: string;
    availableBalance: string;
    ledgerEntries: LedgerEntry[];
}

interface WalletDashboardProps {
    data: WalletData;
    role: 'CLIENT' | 'FREELANCER';
}

// ============================================================================
// Helpers
// ============================================================================

function formatAmount(amount: string): { text: string; color: string } {
    const num = parseFloat(amount);
    if (num > 0) return { text: `+$${Math.abs(num).toFixed(2)}`, color: 'text-emerald-400' };
    if (num < 0) return { text: `-$${Math.abs(num).toFixed(2)}`, color: 'text-red-400' };
    return { text: '$0.00', color: 'text-zinc-500' };
}

function typeLabel(type: string): string {
    const labels: Record<string, string> = {
        DEPOSIT: 'Deposit',
        ESCROW_LOCK: 'Escrow Lock',
        ESCROW_RELEASE: 'Escrow Release',
        REFUND: 'Refund',
        WITHDRAWAL: 'Withdrawal',
        PLATFORM_FEE: 'Platform Fee',
    };
    return labels[type] || type;
}

// ============================================================================
// Wallet Dashboard Component
// ============================================================================

export default function WalletDashboard({ data, role }: WalletDashboardProps) {
    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
            <div className="w-full px-6 md:px-8 xl:px-16 py-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[32px] font-semibold text-white tracking-tight">Wallet</h1>
                        <p className="text-[14px] text-zinc-500 mt-1">Financial control center</p>
                    </div>
                    <span className="text-[12px] font-medium tracking-widest uppercase px-3 py-1.5 rounded border"
                        style={{
                            color: role === 'CLIENT' ? '#60a5fa' : '#a78bfa',
                            borderColor: role === 'CLIENT' ? 'rgba(96,165,250,0.25)' : 'rgba(167,139,250,0.25)',
                            backgroundColor: role === 'CLIENT' ? 'rgba(96,165,250,0.08)' : 'rgba(167,139,250,0.08)',
                        }}
                    >
                        {role}
                    </span>
                </div>

                {/* ── Top Grid: 70/30 ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-8">

                    {/* LEFT — Wallet Summary */}
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <div className="mb-1">
                            <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium">Available Balance</span>
                        </div>
                        <div className="text-[32px] font-bold text-emerald-400 tracking-tight mb-1">
                            ${parseFloat(data.availableBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] text-zinc-600 mb-6">Funds you can use to fund contracts or request withdrawal.</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-1">Locked in Escrow</span>
                                <span className="text-[20px] font-semibold text-amber-400">
                                    ${parseFloat(data.lockedBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <p className="text-[10px] text-zinc-600 mt-0.5">Reserved for active milestones.</p>
                            </div>
                            <div>
                                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-1">Pending Withdrawals</span>
                                <span className="text-[20px] font-semibold text-orange-400">
                                    ${parseFloat(data.pendingWithdrawals).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <p className="text-[10px] text-zinc-600 mt-0.5">Being processed. Temporarily unavailable.</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — Quick Actions */}
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-4">Quick Actions</span>
                        <div className="space-y-3">
                            {role === 'CLIENT' ? (
                                <>
                                    <Link href="/client/wallet/deposit" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                        style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', backgroundColor: 'rgba(96,165,250,0.08)' }}>
                                        Add Funds
                                    </Link>
                                    <Link href="/client/contracts" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                        style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.06)' }}>
                                        View Active Locks
                                    </Link>
                                </>
                            ) : (
                                <Link href="/freelancer/wallet/withdraw" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                    style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}>
                                    Withdraw Funds
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Ledger Table ── */}
                <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: '#1E2328' }}>
                        <h2 className="text-[14px] font-semibold text-white uppercase tracking-widest">Transaction Ledger</h2>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[140px_120px_1fr_1fr_120px_120px] gap-2 px-6 py-3 text-[12px] text-zinc-500 uppercase tracking-wider font-medium border-b"
                        style={{ borderColor: '#1E2328' }}>
                        <div>Date</div>
                        <div>Type</div>
                        <div>Contract</div>
                        <div>Milestone</div>
                        <div className="text-right">Amount</div>
                        <div className="text-right">Balance</div>
                    </div>

                    {/* Table Body — All entries, top=latest, running balance from backend */}
                    {data.ledgerEntries.length === 0 ? (
                        <div className="px-6 py-16 text-center text-zinc-600 text-[14px]">
                            No transactions yet
                        </div>
                    ) : (
                        <div>
                            {data.ledgerEntries.map((entry) => {
                                const { text: amtText, color: amtColor } = formatAmount(entry.amount);
                                return (
                                    <Link key={entry.id}
                                        href={role === 'CLIENT'
                                            ? `/client/wallet/transactions/${entry.id}`
                                            : `/freelancer/wallet/transactions/${entry.id}`}
                                        className="grid grid-cols-[140px_120px_1fr_1fr_120px_120px] gap-2 px-6 py-3 text-[14px] transition-colors border-b cursor-pointer"
                                        style={{ borderColor: '#1A1E24' }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#161A20')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <div className="text-zinc-400 tabular-nums">
                                            {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                                        </div>
                                        <div className="text-zinc-300">{typeLabel(entry.type)}</div>
                                        <div className="text-zinc-400 truncate">
                                            {entry.contractTitle || '—'}
                                        </div>
                                        <div className="text-zinc-500 truncate">
                                            {entry.milestoneTitle || '—'}
                                        </div>
                                        <div className={`text-right tabular-nums font-medium ${amtColor}`}>
                                            {amtText}
                                        </div>
                                        <div className="text-right tabular-nums text-zinc-400">
                                            ${parseFloat(entry.runningBalance).toFixed(2)}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
