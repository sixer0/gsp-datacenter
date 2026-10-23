// FIX-SEC N-05 (SR-57, D-247): log soffice ikut sink JSONL bersama (retensi +
// batas ukuran), dan sink tata letak storage punya batas ukuran per berkas.
// Akar Studio sementara di tmpdir; dibersihkan setelah uji.
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetStudioEnvCache } from '@/lib/studio/contract/env';
import { purgeOldLogs, resetLogPurgeSchedule } from '@/lib/studio/http/jsonl';
import { setSofficeLogSink } from '@/lib/studio/engine/soffice';
import { sofficeLog } from '@/lib/studio/engine/soffice/log';
import { createLayoutLogSink, layoutLogMaxBytes, LAYOUT_LOG_MAX_BYTES_DEFAULT } from '@/lib/studio/services/storage/log';

let root: string;
const saved = { ...process.env };

beforeAll(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'fixsec-logs-'));
  process.env.STUDIO_WORKSPACE_ROOT = root;
  delete process.env.SHARED_WORKSPACE;
  resetStudioEnvCache();
});
afterAll(() => {
  process.env = { ...saved };
  resetStudioEnvCache();
  rmSync(root, { recursive: true, force: true });
});
beforeEach(() => {
  delete process.env.STUDIO_LOG_MAX_FILE_BYTES;
  delete process.env.STUDIO_LAYOUT_LOG_MAX_BYTES;
  resetLogPurgeSchedule();
  setSofficeLogSink(null);
});

async function waitFor(fn: () => boolean, ms = 3000): Promise<void> {
  const end = Date.now() + ms;
  while (!fn()) {
    if (Date.now() > end) throw new Error('timeout waiting for condition');
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('soffice log -> appendJsonlDaily', () => {
  it('menulis soffice-YYYY-MM-DD.jsonl dan memurge berkas lebih tua dari retensi', async () => {
    const dir = path.join(root, 'logs', 'soffice');
    mkdirSync(dir, { recursive: true });
    const old = 'soffice-2020-01-01.jsonl';
    writeFileSync(path.join(dir, old), '{}\n');
    writeFileSync(path.join(dir, 'unrelated.txt'), 'keep');
    sofficeLog({ level: 'info', message: 'fixsec probe', code: 'FIXSEC_PROBE' });
    const today = new Date().toISOString().slice(0, 10);
    const file = path.join(dir, `soffice-${today}.jsonl`);
    await waitFor(() => {
      try {
        return readFileSync(file, 'utf8').includes('FIXSEC_PROBE');
      } catch {
        return false;
      }
    });
    await waitFor(() => !readdirSync(dir).includes(old));
    expect(readdirSync(dir)).toContain('unrelated.txt');
  });

  it('batas ukuran: berkas penuh -> entri masuk bagian .1', async () => {
    process.env.STUDIO_LOG_MAX_FILE_BYTES = '1024';
    const dir = path.join(root, 'logs', 'soffice');
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(path.join(dir, `soffice-${today}.jsonl`), 'x'.repeat(2048));
    sofficeLog({ level: 'warn', message: 'fixsec part', code: 'FIXSEC_PART' });
    const part = path.join(dir, `soffice-${today}.1.jsonl`);
    await waitFor(() => {
      try {
        return readFileSync(part, 'utf8').includes('FIXSEC_PART');
      } catch {
        return false;
      }
    });
  });

  it('purgeOldLogs hanya menyentuh pola milik prefix', async () => {
    const dir = path.join(root, 'logs', 'purge');
    mkdirSync(dir, { recursive: true });
    for (const n of ['soffice-2000-01-01.jsonl', 'soffice-2000-01-01.3.jsonl', 'other-2000-01-01.jsonl']) writeFileSync(path.join(dir, n), '');
    const removed = await purgeOldLogs(dir, 'soffice', Date.now(), 90);
    expect(removed.sort()).toEqual(['soffice-2000-01-01.3.jsonl', 'soffice-2000-01-01.jsonl']);
    expect(readdirSync(dir)).toEqual(['other-2000-01-01.jsonl']);
  });
});

describe('storage layout log sink: batas ukuran', () => {
  it('bawaan 10 MiB; env di bawah 64 KiB diabaikan', () => {
    expect(layoutLogMaxBytes()).toBe(LAYOUT_LOG_MAX_BYTES_DEFAULT);
    process.env.STUDIO_LAYOUT_LOG_MAX_BYTES = '100';
    expect(layoutLogMaxBytes()).toBe(LAYOUT_LOG_MAX_BYTES_DEFAULT);
    process.env.STUDIO_LAYOUT_LOG_MAX_BYTES = String(128 * 1024);
    expect(layoutLogMaxBytes()).toBe(128 * 1024);
  });

  it('entri di atas batas tidak ditulis', async () => {
    process.env.STUDIO_LAYOUT_LOG_MAX_BYTES = String(64 * 1024);
    const sink = createLayoutLogSink({ relDir: 'docs-fixsec/rev-1', fileName: 'Log Render.jsonl' });
    const big = 'y'.repeat(1000);
    for (let i = 0; i < 200; i++) await sink({ level: 'info', message: big });
    const file = path.join(root, 'docs-fixsec', 'rev-1', 'Log Render.jsonl');
    const size = statSync(file).size;
    expect(size).toBeLessThanOrEqual(64 * 1024);
    expect(size).toBeGreaterThan(60 * 1024);
  });
});
