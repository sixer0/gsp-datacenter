/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// FIX-S3 (D-342 S3, uji ulang Hermes S3): keluaran R20 GET /content dapat dikirim balik apa adanya.
// `?shape=submission` -> badan studio.chapter/v2 / studio.slot/v2 siap kirim: tanpa ubahan = 200
// unchanged; ubah satu paragraf = 201 dengan pid tetap; alur pulih C2 (baca-gabung-kirim) tanpa 400.
// DB v21 nyata (fixture sementara, 0 sisa; harness SR-45).
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postSlot } from '@/app/api/studio/slots/route';
import { PATCH as patchPidRoute } from '@/app/api/studio/documents/[id]/paragraphs/[pid]/route';
import { GET as getContent } from '@/app/api/studio/documents/[id]/content/route';
import { AGENT_ID, AGENT_ID_2, call, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { CHANGE, CONTROL_SHEET, chapterBody, createExtra, missionTarget, slotBody } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('fixs3');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

let docId = '';

function railChapter(key = '1'): Record<string, unknown> {
  return {
    key,
    title: { text: `Bab ${key} uji bentuk kiriman` },
    intro: [{ type: 'paragraph', text: 'Pengantar bab untuk uji bentuk kiriman.' }],
    sections: [
      {
        title: { text: 'Rekaman pengukuran' },
        blocks: [
          { type: 'paragraph', role: 'anchor', runs: [{ t: 'Durasi pengukuran 94 menit pada jam puncak.' }], rail: [{ kind: 'mark', mark: 'TERUKUR' }] },
          { type: 'paragraph', text: 'Hasil pengukuran dicatat di lembar data lapangan.' },
          {
            type: 'table',
            caption: { text: 'Skor kondisi pemutus tenaga' },
            columns: [{ role: 'id' }, { role: 'numeral' }],
            rows: [
              { kind: 'header', cells: [{ text: 'Unit' }, { text: 'Skor' }] },
              { cells: [{ text: 'PMT-1' }, { text: '4' }] },
            ],
            source: { text: 'Inspeksi 2026-10-20', provenance: ['TERUKUR'] },
          },
        ],
      },
    ],
  };
}

async function submitChapter(body: Record<string, unknown>) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body })));
  trackDoc(r.body?.document?.id);
  return r;
}
async function submitSlot(body: Record<string, unknown>) {
  return call(postSlot(await req('/api/studio/slots', { auth: 'agent', body })));
}
async function content(query: string) {
  return call(getContent(await req(`/api/studio/documents/${docId}/content?${query}`, { auth: 'agent' }), params({ id: docId })));
}
async function revCount(): Promise<number> {
  return prisma.studioRevision.count({ where: { documentId: docId } });
}
function pidsOf(chapter: any): string[] {
  const out = [chapter.id, ...(chapter.intro ?? []).map((b: any) => b.id)];
  for (const s of chapter.sections) out.push(s.id, ...s.blocks.map((b: any) => b.id));
  return out;
}

