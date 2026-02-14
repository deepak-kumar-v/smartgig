'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Zap, FileText } from 'lucide-react';

interface LifecycleEvent {
    id: string;
    eventType: string;
    contractId?: string | null;
    devState?: string | null;
    userMessage: string;
    createdAt: string;
}

interface ContractSummary {
    id: string;
    type: string;
    title: string;
    status: string;
    totalBudget: number;
}

interface TrialUpgradeConnectorProps {
    events: LifecycleEvent[];
    contracts: ContractSummary[];
}

export function TrialUpgradeConnector({ events, contracts }: TrialUpgradeConnectorProps) {
    const upgradeData = useMemo(() => {
        // Find TRIAL_UPGRADED events
        const upgradeEvents = events.filter(e => e.eventType === 'TRIAL_UPGRADED');
        if (upgradeEvents.length === 0) return null;

        // Find trial contract and standard contract
        const trialContract = contracts.find(c => c.type === 'TRIAL');
        const standardContract = contracts.find(c => c.type === 'STANDARD' || c.type === 'FIXED_PRICE' || c.type === 'HOURLY');

        if (!trialContract) return null;

        return {
            upgradeEvent: upgradeEvents[0],
            trialContract,
            standardContract,
            contracts: contracts.filter(c => c.id !== trialContract?.id || c.id !== standardContract?.id),
        };
    }, [events, contracts]);

    if (!upgradeData) return null;

    const { trialContract, standardContract, upgradeEvent } = upgradeData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
                <Zap className="w-4 h-4 text-zinc-600" />
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">
                    Contract Upgrade Path
                </h2>
            </div>

            <div className="flex flex-col items-center max-w-lg mx-auto">
                {/* Trial Contract Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full glass-panel rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/[0.03] relative"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono uppercase tracking-wider">
                                    Trial
                                </span>
                                <span className="text-xs text-emerald-400/60">Completed</span>
                            </div>
                            <p className="text-sm text-zinc-300 font-medium">{trialContract.title}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Metallic Connector */}
                <div className="relative py-3">
                    <motion.div
                        className="w-[2px] h-12 mx-auto"
                        style={{
                            background: 'linear-gradient(180deg, rgba(52,211,153,0.5) 0%, rgba(99,102,241,0.5) 50%, rgba(129,140,248,0.5) 100%)',
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                    />
                    {/* Animated pulse on the connector */}
                    <motion.div
                        className="absolute left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-indigo-400"
                        initial={{ top: '0%', opacity: 0 }}
                        animate={{ top: ['10%', '90%'], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, delay: 0.8, ease: 'easeInOut' }}
                    />
                    {/* Upgrade badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 font-bold uppercase tracking-widest whitespace-nowrap"
                    >
                        Upgraded
                    </motion.div>
                </div>

                {/* Standard Contract Card */}
                {standardContract ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="w-full glass-panel rounded-xl p-5 border border-indigo-500/20 bg-indigo-500/[0.03] relative"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-mono uppercase tracking-wider">
                                        Standard
                                    </span>
                                    <span className="text-xs text-indigo-400/60">{standardContract.status}</span>
                                </div>
                                <p className="text-sm text-zinc-300 font-medium">{standardContract.title}</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="w-full glass-panel rounded-xl p-5 border border-zinc-800 text-center"
                    >
                        <p className="text-xs text-zinc-600">Standard contract pending creation</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
