
import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Await the params per Next.js 15+ changes
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params if not already awaited in the signature (though Next.js usually passes them as a Promise in newer versions or just objects in older. 
        // Given the previous files, let's assuming strict Next 15 pattern, params is a Promise)
        const { id } = await params;

        const body = await req.json();
        const { imageUrl, title, link, isActive, order } = body;

        const banner = await db.banner.update({
            where: { id },
            data: {
                imageUrl,
                title,
                link,
                isActive,
                order,
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error('[BANNER_PATCH]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await db.banner.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[BANNER_DELETE]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
