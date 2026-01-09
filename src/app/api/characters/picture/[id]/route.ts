import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const image = await db.characterImage.findUnique({
            where: { charId: id }
        });

        if (!image) {
            return new NextResponse(null, { status: 404 });
        }

        return new Response(image.data as any, {
            status: 200,
            headers: {
                "Content-Type": image.mimetype,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving character image:", error);
        return new NextResponse(null, { status: 500 });
    }
}
