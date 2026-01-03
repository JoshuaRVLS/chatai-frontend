import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

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

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.log(error);
  }
};
