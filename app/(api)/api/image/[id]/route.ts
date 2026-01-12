import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import sharp from "sharp";

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
        const { searchParams } = new URL(req.url);
        const width = parseInt(searchParams.get('width') || '1024');

        // Optimize image using sharp
        const optimizedBuffer = await sharp(Buffer.from(image.data))
            .resize({
                width: width,
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: 90 })
            .toBuffer();

        return new NextResponse(new Uint8Array(optimizedBuffer), {
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Image proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};
