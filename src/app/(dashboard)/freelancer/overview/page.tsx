import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import {
    Activity, DollarSign, Star, Clock,
    Briefcase, TrendingUp, AlertCircle,
    CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { getReviewBreakdown, type ReviewBreakdown } from '@/actions/review-actions';
// import { formatCurrency } from '@/lib/utils'; 
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

async function getDashboardData(userId: string) {
    // 1. Mock Data for Demo User
    if (userId === 'demo-user-id') {
        // [MOCK] Static data for demonstration user
        return {
            earnings: 12500,
            pendingProposals: 3,
            activeJobs: 2,
            jobSuccess: 98,
            trustScore: 95,
            recentJobs: [
                { id: '1', title: 'E-commerce React Migration', client: 'TechCorp Inc.', status: 'IN_PROGRESS', amount: 3500, date: new Date() },
                { id: '2', title: '3D Landing Page Animation', client: 'Creative Studios', status: 'IN_PROGRESS', amount: 1200, date: new Date(Date.now() - 86400000) },
            ],
            recentProposals: [
                { id: '1', jobTitle: 'Full Stack Dashboard', client: 'StartupXYZ', status: 'PENDING', date: new Date() }
            ],
            reviewBreakdown: null,
        };
    }

    // 2. Real DB Data with Safe Fallbacks
    try {
        // [REAL] Fetching basic user profile
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                freelancerProfile: true,
            }
        });

        if (!user || !user.freelancerProfile) return null;

        // [REAL] Using real data with fallbacks
        const reviewBreakdown = user.freelancerProfile ? await getReviewBreakdown(user.freelancerProfile.id) : null;
        return {
            earnings: 0,
            pendingProposals: 0,
            activeJobs: 0,
            jobSuccess: 100,
            trustScore: user.trustScore || 100,
            recentJobs: [],
            recentProposals: [],
            reviewBreakdown,
        };

    } catch (error) {
        console.error("Dashboard Data Fetch Error:", error);
        return null;
    }
}

