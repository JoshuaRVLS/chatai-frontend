import { db } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        const lorebook = await db.lorebook.findUnique({
            where: { id },
            include: {
                characters: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                _count: {
                    select: {
                        entries: true,
                        characters: true
                    }
                }
            }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        return NextResponse.json(lorebook);
    } catch (error) {
        console.error("Failed to fetch lorebook details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Transactions handle deletion of related entries and images due to Cascade or manual cleanup
        await db.$transaction([
            db.loreEntry.deleteMany({ where: { lorebookId: id } }),
            db.lorebookImage.deleteMany({ where: { lorebookId: id } }),
            db.lorebook.delete({ where: { id } })
        ]);

        return NextResponse.json({ message: "Lorebook deleted successfully" });
    } catch (error) {
        console.error("Failed to delete lorebook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
