'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type MasterPhase =
    | 'JOB' | 'PROPOSAL' | 'TRIAL' | 'CONTRACT'
    | 'FUNDING' | 'ACTIVE' | 'COMPLETED' | 'CLOSED';

export const MASTER_PHASES: MasterPhase[] = [
    'JOB', 'PROPOSAL', 'TRIAL', 'CONTRACT', 'FUNDING', 'ACTIVE', 'COMPLETED', 'CLOSED',
];

export const PHASE_INDEX: Record<MasterPhase, number> = {} as Record<MasterPhase, number>;
MASTER_PHASES.forEach((p, i) => { PHASE_INDEX[p] = i; });

interface DevStateInfo {
    state: string;
    transitionBy: string;
    actionFunction: string;
    allowedNext: string[];
    lockBehavior: string;
}

interface PhaseEncyclopedia {
    label: string;
    devKey: string;
    oneLiner: string;
    devStates: DevStateInfo[];
    clientExplanation: { meaning: string; action: string; waiting: string; blocker: string };
    freelancerExplanation: { meaning: string; canEdit: string; waiting: string; locked: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE ENCYCLOPEDIA DATA
// ═══════════════════════════════════════════════════════════════════════════

const PHASE_ENCYCLOPEDIA: Record<MasterPhase, PhaseEncyclopedia> = {
    JOB: {
        label: 'Job', devKey: 'JOB',
        oneLiner: 'Job post is live and accepting proposals from freelancers.',
        devStates: [
            { state: 'OPEN', transitionBy: 'Client', actionFunction: 'createJobPostV2()', allowedNext: ['PROPOSAL_RECEIVED'], lockBehavior: 'Editable' },
        ],
        clientExplanation: { meaning: 'Your job is published and visible to freelancers.', action: 'Wait for proposals or promote your listing.', waiting: 'Waiting for freelancers to submit proposals.', blocker: 'No blockers — proposals will arrive organically.' },
        freelancerExplanation: { meaning: 'A client has posted a job matching your skills.', canEdit: 'You cannot edit the job post.', waiting: 'You can submit a proposal at any time.', locked: 'Job details are set by the client.' },
    },
    PROPOSAL: {
        label: 'Proposal', devKey: 'PROPOSAL',
        oneLiner: 'A freelancer has submitted a proposal. Client is reviewing.',
        devStates: [
            { state: 'PENDING', transitionBy: 'Freelancer', actionFunction: 'submitProposal()', allowedNext: ['ACCEPTED', 'REJECTED'], lockBehavior: 'Editable by freelancer' },
            { state: 'SUBMITTED', transitionBy: 'Freelancer', actionFunction: 'submitProposal()', allowedNext: ['ACCEPTED', 'REJECTED'], lockBehavior: 'Read-only after submit' },
        ],
        clientExplanation: { meaning: 'A freelancer has proposed to work on your job.', action: 'Review the proposal and accept or reject it.', waiting: 'The freelancer is waiting for your decision.', blocker: 'You must decide before a contract can be created.' },
        freelancerExplanation: { meaning: 'You have submitted your proposal to the client.', canEdit: 'You can edit your proposal while it is pending.', waiting: 'Waiting for the client to review and decide.', locked: 'Once accepted, your proposal terms are locked.' },
    },
    TRIAL: {
        label: 'Trial', devKey: 'TRIAL',
        oneLiner: 'Paid trial contract — small scoped test before full engagement.',
        devStates: [
            { state: 'DRAFT', transitionBy: 'Client', actionFunction: 'createContractFromProposal()', allowedNext: ['PENDING_REVIEW'], lockBehavior: 'Editable' },
            { state: 'PENDING_REVIEW', transitionBy: 'Client', actionFunction: 'sendForReview()', allowedNext: ['ACCEPTED', 'CHANGES_REQUESTED'], lockBehavior: 'Immutable' },
            { state: 'ACCEPTED', transitionBy: 'Freelancer', actionFunction: 'acceptContract()', allowedNext: ['FINALIZED'], lockBehavior: 'Immutable' },
        ],
        clientExplanation: { meaning: 'A paid trial is being set up to test the freelancer.', action: 'Draft terms, send for review, then finalize.', waiting: 'Waiting for freelancer to accept trial terms.', blocker: 'Freelancer must accept before trial can begin.' },
        freelancerExplanation: { meaning: 'The client wants a paid trial before full engagement.', canEdit: 'You cannot edit — only accept, reject, or request changes.', waiting: 'Waiting for client to send trial for your review.', locked: 'Trial terms are locked once accepted.' },
    },
    CONTRACT: {
        label: 'Contract', devKey: 'CONTRACT',
        oneLiner: 'Contract negotiation, locking, and immutability enforcement.',
        devStates: [
            { state: 'DRAFT', transitionBy: 'Client', actionFunction: 'createContractFromProposal()', allowedNext: ['PENDING_REVIEW'], lockBehavior: 'Editable by client' },
            { state: 'PENDING_REVIEW', transitionBy: 'Client', actionFunction: 'sendForReview()', allowedNext: ['ACCEPTED', 'REJECTED', 'DRAFT'], lockBehavior: 'Immutable' },
            { state: 'ACCEPTED', transitionBy: 'Freelancer', actionFunction: 'acceptContract()', allowedNext: ['FINALIZED'], lockBehavior: 'Immutable' },
        ],
        clientExplanation: { meaning: 'You are drafting and negotiating contract terms.', action: 'Complete terms, send for review, then finalize after acceptance.', waiting: 'Freelancer must review and accept contract terms.', blocker: 'Cannot finalize until freelancer accepts.' },
        freelancerExplanation: { meaning: 'The client has created a contract for your work.', canEdit: 'You cannot edit — you can accept, reject, or request changes.', waiting: 'Waiting for the client to send for review.', locked: 'Contract is locked once you accept.' },
    },
    FUNDING: {
        label: 'Funding', devKey: 'FUNDING',
        oneLiner: 'Contract finalized. Awaiting escrow funding to activate work.',
        devStates: [
            { state: 'FINALIZED', transitionBy: 'Client', actionFunction: 'finalizeContract()', allowedNext: ['FUNDED'], lockBehavior: 'Immutable' },
        ],
        clientExplanation: { meaning: 'Contract is finalized and legally binding.', action: 'Fund the escrow to activate the contract.', waiting: 'Work cannot begin until you fund.', blocker: 'Escrow must be funded before activation.' },
        freelancerExplanation: { meaning: 'Contract finalized — terms are locked.', canEdit: 'No edits possible at this stage.', waiting: 'Waiting for the client to fund escrow.', locked: 'Everything is locked until funding.' },
    },
    ACTIVE: {
        label: 'Active', devKey: 'ACTIVE',
        oneLiner: 'Work is in progress. Milestones are being delivered.',
        devStates: [
            { state: 'FUNDED', transitionBy: 'Client', actionFunction: 'fundEscrow()', allowedNext: ['ACTIVE'], lockBehavior: 'Immutable' },
            { state: 'ACTIVE', transitionBy: 'System', actionFunction: 'activateContract()', allowedNext: ['COMPLETED'], lockBehavior: 'Immutable' },
        ],
        clientExplanation: { meaning: 'The freelancer is actively working on deliverables.', action: 'Review submitted milestones and approve work.', waiting: 'Waiting for freelancer to deliver milestones.', blocker: 'Freelancer must submit work for your approval.' },
        freelancerExplanation: { meaning: 'You are actively working on the contract.', canEdit: 'You can submit milestone deliverables.', waiting: 'Submit your work for client approval.', locked: 'Contract terms are locked — focus on delivery.' },
    },
    COMPLETED: {
        label: 'Completed', devKey: 'COMPLETED',
        oneLiner: 'All deliverables approved. Funds released.',
        devStates: [
            { state: 'COMPLETED', transitionBy: 'System', actionFunction: 'completeContract()', allowedNext: ['CLOSED'], lockBehavior: 'Immutable' },
        ],
        clientExplanation: { meaning: 'All work has been delivered and approved.', action: 'No action needed — funds have been released.', waiting: 'Nothing — project is complete.', blocker: 'No blockers.' },
        freelancerExplanation: { meaning: 'Your work has been approved and funds released.', canEdit: 'No further edits.', waiting: 'Nothing — payment processed.', locked: 'Fully locked — archived.' },
    },
    CLOSED: {
        label: 'Closed', devKey: 'CLOSED',
        oneLiner: 'Lifecycle ended. May be completed, cancelled, or disputed.',
        devStates: [
            { state: 'CLOSED', transitionBy: 'System', actionFunction: 'archiveContract()', allowedNext: [], lockBehavior: 'Terminal' },
            { state: 'CANCELLED', transitionBy: 'Client/Freelancer', actionFunction: 'cancelContract()', allowedNext: [], lockBehavior: 'Terminal' },
            { state: 'REJECTED', transitionBy: 'Freelancer', actionFunction: 'rejectContract()', allowedNext: [], lockBehavior: 'Terminal' },
            { state: 'DISPUTED', transitionBy: 'Freelancer', actionFunction: 'raiseDispute()', allowedNext: ['CLOSED'], lockBehavior: 'Under review' },
        ],
        clientExplanation: { meaning: 'The contract lifecycle has ended.', action: 'No further actions available.', waiting: 'Nothing — this is a terminal state.', blocker: 'No progression possible.' },
        freelancerExplanation: { meaning: 'The contract lifecycle has ended.', canEdit: 'No edits possible.', waiting: 'Nothing — closed permanently.', locked: 'Fully terminal.' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE INFO PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PhaseInfoPanelProps {
    phase: MasterPhase | null;
    role: 'CLIENT' | 'FREELANCER';
    currentPhase: MasterPhase;
    onClose: () => void;
}

export function PhaseInfoPanel({ phase, role, currentPhase, onClose }: PhaseInfoPanelProps) {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [handleEscape]);

    if (!phase) return null;
    const info = PHASE_ENCYCLOPEDIA[phase];
    const currentIdx = PHASE_INDEX[currentPhase];
    const roleExplanation = role === 'CLIENT' ? info.clientExplanation : info.freelancerExplanation;

    return (
        <AnimatePresence>
            {phase && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                    >
                        <div className="w-full max-w-[700px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <p className="text-[10px] font-mono text-indigo-400/70 tracking-widest uppercase mb-1">
                                        {info.devKey} PHASE
                                    </p>
                                    <h3 className="text-2xl font-bold text-white mb-2">{info.label} Phase</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{info.oneLiner}</p>
                                </div>
                                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="h-px bg-white/5 mb-6" />

                            {/* Dev States */}
                            <div className="mb-6">
                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.15em] mb-4">
                                    Developer States
                                </h4>
                                <div className="space-y-3">
                                    {info.devStates.map((ds) => (
                                        <div key={ds.state} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                                            <div className="flex items-center gap-3 mb-2.5">
                                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                                    {ds.state}
                                                </span>
                                                <span className="text-[10px] text-zinc-600">
                                                    {ds.lockBehavior}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-zinc-600">Transition by: </span>
                                                    <span className="text-zinc-300">{ds.transitionBy}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-600">Function: </span>
                                                    <span className="text-amber-400/80 font-mono">{ds.actionFunction}</span>
                                                </div>
                                                {ds.allowedNext.length > 0 && (
                                                    <div className="sm:col-span-2">
                                                        <span className="text-zinc-600">Next: </span>
                                                        <span className="text-emerald-400/80">{ds.allowedNext.join(' → ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-white/5 mb-6" />

                            {/* Role-Aware Explanation */}
                            <div className="mb-6">
                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.15em] mb-4">
                                    {role === 'CLIENT' ? 'Client' : 'Freelancer'} Perspective
                                </h4>
                                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-3">
                                    {role === 'CLIENT' ? (
                                        <>
                                            <InfoRow label="What this means" value={info.clientExplanation.meaning} />
                                            <InfoRow label="Your action" value={info.clientExplanation.action} />
                                            <InfoRow label="Waiting for" value={info.clientExplanation.waiting} />
                                            <InfoRow label="Blocker" value={info.clientExplanation.blocker} />
                                        </>
                                    ) : (
                                        <>
                                            <InfoRow label="What this means" value={info.freelancerExplanation.meaning} />
                                            <InfoRow label="Can you edit?" value={info.freelancerExplanation.canEdit} />
                                            <InfoRow label="Waiting for" value={info.freelancerExplanation.waiting} />
                                            <InfoRow label="Lock status" value={info.freelancerExplanation.locked} />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-white/5 mb-6" />

                            {/* Mini Transition Flow */}
                            <div>
                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.15em] mb-4">
                                    Transition Flow
                                </h4>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {MASTER_PHASES.map((p, i) => {
                                        const isThis = p === phase;
                                        const isPast = PHASE_INDEX[p] < currentIdx;
                                        const isCurr = PHASE_INDEX[p] === currentIdx;
                                        return (
                                            <React.Fragment key={p}>
                                                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${isThis ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                    : isPast ? 'text-emerald-400/60'
                                                        : isCurr ? 'text-white'
                                                            : 'text-zinc-700'
                                                    }`}>
                                                    {PHASE_ENCYCLOPEDIA[p].label}
                                                </span>
                                                {i < MASTER_PHASES.length - 1 && (
                                                    <ChevronRight className="w-3 h-3 text-zinc-800 shrink-0" />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-3 text-sm">
            <span className="text-zinc-600 shrink-0 w-28">{label}</span>
            <span className="text-zinc-300">{value}</span>
        </div>
    );
}
