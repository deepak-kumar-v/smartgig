'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    contractType?: string;
    role: 'CLIENT' | 'FREELANCER';
}

interface WalletSnapshot {
    available: string;
    locked: string;
    pendingWithdrawals: string;
}

// ============================================================================
// Contract Financial Panel — Strict Role Separation
//
// CLIENT:  Sees gross flows only. Zero commission/platform-fee visibility.
// FREELANCER: Sees commission breakdown. Net earnings. Wallet withdraw info.
// ============================================================================

export default function EscrowPanel({ contractId, contractStatus, contractType, role }: EscrowPanelProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
    const [escrow, setEscrow] = useState<ContractEscrowData | null>(null);
    const [loading, setLoading] = useState(true);

    const isClient = role === 'CLIENT';

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [w, e] = await Promise.all([
                getWalletDashboardData(),
                getContractEscrowData(contractId),
            ]);
            if (!('error' in w)) {
                setWallet({
                    available: w.availableBalance,
                    locked: w.lockedBalance,
                    pendingWithdrawals: w.pendingWithdrawals,
                });
            }
            if (!('error' in e)) {
                setEscrow(e);
            }
            setLoading(false);
        }
        load();
    }, [contractId]);

    // ── Action Handlers ──

    const handleFundEscrow = () => {
        if (!confirm('Fund escrow now? This will debit your wallet.')) return;
        startTransition(async () => {
            const result = await fundEscrow(contractId);
            if (result.success) { toast.success('Escrow Funded'); router.refresh(); }
            else { toast.error(result.error || 'Failed to fund escrow'); }
        });
    };

    const handleRefundEscrow = () => {
        if (!confirm('Refund unreleased escrow funds back to wallet?')) return;
        startTransition(async () => {
            const result = await refundEscrow(contractId);
            if (result.success) { toast.success('Escrow Refunded'); router.refresh(); }
            else { toast.error(result.error || 'Failed to refund'); }
        });
    };

    const handleRelease = (milestoneId: string, title: string) => {
        if (!confirm(`Release funds for "${title}"?`)) return;
        startTransition(async () => {
            const result = await releaseMilestoneFunds(milestoneId);
            if (result.success) { toast.success(`Funds released for "${title}"`); router.refresh(); }
            else { toast.error(result.error || 'Failed to release funds'); }
        });
    };

    // ── Loading ──

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

    // ── Render ──

    return isClient
        ? <ClientPanel wallet={wallet} escrow={escrow} contractStatus={contractStatus} contractType={contractType} isPending={isPending} onFund={handleFundEscrow} onRefund={handleRefundEscrow} onRelease={handleRelease} />
        : <FreelancerPanel wallet={wallet} escrow={escrow} isPending={isPending} />;
}

// ============================================================================
// CLIENT PANEL — Gross flows only. Zero commission visibility.
// ============================================================================

