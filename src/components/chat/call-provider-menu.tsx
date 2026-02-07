'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, ExternalLink, ChevronDown, Sparkles } from 'lucide-react';

type CallIntent = 'audio' | 'video';
type CallProvider = 'google_meet' | 'smartgig_custom';

interface CallProviderOption {
    provider: CallProvider;
    label: string;
    description: string;
    enabled: boolean;
    beta?: boolean;
}

interface CallProviderMenuProps {
    intent: CallIntent;
    onSelectProvider: (intent: CallIntent, provider: CallProvider, meetingUrl: string) => void;
}

const AUDIO_PROVIDERS: CallProviderOption[] = [
    {
        provider: 'google_meet',
        label: 'Google Meet',
        description: 'Audio call (camera off)',
        enabled: true
    },
    {
        provider: 'smartgig_custom',
        label: 'SmartGig Audio',
        description: 'Coming soon',
        enabled: false,
        beta: true
    }
];

const VIDEO_PROVIDERS: CallProviderOption[] = [
    {
        provider: 'google_meet',
        label: 'Google Meet',
        description: 'Video call in new tab',
        enabled: true
    },
    {
        provider: 'smartgig_custom',
        label: 'SmartGig Video',
        description: 'In-app video (Beta)',
        enabled: true,
        beta: true
    }
];

export function CallProviderMenu({ intent, onSelectProvider }: CallProviderMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const providers = intent === 'audio' ? AUDIO_PROVIDERS : VIDEO_PROVIDERS;
    const Icon = intent === 'audio' ? Phone : Video;
    const iconColor = intent === 'audio' ? 'text-blue-400' : 'text-purple-400';

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProviderSelect = (option: CallProviderOption) => {
        if (!option.enabled) return;

        // Generate meeting URL based on provider
        let meetingUrl: string;
        if (option.provider === 'google_meet') {
            meetingUrl = ''; // Let the parent handler generate/reuse the URL
        } else {
            // SmartGig custom - use internal route
            meetingUrl = `/call/${Date.now()}?intent=${intent}`;
        }

        onSelectProvider(intent, option.provider, meetingUrl);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger Button */}
            <button
                className={`p-2 hover:bg-zinc-800 rounded-lg group flex items-center gap-1 transition-colors ${isOpen ? 'bg-zinc-800' : ''
                    }`}
                onClick={() => setIsOpen(!isOpen)}
                title={intent === 'audio' ? 'Start audio call' : 'Start video call'}
            >
                <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform`} />
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-2 border-b border-zinc-800">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                            {intent === 'audio' ? '🎧 Audio Call' : '🎥 Video Call'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Choose a provider
                        </p>
                    </div>

                    <div className="py-1">
                        {providers.map((option) => (
                            <button
                                key={option.provider}
                                className={`w-full px-3 py-2.5 flex items-start gap-3 transition-colors ${option.enabled
                                    ? 'hover:bg-zinc-800 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                                onClick={() => handleProviderSelect(option)}
                                disabled={!option.enabled}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${option.provider === 'google_meet'
                                    ? 'bg-emerald-500/10'
                                    : 'bg-indigo-500/10'
                                    }`}>
                                    {option.provider === 'google_meet' ? (
                                        <span className="text-lg">📞</span>
                                    ) : (
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">
                                            {option.label}
                                        </span>
                                        {option.beta && (
                                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                                Beta
                                            </span>
                                        )}
                                        {!option.enabled && (
                                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {option.description}
                                    </p>
                                </div>
                                {option.enabled && (
                                    <ExternalLink className="w-4 h-4 text-zinc-600 shrink-0 mt-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
