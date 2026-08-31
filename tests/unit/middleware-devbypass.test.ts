// W2.1 (F-SEC-003): gerbang dev-bypass middleware.
// Kontrak: mode development TANPA flag ALLOW_DEV_BYPASS=1 tetap MENGHUNGKAPI /api
// (401); dengan flag → bypass. Produksi selalu menggunkan guard penuh.
//
// Strategi: modul next/server & next-auth/jwt distub agar middleware.ts asli
// bisa dijalankan murni di node (tanpa runtime Next). Ini menguji PERILAKU
// publik middleware (respons 401/redirect/next), bukan implementasi internal.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── stub next/server ─────────────────────────────────────────────────────────
type Probe = { kind: 'next' | 'json' | 'redirect'; status?: number; location?: string };
let lastProbe: Probe | null = null;

vi.mock('next/server', () => {
  class NextResponse {
    probe: Probe;
    constructor(probe: Probe) {
      this.probe = probe;
      lastProbe = probe;
    }
    static next() {
      return new NextResponse({ kind: 'next' });
    }
    static json(body: unknown, init?: { status?: number }) {
      return new NextResponse({ kind: 'json', status: init?.status ?? 200 });
    }
    static redirect(url: string | URL) {
      return new NextResponse({ kind: 'redirect', location: String(url) });
    }
  }
  return { NextResponse };
});

vi.mock('next-auth/jwt', () => ({
  // Tidak pernah ada sesi NextAuth di test ini — jalur yang diuji adalah gerbang dev.
  getToken: async () => null,
}));

function makeRequest(pathname: string, method = 'GET') {
  const url = new URL(`https://127.0.0.1:9011${pathname}`);
  return {
    nextUrl: url,
    method,
    headers: new Headers(),
    cookies: { get: (_n: string) => undefined },
    url: url.toString(),
  } as any;
}

async function runMiddleware(pathname: string, method = 'GET'): Promise<Probe | null> {
  lastProbe = null;
  // import dinamis + reset modul agar baca env terbaru tiap kasus
  vi.resetModules();
  const mod = await import('../../src/middleware');
  await mod.middleware(makeRequest(pathname, method));
  return lastProbe;
}

describe('middleware dev-bypass gate (W2.1 / F-SEC-003)', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...savedEnv };
    // NEXTAUTH_SECRET diset agar jalur sesi tidak bocor via secret kosong
    process.env.NEXTAUTH_SECRET = 'test-secret';
    delete process.env.ALLOW_DEV_BYPASS;
    delete process.env.INTERNAL_API_SECRET;
  });

  it('development TANPA flag → /api ditolak 401 (bukan bypass)', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'development';
    const probe = await runMiddleware('/api/tasks', 'POST');
    expect(probe).toEqual({ kind: 'json', status: 401 });
  });

  it('development TANPA flag → halaman non-api redirect ke /login', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'development';
    const probe = await runMiddleware('/dashboard');
    expect(probe?.kind).toBe('redirect');
    expect(probe?.location).toContain('/login');
  });

  it('development DENGAN ALLOW_DEV_BYPASS=1 → bypass (NextResponse.next)', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_BYPASS = '1';
    const probe = await runMiddleware('/api/tasks', 'POST');
    expect(probe?.kind).toBe('next');
  });

  it('development DENGAN flag ≠ "1" → tetap 401 (hanya "1" yang sah)', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_BYPASS = 'true';
    const probe = await runMiddleware('/api/tasks', 'POST');
    expect(probe).toEqual({ kind: 'json', status: 401 });
  });

  it('production → tidak ada bypass meski flag terpasang', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEV_BYPASS = '1';
    const probe = await runMiddleware('/api/tasks', 'POST');
    expect(probe).toEqual({ kind: 'json', status: 401 });
  });

  it('allowlist tetap jalan meski gerbang tertutup: GET /api/garden anonim lolos', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'production';
    const probe = await runMiddleware('/api/garden', 'GET');
    expect(probe?.kind).toBe('next');
  });

  it('allowlist tidak membiarkan PUT /api/garden anonim → 401 (regression SEC-004)', async () => {
    // @ts-expect-error NODE_ENV readonly di type node
    process.env.NODE_ENV = 'production';
    const probe = await runMiddleware('/api/garden', 'PUT');
    expect(probe).toEqual({ kind: 'json', status: 401 });
  });
});
