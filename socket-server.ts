import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

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

app.prepare().then(() => {

    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: dev ? `http://localhost:${port}` : (process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`),
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/socket.io'
    });

    // Expose io globally for server actions (e.g. dispute-actions.ts)
    (globalThis as any).__socketIO = io;

    // Store user-to-socket mapping
    const userSockets = new Map<string, string>();
    const socketUsers = new Map<string, string>();

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
        socketUsers.set(socket.id, userId);
        console.log(`[Socket] User ${userId} (${userRole}) mapped to socket ${socket.id}`);

        const isUserPresentInConversationRoom = (conversationId: string, targetUserId: string): boolean => {
            const roomSockets = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
            if (!roomSockets) return false;

            for (const roomSocketId of roomSockets.values()) {
                const roomUserId = socketUsers.get(roomSocketId);
                if (roomUserId === targetUserId) {
                    return true;
                }
            }

            return false;
        };

        const markConversationDeliveredForUser = async (conversationId: string, recipientId: string) => {
            const undelivered = await prisma.message.findMany({
                where: {
                    conversationId,
                    senderId: { not: recipientId },
                    deliveredAt: null
                },
                select: { id: true }
            });

            if (undelivered.length === 0) return;

            const messageIds = undelivered.map(message => message.id);
            const deliveredAt = new Date();

            const updated = await prisma.message.updateMany({
                where: {
                    id: { in: messageIds },
                    deliveredAt: null
                },
                data: {
                    deliveredAt
                }
            });

            if (updated.count === 0) {
                return;
            }

            console.log('[Socket][emit] message:delivered:update', {
                conversationId,
                recipientId,
                messageIds,
                deliveredAt: deliveredAt.toISOString(),
                count: updated.count
            });
            io.to(`conversation:${conversationId}`).emit('message:delivered:update', {
                conversationId,
                messageIds,
                deliveredAt: deliveredAt.toISOString()
            });
        };

        const emitUnreadCountForConversation = async (conversationId: string, targetUserId: string) => {
            const targetSocketId = userSockets.get(targetUserId);
            if (!targetSocketId) return;

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId,
                    senderId: { not: targetUserId },
                    readAt: null
                }
            });

            console.log('[Socket][emit] conversation:unread:update', {
                conversationId,
                targetUserId,
                unreadCount
            });
            io.to(targetSocketId).emit('conversation:unread:update', {
                conversationId,
                unreadCount
            });
        };

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

            // Mark previously undelivered incoming messages as delivered for this user.
            await markConversationDeliveredForUser(conversationId, userId);
        });

        // Leave conversation room
        socket.on('leave-conversation', (data: { conversationId: string }) => {
            socket.leave(`conversation:${data.conversationId}`);
            console.log(`[Socket] User ${userId} left conversation:${data.conversationId}`);
        });

        // Send message (text, attachment, or call)
        socket.on('send-message', async (data: {
            conversationId: string;
            content: string;
            attachments?: any[];
            type?: string;
            audioUrl?: string;
            callMeta?: { mode: string; provider: string; meetingUrl: string };
            clientTempId?: string;
            replyToId?: string;
        }) => {
            const { conversationId, content, attachments = [], type = 'TEXT', audioUrl, callMeta, clientTempId, replyToId } = data;

            // --- EXPLICIT LOGGING (DEBUG) ---
            console.log('[DIAG][SOCKET_SERVER_RECEIVE] send-message:', {
                socketUserId: userId,
                socketUserRole: userRole,
                socketId: socket.id,
                conversationId,
                contentLen: content?.length,
                attachmentsCount: attachments?.length,
                type,
                hasCallMeta: !!callMeta,
                clientTempId
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

            // For CALL messages, only need callMeta
            if (type === 'CALL') {
                if (!callMeta?.meetingUrl) {
                    socket.emit('error', { message: 'Call requires meetingUrl' });
                    return;
                }
            } else if (type !== 'AUDIO' && !content?.trim() && (!attachments || attachments.length === 0)) {
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
                // Determine content based on type
                const messageContent = type === 'CALL'
                    ? `Started a ${callMeta?.mode || 'video'} call`
                    : type === 'AUDIO'
                        ? ''
                        : (content?.trim() || 'Sent an attachment');

                // [DIAG] Log audioUrl before DB insert
                if (type === 'AUDIO') {
                    console.log('[DIAG] Saving AUDIO message with audioUrl:', audioUrl);
                }

                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: userId,
                        content: messageContent,
                        type,
                        audioUrl: type === 'AUDIO' ? (audioUrl || null) : null,
                        callMeta: callMeta ? JSON.stringify(callMeta) : null,
                        ...(replyToId ? { replyToId } : {}),
                    },
                    include: {
                        sender: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                });

                console.log('[DIAG][DB_MESSAGE_CREATED]', {
                    messageId: message.id,
                    dbSenderId: message.senderId,
                    socketUserId: userId,
                    senderIdMatchesSocket: message.senderId === userId,
                    conversationId: message.conversationId
                });

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

                // CRITICAL: Re-fetch the FULL message with attachments included
                // This ensures socket payload matches API response shape exactly
                const fullMessage = await prisma.message.findUnique({
                    where: { id: message.id },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
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

                if (!fullMessage) {
                    throw new Error('Message created but not found on refetch');
                }

                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: {
                        participants: {
                            select: { userId: true }
                        }
                    }
                });

                if (!conversation) {
                    throw new Error('Conversation not found while sending message');
                }

                const allRecipientIds = conversation.participants
                    .map(p => p.userId)
                    .filter(participantId => participantId !== userId);

                const inRoomRecipientIds = allRecipientIds
                    .filter(recipientId => isUserPresentInConversationRoom(conversationId, recipientId));

                // If recipient is currently connected in-room, persist delivery before new-message emit.
                for (const recipientId of inRoomRecipientIds) {
                    await markConversationDeliveredForUser(conversationId, recipientId);
                }

                // Refresh status fields after potential delivery updates.
                const statusSnapshot = await prisma.message.findUnique({
                    where: { id: fullMessage.id },
                    select: {
                        deliveredAt: true,
                        readAt: true
                    }
                });

                // Broadcast to all participants in the room
                console.log('[DIAG][SOCKET_EMIT] new-message', {
                    conversationId,
                    messageId: fullMessage.id,
                    emittedSenderId: fullMessage.senderId,
                    socketUserId: userId,
                    deliveredAt: statusSnapshot?.deliveredAt?.toISOString() || null,
                    readAt: statusSnapshot?.readAt?.toISOString() || null
                });
                io.to(`conversation:${conversationId}`).emit('new-message', {
                    id: fullMessage.id,
                    clientTempId,
                    conversationId: fullMessage.conversationId,
                    senderId: fullMessage.senderId,
                    sender: fullMessage.sender,
                    content: fullMessage.content,
                    type: (fullMessage as any).type || 'TEXT',
                    audioUrl: (fullMessage as any).audioUrl || null,
                    callMeta: (fullMessage as any).callMeta
                        ? JSON.parse((fullMessage as any).callMeta)
                        : null,
                    createdAt: fullMessage.createdAt.toISOString(),
                    deliveredAt: statusSnapshot?.deliveredAt ? statusSnapshot.deliveredAt.toISOString() : null,
                    readAt: statusSnapshot?.readAt ? statusSnapshot.readAt.toISOString() : null,
                    attachments: fullMessage.attachments,
                    replyTo: fullMessage.replyTo || null,
                    isDeleted: (fullMessage as any).isDeleted || false,
                    isEdited: (fullMessage as any).isEdited || false,
                    editedAt: (fullMessage as any).editedAt?.toISOString() || null
                });

                // Unread badge is server-authoritative: push fresh unread count to recipients.
                for (const recipientId of allRecipientIds) {
                    await emitUnreadCountForConversation(conversationId, recipientId);
                }

                console.log(`[Socket] Message sent in conversation:${conversationId} by ${userId} (type: ${type}) with ${fullMessage.attachments.length} attachments`);

            } catch (error) {
                console.error('[Socket] CRITICAL DB ERROR:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
                socket.emit('error', { message: `Failed to send: ${errorMessage}` });
            }
        });

        // ==================== VIDEO CALL SIGNALING ====================

        // Start a call
        // FIXED: Accept callType and callMeta from client and forward to callee
        socket.on('call:start', async (data: { conversationId: string; type?: string; callMeta?: any }) => {
            const { conversationId, type, callMeta } = data;

            const hasAccess = await canAccessConversation(userId, conversationId);
            if (!hasAccess) return; // Silent reject for non-participants

            // Enforce one active call per conversation
            if (activeCalls.has(conversationId)) {
                socket.emit('call:busy', { conversationId, message: 'Call already in progress' });
                return;
            }

            activeCalls.set(conversationId, userId);
            console.log(`[Call] User ${userId} started ${type || 'video'} call in conversation:${conversationId}`);

            // Notify other participants - CRITICAL: forward type and callMeta
            socket.to(`conversation:${conversationId}`).emit('call:incoming', {
                conversationId,
                callerId: userId,
                type: type,         // Forward call type (audio/video)
                callMeta: callMeta  // Forward call metadata
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

        // ==================== READ RECEIPTS ====================

        socket.on('message:read', async (data: { conversationId: string }) => {
            const { conversationId } = data;
            if (!conversationId) return;
            console.log('[Socket][event] message:read', { conversationId, readerId: userId });

            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: {
                        select: { userId: true }
                    }
                }
            });

            if (!conversation) return;

            const hasAccess = conversation.participants.some(p => p.userId === userId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            // v1 scope: read receipts are only for 1-to-1 conversations
            if (conversation.participants.length !== 2) {
                return;
            }

            const unreadIncoming = await prisma.message.findMany({
                where: {
                    conversationId,
                    senderId: { not: userId },
                    readAt: null
                },
                select: { id: true }
            });

            if (unreadIncoming.length === 0) return;

            const messageIds = unreadIncoming.map(message => message.id);
            const readAt = new Date();

            const updated = await prisma.message.updateMany({
                where: {
                    id: { in: messageIds },
                    readAt: null
                },
                data: {
                    readAt
                }
            });

            if (updated.count === 0) return;

            console.log('[Socket][emit] message:read:update', {
                conversationId,
                readerId: userId,
                messageIds,
                readAt: readAt.toISOString(),
                count: updated.count
            });
            io.to(`conversation:${conversationId}`).emit('message:read:update', {
                conversationId,
                messageIds,
                readAt: readAt.toISOString(),
                readerId: userId
            });

            // Reader's unread badge should update from DB state after successful mark-as-read.
            await emitUnreadCountForConversation(conversationId, userId);
        });

        // ==================== END READ RECEIPTS ====================

        // ==================== TYPING INDICATORS ====================

        socket.on('typing:start', (data: { conversationId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
                conversationId: data.conversationId,
                userId
            });
        });

        socket.on('typing:stop', (data: { conversationId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
                conversationId: data.conversationId,
                userId
            });
        });

        // ==================== END TYPING INDICATORS ====================

        // ==================== MESSAGE REACTIONS ====================

        socket.on('message:react', async (data: { messageId: string; conversationId: string; emoji: string }) => {
            const { messageId, conversationId, emoji } = data;

            const hasAccess = await canAccessConversation(userId, conversationId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            try {
                // Check if user already has a reaction on this message
                const existing = await prisma.messageReaction.findUnique({
                    where: { messageId_userId: { messageId, userId } }
                });

                if (existing) {
                    if (existing.emoji === emoji) {
                        // Same emoji → toggle off (remove)
                        await prisma.messageReaction.delete({
                            where: { id: existing.id }
                        });
                        console.log(`[Reaction] ${userId} removed ${emoji} from ${messageId}`);
                    } else {
                        // Different emoji → replace
                        await prisma.messageReaction.update({
                            where: { id: existing.id },
                            data: { emoji }
                        });
                        console.log(`[Reaction] ${userId} changed to ${emoji} on ${messageId}`);
                    }
                } else {
                    // No reaction → create
                    await prisma.messageReaction.create({
                        data: { messageId, userId, emoji }
                    });
                    console.log(`[Reaction] ${userId} reacted ${emoji} on ${messageId}`);
                }

                // Fetch fresh reaction list for this message and broadcast
                const reactions = await prisma.messageReaction.findMany({
                    where: { messageId },
                    select: { id: true, userId: true, emoji: true, createdAt: true }
                });

                io.to(`conversation:${conversationId}`).emit('reaction:update', {
                    messageId,
                    conversationId,
                    reactions
                });
            } catch (error) {
                console.error('[Reaction] Error:', error);
                socket.emit('error', { message: 'Failed to process reaction' });
            }
        });

        // ==================== END MESSAGE REACTIONS ====================

        // ==================== MESSAGE EDIT & DELETE (ENTERPRISE) ====================

        // Transactional message edit with immutable version history
        socket.on('message:edit', async (data: { messageId: string; conversationId: string; content: string }) => {
            const { messageId, conversationId, content } = data;

            if (!messageId || !conversationId || !content?.trim()) {
                socket.emit('error', { message: 'messageId, conversationId, and content are required' });
                return;
            }

            const hasAccess = await canAccessConversation(userId, conversationId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            try {
                // Transactional: version snapshot + message update (atomic)
                const result = await prisma.$transaction(async (tx) => {
                    // Step 1: Fetch current message (verify ownership + not deleted)
                    const currentMessage = await tx.message.findUnique({
                        where: { id: messageId },
                        select: { id: true, senderId: true, content: true, isDeleted: true, conversationId: true }
                    });

                    if (!currentMessage) throw new Error('Message not found');
                    if (currentMessage.senderId !== userId) throw new Error('Only the sender can edit');
                    if (currentMessage.isDeleted) throw new Error('Cannot edit a deleted message');
                    if (currentMessage.conversationId !== conversationId) throw new Error('Message does not belong to this conversation');

                    // Step 2: Get MAX versionNumber for concurrency-safe increment
                    const maxVersion = await tx.messageVersion.aggregate({
                        where: { messageId },
                        _max: { versionNumber: true }
                    });

                    const nextVersion = (maxVersion._max.versionNumber ?? 0) + 1;

                    // If this is the first edit, also snapshot the ORIGINAL content (version 1)
                    if (nextVersion === 1) {
                        const originalHash = createHash('sha256').update(currentMessage.content).digest('hex');
                        await tx.messageVersion.create({
                            data: {
                                messageId,
                                versionNumber: 1,
                                content: currentMessage.content,
                                editedAt: new Date(),
                                editedBy: userId,
                                changeType: 'ORIGINAL',
                                contentHash: originalHash
                            }
                        });
                    }

                    // Step 3: Create version snapshot of new content
                    const editVersionNumber = nextVersion === 1 ? 2 : nextVersion;
                    const contentHash = createHash('sha256').update(content.trim()).digest('hex');

                    await tx.messageVersion.create({
                        data: {
                            messageId,
                            versionNumber: editVersionNumber,
                            content: content.trim(),
                            editedAt: new Date(),
                            editedBy: userId,
                            changeType: 'EDIT',
                            contentHash
                        }
                    });

                    // Step 4: Update message to latest content
                    const updatedMessage = await tx.message.update({
                        where: { id: messageId },
                        data: {
                            content: content.trim(),
                            isEdited: true,
                            editedAt: new Date()
                        },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            attachments: { select: { id: true, name: true, url: true, fileType: true, size: true } },
                            reactions: { select: { id: true, userId: true, emoji: true } },
                            replyTo: {
                                select: {
                                    id: true, content: true, senderId: true,
                                    sender: { select: { id: true, name: true } },
                                    isDeleted: true, isEdited: true
                                }
                            }
                        }
                    });

                    return updatedMessage;
                });

                // Broadcast edited message to all participants
                console.log('[Socket][emit] message:edited', { messageId, conversationId });
                io.to(`conversation:${conversationId}`).emit('message:edited', {
                    id: result.id,
                    conversationId: result.conversationId,
                    senderId: result.senderId,
                    sender: result.sender,
                    content: result.content,
                    type: (result as any).type || 'TEXT',
                    callMeta: (result as any).callMeta ? JSON.parse((result as any).callMeta) : null,
                    createdAt: result.createdAt.toISOString(),
                    deliveredAt: (result as any).deliveredAt?.toISOString() || null,
                    readAt: (result as any).readAt?.toISOString() || null,
                    attachments: result.attachments,
                    reactions: result.reactions,
                    replyTo: result.replyTo || null,
                    isDeleted: result.isDeleted,
                    isEdited: result.isEdited,
                    editedAt: result.editedAt?.toISOString() || null
                });

            } catch (error) {
                console.error('[Socket] message:edit error:', error);
                socket.emit('error', { message: `Edit failed: ${(error as Error).message}` });
            }
        });

        // Transactional message soft-delete with audit trail
        socket.on('message:delete', async (data: { messageId: string; conversationId: string }) => {
            const { messageId, conversationId } = data;

            if (!messageId || !conversationId) {
                socket.emit('error', { message: 'messageId and conversationId are required' });
                return;
            }

            const hasAccess = await canAccessConversation(userId, conversationId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied' });
                return;
            }

            try {
                // Transactional: version snapshot + soft-delete (atomic)
                const result = await prisma.$transaction(async (tx) => {
                    // Step 1: Fetch current message (verify ownership)
                    const currentMessage = await tx.message.findUnique({
                        where: { id: messageId },
                        select: { id: true, senderId: true, content: true, isDeleted: true, conversationId: true }
                    });

                    if (!currentMessage) throw new Error('Message not found');
                    if (currentMessage.senderId !== userId) throw new Error('Only the sender can delete');
                    if (currentMessage.isDeleted) throw new Error('Message is already deleted');
                    if (currentMessage.conversationId !== conversationId) throw new Error('Message does not belong to this conversation');

                    // Step 2: Get MAX versionNumber
                    const maxVersion = await tx.messageVersion.aggregate({
                        where: { messageId },
                        _max: { versionNumber: true }
                    });

                    const nextVersion = (maxVersion._max.versionNumber ?? 0) + 1;

                    // If no versions exist yet, snapshot original first
                    if (nextVersion === 1) {
                        const originalHash = createHash('sha256').update(currentMessage.content).digest('hex');
                        await tx.messageVersion.create({
                            data: {
                                messageId,
                                versionNumber: 1,
                                content: currentMessage.content,
                                editedAt: new Date(),
                                editedBy: userId,
                                changeType: 'ORIGINAL',
                                contentHash: originalHash
                            }
                        });
                    }

                    // Step 3: Create DELETE version snapshot
                    const deleteVersionNumber = nextVersion === 1 ? 2 : nextVersion;
                    const contentHash = createHash('sha256').update(currentMessage.content).digest('hex');

                    await tx.messageVersion.create({
                        data: {
                            messageId,
                            versionNumber: deleteVersionNumber,
                            content: currentMessage.content,
                            editedAt: new Date(),
                            editedBy: userId,
                            changeType: 'DELETE',
                            contentHash
                        }
                    });

                    // Step 4: Soft-delete — DO NOT touch deliveredAt or readAt
                    const updatedMessage = await tx.message.update({
                        where: { id: messageId },
                        data: {
                            isDeleted: true,
                            content: 'This message was deleted'
                        },
                        include: {
                            sender: { select: { id: true, name: true, image: true } },
                            reactions: { select: { id: true, userId: true, emoji: true } }
                        }
                    });

                    return updatedMessage;
                });

                // Broadcast deleted message to all participants
                console.log('[Socket][emit] message:deleted', { messageId, conversationId });
                io.to(`conversation:${conversationId}`).emit('message:deleted', {
                    id: result.id,
                    conversationId: result.conversationId,
                    senderId: result.senderId,
                    sender: result.sender,
                    content: result.content,
                    isDeleted: result.isDeleted,
                    reactions: result.reactions
                });

            } catch (error) {
                console.error('[Socket] message:delete error:', error);
                socket.emit('error', { message: `Delete failed: ${(error as Error).message}` });
            }
        });

        // ==================== END MESSAGE EDIT & DELETE ====================

        // ==================== DISPUTE DISCUSSION ROOMS ====================
        // Completely isolated from conversation rooms — uses dispute:{id} namespace

        socket.on('join-dispute', (disputeId: string) => {
            if (!disputeId) return;
            socket.join(`dispute:${disputeId}`);
            console.log(`[Socket] User ${userId} joined dispute:${disputeId}`);
        });

        socket.on('leave-dispute', (disputeId: string) => {
            if (!disputeId) return;
            socket.leave(`dispute:${disputeId}`);
            console.log(`[Socket] User ${userId} left dispute:${disputeId}`);
        });

        // ==================== END DISPUTE DISCUSSION ROOMS ====================

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
            socketUsers.delete(socket.id);
            console.log(`[Socket] Client disconnected: ${socket.id} (user: ${userId})`);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on /socket.io`);
    });

}); // end app.prepare()

