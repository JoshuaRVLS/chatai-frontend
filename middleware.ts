// middleware.ts
import {getToken} from 'next-auth/jwt';
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  console.log('🛠️ Middleware executing for path:', pathname);

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });

    console.log('🔐 Token found:', !!token);
    console.log('🔑 Token content:', token);

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/api/auth'];

    // Protected routes that require authentication
    const protectedRoutes =
        ['/', '/create_character', '/my_characters', '/edit_character'];

    // Check if current path is a protected route
    const isProtectedRoute = protectedRoutes.some(
        route => pathname === route || pathname.startsWith(route + '/'));

    // Check if current path is a public auth route
    const isPublicAuthRoute = publicRoutes.some(
        route => pathname === route || pathname.startsWith(route));

    // If user is NOT authenticated and trying to access protected route
    if (!token && isProtectedRoute) {
      console.log(
          '🚫 Unauthenticated access to protected route, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If user IS authenticated and trying to access public auth routes
    if (token && isPublicAuthRoute) {
      console.log(
          '✅ Authenticated user accessing auth route, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('✅ Allowing access to:', pathname);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Middleware error:', error);
    // On error, allow the request to proceed
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
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|images|icons|fonts).*)',
  ],
};