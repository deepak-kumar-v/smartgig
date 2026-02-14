'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';

export async function approveTrialWork(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        // Verify ownership (Client only)
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { client: true }
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };
        if (contract.type !== 'TRIAL') return { error: 'Not a trial contract' };
        if (contract.status !== 'ACTIVE') return { error: 'Contract not active' };

        // Transaction: Update Contract + Create Escrow Record
        await db.$transaction([
            db.contract.update({
                where: { id: contractId },
                data: {
                    status: 'COMPLETED',
                    escrowStatus: 'RELEASED',
                }
            }),
            db.mockEscrowTransaction.create({
                data: {
                    contractId: contractId,
                    amount: contract.trialAmount || contract.totalBudget,
                    status: 'RELEASED'
                }
            })
        ]);

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);

        // Lifecycle Event: TRIAL_APPROVED
        recordLifecycleEvent({
            contractId,
            eventType: 'TRIAL_APPROVED',
            devState: 'COMPLETED',
            userMessage: 'Client approved trial work — funds released',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        return { success: true };
    } catch (error) {
        console.error('Approve Trial Error:', error);
        return { error: 'Failed to approve trial work' };
    }
}

export async function rejectTrialWork(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { client: true }
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };
        if (contract.type !== 'TRIAL') return { error: 'Not a trial contract' };

        await db.contract.update({
            where: { id: contractId },
            data: {
                status: 'REJECTED',
                // Escrow remains FUNDED
            }
        });

        revalidatePath('/client/contracts');
        revalidatePath(`/client/contracts/${contractId}`);

        // Lifecycle Event: TRIAL_REJECTED
        recordLifecycleEvent({
            contractId,
            eventType: 'TRIAL_REJECTED',
            devState: 'REJECTED',
            userMessage: 'Client rejected trial work',
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

        return { success: true };
    } catch (error) {
        console.error('Reject Trial Error:', error);
        return { error: 'Failed to reject trial work' };
    }
}

export async function raiseDispute(contractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: { freelancer: true }
        });

        if (!contract) return { error: 'Contract not found' };
        if (contract.freelancer.userId !== session.user.id) return { error: 'Unauthorized Access' };

        // Only allow dispute if rejected
        if (contract.status !== 'REJECTED') return { error: 'Can only dispute rejected work' };

        await db.contract.update({
            where: { id: contractId },
            data: { status: 'DISPUTED' }
        });

        // Lifecycle Event: DISPUTE_RAISED
        recordLifecycleEvent({
            contractId,
            eventType: 'DISPUTE_RAISED',
            devState: 'DISPUTED',
            userMessage: 'Freelancer raised a dispute',
            actorId: session.user.id,
            actorRole: 'FREELANCER',
        });

        revalidatePath('/freelancer/contracts');
        revalidatePath(`/freelancer/contracts/${contractId}`);
        return { success: true };
    } catch (error) {
        console.error('Raise Dispute Error:', error);
        return { error: 'Failed to raise dispute' };
    }
}

export async function upgradeToStandard(trialContractId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: 'Unauthorized' };

        const trialContract = await db.contract.findUnique({
            where: { id: trialContractId },
            include: { client: true, proposal: true, conversation: true }
        });

        if (!trialContract) return { error: 'Trial contract not found' };
        if (trialContract.client.userId !== session.user.id) return { error: 'Unauthorized Access' };
        if (trialContract.type !== 'TRIAL') return { error: 'Source must be a trial contract' };
        if (trialContract.status !== 'COMPLETED') return { error: 'Trial must be completed first' };

        // Create Standard Contract
        // We reuse proposalId but type='FULL'
        // Wait, Schema has @@unique([proposalId, type]). So we can verify uniqueness is respected.

        const newContract = await db.contract.create({
            data: {
                proposalId: trialContract.proposalId,
                clientId: trialContract.clientId,
                freelancerId: trialContract.freelancerId,
                title: trialContract.title.replace(' (Trial)', '') + ' (Standard)',
                totalBudget: trialContract.proposal.proposedRate,
                status: 'ACTIVE',
                terms: 'Standard terms derived from proposal',
                type: 'FULL',
                sourceTrialId: trialContractId,
                startDate: new Date(),
            }
        });

        // Update Conversation to point to new Standard Contract
        if (trialContract.conversation) {
            await db.conversation.update({
                where: { id: trialContract.conversation.id },
                data: { contractId: newContract.id }
            });
        }

        // Lifecycle Event: TRIAL_UPGRADED
        recordLifecycleEvent({
            contractId: newContract.id,
            eventType: 'TRIAL_UPGRADED',
            devState: 'ACTIVE',
            userMessage: 'Trial upgraded to standard contract',
            actorId: session.user.id,
            actorRole: 'CLIENT',
            metadata: { sourceTrialId: trialContractId },
        });

        revalidatePath('/client/contracts');
        revalidatePath('/messages');
        return { success: true, newContractId: newContract.id };
    } catch (error) {
        console.error('Upgrade Contract Error:', error);
        return { error: 'Failed to upgrade contract' };
    }
}
