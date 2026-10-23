/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: (1) target dokumen R04 `studio.doc/v2` ke dokumen yang ada (SUB-1, D-232):
// `target.documentId` + `baseRevisionNo`, satu revisi `document;<lingkup>`; (2) gerbang bersama
// D-235/F-064: kiriman bab/slot/doc ke dokumen berpin templat TERBATAS -> 403 non-ADMIN, dan
// penanda kepercayaan tersimpan (x.lintEnforcement, D-134 R-01) dikupas untuk penulis tidak
// tepercaya. DB v21, fixture sementara 0 sisa.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postDocument } from '@/app/api/studio/documents/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { type Auth, call, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { CONTROL_SHEET, chapterBody, createExtra, missionTarget, simpleChapter, slotBody } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('trust');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function doc(body: Record<string, unknown>, auth: Auth = 'agent') {
  const r = await call(postDocument(await req('/api/studio/documents', { auth, body: withAgent(auth, body) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function chapter(body: Record<string, unknown>, auth: Auth = 'agent') {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth, body: withAgent(auth, body) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function slot(body: Record<string, unknown>, auth: Auth = 'agent') {
  const r = await call(postSlot(await req('/api/studio/slots', { auth, body: withAgent(auth, body) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function revCount(id: string) {
  return prisma.studioRevision.count({ where: { documentId: id } });
}
async function snapshotX(id: string, revisionNo: number): Promise<Record<string, unknown> | undefined> {
  const r = await prisma.studioRevision.findUnique({ where: { documentId_revisionNo: { documentId: id, revisionNo } }, select: { snapshot: true } });
  return ((r?.snapshot as any)?.source?.x ?? undefined) as Record<string, unknown> | undefined;
}

const TITLE = 'Dokumen Uji Struktur SR-45';
function docV2(extra: Record<string, unknown>): Record<string, unknown> {
  return { $schema: 'studio.doc/v2', template: { slug: 'datum-gsp' }, meta: { title: TITLE }, ...extra };
}
const contentWith = (...keys: string[]) => ({ content: { type: 'chapter', chapters: keys.map((k) => simpleChapter(k, `Isi doc v2 bab ${k}`)) } });

describe('SUB-1 (D-232): R04 studio.doc/v2 menarget dokumen yang ada', () => {
  let id = '';
  beforeAll(async () => {
    const r = await chapter(chapterBody(missionTarget(missionFolder('sub1')), simpleChapter('1'), createExtra('datum-gsp', TITLE)));
    expect(r.status).toBe(201);
    id = r.body.document.id;
  });

  it('target.documentId + baseRevisionNo 1 -> 201 satu revisi baru, changeScope document;chapter:1;chapter:2', async () => {
    const r = await doc(docV2({ target: { documentId: id }, baseRevisionNo: 1, sections: contentWith('1', '2') }));
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(201);
    expect(r.body.created).toBe(false);
    expect(r.body.document.id).toBe(id);
    expect(r.body.revision.revisionNo).toBe(2);
    expect(r.body.revision.changeScope).toBe('document;chapter:1;chapter:2');
    expect(await revCount(id)).toBe(2);
    expect(r.body.completeness).toBeDefined();
  });

  it('kirim ulang identik -> 200 unchanged, revisi tetap', async () => {
    const r = await doc(docV2({ target: { documentId: id }, baseRevisionNo: 2, sections: contentWith('1', '2') }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(200);
    expect(r.body.unchanged).toBe(true);
    expect(await revCount(id)).toBe(2);
  });

  it('base usang mengubah bab yang berubah sejak base -> 409 SCOPE_CONFLICT, 0 tulis', async () => {
    const r = await doc(docV2({ target: { documentId: id }, baseRevisionNo: 1, sections: { content: { type: 'chapter', chapters: [simpleChapter('2', 'Versi bentrok bab 2')] } } }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(409);
    expect(r.body.code).toBe('SCOPE_CONFLICT');
    expect(await revCount(id)).toBe(2);
  });

  it('target + mission -> 400 DOC_TARGET_AMBIGUOUS; target.docNumber -> 400 DOC_TARGET_AMBIGUOUS', async () => {
    const a = await doc(docV2({ target: { documentId: id }, mission: { folder: missionFolder('amb') }, sections: contentWith('3') }));
    expect(a.status).toBe(400);
    expect(a.body.code).toBe('DOC_TARGET_AMBIGUOUS');
    const b = await doc(docV2({ target: { docNumber: '999/GSP/X' }, sections: contentWith('3') }));
    expect(b.status).toBe(400);
    expect(b.body.code).toBe('DOC_TARGET_AMBIGUOUS');
  });

  it('baseRevisionNo 0 / target.foo -> 400 SCHEMA_INVALID berpointer', async () => {
    const a = await doc(docV2({ target: { documentId: id }, baseRevisionNo: 0, sections: contentWith('3') }));
    expect(a.status).toBe(400);
    expect(a.body.code).toBe('SCHEMA_INVALID');
    expect(JSON.stringify(a.body.details)).toContain('/baseRevisionNo');
    const b = await doc(docV2({ target: { documentId: id, foo: 1 }, sections: contentWith('3') }));
    expect(b.status).toBe(400);
    expect(b.body.code).toBe('SCHEMA_INVALID');
  });

  it('documentId asing -> 404 DOCUMENT_NOT_FOUND; judul beda -> 409 META_CONFLICT (0 tulis)', async () => {
    const a = await doc(docV2({ target: { documentId: 'cmsr45tidakada000000000' }, sections: contentWith('3') }));
    expect(a.status).toBe(404);
    expect(a.body.code).toBe('DOCUMENT_NOT_FOUND');
    const b = await doc({ ...docV2({ target: { documentId: id }, sections: contentWith('3') }), meta: { title: 'Judul Lain' } });
    expect(b.status, JSON.stringify(b.body).slice(0, 300)).toBe(409);
    expect(b.body.code).toBe('META_CONFLICT');
    expect(await revCount(id)).toBe(2);
  });
});

describe('F-064 (D-235): gerbang templat terbatas bersama dokumen/bab/slot', () => {
  let id = '';
  beforeAll(async () => {
    // datum-manual-000 v3 = templat TERBATAS (D-98); hanya ADMIN yang boleh membuat/menulis.
    const r = await chapter(chapterBody(missionTarget(missionFolder('restr')), simpleChapter('1'), createExtra('datum-manual-000', 'Manual Uji Terbatas SR-45')), 'admin');
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(201);
    id = r.body.document.id;
  });

  it.each<Auth>(['agent', 'user', 'google'])('%s: R12 bab (tanpa template) ke dokumen berpin terbatas -> 403 FORBIDDEN, 0 tulis', async (auth) => {
    const before = await revCount(id);
    const r = await chapter(chapterBody({ documentId: id }, simpleChapter('2')), auth);
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
    expect(await revCount(id)).toBe(before);
  });

  it.each<Auth>(['agent', 'user'])('%s: R13 slot ke dokumen berpin terbatas -> 403 FORBIDDEN, 0 tulis', async (auth) => {
    const before = await revCount(id);
    const r = await slot(slotBody({ documentId: id }, 'controlSheet', CONTROL_SHEET), auth);
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
    expect(await revCount(id)).toBe(before);
  });

  it('agen: R04 doc v2 bertarget ke dokumen berpin terbatas -> 403 FORBIDDEN, 0 tulis', async () => {
    const before = await revCount(id);
    const r = await doc({ $schema: 'studio.doc/v2', template: { slug: 'datum-manual-000' }, meta: { title: 'Manual Uji Terbatas SR-45' }, target: { documentId: id }, sections: contentWith('2') });
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
    expect(await revCount(id)).toBe(before);
  });

  it('ADMIN: R12 bab ke dokumen yang sama -> 201 (kontrol)', async () => {
    const r = await chapter(chapterBody({ documentId: id }, simpleChapter('2')), 'admin');
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
  });
});

describe('F-064 / D-134 R-01: penanda kepercayaan tersimpan dikupas untuk penulis tidak tepercaya', () => {
  const MARK = { lintEnforcement: { 'DATUM-04': 'release' } };
  async function seeded(tag: string): Promise<string> {
    const r = await doc(docV2({ mission: { folder: missionFolder(tag) }, docKey: 'laporan', x: MARK, sections: contentWith('1') }), 'admin');
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect((await snapshotX(r.body.document.id, 1))?.lintEnforcement).toEqual(MARK.lintEnforcement);
    return r.body.document.id;
  }

  it('agen: R12 bab -> revisi 2 tanpa x.lintEnforcement; revisi 1 tetap membawanya', async () => {
    const id = await seeded('mark-a');
    const r = await chapter(chapterBody({ documentId: id }, simpleChapter('2')));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
    expect((await snapshotX(id, 2))?.lintEnforcement).toBeUndefined();
    expect((await snapshotX(id, 1))?.lintEnforcement).toEqual(MARK.lintEnforcement);
  });

  it('USER: R13 slot -> revisi 2 tanpa x.lintEnforcement', async () => {
    const id = await seeded('mark-u');
    const r = await slot(slotBody({ documentId: id }, 'controlSheet', CONTROL_SHEET), 'user');
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
    expect((await snapshotX(id, 2))?.lintEnforcement).toBeUndefined();
  });

  it('agen: R04 doc v2 bertarget -> revisi 2 tanpa x.lintEnforcement', async () => {
    const id = await seeded('mark-d');
    const r = await doc(docV2({ target: { documentId: id }, baseRevisionNo: 1, sections: contentWith('2') }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
    expect((await snapshotX(id, 2))?.lintEnforcement).toBeUndefined();
  });

  it('ADMIN: R12 bab -> penanda tetap (kontrol)', async () => {
    const id = await seeded('mark-adm');
    const r = await chapter(chapterBody({ documentId: id }, simpleChapter('2')), 'admin');
    expect(r.status).toBe(201);
    expect((await snapshotX(id, 2))?.lintEnforcement).toEqual(MARK.lintEnforcement);
  });

  it('agen: penanda x.lintEnforcement dikirim sendiri di R04 v2 baru -> tidak tersimpan', async () => {
    const r = await doc(docV2({ mission: { folder: missionFolder('mark-self') }, docKey: 'laporan', x: MARK, sections: contentWith('1') }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
    expect((await snapshotX(r.body.document.id, 1))?.lintEnforcement).toBeUndefined();
  });
});
