import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require auth
    const publicRoutes = ["/login", "/api/auth"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    if (isPublicRoute) {
        return NextResponse.next();
    }

    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });

        // Not authenticated - redirect to login
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Not admin - redirect to login with error
        if (!token.isAdmin) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("error", "AccessDenied");
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    } catch (error) {
        console.error("[MIDDLEWARE_ERROR]", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons).*)"],
};
