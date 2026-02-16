import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recordLifecycleEvent } from '@/lib/lifecycle-events';

// GET /api/messages?conversationId=xxx
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        // Verify user has access to this conversation via participants
        const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    select: { userId: true }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization: User must be a participant
        const isParticipant = conversation.participants.some(p => p.userId === session.user.id);
        if (!isParticipant) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch ALL messages in chronological order
        const messages = await db.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                },
                attachments: {
                    select: {
                        id: true,
                        name: true,
                        url: true,
                        fileType: true,
                        size: true
                    }
                },
                reactions: {
                    select: {
                        id: true,
                        userId: true,
                        emoji: true
                    }
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        sender: { select: { id: true, name: true } },
                        isDeleted: true,
                        isEdited: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Parse callMeta JSON for each message
        const parsedMessages = messages.map((msg: any) => ({
            ...msg,
            callMeta: msg.callMeta ? JSON.parse(msg.callMeta) : null
        }));

        return NextResponse.json({
            messages: parsedMessages
        });
    } catch (error) {
        console.error('GET /api/messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messages - Fallback for sending messages when socket is down
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { conversationId, content, attachments = [], type = 'TEXT', callMeta, replyToId } = body;

        // Validation: For TEXT messages, need content or attachments. For CALL messages, need callMeta.
        if (type === 'CALL') {
            if (!conversationId || !callMeta) {
                return NextResponse.json({ error: 'conversationId and callMeta are required for calls' }, { status: 400 });
            }
        } else if (!conversationId || (!content?.trim() && (!attachments || attachments.length === 0))) {
            return NextResponse.json({ error: 'conversationId and content or attachment are required' }, { status: 400 });
        }

        // Verify user has access to this conversation via participants
        const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    select: { userId: true }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Authorization: User must be a participant
        const isParticipant = conversation.participants.some(p => p.userId === session.user.id);
        if (!isParticipant) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // FIRST_MESSAGE_SENT detection — fire once per conversation
        const existingMessageCount = await db.message.count({ where: { conversationId } });
        if (existingMessageCount === 0) {
            const convDetails = conversation as any;
            recordLifecycleEvent({
                proposalId: convDetails.proposalId ?? undefined,
                contractId: convDetails.contractId ?? undefined,
                eventType: 'FIRST_MESSAGE_SENT',
                devState: 'ENGAGED',
                userMessage: 'Conversation initiated',
                actorId: session.user.id,
                actorRole: session.user.role === 'CLIENT' ? 'CLIENT' : 'FREELANCER',
                category: 'SYSTEM',
            });
        }

        // Create message with attachments (and optionally call metadata)
        const message = await db.message.create({
            data: {
                conversationId,
                senderId: session.user.id,
                content: content?.trim() || (type === 'CALL' ? `Started a ${callMeta?.mode || 'video'} call` : 'Sent an attachment'),
                type,
                callMeta: callMeta ? JSON.stringify(callMeta) : null,
                ...(replyToId ? { replyToId } : {}),
                attachments: {
                    create: attachments.map((att: any) => ({
                        name: att.name,
                        url: att.url,
                        fileType: att.type,
                        size: att.size || 0
                    }))
                }
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                },
                attachments: true,
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        senderId: true,
                        sender: { select: { id: true, name: true } },
                        isDeleted: true,
                        isEdited: true
                    }
                }
            }
        });

        // Parse callMeta for response
        const responseMessage = {
            ...message,
            callMeta: (message as any).callMeta ? JSON.parse((message as any).callMeta) : null
        };

        return NextResponse.json({ message: responseMessage });
    } catch (error) {
        console.error('POST /api/messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
