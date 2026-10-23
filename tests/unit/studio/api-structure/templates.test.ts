/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: templat v2 R01/R02/R19 — PRESET_READONLY dan PARAM_SURFACE_FORBIDDEN (register 03
// §12 R01/R02/R19, §13.5 urutan 1-7; D-163 T-1: lanjutan hanya ADMIN, expertMode tidak membuka).
// Semua penulisan memakai templat fixture `sr45-fx-*` (dibuat ADMIN lalu dihapus); templat seed
// hanya DIBACA (definisi sumber), tidak pernah ditulis.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as R01 from '@/app/api/studio/templates/route';
import * as R02 from '@/app/api/studio/templates/[id]/route';
import * as R19 from '@/app/api/studio/templates/[id]/skeleton/route';
import { RUN_ID } from './_env';
import { type Auth, call, params, req, withAgent } from './_http';
import { FX_PREFIX, dbGuard, trackTemplate } from './_db';
import { prisma } from '@/lib/prisma';
import { PARAMS_BY_KEY } from '@/lib/studio/params';

const guard = dbGuard('templates');
const ADVANCED_KEY = 'type.scale.tableHeader.upper'; // lapis advanced, kelas B, cakupan document
const SLOT_ADVANCED_KEY = 'cover.standfirst.italic'; // lapis advanced, kelas B, cakupan section:cover

let presetDef: any; // definisi preset seed (dibaca ADMIN)
let gspDef: any; // definisi datum-gsp seed (dibaca ADMIN)
let fxPreset = ''; // id templat fixture isPreset
let fxTpl = ''; // id templat fixture biasa
const slug = (t: string) => `${FX_PREFIX}${t}-${RUN_ID}`.toLowerCase();

async function readDef(id: string, auth: Auth = 'admin') {
  const r = await call(R02.GET(await req(`/api/studio/templates/${id}`, { auth }), params({ id })));
  expect(r.status).toBe(200);
  return r.body;
}
async function latest(id: string): Promise<number> {
  return (await prisma.studioTemplate.findUnique({ where: { id }, select: { latestVersionNo: true } }))!.latestVersionNo;
}
async function saveV2(id: string, auth: Auth, template: any, extra: Record<string, unknown> = {}) {
  const body = withAgent(auth, { baseVersionNo: await latest(id), changeNote: 'Uji SR-45', template, ...extra });
  return call(R02.POST(await req(`/api/studio/templates/${id}`, { auth, body }), params({ id })));
}
async function saveSkeleton(id: string, auth: Auth, slots: any[], extra: Record<string, unknown> = {}) {
  // Register §12 R19: badan = StudioSkeletonV1 & {baseVersionNo, changeNote, expertMode?}; tanpa agentId
  // (additionalProperties false), jadi agen memanggil dengan secret saja.
  const body = { $schema: 'studio.skeleton/v1', slots, baseVersionNo: await latest(id), changeNote: 'Uji SR-45 kerangka', ...extra };
  return call(R19.POST(await req(`/api/studio/templates/${id}/skeleton`, { auth, body }), params({ id })));
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

beforeAll(async () => {
  await guard.setup();
  const preset = await prisma.studioTemplate.findUnique({ where: { slug: 'datum-gsp-preset' }, select: { id: true } });
  const gsp = await prisma.studioTemplate.findUnique({ where: { slug: 'datum-gsp' }, select: { id: true } });
  presetDef = (await readDef(preset!.id)).definition;
  gspDef = (await readDef(gsp!.id)).definition;
  expect(presetDef?.$schema).toBe('studio.template/v2');
  expect(gspDef?.$schema).toBe('studio.template/v2');

  const p = await call(
    R01.POST(await req('/api/studio/templates', { auth: 'admin', body: { slug: slug('preset'), name: 'SR-45 preset fixture', kind: 'DOCUMENT', isPreset: true, changeNote: 'fixture SR-45', template: clone(presetDef) } })),
  );
  trackTemplate(p.body?.template?.id);
  expect(p.status, JSON.stringify(p.body).slice(0, 600)).toBe(201);
  expect(p.body.template.isPreset).toBe(true);
  fxPreset = p.body.template.id;

  const t = await call(
    R01.POST(await req('/api/studio/templates', { auth: 'admin', body: { slug: slug('tpl'), name: 'SR-45 templat fixture', kind: 'DOCUMENT', changeNote: 'fixture SR-45', template: clone(gspDef) } })),
  );
  trackTemplate(t.body?.template?.id);
  expect(t.status, JSON.stringify(t.body).slice(0, 600)).toBe(201);
  fxTpl = t.body.template.id;
}, 120_000);

afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

describe('PRESET_READONLY (403): preset gaya hanya diubah ADMIN', () => {
  it.each<Auth>(['user', 'google', 'agent'])('%s: R02 POST v2 ke preset -> 403 PRESET_READONLY, tanpa versi baru', async (auth) => {
    const before = await latest(fxPreset);
    const r = await saveV2(fxPreset, auth, clone(presetDef));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(403);
    expect(r.body.code).toBe('PRESET_READONLY');
    expect(await latest(fxPreset)).toBe(before);
  });

  it.each<Auth>(['user', 'agent'])('%s: R19 POST kerangka ke preset -> 403 PRESET_READONLY, tanpa versi baru', async (auth) => {
    const before = await latest(fxPreset);
    const r = await saveSkeleton(fxPreset, auth, clone(presetDef.skeleton.slots));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(403);
    expect(r.body.code).toBe('PRESET_READONLY');
    expect(await latest(fxPreset)).toBe(before);
  });

  it('ADMIN: R19 POST kerangka preset -> 201 versi baru', async () => {
    const before = await latest(fxPreset);
    const r = await saveSkeleton(fxPreset, 'admin', clone(presetDef.skeleton.slots));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.version.versionNo).toBe(before + 1);
    expect(typeof r.body.skeletonSha256).toBe('string');
  });

  it('USER: R01 POST v2 isPreset:true -> 403 FORBIDDEN (PRESET_ADMIN_ONLY), tanpa templat baru', async () => {
    const s = slug('preset-user');
    const r = await call(R01.POST(await req('/api/studio/templates', { auth: 'user', body: { slug: s, name: 'x', kind: 'DOCUMENT', isPreset: true, changeNote: 'x', template: clone(presetDef) } })));
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
    expect(r.body.details?.reason).toBe('PRESET_ADMIN_ONLY');
    expect(await prisma.studioTemplate.count({ where: { slug: s } })).toBe(0);
  });
});

describe('PARAM_SURFACE_FORBIDDEN (403): lapis lanjutan hanya ADMIN', () => {
  it('USER: R02 POST v2 mengubah kunci advanced global -> 403, details.keys memuat kunci, tanpa versi', async () => {
    const before = await latest(fxTpl);
    const def = clone(gspDef);
    const cur = def.advanced?.[ADVANCED_KEY];
    def.advanced = { ...(def.advanced ?? {}), [ADVANCED_KEY]: cur === false };
    const r = await saveV2(fxTpl, 'user', def);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(403);
    expect(r.body.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(JSON.stringify(r.body.details)).toContain(ADVANCED_KEY);
    expect(await latest(fxTpl)).toBe(before);
  });

  it('USER + expertMode:true tetap 403 (D-163 T-1), details.expertModeIgnored', async () => {
    const def = clone(gspDef);
    def.advanced = { ...(def.advanced ?? {}), [ADVANCED_KEY]: def.advanced?.[ADVANCED_KEY] === false };
    const r = await saveV2(fxTpl, 'user', def, { expertMode: true });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(r.body.details?.expertModeIgnored).toBe(true);
  });

  it('agen: R19 POST kerangka mengubah kunci advanced slot cover -> 403 PARAM_SURFACE_FORBIDDEN', async () => {
    const before = await latest(fxTpl);
    const slots = clone(gspDef.skeleton.slots);
    const cover = slots.find((s: any) => s.sectionType === 'cover');
    cover.advanced = { ...(cover.advanced ?? {}), [SLOT_ADVANCED_KEY]: cover.advanced?.[SLOT_ADVANCED_KEY] === false };
    const r = await saveSkeleton(fxTpl, 'agent', slots);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(403);
    expect(r.body.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(await latest(fxTpl)).toBe(before);
  });

  it('USER: R01 POST v1 datar dengan kunci advanced -> 403 PARAM_SURFACE_FORBIDDEN, tanpa templat', async () => {
    const s = slug('v1-user');
    const r = await call(
      R01.POST(await req('/api/studio/templates', { auth: 'user', body: { slug: s, name: 'x', kind: 'DOCUMENT', changeNote: 'x', overrides: { [ADVANCED_KEY]: false } } })),
    );
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(403);
    expect(r.body.code).toBe('PARAM_SURFACE_FORBIDDEN');
    expect(await prisma.studioTemplate.count({ where: { slug: s } })).toBe(0);
  });

  it('USER: simpan definisi hasil GET USER (tanpa lanjutan) -> 201; lapis lanjutan dibawa utuh', async () => {
    const before = await latest(fxTpl);
    const asUser = (await readDef(fxTpl, 'user')).definition;
    expect(asUser.advanced).toBeUndefined();
    const r = await saveV2(fxTpl, 'user', asUser);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.version.versionNo).toBe(before + 1);
    const asAdmin = (await readDef(fxTpl, 'admin')).definition;
    expect(asAdmin.advanced ?? {}).toEqual(gspDef.advanced ?? {});
  });

  it('ADMIN: kunci advanced yang sama -> 201', async () => {
    const def = clone(gspDef);
    def.advanced = { ...(def.advanced ?? {}), [ADVANCED_KEY]: def.advanced?.[ADVANCED_KEY] === false };
    const r = await saveV2(fxTpl, 'admin', def);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
  });
});

describe('SC-2/SC-3: cakupan parameter slot dan kelas T di kerangka (R19)', () => {
  it('ADMIN: kunci section:cover di slot controlSheet -> 422 SLOT_PARAM_SCOPE_INVALID, tanpa versi', async () => {
    const before = await latest(fxTpl);
    const slots = clone(gspDef.skeleton.slots);
    const cs = slots.find((s: any) => s.sectionType === 'controlSheet');
    cs.advanced = { ...(cs.advanced ?? {}), [SLOT_ADVANCED_KEY]: false };
    const r = await saveSkeleton(fxTpl, 'admin', slots);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(422);
    expect(r.body.code).toBe('SLOT_PARAM_SCOPE_INVALID');
    expect(await latest(fxTpl)).toBe(before);
  });

  it('USER: kunci kelas T (turunan mesin) di templat -> 400 PARAM_CLASS_T_READONLY, tanpa versi', async () => {
    const tDef = [...(PARAMS_BY_KEY as Map<string, any>).values()].find((d) => d.class === 'T' && d.scope === 'document' && d.type === 'bool');
    expect(tDef, 'registri memuat kunci T bool cakupan document').toBeDefined();
    const before = await latest(fxTpl);
    const def = clone(gspDef);
    def.essentials = { ...(def.essentials ?? {}), [tDef.key]: tDef.default !== true };
    const r = await saveV2(fxTpl, 'user', def);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(400);
    expect(r.body.code).toBe('PARAM_CLASS_T_READONLY');
    expect(await latest(fxTpl)).toBe(before);
  });
});
