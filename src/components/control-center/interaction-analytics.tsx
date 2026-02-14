'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Pencil, RefreshCw, Scale } from 'lucide-react';

interface InteractionCounts {
    messages: number;
    edits: number;
    changeRequests: number;
    disputes: number;
}

interface InteractionAnalyticsProps {
    counts: InteractionCounts;
}

export function InteractionAnalytics({ counts }: InteractionAnalyticsProps) {
    const cards = [
        {
            label: 'Messages',
            emoji: '💬',
            icon: MessageSquare,
            count: counts.messages,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/15',
            glow: 'rgba(59,130,246,0.15)',
        },
        {
            label: 'Edits',
            emoji: '✏️',
            icon: Pencil,
            count: counts.edits,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/15',
            glow: 'rgba(251,191,36,0.15)',
        },
        {
            label: 'Change Requests',
            emoji: '🔁',
            icon: RefreshCw,
            count: counts.changeRequests,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/15',
            glow: 'rgba(251,146,60,0.15)',
        },
        {
            label: 'Disputes',
            emoji: '⚖️',
            icon: Scale,
            count: counts.disputes,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/15',
            glow: 'rgba(248,113,113,0.15)',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-4 h-4 text-zinc-600" />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                    Interaction Density
                </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
                        className={`glass-panel rounded-xl p-5 border ${card.border} relative overflow-hidden`}
                        style={{ boxShadow: card.count > 0 ? `0 0 20px ${card.glow}` : undefined }}
                    >
                        {/* Subtle glow background */}
                        {card.count > 0 && (
                            <motion.div
                                className={`absolute inset-0 ${card.bg} opacity-30`}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                            />
                        )}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-lg">{card.emoji}</span>
                                <card.icon className={`w-4 h-4 ${card.count > 0 ? card.color : 'text-zinc-800'} opacity-40`} />
                            </div>
                            <p className={`text-2xl font-mono font-bold mb-1 ${card.count > 0 ? card.color : 'text-zinc-800'}`}>
                                {card.count}
                            </p>
                            <p className="text-[11px] text-zinc-600 font-medium">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
