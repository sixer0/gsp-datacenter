// S72: kesiapan render-env (S91, HANYA MEMBACA) + layanan soffice (S92):
// validasi masukan tanpa spawn, smoke DOCX -> PDF satu instans dengan akar
// kerja pendek S72, dan bukti bahwa registri fon HKCU tidak berubah.
// Bila render-env tidak siap, smoke PDF DILEWATI dengan alasan tercetak (skip jujur).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RenderEnvReadiness } from '@/lib/studio/contract';
import { resetStudioEnvCache } from '@/lib/studio/contract/env';
import { RENDER_ENV_SCHEMA, RENDER_ENV_SOFFICE_VERSION } from '@/lib/studio/contract/render-env';
import { assembleDocx } from '@/lib/studio/engine/docx/assemble';
import { checkRenderEnvReadiness, convertDocxToPdf, resetReadinessCache, safeBaseName } from '@/lib/studio/engine/soffice';
import { REPO, S72_WORK, canonicalTemplate, loadFixtureDoc, makeCtx, snapshotOf } from './_kit';

const HKCU_FONTS = 'HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts';
const WS = path.join(S72_WORK, 'ws');
const ENV_KEYS = ['STUDIO_WORKSPACE_ROOT', 'STUDIO_SOFFICE_MAX_INSTANCES', 'STUDIO_SOFFICE_TIMEOUT_MS'] as const;
const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

function hkcuFontsSnapshot(): string | null {
  if (process.platform !== 'win32') return null;
  const r = spawnSync('reg.exe', ['query', HKCU_FONTS], { encoding: 'utf8', windowsHide: true, timeout: 15_000 });
  return r.status === 0 ? r.stdout : null;
}

let hkcuBefore: string | null = null;
let readiness: RenderEnvReadiness;

beforeAll(async () => {
  hkcuBefore = hkcuFontsSnapshot();
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  mkdirSync(WS, { recursive: true });
  process.env.STUDIO_WORKSPACE_ROOT = WS;
  process.env.STUDIO_SOFFICE_MAX_INSTANCES = '1';
  process.env.STUDIO_SOFFICE_TIMEOUT_MS = '180000';
  resetStudioEnvCache();
  resetReadinessCache();
  readiness = await checkRenderEnvReadiness({ force: true });
}, 120_000);

afterAll(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  resetStudioEnvCache();
  resetReadinessCache();
});

describe('manifest render-env (S91), baca saja', () => {
  const manifestPath = path.join(REPO, 'render-env', 'manifest.json');
  const m = JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^﻿/, '')) as {
    schema: string;
    soffice: { path: string; version: string };
    fonts: Array<{ family: string; style: string; file: string; sha256: string; hkcuValueName: string; required: boolean }>;
  };

  it('skema dan versi soffice sesuai kontrak', () => {
    expect(m.schema).toBe(RENDER_ENV_SCHEMA);
    expect(m.soffice.version).toBe(RENDER_ENV_SOFFICE_VERSION);
  });

  it('entri fon lengkap: family/style/file/sha256 64 heks/hkcuValueName/required; tanpa duplikat', () => {
    expect(m.fonts.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const f of m.fonts) {
      expect(typeof f.family === 'string' && f.family.length > 0).toBe(true);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/i);
      expect(typeof f.hkcuValueName === 'string' && f.hkcuValueName.length > 0, f.file).toBe(true);
      expect(typeof f.required).toBe('boolean');
      const k = `${f.family}|${f.style}`;
      expect(seen.has(k), k).toBe(false);
      seen.add(k);
    }
  });

  it('sha256 berkas fon terpasang = manifest (pemeriksaan independen dari readiness)', () => {
    const mismatch = m.fonts
      .filter((f) => f.required && existsSync(f.file))
      .filter((f) => createHash('sha256').update(readFileSync(f.file)).digest('hex') !== f.sha256.toLowerCase())
      .map((f) => `${f.family} ${f.style}`);
    expect(mismatch).toEqual([]);
  });
});

