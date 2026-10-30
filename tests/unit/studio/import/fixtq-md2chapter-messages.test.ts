// FIX-TQ (D-359; review SR-56e E9, arah D-340): pesan galat pemakaian CLI
// `scripts/studio/md2chapter.ts` berbahasa Indonesia. Nama opsi, kode galat server, dan
// kode keluar (2) tidak berubah. CLI dijalankan sebagai proses nyata (tsx).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../..');
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const CLI = path.join(ROOT, 'scripts/studio/md2chapter.ts');
const MD = '# Bab Uji\n\nParagraf.\n';

let dir = '';
let mdFile = '';

function run(args: string[]): { code: number | null; out: string; err: string } {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** Kata Inggris dari pesan lama; tidak boleh muncul lagi di baris galat. */
const ENGLISH = /\b(usage|must|needs?|missing|unknown option|unexpected argument|give exactly|is required|cannot read|otherwise|also pass)\b/i;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixtq-cli-'));
  mdFile = path.join(dir, 'bab.md');
  fs.writeFileSync(mdFile, MD, 'utf8');
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('md2chapter: pesan galat pemakaian berbahasa Indonesia (exit 2)', () => {
  const cases: Array<[string, () => string[], string]> = [
    ['opsi tanpa nilai', () => [mdFile, '--key'], '--key memerlukan nilai'],
    ['opsi tidak dikenal', () => [mdFile, '--key', '1', '--warna', 'x'], 'opsi tidak dikenal: --warna'],
    ['argumen kedua', () => [mdFile, 'lebih.md', '--key', '1'], 'argumen tidak terduga: lebih.md'],
    ['tanpa berkas', () => ['--key', '1'], 'berkas <file.md> belum diberikan'],
    ['dua target', () => [mdFile, '--key', '1', '--doc-id', 'a', '--mission', 'm'], 'berikan tepat satu dari --doc-id, --doc-number, --mission'],
    ['--doc-key tanpa --mission', () => [mdFile, '--key', '1', '--doc-key', 'k'], '--doc-key memerlukan --mission'],
    ['--template salah bentuk', () => [mdFile, '--key', '1', '--mission', 'm', '--template', 'x@0'], '--template harus berbentuk <slug> atau <slug>@<versi>'],
    ['--doc-title kosong', () => [mdFile, '--key', '1', '--mission', 'm', '--doc-title', ' '], '--doc-title tidak boleh kosong'],
    ['--template tanpa target', () => [mdFile, '--key', '1', '--template', 'datum-gsp'], '--template dan --doc-title memerlukan opsi dokumen tujuan'],
    ['tanpa --key', () => [mdFile], '--key wajib diisi'],
    ['--lang salah', () => [mdFile, '--key', '1', '--lang', 'FR'], '--lang harus ID atau EN'],
    ['--submission tanpa target', () => [mdFile, '--key', '1', '--submission'], '--submission memerlukan opsi dokumen tujuan'],
    ['berkas tidak ada', () => [path.join(dir, 'tidak-ada.md'), '--key', '1'], 'tidak dapat membaca'],
  ];

  it.each(cases)('%s', (_name, args, msg) => {
    const r = run(args());
    expect(r.code).toBe(2);
    expect(r.out).toBe('');
    const [line, usage] = r.err.split('\n');
    expect(line).toContain(`md2chapter: ${msg}`);
    if (!msg.startsWith('tidak dapat membaca')) expect(line).not.toMatch(ENGLISH);
    expect(usage).toMatch(/^pemakaian: npx tsx scripts\/studio\/md2chapter\.ts /);
  });

  it('catatan bab pertama (stderr, exit 0) berbahasa Indonesia; kode server tetap', () => {
    const r = run([mdFile, '--key', '1', '--mission', '2026-10-30_fixtq-uji']);
    expect(r.code).toBe(0);
    const note = r.err.split('\n').find((l) => l.startsWith('md2chapter: catatan:'));
    expect(note).toBeDefined();
    expect(note).toContain('tambahkan juga --template dan --doc-title');
    expect(note).toContain('META_REQUIRED_FOR_CREATE');
    expect(note).toContain('DOC_TARGET_AMBIGUOUS');
    expect(note).not.toMatch(ENGLISH);
  });
});
