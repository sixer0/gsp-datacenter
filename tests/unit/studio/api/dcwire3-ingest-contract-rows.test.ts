/* eslint-disable @typescript-eslint/no-explicit-any -- uji: argumen Prisma tiruan dinamis */
// DC-WIRE3 (D-390, D-383; register 05 §7.6): simpan ingest `studio.doc/v1` teradaptasi
// (repository.ts `persistAdaptedV1`, jalur R04 create) memanggil `writeContractRows` di
// transaksi yang sama untuk dokumen bertemplat ber-contractKind dan mengisi cermin MX09
// `StudioDocument`; non-kontrak tanpa kueri baru. Prisma DI-MOCK. Kerangka kontrak SL-08..SL-10
// diberikan lewat `opts.skeleton` dengan templat DB tiruan ber-contractKind (MX08), sehingga
// `PreparedV2.contractKind` diisi pipeline sungguhan. Adaptor v1 tidak pernah mengisi
// `sections.record`, jadi lewat v1 slot record selalu kosong; isi M19-M21 untuk record terisi
// diuji DC-09 (`writeContractRows`) dan asap DB transaksi-ROLLBACK laporan DC-WIRE3.
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { callsOf, dbCalls, on, resetDb } from './_prisma';
import { canonicalTemplate, captureServiceLogs, installStructureWrites, installTemplates, studioDoc, T_FIXED } from './_studio';
import { CONTENT_BLOCK_TYPES, type TemplateSlotDef } from '@/lib/studio/contract';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { ingestDocument } from '@/lib/studio/services/ingest';
import { skeletonInput } from '../structure/_kit';

const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'tester' } as StudioCaller;
/** Akses DB khas tulis kontrak (writeContractRows / cermin MX09). */
const CONTRACT_DB = /^(studioContractRecord|studioContractItem|studioContractRef|studioDocSection\.findFirst|studioDocument\.update)/;

/** Register 05 §6.3 SL-08..SL-10 (CK-01). */
function reportSlots(): TemplateSlotDef[] {
  return [
    { slotKey: 'record', sectionType: 'contractRecord', label: 'Catatan Laporan', position: 1, required: true, positionLocked: true, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
    { slotKey: 'content', sectionType: 'chapter', label: 'Isi Laporan', position: 2, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: 'INPUT', tiers: [], admits: [...CONTENT_BLOCK_TYPES], essentials: {} },
    { slotKey: 'references', sectionType: 'sourceRegister', label: 'Referensi', position: 3, required: false, positionLocked: false, repeatable: false, contentMode: 'INPUT', tiers: [], admits: [], essentials: {} },
  ] as TemplateSlotDef[];
}

function installPersist(): void {
  on('studioDocument', 'findMany', async () => []);
  on('studioDocument', 'findUnique', async () => null);
  on('studioDocument', 'create', async ({ data }: any) => ({ id: 'doc-new', archived: false, createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  on('studioDocument', 'update', async ({ where, data }: any) => ({ id: where.id, docNumber: 'X', archived: false, createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  on('studioTemplateSlot', 'findMany', async () => []);
  installStructureWrites();
  on('studioBlock', 'findMany', async () => []);
}

/** Dokumen v1 tanpa halaman depan (kerangka laporan tidak memuat cover/controlSheet). */
function v1Doc(): Record<string, unknown> {
  const base = studioDoc() as Record<string, any>;
  const ch = base.chapters[0];
  const { front: _front, ...rest } = base;
  void _front;
  return { ...rest, chapters: ['1', '2'].map((k) => ({ ...structuredClone(ch), key: k, title: { text: `Bab ${k}` } })) };
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  installPersist();
});

describe('DC-WIRE3 persistAdaptedV1 non-kontrak', () => {
  it('perilaku identik: tanpa update dokumen, nol kueri kontrak/MX08/MX09', async () => {
    installTemplates(canonicalTemplate());
    const r = await ingestDocument({ agentId: 'gsp-analis', document: studioDoc() } as any, ADMIN, { dryRun: false });
    expect(r.document?.id).toBe('doc-new');
    expect(dbCalls().filter((c) => CONTRACT_DB.test(c))).toEqual([]);
    const mx08 = [...callsOf('studioTemplateVersion', 'findUnique'), ...callsOf('studioTemplate', 'findUnique')].filter((c: any[]) => JSON.stringify(c[0]?.select ?? {}).includes('contractKind'));
    expect(mx08).toHaveLength(0);
    expect(callsOf('studioDocument', 'create')).toHaveLength(1);
    const created = (callsOf('studioDocument', 'create')[0][0] as any).data;
    expect(Object.keys(created).filter((k) => k.startsWith('contract'))).toEqual([]);
  });
});

describe('DC-WIRE3 persistAdaptedV1 dokumen kontrak (CK-01)', () => {
  it('record kosong (v1): writeContractRows di tx -> tanpa M19, cermin MX09 contractKind saja, sesudah baris revisi', async () => {
    const tpl = canonicalTemplate();
    tpl.template.contractKind = 'agentWorkReport';
    installTemplates(tpl);
    const r = await ingestDocument({ agentId: 'gsp-analis', document: v1Doc() } as any, ADMIN, { dryRun: false, skeleton: skeletonInput(reportSlots()) });
    expect(r.valid).toBe(true);
    expect(r.document?.id).toBe('doc-new');

    expect(callsOf('studioContractRecord', 'create')).toHaveLength(0);
    const upd = callsOf('studioDocument', 'update');
    expect(upd).toHaveLength(1);
    expect(upd[0][0]).toEqual({
      where: { id: 'doc-new' },
      data: { contractKind: 'agentWorkReport', contractStatus: null, contractOwner: null, contractTaskRef: null, contractDueOn: null, contractCardIds: [] },
    });
    // Urutan dalam satu $transaction: baris revisi (M14) lalu cermin MX09.
    const calls = dbCalls();
    const tx = calls.indexOf('$transaction');
    const lastSection = Math.max(...calls.map((c, i) => (c.startsWith('studioDocSection.') ? i : -1)));
    const mirror = calls.indexOf('studioDocument.update');
    expect(tx).toBeGreaterThan(-1);
    expect(lastSection).toBeGreaterThan(tx);
    expect(mirror).toBeGreaterThan(lastSection);
    // Kelengkapan kontrak tetap (DC-WIRE2): record wajib hilang.
    expect(r.completeness?.missingRequired ?? []).toContain('record');
  });
});
