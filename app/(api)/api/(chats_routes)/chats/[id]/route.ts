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
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50 // Fetch latest 50 messages initially
        },
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
            userSettings: true,
            personas: {
              include: {
                image: {
                  select: {
                    id: true,
                    name: true,
                    mimetype: true
                  }
                }
              }
            }
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
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: { character: true }
    });

    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 });
    }

    // 1. Delete all existing messages
    await db.message.deleteMany({
      where: {
        chatId: chatId,
      },
    });

    // 2. Re-seed intro message if it exists
    if (chat.character.introMessage) {
      await db.message.create({
        data: {
          content: chat.character.introMessage,
          fromUser: false,
          chatId: chat.id,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Chat history reset to greeting" }, { status: 200 });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return NextResponse.json({ success: false, message: "Failed to clear history" }, { status: 500 });
  }
};
