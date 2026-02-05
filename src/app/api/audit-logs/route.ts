
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify admin role
        const user = await db.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== 'ADMIN') {
            return new NextResponse("Forbidden - Admin Only", { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const actorId = searchParams.get('actorId');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build where clause
        const where: any = {};

        if (actorId) where.userId = actorId;
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        // Simple search across action and entityType
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { entityType: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } }
            ];
        }

        const logs = await db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true, role: true } } },
            take: limit,
            skip: offset
        });

        const total = await db.auditLog.count({ where });

        return NextResponse.json({ logs, total });
    } catch (error) {
        console.error("[AUDIT_LOGS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { action, entityType, entityId, details, actorRole, ipAddress, userAgent } = body;

        // Validate required fields
        if (!action || !entityType) {
            return new NextResponse("Missing required fields: action, entityType", { status: 400 });
        }

        const log = await db.auditLog.create({
            data: {
                userId: session.user.id,
                actorRole: actorRole || session.user.role || 'FREELANCER',
                action,
                entityType,
                entityId: entityId || null,
                details: details || {}, // Store as Json object directly
                ipAddress,
                userAgent
            }
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("[AUDIT_LOGS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
