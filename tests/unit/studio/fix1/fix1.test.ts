/* eslint-disable @typescript-eslint/no-explicit-any -- fixture Prisma tiruan S74 bertipe longgar */
// FIX-1 — bukti perbaikan S85 (R-01..R-09, Low) dan S87 (M-02..M-05, L-01, L-02, L-04..L-07)
// untuk layanan + API Studio. Fixture S74 dipakai ulang (dibaca saja, tidak diubah):
// Prisma DI-MOCK (tanpa DB), mesin render S51 ditiru.
import '../api/_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crc32, deflateSync } from 'node:zlib';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const render = vi.hoisted(() => ({ renderRevision: vi.fn(), renderArtifact: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('../api/_prisma')).prismaModule());
vi.mock('@/lib/studio/services/render', async (orig) => ({ ...(await orig<object>()), ...render }));

import { callsOf, clearDbCalls, dbWrites, on, resetDb } from '../api/_prisma';
import {
  canonicalTemplate,
  captureServiceLogs,
  fakeJob,
  installMemoryStore,
  installStructureWrites,
  installTemplates,
  jsonOf,
  makeTemplate,
  params,
  req,
  restrictedTemplate,
  RESTRICTING_OVERRIDES,
  STRUCTURE_MODELS,
  studioDoc,
  T_FIXED,
  type AuthKind,
  type TemplateFixture,
} from '../api/_studio';
import { POST as postDocument } from '@/app/api/studio/documents/route';
import { PATCH as patchBlockRoute } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { POST as postRerender } from '@/app/api/studio/documents/[id]/revisions/route';
import { POST as saveVersion } from '@/app/api/studio/templates/[id]/route';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { toDocumentSummary, toRevisionSummary } from '@/app/api/studio/validate/_shared/route-kit';
import { getStudioCaller, secretEquals, type StudioCaller } from '@/lib/studio/contract/auth';
import { STUDIO_ERROR_HTTP, StudioEngineError } from '@/lib/studio/contract/errors';
import {
  assertJsonDepth,
  checkRenderRate,
  failure,
  jsonDepthExceeds,
  purgeOldLogs,
  reqCtx,
  resetRenderRateLimiter,
  STUDIO_MAX_JSON_DEPTH,
} from '@/lib/studio/http';
import { ingestDocument, documentSummary as ingestDocumentSummary } from '@/lib/studio/services/ingest';
import * as ingestUtil from '@/lib/studio/services/ingest/util';
import { createRenderGate, errorCodeOf } from '@/lib/studio/services/render';
import * as revCanonical from '@/lib/studio/services/revisions/canonical';
import { documentSummary, revisionSummary } from '@/lib/studio/services/revisions/rows';
import { createTemplateVersion, resolveRepoAssetPath, stableStringify as profileStableStringify, validateAssets } from '@/lib/studio/services/templates';

const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', username: 'adm', canWriteClassK: true };
const USER: StudioCaller = { kind: 'USER_SESSION', requester: 'user:op', username: 'op', canWriteClassK: false };
const CHANGE = { what: 'Perbarui angka beban', why: 'Data Oktober tersedia', impact: 'Ringkasan memakai beban terbaru' };
const NEW_TEXT = 'Beban puncak trafo A1 turun menjadi 610 kVA pada Oktober 2026 setelah pemindahan beban pendingin ke trafo A2.';

/** Turunan BM verbatim (tanpa result()): hanya dirender bila dokumen bertanda x.benchmark tepercaya. */
const VERBATIM_DERIVATION = {
  type: 'derivation',
  title: { text: 'Perhitungan beban puncak' },
  lines: [{ label: { text: 'Beban puncak' }, value: { text: '640 kVA' } }],
  closing: { text: 'Beban masih di bawah batas operasi.' },
};

function docWithDerivation(x?: Record<string, unknown>): Record<string, unknown> {
  const d = studioDoc(x ? { x } : {}) as any;
  d.chapters[0].sections[0].blocks.push(VERBATIM_DERIVATION);
  return d;
}

