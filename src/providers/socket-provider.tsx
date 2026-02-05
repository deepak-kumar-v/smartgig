'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    const connectionAttempted = useRef(false);

    useEffect(() => {
        // Don't connect if not authenticated or already attempted
        if (status !== 'authenticated' || !session?.user?.id) {
            return;
        }

        // Only attempt connection once per session
        if (connectionAttempted.current) {
            return;
        }
        connectionAttempted.current = true;

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
            // Silently handle connection errors - this is expected when socket server isn't running
            // Only log in development and suppress "timeout" errors as they're expected
            if (error.message !== 'timeout' && process.env.NODE_ENV === 'development') {
                console.debug('[Socket] Connection unavailable - using HTTP fallback');
            }
            setIsConnected(false);

            // Disconnect after failed attempts to prevent constant retry spam
            socketInstance.disconnect();
        });

        socketInstance.on('error', (data: { message: string }) => {
            console.error('[Socket] Server error:', data.message);
            // setSocketError(data.message); // Ideally we'd expose this to UI, but for now console is better than silent
            // Disconnect on critical errors
            if (data.message === 'Unauthorized') {
                setIsConnected(false);
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
            connectionAttempted.current = false;
        };
    }, [session?.user?.id, session?.user?.role, status]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
