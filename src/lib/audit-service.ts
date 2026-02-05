/**
 * SmartGIG Audit Log Service
 * 
 * Centralized audit logging for all critical actions.
 * Now writes to database via API endpoint.
 */

export type AuditActionType =
    // Authentication
    | 'AUTH_LOGIN'
    | 'AUTH_LOGOUT'
    | 'AUTH_OAUTH_LOGIN'
    | 'AUTH_2FA_ENABLED'
    | 'AUTH_2FA_DISABLED'
    | 'AUTH_RECOVERY_CODES_GENERATED'
    | 'AUTH_PASSWORD_CHANGED'
    | 'AUTH_PASSWORD_RESET_REQUESTED'
    // Jobs
    | 'JOB_CREATED'
    | 'JOB_UPDATED'
    | 'JOB_DELETED'
    | 'JOB_PUBLISHED'
    | 'JOB_CLOSED'
    // Proposals
    | 'PROPOSAL_SUBMITTED'
    | 'PROPOSAL_WITHDRAWN'
    | 'PROPOSAL_ACCEPTED'
    | 'PROPOSAL_REJECTED'
    // Contracts
    | 'CONTRACT_CREATED'
    | 'CONTRACT_STATUS_CHANGED'
    | 'CONTRACT_COMPLETED'
    | 'CONTRACT_CANCELLED'
    // Milestones
    | 'MILESTONE_CREATED'
    | 'MILESTONE_SUBMITTED'
    | 'MILESTONE_APPROVED'
    | 'MILESTONE_REJECTED'
    | 'MILESTONE_REVISION_REQUESTED'
    // Escrow
    | 'ESCROW_DEPOSITED'
    | 'ESCROW_LOCKED'
    | 'ESCROW_RELEASED'
    | 'ESCROW_REFUNDED'
    // Disputes
    | 'DISPUTE_CREATED'
    | 'DISPUTE_EVIDENCE_UPLOADED'
    | 'DISPUTE_ADMIN_DECISION'
    | 'DISPUTE_RESOLVED'
    // Reviews
    | 'REVIEW_SUBMITTED'
    | 'REVIEW_RESPONSE_ADDED'
    // Trust & Safety
    | 'STRIKE_ISSUED'
    | 'APPEAL_SUBMITTED'
    | 'USER_BANNED'
    | 'USER_UNBANNED'
    // Video Calls
    | 'VIDEO_CALL_STARTED'
    | 'VIDEO_CALL_JOINED'
    | 'VIDEO_CALL_LEFT'
    | 'VIDEO_CALL_ENDED'
    // Services
    | 'SERVICE_CREATED'
    | 'SERVICE_UPDATED'
    | 'SERVICE_PUBLISHED'
    | 'SERVICE_DELETED'
    // Payments
    | 'PAYMENT_METHOD_ADDED'
    | 'PAYMENT_METHOD_REMOVED'
    | 'WITHDRAWAL_REQUESTED'
    | 'WITHDRAWAL_COMPLETED'
    // Invoices
    | 'INVOICE_VIEWED'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID'
    // Ledger
    | 'LEDGER_VIEWED';

export type AuditEntityType =
    | 'USER'
    | 'JOB'
    | 'PROPOSAL'
    | 'CONTRACT'
    | 'MILESTONE'
    | 'ESCROW'
    | 'DISPUTE'
    | 'REVIEW'
    | 'SERVICE'
    | 'VIDEO_CALL'
    | 'PAYMENT'
    | 'INVOICE'
    | 'LEDGER'
    | 'SYSTEM';

export type UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN' | 'SYSTEM';

export interface AuditLogEntry {
    id: string;
    actorId: string;
    actorRole: UserRole;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Central audit logging function
 * Call this for ALL critical actions
 * 
 * This function safely works in both client and server contexts.
 * For server-side components, you can use db.auditLog.create directly for better performance.
 */
export async function logAuditEvent(params: {
    actorId: string;
    actorRole: UserRole;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}): Promise<AuditLogEntry | null> {
    try {
        // Use API endpoint to log (works from both client and server)
        const response = await fetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: params.actionType,
                entityType: params.entityType,
                entityId: params.entityId,
                actorRole: params.actorRole,
                details: params.metadata || {},
                ipAddress: params.ipAddress,
                userAgent: params.userAgent
            })
        });

        if (!response.ok) {
            console.error('[AUDIT] Failed to log event:', response.statusText);
            return null;
        }

        const log = await response.json();

        // Console log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[AUDIT]', {
                action: params.actionType,
                entity: `${params.entityType}:${params.entityId}`,
                actor: `${params.actorRole}:${params.actorId}`
            });
        }

        return {
            id: log.id,
            actorId: params.actorId,
            actorRole: params.actorRole,
            actionType: params.actionType,
            entityType: params.entityType,
            entityId: params.entityId,
            timestamp: new Date(log.createdAt),
            metadata: params.metadata || {},
            ipAddress: params.ipAddress,
            userAgent: params.userAgent
        };
    } catch (error) {
        console.error('[AUDIT] Exception logging event:', error);
        return null;
    }
}

/**
 * Get audit logs with optional filters (admin only)
 * Uses API endpoint which enforces admin access
 */
export async function getAuditLogs(filters?: {
    actorId?: string;
    actionType?: AuditActionType;
    entityType?: AuditEntityType;
    entityId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ logs: any[]; total: number }> {
    try {
        const params = new URLSearchParams();
        if (filters?.actorId) params.append('actorId', filters.actorId);
        if (filters?.actionType) params.append('action', filters.actionType);
        if (filters?.entityType) params.append('entityType', filters.entityType);
        if (filters?.entityId) params.append('entityId', filters.entityId);
        if (filters?.fromDate) params.append('dateFrom', filters.fromDate.toISOString());
        if (filters?.toDate) params.append('dateTo', filters.toDate.toISOString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`/api/audit-logs?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[AUDIT] Failed to fetch logs:', error);
        return { logs: [], total: 0 };
    }
}
