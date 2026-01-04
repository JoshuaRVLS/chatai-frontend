import { NextResponse } from "next/server";
import { db } from "@/app/utils/prisma";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const chatId = (await params).id;

  try {
    const chat = await db.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        character: {
          include: {
            photo: true,
          },
        },
        messages: {
          orderBy: {
            id: 'asc'
          }
        },
        user: {
          include: {
            profileImage: true,
          },
        },
      },
    });
    await db.chat.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, data: chat }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
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
