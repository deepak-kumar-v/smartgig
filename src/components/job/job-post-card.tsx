'use client';

import React from 'react';
import Link from 'next/link';
import {
    Briefcase,
    Send,
    FileText,
    MessageSquare,
    UserCheck
} from 'lucide-react';

export interface JobItem {
    id: string;
    title: string;
    proposalsCount: number;
    budget: number;
    status: string;
}

interface JobPostCardProps {
    job: JobItem;
}

export function JobPostCard({ job }: JobPostCardProps) {
    return (
        <Link href={`/client/jobs/${job.id}`} className="block group w-full max-w-[400px] mx-auto">
            {/* 
              Component: Active Job Post Card
              Style: Liquid Glass (Sharpened/Shadcn-like)
              Rules: Fixed layout, crisper borders, clearer contrast.
            */}
            <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-lg p-5 hover:border-white/20 hover:bg-zinc-900/60 transition-all duration-300 h-full flex flex-col shadow-sm">

                <div>
                    {/* Title Row */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/5 ring-1 ring-white/5">
                                <Briefcase className="w-5 h-5 text-zinc-400" />
                            </div>
                            <h2 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                                {job.title}
                            </h2>
                        </div>
                        <button className="text-zinc-500 hover:text-zinc-300 p-1 rounded-full hover:bg-white/5 transition-colors">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 rounded-full bg-current"></span>
                                <span className="w-1 h-1 rounded-full bg-current"></span>
                                <span className="w-1 h-1 rounded-full bg-current"></span>
                            </div>
                        </button>
                    </div>

                    {/* Meta Row (Badge + Time) */}
                    <div className="flex items-center gap-3 mb-10 pl-[52px]">
                        <span className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                            Open job post
                        </span>
                        <span className="text-zinc-500 text-xs">Created 1 day ago</span>
                    </div>

                    {/* Description Grid (Stats) */}
                    <div className="grid grid-cols-4 gap-2 mb-8">
                        {/* Slot 1: Invited */}
                        <div className="flex flex-col">
                            <span className="text-zinc-400 text-sm mb-1 font-medium">Invited</span>
                            <div className="flex items-center gap-1.5 text-zinc-300">
                                <Send className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm">0/30</span>
                            </div>
                        </div>

                        {/* Slot 2: Proposals */}
                        <div className="flex flex-col">
                            <span className="text-zinc-400 text-sm mb-1 font-medium">Proposals</span>
                            <div className="flex items-center gap-1.5 text-zinc-300">
                                <FileText className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm">{job.proposalsCount}</span>
                            </div>
                        </div>

                        {/* Slot 3: Messaged */}
                        <div className="flex flex-col">
                            <span className="text-zinc-400 text-sm mb-1 font-medium">Messaged</span>
                            <div className="flex items-center gap-1.5 text-zinc-300">
                                <MessageSquare className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm">0</span>
                            </div>
                        </div>

                        {/* Slot 4: Hired */}
                        <div className="flex flex-col">
                            <span className="text-zinc-400 text-sm mb-1 font-medium">Hired</span>
                            <div className="flex items-center gap-1.5 text-zinc-300">
                                <UserCheck className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm">0/1</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive Footer */}
                <div className="mt-auto pt-2">
                    <button className="w-full py-2 px-4 rounded-full border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/10 transition-colors text-sm">
                        Find talent
                    </button>
                </div>
            </div>
        </Link>
    );
}
