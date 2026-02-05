'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Film, Loader2 } from 'lucide-react';
import { GlassButton } from './glass-button';

interface FileUploadProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    maxFiles?: number;
    onFilesSelected?: (files: File[]) => void;
    onUpload?: (files: File[]) => Promise<void>;
    className?: string;
    disabled?: boolean;
    initialFiles?: File[];
}

interface UploadedFile {
    file: File;
    preview?: string;
    progress: number;
    error?: string;
}

function getFileIcon(file: File) {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Film;
    if (file.type.includes('pdf')) return FileText;
    return File;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function FileUpload({
    accept = '*/*',
    multiple = true,
    maxSize = 10, // 10MB default
    maxFiles = 10,
    initialFiles = [],
    onFilesSelected,
    onUpload,
    className = '',
    disabled = false,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<UploadedFile[]>(() =>
        initialFiles.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            progress: 100, // Assume initially loaded files are 'ready'
        }))
    );
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFiles = useCallback((selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: UploadedFile[] = [];
        for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
            const file = selectedFiles[i];

            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                newFiles.push({
                    file,
                    progress: 0,
                    error: `File exceeds ${maxSize}MB limit`,
                });
                continue;
            }

            // Create preview for images
            const preview = file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : undefined;

            newFiles.push({ file, preview, progress: 0 });
        }

        setFiles(prev => [...prev, ...newFiles]);
        onFilesSelected?.(newFiles.filter(f => !f.error).map(f => f.file));
    }, [files.length, maxFiles, maxSize, onFilesSelected]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview!);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const handleUpload = async () => {
        if (!onUpload || files.length === 0) return;

        setUploading(true);
        const validFiles = files.filter(f => !f.error).map(f => f.file);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            setFiles(prev => prev.map(f => ({ ...f, progress: i })));
            await new Promise(r => setTimeout(r, 100));
        }

        await onUpload(validFiles);
        setUploading(false);
        setFiles([]);
    };

    return (
        <div className={className}>
            {/* Drop Zone */}
            <div
                onClick={() => !disabled && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-zinc-700 hover:border-indigo-500/50'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <p className="text-white font-medium mb-1">Drop files here or click to browse</p>
                <p className="text-zinc-500 text-sm">
                    {accept === '*/*' ? 'All file types' : accept.replace(/,/g, ', ')} up to {maxSize}MB
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                disabled={disabled}
            />

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((f, index) => {
                        const Icon = getFileIcon(f.file);

                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-3 p-3 rounded-xl ${f.error ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-zinc-800/50'
                                    }`}
                            >
                                {f.preview ? (
                                    <img src={f.preview} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-zinc-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{f.file.name}</p>
                                    <p className={`text-sm ${f.error ? 'text-rose-400' : 'text-zinc-500'}`}>
                                        {f.error || formatFileSize(f.file.size)}
                                    </p>
                                    {uploading && !f.error && (
                                        <div className="mt-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all"
                                                style={{ width: `${f.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                    disabled={uploading}
                                >
                                    <X className="w-4 h-4 text-zinc-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && onUpload && (
                <div className="mt-4 flex justify-end">
                    <GlassButton
                        variant="primary"
                        onClick={handleUpload}
                        disabled={uploading || files.every(f => !!f.error)}
                    >
                        {uploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Upload {files.filter(f => !f.error).length} files</>
                        )}
                    </GlassButton>
                </div>
            )}
        </div>
    );
}
