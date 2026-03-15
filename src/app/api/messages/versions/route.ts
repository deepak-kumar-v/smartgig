import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/messages/versions?messageId=xxx
// Lazy-loaded: only fetched when user clicks "View history"
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const messageId = request.nextUrl.searchParams.get('messageId');
        if (!messageId) {
            return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
        }

        // Fetch message to verify access
        const message = await db.message.findUnique({
            where: { id: messageId },
            select: {
                id: true,
                conversationId: true,
                type: true,
                audioUrl: true,
                conversation: {
                    include: {
                        participants: {
                            select: { userId: true }
                        }
                    }
                }
            }
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Authorization: user must be a participant in the conversation, OR an ADMIN
        const userRole = (session.user as { role?: string }).role;
        const isAdmin = userRole === 'ADMIN';
        const isParticipant = message.conversation.participants.some(
            p => p.userId === session.user.id
        );
        if (!isParticipant && !isAdmin) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch version history ordered chronologically
        const versions = await db.messageVersion.findMany({
            where: { messageId },
            orderBy: { versionNumber: 'asc' }
        });

        return NextResponse.json({
            versions,
            messageType: message.type,
            audioUrl: message.audioUrl
        });
    } catch (error) {
        console.error('GET /api/messages/versions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
