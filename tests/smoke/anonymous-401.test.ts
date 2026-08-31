// W2.3 smoke suite: assert 401 untuk endpoint kunci TANPA identitas (anonim).
// Menjalan terhadap HQ live (https://127.0.0.1:9011, produksi hq-server.mjs).
// AUTO-SKIP bila HQ mati — `npm test` tetap hijau di lingkungan tanpa HQ, dan
// verifier bisa memaksa dengan HQ_SMOKE_REQUIRED=1 (fail keras bila HQ mati).
// Semua probe read-only / mutasi-ditolak: tidak ada tulis data di suite ini.
import { describe, it, expect } from 'vitest';
import net from 'node:net';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://127.0.0.1:9011';

async function hqAlive(): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createConnection({ host: '127.0.0.1', port: 9011 });
    const done = (v: boolean) => {
      s.destroy();
      resolve(v);
    };
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
    setTimeout(() => done(false), 2000);
  });
}

const alive = await hqAlive();
if (!alive && process.env.HQ_SMOKE_REQUIRED === '1') {
  throw new Error('HQ hidup di 127.0.0.1:9011 wajib ada saat HQ_SMOKE_REQUIRED=1');
}

async function probe(path: string, init?: RequestInit) {
  const r = await fetch(BASE + path, { redirect: 'manual', ...init });
  return r.status;
}

describe.skipIf(!alive)('smoke 401 anonim — endpoint kunci (W2.3)', () => {
  // Endpoint mutatif kunci: harus 401 tanpa identitas (middleware + guard route).
  it('GET /api/agents anonim → 401 (roster tidak boleh bocor)', async () => {
    expect(await probe('/api/agents')).toBe(401);
  });
  it('GET /api/orchestration anonim → 401', async () => {
    expect(await probe('/api/orchestration')).toBe(401);
  });
  it('GET /api/brahma/tasks anonim → 401', async () => {
    expect(await probe('/api/brahma/tasks')).toBe(401);
  });
  it('PUT /api/garden → 401 (SEC-004 regression)', async () => {
    expect(await probe('/api/garden', { method: 'PUT', body: '{}' })).toBe(401);
  });
  it('POST /api/tasks → 401', async () => {
    expect(await probe('/api/tasks', { method: 'POST', body: '{}' })).toBe(401);
  });
  it('POST /api/agent-bus → 401', async () => {
    expect(await probe('/api/agent-bus', { method: 'POST', body: '{}' })).toBe(401);
  });
  it('POST /api/brahma/dispatch → 401', async () => {
    expect(await probe('/api/brahma/dispatch', { method: 'POST', body: '{}' })).toBe(401);
  });
  it('DELETE /api/user-access/999999 → 401', async () => {
    expect(await probe('/api/user-access/999999', { method: 'DELETE' })).toBe(401);
  });
  it('POST /api/information-library/propose → 401', async () => {
    expect(await probe('/api/information-library/propose', { method: 'POST', body: '{}' })).toBe(401);
  });

  // RBAC bridge: fail-closed tanpa token (handler menjaga diri).
  it('POST /api/brahma/rbac/login tanpa token → 401', async () => {
    expect(
      await probe('/api/brahma/rbac/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'x', password: 'y' }),
      }),
    ).toBe(401);
  });

  // Endpoint mati hasil W1.2: tidak boleh kembali hidup (404/401, bukan 200/500).
  it('POST /api/trends/update → 401/404 (endpoint mati W1.2)', async () => {
    expect([401, 404]).toContain(await probe('/api/trends/update', { method: 'POST', body: '{}' }));
  });
  it('POST /api/watchlist-radar/update → 401/404 (endpoint mati W1.2)', async () => {
    expect([401, 404]).toContain(await probe('/api/watchlist-radar/update', { method: 'POST', body: '{}' }));
  });

  // Allowlist sah: GET /api/garden anonim TIDAK boleh diblok auth. Assert "bukan 401"
  // (bukan 200) karena handler mem-proxy jsonblob eksternal — upstream mati/403
  // menghasilkan 500 yang bukan regresi auth (pembatasan payload = W3.2).
  it('GET /api/garden anonim → bukan 401 (by-design publik di allowlist)', async () => {
    expect(await probe('/api/garden')).not.toBe(401);
  });

  // Halaman non-api tanpa sesi → redirect ke /login (redirect:'manual' → kode 3xx).
  it('GET /tasks tanpa sesi → redirect 302/307', async () => {
    expect([302, 307]).toContain(await probe('/tasks'));
  });
});
