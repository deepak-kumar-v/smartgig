/**
 * Scoped Real-Time Update Emitter
 *
 * Emits a targeted socket event AND the generic fallback event for
 * backward compatibility. This allows future optimizations where
 * components only listen to relevant scoped events.
 *
 * Supported scoped events:
 *   wallet:updated
 *   contract:updated
 *   dispute:updated
 *   job:updated
 *   notification:created
 *
 * Usage:
 *   emitScopedUpdate('wallet:updated');
 *   emitScopedUpdate('notification:created', { message: 'New proposal' });
 */

export function emitScopedUpdate(event: string, payload?: Record<string, unknown>): void {
    try {
        const io = (globalThis as any).__socketIO;
        if (!io) {
            console.warn('[emitScopedUpdate] No socket.io instance available');
            return;
        }

        // Emit scoped event (with optional payload)
        if (payload) {
            io.emit(event, payload);
        } else {
            io.emit(event);
        }

        // Fallback: always emit the generic event for backward compatibility
        io.emit('app:data-updated');

        console.log(`[emitScopedUpdate] ✅ Emitted ${event} + app:data-updated`);
    } catch (error) {
        console.error('[emitScopedUpdate] Failed:', error);
    }
}
