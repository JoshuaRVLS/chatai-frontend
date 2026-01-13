import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const POST = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;

        await db.character.update({
            where: { id },
            data: {
                views: {
                    increment: 1,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to increment views:", error);
        return NextResponse.json(
            { success: false, message: "Failed to increment views" },
            { status: 500 }
        );
    }
};
