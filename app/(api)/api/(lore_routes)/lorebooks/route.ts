import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const GET = async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const lorebooks = await db.lorebook.findMany({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: { entries: true }
                }
            },
            orderBy: { updatedAt: "desc" }
        });
        return NextResponse.json({ success: true, data: lorebooks });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, description } = await req.json();
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const lorebook = await db.lorebook.create({
            data: {
                name,
                description,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, data: lorebook }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
