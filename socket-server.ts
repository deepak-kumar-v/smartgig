import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const hostname = 'localhost';
const port = 3001;
const clientUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const prisma = new PrismaClient();

// Validate that user can access a conversation (must be in contract OR proposal)
async function canAccessConversation(userId: string, conversationId: string): Promise<boolean> {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            // Include minimal participants data for auth check
            participants: {
                select: { userId: true }
            }
        }
    });

    if (!conversation) {
        return false;
    }

    // Check if user is a participant
    return conversation.participants.some(p => p.userId === userId);
}

const httpServer = createServer((req, res) => {
    res.writeHead(200);
    res.end('Socket Server Running');
});

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: [clientUrl, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    path: '/socket.io' // Standard path, different from /api/socket to avoid nextjs conflict if proxying
});

// Store user-to-socket mapping
const userSockets = new Map<string, string>();

// Track active calls per conversation (conversationId -> callerId)
const activeCalls = new Map<string, string>();

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    const userId = socket.handshake.auth?.userId as string;
    const userRole = socket.handshake.auth?.userRole as string;

    if (!userId) {
        console.log('[Socket] No userId in handshake, disconnecting');
        socket.disconnect();
        return;
    }

    userSockets.set(userId, socket.id);
    console.log(`[Socket] User ${userId} (${userRole}) mapped to socket ${socket.id}`);

    // Join conversation room
    socket.on('join-conversation', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this conversation' });
            return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`[Socket] User ${userId} joined conversation:${conversationId}`);
        socket.emit('joined-conversation', { conversationId });
    });

    // Leave conversation room
    socket.on('leave-conversation', (data: { conversationId: string }) => {
        socket.leave(`conversation:${data.conversationId}`);
        console.log(`[Socket] User ${userId} left conversation:${data.conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data: { conversationId: string; content: string; attachments?: any[] }) => {
        const { conversationId, content, attachments = [] } = data;

        // --- EXPLICIT LOGGING (DEBUG) ---
        console.log('[SOCKET RECEIVE] send-message payload:', {
            conversationId,
            contentLen: content?.length,
            attachmentsCount: attachments?.length,
            attachmentsType: Array.isArray(attachments) ? 'Array' : typeof attachments
        });

        if (attachments && attachments.length > 0) {
            console.log('[ATTACHMENTS RAW]', JSON.stringify(attachments, null, 2));
        }
        // --------------------------------

        // --- VALIDATION AND FAIL FAST ---
        if (!conversationId) {
            socket.emit('error', { message: 'Missing conversationId' });
            return;
        }

        if (!content?.trim() && (!attachments || attachments.length === 0)) {
            socket.emit('error', { message: 'Empty message: content or attachment required' });
            return;
        }

        // Validate Attachments Structure strictly
        if (attachments && attachments.length > 0) {
            if (!Array.isArray(attachments)) {
                socket.emit('error', { message: 'Attachments must be an array' });
                return;
            }

            for (const [i, att] of attachments.entries()) {
                if (!att.name) {
                    socket.emit('error', { message: `Attachment ${i} missing name` });
                    return;
                }
                if (!att.url) {
                    socket.emit('error', { message: `Attachment ${i} missing url` });
                    return;
                }
                if (!att.type && !att.fileType) { // Allow either for now but prefer passed 'type'
                    socket.emit('error', { message: `Attachment ${i} missing type` });
                    return;
                }
                // Size check - be lenient on 0 but ensuring it's a number
                if (typeof att.size !== 'number' && typeof att.size !== 'undefined') {
                    // Try to parse if string
                    const parsed = parseInt(att.size);
                    if (isNaN(parsed)) {
                        socket.emit('error', { message: `Attachment ${i} invalid size: ${att.size}` });
                        return;
                    }
                }
            }
        }
        // --------------------------------

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this conversation' });
            return;
        }

        try {
            // --- STEP 1: CREATE MESSAGE ONLY ---
            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId: userId,
                    content: content?.trim() || 'Sent an attachment',
                },
                include: {
                    sender: {
                        select: { id: true, name: true, image: true }
                    }
                }
            });

            console.log('[DB] Message created:', message.id);

            // --- STEP 2: CREATE ATTACHMENTS (if any) ---
            let createdAttachments: any[] = [];

            if (attachments && attachments.length > 0) {
                console.log('[DB] Attempting to create attachments...');

                // Map to correct prisma model fields
                // Ensure 'size' is an Int
                const attachmentData = attachments.map(att => ({
                    name: String(att.name),
                    url: String(att.url),
                    fileType: String(att.type || att.fileType), // Handle simple mapping
                    size: typeof att.size === 'number' ? att.size : parseInt(att.size || '0', 10),
                    message: {
                        connect: { id: message.id }
                    }
                }));

                // Use createMany if expecting multiple, or loop if you want individual errors?
                // createMany is cleaner but supported? Yes on most DBs.
                // Note: SQLite doesn't support createMany in older Prisma versions, assuming Postgres/MySQL or recent Prisma.
                // Safest for debugging: Loop create so we catch exact failure if schema mismatch

                for (const attData of attachmentData) {
                    try {
                        const createdAtt = await prisma.attachment.create({
                            data: attData
                        });
                        createdAttachments.push(createdAtt);
                    } catch (attError) {
                        console.error('[DB] Failed to create individual attachment:', attData, attError);
                        throw new Error(`DB Attachment Insert Failed: ${(attError as Error).message}`);
                    }
                }

                console.log(`[DB] Created ${createdAttachments.length} attachments.`);
            }

            // re-assemble full object for broadcast
            const finalMessage = {
                ...message,
                attachments: createdAttachments
            };

            // Broadcast to all participants in the room
            io.to(`conversation:${conversationId}`).emit('new-message', {
                id: finalMessage.id,
                conversationId: finalMessage.conversationId,
                senderId: finalMessage.senderId,
                sender: finalMessage.sender,
                content: finalMessage.content,
                createdAt: finalMessage.createdAt.toISOString(),
                readAt: null,
                attachments: finalMessage.attachments
            });

            console.log(`[Socket] Message sent in conversation:${conversationId} by ${userId}`);

        } catch (error) {
            console.error('[Socket] CRITICAL DB ERROR:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
            socket.emit('error', { message: `Failed to send: ${errorMessage}` });
        }
    });

    // ==================== VIDEO CALL SIGNALING ====================

    // Start a call
    socket.on('call:start', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return; // Silent reject for non-participants

        // Enforce one active call per conversation
        if (activeCalls.has(conversationId)) {
            socket.emit('call:busy', { conversationId, message: 'Call already in progress' });
            return;
        }

        activeCalls.set(conversationId, userId);
        console.log(`[Call] User ${userId} started call in conversation:${conversationId}`);

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('call:incoming', {
            conversationId,
            callerId: userId
        });

        // Confirm to caller
        socket.emit('call:started', { conversationId });
    });

    // Accept incoming call
    socket.on('call:accept', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        console.log(`[Call] User ${userId} accepted call in conversation:${conversationId}`);

        // Notify caller that call was accepted
        socket.to(`conversation:${conversationId}`).emit('call:accepted', {
            conversationId,
            acceptedBy: userId
        });
    });

    // Reject incoming call
    socket.on('call:reject', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        console.log(`[Call] User ${userId} rejected call in conversation:${conversationId}`);
        activeCalls.delete(conversationId);

        socket.to(`conversation:${conversationId}`).emit('call:rejected', {
            conversationId,
            rejectedBy: userId
        });
    });

    // WebRTC SDP Offer
    socket.on('call:offer', async (data: { conversationId: string; offer: RTCSessionDescriptionInit }) => {
        const { conversationId, offer } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        console.log(`[Call] SDP Offer from ${userId} in conversation:${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('call:offer', {
            conversationId,
            offer,
            from: userId
        });
    });

    // WebRTC SDP Answer
    socket.on('call:answer', async (data: { conversationId: string; answer: RTCSessionDescriptionInit }) => {
        const { conversationId, answer } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        console.log(`[Call] SDP Answer from ${userId} in conversation:${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('call:answer', {
            conversationId,
            answer,
            from: userId
        });
    });

    // ICE Candidate exchange
    socket.on('call:ice-candidate', async (data: { conversationId: string; candidate: RTCIceCandidateInit }) => {
        const { conversationId, candidate } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        socket.to(`conversation:${conversationId}`).emit('call:ice-candidate', {
            conversationId,
            candidate,
            from: userId
        });
    });

    // End call
    socket.on('call:end', async (data: { conversationId: string }) => {
        const { conversationId } = data;

        const hasAccess = await canAccessConversation(userId, conversationId);
        if (!hasAccess) return;

        console.log(`[Call] User ${userId} ended call in conversation:${conversationId}`);
        activeCalls.delete(conversationId);

        socket.to(`conversation:${conversationId}`).emit('call:ended', {
            conversationId,
            endedBy: userId
        });
    });

    // ==================== END VIDEO CALL SIGNALING ====================

    // Handle disconnect
    socket.on('disconnect', () => {
        // Clean up any active calls this user was in
        for (const [conversationId, callerId] of activeCalls.entries()) {
            if (callerId === userId) {
                activeCalls.delete(conversationId);
                io.to(`conversation:${conversationId}`).emit('call:ended', {
                    conversationId,
                    endedBy: userId,
                    reason: 'disconnected'
                });
                console.log(`[Call] Cleaned up call in ${conversationId} due to disconnect`);
            }
        }

        userSockets.delete(userId);
        console.log(`[Socket] Client disconnected: ${socket.id} (user: ${userId})`);
    });
});

httpServer.listen(port, () => {
    console.log(`> Socket.IO server running on http://${hostname}:${port}`);
});

