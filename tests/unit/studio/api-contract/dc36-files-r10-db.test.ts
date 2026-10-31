/* eslint-disable @typescript-eslint/no-explicit-any -- uji: badan respons JSON dinamis */
// DC-36 — R10 GET + HEAD /api/studio/files/[id] atas baris `StudioOutputFile` NYATA di DB
// `gsp_agent_hq_v21` (register 05 §9.5, §10 FN-01..FN-07; KD-40; U-2 D-363). Berkas keluaran
// ditulis layanan penyimpanan nyata (`writeOutput`) ke akar workspace UJI (temp OS); baris DB
// di dalam SATU transaksi yang selalu di-ROLLBACK (`_rb.ts`), direktori temp dihapus sesudahnya.
// Nama final yang diharapkan disusun dari ATURAN register (FN-02 docNumberSafe, FN-04 waktu
// detik dipotong, FN-05 sha8 dari sha256 isi yang dihitung uji), bukan dari kode yang diuji.
import './_env';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', async () => ({ prisma: (await import('./_rb')).prismaProxy }));

import { RUN_ID, TEST_WORKSPACE } from './_env';
import { disconnectReal, openRollback, residue, tx, type RollbackWindow } from './_rb';
import { call, params, req, type Called } from './_http';
import { chapter, createWithChapter, createWithRecord, docNumber, missionFolder, record, type Created } from './_fx';
import { writeOutput } from '@/lib/studio/services/storage';
import { GET as getFile, HEAD as headFile } from '@/app/api/studio/files/[id]/route';
import { GET as getDocument } from '@/app/api/studio/documents/[id]/route';

/** C51 (register 05 §14.1) disalin literal. */
const C51 = /^([A-Za-z0-9](?:[A-Za-z0-9.-]{0,78}[A-Za-z0-9])?)_rev(0|[1-9][0-9]{0,5})_([0-9]{8}T[0-9]{6}Z)_([0-9a-f]{8})\.(docx|pdf|html|svg|png)$/;
const FOLDER = missionFolder('r10');
const HTML_C = `<!doctype html><html><body><p>Laporan kontrak DC-36 ${RUN_ID}</p></body></html>`;
const HTML_N = `<!doctype html><html><body><p>Dokumen biasa DC-36 ${RUN_ID}</p></body></html>`;

const docIds: string[] = [];
const fileIds: string[] = [];
let win: RollbackWindow;
let contractDoc: Created;
let plainDoc: Created;
let fileC: any;
let fileN: any;

function sha256(s: string | Buffer): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}
function stamp(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[-:]/g, '');
}
async function store(doc: Created, data: string, fileName: string): Promise<any> {
  const rev = await tx().studioRevision.findUnique({ where: { documentId_revisionNo: { documentId: doc.id, revisionNo: 1 } }, select: { id: true } });
  const out = await writeOutput({ documentId: doc.id, revisionId: rev.id, relDir: `docs/dc36-${RUN_ID}/${doc.id}`, fileName, data, format: 'HTML', role: 'PRIMARY', mime: 'text/html' });
  fileIds.push(out.id);
  return tx().studioOutputFile.findUnique({ where: { id: out.id } });
}
async function get(id: string, qs = ''): Promise<Called> {
  return call(getFile(await req(`/api/studio/files/${id}${qs}`, { auth: 'user' }), params({ id })));
}
async function head(id: string, qs = ''): Promise<Called> {
  return call(headFile(await req(`/api/studio/files/${id}${qs}`, { method: 'HEAD', auth: 'agent' }), params({ id })));
}
function stable(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((v, k) => {
    if (k !== 'x-correlation-id' && k !== 'date') out[k] = v;
  });
  return out;
}

beforeAll(async () => {
  win = await openRollback();
  contractDoc = await createWithRecord(FOLDER, 'kontrak', docNumber('C'), record({ owner: 'data-analyst' }));
  plainDoc = await createWithChapter(FOLDER, 'biasa', docNumber('N'), chapter('1'), 'datum-gsp');
  docIds.push(contractDoc.id, plainDoc.id);
  fileC = await store(contractDoc, HTML_C, `LAP_DATUM_${RUN_ID}_C.html`);
  fileN = await store(plainDoc, HTML_N, `STD_DATUM_${RUN_ID}_N.html`);
}, 120_000);

afterAll(async () => {
  await win.close();
  const left = await residue({ docIds, missionPrefix: FOLDER, runId: RUN_ID, fileIds });
  console.info(`[DC-36 r10] residue=${JSON.stringify(left)}`);
  expect(left).toEqual({ documents: 0, revisions: 0, contractRecords: 0, contractItems: 0, docRefs: 0, outputFiles: 0, templateVersions: 0 });
  await fs.rm(path.join(TEST_WORKSPACE, 'docs', `dc36-${RUN_ID}`), { recursive: true, force: true });
  await disconnectReal();
}, 120_000);

