'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { ResponsivenessResult } from './utils/responsiveness-index';

interface ResponsivenessBarProps {
    result: ResponsivenessResult;
    targetRole: 'CLIENT' | 'FREELANCER';
    viewerRole: 'CLIENT' | 'FREELANCER';
}

export function ResponsivenessBar({ result, targetRole, viewerRole }: ResponsivenessBarProps) {
    const cfg = {
        EXCELLENT: { color: 'text-emerald-400', bg: 'bg-emerald-500', fill: 100, glow: 'rgba(52,211,153,0.2)' },
        GOOD: { color: 'text-indigo-400', bg: 'bg-indigo-500', fill: 75, glow: 'rgba(129,140,248,0.2)' },
        DELAYED: { color: 'text-amber-400', bg: 'bg-amber-500', fill: 40, glow: 'rgba(251,191,36,0.2)' },
        POOR: { color: 'text-red-400', bg: 'bg-red-500', fill: 15, glow: 'rgba(248,113,113,0.2)' },
    }[result.rating];

    const label = targetRole === 'CLIENT' ? 'Client Responsiveness' : 'Freelancer Responsiveness';
    const noData = result.pairCount === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="glass-panel rounded-2xl p-6 md:p-8 mb-12"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-zinc-600" />
                    <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                        {label}
                    </h2>
                </div>
                {!noData && (
                    <span className={`text-sm font-bold ${cfg.color}`}>
                        {result.rating} ({result.averageResponseHours}h avg)
                    </span>
                )}
            </div>

            {noData ? (
                <div className="text-center py-3">
                    <p className="text-xs text-zinc-700">Not enough transitions to compute responsiveness.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="h-2.5 rounded-full bg-zinc-900/80 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cfg.fill}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${cfg.bg}`}
                            style={{ boxShadow: `0 0 12px ${cfg.glow}` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-700">
                        <span>{'<'}12h Excellent</span>
                        <span>12–24h Good</span>
                        <span>24–48h Delayed</span>
                        <span>{'>'}48h Poor</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
