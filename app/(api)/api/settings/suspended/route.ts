import { db } from "../../../../utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ isSuspended: false });
        }

        const user = await db.user.findUnique({
            where: { email },
            select: { suspendedUntil: true, suspensionReason: true, isAdmin: true }
        });

        if (!user) {
            return NextResponse.json({ isSuspended: false });
        }

        // Admins cannot be suspended
        if (user.isAdmin) {
            return NextResponse.json({ isSuspended: false });
        }

        // Check if suspension is active
        if (!user.suspendedUntil) {
            return NextResponse.json({ isSuspended: false });
        }

        const now = new Date();
        const suspendedUntil = new Date(user.suspendedUntil);
        const isSuspended = suspendedUntil > now;

        return NextResponse.json({
            isSuspended,
            suspendedUntil: user.suspendedUntil?.toISOString() || null,
            suspensionReason: user.suspensionReason
        });
    } catch (error) {
        console.error("[SUSPENSION_CHECK_ERROR]", error);
        return NextResponse.json({ isSuspended: false });
    }
}
