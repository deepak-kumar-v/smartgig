'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UpdateFreelancerProfileInput {
    title: string;
    bio?: string;
    hourlyRate: number;
    availability?: string;
    country?: string;
    city?: string;
    timezone?: string;
    weeklyHours?: number;
    experienceLevel?: string;
    currency?: string;
    education?: string;
    experienceYears?: number;
    experienceSummary?: string;
    languages?: string[];
    skills?: string[]; // skill names to connect-or-create
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateProfileInput(data: UpdateFreelancerProfileInput) {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length < 3) {
        errors.push('Title must be at least 3 characters.');
    }
    if (data.title && data.title.length > 200) {
        errors.push('Title must be at most 200 characters.');
    }
    if (data.bio && data.bio.length > 2000) {
        errors.push('Bio must be at most 2000 characters.');
    }
    if (data.hourlyRate == null || data.hourlyRate < 0) {
        errors.push('Hourly rate must be a non-negative number.');
    }
    if (data.hourlyRate > 1000) {
        errors.push('Hourly rate seems unreasonably high (max $1000).');
    }
    if (data.weeklyHours != null && (data.weeklyHours < 1 || data.weeklyHours > 80)) {
        errors.push('Weekly hours must be between 1 and 80.');
    }
    if (data.experienceYears != null && (data.experienceYears < 0 || data.experienceYears > 50)) {
        errors.push('Experience years must be between 0 and 50.');
    }
    if (data.experienceSummary && data.experienceSummary.length > 1000) {
        errors.push('Experience summary must be at most 1000 characters.');
    }

    const validAvailability = ['FULL_TIME', 'PART_TIME', 'AVAILABLE', 'BUSY', 'NOT_AVAILABLE'];
    if (data.availability && !validAvailability.includes(data.availability)) {
        errors.push('Invalid availability status.');
    }

    const validExperience = ['ENTRY', 'INTERMEDIATE', 'EXPERT'];
    if (data.experienceLevel && !validExperience.includes(data.experienceLevel)) {
        errors.push('Invalid experience level.');
    }

    return errors;
}

// ---------------------------------------------------------------------------
// Update Freelancer Profile
// ---------------------------------------------------------------------------

export async function updateFreelancerProfile(data: UpdateFreelancerProfileInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    // Verify this user actually has a freelancer profile
    const existing = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!existing) {
        return { success: false, error: 'Freelancer profile not found.' };
    }

    // Validate
    const errors = validateProfileInput(data);
    if (errors.length > 0) {
        return { success: false, error: errors.join(' ') };
    }

    try {
        await db.$transaction(async (tx) => {
            // 1. Update profile scalar fields
            await tx.freelancerProfile.update({
                where: { userId: session.user.id },
                data: {
                    title: data.title.trim(),
                    bio: data.bio?.trim() || null,
                    hourlyRate: data.hourlyRate,
                    availability: data.availability || 'AVAILABLE',
                    country: data.country?.trim() || null,
                    city: data.city?.trim() || null,
                    timezone: data.timezone?.trim() || null,
                    weeklyHours: data.weeklyHours || 40,
                    experienceLevel: data.experienceLevel || 'INTERMEDIATE',
                    currency: data.currency || 'USD',
                    education: data.education?.trim() || null,
                    experienceYears: data.experienceYears ?? null,
                    experienceSummary: data.experienceSummary?.trim() || null,
                    languages: data.languages
                        ? data.languages.map(l => l.trim()).filter(l => l.length > 0)
                        : [],
                    // Disconnect all skills first
                    skills: { set: [] },
                },
            });

            // 2. Connect or create skills
            if (data.skills && data.skills.length > 0) {
                const cleanSkills = data.skills
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);

                // Deduplicate by normalized (lowercase) name
                const seen = new Set<string>();
                const uniqueSkills = cleanSkills.filter((s) => {
                    const key = s.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                for (const skillName of uniqueSkills) {
                    // Find by case-insensitive match or create
                    let skill = await tx.skill.findFirst({
                        where: { name: { equals: skillName, mode: 'insensitive' } },
                    });

                    if (!skill) {
                        skill = await tx.skill.create({
                            data: { name: skillName },
                        });
                    }

                    // Connect to profile
                    await tx.freelancerProfile.update({
                        where: { userId: session.user.id },
                        data: {
                            skills: { connect: { id: skill.id } },
                        },
                    });
                }
            }
        });

        revalidatePath('/freelancer/profile');
        revalidatePath('/freelancer/profile/edit');
        revalidatePath('/freelancer/dashboard');

        return { success: true };
    } catch (error) {
        console.error('Failed to update freelancer profile:', error);
        return { success: false, error: 'Failed to save profile. Please try again.' };
    }
}

// ---------------------------------------------------------------------------
// Fetch Freelancer Profile (for edit page — server action to load data)
// ---------------------------------------------------------------------------

export async function getMyFreelancerProfile() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            freelancerProfile: {
                include: {
                    skills: true,
                },
            },
        },
    });

    if (!user || !user.freelancerProfile) {
        return null;
    }

    return {
        name: user.name || '',
        image: user.image || null,
        title: user.freelancerProfile.title,
        bio: user.freelancerProfile.bio || '',
        hourlyRate: user.freelancerProfile.hourlyRate,
        availability: user.freelancerProfile.availability || 'AVAILABLE',
        country: user.freelancerProfile.country || '',
        city: user.freelancerProfile.city || '',
        timezone: user.freelancerProfile.timezone || '',
        weeklyHours: user.freelancerProfile.weeklyHours || 40,
        experienceLevel: user.freelancerProfile.experienceLevel || 'INTERMEDIATE',
        currency: user.freelancerProfile.currency || 'USD',
        education: user.freelancerProfile.education || '',
        experienceYears: user.freelancerProfile.experienceYears ?? null,
        experienceSummary: user.freelancerProfile.experienceSummary || '',
        languages: user.freelancerProfile.languages || [],
        skills: user.freelancerProfile.skills.map((s) => s.name),
    };
}

// ---------------------------------------------------------------------------
// Fetch Public Freelancer Profile (by profile ID or userId)
// ---------------------------------------------------------------------------

export async function getPublicFreelancerProfile(freelancerProfileId: string) {
    const profile = await db.freelancerProfile.findUnique({
        where: { id: freelancerProfileId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    trustScore: true,
                    isVerified: true,
                    emailVerified: true,
                    phone: true,
                    createdAt: true,
                },
            },
            skills: true,
            portfolio: true,
            reviews: true,
        },
    });

    return profile;
}
