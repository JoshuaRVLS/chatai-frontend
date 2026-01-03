import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const { messageId, chatId } = await req.json();

        // Find the message to be regenerated
        const messageToReplace = await db.message.findUnique({
            where: { id: messageId },
        });

        if (!messageToReplace || messageToReplace.fromUser) {
            return NextResponse.json({ success: false, message: "Invalid message" }, { status: 400 });
        }

        // Get the logical "last" user message before this AI response
        // In this app, we simply delete the AI message and call the AI route again
        await db.message.delete({
            where: { id: messageId },
        });

        // Get the previous message (which should be from the user)
        const lastUserMessage = await db.message.findFirst({
            where: {
                chatId: chatId,
                fromUser: true,
            },
            orderBy: {
                id: 'desc' // Assuming IDs or creation dates are sequential
            }
        });

        if (!lastUserMessage) {
            return NextResponse.json({ success: false, message: "No context found" }, { status: 400 });
        }

        // Call AI to get a new response
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: lastUserMessage.content,
                chatId: chatId,
            }),
        });

        const aiData = await response.json();

        // Create the new AI message
        await db.message.create({
            data: {
                chatId,
                content: aiData.data,
                fromUser: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Regeneration error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
};
