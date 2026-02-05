'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { ShieldX, ArrowLeft, LogIn, Home } from 'lucide-react';

interface AccessDeniedStateProps {
    title?: string;
    message?: string;
    backHref?: string;
    showLogin?: boolean;
    showHome?: boolean;
}

export function AccessDeniedState({
    title = 'Access Denied',
    message = 'You do not have permission to view this resource.',
    backHref = '/dashboard',
    showLogin = false,
    showHome = true
}: AccessDeniedStateProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <GlassCard className="max-w-md w-full p-8 text-center border-rose-500/20">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-8 h-8 text-rose-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <p className="text-zinc-400 mb-6">{message}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Link href={backHref}>
                        <GlassButton variant="secondary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </GlassButton>
                    </Link>
                    {showHome && (
                        <Link href="/">
                            <GlassButton variant="secondary">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </GlassButton>
                        </Link>
                    )}
                    {showLogin && (
                        <Link href="/login">
                            <GlassButton variant="primary">
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </GlassButton>
                        </Link>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}

