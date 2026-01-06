import { NextResponse } from "next/server";
import { db } from "@/app/utils/prisma";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const chatId = (await params).id;

  try {
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: {
        character: {
          include: {
            photo: {
              select: {
                id: true,
                charId: true,
                mimetype: true,
                name: true,
                // data: false (Excluded to reduce payload size)
              }
            }
          }
        },
        messages: { orderBy: { id: 'asc' } },
        user: {
          include: {
            profileImage: {
              select: {
                id: true,
                userId: true,
                mimetype: true,
                // data: false (Excluded to reduce payload size)
              }
            },
            userSettings: true
          }
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 });
    }

    await db.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: chat }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const chatId = (await params).id;
  try {
    const body = await req.json();
    const chat = await db.chat.update({
      where: { id: chatId },
      data: body,
    });
    return NextResponse.json({ success: true, data: chat }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update chat" }, { status: 500 });
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const chatId = (await params).id;

  try {
    await db.message.deleteMany({
      where: {
        chatId: chatId,
      },
    });

    await db.chat.delete({
      where: {
        id: chatId,
      },
    });

    return NextResponse.json({ success: true, message: "Chat history cleared and record removed" }, { status: 200 });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return NextResponse.json({ success: false, message: "Failed to clear history" }, { status: 500 });
  }
};
