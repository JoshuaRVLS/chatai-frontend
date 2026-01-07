import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
    try {
        const tags = await db.lorebookTag.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json({ success: true, data: tags });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const tag = await db.lorebookTag.upsert({
            where: { name },
            update: {},
            create: { name },
        });

        return NextResponse.json({ success: true, data: tag }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
