'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { useChat, ChatMessage, Conversation, getConversationLabel, getConversationTooltip } from '@/hooks/use-chat';
import { useSocket } from '@/providers/socket-provider';
import { useCall } from '@/hooks/use-call';
import { VideoCallModal } from '@/components/video/VideoCallModal';
import {
    Send, Paperclip, Search, MoreVertical, Phone, Video,
    CheckCheck, Clock, FileText, Image as ImageIcon, Download,
    ChevronLeft, Wifi, WifiOff, MessageSquare, Info, X
} from 'lucide-react';
import { uploadChatAttachment } from '@/actions/chat-upload-actions';
import { ChatAttachmentCard } from '@/components/chat/chat-attachment-card';
import { ChatCallCard } from '@/components/chat/chat-call-card';
import { CallProviderMenu } from '@/components/chat/call-provider-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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
    onClick,
    currentUserRole
}: {
    conversation: Conversation;
    isActive: boolean;
    currentUserId: string;
    onClick: () => void;
    currentUserRole?: string | null;
}) {
    const initials = conversation.otherParticipant?.name?.split(' ').map(n => n[0]).join('') || '?';
    const isOwnLastMessage = conversation.lastMessage?.senderId === currentUserId;

    const tooltipText = getConversationTooltip(conversation, currentUserRole);


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
                    {(conversation.unreadCount || 0) > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                                {conversation.unreadCount}
                            </span>
                        </div>
                    )}
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
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-indigo-400 text-xs truncate">
                            {getConversationLabel(conversation, currentUserRole)}
                        </p>
                        {tooltipText && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>
                                            <Info className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[200px] whitespace-pre-wrap text-xs bg-zinc-900 border-zinc-700 text-zinc-300">
                                        {tooltipText}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
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
    const isCall = message.type === 'CALL' && message.callMeta;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                {/* Call Message Card */}
                {isCall ? (
                    <ChatCallCard callMeta={message.callMeta!} isOwn={isOwn} />
                ) : (
                    <div className={`p-4 rounded-2xl ${isOwn
                        ? 'bg-indigo-500 text-white rounded-br-md'
                        : 'bg-zinc-800 text-white rounded-bl-md'
                        }`}>
                        {/* Only show content if it's real text, not placeholder when attachments exist */}
                        {(message.content && message.content !== 'Sent an attachment') ||
                            !(message.attachments && message.attachments.length > 0) ? (
                            <p className="text-sm border-0 focus:ring-0">{message.content}</p>
                        ) : null}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className={`flex flex-col gap-2 ${message.content && message.content !== 'Sent an attachment' ? 'mt-2' : ''}`}>
                                {message.attachments.map((att: any) => (
                                    <ChatAttachmentCard key={att.id || att.url} attachment={att} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
        activeConversationId: callConversationId,
        connectionMode
    } = useCall();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [draftAttachments, setDraftAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);

    const currentUserId = session?.user?.id || '';
    // Use raw role for helper functions (expects uppercase CLIENT/FREELANCER)
    const currentUserRole = session?.user?.role || null;
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

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        joinConversation(conversationId);
        setShowMobileList(false);
    };

    const handleSend = () => {
        if (!newMessage.trim() && draftAttachments.length === 0) return;
        sendMessage(newMessage, draftAttachments);
        setNewMessage('');
        setDraftAttachments([]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);

            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadChatAttachment(formData);

            if (result.success && result.data) {
                setDraftAttachments(prev => [...prev, result.data]);
            } else {
                console.error("Upload failed", result.error);
                // Optionally show toast error
            }
            setIsUploading(false);

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeDraftAttachment = (index: number) => {
        setDraftAttachments(prev => prev.filter((_, i) => i !== index));
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
                                    currentUserRole={currentUserRole}
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

                                    {/* Active Chat Header Subtitle */}
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-zinc-500 text-xs">{getConversationLabel(activeConversation, currentUserRole)}</p>
                                        {getConversationTooltip(activeConversation, currentUserRole) && (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="shrink-0 cursor-help">
                                                            <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[200px] whitespace-pre-wrap text-xs bg-zinc-900 border-zinc-700 text-zinc-300">
                                                        {getConversationTooltip(activeConversation, currentUserRole)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeConversation.contractId && (
                                    <a
                                        href={`/${currentUserRole === 'CLIENT' ? 'client' : 'freelancer'}/contracts/${activeConversation.contractId}`}
                                        className="text-xs text-indigo-400 hover:underline px-2"
                                    >
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



                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <MessageSquare className="w-12 h-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-400">No messages yet</p>
                                    <p className="text-zinc-600 text-sm mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    {[...messages].reverse().map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            message={message}
                                            isOwn={message.senderId === currentUserId}
                                        />
                                    ))}

                                    {/* Date divider (rendered last = shown at top) */}
                                    <div className="flex items-center justify-center my-4">
                                        <span className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-500 text-xs">Today</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-800">
                            {/* Draft Attachments Preview */}
                            {draftAttachments.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {draftAttachments.map((att, index) => (
                                        <ChatAttachmentCard
                                            key={index}
                                            attachment={att}
                                            isDraft
                                            onRemove={() => removeDraftAttachment(index)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                                />
                                <button
                                    className={`p-2 hover:bg-zinc-800 rounded-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    title="Attach file"
                                >
                                    <Paperclip className={`w-5 h-5 text-zinc-600 ${isUploading ? 'animate-pulse' : ''}`} />
                                </button>
                                <button className="p-2 hover:bg-zinc-800 rounded-lg" disabled title="Image">
                                    <ImageIcon className="w-5 h-5 text-zinc-600" />
                                </button>
                                {/* Audio Call with Provider Selection */}
                                <CallProviderMenu
                                    intent="audio"
                                    onSelectProvider={(intent, provider, meetingUrl) => {
                                        sendMessage(`Started an audio call`, [], 'CALL', {
                                            mode: 'audio',
                                            provider,
                                            meetingUrl
                                        });
                                        window.open(meetingUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                />
                                {/* Video Call with Provider Selection */}
                                <CallProviderMenu
                                    intent="video"
                                    onSelectProvider={(intent, provider, meetingUrl) => {
                                        if (provider === 'smartgig_custom') {
                                            handleStartCall();
                                        } else {
                                            sendMessage(`Started a video call`, [], 'CALL', {
                                                mode: 'video',
                                                provider,
                                                meetingUrl
                                            });
                                            window.open(meetingUrl, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                />
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
                                    disabled={!newMessage.trim() && draftAttachments.length === 0}
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
                connectionMode={connectionMode}
            />
        </DashboardShell>
    );
}
