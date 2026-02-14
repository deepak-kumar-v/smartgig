'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ContractStatus } from '@prisma/client';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';

// ============================================================================
// Contract Server Actions
// ============================================================================

/**
 * Creates a contract from an accepted proposal.
 * Only the client who owns the job can create a contract.
 * 
 * MANDATORY TRIAL-FIRST FLOW:
 * - If job.allowTrialTask && proposal.acceptsTrialTask → must create TRIAL first
 * - FULL contract only allowed after TRIAL is COMPLETE or if trial not applicable
 */
export async function createContractFromProposal(
    proposalId: string,
    contractType: 'TRIAL' | 'FULL'
) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can create contracts." };
    }

    try {
        // 1. Get Client Profile
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return { success: false, error: "Client profile not found." };
        }

        // 2. Get Proposal with Job, existing contracts, and conversation
        const proposal = await db.proposal.findUnique({
            where: { id: proposalId },
            include: {
                job: { select: { clientId: true, title: true, allowTrialTask: true } },
                contracts: { select: { id: true, type: true, status: true } },
                conversation: { select: { id: true } }
            }
        });

        if (!proposal) {
            return { success: false, error: "Proposal not found." };
        }

        // 3. Authorization: Must own the job
        if (proposal.job.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this job." };
        }

        // 4. Proposal must be ACCEPTED
        if (proposal.status !== "ACCEPTED") {
            return { success: false, error: "Contract can only be created from accepted proposals." };
        }

        // 5. Check existing contracts for this type
        const existingTrialContract = proposal.contracts.find(c => c.type === 'TRIAL');
        const existingFullContract = proposal.contracts.find(c => c.type === 'FULL');

        // Trial eligibility: BOTH job allows AND freelancer opted in
        const trialRequired = proposal.job.allowTrialTask && proposal.acceptsTrialTask;

        // 6. Validate contract type creation rules
        if (contractType === 'TRIAL') {
            // Check trial is allowed
            if (!proposal.job.allowTrialTask) {
                return { success: false, error: "This job does not allow trial tasks." };
            }
            if (!proposal.acceptsTrialTask) {
                return { success: false, error: "Freelancer did not opt into trial tasks." };
            }
            // Prevent duplicate TRIAL
            if (existingTrialContract) {
                return { success: false, error: "A trial contract already exists for this proposal." };
            }
        }

        if (contractType === 'FULL') {
            // Prevent duplicate FULL
            if (existingFullContract) {
                return { success: false, error: "A full contract already exists for this proposal." };
            }

            // MANDATORY TRIAL-FIRST: If trial is required, must complete trial before full
            if (trialRequired) {
                if (!existingTrialContract) {
                    return { success: false, error: "Trial contract must be completed first." };
                }
                if (existingTrialContract.status !== ContractStatus.COMPLETED) {
                    return { success: false, error: "Trial contract must be marked complete before creating full contract." };
                }
            }
        }

        // 7. Create Contract
        const contract = await db.contract.create({
            data: {
                proposalId: proposal.id,
                clientId: clientProfile.id,
                freelancerId: proposal.freelancerId,
                title: contractType === 'TRIAL'
                    ? `Trial: ${proposal.job.title}`
                    : proposal.job.title,
                // EMPTY SHELL: Client must explicitly set budget and terms.
                totalBudget: 0,
                type: contractType,
                terms: "",
                status: ContractStatus.DRAFT,
                // Dates must be explicitly set by client later
                startDate: null,
                endDate: null
            }
        });

        // 8. Attach contractId to existing conversation (use latest contract)
        if (proposal.conversation) {
            await db.conversation.update({
                where: { id: proposal.conversation.id },
                data: { contractId: contract.id }
            });
        }

        // Lifecycle Event: CONTRACT_DRAFTED
        recordLifecycleEvent({
            contractId: contract.id,
            proposalId: proposal.id,
            jobId: proposal.jobId,
            eventType: 'CONTRACT_DRAFTED',
            devState: 'DRAFT',
            userMessage: `${contractType === 'TRIAL' ? 'Trial' : 'Standard'} contract drafted: "${contract.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { contractType },
        });

        // 9. Revalidation
        revalidatePath('/client/contracts');
        revalidatePath(`/client/proposals/${proposalId}`);
        revalidatePath('/freelancer/contracts');
        revalidatePath('/messages');

        return { success: true, contractId: contract.id };

    } catch (error) {
        console.error("Create contract error:", error);
        return { success: false, error: "Failed to create contract." };
    }
}

/**
 * Creates a FULL contract after a TRIAL contract is completed.
 * Used for the post-trial "Proceed with Full Contract" flow.
 */
export async function createFullContractFromTrial(trialContractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can create contracts." };
    }

    try {
        // 1. Get Client Profile
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return { success: false, error: "Client profile not found." };
        }

        // 2. Get Trial Contract with Proposal and Conversation
        const trialContract = await db.contract.findUnique({
            where: { id: trialContractId },
            include: {
                proposal: {
                    include: {
                        job: { select: { title: true, clientId: true } },
                        contracts: { select: { type: true } }
                    }
                },
                conversation: { select: { id: true } }
            }
        });

        if (!trialContract) {
            return { success: false, error: "Trial contract not found." };
        }

        // 3. Authorization: Must own the contract
        if (trialContract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this contract." };
        }

        // 4. Must be a TRIAL type
        if (trialContract.type !== 'TRIAL') {
            return { success: false, error: "This is not a trial contract." };
        }

        // 5. Trial must be COMPLETE
        if (trialContract.status !== ContractStatus.COMPLETED) {
            return { success: false, error: "Trial contract must be marked complete first." };
        }

        // 6. Prevent duplicate FULL contract
        const existingFull = trialContract.proposal.contracts.find((c: { type: string }) => c.type === 'FULL');
        if (existingFull) {
            return { success: false, error: "A full contract already exists for this proposal." };
        }

        // 7. Create NEW FULL Contract
        const fullContract = await db.contract.create({
            data: {
                proposalId: trialContract.proposalId,
                clientId: clientProfile.id,
                freelancerId: trialContract.freelancerId,
                title: trialContract.proposal.job.title,
                totalBudget: 0,
                type: 'FULL',
                terms: "",
                status: ContractStatus.DRAFT,
                // Dates must be explicitly set by client later
                startDate: null,
                endDate: null
            }
        });

        // 8. Attach contractId to existing conversation
        // This ensures the conversation context moves to the new Standard contract
        if (trialContract.conversation) {
            await db.conversation.update({
                where: { id: trialContract.conversation.id },
                data: { contractId: fullContract.id }
            });
        }

        // 9. Revalidation
        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${trialContractId}`);
        revalidatePath('/freelancer/contracts');

        return { success: true, contractId: fullContract.id };

    } catch (error) {
        console.error("Create full contract from trial error:", error);
        return { success: false, error: "Failed to create full contract." };
    }
}

