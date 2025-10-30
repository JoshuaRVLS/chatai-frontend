
import {db} from '@/app/utils/prisma';
import {NextResponse} from 'next/server';

export async function GET(
    request: Request, {params}: {params: Promise<{userId: string}>}) {
  try {
    const {userId} = await params;
    const user = await db.user.findUnique({
      where: {id: userId},
      select: {profileImage: true},
    });

    if (!user?.profileImage) {
      return new NextResponse(null, {status: 404});
    }


    return new NextResponse(user.profileImage.data, {
      headers: {
        'Content-Type': user.profileImage.mimetype,
        'Cache-Control': 'public, max-age=604800',
        'Content-Disposition': 'inline',
        Vary: 'Accept',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, {status: 500});
  }
}
