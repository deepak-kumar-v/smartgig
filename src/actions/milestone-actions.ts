'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { ContractStatus, MilestoneStatus } from '@prisma/client';

// ============================================================================
// Milestone Server Actions — CRUD + State Transitions (Hardened)
// ============================================================================

// ─── Shared helper: recalculate totalBudget from milestones ──────────────────
async function recalculateTotalBudget(
    tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
    contractId: string
): Promise<number> {
    const result = await tx.milestone.aggregate({
        where: { contractId },
        _sum: { amount: true },
    });
    // Milestone.amount is now Decimal — convert to number for contract.totalBudget (Float)
    const totalDecimal = result._sum.amount ?? 0;
    const total = typeof totalDecimal === 'object' && 'toNumber' in totalDecimal
        ? (totalDecimal as { toNumber: () => number }).toNumber()
        : Number(totalDecimal);

    await tx.contract.update({
        where: { id: contractId },
        data: { totalBudget: total },
    });

    return total;
}

// ─── Shared guard: contract must be DRAFT and unfunded ───────────────────────
async function assertMutableContract(contractId: string) {
    const contract = await db.contract.findUnique({
        where: { id: contractId },
        include: { escrowAccount: true },
    });

    if (!contract) throw new Error('Contract not found');
    if (contract.status !== ContractStatus.DRAFT) {
        throw new Error('Milestones can only be modified when contract is in DRAFT status');
    }
    if (contract.escrowAccount) {
        throw new Error('Milestones cannot be modified after escrow has been funded');
    }

    return contract;
}

// ============================================================================
// CRUD — CLIENT only, DRAFT + no escrow
// ============================================================================

/**
 * Creates a milestone on a DRAFT contract.
 * Recalculates totalBudget atomically.
 */
export async function createMilestone(
    contractId: string,
    data: {
        title: string;
        description: string;
        amount: number;
        dueDate?: Date;
    }
): Promise<{ success?: boolean; error?: string; milestoneId?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can create milestones.' };
        }

        // Validate amount
        if (data.amount <= 0) {
            return { error: 'Milestone amount must be greater than zero' };
        }

        const contract = await assertMutableContract(contractId);

        // Hardening (TRIAL): Cannot add milestones to trial (fixed at 1)
        if (contract.type === 'TRIAL') {
            return { error: 'Trial contracts are limited to exactly one milestone.' };
        }

        // Ownership check
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id },
        });
        if (!clientProfile || contract.clientId !== clientProfile.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        // Atomic: create milestone + recalculate totalBudget
        const milestone = await db.$transaction(async (tx) => {
            const ms = await tx.milestone.create({
                data: {
                    contractId,
                    title: data.title,
                    description: data.description,
                    amount: data.amount,
                    dueDate: data.dueDate ?? null,
                    status: MilestoneStatus.PENDING,
                },
            });

            await recalculateTotalBudget(tx, contractId);
            return ms;
        });

        recordLifecycleEvent({
            contractId,
            milestoneId: milestone.id,
            eventType: 'MILESTONE_CREATED',
            devState: 'DRAFT',
            userMessage: `Milestone created: "${data.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { amount: data.amount },
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true, milestoneId: milestone.id };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to create milestone';
        console.error('[createMilestone] Error:', error);
        return { error: msg };
    }
}

/**
 * Updates a milestone on a DRAFT contract.
 * Recalculates totalBudget atomically.
 */
export async function updateMilestone(
    milestoneId: string,
    data: {
        title?: string;
        description?: string;
        amount?: number;
        dueDate?: Date | null;
    }
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can update milestones.' };
        }

        if (data.amount !== undefined && data.amount <= 0) {
            return { error: 'Milestone amount must be greater than zero' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: { contract: { include: { escrowAccount: true } } },
        });

        if (!milestone) return { error: 'Milestone not found' };

        // Immutability after funding
        if (milestone.contract.escrowAccount) {
            return { error: 'Milestones cannot be modified after escrow has been funded' };
        }
        if (milestone.contract.status !== ContractStatus.DRAFT) {
            return { error: 'Milestones can only be modified when contract is in DRAFT status' };
        }

        // Ownership
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id },
        });
        if (!clientProfile || milestone.contract.clientId !== clientProfile.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        await db.$transaction(async (tx) => {
            const updateData: Record<string, unknown> = {};
            if (data.title !== undefined) updateData.title = data.title;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.amount !== undefined) updateData.amount = data.amount;
            if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

            await tx.milestone.update({
                where: { id: milestoneId },
                data: updateData,
            });

            await recalculateTotalBudget(tx, milestone.contractId);
        });

        recordLifecycleEvent({
            contractId: milestone.contractId,
            milestoneId,
            eventType: 'MILESTONE_UPDATED',
            devState: 'DRAFT',
            userMessage: `Milestone updated: "${data.title ?? milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to update milestone';
        console.error('[updateMilestone] Error:', error);
        return { error: msg };
    }
}

/**
 * Deletes a milestone from a DRAFT contract.
 * Recalculates totalBudget atomically.
 */
export async function deleteMilestone(milestoneId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can delete milestones.' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: { contract: { include: { escrowAccount: true } } },
        });

        if (!milestone) return { error: 'Milestone not found' };

        if (milestone.contract.escrowAccount) {
            return { error: 'Milestones cannot be deleted after escrow has been funded' };
        }
        if (milestone.contract.status !== ContractStatus.DRAFT) {
            return { error: 'Milestones can only be deleted when contract is in DRAFT status' };
        }

        // Hardening (TRIAL): Cannot delete the single trial milestone
        if (milestone.contract.type === 'TRIAL') {
            return { error: 'Cannot delete the trial milestone. It is mandatory.' };
        }

        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: session.user.id },
        });
        if (!clientProfile || milestone.contract.clientId !== clientProfile.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }

        const contractId = milestone.contractId;

        await db.$transaction(async (tx) => {
            await tx.milestone.delete({ where: { id: milestoneId } });
            await recalculateTotalBudget(tx, contractId);
        });

        recordLifecycleEvent({
            contractId,
            eventType: 'MILESTONE_DELETED',
            devState: 'DRAFT',
            userMessage: `Milestone deleted: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        revalidatePath(`/client/contracts/${contractId}`);
        revalidatePath(`/freelancer/contracts/${contractId}`);

        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to delete milestone';
        console.error('[deleteMilestone] Error:', error);
        return { error: msg };
    }
}

// ============================================================================
// State Transitions — Strict, no skipping, no backward
// ============================================================================

/**
 * FREELANCER: PENDING → IN_PROGRESS
 */
export async function startMilestone(milestoneId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'FREELANCER') {
            return { error: 'Unauthorized. Only freelancers can start milestones.' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: { contract: { include: { freelancer: true } } },
        });

        if (!milestone) return { error: 'Milestone not found' };
        if (milestone.contract.freelancer.userId !== session.user.id) {
            return { error: 'Unauthorized. You are not the freelancer on this contract.' };
        }
        if (milestone.contract.status !== ContractStatus.ACTIVE) {
            return { error: 'Contract must be ACTIVE to start milestones' };
        }
        if (milestone.status !== MilestoneStatus.PENDING) {
            return { error: `Cannot start milestone. Current status: ${milestone.status}, must be PENDING.` };
        }

        await db.milestone.update({
            where: { id: milestoneId },
            data: { status: MilestoneStatus.IN_PROGRESS },
        });

        recordLifecycleEvent({
            contractId: milestone.contractId,
            milestoneId,
            eventType: 'MILESTONE_STARTED',
            devState: 'ACTIVE',
            userMessage: `Freelancer started milestone: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[startMilestone] Error:', error);
        return { error: 'Failed to start milestone' };
    }
}

