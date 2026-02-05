'use client';

import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    User, Calendar, Clock, DollarSign, FileText, CheckCircle, XCircle,
    ArrowLeft, Briefcase, Star, ListChecks, MessageSquare, Paperclip
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { acceptProposal, rejectProposal } from '@/actions/proposal-actions';
import { createContractFromProposal } from '@/actions/contract-actions';
import { FileSignature } from 'lucide-react';

interface Milestone {
    title: string;
    description: string;
    amount: number;
    duration: string;
}

interface HourlyWorkPlanEntry {
    title: string;
    description: string;
    hourRange?: string;
}

interface ProposalDetailData {
    id: string;
    jobId: string;
    jobTitle: string;

    // Freelancer
    freelancerName: string;
    freelancerTitle: string;
    freelancerImage: string | null;
    freelancerTrustScore: number;

    // Core
    coverLetter: string;
    proposedRate: number;
    rateType: string;
    availability: string;
    availabilityHoursPerWeek: number | null;
    expectedStartDate: Date | null;
    estimatedDuration: string | null;

    // Trial
    acceptsTrialTask: boolean;
    trialTaskProposal: string | null;
    contractToHireAcceptance: boolean | null;

    // Complex
    milestones: Milestone[];
    totalMilestoneAmount: number | null;
    screeningAnswers: Record<string, string>;
    selectedPortfolioIds: string[];

    // Meta
    status: string;
    createdAt: Date;

    // Messaging & Contract
    conversationId: string | null;
    contractId: string | null;
    contractStatus: string | null;

    // Hourly Work Plan (optional)
    hourlyWorkPlan: HourlyWorkPlanEntry[];

    // Trial eligibility
    jobAllowsTrialTask: boolean;
    trialContractId: string | null;
    trialContractStatus: string | null;
}

interface ProposalDetailViewProps {
    proposal: ProposalDetailData;
}

