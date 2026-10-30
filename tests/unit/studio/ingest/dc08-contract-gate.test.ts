/* eslint-disable @typescript-eslint/no-explicit-any -- fixture kiriman dibaca/diubah bebas-bentuk di uji */
// DC-08: validasi kontrak di gerbang tunggal by-construction (register 05 §5.6 urutan
// 6b -> 9a -> 9, §13.1 EC25-EC28, §17.1 NV-01/05/10/11/12, BA-08 contoh CK-01; D-374
// pointer EC28; D-376 contractKind MX08). Sumber ekspektasi = register 05, bukan keluaran
// kode yang diuji. Prisma DI-MOCK (tanpa DB; reader I55 hanya findMany baca).
import '../api/_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('../api/_prisma')).prismaModule());

import { callsOf, dbWrites, on, resetDb } from '../api/_prisma';
import { CONTENT_BLOCK_TYPES, type NormDocSnapshotV2, type ResolvedTemplate, type StudioDocV2Resolved, type StudioTier, type TemplateSlotDef } from '@/lib/studio/contract';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { CHART_CUSTOM_FORM_IDS } from '@/lib/studio/registry/charts';
import { composeV2, emptyResolvedDoc, mergeSubmission, seededPidAllocator, type SkeletonInput } from '@/lib/studio/services/compose';
import type { ContractRefReader } from '@/lib/studio/services/contracts';
import { ingestDocument } from '@/lib/studio/services/ingest';
import {
  assertByConstruction,
  assertByConstructionAsync,
  checkContractSource,
  contractCheckError,
  contractRecordTargets,
  evaluateByConstruction,
  withChartCustomPointer,
} from '@/lib/studio/services/ingest/by-construction';
import { defaultParams, e1, merge as mergeDatum, metaOf, skeletonInput } from '../structure/_kit';

const SLUG = 'laporan-kerja-agen';
const TIER: StudioTier = 'NOTA';
const DOC_ID = 'cmvui0qun000qv11gtygb1mk9';
const PID = 'p-8rj0w4aw6r';
const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', username: 'adm', canWriteClassK: true };

/** Register 05 §6.3 SL-08..SL-10 (CK-01). */
function reportSlots(): TemplateSlotDef[] {
  return [
    { slotKey: 'record', sectionType: 'contractRecord', label: 'Catatan Laporan', position: 1, required: true, positionLocked: true, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
    { slotKey: 'content', sectionType: 'chapter', label: 'Isi Laporan', position: 2, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: 'INPUT', tiers: [], admits: [...CONTENT_BLOCK_TYPES], essentials: {} },
    { slotKey: 'references', sectionType: 'sourceRegister', label: 'Referensi', position: 3, required: false, positionLocked: false, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
  ];
}

/** Payload register 05 §5.8 contoh 1. */
function payload(): Record<string, any> {
  return {
    type: 'contractRecord',
    status: 'complete',
    owner: 'data-analyst',
    initiator: 'controller',
    taskRef: 'DC-02',
    reportedAt: '2026-10-30T19:30+07:00',
    phase: { from: 'research', to: 'masterplan' },
    cardIds: ['t_249c6b84'],
    refs: [{ documentId: DOC_ID, pid: PID, rel: 'basis' }],
    evidence: [
      { kind: 'file', ref: 'docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md', bytes: 61234, sha256: '55d324b1' },
      { kind: 'command', ref: 'npx tsc --noEmit -p tsconfig.json', exitCode: 0 },
    ],
    items: [
      { key: 't_5943d415', title: { text: 'Kunci kosakata status dari korpus' }, status: 'done', owner: 'data-analyst', phase: 'masterplan' },
      { key: 'DC-03', title: { text: 'Protokol metrik efisiensi' }, status: 'ready', dependsOn: ['DC-02'] },
    ],
  };
}

const chapter = (blocks: unknown[] = [{ type: 'paragraph', text: 'Register 05 ditulis; empat kode galat baru.' }]) => ({
  key: '1',
  title: { text: 'Ringkasan' },
  sections: [{ title: { text: 'Hasil' }, blocks }],
});

function tplOf(): ResolvedTemplate {
  return { templateId: 'tpl-lka', versionId: 'tv-lka-1', versionNo: 1, params: defaultParams(), roleFormats: {} as never, sectionPlan: {} as never, assets: {} };
}

/** Snapshot norm/v2 dokumen kontrak hasil gabung (slot record + bab 1). */
function contractSnapshot(slug = SLUG, slots = reportSlots()): { snapshot: NormDocSnapshotV2; skeleton: SkeletonInput } {
  const skeleton = skeletonInput(slots);
  const empty: StudioDocV2Resolved = emptyResolvedDoc({ template: { slug, version: 1 }, meta: { ...metaOf({ title: 'Laporan kerja DC-02' }), tier: TIER } });
  const doc = mergeSubmission(empty, { $schema: 'studio.doc/v2', template: { slug }, meta: { title: 'Laporan kerja DC-02' }, sections: { record: payload(), content: { type: 'chapter', chapters: [chapter()] } } } as never, {
    skeleton,
    tier: TIER,
    pids: seededPidAllocator('dc08'),
  }).doc;
  return { snapshot: composeV2({ source: doc, skeleton, tier: TIER, params: defaultParams() }).snapshot as NormDocSnapshotV2, skeleton };
}

/** Ubah payload record di sumber snapshot (gerbang membaca `source.sections`). */
function withRecord(snapshot: NormDocSnapshotV2, edit: (p: Record<string, any>) => void): NormDocSnapshotV2 {
  const s = structuredClone(snapshot);
  edit((s.source.sections as any).record);
  return s;
}

const gateInput = (snapshot: NormDocSnapshotV2) => ({ snapshot, tpl: tplOf(), tier: TIER, complete: false, correlationId: 'dc08-test' });

function catchSync(fn: () => unknown): StudioEngineError {
  try {
    fn();
  } catch (e) {
    if (e instanceof StudioEngineError) return e;
    throw e;
  }
  throw new Error('tidak melempar');
}

async function catchAsync(fn: () => Promise<unknown>): Promise<StudioEngineError> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof StudioEngineError) return e;
    throw e;
  }
  throw new Error('tidak melempar');
}

