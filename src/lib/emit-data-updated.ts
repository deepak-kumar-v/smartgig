/**
 * Global UI Synchronization — Server-Side Emitter
 *
 * Fire-and-forget helper that broadcasts `app:data-updated` to ALL connected
 * Socket.IO clients.  The client-side listener debounces the incoming events
 * and calls `router.refresh()` so every active browser session picks up new
 * data without a manual page reload.
 *
 * IMPORTANT:
 *   • Call this ONLY after the database mutation AND revalidatePath succeed.
 *   • Never call before a transaction commits.
 *   • This function is intentionally non-blocking — socket unavailability
 *     (e.g. during tests or edge deploys) is silently tolerated.
 */
export function emitDataUpdated(): void {
    try {
        const io = (globalThis as any).__socketIO;
        if (io) {
            io.emit('app:data-updated');
            console.log('[emitDataUpdated] ✅ Broadcasted app:data-updated to all clients');
        } else {
            console.warn('[emitDataUpdated] ⚠️ globalThis.__socketIO is not set — socket server may not be running in this process');
        }
    } catch (err) {
        console.error('[emitDataUpdated] ❌ Error emitting:', err);
    }
}
