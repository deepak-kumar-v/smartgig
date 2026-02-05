import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <GlassCard className="relative w-full max-w-md p-8 text-center border-white/10">
                <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <FileQuestion className="w-10 h-10 text-zinc-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
                <p className="text-zinc-400 mb-8">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex gap-3 justify-center">
                    <Link href="/">
                        <GlassButton variant="secondary">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </GlassButton>
                    </Link>
                    <Link href="/login">
                        <GlassButton variant="primary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </GlassButton>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
