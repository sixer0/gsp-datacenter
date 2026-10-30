// DC-28 — R03 `kind=contracts` (AM-07, register 05 §9.4, AC-21), AM-13 `TemplateSummary.contractKind`
// di R01, dan urutan galat seragam R02/R19 400 -> 404 sesudah CH-06 (D-385).
// Seam: handler route publik + Prisma tiruan (tanpa DB).
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { callsOf, dbCalls, on, resetDb } from './_prisma';
import { canonicalTemplate, captureServiceLogs, jsonOf, makeTemplate, params, req } from './_studio';
import { CONTENT_BLOCK_TYPES, type TemplateSlotDef } from '@/lib/studio/contract';
import {
  AGENT_WORK_REPORT_STATUSES,
  CONTRACT_EVIDENCE_KINDS,
  CONTRACT_ITEM_STATUSES,
  CONTRACT_KINDS,
  CONTRACT_OUTLINE_KEYS,
  CONTRACT_REF_RELS,
  CONTRACT_VERDICTS,
} from '@/lib/studio/contract/enums';
import { REGISTRY_KINDS } from '@/lib/studio/contract/types/api';
import { CONTRACT_KIND_DEFS } from '@/lib/studio/registry/contracts';
import { GET as getRegistry } from '@/app/api/studio/registry/route';
import { GET as getTemplates } from '@/app/api/studio/templates/route';
import { POST as postTemplateVersion } from '@/app/api/studio/templates/[id]/route';
import { POST as postSkeleton } from '@/app/api/studio/templates/[id]/skeleton/route';

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const registry = (query: string, auth: 'agent' | 'none' = 'agent') => req(`/api/studio/registry?${query}`, { auth }).then((r) => getRegistry(r));

describe('AM-07 RegistryKind memuat contracts', () => {
  it('REGISTRY_KINDS + contracts (13 kind)', () => {
    expect(REGISTRY_KINDS).toContain('contracts');
    expect(REGISTRY_KINDS).toHaveLength(13);
  });
});

describe('R03 GET ?kind=contracts (register 05 §9.4, AC-21)', () => {
  it('200: tepat jenis aktif C58 (tahap 1 = agentWorkReport), tanpa akses DB', async () => {
    const res = await registry('kind=contracts');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    expect(res.headers.get('cache-control')).toBe('private, max-age=300');
    const body = await jsonOf(res);
    expect(body.kind).toBe('contracts');
    expect(body.count).toBe(1);
    expect(body.items.map((d: { kind: string }) => d.kind)).toEqual([...CONTRACT_KINDS]);
    expect(body.items).toEqual(JSON.parse(JSON.stringify(CONTRACT_KIND_DEFS)));
    expect(body.meta).toEqual({ kinds: ['agentWorkReport'], templateSlugs: { agentWorkReport: 'laporan-kerja-agen' } });
    expect(dbCalls()).toEqual([]);
  });

  it('memuat set register: status E45, status butir E46, vonis E47, rel E48, bukti E49, outline wajib CO, kerangka SL-08..SL-10', async () => {
    const [def] = (await jsonOf(await registry('kind=contracts'))).items;
    expect(def.stage).toBe('active');
    expect(def.templateSlug).toBe('laporan-kerja-agen');
    expect(def.statuses.map((s: { code: string }) => s.code)).toEqual([...AGENT_WORK_REPORT_STATUSES]);
    expect(def.itemStatuses.map((s: { code: string }) => s.code)).toEqual([...CONTRACT_ITEM_STATUSES]);
    expect(def.verdicts.map((s: { code: string }) => s.code)).toEqual([...CONTRACT_VERDICTS]);
    expect(def.refRels).toEqual([...CONTRACT_REF_RELS]);
    expect(def.evidenceKinds).toEqual([...CONTRACT_EVIDENCE_KINDS]);
    expect(def.outline.filter((o: { required: boolean }) => o.required).map((o: { outlineKey: string }) => o.outlineKey)).toEqual([...CONTRACT_OUTLINE_KEYS]);
    expect(def.skeleton.map((s: { slotKey: string; sectionType: string }) => `${s.slotKey}:${s.sectionType}`)).toEqual([
      'record:contractRecord',
      'content:chapter',
      'references:sourceRegister',
    ]);
    for (const k of ['cardId', 'key', 'actor', 'reportedAt', 'finalFileName']) expect(typeof def.patterns[k]).toBe('string');
    expect(Object.keys(def.limits).length).toBeGreaterThan(0);
    for (const k of ['headings', 'lineLabels', 'headerKeys', 'statuses', 'itemStatuses', 'verdicts']) {
      expect(Object.keys(def.aliases[k]).length).toBeGreaterThan(0);
    }
    expect(def.aliases.statuses['perlu_revisi']).toBe('needs-review');
  });

  it('parameter lain untuk kind=contracts -> 400 SCHEMA_INVALID /query/<nama>', async () => {
    const res = await registry('kind=contracts&kindName=agentWorkReport&x=1');
    expect(res.status).toBe(400);
    const body = await jsonOf(res);
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(body.details.map((d: { pointer: string }) => d.pointer)).toEqual(['/query/kindName', '/query/x']);
  });

  it('kind tak dikenal tetap 400 REGISTRY_KIND_UNKNOWN; daftar kind memuat contracts', async () => {
    const res = await registry('kind=contract');
    expect(res.status).toBe(400);
    const body = await jsonOf(res);
    expect(body.code).toBe('REGISTRY_KIND_UNKNOWN');
    expect(body.details[0].message.split('|')).toContain('contracts');
  });

  it('anonim -> 401 tanpa akses DB', async () => {
    const res = await registry('kind=contracts', 'none');
    expect(res.status).toBe(401);
    expect(dbCalls()).toEqual([]);
  });
});

