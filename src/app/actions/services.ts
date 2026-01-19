'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const ServiceSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    description: z.string().min(50, 'Description must be detailed (min 50 chars)'),
    categoryId: z.string().min(1, 'Category is required'),
    basePrice: z.number().min(5, 'Minimum price is $5'),
    packages: z.array(z.object({
        name: z.string().min(3),
        price: z.number(),
        deliveryDays: z.number().min(1),
        revisions: z.number().default(0)
    })).optional()
});

export async function createService(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    // Get freelancer profile
    const freelancer = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!freelancer) {
        return { error: 'Freelancer profile not found' };
    }

    const rawData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        categoryId: formData.get('categoryId') as string,
        basePrice: parseFloat(formData.get('basePrice') as string),
        // For simple MVP we might just do base price, or parse packages from JSON hidden field
    };

    const validated = ServiceSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.issues[0].message };
    }

    try {
        await db.serviceListing.create({
            data: {
                freelancerId: freelancer.id,
                title: validated.data.title,
                description: validated.data.description,
                categoryId: validated.data.categoryId,
                basePrice: validated.data.basePrice,
                packages: {
                    create: [
                        {
                            name: 'Standard',
                            price: validated.data.basePrice,
                            deliveryDays: 3, // Default for MVP
                            revisions: 1
                        }
                    ]
                }
            }
        });

        revalidatePath('/freelancer/services');
    } catch (error) {
        console.error('Failed to create service:', error);
        return { error: 'Failed to create service. Please try again.' };
    }

    redirect('/freelancer/services');
}
