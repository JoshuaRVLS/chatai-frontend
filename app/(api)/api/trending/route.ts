import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';

export const GET = async () => {
    try {
        // Strategy: Fetch characters with their ratings, then sort by average rating in memory.
        // Limit to 100 recent characters to keep it fast, or look at all.
        // For a "Trending" section, we might want a mix of high rating and recent activity.
        // Valid "Trending" = High Rating + recent. 

        // Let's fetch the top 50 most rated characters first (popularity proxy)
        const characters = await db.character.findMany({
            take: 50,
            orderBy: {
                ratings: {
                    _count: 'desc'
                }
            },
            include: {
                ratings: true,
                author: true,
                tags: true,
                photo: {
                    select: {
                        id: true,
                        mimetype: true, // Only select necessary fields
                    }
                },
                _count: {
                    select: {
                        chats: true
                    }
                }
            }
        });

        // Calculate average rating and sort
        const trending = characters.map(char => {
            const total = char.ratings.reduce((acc, curr) => acc + curr.value, 0);
            const avg = char.ratings.length > 0 ? total / (char.ratings.length) : 0;
            return {
                ...char,
                averageRating: avg,
                ratingCount: char.ratings.length,
                chatCount: char._count.chats
                // ratings: undefined // Exclude raw ratings array to save bandwidth if not needed
            };
        })
            .sort((a, b) => b.averageRating - a.averageRating) // Sort by highest rating
            .slice(0, 10); // Top 10

        return NextResponse.json({ success: true, data: trending }, { status: 200 });
    } catch (error) {
        console.error('Error fetching trending:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
