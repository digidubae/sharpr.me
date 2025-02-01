import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Allow auth-related paths and homepage
  if (request.nextUrl.pathname.startsWith('/api/auth') || 
      request.nextUrl.pathname === '/favicon.ico' ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname === '/privacy-policy' ||
      request.nextUrl.pathname === '/about' ||
      request.nextUrl.pathname === '/faq' ||
      request.nextUrl.pathname.startsWith('/example/') ||
      request.nextUrl.pathname.startsWith('/tinymce/')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    // If the request is an API call, return 401
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // For page requests, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /static (static files)
     * 3. /favicon.ico, /robots.txt (static files)
     * 4. /tinymce (TinyMCE files)
     */
    '/((?!_next|static|tinymce|favicon.ico|robots.txt).*)',
  ],
}; 