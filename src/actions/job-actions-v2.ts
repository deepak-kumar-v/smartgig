'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';
import { emitDataUpdated } from '@/lib/emit-data-updated';

// V3.2 Schema - Clean schema aligned with post-job (NO legacy fields)
const JobPostSchemaV2 = z.object({
    // Core Content
    title: z.string().min(5, "Title must be at least 5 characters"),
    overview: z.string().min(1, "Overview is required").max(300, "Overview max 300 chars"),
    descriptionMd: z.string().min(1, "Detailed description is required"),

    // Classification
    categoryName: z.string().min(1, "Category is required"),
    subcategory: z.string().optional(),
    skills: z.string().optional(),
    experienceLevel: z.string().optional(),

    // Budget
    budget: z.coerce.number().min(1, "Budget must be at least $1"), // Maps to budgetMax
    budgetMin: z.coerce.number().optional(),
    budgetType: z.string().default("FIXED"),

    // Timeline
    projectType: z.string().default("ONE_TIME"),
    duration: z.string().optional(),
    weeklyHours: z.coerce.number().optional(),

    // Location
    isRemote: z.string().optional(), // "true" or "false" string
    regions: z.string().optional(),

    // Settings
    visibility: z.string().default("PUBLIC"),
    allowTrialTask: z.string().optional(), // "true" or "false" string  
    contractToHire: z.string().optional(), // "true" or "false" string

    // Complex Data
    screenQuestions: z.string().optional(),
    attachments: z.string().optional(),
});

