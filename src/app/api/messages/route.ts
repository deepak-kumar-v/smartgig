import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/messages?conversationId=xxx
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const conversationId = searchParams.get('conversationId');
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const cursor = searchParams.get('cursor'); // For pagination

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

        // Fetch messages
        const messages = await db.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
        });

        return NextResponse.json({
            messages: messages.reverse(), // Return in chronological order
            nextCursor: messages.length === limit ? messages[0]?.id : null
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
        const { conversationId, content } = body;

        if (!conversationId || !content?.trim()) {
            return NextResponse.json({ error: 'conversationId and content are required' }, { status: 400 });
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

        // Create message
        const message = await db.message.create({
            data: {
                conversationId,
                senderId: session.user.id,
                content: content.trim()
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error('POST /api/messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
