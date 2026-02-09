'use client';

import React from 'react';
import { CallState, ConnectionMode, CallType } from '@/hooks/use-call';
import { AudioCallView } from './audio/AudioCallView';
import { VideoCallView } from './video/VideoCallView';

interface CallModalProps {
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
    callType: CallType;
    callDuration: number;
}

export function CallModal(props: CallModalProps) {
    const { callType } = props;

    // Strict Dispatcher
    if (callType === 'audio') {
        return <AudioCallView {...props} />;
    }

    // Default to Video View for conservation or 'video' type
    return <VideoCallView {...props} />;
}
