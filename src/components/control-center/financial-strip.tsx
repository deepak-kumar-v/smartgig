'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Lock, AlertCircle } from 'lucide-react';

interface FinancialData {
    totalBudget: number;
    totalDeposited: number;
    totalReleased: number;
    balance: number;
}

interface FinancialStripProps {
    financial: FinancialData | null;
    contractStatus: string | null;
    role: 'CLIENT' | 'FREELANCER';
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function FinancialStrip({ financial, contractStatus, role }: FinancialStripProps) {
    const total = financial?.totalBudget || 0;
    const funded = financial?.totalDeposited || 0;
    const released = financial?.totalReleased || 0;
    const locked = funded - released;
    const unfunded = Math.max(0, total - funded);

    const releasedPct = total > 0 ? (released / total) * 100 : 0;
    const lockedPct = total > 0 ? (locked / total) * 100 : 0;
    const unfundedPct = total > 0 ? (unfunded / total) * 100 : 0;

    const isGhost = !financial || total === 0;

    // Role-aware emphasis
    const emphasis = role === 'CLIENT'
        ? (unfunded > 0 ? 'Pending Funding Required' : funded > 0 ? 'Fully Funded' : 'Not Yet Funded')
        : (released > 0 ? 'Funds Secured' : funded > 0 ? 'Funds in Escrow' : 'Awaiting Funding');

    const metrics = [
        { label: 'Total Value', value: total, icon: DollarSign, color: 'text-zinc-300' },
        { label: 'Funded', value: funded, icon: TrendingUp, color: 'text-indigo-400' },
        { label: 'Released', value: released, icon: TrendingUp, color: 'text-emerald-400' },
        { label: 'Locked', value: locked, icon: Lock, color: 'text-amber-400' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="glass-panel rounded-2xl p-6 md:p-8 mb-12"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-zinc-600" />
                    <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                        Financial Overview
                    </h2>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${role === 'CLIENT'
                        ? (unfunded > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')
                        : (released > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20')
                    }`}>
                    {emphasis}
                </span>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {metrics.map((m) => (
                    <div key={m.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                        <m.icon className={`w-4 h-4 mx-auto mb-2 ${isGhost ? 'text-zinc-800' : m.color} opacity-60`} />
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">{m.label}</p>
                        <p className={`text-lg font-mono font-semibold ${isGhost ? 'text-zinc-800' : m.color}`}>
                            {isGhost ? '—' : formatCurrency(m.value)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Segmented Bar */}
            <div className="relative">
                <div className="h-3 rounded-full bg-zinc-900/80 overflow-hidden flex">
                    {!isGhost && releasedPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${releasedPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full"
                            title={`Released: ${formatCurrency(released)}`}
                        />
                    )}
                    {!isGhost && lockedPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lockedPct}%` }}
                            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                            title={`Locked: ${formatCurrency(locked)}`}
                        />
                    )}
                    {!isGhost && unfundedPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${unfundedPct}%` }}
                            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                            className="h-full bg-zinc-800"
                            title={`Unfunded: ${formatCurrency(unfunded)}`}
                        />
                    )}
                    {isGhost && (
                        <div className="h-full w-full bg-zinc-900/50 flex items-center justify-center">
                            <span className="text-[9px] text-zinc-700">No financial data yet</span>
                        </div>
                    )}
                </div>

                {/* Legend */}
                {!isGhost && (
                    <div className="flex items-center gap-5 mt-3 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-1.5 rounded-full bg-emerald-500" /> Released
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-1.5 rounded-full bg-indigo-500" /> Locked in Escrow
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-1.5 rounded-full bg-zinc-700" /> Unfunded
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
