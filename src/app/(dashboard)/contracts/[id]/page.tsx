'use client';

import React, { useState, use } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { GlassModal } from '@/components/ui/glass-modal';
import { NotFoundState } from '@/components/ui/not-found-state';
import { AccessDeniedState } from '@/components/ui/access-denied-state';
import Link from 'next/link';
import {
    FileText, DollarSign, Clock, CheckCircle, AlertCircle,
    MessageSquare, Upload, Download, ChevronRight, Calendar,
    User, Shield, RotateCcw, Flag, Star, ExternalLink, Plus
} from 'lucide-react';

// Mock contract data
const contract = {
    id: 'contract-1',
    title: 'Backend API Development - Node.js',
    description: 'Development of RESTful APIs for the TechCorp platform.',
    status: 'ACTIVE',
    contractType: 'FIXED',
    totalAmount: 6500,
    client: {
        name: 'Sarah Chen',
        company: 'TechCorp Solutions',
        avatar: null,
    },
    freelancer: {
        name: 'David Kim',
        avatar: null,
    },
    startDate: '2025-01-08',
    endDate: null,
    milestones: [
        {
            id: 'ms-1',
            title: 'API Design & Documentation',
            description: 'Design API endpoints and create OpenAPI documentation',
            amount: 1500,
            dueDate: '2025-01-20',
            status: 'APPROVED',
            revisionCount: 0,
            maxRevisions: 2,
        },
        {
            id: 'ms-2',
            title: 'Core API Development',
            description: 'Implement authentication, user management, and core CRUD endpoints',
            amount: 3500,
            dueDate: '2025-02-01',
            status: 'IN_PROGRESS',
            revisionCount: 0,
            maxRevisions: 2,
        },
        {
            id: 'ms-3',
            title: 'Testing & Deployment',
            description: 'Write tests, set up CI/CD, and deploy to staging',
            amount: 1500,
            dueDate: '2025-02-10',
            status: 'PENDING',
            revisionCount: 0,
            maxRevisions: 2,
        },
    ],
    escrow: {
        totalDeposited: 6500,
        totalReleased: 1500,
        currentBalance: 5000,
    },
    activityLog: [
        { action: 'CONTRACT_CREATED', description: 'Contract created', user: 'Sarah Chen', timestamp: '2025-01-08 10:30 AM' },
        { action: 'ESCROW_FUNDED', description: 'Escrow funded with $6,500', user: 'Sarah Chen', timestamp: '2025-01-08 10:35 AM' },
        { action: 'MILESTONE_STARTED', description: 'Started working on Milestone 1', user: 'David Kim', timestamp: '2025-01-08 11:00 AM' },
        { action: 'MILESTONE_SUBMITTED', description: 'Milestone 1 submitted for review', user: 'David Kim', timestamp: '2025-01-12 04:30 PM' },
        { action: 'MILESTONE_APPROVED', description: 'Milestone 1 approved', user: 'Sarah Chen', timestamp: '2025-01-13 09:15 AM' },
        { action: 'PAYMENT_RELEASED', description: '$1,500 released for Milestone 1', user: 'System', timestamp: '2025-01-13 09:15 AM' },
        { action: 'MILESTONE_STARTED', description: 'Started working on Milestone 2', user: 'David Kim', timestamp: '2025-01-14 10:00 AM' },
    ],
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Pending' },
    IN_PROGRESS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    SUBMITTED: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Under Review' },
    REVISION_REQUESTED: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Revision Requested' },
    APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Approved' },
    PAID: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paid' },
};

