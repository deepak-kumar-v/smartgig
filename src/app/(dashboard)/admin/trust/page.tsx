import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    Shield, AlertTriangle, Users, Ban, CheckCircle,
    Clock, Eye, Search, Filter, ChevronRight, Scale,
    AlertCircle, UserX, FileText
} from 'lucide-react';

async function getTrustData() {
    const [
        totalStrikes,
        activeStrikes,
        pendingAppeals,
        recentStrikes,
        suspendedUsers
    ] = await Promise.all([
        db.strike.count(),
        db.strike.count({ where: { isActive: true } }), // Using isActive instead of expiresAt
        Promise.resolve(0), // Appeal model not available - return 0
        db.strike.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } }
                // appeals relation not available
            }
        }),
        db.user.count({ where: { trustScore: { lt: 50 } } })
    ]);

    return { totalStrikes, activeStrikes, pendingAppeals, recentStrikes, suspendedUsers };
}

function getSeverityConfig(severity: string | number) {
    const severityNum = typeof severity === 'string' ? parseInt(severity, 10) || 1 : severity;
    switch (severityNum) {
        case 1: return { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/20' };
        case 2: return { label: 'Minor', color: 'text-orange-400', bg: 'bg-orange-500/20' };
        case 3: return { label: 'Moderate', color: 'text-rose-400', bg: 'bg-rose-500/20' };
        case 4: return { label: 'Severe', color: 'text-red-400', bg: 'bg-red-500/20' };
        case 5: return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-600/20' };
        default: return { label: 'Unknown', color: 'text-zinc-400', bg: 'bg-zinc-500/20' };
    }
}

export default async function TrustSafetyPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/login');
    }

    const data = await getTrustData();

    return (
        <DashboardShell role="admin">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Trust & Safety</h1>
                        <p className="text-zinc-400">
                            Manage violations, strikes, and appeals across the platform
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <GlassButton variant="secondary">
                            <FileText className="w-4 h-4 mr-2" />
                            Export Report
                        </GlassButton>
                        <GlassButton variant="primary">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Issue Strike
                        </GlassButton>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{data.activeStrikes}</div>
                                <div className="text-xs text-zinc-500">Active Strikes</div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-violet-500/20">
                                <Scale className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{data.pendingAppeals}</div>
                                <div className="text-xs text-zinc-500">Pending Appeals</div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-rose-500/20">
                                <UserX className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{data.suspendedUsers}</div>
                                <div className="text-xs text-zinc-500">Low Trust Users</div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20">
                                <Shield className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{data.totalStrikes}</div>
                                <div className="text-xs text-zinc-500">Total Strikes Ever</div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Strike System Explanation */}
                <GlassCard className="p-6 border-violet-500/20 bg-violet-500/5">
                    <h3 className="text-lg font-semibold text-white mb-4">N-Strike Progressive System</h3>
                    <div className="grid grid-cols-5 gap-4">
                        {[
                            { strikes: 1, action: 'Warning', desc: 'Email notification', icon: AlertCircle, color: 'amber' },
                            { strikes: 2, action: 'Restriction', desc: 'Limited features', icon: AlertTriangle, color: 'orange' },
                            { strikes: 3, action: 'Suspension', desc: '7-day suspension', icon: Clock, color: 'rose' },
                            { strikes: 4, action: 'Extended', desc: '30-day suspension', icon: UserX, color: 'red' },
                            { strikes: 5, action: 'Ban', desc: 'Permanent ban', icon: Ban, color: 'red' },
                        ].map((level, idx) => (
                            <div key={idx} className="text-center">
                                <div className={`w-12 h-12 rounded-xl bg-${level.color}-500/20 flex items-center justify-center mx-auto mb-2`}>
                                    <level.icon className={`w-6 h-6 text-${level.color}-400`} />
                                </div>
                                <div className="text-lg font-bold text-white">{level.strikes}</div>
                                <div className="text-sm text-white font-medium">{level.action}</div>
                                <div className="text-xs text-zinc-500">{level.desc}</div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Strikes */}
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Recent Strikes</h3>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Search user..."
                                            className="pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 w-48"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.recentStrikes.length > 0 ? (
                                    data.recentStrikes.map((strike) => {
                                        const severity = getSeverityConfig(strike.severity);
                                        const isExpired = !strike.isActive; // Using isActive field
                                        const hasAppeal = false; // Appeals not available

                                        return (
                                            <div
                                                key={strike.id}
                                                className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium">
                                                            {strike.user.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-white">
                                                                    {strike.user.name || strike.user.email}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-xs ${severity.bg} ${severity.color}`}>
                                                                    {severity.label}
                                                                </span>
                                                                {isExpired && (
                                                                    <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-400">
                                                                        Expired
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-zinc-400 mt-1">{strike.reason}</p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                                                <span>{strike.user.role}</span>
                                                                <span>•</span>
                                                                <span>{new Date(strike.createdAt).toLocaleDateString()}</span>
                                                                {hasAppeal && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-violet-400">Has appeal</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8">
                                        <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-zinc-500">No strikes issued yet</p>
                                        <p className="text-xs text-zinc-600 mt-1">The community is behaving well!</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Appeals Queue */}
                    <div>
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Pending Appeals</h3>
                                <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                                    {data.pendingAppeals} pending
                                </span>
                            </div>

                            {data.pendingAppeals > 0 ? (
                                <div className="space-y-3">
                                    {/* Appeals would be listed here */}
                                    <div className="p-4 bg-zinc-800/50 rounded-xl">
                                        <p className="text-sm text-zinc-400 text-center">
                                            Appeals will appear here when users contest their strikes
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Scale className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500">No pending appeals</p>
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-zinc-800">
                                <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
                                <div className="space-y-2">
                                    <button className="w-full p-3 flex items-center gap-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm text-zinc-300">Issue Warning</span>
                                    </button>
                                    <button className="w-full p-3 flex items-center gap-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                                        <UserX className="w-4 h-4 text-rose-400" />
                                        <span className="text-sm text-zinc-300">Suspend User</span>
                                    </button>
                                    <button className="w-full p-3 flex items-center gap-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors text-left">
                                        <Eye className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-zinc-300">View Device Logs</span>
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
