'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { useGlobalRefresh } from '@/providers/global-refresh-provider';
import {
    Scale, ArrowLeft, Shield, MessageSquare, FileText, Upload, Send,
    CheckCircle, Clock, AlertTriangle, DollarSign, Eye, Lock, Unlock,
    ChevronDown, ChevronUp, X, Users, User as UserIcon, Loader2, VolumeX
} from 'lucide-react';
import {
    getAdminDisputeDetail,
    sendAdminMessage,
    uploadAdminEvidence,
    adminResolveDispute,
    getAdminConversationMessages,
    muteParticipant,
    unmuteParticipant,
    endInquiry,
} from '@/actions/admin-dispute-actions';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageVersionHistory } from '@/components/chat/message-version-history';
import type { ChatMessage } from '@/hooks/use-chat';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

type DetailData = Awaited<ReturnType<typeof getAdminDisputeDetail>>;
type SuccessData = Exclude<DetailData, { error: string }>;

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open' },
    DISCUSSION: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Discussion' },
    PROPOSAL: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Proposal' },
    ADMIN_REVIEW: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Admin Review' },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved' },
    CLOSED: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Closed' },
};

const reasonLabels: Record<string, string> = {
    QUALITY_ISSUES: 'Quality Issues', NON_DELIVERY: 'Non-Delivery', SCOPE_CREEP: 'Scope Creep',
    MISSED_DEADLINE: 'Missed Deadline', COMMUNICATION: 'Communication', PAYMENT_DISPUTE: 'Payment Dispute', OTHER: 'Other',
};

// ============================================================================
// Page Component
// ============================================================================

