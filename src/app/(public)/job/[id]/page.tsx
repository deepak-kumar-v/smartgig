import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Navbar } from '@/components/global/navbar';
import { Footer } from '@/components/global/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { ApplyButton } from '@/components/jobs/apply-button';
import { MapPin, DollarSign, Calendar, Globe, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; interface JobPageProps {
    params: Promise<{
        id: string;
    }>;
}

import { cache } from 'react';
import { Metadata } from 'next';

// Cache the fetch to deduplicate requests between page and metadata
const getJob = cache(async (id: string) => {
    return db.jobPost.findUnique({
        where: { id },
        include: {
            client: true,
            skills: true,
            _count: {
                select: { proposals: true }
            }
        }
    });
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const job = await getJob(id);

    if (!job) {
        return {
            title: 'Job Not Found | SmartGIG',
        };
    }

    return {
        title: `${job.title} | SmartGIG`,
        description: (job.overview || job.descriptionMd || '').slice(0, 160) + '...',
        openGraph: {
            title: job.title,
            description: (job.overview || job.descriptionMd || '').slice(0, 160) + '...',
        },
    };
}

export default async function JobDetailsPage({ params }: JobPageProps) {
    const { id } = await params;
    const session = await auth();
    const job = await getJob(id);

    if (!job) {
        notFound();
    }

    // Check if current user has already applied
    let hasApplied = false;
    let isFreelancer = false;

    if (session?.user) {
        isFreelancer = session.user.role === "FREELANCER";

        if (isFreelancer) {
            // Get profile first
            const profile = await db.freelancerProfile.findUnique({
                where: { userId: session.user.id }
            });

            if (profile) {
                const application = await db.proposal.findFirst({
                    where: {
                        jobId: job.id,
                        freelancerId: profile.id
                    }
                });
                hasApplied = !!application;
            }
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="mb-8 text-sm text-white/40">
                        <Link href="/explore" className="hover:text-white transition-colors">Find Work</Link>
                        <span className="mx-2">/</span>
                        <span>Job Details</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <GlassCard className="p-8">
                                <h1 className="text-3xl font-bold text-white mb-4">{job.title}</h1>

                                <div className="flex flex-wrap gap-6 text-sm text-white/60 mb-8 pb-8 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase font-bold">Budget</p>
                                            <p className="text-white font-medium">${(job.budgetMax ?? 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase font-bold">Location</p>
                                            <p className="text-white font-medium">{job.isRemote ? "Remote" : "On-site"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase font-bold">Posted</p>
                                            <p className="text-white font-medium">{formatDistanceToNow(job.createdAt)} ago</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-white/80">
                                    <h3 className="text-xl font-semibold text-white mb-4">Job Description</h3>
                                    {job.overview && job.descriptionMd ? (
                                        <div className="space-y-6">
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                <h4 className="text-lg font-medium text-white mb-2">Overview</h4>
                                                {job.overview}
                                            </div>
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                <h4 className="text-lg font-medium text-white mb-2">Detailed Project Description</h4>
                                                {job.descriptionMd}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed">
                                            {job.overview || job.descriptionMd || 'No description provided.'}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10">
                                    <h3 className="text-lg font-semibold text-white mb-4">Skills Required</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.map(skill => (
                                            <span key={skill.id} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
                                                {skill.name}
                                            </span>
                                        ))}
                                        {job.skills.length === 0 && (
                                            <span className="text-white/40 text-sm italic">No specific skills listed.</span>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <GlassCard className="p-6 space-y-6">
                                {hasApplied ? (
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center text-center gap-2">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                        <h3 className="text-green-400 font-bold">Applied</h3>
                                        <p className="text-xs text-green-400/70">You submitted a proposal for this job.</p>
                                    </div>
                                ) : (
                                    session ? (
                                        isFreelancer ? (
                                            <ApplyButton
                                                jobId={job.id}
                                                jobTitle={job.title}
                                                budget={job.budgetMax ?? 0}
                                            />
                                        ) : (
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <p className="text-sm text-white/50 mb-2">Switch to a freelancer account to apply.</p>
                                            </div>
                                        )
                                    ) : (
                                        <Link href="/login?role=freelancer" className="block w-full">
                                            <GlassButton className="w-full" asDiv>Log in to Apply</GlassButton>
                                        </Link>
                                    )
                                )}

                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="text-sm font-semibold text-white mb-4">About the Client</h4>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white">
                                            {job.client.companyName ? job.client.companyName[0] : "C"}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{job.client.companyName || "Client"}</div>
                                            <div className="text-xs text-white/40">Member since 2024</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-white/50">
                                        <div className="flex justify-between">
                                            <span>Job Postings</span>
                                            <span className="text-white">1</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Spent</span>
                                            <span className="text-white">$0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Hires</span>
                                            <span className="text-white">0</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
