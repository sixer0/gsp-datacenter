/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: sunting per pid (R16), baca isi round-trip (R20), baca struktur (R05/R14/R15) dan
// contoh E3c (blueprint 05 §2.6) pada dokumen COMPLETE di DB v21 (fixture sementara, 0 sisa).
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { GET as getPid, PATCH as patchPidRoute } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { GET as getContent } from '@/app/api/studio/documents/[id]/content/route';
import { GET as getDoc } from '@/app/api/studio/documents/[id]/route';
import { GET as getStructure } from '@/app/api/studio/documents/[id]/structure/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';
import { AGENT_ID, AGENT_ID_2, call, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { CHANGE, CONTROL_SHEET, SIGNATURE, chapterBody, e2Body, makePng, simpleChapter, slotBody } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('pid');
let docId = '';
let docNumber = '';
let e2Blocks: Array<{ address: string; pid: string; type: string }> = [];
let completeRev = 0;

async function chapter(body: Record<string, unknown>, agentId = AGENT_ID) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', body, agentId) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function slot(body: Record<string, unknown>) {
  const r = await call(postSlot(await req('/api/studio/slots', { auth: 'agent', body: withAgent('agent', body) })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function patchPid(pid: string, body: Record<string, unknown>, agentId = AGENT_ID) {
  return call(
    patchPidRoute(
      await req(`/api/studio/documents/${docId}/paragraphs/${pid}`, { method: 'PATCH', auth: 'agent', body: { agentId, ...body } }),
      params({ id: docId, pid }),
    ),
  );
}
async function readPid(pid: string, query = '') {
  return call(getPid(await req(`/api/studio/documents/${docId}/paragraphs/${pid}${query}`, { auth: 'user' }), params({ id: docId, pid })));
}
async function content(query = '') {
  return call(getContent(await req(`/api/studio/documents/${docId}/content${query}`, { auth: 'user' }), params({ id: docId })));
}
async function latestRev(): Promise<number> {
  const d = await prisma.studioDocument.findUnique({ where: { id: docId }, select: { currentRevisionNo: true } });
  return d?.currentRevisionNo ?? 0;
}

beforeAll(async () => {
  await guard.setup();
  // Dokumen COMPLETE: bab 3 (E2) lalu bab 1, 2, Lembar Kendali, Tanda Tangan.
  const folder = missionFolder('pid');
  const r = await chapter(e2Body({ folder, png: makePng(8, 8) }));
  expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
  docId = r.body.document.id;
  docNumber = r.body.document.docNumber;
  e2Blocks = r.body.chapter.blocks;
  for (const k of ['1', '2']) expect((await chapter(chapterBody({ documentId: docId }, simpleChapter(k)))).status).toBe(201);
  expect((await slot(slotBody({ documentId: docId }, 'controlSheet', CONTROL_SHEET))).status).toBe(201);
  const last = await slot(slotBody({ documentId: docId }, 'signature', SIGNATURE));
  expect(last.status, JSON.stringify(last.body).slice(0, 400)).toBe(201);
  completeRev = last.body.revision.revisionNo;
  expect(last.body.completeness.status, JSON.stringify(last.body.completeness.missingRequired)).toBe('COMPLETE');
}, 120_000);

afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

describe('Dokumen COMPLETE: baca struktur dan kelengkapan', () => {
  it('kelengkapan COMPLETE: fullRenderAllowed, missingRequired kosong, tanpa forwardToController', async () => {
    const d = await call(getDoc(await req(`/api/studio/documents/${docId}`, { auth: 'google' }), params({ id: docId })));
    expect(d.status).toBe(200);
    expect(d.body.completeness.status).toBe('COMPLETE');
    expect(d.body.completeness.fullRenderAllowed).toBe(true);
    expect(d.body.completeness.missingRequired).toEqual([]);
    expect(d.body.completeness.forwardToController).toBeUndefined();
  });

  it('R05 GET: slots[] memuat bab beserta pid, alamat, blok dan artifactLabel', async () => {
    const d = await call(getDoc(await req(`/api/studio/documents/${docId}`, { auth: 'user' }), params({ id: docId })));
    const contentSlot = (d.body.slots as any[]).find((s) => s.slotKey === 'content');
    expect(contentSlot.chapters.map((c: any) => c.key)).toEqual(['1', '2', '3']);
    const ch3 = contentSlot.chapters.find((c: any) => c.key === '3');
    expect(ch3.pid).toBe('bab-3');
    const blocks = ch3.sections.flatMap((s: any) => s.blocks);
    expect(blocks.find((b: any) => b.address === '3.2.3')).toMatchObject({ type: 'image', artifactLabel: 'Gambar 3.1' });
  });

  it('R14 GET struktur: order slot, templateVersion, completeness', async () => {
    const s = await call(getStructure(await req(`/api/studio/documents/${docId}/structure`, { auth: 'agent' }), params({ id: docId })));
    expect(s.status).toBe(200);
    expect(s.body.order).toEqual(expect.arrayContaining(['cover', 'controlSheet', 'signature', 'content']));
    expect(s.body.templateVersion.slug).toBe('datum-gsp');
    expect(s.body.completeness.status).toBe('COMPLETE');
  });
});

describe('Baca isi round-trip (R20 -> kirim ulang -> unchanged)', () => {
  it('R20 slot=content&chapter=3 -> ChapterV2 dengan id di bab, section, blok', async () => {
    const r = await content('?slot=content&chapter=3');
    expect(r.status).toBe(200);
    expect(r.body.document).toEqual({ id: docId, docNumber });
    expect(r.body.slot).toBe('content');
    const ch = r.body.content;
    expect(ch.id).toBe('bab-3');
    expect(ch.sections).toHaveLength(3);
    expect(ch.sections.every((s: any) => typeof s.id === 'string')).toBe(true);
    const ids = ch.sections.flatMap((s: any) => s.blocks.map((b: any) => b.id));
    expect(ids).toEqual(e2Blocks.map((b) => b.pid));
  });

  it('kirim balik isi R20 apa adanya (dengan pid) -> 200 unchanged, revisi tetap (KD-13)', async () => {
    const before = await latestRev();
    const full = await content();
    expect(full.status).toBe(200);
    const ch = (await content('?slot=content&chapter=3')).body.content;
    const r = await chapter(chapterBody({ documentId: docId }, ch, { assets: full.body.content.assets }));
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    expect(r.body.unchanged).toBe(true);
    expect(r.body.revision.revisionNo).toBe(before);
    expect(await latestRev()).toBe(before);
  });

  it('kirim balik isi R20 tanpa id -> juga 200 unchanged', async () => {
    const strip = (v: any): any => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, strip(x)])) : v);
    const full = await content();
    const ch = strip((await content('?slot=content&chapter=3')).body.content);
    const r = await chapter(chapterBody({ documentId: docId }, ch, { assets: full.body.content.assets }));
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    expect(r.body.unchanged).toBe(true);
  });

  it('R20 slot=controlSheet -> payload slot; slot tak dikenal 422 SLOT_UNKNOWN; bab tak ada 404 ADDRESS_NOT_FOUND', async () => {
    const cs = await content('?slot=controlSheet');
    expect(cs.status).toBe(200);
    expect(cs.body.content.type).toBe('controlSheet');
    const unk = await content('?slot=tidakAda');
    expect(unk.status).toBe(422);
    expect(unk.body.code).toBe('SLOT_UNKNOWN');
    const miss = await content('?slot=content&chapter=9');
    expect(miss.status).toBe(404);
    expect(miss.body.code).toBe('ADDRESS_NOT_FOUND');
  });
});

