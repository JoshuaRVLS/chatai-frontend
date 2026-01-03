import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const chats = await db.chat.findMany({
      where: { userId: session.user.id },
      include: {
        character: {
          include: { author: true, tags: true },
        },
        messages: {
          take: 1,
          orderBy: { id: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, chats });
  }

  try {
    const chats = await db.chat.findMany({
      where: { userId },
      include: {
        character: {
          include: { author: true, tags: true },
        },
        messages: {
          take: 1,
          orderBy: { id: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const { characterId, userId } = await req.json();

  try {
    const chat = await db.chat.create({
      data: {
        character: {
          connect: {
            id: characterId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        character: true,
      },
    });
    return NextResponse.json({ success: true, chat }, { status: 201 });
  } catch (error) {
    console.log(error);
  }
};
