'use client';

import React, { useEffect, useState } from 'react';
import {
    getContractFinancialTimeline,
    ContractTimelineEvent,
    ContractFinancialTimelineResult,
} from '@/actions/contract-financial-actions';

// ============================================================================
// Contract Financial Timeline — Ledger-Derived Visual Component
//
// Design: Full-width, border-separated rows, timeline dot + connector.
// Tokens: #0B0F14 bg, #111318 row, #1E2328 border
// Credits: emerald-400, Fees: amber-400, Debits: red-400
// ============================================================================

interface ContractFinancialTimelineProps {
    contractId: string;
}

export function ContractFinancialTimeline({ contractId }: ContractFinancialTimelineProps) {
    const [data, setData] = useState<ContractFinancialTimelineResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        getContractFinancialTimeline(contractId).then((result) => {
            if (cancelled) return;
            if ('error' in result) {
                setError(result.error);
            } else {
                setData(result);
            }
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [contractId]);

    // --- Loading State ---
    if (loading) {
        return (
            <div className="w-full py-16 text-center" style={{ backgroundColor: '#0B0F14' }}>
                <div className="inline-block w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                <p className="text-xs text-zinc-500 mt-3">Loading financial timeline…</p>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="w-full py-12 text-center" style={{ backgroundColor: '#0B0F14' }}>
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    // --- Empty State ---
    if (!data || data.events.length === 0) {
        return (
            <div className="w-full py-16 text-center" style={{ backgroundColor: '#0B0F14' }}>
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#111318', border: '1px solid #1E2328' }}
                >
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm text-zinc-500">No financial activity yet</p>
                <p className="text-xs text-zinc-600 mt-1">Events will appear here once escrow is funded</p>
            </div>
        );
    }

    // --- Timeline Render ---
    return (
        <div className="w-full" style={{ backgroundColor: '#0B0F14' }}>
            {/* Header */}
            <div className="px-4 py-3 mb-2" style={{ borderBottom: '1px solid #1E2328' }}>
                <h3 className="text-sm font-semibold text-white tracking-tight">Financial Timeline</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                    {data.events.length} event{data.events.length !== 1 ? 's' : ''} · All amounts ledger-derived
                </p>
            </div>

            {/* Scrollable Event List */}
            <div
                className="overflow-y-auto"
                style={{ maxHeight: '600px' }}
            >
                {data.events.map((event, index) => (
                    <TimelineRow
                        key={`${event.type}-${event.milestoneId}-${index}`}
                        event={event}
                        isLast={index === data.events.length - 1}
                    />
                ))}
            </div>
        </div>
    );
}

// --- Timeline Row ---

function TimelineRow({ event, isLast }: { event: ContractTimelineEvent; isLast: boolean }) {
    const dateStr = formatDate(event.date);

    return (
        <div
            className="flex gap-4 px-4"
            style={{ backgroundColor: '#111318', borderBottom: isLast ? 'none' : '1px solid #1E2328' }}
        >
            {/* Timeline Dot + Connector */}
            <div className="flex flex-col items-center pt-4 pb-4" style={{ minWidth: '20px' }}>
                <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getDotColor(event.type) }}
                />
                {!isLast && (
                    <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1E2328' }} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 py-3.5 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-white">
                                {getEventLabel(event.type)}
                            </span>
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                                style={{
                                    backgroundColor: getBadgeBg(event.type),
                                    color: getBadgeColor(event.type),
                                }}
                            >
                                {event.type === 'ESCROW_FUNDED' ? 'Lock' : event.type === 'MILESTONE_RELEASED' ? 'Release' : 'Refund'}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                            {event.milestoneTitle}
                        </p>
                    </div>
                    <span className="text-[11px] text-zinc-500 flex-shrink-0 tabular-nums">
                        {dateStr}
                    </span>
                </div>

                {/* Event-Specific Details */}
                <div className="mt-2">
                    {event.type === 'ESCROW_FUNDED' && (
                        <EscrowFundedDetail totalLocked={event.totalLocked} />
                    )}
                    {event.type === 'MILESTONE_RELEASED' && (
                        <MilestoneReleasedDetail
                            lockAmount={event.lockAmount}
                            freelancerReceived={event.freelancerReceived}
                            platformFee={event.platformFee}
                        />
                    )}
                    {event.type === 'REFUND' && (
                        <RefundDetail amount={event.amount} />
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Detail Renderers ---

function EscrowFundedDetail({ totalLocked }: { totalLocked: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-sm font-mono font-medium">
                +${totalLocked}
            </span>
            <span className="text-[11px] text-zinc-500">locked in escrow</span>
        </div>
    );
}

function MilestoneReleasedDetail({
    lockAmount,
    freelancerReceived,
    platformFee,
}: {
    lockAmount: string;
    freelancerReceived: string;
    platformFee: string;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Freelancer</span>
                <span className="text-emerald-400 text-sm font-mono font-medium">
                    +${freelancerReceived}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Platform Fee</span>
                <span className="text-amber-400 text-sm font-mono font-medium">
                    ${platformFee}
                </span>
            </div>
            <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid #1E2328' }}>
                <span className="text-[11px] text-zinc-400 w-20">Total</span>
                <span className="text-zinc-300 text-sm font-mono font-medium">
                    ${lockAmount}
                </span>
            </div>
        </div>
    );
}

function RefundDetail({ amount }: { amount: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-red-400 text-sm font-mono font-medium">
                +${amount}
            </span>
            <span className="text-[11px] text-zinc-500">returned to client</span>
        </div>
    );
}

// --- Helpers ---

function getDotColor(type: ContractTimelineEvent['type']): string {
    switch (type) {
        case 'ESCROW_FUNDED': return '#34d399';   // emerald-400
        case 'MILESTONE_RELEASED': return '#60a5fa'; // blue-400
        case 'REFUND': return '#f87171';            // red-400
        default: return '#71717a';
    }
}

function getEventLabel(type: ContractTimelineEvent['type']): string {
    switch (type) {
        case 'ESCROW_FUNDED': return 'Escrow Funded';
        case 'MILESTONE_RELEASED': return 'Milestone Released';
        case 'REFUND': return 'Refund Issued';
        default: return 'Event';
    }
}

function getBadgeBg(type: ContractTimelineEvent['type']): string {
    switch (type) {
        case 'ESCROW_FUNDED': return 'rgba(52,211,153,0.1)';
        case 'MILESTONE_RELEASED': return 'rgba(96,165,250,0.1)';
        case 'REFUND': return 'rgba(248,113,113,0.1)';
        default: return 'rgba(113,113,122,0.1)';
    }
}

function getBadgeColor(type: ContractTimelineEvent['type']): string {
    switch (type) {
        case 'ESCROW_FUNDED': return '#34d399';
        case 'MILESTONE_RELEASED': return '#60a5fa';
        case 'REFUND': return '#f87171';
        default: return '#71717a';
    }
}

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
