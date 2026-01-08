import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
    try {
        const lorebooks = await db.lorebook.findMany({
            include: {
                _count: {
                    select: { entries: true },
                },
                user: {
                    select: {
                        username: true,
                    },
                },
                tags: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: lorebooks });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
};
