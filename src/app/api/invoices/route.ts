
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get user profiles to filter invoices
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { freelancerProfile: true, clientProfile: true }
        });

        const freelancerId = user?.freelancerProfile?.id;
        const clientId = user?.clientProfile?.id;

        if (!freelancerId && !clientId) {
            return NextResponse.json([]);
        }

        const invoices = await db.invoice.findMany({
            where: {
                OR: [
                    ...(freelancerId ? [{ freelancerId }] : []),
                    ...(clientId ? [{ clientId }] : [])
                ]
            },
            include: {
                lineItems: true,
                client: { include: { user: { select: { name: true, email: true } } } },
                freelancer: { include: { user: { select: { name: true, email: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("[INVOICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
