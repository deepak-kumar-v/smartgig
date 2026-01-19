'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { registerUser } from '@/actions/auth-actions';

export default function RegisterPage() {
    const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background z-0" />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px]" />

            <GlassCard variant="heavy" className="w-full max-w-lg p-8 relative z-10 flex flex-col gap-6">
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Join SmartGIG</h1>
                    <p className="text-white/50 text-sm">Create your account to start building.</p>
                </div>

                {/* Role Toggle */}
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => setRole('freelancer')}
                        className={cn(
                            "cursor-pointer rounded-xl p-4 border transition-all duration-300 flex flex-col items-center gap-2",
                            role === 'freelancer'
                                ? "bg-indigo-500/20 border-indigo-500 text-white"
                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                    >
                        <User className="w-6 h-6" />
                        <span className="text-sm font-medium">Freelancer</span>
                    </div>
                    <div
                        onClick={() => setRole('client')}
                        className={cn(
                            "cursor-pointer rounded-xl p-4 border transition-all duration-300 flex flex-col items-center gap-2",
                            role === 'client'
                                ? "bg-cyan-500/20 border-cyan-500 text-white"
                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        )}
                    >
                        <Briefcase className="w-6 h-6" />
                        <span className="text-sm font-medium">Employer</span>
                    </div>
                </div>

                <form action={async (formData) => {
                    startTransition(async () => {
                        formData.set('role', role === 'freelancer' ? 'FREELANCER' : 'CLIENT');
                        const res = await registerUser(formData);
                        if (res.error) {
                            setError(res.error);
                        } else {
                            setSuccess("Account created! Redirecting...");
                            // Optional: Redirect safely here or rely on middleware/auto-login logic
                            window.location.href = "/login";
                        }
                    });
                }} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Full Name</label>
                        <GlassInput name="name" type="text" placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Work Email</label>
                        <GlassInput name="email" type="email" placeholder="jane@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Password</label>
                        <GlassInput name="password" type="password" placeholder="Min. 8 characters" required />
                    </div>

                    {error && <div className="text-red-400 text-xs text-center">{error}</div>}
                    {success && <div className="text-green-400 text-xs text-center">{success}</div>}

                    <GlassButton type="submit" className="w-full mt-4" disabled={isPending}>
                        {isPending ? "Creating Account..." : "Create Account"}
                    </GlassButton>
                </form>

                <div className="text-center text-sm text-white/40">
                    Already have an account? <Link href="/login" className="text-white hover:underline">Log in</Link>
                </div>
            </GlassCard>
        </div>
    );
}
