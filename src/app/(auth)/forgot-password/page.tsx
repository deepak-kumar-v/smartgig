'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [error, setError] = useState('');

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setFormState('loading');

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate success (in real app, this would call the API)
        // Mock: fail if email contains "fail"
        if (email.toLowerCase().includes('fail')) {
            setFormState('error');
            setError('No account found with this email address');
        } else {
            setFormState('success');
        }
    };

    if (formState === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
                    <p className="text-zinc-400 mb-6">
                        We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                    </p>
                    <p className="text-zinc-500 text-sm mb-6">
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            onClick={() => setFormState('idle')}
                            className="text-indigo-400 hover:underline"
                        >
                            try again
                        </button>
                    </p>
                    <Link href="/login">
                        <GlassButton variant="secondary" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <GlassCard className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <Logo />
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-zinc-400">
                        No worries! Enter your email and we'll send you reset instructions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <GlassInput
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                    setFormState('idle');
                                }}
                                placeholder="Enter your email"
                                className="pl-12"
                                disabled={formState === 'loading'}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span className="text-rose-400 text-sm">{error}</span>
                        </div>
                    )}

                    <GlassButton
                        variant="primary"
                        className="w-full"
                        disabled={formState === 'loading'}
                    >
                        {formState === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </GlassButton>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
