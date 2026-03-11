'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import {
    Scale, Clock, CheckCircle, AlertTriangle,
    DollarSign, Search, ChevronRight, MessageSquare, FileText, Shield
} from 'lucide-react';
import { getDisputesForUser } from '@/actions/dispute-actions';

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open', icon: AlertTriangle },
    DISCUSSION: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Discussion', icon: MessageSquare },
    PROPOSAL: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Proposal', icon: Scale },
    ADMIN_REVIEW: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Admin Review', icon: Shield },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved', icon: CheckCircle },
    CLOSED: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Closed', icon: CheckCircle },
};

const reasonLabels: Record<string, string> = {
    QUALITY_ISSUES: 'Quality Issues',
    NON_DELIVERY: 'Non-Delivery',
    SCOPE_CREEP: 'Scope Creep',
    MISSED_DEADLINE: 'Missed Deadline',
    COMMUNICATION: 'Communication',
    PAYMENT_DISPUTE: 'Payment Dispute',
    OTHER: 'Other',
};

type DisputeItem = {
    id: string;
    reason: string;
    description: string;
    status: string;
    outcome: string | null;
    freelancerPercent: number | null;
    createdAt: string;
    resolvedAt: string | null;
    discussionDeadline: string | null;
    proposalDeadline: string | null;
    milestoneTitle: string;
    milestoneAmount: string;
    contractId: string;
    contractTitle: string;
    clientName: string;
    freelancerName: string;
    clientUserId: string;
    freelancerUserId: string;
    openedById: string;
    messageCount: number;
    evidenceCount: number;
    proposalCount: number;
};

export default function FreelancerDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const result = await getDisputesForUser();
            if (result && 'disputes' in result && result.disputes) {
                setDisputes(result.disputes as DisputeItem[]);
                setCurrentUserId(result.currentUserId || '');
            }
            setLoading(false);
        }
        load();
    }, []);

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'active') return !['RESOLVED', 'CLOSED'].includes(d.status);
        if (filter === 'resolved') return ['RESOLVED', 'CLOSED'].includes(d.status);
        return true;
    }).filter(d =>
        d.milestoneTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = disputes.filter(d => !['RESOLVED', 'CLOSED'].includes(d.status)).length;
    const resolvedCount = disputes.filter(d => ['RESOLVED', 'CLOSED'].includes(d.status)).length;
    const totalDisputedAmount = disputes
        .filter(d => !['RESOLVED', 'CLOSED'].includes(d.status))
        .reduce((sum, d) => sum + parseFloat(d.milestoneAmount), 0);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-48" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-xl" />)}
                    </div>
                    <div className="h-64 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Disputes</h1>
                <p className="text-zinc-400">Manage and track your dispute cases</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-sm">Active Disputes</p>
                            <p className="text-2xl font-bold text-amber-400">{activeCount}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-amber-400/50" />
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-sm">Resolved</p>
                            <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-400/50" />
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-sm">Amount in Dispute</p>
                            <p className="text-2xl font-bold text-white">${totalDisputedAmount.toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-zinc-500" />
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search disputes..."
                            className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'active', 'resolved'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === f
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Dispute List */}
            <div className="space-y-4">
                {filteredDisputes.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <Scale className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">
                            {disputes.length === 0 ? 'No disputes yet' : 'No disputes match your filter'}
                        </p>
                    </GlassCard>
                ) : (
                    filteredDisputes.map((dispute) => {
                        const status = statusConfig[dispute.status] || statusConfig.OPEN;
                        const StatusIcon = status.icon;
                        const otherParty = dispute.openedById === currentUserId
                            ? (dispute.clientUserId === currentUserId ? dispute.freelancerName : dispute.clientName)
                            : (dispute.openedById === dispute.clientUserId ? dispute.clientName : dispute.freelancerName);
                        const deadline = dispute.proposalDeadline || dispute.discussionDeadline;

                        return (
                            <Link key={dispute.id} href={`/freelancer/disputes/${dispute.id}`}>
                                <GlassCard className="p-5 hover:border-zinc-600 transition-colors cursor-pointer mb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color} flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                                <span className="text-zinc-500 text-xs">
                                                    {reasonLabels[dispute.reason] || dispute.reason}
                                                </span>
                                            </div>
                                            <h3 className="text-white font-medium mb-1">{dispute.milestoneTitle}</h3>
                                            <p className="text-zinc-500 text-sm">
                                                Contract: {dispute.contractTitle} â€¢ With: {otherParty}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" /> {dispute.messageCount} messages
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> {dispute.evidenceCount} evidence
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Scale className="w-3 h-3" /> {dispute.proposalCount} proposals
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-white font-bold">${dispute.milestoneAmount}</p>
                                            {deadline && !['RESOLVED', 'CLOSED'].includes(dispute.status) && (
                                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                            {dispute.resolvedAt && (
                                                <p className="text-emerald-400/70 text-xs mt-1">
                                                    Resolved {new Date(dispute.resolvedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-500 ml-4 self-center" />
                                    </div>
                                    {dispute.outcome && dispute.freelancerPercent !== null && (
                                        <div className="mt-3 pt-3 border-t border-zinc-800">
                                            <p className="text-emerald-400 text-sm">
                                                âœ“ Resolved â€” {dispute.freelancerPercent}% to freelancer, {100 - dispute.freelancerPercent}% refund
                                            </p>
                                        </div>
                                    )}
                                </GlassCard>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}

