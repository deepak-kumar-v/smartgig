'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Hourglass } from 'lucide-react';
import type { BurnRateResult } from './utils/burn-rate';

interface BurnRateCardProps {
    burnRate: BurnRateResult;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function BurnRateCard({ burnRate }: BurnRateCardProps) {
    const hasData = burnRate.burnRatePerDay > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="glass-panel rounded-2xl p-6 md:p-8 mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
                <Flame className="w-4 h-4 text-zinc-600" />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                    Escrow Burn Rate
                </h2>
            </div>

            {!hasData ? (
                <div className="text-center py-4">
                    <Hourglass className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                    <p className="text-xs text-zinc-700">Not enough release data to estimate burn rate.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Burn Rate */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🔥</span>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Daily Burn Rate</span>
                        </div>
                        <p className="text-2xl font-mono font-bold text-orange-400">
                            {formatCurrency(burnRate.burnRatePerDay)}
                            <span className="text-sm text-zinc-600 font-normal">/day</span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                            Over {burnRate.daysActive} active day{burnRate.daysActive !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Estimated Completion */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">⏳</span>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Est. Remaining</span>
                        </div>
                        {burnRate.estimatedDaysRemaining !== null ? (
                            <>
                                <p className="text-2xl font-mono font-bold text-indigo-400">
                                    ~{burnRate.estimatedDaysRemaining}
                                    <span className="text-sm text-zinc-600 font-normal"> days</span>
                                </p>
                                <p className="text-xs text-zinc-600 mt-1">
                                    Based on current release velocity
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-zinc-700">
                                Awaiting more milestones
                            </p>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
