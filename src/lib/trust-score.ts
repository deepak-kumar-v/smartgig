import { db } from '@/lib/db';

/**
 * Trust Score Computation Engine v2
 * 
 * PURE COMPUTATION — reads data, computes score, writes ONLY to user.trustScore.
 * Does NOT interfere with contracts, escrow, disputes, or any other system.
 * 
 * Formula:
 *   ratingScore (0-40):     (avgDimension / 5) × 40
 *   completionScore (0-20): (completed / total) × 20
 *   consistencyScore (0-20): penalizes high variance in ratings
 *   strikePenalty:           activeStrikes × 10
 *   disputePenalty:          disputesLost × 5
 * 
 *   trustScore = ratingScore + completionScore + consistencyScore
 *              - strikePenalty - disputePenalty
 *   Clamped to [0, 100]
 */

export async function calculateTrustScore(userId: string): Promise<number> {
    // 1. Get all reviews RECEIVED by this user
    const reviews = await db.review.findMany({
        where: { revieweeId: userId },
        select: {
            quality: true,
            communication: true,
            timeliness: true,
            professionalism: true,
            reliability: true,
            rating: true,
        },
    });

    // 2. Get active strikes
    const activeStrikes = await db.strike.count({
        where: { userId, isActive: true },
    });

    // 3. Get contract completion ratio
    const freelancerProfile = await db.freelancerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    const clientProfile = await db.clientProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    let totalContracts = 0;
    let completedContracts = 0;

    if (freelancerProfile) {
        const [total, completed] = await Promise.all([
            db.contract.count({
                where: {
                    freelancerId: freelancerProfile.id,
                    status: { notIn: ['DRAFT'] },
                },
            }),
            db.contract.count({
                where: {
                    freelancerId: freelancerProfile.id,
                    status: { in: ['COMPLETED', 'CLOSED'] },
                },
            }),
        ]);
        totalContracts += total;
        completedContracts += completed;
    }

    if (clientProfile) {
        const [total, completed] = await Promise.all([
            db.contract.count({
                where: {
                    clientId: clientProfile.id,
                    status: { notIn: ['DRAFT'] },
                },
            }),
            db.contract.count({
                where: {
                    clientId: clientProfile.id,
                    status: { in: ['COMPLETED', 'CLOSED'] },
                },
            }),
        ]);
        totalContracts += total;
        completedContracts += completed;
    }

    // 4. Get dispute losses (uses actual DisputeOutcome enum: FULL_REFUND = freelancer lost, FULL_RELEASE = client lost)
    let disputesLost = 0;
    try {
        if (freelancerProfile) {
            // Get freelancer's contract IDs, then count disputes where outcome = FULL_REFUND
            const freelancerContractIds = await db.contract.findMany({
                where: { freelancerId: freelancerProfile.id },
                select: { id: true },
            });
            if (freelancerContractIds.length > 0) {
                disputesLost += await db.dispute.count({
                    where: {
                        contractId: { in: freelancerContractIds.map(c => c.id) },
                        status: 'RESOLVED',
                        outcome: 'FULL_REFUND',
                    },
                });
            }
        }
        if (clientProfile) {
            // Get client's contract IDs, then count disputes where outcome = FULL_RELEASE
            const clientContractIds = await db.contract.findMany({
                where: { clientId: clientProfile.id },
                select: { id: true },
            });
            if (clientContractIds.length > 0) {
                disputesLost += await db.dispute.count({
                    where: {
                        contractId: { in: clientContractIds.map(c => c.id) },
                        status: 'RESOLVED',
                        outcome: 'FULL_RELEASE',
                    },
                });
            }
        }
    } catch {
        // If dispute queries fail for any reason, ignore gracefully
        disputesLost = 0;
    }

    // ── Compute Components ──────────────────────────────────────────────

    // A. Rating Score (0-40)
    let ratingScore = 20; // Default: neutral if no reviews
    if (reviews.length > 0) {
        const avgQuality = reviews.reduce((s, r) => s + r.quality, 0) / reviews.length;
        const avgCommunication = reviews.reduce((s, r) => s + r.communication, 0) / reviews.length;
        const avgTimeliness = reviews.reduce((s, r) => s + r.timeliness, 0) / reviews.length;
        const avgProfessionalism = reviews.reduce((s, r) => s + r.professionalism, 0) / reviews.length;
        const avgReliability = reviews.reduce((s, r) => s + r.reliability, 0) / reviews.length;

        const dimensionAvg = (avgQuality + avgCommunication + avgTimeliness + avgProfessionalism + avgReliability) / 5;
        ratingScore = (dimensionAvg / 5) * 40;
    }

    // B. Completion Score (0-20)
    let completionScore = 10; // Default: neutral if no contracts
    if (totalContracts > 0) {
        const completionRate = completedContracts / totalContracts;
        completionScore = completionRate * 20;
    }

    // C. Consistency Score (0-20)
    // Low variance in ratings = high consistency = higher score
    let consistencyScore = 15; // Default: good if no reviews
    if (reviews.length >= 2) {
        const overallRatings = reviews.map(r => r.rating);
        const mean = overallRatings.reduce((s, v) => s + v, 0) / overallRatings.length;
        const variance = overallRatings.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / overallRatings.length;
        // Max variance for 1-5 scale is ~4. Normalize: 0 variance = 20, 4 variance = 0
        consistencyScore = Math.max(0, 20 - (variance / 4) * 20);
    }

    // D. Strike Penalty (10 per active strike)
    const strikePenalty = activeStrikes * 10;

    // E. Dispute Penalty (5 per dispute lost)
    const disputePenalty = disputesLost * 5;

    // ── Final Score ─────────────────────────────────────────────────────
    const rawScore = ratingScore + completionScore + consistencyScore - strikePenalty - disputePenalty;
    const score = Math.round(Math.min(100, Math.max(0, rawScore)));

    return score;
}

/**
 * Recalculate and persist trust score for a user.
 * Called after review submission — completely non-blocking to contract flow.
 */
export async function updateTrustScore(userId: string): Promise<number> {
    const score = await calculateTrustScore(userId);
    
    await db.user.update({
        where: { id: userId },
        data: { trustScore: score },
    });

    return score;
}
