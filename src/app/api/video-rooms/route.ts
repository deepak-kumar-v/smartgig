
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { contractId } = body;

        // Create a new room
        const room = await db.videoRoom.create({
            data: {
                roomId: `room-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                hostId: session.user.id, // Required field
                contractId,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("[VIDEO_ROOMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const roomId = url.searchParams.get('roomId');

        if (!roomId) return new NextResponse("Missing roomId", { status: 400 });

        const room = await db.videoRoom.findUnique({
            where: { roomId },
            include: { participants: true }
        });

        if (!room) return new NextResponse("Not Found", { status: 404 });

        return NextResponse.json(room);
    } catch (error) {
        console.error("[VIDEO_ROOMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
