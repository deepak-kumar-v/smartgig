'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from '@/components/ui/glass-card';
import {
    FileText, AlertCircle, MoreHorizontal, Pencil, PauseCircle, XCircle, Trash2,
    User, Clock, DollarSign, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { JobReviewCard } from '@/components/job/job-review-card';
import { deleteJobPost } from '@/actions/job-actions-v2';

// Types (Mirrors JobPostFormData from v3.2 but adapted for read-only/display)
export interface JobDetailsData {
    id: string;
    title: string;
    category: string;
    subcategory?: string;
    customCategory?: string;
    customSubcategory?: string;
    budgetType: 'FIXED' | 'HOURLY';
    budgetMin?: number;
    budgetMax?: number; // Logic: if fixed, strictly use Max
    duration: string;
    experienceLevel: string;
    shortDescription?: string;
    description?: string;
    skills: string[];
    weeklyHours?: number;
    projectType?: 'ONE_TIME' | 'ONGOING';
    isRemote: boolean;
    locationRestrictions?: string[];
    visibility: 'PUBLIC' | 'INVITE_ONLY';
    allowTrialTask: boolean;
    contractToHire: boolean;
    screeningQuestions?: { question: string }[];
    attachments?: { name: string; size: number; url: string }[];
    status: string;
    createdAt: Date;
}

// Proposal item for display
export interface ProposalItemData {
    id: string;
    freelancerName: string;
    freelancerTitle: string;
    freelancerImage: string | null;
    freelancerTrustScore: number;
    coverLetterPreview: string;
    proposedRate: number;
    rateType: string;
    availability: string;
    status: string;
    createdAt: Date;
}

interface JobDetailsViewProps {
    job: JobDetailsData;
    proposals?: ProposalItemData[];
}

export function JobDetailsView({ job, proposals = [] }: JobDetailsViewProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    // Map job data to formData shape expected by the reused render logic
    const formData = job;
    const [showFullReview, setShowFullReview] = useState(true); // Default to expanded in details page

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        const result = await deleteJobPost(job.id);
        if (result.success) {
            router.push('/client/jobs');
        } else {
            alert(result.error || 'Failed to delete job');
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto">

            {/* Header / Meta / Actions */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${job.status === 'OPEN' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                            job.status === 'DRAFT' ? 'border-zinc-700 bg-zinc-800 text-zinc-400' :
                                'border-amber-500/20 bg-amber-500/10 text-amber-400'
                            }`}>
                            {job.status}
                        </span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white text-zinc-300 h-9">
                        <Pencil className="w-4 h-4 mr-2" /> Edit Job
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white text-zinc-300 h-9 w-9">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-zinc-800">
                            <DropdownMenuItem className="text-zinc-400 focus:text-white cursor-pointer hover:bg-zinc-800">
                                <PauseCircle className="w-4 h-4 mr-2" /> Pause Job
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-zinc-400 focus:text-white cursor-pointer hover:bg-zinc-800">
                                <XCircle className="w-4 h-4 mr-2" /> Close Job
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-400 focus:text-red-300 cursor-pointer hover:bg-red-500/10"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isDeleting ? 'Deleting...' : 'Delete Job'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs Component - Centered & Pill Style */}
            <Tabs defaultValue="overview" className="w-full flex flex-col items-center">
                <TabsList className="bg-zinc-900/50 border border-white/5 rounded-full p-1 h-auto mx-auto backdrop-blur-sm">
                    <TabsTrigger
                        value="overview"
                        className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="proposals"
                        className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
                    >
                        Proposals
                    </TabsTrigger>
                    <TabsTrigger
                        value="invite"
                        className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
                    >
                        Invite
                    </TabsTrigger>
                    <TabsTrigger
                        value="hire"
                        className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
                    >
                        Hire
                    </TabsTrigger>
                </TabsList>

                {/* Content Container - Left Aligned Content inside */}
                <div className="w-full mt-8">
                    {/* OVERVIEW TAB - REUSED SHARED COMPONENT FOR STRICT PARITY */}
                    <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GlassCard className="p-6 bg-zinc-800/30 border-zinc-800/50">
                            <JobReviewCard
                                formData={formData}
                                defaultExpanded={false} // Overview tab should default to collapsed per UX requirements
                                mode="readonly"
                            />
                        </GlassCard>
                    </TabsContent>

                    {/* PROPOSALS TAB */}
                    <TabsContent value="proposals">
                        {proposals.length === 0 ? (
                            <GlassCard className="p-10 border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                                <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
                                    <FileText className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No proposals yet</h3>
                                <p className="text-zinc-500 max-w-sm">
                                    Proposals from freelancers will appear here. Check back later or invite talent to apply.
                                </p>
                            </GlassCard>
                        ) : (
                            <div className="space-y-4">
                                {proposals.map((proposal) => (
                                    <GlassCard key={proposal.id} className="p-5 hover:border-zinc-700 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {proposal.freelancerImage ? (
                                                        <img src={proposal.freelancerImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-zinc-500" />
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-white truncate">{proposal.freelancerName}</h4>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            {proposal.freelancerTrustScore.toFixed(0)} Trust
                                                        </span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${proposal.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            proposal.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                proposal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                            }`}>
                                                            {proposal.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 mb-2">{proposal.freelancerTitle}</p>
                                                    <p className="text-sm text-zinc-500 line-clamp-2">{proposal.coverLetterPreview}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="w-3.5 h-3.5" />
                                                            ${proposal.proposedRate} {proposal.rateType === 'HOURLY' ? '/hr' : ' fixed'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {proposal.availability}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Action */}
                                            <a
                                                href={`/client/proposals/${proposal.id}`}
                                                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
                                            >
                                                View <ChevronRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* INVITE TAB */}
                    <TabsContent value="invite">
                        {formData.visibility === 'INVITE_ONLY' || formData.visibility === 'PUBLIC' ? (
                            <GlassCard className="p-6 bg-zinc-900/20">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-white">Invite Talent</h3>
                                    <Button size="sm" variant="outline">Browse Talent</Button>
                                </div>
                                <p className="text-zinc-500 text-sm">Use search to find and invite freelancers to this job.</p>
                            </GlassCard>
                        ) : (
                            <GlassCard className="p-6 bg-amber-500/5 border-amber-500/20">
                                <div className="flex items-center gap-3 text-amber-500 mb-2">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-medium">Invites Disabled</span>
                                </div>
                                <p className="text-amber-500/60 text-sm">
                                    This job is not configured to accept invites.
                                </p>
                            </GlassCard>
                        )}
                    </TabsContent>

                    {/* HIRE TAB */}
                    <TabsContent value="hire">
                        <GlassCard className="p-6 bg-zinc-900/20">
                            <h3 className="text-lg font-medium text-white mb-2">Hire Freelancers</h3>
                            <p className="text-zinc-500 text-sm">Manage offers and contracts for this job here.</p>
                        </GlassCard>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
