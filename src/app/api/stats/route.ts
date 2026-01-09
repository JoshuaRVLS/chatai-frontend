import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [userCount, charCount, chatCount, messageCount] = await Promise.all([
            db.user.count(),
            db.character.count(),
            db.chat.count(),
            db.message.count()
        ]);

        // Top characters by chat count
        const topCharacters = await db.character.findMany({
            take: 5,
            orderBy: {
                chats: {
                    _count: 'desc'
                }
            },
            include: {
                _count: {
                    select: { chats: true }
                }
            }
        });

        // Recent activity (latest users and characters)
        const [recentUsers, recentChars] = await Promise.all([
            db.user.findMany({
                take: 5,
                orderBy: { id: 'desc' }, // fallback for createdAt
                select: { id: true, username: true }
            }),
            db.character.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, createdAt: true, author: { select: { username: true } } }
            })
        ]);

        const activities = [
            ...recentUsers.map(u => ({
                id: `u-${u.id}`,
                action: 'New user registered',
                user: u.username,
                time: 'Recently'
            })),
            ...recentChars.map(c => ({
                id: `c-${c.id}`,
                action: 'Character created',
                user: c.author.username,
                time: c.createdAt.toISOString().split('T')[0]
            }))
        ].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

        return NextResponse.json({
            stats: {
                users: userCount,
                characters: charCount,
                conversations: chatCount,
                messages: messageCount
            },
            topCharacters: topCharacters.map(c => ({
                id: c.id,
                name: c.name,
                conversations: c._count.chats,
                growth: '+0%' // Static for now as we don't track historical growth yet
            })),
            recentActivity: activities
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