/**
 * FREELANCER: IN_PROGRESS → SUBMITTED
 * Requires at least 1 deliverable.
 */
export async function submitMilestone(milestoneId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'FREELANCER') {
            return { error: 'Unauthorized. Only freelancers can submit milestones.' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: { include: { freelancer: true } },
                deliverables: { select: { id: true } },
            },
        });

        if (!milestone) return { error: 'Milestone not found' };
        if (milestone.contract.freelancer.userId !== session.user.id) {
            return { error: 'Unauthorized. You are not the freelancer on this contract.' };
        }
        if (milestone.contract.status !== ContractStatus.ACTIVE) {
            return { error: 'Contract must be ACTIVE to submit milestones' };
        }
        if (milestone.status !== MilestoneStatus.IN_PROGRESS) {
            return { error: `Cannot submit milestone. Current status: ${milestone.status}, must be IN_PROGRESS.` };
        }

        // Deliverable requirement
        if (!milestone.deliverables || milestone.deliverables.length === 0) {
            return { error: 'Cannot submit milestone without at least one deliverable' };
        }

        await db.milestone.update({
            where: { id: milestoneId },
            data: {
                status: MilestoneStatus.SUBMITTED,
                submittedAt: new Date(),
            },
        });

        recordLifecycleEvent({
            contractId: milestone.contractId,
            milestoneId,
            eventType: 'MILESTONE_SUBMITTED',
            devState: 'ACTIVE',
            userMessage: `Freelancer submitted milestone: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'FREELANCER',
            metadata: { deliverableCount: milestone.deliverables.length },
        });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[submitMilestone] Error:', error);
        return { error: 'Failed to submit milestone' };
    }
}

/**
 * CLIENT: SUBMITTED → APPROVED
 */
export async function approveMilestone(milestoneId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'CLIENT') {
            return { error: 'Unauthorized. Only clients can approve milestones.' };
        }

        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: { contract: { include: { client: true } } },
        });

        if (!milestone) return { error: 'Milestone not found' };
        if (milestone.contract.client.userId !== session.user.id) {
            return { error: 'Unauthorized. You do not own this contract.' };
        }
        if (milestone.contract.status !== ContractStatus.ACTIVE) {
            return { error: 'Contract must be ACTIVE to approve milestones' };
        }
        if (milestone.status !== MilestoneStatus.SUBMITTED) {
            return { error: `Cannot approve milestone. Current status: ${milestone.status}, must be SUBMITTED.` };
        }

        await db.milestone.update({
            where: { id: milestoneId },
            data: {
                status: MilestoneStatus.APPROVED,
                approvedAt: new Date(),
            },
        });

        recordLifecycleEvent({
            contractId: milestone.contractId,
            milestoneId,
            eventType: 'MILESTONE_APPROVED',
            devState: 'ACTIVE',
            userMessage: `Client approved milestone: "${milestone.title}"`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        db.auditLog
            .create({
                data: {
                    userId: session.user.id,
                    actorRole: 'CLIENT',
                    action: 'MILESTONE_APPROVED',
                    entityType: 'MILESTONE',
                    entityId: milestoneId,
                    details: {
                        contractId: milestone.contractId,
                        milestoneTitle: milestone.title,
                        amount: milestone.amount,
                    },
                },
            })
            .catch((err: unknown) => {
                console.error('[AuditLog] Failed to log MILESTONE_APPROVED:', err);
            });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        return { success: true };
    } catch (error) {
        console.error('[approveMilestone] Error:', error);
        return { error: 'Failed to approve milestone' };
    }
}