function expectedFinal(docNo: string, row: any, content: string): string {
  // FN-02: `DC36/<run>/C` -> runtun di luar [A-Za-z0-9.-] = '-' (literal register).
  const safe = docNo.replace(/\//g, '-');
  return `${safe}_rev1_${stamp(row.createdAt)}_${sha256(content).slice(0, 8)}.html`;
}

describe('R10 GET: C50 + Content-Disposition (FN-01..FN-07, U-2)', () => {
  it('dokumen ber-contractKind: C50 = nama final C51; Content-Disposition bawaan = nama final (FN-07)', async () => {
    const r = await get(fileC.id);
    expect(r.status).toBe(200);
    expect(r.text).toBe(HTML_C);
    const name = expectedFinal(docNumber('C'), fileC, HTML_C);
    expect(name).toMatch(C51);
    expect(r.headers.get('x-studio-final-filename')).toBe(name);
    expect(r.headers.get('content-disposition')).toBe(`attachment; filename="${name}"; filename*=UTF-8''${name}`);
    expect(r.headers.get('x-studio-sha256')).toBe(sha256(HTML_C));
    expect(fileC.sha256.slice(0, 8)).toBe(C51.exec(name)![4]);
  });

  it('?name=datum menimpa: Content-Disposition = nama DATUM, C50 tetap nama final', async () => {
    const r = await get(fileC.id, '?name=datum');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-disposition')).toContain(`filename="LAP_DATUM_${RUN_ID}_C.html"`);
    expect(r.headers.get('x-studio-final-filename')).toBe(expectedFinal(docNumber('C'), fileC, HTML_C));
  });

  it('dokumen non-kontrak: bawaan DATUM, C50 tetap ada (FN-06); ?name=final -> nama final', async () => {
    const name = expectedFinal(docNumber('N'), fileN, HTML_N);
    const def = await get(fileN.id);
    expect(def.status).toBe(200);
    expect(def.headers.get('content-disposition')).toContain(`filename="STD_DATUM_${RUN_ID}_N.html"`);
    expect(def.headers.get('x-studio-final-filename')).toBe(name);
    const fin = await get(fileN.id, '?name=final');
    expect(fin.headers.get('content-disposition')).toBe(`attachment; filename="${name}"; filename*=UTF-8''${name}`);
  });

  it('R05 ?rev=1 outputs[].finalFileName = C50 R10 (verifikasi berbasis nama, §10 KD-40)', async () => {
    const r = await call(getDocument(await req(`/api/studio/documents/${contractDoc.id}?rev=1`, { auth: 'agent' }), params({ id: contractDoc.id })));
    expect(r.status, r.text.slice(0, 300)).toBe(200);
    const out = r.body.outputs.find((o: any) => o.id === fileC.id);
    expect(out.finalFileName).toBe(expectedFinal(docNumber('C'), fileC, HTML_C));
  });

  it('?name tidak sah -> 400 SCHEMA_INVALID /query/name', async () => {
    const r = await get(fileC.id, '?name=asli');
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('SCHEMA_INVALID');
    expect(r.body.details).toEqual([expect.objectContaining({ pointer: '/query/name' })]);
  });
});

describe('R10 HEAD (KD-40): header = GET, tanpa badan', () => {
  it('HEAD ?verify=1 = GET ?verify=1 (selain correlation id), badan kosong, Sha256-Verified true', async () => {
    const g = await get(fileC.id, '?verify=1');
    const h = await head(fileC.id, '?verify=1');
    expect(h.status).toBe(200);
    expect(h.text).toBe('');
    expect(stable(h.headers)).toEqual(stable(g.headers));
    expect(h.headers.get('x-studio-sha256-verified')).toBe('true');
    expect(h.headers.get('x-studio-final-filename')).toBe(expectedFinal(docNumber('C'), fileC, HTML_C));
  });

  it('HEAD ?name=datum&verify=1 pada non-kontrak: C50 nama final, verified true', async () => {
    const h = await head(fileN.id, '?name=datum&verify=1');
    expect(h.status).toBe(200);
    expect(h.headers.get('x-studio-final-filename')).toBe(expectedFinal(docNumber('N'), fileN, HTML_N));
    expect(h.headers.get('x-studio-sha256-verified')).toBe('true');
  });

  it('isi disk diubah -> HEAD ?verify=1 verified false (nama final tetap dari sha DB)', async () => {
    const abs = path.join(TEST_WORKSPACE, ...fileN.relPath.split('/'));
    await fs.writeFile(abs, `${HTML_N}<!-- diubah -->`);
    const h = await head(fileN.id, '?verify=1');
    expect(h.status).toBe(200);
    expect(h.headers.get('x-studio-sha256-verified')).toBe('false');
    expect(h.headers.get('x-studio-final-filename')).toBe(expectedFinal(docNumber('N'), fileN, HTML_N));
  });

  it('galat tanpa badan: id tidak ada 404, ?name tidak sah 400', async () => {
    const nf = await head('cdc36nofile000000000000000');
    expect([nf.status, nf.text]).toEqual([404, '']);
    const bad = await head(fileC.id, '?name=FINAL');
    expect([bad.status, bad.text]).toEqual([400, '']);
  });
});
