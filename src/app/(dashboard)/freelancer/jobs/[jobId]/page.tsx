import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ChevronLeft,
    Briefcase,
    DollarSign,
    Clock,
    MapPin,
    Zap,
    Calendar,
    Paperclip,
    ExternalLink,
    CheckCircle,
    Users
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

export default async function FreelancerJobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;

    const job = await db.jobPost.findUnique({
        where: { id: jobId },
        include: {
            client: {
                include: {
                    user: {
                        select: {
                            name: true,
                            isVerified: true
                        }
                    },
                    jobPosts: {
                        select: { id: true }
                    }
                }
            },
            skills: true
        }
    });

    if (!job) {
        notFound();
    }

    // Parse attachments safely
    let attachments: { name: string; size: number; url?: string }[] = [];
    try {
        if (job.attachments) {
            attachments = JSON.parse(job.attachments);
        }
    } catch (e) {
        console.error("Failed to parse attachments", e);
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back Link */}
                <Link
                    href="/freelancer/find-work"
                    className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Jobs
                </Link>

                {/* Header Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        {/* Job Info */}
                        <div className="flex-1 space-y-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                                {job.title}
                            </h1>

                            {/* Client Row */}
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-300">
                                    {job.client.companyName || job.client.user.name || 'Client'}
                                </span>
                                {job.client.user.isVerified && (
                                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                                    </span>
                                )}
                            </div>

                            {/* Metadata Pills */}
                            <div className="flex flex-wrap gap-3">
                                {/* Budget */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-medium text-emerald-400">
                                        {job.budgetType === 'HOURLY'
                                            ? `$${job.budgetMin || 0} - $${job.budgetMax}/hr`
                                            : `$${job.budgetMax?.toLocaleString()} Fixed`
                                        }
                                    </span>
                                </div>

                                {/* Experience */}
                                {job.experienceLevel && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
                                        <Zap className="w-4 h-4 text-zinc-400" />
                                        <span className="text-sm text-zinc-300">{job.experienceLevel}</span>
                                    </div>
                                )}

                                {/* Duration */}
                                {job.duration && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
                                        <Calendar className="w-4 h-4 text-zinc-400" />
                                        <span className="text-sm text-zinc-300">{job.duration}</span>
                                    </div>
                                )}

                                {/* Location */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm text-zinc-300">
                                        {job.isRemote ? 'Remote' : (job.regions || 'On-site')}
                                    </span>
                                </div>

                                {/* Posted */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                    <span className="text-sm text-zinc-300">
                                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Column */}
                        <div className="flex flex-col gap-3 shrink-0 md:min-w-[180px]">
                            <Link href={`/freelancer/proposals/apply?jobId=${jobId}`}>
                                <button className="w-full px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                                    Apply Now
                                </button>
                            </Link>
                            <button className="w-full px-6 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors">
                                Save Job
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Overview Section */}
                        {job.overview && (
                            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {job.overview}
                                </p>
                            </section>
                        )}

                        {/* Detailed Description */}
                        {job.descriptionMd && (
                            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Project Description</h2>
                                <div className="prose prose-invert prose-zinc max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold text-white border-b border-zinc-800 pb-2 mb-4 mt-6" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-white mt-6 mb-3" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-white mt-5 mb-2" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-zinc-300 leading-7 mb-4" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 text-zinc-300 space-y-1" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 text-zinc-300 space-y-1" {...props} />,
                                            li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-zinc-700 pl-4 text-zinc-400 italic my-4" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                return inline ? (
                                                    <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <code className="block bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono text-zinc-200" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            hr: ({ node, ...props }) => <hr className="border-zinc-800 my-6" {...props} />,
                                        }}
                                    >
                                        {job.descriptionMd}
                                    </ReactMarkdown>
                                </div>
                            </section>
                        )}

                        {/* Skills Section */}
                        {job.skills.length > 0 && (
                            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill) => (
                                        <span
                                            key={skill.id}
                                            className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm"
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Attachments Section */}
                        {attachments.length > 0 && (
                            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Attachments</h2>
                                <div className="space-y-2">
                                    {attachments.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-zinc-700 rounded-lg shrink-0">
                                                    <Paperclip className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-zinc-500">
                                                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                    </p>
                                                </div>
                                            </div>
                                            {file.url ? (
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-zinc-600 px-2">Unavailable</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">

                        {/* Client Info */}
                        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-semibold text-white mb-4">About the Client</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Client</span>
                                    <span className="text-white">
                                        {job.client.companyName || job.client.user.name || 'Anonymous'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Verification</span>
                                    {job.client.user.isVerified ? (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500">Unverified</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Jobs Posted</span>
                                    <span className="text-white">{job.client.jobPosts.length}</span>
                                </div>
                            </div>
                        </section>

                        {/* Job Terms */}
                        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="font-semibold text-white mb-4">Job Terms</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Project Type</span>
                                    <span className="text-white">
                                        {job.projectType === 'ONE_TIME' ? 'One-Time' : job.projectType || 'N/A'}
                                    </span>
                                </div>
                                {job.weeklyHours && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Weekly Hours</span>
                                        <span className="text-white">
                                            {job.weeklyHours < 10 ? '<10 hrs' :
                                                job.weeklyHours < 30 ? '10-30 hrs' : '30+ hrs'}
                                        </span>
                                    </div>
                                )}
                                {job.duration && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Duration</span>
                                        <span className="text-white">{job.duration}</span>
                                    </div>
                                )}
                                {job.allowTrialTask && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Trial Task</span>
                                        <span className="text-emerald-400">Allowed</span>
                                    </div>
                                )}
                                {job.contractToHire && (
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Contract-to-Hire</span>
                                        <span className="text-emerald-400">Yes</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </>
    );
}