describe('AM-13 R01 GET templates memuat contractKind', () => {
  it('laporan-kerja-agen -> agentWorkReport; templat lain (kolom null/absen) -> null', async () => {
    const laporan = makeTemplate({ id: 'tpl-lap', slug: 'laporan-kerja-agen' });
    laporan.template.contractKind = 'agentWorkReport';
    const biasa = makeTemplate({ id: 'tpl-biasa', slug: 'nota-biasa' });
    biasa.template.contractKind = null;
    const lama = canonicalTemplate(); // baris tanpa kolom (fixture lama) -> null
    const fixtures = [lama, laporan, biasa];
    on('studioTemplate', 'findMany', async () => fixtures.map((f) => f.template));
    on('studioTemplateVersion', 'findMany', async () => fixtures.flatMap((f) => f.versions));
    const res = await getTemplates(await req('/api/studio/templates', { auth: 'agent' }));
    expect(res.status).toBe(200);
    const { templates } = await jsonOf(res);
    const bySlug = Object.fromEntries(templates.map((t: { slug: string; contractKind: unknown }) => [t.slug, t.contractKind]));
    expect(bySlug).toEqual({ 'datum-kanonik': null, 'laporan-kerja-agen': 'agentWorkReport', 'nota-biasa': null });
  });
});

// ── Urutan galat seragam R02/R19 (D-385): 401 -> 400 -> 404 ───────────────

const RECORD: TemplateSlotDef = {
  slotKey: 'record', sectionType: 'contractRecord', label: 'Catatan Laporan', position: 1, required: true, positionLocked: true,
  repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {},
};
const CHAPTER: TemplateSlotDef = {
  slotKey: 'content', sectionType: 'chapter', label: 'Isi Laporan', position: 2, required: true, positionLocked: false,
  repeatable: true, minItems: 1, contentMode: 'INPUT', tiers: [], admits: [...CONTENT_BLOCK_TYPES], essentials: {},
};

const v2Body = (slots: TemplateSlotDef[]) => ({
  baseVersionNo: 1,
  changeNote: 'uji DC-28',
  template: { $schema: 'studio.template/v2', preset: { slug: 'datum-gsp-preset', version: 2 }, essentials: {}, skeleton: { slots } },
});

