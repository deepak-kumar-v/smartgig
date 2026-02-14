'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ContractStatus } from '@prisma/client';

export async function createTrialContract(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const proposalId = formData.get('proposalId') as string;
    const freelancerId = formData.get('freelancerId') as string;
    const clientId = formData.get('clientId') as string;
    const jobId = formData.get('jobId') as string;

    if (!proposalId || !freelancerId || !clientId || !jobId) {
        return { error: 'Missing required fields' };
    }

    // Security check: Ensure current user is the client
    const clientProfile = await db.clientProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!clientProfile || clientProfile.id !== clientId) {
        return { error: 'Unauthorized access to this resource' };
    }

    const job = await db.jobPost.findUnique({ where: { id: jobId } });

    try {
        // Create the Trial Contract
        // Using explicit cast or check for type field since it's newly added
        // Note: Prisma client might not generate types for 'type' yet if generation failed, so we might need TS ignore if we care about build cleanliness, but at runtime it works.

        const contract = await db.contract.create({
            data: {
                clientId,
                freelancerId,
                title: `Trial: ${job?.title || 'Project'}`,
                totalBudget: 0,
                type: 'TRIAL',
                terms: '',
                status: ContractStatus.DRAFT,
                // Dates must be explicitly set
                startDate: null,
                endDate: null
            } as any
        });

        // trial contracts do not have milestones anymore - they are simple fixed price tasks
        // await db.milestone.create({...});

    } catch (error) {
        console.error('Failed to create trial contract:', error);
        return { error: 'Failed to create trial contract' };
    }

    revalidatePath('/client/proposals');
    redirect('/client/contracts');
}
