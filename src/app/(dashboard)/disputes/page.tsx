'use client';

import React, { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import Link from 'next/link';
import {
    Flag, Search, Filter, Clock, CheckCircle, AlertTriangle,
    Scale, ChevronRight, Calendar, DollarSign, FileText
} from 'lucide-react';

// Mock data
const disputes = [
    {
        id: 'dispute-1',
        title: 'Quality of deliverables not meeting requirements',
        contract: 'Backend API Development',
        contractId: 'contract-1',
        otherParty: 'David Kim',
        reason: 'QUALITY_ISSUES',
        status: 'OPEN',
        disputedAmount: 3500,
        createdAt: '2025-01-18',
        lastUpdate: '2 hours ago',
    },
    {
        id: 'dispute-2',
        title: 'Missed project deadline',
        contract: 'Mobile App Design',
        contractId: 'contract-2',
        otherParty: 'Emily Rose',
        reason: 'NON_DELIVERY',
        status: 'UNDER_REVIEW',
        disputedAmount: 2000,
        createdAt: '2025-01-15',
        lastUpdate: '1 day ago',
    },
    {
        id: 'dispute-3',
        title: 'Payment not released after approval',
        contract: 'Website Redesign',
        contractId: 'contract-3',
        otherParty: 'TechCorp Solutions',
        reason: 'PAYMENT_DISPUTE',
        status: 'RESOLVED',
        disputedAmount: 1500,
        createdAt: '2025-01-10',
        lastUpdate: '5 days ago',
        outcome: 'FREELANCER_FAVORED',
    },
];

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open', icon: AlertTriangle },
    UNDER_REVIEW: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Under Review', icon: Scale },
    EVIDENCE_REQUESTED: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Evidence Requested', icon: FileText },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved', icon: CheckCircle },
    ESCALATED: { color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Escalated', icon: AlertTriangle },
};

const reasonLabels: Record<string, string> = {
    NON_DELIVERY: 'Non-Delivery',
    QUALITY_ISSUES: 'Quality Issues',
    SCOPE_CREEP: 'Scope Creep',
    COMMUNICATION: 'Communication',
    PAYMENT_DISPUTE: 'Payment Dispute',
    OTHER: 'Other',
};

export default function DisputesListPage() {
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'open') return d.status !== 'RESOLVED';
        if (filter === 'resolved') return d.status === 'RESOLVED';
        return true;
    }).filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contract.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCount = disputes.filter(d => d.status !== 'RESOLVED').length;
    const resolvedCount = disputes.filter(d => d.status === 'RESOLVED').length;

    return (
        <DashboardShell role="freelancer">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Disputes</h1>
                        <p className="text-zinc-400">Manage and track your dispute cases</p>
                    </div>
                    <Link href="/disputes/new">
                        <GlassButton variant="primary">
                            <Flag className="w-4 h-4 mr-2" /> Open New Dispute
                        </GlassButton>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-sm">Open Disputes</p>
                                <p className="text-2xl font-bold text-amber-400">{openCount}</p>
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
                                <p className="text-zinc-500 text-sm">Total Amount in Dispute</p>
                                <p className="text-2xl font-bold text-white">
                                    ${disputes.filter(d => d.status !== 'RESOLVED').reduce((sum, d) => sum + d.disputedAmount, 0).toLocaleString()}
                                </p>
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
                            {['all', 'open', 'resolved'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as typeof filter)}
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
                            <p className="text-zinc-400">No disputes found</p>
                        </GlassCard>
                    ) : (
                        filteredDisputes.map((dispute) => {
                            const status = statusConfig[dispute.status];
                            const StatusIcon = status.icon;

                            return (
                                <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                                    <GlassCard className="p-5 hover:border-zinc-600 transition-colors cursor-pointer">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="text-zinc-500 text-xs">
                                                        {reasonLabels[dispute.reason]}
                                                    </span>
                                                </div>
                                                <h3 className="text-white font-medium mb-1">{dispute.title}</h3>
                                                <p className="text-zinc-500 text-sm">
                                                    Contract: {dispute.contract} • With: {dispute.otherParty}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-white font-bold">${dispute.disputedAmount.toLocaleString()}</p>
                                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end mt-1">
                                                    <Clock className="w-3 h-3" /> {dispute.lastUpdate}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-500 ml-4 self-center" />
                                        </div>
                                        {dispute.outcome && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800">
                                                <p className="text-emerald-400 text-sm">
                                                    ✓ Resolved in your favor
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
        </DashboardShell>
    );
}
