// FIX-HR1 (D-332/D-333/D-334 H-01): batas sumber daya importer (413 berkode jelas), laporan
// berbatas, kesetaraan judul ATX tanpa regex, dan konvensi peran paragraf EKSPLISIT
// `<!-- role: X -->`. Nilai harapan = brief FIX-HR1 + kontrak (PARAGRAPH_ROLES_V2, E36),
// ditulis sebagai literal.
import { describe, expect, it } from 'vitest';
import { importMarkdownChapter, type MarkdownImportOptions } from '@/lib/studio/services/import';
import { atxHeading } from '@/lib/studio/services/import/lexer';
import { StudioEngineError } from '@/lib/studio/contract/errors';

const run = (md: string, extra: Partial<MarkdownImportOptions> = {}) => importMarkdownChapter(md, { chapterKey: '3', ...extra });
const H = '# Bab\n\n## S\n\n';
const codes = (xs: Array<{ code: string }>) => xs.map((x) => x.code);

function thrown(fn: () => unknown): StudioEngineError {
  try {
    fn();
  } catch (e) {
    if (e instanceof StudioEngineError) return e;
    throw e;
  }
  throw new Error('expected StudioEngineError');
}

describe('FIX-HR1 batas -> 413 PAYLOAD_TOO_LARGE dengan details.reason', () => {
  it('lebih dari 1.000.000 karakter -> MD_TOO_LONG', () => {
    const e = thrown(() => run(`${H}${'a'.repeat(1_000_001)}`));
    expect(e.code).toBe('PAYLOAD_TOO_LARGE');
    expect(e.details).toMatchObject({ pointer: '/markdown', reason: 'MD_TOO_LONG', limit: 1_000_000 });
  });

  it('lebih dari 200.000 baris -> MD_TOO_MANY_LINES (dihitung sebelum lexing)', () => {
    const e = thrown(() => run(`${H}${'\n'.repeat(200_000)}`));
    expect(e.code).toBe('PAYLOAD_TOO_LARGE');
    expect(e.details).toMatchObject({ reason: 'MD_TOO_MANY_LINES', limit: 200_000, actual: 200_005 });
  });

  it('lebih dari 50.000 blok -> MD_TOO_MANY_BLOCKS', () => {
    const e = thrown(() => run(`${H}${'a\n\n'.repeat(50_000)}`));
    expect(e.code).toBe('PAYLOAD_TOO_LARGE');
    expect(e.details).toMatchObject({ reason: 'MD_TOO_MANY_BLOCKS', limit: 50_000, actual: 50_002 });
  });

  it('tabel lebih dari 100 kolom -> MD_TABLE_TOO_WIDE dengan baris tabel', () => {
    const md = `${H}|${' a |'.repeat(101)}\n|${'---|'.repeat(101)}\n| 1 |\n`;
    const e = thrown(() => run(md));
    expect(e.code).toBe('PAYLOAD_TOO_LARGE');
    expect(e.details).toMatchObject({ reason: 'MD_TABLE_TOO_WIDE', limit: 100, actual: 101, line: 5 });
  });

  it('tabel 21 kolom tetap diproses (peringatan TABLE_TOO_WIDE kontrak), sel kurang diisi kosong', () => {
    const md = `${H}|${' a |'.repeat(21)}\n|${'---|'.repeat(21)}\n| 1 |\n`;
    const r = run(md);
    expect(codes(r.report.warnings)).toContain('TABLE_TOO_WIDE');
    const t = r.chapter.sections[0].blocks[0] as { rows: Array<{ cells: unknown[] }> };
    expect(t.rows[1].cells).toHaveLength(21);
    expect(t.rows[1].cells[20]).toEqual({});
  });
});

describe('FIX-HR1 laporan berbatas', () => {
  it('5.000 tag <span> -> dropped dibatasi 1.000 + satu peringatan REPORT_TRUNCATED', () => {
    const r = run(`${H}${'<span>a</span> '.repeat(5_000)}`);
    expect(r.report.dropped).toHaveLength(1000);
    const last = r.report.warnings[r.report.warnings.length - 1];
    expect(last.code).toBe('REPORT_TRUNCATED');
    expect(last.message).toContain('4000 more dropped');
  });
});

describe('FIX-HR1 judul ATX tanpa regex: setara regex md/v1 lama', () => {
  const OLD_ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
  const oracle = (l: string) => {
    const m = OLD_ATX.exec(l);
    return m ? { level: m[1].length, text: (m[2] ?? '').trim() } : null;
  };

  it('kasus tepi tetap', () => {
    const lines = ['#', '# ', '## ##', '## foo ##', '## foo#', '###   foo  ##   ', '#\tfoo\t#\t', '####### x', '#x', '   # a', '    # a', '# a \u2028 b', '# #a # ##', '#  ', '# a\\#'];
    for (const l of lines) expect(atxHeading(l)).toEqual(oracle(l));
  });

  it('fuzz 20.000 baris acak dari alfabet # spasi tab huruf U+2028', () => {
    const alpha = ['#', '#', '#', ' ', ' ', '\t', 'a', 'b', String.fromCharCode(0x2028), '\\'];
    let seed = 1234567;
    const rnd = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };
    for (let k = 0; k < 20_000; k++) {
      const len = rnd(14);
      let l = '';
      for (let j = 0; j < len; j++) l += alpha[rnd(alpha.length)];
      expect(atxHeading(l), JSON.stringify(l)).toEqual(oracle(l));
    }
  });
});

