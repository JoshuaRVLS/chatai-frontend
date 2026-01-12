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

    // Define public routes that should ALWAYS be accessible
    const publicRoutes = ['/login', '/register', '/verify-email', '/maintenance', '/suspended', '/access-denied', '/privacy', '/terms'];
    // Check if path is public (exact match or starts with for sub-routes)
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    const [maintenanceSetting, whitelistSetting] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: "maintenanceMode" } }),
        db.systemSetting.findUnique({ where: { key: "whitelistMode" } })
    ]);

    const isMaintenanceMode = maintenanceSetting?.value === "true";
    const isWhitelistMode = whitelistSetting?.value === "true";

    // Optimization: If neither mode is active
    if (!isMaintenanceMode && !isWhitelistMode) {
        // If maintenance is OFF but we are on the maintenance page, redirect to home
        if (pathname.startsWith("/maintenance")) {
            redirect("/");
        }
        return <>{children}</>;
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin || false;
    // Admins are always whitelisted
    const isWhitelisted = session?.user?.isWhitelisted || isAdmin || false;

    // Note: isSuspended is handled by Middleware, no need to check here.

    let shouldRedirect = false;
    let redirectPath = "";

    // 1. Maintenance Mode
    // BLOCKS everyone except Admins.
    // ALLOWS public routes (like login) so admins can actually log in.
    if (isMaintenanceMode && !isAdmin) {
        // If we are NOT on the maintenance page AND NOT on a public route (like login)
        if (!pathname.startsWith("/maintenance") && !isPublicRoute) {
            shouldRedirect = true;
            redirectPath = "/maintenance";
        }
    }
    // 2. Whitelist Mode
    // BLOCKS non-whitelisted users.
    // ALLOWS public routes.
    else if (isWhitelistMode && !isWhitelisted) {
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
