import { NextResponse } from "next/server";
import { db } from "@/app/utils/prisma";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await params;
  try {
    const personas = await db.userPersona.findMany({
      where: {
        userId,
      },
      include: {
        image: {
          select: {
            id: true,
            name: true,
            mimetype: true
          }
        }
      }
    });
    return NextResponse.json({ success: true, data: personas });
  } catch (error) {
    console.log(error);
  }
};

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await params;
  const { personaName, persona } = await req.json();
  try {
    const newPersona = await db.userPersona.create({
      data: {
        userId,
        name: personaName,
        person: persona,
      },
    });
    return NextResponse.json({ success: true, data: newPersona });
  } catch (error) {
    console.log(error);
  }
};

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await params;
  const { personaName, persona, personaId } = await req.json();
  try {
    await db.userPersona.update({
      where: {
        id: personaId,
      },
      data: {
        userId,
        name: personaName,
        person: persona,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};
