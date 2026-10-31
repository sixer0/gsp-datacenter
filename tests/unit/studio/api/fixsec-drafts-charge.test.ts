// FIX-SEC L-2 (D-402; security DC-41) — R23 POST /api/studio/drafts/check: draf tanpa blok yang
// dapat di-dry-run tetap ditagih bucket `validate` SATU kali (header kuota hadir, QH-03); draf
// dengan N blok tetap ditagih N kali (tidak ganda). Prisma DI-MOCK; dry-run layanan di-mock.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const svc = vi.hoisted(() => ({ dryRunSlot: vi.fn(), dryRunChapter: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { on, resetDb } from './_prisma';
import { req } from './_studio';
import { STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/contract';
import { draftValidateCharges } from '@/lib/studio/services/draft/check';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { POST } from '@/app/api/studio/drafts/check/route';

const DOC = 'cmvui0qun000qv11gtygb1mk9';
const PATH = '/api/studio/drafts/check';

function draft(basis: string, ...blocks: string[]): string {
  return ['# DRAF uji FIX-SEC', 'tujuan: tagihan L-2', 'langkah-berikut: tidak ada', `basis: ${basis}`, '', ...blocks, ''].join('\n');
}

function slotBlock(): string {
  return [
    '```json',
    `{ "$schema": "studio.slot/v2", "target": { "documentId": "${DOC}" }, "slot": "record", "baseRevisionNo": 3,`,
    '  "payload": { "type": "contractRecord", "status": "partial", "reportedAt": "2026-10-30" } }',
    '```',
  ].join('\n');
}

const NO_BLOCKS = draft(`${DOC}@rev1`);
const ONLY_INVALID = draft('baru', '```json', '{ "$schema": "studio.doc/v1" }', '```', '', '```json', '{ "tanpa": "schema" }', '```');

function remaining(res: Response): number {
  expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('validate');
  return Number(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER));
}

async function r23(markdown: string): Promise<Response> {
  return POST(await req(PATH, { auth: 'agent', body: { markdown, agentId: 'fixsec-l2' } }));
}

beforeEach(() => {
  resetDb();
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
  svc.dryRunSlot.mockReset();
  svc.dryRunSlot.mockResolvedValue({
    result: {
      document: { id: DOC, docNumber: '003/GSP/KT/X/2026' },
      created: false,
      unchanged: false,
      rebased: false,
      revision: { revisionNo: 4, changeScope: 'SLOT' },
      slot: { slotKey: 'record', address: 'record', pid: 'p-1' },
      completeness: { status: 'INCOMPLETE', missingRequired: [] },
    },
    lint: null,
    snapshot: null,
  });
  on('studioDocument', 'findUnique', async () => ({ currentRevisionNo: 3 }));
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  resetValidateRateLimiter();
  vi.restoreAllMocks();
});

describe('L-2 tagihan R23 tanpa blok dry-run', () => {
  it('draftValidateCharges = max(1, blok dry-run)', () => {
    expect(draftValidateCharges({ dryRunBlocks: [] })).toBe(1);
    expect(draftValidateCharges({ dryRunBlocks: [{}, {}] as never })).toBe(2);
  });

  it('draf tanpa blok -> 200 dengan header validate; sisa turun tepat 1 per permintaan', async () => {
    const r1 = await r23(NO_BLOCKS);
    expect(r1.status).toBe(200);
    const s1 = remaining(r1);
    const r2 = await r23(NO_BLOCKS);
    expect(remaining(r2)).toBe(s1 - 1);
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });

  it('draf hanya blok galat ekstraksi -> tetap ditagih 1', async () => {
    const s1 = remaining(await r23(NO_BLOCKS));
    const r = await r23(ONLY_INVALID);
    expect(r.status).toBe(200);
    expect(remaining(r)).toBe(s1 - 1);
    expect(svc.dryRunSlot).not.toHaveBeenCalled();
  });

  it('draf ber-blok tidak ditagih ganda: 2 blok = 2 tagihan', async () => {
    const s1 = remaining(await r23(NO_BLOCKS));
    const r = await r23(draft(`${DOC}@rev3`, slotBlock(), '', slotBlock()));
    expect(r.status).toBe(200);
    expect(remaining(r)).toBe(s1 - 2);
    expect(svc.dryRunSlot).toHaveBeenCalledTimes(2);
  });

  it('kuota habis -> draf tanpa blok 429 RATE_LIMITED ber-Retry-After', async () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '1';
    resetValidateRateLimiter();
    expect((await r23(NO_BLOCKS)).status).toBe(200);
    const res = await r23(NO_BLOCKS);
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('RATE_LIMITED');
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
  });
});
