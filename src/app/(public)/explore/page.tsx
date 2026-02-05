import React from 'react';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';

import Link from 'next/link';
import { Search, MapPin, Filter, DollarSign } from 'lucide-react';
import { db } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

// Helper to format currency
const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
    const jobs = await db.jobPost.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            client: true,
            skills: true,
            _count: {
                select: { proposals: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-display font-bold text-white mb-4">Find Work</h1>
                    <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                            <GlassInput placeholder="Search for jobs (e.g. 'React Developer', '3D Artist')" className="pl-12 w-full" />
                        </div>
                        <div className="w-px h-10 bg-white/10 hidden md:block" />
                        <GlassButton variant="secondary" className="w-full md:w-auto">
                            <Filter className="w-4 h-4 mr-2" /> Filters
                        </GlassButton>
                        <GlassButton className="w-full md:w-auto">Search</GlassButton>
                    </GlassCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div>
                            <h3 className="text-white font-medium mb-4">Category</h3>
                            <div className="space-y-2">
                                {['Development', 'Design', 'Marketing', 'Writing'].map(c => (
                                    <label key={c} className="flex items-center gap-3 text-white/60 hover:text-white cursor-pointer">
                                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5" />
                                        <span className="text-sm">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-4">Experience Level</h3>
                            <div className="space-y-2">
                                {['Entry Level', 'Intermediate', 'Expert'].map(c => (
                                    <label key={c} className="flex items-center gap-3 text-white/60 hover:text-white cursor-pointer">
                                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5" />
                                        <span className="text-sm">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Job Feed */}
                    <div className="lg:col-span-3 space-y-4">
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 text-white/40">
                                <p>No jobs found. Be the first to post one!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map((job) => (
                                    <GlassCard key={job.id} variant="hoverable" className="p-6 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.isRemote ? "Remote" : "On-site"}</span>
                                                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatBudget(job.budget)}</span>
                                                    <span>Posted {formatDistanceToNow(job.createdAt)} ago</span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                                                {job.client.companyName ? job.client.companyName[0] : "C"}
                                            </div>
                                        </div>
                                        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {job.description}
                                        </p>
                                        <div className="flex gap-2 mb-6 flex-wrap">
                                            {job.skills.map(skill => (
                                                <span key={skill.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white/40">{job._count.proposals} Proposals</span>
                                            </div>
                                            <Link href={`/job/${job.id}`}>
                                                <GlassButton size="sm" variant="outline" asDiv>View Job</GlassButton>
                                            </Link>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}

                        {jobs.length > 10 && (
                            <div className="flex justify-center mt-10">
                                <GlassButton variant="ghost">Load More Jobs</GlassButton>
                            </div>
                        )}
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
