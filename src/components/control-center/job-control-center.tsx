'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Send, FileText, Eye, CheckCircle, Shield, DollarSign,
    Zap, Flag, XCircle, AlertTriangle, ArrowUpCircle, ArrowLeft, Clock,
    User, Info, ExternalLink, Layers
} from 'lucide-react';
import Link from 'next/link';
import {
    PhaseInfoPanel, MasterPhase, MASTER_PHASES, PHASE_INDEX,
} from './phase-info-panel';

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
    createdAt: string;
}

interface ContractSummary {
    id: string; proposalId: string; status: string; type: string; title: string; totalBudget: number;
}

interface PrimaryContract {
    id: string; status: string; type: string; title: string;
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
};

const EVENT_TITLES: Record<string, string> = {
    JOB_POSTED: 'Job Published', PROPOSAL_SENT: 'Proposal Submitted',
    CONTRACT_DRAFTED: 'Contract Drafted', SENT_FOR_REVIEW: 'Sent for Review',
    CHANGES_REQUESTED: 'Changes Requested', CONTRACT_ACCEPTED: 'Contract Accepted',
    CONTRACT_FINALIZED: 'Contract Finalized', CONTRACT_REJECTED: 'Contract Rejected',
    TRIAL_APPROVED: 'Trial Approved', TRIAL_REJECTED: 'Trial Rejected',
    DISPUTE_RAISED: 'Dispute Raised', TRIAL_UPGRADED: 'Upgraded to Standard',
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

function HeroHeader({ jobTitle, contractType, devState, role, statusText }: {
    jobTitle: string; contractType: string | null; devState: string | null;
    role: 'CLIENT' | 'FREELANCER'; statusText: string;
}) {
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

    return (
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }} className="relative flex gap-6 pb-10 last:pb-0">
            {!isLast && (
                <div className="absolute left-[25px] top-[56px] bottom-0 w-[2px]">
                    <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
                        className="h-full bg-gradient-to-b from-zinc-700/60 to-zinc-800/20 rounded-full origin-top" />
                </div>
            )}
            <div className="relative z-10 flex-shrink-0">
                <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 ${isMostRecent ? 'border-indigo-400/70 shadow-[0_0_28px_rgba(99,102,241,0.35)]' : 'border-white/5'
                    } ${cfg.bg}`}>
                    {isMostRecent && <motion.div className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />}
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className={`glass-panel rounded-xl p-6 transition-all duration-300 hover:bg-white/[0.06] border border-white/5 ${isMostRecent ? 'bg-indigo-500/[0.03] border-indigo-500/15' : ''
                    }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <h4 className="text-base font-semibold text-white">{friendlyTitle(event.eventType)}</h4>
                            {link && <Link href={link} className="text-zinc-600 hover:text-indigo-400 transition-colors"><ExternalLink className="w-4 h-4" /></Link>}
                        </div>
                        {event.devState && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 font-mono uppercase tracking-wider">
                                {event.devState}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{event.userMessage}</p>
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
                        <HeroHeader jobTitle={jobTitle} contractType={data.primaryContract?.type || null}
                            devState={devState} role={role} statusText={statusText} />

                        <MasterLifecycleBar currentPhase={currentPhase} onOpenInfo={setInfoPhase} />

                        {/* Timeline */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                            <div className="flex items-center gap-3 mb-8">
                                <Layers className="w-5 h-5 text-zinc-600" />
                                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-[0.25em]">Event Timeline</h2>
                                <span className="text-xs text-zinc-700 ml-auto">{data.events.length} event{data.events.length !== 1 ? 's' : ''}</span>
                            </div>
                            {data.events.length === 0 ? (
                                <div className="glass-panel rounded-xl p-12 text-center">
                                    <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-600">No lifecycle events recorded yet.</p>
                                    <p className="text-zinc-700 text-sm mt-1">Events appear as the job progresses.</p>
                                </div>
                            ) : (
                                <div className="relative max-w-4xl">
                                    {data.events.map((ev, i) => (
                                        <TimelineNode key={ev.id} event={ev} index={i} isLast={i === data.events.length - 1}
                                            isMostRecent={i === data.events.length - 1}
                                            clientName={data.clientName} freelancerName={data.freelancerName} role={role} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Phase Intelligence Panel */}
            <PhaseInfoPanel phase={infoPhase} role={role} currentPhase={currentPhase} onClose={() => setInfoPhase(null)} />
        </div>
    );
}
