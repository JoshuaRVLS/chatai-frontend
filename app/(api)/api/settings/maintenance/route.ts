import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const setting = await db.systemSetting.findUnique({
            where: { key: "maintenanceMode" }
        });

        return NextResponse.json({
            maintenanceMode: setting?.value === "true"
        });
    } catch (error) {
        console.error("Maintenance check failed:", error);
        return NextResponse.json({ maintenanceMode: false });
    }
}
