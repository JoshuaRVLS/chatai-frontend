import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';

export const GET = async () => {
    try {
        // Fetch users who have created at least one character
        // We fetch minimal data needed for calculation and display
        const authors = await db.user.findMany({
            where: {
                charCreated: {
                    some: {} // Only authors with characters
                }
            },
            select: {
                id: true,
                username: true,
                bio: true,
                profileImage: {
                    select: {
                        id: true,
                        mimetype: true
                    }
                },
                charCreated: {
                    select: {
                        ratings: {
                            select: {
                                value: true
                            }
                        }
                    }
                }
            },
            take: 100 // Limit initial set for performance
        });

        // Calculate scores
        const trendingAuthors = authors.map(author => {
            let totalRatings = 0;
            let totalScore = 0;

            author.charCreated.forEach(char => {
                char.ratings.forEach(rating => {
                    totalRatings++;
                    totalScore += rating.value;
                });
            });

            const averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;
            const characterCount = author.charCreated.length;

            // Ranking Algorithm:
            // Weighted towards total engagement (ratings count) but quality matters.
            // Score = (Total Ratings * 1.5) + (Character Count * 2) + (Average Rating * 5)
            // This is arbitrary but gives a mix of quantity and quality.
            const rankScore = (totalRatings * 1.5) + (characterCount * 2) + (averageRating * 5);

            return {
                id: author.id,
                username: author.username,
                bio: author.bio,
                profileImage: author.profileImage,
                stats: {
                    totalRatings,
                    averageRating,
                    characterCount
                },
                rankScore
            };
        })
            .sort((a, b) => b.rankScore - a.rankScore)
            .slice(0, 10);

        return NextResponse.json({ success: true, data: trendingAuthors }, { status: 200 });
    } catch (error) {
        console.error('Error fetching trending authors:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
