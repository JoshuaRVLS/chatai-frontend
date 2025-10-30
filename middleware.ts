
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


    const publicRoutes = ['/login', '/register', '/api/auth'];


    const protectedRoutes =
        ['/', '/create_character', '/my_characters', '/edit_character'];


    const isProtectedRoute = protectedRoutes.some(
        route => pathname === route || pathname.startsWith(route + '/'));


    const isPublicAuthRoute = publicRoutes.some(
        route => pathname === route || pathname.startsWith(route));


    if (!token && isProtectedRoute) {
      console.log(
          '🚫 Unauthenticated access to protected route, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }


    if (token && isPublicAuthRoute) {
      console.log(
          '✅ Authenticated user accessing auth route, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('✅ Allowing access to:', pathname);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Middleware error:', error);

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