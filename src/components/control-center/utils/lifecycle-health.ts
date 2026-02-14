/**
 * Lifecycle Health Evaluator
 *
 * Deterministic health assessment based on real event timestamps
 * and current contract status. No manual flags, no fake data.
 */

interface LifecycleEvent {
    id: string;
    eventType: string;
    devState?: string | null;
    createdAt: string;
}

export type HealthLevel = 'HEALTHY' | 'AT_RISK' | 'BLOCKED';

export interface HealthResult {
    level: HealthLevel;
    reason: string;
}

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

function hoursSince(dateStr: string): number {
    return (Date.now() - new Date(dateStr).getTime()) / HOUR;
}

function latestEventOfType(events: LifecycleEvent[], types: string[]): LifecycleEvent | null {
    for (let i = events.length - 1; i >= 0; i--) {
        if (types.includes(events[i].eventType)) return events[i];
    }
    return null;
}

function latestEvent(events: LifecycleEvent[]): LifecycleEvent | null {
    return events.length > 0 ? events[events.length - 1] : null;
}

export function evaluateLifecycleHealth(
    contractStatus: string | null,
    events: LifecycleEvent[],
): HealthResult {
    if (!contractStatus || events.length === 0) {
        return { level: 'HEALTHY', reason: 'Lifecycle just started — no concerns yet.' };
    }

    // DISPUTED → always BLOCKED
    if (contractStatus === 'DISPUTED') {
        return { level: 'BLOCKED', reason: 'Contract is under dispute — resolution required before progress.' };
    }

    // CANCELLED / REJECTED → terminal
    if (contractStatus === 'CANCELLED' || contractStatus === 'REJECTED') {
        return { level: 'BLOCKED', reason: `Contract was ${contractStatus.toLowerCase()} — lifecycle ended.` };
    }

    // COMPLETED / CLOSED → healthy terminal
    if (contractStatus === 'COMPLETED' || contractStatus === 'CLOSED') {
        return { level: 'HEALTHY', reason: 'Lifecycle completed successfully.' };
    }

    // FINALIZED — check for funding within 3 days
    if (contractStatus === 'FINALIZED') {
        const finalizeEvent = latestEventOfType(events, ['CONTRACT_FINALIZED']);
        if (finalizeEvent && hoursSince(finalizeEvent.createdAt) > 72) {
            return { level: 'AT_RISK', reason: 'Contract finalized over 3 days ago — escrow funding is overdue.' };
        }
        return { level: 'HEALTHY', reason: 'Contract finalized — awaiting escrow funding.' };
    }

    // PENDING_REVIEW — check for response within 48h
    if (contractStatus === 'PENDING_REVIEW') {
        const reviewEvent = latestEventOfType(events, ['SENT_FOR_REVIEW']);
        if (reviewEvent && hoursSince(reviewEvent.createdAt) > 48) {
            return { level: 'AT_RISK', reason: 'Contract sent for review over 48 hours ago — response overdue.' };
        }
        return { level: 'HEALTHY', reason: 'Contract is under review.' };
    }

    // FUNDED — check for activation within 48h
    if (contractStatus === 'FUNDED') {
        const fundEvent = latestEventOfType(events, ['MILESTONE_FUNDED']);
        if (fundEvent && hoursSince(fundEvent.createdAt) > 48) {
            return { level: 'AT_RISK', reason: 'Escrow funded over 48 hours ago — contract activation delayed.' };
        }
        return { level: 'HEALTHY', reason: 'Contract funded — activation pending.' };
    }

    // ACTIVE — check for progress within 7 days
    if (contractStatus === 'ACTIVE') {
        const last = latestEvent(events);
        if (last && hoursSince(last.createdAt) > 168) {
            return { level: 'AT_RISK', reason: 'No lifecycle activity for over 7 days — progress may be stalled.' };
        }
        return { level: 'HEALTHY', reason: 'Work is actively in progress.' };
    }

    return { level: 'HEALTHY', reason: 'Lifecycle is progressing normally.' };
}
