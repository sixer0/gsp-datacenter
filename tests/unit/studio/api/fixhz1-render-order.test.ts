// FIX-HZ1 (penutup batch Hermes; D-324, D-325):
//  (1) R08 validate meneruskan `details` isu (mis. 409 SCOPE_CONFLICT PATCHED_PIDS_OVERWRITTEN
//      + overwrittenPids) seperti badan galat kiriman nyata;
//  (2) R17: dokumen/revisi tidak ada -> 404 SEBELUM 503 preflight PDF;
//  (3) R07 render ulang revisi: gerbang PDF yang sama (503 dini, tanpa job, 404/409 didahulukan)
//      dan penanda hasil sebagian `partial`/`failedFormats`/`errors` + header seperti R17/R09;
//  (4) pembantu UI awam 503/partial (`render-card-outcome.ts`, `draftNotice`).
// Prisma DI-MOCK; layanan submit/render ditiru sebagian.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const submit = vi.hoisted(() => ({ dryRunChapter: vi.fn(), dryRunSlot: vi.fn() }));
const render = vi.hoisted(() => ({ renderRevision: vi.fn(), renderArtifact: vi.fn(), readiness: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...submit }));
vi.mock('@/lib/studio/services/render', async (orig) => {
  const actual = await orig<typeof import('@/lib/studio/services/render')>();
  return {
    ...actual,
    renderRevision: render.renderRevision,
    renderArtifact: render.renderArtifact,
    // Gerbang nyata dengan cek kesiapan tiruan (tanpa soffice).
    assertPdfRenderReady: (formats: readonly string[] | undefined) => actual.assertPdfRenderReady(formats, render.readiness),
  };
});

import { callsOf, on, resetDb } from './_prisma';
import { fakeJob, jsonOf, params, req } from './_studio';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { issuesFromError } from '@/app/api/studio/validate/_shared/error-issues';
import { POST as postRerender } from '@/app/api/studio/documents/[id]/revisions/route';
import { handleRenderPost, type RenderRouteDeps } from '@/app/api/studio/documents/[id]/render/_lib/handler';
import { assertPdfRenderReady, RENDER_STATUS_HEADER, type ReadinessFn } from '@/lib/studio/services/render/preflight';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { reqCtx } from '@/lib/studio/http';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { StudioApiError } from '@/components/studio/shared/http';
import { formatNames, outcomeOf, pdfNotReadyOf } from '@/components/studio/document-viewer/render-card-outcome';
import { draftNotice } from '@/components/studio/document-viewer/completeness-tab';

const DOC_ID = 'cmvucp1d70002v13c945whd78';
const SESSION_FONT_ERRORS = Array.from({ length: 3 }, (_, i) => `font family not loaded in session: "IBM Plex ${i}"`);
const NOT_READY = { ready: false, errors: SESSION_FONT_ERRORS, checkedAt: '2026-10-30T02:00:00.000Z' };
const READY = { ready: true, errors: [] as string[], checkedAt: '2026-10-30T02:00:00.000Z' };
const CALLER = { kind: 'INTERNAL_AGENT', requester: 'agent:hermes-gsp-master01', canWriteClassK: false } as unknown as StudioCaller;

const OVERWRITE_DETAILS = {
  scope: 'chapter:4',
  reason: 'PATCHED_PIDS_OVERWRITTEN',
  baseRevisionNo: null,
  referenceRevisionNo: 2,
  latestRevisionNo: 3,
  overwrittenPids: [{ pid: 'p-4-1-2', address: '4.1.2', editedInRevision: 3, editedBy: 'agent:agen-2' }],
  forwardToController: 'Baca isi terkini lewat GET /api/studio/documents/x/content, gabungkan, kirim ulang dengan baseRevisionNo 3',
};

function chapterBody(): Record<string, unknown> {
  return {
    $schema: 'studio.chapter/v2',
    target: { mission: { folder: '2026-10-30_fixhz1' }, docKey: 'laporan-survei' },
    chapter: {
      key: '4',
      title: { text: 'Bab 4 uji' },
      sections: [{ title: { text: 'Bagian pertama' }, blocks: [{ type: 'paragraph', text: 'Pengukuran beban dilakukan pada jam puncak.' }] }],
    },
  };
}

