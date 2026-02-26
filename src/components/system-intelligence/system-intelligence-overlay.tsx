'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    resolveWithInheritance,
    getVisibleTabs,
    SYSTEM_INTELLIGENCE_VERSION,
    classifyVersionDrift,
} from '@/system/intelligence-registry';
import type { IntelligenceTab, PageIntelligenceMeta, VersionDrift } from '@/system/intelligence-registry';

// ============================================================================
// System Intelligence Overlay — Domain-Isolated, Version-Governed
// ============================================================================

const TAB_LABELS: Record<IntelligenceTab, string> = {
    CURRENT_PAGE: 'Current Page',
    FINANCIAL_CORE: 'Financial Core',
    ATTACK_DEFENSE: 'Attack Defense',
    TRANSACTION_MAP: 'Transaction Map',
    OPERATIONAL_HARDENING: 'Operational Hardening',
    REVENUE_MODEL: 'Revenue Model',
    SYSTEM_DIAGRAMS: 'System Diagrams',
    SCALE_HARDENING: 'Scale Hardening',
};

export default function SystemIntelligenceOverlay({ onClose }: { onClose: () => void }) {
    const pathname = usePathname();
    const meta = resolveWithInheritance(pathname);
    const visibleTabs = meta ? getVisibleTabs(meta) : (['CURRENT_PAGE'] as IntelligenceTab[]);
    const [activeIdx, setActiveIdx] = useState(0);

    // Drift detection
    const drift: VersionDrift | null = meta
        ? classifyVersionDrift(meta.version, SYSTEM_INTELLIGENCE_VERSION)
        : null;
    const hasDrift = drift !== null && drift !== 'IN_SYNC';

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;
        if (!meta) {
            console.warn(
                `[System Intelligence] ⚠ No metadata registered for route: ${pathname}\n` +
                `Register in src/system/intelligence-registry.ts`
            );
            return;
        }
        if (hasDrift) {
            console.warn(
                `[System Intelligence Drift] ${meta.route} v${meta.version} → system v${SYSTEM_INTELLIGENCE_VERSION} | ${drift}`
            );
        }
    }, [pathname, meta, hasDrift, drift]);

    const activeTab = visibleTabs[activeIdx] ?? 'CURRENT_PAGE';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(11, 15, 20, 0.97)',
            color: '#e2e8f0', fontFamily: 'monospace',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.08em' }}>SYSTEM INTELLIGENCE</span>
                    {meta && <span style={{ fontSize: '0.65rem', color: '#475569', marginLeft: '0.75rem' }}>v{meta.version} · {meta.domain}</span>}
                    <span style={{ fontSize: '0.6rem', color: '#334155', marginLeft: '0.75rem' }}>Ctrl+Shift+I / ESC</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '0.25rem 0.75rem', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    ✕ CLOSE
                </button>
            </div>

            {/* Tabs — Metadata-Driven */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', flexShrink: 0, overflowX: 'auto' }}>
                {visibleTabs.map((tab, i) => (
                    <button key={tab} onClick={() => setActiveIdx(i)} style={{
                        padding: '0.625rem 1rem', background: 'none', border: 'none',
                        borderBottom: activeIdx === i ? '2px solid #60a5fa' : '2px solid transparent',
                        color: activeIdx === i ? '#60a5fa' : '#64748b',
                        cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem',
                        fontWeight: activeIdx === i ? 600 : 400, whiteSpace: 'nowrap', letterSpacing: '0.04em',
                    }}>
                        {TAB_LABELS[tab].toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Drift Banner — Development Only */}
            {hasDrift && process.env.NODE_ENV === 'development' && meta && (
                <DriftBanner route={meta.route} pageVersion={meta.version} drift={drift} />
            )}

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
                {activeTab === 'CURRENT_PAGE' && <SectionCurrentPage meta={meta} pathname={pathname} />}
                {activeTab === 'FINANCIAL_CORE' && meta?.financialCore && <SectionFinancialCore meta={meta} />}
                {activeTab === 'ATTACK_DEFENSE' && meta?.attackDefense && <SectionAttackDefense items={meta.attackDefense} />}
                {activeTab === 'TRANSACTION_MAP' && meta?.transactionMap && <SectionTransactionMap items={meta.transactionMap} />}
                {activeTab === 'OPERATIONAL_HARDENING' && meta?.operationalHardening && <SectionList title="OPERATIONAL HARDENING" items={meta.operationalHardening} color="#fbbf24" />}
                {activeTab === 'REVENUE_MODEL' && meta?.revenueModel && <SectionList title="REVENUE MODEL" items={meta.revenueModel} color="#34d399" />}
                {activeTab === 'SCALE_HARDENING' && meta?.scaleHardening && <SectionList title="SCALE HARDENING" items={meta.scaleHardening} color="#60a5fa" />}
                {activeTab === 'SYSTEM_DIAGRAMS' && <SectionDiagrams meta={meta} />}
            </div>
        </div>
    );
}

// ============================================================================
// CURRENT PAGE — Deep, Metadata-Driven
// ============================================================================

function SectionCurrentPage({ meta, pathname }: { meta: PageIntelligenceMeta | null; pathname: string }) {
    if (!meta) {
        return (
            <div>
                <SectionTitle>CURRENT PAGE</SectionTitle>
                <div style={{ border: '1px solid #7f1d1d', padding: '1rem', color: '#f87171', fontSize: '0.8rem' }}>
                    ⚠ No intelligence metadata registered for route: <code style={{ color: '#fbbf24' }}>{pathname}</code>
                    <br /><br />
                    This page violates System Intelligence standards.
                    <br />
                    Register metadata in <code style={{ color: '#60a5fa' }}>src/system/intelligence-registry.ts</code>
                </div>
            </div>
        );
    }

    const cp = meta.currentPage;

    return (
        <div>
            <SectionTitle>CURRENT PAGE — {meta.route}</SectionTitle>
            <InfoRow label="Domain" value={meta.domain} accent="#60a5fa" />
            <InfoRow label="Version" value={meta.version} />
            <InfoRow label="Updated" value={meta.lastUpdated} />
            <InfoRow label="Description" value={meta.description} />

            {cp?.capabilities && <TagList title="CAPABILITIES" items={cp.capabilities} color="#34d399" />}
            {cp?.features && <TagList title="FEATURES" items={cp.features} color="#60a5fa" />}
            {cp?.safeguards && <TagList title="SAFEGUARDS" items={cp.safeguards} color="#fbbf24" />}
            {cp?.edgeCases && <TagList title="EDGE CASES" items={cp.edgeCases} color="#94a3b8" />}
            {cp?.accessControl && <TagList title="ACCESS CONTROL" items={cp.accessControl} color="#34d399" />}
            {cp?.stateManagement && <TagList title="STATE MANAGEMENT" items={cp.stateManagement} color="#22d3ee" />}
            {cp?.dependencies && <TagList title="DEPENDENCIES" items={cp.dependencies} color="#64748b" />}
        </div>
    );
}

// ============================================================================
// FINANCIAL CORE — From Metadata
// ============================================================================

function SectionFinancialCore({ meta }: { meta: PageIntelligenceMeta }) {
    const fc = meta.financialCore;
    if (!fc) return null;

    return (
        <div>
            <SectionTitle>FINANCIAL CORE</SectionTitle>
            {fc.concurrencyModel && <InfoRow label="Concurrency" value={fc.concurrencyModel} accent="#c084fc" />}
            {fc.invariants && <TagList title="INVARIANTS" items={fc.invariants} color="#f87171" />}
            {fc.safeguards && <TagList title="SAFEGUARDS" items={fc.safeguards} color="#fbbf24" />}
        </div>
    );
}

// ============================================================================
// ATTACK DEFENSE — From Metadata
// ============================================================================

function SectionAttackDefense({ items }: { items: string[] }) {
    return (
        <div>
            <SectionTitle>ATTACK DEFENSE</SectionTitle>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '1rem' }}>{items.length} defense(s) documented.</div>
            {items.map((item, i) => (
                <div key={i} style={{ border: '1px solid #1e293b', marginBottom: '0.5rem', padding: '0.625rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '0.72rem' }}>{item}</span>
                        <span style={{ color: '#34d399', fontSize: '0.6rem', flexShrink: 0, marginLeft: '1rem' }}>DEFENDED</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// TRANSACTION MAP — From Metadata
// ============================================================================

function SectionTransactionMap({ items }: { items: string[] }) {
    return (
        <div>
            <SectionTitle>TRANSACTION MAP</SectionTitle>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '1rem' }}>{items.length} transaction(s) mapped.</div>
            {items.map((item, i) => {
                const parts = item.split(':');
                const name = parts[0]?.trim() ?? '';
                const detail = parts.slice(1).join(':').trim();
                return (
                    <div key={i} style={{ border: '1px solid #1e293b', marginBottom: '0.5rem', padding: '0.625rem 1rem' }}>
                        <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem' }}>{name}</div>
                        {detail && <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{detail}</div>}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// GENERIC LIST SECTION (Operational Hardening, Revenue Model, Scale Hardening)
// ============================================================================

function SectionList({ title, items, color }: { title: string; items: string[]; color: string }) {
    return (
        <div>
            <SectionTitle>{title}</SectionTitle>
            {items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.72rem', color, padding: '0.3rem 0 0.3rem 0.75rem', borderLeft: `2px solid ${color}30`, marginBottom: '0.15rem' }}>
                    {item}
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// SYSTEM DIAGRAMS — Global + Page-Level
// ============================================================================

function SectionDiagrams({ meta }: { meta: PageIntelligenceMeta | null }) {
    const hasPageDiagram = meta?.systemDiagrams?.ascii;

    return (
        <div>
            <SectionTitle>SYSTEM DIAGRAMS</SectionTitle>

            {hasPageDiagram && (
                <SubSection title={`Page: ${meta?.route ?? 'unknown'}`}>
                    <pre style={preStyle}>{meta?.systemDiagrams?.ascii}</pre>
                </SubSection>
            )}

            {!hasPageDiagram && (
                <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem 0', marginBottom: '1rem' }}>
                    No page-level diagram registered.
                </div>
            )}

            <SubSection title="Financial Flow (Global)">
                <pre style={preStyle}>{`
┌──────────────┐     DEPOSIT      ┌──────────────┐
│   External   │ ────────────────▶│   Wallet     │
│   Payment    │                  │   Ledger     │
└──────────────┘                  │  (+amount)   │
                                  └──────┬───────┘
                                         │
                              ESCROW_LOCK │ (negative entry)
                                         ▼
                                  ┌──────────────┐
                                  │   Escrow     │
                                  │   Account    │
                                  └──────┬───────┘
                                         │
                        ┌────────────────┼────────────────┐
                   RELEASE          PLATFORM_FEE      REFUND
                        ▼                ▼                ▼
                 ┌────────────┐  ┌────────────┐  ┌────────────┐
                 │ Freelancer │  │  Platform   │  │   Client   │
                 │  (+payout) │  │ (+commission│  │  (+refund) │
                 └────────────┘  └────────────┘  └────────────┘`}</pre>
            </SubSection>

            <SubSection title="Transaction Boundary (Global)">
                <pre style={preStyle}>{`
┌─────────────────────────────────────────────────┐
│           db.$transaction (Serializable)         │
│                                                  │
│  1. Re-fetch entity inside tx                    │
│  2. Assert preconditions                         │
│  3. Perform ledger writes                        │
│  4. Assert postconditions (available >= 0)       │
│  5. Run assertEscrowIntegrity                    │
│  6. Append FinancialMutationLog                  │
│                                                  │
│  On throw → FULL ROLLBACK                        │
└─────────────────────────────────────────────────┘
         │ on error
         ▼
FinancialErrorLog.create (fire-and-forget)`}</pre>
            </SubSection>

            <SubSection title="Ledger Model (Global)">
                <pre style={preStyle}>{`
 WalletLedger (append-only, never mutated)
 ┌─────┬────────────────┬──────────┬────────────┐
 │ ID  │ Type           │ Amount   │ MilestoneId│
 ├─────┼────────────────┼──────────┼────────────┤
 │ 1   │ DEPOSIT        │ +500.00  │ null       │
 │ 2   │ ESCROW_LOCK    │ -300.00  │ null       │
 │ 3   │ ESCROW_RELEASE │ +270.00  │ m_001      │
 │ 4   │ PLATFORM_FEE   │ +30.00   │ m_001      │
 │ 5   │ WITHDRAWAL     │ -200.00  │ null       │
 └─────┴────────────────┴──────────┴────────────┘
 Balance = SUM(amount). No UPDATE. No DELETE.`}</pre>
            </SubSection>
        </div>
    );
}

// ============================================================================
// Drift Banner — Development Mode Only
// ============================================================================

const DRIFT_COLORS: Record<VersionDrift, string> = {
    MAJOR_ARCHITECTURAL_DRIFT: '#ef4444',
    MINOR_FEATURE_DRIFT: '#f59e0b',
    PATCH_DOCUMENTATION_DRIFT: '#64748b',
    AHEAD_OF_SYSTEM: '#818cf8',
    IN_SYNC: '#34d399',
};

function DriftBanner({ route, pageVersion, drift }: { route: string; pageVersion: string; drift: VersionDrift }) {
    const color = DRIFT_COLORS[drift];
    return (
        <div style={{
            padding: '0.5rem 1.5rem',
            borderBottom: `1px solid ${color}40`,
            background: `${color}08`,
            fontSize: '0.68rem',
            fontFamily: 'monospace',
            color,
            flexShrink: 0,
        }}>
            ⚠ DRIFT DETECTED — {route} v{pageVersion} → system v{SYSTEM_INTELLIGENCE_VERSION} — {drift.replace(/_/g, ' ')}
        </div>
    );
}

// ============================================================================
// Reusable Primitives
// ============================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1rem', letterSpacing: '0.08em', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>{children}</h2>;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>{title}</h3>
            {children}
        </div>
    );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div style={{ display: 'flex', padding: '0.35rem 0', borderBottom: '1px solid #0f172a', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b', width: '120px', flexShrink: 0 }}>{label}</span>
            <span style={{ color: accent ?? '#e2e8f0' }}>{value}</span>
        </div>
    );
}

function TagList({ title, items, color }: { title: string; items: string[]; color: string }) {
    if (items.length === 0) return null;
    return (
        <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{title}</div>
            {items.map((item, i) => (
                <div key={i} style={{ fontSize: '0.72rem', color, padding: '0.2rem 0 0.2rem 0.75rem', borderLeft: `2px solid ${color}30` }}>
                    {item}
                </div>
            ))}
        </div>
    );
}

const preStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.5, padding: '0.75rem', border: '1px solid #1e293b', overflow: 'auto', margin: 0 };
