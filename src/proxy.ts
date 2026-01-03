// Proxy - Route protection and authentication checks
// Migrated from middleware.ts for Next.js 16 compatibility
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/books', '/settings', '/wishlist'];

// Routes only for unauthenticated users
const publicOnlyRoutes = ['/login'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (set by Firebase Auth)
  const session = request.cookies.get('session');
  const isAuthenticated = !!session?.value;

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is a public-only route
  const isPublicOnlyRoute = publicOnlyRoutes.includes(pathname);

  // Logged-in user on landing page → redirect to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user on protected route → redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on login → redirect to dashboard
  if (isPublicOnlyRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
