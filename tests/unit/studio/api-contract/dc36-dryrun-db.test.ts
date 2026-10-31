/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// DC-36 — R08 POST /api/studio/validate untuk slot `contractRecord` (isu + peringatan) dan
// R23 POST /api/studio/drafts/check dengan dry-run NYATA (tanpa mock layanan) atas DB
// `gsp_agent_hq_v21` (register 05 §5.6 urutan evaluasi, §13.1 EC25-EC27, §13.2 CW-01,
// §17.1 NV-*, §9.3 R23, §11.2 DR-08, KS-3 "0 tulis DB", KS-8 hasil R23 = R08 per blok).
// Fixture dibuat lewat R12/R13 NYATA di SATU transaksi yang selalu di-ROLLBACK (`_rb.ts`).
import './_env';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { RUN_ID } from './_env';
import { disconnectReal, globalCounts, openRollback, residue, stats, tx, type RollbackWindow } from './_rb';
import { AGENT_ID, call, params, quotaOf, req, withAgent } from './_http';
import { CHANGE, chapter, createWithChapter, createWithRecord, docNumber, missionFolder, record, submitRecord, type Created } from './_fx';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { POST as postDraftCheck } from '@/app/api/studio/drafts/check/route';
import { PATCH as patchPid } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';

const FOLDER = missionFolder('dry');
const GHOST = 'cdc36ghost0000000000000000';
const docIds: string[] = [];
let before: Record<string, number> = {};
let win: RollbackWindow;
let target: Created;
let report: Created;
let livePid = '';
let retiredPid = '';

/** Jejak tulis yang relevan: revisi, M19-M21, dokumen, blok. Dihitung di DALAM transaksi. */
async function footprint(): Promise<Record<string, number>> {
  const t = tx();
  return {
    documents: await t.studioDocument.count({ where: { missionFolder: FOLDER } }),
    revisions: await t.studioRevision.count({ where: { documentId: { in: docIds } } }),
    records: await t.studioContractRecord.count({ where: { documentId: { in: docIds } } }),
    items: await t.studioContractItem.count({ where: { documentId: { in: docIds } } }),
    refs: await t.studioDocRef.count({ where: { fromDocumentId: { in: docIds } } }),
    blocks: await t.studioDocBlock.count({ where: { revision: { documentId: { in: docIds } } } }),
  };
}

function slotBody(payload: Record<string, unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { $schema: 'studio.slot/v2', target: { documentId: report.id }, slot: 'record', payload, ...extra };
}

async function r08(body: Record<string, unknown>): Promise<any> {
  const r = await call(postValidate(await req('/api/studio/validate', { auth: 'agent', body: withAgent(body) })));
  expect(r.status, r.text.slice(0, 400)).toBe(200);
  return r.body;
}

beforeAll(async () => {
  before = await globalCounts();
  win = await openRollback();
  target = await createWithChapter(FOLDER, 'sasaran', docNumber('DT'), chapter('1'));
  docIds.push(target.id);
  const blocks = await tx().studioDocBlock.findMany({ where: { revision: { documentId: target.id, revisionNo: 1 } }, select: { pid: true, address: true } });
  livePid = blocks.find((b: any) => b.address === '1.1.1').pid;
  retiredPid = blocks.find((b: any) => b.address === '1.1.2').pid;
  // Pensiunkan pid 1.1.2 (R16 delete) -> rujukan ke pid ini = CW-01, bukan galat.
  const del = await call(patchPid(await req(`/api/studio/documents/${target.id}/paragraphs/${retiredPid}`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'delete', baseRevisionNo: 1, change: CHANGE }) }), params({ id: target.id, pid: retiredPid })));
  expect(del.status, del.text.slice(0, 300)).toBe(200);
  report = await createWithRecord(FOLDER, 'laporan', docNumber('DR'), record({ owner: 'data-analyst', items: [{ key: 'DC-36', title: { text: 'Uji' }, status: 'running' }] }));
  docIds.push(report.id);
}, 120_000);

afterAll(async () => {
  await win.close();
  const left = await residue({ docIds, missionPrefix: FOLDER, runId: RUN_ID });
  const after = await globalCounts();
  console.info(`[DC-36 dryrun] residue=${JSON.stringify(left)} before=${JSON.stringify(before)} after=${JSON.stringify(after)} savepoints=${JSON.stringify(stats)}`);
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  await disconnectReal();
}, 120_000);

