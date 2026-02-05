'use client';

import React, { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Wifi, Video } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { AccessDeniedState } from '@/components/ui/access-denied-state';
import { NotFoundState } from '@/components/ui/not-found-state';
import { validateRoomAccess, joinVideoRoom, leaveVideoRoom, type VideoRoom } from '@/lib/video-service';

type AccessState = 'loading' | 'valid' | 'not_found' | 'access_denied' | 'not_authenticated' | 'not_active';

export default function VideoCallPage({ params }: { params: Promise<{ roomId: string }> }) {
    const [accessState, setAccessState] = useState<AccessState>('loading');
    const [room, setRoom] = useState<VideoRoom | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [jitsiLoading, setJitsiLoading] = useState(true);
    const [api, setApi] = useState<any>(null);
    const router = useRouter();
    const { roomId } = React.use(params);

    // Mock User - in real app would come from session
    const mockUserId = 'user-1';
    const mockUserRole = 'CLIENT' as const;
    const user = {
        id: mockUserId,
        name: 'SmartGIG User',
        email: 'user@smartgig.com',
        role: mockUserRole,
    };

    // Validate room access on mount
    useEffect(() => {
        async function checkAccess() {
            setAccessState('loading');

            const validation = await validateRoomAccess({
                roomId,
                userId: user.id,
            });

            if (validation.isValid && validation.room) {
                setRoom(validation.room);
                setAccessState('valid');

                // Log join event
                await joinVideoRoom({
                    roomId,
                    userId: user.id,
                    userRole: user.role,
                });
            } else {
                setErrorMessage(validation.message || 'Access denied');

                switch (validation.error) {
                    case 'NOT_FOUND':
                        setAccessState('not_found');
                        break;
                    case 'NOT_AUTHENTICATED':
                        setAccessState('not_authenticated');
                        break;
                    case 'NOT_ACTIVE':
                        setAccessState('not_active');
                        break;
                    default:
                        setAccessState('access_denied');
                }
            }
        }

        checkAccess();
    }, [roomId, user.id, user.role]);

    // Handle leaving the call
    const handleReadyToClose = async () => {
        await leaveVideoRoom({
            roomId,
            userId: user.id,
            userRole: user.role,
        });
        router.back();
    };

    // Loading state
    if (accessState === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/40" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 animate-spin border-t-indigo-500" />
                    <p className="text-white/60 text-sm">Validating access...</p>
                </div>
            </div>
        );
    }

    // Room not found
    if (accessState === 'not_found') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/40" />
                <div className="relative z-10">
                    <NotFoundState
                        title="Room Not Found"
                        message="This video room does not exist or has expired."
                        backHref="/messages"
                    />
                </div>
            </div>
        );
    }

    // Access denied states
    if (accessState === 'access_denied' || accessState === 'not_authenticated' || accessState === 'not_active') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/40" />
                <div className="relative z-10">
                    <AccessDeniedState
                        title="Call Not Authorized"
                        message={errorMessage || "You don't have permission to join this video call."}
                        backHref="/messages"
                        showLogin={accessState === 'not_authenticated'}
                        showHome={true}
                    />
                </div>
            </div>
        );
    }

    // Valid access - show Jitsi
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden" data-testid="video-room-container">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/40" />

            {/* Top Bar with Security Badge */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/80 border border-white/10">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium tracking-wide">E2E ENCRYPTED • SECURE ESCROW CALL</span>
                </div>
                <div className="flex items-center gap-4">
                    {room?.contractId && (
                        <span className="text-white/40 text-xs">
                            Contract: {room.contractId}
                        </span>
                    )}
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                        <Wifi className="w-4 h-4" />
                        <span>High Quality</span>
                    </div>
                </div>
            </div>

            {/* Jitsi Container */}
            <div className="w-full h-screen relative z-10 flex flex-col">
                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={`SmartGIG-${roomId}`}
                    configOverwrite={{
                        startWithAudioMuted: true,
                        disableModeratorIndicator: true,
                        startScreenSharing: true,
                        enableEmailInStats: false,
                        prejoinPageEnabled: false,
                        toolbarButtons: [
                            'camera',
                            'chat',
                            'closedcaptions',
                            'desktop',
                            'dock-iframe',
                            'embedmeeting',
                            'etherpad',
                            'feedback',
                            'filmstrip',
                            'fullscreen',
                            'hangup',
                            'help',
                            'microphone',
                            'noisesuppression',
                            'participants-pane',
                            'profile',
                            'raisehand',
                            'recording',
                            'livestreaming',
                            'security',
                            'select-background',
                            'settings',
                            'shareaudio',
                            'sharedvideo',
                            'shortcuts',
                            'stats',
                            'tileview',
                            'toggle-camera',
                            'videoquality',
                            'whiteboard',
                        ],
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        TOOLBAR_ALWAYS_VISIBLE: true,
                        DEFAULT_BACKGROUND: '#000000',
                        DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
                    }}
                    userInfo={{
                        displayName: user.name,
                        email: user.email
                    }}
                    onApiReady={(externalApi) => {
                        setApi(externalApi);
                        setJitsiLoading(false);
                    }}
                    onReadyToClose={handleReadyToClose}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                        iframeRef.style.background = 'transparent';
                    }}
                />
            </div>

            {/* Loading Overlay */}
            {jitsiLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 animate-spin border-t-indigo-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                        <h2 className="text-xl font-display font-medium text-white">Connecting Securely...</h2>
                        <p className="text-white/40 text-sm">Establishing peer-to-peer connection</p>
                    </div>
                </div>
            )}
        </div>
    );
}
