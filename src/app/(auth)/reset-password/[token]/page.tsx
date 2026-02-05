'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { Logo } from '@/components/ui/logo';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';

type PageState = 'validating' | 'valid' | 'invalid' | 'loading' | 'success' | 'error';

export default function ResetPasswordPage() {
    const params = useParams();
    const token = params.token as string;

    const [pageState, setPageState] = useState<PageState>('validating');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Mock token validation on mount
    useEffect(() => {
        const validateToken = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock: token "invalid" or "expired" are invalid
            if (token === 'invalid' || token === 'expired') {
                setPageState('invalid');
            } else {
                setPageState('valid');
            }
        };
        validateToken();
    }, [token]);

    const validatePassword = (pwd: string): string[] => {
        const errs: string[] = [];
        if (pwd.length < 8) errs.push('At least 8 characters');
        if (!/[A-Z]/.test(pwd)) errs.push('One uppercase letter');
        if (!/[a-z]/.test(pwd)) errs.push('One lowercase letter');
        if (!/[0-9]/.test(pwd)) errs.push('One number');
        return errs;
    };

    const passwordErrors = validatePassword(password);
    const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        if (!isPasswordValid) {
            setErrors(['Please fix password requirements']);
            return;
        }

        if (!passwordsMatch) {
            setErrors(['Passwords do not match']);
            return;
        }

        setPageState('loading');

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate success
        setPageState('success');
    };

    // Validating token state
    if (pageState === 'validating') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
                    <h1 className="text-xl font-bold text-white mb-2">Validating Reset Link</h1>
                    <p className="text-zinc-400">Please wait...</p>
                </GlassCard>
            </div>
        );
    }

    // Invalid/expired token
    if (pageState === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-rose-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h1>
                    <p className="text-zinc-400 mb-6">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <div className="space-y-3">
                        <Link href="/forgot-password">
                            <GlassButton variant="primary" className="w-full">
                                Request New Link
                            </GlassButton>
                        </Link>
                        <Link href="/login">
                            <GlassButton variant="secondary" className="w-full">
                                Back to Login
                            </GlassButton>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        );
    }

    // Success state
    if (pageState === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
                    <p className="text-zinc-400 mb-6">
                        Your password has been successfully reset. You can now log in with your new password.
                    </p>
                    <Link href="/login">
                        <GlassButton variant="primary" className="w-full">
                            Continue to Login
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    // Reset form
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <GlassCard className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <Logo />
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-zinc-400">Create a new password for your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <GlassInput
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="pl-12 pr-12"
                                disabled={pageState === 'loading'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Password requirements */}
                        {password.length > 0 && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg space-y-1">
                                {[
                                    { met: password.length >= 8, text: 'At least 8 characters' },
                                    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
                                    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
                                    { met: /[0-9]/.test(password), text: 'One number' },
                                ].map((req, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500/20' : 'bg-zinc-700'
                                            }`}>
                                            {req.met && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                                        </div>
                                        <span className={req.met ? 'text-emerald-400' : 'text-zinc-500'}>{req.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <GlassInput
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="pl-12 pr-12"
                                disabled={pageState === 'loading'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword.length > 0 && (
                            <p className={`text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>

                    {errors.length > 0 && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                            {errors.map((err, i) => (
                                <div key={i} className="flex items-center gap-2 text-rose-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {err}
                                </div>
                            ))}
                        </div>
                    )}

                    <GlassButton
                        variant="primary"
                        className="w-full"
                        disabled={pageState === 'loading' || !isPasswordValid || !passwordsMatch}
                    >
                        {pageState === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
}
