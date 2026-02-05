import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

// Get or create conversation for a contract
async function getOrCreateConversation(contractId: string): Promise<string | null> {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
            conversation: true,
            client: { select: { userId: true } },
            freelancer: { select: { userId: true } }
        }
    });

    if (!contract) return null;

    if (contract.conversation) {
        return contract.conversation.id;
    }

    // Create conversation and add participants
    const conversation = await prisma.conversation.create({
        data: {
            contractId: contract.id,
            participants: {
                create: [
                    { userId: contract.client.userId },
                    { userId: contract.freelancer.userId }
                ]
            }
        }
    });

    return conversation.id;
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: dev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL,
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/api/socket'
    });

    // Store user-to-socket mapping
    const userSockets = new Map<string, string>();

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
        socket.on('send-message', async (data: { conversationId: string; content: string }) => {
            const { conversationId, content } = data;

            if (!content?.trim()) {
                socket.emit('error', { message: 'Message content is required' });
                return;
            }

            const hasAccess = await canAccessConversation(userId, conversationId);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to this conversation' });
                return;
            }

            try {
                // Persist message to database
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: userId,
                        content: content.trim()
                    },
                    include: {
                        sender: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                });

                // Broadcast to all participants in the room
                io.to(`conversation:${conversationId}`).emit('new-message', {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    sender: message.sender,
                    content: message.content,
                    createdAt: message.createdAt.toISOString(),
                    readAt: null
                });

                console.log(`[Socket] Message sent in conversation:${conversationId} by ${userId}`);
            } catch (error) {
                console.error('[Socket] Error saving message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            userSockets.delete(userId);
            console.log(`[Socket] Client disconnected: ${socket.id} (user: ${userId})`);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on /api/socket`);
    });
});
