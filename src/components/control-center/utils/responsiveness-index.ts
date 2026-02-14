/**
 * Responsiveness Index
 *
 * Computes average response time between key lifecycle transition pairs.
 * Separate computations for client and freelancer roles.
 */

export type ResponsivenessRating = 'EXCELLENT' | 'GOOD' | 'DELAYED' | 'POOR';

export interface ResponsivenessResult {
    averageResponseHours: number;
    rating: ResponsivenessRating;
    pairCount: number;
}

interface LifecycleEvent {
    eventType: string;
    createdAt: string;
}

// Client transition pairs: measures how quickly client acts
const CLIENT_PAIRS: [string, string][] = [
    ['PROPOSAL_SENT', 'CONTRACT_DRAFTED'],
    ['CONTRACT_ACCEPTED', 'CONTRACT_FINALIZED'],
    ['CONTRACT_FINALIZED', 'MILESTONE_FUNDED'],
];

// Freelancer transition pairs: measures how quickly freelancer acts
const FREELANCER_PAIRS: [string, string][] = [
    ['SENT_FOR_REVIEW', 'CONTRACT_ACCEPTED'],
    ['SENT_FOR_REVIEW', 'CHANGES_REQUESTED'],
    ['MILESTONE_FUNDED', 'CONTRACT_ACTIVATED'],
];

function findEventTime(events: LifecycleEvent[], type: string): number | null {
    const ev = events.find(e => e.eventType === type);
    return ev ? new Date(ev.createdAt).getTime() : null;
}

function rateResponseTime(hours: number): ResponsivenessRating {
    if (hours < 12) return 'EXCELLENT';
    if (hours < 24) return 'GOOD';
    if (hours < 48) return 'DELAYED';
    return 'POOR';
}

export function computeResponsiveness(
    events: LifecycleEvent[],
    targetRole: 'CLIENT' | 'FREELANCER',
): ResponsivenessResult {
    const pairs = targetRole === 'CLIENT' ? CLIENT_PAIRS : FREELANCER_PAIRS;
    const durations: number[] = [];

    for (const [from, to] of pairs) {
        const fromTime = findEventTime(events, from);
        const toTime = findEventTime(events, to);
        if (fromTime && toTime && toTime > fromTime) {
            durations.push((toTime - fromTime) / (1000 * 60 * 60));
        }
    }

    if (durations.length === 0) {
        return { averageResponseHours: 0, rating: 'GOOD', pairCount: 0 };
    }

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
        averageResponseHours: Math.round(avg * 10) / 10,
        rating: rateResponseTime(avg),
        pairCount: durations.length,
    };
}
