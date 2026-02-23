'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestWithdrawal } from '@/actions/withdrawal-actions';

interface WithdrawalRequestRow {
    id: string;
    amount: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const statusColors: Record<string, { color: string; bg: string }> = {
    PENDING: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    APPROVED: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    COMPLETED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
};

export default function WithdrawView({
    available,
    locked,
    pendingWithdrawals,
    total,
    requests,
}: {
    available: string;
    locked: string;
    pendingWithdrawals: string;
    total: string;
    requests: WithdrawalRequestRow[];
}) {
    const [amount, setAmount] = useState('');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) {
            setMessage({ type: 'error', text: 'Enter a valid amount' });
            return;
        }
        if (value > parseFloat(available)) {
            setMessage({ type: 'error', text: `Maximum withdrawable: $${available}` });
            return;
        }

        startTransition(async () => {
            const result = await requestWithdrawal(value);
            if ('error' in result && result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Withdrawal request submitted. Awaiting approval.' });
                setAmount('');
                setTimeout(() => router.refresh(), 1500);
            }
        });
    };

    return (
        <div className="w-full" style={{ color: '#e4e4e7' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: '#ffffff' }}>
                    Withdraw Funds
                </h1>
                <p className="text-[13px] mt-1" style={{ color: '#71717a' }}>
                    Request a withdrawal from your available balance
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                {/* LEFT COLUMN — Form */}
                <div>
                    {/* Balance Strip */}
                    <div
                        className="flex items-center gap-6 px-6 py-4 mb-6 rounded flex-wrap"
                        style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                    >
                        <div>
                            <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>Available</span>
                            <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#34d399' }}>${available}</span>
                        </div>
                        <div className="w-px h-8" style={{ backgroundColor: '#1E2328' }} />
                        <div>
                            <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>Locked</span>
                            <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#fbbf24' }}>${locked}</span>
                        </div>
                        <div className="w-px h-8" style={{ backgroundColor: '#1E2328' }} />
                        <div>
                            <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>Pending Withdrawals</span>
                            <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#fb923c' }}>${pendingWithdrawals}</span>
                        </div>
                        <div className="w-px h-8" style={{ backgroundColor: '#1E2328' }} />
                        <div>
                            <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>Total</span>
                            <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#ffffff' }}>${total}</span>
                        </div>
                    </div>

                    {/* Withdraw Form */}
                    <form onSubmit={handleSubmit}>
                        <div
                            className="p-6 rounded"
                            style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                        >
                            <label className="text-[11px] uppercase tracking-widest block mb-3" style={{ color: '#71717a' }}>
                                Withdrawal Amount
                            </label>
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold" style={{ color: '#52525b' }}>$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    max={parseFloat(available)}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full text-[22px] font-semibold tabular-nums py-3 pl-10 pr-4 rounded focus:outline-none transition-colors"
                                    style={{
                                        backgroundColor: '#0B0F14',
                                        border: '1px solid #1E2328',
                                        color: '#ffffff',
                                    }}
                                    disabled={isPending}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setAmount(available)}
                                className="text-[12px] font-medium mb-6 block transition-colors"
                                style={{ color: '#34d399' }}
                            >
                                Withdraw Max (${available})
                            </button>

                            {message && (
                                <div
                                    className="px-4 py-3 rounded text-[13px] mb-4"
                                    style={{
                                        backgroundColor: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                                        border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                                        color: message.type === 'error' ? '#ef4444' : '#34d399',
                                    }}
                                >
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isPending || !amount}
                                className="w-full py-3 text-[14px] font-semibold rounded transition-all disabled:opacity-40"
                                style={{
                                    backgroundColor: 'rgba(52,211,153,0.12)',
                                    border: '1px solid rgba(52,211,153,0.35)',
                                    color: '#34d399',
                                }}
                            >
                                {isPending ? 'Submitting...' : 'Request Withdrawal'}
                            </button>

                            <p className="text-[11px] mt-3 text-center" style={{ color: '#52525b' }}>
                                Withdrawal requests require admin approval before ledger debit
                            </p>
                        </div>
                    </form>
                </div>

                {/* RIGHT COLUMN — Request History */}
                <div>
                    <div
                        className="rounded"
                        style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                    >
                        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1E2328' }}>
                            <h2 className="text-[14px] font-semibold" style={{ color: '#ffffff' }}>
                                Withdrawal Requests
                            </h2>
                        </div>

                        {requests.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <p className="text-[13px]" style={{ color: '#52525b' }}>No withdrawal requests yet</p>
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: '#1E2328' }}>
                                {requests.map((req) => {
                                    const sc = statusColors[req.status] || statusColors.PENDING;
                                    return (
                                        <div key={req.id} className="px-5 py-3 flex items-center justify-between">
                                            <div>
                                                <span className="text-[14px] font-semibold tabular-nums" style={{ color: '#ffffff' }}>
                                                    ${req.amount}
                                                </span>
                                                <span className="text-[11px] block mt-0.5" style={{ color: '#52525b' }}>
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span
                                                className="text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded"
                                                style={{ color: sc.color, backgroundColor: sc.bg }}
                                            >
                                                {req.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
