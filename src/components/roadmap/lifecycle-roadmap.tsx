'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Send, FileText, Eye, CheckCircle, Shield, DollarSign,
    Zap, Flag, XCircle, AlertTriangle, ArrowUpCircle, ArrowLeft, Clock,
    User
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

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

interface LifecycleRoadmapProps {
    contractId: string;
    contractTitle: string;
    contractStatus: string;
    contractType: string;
    role: 'CLIENT' | 'FREELANCER';
    clientName: string;
    freelancerName: string;
    jobTitle: string;
}

// ============================================================================
// Status Bar Configuration
// ============================================================================

const STATUS_STEPS = [
    { key: 'DRAFT', label: 'Draft', icon: FileText },
    { key: 'PENDING_REVIEW', label: 'Review', icon: Eye },
    { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle },
    { key: 'FINALIZED', label: 'Finalized', icon: Shield },
    { key: 'FUNDED', label: 'Funded', icon: DollarSign },
    { key: 'ACTIVE', label: 'Active', icon: Zap },
    { key: 'COMPLETED', label: 'Completed', icon: Flag },
    { key: 'CLOSED', label: 'Closed', icon: XCircle },
];

// Non-linear statuses (branching states)
const BRANCH_STATUSES = ['CANCELLED', 'REJECTED', 'DISPUTED'];

const STATUS_ORDER: Record<string, number> = {};
STATUS_STEPS.forEach((step, i) => {
    STATUS_ORDER[step.key] = i;
});

// ============================================================================
// Event Icon + Color Map
// ============================================================================

