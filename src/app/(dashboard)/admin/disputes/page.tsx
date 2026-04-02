'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import {
    Scale, Clock, CheckCircle, AlertTriangle, Shield,
    DollarSign, Search, MessageSquare, FileText, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { getDisputesForUser, getDispute, resolveDisputeAdmin, submitDisputeMessage } from '@/actions/dispute-actions';
import { toast } from 'sonner';

const statusConfig: Record<string, { color: string; bg: string; label: string; priority: number }> = {
    ADMIN_REVIEW: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Admin Review', priority: 0 },
    OPEN: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Open', priority: 1 },
    DISCUSSION: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Discussion', priority: 2 },
    PROPOSAL: { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Proposal', priority: 3 },
    RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Resolved', priority: 10 },
    CLOSED: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Closed', priority: 11 },
};

const reasonLabels: Record<string, string> = {
    QUALITY_ISSUES: 'Quality Issues', NON_DELIVERY: 'Non-Delivery', SCOPE_CREEP: 'Scope Creep',
    MISSED_DEADLINE: 'Missed Deadline', COMMUNICATION: 'Communication', PAYMENT_DISPUTE: 'Payment Dispute', OTHER: 'Other',
};

type DisputeItem = {
    id: string; reason: string; description: string; status: string; outcome: string | null;
    freelancerPercent: number | null; createdAt: string; resolvedAt: string | null;
    discussionDeadline: string | null; proposalDeadline: string | null;
    milestoneTitle: string; milestoneAmount: string; contractId: string; contractTitle: string;
    clientName: string; freelancerName: string; clientUserId: string; freelancerUserId: string;
    openedById: string; messageCount: number; evidenceCount: number; proposalCount: number;
};

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'needs_review' | 'active' | 'resolved'>('needs_review');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Resolution state
    const [resolvePercent, setResolvePercent] = useState(50);
    const [resolveNote, setResolveNote] = useState('');

    // Expanded detail data
    const [detailData, setDetailData] = useState<Awaited<ReturnType<typeof getDispute>> | null>(null);

    const loadDisputes = async () => {
        const result = await getDisputesForUser();
        if (result && 'disputes' in result && result.disputes) {
            setDisputes(result.disputes as DisputeItem[]);
        }
        setLoading(false);
    };

    useEffect(() => { loadDisputes(); }, []);

    const loadDetail = async (id: string) => {
        const result = await getDispute(id);
        setDetailData(result);
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setDetailData(null);
        } else {
            setExpandedId(id);
            setResolvePercent(50);
            setResolveNote('');
            loadDetail(id);
        }
    };

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'needs_review') return d.status === 'ADMIN_REVIEW';
        if (filter === 'active') return !['RESOLVED', 'CLOSED'].includes(d.status);
        if (filter === 'resolved') return ['RESOLVED', 'CLOSED'].includes(d.status);
        return true;
    }).filter(d =>
        d.milestoneTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.freelancerName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (statusConfig[a.status]?.priority ?? 99) - (statusConfig[b.status]?.priority ?? 99));

    const needsReviewCount = disputes.filter(d => d.status === 'ADMIN_REVIEW').length;
    const activeCount = disputes.filter(d => !['RESOLVED', 'CLOSED'].includes(d.status)).length;
    const totalInDispute = disputes.filter(d => !['RESOLVED', 'CLOSED'].includes(d.status)).reduce((s, d) => s + parseFloat(d.milestoneAmount), 0);

    const handleResolve = (disputeId: string) => {
        if (!resolveNote || resolveNote.trim().length < 5) {
            toast.error('Resolution note must be at least 5 characters');
            return;
        }
        const idempotencyKey = `resolve_${disputeId}_${Date.now()}`;
        startTransition(async () => {
            const result = await resolveDisputeAdmin(disputeId, resolvePercent, resolveNote, idempotencyKey);
            if (result.success) {
                toast.success('Dispute resolved successfully');
                setExpandedId(null);
                setDetailData(null);
                loadDisputes();
            } else {
                toast.error(result.error || 'Failed to resolve');
            }
        });
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-48" />
                    <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-xl" />)}</div>
                    <div className="h-64 bg-zinc-800 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-7 h-7 text-orange-400" /> Admin — Dispute Resolution Center
                </h1>
                <p className="text-zinc-400 mt-1">Review, arbitrate, and resolve disputes</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div><p className="text-zinc-500 text-sm">Needs Review</p><p className="text-2xl font-bold text-orange-400">{needsReviewCount}</p></div>
                        <Shield className="w-8 h-8 text-orange-400/50" />
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div><p className="text-zinc-500 text-sm">Active</p><p className="text-2xl font-bold text-amber-400">{activeCount}</p></div>
                        <AlertTriangle className="w-8 h-8 text-amber-400/50" />
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div><p className="text-zinc-500 text-sm">Resolved</p><p className="text-2xl font-bold text-emerald-400">{disputes.length - activeCount}</p></div>
                        <CheckCircle className="w-8 h-8 text-emerald-400/50" />
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div><p className="text-zinc-500 text-sm">Amount at Risk</p><p className="text-2xl font-bold text-white">${totalInDispute.toLocaleString()}</p></div>
                        <DollarSign className="w-8 h-8 text-zinc-500" />
                    </div>
                </GlassCard>
            </div>

            {/* Filters */}
            <GlassCard className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search disputes, parties, contracts..." className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'needs_review', label: `Review (${needsReviewCount})` },
                            { key: 'active', label: 'Active' },
                            { key: 'all', label: 'All' },
                            { key: 'resolved', label: 'Resolved' },
                        ].map((f) => (
                            <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === f.key ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Dispute List */}
            <div className="space-y-3">
                {filteredDisputes.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <Scale className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">{disputes.length === 0 ? 'No disputes in the system' : 'No disputes match your filter'}</p>
                    </GlassCard>
                ) : (
                    filteredDisputes.map((dispute) => {
                        const status = statusConfig[dispute.status] || statusConfig.OPEN;
                        const isExpanded = expandedId === dispute.id;

                        return (
                            <GlassCard key={dispute.id} className="overflow-hidden">
                                {/* Row */}
                                <button onClick={() => toggleExpand(dispute.id)} className="w-full p-5 text-left hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                                                <span className="text-zinc-500 text-xs">{reasonLabels[dispute.reason] || dispute.reason}</span>
                                                <span className="text-zinc-600 text-xs">•</span>
                                                <span className="text-zinc-500 text-xs">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-white font-medium">{dispute.milestoneTitle}</h3>
                                            <p className="text-zinc-500 text-sm mt-0.5">
                                                {dispute.clientName} (client) vs {dispute.freelancerName} (freelancer) • {dispute.contractTitle}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-zinc-600">
                                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{dispute.messageCount}</span>
                                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{dispute.evidenceCount}</span>
                                                <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{dispute.proposalCount}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link href={`/admin/disputes/${dispute.id}`} onClick={e => e.stopPropagation()} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-xs flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> Detail
                                            </Link>
                                            <p className="text-white font-bold">${dispute.milestoneAmount}</p>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-800 p-5 bg-zinc-900/50">
                                        {!detailData || 'error' in detailData ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Left: Evidence + Messages */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-white font-medium text-sm mb-2">Description</h4>
                                                        <p className="text-zinc-400 text-sm bg-zinc-800/50 rounded-lg p-3">{detailData.dispute.description}</p>
                                                    </div>
                                                    {detailData.dispute.evidence.length > 0 && (
                                                        <div>
                                                            <h4 className="text-white font-medium text-sm mb-2">Evidence ({detailData.dispute.evidence.length})</h4>
                                                            <div className="space-y-1">
                                                                {detailData.dispute.evidence.map((ev: { id: string; fileName: string; fileUrl: string; description: string | null }) => (
                                                                    <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded text-sm text-indigo-400 hover:text-indigo-300">
                                                                        <FileText className="w-3 h-3" /> {ev.fileName}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {detailData.dispute.proposals.length > 0 && (
                                                        <div>
                                                            <h4 className="text-white font-medium text-sm mb-2">Party Proposals</h4>
                                                            <div className="space-y-1">
                                                                {detailData.dispute.proposals.map((p: { id: string; proposedById: string; freelancerPercent: number; reason: string | null; createdAt: string }) => (
                                                                     <div key={p.id} className="p-2 bg-zinc-800/50 rounded text-sm flex justify-between">
                                                                        <span className="text-zinc-400">{p.proposedById === detailData.contract.clientUserId ? 'Client' : 'Freelancer'}</span>
                                                                        <span className="text-sm">
                                                                            <span className="text-emerald-400 font-medium">Freelancer: {p.freelancerPercent}%</span>
                                                                            <span className="text-zinc-600 mx-1">|</span>
                                                                            <span className="text-blue-400 font-medium">Client: {100 - p.freelancerPercent}%</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="text-white font-medium text-sm mb-2">Snapshot</h4>
                                                        <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-500 font-mono overflow-auto max-h-32">
                                                            <pre>{JSON.stringify(detailData.dispute.snapshot, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Resolution */}
                                                <div>
                                                    {!['RESOLVED', 'CLOSED'].includes(dispute.status) ? (
                                                        <div className="space-y-4">
                                                            <h4 className="text-white font-medium">Admin Resolution</h4>
                                                            <div>
                                                                <label className="text-sm text-zinc-400 block mb-2">Split: {resolvePercent}% → Freelancer, {100 - resolvePercent}% → Client</label>
                                                                <input type="range" min={0} max={100} step={1} value={resolvePercent} onChange={e => setResolvePercent(Number(e.target.value))} className="w-full accent-indigo-500" />
                                                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                                                    <span>Full Refund</span>
                                                                    <span className="text-white font-medium">${(parseFloat(dispute.milestoneAmount) * resolvePercent / 100).toFixed(2)} / ${dispute.milestoneAmount}</span>
                                                                    <span>Full Release</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm text-zinc-400 block mb-1">Resolution Note *</label>
                                                                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} rows={3} placeholder="Explain the rationale for this decision..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-500" />
                                                            </div>
                                                            <div className="bg-zinc-800/50 rounded-lg p-3 text-xs space-y-1">
                                                                <div className="flex justify-between"><span className="text-zinc-500">Freelancer receives</span><span className="text-emerald-400">${(parseFloat(dispute.milestoneAmount) * resolvePercent / 100).toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">Client refund</span><span className="text-blue-400">${(parseFloat(dispute.milestoneAmount) * (100 - resolvePercent) / 100).toFixed(2)}</span></div>
                                                                <div className="flex justify-between border-t border-zinc-700 pt-1 mt-1"><span className="text-zinc-400 font-medium">Total</span><span className="text-white font-medium">${dispute.milestoneAmount}</span></div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleResolve(dispute.id)}
                                                                disabled={isPending || resolveNote.trim().length < 5}
                                                                className="w-full px-4 py-3 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors font-medium disabled:opacity-40"
                                                            >
                                                                {isPending ? 'Resolving...' : `Resolve — ${resolvePercent}% to Freelancer`}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            <p className="text-emerald-400 font-medium mb-2">✓ Resolved</p>
                                                            {dispute.freelancerPercent !== null && (
                                                                <p className="text-zinc-400 text-sm">{dispute.freelancerPercent}% to freelancer, {100 - dispute.freelancerPercent}% refunded</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })
                )}
            </div>
        </div>
    );
}
