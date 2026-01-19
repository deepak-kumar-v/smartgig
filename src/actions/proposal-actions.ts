'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const ProposalSchema = z.object({
    jobId: z.string(),
    coverLetter: z.string().min(50, { message: "Cover letter must be at least 50 characters long." }),
    price: z.coerce.number().min(1, { message: "Bid amount must be at least $1" }),
});

export async function submitProposal(formData: FormData) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "FREELANCER") {
        return { error: "Only freelancers can submit proposals." };
    }

    const validatedFields = ProposalSchema.safeParse({
        jobId: formData.get('jobId'),
        coverLetter: formData.get('coverLetter'),
        price: formData.get('price'),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { jobId, coverLetter, price } = validatedFields.data;

    try {
        // Get Freelancer Profile ID
        const freelancerProfile = await db.freelancerProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!freelancerProfile) {
            return { error: "Freelancer profile not found. Please complete your profile first." };
        }

        // Check for duplicates
        const existingProposal = await db.proposal.findFirst({
            where: {
                jobId: jobId,
                freelancerId: freelancerProfile.id
            }
        });

        if (existingProposal) {
            return { error: "You have already applied to this job." };
        }

        // Create Proposal
        await db.proposal.create({
            data: {
                jobId,
                freelancerId: freelancerProfile.id,
                coverLetter,
                price,
                status: "PENDING"
            }
        });

        revalidatePath('/explore');
        revalidatePath(`/job/${jobId}`);
        revalidatePath('/freelancer/dashboard');

        return { success: "Proposal submitted successfully!" };

    } catch (error) {
        console.error("Proposal submission error:", error);
        return { error: "Failed to submit proposal. Please try again." };
    }
}
