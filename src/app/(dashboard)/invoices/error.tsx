'use client';

import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function InvoicesError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <DashboardShell role="freelancer">
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="max-w-md p-8 text-center border-rose-500/20">
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-rose-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Failed to Load Invoices</h2>
                    <p className="text-zinc-400 mb-6">
                        Something went wrong while loading your invoices. Please try again.
                    </p>
                    <GlassButton variant="primary" onClick={reset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </GlassButton>
                </GlassCard>
            </div>
        </DashboardShell>
    );
}
