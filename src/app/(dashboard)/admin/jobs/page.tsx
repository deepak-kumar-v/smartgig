import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { db } from '@/lib/db';
import {
    Briefcase, Search, Filter, MoreVertical,
    Eye, Trash2, CheckCircle, AlertTriangle,
    DollarSign, MapPin, Calendar, User
} from 'lucide-react';
import Link from 'next/link';

async function getJobs() {
    const jobs = await db.jobPost.findMany({
        include: {
            client: {
                select: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            },
            _count: {
                select: { proposals: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    return jobs;
}

export default async function AdminJobsPage() {
    const jobs = await getJobs();

    const stats = {
        total: jobs.length,
        open: jobs.filter(j => j.status === 'OPEN').length,
        inProgress: jobs.filter(j => j.status === 'IN_PROGRESS').length,
        completed: jobs.filter(j => j.status === 'COMPLETED').length,
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Job Moderation</h1>
                        <p className="text-sm text-zinc-400">Review and manage job postings</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/20">
                                <Briefcase className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.total}</div>
                                <div className="text-xs text-zinc-500">Total Jobs</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.open}</div>
                                <div className="text-xs text-zinc-500">Open</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <AlertTriangle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
                                <div className="text-xs text-zinc-500">In Progress</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-zinc-500/20">
                                <CheckCircle className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.completed}</div>
                                <div className="text-xs text-zinc-500">Completed</div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search jobs by title..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:border-zinc-700 text-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {/* Jobs List */}
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <GlassCard key={job.id} className="p-5 hover:border-zinc-700 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Link
                                            href={`/job/${job.id}`}
                                            className="text-lg font-semibold text-white hover:text-violet-400 transition-colors truncate"
                                        >
                                            {job.title}
                                        </Link>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${job.status === 'OPEN'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : job.status === 'IN_PROGRESS'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-zinc-500/20 text-zinc-400'
                                            }`}>
                                            {job.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                                        {job.overview}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" />
                                            {job.client?.user?.name || 'Unknown Client'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            ${job.budgetMax}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {job.isRemote ? 'Remote' : 'On-site'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 text-violet-400">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {job._count.proposals} proposals
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/job/${job.id}`}
                                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                        title="View Job"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    <button
                                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                                        title="Approve"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                        title="More Actions"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {jobs.length === 0 && (
                    <GlassCard className="p-12 text-center">
                        <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500">No jobs found</p>
                    </GlassCard>
                )}
            </div>
        </>
    );
}
