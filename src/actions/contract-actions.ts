'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ContractStatus, Prisma } from '@prisma/client';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { emitDataUpdated } from '@/lib/emit-data-updated';

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
                title: proposal.job.title,
                // EMPTY SHELL: Client must explicitly set budget and terms.
                totalBudget: 0,
                type: contractType,
                terms: "",
                status: ContractStatus.DRAFT,
                commissionRate: 0, // Placeholder — snapshotted from SystemConfig at FINALIZED
                // Dates must be explicitly set by client later
                startDate: null,
                endDate: null
            }
        });

        // 7b. Auto-create default milestone for TRIAL contracts
        if (contractType === 'TRIAL') {
            await db.milestone.create({
                data: {
                    contractId: contract.id,
                    sequence: 1,
                    title: "Trial Task",
                    description: "",
                    amount: 0,
                    status: "PENDING"
                }
            });
        }

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

        emitDataUpdated();

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
                commissionRate: 0, // Placeholder — snapshotted from SystemConfig at FINALIZED
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

        emitDataUpdated();

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

        // 2. Get Contract (include proposal for jobId)
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { proposal: { select: { jobId: true } } }
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

        // 5. Build update payload (totalBudget is NOT editable — controlled by milestones)
        const updateData: Record<string, unknown> = {};
        if (patchData.title) updateData.title = patchData.title;
        if (patchData.terms) updateData.terms = patchData.terms;
        if (patchData.startDate) updateData.startDate = patchData.startDate;
        if (patchData.endDate) updateData.endDate = patchData.endDate;

        await db.contract.update({
            where: { id: contractId },
            data: updateData,
        });

        // Lifecycle Event: CONTRACT_EDITED
        recordLifecycleEvent({
            jobId: contract.proposal?.jobId,
            contractId,
            eventType: 'CONTRACT_EDITED',
            devState: 'DRAFT',
            userMessage: 'Contract terms updated',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            category: 'BUSINESS',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        emitDataUpdated();

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

        emitDataUpdated();

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
            where: { id: contractId },
            include: { milestones: true }
        });

        if (!contract) return { success: false, error: "Contract not found." };

        // Auth check (Client ownership)
        const clientProfile = await db.clientProfile.findUnique({ where: { userId: session.user.id } });
        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { success: false, error: "Unauthorized." };
        }

        if (contract.status !== ContractStatus.DRAFT) {
            return { success: false, error: "Contract must be DRAFT to send for review." };
        }

        // Hardening: Validation before Review
        if (contract.type === 'TRIAL') {
            const validationError = validateTrialContract(contract, contract.milestones);
            if (validationError) return { success: false, error: validationError };
        } else {
            // FULL Contract Validation
            if (contract.milestones.length === 0) {
                return { success: false, error: "Contract must have at least one milestone." };
            }
            if (contract.totalBudget <= 0) {
                return { success: false, error: "Contract budget must be greater than zero." };
            }
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

        emitDataUpdated();

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

        emitDataUpdated();

        return { success: true };

    } catch (error) {
        return { success: false, error: "Failed to request changes." };
    }
}