export async function createJobPostV2(formData: FormData) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "You must be logged in to post a job." };
    }

    // Role check
    if (session.user.role !== 'CLIENT') {
        return { error: "Only Client accounts can post jobs." };
    }

    // Verify user
    let user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { clientProfile: true }
    });

    // Auto-create for demo users
    if (!user && session.user.role === 'CLIENT') {
        try {
            user = await db.user.create({
                data: {
                    id: session.user.id,
                    email: session.user.email || `${session.user.id}@smartgig.demo`,
                    name: session.user.name || 'Demo Client',
                    role: 'CLIENT',
                    clientProfile: { create: {} }
                },
                include: { clientProfile: true }
            });
        } catch (err) {
            return { error: "Failed to initialize client profile." };
        }
    }

    if (!user) return { error: "User not found." };
    if (!user.clientProfile) {
        await db.clientProfile.create({ data: { userId: user.id } });
        user = await db.user.findUnique({ where: { id: session.user.id }, include: { clientProfile: true } });
    }

    // Parse ALL V3.2 fields from FormData
    const rawData = {
        // Core Content
        title: formData.get('title'),
        overview: formData.get('overview'),
        descriptionMd: formData.get('descriptionMd'),

        // Classification
        categoryName: formData.get('categoryName'),
        subcategory: formData.get('subcategory'),
        customSubcategory: formData.get('customSubcategory'), // Issue 2 fix: custom sub
        skills: formData.get('skills'),
        experienceLevel: formData.get('experienceLevel'),

        // Budget
        budget: formData.get('budget'),
        budgetMin: formData.get('budgetMin'),
        budgetType: formData.get('budgetType'),

        // Timeline
        projectType: formData.get('projectType'),
        duration: formData.get('duration'),
        weeklyHours: formData.get('weeklyHours'),

        // Location
        isRemote: formData.get('isRemote'),
        regions: formData.get('regions'),

        // Settings
        visibility: formData.get('visibility'),
        allowTrialTask: formData.get('allowTrialTask'),
        contractToHire: formData.get('contractToHire'),

        // Complex Data
        screenQuestions: formData.get('screenQuestions'),
        attachments: formData.get('attachments'),
    };

    // Convert to strings with null safety
    const safeData = {
        title: rawData.title?.toString() || '',
        // FIX: Normalize overview BEFORE validation
        overview: (rawData.overview?.toString() || '').trim().replace(/\r\n/g, '\n'),
        descriptionMd: rawData.descriptionMd?.toString() || '',
        categoryName: rawData.categoryName?.toString() || 'Uncategorized',
        // Issue 2 fix: Priority = customSubcategory > subcategory > undefined
        subcategory: (rawData.customSubcategory?.toString().trim() || rawData.subcategory?.toString().trim()) || undefined,
        skills: rawData.skills?.toString() || undefined,
        experienceLevel: rawData.experienceLevel?.toString() || undefined,
        budget: rawData.budget?.toString() || '0',
        budgetMin: rawData.budgetMin?.toString() || undefined,
        budgetType: rawData.budgetType?.toString() || 'FIXED',
        projectType: rawData.projectType?.toString() || 'ONE_TIME',
        duration: rawData.duration?.toString() || undefined,
        weeklyHours: rawData.weeklyHours?.toString() || undefined,
        isRemote: rawData.isRemote?.toString() || 'true',
        regions: rawData.regions?.toString() || undefined,
        visibility: rawData.visibility?.toString() || 'PUBLIC',
        allowTrialTask: rawData.allowTrialTask?.toString() || 'false',
        contractToHire: rawData.contractToHire?.toString() || 'false',
        screenQuestions: rawData.screenQuestions?.toString() || undefined,
        attachments: rawData.attachments?.toString() || undefined,
    };

    const validatedFields = JobPostSchemaV2.safeParse(safeData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;

    try {
        // Handle Skills
        const skillList = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        const skillIds = [];

        for (const name of skillList) {
            let skill = await db.skill.findFirst({ where: { name } });
            if (!skill) {
                skill = await db.skill.create({ data: { name } });
            }
            skillIds.push(skill.id);
        }

        // CREATE JOB - V3.2 Clean Schema (NO legacy fields)
        const job = await db.jobPost.create({
            data: {
                // Core Content
                title: data.title,
                overview: data.overview,
                descriptionMd: data.descriptionMd,

                // Classification
                category: data.categoryName,
                subcategory: data.subcategory || '',
                experienceLevel: data.experienceLevel,

                // Budget
                budgetType: data.budgetType,
                budgetMin: data.budgetMin || null,
                budgetMax: data.budget,  // budget maps to budgetMax

                // Timeline
                projectType: data.projectType,
                duration: data.duration,
                weeklyHours: data.weeklyHours || null,

                // Location - Explicit boolean conversion
                isRemote: data.isRemote === 'true',
                regions: data.regions || '',

                // Settings - Explicit boolean conversion
                visibility: data.visibility,
                allowTrialTask: data.allowTrialTask === 'true',
                contractToHire: data.contractToHire === 'true',

                // Complex Data
                screeningQuestions: data.screenQuestions,
                attachments: data.attachments,

                // Status & Relations
                status: 'OPEN',
                client: { connect: { userId: session.user.id } },
                skills: { connect: skillIds.map(id => ({ id })) }
            }
        });

        console.log('[createJobPostV2] Job created:', job.id);

        // Lifecycle Event: JOB_POSTED
        recordLifecycleEvent({
            jobId: job.id,
            eventType: 'JOB_POSTED',
            userMessage: `Job "${data.title}" was posted`,
            actorId: session.user.id,
            actorRole: 'CLIENT',
        });

    } catch (err: any) {
        console.error("Failed to create job v2 - FULL ERROR DETAILS:");
        console.error(JSON.stringify(err, null, 2));
        if (err.code) console.error("Error Code:", err.code);
        if (err.meta) console.error("Error Meta:", err.meta);
        console.error("Original Error Object:", err);
        return { error: `Database error: ${err.message || "Failed to create job post."}` };
    }

    revalidatePath('/explore');
    revalidatePath('/client/dashboard');

    emitDataUpdated();

    return { success: true };
}

