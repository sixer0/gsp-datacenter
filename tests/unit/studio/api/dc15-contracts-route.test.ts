// DC-15 — R21 GET /api/studio/contracts (register 05 §9, §9.1, §9.6 QH-01..QH-06, T2-68).
// Prisma DI-MOCK; layanan I65 di-mock (parser filter tetap asli): uji urutan galat
// 401 -> 400 -> 429, header kuota bucket `query`, correlation id, bentuk 200.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ queryContracts: vi.fn(), searchBlocks: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/query', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { req } from './_studio';
import type { ContractSummaryV2 } from '@/lib/studio/contract';
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { resetQueryRateLimiter } from '@/lib/studio/http/quota';
import { GET } from '@/app/api/studio/contracts/route';

const DOC_ID = 'cmvjwg7mp0000v12csv4n257p';

const SUMMARY: ContractSummaryV2 = {
  documentId: DOC_ID,
  docNumber: '003/GSP/KT/X/2026',
  title: 'Laporan kerja DC-02',
  kind: 'agentWorkReport',
  status: null,
  owner: null,
  taskRef: null,
  cardIds: [],
  dueOn: null,
  revisionNo: 1,
  completeness: { status: 'INCOMPLETE', missingRequired: ['record'] },
  missionFolder: null,
  docKey: null,
  updatedAt: '2026-10-30T00:00:00.000Z',
};

function quota(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

beforeEach(() => {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  resetQueryRateLimiter();
  svc.queryContracts.mockReset();
  svc.queryContracts.mockResolvedValue({ contracts: [SUMMARY], nextCursor: null });
});

afterEach(() => {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  resetQueryRateLimiter();
});

describe('R21 GET /api/studio/contracts', () => {
  it('tanpa sesi -> 401 tanpa header kuota dan tanpa memanggil layanan', async () => {
    const res = await GET(await req('/api/studio/contracts?status=complete'));
    expect(res.status).toBe(401);
    expect(quota(res)).toEqual([null, null]);
    expect(svc.queryContracts).not.toHaveBeenCalled();
  });

  it('?status=complete -> 200 bentuk T2-68 (status null diterima), header kuota query menurun', async () => {
    const r1 = await GET(await req('/api/studio/contracts?status=complete', { auth: 'agent' }));
    expect(r1.status).toBe(200);
    expect(r1.headers.get('x-correlation-id')).toBeTruthy();
    const body = await r1.json();
    expect(body).toEqual({ contracts: [SUMMARY], nextCursor: null });
    expect(svc.queryContracts).toHaveBeenCalledWith({ status: ['complete'] }, { correlationId: r1.headers.get('x-correlation-id') });
    const [b1, s1] = quota(r1);
    const r2 = await GET(await req('/api/studio/contracts?status=complete', { auth: 'agent' }));
    const [b2, s2] = quota(r2);
    expect(b1).toBe('query');
    expect(b2).toBe('query');
    expect(Number(s2)).toBe(Number(s1) - 1);
  });

  it('parameter tak dikenal -> 400 SCHEMA_INVALID pointer /query/<nama>, tanpa tagihan', async () => {
    const res = await GET(await req('/api/studio/contracts?foo=1', { auth: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(body.details).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/query/foo' })]));
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    expect(quota(res)).toEqual([null, null]);
    expect(svc.queryContracts).not.toHaveBeenCalled();
  });

  it('nilai tidak sah (status tak dikenal, tanggal kalender salah) -> 400', async () => {
    const res = await GET(await req('/api/studio/contracts?status=bogus&dueBefore=2026-02-30', { auth: 'user' }));
    expect(res.status).toBe(400);
    const pointers = (await res.json()).details.map((i: { pointer: string }) => i.pointer);
    expect(pointers).toEqual(expect.arrayContaining(['/query/status', '/query/dueBefore']));
  });

  it('urutan 401 -> 400 -> 429: kuota habis + parameter salah = 400; kuota habis + sah = 429 Retry-After', async () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '1';
    resetQueryRateLimiter();
    const ok = await GET(await req('/api/studio/contracts', { auth: 'agent' }));
    expect(ok.status).toBe(200);
    expect(quota(ok)).toEqual(['query', '0']);
    const bad = await GET(await req('/api/studio/contracts?foo=1', { auth: 'agent' }));
    expect(bad.status).toBe(400);
    const limited = await GET(await req('/api/studio/contracts', { auth: 'agent' }));
    expect(limited.status).toBe(429);
    expect((await limited.json()).code).toBe('RATE_LIMITED');
    expect(limited.headers.get('Retry-After')).toBeTruthy();
    expect(quota(limited)).toEqual(['query', '0']);
    const anon = await GET(await req('/api/studio/contracts?foo=1'));
    expect(anon.status).toBe(401);
  });

  it('galat layanan tak terduga -> 500 generik ber-correlationId, header kuota tetap ada', async () => {
    svc.queryContracts.mockRejectedValueOnce(new Error('db down: secret detail'));
    const res = await GET(await req('/api/studio/contracts', { auth: 'agent' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal error');
    expect(body.correlationId).toBe(res.headers.get('x-correlation-id'));
    expect(JSON.stringify(body)).not.toContain('secret detail');
    expect(quota(res)[0]).toBe('query');
  });
});
