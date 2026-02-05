'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Logo } from '@/components/ui/logo';
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react';

type VerifyState = 'verifying' | 'success' | 'expired' | 'invalid' | 'already_verified';

export default function VerifyEmailPage() {
    const params = useParams();
    const token = params.token as string;

    const [verifyState, setVerifyState] = useState<VerifyState>('verifying');
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const verifyEmail = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock verification based on token value
            switch (token) {
                case 'expired':
                    setVerifyState('expired');
                    break;
                case 'invalid':
                    setVerifyState('invalid');
                    break;
                case 'verified':
                    setVerifyState('already_verified');
                    break;
                default:
                    setVerifyState('success');
            }
        };

        verifyEmail();
    }, [token]);

    const handleResend = async () => {
        setResending(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResending(false);
        // Mock: would show success toast
    };

    // Verifying state
    if (verifyState === 'verifying') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <Loader2 className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-spin" />
                    <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
                    <p className="text-zinc-400">Please wait while we verify your email address...</p>
                </GlassCard>
            </div>
        );
    }

    // Success state
    if (verifyState === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
                    <p className="text-zinc-400 mb-6">
                        Your email has been successfully verified. You now have full access to SmartGIG.
                    </p>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                        <p className="text-emerald-400 text-sm">
                            ✓ Account activated · Full platform access unlocked
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <GlassButton variant="primary" className="w-full">
                            Go to Dashboard
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    // Already verified state
    if (verifyState === 'already_verified') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <GlassCard className="w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Already Verified</h1>
                    <p className="text-zinc-400 mb-6">
                        Your email address has already been verified. You can continue using SmartGIG.
                    </p>
                    <Link href="/dashboard">
                        <GlassButton variant="primary" className="w-full">
                            Go to Dashboard
                        </GlassButton>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    // Expired or Invalid state
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <GlassCard className="w-full max-w-md p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-rose-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {verifyState === 'expired' ? 'Link Expired' : 'Invalid Link'}
                </h1>
                <p className="text-zinc-400 mb-6">
                    {verifyState === 'expired'
                        ? 'This verification link has expired. Please request a new one.'
                        : 'This verification link is invalid. Please check your email for the correct link.'
                    }
                </p>

                <div className="space-y-3">
                    <GlassButton
                        variant="primary"
                        className="w-full"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </GlassButton>
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
