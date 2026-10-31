// FIX-QA / FIX-R40-5 — empat limiter kuota (render, validate, import, query) lewat satu
// helper `checkBucketRate` (`http/quota.ts`). Uji karakterisasi: kunci hash per bucket,
// identitas `quotaRateIdentity`, batas/jendela env, pesan + konteks log 429, Retry-After,
// header kuota. Ditulis SEBELUM penyatuan dan dijalankan ulang sesudahnya (diff perilaku 0).
import './_env';
import { createHash } from 'node:crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const spy = vi.hoisted(() => ({
  limiters: [] as Array<{ limit: number; windowMs: number; keys: string[] }>,
  rejects: [] as Array<{ code: string; message: string; details: unknown; context: unknown }>,
}));

vi.mock('@/lib/studio/http/rate-limit', async (orig) => {
  const real = await orig<typeof import('@/lib/studio/http/rate-limit')>();
  return {
    ...real,
    createFixedWindowLimiter: (opts: { limit: number; windowMs: number; maxKeys?: number }) => {
      const inner = real.createFixedWindowLimiter(opts);
      const rec = { limit: opts.limit, windowMs: opts.windowMs, keys: [] as string[] };
      spy.limiters.push(rec);
      return {
        hit(key: string, now?: number) {
          rec.keys.push(key);
          return inner.hit(key, now);
        },
        reset: () => inner.reset(),
      };
    },
  };
});

