// S74 — Auth Studio (01_specs.md §6.1; API-REFERENCE §12 "Auth (semua route, termasuk GET)";
// kriteria §7 butir 6: "Semua route Studio menerima x-internal-secret dan menolak anonim 401").
// Seam: handler route publik + getStudioCaller. Prisma DI-MOCK (tanpa DB);
// akses DB oleh permintaan anonim dianggap kegagalan (guard harus di baris pertama).
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { TEST_INTERNAL_SECRET } from './_env';
import { dbCalls, resetDb } from './_prisma';
import { captureServiceLogs, hqCookie, jsonOf, nextAuthCookie, params, req } from './_studio';
import { getStudioCaller } from '@/lib/studio/contract/auth';
import { StudioEngineError } from '@/lib/studio/contract/errors';

import * as templates from '@/app/api/studio/templates/route';
import * as templateId from '@/app/api/studio/templates/[id]/route';
import * as registry from '@/app/api/studio/registry/route';
import * as documents from '@/app/api/studio/documents/route';
import * as documentId from '@/app/api/studio/documents/[id]/route';
import * as blocks from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import * as revisions from '@/app/api/studio/documents/[id]/revisions/route';
import * as validate from '@/app/api/studio/validate/route';
import * as artifacts from '@/app/api/studio/artifacts/route';
import * as files from '@/app/api/studio/files/[id]/route';
import * as renderEnv from '@/app/api/studio/render-env/route';
import * as clientLog from '@/app/api/studio/client-log/route';

type Handler = (r: any, c?: any) => Promise<Response>;

const ID = params({ id: 'doc1' });
const ADDR = params({ id: 'doc1', address: '1.1.1' });

// Seluruh handler yang diekspor di src/app/api/studio/** (19 handler, 12 berkas route).
const HANDLERS: Array<[string, string, string, Handler, unknown]> = [
  ['GET', '/api/studio/templates', 'templates GET', templates.GET as Handler, undefined],
  ['POST', '/api/studio/templates', 'templates POST', templates.POST as Handler, undefined],
  ['GET', '/api/studio/templates/t1', 'templates/[id] GET', templateId.GET as Handler, params({ id: 't1' })],
  ['POST', '/api/studio/templates/t1', 'templates/[id] POST', templateId.POST as Handler, params({ id: 't1' })],
  ['PATCH', '/api/studio/templates/t1', 'templates/[id] PATCH', templateId.PATCH as Handler, params({ id: 't1' })],
  ['GET', '/api/studio/registry?kind=lint', 'registry GET', registry.GET as Handler, undefined],
  ['GET', '/api/studio/documents', 'documents GET', documents.GET as Handler, undefined],
  ['POST', '/api/studio/documents', 'documents POST', documents.POST as Handler, undefined],
  ['GET', '/api/studio/documents/doc1', 'documents/[id] GET', documentId.GET as Handler, ID],
  ['GET', '/api/studio/documents/doc1/blocks/1.1.1', 'blocks GET', blocks.GET as Handler, ADDR],
  ['PATCH', '/api/studio/documents/doc1/blocks/1.1.1', 'blocks PATCH', blocks.PATCH as Handler, ADDR],
  ['GET', '/api/studio/documents/doc1/revisions', 'revisions GET', revisions.GET as Handler, ID],
  ['POST', '/api/studio/documents/doc1/revisions', 'revisions POST', revisions.POST as Handler, ID],
  ['POST', '/api/studio/validate', 'validate POST', validate.POST as Handler, undefined],
  ['GET', '/api/studio/artifacts', 'artifacts GET', artifacts.GET as Handler, undefined],
  ['POST', '/api/studio/artifacts', 'artifacts POST', artifacts.POST as Handler, undefined],
  ['GET', '/api/studio/files/f1', 'files/[id] GET', files.GET as Handler, params({ id: 'f1' })],
  ['GET', '/api/studio/render-env', 'render-env GET', renderEnv.GET as Handler, undefined],
  ['POST', '/api/studio/client-log', 'client-log POST', clientLog.POST as Handler, undefined],
];

