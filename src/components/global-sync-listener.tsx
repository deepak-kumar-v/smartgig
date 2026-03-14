'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/providers/socket-provider';
import { useGlobalRefresh } from '@/providers/global-refresh-provider';
import { toast } from 'sonner';

/**
 * Single global listener for ALL real-time events.
 *
 * Scoped events:   wallet:updated, contract:updated, dispute:updated, job:updated
 * Notifications:   notification:created (+ toast)
 * Legacy fallback: app:data-updated
 *
 * All events trigger a debounced refresh cycle:
 *   triggerRefresh() → client components re-fetch
 *   router.refresh() → server components re-render
 *
 * Debounce: 150ms — multiple rapid events collapse into one refresh.
 *
 * NO UI component should listen to sockets directly.
 * All refresh flows through this single controller.
 */
export function GlobalSyncListener() {
    const { socket } = useSocket();
    const router = useRouter();
    const { triggerRefresh } = useGlobalRefresh();
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!socket) return;

        const SCOPED_EVENTS = [
            'wallet:updated',
            'contract:updated',
            'dispute:updated',
            'job:updated',
            'app:data-updated',
        ];

        // Debounced refresh handler — collapses rapid event bursts
        const handler = () => {
            if (refreshTimeoutRef.current) return;

            refreshTimeoutRef.current = setTimeout(() => {
                triggerRefresh();
                router.refresh();
                router.replace(window.location.pathname);
                refreshTimeoutRef.current = null;
            }, 150);
        };

        // Notification handler — refresh + toast
        const notificationHandler = (payload?: { message?: string }) => {
            handler();
            if (payload?.message) {
                toast.info(payload.message);
            }
        };

        // Subscribe
        for (const event of SCOPED_EVENTS) {
            socket.on(event, handler);
        }
        socket.on('notification:created', notificationHandler);

        return () => {
            for (const event of SCOPED_EVENTS) {
                socket.off(event, handler);
            }
            socket.off('notification:created', notificationHandler);
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [socket, router, triggerRefresh]);

    return null;
}