/** Reader I55 tiruan: dokumen DOC_ID revisi 3, pid PID ada (opsional pensiun). */
function reader(opts: { docs?: boolean; pid?: 'present' | 'retired' | 'absent' } = {}): ContractRefReader & { calls: string[] } {
  const calls: string[] = [];
  const doc = { id: DOC_ID, docNumber: '001/GSP/KT/X/2026', currentRevisionNo: 3 };
  return {
    calls,
    async documentsByIds(ids) {
      calls.push('documentsByIds');
      return opts.docs === false ? [] : ids.includes(DOC_ID) ? [doc] : [];
    },
    async documentsByNumbers() {
      calls.push('documentsByNumbers');
      return [];
    },
    async identities(keys) {
      calls.push('identities');
      const mode = opts.pid ?? 'present';
      if (mode === 'absent') return [];
      return keys.map((k) => ({ documentId: k.documentId, pid: k.pid, retiredRevisionNo: mode === 'retired' ? 2 : null }));
    },
  };
}

// ── Gerbang murni (6b) ──────────────────────────────────────────────────

describe('DC-08 gerbang 6b: I54 atas slot record dokumen ber-contractKind', () => {
  const { snapshot } = contractSnapshot();

  it('contoh §5.8 sah: satu target (record, agentWorkReport), tanpa isu/galat kontrak', () => {
    const r = evaluateByConstruction(gateInput(snapshot));
    expect(r.contract.targets.map((t) => [t.slotKey, t.kind, t.pointer])).toEqual([['record', 'agentWorkReport', '/sections/record']]);
    expect(r.contract.issues).toEqual([]);
    expect(r.contract.error).toBeUndefined();
  });

  it('NV-01 status di luar set jenis -> 400 SCHEMA_INVALID, checkId CONTRACT_ENUM, pointer /sections/record/status', () => {
    const s = withRecord(snapshot, (p) => (p.status = 'running'));
    expect(evaluateByConstruction(gateInput(s)).contract.issues).toEqual([
      expect.objectContaining({ pointer: '/sections/record/status', checkId: 'CONTRACT_ENUM', keyword: 'CONTRACT_ENUM' }),
    ]);
    const err = catchSync(() => assertByConstruction(gateInput(s)));
    expect([err.code, err.httpStatus]).toEqual(['SCHEMA_INVALID', 400]);
    expect(err.details).toEqual([expect.objectContaining({ pointer: '/sections/record/status', checkId: 'CONTRACT_ENUM' })]);
  });

  it('NV-05 tanggal kalender tidak ada (lolos pola skema) -> CONTRACT_DATE /sections/record/reportedAt', () => {
    const s = withRecord(snapshot, (p) => (p.reportedAt = '2026-02-30'));
    const err = catchSync(() => assertByConstruction(gateInput(s)));
    expect(err.code).toBe('SCHEMA_INVALID');
    expect(err.details).toEqual([expect.objectContaining({ pointer: '/sections/record/reportedAt', checkId: 'CONTRACT_DATE' })]);
  });

  it('NV-10 kunci butir ganda -> 422 EC27 CONTRACT_ITEM_KEY_DUPLICATE, details register (positions 1-based)', () => {
    const s = withRecord(snapshot, (p) => (p.items[1].key = 't_5943d415'));
    const err = catchSync(() => assertByConstruction(gateInput(s)));
    expect([err.code, err.httpStatus]).toEqual(['CONTRACT_ITEM_KEY_DUPLICATE', 422]);
    expect(err.details).toEqual({ pointer: '/sections/record/items/1/key', key: 't_5943d415', positions: [1, 2] });
  });

  it('isu CH didahulukan atas EC27 (langkah 2/6b): hanya 400', () => {
    const s = withRecord(snapshot, (p) => {
      p.status = 'running';
      p.items[1].key = 't_5943d415';
    });
    expect(catchSync(() => assertByConstruction(gateInput(s))).code).toBe('SCHEMA_INVALID');
  });

  it('contractPointer pemanggil (kiriman slot): pointer relatif badan /payload/...', () => {
    const s = withRecord(snapshot, (p) => (p.status = 'running'));
    const r = evaluateByConstruction({ ...gateInput(s), contractPointer: () => '/payload' });
    expect(r.contract.issues[0].pointer).toBe('/payload/status');
  });

  it('contractKind eksplisit tak terdaftar -> tanpa target (compose yang menolak, gerbang tidak menebak)', () => {
    expect(contractRecordTargets(snapshot, { contractKind: 'bukanJenis' })).toEqual([]);
    expect(contractRecordTargets(snapshot, { contractKind: 'agentWorkReport' })).toHaveLength(1);
  });
});

