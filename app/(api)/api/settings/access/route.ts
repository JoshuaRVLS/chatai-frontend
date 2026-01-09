import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        const [whitelistModeSetting, allowRegistrationSetting] = await Promise.all([
            db.systemSetting.findUnique({ where: { key: "whitelistMode" } }),
            db.systemSetting.findUnique({ where: { key: "allowRegistration" } })
        ]);

        const whitelistMode = whitelistModeSetting?.value === "true";
        const allowRegistration = allowRegistrationSetting?.value !== "false";

        // If email is provided, check if user is whitelisted
        let isWhitelisted = false;
        if (email && whitelistMode) {
            const user = await db.user.findUnique({
                where: { email: email.toLowerCase().trim() },
                select: { isWhitelisted: true, isAdmin: true }
            });
            // Admins are always considered whitelisted
            isWhitelisted = !!(user?.isWhitelisted || user?.isAdmin);
        }

        return NextResponse.json({
            whitelistMode,
            allowRegistration,
            isWhitelisted
        });
    } catch (error) {
        console.error("Access check failed:", error);
        return NextResponse.json({
            whitelistMode: false,
            allowRegistration: true,
            isWhitelisted: false
        });
    }
}
