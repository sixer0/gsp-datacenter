// FIX-SEC L-4 (D-402; security DC-41) — bucket kuota per agen + plafon global per identitas
// (`checkBucketRate`, `quotaAgentRateIdentity`, env STUDIO_QUOTA_AGENT_CEILING_FACTOR):
// dua agentId punya sisa terpisah, plafon menghentikan rotasi agentId, header = sisa terkecil
// (QH-04), pemanggil tanpa agentId tidak berubah.
import './_env';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkQueryRate,
  quotaAgentCeilingFactor,
  quotaAgentRateIdentity,
  quotaRateIdentity,
  quotaReport,
  resetQueryRateLimiter,
  QUOTA_AGENT_CEILING_FACTOR_DEFAULT,
  QUOTA_AGENT_CEILING_FACTOR_ENV,
  STUDIO_QUOTA_REMAINING_HEADER,
} from '@/lib/studio/http/quota';
import { reqCtx, type ReqCtx } from '@/lib/studio/http';
import { checkValidateRate, resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';

type Caller = { kind: 'INTERNAL_AGENT' | 'USER_SESSION' | 'GOOGLE_SESSION' | 'ADMIN_SESSION'; username?: string; email?: string; agentId?: string };

const AGENT = (agentId?: string): Caller => ({ kind: 'INTERNAL_AGENT', ...(agentId ? { agentId } : {}) });

function ctxOf(): ReqCtx {
  return reqCtx(new Request('https://127.0.0.1/api/studio/x', { method: 'GET' }), '/api/studio/x');
}

/** Satu permintaan bucket query: [diizinkan, sisa header]. */
function hit(caller: Caller): [boolean, number | undefined] {
  const ctx = ctxOf();
  const res = checkQueryRate(caller as never, ctx);
  return [res === null, quotaReport(ctx)?.remaining];
}

function reset(): void {
  delete process.env.STUDIO_QUERY_RATE_LIMIT;
  delete process.env.STUDIO_VALIDATE_RATE_LIMIT;
  delete process.env[QUOTA_AGENT_CEILING_FACTOR_ENV];
  resetQueryRateLimiter();
  resetValidateRateLimiter();
}

beforeEach(() => {
  reset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  reset();
  vi.restoreAllMocks();
});

describe('L-4 identitas per agen', () => {
  it('quotaAgentRateIdentity = identitas terautentikasi + agentId; null tanpa agentId', () => {
    expect(quotaAgentRateIdentity(AGENT())).toBeNull();
    expect(quotaAgentRateIdentity(AGENT('agen-a'))).toBe('INTERNAL_AGENT:shared\u0000agent:agen-a');
    expect(quotaAgentRateIdentity({ kind: 'USER_SESSION', username: 'u1', agentId: 'x' } as never)).toBe('USER_SESSION:u1\u0000agent:x');
    expect(quotaRateIdentity(AGENT('agen-a'))).toBe('INTERNAL_AGENT:shared');
  });

  it('faktor plafon: bawaan 4; env sah dipakai; tidak sah -> bawaan; dibatasi 64', () => {
    expect(quotaAgentCeilingFactor()).toBe(QUOTA_AGENT_CEILING_FACTOR_DEFAULT);
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '2';
    expect(quotaAgentCeilingFactor()).toBe(2);
    for (const bad of ['0', '-1', '1.5', 'abc', ' ']) {
      process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = bad;
      expect(quotaAgentCeilingFactor()).toBe(QUOTA_AGENT_CEILING_FACTOR_DEFAULT);
    }
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '1000';
    expect(quotaAgentCeilingFactor()).toBe(64);
  });
});

describe('L-4 bucket per agen + plafon identitas', () => {
  it('dua agentId berbeda punya sisa terpisah (header = sisa agen, bukan plafon)', () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '3';
    resetQueryRateLimiter();
    expect(hit(AGENT('agen-a'))).toEqual([true, 2]);
    expect(hit(AGENT('agen-a'))).toEqual([true, 1]);
    expect(hit(AGENT('agen-b'))).toEqual([true, 2]);
    expect(hit(AGENT('agen-a'))).toEqual([true, 0]);
    expect(hit(AGENT('agen-a'))[0]).toBe(false);
    expect(hit(AGENT('agen-b'))).toEqual([true, 1]);
  });

  it('plafon global per identitas menghentikan rotasi agentId (faktor 2 x batas 2 = 4 per jendela)', () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '2';
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '2';
    resetQueryRateLimiter();
    const allowed: boolean[] = [];
    for (let i = 0; i < 8; i++) allowed.push(hit(AGENT(`rot-${i}`))[0]);
    expect(allowed).toEqual([true, true, true, true, false, false, false, false]);
  });

  it('429 plafon: Retry-After, header kuota 0, konteks log scope identityCeiling', async () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '1';
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '1';
    resetQueryRateLimiter();
    expect(hit(AGENT('a1'))[0]).toBe(true);
    const warn = vi.mocked(console.warn);
    warn.mockClear();
    const ctx = ctxOf();
    const res = checkQueryRate(AGENT('a2') as never, ctx);
    expect(res?.status).toBe(429);
    expect(res?.headers.get('retry-after')).toBeTruthy();
    expect(res?.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect((await res!.json()).code).toBe('RATE_LIMITED');
    expect(warn.mock.calls.map((c) => String(c[0])).some((l) => l.includes('"scope":"identityCeiling"'))).toBe(true);
  });

  it('header melaporkan sisa terkecil: plafon < sisa agen saat banyak agen', () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '10';
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '2';
    resetQueryRateLimiter();
    // Plafon 20; 15 agen x 1 permintaan -> sisa plafon 5, sisa agen baru 9 -> header 4 sesudah yang ke-16.
    for (let i = 0; i < 15; i++) hit(AGENT(`m-${i}`));
    expect(hit(AGENT('m-new'))).toEqual([true, 4]);
  });

  it('pemanggil tanpa agentId: bucket identitas lama, tidak tersentuh tagihan agen dan tanpa plafon', () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '2';
    process.env[QUOTA_AGENT_CEILING_FACTOR_ENV] = '1';
    resetQueryRateLimiter();
    expect(hit(AGENT('a'))).toEqual([true, 1]);
    expect(hit(AGENT('b'))).toEqual([true, 0]);
    expect(hit(AGENT('c'))[0]).toBe(false);
    expect(hit(AGENT())).toEqual([true, 1]);
    expect(hit(AGENT())).toEqual([true, 0]);
    expect(hit(AGENT())[0]).toBe(false);
  });

  it('bucket validate memakai aturan yang sama (helper bersama checkBucketRate)', () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '1';
    resetValidateRateLimiter();
    expect(checkValidateRate(AGENT('v-a') as never, ctxOf())).toBeNull();
    expect(checkValidateRate(AGENT('v-b') as never, ctxOf())).toBeNull();
    expect(checkValidateRate(AGENT('v-a') as never, ctxOf())?.status).toBe(429);
  });
});
