import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProposalDetailView } from './proposal-detail-view';

interface PageProps {
    params: Promise<{
        proposalId: string;
    }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
    const { proposalId } = await params;
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

    // Fetch Proposal with all relations
    const proposal = await db.proposal.findUnique({
        where: { id: proposalId },
        include: {
            job: { select: { id: true, title: true, clientId: true, allowTrialTask: true } },
            freelancer: {
                include: {
                    user: { select: { name: true, image: true, trustScore: true } }
                }
            },
            conversation: { select: { id: true } },
            contracts: { select: { id: true, type: true, status: true } }
        }
    });

    // Check existence
    if (!proposal) {
        notFound();
    }

    // Authorization: Ensure this proposal belongs to the client's job
    if (proposal.job.clientId !== client.id) {
        redirect('/client/proposals'); // Unauthorized
    }

    // Parse JSON fields safely
    let milestones: any[] = [];
    let screeningAnswers: Record<string, string> = {};
    let selectedPortfolioIds: string[] = [];

    try {
        if (proposal.milestones) {
            milestones = JSON.parse(proposal.milestones);
        }
    } catch (e) {
        console.error("Failed to parse milestones", e);
    }

    try {
        if (proposal.screeningAnswers) {
            screeningAnswers = JSON.parse(proposal.screeningAnswers);
        }
    } catch (e) {
        console.error("Failed to parse screeningAnswers", e);
    }

    try {
        if (proposal.selectedPortfolioIds) {
            selectedPortfolioIds = JSON.parse(proposal.selectedPortfolioIds);
        }
    } catch (e) {
        console.error("Failed to parse selectedPortfolioIds", e);
    }

    let hourlyWorkPlan: any[] = [];
    try {
        if (proposal.hourlyWorkPlan) {
            hourlyWorkPlan = JSON.parse(proposal.hourlyWorkPlan);
        }
    } catch (e) {
        console.error("Failed to parse hourlyWorkPlan", e);
    }

    // Map to view data
    const proposalData = {
        id: proposal.id,
        jobId: proposal.jobId,
        jobTitle: proposal.job.title,

        // Freelancer
        freelancerName: proposal.freelancer.user.name || 'Unknown Freelancer',
        freelancerTitle: proposal.freelancer.title || 'Freelancer',
        freelancerImage: proposal.freelancer.user.image || null,
        freelancerTrustScore: proposal.freelancer.user.trustScore,

        // Core
        coverLetter: proposal.coverLetter,
        proposedRate: proposal.proposedRate,
        rateType: proposal.rateType,
        availability: proposal.availability || 'Not specified',
        availabilityHoursPerWeek: proposal.availabilityHoursPerWeek,
        expectedStartDate: proposal.expectedStartDate,
        estimatedDuration: proposal.estimatedDuration,

        // Trial
        acceptsTrialTask: proposal.acceptsTrialTask,
        trialTaskProposal: proposal.trialTaskProposal,
        contractToHireAcceptance: proposal.contractToHireAcceptance,

        // Complex
        milestones,
        totalMilestoneAmount: proposal.totalMilestoneAmount,
        screeningAnswers,
        selectedPortfolioIds,

        // Meta
        status: proposal.status,
        createdAt: proposal.createdAt,

        // Messaging & Contract
        conversationId: proposal.conversation?.id || null,
        contractId: proposal.contracts.find(c => c.type === 'FULL')?.id || proposal.contracts[0]?.id || null,
        contractStatus: proposal.contracts.find(c => c.type === 'FULL')?.status || proposal.contracts[0]?.status || null,

        // Hourly Work Plan (optional)
        hourlyWorkPlan,

        // Trial eligibility
        jobAllowsTrialTask: proposal.job.allowTrialTask,
        trialContractId: proposal.contracts.find(c => c.type === 'TRIAL')?.id || null,
        trialContractStatus: proposal.contracts.find(c => c.type === 'TRIAL')?.status || null
    };

    return (
        <>
            <ProposalDetailView proposal={proposalData} />
        </>
    );
}
