import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';

export const GET = async () => {
    try {
        // Fetch characters sorted by views descending
        const characters = await db.character.findMany({
            take: 20,
            orderBy: {
                views: 'desc'
            },
            include: {
                ratings: true,
                author: true,
                tags: true,
                photo: {
                    select: {
                        id: true,
                        mimetype: true,
                    }
                },
                _count: {
                    select: {
                        chats: true
                    }
                }
            }
        });

        // Map data to match the format expected by CharacterCard
        const popular = characters.map(char => {
            const total = char.ratings.reduce((acc, curr) => acc + curr.value, 0);
            const avg = char.ratings.length > 0 ? total / char.ratings.length : 0;
            return {
                ...char,
                averageRating: avg,
                ratingCount: char.ratings.length,
                chatCount: char._count.chats,
                views: char.views
            };
        });

        return NextResponse.json({ success: true, data: popular }, { status: 200 });
    } catch (error) {
        console.error('Error fetching popular characters:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
