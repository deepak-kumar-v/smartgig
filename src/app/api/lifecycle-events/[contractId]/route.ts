import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ contractId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contractId } = await params;

        // Get contract to verify access and fetch linked IDs
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            select: {
                id: true,
                proposalId: true,
                status: true,
                type: true,
                title: true,
                proposal: {
                    select: { jobId: true }
                },
                client: {
                    select: { userId: true }
                },
                freelancer: {
                    select: { userId: true }
                },
            },
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Authorization: must be client or freelancer on this contract
        const isClient = contract.client.userId === session.user.id;
        const isFreelancer = contract.freelancer.userId === session.user.id;

        if (!isClient && !isFreelancer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch all lifecycle events linked to this contract, its proposal, or its job
        const events = await (db as any).lifecycleEvent.findMany({
            where: {
                OR: [
                    { contractId },
                    { proposalId: contract.proposalId },
                    { jobId: contract.proposal?.jobId },
                ].filter(Boolean),
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({
            events,
            contract: {
                id: contract.id,
                status: contract.status,
                type: contract.type,
                title: contract.title,
            },
            role: isClient ? 'CLIENT' : 'FREELANCER',
        });
    } catch (error) {
        console.error('[LifecycleEvents API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
