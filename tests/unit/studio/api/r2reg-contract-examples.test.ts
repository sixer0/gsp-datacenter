/* eslint-disable @typescript-eslint/no-explicit-any -- uji: argumen Prisma tiruan bebas-bentuk */
// R2-02 (D-419) — U-03: contoh kiriman siap salin `examples` pada entri C58 agentWorkReport
// (record + chapters 1..5) disajikan R03 `kind=contracts`; SETIAP contoh lolos skema v2 (langkah
// skema R08 `validateV2`) dan dry-run R08 in-process (`validateV2Submission` + ingest nyata,
// templat/kerangka laporan kerja disuntik, Prisma DI-MOCK) tanpa isu galat.
// U-07: R03 tanpa `kind` / kind tak dikenal -> 400 REGISTRY_KIND_UNKNOWN berdaftar kind + contoh kueri.
// R2-F1 (D-424 #3/#4, D-426): contoh apa adanya TIDAK pernah menarget dokumen yang ada (tanpa ID nyata;
// record membuat dokumen baru, bab tanpa record ditolak, simulasi berurutan draf membuat lalu mengisi);
// `details` REGISTRY_KIND_UNKNOWN = larik isu (01 §6.2) dengan validKinds + contoh kueri di dalam isu.
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const inject = vi.hoisted(() => ({ opts: {} as Record<string, unknown> }));

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/ingest', async (orig) => {
  const m = (await orig()) as typeof import('@/lib/studio/services/ingest');
  return { ...m, ingestDocument: (req: any, caller: any, opts: any) => m.ingestDocument(req, caller, { ...opts, ...inject.opts }) };
});

import { callsOf, dbCalls, on, resetDb } from './_prisma';
import { captureServiceLogs, installTemplates, jsonOf, makeTemplate, req } from './_studio';
import { CONTENT_BLOCK_TYPES, type ResolvedTemplate, type StudioChapterV2, type TemplateSlotDef } from '@/lib/studio/contract';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { REGISTRY_KINDS } from '@/lib/studio/contract/types/api';
import { getContractKindDef, requiredOutlineChapterKeys } from '@/lib/studio/registry/contracts';
import { validateV2 } from '@/app/api/studio/validate/_shared/v2-kit';
import { validateV2Submission } from '@/app/api/studio/validate/_shared/dry-run';
import { dryRunDraftBlock } from '@/app/api/studio/drafts/check/_lib/dry-run';
import { completeDraftCheck, prepareDraftCheck } from '@/lib/studio/services/draft';
import { GET as getRegistry } from '@/app/api/studio/registry/route';
import { defaultParams, skeletonInput } from '../structure/_kit';

/** Dokumen nyata milik orang lain di DB tiruan (bentuk seperti 001/GSP/LAP/X/2026 di DEV). */
const OTHER_DOC = { id: 'cmvuz4mn70001v1jgoom5m4qw', docNumber: '001/GSP/LAP/X/2026', currentRevisionNo: 7, missionFolder: '2026-10-30_dc31_gate', missionDocKey: 'laporan-kerja-agen' };
const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', username: 'adm', canWriteClassK: true };
const CTX = { correlationId: 'r2reg-r08', method: 'POST', path: '/api/studio/validate' } as any;

const def = getContractKindDef('agentWorkReport')!;
const examples = def.examples;
const CHAPTER_KEYS = requiredOutlineChapterKeys('agentWorkReport');

