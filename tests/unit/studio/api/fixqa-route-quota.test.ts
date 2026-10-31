// FIX-QA / FIX-R40-1 — header kuota (QH-01..QH-05) pada route yang menagih bucket render
// tetapi dulu hanya membawanya pada 429: R04 POST documents, R12/R13 kiriman bab/slot
// (submit-kit), R06 PATCH blok, R16 PATCH pid, R14 PATCH struktur. QH-03: 2xx/4xx/5xx
// SESUDAH tagihan membawa C48/C49; 401 dan penolakan sebelum tagihan tidak.
// Prisma dan layanan tulis DI-MOCK (tanpa DB, tanpa server dev).
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({
  submitChapter: vi.fn(),
  submitSlot: vi.fn(),
  ingestDocument: vi.fn(),
  patchBlock: vi.fn(),
  patchPid: vi.fn(),
  patchStructure: vi.fn(),
}));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({
  ...(await orig<object>()),
  submitChapter: svc.submitChapter,
  submitSlot: svc.submitSlot,
}));
vi.mock('@/lib/studio/services/ingest', async (orig) => ({ ...(await orig<object>()), ingestDocument: svc.ingestDocument }));
vi.mock('@/lib/studio/services/revisions', async (orig) => ({
  ...(await orig<object>()),
  patchBlock: svc.patchBlock,
  patchPid: svc.patchPid,
  patchStructure: svc.patchStructure,
}));

import { on } from './_prisma';
import { req, type ReqOpts } from './_studio';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { resetRenderRateLimiter } from '@/lib/studio/http';
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/http/quota';
import { POST as postDocument } from '@/app/api/studio/documents/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { PATCH as patchBlockRoute } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { PATCH as patchPidRoute } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { PATCH as patchStructureRoute } from '@/app/api/studio/documents/[id]/structure/route';

const DOC_ID = 'cmvucp1d70002v13c945whd78';
const CHANGE = { what: 'uji header kuota', why: 'FIX-R40-1', impact: 'tidak ada' };

function qh(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

function submitResult() {
  return {
    unchanged: false,
    created: true,
    rebased: false,
    document: { id: DOC_ID },
    revision: { revisionNo: 1, changeScope: 'chapter' },
    completeness: { status: 'partial' },
  };
}

function chapterBody(): Record<string, unknown> {
  return {
    $schema: 'studio.chapter/v2',
    agentId: 'fixqa',
    target: { mission: { folder: '2026-10-30_fixqa' }, docKey: 'laporan-survei' },
    chapter: {
      key: '4',
      title: { text: 'Bab 4 uji' },
      sections: [{ title: { text: 'Bagian pertama' }, blocks: [{ type: 'paragraph', text: 'Pengukuran beban dilakukan pada jam puncak.' }] }],
    },
  };
}

function slotBody(): Record<string, unknown> {
  return {
    $schema: 'studio.slot/v2',
    agentId: 'fixqa',
    target: { documentId: DOC_ID },
    slot: 'controlSheet',
    payload: { type: 'signatureBlock', roles: [{ role: { text: 'Disusun' }, holder: { text: 'Analis' } }] },
  };
}

type Route = {
  name: string;
  /** Kirim permintaan (opsi auth/badan). */
  call: (opts: ReqOpts) => Promise<Response>;
  /** Badan sah sampai titik tagihan. */
  body: () => unknown;
  /** Atur layanan: 2xx. */
  ok: () => void;
  okStatus: number;
  /** Atur layanan: lempar galat (4xx/5xx) sesudah tagihan. */
  fail: (err: unknown) => void;
  /** Badan yang ditolak SEBELUM tagihan (400). */
  preCharge: () => unknown;
};

const ROUTES: Route[] = [
  {
    name: 'R04 POST documents (v1)',
    call: async (o) => postDocument(await req('/api/studio/documents', o)),
    body: () => ({ agentId: 'fixqa', doc: {} }),
    ok: () => {
      svc.ingestDocument.mockResolvedValueOnce({
        valid: true,
        document: { id: DOC_ID, docNumber: 'D-1' },
        revision: { id: 'rev1', revisionNo: 1, releaseStatus: 'DRAFT' },
        lint: [],
      });
      on('studioRevision', 'findUnique', async () => null);
      on('studioBlock', 'findMany', async () => []);
    },
    okStatus: 201,
    fail: (err) => svc.ingestDocument.mockRejectedValueOnce(err),
    preCharge: () => ({ $schema: 'studio.unknown/v9' }),
  },
  {
    name: 'R12 POST chapters',
    call: async (o) => postChapter(await req('/api/studio/chapters', o)),
    body: chapterBody,
    ok: () => svc.submitChapter.mockResolvedValueOnce(submitResult()),
    okStatus: 201,
    fail: (err) => svc.submitChapter.mockRejectedValueOnce(err),
    preCharge: () => ({ $schema: 'studio.chapter/v2' }),
  },
  {
    name: 'R13 POST slots',
    call: async (o) => postSlot(await req('/api/studio/slots', o)),
    body: slotBody,
    ok: () => svc.submitSlot.mockResolvedValueOnce(submitResult()),
    okStatus: 201,
    fail: (err) => svc.submitSlot.mockRejectedValueOnce(err),
    preCharge: () => ({ $schema: 'studio.slot/v2' }),
  },
  {
    name: 'R06 PATCH blocks',
    call: async (o) =>
      patchBlockRoute(await req(`/api/studio/documents/${DOC_ID}/blocks/1.1.1`, { method: 'PATCH', ...o }), {
        params: Promise.resolve({ id: DOC_ID, address: '1.1.1' }),
      }),
    body: () => ({ agentId: 'fixqa', change: CHANGE, baseRevisionNo: 1, op: 'delete' }),
    ok: () => svc.patchBlock.mockResolvedValueOnce({ revision: { revisionNo: 2 } }),
    okStatus: 200,
    fail: (err) => svc.patchBlock.mockRejectedValueOnce(err),
    preCharge: () => ({ change: CHANGE, baseRevisionNo: 1, op: 'nope' }),
  },
  {
    name: 'R16 PATCH paragraphs',
    call: async (o) =>
      patchPidRoute(await req(`/api/studio/documents/${DOC_ID}/paragraphs/p-abcdef1234`, { method: 'PATCH', ...o }), {
        params: Promise.resolve({ id: DOC_ID, pid: 'p-abcdef1234' }),
      }),
    body: () => ({ agentId: 'fixqa', op: 'replace', baseRevisionNo: 1, change: CHANGE }),
    ok: () => svc.patchPid.mockResolvedValueOnce({ revision: { revisionNo: 2 } }),
    okStatus: 200,
    fail: (err) => svc.patchPid.mockRejectedValueOnce(err),
    preCharge: () => ({ agentId: 42 }),
  },
  {
    name: 'R14 PATCH structure',
    call: async (o) =>
      patchStructureRoute(await req(`/api/studio/documents/${DOC_ID}/structure`, { method: 'PATCH', ...o }), {
        params: Promise.resolve({ id: DOC_ID }),
      }),
    body: () => ({ agentId: 'fixqa', op: 'reorder', baseRevisionNo: 1, change: CHANGE, order: ['controlSheet', 'content'] }),
    ok: () => svc.patchStructure.mockResolvedValueOnce({ revision: { revisionNo: 2 }, completeness: { status: 'partial' } }),
    okStatus: 200,
    fail: (err) => svc.patchStructure.mockRejectedValueOnce(err),
    preCharge: () => ({ op: 'reorder', baseRevisionNo: 1 }),
  },
];

beforeEach(() => {
  delete process.env.STUDIO_RENDER_RATE_LIMIT;
  resetRenderRateLimiter();
  for (const fn of Object.values(svc)) fn.mockReset();
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    if (process.env.FIXQA_DEBUG) process.stderr.write(`${String(a[0]).slice(0, 2000)}\n`);
  });
});

