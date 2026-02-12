'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, History, FileEdit, Trash2, FileText } from 'lucide-react';

interface MessageVersion {
    id: string;
    messageId: string;
    versionNumber: number;
    content: string;
    editedAt: string;
    editedBy: string;
    changeType: 'ORIGINAL' | 'EDIT' | 'DELETE';
    contentHash: string;
    previousVersionId: string | null;
}

interface MessageVersionHistoryProps {
    messageId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MessageVersionHistory({ messageId, isOpen, onClose }: MessageVersionHistoryProps) {
    const [versions, setVersions] = useState<MessageVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lazy fetch — only when modal opens and messageId is set
    const fetchVersions = useCallback(async () => {
        if (!messageId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/messages/versions?messageId=${messageId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load history');
            }
            const data = await res.json();
            setVersions(data.versions || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load version history');
        } finally {
            setIsLoading(false);
        }
    }, [messageId]);

    useEffect(() => {
        if (isOpen && messageId) {
            fetchVersions();
        }
        if (!isOpen) {
            setVersions([]);
            setError(null);
        }
    }, [isOpen, messageId, fetchVersions]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !messageId) return null;

    const changeTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        ORIGINAL: { label: 'Original', color: 'bg-zinc-600 text-zinc-200', icon: <FileText className="w-3 h-3" /> },
        EDIT: { label: 'Edited', color: 'bg-amber-600/80 text-amber-100', icon: <FileEdit className="w-3 h-3" /> },
        DELETE: { label: 'Deleted', color: 'bg-red-600/80 text-red-100', icon: <Trash2 className="w-3 h-3" /> },
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white">Message History</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-xs text-zinc-500">Loading history…</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-red-400">{error}</p>
                            <button
                                onClick={fetchVersions}
                                className="mt-3 text-xs text-indigo-400 hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8">
                            <History className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">No version history available</p>
                            <p className="text-xs text-zinc-600 mt-1">This message has not been edited or deleted.</p>
                        </div>
                    ) : (
                        versions.map((version, index) => {
                            const config = changeTypeConfig[version.changeType] || changeTypeConfig.ORIGINAL;
                            return (
                                <div
                                    key={version.id}
                                    className={`relative p-3 rounded-xl border ${index === versions.length - 1
                                            ? 'border-indigo-500/40 bg-indigo-500/5'
                                            : 'border-zinc-800 bg-zinc-800/30'
                                        }`}
                                >
                                    {/* Version header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                v{version.versionNumber}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color}`}>
                                                {config.icon}
                                                {config.label}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-zinc-600">
                                            {new Date(version.editedAt).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Version content */}
                                    <p className={`text-sm leading-relaxed ${version.changeType === 'DELETE'
                                            ? 'text-zinc-500 italic line-through'
                                            : 'text-zinc-300'
                                        }`}>
                                        {version.content}
                                    </p>

                                    {/* Hash footer */}
                                    <p className="mt-2 text-[9px] text-zinc-700 font-mono truncate" title={version.contentHash}>
                                        SHA-256: {version.contentHash.substring(0, 16)}…
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/50">
                    <p className="text-[10px] text-zinc-600 text-center">
                        All message changes are cryptographically hashed and immutable.
                    </p>
                </div>
            </div>
        </div>
    );
}
