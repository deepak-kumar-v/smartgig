'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/providers/socket-provider';

export interface ChatMessage {
    id: string;
    clientTempId?: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
    content: string;
    type?: string; // TEXT, CALL
    callMeta?: {
        mode: 'audio' | 'video';
        provider: string;
        meetingUrl: string;
    };
    createdAt: string;
    readAt: string | null;
    deliveryStatus?: 'sent' | 'delivered';
    attachments?: {
        id: string;
        url: string;
        name: string;
        fileType: string;
        size: number;
    }[];
    reactions?: {
        id: string;
        userId: string;
        emoji: string;
    }[];
}

export interface Conversation {
    id: string;
    contractId: string | null;
    contractTitle: string | null;
    contractStatus: string | null;
    contractType: string | null;
    jobAllowsTrial?: boolean;
    proposalId: string | null;
    otherParticipant: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    lastMessage: {
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string | null;
    } | null;
    createdAt: string;
    unreadCount?: number;
}

interface UseChatOptions {
    conversationId?: string;
    currentUserId?: string;
    currentUserName?: string | null;
    currentUserImage?: string | null;
}

export function useChat(options?: UseChatOptions) {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentConversationRef = useRef<string | null>(null);

    // Fetch conversations from API
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error('Failed to fetch conversations');
            const data = await res.json();
            // Initialize unreadCount to 0 and sort by lastMessage date (desc)
            const sortedConversations = (data.conversations || []).map((c: Conversation) => ({
                ...c,
                unreadCount: 0
            })).sort((a: Conversation, b: Conversation) => {
                const dateA = new Date(a.lastMessage?.createdAt || a.createdAt).getTime();
                const dateB = new Date(b.lastMessage?.createdAt || b.createdAt).getTime();
                return dateB - dateA;
            });
            setConversations(sortedConversations);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch messages for a conversation (HTTP fallback)
    const fetchMessages = useCallback(async (conversationId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/messages?conversationId=${conversationId}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            setMessages(data.messages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Memoize stable list of conversation IDs to prevent unnecessary re-joins on reorder
    const conversationIds = conversations.map(c => c.id).sort().join(',');

    // Join ALL conversation rooms to receive sidebar updates
    useEffect(() => {
        if (!socket || !isConnected || conversations.length === 0) return;

        console.log('[useChat] Joining all conversation rooms for updates');
        conversations.forEach(c => {
            socket.emit('join-conversation', { conversationId: c.id });
        });
    }, [socket, isConnected, conversationIds]);

    // Join a conversation room via socket
    const joinConversation = useCallback((conversationId: string) => {
        // NOTE: We do NOT leave the previous room because we want to keep listening 
        // for sidebar updates (unread counts, reordering) from all conversations.

        currentConversationRef.current = conversationId;

        // Reset unread count for this conversation
        setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ));

        // Fetch messages via HTTP (works even if socket is down)
        fetchMessages(conversationId);

        // Explicitly join this room again (idempotent) to ensure we have access/subscription
        if (socket && isConnected) {
            socket.emit('join-conversation', { conversationId });
        }
    }, [socket, isConnected, fetchMessages]);

    // Leave current conversation (UI only, keep socket subscription)
    const leaveConversation = useCallback(() => {
        // Do not verify socket leave, just clear UI ref
        currentConversationRef.current = null;
        setMessages([]);
    }, []);

    // Send a message (text, attachment, or call)
    const sendMessage = useCallback(async (
        content: string,
        attachments: any[] = [],
        type: string = 'TEXT',
        callMeta?: { mode: 'audio' | 'video'; provider: string; meetingUrl: string }
    ) => {
        const conversationId = currentConversationRef.current;

        // For CALL messages, only need callMeta. For TEXT, need content or attachments.
        if (!conversationId) return;
        if (type === 'CALL') {
            if (!callMeta?.meetingUrl) return;
        } else if (!content.trim() && attachments.length === 0) {
            return;
        }

        // Try socket first
        if (socket && isConnected) {
            const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const normalizedAttachments = attachments.map(att => ({
                ...att,
                fileType: att.fileType || att.type || ''
            }));
            const optimisticContent = type === 'CALL'
                ? `Started a ${callMeta?.mode || 'video'} call`
                : (content?.trim() || 'Sent an attachment');

            const optimisticMessage: ChatMessage = {
                id: clientTempId,
                clientTempId,
                conversationId,
                senderId: options?.currentUserId || 'current-user',
                sender: {
                    id: options?.currentUserId || 'current-user',
                    name: options?.currentUserName ?? null,
                    image: options?.currentUserImage ?? null
                },
                content: optimisticContent,
                type,
                callMeta,
                createdAt: new Date().toISOString(),
                readAt: null,
                attachments: normalizedAttachments,
                reactions: [],
                deliveryStatus: 'sent'
            };

            setMessages(prev => [...prev, optimisticMessage]);

            console.log('[CHAT SEND PAYLOAD]', {
                conversationId,
                content,
                attachments,
                type,
                hasCallMeta: !!callMeta
            });

            const hasFileObject = attachments.some(a => a instanceof File);
            if (hasFileObject) {
                console.error('[CRITICAL] FILE OBJECT LEAK DETECTED IN SOCKET EMIT');
                setError('Internal Error: Cannot send raw file objects');
                return;
            }

            socket.emit('send-message', { conversationId, content, attachments, type, callMeta, clientTempId });
            return;
        }

        // Fallback to HTTP
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content, attachments, type, callMeta })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            // Add message locally (since socket didn't broadcast)
            if (data.message) {
                setMessages(prev => [...prev, { ...data.message, deliveryStatus: 'delivered' }]);

                // Reorder conversation to top
                setConversations(prev => updateConversationList(
                    prev,
                    conversationId,
                    {
                        content: type === 'CALL'
                            ? `Started a ${callMeta?.mode || 'video'} call`
                            : (content || 'Sent an attachment'),
                        createdAt: new Date().toISOString(),
                        senderId: options?.currentUserId || 'current-user',
                        senderName: null
                    },
                    true // isActive is true for sender
                ));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        }
    }, [socket, isConnected, options?.currentUserId, options?.currentUserName, options?.currentUserImage]);

    // Create conversation for a contract
    const createConversation = useCallback(async (contractId: string): Promise<string | null> => {
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractId })
            });

            if (!res.ok) throw new Error('Failed to create conversation');

            const data = await res.json();

            // Refresh conversations list
            await fetchConversations();

            return data.conversationId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create conversation');
            return null;
        }
    }, [fetchConversations]);

    // Listen for incoming messages via socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: ChatMessage) => {
            // Only add if it's for the current conversation
            if (message.conversationId === currentConversationRef.current) {
                setMessages(prev => {
                    if (message.clientTempId) {
                        const tempIndex = prev.findIndex(m => m.clientTempId === message.clientTempId);
                        if (tempIndex !== -1) {
                            const next = [...prev];
                            next[tempIndex] = {
                                ...message,
                                deliveryStatus: message.senderId === (options?.currentUserId || 'current-user')
                                    ? 'delivered'
                                    : undefined
                            };
                            return next;
                        }
                    }

                    // Prevent duplicates
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, {
                        ...message,
                        deliveryStatus: message.senderId === (options?.currentUserId || 'current-user')
                            ? 'delivered'
                            : undefined
                    }];
                });
            }

            // Update conversation list: Reorder + Increment Unread + Update Last Message
            setConversations(prev => updateConversationList(
                prev,
                message.conversationId,
                {
                    content: message.content,
                    createdAt: message.createdAt,
                    senderId: message.senderId,
                    senderName: message.sender.name
                },
                message.conversationId === currentConversationRef.current
            ));
        };

        const handleJoinedConversation = (data: { conversationId: string }) => {
            console.log('[useChat] Joined conversation:', data.conversationId);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('joined-conversation', handleJoinedConversation);

        // Reaction updates (full-replace from server)
        const handleReactionUpdate = (data: { messageId: string; reactions: { id: string; userId: string; emoji: string }[] }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id !== data.messageId) return msg;
                return { ...msg, reactions: data.reactions };
            }));
        };
        socket.on('reaction:update', handleReactionUpdate);

        const handleReadUpdate = (data: { conversationId: string; messageIds: string[]; readAt: string }) => {
            const messageIds = new Set(data.messageIds);
            setMessages(prev => prev.map(msg => {
                if (msg.conversationId !== data.conversationId) return msg;
                if (!messageIds.has(msg.id)) return msg;
                return { ...msg, readAt: data.readAt };
            }));
        };
        socket.on('message:read:update', handleReadUpdate);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('joined-conversation', handleJoinedConversation);
            socket.off('reaction:update', handleReactionUpdate);
            socket.off('message:read:update', handleReadUpdate);
        };
    }, [socket, options?.currentUserId]);

    // Re-join conversation when socket connects/reconnects (Fixes race condition)
    useEffect(() => {
        if (socket && isConnected && currentConversationRef.current) {
            console.log('[useChat] Re-joining conversation after connection:', currentConversationRef.current);
            socket.emit('join-conversation', { conversationId: currentConversationRef.current });
        }
    }, [socket, isConnected]);

    // Auto-join if conversationId provided in options
    useEffect(() => {
        if (options?.conversationId) {
            joinConversation(options.conversationId);
        }
    }, [options?.conversationId, joinConversation]);

    return {
        messages,
        conversations,
        isLoading,
        error,
        isConnected,
        fetchConversations,
        fetchMessages,
        joinConversation,
        leaveConversation,
        sendMessage,
        createConversation
    };
}

