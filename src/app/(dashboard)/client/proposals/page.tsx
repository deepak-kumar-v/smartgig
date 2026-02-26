import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Briefcase, User, DollarSign, Clock, ChevronRight, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ProposalWithJob {
    id: string;
    coverLetter: string;
    proposedRate: number;
    rateType: string;
    availability: string | null;
    status: string;
    createdAt: Date;
    freelancer: {
        title: string | null;
        user: { name: string | null; image: string | null; trustScore: number; };
    };
    job: {
        id: string;
        title: string;
        status: string;
    };
}

interface JobGroup {
    jobId: string;
    jobTitle: string;
    jobStatus: string;
    proposals: ProposalWithJob[];
}

async function getGroupedProposals(userId: string): Promise<JobGroup[]> {
    const client = await db.clientProfile.findUnique({
        where: { userId }
    });

    if (!client) return [];

    const proposals = await db.proposal.findMany({
        where: {
            job: { clientId: client.id }
        },
        include: {
            job: { select: { id: true, title: true, status: true } },
            freelancer: {
                include: {
                    user: { select: { name: true, image: true, trustScore: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Group by job
    const groupMap = new Map<string, JobGroup>();
    for (const p of proposals) {
        if (!groupMap.has(p.job.id)) {
            groupMap.set(p.job.id, {
                jobId: p.job.id,
                jobTitle: p.job.title,
                jobStatus: p.job.status,
                proposals: []
            });
        }
        groupMap.get(p.job.id)!.proposals.push(p);
    }

    return Array.from(groupMap.values());
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        case 'ACCEPTED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'REJECTED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
        case 'WITHDRAWN': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
}

function jobStatusBadgeClass(status: string): string {
    switch (status) {
        case 'OPEN': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
        case 'CLOSED': return 'border-red-500/20 bg-red-500/10 text-red-400';
        case 'PAUSED': return 'border-amber-500/20 bg-amber-500/10 text-amber-400';
        default: return 'border-zinc-700 bg-zinc-800 text-zinc-400';
    }
}

export default async function ClientProposalsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const jobGroups = await getGroupedProposals(session.user.id);
    const totalProposals = jobGroups.reduce((sum, g) => sum + g.proposals.length, 0);

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Received Proposals</h1>
                <p className="text-zinc-400">
                    {totalProposals} proposal{totalProposals !== 1 ? 's' : ''} across {jobGroups.length} job{jobGroups.length !== 1 ? 's' : ''}
                </p>
            </div>

            {jobGroups.length === 0 ? (
                <EmptyState
                    title="No Proposals Yet"
                    description="Post a job to start receiving proposals from top talent."
                    icon={Briefcase}
                    action={{
                        label: "Post a Job",
                        href: "/client/post-job"
                    }}
                />
            ) : (
                <div className="space-y-8">
                    {jobGroups.map((group) => (
                        <GlassCard key={group.jobId} className="p-0 overflow-hidden">
                            {/* Job Header */}
                            <a
                                href={`/client/jobs/${group.jobId}`}
                                className="flex items-center justify-between p-5 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
                                        <Briefcase className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                                            {group.jobTitle}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${jobStatusBadgeClass(group.jobStatus)}`}>
                                                {group.jobStatus}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {group.proposals.length} proposal{group.proposals.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                            </a>

                            {/* Proposals List */}
                            <div className="divide-y divide-zinc-800/30">
                                {group.proposals.map((proposal) => (
                                    <a
                                        key={proposal.id}
                                        href={`/client/proposals/${proposal.id}`}
                                        className="flex items-center justify-between gap-4 p-4 px-5 hover:bg-zinc-800/20 transition-colors group/card"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {proposal.freelancer.user.image ? (
                                                    <img src={proposal.freelancer.user.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-zinc-500" />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-white text-sm truncate">
                                                        {proposal.freelancer.user.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                                        {proposal.freelancer.user.trustScore.toFixed(0)} Trust
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${statusBadgeClass(proposal.status)}`}>
                                                        {proposal.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-500 truncate mt-0.5">
                                                    {proposal.coverLetter.substring(0, 120)}{proposal.coverLetter.length > 120 ? '…' : ''}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-600">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        ${proposal.proposedRate} {proposal.rateType === 'HOURLY' ? '/hr' : 'fixed'}
                                                    </span>
                                                    {proposal.availability && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {proposal.availability}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* View Proposal — always visible */}
                                        <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover/card:text-white transition-colors shrink-0 whitespace-nowrap">
                                            View Proposal <ChevronRight className="w-3.5 h-3.5" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </>
    );
}
