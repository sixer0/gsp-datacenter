// DC-36 — KS-6: setiap route baru/berubah fase document contract menjawab 401 tanpa sesi
// (register 05 §9 "requireSession (tanpa sesi 401)"; §9.6 QH-03: tanpa header kuota karena
// ditolak sebelum tagihan). Route: R21 GET /contracts, R22 GET /search, R23 POST /drafts/check,
// R10 GET + HEAD /files/[id] (HEAD baru, KD-40; ?verify=1, ?name=), R03 GET ?kind=contracts.
// `@/lib/prisma` = proksi DC-36 yang MENOLAK setiap akses di luar transaksi ROLLBACK: 401
// yang sah membuktikan 0 akses DB (akses apa pun akan menjadi 500).
import './_env';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { TEST_NEXTAUTH_SECRET } from './_env';
import { call, hqCookie, params, quotaOf, req, type Called } from './_http';
import { GET as getContracts } from '@/app/api/studio/contracts/route';
import { GET as getSearch } from '@/app/api/studio/search/route';
import { POST as postDraftCheck } from '@/app/api/studio/drafts/check/route';
import { GET as getFile, HEAD as headFile } from '@/app/api/studio/files/[id]/route';
import { GET as getRegistry } from '@/app/api/studio/registry/route';
import crypto from 'node:crypto';

const FILE_ID = 'cdc36file00000000000000000';
const DRAFT = { markdown: '# DRAF x\ntujuan: a\nlangkah-berikut: b\nbasis: baru\n' };

type Probe = [string, (headers: Record<string, string>) => Promise<Called>];

const PROBES: Probe[] = [
  ['R21 GET /contracts', async (h) => call(getContracts(await req('/api/studio/contracts?status=complete', { headers: h })))],
  ['R22 GET /search', async (h) => call(getSearch(await req('/api/studio/search?q=laporan', { headers: h })))],
  ['R23 POST /drafts/check', async (h) => call(postDraftCheck(await req('/api/studio/drafts/check', { body: DRAFT, headers: h })))],
  ['R10 GET /files/[id]', async (h) => call(getFile(await req(`/api/studio/files/${FILE_ID}`, { headers: h }), params({ id: FILE_ID })))],
  ['R10 GET /files/[id]?name=final', async (h) => call(getFile(await req(`/api/studio/files/${FILE_ID}?name=final`, { headers: h }), params({ id: FILE_ID })))],
  ['R10 HEAD /files/[id]?verify=1', async (h) => call(headFile(await req(`/api/studio/files/${FILE_ID}?verify=1`, { method: 'HEAD', headers: h }), params({ id: FILE_ID })))],
  ['R10 HEAD /files/[id]?name=datum', async (h) => call(headFile(await req(`/api/studio/files/${FILE_ID}?name=datum`, { method: 'HEAD', headers: h }), params({ id: FILE_ID })))],
  ['R03 GET /registry?kind=contracts', async (h) => call(getRegistry(await req('/api/studio/registry?kind=contracts', { headers: h })))],
];

function forgedCookie(): string {
  const payload = Buffer.from(JSON.stringify({ u: 'x', r: 'ADMINISTRATOR', p: 'gsp-test', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const sig = crypto.createHmac('sha256', `${TEST_NEXTAUTH_SECRET}-salah`).update(payload).digest('base64url');
  return `gsp_hq_session=${payload}.${sig}`;
}

function expiredCookie(): string {
  const payload = Buffer.from(JSON.stringify({ u: 'x', r: 'ADMINISTRATOR', p: 'gsp-test', exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64url');
  const sig = crypto.createHmac('sha256', TEST_NEXTAUTH_SECRET).update(payload).digest('base64url');
  return `gsp_hq_session=${payload}.${sig}`;
}

const IDENTITIES: Array<[string, () => Record<string, string>]> = [
  ['tanpa identitas', () => ({})],
  ['x-internal-secret salah', () => ({ 'x-internal-secret': 'bukan-rahasia-uji' })],
  ['cookie HQ bertanda tangan salah', () => ({ cookie: forgedCookie() })],
  ['cookie HQ kedaluwarsa', () => ({ cookie: expiredCookie() })],
];

describe('KS-6: route baru 401 tanpa sesi, tanpa header kuota, tanpa akses DB', () => {
  for (const [who, headersOf] of IDENTITIES) {
    it.each(PROBES)(`%s — ${who}`, async (_name, run) => {
      const r = await run(headersOf());
      expect(r.status).toBe(401);
      expect(quotaOf(r.headers)).toEqual([null, null]);
      expect(r.headers.get('x-studio-final-filename')).toBeNull();
      if (_name.startsWith('R10 HEAD')) expect(r.text).toBe('');
      else expect(r.body).toEqual({ error: 'Unauthorized' });
    });
  }

  it('kontrol positif: cookie HQ sah melewati gerbang sesi (bukan 401) pada R10 bentuk id tidak sah', async () => {
    const r = await call(getFile(await req('/api/studio/files/..%2F..', { headers: { cookie: hqCookie('dc36-ok', 'USER') } }), params({ id: '../..' })));
    expect(r.status).toBe(404);
    expect(r.body.code).toBe('FILE_NOT_FOUND');
  });
});
