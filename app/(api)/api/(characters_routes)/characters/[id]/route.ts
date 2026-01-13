
import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const GET =
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const characterId = (await params).id;

    try {
      const character = await db.character.findUnique({
        where: {
          id: characterId,
        },
        include: {
          author: true,
          photo: {
            select: {
              id: true,
              charId: true,
              mimetype: true,
              name: true,
              // data: false (Excluded to reduce payload size)
            }
          },
          tags: true,
          lorebooks: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          },
          ratings: {
            select: {
              value: true,
              userId: true
            }
          },
          _count: {
            select: {
              chats: true
            }
          }
        },
      });
      return NextResponse.json({ success: true, data: character }, { status: 200 });
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch character' }, { status: 500 });
    }
  };

export const DELETE =
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const characterId = (await params).id;

    try {
      await db.character.delete({
        where: {
          id: characterId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Character and all related data deleted successfully'
        },
        { status: 200 });
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete character' }, { status: 500 });
    }
  };