describe('DC-08 langkah 6b sebelum compose: checkContractSource', () => {
  const slots = reportSlots();

  it('kiriman v2 dengan tanggal kalender tidak ada -> isu CONTRACT_DATE berpointer badan (compose belum jalan)', () => {
    const p = payload();
    p.reportedAt = '2026-02-30';
    const r = checkContractSource({ template: { slug: SLUG }, sections: { record: p } }, slots, { contractPointer: (k) => `/document/sections/${k}` });
    expect(contractCheckError(r)?.code).toBe('SCHEMA_INVALID');
    expect(r.issues).toEqual([expect.objectContaining({ pointer: '/document/sections/record/reportedAt', checkId: 'CONTRACT_DATE' })]);
  });

  it('templat bukan kontrak / kerangka tanpa slot contractRecord -> hasil kosong', () => {
    const bad = { ...payload(), status: 'running' };
    expect(checkContractSource({ template: { slug: 'datum-gsp' }, sections: { record: bad } }, slots).targets).toEqual([]);
    expect(checkContractSource({ template: { slug: SLUG }, sections: { record: bad } }, slots.filter((s) => s.slotKey !== 'record')).targets).toEqual([]);
  });
});

// ── Gerbang async (9a) ──────────────────────────────────────────────────

describe('DC-08 gerbang 9a: I55 lewat reader baca-saja pemanggil', () => {
  const { snapshot } = contractSnapshot();

  it('rujukan sah -> resolved posisi 1, tanpa peringatan', async () => {
    const r = await assertByConstructionAsync({ ...gateInput(snapshot), contractRefs: reader() });
    expect(r.contract.refs).toEqual([{ slotKey: 'record', resolved: [{ position: 1, targetDocumentId: DOC_ID, targetPid: PID, targetRevisionNo: null, rel: 'basis' }] }]);
    expect(r.contract.warnings).toEqual([]);
  });

  it('NV-12 pid tak pernah ada -> 422 EC26 CONTRACT_REF_PID_NOT_FOUND, details register', async () => {
    const err = await catchAsync(() => assertByConstructionAsync({ ...gateInput(snapshot), contractRefs: reader({ pid: 'absent' }) }));
    expect([err.code, err.httpStatus]).toEqual(['CONTRACT_REF_PID_NOT_FOUND', 422]);
    expect(err.details).toEqual({ pointer: '/sections/record/refs/0/pid', documentId: DOC_ID, pid: PID });
  });

  it('NV-11 dokumen tidak ada -> 422 EC25 CONTRACT_REF_NOT_FOUND reason DOCUMENT', async () => {
    const err = await catchAsync(() => assertByConstructionAsync({ ...gateInput(snapshot), contractRefs: reader({ docs: false }) }));
    expect([err.code, err.httpStatus]).toEqual(['CONTRACT_REF_NOT_FOUND', 422]);
    expect(err.details).toEqual({ pointer: '/sections/record/refs/0', documentId: DOC_ID, reason: 'DOCUMENT' });
  });

  it('pid pensiun -> diterima dengan peringatan CW-01 CONTRACT_REF_PID_RETIRED', async () => {
    const r = await assertByConstructionAsync({ ...gateInput(snapshot), contractRefs: reader({ pid: 'retired' }) });
    expect(r.contract.warnings.map((w) => [w.code, w.pointer])).toEqual([['CONTRACT_REF_PID_RETIRED', '/sections/record/refs/0/pid']]);
  });

  it('urutan §5.6: isu I54 menahan sebelum I55 (reader tidak dipanggil)', async () => {
    const rd = reader({ pid: 'absent' });
    const s = withRecord(snapshot, (p) => (p.status = 'running'));
    expect((await catchAsync(() => assertByConstructionAsync({ ...gateInput(s), contractRefs: rd }))).code).toBe('SCHEMA_INVALID');
    expect(rd.calls).toEqual([]);
  });
});

