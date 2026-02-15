import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Briefcase, Plus, ChevronRight, Users, DollarSign } from 'lucide-react';

export default async function ClientJobsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    let jobs: {
        id: string;
        title: string;
        overview: string | null;
        budgetMax: number | null;
        status: string;
        createdAt: Date;
        _count: { proposals: number };
    }[] = [];

    try {
        // Get client profile and their jobs
        const client = await db.clientProfile.findUnique({
            where: { userId },
            include: {
                jobPosts: {
                    include: {
                        _count: { select: { proposals: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (client) {
            jobs = client.jobPosts;
        }
    } catch (error) {
        console.error('[Client Jobs] Database error:', error);
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Jobs</h1>
                        <p className="text-zinc-400">Manage all your job postings</p>
                    </div>
                    <Link href="/client/post-job">
                        <GlassButton variant="primary" asDiv>
                            <Plus className="w-4 h-4 mr-2" /> Post New Job
                        </GlassButton>
                    </Link>
                </div>

                {/* Jobs List */}
                {jobs.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No jobs posted yet</h3>
                        <p className="text-zinc-400 mb-6">Post your first job to start finding talent</p>
                        <Link href="/client/post-job">
                            <GlassButton variant="primary" asDiv>
                                <Plus className="w-4 h-4 mr-2" /> Post a Job
                            </GlassButton>
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <Link key={job.id} href={`/client/jobs/${job.id}`}>
                                <GlassCard className="p-5 hover:border-white/20 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    job.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                                        job.status === 'COMPLETED' ? 'bg-violet-500/20 text-violet-400' :
                                                            'bg-zinc-500/20 text-zinc-400'
                                                    }`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                                                {job.overview}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {job._count.proposals} proposals
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    ${(job.budgetMax ?? 0).toLocaleString()}
                                                </span>
                                                <span>
                                                    Posted {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-500 ml-4 flex-shrink-0" />
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
