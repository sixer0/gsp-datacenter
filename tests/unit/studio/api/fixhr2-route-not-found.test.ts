// FIX-HR2 (D-332 C9, D-333 PUT; SR-56d C9) + C4:
//  - `ROUTE_NOT_FOUND` anggota enum kontrak `StudioErrorCode` dengan 404 di `STUDIO_ERROR_HTTP`;
//  - catch-all `/api/studio/[[...notfound]]` mengekspor SEMUA metode handler Next (termasuk PUT)
//    -> 404 JSON; HEAD -> 404 dengan header sama TANPA badan;
//  - contoh `formats` di hint memakai huruf kecil (sesuai panduan);
//  - C4: `alt-text` di modul bersama `engine/front/`; renderer HTML tidak mengimpor dari folder DOCX.
import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { req, jsonOf } from './_studio';
import * as route from '@/app/api/studio/[[...notfound]]/route';
import { ROUTE_NOT_FOUND_CODE, suggestStudioRoute } from '@/lib/studio/http/route-not-found';
import { STUDIO_ERROR_CODES } from '@/lib/studio/contract/enums';
import { STUDIO_ERROR_HTTP, StudioEngineError } from '@/lib/studio/contract/errors';
import * as frontAlt from '@/lib/studio/engine/front/alt-text';
import * as docxFigures from '@/lib/studio/engine/docx/figures';

/** Metode yang didukung route handler Next App Router. */
const NEXT_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as const;
type Handler = (r: Request) => Promise<Response>;
const handlerOf = (m: string) => (route as unknown as Record<string, Handler | undefined>)[m];

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('C9: ROUTE_NOT_FOUND di enum kontrak', () => {
  it('anggota STUDIO_ERROR_CODES, STUDIO_ERROR_HTTP = 404, konstanta helper = kode enum', () => {
    expect(STUDIO_ERROR_CODES).toContain('ROUTE_NOT_FOUND');
    expect(STUDIO_ERROR_HTTP.ROUTE_NOT_FOUND).toBe(404);
    expect(ROUTE_NOT_FOUND_CODE).toBe('ROUTE_NOT_FOUND');
    expect(new StudioEngineError('ROUTE_NOT_FOUND', 'x').httpStatus).toBe(404);
  });
});

describe('C9 + D-333: catch-all mengekspor semua metode Next', () => {
  it('ekspor = GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS', () => {
    for (const m of NEXT_METHODS) expect(typeof handlerOf(m), m).toBe('function');
  });

  it.each(NEXT_METHODS.filter((m) => m !== 'HEAD'))('%s path tak ada -> 404 JSON ROUTE_NOT_FOUND + correlation', async (m) => {
    const res = await handlerOf(m)!(await req('/api/studio/documents/doc_1/nope', { auth: 'agent', method: m, ...(m === 'GET' || m === 'OPTIONS' ? {} : { body: {} }) }));
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    const b = await jsonOf(res);
    expect(b.code).toBe('ROUTE_NOT_FOUND');
    expect(b.details.method).toBe(m);
  });

  it('PUT path tak ada (temuan D-333) -> 404 JSON, bukan 405 tanpa badan', async () => {
    const res = await route.PUT(await req('/api/studio/documents/doc_1/chapters/3', { auth: 'agent', method: 'PUT', body: { x: 1 } }));
    expect(res.status).toBe(404);
    const b = await jsonOf(res);
    expect(b.code).toBe('ROUTE_NOT_FOUND');
    expect(b.message).toContain('PUT /api/studio/documents/doc_1/chapters/3');
  });

  it('HEAD path tak ada -> 404, header sama dengan GET (correlation, content-type, no-store), badan KOSONG', async () => {
    const res = await route.HEAD(await req('/api/studio/foo', { auth: 'agent', method: 'HEAD', headers: { 'x-correlation-id': 'hr2-head-0001' } }));
    expect(res.status).toBe(404);
    expect(res.headers.get('x-correlation-id')).toBe('hr2-head-0001');
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.body).toBeNull();
    expect(await res.text()).toBe('');
  });

  it('HEAD tanpa sesi tetap 401 (requireSession lebih dulu)', async () => {
    const res = await route.HEAD(await req('/api/studio/foo', { auth: 'none', method: 'HEAD' }));
    expect(res.status).toBe(401);
  });

  it('contoh formats di hint render berhuruf kecil', () => {
    const s = suggestStudioRoute('/api/studio/documents/doc_1/build');
    expect(s?.hint).toContain('"formats": ["docx", "pdf", "html"]');
    expect(s?.hint).not.toMatch(/"DOCX"|"PDF"|"HTML"/);
  });
});

describe('C4: alt-text di modul bersama engine/front', () => {
  it('engine/docx/figures mengekspor ulang fungsi yang SAMA (satu sumber)', () => {
    expect(docxFigures.figureAltText).toBe(frontAlt.figureAltText);
    expect(docxFigures.stripSourceLabel).toBe(frontAlt.stripSourceLabel);
    expect(docxFigures.FIGURE_NAME_MAX).toBe(frontAlt.FIGURE_NAME_MAX);
  });

  it('renderer HTML dan figur DOCX mengimpor dari engine/front, berkas lama tidak ada', () => {
    const root = path.resolve(__dirname, '../../../../src/lib/studio/engine');
    const html = fs.readFileSync(path.join(root, 'html/tables/figure.ts'), 'utf8');
    expect(html).toContain('from "../../front/alt-text"');
    expect(html).not.toMatch(/from "[^"]*docx\/figures[^"]*"/);
    expect(fs.readFileSync(path.join(root, 'docx/figures/figure.ts'), 'utf8')).toContain('from "../../front/alt-text"');
    expect(fs.existsSync(path.join(root, 'docx/figures/alt-text.ts'))).toBe(false);
  });
});
