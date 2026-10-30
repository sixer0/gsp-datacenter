// FIX-H7 (D-321/D-322): importer Markdown resmi `md/v1` -> `studio.chapter/v2` konten-saja.
// Nilai harapan = konvensi register/kontrak v2 (types/v2/doc.ts, common.ts) dan brief FIX-H7,
// ditulis sebagai literal, bukan diturunkan dari kode yang diuji.
import { describe, expect, it } from 'vitest';
import { importMarkdownChapter, type MarkdownImportOptions } from '@/lib/studio/services/import';

const run = (md: string, extra: Partial<MarkdownImportOptions> = {}) => importMarkdownChapter(md, { chapterKey: '3', ...extra });
const SHA = 'c14cc4c48a5e9c2b04a2bb79a2cc8a5e32ed40638edfa0213d576176162406f2';
const body = (md: string) => run(`# Bab\n\n## Satu\n\n${md}\n`);
const blocks = (md: string) => body(md).chapter.sections[0].blocks;
const codes = (xs: Array<{ code: string }>) => xs.map((x) => x.code);

describe('md/v1 struktur', () => {
  it('# judul bab, ## section, paragraf; nomor tampilan dibuang; blok sebelum ## = intro', () => {
    const r = run('# 3. Analisis Kondisi\n\nPembuka bab.\n\n## 3.1 Pemutus Tenaga\n\nBaris satu\nbaris dua.\n');
    expect(r.chapter).toEqual({
      key: '3',
      title: { text: 'Analisis Kondisi' },
      intro: [{ type: 'paragraph', text: 'Pembuka bab.' }],
      sections: [{ title: { text: 'Pemutus Tenaga' }, blocks: [{ type: 'paragraph', text: 'Baris satu baris dua.' }] }],
    });
    expect(r.report.importer).toBe('md/v1');
    expect(r.validation).toEqual({ valid: true, issues: [] });
  });
});

describe('md/v1 inline', () => {
  it('**tebal**, *miring*, `kode`, ***keduanya***, tautan -> runs bermakna', () => {
    expect(blocks('Ada **tebal**, *miring*, `kode`, ***dua*** dan [GSP](https://gsp.example/x).')).toEqual([
      {
        type: 'paragraph',
        runs: [
          { t: 'Ada ' },
          { t: 'tebal', strong: true },
          { t: ', ' },
          { t: 'miring', em: true },
          { t: ', ' },
          { t: 'kode', code: true },
          { t: ', ' },
          { t: 'dua', strong: true, em: true },
          { t: ' dan GSP (https://gsp.example/x).' },
        ],
      },
    ]);
  });

  it('teks polos tetap `text`; bintang literal/escape menjadi runs agar md-lite tidak menafsirkan ulang', () => {
    const r = blocks('Nilai 5 \\* 3 dan snake_case_name tetap.\n\nPolos saja.');
    expect(r[0]).toEqual({ type: 'paragraph', runs: [{ t: 'Nilai 5 * 3 dan snake_case_name tetap.' }] });
    expect(r[1]).toEqual({ type: 'paragraph', text: 'Polos saja.' });
  });

  it('dua spasi di ujung baris -> br; <sup>/<sub> -> sup/sub; entitas diurai', () => {
    expect(blocks('Baris satu  \nbaris dua m<sup>2</sup> H<sub>2</sub>O &amp; co')).toEqual([
      {
        type: 'paragraph',
        runs: [{ t: 'Baris satu' }, { br: 'line' }, { t: 'baris dua m' }, { t: '2', sup: true }, { t: ' H' }, { t: '2', sub: true }, { t: 'O & co' }],
      },
    ]);
  });
});

describe('md/v1 daftar', () => {
  it('daftar tak berurut dan berurut menjadi dua blok list', () => {
    expect(blocks('- satu\n- **dua**\n\n1. pertama\n2. kedua')).toEqual([
      { type: 'list', items: [{ text: 'satu' }, { runs: [{ t: 'dua', strong: true }] }] },
      { type: 'list', ordered: true, items: [{ text: 'pertama' }, { text: 'kedua' }] },
    ]);
  });

  it('daftar bersarang diratakan berurutan dan sarangnya dilaporkan di dropped', () => {
    const r = body('- induk A\n  - anak A1\n    - cucu\n  - anak A2\n- induk B\n  lanjutan B');
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'list', items: [{ text: 'induk A' }, { text: 'anak A1' }, { text: 'cucu' }, { text: 'anak A2' }, { text: 'induk B lanjutan B' }] },
    ]);
    expect(r.report.dropped).toContainEqual(expect.objectContaining({ code: 'LIST_NESTING', kind: 'structure', line: 5 }));
    expect(r.validation.valid).toBe(true);
  });
});

