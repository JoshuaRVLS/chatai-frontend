import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const POST = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lorebookId } = await params;

    try {
        const { keywords, content, enabled } = await req.json();

        if (!keywords || !content) {
            return NextResponse.json({ error: "Keywords and content are required" }, { status: 400 });
        }

        // Verify ownership of lorebook
        const lorebook = await db.lorebook.findFirst({
            where: { id: lorebookId, userId: session.user.id }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        const entry = await db.loreEntry.create({
            data: {
                lorebookId,
                keywords: Array.isArray(keywords) ? keywords : keywords.split(",").map((k: string) => k.trim()),
                content,
                enabled: enabled ?? true
            }
        });

        // Update lorebook updatedAt
        await db.lorebook.update({
            where: { id: lorebookId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, data: entry }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
