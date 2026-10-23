/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45 lanjutan: R08 `/api/studio/validate` dry-run kiriman parsial v2 (D-272 FIX-V): transaksi
// READ ONLY tanpa kunci/tulis/build -> completenessPreview + submitPreview; pelanggaran = valid:false
// dengan isu sama seperti kiriman nyata (DATUM-04, DOCUMENT_NOT_FOUND, RENDER_FIELD), pointer relatif
// badan (D-275). DB v21, fixture 0 sisa.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { call, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { chapterBody, createExtra, missionTarget, simpleChapter } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('dryrun');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function validate(body: Record<string, unknown>) {
  return call(postValidate(await req('/api/studio/validate', { auth: 'agent', body: withAgent('agent', body) })));
}
async function counts() {
  return { docs: await prisma.studioDocument.count(), revs: await prisma.studioRevision.count(), jobs: await prisma.studioRenderJob.count() };
}

describe('R08 dry-run kiriman bab v2 (D-272)', () => {
  it('bab pertama ke misi baru -> 200 valid, submitPreview created/revisi 1, completenessPreview INCOMPLETE, 0 baris baru', async () => {
    const folder = missionFolder('dry');
    const before = await counts();
    const r = await validate(chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.valid).toBe(true);
    expect(r.body.submitPreview).toMatchObject({ documentId: null, created: true, unchanged: false, revisionNo: 1, changeScope: 'create;chapter:1' });
    expect(r.body.submitPreview.chapter).toMatchObject({ slotKey: 'content', chapterKey: '1', pid: 'bab-1' });
    expect(r.body.completenessPreview.status).toBe('INCOMPLETE');
    expect(r.body.completenessPreview.chapters.content.present.map((p: any) => p.key)).toEqual(['1']);
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
    const after = await counts();
    expect(after.jobs).toBe(before.jobs);
  });

  it('bab ke dokumen yang ada: pratinjau = kiriman nyata (revisi n+1, changeScope sama), tanpa tulis', async () => {
    const c = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', chapterBody(missionTarget(missionFolder('dry2')), simpleChapter('1'), createExtra())) })));
    trackDoc(c.body?.document?.id);
    expect(c.status).toBe(201);
    const id = c.body.document.id;
    const v = await validate(chapterBody({ documentId: id }, simpleChapter('2')));
    expect(v.status).toBe(200);
    expect(v.body.valid).toBe(true);
    expect(v.body.submitPreview).toMatchObject({ documentId: id, created: false, revisionNo: 2, changeScope: 'chapter:2' });
    expect(await prisma.studioRevision.count({ where: { documentId: id } })).toBe(1);
    const real = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', chapterBody({ documentId: id }, simpleChapter('2'))) })));
    expect(real.status).toBe(201);
    expect(real.body.revision).toMatchObject({ revisionNo: v.body.submitPreview.revisionNo, changeScope: v.body.submitPreview.changeScope });
    expect(real.body.completeness.missingRequired).toEqual(v.body.completenessPreview.missingRequired);
  });

  it('pelanggaran by-construction (tier TERBIT, judul pertanyaan) -> 200 valid:false, isu DATUM-04 berpointer /chapter/..., 0 dokumen', async () => {
    const folder = missionFolder('dry-bc');
    const ch = simpleChapter('1') as any;
    ch.sections[0].title = { text: 'Apa temuan utama kajian ini?' };
    const r = await validate(chapterBody(missionTarget(folder), ch, { template: { slug: 'datum-gsp' }, meta: { title: 'Dokumen Uji Struktur SR-45', tier: 'TERBIT' } }));
    expect(r.status).toBe(200);
    expect(r.body.valid).toBe(false);
    const iss = (r.body.issues as any[]).find((i) => i.checkId === 'DATUM-04');
    expect(iss, JSON.stringify(r.body.issues).slice(0, 400)).toBeDefined();
    expect(String(iss.pointer)).toMatch(/^\/chapter\//);
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });

  it('documentId asing -> valid:false isu DOCUMENT_NOT_FOUND; medan render -> valid:false isu RENDER_FIELD', async () => {
    const a = await validate(chapterBody({ documentId: 'cmsr45tidakada000000000' }, simpleChapter('1')));
    expect(a.status).toBe(200);
    expect(a.body.valid).toBe(false);
    expect(JSON.stringify(a.body.issues)).toContain('DOCUMENT_NOT_FOUND');
    const b = await validate(chapterBody(missionTarget(missionFolder('dry-r')), simpleChapter('1'), { ...createExtra(), render: { scope: 'chapter', key: '1', formats: ['docx'] } }));
    expect(b.status).toBe(200);
    expect(b.body.valid).toBe(false);
    expect((b.body.issues as any[]).some((i) => i.checkId === 'RENDER_FIELD')).toBe(true);
  });
});