// Helper: Immutable update of conversation list (Reorder + Unread + LastMessage)
function updateConversationList(
    conversations: Conversation[],
    conversationId: string,
    newMessage: {
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string | null;
    },
    isActive: boolean
): Conversation[] {
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return conversations;

    const existingConv = conversations[convIndex];

    // Calculate new unread count
    // Reset to 0 if active, otherwise increment
    const newUnreadCount = isActive
        ? 0
        : (existingConv.unreadCount || 0) + 1;

    const updatedConv = {
        ...existingConv,
        unreadCount: newUnreadCount,
        lastMessage: {
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderId: newMessage.senderId,
            senderName: newMessage.senderName
        }
    };

    // Immutable reorder: Remove from old position, insert at 0
    const newConversations = [...conversations];
    newConversations.splice(convIndex, 1);
    newConversations.unshift(updatedConv);

    return newConversations;
}

// Deterministic conversation label helper
export function getConversationLabel(conversation: Conversation, userRole?: string | null): string {
    const { contractStatus, contractType, contractTitle, proposalId, contractId } = conversation;
    const title = contractTitle || 'Unknown Job';

    // 1. ACTIVE / ENDED / CANCELLED / COMPLETED Contracts (Highest Priority)
    if (contractStatus === 'ACTIVE' || contractStatus === 'ENDED' || contractStatus === 'CANCELLED' || contractStatus === 'COMPLETED') {
        const typeLabel = contractType === 'TRIAL' ? 'TRIAL' : 'STANDARD';
        return `${contractStatus} · ${typeLabel} · ${title}`;
    }

    // 2. DRAFT Contract

    if (contractStatus === 'DRAFT') {
        if (userRole === 'CLIENT') return `Draft Contract Sent — ${title}`;
        if (userRole === 'FREELANCER') return `Draft Contract Received — ${title}`;
        return `Contract sent — ${title}`;
    }

    // 3. REJECTED Contract
    if (contractStatus === 'REJECTED') {
        return "Contract rejected";
    }

    // 4. Proposal ACCEPTED (No contract yet)
    if (!contractId && proposalId && contractStatus === 'ACCEPTED') {
        return `Proposal accepted — ${title}`;
    }

    // 5. Proposal-only (Proposal exists, but no contract created yet)

    if (proposalId && !contractId) {
        if (userRole === 'CLIENT') return `Proposal Received — ${title}`;
        if (userRole === 'FREELANCER') return `Proposal Sent — ${title}`;
        return `Freelancer proposal — ${title}`;
    }

    // 5. Fallback
    return "Conversation";
}

