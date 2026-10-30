// FIX-HR1 route `POST /api/studio/import/markdown`:
//  (H-01) SETIAP panggilan dihitung ember impor sendiri -> 429 RATE_LIMITED + Retry-After;
//         badan di atas batas -> 413; batas baris markdown -> 413 details.reason;
//  (C2)   dry-run `?validate=1` memakai pemeta R08 bersama: isu membawa `details`
//         (SCOPE_CONFLICT + overwrittenPids + forwardToController) seperti R08.
// Prisma DI-MOCK; `dryRunChapter` ditiru.
import '../api/_env';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const submit = vi.hoisted(() => ({ dryRunChapter: vi.fn(), dryRunSlot: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('../api/_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...submit }));

import { resetDb } from '../api/_prisma';
import { jsonOf, req } from '../api/_studio';
import { POST } from '@/app/api/studio/import/markdown/route';
import { resetImportRateLimiter } from '@/app/api/studio/import/markdown/_lib/import-rate';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { StudioEngineError } from '@/lib/studio/contract/errors';

const PATH = '/api/studio/import/markdown';
const MD = '# 4. Kinerja\n\n## 4.1 Capaian\n\nGardu C mencapai indeks kesiapan 64 persen.\n';
const TARGET = { mission: { folder: '2026-10-30_fixhr1' }, docKey: 'laporan-survei' };
const OVERWRITE_DETAILS = {
  scope: 'chapter:4',
  reason: 'PATCHED_PIDS_OVERWRITTEN',
  baseRevisionNo: null,
  referenceRevisionNo: 2,
  latestRevisionNo: 3,
  overwrittenPids: [{ pid: 'p-4-1-2', address: '4.1.2', editedInRevision: 3, editedBy: 'agent:agen-2' }],
  forwardToController: 'Baca isi terkini lewat GET /api/studio/documents/x/content, gabungkan, kirim ulang dengan baseRevisionNo 3',
};

beforeEach(() => {
  resetDb();
  vi.clearAllMocks();
  delete process.env.STUDIO_IMPORT_RATE_LIMIT;
  resetImportRateLimiter();
  resetValidateRateLimiter();
});

afterEach(() => {
  delete process.env.STUDIO_IMPORT_RATE_LIMIT;
  resetImportRateLimiter();
});

describe('FIX-HR1 H-01 laju dan batas route impor', () => {
  it('panggilan tanpa ?validate=1 ikut dihitung: ke-(N+1) -> 429 RATE_LIMITED + Retry-After', async () => {
    process.env.STUDIO_IMPORT_RATE_LIMIT = '3';
    resetImportRateLimiter();
    const statuses: number[] = [];
    for (let k = 0; k < 3; k++) statuses.push((await POST(await req(PATH, { auth: 'agent', body: { markdown: MD, chapterKey: '4' } }))).status);
    expect(statuses).toEqual([200, 200, 200]);
    const res = await POST(await req(PATH, { auth: 'agent', body: { markdown: MD, chapterKey: '4' } }));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    const b = await jsonOf(res);
    expect(b.code).toBe('RATE_LIMITED');
    expect(b.details.retryAfterSec).toBeGreaterThan(0);
  });

  it('ember per identitas terautentikasi: agentId badan berbeda tidak memberi kuota baru', async () => {
    process.env.STUDIO_IMPORT_RATE_LIMIT = '1';
    resetImportRateLimiter();
    expect((await POST(await req(PATH, { auth: 'agent', body: { markdown: MD, chapterKey: '4', agentId: 'agen-a' } }))).status).toBe(200);
    expect((await POST(await req(PATH, { auth: 'agent', body: { markdown: MD, chapterKey: '4', agentId: 'agen-b' } }))).status).toBe(429);
  });

  it('ember impor terpisah dari ember validasi R08: impor biasa tidak menghabiskan kuota R08', async () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '1';
    resetValidateRateLimiter();
    try {
      for (let k = 0; k < 3; k++) expect((await POST(await req(PATH, { auth: 'agent', body: { markdown: MD, chapterKey: '4' } }))).status).toBe(200);
      submit.dryRunChapter.mockRejectedValue(new StudioEngineError('SCOPE_CONFLICT', 'x', OVERWRITE_DETAILS));
      const first = await POST(await req(`${PATH}?validate=1`, { auth: 'agent', body: { markdown: MD, chapterKey: '4', target: TARGET } }));
      expect(first.status).toBe(200);
      const second = await POST(await req(`${PATH}?validate=1`, { auth: 'agent', body: { markdown: MD, chapterKey: '4', target: TARGET } }));
      expect(second.status).toBe(429);
    } finally {
      delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
      resetValidateRateLimiter();
    }
  });

  it('badan di atas 4 MiB -> 413 PAYLOAD_TOO_LARGE sebelum diurai', async () => {
    const big = JSON.stringify({ markdown: `# B\n\n${'a'.repeat(4 * 1024 * 1024)}`, chapterKey: '4' });
    const res = await POST(await req(PATH, { auth: 'agent', body: big, headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBe(413);
    expect((await jsonOf(res)).code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('markdown lebih dari 200.000 baris -> 413 dengan details.reason MD_TOO_MANY_LINES', async () => {
    const res = await POST(await req(PATH, { auth: 'agent', body: { markdown: `# B\n${'\n'.repeat(200_000)}`, chapterKey: '4' } }));
    expect(res.status).toBe(413);
    const b = await jsonOf(res);
    expect(b.code).toBe('PAYLOAD_TOO_LARGE');
    expect(b.details).toMatchObject({ reason: 'MD_TOO_MANY_LINES', limit: 200_000, pointer: '/markdown' });
  });

  it('tanpa kredensial tetap 401 (auth sebelum laju)', async () => {
    const res = await POST(await req(PATH, { auth: 'none', body: { markdown: MD, chapterKey: '4' } }));
    expect(res.status).toBe(401);
  });
});

describe('FIX-HR1 C2 dry-run ?validate=1 memakai pemeta R08 bersama', () => {
  it('409 SCOPE_CONFLICT -> dryRun.valid:false, isu membawa details.overwrittenPids + forwardToController', async () => {
    submit.dryRunChapter.mockRejectedValue(new StudioEngineError('SCOPE_CONFLICT', 'chapter 4 overwrites patched paragraphs', OVERWRITE_DETAILS));
    const res = await POST(await req(`${PATH}?validate=1`, { auth: 'agent', body: { markdown: MD, chapterKey: '4', target: TARGET } }));
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(submit.dryRunChapter).toHaveBeenCalledTimes(1);
    expect(b.dryRun.ran).toBe(true);
    expect(b.dryRun.valid).toBe(false);
    expect(b.dryRun.issues).toHaveLength(1);
    expect(b.dryRun.issues[0]).toMatchObject({ pointer: '', keyword: 'SCOPE_CONFLICT', message: 'chapter 4 overwrites patched paragraphs' });
    expect(b.dryRun.issues[0].details).toEqual(OVERWRITE_DETAILS);
    expect(b.dryRun.issues[0].details.overwrittenPids).toEqual([{ pid: 'p-4-1-2', address: '4.1.2', editedInRevision: 3, editedBy: 'agent:agen-2' }]);
  });

  it('galat dengan checkId (by-construction) -> isu membawa checkId seperti R08', async () => {
    submit.dryRunChapter.mockRejectedValue(new StudioEngineError('BY_CONSTRUCTION_FAILED', 'table without source', { pointer: '/chapter/sections/0/blocks/1', checkId: 'DATUM-10' }));
    const res = await POST(await req(`${PATH}?validate=1`, { auth: 'agent', body: { markdown: MD, chapterKey: '4', target: TARGET } }));
    const b = await jsonOf(res);
    expect(b.dryRun.issues[0]).toMatchObject({ pointer: '/chapter/sections/0/blocks/1', keyword: 'BY_CONSTRUCTION_FAILED', checkId: 'DATUM-10' });
  });
});
