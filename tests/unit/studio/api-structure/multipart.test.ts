// SR-45 lanjutan (D-305, celah M-5 SR-58): unggah aset MULTIPART R18. Sumber: register 03 §12 R18,
// blueprint 05 §2.5 (aset/batas), D-61 (batas multipart dari header + streaming), D-134 (multipart
// hanya R18/R09), D-255 (kuota 512 MiB/24 jam per peminta -> 429 + Retry-After). Kuota diuji dengan
// batas diturunkan lewat env uji `STUDIO_ASSET_QUOTA_BYTES_PER_DAY` (1 MiB; dibaca per panggilan),
// tanpa berkas besar di disk. DB v21, fixture 0 sisa.
import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import * as R18 from '@/app/api/studio/assets/route';
import { STUDIO_MAX_ASSET_BYTES } from '@/lib/studio/contract/env';
import { TEST_WORKSPACE } from './_env';
import { BASE_URL, PLAIN_USER, type Auth, authHeaders, call } from './_http';
import { dbGuard } from './_db';
import { GIF_1X1, makePng, sha256Hex } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('multipart');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

interface Part {
  bytes: Uint8Array;
  name?: string;
  type?: string;
  field?: string;
}

async function multipart(parts: Part[], auth: Auth = 'user', extraHeaders: Record<string, string> = {}, query = '') {
  const form = new FormData();
  for (const p of parts) form.append(p.field ?? 'file', new Blob([p.bytes as Uint8Array<ArrayBuffer>], { type: p.type ?? 'image/png' }), p.name ?? 'foto.png');
  const headers = { ...(await authHeaders(auth)), ...extraHeaders };
  const r = new NextRequest(new URL(`/api/studio/assets${query}`, BASE_URL), { method: 'POST', body: form, headers });
  return call(R18.POST(r));
}

async function assetRow(sha: string) {
  return prisma.studioAsset.findFirst({ where: { sha256: { contains: sha } }, select: { sha256: true, relPath: true, createdBy: true, bytes: true } });
}

describe('R18 multipart: sah, dedupe sha256, auth', () => {
  it('anonim -> 401, tanpa baris', async () => {
    const png = makePng(5, 5);
    const r = await multipart([{ bytes: png }], 'none');
    expect(r.status).toBe(401);
    expect(r.body).toEqual({ error: 'Unauthorized' });
    expect(await assetRow(sha256Hex(png))).toBeNull();
  });

  it('multipart sah (USER) -> 201 {asset, created:true}, MIME dari magic bytes, tanpa path; ulang -> 200 created:false', async () => {
    const png = makePng(7, 3);
    const r1 = await multipart([{ bytes: png, type: 'application/octet-stream' }]);
    expect(r1.status, JSON.stringify(r1.body).slice(0, 300)).toBe(201);
    expect(r1.body.created).toBe(true);
    expect(r1.body.asset).toMatchObject({ mime: 'image/png', widthPx: 7, heightPx: 3, bytes: png.length });
    expect(String(r1.body.asset.sha256)).toContain(sha256Hex(png));
    expect(JSON.stringify(r1.body)).not.toMatch(/relPath|assets[\\/]|[A-Za-z]:\\/);
    const r2 = await multipart([{ bytes: png }], 'google');
    expect(r2.status).toBe(200);
    expect(r2.body.created).toBe(false);
    expect(await prisma.studioAsset.count({ where: { sha256: { contains: sha256Hex(png) } } })).toBe(1);
    expect((await assetRow(sha256Hex(png)))?.createdBy).toBe(`user:${PLAIN_USER}`);
  });

  it('dedupe lintas bentuk: JSON base64 lalu multipart byte sama -> 200 created:false', async () => {
    const png = makePng(4, 6);
    const j = await call(
      R18.POST(new NextRequest(new URL('/api/studio/assets', BASE_URL), { method: 'POST', headers: { ...(await authHeaders('user')), 'content-type': 'application/json' }, body: JSON.stringify({ mime: 'image/png', dataBase64: png.toString('base64') }) })),
    );
    expect(j.status).toBe(201);
    const m = await multipart([{ bytes: png }], 'agent');
    expect(m.status).toBe(200);
    expect(m.body.created).toBe(false);
  });

  it('?mission= sah menautkan misi; tanpa bagian file -> 400; dua bagian file -> 400; field non-berkas -> 400', async () => {
    const png = makePng(3, 2);
    const folder = '2099-01-01_sr45-fx-mp';
    const ok = await multipart([{ bytes: png }], 'user', {}, `?mission=${folder}`);
    expect(ok.status).toBe(201);
    expect((await prisma.studioAsset.findFirst({ where: { sha256: { contains: sha256Hex(png) } }, select: { missionFolder: true } }))?.missionFolder).toBe(folder);
    const none = await multipart([{ bytes: makePng(2, 2), field: 'gambar' }]);
    expect(none.status).toBe(400);
    expect(none.body.code).toBe('SCHEMA_INVALID');
    expect(JSON.stringify(none.body.details)).toContain('/file');
    const two = await multipart([{ bytes: makePng(2, 3) }, { bytes: makePng(3, 3) }]);
    expect(two.status).toBe(400);
    expect(two.body.code).toBe('SCHEMA_INVALID');
    const form = new FormData();
    form.append('file', 'bukan-berkas');
    const s = await call(R18.POST(new NextRequest(new URL('/api/studio/assets', BASE_URL), { method: 'POST', body: form, headers: await authHeaders('user') })));
    expect(s.status).toBe(400);
    expect(s.body.code).toBe('SCHEMA_INVALID');
  });
});

