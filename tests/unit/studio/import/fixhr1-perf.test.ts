// FIX-HR1 (D-334 H-01): importer md/v1 linear pada masukan patologis. Ambang < 1 s per kasus
// berasal dari brief FIX-HR1 (probe security SR-57: 100k baris "a\n" = 7,7 s sebelum perbaikan).
// Ukuran kasus mendekati batas MD_IMPORT_MAX_CHARS (1.000.000 karakter) kecuali disebut lain.
import { describe, expect, it } from 'vitest';
import { importMarkdownChapter } from '@/lib/studio/services/import';

const MS_BUDGET = 1000;
const H = '# Bab\n\n## S\n\n';
const NEAR_MAX = 990_000;

function timed(md: string): { ms: number; valid: boolean } {
  const t0 = performance.now();
  const r = importMarkdownChapter(md, { chapterKey: '3' });
  return { ms: performance.now() - t0, valid: r.validation.valid };
}

/** Ulang satu unit sampai mendekati `chars` karakter total. */
function fill(unit: string, chars = NEAR_MAX, head = H): string {
  return head + unit.repeat(Math.floor((chars - head.length) / unit.length));
}

describe('FIX-HR1 H-01 kompleksitas importer', () => {
  it('paragraf 100 ribu baris "a\\n" < 1 s (dulu kuadratik pada setiap baris baru)', () => {
    const md = `${H}${'a\n'.repeat(100_000)}`;
    expect(timed(md).ms).toBeLessThan(MS_BUDGET);
  });

  it('100 ribu baris berakhiran dua spasi (br) dan 100 ribu baris berakhiran tab < 1 s', () => {
    expect(timed(`${H}${'a  \n'.repeat(100_000)}`).ms).toBeLessThan(MS_BUDGET);
    expect(timed(`${H}${'a\t\t\n'.repeat(100_000)}`).ms).toBeLessThan(MS_BUDGET);
  });

  const SPACES = ' '.repeat(NEAR_MAX - 100);
  const cases: Array<[string, string]> = [
    ['judul ATX dengan deret spasi panjang', `# Bab\n\n### a${SPACES}x\n`],
    ['judul bab dengan deret spasi panjang', `# Bab${SPACES}x\n`],
    ['tag inline <a + deret spasi tanpa >', `${H}a <a${SPACES}x\n`],
    ['baris tag HTML jenis 7 + deret spasi', `${H}<x${SPACES}y\n`],
    ['paragraf dengan deret spasi di tengah (pangkas akhir)', `${H}a${SPACES}b\n`],
    ['komentar inline <!-- beruntun tanpa penutup', fill('a <!-- ')],
    ['komentar <!-- beruntun di blok HTML', fill('<!-- a\n', NEAR_MAX, `${H}<div>\n`)],
    ['penanda * tak berpasangan', fill('*a ')],
    ['backtick tak berpasangan', fill('`a ``')],
    ['[ tak berpasangan', fill('[a')],
    ['[a]( tak berpasangan', fill('[a](')],
    ['<a tanpa penutup', fill('<a ')],
    ['entitas beruntun', fill('&amp;')],
    ['tag semantik <sup> beruntun', fill('<sup>a</sup> ')],
    ['daftar panjang', fill('- a b c d e f g h\n')],
    ['kutipan panjang', fill('> a b c d e f g h\n')],
  ];
  for (const [name, md] of cases) {
    it(`${name} < 1 s`, () => {
      expect(md.length).toBeLessThanOrEqual(1_000_000);
      expect(timed(md).ms).toBeLessThan(MS_BUDGET);
    });
  }

  // Kasus penanda bersarang terberat (~0,45 ms/KB): diukur pada 500 ribu karakter agar margin
  // anggaran 1 s tetap aman di runner paralel; tetap linear (lihat uji rasio di bawah).
  it('penanda bersarang *a **b** dan _a __b__ (500 ribu karakter) < 1 s', () => {
    expect(timed(fill('*a **b** ', 500_000)).ms).toBeLessThan(MS_BUDGET);
    expect(timed(fill('_a __b__ ', 500_000)).ms).toBeLessThan(MS_BUDGET);
  });

  it('waktu naik linear: 4x masukan baris baru <= ~8x waktu (bukan 16x kuadratik)', () => {
    const small = `${H}${'a\n'.repeat(25_000)}`;
    const big = `${H}${'a\n'.repeat(100_000)}`;
    timed(small); // pemanasan JIT
    const best = (md: string) => Math.min(...[0, 1, 2].map(() => timed(md).ms));
    const ts = best(small);
    const tb = best(big);
    expect(tb).toBeLessThan(Math.max(ts * 8, 50));
  });

  it('sarang dalam tanpa stack overflow: <b> x100k, * x200k, [ x200k, ~~ x100k', () => {
    const deep = [
      `${H}${'<b>'.repeat(100_000)}x${'</b>'.repeat(100_000)}`,
      `${H}${'*'.repeat(200_000)}a${'*'.repeat(200_000)}`,
      `${H}${'['.repeat(200_000)}a${'](u)'.repeat(150_000)}`,
      `${H}${'~~a '.repeat(100_000)}`,
    ];
    for (const md of deep) expect(() => importMarkdownChapter(md, { chapterKey: '3' })).not.toThrow();
  });
});
