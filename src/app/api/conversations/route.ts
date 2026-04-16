import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/conversations - Get user's conversations (proposal OR contract linked)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get all conversations where user is a participant AND there's a proposal OR contract
        const conversations = await db.conversation.findMany({
            where: {
                AND: [
                    // Must have a proposal OR contract (authoritative link)
                    { OR: [{ proposalId: { not: null } }, { contractId: { not: null } }] },
                    {
                        participants: {
                            some: { userId }
                        }
                    }
                ]
            },
            include: {
                proposal: {
                    select: {
                        id: true,
                        job: { select: { title: true, allowTrialTask: true } },
                        status: true
                    }
                },
                contract: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        type: true
                    }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true, freelancerProfile: { select: { id: true } } }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const conversationIds = conversations.map(conversation => conversation.id);
        const unreadCountsByConversation = new Map<string, number>();

        if (conversationIds.length > 0) {
            const unreadCounts = await db.message.groupBy({
                by: ['conversationId'],
                where: {
                    conversationId: { in: conversationIds },
                    senderId: { not: userId },
                    readAt: null
                },
                _count: {
                    _all: true
                }
            });

            for (const row of unreadCounts) {
                unreadCountsByConversation.set(row.conversationId, row._count._all);
            }
        }

        // Fetch latest reaction per conversation (for sidebar preview persistence)
        const latestReactionsByConversation = new Map<string, { id: string; messageId: string; userId: string; emoji: string; createdAt: Date; messageContent: string }>();

        if (conversationIds.length > 0) {
            for (const convId of conversationIds) {
                const latestReaction = await db.messageReaction.findFirst({
                    where: {
                        message: { conversationId: convId }
                    },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        messageId: true,
                        userId: true,
                        emoji: true,
                        createdAt: true,
                        message: { select: { content: true } }
                    }
                });
                if (latestReaction) {
                    latestReactionsByConversation.set(convId, {
                        id: latestReaction.id,
                        messageId: latestReaction.messageId,
                        userId: latestReaction.userId,
                        emoji: latestReaction.emoji,
                        createdAt: latestReaction.createdAt,
                        messageContent: latestReaction.message.content
                    });
                }
            }
        }

        // Transform data for frontend
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p.userId !== userId)?.user;
            const lastMessage = conv.messages[0] || null;
            const latestReaction = latestReactionsByConversation.get(conv.id) || null;

            // Use contract title, or fallback to proposal job title
            const title = conv.contract?.title || conv.proposal?.job?.title || null;

            return {
                id: conv.id,
                proposalId: conv.proposalId,
                contractId: conv.contractId,
                contractTitle: title,
                jobAllowsTrial: conv.proposal?.job?.allowTrialTask || false,
                contractStatus: conv.contract?.status || conv.proposal?.status || null,
                contractType: conv.contract?.type || null,
                otherParticipant: otherParticipant ? {
                    id: otherParticipant.id,
                    name: otherParticipant.name,
                    image: otherParticipant.image,
                    freelancerProfileId: (otherParticipant as any).freelancerProfile?.id || null
                } : null,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    type: (lastMessage as any).type || 'TEXT',
                    audioUrl: (lastMessage as any).audioUrl || null,
                    createdAt: lastMessage.createdAt.toISOString(),
                    senderId: lastMessage.senderId,
                    senderName: lastMessage.sender.name,
                    deliveredAt: (lastMessage as any).deliveredAt?.toISOString?.() ?? null,
                    readAt: (lastMessage as any).readAt?.toISOString?.() ?? null,
                    isEdited: (lastMessage as any).isEdited ?? false,
                    isDeleted: (lastMessage as any).isDeleted ?? false
                } : null,
                latestReaction: latestReaction ? {
                    id: latestReaction.id,
                    messageId: latestReaction.messageId,
                    userId: latestReaction.userId,
                    emoji: latestReaction.emoji,
                    createdAt: latestReaction.createdAt.toISOString(),
                    messageContent: latestReaction.messageContent
                } : null,
                createdAt: conv.createdAt.toISOString(),
                unreadCount: unreadCountsByConversation.get(conv.id) || 0
            };
        });

        return NextResponse.json({ conversations: formattedConversations });
    } catch (error) {
        console.error('GET /api/conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/conversations - Create conversation for a contract (if not exists)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { contractId } = body;

        if (!contractId) {
            return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
        }

        // Get contract and verify user is a party
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                client: { select: { userId: true } },
                freelancer: { select: { userId: true } },
                conversation: true
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        }

        const clientUserId = contract.client.userId;
        const freelancerUserId = contract.freelancer.userId;

        if (session.user.id !== clientUserId && session.user.id !== freelancerUserId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Return existing conversation if exists
        if (contract.conversation) {
            return NextResponse.json({
                conversationId: contract.conversation.id,
                created: false
            });
        }

        // Create new conversation with participants
        const conversation = await db.conversation.create({
            data: {
                contractId: contract.id,
                participants: {
                    create: [
                        { userId: clientUserId },
                        { userId: freelancerUserId }
                    ]
                }
            }
        });

        return NextResponse.json({
            conversationId: conversation.id,
            created: true
        });
    } catch (error) {
        console.error('POST /api/conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
