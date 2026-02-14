'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Send, FileText, Eye, CheckCircle, Shield, DollarSign,
    Zap, Flag, XCircle, AlertTriangle, ArrowUpCircle, ArrowLeft, Clock,
    User, Info, ExternalLink, Layers, Activity
} from 'lucide-react';
import Link from 'next/link';
import {
    PhaseInfoPanel, MasterPhase, MASTER_PHASES, PHASE_INDEX,
} from './phase-info-panel';
import { evaluateLifecycleHealth, type HealthResult } from './utils/lifecycle-health';
import { computePhaseDurations, type PhaseDuration } from './utils/phase-duration';
import { StateMachineGraph } from './state-machine-graph';
import { detectDeadlocks, type DeadlockResult } from './utils/deadlock-detector';
import { FinancialStrip } from './financial-strip';
import { InteractionAnalytics } from './interaction-analytics';
import { TrialUpgradeConnector } from './trial-upgrade-connector';
import { calculateDisputeRisk, type DisputeRiskResult } from './utils/dispute-risk';
import { computeResponsiveness, type ResponsivenessResult } from './utils/responsiveness-index';
import { computeBurnRate, type BurnRateResult } from './utils/burn-rate';
import { computeReliabilityScore, type ReliabilityResult } from './utils/reliability-score';
import { DisputeRiskMeter } from './dispute-risk-meter';
import { ResponsivenessBar } from './responsiveness-bar';
import { BurnRateCard } from './burn-rate-card';
import { ReliabilityBadge } from './reliability-badge';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LifecycleEvent {
    id: string;
    jobId?: string | null;
    proposalId?: string | null;
    contractId?: string | null;
    milestoneId?: string | null;
    eventType: string;
    devState?: string | null;
    userMessage: string;
    actorId?: string | null;
    actorRole: 'CLIENT' | 'FREELANCER' | 'SYSTEM';
    metadata?: Record<string, unknown> | null;
    category?: string;
    createdAt: string;
}

interface ContractSummary {
    id: string; proposalId: string; status: string; type: string; title: string; totalBudget: number;
}

interface PrimaryContract {
    id: string; status: string; type: string; title: string;
}

interface FinancialData {
    totalBudget: number;
    totalDeposited: number;
    totalReleased: number;
    balance: number;
}

interface InteractionCounts {
    messages: number;
    edits: number;
    changeRequests: number;
    disputes: number;
}

interface APIResponse {
    job: { id: string; title: string; status: string; category: string };
    proposals: { id: string; status: string; freelancerName: string | null }[];
    contracts: ContractSummary[];
    primaryContract: PrimaryContract | null;
    events: LifecycleEvent[];
    role: 'CLIENT' | 'FREELANCER';
    clientName: string;
    freelancerName: string;
    financialData: FinancialData | null;
    interactionCounts: InteractionCounts;
}

interface JobControlCenterProps {
    jobId: string;
    jobTitle: string;
    role: 'CLIENT' | 'FREELANCER';
}

