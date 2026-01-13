import { NextResponse } from "next/server";
import { db } from "@/app/utils/prisma";

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const characterId = (await params).id;

  try {
    const comments = await db.comment.findMany({
      where: {
        characterId,
        parentId: null, // Only fetch top-level comments initially
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          include: {
            profileImage: true,
          },
        },
        replies: {
          include: {
            author: {
              include: {
                profileImage: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
    });
    console.log(comments);
    return NextResponse.json(
      { success: true, data: comments },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
  }
};
