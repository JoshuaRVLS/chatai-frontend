import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const PATCH = async (
    req: Request,
    { params }: { params: Promise<{ id: string; entryId: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lorebookId, entryId } = await params;

    try {
        const { keywords, content, enabled } = await req.json();

        // Verify ownership of lorebook
        const lorebook = await db.lorebook.findFirst({
            where: { id: lorebookId, userId: session.user.id }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        const entry = await db.loreEntry.update({
            where: {
                id: entryId,
                lorebookId
            },
            data: {
                keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(",").map((k: string) => k.trim())) : undefined,
                content,
                enabled,
                updatedAt: new Date()
            }
        });

        await db.lorebook.update({
            where: { id: lorebookId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, data: entry });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const DELETE = async (
    req: Request,
    { params }: { params: Promise<{ id: string; entryId: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lorebookId, entryId } = await params;

    try {
        // Verify ownership
        const lorebook = await db.lorebook.findFirst({
            where: { id: lorebookId, userId: session.user.id }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        await db.loreEntry.delete({
            where: {
                id: entryId,
                lorebookId
            }
        });

        return NextResponse.json({ success: true, message: "Entry deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
