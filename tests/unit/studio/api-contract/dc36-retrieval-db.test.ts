/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// DC-36 — R21 GET /api/studio/contracts dan R22 GET /api/studio/search lewat handler + layanan
// NYATA atas DB `gsp_agent_hq_v21` (register 05 §8, §9.1, §9.2; KS-5 presisi dan recall 100
// persen pada fixture; R22 memuat documentId + pid + alamat). Fixture dibuat lewat R13/R12
// NYATA di SATU transaksi yang selalu di-ROLLBACK (`_rb.ts`); 0 baris tersisa diperiksa
// sesudahnya dengan klien terpisah. Semua kueri dibatasi misi/token/kartu unik per run, jadi
// himpunan yang diharapkan tertutup dan tidak bergantung data lain di DEV.
import './_env';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { RUN_ID } from './_env';
import { disconnectReal, globalCounts, openRollback, residue, tx, type RollbackWindow } from './_rb';
import { call, params, quotaOf, req, withAgent } from './_http';
import { CHANGE, cardId, chapter, createWithChapter, createWithRecord, docNumber, hex8, missionFolder, record, submitChapter, token, type Created } from './_fx';
import { GET as getContracts } from '@/app/api/studio/contracts/route';
import { GET as getSearch } from '@/app/api/studio/search/route';
import { PATCH as patchPid } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';

const FOLDER = missionFolder('ret');
const CARD_A = cardId('A');
const CARD_B = cardId('B');
const TOK_1 = token('d1');
const TOK_1_NEW = token('d1-baru');
const TOK_SHARED = token('shared');
const TOK_ITEM = token('item');

const docIds: string[] = [];
const D: Record<string, Created> = {};
let before: Record<string, number> = {};
let win: RollbackWindow;

async function r21(qs: string): Promise<any> {
  const r = await call(getContracts(await req(`/api/studio/contracts?${qs}`, { auth: 'agent' })));
  expect(r.status, r.text.slice(0, 400)).toBe(200);
  expect(quotaOf(r.headers)[0]).toBe('query');
  return r.body;
}
async function r22(qs: string): Promise<any> {
  const r = await call(getSearch(await req(`/api/studio/search?${qs}`, { auth: 'agent' })));
  expect(r.status, r.text.slice(0, 400)).toBe(200);
  expect(quotaOf(r.headers)[0]).toBe('query');
  return r.body;
}
const ids = (body: any): string[] => body.contracts.map((c: any) => c.documentId).sort();
const set = (...keys: string[]): string[] => keys.map((k) => D[k].id).sort();

async function blockAt(documentId: string, revisionNo: number, address: string): Promise<{ pid: string; type: string }> {
  const b = await tx().studioDocBlock.findFirst({ where: { address, revision: { documentId, revisionNo } }, select: { pid: true, type: true } });
  if (!b) throw new Error(`blok ${address} rev ${revisionNo} tidak ada`);
  return b;
}

beforeAll(async () => {
  before = await globalCounts();
  win = await openRollback();
  const track = (k: string, c: Created) => {
    D[k] = c;
    docIds.push(c.id);
  };
  // D1: complete, kartu A, butir berkunci kartu B (cocok C34) + DC-90 (tidak cocok C34), tenggat 2026-11-05.
  track('d1', await createWithRecord(FOLDER, 'd1', docNumber('1'), record({ owner: 'data-analyst', taskRef: 'DC-36A', due: '2026-11-05', cardIds: [CARD_A], items: [{ key: CARD_B, title: { text: `Butir ${TOK_ITEM}` }, status: 'done' }, { key: 'DC-90', title: { text: 'Butir lain' }, status: 'ready' }] })));
  const c1 = await submitChapter(D.d1.id, chapter('1', `Temuan ${TOK_1} pada bab satu.`, `Kata ${TOK_SHARED} bersama.`));
  expect(c1.status, c1.text.slice(0, 300)).toBe(201);
  // D2: blocked, kartu B di cardIds (bukan butir), tenggat 2026-11-20.
  track('d2', await createWithRecord(FOLDER, 'd2', docNumber('2'), record({ status: 'blocked', owner: 'coder-execution', taskRef: 'DC-36B', due: '2026-11-20', cardIds: [CARD_B] })));
  // D3: partial tanpa tenggat.
  track('d3', await createWithRecord(FOLDER, 'd3', docNumber('3'), record({ status: 'partial', owner: 'data-analyst', taskRef: 'DC-36C' })));
  // D4: dokumen kontrak dengan slot record KOSONG (cermin status null, §7.6).
  track('d4', await createWithChapter(FOLDER, 'd4', docNumber('4'), chapter('1')));
  // D5: dokumen NON-kontrak (datum-gsp) di misi yang sama, memuat token bersama.
  track('d5', await createWithChapter(FOLDER, 'd5', docNumber('5'), chapter('1', `Non kontrak ${TOK_SHARED} juga.`), 'datum-gsp'));
  // D6: dokumen kontrak terarsip (dikecualikan bawaan; opt-in includeArchived=1, D-402).
  track('d6', await createWithRecord(FOLDER, 'd6', docNumber('6'), record({ owner: 'data-analyst', taskRef: 'DC-36D', cardIds: [CARD_A] })));
  await tx().studioDocument.update({ where: { id: D.d6.id }, data: { archived: true } });
}, 180_000);

