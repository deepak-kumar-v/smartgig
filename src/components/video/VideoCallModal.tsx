'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
    X, User, Loader2, AlertCircle
} from 'lucide-react';
import { CallState, ConnectionMode } from '@/hooks/use-call';

interface VideoCallModalProps {
    isOpen: boolean;
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;
    incomingCallFrom: string | null;
    otherParticipantName: string;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    connectionMode: ConnectionMode;
}

export function VideoCallModal({
    isOpen,
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    error,
    incomingCallFrom,
    otherParticipantName,
    onAccept,
    onReject,
    onEnd,
    onToggleMute,
    onToggleCamera,
    connectionMode
}: VideoCallModalProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!isOpen) return null;

    const isConnected = callState === 'connected';
    const isConnecting = callState === 'calling' || callState === 'connecting';
    const isRinging = callState === 'ringing';
    const hasError = callState === 'error';

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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div>
                            <p className="text-white font-medium">{otherParticipantName}</p>
                            <p className="text-zinc-400 text-sm">
                                {isRinging && 'Incoming call...'}
                                {isConnecting && 'Connecting...'}
                                {isConnected && 'Connected'}
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
                                {connectionMode === 'TURN' ? 'Relayed (TURN)' : 'Direct (STUN)'}
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

                {/* Main Video Area */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Remote Video (Full Screen) */}
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            {isRinging ? (
                                <div className="text-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-6"
                                    >
                                        {otherParticipantName.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                    </motion.div>
                                    <p className="text-white text-xl mb-2">{otherParticipantName}</p>
                                    <p className="text-zinc-400">wants to video call</p>
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
                                    <User className="w-24 h-24 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500">Waiting for video...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) */}
                    {localStream && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute bottom-24 right-4 w-40 h-56 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {isCameraOff && (
                                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                    <VideoOff className="w-8 h-8 text-zinc-600" />
                                </div>
                            )}
                            {isMuted && (
                                <div className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </motion.div>
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
                                    onClick={onToggleCamera}
                                    className={`p-4 rounded-full transition-colors ${isCameraOff
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
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
