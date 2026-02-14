import { db } from '@/lib/db';

// ============================================================================
// Lifecycle Event Recorder — Unified Roadmap
// ============================================================================
// This is LOGGING ONLY. It must:
//   - Never throw (try/catch wrapped)
//   - Never block the main flow (fire-and-forget)
//   - Never modify existing business logic
//   - Never interfere with contract status transitions
// ============================================================================

// Mirror the ActorRole enum from schema.prisma
type ActorRole = 'CLIENT' | 'FREELANCER' | 'SYSTEM';

interface LifecycleEventInput {
    jobId?: string;
    proposalId?: string;
    contractId?: string;
    milestoneId?: string;
    eventType: string;
    devState?: string;
    userMessage: string;
    actorId?: string;
    actorRole: ActorRole;
    metadata?: Record<string, unknown>;
    category?: 'BUSINESS' | 'SYSTEM';
}

/**
 * Records a lifecycle event to the LifecycleEvent table.
 * Fire-and-forget — never throws, never blocks.
 */
export function recordLifecycleEvent(input: LifecycleEventInput): void {
    // Fire-and-forget: do NOT await this in calling code
    (db as any).lifecycleEvent
        .create({
            data: {
                jobId: input.jobId,
                proposalId: input.proposalId,
                contractId: input.contractId,
                milestoneId: input.milestoneId,
                eventType: input.eventType,
                devState: input.devState ?? null,
                userMessage: input.userMessage,
                actorId: input.actorId,
                actorRole: input.actorRole,
                metadata: input.metadata ?? undefined,
                category: input.category ?? 'BUSINESS',
            },
        })
        .catch((err: unknown) => {
            console.error('[LifecycleEvent] Failed to record event:', err);
        });
}

