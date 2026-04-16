import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
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
            milestones: { orderBy: { sequence: 'asc' }, include: { deliverables: { orderBy: { createdAt: 'asc' } } } },
            escrowAccount: {
                include: {
                    locks: {
                        select: { amount: true, released: true, milestoneId: true }
                    }
                }
            }
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
        freelancerProfileId: contract.freelancer.id,
        freelancerName: contract.client.user.name || 'Client',
        freelancerEmail: contract.client.user.email,
        freelancerImage: contract.client.user.image,

        // Meta
        proposalId: contract.proposal?.id || null,
        jobId: contract.proposal?.jobId || null,
        conversationId: contract.conversation?.id || null,
        rateType: contract.proposal?.rateType || 'FIXED',
        milestones: contract.milestones.map(m => ({
            ...m,
            dueDate: m.dueDate ? m.dueDate.toISOString() : null,
            deliverables: (m as any).deliverables?.map((d: any) => ({
                ...d,
                createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
            })) ?? [],
        })),
        escrowAccount: contract.escrowAccount,
        hourlyWorkPlan: [] // Contracts start empty
    };

    if (contract.status === 'DRAFT') {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8">
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-8 h-8 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Contract Being Prepared
                    </h2>
                    <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                        The client is currently preparing this contract.
                        You will be notified once it is ready for your review.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ContractDetailView contract={contractData} role="FREELANCER" />
        </>
    );
}
