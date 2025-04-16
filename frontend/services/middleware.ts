import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for authentication token in cookies
  const token = request.cookies.get('authToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin/');
  
  // Always allow page refreshes to stay on the current page
  const referer = request.headers.get('referer');
  const isPageRefresh = !!referer && new URL(referer).pathname === request.nextUrl.pathname;

  if (isPageRefresh) {
    return NextResponse.next();
  }
  
  // For API routes, always allow the request
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Only redirect to login if there's no token and not an auth page
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If there's a token and user is trying to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/matrix', request.url));
  }

  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};