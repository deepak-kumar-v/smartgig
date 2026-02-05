import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/skeleton';

export default function FreelancerDashboardLoading() {
    return (
        <DashboardShell role="freelancer">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton variant="text" width={250} height={32} />
                        <Skeleton variant="text" width={400} />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton variant="rounded" width={140} height={40} />
                        <Skeleton variant="rounded" width={120} height={40} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <GlassCard key={i} className="p-5">
                            <div className="flex justify-between mb-3">
                                <Skeleton variant="rounded" width={40} height={40} />
                                <Skeleton variant="text" width={40} />
                            </div>
                            <Skeleton variant="text" width={100} height={32} className="mb-2" />
                            <Skeleton variant="text" width={80} />
                        </GlassCard>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Reputation Metrics */}
                        <GlassCard className="p-6">
                            <div className="flex justify-between mb-6">
                                <Skeleton variant="text" width={200} height={24} />
                                <Skeleton variant="text" width={60} height={24} />
                            </div>
                            <div className="space-y-4">
                                <Skeleton variant="text" width="100%" height={24} />
                                <Skeleton variant="text" width="100%" height={24} />
                                <Skeleton variant="text" width="100%" height={24} />
                                <Skeleton variant="text" width="100%" height={24} />
                            </div>
                        </GlassCard>

                        {/* Active Contracts */}
                        <GlassCard className="p-6">
                            <div className="flex justify-between mb-6">
                                <Skeleton variant="text" width={180} height={24} />
                                <Skeleton variant="text" width={60} />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton variant="text" width={200} />
                                        <Skeleton variant="rounded" width={80} height={24} />
                                    </div>
                                    <Skeleton variant="text" width="100%" height={8} />
                                    <div className="flex justify-between">
                                        <Skeleton variant="text" width={100} />
                                        <Skeleton variant="text" width={100} />
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton variant="text" width={200} />
                                        <Skeleton variant="rounded" width={80} height={24} />
                                    </div>
                                    <Skeleton variant="text" width="100%" height={8} />
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Workload */}
                        <GlassCard className="p-6 flex flex-col items-center">
                            <Skeleton variant="text" width={150} height={24} className="mb-4" />
                            <Skeleton variant="circular" width={128} height={128} />
                            <Skeleton variant="text" width={120} className="mt-4" />
                            <Skeleton variant="rounded" width="100%" height={36} className="mt-4" />
                        </GlassCard>

                        {/* Skills */}
                        <GlassCard className="p-6">
                            <div className="flex justify-between mb-4">
                                <Skeleton variant="text" width={120} height={24} />
                                <Skeleton variant="circular" width={20} height={20} />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton variant="rounded" width={40} height={40} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="100%" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
