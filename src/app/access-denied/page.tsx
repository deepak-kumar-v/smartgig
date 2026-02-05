'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { ShieldX, ArrowLeft, Home, LogIn } from 'lucide-react';

function AccessDeniedContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');

    const getMessage = () => {
        switch (reason) {
            case 'role':
                return 'Your account role does not have permission to access this area.';
            case 'admin':
                return 'This area is restricted to administrators only.';
            default:
                return 'You do not have permission to view this resource.';
        }
    };

    return (
        <GlassCard variant="heavy" className="max-w-md w-full p-8 text-center relative z-10 border-rose-500/20">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
                <ShieldX className="w-10 h-10 text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-zinc-400 mb-8">{getMessage()}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <GlassButton variant="secondary" onClick={() => window.history.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </GlassButton>
                <Link href="/">
                    <GlassButton variant="secondary">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </GlassButton>
                </Link>
                <Link href="/login">
                    <GlassButton variant="primary">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                    </GlassButton>
                </Link>
            </div>
        </GlassCard>
    );
}

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background z-0" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />

            <Suspense fallback={
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            }>
                <AccessDeniedContent />
            </Suspense>
        </div>
    );
}