describe('cek kesiapan engine/soffice (read-only)', () => {
  it('bentuk RenderEnvReadiness sah; ready=false selalu disertai errors', () => {
    expect(typeof readiness.ready).toBe('boolean');
    expect(typeof readiness.checkedAt).toBe('string');
    expect(readiness.manifestSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Array.isArray(readiness.fonts) && Array.isArray(readiness.errors)).toBe(true);
    if (!readiness.ready) expect(readiness.errors.length).toBeGreaterThan(0);
    else {
      expect(readiness.errors).toEqual([]);
      expect(readiness.soffice).toMatchObject({ found: true, versionOk: true, version: RENDER_ENV_SOFFICE_VERSION });
      for (const f of readiness.fonts) expect(f.fileExists && f.sha256Ok, `${f.family} ${f.style}`).toBe(true);
    }
  });

  it('skrip render-env/check_readiness.mjs (S91) sepakat dengan engine soal soffice dan fon', () => {
    const r = spawnSync(process.execPath, [path.join(REPO, 'render-env', 'check_readiness.mjs'), '--skip-session'], {
      cwd: REPO,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 120_000,
    });
    expect([0, 3]).toContain(r.status);
    const script = JSON.parse(r.stdout) as RenderEnvReadiness;
    expect(script.soffice.versionOk).toBe(readiness.soffice.versionOk);
    expect(script.manifestSha256).toBe(readiness.manifestSha256);
    const key = (f: RenderEnvReadiness['fonts'][number]) => `${f.family}|${f.style}|${f.fileExists}|${f.sha256Ok}|${f.registered}`;
    expect(script.fonts.map(key).sort()).toEqual(readiness.fonts.map(key).sort());
  }, 150_000);
});

describe('validasi masukan konversi (tanpa menjalankan soffice)', () => {
  it('bukan ZIP -> PDF_CONVERT_FAILED', async () => {
    await expect(convertDocxToPdf(new TextEncoder().encode('%PDF-bukan docx'), { jobId: 's72-bad', fileName: 'x' })).rejects.toMatchObject({
      code: 'PDF_CONVERT_FAILED',
    });
  });

  it.each(['../keluar', 'a/b', 'spasi ada', '', 'x'.repeat(101)])('jobId tidak sah %j -> PATH_OUTSIDE_ROOT', async (jobId) => {
    const zipMagic = new Uint8Array([0x50, 0x4b, 3, 4, 0, 0, 0, 0]);
    await expect(convertDocxToPdf(zipMagic, { jobId, fileName: 'x' })).rejects.toMatchObject({ code: 'PATH_OUTSIDE_ROOT' });
  });

  it('safeBaseName membuang pemisah path, karakter terlarang, kendali dan ekstensi', () => {
    expect(safeBaseName('..\\..\\Windows\\evil.docx')).not.toMatch(/[\\/]/);
    expect(safeBaseName('a<b>c:d"e|f?g*h\u0001.pdf')).toBe('a b c d e f g h');
    expect(safeBaseName('...')).toBe('document');
    expect(safeBaseName('x'.repeat(300)).length).toBeLessThanOrEqual(120);
  });
});

describe('smoke DOCX -> PDF lewat layanan soffice (1 instans, akar kerja pendek)', () => {
  it('fixture tabel -> PDF sah (%PDF-, > 1 KB, halaman >= 1, fon Plex dipakai); folder job dibersihkan', async (ctx) => {
    if (!readiness.ready) {
      ctx.skip(`render-env tidak siap: ${readiness.errors.join('; ')}`);
      return;
    }
    const tpl = await canonicalTemplate();
    const snap = snapshotOf(loadFixtureDoc('doc_nota_tables'));
    const docx = (await assembleDocx(makeCtx(snap, tpl).ctx)).bytes;
    const jobId = `s72-smoke-${process.pid}`;
    const r = await convertDocxToPdf(docx, { jobId, fileName: 'nota tabel s72' });
    const head = new TextDecoder('latin1').decode(r.pdf.subarray(0, 5));
    expect(head).toBe('%PDF-');
    expect(r.pdf.length).toBeGreaterThan(1024);
    const text = Buffer.from(r.pdf).toString('latin1');
    expect((text.match(/\/Type\s*\/Page\b/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(/\/BaseFont\s*\/[A-Z]{6}\+IBMPlex/.test(text)).toBe(true);
    expect(r.durationMs).toBeLessThan(180_000);
    const tmp = path.join(WS, 'tmp');
    expect(existsSync(path.join(tmp, jobId))).toBe(false);
    if (existsSync(tmp)) expect(readdirSync(tmp).filter((n) => n.startsWith('s72-'))).toEqual([]);
  }, 240_000);
});

describe('larangan HKCU', () => {
  it('registri fon HKCU identik sebelum dan sesudah suite ini (tidak ada penulisan)', (ctx) => {
    if (hkcuBefore === null) {
      ctx.skip('reg.exe query HKCU tidak tersedia (bukan Windows atau gagal dibaca)');
      return;
    }
    expect(hkcuFontsSnapshot()).toBe(hkcuBefore);
  });
});
