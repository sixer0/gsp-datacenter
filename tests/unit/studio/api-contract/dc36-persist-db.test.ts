/* eslint-disable @typescript-eslint/no-explicit-any -- uji: baris DB dan badan respons dinamis */
// DC-36 — persistensi kontrak lewat handler + layanan NYATA atas DB `gsp_agent_hq_v21`
// (register 05 §7.1 M19-M21, §7.2 MX09, §7.6 aturan tulis, §5.7 proyeksi; 03 §4.6 rekonstruksi
// dari baris tidak memakai M19-M21). Jalur: R04 POST `studio.doc/v2` (buat + rekonstruksi R20),
// R13 slot record, R12 bab, R16 PATCH pid, R06 PATCH alamat, R14 PATCH struktur. Seluruh kerja
// di SATU transaksi yang selalu di-ROLLBACK (`_rb.ts`); 0 baris tersisa diperiksa sesudahnya.
// Nilai yang diharapkan = literal kiriman/register (mis. reportedAt +07:00 -> UTC), bukan
// keluaran kode yang diuji.
import './_env';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { RUN_ID } from './_env';
import { disconnectReal, globalCounts, openRollback, residue, tx, type RollbackWindow } from './_rb';
import { call, params, req, withAgent } from './_http';
import { CHANGE, TEMPLATE, cardId, chapter, createWithChapter, docNumber, missionFolder, postDocV2, record, submitChapter, submitRecord, type Created } from './_fx';
import { GET as getContent } from '@/app/api/studio/documents/[id]/content/route';
import { PATCH as patchPid } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { PATCH as patchBlock } from '@/app/api/studio/documents/[id]/blocks/[address]/route';
import { PATCH as patchStructure } from '@/app/api/studio/documents/[id]/structure/route';

const FOLDER = missionFolder('per');
const CARD_A = cardId('pA');
const CARD_I = cardId('pI');
const docIds: string[] = [];
let before: Record<string, number> = {};
let win: RollbackWindow;
let target: Created;
let targetPid = '';
let docId = '';

function fullRecord(): Record<string, any> {
  return record({
    verdict: 'PASS',
    owner: 'data-analyst',
    initiator: 'controller',
    taskRef: 'DC-36',
    due: '2026-11-05',
    phase: { from: 'research', to: 'masterplan' },
    cardIds: [CARD_A],
    refs: [
      { documentId: target.id, pid: targetPid, rel: 'basis' },
      { docNumber: target.docNumber, pid: targetPid, revisionNo: 1, rel: 'evidence' },
    ],
    evidence: [{ kind: 'command', ref: 'npx tsc --noEmit', exitCode: 0 }],
    items: [
      { key: CARD_I, title: { text: 'Butir kartu kanban' }, status: 'done', owner: 'coder-execution', phase: 'impl', due: '2026-11-01', dependsOn: ['DC-35'] },
      { key: 'DC-37', title: { text: 'Butir berlabel' }, status: 'ready' },
    ],
  });
}

async function records(documentId: string): Promise<any[]> {
  return tx().studioContractRecord.findMany({
    where: { documentId },
    orderBy: { revisionNo: 'asc' },
    include: { items: { orderBy: { position: 'asc' } }, refs: { orderBy: { position: 'asc' } } },
  });
}
async function doc(documentId: string): Promise<any> {
  return tx().studioDocument.findUnique({ where: { id: documentId } });
}
async function pidAt(documentId: string, revisionNo: number, address: string): Promise<string> {
  const b = await tx().studioDocBlock.findFirst({ where: { address, revision: { documentId, revisionNo } }, select: { pid: true } });
  if (!b) throw new Error(`blok ${address} rev ${revisionNo} tidak ada`);
  return b.pid;
}
async function content(documentId: string, rev?: number): Promise<any> {
  const r = await call(getContent(await req(`/api/studio/documents/${documentId}/content${rev ? `?rev=${rev}` : ''}`, { auth: 'agent' }), params({ id: documentId })));
  expect(r.status, r.text.slice(0, 300)).toBe(200);
  return r.body;
}
/** Bagian salinan M19/M20/M21 yang harus identik antar revisi (tanpa id/revisi/waktu). */
function copyShape(r: any): any {
  return {
    status: r.status, verdict: r.verdict, owner: r.owner, initiator: r.initiator, taskRef: r.taskRef, reportedAt: r.reportedAt.toISOString(), dueOn: r.dueOn?.toISOString() ?? null,
    phaseFrom: r.phaseFrom, phaseTo: r.phaseTo, cardIds: r.cardIds, itemCount: r.itemCount, contractKind: r.contractKind,
    items: r.items.map((i: any) => [i.itemKey, i.position, i.pid, i.status, i.owner, i.phase, i.dueOn?.toISOString() ?? null, i.dependsOn, i.titlePlain]),
    refs: r.refs.map((x: any) => [x.position, x.rel, x.targetDocumentId, x.targetPid, x.targetRevisionNo]),
  };
}
function mirror(d: any): any {
  return { contractKind: d.contractKind, contractStatus: d.contractStatus, contractOwner: d.contractOwner, contractTaskRef: d.contractTaskRef, contractDueOn: d.contractDueOn?.toISOString() ?? null, contractCardIds: d.contractCardIds };
}

