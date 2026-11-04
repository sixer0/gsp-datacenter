/**
 * S22: modul aturan structure_b (research/32 §2 CR-1, §5 RH/RB, §6 SB/IS, §7 GF/DV).
 *
 * Seam: `rules` modul structure_b lewat `runConformance` (indeks hanya berisi modul ini) dan
 * `rule.check`. DOCX baik dibangun sesuai nilai Rev A di katalog (bukan dari mesin Studio),
 * lalu dimutasi tepat pada satu unsur; aturan yang dituju harus turun ke FAIL.
 */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { DATUM_CATALOG } from '../../../../benchmark/datum_conformance/catalog';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { runConformance, type RuleOutcome } from '../../../../benchmark/datum_conformance/lib/score';
import { buildRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import { rules } from '../../../../benchmark/datum_conformance/rules/structure_b';
import type { Lang, PairContext, Tier } from '../../../../benchmark/datum_conformance/rules/types';
import { buildDocx, W_NS } from './_docx_kit';

const NBSP = String.fromCharCode(0xa0);
const SERIF = 'IBM Plex Serif';
const COND = 'IBM Plex Sans Condensed';
const MONO = 'IBM Plex Mono';

interface RunFmt {
  font?: string;
  sz?: number;
  b?: boolean;
  caps?: boolean;
  color?: string;
}

function rPr(f: RunFmt): string {
  const font = f.font ? `<w:rFonts w:ascii="${f.font}" w:hAnsi="${f.font}" w:cs="${f.font}" w:eastAsia="${f.font}"/>` : '';
  return `<w:rPr>${font}${f.b ? '<w:b/>' : ''}${f.caps ? '<w:caps/>' : ''}${f.color ? `<w:color w:val="${f.color}"/>` : ''}${f.sz ? `<w:sz w:val="${f.sz}"/>` : ''}</w:rPr>`;
}

function r(text: string, f: RunFmt = {}, tab = false): string {
  return `<w:r>${rPr(f)}${tab ? '<w:tab/>' : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function para(runs: string, pPr = ''): string {
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`;
}

function cell(inner: string, tcPr = ''): string {
  return `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${inner}</w:tc>`;
}

function table(cells: string[], cols: number[], tblPr = '', trPr = ''): string {
  const grid = cols.map((w) => `<w:gridCol w:w="${w}"/>`).join('');
  return `<w:tbl><w:tblPr>${tblPr}</w:tblPr><w:tblGrid>${grid}</w:tblGrid><w:tr>${trPr ? `<w:trPr>${trPr}</w:trPr>` : ''}${cells.join('')}</w:tr></w:tbl>`;
}

const WORDS = {
  ID: { sealLeft: 'KLASIFIKASI', sealRight: 'SALINAN INDUK · PENGGUNAAN INTERNAL GSP', issue: 'TERBITAN', sheet: 'LEMBAR', of: 'DARI', chapter: 'Bab', kicker: 'Lembar Kendali' },
  EN: { sealLeft: 'CLASSIFICATION', sealRight: 'MASTER COPY · GSP INTERNAL USE', issue: 'ISSUE', sheet: 'SHEET', of: 'OF', chapter: 'Chapter', kicker: 'Control Sheet' },
} as const;

const SEAL_RUN: RunFmt = { font: COND, sz: 11, b: true, color: 'F4F5F6' };
const SHD = '<w:shd w:val="clear" w:color="auto" w:fill="6E1420"/>';

function sealBand(lang: Lang): string {
  const w = WORDS[lang];
  return table(
    [cell(para(r(`${w.sealLeft} · TERBATAS`, SEAL_RUN)), SHD), cell(para(r(w.sealRight, SEAL_RUN)), SHD)],
    [4706, 4705],
    '<w:tblW w:w="9411" w:type="dxa"/>',
    '<w:trHeight w:val="283"/>',
  );
}

function colophon(lang: Lang): string {
  const stamp = `// 20261104 ${lang} T -- ${WORDS[lang].issue} 1`;
  return table(
    [cell(para(r('PT GEMILANG SATRIA PERKASA · NIB 9120208940517', { font: MONO, sz: 12 }))), cell(para(r(stamp, { font: MONO, sz: 12, b: true, color: '6E1420' })))],
    [4706, 4705],
    '<w:tblW w:w="9411" w:type="dxa"/>',
  );
}

function runningHead(lang: Lang, chapter: number, title: string): string {
  const left = `PT Gemilang Satria Perkasa · Kajian · ${WORDS[lang].chapter} ${chapter} · ${title}`;
  return para(
    r(left, { font: COND, sz: 13, caps: true, color: '6B7783' }) + r('TERBATAS', { font: COND, sz: 13, caps: true, b: true, color: '6E1420' }, true),
    '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="6E1420"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9411"/></w:tabs>',
  );
}

function register(lang: Lang): string {
  const label: RunFmt = { font: MONO, sz: 12, color: '6B7783' };
  const value: RunFmt = { font: MONO, sz: 12, b: true, color: '101418' };
  const w = WORDS[lang];
  const c1 = para(r(`GSP${NBSP}·${NBSP}`, label) + r('017/GSP/KT/XI/2026', value));
  const c2 = para(r(`REV${NBSP}`, label) + r('A', value) + r(`${NBSP}·${NBSP}04-XI-2026`, label));
  const c3 = para(
    r(`${w.sheet}${NBSP}`, label) +
      `<w:fldSimple w:instr=" PAGE ">${r('1', value)}</w:fldSimple>` +
      r(`${NBSP}${w.of}${NBSP}`, label) +
      `<w:fldSimple w:instr=" NUMPAGES ">${r('2', value)}</w:fldSimple>`,
  );
  const c4 = para(r('TERBATAS', { font: MONO, sz: 12, b: true, color: '6E1420' }));
  return (
    table(
      [cell(c1), cell(c2), cell(c3), cell(c4)],
      [2948, 2381, 2381, 1701],
      '<w:tblW w:w="9411" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="6E1420"/><w:bottom w:val="single" w:sz="5" w:space="0" w:color="C3CBD1"/></w:tblBorders>',
    ) + '<w:p/>'
  );
}

function chapterBody(lang: Lang, n: number, title: string): string {
  const kicker = para(r(`${WORDS[lang].chapter} ${n}`, { font: COND, sz: 14, caps: true, b: true, color: 'B45309' }), '<w:spacing w:line="180" w:lineRule="exact"/>');
  const rule = `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="4608000" cy="86857"/><wp:docPr id="${n}" name="Datum Rule"/></wp:inline></w:drawing></w:r></w:p>`;
  const heading = para(r(title, { font: COND, sz: 32, b: true, color: '101418' }), '<w:outlineLvl w:val="0"/>');
  const sub = para(r(`${n}.1   Tujuan`, { font: MONO, sz: 16, color: '6B7783' }), '<w:outlineLvl w:val="1"/><w:spacing w:line="270" w:lineRule="exact"/>');
  const body = (t: string) => para(r(t, { font: SERIF, sz: 19, color: '2B3640' }), '<w:spacing w:line="270" w:lineRule="exact"/>');
  return kicker + rule + heading + sub + body('Kajian ini menghitung biaya pemeliharaan peralatan.') + body('Paragraf isi kedua.') + body('Paragraf isi ketiga.');
}

const EMPTY_HF = '<w:p/>';

const FONT_TABLE =
  `<?xml version="1.0" encoding="UTF-8"?><w:fonts ${W_NS}>` +
  `<w:font w:name="${SERIF}"><w:embedRegular r:id="rId1" w:fontKey="{00000000-0000-0000-0000-000000000001}"/></w:font>` +
  `<w:font w:name="${COND}"><w:embedRegular r:id="rId2" w:fontKey="{00000000-0000-0000-0000-000000000002}"/></w:font>` +
  `<w:font w:name="${MONO}"><w:embedRegular r:id="rId3" w:fontKey="{00000000-0000-0000-0000-000000000003}"/></w:font>` +
  `</w:fonts>`;
const FONT_RELS =
  '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  [1, 2, 3].map((i) => `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font${i}.odttf"/>`).join('') +
  '</Relationships>';
const STYLES = `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${SERIF}" w:hAnsi="${SERIF}" w:cs="${SERIF}" w:eastAsia="${SERIF}"/><w:sz w:val="19"/></w:rPr></w:rPrDefault></w:docDefaults>`;

/** Tema bawaan Word (minor = Calibri): tidak dirujuk DOCX baik, dipakai mutasi GF-04 lewat tema. */
const THEME =
  '<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements><a:fontScheme name="Office">' +
  '<a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>';

/** DOCX TERBIT baik: SAMPUL, LEMBAR KENDALI, dua seksi INTERIOR (bab 1, bab 2). Nama bagian: header1..4 / footer1..4. */
function goodDocx(lang: Lang): Uint8Array {
  return buildDocx({
    sections: [
      { body: sealBand(lang) + para(r('Kajian Biaya', { font: COND, sz: 50, b: true })) + colophon(lang), header: EMPTY_HF, footer: EMPTY_HF },
      { body: sealBand(lang) + para(r(WORDS[lang].kicker, { font: COND, sz: 15, color: '6E1420' })), header: EMPTY_HF, footer: EMPTY_HF },
      { body: chapterBody(lang, 1, 'Lingkup Kajian'), header: runningHead(lang, 1, 'Lingkup Kajian'), footer: register(lang) },
      { body: chapterBody(lang, 2, 'Rekapitulasi Biaya'), header: runningHead(lang, 2, 'Rekapitulasi Biaya'), footer: register(lang) },
    ],
    styles: STYLES,
    theme: THEME,
    extraParts: {
      'word/fontTable.xml': FONT_TABLE,
      'word/_rels/fontTable.xml.rels': FONT_RELS,
      'word/fonts/font1.odttf': new Uint8Array([1, 2, 3]),
      'word/fonts/font2.odttf': new Uint8Array([1, 2, 3]),
      'word/fonts/font3.odttf': new Uint8Array([1, 2, 3]),
    },
  });
}

/** Mutasi tepat satu bagian; gagal keras bila pola tidak ditemukan (mutasi yang tidak terjadi = uji palsu). */
function mutate(bytes: Uint8Array, part: string, from: string | RegExp, to: string): Uint8Array {
  const files = unzipSync(bytes);
  const xml = strFromU8(files[part]);
  const next = xml.replace(from, to);
  if (next === xml) throw new Error(`mutasi tidak terjadi di ${part}: ${String(from)}`);
  files[part] = strToU8(next);
  return zipSync(files);
}

function pairOf(lang: Lang, tier: Tier = 'TERBIT'): PairContext {
  return {
    slug: lang === 'ID' ? 'datum-laporan' : 'datum-laporan-en',
    language: lang,
    tier,
    typeCode: 'LAP',
    kicker: lang === 'ID' ? 'LAPORAN' : 'REPORT',
    producedBy: 'mcp',
    agentRevisionText: false,
    hasCopyControl: false,
  };
}

const INDEX = buildRuleIndex({ structure_a: [], structure_b: rules, language: [], clash: [] });

function outcomes(bytes: Uint8Array, pair: PairContext): Map<string, RuleOutcome> {
  const docx = DocxDocument.fromBytes(bytes, { path: 'uji.docx' });
  const rep = runConformance({ docx, pair, index: INDEX, implementedOnly: true });
  return new Map(rep.outcomes.filter((o) => o.module === 'structure_b').map((o) => [o.id, o]));
}

function statusOf(bytes: Uint8Array, pair: PairContext, id: string): string {
  const o = outcomes(bytes, pair).get(id);
  if (!o) throw new Error(`tidak ada hasil ${id}`);
  return o.status;
}

const STRUCTURE_B_CODES = DATUM_CATALOG.filter((c) => c.module === 'structure_b').map((c) => c.id);

describe('structure_b: cakupan modul', () => {
  it('mengimplementasikan setiap kode katalog milik structure_b, tidak lebih', () => {
    expect(rules.map((x) => x.id).sort()).toEqual([...STRUCTURE_B_CODES].sort());
    expect(STRUCTURE_B_CODES).toHaveLength(33);
  });
});

describe('structure_b: DOCX baik', () => {
  for (const lang of ['ID', 'EN'] as const) {
    it(`TERBIT ${lang}: setiap aturan structure_b yang berlaku lulus (kecuali NA bersyarat GF-11)`, () => {
      const res = outcomes(goodDocx(lang), pairOf(lang));
      const bad = [...res.values()].filter((o) => o.applicable && o.status !== 'pass' && !(o.id === 'GF-11' && o.status === 'na'));
      expect(bad.map((o) => `${o.id}: ${o.status} ${o.evidence}`)).toEqual([]);
      expect(res.get('GF-11')?.status).toBe('na');
    });
  }

  it('NOTA ID: CR-1 lulus tanpa pita segel; SB/IS/RB-07 tidak berlaku', () => {
    const res = outcomes(goodDocx('ID'), pairOf('ID', 'NOTA'));
    expect(res.get('CR-1')?.status).toBe('pass');
    for (const id of ['SB-01', 'SB-02', 'SB-03', 'IS-01', 'IS-02', 'IS-03', 'RB-07']) expect(res.get(id)?.status).toBe('not_applicable');
  });
});

describe('structure_b: CR-1 penandaan klasifikasi (kritis)', () => {
  it('klasifikasi hilang dari kepala halaman interior kedua -> FAIL', () => {
    const bad = mutate(goodDocx('ID'), 'word/header4.xml', '<w:t xml:space="preserve">TERBATAS</w:t>', '<w:t xml:space="preserve"></w:t>');
    expect(statusOf(bad, pairOf('ID'), 'CR-1')).toBe('fail');
  });

  it('klasifikasi hilang dari pita segel sampul -> FAIL (dan SB-03 FAIL)', () => {
    const bad = mutate(goodDocx('ID'), 'word/document.xml', 'KLASIFIKASI · TERBATAS', 'KLASIFIKASI · ');
    expect(statusOf(bad, pairOf('ID'), 'CR-1')).toBe('fail');
    expect(statusOf(bad, pairOf('ID'), 'SB-03')).toBe('fail');
  });

  it('padanan Inggris RESTRICTED di sel klasifikasi register -> FAIL', () => {
    const bad = mutate(goodDocx('EN'), 'word/footer3.xml', '>TERBATAS<', '>RESTRICTED<');
    expect(statusOf(bad, pairOf('EN'), 'CR-1')).toBe('fail');
  });

  it('tingkat di luar skema ANRI di semua lokasi -> FAIL', () => {
    let bad = goodDocx('ID');
    for (const part of ['word/header3.xml', 'word/header4.xml', 'word/footer3.xml', 'word/footer4.xml']) bad = mutate(bad, part, '>TERBATAS<', '>SEGERA<');
    bad = mutate(bad, 'word/document.xml', /KLASIFIKASI · TERBATAS/g, 'KLASIFIKASI · SEGERA');
    expect(statusOf(bad, pairOf('ID'), 'CR-1')).toBe('fail');
  });

  it('klasifikasi huruf kecil tanpa caps di register -> FAIL', () => {
    const bad = mutate(goodDocx('ID'), 'word/footer4.xml', '>TERBATAS<', '>Terbatas<');
    expect(statusOf(bad, pairOf('ID'), 'CR-1')).toBe('fail');
  });
});

/** Mutasi -> aturan yang harus turun ke FAIL. Setiap baris menyentuh satu unsur DOCX baik. */
interface Mutation {
  name: string;
  lang: Lang;
  rule: string;
  /** Prasyarat pada DOCX baik (harus tetap lulus) sebelum mutasi, mis. menambah gambar isi yang sah. */
  base?: (b: Uint8Array) => Uint8Array;
  apply: (b: Uint8Array) => Uint8Array;
}

const allParts = (b: Uint8Array, parts: string[], from: string | RegExp, to: string) => parts.reduce((acc, p) => mutate(acc, p, from, to), b);
const INTERIOR_HEADERS = ['word/header3.xml', 'word/header4.xml'];
const INTERIOR_FOOTERS = ['word/footer3.xml', 'word/footer4.xml'];
const EM = String.fromCharCode(0x2014);

const MUTATIONS: Mutation[] = [
  // RB: kata register per bahasa
  { name: 'LEMBAR/DARI di dokumen EN', lang: 'EN', rule: 'RB-02', apply: (b) => allParts(allParts(b, INTERIOR_FOOTERS, 'SHEET', 'LEMBAR'), INTERIOR_FOOTERS, /OF(?= <)/, 'DARI') },
  { name: 'SHEET/OF di dokumen ID', lang: 'ID', rule: 'RB-02', apply: (b) => allParts(b, INTERIOR_FOOTERS, 'LEMBAR', 'SHEET') },
  { name: 'spasi ASCII di teks literal register', lang: 'ID', rule: 'RB-03', apply: (b) => mutate(b, 'word/footer3.xml', /GSP.·./, 'GSP · ') },
  { name: 'medan NUMPAGES hilang', lang: 'ID', rule: 'RB-03', apply: (b) => mutate(b, 'word/footer4.xml', 'w:instr=" NUMPAGES "', 'w:instr=" SECTIONPAGES "') },
  { name: 'nomor dokumen tidak tebal', lang: 'ID', rule: 'RB-04', apply: (b) => mutate(b, 'word/footer3.xml', /<w:b\/>(<w:color w:val="101418"\/><w:sz w:val="12"\/><\/w:rPr><w:t xml:space="preserve">017)/, '$1') },
  { name: 'garis atas register INK900 (pola mesin)', lang: 'ID', rule: 'RB-05', apply: (b) => allParts(b, INTERIOR_FOOTERS, '<w:top w:val="single" w:sz="8" w:space="0" w:color="6E1420"/>', '<w:top w:val="single" w:sz="8" w:space="0" w:color="101418"/>') },
  { name: 'tanggal register ISO', lang: 'ID', rule: 'RB-06', apply: (b) => mutate(b, 'word/footer4.xml', '04-XI-2026', '2026-11-04') },
  { name: 'medan PAGE di footer sampul', lang: 'ID', rule: 'RB-07', apply: (b) => mutate(b, 'word/footer1.xml', '<w:p/>', '<w:p><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p>') },
  { name: 'nomor lembar mulai ulang di bab 2 (EN)', lang: 'EN', rule: 'RB-08', apply: (b) => mutate(b, 'word/document.xml', /(<w:pgMar[^>]*\/>)(<\/w:sectPr><\/w:body>)/, '$1<w:pgNumType w:start="1"/>$2') },
  { name: 'tabel register hilang dari footer interior', lang: 'ID', rule: 'RB-01', apply: (b) => mutate(b, 'word/footer4.xml', /<w:tbl>[\s\S]*<\/w:tbl>/, '<w:p><w:fldSimple w:instr=" PAGE "><w:r><w:t>2</w:t></w:r></w:fldSimple></w:p>') },
  // RH
  { name: 'garis kepala INK200 sz 5 (pola mesin, F-4)', lang: 'ID', rule: 'RH-03', apply: (b) => allParts(b, INTERIOR_HEADERS, 'w:sz="6" w:space="1" w:color="6E1420"', 'w:sz="5" w:space="1" w:color="C3CBD1"') },
  { name: 'teks kiri kepala tinta gelap', lang: 'ID', rule: 'RH-04', apply: (b) => mutate(b, 'word/header3.xml', '<w:color w:val="6B7783"/>', '<w:color w:val="101418"/>') },
  { name: 'label bab salah di kepala halaman', lang: 'ID', rule: 'RH-01', apply: (b) => mutate(b, 'word/header4.xml', 'Bab 2', 'Bab 7') },
  { name: 'logo di kepala halaman', lang: 'EN', rule: 'RH-01', apply: (b) => mutate(b, 'word/header3.xml', '</w:p>', '<w:r><w:drawing><wp:inline><wp:extent cx="1620000" cy="400000"/></wp:inline></w:drawing></w:r></w:p>') },
  // SB, IS
  { name: 'pita segel bukan blok pertama lembar kendali', lang: 'ID', rule: 'SB-01', apply: (b) => moveKickerFirst(b) },
  { name: 'teks pita segel bukan F4F5F6', lang: 'EN', rule: 'SB-02', apply: (b) => mutate(b, 'word/document.xml', /F4F5F6/g, 'F6E9E9') },
  { name: 'lebar pita segel 150 mm', lang: 'ID', rule: 'SB-02', apply: (b) => mutate(b, 'word/document.xml', /<w:tblW w:w="9411" w:type="dxa"\/><\/w:tblPr><w:tblGrid><w:gridCol w:w="4706"\/><w:gridCol w:w="4705"\/><\/w:tblGrid><w:tr><w:trPr>/, '<w:tblW w:w="8504" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4252"/><w:gridCol w:w="4252"/></w:tblGrid><w:tr><w:trPr>') },
  { name: 'pita segel kanan berbahasa ID di dokumen EN', lang: 'EN', rule: 'SB-03', apply: (b) => mutate(b, 'word/document.xml', 'MASTER COPY · GSP INTERNAL USE', 'SALINAN INDUK · PENGGUNAAN INTERNAL GSP') },
  { name: 'cap terbit dengan tanda pisah panjang', lang: 'ID', rule: 'IS-01', apply: (b) => mutate(b, 'word/document.xml', ' -- TERBITAN', ` ${EM} TERBITAN`) },
  { name: 'cap terbit EN memakai TERBITAN', lang: 'EN', rule: 'IS-01', apply: (b) => mutate(b, 'word/document.xml', '-- ISSUE 1', '-- TERBITAN 1') },
  { name: 'cap terbit tanggal ISO', lang: 'ID', rule: 'IS-01', apply: (b) => mutate(b, 'word/document.xml', '// 20261104', '// 2026-11-04') },
  { name: 'cap terbit tanggal beda dari register', lang: 'ID', rule: 'IS-02', apply: (b) => mutate(b, 'word/document.xml', '// 20261104', '// 20261105') },
  { name: 'cap terbit kelas salah', lang: 'EN', rule: 'IS-02', apply: (b) => mutate(b, 'word/document.xml', 'EN T -- ISSUE', 'EN R -- ISSUE') },
  { name: 'cap terbit tidak tebal', lang: 'ID', rule: 'IS-03', apply: (b) => mutate(b, 'word/document.xml', /<w:b\/>(<w:color w:val="6E1420"\/><w:sz w:val="12"\/><\/w:rPr><w:t xml:space="preserve">\/\/)/, '$1') },
  // GF, DV
  { name: 'halaman Letter', lang: 'ID', rule: 'GF-01', apply: (b) => mutate(b, 'word/document.xml', /<w:pgSz w:w="11906" w:h="16838"\/>/g, '<w:pgSz w:w="12240" w:h="15840"/>') },
  { name: 'margin kiri 25,4 mm', lang: 'EN', rule: 'GF-02', apply: (b) => mutate(b, 'word/document.xml', /w:left="1361"/, 'w:left="1440"') },
  { name: 'margin atas/bawah interior terakhir 25,4 mm', lang: 'ID', rule: 'GF-03', apply: (b) => mutate(b, 'word/document.xml', /w:top="1474" w:right="1134" w:bottom="1361"([^>]*\/><\/w:sectPr><\/w:body>)/, 'w:top="1440" w:right="1134" w:bottom="1440"$1') },
  { name: 'fon badan Calibri', lang: 'ID', rule: 'GF-04', apply: (b) => mutate(b, 'word/document.xml', /IBM Plex Serif/g, 'Calibri') },
  { name: 'fon bawaan Calibri lewat tema', lang: 'EN', rule: 'GF-04', apply: (b) => mutate(b, 'word/styles.xml', /<w:rFonts [^>]*\/>/, '<w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi"/>') },
  { name: 'fon Plex tanpa sematan', lang: 'ID', rule: 'GF-05', apply: (b) => mutate(b, 'word/fontTable.xml', /<w:embedRegular r:id="rId3"[^>]*\/>/, '') },
  { name: 'badan Georgia 11 pt', lang: 'ID', rule: 'GF-06', apply: (b) => mutate(b, 'word/document.xml', /<w:rFonts w:ascii="IBM Plex Serif" w:hAnsi="IBM Plex Serif" w:cs="IBM Plex Serif" w:eastAsia="IBM Plex Serif"\/>(<w:color w:val="2B3640"\/>)<w:sz w:val="19"\/>/g, '<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/>$1<w:sz w:val="22"/>') },
  { name: 'badan spasi baris 1,15', lang: 'EN', rule: 'GF-06', apply: (b) => mutate(b, 'word/document.xml', /<w:spacing w:line="270" w:lineRule="exact"\/><\/w:pPr><w:r><w:rPr><w:rFonts w:ascii="IBM Plex Serif"/g, '<w:spacing w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="IBM Plex Serif"') },
  { name: 'kicker bab tanpa caps dan Serif', lang: 'ID', rule: 'GF-07', apply: (b) => mutate(b, 'word/document.xml', /<w:rFonts w:ascii="IBM Plex Sans Condensed"[^>]*\/><w:b\/><w:caps\/>(<w:color w:val="B45309"\/>)/, '<w:rFonts w:ascii="IBM Plex Serif" w:hAnsi="IBM Plex Serif"/><w:b/>$1') },
  { name: 'garis tabel 0,1 mm', lang: 'ID', rule: 'GF-09', apply: (b) => mutate(b, 'word/footer3.xml', 'w:sz="5" w:space="0" w:color="C3CBD1"', 'w:sz="2" w:space="0" w:color="C3CBD1"') },
  { name: 'tabel 180 mm', lang: 'EN', rule: 'GF-10', apply: (b) => mutate(b, 'word/footer4.xml', '<w:gridCol w:w="2948"/>', '<w:gridCol w:w="3800"/>') },
  {
    name: 'gambar isi 100 mm',
    lang: 'ID',
    rule: 'GF-11',
    base: (b) => mutate(b, 'word/document.xml', 'Paragraf isi kedua.</w:t></w:r></w:p>', 'Paragraf isi kedua.</w:t></w:r></w:p><w:p><w:r><w:drawing><wp:inline><wp:extent cx="4608000" cy="2400000"/></wp:inline></w:drawing></w:r></w:p>'),
    apply: (b) => mutate(b, 'word/document.xml', '<wp:extent cx="4608000" cy="2400000"/>', '<wp:extent cx="3600000" cy="2400000"/>'),
  },
  { name: 'warna navy pensiun', lang: 'ID', rule: 'GF-12', apply: (b) => mutate(b, 'word/document.xml', '<w:color w:val="2B3640"/>', '<w:color w:val="1A2B4A"/>') },
  { name: 'klasifikasi INK900 (pola mesin, F-4)', lang: 'ID', rule: 'GF-13', apply: (b) => allParts(allParts(b, INTERIOR_HEADERS, '<w:b/><w:caps/><w:color w:val="6E1420"/>', '<w:b/><w:caps/><w:color w:val="101418"/>'), INTERIOR_FOOTERS, '<w:b/><w:color w:val="6E1420"/>', '<w:b/><w:color w:val="101418"/>') },
  { name: 'dua judul bab dalam satu seksi', lang: 'ID', rule: 'GF-14', apply: (b) => mutate(b, 'word/document.xml', 'Paragraf isi ketiga.</w:t></w:r></w:p>', 'Paragraf isi ketiga.</w:t></w:r></w:p><w:p><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:r><w:t>Bab sisipan</w:t></w:r></w:p>') },
  { name: 'judul tingkat empat', lang: 'EN', rule: 'GF-15', apply: (b) => mutate(b, 'word/document.xml', '<w:outlineLvl w:val="1"/>', '<w:outlineLvl w:val="3"/>') },
  { name: 'Datum Rule hilang di atas judul bab', lang: 'ID', rule: 'DV-01', apply: (b) => mutate(b, 'word/document.xml', /<wp:extent cx="4608000" cy="86857"\/>/, '<wp:extent cx="5976000" cy="86857"/>') },
];

/** Lembar kendali: kicker dipindah ke depan pita segel (pita bukan blok pertama). */
function moveKickerFirst(b: Uint8Array): Uint8Array {
  const kicker = /<w:p><w:r><w:rPr><w:rFonts[^>]*\/><w:color w:val="6E1420"\/><w:sz w:val="15"\/><\/w:rPr><w:t xml:space="preserve">Lembar Kendali<\/w:t><\/w:r><\/w:p>/;
  const files = unzipSync(b);
  const xml = strFromU8(files['word/document.xml']);
  const k = kicker.exec(xml);
  if (!k) throw new Error('kicker lembar kendali tidak ditemukan');
  const without = xml.replace(k[0], '');
  // Pita segel kedua (lembar kendali) diawali <w:tbl> sesudah sectPr seksi sampul.
  const sectEnd = without.indexOf('</w:sectPr></w:pPr></w:p>') + '</w:sectPr></w:pPr></w:p>'.length;
  files['word/document.xml'] = strToU8(without.slice(0, sectEnd) + k[0] + without.slice(sectEnd));
  return zipSync(files);
}

describe('structure_b: mutasi terarah turun ke FAIL', () => {
  for (const m of MUTATIONS) {
    it(`${m.rule}: ${m.name}`, () => {
      const good = m.base ? m.base(goodDocx(m.lang)) : goodDocx(m.lang);
      expect(statusOf(good, pairOf(m.lang), m.rule)).toBe('pass');
      expect(statusOf(m.apply(good), pairOf(m.lang), m.rule)).toBe('fail');
    });
  }
});

describe('structure_b: GF-13 dan RH-03 tidak dilemahkan (research/31 F-4, D-598)', () => {
  it('pola mesin saat ini (klasifikasi INK900, garis kepala INK200 sz 5) gagal, aturan lain tetap lulus', () => {
    let b = allParts(goodDocx('ID'), INTERIOR_HEADERS, 'w:sz="6" w:space="1" w:color="6E1420"', 'w:sz="5" w:space="1" w:color="C3CBD1"');
    b = allParts(b, INTERIOR_HEADERS, '<w:b/><w:caps/><w:color w:val="6E1420"/>', '<w:b/><w:caps/><w:color w:val="101418"/>');
    b = allParts(b, INTERIOR_FOOTERS, '<w:b/><w:color w:val="6E1420"/>', '<w:b/><w:color w:val="101418"/>');
    const res = outcomes(b, pairOf('ID'));
    const failed = [...res.values()].filter((o) => o.status === 'fail').map((o) => o.id);
    expect(failed.sort()).toEqual(['GF-13', 'RH-03']);
  });
});
