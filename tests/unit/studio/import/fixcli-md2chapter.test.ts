// FIX-CLI (D-340, D-342; review DOC-3 M-1): `scripts/studio/md2chapter.ts` mendapat
// `--template <slug[@n]>` dan `--doc-title <judul>` sehingga amplop `--mission` dapat
// membuat dokumen pada bab pertama (tanpa 400 META_REQUIRED_FOR_CREATE). Tanpa opsi baru
// stdout sama byte dengan perilaku lama. CLI dijalankan sebagai proses nyata (tsx).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importMarkdownChapter } from '@/lib/studio/services/import';
import { studioValidator } from '@/lib/studio/services/ingest/validate';
import { STUDIO_SCHEMA_BASE_URL } from '@/lib/studio/contract';

const ROOT = path.resolve(__dirname, '../../../..');
const TSX = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const CLI = path.join(ROOT, 'scripts/studio/md2chapter.ts');
const MISSION = '2026-10-30_fixcli-uji';
const MD = '# Pendahuluan Uji CLI\n\nParagraf pembuka bab ini.\n\n## Latar Belakang\n\nGardu C memerlukan kajian ulang.\n\n- butir satu\n- butir dua\n';

let dir = '';
let mdFile = '';

function run(args: string[]): { code: number | null; out: string; err: string } {
  const r = spawnSync(process.execPath, [TSX, CLI, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** Keluaran yang diharapkan dari layanan yang sama (sumber kebenaran perilaku lama). */
function expected(opts: Parameters<typeof importMarkdownChapter>[1], submissionOnly = false): string {
  const res = importMarkdownChapter(MD, opts);
  return `${JSON.stringify(submissionOnly ? res.submission : res, null, 2)}\n`;
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixcli-'));
  mdFile = path.join(dir, 'bab1.md');
  fs.writeFileSync(mdFile, MD, 'utf8');
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('md2chapter CLI tanpa opsi baru: perilaku lama', () => {
  it('tanpa target: stdout sama byte dengan importMarkdownChapter, tanpa submission', () => {
    const r = run([mdFile, '--key', '1']);
    expect(r.code).toBe(0);
    expect(r.out).toBe(expected({ chapterKey: '1' }));
    expect(JSON.parse(r.out).submission).toBeUndefined();
    expect(r.err).not.toContain('catatan:');
  });

  it('--mission tanpa --template/--doc-title: stdout lama (tanpa template/meta), exit 0, catatan di stderr', () => {
    const r = run([mdFile, '--key', '1', '--mission', MISSION]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(expected({ chapterKey: '1', envelope: { target: { mission: { folder: MISSION } } } }));
    const sub = JSON.parse(r.out).submission;
    expect(sub.template).toBeUndefined();
    expect(sub.meta).toBeUndefined();
    expect(r.err).toContain('--template dan --doc-title');
    expect(r.err).toContain('META_REQUIRED_FOR_CREATE');
  });

  it('--doc-id --submission: amplop lama, tanpa catatan (dokumen sudah ada)', () => {
    const r = run([mdFile, '--key', '2', '--doc-id', 'doc_abc', '--submission']);
    expect(r.code).toBe(0);
    expect(r.out).toBe(expected({ chapterKey: '2', envelope: { target: { documentId: 'doc_abc' } } }, true));
    expect(r.err).not.toContain('catatan:');
  });

  it('--title tetap judul BAB (bukan judul dokumen)', () => {
    const r = run([mdFile, '--key', '1', '--title', 'Judul Bab Lain']);
    expect(r.code).toBe(0);
    const out = JSON.parse(r.out);
    expect(out.chapter.title).toEqual({ text: 'Judul Bab Lain' });
    expect(out.submission).toBeUndefined();
  });
});

describe('md2chapter CLI: bab pertama dokumen baru (--template, --doc-title)', () => {
  it('--mission + --template + --doc-title: amplop lengkap, sah menurut skema studio.chapter/v2', () => {
    const r = run([mdFile, '--key', '1', '--mission', MISSION, '--doc-key', 'utama', '--template', 'datum-gsp', '--doc-title', 'Kajian Gardu C', '--submission']);
    expect(r.code).toBe(0);
    const sub = JSON.parse(r.out);
    expect(sub).toMatchObject({
      $schema: 'studio.chapter/v2',
      target: { mission: { folder: MISSION }, docKey: 'utama' },
      template: { slug: 'datum-gsp' },
      meta: { title: 'Kajian Gardu C' },
      chapter: { key: '1' },
    });
    expect(sub.template.version).toBeUndefined();
    expect(studioValidator(`${STUDIO_SCHEMA_BASE_URL}/studio.chapter/v2.json`)(sub)).toBe(true);
    expect(r.err).not.toContain('catatan:');
    expect(r.err).toContain('valid=true');
  });

  it('--template slug@versi -> template.version bilangan bulat', () => {
    const r = run([mdFile, '--key', '1', '--doc-number', 'GSP-UJI-001', '--template', 'datum-gsp@3', '--doc-title', 'Dok', '--submission']);
    expect(r.code).toBe(0);
    const sub = JSON.parse(r.out);
    expect(sub.template).toEqual({ slug: 'datum-gsp', version: 3 });
    expect(sub.target).toEqual({ docNumber: 'GSP-UJI-001' });
  });

  it('keluaran penuh (tanpa --submission) memuat submission yang sama dengan layanan', () => {
    const args = [mdFile, '--key', '1', '--mission', MISSION, '--template', 'datum-gsp', '--doc-title', 'Kajian'];
    const r = run(args);
    expect(r.code).toBe(0);
    expect(r.out).toBe(
      expected({ chapterKey: '1', envelope: { target: { mission: { folder: MISSION } }, template: { slug: 'datum-gsp' }, meta: { title: 'Kajian' } } }),
    );
  });

  it('hanya --template pada --mission: catatan menyebut --doc-title yang kurang', () => {
    const r = run([mdFile, '--key', '1', '--mission', MISSION, '--template', 'datum-gsp']);
    expect(r.code).toBe(0);
    expect(r.err).toContain('tambahkan juga --doc-title (tanpa itu');
    expect(JSON.parse(r.out).submission.meta).toBeUndefined();
  });

  it.each([
    [['--template', 'datum-gsp@0'], '--template harus berbentuk'],
    [['--template', 'datum-gsp@x'], '--template harus berbentuk'],
    [['--template', 'a@1@2'], '--template harus berbentuk'],
    [['--doc-title', '   '], '--doc-title tidak boleh kosong'],
  ])('nilai salah %j -> exit 2', (extra, msg) => {
    const r = run([mdFile, '--key', '1', '--mission', MISSION, ...extra]);
    expect(r.code).toBe(2);
    expect(r.err).toContain(msg);
    expect(r.out).toBe('');
  });

  it('--template/--doc-title tanpa opsi target -> exit 2', () => {
    const r = run([mdFile, '--key', '1', '--template', 'datum-gsp', '--doc-title', 'X']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('memerlukan opsi dokumen tujuan');
  });

  it('slug yang melanggar pola skema -> exit 1 dengan pointer /template/slug', () => {
    const r = run([mdFile, '--key', '1', '--mission', MISSION, '--template', 'Datum_GSP', '--doc-title', 'X']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('/template/slug');
  });

  it('--help menjelaskan opsi pembuatan dokumen dan exit 0', () => {
    const r = run(['--help']);
    expect(r.code).toBe(0);
    for (const s of ['--template <slug[@n]>', '--doc-title <T>', '--mission <folder>', 'META_REQUIRED_FOR_CREATE', '--doc-id <id>']) {
      expect(r.out).toContain(s);
    }
  });
});