beforeAll(async () => {
  before = await globalCounts();
  win = await openRollback();
  target = await createWithChapter(FOLDER, 'sasaran', docNumber('T'), chapter('1'));
  docIds.push(target.id);
  targetPid = await pidAt(target.id, 1, '1.1.1');
}, 120_000);

afterAll(async () => {
  await win.close();
  const left = await residue({ docIds, missionPrefix: FOLDER, runId: RUN_ID });
  const after = await globalCounts();
  console.info(`[DC-36 persist] residue=${JSON.stringify(left)} before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  await disconnectReal();
}, 120_000);

describe('R04 POST studio.doc/v2: M19 + M20 + M21 + MX09 (register 05 §7.1, §7.2, §7.6)', () => {
  it('201 COMPLETE; tepat satu M19 revisi 1 dengan medan payload (reportedAt dinormalkan UTC)', async () => {
    const res = await postDocV2({
      $schema: 'studio.doc/v2',
      template: { slug: TEMPLATE },
      mission: { folder: FOLDER },
      docKey: 'laporan',
      meta: { title: 'Laporan kerja DC-36', docNumber: docNumber('L') },
      sections: { record: fullRecord(), content: { type: 'chapter', chapters: ['1', '2', '3', '4', '5'].map((k) => chapter(k)) } },
    });
    expect(res.status, res.text.slice(0, 500)).toBe(201);
    expect(res.body.completeness.status).toBe('COMPLETE');
    docId = res.body.document.id;
    docIds.push(docId);
    const rows = await records(docId);
    expect(rows).toHaveLength(1);
    const rev1 = await tx().studioRevision.findUnique({ where: { documentId_revisionNo: { documentId: docId, revisionNo: 1 } }, select: { id: true } });
    const sec = await tx().studioDocSection.findFirst({ where: { revisionId: rev1.id, slotKey: 'record' }, select: { id: true } });
    const r = rows[0];
    expect([r.revisionId, r.docSectionId, r.documentId, r.revisionNo]).toEqual([rev1.id, sec.id, docId, 1]);
    expect(copyShape({ ...r, items: [], refs: [] })).toEqual({
      status: 'complete', verdict: 'PASS', owner: 'data-analyst', initiator: 'controller', taskRef: 'DC-36', reportedAt: '2026-10-30T12:30:00.000Z', dueOn: '2026-11-05T00:00:00.000Z',
      phaseFrom: 'research', phaseTo: 'masterplan', cardIds: [CARD_A], itemCount: 2, contractKind: 'agentWorkReport', items: [], refs: [],
    });
  });

  it('M20: satu baris per butir, pid = pid baris M17 F:record/<n>; M21: rujukan ter-resolve (documentId / docNumber)', async () => {
    const [r] = await records(docId);
    const p1 = await pidAt(docId, 1, 'F:record/1');
    const p2 = await pidAt(docId, 1, 'F:record/2');
    expect(r.items.map((i: any) => [i.documentId, i.revisionNo, i.itemKey, i.position, i.pid, i.status, i.owner, i.phase, i.dueOn?.toISOString() ?? null, i.dependsOn, i.titlePlain])).toEqual([
      [docId, 1, CARD_I, 1, p1, 'done', 'coder-execution', 'impl', '2026-11-01T00:00:00.000Z', ['DC-35'], 'Butir kartu kanban'],
      [docId, 1, 'DC-37', 2, p2, 'ready', null, null, null, [], 'Butir berlabel'],
    ]);
    expect(r.refs.map((x: any) => [x.fromDocumentId, x.revisionNo, x.position, x.rel, x.targetDocumentId, x.targetPid, x.targetRevisionNo])).toEqual([
      [docId, 1, 1, 'basis', target.id, targetPid, null],
      [docId, 1, 2, 'evidence', target.id, targetPid, 1],
    ]);
  });

  it('MX09 = cermin revisi terbaru; contractCardIds = cardIds ∪ kunci butir C34, terurut unik (DC-37 tidak)', async () => {
    expect(mirror(await doc(docId))).toEqual({
      contractKind: 'agentWorkReport', contractStatus: 'complete', contractOwner: 'data-analyst', contractTaskRef: 'DC-36', contractDueOn: '2026-11-05T00:00:00.000Z', contractCardIds: [CARD_A, CARD_I].sort(),
    });
  });

  it('rekonstruksi R20 dari baris: sections.record = payload kiriman; bab 1..5 utuh', async () => {
    const body = await content(docId, 1);
    expect(body.revisionNo).toBe(1);
    expect(body.content.sections.record).toEqual(fullRecord());
    expect(body.content.sections.content.chapters.map((c: any) => c.key)).toEqual(['1', '2', '3', '4', '5']);
  });
});

describe('Salinan penuh per revisi lewat R13, R12, R16, R06, R14 (register 05 §7.1 invarian, KD-34)', () => {
  let lastShape: any;

  it('R13 slot record (rev 2): M19 baru, rev 1 utuh; pid butir mewarisi per key, butir baru pid baru; MX09 mengikuti', async () => {
    const p = fullRecord();
    p.status = 'blocked';
    p.owner = 'verifier';
    p.items = [p.items[1], { key: 'DC-38', title: { text: 'Butir baru' }, status: 'blocked' }];
    const r = await submitRecord(docId, p, { baseRevisionNo: 1 });
    expect(r.status, r.text.slice(0, 400)).toBe(201);
    expect(r.body.revision.revisionNo).toBe(2);
    const rows = await records(docId);
    expect(rows.map((x: any) => [x.revisionNo, x.status, x.owner])).toEqual([[1, 'complete', 'data-analyst'], [2, 'blocked', 'verifier']]);
    const pidDc37Rev1 = rows[0].items.find((i: any) => i.itemKey === 'DC-37').pid;
    const items2 = rows[1].items;
    expect(items2.map((i: any) => [i.itemKey, i.position])).toEqual([['DC-37', 1], ['DC-38', 2]]);
    expect(items2[0].pid).toBe(pidDc37Rev1);
    expect(rows[0].items.map((i: any) => i.pid)).not.toContain(items2[1].pid);
    expect(items2[1].pid).toBe(await pidAt(docId, 2, 'F:record/2'));
    expect(mirror(await doc(docId))).toEqual({ contractKind: 'agentWorkReport', contractStatus: 'blocked', contractOwner: 'verifier', contractTaskRef: 'DC-36', contractDueOn: '2026-11-05T00:00:00.000Z', contractCardIds: [CARD_A] });
    lastShape = copyShape(rows[1]);
  });

  it('R12 bab (rev 3): M19/M20/M21 disalin identik; MX09 tetap', async () => {
    const before3 = mirror(await doc(docId));
    const r = await submitChapter(docId, chapter('2', 'Bab dua diperbarui lewat R12.'), { baseRevisionNo: 2 });
    expect(r.status, r.text.slice(0, 400)).toBe(201);
    expect(r.body.revision.revisionNo).toBe(3);
    const rows = await records(docId);
    expect(rows.map((x: any) => x.revisionNo)).toEqual([1, 2, 3]);
    expect(copyShape(rows[2])).toEqual(lastShape);
    expect(mirror(await doc(docId))).toEqual(before3);
  });

  it('R16 replace paragraf (rev 4): salinan M19 identik; R16 pada pid butir kontrak -> 400 PID_OP_KIND, 0 tulis', async () => {
    const pid = await pidAt(docId, 3, '3.1.1');
    const r = await call(patchPid(await req(`/api/studio/documents/${docId}/paragraphs/${pid}`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 3, block: { type: 'paragraph', text: 'Diganti lewat R16.' }, change: CHANGE }) }), params({ id: docId, pid })));
    expect(r.status, r.text.slice(0, 400)).toBe(200);
    expect(r.body.revision.revisionNo).toBe(4);
    const rows = await records(docId);
    expect(rows.map((x: any) => x.revisionNo)).toEqual([1, 2, 3, 4]);
    expect(copyShape(rows[3])).toEqual(lastShape);

    const itemPid = await pidAt(docId, 4, 'F:record/1');
    const bad = await call(patchPid(await req(`/api/studio/documents/${docId}/paragraphs/${itemPid}`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 4, block: { type: 'paragraph', text: 'x' }, change: CHANGE }) }), params({ id: docId, pid: itemPid })));
    expect(bad.status).toBe(400);
    expect(bad.body.details?.[0]?.checkId).toBe('PID_OP_KIND');
    expect((await doc(docId)).currentRevisionNo).toBe(4);
    expect(await tx().studioContractRecord.count({ where: { documentId: docId } })).toBe(4);
  });

  it('R06 replace alamat (rev 5): salinan M19 identik', async () => {
    const r = await call(patchBlock(await req(`/api/studio/documents/${docId}/blocks/4.1.1`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 4, block: { type: 'paragraph', text: 'Diganti lewat R06.' }, change: CHANGE }) }), params({ id: docId, address: '4.1.1' })));
    expect(r.status, r.text.slice(0, 400)).toBe(200);
    expect(r.body.revision.revisionNo).toBe(5);
    const rows = await records(docId);
    expect(rows.map((x: any) => x.revisionNo)).toEqual([1, 2, 3, 4, 5]);
    expect(copyShape(rows[4])).toEqual(lastShape);
  });

  it('R14 setMeta (rev 6): salinan M19 identik, MX09 tetap; omitSlot record (wajib) -> 422, 0 tulis', async () => {
    const mx = mirror(await doc(docId));
    const r = await call(patchStructure(await req(`/api/studio/documents/${docId}/structure`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'setMeta', meta: { title: 'Laporan kerja DC-36 (judul baru)' }, baseRevisionNo: 5, change: CHANGE }) }), params({ id: docId })));
    expect(r.status, r.text.slice(0, 400)).toBe(200);
    expect(r.body.revision.revisionNo).toBe(6);
    const rows = await records(docId);
    expect(copyShape(rows[5])).toEqual(lastShape);
    const d = await doc(docId);
    expect(mirror(d)).toEqual(mx);
    expect(d.title).toBe('Laporan kerja DC-36 (judul baru)');

    const omit = await call(patchStructure(await req(`/api/studio/documents/${docId}/structure`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'omitSlot', slot: 'record', baseRevisionNo: 6, change: CHANGE }) }), params({ id: docId })));
    expect(omit.status).toBe(422);
    expect(omit.body.code).toBe('SLOT_REQUIRED_MISSING');
    expect((await doc(docId)).currentRevisionNo).toBe(6);
    expect(await tx().studioContractRecord.count({ where: { documentId: docId } })).toBe(6);
  });

  it('invarian: satu M19 per revisi; revisionId M19 = baris StudioRevision bernomor sama', async () => {
    const rows = await records(docId);
    const revs = await tx().studioRevision.findMany({ where: { documentId: docId }, select: { id: true, revisionNo: true }, orderBy: { revisionNo: 'asc' } });
    expect(rows.map((r: any) => [r.revisionNo, r.revisionId])).toEqual(revs.map((r: any) => [r.revisionNo, r.id]));
  });
});

describe('Rekonstruksi (03 §4.6) tidak memakai M19-M21', () => {
  it('R20 identik sebelum dan sesudah seluruh M19 dokumen dihapus (kaskade M20/M21) di dalam transaksi', async () => {
    const a = await content(docId);
    const a1 = await content(docId, 1);
    const del = await tx().studioContractRecord.deleteMany({ where: { documentId: docId } });
    expect(del.count).toBe(6);
    expect(await tx().studioContractItem.count({ where: { documentId: docId } })).toBe(0);
    expect(await tx().studioDocRef.count({ where: { fromDocumentId: docId } })).toBe(0);
    expect(await content(docId)).toEqual(a);
    expect(await content(docId, 1)).toEqual(a1);
    expect(a.content.sections.record.status).toBe('blocked');
  });
});
