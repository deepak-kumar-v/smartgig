'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import {
    Scale, Clock, MessageSquare, FileText, Upload, Send,
    AlertTriangle, Shield, CheckCircle, ArrowLeft, ChevronUp, Info, Lock, Unlock, Zap
} from 'lucide-react';
import {
    getDispute, submitDisputeMessage, uploadDisputeEvidence,
    submitProposal, escalateToAdmin, requestPhaseTransition
} from '@/actions/dispute-actions';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open' },
    DISCUSSION: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Discussion Phase' },
    PROPOSAL: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Proposal Phase' },
    ADMIN_REVIEW: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Admin Review' },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved' },
    CLOSED: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Closed' },
};

const reasonLabels: Record<string, string> = {
    QUALITY_ISSUES: 'Quality Issues', NON_DELIVERY: 'Non-Delivery', SCOPE_CREEP: 'Scope Creep',
    MISSED_DEADLINE: 'Missed Deadline', COMMUNICATION: 'Communication', PAYMENT_DISPUTE: 'Payment Dispute', OTHER: 'Other',
};

export default function FreelancerDisputeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<Awaited<ReturnType<typeof getDispute>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [proposalPercent, setProposalPercent] = useState(50);
    const [proposalReason, setProposalReason] = useState('');
    const [showProposal, setShowProposal] = useState(false);
    const [showSnapshot, setShowSnapshot] = useState(false);

    const loadData = async () => {
        const result = await getDispute(disputeId);
        setData(result);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [disputeId]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-64" />
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 h-96 bg-zinc-800 rounded-xl" />
                        <div className="h-96 bg-zinc-800 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data || 'error' in data) {
        return (
            <div className="max-w-5xl mx-auto p-8">
                <GlassCard className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <p className="text-zinc-400">{(data as { error: string })?.error || 'Dispute not found'}</p>
                    <button onClick={() => router.back()} className="mt-4 text-indigo-400 hover:text-indigo-300">
                        ← Go back
                    </button>
                </GlassCard>
            </div>
        );
    }

    const { dispute, contract, milestone, lockAmount, currentUserId, arbitrationFeePercent } = data;
    const status = statusConfig[dispute.status] || statusConfig.OPEN;
    const isResolved = ['RESOLVED', 'CLOSED'].includes(dispute.status);
    const canMessage = !isResolved;
    const canPropose = dispute.status === 'PROPOSAL';
    const canEscalate = dispute.status === 'PROPOSAL';

    const handleSendMessage = () => {
        if (!message.trim()) return;
        startTransition(async () => {
            const result = await submitDisputeMessage(disputeId, message);
            if (result.success) { setMessage(''); loadData(); }
            else toast.error(result.error || 'Failed to send');
        });
    };

    const handleUploadEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        startTransition(async () => {
            const result = await uploadDisputeEvidence(disputeId, formData);
            if (result.success) { toast.success('Evidence uploaded'); loadData(); }
            else toast.error(result.error || 'Failed to upload');
        });
    };

    const handleSubmitProposal = () => {
        startTransition(async () => {
            const result = await submitProposal(disputeId, proposalPercent, proposalReason);
            if (result.success || result.autoSettled) {
                toast.success(result.autoSettled ? 'Dispute auto-settled!' : 'Proposal submitted');
                setShowProposal(false);
                loadData();
            } else toast.error(result.error || 'Failed to submit');
        });
    };

    const handleEscalate = () => {
        if (!confirm('Escalate this dispute to admin review? This cannot be undone.')) return;
        startTransition(async () => {
            const result = await escalateToAdmin(disputeId);
            if (result.success) { toast.success('Escalated to admin'); loadData(); }
            else toast.error(result.error || 'Failed to escalate');
        });
    };

    return (
        <div className="w-full max-w-none px-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-white">{milestone.title}</h1>
                    <p className="text-zinc-500 text-sm">
                        Contract: {contract.title} • {contract.clientName} vs {contract.freelancerName}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm ${status.bg} ${status.color}`}>
                    {status.label}
                </span>
            </div>

            <div className="grid grid-cols-[7fr_3fr] gap-6 items-start">
                {/* LEFT — Discussion + Evidence */}
                <div className="space-y-6">
                    <GlassCard className="p-5">
                        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Discussion
                        </h2>
                        <div className="space-y-3 max-h-[520px] overflow-y-auto mb-4">
                            {dispute.messages.map((msg: { id: string; senderId: string; content: string; isSystem: boolean; createdAt: string }) => (
                                <div key={msg.id} className={`p-3 rounded-lg ${msg.isSystem
                                    ? 'bg-zinc-800/50 border border-zinc-700/50'
                                    : msg.senderId === currentUserId
                                        ? 'bg-indigo-500/10 border border-indigo-500/20 ml-8'
                                        : 'bg-zinc-800 border border-zinc-700 mr-8'
                                    }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-medium ${msg.isSystem ? 'text-zinc-500' : msg.senderId === currentUserId ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                            {msg.isSystem ? 'System' : msg.senderId === currentUserId ? 'You' : msg.senderId === contract.clientUserId ? contract.clientName : contract.freelancerName}
                                        </span>
                                        <span className="text-xs text-zinc-600">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-zinc-300">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                        {canMessage && (
                            <>
                                {dispute.status === 'PROPOSAL' && (
                                    <p className="text-xs text-zinc-500 italic mb-2">Negotiation phase — discuss settlement terms and submit proposals.</p>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                        disabled={isPending}
                                    />
                                    <button onClick={handleSendMessage} disabled={isPending || !message.trim()} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-40 transition-colors">
                                        <Send className="w-4 h-4" />
                                    </button>
                                    {dispute.status !== 'PROPOSAL' && (
                                        <label className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 cursor-pointer transition-colors">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" className="hidden" onChange={handleUploadEvidence} disabled={isPending} />
                                        </label>
                                    )}
                                </div>
                            </>
                        )}
                    </GlassCard>

                    {dispute.evidence.length > 0 && (
                        <GlassCard className="p-5">
                            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Evidence ({dispute.evidence.length})
                            </h2>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto">
                                {dispute.evidence.map((ev: { id: string; fileName: string; fileUrl: string; uploadedById: string; description: string | null; createdAt: string }) => (
                                    <div key={ev.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                        <div>
                                            <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">{ev.fileName}</a>
                                            {ev.description && <p className="text-zinc-500 text-xs mt-0.5">{ev.description}</p>}
                                        </div>
                                        <span className="text-xs text-zinc-600">{ev.uploadedById === currentUserId ? 'You' : 'Other party'} • {new Date(ev.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* RIGHT — Status + Actions + Proposals + Snapshot */}
                <div className="space-y-6">
                    {/* Resolution Summary Card */}
                    {isResolved && dispute.freelancerPercent !== null && (() => {
                        const escrowAmt = parseFloat(lockAmount);
                        const fPct = dispute.freelancerPercent;
                        const cPct = 100 - fPct;
                        const freelancerAmount = escrowAmt * fPct / 100;
                        const feeRate = parseFloat(arbitrationFeePercent ?? '2') / 100;
                        const fee = freelancerAmount > 0 ? freelancerAmount * feeRate : 0;
                        const freelancerPayout = freelancerAmount - fee;
                        const clientRefund = escrowAmt - freelancerAmount;
                        const isAutoSettled = !dispute.resolvedById || dispute.resolvedById === 'SYSTEM';
                        return (
                            <GlassCard className="p-5 border border-emerald-500/30 bg-emerald-500/5">
                                <h2 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Dispute Resolved {isAutoSettled ? '(Auto Settlement)' : '(Admin Decision)'}
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-zinc-400">Freelancer share</span><span className="text-emerald-400 font-medium">{fPct}%</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Client refund</span><span className="text-blue-400 font-medium">{cPct}%</span></div>
                                    <div className="border-t border-zinc-800 my-2" />
                                    <div className="flex justify-between"><span className="text-zinc-400">Escrow amount</span><span className="text-white font-bold">${escrowAmt.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Freelancer payout</span><span className="text-emerald-400">${freelancerPayout.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Client refund</span><span className="text-blue-400">${clientRefund.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-zinc-400 flex items-center gap-1">Arbitration fee ({arbitrationFeePercent}%)<span className="relative group cursor-help"><Info className="w-3 h-3 text-zinc-500" /><span className="absolute bottom-full right-0 mb-1 px-3 py-2 bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded w-64 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none leading-relaxed"><span className="font-medium text-amber-400 block mb-1">Arbitration fee</span>A small dispute resolution fee charged only from the freelancer&apos;s payout when the SmartGIG system automatically settles a dispute.<br/><br/>The client&apos;s refund is not reduced by this fee.</span></span></span><span className="text-amber-400">${fee.toFixed(2)}</span></div>
                                    <div className="border-t border-zinc-800 my-2" />
                                    <div className="flex justify-between"><span className="text-zinc-400">Resolution type</span><span className="text-zinc-300">{isAutoSettled ? 'Auto Settlement (≤15% diff)' : 'Admin Decision'}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Resolved by</span><span className="text-zinc-300">{isAutoSettled ? 'System' : 'Admin'}</span></div>
                                    {dispute.resolvedAt && (
                                        <div className="flex justify-between"><span className="text-zinc-400">Resolved at</span><span className="text-zinc-300">{new Date(dispute.resolvedAt).toLocaleString()}</span></div>
                                    )}
                                    {dispute.resolutionNote && (
                                        <p className="text-xs text-zinc-500 mt-2 italic">{dispute.resolutionNote}</p>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })()}

                    {/* Settlement Explanation Card */}
                    {isResolved && dispute.freelancerPercent !== null && (() => {
                        const wasAutoSettled = !dispute.resolvedById || dispute.resolvedById === 'SYSTEM';
                        if (!wasAutoSettled) return null;
                        const clientProposal = dispute.proposals.find((p: { proposedById: string }) => p.proposedById === contract.clientUserId);
                        const freelancerProposal = dispute.proposals.find((p: { proposedById: string }) => p.proposedById === contract.freelancerUserId);
                        if (!clientProposal || !freelancerProposal) return null;
                        const diff = Math.abs(clientProposal.freelancerPercent - freelancerProposal.freelancerPercent);
                        const midpoint = Math.round((clientProposal.freelancerPercent + freelancerProposal.freelancerPercent) / 2);
                        return (
                            <GlassCard className="p-5 border border-blue-500/20 bg-blue-500/5">
                                <h2 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Settlement Explanation
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <p className="text-zinc-400 text-xs mb-2">Final proposals from each party:</p>
                                    <div className="flex justify-between"><span className="text-zinc-400">Client offered</span><span className="text-blue-400 font-medium">Freelancer: {clientProposal.freelancerPercent}%</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Freelancer offered</span><span className="text-emerald-400 font-medium">Freelancer: {freelancerProposal.freelancerPercent}%</span></div>
                                    <div className="border-t border-zinc-800 my-2" />
                                    <div className="flex justify-between"><span className="text-zinc-400">Difference</span><span className="text-amber-400 font-medium">{diff}% <span className="text-zinc-500 font-normal">(within ≤15% threshold)</span></span></div>
                                    <div className="bg-zinc-800/50 rounded p-3 mt-2 border border-zinc-700/30">
                                        <p className="text-zinc-300 text-xs">SmartGIG automatically resolved the dispute at the midpoint:</p>
                                        <p className="text-white font-bold mt-1">{midpoint}% freelancer / {100 - midpoint}% client</p>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })()}

                    <GlassCard className="p-5">
                        <h2 className="text-white font-semibold mb-4">Dispute Status</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-zinc-500">Reason</span><span className="text-white">{reasonLabels[dispute.reason] || dispute.reason}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-zinc-500">Amount</span><span className="text-white font-bold">${lockAmount}</span></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                                <span className={isResolved ? 'text-zinc-600' : 'text-amber-400 font-medium'}>${isResolved ? '0.00' : lockAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 flex items-center gap-1"><Unlock className="w-3 h-3" /> Released</span>
                                <span className={isResolved ? 'text-emerald-400 font-medium' : 'text-zinc-600'}>${isResolved ? lockAmount : '0.00'}</span>
                            </div>
                            <div className="flex justify-between text-sm"><span className="text-zinc-500">Opened</span><span className="text-white">{new Date(dispute.createdAt).toLocaleDateString()}</span></div>
                            {dispute.discussionDeadline && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Discussion Deadline</span>
                                    <span className="text-amber-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(dispute.discussionDeadline).toLocaleDateString()}
                                        {dispute.discussionEndedAt && new Date(dispute.discussionEndedAt) < new Date(dispute.discussionDeadline) && (
                                            <span className="relative group cursor-help ml-1">
                                                <Info className="w-3 h-3 text-blue-400" />
                                                <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                    Phase ended early — both parties agreed to move forward.
                                                </span>
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                            {dispute.proposalDeadline && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Proposal Deadline</span>
                                    <span className="text-violet-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(dispute.proposalDeadline).toLocaleDateString()}
                                        {dispute.proposalEndedAt && new Date(dispute.proposalEndedAt) < new Date(dispute.proposalDeadline) && (
                                            <span className="relative group cursor-help ml-1">
                                                <Info className="w-3 h-3 text-blue-400" />
                                                <span className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                    Phase ended early — both parties agreed to escalate.
                                                </span>
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                            {dispute.resolvedAt && (
                                <div className="flex justify-between text-sm"><span className="text-zinc-500">Resolved</span><span className="text-emerald-400">{new Date(dispute.resolvedAt).toLocaleDateString()}</span></div>
                            )}
                            {dispute.outcome && dispute.freelancerPercent !== null && (
                                <div className="mt-3 pt-3 border-t border-zinc-800">
                                    <p className="text-emerald-400 text-sm font-medium">Resolution: {dispute.freelancerPercent}% to freelancer</p>
                                    {dispute.resolutionNote && <p className="text-zinc-500 text-xs mt-1">{dispute.resolutionNote}</p>}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Phase Timeline */}
                    {(() => {
                        const wasAutoSettled = isResolved && (!dispute.resolvedById || dispute.resolvedById === 'SYSTEM');
                        const wasAdminResolved = isResolved && !wasAutoSettled;
                        const wentToAdmin = dispute.status === 'ADMIN_REVIEW' || wasAdminResolved;
                        return (
                    <GlassCard className="p-5">
                        <h2 className="text-white font-semibold mb-4">Phase Timeline</h2>
                        <div className="relative pl-4 border-l border-zinc-700 space-y-4">
                            {/* Opened */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-400 border-2 border-zinc-900" />
                                <p className="text-xs text-zinc-500">Opened</p>
                                <p className="text-sm text-white">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                            </div>
                            {/* Discussion Phase */}
                            <div className="relative">
                                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${dispute.status === 'DISCUSSION' ? 'bg-blue-400 animate-pulse' : dispute.discussionEndedAt ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                <p className="text-xs text-zinc-500">Discussion Phase</p>
                                <p className="text-sm text-white">
                                    {dispute.status === 'DISCUSSION' ? (
                                        <span className="text-blue-400">Active</span>
                                    ) : dispute.discussionEndedAt ? (
                                        dispute.discussionDeadline && new Date(dispute.discussionEndedAt) < new Date(dispute.discussionDeadline)
                                            ? <span className="text-emerald-400">Ended early by mutual agreement</span>
                                            : <span className="text-zinc-400">Ended by deadline</span>
                                    ) : (
                                        <span className="text-zinc-600">Pending</span>
                                    )}
                                </p>
                            </div>
                            {/* Proposal Phase */}
                            {(dispute.status !== 'DISCUSSION' || dispute.discussionEndedAt) && (
                                <div className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${dispute.status === 'PROPOSAL' ? 'bg-violet-400 animate-pulse' : (wasAutoSettled || dispute.proposalEndedAt) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                    <p className="text-xs text-zinc-500">Proposal Phase</p>
                                    <p className="text-sm text-white">
                                        {dispute.status === 'PROPOSAL' ? (
                                            <span className="text-violet-400">Active</span>
                                        ) : wasAutoSettled ? (
                                            <span className="text-emerald-400">Resolved automatically via settlement</span>
                                        ) : dispute.proposalEndedAt ? (
                                            dispute.proposalDeadline && new Date(dispute.proposalEndedAt) < new Date(dispute.proposalDeadline)
                                                ? <span className="text-emerald-400">Ended early by mutual agreement</span>
                                                : <span className="text-zinc-400">Ended by deadline</span>
                                        ) : (
                                            <span className="text-zinc-600">Pending</span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {/* Admin Review — only if dispute actually went to admin */}
                            {(dispute.status === 'ADMIN_REVIEW' || wentToAdmin || isResolved) && (
                                <div className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${dispute.status === 'ADMIN_REVIEW' ? 'bg-orange-400 animate-pulse' : wentToAdmin ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                    <p className="text-xs text-zinc-500">Admin Review</p>
                                    <p className="text-sm text-white">
                                        {dispute.status === 'ADMIN_REVIEW' ? (
                                            <span className="text-orange-400">Active</span>
                                        ) : wasAutoSettled ? (
                                            <span className="text-zinc-500 italic">Not required — resolved before escalation</span>
                                        ) : (
                                            <span className="text-emerald-400">Completed</span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {/* Resolved */}
                            {(dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
                                    <p className="text-xs text-zinc-500">Resolved</p>
                                    <p className="text-sm text-emerald-400">{dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : ''}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                        );
                    })()}

                    {/* Actions */}
                    {!isResolved && (
                        <GlassCard className="p-5">
                            <h2 className="text-white font-semibold mb-4">Actions</h2>
                            <div className="space-y-3">
                                {canPropose && (
                                    <>
                                        {!showProposal ? (
                                            <button onClick={() => setShowProposal(true)} className="w-full px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors text-sm">Submit Proposal</button>
                                        ) : (
                                            <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                                {/* Proposal Comparison Context */}
                                                {(() => {
                                                    const myLast = dispute.proposals.find((p: { proposedById: string }) => p.proposedById === currentUserId);
                                                    const otherLast = dispute.proposals.find((p: { proposedById: string }) => p.proposedById !== currentUserId);
                                                    const changeDelta = myLast ? proposalPercent - myLast.freelancerPercent : null;
                                                    const gap = otherLast ? Math.abs(proposalPercent - otherLast.freelancerPercent) : null;
                                                    // Freelancer wants higher freelancerPercent → closer = smaller gap
                                                    const isCloser = otherLast && myLast ? Math.abs(proposalPercent - otherLast.freelancerPercent) < Math.abs(myLast.freelancerPercent - otherLast.freelancerPercent) : null;
                                                    return (
                                                        <div className="space-y-1.5 mb-3 text-xs">
                                                            {myLast && (
                                                                <div className="flex justify-between"><span className="text-zinc-500">Your last proposal</span><span className="text-zinc-300">Freelancer: {myLast.freelancerPercent}%</span></div>
                                                            )}
                                                            {otherLast && (
                                                                <div className="flex justify-between"><span className="text-zinc-500">Other party&apos;s last</span><span className="text-zinc-300">Freelancer: {otherLast.freelancerPercent}%</span></div>
                                                            )}
                                                            <div className="flex justify-between font-medium"><span className="text-zinc-400">Current proposal</span><span className="text-violet-400">Freelancer: {proposalPercent}%</span></div>
                                                            {changeDelta !== null && (
                                                                <div className="flex justify-between"><span className="text-zinc-500">Change from your last</span><span className={changeDelta === 0 ? 'text-zinc-400' : isCloser ? 'text-emerald-400' : 'text-red-400'}>{changeDelta > 0 ? '+' : ''}{changeDelta}%</span></div>
                                                            )}
                                                            {gap !== null && (
                                                                <div className="flex justify-between"><span className="text-zinc-500">Gap between offers</span><span className={isCloser ? 'text-emerald-400' : 'text-red-400'}>{gap}%</span></div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <label className="text-xs text-zinc-500 block mb-1">Freelancer receives: {proposalPercent}%</label>
                                                    <input type="range" min={0} max={100} step={1} value={proposalPercent} onChange={e => setProposalPercent(Number(e.target.value))} className="w-full accent-violet-500" />
                                                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                                        <span>100% Refund</span>
                                                        <span>${(parseFloat(lockAmount) * proposalPercent / 100).toFixed(2)} / ${lockAmount}</span>
                                                        <span>100% Release</span>
                                                    </div>
                                                </div>
                                                <textarea value={proposalReason} onChange={e => setProposalReason(e.target.value)} placeholder="Reason (optional)..." rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white resize-none focus:outline-none focus:border-violet-500" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowProposal(false)} className="flex-1 px-3 py-1.5 border border-zinc-700 text-zinc-400 rounded text-sm hover:text-white transition-colors">Cancel</button>
                                                    <button onClick={handleSubmitProposal} disabled={isPending} className="flex-1 px-3 py-1.5 bg-violet-500/20 text-violet-400 rounded text-sm hover:bg-violet-500/30 disabled:opacity-40 transition-colors">{isPending ? 'Submitting...' : 'Submit'}</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {/* Mutual fast-forward: DISCUSSION → PROPOSAL */}
                                {dispute.status === 'DISCUSSION' && (
                                    dispute.phaseAdvanceFreelancer ? (
                                        <div className="w-full px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm text-center border border-emerald-500/20">
                                            <CheckCircle className="w-4 h-4 inline mr-2" />
                                            You requested to move forward — waiting for other party
                                        </div>
                                    ) : dispute.phaseAdvanceClient ? (
                                        <div className="space-y-2">
                                            <div className="w-full px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm text-center border border-blue-500/20">
                                                Client requested to move to Proposal phase
                                            </div>
                                            <button
                                                onClick={() => startTransition(async () => {
                                                    const result = await requestPhaseTransition(disputeId);
                                                    if (result.success) {
                                                        toast.success(result.transitioned ? 'Moved to Proposal phase!' : 'Request sent — waiting for other party');
                                                        loadData();
                                                    } else toast.error(result.error || 'Failed');
                                                })}
                                                disabled={isPending}
                                                className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm disabled:opacity-40"
                                            >
                                                <CheckCircle className="w-4 h-4 inline mr-2" />
                                                Confirm & Move to Proposal Phase
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startTransition(async () => {
                                                const result = await requestPhaseTransition(disputeId);
                                                if (result.success) {
                                                    toast.success(result.transitioned ? 'Moved to Proposal phase!' : 'Request sent — waiting for other party');
                                                    loadData();
                                                } else toast.error(result.error || 'Failed');
                                            })}
                                            disabled={isPending}
                                            className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-40"
                                        >
                                            <ChevronUp className="w-4 h-4 inline mr-2" />
                                            Move to Proposal Phase
                                        </button>
                                    )
                                )}
                                {/* Mutual fast-forward: PROPOSAL → ADMIN_REVIEW */}
                                {dispute.status === 'PROPOSAL' && (
                                    dispute.phaseAdvanceFreelancer ? (
                                        <div className="w-full px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm text-center border border-emerald-500/20">
                                            <CheckCircle className="w-4 h-4 inline mr-2" />
                                            You requested admin review — waiting for other party
                                        </div>
                                    ) : dispute.phaseAdvanceClient ? (
                                        <div className="space-y-2">
                                            <div className="w-full px-4 py-2 bg-orange-500/10 text-orange-400 rounded-lg text-sm text-center border border-orange-500/20">
                                                Client requested to escalate to admin review
                                            </div>
                                            <button
                                                onClick={() => startTransition(async () => {
                                                    const result = await requestPhaseTransition(disputeId);
                                                    if (result.success) {
                                                        toast.success(result.transitioned ? 'Escalated to admin review!' : 'Request sent — waiting for other party');
                                                        loadData();
                                                    } else toast.error(result.error || 'Failed');
                                                })}
                                                disabled={isPending}
                                                className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm disabled:opacity-40"
                                            >
                                                <CheckCircle className="w-4 h-4 inline mr-2" />
                                                Confirm & Escalate to Admin
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startTransition(async () => {
                                                const result = await requestPhaseTransition(disputeId);
                                                if (result.success) {
                                                    toast.success(result.transitioned ? 'Escalated to admin review!' : 'Request sent — waiting for other party');
                                                    loadData();
                                                } else toast.error(result.error || 'Failed');
                                            })}
                                            disabled={isPending}
                                            className="w-full px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm disabled:opacity-40"
                                        >
                                            <Shield className="w-4 h-4 inline mr-2" />
                                            Escalate to Admin Review
                                        </button>
                                    )
                                )}
                            </div>
                        </GlassCard>
                    )}

                    {/* Locked negotiation message when resolved */}
                    {isResolved && (
                        <GlassCard className="p-4 border border-zinc-700/50">
                            <p className="text-zinc-500 text-sm text-center italic">Negotiation closed — this dispute has already been resolved.</p>
                        </GlassCard>
                    )}

                    {/* Proposals */}
                    {dispute.proposals.length > 0 && (
                        <GlassCard className="p-5">
                            <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Scale className="w-4 h-4" /> Proposals</h2>
                            {/* Negotiation Progress */}
                            {(() => {
                                const clientProposals = dispute.proposals.filter((p: { proposedById: string }) => p.proposedById === contract.clientUserId);
                                const freelancerProposals = dispute.proposals.filter((p: { proposedById: string }) => p.proposedById === contract.freelancerUserId);
                                if (clientProposals.length > 0 && freelancerProposals.length > 0) {
                                    const firstClient = clientProposals[clientProposals.length - 1];
                                    const firstFreelancer = freelancerProposals[freelancerProposals.length - 1];
                                    const lastClient = clientProposals[0];
                                    const lastFreelancer = freelancerProposals[0];
                                    const initialGap = Math.abs(firstClient.freelancerPercent - firstFreelancer.freelancerPercent);
                                    const finalGap = Math.abs(lastClient.freelancerPercent - lastFreelancer.freelancerPercent);
                                    return (
                                        <div className="bg-zinc-800/30 rounded-lg p-3 mb-3 border border-zinc-700/30">
                                            <p className="text-xs font-medium text-zinc-400 mb-2">Negotiation Progress</p>
                                            <div className="flex justify-between text-xs"><span className="text-zinc-500">Initial offer gap</span><span className="text-red-400 font-medium">{initialGap}%</span></div>
                                            <div className="flex justify-between text-xs mt-1"><span className="text-zinc-500">Final offer gap</span><span className={finalGap <= 15 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{finalGap}%</span></div>
                                            {finalGap < initialGap && (
                                                <p className="text-xs text-zinc-600 mt-2 italic">Both parties gradually moved closer{finalGap <= 15 ? ' until the settlement threshold was reached.' : '.'}</p>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <p className="text-xs text-zinc-500 mb-2">Newest proposals appear at the top.</p>
                            <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded px-3 py-2 border border-zinc-700/50 mb-3">
                                <span className="text-indigo-400 font-medium">Auto-settlement rule:</span> If proposals differ by ≤15%, the system automatically resolves at the midpoint.
                            </p>
                            {dispute.proposals.length >= 2 ? (() => {
                                const latest = dispute.proposals[0] as { freelancerPercent: number };
                                const previous = dispute.proposals[1] as { freelancerPercent: number };
                                const midpoint = Math.round((latest.freelancerPercent + previous.freelancerPercent) / 2);
                                const diff = Math.abs(latest.freelancerPercent - previous.freelancerPercent);
                                return (
                                    <div className={`text-xs rounded px-3 py-2 mb-3 border ${diff <= 15 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'}`}>
                                        Current midpoint: <span className="font-bold">{midpoint}%</span> · Difference: <span className="font-bold">{diff}%</span>
                                        {diff <= 15 && <span className="ml-1">(within auto-settle range)</span>}
                                    </div>
                                );
                            })() : (
                                <p className="text-xs text-zinc-500 italic mb-3">Waiting for counter proposal</p>
                            )}
                            <div className="space-y-2">
                                {dispute.proposals.map((p: { id: string; proposedById: string; freelancerPercent: number; reason: string | null; createdAt: string }, idx: number) => (
                                    <div key={p.id} className={`p-3 rounded-lg border ${idx === 0 ? 'bg-indigo-500/5 border-indigo-500' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-zinc-400">{p.proposedById === currentUserId ? 'Your proposal' : 'Counter-proposal'}</span>
                                            <span className="text-sm">
                                                <span className="text-emerald-400 font-medium">Freelancer: {p.freelancerPercent}%</span>
                                                <span className="text-zinc-600 mx-1">|</span>
                                                <span className="text-blue-400 font-medium">Client: {100 - p.freelancerPercent}%</span>
                                            </span>
                                        </div>
                                        {p.reason && <p className="text-xs text-zinc-500 mt-1">{p.reason}</p>}
                                        <p className="text-xs text-zinc-600 mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                                        {/* Settlement Trigger Badge */}
                                        {isResolved && idx === 0 && dispute.proposals.length >= 2 && (() => {
                                            const prev = dispute.proposals[1] as { freelancerPercent: number };
                                            const diff = Math.abs(p.freelancerPercent - prev.freelancerPercent);
                                            return diff <= 15 ? (
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-400">
                                                    <Zap className="w-3 h-3" /> Triggered auto-settlement
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Snapshot Toggle */}
                    <GlassCard className="p-5">
                        <button
                            onClick={() => setShowSnapshot(!showSnapshot)}
                            className="w-full text-left text-sm font-semibold text-white flex items-center justify-between"
                        >
                            {showSnapshot ? 'Hide Milestone Snapshot' : 'View Milestone Snapshot'}
                            <ChevronUp className={`w-4 h-4 text-zinc-400 transition-transform ${showSnapshot ? '' : 'rotate-180'}`} />
                        </button>
                        {showSnapshot && (
                            <div className="mt-3">
                                <p className="text-zinc-500 text-xs mb-2">Immutable record captured when dispute was opened</p>
                                <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 font-mono max-h-[300px] overflow-y-auto">
                                    <pre>{JSON.stringify(dispute.snapshot, null, 2)}</pre>
                                </div>
                                <p className="text-zinc-600 text-xs mt-2">Hash: {dispute.snapshotHash?.slice(0, 16)}...</p>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
