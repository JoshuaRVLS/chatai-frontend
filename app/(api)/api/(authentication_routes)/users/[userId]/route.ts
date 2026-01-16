import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const GET =
  async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
    try {
      const userId = (await params).userId;
      const user = await db.user.findUnique(
        {
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            verified: true,
            userSettings: true,
            profileImage: {
              select: {
                id: true,
                mimetype: true,
                userId: true
              }
            }
          }
        });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' }, { status: 404 });
      }

      // Create a mutable copy and provide defaults
      const responseData = {
        ...user,
        userSettings: user.userSettings || {
          showNsfw: false,
          blurNsfw: true,
        },
        // Generic image field for components expecting it
        image: user.profileImage ? `/api/users/picture/${user.id}` : null
      };

      return NextResponse.json({ success: true, data: responseData }, { status: 200 });
    } catch (error) {
      console.error("GET /api/users/[userId] error:", error);
      return NextResponse.json(
        { success: false, message: "Internal Server Error" }, { status: 500 });
    }
  };

export const DELETE =
  // ... (previous delete implementation remains unchanged)
  async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
    const userId = (await params).userId;
    await db.user.delete({
      where: { id: userId },
      include: {
        profileImage: true,
        charCreated: true,
        chats: true,
        comments: true,
        personas: true,
        userSettings: true
      }
    });
    return NextResponse.json({ success: true }, { status: 200 })
  };

export const PATCH =
  async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
    try {
      const userId = (await params).userId;
      const { username, email, showNsfw, blurNsfw, profileImage } = await req.json();

      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;

      if (profileImage && profileImage.data && profileImage.mimetype) {
        updateData.profileImage = {
          upsert: {
            create: {
              data: Buffer.from(profileImage.data, 'base64'),
              mimetype: profileImage.mimetype
            },
            update: {
              data: Buffer.from(profileImage.data, 'base64'),
              mimetype: profileImage.mimetype
            }
          }
        };
      }

      if (showNsfw !== undefined || blurNsfw !== undefined) {
        updateData.userSettings = {
          upsert: {
            create: {
              showNsfw: showNsfw ?? false,
              blurNsfw: blurNsfw ?? true
            },
            update: {
              ...(showNsfw !== undefined && { showNsfw }),
              ...(blurNsfw !== undefined && { blurNsfw })
            }
          }
        };
      }

      const user = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          verified: true,
          userSettings: true,
          profileImage: {
            select: {
              id: true,
              mimetype: true,
              userId: true
            }
          }
        }
      });

      return NextResponse.json({ success: true, data: user }, { status: 200 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, message: "Username or email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }
  };