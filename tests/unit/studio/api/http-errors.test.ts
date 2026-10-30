// S74 — Batas ukuran badan dan pemetaan kode galat kontrak ke HTTP.
// Sumber ekspektasi (literal, independen dari implementasi): 01_specs.md §6.1 ("Batas badan: tolak
// sebelum parse bila content-length > STUDIO_MAX_JSON_BYTES (413 PAYLOAD_TOO_LARGE)"), §6.3 tabel kode
// galat + revisi d1/d2 (41 kode), §7.1 C09 = 5242880; API-REFERENCE §12 ("badan bukan JSON -> 400
// JSON_MALFORMED"; galat `{ error, code, details? }`; "Setiap respons non-401 membawa x-correlation-id").
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { dbCalls, resetDb } from './_prisma';
import { captureServiceLogs, jsonOf, params, req } from './_studio';
import { STUDIO_ERROR_HTTP, StudioEngineError, StudioNotImplemented, studioError, studioErrorFrom } from '@/lib/studio/contract/errors';
import { STUDIO_ERROR_CODES } from '@/lib/studio/contract/enums';
import { STUDIO_MAX_JSON_BYTES } from '@/lib/studio/contract/env';
import { failure, reqCtx } from '@/lib/studio/http';
import { POST as postDocument } from '@/app/api/studio/documents/route';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { POST as postTemplate } from '@/app/api/studio/templates/route';
import { POST as postArtifact } from '@/app/api/studio/artifacts/route';
import { PATCH as patchBlock } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { POST as postRerender } from '@/app/api/studio/documents/[id]/revisions/route';
import { GET as getRegistry } from '@/app/api/studio/registry/route';

