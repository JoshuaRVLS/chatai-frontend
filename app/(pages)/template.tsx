import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/auth";
import { db } from "@/app/utils/prisma";

export default async function Template({ children }: { children: React.ReactNode }) {
    // Access Control Check - Runs on EVERY navigation (unlike layout)
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";

    let shouldRedirect = false;
    let redirectPath = "";

    const [maintenanceSetting, whitelistSetting] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: "maintenanceMode" } }),
        db.systemSetting.findUnique({ where: { key: "whitelistMode" } })
    ]);

    const session = await getServerSession(authOptions);

    let isAdmin = false;
    let isWhitelisted = false;
    let isSuspended = false;

    const isMaintenanceMode = maintenanceSetting?.value === "true";
    const isWhitelistMode = whitelistSetting?.value === "true";

    if (session?.user?.email) {
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: { isAdmin: true, isWhitelisted: true, suspendedUntil: true }
        });

        if (user) {
            isAdmin = user.isAdmin;
            // Admins are always whitelisted
            isWhitelisted = user.isWhitelisted || user.isAdmin;

            // Check suspension
            if (user.suspendedUntil && !user.isAdmin) {
                isSuspended = new Date(user.suspendedUntil) > new Date();
            }
        }
    }

    const publicRoutes = ['/login', '/register', '/maintenance', '/suspended', '/access-denied', '/privacy', '/terms'];
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // 1. Maintenance Mode Check
    if (isMaintenanceMode && !isAdmin) {
        if (pathname !== "/maintenance") {
            shouldRedirect = true;
            redirectPath = "/maintenance";
        }
    }
    // 2. Suspension Check
    else if (isSuspended) {
        if (pathname !== "/suspended") {
            shouldRedirect = true;
            redirectPath = "/suspended";
        }
    }
    // 3. Whitelist Mode Check
    else if (isWhitelistMode && !isWhitelisted) {
        // If not logged in, allow public routes (like login). 
        // If logged in (but not whitelisted), block access.
        if (!isPublicRoute) {
            shouldRedirect = true;
            redirectPath = "/access-denied";
        }
    }

    // Reverse Checks - REMOVED to prevent loops.
    // If a user is on /suspended but not suspended, they can click "Home" manually.
    // This prevents infinite redirection if session state inconsistent.

    if (shouldRedirect && redirectPath) {
        redirect(redirectPath);
    }

    return <>{children}</>;
}
