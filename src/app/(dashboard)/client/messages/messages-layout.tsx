'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
    MessageSquare, Search, Send, Paperclip, MoreVertical,
    Phone, Video, Info, Check, CheckCheck, Clock
} from 'lucide-react';

interface Conversation {
    id: string;
    otherParticipant?: {
        id: string;
        name: string | null;
        image: string | null;
    };
    lastMessage: {
        content: string;
        createdAt: Date;
        sender: {
            id: string;
            name: string | null;
        };
    } | null;
    context: string;
}

interface MessagesLayoutProps {
    conversations: Conversation[];
    currentUserId: string;
}

function formatTime(date: Date) {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function ConversationItem({
    conversation,
    isSelected,
    currentUserId,
    onClick
}: {
    conversation: Conversation;
    isSelected: boolean;
    currentUserId: string;
    onClick: () => void;
}) {
    const initials = conversation.otherParticipant?.name?.split(' ').map(n => n[0]).join('') || '?';
    const isOwnMessage = conversation.lastMessage?.sender.id === currentUserId;

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 flex items-start gap-3 transition-all text-left ${isSelected
                    ? 'bg-violet-500/10 border-l-2 border-l-violet-500'
                    : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                }`}
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                {conversation.otherParticipant?.image ? (
                    <img
                        src={conversation.otherParticipant.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white truncate">
                        {conversation.otherParticipant?.name || 'Unknown'}
                    </h4>
                    {conversation.lastMessage && (
                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                    )}
                </div>

                <p className="text-xs text-violet-400 mb-1 truncate">
                    {conversation.context}
                </p>

                {conversation.lastMessage && (
                    <p className="text-sm text-zinc-400 truncate flex items-center gap-1">
                        {isOwnMessage && <Check className="w-3 h-3 text-zinc-500" />}
                        {conversation.lastMessage.content}
                    </p>
                )}
            </div>
        </button>
    );
}

function EmptyChat() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
            <p className="text-zinc-400 max-w-sm">
                Choose a conversation from the sidebar to start messaging, or your messages will appear here when you receive one.
            </p>
        </div>
    );
}

function ChatView({
    conversation,
    currentUserId
}: {
    conversation: Conversation;
    currentUserId: string;
}) {
    const [message, setMessage] = useState('');
    const initials = conversation.otherParticipant?.name?.split(' ').map(n => n[0]).join('') || '?';

    const handleSend = () => {
        if (!message.trim()) return;
        // TODO: Implement actual send message API
        console.log('Sending:', message);
        setMessage('');
    };

    // Sample messages for demonstration
    const sampleMessages = [
        { id: '1', content: 'Hi! I saw your proposal and I\'m interested.', senderId: conversation.otherParticipant?.id || '', createdAt: new Date(Date.now() - 3600000 * 2) },
        { id: '2', content: 'Thank you! I\'d love to discuss the project details.', senderId: currentUserId, createdAt: new Date(Date.now() - 3600000) },
        { id: '3', content: 'Can you share more about your approach for this project?', senderId: conversation.otherParticipant?.id || '', createdAt: new Date(Date.now() - 1800000) },
    ];

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                        {conversation.otherParticipant?.image ? (
                            <img src={conversation.otherParticipant.image} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">
                            {conversation.otherParticipant?.name || 'Unknown'}
                        </h3>
                        <p className="text-xs text-zinc-500">{conversation.context}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Info className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Date Separator */}
                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs text-zinc-500">Today</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {sampleMessages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${isOwn
                                        ? 'bg-violet-600 text-white rounded-br-md'
                                        : 'bg-zinc-800 text-white rounded-bl-md'
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                    <span className="text-xs opacity-60">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                    {isOwn && <CheckCheck className="w-3 h-3 opacity-60" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className={`p-3 rounded-xl transition-all ${message.trim()
                                ? 'bg-violet-600 text-white hover:bg-violet-500'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function MessagesLayout({ conversations, currentUserId }: MessagesLayoutProps) {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
        conversations[0] || null
    );
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(c =>
        c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.context.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="h-[calc(100vh-120px)]">
                <GlassCard className="h-full p-0 overflow-hidden">
                    <div className="flex h-full">
                        {/* Sidebar - Conversation List */}
                        <div className="w-80 border-r border-zinc-800 flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-zinc-800">
                                <h2 className="text-lg font-semibold text-white mb-3">Messages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                                    />
                                </div>
                            </div>

                            {/* Conversation List */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.length > 0 ? (
                                    filteredConversations.map((conv) => (
                                        <ConversationItem
                                            key={conv.id}
                                            conversation={conv}
                                            isSelected={selectedConversation?.id === conv.id}
                                            currentUserId={currentUserId}
                                            onClick={() => setSelectedConversation(conv)}
                                        />
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-sm text-zinc-500">
                                            {searchQuery ? 'No conversations found' : 'No messages yet'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedConversation ? (
                                <ChatView
                                    conversation={selectedConversation}
                                    currentUserId={currentUserId}
                                />
                            ) : (
                                <EmptyChat />
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </>
    );
}
