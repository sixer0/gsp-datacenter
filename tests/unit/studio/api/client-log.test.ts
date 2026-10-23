// S74 — POST /api/studio/client-log (IP-09, F-031): sink galat UI Studio.
// Sumber ekspektasi: docstring route (202 `{accepted, correlationId}`; 400 JSON_MALFORMED/SCHEMA_INVALID;
// 401; 413 > 16 KiB; 429 > 30 entri/menit/sesi + Retry-After) dan aturan sanitasi
// (kunci rahasia -> [redacted], Bearer/JWT/kunci=nilai disamarkan, path profil -> %USERPROFILE%).
// Prisma DI-MOCK (route ini tidak boleh menyentuh DB sama sekali).
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { dbCalls, resetDb } from './_prisma';
import { jsonOf, req, type AuthKind } from './_studio';
import { POST } from '@/app/api/studio/client-log/route';

let lines: string[];

beforeEach(() => {
  resetDb();
  lines = [];
  const grab = (...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  };
  vi.spyOn(console, 'info').mockImplementation(grab);
  vi.spyOn(console, 'warn').mockImplementation(grab);
  vi.spyOn(console, 'error').mockImplementation(grab);
});

const clientEntries = () => lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((e) => e && e.source === 'studio.client');

let seq = 0;
/** Setiap uji memakai sesi berbeda agar pembatas laju per sesi tidak saling memengaruhi. */
const post = async (body: unknown, auth: AuthKind = 'user', extra: Record<string, string> = {}) =>
  POST(await req('/api/studio/client-log', { auth, user: `ui-${++seq}`, body, headers: extra }));

describe('client-log — penerimaan', () => {
  it.each(['admin', 'user', 'google', 'agent'] as AuthKind[])('%s: entri sah -> 202 {accepted:true, correlationId} tanpa akses DB', async (auth) => {
    const res = await post({ level: 'error', message: 'Gagal memuat templat', route: '/studio/templates', code: 'TEMPLATE_NOT_FOUND', status: 404 }, auth);
    expect(res.status).toBe(202);
    const b = await jsonOf(res);
    expect(b.accepted).toBe(true);
    expect(typeof b.correlationId).toBe('string');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(dbCalls()).toEqual([]);
  });

  it('correlationId klien yang sah dipakai untuk entri log', async () => {
    const res = await post({ level: 'warn', message: 'lambat', correlationId: 'ui-corr-000123' });
    expect((await jsonOf(res)).correlationId).toBe('ui-corr-000123');
    const e = clientEntries().at(-1);
    expect(e.correlationId).toBe('ui-corr-000123');
    expect(e.method).toBe('CLIENT');
  });

  it('alias rekaman konsol lama (correlation_id, stack_trace, context) diterima', async () => {
    const res = await post({ level: 'error', message: 'x', correlation_id: 'ui-corr-000999', stack_trace: 'Error: x', context: { tab: 'versi' } });
    expect(res.status).toBe(202);
    expect((await jsonOf(res)).correlationId).toBe('ui-corr-000999');
  });
});

describe('client-log — sanitasi rahasia sebelum log', () => {
  it('kunci rahasia di detail, Bearer, JWT, kunci=nilai, path profil, query rahasia -> tersamar di entri log', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJlLXJhaGFzaWE';
    const res = await post({
      level: 'error',
      message: `Gagal: Authorization Bearer abc.def-ghi token=tok-RAHASIA-1 ${jwt}`,
      route: '/studio/templates?id=7&session=SES-RAHASIA-2#frag',
      stack: 'Error: x\n    at C:\\Users\\TRIAL\\proj\\file.ts:1:1',
      detail: { password: 'PW-RAHASIA-3', nested: { apiKey: 'KEY-RAHASIA-4', ok: 'nilai biasa' } },
    });
    expect(res.status).toBe(202);
    const raw = lines.join('\n');
    for (const secret of ['abc.def-ghi', 'tok-RAHASIA-1', jwt, 'SES-RAHASIA-2', 'PW-RAHASIA-3', 'KEY-RAHASIA-4', 'C:\\\\Users\\\\TRIAL', '#frag']) {
      expect(raw).not.toContain(secret);
    }
    const e = clientEntries().at(-1);
    expect(e.context.detail).toEqual({ password: '[redacted]', nested: { apiKey: '[redacted]', ok: 'nilai biasa' } });
    expect(e.route).toBe('/studio/templates?id=7&session=[redacted]');
    expect(e.stack_trace).toContain('%USERPROFILE%');
  });

  it('identitas dicatat sebagai jenis + requester, tanpa cookie/secret', async () => {
    await post({ level: 'info', message: 'halo' }, 'agent');
    const raw = lines.join('\n');
    expect(raw).not.toContain('unit-internal-secret');
    expect(raw).not.toContain('gsp_hq_session=');
    expect(clientEntries().at(-1).context).toMatchObject({ callerKind: 'INTERNAL_AGENT', requester: 'anonymous-internal' });
  });
});

describe('client-log — penolakan', () => {
  it('kunci asing -> 400 SCHEMA_INVALID additionalProperties', async () => {
    const res = await post({ level: 'error', message: 'x', cookie: 'a=b' });
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(b.details).toContainEqual(expect.objectContaining({ pointer: '/cookie', keyword: 'additionalProperties' }));
  });

  it.each([
    [{ level: 'fatal', message: 'x' }, '/level'],
    [{ level: 'error', message: '   ' }, '/message'],
    [{ level: 'error', message: 'x', status: 700 }, '/status'],
    [{ level: 'error', message: 'x', correlationId: 'pendek' }, '/correlationId'],
    [{ level: 'error', message: 'x', detail: [1, 2] }, '/detail'],
  ])('badan %j -> 400 SCHEMA_INVALID pointer %s', async (body, pointer) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).details).toContainEqual(expect.objectContaining({ pointer }));
  });

  it('badan > 16 KiB -> 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await post({ level: 'error', message: 'x', detail: { blob: 'a'.repeat(17 * 1024) } });
    expect(res.status).toBe(413);
    expect((await jsonOf(res)).code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('JSON rusak -> 400 JSON_MALFORMED', async () => {
    const res = await post('{"level":', 'user', { 'content-type': 'application/json' });
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).code).toBe('JSON_MALFORMED');
  });

  it('entri ke-31 dalam satu menit dari sesi yang sama -> 429 + Retry-After; sesi lain tidak terdampak', async () => {
    const send = async (user: string) => POST(await req('/api/studio/client-log', { auth: 'user', user, body: { level: 'info', message: 'm' } }));
    for (let i = 0; i < 30; i++) expect((await send('laju-a')).status).toBe(202);
    const limited = await send('laju-a');
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect((await jsonOf(limited)).error).toMatch(/Too many/);
    expect((await send('laju-b')).status).toBe(202);
  });
});
