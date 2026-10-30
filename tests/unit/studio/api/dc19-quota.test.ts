// DC-19 — header kuota QH-01..QH-06 + bucket `query` (register 05 §9.6, C46-C49, E53, KD-38).
// Prisma DI-MOCK (tanpa DB); server dev tidak dipakai: uji helper + route handler langsung.
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const submit = vi.hoisted(() => ({ dryRunChapter: vi.fn(), dryRunSlot: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/lib/studio/services/submit', async (orig) => ({ ...(await orig<object>()), ...submit }));

import { fakeJob, req } from './_studio';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import type { StudioCaller } from '@/lib/studio/contract/auth';
import { handleRenderPost, type RenderRouteDeps } from '@/app/api/studio/documents/[id]/render/_lib/handler';
import { checkRenderRate, json, reqCtx, resetRenderRateLimiter, type ReqCtx } from '@/lib/studio/http';
import {
  applyQuotaHeaders,
  checkQueryRate,
  QUERY_RATE_LIMIT_DEFAULT,
  QUERY_RATE_WINDOW_MS_DEFAULT,
  QUOTA_BUCKETS,
  quotaReport,
  recordQuotaCharge,
  resetQueryRateLimiter,
  STUDIO_QUOTA_BUCKET_HEADER,
  STUDIO_QUOTA_REMAINING_HEADER,
  withQuotaHeaders,
} from '@/lib/studio/http/quota';
import { checkValidateRate, resetValidateRateLimiter } from '@/app/api/studio/validate/_shared/validate-rate';
import { checkImportRate, resetImportRateLimiter } from '@/app/api/studio/import/markdown/_lib/import-rate';
import { POST as postValidate } from '@/app/api/studio/validate/route';
import { POST as postImport } from '@/app/api/studio/import/markdown/route';
import { POST as postRender } from '@/app/api/studio/documents/[id]/render/route';

const ENV_KEYS = [
  'STUDIO_RENDER_RATE_LIMIT',
  'STUDIO_VALIDATE_RATE_LIMIT',
  'STUDIO_IMPORT_RATE_LIMIT',
  'STUDIO_QUERY_RATE_LIMIT',
  'STUDIO_QUERY_RATE_WINDOW_MS',
] as const;

function resetAll(): void {
  resetRenderRateLimiter();
  resetValidateRateLimiter();
  resetImportRateLimiter();
  resetQueryRateLimiter();
}

function ctxOf(path = '/api/studio/x'): ReqCtx {
  return reqCtx(new Request(`https://127.0.0.1${path}`, { method: 'POST' }), path);
}

type Check = (caller: { kind: 'USER_SESSION'; username: string }, ctx: ReqCtx) => Response | null;

const BUCKETS: Array<{ bucket: string; env: string; check: Check }> = [
  { bucket: 'render', env: 'STUDIO_RENDER_RATE_LIMIT', check: checkRenderRate },
  { bucket: 'validate', env: 'STUDIO_VALIDATE_RATE_LIMIT', check: checkValidateRate },
  { bucket: 'import', env: 'STUDIO_IMPORT_RATE_LIMIT', check: checkImportRate },
  { bucket: 'query', env: 'STUDIO_QUERY_RATE_LIMIT', check: checkQueryRate },
];

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  resetAll();
});

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  resetAll();
});

describe('DC-19 konstanta dan enum', () => {
  it('C46/C47, C48/C49, E53 sesuai register', () => {
    expect(QUERY_RATE_LIMIT_DEFAULT).toBe(120);
    expect(QUERY_RATE_WINDOW_MS_DEFAULT).toBe(60_000);
    expect(STUDIO_QUOTA_REMAINING_HEADER).toBe('X-Studio-Quota-Remaining');
    expect(STUDIO_QUOTA_BUCKET_HEADER).toBe('X-Studio-Quota-Bucket');
    expect([...QUOTA_BUCKETS]).toEqual(['render', 'validate', 'import', 'query']);
  });

  it('bucket query membaca env STUDIO_QUERY_RATE_LIMIT', () => {
    process.env.STUDIO_QUERY_RATE_LIMIT = '2';
    resetQueryRateLimiter();
    const caller = { kind: 'USER_SESSION' as const, username: 'q-env' };
    expect(checkQueryRate(caller, ctxOf())).toBeNull();
    expect(checkQueryRate(caller, ctxOf())).toBeNull();
    expect(checkQueryRate(caller, ctxOf())?.status).toBe(429);
  });
});

