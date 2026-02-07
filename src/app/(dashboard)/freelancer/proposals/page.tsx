import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { FileText, Clock, DollarSign, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export default async function FreelancerProposalsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const freelancer = await db.user.findUnique({
        where: { id: session.user.id },
        select: { freelancerProfile: { select: { id: true } } }
    });

    if (!freelancer?.freelancerProfile) {
        return (
            <DashboardShell role="freelancer">
                <div className="p-8 text-center">
                    <p className="text-zinc-400">Freelancer profile not found. Please complete your profile.</p>
                </div>
            </DashboardShell>
        );
    }

    const proposals = await db.proposal.findMany({
        where: { freelancerId: freelancer.freelancerProfile.id },
        include: {
            job: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    client: { select: { companyName: true, user: { select: { name: true } } } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <DashboardShell role="freelancer">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Proposals</h1>
                        <p className="text-zinc-400">Track and manage your submitted proposals</p>
                    </div>
                    <Link href="/freelancer/find-work">
                        <GlassButton variant="primary" asDiv>Find New Work</GlassButton>
                    </Link>
                </div>

                {proposals.length === 0 ? (
                    <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
                        <FileText className="w-16 h-16 text-white/10 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No proposals yet</h3>
                        <p className="text-zinc-500 max-w-md mx-auto mb-6">
                            You haven't submitted any proposals yet. Browse open jobs to find your next opportunity.
                        </p>
                        <Link href="/freelancer/find-work">
                            <GlassButton size="sm" variant="secondary" asDiv>Browse Jobs</GlassButton>
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="grid gap-4">
                        {proposals.map((proposal) => (
                            <GlassCard key={proposal.id} className="p-6 transition-all hover:bg-white/5 group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                                                <Link href={`/freelancer/jobs/${proposal.jobId}`} className="hover:underline">
                                                    {proposal.job.title}
                                                </Link>
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${proposal.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    proposal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        proposal.status === 'WITHDRAWN' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {proposal.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{proposal.job.client.companyName || proposal.job.client.user.name || 'Private Client'}</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                                <span>
                                                    Proposed: <span className="text-white font-medium">{formatCurrency(proposal.proposedRate)}</span>
                                                    {proposal.rateType === 'HOURLY' ? '/hr' : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-indigo-400" />
                                                <span>Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                                        <Link href={`/freelancer/jobs/${proposal.job.id}`}>
                                            <GlassButton variant="secondary" size="sm" asDiv>View Job</GlassButton>
                                        </Link>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
