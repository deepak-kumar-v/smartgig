'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useIdentity } from '@/providers/identity-provider';

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
    deliveredAt: string | null;
    readAt: string | null;
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
    // Reply support
    replyToId?: string | null;
    replyTo?: {
        id: string;
        content: string;
        senderId: string;
        sender: { id: string; name: string | null };
        isDeleted: boolean;
        isEdited: boolean;
    } | null;
    // Edit & soft-delete support
    isDeleted?: boolean;
    isEdited?: boolean;
    editedAt?: string | null;
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
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string | null;
        deliveredAt?: string | null;
        readAt?: string | null;
        isEdited?: boolean;
        isDeleted?: boolean;
    } | null;
    createdAt: string;
    unreadCount?: number;
}

interface UseChatOptions {
    conversationId?: string;
}

interface MessageStatusPatch {
    deliveredAt?: string | null;
    readAt?: string | null;
}

export function useChat(options?: UseChatOptions) {
    const { socket, isConnected } = useSocket();
    const { userId, userName, userImage } = useIdentity();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentConversationRef = useRef<string | null>(null);
    const pendingDeliveredRef = useRef<Map<string, string>>(new Map());
    const pendingReadRef = useRef<Map<string, string>>(new Map());

    const mergeMessageStatus = useCallback((msg: ChatMessage, patch: MessageStatusPatch): ChatMessage => {
        return {
            ...msg,
            deliveredAt: patch.deliveredAt ?? msg.deliveredAt,
            readAt: patch.readAt ?? msg.readAt
        };
    }, []);

    const applyPendingStatus = useCallback((msg: ChatMessage): ChatMessage => {
        const pendingDeliveredAt = pendingDeliveredRef.current.get(msg.id);
        const pendingReadAt = pendingReadRef.current.get(msg.id);

        if (!pendingDeliveredAt && !pendingReadAt) return msg;

        if (pendingDeliveredAt) pendingDeliveredRef.current.delete(msg.id);
        if (pendingReadAt) pendingReadRef.current.delete(msg.id);

        const merged = mergeMessageStatus(msg, {
            deliveredAt: pendingDeliveredAt ?? undefined,
            readAt: pendingReadAt ?? undefined
        });

        console.log('[useChat][pending:apply]', {
            messageId: merged.id,
            deliveredAt: merged.deliveredAt,
            readAt: merged.readAt
        });

        return merged;
    }, [mergeMessageStatus]);

    // Fetch conversations from API
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error('Failed to fetch conversations');
            const data = await res.json();
            const sortedConversations = (data.conversations || []).sort((a: Conversation, b: Conversation) => {
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
            const incomingMessages: ChatMessage[] = data.messages || [];
            const mergedMessages = incomingMessages.map(applyPendingStatus);
            setMessages(mergedMessages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    }, [applyPendingStatus]);

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
        callMeta?: { mode: 'audio' | 'video'; provider: string; meetingUrl: string },
        replyToId?: string
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
                senderId: userId || '',
                sender: {
                    id: userId || '',
                    name: userName ?? null,
                    image: userImage ?? null
                },
                content: optimisticContent,
                type,
                callMeta,
                createdAt: new Date().toISOString(),
                deliveredAt: null,
                readAt: null,
                attachments: normalizedAttachments,
                reactions: [],
                replyToId
            };

            setMessages(prev => [...prev, optimisticMessage]);

            console.log('[DIAG][SEND_MESSAGE]', {
                conversationId,
                optimisticSenderId: userId,
                content: content?.substring(0, 30),
                type,
                clientTempId
            });

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

            socket.emit('send-message', { conversationId, content, attachments, type, callMeta, clientTempId, replyToId });
            return;
        }

        // Fallback to HTTP
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content, attachments, type, callMeta, replyToId })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            // Add message locally (since socket didn't broadcast)
            if (data.message) {
                const mergedMessage = applyPendingStatus(data.message as ChatMessage);
                setMessages(prev => [...prev, mergedMessage]);

                // Reorder conversation to top
                setConversations(prev => updateConversationList(
                    prev,
                    conversationId,
                    {
                        id: data.message.id,
                        content: type === 'CALL'
                            ? `Started a ${callMeta?.mode || 'video'} call`
                            : (content || 'Sent an attachment'),
                        createdAt: new Date().toISOString(),
                        senderId: userId || '',
                        senderName: null
                    }
                ));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        }
    }, [socket, isConnected, userId, userName, userImage, applyPendingStatus]);

    // Edit a message (sender-only, transactional on server)
    const editMessage = useCallback((messageId: string, newContent: string) => {
        const conversationId = currentConversationRef.current;
        if (!socket || !isConnected || !conversationId || !newContent.trim()) return;

        socket.emit('message:edit', { messageId, conversationId, content: newContent });
    }, [socket, isConnected]);

    // Delete a message (sender-only, soft-delete, transactional on server)
    const deleteMessage = useCallback((messageId: string) => {
        const conversationId = currentConversationRef.current;
        if (!socket || !isConnected || !conversationId) return;

        socket.emit('message:delete', { messageId, conversationId });
    }, [socket, isConnected]);

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
            console.log('[DIAG][SOCKET_RECEIVE_CLIENT]', {
                messageId: message.id,
                messageSenderId: message.senderId,
                identityUserId: userId,
                isSelf: message.senderId === userId,
                clientTempId: message.clientTempId,
                conversationId: message.conversationId,
                deliveredAt: message.deliveredAt,
                readAt: message.readAt
            });

            const incomingMessage = applyPendingStatus(message);

            // Only add if it's for the current conversation
            if (message.conversationId === currentConversationRef.current) {
                setMessages(prev => {
                    if (incomingMessage.clientTempId) {
                        const tempIndex = prev.findIndex(m => m.clientTempId === incomingMessage.clientTempId);
                        if (tempIndex !== -1) {
                            const next = [...prev];
                            const existing = next[tempIndex];
                            const merged = mergeMessageStatus(
                                { ...existing, ...incomingMessage },
                                {
                                    deliveredAt: incomingMessage.deliveredAt ?? existing.deliveredAt,
                                    readAt: incomingMessage.readAt ?? existing.readAt
                                }
                            );
                            console.log('[useChat][state:patch:new-message-temp]', {
                                messageId: merged.id,
                                deliveredAt: merged.deliveredAt,
                                readAt: merged.readAt
                            });
                            next[tempIndex] = merged;
                            return next;
                        }
                    }

                    // Prevent duplicates
                    const existingIndex = prev.findIndex(m => m.id === incomingMessage.id);
                    if (existingIndex !== -1) {
                        const next = [...prev];
                        const existing = next[existingIndex];
                        const merged = mergeMessageStatus(
                            { ...existing, ...incomingMessage },
                            {
                                deliveredAt: incomingMessage.deliveredAt ?? existing.deliveredAt,
                                readAt: incomingMessage.readAt ?? existing.readAt
                            }
                        );
                        console.log('[useChat][state:patch:new-message-existing]', {
                            messageId: merged.id,
                            deliveredAt: merged.deliveredAt,
                            readAt: merged.readAt
                        });
                        next[existingIndex] = merged;
                        return next;
                    }

                    console.log('[useChat][state:patch:new-message-add]', {
                        messageId: incomingMessage.id,
                        deliveredAt: incomingMessage.deliveredAt,
                        readAt: incomingMessage.readAt
                    });
                    return [...prev, incomingMessage];
                });
            }

            // Update conversation list: Reorder + Update Last Message
            setConversations(prev => {
                const convIndex = prev.findIndex(c => c.id === message.conversationId);
                if (convIndex === -1) return prev;

                const existingConv = prev[convIndex];

                const updatedConv = {
                    ...existingConv,
                    lastMessage: {
                        id: message.id,
                        content: message.content,
                        createdAt: message.createdAt,
                        senderId: message.senderId,
                        senderName: message.sender.name,
                        deliveredAt: message.deliveredAt,
                        readAt: message.readAt,
                        isEdited: message.isEdited || false,
                        isDeleted: message.isDeleted || false
                    }
                };

                const next = [...prev];
                next.splice(convIndex, 1);
                next.unshift(updatedConv);
                return next;
            });
        };

        const handleJoinedConversation = (data: { conversationId: string }) => {
            console.log('[useChat] Joined conversation:', data.conversationId);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('joined-conversation', handleJoinedConversation);

        // Reaction updates (full-replace from server)
        const handleReactionUpdate = (data: { messageId: string; reactions: { id: string; userId: string; emoji: string }[] }) => {
            let reactedMsg: ChatMessage | null = null;
            let oldReactions: { id: string; userId: string; emoji: string }[] = [];
            let latestConvMsg: ChatMessage | null = null;

            setMessages(prev => {
                const next = prev.map(msg => {
                    if (msg.id !== data.messageId) return msg;
                    reactedMsg = msg;
                    oldReactions = msg.reactions ?? [];
                    return { ...msg, reactions: data.reactions };
                });

                // Pre-compute latest message in this conversation (for removal case)
                if (reactedMsg) {
                    const targetConvId = (reactedMsg as ChatMessage).conversationId;
                    latestConvMsg = next
                        .filter(m => m.conversationId === targetConvId)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
                }

                return next;
            });

            if (!reactedMsg) return;
            const targetMsg = reactedMsg as ChatMessage;

            // Diff: find newly added reaction
            const oldIds = new Set(oldReactions.map(r => r.id));
            const newReaction = data.reactions.find(r => !oldIds.has(r.id));

            if (newReaction) {
                // === ADDITION: show reaction preview ===
                const trimmedContent = targetMsg.content.length > 35
                    ? targetMsg.content.substring(0, 35) + '…'
                    : targetMsg.content;
                const isOwnReaction = newReaction.userId === userId;

                setConversations(prev => {
                    const convIndex = prev.findIndex(c => c.id === targetMsg.conversationId);
                    if (convIndex === -1) return prev;

                    const conv = prev[convIndex];
                    const reactorName = isOwnReaction
                        ? 'You'
                        : (conv.otherParticipant?.name ?? 'Someone');

                    const preview = `${reactorName} reacted ${newReaction.emoji} to "${trimmedContent}"`;

                    const updatedConv = {
                        ...conv,
                        lastMessage: {
                            id: targetMsg.id,
                            content: preview,
                            createdAt: new Date().toISOString(),
                            senderId: newReaction.userId,
                            senderName: reactorName
                        }
                    };

                    const next = [...prev];
                    next.splice(convIndex, 1);
                    next.unshift(updatedConv);
                    return next;
                });
            } else {
                // === REMOVAL: revert to true latest message ===
                if (!latestConvMsg) return;
                const latest = latestConvMsg as ChatMessage;

                setConversations(prev => {
                    const convIndex = prev.findIndex(c => c.id === targetMsg.conversationId);
                    if (convIndex === -1) return prev;

                    const conv = prev[convIndex];
                    const next = [...prev];
                    next[convIndex] = {
                        ...conv,
                        lastMessage: {
                            id: latest.id,
                            content: latest.content,
                            createdAt: latest.createdAt,
                            senderId: latest.senderId,
                            senderName: latest.sender?.name ?? null
                        }
                    };
                    return next;
                });
            }
        };
        socket.on('reaction:update', handleReactionUpdate);

        const handleReadUpdate = (data: { conversationId: string; messageIds: string[]; readAt: string }) => {
            console.log('[useChat][event:message:read:update]', data);
            const messageIds = new Set(data.messageIds);
            setMessages(prev => {
                let patchedCount = 0;
                const next = prev.map(msg => {
                    if (msg.conversationId !== data.conversationId) return msg;
                    if (!messageIds.has(msg.id)) return msg;
                    patchedCount += 1;
                    const merged = mergeMessageStatus(msg, {
                        deliveredAt: msg.deliveredAt ?? data.readAt,
                        readAt: data.readAt
                    });
                    console.log('[useChat][state:patch:read]', {
                        messageId: merged.id,
                        deliveredAt: merged.deliveredAt,
                        readAt: merged.readAt
                    });
                    return merged;
                });

                if (patchedCount === 0) {
                    for (const messageId of data.messageIds) {
                        pendingReadRef.current.set(messageId, data.readAt);
                    }
                    console.log('[useChat][pending:queue:read]', {
                        messageIds: data.messageIds,
                        readAt: data.readAt
                    });
                }

                return next;
            });

            // Sync sidebar lastMessage readAt
            setConversations(prev => prev.map(conv => {
                if (conv.id !== data.conversationId) return conv;
                if (!conv.lastMessage?.id || !data.messageIds.includes(conv.lastMessage.id)) return conv;
                return {
                    ...conv,
                    lastMessage: {
                        ...conv.lastMessage,
                        deliveredAt: conv.lastMessage.deliveredAt ?? data.readAt,
                        readAt: data.readAt
                    }
                };
            }));
        };
        socket.on('message:read:update', handleReadUpdate);

        const handleDeliveredUpdate = (data: { conversationId: string; messageIds: string[]; deliveredAt: string }) => {
            console.log('[useChat][event:message:delivered:update]', data);
            const messageIds = new Set(data.messageIds);
            setMessages(prev => {
                let patchedCount = 0;
                const next = prev.map(msg => {
                    if (msg.conversationId !== data.conversationId) return msg;
                    if (!messageIds.has(msg.id)) return msg;
                    patchedCount += 1;
                    const merged = mergeMessageStatus(msg, {
                        deliveredAt: data.deliveredAt
                    });
                    console.log('[useChat][state:patch:delivered]', {
                        messageId: merged.id,
                        deliveredAt: merged.deliveredAt,
                        readAt: merged.readAt
                    });
                    return merged;
                });

                if (patchedCount === 0) {
                    for (const messageId of data.messageIds) {
                        pendingDeliveredRef.current.set(messageId, data.deliveredAt);
                    }
                    console.log('[useChat][pending:queue:delivered]', {
                        messageIds: data.messageIds,
                        deliveredAt: data.deliveredAt
                    });
                }

                return next;
            });

            // Sync sidebar lastMessage deliveredAt
            setConversations(prev => prev.map(conv => {
                if (conv.id !== data.conversationId) return conv;
                if (!conv.lastMessage?.id || !data.messageIds.includes(conv.lastMessage.id)) return conv;
                return {
                    ...conv,
                    lastMessage: {
                        ...conv.lastMessage,
                        deliveredAt: data.deliveredAt
                    }
                };
            }));
        };
        socket.on('message:delivered:update', handleDeliveredUpdate);

        const handleUnreadUpdate = (data: { conversationId: string; unreadCount: number }) => {
            console.log('[useChat][event:conversation:unread:update]', data);

            setConversations(prev => {
                const convIndex = prev.findIndex(c => c.id === data.conversationId);
                if (convIndex === -1) return prev;

                const nextUnreadCount = Math.max(0, Math.floor(Number(data.unreadCount) || 0));
                if ((prev[convIndex].unreadCount || 0) === nextUnreadCount) {
                    return prev;
                }

                const next = [...prev];
                next[convIndex] = {
                    ...next[convIndex],
                    unreadCount: nextUnreadCount
                };
                return next;
            });
        };
        socket.on('conversation:unread:update', handleUnreadUpdate);

        // === Message Edited listener ===
        const handleMessageEdited = (data: ChatMessage) => {
            console.log('[useChat][event:message:edited]', data.id);
            setMessages(prev => prev.map(msg => {
                // Patch the edited message itself
                if (msg.id === data.id) {
                    return {
                        ...msg,
                        content: data.content,
                        isEdited: data.isEdited,
                        editedAt: data.editedAt,
                        reactions: data.reactions ?? msg.reactions,
                        replyTo: data.replyTo ?? msg.replyTo,
                        attachments: data.attachments ?? msg.attachments
                    };
                }
                // Cascade: update replyTo references in other messages
                if (msg.replyTo?.id === data.id) {
                    return {
                        ...msg,
                        replyTo: {
                            ...msg.replyTo,
                            content: data.content,
                            isEdited: data.isEdited ?? true
                        }
                    };
                }
                return msg;
            }));

            // Sync sidebar lastMessage if edited
            setConversations(prev => prev.map(conv => {
                if (!conv.lastMessage?.id || conv.lastMessage.id !== data.id) return conv;
                return {
                    ...conv,
                    lastMessage: {
                        ...conv.lastMessage,
                        content: data.content,
                        isEdited: true
                    }
                };
            }));
        };
        socket.on('message:edited', handleMessageEdited);

        // === Message Deleted listener ===
        const handleMessageDeleted = (data: { id: string; conversationId: string; content: string; isDeleted: boolean }) => {
            console.log('[useChat][event:message:deleted]', data.id);
            setMessages(prev => prev.map(msg => {
                // Patch the deleted message itself
                if (msg.id === data.id) {
                    return {
                        ...msg,
                        content: data.content,
                        isDeleted: data.isDeleted
                    };
                }
                // Cascade: update replyTo references in other messages
                if (msg.replyTo?.id === data.id) {
                    return {
                        ...msg,
                        replyTo: {
                            ...msg.replyTo,
                            content: data.content,
                            isDeleted: true
                        }
                    };
                }
                return msg;
            }));

            // Sync sidebar lastMessage if deleted
            setConversations(prev => prev.map(conv => {
                if (!conv.lastMessage?.id || conv.lastMessage.id !== data.id) return conv;
                return {
                    ...conv,
                    lastMessage: {
                        ...conv.lastMessage,
                        content: data.content,
                        isDeleted: true
                    }
                };
            }));
        };
        socket.on('message:deleted', handleMessageDeleted);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('joined-conversation', handleJoinedConversation);
            socket.off('reaction:update', handleReactionUpdate);
            socket.off('message:read:update', handleReadUpdate);
            socket.off('message:delivered:update', handleDeliveredUpdate);
            socket.off('conversation:unread:update', handleUnreadUpdate);
            socket.off('message:edited', handleMessageEdited);
            socket.off('message:deleted', handleMessageDeleted);
        };
    }, [socket, applyPendingStatus, mergeMessageStatus]);

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
        createConversation,
        editMessage,
        deleteMessage
    };
}