afterAll(async () => {
  await win.close();
  const left = await residue({ docIds, missionPrefix: FOLDER, runId: RUN_ID });
  const after = await globalCounts();
  // Bukti dikutip laporan DC-36 (sisa fixture + hitungan global sebelum/sesudah).
  console.info(`[DC-36 retrieval] residue=${JSON.stringify(left)} before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  await disconnectReal();
}, 120_000);

describe('R21 presisi + recall (fixture tertutup per misi run)', () => {
  it('mission -> tepat 4 dokumen kontrak hidup (non-kontrak D5 dan arsip D6 tidak ikut)', async () => {
    expect(ids(await r21(`mission=${FOLDER}`))).toEqual(set('d1', 'd2', 'd3', 'd4'));
  });

  it('status tunggal / daftar koma', async () => {
    expect(ids(await r21(`mission=${FOLDER}&status=complete`))).toEqual(set('d1'));
    expect(ids(await r21(`mission=${FOLDER}&status=complete,blocked`))).toEqual(set('d1', 'd2'));
    expect(ids(await r21(`mission=${FOLDER}&status=partial`))).toEqual(set('d3'));
    expect(ids(await r21(`mission=${FOLDER}&status=needs-review`))).toEqual([]);
  });

  it('owner, taskRef, kind', async () => {
    expect(ids(await r21(`mission=${FOLDER}&owner=data-analyst`))).toEqual(set('d1', 'd3'));
    expect(ids(await r21(`mission=${FOLDER}&taskRef=DC-36B`))).toEqual(set('d2'));
    expect(ids(await r21(`mission=${FOLDER}&kind=agentWorkReport`))).toEqual(set('d1', 'd2', 'd3', 'd4'));
  });

  it('dueBefore / dueAfter inklusif (YYYY-MM-DD)', async () => {
    expect(ids(await r21(`mission=${FOLDER}&dueBefore=2026-11-05`))).toEqual(set('d1'));
    expect(ids(await r21(`mission=${FOLDER}&dueBefore=2026-11-04`))).toEqual([]);
    expect(ids(await r21(`mission=${FOLDER}&dueAfter=2026-11-05`))).toEqual(set('d1', 'd2'));
    expect(ids(await r21(`mission=${FOLDER}&dueAfter=2026-11-06`))).toEqual(set('d2'));
    expect(ids(await r21(`mission=${FOLDER}&dueAfter=2026-11-01&dueBefore=2026-11-30`))).toEqual(set('d1', 'd2'));
  });

  it('cardId tanpa misi: cardIds ∪ kunci butir C34; matchedItems = baris M20 revisi terkini', async () => {
    const body = await r21(`cardId=${CARD_B}`);
    expect(ids(body)).toEqual(set('d1', 'd2'));
    const s1 = body.contracts.find((c: any) => c.documentId === D.d1.id);
    const s2 = body.contracts.find((c: any) => c.documentId === D.d2.id);
    const m20 = await tx().studioContractItem.findFirst({ where: { documentId: D.d1.id, itemKey: CARD_B, revisionNo: 2 }, select: { pid: true } });
    expect(s1.matchedItems).toEqual([{ key: CARD_B, status: 'done', pid: m20.pid, title: `Butir ${TOK_ITEM}` }]);
    expect(s2.matchedItems).toEqual([]);
    // Kartu A: D1 (cardIds) saja; D6 terarsip tidak ikut tanpa opt-in.
    expect(ids(await r21(`cardId=${CARD_A}`))).toEqual(set('d1'));
    expect(ids(await r21(`cardId=${CARD_A}&includeArchived=1`))).toEqual(set('d1', 'd6'));
    // Kunci butir yang tidak cocok C34 (DC-90) tidak masuk cermin kartu.
    expect((await r21(`cardId=t_${hex8('tak-ada')}`)).contracts).toEqual([]);
  });

  it('docNumber tepat dan bentuk aman I61 (FN-02)', async () => {
    expect(ids(await r21(`docNumber=${encodeURIComponent(docNumber('1'))}`))).toEqual(set('d1'));
    // `DC36/<run>/1` -> runtun di luar [A-Za-z0-9.-] menjadi `-` (literal spesifikasi, bukan kode).
    expect(ids(await r21(`docNumber=DC36-${RUN_ID}-1`))).toEqual(set('d1'));
    expect(ids(await r21(`docNumber=DC36-${RUN_ID}-9`))).toEqual([]);
  });

  it('includeArchived=1 menambah D6; ringkasan T2-68 D1 sesuai kiriman', async () => {
    expect(ids(await r21(`mission=${FOLDER}&includeArchived=1`))).toEqual(set('d1', 'd2', 'd3', 'd4', 'd6'));
    const s = (await r21(`mission=${FOLDER}&status=complete`)).contracts[0];
    const { updatedAt, ...rest } = s;
    expect(new Date(updatedAt).toISOString()).toBe(updatedAt);
    expect(rest).toEqual({
      documentId: D.d1.id,
      docNumber: docNumber('1'),
      title: 'Laporan d1',
      kind: 'agentWorkReport',
      status: 'complete',
      owner: 'data-analyst',
      taskRef: 'DC-36A',
      cardIds: [CARD_A, CARD_B].sort(),
      dueOn: '2026-11-05',
      revisionNo: 2,
      completeness: { status: 'INCOMPLETE', missingRequired: ['content:2', 'content:3', 'content:4', 'content:5'] },
      missionFolder: FOLDER,
      docKey: 'd1',
    });
    const s4 = (await r21(`mission=${FOLDER}&docKey=d4`)).contracts;
    expect(s4).toHaveLength(1);
    expect(s4[0]).toMatchObject({ documentId: D.d4.id, status: null, owner: null, taskRef: null, cardIds: [], dueOn: null });
  });

  it('take=1 berhalaman: gabungan = himpunan penuh, tanpa duplikat, urut updatedAt DESC lalu id DESC', async () => {
    const seen: any[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10; i++) {
      const body: any = await r21(`mission=${FOLDER}&take=1${cursor ? `&cursor=${cursor}` : ''}`);
      expect(body.contracts.length).toBeLessThanOrEqual(1);
      seen.push(...body.contracts);
      cursor = body.nextCursor;
      if (!cursor) break;
    }
    expect(cursor).toBeNull();
    expect(seen.map((c) => c.documentId).sort()).toEqual(set('d1', 'd2', 'd3', 'd4'));
    expect(new Set(seen.map((c) => c.documentId)).size).toBe(4);
    for (let i = 1; i < seen.length; i++) {
      const a = seen[i - 1];
      const b = seen[i];
      expect(a.updatedAt > b.updatedAt || (a.updatedAt === b.updatedAt && a.documentId > b.documentId)).toBe(true);
    }
  });
});

describe('R22 teks penuh: documentId + pid + alamat, lingkup revisi terkini', () => {
  it('token paragraf unik -> tepat 1 hit; pid dan alamat = baris M17 revisi terkini', async () => {
    const body = await r22(`q=${TOK_1}`);
    expect(body.query).toEqual({ q: TOK_1, config: 'simple' });
    expect(body.hits).toHaveLength(1);
    const blk = await blockAt(D.d1.id, 2, '1.1.1');
    const { rank, snippet, ...hit } = body.hits[0];
    expect(hit).toEqual({ documentId: D.d1.id, docNumber: docNumber('1'), title: 'Laporan d1', kind: 'agentWorkReport', revisionNo: 2, pid: blk.pid, address: '1.1.1', slotKey: 'content', chapterKey: '1', type: 'paragraph' });
    expect(rank).toBeGreaterThan(0);
    expect(snippet).toContain(`[[${TOK_1}]]`);
  });

  it('type=contractItem: alamat F:record/1, pid = M20; contractRecord memuat kartu', async () => {
    const items = await r22(`q=${hex8('B')}&type=contractItem`);
    const m20 = await tx().studioContractItem.findFirst({ where: { documentId: D.d1.id, itemKey: CARD_B, revisionNo: 2 }, select: { pid: true } });
    expect(items.hits.map((h: any) => [h.documentId, h.address, h.pid, h.type, h.slotKey, h.chapterKey])).toEqual([[D.d1.id, 'F:record/1', m20.pid, 'contractItem', 'record', null]]);
    const recs = await r22(`q=${hex8('B')}&type=contractRecord`);
    expect(recs.hits.map((h: any) => [h.documentId, h.address])).toEqual([[D.d2.id, 'F:record']]);
    const both = await r22(`q=${hex8('B')}`);
    expect(both.hits.map((h: any) => `${h.documentId}@${h.address}`).sort()).toEqual([`${D.d1.id}@F:record/1`, `${D.d2.id}@F:record`].sort());
  });

  it('kind dan mission: token bersama D1 (kontrak) + D5 (non-kontrak)', async () => {
    const all = await r22(`q=${TOK_SHARED}`);
    expect([...new Set(all.hits.map((h: any) => h.documentId))].sort()).toEqual(set('d1', 'd5'));
    const d5 = all.hits.find((h: any) => h.documentId === D.d5.id);
    expect(d5.kind).toBeNull();
    const kinded = await r22(`q=${TOK_SHARED}&kind=agentWorkReport`);
    expect(kinded.hits.map((h: any) => h.documentId)).toEqual([D.d1.id]);
    const scoped = await r22(`q=${TOK_SHARED}&mission=${FOLDER}&documentId=${D.d5.id}`);
    expect(scoped.hits.map((h: any) => h.documentId)).toEqual([D.d5.id]);
    expect((await r22(`q=${TOK_SHARED}&mission=2099-01-01_dc36-lain-${RUN_ID}`)).hits).toEqual([]);
  });

  it('sesudah R16 mengganti teks: bawaan = revisi terkini; revisionNo eksplisit membaca revisi lama', async () => {
    const blk = await blockAt(D.d1.id, 2, '1.1.1');
    const r = await call(
      patchPid(
        await req(`/api/studio/documents/${D.d1.id}/paragraphs/${blk.pid}`, { method: 'PATCH', auth: 'agent', body: withAgent({ op: 'replace', baseRevisionNo: 2, block: { type: 'paragraph', text: `Temuan ${TOK_1_NEW} pengganti.` }, change: CHANGE }) }),
        params({ id: D.d1.id, pid: blk.pid }),
      ),
    );
    expect(r.status, r.text.slice(0, 300)).toBe(200);
    expect(r.body.revision.revisionNo).toBe(3);
    expect((await r22(`q=${TOK_1}`)).hits).toEqual([]);
    const fresh = await r22(`q=${TOK_1_NEW}`);
    expect(fresh.hits.map((h: any) => [h.documentId, h.revisionNo, h.pid, h.address])).toEqual([[D.d1.id, 3, blk.pid, '1.1.1']]);
    const old = await r22(`q=${TOK_1}&documentId=${D.d1.id}&revisionNo=2`);
    expect(old.hits.map((h: any) => [h.documentId, h.revisionNo, h.pid, h.address])).toEqual([[D.d1.id, 2, blk.pid, '1.1.1']]);
    // R21 mengikuti revisi terkini (cermin MX09 tetap, revisionNo naik).
    expect((await r21(`mission=${FOLDER}&docKey=d1`)).contracts[0]).toMatchObject({ status: 'complete', revisionNo: 3 });
  });

  it('arsip D6 dikecualikan bawaan, ikut dengan includeArchived=1; q tanda baca saja -> hits []', async () => {
    const q = hex8('A');
    const def = await r22(`q=${q}&type=contractRecord`);
    expect(def.hits.map((h: any) => h.documentId)).toEqual([D.d1.id]);
    const opt = await r22(`q=${q}&type=contractRecord&includeArchived=1`);
    expect(opt.hits.map((h: any) => h.documentId).sort()).toEqual(set('d1', 'd6'));
    const punct = await r22(`q=${encodeURIComponent('!! ??')}`);
    expect(punct.hits).toEqual([]);
    expect(punct.nextCursor).toBeNull();
  });
});
