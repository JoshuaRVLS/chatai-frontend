// middleware.ts
import {getToken} from 'next-auth/jwt';
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export async function middleware(request: NextRequest) {
  const token =
      await getToken({req: request, secret: process.env.NEXTAUTH_SECRET});

  const {pathname} = request.nextUrl;

  // Routes that should be accessible only to unauthenticated users
  const authRoutes = ['/login', '/register'];

  // Routes that require authentication
  const protectedRoutes = ['/', '/create_character', '/my_characters'];

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Redirect authenticated users away from auth routes
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users from protected routes to login
  if (!isAuthenticated && protectedRoutes.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect URL for after login
    loginUrl.searchParams.set('/', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};