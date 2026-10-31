/* eslint-disable @typescript-eslint/no-explicit-any -- uji: baris DB dan badan respons dinamis */
// DC-36 — isu tepi review DC-40 #9 (D-399): R14 `templateVersion` ke versi templat tanpa slot
// `contractRecord` -> `skeletonContractKind` null -> tanpa M19 dan tanpa pembaruan MX09, sehingga
// kolom cermin (`contractStatus`, `contractCardIds`, ...) bisa tertinggal dari revisi terkini
// dan R21 mencantumkan status lama. Uji ini mereproduksi jalur itu lewat handler NYATA:
// R19 POST (ADMIN) membuat versi 2 `laporan-kerja-agen` tanpa slot record (CH-06 meloloskan
// kerangka tanpa contractRecord), lalu R14 PATCH `templateVersion` pada dokumen kontrak.
// Invarian yang diuji (register 05 §7.2 MX09 "cermin revisi terbaru", §7.6): sesudah setiap
// respons R14, MX09 = nilai M19 revisi terkini, atau null/[] bila revisi terkini tanpa M19.
// Semua kerja di SATU transaksi yang selalu di-ROLLBACK (versi templat tidak pernah ter-commit).
import './_env';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { RUN_ID } from './_env';
import { disconnectReal, openRollback, real, residue, tx, type RollbackWindow } from './_rb';
import { call, params, req, withAgent } from './_http';
import { CHANGE, TEMPLATE, cardId, chapter, createWithChapter, createWithRecord, docNumber, missionFolder, record, submitRecord, type Created } from './_fx';
import { GET as getSkeleton, POST as postSkeleton } from '@/app/api/studio/templates/[id]/skeleton/route';
import { PATCH as patchStructure } from '@/app/api/studio/documents/[id]/structure/route';
import { GET as getContracts } from '@/app/api/studio/contracts/route';

const FOLDER = missionFolder('tv');
const CARD = cardId('tv');
const C34 = /^t_[0-9a-f]{8}$/;
const docIds: string[] = [];
const versionIds: string[] = [];
let win: RollbackWindow;
let templateId = '';
let latestBefore = 0;
let noRecordVersionNo = 0;

async function templateVersion(documentId: string, versionNo: number, baseRevisionNo: number) {
  return call(patchStructure(await req(`/api/studio/documents/${documentId}/structure`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'templateVersion', versionNo, baseRevisionNo, change: CHANGE }) }), params({ id: documentId })));
}

async function saveSkeleton(slots: any[], baseVersionNo: number, note: string): Promise<number> {
  const r = await call(postSkeleton(await req(`/api/studio/templates/${templateId}/skeleton`, { auth: 'admin', body: { $schema: 'studio.skeleton/v1', slots, baseVersionNo, changeNote: note } }), params({ id: templateId })));
  expect(r.status, r.text.slice(0, 500)).toBe(201);
  versionIds.push(r.body.version.id);
  return r.body.version.versionNo;
}

/** MX09 yang diharapkan dari M19 revisi terkini (register 05 §7.2; null/[] bila tanpa M19). */
async function expectedMirror(documentId: string): Promise<any> {
  const d = await tx().studioDocument.findUnique({ where: { id: documentId }, select: { currentRevisionNo: true } });
  const m19 = await tx().studioContractRecord.findFirst({ where: { documentId, revisionNo: d.currentRevisionNo }, include: { items: true } });
  if (!m19) return { contractStatus: null, contractOwner: null, contractTaskRef: null, contractDueOn: null, contractCardIds: [] };
  const cards = [...new Set([...m19.cardIds, ...m19.items.map((i: any) => i.itemKey).filter((k: string) => C34.test(k))])].sort();
  return { contractStatus: m19.status, contractOwner: m19.owner, contractTaskRef: m19.taskRef, contractDueOn: m19.dueOn?.toISOString() ?? null, contractCardIds: cards };
}
async function actualMirror(documentId: string): Promise<any> {
  const d = await tx().studioDocument.findUnique({ where: { id: documentId } });
  return { contractStatus: d.contractStatus, contractOwner: d.contractOwner, contractTaskRef: d.contractTaskRef, contractDueOn: d.contractDueOn?.toISOString() ?? null, contractCardIds: d.contractCardIds };
}

