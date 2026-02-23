'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { ContractStatus, ChangeRequestStatus } from '@prisma/client';

// ============================================================================
// Milestone Change Request Actions — Freelancer Proposal System
// ============================================================================

/**
 * FREELANCER: Creates a change request for a milestone.
 * Only allowed when contract is DRAFT and escrow is not funded.
 */
export async function createChangeRequest(
    milestoneId: string,
    data: {
        proposedTitle?: string;
        proposedDescription?: string;
        proposedAmount?: number;
        proposedDueDate?: Date;
        reason: string;
    }
): Promise<{ success?: boolean; error?: string; requestId?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'FREELANCER') {
            return { error: 'Unauthorized. Only freelancers can create change requests.' };
        }

        if (!data.reason || data.reason.trim().length === 0) {
            return { error: 'Reason is required for a change request' };
        }

        if (data.proposedAmount !== undefined && data.proposedAmount <= 0) {
            return { error: 'Proposed amount must be greater than zero' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: { include: { freelancer: true, escrowAccount: true } },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };

        // Ownership
        if (milestone.contract.freelancer.userId !== session.user.id) {
            return { error: 'Unauthorized. You are not the freelancer on this contract.' };
        }

        // Guard: DRAFT + no escrow
        if (milestone.contract.status !== ContractStatus.DRAFT) {
            return { error: 'Change requests can only be made when contract is in DRAFT status' };
        }
        if (milestone.contract.escrowAccount) {
            return { error: 'Change requests cannot be made after escrow has been funded' };
        }

        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id },
        });
        if (!freelancerProfile) {
            return { error: 'Freelancer profile not found' };
        }

        const request = await db.milestoneChangeRequest.create({
            data: {
                milestoneId,
                freelancerId: freelancerProfile.id,
                proposedTitle: data.proposedTitle ?? null,
                proposedDescription: data.proposedDescription ?? null,
                proposedAmount: data.proposedAmount ?? null,
                proposedDueDate: data.proposedDueDate ?? null,
                reason: data.reason,
                status: ChangeRequestStatus.PENDING,
            },
        });

        recordLifecycleEvent({
            contractId: milestone.contractId,
            milestoneId,
            eventType: 'CHANGE_REQUEST_CREATED',
            devState: 'DRAFT',
            userMessage: `Freelancer requested changes to milestone: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        return { success: true, requestId: request.id };
    } catch (error) {
        console.error('[createChangeRequest] Error:', error);
        return { error: 'Failed to create change request' };
    }
}

/**
 * CLIENT: Accepts a change request. Applies changes atomically and recalculates totalBudget.
 */
export async function acceptChangeRequest(requestId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can accept change requests.' };
        }

        const request = await db.milestoneChangeRequest.findUnique({
            where: { id: requestId },
            include: {
                milestone: {
                    include: {
                        contract: { include: { client: true, escrowAccount: true } },
                    },
                },
            },
        });

        if (!request) return { error: 'Change request not found' };

        // Ownership
        if (request.milestone.contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        // Status guard
        if (request.status !== ChangeRequestStatus.PENDING) {
            return { error: `Change request is already ${request.status}` };
        }

        // Contract guard
        if (request.milestone.contract.status !== ContractStatus.DRAFT) {
            return { error: 'Change requests can only be processed when contract is in DRAFT status' };
        }
        if (request.milestone.contract.escrowAccount) {
            return { error: 'Change requests cannot be processed after escrow has been funded' };
        }

        const contractId = request.milestone.contractId;

        // Atomic: apply changes + recalculate totalBudget
        await db.$transaction(async (tx) => {
            // Apply proposed changes to milestone
            const milestoneUpdate: Record<string, unknown> = {};
            if (request.proposedTitle) milestoneUpdate.title = request.proposedTitle;
            if (request.proposedDescription) milestoneUpdate.description = request.proposedDescription;
            if (request.proposedAmount !== null) milestoneUpdate.amount = request.proposedAmount;
            if (request.proposedDueDate !== null) milestoneUpdate.dueDate = request.proposedDueDate;

            if (Object.keys(milestoneUpdate).length > 0) {
                await tx.milestone.update({
                    where: { id: request.milestoneId },
                    data: milestoneUpdate,
                });
            }

            // Recalculate totalBudget
            const result = await tx.milestone.aggregate({
                where: { contractId },
                _sum: { amount: true },
            });
            const sumAmount = result._sum.amount ?? 0;
            const totalBudget = typeof sumAmount === 'object' && 'toNumber' in sumAmount
                ? (sumAmount as { toNumber: () => number }).toNumber()
                : Number(sumAmount);
            await tx.contract.update({
                where: { id: contractId },
                data: { totalBudget },
            });

            // Mark request as accepted
            await tx.milestoneChangeRequest.update({
                where: { id: requestId },
                data: {
                    status: ChangeRequestStatus.ACCEPTED,
                    resolvedAt: new Date(),
                },
            });
        });

        recordLifecycleEvent({
            contractId,
            milestoneId: request.milestoneId,
            eventType: 'CHANGE_REQUEST_ACCEPTED',
            devState: 'DRAFT',
            userMessage: `Client accepted change request for milestone: "${request.milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[acceptChangeRequest] Error:', error);
        return { error: 'Failed to accept change request' };
    }
}

/**
 * CLIENT: Rejects a change request. No data mutation.
 */
export async function rejectChangeRequest(requestId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can reject change requests.' };
        }

        const request = await db.milestoneChangeRequest.findUnique({
            where: { id: requestId },
            include: {
                milestone: {
                    include: { contract: { include: { client: true } } },
                },
            },
        });

        if (!request) return { error: 'Change request not found' };

        if (request.milestone.contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        if (request.status !== ChangeRequestStatus.PENDING) {
            return { error: `Change request is already ${request.status}` };
        }

        await db.milestoneChangeRequest.update({
            where: { id: requestId },
            data: {
                status: ChangeRequestStatus.REJECTED,
                resolvedAt: new Date(),
            },
        });

        recordLifecycleEvent({
            contractId: request.milestone.contractId,
            milestoneId: request.milestoneId,
            eventType: 'CHANGE_REQUEST_REJECTED',
            devState: 'DRAFT',
            userMessage: `Client rejected change request for milestone: "${request.milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${request.milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${request.milestone.contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[rejectChangeRequest] Error:', error);
        return { error: 'Failed to reject change request' };
    }
}