/** §6.3 + revisi d1/d2, ditulis ulang dari spesifikasi (bukan disalin dari errors.ts). */
const SPEC_HTTP: Record<string, number> = {
  UNAUTHORIZED: 401,
  PARAM_CLASS_K_FORBIDDEN: 403,
  PARAM_CLASS_T_READONLY: 400,
  PARAM_UNKNOWN_KEY: 422,
  SCHEMA_INVALID: 400,
  JSON_MALFORMED: 400,
  CHANGE_FIELDS_REQUIRED: 400,
  CHANGE_NOTE_REQUIRED: 400,
  ADDRESS_INVALID: 400,
  ADDRESS_NOT_FOUND: 404,
  DOCUMENT_NOT_FOUND: 404,
  REVISION_NOT_FOUND: 404,
  TEMPLATE_NOT_FOUND: 404,
  ARTIFACT_NOT_FOUND: 404,
  FILE_NOT_FOUND: 404,
  MISSION_REF_NOT_FOUND: 404,
  DOC_NUMBER_EXISTS: 409,
  TEMPLATE_SLUG_EXISTS: 409,
  REVISION_CONFLICT: 409,
  VERSION_CONFLICT: 409,
  RENDER_IN_PROGRESS: 409,
  BY_CONSTRUCTION_FAILED: 422,
  CHART_KIND_NOT_DRAWN: 422,
  CHART_KIND_UNKNOWN: 422,
  'DATUM-31': 422,
  'DATUM-39': 422,
  PAYLOAD_TOO_LARGE: 413,
  ASSET_TOO_LARGE: 413,
  ASSET_TYPE_UNSUPPORTED: 415,
  PATH_OUTSIDE_ROOT: 403,
  FILE_MISSING_ON_DISK: 410,
  PDF_ENGINE_UNAVAILABLE: 503, // "bila hanya PDF diminta: 503"
  STORAGE_ROOT_FORBIDDEN: 500,
  REGISTRY_KIND_UNKNOWN: 400,
  BROWSER_UNAVAILABLE: 503, // d1
  HTML_RENDER_FAILED: 500, // d1
  RENDER_FAILED: 500, // d1
  STORAGE_WRITE_FAILED: 500, // d1
  FORBIDDEN: 403, // d2
  // SR-43: delta kontrak aditif FIX-1 (D-134; S87 M-03/L-07), literal dari D-134 + register 03 :734/:789.
  RATE_LIMITED: 429,
  RENDER_QUEUE_FULL: 503,
  UNSUPPORTED_MEDIA_TYPE: 415,
  // SR-43: EC01-EC24 register struktur 03 §11.2 (SR-01/SR-04), literal dari tabel register.
  SLOT_UNKNOWN: 422, // EC01
  SLOT_REQUIRED_MISSING: 422, // EC02
  SLOT_DUPLICATE: 422, // EC03
  SLOT_POSITION_LOCKED: 422, // EC04
  SLOT_TYPE_MISMATCH: 422, // EC05
  SLOT_FORBIDDEN_FOR_TIER: 422, // EC06
  SLOT_INPUT_NOT_ACCEPTED: 422, // EC07
  SLOT_ITEMS_OUT_OF_RANGE: 422, // EC08
  BLOCK_TYPE_NOT_ADMITTED: 422, // EC09
  SLOT_USE_CHAPTER_ENDPOINT: 422, // EC10
  SLOT_PARAM_SCOPE_INVALID: 422, // EC11
  PARAM_SURFACE_FORBIDDEN: 403, // EC12
  PRESET_READONLY: 403, // EC13
  INLINE_FORMAT_REJECTED: 422, // EC14
  DOC_TARGET_AMBIGUOUS: 400, // EC15
  META_REQUIRED_FOR_CREATE: 400, // EC16
  META_CONFLICT: 409, // EC17
  TEMPLATE_MISMATCH: 409, // EC18
  SCOPE_CONFLICT: 409, // EC19
  PID_NOT_FOUND: 404, // EC20
  PID_CONFLICT: 422, // EC21
  ASSET_NOT_FOUND: 422, // EC22
  DOCUMENT_INCOMPLETE: 409, // EC23
  CHAPTER_KEY_INVALID: 422, // EC24
  // FIX-HR2 (D-332 C9; SR-56d C9): catch-all 404 FIX-H6 masuk enum kontrak.
  ROUTE_NOT_FOUND: 404,
};
/** Kode "dalam job" tanpa status HTTP tertulis di §6.3: cukup wajib 5xx bila route gagal keras. */
const IN_JOB_ONLY = ['PDF_CONVERT_FAILED', 'RENDER_TIMEOUT'];

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('pemetaan kode galat kontrak -> HTTP (§6.3, E24)', () => {
  it('konstanta batas badan C09 = 5 MiB', () => {
    expect(STUDIO_MAX_JSON_BYTES).toBe(5242880);
  });

  // SR-43: 41 -> 68 = 41 (S74) + 3 FIX-1 (D-134) + 24 EC01-EC24 (register 03 §11.2, SR-04).
  // FIX-HR2: 68 -> 69 (+ ROUTE_NOT_FOUND, D-332 C9).
  it('69 kode (36 + d1 4 + d2 1 + FIX-1 3 + EC01-EC24 + FIX-HR2 1) dan himpunan kode = STUDIO_ERROR_CODES', () => {
    expect(Object.keys(STUDIO_ERROR_HTTP)).toHaveLength(69);
    expect([...STUDIO_ERROR_CODES].sort()).toEqual(Object.keys(STUDIO_ERROR_HTTP).sort());
    expect(Object.keys(SPEC_HTTP).length + IN_JOB_ONLY.length).toBe(69);
    expect([...Object.keys(SPEC_HTTP), ...IN_JOB_ONLY].sort()).toEqual([...STUDIO_ERROR_CODES].sort());
  });

  it.each(Object.entries(SPEC_HTTP))('%s -> HTTP %i', (code, status) => {
    expect(STUDIO_ERROR_HTTP[code as keyof typeof STUDIO_ERROR_HTTP]).toBe(status);
  });

  it.each(IN_JOB_ONLY)('%s (dalam job) -> 5xx bila dipetakan keras', (code) => {
    expect(STUDIO_ERROR_HTTP[code as keyof typeof STUDIO_ERROR_HTTP]).toBeGreaterThanOrEqual(500);
  });

  it.each(Object.entries(SPEC_HTTP))('failure(StudioEngineError %s) -> status %i, badan {error, code, details}, x-correlation-id', async (code, status) => {
    const ctx = reqCtx(await req('/x', { headers: { 'x-correlation-id': 'corr-s74-0001' } }), '/x');
    const res = failure(new StudioEngineError(code as any, `pesan ${code}`, [{ pointer: '/a', keyword: 'k', message: 'm' }]), ctx);
    expect(res.status).toBe(status);
    expect(await jsonOf(res)).toEqual({ error: `pesan ${code}`, code, details: [{ pointer: '/a', keyword: 'k', message: 'm' }] });
    expect(res.headers.get('x-correlation-id')).toBe('corr-s74-0001');
  });

  it('studioError tanpa details tidak memuat kunci details', async () => {
    expect(await jsonOf(studioError('FORBIDDEN', 'tidak boleh'))).toEqual({ error: 'tidak boleh', code: 'FORBIDDEN' });
  });

  it('galat tak dikenal -> 500 {error:"Internal error"} tanpa pesan/stack', async () => {
    const res = studioErrorFrom(new Error('ECONNREFUSED C:\\Users\\TRIAL\\secret password=x'));
    expect(res.status).toBe(500);
    expect(await jsonOf(res)).toEqual({ error: 'Internal error' });
  });

  it('failure(StudioNotImplemented) -> 500 generik tanpa moduleId di badan', async () => {
    const ctx = reqCtx(await req('/x'), '/x');
    const res = failure(new StudioNotImplemented('engine/x', 1, 2), ctx);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain('engine/x');
    expect(JSON.parse(text)).toEqual({ error: 'Internal error' });
  });

  it('registry kind tak dikenal -> 400 REGISTRY_KIND_UNKNOWN', async () => {
    const res = await getRegistry(await req('/api/studio/registry?kind=rahasia', { auth: 'agent' }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('REGISTRY_KIND_UNKNOWN');
  });
});

// ── Batas badan ─────────────────────────────────────────────────────────

type BodyRoute = [string, string, string, (r: any, c?: any) => Promise<Response>, unknown];
const BODY_ROUTES: BodyRoute[] = [
  ['POST', '/api/studio/documents', 'documents POST', postDocument, undefined],
  ['POST', '/api/studio/validate', 'validate POST', postValidate, undefined],
  ['POST', '/api/studio/templates', 'templates POST', postTemplate, undefined],
  ['POST', '/api/studio/artifacts', 'artifacts POST', postArtifact, undefined],
  ['PATCH', '/api/studio/documents/doc1/blocks/1.1.1', 'blocks PATCH', patchBlock, params({ id: 'doc1', address: '1.1.1' })],
  ['POST', '/api/studio/documents/doc1/revisions', 'revisions POST', postRerender, params({ id: 'doc1' })],
];

/** Stream tanpa content-length yang menghasilkan `total` byte spasi dalam potongan 1 MiB. */
function bigStream(total: number): ReadableStream<Uint8Array> {
  const chunk = new Uint8Array(1024 * 1024).fill(0x20);
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(c) {
      if (sent >= total) return c.close();
      const n = Math.min(chunk.byteLength, total - sent);
      sent += n;
      c.enqueue(n === chunk.byteLength ? chunk : chunk.slice(0, n));
    },
  });
}

