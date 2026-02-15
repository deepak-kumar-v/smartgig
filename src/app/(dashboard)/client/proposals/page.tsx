import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Briefcase, User, Calendar, DollarSign, CheckCircle, Beaker } from 'lucide-react';
import Image from 'next/image';
import { createTrialContract } from '@/app/actions/contracts';
import { EmptyState } from '@/components/ui/empty-state';

async function getProposals(userId: string) {
    const client = await db.clientProfile.findUnique({
        where: { userId }
    });

    if (!client) return [];

    return db.proposal.findMany({
        where: {
            job: { clientId: client.id }
        },
        include: {
            job: true,
            freelancer: {
                include: {
                    user: { select: { name: true, image: true, trustScore: true } }
                }
            }
        },
        orderBy: {
            freelancer: { user: { trustScore: 'desc' } }
        }
    });
}

export default async function ClientProposalsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const proposals = await getProposals(session.user.id);

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Received Proposals</h1>
                <p className="text-zinc-400">Review applications and request paid trials before hiring.</p>
            </div>

            {proposals.length === 0 ? (
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
                <div className="space-y-6">
                    {proposals.map((proposal) => (
                        <GlassCard key={proposal.id} className="p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                            {proposal.freelancer.user.image && (
                                                <Image
                                                    src={proposal.freelancer.user.image}
                                                    alt="User"
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {proposal.freelancer.user.name}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                    {proposal.freelancer.user.trustScore.toFixed(0)} Trust
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                Applied for <span className="text-white">{proposal.job.title}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-800/30 rounded-xl p-4 mb-4 text-zinc-300 text-sm whitespace-pre-wrap font-mono">
                                        {proposal.coverLetter}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        <span>Price: ${proposal.proposedRate}</span>
                                        {/* <span>Est. Duration: {proposal.duration}</span> */}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[140px]">
                                    <GlassButton variant="primary" size="sm" className="w-full">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Hire Now
                                    </GlassButton>

                                    <form action={createTrialContract as any}>
                                        <input type="hidden" name="proposalId" value={proposal.id} />
                                        <input type="hidden" name="freelancerId" value={proposal.freelancerId} />
                                        <input type="hidden" name="clientId" value={proposal.job.clientId} />
                                        <input type="hidden" name="jobId" value={proposal.jobId} />

                                        <GlassButton variant="secondary" size="sm" className="w-full group border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/10">
                                            <Beaker className="w-4 h-4 mr-2 text-violet-400 group-hover:text-violet-300" />
                                            <span className="text-violet-200">Request Trial</span>
                                        </GlassButton>
                                    </form>

                                    <GlassButton variant="ghost" size="sm" className="w-full text-zinc-500 hover:text-white">
                                        Message
                                    </GlassButton>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </>
    );
}
