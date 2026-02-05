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
        description: z.string(),
        price: z.number(),
        deliveryDays: z.number().min(1),
        revisions: z.number().default(0),
        features: z.array(z.string()).default([])
    })).optional(),
    faqs: z.array(z.object({
        question: z.string(),
        answer: z.string()
    })).optional(),
    requirements: z.array(z.object({
        question: z.string(),
        type: z.enum(['text', 'file', 'choice']),
        required: z.boolean()
    })).optional()
});

export async function createService(formData: FormData) {
    // In a real app with standard FormData, parsing nested arrays is complex.
    // For this 'wizard' implementation, we assume the client is sending a JSON blob 
    // or we are just logging the data for MVP verification since DB schema 
    // would need significant storage updates (JSON type or related tables).

    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    // ... (rest of logic mock)

    // Simulate complex data handling
    console.log("Creating service with wizard data...");

    revalidatePath('/freelancer/services');
    redirect('/freelancer/services');
}

import { mockServiceListings } from '@/lib/mock-data';

export type ServiceFilterParams = {
    query?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    deliveryTime?: string;
    sort?: string;
};

export async function getFilteredServices(params: ServiceFilterParams) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let results = [...mockServiceListings];

    // 1. Filter by Query (Title, Description, Tags)
    if (params.query) {
        const q = params.query.toLowerCase();
        results = results.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }

    // 2. Filter by Category
    if (params.category && params.category !== 'All') {
        results = results.filter(s => s.category === params.category);
    }

    // 3. Filter by Price
    if (params.minPrice) {
        results = results.filter(s => s.packages[0].price >= parseInt(params.minPrice!));
    }
    if (params.maxPrice) {
        results = results.filter(s => s.packages[0].price <= parseInt(params.maxPrice!));
    }

    // 4. Filter by Delivery Time (Max Days)
    if (params.deliveryTime) {
        const maxDays = parseInt(params.deliveryTime);
        results = results.filter(s => s.packages[0].deliveryDays <= maxDays);
    }

    // 5. Sort
    if (params.sort) {
        switch (params.sort) {
            case 'price_low':
                results.sort((a, b) => a.packages[0].price - b.packages[0].price);
                break;
            case 'price_high':
                results.sort((a, b) => b.packages[0].price - a.packages[0].price);
                break;
            case 'newest':
                results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            default: // recommended
                // mocked sort by relevance/trust (basically no-op or random shuffle for demo)
                break;
        }
    }

    return results;
}
