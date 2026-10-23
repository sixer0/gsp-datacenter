// FIX-SEC N-08 (SR-57, D-247): perbandingan x-internal-secret waktu-konstan
// (isi dan panjang) di src/lib/require-session.ts (node: HMAC + timingSafeEqual)
// dan src/middleware.ts (edge: Web Crypto HMAC + XOR penuh). Hanya rahasia uji
// palsu dari env proses uji; tidak ada cookie sesi yang dibuat.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Probe = { kind: 'next' | 'json' | 'redirect'; status?: number };
let lastProbe: Probe | null = null;

vi.mock('next/server', () => {
  class NextResponse {
    constructor(public probe: Probe) {
      lastProbe = probe;
    }
    static next() {
      return new NextResponse({ kind: 'next' });
    }
    static json(_b: unknown, init?: { status?: number }) {
      return new NextResponse({ kind: 'json', status: init?.status ?? 200 });
    }
    static redirect() {
      return new NextResponse({ kind: 'redirect' });
    }
  }
  return { NextResponse };
});
vi.mock('next-auth/jwt', () => ({ getToken: async () => null }));

const TEST_SECRET = 'fixsec-unit-internal-secret-0123456789';
const saved = { ...process.env };

beforeEach(() => {
  process.env = { ...saved };
  process.env.NEXTAUTH_SECRET = 'fixsec-unit-nextauth';
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  delete process.env.ALLOW_DEV_BYPASS;
});
afterEach(() => {
  process.env = { ...saved };
});

function mwRequest(secret?: string) {
  const url = new URL('https://127.0.0.1:9021/api/studio/documents');
  const headers = new Headers();
  if (secret !== undefined) headers.set('x-internal-secret', secret);
  return { nextUrl: url, method: 'GET', headers, cookies: { get: () => undefined }, url: url.toString() } as never;
}

async function runMiddleware(secret?: string): Promise<Probe | null> {
  lastProbe = null;
  vi.resetModules();
  const mod = await import('../../../../src/middleware');
  await mod.middleware(mwRequest(secret));
  return lastProbe;
}

describe('require-session secretEqualsConstantTime (node)', () => {
  it('sama -> true; beda isi / beda panjang / kosong -> false', async () => {
    const { secretEqualsConstantTime } = await import('@/lib/require-session');
    expect(secretEqualsConstantTime(TEST_SECRET, TEST_SECRET)).toBe(true);
    expect(secretEqualsConstantTime(TEST_SECRET.replace(/9$/, '8'), TEST_SECRET)).toBe(false);
    expect(secretEqualsConstantTime(TEST_SECRET + 'x', TEST_SECRET)).toBe(false);
    expect(secretEqualsConstantTime(TEST_SECRET.slice(0, 5), TEST_SECRET)).toBe(false);
    expect(secretEqualsConstantTime('', TEST_SECRET)).toBe(false);
    expect(secretEqualsConstantTime('é', 'é')).toBe(false);
  });

  it('requireSession: rahasia benar lolos, salah/panjang beda 401, env kosong fail-closed', async () => {
    const { requireSession } = await import('@/lib/require-session');
    const mk = (s?: string) => {
      const h = new Headers();
      if (s !== undefined) h.set('x-internal-secret', s);
      return new Request('https://127.0.0.1:9021/api/studio/assets', { method: 'POST', headers: h });
    };
    // NextResponse distub: respons penolakan membawa `probe` {kind:'json', status}.
    const status = async (s?: string) => {
      const r = (await requireSession(mk(s))) as unknown as { probe?: Probe } | null;
      return r === null ? 'pass' : r.probe?.status;
    };
    expect(await status(TEST_SECRET)).toBe('pass');
    expect(await status('short')).toBe(401);
    expect(await status(TEST_SECRET + 'tail')).toBe(401);
    expect(await status(TEST_SECRET.replace(/9$/, '8'))).toBe(401);
    expect(await status()).toBe(401);
    delete process.env.INTERNAL_API_SECRET;
    expect(await status(TEST_SECRET)).toBe(401);
  });
});

describe('middleware secretEqualsEdge (Web Crypto)', () => {
  it('rahasia benar -> next', async () => {
    expect((await runMiddleware(TEST_SECRET))?.kind).toBe('next');
  });
  it('salah isi / panjang beda / tanpa header -> 401', async () => {
    for (const s of [TEST_SECRET.replace(/0/, '1'), 'x', TEST_SECRET + TEST_SECRET, undefined]) {
      const p = await runMiddleware(s);
      expect(p).toEqual({ kind: 'json', status: 401 });
    }
  });
  it('env rahasia kosong -> fail-closed 401', async () => {
    delete process.env.INTERNAL_API_SECRET;
    expect(await runMiddleware(TEST_SECRET)).toEqual({ kind: 'json', status: 401 });
  });
});

describe('N-08 bukti statis: tidak ada kembali-awal berbasis panjang', () => {
  it.each(['src/lib/require-session.ts', 'src/middleware.ts'])('%s', (rel) => {
    const src = readFileSync(path.resolve(__dirname, '../../../../', rel), 'utf8');
    expect(src).not.toMatch(/\.length\s*===\s*\w+\.length/);
    expect(src).not.toMatch(/\.length\s*!==\s*\w+\.length/);
  });
});