describe('batas badan JSON 5 MiB (413 PAYLOAD_TOO_LARGE) sebelum parse dan tanpa akses DB', () => {
  it.each(BODY_ROUTES)('%s %s (%s): content-length > 5 MiB -> 413', async (method, path, _n, h, ctx) => {
    const r = await req(path, { method, auth: 'agent', body: '{}', headers: { 'content-type': 'application/json', 'content-length': String(STUDIO_MAX_JSON_BYTES + 1) } });
    const res = await h(r, ctx);
    expect(res.status).toBe(413);
    expect((await jsonOf(res)).code).toBe('PAYLOAD_TOO_LARGE');
    expect(res.headers.get('x-correlation-id')).not.toBeNull();
    expect(dbCalls()).toEqual([]);
  });

  it.each(BODY_ROUTES)('%s %s (%s): badan chunked tanpa content-length > 5 MiB -> 413', async (method, path, _n, h, ctx) => {
    const r = await req(path, { method, auth: 'agent', body: bigStream(STUDIO_MAX_JSON_BYTES + 1), headers: { 'content-type': 'application/json' } });
    const res = await h(r, ctx);
    expect(res.status).toBe(413);
    expect((await jsonOf(res)).code).toBe('PAYLOAD_TOO_LARGE');
    expect(dbCalls()).toEqual([]);
  });

  it('tepat 5 MiB (batas inklusif) tidak ditolak 413', async () => {
    // 5 MiB spasi = JSON kosong -> 400 JSON_MALFORMED, bukan 413.
    const r = await req('/api/studio/validate', { auth: 'agent', body: bigStream(STUDIO_MAX_JSON_BYTES), headers: { 'content-type': 'application/json' } });
    const res = await postValidate(r);
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
  });
});

describe('badan bukan JSON -> 400 JSON_MALFORMED', () => {
  it.each(BODY_ROUTES)('%s %s (%s): JSON rusak -> 400 JSON_MALFORMED', async (method, path, _n, h, ctx) => {
    const res = await h(await req(path, { method, auth: 'agent', body: '{"a":', headers: { 'content-type': 'application/json' } }), ctx);
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
    expect(dbCalls()).toEqual([]);
  });

  it.each(BODY_ROUTES)('%s %s (%s): badan kosong -> 400 JSON_MALFORMED', async (method, path, _n, h, ctx) => {
    const res = await h(await req(path, { method, auth: 'agent', body: '', headers: { 'content-type': 'application/json' } }), ctx);
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
  });

  it('R04/R08: UTF-8 tidak sah -> 400 JSON_MALFORMED (dekode ketat)', async () => {
    const bytes = new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0xfe, 0x22, 0x7d]); // {"a":"\xff\xfe"}
    for (const h of [postDocument, postValidate]) {
      const res = await h(await req('/api/studio/documents', { auth: 'agent', body: bytes, headers: { 'content-type': 'application/json' } }));
      expect(res.status).toBe(400);
      expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
    }
  });
});
