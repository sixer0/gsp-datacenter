/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: auth pada route struktur R12-R20 dan R01/R02/R19 v2 (register 03 §12: semua route
// `requireSession`; blueprint 05 §2.11). Anonim -> 401 tanpa menyentuh layanan; tiga jalur
// identitas (cookie HQ, NextAuth Google, secret internal + agentId) diterima.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as R01 from '@/app/api/studio/templates/route';
import * as R02 from '@/app/api/studio/templates/[id]/route';
import * as R19 from '@/app/api/studio/templates/[id]/skeleton/route';
import * as R12 from '@/app/api/studio/chapters/route';
import * as R13 from '@/app/api/studio/slots/route';
import * as R14 from '@/app/api/studio/documents/[id]/structure/route';
import * as R15 from '@/app/api/studio/documents/[id]/completeness/route';
import * as R16 from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import * as R17 from '@/app/api/studio/documents/[id]/render/route';
import * as R18 from '@/app/api/studio/assets/route';
import * as R20 from '@/app/api/studio/documents/[id]/content/route';
import { ADMIN_USER, AGENT_ID, AUTHS_3, type Auth, GOOGLE_EMAIL, PLAIN_USER, TEST_SECRET_HEADER, call, hqCookie, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { chapterBody, createExtra, missionTarget, simpleChapter } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('auth');
let tplId = '';
let docId = '';

beforeAll(async () => {
  await guard.setup();
  const t = await prisma.studioTemplate.findUnique({ where: { slug: 'datum-gsp' }, select: { id: true } });
  tplId = t!.id;
}, 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

type H = (req: any, ctx?: any) => Promise<Response>;
const P = <T extends Record<string, string>>(o: T) => params(o);
const ANON: Array<[string, H, string, string, any?]> = [
  ['R01 GET', R01.GET as H, 'GET', '/api/studio/templates'],
  ['R01 POST', R01.POST as H, 'POST', '/api/studio/templates'],
  ['R02 GET', R02.GET as H, 'GET', '/api/studio/templates/x', { id: 'x' }],
  ['R02 POST', R02.POST as H, 'POST', '/api/studio/templates/x', { id: 'x' }],
  ['R02 PATCH', R02.PATCH as H, 'PATCH', '/api/studio/templates/x', { id: 'x' }],
  ['R19 GET', R19.GET as H, 'GET', '/api/studio/templates/x/skeleton', { id: 'x' }],
  ['R19 POST', R19.POST as H, 'POST', '/api/studio/templates/x/skeleton', { id: 'x' }],
  ['R12 POST', R12.POST as H, 'POST', '/api/studio/chapters'],
  ['R13 POST', R13.POST as H, 'POST', '/api/studio/slots'],
  ['R14 GET', R14.GET as H, 'GET', '/api/studio/documents/x/structure', { id: 'x' }],
  ['R14 PATCH', R14.PATCH as H, 'PATCH', '/api/studio/documents/x/structure', { id: 'x' }],
  ['R15 GET', R15.GET as H, 'GET', '/api/studio/documents/x/completeness', { id: 'x' }],
  ['R16 GET', R16.GET as H, 'GET', '/api/studio/documents/x/paragraphs/p-a', { id: 'x', pid: 'p-a' }],
  ['R16 PATCH', R16.PATCH as H, 'PATCH', '/api/studio/documents/x/paragraphs/p-a', { id: 'x', pid: 'p-a' }],
  ['R17 POST', R17.POST as H, 'POST', '/api/studio/documents/x/render', { id: 'x' }],
  ['R18 GET', R18.GET as H, 'GET', '/api/studio/assets?sha256=00'],
  ['R18 POST', R18.POST as H, 'POST', '/api/studio/assets'],
  ['R20 GET', R20.GET as H, 'GET', '/api/studio/documents/x/content', { id: 'x' }],
];

describe('Anonim -> 401 di setiap handler R01/R02/R19/R12-R20', () => {
  it('cakupan: setiap metode yang diekspor modul route tercantum', () => {
    const mods: Record<string, Record<string, unknown>> = { R01, R02, R19, R12, R13, R14, R15, R16, R17, R18, R20 };
    const exported = Object.entries(mods).flatMap(([n, m]) => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].filter((k) => typeof m[k] === 'function').map((k) => `${n} ${k}`));
    expect(exported.sort()).toEqual(ANON.map((a) => a[0]).sort());
  });

  it.each(ANON)('%s tanpa identitas -> 401 {error:"Unauthorized"}', async (_n, h, method, path, p) => {
    const body = method === 'GET' ? undefined : { $schema: 'studio.chapter/v2' };
    const r = await call(h(await req(path, { method, body }), p ? P(p) : undefined));
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ error: 'Unauthorized' });
  });

  it.each(ANON.filter((a) => a[2] !== 'GET'))('%s secret internal salah -> 401', async (_n, h, method, path, p) => {
    const r = await call(h(await req(path, { method, body: {}, headers: { [TEST_SECRET_HEADER]: 'salah' } }), p ? P(p) : undefined));
    expect(r.status).toBe(401);
  });

  it('cookie HQ kedaluwarsa / bertanda tangan secret lain -> 401 (R12, R20)', async () => {
    const expired = hqCookie(PLAIN_USER, 'USER', -60);
    const forged = hqCookie(PLAIN_USER, 'ADMINISTRATOR', 3600, 'secret-lain');
    for (const cookie of [expired, forged]) {
      expect((await call(R12.POST(await req('/api/studio/chapters', { body: {}, headers: { cookie } })))).status).toBe(401);
      expect((await call(R20.GET(await req('/api/studio/documents/x/content', { headers: { cookie } }), P({ id: 'x' })))).status).toBe(401);
    }
  });
});

