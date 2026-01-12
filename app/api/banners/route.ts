
import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';

export async function GET(req: Request) {
    try {
        const banners = await db.banner.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                link: true,
                isActive: true,
                order: true,
                imageUrl: true,
                imageType: true,
            }
        });

        // Compute imageUrl for frontend compatibility
        const bannersWithUrl = banners.map(b => ({
            ...b,
            imageUrl: b.imageType ? `/api/banners/image/${b.id}` : b.imageUrl,
            // Remove internal fields if desired, but keeping them is fine
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

        // Admin check
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { imageUrl, title, link, isActive, order } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        const banner = await db.banner.create({
            data: {
                imageUrl,
                title,
                link,
                isActive: isActive ?? true,
                order: order ?? 0,
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error('[BANNERS_POST]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
