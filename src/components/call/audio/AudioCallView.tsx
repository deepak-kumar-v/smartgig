'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, Mic, MicOff,
    X, Loader2, AlertCircle
} from 'lucide-react';
import { CallState, ConnectionMode } from '@/hooks/use-call';

interface AudioCallViewProps {
    isOpen: boolean;
    callState: CallState;
    isMuted: boolean;
    error: string | null;
    incomingCallFrom: string | null;
    otherParticipantName: string;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
    onToggleMute: () => void;
    connectionMode: ConnectionMode;
    callDuration: number;
}

export function AudioCallView({
    isOpen,
    callState,
    isMuted,
    error,
    incomingCallFrom,
    otherParticipantName,
    onAccept,
    onReject,
    onEnd,
    onToggleMute,
    connectionMode,
    callDuration
}: AudioCallViewProps) {
    if (!isOpen) return null;

    const isConnected = callState === 'connected';
    const isConnecting = callState === 'calling' || callState === 'connecting';
    const isRinging = callState === 'ringing';
    const hasError = callState === 'error';

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div>
                            <p className="text-white font-medium">{otherParticipantName}</p>
                            <p className="text-zinc-400 text-sm">
                                {isRinging && 'Incoming Audio Call'}
                                {isConnecting && 'Connecting...'}
                                {isConnected && (
                                    <span className="flex items-center gap-2">
                                        <span className="text-indigo-400">Audio Call</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                        <span className="text-zinc-300 font-mono">{formatDuration(callDuration)}</span>
                                    </span>
                                )}
                                {hasError && 'Call failed'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Connection Mode Badge */}
                        {isConnected && connectionMode !== 'UNKNOWN' && (
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${connectionMode === 'TURN'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                {connectionMode === 'TURN' ? 'Relayed' : 'Direct'}
                            </div>
                        )}
                        <button
                            onClick={onEnd}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Main Area - Avatar Only */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-900">
                    {isRinging ? (
                        <div className="text-center">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-6"
                            >
                                {otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                            </motion.div>
                            <p className="text-white text-xl mb-2">{otherParticipantName}</p>
                            <p className="text-zinc-400">Incoming Audio Call</p>
                        </div>
                    ) : isConnecting ? (
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                            <p className="text-zinc-400">Connecting...</p>
                        </div>
                    ) : hasError ? (
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-400">{error || 'Call failed'}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            {/* Large Avatar for Audio Call */}
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-5xl font-bold text-white mx-auto mb-6 shadow-2xl border-4 border-zinc-800">
                                {otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                            </div>
                            <p className="text-zinc-400 text-lg animate-pulse">
                                Audio call in progress
                            </p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-4">
                        {isRinging ? (
                            <>
                                {/* Incoming Call Controls */}
                                <button
                                    onClick={onReject}
                                    className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                                >
                                    <PhoneOff className="w-6 h-6 text-white" />
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="p-4 bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors"
                                >
                                    <Phone className="w-6 h-6 text-white" />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Active Call Controls */}
                                <button
                                    onClick={onToggleMute}
                                    className={`p-4 rounded-full transition-colors ${isMuted
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </button>

                                <button
                                    onClick={onEnd}
                                    className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                                >
                                    <PhoneOff className="w-6 h-6 text-white" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
