// SR-45: batas laju FIX-1 (S87 M-03) pada kiriman R12 dan render R17: per pemanggil, 429
// RATE_LIMITED + Retry-After, tanpa tulis (submit-kit langkah 5; D-131 butir 1: antrean 503 hanya
// bila render diminta). Lingkungan: STUDIO_RENDER_RATE_LIMIT=3 (_env_rate.ts).
import './_env_rate';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';
import { RATE_LIMIT } from './_env_rate';
import { AGENT_ID, AGENT_ID_2, type Auth, call, params, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc } from './_db';
import { chapterBody, createExtra, missionTarget, simpleChapter } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('rate');
beforeAll(async () => {
  // FIX-SEC L-4: plafon identitas = 1 x batas, agar rotasi agentId di uji terakhir terhenti plafon.
  process.env.STUDIO_QUOTA_AGENT_CEILING_FACTOR = '1';
  await guard.setup();
}, 60_000);
afterAll(async () => {
  delete process.env.STUDIO_QUOTA_AGENT_CEILING_FACTOR;
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function chapter(body: Record<string, unknown>, auth: Auth, agentId = AGENT_ID) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth, body: withAgent(auth, body, agentId) })));
  trackDoc(r.body?.document?.id);
  return r;
}

describe('FIX-1: laju per pemanggil', () => {
  it(`agen: kiriman ke-${RATE_LIMIT + 1} dalam jendela -> 429 RATE_LIMITED + Retry-After, tanpa dokumen`, async () => {
    const folder = missionFolder('rate');
    const first = await chapter(chapterBody(missionTarget(folder), simpleChapter('1'), createExtra()), 'agent');
    expect(first.status).toBe(201);
    const id = first.body.document.id;
    for (let k = 2; k <= RATE_LIMIT; k++) {
      expect((await chapter(chapterBody({ documentId: id }, simpleChapter(String(k))), 'agent')).status).toBe(201);
    }
    const before = await prisma.studioRevision.count({ where: { documentId: id } });
    const over = await chapter(chapterBody({ documentId: id }, simpleChapter(String(RATE_LIMIT + 1))), 'agent');
    expect(over.status).toBe(429);
    expect(over.body.code).toBe('RATE_LIMITED');
    expect(Number(over.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(over.body.details?.retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(await prisma.studioRevision.count({ where: { documentId: id } })).toBe(before);

    // R17 render oleh pemanggil yang sama juga dibatasi.
    const rr = await call(postRender(await req(`/api/studio/documents/${id}/render`, { auth: 'agent', body: { agentId: AGENT_ID, scope: 'chapter', key: '1', formats: ['docx'] } }), params({ id })));
    expect(rr.status).toBe(429);
    expect(rr.body.code).toBe('RATE_LIMITED');
  });

  it('pemanggil lain (USER cookie) tidak terkena kuota agen -> 201', async () => {
    const r = await chapter(chapterBody(missionTarget(missionFolder('rate-u')), simpleChapter('1'), createExtra()), 'user');
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
  });

  it('agentId lain dengan secret yang sama terhenti plafon identitas (INTERNAL_AGENT:shared) -> 429', async () => {
    // FIX-SEC L-4 (D-402): agentId memecah bucket hanya di bawah plafon identitas
    // (STUDIO_QUOTA_AGENT_CEILING_FACTOR x batas); faktor 1 = plafon sama dengan batas, sudah habis oleh AGENT_ID.
    // Faktor dipasang di beforeAll untuk seluruh berkas (giliran slot plafon dihitung sejak tagihan pertama).
    const r = await chapter(chapterBody(missionTarget(missionFolder('rate-a2')), simpleChapter('1'), createExtra()), 'agent', AGENT_ID_2);
    expect(r.status).toBe(429);
    expect(r.body.code).toBe('RATE_LIMITED');
  });
});
