import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DEV-ONLY local bypass (never active on Vercel preview/prod builds).
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Skip auth for NextAuth routes, assets, login, and public embeddable charts
  if (
    pathname.startsWith('/api/auth/') ||
    // SEC-004 fix (30-08): hanya GET /api/garden publik; PUT butuh sesi.
    (pathname.startsWith('/api/garden') && request.method === 'GET') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Allow internal agent calls with shared secret
  // SEC-006 fix (30-08): perbandingan constant-time (konsisten webui-rbac).
  const internalSecret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && expectedSecret) {
    const enc = new TextEncoder();
    const a = enc.encode(internalSecret); const b = enc.encode(expectedSecret);
    if (a.length === b.length) {
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      if (diff === 0) return NextResponse.next();
    }
  }

  // Check NextAuth JWT session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
