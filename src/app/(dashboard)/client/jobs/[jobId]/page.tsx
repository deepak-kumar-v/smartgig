import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { JobDetailsView, type JobDetailsData } from './job-details-view';

interface PageProps {
    params: Promise<{
        jobId: string;
    }>;
}

export default async function JobDetailsPage({ params }: PageProps) {
    const { jobId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Fetch Client Profile
    const client = await db.clientProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!client) {
        redirect('/onboarding/client');
    }

    // Fetch Job Post
    const jobRaw = await db.jobPost.findUnique({
        where: {
            id: jobId,
        },
        include: {
            skills: true, // Many-to-many relation
        }
    });

    // Check existence and ownership
    if (!jobRaw) {
        notFound();
    }

    if (jobRaw.clientId !== client.id) {
        // Prevent accessing other clients' jobs
        redirect('/client/dashboard-v3'); // Or 403 / 404
    }

    // Fetch Proposals for this Job
    const proposalsRaw = await db.proposal.findMany({
        where: { jobId: jobId },
        include: {
            freelancer: {
                include: {
                    user: { select: { name: true, image: true, trustScore: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Map DB Job to View Data
    // Safely parse JSON fields
    let attachments = [];
    try {
        if (jobRaw.attachments) {
            attachments = JSON.parse(jobRaw.attachments);
        }
    } catch (e) {
        console.error("Failed to parse attachments", e);
    }

    let screeningQuestions = [];
    try {
        if (jobRaw.screeningQuestions) {
            screeningQuestions = JSON.parse(jobRaw.screeningQuestions);
        }
    } catch (e) {
        console.error("Failed to parse screeningQuestions", e);
    }

    const jobData: JobDetailsData = {
        id: jobRaw.id,
        title: jobRaw.title,
        category: jobRaw.category || 'Other',
        subcategory: jobRaw.subcategory || undefined,
        customCategory: undefined, // Not stored explicitly? Or handled by frontend logic. Assuming 'Other' logic handles it.
        customSubcategory: undefined,

        budgetType: (jobRaw.budgetType as 'FIXED' | 'HOURLY') || 'FIXED',
        budgetMin: jobRaw.budgetMin || undefined,
        budgetMax: jobRaw.budgetMax,

        duration: jobRaw.duration || 'Unknown',
        experienceLevel: jobRaw.experienceLevel || 'Intermediate',

        shortDescription: jobRaw.overview || undefined,
        description: jobRaw.descriptionMd,

        skills: jobRaw.skills.map(s => s.name),

        weeklyHours: jobRaw.weeklyHours || undefined,

        projectType: (jobRaw.projectType as 'ONE_TIME' | 'ONGOING') || 'ONE_TIME',
        isRemote: jobRaw.isRemote,
        locationRestrictions: jobRaw.regions ? jobRaw.regions.split(',').filter(Boolean) : [],

        visibility: (jobRaw.visibility as 'PUBLIC' | 'INVITE_ONLY') || 'PUBLIC',

        allowTrialTask: jobRaw.allowTrialTask,
        contractToHire: jobRaw.contractToHire,

        screeningQuestions: screeningQuestions,
        attachments: attachments,

        status: jobRaw.status,
        createdAt: jobRaw.createdAt
    };

    // Map proposals to view data
    const proposals = proposalsRaw.map(p => ({
        id: p.id,
        freelancerName: p.freelancer.user.name || 'Unknown Freelancer',
        freelancerTitle: p.freelancer.title || 'Freelancer',
        freelancerImage: p.freelancer.user.image || null,
        freelancerTrustScore: p.freelancer.user.trustScore,
        coverLetterPreview: p.coverLetter.substring(0, 200) + (p.coverLetter.length > 200 ? '...' : ''),
        proposedRate: p.proposedRate,
        rateType: p.rateType,
        availability: p.availability || 'Not specified',
        status: p.status,
        createdAt: p.createdAt
    }));

    return (
        <DashboardShell role="client">
            <JobDetailsView job={jobData} proposals={proposals} />
        </DashboardShell>
    );
}