afterEach(() => {
  delete process.env.STUDIO_RENDER_RATE_LIMIT;
  resetRenderRateLimiter();
  vi.restoreAllMocks();
});

describe.each(ROUTES)('FIX-R40-1 $name', (r) => {
  it('2xx sesudah tagihan: header render, sisa menurun satu per panggilan', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '5';
    resetRenderRateLimiter();
    r.ok();
    const a = await r.call({ auth: 'agent', body: r.body() });
    expect(a.status, await a.clone().text()).toBe(r.okStatus);
    expect(qh(a)).toEqual(['render', '4']);
    r.ok();
    const b = await r.call({ auth: 'agent', body: r.body() });
    expect(b.status).toBe(r.okStatus);
    expect(qh(b)).toEqual(['render', '3']);
  });

  it('4xx dan 5xx sesudah tagihan membawa header render', async () => {
    r.fail(new StudioEngineError('FORBIDDEN', 'caller may not write this document'));
    const forbidden = await r.call({ auth: 'agent', body: r.body() });
    expect(forbidden.status, await forbidden.clone().text()).toBe(403);
    expect(qh(forbidden)[0]).toBe('render');
    r.fail(new StudioEngineError('REVISION_CONFLICT', 'base revision is stale'));
    const conflict = await r.call({ auth: 'agent', body: r.body() });
    expect(conflict.status).toBe(409);
    expect(qh(conflict)[0]).toBe('render');
    r.fail(new Error('db down'));
    const crashed = await r.call({ auth: 'agent', body: r.body() });
    expect(crashed.status).toBe(500);
    expect(qh(crashed)[0]).toBe('render');
  });

  it('429: sisa 0, bucket render, Retry-After (tidak berubah)', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '1';
    resetRenderRateLimiter();
    r.ok();
    await r.call({ auth: 'agent', body: r.body() });
    const limited = await r.call({ auth: 'agent', body: r.body() });
    expect(limited.status).toBe(429);
    expect(qh(limited)).toEqual(['render', '0']);
    expect(limited.headers.get('Retry-After')).not.toBeNull();
  });

  it('401 tanpa header kuota', async () => {
    const res = await r.call({ body: r.body() });
    expect(res.status).toBe(401);
    expect(qh(res)).toEqual([null, null]);
  });

  it('400 sebelum tagihan tanpa header kuota, limiter tidak tersentuh', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '5';
    resetRenderRateLimiter();
    const bad = await r.call({ auth: 'agent', body: r.preCharge() });
    expect(bad.status).toBe(400);
    expect(qh(bad)).toEqual([null, null]);
    // Panggilan sah berikutnya masih melihat sisa 4 (penolakan tadi tidak menagih).
    r.ok();
    const ok = await r.call({ auth: 'agent', body: r.body() });
    expect(qh(ok)).toEqual(['render', '4']);
  });
});
