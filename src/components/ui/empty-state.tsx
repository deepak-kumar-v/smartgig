import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    action?: {
        label: string;
        href: string;
        variant?: 'primary' | 'secondary' | 'ghost';
    };
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <GlassCard className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6">
                <Icon className="w-8 h-8 text-zinc-500" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-400 max-w-md mb-8">{description}</p>

            {action && (
                <Link href={action.href}>
                    <GlassButton variant={action.variant || 'primary'}>
                        {action.label}
                    </GlassButton>
                </Link>
            )}
        </GlassCard>
    );
}
