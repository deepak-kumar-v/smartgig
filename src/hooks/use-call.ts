'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/providers/socket-provider';

// Explicit Call Type
export type CallType = 'video' | 'audio';

// Explicit Call Phases as requested
export type CallPhase = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'error';
export type CallState = CallPhase; // Alias for backward compatibility since CallState was already used

export type ConnectionMode = 'STUN' | 'TURN' | 'UNKNOWN';

interface UseCallOptions {
    conversationId?: string;
}

interface UseCallReturn {
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (conversationId: string, type?: CallType) => Promise<void>;
    startAudioCall: (conversationId: string) => Promise<void>;
    startVideoCall: (conversationId: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;
    incomingCallFrom: string | null;
    activeConversationId: string | null;
    connectionMode: ConnectionMode;
    callType: CallType;
    callDuration: number;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export function useCall(options?: UseCallOptions): UseCallReturn {
    const { socket, isConnected } = useSocket();

    const [callState, setCallState] = useState<CallState>('idle');
    const [callType, setCallType] = useState<CallType>('video'); // Default to video for safety
    const [callDuration, setCallDuration] = useState(0);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [connectionMode, setConnectionMode] = useState<ConnectionMode>('UNKNOWN');
    const [iceServers, setIceServers] = useState<RTCIceServer[]>(DEFAULT_ICE_SERVERS);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const callStartedAtRef = useRef<number | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    // Sync refs with state
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    useEffect(() => {
        remoteStreamRef.current = remoteStream;
    }, [remoteStream]);

    // Timer Logic
    useEffect(() => {
        if (callState === 'connected') {
            if (!callStartedAtRef.current) {
                callStartedAtRef.current = Date.now();
            }
            // Clear any existing interval
            if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);

            callDurationIntervalRef.current = setInterval(() => {
                if (callStartedAtRef.current) {
                    const durationInSeconds = Math.floor((Date.now() - callStartedAtRef.current) / 1000);
                    setCallDuration(durationInSeconds);
                }
            }, 1000);
        } else {
            // Stop timer if not connected
            if (callDurationIntervalRef.current) {
                clearInterval(callDurationIntervalRef.current);
                callDurationIntervalRef.current = null;
            }
            if (callState === 'idle') {
                setCallDuration(0);
                callStartedAtRef.current = null;
            }
        }

        return () => {
            if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
        };
    }, [callState]);

    // cleanup stats interval
    useEffect(() => {
        return () => {
            if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        };
    }, []);

    // Cleanup function to stop all media and close connection
    const cleanup = useCallback(() => {
        console.log('[useCall] Cleaning up...');

        // Stop local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[useCall] Stopped local track:', track.kind);
            });
            setLocalStream(null);
        }