// ── Dokumen non-kontrak: nol perubahan ─────────────────────────────────

describe('DC-08 dokumen non-kontrak: nol isu baru, nol kueri, perilaku sama', () => {
  const datum = mergeDatum(e1(), undefined, { seed: 'dc08-e1' }).doc;
  const snap = composeV2({ source: datum, skeleton: skeletonInput(), tier: 'TERBIT', params: defaultParams() }).snapshot as NormDocSnapshotV2;
  const input = { snapshot: snap, tpl: tplOf(), tier: 'TERBIT' as StudioTier, complete: false, correlationId: 'dc08-e1' };

  it('E1 DATUM: contract kosong; async+reader = sync (reader tidak dipanggil)', async () => {
    const sync = evaluateByConstruction(input);
    expect(sync.contract).toEqual({ targets: [], issues: [], refs: [], warnings: [] });
    const rd = reader();
    let asyncResult: unknown;
    let asyncErr: unknown;
    try {
      asyncResult = await assertByConstructionAsync({ ...input, contractRefs: rd });
    } catch (e) {
      asyncErr = e;
    }
    let syncErr: unknown;
    try {
      assertByConstruction(input);
    } catch (e) {
      syncErr = e;
    }
    expect(rd.calls).toEqual([]);
    expect((asyncErr as StudioEngineError | undefined)?.code).toBe((syncErr as StudioEngineError | undefined)?.code);
    if (asyncResult) expect((asyncResult as { blocking: unknown }).blocking).toEqual(sync.blocking);
  });

  it('templat kontrak tanpa slot record terisi / slug bukan C58 -> tanpa target', () => {
    const { snapshot } = contractSnapshot();
    expect(contractRecordTargets(withRecord(snapshot, (p) => (p.type = 'paragraph')))).toEqual([]);
    const other = structuredClone(snapshot);
    other.source.template.slug = 'datum-gsp';
    expect(contractRecordTargets(other)).toEqual([]);
  });
});

// ── EC28 pointer (D-374) ────────────────────────────────────────────────

describe('DC-08 EC28 CHART_CUSTOM_FORM_UNSUPPORTED: pointer dari sumber kiriman', () => {
  const form = { mark: 'point' };
  const source = {
    sections: {
      content: {
        chapters: [
          chapter([
            { type: 'paragraph', text: 'a' },
            { type: 'chart', code: 'custom', form: { mark: 'bar' }, data: { shape: 'categorical', rows: [] } },
            { type: 'chart', code: 'custom', form, data: { shape: 'categorical', rows: [] } },
          ]),
        ],
      },
    },
  };
  const ec28 = () => new StudioEngineError('CHART_CUSTOM_FORM_UNSUPPORTED', 'x', { form, dataShape: 'categorical', supported: [...CHART_CUSTOM_FORM_IDS] });

  it('blok yang cocok form x dataShape mendapat pointer; details register utuh', () => {
    const e = withChartCustomPointer(ec28(), source, '/document/sections') as StudioEngineError;
    expect([e.code, e.httpStatus]).toEqual(['CHART_CUSTOM_FORM_UNSUPPORTED', 422]);
    expect(e.details).toEqual({ pointer: '/document/sections/content/chapters/0/sections/0/blocks/2', form, dataShape: 'categorical', supported: [...CHART_CUSTOM_FORM_IDS] });
  });

  it('galat lain dan galat yang sudah berpointer dikembalikan apa adanya', () => {
    const other = new StudioEngineError('BY_CONSTRUCTION_FAILED', 'y', []);
    expect(withChartCustomPointer(other, source)).toBe(other);
    const has = new StudioEngineError('CHART_CUSTOM_FORM_UNSUPPORTED', 'z', { pointer: '/p', form, dataShape: 'categorical' });
    expect(withChartCustomPointer(has, source)).toBe(has);
  });
});

