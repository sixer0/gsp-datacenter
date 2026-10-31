/* eslint-disable @typescript-eslint/no-explicit-any -- uji: fixture kiriman dan argumen Prisma tiruan bebas-bentuk */
// FIX-QB / FIX-R40-2 (review DC-40 #2, KD-46, register 05 §5.6, §13.1 CW-01): peringatan kontrak
// non-penahan pada R08 cabang bentuk dokumen (`studio.doc/v2`) tidak lagi dibuang. Glue R08 nyata
// (`validate/_shared/dry-run.ts validateV2Submission`) + ingest nyata; templat/kerangka laporan
// kerja disuntik lewat opsi ingest (pola uji DC-08), Prisma DI-MOCK (tanpa DB).
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const inject = vi.hoisted(() => ({ opts: {} as Record<string, unknown>, dryWarnings: [] as unknown[], dryCalls: 0 }));

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/ingest', async (orig) => {
  const m = (await orig()) as typeof import('@/lib/studio/services/ingest');
  return { ...m, ingestDocument: (req: any, caller: any, opts: any) => m.ingestDocument(req, caller, { ...opts, ...inject.opts }) };
});
vi.mock('@/lib/studio/services/submit', async (orig) => {
  const m = (await orig()) as typeof import('@/lib/studio/services/submit');
  return {
    ...m,
    // Dokumen yang ada: rencana dry-run kiriman diganti hasil tetap ber-`warnings` (SubmitResultV2, AM-08).
    dryRunDocumentV2: async () => {
      inject.dryCalls += 1;
      return {
        lint: null,
        snapshot: undefined,
        result: { completeness: { status: 'INCOMPLETE', missing: [] }, warnings: inject.dryWarnings },
      } as any;
    },
  };
});

import { on, resetDb } from './_prisma';
import { CONTENT_BLOCK_TYPES, type ResolvedTemplate, type StudioTier, type TemplateSlotDef } from '@/lib/studio/contract';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { validateV2Submission } from '@/app/api/studio/validate/_shared/dry-run';
import { defaultParams, skeletonInput } from '../structure/_kit';

const SLUG = 'laporan-kerja-agen';
const TIER: StudioTier = 'NOTA';
const DOC_ID = 'cmvui0qun000qv11gtygb1mk9';
const PID = 'p-8rj0w4aw6r';
const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'user:adm', username: 'adm', canWriteClassK: true };
const CTX = { correlationId: 'fixqb-r08', method: 'POST', path: '/api/studio/validate' } as any;

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

/** Register 05 §5.8 contoh 1 dengan satu rujukan pid. */
function docOf(): Record<string, unknown> {
  const record = {
    type: 'contractRecord',
    status: 'complete',
    owner: 'data-analyst',
    initiator: 'controller',
    taskRef: 'DC-02',
    reportedAt: '2026-10-30T19:30+07:00',
    cardIds: ['t_249c6b84'],
    refs: [{ documentId: DOC_ID, pid: PID, rel: 'basis' }],
    items: [{ key: 't_5943d415', title: { text: 'Kunci kosakata status dari korpus' }, status: 'done' }],
  };
  const chapter = { key: '1', title: { text: 'Ringkasan' }, sections: [{ title: { text: 'Hasil' }, blocks: [{ type: 'paragraph', text: 'Register 05 ditulis; empat kode galat baru.' }] }] };
  return { $schema: 'studio.doc/v2', template: { slug: SLUG }, meta: { title: 'Laporan kerja DC-02 register document contract', tier: TIER }, sections: { record, content: { type: 'chapter', chapters: [chapter] } } };
}

const RETIRED = { code: 'CONTRACT_REF_PID_RETIRED', pointer: '/sections/record/refs/0/pid', message: 'pid rujukan sudah pensiun', details: { documentId: DOC_ID, pid: PID } };

beforeEach(() => {
  resetDb();
  inject.opts = { template: tplOf(), skeleton: skeletonInput(reportSlots()) };
  inject.dryWarnings = [];
  inject.dryCalls = 0;
  on('studioDocument', 'findMany', async ({ where }: any) => ((where?.id?.in ?? []).includes(DOC_ID) ? [{ id: DOC_ID, docNumber: '001/GSP/KT/X/2026', currentRevisionNo: 3 }] : []));
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('FIX-R40-2 R08 studio.doc/v2 dokumen baru: CW-01 sampai ke respons', () => {
  it('refs[].pid pensiun -> valid, warnings[0].code CONTRACT_REF_PID_RETIRED (pointer relatif badan)', async () => {
    on('studioDocIdentity', 'findMany', async () => [{ documentId: DOC_ID, pid: PID, retiredRevisionNo: 2 }]);
    const out = await validateV2Submission('studio.doc/v2', docOf(), undefined, ADMIN, false, '', CTX);
    expect(out.valid).toBe(true);
    expect(out.warnings?.[0]?.code).toBe('CONTRACT_REF_PID_RETIRED');
    expect(out.warnings?.map((w) => w.pointer)).toEqual(['/sections/record/refs/0/pid']);
  });

  it('bentuk skema (prefix /spec): pointer peringatan diberi prefiks seperti isu', async () => {
    on('studioDocIdentity', 'findMany', async () => [{ documentId: DOC_ID, pid: PID, retiredRevisionNo: 2 }]);
    const out = await validateV2Submission('studio.doc/v2', docOf(), undefined, ADMIN, false, '/spec', CTX);
    expect(out.warnings?.map((w) => [w.code, w.pointer])).toEqual([['CONTRACT_REF_PID_RETIRED', '/spec/sections/record/refs/0/pid']]);
  });

  it('pid hidup -> tanpa medan warnings (hanya bila tidak kosong)', async () => {
    on('studioDocIdentity', 'findMany', async () => [{ documentId: DOC_ID, pid: PID, retiredRevisionNo: null }]);
    const out = await validateV2Submission('studio.doc/v2', docOf(), undefined, ADMIN, false, '', CTX);
    expect(out.valid).toBe(true);
    expect('warnings' in out).toBe(false);
  });
});

describe('FIX-R40-2 R08 studio.doc/v2 dokumen yang ada: dry.result.warnings disalin', () => {
  function installExisting(): void {
    inject.opts = { template: tplOf(), submitTargeting: { target: { documentId: DOC_ID } } };
    on('studioDocument', 'findUnique', async () => ({ id: DOC_ID, currentRevisionNo: 3, tier: TIER }));
    on('studioRevision', 'findUnique', async () => ({ templateVersionId: 'tv-lka-1' }));
    on('studioTemplateVersion', 'findUnique', async () => ({ versionNo: 1, template: { slug: SLUG } }));
  }

  it('SubmitResultV2.warnings CW-01 -> respons R08 warnings', async () => {
    installExisting();
    inject.dryWarnings = [RETIRED];
    const out = await validateV2Submission('studio.doc/v2', docOf(), undefined, ADMIN, false, '', CTX);
    expect(inject.dryCalls).toBe(1);
    expect(out.valid).toBe(true);
    expect(out.warnings).toEqual([RETIRED]);
    expect(out.warnings?.[0]?.code).toBe('CONTRACT_REF_PID_RETIRED');
  });

  it('tanpa peringatan -> tanpa medan warnings', async () => {
    installExisting();
    const out = await validateV2Submission('studio.doc/v2', docOf(), undefined, ADMIN, false, '', CTX);
    expect(inject.dryCalls).toBe(1);
    expect('warnings' in out).toBe(false);
  });
});
