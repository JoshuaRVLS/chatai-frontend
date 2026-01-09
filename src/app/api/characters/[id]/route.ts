import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: charId } = await params;

        // Verify character exists
        const character = await db.character.findUnique({
            where: { id: charId }
        });

        if (!character) {
            return NextResponse.json({ error: "Character not found" }, { status: 404 });
        }

        // Delete character (Prisma with cascade deletion should handle related records if configured, 
        // but we should be careful. In schema.prisma it's not explicitly cascade for all)
        // Actually CharacterImage has charId, so it should be deleted.
        // Chats, lorebooks, comments also relate to Character.

        // To be safe and simple, we'll try to delete. 
        // If there are foreign key constraints, we might need to delete relations first.
        // Character model schema:
        // chats Chat[]
        // photo CharacterImage?
        // tags CharacterTag[]
        // comments Comment[]
        // lorebooks Lorebook[]

        await db.$transaction([
            db.characterImage.deleteMany({ where: { charId } }),
            db.comment.deleteMany({ where: { characterId: charId } }),
            db.chat.deleteMany({ where: { characterId: charId } }),
            db.character.delete({ where: { id: charId } })
        ]);

        return NextResponse.json({ message: "Character deleted successfully" });
    } catch (error) {
        console.error("Failed to delete character:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
