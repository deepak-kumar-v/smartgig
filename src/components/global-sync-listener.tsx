'use client';

import { useGlobalSync } from '@/hooks/use-global-sync';

/**
 * Invisible component that activates the global UI synchronization listener.
 * Mount once inside `<SocketProvider>` so it has access to the socket context.
 */
export function GlobalSyncListener() {
    useGlobalSync();
    return null;
}