beforeEach(() => {
  resetDb();
  vi.clearAllMocks();
});

// ── (1) R08 meneruskan details ───────────────────────────────────────────

describe('FIX-HZ1 (1): R08 validate meneruskan details isu', () => {
  it('issuesFromError: details objek ikut apa adanya (overwrittenPids)', () => {
    const issues = issuesFromError(new StudioEngineError('SCOPE_CONFLICT', 'chapter 4 overwrites patched paragraphs', OVERWRITE_DETAILS));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ keyword: 'SCOPE_CONFLICT', details: OVERWRITE_DETAILS });
    expect(issues[0]!.details?.overwrittenPids).toEqual(OVERWRITE_DETAILS.overwrittenPids);
  });

  it('issuesFromError: details larik isu tetap dipakai sebagai isu (tanpa medan details)', () => {
    const arr = [{ pointer: '/chapter/key', keyword: 'pattern', message: 'bad key' }];
    const issues = issuesFromError(new StudioEngineError('SCHEMA_INVALID', 'invalid', arr));
    expect(issues).toEqual(arr);
  });

  it('POST /api/studio/validate bab v2: 409 SCOPE_CONFLICT dry-run -> valid:false, isu membawa overwrittenPids + forwardToController', async () => {
    submit.dryRunChapter.mockRejectedValue(new StudioEngineError('SCOPE_CONFLICT', 'chapter 4 overwrites patched paragraphs', OVERWRITE_DETAILS));
    const res = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: chapterBody() }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(submit.dryRunChapter).toHaveBeenCalledTimes(1);
    expect(b.valid).toBe(false);
    expect(b.issues[0].keyword).toBe('SCOPE_CONFLICT');
    expect(b.issues[0].details.reason).toBe('PATCHED_PIDS_OVERWRITTEN');
    expect(b.issues[0].details.overwrittenPids).toEqual(OVERWRITE_DETAILS.overwrittenPids);
    expect(b.issues[0].details.forwardToController).toContain('baseRevisionNo 3');
  });
});

// ── (2) R17 urutan 404 -> 503 ────────────────────────────────────────────
// FIX-HR2 (D-332 C1): route tidak lagi punya gerbang PDF/`assertTarget` sendiri; urutan
// 404 -> 409/422 -> 503 datang dari satu gerbang di `renderScope`. Tiruan layanan di sini
// melempar galat sasaran lebih dulu (seperti `prepareScopeRender`) lalu menggerbang pdf.
// Matriks lengkap terhadap layanan nyata + DB: api-structure/fixhr2-render-order.test.ts.

function renderDeps(readiness: ReadinessFn, targetError?: StudioEngineError): RenderRouteDeps & { scope: ReturnType<typeof vi.fn> } {
  const scope = vi.fn(async (_c: unknown, _d: unknown, r: { formats?: string[] }) => {
    if (targetError) throw targetError;
    await assertPdfRenderReady(r.formats, readiness);
    throw new Error('tidak boleh sampai ke job');
  });
  return {
    scope,
    getCaller: async () => CALLER,
    checkRate: () => null,
    assertCapacity: () => {},
    renderScope: scope as unknown as RenderRouteDeps['renderScope'],
    retryAfterSec: () => 1,
  };
}

