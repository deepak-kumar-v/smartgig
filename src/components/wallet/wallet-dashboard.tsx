'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { depositFunds } from '@/actions/wallet-actions';
import { requestWithdrawal } from '@/actions/withdrawal-actions';

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

interface WithdrawalRequestRow {
    id: string;
    amount: string;
    status: string;
    createdAt: string;
    updatedAt: string;
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
    withdrawalRequests?: WithdrawalRequestRow[];
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

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    PENDING: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
    APPROVED: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
    COMPLETED: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
};

// ============================================================================
// Wallet Dashboard Component
// ============================================================================

export default function WalletDashboard({ data, role, withdrawalRequests = [] }: WalletDashboardProps) {
    const router = useRouter();

    // ── Deposit state ──
    const [depositAmount, setDepositAmount] = useState('');
    const [isDepositPending, startDepositTransition] = useTransition();
    const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Withdrawal request state ──
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawPending, startWithdrawTransition] = useTransition();
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(depositAmount);
        if (isNaN(value) || value <= 0) {
            setDepositMsg({ type: 'error', text: 'Enter a valid amount' });
            return;
        }

        startDepositTransition(async () => {
            const result = await depositFunds(value);
            if ('error' in result && result.error) {
                setDepositMsg({ type: 'error', text: result.error });
            } else {
                setDepositMsg({ type: 'success', text: `$${value.toFixed(2)} deposited successfully` });
                setDepositAmount('');
                setTimeout(() => router.refresh(), 1200);
            }
        });
    };

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(withdrawAmount);
        if (isNaN(value) || value <= 0) {
            setWithdrawMsg({ type: 'error', text: 'Enter a valid amount' });
            return;
        }
        if (value > parseFloat(data.availableBalance)) {
            setWithdrawMsg({ type: 'error', text: `Maximum withdrawable: $${data.availableBalance}` });
            return;
        }

        startWithdrawTransition(async () => {
            const result = await requestWithdrawal(value);
            if ('error' in result && result.error) {
                setWithdrawMsg({ type: 'error', text: result.error });
            } else {
                setWithdrawMsg({ type: 'success', text: 'Withdrawal request submitted. Awaiting admin approval.' });
                setWithdrawAmount('');
                setTimeout(() => router.refresh(), 1200);
            }
        });
    };

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

                {/* ── Top Grid: Balance Summary + Quick Actions ── */}
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

                    {/* RIGHT — Quick Actions (preserved links) */}
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-4">Quick Actions</span>
                        <div className="space-y-3">
                            {role === 'CLIENT' ? (
                                <>
                                    <Link href="/client/wallet/deposit" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                        style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', backgroundColor: 'rgba(96,165,250,0.08)' }}>
                                        Add Funds (Full Page)
                                    </Link>
                                    <Link href="/client/contracts" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                        style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.06)' }}>
                                        View Active Locks
                                    </Link>
                                </>
                            ) : (
                                <Link href="/freelancer/wallet/withdraw" className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                                    style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}>
                                    Withdraw Funds (Full Page)
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Deposit + Withdraw Forms Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* ── Deposit Card ── */}
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-4">Deposit Funds</span>
                        <form onSubmit={handleDeposit}>
                            <div className="relative mb-4">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold" style={{ color: '#52525b' }}>$</span>
                                <input
                                    id="deposit-amount-input"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full text-[20px] font-semibold tabular-nums py-3 pl-10 pr-4 rounded focus:outline-none transition-colors"
                                    style={{ backgroundColor: '#0B0F14', border: '1px solid #1E2328', color: '#ffffff' }}
                                    disabled={isDepositPending}
                                />
                            </div>

                            {/* Quick amounts */}
                            <div className="flex gap-2 mb-4">
                                {[100, 500, 1000].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setDepositAmount(preset.toString())}
                                        className="flex-1 py-1.5 text-[12px] font-medium rounded transition-colors"
                                        style={{ backgroundColor: '#0B0F14', border: '1px solid #1E2328', color: '#a1a1aa' }}
                                    >
                                        ${preset.toLocaleString()}
                                    </button>
                                ))}
                            </div>

                            {depositMsg && (
                                <div
                                    className="px-4 py-2.5 rounded text-[13px] mb-4"
                                    style={{
                                        backgroundColor: depositMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                                        border: `1px solid ${depositMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                                        color: depositMsg.type === 'error' ? '#ef4444' : '#34d399',
                                    }}
                                >
                                    {depositMsg.text}
                                </div>
                            )}

                            <button
                                id="deposit-submit-btn"
                                type="submit"
                                disabled={isDepositPending || !depositAmount}
                                className="w-full py-2.5 text-[14px] font-semibold rounded transition-all disabled:opacity-40"
                                style={{
                                    backgroundColor: 'rgba(99,102,241,0.15)',
                                    border: '1px solid rgba(99,102,241,0.4)',
                                    color: '#818cf8',
                                }}
                            >
                                {isDepositPending ? 'Processing...' : 'Add Funds'}
                            </button>
                        </form>
                    </div>

                    {/* ── Request Withdrawal Card ── */}
                    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium block mb-4">Request Withdrawal</span>
                        <form onSubmit={handleWithdraw}>
                            <div className="relative mb-4">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold" style={{ color: '#52525b' }}>$</span>
                                <input
                                    id="withdraw-amount-input"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    max={parseFloat(data.availableBalance)}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full text-[20px] font-semibold tabular-nums py-3 pl-10 pr-4 rounded focus:outline-none transition-colors"
                                    style={{ backgroundColor: '#0B0F14', border: '1px solid #1E2328', color: '#ffffff' }}
                                    disabled={isWithdrawPending}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setWithdrawAmount(data.availableBalance)}
                                className="text-[12px] font-medium mb-4 block transition-colors"
                                style={{ color: '#34d399' }}
                            >
                                Withdraw Max (${data.availableBalance})
                            </button>

                            {withdrawMsg && (
                                <div
                                    className="px-4 py-2.5 rounded text-[13px] mb-4"
                                    style={{
                                        backgroundColor: withdrawMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                                        border: `1px solid ${withdrawMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                                        color: withdrawMsg.type === 'error' ? '#ef4444' : '#34d399',
                                    }}
                                >
                                    {withdrawMsg.text}
                                </div>
                            )}

                            <button
                                id="withdraw-submit-btn"
                                type="submit"
                                disabled={isWithdrawPending || !withdrawAmount}
                                className="w-full py-2.5 text-[14px] font-semibold rounded transition-all disabled:opacity-40"
                                style={{
                                    backgroundColor: 'rgba(52,211,153,0.12)',
                                    border: '1px solid rgba(52,211,153,0.35)',
                                    color: '#34d399',
                                }}
                            >
                                {isWithdrawPending ? 'Submitting...' : 'Request Withdrawal'}
                            </button>
                            <p className="text-[11px] mt-2 text-center" style={{ color: '#52525b' }}>
                                Withdrawal requests require admin approval
                            </p>
                        </form>
                    </div>
                </div>

                {/* ── Withdrawal Requests Status ── */}
                {withdrawalRequests.length > 0 && (
                    <div className="rounded-lg border overflow-hidden mb-8" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                        <div className="px-6 py-4 border-b" style={{ borderColor: '#1E2328' }}>
                            <h2 className="text-[14px] font-semibold text-white uppercase tracking-widest">Withdrawal Requests</h2>
                        </div>
                        <div className="divide-y" style={{ borderColor: '#1E2328' }}>
                            {withdrawalRequests.map((req) => {
                                const sc = statusColors[req.status] || statusColors.PENDING;
                                return (
                                    <div key={req.id} className="px-6 py-3 flex items-center justify-between">
                                        <div>
                                            <span className="text-[14px] font-semibold tabular-nums text-white">
                                                ${req.amount}
                                            </span>
                                            <span className="text-[11px] block mt-0.5" style={{ color: '#52525b' }}>
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span
                                            className="text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded"
                                            style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}
                                        >
                                            {req.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