// Tooltip helper for specific states
export function getConversationTooltip(conversation: Conversation, userRole?: string | null): string | null {
    const { contractStatus, proposalId, contractId } = conversation;

    // 1. Proposal ACCEPTED (No contract yet)
    if (!contractId && proposalId && contractStatus === 'ACCEPTED') {
        const type = conversation.jobAllowsTrial ? 'Trial' : 'Standard';
        if (userRole === 'CLIENT') {
            return `Proposal from freelancer has been accepted.\n${type} contract creation is pending from your end.`;
        }
        if (userRole === 'FREELANCER') {
            return `Your proposal has been accepted.\nAwaiting client to create the ${type} contract.`;
        }
    }

    // 2. Proposal-only
    if (proposalId && !contractId) {
        if (userRole === 'CLIENT') {
            return "Proposal received from freelancer.\nApproval pending from your end.";
        }
        if (userRole === 'FREELANCER') {
            return "Proposal sent to client.\nAwaiting client acceptance.";
        }
    }

    // 2. Draft Contract
    if (contractStatus === 'DRAFT') {
        if (userRole === 'CLIENT') {
            return "Draft contract sent to freelancer.\nAwaiting freelancer acceptance.";
        }
        if (userRole === 'FREELANCER') {
            return "Draft contract received.\nApproval pending from your end.";
        }
    }

    return null;
}
