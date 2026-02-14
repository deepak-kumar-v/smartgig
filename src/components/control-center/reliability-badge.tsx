'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import type { ReliabilityResult } from './utils/reliability-score';

interface ReliabilityBadgeProps {
    reliability: ReliabilityResult;
    role: 'CLIENT' | 'FREELANCER';
}

export function ReliabilityBadge({ reliability, role }: ReliabilityBadgeProps) {
    const cfg = {
        A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: '0 0 20px rgba(52,211,153,0.2)', label: 'Excellent' },
        B: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: '0 0 20px rgba(129,140,248,0.2)', label: 'Good' },
        C: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: '0 0 20px rgba(251,191,36,0.2)', label: 'Fair' },
        D: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: '0 0 20px rgba(248,113,113,0.2)', label: 'Needs Improvement' },
    }[reliability.grade];

    const title = role === 'CLIENT'
        ? 'Freelancer Reliability'
        : 'Your Reliability Score';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className={`glass-panel rounded-2xl p-6 md:p-8 mb-12 border ${cfg.border}`}
        >
            <div className="flex items-center gap-3 mb-6">
                <Shield className={`w-4 h-4 ${cfg.color}`} />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">{title}</h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Grade Badge */}
                <motion.div
                    className={`w-20 h-20 rounded-2xl ${cfg.bg} border ${cfg.border} flex flex-col items-center justify-center`}
                    style={{ boxShadow: cfg.glow }}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                >
                    <span className={`text-3xl font-bold font-mono ${cfg.color}`}>{reliability.grade}</span>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{reliability.score}/100</span>
                </motion.div>

                {/* Details */}
                <div className="flex-1">
                    <p className={`text-base font-semibold ${cfg.color} mb-1`}>
                        {cfg.label}
                    </p>
                    {reliability.deductions.length === 0 ? (
                        <p className="text-xs text-zinc-600">No negative signals detected. Clean track record.</p>
                    ) : (
                        <div className="space-y-1">
                            {reliability.deductions.map((d, i) => (
                                <p key={i} className="text-xs text-zinc-500">{d}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