export default function AdminDisputeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<SuccessData | null>(null);
    const [loading, setLoading] = useState(true);
    const { refreshVersion } = useGlobalRefresh();

    // Admin chat state
    const [chatTab, setChatTab] = useState<'group' | 'client' | 'freelancer'>('group');
    const [chatMessage, setChatMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Admin evidence state
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidenceDesc, setEvidenceDesc] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settlement state
    const [settlementPercent, setSettlementPercent] = useState(50);
    const [settlementNote, setSettlementNote] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Contract conversation (read-only chat) state
    const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
    const [conversationParticipants, setConversationParticipants] = useState<{
        clientUserId: string; clientName: string; freelancerUserId: string; freelancerName: string;
    } | null>(null);
    const [conversationTotalCount, setConversationTotalCount] = useState(0);
    const [conversationCursor, setConversationCursor] = useState<string | null>(null);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [conversationPerspective, setConversationPerspective] = useState<'client' | 'freelancer'>('client');
    const conversationScrollRef = useRef<HTMLDivElement>(null);
    const [versionHistoryMessageId, setVersionHistoryMessageId] = useState<string | null>(null);

    // Sections collapse
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        summary: true, snapshot: false, escrow: true, messages: false,
        evidence: false, proposals: true, adminChat: true, adminEvidence: false, settlement: true,
        contractChat: true,
    });

    const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    // Load data
    const loadData = async () => {
        const result = await getAdminDisputeDetail(disputeId);
        if (result && !('error' in result)) {
            setData(result);
        } else {
            toast.error((result as { error: string })?.error || 'Failed to load');
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [disputeId, refreshVersion]);

    // Load contract conversation messages
    const loadConversationMessages = async (contractId: string, cursor?: string | null) => {
        setConversationLoading(true);
        const result = await getAdminConversationMessages(contractId, cursor);
        if (result.messages) {
            if (cursor) {
                // Prepend older messages
                setConversationMessages(prev => [...result.messages!, ...prev]);
            } else {
                setConversationMessages(result.messages);
            }
            setConversationCursor(result.nextCursor ?? null);
            if (result.participants) setConversationParticipants(result.participants);
            if (result.totalCount !== undefined) setConversationTotalCount(result.totalCount);
        }
        setConversationLoading(false);
    };

    // Load conversation when dispute data is available
    useEffect(() => {
        if (data?.contract?.id) {
            loadConversationMessages(data.contract.id);
        }
    }, [data?.contract?.id, refreshVersion]);

    // Auto-scroll admin chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data?.dispute.adminMessages, chatTab]);

    // Handlers
    const handleSendMessage = () => {
        if (!chatMessage.trim() || !data) return;
        const recipientId = chatTab === 'client' ? data.contract.clientUserId
            : chatTab === 'freelancer' ? data.contract.freelancerUserId
            : null;
        startTransition(async () => {
            const result = await sendAdminMessage(disputeId, chatMessage, recipientId);
            if (result.success) {
                setChatMessage('');
                loadData();
            } else {
                toast.error(result.error || 'Failed to send');
            }
        });
    };

    const handleUploadEvidence = async () => {
        if (!evidenceFile) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', evidenceFile);
        if (evidenceDesc.trim()) form.append('description', evidenceDesc.trim());
        const result = await uploadAdminEvidence(disputeId, form);
        if (result.success) {
            toast.success('Evidence uploaded');
            setEvidenceFile(null);
            setEvidenceDesc('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadData();
        } else {
            toast.error(result.error || 'Upload failed');
        }
        setUploading(false);
    };

    const handleResolve = () => {
        if (!settlementNote || settlementNote.trim().length < 5) {
            toast.error('Resolution note must be at least 5 characters');
            return;
        }
        setShowConfirmModal(true);
    };

    const executeResolve = () => {
        setShowConfirmModal(false);
        const key = `admin_resolve_${disputeId}_${Date.now()}`;
        startTransition(async () => {
            const result = await adminResolveDispute(disputeId, settlementPercent, settlementNote, key);
            if (result.success) {
                toast.success('Dispute resolved successfully');
                loadData();
            } else {
                toast.error(result.error || 'Resolution failed');
            }
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-64" />
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-48 bg-zinc-800 rounded-xl" />)}</div>
                        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-48 bg-zinc-800 rounded-xl" />)}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-7xl mx-auto p-8 text-center">
                <Scale className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Dispute not found</p>
                <Link href="/admin/disputes" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">← Back to Disputes</Link>
            </div>
        );
    }

    const { dispute, contract, milestone, escrow, analytics } = data;
    const status = statusConfig[dispute.status] || statusConfig.OPEN;
    const isResolved = ['RESOLVED', 'CLOSED'].includes(dispute.status);
    const lockAmount = parseFloat(escrow.lockAmount);

    // Filter admin messages by tab
    const filteredAdminMessages = dispute.adminMessages.filter(m => {
        if (chatTab === 'group') return !m.isPrivate;
        if (chatTab === 'client') return m.isPrivate && (m.recipientId === contract.clientUserId || m.senderId === contract.clientUserId);
        if (chatTab === 'freelancer') return m.isPrivate && (m.recipientId === contract.freelancerUserId || m.senderId === contract.freelancerUserId);
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/disputes" className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Disputes
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-7 h-7 text-orange-400" /> Admin Arbitration
                    </h1>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm ${status.bg} ${status.color}`}>{status.label}</span>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-4">
                    {/* 1. Dispute Summary */}
                    <CollapsibleSection title="Dispute Summary" icon={<Scale className="w-4 h-4" />} isOpen={expandedSections.summary} onToggle={() => toggleSection('summary')}>
                        <div className="space-y-3">
                            <Row label="Contract" value={contract.title} />
                            <Row label="Milestone" value={`${milestone.title} — $${milestone.amount}`} />
                            <Row label="Client" value={contract.clientName} />
                            <Row label="Freelancer" value={contract.freelancerName} />
                            <Row label="Reason" value={reasonLabels[dispute.reason] || dispute.reason} />
                            <Row label="Opened" value={new Date(dispute.createdAt).toLocaleString()} />
                            {dispute.escalatedAt && <Row label="Escalated" value={new Date(dispute.escalatedAt).toLocaleString()} />}
                            <div className="pt-2">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Description</p>
                                <p className="text-zinc-300 text-sm bg-zinc-800/50 rounded p-3">{dispute.description}</p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* 2. Milestone Snapshot */}
                    <CollapsibleSection title="Milestone Snapshot" icon={<Eye className="w-4 h-4" />} isOpen={expandedSections.snapshot} onToggle={() => toggleSection('snapshot')}>
                        <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-500 font-mono overflow-auto max-h-48">
                            <pre>{JSON.stringify(dispute.snapshot, null, 2)}</pre>
                        </div>
                    </CollapsibleSection>

                    {/* 3. Escrow Breakdown */}
                    <CollapsibleSection title="Escrow Breakdown" icon={<DollarSign className="w-4 h-4" />} isOpen={expandedSections.escrow} onToggle={() => toggleSection('escrow')}>
                        <div className="space-y-2">
                            <Row label="Lock Amount" value={`$${escrow.lockAmount}`} valueColor="text-white font-bold" />
                            <Row label="Status" value={escrow.isLocked ? 'Locked' : 'Released'} valueColor={escrow.isLocked ? 'text-amber-400' : 'text-emerald-400'} />
                            <Row label="Client" value={contract.clientName} />
                            <Row label="Freelancer" value={contract.freelancerName} />
                        </div>
                    </CollapsibleSection>

                    {/* 4. Discussion Messages */}
                    <CollapsibleSection title={`Discussion Messages (${dispute.messages.length})`} icon={<MessageSquare className="w-4 h-4" />} isOpen={expandedSections.messages} onToggle={() => toggleSection('messages')}>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {dispute.messages.length === 0 ? (
                                <p className="text-zinc-600 text-sm text-center py-4">No messages</p>
                            ) : dispute.messages.map(m => (
                                <div key={m.id} className={`p-2 rounded text-sm ${m.isSystem ? 'bg-zinc-800/30 text-zinc-500 italic' : 'bg-zinc-800/50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-medium ${m.senderId === contract.clientUserId ? 'text-blue-400' : m.senderId === contract.freelancerUserId ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                            {m.senderId === contract.clientUserId ? 'Client' : m.senderId === contract.freelancerUserId ? 'Freelancer' : 'System'}
                                        </span>
                                        <span className="text-zinc-600 text-[10px]">{new Date(m.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-zinc-300">{m.content}</p>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    {/* 5. Party Evidence */}
                    <CollapsibleSection title={`Party Evidence (${dispute.evidence.length})`} icon={<FileText className="w-4 h-4" />} isOpen={expandedSections.evidence} onToggle={() => toggleSection('evidence')}>
                        {dispute.evidence.length === 0 ? (
                            <p className="text-zinc-600 text-sm text-center py-4">No evidence uploaded</p>
                        ) : (
                            <div className="space-y-2">
                                {dispute.evidence.map(e => (
                                    <a key={e.id} href={e.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded hover:bg-zinc-800/80 transition-colors">
                                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-indigo-400 truncate">{e.fileName}</p>
                                            {e.description && <p className="text-xs text-zinc-500 truncate">{e.description}</p>}
                                        </div>
                                        <span className={`text-[10px] ${e.uploadedById === contract.clientUserId ? 'text-blue-400' : 'text-emerald-400'}`}>
                                            {e.uploadedById === contract.clientUserId ? 'Client' : 'Freelancer'}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </CollapsibleSection>

                    {/* 10. Contract Conversation (Read-Only Chat) */}
                    <CollapsibleSection
                        title={`Contract Conversation (${conversationTotalCount})`}
                        icon={<MessageSquare className="w-4 h-4" />}
                        isOpen={expandedSections.contractChat}
                        onToggle={() => toggleSection('contractChat')}
                    >
                        <div className="space-y-3">
                            {/* Perspective Toggle */}
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setConversationPerspective('client')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                                        conversationPerspective === 'client'
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
                                    }`}
                                >
                                    <UserIcon className="w-3 h-3" />
                                    Client View
                                </button>
                                <button
                                    onClick={() => setConversationPerspective('freelancer')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                                        conversationPerspective === 'freelancer'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
                                    }`}
                                >
                                    <UserIcon className="w-3 h-3" />
                                    Freelancer View
                                </button>
                            </div>

                            {/* Participant Legend */}
                            {conversationParticipants && (
                                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                        {conversationPerspective === 'client'
                                            ? conversationParticipants.clientName
                                            : conversationParticipants.freelancerName}
                                        {' (right)'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                                        {conversationPerspective === 'client'
                                            ? conversationParticipants.freelancerName
                                            : conversationParticipants.clientName}
                                        {' (left)'}
                                    </span>
                                </div>
                            )}

                            {/* Load Older Messages Button */}
                            {conversationCursor && (
                                <button
                                    onClick={() => data?.contract?.id && loadConversationMessages(data.contract.id, conversationCursor)}
                                    disabled={conversationLoading}
                                    className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 py-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
                                >
                                    {conversationLoading ? (
                                        <span className="flex items-center justify-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                                        </span>
                                    ) : 'Load Older Messages'}
                                </button>
                            )}

                            {/* Messages Container */}
                            <div
                                ref={conversationScrollRef}
                                className="bg-zinc-900/50 rounded-lg p-3 max-h-96 overflow-y-auto space-y-1"
                            >
                                {conversationLoading && conversationMessages.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                    </div>
                                ) : conversationMessages.length === 0 ? (
                                    <p className="text-zinc-600 text-sm text-center py-8">No conversation found for this contract</p>
                                ) : (
                                    (() => {
                                        const perspectiveUserId = conversationPerspective === 'client'
                                            ? conversationParticipants?.clientUserId
                                            : conversationParticipants?.freelancerUserId;

                                        const now = new Date();
                                        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                                        let lastDateKey = -1;

                                        const isSameLocalDay = (a: Date, b: Date) =>
                                            a.getFullYear() === b.getFullYear() &&
                                            a.getMonth() === b.getMonth() &&
                                            a.getDate() === b.getDate();

                                        const getDateLabel = (d: Date) => {
                                            if (isSameLocalDay(d, now)) return 'Today';
                                            if (isSameLocalDay(d, yesterday)) return 'Yesterday';
                                            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                                        };

                                        const dateKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

                                        return conversationMessages.map((message) => {
                                            const msgDate = new Date(message.createdAt);
                                            const key = dateKey(msgDate);
                                            const showDateSep = key !== lastDateKey;
                                            lastDateKey = key;

                                            const noop = () => {};

                                            return (
                                                <React.Fragment key={message.id}>
                                                    {showDateSep && (
                                                        <div className="flex items-center justify-center my-3">
                                                            <span className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-500 text-[10px]">
                                                                {getDateLabel(msgDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <MessageBubble
                                                        message={message}
                                                        isOwn={message.senderId === perspectiveUserId}
                                                        currentUserId={perspectiveUserId || ''}
                                                        messageElementId={`admin-chat-message-${message.id}`}
                                                        onReact={noop}
                                                        onReply={noop}
                                                        onEdit={noop}
                                                        onDelete={noop}
                                                        onViewHistory={(id) => setVersionHistoryMessageId(id)}
                                                        readOnly
                                                        allowHistoryInspection
                                                    />
                                                </React.Fragment>
                                            );
                                        });
                                    })()
                                )}
                            </div>

                            {/* Read-only notice */}
                            <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-zinc-600">
                                <Lock className="w-3 h-3" />
                                Read-only — Admin view of client ↔ freelancer conversation
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-4">
                    {/* 6. Proposal Analytics */}
                    <CollapsibleSection title="Proposal Analytics" icon={<Scale className="w-4 h-4" />} isOpen={expandedSections.proposals} onToggle={() => toggleSection('proposals')}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                                    <p className="text-zinc-500 text-xs mb-1">Client Position</p>
                                    <p className="text-blue-400 text-xl font-bold">
                                        {analytics.latestClientProposal !== null ? `${100 - analytics.latestClientProposal}%` : '—'}
                                    </p>
                                    <p className="text-zinc-600 text-[10px]">wants {analytics.latestClientProposal !== null ? `${100 - analytics.latestClientProposal}% refund` : 'no proposal'}</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                                    <p className="text-zinc-500 text-xs mb-1">Freelancer Position</p>
                                    <p className="text-emerald-400 text-xl font-bold">
                                        {analytics.latestFreelancerProposal !== null ? `${analytics.latestFreelancerProposal}%` : '—'}
                                    </p>
                                    <p className="text-zinc-600 text-[10px]">wants {analytics.latestFreelancerProposal !== null ? `${analytics.latestFreelancerProposal}% release` : 'no proposal'}</p>
                                </div>
                            </div>
                            {analytics.proposalDifference !== null && (
                                <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
                                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Difference</span><span className="text-amber-400 font-medium">{analytics.proposalDifference}%</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Suggested Midpoint</span><span className="text-white font-medium">{analytics.suggestedMidpoint}%</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Auto-settle Threshold</span><span className="text-zinc-400">{analytics.autoSettlementThreshold}%</span></div>
                                </div>
                            )}
                            {dispute.proposals.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-zinc-500 text-xs uppercase tracking-wider">All Proposals</p>
                                    {dispute.proposals.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-2 bg-zinc-800/30 rounded text-sm">
                                            <span className={p.proposedById === contract.clientUserId ? 'text-blue-400' : 'text-emerald-400'}>
                                                {p.proposedById === contract.clientUserId ? 'Client' : 'Freelancer'}
                                            </span>
                                            <span className="text-zinc-400">
                                                F: {p.freelancerPercent}% / C: {100 - p.freelancerPercent}%
                                            </span>
                                            <span className="text-zinc-600 text-[10px]">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* 7. Admin Chat */}
                    <CollapsibleSection title="Admin Chat" icon={<MessageSquare className="w-4 h-4" />} isOpen={expandedSections.adminChat} onToggle={() => toggleSection('adminChat')}>
                        <div className="space-y-3">
                            {/* Tab buttons */}
                            <div className="flex gap-1">
                                {[
                                    { key: 'group' as const, label: 'Group', icon: <Users className="w-3 h-3" /> },
                                    { key: 'client' as const, label: 'Client (Private)', icon: <UserIcon className="w-3 h-3" /> },
                                    { key: 'freelancer' as const, label: 'Freelancer (Private)', icon: <UserIcon className="w-3 h-3" /> },
                                ].map(t => (
                                    <button key={t.key} onClick={() => setChatTab(t.key)} className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-all ${chatTab === t.key ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Messages */}
                            <div className="bg-zinc-900/50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                                {filteredAdminMessages.length === 0 ? (
                                    <p className="text-zinc-600 text-sm text-center py-4">No messages in this channel</p>
                            ) : filteredAdminMessages.map(m => {
                                    const isOwn = m.senderId === data.adminId;
                                    const isClient = m.senderId === data.contract.clientUserId;
                                    const senderColor = isOwn ? 'text-orange-400' : isClient ? 'text-blue-400' : 'text-emerald-400';
                                    return (
                                        <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-2.5 rounded-lg ${
                                                isOwn ? 'bg-indigo-500/20 rounded-br-sm' : 'bg-zinc-800/80 rounded-bl-sm'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-xs font-medium ${senderColor}`}>{m.senderName}</span>
                                                    {m.isPrivate && <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1 rounded">Private</span>}
                                                    <span className="text-zinc-600 text-[10px] ml-auto">{new Date(m.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-zinc-300 text-sm">{m.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            {!isResolved && (
                                <div className="flex gap-2">
                                    <input
                                        type="text" value={chatMessage}
                                        onChange={e => setChatMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder={chatTab === 'group' ? 'Message both parties...' : `Private message to ${chatTab}...`}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <button disabled={isPending || !chatMessage.trim()} onClick={handleSendMessage} className="px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-40">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Mute Controls */}
                            {!isResolved && (
                                <div className="pt-3 border-t border-zinc-800 space-y-2">
                                    <p className="text-xs text-zinc-500 font-medium">Moderation Controls</p>
                                    {/* Mute status indicators */}
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                        <span className={`px-2 py-0.5 rounded ${dispute.clientMutedUntil && new Date(dispute.clientMutedUntil) > new Date() ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            Client: {dispute.clientMutedUntil && new Date(dispute.clientMutedUntil) > new Date() ? `Muted (${Math.ceil((new Date(dispute.clientMutedUntil).getTime() - Date.now()) / 60000)}m)` : 'Active'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded ${dispute.freelancerMutedUntil && new Date(dispute.freelancerMutedUntil) > new Date() ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            Freelancer: {dispute.freelancerMutedUntil && new Date(dispute.freelancerMutedUntil) > new Date() ? `Muted (${Math.ceil((new Date(dispute.freelancerMutedUntil).getTime() - Date.now()) / 60000)}m)` : 'Active'}
                                        </span>
                                    </div>
                                    {/* Mute/Unmute buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['client', 'freelancer'] as const).map(target => {
                                            const muteField = target === 'client' ? dispute.clientMutedUntil : dispute.freelancerMutedUntil;
                                            const isMuted = muteField && new Date(muteField) > new Date();
                                            return (
                                                <div key={target} className="space-y-1">
                                                    <p className="text-[10px] text-zinc-400 capitalize">{target}</p>
                                                    {isMuted ? (
                                                        <button
                                                            onClick={() => startTransition(async () => {
                                                                const r = await unmuteParticipant(dispute.id, target);
                                                                if (r.success) { toast.success(`${target} unmuted`); loadData(); }
                                                                else toast.error(r.error);
                                                            })}
                                                            className="w-full text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                                        >
                                                            Unmute
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-1">
                                                            {[10, 30, 60].map(mins => (
                                                                <button
                                                                    key={mins}
                                                                    onClick={() => startTransition(async () => {
                                                                        const r = await muteParticipant(dispute.id, target, mins);
                                                                        if (r.success) { toast.success(`${target} muted for ${mins}m`); loadData(); }
                                                                        else toast.error(r.error);
                                                                    })}
                                                                    className="flex-1 text-[10px] px-1 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                                                >
                                                                    {mins}m
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* 8. Admin Evidence */}
                    <CollapsibleSection title={`Admin Evidence (${dispute.adminEvidence.length})`} icon={<Upload className="w-4 h-4" />} isOpen={expandedSections.adminEvidence} onToggle={() => toggleSection('adminEvidence')}>
                        <div className="space-y-3">
                            {dispute.adminEvidence.map(e => (
                                <a key={e.id} href={e.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded text-sm text-indigo-400 hover:text-indigo-300">
                                    <FileText className="w-3 h-3" /> {e.fileName}
                                    <span className="text-zinc-600 ml-auto text-[10px]">{new Date(e.createdAt).toLocaleDateString()}</span>
                                </a>
                            ))}
                            {!isResolved && (
                                <div className="space-y-2 pt-2 border-t border-zinc-800">
                                    <input ref={fileInputRef} type="file" onChange={e => setEvidenceFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700" />
                                    <input type="text" value={evidenceDesc} onChange={e => setEvidenceDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                                    <button disabled={uploading || !evidenceFile} onClick={handleUploadEvidence} className="w-full px-3 py-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                                        <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Evidence'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>

                    {/* 9. Settlement Panel */}
                    <CollapsibleSection title="Settlement Panel" icon={<Shield className="w-4 h-4" />} isOpen={expandedSections.settlement} onToggle={() => toggleSection('settlement')}>
                        {/* Inquiry banner */}
                        {dispute.adminInquiryOpen && !isResolved && (
                            <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <p className="text-amber-400 text-xs flex-1">Admin inquiry in progress. Settlement temporarily disabled.</p>
                                <button
                                    onClick={() => startTransition(async () => {
                                        const r = await endInquiry(dispute.id);
                                        if (r.success) { toast.success('Inquiry ended — settlement unlocked'); loadData(); }
                                        else toast.error(r.error);
                                    })}
                                    className="text-[10px] px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                                >
                                    End Inquiry
                                </button>
                            </div>
                        )}
                        {isResolved ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-emerald-400 font-medium mb-2">✓ Resolved</p>
                                {dispute.freelancerPercent !== null && (
                                    <p className="text-zinc-400 text-sm">{dispute.freelancerPercent}% to freelancer, {100 - dispute.freelancerPercent}% refunded</p>
                                )}
                                {dispute.resolutionNote && (
                                    <p className="text-zinc-500 text-sm mt-2 italic">&ldquo;{dispute.resolutionNote}&rdquo;</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Slider */}
                                <div>
                                    <label className="text-sm text-zinc-400 block mb-2">
                                        Split: <span className="text-emerald-400">{settlementPercent}%</span> → Freelancer, <span className="text-blue-400">{100 - settlementPercent}%</span> → Client
                                    </label>
                                    <input type="range" min={0} max={100} step={1} value={settlementPercent} onChange={e => setSettlementPercent(Number(e.target.value))} className="w-full accent-indigo-500" />
                                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                        <span>Full Refund</span>
                                        <span className="text-white font-medium">${(lockAmount * settlementPercent / 100).toFixed(2)} / ${escrow.lockAmount}</span>
                                        <span>Full Release</span>
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="bg-zinc-800/50 rounded-lg p-3 text-sm space-y-1.5">
                                    <div className="flex justify-between"><span className="text-zinc-500">Escrow Amount</span><span className="text-white font-medium">${escrow.lockAmount}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Freelancer Payout</span><span className="text-emerald-400">${(lockAmount * settlementPercent / 100).toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Client Refund</span><span className="text-blue-400">${(lockAmount * (100 - settlementPercent) / 100).toFixed(2)}</span></div>
                                    <div className="flex justify-between border-t border-zinc-700 pt-1.5 mt-1"><span className="text-zinc-400 font-medium">Total</span><span className="text-white font-medium">${escrow.lockAmount}</span></div>
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="text-sm text-zinc-400 block mb-1">Resolution Note *</label>
                                    <textarea value={settlementNote} onChange={e => setSettlementNote(e.target.value)} rows={3} placeholder="Explain the rationale for this decision..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-500" />
                                </div>

                                {/* Resolve Button */}
                                <button
                                    onClick={handleResolve}
                                    disabled={isPending || settlementNote.trim().length < 5 || dispute.adminInquiryOpen}
                                    className="w-full px-4 py-3 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium disabled:opacity-40"
                                >
                                    {dispute.adminInquiryOpen ? 'Settlement locked — inquiry in progress' : isPending ? 'Resolving...' : `Resolve — ${settlementPercent}% to Freelancer`}
                                </button>
                            </div>
                        )}
                    </CollapsibleSection>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> Confirm Resolution</h3>
                            <button onClick={() => setShowConfirmModal(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-zinc-500">Escrow Amount</span><span className="text-white font-medium">${escrow.lockAmount}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Freelancer %</span><span className="text-emerald-400">{settlementPercent}%</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Freelancer Payout</span><span className="text-emerald-400">${(lockAmount * settlementPercent / 100).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Client Refund</span><span className="text-blue-400">${(lockAmount * (100 - settlementPercent) / 100).toFixed(2)}</span></div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-amber-400 text-sm font-medium">⚠ You are about to release escrow funds.</p>
                            <p className="text-amber-400/70 text-xs mt-1">This action cannot be undone.</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={executeResolve} disabled={isPending} className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium disabled:opacity-40">
                                {isPending ? 'Processing...' : 'Confirm Resolution'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Version History Modal — for admin chat inspection */}
            <MessageVersionHistory
                messageId={versionHistoryMessageId}
                isOpen={versionHistoryMessageId !== null}
                onClose={() => setVersionHistoryMessageId(null)}
            />
        </div>
    );
}

// ============================================================================
// Reusable Sub-Components
// ============================================================================

function CollapsibleSection({ title, icon, isOpen, onToggle, children }: {
    title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
    return (
        <GlassCard className="overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/30 transition-colors">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">{icon} {title}</h3>
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>
            {isOpen && <div className="px-4 pb-4">{children}</div>}
        </GlassCard>
    );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">{label}</span>
            <span className={`text-sm ${valueColor || 'text-zinc-300'}`}>{value}</span>
        </div>
    );
}
