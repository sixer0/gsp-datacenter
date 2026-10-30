// DC-18 (register 05 §9.5, §10 FN-06/FN-07; KD-40, AM-14; D-363 U-2): R10
// `/api/studio/files/[id]` memasang header C50 pada setiap respons berkas,
// Content-Disposition = nama final untuk dokumen ber-contractKind (DATUM untuk
// lainnya), `?name=final|datum` menimpa, HEAD = header GET tanpa badan.
// Prisma DI-MOCK; berkas nyata ditulis ke akar workspace uji (temp OS).
import './_env';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());

import { TEST_WORKSPACE } from './_env';
import { callsOf, on, resetDb } from './_prisma';
import { params, req } from './_studio';
import { FINAL_FILENAME_PATTERN, STUDIO_FINAL_FILENAME_HEADER } from '@/lib/studio/contract';
import { OUTPUT_FILE_OWNER_INCLUDE } from '@/lib/studio/services/storage';
import { fileHeaders, parseNameMode, defaultNameMode } from '@/app/api/studio/files/_lib/serve';
import * as files from '@/app/api/studio/files/[id]/route';

const REL_DIR = 'docs/dc18-test/rev-12';
const HTML = '<!doctype html><html><body><p>dc18</p></body></html>';
const DATA = Buffer.from(HTML, 'utf8');
const SHA = createHash('sha256').update(DATA).digest('hex');
const CREATED = new Date('2026-10-30T12:58:00.987Z');
const DATUM_NAME = '003_GSP_KT_X_2026_rev12.html';
const FINAL_NAME = `003-GSP-KT-X-2026_rev12_20261030T125800Z_${SHA.slice(0, 8)}.html`;
const C51 = new RegExp(FINAL_FILENAME_PATTERN);

function row(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'f1',
    documentId: 'doc1',
    revisionId: 'rev1',
    artifactId: null,
    renderJobId: 'job1',
    format: 'HTML',
    role: 'PRIMARY',
    figureLabel: null,
    relPath: `${REL_DIR}/${DATUM_NAME}`,
    fileName: DATUM_NAME,
    bytes: DATA.byteLength,
    sha256: SHA,
    mime: 'text/html; charset=utf-8',
    lintVerdict: 'PASS',
    createdAt: CREATED,
    scopeKind: 'DOCUMENT',
    scopeKey: null,
    draft: false,
    document: { docNumber: '003/GSP/KT/X/2026', contractKind: 'agentWorkReport' },
    revision: { revisionNo: 12 },
    ...over,
  };
}

function installRow(r: Record<string, unknown> | null): void {
  on('studioOutputFile', 'findUnique', async () => r);
}

async function call(method: 'GET' | 'HEAD', query = ''): Promise<Response> {
  const r = await req(`/api/studio/files/f1${query}`, { method, auth: 'agent' });
  return method === 'GET' ? files.GET(r, params({ id: 'f1' })) : files.HEAD(r, params({ id: 'f1' }));
}

function dispositionName(res: Response): string | null {
  const cd = res.headers.get('content-disposition') ?? '';
  return /filename="([^"]*)"/.exec(cd)?.[1] ?? null;
}

beforeAll(() => {
  mkdirSync(path.join(TEST_WORKSPACE, REL_DIR), { recursive: true });
  writeFileSync(path.join(TEST_WORKSPACE, REL_DIR, DATUM_NAME), DATA);
});

beforeEach(() => resetDb());

describe('DC-18 R10 GET: header C50 + nama Content-Disposition (U-2)', () => {
  it('dokumen ber-contractKind: C50 = nama final C51, sha8 = awal sha256, Content-Disposition nama final', async () => {
    installRow(row());
    const res = await call('GET');
    expect(res.status).toBe(200);
    const c50 = res.headers.get(STUDIO_FINAL_FILENAME_HEADER);
    expect(c50).toBe(FINAL_NAME);
    expect(C51.test(c50!)).toBe(true);
    expect(C51.exec(c50!)![4]).toBe(SHA.slice(0, 8));
    expect(dispositionName(res)).toBe(FINAL_NAME);
    expect(res.headers.get('content-disposition')).toBe(`attachment; filename="${FINAL_NAME}"; filename*=UTF-8''${FINAL_NAME}`);
    expect(Buffer.from(await res.arrayBuffer()).equals(DATA)).toBe(true);
    // Relasi pemilik dimuat dalam satu query (tanpa query kedua).
    expect(callsOf('studioOutputFile', 'findUnique')[0][0]).toEqual({ where: { id: 'f1' }, include: OUTPUT_FILE_OWNER_INCLUDE });
  });

  it('dokumen output biasa (contractKind null): C50 tetap ada, Content-Disposition nama DATUM', async () => {
    installRow(row({ document: { docNumber: '003/GSP/KT/X/2026', contractKind: null } }));
    const res = await call('GET');
    expect(res.status).toBe(200);
    expect(res.headers.get(STUDIO_FINAL_FILENAME_HEADER)).toBe(FINAL_NAME);
    expect(dispositionName(res)).toBe(DATUM_NAME);
  });

  it('?name=datum menimpa bawaan final; ?name=final menimpa bawaan DATUM', async () => {
    installRow(row());
    expect(dispositionName(await call('GET', '?name=datum'))).toBe(DATUM_NAME);
    installRow(row({ document: { docNumber: '003/GSP/KT/X/2026', contractKind: null } }));
    expect(dispositionName(await call('GET', '?name=final'))).toBe(FINAL_NAME);
  });

  it('berkas artefak: C50 = ART-<id>_rev0, Content-Disposition DATUM', async () => {
    installRow(row({ documentId: null, revisionId: null, artifactId: 'art_42', document: null, revision: null }));
    const res = await call('GET');
    expect(res.status).toBe(200);
    expect(res.headers.get(STUDIO_FINAL_FILENAME_HEADER)).toBe(`ART-art42_rev0_20261030T125800Z_${SHA.slice(0, 8)}.html`);
    expect(dispositionName(res)).toBe(DATUM_NAME);
  });

  it('?name tidak sah atau ganda -> 400 SCHEMA_INVALID pointer /query/name, tanpa akses DB', async () => {
    installRow(row());
    for (const q of ['?name=x', '?name=FINAL', '?name=final&name=datum', '?name=']) {
      const res = await call('GET', q);
      expect(res.status, q).toBe(400);
      const body = await res.json();
      expect(body.code).toBe('SCHEMA_INVALID');
      expect(JSON.stringify(body.details)).toContain('/query/name');
      expect(res.headers.get(STUDIO_FINAL_FILENAME_HEADER)).toBeNull();
    }
    expect(callsOf('studioOutputFile', 'findUnique')).toHaveLength(0);
  });

  it('?verify=1 tetap: X-Studio-Sha256-Verified true', async () => {
    installRow(row());
    const res = await call('GET', '?verify=1');
    expect(res.headers.get('x-studio-sha256-verified')).toBe('true');
    expect(res.headers.get(STUDIO_FINAL_FILENAME_HEADER)).toBe(FINAL_NAME);
  });
});

