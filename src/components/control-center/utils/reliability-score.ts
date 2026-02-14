/**
 * Freelancer Reliability Score
 *
 * Weighted score derived from real lifecycle events.
 * Starts at 100, subtracts for negative signals.
 */

export type ReliabilityGrade = 'A' | 'B' | 'C' | 'D';

export interface ReliabilityResult {
    score: number;
    grade: ReliabilityGrade;
    deductions: string[];
}

interface ReliabilityInput {
    events: { eventType: string; createdAt: string }[];
    changeRequests: number;
    deadlockCount: number;
}

export function computeReliabilityScore({
    events,
    changeRequests,
    deadlockCount,
}: ReliabilityInput): ReliabilityResult {
    let score = 100;
    const deductions: string[] = [];

    // Funding delay (freelancer delayed after funding)
    const fundedEvent = events.find(e => e.eventType === 'MILESTONE_FUNDED');
    const activeEvent = events.find(e => e.eventType === 'CONTRACT_ACTIVATED');
    if (fundedEvent && !activeEvent) {
        const hours = (Date.now() - new Date(fundedEvent.createdAt).getTime()) / (1000 * 60 * 60);
        if (hours > 48) {
            score -= 15;
            deductions.push('Start delay after funding (-15)');
        }
    } else if (fundedEvent && activeEvent) {
        const delay = (new Date(activeEvent.createdAt).getTime() - new Date(fundedEvent.createdAt).getTime()) / (1000 * 60 * 60);
        if (delay > 48) {
            score -= 10;
            deductions.push('Slow start after funding (-10)');
        }
    }

    // Change requests indicate rework
    if (changeRequests >= 3) {
        score -= 10;
        deductions.push(`${changeRequests} change requests (-10)`);
    }

    // Deadlock frequency
    if (deadlockCount > 0) {
        const penalty = Math.min(30, deadlockCount * 10);
        score -= penalty;
        deductions.push(`${deadlockCount} deadlock(s) detected (-${penalty})`);
    }

    // Dispute raised
    const hasDispute = events.some(e => e.eventType === 'DISPUTE_RAISED');
    if (hasDispute) {
        score -= 20;
        deductions.push('Dispute raised (-20)');
    }

    // Clamp
    score = Math.max(0, Math.min(100, score));

    // Grade
    let grade: ReliabilityGrade;
    if (score >= 85) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 50) grade = 'C';
    else grade = 'D';

    return { score, grade, deductions };
}
