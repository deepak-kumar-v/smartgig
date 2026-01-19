'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Lock, ArrowRight, CheckCircle2, Wallet, RefreshCw } from 'lucide-react';

export function EscrowSection() {
    return (
        <section className="py-24 bg-black/20 border-y border-white/5 relative">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
                            <Lock className="w-3 h-3" />
                            Secure Payments
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                            Escrow Protection <br />
                            Standard.
                        </h2>
                        <p className="text-white/60 text-lg mb-8 leading-relaxed">
                            Never worry about payment disputes again. Funds are deposited into a neutral smart vault before work begins and released only when milestones are met.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: Wallet, title: "Deposit Funds", desc: "Client deposits funds into secure escrow." },
                                { icon: RefreshCw, title: "Work & Review", desc: "Freelancer submits work for approval." },
                                { icon: CheckCircle2, title: "Release", desc: "Funds released instantly upon satisfaction." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium text-lg">{step.title}</h4>
                                        <p className="text-white/50 text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Visual Representation of Transaction */}
                        <GlassCard variant="heavy" className="p-8 max-w-md mx-auto relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="text-sm text-white/50">Transaction ID #8823</div>
                                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/20">LOCKED</div>
                            </div>

                            <div className="flex items-center justify-between mb-8 relative">
                                {/* Dashed line */}
                                <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-white/20 -z-10" />

                                <div className="flex flex-col items-center gap-2 bg-[#0a0a0a] p-2 rounded-lg border border-white/10 z-10">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">C</div>
                                    <span className="text-xs text-white/50">Client</span>
                                </div>

                                <div className="flex flex-col items-center gap-1 z-10 bg-[#0a0a0a] px-3 py-1 rounded-full border border-white/10">
                                    <Lock className="w-4 h-4 text-green-400" />
                                    <span className="text-[10px] text-green-400 font-mono">$1,200.00</span>
                                </div>

                                <div className="flex flex-col items-center gap-2 bg-[#0a0a0a] p-2 rounded-lg border border-white/10 z-10">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">F</div>
                                    <span className="text-xs text-white/50">Freelancer</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="w-full bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                    <span className="text-sm text-white/70">Milestone 1: Research</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="w-full bg-white/5 rounded-lg p-3 flex justify-between items-center border border-white/10">
                                    <span className="text-sm text-white">Milestone 2: Design</span>
                                    <span className="text-xs text-yellow-400 animate-pulse">In Progress</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Decor Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
                    </div>

                </div>
            </div>
        </section>
    );
}