describe('md/v1 tabel', () => {
  it('tabel GFM: baris kepala -> header, caption "Tabel n.m." sesudahnya, Sumber + provenance, kolom angka', () => {
    const r = body('| Gardu | Skor |\n|:---|---:|\n| A | 92,5 |\n| B | 1.204 |\n\nTabel 3.1. Skor kondisi pemutus.\n\nSumber: Inspeksi lapangan 2026-10-20 [TERUKUR] [PEMASOK]');
    expect(r.chapter.sections[0].blocks).toEqual([
      {
        type: 'table',
        caption: { text: 'Skor kondisi pemutus.' },
        columns: [{ role: 'text' }, { role: 'numeral' }],
        rows: [
          { kind: 'header', cells: [{ text: 'Gardu' }, { text: 'Skor' }] },
          { kind: 'body', cells: [{ text: 'A' }, { text: '92,5' }] },
          { kind: 'body', cells: [{ text: 'B' }, { text: '1.204' }] },
        ],
        source: { text: 'Inspeksi lapangan 2026-10-20', provenance: ['TERUKUR', 'PEMASOK'] },
      },
    ]);
    expect(codes(r.report.dropped)).toEqual(expect.arrayContaining(['TABLE_ALIGNMENT', 'NUMBERING']));
    expect(r.validation.valid).toBe(true);
  });

  it('caption sebelum tabel, sel kosong, pipa ter-escape, sel berlebih dibuang dan dilaporkan', () => {
    const r = body('Table: Ringkasan.\n\n| K | V |\n|---|---|\n| a \\| b | |\n| c | d | e |');
    expect(r.chapter.sections[0].blocks).toEqual([
      {
        type: 'table',
        caption: { text: 'Ringkasan.' },
        columns: [{ role: 'text' }, { role: 'text' }],
        rows: [
          { kind: 'header', cells: [{ text: 'K' }, { text: 'V' }] },
          { kind: 'body', cells: [{ text: 'a | b' }, {}] },
          { kind: 'body', cells: [{ text: 'c' }, { text: 'd' }] },
        ],
      },
    ]);
    expect(r.report.dropped).toContainEqual(expect.objectContaining({ code: 'TABLE_CELL_OVERFLOW', kind: 'content', excerpt: 'e' }));
  });

  it('tabel bercaption tanpa baris Sumber diperingatkan lebih awal (gerbang DATUM-10 menolaknya saat kirim)', () => {
    const r = body('| K |\n|---|\n| a |\n\nTabel 4.1. Tanpa sumber.');
    expect(r.report.warnings).toEqual([expect.objectContaining({ code: 'TABLE_SOURCE_MISSING', line: 5 })]);
    expect(body('| K |\n|---|\n| a |').report.warnings).toEqual([]);
  });
});

describe('md/v1 gambar', () => {
  it('![caption](sha256:...) + baris Sumber -> image dengan provenance', () => {
    const r = body(`![Korosi pada terminal PMT-2.](sha256:${SHA})\n\nSumber: Foto lapangan 2026-10-20 [DITURUNKAN]`);
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'image', asset: `sha256:${SHA}`, caption: { text: 'Korosi pada terminal PMT-2.' }, source: { text: 'Foto lapangan 2026-10-20', provenance: ['DITURUNKAN'] } },
    ]);
    expect(r.validation.valid).toBe(true);
  });

  it('sha heks polos dinormalkan, sumber dari judul tautan, nomor "Gambar 3.2." dibuang', () => {
    expect(blocks(`![Gambar 3.2. Panel kendali.](${SHA.toUpperCase()} "Sumber: Arsip GSP")`)).toEqual([
      { type: 'image', asset: `sha256:${SHA}`, caption: { text: 'Panel kendali.' }, source: { text: 'Arsip GSP' } },
    ]);
  });

  it('gambar tanpa sumber, tanpa caption, atau rujukan path dibuang dengan laporan (caption/sumber wajib)', () => {
    const r = body(`![Tanpa sumber](sha256:${SHA})\n\n![](sha256:${SHA} "Sumber: x")\n\n![Path](./img/a.png "Sumber: y")`);
    expect(r.chapter.sections[0].blocks).toEqual([]);
    expect(codes(r.report.warnings)).toEqual(['IMAGE_SOURCE_MISSING', 'IMAGE_CAPTION_MISSING', 'IMAGE_REF_UNSUPPORTED']);
    expect(r.report.dropped.map((d) => d.kind)).toEqual(['content', 'content', 'content']);
  });
});

