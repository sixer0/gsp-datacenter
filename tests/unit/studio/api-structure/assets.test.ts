/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// SR-45: aset dan batas (R18 + aset kiriman R12). Sumber: blueprint 05 §2.5 "Aset/Batas",
// register 03 §12 R18, KD-24; FIX-1 M-02 (D-134): sisi > 20.000 px atau > 80 MP -> 413
// ASSET_TOO_LARGE; selain PNG/JPEG -> 415 ASSET_TYPE_UNSUPPORTED; assetRef tak dikenal -> 422
// ASSET_NOT_FOUND; badan JSON > STUDIO_MAX_JSON_BYTES (5 MiB, D-125) -> 413 PAYLOAD_TOO_LARGE.
import './_env';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as R18 from '@/app/api/studio/assets/route';
import { POST as postChapter } from '@/app/api/studio/chapters/route';
import { STUDIO_MAX_JSON_BYTES } from '@/lib/studio/contract/env';
import { type Auth, call, req, withAgent } from './_http';
import { dbGuard, missionFolder, trackDoc, trackSha } from './_db';
import { GIF_1X1, chapterBody, createExtra, e2Chapter, makePng, missionTarget, sha256Hex } from './_fx';
import { prisma } from '@/lib/prisma';

const guard = dbGuard('assets');
beforeAll(async () => guard.setup(), 60_000);
afterAll(async () => {
  const r = await guard.teardown();
  expect(r.residue).toEqual({ docs: 0, assets: 0, templates: 0, jobs: 0 });
  expect(r.after).toEqual(r.before);
}, 120_000);

async function upload(png: Buffer, auth: Auth = 'agent', mime = 'image/png') {
  // Register §12 R18: badan JSON tepat {mime, dataBase64} (tanpa agentId).
  return call(R18.POST(await req('/api/studio/assets', { auth, body: { mime, dataBase64: png.toString('base64') } })));
}
async function chapter(body: Record<string, unknown>) {
  const r = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body: withAgent('agent', body) })));
  trackDoc(r.body?.document?.id);
  return r;
}

describe('R18 unggah aset (beralamat sha256, idempoten)', () => {
  it('POST {mime, dataBase64} -> 201 {asset, created:true} tanpa path; ulang -> 200 created:false', async () => {
    const png = makePng(6, 5);
    const r1 = await upload(png);
    expect(r1.status, JSON.stringify(r1.body).slice(0, 300)).toBe(201);
    expect(r1.body.created).toBe(true);
    expect(r1.body.asset).toMatchObject({ mime: 'image/png', widthPx: 6, heightPx: 5, bytes: png.length });
    expect(String(r1.body.asset.sha256)).toContain(sha256Hex(png));
    expect(JSON.stringify(r1.body)).not.toMatch(/relPath|assets[\\/]/);
    const r2 = await upload(png, 'user');
    expect(r2.status).toBe(200);
    expect(r2.body.created).toBe(false);
    expect(await prisma.studioAsset.count({ where: { sha256: { contains: sha256Hex(png) } } })).toBe(1);
  });

  it('GET ?sha256= -> 200 {asset}; sha tak dikenal -> 404 FILE_NOT_FOUND (KD-24)', async () => {
    const png = makePng(3, 3);
    expect((await upload(png)).status).toBe(201);
    const ok = await call(R18.GET(await req(`/api/studio/assets?sha256=${sha256Hex(png)}`, { auth: 'google' })));
    expect(ok.status).toBe(200);
    expect(ok.body.asset.widthPx).toBe(3);
    const nf = await call(R18.GET(await req(`/api/studio/assets?sha256=${'0'.repeat(64)}`, { auth: 'google' })));
    expect(nf.status).toBe(404);
    expect(nf.body.code).toBe('FILE_NOT_FOUND');
  });

  it('FIX-1 M-02: lebar 20.001 px -> 413 ASSET_TOO_LARGE tanpa baris aset', async () => {
    const png = makePng(20001, 1, 'bit1');
    const r = await upload(png);
    expect(r.status).toBe(413);
    expect(r.body.code).toBe('ASSET_TOO_LARGE');
    // Register §11.3 tidak mewajibkan details untuk ASSET_TOO_LARGE; respons route tidak memuatnya.
    expect(String(r.body.error)).toMatch(/20001|pixel|px/i);
    expect(await prisma.studioAsset.count({ where: { sha256: { contains: sha256Hex(png) } } })).toBe(0);
  });

  it('FIX-1 M-02: 20.000 x 1 px (tepat batas sisi) diterima 201', async () => {
    const r = await upload(makePng(20000, 1, 'bit1'));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(201);
  });

  it('FIX-1 M-02: 9.000 x 9.000 px (81 MP > 80 MP) -> 413 ASSET_TOO_LARGE', async () => {
    const r = await upload(makePng(9000, 9000, 'bit1'));
    expect(r.status).toBe(413);
    expect(r.body.code).toBe('ASSET_TOO_LARGE');
    expect(String(r.body.error)).toMatch(/9000|pixel|px/i);
  });

  it('GIF -> 415 ASSET_TYPE_UNSUPPORTED (magic bytes, bukan mime klien)', async () => {
    trackSha(sha256Hex(GIF_1X1));
    const r = await upload(GIF_1X1, 'agent', 'image/png');
    expect(r.status).toBe(415);
    expect(r.body.code).toBe('ASSET_TYPE_UNSUPPORTED');
  });
});

