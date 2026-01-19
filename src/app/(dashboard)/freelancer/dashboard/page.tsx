import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    DollarSign, Briefcase, Star, TrendingUp, Clock,
    Target, BarChart3, Calendar, CheckCircle, AlertTriangle,
    Shield, ArrowUpRight, ArrowDownRight, Minus,
    ChevronRight, Award, Zap
} from 'lucide-react';

async function getFreelancerData(userId: string) {
    const profile = await db.freelancerProfile.findFirst({
        where: { userId },
        include: {
            reputation: true,
            skills: true,
            contracts: {
                include: {
                    milestones: true,
                    escrowAccount: true,
                }
            },
            proposals: {
                include: {
                    job: true,
                }
            },
            portfolio: true,
        }
    });

    return profile;
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendValue
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}) {
    return (
        <GlassCard className="p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-400' :
                        trend === 'down' ? 'text-rose-400' : 'text-zinc-500'
                        }`}>
                        {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                        {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                        {trend === 'neutral' && <Minus className="w-3 h-3" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
        </GlassCard>
    );
}

function ReputationMeter({ label, value, maxValue = 100, color }: {
    label: string;
    value: number;
    maxValue?: number;
    color: string;
}) {
    const percentage = (value / maxValue) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span className="text-white font-medium">{value.toFixed(0)}%</span>
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

function SkillProgressCard({ skill, level, projects }: { skill: string; level: number; projects: number }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">{skill}</span>
                    <span className="text-xs text-zinc-500">{projects} projects</span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                        style={{ width: `${level}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default async function FreelancerDashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    const profile = await getFreelancerData(session.user.id);

    // Calculate analytics
    const completedContracts = profile?.contracts.filter(c => c.status === 'COMPLETED') || [];
    const activeContracts = profile?.contracts.filter(c => c.status === 'IN_PROGRESS') || [];
    const pendingProposals = profile?.proposals.filter(p => p.status === 'PENDING') || [];
    const acceptedProposals = profile?.proposals.filter(p => p.status === 'ACCEPTED') || [];

    // Earnings calculation
    const totalEarnings = completedContracts.reduce((sum, c) => sum + c.totalBudget, 0);
    const pendingEarnings = activeContracts.reduce((sum, c) => sum + c.totalBudget, 0);

    // Reputation metrics
    const reputation = profile?.reputation;
    const trustScore = reputation ?
        Math.round((reputation.jobSuccess + reputation.onTime + (reputation.communication * 20)) / 3) : 100;

    // Workload calculation
    const maxConcurrent = profile?.maxConcurrent || 3;
    const currentLoad = activeContracts.length;
    const workloadPercentage = (currentLoad / maxConcurrent) * 100;

    return (
        <DashboardShell role="freelancer">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h1 className="text-2xl font-bold text-white">Career Dashboard</h1>
                            {profile?.availability && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                                    Available
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-400">
                            Welcome back, {session.user.name || 'Freelancer'}. Here&apos;s your career overview.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/freelancer/settings">
                            <GlassButton variant="secondary">Workload Settings</GlassButton>
                        </Link>
                        <Link href="/explore">
                            <GlassButton variant="primary">Find Work</GlassButton>
                        </Link>
                    </div>
                </div>

                {/* Workload Protection Alert */}
                {workloadPercentage >= 80 && (
                    <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-amber-200">
                                    <strong>Workload Alert:</strong> You&apos;re at {workloadPercentage.toFixed(0)}% capacity ({currentLoad}/{maxConcurrent} projects).
                                    Consider adjusting your availability settings.
                                </p>
                            </div>
                            <Link href="/freelancer/settings">
                                <button className="text-sm text-amber-400 hover:text-amber-300 font-medium">
                                    Manage →
                                </button>
                            </Link>
                        </div>
                    </GlassCard>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Earnings"
                        value={`$${totalEarnings.toLocaleString()}`}
                        icon={DollarSign}
                        color="bg-emerald-500/20 text-emerald-400"
                        trend="up"
                        trendValue="+12%"
                    />
                    <StatCard
                        label="Active Projects"
                        value={activeContracts.length.toString()}
                        icon={Briefcase}
                        color="bg-blue-500/20 text-blue-400"
                    />
                    <StatCard
                        label="Trust Score"
                        value={`${trustScore}%`}
                        icon={Shield}
                        color="bg-violet-500/20 text-violet-400"
                        trend="up"
                        trendValue="+2%"
                    />
                    <StatCard
                        label="Job Success"
                        value={`${reputation?.jobSuccess?.toFixed(0) || 100}%`}
                        icon={Target}
                        color="bg-amber-500/20 text-amber-400"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Career Analytics */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Multi-Dimensional Reputation */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Reputation Metrics</h3>
                                    <p className="text-sm text-zinc-500">Multi-dimensional trust scoring</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-400" />
                                    <span className="text-lg font-bold text-white">{trustScore}%</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ReputationMeter
                                    label="Delivery Timeliness"
                                    value={reputation?.onTime || 100}
                                    color="bg-emerald-500"
                                />
                                <ReputationMeter
                                    label="Job Success Rate"
                                    value={reputation?.jobSuccess || 100}
                                    color="bg-blue-500"
                                />
                                <ReputationMeter
                                    label="Communication Quality"
                                    value={(reputation?.communication || 5) * 20}
                                    color="bg-violet-500"
                                />
                                <ReputationMeter
                                    label="Revision Handling"
                                    value={95}
                                    color="bg-amber-500"
                                />
                            </div>

                            <div className="mt-6 pt-4 border-t border-zinc-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Disputes this year</span>
                                    <span className="text-white font-medium">{reputation?.disputeCount || 0}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Active Contracts with Milestone Progress */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Active Contracts</h3>
                                <Link href="/freelancer/contracts" className="text-sm text-violet-400 hover:text-violet-300">
                                    View All
                                </Link>
                            </div>

                            {activeContracts.length > 0 ? (
                                <div className="space-y-4">
                                    {activeContracts.slice(0, 3).map((contract) => {
                                        const completedMilestones = contract.milestones.filter(m => m.status === 'COMPLETED').length;
                                        const totalMilestones = contract.milestones.length;
                                        const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
                                        const escrowBalance = contract.escrowAccount?.balance || 0;

                                        return (
                                            <div key={contract.id} className="p-4 bg-zinc-800/50 rounded-xl">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-medium text-white">{contract.title}</h4>
                                                        <p className="text-xs text-zinc-500">
                                                            Milestone {completedMilestones} of {totalMilestones}
                                                        </p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                                        In Progress
                                                    </span>
                                                </div>

                                                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-zinc-500">{progress.toFixed(0)}% complete</span>
                                                    <span className="text-emerald-400">${escrowBalance.toLocaleString()} in escrow</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">No active contracts</p>
                                    <Link href="/explore">
                                        <button className="text-violet-400 text-sm mt-2 hover:text-violet-300">
                                            Find projects →
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Right Column - Skills & Workload */}
                    <div className="space-y-6">
                        {/* Workload Balance */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Workload Balance</h3>

                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="56"
                                        fill="none"
                                        stroke="#27272a"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="64" cy="64" r="56"
                                        fill="none"
                                        stroke={workloadPercentage >= 80 ? '#f59e0b' : workloadPercentage >= 50 ? '#3b82f6' : '#10b981'}
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={`${workloadPercentage * 3.52} 352`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold text-white">{currentLoad}</span>
                                        <span className="text-zinc-500 text-sm">/{maxConcurrent}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-sm text-zinc-400">
                                {maxConcurrent - currentLoad} slots available
                            </p>

                            <Link href="/freelancer/settings">
                                <button className="w-full mt-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                                    Manage Availability
                                </button>
                            </Link>
                        </GlassCard>

                        {/* Skill Progression */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Skill Growth</h3>
                                <BarChart3 className="w-5 h-5 text-zinc-500" />
                            </div>

                            <div className="space-y-3">
                                {profile?.skills.slice(0, 4).map((skill, idx) => (
                                    <SkillProgressCard
                                        key={skill.id}
                                        skill={skill.name}
                                        level={80 - idx * 10}
                                        projects={5 - idx}
                                    />
                                ))}

                                {(!profile?.skills || profile.skills.length === 0) && (
                                    <p className="text-sm text-zinc-500 text-center py-4">
                                        Add skills to track your growth
                                    </p>
                                )}
                            </div>
                        </GlassCard>

                        {/* Pending Proposals */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Proposals</h3>
                                <span className="text-sm text-zinc-500">{pendingProposals.length} pending</span>
                            </div>

                            <div className="space-y-2">
                                {pendingProposals.slice(0, 3).map((proposal) => (
                                    <Link
                                        key={proposal.id}
                                        href={`/job/${proposal.jobId}`}
                                        className="block p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-white truncate">{proposal.job.title}</span>
                                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                            <span>${proposal.price}</span>
                                            <span>•</span>
                                            <span className="text-amber-400">Pending</span>
                                        </div>
                                    </Link>
                                ))}

                                {pendingProposals.length === 0 && (
                                    <p className="text-sm text-zinc-500 text-center py-4">
                                        No pending proposals
                                    </p>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
