// DC-16 — R22 GET /api/studio/search (register 05 §9, §9.2, §9.6 QH-01..QH-06, T2-69).
// Prisma DI-MOCK; layanan I66 di-mock (parser filter tetap asli): uji urutan galat
// 401 -> 400 -> 429, batas q (C43), header kuota bucket `query`, bentuk 200 ber-pid + alamat.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ queryContracts: vi.fn(), searchBlocks: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/query', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { req } from './_studio';
import type { SearchHitV2 } from '@/lib/studio/contract';
import { SEARCH_LIMITS, STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { resetQueryRateLimiter } from '@/lib/studio/http/quota';
import { GET } from '@/app/api/studio/search/route';

const HIT: SearchHitV2 = {
  documentId: 'cmvjwg7mp0000v12csv4n257p',
  docNumber: '003/GSP/KT/X/2026',
  title: 'Laporan kerja DC-02',
  kind: 'agentWorkReport',
  revisionNo: 3,
  pid: 'p_0001',
  address: '1.1.1',
  slotKey: 'body',
  chapterKey: 'bab1',
  type: 'paragraph',
  snippet: 'isi [[laporan]] kerja',
  rank: 0.1,
};

function quota(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

function url(q: string): string {
  return `/api/studio/search?${q}`;
}

beforeEach(() => {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  resetQueryRateLimiter();
  svc.searchBlocks.mockReset();
  svc.searchBlocks.mockResolvedValue({ hits: [HIT], nextCursor: null });
});

afterEach(() => {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  resetQueryRateLimiter();
});

describe('R22 GET /api/studio/search', () => {
  it('tanpa sesi -> 401 tanpa header kuota', async () => {
    const res = await GET(await req(url('q=laporan')));
    expect(res.status).toBe(401);
    expect(quota(res)).toEqual([null, null]);
    expect(svc.searchBlocks).not.toHaveBeenCalled();
  });

  it('?q=laporan -> 200 hits ber-pid + alamat, query.config simple, header kuota query menurun', async () => {
    const r1 = await GET(await req(url('q=%20laporan%20'), { auth: 'agent' }));
    expect(r1.status).toBe(200);
    const body = await r1.json();
    expect(body).toEqual({ hits: [HIT], nextCursor: null, query: { q: 'laporan', config: 'simple' } });
    expect(body.hits[0].pid).toBeTruthy();
    expect(body.hits[0].address).toBeTruthy();
    expect(svc.searchBlocks).toHaveBeenCalledWith({ q: 'laporan' }, { correlationId: r1.headers.get('x-correlation-id') });
    const r2 = await GET(await req(url('q=laporan'), { auth: 'agent' }));
    expect(quota(r1)[0]).toBe('query');
    expect(Number(quota(r2)[1])).toBe(Number(quota(r1)[1]) - 1);
  });

  it.each([
    ['q tidak ada', ''],
    ['q kosong', 'q='],
    ['q spasi saja', 'q=%20%20%20'],
    ['q di bawah qMin', 'q=a'],
    ['q melebihi qMax', `q=${'x'.repeat(SEARCH_LIMITS.qMax + 1)}`],
  ])('%s -> 400 SCHEMA_INVALID /query/q tanpa tagihan', async (_n, qs) => {
    const res = await GET(await req(url(qs), { auth: 'admin' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(body.details.map((i: { pointer: string }) => i.pointer)).toContain('/query/q');
    expect(quota(res)).toEqual([null, null]);
    expect(svc.searchBlocks).not.toHaveBeenCalled();
  });

  it('parameter tak dikenal dan revisionNo tanpa documentId -> 400', async () => {
    const res = await GET(await req(url('q=laporan&foo=1&revisionNo=2'), { auth: 'user' }));
    expect(res.status).toBe(400);
    const pointers = (await res.json()).details.map((i: { pointer: string }) => i.pointer);
    expect(pointers).toEqual(expect.arrayContaining(['/query/foo', '/query/revisionNo']));
  });

  it("q 'DROP TABLE' -> 200; q diteruskan apa adanya sebagai nilai (bukan SQL)", async () => {
    svc.searchBlocks.mockResolvedValueOnce({ hits: [], nextCursor: null });
    const res = await GET(await req(url(`q=${encodeURIComponent("'; DROP TABLE \"StudioDocument\"; --")}`), { auth: 'agent' }));
    expect(res.status).toBe(200);
    expect((await res.json()).hits).toEqual([]);
    expect(svc.searchBlocks.mock.calls[0]?.[0]).toEqual({ q: `'; DROP TABLE "StudioDocument"; --` });
  });

  it('urutan 401 -> 400 -> 429 dengan kuota 1', async () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '1';
    resetQueryRateLimiter();
    expect((await GET(await req(url('q=laporan'), { auth: 'agent' }))).status).toBe(200);
    expect((await GET(await req(url('q='), { auth: 'agent' }))).status).toBe(400);
    const limited = await GET(await req(url('q=laporan'), { auth: 'agent' }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBeTruthy();
    expect(quota(limited)).toEqual(['query', '0']);
    expect((await GET(await req(url('q=')))).status).toBe(401);
  });

  it('galat layanan tak terduga -> 500 generik tanpa bocor detail, header kuota ada', async () => {
    svc.searchBlocks.mockRejectedValueOnce(new Error('pg: relation leaked'));
    const res = await GET(await req(url('q=laporan'), { auth: 'agent' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.correlationId).toBe(res.headers.get('x-correlation-id'));
    expect(JSON.stringify(body)).not.toContain('leaked');
    expect(quota(res)[0]).toBe('query');
  });
});
