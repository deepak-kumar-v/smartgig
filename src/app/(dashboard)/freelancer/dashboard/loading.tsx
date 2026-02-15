import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/skeleton';

export default function FreelancerDashboardLoading() {
    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="w-[250px] h-[32px]" />
                        <Skeleton className="w-[400px] h-4" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="w-[140px] h-[40px]" />
                        <Skeleton className="w-[120px] h-[40px]" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <GlassCard key={i} className="p-5">
                            <div className="flex justify-between mb-3">
                                <Skeleton className="w-[40px] h-[40px] rounded" />
                                <Skeleton className="w-[40px] h-4" />
                            </div>
                            <Skeleton className="w-[100px] h-[32px] mb-2" />
                            <Skeleton className="w-[80px] h-4" />
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
                                <Skeleton className="w-[200px] h-[24px]" />
                                <Skeleton className="w-[60px] h-[24px]" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="w-full h-[24px]" />
                                <Skeleton className="w-full h-[24px]" />
                                <Skeleton className="w-full h-[24px]" />
                                <Skeleton className="w-full h-[24px]" />
                            </div>
                        </GlassCard>

                        {/* Active Contracts */}
                        <GlassCard className="p-6">
                            <div className="flex justify-between mb-6">
                                <Skeleton className="w-[180px] h-[24px]" />
                                <Skeleton className="w-[60px] h-4" />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="w-[200px] h-4" />
                                        <Skeleton className="w-[80px] h-[24px] rounded" />
                                    </div>
                                    <Skeleton className="w-full h-[8px]" />
                                    <div className="flex justify-between">
                                        <Skeleton className="w-[100px] h-4" />
                                        <Skeleton className="w-[100px] h-4" />
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="w-[200px] h-4" />
                                        <Skeleton className="w-[80px] h-[24px] rounded" />
                                    </div>
                                    <Skeleton className="w-full h-[8px]" />
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Workload */}
                        <GlassCard className="p-6 flex flex-col items-center">
                            <Skeleton className="w-[150px] h-[24px] mb-4" />
                            <Skeleton className="w-[128px] h-[128px] rounded-full" />
                            <Skeleton className="w-[120px] h-4 mt-4" />
                            <Skeleton className="w-full h-[36px] mt-4 rounded" />
                        </GlassCard>

                        {/* Skills */}
                        <GlassCard className="p-6">
                            <div className="flex justify-between mb-4">
                                <Skeleton className="w-[120px] h-[24px]" />
                                <Skeleton className="w-[20px] h-[20px] rounded-full" />
                            </div>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton className="w-[40px] h-[40px] rounded" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="w-[60%] h-4" />
                                            <Skeleton className="w-full h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}
