'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { depositToWallet } from '@/actions/wallet-actions';

export default function DepositForm({
    available,
    locked,
    pendingWithdrawals,
}: {
    available: string;
    locked: string;
    pendingWithdrawals: string;
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

        startTransition(async () => {
            const result = await depositToWallet(value);
            if ('error' in result) {
                setMessage({ type: 'error', text: result.error as string });
            } else {
                setMessage({ type: 'success', text: `$${value.toFixed(2)} deposited successfully` });
                setAmount('');
                setTimeout(() => router.push('/client/wallet'), 1500);
            }
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto" style={{ color: '#e4e4e7' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: '#ffffff' }}>
                    Add Funds
                </h1>
                <p className="text-[13px] mt-1" style={{ color: '#71717a' }}>
                    Deposit to your wallet for escrow funding and contract payments
                </p>
            </div>

            {/* Balance Strip */}
            <div
                className="flex items-center gap-8 px-6 py-4 mb-8 rounded"
                style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
            >
                <div>
                    <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>
                        Available
                    </span>
                    <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#34d399' }}>
                        ${available}
                    </span>
                </div>
                <div className="w-px h-8" style={{ backgroundColor: '#1E2328' }} />
                <div>
                    <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>
                        Locked in Escrow
                    </span>
                    <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#fbbf24' }}>
                        ${locked}
                    </span>
                </div>
                <div className="w-px h-8" style={{ backgroundColor: '#1E2328' }} />
                <div>
                    <span className="text-[11px] uppercase tracking-widest block" style={{ color: '#71717a' }}>
                        Pending Withdrawals
                    </span>
                    <span className="text-[20px] font-semibold tabular-nums" style={{ color: '#fb923c' }}>
                        ${pendingWithdrawals}
                    </span>
                </div>
            </div>

            {/* Deposit Form */}
            <form onSubmit={handleSubmit}>
                <div
                    className="p-6 rounded"
                    style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                >
                    <label
                        className="text-[11px] uppercase tracking-widest block mb-3"
                        style={{ color: '#71717a' }}
                    >
                        Deposit Amount
                    </label>
                    <div className="relative mb-6">
                        <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold"
                            style={{ color: '#52525b' }}
                        >
                            $
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            min="1"
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

                    {/* Quick amounts */}
                    <div className="flex gap-2 mb-6">
                        {[100, 500, 1000, 5000].map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setAmount(preset.toString())}
                                className="flex-1 py-2 text-[13px] font-medium rounded transition-colors"
                                style={{
                                    backgroundColor: '#0B0F14',
                                    border: '1px solid #1E2328',
                                    color: '#a1a1aa',
                                }}
                            >
                                ${preset.toLocaleString()}
                            </button>
                        ))}
                    </div>

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
                            backgroundColor: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.4)',
                            color: '#818cf8',
                        }}
                    >
                        {isPending ? 'Processing...' : 'Deposit Funds'}
                    </button>
                </div>
            </form>
        </div>
    );
}