beforeAll(async () => {
  win = await openRollback();
  const tpl = await tx().studioTemplate.findUnique({ where: { slug: TEMPLATE }, select: { id: true, latestVersionNo: true } });
  templateId = tpl.id;
  latestBefore = tpl.latestVersionNo;
  const g = await call(getSkeleton(await req(`/api/studio/templates/${templateId}/skeleton`, { auth: 'admin' }), params({ id: templateId })));
  expect(g.status).toBe(200);
  expect(g.body.skeleton.slots.map((s: any) => s.sectionType)).toContain('contractRecord');
  const withoutRecord = g.body.skeleton.slots.filter((s: any) => s.sectionType !== 'contractRecord').map((s: any, i: number) => ({ ...s, position: i + 1 }));
  noRecordVersionNo = await saveSkeleton(withoutRecord, g.body.versionNo, `DC-36 #9 tanpa slot record ${RUN_ID}`);
}, 120_000);

afterAll(async () => {
  await win.close();
  const left = await residue({ docIds, missionPrefix: FOLDER, runId: RUN_ID, templateVersionIds: versionIds });
  const tpl = await real().studioTemplate.findUnique({ where: { id: templateId }, select: { latestVersionNo: true } });
  console.info(`[DC-36 r14#9] residue=${JSON.stringify(left)} latestVersionNo before=${latestBefore} after=${tpl?.latestVersionNo}`);
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  expect(tpl?.latestVersionNo).toBe(latestBefore);
  await disconnectReal();
}, 120_000);

