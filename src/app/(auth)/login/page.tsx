'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { Github, Mail } from 'lucide-react';
import { loginUser, loginWithGoogle, loginWithGithub } from '@/actions/auth-actions';

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background z-0" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />

            <GlassCard variant="heavy" className="w-full max-w-md p-8 relative z-10 flex flex-col gap-8">
                <div className="text-center mb-2">
                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/50 text-sm">Enter you credentials to access your workspace.</p>
                </div>

                <div className="flex gap-4">
                    <form action={loginWithGithub} className="w-full">
                        <GlassButton variant="secondary" className="w-full text-xs">
                            <Github className="w-4 h-4 mr-2" /> GitHub
                        </GlassButton>
                    </form>
                    <form action={loginWithGoogle} className="w-full">
                        <GlassButton variant="secondary" className="w-full text-xs">
                            <Mail className="w-4 h-4 mr-2" /> Google
                        </GlassButton>
                    </form>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0f1115] px-2 text-white/30">Or continue with</span>
                    </div>
                </div>

                <form action={async (formData) => {
                    startTransition(async () => {
                        const res = await loginUser(undefined, formData);
                        if (res) setError(res);
                    });
                }} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Email</label>
                        <GlassInput name="email" type="email" placeholder="name@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1 flex justify-between">
                            Password
                            <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot?</Link>
                        </label>
                        <GlassInput name="password" type="password" placeholder="••••••••" required />
                    </div>

                    {error && <div className="text-red-400 text-xs text-center">{error}</div>}

                    <GlassButton type="submit" className="w-full mt-4" disabled={isPending}>
                        {isPending ? "Signing In..." : "Sign In"}
                    </GlassButton>
                </form>

                <div className="text-center text-sm text-white/40">
                    Don't have an account? <Link href="/register" className="text-white hover:underline">Sign up</Link>
                </div>
            </GlassCard>
        </div>
    );
}
