import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });

    // Redirect logged-in users away from auth pages
    const publicAuthRoutes = ['/login', '/register'];
    const isPublicAuthRoute = publicAuthRoutes.some(route => pathname === route);

    if (token && isPublicAuthRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Add pathname header for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('[MIDDLEWARE_ERROR]', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api (all API routes - handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|images|icons|fonts).*)',
  ],
};