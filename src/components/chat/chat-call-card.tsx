'use client';

import React from 'react';
import { Phone, Video, ExternalLink } from 'lucide-react';

interface CallMeta {
    mode: 'audio' | 'video';
    provider: string;
    meetingUrl: string;
}

interface ChatCallCardProps {
    callMeta: CallMeta;
    isOwn: boolean;
}

export function ChatCallCard({ callMeta, isOwn }: ChatCallCardProps) {
    const isVideo = callMeta.mode === 'video';

    const handleJoinCall = () => {
        window.open(callMeta.meetingUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isOwn
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/30'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30'
                }`}
            onClick={handleJoinCall}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isVideo ? 'bg-purple-500/20' : 'bg-blue-500/20'
                }`}>
                {isVideo ? (
                    <Video className="w-5 h-5 text-purple-400" />
                ) : (
                    <Phone className="w-5 h-5 text-blue-400" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                    {isVideo ? 'Video Call' : 'Audio Call'}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                    {callMeta.provider} • Click to join
                </p>
            </div>

            <ExternalLink className="w-4 h-4 text-zinc-400" />
        </div>
    );
}
