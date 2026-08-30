import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Nama cookie sesi HQ. Sengaja didefinisikan ulang di sini (bukan diimpor dari
// src/lib/hq-session.ts) karena modul itu memakai node:crypto yang tidak hadir
// di runtime edge tempat middleware berjalan.
const SESSION_COOKIE = 'gsp_hq_session';

/**
 * GSP Swarm HQ auth gate.
 *
 * Accepted identities (any one is enough):
 *   1. NextAuth Google session        (pages.signIn = /login; needs Google OAuth env)
 *   2. Unified HQ session cookie      (gsp_hq_session — issued by /api/auth/login,
 *                                      verified against WebUiUser = same accounts as
 *                                      the Brahma WebUI)
 *   3. Internal agent shared secret   (x-internal-secret == INTERNAL_API_SECRET)
 *
 * Self-guarded machine routes: /api/brahma/rbac/* is reached only by the Brahma
 * WebUI backend, which authenticates itself with x-rbac-token (== WEBUI_RBAC_TOKEN)
 * inside the handlers. It must stay reachable pre-session or the WebUI login
 * screen cannot validate credentials at all (fix 30-08-2026).
 */

// ── edge-safe HMAC session check (no node:crypto in middleware runtime) ─────
function b64urlToB64(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}
function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function verifyHqSession(raw: string | undefined): Promise<boolean> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || !raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expected = bytesToB64url(new Uint8Array(mac));
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return false;
    const data = JSON.parse(atob(b64urlToB64(payload))) as { exp?: number };
    return typeof data.exp === 'number' && data.exp * 1000 >= Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DEV-ONLY local bypass (never active on Vercel preview/prod builds).
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Skip auth for NextAuth routes, the unified login/logout endpoints,
  // assets, the login page, and public embeddable charts.
  if (
    pathname.startsWith('/api/auth/') ||
    // SEC-004 fix (30-08): hanya GET /api/garden publik; PUT butuh sesi.
    (pathname.startsWith('/api/garden') && request.method === 'GET') ||
    // RBAC bridge untuk WebUI Brahma — handler menjaga diri via x-rbac-token.
    pathname.startsWith('/api/brahma/rbac') ||
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

  // Unified HQ session cookie (Swarm/Brahma accounts)
  if (await verifyHqSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  // NextAuth JWT session (Google OAuth)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
