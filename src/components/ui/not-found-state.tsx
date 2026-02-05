'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

interface NotFoundStateProps {
    title?: string;
    message?: string;
    backHref?: string;
    backLabel?: string;
}

export function NotFoundState({
    title = 'Not Found',
    message = 'The resource you are looking for does not exist or has been removed.',
    backHref = '/dashboard',
    backLabel = 'Go Back'
}: NotFoundStateProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <GlassCard className="max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <p className="text-zinc-400 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <Link href={backHref}>
                        <GlassButton variant="secondary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {backLabel}
                        </GlassButton>
                    </Link>
                    <Link href="/">
                        <GlassButton variant="ghost">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </GlassButton>
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