function renderReq(body: Record<string, unknown>): Request {
  return new Request(`http://127.0.0.1:9021/api/studio/documents/${DOC_ID}/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('FIX-HZ1 (2): R17 dokumen tidak ada -> 404 sebelum 503 preflight', () => {
  it('pdf + dokumen tidak ada + render-env tidak siap -> 404 DOCUMENT_NOT_FOUND; cek kesiapan TIDAK dipanggil', async () => {
    const readiness = vi.fn(async () => NOT_READY);
    const deps = renderDeps(readiness, new StudioEngineError('DOCUMENT_NOT_FOUND', `document ${DOC_ID} not found`, { documentId: DOC_ID }));
    const res = await handleRenderPost(renderReq({ scope: 'document', formats: ['pdf'] }), DOC_ID, reqCtx(renderReq({}), '/r', 'test'), deps);
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('DOCUMENT_NOT_FOUND');
    expect(readiness).not.toHaveBeenCalled();
  });

  it('pdf + revisionNo tidak ada -> 404 REVISION_NOT_FOUND sebelum 503', async () => {
    const readiness = vi.fn(async () => NOT_READY);
    const deps = renderDeps(readiness, new StudioEngineError('REVISION_NOT_FOUND', 'revision 9 not found', { documentId: DOC_ID, revisionNo: 9 }));
    const res = await handleRenderPost(renderReq({ scope: 'document', formats: ['pdf'], revisionNo: 9 }), DOC_ID, reqCtx(renderReq({}), '/r', 'test'), deps);
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('REVISION_NOT_FOUND');
    expect(readiness).not.toHaveBeenCalled();
  });

  it('pdf + dokumen ada + tidak siap -> 503 preflight + Retry-After (dari layanan)', async () => {
    const readiness = vi.fn(async () => NOT_READY);
    const deps = renderDeps(readiness);
    const res = await handleRenderPost(renderReq({ scope: 'document', formats: ['pdf', 'docx'] }), DOC_ID, reqCtx(renderReq({}), '/r', 'test'), deps);
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('300');
    const b = await jsonOf(res);
    expect(b.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(b.details).toMatchObject({ stage: 'preflight', jobCreated: false, suggestedFormats: ['docx'] });
    expect(deps.scope).toHaveBeenCalledTimes(1);
  });

  it('route tidak membaca DB sendiri (tanpa baca sasaran ganda), apa pun formats', async () => {
    for (const formats of [['docx'], ['pdf'], undefined]) {
      resetDb();
      const deps = renderDeps(vi.fn(async () => NOT_READY), new StudioEngineError('DOCUMENT_NOT_FOUND', 'not found', { documentId: DOC_ID }));
      const res = await handleRenderPost(renderReq({ scope: 'document', ...(formats ? { formats } : {}) }), DOC_ID, reqCtx(renderReq({}), '/r', 'test'), deps);
      expect(res.status).toBe(404);
      expect(callsOf('studioDocument', 'findUnique')).toHaveLength(0);
      expect(callsOf('studioRevision', 'findUnique')).toHaveLength(0);
    }
  });
});

// ── (3) R07 render ulang revisi ──────────────────────────────────────────

function installRevision(completeness: 'COMPLETE' | 'INCOMPLETE' = 'COMPLETE'): void {
  on('studioDocument', 'findUnique', async () => ({ id: DOC_ID, currentRevisionNo: 1, docNumber: 'GSP-X' }));
  on('studioRevision', 'findUnique', async () => ({ id: 'rev-1', documentId: DOC_ID, revisionNo: 1, completeness, snapshot: { doc: { outputs: ['docx', 'pdf'] }, blocks: [] } }));
  on('studioRenderJob', 'findFirst', async () => null);
  on('studioRenderJob', 'findMany', async () => []);
  on('studioOutputFile', 'findMany', async () => []);
}

async function rerender(body: Record<string, unknown>): Promise<Response> {
  return postRerender(await req(`/api/studio/documents/${DOC_ID}/revisions`, { auth: 'agent', body }), params({ id: DOC_ID }));
}

describe('FIX-HZ1 (3): R07 renderRevision memakai preflight + penanda sebagian', () => {
  it('pdf eksplisit + tidak siap -> 503 preflight + Retry-After; renderRevision TIDAK dipanggil', async () => {
    installRevision();
    render.readiness.mockResolvedValue(NOT_READY);
    const res = await rerender({ revisionNo: 1, formats: ['pdf'] });
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('300');
    const b = await jsonOf(res);
    expect(b.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(b.details).toMatchObject({ stage: 'preflight', jobCreated: false, suggestedFormats: ['docx', 'html'] });
    expect(b.details.causes[0].code).toBe('FONTS_NOT_LOADED_IN_SESSION');
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('format bawaan snapshot memuat PDF + tidak siap -> 503 juga', async () => {
    installRevision();
    render.readiness.mockResolvedValue(NOT_READY);
    const res = await rerender({ revisionNo: 1 });
    expect(res.status).toBe(503);
    expect(render.renderRevision).not.toHaveBeenCalled();
  });

  it('dokumen tidak ada + pdf + tidak siap -> 404 lebih dulu (cek kesiapan tidak dipanggil)', async () => {
    on('studioDocument', 'findUnique', async () => null);
    render.readiness.mockResolvedValue(NOT_READY);
    const res = await rerender({ revisionNo: 1, formats: ['pdf'] });
    expect(res.status).toBe(404);
    expect(render.readiness).not.toHaveBeenCalled();
  });

  it('revisi INCOMPLETE: gerbang PDF dilewati agar 409 DOCUMENT_INCOMPLETE dari renderRevision didahulukan', async () => {
    installRevision('INCOMPLETE');
    render.readiness.mockResolvedValue(NOT_READY);
    render.renderRevision.mockRejectedValue(new StudioEngineError('DOCUMENT_INCOMPLETE', 'incomplete', { completeness: null }));
    const res = await rerender({ revisionNo: 1, formats: ['pdf'] });
    expect(res.status).toBe(409);
    expect(render.readiness).not.toHaveBeenCalled();
  });

  it('tanpa pdf saat tidak siap -> 200 SUCCEEDED, partial:false, header status', async () => {
    installRevision();
    render.readiness.mockResolvedValue(NOT_READY);
    render.renderRevision.mockResolvedValue({
      job: fakeJob({ documentId: DOC_ID, formats: ['DOCX'], status: 'SUCCEEDED' }),
      outputs: [{ id: 'o1', format: 'DOCX', role: 'PRIMARY', sha256: 'a', figureLabel: null }],
      errors: [],
    });
    const res = await rerender({ revisionNo: 1, formats: ['docx'] });
    expect(res.status).toBe(200);
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('SUCCEEDED');
    const b = await jsonOf(res);
    expect(b).toMatchObject({ partial: false, failedFormats: [], errors: [] });
    expect(render.readiness).not.toHaveBeenCalled();
  });

  it('job PARTIAL -> 200 partial:true, failedFormats ["PDF"], errors, header PARTIAL', async () => {
    installRevision();
    render.readiness.mockResolvedValue(READY);
    const errors = [{ code: 'PDF_CONVERT_FAILED', message: 'convert failed', format: 'PDF' }];
    render.renderRevision.mockResolvedValue({
      job: { ...fakeJob({ documentId: DOC_ID, formats: ['DOCX', 'PDF'], status: 'PARTIAL' }), errors },
      outputs: [{ id: 'o1', format: 'DOCX', role: 'PRIMARY', sha256: 'a', figureLabel: null }],
      errors,
    });
    const res = await rerender({ revisionNo: 1, formats: ['docx', 'pdf'] });
    expect(res.status).toBe(200);
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('PARTIAL');
    const b = await jsonOf(res);
    expect(b.partial).toBe(true);
    expect(b.failedFormats).toEqual(['PDF']);
    expect(b.errors[0].code).toBe('PDF_CONVERT_FAILED');
    expect(typeof b.identical).toBe('boolean');
    expect(callsOf('studioRevision', 'findUnique').length).toBeGreaterThan(0);
  });
});

// ── (4) Pembantu UI awam ─────────────────────────────────────────────────

function apiError(details: unknown, retryAfterSec: number | null = 300): StudioApiError {
  return new StudioApiError({ status: 503, code: 'PDF_ENGINE_UNAVAILABLE', message: 'PDF engine not ready', details, url: '/x', method: 'POST', retryAfterSec });
}

describe('FIX-HZ1 (4): UI render-card / completeness-tab bahasa awam', () => {
  it('pdfNotReadyOf: 503 preflight -> judul, alasan, penyebab awam, saran tanpa PDF', () => {
    const v = pdfNotReadyOf(
      apiError({
        stage: 'preflight',
        jobCreated: false,
        reason: 'Tidak ada job render yang dibuat',
        causes: [{ code: 'FONTS_NOT_LOADED_IN_SESSION', message: 'x', count: 17 }, { code: 'XYZ', message: 'GET /api/studio/render-env', count: 1 }],
        suggestedFormats: ['docx', 'html'],
        retryAfterSec: 300,
        checkedAt: '2026-10-30T02:00:00.000Z',
      }),
    );
    expect(v).not.toBeNull();
    expect(v!.title).toBe('PDF belum bisa dibuat sekarang');
    expect(v!.body).toContain('Word dan Halaman web');
    expect(v!.suggestedFormats).toEqual(['docx', 'html']);
    expect(v!.suggestLabel).toBe('Buat tanpa PDF (Word, Halaman web)');
    expect(v!.causes[0]).toContain('keluar lalu masuk kembali');
    expect(v!.retryAfterSec).toBe(300);
    // Teks server (memuat istilah teknis) tidak dipakai di permukaan utama.
    const surface = [v!.title, v!.body, v!.suggestLabel, ...v!.causes].join(' ');
    expect(surface).not.toMatch(/\b(render|job|payload|JSON|slot|pid)\b/i);
  });

  it('pdfNotReadyOf: tanpa suggestedFormats -> tanpa tombol saran; galat lain / PDF di dalam job -> null', () => {
    const v = pdfNotReadyOf(apiError({ stage: 'preflight', causes: [] }, null));
    expect(v!.suggestLabel).toBeNull();
    expect(v!.body).toContain('Coba lagi beberapa menit lagi');
    expect(pdfNotReadyOf(apiError({ stage: 'job' }))).toBeNull();
    expect(pdfNotReadyOf(new StudioApiError({ status: 404, code: 'DOCUMENT_NOT_FOUND', message: 'x', url: '/x', method: 'POST' }))).toBeNull();
    expect(pdfNotReadyOf(new Error('x'))).toBeNull();
  });

  it('outcomeOf: partial + failedFormats -> kalimat awam; sukses -> kosong; server lama tanpa medan -> dari job', () => {
    expect(outcomeOf({ job: { status: 'PARTIAL' }, partial: true, failedFormats: ['PDF'] }).text).toBe('PDF belum berhasil dibuat; berkas lain sudah siap di tab Berkas.');
    expect(outcomeOf({ job: { status: 'SUCCEEDED' }, partial: false, failedFormats: [] }).text).toBe('');
    const legacy = outcomeOf({ job: { status: 'PARTIAL', errors: [{ format: 'PDF' }, { format: 'HTML' }] } });
    expect(legacy.partial).toBe(true);
    expect(legacy.failedNames).toEqual(['PDF', 'Halaman web']);
    expect(outcomeOf({ job: { status: 'FAILED' }, failedFormats: ['DOCX'] }).text).toBe('Word gagal dibuat.');
    expect(formatNames(['docx', 'html', 'pdf'])).toBe('Word, Halaman web dan PDF');
  });

  it('draftNotice (completeness-tab): partial -> warn bahasa awam', () => {
    expect(draftNotice('Ringkasan', { job: { status: 'PARTIAL' }, partial: true, failedFormats: ['PDF'] })).toEqual({
      message: 'Draf Ringkasan: PDF belum berhasil dibuat; berkas lain sudah siap di tab Berkas.',
      tone: 'warn',
    });
    expect(draftNotice('Ringkasan', { job: { status: 'SUCCEEDED' }, partial: false, failedFormats: [] }).tone).toBe('success');
    expect(draftNotice('Ringkasan', { job: { status: 'FAILED' }, failedFormats: ['PDF'] }).message).toBe('Draf Ringkasan gagal dibuat: PDF gagal dibuat.');
  });
});
