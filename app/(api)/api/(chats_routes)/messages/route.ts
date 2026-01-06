import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!chatId) {
    return NextResponse.json({ success: false, message: "chatId is required" }, { status: 400 });
  }

  try {
    const messages = await db.message.findMany({
      where: { chatId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    // Re-reverse to return in chronological order if desired, 
    // or let the frontend handle the reverse if it's prepending.
    // Usually, for infinite scroll up, we want to return desc and let frontend handle it.

    return NextResponse.json({
      success: true,
      data: messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const { chatId, content, userId, fromUser } = await req.json();

  try {
    const message = await db.message.create({
      data: {
        chat: {
          connect: {
            id: chatId,
          },
        },
        content,
        fromUser,
      },
    });

    // Touch chat updatedAt
    await db.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.log(error);
  }
};