describe('R18 multipart: tipe, ukuran, nama berkas berbahaya', () => {
  it('GIF (meski Content-Type bagian image/png) -> 415 ASSET_TYPE_UNSUPPORTED, tanpa baris', async () => {
    const r = await multipart([{ bytes: GIF_1X1, type: 'image/png', name: 'foto.png' }]);
    expect(r.status).toBe(415);
    expect(r.body.code).toBe('ASSET_TYPE_UNSUPPORTED');
    expect(await assetRow(sha256Hex(GIF_1X1))).toBeNull();
  });

  it('teks/SVG bernama .png -> 415 ASSET_TYPE_UNSUPPORTED', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const r = await multipart([{ bytes: svg, type: 'image/png', name: 'gambar.png' }]);
    expect(r.status).toBe(415);
    expect(r.body.code).toBe('ASSET_TYPE_UNSUPPORTED');
  });

  it('bagian berkas > STUDIO_MAX_ASSET_BYTES (20 MiB + 1, di memori) -> 413 ASSET_TOO_LARGE, tanpa baris', async () => {
    const big = new Uint8Array(STUDIO_MAX_ASSET_BYTES + 1);
    big.set(makePng(2, 2));
    const before = await prisma.studioAsset.count();
    const r = await multipart([{ bytes: big }]);
    expect(r.status).toBe(413);
    expect(r.body.code).toBe('ASSET_TOO_LARGE');
    expect(JSON.stringify(r.body)).not.toMatch(/[A-Za-z]:\\|relPath/);
    expect(await prisma.studioAsset.count()).toBeLessThanOrEqual(before);
  });

  it('Content-Length menyatakan > batas multipart (D-61, tolak dari header) -> 413 ASSET_TOO_LARGE', async () => {
    const png = makePng(2, 2);
    const boundary = 'sr45boundary';
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`;
    const body = Buffer.concat([Buffer.from(head), png, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    const headers = { ...(await authHeaders('user')), 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(STUDIO_MAX_ASSET_BYTES + 2 * 1024 * 1024) };
    const r = await call(R18.POST(new NextRequest(new URL('/api/studio/assets', BASE_URL), { method: 'POST', body, headers })));
    expect(r.status).toBe(413);
    expect(r.body.code).toBe('ASSET_TOO_LARGE');
    expect(await assetRow(sha256Hex(png))).toBeNull();
  });

  it.each(['../../../../evil.png', '..\\..\\..\\evil.png', '/etc/passwd', 'C:\\Windows\\evil.png', 'a/../../evil\u0000.png'])(
    'nama berkas %j tidak memengaruhi jalur: tersimpan beralamat sha (assets/<sha2>/<sha>.png), tanpa berkas di luar workspace',
    async (name) => {
      const png = makePng(3, 4);
      const sha = sha256Hex(png);
      const r = await multipart([{ bytes: png, name }]);
      expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
      expect(JSON.stringify(r.body)).not.toContain('evil');
      const row = await assetRow(sha);
      expect(row?.relPath.replace(/\\/g, '/')).toBe(`assets/${sha.slice(0, 2)}/${sha}.png`);
      for (const p of [path.resolve(TEST_WORKSPACE, '..', 'evil.png'), path.resolve(TEST_WORKSPACE, '..', '..', 'evil.png'), path.resolve(TEST_WORKSPACE, 'evil.png')]) {
        expect(fs.existsSync(p)).toBe(false);
      }
    },
  );
});

describe('D-255: kuota aset per peminta per 24 jam (batas uji 1 MiB)', () => {
  const saved = process.env.STUDIO_ASSET_QUOTA_BYTES_PER_DAY;
  afterEach(() => {
    if (saved === undefined) delete process.env.STUDIO_ASSET_QUOTA_BYTES_PER_DAY;
    else process.env.STUDIO_ASSET_QUOTA_BYTES_PER_DAY = saved;
  });

  it('aset baru melampaui kuota -> 429 RATE_LIMITED + Retry-After + details.reason; sha yang sudah ada tetap 200 (dedupe tidak dihitung)', async () => {
    process.env.STUDIO_ASSET_QUOTA_BYTES_PER_DAY = String(1024 * 1024);
    const used = (await prisma.studioAsset.aggregate({ where: { createdBy: `user:${PLAIN_USER}` }, _sum: { bytes: true } }))._sum.bytes ?? 0;
    expect(used).toBeLessThan(64 * 1024); // ember USER run ini hampir kosong
    const a = makePng(400, 400); // ~480 KB acak (tidak termampatkan)
    const b = makePng(400, 400);
    const c = makePng(400, 400);
    expect((await multipart([{ bytes: a }])).status).toBe(201);
    expect((await multipart([{ bytes: b }])).status).toBe(201);
    const over = await multipart([{ bytes: c }]);
    expect(over.status, JSON.stringify(over.body).slice(0, 300)).toBe(429);
    expect(over.body.code).toBe('RATE_LIMITED');
    expect(Number(over.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(over.body.details).toMatchObject({ reason: 'asset_quota_exceeded', bucket: 'caller', quotaBytes: 1024 * 1024, windowHours: 24 });
    expect(await assetRow(sha256Hex(c))).toBeNull();
    const again = await multipart([{ bytes: a }]);
    expect(again.status).toBe(200);
    expect(again.body.created).toBe(false);
    // Peminta lain (ember berbeda) tidak terkena.
    const other = await multipart([{ bytes: c }], 'google');
    expect(other.status, JSON.stringify(other.body).slice(0, 300)).toBe(201);
  });
});