/**
 * Client finalizes contract.
 * ACCEPTED -> FINALIZED
 *
 * Commission rate is snapshotted from SystemConfig inside a transaction.
 * After this point, commissionRate is immutable.
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

        // Re-validate Trial invariants before finalizing
        if (contract.type === 'TRIAL') {
            const milestones = await db.milestone.findMany({ where: { contractId } });
            const validationError = validateTrialContract(contract, milestones);
            if (validationError) return { success: false, error: validationError };
        }

        // Atomic: snapshot commission rate + finalize status
        await db.$transaction(async (tx) => {
            // Fetch platform commission rate from SystemConfig
            let configRow = await tx.systemConfig.findUnique({
                where: { key: 'platformCommissionRate' },
            });

            // Defensive: auto-create default if missing (e.g. after DB reset without seed)
            if (!configRow) {
                console.warn('[finalizeContract] platformCommissionRate missing from SystemConfig — creating default 0.10 (10%)');
                configRow = await tx.systemConfig.create({
                    data: { key: 'platformCommissionRate', value: '0.10' },
                });
            }

            const commissionRate = new Prisma.Decimal(configRow.value);

            // Validate rate is within sane bounds (0 <= rate < 1)
            if (commissionRate.isNegative() || commissionRate.greaterThanOrEqualTo(1)) {
                throw new Error(`INVALID_COMMISSION_RATE: ${commissionRate.toFixed(4)} is out of range [0, 1)`);
            }

            await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.FINALIZED,
                    finalizedAt: new Date(),
                    commissionRate,
                },
            });
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

        emitDataUpdated();

        return { success: true };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to finalize contract.';
        console.error('[finalizeContract] Error:', error);
        return { success: false, error: message };
    }
}

/**
 * Freelancer starts a FUNDED contract.
 * FUNDED → ACTIVE. This is an explicit action, not automatic.
 */
