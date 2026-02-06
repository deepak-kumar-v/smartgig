'use client';

import React from 'react';
import { FileIcon, X } from 'lucide-react';

interface AttachmentMeta {
    name: string;
    size: number;
    type: string;
    url: string;
}

interface ChatAttachmentCardProps {
    attachment: AttachmentMeta;
    onRemove?: () => void;
    isDraft?: boolean;
}

export function ChatAttachmentCard({ attachment, onRemove, isDraft = false }: ChatAttachmentCardProps) {
    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Safe Resolve: Persisted DB uses 'fileType', Draft uses 'type'
    // Also guard against missing size
    const mimeType = (attachment as any).fileType || attachment.type || 'application/octet-stream';
    const extension = mimeType.split('/')[1] || 'FILE';

    return (
        <div className={`relative flex items-center gap-3 p-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 group ${isDraft ? 'hover:bg-zinc-800' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <FileIcon className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="flex-1 min-w-0">
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-zinc-200 hover:text-indigo-400 truncate block transition-colors"
                >
                    {attachment.name}
                </a>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-700/30 px-1.5 py-0.5 rounded">
                        {extension}
                    </span>
                    <span className="text-xs text-zinc-500">
                        {formatSize(attachment.size)}
                    </span>
                </div>
            </div>

            {isDraft && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
