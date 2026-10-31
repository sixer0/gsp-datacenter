// DC-36 — header kuota (register 05 §9.6 QH-01..QH-05 + amandemen DOC-FIX-B; KS-9) pada SEMUA
// route bucket, lewat handler NYATA dan layanan NYATA (DB v21 di dalam transaksi ROLLBACK;
// permintaan uji hanya membaca atau ditolak sesudah tagihan, sehingga 0 tulis).
// Matriks QH-01: render = R17, R07 POST, R09 POST, R04 POST, R12, R13, R06/R16/R14 PATCH,
// R08 ?preview=html; validate = R08, R23, import ?validate=1; import = import/markdown;
// query = R21, R22. Untuk tiap route: C49 = nama bucket, C48 = bilangan bulat >= 0 yang turun
// tepat 1 pada panggilan berikutnya (QH-02/QH-03); 429 per bucket membawa C48 = "0" +
// Retry-After (QH-05); dua bucket melaporkan sisa terkecil (QH-04).
import './_env';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { HIGH_LIMIT, RUN_ID } from './_env';
import { disconnectReal, openRollback, residue, type RollbackWindow } from './_rb';
import { call, params, quotaOf, req, withAgent, type Called } from './_http';
import { resetQueryRateLimiter } from '@/lib/studio/http/quota';
import { resetRenderRateLimiter } from '@/lib/studio/http/render-guard';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { resetImportRateLimiter } from '@/app/api/studio/import/markdown/_lib/import-rate';
import { GET as getContracts } from '@/app/api/studio/contracts/route';
import { GET as getSearch } from '@/app/api/studio/search/route';
import { POST as postDraftCheck } from '@/app/api/studio/drafts/check/route';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { POST as postImport } from '@/app/api/studio/import/markdown/route';
import { POST as postDocuments } from '@/app/api/studio/documents/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { POST as postArtifact } from '@/app/api/studio/artifacts/route';
import { POST as postRevision } from '@/app/api/studio/documents/[id]/revisions/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';
import { PATCH as patchBlock } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { PATCH as patchPid } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { PATCH as patchStructure } from '@/app/api/studio/documents/[id]/structure/route';

/** Id dokumen berbentuk sah yang tidak ada di DB (cuid 25 karakter). */
const GHOST = 'cdc36ghost0000000000000000';
const MISSION = `2099-01-01_dc36-q-${RUN_ID}`;
const CHANGE = { what: 'uji kuota', why: 'DC-36', impact: 'tanpa tulis' };
const LIMIT_ENVS = ['STUDIO_RENDER_RATE_LIMIT', 'STUDIO_VALIDATE_RATE_LIMIT', 'STUDIO_IMPORT_RATE_LIMIT', 'STUDIO_QUERY_RATE_LIMIT'] as const;

function resetLimiters(): void {
  resetRenderRateLimiter();
  resetValidateRateLimiter();
  resetImportRateLimiter();
  resetQueryRateLimiter();
}

function setLimits(over: Partial<Record<(typeof LIMIT_ENVS)[number], string>> = {}): void {
  for (const k of LIMIT_ENVS) process.env[k] = over[k] ?? HIGH_LIMIT;
  resetLimiters();
}

const slotGhost = { $schema: 'studio.slot/v2', target: { documentId: GHOST }, slot: 'record', payload: { type: 'contractRecord', status: 'complete', reportedAt: '2026-10-30' } };
const chapterGhost = { $schema: 'studio.chapter/v2', target: { documentId: GHOST }, chapter: { key: '1', title: { text: 'Bab' }, sections: [{ title: { text: 'Bagian' }, blocks: [{ type: 'paragraph', text: 'Isi uji kuota.' }] }] } };
const emptyDraft = ['# DRAF uji kuota', 'tujuan: uji', 'langkah-berikut: tidak ada', 'basis: baru', ''].join('\n');

interface Row {
  route: string;
  bucket: 'render' | 'validate' | 'import' | 'query';
  status: number;
  run: () => Promise<Called>;
}

