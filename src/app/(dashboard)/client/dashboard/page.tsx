import React from 'react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ClientDashboardView, type ProposalItem, type JobItem, type DashboardStats } from './client-dashboard-view';
import { formatDistanceToNow } from 'date-fns';

export default async function ClientDashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    let stats: DashboardStats = {
        activeJobsCount: 0,
        newProposalsCount: 0,
        escrowAmount: 0,
        hiredCount: 0
    };
    let recentProposals: ProposalItem[] = [];
    let activeJobs: JobItem[] = [];

    try {
        // Fetch client profile - demo users are now created in DB when they post a job
        const client = await db.clientProfile.findUnique({
            where: { userId },
            include: {
                jobPosts: {
                    where: { status: 'OPEN' },
                    include: {
                        _count: { select: { proposals: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                contracts: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        // If client profile doesn't exist yet (new user who hasn't posted a job)
        if (!client) {
            console.log('[Client Dashboard] No client profile yet for user:', userId);
            // Keep default empty stats/jobs - user will see "No jobs posted yet"
        } else {
            // Get Recent Proposals for Client's Jobs
            const recentProposalsRaw = await db.proposal.findMany({
                where: {
                    job: { clientId: client.id },
                    status: 'PENDING'
                },
                include: {
                    job: true,
                    freelancer: {
                        include: {
                            user: { select: { name: true, trustScore: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 3
            });

            // Transform Proposals
            recentProposals = recentProposalsRaw.map(p => ({
                id: p.id,
                freelancerName: p.freelancer.user.name || 'Unknown Freelancer',
                freelancerInitials: (p.freelancer.user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2),
                role: p.freelancer.title || 'Freelancer',
                jobTitle: p.job.title,
                rate: p.proposedRate,
                skills: [],
                trustScore: p.freelancer.user.trustScore,
                submittedAt: formatDistanceToNow(p.createdAt, { addSuffix: true })
            }));

            // Transform Active Jobs
            activeJobs = client.jobPosts.map(j => ({
                id: j.id,
                title: j.title,
                proposalsCount: j._count.proposals,
                budget: j.budget,
                status: j.status.toLowerCase()
            }));

            // Calculate Stats
            stats = {
                activeJobsCount: client.jobPosts.length,
                newProposalsCount: recentProposalsRaw.length,
                escrowAmount: client.contracts.reduce((sum, c) => sum + (c.totalBudget || 0), 0),
                hiredCount: client.contracts.length
            };
        }
    } catch (error) {
        // DB Error - show empty state with error logged
        console.error("[Client Dashboard] Database error:", error);
        // Keep default empty stats - don't use mock data
    }

    return (
        <ClientDashboardView
            stats={stats}
            recentProposals={recentProposals}
            activeJobs={activeJobs}
        />
    );
}
