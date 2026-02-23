'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    User, Calendar, DollarSign, FileText, CheckCircle, XCircle,
    ArrowLeft, MessageSquare, FileSignature, Edit, Lock, Trash2, Clock,
    AlertTriangle, ShieldAlert, ArrowRight, ShieldCheck, Layers, Plus
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    updateContract, acceptContract, rejectContract, deleteContract,
    sendForReview, requestChanges, finalizeContract, startContract
} from '@/actions/contract-actions';
import { approveTrialWork, rejectTrialWork, raiseDispute, upgradeToStandard } from '@/actions/trial-actions';
import { createMilestone, updateMilestone, deleteMilestone } from '@/actions/milestone-actions';
import EscrowPanel from '@/components/contract/escrow-panel';
import { ContractFinancialTimeline } from '@/components/contract/contract-financial-timeline';

// Decimal fields from Prisma may arrive as Decimal objects or numbers
type DecimalLike = number | { toNumber(): number };

function toNum(val: DecimalLike): number {
    return typeof val === 'object' ? val.toNumber() : val;
}

interface Milestone {
    id: string;
    title: string;
    description: string;
    amount: DecimalLike;
    dueDate?: string | null; // ISO string from DB
    status: string;
}

interface ContractDetailData {
    id: string;
    title: string;
    totalBudget: number;
    status: string;
    terms: string;
    type: string;
    startDate: Date | null;
    endDate: Date | null;

    freelancerName: string;
    freelancerEmail: string;
    freelancerImage: string | null;

    proposalId: string | null;
    jobId: string | null;
    conversationId: string | null;
    rateType: string;
    milestones: Milestone[];
    hourlyWorkPlan: any[];
    escrowAccount?: {
        status: string;
        locks: {
            amount: DecimalLike;
            released: boolean;
            milestoneId: string;
        }[];
    } | null;
}

interface ContractDetailViewProps {
    contract: ContractDetailData;
    role: 'CLIENT' | 'FREELANCER';
}

