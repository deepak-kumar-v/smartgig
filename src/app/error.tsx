'use client';

import { useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <GlassCard className="relative w-full max-w-md p-8 text-center border-white/10">
                <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Something went wrong!</h1>
                <p className="text-zinc-400 mb-8 text-sm">
                    {error.message || "An unexpected error occurred. Our team has been notified."}
                </p>

                <div className="flex gap-3 justify-center">
                    <GlassButton variant="secondary" onClick={() => reset()}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </GlassButton>
                    <Link href="/">
                        <GlassButton variant="ghost">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </GlassButton>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
