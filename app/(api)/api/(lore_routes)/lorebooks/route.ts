import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";

export const GET = async (req: Request) => {
    const session = await getServerSession(authOptions);
    // REMOVED STRICT AUTH CHECK

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "library"; // library, discover, saved, created
    const query = searchParams.get("q");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    try {
        let where: any = {};
        // ... (conditions)
        if (query) {
            where.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
            ];
        }

        if (!session?.user?.id) {
            if (filter !== 'discover') {
                return NextResponse.json({ success: true, data: [], meta: { total: 0, page, limit, totalPages: 0 } });
            }
        } else {
            if (filter === "library") {
                where.AND = [
                    ...(where.AND || []),
                    {
                        OR: [
                            { userId: session.user.id },
                            { savedByUsers: { some: { id: session.user.id } } }
                        ]
                    }
                ];
            } else if (filter === "saved") {
                where.savedByUsers = { some: { id: session.user.id } };
            } else if (filter === "created") {
                where.userId = session.user.id;
            }
        }

        const [lorebooks, total] = await db.$transaction([
            db.lorebook.findMany({
                where,
                include: {
                    _count: {
                        select: { entries: true, characters: true }
                    },
                    tags: true,
                    ...(session?.user?.id ? {
                        savedByUsers: {
                            where: { id: session.user.id },
                            select: { id: true }
                        }
                    } : {})
                },
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip: skip
            }),
            db.lorebook.count({ where })
        ]);

        // Map to include isSaved bool
        const mapped = lorebooks.map(lb => ({
            ...lb,
            isSaved: session?.user?.id ? (lb as any).savedByUsers.length > 0 : false,
            savedByUsers: undefined // Remove from payload
        }));

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: mapped,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const description = formData.get("description") as string || "";
        const scanDepth = parseInt(formData.get("scanDepth") as string) || 4;
        const tokenBudget = parseInt(formData.get("tokenBudget") as string) || 512;
        const recursiveScanning = formData.get("recursiveScanning") === "true";
        const tagsJson = formData.get("tags") as string;
        const imageFile = formData.get("image") as File | null;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Parse tags
        let tagIds: string[] = [];
        if (tagsJson) {
            try {
                const tags = JSON.parse(tagsJson);
                tagIds = tags.map((t: any) => t.value);
            } catch (e) {
                console.error("Failed to parse tags:", e);
            }
        }

        // Create lorebook
        const lorebook = await db.lorebook.create({
            data: {
                name,
                description,
                scanDepth,
                tokenBudget,
                recursiveScanning,
                userId: session.user.id,
                ...(tagIds.length > 0 && {
                    tags: {
                        connect: tagIds.map(id => ({ id }))
                    }
                })
            }
        });

        // Handle image upload
        if (imageFile && imageFile.size > 0) {
            const buffer = await imageFile.arrayBuffer();
            await db.lorebookImage.create({
                data: {
                    lorebookId: lorebook.id,
                    name: imageFile.name,
                    mimetype: imageFile.type,
                    data: Buffer.from(buffer)
                }
            });
        }

        return NextResponse.json({ success: true, data: lorebook }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
