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
import { SocialLogin, SocialLoginDivider } from '@/components/auth/social-login';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormErrors = {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
};

export default function RegisterPage() {
    const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<FormErrors>({});
    const [success, setSuccess] = useState<string | undefined>("");

    const handleSubmit = async (formData: FormData) => {
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        // Client-side validation
        const result = registerSchema.safeParse(data);
        if (!result.success) {
            const fieldErrors: FormErrors = {};
            result.error.issues.forEach((err) => {
                const field = err.path[0] as keyof FormErrors;
                if (field) fieldErrors[field] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        startTransition(async () => {
            formData.set('role', role === 'freelancer' ? 'FREELANCER' : 'CLIENT');
            const res = await registerUser(formData);
            if (res.error) {
                setErrors({ general: res.error });
            } else {
                setSuccess("Account created! Redirecting...");
                window.location.href = "/login";
            }
        });
    };

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

                <SocialLogin context="signup" />
                <SocialLoginDivider />

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

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Full Name</label>
                        <GlassInput
                            name="name"
                            type="text"
                            placeholder="Jane Doe"
                            className={errors.name ? 'border-rose-500/50' : ''}
                        />
                        {errors.name && (
                            <p className="text-rose-400 text-xs ml-1">{errors.name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Work Email</label>
                        <GlassInput
                            name="email"
                            type="email"
                            placeholder="jane@example.com"
                            className={errors.email ? 'border-rose-500/50' : ''}
                        />
                        {errors.email && (
                            <p className="text-rose-400 text-xs ml-1">{errors.email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/70 ml-1">Password</label>
                        <GlassInput
                            name="password"
                            type="password"
                            placeholder="Min. 8 characters"
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
                    {success && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                            {success}
                        </div>
                    )}

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
