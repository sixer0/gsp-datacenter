// DC-23 — R23 POST /api/studio/drafts/check (register 05 §9.3, §9.6, §11, T2-70/T2-71, AC-19; D-373).
// Prisma DI-MOCK; dry-run kiriman parsial (`dryRunSlot`/`dryRunChapter`) di-mock pada modul layanan
// yang dipakai R08 DAN R23 (ajv skema v2 tetap asli). Uji: urutan galat 401 -> 400/415 -> 413 -> 429,
// tagihan bucket validate per blok (KD-43), 0 tulis DB, dan kesamaan AC-19: respons R23 identik
// dengan `checkDraftRemote` CLI yang memanggil handler R08 ASLI di proses lewat fetch tiruan.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ dryRunSlot: vi.fn(), dryRunChapter: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { NextRequest } from 'next/server';
import { TEST_INTERNAL_SECRET } from './_env';
import { dbWrites, on, resetDb } from './_prisma';
import { req } from './_studio';
import { DRAFT_LIMITS, STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { POST } from '@/app/api/studio/drafts/check/route';
import { POST as VALIDATE } from '@/app/api/studio/validate/route';
import { checkDraftRemote, type FetchLike } from '../../../../scripts/studio/draft-check';

const DOC = 'cmvui0qun000qv11gtygb1mk9';
const PATH = '/api/studio/drafts/check';

function slotBlock(rev = 3): string {
  return [
    '```json',
    `{ "$schema": "studio.slot/v2", "target": { "documentId": "${DOC}" }, "slot": "record", "baseRevisionNo": ${rev},`,
    '  "payload": { "type": "contractRecord", "status": "partial", "reportedAt": "2026-10-30" } }',
    '```',
  ].join('\n');
}

function draft(basis: string, ...blocks: string[]): string {
  return ['# DRAF Laporan kerja DC-02', 'tujuan: register nama document contract', 'langkah-berikut: kirim slot record', `basis: ${basis}`, '', ...blocks, ''].join('\n');
}

const VALID = draft(`${DOC}@rev3`, slotBlock());
const BROKEN_JSON = draft('baru', '```json', '{ "$schema": "studio.slot/v2", "slot": "record",, }', '```', '', slotBlock());
const SCHEMA_BAD = draft(`${DOC}@rev3`, '```json', `{ "$schema": "studio.slot/v2", "target": { "documentId": "${DOC}" }, "slot": "record", "payload": { "type": "contractRecord", "title": "x" } }`, '```');
const UNKNOWN_SCHEMA = draft('baru', '```json', '{ "$schema": "studio.doc/v1" }', '```');

function dryResult(revisionNo = 4) {
  return {
    result: {
      document: { id: DOC, docNumber: '003/GSP/KT/X/2026' },
      created: false,
      unchanged: false,
      rebased: false,
      revision: { revisionNo, changeScope: 'SLOT' },
      slot: { slotKey: 'record', address: 'record', pid: 'p-1' },
      completeness: { status: 'INCOMPLETE', missingRequired: ['bab1'] },
    },
    lint: null,
    snapshot: null,
  };
}

function quota(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

function setCurrentRevision(n: number | null): void {
  on('studioDocument', 'findUnique', async (a: { where: { id: string } }) => (n !== null && a.where.id === DOC ? { currentRevisionNo: n } : null));
}

/** Fetch tiruan untuk CLI `--remote`: R08 = handler ASLI di proses; R05 = revisi terkini tiruan yang sama. */
function inProcessFetch(current: number | null): FetchLike {
  return async (url, init) => {
    const u = new URL(url);
    if (init.method === 'GET') {
      const body = current === null ? { error: 'Document not found', code: 'DOCUMENT_NOT_FOUND' } : { document: { id: DOC, currentRevisionNo: current } };
      const text = JSON.stringify(body);
      return { status: current === null ? 404 : 200, headers: { get: () => null }, text: async () => text };
    }
    const res = await VALIDATE(new NextRequest(new URL(u.pathname, 'https://127.0.0.1:9011'), { method: 'POST', headers: init.headers, body: init.body }));
    const text = await res.text();
    return { status: res.status, headers: { get: (n: string) => res.headers.get(n) }, text: async () => text };
  };
}

async function r23(markdown: string, extra: Record<string, unknown> = {}): Promise<Response> {
  return POST(await req(PATH, { auth: 'agent', body: { markdown, ...extra } }));
}

beforeEach(() => {
  resetDb();
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
  svc.dryRunSlot.mockReset();
  svc.dryRunChapter.mockReset();
  svc.dryRunSlot.mockResolvedValue(dryResult());
  setCurrentRevision(3);
});

afterEach(() => {
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
});

describe('R23 POST /api/studio/drafts/check — galat', () => {
  it('tanpa sesi -> 401 tanpa header kuota dan tanpa dry-run', async () => {
    const res = await POST(await req(PATH, { body: { markdown: VALID } }));
    expect(res.status).toBe(401);
    expect(quota(res)).toEqual([null, null]);
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });

  it('kunci tak dikenal / markdown bukan string / agentId > 80 -> 400 SCHEMA_INVALID berpointer, tanpa tagihan', async () => {
    const res = await r23(VALID, { foo: 1, agentId: 'a'.repeat(81) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(body.details.map((i: { pointer: string }) => i.pointer).sort()).toEqual(['/agentId', '/foo']);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    expect(quota(res)).toEqual([null, null]);
    const res2 = await POST(await req(PATH, { auth: 'agent', body: { markdown: 5 } }));
    expect((await res2.json()).details).toEqual([expect.objectContaining({ pointer: '/markdown' })]);
  });

  it('badan bukan JSON -> 400 JSON_MALFORMED; Content-Type lain -> 415', async () => {
    const r1 = await POST(await req(PATH, { auth: 'agent', body: '{"markdown":', headers: { 'content-type': 'application/json' } }));
    expect(r1.status).toBe(400);
    expect((await r1.json()).code).toBe('JSON_MALFORMED');
    const r2 = await POST(await req(PATH, { auth: 'agent', body: 'x', headers: { 'content-type': 'text/plain' } }));
    expect(r2.status).toBe(415);
    expect((await r2.json()).code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('413: markdown > maxChars (DR-09), blok > maxBlocks (DR-10), badan > bodyBytes (DR-09); tanpa tagihan', async () => {
    const long = await r23('x'.repeat(DRAFT_LIMITS.maxChars + 1));
    expect(long.status).toBe(413);
    expect(await long.json()).toEqual(expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE', details: { reason: 'DRAFT_TOO_LONG' } }));
    expect(quota(long)).toEqual([null, null]);
    const many = await r23(draft('baru', ...Array.from({ length: DRAFT_LIMITS.maxBlocks + 1 }, () => slotBlock())));
    expect(many.status).toBe(413);
    expect((await many.json()).details).toEqual({ reason: 'DRAFT_TOO_MANY_BLOCKS' });
    const big = await POST(await req(PATH, { auth: 'agent', body: JSON.stringify({ markdown: 'é'.repeat(DRAFT_LIMITS.bodyBytes / 2 + 8) }), headers: { 'content-type': 'application/json' } }));
    expect(big.status).toBe(413);
    expect((await big.json()).details).toEqual({ reason: 'DRAFT_TOO_LONG' });
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });

  it('429: satu tagihan per blok; tagihan ke-2 ditolak -> 429 tanpa dry-run apa pun, header kuota 0', async () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '1';
    resetValidateRateLimiter();
    const res = await r23(draft(`${DOC}@rev3`, slotBlock(), '', slotBlock()));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('RATE_LIMITED');
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(quota(res)).toEqual(['validate', '0']);
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });
});

describe('R23 POST /api/studio/drafts/check — 200', () => {
  it('draf valid -> 200 T2-70, bucket validate turun per blok, 0 tulis DB', async () => {
    const r1 = await r23(VALID);
    expect(r1.status).toBe(200);
    expect(r1.headers.get('x-correlation-id')).toBeTruthy();
    const body = await r1.json();
    expect(body.valid).toBe(true);
    expect(body.header).toEqual({ title: 'DRAF Laporan kerja DC-02', tujuan: 'register nama document contract', langkahBerikut: 'kirim slot record', basis: `${DOC}@rev3` });
    expect(body.blocks).toHaveLength(1);
    expect(body.blocks[0]).toEqual(
      expect.objectContaining({ index: 1, line: 6, endLine: 9, schema: 'studio.slot/v2', valid: true, issues: [], submitPreview: expect.objectContaining({ revisionNo: 4, slot: { slotKey: 'record', address: 'record', pid: 'p-1' } }) }),
    );
    expect(body.blocks[0]).not.toHaveProperty('lint');
    expect(body.blocks[0]).not.toHaveProperty('previewHtml');
    const [b1, s1] = quota(r1);
    const r2 = await r23(draft(`${DOC}@rev3`, slotBlock(), '', slotBlock()));
    expect(b1).toBe('validate');
    expect(Number(quota(r2)[1])).toBe(Number(s1) - 2);
    expect(dbWrites()).toEqual([]);
  });

  it('blok dengan galat ekstraksi tidak di-dry-run; draf tanpa blok sah tetap ditagih satu kali (FIX-SEC L-2, D-402)', async () => {
    const res = await r23(UNKNOWN_SCHEMA);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.issues.map((i: { code: string }) => i.code)).toContain('DRAFT_SCHEMA_UNKNOWN');
    expect(quota(res)).toEqual(['validate', '119']);
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });

  it('DR-08: basis rev3 < revisi terkini 7 -> peringatan di baris basis (kolom 1)', async () => {
    setCurrentRevision(7);
    const body = await (await r23(VALID)).json();
    expect(body.issues).toEqual([expect.objectContaining({ code: 'DRAFT_BASIS_STALE', severity: 'warning', line: 4, column: 1 })]);
    expect(body.valid).toBe(true);
  });

  it('FORBIDDEN dari layanan (di R08 = 403) -> isu blok, bukan galat HTTP', async () => {
    svc.dryRunSlot.mockRejectedValue(new StudioEngineError('FORBIDDEN', 'Template is restricted', { slug: 'x' }));
    const res = await r23(VALID);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocks[0].valid).toBe(false);
    expect(body.blocks[0].issues).toEqual([{ pointer: '', keyword: 'FORBIDDEN', message: 'Template is restricted', details: { slug: 'x' } }]);
  });
});

describe('AC-19: respons R23 identik dengan CLI --remote --json (R08 asli di proses)', () => {
  const cases: Array<{ name: string; md: string; current: number | null; setup?: () => void }> = [
    { name: 'draf valid', md: VALID, current: 3 },
    { name: 'JSON rusak + blok sah', md: BROKEN_JSON, current: 3 },
    { name: 'basis basi', md: VALID, current: 9 },
    { name: 'skema v2 tidak sah (ajv asli)', md: SCHEMA_BAD, current: 3 },
    { name: 'dokumen basis tidak ada', md: VALID, current: null },
    {
      name: 'galat masukan layanan (409 SCOPE_CONFLICT -> valid:false)',
      md: VALID,
      current: 3,
      setup: () => svc.dryRunSlot.mockRejectedValue(new StudioEngineError('SCOPE_CONFLICT', 'Scope conflict', { reason: 'PATCHED_PIDS_OVERWRITTEN', overwrittenPids: ['p-1'] })),
    },
    {
      name: 'FORBIDDEN (R08 403 -> isu blok)',
      md: VALID,
      current: 3,
      setup: () => svc.dryRunSlot.mockRejectedValue(new StudioEngineError('FORBIDDEN', 'Template is restricted', { slug: 'x' })),
    },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      setCurrentRevision(c.current);
      c.setup?.();
      const res = await r23(c.md);
      expect(res.status).toBe(200);
      const viaRoute = JSON.stringify(await res.json(), null, 2);
      const viaCli = JSON.stringify(await checkDraftRemote(c.md, { baseUrl: 'http://127.0.0.1:9011', secret: TEST_INTERNAL_SECRET, fetchImpl: inProcessFetch(c.current) }), null, 2);
      expect(viaRoute).toBe(viaCli);
      expect(dbWrites()).toEqual([]);
    });
  }
});

describe('D-375: cek kontrak lokal CLI = I54 (posisi EC27 berbasis 1)', () => {
  const item = (key: string) => ({ key, title: { text: 'butir' }, status: 'todo' });
  const dupBlock = (items: unknown[]) =>
    ['```json', JSON.stringify({ $schema: 'studio.slot/v2', target: { documentId: DOC }, slot: 'record', baseRevisionNo: 3, payload: { type: 'contractRecord', status: 'partial', reportedAt: '2026-10-30', items } }), '```'].join('\n');

  it('kunci butir ganda -> CONTRACT_ITEM_KEY_DUPLICATE positions [1, 3] (bukan berbasis 0)', async () => {
    const { checkDraftLocal } = await import('../../../../scripts/studio/draft-check');
    const r = checkDraftLocal(draft('baru', dupBlock([item('DC-01'), item('DC-02'), item('DC-01')])));
    expect(r.valid).toBe(false);
    expect(r.blocks[0].issues).toEqual([
      { pointer: '/payload/items/2/key', keyword: 'CONTRACT_ITEM_KEY_DUPLICATE', message: 'Kunci butir "DC-01" ganda pada posisi 1, 3', details: { key: 'DC-01', positions: [1, 3] } },
    ]);
  });

  it('tanggal kalender tidak sah (lolos pola skema) -> isu I54 CONTRACT_DATE; kunci unik -> valid', async () => {
    const { checkDraftLocal } = await import('../../../../scripts/studio/draft-check');
    const bad = checkDraftLocal(draft('baru', dupBlock([{ ...item('DC-01'), due: '2026-02-30' }])));
    expect(bad.blocks[0].issues).toEqual([expect.objectContaining({ pointer: '/payload/items/0/due', keyword: 'CONTRACT_DATE', checkId: 'CONTRACT_DATE' })]);
    const ok = checkDraftLocal(draft('baru', dupBlock([item('DC-01'), item('DC-02')])));
    expect(ok.blocks[0]).toEqual(expect.objectContaining({ valid: true, issues: [] }));
  });
});