// ── R08 dry-run (layanan ingestDocument, jalur validateDocument) ───────

describe('DC-08 asap R08 dry-run: laporan kerja ber-isu memberi issue berkode register', () => {
  const skeleton = skeletonInput(reportSlots());
  const docOf = (edit?: (p: Record<string, any>) => void): Record<string, unknown> => {
    const p = payload();
    edit?.(p);
    return { $schema: 'studio.doc/v2', template: { slug: SLUG }, meta: { title: 'Laporan kerja DC-02 register document contract', tier: TIER }, sections: { record: p, content: { type: 'chapter', chapters: [chapter()] } } };
  };
  const dry = (doc: Record<string, unknown>) => ingestDocument({ document: doc } as any, ADMIN, { dryRun: true, template: tplOf(), skeleton });

  beforeEach(() => {
    resetDb();
    on('studioDocument', 'findMany', async ({ where }: any) => (where?.id?.in ?? []).includes(DOC_ID) ? [{ id: DOC_ID, docNumber: '001/GSP/KT/X/2026', currentRevisionNo: 3 }] : []);
    on('studioDocIdentity', 'findMany', async () => []);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('status di luar set -> valid:false, checkId CONTRACT_ENUM pointer /document/sections/record/status, tanpa tulis DB', async () => {
    const r = await dry(docOf((p) => (p.status = 'running')));
    expect(r.valid).toBe(false);
    expect(r.issues).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/document/sections/record/status', checkId: 'CONTRACT_ENUM' })]));
    expect(dbWrites()).toEqual([]);
  });

  it('tanggal kalender tidak ada (lolos skema, ditahan gerbang 6b) -> CONTRACT_DATE', async () => {
    const r = await dry(docOf((p) => (p.reportedAt = '2026-02-30')));
    expect(r.valid).toBe(false);
    expect(r.issues).toEqual([expect.objectContaining({ pointer: '/document/sections/record/reportedAt', checkId: 'CONTRACT_DATE' })]);
  });

  it('rujukan ke pid tak ada -> valid:false, issue CONTRACT_REF_PID_NOT_FOUND + details, hanya kueri baca', async () => {
    const r = await dry(docOf());
    expect(r.valid).toBe(false);
    expect(r.issues).toEqual([
      expect.objectContaining({
        pointer: '/document/sections/record/refs/0/pid',
        checkId: 'CONTRACT_REF_PID_NOT_FOUND',
        keyword: 'CONTRACT_REF_PID_NOT_FOUND',
        details: { pointer: '/document/sections/record/refs/0/pid', documentId: DOC_ID, pid: PID },
      }),
    ]);
    expect(callsOf('studioDocIdentity', 'findMany')).toHaveLength(1);
    expect(dbWrites()).toEqual([]);
  });

  it('dokumen rujukan tidak ada -> issue CONTRACT_REF_NOT_FOUND reason DOCUMENT', async () => {
    const r = await dry(docOf((p) => (p.refs[0].documentId = 'cmzzzzzzzzzzzzzzzzzzzzzzz')));
    expect(r.issues).toEqual([expect.objectContaining({ checkId: 'CONTRACT_REF_NOT_FOUND', details: expect.objectContaining({ reason: 'DOCUMENT' }) })]);
  });

  it('pid ada -> lolos langkah kontrak (tanpa issue kontrak); pid pensiun -> contractWarnings CW-01', async () => {
    on('studioDocIdentity', 'findMany', async () => [{ documentId: DOC_ID, pid: PID, retiredRevisionNo: 2 }]);
    const r = await dry(docOf());
    expect((r.issues ?? []).filter((i) => String(i.checkId ?? '').startsWith('CONTRACT_'))).toEqual([]);
    expect(r.contractWarnings?.map((w) => w.code)).toEqual(['CONTRACT_REF_PID_RETIRED']);
  });

  it('bukan dryRun: EC26 dilempar dengan details register (bukan daftar isu)', async () => {
    const err = await catchAsync(() => ingestDocument({ document: docOf() } as any, ADMIN, { dryRun: false, template: tplOf(), skeleton }));
    expect([err.code, err.httpStatus]).toEqual(['CONTRACT_REF_PID_NOT_FOUND', 422]);
    expect(err.details).toEqual({ pointer: '/document/sections/record/refs/0/pid', documentId: DOC_ID, pid: PID });
  });
});
