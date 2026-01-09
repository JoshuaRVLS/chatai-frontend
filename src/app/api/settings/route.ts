import { db } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dbSettings = await db.systemSetting.findMany();
        const settings: Record<string, string> = {};
        dbSettings.forEach(s => {
            settings[s.key] = s.value;
        });

        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode === "true",
            allowRegistration: settings.allowRegistration !== "false", // Default to true
        });
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { maintenanceMode, allowRegistration } = await request.json();

        const updates = [];
        if (maintenanceMode !== undefined) {
            updates.push(db.systemSetting.upsert({
                where: { key: "maintenanceMode" },
                update: { value: String(maintenanceMode) },
                create: { key: "maintenanceMode", value: String(maintenanceMode) }
            }));
        }
        if (allowRegistration !== undefined) {
            updates.push(db.systemSetting.upsert({
                where: { key: "allowRegistration" },
                update: { value: String(allowRegistration) },
                create: { key: "allowRegistration", value: String(allowRegistration) }
            }));
        }

        await db.$transaction(updates);

        return NextResponse.json({ message: "Settings updated successfully" });
    } catch (error) {
        console.error("Failed to update settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
