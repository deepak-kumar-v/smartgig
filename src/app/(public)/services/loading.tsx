import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function ServicesLoading() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="relative overflow-hidden bg-zinc-900 border-b border-white/10 pt-24 pb-16">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="space-y-2 flex flex-col items-center">
                        <Skeleton className="w-[300px] h-[40px]" />
                        <Skeleton className="w-[500px] h-[24px]" />
                    </div>

                    <div className="max-w-2xl mx-auto relative">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="block w-full pl-10 pr-3 py-4 border border-white/10 rounded-xl leading-5 bg-white/5 backdrop-blur-sm" />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="w-[100px] h-[32px] rounded" />
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <Skeleton className="w-[200px] h-[32px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <GlassCard key={i} className="group overflow-hidden border-white/5 hover:border-violet-500/50 transition-all duration-300">
                            {/* Image Skeleton */}
                            <div className="aspect-video bg-zinc-800 animate-pulse relative" />

                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-[32px] h-[32px] rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="w-[80px] h-4" />
                                            <Skeleton className="w-[60px] h-4" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-[50px] h-[20px] rounded" />
                                </div>

                                {/* Title */}
                                <Skeleton className="w-[90%] h-[24px]" />
                                <Skeleton className="w-[60%] h-[24px]" />

                                {/* Footer */}
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <Skeleton className="w-[80px] h-4" />
                                    <Skeleton className="w-[80px] h-4" />
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
}
