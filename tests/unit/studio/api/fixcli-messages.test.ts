// FIX-CLI (D-340, review DOC-3 m-5): teks `message`/`error`/`hint` 404 ROUTE_NOT_FOUND dan
// `error` 503 PDF_ENGINE_UNAVAILABLE (preflight) berbahasa Indonesia awam. Kode galat, kunci
// badan, route, dan contoh JSON di dalam hint tetap persis.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { req, jsonOf } from './_studio';
import * as route from '@/app/api/studio/[[...notfound]]/route';
import { suggestStudioRoute, ROUTE_NOT_FOUND_CODE } from '@/lib/studio/http/route-not-found';
import { failure, reqCtx } from '@/lib/studio/http';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { PDF_NOT_READY_MESSAGE, assertPdfRenderReady } from '@/lib/studio/services/render';

/** Kata Inggris yang dulu dipakai di pesan; route/JSON tidak memuatnya. */
const ENGLISH = /\b(the|is|are|with|goes|then|via|fetched|submitted|served|lists|plural|Use|Upload|Build|Read|No|such|matches|not ready|rejected|before)\b/;
/** Buang route, path, dan contoh JSON agar hanya kalimat yang diperiksa. */
const prose = (s: string) =>
  s
    .replace(/\{[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}/g, ' ')
    .replace(/(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)(\|[A-Z]+)*\s+\S+/g, ' ')
    .replace(/\/api\/studio\S*/g, ' ')
    .replace(/`[^`]*`/g, ' ');

// Satu path per aturan pemetaan salah-umum di route-not-found.ts (22 aturan).
const RULE_PATHS = [
  '/api/studio/documents/doc_1/slots',
  '/api/studio/documents/doc_1/chapters',
  '/api/studio/documents/doc_1/build',
  '/api/studio/documents/doc_1/validate',
  '/api/studio/documents/doc_1/history',
  '/api/studio/documents/doc_1/revisions/2',
  '/api/studio/documents/doc_1/outline',
  '/api/studio/documents/doc_1/blocks',
  '/api/studio/documents/doc_1/assets',
  '/api/studio/slot',
  '/api/studio/chapter',
  '/api/studio/document',
  '/api/studio/templates/t_1/versions',
  '/api/studio/template',
  '/api/studio/render',
  '/api/studio/schemas',
  '/api/studio/images',
  '/api/studio/artifact',
  '/api/studio/files',
  '/api/studio/completeness',
  '/api/studio/logs',
  '/api/studio/health',
];

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('404 ROUTE_NOT_FOUND berbahasa Indonesia (FIX-CLI)', () => {
  it('message/error Indonesia, memuat metode + path, kode dan kunci badan tetap', async () => {
    const res = await route.POST(await req('/api/studio/documents/doc_123/slots', { auth: 'agent', body: {} }));
    expect(res.status).toBe(404);
    const b = await jsonOf(res);
    expect(Object.keys(b).sort()).toEqual(['code', 'correlationId', 'details', 'error', 'hint', 'message']);
    expect(b.code).toBe(ROUTE_NOT_FOUND_CODE);
    expect(b.message).toBe('Route Studio tidak ditemukan untuk POST /api/studio/documents/doc_123/slots');
    expect(b.error).toBe(b.message);
    expect(b.hint).toMatch(/^Slot dikirim ke POST \/api\/studio\/slots dengan badan /);
    expect(b.hint).toContain('{ "target": { "documentId": "doc_123" }, "slot": "<slotKey>", "payload": { ... } }');
    expect(b.details).toEqual({ method: 'POST', path: '/api/studio/documents/doc_123/slots', suggestion: 'POST /api/studio/slots' });
  });

  it('hint umum (tanpa pemetaan) Indonesia dan tetap memuat daftar sumber daya', async () => {
    const res = await route.GET(await req('/api/studio/zzz/qqq', { auth: 'agent' }));
    const b = await jsonOf(res);
    expect(b.hint).toMatch(/^Route Studio ini tidak ada\. Sumber daya Studio yang tersedia: /);
    expect(b.hint).toContain('GET|POST /api/studio/templates');
    expect(b.hint).toContain('Sub-route dokumen ada di bawah /api/studio/documents/{id}/');
    expect(prose(b.hint)).not.toMatch(ENGLISH);
  });

  it.each(RULE_PATHS)('%s: hint tanpa kalimat Inggris', (p) => {
    const s = suggestStudioRoute(p);
    expect(s).not.toBeNull();
    expect(prose(s!.hint)).not.toMatch(ENGLISH);
    expect(prose(s!.hint)).toMatch(/\b(dengan|ada|lewat|pakai|dikirim|diambil|dikelola|diperiksa|berbentuk|tersedia|dituju|dibaca|dilakukan|unggah|riwayat|baca|buat|uji)\b/i);
  });

  it('contoh JSON dan route di hint tidak ikut diterjemahkan', () => {
    expect(suggestStudioRoute('/api/studio/documents/d1/build')?.hint).toContain('{ "scope": "document", "formats": ["docx", "pdf", "html"] }');
    expect(suggestStudioRoute('/api/studio/documents/d1/revisions/4')?.hint).toContain('{ "revisionNo": 4 }');
    expect(suggestStudioRoute('/api/studio/documents/d1/outline')?.hint).toContain('"op": "reorder"|"setOutline"|"setMeta"');
  });
});

describe('503 PDF_ENGINE_UNAVAILABLE preflight berbahasa Indonesia (FIX-CLI)', () => {
  const notReady = async () => ({ ready: false, errors: ['font not registered: X'], checkedAt: '2026-10-30T00:00:00.000Z' });

  it('pesan galat Indonesia; kode, tahap, dan kunci details tetap', async () => {
    const err = await assertPdfRenderReady(['pdf'], notReady).then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(StudioEngineError);
    const e = err as StudioEngineError;
    expect(e.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(e.message).toBe(PDF_NOT_READY_MESSAGE);
    expect(e.message).toMatch(/^Mesin PDF di server belum siap/);
    expect(e.message).not.toMatch(ENGLISH);
    const d = e.details as Record<string, unknown>;
    expect(Object.keys(d).sort()).toEqual(
      ['causes', 'checkedAt', 'jobCreated', 'reason', 'requestedFormats', 'requiresOperatorAction', 'retryAfterSec', 'retryable', 'stage', 'statusEndpoint', 'suggestedFormats'].sort(),
    );
    expect(d.stage).toBe('preflight');
    expect(String(d.reason)).toMatch(/^Mesin PDF di server belum siap/);
  });

  it('badan HTTP 503: error = pesan Indonesia, code tetap', async () => {
    const e = await assertPdfRenderReady(['docx', 'pdf'], notReady).catch((x: unknown) => x as StudioEngineError);
    const ctx = reqCtx(await req('/x'), '/x');
    const res = failure(e as StudioEngineError, ctx);
    expect(res.status).toBe(503);
    const b = await jsonOf(res);
    expect(b.code).toBe('PDF_ENGINE_UNAVAILABLE');
    expect(b.error).toBe(PDF_NOT_READY_MESSAGE);
    expect(b.details.suggestedFormats).toEqual(['docx']);
  });
});
