'use client';

import React from 'react';
import { Phone, Video, ExternalLink, Sparkles, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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
    const isSmartGig = callMeta.provider === 'smartgig_custom' || callMeta.provider === 'SmartGig';
    const isGoogleMeet = callMeta.provider === 'google_meet' || callMeta.provider === 'Google Meet';

    const handleJoinCall = () => {
        window.open(callMeta.meetingUrl, '_blank', 'noopener,noreferrer');
    };

    // Provider display name
    const providerLabel = isGoogleMeet
        ? (isVideo ? 'Google Meet' : 'Camera off · Google Meet')
        : (isSmartGig ? 'SmartGig' : callMeta.provider);

    const tooltipText = isVideo
        ? "This is a video call."
        : "This call is intended as audio-only. Camera is off by default.";

    return (
        <div
            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all group ${isOwn
                ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 hover:from-indigo-600/40 hover:to-purple-600/30 border border-indigo-500/30'
                : 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 hover:from-emerald-600/30 hover:to-teal-600/20 border border-emerald-500/30'
                }`}
            onClick={handleJoinCall}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isVideo ? 'bg-purple-500/20' : 'bg-blue-500/20'
                }`}>
                {isVideo ? (
                    <Video className="w-6 h-6 text-purple-400" />
                ) : (
                    <Phone className="w-6 h-6 text-blue-400" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                        {isVideo ? '🎥 Video Call' : '🎧 Audio Call'}
                    </p>
                    {isSmartGig && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Beta
                        </span>
                    )}
                    {/* Audio Only Badge for Google Meet Audio */}
                    {!isVideo && isGoogleMeet && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-1 cursor-help">
                                        Audio Only
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
                                    {tooltipText}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${isGoogleMeet ? 'text-emerald-400' : 'text-indigo-400'
                        }`}>
                        {providerLabel}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400">
                        Click to join
                    </span>
                </div>
            </div>

            {/* Join Button */}
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${isOwn
                    ? 'bg-indigo-500/30 text-indigo-300 group-hover:bg-indigo-500/50'
                    : 'bg-emerald-500/30 text-emerald-300 group-hover:bg-emerald-500/50'
                    }`}>
                    Join
                </span>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
        </div >
    );
}
