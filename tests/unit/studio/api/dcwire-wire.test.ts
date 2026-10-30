/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// DC-WIRE (D-386, D-387; register 05 §6.5, AM-08, AM-09): R08 `submitPreviewOf` menyalin
// `result.warnings`; R05 meneruskan `slotKey` + `contractKind` (cermin MX09 dokumen) ke state
// cadangan slot dan memuat relasi pemilik berkas keluaran (`finalFileName`). Prisma DI-MOCK.
import './_env';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { callsOf, on, resetDb } from './_prisma';
import { jsonOf, params, req } from './_studio';
import { OUTPUT_FILE_OWNER_INCLUDE } from '@/lib/studio/services/storage';
import { submitPreviewOf } from '@/app/api/studio/validate/_shared/dry-run';
import { GET } from '@/app/api/studio/documents/[id]/route';

const NOW = new Date('2026-10-30T12:00:00.000Z');
const WARN = { code: 'CONTRACT_REF_PID_RETIRED', pointer: '/payload/refs/0/pid', message: 'pid pensiun', details: { pid: 'p-aaaaaaaaaa' } };

function dry(warnings?: unknown[]): any {
  return {
    result: {
      document: { id: 'doc1', docNumber: '001/GSP/LAP/X/2026' },
      created: false,
      unchanged: false,
      rebased: false,
      revision: { revisionNo: 3, changeScope: 'slot:record', changeAuto: true },
      completeness: {},
      slot: { slotKey: 'record', address: 'F:record' },
      ...(warnings ? { warnings } : {}),
    },
    lint: null,
    snapshot: null,
  };
}

describe('DC-WIRE R08 submitPreviewOf (AM-08)', () => {
  it('result.warnings -> submitPreview.warnings (salinan)', () => {
    const d = dry([WARN]);
    const p = submitPreviewOf(d);
    expect(p.warnings).toEqual([WARN]);
    expect(p.warnings).not.toBe(d.result.warnings);
  });
  it('tanpa peringatan: medan absen (bentuk respons lama)', () => {
    expect(submitPreviewOf(dry())).not.toHaveProperty('warnings');
    expect(submitPreviewOf(dry([]))).not.toHaveProperty('warnings');
  });
});

function docRow(contractKind: string | null): any {
  return {
    id: 'doc1', docNumber: '001/GSP/LAP/X/2026', numberSource: 'AUTO', title: 'LK', typeCode: 'LAP', language: 'id', classification: 'INTERNAL', tier: 'NOTA',
    templateId: 'tpl1', currentRevisionNo: 2, missionFolder: '2026-10-30_x', missionDocKey: 'lk', agentRequestId: null, hermesTaskId: null, createdBy: 'agent:x',
    archived: false, createdAt: NOW, updatedAt: NOW, completeness: 'INCOMPLETE', contractKind,
  };
}

const revRow: any = {
  id: 'rev2', documentId: 'doc1', revisionNo: 2, parentRevisionNo: 1, templateVersionId: 'tv1', docRev: 'B', snapshotSha256: 'a'.repeat(64), inputSha256: 'b'.repeat(64),
  changeWhat: 'w', changeWhy: 'y', changeImpact: 'i', changedAddresses: [], releaseStatus: 'DRAFT', createdBy: 'agent:x', createdAt: NOW,
  schemaId: 'studio.doc/v2', changeScope: 'chapter:2', completeness: 'INCOMPLETE', completenessReport: null, lintReport: null,
};

function install(contractKind: string | null) {
  on('studioDocument', 'findUnique', async () => docRow(contractKind));
  on('studioRevision', 'findUnique', async () => revRow);
  on('studioBlock', 'findMany', async () => []);
  on('studioOutputFile', 'findMany', async () => [
    {
      id: 'f1', documentId: 'doc1', revisionId: 'rev2', artifactId: null, renderJobId: null, format: 'HTML', role: 'PRIMARY', figureLabel: null, relPath: 'docs/x/rev-2/a.html',
      fileName: 'a.html', bytes: 10, sha256: '55d324b1' + 'a'.repeat(56), mime: 'text/html; charset=utf-8', lintVerdict: 'PASS', createdAt: new Date('2026-10-30T12:58:00.400Z'),
      scopeKind: 'DOCUMENT', scopeKey: null, draft: true,
      document: { docNumber: '001/GSP/LAP/X/2026', contractKind }, revision: { revisionNo: 2 },
    },
  ]);
  const content = { label: 'Isi Laporan', repeatable: true, required: true, contentMode: 'INPUT', minItems: 1 };
  on('studioDocSection', 'findMany', async () => [
    { id: 's1', slotKey: 'content', sectionTypeKey: 'chapter', filled: true, payload: { type: 'chapter' }, templateSlot: content, sectionType: { name: 'Bab' } },
  ]);
  on('studioDocChapter', 'findMany', async () => [
    { id: 'c1', docSectionId: 's1', chapterKey: '1', title: { text: 'Ringkasan' }, identity: { pid: 'p-c1aaaaaaaa' } },
    { id: 'c2', docSectionId: 's1', chapterKey: '2', title: { text: 'Rincian' }, identity: { pid: 'p-c2aaaaaaaa' } },
  ]);
  on('studioDocSubsection', 'findMany', async () => []);
  on('studioDocBlock', 'findMany', async () => []);
}

async function getDoc() {
  const res = await GET(await req('/api/studio/documents/doc1', { auth: 'agent' }), params({ id: 'doc1' }));
  return { status: res.status, body: await jsonOf(res) };
}

beforeEach(() => resetDb());

describe('DC-WIRE R05 (05 §6.5, AM-09)', () => {
  it('dokumen kontrak tanpa laporan kelengkapan: state cadangan content PARTIAL (bab CO 3..5 hilang)', async () => {
    install('agentWorkReport');
    const r = await getDoc();
    expect(r.status).toBe(200);
    expect(r.body.slots.find((s: any) => s.slotKey === 'content').state).toBe('PARTIAL');
  });

  it('dokumen non-kontrak: state cadangan content FILLED (tidak berubah)', async () => {
    install(null);
    const r = await getDoc();
    expect(r.body.slots.find((s: any) => s.slotKey === 'content').state).toBe('FILLED');
  });

  it('D-387: berkas keluaran dimuat dengan relasi pemilik -> outputs[].finalFileName terisi', async () => {
    install(null);
    const r = await getDoc();
    const args = callsOf('studioOutputFile', 'findMany')[0][0] as any;
    expect(args.include).toEqual(OUTPUT_FILE_OWNER_INCLUDE);
    expect(r.body.outputs).toHaveLength(1);
    expect(r.body.outputs[0].finalFileName).toBe('001-GSP-LAP-X-2026_rev2_20261030T125800Z_55d324b1.html');
    expect(r.body.outputs[0]).not.toHaveProperty('document');
  });
});