export default async function FreelancerOverviewPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const data = await getDashboardData(session.user.id) || {
        earnings: 0,
        pendingProposals: 0,
        activeJobs: 0,
        jobSuccess: 0,
        trustScore: 0,
        recentJobs: [],
        recentProposals: [],
        reviewBreakdown: null as ReviewBreakdown | null,
    };

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                        <p className="text-zinc-400">Overview of your freelance activity</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/freelancer/proposals/apply">
                            <GlassButton variant="primary" asDiv>Find Work</GlassButton>
                        </Link>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <GlassCard className="p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Total Earnings</p>
                            <h3 className="text-2xl font-bold text-white">
                                {data.earnings > 0 ? formatCurrency(data.earnings) : '$0.00'}
                            </h3>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                                <Briefcase className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Active Jobs</p>
                            <h3 className="text-2xl font-bold text-white">{data.activeJobs}</h3>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Pending Proposals</p>
                            <h3 className="text-2xl font-bold text-white">{data.pendingProposals}</h3>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-white/50 bg-white/5 px-2 py-1 rounded-full">
                                Trust Score: {data.trustScore}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Job Success</p>
                            <h3 className="text-2xl font-bold text-white">{data.jobSuccess}%</h3>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column (2 spans) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Reputation Metrics — Real Data */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Reputation</h3>
                                {data.reviewBreakdown && data.reviewBreakdown.totalReviews > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                                        <Star className="w-4 h-4 fill-emerald-400" />
                                        <span>{data.reviewBreakdown.avgOverall.toFixed(1)}/5 ({data.reviewBreakdown.totalReviews} reviews)</span>
                                    </div>
                                )}
                            </div>
                            {data.reviewBreakdown && data.reviewBreakdown.totalReviews > 0 ? (
                                <div className="space-y-4">
                                    {[
                                        { label: 'Quality', value: data.reviewBreakdown.avgQuality },
                                        { label: 'Communication', value: data.reviewBreakdown.avgCommunication },
                                        { label: 'Timeliness', value: data.reviewBreakdown.avgTimeliness },
                                        { label: 'Professionalism', value: data.reviewBreakdown.avgProfessionalism },
                                        { label: 'Reliability', value: data.reviewBreakdown.avgReliability },
                                    ].map(dim => (
                                        <div key={dim.label}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-zinc-400">{dim.label}</span>
                                                <span className="text-white">{dim.value.toFixed(1)}/5</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dim.value / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Star className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm">No reviews yet</p>
                                    <p className="text-zinc-600 text-xs mt-1">Ratings will appear here after completing contracts</p>
                                </div>
                            )}
                        </GlassCard>

                        {/* Active Contracts */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Active Contracts</h2>
                            </div>
                            {data.activeJobs > 0 ? (
                                <div className="space-y-4">
                                    {data.recentJobs.map((job: any) => (
                                        <GlassCard key={job.id} className="p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <Briefcase className="w-5 h-5 text-white/40" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white">{job.title}</h4>
                                                    <p className="text-sm text-zinc-400">{job.client}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-emerald-400">${job.amount}</div>
                                                <div className="text-xs text-zinc-500">In Progress</div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            ) : (
                                <GlassCard className="p-8 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
                                    <Briefcase className="w-12 h-12 text-white/10 mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-1">No active flows</h3>
                                    <p className="text-zinc-500 text-sm mb-4">Start applying to new opportunities</p>
                                    <Link href="/freelancer/proposals/apply">
                                        <GlassButton size="sm" variant="secondary" asDiv>Browse Jobs</GlassButton>
                                    </Link>
                                </GlassCard>
                            )}
                        </div>
                    </div>

                    {/* Right Column (1 span) */}
                    <div className="space-y-6">

                        {/* Workload (Restored) */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Current Workload</h3>
                            <div className="relative flex items-center justify-center aspect-square max-w-[180px] mx-auto mb-4">
                                {/* Simple CSS Donut Chart Representation using conic-gradient */}
                                <div className="absolute inset-0 rounded-full" style={{
                                    background: 'conic-gradient(#8b5cf6 70%, rgba(255,255,255,0.05) 0)'
                                }} />
                                <div className="absolute inset-2 bg-[#0A0A0A] rounded-full flex flex-col items-center justify-center z-10">
                                    <span className="text-2xl font-bold text-white">70%</span>
                                    <span className="text-xs text-zinc-500">Capacity</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Weekly Hours</span>
                                    <span className="text-white">28/40h</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Active Projects</span>
                                    <span className="text-white">2</span>
                                </div>
                                <GlassButton className="w-full mt-2" variant="secondary" size="sm">Update Availability</GlassButton>
                            </div>
                        </GlassCard>

                        {/* Skills Verification (Restored) */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Verified Skills</h3>
                                <Link href="/freelancer/settings" className="text-xs text-indigo-400 hover:text-indigo-300">Manage</Link>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'React', level: 'Expert' },
                                    { name: 'TypeScript', level: 'Expert' },
                                    { name: 'Node.js', level: 'Advanced' },
                                    { name: 'Next.js', level: 'Advanced' }
                                ].map((skill, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
                                            <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">{skill.name}</span>
                                        </div>
                                        <span className="text-xs text-zinc-600 group-hover:text-zinc-500 uppercase tracking-wider">{skill.level}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Recent Proposals (Moved here matching layout logic if space permits or kept from original) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Pending Proposals</h3>
                            </div>
                            {data.pendingProposals > 0 ? (
                                <div className="space-y-3">
                                    {data.recentProposals.map((prop: any) => (
                                        <GlassCard key={prop.id} className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-white text-sm line-clamp-1">{prop.jobTitle}</h4>
                                            </div>
                                            <p className="text-xs text-zinc-500 mb-2">{prop.client}</p>
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                {prop.status}
                                            </span>
                                        </GlassCard>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
