// FIX-H6 (D-321/D-322; uji Hermes friksi C6): catch-all `/api/studio/[[...notfound]]`
// menjawab 404 JSON ROUTE_NOT_FOUND + x-correlation-id + hint, setelah requireSession.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { req, jsonOf, type AuthKind } from './_studio';
import * as route from '@/app/api/studio/[[...notfound]]/route';
import { suggestStudioRoute, studioRelativePath, ROUTE_NOT_FOUND_CODE } from '@/lib/studio/http/route-not-found';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;
type M = (typeof METHODS)[number];
const handler = (m: M | 'HEAD') => (route as unknown as Record<string, (r: Request) => Promise<Response>>)[m];

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('catch-all /api/studio/* (FIX-H6)', () => {
  it('Hermes C6: POST /documents/{id}/slots -> 404 JSON, correlation, hint ke POST /api/studio/slots', async () => {
    const res = await route.POST(await req('/api/studio/documents/doc_123/slots', { auth: 'agent', body: { slot: 'cover' } }));
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    const cid = res.headers.get('x-correlation-id');
    expect(cid).toBeTruthy();
    const body = await jsonOf(res);
    expect(body.code).toBe(ROUTE_NOT_FOUND_CODE);
    expect(body.correlationId).toBe(cid);
    expect(body.message).toContain('POST /api/studio/documents/doc_123/slots');
    expect(body.error).toBe(body.message);
    expect(body.hint).toContain('POST /api/studio/slots');
    expect(body.hint).toContain('"documentId": "doc_123"');
    expect(body.details).toEqual({ method: 'POST', path: '/api/studio/documents/doc_123/slots', suggestion: 'POST /api/studio/slots' });
    expect(JSON.stringify(body)).not.toMatch(/at .*\.ts|stack/i);
  });

  it.each(METHODS)('%s pada path tak dikenal -> 404 ROUTE_NOT_FOUND dengan hint umum', async (m) => {
    const res = await handler(m)(await req('/api/studio/does-not-exist', { auth: 'admin', method: m }));
    expect(res.status).toBe(404);
    const body = await jsonOf(res);
    expect(body.code).toBe('ROUTE_NOT_FOUND');
    expect(body.hint).toContain('/api/studio/templates');
    expect(body.details.suggestion).toBeUndefined();
  });

  it('HEAD -> 404 dengan correlation header', async () => {
    const res = await route.HEAD(await req('/api/studio/foo', { auth: 'agent', method: 'HEAD' }));
    expect(res.status).toBe(404);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('correlation id klien yang sah dipantulkan', async () => {
    const res = await route.GET(await req('/api/studio/x', { auth: 'agent', headers: { 'x-correlation-id': 'hermes-trial-0001' } }));
    expect(res.headers.get('x-correlation-id')).toBe('hermes-trial-0001');
    expect((await jsonOf(res)).correlationId).toBe('hermes-trial-0001');
  });

  it.each<AuthKind>(['none'])('tanpa sesi (%s) -> 401 seperti route lain, tanpa bocor hint', async (auth) => {
    const res = await route.POST(await req('/api/studio/documents/doc_123/slots', { auth, body: {} }));
    expect(res.status).toBe(401);
    const body = await jsonOf(res);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it.each<AuthKind>(['admin', 'user', 'google', 'agent'])('identitas %s diterima', async (auth) => {
    const res = await route.GET(await req('/api/studio/nope', { auth }));
    expect(res.status).toBe(404);
  });

  it('path panjang dipotong di badan (maks 200 + elipsis)', async () => {
    const long = '/api/studio/' + 'a'.repeat(500);
    const body = await jsonOf(await route.GET(await req(long, { auth: 'agent' })));
    expect(body.details.path.length).toBeLessThanOrEqual(203);
  });
});

describe('suggestStudioRoute (pemetaan salah-umum)', () => {
  const cases: Array<[string, string]> = [
    ['/api/studio/documents/abc/slots', 'POST /api/studio/slots'],
    ['/api/studio/documents/abc/slots/cover', 'POST /api/studio/slots'],
    ['/api/studio/documents/abc/chapters', 'POST /api/studio/chapters'],
    ['/api/studio/documents/abc/chapters/bab-1', 'POST /api/studio/chapters'],
    ['/api/studio/documents/abc/build', 'POST /api/studio/documents/abc/render'],
    ['/api/studio/documents/abc/validate', 'POST /api/studio/validate'],
    ['/api/studio/documents/abc/history', 'GET /api/studio/documents/abc/revisions'],
    ['/api/studio/documents/abc/revisions/3', 'GET /api/studio/documents/abc?rev=3'],
    ['/api/studio/documents/abc/outline', 'GET|PATCH /api/studio/documents/abc/structure'],
    ['/api/studio/documents/abc/paragraphs', 'GET|PATCH /api/studio/documents/abc/paragraphs/{pid}'],
    ['/api/studio/documents/abc/assets', 'POST /api/studio/assets'],
    ['/api/studio/slot', 'POST /api/studio/slots'],
    ['/api/studio/slots/cover', 'POST /api/studio/slots'],
    ['/api/studio/chapter', 'POST /api/studio/chapters'],
    ['/api/studio/document', 'GET|POST /api/studio/documents'],
    ['/api/studio/document/abc', '/api/studio/documents/abc'],
    ['/api/studio/templates/t1/versions', 'GET /api/studio/templates/t1'],
    ['/api/studio/template', 'GET|POST /api/studio/templates'],
    ['/api/studio/render', 'POST /api/studio/documents/{id}/render'],
    ['/api/studio/schemas', 'GET /api/studio/registry?kind=schema&schemaId={schemaId}'],
    ['/api/studio/files', 'GET /api/studio/files/{id}'],
    ['/api/studio/logs', 'POST /api/studio/client-log'],
    ['/api/studio/health', 'GET /api/studio/render-env'],
    ['/API/STUDIO/Documents/abc/SLOTS/', 'POST /api/studio/slots'],
  ];
  it.each(cases)('%s -> %s', (path, route) => {
    expect(suggestStudioRoute(path)?.route).toBe(route);
  });

  it('id tak aman tidak disalin ke petunjuk', () => {
    const s = suggestStudioRoute('/api/studio/documents/%3Cscript%3E/slots');
    expect(s?.hint).toContain('"documentId": "{id}"');
  });

  it('tanpa pemetaan -> null', () => {
    expect(suggestStudioRoute('/api/studio/zzz/qqq')).toBeNull();
  });

  it('studioRelativePath', () => {
    expect(studioRelativePath('/api/studio')).toBe('/');
    expect(studioRelativePath('/api/studio//documents//x/')).toBe('/documents/x');
  });
});
