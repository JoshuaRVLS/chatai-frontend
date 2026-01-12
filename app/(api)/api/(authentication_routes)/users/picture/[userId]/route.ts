
import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get('width') || '256');

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (!user?.profileImage) {
      return new NextResponse(null, { status: 404 });
    }

    // Import sharp dynamically or at top level (it is already used in other routes)
    const sharp = require('sharp');

    let imageBuffer = user.profileImage.data;

    // Resize if needed
    const resizedBuffer = await sharp(imageBuffer)
      .resize({
        width: width,
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 80 })
      .toBuffer();

    return new NextResponse(resizedBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }
}