vi.mock('@/lib/studio/http/errors', async (orig) => {
  const real = await orig<typeof import('@/lib/studio/http/errors')>();
  return {
    ...real,
    reject: (...args: Parameters<typeof real.reject>) => {
      const [, code, message, details, context] = args;
      spy.rejects.push({ code, message, details, context });
      return real.reject(...args);
    },
  };
});

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { reqCtx, type ReqCtx } from '@/lib/studio/http';
import { checkRenderRate, renderRateIdentity, resetRenderRateLimiter } from '@/lib/studio/http/render-guard';
import { checkQueryRate, quotaRateIdentity, resetQueryRateLimiter, STUDIO_QUOTA_BUCKET_HEADER, STUDIO_QUOTA_REMAINING_HEADER } from '@/lib/studio/http/quota';
import { checkValidateRate, resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { checkImportRate, resetImportRateLimiter } from '@/app/api/studio/import/markdown/_lib/import-rate';

type Caller = { kind: 'USER_SESSION' | 'ADMIN_SESSION' | 'GOOGLE_SESSION' | 'INTERNAL_AGENT'; username?: string; email?: string };
type Check = (caller: Caller, ctx: ReqCtx) => Response | null;

const CASES: Array<{
  bucket: string;
  check: Check;
  reset: () => void;
  envLimit: string;
  envWindow: string;
  limit: number;
  message: string;
  context: (kind: string, retryAfterSec: number) => Record<string, unknown>;
}> = [
  {
    bucket: 'render',
    check: checkRenderRate as Check,
    reset: resetRenderRateLimiter,
    envLimit: 'STUDIO_RENDER_RATE_LIMIT',
    envWindow: 'STUDIO_RENDER_RATE_WINDOW_MS',
    limit: 30,
    message: 'Too many render requests; retry later',
    // Perilaku lama render: TANPA label `limiter` di konteks log.
    context: (callerKind, retryAfterSec) => ({ callerKind, retryAfterSec }),
  },
  {
    bucket: 'validate',
    check: checkValidateRate as Check,
    reset: resetValidateRateLimiter,
    envLimit: 'STUDIO_VALIDATE_RATE_LIMIT',
    envWindow: 'STUDIO_VALIDATE_RATE_WINDOW_MS',
    limit: 120,
    message: 'Too many validate requests; retry later',
    context: (callerKind, retryAfterSec) => ({ callerKind, retryAfterSec, limiter: 'validate' }),
  },
  {
    bucket: 'import',
    check: checkImportRate as Check,
    reset: resetImportRateLimiter,
    envLimit: 'STUDIO_IMPORT_RATE_LIMIT',
    envWindow: 'STUDIO_IMPORT_RATE_WINDOW_MS',
    limit: 60,
    message: 'Too many markdown import requests; retry later',
    context: (callerKind, retryAfterSec) => ({ callerKind, retryAfterSec, limiter: 'import' }),
  },
  {
    bucket: 'query',
    check: checkQueryRate as Check,
    reset: resetQueryRateLimiter,
    envLimit: 'STUDIO_QUERY_RATE_LIMIT',
    envWindow: 'STUDIO_QUERY_RATE_WINDOW_MS',
    limit: 120,
    message: 'Too many query requests; retry later',
    context: (callerKind, retryAfterSec) => ({ callerKind, retryAfterSec, limiter: 'query' }),
  },
];

const ENV_KEYS = CASES.flatMap((c) => [c.envLimit, c.envWindow]);

function ctxOf(): ReqCtx {
  return reqCtx(new Request('https://127.0.0.1/api/studio/x', { method: 'POST' }), '/api/studio/x');
}

function expectedKey(bucket: string, identity: string): string {
  return createHash('sha256').update(`${bucket}\u0000${identity}`).digest('hex').slice(0, 32);
}

function clearEnv(): void {
  for (const k of ENV_KEYS) delete process.env[k];
}

beforeEach(() => {
  clearEnv();
  for (const c of CASES) c.reset();
  spy.limiters.length = 0;
  spy.rejects.length = 0;
});

afterEach(() => {
  clearEnv();
  for (const c of CASES) c.reset();
});

describe('FIX-R40-5 identitas laju', () => {
  it('renderRateIdentity = quotaRateIdentity untuk semua jenis pemanggil', () => {
    const callers: Caller[] = [
      { kind: 'ADMIN_SESSION', username: 'a1' },
      { kind: 'USER_SESSION', username: 'u1' },
      { kind: 'USER_SESSION' },
      { kind: 'GOOGLE_SESSION', email: 'g@x.test' },
      { kind: 'INTERNAL_AGENT' },
    ];
    expect(callers.map((c) => quotaRateIdentity(c as never))).toEqual([
      'ADMIN_SESSION:a1',
      'USER_SESSION:u1',
      'USER_SESSION:?',
      'GOOGLE_SESSION:g@x.test',
      'INTERNAL_AGENT:shared',
    ]);
    for (const c of callers) expect(renderRateIdentity(c as never)).toBe(quotaRateIdentity(c as never));
  });
});

describe.each(CASES)('FIX-R40-5 bucket $bucket (diff perilaku 0)', (c) => {
  it('kunci = sha256(bucket NUL identitas)[0..32] untuk tiap jenis pemanggil', () => {
    const callers: Caller[] = [
      { kind: 'USER_SESSION', username: 'k-user' },
      { kind: 'GOOGLE_SESSION', email: 'k@x.test' },
      { kind: 'INTERNAL_AGENT', username: 'diabaikan' },
    ];
    for (const caller of callers) expect(c.check(caller, ctxOf())).toBeNull();
    expect(spy.limiters).toHaveLength(1);
    expect(spy.limiters[0].keys).toEqual(callers.map((caller) => expectedKey(c.bucket, quotaRateIdentity(caller as never))));
  });

  it('batas bawaan + jendela 60000 ms; env dibaca sekali per instans', () => {
    expect(c.check({ kind: 'USER_SESSION', username: 'd' }, ctxOf())).toBeNull();
    expect(spy.limiters[0]).toMatchObject({ limit: c.limit, windowMs: 60_000 });
    process.env[c.envLimit] = '7';
    process.env[c.envWindow] = '5000';
    expect(c.check({ kind: 'USER_SESSION', username: 'd' }, ctxOf())).toBeNull();
    expect(spy.limiters).toHaveLength(1);
    c.reset();
    expect(c.check({ kind: 'USER_SESSION', username: 'd' }, ctxOf())).toBeNull();
    expect(spy.limiters[1]).toMatchObject({ limit: 7, windowMs: 5000 });
  });

  it('env tidak sah jatuh ke bawaan (limit < 1, jendela < 1000, bukan bilangan bulat)', () => {
    for (const [lim, win] of [['0', '999'], ['abc', '1.5'], ['  ', '']]) {
      process.env[c.envLimit] = lim;
      process.env[c.envWindow] = win;
      c.reset();
      expect(c.check({ kind: 'USER_SESSION', username: 'inv' }, ctxOf())).toBeNull();
      expect(spy.limiters[spy.limiters.length - 1]).toMatchObject({ limit: c.limit, windowMs: 60_000 });
    }
  });

  it('429: kode, pesan, details, konteks log, Retry-After, header kuota', async () => {
    process.env[c.envLimit] = '1';
    c.reset();
    const caller: Caller = { kind: 'GOOGLE_SESSION', email: 'lim@x.test' };
    const ok = ctxOf();
    expect(c.check(caller, ok)).toBeNull();
    const ctx = ctxOf();
    const res = c.check(caller, ctx);
    expect(res?.status).toBe(429);
    expect(spy.rejects).toHaveLength(1);
    const r = spy.rejects[0];
    expect(r.code).toBe('RATE_LIMITED');
    expect(r.message).toBe(c.message);
    const retryAfterSec = (r.details as { retryAfterSec: number }).retryAfterSec;
    expect(r.details).toEqual({ retryAfterSec });
    expect(retryAfterSec).toBeGreaterThanOrEqual(1);
    expect(r.context).toEqual(c.context('GOOGLE_SESSION', retryAfterSec));
    expect(Object.keys(r.context as object)).toEqual(Object.keys(c.context('GOOGLE_SESSION', retryAfterSec)));
    expect(res!.headers.get('Retry-After')).toBe(String(retryAfterSec));
    expect(res!.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect(res!.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe(c.bucket);
    expect(res!.headers.get('x-correlation-id')).toBe(ctx.correlationId);
    const body = await res!.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(body).toEqual({ error: c.message, code: 'RATE_LIMITED', details: { retryAfterSec } });
  });
});
