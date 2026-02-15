'use client';

import React, { useState, use } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { GlassModal } from '@/components/ui/glass-modal';
import { NotFoundState } from '@/components/ui/not-found-state';
import { AccessDeniedState } from '@/components/ui/access-denied-state';
import Link from 'next/link';
import {
    ArrowLeft, Flag, Scale, Clock, CheckCircle, AlertTriangle,
    Upload, MessageSquare, FileText, Download, User, Calendar,
    DollarSign, ChevronRight, Send
} from 'lucide-react';

// Mock dispute data
const dispute = {
    id: 'dispute-1',
    title: 'Quality of deliverables not meeting requirements',
    reason: 'QUALITY_ISSUES',
    description: 'The API documentation provided does not match the actual implementation. Several endpoints are missing and the response schemas are incorrect.',
    desiredResolution: 'I would like a full refund of the milestone payment or completion of the remaining work as specified.',
    status: 'UNDER_REVIEW',
    disputedAmount: 3500,
    contract: {
        id: 'contract-1',
        title: 'Backend API Development',
        totalAmount: 6500,
    },
    initiator: {
        id: 'client-1',
        name: 'Sarah Chen',
        role: 'CLIENT',
    },
    respondent: {
        id: 'freelancer-1',
        name: 'David Kim',
        role: 'FREELANCER',
    },
    evidence: [
        { id: 'ev-1', title: 'Original Requirements Document', type: 'PDF', uploadedBy: 'Sarah Chen', uploadedAt: '2025-01-18 10:30 AM' },
        { id: 'ev-2', title: 'API Documentation Screenshot', type: 'PNG', uploadedBy: 'Sarah Chen', uploadedAt: '2025-01-18 10:32 AM' },
        { id: 'ev-3', title: 'Delivered API Spec', type: 'PDF', uploadedBy: 'David Kim', uploadedAt: '2025-01-19 02:15 PM' },
    ],
    timeline: [
        { id: 't-1', action: 'Dispute Opened', description: 'Sarah Chen opened a dispute for quality issues', timestamp: '2025-01-18 10:30 AM', isSystem: false },
        { id: 't-2', action: 'Evidence Submitted', description: 'Sarah Chen uploaded 2 files as evidence', timestamp: '2025-01-18 10:32 AM', isSystem: false },
        { id: 't-3', action: 'Respondent Notified', description: 'David Kim has been notified and has 24 hours to respond', timestamp: '2025-01-18 10:33 AM', isSystem: true },
        { id: 't-4', action: 'Response Received', description: 'David Kim responded to the dispute', timestamp: '2025-01-19 02:15 PM', isSystem: false },
        { id: 't-5', action: 'Under Admin Review', description: 'Dispute has been escalated to admin for review', timestamp: '2025-01-19 03:00 PM', isSystem: true },
    ],
    createdAt: '2025-01-18',
    nextDeadline: '2025-01-21',
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open' },
    UNDER_REVIEW: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Under Review' },
    EVIDENCE_REQUESTED: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Evidence Requested' },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved' },
    ESCALATED: { color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Escalated' },
};

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Valid dispute IDs for this mock (simulate DB lookup)
    const validDisputeIds = ['dispute-1', 'dispute-2', 'dispute-3'];
    const isValidId = validDisputeIds.includes(id);

    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [message, setMessage] = useState('');

    // Not found check
    if (!isValidId) {
        return (
            <NotFoundState
                title="Dispute Not Found"
                message="This dispute does not exist or has been resolved."
                backHref="/disputes"
                backLabel="View Disputes"
            />
        );
    }

    // Simulate permission check (Mock: only dispute-1 and dispute-2 are accessible to this user)
    // In real app, check if session.user.id === initiator.id || session.user.id === respondent.id
    const hasPermission = id !== 'dispute-3';

    if (!hasPermission) {
        return (
            <AccessDeniedState
                title="Access Denied"
                message="You are not a party to this dispute and cannot view its details."
                backHref="/disputes"
            />
        );
    }

    const status = statusConfig[dispute.status];

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link href="/disputes" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Disputes
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-white">Dispute Details</h1>
                                <span className={`px-3 py-1 rounded-full text-sm ${status.bg} ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>
                            <p className="text-zinc-400">{dispute.title}</p>
                        </div>
                        <div className="flex gap-2">
                            <GlassButton variant="secondary" onClick={() => setShowMessageModal(true)}>
                                <MessageSquare className="w-4 h-4 mr-2" /> Send Message
                            </GlassButton>
                            <GlassButton variant="primary" onClick={() => setShowEvidenceModal(true)}>
                                <Upload className="w-4 h-4 mr-2" /> Add Evidence
                            </GlassButton>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dispute Details */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Dispute Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Description</p>
                                    <p className="text-white">{dispute.description}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Desired Resolution</p>
                                    <p className="text-white">{dispute.desiredResolution}</p>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Evidence */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Evidence</h2>
                                <GlassButton variant="ghost" size="sm" onClick={() => setShowEvidenceModal(true)}>
                                    <Upload className="w-4 h-4 mr-1" /> Add
                                </GlassButton>
                            </div>
                            <div className="space-y-3">
                                {dispute.evidence.map((ev) => (
                                    <div key={ev.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-zinc-700">
                                                <FileText className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{ev.title}</p>
                                                <p className="text-zinc-500 text-xs">
                                                    {ev.uploadedBy} • {ev.uploadedAt}
                                                </p>
                                            </div>
                                        </div>
                                        <GlassButton variant="ghost" size="sm">
                                            <Download className="w-4 h-4" />
                                        </GlassButton>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Timeline */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Timeline</h2>
                            <div className="space-y-4">
                                {dispute.timeline.map((entry, index) => (
                                    <div key={entry.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ${entry.isSystem ? 'bg-zinc-500' : 'bg-indigo-500'
                                                }`} />
                                            {index < dispute.timeline.length - 1 && (
                                                <div className="w-0.5 h-full bg-zinc-700 mt-2" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-white font-medium">{entry.action}</p>
                                            <p className="text-zinc-400 text-sm">{entry.description}</p>
                                            <p className="text-zinc-500 text-xs mt-1">{entry.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Amount */}
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="w-5 h-5 text-amber-400" />
                                <h3 className="font-semibold text-white">Disputed Amount</h3>
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">${dispute.disputedAmount.toLocaleString()}</p>
                            <p className="text-zinc-500 text-sm">
                                From contract worth ${dispute.contract.totalAmount.toLocaleString()}
                            </p>
                        </GlassCard>

                        {/* Parties */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Parties Involved</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{dispute.initiator.name}</p>
                                        <p className="text-rose-400 text-xs">Initiator ({dispute.initiator.role})</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{dispute.respondent.name}</p>
                                        <p className="text-indigo-400 text-xs">Respondent ({dispute.respondent.role})</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Deadlines */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Important Dates</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-sm">Opened</span>
                                    <span className="text-white">{dispute.createdAt}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-sm">Next Deadline</span>
                                    <span className="text-amber-400 font-medium">{dispute.nextDeadline}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Related Contract */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Related Contract</h3>
                            <Link href={`/contracts/${dispute.contract.id}`}>
                                <div className="p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors">
                                    <p className="text-white font-medium">{dispute.contract.title}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-zinc-500 text-sm">${dispute.contract.totalAmount.toLocaleString()}</span>
                                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    </div>
                                </div>
                            </Link>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* Add Evidence Modal */}
            <GlassModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                title="Add Evidence"
            >
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                        <p className="text-white font-medium">Drop files or click to upload</p>
                        <p className="text-zinc-500 text-sm mt-1">PDF, PNG, JPG up to 10MB</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowEvidenceModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1">
                            Upload
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>

            {/* Message Modal */}
            <GlassModal
                isOpen={showMessageModal}
                onClose={() => setShowMessageModal(false)}
                title="Send Message"
            >
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm">
                        Send a message to the other party regarding this dispute.
                    </p>
                    <GlassTextarea
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={4}
                    />
                    <div className="flex gap-3 pt-4">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowMessageModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1">
                            <Send className="w-4 h-4 mr-2" /> Send
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </>
    );
}
