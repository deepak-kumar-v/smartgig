'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getContractEscrowData, ContractEscrowData, MilestoneFinancialState } from '@/actions/escrow-data-actions';
import { getWalletDashboardData } from '@/actions/wallet-actions';
import { fundEscrow, refundEscrow } from '@/actions/escrow-actions';
import { releaseMilestoneFunds } from '@/actions/escrow-release-actions';

// ============================================================================
// Types
// ============================================================================

interface EscrowPanelProps {
    contractId: string;
    contractStatus: string;
    role: 'CLIENT' | 'FREELANCER';
}

// ============================================================================
// Escrow Panel — Sticky Financial Sidebar
// ============================================================================

export default function EscrowPanel({ contractId, contractStatus, role }: EscrowPanelProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [walletData, setWalletData] = useState<{ available: string; locked: string; total: string } | null>(null);
    const [escrowData, setEscrowData] = useState<ContractEscrowData | null>(null);
    const [loading, setLoading] = useState(true);

    const isClient = role === 'CLIENT';

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [wallet, escrow] = await Promise.all([
                getWalletDashboardData(0, 0),
                getContractEscrowData(contractId),
            ]);

            if (!('error' in wallet)) {
                setWalletData({
                    available: wallet.availableBalance,
                    locked: wallet.lockedBalance,
                    total: wallet.totalBalance,
                });
            }
            if (!('error' in escrow)) {
                setEscrowData(escrow);
            }
            setLoading(false);
        }
        load();
    }, [contractId]);

    const handleFundEscrow = () => {
        if (!confirm('Fund escrow now? This will debit your wallet.')) return;
        startTransition(async () => {
            const result = await fundEscrow(contractId);
            if (result.success) {
                toast.success('Escrow Funded');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to fund escrow');
            }
        });
    };

    const handleRefundEscrow = () => {
        if (!confirm('Refund unreleased escrow funds back to wallet?')) return;
        startTransition(async () => {
            const result = await refundEscrow(contractId);
            if (result.success) {
                toast.success('Escrow Refunded');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to refund');
            }
        });
    };

    const handleRelease = (milestoneId: string, title: string) => {
        if (!confirm(`Release funds for "${title}"?`)) return;
        startTransition(async () => {
            const result = await releaseMilestoneFunds(milestoneId);
            if (result.success) {
                toast.success(`Funds released for "${title}"`);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to release funds');
            }
        });
    };

    if (loading) {
        return (
            <div className="rounded-lg border p-6 animate-pulse" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                <div className="h-4 bg-zinc-800 rounded w-24 mb-4" />
                <div className="h-8 bg-zinc-800 rounded w-32 mb-6" />
                <div className="space-y-3">
                    <div className="h-3 bg-zinc-800 rounded" />
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ── 1. Wallet Snapshot ── */}
            {walletData && (
                <div className="rounded-lg border p-5" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                    <h3 className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium mb-4">Wallet</h3>
                    <div className="space-y-3">
                        <Row label="Available" value={`$${parseFloat(walletData.available).toFixed(2)}`} color="text-emerald-400" />
                        <Row label="Locked" value={`$${parseFloat(walletData.locked).toFixed(2)}`} color="text-amber-400" />
                        {!isClient && (
                            <Row label="Total Balance" value={`$${parseFloat(walletData.total).toFixed(2)}`} color="text-white" />
                        )}
                    </div>
                </div>
            )}

            {/* ── 2. Contract Escrow Breakdown ── */}
            {escrowData && (
                <div className="rounded-lg border p-5" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium">Escrow</h3>
                        <EscrowBadge status={escrowData.escrowStatus} />
                    </div>

                    {/* Section 1 — Funding Summary */}
                    <div className="space-y-3 mb-5">
                        <Row label="Total Funded" value={`$${escrowData.totalFunded}`} color="text-white" />
                        <Row label="Currently Locked" value={`$${escrowData.currentlyLocked}`} color="text-amber-400" />
                        <Row label="Total Released" value={`$${escrowData.totalReleased}`} color="text-emerald-400" />
                        <Row label="Total Refunded" value={`$${escrowData.totalRefunded}`} color="text-blue-400" />
                        <div className="pt-2 border-t" style={{ borderColor: '#1E2328' }}>
                            <Row label="Remaining in Escrow" value={`$${escrowData.remaining}`} color="text-white" bold />
                        </div>
                    </div>

                    {/* Section 2 — Commission Breakdown (only if released > 0) */}
                    {parseFloat(escrowData.totalReleased) > 0 && (
                        <div className="mb-5 pt-3 border-t" style={{ borderColor: '#1E2328' }}>
                            <h4 className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3">Commission Breakdown</h4>
                            <div className="space-y-3">
                                <Row label="Platform Revenue" value={`$${escrowData.platformRevenue}`} color="text-amber-400" />
                                <Row label="Freelancer Net Received" value={`$${escrowData.freelancerNetReceived}`} color="text-emerald-400" />
                            </div>
                        </div>
                    )}

                    {/* Section 3 — Per-milestone breakdown */}
                    {escrowData.milestoneLocks.length > 0 && (
                        <div className="pt-3 border-t" style={{ borderColor: '#1E2328' }}>
                            <h4 className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3">Milestones</h4>
                            <div className="space-y-2">
                                {escrowData.milestoneLocks.map(m => (
                                    <div key={m.milestoneId} className="py-2.5 border-b" style={{ borderColor: '#1A1E24' }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <span className="text-[13px] text-zinc-300 truncate block">{m.milestoneTitle}</span>
                                                <FinancialStateBadge state={m.financialState} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] tabular-nums text-zinc-400">${m.lockAmount}</span>
                                                {isClient && !m.released && escrowData.escrowStatus === 'FUNDED' && m.milestoneStatus === 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleRelease(m.milestoneId, m.milestoneTitle)}
                                                        disabled={isPending}
                                                        className="text-[11px] px-2 py-0.5 rounded border transition-colors disabled:opacity-40"
                                                        style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
                                                    >
                                                        Release
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Commission breakdown per milestone */}
                                        {m.released && parseFloat(m.lockAmount) > 0 && parseFloat(escrowData.commissionRate) > 0 && (
                                            <div className="mt-1.5 ml-0 space-y-0.5">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-600">Platform Fee ({(parseFloat(escrowData.commissionRate) * 100).toFixed(0)}%)</span>
                                                    <span className="text-zinc-500 tabular-nums">-${m.platformFee}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-500">Freelancer Receives</span>
                                                    <span className="text-emerald-400/80 tabular-nums">${m.freelancerReceives}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 3. Financial Actions ── */}
            {isClient && (
                <div className="rounded-lg border p-5" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
                    <h3 className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium mb-4">Actions</h3>
                    <div className="space-y-2">
                        {contractStatus === 'FINALIZED' && (
                            <ActionButton
                                label="Fund Escrow"
                                onClick={handleFundEscrow}
                                disabled={isPending}
                                color="#34d399"
                            />
                        )}
                        {escrowData && escrowData.escrowStatus === 'FUNDED' && parseFloat(escrowData.remaining) > 0 && (
                            <ActionButton
                                label="Refund Escrow"
                                onClick={handleRefundEscrow}
                                disabled={isPending}
                                color="#f87171"
                            />
                        )}
                        {(!escrowData || escrowData.escrowStatus === 'PENDING') && contractStatus !== 'FINALIZED' && (
                            <div className="text-[12px] text-zinc-600 text-center py-2">
                                {contractStatus === 'DRAFT' && 'Finalize contract to enable funding'}
                                {contractStatus === 'PENDING_REVIEW' && 'Awaiting freelancer review'}
                                {contractStatus === 'ACCEPTED' && 'Finalize contract to enable funding'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
    return (
        <div className="flex justify-between items-baseline">
            <span className="text-[12px] text-zinc-500">{label}</span>
            <span className={`text-[14px] tabular-nums ${color} ${bold ? 'font-semibold' : ''}`}>{value}</span>
        </div>
    );
}

function EscrowBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
        FUNDED: { bg: 'rgba(52,211,153,0.08)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
        DISPUTED: { bg: 'rgba(248,113,113,0.08)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
        PENDING: { bg: 'rgba(161,161,170,0.08)', text: '#a1a1aa', border: 'rgba(161,161,170,0.25)' },
        RELEASED: { bg: 'rgba(96,165,250,0.08)', text: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
    };
    const s = styles[status] || styles.PENDING;
    return (
        <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
            {status}
        </span>
    );
}

function ActionButton({ label, onClick, disabled, color }: { label: string; onClick: () => void; disabled: boolean; color: string }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors disabled:opacity-40"
            style={{
                color,
                borderColor: `${color}4D`,
                backgroundColor: `${color}14`,
            }}
        >
            {label}
        </button>
    );
}

const FINANCIAL_STATE_STYLES: Record<MilestoneFinancialState, { text: string; border: string; bg: string; label: string }> = {
    NOT_FUNDED: { text: 'text-slate-400', border: '#1E2328', bg: '#111318', label: 'Not Funded' },
    FUNDED: { text: 'text-amber-400', border: 'rgba(251,191,36,0.3)', bg: 'rgba(251,191,36,0.05)', label: 'Funded' },
    RELEASED: { text: 'text-emerald-400', border: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.05)', label: 'Released' },
    REFUNDED: { text: 'text-red-400', border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.05)', label: 'Refunded' },
};

export function FinancialStateBadge({ state }: { state: MilestoneFinancialState }) {
    const s = FINANCIAL_STATE_STYLES[state];
    return (
        <span
            className={`inline-block text-[11px] tracking-widest uppercase px-2 py-1 rounded-sm border mt-1 ${s.text}`}
            style={{ borderColor: s.border, backgroundColor: s.bg }}
        >
            {s.label}
        </span>
    );
}
