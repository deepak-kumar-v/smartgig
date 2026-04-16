import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ contractId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contractId } = await params;
        const userId = session.user.id;

        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: {
                    select: {
                        userId: true,
                        user: { select: { name: true } },
                    },
                },
                freelancer: {
                    select: {
                        userId: true,
                        user: { select: { name: true } },
                    },
                },
            },
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Must be completed/closed
        if (!['COMPLETED', 'CLOSED'].includes(contract.status)) {
            return NextResponse.json({ error: 'Contract not eligible for review' }, { status: 400 });
        }

        // Must be a party to the contract
        const isClient = contract.client.userId === userId;
        const isFreelancer = contract.freelancer.userId === userId;
        if (!isClient && !isFreelancer) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const otherPartyName = isClient
            ? contract.freelancer.user.name || 'Freelancer'
            : contract.client.user.name || 'Client';

        return NextResponse.json({
            id: contract.id,
            title: contract.title,
            otherPartyName,
            totalBudget: contract.totalBudget,
            type: contract.type,
        });
    } catch (error) {
        console.error('Review data API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
