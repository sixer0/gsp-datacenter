// W2.2: unit test helper requireSession (src/lib/require-session.ts).
// Sengaja TIDAK menstub next-auth — jalur NextAuth diuji lewat cookie nyata yang
// ditolak (tanpa token = bukan sesi), sementara tiga identitas diuji independen:
// tanpa identitas → 401; HQ cookie valid → lolos; secret internal benar → lolos;
// secret salah / env kosong → 401 (fail-closed).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { requireSession } from '@/lib/require-session';

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Tanda tangani cookie sesi HQ persis seperti createSessionToken (src/lib/hq-session.ts). */
function makeHqCookie(u = 'tester'): string {
  const secret = process.env.NEXTAUTH_SECRET!;
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ u, r: 'admin', p: 'gsp-test', exp: Math.floor(Date.now() / 1000) + 3600 }),
    ),
  );
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  return `gsp_hq_session=${payload}.${sig}`;
}

function makeReq(opts: { cookie?: string; internalSecret?: string } = {}): Request {
  const headers = new Headers();
  if (opts.cookie) headers.set('cookie', opts.cookie);
  if (opts.internalSecret !== undefined) headers.set('x-internal-secret', opts.internalSecret);
  return new Request('https://127.0.0.1:9011/api/tasks', { method: 'POST', headers });
}

const saved = { ...process.env };
beforeEach(() => {
  process.env = { ...saved };
  process.env.NEXTAUTH_SECRET = 'unit-test-secret';
  process.env.INTERNAL_API_SECRET = 'unit-internal-secret';
});
afterEach(() => {
  process.env = { ...saved };
});

describe('requireSession (W2.2 helper)', () => {
  it('tanpa identitas → 401', async () => {
    const denied = await requireSession(makeReq());
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(401);
  });

  it('cookie HQ valid → lolos (null)', async () => {
    const denied = await requireSession(makeReq({ cookie: makeHqCookie() }));
    expect(denied).toBeNull();
  });

  it('cookie HQ rusak/tanda tangan salah → 401', async () => {
    const bad = makeHqCookie().replace(/.{8}$/, 'deadbeef');
    const denied = await requireSession(makeReq({ cookie: bad }));
    expect(denied?.status).toBe(401);
  });

  it('cookie HQ kedaluwarsa → 401', async () => {
    const secret = process.env.NEXTAUTH_SECRET!;
    const payload = b64url(
      Buffer.from(JSON.stringify({ u: 'x', r: 'admin', p: 'p', exp: Math.floor(Date.now() / 1000) - 10 })),
    );
    const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
    const denied = await requireSession(makeReq({ cookie: `gsp_hq_session=${payload}.${sig}` }));
    expect(denied?.status).toBe(401);
  });

  it('x-internal-secret benar → lolos (konsumen mesin)', async () => {
    const denied = await requireSession(makeReq({ internalSecret: 'unit-internal-secret' }));
    expect(denied).toBeNull();
  });

  it('x-internal-secret salah → 401', async () => {
    const denied = await requireSession(makeReq({ internalSecret: 'tebak' }));
    expect(denied?.status).toBe(401);
  });

  it('fail-closed: INTERNAL_API_SECRET kosong → header secret apa pun ditolak', async () => {
    delete process.env.INTERNAL_API_SECRET;
    const denied = await requireSession(makeReq({ internalSecret: 'apa-pun' }));
    expect(denied?.status).toBe(401);
  });

  it('fail-closed: NEXTAUTH_SECRET kosong → cookie valid ikut ditolak', async () => {
    const cookie = makeHqCookie(); // ditandatangani dengan secret lama
    process.env.NEXTAUTH_SECRET = 'secret-lain';
    const denied = await requireSession(makeReq({ cookie }));
    expect(denied?.status).toBe(401);
  });
});
