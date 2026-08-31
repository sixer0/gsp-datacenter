import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { readSessionToken } from '@/lib/hq-session';

/**
 * W2.2 helper (F-SEC-004, 31-08-2026): guard level-ROUTE untuk handler mutatif
 * (POST/PATCH/PUT/DELETE).
 *
 * Akar masalah F-SEC-004: 63/77 route hanya bergantung pada middleware.ts, dan
 * middleware bisa dilewati (dev-bypass lama, jalur allowlist, header internal).
 * Guard di level route membuat endpoint mutatif menolak sendiri tanpa sesi —
 * pola yang sama dengan requireSession lokal di api/garden/route.ts (SEC-004),
 * diekstrak ke sini dan diperluas agar setara dengan identitas yang diterima
 * middleware:
 *   1. Sesi NextAuth (Google OAuth)            — token JWT valid
 *   2. Cookie sesi HQ terpadu (gsp_hq_session) — HMAC diverifikasi via hq-session
 *   3. Header secret internal (x-internal-secret == INTERNAL_API_SECRET)
 *      — untuk konsumen mesin SAH yang memang dipanggil antar-service;
 *      konstan-time compare, dan fail-closed bila env secret kosong.
 *
 * Pemakaian di handler:
 *   export async function POST(req: NextRequest) {
 *     const denied = await requireSession(req);
 *     if (denied) return denied;
 *     ...
 *   }
 *
 * Catatan edge-safety: modul ini mengimpor node:crypto (via hq-session) sehingga
 * HANYA untuk runtime node (route handlers), bukan untuk middleware (edge).
 */
export async function requireSession(
  req: NextRequest | Request,
): Promise<NextResponse | null> {
  // 1) NextAuth JWT session
  try {
    const token = await getToken({
      req: req as NextRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token) return null;
  } catch {
    /* lanjut ke identitas berikutnya */
  }

  // 2) Unified HQ session cookie (WebUiUser accounts)
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader
      .split(/;\s*/)
      .find((c) => c.startsWith('gsp_hq_session='));
    const raw = match ? decodeURIComponent(match.slice('gsp_hq_session='.length)) : undefined;
    if (raw && readSessionToken(raw)) return null;
  } catch {
    /* invalid cookie → tolak */
  }

  // 3) Internal shared-secret (machine callers) — fail-closed tanpa env
  const internalSecret = req.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret && expectedSecret) {
    const enc = new TextEncoder();
    const a = enc.encode(internalSecret);
    const b = enc.encode(expectedSecret);
    if (a.length === b.length) {
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      if (diff === 0) return null;
    }
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
