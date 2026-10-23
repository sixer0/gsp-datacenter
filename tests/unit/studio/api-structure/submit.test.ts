/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: kiriman parsial R12/R13 terhadap DB v21 nyata (fixture sementara, 0 sisa).
// Sumber ekspektasi: blueprint 05 §2.5-§2.7 (contoh E2, E3a, E3b), register 03 §7, §9, §11, §12.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';
import { GET as getCompleteness } from '@/app/api/studio/documents/[id]/completeness/route';
import { GET as getRevisions } from '@/app/api/studio/documents/[id]/revisions/route';
import { PATCH as patchStructure } from '@/app/api/studio/documents/[id]/structure/route';
import { GET as getDocuments } from '@/app/api/studio/documents/route';
import { AGENT_ID, AGENT_ID_2, call, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { CHANGE, CONTROL_SHEET, E2_TITLE, chapterBody, createExtra, e2Body, makePng, missionTarget, simpleChapter, slotBody } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('submit');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function chapter(body: Record<string, unknown>, auth: 'agent' | 'admin' | 'user' | 'google' = 'agent', agentId = AGENT_ID) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth, body: withAgent(auth, body, agentId) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function slot(body: Record<string, unknown>, auth: 'agent' | 'admin' | 'user' = 'agent') {
  const r = await call(postSlot(await req('/api/studio/slots', { auth, body: withAgent(auth, body) })));
  trackDoc(r.body?.document?.id);
  return r;
}

describe('E2 (blueprint §2.5): kiriman bab pertama membuat dokumen', () => {
  const folder = missionFolder('e2');
  let first: any;

  it('agen POST E2 -> 201 dokumen baru revisi 1, changeScope create;chapter:3, 8 blok beralamat', async () => {
    const r = await chapter(e2Body({ folder }));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(201);
    first = r.body;
    expect(r.body.created).toBe(true);
    expect(r.body.unchanged).toBe(false);
    expect(r.body.rebased).toBe(false);
    expect(r.body.document.missionFolder).toBe(folder);
    expect(r.body.document.docKey).toBe('laporan-survei');
    expect(r.body.document.template.slug).toBe('datum-gsp');
    expect(r.body.revision.revisionNo).toBe(1);
    expect(r.body.revision.changeScope).toBe('create;chapter:3');
    expect(r.body.chapter.slotKey).toBe('content');
    expect(r.body.chapter.chapterKey).toBe('3');
    expect(r.body.chapter.pid).toBe('bab-3');
    const blocks = r.body.chapter.blocks;
    expect(blocks.map((b: any) => b.address)).toEqual(['3.1.1', '3.1.2', '3.2.1', '3.2.2', '3.2.3', '3.2.4', '3.3.1', '3.3.2']);
    expect(blocks[4]).toMatchObject({ address: '3.2.3', type: 'image', artifactLabel: 'Gambar 3.1' });
    expect(blocks[7]).toMatchObject({ address: '3.3.2', type: 'table', artifactLabel: 'Tabel 3.1' });
    expect(new Set(blocks.map((b: any) => b.pid)).size).toBe(8);
  });

  it('E2 kelengkapan: INCOMPLETE, fullRenderAllowed false, bab 1-2 hilang, content PARTIAL, nextSteps + message', async () => {
    const c = first.completeness;
    expect(c.status).toBe('INCOMPLETE');
    expect(c.revisionNo).toBe(1);
    expect(c.fullRenderAllowed).toBe(false);
    expect(c.chapters.content.expected).toEqual(['1', '2', '3']);
    expect(c.chapters.content.missing).toEqual(['1', '2']);
    expect(c.chapters.content.present.map((p: any) => p.key)).toEqual(['3']);
    expect(c.chapters.content.present[0].by).toContain(AGENT_ID);
    expect(c.missingRequired).toEqual(expect.arrayContaining(['controlSheet', 'content:1', 'content:2']));
    const byKey = Object.fromEntries(c.slots.map((s: any) => [s.slotKey, s.state]));
    expect(byKey.content).toBe('PARTIAL');
    expect(byKey.controlSheet).toBe('EMPTY');
    expect(Array.isArray(c.nextSteps) && c.nextSteps.length > 0).toBe(true);
    expect(typeof c.message).toBe('string');
    expect(c.message).toContain(first.document.docNumber);
  });

  it('E2 blueprint §2.5: slot signature wajib ikut missingRequired (kerangka GSP bawaan)', () => {
    // Blueprint E2 menyebut controlSheet + signature EMPTY wajib. Temuan SR-21 mencatat
    // datum-gsp v1 implisit tanpa signature; uji ini memeriksa versi terbaru seed.
    expect(first.completeness.missingRequired).toContain('signature');
  });
});

describe('E2 idempotensi (§9.3): kirim ulang identik', () => {
  it('201 lalu 200 unchanged (revisi sama, revisi DB tidak bertambah)', async () => {
    const folder = missionFolder('idem');
    const png = makePng();
    const body = e2Body({ folder, png });
    const r1 = await chapter(body);
    expect(r1.status).toBe(201);
    const r2 = await chapter(body);
    expect(r2.status, JSON.stringify(r2.body).slice(0, 400)).toBe(200);
    expect(r2.body).toMatchObject({ created: false, unchanged: true, revision: { revisionNo: 1 } });
    expect(await prisma.studioRevision.count({ where: { documentId: r1.body.document.id } })).toBe(1);
  });

  it('bab berubah -> 201 revisi 2, changeScope chapter:3, changedAddresses hanya bab 3', async () => {
    const folder = missionFolder('upd');
    const png = makePng();
    const r1 = await chapter(e2Body({ folder, png }));
    expect(r1.status).toBe(201);
    const r2 = await chapter(e2Body({ folder, png, variant: ' Korosi bertambah.' }));
    expect(r2.status, JSON.stringify(r2.body).slice(0, 400)).toBe(201);
    expect(r2.body.created).toBe(false);
    expect(r2.body.revision).toMatchObject({ revisionNo: 2, changeScope: 'chapter:3' });
    const rev = await prisma.studioRevision.findFirst({ where: { documentId: r1.body.document.id, revisionNo: 2 }, select: { changedAddresses: true } });
    expect(rev?.changedAddresses.length).toBeGreaterThan(0);
    expect(rev?.changedAddresses.every((a) => a === '3' || a.startsWith('3.'))).toBe(true);
    // pid diwarisi pada posisi sama (§10): blok 3.2.2 yang diubah tetap pid lama.
    const pidOld = r1.body.chapter.blocks.find((b: any) => b.address === '3.2.2').pid;
    const pidNew = r2.body.chapter.blocks.find((b: any) => b.address === '3.2.2').pid;
    expect(pidNew).toBe(pidOld);
  });
});

describe('Validasi kiriman bab/slot (§2.7, §11)', () => {
  it('SLOT_USE_CHAPTER_ENDPOINT: slot berulang ke R13 -> 422 {slotKey, use}', async () => {
    const r = await slot(slotBody(missionTarget(missionFolder('suce')), 'content', { type: 'chapter', chapters: [] }, createExtra()));
    expect(r.status).toBe(422);
    expect(r.body.code).toBe('SLOT_USE_CHAPTER_ENDPOINT');
    expect(r.body.details).toMatchObject({ slotKey: 'content', use: 'POST /api/studio/chapters' });
  });

  it('DOC_TARGET_AMBIGUOUS: documentId + docNumber -> 400 {given}', async () => {
    const r = await chapter(chapterBody({ documentId: 'cmabc', docNumber: '999/GSP/X' }, simpleChapter('1')));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('DOC_TARGET_AMBIGUOUS');
    expect(r.body.details.given).toEqual(['documentId', 'docNumber']);
  });

  it('DOC_TARGET_AMBIGUOUS: docKey tanpa mission -> 400', async () => {
    const r = await chapter(chapterBody({ docKey: 'laporan' }, simpleChapter('1')));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('DOC_TARGET_AMBIGUOUS');
  });

  it('META_REQUIRED_FOR_CREATE: target misi baru tanpa template/meta.title -> 400, 0 dokumen', async () => {
    const folder = missionFolder('meta');
    const r = await chapter(chapterBody(missionTarget(folder), simpleChapter('1')));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('META_REQUIRED_FOR_CREATE');
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });

  it('SCHEMA_INVALID + DISPLAY_FIELD: medan tampilan di blok -> 400 berpointer', async () => {
    const ch = simpleChapter('1') as any;
    ch.sections[0].blocks[0].format = { bold: true };
    const r = await chapter(chapterBody(missionTarget(missionFolder('disp')), ch, createExtra()));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('SCHEMA_INVALID');
    const issues = r.body.details as any[];
    expect(issues.some((i) => i.checkId === 'DISPLAY_FIELD' && String(i.pointer).includes('/chapter/sections/0/blocks/0'))).toBe(true);
  });

  it('DOCUMENT_NOT_FOUND: documentId asing -> 404', async () => {
    const r = await chapter(chapterBody({ documentId: 'cmsr45tidakada000000000' }, simpleChapter('1')));
    expect(r.status).toBe(404);
    expect(r.body.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('kiriman slot pertama membuat dokumen: 201 changeScope create;slot:controlSheet', async () => {
    const r = await slot(slotBody(missionTarget(missionFolder('slot1')), 'controlSheet', CONTROL_SHEET, createExtra()));
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(201);
    expect(r.body.created).toBe(true);
    expect(r.body.revision.changeScope).toBe('create;slot:controlSheet');
    expect(r.body.slot.slotKey).toBe('controlSheet');
    expect(r.body.completeness.slots.find((s: any) => s.slotKey === 'controlSheet').state).toBe('FILLED');
  });
});

describe('E3a (§2.6): kiriman bab paralel tanpa 409, SCOPE_CONFLICT untuk lingkup sama', () => {
  let docId = '';
  let base = 0;

  beforeAll(async () => {
    const folder = missionFolder('e3a');
    const r1 = await chapter(chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()));
    expect(r1.status).toBe(201);
    docId = r1.body.document.id;
    const r2 = await chapter(chapterBody({ documentId: docId }, simpleChapter('2')));
    expect(r2.status).toBe(201);
    const outline = await call(
      patchStructure(
        await req(`/api/studio/documents/${docId}/structure`, {
          method: 'PATCH',
          auth: 'agent',
          body: {
            agentId: AGENT_ID,
            op: 'setOutline',
            baseRevisionNo: 2,
            outline: ['1', '2', '3', '4', '5'].map((key) => ({ key })),
            change: CHANGE,
          },
        }),
        params({ id: docId }),
      ),
    );
    expect(outline.status, JSON.stringify(outline.body).slice(0, 500)).toBe(200);
    base = outline.body.revision.revisionNo;
    expect(base).toBe(3);
    expect(outline.body.completeness.chapters.content.expected).toEqual(['1', '2', '3', '4', '5']);
  }, 60_000);

  it('agen 1 (bab 3) dan agen 2 (bab 5) bersamaan dengan baseRevisionNo sama -> keduanya 201, tanpa 409', async () => {
    const [a, b] = await Promise.all([
      chapter(chapterBody({ documentId: docId }, simpleChapter('3'), { baseRevisionNo: base }), 'agent', AGENT_ID),
      chapter(chapterBody({ documentId: docId }, simpleChapter('5'), { baseRevisionNo: base }), 'agent', AGENT_ID_2),
    ]);
    expect(a.status, JSON.stringify(a.body).slice(0, 400)).toBe(201);
    expect(b.status, JSON.stringify(b.body).slice(0, 400)).toBe(201);
    const revs = [a.body.revision.revisionNo, b.body.revision.revisionNo].sort();
    expect(revs).toEqual([base + 1, base + 2]);
    const later = a.body.revision.revisionNo > b.body.revision.revisionNo ? a.body : b.body;
    const earlier = later === a.body ? b.body : a.body;
    expect(earlier.rebased).toBe(false);
    expect(later.rebased).toBe(true);
    expect(later.baseRevisionNo).toBe(base);
    expect(later.appliedOnRevisionNo).toBe(base + 1);
    expect(earlier.completeness.status).toBe('INCOMPLETE');
    expect(later.completeness.chapters.content.missing).toEqual(['4']);
    expect(later.completeness.missingRequired).toContain('content:4');
  });

  it('SCOPE_CONFLICT: bab 3 dengan base usang setelah bab 3 berubah -> 409 berdetail, 0 tulis', async () => {
    const before = await prisma.studioRevision.count({ where: { documentId: docId } });
    const r = await chapter(chapterBody({ documentId: docId }, simpleChapter('3', 'Isi bab 3 versi lain'), { baseRevisionNo: base }));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(409);
    expect(r.body.code).toBe('SCOPE_CONFLICT');
    expect(JSON.stringify(r.body.details)).toContain('chapter:3');
    expect(r.body.details.changedInRevisionNo).toBeGreaterThan(base);
    expect(await prisma.studioRevision.count({ where: { documentId: docId } })).toBe(before);
  });

  it('E3b: render penuh saat INCOMPLETE -> 409 DOCUMENT_INCOMPLETE + completeness + allowedScopes + forwardToController', async () => {
    const r = await call(postRender(await req(`/api/studio/documents/${docId}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'document', formats: ['docx'] } }), params({ id: docId })));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(409);
    expect(r.body.code).toBe('DOCUMENT_INCOMPLETE');
    expect(r.body.details.completeness.status).toBe('INCOMPLETE');
    expect(r.body.details.completeness.missingRequired).toContain('content:4');
    expect(r.body.details.completeness.chapters.content.missing).toEqual(['4']);
    expect(r.body.details.allowedScopes).toEqual(['chapter', 'slot']);
    expect(typeof r.body.details.forwardToController).toBe('string');
    expect(r.body.details.forwardToController).toContain('4');
    expect(await prisma.studioRenderJob.count({ where: { documentId: docId } })).toBe(0);
  });

  it('D-247/D-261: medan render di kiriman bab -> 400 SCHEMA_INVALID checkId RENDER_FIELD, 0 tulis', async () => {
    const before = await prisma.studioRevision.count({ where: { documentId: docId } });
    const r = await chapter(chapterBody({ documentId: docId }, simpleChapter('2', 'Isi bab 2 diperbarui'), { render: { scope: 'document', formats: ['docx'] } }));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(400);
    // D-261: 400 SCHEMA_INVALID dengan issue checkId RENDER_FIELD (pesan menunjuk endpoint render).
    expect(r.body.code).toBe('SCHEMA_INVALID');
    expect((r.body.details as any[]).some((i) => i.checkId === 'RENDER_FIELD' && String(i.pointer).startsWith('/render'))).toBe(true);
    expect(JSON.stringify(r.body)).toMatch(/\/render/);
    expect(await prisma.studioRevision.count({ where: { documentId: docId } })).toBe(before);
  });

  it('R15 completeness GET dan R07 riwayat memuat changeScope per revisi', async () => {
    const c = await call(getCompleteness(await req(`/api/studio/documents/${docId}/completeness`, { auth: 'user' }), params({ id: docId })));
    expect(c.status).toBe(200);
    expect(c.body.documentId).toBe(docId);
    expect(c.body.completeness.status).toBe('INCOMPLETE');
    const h = await call(getRevisions(await req(`/api/studio/documents/${docId}/revisions`, { auth: 'user' }), params({ id: docId })));
    expect(h.status).toBe(200);
    const scopes = (h.body.revisions as any[]).map((x) => x.changeScope);
    expect(scopes).toEqual(expect.arrayContaining(['create;chapter:1', 'chapter:2', 'chapter:3', 'chapter:5']));
  });
});

describe('Judul E2 tetap', () => {
  it('meta.title E2 tersimpan sebagai judul dokumen', async () => {
    const folder = missionFolder('title');
    const r = await chapter(e2Body({ folder }));
    expect(r.status).toBe(201);
    const d = await prisma.studioDocument.findUnique({ where: { id: r.body.document.id }, select: { title: true, completeness: true } });
    expect(d).toMatchObject({ title: E2_TITLE, completeness: 'INCOMPLETE' });
  });
});

describe('Struktur dan galat tambahan (R13, R14, R17, R04 GET)', () => {
  let id = '';
  const folder = missionFolder('extra');
  beforeAll(async () => {
    const r = await chapter(chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()));
    expect(r.status).toBe(201);
    id = r.body.document.id;
  });

  it('R13 SLOT_UNKNOWN (slot di luar kerangka) -> 422; SLOT_TYPE_MISMATCH (payload signatureBlock ke controlSheet) -> 422', async () => {
    const a = await slot(slotBody({ documentId: id }, 'tidakAda', CONTROL_SHEET));
    expect(a.status, JSON.stringify(a.body).slice(0, 300)).toBe(422);
    expect(a.body.code).toBe('SLOT_UNKNOWN');
    const b = await slot(slotBody({ documentId: id }, 'controlSheet', { type: 'signatureBlock', roles: [{ role: { text: 'Disusun' }, holder: { text: 'Analis' } }] }));
    expect(b.status, JSON.stringify(b.body).slice(0, 300)).toBe(422);
    expect(b.body.code).toBe('SLOT_TYPE_MISMATCH');
  });

  it('R12 lampiran: slot appendices kunci A -> 201 changeScope chapter:A (slot appendices)', async () => {
    const r = await chapter(chapterBody({ documentId: id }, simpleChapter('A'), { slot: 'appendices' }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
    expect(r.body.chapter.slotKey).toBe('appendices');
    expect(r.body.revision.changeScope).toContain('A');
  });

  it('R14 PATCH renumberChapters oleh agen -> 403 FORBIDDEN; tanpa change -> 400 CHANGE_FIELDS_REQUIRED', async () => {
    const base = (await prisma.studioDocument.findUnique({ where: { id }, select: { currentRevisionNo: true } }))!.currentRevisionNo;
    const a = await call(patchStructure(await req(`/api/studio/documents/${id}/structure`, { method: 'PATCH', auth: 'agent', body: { agentId: AGENT_ID, op: 'renumberChapters', baseRevisionNo: base, map: { '1': '2' }, change: CHANGE } }), params({ id })));
    expect(a.status, JSON.stringify(a.body).slice(0, 300)).toBe(403);
    expect(a.body.code).toBe('FORBIDDEN');
    const b = await call(patchStructure(await req(`/api/studio/documents/${id}/structure`, { method: 'PATCH', auth: 'agent', body: { agentId: AGENT_ID, op: 'setOutline', baseRevisionNo: base, outline: [{ key: '1' }] } }), params({ id })));
    expect(b.status).toBe(400);
    expect(b.body.code).toBe('CHANGE_FIELDS_REQUIRED');
    expect((await prisma.studioDocument.findUnique({ where: { id }, select: { currentRevisionNo: true } }))!.currentRevisionNo).toBe(base);
  });

  it('R17: slot tak dikenal -> 422 SLOT_UNKNOWN; bab tak ada -> 404 ADDRESS_NOT_FOUND', async () => {
    const a = await call(postRender(await req(`/api/studio/documents/${id}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'slot', key: 'tidakAda', formats: ['docx'] } }), params({ id })));
    expect(a.status, JSON.stringify(a.body).slice(0, 300)).toBe(422);
    expect(a.body.code).toBe('SLOT_UNKNOWN');
    const b = await call(postRender(await req(`/api/studio/documents/${id}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'chapter', key: '9', formats: ['docx'] } }), params({ id })));
    expect(b.status, JSON.stringify(b.body).slice(0, 300)).toBe(404);
    expect(b.body.code).toBe('ADDRESS_NOT_FOUND');
  });

  it('R04 GET ?mission= memuat docKey + completeness {status, missingRequired}', async () => {
    const r = await call(getDocuments(await req(`/api/studio/documents?mission=${encodeURIComponent(folder)}`, { auth: 'user' })));
    expect(r.status).toBe(200);
    expect(r.body.documents).toHaveLength(1);
    expect(r.body.documents[0]).toMatchObject({ id, docKey: 'laporan-survei', completeness: { status: 'INCOMPLETE' } });
    expect(Array.isArray(r.body.documents[0].completeness.missingRequired)).toBe(true);
  });
});

describe('F-065 (D-261) + D-275: gerbang by-construction di R12, pointer badan', () => {
  it('judul section berupa pertanyaan, tier TERBIT -> 422 BY_CONSTRUCTION_FAILED (DATUM-04), tanpa dokumen', async () => {
    const folder = missionFolder('bc');
    const ch = simpleChapter('1') as any;
    ch.sections[0].title = { text: 'Apa temuan utama kajian ini?' };
    const r = await chapter(chapterBody(missionTarget(folder), ch, { template: { slug: 'datum-gsp' }, meta: { title: 'Dokumen Uji Struktur SR-45', tier: 'TERBIT' } }));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(422);
    expect(r.body.code).toBe('BY_CONSTRUCTION_FAILED');
    const iss = (r.body.details as any[]).find((i) => i.checkId === 'DATUM-04');
    expect(iss, JSON.stringify(r.body.details).slice(0, 400)).toBeDefined();
    // D-275: pointer relatif badan kiriman bab (/chapter/...), pointer dokumen tergabung sebagai mergedPointer.
    expect(String(iss.pointer)).toMatch(/^\/chapter\/sections\/0/);
    expect(typeof iss.mergedPointer).toBe('string');
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });
});
