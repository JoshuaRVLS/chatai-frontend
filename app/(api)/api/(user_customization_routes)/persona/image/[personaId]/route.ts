import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const GET = async (
    req: Request,
    { params }: { params: Promise<{ personaId: string }> }
) => {
    try {
        const { personaId } = await params;

        const image = await db.personaImage.findUnique({
            where: { personaId: personaId },
        });

        if (!image || !image.data) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Optimize image using sharp
        const optimizedBuffer = await sharp(Buffer.from(image.data))
            .resize({
                width: 400,
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: 80 })
            .toBuffer();

        return new NextResponse(new Uint8Array(optimizedBuffer), {
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Persona image proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
};

export const POST = async (
    req: Request,
    { params }: { params: Promise<{ personaId: string }> }
) => {
    try {
        const { personaId } = await params;
        const formData = await req.formData();
        const imageFile = formData.get("image") as File;

        if (!imageFile) {
            return NextResponse.json({ success: false, message: "No image file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await imageFile.arrayBuffer());

        await db.personaImage.upsert({
            where: { personaId },
            create: {
                personaId,
                data: buffer,
                mimetype: imageFile.type,
                name: imageFile.name,
            },
            update: {
                data: buffer,
                mimetype: imageFile.type,
                name: imageFile.name,
            },
        });

        return NextResponse.json({ success: true, message: "Image uploaded successfully" });
    } catch (error) {
        console.error("Persona image upload error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
};

export const DELETE = async (
    req: Request,
    { params }: { params: Promise<{ personaId: string }> }
) => {
    try {
        const { personaId } = await params;

        await db.personaImage.deleteMany({
            where: { personaId },
        });

        return NextResponse.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
        console.error("Persona image delete error:", error);
        return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
};