describe('md/v1 penanda rel', () => {
  it('[TERUKUR] di awal paragraf -> rail mark; [PEMASOK: catatan] membawa teks; penanda di tengah kalimat tetap teks', () => {
    const r = blocks('[TERUKUR] [PEMASOK: brosur vendor] Orbit terukur 520 km.\n\nAngka [TERUKUR] di tengah tetap.');
    expect(r).toEqual([
      { type: 'paragraph', text: 'Orbit terukur 520 km.', rail: [{ kind: 'mark', mark: 'TERUKUR' }, { kind: 'mark', mark: 'PEMASOK', text: 'brosur vendor' }] },
      { type: 'paragraph', text: 'Angka [TERUKUR] di tengah tetap.' },
    ]);
  });

  it('alias Hermes [PUBLIC-SOURCE]/[VENDOR] dipetakan (peringatan); [ASSESSED] tidak ditebak; rail pada butir daftar', () => {
    const r = body('[PUBLIC-SOURCE] Satu objek terdaftar.\n\n[ASSESSED] Penilaian GSP.\n\n- [VENDOR] Tujuh satelit konsep.');
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'paragraph', text: 'Satu objek terdaftar.', rail: [{ kind: 'mark', mark: 'TERUKUR' }] },
      { type: 'paragraph', text: '[ASSESSED] Penilaian GSP.' },
      { type: 'list', items: [{ text: 'Tujuh satelit konsep.', rail: [{ kind: 'mark', mark: 'PEMASOK' }] }] },
    ]);
    expect(codes(r.report.warnings)).toEqual(['MARK_ALIAS', 'UNMAPPED_MARKER', 'MARK_ALIAS']);
    expect(r.validation.valid).toBe(true);
  });
});

describe('md/v1 HTML mentah dan tampilan', () => {
  it('HTML bergaya dibuang (teks dipertahankan), style/komentar/tabel HTML dibuang seluruhnya, span inline dibuang', () => {
    const r = body(
      '<div style="color:red;font-size:14pt">Peringatan penting</div>\n\n<style>p{color:blue}</style>\n\n<!-- catatan penulis -->\n\n<table><tr><td>x</td></tr></table>\n\nTeks <span style="color:red">merah</span> <font size="5">besar</font>.',
    );
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'paragraph', text: 'Peringatan penting' },
      { type: 'paragraph', text: 'Teks merah besar.' },
    ]);
    expect(codes(r.report.dropped)).toEqual(['HTML_BLOCK', 'HTML_RAW_BLOCK', 'HTML_COMMENT', 'HTML_UNSUPPORTED_CONTENT', 'HTML_INLINE', 'HTML_INLINE']);
    expect(r.report.dropped[0]).toEqual({ code: 'HTML_BLOCK', line: 5, kind: 'html', excerpt: '<div style="color:red;font-size:14pt">Peringatan penting</div>' });
    expect(JSON.stringify(r.chapter)).not.toMatch(/style|color|font/);
  });

  it('garis pemisah, front matter, coretan, nomor section dibuang dengan laporan', () => {
    const r = run('---\ntitle: x\n---\n# BAB 3 Kajian\n\n## 3.2 Lingkup\n\nSebelum ~~lama~~ baru.\n\n---\n\nSesudah.');
    expect(r.chapter.title).toEqual({ text: 'Kajian' });
    expect(r.chapter.sections[0].title).toEqual({ text: 'Lingkup' });
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'paragraph', text: 'Sebelum lama baru.' },
      { type: 'paragraph', text: 'Sesudah.' },
    ]);
    expect(codes(r.report.dropped)).toEqual(['FRONT_MATTER', 'NUMBERING', 'NUMBERING', 'STRIKETHROUGH', 'THEMATIC_BREAK']);
  });
});