describe('Aset di kiriman bab (R12)', () => {
  it('assetRef ke aset R18 -> 201; gambar 3.2.3 berlabel Gambar 3.1', async () => {
    const png = makePng(10, 10);
    const up = await upload(png);
    expect(up.status).toBe(201);
    const r = await chapter(chapterBody(missionTarget(missionFolder('aref')), e2Chapter('3'), { ...createExtra(), assets: { 'foto-pmt2': { assetRef: `sha256:${sha256Hex(png)}` } } }));
    expect(r.status, JSON.stringify(r.body).slice(0, 400)).toBe(201);
    expect(r.body.chapter.blocks.find((b: any) => b.address === '3.2.3').artifactLabel).toBe('Gambar 3.1');
  });

  it('assetRef tak dikenal -> 422 ASSET_NOT_FOUND, tanpa dokumen', async () => {
    const folder = missionFolder('anf');
    const r = await chapter(chapterBody(missionTarget(folder), e2Chapter('3'), { ...createExtra(), assets: { 'foto-pmt2': { assetRef: `sha256:${'a'.repeat(64)}` } } }));
    expect(r.status, JSON.stringify(r.body).slice(0, 300)).toBe(422);
    expect(r.body.code).toBe('ASSET_NOT_FOUND');
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });

  it('aset base64 GIF di kiriman bab -> 415 ASSET_TYPE_UNSUPPORTED, tanpa dokumen', async () => {
    const folder = missionFolder('agif');
    const r = await chapter(chapterBody(missionTarget(folder), e2Chapter('3'), { ...createExtra(), assets: { 'foto-pmt2': { mime: 'image/png', dataBase64: GIF_1X1.toString('base64') } } }));
    expect(r.status).toBe(415);
    expect(r.body.code).toBe('ASSET_TYPE_UNSUPPORTED');
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });

  it('aset base64 21.000 px di kiriman bab -> 413 ASSET_TOO_LARGE, tanpa dokumen', async () => {
    const folder = missionFolder('abig');
    const png = makePng(21000, 1, 'bit1');
    const r = await chapter(chapterBody(missionTarget(folder), e2Chapter('3'), { ...createExtra(), assets: { 'foto-pmt2': { mime: 'image/png', dataBase64: png.toString('base64') } } }));
    expect(r.status).toBe(413);
    expect(r.body.code).toBe('ASSET_TOO_LARGE');
    expect(await prisma.studioDocument.count({ where: { missionFolder: folder } })).toBe(0);
  });

  it('badan JSON > 5 MiB (C09) -> 413 PAYLOAD_TOO_LARGE di R12 dan R18', async () => {
    expect(STUDIO_MAX_JSON_BYTES).toBe(5 * 1024 * 1024);
    const big = 'x'.repeat(STUDIO_MAX_JSON_BYTES + 10);
    const body = JSON.stringify({ $schema: 'studio.chapter/v2', agentId: 'sr45-agen-01', pad: big });
    const r12 = await call(postChapter(await req('/api/studio/chapters', { auth: 'agent', body, headers: { 'content-type': 'application/json' } })));
    expect(r12.status).toBe(413);
    expect(r12.body.code).toBe('PAYLOAD_TOO_LARGE');
    const r18 = await call(R18.POST(await req('/api/studio/assets', { auth: 'agent', body: JSON.stringify({ mime: 'image/png', dataBase64: big }), headers: { 'content-type': 'application/json' } })));
    expect(r18.status).toBe(413);
    expect(['PAYLOAD_TOO_LARGE', 'ASSET_TOO_LARGE']).toContain(r18.body.code);
  });
});