export async function startContract(contractId: string) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { success: false, error: "Unauthorized. Only freelancers can start contracts." };
    }

    try {
        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!freelancerProfile) {
            return { success: false, error: "Freelancer profile not found." };
        }

        const contract = await db.contract.findUnique({
            where: { id: contractId }
        });

        if (!contract) {
            return { success: false, error: "Contract not found." };
        }

        if (contract.freelancerId !== freelancerProfile.id) {
            return { success: false, error: "Unauthorized. You are not the freelancer on this contract." };
        }

        if (contract.status !== ContractStatus.FUNDED && contract.status !== ContractStatus.FINALIZED) {
            return { success: false, error: `Cannot start contract. Current status: ${contract.status}, must be FUNDED or FINALIZED.` };
        }

        const previousStatus = contract.status;

        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.ACTIVE, startDate: new Date() }
        });

        // Lifecycle Event: CONTRACT_STARTED
        recordLifecycleEvent({
            contractId,
            eventType: 'CONTRACT_STARTED',
            devState: 'ACTIVE',
            userMessage: 'Freelancer started work on the contract',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        // Audit Log
        db.auditLog
            .create({
                data: {
                    userId: session.user.id!,
                    actorRole: 'FREELANCER',
                    action: 'CONTRACT_STARTED',
                    entityType: 'CONTRACT',
                    entityId: contractId,
                    details: { previousStatus },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log CONTRACT_STARTED:', err);
            });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);
        revalidatePath('/client/contracts');
        revalidatePath('/freelancer/contracts');

        emitDataUpdated();

        return { success: true };

    } catch (error) {
        console.error("Start contract error:", error);
        return { success: false, error: "Failed to start contract." };
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

        emitDataUpdated();

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
 * Validates invariants for a TRIAL contract.
 * Returns an error string if invalid, or null if valid.
 */
function validateTrialContract(contract: any, milestones: any[]): string | null {
    if (contract.type !== 'TRIAL') return null;

    // 1. Single milestone exists
    if (!milestones || milestones.length !== 1) {
        return "Trial contract must have exactly one milestone.";
    }

    const milestone = milestones[0];
    const errors: string[] = [];

    // 2. Milestone.title is non-empty
    if (!milestone.title?.trim()) errors.push("Milestone Title");

    // 3. Milestone.description is non-empty
    if (!milestone.description?.trim()) errors.push("Milestone Description");

    // 4. Milestone.amount > 0
    if (!milestone.amount || milestone.amount <= 0) errors.push("Milestone Amount");

    // 5. Milestone.dueDate is set
    if (!milestone.dueDate) errors.push("Milestone Due Date");

    // 6. contract.startDate is set
    if (!contract.startDate) errors.push("Contract Start Date");

    // 7. contract.endDate is set
    if (!contract.endDate) errors.push("Contract End Date");

    if (errors.length > 0) {
        return `Trial contract details missing: ${errors.join(', ')}.`;
    }

    return null;
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

        emitDataUpdated();

        return { success: true };

    } catch (error) {
        console.error("Delete contract error:", error);
        return { success: false, error: "Failed to delete contract." };
    }
}

// ============================================================================
// cancelContract — Explicit contract cancellation (CLIENT only)
// Separate from refund. Does NOT touch escrow — only sets status.
// ============================================================================

export async function cancelContract(contractId: string): Promise<{ success?: boolean; error?: string; refundedCount?: number }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can cancel contracts.' };
        }

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: true,
                freelancer: { include: { user: true } },
                milestones: { select: { id: true, status: true, title: true } },
                escrowAccount: { include: { locks: true } },
            },
        });

        if (!contract) return { error: 'Contract not found.' };

        // Ownership check
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id },
        });
        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        // Status guard: FINALIZED, ACTIVE, or FUNDED only
        if (contract.status !== ContractStatus.FINALIZED && contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.FUNDED) {
            return { error: `Cannot cancel contract. Status is ${contract.status}, must be FINALIZED, ACTIVE, or FUNDED.` };
        }

        // Block if any milestone is IN_PROGRESS, SUBMITTED, APPROVED, or DISPUTED
        const blockedStatuses = ['IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'DISPUTED'];
        const blockedMilestones = contract.milestones.filter((m: { status: string }) =>
            blockedStatuses.includes(m.status)
        );
        if (blockedMilestones.length > 0) {
            const details = blockedMilestones.map((m: { title: string; status: string }) => `"${m.title}" (${m.status})`).join(', ');
            return { error: `Cannot cancel: ${blockedMilestones.length} milestone(s) have active/disputed work — ${details}. Resolve them first.` };
        }

        // ── Hybrid: Auto-refund funded PENDING milestones ──
        const { refundMilestone } = await import('@/actions/escrow-actions');

        const fundedPendingMilestones = contract.milestones.filter((m: { id: string; status: string }) => {
            if (m.status !== 'PENDING') return false;
            const lock = contract.escrowAccount?.locks.find(
                (l: { milestoneId: string | null; released: boolean }) => l.milestoneId === m.id && !l.released
            );
            return !!lock;
        });

        let refundedCount = 0;
        for (const m of fundedPendingMilestones) {
            const refundResult = await refundMilestone(m.id);
            if (refundResult.success) {
                refundedCount++;
            } else {
                console.error(`[cancelContract] Auto-refund failed for milestone ${m.id}: ${refundResult.error}`);
                return { error: `Auto-refund failed for milestone "${m.title}": ${refundResult.error}. Contract was NOT cancelled.` };
            }
        }

        // ── Set contract to CANCELLED ──
        await db.contract.update({
            where: { id: contractId },
            data: { status: ContractStatus.CANCELLED },
        });

        // Lifecycle event
        recordLifecycleEvent({
            contractId,
            eventType: 'CONTRACT_CANCELLED',
            devState: 'CANCELLED',
            userMessage: refundedCount > 0
                ? `Client cancelled the contract. ${refundedCount} milestone(s) auto-refunded.`
                : 'Client cancelled the contract',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { refundedCount },
        });

        // Notify freelancer
        db.notification.create({
            data: {
                userId: contract.freelancer.userId,
                title: 'Contract Cancelled',
                message: refundedCount > 0
                    ? `The contract "${contract.title}" has been cancelled. ${refundedCount} funded milestone(s) were automatically refunded.`
                    : `The contract "${contract.title}" has been cancelled by the client.`,
                type: 'CONTRACT_CANCELLED',
            },
        }).catch((err: unknown) => console.error('[Notification] Failed to notify freelancer about cancellation:', err));

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        emitDataUpdated();

        return { success: true, refundedCount };
    } catch (error) {
        console.error('[cancelContract] Error:', error);
        return { error: error instanceof Error ? error.message : 'Failed to cancel contract.' };
    }
}

