import React from 'react';
import { db } from '@/lib/db';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Star, Clock, CheckCircle, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';

async function getService(id: string) {
    return db.serviceListing.findUnique({
        where: { id },
        include: {
            freelancer: {
                include: {
                    user: {
                        select: { name: true, image: true, trustScore: true }
                    },
                    skills: true,
                }
            },
            category: true,
            packages: true
        }
    });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const service = await getService(id) as any;

    if (!service) notFound();

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />

            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 text-violet-400 text-sm font-medium mb-4">
                                    <span className="bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                                        {service.category.name}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                    {service.title}
                                </h1>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="items-center flex gap-3">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                                            {service.freelancer.user.image ? (
                                                <img src={service.freelancer.user.image} alt={service.freelancer.user.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-zinc-400">
                                                    {(service.freelancer.user.name || 'U').charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{service.freelancer.user.name}</div>
                                            <div className="text-sm text-zinc-400">{service.freelancer.title}</div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg">
                                            <Star className="w-4 h-4 fill-emerald-400" />
                                            {service.freelancer.user.trustScore.toFixed(0)}
                                        </div>
                                        <div className="text-xs text-zinc-500">Trust Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <GlassCard className="p-8">
                                <h3 className="text-xl font-bold text-white mb-6">About This Service</h3>
                                <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {service.description}
                                </div>
                            </GlassCard>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2">
                                {service.freelancer.skills.map((skill: any) => (
                                    <span key={skill.id} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm">
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar - Pricing / Action */}
                        <div className="space-y-6">
                            <div className="sticky top-24">
                                <GlassCard className="p-6 border-violet-500/20 shadow-xl shadow-violet-500/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-zinc-400 font-medium">Starting at</span>
                                        <span className="text-3xl font-bold text-white">${service.basePrice}</span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-zinc-300">
                                            <Clock className="w-5 h-5 text-violet-400" />
                                            <span>{service.packages[0]?.deliveryDays || 3} Days Delivery</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-zinc-300">
                                            <Briefcase className="w-5 h-5 text-violet-400" />
                                            <span>{service.packages[0]?.revisions || 1} Revision</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-zinc-300">
                                            <Shield className="w-5 h-5 text-emerald-400" />
                                            <span>Secure Escrow Protection</span>
                                        </div>
                                    </div>

                                    <GlassButton variant="primary" className="w-full h-12 text-lg">
                                        Apply for this Service <ArrowRight className="w-5 h-5 ml-2" />
                                    </GlassButton>

                                    <p className="text-xs text-center text-zinc-500 mt-4">
                                        You are applying to work with this freelancer. They will review your project requirements.
                                    </p>
                                </GlassCard>

                                <div className="mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center">
                                    <div className="text-sm text-violet-300 font-medium mb-1">Reverse Freelancing</div>
                                    <p className="text-xs text-zinc-500">
                                        Unlike typical gigs, you are submitting your project to match their criteria.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
