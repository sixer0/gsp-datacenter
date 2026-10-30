/* eslint-disable @typescript-eslint/no-explicit-any -- uji: argumen Prisma tiruan dinamis */
// DC-WIRE2 (D-389, register 05 §6.5): simpan ingest `studio.doc/v1` teradaptasi
// (repository.ts `persistAdaptedV1`) menghitung kelengkapan DENGAN contractKind yang sudah
// dibaca pipeline (PreparedV2.contractKind). Uji ini: non-kontrak -> masukan kelengkapan identik
// dengan sebelumnya (tanpa kunci contractKind) dan nol kueri baru. Prisma DI-MOCK. Jalur kontrak
// (templat laporan-kerja-agen MX08) dibuktikan asap DB transaksi-ROLLBACK (laporan DC-WIRE2).
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/completeness', async (orig) => {
  const m = await orig<typeof import('@/lib/studio/services/completeness')>();
  return { ...m, computeCompleteness: vi.fn(m.computeCompleteness) };
});
import { callsOf, on, resetDb } from './_prisma';
import { canonicalTemplate, captureServiceLogs, installStructureWrites, installTemplates, studioDoc, T_FIXED } from './_studio';
import { computeCompleteness } from '@/lib/studio/services/completeness';
import { ingestDocument } from '@/lib/studio/services/ingest';
import type { StudioCaller } from '@/lib/studio/contract/auth';

const ADMIN: StudioCaller = { kind: 'ADMIN_SESSION', requester: 'tester' } as StudioCaller;

function installPersist(): void {
  on('studioDocument', 'findMany', async () => []);
  on('studioDocument', 'findUnique', async () => null);
  on('studioDocument', 'create', async ({ data }: any) => ({ id: 'doc-new', archived: false, createdAt: T_FIXED, updatedAt: T_FIXED, ...data }));
  installStructureWrites();
  on('studioBlock', 'findMany', async () => []);
}

/** Dokumen v1 dengan bab berkunci (kunci v1 dipertahankan adaptor sebagai kunci bab). */
function docWithChapters(keys: string[]): Record<string, unknown> {
  const base = studioDoc();
  const ch = (base.chapters as any[])[0];
  return { ...base, chapters: keys.map((k) => ({ ...structuredClone(ch), key: k, title: { text: `Bab ${k}` } })) };
}

/** Panggilan computeCompleteness fase simpan: pre (docId "") + final (docId dokumen baru). */
function persistCalls(): any[] {
  const calls = vi.mocked(computeCompleteness).mock.calls.map((c) => c[0] as any);
  const finalIdx = calls.findIndex((c) => c.doc?.docId === 'doc-new');
  expect(finalIdx).toBeGreaterThan(0);
  return [calls[finalIdx - 1], calls[finalIdx]];
}

beforeEach(() => {
  resetDb();
  captureServiceLogs();
  vi.mocked(computeCompleteness).mockClear();
  installTemplates(canonicalTemplate());
  installPersist();
});

describe('DC-WIRE2 persistAdaptedV1 non-kontrak tidak berubah', () => {
  it('non-kontrak: masukan kelengkapan simpan = bentuk lama (tanpa contractKind), nol kueri contractKind', async () => {
    const r = await ingestDocument({ agentId: 'gsp-analis', document: docWithChapters(['1', '2', '3', '4']) } as any, ADMIN, { dryRun: false });
    expect(r.document?.id).toBe('doc-new');
    const [pre, fin] = persistCalls();
    expect(pre.doc.docId).toBe('');
    for (const c of [pre, fin]) expect(Object.keys(c).sort()).toEqual(['doc', 'revisionNo', 'slots']);
    // Templat di memori/kerangka tanpa contractRecord: templateContractKind tidak membaca DB.
    const ckReads = callsOf('studioTemplate', 'findUnique').filter((c: any[]) => c[0]?.select?.contractKind);
    expect(ckReads).toHaveLength(0);
    const rev = callsOf('studioRevision', 'create')[0][0] as any;
    const expected = vi.mocked(computeCompleteness).getMockImplementation()!(fin);
    expect(rev.data.completenessReport).toEqual(JSON.parse(JSON.stringify(expected)));
    // Non-kontrak: bab kontigu 1..4 = slot isi lengkap (tanpa CO 1..5; jalur kontrak diuji asap DB rollback).
    expect((rev.data.completenessReport.missingRequired ?? []).filter((k: string) => k.startsWith('content'))).toEqual([]);
  });
});
