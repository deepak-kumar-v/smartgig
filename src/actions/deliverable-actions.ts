'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { emitDataUpdated } from '@/lib/emit-data-updated';

/**
 * Upload a deliverable file for a milestone.
 * Only the freelancer assigned to the contract can upload.
 * Milestone must be IN_PROGRESS.
 */
export async function createDeliverable(formData: FormData): Promise<{ success?: boolean; error?: string; deliverable?: { id: string; fileUrl: string; comment: string | null } }> {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'FREELANCER') {
            return { error: 'Unauthorized. Only freelancers can upload deliverables.' };
        }

        const milestoneId = formData.get('milestoneId') as string;
        const comment = (formData.get('comment') as string) || null;
        const file = formData.get('file') as File;

        if (!milestoneId) return { error: 'Missing milestoneId' };
        if (!file || file.size === 0) return { error: 'No file provided' };
        if (file.size > 50 * 1024 * 1024) return { error: 'File too large (max 50 MB)' };

        // Verify milestone ownership and status
        const milestone = await db.milestone.findUnique({
            where: { id: milestoneId },
            include: { contract: { include: { freelancer: true } } },
        });

        if (!milestone) return { error: 'Milestone not found' };
        if (milestone.contract.freelancer.userId !== session.user.id) {
            return { error: 'Unauthorized. You are not assigned to this contract.' };
        }
        if (milestone.status !== 'IN_PROGRESS') {
            return { error: 'Deliverables can only be uploaded when milestone is IN_PROGRESS.' };
        }

        // Upload file to local storage
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'deliverables');
        await mkdir(uploadDir, { recursive: true });

        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${Date.now()}-${milestoneId.slice(-6)}-${sanitizedName}`;
        const filePath = join(uploadDir, uniqueFilename);

        await writeFile(filePath, buffer);
        const publicUrl = `/uploads/deliverables/${uniqueFilename}`;

        // Create DB record
        const deliverable = await db.deliverable.create({
            data: {
                milestoneId,
                fileUrl: publicUrl,
                comment,
            },
        });

        revalidatePath(`/client/contracts/${milestone.contractId}`);
        revalidatePath(`/freelancer/contracts/${milestone.contractId}`);

        emitDataUpdated();

        return {
            success: true,
            deliverable: {
                id: deliverable.id,
                fileUrl: deliverable.fileUrl,
                comment: deliverable.comment,
            },
        };
    } catch (error) {
        console.error('[createDeliverable] Error:', error);
        return { error: 'Failed to upload deliverable' };
    }
}
