'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';

const ProposalSchema = z.object({
    jobId: z.string(),
    coverLetter: z.string().min(50, { message: "Cover letter must be at least 50 characters long." }),
    price: z.coerce.number().min(1, { message: "Bid amount must be at least $1" }),
});

// ============================================================================
// V2 Submission Logic (Production Ready)
// ============================================================================

export interface Milestone {
    title: string;
    description: string;
    amount: number;
    duration: string;
}

export interface ProposalAttachment {
    name: string;
    size: number;
    type: string;
}

export interface HourlyWorkPlanEntry {
    title: string;
    description: string;
    hourRange?: string;
}

export interface ProposalPayload {
    jobId: string;
    coverLetter: string;
    proposedRate: number;
    rateType: 'HOURLY' | 'FIXED';
    estimatedDuration: string;
    availability: string;
    availabilityHoursPerWeek?: number;
    expectedStartDate?: Date;
    milestones: Milestone[];
    totalMilestoneAmount: number;
    selectedPortfolioIds: string[];
    attachments: ProposalAttachment[];
    screeningAnswers: Record<string, string>;
    acceptsTrialTask: boolean;
    trialTaskProposal?: string;
    contractToHireAcceptance?: boolean;
    isDraft?: boolean;
    lastEditedAt?: Date;
    privateNotes?: string;
    confidenceScore?: number;
    boosted?: boolean;
    // Hourly Work Plan (optional, non-binding)
    hourlyWorkPlan?: HourlyWorkPlanEntry[];
}

export async function submitProposalV2(payload: ProposalPayload) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { success: false, error: "Only freelancers can submit proposals." };
    }

    try {
        // 1. Get Freelancer Profile (include user for notification message)
        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id },
            include: { user: { select: { name: true } } }
        });

        if (!freelancerProfile) {
            return { success: false, error: "Freelancer profile not found." };
        }

        // 2. Validate Job exists and is OPEN (include title + client.userId for notification)
        const job = await db.jobPost.findUnique({
            where: { id: payload.jobId },
            select: {
                id: true,
                status: true,
                clientId: true,
                title: true,
                client: { select: { userId: true } }
            }
        });

        if (!job) {
            return { success: false, error: "Job does not exist." };
        }

        if (job.status !== "OPEN") {
            return { success: false, error: "This job is no longer accepting proposals." };
        }

        // 3. Prevent duplicate submissions (excluding drafts)
        if (!payload.isDraft) {
            const existingProposal = await db.proposal.findFirst({
                where: {
                    jobId: payload.jobId,
                    freelancerId: freelancerProfile.id,
                    status: { not: "DRAFT" }
                }
            });

            if (existingProposal) {
                return { success: false, error: "You have already applied to this job." };
            }
        }

        // 4. Persist Proposal
        const proposal = await db.proposal.create({
            data: {
                jobId: payload.jobId,
                freelancerId: freelancerProfile.id,
                clientId: job.clientId,

                // Core
                coverLetter: payload.coverLetter,
                proposedRate: payload.proposedRate,
                rateType: payload.rateType,
                availability: payload.availability,
                availabilityHoursPerWeek: payload.availabilityHoursPerWeek,
                expectedStartDate: payload.expectedStartDate,
                estimatedDuration: payload.estimatedDuration,

                // Trial / Contract
                acceptsTrialTask: payload.acceptsTrialTask,
                trialTaskProposal: payload.trialTaskProposal,
                contractToHireAcceptance: payload.contractToHireAcceptance,

                // Complex Data (JSON as Strings)
                milestones: JSON.stringify(payload.milestones),
                totalMilestoneAmount: payload.totalMilestoneAmount,
                screeningAnswers: JSON.stringify(payload.screeningAnswers),
                selectedPortfolioIds: JSON.stringify(payload.selectedPortfolioIds),
                attachments: JSON.stringify(payload.attachments),
                hourlyWorkPlan: payload.hourlyWorkPlan
                    ? JSON.stringify(payload.hourlyWorkPlan)
                    : null,

                // Meta
                status: payload.isDraft ? "DRAFT" : "SUBMITTED",
                isDraft: payload.isDraft ?? false,
                confidenceScore: payload.confidenceScore,
                boosted: payload.boosted,
                privateNotes: payload.privateNotes,
                lastEditedAt: payload.lastEditedAt || new Date(),
            }
        });

        // 5. Create Notification for Client (only for non-draft submissions)
        if (!payload.isDraft && job.client?.userId) {
            await db.notification.create({
                data: {
                    userId: job.client.userId,
                    type: "NEW_PROPOSAL",
                    title: "New proposal received",
                    message: `${freelancerProfile.user?.name || 'A freelancer'} applied to your job: ${job.title}`,
                    isRead: false
                }
            });
        }

        // 6. Create Conversation for messaging (only for non-draft submissions)
        if (!payload.isDraft && job.client?.userId) {
            const clientUserId = job.client.userId;
            const freelancerUserId = session.user.id!;

            const conversation = await db.conversation.create({
                data: {
                    proposalId: proposal.id
                }
            });

            // Add participants: freelancer and client
            await db.conversationParticipant.createMany({
                data: [
                    { conversationId: conversation.id, userId: freelancerUserId },
                    { conversationId: conversation.id, userId: clientUserId }
                ]
            });
        }

        // Lifecycle Event: PROPOSAL_SENT (non-draft only)
        if (!payload.isDraft) {
            recordLifecycleEvent({
                jobId: payload.jobId,
                proposalId: proposal.id,
                eventType: 'PROPOSAL_SENT',
                userMessage: `Proposal submitted for job "${job.title}"`,
                actorId: session.user.id,
                actorRole: 'FREELANCER',
                category: 'BUSINESS',
            });

            // CHAT_CREATED system event
            recordLifecycleEvent({
                jobId: payload.jobId,
                proposalId: proposal.id,
                eventType: 'CHAT_CREATED',
                devState: 'SYSTEM',
                userMessage: 'Conversation channel opened between client and freelancer',
                actorRole: 'SYSTEM',
                category: 'SYSTEM',
            });
        }

        // 7. Revalidation (all affected routes)
        revalidatePath('/freelancer/find-work');
        revalidatePath(`/freelancer/jobs/${payload.jobId}`);
        revalidatePath('/freelancer/proposals');
        revalidatePath('/client/dashboard');
        revalidatePath('/client/dashboard');
        revalidatePath('/client/dashboard-v3');
        revalidatePath('/client/jobs');
        revalidatePath(`/client/jobs/${payload.jobId}`);
        revalidatePath('/client/proposals');
        revalidatePath('/messages');

        return {
            success: true,
            proposalId: proposal.id
        };

    } catch (error) {
        console.error("Proposal submission error:", error);
        return { success: false, error: "An unexpected error occurred while saving your proposal." };
    }
}

