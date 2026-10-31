// R2-F2 #7 (D-425; review 14 #7) — R23 POST /api/studio/drafts/check: dry-run ulang bersimulasi
// (U-05a, blok bab sesudah blok pembuat dokumen yang dijawab META_REQUIRED_FOR_CREATE) ditagih
// bucket `validate` satu kali lagi; tagihan = jumlah dry-run yang benar-benar dijalankan (KD-43),
// tanpa tagihan ganda dan L-2 (minimal satu) tetap. Prisma DI-MOCK; dry-run layanan di-mock.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ dryRunSlot: vi.fn(), dryRunChapter: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { dbWrites, on, resetDb } from './_prisma';
import { req } from './_studio';
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { completeDraftCheck, prepareDraftCheck, type DraftDryRunOutcome } from '@/lib/studio/services/draft';
import { POST } from '@/app/api/studio/drafts/check/route';

const MISSION = { folder: '2026-10-31_r2_f2' };
const DOC = 'cmvr2f2doc000000000000001';
const PATH = '/api/studio/drafts/check';

const createSlot = {
  $schema: 'studio.slot/v2',
  target: { mission: MISSION, docKey: 'r2fix' },
  template: { slug: 'laporan-kerja-agen' },
  meta: { title: 'Laporan uji R2-F2' },
  slot: 'record',
  payload: { type: 'contractRecord', status: 'partial', reportedAt: '2026-10-31' },
};
const chapter = (key: string, docKey = 'r2fix') => ({
  $schema: 'studio.chapter/v2',
  target: { mission: MISSION, docKey },
  chapter: { key, title: { text: `Bab ${key}` }, sections: [{ title: { text: 'S' }, blocks: [{ type: 'paragraph', text: 'Isi.' }] }] },
});
const draftOf = (blocks: unknown[]) => `# DRAF uji R2-F2\ntujuan: t\nlangkah-berikut: l\nbasis: baru\n\n${blocks.map((b) => `\`\`\`json\n${JSON.stringify(b)}\n\`\`\`\n`).join('\n')}`;

/** record + bab 1 + bab 2 bertarget misi+docKey sama: 3 dry-run pertama + 2 dry-run ulang = 5. */
const SEQ = draftOf([createSlot, chapter('1'), chapter('2')]);
/** record + bab bertarget docKey lain (tanpa simulasi): 2 dry-run. */
const NO_SIM = draftOf([createSlot, chapter('1', 'lain')]);

function dryResult(created: boolean) {
  return {
    result: {
      document: { id: DOC, docNumber: '017/GSP/LAP/X/2026' },
      created,
      unchanged: false,
      rebased: false,
      revision: { revisionNo: 1, changeScope: 'SLOT' },
      slot: { slotKey: 'record', address: 'record', pid: 'p-1' },
      completeness: { status: 'INCOMPLETE', missingRequired: [] },
    },
    lint: null,
    snapshot: null,
  };
}

function remaining(res: Response): number {
  expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('validate');
  return Number(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER));
}

async function r23(markdown: string): Promise<Response> {
  return POST(await req(PATH, { auth: 'agent', body: { markdown, agentId: 'cod-r2-f2' } }));
}

/** Kuota awal: satu panggilan draf tanpa blok (ditagih 1, L-2) -> sisa sesudahnya. */
async function baseline(): Promise<number> {
  return remaining(await r23(draftOf([])));
}

beforeEach(() => {
  resetDb();
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
  svc.dryRunSlot.mockReset();
  svc.dryRunChapter.mockReset();
  svc.dryRunSlot.mockResolvedValue(dryResult(true));
  // Dokumen belum ada: bab tanpa template + meta.title -> META_REQUIRED_FOR_CREATE (seperti pipeline/meta).
  svc.dryRunChapter.mockImplementation(async (_caller: unknown, body: { template?: unknown; target?: { docKey?: string } }) => {
    if (body.template === undefined) throw new StudioEngineError('META_REQUIRED_FOR_CREATE', 'Dokumen belum ada; kirim template untuk membuatnya', { missing: ['template', 'meta.title'] });
    return dryResult(false);
  });
  on('studioDocument', 'findUnique', async () => null);
  on('studioDocument', 'findFirst', async () => null);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
  vi.restoreAllMocks();
});

describe('#7 tagihan per dry-run yang dijalankan', () => {
  it('2 bab bersimulasi: 5 dry-run = 5 tagihan; bab valid sesudah simulasi; 0 tulis DB', async () => {
    const s0 = await baseline();
    const res = await r23(SEQ);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocks.map((b: { valid: boolean }) => b.valid)).toEqual([true, true, true]);
    expect(svc.dryRunSlot).toHaveBeenCalledTimes(1);
    expect(svc.dryRunChapter).toHaveBeenCalledTimes(4);
    expect(remaining(res)).toBe(s0 - 5);
    expect(dbWrites()).toEqual([]);
  });

  it('tanpa simulasi (docKey lain) tetap 1 tagihan per blok, tanpa tagihan tambahan', async () => {
    const s0 = await baseline();
    const res = await r23(NO_SIM);
    expect(res.status).toBe(200);
    expect(svc.dryRunChapter).toHaveBeenCalledTimes(1);
    expect(remaining(res)).toBe(s0 - 2);
  });

  it('dokumen sudah ada (bab valid pada dry-run pertama): tanpa dry-run ulang, tanpa tagihan tambahan', async () => {
    svc.dryRunChapter.mockResolvedValue(dryResult(false));
    const s0 = await baseline();
    const res = await r23(SEQ);
    expect(svc.dryRunChapter).toHaveBeenCalledTimes(2);
    expect(remaining(res)).toBe(s0 - 3);
  });

  it('kuota habis tepat sebelum dry-run ulang: 429 RATE_LIMITED ber-Retry-After, dry-run ulang tidak dijalankan', async () => {
    // baseline 1 + 3 tagihan di muka = 4; tagihan dry-run ulang pertama (ke-5) ditolak.
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '4';
    resetValidateRateLimiter();
    await baseline();
    const res = await r23(SEQ);
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('RATE_LIMITED');
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    // blok 1 (slot) + dry-run pertama bab 1; dry-run ulang bab 1 dan blok sesudahnya tidak dijalankan.
    expect(svc.dryRunSlot).toHaveBeenCalledTimes(1);
    expect(svc.dryRunChapter).toHaveBeenCalledTimes(1);
  });

  it('AC-19: hook tagihan tidak mengubah hasil (dengan dan tanpa beforeSimulatedDryRun identik)', async () => {
    const outcome = (v: Record<string, unknown>): DraftDryRunOutcome =>
      v.$schema === 'studio.chapter/v2' && v.template === undefined
        ? { valid: false, issues: [{ pointer: '', keyword: 'META_REQUIRED_FOR_CREATE', message: 'x' }] }
        : { valid: true, issues: [] };
    let hooks = 0;
    const withHook = await completeDraftCheck(SEQ, prepareDraftCheck(SEQ), { currentRevisionNo: async () => null, dryRun: async (i) => outcome(i.value), beforeSimulatedDryRun: () => void hooks++ });
    const without = await completeDraftCheck(SEQ, prepareDraftCheck(SEQ), { currentRevisionNo: async () => null, dryRun: async (i) => outcome(i.value) });
    expect(hooks).toBe(2);
    expect(JSON.stringify(withHook)).toBe(JSON.stringify(without));
  });
});
