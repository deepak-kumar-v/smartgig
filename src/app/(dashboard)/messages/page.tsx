'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { useChat, ChatMessage, Conversation } from '@/hooks/use-chat';
import { useSocket } from '@/providers/socket-provider';
import { useCall } from '@/hooks/use-call';
import { VideoCallModal } from '@/components/video/VideoCallModal';
import {
    Send, Paperclip, Search, MoreVertical, Phone, Video,
    CheckCheck, Clock, FileText, Image as ImageIcon, Download,
    ChevronLeft, Wifi, WifiOff, MessageSquare
} from 'lucide-react';

function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function ConversationItem({
    conversation,
    isActive,
    currentUserId,
    onClick
}: {
    conversation: Conversation;
    isActive: boolean;
    currentUserId: string;
    onClick: () => void;
}) {
    const initials = conversation.otherParticipant?.name?.split(' ').map(n => n[0]).join('') || '?';
    const isOwnLastMessage = conversation.lastMessage?.senderId === currentUserId;

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left transition-all ${isActive
                ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {initials}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium truncate">
                            {conversation.otherParticipant?.name || 'Unknown'}
                        </span>
                        {conversation.lastMessage && (
                            <span className="text-zinc-500 text-xs">
                                {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                        )}
                    </div>
                    {conversation.contractTitle && (
                        <p className="text-indigo-400 text-xs mb-1 truncate">{conversation.contractTitle}</p>
                    )}
                    {conversation.lastMessage && (
                        <p className="text-zinc-400 text-sm truncate flex items-center gap-1">
                            {isOwnLastMessage && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                            {conversation.lastMessage.content}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}

function MessageBubble({
    message,
    isOwn
}: {
    message: ChatMessage;
    isOwn: boolean;
}) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                <div className={`p-4 rounded-2xl ${isOwn
                    ? 'bg-indigo-500 text-white rounded-br-md'
                    : 'bg-zinc-800 text-white rounded-bl-md'
                    }`}>
                    <p className="text-sm">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="text-zinc-500 text-xs">{formatTime(message.createdAt)}</span>
                    {isOwn && (
                        message.readAt
                            ? <CheckCheck className="w-3 h-3 text-indigo-400" />
                            : <Clock className="w-3 h-3 text-zinc-500" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    const { data: session } = useSession();
    const { isConnected } = useSocket();
    const {
        messages,
        conversations,
        isLoading,
        error,
        fetchConversations,
        joinConversation,
        sendMessage
    } = useChat();

    // Video call hook
    const {
        callState,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        isMuted,
        isCameraOff,
        error: callError,
        incomingCallFrom,
        activeConversationId: callConversationId
    } = useCall();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = session?.user?.id || '';
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Determine if video call modal should show
    const showCallModal = callState !== 'idle' && callState !== 'ended';

    // Get other participant name for call modal
    const callParticipantName = callConversationId
        ? conversations.find(c => c.id === callConversationId)?.otherParticipant?.name || 'Unknown'
        : activeConversation?.otherParticipant?.name || 'Unknown';

    // Handle starting a video call
    const handleStartCall = () => {
        if (activeConversationId && isConnected) {
            startCall(activeConversationId);
        }
    };

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Deep link support: auto-select conversation from URL param
    const searchParams = useSearchParams();
    useEffect(() => {
        const conversationParam = searchParams.get('conversation');
        if (conversationParam && conversations.length > 0 && !activeConversationId) {
            // Verify user is a participant (conversation exists in their list)
            const targetConversation = conversations.find(c => c.id === conversationParam);
            if (targetConversation) {
                handleSelectConversation(conversationParam);
            }
        }
    }, [searchParams, conversations, activeConversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        joinConversation(conversationId);
        setShowMobileList(false);
    };

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage(newMessage);
        setNewMessage('');
    };

    const filteredConversations = conversations.filter(c =>
        c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Determine user role for dashboard shell
    const userRole = session?.user?.role?.toLowerCase() as 'freelancer' | 'client' | 'admin' || 'freelancer';

    return (
        <DashboardShell role={userRole}>
            <div className="h-[calc(100vh-180px)] flex">
                {/* Connection Status Indicator */}
                <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isConnected
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                    }`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isConnected ? 'Live' : 'Offline'}
                </div>

                {/* Conversations List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-zinc-800 flex flex-col ${!showMobileList && activeConversationId ? 'hidden md:flex' : ''
                    }`}>
                    {/* Search Header */}
                    <div className="p-4 border-b border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-zinc-500">Loading conversations...</p>
                            </div>
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map((conv) => (
                                <ConversationItem
                                    key={conv.id}
                                    conversation={conv}
                                    isActive={activeConversationId === conv.id}
                                    currentUserId={currentUserId}
                                    onClick={() => handleSelectConversation(conv.id)}
                                />
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                <p className="text-sm text-zinc-500">
                                    {searchQuery ? 'No conversations found' : 'No active conversations'}
                                </p>
                                <p className="text-xs text-zinc-600 mt-2">
                                    Chat is enabled after starting a contract
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                {activeConversationId && activeConversation ? (
                    <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : ''}`}>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    className="md:hidden p-2 hover:bg-zinc-800 rounded-lg"
                                    onClick={() => setShowMobileList(true)}
                                >
                                    <ChevronLeft className="w-5 h-5 text-zinc-400" />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                        {activeConversation.otherParticipant?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white font-medium">{activeConversation.otherParticipant?.name || 'Unknown'}</p>
                                    <p className="text-zinc-500 text-xs">{activeConversation.contractTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeConversation.contractId && (
                                    <a href={`/contracts/${activeConversation.contractId}`} className="text-xs text-indigo-400 hover:underline px-2">
                                        View Contract
                                    </a>
                                )}
                                <button className="p-2 hover:bg-zinc-800 rounded-lg">
                                    <Phone className="w-5 h-5 text-zinc-400" />
                                </button>
                                <button
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleStartCall}
                                    disabled={!isConnected || callState !== 'idle'}
                                    title={isConnected ? 'Start Video Call' : 'Connect to start calls'}
                                >
                                    <Video className={`w-5 h-5 ${isConnected ? 'text-indigo-400' : 'text-zinc-600'}`} />
                                </button>
                                <button className="p-2 hover:bg-zinc-800 rounded-lg">
                                    <MoreVertical className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        {/* Contract Banner */}
                        {activeConversation.contractTitle && (
                            <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                    <span className="text-indigo-400 text-sm">{activeConversation.contractTitle}</span>
                                </div>
                                <span className={`text-xs ${activeConversation.contractStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                    {activeConversation.contractStatus}
                                </span>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <MessageSquare className="w-12 h-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-400">No messages yet</p>
                                    <p className="text-zinc-600 text-sm mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Date divider */}
                                    <div className="flex items-center justify-center my-4">
                                        <span className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-500 text-xs">Today</span>
                                    </div>

                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwn={message.senderId === currentUserId}
                                        />
                                    ))}
                                </>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex items-center gap-3">
                                <button className="p-2 hover:bg-zinc-800 rounded-lg" disabled>
                                    <Paperclip className="w-5 h-5 text-zinc-600" />
                                </button>
                                <button className="p-2 hover:bg-zinc-800 rounded-lg" disabled>
                                    <ImageIcon className="w-5 h-5 text-zinc-600" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <GlassButton
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500">Select a conversation to start messaging</p>
                            <p className="text-zinc-600 text-sm mt-2">
                                Messages are only available for active contracts
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Call Modal */}
            <VideoCallModal
                isOpen={showCallModal}
                callState={callState}
                localStream={localStream}
                remoteStream={remoteStream}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                error={callError}
                incomingCallFrom={incomingCallFrom}
                otherParticipantName={callParticipantName}
                onAccept={acceptCall}
                onReject={rejectCall}
                onEnd={endCall}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
            />
        </DashboardShell>
    );
}