// ============================================================================
// Proposal Decision Actions
// ============================================================================

export async function acceptProposal(proposalId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can accept proposals." };
    }

    try {
        // 1. Get Client Profile
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return { success: false, error: "Client profile not found." };
        }

        // 2. Get Proposal with Job
        const proposal = await db.proposal.findUnique({
            where: { id: proposalId },
            include: { job: { select: { clientId: true } } }
        });

        if (!proposal) {
            return { success: false, error: "Proposal not found." };
        }

        // 3. Authorization Check
        if (proposal.job.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this job." };
        }

        // 4. State Validation
        // if (proposal.status !== "SUBMITTED") {
        //     return { success: false, error: `Cannot accept proposal in '${proposal.status}' state.` };
        // }

        // 5. Update Status
        await db.proposal.update({
            where: { id: proposalId },
            data: {
                status: "ACCEPTED",
                lastEditedAt: new Date()
            }
        });

        revalidatePath('/client/proposals');
        revalidatePath(`/client/proposals/${proposalId}`);
        revalidatePath(`/client/jobs/${proposal.jobId}`);
        revalidatePath('/client/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Accept proposal error:", error);
        return { success: false, error: "Failed to accept proposal." };
    }
}

export async function rejectProposal(proposalId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can reject proposals." };
    }

    try {
        // 1. Get Client Profile
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return { success: false, error: "Client profile not found." };
        }

        // 2. Get Proposal with Job
        const proposal = await db.proposal.findUnique({
            where: { id: proposalId },
            include: { job: { select: { clientId: true } } }
        });

        if (!proposal) {
            return { success: false, error: "Proposal not found." };
        }

        // 3. Authorization Check
        if (proposal.job.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this job." };
        }

        // 4. Update Status
        await db.proposal.update({
            where: { id: proposalId },
            data: {
                status: "REJECTED",
                lastEditedAt: new Date()
            }
        });

        revalidatePath('/client/proposals');
        revalidatePath(`/client/proposals/${proposalId}`);
        revalidatePath(`/client/jobs/${proposal.jobId}`);
        revalidatePath('/client/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Reject proposal error:", error);
        return { success: false, error: "Failed to reject proposal." };
    }
}
