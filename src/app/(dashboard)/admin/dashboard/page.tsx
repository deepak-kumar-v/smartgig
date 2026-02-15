'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ShieldAlert, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <>
            <div className="space-y-8">

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded">SUPER ADMIN</span>
                        <span className="text-white/40 text-xs">v1.2.0</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
                </div>

                {/* Risk Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 border-l-4 border-l-rose-500">
                        <div className="flex justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">12</div>
                                <div className="text-xs text-white/50">Active Disputes</div>
                            </div>
                            <AlertTriangle className="text-rose-500 w-5 h-5" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4 border-l-4 border-l-orange-500">
                        <div className="flex justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">5</div>
                                <div className="text-xs text-white/50">Flagged Users</div>
                            </div>
                            <ShieldAlert className="text-orange-500 w-5 h-5" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4 border-l-4 border-l-green-500">
                        <div className="flex justify-between">
                            <div>
                                <div className="text-2xl font-bold text-white">$142k</div>
                                <div className="text-xs text-white/50">Total Escrow</div>
                            </div>
                            <CheckCircle className="text-green-500 w-5 h-5" />
                        </div>
                    </GlassCard>
                </div>

                <GlassCard className="p-6">
                    <h3 className="font-semibold text-white mb-4">Live System Events</h3>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-white/5 rounded">
                                <Activity className="w-4 h-4 text-white/30" />
                                <span className="text-white/40 w-20 font-mono text-xs">10:42:{10 + i}</span>
                                <span className="text-white/80">User <span className="text-indigo-400">@crypto_dev</span> verification successful.</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

            </div>
        </>
    );
}
