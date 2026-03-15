'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Shield, MessageSquare, Send, Lock, VolumeX, Users, User as UserIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AdminMessage {
    id: string;
    senderId: string;
    recipientId: string | null;
    content: string;
    isPrivate: boolean;
    senderName: string;
    senderRole?: string;
    recipientName: string | null;
    createdAt: string;
}

interface ArbitrationChatProps {
    disputeId: string;
    messages: AdminMessage[];
    currentUserId: string;
    clientUserId: string;
    freelancerUserId: string;
    clientName: string;
    freelancerName: string;
    isResolved: boolean;
    isMuted: boolean;
    mutedUntil: string | null;
    onSend: (content: string, isPrivate: boolean) => Promise<{ success?: boolean; error?: string }>;
    /** "client" or "freelancer" — determines which private messages are visible */
    viewerRole: 'client' | 'freelancer';
}

// ============================================================================
// ArbitrationChat Component
// ============================================================================

export function ArbitrationChat({
    disputeId,
    messages,
    currentUserId,
    clientUserId,
    freelancerUserId,
    clientName,
    freelancerName,
    isResolved,
    isMuted,
    mutedUntil,
    onSend,
    viewerRole,
}: ArbitrationChatProps) {
    const [activeTab, setActiveTab] = useState<'group' | 'private'>('group');
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Filter messages by tab
    const filteredMessages = messages.filter(m => {
        if (activeTab === 'group') return !m.isPrivate;
        // Private tab: show messages involving the current user
        return m.isPrivate && (m.senderId === currentUserId || m.recipientId === currentUserId);
    });

    // Auto-scroll on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredMessages.length, activeTab]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;
        setSending(true);
        const result = await onSend(inputText.trim(), activeTab === 'private');
        if (result.success) {
            setInputText('');
        }
        setSending(false);
    };

    // Compute remaining mute time
    const muteRemaining = mutedUntil ? Math.max(0, Math.ceil((new Date(mutedUntil).getTime() - Date.now()) / 60000)) : 0;

    // Determine sender label color
    const getSenderColor = (senderId: string, senderRole?: string) => {
        if (senderRole === 'ADMIN') return 'text-orange-400';
        if (senderId === clientUserId) return 'text-blue-400';
        if (senderId === freelancerUserId) return 'text-emerald-400';
        return 'text-zinc-400';
    };

    const getSenderLabel = (senderId: string, senderName: string, senderRole?: string) => {
        if (senderRole === 'ADMIN') return 'Admin';
        if (senderId === clientUserId) return viewerRole === 'client' ? 'You' : clientName;
        if (senderId === freelancerUserId) return viewerRole === 'freelancer' ? 'You' : freelancerName;
        return senderName;
    };

    return (
        <GlassCard className="overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    Admin Arbitration
                </h3>
            </div>

            <div className="p-4 space-y-3">
                {/* Tabs */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('group')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                            activeTab === 'group'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
                        }`}
                    >
                        <Users className="w-3 h-3" /> Group Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                            activeTab === 'private'
                                ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent'
                        }`}
                    >
                        <Lock className="w-3 h-3" /> Private with Admin
                    </button>
                </div>

                {/* Participant legend */}
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-400" /> Admin
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" /> {clientName}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> {freelancerName}
                    </span>
                </div>

                {/* Messages */}
                <div className="bg-zinc-900/50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                    {filteredMessages.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">
                            {activeTab === 'group'
                                ? 'No group messages yet. The admin will initiate the conversation.'
                                : 'No private messages with admin yet.'}
                        </p>
                    ) : filteredMessages.map(m => (
                        <div
                            key={m.id}
                            className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-2.5 rounded-lg ${
                                m.senderId === currentUserId
                                    ? 'bg-indigo-500/20 rounded-br-sm'
                                    : 'bg-zinc-800/80 rounded-bl-sm'
                            }`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-medium ${getSenderColor(m.senderId, m.senderRole)}`}>
                                        {getSenderLabel(m.senderId, m.senderName, m.senderRole)}
                                    </span>
                                    {m.isPrivate && (
                                        <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1 rounded">Private</span>
                                    )}
                                    <span className="text-zinc-600 text-[10px] ml-auto">
                                        {new Date(m.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-sm">{m.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Mute banner */}
                {isMuted && muteRemaining > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <VolumeX className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-red-400 text-xs">
                            You are temporarily muted by the dispute moderator. ({muteRemaining} min remaining)
                        </p>
                    </div>
                )}

                {/* Input area */}
                {!isResolved && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={isMuted && muteRemaining > 0}
                            placeholder={
                                isMuted && muteRemaining > 0
                                    ? 'You are temporarily muted by the dispute moderator.'
                                    : activeTab === 'group'
                                        ? 'Message all parties...'
                                        : 'Private message to admin...'
                            }
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            disabled={sending || !inputText.trim() || (isMuted && muteRemaining > 0)}
                            onClick={handleSend}
                            className="px-3 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 disabled:opacity-40 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