describe.each(BUCKETS)('DC-19 bucket $bucket (QH-02, QH-03, QH-05)', ({ bucket, env, check }) => {
  it('sisa menurun satu per panggilan; 429 bersisa 0 + Retry-After', async () => {
    process.env[env] = '3';
    resetAll();
    const caller = { kind: 'USER_SESSION' as const, username: `u-${bucket}` };
    const seen: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const ctx = ctxOf();
      expect(check(caller, ctx)).toBeNull();
      // Seperti route: respons apa pun sesudah tagihan (di sini 200) membawa header.
      const res = applyQuotaHeaders(json({ ok: true }, 200, ctx), ctx);
      expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe(bucket);
      seen.push(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER) ?? '');
    }
    expect(seen).toEqual(['2', '1', '0']);

    const ctx = ctxOf();
    const limited = check(caller, ctx);
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect(limited?.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe(bucket);
    expect(Number(limited?.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
    expect(limited?.headers.get('x-correlation-id')).toBe(ctx.correlationId);
    expect((await limited!.json()).code).toBe('RATE_LIMITED');
  });

  it('4xx dan 5xx sesudah tagihan juga membawa header (withQuotaHeaders)', async () => {
    const caller = { kind: 'USER_SESSION' as const, username: `e-${bucket}` };
    for (const status of [400, 404, 500, 503]) {
      const ctx = ctxOf();
      const res = await withQuotaHeaders(ctx, async () => {
        expect(check(caller, ctx)).toBeNull();
        return json({ error: { code: 'X' } }, status, ctx);
      });
      expect(res.status).toBe(status);
      expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe(bucket);
      expect(Number(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER))).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('DC-19 penolakan sebelum tagihan (QH-03)', () => {
  it('tanpa tagihan tercatat -> tidak ada header', () => {
    const ctx = ctxOf();
    const res = applyQuotaHeaders(json({ error: { code: 'UNAUTHORIZED' } }, 401, ctx), ctx);
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBeNull();
    expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBeNull();
    expect(quotaReport(ctx)).toBeNull();
  });

  it('route validate, import, render: 401 tanpa header kuota', async () => {
    const responses = [
      await postValidate(await req('/api/studio/validate', { body: {} })),
      await postImport(await req('/api/studio/import/markdown', { body: {} })),
      await postRender(await req('/api/studio/documents/abcdefghijklmnopqrst/render', { body: { scope: 'document' } }), {
        params: Promise.resolve({ id: 'abcdefghijklmnopqrst' }),
      }),
    ];
    for (const res of responses) {
      expect(res.status).toBe(401);
      expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBeNull();
      expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBeNull();
    }
  });
});

describe('DC-19 route nyata: 429 membawa header kuota', () => {
  it('R08 validate: panggilan kedua 429, sisa 0, bucket validate, Retry-After', async () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '1';
    resetAll();
    const first = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: [] }));
    expect(first.status).toBe(200);
    const second = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: [] }));
    expect(second.status).toBe(429);
    expect(second.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect(second.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('validate');
    expect(second.headers.get('Retry-After')).not.toBeNull();
  });

  it('impor markdown: panggilan kedua 429, sisa 0, bucket import', async () => {
    process.env.STUDIO_IMPORT_RATE_LIMIT = '1';
    resetAll();
    await postImport(await req('/api/studio/import/markdown', { auth: 'agent', body: {} }));
    const second = await postImport(await req('/api/studio/import/markdown', { auth: 'agent', body: {} }));
    expect(second.status).toBe(429);
    expect(second.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect(second.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('import');
    expect(second.headers.get('Retry-After')).not.toBeNull();
  });

  it('R08 ?preview=html: render 429 sesudah validate lolos -> bucket render (QH-04 seri E53)', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '1';
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '2';
    resetAll();
    await postValidate(await req('/api/studio/validate?preview=html', { auth: 'agent', body: [] }));
    const second = await postValidate(await req('/api/studio/validate?preview=html', { auth: 'agent', body: [] }));
    expect(second.status).toBe(429);
    expect(second.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
    expect(second.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('render');
  });
});

describe('DC-19 dua bucket (QH-04, KD-38)', () => {
  it('melaporkan sisa terkecil', () => {
    const ctx = ctxOf();
    recordQuotaCharge(ctx, 'validate', { allowed: true, remaining: 100 });
    recordQuotaCharge(ctx, 'render', { allowed: true, remaining: 7 });
    expect(quotaReport(ctx)).toEqual({ bucket: 'render', remaining: 7 });
    const ctx2 = ctxOf();
    recordQuotaCharge(ctx2, 'import', { allowed: true, remaining: 3 });
    recordQuotaCharge(ctx2, 'validate', { allowed: true, remaining: 50 });
    const res = applyQuotaHeaders(json({}, 200, ctx2), ctx2);
    expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('import');
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('3');
  });

  it('seri diputus urutan E53', () => {
    const ctx = ctxOf();
    recordQuotaCharge(ctx, 'import', { allowed: true, remaining: 5 });
    recordQuotaCharge(ctx, 'validate', { allowed: true, remaining: 5 });
    expect(quotaReport(ctx)).toEqual({ bucket: 'validate', remaining: 5 });
    const ctx2 = ctxOf();
    recordQuotaCharge(ctx2, 'query', { allowed: true, remaining: 0 });
    recordQuotaCharge(ctx2, 'render', { allowed: false, remaining: 0 });
    expect(quotaReport(ctx2)).toEqual({ bucket: 'render', remaining: 0 });
  });

  it('bucket yang ditagih berulang menyimpan sisa terkecil; 429 memaksa 0', () => {
    const ctx = ctxOf();
    recordQuotaCharge(ctx, 'validate', { allowed: true, remaining: 9 });
    recordQuotaCharge(ctx, 'validate', { allowed: true, remaining: 8 });
    expect(quotaReport(ctx)?.remaining).toBe(8);
    const res = applyQuotaHeaders(json({}, 429, ctx), ctx);
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('0');
  });

  it('header beku disalin ke Response baru', () => {
    const ctx = ctxOf();
    recordQuotaCharge(ctx, 'query', { allowed: true, remaining: 4 });
    const frozen = Response.redirect('https://127.0.0.1/x', 302); // header immutable
    const res = applyQuotaHeaders(frozen, ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)).toBe('4');
    expect(res.headers.get(STUDIO_QUOTA_BUCKET_HEADER)).toBe('query');
  });
});

// ── D-364: header terpasang di route (withQuotaHeaders) ──────────────────

const QH_DOC_ID = 'cmvucp1d70002v13c945whd78';
const QH_MD = '# 4. Kinerja\n\n## 4.1 Capaian\n\nGardu C mencapai indeks kesiapan 64 persen.\n';
const QH_CALLER = { kind: 'INTERNAL_AGENT', requester: 'agent:dc19', canWriteClassK: false } as unknown as StudioCaller;

function qh(res: Response): [string | null, string | null] {
  return [res.headers.get(STUDIO_QUOTA_BUCKET_HEADER), res.headers.get(STUDIO_QUOTA_REMAINING_HEADER)];
}

function v2Chapter(): Record<string, unknown> {
  return {
    $schema: 'studio.chapter/v2',
    target: { mission: { folder: '2026-10-30_dc19' }, docKey: 'laporan-survei' },
    chapter: {
      key: '4',
      title: { text: 'Bab 4 uji' },
      sections: [{ title: { text: 'Bagian pertama' }, blocks: [{ type: 'paragraph', text: 'Pengukuran beban dilakukan pada jam puncak.' }] }],
    },
  };
}

function r17Deps(renderScope: RenderRouteDeps['renderScope']): RenderRouteDeps {
  return { getCaller: async () => QH_CALLER, checkRate: checkRenderRate, assertCapacity: () => {}, renderScope, retryAfterSec: () => 1 };
}

async function postR17(body: Record<string, unknown>, d: RenderRouteDeps): Promise<Response> {
  const r = new Request(`https://127.0.0.1/api/studio/documents/${QH_DOC_ID}/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleRenderPost(r, QH_DOC_ID, reqCtx(r, '/api/studio/documents/[id]/render', 'studio.api.render'), d);
}

describe('DC-19 route R08 validate (D-364)', () => {
  beforeEach(() => {
    submit.dryRunChapter.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('2xx sesudah tagihan: header validate, sisa menurun satu per panggilan', async () => {
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '5';
    resetAll();
    const a = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: [] }));
    const b = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: [] }));
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(qh(a)).toEqual(['validate', '4']);
    expect(qh(b)).toEqual(['validate', '3']);
  });

  it('4xx dan 5xx sesudah tagihan membawa header', async () => {
    submit.dryRunChapter.mockRejectedValueOnce(new StudioEngineError('FORBIDDEN', 'caller may not write this document'));
    const forbidden = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: v2Chapter() }));
    expect(forbidden.status).toBe(403);
    expect(qh(forbidden)[0]).toBe('validate');
    submit.dryRunChapter.mockRejectedValueOnce(new Error('db down'));
    const crashed = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: v2Chapter() }));
    expect(crashed.status).toBe(500);
    expect(qh(crashed)[0]).toBe('validate');
  });

  it('penolakan sebelum tagihan (badan JSON rusak) tanpa header', async () => {
    const res = await postValidate(await req('/api/studio/validate', { auth: 'agent', body: '{', headers: { 'content-type': 'application/json' } }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(qh(res)).toEqual([null, null]);
  });

  it('?preview=html dua bucket: melaporkan render bila sisanya terkecil (QH-04)', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '2';
    process.env.STUDIO_VALIDATE_RATE_LIMIT = '10';
    resetAll();
    const res = await postValidate(await req('/api/studio/validate?preview=html', { auth: 'agent', body: [] }));
    expect(res.status).toBe(200);
    expect(qh(res)).toEqual(['render', '1']);
  });
});

describe('DC-19 route impor markdown (D-364)', () => {
  it('2xx dan 4xx sesudah tagihan membawa header import, sisa menurun', async () => {
    process.env.STUDIO_IMPORT_RATE_LIMIT = '5';
    resetAll();
    const ok = await postImport(await req('/api/studio/import/markdown', { auth: 'agent', body: { markdown: QH_MD, chapterKey: '4' } }));
    expect(ok.status).toBe(200);
    expect(qh(ok)).toEqual(['import', '4']);
    const bad = await postImport(await req('/api/studio/import/markdown', { auth: 'agent', body: {} }));
    expect(bad.status).toBe(400);
    expect(qh(bad)).toEqual(['import', '3']);
  });
});

describe('DC-19 R17 render handler (D-364)', () => {
  it('2xx dan 4xx sesudah tagihan membawa header render; 429 sisa 0 + Retry-After', async () => {
    process.env.STUDIO_RENDER_RATE_LIMIT = '3';
    resetAll();
    const okDeps = r17Deps((async () => ({
      job: { ...fakeJob(), scope: 'document', draft: false },
      outputs: [],
      completeness: null,
      errors: [],
    })) as unknown as RenderRouteDeps['renderScope']);
    const ok = await postR17({ scope: 'document' }, okDeps);
    expect(ok.status).toBe(200);
    expect(qh(ok)).toEqual(['render', '2']);

    const missing = r17Deps((async () => {
      throw new StudioEngineError('DOCUMENT_NOT_FOUND', 'document not found');
    }) as unknown as RenderRouteDeps['renderScope']);
    const notFound = await postR17({ scope: 'document' }, missing);
    expect(notFound.status).toBe(404);
    expect(qh(notFound)).toEqual(['render', '1']);

    await postR17({ scope: 'document' }, okDeps);
    const limited = await postR17({ scope: 'document' }, okDeps);
    expect(limited.status).toBe(429);
    expect(qh(limited)).toEqual(['render', '0']);
    expect(limited.headers.get('Retry-After')).not.toBeNull();
  });

  it('badan tidak sah sebelum tagihan -> 400 tanpa header', async () => {
    const res = await postR17({ scope: 'nope' }, r17Deps(null));
    expect(res.status).toBe(400);
    expect(qh(res)).toEqual([null, null]);
  });
});
