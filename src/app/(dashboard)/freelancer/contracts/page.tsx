import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Briefcase, Calendar, CheckCircle, Clock, FileText, ChevronRight, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function getContracts(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: { freelancerProfile: true }
    });

    if (!user || !user.freelancerProfile) return [];

    return db.contract.findMany({
        where: {
            freelancerId: user.freelancerProfile.id
        },
        include: {
            client: {
                include: { user: { select: { name: true, image: true } } }
            }
        }
    });
}

export default async function FreelancerContractsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const contracts = await getContracts(session.user.id);

    return (
        <DashboardShell role="freelancer">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Contracts</h1>
                        <p className="text-zinc-400">Manage your active and past contracts</p>
                    </div>
                </div>

                {contracts.length === 0 ? (
                    <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
                        <Briefcase className="w-16 h-16 text-white/10 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No contracts yet</h3>
                        <p className="text-zinc-500 max-w-md mx-auto mb-6">
                            When you accept a job offer, your contracts will appear here.
                        </p>
                        <Link href="/freelancer/find-work">
                            <GlassButton variant="primary" asDiv>Find Work</GlassButton>
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="grid gap-4">
                        {contracts.map((contract) => {
                            const statusColors = {
                                'DRAFT': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                'ACTIVE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                'COMPLETED': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                                'REJECTED': 'text-red-400 bg-red-500/10 border-red-500/20',
                                'ACCEPTED': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                                'CANCELLED': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
                                'CLOSED': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
                                'DISPUTED': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                                'FINALIZED': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                                'FUNDED': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                'PENDING_REVIEW': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                            }[contract.status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';

                            return (
                                <GlassCard key={contract.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <FileText className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                                {contract.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {contract.client.user.name || 'Client'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(contract.startDate || contract.acceptedAt || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end md:self-auto">
                                        <div className="text-right mr-2">
                                            <div className={`text-xs font-medium px-2.5 py-1 rounded-full border mb-1 inline-flex ${statusColors}`}>
                                                {contract.status}
                                            </div>
                                            <div className="text-xs text-zinc-500 font-mono">
                                                {contract.type}
                                            </div>
                                        </div>

                                        <Link href={`/freelancer/contracts/${contract.id}`}>
                                            <GlassButton variant="secondary" size="sm" className="group/btn" asDiv>
                                                View Details
                                                <ChevronRight className="w-4 h-4 ml-1 text-zinc-500 group-hover/btn:text-white transition-colors" />
                                            </GlassButton>
                                        </Link>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
