import { db } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
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
        const { id } = await params;

        // Delete all messages first then the chat
        await db.$transaction([
            db.message.deleteMany({ where: { chatId: id } }),
            db.chat.delete({ where: { id } })
        ]);

        return NextResponse.json({ message: "Conversation deleted successfully" });
    } catch (error) {
        console.error("Failed to delete conversation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
