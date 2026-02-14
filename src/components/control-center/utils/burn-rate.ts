/**
 * Escrow Burn Rate Tracker
 *
 * Computes daily burn rate from real escrow data and estimates remaining days.
 */

export interface BurnRateResult {
    burnRatePerDay: number;
    estimatedDaysRemaining: number | null;
    totalFunded: number;
    totalReleased: number;
    daysActive: number;
}

interface BurnRateInput {
    contractStatus: string | null;
    totalDeposited: number;
    totalReleased: number;
    balance: number;
    events: { eventType: string; createdAt: string }[];
}

export function computeBurnRate({
    contractStatus,
    totalDeposited,
    totalReleased,
    balance,
    events,
}: BurnRateInput): BurnRateResult {
    // Find when contract became active
    const activeEvent = events.find(e =>
        e.eventType === 'CONTRACT_ACTIVATED' || e.eventType === 'MILESTONE_FUNDED'
    );

    if (!activeEvent || totalDeposited === 0) {
        return {
            burnRatePerDay: 0,
            estimatedDaysRemaining: null,
            totalFunded: totalDeposited,
            totalReleased: totalReleased,
            daysActive: 0,
        };
    }

    const activeDate = new Date(activeEvent.createdAt).getTime();
    const now = Date.now();
    const daysActive = Math.max(1, (now - activeDate) / (1000 * 60 * 60 * 24));

    // Burn rate = released amount per day
    const burnRatePerDay = totalReleased > 0 ? totalReleased / daysActive : 0;

    // Estimate remaining days
    let estimatedDaysRemaining: number | null = null;
    if (burnRatePerDay > 0 && balance > 0) {
        estimatedDaysRemaining = Math.round(balance / burnRatePerDay);
    }

    return {
        burnRatePerDay: Math.round(burnRatePerDay * 100) / 100,
        estimatedDaysRemaining,
        totalFunded: totalDeposited,
        totalReleased,
        daysActive: Math.round(daysActive),
    };
}
