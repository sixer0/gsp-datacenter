// FIX-H1 (D-321 friksi Hermes C1, D-322): render dengan pdf saat render-env tidak siap
// ditolak LEBIH AWAL (503 PDF_ENGINE_UNAVAILABLE tahap preflight, tanpa job), format lain
// tetap jalan, dan hasil sebagian ditandai `partial` + `failedFormats` + header
// `X-Studio-Render-Status` secara konsisten di R17 (200) dan R09 (201).
// Prisma DI-MOCK untuk R09; R17 diuji lewat `handleRenderPost` dengan dependensi tiruan.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const render = vi.hoisted(() => ({ renderRevision: vi.fn(), renderArtifact: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/render', async (orig) => ({ ...(await orig<object>()), ...render }));

import { on, resetDb } from './_prisma';
import { canonicalTemplate, captureServiceLogs, fakeJob, installTemplates, jsonOf, req, studioDoc, T_FIXED } from './_studio';
import { POST as postArtifact } from '@/app/api/studio/artifacts/route';
import { handleRenderPost, type RenderRouteDeps, type RenderScopeResult } from '@/app/api/studio/documents/[id]/render/_lib/handler';
import {
  assertPdfRenderReady,
  isPdfPreflightRejection,
  layCausesOf,
  renderOutcomeMarker,
  PDF_PREFLIGHT_RETRY_AFTER_SEC,
  RENDER_STATUS_HEADER,
  type ReadinessFn,
} from '@/lib/studio/services/render/preflight';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { reqCtx } from '@/lib/studio/http';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import type { OutputFileDto, RenderJobDto } from '@/lib/studio/contract/types/api';
import type { CompletenessReportV2 } from '@/lib/studio/contract';

type Out = Pick<OutputFileDto, 'id' | 'format' | 'role' | 'relPath' | 'fileName'>;

// 17 fon per-pengguna terdaftar tetapi belum dimuat di sesi (persis temuan Hermes C1).
const SESSION_FONT_ERRORS = Array.from(
  { length: 17 },
  (_, i) => `font family not loaded in session: "IBM Plex ${i}" (IBMPlex${i}.ttf); sign in again so per-user fonts load`,
);
const NOT_READY = { ready: false, errors: SESSION_FONT_ERRORS, checkedAt: '2026-10-30T02:00:00.000Z' };
const READY = { ready: true, errors: [] as string[], checkedAt: '2026-10-30T02:00:00.000Z' };

const DOC_ID = 'cmvucp1d70002v13c945whd78';
const CALLER: StudioCaller = { kind: 'INTERNAL_AGENT', requester: 'agent:hermes-gsp-master01', canWriteClassK: false } as StudioCaller;

function scopeResult(over: Partial<RenderScopeResult['job']> = {}, outputs: Out[] = [], errors: RenderScopeResult['errors'] = []): RenderScopeResult {
  return {
    job: { ...(fakeJob({ documentId: DOC_ID, formats: ['DOCX', 'PDF', 'HTML'] }) as unknown as RenderJobDto), scope: { kind: 'DOCUMENT' }, draft: false, ...over },
    outputs: outputs as unknown as OutputFileDto[],
    completeness: { status: 'COMPLETE', missingRequired: [] } as unknown as CompletenessReportV2,
    errors,
  };
}

const out = (format: OutputFileDto['format'], role: OutputFileDto['role'] = 'PRIMARY'): Out => ({
  id: `o-${format}-${role}`,
  format,
  role,
  relPath: `x/${format}`,
  fileName: `f.${format.toLowerCase()}`,
});

