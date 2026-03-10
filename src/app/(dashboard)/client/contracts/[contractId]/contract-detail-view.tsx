'use client';

import React, { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    User, Calendar, DollarSign, FileText, CheckCircle, XCircle,
    ArrowLeft, MessageSquare, FileSignature, Edit, Lock, Trash2, Clock,
    AlertTriangle, ShieldAlert, ArrowRight, ShieldCheck, Layers, Plus, Info
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
    updateContract, acceptContract, rejectContract, deleteContract,
    sendForReview, requestChanges, finalizeContract, startContract, cancelContract
} from '@/actions/contract-actions';
import { approveTrialWork, rejectTrialWork, raiseDispute, upgradeToStandard } from '@/actions/trial-actions';
import { createMilestone, updateMilestone, deleteMilestone, startMilestone, submitMilestone, approveMilestone, reorderMilestones, openDispute } from '@/actions/milestone-actions';
import { fundMilestone, refundMilestone } from '@/actions/escrow-actions';
import { releaseMilestoneFunds } from '@/actions/escrow-release-actions';
import { createDeliverable } from '@/actions/deliverable-actions';
import EscrowPanel from '@/components/contract/escrow-panel';
import { ContractFinancialTimeline } from '@/components/contract/contract-financial-timeline';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Custom KeyboardSensor: skip activation inside form elements ──
// Without this, @dnd-kit's default KeyboardSensor intercepts Space/Enter
// in inputs/textareas, blocking normal typing.
class SmartKeyboardSensor extends KeyboardSensor {
    static shouldHandleEvent(event: KeyboardEvent) {
        const target = event.target as HTMLElement | null;
        if (!target) return true;
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
        if (target.isContentEditable) return false;
        return true;
    }
}

// Decimal fields from Prisma may arrive as Decimal objects or numbers
type DecimalLike = number | { toNumber(): number };

function toNum(val: DecimalLike): number {
    return typeof val === 'object' ? val.toNumber() : val;
}

// ── Sortable Milestone Card component for DnD ──
function SortableMilestoneCard({ id, disabled, isEditing, children }: { id: string; disabled: boolean; isEditing?: boolean; children: React.ReactNode }) {
    const effectiveDisabled = disabled || !!isEditing;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: effectiveDisabled });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(effectiveDisabled ? {} : listeners)}
            className={`p-5 rounded-xl border transition-colors ${isEditing
                ? 'bg-zinc-800/80 border-indigo-500/30'
                : 'bg-zinc-800/50 border-zinc-700'
                }`}
        >
            {children}
        </div>
    );
}

interface Milestone {
    id: string;
    sequence: number;
    title: string;
    description: string;
    amount: DecimalLike;
    dueDate?: string | null;
    status: string;
    deliverables?: { id: string; fileUrl: string; comment: string | null; createdAt: string }[];
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
    const [panelRefreshKey, setPanelRefreshKey] = useState(0);
    const refreshAll = useCallback(() => { router.refresh(); setPanelRefreshKey(k => k + 1); }, [router]);
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