export async function updateJobPost(jobId: string, formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Parse ALL V3.2 fields from FormData (same structure as create)
    const rawData = {
        // Core Content
        title: formData.get('title'),
        overview: formData.get('overview'),
        descriptionMd: formData.get('descriptionMd'),

        // Classification
        categoryName: formData.get('categoryName'),
        subcategory: formData.get('subcategory'),
        customSubcategory: formData.get('customSubcategory'), // Issue 2 fix
        skills: formData.get('skills'),
        experienceLevel: formData.get('experienceLevel'),

        // Budget
        budget: formData.get('budget'),
        budgetMin: formData.get('budgetMin'),
        budgetType: formData.get('budgetType'),

        // Timeline
        projectType: formData.get('projectType'),
        duration: formData.get('duration'),
        weeklyHours: formData.get('weeklyHours'),

        // Location
        isRemote: formData.get('isRemote'),
        regions: formData.get('regions'),

        // Settings
        visibility: formData.get('visibility'),
        allowTrialTask: formData.get('allowTrialTask'),
        contractToHire: formData.get('contractToHire'),

        // Complex Data
        screenQuestions: formData.get('screenQuestions'),
        attachments: formData.get('attachments'),
    };

    // Convert to strings with null safety
    const safeData = {
        title: rawData.title?.toString() || '',
        // FIX: Normalize overview BEFORE validation
        overview: (rawData.overview?.toString() || '').trim().replace(/\r\n/g, '\n'),
        descriptionMd: rawData.descriptionMd?.toString() || '',
        categoryName: rawData.categoryName?.toString() || 'Uncategorized',
        // Issue 2 fix: Priority = customSubcategory > subcategory > undefined
        subcategory: (rawData.customSubcategory?.toString().trim() || rawData.subcategory?.toString().trim()) || undefined,
        skills: rawData.skills?.toString() || undefined,
        experienceLevel: rawData.experienceLevel?.toString() || undefined,
        budget: rawData.budget?.toString() || '0',
        budgetMin: rawData.budgetMin?.toString() || undefined,
        budgetType: rawData.budgetType?.toString() || 'FIXED',
        projectType: rawData.projectType?.toString() || 'ONE_TIME',
        duration: rawData.duration?.toString() || undefined,
        weeklyHours: rawData.weeklyHours?.toString() || undefined,
        isRemote: rawData.isRemote?.toString() || 'true',
        regions: rawData.regions?.toString() || undefined,
        visibility: rawData.visibility?.toString() || 'PUBLIC',
        allowTrialTask: rawData.allowTrialTask?.toString() || 'false',
        contractToHire: rawData.contractToHire?.toString() || 'false',
        screenQuestions: rawData.screenQuestions?.toString() || undefined,
        attachments: rawData.attachments?.toString() || undefined,
    };

    const validatedFields = JobPostSchemaV2.safeParse(safeData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;

    try {
        // Verify ownership
        const existingJob = await db.jobPost.findUnique({
            where: { id: jobId },
            include: { client: true }
        });

        if (!existingJob || existingJob.client.userId !== session.user.id) {
            return { error: "Job not found or unauthorized" };
        }

        // Handle Skills
        const skillList = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        const skillIds = [];

        for (const name of skillList) {
            let skill = await db.skill.findFirst({ where: { name } });
            if (!skill) {
                skill = await db.skill.create({ data: { name } });
            }
            skillIds.push(skill.id);
        }

        // UPDATE JOB - V3.2 Clean Schema (NO legacy fields)
        await db.jobPost.update({
            where: { id: jobId },
            data: {
                // Core Content
                title: data.title,
                overview: data.overview,
                descriptionMd: data.descriptionMd,

                // Classification
                category: data.categoryName,
                subcategory: data.subcategory || '',
                experienceLevel: data.experienceLevel,

                // Budget
                budgetType: data.budgetType,
                budgetMin: data.budgetMin || null,
                budgetMax: data.budget,  // budget maps to budgetMax

                // Timeline
                projectType: data.projectType,
                duration: data.duration,
                weeklyHours: data.weeklyHours || null,

                // Location - Explicit boolean conversion
                isRemote: data.isRemote === 'true',
                regions: data.regions || '',

                // Settings - Explicit boolean conversion
                visibility: data.visibility,
                allowTrialTask: data.allowTrialTask === 'true',
                contractToHire: data.contractToHire === 'true',

                // Complex Data
                screeningQuestions: data.screenQuestions,
                attachments: data.attachments,

                // Skills
                skills: {
                    set: [], // Disconnect all
                    connect: skillIds.map(id => ({ id }))
                }
            }
        });

        revalidatePath(`/client/jobs/${jobId}`);
        revalidatePath('/client/jobs');
        revalidatePath('/client/dashboard');

        emitDataUpdated();

        return { success: true };
    } catch (err) {
        console.error("Failed to update job:", err);
        return { error: "Database error: Failed to update job." };
    }
}

/**
 * Delete a job post (hard delete)
 * Cascades: Deletes all proposals associated with the job first
 */
export async function deleteJobPost(jobId: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "You must be logged in to delete a job." };
    }

    // Verify job exists and belongs to this user
    const job = await db.jobPost.findUnique({
        where: { id: jobId },
        include: { client: true }
    });

    if (!job) {
        return { error: "Job not found." };
    }

    if (job.client.userId !== session.user.id) {
        return { error: "You can only delete your own jobs." };
    }

    try {
        // Delete in order: Proposals first (child records), then Job
        await db.$transaction([
            db.proposal.deleteMany({
                where: { jobId: jobId }
            }),
            db.jobPost.delete({
                where: { id: jobId }
            })
        ]);

        revalidatePath('/client/jobs');
        revalidatePath('/client/dashboard');

        emitDataUpdated();

        return { success: true, message: "Job deleted successfully." };
    } catch (err) {
        console.error("Failed to delete job:", err);
        return { error: "Database error: Failed to delete job." };
    }
}
