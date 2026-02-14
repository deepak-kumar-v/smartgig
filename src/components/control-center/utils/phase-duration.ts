/**
 * Phase Duration Computation
 *
 * Calculates real time spent in each phase based on
 * actual LifecycleEvent timestamps. No hardcoded durations.
 */

interface LifecycleEvent {
    id: string;
    eventType: string;
    devState?: string | null;
    createdAt: string;
}

export interface PhaseDuration {
    durationMs: number;
    formatted: string;
    isCurrent: boolean;
}

// Map event types to their master phase
const EVENT_TO_PHASE: Record<string, string> = {
    JOB_POSTED: 'JOB',
    PROPOSAL_SENT: 'PROPOSAL',
    CONTRACT_DRAFTED: 'CONTRACT',
    SENT_FOR_REVIEW: 'CONTRACT',
    CHANGES_REQUESTED: 'CONTRACT',
    CONTRACT_ACCEPTED: 'CONTRACT',
    CONTRACT_FINALIZED: 'FUNDING',
    MILESTONE_FUNDED: 'ACTIVE',
    CONTRACT_COMPLETED: 'COMPLETED',
    CONTRACT_CLOSED: 'CLOSED',
    TRIAL_APPROVED: 'TRIAL',
    TRIAL_REJECTED: 'CLOSED',
    TRIAL_UPGRADED: 'CONTRACT',
    DISPUTE_RAISED: 'CLOSED',
    CONTRACT_REJECTED: 'CLOSED',
};

function formatDuration(ms: number): string {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
    return parts.join(' ');
}

export function computePhaseDurations(
    events: LifecycleEvent[],
    currentStatus: string | null,
): Record<string, PhaseDuration> {
    const result: Record<string, PhaseDuration> = {};

    if (events.length === 0) return result;

    // Build phase entry/exit timestamps from events
    interface PhaseSpan { phase: string; start: number; end: number | null; }
    const spans: PhaseSpan[] = [];
    let currentPhase: string | null = null;

    for (const event of events) {
        const phase = EVENT_TO_PHASE[event.eventType];
        if (!phase) continue;

        const ts = new Date(event.createdAt).getTime();

        if (phase !== currentPhase) {
            // Close previous span
            if (spans.length > 0 && spans[spans.length - 1].end === null) {
                spans[spans.length - 1].end = ts;
            }
            // Start new span
            spans.push({ phase, start: ts, end: null });
            currentPhase = phase;
        }
    }

    // Last span is current — use Date.now()
    if (spans.length > 0 && spans[spans.length - 1].end === null) {
        spans[spans.length - 1].end = Date.now();
    }

    // Aggregate durations per phase
    const aggregated: Record<string, number> = {};
    const lastPhase = spans.length > 0 ? spans[spans.length - 1].phase : null;

    for (const span of spans) {
        const duration = (span.end || Date.now()) - span.start;
        aggregated[span.phase] = (aggregated[span.phase] || 0) + duration;
    }

    for (const [phase, ms] of Object.entries(aggregated)) {
        result[phase] = {
            durationMs: ms,
            formatted: formatDuration(ms),
            isCurrent: phase === lastPhase,
        };
    }

    return result;
}
