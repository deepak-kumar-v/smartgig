'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import type { DisputeRiskResult } from './utils/dispute-risk';

interface DisputeRiskMeterProps {
    risk: DisputeRiskResult;
    role: 'CLIENT' | 'FREELANCER';
}

export function DisputeRiskMeter({ risk, role }: DisputeRiskMeterProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const cfg = {
        LOW: { color: '#34d399', label: 'Low Risk', bg: 'bg-emerald-500/[0.04]', border: 'border-emerald-500/15', text: 'text-emerald-400' },
        MODERATE: { color: '#818cf8', label: 'Moderate Risk', bg: 'bg-indigo-500/[0.04]', border: 'border-indigo-500/15', text: 'text-indigo-400' },
        HIGH: { color: '#fbbf24', label: 'High Risk', bg: 'bg-amber-500/[0.04]', border: 'border-amber-500/15', text: 'text-amber-400' },
        CRITICAL: { color: '#f87171', label: 'Critical Risk', bg: 'bg-red-500/[0.04]', border: 'border-red-500/15', text: 'text-red-400' },
    }[risk.level];

    // SVG radial gauge
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progress = (risk.score / 100) * circumference;
    const dashOffset = circumference - progress;

    const roleAdvice = role === 'CLIENT'
        ? 'Take action to reduce dispute risk.'
        : 'Maintain healthy communication to avoid escalation.';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className={`glass-panel rounded-2xl p-6 md:p-8 mb-12 border ${cfg.border} ${cfg.bg} relative`}
        >
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className={`w-4 h-4 ${cfg.text}`} />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                    Dispute Risk Assessment
                </h2>
            </div>

            <div className="flex items-center gap-8 flex-wrap">
                {/* Radial Gauge */}
                <div
                    className="relative cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <svg width="130" height="130" viewBox="0 0 130 130" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        {/* Progress ring */}
                        <motion.circle
                            cx="65" cy="65" r={radius}
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: dashOffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ filter: risk.level === 'CRITICAL' ? `drop-shadow(0 0 8px ${cfg.color})` : undefined }}
                        />
                    </svg>
                    {/* Score center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className={`text-3xl font-bold font-mono ${cfg.text}`}
                            animate={risk.level === 'CRITICAL' ? { opacity: [1, 0.6, 1] } : {}}
                            transition={risk.level === 'CRITICAL' ? { duration: 1.5, repeat: Infinity } : {}}
                        >
                            {risk.score}
                        </motion.span>
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">/ 100</span>
                    </div>

                    {/* Tooltip */}
                    <AnimatePresence>
                        {showTooltip && risk.factors.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl"
                            >
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Contributing Factors</p>
                                <div className="space-y-1.5">
                                    {risk.factors.map((f, i) => (
                                        <p key={i} className="text-xs text-zinc-400">{f}</p>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-[200px]">
                    <p className={`text-lg font-bold ${cfg.text} mb-1`}>{cfg.label}</p>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{roleAdvice}</p>
                    {risk.factors.length > 0 && (
                        <p className="text-xs text-zinc-600">
                            {risk.factors.length} factor{risk.factors.length !== 1 ? 's' : ''} affecting score. Hover gauge for details.
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
