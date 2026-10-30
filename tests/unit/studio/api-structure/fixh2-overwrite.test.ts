/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// FIX-H2 (D-321/D-322, uji Hermes C2): kiriman bab tidak boleh diam-diam menimpa paragraf yang
// disunting lewat PATCH pid setelah kiriman terakhir lingkupnya. DB v21 nyata (fixture sementara,
// 0 sisa; harness SR-45). Skenario Hermes: kirim bab -> PATCH pid -> kirim ulang payload lama -> 409.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { PATCH as patchPidRoute } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { GET as getContent } from '@/app/api/studio/documents/[id]/content/route';
import { AGENT_ID, AGENT_ID_2, call, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { CHANGE, chapterBody, createExtra, missionTarget, simpleChapter } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('fixh2');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

let docId = '';
async function chapter(body: Record<string, unknown>, agentId = AGENT_ID) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', body, agentId) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function patchPid(pid: string, body: Record<string, unknown>, agentId = AGENT_ID_2) {
  return call(patchPidRoute(await req(`/api/studio/documents/${docId}/paragraphs/${pid}`, { method: 'PATCH', auth: 'agent', body: { agentId, ...body } }), params({ id: docId, pid })));
}
async function latestRev(): Promise<number> {
  const d = await prisma.studioDocument.findUnique({ where: { id: docId }, select: { currentRevisionNo: true } });
  return d?.currentRevisionNo ?? 0;
}
async function revCount(): Promise<number> {
  return prisma.studioRevision.count({ where: { documentId: docId } });
}

