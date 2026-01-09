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
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const skip = (page - 1) * limit;

    try {
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { user: { username: { contains: search, mode: 'insensitive' } } }
            ];
        }

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        } else if (sort === 'entries') {
            orderBy = { entries: { _count: 'desc' } };
        } else if (sort === 'characters') {
            orderBy = { characters: { _count: 'desc' } };
        }

        const [lorebooks, total, stats] = await Promise.all([
            db.lorebook.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            entries: true,
                            characters: true
                        }
                    }
                }
            }),
            db.lorebook.count({ where }),
            db.lorebook.aggregate({
                _count: {
                    _all: true
                }
            })
        ]);

        const entryCount = await db.loreEntry.count();

        return NextResponse.json({
            data: lorebooks.map(book => ({
                id: book.id,
                name: book.name,
                entries: book._count.entries,
                characters: book._count.characters,
                creator: book.user?.username || book.user?.email || "Unknown",
                createdAt: book.createdAt.toISOString()
            })),
            total,
            stats: {
                total: stats._count._all,
                entries: entryCount,
                // These are mock placeholders for now as status isn't directly in schema but could be inferred or added later
                public: Math.floor(stats._count._all * 0.7),
                private: Math.floor(stats._count._all * 0.3)
            }
        });
    } catch (error) {
        console.error("Failed to fetch lorebooks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
