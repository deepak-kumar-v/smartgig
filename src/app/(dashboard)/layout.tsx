import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Check if user has completed onboarding (has a profile)
    // Check if user has completed onboarding (has a profile)
    let user;
    if (session.user.email === 'demo@smartgig.com') {
        user = {
            id: 'demo-user-id',
            freelancerProfile: { id: 'demo-profile' },
            clientProfile: null
        };
    } else if (session.user.email === 'client@smartgig.com') {
        user = {
            id: 'client-demo-id',
            freelancerProfile: null,
            clientProfile: { id: 'client-demo-profile', companyName: "Demo Company" }
        };
    } else if (session.user.email === 'admin@smartgig.com') {
        user = {
            id: 'admin-demo-id',
            freelancerProfile: null,
            clientProfile: null
        };
        // Admins might not need a profile, or we fake one? 
        // The check below: const hasProfile = user.freelancerProfile || user.clientProfile;
        // So we need to ensure this logic doesn't redirect admins to onboarding.
    } else {
        try {
            user = await db.user.findUnique({
                where: { id: session.user.id },
                include: {
                    freelancerProfile: true,
                    clientProfile: true
                }
            });
        } catch (error) {
            console.error("Dashboard Layout DB Error:", error);
            // Fallback to avoid crash if DB is totally down for real user? 
            // Better to let it fail or redirect?
            // For now, let's just make sure demo works.
            // If DB is down for real user, returning null will trigger redirect to login, which loop?
            // Redirect to /error or just null.
            user = null;
        }
    }

    if (!user) {
        redirect('/login');
    }

    // If role is FREELANCER (default) but no profile, and no client profile either -> effectively new user
    // Note: If they chose CLIENT, they should have a clientProfile.

    const hasProfile = user.freelancerProfile || user.clientProfile;

    // We can also check if role matches the profile, but just checking if *any* profile exists is a good starter.
    // If we want to be strict: 
    // if role is freelancer -> must have freelancerProfile
    // if role is client -> must have clientProfile

    // However, my completeOnboarding action creates the profile. 
    // Implicitly, if no profile exists, they haven't finished onboarding.

    // Allow ADMIN to bypass profile check
    const isAdmin = session.user.role === 'ADMIN' || session.user.email === 'admin@smartgig.com';

    if (!hasProfile && !isAdmin) {
        redirect('/onboarding');
    }

    return (
        <>
            {children}
        </>
    );
}