// Helper: Immutable update of conversation list (Reorder + LastMessage)
function updateConversationList(
    conversations: Conversation[],
    conversationId: string,
    newMessage: {
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string | null;
        deliveredAt?: string | null;
        readAt?: string | null;
        isEdited?: boolean;
        isDeleted?: boolean;
    }
): Conversation[] {
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return conversations;

    const existingConv = conversations[convIndex];

    const updatedConv = {
        ...existingConv,
        lastMessage: {
            id: newMessage.id,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderId: newMessage.senderId,
            senderName: newMessage.senderName,
            deliveredAt: newMessage.deliveredAt,
            readAt: newMessage.readAt,
            isEdited: newMessage.isEdited || false,
            isDeleted: newMessage.isDeleted || false
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

    // 1. Contract priority states
    if (contractId) {
        if (contractStatus === 'DRAFT') {
            return `Draft Contract — ${title}`;
        }

        if (contractStatus === 'PENDING_REVIEW') {
            return `Under Review — ${title}`;
        }

        const standardStates = ['ACCEPTED', 'FINALIZED', 'FUNDED', 'ACTIVE', 'COMPLETED', 'CLOSED'];
        if (contractStatus && standardStates.includes(contractStatus)) {
            const typeLabel = (contractType === 'TRIAL') ? 'TRIAL' : 'STANDARD';
            return `${contractStatus} · ${typeLabel} · ${title}`;
        }
    }

    // 2. Proposal ACCEPTED (No contract yet)
    if (!contractId && proposalId && contractStatus === 'ACCEPTED') {
        return `Proposal accepted — ${title}`;
    }

    // 3. Proposal-only (Proposal exists, but no contract created yet)
    if (proposalId && !contractId) {
        if (userRole === 'CLIENT') return `Proposal Received — ${title}`;
        if (userRole === 'FREELANCER') return `Proposal Sent — ${title}`;
        return `Freelancer proposal — ${title}`;
    }

    // 4. Fallback
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

    // 3. Draft Contract
    if (contractId && contractStatus === 'DRAFT') {
        if (userRole === 'CLIENT') {
            return "Draft contract sent to freelancer.\nAwaiting freelancer acceptance.";
        }
        if (userRole === 'FREELANCER') {
            return "Draft contract received.\nApproval pending from your end.";
        }
    }

    // 4. Under Review
    if (contractId && contractStatus === 'PENDING_REVIEW') {
        if (userRole === 'CLIENT') {
            return "Contract is currently under review by the freelancer.";
        }
        if (userRole === 'FREELANCER') {
            return "Contract is awaiting your review and acceptance.";
        }
    }

    return null;
}