    const showFreelancerStart = isFreelancer && (contract.status === 'FUNDED' || contract.status === 'FINALIZED');
    const showFreelancerDecision = isFreelancer && contract.status === 'PENDING_REVIEW';


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
                refreshAll();
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
                refreshAll();
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
                refreshAll();
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
                refreshAll();
            } else {
                toast.error(result.error || "Failed to delete milestone");
            }
        });
    };

    // ── Inline Edit Milestone ──
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
    const [editMilestoneData, setEditMilestoneData] = useState({ title: '', description: '', amount: '', dueDate: '' });

    const startEditMilestone = (m: Milestone) => {
        setEditingMilestoneId(m.id);
        setEditMilestoneData({
            title: m.title,
            description: m.description,
            amount: toNum(m.amount).toString(),
            dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
        });
    };

    const handleSaveMilestoneEdit = () => {
        if (!editingMilestoneId) return;
        startTransition(async () => {
            const result = await updateMilestone(editingMilestoneId, {
                title: editMilestoneData.title,
                description: editMilestoneData.description,
                amount: parseFloat(editMilestoneData.amount),
                dueDate: editMilestoneData.dueDate ? new Date(editMilestoneData.dueDate) : null,
            });
            if (result.success) {
                toast.success("Milestone updated");
                setEditingMilestoneId(null);
                refreshAll();
            } else {
                toast.error(result.error || "Failed to update milestone");
            }
        });
    };

    // ── Drag & Drop Reorder (DRAFT only) ──
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(SmartKeyboardSensor)
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = contract.milestones.findIndex(m => m.id === active.id);
        const newIndex = contract.milestones.findIndex(m => m.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(contract.milestones, oldIndex, newIndex);
        const orderedIds = reordered.map(m => m.id);

        startTransition(async () => {
            const result = await reorderMilestones(contract.id, orderedIds);
            if (result.success) {
                toast.success("Milestones reordered");
                refreshAll();
            } else {
                toast.error(result.error || "Failed to reorder");
            }
        });
    }, [contract.milestones, contract.id, refreshAll]);

    const handleSendForReview = () => {
        startTransition(async () => {
            const result = await sendForReview(contract.id);
            if (result.success) {
                toast.success("Sent for review!");
                refreshAll();
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
                else refreshAll();
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


                        {canUpgradeTrial && (
                            <GlassCard className="p-6 bg-purple-500/10 border-purple-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-white font-medium">Trial Completed</h3>
                                        <p className="text-zinc-400 text-sm">Upgrade this trial to a full standard contract.</p>
                                    </div>
                                    <GlassButton
                                        variant="primary"
                                        onClick={() => wrapAction(
                                            () => upgradeToStandard(contract.id),
                                            "Upgraded to Standard Contract",
                                            "Upgrade this trial to a full contract?"
                                        )}
                                        disabled={isPending}
                                    >
                                        Upgrade to Standard Contract <ArrowRight className="w-4 h-4 ml-2" />
                                    </GlassButton>
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
                                        <p className="text-sm text-zinc-400">
                                            {contract.status === 'FUNDED'
                                                ? 'Escrow funded. Click Start Work to begin.'
                                                : 'Contract finalized. Click Start Work to activate the contract.'}
                                        </p>
                                    </div>
                                    <GlassButton variant="primary" onClick={handleStartWork}>Start Work <Clock className="w-4 h-4 ml-2" /></GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {/* Milestones Section (Unified — Trial + Standard) */}
                        {contract.rateType === 'FIXED' && (
                            <GlassCard className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                        {isTrial ? 'Milestone' : 'Milestones'}
                                    </h2>
                                    {canEdit && !isAddingMilestone && !isTrial && (
                                        <GlassButton variant="secondary" size="sm" onClick={() => setIsAddingMilestone(true)}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Milestone
                                        </GlassButton>
                                    )}
                                </div>

                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={canEdit ? handleDragEnd : undefined}>
                                    <SortableContext items={contract.milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-4">
                                            {contract.milestones.map((m, i) => {
                                                // Determine milestone funding state from escrow locks
                                                const lock = contract.escrowAccount?.locks.find(l => l.milestoneId === m.id);
                                                const isFunded = !!lock && !lock.released;
                                                const isReleased = !!lock && lock.released;
                                                const isPaid = m.status === 'PAID';

                                                // Sequential check: all previous milestones must be PAID to fund this one
                                                const allPreviousPaid = contract.milestones.slice(0, i).every(prev => prev.status === 'PAID');
                                                const isNextFundable = !isFunded && !isReleased && !isPaid && m.status === 'PENDING' && allPreviousPaid;
                                                const isBlockedBySequence = !isFunded && !isReleased && !isPaid && m.status === 'PENDING' && !allPreviousPaid;

                                                // ── CLIENT ACTION CONDITIONS ──
                                                const canFundThis = isClient && contract.status === 'ACTIVE' && isNextFundable;
                                                const canApproveRelease = isClient && contract.status === 'ACTIVE' && m.status === 'SUBMITTED';

                                                // ── FREELANCER ACTION CONDITIONS ──
                                                const canStartMs = isFreelancer && contract.status === 'ACTIVE' && m.status === 'PENDING' && isFunded;
                                                const canSubmitWork = isFreelancer && contract.status === 'ACTIVE' && m.status === 'IN_PROGRESS';
                                                const deliverableCount = m.deliverables?.length ?? 0;

                                                const isEditingThis = editingMilestoneId === m.id;

                                                return (
                                                    <SortableMilestoneCard key={m.id} id={m.id} disabled={!canEdit || isAddingMilestone} isEditing={isEditingThis}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    {canEdit && !isEditingThis && !isAddingMilestone && <span className="cursor-grab text-zinc-600 hover:text-zinc-400">⠿</span>}
                                                                    <span className="text-xs font-mono text-zinc-500">#{m.sequence}</span>
                                                                    <h4 className="font-medium text-white">{m.title}</h4>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                        m.status === 'SUBMITTED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                            m.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                                m.status === 'IN_PROGRESS' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                                                    m.status === 'DISPUTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                                        }`}>{m.status}</span>
                                                                </div>
                                                                <p className="text-sm text-zinc-400 mt-1">{m.description}</p>
                                                                <div className="text-xs text-zinc-500 mt-2">Milestone Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Unset'}</div>

                                                                {/* Status badges (ACTIVE + FULL only) */}
                                                                {contract.status === 'ACTIVE' && (
                                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                                        {isFunded && m.status !== 'SUBMITTED' && m.status !== 'APPROVED' && (
                                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Funded — In Escrow</span>
                                                                        )}
                                                                        {isPaid && (
                                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>
                                                                        )}
                                                                        {isFreelancer && !isFunded && !isReleased && !isPaid && m.status === 'PENDING' && (
                                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Waiting for Client Funding</span>
                                                                        )}
                                                                        {isFreelancer && m.status === 'SUBMITTED' && (
                                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Waiting for Client Approval</span>
                                                                        )}
                                                                        {isClient && isBlockedBySequence && (
                                                                            <span className="text-[11px] text-zinc-500">Previous milestone must be completed first</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-2">
                                                                <div className="font-bold text-emerald-400 text-lg">${m.amount.toLocaleString()}</div>

                                                                {/* ── CLIENT: Fund Milestone ── */}
                                                                {canFundThis && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Fund milestone "${m.title}" for $${toNum(m.amount).toLocaleString()}? This will debit your wallet.`)) return;
                                                                            startTransition(async () => {
                                                                                const result = await fundMilestone(m.id);
                                                                                if (result.success) { toast.success(`Milestone "${m.title}" funded`); refreshAll(); }
                                                                                else { toast.error(result.error || 'Failed to fund milestone'); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
                                                                    >
                                                                        Fund Milestone
                                                                    </button>
                                                                )}

                                                                {/* ── CLIENT: Refund Milestone (PENDING + FUNDED only) ── */}
                                                                {isClient && (contract.status === 'ACTIVE' || contract.status === 'FUNDED') && m.status === 'PENDING' && isFunded && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Refund milestone "${m.title}"? $${toNum(m.amount).toLocaleString()} will be returned to your wallet. This cannot be undone.`)) return;
                                                                            startTransition(async () => {
                                                                                const result = await refundMilestone(m.id);
                                                                                if (result.success) { toast.success(`Milestone "${m.title}" refunded`); refreshAll(); }
                                                                                else { toast.error(result.error || 'Failed to refund milestone'); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)' }}
                                                                    >
                                                                        Refund Milestone
                                                                    </button>
                                                                )}

                                                                {/* ── CLIENT: Approve & Release ── */}
                                                                {canApproveRelease && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Approve milestone "${m.title}" and release funds?`)) return;
                                                                            startTransition(async () => {
                                                                                const approveResult = await approveMilestone(m.id);
                                                                                if (!approveResult.success) { toast.error(approveResult.error || 'Failed to approve'); return; }
                                                                                const releaseResult = await releaseMilestoneFunds(m.id);
                                                                                if (releaseResult.success) { toast.success(`Milestone "${m.title}" approved & funds released`); refreshAll(); }
                                                                                else { toast.error(releaseResult.error || 'Approved but release failed'); refreshAll(); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', backgroundColor: 'rgba(96,165,250,0.08)' }}
                                                                    >
                                                                        Approve &amp; Release
                                                                    </button>
                                                                )}

                                                                {/* ── CLIENT: Open Dispute (SUBMITTED only) ── */}
                                                                {isClient && contract.status === 'ACTIVE' && m.status === 'SUBMITTED' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Open a dispute for milestone "${m.title}"? This will freeze escrow funds until resolved.`)) return;
                                                                            startTransition(async () => {
                                                                                const result = await openDispute(m.id);
                                                                                if (result.success) { toast.success(`Dispute opened for "${m.title}"`); refreshAll(); }
                                                                                else { toast.error(result.error || 'Failed to open dispute'); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)', backgroundColor: 'rgba(251,146,60,0.08)' }}
                                                                    >
                                                                        Open Dispute
                                                                    </button>
                                                                )}

                                                                {/* ── DISPUTED: Frozen badge ── */}
                                                                {m.status === 'DISPUTED' && (
                                                                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Dispute Pending — Escrow Frozen</span>
                                                                )}

                                                                {/* ── FREELANCER: Start Milestone ── */}
                                                                {canStartMs && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Start working on "${m.title}"?`)) return;
                                                                            startTransition(async () => {
                                                                                const result = await startMilestone(m.id);
                                                                                if (result.success) { toast.success(`Milestone "${m.title}" started`); refreshAll(); }
                                                                                else { toast.error(result.error || 'Failed to start milestone'); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#22d3ee', borderColor: 'rgba(34,211,238,0.3)', backgroundColor: 'rgba(34,211,238,0.08)' }}
                                                                    >
                                                                        Start Milestone
                                                                    </button>
                                                                )}

                                                                {/* ── FREELANCER: Submit Work ── */}
                                                                {canSubmitWork && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!confirm(`Submit work for "${m.title}"?`)) return;
                                                                            startTransition(async () => {
                                                                                const result = await submitMilestone(m.id);
                                                                                if (result.success) { toast.success(`Milestone "${m.title}" submitted`); refreshAll(); }
                                                                                else { toast.error(result.error || 'Failed to submit milestone'); }
                                                                            });
                                                                        }}
                                                                        disabled={isPending || deliverableCount === 0}
                                                                        className="text-[12px] px-3 py-1.5 rounded border font-medium transition-colors disabled:opacity-40"
                                                                        style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)' }}
                                                                    >
                                                                        Submit Work
                                                                    </button>
                                                                )}

                                                                {canDelete && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => startEditMilestone(m)}
                                                                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-1" /> Edit
                                                                        </button>
                                                                        <button onClick={() => handleDeleteMilestone(m.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center">
                                                                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Inline edit form (DRAFT only) */}
                                                        {isEditingThis && (
                                                            <div className="mt-4 p-6 bg-zinc-900/60 rounded-xl border border-indigo-500/20 space-y-5">
                                                                {/* Title */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Milestone Title</label>
                                                                    <input
                                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                                        placeholder="Enter milestone title"
                                                                        value={editMilestoneData.title}
                                                                        onChange={e => setEditMilestoneData({ ...editMilestoneData, title: e.target.value })}
                                                                    />
                                                                </div>
                                                                {/* Description */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                                                                    <textarea
                                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors resize-y"
                                                                        style={{ minHeight: '100px' }}
                                                                        placeholder="Describe what this milestone covers"
                                                                        value={editMilestoneData.description}
                                                                        onChange={e => setEditMilestoneData({ ...editMilestoneData, description: e.target.value })}
                                                                    />
                                                                </div>
                                                                {/* Amount + Due Date side by side */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Amount ($)</label>
                                                                        <input
                                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                                            type="number" step="0.01" placeholder="0.00"
                                                                            value={editMilestoneData.amount}
                                                                            onChange={e => setEditMilestoneData({ ...editMilestoneData, amount: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
                                                                        <input
                                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                                            type="date"
                                                                            value={editMilestoneData.dueDate}
                                                                            onChange={e => setEditMilestoneData({ ...editMilestoneData, dueDate: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {/* Actions */}
                                                                <div className="flex justify-end gap-3 pt-1">
                                                                    <GlassButton variant="ghost" size="sm" onClick={() => setEditingMilestoneId(null)}>Cancel</GlassButton>
                                                                    <GlassButton variant="primary" size="sm" onClick={handleSaveMilestoneEdit} disabled={isPending}>Save Changes</GlassButton>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Deliverables section (IN_PROGRESS milestones) */}
                                                        {m.status === 'IN_PROGRESS' && isFreelancer && (
                                                            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-medium text-zinc-400">Deliverables ({deliverableCount})</span>
                                                                        <span className="relative group">
                                                                            <Info className="w-3.5 h-3.5 text-zinc-500 cursor-help" />
                                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex whitespace-nowrap bg-zinc-900 text-zinc-300 text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-700 shadow-lg z-50">
                                                                                Max file size: 50 MB · All file types accepted
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {deliverableCount === 0 && (
                                                                    <p className="text-xs text-amber-400 mb-2">Upload at least one deliverable before submitting work.</p>
                                                                )}
                                                                {(m.deliverables ?? []).map(d => (
                                                                    <div key={d.id} className="text-xs text-zinc-300 flex items-center gap-2 py-1">
                                                                        <FileText className="w-3 h-3 text-zinc-500" />
                                                                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">{d.fileUrl.split('/').pop()}</a>
                                                                        {d.comment && <span className="text-zinc-500">— {d.comment}</span>}
                                                                    </div>
                                                                ))}
                                                                {/* Upload form */}
                                                                <form
                                                                    className="mt-3 flex flex-col gap-2"
                                                                    onSubmit={(e) => {
                                                                        e.preventDefault();
                                                                        const form = e.currentTarget;
                                                                        const fd = new FormData(form);
                                                                        fd.set('milestoneId', m.id);
                                                                        startTransition(async () => {
                                                                            const result = await createDeliverable(fd);
                                                                            if (result.success) {
                                                                                toast.success('Deliverable uploaded');
                                                                                form.reset();
                                                                                refreshAll();
                                                                            } else {
                                                                                toast.error(result.error || 'Upload failed');
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="file"
                                                                            name="file"
                                                                            required
                                                                            className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-700 file:text-zinc-300 hover:file:bg-zinc-600"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            name="comment"
                                                                            placeholder="Optional comment"
                                                                            className="flex-1 text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white placeholder-zinc-500"
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            disabled={isPending}
                                                                            className="text-[11px] px-2.5 py-1 rounded border font-medium disabled:opacity-40"
                                                                            style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
                                                                        >
                                                                            Upload
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        )}

                                                        {/* Deliverables review (SUBMITTED — client can review before approving) */}
                                                        {m.status === 'SUBMITTED' && isClient && (m.deliverables ?? []).length > 0 && (
                                                            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                                                <span className="text-xs font-medium text-zinc-400 block mb-2">Deliverables ({(m.deliverables ?? []).length})</span>
                                                                {(m.deliverables ?? []).map(d => (
                                                                    <div key={d.id} className="text-xs text-zinc-300 flex items-center gap-2 py-1">
                                                                        <FileText className="w-3 h-3 text-zinc-500" />
                                                                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white underline">{d.fileUrl.split('/').pop()}</a>
                                                                        {d.comment && <span className="text-zinc-500">— {d.comment}</span>}
                                                                        {d.createdAt && <span className="text-zinc-600 ml-auto">{new Date(d.createdAt).toLocaleDateString()}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </SortableMilestoneCard>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {/* Add Form */}
                                {isAddingMilestone && (
                                    <div className="p-6 bg-zinc-800/80 rounded-xl border border-indigo-500/30 space-y-5 mt-2">
                                        <h4 className="text-sm font-semibold text-white">New Milestone</h4>
                                        {/* Title */}
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Milestone Title</label>
                                            <input
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                placeholder="Enter milestone title"
                                                value={newMilestone.title}
                                                onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                            />
                                        </div>
                                        {/* Description */}
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                                            <textarea
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors resize-y"
                                                style={{ minHeight: '100px' }}
                                                placeholder="Describe what this milestone covers"
                                                value={newMilestone.description}
                                                onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                            />
                                        </div>
                                        {/* Amount + Due Date side by side */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Amount ($)</label>
                                                <input
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                    type="number" step="0.01" placeholder="0.00"
                                                    value={newMilestone.amount}
                                                    onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
                                                <input
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                                                    type="date"
                                                    value={newMilestone.dueDate}
                                                    onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex justify-end gap-3 pt-1">
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
                        {(
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

                        {/* Cancel Contract (FINALIZED/ACTIVE/FUNDED, hidden when milestones have active/disputed work) */}
                        {isClient && (contract.status === 'FINALIZED' || contract.status === 'ACTIVE' || contract.status === 'FUNDED') && !contract.milestones.some((m: { status: string }) => ['IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DISPUTED'].includes(m.status)) && (() => {
                            const hasFundedPending = contract.milestones.some((m: { id: string; status: string }) => {
                                if (m.status !== 'PENDING') return false;
                                return contract.escrowAccount?.locks.some((l: { milestoneId: string | null; released: boolean }) => l.milestoneId === m.id && !l.released);
                            });
                            const confirmMsg = hasFundedPending
                                ? 'This contract has funded milestones.\nThey will be automatically refunded before cancellation.\n\nDo you want to continue?'
                                : 'Cancel this contract? This action cannot be undone.';
                            return (
                                <div className="flex justify-end mt-4">
                                    <GlassButton
                                        variant="ghost"
                                        onClick={() => {
                                            if (!confirm(confirmMsg)) return;
                                            startTransition(async () => {
                                                const result = await cancelContract(contract.id);
                                                if (result.success) {
                                                    const msg = result.refundedCount && result.refundedCount > 0
                                                        ? `Contract cancelled. ${result.refundedCount} milestone(s) auto-refunded.`
                                                        : 'Contract cancelled';
                                                    toast.success(msg);
                                                    refreshAll();
                                                } else {
                                                    toast.error(result.error || 'Failed to cancel contract');
                                                }
                                            });
                                        }}
                                        disabled={isPending}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Cancel Contract
                                    </GlassButton>
                                </div>
                            );
                        })()}

                    </>) /* end Details tab */
                    }
                </div >

                {/* RIGHT COLUMN — 35% Sticky Financial Panel */}
                < div className="lg:sticky lg:top-6 lg:self-start" >
                    <EscrowPanel
                        contractId={contract.id}
                        contractStatus={contract.status}
                        contractType={contract.type}
                        role={role}
                        refreshSignal={panelRefreshKey}
                    />
                </div >

            </div >
        </div >
    );
}
