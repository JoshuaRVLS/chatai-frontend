
import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                link: true,
                isActive: true,
                order: true,
                imageUrl: true,
                imageType: true,
                // Don't fetch giant blobs in list view
            }
        });

        const bannersWithUrl = banners.map(b => ({
            ...b,
            // Computed URL: Use DB image route if blob exists (type is set), else external URL
            // Overwriting `imageUrl` allows the frontend (which expects this field) to work without changes
            imageUrl: b.imageType ? `/api/banners/image/${b.id}` : b.imageUrl
        }));

        return NextResponse.json(bannersWithUrl);
    } catch (error) {
        console.error('[BANNERS_GET]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, link, isActive, order, imageBase64, imageType, externalUrl } = body;

        if (!imageBase64 && !externalUrl) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        let imageData: Buffer | undefined;
        if (imageBase64) {
            // Remove data:image/png;base64, prefix if present
            const base64Data = imageBase64.split(';base64,').pop();
            imageData = Buffer.from(base64Data, 'base64');
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                link,
                isActive: isActive ?? true,
                order: order ?? 0,
                imageUrl: externalUrl || null,
                imageType: imageData ? imageType : null,
                imageData: imageData || null,
            },
        });

        return NextResponse.json({ success: true, id: banner.id });
    } catch (error) {
        console.error('[BANNERS_POST]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