export function ContractDetailView({ contract, role }: ContractDetailViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

    const isTrial = contract.type === 'TRIAL';
    const isClient = role === 'CLIENT';
    const isFreelancer = role === 'FREELANCER';
    const isDraft = contract.status === 'DRAFT';

    // Contract Edit State
    const [editData, setEditData] = useState({
        title: contract.title,
        terms: contract.terms,
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : ''
    });

    // Milestone State (for adding new ones)
    const [newMilestone, setNewMilestone] = useState({
        title: '',
        description: '',
        amount: '',
        dueDate: ''
    });
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);

    // Trial Milestone Edit State
    const trialMilestone = contract.milestones[0];
    const [trialEdit, setTrialEdit] = useState({
        title: trialMilestone?.title || '',
        description: trialMilestone?.description || '',
        amount: trialMilestone?.amount?.toString() || '',
        dueDate: trialMilestone?.dueDate ? new Date(trialMilestone.dueDate).toISOString().split('T')[0] : ''
    });

    const canEdit = isClient && isDraft; // Strict Edit Lock
    const canDelete = isClient && isDraft;

    // Action Visibilities
    const showSendForReview = isClient && isDraft;
    const showClientFinalize = isClient && contract.status === 'ACCEPTED';
    const showClientFund = isClient && contract.status === 'FINALIZED';
    const showFreelancerStart = isFreelancer && contract.status === 'FUNDED';
    const showFreelancerDecision = isFreelancer && contract.status === 'PENDING_REVIEW';

    // Trial Actions
    const canFundEscrow = isClient && contract.status === 'FINALIZED';
    const canApproveTrial = isClient && isTrial && contract.status === 'ACTIVE';
    const canUpgradeTrial = isClient && isTrial && contract.status === 'COMPLETED';
    const canDisputeTrial = isFreelancer && isTrial && contract.status === 'REJECTED';

    const statusColor = {
        'DRAFT': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        'PENDING_REVIEW': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'ACCEPTED': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'FINALIZED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'REJECTED': 'bg-red-500/10 text-red-400 border-red-500/20',
        'COMPLETED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'DISPUTED': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'FUNDED': 'bg-green-500/10 text-green-400 border-green-500/20',
    }[contract.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

    // --- Handlers ---

    const handleSaveContract = () => {
        startTransition(async () => {
            const result = await updateContract(contract.id, {
                title: editData.title,
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

    const handleSaveTrialMilestone = () => {
        if (!trialMilestone) return;
        startTransition(async () => {
            const result = await updateMilestone(trialMilestone.id, {
                title: trialEdit.title,
                description: trialEdit.description,
                amount: parseFloat(trialEdit.amount),
                dueDate: trialEdit.dueDate ? new Date(trialEdit.dueDate) : null
            });

            if (result.success) {
                toast.success("Trial milestone updated");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update trial milestone");
            }
        });
    };

    const handleAddMilestone = () => {
        startTransition(async () => {
            const result = await createMilestone(contract.id, {
                title: newMilestone.title,
                description: newMilestone.description,
                amount: parseFloat(newMilestone.amount),
                dueDate: newMilestone.dueDate ? new Date(newMilestone.dueDate) : undefined
            });

            if (result.success) {
                toast.success("Milestone added");
                setIsAddingMilestone(false);
                setNewMilestone({ title: '', description: '', amount: '', dueDate: '' });
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create milestone");
            }
        });
    };

    const handleDeleteMilestone = (id: string) => {
        if (!confirm("Delete this milestone?")) return;
        startTransition(async () => {
            const result = await deleteMilestone(id);
            if (result.success) {
                toast.success("Milestone deleted");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete milestone");
            }
        });
    };

    const handleSendForReview = () => {
        startTransition(async () => {
            const result = await sendForReview(contract.id);
            if (result.success) {
                toast.success("Sent for review!");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to send");
            }
        });
    };

    const handleFinalizeContract = () => {
        wrapAction(() => finalizeContract(contract.id), "Contract Finalized", "Finalize this contract? This confirms all terms.");
    };

    // Fund Escrow is now handled by EscrowPanel

    const handleStartWork = () => {
        wrapAction(() => startContract(contract.id), "Work Started", "Start work on this contract?");
    };

    // Generic Action Wrappers
    const wrapAction = (action: () => Promise<any>, successMsg: string, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        startTransition(async () => {
            const result = await action();
            if (result.success) {
                toast.success(successMsg);
                if (result.newContractId) router.push(`/client/contracts/${result.newContractId}`);
                else router.refresh();
            } else {
                toast.error(result.error || "Action failed");
            }
        });
    };

    const handleTrialDueChange = (val: string) => {
        setTrialEdit({ ...trialEdit, dueDate: val });
        // Auto-fill Contract End Date if empty (Trial only)
        if (isTrial && !editData.endDate && val) {
            setEditData(prev => ({ ...prev, endDate: val }));
            toast.info("Contract End Date auto-filled from Milestone Due Date");
        }
    };

    return (
        <div className="w-full px-6 md:px-8 xl:px-16 py-6 pb-20" style={{ backgroundColor: '#0B0F14' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                {/* LEFT COLUMN — 65% */}
                <div className="space-y-6">
                    {/* Tab Bar */}
                    <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'details'
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'timeline'
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1E2328' }}>
                            <ContractFinancialTimeline contractId={contract.id} />
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (<>
                        {/* Header / Nav */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <Link
                                    href={isClient ? '/client/contracts' : '/freelancer/contracts'}
                                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Contracts
                                </Link>
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
                                    {!isDraft && <Lock className="w-4 h-4 text-zinc-500" />}
                                </div>

                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-medium tracking-wide uppercase">
                                        {isTrial ? 'Paid Trial' : 'Standard Contract'}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium tracking-wide uppercase ${statusColor}`}>
                                        {contract.status}
                                    </span>
                                    {contract.status === 'FUNDED' && (
                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium tracking-wide uppercase flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Escrow Funded
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {contract.jobId && (
                                    <Link href={`/jobs/${contract.jobId}/control`}>
                                        <GlassButton variant="secondary" size="sm">
                                            <Layers className="w-4 h-4 mr-2" />
                                            Control Center
                                        </GlassButton>
                                    </Link>
                                )}
                                <GlassButton
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        if (contract.conversationId) router.push(`/messages?conversation=${contract.conversationId}`);
                                        else toast.error("No conversation available");
                                    }}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Message
                                </GlassButton>
                            </div>
                        </div>

                        {/* Action Banners */}
                        {canApproveTrial && (
                            <GlassCard className="p-6 bg-indigo-500/10 border-indigo-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-white font-medium">Review Trial Work</h3>
                                        <p className="text-zinc-400 text-sm">Review submitted work before approving funds release.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <GlassButton variant="ghost" className="text-red-400" onClick={() => wrapAction(() => rejectTrialWork(contract.id), "Trial Rejected", "Reject trial work?")}>Reject</GlassButton>
                                        <GlassButton variant="primary" onClick={() => wrapAction(() => approveTrialWork(contract.id), "Trial Approved", "Approve trial and release funds?")}>Approve & Release</GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {showFreelancerDecision && (
                            <GlassCard className="p-6 bg-amber-500/10 border-amber-500/20">
                                <h3 className="text-white font-medium mb-4">Contract Review</h3>
                                <div className="flex gap-3">
                                    <GlassButton variant="primary" className="flex-1" onClick={() => wrapAction(() => acceptContract(contract.id), "Contract Accepted")}>Accept Contract</GlassButton>
                                    <GlassButton variant="ghost" onClick={() => wrapAction(() => requestChanges(contract.id), "Changes Requested")}>Request Changes</GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {showSendForReview && !isEditing && (
                            <GlassCard className="p-4 border-indigo-500/20 bg-indigo-500/5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Ready for Review?</h4>
                                        <p className="text-sm text-zinc-400">Send to freelancer for acceptance.</p>
                                    </div>
                                    <GlassButton variant="primary" onClick={handleSendForReview}>Send for Review <ArrowRight className="w-4 h-4 ml-2" /></GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {showClientFinalize && (
                            <GlassCard className="p-4 border-blue-500/20 bg-blue-500/5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Freelancer Accepted</h4>
                                        <p className="text-sm text-zinc-400">Review terms one last time and finalize.</p>
                                    </div>
                                    <GlassButton variant="primary" onClick={handleFinalizeContract}>Finalize Contract <CheckCircle className="w-4 h-4 ml-2" /></GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {/* Fund Escrow is now in the EscrowPanel sidebar */}

                        {showFreelancerStart && (
                            <GlassCard className="p-4 border-emerald-500/20 bg-emerald-500/5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Ready to Start?</h4>
                                        <p className="text-sm text-zinc-400">Escrow funded. Click Start Work to begin the milestone.</p>
                                    </div>
                                    <GlassButton variant="primary" onClick={handleStartWork}>Start Work <Clock className="w-4 h-4 ml-2" /></GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {/* Trial Milestone Section (TRIAL ONLY) */}
                        {isTrial && (
                            <GlassCard className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    Trial Milestone
                                </h2>

                                {/* Trial is always single milestone. If draft/client, show editor. Else show details. */}
                                {canEdit ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Task Title</label>
                                            <input
                                                type="text"
                                                value={trialEdit.title}
                                                onChange={e => setTrialEdit({ ...trialEdit, title: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                                placeholder="e.g., Design Initial Mockup"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1">Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-zinc-500">$</span>
                                                    <input
                                                        type="number"
                                                        value={trialEdit.amount}
                                                        onChange={e => setTrialEdit({ ...trialEdit, amount: e.target.value })}
                                                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 pl-7 text-white text-right"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                                    Milestone Due Date <span className="text-zinc-600 font-normal ml-1">(Deadline for submitting work)</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={trialEdit.dueDate}
                                                    onChange={e => handleTrialDueChange(e.target.value)}
                                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Detailed Description</label>
                                            <textarea
                                                value={trialEdit.description}
                                                onChange={e => setTrialEdit({ ...trialEdit, description: e.target.value })}
                                                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                                placeholder="Describe the specific deliverables and requirements for this trial..."
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <GlassButton variant="primary" size="sm" onClick={handleSaveTrialMilestone} disabled={isPending}>Save Trial Milestone</GlassButton>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-medium text-white">{trialMilestone?.title || "Untitled Task"}</h3>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-emerald-400">${trialMilestone?.amount?.toLocaleString() ?? '0.00'}</div>
                                                <div className="text-xs text-zinc-500">Milestone Due: {trialMilestone?.dueDate ? new Date(trialMilestone.dueDate).toLocaleDateString() : 'Not set'}</div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                            {trialMilestone?.description || <span className="text-zinc-500 italic">No description provided.</span>}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        )}

                        {/* Milestones Section (FULL ONLY) */}
                        {!isTrial && contract.rateType === 'FIXED' && (
                            <GlassCard className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                        Milestones
                                    </h2>
                                    {canEdit && !isAddingMilestone && (
                                        <GlassButton variant="secondary" size="sm" onClick={() => setIsAddingMilestone(true)}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Milestone
                                        </GlassButton>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* List */}
                                    {contract.milestones.map((m, i) => (
                                        <div key={m.id} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-zinc-500">#{i + 1}</span>
                                                    <h4 className="font-medium text-white">{m.title}</h4>
                                                </div>
                                                <p className="text-sm text-zinc-400 mt-1">{m.description}</p>
                                                <div className="text-xs text-zinc-500 mt-2">Milestone Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Unset'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-emerald-400 text-lg">${m.amount.toLocaleString()}</div>
                                                {canDelete && (
                                                    <button onClick={() => handleDeleteMilestone(m.id)} className="text-red-400 hover:text-red-300 text-xs mt-2 flex items-center ml-auto">
                                                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Form */}
                                    {isAddingMilestone && (
                                        <div className="p-4 bg-zinc-800 rounded-lg border border-indigo-500/50 space-y-3">
                                            <h4 className="text-sm font-medium text-white">New Milestone</h4>
                                            <input
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm"
                                                placeholder="Title"
                                                value={newMilestone.title}
                                                onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    className="w-1/2 bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm"
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={newMilestone.amount}
                                                    onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                                                />
                                                <div className="w-1/2">
                                                    <input
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm"
                                                        type="date"
                                                        value={newMilestone.dueDate}
                                                        onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                                                    />
                                                    <div className="text-[10px] text-zinc-500 mt-1">Milestone Due Date</div>
                                                </div>
                                            </div>
                                            <textarea
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm h-20"
                                                placeholder="Description"
                                                value={newMilestone.description}
                                                onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <GlassButton variant="ghost" size="sm" onClick={() => setIsAddingMilestone(false)}>Cancel</GlassButton>
                                                <GlassButton variant="primary" size="sm" onClick={handleAddMilestone} disabled={isPending}>Add Milestone</GlassButton>
                                            </div>
                                        </div>
                                    )}

                                    {contract.milestones.length === 0 && !isAddingMilestone && (
                                        <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700 rounded-lg">
                                            No milestones added yet.
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        )}



                        {/* Escrow data is now displayed in the EscrowPanel sidebar */}

                        {/* 2. Contract Timeline Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassCard className="p-4 text-center">
                                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.startDate}
                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full text-center"
                                    />
                                ) : (
                                    <div className="text-white font-medium">{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not Set'}</div>
                                )}
                                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">Contract Start Date</div>
                            </GlassCard>
                            <GlassCard className="p-4 text-center">
                                <Calendar className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.endDate}
                                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-full text-center"
                                    />
                                ) : (
                                    <div className="text-white font-medium">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Not Set'}</div>
                                )}
                                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">Contract End Date</div>
                            </GlassCard>
                            <div className="col-span-full text-center text-xs text-zinc-500 -mt-2">Overall timeline of the agreement.</div>
                        </div>

                        {/* Budget info is integrated into the EscrowPanel sidebar */}

                        {/* Terms (Classic Full Contract Only) */}
                        {!isTrial && (
                            <GlassCard className="p-6">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-zinc-400" />
                                    Usage Terms
                                </h2>
                                {isEditing ? (
                                    <textarea
                                        value={editData.terms}
                                        onChange={(e) => setEditData({ ...editData, terms: e.target.value })}
                                        className="w-full h-48 bg-zinc-800 border border-zinc-700 rounded p-4 text-white"
                                        placeholder="Enter general contract terms..."
                                    />
                                ) : (
                                    <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                        {contract.terms || <span className="text-zinc-500 italic">No general terms defined.</span>}
                                    </div>
                                )}
                            </GlassCard>
                        )}

                        {/* Edit Controls */}
                        {canEdit && !isEditing && (
                            <div className="flex justify-end gap-3 mt-8">
                                {canDelete && (
                                    <GlassButton variant="ghost" onClick={() => wrapAction(() => deleteContract(contract.id), "Contract Deleted", "Delete this draft?")} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete Draft
                                    </GlassButton>
                                )}
                                <GlassButton variant="primary" onClick={() => setIsEditing(true)}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                                </GlassButton>
                            </div>
                        )}
                        {canEdit && isEditing && (
                            <div className="flex justify-end gap-3 mt-8">
                                <GlassButton variant="ghost" onClick={() => setIsEditing(false)}>Cancel</GlassButton>
                                <GlassButton variant="primary" onClick={handleSaveContract} disabled={isPending}>Save Changes</GlassButton>
                            </div>
                        )}
                    </>) /* end Details tab */}
                </div>

                {/* RIGHT COLUMN — 35% Sticky Financial Panel */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <EscrowPanel
                        contractId={contract.id}
                        contractStatus={contract.status}
                        role={role}
                    />
                </div>

            </div>
        </div>
    );
}
