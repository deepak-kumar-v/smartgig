/**
 * Deadlock Detection Engine
 *
 * Deterministic stall/stagnation detection from real event
 * timestamps and contract status. No manual flags.
 */

interface LifecycleEvent {
    id: string;
    eventType: string;
    devState?: string | null;
    createdAt: string;
}

export type DeadlockType = 'NONE' | 'WARNING' | 'CRITICAL';

export interface DeadlockResult {
    type: DeadlockType;
    message: string;
}

const HOUR = 1000 * 60 * 60;

function latestOfType(events: LifecycleEvent[], types: string[]): LifecycleEvent | null {
    for (let i = events.length - 1; i >= 0; i--) {
        if (types.includes(events[i].eventType)) return events[i];
    }
    return null;
}

function hoursBetween(dateStr: string, now: number): number {
    return (now - new Date(dateStr).getTime()) / HOUR;
}

export function detectDeadlocks(
    contractStatus: string | null,
    events: LifecycleEvent[],
    now: number = Date.now(),
): DeadlockResult {
    if (!contractStatus || events.length === 0) {
        return { type: 'NONE', message: '' };
    }

    // Terminal states — no deadlock possible
    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(contractStatus)) {
        return { type: 'NONE', message: '' };
    }

    // Rule 1: FINALIZED > 72h with no funding event
    if (contractStatus === 'FINALIZED') {
        const finalizeEvent = latestOfType(events, ['CONTRACT_FINALIZED']);
        const fundingEvent = latestOfType(events, ['MILESTONE_FUNDED']);
        if (finalizeEvent && !fundingEvent && hoursBetween(finalizeEvent.createdAt, now) > 72) {
            return {
                type: 'CRITICAL',
                message: 'Contract finalized over 3 days ago — escrow funding is critically overdue.',
            };
        }
        if (finalizeEvent && !fundingEvent && hoursBetween(finalizeEvent.createdAt, now) > 24) {
            return {
                type: 'WARNING',
                message: 'Contract awaiting escrow funding for over 24 hours.',
            };
        }
    }

    // Rule 2: PENDING_REVIEW > 48h
    if (contractStatus === 'PENDING_REVIEW') {
        const reviewEvent = latestOfType(events, ['SENT_FOR_REVIEW']);
        if (reviewEvent && hoursBetween(reviewEvent.createdAt, now) > 48) {
            return {
                type: 'CRITICAL',
                message: 'Contract sent for review over 48 hours ago — freelancer response overdue.',
            };
        }
        if (reviewEvent && hoursBetween(reviewEvent.createdAt, now) > 24) {
            return {
                type: 'WARNING',
                message: 'Contract review pending for over 24 hours.',
            };
        }
    }

    // Rule 3: FUNDED > 48h with no ACTIVE event
    if (contractStatus === 'FUNDED') {
        const fundEvent = latestOfType(events, ['MILESTONE_FUNDED']);
        const activeEvent = latestOfType(events, ['CONTRACT_ACTIVATED']);
        if (fundEvent && !activeEvent && hoursBetween(fundEvent.createdAt, now) > 48) {
            return {
                type: 'CRITICAL',
                message: 'Escrow funded over 48 hours ago — work has not started.',
            };
        }
    }

    // Rule 4: ACTIVE > 7 days with no progress
    if (contractStatus === 'ACTIVE') {
        const lastEvent = events[events.length - 1];
        if (lastEvent && hoursBetween(lastEvent.createdAt, now) > 168) {
            return {
                type: 'WARNING',
                message: 'No lifecycle activity for over 7 days — project may be stagnating.',
            };
        }
    }

    // DISPUTED → always critical
    if (contractStatus === 'DISPUTED') {
        return {
            type: 'CRITICAL',
            message: 'Active dispute — contract progression blocked until resolution.',
        };
    }

    return { type: 'NONE', message: '' };
}
