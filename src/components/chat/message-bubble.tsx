'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Check, CheckCheck, Reply, Edit2, Trash2, History, Smile, Plus
} from 'lucide-react';
import { ChatAttachmentCard } from '@/components/chat/chat-attachment-card';
import { ChatCallCard } from '@/components/chat/chat-call-card';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Re-export ChatMessage type for convenience
export type { ChatMessage } from '@/hooks/use-chat';
import type { ChatMessage } from '@/hooks/use-chat';

const DEFAULT_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Always returns HH:mm in 24-hour format — used for bubble timestamps only
function formatBubbleTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    currentUserId: string;
    messageElementId: string;
    onReact: (messageId: string, emoji: string) => void;
    onReply: (message: ChatMessage) => void;
    onEdit: (message: ChatMessage) => void;
    onDelete: (messageId: string) => void;
    onViewHistory: (messageId: string) => void;
    /** When true, hides all interactive controls (reply, edit, delete, react). Defaults to false. */
    readOnly?: boolean;
    /** When true AND readOnly is true, allows clicking edited/deleted indicators to inspect message history. Used for admin arbitration. */
    allowHistoryInspection?: boolean;
}

export function MessageBubble({
    message,
    isOwn,
    currentUserId,
    messageElementId,
    onReact,
    onReply,
    onEdit,
    onDelete,
    onViewHistory,
    readOnly = false,
    allowHistoryInspection = false
}: MessageBubbleProps) {
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
        <div id={messageElementId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group transition-all duration-500`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                {/* Call Message Card */}
                {isCall ? (
                    <ChatCallCard callMeta={message.callMeta!} isOwn={isOwn} />
                ) : isDeleted ? (
                    /* Soft-deleted message placeholder */
                    <div
                        className={`p-4 rounded-2xl border border-dashed ${readOnly && !allowHistoryInspection ? '' : 'cursor-pointer hover:bg-zinc-800/40'} transition-colors ${isOwn ? 'border-zinc-600 bg-zinc-900/50 rounded-br-md' : 'border-zinc-700 bg-zinc-900/30 rounded-bl-md'
                            }`}
                        onClick={readOnly && !allowHistoryInspection ? undefined : () => onViewHistory(message.id)}
                    >
                        <p className="text-sm text-zinc-500 italic">🗑️ This message was deleted</p>
                        {/* History inspection for admins (readOnly + allowHistoryInspection) */}
                        {readOnly && allowHistoryInspection && (
                            <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                                <History className="w-3 h-3" /> View history
                            </p>
                        )}
                        {!readOnly && (
                            <>
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
                            </>
                        )}
                    </div>
                ) : (
                    <div className="relative">
                        {/* Hover action icons — hidden in readOnly */}
                        {!readOnly && (
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
                                        {message.type !== 'AUDIO' && (
                                            <button
                                                onClick={() => onEdit(message)}
                                                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        )}
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
                        )}

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
                                        {message.replyTo.isDeleted
                                            ? '🗑️ This message was deleted'
                                            : message.replyTo.content === '' || !message.replyTo.content
                                                ? '🎵 Audio message'
                                                : message.replyTo.content}
                                    </p>
                                </div>
                            )}

                            {/* Audio message rendering */}
                            {message.type === 'AUDIO' && message.audioUrl ? (
                                <audio controls src={message.audioUrl} className="max-w-[250px]" preload="metadata" />
                            ) : (message.content && message.content !== 'Sent an attachment') ||
                                !(message.attachments && message.attachments.length > 0) ? (
                                <p className="text-sm border-0 focus:ring-0">{message.type === 'AUDIO' ? '🎵 Audio message' : message.content}</p>
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
                            readOnly ? (
                                <span
                                    key={emoji}
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${hasOwn
                                        ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-300'
                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                                        }`}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </span>
                            ) : (
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
                            )
                        ))}
                    </div>
                )}

                {/* Timestamp + Status + React Button */}
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="text-zinc-500 text-xs">{formatBubbleTime(message.createdAt)}</span>
                    {isEdited && (
                        readOnly && !allowHistoryInspection ? (
                            <span
                                className="text-zinc-500 text-[10px] italic"
                                title={message.editedAt ? `Edited ${new Date(message.editedAt).toLocaleString()}` : undefined}
                            >
                                (edited)
                            </span>
                        ) : (
                            <button
                                onClick={() => onViewHistory(message.id)}
                                className="text-zinc-500 hover:text-indigo-400 text-[10px] italic cursor-pointer transition-colors"
                                title={message.editedAt ? `Edited ${new Date(message.editedAt).toLocaleString()} — Click for history` : 'Click for history'}
                            >
                                (edited)
                            </button>
                        )
                    )}
                    {isOwn && (
                        message.readAt
                            ? <CheckCheck className="w-3 h-3 text-indigo-400" />
                            : message.deliveredAt == null
                                ? <Check className="w-3 h-3 text-zinc-500" />
                                : <CheckCheck className="w-3 h-3 text-zinc-500" />
                    )}
                    {/* React button — hover-visible, hidden in readOnly */}
                    {!readOnly && (
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
                    )}
                </div>
            </div>
        </div>
    );
}
