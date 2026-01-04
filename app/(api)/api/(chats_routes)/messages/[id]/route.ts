import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const DELETE = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const messageId = (await params).id;
    const { searchParams } = new URL(req.url);
    const cascadeDelete = searchParams.get("cascade") === "true";

    try {
        const messageToDelete = await db.message.findUnique({
            where: { id: messageId },
        });

        if (!messageToDelete) {
            return NextResponse.json(
                { success: false, message: "Message not found" },
                { status: 404 }
            );
        }

        if (cascadeDelete && messageToDelete.fromUser) {
            const allMessages = await db.message.findMany({
                where: { chatId: messageToDelete.chatId },
                orderBy: { id: "asc" },
            });

            const messageIndex = allMessages.findIndex((m) => m.id === messageId);

            if (messageIndex !== -1 && messageIndex < allMessages.length - 1) {
                const nextMessage = allMessages[messageIndex + 1];
                if (!nextMessage.fromUser) {
                    await db.message.delete({ where: { id: nextMessage.id } });
                }
            }
        }

        await db.message.delete({ where: { id: messageId } });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Delete message error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete message" },
            { status: 500 }
        );
    }
};

export const PUT = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const messageId = (await params).id;
    const { content } = await req.json();

    try {
        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: { content },
        });

        return NextResponse.json(
            { success: true, data: updatedMessage },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update message error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update message" },
            { status: 500 }
        );
    }
};

export const PATCH = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const messageId = (await params).id;
    const { pinned } = await req.json();

    try {
        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: { pinned },
        });

        return NextResponse.json(
            { success: true, data: updatedMessage },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update message error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update pinned status" },
            { status: 500 }
        );
    }
};
