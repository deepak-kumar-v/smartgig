import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { FileText, Clock, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

async function getContracts(userId: string) {
    const client = await db.clientProfile.findUnique({
        where: { userId }
    });

    if (!client) return [];

    return db.contract.findMany({
        where: {
            clientId: client.id
        },
        include: {
            freelancer: {
                include: { user: true }
            },
            milestones: true
        },
        orderBy: { startDate: 'desc' }
    });
}

export default async function ClientContractsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const contracts = await getContracts(session.user.id);

    return (
        <DashboardShell role="client">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">My Contracts</h1>
                <p className="text-zinc-400">Manage active projects and monitor trial tasks.</p>
            </div>

            {contracts.length === 0 ? (
                <EmptyState
                    title="No Active Contracts"
                    description="Contracts will appear here once you hire a freelancer. Start by posting a job or browsing services."
                    icon={FileText}
                    action={{
                        label: "Post a Job",
                        href: "/client/post-job"
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {contracts.map((contract: any) => {
                        const isTrial = contract.type === 'TRIAL';
                        return (
                            <GlassCard key={contract.id} className={cn(
                                "relative p-6 transition-all hover:border-violet-500/30",
                                isTrial && "border-l-4 border-l-violet-500"
                            )}>
                                {isTrial && (
                                    <div className="absolute top-4 right-4 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded-md text-xs font-medium text-violet-300 flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        TRIAL TASK
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-white mb-1">{contract.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <span>with {contract.freelancer.user.name}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                        <span>${contract.totalBudget}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Status</span>
                                        <span className={cn(
                                            "font-medium",
                                            contract.status === 'ACTIVE' ? "text-emerald-400" :
                                                contract.status === 'DRAFT' ? "text-amber-400" : "text-white"
                                        )}>
                                            {contract.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Deadline</span>
                                        <span className="text-white">
                                            {new Date(contract.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {isTrial ? (
                                    <div className="p-3 bg-violet-500/5 rounded-xl border border-violet-500/10 mb-4">
                                        <div className="flex gap-3">
                                            <Clock className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-sm font-medium text-violet-200">Pending Review</div>
                                                <p className="text-xs text-zinc-400 mt-1">
                                                    Review the trial deliverables before activating the full contract.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex gap-2">
                                    <GlassButton variant="primary" size="sm" className="flex-1">
                                        View Details
                                    </GlassButton>
                                    {isTrial && contract.status === 'DRAFT' && (
                                        <GlassButton variant="secondary" size="sm" className="flex-1 border-violet-500/30 text-violet-300">
                                            Fund Trial
                                        </GlassButton>
                                    )}
                                </div>
                            </GlassCard>
                        )
                    })}
                </div>
            )}
        </DashboardShell>
    );
}
