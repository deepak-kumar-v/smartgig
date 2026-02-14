import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/lifecycle-events/job/[jobId]
 *
 * Job-rooted lifecycle event aggregation.
 *
 * Correct aggregation:
 *   1. Fetch job by jobId
 *   2. Fetch proposals where proposal.jobId = jobId
 *   3. Fetch contracts where contract.proposalId IN proposals
 *   4. Fetch LifecycleEvents where:
 *        jobId = jobId
 *        OR proposalId IN proposals
 *        OR contractId IN contracts
 *   5. Merge + sort by createdAt ASC
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await params;

        // 1. Fetch job
        const job = await db.jobPost.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                status: true,
                category: true,
                budgetType: true,
                budgetMax: true,
                client: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { name: true, image: true } },
                    },
                },
            },
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // 2. Fetch proposals for this job
        const proposals = await db.proposal.findMany({
            where: { jobId },
            select: {
                id: true,
                status: true,
                freelancerId: true,
                freelancer: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { name: true, image: true } },
                    },
                },
            },
        });

        const proposalIds = proposals.map((p) => p.id);

        // 3. Fetch contracts linked to these proposals
        const contracts = await db.contract.findMany({
            where: { proposalId: { in: proposalIds } },
            select: {
                id: true,
                proposalId: true,
                status: true,
                type: true,
                title: true,
                totalBudget: true,
                clientId: true,
                freelancerId: true,
            },
        });

        const contractIds = contracts.map((c) => c.id);

        // Auth: User must be job owner OR a freelancer with a proposal on this job
        const isJobOwner = job.client.userId === session.user.id;
        const isLinkedFreelancer = proposals.some(
            (p) => p.freelancer.userId === session.user.id
        );

        if (!isJobOwner && !isLinkedFreelancer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 4. Fetch ALL lifecycle events across the entire job tree
        const orConditions: Array<Record<string, unknown>> = [
            { jobId },
        ];
        if (proposalIds.length > 0) {
            orConditions.push({ proposalId: { in: proposalIds } });
        }
        if (contractIds.length > 0) {
            orConditions.push({ contractId: { in: contractIds } });
        }

        const events = await (db as any).lifecycleEvent.findMany({
            where: { OR: orConditions },
            orderBy: { createdAt: 'asc' },
        });

        // 5. Fetch financial data from escrow (additive — no schema changes)
        let financialData = null;
        if (contractIds.length > 0) {
            const escrow = await db.escrowAccount.findFirst({
                where: { contractId: { in: contractIds } },
                orderBy: { totalDeposited: 'desc' },
                select: {
                    totalDeposited: true,
                    totalReleased: true,
                    balance: true,
                },
            });
            const primaryBudget = contracts.reduce((sum, c) => sum + (c.totalBudget || 0), 0);
            financialData = {
                totalBudget: primaryBudget,
                totalDeposited: escrow?.totalDeposited || 0,
                totalReleased: escrow?.totalReleased || 0,
                balance: escrow?.balance || 0,
            };
        }

        // 6. Fetch interaction counts (lightweight aggregation)
        let interactionCounts = { messages: 0, edits: 0, changeRequests: 0, disputes: 0 };
        if (contractIds.length > 0) {
            // Message count from conversations linked to these contracts
            const conversations = await db.conversation.findMany({
                where: { contractId: { in: contractIds } },
                select: { id: true },
            });
            const conversationIds = conversations.map(c => c.id);
            if (conversationIds.length > 0) {
                interactionCounts.messages = await db.message.count({
                    where: { conversationId: { in: conversationIds } },
                });
                interactionCounts.edits = await db.message.count({
                    where: { conversationId: { in: conversationIds }, isEdited: true },
                });
            }
            // Change requests and disputes from lifecycle events
            interactionCounts.changeRequests = (events as any[]).filter(
                (e: any) => e.eventType === 'CHANGES_REQUESTED'
            ).length;
            interactionCounts.disputes = (events as any[]).filter(
                (e: any) => e.eventType === 'DISPUTE_RAISED'
            ).length;
        }

        // Determine primary contract (latest active or most recent)
        const primaryContract = contracts.length > 0
            ? contracts.find((c) => c.status === 'ACTIVE')
            || contracts.find((c) => c.status === 'FINALIZED')
            || contracts.find((c) => c.status === 'ACCEPTED')
            || contracts.find((c) => c.status === 'PENDING_REVIEW')
            || contracts.find((c) => c.status === 'DRAFT')
            || contracts[contracts.length - 1]
            : null;

        return NextResponse.json({
            job,
            proposals: proposals.map((p) => ({
                id: p.id,
                status: p.status,
                freelancerName: p.freelancer.user.name,
                freelancerImage: p.freelancer.user.image,
            })),
            contracts: contracts.map((c) => ({
                id: c.id,
                proposalId: c.proposalId,
                status: c.status,
                type: c.type,
                title: c.title,
                totalBudget: c.totalBudget,
            })),
            primaryContract: primaryContract
                ? {
                    id: primaryContract.id,
                    status: primaryContract.status,
                    type: primaryContract.type,
                    title: primaryContract.title,
                }
                : null,
            events,
            role: isJobOwner ? 'CLIENT' : 'FREELANCER',
            clientName: job.client.user.name || 'Client',
            freelancerName: isLinkedFreelancer
                ? session.user.name || 'Freelancer'
                : proposals[0]?.freelancer.user.name || 'Freelancer',
            financialData,
            interactionCounts,
        });
    } catch (error) {
        console.error('[LifecycleEvents Job API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
