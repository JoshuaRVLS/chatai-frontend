import { db } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const characters = await db.character.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(characters);
    } catch (error) {
        console.error("Failed to fetch all characters:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
