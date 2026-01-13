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
                        mimetype: true
                        // Data excluded
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
                        }
                    }
                },
                _count: {
                    select: {
                        charCreated: true,
                        chats: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};
