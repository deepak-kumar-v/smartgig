'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/glass-button';
import {
    Plus, Users, Briefcase, DollarSign,
    ArrowUpRight, ArrowDownRight, ChevronRight,
    CheckCircle, FileText, Star, TrendingUp,
    Calendar
} from 'lucide-react';

// Types
export interface DashboardStats {
    activeJobsCount: number;
    newProposalsCount: number;
    escrowAmount: number;
    hiredCount: number;
}

export interface ProposalItem {
    id: string;
    freelancerName: string;
    freelancerInitials: string;
    role: string;
    jobTitle: string;
    rate: number;
    skills: string[];
    trustScore: number;
    submittedAt: string;
}

export interface JobItem {
    id: string;
    title: string;
    proposalsCount: number;
    budget: number;
    status: string;
}

// Stat Card Component
function StatCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
    href
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    href?: string;
}) {
    const content = (
        <GlassCard className="p-5 hover:border-white/20 transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</div>
        </GlassCard>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

// Progress Bar Component
function HiringProgress({ label, current, total, color }: {
    label: string;
    current: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white font-medium">{current}/{total}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export function ClientDashboardView({
    stats,
    recentProposals,
    activeJobs
}: {
    stats: DashboardStats,
    recentProposals: ProposalItem[],
    activeJobs: JobItem[]
}) {
    return (
        <DashboardShell role="client">
            <div className="space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-bold text-white">Hiring Dashboard</h1>
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">
                                Pro Plan
                            </span>
                        </div>
                        <p className="text-zinc-400">
                            Manage your job posts, review candidates, and track contracts.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/client/contracts">
                            <GlassButton variant="secondary" asDiv>View Contracts</GlassButton>
                        </Link>
                        <Link href="/client/post-job">
                            <GlassButton variant="primary" asDiv>
                                <Plus className="w-4 h-4 mr-2" /> Post a Job
                            </GlassButton>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Active Job Posts"
                        value={stats.activeJobsCount.toString()}
                        icon={Briefcase}
                        color="bg-indigo-500/20 text-indigo-400"
                        href="/client/jobs"
                    />
                    <StatCard
                        label="New Proposals"
                        value={stats.newProposalsCount.toString()}
                        icon={Users}
                        color="bg-cyan-500/20 text-cyan-400"
                        trend="up"
                        // trendValue="+5 today" // Removed hardcoded trend
                        href="/client/proposals"
                    />
                    <StatCard
                        label="In Escrow"
                        value={`$${(stats.escrowAmount ?? 0).toLocaleString()}`}
                        icon={DollarSign}
                        color="bg-emerald-500/20 text-emerald-400"
                        href="/client/contracts"
                    />
                    <StatCard
                        label="Hired This Month"
                        value={stats.hiredCount.toString()}
                        icon={CheckCircle}
                        color="bg-violet-500/20 text-violet-400"
                    // trend="up"
                    // trendValue="+2"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Recent Proposals */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Recent Proposals</h3>
                                    <p className="text-sm text-zinc-500">Candidates waiting for your review</p>
                                </div>
                                <Link href="/client/proposals" className="text-sm text-indigo-400 hover:text-indigo-300">
                                    View All
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {recentProposals.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500">
                                        No recent proposals found.
                                    </div>
                                ) : (
                                    recentProposals.map((proposal) => (
                                        <div key={proposal.id} className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                                    {proposal.freelancerInitials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-white">{proposal.freelancerName}</h4>
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded text-xs text-emerald-400">
                                                            <Star className="w-3 h-3 fill-emerald-400" />
                                                            {proposal.trustScore}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-zinc-400">{proposal.role}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        Applied for: <span className="text-indigo-300">{proposal.jobTitle}</span>
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        {proposal.skills.map((skill) => (
                                                            <span key={skill} className="text-xs bg-white/5 px-2 py-1 rounded text-white/60 border border-white/5">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        <span className="text-xs font-semibold text-emerald-400">${proposal.rate}/hr</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs text-zinc-500">{proposal.submittedAt}</span>
                                                    <div className="flex gap-2">
                                                        <GlassButton size="sm" variant="primary">Review</GlassButton>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>

                        {/* Active Jobs */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Active Job Posts</h3>
                                <Link href="/client/jobs" className="text-sm text-indigo-400 hover:text-indigo-300">
                                    Manage Jobs
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {activeJobs.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500">
                                        No active job posts.
                                    </div>
                                ) : (
                                    activeJobs.map((job) => (
                                        <Link key={job.id} href={`/client/jobs/${job.id}`} className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-white">{job.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                        <span>{job.proposalsCount} proposals</span>
                                                        <span>•</span>
                                                        <span>${(job.budget ?? 0).toLocaleString()} budget</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${job.status === 'reviewing' ? 'bg-amber-500/20 text-amber-400' :
                                                        job.status === 'interviewing' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-emerald-500/20 text-emerald-400'
                                                        }`}>
                                                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column - Hiring Metrics */}
                    <div className="space-y-6">
                        {/* Hiring Pipeline */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Hiring Pipeline</h3>
                            <div className="space-y-4">
                                <HiringProgress
                                    label="Proposals Received"
                                    current={stats.newProposalsCount}
                                    total={50}
                                    color="bg-cyan-500"
                                />
                                <HiringProgress
                                    label="Interviews Scheduled"
                                    current={0}
                                    total={18}
                                    color="bg-indigo-500"
                                />
                                <HiringProgress
                                    label="Contracts Started"
                                    current={stats.hiredCount}
                                    total={5}
                                    color="bg-emerald-500"
                                />
                            </div>
                        </GlassCard>

                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link href="/client/post-job" className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <div className="p-2 rounded-lg bg-indigo-500/20">
                                        <Plus className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span className="text-sm text-zinc-300">Post New Job</span>
                                </Link>
                                <Link href="/client/proposals" className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <div className="p-2 rounded-lg bg-cyan-500/20">
                                        <Users className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <span className="text-sm text-zinc-300">Review Proposals</span>
                                </Link>
                                <Link href="/client/contracts" className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="text-sm text-zinc-300">Manage Contracts</span>
                                </Link>
                                <Link href="/messages" className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                                    <div className="p-2 rounded-lg bg-violet-500/20">
                                        <Calendar className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <span className="text-sm text-zinc-300">Schedule Interview</span>
                                </Link>
                            </div>
                        </GlassCard>

                        {/* Spending Summary */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">This Month</h3>
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Total Spent</span>
                                    <span className="text-white font-medium">$0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">In Escrow</span>
                                    <span className="text-white font-medium">${(stats.escrowAmount ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Freelancers Hired</span>
                                    <span className="text-white font-medium">{stats.hiredCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Jobs Completed</span>
                                    <span className="text-white font-medium">0</span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
