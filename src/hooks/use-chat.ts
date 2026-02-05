'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/providers/socket-provider';

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
    content: string;
    createdAt: string;
    readAt: string | null;
}

export interface Conversation {
    id: string;
    contractId: string | null;
    contractTitle: string | null;
    contractStatus: string | null;
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
}

interface UseChatOptions {
    conversationId?: string;
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
            setConversations(data.conversations || []);
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

    // Join a conversation room via socket
    const joinConversation = useCallback((conversationId: string) => {
        // Leave previous room
        if (currentConversationRef.current && socket) {
            socket.emit('leave-conversation', { conversationId: currentConversationRef.current });
        }

        currentConversationRef.current = conversationId;

        // Fetch messages via HTTP (works even if socket is down)
        fetchMessages(conversationId);

        // Join room via socket if connected
        if (socket && isConnected) {
            socket.emit('join-conversation', { conversationId });
        }
    }, [socket, isConnected, fetchMessages]);

    // Leave current conversation
    const leaveConversation = useCallback(() => {
        if (currentConversationRef.current && socket) {
            socket.emit('leave-conversation', { conversationId: currentConversationRef.current });
        }
        currentConversationRef.current = null;
        setMessages([]);
    }, [socket]);

    // Send a message
    const sendMessage = useCallback(async (content: string) => {
        const conversationId = currentConversationRef.current;
        if (!conversationId || !content.trim()) return;

        // Try socket first
        if (socket && isConnected) {
            socket.emit('send-message', { conversationId, content });
            return;
        }

        // Fallback to HTTP
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            // Add message locally (since socket didn't broadcast)
            if (data.message) {
                setMessages(prev => [...prev, data.message]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        }
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
            // Only add if it's for the current conversation
            if (message.conversationId === currentConversationRef.current) {
                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }

            // Update last message in conversations list
            setConversations(prev => prev.map(conv => {
                if (conv.id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: {
                            content: message.content,
                            createdAt: message.createdAt,
                            senderId: message.senderId,
                            senderName: message.sender.name
                        }
                    };
                }
                return conv;
            }));
        };

        const handleJoinedConversation = (data: { conversationId: string }) => {
            console.log('[useChat] Joined conversation:', data.conversationId);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('joined-conversation', handleJoinedConversation);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('joined-conversation', handleJoinedConversation);
        };
    }, [socket]);

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
