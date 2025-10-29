import {db} from '@/app/utils/prisma';
import {NextResponse} from 'next/server';

export const GET =
    async (req: Request, {params}: {params: Promise<{userId: string}>}) => {
  const userId = (await params).userId;
  const user = await db.user.findUnique(
      {where: {id: userId}, include: {profileImage: true}});
  if (!user) {
    return NextResponse.json(
        {success: false, message: 'User not found'}, {status: 404});
  }
  return NextResponse.json({success: true, data: user}, {status: 200});
};

export const DELETE =
    async (req: Request, {params}: {params: Promise<{userId: string}>}) => {
  const userId = (await params).userId;
  await db.user.delete({
    where: {id: userId},
    include: {
      profileImage: true,
      charCreated: true,
      chats: true,
      comments: true,
      personas: true
    }
  });
  return NextResponse.json({success: true}, {status: 200})
};