'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/providers/socket-provider';
import { useGlobalRefresh } from '@/providers/global-refresh-provider';

/**
 * Listens for the global `app:data-updated` socket event and triggers:
 * 1. triggerRefresh() — increments refreshVersion for client components
 * 2. router.refresh() — re-renders server components
 *
 * Debounce window: 200 ms — if multiple events arrive in quick succession,
 * the UI refreshes only once after the burst settles.
 */
export function useGlobalSync(): void {
    const { socket } = useSocket();
    const router = useRouter();
    const { triggerRefresh } = useGlobalRefresh();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handler = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                triggerRefresh();
                router.refresh();
                router.replace(window.location.pathname);
            }, 200);
        };

        socket.on('app:data-updated', handler);

        return () => {
            socket.off('app:data-updated', handler);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [socket, router, triggerRefresh]);
}
