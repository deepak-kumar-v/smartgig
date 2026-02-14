/**
 * Dispute Risk Score Engine
 *
 * Deterministic weighted scoring from real lifecycle data.
 * No hardcoded scoring — all factors derived from events, counts, and state.
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface DisputeRiskResult {
    score: number;
    level: RiskLevel;
    factors: string[];
}

interface DisputeRiskInput {
    contractStatus: string | null;
    events: { eventType: string; createdAt: string }[];
    messageCount: number;
    editCount: number;
    changeRequests: number;
    deadlockType: 'NONE' | 'WARNING' | 'CRITICAL';
    daysInCurrentState: number;
}

export function calculateDisputeRisk({
    contractStatus,
    events,
    messageCount,
    editCount,
    changeRequests,
    deadlockType,
    daysInCurrentState,
}: DisputeRiskInput): DisputeRiskResult {
    let score = 0;
    const factors: string[] = [];

    // Deadlock severity
    if (deadlockType === 'CRITICAL') {
        score += 20;
        factors.push('Critical deadlock detected (+20)');
    } else if (deadlockType === 'WARNING') {
        score += 10;
        factors.push('Warning-level delay detected (+10)');
    }

    // Excessive change requests
    if (changeRequests > 3) {
        score += 15;
        factors.push(`${changeRequests} change requests (>3) (+15)`);
    }

    // High edit count
    if (editCount > 10) {
        score += 10;
        factors.push(`${editCount} message edits (>10) (+10)`);
    }

    // Extended time in review/active states
    if (
        daysInCurrentState > 5 &&
        contractStatus &&
        ['ACTIVE', 'PENDING_REVIEW'].includes(contractStatus)
    ) {
        score += 15;
        factors.push(`${Math.round(daysInCurrentState)}d in ${contractStatus} state (+15)`);
    }

    // Funding delay (check if FINALIZED event exists without timely funding)
    const finalizedEvent = events.find(e => e.eventType === 'CONTRACT_FINALIZED');
    const fundedEvent = events.find(e => e.eventType === 'MILESTONE_FUNDED');
    if (finalizedEvent && !fundedEvent) {
        const hoursSinceFinalized = (Date.now() - new Date(finalizedEvent.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceFinalized > 72) {
            score += 10;
            factors.push('Funding delayed >72h (+10)');
        }
    }

    // Dispute already raised
    const hasDispute = events.some(e => e.eventType === 'DISPUTE_RAISED');
    if (hasDispute) {
        score += 20;
        factors.push('Dispute already raised (+20)');
    }

    // Cap at 100
    score = Math.min(100, score);

    // Determine level
    let level: RiskLevel;
    if (score <= 25) level = 'LOW';
    else if (score <= 50) level = 'MODERATE';
    else if (score <= 75) level = 'HIGH';
    else level = 'CRITICAL';

    return { score, level, factors };
}