export function ProposalDetailView({ proposal }: ProposalDetailViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleAccept = () => {
        startTransition(async () => {
            const result = await acceptProposal(proposal.id);
            if (result.success) {
                toast.success("Proposal accepted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to accept proposal");
            }
        });
    };

    const handleReject = () => {
        startTransition(async () => {
            const result = await rejectProposal(proposal.id);
            if (result.success) {
                toast.success("Proposal rejected");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to reject proposal");
            }
        });
    };

    const handleCreateContract = (contractType: 'TRIAL' | 'FULL') => {
        startTransition(async () => {
            const result = await createContractFromProposal(proposal.id, contractType);
            if (result.success) {
                toast.success(`${contractType === 'TRIAL' ? 'Trial' : 'Full'} contract created successfully`);
                router.push(`/client/contracts/${result.contractId}`);
            } else {
                toast.error(result.error || "Failed to create contract");
            }
        });
    };

    const handleMessage = () => {
        if (proposal.conversationId) {
            router.push(`/messages?conversation=${proposal.conversationId}`);
        } else {
            toast.error("No conversation available yet");
        }
    };

    const statusColor = {
        'SUBMITTED': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'ACCEPTED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'REJECTED': 'bg-red-500/10 text-red-400 border-red-500/20',
        'DRAFT': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        'WITHDRAWN': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    }[proposal.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Link */}
            <Link
                href={`/client/jobs/${proposal.jobId}`}
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Job
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                        {proposal.freelancerImage ? (
                            <img src={proposal.freelancerImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white">{proposal.freelancerName}</h1>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {proposal.freelancerTrustScore.toFixed(0)} Trust
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {proposal.status}
                            </span>
                        </div>
                        <p className="text-zinc-400">{proposal.freelancerTitle}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                            <Briefcase className="w-4 h-4" />
                            Applied to: <span className="text-white">{proposal.jobTitle}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right text-sm text-zinc-500">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4 text-center">
                    <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">
                        ${proposal.proposedRate}
                        <span className="text-sm font-normal text-zinc-400">
                            {proposal.rateType === 'HOURLY' ? '/hr' : ' fixed'}
                        </span>
                    </div>
                    <div className="text-xs text-zinc-500">Proposed Rate</div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{proposal.availability}</div>
                    <div className="text-xs text-zinc-500">
                        {proposal.availabilityHoursPerWeek ? `${proposal.availabilityHoursPerWeek} hrs/week` : 'Availability'}
                    </div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <Calendar className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">
                        {proposal.estimatedDuration || 'TBD'}
                    </div>
                    <div className="text-xs text-zinc-500">Duration</div>
                </GlassCard>
            </div>

            {/* Cover Letter */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    Cover Letter
                </h2>
                <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {proposal.coverLetter}
                </div>
            </GlassCard>

            {/* Milestones (FIXED Only) */}
            {proposal.rateType === 'FIXED' && proposal.milestones && proposal.milestones.length > 0 && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-zinc-400" />
                        Proposed Milestones
                        {proposal.totalMilestoneAmount && (
                            <span className="text-sm font-normal text-zinc-500 ml-auto">
                                Total: ${proposal.totalMilestoneAmount.toLocaleString()}
                            </span>
                        )}
                    </h2>
                    <div className="space-y-3">
                        {proposal.milestones.map((m, i) => (
                            <div key={i} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-white">{m.title}</h4>
                                    <span className="text-emerald-400 font-medium">${m.amount}</span>
                                </div>
                                <p className="text-sm text-zinc-400">{m.description}</p>
                                <p className="text-xs text-zinc-500 mt-2">Duration: {m.duration}</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Hourly Work Plan (for HOURLY proposals) */}
            {proposal.rateType === 'HOURLY' && proposal.hourlyWorkPlan && proposal.hourlyWorkPlan.length > 0 && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Hourstones (Hourly Work Plan)
                    </h2>
                    {/* Disclaimer */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                        <p className="text-sm text-blue-300">
                            ℹ️ This plan is informational and may change during execution.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {proposal.hourlyWorkPlan.map((entry, i) => (
                            <div key={i} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-white">{entry.title}</h4>
                                    {entry.hourRange && (
                                        <span className="text-blue-400 font-medium text-sm">
                                            {entry.hourRange}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-zinc-400">{entry.description}</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Screening Answers */}
            {Object.keys(proposal.screeningAnswers || {}).length > 0 && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-zinc-400" />
                        Screening Question Responses
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(proposal.screeningAnswers).map(([question, answer], i) => (
                            <div key={i} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                                <p className="text-sm font-medium text-zinc-400 mb-2">Q: {question}</p>
                                <p className="text-white">{answer}</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Trial Task */}
            {proposal.acceptsTrialTask && (
                <GlassCard className="p-6 border-violet-500/20 bg-violet-500/5">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-violet-400" />
                        Trial Task Acceptance
                    </h2>
                    <div className="flex items-center gap-2 text-emerald-400 mb-3">
                        <CheckCircle className="w-5 h-5" />
                        Freelancer accepts paid trial tasks
                    </div>
                    {proposal.trialTaskProposal && (
                        <div className="bg-zinc-900/50 rounded-lg p-4 text-zinc-300">
                            <p className="text-sm text-zinc-500 mb-2">Trial Task Proposal:</p>
                            {proposal.trialTaskProposal}
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Actions */}
            {/* Actions: Only show if status is SUBMITTED */}
            {proposal.status === 'SUBMITTED' && (
                <div className="flex items-center gap-3 pt-4">
                    <GlassButton
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={handleAccept}
                        disabled={isPending}
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {isPending ? 'Processing...' : 'Accept Proposal'}
                    </GlassButton>
                    <GlassButton
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={handleMessage}
                        disabled={!proposal.conversationId}
                    >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Message Freelancer
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        size="lg"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={handleReject}
                        disabled={isPending}
                    >
                        <XCircle className="w-5 h-5 mr-2" />
                        {isPending ? 'Processing...' : 'Reject'}
                    </GlassButton>
                </div>
            )}

            {/* Resolution Message - Conditional Contract Creation */}
            {proposal.status === 'ACCEPTED' && !proposal.contractId && (
                <GlassCard className="p-6 bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                            <h3 className="text-lg font-medium text-white">Proposal Accepted</h3>
                            <p className="text-sm text-zinc-400">
                                {proposal.jobAllowsTrialTask && proposal.acceptsTrialTask
                                    ? 'Create a trial contract to evaluate this freelancer before full commitment.'
                                    : 'Create a contract to begin work with this freelancer.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <GlassButton
                                variant="secondary"
                                size="lg"
                                onClick={handleMessage}
                                disabled={!proposal.conversationId}
                            >
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Message
                            </GlassButton>
                            {/* MANDATORY TRIAL-FIRST: If trial required, show only Trial button */}
                            {proposal.jobAllowsTrialTask && proposal.acceptsTrialTask ? (
                                <GlassButton
                                    variant="primary"
                                    size="lg"
                                    onClick={() => handleCreateContract('TRIAL')}
                                    disabled={isPending}
                                >
                                    <FileSignature className="w-5 h-5 mr-2" />
                                    {isPending ? 'Creating...' : 'Create Trial Contract'}
                                </GlassButton>
                            ) : (
                                <GlassButton
                                    variant="primary"
                                    size="lg"
                                    onClick={() => handleCreateContract('FULL')}
                                    disabled={isPending}
                                >
                                    <FileSignature className="w-5 h-5 mr-2" />
                                    {isPending ? 'Creating...' : 'Create Full Contract'}
                                </GlassButton>
                            )}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Contract exists */}
            {proposal.status === 'ACCEPTED' && proposal.contractId && (
                <GlassCard className="p-6 bg-indigo-500/10 border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <FileSignature className="w-8 h-8 text-indigo-400 mb-2" />
                            <h3 className="text-lg font-medium text-white">Contract Created</h3>
                            <p className="text-sm text-zinc-400">
                                Status: <span className="text-indigo-400">{proposal.contractStatus}</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <GlassButton
                                variant="secondary"
                                size="lg"
                                onClick={handleMessage}
                                disabled={!proposal.conversationId}
                            >
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Message
                            </GlassButton>
                            <Link href={`/client/contracts/${proposal.contractId}`}>
                                <GlassButton variant="primary" size="lg">
                                    View Contract
                                </GlassButton>
                            </Link>
                        </div>
                    </div>
                </GlassCard>
            )}

            {proposal.status === 'REJECTED' && (
                <GlassCard className="p-4 bg-red-500/10 border-red-500/20 text-center">
                    <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-white">Proposal Rejected</h3>
                    <p className="text-sm text-zinc-400">You have rejected this proposal.</p>
                </GlassCard>
            )}
        </div>
    );
}
