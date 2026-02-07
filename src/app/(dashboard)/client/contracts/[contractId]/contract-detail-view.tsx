'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    User, Calendar, DollarSign, FileText, CheckCircle, XCircle,
    ArrowLeft, MessageSquare, FileSignature, Edit, Lock, Trash2, Clock,
    AlertTriangle, ShieldAlert, ArrowRight, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { updateContract, acceptContract, rejectContract, deleteContract } from '@/actions/contract-actions';
import { approveTrialWork, rejectTrialWork, raiseDispute, upgradeToStandard } from '@/actions/trial-actions';

interface ContractDetailData {
    id: string;
    title: string;
    totalBudget: number;
    status: string;
    terms: string;
    type: string;
    startDate: Date | null;
    endDate: Date | null;

    // Trial Specific
    escrowStatus?: string | null;
    trialAmount?: number | null;

    freelancerName: string;
    freelancerEmail: string;
    freelancerImage: string | null;

    proposalId: string | null;
    jobId: string | null;
    conversationId: string | null;
    rateType: string;
    milestones: any[];
    hourlyWorkPlan: any[];
}

interface ContractDetailViewProps {
    contract: ContractDetailData;
    role: 'CLIENT' | 'FREELANCER';
}

export function ContractDetailView({ contract, role }: ContractDetailViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: contract.title,
        totalBudget: contract.totalBudget,
        terms: contract.terms,
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : ''
    });

    const isTrial = contract.type === 'TRIAL';
    const canEdit = role === 'CLIENT' && contract.status === 'DRAFT';
    const canDecide = role === 'FREELANCER' && contract.status === 'DRAFT';
    const isLocked = contract.status === 'ACTIVE' || contract.status === 'REJECTED' || contract.status === 'COMPLETED';

    // Trial Actions
    const canApproveTrial = role === 'CLIENT' && isTrial && contract.status === 'ACTIVE';
    const canUpgradeTrial = role === 'CLIENT' && isTrial && contract.status === 'COMPLETED';
    const canDisputeTrial = role === 'FREELANCER' && isTrial && contract.status === 'REJECTED';

    const handleSaveEdit = () => {
        if (isTrial && !editData.endDate) {
            toast.error("Trial contracts must have an End Date defined.");
            return;
        }

        startTransition(async () => {
            const result = await updateContract(contract.id, {
                title: editData.title,
                totalBudget: editData.totalBudget,
                terms: editData.terms,
                startDate: editData.startDate ? new Date(editData.startDate) : undefined,
                endDate: editData.endDate ? new Date(editData.endDate) : undefined
            });
            if (result.success) {
                toast.success("Contract updated");
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update contract");
            }
        });
    };

    const handleAccept = () => {
        if (contract.totalBudget <= 0) {
            toast.error("Contract must have a budget before accepting.");
            return;
        }
        if (!contract.terms) {
            toast.error("Contract must have terms defined.");
            return;
        }

        startTransition(async () => {
            const result = await acceptContract(contract.id);
            if (result.success) {
                toast.success("Contract accepted! Work can begin.");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to accept contract");
            }
        });
    };

    const handleReject = () => {
        startTransition(async () => {
            const result = await rejectContract(contract.id);
            if (result.success) {
                toast.success("Contract rejected");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to reject contract");
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this draft contract? This cannot be undone.")) return;

        startTransition(async () => {
            const result = await deleteContract(contract.id);
            if (result.success) {
                toast.success("Contract deleted");
                router.push('/client/contracts');
            } else {
                toast.error(result.error || "Failed to delete contract");
            }
        });
    };

    // Trial Handlers
    const handleApproveTrial = () => {
        if (!confirm("Are you sure you want to approve this trial work? Funds will be released.")) return;
        startTransition(async () => {
            const result = await approveTrialWork(contract.id);
            if (result.success) {
                toast.success("Trial work approved! Escrow released.");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to approve trial");
            }
        });
    };

    const handleRejectTrial = () => {
        if (!confirm("Are you sure you want to reject this trial work? The freelancer can dispute this.")) return;
        startTransition(async () => {
            const result = await rejectTrialWork(contract.id);
            if (result.success) {
                toast.success("Trial work rejected.");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to reject trial");
            }
        });
    };

    const handleDispute = () => {
        if (!confirm("Are you sure you want to raise a dispute? Our team will review the work.")) return;
        startTransition(async () => {
            const result = await raiseDispute(contract.id);
            if (result.success) {
                toast.success("Dispute raised. Support team notified.");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to raise dispute");
            }
        });
    };

    const handleUpgrade = () => {
        startTransition(async () => {
            const result = await upgradeToStandard(contract.id);
            if (result.success && result.newContractId) {
                toast.success("Standard contract created!");
                router.push(`/client/contracts/${result.newContractId}`);
            } else {
                toast.error(result.error || "Failed to upgrade contract");
            }
        });
    };

    const handleMessage = () => {
        if (contract.conversationId) {
            router.push(`/messages?conversation=${contract.conversationId}`);
        } else {
            toast.error("No conversation available");
        }
    };

    const statusColor = {
        'DRAFT': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'REJECTED': 'bg-red-500/10 text-red-400 border-red-500/20',
        'COMPLETED': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'DISPUTED': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    }[contract.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

    const backLink = role === 'CLIENT' ? '/client/contracts' : '/freelancer/contracts';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link
                href={backLink}
                className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Contracts
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <FileSignature className="w-8 h-8 text-indigo-400" />
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="text-2xl font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
                        )}
                        {isLocked && <Lock className="w-4 h-4 text-zinc-500" />}
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-medium tracking-wide uppercase">
                            {contract.type === 'TRIAL' ? 'Paid Trial' : 'Standard Contract'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium tracking-wide uppercase ${statusColor}`}>
                            {contract.status}
                        </span>
                        {isTrial && contract.escrowStatus === 'RELEASED' && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium tracking-wide uppercase flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Funds Released
                            </span>
                        )}
                        {isTrial && contract.escrowStatus === 'FUNDED' && contract.status === 'ACTIVE' && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-zinc-500/10 text-zinc-400 border-zinc-500/20 font-medium tracking-wide uppercase flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Escrow Funded
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={handleMessage}
                        disabled={!contract.conversationId}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message {role === 'CLIENT' ? 'Freelancer' : 'Client'}
                    </GlassButton>
                </div>
            </div>

            {/* Trial Action Banner (Client) */}
            {canApproveTrial && (
                <GlassCard className="p-6 bg-indigo-500/10 border-indigo-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Review Trial Work</h3>
                            <p className="text-sm text-zinc-400">
                                Review the work submitted via chat. When satisfied, approve to release funds.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <GlassButton
                                variant="ghost"
                                className="text-red-400 hover:text-red-300"
                                onClick={handleRejectTrial}
                                disabled={isPending}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Work
                            </GlassButton>
                            <GlassButton
                                variant="primary"
                                onClick={handleApproveTrial}
                                disabled={isPending}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Release Funds
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Upgrade Banner (Client) */}
            {canUpgradeTrial && (
                <GlassCard className="p-6 bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Trial Successful</h3>
                            <p className="text-sm text-zinc-400">
                                You've approved this trial. Ready to hire for the full project?
                            </p>
                        </div>
                        <GlassButton
                            variant="primary"
                            onClick={handleUpgrade}
                            disabled={isPending}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Continue with Full Contract
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Dispute Banner (Freelancer) */}
            {canDisputeTrial && (
                <GlassCard className="p-6 bg-red-500/10 border-red-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Work Rejected</h3>
                            <p className="text-sm text-zinc-400">
                                The client rejected your trial work. If you believe this is unfair, you can raise a dispute.
                            </p>
                        </div>
                        <GlassButton
                            variant="secondary"
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/30"
                            onClick={handleDispute}
                            disabled={isPending}
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Raise Dispute
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Dispute Status Banner */}
            {contract.status === 'DISPUTED' && (
                <GlassCard className="p-6 bg-orange-500/10 border-orange-500/20 flex flex-col items-center text-center">
                    <AlertTriangle className="w-10 h-10 text-orange-400 mb-2" />
                    <h3 className="text-lg font-medium text-white">Dispute Under Review</h3>
                    <p className="text-sm text-zinc-400 max-w-md">
                        Our trust and safety team is reviewing this contract. Both parties will be contacted shortly. Funds are held in escrow.
                    </p>
                </GlassCard>
            )}


            {/* Contract Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 text-center">
                    <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    {isEditing ? (
                        <input
                            type="number"
                            value={editData.totalBudget}
                            onChange={(e) => setEditData({ ...editData, totalBudget: parseFloat(e.target.value) })}
                            className="text-xl font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-full text-center"
                        />
                    ) : (
                        <div className={`text-xl font-bold ${contract.totalBudget > 0 ? 'text-white' : 'text-zinc-500'}`}>
                            {contract.totalBudget > 0 ? `$${contract.totalBudget}` : 'Not set'}
                        </div>
                    )}
                    <div className="text-xs text-zinc-500">
                        {contract.type === 'TRIAL' ? 'Trial Amount' : 'Total Budget'}
                    </div>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                    <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    {isEditing ? (
                        <input
                            type="date"
                            value={editData.startDate}
                            onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full"
                        />
                    ) : (
                        <div className={`text-xl font-bold ${contract.startDate ? 'text-white' : 'text-zinc-500'}`}>
                            {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not set'}
                        </div>
                    )}
                    <div className="text-xs text-zinc-500">Start Date</div>
                </GlassCard>

                {/* End Date */}
                <GlassCard className={`p-4 text-center ${contract.type === 'TRIAL' && !contract.endDate ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                    <Calendar className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                    {isEditing ? (
                        <input
                            type="date"
                            value={editData.endDate}
                            onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full"
                        />
                    ) : (
                        <div className={`text-xl font-bold ${contract.endDate ? 'text-white' : 'text-zinc-500'}`}>
                            {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Not set'}
                        </div>
                    )}
                    <div className="text-xs text-zinc-500">
                        {contract.type === 'TRIAL' ? 'End Date (Required)' : 'End Date'}
                    </div>
                </GlassCard>
            </div>

            {/* Terms */}
            <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    {contract.type === 'TRIAL' ? 'Trial Scope / Description' : 'Contract Terms'}
                </h2>
                {isEditing ? (
                    <textarea
                        value={editData.terms}
                        onChange={(e) => setEditData({ ...editData, terms: e.target.value })}
                        className="w-full h-48 bg-zinc-800 border border-zinc-700 rounded p-4 text-white"
                        placeholder={contract.type === 'TRIAL' ? "Describe the specific task for this trial..." : "Enter contract terms..."}
                    />
                ) : (
                    <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {contract.terms || (
                            <span className="text-zinc-500 italic">No terms defined.</span>
                        )}
                    </div>
                )}
            </GlassCard>

            {/* Milestones (FIXED Standard Only) */}
            {contract.type !== 'TRIAL' && contract.rateType === 'FIXED' && contract.milestones && contract.milestones.length > 0 && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Milestones</h2>
                    <div className="space-y-3">
                        {contract.milestones.map((m: any, i: number) => (
                            <div key={i} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-white">{m.title}</h4>
                                    <span className="text-emerald-400 font-medium">${m.amount}</span>
                                </div>
                                <p className="text-sm text-zinc-400">{m.description}</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Hourstones (HOURLY Standard Only) */}
            {contract.type !== 'TRIAL' && contract.rateType === 'HOURLY' && contract.hourlyWorkPlan && contract.hourlyWorkPlan.length > 0 && (
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Hourstones (Hourly Work Plan)
                    </h2>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                        <p className="text-sm text-blue-300">
                            ℹ️ This plan is informational and may change during execution.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {contract.hourlyWorkPlan.map((entry: any, i: number) => (
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

            {/* Draft Actions (Accept/Reject) for Freelancer/Client */}
            {canDecide && (
                <GlassCard className="p-6 bg-amber-500/10 border-amber-500/20">
                    <h3 className="text-lg font-medium text-white mb-4">Contract Decision Required</h3>
                    <div className="flex gap-3">
                        <GlassButton variant="primary" size="lg" onClick={handleAccept} disabled={isPending} className="flex-1">
                            <CheckCircle className="w-5 h-5 mr-2" /> Accept
                        </GlassButton>
                        <GlassButton variant="ghost" size="lg" onClick={handleReject} disabled={isPending}>
                            <XCircle className="w-5 h-5 mr-2" /> Reject
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Edit Actions */}
            {canEdit && !isEditing && (
                <div className="flex justify-end gap-3">
                    <GlassButton variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </GlassButton>
                    <GlassButton variant="primary" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                    </GlassButton>
                </div>
            )}
            {canEdit && isEditing && (
                <div className="flex justify-end gap-3">
                    <GlassButton variant="ghost" onClick={() => setIsEditing(false)}>Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={handleSaveEdit} disabled={isPending}>Save Changes</GlassButton>
                </div>
            )}
        </div>
    );
}
