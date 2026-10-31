// FIX-C2 (temuan L1 gerbang DC-22/DC-23; D-392): agentId dry-run SAMA di CLI `--remote` dan R23.
// Aturan (services/draft/check.ts): agentId payload blok bila medan ada, selain itu agentId bawaan
// (CLI `--agent-id`, badan R23 `agentId`); tanpa keduanya = tanpa agentId. Handler R08 ASLI di proses.
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const svc = vi.hoisted(() => ({ dryRunSlot: vi.fn(), dryRunChapter: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...svc }));

import { NextRequest } from 'next/server';
import { TEST_INTERNAL_SECRET } from './_env';
import { on, resetDb } from './_prisma';
import { req } from './_studio';
import { resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { POST } from '@/app/api/studio/drafts/check/route';
import { POST as VALIDATE } from '@/app/api/studio/validate/route';
import { dryRunInputOf } from '@/lib/studio/services/draft/check';
import { extractDraft } from '@/lib/studio/services/draft';
import { checkDraftRemote, main, parseArgs, type FetchLike } from '../../../../scripts/studio/draft-check';

const DOC = 'cmvui0qun000qv11gtygb1mk9';

function draftOf(extraField = ''): string {
  return [
    '# DRAF',
    'tujuan: t',
    'langkah-berikut: l',
    `basis: ${DOC}@rev3`,
    '',
    '```json',
    `{ "$schema": "studio.slot/v2", ${extraField}"target": { "documentId": "${DOC}" }, "slot": "record", "baseRevisionNo": 3,`,
    '  "payload": { "type": "contractRecord", "status": "partial", "reportedAt": "2026-10-30" } }',
    '```',
    '',
  ].join('\n');
}

function dryResult() {
  return {
    result: {
      document: { id: DOC, docNumber: '003/GSP/KT/X/2026' },
      created: false,
      unchanged: false,
      rebased: false,
      revision: { revisionNo: 4, changeScope: 'SLOT' },
      slot: { slotKey: 'record', address: 'record', pid: 'p-1' },
      completeness: { status: 'INCOMPLETE', missingRequired: ['bab1'] },
    },
    lint: null,
    snapshot: null,
  };
}

function inProcessFetch(): FetchLike {
  return async (url, init) => {
    if (init.method === 'GET') {
      const text = JSON.stringify({ document: { id: DOC, currentRevisionNo: 3 } });
      return { status: 200, headers: { get: () => null }, text: async () => text };
    }
    const res = await VALIDATE(new NextRequest(new URL(new URL(url).pathname, 'https://127.0.0.1:9011'), { method: 'POST', headers: init.headers, body: init.body }));
    const text = await res.text();
    return { status: res.status, headers: { get: (n: string) => res.headers.get(n) }, text: async () => text };
  };
}

/** Identitas yang diterima layanan dry-run pada panggilan terakhir. */
function seen(): { requester: string; callerAgent: string | undefined; specAgent: unknown } {
  const [caller, spec] = svc.dryRunSlot.mock.calls.at(-1) as [{ requester: string; agentId?: string }, { agentId?: unknown }];
  return { requester: caller.requester, callerAgent: caller.agentId, specAgent: spec.agentId };
}

async function viaR23(markdown: string, agentId?: string) {
  const res = await POST(await req('/api/studio/drafts/check', { auth: 'agent', body: { markdown, ...(agentId !== undefined ? { agentId } : {}) } }));
  expect(res.status).toBe(200);
  return { body: await res.json(), seen: seen() };
}

async function viaCli(markdown: string, agentId?: string) {
  const body = await checkDraftRemote(markdown, { baseUrl: 'http://127.0.0.1:9011', secret: TEST_INTERNAL_SECRET, fetchImpl: inProcessFetch(), ...(agentId !== undefined ? { agentId } : {}) });
  return { body: JSON.parse(JSON.stringify(body)), seen: seen() };
}

beforeEach(() => {
  resetDb();
  resetValidateRateLimiter();
  svc.dryRunSlot.mockReset();
  svc.dryRunSlot.mockResolvedValue(dryResult());
  on('studioDocument', 'findUnique', async (a: { where: { id: string } }) => (a.where.id === DOC ? { currentRevisionNo: 3 } : null));
});

describe('FIX-C2 dryRunInputOf', () => {
  const block = (text: string) => extractDraft(['# D', '```json', text, '```', ''].join('\n')).blocks[0];
  it('menambahkan agentId bawaan hanya bila blok tanpa medan agentId; payload menang', () => {
    const plain = dryRunInputOf(block('{ "a": 1 }'), 'cod-1');
    expect(plain.agentId).toBe('cod-1');
    expect(JSON.parse(plain.text)).toEqual({ a: 1, agentId: 'cod-1' });
    const own = dryRunInputOf(block('{ "a": 1, "agentId": "milik-blok" }'), 'cod-1');
    expect(own.agentId).toBe('milik-blok');
    expect(own.text).toBe(own.block.text);
    const none = dryRunInputOf(block('{ "a": 1 }'));
    expect(none.agentId).toBeUndefined();
    expect(none.text).toBe(none.block.text);
    expect(dryRunInputOf(block('{ "a": 1, "agentId": 5 }'), 'cod-1').agentId).toBeUndefined();
  });
});

describe('FIX-C2 CLI --agent-id (parseArgs)', () => {
  it('menerima 1..80 karakter bersama --remote; menolak tanpa --remote atau di luar batas', () => {
    expect(parseArgs(['d.md', '--remote', 'http://x', '--agent-id', 'cod-1'])).toMatchObject({ remote: 'http://x', agentId: 'cod-1' });
    expect(parseArgs(['d.md'])).toMatchObject({ agentId: null });
    expect(() => parseArgs(['d.md', '--agent-id', 'cod-1'])).toThrow(/--remote/);
    expect(() => parseArgs(['d.md', '--remote', 'http://x', '--agent-id', 'a'.repeat(81)])).toThrow(/1\.\.80/);
  });
  it('main: --agent-id tanpa --remote -> kode keluar 2', async () => {
    let err = '';
    const code = await main(['x.md', '--agent-id', 'cod-1'], { stdout: () => undefined, stderr: (s) => (err += s), env: {} });
    expect(code).toBe(2);
    expect(err).toMatch(/--agent-id/);
  });
});

describe('FIX-C2 kesamaan agentId CLI vs R23', () => {
  it('agentId bawaan: identitas dan hasil sama', async () => {
    const r = await viaR23(draftOf(), 'cod-fixc2');
    const c = await viaCli(draftOf(), 'cod-fixc2');
    expect(c.seen).toEqual(r.seen);
    expect(r.seen.callerAgent).toBe('cod-fixc2');
    expect(c.body).toEqual(r.body);
  });
  it('payload memuat agentId: menang atas bawaan di kedua jalur', async () => {
    const md = draftOf('"agentId": "milik-blok", ');
    const r = await viaR23(md, 'cod-fixc2');
    const c = await viaCli(md, 'cod-fixc2');
    expect(r.seen.callerAgent).toBe('milik-blok');
    expect(c.seen).toEqual(r.seen);
    expect(c.body).toEqual(r.body);
  });
  it('tanpa agentId di mana pun: sama-sama tanpa agentId', async () => {
    const r = await viaR23(draftOf());
    const c = await viaCli(draftOf());
    expect(r.seen.callerAgent).toBeUndefined();
    expect(c.seen).toEqual(r.seen);
    expect(c.body).toEqual(r.body);
  });
});