describe('R08 slot contractRecord: isu register + 0 tulis DB (KS-3)', () => {
  const cases: Array<[string, () => Record<string, unknown>, (b: any) => void]> = [
    ['status di luar E45 -> CONTRACT_ENUM /payload/status', () => record({ status: 'selesai' }), (b) => expect(b.issues).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/payload/status', checkId: 'CONTRACT_ENUM' })]))],
    ['cardId salah pola C34 -> /payload/cardIds/0', () => record({ cardIds: ['t_XYZ'] }), (b) => expect(b.issues.map((i: any) => i.pointer)).toContain('/payload/cardIds/0')],
    ['reportedAt 2026-02-30 -> CONTRACT_DATE', () => record({ reportedAt: '2026-02-30' }), (b) => expect(b.issues).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/payload/reportedAt', checkId: 'CONTRACT_DATE' })]))],
    ['ref documentId + docNumber sekaligus -> CONTRACT_REF_TARGET', () => record({ refs: [{ documentId: GHOST, docNumber: 'X/1', rel: 'basis' }] }), (b) => expect(b.issues).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/payload/refs/0', checkId: 'CONTRACT_REF_TARGET' })]))],
    ['medan tampilan (color) -> DISPLAY_FIELD', () => record({ color: 'red' }), (b) => expect(b.issues).toEqual(expect.arrayContaining([expect.objectContaining({ checkId: 'DISPLAY_FIELD' })]))],
    ['kunci butir ganda -> CONTRACT_ITEM_KEY_DUPLICATE positions [1, 2]', () => record({ items: [{ key: 'DC-1', title: { text: 'a' }, status: 'done' }, { key: 'DC-1', title: { text: 'b' }, status: 'done' }] }), (b) => expect(b.issues).toEqual([expect.objectContaining({ keyword: 'CONTRACT_ITEM_KEY_DUPLICATE', details: expect.objectContaining({ key: 'DC-1', positions: [1, 2] }) })])],
    ['ref dokumen tidak ada -> CONTRACT_REF_NOT_FOUND reason DOCUMENT', () => record({ refs: [{ documentId: GHOST, rel: 'basis' }] }), (b) => expect(b.issues).toEqual([expect.objectContaining({ pointer: '/payload/refs/0', keyword: 'CONTRACT_REF_NOT_FOUND', details: expect.objectContaining({ reason: 'DOCUMENT', documentId: GHOST }) })])],
    ['ref revisionNo > revisi terkini sasaran -> CONTRACT_REF_NOT_FOUND reason REVISION', () => record({ refs: [{ documentId: target.id, pid: livePid, revisionNo: 99, rel: 'basis' }] }), (b) => expect(b.issues).toEqual([expect.objectContaining({ keyword: 'CONTRACT_REF_NOT_FOUND', details: expect.objectContaining({ reason: 'REVISION' }) })])],
    ['ref pid tidak pernah ada -> CONTRACT_REF_PID_NOT_FOUND', () => record({ refs: [{ documentId: target.id, pid: 'p-dc36takada', rel: 'basis' }] }), (b) => expect(b.issues).toEqual([expect.objectContaining({ pointer: '/payload/refs/0/pid', keyword: 'CONTRACT_REF_PID_NOT_FOUND', details: expect.objectContaining({ pid: 'p-dc36takada' }) })])],
  ];

  it.each(cases)('%s', async (_n, payload, check) => {
    const f0 = await footprint();
    const body = await r08(slotBody(payload()));
    expect(body.valid).toBe(false);
    check(body);
    expect(await footprint()).toEqual(f0);
  });

  it('ref pid PENSIUN -> valid true + warnings[0] CW-01 CONTRACT_REF_PID_RETIRED; 0 tulis', async () => {
    const f0 = await footprint();
    const body = await r08(slotBody(record({ refs: [{ documentId: target.id, pid: retiredPid, rel: 'basis' }] })));
    expect(body.valid).toBe(true);
    const warnings = body.warnings ?? body.submitPreview?.warnings;
    expect(warnings).toEqual([expect.objectContaining({ code: 'CONTRACT_REF_PID_RETIRED' })]);
    expect(await footprint()).toEqual(f0);
  });

  it('ref pid hidup -> valid true tanpa medan warnings; 0 tulis', async () => {
    const f0 = await footprint();
    const body = await r08(slotBody(record({ refs: [{ documentId: target.id, pid: livePid, rel: 'basis' }] })));
    expect(body.valid).toBe(true);
    expect(body.warnings).toBeUndefined();
    expect(body.submitPreview?.warnings).toBeUndefined();
    expect(await footprint()).toEqual(f0);
  });
});

function draft(basis: string, ...blocks: string[]): string {
  return ['# DRAF Laporan kerja DC-36', 'tujuan: uji R23 nyata', 'langkah-berikut: kirim slot record', `basis: ${basis}`, '', ...blocks, ''].join('\n');
}
function jsonBlock(obj: Record<string, unknown>): string {
  return ['```json', JSON.stringify(obj), '```'].join('\n');
}

describe('R23 dry-run nyata: hasil per blok = R08 (KS-8), DR-08, 0 tulis DB, tagihan per blok', () => {
  it('dua blok (sah + status salah): valid false, isu blok = isu R08 badan yang sama, tagihan validate 1 per blok', async () => {
    const good = slotBody(record({ status: 'partial', reportedAt: '2026-10-30' }), { baseRevisionNo: 1 });
    const bad = slotBody(record({ status: 'selesai' }), { baseRevisionNo: 1 });
    const f0 = await footprint();
    const md = draft(`${report.id}@rev1`, jsonBlock(good), '', jsonBlock(bad));
    const first = await call(postDraftCheck(await req('/api/studio/drafts/check', { auth: 'agent', body: { markdown: md, agentId: AGENT_ID } })));
    expect(first.status, first.text.slice(0, 400)).toBe(200);
    const res = first.body;
    expect(res.valid).toBe(false);
    expect(res.header).toEqual({ title: 'DRAF Laporan kerja DC-36', tujuan: 'uji R23 nyata', langkahBerikut: 'kirim slot record', basis: `${report.id}@rev1` });
    expect(res.blocks.map((b: any) => [b.index, b.schema, b.valid])).toEqual([[1, 'studio.slot/v2', true], [2, 'studio.slot/v2', false]]);
    expect(res.blocks[0].line).toBe(6);
    expect(res.issues.filter((i: any) => i.code === 'DRAFT_BASIS_STALE')).toEqual([]);
    const v1 = await r08(good);
    const v2 = await r08(bad);
    expect(res.blocks[0].issues).toEqual(v1.issues);
    expect(res.blocks[1].issues).toEqual(v2.issues);
    expect(res.blocks[1].issues.map((i: any) => i.pointer)).toContain('/payload/status');
    expect(await footprint()).toEqual(f0);
    const [bucket, rem1] = quotaOf(first.headers);
    expect(bucket).toBe('validate');
    const again = await call(postDraftCheck(await req('/api/studio/drafts/check', { auth: 'agent', body: { markdown: md, agentId: AGENT_ID } })));
    // Di antara dua panggilan R23 ada dua R08 (tagihan validate yang sama): 2 (R08) + 2 (blok).
    expect(Number(quotaOf(again.headers)[1])).toBe(Number(rem1) - 4);
  });

  it('DR-08: basis rev1 sesudah dokumen naik ke rev2 -> peringatan DRAFT_BASIS_STALE (baris basis), 0 tulis', async () => {
    // Naikkan revisi dokumen laporan ke 2 lewat R13 nyata (satu-satunya tulis kasus ini).
    const up =await submitRecord(report.id, record({ status: 'complete', owner: 'data-analyst', items: [{ key: 'DC-36', title: { text: 'Uji' }, status: 'done' }] }), { baseRevisionNo: 1 });
    expect(up.status, up.text.slice(0, 300)).toBe(201);
    expect(up.body.revision.revisionNo).toBe(2);
    const f0 = await footprint();
    const md = draft(`${report.id}@rev1`, jsonBlock(slotBody(record({ status: 'partial', reportedAt: '2026-10-30' }), { baseRevisionNo: 1 })));
    const res = await call(postDraftCheck(await req('/api/studio/drafts/check', { auth: 'agent', body: { markdown: md } })));
    expect(res.status).toBe(200);
    const stale = res.body.issues.filter((i: any) => i.code === 'DRAFT_BASIS_STALE');
    expect(stale).toEqual([expect.objectContaining({ severity: 'warning', line: 4 })]);
    expect(await footprint()).toEqual(f0);
  });

  it('dry-run R08/R23 berjalan di transaksi READ ONLY (SAVEPOINT read-only tercatat harness)', () => {
    expect(stats.readOnlySavepoints).toBeGreaterThan(0);
  });
});
