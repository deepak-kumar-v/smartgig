import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ContractDetailView } from '@/app/(dashboard)/client/contracts/[contractId]/contract-detail-view';

interface PageProps {
    params: Promise<{
        contractId: string;
    }>;
}

export default async function FreelancerContractDetailPage({ params }: PageProps) {
    const { contractId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Fetch Freelancer Profile
    const freelancer = await db.freelancerProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (!freelancer) {
        redirect('/onboarding/freelancer');
    }

    // Fetch Contract with relations
    const contract = await db.contract.findUnique({
        where: { id: contractId },
        include: {
            client: {
                include: { user: { select: { name: true, email: true, image: true } } }
            },
            freelancer: {
                include: { user: { select: { name: true, email: true, image: true } } }
            },
            proposal: {
                select: { id: true, coverLetter: true, milestones: true, jobId: true, rateType: true }
            },
            conversation: { select: { id: true } },
            milestones: true
        }
    });

    if (!contract) {
        notFound();
    }

    // Authorization: Must be the freelancer on this contract
    if (contract.freelancerId !== freelancer.id) {
        redirect('/freelancer/contracts');
    }

    // Contract data is clean and authoritative. No parsing of proposal snapshots.

    const contractData = {
        id: contract.id,
        title: contract.title,
        totalBudget: contract.totalBudget,
        status: contract.status,
        terms: contract.terms,
        type: contract.type,
        startDate: contract.startDate,
        endDate: contract.endDate,

        // Client (for freelancer view, show client info)
        freelancerName: contract.client.user.name || 'Client',
        freelancerEmail: contract.client.user.email,
        freelancerImage: contract.client.user.image,

        // Meta
        proposalId: contract.proposal?.id || null,
        jobId: contract.proposal?.jobId || null,
        conversationId: contract.conversation?.id || null,
        rateType: contract.proposal?.rateType || 'FIXED',
        milestones: contract.milestones || [],
        hourlyWorkPlan: [] // Contracts start empty
    };

    return (
        <DashboardShell role="freelancer">
            <ContractDetailView contract={contractData} role="FREELANCER" />
        </DashboardShell>
    );
}
