import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/require-session';
import { projectGardenPublic } from '@/lib/garden-public';

// SEC-004 fix (30-08): guard di LEVEL ROUTE (bukan hanya middleware) — PUT /api/garden
// wajib sesi, terlepas dari dev-bypass middleware. Sejak W2.2 memakai helper bersama
// src/lib/require-session.ts (NextAuth | cookie HQ | secret internal) — guard lokal
// lama hanya menerima NextAuth sehingga pengguna login terpadu HQ ikut ditolak.

// Shared garden blob — same source as Marwa's dashboard (source of truth)
const GARDEN_BLOB = 'https://jsonblob.com/api/jsonBlob/019cce3a-7bc9-7e88-9e8f-fe461957b1aa';

// W3.2 (F-SEC-006 sisa): proyeksi field publik untuk respons anonim ada di
// src/lib/garden-public.ts (teruji unit).

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(GARDEN_BLOB, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`jsonblob GET failed: ${res.status}`);
    const data = await res.json();
    // W3.2: pemanggil ber-identitas (sesi HQ/NextAuth/secret internal) melihat blob
    // utuh seperti sebelumnya; anonim hanya menerima proyeksi field publik.
    const denied = await requireSession(req);
    if (!denied) return NextResponse.json(data);
    return NextResponse.json(projectGardenPublic(data));
  } catch (e) {
    console.error('Garden GET error:', e);
    return NextResponse.json({ error: 'Failed to fetch garden' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const res = await fetch(GARDEN_BLOB, {
      method: 'PUT',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`jsonblob PUT failed: ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Garden PUT error:', e);
    return NextResponse.json({ error: 'Failed to update garden' }, { status: 500 });
  }
}
