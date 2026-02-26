'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    getRecentFinancialMutations,
    getRecentFinancialErrors,
    getWithdrawalSnapshot,
    scanEscrowIntegrity,
} from '@/actions/admin-diagnostic-actions';
import { detectFinancialAnomalies } from '@/actions/admin-anomaly-actions';
import type {
    FinancialMutationRow,
    FinancialErrorRow,
    WithdrawalSnapshot,
    EscrowHealthResult,
} from '@/actions/admin-diagnostic-actions';
import type { AnomalyResult } from '@/actions/admin-anomaly-actions';

// ============================================================================
// Admin Financial Diagnostics Page — Dark Fintech Terminal Style
// ============================================================================

export default function FinancialDiagnosticsPage() {
    const [mutations, setMutations] = useState<FinancialMutationRow[]>([]);
    const [errors, setErrors] = useState<FinancialErrorRow[]>([]);
    const [withdrawalSnap, setWithdrawalSnap] = useState<WithdrawalSnapshot | null>(null);
    const [healthResult, setHealthResult] = useState<EscrowHealthResult | null>(null);
    const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isAnomalyPending, startAnomalyTransition] = useTransition();
    const [expandedError, setExpandedError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [mutRes, errRes, wdRes] = await Promise.all([
                getRecentFinancialMutations(),
                getRecentFinancialErrors(),
                getWithdrawalSnapshot(),
            ]);

            if ('mutations' in mutRes) setMutations(mutRes.mutations);
            if ('errors' in errRes) setErrors(errRes.errors);
            if ('totalPending' in wdRes) setWithdrawalSnap(wdRes);
            setLoading(false);
        }
        load();
    }, []);

    function runHealthCheck() {
        startTransition(async () => {
            const result = await scanEscrowIntegrity();
            if ('totalScanned' in result) setHealthResult(result);
        });
    }

    function runAnomalyScan() {
        startAnomalyTransition(async () => {
            const result = await detectFinancialAnomalies();
            if ('walletNegative' in result) setAnomalyResult(result);
        });
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', color: '#94a3b8', fontFamily: 'monospace', background: '#0B0F14', minHeight: '100vh' }}>
                Loading diagnostics...
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '100%', fontFamily: 'monospace', color: '#e2e8f0', background: '#0B0F14', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
                FINANCIAL DIAGNOSTICS
            </h1>

            {/* Section 1 — Recent Mutations */}
            <Section title="RECENT FINANCIAL MUTATIONS" count={mutations.length}>
                {mutations.length === 0 ? (
                    <EmptyRow>No mutations recorded.</EmptyRow>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
                                <th style={thStyle}>Timestamp</th>
                                <th style={thStyle}>Action</th>
                                <th style={thStyle}>ContractId</th>
                                <th style={thStyle}>MilestoneId</th>
                                <th style={thStyle}>Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mutations.map((m) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={tdStyle}>{formatTime(m.createdAt)}</td>
                                    <td style={{ ...tdStyle, color: actionColor(m.action) }}>{m.action}</td>
                                    <td style={tdMono}>{truncId(m.contractId)}</td>
                                    <td style={tdMono}>{truncId(m.milestoneId)}</td>
                                    <td style={tdStyle}>
                                        <code style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                            {JSON.stringify(m.metadata)}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            {/* Section 2 — Recent Errors */}
            <Section title="RECENT FINANCIAL ERRORS" count={errors.length}>
                {errors.length === 0 ? (
                    <EmptyRow>No errors recorded. ✓</EmptyRow>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
                                <th style={thStyle}>Timestamp</th>
                                <th style={thStyle}>Action</th>
                                <th style={thStyle}>Error</th>
                                <th style={thStyle}>ContractId</th>
                                <th style={thStyle}>Stack</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.map((e) => (
                                <React.Fragment key={e.id}>
                                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={tdStyle}>{formatTime(e.createdAt)}</td>
                                        <td style={{ ...tdStyle, color: '#f87171' }}>{e.action}</td>
                                        <td style={{ ...tdStyle, color: '#fbbf24', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {e.errorMessage}
                                        </td>
                                        <td style={tdMono}>{truncId(e.contractId)}</td>
                                        <td style={tdStyle}>
                                            {e.stackTrace && (
                                                <button
                                                    onClick={() => setExpandedError(expandedError === e.id ? null : e.id)}
                                                    style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem' }}
                                                >
                                                    {expandedError === e.id ? '▼ collapse' : '▶ expand'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedError === e.id && e.stackTrace && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '0.5rem 1rem', background: '#0f172a' }}>
                                                <pre style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0 }}>
                                                    {e.stackTrace}
                                                </pre>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </Section>

            {/* Section 3 — Withdrawal Snapshot */}
            <Section title="WITHDRAWAL SNAPSHOT">
                {withdrawalSnap ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '0.75rem 0' }}>
                        <Stat label="Pending Count" value={String(withdrawalSnap.totalPending)} />
                        <Stat label="Pending Amount" value={`$${withdrawalSnap.totalPendingAmount}`} color="#fbbf24" />
                        <Stat label="Oldest Pending" value={withdrawalSnap.oldestPendingAt ? formatTime(withdrawalSnap.oldestPendingAt) : '—'} />
                    </div>
                ) : (
                    <EmptyRow>No withdrawal data.</EmptyRow>
                )}
            </Section>

            {/* Section 4 — Escrow Health Check */}
            <Section title="ESCROW HEALTH CHECK">
                <div style={{ padding: '0.75rem 0' }}>
                    <button
                        onClick={runHealthCheck}
                        disabled={isPending}
                        style={buttonStyle(isPending)}
                    >
                        {isPending ? 'Scanning...' : 'Run Escrow Health Check'}
                    </button>

                    {healthResult && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.75rem' }}>
                                <Stat label="Scanned" value={String(healthResult.totalScanned)} />
                                <Stat label="Passed" value={String(healthResult.passed)} color="#34d399" />
                                <Stat label="Failed" value={String(healthResult.failed.length)} color={healthResult.failed.length > 0 ? '#f87171' : '#34d399'} />
                            </div>

                            {healthResult.failed.length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
                                            <th style={thStyle}>Escrow ID</th>
                                            <th style={thStyle}>Contract ID</th>
                                            <th style={thStyle}>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {healthResult.failed.map((f, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={tdMono}>{truncId(f.escrowId)}</td>
                                                <td style={tdMono}>{truncId(f.contractId)}</td>
                                                <td style={{ ...tdStyle, color: '#f87171' }}>{f.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {healthResult.failed.length === 0 && (
                                <div style={{ color: '#34d399', fontSize: '0.8rem', padding: '0.5rem 0' }}>
                                    ✓ All escrows passed integrity check.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Section>

            {/* Section 5 — Financial Anomaly Scan */}
            <Section title="FINANCIAL ANOMALY SCAN">
                <div style={{ padding: '0.75rem 0' }}>
                    <button
                        onClick={runAnomalyScan}
                        disabled={isAnomalyPending}
                        style={buttonStyle(isAnomalyPending)}
                    >
                        {isAnomalyPending ? 'Scanning...' : 'Run Anomaly Scan'}
                    </button>

                    {anomalyResult && (
                        <div style={{ marginTop: '1rem' }}>
                            <AnomalyCategory
                                label="Negative Wallets"
                                items={anomalyResult.walletNegative}
                                renderItem={(w) => `Wallet ${truncId(w.walletId)} — User ${truncId(w.userId)} — Available: $${w.available}`}
                            />
                            <AnomalyCategory
                                label="Escrow Mismatches"
                                items={anomalyResult.escrowMismatch}
                                renderItem={(e) => `Escrow ${truncId(e.escrowId)} — Contract ${truncId(e.contractId)}: ${e.error}`}
                            />
                            <AnomalyCategory
                                label="Orphan Platform Fees"
                                items={anomalyResult.orphanPlatformFees}
                                renderItem={(f) => `Milestone ${truncId(f.milestoneId)} — Fee: $${f.platformFee} (no ESCROW_RELEASE)`}
                            />
                            <AnomalyCategory
                                label="Invalid Commission Rates"
                                items={anomalyResult.invalidCommissionContracts}
                                renderItem={(c) => `Contract ${truncId(c.contractId)} — Rate: ${c.commissionRate}`}
                            />
                            <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Duplicate System Users</span>
                                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: anomalyResult.duplicateSystemUsers > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
                                    {anomalyResult.duplicateSystemUsers > 0 ? `FAIL (${anomalyResult.duplicateSystemUsers})` : 'PASS'}
                                </span>
                            </div>

                            {/* Overall verdict */}
                            {(() => {
                                const hasAnomalies = anomalyResult.walletNegative.length > 0 ||
                                    anomalyResult.escrowMismatch.length > 0 ||
                                    anomalyResult.orphanPlatformFees.length > 0 ||
                                    anomalyResult.invalidCommissionContracts.length > 0 ||
                                    anomalyResult.duplicateSystemUsers > 0;
                                return (
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', border: `1px solid ${hasAnomalies ? '#7f1d1d' : '#14532d'}`, color: hasAnomalies ? '#f87171' : '#34d399', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        {hasAnomalies ? '✗ ANOMALIES DETECTED' : '✓ ALL CHECKS PASSED — NO ANOMALIES'}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
    return (
        <div style={{ border: '1px solid #334155', marginBottom: '1.5rem', background: '#0B0F14' }}>
            <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em' }}>{title}</span>
                {count !== undefined && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{count} records</span>
                )}
            </div>
            <div style={{ padding: '0 1rem' }}>
                {children}
            </div>
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: color ?? '#f1f5f9', fontFamily: 'monospace' }}>{value}</div>
        </div>
    );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ padding: '1rem 0', color: '#64748b', fontSize: '0.8rem' }}>
            {children}
        </div>
    );
}

function AnomalyCategory<T>({ label, items, renderItem }: {
    label: string;
    items: T[];
    renderItem: (item: T) => string;
}) {
    const passed = items.length === 0;
    return (
        <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: passed ? 0 : '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label}</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: passed ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {passed ? 'PASS' : `FAIL (${items.length})`}
                </span>
            </div>
            {!passed && items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.7rem', color: '#fbbf24', fontFamily: 'monospace', padding: '0.15rem 0 0.15rem 1rem' }}>
                    {renderItem(item)}
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function truncId(id: string | null): string {
    if (!id) return '—';
    return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function actionColor(action: string): string {
    if (action.includes('RELEASE') || action.includes('APPROVE')) return '#34d399';
    if (action.includes('REFUND') || action.includes('REJECT')) return '#fbbf24';
    if (action.includes('FUND') || action.includes('DEPOSIT')) return '#60a5fa';
    if (action.includes('WITHDRAWAL')) return '#c084fc';
    return '#94a3b8';
}

function buttonStyle(disabled: boolean): React.CSSProperties {
    return {
        padding: '0.5rem 1rem',
        background: disabled ? '#334155' : '#1e293b',
        color: disabled ? '#64748b' : '#60a5fa',
        border: '1px solid #334155',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
    };
}

// ============================================================================
// Inline Styles
// ============================================================================

const thStyle: React.CSSProperties = { padding: '0.5rem 0.75rem', fontWeight: 500, fontSize: '0.7rem' };
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.75rem' };
const tdMono: React.CSSProperties = { ...tdStyle, fontFamily: 'monospace', color: '#64748b', fontSize: '0.7rem' };