function MilestoneCard({
    milestone,
    isClient,
    onSubmit,
    onApprove,
    onRequestRevision
}: {
    milestone: typeof contract.milestones[0];
    isClient: boolean;
    onSubmit: () => void;
    onApprove: () => void;
    onRequestRevision: () => void;
}) {
    const status = statusColors[milestone.status] || statusColors.PENDING;

    return (
        <div className="p-5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-white">{milestone.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.text}`}>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-zinc-500 text-sm">{milestone.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold">${milestone.amount.toLocaleString()}</p>
                    <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" /> Due {milestone.dueDate}
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${milestone.status === 'APPROVED' || milestone.status === 'PAID'
                            ? 'bg-emerald-500 w-full'
                            : milestone.status === 'SUBMITTED'
                                ? 'bg-amber-500 w-3/4'
                                : milestone.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500 w-1/2'
                                    : 'bg-zinc-600 w-0'
                            }`}
                    />
                </div>
            </div>

            {/* Revision info */}
            {milestone.revisionCount > 0 && (
                <p className="text-xs text-zinc-500 mb-3">
                    Revisions: {milestone.revisionCount}/{milestone.maxRevisions}
                </p>
            )}

            {/* Action buttons based on status and role */}
            <div className="flex items-center gap-2">
                {!isClient && milestone.status === 'IN_PROGRESS' && (
                    <GlassButton size="sm" variant="primary" onClick={onSubmit}>
                        <Upload className="w-3 h-3 mr-1" /> Submit Deliverable
                    </GlassButton>
                )}
                {isClient && milestone.status === 'SUBMITTED' && (
                    <>
                        <GlassButton size="sm" variant="primary" onClick={onApprove}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </GlassButton>
                        <GlassButton size="sm" variant="secondary" onClick={onRequestRevision}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Request Revision
                        </GlassButton>
                    </>
                )}
                {milestone.status === 'REVISION_REQUESTED' && !isClient && (
                    <GlassButton size="sm" variant="primary" onClick={onSubmit}>
                        <Upload className="w-3 h-3 mr-1" /> Submit Revision
                    </GlassButton>
                )}
                {(milestone.status === 'APPROVED' || milestone.status === 'PAID') && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Completed
                    </span>
                )}
            </div>
        </div>
    );
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Valid contract IDs for this mock (simulate DB lookup)
    const validContractIds = ['contract-1', 'contract-2', 'contract-3'];
    const isValidId = validContractIds.includes(id);

    const [isClient] = useState(true); // Toggle for demo - would come from session
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

    // Simulate permission check (Mock: contract-3 is restricted)
    const hasPermission = id !== 'contract-3';

    // Not found check
    if (!isValidId) {
        return (
            <DashboardShell role="freelancer">
                <NotFoundState
                    title="Contract Not Found"
                    message="This contract does not exist or you don't have access to it."
                    backHref="/contracts"
                    backLabel="View Contracts"
                />
            </DashboardShell>
        );
    }

    // Access Denied check
    if (!hasPermission) {
        return (
            <DashboardShell role="freelancer">
                <AccessDeniedState
                    title="Access Restricted"
                    message="You do not have permission to view this contract details."
                    backHref="/contracts"
                />
            </DashboardShell>
        );
    }

    const completedMilestones = contract.milestones.filter(m => m.status === 'APPROVED' || m.status === 'PAID').length;
    const progress = (completedMilestones / contract.milestones.length) * 100;

    return (
        <DashboardShell role={isClient ? 'client' : 'freelancer'}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                                Active
                            </span>
                        </div>
                        <p className="text-zinc-400">{contract.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/messages`}>
                            <GlassButton variant="secondary">
                                <MessageSquare className="w-4 h-4 mr-2" /> Message
                            </GlassButton>
                        </Link>
                        <GlassButton variant="ghost">
                            <Flag className="w-4 h-4 mr-2" /> Report Issue
                        </GlassButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Overview */}
                        <GlassCard className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Project Progress</h2>
                                <span className="text-indigo-400 font-bold">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm text-zinc-500">
                                <span>{completedMilestones} of {contract.milestones.length} milestones completed</span>
                                <span>Started {contract.startDate}</span>
                            </div>
                        </GlassCard>

                        {/* Milestones */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Milestones</h2>
                            <div className="space-y-4">
                                {contract.milestones.map((milestone) => (
                                    <MilestoneCard
                                        key={milestone.id}
                                        milestone={milestone}
                                        isClient={isClient}
                                        onSubmit={() => {
                                            setSelectedMilestone(milestone.id);
                                            setShowSubmitModal(true);
                                        }}
                                        onApprove={() => {
                                            // Handle approve
                                        }}
                                        onRequestRevision={() => {
                                            setSelectedMilestone(milestone.id);
                                            setShowRevisionModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </GlassCard>

                        {/* Activity Log */}
                        <GlassCard className="p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Activity Timeline</h2>
                            <div className="space-y-4">
                                {contract.activityLog.map((entry, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            {entry.action.includes('PAYMENT') ? (
                                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                            ) : entry.action.includes('APPROVED') ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                            ) : entry.action.includes('SUBMITTED') ? (
                                                <Upload className="w-4 h-4 text-amber-400" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4 border-b border-zinc-800 last:border-0">
                                            <p className="text-white text-sm">{entry.description}</p>
                                            <p className="text-zinc-500 text-xs mt-1">
                                                {entry.user} • {entry.timestamp}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contract Value */}
                        <GlassCard className="p-6">
                            <h3 className="text-sm text-zinc-500 mb-2">Contract Value</h3>
                            <p className="text-3xl font-bold text-white mb-1">
                                ${contract.totalAmount.toLocaleString()}
                            </p>
                            <p className="text-zinc-500 text-sm">{contract.contractType} Price</p>
                        </GlassCard>

                        {/* Escrow Status */}
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-semibold text-white">Escrow Account</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Total Funded</span>
                                    <span className="text-white font-medium">${contract.escrow.totalDeposited.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Released</span>
                                    <span className="text-emerald-400 font-medium">${contract.escrow.totalReleased.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-zinc-700">
                                    <span className="text-zinc-500 text-sm">In Escrow</span>
                                    <span className="text-white font-bold">${contract.escrow.currentBalance.toLocaleString()}</span>
                                </div>
                            </div>
                            {isClient && (
                                <GlassButton variant="secondary" className="w-full mt-4" size="sm">
                                    <Plus className="w-4 h-4 mr-2" /> Add Funds
                                </GlassButton>
                            )}
                        </GlassCard>

                        {/* Parties */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Contract Parties</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold">
                                        SC
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{contract.client.name}</p>
                                        <p className="text-zinc-500 text-xs">{contract.client.company}</p>
                                    </div>
                                    <span className="ml-auto text-zinc-500 text-xs">Client</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                        DK
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{contract.freelancer.name}</p>
                                        <p className="text-zinc-500 text-xs">Freelancer</p>
                                    </div>
                                    <span className="ml-auto text-zinc-500 text-xs">Freelancer</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link href={`/contracts/${contract.id}/escrow`} className="block">
                                    <GlassButton variant="ghost" className="w-full justify-start">
                                        <DollarSign className="w-4 h-4 mr-2" /> View Transactions
                                    </GlassButton>
                                </Link>
                                <GlassButton variant="ghost" className="w-full justify-start">
                                    <Download className="w-4 h-4 mr-2" /> Download Contract
                                </GlassButton>
                                <GlassButton variant="ghost" className="w-full justify-start">
                                    <Star className="w-4 h-4 mr-2" /> Leave Review
                                </GlassButton>
                            </div>
                        </GlassCard>

                        {/* End Contract */}
                        <GlassCard className="p-6 border-rose-500/20">
                            <h3 className="font-semibold text-white mb-2">Contract Actions</h3>
                            <p className="text-zinc-500 text-sm mb-4">
                                End the contract early or open a dispute if there are issues.
                            </p>
                            <div className="space-y-2">
                                <GlassButton variant="secondary" className="w-full">
                                    End Contract
                                </GlassButton>
                                <Link href="/disputes/new" className="block">
                                    <GlassButton variant="ghost" className="w-full text-rose-400">
                                        <Flag className="w-4 h-4 mr-2" /> Open Dispute
                                    </GlassButton>
                                </Link>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* Submit Deliverable Modal */}
            <GlassModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                title="Submit Deliverable"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Description</label>
                        <GlassTextarea
                            placeholder="Describe what you've completed..."
                            rows={4}
                        />
                    </div>
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center">
                        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                        <p className="text-zinc-400 text-sm">Upload files or drag and drop</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1">
                            Submit for Review
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>

            {/* Request Revision Modal */}
            <GlassModal
                isOpen={showRevisionModal}
                onClose={() => setShowRevisionModal(false)}
                title="Request Revision"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-amber-400 text-sm">
                            Please provide clear feedback so the freelancer can address your concerns.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">What needs to be changed?</label>
                        <GlassTextarea
                            placeholder="Describe the changes needed..."
                            rows={4}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowRevisionModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1">
                            Request Revision
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </DashboardShell>
    );
}
