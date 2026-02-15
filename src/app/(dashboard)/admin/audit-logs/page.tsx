'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import {
    ClipboardList, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    User, Briefcase, FileText, DollarSign, Shield, Video, AlertTriangle,
    Clock, ExternalLink
} from 'lucide-react';
import { getAuditLogs, type AuditLogEntry, type AuditActionType, type AuditEntityType } from '@/lib/audit-service';
import { format } from 'date-fns';

const actionTypeColors: Record<string, string> = {
    AUTH: 'text-blue-400 bg-blue-500/10',
    JOB: 'text-emerald-400 bg-emerald-500/10',
    PROPOSAL: 'text-amber-400 bg-amber-500/10',
    CONTRACT: 'text-indigo-400 bg-indigo-500/10',
    MILESTONE: 'text-violet-400 bg-violet-500/10',
    ESCROW: 'text-cyan-400 bg-cyan-500/10',
    DISPUTE: 'text-rose-400 bg-rose-500/10',
    REVIEW: 'text-pink-400 bg-pink-500/10',
    STRIKE: 'text-red-400 bg-red-500/10',
    VIDEO: 'text-teal-400 bg-teal-500/10',
    SERVICE: 'text-orange-400 bg-orange-500/10',
    PAYMENT: 'text-green-400 bg-green-500/10',
    WITHDRAWAL: 'text-lime-400 bg-lime-500/10',
    USER: 'text-slate-400 bg-slate-500/10',
    APPEAL: 'text-yellow-400 bg-yellow-500/10',
};

const entityTypeIcons: Record<AuditEntityType, React.ElementType> = {
    USER: User,
    JOB: Briefcase,
    PROPOSAL: FileText,
    CONTRACT: FileText,
    MILESTONE: Clock,
    ESCROW: DollarSign,
    DISPUTE: AlertTriangle,
    REVIEW: FileText,
    SERVICE: Briefcase,
    VIDEO_CALL: Video,
    PAYMENT: DollarSign,
    INVOICE: FileText,
    LEDGER: DollarSign,
    SYSTEM: Shield,
};

function getActionColor(actionType: string): string {
    const prefix = actionType.split('_')[0];
    return actionTypeColors[prefix] || 'text-zinc-400 bg-zinc-500/10';
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [entityFilter, setEntityFilter] = useState<AuditEntityType | ''>('');
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    const limit = 20;

    const loadLogs = async () => {
        setLoading(true);
        const result = await getAuditLogs({
            entityType: entityFilter || undefined,
            limit,
            offset: (page - 1) * limit,
        });
        setLogs(result.logs);
        setTotal(result.total);
        setLoading(false);
    };

    useEffect(() => {
        loadLogs();
    }, [page, entityFilter]);

    const totalPages = Math.ceil(total / limit);

    const filteredLogs = searchQuery
        ? logs.filter(log =>
            log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actorId.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : logs;

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ClipboardList className="w-7 h-7 text-indigo-400" />
                            Audit Logs
                        </h1>
                        <p className="text-zinc-400">Track all critical actions across the platform</p>
                    </div>
                    <GlassButton variant="secondary" onClick={loadLogs} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </GlassButton>
                </div>

                {/* Filters */}
                <GlassCard className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <GlassInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by action, entity, or actor..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <select
                            value={entityFilter}
                            onChange={(e) => {
                                setEntityFilter(e.target.value as AuditEntityType | '');
                                setPage(1);
                            }}
                            className="bg-zinc-800/50 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">All Entities</option>
                            <option value="USER">User</option>
                            <option value="JOB">Job</option>
                            <option value="PROPOSAL">Proposal</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="MILESTONE">Milestone</option>
                            <option value="ESCROW">Escrow</option>
                            <option value="DISPUTE">Dispute</option>
                            <option value="REVIEW">Review</option>
                            <option value="SERVICE">Service</option>
                            <option value="VIDEO_CALL">Video Call</option>
                            <option value="PAYMENT">Payment</option>
                        </select>
                    </div>
                </GlassCard>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 text-center">
                        <p className="text-2xl font-bold text-white">{total}</p>
                        <p className="text-zinc-500 text-sm">Total Events</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                            {logs.filter(l => l.actionType.startsWith('AUTH')).length}
                        </p>
                        <p className="text-zinc-500 text-sm">Auth Events</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <p className="text-2xl font-bold text-rose-400">
                            {logs.filter(l => l.actionType.startsWith('DISPUTE') || l.actionType.startsWith('STRIKE')).length}
                        </p>
                        <p className="text-zinc-500 text-sm">Safety Events</p>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <p className="text-2xl font-bold text-cyan-400">
                            {logs.filter(l => l.actionType.startsWith('ESCROW') || l.actionType.startsWith('PAYMENT')).length}
                        </p>
                        <p className="text-zinc-500 text-sm">Financial Events</p>
                    </GlassCard>
                </div>

                {/* Logs Table */}
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">Timestamp</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">Action</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">Entity</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">Actor</th>
                                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-zinc-500">
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const EntityIcon = entityTypeIcons[log.entityType] || FileText;
                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() => setSelectedLog(log)}
                                                className="border-b border-zinc-800/50 hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="text-white text-sm">
                                                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                                                    </div>
                                                    <div className="text-zinc-500 text-xs">
                                                        {format(new Date(log.timestamp), 'yyyy')}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.actionType)}`}>
                                                        {log.actionType}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <EntityIcon className="w-4 h-4 text-zinc-500" />
                                                        <div>
                                                            <div className="text-white text-sm">{log.entityType}</div>
                                                            <div className="text-zinc-500 text-xs font-mono">{log.entityId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-white text-sm">{log.actorId}</div>
                                                    <div className="text-zinc-500 text-xs">{log.actorRole}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t border-zinc-800">
                        <p className="text-zinc-500 text-sm">
                            Showing {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} of {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </GlassButton>
                            <span className="text-white text-sm">
                                Page {page} of {totalPages || 1}
                            </span>
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>

                {/* Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
                        <GlassCard className="max-w-lg w-full p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Audit Log Details</h3>
                                <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-white">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Event ID</p>
                                    <p className="text-white font-mono text-sm">{selectedLog.id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Timestamp</p>
                                        <p className="text-white text-sm">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Action</p>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(selectedLog.actionType)}`}>
                                            {selectedLog.actionType}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Actor</p>
                                        <p className="text-white text-sm">{selectedLog.actorId}</p>
                                        <p className="text-zinc-500 text-xs">{selectedLog.actorRole}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Entity</p>
                                        <p className="text-white text-sm">{selectedLog.entityType}</p>
                                        <p className="text-zinc-500 text-xs font-mono">{selectedLog.entityId}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Metadata</p>
                                    <pre className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                                {(selectedLog.ipAddress || selectedLog.userAgent) && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                                        {selectedLog.ipAddress && (
                                            <div>
                                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">IP Address</p>
                                                <p className="text-white text-sm font-mono">{selectedLog.ipAddress}</p>
                                            </div>
                                        )}
                                        {selectedLog.userAgent && (
                                            <div>
                                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">User Agent</p>
                                                <p className="text-white text-sm truncate">{selectedLog.userAgent}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </>
    );
}
