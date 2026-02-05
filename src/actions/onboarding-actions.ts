'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(role: 'FREELANCER' | 'CLIENT') {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                role,
                ...(role === 'FREELANCER' ? {
                    freelancerProfile: {
                        create: {
                            title: "New Freelancer",
                            bio: "Ready to work!",
                            hourlyRate: 0,
                        }
                    }
                } : {
                    clientProfile: {
                        create: {
                            companyName: session.user.name || "My Company",
                        }
                    }
                })
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Onboarding error:", error);
        return { error: "Failed to update profile" };
    }
}
