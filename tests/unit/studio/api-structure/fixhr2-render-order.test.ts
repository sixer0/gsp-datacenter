// FIX-HR2 (D-332 C1): urutan galat R17 SERAGAM apa pun `formats`:
//   401 -> 404 DOCUMENT_NOT_FOUND / REVISION_NOT_FOUND -> 409 DOCUMENT_INCOMPLETE
//   (lingkup document) / 404 ADDRESS_NOT_FOUND / 422 SLOT_UNKNOWN -> 503 preflight.
// Route nyata + layanan `renderScope` nyata + DB v21 (fixture sementara, 0 sisa). Hanya
// cek kesiapan render-env yang ditiru (selalu TIDAK siap) agar tidak ada soffice/job.
// Matriks: formats {pdf, docx+pdf, PDF huruf besar, bawaan snapshot, docx} x kondisi.
import './_env';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const readiness = vi.hoisted(() => ({
  check: vi.fn(async () => ({ ready: false, errors: ['font family not loaded in session: "IBM Plex Sans"'], checkedAt: '2026-10-30T02:00:00.000Z' })),
}));
vi.mock('@/lib/studio/engine/soffice', async (orig) => ({ ...(await orig<object>()), checkRenderEnvReadiness: readiness.check }));

import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';
import { AGENT_ID, call, params, req } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { chapterBody, createExtra, missionTarget, simpleChapter } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('fixhr2-render-order');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

type Fmt = { name: string; formats?: string[]; hasPdf: boolean };
const FORMATS: Fmt[] = [
  { name: 'pdf', formats: ['pdf'], hasPdf: true },
  { name: 'docx+pdf', formats: ['docx', 'pdf'], hasPdf: true },
  { name: 'PDF (huruf besar)', formats: ['PDF'], hasPdf: true },
  { name: 'bawaan snapshot', formats: undefined, hasPdf: true },
  { name: 'docx', formats: ['docx'], hasPdf: false },
];

const MISSING_DOC_ID = 'cmzzzzzzzzzzzzzzzzzzzzzzz';
let docId = '';

async function render(id: string, body: Record<string, unknown>, auth: 'agent' | 'none' = 'agent') {
  return call(postRender(await req(`/api/studio/documents/${id}/render`, { auth, body: auth === 'agent' ? { agentId: AGENT_ID, ...body } : body }), params({ id })));
}
const withFormats = (f: Fmt, body: Record<string, unknown>) => (f.formats ? { ...body, formats: f.formats } : body);

describe('FIX-HR2 C1: urutan galat R17 seragam apa pun formats (DB v21, layanan nyata)', () => {
  beforeAll(async () => {
    // Dokumen INCOMPLETE: hanya bab 3 (bab 1-2 dan lembar kendali belum ada).
    const r = await call(
      postChapter(await req('/api/studio/chapters', { auth: 'agent', body: { ...chapterBody(missionTarget(missionFolder('hr2')), simpleChapter('3'), createExtra()), agentId: AGENT_ID } })),
    );
    trackDoc(r.body?.document?.id);
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.completeness.status).toBe('INCOMPLETE');
    docId = r.body.document.id;
  }, 60_000);

  const CASES: Array<{ cond: string; run: (f: Fmt) => ReturnType<typeof render>; expect: (f: Fmt) => [number, string] }> = [
    { cond: 'tanpa sesi', run: (f) => render(docId, withFormats(f, { scope: 'document' }), 'none'), expect: () => [401, ''] },
    { cond: 'dokumen tidak ada', run: (f) => render(MISSING_DOC_ID, withFormats(f, { scope: 'document' })), expect: () => [404, 'DOCUMENT_NOT_FOUND'] },
    { cond: 'revisi tidak ada', run: (f) => render(docId, withFormats(f, { scope: 'document', revisionNo: 99 })), expect: () => [404, 'REVISION_NOT_FOUND'] },
    { cond: 'render penuh dokumen INCOMPLETE', run: (f) => render(docId, withFormats(f, { scope: 'document' })), expect: () => [409, 'DOCUMENT_INCOMPLETE'] },
    { cond: 'bab tidak ada', run: (f) => render(docId, withFormats(f, { scope: 'chapter', key: '9' })), expect: () => [404, 'ADDRESS_NOT_FOUND'] },
    { cond: 'slot tidak dikenal', run: (f) => render(docId, withFormats(f, { scope: 'slot', key: 'tidakAda' })), expect: () => [422, 'SLOT_UNKNOWN'] },
  ];

  for (const c of CASES) {
    for (const f of FORMATS) {
      it(`${c.cond} x formats ${f.name}`, async () => {
        readiness.check.mockClear();
        const r = await c.run(f);
        const [status, code] = c.expect(f);
        expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(status);
        if (code) expect(r.body.code).toBe(code);
        // Galat sasaran mendahului gerbang PDF: cek kesiapan tidak pernah dipanggil.
        expect(readiness.check).not.toHaveBeenCalled();
      });
    }
  }

  it('409 DOCUMENT_INCOMPLETE dengan pdf eksplisit membawa bentuk §11.3 (bukan 503)', async () => {
    const r = await render(docId, { scope: 'document', formats: ['pdf'] });
    expect(r.status).toBe(409);
    expect(r.body.details.allowedScopes).toEqual(['chapter', 'slot']);
    expect(r.body.details.completeness.status).toBe('INCOMPLETE');
    expect(typeof r.body.details.forwardToController).toBe('string');
  });

  for (const f of FORMATS.filter((x) => x.hasPdf)) {
    it(`sasaran sah (bab 3) x formats ${f.name} + render-env tidak siap -> 503 preflight, tanpa job`, async () => {
      readiness.check.mockClear();
      const r = await render(docId, withFormats(f, { scope: 'chapter', key: '3' }));
      expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(503);
      expect(r.body.code).toBe('PDF_ENGINE_UNAVAILABLE');
      expect(r.body.details).toMatchObject({ stage: 'preflight', jobCreated: false });
      expect(r.headers.get('retry-after')).toBe('300');
      expect(readiness.check).toHaveBeenCalledTimes(1);
    });
  }

  it('seluruh matriks tidak membuat job render untuk dokumen fixture', async () => {
    expect(await prisma.studioRenderJob.count({ where: { documentId: docId } })).toBe(0);
  });
});
