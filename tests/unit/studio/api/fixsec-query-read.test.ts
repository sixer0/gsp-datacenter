// FIX-SEC (D-402; security DC-41 M-1, L-1) — R21/R22: log baca terstruktur per panggilan sukses,
// opt-in arsip `includeArchived`, byte NUL -> 400 SCHEMA_INVALID ber-pointer (bukan 500).
// Prisma DI-MOCK; layanan I65/I66 di-mock (parser filter + logQueryRead tetap asli); sink log
// query diganti mock (tanpa berkas).
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ queryContracts: vi.fn(), searchBlocks: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/query', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { req } from './_studio';
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { resetQueryRateLimiter } from '@/lib/studio/http/quota';
import { READ_LOG_VALUE_MAX, setQueryLogSink, type QueryLogEntry } from '@/lib/studio/services/query';
import { GET as CONTRACTS } from '@/app/api/studio/contracts/route';
import { GET as SEARCH } from '@/app/api/studio/search/route';

const sink = vi.fn<(e: QueryLogEntry) => void>();

function reads(): QueryLogEntry[] {
  return sink.mock.calls.map((c) => c[0]).filter((e) => e.message === 'query read');
}

function quota(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

beforeEach(() => {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  resetQueryRateLimiter();
  sink.mockReset();
  setQueryLogSink(sink);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  svc.queryContracts.mockReset();
  svc.searchBlocks.mockReset();
  svc.queryContracts.mockResolvedValue({ contracts: [{ documentId: 'a' }, { documentId: 'b' }], nextCursor: 'cmvjwg7mp0000v12csv4n257p' });
  svc.searchBlocks.mockResolvedValue({ hits: [{ pid: 'p1', snippet: 'RAHASIA cuplikan' }], nextCursor: null });
});

afterEach(() => {
  setQueryLogSink(null);
  vi.restoreAllMocks();
  resetQueryRateLimiter();
});

describe('M-1 log baca R21/R22', () => {
  it('R21 sukses -> tepat satu log baca terstruktur (pemanggil, filter, jumlah, correlation id)', async () => {
    const res = await CONTRACTS(await req('/api/studio/contracts?status=complete&mission=misi-a', { auth: 'agent' }));
    expect(res.status).toBe(200);
    const logs = reads();
    expect(logs).toHaveLength(1);
    const e = logs[0];
    expect(e).toMatchObject({ level: 'info', source: 'studio.services.query', code: 'QUERY_READ', correlationId: res.headers.get('x-correlation-id') });
    expect(e.context).toEqual({
      route: '/api/studio/contracts',
      callerKind: 'INTERNAL_AGENT',
      identity: 'anonymous-internal',
      filters: { mission: 'misi-a', status: ['complete'] },
      includeArchived: false,
      resultCount: 2,
      hasNextCursor: true,
    });
  });

  it('R22 sukses -> log baca memuat q dipotong + qLength + jumlah hit, tanpa isi cuplikan; sesi HQ = user:<nama>', async () => {
    const longQ = `laporan ${'x'.repeat(150)}`;
    const res = await SEARCH(await req(`/api/studio/search?q=${encodeURIComponent(longQ)}&includeArchived=1`, { auth: 'admin', user: 'adm9' }));
    expect(res.status).toBe(200);
    const logs = reads();
    expect(logs).toHaveLength(1);
    const ctx = logs[0].context as Record<string, unknown>;
    expect(ctx).toMatchObject({ route: '/api/studio/search', callerKind: 'ADMIN_SESSION', identity: 'user:adm9', resultCount: 1, hasNextCursor: false, includeArchived: true, qLength: longQ.length });
    expect(ctx.q).toBe(`${longQ.slice(0, READ_LOG_VALUE_MAX)}…`);
    expect(ctx.filters).toEqual({ includeArchived: true });
    expect(JSON.stringify(logs[0])).not.toContain('RAHASIA');
  });

  it('sesi Google: email tidak dicatat (identitas di-hash)', async () => {
    const res = await CONTRACTS(await req('/api/studio/contracts', { auth: 'google' }));
    expect(res.status).toBe(200);
    const e = reads()[0];
    expect((e.context as Record<string, unknown>).identity).toMatch(/^google:sha256:[0-9a-f]{12}$/);
    expect(JSON.stringify(e)).not.toContain('agen@gsp.test');
  });

  it('nilai filter dipotong dan karakter kontrol diganti', async () => {
    const mission = `m\t${'y'.repeat(100)}`;
    await CONTRACTS(await req(`/api/studio/contracts?mission=${encodeURIComponent(mission)}`, { auth: 'agent' }));
    const f = (reads()[0].context as { filters: { mission: string } }).filters;
    expect(f.mission).toBe(`m?${'y'.repeat(READ_LOG_VALUE_MAX - 2)}…`);
  });

  it('400 / 429 / 500 tidak menulis log baca', async () => {
    await CONTRACTS(await req('/api/studio/contracts?foo=1', { auth: 'agent' }));
    process.env.STUDIO_QUERY_RATE_LIMIT = '1';
    resetQueryRateLimiter();
    expect((await SEARCH(await req('/api/studio/search?q=ab', { auth: 'agent' }))).status).toBe(200);
    expect((await SEARCH(await req('/api/studio/search?q=ab', { auth: 'agent' }))).status).toBe(429);
    resetQueryRateLimiter();
    svc.queryContracts.mockRejectedValueOnce(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await CONTRACTS(await req('/api/studio/contracts', { auth: 'agent' }))).status).toBe(500);
    expect(reads()).toHaveLength(1);
  });
});

