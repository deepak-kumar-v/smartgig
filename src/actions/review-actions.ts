'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { updateTrustScore } from '@/lib/trust-score';

// ─── Submit Review ──────────────────────────────────────────────────────────
// Validates, writes to DB, triggers trust score update.
// COMPLETELY NON-BLOCKING — does not affect any contract/escrow/dispute flow.

interface SubmitReviewInput {
    contractId: string;
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
    reliability: number;
    comment: string;
    reviewTitle?: string;      // FIX 6: Optional context
    projectSummary?: string;   // FIX 6: Optional context
}

export async function submitReview(input: SubmitReviewInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        const userId = session.user.id;

        // 1. Validate dimensions (1-5)
        const dims = [input.quality, input.communication, input.timeliness, input.professionalism, input.reliability];
        if (dims.some(d => d < 1 || d > 5 || !Number.isInteger(d))) {
            return { error: 'All ratings must be integers between 1 and 5' };
        }

        // 2. Validate comment
        if (!input.comment || input.comment.trim().length < 20) {
            return { error: 'Review must be at least 20 characters' };
        }

        // 3. Fetch contract with related profiles
        const contract = await db.contract.findUnique({
            where: { id: input.contractId },
            include: {
                client: { select: { userId: true } },
                freelancer: { select: { id: true, userId: true } },
            },
        });

        if (!contract) {
            return { error: 'Contract not found' };
        }

        // 4. FIX 5: STRICT status validation — ONLY completed/closed
        if (!['COMPLETED', 'CLOSED'].includes(contract.status)) {
            return { error: 'Reviews can only be submitted for completed contracts. Current status: ' + contract.status };
        }

        // 5. Ensure user is party to this contract
        const isClient = contract.client.userId === userId;
        const isFreelancer = contract.freelancer.userId === userId;
        if (!isClient && !isFreelancer) {
            return { error: 'You are not a party to this contract' };
        }

        // 6. Check for duplicate (unique constraint: [contractId, reviewerId])
        const existing = await db.review.findUnique({
            where: {
                contractId_reviewerId: {
                    contractId: input.contractId,
                    reviewerId: userId,
                },
            },
        });

        if (existing) {
            return { error: 'You have already submitted a review for this contract' };
        }

        // 7. Determine reviewer/reviewee
        const revieweeId = isClient ? contract.freelancer.userId : contract.client.userId;
        const reviewerRole = isClient ? 'CLIENT' : 'FREELANCER';

        // 8. Compute overall rating (avg of dimensions, rounded)
        const overall = Math.round(
            (input.quality + input.communication + input.timeliness + input.professionalism + input.reliability) / 5
        );

        // 9. Write to DB — includes optional context fields (FIX 6)
        await db.review.create({
            data: {
                contractId: input.contractId,
                freelancerId: contract.freelancer.id,
                reviewerId: userId,
                revieweeId: revieweeId,
                reviewerRole: reviewerRole,
                quality: input.quality,
                communication: input.communication,
                timeliness: input.timeliness,
                professionalism: input.professionalism,
                reliability: input.reliability,
                rating: overall,
                comment: input.comment.trim(),
                reviewTitle: input.reviewTitle?.trim() || null,
                projectSummary: input.projectSummary?.trim() || null,
            },
        });

        // 10. Trigger trust score recalculation for reviewee (non-blocking, fire-and-forget)
        updateTrustScore(revieweeId).catch((err) => {
            console.error('Trust score update failed (non-blocking):', err);
        });

        // 11. Revalidate relevant paths
        revalidatePath('/freelancer/dashboard');
        revalidatePath('/freelancer/profile');
        revalidatePath('/freelancer/overview');
        revalidatePath('/client/dashboard');

        return { success: true };
    } catch (error) {
        console.error('Review submission error:', error);
        return { error: 'Failed to submit review. Please try again.' };
    }
}

// ─── FIX 2: Contract Review Status (Dual Review Tracking) ──────────────────
// Returns which parties have submitted reviews for a specific contract.
// PURELY READ-ONLY — no blocking, no side effects.

export interface ContractReviewStatus {
    clientSubmitted: boolean;
    freelancerSubmitted: boolean;
    clientReviewId: string | null;
    freelancerReviewId: string | null;
}

