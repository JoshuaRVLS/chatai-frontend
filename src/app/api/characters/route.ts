import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const statusFilter = searchParams.get("filter") || "all";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { author: { username: { contains: search, mode: 'insensitive' } } }
        ];
    }

    if (statusFilter === 'nsfw') {
        where.isNsfw = true;
    } else if (statusFilter === 'sfw') {
        where.isNsfw = false;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
    } else if (sort === 'popular') {
        orderBy = { chats: { _count: 'desc' } };
    }

    try {
        const [characters, total, stats] = await Promise.all([
            db.character.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    author: {
                        select: {
                            username: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { chats: true }
                    }
                }
            }),
            db.character.count({ where }),
            db.character.aggregate({
                _count: {
                    _all: true,
                },
                where: {} // Global stats
            })
        ]);

        // Get breakdown for stats cards
        const [nsfwCount, sfwCount] = await Promise.all([
            db.character.count({ where: { isNsfw: true } }),
            db.character.count({ where: { isNsfw: false } })
        ]);

        return NextResponse.json({
            data: characters.map(char => ({
                id: char.id,
                name: char.name,
                creator: char.author.username,
                conversations: char._count.chats,
                isNsfw: char.isNsfw,
                createdAt: char.createdAt.toISOString().split('T')[0]
            })),
            total,
            stats: {
                total: stats._count._all,
                nsfw: nsfwCount,
                sfw: sfwCount
            }
        });
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
