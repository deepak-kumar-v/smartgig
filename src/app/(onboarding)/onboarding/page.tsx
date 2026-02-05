'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Logo } from '@/components/ui/logo';
import { User, Briefcase, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { completeOnboarding } from '@/actions/onboarding-actions';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
    const [role, setRole] = useState<'FREELANCER' | 'CLIENT' | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleContinue = () => {
        if (!role) return;

        startTransition(async () => {
            const res = await completeOnboarding(role);
            if (res.success) {
                router.push('/dashboard');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background z-0" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />

            <GlassCard variant="heavy" className="w-full max-w-2xl p-8 relative z-10 flex flex-col gap-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Welcome to SmartGIG</h1>
                    <p className="text-zinc-400 text-lg">How would you like to use the platform today?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        onClick={() => setRole('FREELANCER')}
                        className={cn(
                            "cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 relative overflow-hidden group",
                            role === 'FREELANCER'
                                ? "bg-indigo-500/20 border-indigo-500"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                    >
                        {role === 'FREELANCER' && (
                            <div className="absolute top-4 right-4">
                                <CheckCircle className="w-6 h-6 text-indigo-400" />
                            </div>
                        )}
                        <div className="mb-4 w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User className={cn("w-6 h-6", role === 'FREELANCER' ? "text-indigo-400" : "text-zinc-400")} />
                        </div>
                        <h3 className={cn("text-xl font-bold mb-2", role === 'FREELANCER' ? "text-white" : "text-zinc-300")}>
                            I'm a Freelancer
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            I want to find work, manage projects, and earn money for my skills.
                        </p>
                    </div>

                    <div
                        onClick={() => setRole('CLIENT')}
                        className={cn(
                            "cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 relative overflow-hidden group",
                            role === 'CLIENT'
                                ? "bg-cyan-500/20 border-cyan-500"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                    >
                        {role === 'CLIENT' && (
                            <div className="absolute top-4 right-4">
                                <CheckCircle className="w-6 h-6 text-cyan-400" />
                            </div>
                        )}
                        <div className="mb-4 w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Briefcase className={cn("w-6 h-6", role === 'CLIENT' ? "text-cyan-400" : "text-zinc-400")} />
                        </div>
                        <h3 className={cn("text-xl font-bold mb-2", role === 'CLIENT' ? "text-white" : "text-zinc-300")}>
                            I'm a Client
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            I want to hire talent, post jobs, and manage my team.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <GlassButton
                        size="lg"
                        className="w-full md:w-auto min-w-[200px]"
                        disabled={!role || isPending}
                        onClick={handleContinue}
                    >
                        {isPending ? "Setting up account..." : "Continue to Dashboard"}
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
}