function reportSlots(): TemplateSlotDef[] {
  return [
    { slotKey: 'record', sectionType: 'contractRecord', label: 'Catatan Laporan', position: 1, required: true, positionLocked: true, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
    { slotKey: 'content', sectionType: 'chapter', label: 'Isi Laporan', position: 2, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: 'INPUT', tiers: [], admits: [...CONTENT_BLOCK_TYPES], essentials: {} },
    { slotKey: 'references', sectionType: 'sourceRegister', label: 'Referensi', position: 3, required: false, positionLocked: false, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
  ];
}

function tplOf(): ResolvedTemplate {
  return { templateId: 'tpl-lka', versionId: 'tv-lka-1', versionNo: 1, params: defaultParams(), roleFormats: {} as never, sectionPlan: {} as never, assets: {} };
}

/** Dokumen `studio.doc/v2` dari contoh record + bab terpilih (badan bab disalin apa adanya). */
function docOf(chapters: readonly StudioChapterV2[]): Record<string, unknown> {
  const rec = examples.record;
  return {
    $schema: 'studio.doc/v2',
    template: rec.template,
    meta: { ...rec.meta, tier: def.tier },
    sections: { record: rec.payload, content: { type: 'chapter', chapters: chapters.map((c) => c.chapter) } },
  };
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const registry = (query: string) => req(`/api/studio/registry${query ? `?${query}` : ''}`, { auth: 'agent' }).then((r) => getRegistry(r));

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  inject.opts = { template: tplOf(), skeleton: skeletonInput(reportSlots()) };
  // DB berisi dokumen LAIN (laporan orang lain): dicari per id ia ada; per misi+docKey contoh tidak ada.
  on('studioDocument', 'findUnique', async ({ where }: any) => (where?.id === OTHER_DOC.id ? OTHER_DOC : null));
  on('studioDocument', 'findMany', async () => []);
  // Templat laporan kerja di DB tiruan (jalur kiriman bab/slot menyelesaikan slug lewat DB).
  const tpl = makeTemplate({ id: 'tpl-lka', slug: def.templateSlug });
  tpl.template.contractKind = 'agentWorkReport';
  tpl.versions[0]!.slots = reportSlots().map((d) => ({
    id: `slot-${d.slotKey}`, templateVersionId: tpl.versions[0]!.id, slotKey: d.slotKey, sectionTypeKey: d.sectionType, label: d.label, position: d.position,
    required: d.required, positionLocked: d.positionLocked, repeatable: d.repeatable, minItems: d.minItems ?? null, maxItems: null, contentMode: d.contentMode,
    tiers: d.tiers, admits: d.admits, configSha256: '', params: [], roleFormats: [],
  }));
  installTemplates(tpl);
  on('studioTemplateSlot', 'findMany', async () => tpl.versions[0]!.slots.map((r: any) => ({ id: r.id, slotKey: r.slotKey })));
  on('studioDocIdentity', 'findMany', async () => []);
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('U-03 examples agentWorkReport: cakupan dan bentuk', () => {
  it('record = studio.slot/v2 slot record; chapters tepat kunci outline wajib 1..5, key bab = kunci', () => {
    expect(examples.record.$schema).toBe('studio.slot/v2');
    expect(examples.record.slot).toBe('record');
    expect(Object.keys(examples.chapters)).toEqual(CHAPTER_KEYS);
    for (const k of CHAPTER_KEYS) {
      expect(examples.chapters[k]!.$schema).toBe('studio.chapter/v2');
      expect(examples.chapters[k]!.chapter.key).toBe(k);
    }
    expect(examples.howTo.length).toBeGreaterThan(0);
  });

  it('payload record lengkap: items, evidence ber-note {text}; refs TIDAK ada (rujukan wajib nyata, bentuknya di howTo)', () => {
    const p = examples.record.payload;
    expect(p.items!.length).toBeGreaterThan(0);
    expect(p.refs).toBeUndefined();
    expect(examples.howTo.join(' ')).toMatch(/"refs": \[\{ "documentId": "<id dokumen nyata>", "pid": "<pid nyata>"/);
    expect(p.evidence!.length).toBeGreaterThan(0);
    for (const e of p.evidence!) expect(typeof (e.note as { text?: unknown } | undefined)?.text).toBe('string');
  });

  it('bab memuat paragraf, list items objek {text}, table sel {text} sejumlah kolom, dan peran retoris', () => {
    const blocks = CHAPTER_KEYS.flatMap((k) => examples.chapters[k]!.chapter.sections.flatMap((s) => s.blocks)) as any[];
    const types = new Set(blocks.map((b) => b.type));
    for (const t of ['paragraph', 'list', 'table']) expect(types.has(t)).toBe(true);
    for (const l of blocks.filter((b) => b.type === 'list')) for (const it of l.items) expect(typeof it.text).toBe('string');
    for (const t of blocks.filter((b) => b.type === 'table')) {
      for (const row of t.rows) {
        expect(row.cells).toHaveLength(t.columns.length);
        for (const c of row.cells) expect(typeof c.text).toBe('string');
      }
    }
    const roles = blocks.filter((b) => b.type === 'paragraph' && b.role).map((b) => b.role);
    expect(roles).toEqual(expect.arrayContaining(['lede', 'closingAction']));
  });
});

describe('U-03 setiap contoh lolos skema v2 (langkah skema R08)', () => {
  it('record studio.slot/v2 -> tanpa isu', () => {
    expect(validateV2('studio.slot/v2', clone(examples.record))).toEqual([]);
  });

  it.each(CHAPTER_KEYS)('bab %s studio.chapter/v2 -> tanpa isu', (k) => {
    expect(validateV2('studio.chapter/v2', clone(examples.chapters[k]))).toEqual([]);
  });
});

describe('U-03 dry-run R08 in-process (ingest nyata, tanpa tulis)', () => {
  it.each(CHAPTER_KEYS)('record + bab %s -> valid, tanpa isu galat', async (k) => {
    const out = await validateV2Submission('studio.doc/v2', clone(docOf([examples.chapters[k]!])), undefined, ADMIN, false, '', CTX);
    expect(out.issues).toEqual([]);
    expect(out.valid).toBe(true);
    expect('warnings' in out).toBe(false);
    expect(out.lint?.releaseStatus ?? 'NOT_RUN').not.toBe('FAIL');
  });

  it('record + bab 1..5 -> valid, kelengkapan COMPLETE tanpa missingRequired', async () => {
    const out = await validateV2Submission('studio.doc/v2', clone(docOf(CHAPTER_KEYS.map((k) => examples.chapters[k]!))), undefined, ADMIN, false, '', CTX);
    expect(out.issues).toEqual([]);
    expect(out.valid).toBe(true);
    expect(out.completenessPreview?.status).toBe('COMPLETE');
    expect(out.completenessPreview?.missingRequired).toEqual([]);
    // Lint ingest berjalan dan lolos (DATUM-10 sumber tabel, C-26c, C-27 dijaga contoh).
    expect(out.lint?.releaseStatus).toBe('PASS');
  });

  it('kontrol negatif: list items string / sel tabel string ditolak skema (uji ini benar-benar menyaring bentuk)', async () => {
    const bad1 = clone(examples.chapters['1']!) as any;
    bad1.chapter.sections[0].blocks[2].items = ['Bab 2 lolos draft-check tanpa isu.'];
    expect(validateV2('studio.chapter/v2', bad1).length).toBeGreaterThan(0);
    const bad2 = clone(examples.chapters['2']!) as any;
    bad2.chapter.sections[1].blocks[0].rows[1].cells = ['draf.md', 'Draf Markdown bab 2'];
    const out = await validateV2Submission('studio.chapter/v2', bad2, undefined, ADMIN, false, '', CTX);
    expect(out.valid).toBe(false);
    expect(out.issues.length).toBeGreaterThan(0);
  });
});

describe('U-03 R03 kind=contracts menyajikan examples', () => {
  it('items[0].examples = konstanta registri apa adanya, tanpa akses DB', async () => {
    resetDb();
    const res = await registry('kind=contracts');
    expect(res.status).toBe(200);
    const body = await jsonOf(res);
    expect(body.items[0].examples).toEqual(clone(examples));
    expect(dbCalls()).toEqual([]);
  });
});

describe('U-07 R03 tanpa kind / kind tak dikenal -> 400 REGISTRY_KIND_UNKNOWN berdaftar (details = larik isu, 01 §6.2)', () => {
  it('tanpa kind: satu isu keyword required, received null, validKinds = REGISTRY_KINDS, contoh kueri, header cid', async () => {
    const res = await registry('');
    expect(res.status).toBe(400);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    const body = await jsonOf(res);
    expect(body.code).toBe('REGISTRY_KIND_UNKNOWN');
    expect(body.error).toMatch(/kind query parameter is required/);
    expect(Array.isArray(body.details)).toBe(true);
    expect(body.details).toHaveLength(1);
    expect(body.details[0]).toMatchObject({ pointer: '/query/kind', keyword: 'required', received: null });
    expect(body.details[0].message.split('|')).toEqual([...REGISTRY_KINDS]);
    expect(body.details[0].validKinds).toEqual([...REGISTRY_KINDS]);
    expect(body.details[0].examples).toContain('/api/studio/registry?kind=contracts');
  });

  it('kind kosong (?kind=) diperlakukan sama dengan absen', async () => {
    const body = await jsonOf(await registry('kind='));
    expect(body.details[0].keyword).toBe('required');
  });

  it('kind tak dikenal: keyword enum, received dipotong 64 karakter', async () => {
    const body = await jsonOf(await registry(`kind=${'x'.repeat(100)}`));
    expect(body.code).toBe('REGISTRY_KIND_UNKNOWN');
    expect(body.details[0].keyword).toBe('enum');
    expect(body.details[0].received).toHaveLength(64);
  });

  it('satu bentuk per kode: kind tak dikenal dan filter tak dikenal sama-sama larik isu berpointer', async () => {
    const a = await jsonOf(await registry('kind=nope'));
    const b = await jsonOf(await registry('kind=params&class=Z'));
    expect(a.code).toBe('REGISTRY_KIND_UNKNOWN');
    expect(b.code).toBe('REGISTRY_KIND_UNKNOWN');
    for (const body of [a, b]) {
      expect(Array.isArray(body.details)).toBe(true);
      for (const d of body.details) expect(typeof d.pointer === 'string' && typeof d.keyword === 'string' && typeof d.message === 'string').toBe(true);
    }
  });

  it('setiap contoh kueri di details sendiri sah (200)', async () => {
    const body = await jsonOf(await registry(''));
    for (const ex of body.details[0].examples as string[]) {
      const res = await registry(ex.split('?')[1]!);
      expect(res.status, ex).toBe(200);
    }
  });
});

describe('R2-F1 #3: contoh apa adanya tidak pernah menarget dokumen yang ada', () => {
  const bodies = (): Array<Record<string, any>> => [examples.record as any, ...CHAPTER_KEYS.map((k) => examples.chapters[k] as any)];
  const CUID_LIKE = /\bc[a-z0-9]{20,39}\b/;

  it('tanpa documentId/docNumber/refs; bab menarget misi + docKey yang sama dengan record; tidak ada string berbentuk cuid', () => {
    const recTarget = examples.record.target as any;
    expect(recTarget.mission?.folder).toBeTruthy();
    expect(recTarget.docKey).toBeTruthy();
    for (const b of bodies()) {
      expect(b.target.documentId).toBeUndefined();
      expect(b.target.docNumber).toBeUndefined();
      expect(b.target).toEqual(recTarget);
    }
    const all = JSON.stringify(examples);
    expect(all).not.toMatch(CUID_LIKE);
    expect(all).not.toContain(OTHER_DOC.id);
    expect(JSON.stringify(bodies())).not.toContain('"documentId"');
  });

  it('record apa adanya (amplop studio.slot/v2, dry-run R08) -> valid, MEMBUAT dokumen baru (created true, documentId null)', async () => {
    const out = await validateV2Submission('studio.slot/v2', clone(examples.record), undefined, ADMIN, false, '', CTX);
    expect(out.issues).toEqual([]);
    expect(out.valid).toBe(true);
    expect(out.submitPreview).toMatchObject({ created: true, documentId: null });
  });

  it.each(CHAPTER_KEYS)('bab %s apa adanya tanpa record (amplop studio.chapter/v2) -> DITOLAK META_REQUIRED_FOR_CREATE, tidak pernah created:false', async (k) => {
    const out = await dryRunDraftBlock(clone(examples.chapters[k]) as any, ADMIN, CTX);
    expect(out.valid).toBe(false);
    expect(JSON.stringify(out.issues)).toContain('META_REQUIRED_FOR_CREATE');
    expect((out.submitPreview as any)?.created).not.toBe(false);
    expect(JSON.stringify(out)).not.toContain(OTHER_DOC.id);
  });

  it('simulasi berurutan draf record + bab 1..5 apa adanya (layanan R23/draft-check) -> 6 blok valid, semuanya membuat dokumen baru', async () => {
    const fence = (v: unknown) => '```json\n' + JSON.stringify(v, null, 2) + '\n```';
    const md = ['# DRAF Laporan kerja PSIKOTES-1008', 'tujuan: uji contoh registri', 'langkah-berikut: tidak ada', 'basis: baru', '', ...bodies().map((b) => fence(b) + '\n')].join('\n');
    const prepared = prepareDraftCheck(md);
    const result = await completeDraftCheck(md, prepared, {
      currentRevisionNo: async () => null,
      dryRun: (input) => dryRunDraftBlock(input.value, ADMIN, CTX),
    });
    expect(result.blocks).toHaveLength(1 + CHAPTER_KEYS.length);
    for (const b of result.blocks) {
      expect(b.issues, `blok ${b.index}`).toEqual([]);
      expect(b.valid, `blok ${b.index}`).toBe(true);
      expect((b.submitPreview as any)?.created, `blok ${b.index}`).toBe(true);
      expect((b.submitPreview as any)?.documentId ?? null, `blok ${b.index}`).toBeNull();
    }
    expect(result.valid).toBe(true);
    expect(JSON.stringify(result)).not.toContain(OTHER_DOC.id);
    // Pencarian dokumen hanya per misi + docKey contoh; tidak pernah per id dokumen lain.
    const wheres = callsOf('studioDocument', 'findUnique').map((c: any[]) => c[0]?.where);
    expect(wheres.length).toBeGreaterThan(0);
    expect(wheres.some((w: any) => w?.id === OTHER_DOC.id)).toBe(false);
    const recTarget = examples.record.target as any;
    expect(wheres.filter((w: any) => w?.missionFolder_missionDocKey)).toContainEqual({ missionFolder_missionDocKey: { missionFolder: recTarget.mission.folder, missionDocKey: recTarget.docKey } });
  });

  it('kontrol negatif: bab bertarget documentId dokumen yang ada (bentuk lama) MENJANGKAU dokumen itu di DB tiruan', async () => {
    const old = { ...clone(examples.chapters['1']!), target: { documentId: OTHER_DOC.id } } as any;
    await dryRunDraftBlock(old, ADMIN, CTX).catch(() => undefined);
    expect(callsOf('studioDocument', 'findUnique').some((c: any[]) => c[0]?.where?.id === OTHER_DOC.id)).toBe(true);
  });
});
