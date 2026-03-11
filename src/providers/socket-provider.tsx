'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false
});

export function useSocket() {
    return useContext(SocketContext);
}

interface SocketProviderProps {
    children: React.ReactNode;
    userId: string | null;
    userRole: string | null;
}

export function SocketProvider({ children, userId, userRole }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!userId) {
            return;
        }

        // Idempotent guard: prevent Strict Mode double-mount from creating duplicate sockets
        if (socketRef.current) {
            return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');

        console.log('[SOCKET] Creating socket for userId:', userId, 'role:', userRole);

        const socketInstance = io(socketUrl, {
            path: '/socket.io',
            auth: {
                userId,
                userRole
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: false // Do NOT connect during constructor — register handlers first
        });

        // Register all handlers BEFORE connecting
        socketInstance.on('connect', () => {
            console.log('[SOCKET] Connected:', {
                socketId: socketInstance.id,
                userId,
                userRole,
                pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
            });
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[SOCKET] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            if (error.message !== 'timeout' && process.env.NODE_ENV === 'development') {
                console.debug('[SOCKET] Connection unavailable - using HTTP fallback');
            }
            setIsConnected(false);
        });

        socketInstance.on('error', (data: { message: string }) => {
            console.error('[SOCKET] Server error:', data.message);
            if (data.message === 'Unauthorized') {
                setIsConnected(false);
                socketInstance.disconnect();
            }
        });

        // Commit to state
        socketRef.current = socketInstance;
        setSocket(socketInstance);

        // NOW connect — all handlers are registered, socket is in state
        socketInstance.connect();

        return () => {
            console.log('[SOCKET] Cleanup for userId:', userId);
            socketInstance.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [userId, userRole]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

