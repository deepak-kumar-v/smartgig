'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const JobPostSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    budget: z.coerce.number().min(5, "Budget must be at least $5"),
    categoryId: z.string().min(1, "Please select a category"),
    skills: z.string().optional(), // Comma separated string for now
});

export async function createJobPost(formData: FormData) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "You must be logged in to post a job." };
    }

    // Verify user is a client
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { clientProfile: true }
    });

    if (!user || user.role !== 'CLIENT') {
        // Auto-create client profile if missing for hybrid users (optional enhancement)
        // For now, strict check
        return { error: "Only Client accounts can post jobs." };
    }

    if (!user.clientProfile) {
        // Create profile on the fly if it doesn't exist (safety net)
        await db.clientProfile.create({
            data: { userId: user.id }
        });
    }

    const validatedFields = JobPostSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        budget: formData.get('budget'),
        categoryId: formData.get('categoryId'),
        skills: formData.get('skills'),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { title, description, budget, categoryId, skills } = validatedFields.data;

    // Ensure category exists (simplification: generic category if not found or ensure we have seeds)
    // For this MVP step, we'll create a default category if the ID provided is 'general' or similar, 
    // or purely rely on existing ones. To make it robust, let's upsert a default "General" category if needed.

    let finalCategoryId = categoryId;
    const categoryExists = await db.category.findUnique({ where: { id: categoryId } });

    if (!categoryExists) {
        // Fallback: Find or create 'General'
        const general = await db.category.upsert({
            where: { slug: 'general' },
            update: {},
            create: { name: 'General', slug: 'general', id: 'cat_general' }
        });
        finalCategoryId = general.id;
    }

    try {
        await db.jobPost.create({
            data: {
                title,
                description,
                budget,
                category: { connect: { id: finalCategoryId } },
                client: { connect: { userId: session.user.id } }, // Connect via Unique userId on ClientProfile
                status: 'OPEN',
                // Simple skill parsing
                skills: {
                    connectOrCreate: skills?.split(',').map(s => s.trim()).filter(s => s.length > 0).map(skillName => ({
                        where: { name: skillName },
                        create: { name: skillName }
                    })) || []
                }
            }
        });
    } catch (err) {
        console.error("Failed to create job:", err);
        return { error: "Database error: Failed to create job post." };
    }

    revalidatePath('/explore');
    revalidatePath('/client/dashboard');
    redirect('/client/dashboard');
}