const BODY = { level: 'error', message: 'x' };

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('401 anonim di SEMUA handler Studio (requireSession baris pertama)', () => {
  it.each(HANDLERS)('%s %s (%s) tanpa identitas -> 401 {error:"Unauthorized"} tanpa akses DB', async (method, path, _n, h, ctx) => {
    const r = await req(path, { method, body: method === 'GET' ? undefined : BODY });
    const res = await h(r, ctx);
    expect(res.status).toBe(401);
    expect(await jsonOf(res)).toEqual({ error: 'Unauthorized' });
    // API-REFERENCE §12: "Setiap respons non-401 membawa header x-correlation-id" -> 401 tidak.
    expect(res.headers.get('x-correlation-id')).toBeNull();
    expect(dbCalls()).toEqual([]);
  });

  it('cakupan: setiap ekspor handler HTTP di route Studio terdaftar di tabel uji', () => {
    const exported = [
      ...Object.keys(templates).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `templates ${k}`),
      ...Object.keys(templateId).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `templates/[id] ${k}`),
      ...Object.keys(registry).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `registry ${k}`),
      ...Object.keys(documents).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `documents ${k}`),
      ...Object.keys(documentId).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `documents/[id] ${k}`),
      ...Object.keys(blocks).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `blocks ${k}`),
      ...Object.keys(revisions).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `revisions ${k}`),
      ...Object.keys(validate).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `validate ${k}`),
      ...Object.keys(artifacts).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `artifacts ${k}`),
      ...Object.keys(files).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `files/[id] ${k}`),
      ...Object.keys(renderEnv).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `render-env ${k}`),
      ...Object.keys(clientLog).filter((k) => /^(GET|POST|PATCH|PUT|DELETE)$/.test(k)).map((k) => `client-log ${k}`),
    ].sort();
    expect(HANDLERS.map(([, , n]) => n).sort()).toEqual(exported);
  });
});

describe('401 untuk identitas tidak sah (fail-closed)', () => {
  const call = (headers: Record<string, string>) => req('/api/studio/registry?kind=lint', { headers }).then((r) => registry.GET(r));

  it('x-internal-secret salah -> 401', async () => {
    expect((await call({ 'x-internal-secret': 'tebak-tebakan' })).status).toBe(401);
  });

  it('INTERNAL_API_SECRET kosong -> secret apa pun ditolak 401', async () => {
    const saved = process.env.INTERNAL_API_SECRET;
    delete process.env.INTERNAL_API_SECRET;
    try {
      expect((await call({ 'x-internal-secret': TEST_INTERNAL_SECRET })).status).toBe(401);
    } finally {
      process.env.INTERNAL_API_SECRET = saved;
    }
  });

  it('cookie HQ bertanda tangan salah -> 401', async () => {
    expect((await call({ cookie: hqCookie({ secret: 'secret-lain' }) })).status).toBe(401);
  });

  it('cookie HQ kedaluwarsa -> 401', async () => {
    expect((await call({ cookie: hqCookie({ expOffsetSec: -60 }) })).status).toBe(401);
  });

  it('JWT NextAuth dienkripsi dengan secret lain -> 401', async () => {
    expect((await call({ cookie: await nextAuthCookie(undefined, 'secret-lain') })).status).toBe(401);
  });
});

