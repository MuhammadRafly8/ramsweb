import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
  
  // Improve page refresh detection by checking referer against current URL
  const referer = request.headers.get('referer');
  const isPageRefresh = !!referer && new URL(referer).pathname === request.nextUrl.pathname;

  // For any page refresh, always allow the user to stay on the current page
  if (isPageRefresh) {
    return NextResponse.next();
  }
  
  // Only redirect to login if there's no token and not an auth page
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If there's a token and user is trying to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
