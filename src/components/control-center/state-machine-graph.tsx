'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import {
    CONTRACT_STATE_MACHINE, STATE_LABELS, STATE_DESCRIPTIONS,
    STATE_TRIGGERS, STATE_POSITIONS, ALL_STATES,
} from './utils/state-machine';

interface StateMachineGraphProps {
    currentStatus: string | null;
    pastStates: string[];
}

export function StateMachineGraph({ currentStatus, pastStates }: StateMachineGraphProps) {
    const [expanded, setExpanded] = useState(false);
    const [hoveredState, setHoveredState] = useState<string | null>(null);

    const pastSet = useMemo(() => new Set(pastStates), [pastStates]);
    const availableNext = useMemo(
        () => currentStatus ? new Set(CONTRACT_STATE_MACHINE[currentStatus] || []) : new Set<string>(),
        [currentStatus],
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="glass-panel rounded-2xl mb-12 overflow-hidden"
        >
            {/* Header — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-8 text-left hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Info className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                            Developer State Machine
                        </h2>
                        <p className="text-[11px] text-zinc-700 mt-0.5">
                            Interactive contract state transition graph
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-zinc-600" />
                </motion.div>
            </button>

            {/* Expandable content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 pb-8">
                            <div className="relative bg-white/[0.02] border border-white/5 rounded-xl p-4 overflow-x-auto">
                                <svg
                                    viewBox="0 0 1000 400"
                                    className="w-full min-w-[700px]"
                                    style={{ height: '320px' }}
                                >
                                    {/* Connection lines */}
                                    {ALL_STATES.map((state) => {
                                        const from = STATE_POSITIONS[state];
                                        const targets = CONTRACT_STATE_MACHINE[state] || [];
                                        return targets.map((target) => {
                                            const to = STATE_POSITIONS[target];
                                            if (!from || !to) return null;
                                            const fx = from.x * 10;
                                            const fy = from.y * 4;
                                            const tx = to.x * 10;
                                            const ty = to.y * 4;

                                            const isPastEdge = pastSet.has(state) && pastSet.has(target);
                                            const isActiveEdge = state === currentStatus && availableNext.has(target);

                                            return (
                                                <line
                                                    key={`${state}-${target}`}
                                                    x1={fx} y1={fy} x2={tx} y2={ty}
                                                    stroke={
                                                        isActiveEdge ? 'rgba(99,130,255,0.5)'
                                                            : isPastEdge ? 'rgba(52,211,153,0.3)'
                                                                : 'rgba(255,255,255,0.06)'
                                                    }
                                                    strokeWidth={isActiveEdge ? 2.5 : 1.5}
                                                    strokeDasharray={isActiveEdge ? '6,3' : undefined}
                                                />
                                            );
                                        });
                                    })}

                                    {/* Arrowheads for active transitions */}
                                    <defs>
                                        <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5"
                                            markerWidth="6" markerHeight="6" orient="auto-start-auto">
                                            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(99,130,255,0.6)" />
                                        </marker>
                                    </defs>

                                    {/* State nodes */}
                                    {ALL_STATES.map((state) => {
                                        const pos = STATE_POSITIONS[state];
                                        if (!pos) return null;
                                        const cx = pos.x * 10;
                                        const cy = pos.y * 4;
                                        const isCurrent = state === currentStatus;
                                        const isPast = pastSet.has(state) && !isCurrent;
                                        const isFuture = !isPast && !isCurrent;

                                        return (
                                            <g
                                                key={state}
                                                onMouseEnter={() => setHoveredState(state)}
                                                onMouseLeave={() => setHoveredState(null)}
                                                className="cursor-pointer"
                                            >
                                                {/* Glow for current */}
                                                {isCurrent && (
                                                    <>
                                                        <circle cx={cx} cy={cy} r={30}
                                                            fill="none" stroke="rgba(99,102,241,0.3)"
                                                            strokeWidth={2}>
                                                            <animate attributeName="r" values="28;36;28"
                                                                dur="2.5s" repeatCount="indefinite" />
                                                            <animate attributeName="opacity" values="0.5;0.1;0.5"
                                                                dur="2.5s" repeatCount="indefinite" />
                                                        </circle>
                                                        <circle cx={cx} cy={cy} r={22}
                                                            fill="rgba(99,102,241,0.15)"
                                                            stroke="rgba(129,140,248,0.6)"
                                                            strokeWidth={2} />
                                                    </>
                                                )}

                                                {/* Node circle */}
                                                <circle
                                                    cx={cx} cy={cy} r={isCurrent ? 20 : 18}
                                                    fill={
                                                        isCurrent ? 'rgba(99,102,241,0.25)'
                                                            : isPast ? 'rgba(52,211,153,0.12)'
                                                                : 'rgba(255,255,255,0.03)'
                                                    }
                                                    stroke={
                                                        isCurrent ? 'rgba(129,140,248,0.7)'
                                                            : isPast ? 'rgba(52,211,153,0.35)'
                                                                : 'rgba(255,255,255,0.08)'
                                                    }
                                                    strokeWidth={isCurrent ? 2.5 : 1.5}
                                                />

                                                {/* Label */}
                                                <text
                                                    x={cx} y={cy + 1}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill={
                                                        isCurrent ? 'rgba(199,210,254,1)'
                                                            : isPast ? 'rgba(110,231,183,0.8)'
                                                                : 'rgba(161,161,170,0.4)'
                                                    }
                                                    fontSize="9"
                                                    fontWeight={isCurrent ? '600' : '500'}
                                                    fontFamily="ui-monospace, monospace"
                                                >
                                                    {STATE_LABELS[state]?.length > 8
                                                        ? STATE_LABELS[state].slice(0, 7) + '…'
                                                        : STATE_LABELS[state] || state}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Hover tooltip */}
                                <AnimatePresence>
                                    {hoveredState && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="absolute top-4 right-4 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl z-10"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                                    {hoveredState}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {STATE_LABELS[hoveredState]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                                                {STATE_DESCRIPTIONS[hoveredState]}
                                            </p>
                                            {STATE_TRIGGERS[hoveredState] && (
                                                <div className="space-y-1.5 text-[11px]">
                                                    <div className="flex gap-2">
                                                        <span className="text-zinc-600 shrink-0">Who:</span>
                                                        <span className="text-zinc-300">{STATE_TRIGGERS[hoveredState].who}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-zinc-600 shrink-0">Action:</span>
                                                        <span className="text-amber-400/80 font-mono">{STATE_TRIGGERS[hoveredState].action}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-zinc-600 shrink-0">Next:</span>
                                                        <span className="text-emerald-400/80">{STATE_TRIGGERS[hoveredState].next}</span>
                                                    </div>
                                                    {(CONTRACT_STATE_MACHINE[hoveredState]?.length ?? 0) > 0 && (
                                                        <div className="flex gap-2">
                                                            <span className="text-zinc-600 shrink-0">→</span>
                                                            <span className="text-indigo-400">
                                                                {CONTRACT_STATE_MACHINE[hoveredState].join(' / ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-5 mt-4 text-[10px] text-zinc-600">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40" /> Past
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500/30 border border-indigo-500/50" /> Current
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-white/5 border border-white/10" /> Future
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-6 h-0.5 bg-blue-400/50" style={{ borderTop: '2px dashed rgba(99,130,255,0.5)' }} /> Available
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
