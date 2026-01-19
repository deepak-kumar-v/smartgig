import React from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { db } from '@/lib/db';
import { Star, MapPin, Briefcase, Clock, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { TalentSearch } from './talent-search';

async function getFreelancers() {
    const freelancers = await db.freelancerProfile.findMany({
        where: {
            availability: true,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    isVerified: true,
                }
            },
            skills: true,
            reputation: true,
            contracts: {
                where: {
                    status: 'IN_PROGRESS'
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
            reputation: {
                jobSuccess: 'desc'
            }
        },
        take: 20
    });
    return freelancers;
}

function FreelancerCard({ freelancer }: { freelancer: Awaited<ReturnType<typeof getFreelancers>>[0] }) {
    const initials = freelancer.user.name?.split(' ').map(n => n[0]).join('') || '?';
    const successRate = freelancer.reputation?.jobSuccess ?? 100;
    const rating = freelancer.reputation?.communication ?? 5.0;
    // Transparent workload metric - cannot be manipulated by freelancer
    const activeProjects = freelancer.contracts.length;

    return (
        <Link href={`/talent/${freelancer.id}`} className="block group">
            <GlassCard className="p-0 overflow-hidden hover:border-violet-500/40 transition-all duration-300">
                {/* Header with gradient */}
                <div className="h-24 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent relative">
                    {/* Availability badge */}
                    <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium backdrop-blur-sm border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Available
                        </span>
                    </div>

                    {/* Avatar - positioned to overlap header and content */}
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-zinc-900 shadow-xl">
                            {freelancer.user.image ? (
                                <img src={freelancer.user.image} alt={freelancer.user.name || ''} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        {freelancer.user.isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center border-2 border-zinc-900">
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="pt-14 pb-6 px-6">
                    {/* Name & Title */}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
                            {freelancer.user.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-zinc-400">{freelancer.title}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center flex-wrap gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-white font-medium">{rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{freelancer._count.contracts} jobs</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{successRate.toFixed(0)}%</span>
                        </div>
                        {/* Transparent Current Workload - Cannot be manipulated */}
                        <div className={`flex items-center gap-1 ${activeProjects === 0 ? 'text-emerald-400' :
                                activeProjects <= 2 ? 'text-blue-400' : 'text-amber-400'
                            }`} title="Current active projects (system-verified)">
                            <Activity className="w-3.5 h-3.5" />
                            <span>{activeProjects} active</span>
                        </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2 min-h-[40px]">
                        {freelancer.bio}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {freelancer.skills.slice(0, 4).map((skill) => (
                            <span
                                key={skill.id}
                                className="px-2 py-0.5 text-xs bg-zinc-800/80 text-zinc-300 rounded border border-zinc-700/50"
                            >
                                {skill.name}
                            </span>
                        ))}
                        {freelancer.skills.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-zinc-500">
                                +{freelancer.skills.length - 4} more
                            </span>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div>
                            <span className="text-xl font-bold text-white">${freelancer.hourlyRate}</span>
                            <span className="text-sm text-zinc-500">/hr</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm text-violet-400 group-hover:text-violet-300 transition-colors">
                            View Profile
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}

export default async function TalentPage() {
    const freelancers = await getFreelancers();

    // Calculate stats
    const avgRate = freelancers.length > 0
        ? Math.round(freelancers.reduce((sum, f) => sum + f.hourlyRate, 0) / freelancers.length)
        : 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Subtle background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl" />
            </div>

            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                        <Briefcase className="w-4 h-4" />
                        {freelancers.length} Freelancers Available
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        Find Expert{' '}
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Freelancers
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
                        Connect with verified professionals ready to bring your vision to life.
                        Browse our curated talent pool or search for specific skills.
                    </p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span>Verified Professionals</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            <span>Top-Rated Talent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>Avg. ${avgRate}/hr</span>
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <TalentSearch />

                {/* Results Grid */}
                <div className="mt-10">
                    {freelancers.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-zinc-500">
                                    Showing <span className="text-white font-medium">{freelancers.length}</span> results
                                </p>
                                <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50">
                                    <option>Sort by: Recommended</option>
                                    <option>Highest Rated</option>
                                    <option>Most Jobs</option>
                                    <option>Lowest Rate</option>
                                    <option>Highest Rate</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {freelancers.map((freelancer) => (
                                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                                ))}
                            </div>

                            {/* Load More */}
                            <div className="text-center mt-12">
                                <button className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:border-violet-500/50 hover:text-white transition-all">
                                    Load More Freelancers
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <GlassCard className="p-12 text-center max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Freelancers Yet</h3>
                            <p className="text-zinc-400 mb-6">
                                Be the first to join our talent pool and showcase your skills to clients worldwide.
                            </p>
                            <Link href="/register">
                                <button className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all">
                                    Become a Freelancer
                                </button>
                            </Link>
                        </GlassCard>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
