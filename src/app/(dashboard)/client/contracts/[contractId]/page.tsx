import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ContractDetailView } from './contract-detail-view';

interface PageProps {
    params: Promise<{
        contractId: string;
    }>;
}

export default async function ClientContractDetailPage({ params }: PageProps) {
    const { contractId } = await params;
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
                select: {
                    id: true,
                    coverLetter: true,
                    milestones: true,
                    jobId: true,
                    rateType: true,
                    hourlyWorkPlan: true
                }
            },
            conversation: { select: { id: true } },
            milestones: true
        }
    });

    if (!contract) {
        notFound();
    }

    // Authorization: Must own this contract
    if (contract.clientId !== client.id) {
        redirect('/client/contracts');
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

        // Freelancer
        freelancerName: contract.freelancer.user.name || 'Freelancer',
        freelancerEmail: contract.freelancer.user.email,
        freelancerImage: contract.freelancer.user.image,

        // Meta
        proposalId: contract.proposal?.id || null,
        jobId: contract.proposal?.jobId || null,
        conversationId: contract.conversation?.id || null,
        rateType: contract.proposal?.rateType || 'FIXED',
        milestones: contract.milestones || [],
        hourlyWorkPlan: [] // Contracts start empty, do not show proposal plan
    };

    return (
        <DashboardShell role="client">
            <ContractDetailView contract={contractData} role="CLIENT" />
        </DashboardShell>
    );
}