/** Templat sasaran tidak ada: semua pencarian templat kosong. */
function noTemplates(): void {
  on('studioTemplate', 'findFirst', async () => null);
  on('studioTemplate', 'findUnique', async () => null);
}

const postV2 = async (slots: TemplateSlotDef[], auth: 'admin' | 'none' = 'admin') =>
  postTemplateVersion(await req('/api/studio/templates/tidak-ada', { method: 'POST', auth, body: v2Body(slots) }), params({ id: 'tidak-ada' }));

describe('R02 POST v2 ke templat yang tidak ada: 400 badan sebelum 404', () => {
  it('anonim -> 401 lebih dulu', async () => {
    const res = await postV2([{ ...CHAPTER, position: 5 }], 'none');
    expect(res.status).toBe(401);
  });

  it('kerangka SR-06 rusak (posisi tidak kontigu) -> 400 SCHEMA_INVALID SKELETON_POSITION, bukan 404', async () => {
    noTemplates();
    const res = await postV2([{ ...CHAPTER, position: 5 }]);
    expect(res.status).toBe(400);
    const body = await jsonOf(res);
    expect(body.code).toBe('SCHEMA_INVALID');
    expect(JSON.stringify(body.details)).toContain('SKELETON_POSITION');
  });

  it('CH-06 badan murni (dua slot contractRecord) -> 400 SKELETON_CONTRACT_RECORD maxContains, bukan 404', async () => {
    noTemplates();
    const res = await postV2([RECORD, { ...RECORD, slotKey: 'record2', position: 2 }, { ...CHAPTER, position: 3 }]);
    expect(res.status).toBe(400);
    const body = await jsonOf(res);
    expect(body.code).toBe('SCHEMA_INVALID');
    const issues = (body.details.issues ?? body.details) as Array<{ keyword: string; checkId?: string }>;
    expect(issues).toEqual([expect.objectContaining({ keyword: 'maxContains', checkId: 'SKELETON_CONTRACT_RECORD' })]);
  });

  it('CH-06 bergantung templat (contractRecord, templat tidak ada) tidak dinilai -> 404 TEMPLATE_NOT_FOUND', async () => {
    noTemplates();
    const res = await postV2([RECORD, CHAPTER]);
    expect(res.status).toBe(404);
    expect((await jsonOf(res)).code).toBe('TEMPLATE_NOT_FOUND');
  });

  it('badan sah -> 404 TEMPLATE_NOT_FOUND tanpa tulis', async () => {
    noTemplates();
    const res = await postV2([{ ...CHAPTER, position: 1 }]);
    expect(res.status).toBe(404);
    expect(callsOf('studioTemplateVersion', 'create')).toEqual([]);
  });

  it('templat ada tanpa contractKind: CH-06 dependentRequired tetap 400', async () => {
    const t = makeTemplate({ id: 'tpl-x', slug: 'templat-x' });
    on('studioTemplate', 'findFirst', async () => ({ ...t.template, contractKind: null }));
    const res = await postTemplateVersion(
      await req('/api/studio/templates/tpl-x', { method: 'POST', auth: 'admin', body: v2Body([RECORD, CHAPTER]) }),
      params({ id: 'tpl-x' }),
    );
    expect(res.status).toBe(400);
    expect(JSON.stringify((await jsonOf(res)).details)).toContain('SKELETON_CONTRACT_RECORD');
  });
});

describe('R19 POST kerangka ke templat yang tidak ada', () => {
  it('bentuk studio.skeleton/v1 rusak -> 400 sebelum 404', async () => {
    noTemplates();
    const res = await postSkeleton(
      await req('/api/studio/templates/tidak-ada/skeleton', { method: 'POST', auth: 'admin', body: { $schema: 'studio.skeleton/v1', slots: 'bukan-larik', baseVersionNo: 1, changeNote: 'x' } }),
      params({ id: 'tidak-ada' }),
    );
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
  });
});
