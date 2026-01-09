
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

    // Maintenance Mode Check - block non-admins from all pages except /maintenance
    if (pathname !== '/maintenance' && !pathname.startsWith('/api/')) {
      const maintenanceMode = await checkMaintenanceMode();
      if (maintenanceMode) {
        const isAdmin = !!(token as any)?.isAdmin;
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    }

    const publicAuthRoutes = ['/login', '/register'];
    const isPublicAuthRoute = publicAuthRoutes.some(route => pathname === route);

    if (token && isPublicAuthRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }

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

// Check maintenance mode via API or direct DB access
async function checkMaintenanceMode(): Promise<boolean> {
  try {
    // Use fetch to call an internal API since we can't use Prisma in Edge middleware
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/settings/maintenance`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return data.maintenanceMode === true;
    }
  } catch (error) {
    console.error('[MAINTENANCE_CHECK_ERROR]', error);
  }
  return false;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|images|icons|fonts).*)',
  ],
};