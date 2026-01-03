import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;

        const image = await db.characterImage.findUnique({
            where: { charId: id },
        });

        if (!image || !image.data) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return new NextResponse(Buffer.from(image.data), {
            headers: {
                "Content-Type": image.mimetype || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Image proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};