const ROWS: Row[] = [
  { route: 'R21 GET /contracts', bucket: 'query', status: 200, run: async () => call(getContracts(await req(`/api/studio/contracts?mission=${MISSION}`, { auth: 'agent' }))) },
  { route: 'R22 GET /search', bucket: 'query', status: 200, run: async () => call(getSearch(await req(`/api/studio/search?q=dc36kuota${RUN_ID}`, { auth: 'agent' }))) },
  { route: 'R23 POST /drafts/check', bucket: 'validate', status: 200, run: async () => call(postDraftCheck(await req('/api/studio/drafts/check', { auth: 'agent', body: { markdown: emptyDraft } }))) },
  { route: 'R08 POST /validate', bucket: 'validate', status: 200, run: async () => call(postValidate(await req('/api/studio/validate', { auth: 'agent', body: withAgent(slotGhost) }))) },
  { route: 'import POST /import/markdown', bucket: 'import', status: 200, run: async () => call(postImport(await req('/api/studio/import/markdown', { auth: 'agent', body: { markdown: '# Judul\n\nParagraf uji kuota.\n', chapterKey: '1' } }))) },
  { route: 'R04 POST /documents', bucket: 'render', status: 404, run: async () => call(postDocuments(await req('/api/studio/documents', { auth: 'agent', body: withAgent({ $schema: 'studio.doc/v2', target: { documentId: GHOST }, template: { slug: 'laporan-kerja-agen' }, meta: { title: 'Uji kuota' }, sections: {} }) }))) },
  { route: 'R12 POST /chapters', bucket: 'render', status: 404, run: async () => call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent(chapterGhost) }))) },
  { route: 'R13 POST /slots', bucket: 'render', status: 404, run: async () => call(postSlot(await req('/api/studio/slots', { auth: 'agent', body: withAgent(slotGhost) }))) },
  { route: 'R06 PATCH /blocks/[address]', bucket: 'render', status: 404, run: async () => call(patchBlock(await req(`/api/studio/documents/${GHOST}/blocks/1.1.1`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 1, block: { type: 'paragraph', text: 'x' }, change: CHANGE }) }), params({ id: GHOST, address: '1.1.1' }))) },
  { route: 'R16 PATCH /paragraphs/[pid]', bucket: 'render', status: 404, run: async () => call(patchPid(await req(`/api/studio/documents/${GHOST}/paragraphs/p-dc36ghost1`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 1, block: { type: 'paragraph', text: 'x' }, change: CHANGE }) }), params({ id: GHOST, pid: 'p-dc36ghost1' }))) },
  { route: 'R14 PATCH /structure', bucket: 'render', status: 404, run: async () => call(patchStructure(await req(`/api/studio/documents/${GHOST}/structure`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'setMeta', meta: { title: 'x' }, baseRevisionNo: 1, change: CHANGE }) }), params({ id: GHOST }))) },
  { route: 'R07 POST /revisions', bucket: 'render', status: 404, run: async () => call(postRevision(await req(`/api/studio/documents/${GHOST}/revisions`, { auth: 'agent', body: withAgent({ revisionNo: 1 }) }), params({ id: GHOST }))) },
  { route: 'R17 POST /render', bucket: 'render', status: 404, run: async () => call(postRender(await req(`/api/studio/documents/${GHOST}/render`, { auth: 'agent', body: withAgent({ scope: 'document' }) }), params({ id: GHOST }))) },
  { route: 'R09 POST /artifacts', bucket: 'render', status: 404, run: async () => call(postArtifact(await req('/api/studio/artifacts', { auth: 'agent', body: withAgent({ spec: { $schema: 'studio.chart/v1' }, mission: { agentRequestId: `dc36-ghost-${RUN_ID}` } }) }))) },
];

let win: RollbackWindow;

beforeAll(async () => {
  win = await openRollback();
}, 60_000);

afterAll(async () => {
  for (const k of LIMIT_ENVS) process.env[k] = HIGH_LIMIT;
  await win.close();
  const left = await residue({ docIds: [], missionPrefix: MISSION, runId: RUN_ID });
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  await disconnectReal();
}, 120_000);

beforeEach(() => setLimits());

describe('QH-01..QH-03: setiap route bucket membawa C48/C49 sesudah tagihan', () => {
  it.each(ROWS.map((r) => [r.route, r] as const))('%s', async (_n, row) => {
    const first = await row.run();
    expect(first.status, first.text.slice(0, 300)).toBe(row.status);
    const [bucket, remaining] = quotaOf(first.headers);
    expect(bucket).toBe(row.bucket);
    expect(remaining).toMatch(/^(0|[1-9][0-9]*)$/);
    const second = await row.run();
    const [bucket2, remaining2] = quotaOf(second.headers);
    expect(bucket2).toBe(row.bucket);
    expect(Number(remaining2)).toBe(Number(remaining) - 1);
    expect(first.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('matriks mencakup keempat bucket E53 dan 14 route', () => {
    expect(new Set(ROWS.map((r) => r.bucket))).toEqual(new Set(['render', 'validate', 'import', 'query']));
    expect(ROWS).toHaveLength(14);
  });
});

describe('QH-04: dua bucket melaporkan sisa terkecil', () => {
  it('R08 ?preview=html (validate + render): render lebih sempit -> header render', async () => {
    setLimits({ STUDIO_RENDER_RATE_LIMIT: '50' });
    const r = await call(postValidate(await req('/api/studio/validate?preview=html', { auth: 'agent', body: withAgent(slotGhost) })));
    expect(r.status).toBe(200);
    expect(quotaOf(r.headers)).toEqual(['render', '49']);
    // Kebalikannya: validate lebih sempit -> header validate.
    setLimits({ STUDIO_VALIDATE_RATE_LIMIT: '9' });
    const r2 = await call(postValidate(await req('/api/studio/validate?preview=html', { auth: 'agent', body: withAgent(slotGhost) })));
    expect(quotaOf(r2.headers)).toEqual(['validate', '8']);
  });

  it('import ?validate=1 (import + validate): validate lebih sempit -> header validate', async () => {
    setLimits({ STUDIO_VALIDATE_RATE_LIMIT: '7' });
    const r = await call(
      postImport(await req('/api/studio/import/markdown?validate=1', { auth: 'agent', body: withAgent({ markdown: '# Judul\n\nParagraf uji.\n', chapterKey: '1', target: { documentId: GHOST } }) })),
    );
    expect(quotaOf(r.headers)).toEqual(['validate', '6']);
  });
});

describe('QH-05: 429 per bucket = C48 "0" + Retry-After + RATE_LIMITED', () => {
  const cases: Array<[string, (typeof LIMIT_ENVS)[number], Row]> = [
    ['query (R22)', 'STUDIO_QUERY_RATE_LIMIT', ROWS[1]],
    ['validate (R23)', 'STUDIO_VALIDATE_RATE_LIMIT', ROWS[2]],
    ['import', 'STUDIO_IMPORT_RATE_LIMIT', ROWS[4]],
    ['render (R14)', 'STUDIO_RENDER_RATE_LIMIT', ROWS[10]],
  ];
  it.each(cases)('%s', async (_n, env, row) => {
    setLimits({ [env]: '1' });
    const ok = await row.run();
    expect(quotaOf(ok.headers)).toEqual([row.bucket, '0']);
    const limited = await row.run();
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe('RATE_LIMITED');
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(quotaOf(limited.headers)).toEqual([row.bucket, '0']);
  });
});
