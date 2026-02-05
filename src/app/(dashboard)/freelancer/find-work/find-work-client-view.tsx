'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import Link from 'next/link';
import { Briefcase, Clock, DollarSign, Search, MapPin, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Job {
    id: string;
    title: string;
    overview: string;
    createdAt: Date;
    budgetType: string;
    budgetMin?: number | null;
    budgetMax: number;
    experienceLevel?: string | null;
    duration?: string | null;
    projectType?: string | null;
    isRemote?: boolean;
    client: {
        companyName: string | null;
        user: {
            name: string | null;
            isVerified: boolean;
        }
    };
    skills: {
        id: string;
        name: string;
    }[];
}

interface FindWorkClientViewProps {
    jobs: Job[];
}

export default function FindWorkClientView({ jobs }: FindWorkClientViewProps) {
    return (
        <DashboardShell role="freelancer">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Find Work</h1>
                        <p className="text-zinc-400 text-sm mt-1">Discover opportunities that match your expertise</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                {/* Empty State */}
                {jobs.length === 0 && (
                    <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 text-lg">No open jobs found at the moment.</p>
                        <p className="text-zinc-500 text-sm mt-1">Check back later for new opportunities</p>
                    </div>
                )}

                {/* Job Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {jobs.map((job) => {
                        const isTruncated = (job.overview || '').length > 180;
                        const overviewText = isTruncated
                            ? (job.overview || '').slice(0, 180) + '...'
                            : (job.overview || 'No description provided.');

                        const displaySkills = job.skills?.slice(0, 4) || [];
                        const overflowCount = (job.skills?.length || 0) - 4;

                        return (
                            <div
                                key={job.id}
                                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <Link href={`/freelancer/jobs/${job.id}`} className="flex-1 min-w-0">
                                        <h2 className="text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
                                            {job.title}
                                        </h2>
                                    </Link>
                                </div>

                                {/* Client & Time */}
                                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{job.client.companyName || job.client.user.name || 'Client'}</span>
                                        {job.client.user.isVerified && <span className="text-emerald-400 shrink-0" title="Verified">✓</span>}
                                    </span>
                                    <span className="flex items-center gap-1 shrink-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                    </span>
                                </div>

                                {/* Overview */}
                                <Link
                                    href={`/freelancer/jobs/${job.id}`}
                                    className="mb-4 flex-1 block group/text"
                                >
                                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 lg:line-clamp-4 group-hover/text:text-zinc-300 transition-colors">
                                        {overviewText}
                                        {isTruncated && (
                                            <span className="text-indigo-400 font-medium hover:underline ml-1">
                                                read more
                                            </span>
                                        )}
                                    </p>
                                </Link>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {displaySkills.map(skill => (
                                        <span
                                            key={skill.id}
                                            className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300"
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                    {overflowCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-md bg-zinc-800/50 text-xs text-zinc-500">
                                            +{overflowCount} more
                                        </span>
                                    )}
                                </div>

                                {/* Metadata Row */}
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
                                    <div className="flex items-center gap-3 text-xs">
                                        {/* Budget */}
                                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            {job.budgetType === 'HOURLY'
                                                ? `$${job.budgetMin || 0}-${job.budgetMax}/hr`
                                                : `$${job.budgetMax?.toLocaleString()}`
                                            }
                                        </span>
                                        {/* Experience */}
                                        {job.experienceLevel && (
                                            <span className="flex items-center gap-1 text-zinc-500">
                                                <Zap className="w-3.5 h-3.5" />
                                                {job.experienceLevel}
                                            </span>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    <Link href={`/freelancer/jobs/${job.id}`}>
                                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors">
                                            View Job
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardShell>
    );
}
