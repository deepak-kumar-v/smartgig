import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function FreelancerProposalsPage() {
    return (
        <DashboardShell role="freelancer">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Proposals</h1>
                    <p className="text-zinc-400">Track your submitted proposals</p>
                </div>

                <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
                    <FileText className="w-16 h-16 text-white/10 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Proposals List Coming Soon</h3>
                    <p className="text-zinc-500 max-w-md mx-auto mb-6">
                        This page will list all your submitted proposals. For now, check your dashboard or find new work.
                    </p>
                    <Link href="/freelancer/find-work">
                        <GlassButton variant="primary" asDiv>Find Work</GlassButton>
                    </Link>
                </GlassCard>
            </div>
        </DashboardShell>
    );
}
