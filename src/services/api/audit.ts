
import { AuditLog } from "@prisma/client";

export const auditApi = {
    getLogs: async (): Promise<AuditLog[]> => {
        const res = await fetch('/api/audit-logs');
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        return res.json();
    },

    logAction: async (action: string, details: any, entityId?: string, entityType?: string): Promise<AuditLog> => {
        const res = await fetch('/api/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, details, entityId, entityType }),
        });
        if (!res.ok) throw new Error('Failed to create audit log');
        return res.json();
    }
};
