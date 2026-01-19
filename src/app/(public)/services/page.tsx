import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Sparkles, ArrowRight, Star, Clock, DollarSign, Search } from 'lucide-react';

async function getServices() {
    return db.serviceListing.findMany({
        include: {
            freelancer: {
                include: {
                    user: {
                        select: { name: true, image: true, trustScore: true }
                    }
                }
            },
            category: true,
            packages: true
        },
        orderBy: {
            freelancer: {
                user: {
                    trustScore: 'desc' // Promotes high-trust users (part of our safety innovation)
                }
            }
        },
        take: 20
    });
}

export default async function ServicesMarketplace() {
    const services = await getServices();

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
            <Navbar />

            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto">
                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Reverse Freelancing
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-6">
                            Verified "Open to Work" Profiles
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            Don't post a job and hope for the best. Apply directly to top-tier talent who have defined exactly what they're looking for.
                        </p>
                    </div>

                    {/* Search (Visual Placeholder) */}
                    <div className="max-w-2xl mx-auto mb-16 relative">
                        <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-6 py-4 backdrop-blur-xl">
                            <Search className="w-5 h-5 text-zinc-400 mr-4" />
                            <input
                                type="text"
                                placeholder="Search for skills, services, or categories..."
                                className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-zinc-500"
                            />
                            <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-medium transition-colors ml-4">
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {services.map((service) => (
                            <Link key={service.id} href={`/services/${service.id}`} className="group block h-full">
                                <GlassCard className="h-full p-0 overflow-hidden hover:border-violet-500/50 transition-all duration-300">
                                    {/* Image Placeholder (Category Based or User Upload - using gradient for now) */}
                                    <div className="h-40 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 flex items-center justify-center relative">
                                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10">
                                            {service.category.name}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white/10 p-6 text-center leading-tight">
                                            {service.category.name}
                                        </h3>
                                    </div>

                                    <div className="p-6">
                                        {/* Freelancer Info */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                                                {service.freelancer.user.image ? (
                                                    <img src={service.freelancer.user.image} alt={service.freelancer.user.name || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-400">
                                                        {(service.freelancer.user.name || 'U').charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {service.freelancer.user.name || 'Anonymous'}
                                                </div>
                                                <div className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-emerald-400" />
                                                    {service.freelancer.user.trustScore.toFixed(0)} Trust
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-violet-400 transition-colors">
                                            {service.title}
                                        </h3>

                                        <p className="text-sm text-zinc-400 line-clamp-3 mb-6 min-h-[60px]">
                                            {service.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                                                <Clock className="w-3.5 h-3.5" />
                                                {service.packages[0]?.deliveryDays || 3}d delivery
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-zinc-500">Starting at</div>
                                                <div className="text-lg font-bold text-white">
                                                    ${service.basePrice}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
