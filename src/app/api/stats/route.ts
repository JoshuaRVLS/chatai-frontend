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

        // Diverse Recent Activity
        const [recentUsers, recentChars, recentChats, recentLorebooks] = await Promise.all([
            db.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, username: true, createdAt: true }
            }),
            db.character.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, createdAt: true, author: { select: { username: true } } }
            }),
            db.chat.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, createdAt: true, user: { select: { username: true } }, character: { select: { name: true } } }
            }),
            db.lorebook.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, createdAt: true, user: { select: { username: true } } }
            })
        ]);

        const activities = [
            ...recentUsers.map(u => ({
                id: `user-${u.id}`,
                type: 'user',
                action: 'New operator registered',
                user: u.username,
                time: u.createdAt.toISOString()
            })),
            ...recentChars.map(c => ({
                id: `char-${c.id}`,
                type: 'character',
                action: `Deployed character: ${c.name}`,
                user: c.author.username,
                time: c.createdAt.toISOString()
            })),
            ...recentChats.map(ch => ({
                id: `chat-${ch.id}`,
                type: 'chat',
                action: `New link established with ${ch.character.name}`,
                user: ch.user.username,
                time: ch.createdAt.toISOString()
            })),
            ...recentLorebooks.map(l => ({
                id: `lore-${l.id}`,
                type: 'lorebook',
                action: `Lorebook indexed: ${l.name}`,
                user: l.user.username,
                time: l.createdAt.toISOString()
            }))
        ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10);

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
                growth: '+0%'
            })),
            recentActivity: activities
        });
    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
