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

    let orderBy: any = { id: 'desc' };
    if (sort === 'oldest') {
        orderBy = { id: 'asc' };
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
                            chats: true
                        }
                    }
                }
            }),
            db.user.count({ where }),
            db.user.aggregate({
                _count: {
                    _all: true,
                    isAdmin: true
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
                charCount: user._count.charCreated,
                chatCount: user._count.chats
            })),
            total,
            stats: {
                total: stats._count._all,
                admins: stats._count.isAdmin,
                users: stats._count._all - stats._count.isAdmin
            }
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
