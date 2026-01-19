'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/glass-button';
import { Plus, Users, Briefcase, MessageSquare, Clock } from 'lucide-react';

export default function ClientDashboard() {
    return (
        <DashboardShell role="client">
            <div className="space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Hiring</h1>
                        <p className="text-white/50">Manage your job posts and contracts.</p>
                    </div>
                    <Link href="/client/post-job">
                        <GlassButton variant="primary">
                            <Plus className="w-4 h-4 mr-2" /> Post a Job
                        </GlassButton>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">4</div>
                                <div className="text-xs text-white/50">Active Job Posts</div>
                            </div>
                        </div>
                        <Link href="/client/jobs" className="text-xs text-indigo-300 mt-2 hover:underline cursor-pointer block">View all jobs →</Link>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">18</div>
                                <div className="text-xs text-white/50">New Proposals</div>
                            </div>
                        </div>
                        <Link href="/client/proposals" className="text-xs text-cyan-300 mt-2 hover:underline cursor-pointer block">Review candidates →</Link>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">$4.5k</div>
                                <div className="text-xs text-white/50">In Escrow</div>
                            </div>
                        </div>
                        <Link href="/client/contracts" className="text-xs text-green-300 mt-2 hover:underline cursor-pointer block">Manage payments →</Link>
                    </GlassCard>
                </div>

                {/* Recent Activity / Applications */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Proposals</h3>
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <GlassCard key={i} variant="hoverable" className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/70">
                                    {i === 1 ? 'DK' : i === 2 ? 'SL' : 'RJ'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-medium text-white">Senior Frontend Dev {i}</h4>
                                        <span className="text-xs text-white/40">2h ago</span>
                                    </div>
                                    <p className="text-sm text-white/60">Applied for: <span className="text-indigo-300">E-Commerce Redesign</span></p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-white/50">React</span>
                                        <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-white/50">Node.js</span>
                                        <span className="text-xs font-semibold text-green-400">$65/hr</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <GlassButton size="sm" variant="ghost">Pass</GlassButton>
                                    <GlassButton size="sm" variant="secondary">Message</GlassButton>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
