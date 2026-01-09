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
        const { id: userId } = await params;

        // Prevent self-deletion
        if (userId === session.user.id) {
            return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
        }

        // Verify user exists
        const user = await db.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete user and relations
        // In prisma schema, many relations don't have cascade delete.
        // We handle major ones here.
        await db.$transaction([
            db.userProfileImage.deleteMany({ where: { userId } }),
            db.userSettings.deleteMany({ where: { userId } }),
            db.userPersona.deleteMany({ where: { userId } }),
            db.lorebook.deleteMany({ where: { userId } }),
            db.message.deleteMany({ where: { chat: { userId } } }),
            db.chat.deleteMany({ where: { userId } }),
            db.character.deleteMany({ where: { authorId: userId } }),
            db.comment.deleteMany({ where: { authorId: userId } }),
            db.user.delete({ where: { id: userId } })
        ]);

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