/**
 * Updates a DRAFT contract.
 * Only the client who owns the contract can update it.
 */
export async function updateContract(
    contractId: string,
    patchData: {
        title?: string;
        totalBudget?: number;
        terms?: string;
        startDate?: Date;
        endDate?: Date;
    }
) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can update contracts." };
    }

    try {
        // 1. Get Client Profile
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return { success: false, error: "Client profile not found." };
        }

        // 2. Get Contract
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        // 3. Authorization
        if (contract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this contract." };
        }

        // 4. Status check - DRAFT ONLY (Strict Phase 1)
        if (contract.status !== ContractStatus.DRAFT) {
            return { success: false, error: "Contract can only be edited in DRAFT status." };
        }

        // 5. Update Contract
        await db.contract.update({
            where: { id: contractId },
            data: {
                ...(patchData.title && { title: patchData.title }),
                ...(patchData.totalBudget && { totalBudget: patchData.totalBudget }),
                ...(patchData.terms && { terms: patchData.terms }),
                ...(patchData.startDate && { startDate: patchData.startDate }),
                ...(patchData.endDate && { endDate: patchData.endDate })
            }
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };

    } catch (error) {
        console.error("Update contract error:", error);
        return { success: false, error: "Failed to update contract." };
    }
}

/**
 * Freelancer accepts a contract.
 * Contract becomes ACTIVE and immutable.
 */
export async function acceptContract(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { success: false, error: "Unauthorized. Only freelancers can accept contracts." };
    }

    try {
        // 1. Get Freelancer Profile
        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!freelancerProfile) {
            return { success: false, error: "Freelancer profile not found." };
        }

        // 2. Get Contract
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        // 4. Status check
        if (contract.status !== ContractStatus.PENDING_REVIEW) {
            return { success: false, error: `Cannot accept contract. Current status: ${contract.status}. Must be PENDING_REVIEW.` };
        }

        // 5. Update to ACCEPTED (Phase 1: No funding/active yet)
        await db.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.ACCEPTED,
                acceptedAt: new Date()
            }
        });

        // Phase 1: No Mock Escrow or Fund release yet.

        // Lifecycle Event: CONTRACT_ACCEPTED
        recordLifecycleEvent({
            contractId,
            eventType: 'CONTRACT_ACCEPTED',
            devState: 'ACCEPTED',
            userMessage: 'Freelancer accepted the contract',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        revalidatePath('/client/contracts');
        revalidatePath('/freelancer/contracts');

        return { success: true };

    } catch (error) {
        console.error("Accept contract error:", error);
        return { success: false, error: "Failed to accept contract." };
    }
}

/**
 * Client sends contract for review.
 * DRAFT -> PENDING_REVIEW
 */
export async function sendForReview(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can send for review." };
    }

    try {
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) return { success: false, error: "Contract not found." };

        // Auth check (Client ownership)
        // We'll perform a quick check via DB query above or simple check here if we trust ID access pattern, 
        // but better to check ownership.
        const clientProfile = await db.clientProfile.findUnique({ where: { userId: session.user.id } });
        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized." };
        }

        if (contract.status !== ContractStatus.DRAFT) {
            return { success: false, error: "Contract must be DRAFT to send for review." };
        }

        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.PENDING_REVIEW }
        });

        // Lifecycle Event: SENT_FOR_REVIEW
        recordLifecycleEvent({
            contractId,
            eventType: 'SENT_FOR_REVIEW',
            devState: 'PENDING_REVIEW',
            userMessage: 'Contract sent for freelancer review',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        return { success: true };

    } catch (error) {
        return { success: false, error: "Failed to send for review." };
    }
}