describe('M-1 opt-in arsip includeArchived', () => {
  it('bawaan: filter tanpa includeArchived (arsip dikecualikan layanan); =1 -> includeArchived: true; =0 = bawaan', async () => {
    await CONTRACTS(await req('/api/studio/contracts?status=complete', { auth: 'agent' }));
    await CONTRACTS(await req('/api/studio/contracts?status=complete&includeArchived=1', { auth: 'agent' }));
    await CONTRACTS(await req('/api/studio/contracts?status=complete&includeArchived=0', { auth: 'agent' }));
    expect(svc.queryContracts.mock.calls.map((c) => c[0])).toEqual([
      { status: ['complete'] },
      { status: ['complete'], includeArchived: true },
      { status: ['complete'] },
    ]);
    await SEARCH(await req('/api/studio/search?q=laporan', { auth: 'agent' }));
    await SEARCH(await req('/api/studio/search?q=laporan&includeArchived=1', { auth: 'agent' }));
    expect(svc.searchBlocks.mock.calls.map((c) => c[0])).toEqual([{ q: 'laporan' }, { q: 'laporan', includeArchived: true }]);
  });

  it('includeArchived nilai lain / ganda -> 400 /query/includeArchived tanpa tagihan; parameter tak dikenal tetap 400', async () => {
    for (const path of ['/api/studio/contracts?includeArchived=yes', '/api/studio/search?q=ab&includeArchived=true', '/api/studio/contracts?includeArchived=1&includeArchived=1']) {
      const res = path.startsWith('/api/studio/search') ? await SEARCH(await req(path, { auth: 'agent' })) : await CONTRACTS(await req(path, { auth: 'agent' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('SCHEMA_INVALID');
      expect(body.details).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/query/includeArchived' })]));
      expect(quota(res)).toEqual([null, null]);
    }
    const unk = await CONTRACTS(await req('/api/studio/contracts?archived=1', { auth: 'agent' }));
    expect(unk.status).toBe(400);
    expect((await unk.json()).details).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/query/archived', keyword: 'additionalProperties' })]));
    expect(svc.queryContracts).not.toHaveBeenCalled();
    expect(svc.searchBlocks).not.toHaveBeenCalled();
  });
});

describe('L-1 byte NUL -> 400 SCHEMA_INVALID ber-pointer', () => {
  const cases: Array<[string, string, string]> = [
    ['R22 q', '/api/studio/search?q=x%00y', '/query/q'],
    ['R22 mission', '/api/studio/search?q=ab&mission=a%00b', '/query/mission'],
    ['R22 type', '/api/studio/search?q=ab&type=paragraph,a%00', '/query/type'],
    ['R21 mission', '/api/studio/contracts?mission=a%00b', '/query/mission'],
    ['R21 docNumber', '/api/studio/contracts?docNumber=a%00b', '/query/docNumber'],
    ['R21 owner', '/api/studio/contracts?owner=a%00', '/query/owner'],
  ];
  it.each(cases)('%s', async (_n, path, pointer) => {
    const res = path.startsWith('/api/studio/search') ? await SEARCH(await req(path, { auth: 'agent' })) : await CONTRACTS(await req(path, { auth: 'agent' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(body.details).toEqual(expect.arrayContaining([expect.objectContaining({ pointer, keyword: 'pattern' })]));
    expect(quota(res)).toEqual([null, null]);
    expect(svc.queryContracts).not.toHaveBeenCalled();
    expect(svc.searchBlocks).not.toHaveBeenCalled();
  });
});