function installPersist(): void {
  on('studioDocument', 'findMany', async () => []);
  on('studioDocument', 'findUnique', async () => null);
  on('studioDocument', 'create', async ({ data }: any) => ({ id: 'doc-new', archived: false, createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  // SR-43 (D-183/D-210): revisi + baris struktur v2 ditulis di transaksi yang sama (writeRevisionRows).
  installStructureWrites();
  on('studioBlock', 'findMany', async () => []);
}

/** PNG minimal sah secara header: IHDR (w x h, RGB 8 bit) + IDAT kecil + IEND. */
function pngHeaderOnly(w: number, h: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.alloc(64))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function sha256(b: Buffer): string {
  return ingestUtil.sha256Hex(b);
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  render.renderRevision.mockReset();
  render.renderArtifact.mockReset();
  resetRenderRateLimiter();
  delete process.env.STUDIO_RENDER_RATE_LIMIT;
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ── S87 M-02: batas piksel aset dokumen = jalur artefak ─────────────────

describe('S87 M-02 — aset dokumen bom piksel', () => {
  it('PNG header 30000x30000 di doc.assets -> 413 ASSET_TOO_LARGE reason pixel_limit, tanpa tulis DB, tanpa render', async () => {
    installTemplates(canonicalTemplate());
    const png = pngHeaderOnly(30000, 30000);
    const doc = studioDoc() as any;
    doc.assets = { bom: { kind: 'raster', mime: 'image/png', sha256: sha256(png), dataBase64: png.toString('base64') } };
    const res = await postDocument(await req('/api/studio/documents', { auth: 'user', body: { document: doc } }));
    expect(res.status).toBe(413);
    const b = await jsonOf(res);
    expect(b.code).toBe('ASSET_TOO_LARGE');
    expect(b.details[0]).toMatchObject({ keyword: 'assetTooLarge', reason: 'pixel_limit', widthPx: 30000, heightPx: 30000 });
    expect(dbWrites()).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('PNG 100x100 tetap diterima (dryRun valid)', async () => {
    installTemplates(canonicalTemplate());
    const png = pngHeaderOnly(100, 100);
    const doc = studioDoc() as any;
    doc.assets = { ok: { kind: 'raster', mime: 'image/png', sha256: sha256(png), dataBase64: png.toString('base64') } };
    const r = await ingestDocument({ document: doc } as any, USER, { dryRun: true });
    expect(r.valid).toBe(true);
  });
});

// ── S87 M-03: laju render + antrean berbatas ────────────────────────────

describe('S87 M-03 — rate limit render per pemanggil dan antrean berbatas', () => {
  it('N+1 POST documents dalam jendela -> 429 RATE_LIMITED + Retry-After; pemanggil lain tidak terdampak', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '2';
    resetRenderRateLimiter();
    installTemplates(canonicalTemplate());
    installPersist();
    render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev-new' }), outputs: [], errors: [] });
    const post = async (auth: AuthKind, user?: string) =>
      postDocument(await req('/api/studio/documents', { auth, user, body: { agentId: `agen-${Math.random()}`, document: studioDoc() } }));
    expect((await post('agent')).status).toBe(201);
    expect((await post('agent')).status).toBe(201);
    const third = await post('agent'); // agentId berbeda tidak membuka ember baru (L-02)
    expect(third.status).toBe(429);
    expect((await jsonOf(third)).code).toBe('RATE_LIMITED');
    expect(Number(third.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await post('user', 'lain')).status).toBe(201);
  });

  it('checkRenderRate: identitas dari sesi, bukan agentId', () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '1';
    resetRenderRateLimiter();
    const ctx = { correlationId: 'c', route: '/x', method: 'POST', source: 't' } as any;
    expect(checkRenderRate({ kind: 'USER_SESSION', username: 'a' }, ctx)).toBeNull();
    expect(checkRenderRate({ kind: 'USER_SESSION', username: 'a' }, ctx)?.status).toBe(429);
    expect(checkRenderRate({ kind: 'USER_SESSION', username: 'b' }, ctx)).toBeNull();
  });

  // SR-43 lanjutan (D-247, D-261, file_requests.md:228 "tanpa 503 PDF/antrean"): R04 v1 tidak lagi
  // membangun berkas, jadi antrean mesin penuh tidak memengaruhi kiriman: 201, job null, render tidak
  // dipanggil. 503 RENDER_QUEUE_FULL tetap diuji di R07 (di bawah) dan gerbang render.
  it('antrean mesin penuh (FIX-8) tidak memengaruhi R04 v1 -> 201, job null, outputs [], render tidak dipanggil', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev-new', status: 'FAILED' }), outputs: [], errors: [{ code: 'RENDER_QUEUE_FULL', message: 'soffice queue full' }] });
    const res = await postDocument(await req('/api/studio/documents', { auth: 'user', body: { document: studioDoc() } }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.job).toBeNull();
    expect(b.outputs).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('R07 render ulang: job gagal karena antrean penuh -> 503 + Retry-After', async () => {
    await setupDoc(canonicalTemplate(), studioDoc());
    on('studioRenderJob', 'findFirst', async () => null);
    render.renderRevision.mockResolvedValue({
      job: fakeJob({ revisionId: 'rev1', status: 'FAILED', errors: [{ code: 'RENDER_QUEUE_FULL', message: 'chromium queue full' }] }),
      outputs: [],
      errors: [{ code: 'RENDER_QUEUE_FULL', message: 'chromium queue full' }],
    });
    const res = await postRerender(await req('/api/studio/documents/doc1/revisions', { auth: 'user', body: { revisionNo: 1 } }), params({ id: 'doc1' }));
    expect(res.status).toBe(503);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('gerbang render: 1 berjalan + 1 menunggu, berikutnya RENDER_QUEUE_FULL 503 + Retry-After via failure()', async () => {
    const gate = createRenderGate({ maxConcurrent: 1, maxQueued: 1, retryAfterSec: 7 });
    let release!: () => void;
    const block = new Promise<void>((r) => (release = r));
    const order: string[] = [];
    const a = gate.run(async () => {
      order.push('a');
      await block;
    });
    const b = gate.run(async () => {
      order.push('b');
    });
    expect(gate.stats()).toMatchObject({ running: 1, queued: 1 });
    const err = await gate.run(async () => undefined).catch((e) => e);
    expect(err).toBeInstanceOf(StudioEngineError);
    expect(err.code).toBe('RENDER_QUEUE_FULL');
    expect(STUDIO_ERROR_HTTP.RENDER_QUEUE_FULL).toBe(503);
    expect(() => gate.assertCapacity()).toThrow(StudioEngineError);
    const res = failure(err, reqCtx(await req('/x'), '/x'));
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('7');
    release();
    await Promise.all([a, b]);
    expect(order).toEqual(['a', 'b']);
    expect(gate.stats()).toMatchObject({ running: 0, queued: 0 });
  });
});

// ── Revisi: S85 R-01 (= S87 M-04), R-02, R-03, R-04 ──────────────────────

interface DocSetup {
  revision: Record<string, any>;
}

/**
 * SR-43 (D-196, D-210): dokumen doc1 revisi 1 ditulis ingest NYATA (persist) ke penyimpanan memori
 * (`installMemoryStore`), karena R06 pada dokumen v2 membaca baris M14-M18 revisi dasar. Riwayat
 * panggilan dikosongkan sesudahnya agar uji hanya melihat tulisan PATCH/R07.
 */
async function setupDoc(fx: TemplateFixture, doc: Record<string, unknown>, ingestCaller: StudioCaller = ADMIN): Promise<DocSetup> {
  installTemplates(canonicalTemplate(), ...(fx.template.slug === 'datum-kanonik' ? [] : [fx]));
  const tables = installMemoryStore({}, STRUCTURE_MODELS);
  on('studioDocument', 'create', async ({ data }: any) => {
    const row = { id: 'doc1', archived: false, missionDocKey: null, createdAt: T_FIXED, updatedAt: T_FIXED, ...data };
    tables.studioDocument.push(row);
    return row;
  });
  on('studioRevision', 'create', async ({ data }: any) => {
    const row = { id: `rev${data.revisionNo}`, releaseStatus: 'PENDING', createdAt: T_FIXED, ...data };
    tables.studioRevision.push(row);
    return row;
  });
  const r = await ingestDocument({ document: doc } as any, ingestCaller, { dryRun: false });
  expect(r.issues ?? []).toEqual([]);
  expect(r.revision?.id).toBe('rev1');
  const revision = tables.studioRevision.find((x) => x.id === 'rev1');
  on('studioOutputFile', 'findMany', async () => []);
  render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev2' }), outputs: [], errors: [] });
  clearDbCalls();
  return { revision };
}

const patchReq = async (body: Record<string, unknown>, auth: AuthKind) =>
  patchBlockRoute(
    await req('/api/studio/documents/doc1/blocks/1.1.1', { method: 'PATCH', auth, body }),
    params({ id: 'doc1', address: '1.1.1' }),
  );
const replaceBody = { baseRevisionNo: 1, op: 'replace', block: { type: 'paragraph', text: NEW_TEXT }, change: CHANGE };

describe('S85 R-01 / S87 M-04 — PATCH oleh pemanggil tak tepercaya tidak mewarisi penanda', () => {
  it.each(['user', 'agent'] as AuthKind[])('%s: dokumen x.benchmark + turunan verbatim -> 422 D03 (bukan 200), tanpa revisi', async (auth) => {
    await setupDoc(canonicalTemplate(), docWithDerivation({ benchmark: true }));
    const res = await patchReq(replaceBody, auth);
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(b.details.some((d: any) => d.checkId === 'D03' && d.keyword === 'renderFeasibility')).toBe(true);
    expect(callsOf('studioRevision', 'create')).toHaveLength(0);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  // SR-43: snapshot norm/v2 juga memuat `x.adaptReportV1` (D-210); yang diuji = penanda saja.
  it('ADMIN: dokumen yang sama -> 200, penanda x.benchmark tetap di snapshot revisi 2', async () => {
    await setupDoc(canonicalTemplate(), docWithDerivation({ benchmark: true }));
    const res = await patchReq(replaceBody, 'admin');
    expect(res.status).toBe(200);
    const data = (callsOf('studioRevision', 'create')[0][0] as any).data;
    expect(data.snapshot.doc.x).toMatchObject({ benchmark: true });
  });

  it('USER: dokumen bertanda tanpa turunan -> 200, snapshot revisi 2 TANPA x.benchmark/x.lintEnforcement', async () => {
    await setupDoc(canonicalTemplate(), studioDoc({ x: { benchmark: true, lintEnforcement: { 'DATUM-04': 'release' }, catatan: 'tetap' } }));
    const res = await patchReq(replaceBody, 'user');
    expect(res.status).toBe(200);
    const x = (callsOf('studioRevision', 'create')[0][0] as any).data.snapshot.doc.x;
    expect(x.catatan).toBe('tetap');
    expect(x.benchmark).toBeUndefined();
    expect(x.lintEnforcement).toBeUndefined();
  });
});

// SR-43 (register 03 KD-26 `:119`, AD-09 `:1008`; D-179, D-210): `overrides` dokumen v1 kini medan
// tampilan yang DIBUANG adaptor (kebijakan bawaan strip, juga untuk ADMIN), sehingga tidak ada lagi
// "templat efektif = templat terpin + override dokumen". Skenario R-02 lama (override dokumen
// melepas DATUM-04) tidak dapat terjadi: override tidak pernah sampai ke gerbang maupun PATCH.
describe('S85 R-02 — override dokumen v1 tidak lagi berlaku (KD-26)', () => {
  it.each([ADMIN, USER])('$kind: override dokumen melepas DATUM-04 (judul pertanyaan) -> dibuang, DATUM-04 tetap menahan (valid:false)', async (caller) => {
    installTemplates(canonicalTemplate());
    const doc = studioDoc({ sectionTitle: 'Apa temuan utama kajian ini?', overrides: { ...RESTRICTING_OVERRIDES } });
    const r = await ingestDocument({ document: doc } as any, caller, { dryRun: true });
    expect(r.valid).toBe(false);
    expect(r.issues.map((i: any) => i.checkId)).toContain('DATUM-04');
    expect((r.lint?.checks ?? []).find((c: any) => c.checkId === 'INLINE_FORMAT_STRIPPED')).toMatchObject({ status: 'REPORT' });
  });
});

describe('S85 R-03 / F-053 — kelayakan render turunan di gerbang', () => {
  it.each(['user', 'agent', 'admin'] as AuthKind[])('%s: turunan tanpa result() tanpa penanda -> 422 D03, tanpa tulis DB', async (auth) => {
    installTemplates(canonicalTemplate());
    const res = await postDocument(await req('/api/studio/documents', { auth, body: { document: docWithDerivation() } }));
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(b.details.find((d: any) => d.keyword === 'renderFeasibility')).toMatchObject({ checkId: 'D03' });
    expect(dbWrites()).toEqual([]);
  });

  it('USER: turunan lengkap contoh STUDIO-AGENT-GUIDE §4.2 (result + verdict + register) tetap valid', async () => {
    installTemplates(canonicalTemplate());
    const d = studioDoc() as any;
    d.register = {
      bebanPuncak: { v: 640, dec: 0, unit: 'kVA', mark: 'TERUKUR', src: 'Log SCADA gardu A, 1-30 September 2026' },
      kapasitasTrafo: { v: 800, dec: 0, unit: 'kVA', mark: 'PEMASOK', src: 'Pelat nama trafo A1' },
      utilisasi: { v: 80, dec: 0, unit: '%', mark: 'DITURUNKAN', src: 'Turunan D-1.1' },
    };
    d.chapters[0].sections[0].blocks.push({
      type: 'derivation',
      title: { text: 'Utilisasi trafo A1' },
      lines: [
        { label: { text: 'beban puncak' }, value: { registerKey: 'bebanPuncak' }, mark: 'TERUKUR' },
        { label: { text: 'kapasitas terpasang' }, value: { registerKey: 'kapasitasTrafo' }, mark: 'PEMASOK' },
      ],
      result: { label: { text: 'utilisasi' }, expr: 'bebanPuncak / kapasitasTrafo * 100', registerKey: 'utilisasi' },
      verdict: { label: { text: 'batas operasi' }, registerKey: 'utilisasi', limit: 85, direction: 'lessOrEqual' },
      closing: { text: 'Utilisasi 80 % masih di bawah batas operasi 85 %, sehingga trafo A1 belum perlu diganti.' },
    });
    const r = await ingestDocument({ document: d } as any, USER, { dryRun: true });
    expect(r.issues).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it('ADMIN + x.benchmark: turunan verbatim = reproduksi sah (dryRun valid)', async () => {
    installTemplates(canonicalTemplate());
    const r = await ingestDocument({ document: docWithDerivation({ benchmark: true }) } as any, ADMIN, { dryRun: true });
    expect(r.valid).toBe(true);
  });

  it('ADMIN + HANYA x.enforcement:"report" (R-07: bukan penanda reproduksi) -> dryRun valid:false D03', async () => {
    installTemplates(canonicalTemplate());
    const r = await ingestDocument({ document: docWithDerivation({ enforcement: 'report' }) } as any, ADMIN, { dryRun: true });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.keyword === 'renderFeasibility')).toBe(true);
  });

  it('validate R08: USER turunan tanpa result -> 200 valid:false (bukan valid:true + previewError)', async () => {
    installTemplates(canonicalTemplate());
    const res = await postValidate(await req('/api/studio/validate?preview=html', { auth: 'user', body: { document: docWithDerivation() } }));
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).valid).toBe(false);
  });
});

describe('S85 R-04 — render ulang memakai jendela job basi yang sama', () => {
  it('cek RENDER_IN_PROGRESS R07 menyaring queuedAt >= now - timeout (job yatim tidak mengunci selamanya)', async () => {
    await setupDoc(canonicalTemplate(), studioDoc());
    on('studioOutputFile', 'findMany', async () => []);
    on('studioRenderJob', 'findFirst', async () => null);
    render.renderRevision.mockResolvedValue({ job: fakeJob({ revisionId: 'rev1' }), outputs: [], errors: [] });
    const res = await postRerender(await req('/api/studio/documents/doc1/revisions', { auth: 'user', body: { revisionNo: 1, formats: ['docx'] } }), params({ id: 'doc1' }));
    expect(res.status).toBe(200);
    const where = (callsOf('studioRenderJob', 'findFirst')[0][0] as any).where;
    expect(where.queuedAt.gte).toBeInstanceOf(Date);
    // S85 R-18: "docx" huruf kecil diterima dan dinormalkan.
    expect(render.renderRevision.mock.calls[0][1]).toEqual(['DOCX']);
  });
});

// ── S87 M-05: versi baru templat terbatas hanya ADMIN ───────────────────

describe('S87 M-05 — versi baru templat TERBATAS', () => {
  const body = { baseVersionNo: 1, overrides: { ...RESTRICTING_OVERRIDES }, changeNote: 'ubah sectionPlan', sectionPlan: undefined };
  // SR-43 (D-189/SR-61): R02 v1 datar non-ADMIN ditolak FORBIDDEN V1_FLAT_ADMIN_ONLY sebelum cek
  // templat terbatas; aturan M-05 (TEMPLATE_RESTRICTED) kini diuji di layanan (jalur bersama v1/v2).
  it.each(['user', 'google', 'agent'] as AuthKind[])('%s (route v1 datar) -> 403 FORBIDDEN, tanpa tulis DB', async (auth) => {
    installTemplates(restrictedTemplate());
    const res = await saveVersion(await req('/api/studio/templates/tpl-restr', { auth, body }), params({ id: 'tpl-restr' }));
    expect(res.status).toBe(403);
    const b = await jsonOf(res);
    expect(b.code).toBe('FORBIDDEN');
    expect(b.details).toMatchObject({ reason: 'V1_FLAT_ADMIN_ONLY' });
    expect(dbWrites()).toEqual([]);
  });

  it('LAYANAN: USER membuat versi templat terbatas -> 403 FORBIDDEN TEMPLATE_RESTRICTED, tanpa tulis DB (M-05)', async () => {
    installTemplates(restrictedTemplate());
    const err = await createTemplateVersion('tpl-restr', { baseVersionNo: 1, overrides: { ...RESTRICTING_OVERRIDES }, changeNote: 'ubah' }, USER).catch((e) => e);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toMatchObject({ reason: 'TEMPLATE_RESTRICTED' });
    expect(dbWrites()).toEqual([]);
  });

  it('ADMIN -> 201 versi 2', async () => {
    const fx = restrictedTemplate();
    installTemplates(fx);
    on('studioTemplate', 'updateMany', async () => ({ count: 1 }));
    on('studioTemplateVersion', 'create', async ({ data }: any) => ({ id: 'ver-new', createdAt: T_FIXED, ...data }));
    on('studioTemplate', 'findUniqueOrThrow', async () => ({ ...fx.template, latestVersionNo: 2 }));
    const res = await saveVersion(await req('/api/studio/templates/tpl-restr', { auth: 'admin', body: { ...body, changeNote: 'admin' } }), params({ id: 'tpl-restr' }));
    expect(res.status).toBe(201);
  });

  // SR-43 (D-189/SR-61, lapis D-168): non-ADMIN tidak lagi menyimpan v1 datar lewat route, dan kunci B
  // berlapis internal (`artifact.audience.outsideDivision`) bukan kenop esensial. Inti M-05 (templat
  // TIDAK terbatas tetap boleh disunting USER) diuji di layanan dengan kunci B esensial `doc.language`.
  it('templat tidak terbatas: USER tetap boleh membuat versi (kelas B esensial, layanan)', async () => {
    const fx = makeTemplate({ id: 'tpl-open', slug: 'turunan-terbuka' });
    installTemplates(fx);
    on('studioTemplate', 'updateMany', async () => ({ count: 1 }));
    on('studioTemplateVersion', 'create', async ({ data }: any) => ({ id: 'ver-new', createdAt: T_FIXED, ...data }));
    on('studioTemplate', 'findUniqueOrThrow', async () => ({ ...fx.template, latestVersionNo: 2 }));
    const out = await createTemplateVersion('tpl-open', { baseVersionNo: 1, overrides: { 'doc.language': 'EN' }, changeNote: 'b' }, USER);
    expect(out.version.versionNo).toBe(2);
  });

  it('templat tidak terbatas: USER lewat route v1 datar -> 403 FORBIDDEN V1_FLAT_ADMIN_ONLY (D-189)', async () => {
    installTemplates(makeTemplate({ id: 'tpl-open', slug: 'turunan-terbuka' }));
    const res = await saveVersion(
      await req('/api/studio/templates/tpl-open', { auth: 'user', body: { baseVersionNo: 1, overrides: { 'doc.language': 'EN' }, changeNote: 'b' } }),
      params({ id: 'tpl-open' }),
    );
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).details).toMatchObject({ reason: 'V1_FLAT_ADMIN_ONLY' });
  });
});

// ── Low: L-01, L-02, L-04, L-05, L-06, L-07; S85 R-06, R-08, R-09 ───────

describe('S87 L-01 / L-02 — rahasia internal dan atribusi', () => {
  it('secretEquals: sama -> true; beda isi atau panjang -> false', () => {
    expect(secretEquals('abc', 'abc')).toBe(true);
    expect(secretEquals('abd', 'abc')).toBe(false);
    expect(secretEquals('abcd', 'abc')).toBe(false);
    expect(secretEquals('', 'abc')).toBe(false);
  });

  it('requester berprefiks jenis: agent:<agentId>, google:<email>, user:<username>', async () => {
    const agent = await getStudioCaller(await req('/x', { auth: 'agent' }), 'gsp-analis');
    expect(agent.requester).toBe('agent:gsp-analis');
    const google = await getStudioCaller(await req('/x', { auth: 'google' }), 'mengaku-admin');
    expect(google.requester).toBe('google:agen@gsp.test');
    const user = await getStudioCaller(await req('/x', { auth: 'user', user: 'op' }), 'agen-lain');
    expect(user.requester).toBe('user:op');
    const anon = await getStudioCaller(await req('/x', { auth: 'agent' }), null);
    expect(anon.requester).toBe('anonymous-internal');
  });
});

describe('S87 L-04 — batas kedalaman JSON', () => {
  it('badan kedalaman 1000 -> 400 SCHEMA_INVALID (bukan 500)', async () => {
    const deep = '['.repeat(1000) + ']'.repeat(1000);
    const res = await postDocument(await req('/api/studio/documents', { auth: 'user', body: `{"document":${deep}}`, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
    expect(dbWrites()).toEqual([]);
  });

  it('jsonDepthExceeds iteratif (2 juta tingkat tanpa RangeError)', () => {
    let v: unknown = 1;
    for (let i = 0; i < 2_000_000; i++) v = [v];
    expect(jsonDepthExceeds(v)).toBe(true);
    expect(jsonDepthExceeds({ a: { b: [1, 2, { c: 3 }] } })).toBe(false);
    expect(() => assertJsonDepth(JSON.parse('['.repeat(STUDIO_MAX_JSON_DEPTH) + ']'.repeat(STUDIO_MAX_JSON_DEPTH)))).not.toThrow();
  });
});

describe('S87 L-05 — retensi log JSONL', () => {
  it('purgeOldLogs menghapus hanya berkas berpola prefix yang lebih tua dari retensi', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'fix1-logs-'));
    for (const f of ['studio-api-2026-01-01.jsonl', 'studio-api-2026-01-01.1.jsonl', 'studio-api-2026-10-20.jsonl', 'lain-2026-01-01.jsonl', 'studio-api-catatan.txt']) {
      writeFileSync(path.join(dir, f), '{}\n');
    }
    const removed = await purgeOldLogs(dir, 'studio-api', Date.parse('2026-10-23T00:00:00Z'), 90);
    expect(removed.sort()).toEqual(['studio-api-2026-01-01.1.jsonl', 'studio-api-2026-01-01.jsonl']);
    expect(readdirSync(dir).sort()).toEqual(['lain-2026-01-01.jsonl', 'studio-api-2026-10-20.jsonl', 'studio-api-catatan.txt']);
  });
});

describe('S87 L-06 — akar aset profil templat', () => {
  it('resolveRepoAssetPath(".env") dan path di luar folder aset -> PATH_OUTSIDE_ROOT', () => {
    for (const p of ['.env', 'package.json', 'src/lib/studio/assets/../../../../.env', 'src/lib/studio/assets/.env']) {
      expect(() => resolveRepoAssetPath(p)).toThrow(StudioEngineError);
    }
    expect(resolveRepoAssetPath('src/lib/studio/assets/fonts/x.ttf')).toMatch(/assets[\\/]fonts[\\/]x\.ttf$/);
  });

  it('validateAssets profil: path .env -> isu SCHEMA_INVALID; ekstensi .txt ditolak; .ttf di folder aset diterima', () => {
    const sha = 'a'.repeat(64);
    const r = validateAssets({
      env: { sha256: sha, path: '.env', kind: 'raster' },
      txt: { sha256: sha, path: 'src/lib/studio/assets/fonts/LICENSE.txt', kind: 'font' },
      ok: { sha256: sha, path: 'src/lib/studio/assets/fonts/IBMPlexSans.ttf', kind: 'font' },
    });
    expect(r.issues.map((i) => i.key).sort()).toEqual(['env', 'txt']);
    expect(Object.keys(r.assets)).toEqual(['ok']);
  });
});

describe('S87 L-07 — Content-Type route tulis', () => {
  it('POST documents dengan text/plain -> 415 UNSUPPORTED_MEDIA_TYPE sebelum badan dibaca', async () => {
    const res = await postDocument(await req('/api/studio/documents', { auth: 'user', body: JSON.stringify({ document: studioDoc() }), headers: { 'content-type': 'text/plain;charset=UTF-8' } }));
    expect(res.status).toBe(415);
    expect((await jsonOf(res)).code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(dbWrites()).toEqual([]);
  });

  it('application/json; charset=utf-8 dan application/merge-patch+json diterima pada lapisan Content-Type', async () => {
    installTemplates(canonicalTemplate());
    for (const ct of ['application/json; charset=utf-8', 'application/vnd.gsp+json']) {
      const res = await postValidate(await req('/api/studio/validate', { auth: 'user', body: JSON.stringify({ document: studioDoc() }), headers: { 'content-type': ct } }));
      expect(res.status).toBe(200);
    }
  });
});

describe('S85 R-06 / R-08 / R-09 — satu sumber', () => {
  it('R-06: DTO route-kit, ingest, dan revisi adalah fungsi yang sama', () => {
    expect(toDocumentSummary).toBe(documentSummary);
    expect(ingestDocumentSummary).toBe(documentSummary);
    expect(toRevisionSummary).toBe(revisionSummary);
  });

  it('R-08: JSON kanonik satu implementasi; hash data JSON sama dengan implementasi lama', () => {
    expect(revCanonical.stableStringify).toBe(ingestUtil.stableStringify);
    expect(profileStableStringify).toBe(ingestUtil.stableStringify);
    const data = { b: [1, { z: null, a: 'x' }], a: { c: true, b: 2.5 } };
    // Implementasi lama layanan revisi (canon + JSON.stringify), disalin untuk uji kesetaraan.
    const canon = (v: unknown): unknown =>
      Array.isArray(v)
        ? v.map((x) => (x === undefined ? null : canon(x)))
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.keys(v).sort().filter((k) => (v as any)[k] !== undefined).map((k) => [k, canon((v as any)[k])]))
          : v;
    expect(ingestUtil.stableStringify(data)).toBe(JSON.stringify(canon(data)));
    expect(revCanonical.canonicalSha256(data)).toBe(ingestUtil.sha256Hex(JSON.stringify(canon(data))));
  });

  // SR-43 lanjutan (D-247, D-261): R04 v1 tidak lagi merender, jadi R-09 tidak teramati lewat R04.
  // Satu sumber pemetaan galat render tetap diuji pada `errorCodeOf` (dipakai route render).
  it('R-09: R04 v1 tidak memanggil render (D-247) -> 201 job null; errorCodeOf galat tak bertipe = RENDER_FAILED', async () => {
    installTemplates(canonicalTemplate());
    installPersist();
    render.renderRevision.mockRejectedValue(new Error('boom'));
    const res = await postDocument(await req('/api/studio/documents', { auth: 'agent', body: { document: studioDoc() } }));
    expect(res.status).toBe(201);
    const b = await jsonOf(res);
    expect(b.job).toBeNull();
    expect(b.errors ?? []).toEqual([]);
    expect(render.renderRevision).not.toHaveBeenCalled();
    expect(errorCodeOf(new Error('boom'), 'RENDER_FAILED')).toBe('RENDER_FAILED');
    expect(errorCodeOf(new StudioEngineError('RENDER_QUEUE_FULL', 'x'), 'RENDER_FAILED')).toBe('RENDER_QUEUE_FULL');
  });
});
