import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';

export const POST = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const characterId = (await params).id;
    const { value } = await req.json();

    if (!value || value < 1 || value > 5) {
        return NextResponse.json({ success: false, message: 'Invalid rating value' }, { status: 400 });
    }

    try {
        // Upsert the rating
        const rating = await db.characterRating.upsert({
            where: {
                userId_characterId: {
                    userId: session.user.id,
                    characterId: characterId
                }
            },
            update: {
                value: value
            },
            create: {
                userId: session.user.id,
                characterId: characterId,
                value: value
            }
        });

        return NextResponse.json({ success: true, data: rating }, { status: 200 });
    } catch (error) {
        console.error('Error saving rating:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
