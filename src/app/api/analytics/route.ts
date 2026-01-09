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
    const days = parseInt(searchParams.get("days") || "7");

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const [users, messages, characters] = await Promise.all([
            db.user.findMany({
                select: { id: true }
            }),
            db.message.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true }
            }),
            db.character.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true }
            })
        ]);

        const groupByDate = (items: { createdAt: Date }[]) => {
            const groups: Record<string, number> = {};
            const rangeStart = new Date(startDate);
            for (let d = new Date(rangeStart); d <= endDate; d.setDate(d.getDate() + 1)) {
                groups[d.toISOString().split('T')[0]] = 0;
            }
            items.forEach(item => {
                const date = item.createdAt.toISOString().split('T')[0];
                if (groups[date] !== undefined) groups[date]++;
            });
            return Object.entries(groups).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
        };

        const userTrend = groupByDate([]); // Placeholder
        const messageTrend = groupByDate(messages);
        const charTrend = groupByDate(characters);

        const prevUsers = await db.user.count();
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);
        const [prevMessages] = await Promise.all([
            db.message.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } })
        ]);

        const userGrowth = prevUsers > 0 ? ((users.length - prevUsers) / prevUsers) * 100 : 100;
        const messageGrowth = prevMessages > 0 ? ((messages.length - prevMessages) / prevMessages) * 100 : 100;

        return NextResponse.json({
            trends: {
                users: userTrend,
                messages: messageTrend,
                characters: charTrend
            },
            metrics: {
                usersCreated: users.length,
                messagesSent: messages.length,
                userGrowth: userGrowth.toFixed(1),
                messageGrowth: messageGrowth.toFixed(1),
                retentionRate: 65, // Mocked as it requires complex login session tracking
                avgSessionDuration: "24m" // Mocked
            }
        });
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