describe('Tiga jalur auth (cookie HQ USER, NextAuth Google, secret internal) + ADMIN', () => {
  const ALL: Auth[] = ['admin', ...AUTHS_3];

  it.each(ALL)('%s: R12 POST bab pertama -> 201, requester sesuai identitas', async (auth) => {
    const folder = missionFolder(`auth-${auth}`);
    const r = await call(R12.POST(await req('/api/studio/chapters', { auth, body: withAgent(auth, chapterBody(missionTarget(folder), simpleChapter('1'), createExtra())) })));
    trackDoc(r.body?.document?.id);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    if (!docId) docId = r.body.document.id;
    const d = await prisma.studioDocument.findUnique({ where: { id: r.body.document.id }, select: { createdBy: true } });
    const expected = { admin: `user:${ADMIN_USER}`, user: `user:${PLAIN_USER}`, google: GOOGLE_EMAIL, agent: `agent:${AGENT_ID}` }[auth as string];
    expect(d?.createdBy).toContain(expected);
  });

  it.each(ALL)('%s: GET R01, R02, R19, R15, R20 -> 200', async (auth) => {
    expect((await call(R01.GET(await req('/api/studio/templates', { auth })))).status).toBe(200);
    expect((await call(R02.GET(await req(`/api/studio/templates/${tplId}`, { auth }), P({ id: tplId })))).status).toBe(200);
    expect((await call(R19.GET(await req(`/api/studio/templates/${tplId}/skeleton`, { auth }), P({ id: tplId })))).status).toBe(200);
    expect((await call(R15.GET(await req(`/api/studio/documents/${docId}/completeness`, { auth }), P({ id: docId })))).status).toBe(200);
    expect((await call(R20.GET(await req(`/api/studio/documents/${docId}/content`, { auth }), P({ id: docId })))).status).toBe(200);
  });

  it('agen tanpa agentId diterima; requester = penanda agen anonim (bukan agentId)', async () => {
    const folder = missionFolder('auth-noid');
    const r = await call(R12.POST(await req('/api/studio/chapters', { auth: 'agent', body: chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()) })));
    trackDoc(r.body?.document?.id);
    expect(r.status).toBe(201);
    const d = await prisma.studioDocument.findUnique({ where: { id: r.body.document.id }, select: { createdBy: true } });
    expect(d?.createdBy).not.toContain('agent:');
    expect(r.body.completeness.chapters.content.present[0].by).toBe(d?.createdBy);
  });
});

describe('PT-07: permukaan ringkas templat untuk USER', () => {
  it('R02 GET USER: definition tanpa advanced/roleFormats; ADMIN memuat advanced', async () => {
    const u = await call(R02.GET(await req(`/api/studio/templates/${tplId}?expert=1`, { auth: 'user' }), P({ id: tplId })));
    expect(u.status).toBe(200);
    expect(u.body.definition.advanced).toBeUndefined();
    expect(u.body.definition.roleFormats).toBeUndefined();
    expect(u.body.advancedIncluded).toBe(false);
    expect(Object.keys(u.body.definition.essentials ?? {}).length).toBeGreaterThan(0);
    for (const s of u.body.definition.skeleton.slots) expect(s.advanced).toBeUndefined();
    const a = await call(R02.GET(await req(`/api/studio/templates/${tplId}`, { auth: 'admin' }), P({ id: tplId })));
    expect(a.body.advancedIncluded).toBe(true);
  });

  it('R19 GET USER: kerangka + essentials {global, bySlot}, tanpa advanced slot', async () => {
    const u = await call(R19.GET(await req(`/api/studio/templates/${tplId}/skeleton`, { auth: 'user' }), P({ id: tplId })));
    expect(u.status).toBe(200);
    expect(u.body.skeleton.$schema).toBe('studio.skeleton/v1');
    expect(typeof u.body.skeletonSha256).toBe('string');
    expect(u.body.essentials).toHaveProperty('global');
    expect(u.body.essentials).toHaveProperty('bySlot');
    for (const s of u.body.skeleton.slots) expect(s.advanced).toBeUndefined();
  });

  it('R01 GET ?preset=1 hanya preset gaya (isPreset), tiap baris membawa restricted', async () => {
    const r = await call(R01.GET(await req('/api/studio/templates?preset=1', { auth: 'user' })));
    expect(r.status).toBe(200);
    expect(r.body.templates.length).toBeGreaterThan(0);
    for (const t of r.body.templates) {
      expect(t.isPreset).toBe(true);
      expect(typeof t.restricted).toBe('boolean');
    }
  });
});
