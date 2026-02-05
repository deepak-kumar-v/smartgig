'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { GlassModal } from '@/components/ui/glass-modal';
import Link from 'next/link';
import {
    Scale, Search, Filter, Clock, CheckCircle, AlertTriangle,
    ChevronRight, DollarSign, Gavel, User, FileText, Eye
} from 'lucide-react';

// Mock admin disputes data
const disputes = [
    {
        id: 'dispute-1',
        title: 'Quality of deliverables not meeting requirements',
        contract: 'Backend API Development',
        initiator: { name: 'Sarah Chen', role: 'CLIENT' },
        respondent: { name: 'David Kim', role: 'FREELANCER' },
        reason: 'QUALITY_ISSUES',
        status: 'UNDER_REVIEW',
        disputedAmount: 3500,
        createdAt: '2025-01-18',
        priority: 'HIGH',
        assignedTo: null,
    },
    {
        id: 'dispute-2',
        title: 'Missed project deadline',
        contract: 'Mobile App Design',
        initiator: { name: 'John Smith', role: 'CLIENT' },
        respondent: { name: 'Emily Rose', role: 'FREELANCER' },
        reason: 'NON_DELIVERY',
        status: 'ESCALATED',
        disputedAmount: 2000,
        createdAt: '2025-01-15',
        priority: 'CRITICAL',
        assignedTo: 'Admin Mike',
    },
    {
        id: 'dispute-3',
        title: 'Payment not released after approval',
        contract: 'Website Redesign',
        initiator: { name: 'Alex Johnson', role: 'FREELANCER' },
        respondent: { name: 'TechCorp', role: 'CLIENT' },
        reason: 'PAYMENT_DISPUTE',
        status: 'OPEN',
        disputedAmount: 1500,
        createdAt: '2025-01-19',
        priority: 'MEDIUM',
        assignedTo: null,
    },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
    UNDER_REVIEW: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
    ESCALATED: { color: 'text-rose-400', bg: 'bg-rose-500/20' },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
    LOW: { color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
    CRITICAL: { color: 'text-rose-400', bg: 'bg-rose-500/20' },
};

export default function AdminDisputesPage() {
    const [filter, setFilter] = useState<'all' | 'unassigned' | 'mine'>('all');
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
    const [decision, setDecision] = useState<'freelancer' | 'client' | 'split' | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'unassigned') return !d.assignedTo;
        if (filter === 'mine') return d.assignedTo === 'Admin Mike';
        return true;
    });

    const handleDecision = () => {
        // Mock decision handling
        setShowDecisionModal(false);
        setSelectedDispute(null);
        setDecision(null);
        setResolutionNote('');
    };

    return (
        <DashboardShell role="admin">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
                        <p className="text-zinc-400">Review and resolve platform disputes</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-zinc-500 text-sm">Pending Review</p>
                            <p className="text-2xl font-bold text-amber-400">
                                {disputes.filter(d => d.status !== 'RESOLVED').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Open</p>
                                <p className="text-2xl font-bold text-amber-400">
                                    {disputes.filter(d => d.status === 'OPEN').length}
                                </p>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-amber-400/50" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Under Review</p>
                                <p className="text-2xl font-bold text-blue-400">
                                    {disputes.filter(d => d.status === 'UNDER_REVIEW').length}
                                </p>
                            </div>
                            <Scale className="w-6 h-6 text-blue-400/50" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Escalated</p>
                                <p className="text-2xl font-bold text-rose-400">
                                    {disputes.filter(d => d.status === 'ESCALATED').length}
                                </p>
                            </div>
                            <AlertTriangle className="w-6 h-6 text-rose-400/50" />
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Total Value</p>
                                <p className="text-2xl font-bold text-white">
                                    ${disputes.reduce((sum, d) => sum + d.disputedAmount, 0).toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-6 h-6 text-zinc-500" />
                        </div>
                    </GlassCard>
                </div>

                {/* Filters */}
                <GlassCard className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search disputes..."
                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'unassigned', 'mine'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as typeof filter)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === f
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {f === 'mine' ? 'My Cases' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Disputes Table */}
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800/50">
                                <tr>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Dispute</th>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Parties</th>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Status</th>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Priority</th>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Amount</th>
                                    <th className="text-left p-4 text-zinc-400 font-medium text-sm">Assigned</th>
                                    <th className="text-right p-4 text-zinc-400 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDisputes.map((dispute) => {
                                    const status = statusConfig[dispute.status];
                                    const priority = priorityConfig[dispute.priority];

                                    return (
                                        <tr key={dispute.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                                            <td className="p-4">
                                                <p className="text-white font-medium">{dispute.title}</p>
                                                <p className="text-zinc-500 text-sm">{dispute.contract}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">
                                                    <p className="text-zinc-400">{dispute.initiator.name} <span className="text-zinc-600">vs</span></p>
                                                    <p className="text-zinc-400">{dispute.respondent.name}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${status.bg} ${status.color}`}>
                                                    {dispute.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${priority.bg} ${priority.color}`}>
                                                    {dispute.priority}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-white font-medium">${dispute.disputedAmount.toLocaleString()}</span>
                                            </td>
                                            <td className="p-4">
                                                {dispute.assignedTo ? (
                                                    <span className="text-zinc-400">{dispute.assignedTo}</span>
                                                ) : (
                                                    <GlassButton variant="ghost" size="sm">
                                                        Assign to me
                                                    </GlassButton>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Link href={`/disputes/${dispute.id}`}>
                                                        <GlassButton variant="ghost" size="sm">
                                                            <Eye className="w-4 h-4" />
                                                        </GlassButton>
                                                    </Link>
                                                    <GlassButton
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedDispute(dispute.id);
                                                            setShowDecisionModal(true);
                                                        }}
                                                    >
                                                        <Gavel className="w-4 h-4" />
                                                    </GlassButton>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* Decision Modal */}
            <GlassModal
                isOpen={showDecisionModal}
                onClose={() => setShowDecisionModal(false)}
                title="Make Decision"
            >
                <div className="space-y-6">
                    <div>
                        <label className="text-white text-sm font-medium mb-3 block">Resolution</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setDecision('freelancer')}
                                className={`p-4 rounded-xl border text-center transition-all ${decision === 'freelancer'
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                    }`}
                            >
                                <User className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                                <p className="text-white text-sm font-medium">Freelancer</p>
                            </button>
                            <button
                                onClick={() => setDecision('client')}
                                className={`p-4 rounded-xl border text-center transition-all ${decision === 'client'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                    }`}
                            >
                                <User className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                <p className="text-white text-sm font-medium">Client</p>
                            </button>
                            <button
                                onClick={() => setDecision('split')}
                                className={`p-4 rounded-xl border text-center transition-all ${decision === 'split'
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                    }`}
                            >
                                <Scale className="w-6 h-6 mx-auto mb-2 text-violet-400" />
                                <p className="text-white text-sm font-medium">Split</p>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-white text-sm font-medium">Resolution Note</label>
                        <GlassTextarea
                            value={resolutionNote}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolutionNote(e.target.value)}
                            placeholder="Explain your decision..."
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowDecisionModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant="primary"
                            className="flex-1"
                            disabled={!decision || !resolutionNote}
                            onClick={handleDecision}
                        >
                            <Gavel className="w-4 h-4 mr-2" /> Confirm Decision
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </DashboardShell>
    );
}