export async function getContractReviewStatus(contractId: string): Promise<ContractReviewStatus> {
    const reviews = await db.review.findMany({
        where: { contractId },
        select: {
            id: true,
            reviewerRole: true,
        },
    });

    const clientReview = reviews.find(r => r.reviewerRole === 'CLIENT');
    const freelancerReview = reviews.find(r => r.reviewerRole === 'FREELANCER');

    return {
        clientSubmitted: !!clientReview,
        freelancerSubmitted: !!freelancerReview,
        clientReviewId: clientReview?.id || null,
        freelancerReviewId: freelancerReview?.id || null,
    };
}

// ─── FIX 3: Enhanced Pending Reviews ────────────────────────────────────────
// Returns completed contracts where the user hasn't left a review yet.
// Includes the user's role in each contract for proper routing.
// PURELY READ-ONLY — no blocking, no side effects.

export interface PendingReview {
    contractId: string;
    title: string;
    type: string;
    otherPartyName: string;
    userRole: 'CLIENT' | 'FREELANCER';
}

export async function getPendingReviews(userId: string): Promise<PendingReview[]> {
    try {
        // Find user's profiles
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                freelancerProfile: { select: { id: true } },
                clientProfile: { select: { id: true } },
            },
        });

        if (!user) return [];

        const orConditions = [];
        if (user.freelancerProfile) {
            orConditions.push({ freelancerId: user.freelancerProfile.id });
        }
        if (user.clientProfile) {
            orConditions.push({ clientId: user.clientProfile.id });
        }
        if (orConditions.length === 0) return [];

        // Find completed contracts where user is a party
        const contracts = await db.contract.findMany({
            where: {
                status: { in: ['COMPLETED', 'CLOSED'] },
                OR: orConditions,
            },
            include: {
                reviews: {
                    where: { reviewerId: userId },
                    select: { id: true },
                },
                client: {
                    select: {
                        id: true,
                        user: { select: { name: true } },
                    },
                },
                freelancer: {
                    select: {
                        id: true,
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { endDate: 'desc' },
        });

        // Filter to contracts WITHOUT a review from this user
        return contracts
            .filter(c => c.reviews.length === 0)
            .map(c => {
                const isClient = user.clientProfile?.id === c.client.id;
                return {
                    contractId: c.id,
                    title: c.title,
                    type: c.type,
                    otherPartyName: isClient
                        ? (c.freelancer.user.name || 'Freelancer')
                        : (c.client.user.name || 'Client'),
                    userRole: (isClient ? 'CLIENT' : 'FREELANCER') as 'CLIENT' | 'FREELANCER',
                };
            });
    } catch (error) {
        console.error('getPendingReviews error:', error);
        return [];
    }
}

// ─── Get Review Breakdown ───────────────────────────────────────────────────
// Aggregate dimensional averages for a freelancer profile.
// PURELY READ-ONLY.

export interface ReviewBreakdown {
    avgQuality: number;
    avgCommunication: number;
    avgTimeliness: number;
    avgProfessionalism: number;
    avgReliability: number;
    avgOverall: number;
    totalReviews: number;
}

export async function getReviewBreakdown(freelancerProfileId: string): Promise<ReviewBreakdown> {
    const reviews = await db.review.findMany({
        where: { freelancerId: freelancerProfileId },
        select: {
            quality: true,
            communication: true,
            timeliness: true,
            professionalism: true,
            reliability: true,
            rating: true,
        },
    });

    if (reviews.length === 0) {
        return {
            avgQuality: 0,
            avgCommunication: 0,
            avgTimeliness: 0,
            avgProfessionalism: 0,
            avgReliability: 0,
            avgOverall: 0,
            totalReviews: 0,
        };
    }

    const n = reviews.length;
    return {
        avgQuality: Number((reviews.reduce((s, r) => s + r.quality, 0) / n).toFixed(1)),
        avgCommunication: Number((reviews.reduce((s, r) => s + r.communication, 0) / n).toFixed(1)),
        avgTimeliness: Number((reviews.reduce((s, r) => s + r.timeliness, 0) / n).toFixed(1)),
        avgProfessionalism: Number((reviews.reduce((s, r) => s + r.professionalism, 0) / n).toFixed(1)),
        avgReliability: Number((reviews.reduce((s, r) => s + r.reliability, 0) / n).toFixed(1)),
        avgOverall: Number((reviews.reduce((s, r) => s + r.rating, 0) / n).toFixed(1)),
        totalReviews: n,
    };
}