function getEventConfig(eventType: string) {
    const map: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
        JOB_POSTED: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        PROPOSAL_SENT: { icon: Send, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        CONTRACT_DRAFTED: { icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
        SENT_FOR_REVIEW: { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/20' },
        CHANGES_REQUESTED: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
        CONTRACT_ACCEPTED: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        CONTRACT_FINALIZED: { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        CONTRACT_REJECTED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
        MILESTONE_FUNDED: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
        MILESTONE_COMPLETED: { icon: Flag, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        CONTRACT_COMPLETED: { icon: Flag, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        CONTRACT_CLOSED: { icon: XCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
        TRIAL_APPROVED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        TRIAL_REJECTED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
        DISPUTE_RAISED: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
        TRIAL_UPGRADED: { icon: ArrowUpCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    };
    return map[eventType] || { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/20' };
}

function getActorLabel(actorRole: string, clientName: string, freelancerName: string) {
    if (actorRole === 'CLIENT') return clientName;
    if (actorRole === 'FREELANCER') return freelancerName;
    return 'System';
}

function formatTimestamp(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ============================================================================
// Horizontal Status Bar
// ============================================================================

function HorizontalStatusBar({ contractStatus }: { contractStatus: string }) {
    const currentIndex = STATUS_ORDER[contractStatus] ?? -1;
    const isBranch = BRANCH_STATUSES.includes(contractStatus);

    return (
        <div className="glass-panel rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-5">
                Contract Status
            </h2>

            {/* Branch status banner */}
            {isBranch && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 ${contractStatus === 'REJECTED'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : contractStatus === 'DISPUTED'
                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                        }`}
                >
                    <AlertTriangle className="w-4 h-4" />
                    Status: {contractStatus}
                </motion.div>
            )}

            {/* Status Steps */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {STATUS_STEPS.map((step, i) => {
                    const isPast = currentIndex >= 0 && i < currentIndex;
                    const isCurrent = i === currentIndex && !isBranch;
                    const isFuture = currentIndex >= 0 ? i > currentIndex : true;
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.key}>
                            {/* Step */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.08, duration: 0.3 }}
                                className="flex flex-col items-center min-w-[72px] relative"
                            >
                                {/* Icon Circle */}
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                        ${isCurrent
                                            ? 'bg-indigo-500/30 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                                            : isPast
                                                ? 'bg-emerald-500/20 border-emerald-500/50'
                                                : 'bg-zinc-800/50 border-zinc-700/50'
                                        }
                                    `}
                                >
                                    {isCurrent && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full border-2 border-indigo-400/50"
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    )}
                                    <Icon className={`w-4 h-4 ${isCurrent
                                            ? 'text-indigo-300'
                                            : isPast
                                                ? 'text-emerald-400'
                                                : 'text-zinc-600'
                                        }`} />
                                </div>

                                {/* Label */}
                                <span className={`text-[11px] mt-2 font-medium whitespace-nowrap ${isCurrent
                                        ? 'text-indigo-300'
                                        : isPast
                                            ? 'text-emerald-400/80'
                                            : isFuture
                                                ? 'text-zinc-600'
                                                : 'text-zinc-400'
                                    }`}>
                                    {step.label}
                                </span>
                            </motion.div>

                            {/* Connector line */}
                            {i < STATUS_STEPS.length - 1 && (
                                <div className="flex-1 min-w-[16px] h-[2px] mt-[-20px] relative">
                                    <div className="absolute inset-0 bg-zinc-800 rounded-full" />
                                    {isPast && (
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ delay: i * 0.08 + 0.15, duration: 0.4 }}
                                            className="absolute inset-0 bg-gradient-to-r from-emerald-500/60 to-emerald-500/30 rounded-full origin-left"
                                        />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Role-Aware Context Banner
// ============================================================================

function RoleContextBanner({
    role,
    contractStatus,
    clientName,
    freelancerName,
}: {
    role: 'CLIENT' | 'FREELANCER';
    contractStatus: string;
    clientName: string;
    freelancerName: string;
}) {
    const contextMap: Record<string, { client: string; freelancer: string }> = {
        DRAFT: {
            client: 'You are drafting this contract',
            freelancer: `Waiting for ${clientName} to prepare the contract`,
        },
        PENDING_REVIEW: {
            client: `Waiting for ${freelancerName} to review`,
            freelancer: 'Review the contract terms and accept or request changes',
        },
        ACCEPTED: {
            client: 'Finalize the contract to proceed',
            freelancer: `Waiting for ${clientName} to finalize`,
        },
        FINALIZED: {
            client: 'Contract finalized — fund to activate (Phase 2)',
            freelancer: `Contract finalized — waiting for ${clientName} to fund`,
        },
        FUNDED: {
            client: 'Contract funded — work can begin',
            freelancer: 'Contract funded — start delivering',
        },
        ACTIVE: {
            client: `${freelancerName} is working on deliverables`,
            freelancer: 'Deliver milestones and track progress',
        },
        COMPLETED: {
            client: 'All work has been completed',
            freelancer: 'Project completed successfully',
        },
        CLOSED: {
            client: 'Contract closed',
            freelancer: 'Contract closed',
        },
        REJECTED: {
            client: `${freelancerName} rejected the contract`,
            freelancer: 'You rejected this contract',
        },
        DISPUTED: {
            client: 'Dispute under review by the support team',
            freelancer: 'Your dispute is being reviewed',
        },
        CANCELLED: {
            client: 'This contract was cancelled',
            freelancer: 'This contract was cancelled',
        },
    };

    const context = contextMap[contractStatus];
    if (!context) return null;

    const message = role === 'CLIENT' ? context.client : context.freelancer;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-xl p-4 mb-8 flex items-center gap-3"
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'CLIENT' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                }`}>
                <User className={`w-4 h-4 ${role === 'CLIENT' ? 'text-cyan-400' : 'text-purple-400'
                    }`} />
            </div>
            <div>
                <p className="text-sm text-zinc-400">
                    Viewing as <span className={`font-medium ${role === 'CLIENT' ? 'text-cyan-400' : 'text-purple-400'
                        }`}>{role === 'CLIENT' ? clientName : freelancerName}</span>
                    {' '}({role.toLowerCase()})
                </p>
                <p className="text-sm text-white/80 mt-0.5">{message}</p>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Timeline Event Node
// ============================================================================

function TimelineEvent({
    event,
    index,
    isLast,
    isMostRecent,
    clientName,
    freelancerName,
    role,
}: {
    event: LifecycleEvent;
    index: number;
    isLast: boolean;
    isMostRecent: boolean;
    clientName: string;
    freelancerName: string;
    role: 'CLIENT' | 'FREELANCER';
}) {
    const config = getEventConfig(event.eventType);
    const Icon = config.icon;
    const actorLabel = getActorLabel(event.actorRole, clientName, freelancerName);

    // Role-aware emphasis
    const isMyAction = event.actorRole === role;
    const isWaiting = !isMyAction && isMostRecent;

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
            className="relative flex gap-4 pb-8 last:pb-0"
        >
            {/* Vertical line */}
            {!isLast && (
                <div className="absolute left-[19px] top-[44px] bottom-0 w-[2px]">
                    <div className="h-full bg-gradient-to-b from-zinc-700 to-zinc-800/30 rounded-full" />
                </div>
            )}

            {/* Node */}
            <div className="relative z-10 flex-shrink-0">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${isMostRecent
                        ? 'border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                        : `border-white/10 ${config.bg}`
                    }
                    ${config.bg}
                `}>
                    {isMostRecent && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-indigo-400/40"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.6, 0, 0.6],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                        />
                    )}
                    <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={`
                    glass-panel rounded-xl p-4 transition-all duration-300
                    hover:bg-white/10 hover:border-white/20
                    ${isMostRecent ? 'border-indigo-500/30 bg-indigo-500/5' : ''}
                    ${isWaiting ? 'border-amber-500/20 bg-amber-500/5' : ''}
                `}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">
                            {event.eventType.replace(/_/g, ' ')}
                        </h4>
                        {event.devState && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono uppercase whitespace-nowrap">
                                {event.devState}
                            </span>
                        )}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-zinc-300 mb-2">
                        {event.userMessage}
                    </p>

                    {/* Footer: Actor + Timestamp */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${event.actorRole === 'CLIENT'
                                    ? 'bg-cyan-400'
                                    : event.actorRole === 'FREELANCER'
                                        ? 'bg-purple-400'
                                        : 'bg-zinc-400'
                                }`} />
                            {actorLabel}
                        </span>
                        <span>{formatTimestamp(event.createdAt)}</span>
                    </div>

                    {/* Waiting Indicator */}
                    {isWaiting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-3 pt-3 border-t border-white/5"
                        >
                            <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Awaiting {role === 'CLIENT' ? 'Freelancer' : 'Client'} Action
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function LifecycleRoadmap({
    contractId,
    contractTitle,
    contractStatus,
    contractType,
    role,
    clientName,
    freelancerName,
    jobTitle,
}: LifecycleRoadmapProps) {
    const [events, setEvents] = useState<LifecycleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch(`/api/lifecycle-events/${contractId}`);
                if (!res.ok) throw new Error('Failed to fetch events');
                const data = await res.json();
                setEvents(data.events || []);
            } catch (err: unknown) {
                console.error('Failed to fetch lifecycle events:', err);
                setError('Failed to load roadmap data');
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [contractId]);

    const backLink = role === 'CLIENT'
        ? `/client/contracts/${contractId}`
        : `/freelancer/contracts/${contractId}`;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Contract
                </Link>
            </motion.div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium tracking-wide uppercase ${contractType === 'TRIAL'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                        {contractType === 'TRIAL' ? 'Paid Trial' : 'Standard'}
                    </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {contractTitle}
                </h1>
                <p className="text-sm text-zinc-500">
                    Lifecycle Roadmap • {jobTitle}
                </p>
            </motion.div>

            {/* Horizontal Status Bar */}
            <HorizontalStatusBar contractStatus={contractStatus} />

            {/* Role Context Banner */}
            <RoleContextBanner
                role={role}
                contractStatus={contractStatus}
                clientName={clientName}
                freelancerName={freelancerName}
            />

            {/* Timeline */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-5">
                    Event Timeline
                </h2>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center py-16"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <motion.div
                                    className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <span className="text-sm text-zinc-500">Loading roadmap...</span>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel rounded-xl p-8 text-center"
                        >
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </motion.div>
                    ) : events.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-panel rounded-xl p-8 text-center"
                        >
                            <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">
                                No lifecycle events recorded yet.
                            </p>
                            <p className="text-zinc-600 text-xs mt-1">
                                Events will appear as the contract progresses.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="timeline" className="relative">
                            {events.map((event, i) => (
                                <TimelineEvent
                                    key={event.id}
                                    event={event}
                                    index={i}
                                    isLast={i === events.length - 1}
                                    isMostRecent={i === events.length - 1}
                                    clientName={clientName}
                                    freelancerName={freelancerName}
                                    role={role}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
