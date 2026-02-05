import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Sparkles, Star, Clock } from 'lucide-react';
import { getFilteredServices } from '@/app/actions/services';
import { ServiceSearch } from '@/components/services/service-search';
import { ServiceFilters } from '@/components/services/service-filters';
import { ActiveFilters } from '@/components/services/active-filters';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ServicesMarketplace({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Process params safely
    const resolvedSearchParams = await searchParams; // Wait for params in NextJS 15
    const query = typeof resolvedSearchParams.query === 'string' ? resolvedSearchParams.query : undefined;
    const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
    const minPrice = typeof resolvedSearchParams.minPrice === 'string' ? resolvedSearchParams.minPrice : undefined;
    const maxPrice = typeof resolvedSearchParams.maxPrice === 'string' ? resolvedSearchParams.maxPrice : undefined;
    const deliveryTime = typeof resolvedSearchParams.deliveryTime === 'string' ? resolvedSearchParams.deliveryTime : undefined;
    const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : undefined;

    const services = await getFilteredServices({
        query,
        category,
        minPrice,
        maxPrice,
        deliveryTime,
        sort
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            <Navbar />

            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Reverse Freelancing
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-6">
                            Find Verified Talent
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Apply directly to top-tier talent who have defined exactly what they're looking for.
                        </p>
                    </div>

                    {/* Integrated Search & Content Layout */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters - Desktop */}
                        <ServiceFilters />

                        <div className="flex-1">
                            {/* Top Bar: Search & Sort */}
                            <ServiceSearch />

                            {/* Active Filters */}
                            <ActiveFilters />

                            {/* Grid */}
                            {services.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map((service) => (
                                        <Link key={service.id} href={`/services/${service.id}`} className="group block h-full">
                                            <GlassCard className="h-full p-0 overflow-hidden hover:border-violet-500/50 transition-all duration-300 flex flex-col">
                                                {/* Image */}
                                                <div className="h-44 relative bg-zinc-800">
                                                    {service.coverImage ? (
                                                        <Image
                                                            src={service.coverImage}
                                                            alt={service.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50" />
                                                    )}
                                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10 font-medium">
                                                        {service.category}
                                                    </div>
                                                </div>

                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
                                                        {service.title}
                                                    </h3>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1 mb-4">
                                                        {service.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 border border-white/5">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {service.packages[0]?.deliveryDays}d delivery
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-zinc-500">Starting at</div>
                                                            <div className="text-lg font-bold text-white">
                                                                ${service.packages[0]?.price}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Sparkles}
                                    title="No services found"
                                    description="Try adjusting your filters or search query to find what you're looking for."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
