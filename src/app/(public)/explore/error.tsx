'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Navbar } from '@/components/global/navbar';

export default function ExploreError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 pt-32 pb-20 flex items-center justify-center">
                <GlassCard className="max-w-md p-8 text-center border-rose-500/20">
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-rose-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Failed to Load Jobs</h2>
                    <p className="text-zinc-400 mb-6">
                        Something went wrong while loading jobs. Please try again.
                    </p>
                    <GlassButton variant="primary" onClick={reset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </GlassButton>
                </GlassCard>
            </main>
        </div>
    );
}
