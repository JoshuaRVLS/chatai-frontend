
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

    const isAdmin = !!(token as any)?.isAdmin;

    // Check maintenance mode status
    const maintenanceMode = await checkMaintenanceMode();

    // Maintenance Mode Check - block non-admins from all pages except /maintenance
    if (pathname !== '/maintenance' && !pathname.startsWith('/api/')) {
      if (maintenanceMode && !isAdmin) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }

    // REVERSE CHECK: Redirect away from /maintenance if maintenance is OFF
    if (pathname === '/maintenance' && !maintenanceMode) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check whitelist mode status
    const accessCheck = await checkWhitelistMode(token?.email as string | undefined);

    // Whitelist Mode Check - only whitelisted users can access the site
    const publicRoutes = ['/login', '/register', '/access-denied', '/maintenance', '/suspended'];
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    if (!isPublicRoute && !pathname.startsWith('/api/')) {
      if (accessCheck.whitelistMode && !accessCheck.isWhitelisted) {
        // User is not whitelisted, redirect to access denied
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }

    // REVERSE CHECK: Redirect away from /access-denied if whitelist mode is OFF or user IS whitelisted
    if (pathname === '/access-denied') {
      if (!accessCheck.whitelistMode || accessCheck.isWhitelisted) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Check suspension status
    const suspensionCheck = token?.email
      ? await checkSuspension(token.email as string)
      : { isSuspended: false };

    // Suspension Check - block suspended users from all pages except /suspended
    if (!isPublicRoute && !pathname.startsWith('/api/') && token?.email) {
      if (suspensionCheck.isSuspended) {
        return NextResponse.redirect(new URL('/suspended', request.url));
      }
    }

    // REVERSE CHECK: Redirect away from /suspended if user is NOT suspended
    if (pathname === '/suspended' && !suspensionCheck.isSuspended) {
      return NextResponse.redirect(new URL('/', request.url));
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

// Check whitelist mode and if user is whitelisted
async function checkWhitelistMode(email?: string): Promise<{ whitelistMode: boolean; isWhitelisted: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = email
      ? `${baseUrl}/api/settings/access?email=${encodeURIComponent(email)}`
      : `${baseUrl}/api/settings/access`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        whitelistMode: data.whitelistMode === true,
        isWhitelisted: data.isWhitelisted === true
      };
    }
  } catch (error) {
    console.error('[WHITELIST_CHECK_ERROR]', error);
  }
  return { whitelistMode: false, isWhitelisted: false };
}

// Check if user is suspended
async function checkSuspension(email: string): Promise<{ isSuspended: boolean }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/settings/suspended?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return { isSuspended: data.isSuspended === true };
    }
  } catch (error) {
    console.error('[SUSPENSION_CHECK_ERROR]', error);
  }
  return { isSuspended: false };
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