describe('FIX-H2: kiriman ulang bab vs suntingan PATCH pid', () => {
  const old1 = simpleChapter('1');
  let editedPid = '';
  let editRev = 0;

  beforeAll(async () => {
    const folder = missionFolder('h2');
    const r1 = await chapter(chapterBody(missionTarget(folder), old1, createExtra()));
    expect(r1.status, JSON.stringify(r1.body).slice(0, 400)).toBe(201);
    docId = r1.body.document.id;
    const r2 = await chapter(chapterBody({ documentId: docId }, simpleChapter('2')));
    expect(r2.status).toBe(201);
    editedPid = r1.body.chapter.blocks.find((b: any) => b.address === '1.1.2').pid;
    const p = await patchPid(editedPid, { op: 'replace', baseRevisionNo: 2, block: { type: 'paragraph', text: 'Durasi pengukuran 93 menit (disunting lewat PATCH).' }, change: CHANGE });
    expect(p.status, JSON.stringify(p.body).slice(0, 400)).toBe(200);
    editRev = p.body.revision.revisionNo;
    expect(editRev).toBe(3);
  }, 60_000);

  it('Hermes C2: kirim ulang payload lama tanpa baseRevisionNo -> 409 SCOPE_CONFLICT berdaftar pid, 0 tulis', async () => {
    const before = await revCount();
    const r = await chapter(chapterBody({ documentId: docId }, old1));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(409);
    expect(r.body.code).toBe('SCOPE_CONFLICT');
    const d = r.body.details;
    expect(d.reason).toBe('PATCHED_PIDS_OVERWRITTEN');
    expect(d.scope).toBe('chapter:1');
    expect(d.referenceRevisionNo).toBe(1);
    expect(d.latestRevisionNo).toBe(editRev);
    expect(d.overwrittenPids).toEqual([{ pid: editedPid, address: '1.1.2', editedInRevision: editRev, editedBy: expect.stringContaining(AGENT_ID_2) }]);
    expect(d.forwardToController).toContain(`GET /api/studio/documents/${docId}/content`);
    expect(d.forwardToController).toContain(`baseRevisionNo ${editRev}`);
    expect(r.body.message ?? r.body.error ?? '').toBeTruthy();
    expect(await revCount()).toBe(before);
  });

  it('baseRevisionNo usang (< revisi sunting) -> 409 dengan pid yang sama', async () => {
    const r = await chapter(chapterBody({ documentId: docId }, old1, { baseRevisionNo: 2 }));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(409);
    expect(r.body.details.reason).toBe('PATCHED_PIDS_OVERWRITTEN');
    expect(r.body.details.baseRevisionNo).toBe(2);
    expect(r.body.details.overwrittenPids.map((p: any) => p.pid)).toEqual([editedPid]);
  });

  it('bab lain paralel tanpa baseRevisionNo -> keduanya 201 (lingkup berbeda, tanpa 409)', async () => {
    const [a, b] = await Promise.all([
      chapter(chapterBody({ documentId: docId }, simpleChapter('2', 'Isi bab 2 revisi')), AGENT_ID),
      chapter(chapterBody({ documentId: docId }, simpleChapter('3')), AGENT_ID_2),
    ]);
    expect(a.status, JSON.stringify(a.body).slice(0, 400)).toBe(201);
    expect(b.status, JSON.stringify(b.body).slice(0, 400)).toBe(201);
  });

  it('isi terkini digabung (pid tersunting tidak diubah) tanpa baseRevisionNo -> 201', async () => {
    const c = await call(getContent(await req(`/api/studio/documents/${docId}/content?slot=content&chapter=1`, { auth: 'user' }), params({ id: docId })));
    expect(c.status, JSON.stringify(c.body).slice(0, 300)).toBe(200);
    const merged = structuredClone(c.body.content);
    merged.sections[0].blocks[0].text = 'Isi bab 1: pengukuran beban dilakukan pada jam puncak dan jam lembah.';
    const r = await chapter(chapterBody({ documentId: docId }, merged));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.chapter.blocks.find((b: any) => b.pid === editedPid).address).toBe('1.1.2');
  });

  it('kirim payload lama dengan baseRevisionNo terbaru -> 201 (agen sadar menimpa), lalu identik -> 200 unchanged', async () => {
    // Sunting baru sesudah kiriman terakhir bab 1, lalu kiriman lama tanpa base kembali ditolak.
    const p = await patchPid(editedPid, { op: 'replace', baseRevisionNo: await latestRev(), block: { type: 'paragraph', text: 'Durasi pengukuran 92 menit (sunting kedua).' }, change: CHANGE });
    expect(p.status, JSON.stringify(p.body).slice(0, 300)).toBe(200);
    const denied = await chapter(chapterBody({ documentId: docId }, old1));
    expect(denied.status).toBe(409);
    expect(denied.body.details.overwrittenPids[0]).toMatchObject({ pid: editedPid, editedInRevision: p.body.revision.revisionNo });
    const latest = await latestRev();
    const ok = await chapter(chapterBody({ documentId: docId }, old1, { baseRevisionNo: latest }));
    expect(ok.status, JSON.stringify(ok.body).slice(0, 400)).toBe(201);
    expect(ok.body.revision.revisionNo).toBe(latest + 1);
    const same = await chapter(chapterBody({ documentId: docId }, old1));
    expect(same.status, JSON.stringify(same.body).slice(0, 300)).toBe(200);
    expect(same.body.unchanged).toBe(true);
  });

  it('paragraf yang DIHAPUS lewat PATCH lalu payload lama dikirim ulang -> 409 menyebut pid terhapus', async () => {
    const c = await call(getContent(await req(`/api/studio/documents/${docId}/content?slot=content&chapter=1`, { auth: 'user' }), params({ id: docId })));
    const victim = c.body.content.sections[0].blocks[1].id;
    const del = await patchPid(victim, { op: 'delete', baseRevisionNo: await latestRev(), change: CHANGE });
    expect(del.status, JSON.stringify(del.body).slice(0, 300)).toBe(200);
    const r = await chapter(chapterBody({ documentId: docId }, old1));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(409);
    expect(r.body.details.overwrittenPids).toEqual([expect.objectContaining({ pid: victim, address: '1.1.2', editedInRevision: del.body.revision.revisionNo })]);
  });
});
