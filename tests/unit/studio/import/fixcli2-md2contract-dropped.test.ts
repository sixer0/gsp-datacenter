// FIX-CLI2 (D-410, temuan F-1 test/19): CLI `scripts/studio/md2contract.ts` melaporkan unsur yang dibuang
// importer prosa (mapping.prose[].dropped) ke stderr, `--strict` gagal (kode 1) bila ada dropped,
// dan stdout (studio.doc/v2) tidak berubah.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { markdownToContract } from '@/lib/studio/services/import/contract';

const ROOT = path.resolve(__dirname, '../../../..');
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const CLI = path.join(ROOT, 'scripts/studio/md2contract.ts');
const KIND = ['--kind', 'agentWorkReport'];

const NESTED = [
  '# Laporan daftar bersarang',
  '',
  'Status: complete',
  'Date: 2026-10-30T19:30+07:00',
  '',
  '## Ringkasan',
  '',
  '- butir satu',
  '  - anak butir',
  '- butir dua',
  '',
  '---',
  '',
  'Penutup.',
  '',
].join('\n');
const CLEAN = ['# Laporan bersih', '', 'Status: complete', 'Date: 2026-10-30T19:30+07:00', '', '## Ringkasan', '', 'Selesai.', ''].join('\n');

let dir = '';
const file = (name: string, text: string): string => {
  const p = path.join(dir, name);
  fs.writeFileSync(p, text, 'utf8');
  return p;
};
function run(args: string[]): { code: number | null; out: string; err: string } {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixcli2-'));
});
afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('md2contract CLI: laporan unsur dibuang (FIX-CLI2)', () => {
  it('daftar bersarang: stderr menyebut LIST_NESTING (jumlah + baris), exit 0 tanpa --strict, stdout = dokumen importer', () => {
    const r = run([file('nested.md', NESTED), ...KIND]);
    expect(r.code).toBe(0);
    expect(r.err).toMatch(/dropped=[1-9]/);
    expect(r.err).toContain('unsur dibuang importer prosa');
    expect(r.err).toMatch(/dibuang LIST_NESTING x1 baris \d+/);
    expect(r.err).toMatch(/dibuang THEMATIC_BREAK x1 baris \d+/);
    expect(r.out).toBe(`${JSON.stringify(markdownToContract(NESTED, { kind: 'agentWorkReport' }).doc, null, 2)}\n`);
  });

  it('--strict: exit 1 bila ada dropped, stdout tetap byte-identik dengan run tanpa --strict', () => {
    const f = file('nested.md', NESTED);
    const plain = run([f, ...KIND]);
    const strict = run([f, ...KIND, '--strict']);
    expect(strict.code).toBe(1);
    expect(strict.err).toContain('--strict');
    expect(strict.err).toContain('unsur dibuang');
    expect(strict.out).toBe(plain.out);
  });

  it('laporan bersih: dropped=0, tanpa baris dropped, --strict exit 0', () => {
    const r = run([file('clean.md', CLEAN), ...KIND, '--strict']);
    expect(r.code).toBe(0);
    expect(r.err).toContain('dropped=0');
    expect(r.err).not.toContain('unsur dibuang importer prosa');
  });
});
