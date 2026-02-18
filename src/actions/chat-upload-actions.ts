'use server';

import { writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

/**
 * Upload a CHAT attachment to local storage.
 * STRICTLY ISOLATED from Job Post uploads.
 * Path: /public/uploads/chat
 */
export async function uploadChatAttachment(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: "No file provided" };
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
        return { error: "File too large (max 20MB)" };
    }

    // --- MIME validation (relaxed allowlist + explicit blocklist) ---
    const blockedTypes = ['text/html', 'application/javascript', 'application/x-msdownload'];
    const blockedExtensions = ['.html', '.htm', '.js', '.exe', '.msi', '.bat', '.cmd'];

    const mime = file.type?.toLowerCase() || '';
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';

    // Explicit block
    if (blockedTypes.includes(mime) || blockedExtensions.includes(ext)) {
        return { error: "File type not allowed" };
    }

    // If MIME is present, check allowlist
    if (mime) {
        const allowed =
            mime.startsWith('image/') ||
            mime.startsWith('audio/') ||
            mime === 'application/pdf' ||
            mime.includes('zip') ||
            mime.startsWith('application/vnd') ||
            mime === 'text/plain' ||
            mime === 'application/msword' ||
            mime === 'application/octet-stream';

        if (!allowed) {
            return { error: `File type "${mime}" not allowed` };
        }
    }
    // If MIME is empty, extension blocklist already checked above — allow through

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists - ISOLATED PATH
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}-${safeName}`;
        const filePath = join(uploadDir, uniqueFilename);

        // [DIAG] Log filename pipeline
        console.log('[UPLOAD] file.name:', file.name, '| safeName:', safeName, '| uniqueFilename:', uniqueFilename);
        console.log('[UPLOAD] filePath:', filePath);

        // Write file
        await writeFile(filePath, buffer);

        // [DIAG] Verify file existence immediately after write
        const fileStats = await stat(filePath);
        console.log('[UPLOAD] Verified: file exists, size:', fileStats.size, 'bytes');

        // Return seralizable metadata
        const publicUrl = `/uploads/chat/${uniqueFilename}`;
        console.log('[UPLOAD] publicUrl:', publicUrl);

        return {
            success: true,
            data: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: publicUrl
            }
        };

    } catch (error) {
        console.error("Chat Upload error:", error);
        return { error: "Failed to upload file" };
    }
}
