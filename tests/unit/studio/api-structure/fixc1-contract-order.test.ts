/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// FIX-C1 (temuan M1 gerbang DC-31, D-392): urutan evaluasi kiriman register 05 §5.6 / 03 §11.1.
// Langkah 2 (CONTRACT_DATE, 400) dan 6b (I54 EC27, 422, "murni, sebelum kunci") mendahului
// langkah 7 (409 SCOPE_CONFLICT, cek lingkup/basis di dalam kunci). Sebelum perbaikan, kiriman
// slot `record` dengan baseRevisionNo basi + payload salah dijawab 409. DB v21 nyata (fixture
// sementara, 0 sisa; harness SR-45); templat kontrak `laporan-kerja-agen` (MX08 agentWorkReport).
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { AGENT_ID, call, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { chapterBody, createExtra, missionTarget, simpleChapter, slotBody } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('fixc1');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function slot(body: Record<string, unknown>) {
  const r = await call(postSlot(await req('/api/studio/slots', { auth: 'agent', body: withAgent('agent', body, AGENT_ID) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function chapter(body: Record<string, unknown>) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', body, AGENT_ID) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function revCount(documentId: string): Promise<number> {
  return prisma.studioRevision.count({ where: { documentId } });
}

/** Payload catatan sah (register 05 §5.8, tanpa refs agar I55 tidak bergantung dokumen lain). */
function record(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'contractRecord',
    status: 'complete',
    owner: 'data-analyst',
    initiator: 'controller',
    taskRef: 'DC-02',
    reportedAt: '2026-10-30T19:30+07:00',
    items: [
      { key: 't_5943d415', title: { text: 'Kunci kosakata status dari korpus' }, status: 'done', owner: 'data-analyst' },
      { key: 'DC-03', title: { text: 'Protokol metrik efisiensi' }, status: 'ready' },
    ],
    ...over,
  };
}

describe('FIX-C1: kontrak (langkah 2/6b) mendahului cek lingkup (langkah 7) pada base basi', () => {
  let docId = '';
  beforeAll(async () => {
    const folder = missionFolder('c1');
    const r1 = await slot(slotBody(missionTarget(folder, 'laporan-kerja-fixc1'), 'record', record(), createExtra('laporan-kerja-agen', 'Laporan kerja FIX-C1')));
    expect(r1.status, JSON.stringify(r1.body).slice(0, 600)).toBe(201);
    docId = r1.body.document.id;
    // Revisi 2 mengubah lingkup slot:record -> baseRevisionNo 1 kini basi untuk lingkup itu.
    const r2 = await slot(slotBody({ documentId: docId }, 'record', record({ status: 'partial' }), { baseRevisionNo: 1 }));
    expect(r2.status, JSON.stringify(r2.body).slice(0, 600)).toBe(201);
    expect(r2.body.revision?.revisionNo ?? r2.body.revisionNo).toBe(2);
  }, 60_000);

  it('base basi + reportedAt tak sah (2026-02-30) -> 400 SCHEMA_INVALID checkId CONTRACT_DATE, 0 tulis', async () => {
    const before = await revCount(docId);
    const r = await slot(slotBody({ documentId: docId }, 'record', record({ reportedAt: '2026-02-30T10:00+07:00' }), { baseRevisionNo: 1 }));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(400);
    expect(r.body.code).toBe('SCHEMA_INVALID');
    const issues = r.body.details as any[];
    expect(issues.some((x) => x.checkId === 'CONTRACT_DATE' && x.pointer === '/payload/reportedAt')).toBe(true);
    expect(await revCount(docId)).toBe(before);
  });

  it('base basi + kunci butir ganda -> 422 CONTRACT_ITEM_KEY_DUPLICATE (EC27), 0 tulis', async () => {
    const before = await revCount(docId);
    const items = [
      { key: 'DC-03', title: { text: 'Satu' }, status: 'ready' },
      { key: 'DC-03', title: { text: 'Dua' }, status: 'done' },
    ];
    const r = await slot(slotBody({ documentId: docId }, 'record', record({ items }), { baseRevisionNo: 1 }));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(422);
    expect(r.body.code).toBe('CONTRACT_ITEM_KEY_DUPLICATE');
    expect(r.body.details).toMatchObject({ key: 'DC-03', positions: [1, 2] });
    expect(await revCount(docId)).toBe(before);
  });

  it('base basi + payload sah -> 409 SCOPE_CONFLICT tetap', async () => {
    const before = await revCount(docId);
    const r = await slot(slotBody({ documentId: docId }, 'record', record({ status: 'needs-review' }), { baseRevisionNo: 1 }));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(409);
    expect(r.body.code).toBe('SCOPE_CONFLICT');
    expect(await revCount(docId)).toBe(before);
  });

  it('R08 dry-run: base basi + reportedAt tak sah -> isu CONTRACT_DATE (bukan SCOPE_CONFLICT); payload sah -> SCOPE_CONFLICT', async () => {
    const validate = async (body: Record<string, unknown>) =>
      call(postValidate(await req('/api/studio/validate', { auth: 'agent', body: withAgent('agent', body, AGENT_ID) })));
    const bad = await validate(slotBody({ documentId: docId }, 'record', record({ reportedAt: '2026-02-30T10:00+07:00' }), { baseRevisionNo: 1 }));
    expect(bad.status, JSON.stringify(bad.body).slice(0, 600)).toBe(200);
    expect(bad.body.valid).toBe(false);
    const text = JSON.stringify(bad.body.issues);
    expect(text).toContain('CONTRACT_DATE');
    expect(text).not.toContain('SCOPE_CONFLICT');
    const ok = await validate(slotBody({ documentId: docId }, 'record', record({ status: 'needs-review' }), { baseRevisionNo: 1 }));
    expect(ok.body.valid).toBe(false);
    expect(JSON.stringify(ok.body.issues)).toContain('SCOPE_CONFLICT');
  });
});

describe('FIX-C1: dokumen non-kontrak urutan lama', () => {
  it('base basi + bab berubah -> 409 SCOPE_CONFLICT (tanpa langkah kontrak)', async () => {
    const folder = missionFolder('c1n');
    const r1 = await chapter(chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()));
    expect(r1.status, JSON.stringify(r1.body).slice(0, 400)).toBe(201);
    const id = r1.body.document.id;
    const r2 = await chapter(chapterBody({ documentId: id }, simpleChapter('1', 'Isi bab 1 diubah'), { baseRevisionNo: 1 }));
    expect(r2.status, JSON.stringify(r2.body).slice(0, 400)).toBe(201);
    const before = await revCount(id);
    const r3 = await chapter(chapterBody({ documentId: id }, simpleChapter('1', 'Isi bab 1 versi lain'), { baseRevisionNo: 1 }));
    expect(r3.status, JSON.stringify(r3.body).slice(0, 400)).toBe(409);
    expect(r3.body.code).toBe('SCOPE_CONFLICT');
    expect(await revCount(id)).toBe(before);
  });
});
