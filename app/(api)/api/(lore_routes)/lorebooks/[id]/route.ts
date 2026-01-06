import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const lorebook = await db.lorebook.findFirst({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                entries: {
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: lorebook });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const PATCH = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const { name, description } = await req.json();

        const lorebook = await db.lorebook.update({
            where: {
                id,
                userId: session.user.id
            },
            data: {
                name,
                description,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, data: lorebook });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const DELETE = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await db.lorebook.delete({
            where: {
                id,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, message: "Lorebook deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
