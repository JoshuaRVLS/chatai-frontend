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

        // Delete target message and all subsequent messages in the same chat
        await db.message.deleteMany({
            where: {
                chatId: messageToDelete.chatId,
                createdAt: {
                    gte: messageToDelete.createdAt,
                },
            },
        });

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
        const message = await db.message.findUnique({ where: { id: messageId } });
        if (!message) return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });

        const data: any = { content };

        // If it's an AI message being edited for the first time, save the current content as originalContent
        if (!message.fromUser && !message.originalContent && message.content !== content) {
            data.originalContent = message.content;
        }

        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data,
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
