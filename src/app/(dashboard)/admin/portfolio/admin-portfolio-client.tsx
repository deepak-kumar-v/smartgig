'use client';

import React, { useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    CheckCircle, Clock, Image, ExternalLink, Github,
    Shield, XCircle
} from 'lucide-react';
import { verifyPortfolioItem, rejectPortfolioItem } from '@/actions/portfolio-actions';
import { useRouter } from 'next/navigation';

interface PortfolioAdminItem {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    projectUrl: string | null;
    githubUrl: string | null;
    techStack: string[];
    status: string;
    createdAt: string;
    freelancer: {
        title: string;
        user: { name: string | null; image: string | null };
    };
}

export function AdminPortfolioClient({ items }: { items: PortfolioAdminItem[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleVerify = (id: string) => {
        startTransition(async () => {
            await verifyPortfolioItem(id);
            router.refresh();
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            await rejectPortfolioItem(id);
            router.refresh();
        });
    };

    const pendingItems = items.filter(i => i.status === 'PENDING');
    const verifiedItems = items.filter(i => i.status === 'VERIFIED');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Portfolio Verification</h1>
                <p className="text-zinc-400">Review and verify freelancer work samples</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/20">
                            <Image className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{items.length}</div>
                            <div className="text-xs text-zinc-500">Total Items</div>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{pendingItems.length}</div>
                            <div className="text-xs text-zinc-500">Pending Review</div>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{verifiedItems.length}</div>
                            <div className="text-xs text-zinc-500">Verified</div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Pending Section */}
            {pendingItems.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        Pending Review ({pendingItems.length})
                    </h2>
                    <div className="space-y-4">
                        {pendingItems.map((item) => (
                            <GlassCard key={item.id} className="p-5">
                                <div className="flex items-start gap-5">
                                    {/* Thumbnail */}
                                    <div className="w-32 h-20 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
                                        {item.thumbnailUrl && item.thumbnailUrl !== '/portfolio/placeholder.png' ? (
                                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Image className="w-6 h-6 text-zinc-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                                        <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{item.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span>By: <span className="text-zinc-300">{item.freelancer.user.name || 'Unknown'}</span></span>
                                            <span>•</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            {item.projectUrl && (
                                                <>
                                                    <span>•</span>
                                                    <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Live
                                                    </a>
                                                </>
                                            )}
                                            {item.githubUrl && (
                                                <>
                                                    <span>•</span>
                                                    <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300 flex items-center gap-1">
                                                        <Github className="w-3 h-3" /> Code
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                        {item.techStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.techStack.map((t, i) => (
                                                    <span key={i} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <GlassButton
                                            variant="primary"
                                            onClick={() => handleVerify(item.id)}
                                            disabled={isPending}
                                            className="text-sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Approve
                                        </GlassButton>
                                        <GlassButton
                                            variant="secondary"
                                            onClick={() => handleReject(item.id)}
                                            disabled={isPending}
                                            className="text-sm"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            Reject
                                        </GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Verified Section */}
            {verifiedItems.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        Verified ({verifiedItems.length})
                    </h2>
                    <div className="space-y-3">
                        {verifiedItems.map((item) => (
                            <GlassCard key={item.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-10 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden">
                                        {item.thumbnailUrl && item.thumbnailUrl !== '/portfolio/placeholder.png' ? (
                                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Image className="w-4 h-4 text-zinc-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white text-sm font-medium">{item.title}</h3>
                                        <p className="text-zinc-500 text-xs">By: {item.freelancer.user.name || 'Unknown'}</p>
                                    </div>
                                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                                    </span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {items.length === 0 && (
                <GlassCard className="p-12 text-center">
                    <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Portfolio Items</h3>
                    <p className="text-zinc-400">No freelancer work samples to review yet.</p>
                </GlassCard>
            )}
        </div>
    );
}
