'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

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
}

export function SocketProvider({ children }: SocketProviderProps) {
    const { data: session, status } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Don't connect until session is fully hydrated
        if (status !== 'authenticated' || !session?.user?.id) {
            return;
        }

        // Initialize socket connection with graceful fallback
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const socketInstance = io(socketUrl, {
            path: '/socket.io',
            auth: {
                userId: session.user.id,
                userRole: session.user.role
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true
        });

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            // Silently handle – expected when socket server isn't running
            if (error.message !== 'timeout' && process.env.NODE_ENV === 'development') {
                console.debug('[Socket] Connection unavailable - using HTTP fallback');
            }
            setIsConnected(false);
            // Let the built-in reconnection logic handle retries (up to 5 attempts)
            // Do NOT call socketInstance.disconnect() here
        });

        socketInstance.on('error', (data: { message: string }) => {
            console.error('[Socket] Server error:', data.message);
            if (data.message === 'Unauthorized') {
                setIsConnected(false);
                socketInstance.disconnect();
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [session?.user?.id, session?.user?.role, status]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
