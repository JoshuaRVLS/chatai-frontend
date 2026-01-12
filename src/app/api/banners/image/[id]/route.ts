
import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const banner = await prisma.banner.findUnique({
            where: { id },
            select: { imageData: true, imageType: true }
        });

        if (!banner || !banner.imageData || !banner.imageType) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', banner.imageType);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');

        return new NextResponse(banner.imageData as any, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error('[BANNER_IMAGE_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
