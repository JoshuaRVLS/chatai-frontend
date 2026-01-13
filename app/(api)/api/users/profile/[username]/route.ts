import { NextResponse } from 'next/server';
import { db } from '@/app/utils/prisma';

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) => {
    const username = (await params).username;

    try {
        const user = await db.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                bio: true,
                createdAt: true,
                profileImage: {
                    select: {
                        id: true,
                        mimetype: true,
                        data: true
                    }
                },
                charCreated: {
                    // where: { isNsfw: false }, // Show all characters
                    orderBy: { createdAt: 'desc' },
                    include: {
                        tags: true,
                        photo: {
                            select: {
                                id: true,
                                mimetype: true,
                                name: true
                            }
                        },
                        ratings: true,
                        _count: {
                            select: {
                                chats: true
                            }
                        }
                    }
                },
                lorebooks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        tags: true,
                        image: {
                            select: {
                                id: true,
                                mimetype: true,
                                name: true
                            }
                        },
                        _count: {
                            select: {
                                entries: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        charCreated: true,
                        chats: true,
                        lorebooks: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Calculate stats for characters
        const charCreatedWithStats = user.charCreated.map((char: any) => {
            const totalRating = char.ratings ? char.ratings.reduce((acc: number, curr: any) => acc + curr.value, 0) : 0;
            const averageRating = (char.ratings && char.ratings.length > 0) ? totalRating / char.ratings.length : 0;

            return {
                ...char,
                rating: averageRating,
                ratingCount: char.ratings ? char.ratings.length : 0,
                chatCount: char._count ? char._count.chats : 0
            };
        });

        const userData = {
            ...user,
            charCreated: charCreatedWithStats
        };

        return NextResponse.json({ success: true, data: userData }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