describe('DC-18 R10 HEAD (KD-40)', () => {
  it('HEAD ?verify=1: header sama dengan GET, badan kosong, verified true', async () => {
    installRow(row());
    const get = await call('GET', '?verify=1');
    installRow(row());
    const head = await call('HEAD', '?verify=1');
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    for (const h of [STUDIO_FINAL_FILENAME_HEADER, 'content-disposition', 'content-type', 'content-length', 'x-studio-sha256', 'x-studio-sha256-verified']) {
      expect(head.headers.get(h), h).toBe(get.headers.get(h));
    }
    expect(head.headers.get('x-studio-sha256-verified')).toBe('true');
    expect(head.headers.get('content-length')).toBe(String(DATA.byteLength));
    expect(head.headers.get('x-correlation-id')).toBeTruthy();
  });

  it('HEAD sha berbeda -> verified false', async () => {
    installRow(row({ sha256: 'f'.repeat(64) }));
    const head = await call('HEAD', '?verify=1');
    expect(head.headers.get('x-studio-sha256-verified')).toBe('false');
  });

  it('HEAD galat: 404 / 400 / 401 tanpa badan', async () => {
    installRow(null);
    const nf = await call('HEAD');
    expect(nf.status).toBe(404);
    expect(await nf.text()).toBe('');
    const bad = await call('HEAD', '?name=zz');
    expect(bad.status).toBe(400);
    expect(await bad.text()).toBe('');
    const anon = await files.HEAD(await req('/api/studio/files/f1', { method: 'HEAD' }), params({ id: 'f1' }));
    expect(anon.status).toBe(401);
    expect(await anon.text()).toBe('');
  });
});

describe('DC-18 serve.ts murni', () => {
  const base = { fileName: DATUM_NAME, bytes: 1, sha256: SHA, inline: false, download: false };

  it('nama final tidak cocok C51 (mis. CRLF) tidak pernah dipasang; Content-Disposition kembali ke DATUM', () => {
    const h = fileHeaders({ ...base, finalFileName: `${FINAL_NAME}\r\nSet-Cookie: x=1`, nameMode: 'final' });
    expect(h.get(STUDIO_FINAL_FILENAME_HEADER)).toBeNull();
    expect(h.get('content-disposition')).toContain(`filename="${DATUM_NAME}"`);
  });

  it('parseNameMode + defaultNameMode', () => {
    expect(parseNameMode(new URLSearchParams(''))).toBeNull();
    expect(parseNameMode(new URLSearchParams('name=final'))).toBe('final');
    expect(parseNameMode(new URLSearchParams('name=datum'))).toBe('datum');
    expect(parseNameMode(new URLSearchParams('name=Final'))).toBe('invalid');
    expect(parseNameMode(new URLSearchParams('name=final&name=final'))).toBe('invalid');
    expect(defaultNameMode('agentWorkReport')).toBe('final');
    expect(defaultNameMode(null)).toBe('datum');
    expect(defaultNameMode('')).toBe('datum');
  });

  it('inline=1 HTML tetap inline dengan nama final', () => {
    const h = fileHeaders({ ...base, inline: true, finalFileName: FINAL_NAME, nameMode: 'final' });
    expect(h.get('content-disposition')).toBe(`inline; filename="${FINAL_NAME}"; filename*=UTF-8''${FINAL_NAME}`);
    expect(h.get(STUDIO_FINAL_FILENAME_HEADER)).toBe(FINAL_NAME);
  });
});