describe('FIX-S3: R20 GET /content dikirim balik apa adanya', () => {
  beforeAll(async () => {
    const r1 = await submitChapter(withAgent('agent', chapterBody(missionTarget(missionFolder('s3')), railChapter('1'), createExtra()), AGENT_ID));
    expect(r1.status, JSON.stringify(r1.body).slice(0, 400)).toBe(201);
    docId = r1.body.document.id;
    const r2 = await submitSlot(withAgent('agent', slotBody({ documentId: docId }, 'controlSheet', CONTROL_SHEET), AGENT_ID));
    expect(r2.status, JSON.stringify(r2.body).slice(0, 400)).toBe(201);
  }, 60_000);

  it('bawaan shape=content tidak berubah (content berpid, tanpa submission)', async () => {
    const c = await content('chapter=1');
    expect(c.status).toBe(200);
    expect(c.body.content.id).toMatch(/\S/);
    expect(c.body.submission).toBeUndefined();
    // Isi bawaan dibungkus amplop minimal juga lolos (bukti `id` diterima skema kiriman).
    const r = await submitChapter({ $schema: 'studio.chapter/v2', agentId: AGENT_ID, target: { documentId: docId }, baseRevisionNo: c.body.revisionNo, chapter: c.body.content });
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.unchanged).toBe(true);
  });

  it('shape=submission bab -> kirim balik tanpa ubahan = 200 unchanged, 0 revisi baru', async () => {
    const c = await content(`chapter=1&shape=submission&agentId=${AGENT_ID}`);
    expect(c.status, JSON.stringify(c.body).slice(0, 400)).toBe(200);
    expect(c.body).toMatchObject({ shape: 'submission', slot: 'content', submitTo: 'POST /api/studio/chapters' });
    expect(c.body.submission).toMatchObject({ $schema: 'studio.chapter/v2', agentId: AGENT_ID, target: { documentId: docId }, slot: 'content', baseRevisionNo: c.body.revisionNo });
    expect(Array.isArray(c.body.editHints)).toBe(true);
    const before = await revCount();
    const r = await submitChapter(c.body.submission);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.unchanged).toBe(true);
    expect(await revCount()).toBe(before);
  });

  it('ubah satu paragraf -> 201, semua pid tetap (tidak ada pid baru/pensiun)', async () => {
    const c = await content('chapter=1&shape=submission');
    const sub = structuredClone(c.body.submission);
    const pidsBefore = pidsOf(sub.chapter);
    const target = sub.chapter.sections[0].blocks[1];
    target.text = 'Hasil pengukuran dicatat di lembar data lapangan dan diverifikasi penyelia.';
    const r = await submitChapter(sub);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.chapter.blocks.find((b: any) => b.pid === target.id)?.address).toBe('1.1.2');
    const after = await content('chapter=1');
    expect(pidsOf(after.body.content)).toEqual(pidsBefore);
    expect(after.body.content.sections[0].blocks[1].text).toContain('diverifikasi penyelia');
  });

  it('alur pulih C2: PATCH pid -> kiriman usang 409 -> GET shape=submission, gabung, kirim -> 201 tanpa 400, suntingan bertahan', async () => {
    const c0 = await content('chapter=1&shape=submission');
    const stale = c0.body.submission;
    const anchorPid = stale.chapter.sections[0].blocks[0].id;
    const p = await call(patchPidRoute(
      await req(`/api/studio/documents/${docId}/paragraphs/${anchorPid}`, {
        method: 'PATCH',
        auth: 'agent',
        body: { agentId: AGENT_ID_2, op: 'replace', baseRevisionNo: stale.baseRevisionNo, block: { type: 'paragraph', role: 'anchor', runs: [{ t: 'Durasi pengukuran 93 menit pada jam puncak.' }], rail: [{ kind: 'mark', mark: 'TERUKUR' }] }, change: CHANGE },
      }),
      params({ id: docId, pid: anchorPid }),
    ));
    expect(p.status, JSON.stringify(p.body).slice(0, 400)).toBe(200);

    const edited = structuredClone(stale);
    edited.chapter.sections[0].blocks[0].runs = [{ t: 'Durasi pengukuran 95 menit pada jam puncak.' }];
    const denied = await submitChapter(edited);
    expect(denied.status, JSON.stringify(denied.body).slice(0, 400)).toBe(409);
    expect(denied.body.details.overwrittenPids.map((x: any) => x.pid)).toEqual([anchorPid]);

    const fresh = await content('chapter=1&shape=submission');
    expect(fresh.body.submission.baseRevisionNo).toBe(p.body.revision.revisionNo);
    const merged = structuredClone(fresh.body.submission);
    merged.chapter.intro[0].text = 'Pengantar bab yang digabung sesudah suntingan PATCH.';
    const ok = await submitChapter(merged);
    expect(ok.status, JSON.stringify(ok.body).slice(0, 400)).toBe(201);
    const after = await content('chapter=1');
    expect(after.body.content.sections[0].blocks[0].id).toBe(anchorPid);
    expect(JSON.stringify(after.body.content.sections[0].blocks[0].runs)).toContain('93 menit');
    // Kiriman pulih yang sama sekali lagi: idempoten.
    const again = await submitChapter(merged);
    expect(again.status).toBe(200);
    expect(again.body.unchanged).toBe(true);
  });

  it('shape=submission slot tak-berulang -> POST /api/studio/slots apa adanya = 200 unchanged', async () => {
    const c = await content('slot=controlSheet&shape=submission');
    expect(c.status, JSON.stringify(c.body).slice(0, 400)).toBe(200);
    expect(c.body.submitTo).toBe('POST /api/studio/slots');
    expect(c.body.submission).toMatchObject({ $schema: 'studio.slot/v2', slot: 'controlSheet', baseRevisionNo: c.body.revisionNo });
    const r = await submitSlot(c.body.submission);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(200);
    expect(r.body.unchanged).toBe(true);
  });

  it('galat: shape tak dikenal / submission tanpa lingkup / agentId tanpa submission = 400; slot berulang = 422', async () => {
    const bad = await content('chapter=1&shape=bogus');
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('SCHEMA_INVALID');
    expect(bad.body.details[0].pointer).toBe('/query/shape');
    const whole = await content('shape=submission');
    expect(whole.status).toBe(400);
    expect(whole.body.details[0].keyword).toBe('dependentRequired');
    const agentOnly = await content(`chapter=1&agentId=${AGENT_ID}`);
    expect(agentOnly.status).toBe(400);
    expect(agentOnly.body.details[0].pointer).toBe('/query/agentId');
    const rep = await content('slot=content&shape=submission');
    expect(rep.status, JSON.stringify(rep.body).slice(0, 300)).toBe(422);
    expect(rep.body.code).toBe('SLOT_USE_CHAPTER_ENDPOINT');
    expect(rep.body.details).toMatchObject({ slotKey: 'content', use: 'POST /api/studio/chapters', chapters: ['1'] });
  });
});
