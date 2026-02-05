'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

/**
 * Upload a job attachment to local storage
 * TODO: Replace with S3/Cloudinary for production
 */
export async function uploadJobAttachment(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: "No file provided" };
    }

    // Basic validation
    // Max 10MB (aligned with client side)
    if (file.size > 10 * 1024 * 1024) {
        return { error: "File too large (max 10MB)" };
    }

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'jobs');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        // Sanitize original name to remove spaces and special chars
        const sanitizedParams = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${Date.now()}-${sanitizedParams}`;
        const filePath = join(uploadDir, uniqueFilename);

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL
        const publicUrl = `/uploads/jobs/${uniqueFilename}`;

        return {
            success: true,
            url: publicUrl,
            name: file.name,
            size: file.size,
            type: file.type
        };

    } catch (error) {
        console.error("Upload error:", error);
        return { error: "Failed to upload file" };
    }
}
