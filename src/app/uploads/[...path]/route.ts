import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Dynamic file server for user-uploaded content.
 *
 * Next.js production mode uses a static manifest built at build time.
 * Files uploaded AFTER `npm run build` are not in this manifest → 404.
 * This route handler bypasses the manifest by reading directly from disk.
 *
 * Serves: /uploads/chat/<filename>
 * Reads from: <project-root>/public/uploads/chat/<filename>
 */

const MIME_TYPES: Record<string, string> = {
    '.webm': 'audio/webm',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.mp4': 'audio/mp4',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.webp': 'image/webp',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;

    // Security: reject path traversal
    const joined = path.join('/');
    if (joined.includes('..') || joined.includes('\\')) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', ...path);

    try {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const fileBuffer = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileStats.size.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}
