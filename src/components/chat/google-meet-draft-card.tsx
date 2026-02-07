
import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Video, X, Check, Link as LinkIcon } from 'lucide-react';

interface GoogleMeetDraftCardProps {
    onSend: (url: string) => void;
    onCancel: () => void;
}

export function GoogleMeetDraftCard({ onSend, onCancel }: GoogleMeetDraftCardProps) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validateUrl = (input: string) => {
        if (!input) return false;
        if (!input.match(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/)) {
            return false;
        }
        return true;
    };

    const handleSend = () => {
        if (validateUrl(url)) {
            onSend(url);
        } else {
            setError('Invalid Google Meet URL. Format: https://meet.google.com/xxx-xxxx-xxx');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUrl(val);
        if (error) setError(null);
    };

    return (
        <div className="mb-4">
            <GlassCard className="p-4 border-indigo-500/30 bg-indigo-500/5">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-indigo-500/10">
                        <Video className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Google Meet</h3>
                        <p className="text-xs text-zinc-400 mb-3">Paste Google Meet link</p>

                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                value={url}
                                onChange={handleChange}
                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                className={`w-full bg-zinc-900/50 border ${error ? 'border-red-500/50' : 'border-zinc-700'} text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors`}
                            />
                        </div>
                        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}

                        <div className="flex items-center gap-2 mt-3">
                            <GlassButton
                                variant="primary"
                                size="sm"
                                onClick={handleSend}
                                disabled={!url}
                                className="gap-2"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Send Invite
                            </GlassButton>
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                className="text-zinc-400 hover:text-white"
                            >
                                Cancel
                            </GlassButton>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
