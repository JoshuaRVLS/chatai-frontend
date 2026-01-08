import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;

    try {
        const lorebook = await db.lorebook.findUnique({
            where: {
                id,
            },
            include: {
                entries: {
                    orderBy: { createdAt: "desc" }
                },
                user: {
                    select: { username: true, id: true }
                },
                tags: true
            }
        });

        if (!lorebook) {
            return NextResponse.json({ error: "Lorebook not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: lorebook });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const PATCH = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const description = formData.get("description") as string || "";
        const scanDepth = parseInt(formData.get("scanDepth") as string) || 4;
        const tokenBudget = parseInt(formData.get("tokenBudget") as string) || 512;
        const recursiveScanning = formData.get("recursiveScanning") === "true";
        const tagsJson = formData.get("tags") as string;
        const imageFile = formData.get("image") as File | null;

        // Parse tags
        let tagIds: string[] = [];
        if (tagsJson) {
            try {
                const tags = JSON.parse(tagsJson);
                tagIds = tags.map((t: any) => t.value || t.id);
            } catch (e) {
                console.error("Failed to parse tags:", e);
            }
        }

        const lorebook = await db.lorebook.update({
            where: {
                id,
                userId: session.user.id
            },
            data: {
                name,
                description,
                scanDepth,
                tokenBudget,
                recursiveScanning,
                updatedAt: new Date(),
                tags: {
                    set: tagIds.map(id => ({ id }))
                }
            }
        });

        // Handle image update
        if (imageFile && imageFile.size > 0) {
            const buffer = await imageFile.arrayBuffer();

            // Delete old image if exists
            await db.lorebookImage.deleteMany({
                where: { lorebookId: id }
            });

            await db.lorebookImage.create({
                data: {
                    lorebookId: lorebook.id,
                    name: imageFile.name,
                    mimetype: imageFile.type,
                    data: Buffer.from(buffer)
                }
            });
        }

        return NextResponse.json({ success: true, data: lorebook });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const DELETE = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await db.lorebook.delete({
            where: {
                id,
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, message: "Lorebook deleted" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