describe('md/v1 blok lain', () => {
  it('### -> paragraf subheading; #### diratakan dengan peringatan; kode berpagar -> monoBlock; kutipan -> aside', () => {
    const r = body('### K1 - Akses multi-penyedia\n\n#### Rinci\n\n```bash Perintah uji\nnpm test\n```\n\n> [!DOCTRINE] Doktrin\n> Satu sumber kebenaran.\n\n> Kutipan biasa.');
    expect(r.chapter.sections[0].blocks).toEqual([
      { type: 'paragraph', role: 'subheading', text: 'K1 - Akses multi-penyedia' },
      { type: 'paragraph', role: 'subheading', text: 'Rinci' },
      { type: 'monoBlock', label: { text: 'Perintah uji' }, lines: [{ text: 'npm test' }] },
      { type: 'aside', variant: 'doctrine', label: { text: 'Doktrin' }, body: [{ text: 'Satu sumber kebenaran.' }] },
      { type: 'aside', variant: 'generic', body: [{ text: 'Kutipan biasa.' }] },
    ]);
    expect(codes(r.report.warnings)).toEqual(['HEADING_LEVEL_FLATTENED']);
    expect(r.validation.valid).toBe(true);
  });

  it('placeholder [FIGUR: ...] Hermes dibuang dengan laporan', () => {
    const r = body('[FIGUR: FIG-02 | placed after Table 3.1]');
    expect(r.chapter.sections[0].blocks).toEqual([]);
    expect(r.report.dropped).toEqual([{ code: 'FIGURE_PLACEHOLDER', line: 5, kind: 'content', excerpt: '[FIGUR: FIG-02 | placed after Table 3.1]' }]);
  });
});

describe('md/v1 laporan, idempotensi, opsi', () => {
  it('mapping: baris MD -> JSON Pointer keluaran', () => {
    const r = run('# Bab\n\nIntro.\n\n## A\n\n- x\n\n## B\n\n| a |\n|---|\n| 1 |');
    expect(r.report.mapping).toEqual([
      { line: 1, md: 'heading1', pointer: '/chapter/title' },
      { line: 3, md: 'paragraph', pointer: '/chapter/intro/0' },
      { line: 5, md: 'heading2', pointer: '/chapter/sections/0' },
      { line: 7, md: 'list', pointer: '/chapter/sections/0/blocks/0' },
      { line: 9, md: 'heading2', pointer: '/chapter/sections/1' },
      { line: 11, md: 'table', pointer: '/chapter/sections/1/blocks/0' },
    ]);
  });

  it('idempoten: MD sama -> JSON byte sama; CRLF dan BOM tidak mengubah keluaran', () => {
    const md = `# 3. Bab\n\n## 3.1 A\n\n**x** dan [TERUKUR] y\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n![Cap](sha256:${SHA})\n\nSumber: s\n`;
    const a = JSON.stringify(run(md));
    expect(JSON.stringify(run(md))).toBe(a);
    expect(JSON.stringify(run(`﻿${md.replace(/\n/g, '\r\n')}`))).toBe(a);
  });

  it('opsi title menimpa # (peringatan); tanpa judul atau kunci tidak sah -> galat berkode', () => {
    const r = run('# Lama\n\n## A\n\nx', { title: 'Baru' });
    expect(r.chapter.title).toEqual({ text: 'Baru' });
    expect(codes(r.report.warnings)).toContain('TITLE_OVERRIDDEN');
    expect(() => run('## A\n\nx')).toThrow(expect.objectContaining({ code: 'SCHEMA_INVALID' }));
    expect(() => importMarkdownChapter('# T', { chapterKey: '03' })).toThrow(expect.objectContaining({ code: 'CHAPTER_KEY_INVALID' }));
    expect(() => importMarkdownChapter('   ', { chapterKey: '3' })).toThrow(expect.objectContaining({ code: 'SCHEMA_INVALID' }));
  });

  it('amplop: target -> submission studio.chapter/v2 sah; validator v2 repo menolak tabel > 20 kolom berpointer', () => {
    const ok = run('# Bab\n\n## A\n\nx', { agentId: 'hermes-gsp-master01', envelope: { target: { mission: { folder: '2026-10-30_hermes-trial' }, docKey: 'laporan-eos360' } } });
    expect(ok.submission).toEqual({
      $schema: 'studio.chapter/v2',
      agentId: 'hermes-gsp-master01',
      target: { mission: { folder: '2026-10-30_hermes-trial' }, docKey: 'laporan-eos360' },
      chapter: ok.chapter,
    });
    expect(ok.validation).toEqual({ valid: true, issues: [] });
    const cols = Array.from({ length: 21 }, (_, k) => `c${k}`);
    const wide = body(`| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|\n| ${cols.join(' | ')} |`);
    expect(wide.validation.valid).toBe(false);
    expect(wide.validation.issues[0].pointer).toBe('/chapter/sections/0/blocks/0/columns');
    expect(codes(wide.report.warnings)).toContain('TABLE_TOO_WIDE');
  });
});
