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
    const roleFilter = searchParams.get("role") || "all";
    const verifiedFilter = searchParams.get("verified") || "all";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (roleFilter === 'admin') {
        where.isAdmin = true;
    } else if (roleFilter === 'user') {
        where.isAdmin = false;
    }

    if (verifiedFilter === 'verified') {
        where.verified = true;
    } else if (verifiedFilter === 'unverified') {
        where.verified = false;
    }

    let orderBy: any = { id: 'desc' };
    if (sort === 'oldest') {
        orderBy = { id: 'asc' };
    } else if (sort === 'most_characters') {
        orderBy = { charCreated: { _count: 'desc' } };
    } else if (sort === 'most_chats') {
        orderBy = { chats: { _count: 'desc' } };
    }

    try {
        const [users, total, stats] = await Promise.all([
            db.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: {
                            charCreated: true,
                            chats: true,
                            comments: true,
                            lorebooks: true,
                            personas: true
                        }
                    }
                }
            }),
            db.user.count({ where }),
            db.user.aggregate({
                _count: {
                    _all: true,
                    isAdmin: true,
                    verified: true
                },
                where: {}
            })
        ]);

        return NextResponse.json({
            data: users.map(user => ({
                id: user.id,
                name: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                verified: user.verified,
                charCount: user._count.charCreated,
                chatCount: user._count.chats,
                commentCount: user._count.comments,
                lorebookCount: user._count.lorebooks,
                personaCount: user._count.personas
            })),
            total,
            stats: {
                total: stats._count._all,
                admins: stats._count.isAdmin,
                users: stats._count._all - stats._count.isAdmin,
                verified: stats._count.verified
            }
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
