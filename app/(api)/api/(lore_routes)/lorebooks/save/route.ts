import { db } from "@/app/utils/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { lorebookId } = body;

        if (!lorebookId) {
            return new NextResponse("Lorebook ID required", { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, savedLorebooks: { where: { id: lorebookId }, select: { id: true } } }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const isSaved = user.savedLorebooks.length > 0;

        if (isSaved) {
            // Unsave
            await db.user.update({
                where: { id: user.id },
                data: {
                    savedLorebooks: {
                        disconnect: { id: lorebookId }
                    }
                }
            });
            return NextResponse.json({ saved: false });
        } else {
            // Save
            await db.user.update({
                where: { id: user.id },
                data: {
                    savedLorebooks: {
                        connect: { id: lorebookId }
                    }
                }
            });
            return NextResponse.json({ saved: true });
        }

    } catch (error) {
        console.error("Failed to toggle save lorebook", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