function ClientPanel({
    wallet,
    escrow,
    contractStatus,
    contractType,
    isPending,
    onFund,
    onRefund,
    onRelease,
}: {
    wallet: WalletSnapshot | null;
    escrow: ContractEscrowData | null;
    contractStatus: string;
    contractType?: string;
    isPending: boolean;
    onFund: () => void;
    onRefund: () => void;
    onRelease: (milestoneId: string, title: string) => void;
}) {
    return (
        <div className="space-y-4">
            {/* ── 1. Wallet Snapshot ── */}
            {wallet && (
                <Card title="Wallet Snapshot">
                    <Row label="Available Balance" value={`$${fmt(wallet.available)}`} color="text-emerald-400" hint="Funds you can use to fund contracts or request withdrawal." />
                    <Row label="Locked in Escrow" value={`$${fmt(wallet.locked)}`} color="text-amber-400" hint="Funds currently reserved for active milestones across all contracts. These cannot be used until released." />
                    <Row label="Pending Withdrawal" value={`$${fmt(wallet.pendingWithdrawals)}`} color="text-blue-400" hint="Withdrawal requests that are being processed. These funds are temporarily unavailable." />
                </Card>
            )}

            {/* ── 2. Contract Escrow Summary ── */}
            {escrow && (
                <Card title="Contract Escrow Summary" badge={<EscrowBadge status={escrow.escrowStatus} />}>
                    <Row label="Contract Value" value={`$${escrow.contractValue}`} color="text-white" bold />
                    <Divider />
                    <Row label="Total You Funded" value={`$${escrow.totalFunded}`} color="text-white" />
                    <Row label="Currently in Escrow" value={`$${escrow.currentlyLocked}`} color="text-amber-400" />
                    <Row label="Total Released" value={`$${escrow.totalReleased}`} color="text-emerald-400" />
                    {parseFloat(escrow.totalRefunded) > 0 && (
                        <Row label="Refunded" value={`$${escrow.totalRefunded}`} color="text-blue-400" />
                    )}
                </Card>
            )}

            {/* ── 3. Per-Milestone Breakdown (Gross Only) ── */}
            {escrow && escrow.milestones.length > 0 && (
                <Card title="Milestones">
                    {escrow.milestones.map(m => (
                        <div key={m.milestoneId} className="py-3 border-b" style={{ borderColor: '#1A1E24' }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex-1 min-w-0 mr-3">
                                    <span className="text-[13px] text-zinc-300 truncate block">{m.milestoneTitle}</span>
                                    <FinancialStateBadge state={m.financialState} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] tabular-nums text-zinc-400">${m.lockAmount}</span>
                                    {m.financialState === 'FUNDED' && m.milestoneStatus === 'APPROVED' && (
                                        <button
                                            onClick={() => onRelease(m.milestoneId, m.milestoneTitle)}
                                            disabled={isPending}
                                            className="text-[11px] px-2 py-0.5 rounded border transition-colors disabled:opacity-40"
                                            style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
                                        >
                                            Release
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* ── 4. Actions ── */}
            <Card title="Actions">
                {contractStatus === 'FINALIZED' && contractType !== 'TRIAL' && (
                    <ActionButton label="Fund Escrow" onClick={onFund} disabled={isPending} color="#34d399" />
                )}
                {escrow && escrow.escrowStatus === 'FUNDED' && parseFloat(escrow.currentlyLocked) > 0 && (
                    <div className="text-[11px] text-zinc-500 py-1">Use per-milestone refund on the contract detail page.</div>
                )}
                {(!escrow || escrow.escrowStatus === 'PENDING') && contractStatus !== 'FINALIZED' && (
                    <StatusHint status={contractStatus} />
                )}
            </Card>
        </div>
    );
}

// ============================================================================
// FREELANCER PANEL — Commission breakdown visible. Net earnings.
// ============================================================================

function FreelancerPanel({
    wallet,
    escrow,
}: {
    wallet: WalletSnapshot | null;
    escrow: ContractEscrowData | null;
    isPending: boolean;
}) {
    const commissionPct = escrow ? `${(parseFloat(escrow.commissionRate) * 100).toFixed(0)}%` : '—';

    return (
        <div className="space-y-4">
            {/* ── 1. Wallet Snapshot ── */}
            {wallet && (
                <Card title="Wallet Snapshot">
                    <Row label="Available to Withdraw" value={`$${fmt(wallet.available)}`} color="text-emerald-400" bold />
                    <Row label="Pending Withdrawal" value={`$${fmt(wallet.pendingWithdrawals)}`} color="text-orange-400" />
                    <Row label="Locked in Escrow" value={`$${fmt(wallet.locked)}`} color="text-amber-400" />
                </Card>
            )}

            {/* ── 2. Earnings Summary ── */}
            {escrow && (
                <Card title="Earnings Summary" badge={<EscrowBadge status={escrow.escrowStatus} />}>
                    <Row label="Total Milestone Value" value={`$${escrow.totalFunded}`} color="text-white" />
                    <Row label={`Platform Commission (${commissionPct})`} value={`-$${escrow.platformFeesPaid}`} color="text-orange-400" />
                    <Divider />
                    <Row label="Net Earnings (You Received)" value={`$${escrow.releasedToFreelancer}`} color="text-emerald-400" bold />
                    {parseFloat(escrow.currentlyLocked) > 0 && (
                        <Row label="Pending in Escrow" value={`$${escrow.currentlyLocked}`} color="text-amber-400" />
                    )}
                </Card>
            )}

            {/* ── 3. Per-Milestone Earnings Breakdown ── */}
            {escrow && escrow.milestones.length > 0 && (
                <Card title="Milestone Earnings">
                    {escrow.milestones.map(m => (
                        <div key={m.milestoneId} className="py-3 border-b" style={{ borderColor: '#1A1E24' }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex-1 min-w-0 mr-3">
                                    <span className="text-[13px] text-zinc-300 truncate block">{m.milestoneTitle}</span>
                                    <FinancialStateBadge state={m.financialState} />
                                </div>
                                <span className="text-[13px] tabular-nums text-zinc-400">${m.lockAmount}</span>
                            </div>

                            {m.financialState === 'RELEASED' && (
                                <div className="mt-1.5 space-y-0.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-zinc-600">Gross Amount</span>
                                        <span className="text-zinc-400 tabular-nums">${m.lockAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-zinc-600">Platform Commission ({commissionPct})</span>
                                        <span className="text-orange-400/80 tabular-nums">-${m.platformFee}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-zinc-500">Net Received</span>
                                        <span className="text-emerald-400/80 tabular-nums">${m.freelancerReceived}</span>
                                    </div>
                                </div>
                            )}

                            {m.financialState === 'FUNDED' && (
                                <div className="text-[11px] text-zinc-600 mt-1">Awaiting release</div>
                            )}

                            {m.financialState === 'NOT_FUNDED' && (
                                <div className="text-[11px] text-zinc-600 mt-1">No escrow created</div>
                            )}

                            {m.financialState === 'REFUNDED' && (
                                <div className="flex justify-between text-[11px] mt-1">
                                    <span className="text-zinc-500">Refunded</span>
                                    <span className="text-blue-400/80 tabular-nums">${m.refundedAmount}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </Card>
            )}

            {/* ── 4. Actions ── */}
            <Card title="Actions">
                <Link
                    href="/freelancer/wallet"
                    className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors"
                    style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', backgroundColor: 'rgba(52,211,153,0.08)' }}
                >
                    Go to Wallet
                </Link>
                <Link
                    href="/freelancer/wallet/withdraw"
                    className="block w-full text-center text-[14px] font-medium px-4 py-2.5 rounded border transition-colors mt-2"
                    style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', backgroundColor: 'rgba(167,139,250,0.08)' }}
                >
                    Withdraw Funds
                </Link>
            </Card>
        </div>
    );
}

// ============================================================================
// Shared Sub-components
// ============================================================================

function fmt(v: string): string {
    return parseFloat(v).toFixed(2);
}

function Card({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border p-5" style={{ backgroundColor: '#111318', borderColor: '#1E2328' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[12px] text-zinc-500 uppercase tracking-widest font-medium">{title}</h3>
                {badge}
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Row({ label, value, color, bold, hint }: { label: string; value: string; color: string; bold?: boolean; hint?: string }) {
    return (
        <div className="mb-1">
            <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-zinc-500">{label}</span>
                <span className={`text-[14px] tabular-nums ${color} ${bold ? 'font-semibold' : ''}`}>{value}</span>
            </div>
            {hint && <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{hint}</p>}
        </div>
    );
}

function Divider() {
    return <div className="border-t my-1" style={{ borderColor: '#1E2328' }} />;
}

function EscrowBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
        FUNDED: { bg: 'rgba(52,211,153,0.08)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
        DISPUTED: { bg: 'rgba(248,113,113,0.08)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
        PENDING: { bg: 'rgba(161,161,170,0.08)', text: '#a1a1aa', border: 'rgba(161,161,170,0.25)' },
        CLOSED: { bg: 'rgba(96,165,250,0.08)', text: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
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
            style={{ color, borderColor: `${color}4D`, backgroundColor: `${color}14` }}
        >
            {label}
        </button>
    );
}

function StatusHint({ status }: { status: string }) {
    const messages: Record<string, string> = {
        DRAFT: 'Finalize contract to enable funding',
        PENDING_REVIEW: 'Awaiting freelancer review',
        ACCEPTED: 'Finalize contract to enable funding',
    };
    const msg = messages[status];
    if (!msg) return null;
    return <div className="text-[12px] text-zinc-600 text-center py-2">{msg}</div>;
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
