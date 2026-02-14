import React from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { db } from '@/lib/db';
import { Star, MapPin, Briefcase, Clock, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { TalentSearch } from './talent-search';

export const dynamic = 'force-dynamic';

async function getFreelancers() {
    try {
        const freelancers = await db.freelancerProfile.findMany({
            where: {},
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        isVerified: true,
                        trustScore: true,
                    }
                },
                skills: true,
                contracts: {
                    where: {
                        status: 'ACTIVE'
                    },
                    select: { id: true }
                },
                _count: {
                    select: {
                        contracts: true,
                        proposals: true,
                    }
                }
            },
            orderBy: {
                id: 'desc'
            },
            take: 20
        });
        return freelancers;
    } catch (error) {
        console.error('[TALENT_PAGE] Database error:', error);
        return []; // Return empty array when DB unavailable
    }
}

function FreelancerCard({ freelancer }: { freelancer: Awaited<ReturnType<typeof getFreelancers>>[0] }) {
    const initials = freelancer.user.name?.split(' ').map(n => n[0]).join('') || '?';
    const successRate = freelancer.user.trustScore ?? 100;
    const rating = 5.0;
    const activeProjects = freelancer.contracts.length;

    return (
        <Link href={`/freelancer/${freelancer.id}`} className="block group">
            <GlassCard className="p-0 overflow-hidden hover:border-violet-500/40 transition-all duration-300">
                {/* Header with gradient */}
                <div className="h-24 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent relative">
                    {/* Availability badge */}
                    <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {freelancer.availability || 'Available'}
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="absolute -bottom-10 left-6">
                        <div className="relative w-20 h-20 rounded-full border-4 border-background bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {freelancer.user.image ? (
                                <Image
                                    src={freelancer.user.image}
                                    alt={freelancer.user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-xl font-bold text-zinc-400">{initials}</span>
                            )}
                            {freelancer.user.isVerified && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border-2 border-background flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-14 p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
                            {freelancer.user.name}
                        </h3>
                        <p className="text-sm text-zinc-400 line-clamp-1">{freelancer.title}</p>
                    </div>

                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <Briefcase className="w-4 h-4" />
                            {freelancer._count.contracts} jobs
                        </div>
                        <div className="flex items-center gap-1 text-sm text-emerald-400">
                            <span className="font-medium">{successRate}%</span>
                            <span className="text-zinc-500">success</span>
                        </div>
                    </div>

                    {/* Skills */}
                    {freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {freelancer.skills.slice(0, 4).map((skill: any) => (
                                <span
                                    key={skill.id}
                                    className="px-2 py-0.5 rounded-md bg-white/5 text-white/70 text-xs"
                                >
                                    {skill.name}
                                </span>
                            ))}
                            {freelancer.skills.length > 4 && (
                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-xs">
                                    +{freelancer.skills.length - 4}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="text-sm text-zinc-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {activeProjects > 0 ? `${activeProjects} active` : 'Open to work'}
                        </div>
                        <div className="text-lg font-bold text-white">
                            ${freelancer.hourlyRate}
                            <span className="text-xs text-zinc-500 font-normal">/hr</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-xs text-violet-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            View Profile
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}

export default async function TalentPage() {
    const freelancers = await getFreelancers();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Discover Top <span className="text-gradient">Talent</span>
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Browse verified freelancers actively seeking work. Review their credentials and invite them to your projects.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-12">
                        <TalentSearch />
                    </div>

                    {/* Results */}
                    {freelancers.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-10 h-10 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Freelancers Found</h3>
                            <p className="text-zinc-400 max-w-md mx-auto mb-6">
                                {/* DB offline or no profiles yet */}
                                Check back soon for available talent.
                            </p>
                        </GlassCard>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-zinc-400">
                                    Showing <span className="text-white font-medium">{freelancers.length}</span> available freelancers
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {freelancers.map((freelancer) => (
                                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