/**
 * Freelancer requests changes.
 * PENDING_REVIEW -> DRAFT
 */
export async function requestChanges(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { success: false, error: "Unauthorized." };
    }

    try {
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { freelancer: true }
        });

        if (!contract) return { success: false, error: "Contract not found." };
        if (contract.freelancer.userId !== session.user.id) {
            return { success: false, error: "Unauthorized." };
        }

        if (contract.status !== ContractStatus.PENDING_REVIEW) {
            return { success: false, error: "Contract must be PENDING_REVIEW to request changes." };
        }

        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.DRAFT }
        });

        // Lifecycle Event: CHANGES_REQUESTED
        recordLifecycleEvent({
            contractId,
            eventType: 'CHANGES_REQUESTED',
            devState: 'DRAFT',
            userMessage: 'Freelancer requested changes to the contract',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        return { success: true };

    } catch (error) {
        return { success: false, error: "Failed to request changes." };
    }
}

/**
 * Client finalizes contract.
 * ACCEPTED -> FINALIZED
 */
export async function finalizeContract(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized." };
    }

    try {
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) return { success: false, error: "Contract not found." };

        const clientProfile = await db.clientProfile.findUnique({ where: { userId: session.user.id } });
        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized." };
        }

        if (contract.status !== ContractStatus.ACCEPTED) {
            return { success: false, error: "Contract must be ACCEPTED to finalize." };
        }

        await db.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.FINALIZED,
                finalizedAt: new Date()
            }
        });

        // Lifecycle Event: CONTRACT_FINALIZED
        recordLifecycleEvent({
            contractId,
            eventType: 'CONTRACT_FINALIZED',
            devState: 'FINALIZED',
            userMessage: 'Contract finalized by client',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        return { success: true };

    } catch (error) {
        return { success: false, error: "Failed to finalize contract." };
    }
}

/**
 * Freelancer rejects a contract.
 */
export async function rejectContract(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { success: false, error: "Unauthorized. Only freelancers can reject contracts." };
    }

    try {
        // 1. Get Freelancer Profile
        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!freelancerProfile) {
            return { success: false, error: "Freelancer profile not found." };
        }

        // 2. Get Contract
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        // 3. Authorization
        if (contract.freelancerId !== freelancerProfile.id) {
            return { success: false, error: "Unauthorized. This contract is not for you." };
        }

        // 4. Status check
        if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING_REVIEW) {
            return { success: false, error: `Cannot reject contract in '${contract.status}' status.` };
        }

        // 5. Update to REJECTED
        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.REJECTED }
        });

        // Lifecycle Event: CONTRACT_REJECTED
        recordLifecycleEvent({
            contractId,
            eventType: 'CONTRACT_REJECTED',
            devState: 'REJECTED',
            userMessage: 'Freelancer rejected the contract',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        revalidatePath('/client/contracts');
        revalidatePath('/freelancer/contracts');

        return { success: true };

    } catch (error) {
        console.error("Reject contract error:", error);
        return { success: false, error: "Failed to reject contract." };
    }
}

/**
 * Get contract details for a user (either client or freelancer)
 */
export async function getContractDetails(contractId: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Not authenticated." };
    }

    try {
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: {
                    include: { user: { select: { name: true, email: true, image: true } } }
                },
                freelancer: {
                    include: { user: { select: { name: true, email: true, image: true } } }
                },
                proposal: {
                    select: { id: true, coverLetter: true, milestones: true }
                },
                conversation: { select: { id: true } }
            }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        // Authorization: User must be either client or freelancer on the contract
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;

        if (!isClient && !isFreelancer) {
            return { success: false, error: "Unauthorized to view this contract." };
        }

        return {
            success: true,
            contract,
            role: isClient ? 'CLIENT' : 'FREELANCER'
        };

    } catch (error) {
        console.error("Get contract error:", error);
        return { success: false, error: "Failed to fetch contract." };
    }
}

/**
 * Deletes a DRAFT contract.
 * Only the client who owns the contract can delete it.
 * This is a hard delete.
 */
export async function deleteContract(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "CLIENT") {
        return { success: false, error: "Unauthorized. Only clients can delete contracts." };
    }

    try {
        // 1. Get Contract
        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        // 2. Authorization
        // Get Client Profile ID
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized. You do not own this contract." };
        }

        // 3. Status Check
        if (contract.status !== ContractStatus.DRAFT) {
            return { success: false, error: "Only draft contracts can be deleted." };
        }

        // 4. Delete
        await db.contract.delete({
            where: { id: contractId }
        });

        // 5. Revalidate
        revalidatePath('/client/contracts');
        revalidatePath('/freelancer/contracts');

        return { success: true };

    } catch (error) {
        console.error("Delete contract error:", error);
        return { success: false, error: "Failed to delete contract." };
    }
}