        // Stop remote stream tracks
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            console.log('[useCall] Closing peer connection');
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }

        pendingCandidatesRef.current = [];
        setIncomingCallFrom(null);
        setConnectionMode('UNKNOWN');

        // Reset call type to default safely, though usually set on start
        setCallType('video');
    }, []);

    // Defensive Guard: Check for video tracks in audio mode
    useEffect(() => {
        if (callType === 'audio' && localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                console.error('[CRITICAL] Video track detected in AUDIO call! Stopping immediately.');
                videoTracks.forEach(t => t.stop());
            }
        }
    }, [callType, localStream]);


    // Get user media with strict constraints based on callType
    const getLocalMedia = useCallback(async (type: CallType = 'video'): Promise<MediaStream> => {
        try {
            console.log(`[useCall] Requesting media for ${type} call`);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video', // Strict: false for audio calls
                audio: true
            });
            setLocalStream(stream);
            setError(null);
            return stream;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to access camera/microphone';
            console.error('[useCall] Media access error:', err);
            setError(message);
            setCallState('error');
            throw err;
        }
    }, []);

    // Fetch TURN servers on mount
    useEffect(() => {
        const fetchIceServers = async () => {
            try {
                const res = await fetch('/api/webrtc/turn');
                if (res.ok) {
                    const data = await res.json();
                    if (data.iceServers) {
                        setIceServers((prev) => [...prev, ...data.iceServers]);
                    }
                }
            } catch (error) {
                console.error('[useCall] Failed to fetch TURN servers:', error);
            }
        };

        fetchIceServers();
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((conversationId: string) => {
        const pc = new RTCPeerConnection({ iceServers });

        // Create a MediaStream to collect remote tracks
        // This is more reliable than relying on event.streams[0]
        const remoteMediaStream = new MediaStream();

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (socket) {
                    socket.emit('call:ice-candidate', {
                        conversationId,
                        candidate: event.candidate.toJSON()
                    });
                }
            }
        };

        // Handle remote stream - FIX: Use event.track directly
        pc.ontrack = (event) => {
            console.log('[useCall] Received remote track:', event.track.kind, 'readyState:', event.track.readyState);

            // Add the track to our MediaStream
            remoteMediaStream.addTrack(event.track);

            // Update the remote stream state
            // We create a new reference to trigger React state update
            setRemoteStream(new MediaStream(remoteMediaStream.getTracks()));

            console.log('[useCall] Remote stream now has tracks:',
                'audio:', remoteMediaStream.getAudioTracks().length,
                'video:', remoteMediaStream.getVideoTracks().length
            );
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('[WEBRTC] connectionState:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallState('connected');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setError('Connection lost');
                setCallState('ended');
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, iceServers]);

    // Start a call (caller side)
    const startCall = useCallback(async (conversationId: string, type: CallType = 'video') => {
        if (!socket || !isConnected) {
            setError('Not connected to server');
            return;
        }

        setActiveConversationId(conversationId);
        setCallState('connecting'); // Unified 'calling' into 'connecting' phase
        setCallType(type); // Set strict type
        setError(null);

        try {
            // Get local media FIRST (caller sees their video immediately)
            // Strict usage: Pass type to getLocalMedia
            const stream = await getLocalMedia(type);

            // Notify server to start call with TYPE
            // Fix: Send callMeta structure as required by prompt contract
            const callMeta = {
                provider: 'SMARTGIG',
                callType: type
            };

            socket.emit('call:start', {
                conversationId,
                callMeta, // Primary source of truth
                type // Keep for backward compatibility if needed
            });

            // Create peer connection and add tracks
            const pc = createPeerConnection(conversationId);
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

        } catch (err) {
            console.error('[useCall] Failed to start call:', err);
            cleanup();
            setCallState('error');
        }
    }, [socket, isConnected, getLocalMedia, createPeerConnection, cleanup]);

    // Explicit Helpers
    const startAudioCall = useCallback(async (conversationId: string) => {
        return startCall(conversationId, 'audio');
    }, [startCall]);

    const startVideoCall = useCallback(async (conversationId: string) => {
        return startCall(conversationId, 'video');
    }, [startCall]);

    // Accept incoming call (callee side)
    const acceptCall = useCallback(async () => {
        if (!socket || !activeConversationId) return;

        // PHASE 1: TRANSITION TO CONNECTING
        setCallState('connecting');

        try {
            // PHASE 2: ACQUIRE MEDIA (STRICT CALL TYPE ENFORCEMENT)
            // CRITICAL: This is the FIRST time media is requested for Callee
            console.log(`[useCall] accepting call with type: ${callType}`);

            // Hard Guard: Ensure audio calls NEVER get video
            const stream = await getLocalMedia(callType);

            // PHASE 3: SIGNALING & WEBRTC
            // Create peer connection
            const pc = createPeerConnection(activeConversationId);
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Notify server
            socket.emit('call:accept', { conversationId: activeConversationId });

            // Note: CallState will transition to 'connected' via peer connection state change

        } catch (err) {
            console.error('[useCall] Failed to accept call:', err);
            cleanup();
            setCallState('error');
        }
    }, [socket, activeConversationId, getLocalMedia, createPeerConnection, cleanup, callType]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        if (!socket || !activeConversationId) return;

        socket.emit('call:reject', { conversationId: activeConversationId });
        cleanup();
        setCallState('idle');
        setActiveConversationId(null);
    }, [socket, activeConversationId, cleanup]);

    // End call
    const endCall = useCallback(() => {
        if (socket && activeConversationId) {
            socket.emit('call:end', { conversationId: activeConversationId });
        }

        cleanup();
        setCallState('ended');
        setActiveConversationId(null);

        // Reset to idle after a brief moment
        setTimeout(() => setCallState('idle'), 100);
    }, [socket, activeConversationId, cleanup]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    // Toggle camera (Strict Guard)
    const toggleCamera = useCallback(() => {
        // Prevent toggling camera in audio mode
        if (callType === 'audio') {
            console.warn('[useCall] Cannot toggle camera in audio call');
            return;
        }

        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    }, [localStream, callType]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Incoming call
        // Fix: Use 'any' for data temporarily to safely access callMeta
        const handleIncomingCall = (data: { conversationId: string; callerId: string; type?: CallType; callMeta?: any }) => {
            console.log('[useCall] Incoming call raw data:', JSON.stringify(data));
            setActiveConversationId(data.conversationId);
            setIncomingCallFrom(data.callerId);

            // PRIORITY: Check callMeta.callType first (Strict Contract)
            let incomingType: CallType | undefined;

            if (data.callMeta && (data.callMeta.callType === 'audio' || data.callMeta.callType === 'video')) {
                incomingType = data.callMeta.callType;
            }
            // FALLBACK: Check top-level type
            else if (data.type === 'audio' || data.type === 'video') {
                incomingType = data.type;
            }

            if (incomingType) {
                console.log(`[useCall] Resolved incoming call type: ${incomingType}`);
                setCallType(incomingType);
            } else {
                // Critical Warning: If we don't know the type, we risk video leakage. 
                // However, defaulting to 'video' is safer than breaking, but we must warn loudly.
                console.warn('[useCall] Incoming call MISSING Valid Type! Defaulting to video (Potentially unsafe for audio calls)');
                setCallType('video');
            }

            setCallState('ringing');

            // CRITICAL VERIFICATION:
            // Ensure NO media is requested here.
            // Ensure NO video elements are rendered (handled by UI).
            // Ensure callType is set correctly.
        };

        // Call started confirmation (caller)
        const handleCallStarted = async (data: { conversationId: string }) => {
            console.log('[useCall] Call started, waiting for callee');
        };

        // Call accepted (caller receives this)
        const handleCallAccepted = async (data: { conversationId: string; acceptedBy: string }) => {
            console.log('[useCall] Call accepted by:', data.acceptedBy);
            setCallState('connecting');

            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                // Create and send offer
                console.log('[WEBRTC] Creating offer');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                console.log('[WEBRTC] Sending offer');
                socket.emit('call:offer', {
                    conversationId: data.conversationId,
                    offer: pc.localDescription
                });
            } catch (err) {
                console.error('[useCall] Failed to create offer:', err);
            }
        };

        // Receive SDP offer (callee)
        const handleOffer = async (data: { conversationId: string; offer: RTCSessionDescriptionInit }) => {
            console.log('[WEBRTC] Received offer');
            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

                // Apply any queued ICE candidates now that remoteDescription is set
                console.log('[useCall] Applying', pendingCandidatesRef.current.length, 'queued ICE candidates');
                for (const candidate of pendingCandidatesRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];

                console.log('[WEBRTC] Creating answer');
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                console.log('[WEBRTC] Sending answer');
                socket.emit('call:answer', {
                    conversationId: data.conversationId,
                    answer: pc.localDescription
                });
            } catch (err) {
                console.error('[useCall] Failed to handle offer:', err);
            }
        };

        // Receive SDP answer (caller)
        const handleAnswer = async (data: { conversationId: string; answer: RTCSessionDescriptionInit }) => {
            console.log('[WEBRTC] Received answer');
            const pc = peerConnectionRef.current;
            if (!pc) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

                // Apply any queued ICE candidates now that remoteDescription is set
                console.log('[useCall] Applying', pendingCandidatesRef.current.length, 'queued ICE candidates');
                for (const candidate of pendingCandidatesRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];
            } catch (err) {
                console.error('[useCall] Failed to set remote description:', err);
            }
        };

        // Receive ICE candidate
        const handleIceCandidate = async (data: { conversationId: string; candidate: RTCIceCandidateInit }) => {
            // console.log('[WEBRTC] Remote ICE candidate received');
            const pc = peerConnectionRef.current;

            if (!pc || !pc.remoteDescription) {
                // Queue candidate if remote description not set yet
                // console.log('[useCall] Queuing ICE candidate (no remoteDescription yet)');
                pendingCandidatesRef.current.push(data.candidate);
                return;
            }

            try {
                // console.log('[useCall] Applying ICE candidate immediately');
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
                console.error('[useCall] Failed to add ICE candidate:', err);
            }
        };

        // Call rejected
        const handleCallRejected = (data: { conversationId: string }) => {
            console.log('[useCall] Call rejected');
            cleanup();
            setCallState('ended');
            setActiveConversationId(null);
        };

        // Call ended
        const handleCallEnded = (data: { conversationId: string; endedBy: string; reason?: string }) => {
            console.log('[useCall] Call ended by:', data.endedBy, data.reason || '');
            cleanup();
            setCallState('ended');
            setActiveConversationId(null);

            setTimeout(() => setCallState('idle'), 100);
        };

        // Call busy (another call in progress)
        const handleCallBusy = (data: { conversationId: string; message: string }) => {
            console.log('[useCall] Call busy:', data.message);
            cleanup();
            setError(data.message);
            setCallState('error');
        };

        socket.on('call:incoming', handleIncomingCall);
        socket.on('call:started', handleCallStarted);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:ice-candidate', handleIceCandidate);
        socket.on('call:rejected', handleCallRejected);
        socket.on('call:ended', handleCallEnded);
        socket.on('call:busy', handleCallBusy);

        return () => {
            socket.off('call:incoming', handleIncomingCall);
            socket.off('call:started', handleCallStarted);
            socket.off('call:accepted', handleCallAccepted);
            socket.off('call:offer', handleOffer);
            socket.off('call:answer', handleAnswer);
            socket.off('call:ice-candidate', handleIceCandidate);
            socket.off('call:rejected', handleCallRejected);
            socket.off('call:ended', handleCallEnded);
            socket.off('call:busy', handleCallBusy);
        };
    }, [socket, cleanup]);

    // Handle socket disconnect - clean up call
    useEffect(() => {
        if (!isConnected && callState !== 'idle' && callState !== 'ended') {
            console.log('[useCall] Socket disconnected during call, cleaning up');
            cleanup();
            setCallState('ended');
            setActiveConversationId(null);
            setError('Connection lost');
        }
    }, [isConnected, callState, cleanup]);

    // Monitor connection stats when connected
    useEffect(() => {
        if (callState === 'connected' && peerConnectionRef.current) {
            const checkStats = async () => {
                if (!peerConnectionRef.current) return;
                try {
                    const stats = await peerConnectionRef.current.getStats();
                    let localCandidateId: string | null = null;
                    let candidateType: string | null = null;

                    // Simplified stats checking...
                    stats.forEach(report => {
                        if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.selected) {
                            localCandidateId = report.localCandidateId;
                        }
                    });

                    if (localCandidateId) {
                        const localCandidate = stats.get(localCandidateId);
                        if (localCandidate) {
                            candidateType = localCandidate.candidateType;
                        }
                    }

                    if (candidateType) {
                        // relay = TURN, host/srflx/prflx = STUN/Direct
                        const mode = candidateType === 'relay' ? 'TURN' : 'STUN';
                        setConnectionMode(mode);
                    }
                } catch (e) {
                    console.error('[useCall] Stats error:', e);
                }
            };

            // Check immediately and then interval
            checkStats();
            statsIntervalRef.current = setInterval(checkStats, 2000);
        }

        return () => {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
                statsIntervalRef.current = null;
            }
        };
    }, [callState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        callState,
        localStream,
        remoteStream,
        startCall,
        startAudioCall,
        startVideoCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        isMuted,
        isCameraOff,
        error,
        incomingCallFrom,
        activeConversationId,
        connectionMode,
        callType,
        callDuration
    };
}
