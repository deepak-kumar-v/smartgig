'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { loginUser } from '@/actions/auth-actions';
import { SocialLogin, SocialLoginDivider } from '@/components/auth/social-login';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormErrors = {
    email?: string;
    password?: string;
    general?: string;
};

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<FormErrors>({});

    const handleSubmit = async (formData: FormData) => {
        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        // Client-side validation
        const result = loginSchema.safeParse(data);
        if (!result.success) {
            const fieldErrors: FormErrors = {};
            result.error.issues.forEach((err) => {
                if (err.path[0] === 'email') fieldErrors.email = err.message;
                if (err.path[0] === 'password') fieldErrors.password = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        startTransition(async () => {
            const res = await loginUser(undefined, formData);
            if (res) setErrors({ general: res });
        });
    };

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
                    <p className="text-white/50 text-sm">Enter your credentials to access your workspace.</p>
                </div>

                <SocialLogin context="login" />
                <SocialLoginDivider />

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Email</label>
                        <GlassInput
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className={errors.email ? 'border-rose-500/50' : ''}
                        />
                        {errors.email && (
                            <p className="text-rose-400 text-xs ml-1">{errors.email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1 flex justify-between">
                            Password
                            <Link href="/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot?</Link>
                        </label>
                        <GlassInput
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className={errors.password ? 'border-rose-500/50' : ''}
                        />
                        {errors.password && (
                            <p className="text-rose-400 text-xs ml-1">{errors.password}</p>
                        )}
                    </div>

                    {errors.general && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
                            {errors.general}
                        </div>
                    )}

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
