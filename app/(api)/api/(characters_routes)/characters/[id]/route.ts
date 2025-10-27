import { NextResponse } from "next/server";
import { db } from "@/app/utils/prisma";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const characterId = (await params).id;

  try {
    const character = await db.character.findUnique({
      where: {
        id: characterId,
      },
      include: { author: true, photo: true, tags: true },
    });
    return NextResponse.json(
      { success: true, data: character },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
  }
};

export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const characterId = (await params).id;

  try {
    await db.character.delete({
      where: {
        id: characterId,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