// ═══════════════════════════════════════════════════════════════════════════
// DETERMINISTIC PHASE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapToMasterPhase(
    contractStatus: string | null, contractType?: string | null,
    hasProposals?: boolean, hasContracts?: boolean,
): MasterPhase {
    if (!hasContracts && !hasProposals) return 'JOB';
    if (hasProposals && !hasContracts) return 'PROPOSAL';
    if (!contractStatus) return 'PROPOSAL';
    if (contractType === 'TRIAL' && ['DRAFT', 'PENDING_REVIEW', 'ACCEPTED'].includes(contractStatus)) return 'TRIAL';
    switch (contractStatus) {
        case 'DRAFT': case 'PENDING_REVIEW': case 'ACCEPTED': return 'CONTRACT';
        case 'FINALIZED': return 'FUNDING';
        case 'FUNDED': case 'ACTIVE': return 'ACTIVE';
        case 'COMPLETED': return 'COMPLETED';
        default: return 'CLOSED';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const PHASE_ICONS: Record<MasterPhase, React.ElementType> = {
    JOB: Briefcase, PROPOSAL: Send, TRIAL: Zap, CONTRACT: FileText,
    FUNDING: DollarSign, ACTIVE: Zap, COMPLETED: Flag, CLOSED: XCircle,
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    JOB_POSTED: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    PROPOSAL_SENT: { icon: Send, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    CONTRACT_DRAFTED: { icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    SENT_FOR_REVIEW: { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    CHANGES_REQUESTED: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    CONTRACT_ACCEPTED: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    CONTRACT_FINALIZED: { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    CONTRACT_REJECTED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    TRIAL_APPROVED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    TRIAL_REJECTED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    DISPUTE_RAISED: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    TRIAL_UPGRADED: { icon: ArrowUpCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    // Phase 1 - Transparency events
    CHAT_CREATED: { icon: Activity, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    FIRST_MESSAGE_SENT: { icon: Send, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
    CONTRACT_EDITED: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    // Future-ready milestone/escrow events
    MILESTONE_CREATED: { icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    MILESTONE_FUNDED: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    MILESTONE_SUBMITTED: { icon: Send, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    MILESTONE_APPROVED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    ESCROW_RELEASED: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
};

const EVENT_TITLES: Record<string, string> = {
    JOB_POSTED: 'Job Published', PROPOSAL_SENT: 'Proposal Submitted',
    CONTRACT_DRAFTED: 'Contract Drafted', SENT_FOR_REVIEW: 'Sent for Review',
    CHANGES_REQUESTED: 'Changes Requested', CONTRACT_ACCEPTED: 'Contract Accepted',
    CONTRACT_FINALIZED: 'Contract Finalized', CONTRACT_REJECTED: 'Contract Rejected',
    TRIAL_APPROVED: 'Trial Approved', TRIAL_REJECTED: 'Trial Rejected',
    DISPUTE_RAISED: 'Dispute Raised', TRIAL_UPGRADED: 'Upgraded to Standard',
    // Phase 1 - Transparency events
    CHAT_CREATED: 'Chat Channel Opened', FIRST_MESSAGE_SENT: 'First Message Sent',
    CONTRACT_EDITED: 'Contract Edited',
    // Future-ready
    MILESTONE_CREATED: 'Milestone Created', MILESTONE_FUNDED: 'Milestone Funded',
    MILESTONE_SUBMITTED: 'Milestone Submitted', MILESTONE_APPROVED: 'Milestone Approved',
    ESCROW_RELEASED: 'Escrow Released',
};

function getEventCfg(t: string) { return EVENT_CONFIG[t] || { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/20' }; }
function friendlyTitle(t: string) { return EVENT_TITLES[t] || t.replace(/_/g, ' '); }
function fmtTime(d: string) { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

function friendlyStatus(s: string | null, role: 'CLIENT' | 'FREELANCER', cn: string, fn: string): string {
    if (!s) return 'Lifecycle in progress';
    const m: Record<string, [string, string]> = {
        DRAFT: ['You are drafting the contract', `Waiting for ${cn} to prepare contract`],
        PENDING_REVIEW: [`Awaiting ${fn} to review and accept`, 'Review the contract and accept or request changes'],
        ACCEPTED: ['Finalize the contract to proceed', `Waiting for ${cn} to finalize`],
        FINALIZED: ['Fund the escrow to activate work', `Waiting for ${cn} to fund escrow`],
        FUNDED: ['Contract funded — work begins now', 'Contract funded — start delivering'],
        ACTIVE: [`${fn} is actively working on deliverables`, 'Deliver milestones and track progress'],
        COMPLETED: ['All work completed successfully', 'Project completed — payment processed'],
        CLOSED: ['Contract closed', 'Contract closed'],
        REJECTED: [`${fn} rejected the contract`, 'You rejected this contract'],
        DISPUTED: ['Dispute is under review by support', 'Your dispute is being reviewed'],
        CANCELLED: ['This contract was cancelled', 'This contract was cancelled'],
    };
    const e = m[s]; return e ? (role === 'CLIENT' ? e[0] : e[1]) : s;
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO HEADER
// ═══════════════════════════════════════════════════════════════════════════

function HeroHeader({ jobTitle, contractType, devState, role, statusText, health }: {
    jobTitle: string; contractType: string | null; devState: string | null;
    role: 'CLIENT' | 'FREELANCER'; statusText: string; health: HealthResult;
}) {
    const healthCfg = {
        HEALTHY: { emoji: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: '0 0 20px rgba(52,211,153,0.25)' },
        AT_RISK: { emoji: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: '0 0 20px rgba(251,191,36,0.25)' },
        BLOCKED: { emoji: '🔴', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: '0 0 20px rgba(248,113,113,0.25)' },
    }[health.level];

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-2xl mb-12">
            {/* Animated celestial backdrop */}
            <div className="absolute inset-0 opacity-30">
                <motion.div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.2) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(139,92,246,0.12) 0%, transparent 60%)',
                }} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            {/* Starfield shimmer */}
            <div className="absolute inset-0 overflow-hidden opacity-20">
                {[...Array(12)].map((_, i) => (
                    <motion.div key={i} className="absolute w-[2px] h-[2px] bg-white rounded-full"
                        style={{ left: `${8 + i * 8}%`, top: `${15 + (i % 3) * 25}%` }}
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }} />
                ))}
            </div>
            <div className="relative glass-panel rounded-2xl p-10 md:p-12 border-white/5">
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                    {contractType && (
                        <span className={`text-xs px-3 py-1 rounded-full border font-semibold tracking-widest uppercase ${contractType === 'TRIAL' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}>{contractType === 'TRIAL' ? 'Paid Trial' : 'Standard'}</span>
                    )}
                    {devState && (
                        <motion.span animate={{ boxShadow: ['0 0 8px rgba(99,102,241,0.3)', '0 0 24px rgba(99,102,241,0.6)', '0 0 8px rgba(99,102,241,0.3)'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono uppercase tracking-wider">
                            {devState}
                        </motion.span>
                    )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{jobTitle}</h1>
                <p className="text-lg text-zinc-300 mb-6 max-w-3xl leading-relaxed">{statusText}</p>

                {/* Health Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className={`inline-flex items-center gap-4 px-6 py-3 rounded-xl border ${healthCfg.bg} ${healthCfg.border} mb-6`}
                    style={{ boxShadow: healthCfg.glow }}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">{healthCfg.emoji}</span>
                        <div>
                            <span className={`text-sm font-bold uppercase tracking-wider ${healthCfg.color}`}>
                                {health.level.replace('_', ' ')}
                            </span>
                            <p className="text-xs text-zinc-400 mt-0.5 max-w-md">{health.reason}</p>
                        </div>
                    </div>
                    <Activity className={`w-4 h-4 ${healthCfg.color} opacity-60`} />
                </motion.div>

                <div className="block" />
                <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border ${role === 'CLIENT' ? 'bg-cyan-500/5 border-cyan-500/15' : 'bg-purple-500/5 border-purple-500/15'
                    }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${role === 'CLIENT' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                        }`}>
                        <User className={`w-3.5 h-3.5 ${role === 'CLIENT' ? 'text-cyan-400' : 'text-purple-400'}`} />
                    </div>
                    <span className="text-sm text-zinc-400">Viewing as{' '}
                        <span className={`font-semibold ${role === 'CLIENT' ? 'text-cyan-400' : 'text-purple-400'}`}>
                            {role === 'CLIENT' ? 'Client' : 'Freelancer'}
                        </span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER LIFECYCLE BAR + ORB
// ═══════════════════════════════════════════════════════════════════════════

function MasterLifecycleBar({ currentPhase, onOpenInfo }: { currentPhase: MasterPhase; onOpenInfo: (p: MasterPhase) => void }) {
    const currentIdx = PHASE_INDEX[currentPhase];
    const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [orbX, setOrbX] = useState<number | null>(null);

    useEffect(() => {
        const update = () => {
            const c = containerRef.current; const el = phaseRefs.current[currentIdx];
            if (c && el) {
                const cr = c.getBoundingClientRect(); const er = el.getBoundingClientRect();
                setOrbX(er.left - cr.left + er.width / 2);
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [currentIdx]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }} className="glass-panel rounded-2xl p-8 md:p-10 mb-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">Lifecycle Phases</h2>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /> Past</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Current</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-700" /> Future</span>
                </div>
            </div>
            <div ref={containerRef} className="relative flex items-center gap-0 pb-3">
                {/* Framer Motion Spring Orb */}
                {orbX !== null && (
                    <motion.div className="absolute z-10 pointer-events-none" style={{ top: '-12px' }}
                        animate={{ x: orbX - 14 }} transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 1 }}>
                        <motion.div className="w-7 h-7 rounded-full" style={{
                            background: 'radial-gradient(circle, rgba(129,140,248,0.9) 0%, rgba(99,102,241,0.4) 40%, transparent 70%)',
                        }} animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                    </motion.div>
                )}

                {MASTER_PHASES.map((phase, i) => {
                    const Icon = PHASE_ICONS[phase];
                    const isPast = i < currentIdx;
                    const isCurr = i === currentIdx;
                    return (
                        <React.Fragment key={phase}>
                            <motion.div ref={(el) => { phaseRefs.current[i] = el; }}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.06, duration: 0.3 }}
                                className="flex flex-col items-center min-w-[90px] md:min-w-[110px] relative">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative ${isCurr ? 'bg-indigo-500/25 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.5)]'
                                    : isPast ? 'bg-emerald-500/15 border-emerald-500/40'
                                        : 'bg-zinc-900/50 border-zinc-800/40'
                                    }`}>
                                    {isCurr && <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-400/40"
                                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />}
                                    <Icon className={`w-5 h-5 ${isCurr ? 'text-indigo-300' : isPast ? 'text-emerald-400' : 'text-zinc-700'}`} />
                                </div>
                                <span className={`text-xs mt-3 font-medium whitespace-nowrap ${isCurr ? 'text-indigo-300' : isPast ? 'text-emerald-400/80' : 'text-zinc-700'
                                    }`}>{phase}</span>
                                <button onClick={() => onOpenInfo(phase)}
                                    className="mt-2 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                                    aria-label={`Info about ${phase}`}>
                                    <Info className="w-3 h-3 text-zinc-500" />
                                </button>
                            </motion.div>
                            {i < MASTER_PHASES.length - 1 && (
                                <div className="flex-1 min-w-[16px] md:min-w-[28px] h-[2px] mt-[-34px] relative">
                                    <div className="absolute inset-0 bg-zinc-900 rounded-full" />
                                    {isPast && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                                        transition={{ delay: i * 0.06 + 0.15, duration: 0.4 }}
                                        className="absolute inset-0 bg-gradient-to-r from-emerald-500/50 to-emerald-500/20 rounded-full origin-left" />}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE NODE
// ═══════════════════════════════════════════════════════════════════════════

function TimelineNode({ event, index, isLast, isMostRecent, clientName, freelancerName, role }: {
    event: LifecycleEvent; index: number; isLast: boolean; isMostRecent: boolean;
    clientName: string; freelancerName: string; role: 'CLIENT' | 'FREELANCER';
}) {
    const cfg = getEventCfg(event.eventType);
    const Icon = cfg.icon;
    const actor = event.actorRole === 'CLIENT' ? clientName : event.actorRole === 'FREELANCER' ? freelancerName : 'System';
    const prefix = role === 'CLIENT' ? '/client' : '/freelancer';
    const link = event.contractId ? `${prefix}/contracts/${event.contractId}`
        : event.proposalId ? `${prefix}/proposals/${event.proposalId}`
            : event.jobId ? `/client/jobs/${event.jobId}` : null;

    const isSystem = event.category === 'SYSTEM';

    return (
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }} className={`relative flex gap-6 pb-10 last:pb-0 ${isSystem ? 'opacity-60' : ''}`}>
            {!isLast && (
                <div className="absolute left-[25px] top-[56px] bottom-0 w-[2px]">
                    <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
                        className="h-full bg-gradient-to-b from-zinc-700/60 to-zinc-800/20 rounded-full origin-top" />
                </div>
            )}
            <div className="relative z-10 flex-shrink-0">
                <div className={`${isSystem ? 'w-[40px] h-[40px]' : 'w-[52px] h-[52px]'} rounded-full flex items-center justify-center border-2 ${isMostRecent && !isSystem ? 'border-indigo-400/70 shadow-[0_0_28px_rgba(99,102,241,0.35)]' : isSystem ? 'border-zinc-700/30' : 'border-white/5'
                    } ${isSystem ? 'bg-zinc-800/40' : cfg.bg}`}>
                    {isMostRecent && !isSystem && <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />}
                    <Icon className={`${isSystem ? 'w-4 h-4 text-zinc-500' : `w-5 h-5 ${cfg.color}`}`} />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className={`glass-panel rounded-xl ${isSystem ? 'p-4' : 'p-6'} transition-all duration-300 hover:bg-white/[0.06] border ${isSystem ? 'border-zinc-800/50' : 'border-white/5'} ${isMostRecent && !isSystem ? 'bg-indigo-500/[0.03] border-indigo-500/15' : ''
                    }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <h4 className={`${isSystem ? 'text-sm font-medium text-zinc-400' : 'text-base font-semibold text-white'}`}>{friendlyTitle(event.eventType)}</h4>
                            {isSystem && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 font-mono uppercase tracking-wider">SYS</span>
                            )}
                            {link && <Link href={link} className="text-zinc-600 hover:text-indigo-400 transition-colors"><ExternalLink className="w-4 h-4" /></Link>}
                        </div>
                        {event.devState && event.devState !== 'SYSTEM' && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 font-mono uppercase tracking-wider">
                                {event.devState}
                            </span>
                        )}
                    </div>
                    <p className={`${isSystem ? 'text-xs text-zinc-500' : 'text-sm text-zinc-400'} mb-3 leading-relaxed`}>{event.userMessage}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                        <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${event.actorRole === 'CLIENT' ? 'bg-cyan-400' : event.actorRole === 'FREELANCER' ? 'bg-purple-400' : 'bg-zinc-500'
                                }`} /> {actor}
                        </span>
                        <span>{fmtTime(event.createdAt)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function JobControlCenter({ jobId, jobTitle, role }: JobControlCenterProps) {
    const [data, setData] = useState<APIResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [infoPhase, setInfoPhase] = useState<MasterPhase | null>(null);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'BUSINESS' | 'SYSTEM'>('ALL');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/lifecycle-events/job/${jobId}`);
                if (!res.ok) throw new Error('Failed');
                setData(await res.json());
            } catch (e) { setError('Failed to load lifecycle data'); console.error(e); }
            finally { setLoading(false); }
        })();
    }, [jobId]);

    const currentPhase = data ? mapToMasterPhase(
        data.primaryContract?.status || null, data.primaryContract?.type || null,
        data.proposals.length > 0, data.contracts.length > 0,
    ) : 'JOB';

    const devState = data?.primaryContract?.status || data?.job?.status || null;
    const statusText = data ? friendlyStatus(data.primaryContract?.status || null, role, data.clientName, data.freelancerName) : 'Initializing...';

    // ── Memoized intelligence computations ──
    const health = useMemo<HealthResult>(
        () => data ? evaluateLifecycleHealth(data.primaryContract?.status || null, data.events) : { level: 'HEALTHY' as const, reason: 'Initializing...' },
        [data],
    );

    const deadlock = useMemo<DeadlockResult>(
        () => data ? detectDeadlocks(data.primaryContract?.status || null, data.events) : { type: 'NONE' as const, message: '' },
        [data],
    );

    const phaseDurations = useMemo<Record<string, PhaseDuration>>(
        () => data ? computePhaseDurations(data.events, data.primaryContract?.status || null) : {},
        [data],
    );

    const pastStates = useMemo<string[]>(
        () => {
            if (!data) return [];
            const seen = new Set<string>();
            for (const ev of data.events) {
                if (ev.devState) seen.add(ev.devState);
            }
            return Array.from(seen);
        },
        [data],
    );

    const hasTrialUpgrade = useMemo(
        () => data ? data.events.some(e => e.eventType === 'TRIAL_UPGRADED') : false,
        [data],
    );

    // Map master phase labels to duration keys
    const PHASE_DURATION_KEYS: Record<MasterPhase, string> = {
        JOB: 'JOB', PROPOSAL: 'PROPOSAL', TRIAL: 'TRIAL', CONTRACT: 'CONTRACT',
        FUNDING: 'FUNDING', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', CLOSED: 'CLOSED',
    };

    // Role-aware deadlock message rewriting
    const deadlockMessage = useMemo(() => {
        if (deadlock.type === 'NONE') return '';
        const msg = deadlock.message;
        if (role === 'CLIENT') {
            return msg.replace('freelancer response', `response from your freelancer`);
        }
        return msg.replace('client', 'the client');
    }, [deadlock, role]);

    // Days in current state
    const daysInCurrentState = useMemo(() => {
        if (!data || data.events.length === 0) return 0;
        const last = data.events[data.events.length - 1];
        return (Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    }, [data]);

    // Dispute risk
    const disputeRisk = useMemo<DisputeRiskResult>(
        () => data ? calculateDisputeRisk({
            contractStatus: data.primaryContract?.status || null,
            events: data.events,
            messageCount: data.interactionCounts.messages,
            editCount: data.interactionCounts.edits,
            changeRequests: data.interactionCounts.changeRequests,
            deadlockType: deadlock.type,
            daysInCurrentState,
        }) : { score: 0, level: 'LOW' as const, factors: [] },
        [data, deadlock, daysInCurrentState],
    );

    // Responsiveness — show counter-party's score
    const responsivenessTarget = role === 'CLIENT' ? 'FREELANCER' as const : 'CLIENT' as const;
    const responsiveness = useMemo<ResponsivenessResult>(
        () => data ? computeResponsiveness(data.events, responsivenessTarget) : { averageResponseHours: 0, rating: 'GOOD' as const, pairCount: 0 },
        [data, responsivenessTarget],
    );

    // Burn rate
    const burnRate = useMemo<BurnRateResult>(
        () => data && data.financialData ? computeBurnRate({
            contractStatus: data.primaryContract?.status || null,
            totalDeposited: data.financialData.totalDeposited,
            totalReleased: data.financialData.totalReleased,
            balance: data.financialData.balance,
            events: data.events,
        }) : { burnRatePerDay: 0, estimatedDaysRemaining: null, totalFunded: 0, totalReleased: 0, daysActive: 0 },
        [data],
    );

    // Reliability
    const reliability = useMemo<ReliabilityResult>(
        () => data ? computeReliabilityScore({
            events: data.events,
            changeRequests: data.interactionCounts.changeRequests,
            deadlockCount: deadlock.type !== 'NONE' ? 1 : 0,
        }) : { score: 100, grade: 'A' as const, deductions: [] },
        [data, deadlock],
    );

    return (
        <div className="w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <Link href={role === 'CLIENT' ? '/client/jobs' : '/freelancer/dashboard'}
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Exit Control Center
                </Link>
            </motion.div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-40">
                        <div className="flex flex-col items-center gap-4">
                            <motion.div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent"
                                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                            <span className="text-sm text-zinc-600">Initializing Control Center...</span>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-xl p-16 text-center max-w-lg mx-auto">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-400 text-lg">{error}</p>
                    </motion.div>
                ) : data ? (
                    <motion.div key="c">
                        {/* 1. Hero Header */}
                        <HeroHeader jobTitle={jobTitle} contractType={data.primaryContract?.type || null}
                            devState={devState} role={role} statusText={statusText} health={health} />

                        {/* 2. Deadlock Alert Panel */}
                        <AnimatePresence>
                            {deadlock.type !== 'NONE' && !alertDismissed && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`rounded-2xl p-5 md:p-6 mb-12 border relative overflow-hidden ${deadlock.type === 'CRITICAL'
                                        ? 'bg-red-500/[0.04] border-red-500/20'
                                        : 'bg-amber-500/[0.04] border-amber-500/20'
                                        }`}
                                    style={{
                                        boxShadow: deadlock.type === 'CRITICAL'
                                            ? '0 0 30px rgba(248,113,113,0.1)'
                                            : '0 0 30px rgba(251,191,36,0.1)',
                                    }}
                                >
                                    {/* Soft glow backdrop */}
                                    <motion.div
                                        className={`absolute inset-0 opacity-20 ${deadlock.type === 'CRITICAL' ? 'bg-red-500/5' : 'bg-amber-500/5'
                                            }`}
                                        animate={{ opacity: [0.1, 0.25, 0.1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                    <div className="relative flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <span className="text-2xl">
                                                {deadlock.type === 'CRITICAL' ? '🔴' : '🟡'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${deadlock.type === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                                                    }`}>
                                                    {deadlock.type === 'CRITICAL' ? 'System Alert — Stalled' : 'System Alert — Minor Delay'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-300 leading-relaxed">
                                                {deadlockMessage}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setAlertDismissed(true)}
                                            className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors text-zinc-500 hover:text-zinc-300"
                                            aria-label="Dismiss alert"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 3. Dispute Risk Meter */}
                        <DisputeRiskMeter risk={disputeRisk} role={role} />

                        {/* 4. Financial Strip */}
                        <FinancialStrip
                            financial={data.financialData}
                            contractStatus={data.primaryContract?.status || null}
                            role={role}
                        />

                        {/* 5. Burn Rate Tracker */}
                        <BurnRateCard burnRate={burnRate} />

                        {/* 6. Responsiveness Index */}
                        <ResponsivenessBar
                            result={responsiveness}
                            targetRole={responsivenessTarget}
                            viewerRole={role}
                        />

                        {/* 7. Reliability Score */}
                        <ReliabilityBadge reliability={reliability} role={role} />

                        {/* 8. Lifecycle Bar */}
                        <MasterLifecycleBar currentPhase={currentPhase} onOpenInfo={setInfoPhase} />

                        {/* Phase Duration Display */}
                        {Object.keys(phaseDurations).length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.4 }}
                                className="glass-panel rounded-2xl p-6 md:p-8 mb-12"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Clock className="w-4 h-4 text-zinc-600" />
                                    <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">Time Per Phase</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                    {MASTER_PHASES.map((phase) => {
                                        const key = PHASE_DURATION_KEYS[phase];
                                        const dur = phaseDurations[key];
                                        const Icon = PHASE_ICONS[phase];
                                        return (
                                            <div key={phase} className={`relative text-center p-3 rounded-xl border transition-all ${dur?.isCurrent
                                                ? 'bg-indigo-500/[0.06] border-indigo-500/20'
                                                : dur ? 'bg-white/[0.02] border-white/5' : 'bg-transparent border-white/[0.03]'
                                                }`}>
                                                {dur?.isCurrent && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-xl border border-indigo-400/20"
                                                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                )}
                                                <Icon className={`w-4 h-4 mx-auto mb-1.5 ${dur?.isCurrent ? 'text-indigo-400' : dur ? 'text-zinc-500' : 'text-zinc-800'}`} />
                                                <p className={`text-[10px] uppercase tracking-wider mb-1 ${dur?.isCurrent ? 'text-indigo-400' : dur ? 'text-zinc-500' : 'text-zinc-800'}`}>
                                                    {phase}
                                                </p>
                                                <p className={`text-sm font-mono font-semibold ${dur?.isCurrent ? 'text-indigo-300' : dur ? 'text-zinc-300' : 'text-zinc-800'}`}>
                                                    {dur ? dur.formatted : '—'}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* 9. Trial Upgrade Connector */}
                        {hasTrialUpgrade && (
                            <TrialUpgradeConnector events={data.events} contracts={data.contracts} />
                        )}

                        {/* 10. Interaction Analytics */}
                        <InteractionAnalytics counts={data.interactionCounts} />

                        {/* 11. Timeline */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <Layers className="w-5 h-5 text-zinc-600" />
                                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">Event Timeline</h2>
                                <span className="text-xs text-zinc-700">{data.events.length} event{data.events.length !== 1 ? 's' : ''}</span>
                                <div className="ml-auto flex items-center gap-1">
                                    {(['ALL', 'BUSINESS', 'SYSTEM'] as const).map((f) => (
                                        <button key={f} onClick={() => setTimelineFilter(f)}
                                            className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider transition-colors ${timelineFilter === f
                                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                : 'text-zinc-600 hover:text-zinc-400 border border-transparent'
                                                }`}>
                                            {f === 'ALL' ? 'All' : f === 'BUSINESS' ? 'Business' : 'System'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {(() => {
                                const filtered = timelineFilter === 'ALL'
                                    ? data.events
                                    : data.events.filter(ev => (ev.category || 'BUSINESS') === timelineFilter);
                                return filtered.length === 0 ? (
                                    <div className="glass-panel rounded-xl p-12 text-center">
                                        <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-600">No {timelineFilter.toLowerCase()} events recorded yet.</p>
                                        <p className="text-zinc-700 text-sm mt-1">Events appear as the job progresses.</p>
                                    </div>
                                ) : (
                                    <div className="relative max-w-4xl">
                                        {filtered.map((ev, i) => (
                                            <TimelineNode key={ev.id} event={ev} index={i} isLast={i === filtered.length - 1}
                                                isMostRecent={i === filtered.length - 1}
                                                clientName={data.clientName} freelancerName={data.freelancerName} role={role} />
                                        ))}
                                    </div>
                                );
                            })()}
                        </motion.div>

                        {/* 12. State Transition Graph (collapsible) */}
                        <div className="mt-12">
                            <StateMachineGraph
                                currentStatus={data.primaryContract?.status || null}
                                pastStates={pastStates}
                            />
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Phase Intelligence Panel */}
            <PhaseInfoPanel phase={infoPhase} role={role} currentPhase={currentPhase} onClose={() => setInfoPhase(null)} />
        </div>
    );
}