describe('FIX-HR1 peran paragraf eksplisit <!-- role: X -->', () => {
  it('penanda sebaris sendiri sebelum paragraf -> role; penanda tidak bocor sebagai teks', () => {
    const r = run(`${H}<!-- role: closingAction -->\nTim pemeliharaan menyetujui penggantian PMT gardu C sebelum 15 November 2026.\n`);
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'paragraph', role: 'closingAction', text: 'Tim pemeliharaan menyetujui penggantian PMT gardu C sebelum 15 November 2026.' },
    ]);
    expect(r.report.warnings).toEqual([]);
    expect(r.report.dropped).toEqual([]);
    expect(r.validation).toEqual({ valid: true, issues: [] });
    expect(JSON.stringify(r.chapter)).not.toContain('role:');
  });

  it('baris kosong di antara penanda dan paragraf diterima; berlaku di intro; rel tetap', () => {
    const r = run('# Bab\n\n<!-- role: identity -->\n\n[TERUKUR] Laporan survei kondisi gardu.\n\n## S\n\nIsi.\n');
    expect(r.chapter.intro).toEqual([{ type: 'paragraph', role: 'identity', text: 'Laporan survei kondisi gardu.', rail: [{ kind: 'mark', mark: 'TERUKUR' }] }]);
  });

  it('kedelapan peran kontrak diterima', () => {
    for (const role of ['body', 'lede', 'note', 'subheading', 'identity', 'anchor', 'pivot', 'closingAction']) {
      const r = run(`${H}<!--role:${role}-->\nTeks.\n`);
      expect(r.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', role, text: 'Teks.' });
    }
  });

  it('peran tak dikenal (termasuk beda huruf) -> ROLE_UNKNOWN, tanpa role, komentar dibuang', () => {
    for (const name of ['closingaction', 'kicker']) {
      const r = run(`${H}<!-- role: ${name} -->\nTeks.\n`);
      expect(r.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', text: 'Teks.' });
      expect(codes(r.report.warnings)).toEqual(['ROLE_UNKNOWN']);
      expect(codes(r.report.dropped)).toEqual(['HTML_COMMENT']);
    }
  });

  it('tidak diikuti paragraf biasa -> ROLE_MARKER_UNATTACHED (tidak diterapkan ke blok lain)', () => {
    const beforeList = run(`${H}<!-- role: pivot -->\n- butir\n`);
    expect(beforeList.chapter.sections[0].blocks[0]).toEqual({ type: 'list', items: [{ text: 'butir' }] });
    expect(beforeList.report.warnings).toEqual([{ code: 'ROLE_MARKER_UNATTACHED', line: 5, message: expect.stringContaining('pivot') }]);

    const atEnd = run(`${H}Teks.\n\n<!-- role: anchor -->\n`);
    expect(atEnd.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', text: 'Teks.' });
    expect(codes(atEnd.report.warnings)).toEqual(['ROLE_MARKER_UNATTACHED']);

    const twice = run(`${H}<!-- role: anchor -->\n<!-- role: pivot -->\nTeks.\n`);
    expect(twice.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', role: 'pivot', text: 'Teks.' });
    expect(codes(twice.report.warnings)).toEqual(['ROLE_MARKER_UNATTACHED']);

    const beforeHeading = run(`${H}<!-- role: lede -->\n## Dua\n\nTeks.\n`);
    expect(beforeHeading.chapter.sections[1].blocks[0]).toEqual({ type: 'paragraph', text: 'Teks.' });
    expect(codes(beforeHeading.report.warnings)).toEqual(['ROLE_MARKER_UNATTACHED']);
  });

  it('penanda di dalam paragraf diabaikan dengan ROLE_MARKER_INLINE; komentar tetap tidak tampil', () => {
    const r = run(`${H}Teks penutup. <!-- role: closingAction -->\n`);
    expect(r.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', text: 'Teks penutup.' });
    expect(codes(r.report.warnings)).toEqual(['ROLE_MARKER_INLINE']);
  });

  it('komentar HTML biasa tetap dibuang seperti sebelumnya (tanpa peringatan peran)', () => {
    const r = run(`${H}<!-- catatan penulis -->\nTeks.\n`);
    expect(r.chapter.sections[0].blocks[0]).toEqual({ type: 'paragraph', text: 'Teks.' });
    expect(r.report.warnings).toEqual([]);
    expect(codes(r.report.dropped)).toEqual(['HTML_COMMENT']);
  });
});