describe('3 jalur auth diterima route (registry GET -> 200)', () => {
  it.each([
    ['cookie gsp_hq_session ADMINISTRATOR', 'admin'],
    ['cookie gsp_hq_session USER', 'user'],
    ['JWT NextAuth (cookie __Secure-next-auth.session-token)', 'google'],
    ['x-internal-secret', 'agent'],
  ] as const)('%s -> 200 + x-correlation-id', async (_n, auth) => {
    const res = await registry.GET(await req('/api/studio/registry?kind=lint', { auth }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.kind).toBe('lint');
    expect(Array.isArray(b.items)).toBe(true);
    expect(res.headers.get('x-correlation-id')).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
  });

  it('x-correlation-id klien yang sah dipantulkan apa adanya', async () => {
    const res = await registry.GET(await req('/api/studio/registry?kind=lint', { auth: 'agent', headers: { 'x-correlation-id': 'misi-s74-0001' } }));
    expect(res.headers.get('x-correlation-id')).toBe('misi-s74-0001');
  });
});

describe('getStudioCaller: klasifikasi identitas (KT-16)', () => {
  it('cookie HQ r=ADMINISTRATOR -> ADMIN_SESSION, satu-satunya yang boleh menulis kelas K', async () => {
    const c = await getStudioCaller(await req('/x', { auth: 'admin', user: 'adm' }));
    expect(c).toMatchObject({ kind: 'ADMIN_SESSION', canWriteClassK: true, username: 'adm', role: 'ADMINISTRATOR', requester: 'user:adm' });
  });

  it('cookie HQ peran lain (termasuk "admin" huruf kecil) -> USER_SESSION tanpa hak K', async () => {
    const c = await getStudioCaller(await req('/x', { headers: { cookie: hqCookie({ u: 'op', r: 'admin' }) } }));
    expect(c).toMatchObject({ kind: 'USER_SESSION', canWriteClassK: false, requester: 'user:op' });
  });

  it('JWT NextAuth -> GOOGLE_SESSION (diperlakukan USER) dengan email', async () => {
    const c = await getStudioCaller(await req('/x', { auth: 'google' }));
    expect(c).toMatchObject({ kind: 'GOOGLE_SESSION', canWriteClassK: false, email: 'agen@gsp.test' });
  });

  // SR-43 (D-134, S87 L-02): requester berprefiks jenis `agent:<agentId>`; agentId hanya label.
  it('x-internal-secret -> INTERNAL_AGENT; requester = agent:<agentId> (dipotong 80)', async () => {
    const long = 'a'.repeat(120);
    const c = await getStudioCaller(await req('/x', { auth: 'agent' }), long);
    expect(c.kind).toBe('INTERNAL_AGENT');
    expect(c.canWriteClassK).toBe(false);
    expect(c.agentId).toBe('a'.repeat(80));
    expect(c.requester).toBe('agent:' + 'a'.repeat(80));
  });

  it('x-internal-secret tanpa agentId -> requester "anonymous-internal"', async () => {
    const c = await getStudioCaller(await req('/x', { auth: 'agent' }));
    expect(c.requester).toBe('anonymous-internal');
  });

  it('cookie HQ + secret internal sekaligus -> cookie menang (urutan §6.1)', async () => {
    const c = await getStudioCaller(await req('/x', { auth: 'user', headers: { 'x-internal-secret': TEST_INTERNAL_SECRET } }));
    expect(c.kind).toBe('USER_SESSION');
  });

  it('secret internal TIDAK menaikkan pemanggil ke ADMIN meski agentId mengaku admin', async () => {
    const c = await getStudioCaller(await req('/x', { auth: 'agent' }), 'ADMINISTRATOR');
    expect(c.kind).toBe('INTERNAL_AGENT');
    expect(c.canWriteClassK).toBe(false);
  });

  it('tanpa identitas -> StudioEngineError UNAUTHORIZED (401)', async () => {
    const err = await getStudioCaller(await req('/x')).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StudioEngineError);
    expect((err as StudioEngineError).code).toBe('UNAUTHORIZED');
    expect((err as StudioEngineError).httpStatus).toBe(401);
  });
});

describe('403 FORBIDDEN untuk sesi sah tanpa hak (render-env refresh, delta S03-d2)', () => {
  it.each(['user', 'google', 'agent'] as const)('%s ?refresh=1 -> 403 code FORBIDDEN tanpa akses DB', async (auth) => {
    const res = await renderEnv.GET(await req('/api/studio/render-env?refresh=1', { auth }));
    expect(res.status).toBe(403);
    expect((await jsonOf(res)).code).toBe('FORBIDDEN');
    expect(dbCalls()).toEqual([]);
  });
});
