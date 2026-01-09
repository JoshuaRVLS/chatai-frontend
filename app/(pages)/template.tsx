import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/auth";
import { db } from "@/app/utils/prisma";

export default async function Template({ children }: { children: React.ReactNode }) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";

    // Safety: If pathname missing, don't enforce strict redirects to avoid potential loops
    if (!pathname) return <>{children}</>;

    const [maintenanceSetting, whitelistSetting] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: "maintenanceMode" } }),
        db.systemSetting.findUnique({ where: { key: "whitelistMode" } })
    ]);

    const isMaintenanceMode = maintenanceSetting?.value === "true";
    const isWhitelistMode = whitelistSetting?.value === "true";

    // If neither mode is active, return early (Performance)
    if (!isMaintenanceMode && !isWhitelistMode) {
        return <>{children}</>;
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin || false;
    const isWhitelisted = session?.user?.isWhitelisted || isAdmin || false;
    // Note: isSuspended is handled by Middleware, no need to check here.

    let shouldRedirect = false;
    let redirectPath = "";

    const publicRoutes = ['/login', '/register', '/maintenance', '/suspended', '/access-denied', '/privacy', '/terms'];
    // Check if path is public (exact match or starts with for sub-routes)
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    // 1. Maintenance Mode
    if (isMaintenanceMode && !isAdmin) {
        if (!pathname.startsWith("/maintenance")) {
            shouldRedirect = true;
            redirectPath = "/maintenance";
        }
    }
    // 2. Whitelist Mode
    else if (isWhitelistMode && !isWhitelisted) {
        // Allow public routes (like /login) even in whitelist mode to allow login.
        // But block everything else.
        if (!isPublicRoute) {
            shouldRedirect = true;
            redirectPath = "/access-denied";
        }
    }

    if (shouldRedirect && redirectPath) {
        redirect(redirectPath);
    }

    return <>{children}</>;
}
