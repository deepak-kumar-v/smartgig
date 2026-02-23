
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Look up the user's wallet
        const wallet = await db.wallet.findUnique({
            where: { userId: session.user.id },
        });

        if (!wallet) {
            // No wallet = no ledger entries
            return NextResponse.json([]);
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const contractId = searchParams.get('contractId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build where clause — now keyed on walletId
        const where: any = { walletId: wallet.id };

        if (type) where.type = type;
        if (contractId) where.contractId = contractId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const entries = await db.walletLedger.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });

        // Log audit event
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                actorRole: 'FREELANCER',
                action: 'LEDGER_VIEWED',
                entityType: 'LEDGER',
                entityId: null,
                details: { filters: { type, contractId, dateFrom, dateTo } }
            }
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("[LEDGER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