describe('E3c (§2.6, D-247): PATCH satu paragraf by pid dengan base usang lalu render penuh lewat R17', () => {
  it('replace 3.2.2 base usang -> 200 rebased, pid/alamat tetap, addressMap {}, COMPLETE', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.2')!.pid;
    const staleBase = completeRev - 2;
    const r = await patchPid(pid, {
      op: 'replace',
      baseRevisionNo: staleBase,
      block: { type: 'paragraph', text: 'PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi sumber.' },
      change: { what: 'Perbarui temuan PMT-2', why: 'Hasil inspeksi ulang 2026-10-22', impact: 'Paragraf 3.2.2 saja' },
    });
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(200);
    expect(r.body.revision).toMatchObject({ revisionNo: completeRev + 1, changeScope: `pid:${pid}` });
    expect(r.body.pid).toBe(pid);
    expect(r.body.address).toBe('3.2.2');
    expect(r.body.rebased).toBe(true);
    expect(r.body.baseRevisionNo).toBe(staleBase);
    expect(r.body.appliedOnRevisionNo).toBe(completeRev);
    expect(r.body.addressMap).toEqual({});
    expect(r.body.completeness).toMatchObject({ status: 'COMPLETE', fullRenderAllowed: true });
    const got = await readPid(pid);
    expect(got.body.content.text).toContain('korosi berat');
  });

  it('render penuh R17 scope document pada revisi COMPLETE -> 200 job DOCUMENT tidak draf, keluaran DOCX', async () => {
    const r = await call(postRender(await req(`/api/studio/documents/${docId}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'document', formats: ['docx'] } }), params({ id: docId })));
    expect(r.status, JSON.stringify(r.body).slice(0, 600)).toBe(200);
    expect(r.body.job.scope.kind).toBe('DOCUMENT');
    expect(r.body.job.draft).toBe(false);
    expect(r.body.job.status, JSON.stringify(r.body.job).slice(0, 400)).toBe('SUCCEEDED');
    expect(r.body.job.formats).toEqual(['DOCX']);
    expect((r.body.outputs as any[]).some((o) => o.format === 'DOCX' && o.draft !== true)).toBe(true);
    expect(r.body.completeness.status).toBe('COMPLETE');
  }, 180_000);

  it('D-247/D-261: PATCH pid yang membawa medan render -> 400 SCHEMA_INVALID RENDER_FIELD, 0 tulis', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.2')!.pid;
    const before = await prisma.studioRevision.count({ where: { documentId: docId } });
    const r = await patchPid(pid, {
      op: 'replace',
      baseRevisionNo: await latestRev(),
      block: { type: 'paragraph', text: 'Paragraf dengan permintaan render di badan.' },
      change: CHANGE,
      render: { scope: 'document', formats: ['docx'] },
    });
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(400);
    expect(r.body.code).toBe('SCHEMA_INVALID');
    expect((r.body.details as any[]).some((i) => i.checkId === 'RENDER_FIELD')).toBe(true);
    expect(await prisma.studioRevision.count({ where: { documentId: docId } })).toBe(before);
  });
});

describe('Op pid (E34): replace/insert/delete/move, paragraf -> gambar', () => {
  it('insertAfter 3.1.1 -> newPid di 3.1.2, addressMap menggeser 3.1.2 -> 3.1.3', async () => {
    const anchor = e2Blocks.find((b) => b.address === '3.1.1')!.pid;
    const base = await latestRev();
    const r = await patchPid(anchor, { op: 'insertAfter', baseRevisionNo: base, block: { type: 'paragraph', text: 'Paragraf sisipan uji SR-45.' }, change: CHANGE });
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    expect(typeof r.body.newPid).toBe('string');
    expect(r.body.newPid).not.toBe(anchor);
    expect(r.body.address).toBe('3.1.2');
    expect(r.body.addressMap).toMatchObject({ '3.1.2': '3.1.3' });
    const got = await readPid(r.body.newPid);
    expect(got.status).toBe(200);
    expect(got.body).toMatchObject({ pid: r.body.newPid, address: '3.1.2', type: 'paragraph', kind: 'BLOCK' });
  });

  it('replace paragraf -> gambar: pid tetap, tipe berubah, label artefak dihitung ulang', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.4')!.pid;
    const r = await patchPid(pid, {
      op: 'replace',
      baseRevisionNo: await latestRev(),
      block: { type: 'image', asset: 'foto-pmt2', caption: { text: 'Terminal PMT-2 setelah dibersihkan' }, source: { text: 'Foto lapangan 2026-10-22', provenance: ['TERUKUR'] } },
      change: CHANGE,
    });
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    expect(r.body.pid).toBe(pid);
    const got = await readPid(pid);
    expect(got.body.type).toBe('image');
    expect(got.body.content).toMatchObject({ type: 'image', asset: 'foto-pmt2', id: pid });
    const d = await call(getDoc(await req(`/api/studio/documents/${docId}`, { auth: 'user' }), params({ id: docId })));
    const ch3 = (d.body.slots as any[]).find((s) => s.slotKey === 'content').chapters.find((c: any) => c.key === '3');
    const imgs = ch3.sections.flatMap((s: any) => s.blocks).filter((b: any) => b.type === 'image');
    expect(imgs.map((b: any) => b.artifactLabel)).toEqual(['Gambar 3.1', 'Gambar 3.2']);
  });

  it('move paragraf 3.1.2 ke awal bab 1 section 1 -> addressMap memuat alamat lama -> baru', async () => {
    const r0 = await content('?slot=content&chapter=3');
    const movePid = r0.body.content.sections[0].blocks[1].id;
    const r = await patchPid(movePid, { op: 'move', baseRevisionNo: await latestRev(), to: { section: { chapterKey: '1', sectionNo: 1, at: 1 } }, change: CHANGE });
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    expect(r.body.address).toBe('1.1.1');
    expect(r.body.addressMap['3.1.2']).toBe('1.1.1');
    const got = await readPid(movePid);
    expect(got.body.address).toBe('1.1.1');
  });

  it('delete -> pid pensiun: GET 404 PID_NOT_FOUND dengan retiredRevisionNo; pid lama tetap terbaca di ?rev lama', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.3.1')!.pid;
    const before = await latestRev();
    const r = await patchPid(pid, { op: 'delete', baseRevisionNo: before, change: CHANGE });
    expect(r.status, JSON.stringify(r.body).slice(0, 500)).toBe(200);
    const gone = await readPid(pid);
    expect(gone.status).toBe(404);
    expect(gone.body.code).toBe('PID_NOT_FOUND');
    expect(gone.body.details?.retiredRevisionNo).toBe(before + 1);
    const old = await readPid(pid, `?rev=${before}`);
    expect(old.status).toBe(200);
  });

  it('SCOPE_CONFLICT: pid diubah agen lain sejak base -> 409 {pid, baseRevisionNo, changedInRevisionNo, changedBy, currentContent}', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.1')!.pid;
    const base = await latestRev();
    const a = await patchPid(pid, { op: 'replace', baseRevisionNo: base, block: { type: 'paragraph', text: 'Versi agen dua untuk paragraf 3.2.1.' }, change: CHANGE }, AGENT_ID_2);
    expect(a.status).toBe(200);
    const writes = await prisma.studioRevision.count({ where: { documentId: docId } });
    const b = await patchPid(pid, { op: 'replace', baseRevisionNo: base, block: { type: 'paragraph', text: 'Versi agen satu untuk paragraf 3.2.1.' }, change: CHANGE });
    expect(b.status, JSON.stringify(b.body).slice(0, 500)).toBe(409);
    expect(b.body.code).toBe('SCOPE_CONFLICT');
    expect(b.body.details).toMatchObject({ pid, baseRevisionNo: base, changedInRevisionNo: base + 1 });
    expect(String(b.body.details.changedBy)).toContain(AGENT_ID_2);
    expect(JSON.stringify(b.body.details.currentContent)).toContain('Versi agen dua');
    expect(await prisma.studioRevision.count({ where: { documentId: docId } })).toBe(writes);
  });

  it('pid lain dengan base usang (lingkup berbeda) -> 200 rebased, bukan 409', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.1')!.pid;
    const other = e2Blocks.find((b) => b.address === '3.2.3')!.pid; // gambar
    const base = (await latestRev()) - 1;
    const r = await patchPid(other, {
      op: 'replace',
      baseRevisionNo: base,
      block: { type: 'image', asset: 'foto-pmt2', caption: { text: 'Korosi pada terminal PMT-2 (diperbarui)' }, source: { text: 'Foto lapangan 2026-10-20', provenance: ['TERUKUR'] } },
      change: CHANGE,
    });
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.rebased).toBe(true);
    expect(pid).not.toBe(other);
  });

  it('PID_NOT_FOUND (pid tak dikenal) 404; CHANGE_FIELDS_REQUIRED (tanpa change) 400 tanpa tulis', async () => {
    const nf = await patchPid('p-zzzzzzzzzz', { op: 'delete', baseRevisionNo: await latestRev(), change: CHANGE });
    expect(nf.status).toBe(404);
    expect(nf.body.code).toBe('PID_NOT_FOUND');
    const pid = e2Blocks.find((b) => b.address === '3.1.1')!.pid;
    const before = await prisma.studioRevision.count({ where: { documentId: docId } });
    const nc = await patchPid(pid, { op: 'replace', baseRevisionNo: await latestRev(), block: { type: 'paragraph', text: 'Tanpa change.' } });
    expect(nc.status).toBe(400);
    expect(nc.body.code).toBe('CHANGE_FIELDS_REQUIRED');
    expect(await prisma.studioRevision.count({ where: { documentId: docId } })).toBe(before);
  });

  it('GET pid ?history=1 memuat riwayat perubahan pid', async () => {
    const pid = e2Blocks.find((b) => b.address === '3.2.1')!.pid;
    const r = await readPid(pid, '?history=1');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.history)).toBe(true);
    expect(r.body.history.length).toBeGreaterThanOrEqual(2);
  });

  it('render bab (scope chapter) selalu boleh -> 200 job CHAPTER draf', async () => {
    const r = await call(postRender(await req(`/api/studio/documents/${docId}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'chapter', key: '3', formats: ['docx'] } }), params({ id: docId })));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.job.scope).toMatchObject({ kind: 'CHAPTER', key: '3' });
    expect(r.body.job.draft).toBe(true);
    expect(r.body.completeness.status).toBe('COMPLETE');
  }, 180_000);
});
