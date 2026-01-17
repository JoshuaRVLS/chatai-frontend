
import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const banner = await db.banner.findUnique({
            where: { id },
            select: { imageData: true, imageType: true }
        });

        if (!banner || !banner.imageData || !banner.imageType) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', banner.imageType);
        // Enable long-term caching
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');

        return new NextResponse(banner.imageData, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('[BANNER_IMAGE_GET] ERROR:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
