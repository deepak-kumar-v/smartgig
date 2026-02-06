'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/providers/socket-provider';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'error';

interface UseCallOptions {
    conversationId?: string;
}

interface UseCallReturn {
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (conversationId: string) => Promise<void>;
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
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export function useCall(options?: UseCallOptions): UseCallReturn {
    const { socket, isConnected } = useSocket();

    const [callState, setCallState] = useState<CallState>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    // Cleanup function to stop all media and close connection
    const cleanup = useCallback(() => {
        console.log('[useCall] Cleaning up...');

        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log('[useCall] Stopped local track:', track.kind);
            });
            setLocalStream(null);
        }

        // Stop remote stream tracks
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        pendingCandidatesRef.current = [];
        setIncomingCallFrom(null);
    }, [localStream, remoteStream]);

    // Get user media
    const getLocalMedia = useCallback(async (): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            setError(null);
            return stream;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to access camera/microphone';
            setError(message);
            setCallState('error');
            throw err;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((conversationId: string) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log('[useCall] Sending ICE candidate:', event.candidate.candidate?.substring(0, 50));
                socket.emit('call:ice-candidate', {
                    conversationId,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('[useCall] Received remote track:', event.track.kind);
            setRemoteStream(event.streams[0]);
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('[useCall] Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallState('connected');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setError('Connection lost');
                setCallState('ended');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[useCall] ICE connection state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket]);

    // Start a call (caller side)
    const startCall = useCallback(async (conversationId: string) => {
        if (!socket || !isConnected) {
            setError('Not connected to server');
            return;
        }

        setActiveConversationId(conversationId);
        setCallState('calling');
        setError(null);

        try {
            // Get local media FIRST (caller sees their video immediately)
            const stream = await getLocalMedia();

            // Notify server to start call
            socket.emit('call:start', { conversationId });

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

    // Accept incoming call (callee side)
    const acceptCall = useCallback(async () => {
        if (!socket || !activeConversationId) return;

        setCallState('connecting');

        try {
            // Get local media
            const stream = await getLocalMedia();

            // Create peer connection
            const pc = createPeerConnection(activeConversationId);
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // NOTE: Do NOT add pending ICE candidates here - remoteDescription is not set yet
            // They will be applied after setRemoteDescription in handleOffer

            // Notify server
            socket.emit('call:accept', { conversationId: activeConversationId });

        } catch (err) {
            console.error('[useCall] Failed to accept call:', err);
            cleanup();
            setCallState('error');
        }
    }, [socket, activeConversationId, getLocalMedia, createPeerConnection, cleanup]);

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

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Incoming call
        const handleIncomingCall = (data: { conversationId: string; callerId: string }) => {
            console.log('[useCall] Incoming call:', data);
            setActiveConversationId(data.conversationId);
            setIncomingCallFrom(data.callerId);
            setCallState('ringing');
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
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

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
            console.log('[useCall] Received offer');
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

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

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
            console.log('[useCall] Received answer');
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
            console.log('[useCall] Received ICE candidate');
            const pc = peerConnectionRef.current;

            if (!pc || !pc.remoteDescription) {
                // Queue candidate if remote description not set yet
                console.log('[useCall] Queuing ICE candidate (no remoteDescription yet)');
                pendingCandidatesRef.current.push(data.candidate);
                return;
            }

            try {
                console.log('[useCall] Applying ICE candidate immediately');
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
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        isMuted,
        isCameraOff,
        error,
        incomingCallFrom,
        activeConversationId
    };
}
