
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Fetch invoice with details
        const invoice = await db.invoice.findUnique({
            where: { id },
            include: {
                lineItems: true,
                client: { include: { user: { select: { name: true, email: true } } } },
                freelancer: { include: { user: { select: { name: true, email: true } } } }
            }
        });

        if (!invoice) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Verify Access
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { freelancerProfile: true, clientProfile: true }
        });

        const isFreelancer = user?.freelancerProfile?.id === invoice.freelancerId;
        const isClient = user?.clientProfile?.id === invoice.clientId;
        const isAdmin = user?.role === 'ADMIN';

        if (!isFreelancer && !isClient && !isAdmin) {
            return new NextResponse("Access Denied", { status: 403 });
        }

        // Log Audit Event
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                actorRole: user?.role || 'FREELANCER',
                action: 'INVOICE_VIEWED',
                entityType: 'INVOICE',
                entityId: invoice.id,
                details: { invoiceNumber: invoice.invoiceNumber, amount: invoice.total }
            }
        });

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("[INVOICE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
