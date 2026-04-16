'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatePortfolioInput {
    title: string;
    description: string;
    thumbnailUrl: string;
    projectUrl?: string;
    githubUrl?: string;
    techStack?: string[];
}

interface UpdatePortfolioInput {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    projectUrl?: string;
    githubUrl?: string;
    techStack?: string[];
}

// ---------------------------------------------------------------------------
// Create Portfolio Item
// ---------------------------------------------------------------------------

export async function createPortfolioItem(data: CreatePortfolioInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    const profile = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!profile) {
        return { success: false, error: 'Freelancer profile not found.' };
    }

    if (!data.title || data.title.trim().length < 3) {
        return { success: false, error: 'Title must be at least 3 characters.' };
    }
    if (!data.description || data.description.trim().length < 10) {
        return { success: false, error: 'Description must be at least 10 characters.' };
    }

    try {
        const item = await db.portfolioItem.create({
            data: {
                freelancerId: profile.id,
                title: data.title.trim(),
                description: data.description.trim(),
                thumbnailUrl: data.thumbnailUrl.trim() || '/portfolio/placeholder.png',
                projectUrl: data.projectUrl?.trim() || null,
                githubUrl: data.githubUrl?.trim() || null,
                techStack: data.techStack
                    ? data.techStack.map(s => s.trim()).filter(s => s.length > 0)
                    : [],
                status: 'PENDING',
            },
        });

        revalidatePath('/freelancer/portfolio');
        revalidatePath('/freelancer/profile');
        return { success: true, id: item.id };
    } catch (error) {
        console.error('Failed to create portfolio item:', error);
        return { success: false, error: 'Failed to create portfolio item.' };
    }
}

// ---------------------------------------------------------------------------
// Update Portfolio Item
// ---------------------------------------------------------------------------

export async function updatePortfolioItem(id: string, data: UpdatePortfolioInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized.' };
    }

    const profile = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!profile) {
        return { success: false, error: 'Freelancer profile not found.' };
    }

    const item = await db.portfolioItem.findUnique({ where: { id } });
    if (!item || item.freelancerId !== profile.id) {
        return { success: false, error: 'Portfolio item not found or unauthorized.' };
    }

    try {
        await db.portfolioItem.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title.trim() }),
                ...(data.description && { description: data.description.trim() }),
                ...(data.thumbnailUrl && { thumbnailUrl: data.thumbnailUrl.trim() }),
                ...(data.projectUrl !== undefined && { projectUrl: data.projectUrl?.trim() || null }),
                ...(data.githubUrl !== undefined && { githubUrl: data.githubUrl?.trim() || null }),
                ...(data.techStack && {
                    techStack: data.techStack.map(s => s.trim()).filter(s => s.length > 0),
                }),
                status: 'PENDING', // Reset to pending after edit
            },
        });

        revalidatePath('/freelancer/portfolio');
        revalidatePath('/freelancer/profile');
        return { success: true };
    } catch (error) {
        console.error('Failed to update portfolio item:', error);
        return { success: false, error: 'Failed to update portfolio item.' };
    }
}

// ---------------------------------------------------------------------------
// Delete Portfolio Item
// ---------------------------------------------------------------------------

export async function deletePortfolioItem(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized.' };
    }

    const profile = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!profile) {
        return { success: false, error: 'Freelancer profile not found.' };
    }

    const item = await db.portfolioItem.findUnique({ where: { id } });
    if (!item || item.freelancerId !== profile.id) {
        return { success: false, error: 'Portfolio item not found or unauthorized.' };
    }

    try {
        await db.portfolioItem.delete({ where: { id } });
        revalidatePath('/freelancer/portfolio');
        revalidatePath('/freelancer/profile');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete portfolio item:', error);
        return { success: false, error: 'Failed to delete portfolio item.' };
    }
}

// ---------------------------------------------------------------------------
// Get My Portfolio
// ---------------------------------------------------------------------------

export async function getMyPortfolio() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const profile = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!profile) {
        return [];
    }

    const items = await db.portfolioItem.findMany({
        where: { freelancerId: profile.id },
        orderBy: { createdAt: 'desc' },
    });

    return items;
}

// ---------------------------------------------------------------------------
// Get Portfolio By ID (for detail page)
// ---------------------------------------------------------------------------

export async function getPortfolioById(id: string) {
    const item = await db.portfolioItem.findUnique({
        where: { id },
        include: {
            freelancer: {
                include: {
                    user: {
                        select: { name: true, image: true },
                    },
                },
            },
        },
    });

    return item;
}

// ---------------------------------------------------------------------------
// Get Portfolio Items by IDs (for proposal view)
// ---------------------------------------------------------------------------

export async function getPortfolioByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];

    const items = await db.portfolioItem.findMany({
        where: { id: { in: ids } },
    });

    return items;
}

// ---------------------------------------------------------------------------
// Admin: Get All Portfolio Items
// ---------------------------------------------------------------------------

export async function getAllPortfolioForAdmin() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return [];
    }

    const items = await db.portfolioItem.findMany({
        include: {
            freelancer: {
                include: {
                    user: { select: { name: true, image: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return items;
}

// ---------------------------------------------------------------------------
// Admin: Verify Portfolio Item
// ---------------------------------------------------------------------------

export async function verifyPortfolioItem(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized. Admin only.' };
    }

    try {
        await db.portfolioItem.update({
            where: { id },
            data: { status: 'VERIFIED' },
        });

        revalidatePath('/admin/portfolio');
        revalidatePath('/freelancer/portfolio');
        return { success: true };
    } catch (error) {
        console.error('Failed to verify portfolio item:', error);
        return { success: false, error: 'Failed to verify item.' };
    }
}

// ---------------------------------------------------------------------------
// Admin: Reject Portfolio Item
// ---------------------------------------------------------------------------

export async function rejectPortfolioItem(id: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized. Admin only.' };
    }

    try {
        await db.portfolioItem.update({
            where: { id },
            data: { status: 'PENDING' },
        });

        revalidatePath('/admin/portfolio');
        revalidatePath('/freelancer/portfolio');
        return { success: true };
    } catch (error) {
        console.error('Failed to reject portfolio item:', error);
        return { success: false, error: 'Failed to reject item.' };
    }
}
