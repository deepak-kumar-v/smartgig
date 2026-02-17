'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIdentity } from '@/providers/identity-provider';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { useChat, ChatMessage, Conversation, getConversationLabel, getConversationTooltip } from '@/hooks/use-chat';
import { useSocket } from '@/providers/socket-provider';
import { useCall, CallType, CallState, ConnectionMode } from '@/hooks/use-call';
import { CallModal } from '@/components/call/CallModal';
import {
    Send, Paperclip, Search, MoreVertical, Phone, Video,
    Check, CheckCheck, FileText, Image as ImageIcon, Download,
    ChevronLeft, Wifi, WifiOff, MessageSquare, Info, X, Plus, Smile,
    Reply, Edit2, Trash2, CornerUpRight, History
} from 'lucide-react';
import { MessageVersionHistory } from '@/components/chat/message-version-history';
import { uploadChatAttachment } from '@/actions/chat-upload-actions';
import { ChatAttachmentCard } from '@/components/chat/chat-attachment-card';
import { ChatCallCard } from '@/components/chat/chat-call-card';
import { CallProviderMenu } from '@/components/chat/call-provider-menu';
import { GoogleMeetDraftCard } from '@/components/chat/google-meet-draft-card';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
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

// Always returns HH:mm in 24-hour format — used for bubble timestamps only
function formatBubbleTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Timezone-safe local day comparison
function isSameLocalDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// Numeric key for local date grouping: YYYYMMDD
function localDateKey(d: Date): number {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Returns "Today", "Yesterday", or "14 February 2026"
function getDateSeparatorLabel(messageDate: Date, today: Date, yesterday: Date): string {
    if (isSameLocalDay(messageDate, today)) return 'Today';
    if (isSameLocalDay(messageDate, yesterday)) return 'Yesterday';
    return messageDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
                            {isOwnLastMessage && (
                                conversation.lastMessage.readAt
                                    ? <CheckCheck className="w-3 h-3 text-blue-400 shrink-0" />
                                    : conversation.lastMessage.deliveredAt
                                        ? <CheckCheck className="w-3 h-3 text-zinc-500 shrink-0" />
                                        : <Check className="w-3 h-3 text-zinc-500 shrink-0" />
                            )}
                            {conversation.lastMessage.isDeleted
                                ? <span className="italic text-zinc-500">This message was deleted</span>
                                : <>
                                    {conversation.lastMessage.content}
                                    {conversation.lastMessage.isEdited && <span className="text-zinc-600 text-[10px] ml-1 italic">(edited)</span>}
                                </>
                            }
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}

const DEFAULT_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function MessageBubble({
    message,
    isOwn,
    currentUserId,
    messageElementId,
    onReact,
    onReply,
    onEdit,
    onDelete,
    onViewHistory
}: {
    message: ChatMessage;
    isOwn: boolean;
    currentUserId: string;
    messageElementId: string;
    onReact: (messageId: string, emoji: string) => void;
    onReply: (message: ChatMessage) => void;
    onEdit: (message: ChatMessage) => void;
    onDelete: (messageId: string) => void;
    onViewHistory: (messageId: string) => void;
}) {
    const [showReactionPopover, setShowReactionPopover] = useState(false);
    const [showEmojiMart, setShowEmojiMart] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const isCall = (message.type === 'CALL' || message.type === 'CALL_INVITE' || message.type === 'CALL_EVENT') && message.callMeta;

    // Group reactions by emoji
    const reactionGroups: Record<string, { count: number; hasOwn: boolean }> = {};
    if (message.reactions) {
        for (const r of message.reactions) {
            if (!reactionGroups[r.emoji]) {
                reactionGroups[r.emoji] = { count: 0, hasOwn: false };
            }
            reactionGroups[r.emoji].count++;
            if (r.userId === currentUserId) reactionGroups[r.emoji].hasOwn = true;
        }
    }

    // Find current user's reaction emoji (if any)
    const ownReactionEmoji = message.reactions?.find(r => r.userId === currentUserId)?.emoji;
    const hasAnyReactions = Object.keys(reactionGroups).length > 0;

    // Close popover on outside click
    useEffect(() => {
        if (!showReactionPopover && !showEmojiMart) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowReactionPopover(false);
                setShowEmojiMart(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowReactionPopover(false);
                setShowEmojiMart(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [showReactionPopover, showEmojiMart]);

    const isDeleted = message.isDeleted;
    const isEdited = message.isEdited;

    // Scroll to original message when clicking reply quote
    const scrollToOriginal = (targetMessageId: string) => {
        requestAnimationFrame(() => {
            const el = document.getElementById(`chat-message-${targetMessageId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Brief highlight flash
                el.classList.add('ring-2', 'ring-indigo-500/60', 'rounded-2xl');
                setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500/60', 'rounded-2xl'), 1500);
            }
        });
    };

    // "You" or sender name for reply quote
    const replyToDisplayName = message.replyTo
        ? (message.replyTo.senderId === currentUserId ? 'You' : (message.replyTo.sender?.name || 'Unknown'))
        : '';

    return (
        <div id={messageElementId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                {/* Call Message Card */}
                {isCall ? (
                    <ChatCallCard callMeta={message.callMeta!} isOwn={isOwn} />
                ) : isDeleted ? (
                    /* Soft-deleted message placeholder — clickable to view history */
                    <div
                        className={`p-4 rounded-2xl border border-dashed cursor-pointer hover:bg-zinc-800/40 transition-colors ${isOwn ? 'border-zinc-600 bg-zinc-900/50 rounded-br-md' : 'border-zinc-700 bg-zinc-900/30 rounded-bl-md'
                            }`}
                        onClick={() => onViewHistory(message.id)}
                    >
                        <p className="text-sm text-zinc-500 italic">🗑️ This message was deleted</p>
                        <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                            <History className="w-3 h-3" /> View history
                        </p>
                        {/* Reply button on deleted messages */}
                        <div className={`mt-2 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReply(message); }}
                                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                title="Reply to deleted message"
                            >
                                <Reply className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Hover action icons */}
                        <div className={`absolute -top-3 ${isOwn ? 'right-2' : 'left-2'} flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                            <button
                                onClick={() => onReply(message)}
                                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                title="Reply"
                            >
                                <Reply className="w-3 h-3" />
                            </button>
                            {isOwn && (
                                <>
                                    <button
                                        onClick={() => onEdit(message)}
                                        className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(message.id)}
                                        className="p-1 bg-zinc-800 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className={`p-4 rounded-2xl ${isOwn
                            ? 'bg-indigo-500 text-white rounded-br-md'
                            : 'bg-zinc-800 text-white rounded-bl-md'
                            }`}>
                            {/* Reply quote block — always scrolls to original message */}
                            {message.replyTo && (
                                <div
                                    className={`mb-2 px-3 py-2 rounded-lg border-l-2 cursor-pointer hover:opacity-90 transition-opacity ${isOwn ? 'bg-indigo-600/50 border-white/40' : 'bg-zinc-700/60 border-indigo-400'
                                        }`}
                                    onClick={() => scrollToOriginal(message.replyTo!.id)}
                                >
                                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                                        {replyToDisplayName}
                                    </p>
                                    <p className="text-xs opacity-80 line-clamp-2">
                                        {message.replyTo.isDeleted ? '🗑️ This message was deleted' : message.replyTo.content}
                                    </p>
                                </div>
                            )}

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
                    </div>
                )}

                {/* Existing reactions display (only if reactions exist) */}
                {hasAnyReactions && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
                            <button
                                key={emoji}
                                onClick={() => onReact(message.id, emoji)}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${hasOwn
                                    ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-300'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                <span>{emoji}</span>
                                <span>{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp + Status + React Button */}
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="text-zinc-500 text-xs">{formatBubbleTime(message.createdAt)}</span>
                    {isEdited && (
                        <button
                            onClick={() => onViewHistory(message.id)}
                            className="text-zinc-500 hover:text-indigo-400 text-[10px] italic cursor-pointer transition-colors"
                            title={message.editedAt ? `Edited ${new Date(message.editedAt).toLocaleString()} — Click for history` : 'Click for history'}
                        >
                            (edited)
                        </button>
                    )}
                    {isOwn && (
                        message.readAt
                            ? <CheckCheck className="w-3 h-3 text-indigo-400" />
                            : message.deliveredAt == null
                                ? <Check className="w-3 h-3 text-zinc-500" />
                                : <CheckCheck className="w-3 h-3 text-zinc-500" />
                    )}
                    {/* React button — hover-visible */}
                    <div className="relative" ref={popoverRef}>
                        <button
                            onClick={() => {
                                setShowReactionPopover(!showReactionPopover);
                                setShowEmojiMart(false);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-300"
                            title="React"
                        >
                            <Smile className="w-3.5 h-3.5" />
                        </button>
                        {showReactionPopover && !showEmojiMart && (
                            <div className={`absolute bottom-full ${isOwn ? 'right-0' : 'left-0'} mb-1 z-50`}>
                                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 shadow-xl">
                                    {DEFAULT_REACTION_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => {
                                                onReact(message.id, emoji);
                                                setShowReactionPopover(false);
                                            }}
                                            className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-base hover:scale-110 ${ownReactionEmoji === emoji
                                                ? 'bg-indigo-500/30 ring-1 ring-indigo-500/60'
                                                : 'hover:bg-zinc-700'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                    <div className="w-px h-5 bg-zinc-700 mx-0.5" />
                                    <button
                                        onClick={() => {
                                            setShowEmojiMart(true);
                                            setShowReactionPopover(false);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-200"
                                        title="More reactions"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                        {showEmojiMart && (
                            <div className={`absolute bottom-full ${isOwn ? 'right-0' : 'left-0'} mb-1 z-50`}>
                                <Picker
                                    data={data}
                                    onEmojiSelect={(emoji: any) => {
                                        onReact(message.id, emoji.native);
                                        setShowEmojiMart(false);
                                        setShowReactionPopover(false);
                                    }}
                                    theme="dark"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                    maxFrequentRows={1}
                                    perLine={8}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    const { userId, userRole, userName, userImage } = useIdentity();
    const { socket, isConnected } = useSocket();
    const currentUserId = userId;
    // --- DIAGNOSTIC: Session Identity ---
    if (typeof window !== 'undefined') {
        console.log('[DIAG][SESSION][CLIENT_PAGE]', {
            currentUserId,
            role: userRole,
            identitySource: 'IdentityProvider',
            pathname: window.location.pathname
        });
    }
    // Use raw role for helper functions (expects uppercase CLIENT/FREELANCER)
    const currentUserRole = userRole;

    const {
        messages,
        conversations,
        isLoading,
        error,
        fetchConversations,
        joinConversation,
        sendMessage,
        editMessage,
        deleteMessage
    } = useChat();

    // Video call hook
    const {
        callState,
        localStream,
        remoteStream,
        startAudioCall,
        startVideoCall,
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
        connectionMode,
        callType,
        callDuration
    } = useCall();

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [draftAttachments, setDraftAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showMeetDraft, setShowMeetDraft] = useState(false);
    const [meetMode, setMeetMode] = useState<'audio' | 'video'>('video');
    const [showMeetGuidance, setShowMeetGuidance] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileList, setShowMobileList] = useState(true);

    // Typing indicator state
    const [isRemoteTyping, setIsRemoteTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Reply/Edit/Delete state
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [editContent, setEditContent] = useState('');
    const [versionHistoryMessageId, setVersionHistoryMessageId] = useState<string | null>(null);

    // Determine if video call modal should show
    const showCallModal = callState !== 'idle' && callState !== 'ended';

    // Get other participant name for call modal
    const callParticipantName = callConversationId
        ? conversations.find(c => c.id === callConversationId)?.otherParticipant?.name || 'Unknown'
        : activeConversation?.otherParticipant?.name || 'Unknown';
    const messagesViewportRef = useRef<HTMLDivElement>(null);
    const lastReadEmitRef = useRef<string>('');
    const hasAutoScrolledRef = useRef<string | null>(null);
    // Divider state machine
    const initialUnreadAnchorIdRef = useRef<string | null>(null);
    const liveUnreadAnchorIdRef = useRef<string | null>(null);
    const unreadSnapshotConvRef = useRef<string | null>(null);
    const newMessagesDividerRef = useRef<HTMLDivElement | null>(null);
    // Scroll tracking
    const isUserAtBottomRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);
    const isOneToOneActiveConversation = Boolean(activeConversationId && activeConversation?.otherParticipant?.id);

    const getLatestUnreadIncomingMessage = useCallback(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (message.senderId !== currentUserId && !message.readAt) {
                return message;
            }
        }
        return null;
    }, [messages, currentUserId]);

    const isMessageElementVisible = useCallback((element: HTMLElement, container: HTMLElement) => {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return elementRect.bottom >= containerRect.top && elementRect.top <= containerRect.bottom;
    }, []);

    const maybeEmitRead = useCallback(() => {
        if (!socket || !isConnected || !activeConversationId || !isOneToOneActiveConversation) return;
        if (document.visibilityState !== 'visible') return;

        const latestUnreadIncoming = getLatestUnreadIncomingMessage();
        if (!latestUnreadIncoming || latestUnreadIncoming.conversationId !== activeConversationId) return;

        const container = messagesViewportRef.current;
        if (!container) return;

        const messageElement = document.getElementById(`chat-message-${latestUnreadIncoming.id}`);
        const isVisible = messageElement ? isMessageElementVisible(messageElement, container) : false;
        const isAtBottomNormal = Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) <= 24;
        const isAtBottomReversed = container.scrollTop <= 24;

        if (!isVisible && !isAtBottomNormal && !isAtBottomReversed) return;

        const emitKey = `${activeConversationId}:${latestUnreadIncoming.id}`;
        if (lastReadEmitRef.current === emitKey) return;

        socket.emit('message:read', { conversationId: activeConversationId });
        lastReadEmitRef.current = emitKey;
    }, [
        socket,
        isConnected,
        activeConversationId,
        isOneToOneActiveConversation,
        getLatestUnreadIncomingMessage,
        isMessageElementVisible
    ]);

    const handleMessagesScroll = useCallback(() => {
        maybeEmitRead();
    }, [maybeEmitRead]);

    // Handle starting a video call
    // Video Call
    const handleStartVideoCall = async () => {
        if (activeConversationId && isConnected) {
            await startVideoCall(activeConversationId);
            sendMessage('Video call — SmartGig Video', [], 'CALL_EVENT', {
                mode: 'video',
                provider: 'smartgig_custom',
                meetingUrl: '#'
            });
        }
    };

    // Audio Call
    const handleStartAudioCall = async () => {
        if (activeConversationId && isConnected) {
            await startAudioCall(activeConversationId);
            sendMessage('Audio call — SmartGIG', [], 'CALL_EVENT', {
                mode: 'audio',
                provider: 'smartgig_custom',
                meetingUrl: '#'
            });
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

    // Typing indicator socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleTypingStart = (data: { conversationId: string; userId: string }) => {
            if (data.conversationId === activeConversationId && data.userId !== currentUserId) {
                setIsRemoteTyping(true);
                // Auto-hide after 4s (safety net)
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsRemoteTyping(false), 4000);
            }
        };

        const handleTypingStop = (data: { conversationId: string; userId: string }) => {
            if (data.conversationId === activeConversationId) {
                setIsRemoteTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        };

        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);

        return () => {
            socket.off('typing:start', handleTypingStart);
            socket.off('typing:stop', handleTypingStop);
        };
    }, [socket, activeConversationId, currentUserId]);

    useEffect(() => {
        lastReadEmitRef.current = '';
    }, [activeConversationId]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                maybeEmitRead();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [maybeEmitRead]);

    useLayoutEffect(() => {
        if (!activeConversationId) return;
        const frame = window.requestAnimationFrame(() => {
            maybeEmitRead();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [messages, activeConversationId, maybeEmitRead]);

    // STEP 2: Scroll position tracking
    useEffect(() => {
        const container = messagesViewportRef.current;
        if (!container) return;
        const handleScroll = () => {
            const threshold = 30;
            const atBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
            isUserAtBottomRef.current = atBottom;
            if (atBottom) {
                liveUnreadAnchorIdRef.current = null;
            }
        };
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // STEP 3: Snapshot first unread on conversation open
    useEffect(() => {
        if (!activeConversationId) return;
        if (messages.length === 0) return;
        if (unreadSnapshotConvRef.current === activeConversationId) return;
        const ordered = [...messages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const firstUnread = ordered.find(
            (m) => m.senderId !== currentUserId && !m.readAt
        );
        initialUnreadAnchorIdRef.current = firstUnread?.id ?? null;
        liveUnreadAnchorIdRef.current = null;
        unreadSnapshotConvRef.current = activeConversationId;
    }, [activeConversationId, messages, currentUserId]);

    // STEP 4: Deterministic initial scroll
    useLayoutEffect(() => {
        if (!activeConversationId) return;
        if (messages.length === 0) return;
        if (hasAutoScrolledRef.current === activeConversationId) return;

        const container = messagesViewportRef.current;
        if (!container) return;

        const targetId = initialUnreadAnchorIdRef.current;
        if (targetId) {
            const divider = newMessagesDividerRef.current;
            if (divider) {
                divider.scrollIntoView({ block: "start" });
            }
        } else {
            container.scrollTop = container.scrollHeight;
        }

        hasAutoScrolledRef.current = activeConversationId;
    }, [activeConversationId, messages]);

    // STEP 5: Live incoming message detection
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (
                lastMsg.senderId !== currentUserId &&
                !isUserAtBottomRef.current &&
                !liveUnreadAnchorIdRef.current
            ) {
                liveUnreadAnchorIdRef.current = lastMsg.id;
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, currentUserId]);

    // STEP 7: Reset on conversation switch
    useEffect(() => {
        initialUnreadAnchorIdRef.current = null;
        liveUnreadAnchorIdRef.current = null;
        unreadSnapshotConvRef.current = null;
        hasAutoScrolledRef.current = null;
        prevMessagesLengthRef.current = 0;
    }, [activeConversationId]);

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        joinConversation(conversationId);
        setShowMobileList(false);
        setIsRemoteTyping(false); // Reset typing indicator
    };

    const handleSend = () => {
        // Handle edit mode
        if (editingMessage) {
            if (!editContent.trim()) return;
            editMessage(editingMessage.id, editContent);
            setEditingMessage(null);
            setEditContent('');
            return;
        }

        if (!newMessage.trim() && draftAttachments.length === 0) return;

        // Stop typing indicator
        if (socket && activeConversationId) {
            socket.emit('typing:stop', { conversationId: activeConversationId });
            if (emitTimeoutRef.current) {
                clearTimeout(emitTimeoutRef.current);
                emitTimeoutRef.current = null;
            }
        }

        // BLOCK UNSAFE MEET LINKS
        if (newMessage.includes('meet.google.com/new') || newMessage.includes('meet.google.com/')) {
            // Check for valid pattern
            const meetRegex = /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/;
            const match = newMessage.match(meetRegex);

            if (newMessage.includes('/new')) {
                // Ideally show toast, but alert is fine for strict guard
                alert("Please paste the actual meeting link, not the creation link (/new).");
                return;
            }

            if (match) {
                // Convert to Google Meet Call Card
                sendMessage(newMessage, draftAttachments, 'CALL_INVITE', {
                    mode: 'video', // Default to video for Meet
                    provider: 'google_meet',
                    meetingUrl: match[0]
                });
                setNewMessage('');
                setDraftAttachments([]);
                setShowMeetGuidance(false);
                return;
            }
        }

        // Send message with optional replyToId
        sendMessage(newMessage, draftAttachments, 'TEXT', undefined, replyingTo?.id);
        setNewMessage('');
        setDraftAttachments([]);
        setReplyingTo(null);

        // Auto-scroll to bottom after self-sent message
        requestAnimationFrame(() => {
            const container = messagesViewportRef.current;
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    };

    // Reply/Edit/Delete handlers
    const handleReply = (message: ChatMessage) => {
        setReplyingTo(message);
        setEditingMessage(null);
        setEditContent('');
    };

    const handleEditStart = (message: ChatMessage) => {
        setEditingMessage(message);
        setEditContent(message.content);
        setReplyingTo(null);
    };

    const handleDelete = (messageId: string) => {
        if (confirm('Delete this message? This action is auditable.')) {
            deleteMessage(messageId);
        }
    };

    const cancelReply = () => setReplyingTo(null);
    const cancelEdit = () => {
        setEditingMessage(null);
        setEditContent('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        // Debounced typing emit (max once per 2s)
        if (socket && isConnected && activeConversationId) {
            if (!emitTimeoutRef.current) {
                socket.emit('typing:start', { conversationId: activeConversationId });
            }
            if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
            emitTimeoutRef.current = setTimeout(() => {
                socket.emit('typing:stop', { conversationId: activeConversationId });
                emitTimeoutRef.current = null;
            }, 3000);
        }
    };

    // ==================== MESSAGE REACTIONS ====================
    const handleReact = (messageId: string, emoji: string) => {
        if (!socket || !activeConversationId) return;
        socket.emit('message:react', { messageId, conversationId: activeConversationId, emoji });
    };
    // ==================== END MESSAGE REACTIONS ====================

    // ==================== INPUT EMOJI PICKER ====================
    const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
    const inputEmojiRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showInputEmojiPicker) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (inputEmojiRef.current && !inputEmojiRef.current.contains(e.target as Node)) {
                setShowInputEmojiPicker(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowInputEmojiPicker(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [showInputEmojiPicker]);
    // ==================== END INPUT EMOJI PICKER ====================

    const handleMeetInvite = (url: string) => {
        const isAudio = meetMode === 'audio';
        sendMessage(isAudio ? 'Audio Call — Google Meet' : 'Video Call — Google Meet', [], 'CALL_INVITE', {
            mode: meetMode,
            provider: 'google_meet',
            meetingUrl: url
        });
        setShowMeetDraft(false);
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
    const dashboardRole = (currentUserRole?.toLowerCase() as 'freelancer' | 'client' | 'admin') || 'freelancer';

    return (
        <>
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
                                    onClick={handleStartVideoCall}
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
                        <div
                            ref={messagesViewportRef}
                            onScroll={handleMessagesScroll}
                            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <MessageSquare className="w-12 h-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-400">No messages yet</p>
                                    <p className="text-zinc-600 text-sm mt-1">Start the conversation!</p>
                                </div>
                            ) : (
                                <>
                                    {(() => {
                                        const ordered = [...messages].sort(
                                            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                        );
                                        // Always use fresh client-local time for date comparison
                                        const now = new Date();
                                        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

                                        let lastKey = -1;
                                        return ordered.map((message) => {
                                            const msgDate = new Date(message.createdAt);
                                            const key = localDateKey(msgDate);
                                            const showSeparator = key !== lastKey;
                                            lastKey = key;

                                            // STEP 6: Divider at snapshotted/live anchor position
                                            const isDividerPosition =
                                                message.id === liveUnreadAnchorIdRef.current ||
                                                (liveUnreadAnchorIdRef.current === null &&
                                                    message.id === initialUnreadAnchorIdRef.current);

                                            return (
                                                <React.Fragment key={message.id}>
                                                    {showSeparator && (
                                                        <div className="flex items-center justify-center my-4" suppressHydrationWarning>
                                                            <span className="px-3 py-1 bg-zinc-800 rounded-full text-zinc-500 text-xs" suppressHydrationWarning>
                                                                {getDateSeparatorLabel(msgDate, now, yesterday)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isDividerPosition && (
                                                        <div
                                                            ref={newMessagesDividerRef}
                                                            className="flex items-center gap-3 my-4"
                                                        >
                                                            <div className="flex-1 h-px bg-indigo-500/50" />
                                                            <span className="text-xs font-medium text-indigo-400 whitespace-nowrap">
                                                                New Messages
                                                            </span>
                                                            <div className="flex-1 h-px bg-indigo-500/50" />
                                                        </div>
                                                    )}
                                                    <MessageBubble
                                                        message={message}
                                                        isOwn={(() => {
                                                            const isOwn = message.senderId === currentUserId;
                                                            console.log('[DIAG][RENDER_DECISION]', {
                                                                messageId: message.id,
                                                                messageSenderId: message.senderId,
                                                                currentUserId,
                                                                isOwn,
                                                                content: message.content?.substring(0, 20)
                                                            });
                                                            return isOwn;
                                                        })()}
                                                        currentUserId={currentUserId}
                                                        messageElementId={`chat-message-${message.id}`}
                                                        onReact={handleReact}
                                                        onReply={handleReply}
                                                        onEdit={handleEditStart}
                                                        onDelete={handleDelete}
                                                        onViewHistory={(id) => setVersionHistoryMessageId(id)}
                                                    />
                                                </React.Fragment>
                                            );
                                        });
                                    })()}
                                </>
                            )}
                        </div>

                        {/* Typing Indicator */}
                        {isRemoteTyping && (
                            <div className="px-4 py-1.5">
                                <span className="text-xs text-zinc-500 italic">
                                    {activeConversation?.otherParticipant?.name || 'Someone'} is typing…
                                </span>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-800 relative">
                            {/* Reply Preview Bar */}
                            {replyingTo && (
                                <div className="mb-2 flex items-center gap-2 bg-zinc-800/60 border-l-2 border-indigo-500 rounded-r-lg px-3 py-2">
                                    <CornerUpRight className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-indigo-400 font-semibold">
                                            Replying to {replyingTo.senderId === currentUserId ? 'You' : (replyingTo.sender?.name || 'Unknown')}
                                        </p>
                                        <p className="text-xs text-zinc-400 truncate">
                                            {replyingTo.isDeleted ? '🗑️ Deleted message' : replyingTo.content}
                                        </p>
                                    </div>
                                    <button onClick={cancelReply} className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* Edit Mode Bar */}
                            {editingMessage && (
                                <div className="mb-2 flex items-center gap-2 bg-amber-900/30 border-l-2 border-amber-500 rounded-r-lg px-3 py-2">
                                    <Edit2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-amber-400 font-semibold">Editing message</p>
                                        <p className="text-xs text-zinc-400 truncate">{editingMessage.content}</p>
                                    </div>
                                    <button onClick={cancelEdit} className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {/* Inline Google Meet Draft Card */}
                            {showMeetDraft && (
                                <div className="absolute bottom-full left-0 right-0 px-4 pb-2 z-10 w-full max-w-lg mx-auto">
                                    <GoogleMeetDraftCard
                                        onSend={handleMeetInvite}
                                        onCancel={() => setShowMeetDraft(false)}
                                    />
                                </div>
                            )}

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
                                        if (provider === 'smartgig_custom') {
                                            handleStartAudioCall();
                                            return;
                                        }
                                        if (provider === 'google_meet') {
                                            // Open new tab for creation, but show inline draft
                                            window.open('https://meet.google.com/new', '_blank');
                                            setShowMeetDraft(true);
                                            setMeetMode('audio');
                                            return;
                                        }

                                        let finalUrl = meetingUrl;

                                        sendMessage(`Started an audio call`, [], 'CALL', {
                                            mode: 'audio',
                                            provider,
                                            meetingUrl: finalUrl
                                        });

                                        if (finalUrl) {
                                            window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                />
                                {showMeetDraft && (
                                    /* Removed from here, moved to top of container */
                                    null
                                )}
                                {/* Video Call with Provider Selection */}
                                <CallProviderMenu
                                    intent="video"
                                    onSelectProvider={(intent, provider, meetingUrl) => {
                                        if (provider === 'smartgig_custom') {
                                            handleStartVideoCall();
                                        } else if (provider === 'google_meet') {
                                            window.open('https://meet.google.com/new', '_blank');
                                            setShowMeetDraft(true);
                                            setMeetMode('video');
                                        }
                                    }}
                                />
                                {/* Previously guidance was here, now removed in favor of inline draft card above */}
                                {/* Input Emoji Picker */}
                                <div className="relative" ref={inputEmojiRef}>
                                    <button
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                        onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                                        title="Emoji"
                                    >
                                        <Smile className="w-5 h-5 text-zinc-400" />
                                    </button>
                                    {showInputEmojiPicker && (
                                        <div className="absolute bottom-full left-0 mb-2 z-50">
                                            <Picker
                                                data={data}
                                                onEmojiSelect={(emoji: any) => {
                                                    setNewMessage(prev => prev + emoji.native);
                                                    setShowInputEmojiPicker(false);
                                                }}
                                                theme="dark"
                                                previewPosition="none"
                                                skinTonePosition="none"
                                                maxFrequentRows={1}
                                                perLine={8}
                                            />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={editingMessage ? editContent : newMessage}
                                    onChange={editingMessage ? (e) => setEditContent(e.target.value) : handleInputChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
                                    className={`flex-1 bg-zinc-800/50 border text-white rounded-lg px-4 py-2 text-sm focus:outline-none ${editingMessage ? 'border-amber-500/50 focus:border-amber-500' : 'border-zinc-700 focus:border-indigo-500'
                                        }`}
                                />
                                <GlassButton
                                    variant={editingMessage ? 'secondary' : 'primary'}
                                    size="sm"
                                    onClick={handleSend}
                                    disabled={editingMessage ? !editContent.trim() : (!newMessage.trim() && draftAttachments.length === 0)}
                                >
                                    {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
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

            {/* Unified Call Modal */}
            <CallModal
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
                callType={callType}
                callDuration={callDuration}
            />

            {/* Version History Modal — lazy loaded */}
            <MessageVersionHistory
                messageId={versionHistoryMessageId}
                isOpen={versionHistoryMessageId !== null}
                onClose={() => setVersionHistoryMessageId(null)}
            />
        </>
    );
}
