import { db } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const charId = searchParams.get("characterId");
    const dateStr = searchParams.get("date");
    const skip = (page - 1) * limit;

    try {
        const where: any = {};
        if (charId && charId !== "all") {
            where.characterId = charId;
        }
        if (dateStr) {
            const date = new Date(dateStr);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            where.createdAt = {
                gte: date,
                lt: nextDay
            };
        }

        const [chats, total, stats] = await Promise.all([
            db.chat.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            username: true
                        }
                    },
                    character: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                }
            }),
            db.chat.count({ where }),
            db.chat.aggregate({
                _count: {
                    _all: true
                }
            })
        ]);

        // Today's chats
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCount = await db.chat.count({
            where: {
                createdAt: {
                    gte: startOfToday
                }
            }
        });

        // Avg messages
        const msgAggregate = await db.message.aggregate({
            _count: {
                _all: true
            }
        });
        const totalMsgs = msgAggregate._count._all;
        const totalChats = stats._count._all;
        const avgMessages = totalChats > 0 ? Math.round(totalMsgs / totalChats) : 0;

        return NextResponse.json({
            data: chats.map(chat => ({
                id: chat.id,
                user: chat.user?.username || chat.user?.email || "Unknown",
                character: chat.character.name,
                characterId: chat.character.id,
                messages: chat._count.messages,
                startedAt: chat.createdAt.toISOString()
            })),
            total,
            stats: {
                today: todayCount,
                total: totalChats,
                avgMessages,
                activeNow: Math.floor(todayCount * 0.1) // Mock active now as 10% of today's
            }
        });
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