describe('#9 R14 templateVersion pada dokumen kontrak (D-399)', () => {
  it('prasyarat: versi baru tanpa slot contractRecord tersimpan (CH-06 meloloskan), MX08 templat tetap', async () => {
    expect(noRecordVersionNo).toBe(latestBefore + 1);
    const v = await tx().studioTemplateVersion.findUnique({ where: { templateId_versionNo: { templateId, versionNo: noRecordVersionNo } }, select: { slots: { select: { sectionTypeKey: true } }, template: { select: { contractKind: true } } } });
    expect(v.slots.map((s: any) => s.sectionTypeKey)).not.toContain('contractRecord');
    expect(v.template.contractKind).toBe('agentWorkReport');
  });

  it('slot record TERISI: R14 ditolak 422 SLOT_UNKNOWN, 0 tulis; MX09 tetap = M19 revisi terkini; R21 status = M19', async () => {
    const d: Created = await createWithRecord(FOLDER, 'terisi', docNumber('TV1'), record({ status: 'blocked', owner: 'coder-execution', taskRef: 'DC-36', due: '2026-11-09', cardIds: [CARD] }), 'Laporan terisi', latestBefore);
    docIds.push(d.id);
    const revs0 = await tx().studioRevision.count({ where: { documentId: d.id } });
    const m19s0 = await tx().studioContractRecord.count({ where: { documentId: d.id } });
    const r = await templateVersion(d.id, noRecordVersionNo, 1);
    expect(r.status, r.text.slice(0, 300)).toBe(422);
    expect(r.body.code).toBe('SLOT_UNKNOWN');
    expect(r.body.details).toMatchObject({ slotKey: 'record', pointer: '/sections/record' });
    expect(await tx().studioRevision.count({ where: { documentId: d.id } })).toBe(revs0);
    expect(await tx().studioContractRecord.count({ where: { documentId: d.id } })).toBe(m19s0);
    expect(await actualMirror(d.id)).toEqual(await expectedMirror(d.id));
    expect(await actualMirror(d.id)).toEqual({ contractStatus: 'blocked', contractOwner: 'coder-execution', contractTaskRef: 'DC-36', contractDueOn: '2026-11-09T00:00:00.000Z', contractCardIds: [CARD] });
    const listed = await call(getContracts(await req(`/api/studio/contracts?mission=${FOLDER}&docKey=terisi`, { auth: 'agent' })));
    expect(listed.body.contracts.map((c: any) => [c.documentId, c.status, c.revisionNo])).toEqual([[d.id, 'blocked', 1]]);
  });

  it('slot record KOSONG: R14 diterima; revisi terkini tanpa M19; MX09 status/owner/taskRef/due/kartu null/[] (konsisten), contractKind = MX08', async () => {
    const d: Created = await createWithChapter(FOLDER, 'kosong', docNumber('TV2'), chapter('1'), TEMPLATE, 'Laporan kosong', latestBefore);
    docIds.push(d.id);
    expect(await actualMirror(d.id)).toEqual(await expectedMirror(d.id));
    const r = await templateVersion(d.id, noRecordVersionNo, 1);
    expect(r.status, r.text.slice(0, 300)).toBe(200);
    expect(r.body.revision.revisionNo).toBe(2);
    expect(await tx().studioContractRecord.count({ where: { documentId: d.id } })).toBe(0);
    expect(await actualMirror(d.id)).toEqual(await expectedMirror(d.id));
    const row = await tx().studioDocument.findUnique({ where: { id: d.id }, select: { contractKind: true } });
    expect(row.contractKind).toBe('agentWorkReport');
    // Pada versi tanpa slot record, slot tidak dapat diisi (tidak ada jalan menuju status basi).
    const fill = await submitRecord(d.id, record({ status: 'complete' }), { baseRevisionNo: 2 });
    expect(fill.status).toBe(422);
    expect(fill.body.code).toBe('SLOT_UNKNOWN');
    // Kembali ke versi 1: diterima, MX09 tetap konsisten (record masih kosong).
    const back = await templateVersion(d.id, latestBefore, 2);
    expect(back.status, back.text.slice(0, 300)).toBe(200);
    expect(await actualMirror(d.id)).toEqual(await expectedMirror(d.id));
    const listed = await call(getContracts(await req(`/api/studio/contracts?mission=${FOLDER}&docKey=kosong`, { auth: 'agent' })));
    expect(listed.body.contracts.map((c: any) => [c.documentId, c.status, c.revisionNo])).toEqual([[d.id, null, 3]]);
  });

  it('varian: slot berkunci "record" bertipe lain (sourceRegister) di versi baru -> R14 pada record terisi tidak membuat MX09 basi', async () => {
    const g = await call(getSkeleton(await req(`/api/studio/templates/${templateId}/skeleton?version=${latestBefore}`, { auth: 'admin' }), params({ id: templateId })));
    const slots = g.body.skeleton.slots
      .filter((s: any) => s.slotKey !== 'references')
      .map((s: any) => (s.sectionType === 'contractRecord' ? { ...s, sectionType: 'sourceRegister', label: 'Referensi', positionLocked: false, required: false } : s));
    const vNo = await saveSkeleton(slots, noRecordVersionNo, `DC-36 #9 record bertipe sourceRegister ${RUN_ID}`);
    const d: Created = await createWithRecord(FOLDER, 'varian', docNumber('TV3'), record({ status: 'partial', owner: 'verifier', cardIds: [CARD] }), 'Laporan varian', latestBefore);
    docIds.push(d.id);
    const r = await templateVersion(d.id, vNo, 1);
    expect(r.status, r.text.slice(0, 300)).toBe(422);
    expect(r.body.code).toBe('SLOT_TYPE_MISMATCH');
    expect(await tx().studioRevision.count({ where: { documentId: d.id } })).toBe(1);
    expect(await actualMirror(d.id)).toEqual(await expectedMirror(d.id));
  });
});
