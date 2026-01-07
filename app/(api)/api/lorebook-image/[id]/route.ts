import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const image = await db.lorebookImage.findFirst({
            where: { lorebookId: id },
        });

        if (!image) {
            return new NextResponse("Image not found", { status: 404 });
        }

        return new NextResponse(image.data, {
            headers: {
                "Content-Type": image.mimetype,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