// FIX-HR2 (D-332 C1): gerbang PDF hanya di layanan `renderScope` (sesudah 404/409/422).
// Tiruan layanan meniru urutan itu: gerbang format eksplisit lalu `inner` (sisa layanan).
function deps(readiness: ReadinessFn, inner: RenderRouteDeps['renderScope']): RenderRouteDeps {
  return {
    getCaller: async () => CALLER,
    checkRate: () => null,
    assertCapacity: () => {},
    renderScope: inner
      ? async (caller, documentId, request) => {
          await assertPdfRenderReady(request.formats, readiness);
          return inner(caller, documentId, request);
        }
      : null,
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

async function postR17(body: Record<string, unknown>, d: RenderRouteDeps): Promise<Response> {
  const r = renderReq(body);
  return handleRenderPost(r, DOC_ID, reqCtx(r as unknown as Parameters<typeof reqCtx>[0], '/api/studio/documents/[id]/render', 'studio.api.render'), d);
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  render.renderArtifact.mockReset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('FIX-H1 preflight: assertPdfRenderReady', () => {
  it('tanpa pdf -> lolos tanpa memanggil cek kesiapan (format lain tidak digerbang)', async () => {
    const readiness = vi.fn(async () => NOT_READY);
    await expect(assertPdfRenderReady(['docx', 'html'], readiness)).resolves.toBeUndefined();
    await expect(assertPdfRenderReady(undefined, readiness)).resolves.toBeUndefined();
    expect(readiness).not.toHaveBeenCalled();
  });

  it('pdf + siap -> lolos', async () => {
    await expect(assertPdfRenderReady(['PDF'], async () => READY)).resolves.toBeUndefined();
  });

  it('pdf + tidak siap (17 fon sesi) -> 503 PDF_ENGINE_UNAVAILABLE tahap preflight, penyebab awam, saran formats tanpa pdf', async () => {
    const err = await assertPdfRenderReady(['docx', 'pdf', 'html'], async () => NOT_READY).catch((e) => e);
    expect(err).toBeInstanceOf(StudioEngineError);
    expect(err.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(err.httpStatus).toBe(503);
    expect(isPdfPreflightRejection(err)).toBe(true);
    const d = err.details;
    expect(d).toMatchObject({
      stage: 'preflight',
      jobCreated: false,
      retryable: true,
      requiresOperatorAction: true,
      retryAfterSec: PDF_PREFLIGHT_RETRY_AFTER_SEC,
      requestedFormats: ['docx', 'pdf', 'html'],
      suggestedFormats: ['docx', 'html'],
      statusEndpoint: 'GET /api/studio/render-env',
      checkedAt: NOT_READY.checkedAt,
    });
    expect(d.causes).toHaveLength(1);
    expect(d.causes[0]).toMatchObject({ code: 'FONTS_NOT_LOADED_IN_SESSION', count: 17 });
    expect(d.causes[0].message).toMatch(/17 berkas fon/);
    expect(d.causes[0].message).toMatch(/sign out\/sign in/);
    expect(d.reason).toMatch(/Tidak ada job render yang dibuat/);
    // Tanpa path server di badan.
    expect(JSON.stringify(d)).not.toMatch(/[A-Za-z]:\\\\|%USERPROFILE%|\.ttf/);
  });

  it('hanya pdf diminta -> saran docx+html; docx+pdf -> saran docx', async () => {
    const a = await assertPdfRenderReady(['pdf'], async () => NOT_READY).catch((e) => e);
    expect(a.details.suggestedFormats).toEqual(['docx', 'html']);
    const b = await assertPdfRenderReady(['docx', 'pdf'], async () => NOT_READY).catch((e) => e);
    expect(b.details.suggestedFormats).toEqual(['docx']);
  });

  it('cek kesiapan melempar -> tetap 503 preflight dengan penyebab READINESS_CHECK_FAILED', async () => {
    const err = await assertPdfRenderReady(['pdf'], async () => {
      throw new Error('powershell timeout');
    }).catch((e) => e);
    expect(isPdfPreflightRejection(err)).toBe(true);
    expect(err.details.causes.map((c: { code: string }) => c.code)).toEqual(['READINESS_CHECK_FAILED']);
    expect(err.details.checkedAt).toBeNull();
  });

  it('layCausesOf mengelompokkan galat teknis per penyebab, urutan kemunculan', () => {
    const r = layCausesOf([
      'soffice binary not found (check SOFFICE_PATH or manifest soffice.path)',
      'font not registered in HKCU: IBM Plex Sans Regular (a.ttf): value "x" absent',
      'font not registered in HKCU: IBM Plex Sans Bold (b.ttf): value "y" absent',
      'something unexpected',
    ]);
    expect(r.causes.map((c) => [c.code, c.count])).toEqual([
      ['PDF_ENGINE_MISSING', 1],
      ['FONTS_NOT_REGISTERED', 2],
      ['OTHER', 1],
    ]);
    expect(layCausesOf([]).causes[0].code).toBe('OTHER');
  });
});

describe('FIX-H1 R17 POST /documents/[id]/render', () => {
  it('formats memuat pdf + render-env tidak siap -> 503 + Retry-After + correlation id, renderScope TIDAK dipanggil (tanpa job)', async () => {
    const renderScope = vi.fn(async () => scopeResult());
    const res = await postR17({ scope: 'document', formats: ['docx', 'pdf', 'html'] }, deps(async () => NOT_READY, renderScope));
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe(String(PDF_PREFLIGHT_RETRY_AFTER_SEC));
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    const b = await jsonOf(res);
    expect(b.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(b.details).toMatchObject({ stage: 'preflight', jobCreated: false, retryable: true, suggestedFormats: ['docx', 'html'] });
    expect(b.details.causes[0].code).toBe('FONTS_NOT_LOADED_IN_SESSION');
    expect(typeof b.details.reason).toBe('string');
    expect(renderScope).not.toHaveBeenCalled();
  });

  it('pdf (huruf besar) pada lingkup chapter juga ditolak tanpa job', async () => {
    const renderScope = vi.fn(async () => scopeResult());
    const res = await postR17({ scope: 'chapter', key: '3', formats: ['PDF'] }, deps(async () => NOT_READY, renderScope));
    expect(res.status).toBe(503);
    expect(renderScope).not.toHaveBeenCalled();
  });

  it('tanpa pdf saat render-env tidak siap -> render tetap jalan, 200, partial false, header SUCCEEDED', async () => {
    const readiness = vi.fn(async () => NOT_READY);
    const renderScope = vi.fn(async () => scopeResult({ formats: ['DOCX', 'HTML'] }, [out('DOCX'), out('HTML')]));
    const res = await postR17({ scope: 'document', formats: ['docx', 'html'] }, deps(readiness, renderScope));
    expect(res.status).toBe(200);
    expect(renderScope).toHaveBeenCalledTimes(1);
    expect(readiness).not.toHaveBeenCalled();
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('SUCCEEDED');
    const b = await jsonOf(res);
    expect(b.partial).toBe(false);
    expect(b.failedFormats).toEqual([]);
    expect(b.errors).toEqual([]);
  });

  it('format bawaan (tanpa formats) ditolak layanan dengan preflight -> route menjawab 503 yang sama', async () => {
    const renderScope = vi.fn(async () => {
      await assertPdfRenderReady(['DOCX', 'PDF', 'HTML'], async () => NOT_READY);
      return scopeResult();
    });
    const res = await postR17({ scope: 'document' }, deps(async () => NOT_READY, renderScope));
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe(String(PDF_PREFLIGHT_RETRY_AFTER_SEC));
    expect((await jsonOf(res)).details.stage).toBe('preflight');
  });

  it('kegagalan sebagian runtime soffice (env siap) -> 200 dengan partial true + failedFormats [PDF] + errors + header PARTIAL', async () => {
    const renderScope = vi.fn(async () =>
      scopeResult(
        { status: 'PARTIAL', errorCode: 'PDF_CONVERT_FAILED' },
        [out('DOCX'), out('HTML'), out('PNG', 'FIGURE')],
        [{ code: 'PDF_CONVERT_FAILED', message: 'soffice exited 1', format: 'PDF' }],
      ),
    );
    const res = await postR17({ scope: 'document', formats: ['docx', 'pdf', 'html'] }, deps(async () => READY, renderScope));
    expect(res.status).toBe(200);
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('PARTIAL');
    const b = await jsonOf(res);
    expect(b.job.status).toBe('PARTIAL');
    expect(b.partial).toBe(true);
    expect(b.failedFormats).toEqual(['PDF']);
    expect(b.errors).toEqual([{ code: 'PDF_CONVERT_FAILED', message: 'soffice exited 1', format: 'PDF' }]);
  });
});

describe('FIX-H1 renderOutcomeMarker (aturan bersama R17/R09)', () => {
  it('artefak chart: SVG ada, PNG gagal -> partial, failedFormats [PNG]', () => {
    const m = renderOutcomeMarker({ status: 'PARTIAL', formats: ['SVG', 'PNG'] }, [out('SVG')], [{ format: 'PNG' }]);
    expect(m).toEqual({ partial: true, failedFormats: ['PNG'] });
  });

  it('render dokumen tanpa figur: SVG diminta tanpa berkas tidak dihitung gagal; PDF tanpa berkas dihitung', () => {
    const m = renderOutcomeMarker({ status: 'PARTIAL', formats: ['DOCX', 'PDF', 'SVG'] }, [out('DOCX')], []);
    expect(m).toEqual({ partial: true, failedFormats: ['PDF'] });
  });

  it('FAILED -> partial false, semua format gagal; SUCCEEDED -> kosong', () => {
    expect(renderOutcomeMarker({ status: 'FAILED', formats: ['DOCX', 'PDF'] }, [], [])).toEqual({ partial: false, failedFormats: ['DOCX', 'PDF'] });
    expect(renderOutcomeMarker({ status: 'SUCCEEDED', formats: ['DOCX'] }, [out('DOCX')], [])).toEqual({ partial: false, failedFormats: [] });
  });
});

describe('FIX-H1 R09 POST /artifacts: penanda yang sama, status 201 dipertahankan', () => {
  const htmlSpec = (doc: Record<string, unknown>) => ({ $schema: 'studio.html/v1', template: { slug: 'datum-kanonik' }, source: { kind: 'inline', document: doc } });

  function install(outcome: Record<string, unknown>): void {
    installTemplates(canonicalTemplate());
    on('studioArtifact', 'create', async ({ data }: { data: Record<string, unknown> }) => ({ id: 'art-1', createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
    on('studioArtifact', 'findUnique', async () => null);
    render.renderArtifact.mockResolvedValue(outcome);
  }

  it('job PARTIAL -> 201 + partial true + header PARTIAL', async () => {
    install({
      job: fakeJob({ artifactId: 'art-1', formats: ['HTML'], status: 'PARTIAL', errorCode: 'STORAGE_WRITE_FAILED' }),
      outputs: [out('HTML')],
      errors: [{ code: 'STORAGE_WRITE_FAILED', message: 'sidecar write failed' }],
    });
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'admin', body: { spec: htmlSpec(studioDoc()), formats: ['html'] } }));
    expect(res.status).toBe(201);
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('PARTIAL');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const b = await jsonOf(res);
    expect(b.partial).toBe(true);
    expect(b.failedFormats).toEqual([]);
    expect(b.errors).toHaveLength(1);
  });

  it('job SUCCEEDED -> 201 + partial false + failedFormats [] + header SUCCEEDED', async () => {
    install({ job: fakeJob({ artifactId: 'art-1', formats: ['HTML'] }), outputs: [out('HTML')], errors: [] });
    const res = await postArtifact(await req('/api/studio/artifacts', { auth: 'admin', body: { spec: htmlSpec(studioDoc()), formats: ['html'] } }));
    expect(res.status).toBe(201);
    expect(res.headers.get(RENDER_STATUS_HEADER)).toBe('SUCCEEDED');
    const b = await jsonOf(res);
    expect(b.partial).toBe(false);
    expect(b.failedFormats).toEqual([]);
  });
});
