/**
 * S21: modul aturan structure_a (research/32 §3 CV, §4 CS, §9 TR).
 * Seam: `rules` dari `rules/structure_a.ts`, dipanggil lewat `rule.check(ctx)` dan lewat
 * `runConformance` dengan indeks yang dibangun sendiri (bukan `defaultRuleIndex()`).
 * Harapan berasal dari katalog research/32 dan register research/31, bukan dari kode modul.
 */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { buildLayout } from '../../../../benchmark/datum_conformance/lib/layout';
import { runConformance } from '../../../../benchmark/datum_conformance/lib/score';
import { buildRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import { rules } from '../../../../benchmark/datum_conformance/rules/structure_a';
import type { Lang, PairContext, RuleResult, Tier } from '../../../../benchmark/datum_conformance/rules/types';
import { buildDocx, type KitSection } from './_docx_kit';

// ── Perakit OOXML kecil (format langsung per run) ─────────────────────────

const COND = 'IBM Plex Sans Condensed';
const SERIF = 'IBM Plex Serif';
const MONO = 'IBM Plex Mono';
const PIC_NS = 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const IMG_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const SEAL_SHD = '<w:shd w:val="clear" w:color="auto" w:fill="6E1420"/>';

interface R {
  sz?: number;
  font?: string;
  color?: string;
  b?: boolean;
  i?: boolean;
  caps?: boolean;
  spacing?: number;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rpr(r: R = {}): string {
  return [
    r.font ? `<w:rFonts w:ascii="${r.font}" w:hAnsi="${r.font}"/>` : '',
    r.b ? '<w:b/>' : '',
    r.i ? '<w:i/>' : '',
    r.caps ? '<w:caps/>' : '',
    r.color ? `<w:color w:val="${r.color}"/>` : '',
    r.spacing !== undefined ? `<w:spacing w:val="${r.spacing}"/>` : '',
    r.sz ? `<w:sz w:val="${r.sz}"/>` : '',
  ].join('');
}

function para(text: string, r: R = {}, pPr = ''): string {
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}<w:r><w:rPr>${rpr(r)}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function cell(inner: string, tcPr = ''): string {
  return `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${inner}</w:tc>`;
}

function table(rows: string[][], grid: number[], tblPr = ''): string {
  return `<w:tbl><w:tblPr>${tblPr}</w:tblPr><w:tblGrid>${grid.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows
    .map((r) => `<w:tr>${r.join('')}</w:tr>`)
    .join('')}</w:tbl>`;
}

/** Tabel teks polos (sel = satu paragraf tanpa format). */
function textTable(rows: string[][], tcPr = ''): string {
  const n = rows[0]?.length ?? 1;
  return table(
    rows.map((r) => r.map((t) => cell(t ? para(t) : '<w:p/>', tcPr))),
    Array.from({ length: n }, () => Math.round(9411 / n)),
  );
}

const band = (l: string, r: string) =>
  table([[cell(para(l, { color: 'F4F5F6' }), SEAL_SHD), cell(para(r, { color: 'F4F5F6' }), SEAL_SHD)]], [4706, 4705]);

function drawingPara(cx: number, cy: number, rid: string): string {
  return `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><a:graphic><a:graphicData><pic:pic ${PIC_NS}><pic:blipFill><a:blip r:embed="${rid}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

const tocField = (levels = '1-2') =>
  `<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "${levels}" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Bab 1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;

const registerFooter = (lang: Lang) => {
  const [sheet, of] = lang === 'ID' ? ['LEMBAR', 'DARI'] : ['SHEET', 'OF'];
  const c = (x: string) => cell(`<w:p>${x}</w:p>`);
  const t = (s: string) => `<w:r><w:t xml:space="preserve">${s}</w:t></w:r>`;
  return table(
    [[
      c(t('GSP · 001/GSP/STD/XI/2026')),
      c(t('REV A · 04-XI-2026')),
      c(`${t(`${sheet} `)}<w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple>${t(` ${of} `)}<w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>9</w:t></w:r></w:fldSimple>`),
      c(t('TERBATAS')),
    ]],
    [2352, 2352, 2352, 2355],
  );
};

// ── Teks per bahasa (research/31 §4) ──────────────────────────────────────

const TXT = {
  ID: {
    bandL: 'KLASIFIKASI · TERBATAS',
    bandR: 'SALINAN INDUK · PENGGUNAAN INTERNAL GSP',
    kicker: 'STANDAR',
    controlRows: [
      ['Nomor dokumen', '001/GSP/STD/XI/2026', 'Revisi', 'A · 4 November 2026'],
      ['Penyusun', 'Divisi Engineering PT GSP', 'Tier', 'TERBIT'],
      ['Kustodian', 'Divisi Engineering', 'Bahasa', 'Indonesia'],
    ],
    stamp: '// 20261104 ID T -- TERBITAN 1',
    spine: 'STD · Standar uji · ID · REV A · XI · 2026',
    cs: 'Lembar Kendali',
    blocks: ['A · Riwayat revisi', 'B · Rantai verifikasi', 'C · Pernyataan metode', 'D · Distribusi terkendali'],
    rev: ['Rev', 'Tanggal', 'Uraian', 'Oleh'],
    ver: ['Lapis', 'Peran', 'Nama', 'Tanggal'],
    dist: ['Salinan', 'Pemegang'],
    sig: ['Disusun', 'Diperiksa', 'Disetujui'],
    toc: 'Daftar Isi',
    chapter: 'BAB 1',
  },
  EN: {
    bandL: 'CLASSIFICATION · TERBATAS',
    bandR: 'MASTER COPY · GSP INTERNAL USE',
    kicker: 'STANDARD',
    controlRows: [
      ['Document number', '001/GSP/STD/XI/2026', 'Revision', 'A · 4 November 2026'],
      ['Prepared by', 'Engineering Division, PT GSP', 'Tier', 'TERBIT'],
      ['Custodian', 'Engineering Division', 'Language', 'English'],
    ],
    stamp: '// 20261104 EN T -- ISSUE 1',
    spine: 'STD · Test standard · EN · REV A · XI · 2026',
    cs: 'Control Sheet',
    blocks: ['A · Revision history', 'B · Verification chain', 'C · Method statement', 'D · Controlled distribution'],
    rev: ['Rev', 'Date', 'Change', 'Prepared by'],
    ver: ['Layer', 'Role', 'Name', 'Date'],
    dist: ['Copy', 'Holder'],
    sig: ['Prepared by', 'Reviewed by', 'Approved by'],
    toc: 'Contents',
    chapter: 'CHAPTER 1',
  },
} as const;

const ADDRESS =
  'Divisi Engineering & Technical Intelligence · Jl. Bangka Raya No. 27, Pela Mampang, Jakarta Selatan 12720 · Tel. (021) 22715320';
const COLOPHON = 'PT GEMILANG SATRIA PERKASA · NIB 9120208940517';

type CoverKey = 'band' | 'logo' | 'address' | 'rule' | 'kicker' | 'title' | 'standfirst' | 'scope' | 'control' | 'colophon' | 'spine';
const COVER_ORDER: CoverKey[] = ['band', 'logo', 'address', 'rule', 'kicker', 'title', 'standfirst', 'scope', 'control', 'colophon', 'spine'];

function controlBlock(rows: readonly (readonly string[])[], opts: { valueFont?: string; labelFont?: string; topBorder?: boolean } = {}): string {
  const top = opts.topBorder === false ? '' : '<w:tcBorders><w:top w:val="single" w:sz="10" w:color="14110F"/></w:tcBorders>';
  return table(
    rows.map((r, ri) =>
      r.map((t, ci) => {
        const label = ci % 2 === 0;
        const run: R = label ? { sz: 13, font: opts.labelFont ?? COND, b: true, caps: true } : { sz: 15, font: opts.valueFont ?? MONO };
        return cell(t ? para(t, run) : '<w:p/>', ri === 0 ? top : '');
      }),
    ),
    [1814, 3175, 1474, 2948],
  );
}

function coverParts(lang: Lang): Record<CoverKey, string> {
  const x = TXT[lang];
  return {
    band: band(x.bandL, x.bandR),
    logo: drawingPara(1_620_000, 850_000, 'rIdLogo'),
    address: para(ADDRESS, { sz: 14, font: COND }),
    rule: drawingPara(5_976_000, 86_874, 'rIdRule'),
    kicker: para(x.kicker, { sz: 15, font: COND, color: '6E1420', spacing: 30, b: true, caps: true }),
    title: para(lang === 'ID' ? 'Standar Uji Konformitas' : 'Conformance Test Standard', { sz: 50, font: COND, b: true }),
    standfirst: para(lang === 'ID' ? 'Ringkasan standar.' : 'Standard summary.', { sz: 21, font: SERIF, i: true }),
    scope: para(lang === 'ID' ? 'Berlaku untuk seluruh divisi' : 'Applies to all divisions', { sz: 15, font: COND }),
    control: controlBlock(x.controlRows),
    colophon: table(
      [[cell(para(COLOPHON, { sz: 12, font: MONO })), cell(para(x.stamp, { sz: 12, font: MONO, b: true, color: '6E1420' }), '')]],
      [4706, 4705],
    ),
    spine: para(x.spine, { sz: 12, font: MONO, caps: true }),
  };
}

function controlSheetBody(lang: Lang, opts: { bandR?: string; distRows?: string[][] } = {}): string {
  const x = TXT[lang];
  return [
    band(x.bandL, opts.bandR ?? x.bandR),
    para(x.cs, { caps: true }),
    para(x.cs),
    para(x.blocks[0]),
    textTable([[...x.rev], ['A', '2026-11-04', lang === 'ID' ? 'Terbit pertama' : 'First issue', 'A. Pratama']]),
    para(x.blocks[1]),
    textTable([[...x.ver], ['1', lang === 'ID' ? 'Penyusun' : 'Prepared by', 'A. Pratama', '']]),
    para(x.blocks[2]),
    para(lang === 'ID' ? 'Metode uji.' : 'Test method.'),
    para(x.blocks[3]),
    textTable([[...x.dist], ...(opts.distRows ?? [['1', 'Manajer Aset']])]),
    textTable([[...x.sig], ['', '', ''], ['A. Pratama', 'B. Santoso', 'C. Wibowo']]),
  ].join('');
}

/**
 * C25: kepala kolom lembar kendali bentuk manual (D-635 (5)): revisi `ID:29` / `EN:29`, rantai verifikasi
 * `ID:39` / `EN:38`, distribusi `ID:58` / `EN:62` (manual_id.txt / manual_en.txt, research/38 §3.2). Teks
 * sumber huruf campuran; kapital tampilan datang dari format peran (research/38 §3).
 */
const MANUAL = {
  ID: { rev: ['Rev', 'Tanggal', 'Penyusun', 'Perubahan', 'Status'], ver: ['Lapis', 'Metode', 'Objek', 'Hasil'], dist: ['Salinan', 'Pemegang', 'Media', 'Kembali'] },
  EN: { rev: ['Rev', 'Date', 'Prepared by', 'Change', 'Status'], ver: ['Layer', 'Method', 'Object', 'Result'], dist: ['Copy', 'Holder', 'Medium', 'Return'] },
} as const;

/** Lembar kendali bentuk manual seperti keluaran C10 (`compose/front.ts`): baris revisi [rev, tanggal, penyusun, perubahan, STATUS]. */
function manualControlSheetBody(
  lang: Lang,
  o: { rev?: string[]; ver?: string[]; dist?: string[]; bandR?: string; distRows?: string[][] } = {},
): string {
  const x = TXT[lang];
  const m = MANUAL[lang];
  return [
    band(x.bandL, o.bandR ?? x.bandR),
    para(x.cs, { caps: true }),
    para(x.cs),
    para(x.blocks[0]),
    textTable([o.rev ?? [...m.rev], ['A', '2026-11-04', 'A. Pratama', lang === 'ID' ? 'Terbit pertama' : 'First issue', lang === 'ID' ? 'Berlaku' : 'In force']]),
    para(x.blocks[1]),
    textTable([o.ver ?? [...m.ver], ['1', '', '', '']]),
    para(x.blocks[2]),
    para(lang === 'ID' ? 'Metode uji.' : 'Test method.'),
    para(x.blocks[3]),
    textTable([o.dist ?? [...m.dist], ...(o.distRows ?? [['1', 'Manajer Aset', '', '']])]),
    textTable([[...x.sig], ['', '', ''], ['A. Pratama', 'B. Santoso', 'C. Wibowo']]),
  ].join('');
}

const tocBody = (lang: Lang, levels = '1-2') => band(TXT[lang].bandL, TXT[lang].bandR) + para(TXT[lang].toc, { caps: true }) + tocField(levels);

interface Variant {
  cover?: Partial<Record<CoverKey, string>>;
  coverOrder?: CoverKey[];
  coverPgMar?: string;
  /** Badan seksi sebelum sampul (mis. menyisipkan seksi lain); null = tanpa seksi. */
  controlSheet?: string | null;
  toc?: string | null;
  interiorBody?: string;
  interiorHeader?: string;
  headerRels?: string[];
  /** Urutan seksi pembungkus (bawaan cover, controlSheet, toc). */
  wrapperOrder?: ('cover' | 'controlSheet' | 'toc')[];
}

const WRAPPER_HF = { header: '<w:p/>', footer: '<w:p/>' };

function imageRel(id: string, target: string): string {
  return `<Relationship Id="${id}" Type="${IMG_REL}" Target="${target}"/>`;
}

/** Menambahkan relasi ke bagian rels (membuat bagian bila belum ada). */
function withRels(bytes: Uint8Array, add: Record<string, string[]>): Uint8Array {
  const files = unzipSync(bytes);
  for (const [part, rels] of Object.entries(add)) {
    const cur = files[part] ? strFromU8(files[part]) : `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${REL_NS}"></Relationships>`;
    files[part] = strToU8(cur.replace('</Relationships>', `${rels.join('')}</Relationships>`));
  }
  return zipSync(files);
}

function buildTerbit(lang: Lang, v: Variant = {}): DocxDocument {
  const parts = { ...coverParts(lang), ...v.cover };
  const coverBody = (v.coverOrder ?? COVER_ORDER).map((k) => parts[k]).join('');
  const wrappers: Record<'cover' | 'controlSheet' | 'toc', KitSection | null> = {
    cover: { body: coverBody, ...WRAPPER_HF, ...(v.coverPgMar ? { pgMar: v.coverPgMar } : {}) },
    controlSheet: v.controlSheet === null ? null : { body: v.controlSheet ?? controlSheetBody(lang), ...WRAPPER_HF },
    toc: v.toc === null ? null : { body: v.toc ?? tocBody(lang), ...WRAPPER_HF },
  };
  const sections: KitSection[] = [];
  for (const k of v.wrapperOrder ?? ['cover', 'controlSheet', 'toc']) {
    const s = wrappers[k];
    if (s) sections.push(s);
  }
  const interiorIndex = sections.length;
  sections.push({
    body: v.interiorBody ?? para(TXT[lang].chapter) + para(lang === 'ID' ? 'Pendahuluan' : 'Introduction'),
    header: v.interiorHeader ?? para('PT GEMILANG SATRIA PERKASA'),
    footer: registerFooter(lang),
  });
  sections.push({ body: para(lang === 'ID' ? 'Isi bab dua.' : 'Chapter two body.') });
  const media = { 'word/media/logo.png': new Uint8Array([137, 80, 78, 71]), 'word/media/rule.png': new Uint8Array([137, 80, 78, 71]) };
  let bytes = buildDocx({ sections, extraParts: media });
  const add: Record<string, string[]> = {
    'word/_rels/document.xml.rels': [imageRel('rIdLogo', 'media/logo.png'), imageRel('rIdRule', 'media/rule.png')],
  };
  if (v.headerRels) add[`word/_rels/header${interiorIndex + 1}.xml.rels`] = v.headerRels;
  bytes = withRels(bytes, add);
  return DocxDocument.fromBytes(bytes, { path: `terbit_${lang}.docx` });
}

function buildNota(lang: Lang, opts: { leadBody?: string; bodyExtra?: string; leadWrapper?: boolean } = {}): DocxDocument {
  const sections: KitSection[] = [];
  if (opts.leadWrapper) sections.push({ body: para('Pembuka'), ...WRAPPER_HF });
  sections.push({
    body: (opts.leadBody ?? '') + para(TXT[lang].chapter) + para(lang === 'ID' ? 'Lingkup' : 'Scope') + (opts.bodyExtra ?? ''),
    header: para('PT GEMILANG SATRIA PERKASA'),
    footer: registerFooter(lang),
  });
  sections.push({ body: para(lang === 'ID' ? 'Isi bab dua.' : 'Chapter two body.') });
  return DocxDocument.fromBytes(buildDocx({ sections }), { path: `nota_${lang}.docx` });
}

function pairFor(lang: Lang, tier: Tier = 'TERBIT', over: Partial<PairContext> = {}): PairContext {
  return {
    slug: lang === 'ID' ? 'datum-standar' : 'datum-standar-en',
    language: lang,
    tier,
    typeCode: 'STD',
    kicker: TXT[lang].kicker,
    producedBy: 'r08',
    agentRevisionText: false,
    hasCopyControl: false,
    ...over,
  };
}

function check(id: string, docx: DocxDocument, pair: PairContext): RuleResult {
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new Error(`aturan ${id} tidak ada di modul structure_a`);
  return rule.check({ docx, pair, layout: buildLayout(docx) });
}

const statusOf = (id: string, docx: DocxDocument, pair: PairContext) => check(id, docx, pair).status;

// ── Uji ───────────────────────────────────────────────────────────────────

const OWNED = [
  'CV-01', 'CV-02', 'CV-03', 'CV-04', 'CV-05', 'CV-06', 'CV-07', 'CV-08', 'CV-09', 'CV-10', 'CV-11', 'CV-12', 'CV-13', 'CV-16', 'CV-17', 'CV-18',
  'CS-01', 'CS-02', 'CS-03', 'CS-04', 'CS-07', 'CS-10',
  'TR-01', 'TR-02', 'TR-03', 'TR-04', 'TR-08',
];

describe('modul structure_a: kepemilikan dan indeks', () => {
  it('mengisi tepat 27 kode milik structure_a (S20 tabel pemilik) dan diterima penjaga indeks', () => {
    expect(rules.map((r) => r.id).sort()).toEqual([...OWNED].sort());
    const index = buildRuleIndex({ structure_a: rules, structure_b: [], language: [], clash: [] });
    expect(index.implemented.size).toBe(27);
  });
});

describe('DOCX baik lulus setiap aturan yang berlaku', () => {
  const index = buildRuleIndex({ structure_a: rules, structure_b: [], language: [], clash: [] });

  it.each(['ID', 'EN'] as const)('TERBIT %s: semua aturan structure_a yang berlaku = pass', (lang) => {
    const rep = runConformance({ docx: buildTerbit(lang), pair: pairFor(lang), index, implementedOnly: true });
    const mine = rep.outcomes.filter((o) => o.module === 'structure_a' && o.applicable);
    const expected = OWNED.filter((id) => id !== 'TR-02' && (lang === 'EN' || id !== 'TR-04'));
    expect(mine.map((o) => o.id).sort()).toEqual([...expected].sort());
    // CS-10 bersyarat: salinan induk tanpa nomor = na (research/32 §4).
    const notPass = mine.filter((o) => o.status !== 'pass' && !(o.id === 'CS-10' && o.status === 'na')).map((o) => `${o.id}: ${o.status} ${o.evidence} ${o.observed ?? ''}`);
    expect(notPass).toEqual([]);
    expect(mine.find((o) => o.id === 'CS-10')?.status).toBe('na');
  });

  it.each(['ID', 'EN'] as const)('SERAH %s: semua aturan structure_a yang berlaku = pass', (lang) => {
    const docx = buildTerbit(lang, { cover: { control: controlBlock(TXT[lang].controlRows.map((r) => r.map((c) => (c === 'TERBIT' ? 'SERAH' : c)))) } });
    const rep = runConformance({ docx, pair: pairFor(lang, 'SERAH'), index, implementedOnly: true });
    const bad = rep.outcomes.filter((o) => o.module === 'structure_a' && o.applicable && o.status !== 'pass').map((o) => `${o.id}:${o.status}`);
    expect(bad).toEqual(['CS-10:na']);
  });

  it.each(['ID', 'EN'] as const)('NOTA %s: hanya TR-02 berlaku dan lulus', (lang) => {
    const rep = runConformance({ docx: buildNota(lang), pair: pairFor(lang, 'NOTA'), index, implementedOnly: true });
    const mine = rep.outcomes.filter((o) => o.module === 'structure_a' && o.applicable);
    expect(mine.map((o) => [o.id, o.status])).toEqual([['TR-02', 'pass']]);
  });

  it('setiap hasil membawa bukti, dan hasil gagal membawa lokasi atau nilai teramati', () => {
    const docx = buildTerbit('ID', { cover: { title: para('Judul kecil', { sz: 40, font: COND }) } });
    const ok = check('CV-02', docx, pairFor('ID'));
    expect(ok.evidence.length).toBeGreaterThan(0);
    const bad = check('CV-09', docx, pairFor('ID'));
    expect(bad.status).toBe('fail');
    expect(bad.part).toBe('word/document.xml');
    expect(bad.location).toMatch(/seksi 0/);
    expect(bad.observed).toContain('40');
  });
});

describe('CV sampul §8.2', () => {
  const ID = pairFor('ID');

  it('CV-01: unsur keluar urutan (blok kendali sebelum judul) = fail', () => {
    const order: CoverKey[] = ['band', 'logo', 'address', 'rule', 'kicker', 'control', 'title', 'standfirst', 'scope', 'colophon', 'spine'];
    expect(statusOf('CV-01', buildTerbit('ID', { coverOrder: order }), ID)).toBe('fail');
  });

  it('CV-01/CV-06: Datum Rule hilang = fail keduanya (unsur wajib E5)', () => {
    const docx = buildTerbit('ID', { coverOrder: COVER_ORDER.filter((k) => k !== 'rule') });
    expect(statusOf('CV-01', docx, ID)).toBe('fail');
    expect(statusOf('CV-06', docx, ID)).toBe('fail');
  });

  it('CV-01: unsur opsional (kicker, standfirst, cakupan) boleh absen tanpa menggagalkan urutan', () => {
    const docx = buildTerbit('ID', { coverOrder: COVER_ORDER.filter((k) => !['kicker', 'standfirst', 'scope'].includes(k)) });
    expect(statusOf('CV-01', docx, ID)).toBe('pass');
  });

  it('CV-02: blok pertama sampul bukan pita segel = fail', () => {
    expect(statusOf('CV-02', buildTerbit('ID', { cover: { band: para('Pembuka') + band(TXT.ID.bandL, TXT.ID.bandR) } }), ID)).toBe('fail');
  });

  it('CV-03: logo 38,9 mm (1.400.000 EMU) = fail', () => {
    expect(statusOf('CV-03', buildTerbit('ID', { cover: { logo: drawingPara(1_400_000, 700_000, 'rIdLogo') } }), ID)).toBe('fail');
  });

  it('CV-04: logo juga di header interior = fail; logo kedua di interior = fail', () => {
    const inHeader = buildTerbit('ID', {
      interiorHeader: para('PT GEMILANG SATRIA PERKASA') + drawingPara(1_620_000, 850_000, 'rIdH'),
      headerRels: [imageRel('rIdH', 'media/logo.png')],
    });
    expect(statusOf('CV-04', inHeader, ID)).toBe('fail');
    const second = buildTerbit('ID', { interiorBody: para('BAB 1') + drawingPara(1_620_000, 850_000, 'rIdLogo') });
    expect(statusOf('CV-04', second, ID)).toBe('fail');
  });

  it('CV-05: baris alamat berubah atau 9 pt = fail', () => {
    expect(statusOf('CV-05', buildTerbit('ID', { cover: { address: para(ADDRESS.replace(' · Tel. (021) 22715320', ''), { sz: 14, font: COND }) } }), ID)).toBe('fail');
    expect(statusOf('CV-05', buildTerbit('ID', { cover: { address: para(ADDRESS, { sz: 18, font: COND }) } }), ID)).toBe('fail');
  });

  it('CV-07: kicker jenis lain, kicker tidak kapital, atau kicker pasangan kosong = fail; caps efektif = pass', () => {
    const kick = (t: string, caps: boolean) => para(t, { sz: 15, font: COND, color: '6E1420', spacing: 30, caps });
    expect(statusOf('CV-07', buildTerbit('ID', { cover: { kicker: kick('LAPORAN', false) } }), ID)).toBe('fail');
    expect(statusOf('CV-07', buildTerbit('ID', { cover: { kicker: kick('Standar', false) } }), ID)).toBe('fail');
    expect(statusOf('CV-07', buildTerbit('ID', { cover: { kicker: kick('Standar', true) } }), ID)).toBe('pass');
    expect(statusOf('CV-07', buildTerbit('ID'), pairFor('ID', 'TERBIT', { kicker: '' }))).toBe('fail');
  });

  it('CV-07 EN memakai kicker register EN: kicker ID di dokumen EN = fail', () => {
    expect(statusOf('CV-07', buildTerbit('EN', { cover: { kicker: para('STANDAR', { sz: 15, font: COND, color: '6E1420', spacing: 30 }) } }), pairFor('EN'))).toBe('fail');
  });

  it('CV-08: kicker hitam = fail; kicker absen = na', () => {
    expect(statusOf('CV-08', buildTerbit('ID', { cover: { kicker: para('STANDAR', { sz: 15, font: COND, color: '000000', spacing: 30 }) } }), ID)).toBe('fail');
    expect(statusOf('CV-08', buildTerbit('ID', { coverOrder: COVER_ORDER.filter((k) => k !== 'kicker') }), ID)).toBe('na');
  });

  it.each(['IBM Plex Sans Cond', 'IBM Plex Sans Condensed'])('CV-08: kicker bersalur wajah Cond "%s" = pass (alias D-602)', (face) => {
    const k = para('STANDAR', { sz: 15, font: face, color: '6E1420', spacing: 30, b: true, caps: true });
    expect(statusOf('CV-08', buildTerbit('ID', { cover: { kicker: k } }), ID)).toBe('pass');
  });

  it('CV-08: kicker berwajah Arial = fail walau ukuran, warna, dan spasi benar', () => {
    const k = para('STANDAR', { sz: 15, font: 'Arial', color: '6E1420', spacing: 30, b: true, caps: true });
    expect(statusOf('CV-08', buildTerbit('ID', { cover: { kicker: k } }), ID)).toBe('fail');
  });

  it('CV-09: judul 20 pt = fail', () => {
    expect(statusOf('CV-09', buildTerbit('ID', { cover: { title: para('Judul', { sz: 40, font: COND, b: true }) } }), ID)).toBe('fail');
  });

  it('CV-10: standfirst 12 pt = fail; standfirst absen = na', () => {
    expect(statusOf('CV-10', buildTerbit('ID', { cover: { standfirst: para('Ringkasan.', { sz: 24, font: SERIF, i: true }) } }), ID)).toBe('fail');
    expect(statusOf('CV-10', buildTerbit('ID', { cover: { standfirst: para('Ringkasan.', { sz: 21, font: SERIF }) } }), ID)).toBe('fail');
    expect(statusOf('CV-10', buildTerbit('ID', { coverOrder: COVER_ORDER.filter((k) => k !== 'standfirst') }), ID)).toBe('na');
  });

  it('CV-11: baris cakupan 10 pt = fail; absen = na', () => {
    expect(statusOf('CV-11', buildTerbit('ID', { cover: { scope: para('Cakupan', { sz: 20, font: COND }) } }), ID)).toBe('fail');
    expect(statusOf('CV-11', buildTerbit('ID', { coverOrder: COVER_ORDER.filter((k) => k !== 'scope') }), ID)).toBe('na');
  });

  it('CV-11: baris cakupan "IBM Plex Sans Cond" dikenali (bukan na palsu) dan lulus; Arial = fail', () => {
    expect(statusOf('CV-11', buildTerbit('ID', { cover: { scope: para('Cakupan', { sz: 15, font: 'IBM Plex Sans Cond' }) } }), ID)).toBe('pass');
    // Arial: bukan Cond, jadi tidak dikenali sebagai unsur E9 -> na (bukan pass).
    expect(statusOf('CV-11', buildTerbit('ID', { cover: { scope: para('Cakupan', { sz: 15, font: 'Arial' }) } }), ID)).not.toBe('pass');
  });

  it('CV-12: label berwajah "IBM Plex Sans Cond" = pass; Arial = fail', () => {
    const rows = TXT.ID.controlRows;
    expect(statusOf('CV-12', buildTerbit('ID', { cover: { control: controlBlock(rows, { labelFont: 'IBM Plex Sans Cond' }) } }), ID)).toBe('pass');
    expect(statusOf('CV-12', buildTerbit('ID', { cover: { control: controlBlock(rows, { labelFont: 'Arial' }) } }), ID)).toBe('fail');
  });

  it('CV-12: nilai berfon Seri, 5 baris, atau tanpa garis atas = fail', () => {
    const rows = TXT.ID.controlRows;
    expect(statusOf('CV-12', buildTerbit('ID', { cover: { control: controlBlock(rows, { valueFont: SERIF }) } }), ID)).toBe('fail');
    expect(statusOf('CV-12', buildTerbit('ID', { cover: { control: controlBlock([...rows, ['Dasar', 'x', '', ''], ['', '', '', '']]) } }), ID)).toBe('fail');
    expect(statusOf('CV-12', buildTerbit('ID', { cover: { control: controlBlock(rows, { topBorder: false }) } }), ID)).toBe('fail');
  });

  it('CV-13: Revisi sebelum Nomor dokumen = fail; Penyusun hilang = fail', () => {
    const swapped = [
      ['Revisi', 'A · 4 November 2026', 'Nomor dokumen', '001/GSP/STD/XI/2026'],
      ['Penyusun', 'Divisi Engineering PT GSP', 'Tier', 'TERBIT'],
    ];
    expect(statusOf('CV-13', buildTerbit('ID', { cover: { control: controlBlock(swapped) } }), ID)).toBe('fail');
    const noAuthor = [
      ['Nomor dokumen', '001/GSP/STD/XI/2026', 'Revisi', 'A · 4 November 2026'],
      ['Tier', 'TERBIT', 'Bahasa', 'Indonesia'],
    ];
    expect(statusOf('CV-13', buildTerbit('ID', { cover: { control: controlBlock(noAuthor) } }), ID)).toBe('fail');
  });

  it('CV-13: label dipetakan per bahasa pasangan; label EN di dokumen ID tidak terpetakan = fail', () => {
    expect(statusOf('CV-13', buildTerbit('ID', { cover: { control: controlBlock(TXT.EN.controlRows) } }), ID)).toBe('fail');
  });

  it('CV-16: kolofon kiri huruf campuran = fail', () => {
    const col = table([[cell(para('PT Gemilang Satria Perkasa · NIB 9120208940517')), cell(para(TXT.ID.stamp))]], [4706, 4705]);
    expect(statusOf('CV-16', buildTerbit('ID', { cover: { colophon: col } }), ID)).toBe('fail');
  });

  it('CV-17: string punggung tanpa kode bahasa = fail', () => {
    expect(statusOf('CV-17', buildTerbit('ID', { cover: { spine: para('STD · Standar uji · REV A · XI · 2026') } }), ID)).toBe('fail');
  });

  it('CV-18: margin kiri 30 mm, judul rata tengah, atau paragraf menjorok = fail', () => {
    const mar = '<w:pgMar w:top="1474" w:right="1134" w:bottom="1361" w:left="1701" w:header="737" w:footer="737" w:gutter="0"/>';
    expect(statusOf('CV-18', buildTerbit('ID', { coverPgMar: mar }), ID)).toBe('fail');
    expect(statusOf('CV-18', buildTerbit('ID', { cover: { title: para('Judul', { sz: 50, font: COND }, '<w:jc w:val="center"/>') } }), ID)).toBe('fail');
    expect(statusOf('CV-18', buildTerbit('ID', { cover: { address: para(ADDRESS, { sz: 14, font: COND }, '<w:ind w:left="567"/>') } }), ID)).toBe('fail');
  });
});

describe('CS lembar kendali', () => {
  it('CS-01: lembar kendali tanpa pita segel di depan = fail', () => {
    const body = controlSheetBody('ID').replace(band(TXT.ID.bandL, TXT.ID.bandR), '');
    expect(statusOf('CS-01', buildTerbit('ID', { controlSheet: body }), pairFor('ID'))).toBe('fail');
  });

  it('CS-02: kicker ID di dokumen EN = fail; judul bernomor = pass', () => {
    const enWithId = controlSheetBody('EN').replace(/Control Sheet/g, 'Lembar Kendali');
    expect(statusOf('CS-02', buildTerbit('EN', { controlSheet: enWithId }), pairFor('EN'))).toBe('fail');
    const numbered = controlSheetBody('ID').replace(`${para('Lembar Kendali')}${para(TXT.ID.blocks[0])}`, `${para('Lembar Kendali 001/GSP/STD/XI/2026')}${para(TXT.ID.blocks[0])}`);
    expect(numbered).not.toBe(controlSheetBody('ID'));
    expect(statusOf('CS-02', buildTerbit('ID', { controlSheet: numbered }), pairFor('ID'))).toBe('pass');
  });

  it('CS-03: blok tertukar, huruf melompat, atau judul berbahasa lain = fail', () => {
    const x = TXT.ID;
    const swapped = controlSheetBody('ID').replace(para(x.blocks[0]), para('A · Rantai verifikasi')).replace(para(x.blocks[1]), para('B · Riwayat revisi'));
    expect(statusOf('CS-03', buildTerbit('ID', { controlSheet: swapped }), pairFor('ID'))).toBe('fail');
    const skip = controlSheetBody('ID').replace(para(x.blocks[1]), para('C · Rantai verifikasi'));
    expect(statusOf('CS-03', buildTerbit('ID', { controlSheet: skip }), pairFor('ID'))).toBe('fail');
    const english = controlSheetBody('ID').replace(para(x.blocks[0]), para('A · Revision history'));
    expect(statusOf('CS-03', buildTerbit('ID', { controlSheet: english }), pairFor('ID'))).toBe('fail');
  });

  it('CS-04: kepala kolom EN "Author" (bukan "Prepared by") = fail; ID "Penyusun" (bukan "Oleh") = fail', () => {
    const en = controlSheetBody('EN').replace(textTable([[...TXT.EN.rev], ['A', '2026-11-04', 'First issue', 'A. Pratama']]), textTable([['Rev', 'Date', 'Change', 'Author'], ['A', '2026-11-04', 'First issue', 'A. Pratama']]));
    expect(en).not.toBe(controlSheetBody('EN'));
    expect(statusOf('CS-04', buildTerbit('EN', { controlSheet: en }), pairFor('EN'))).toBe('fail');
    const id = controlSheetBody('ID').replace(textTable([[...TXT.ID.rev], ['A', '2026-11-04', 'Terbit pertama', 'A. Pratama']]), textTable([['Rev', 'Tanggal', 'Uraian', 'Penyusun'], ['A', '2026-11-04', 'Terbit pertama', 'A. Pratama']]));
    expect(statusOf('CS-04', buildTerbit('ID', { controlSheet: id }), pairFor('ID'))).toBe('fail');
  });

  it('CS-04 (C25): bentuk manual ID:29/39/58 dan EN:29/38/62 = pass; bentuk mesin tetap pass', () => {
    for (const lang of ['ID', 'EN'] as const) {
      expect(statusOf('CS-04', buildTerbit(lang, { controlSheet: manualControlSheetBody(lang) }), pairFor(lang))).toBe('pass');
      expect(statusOf('CS-04', buildTerbit(lang), pairFor(lang))).toBe('pass');
    }
  });

  it('CS-04 (C25): bentuk manual rusak, bercampur dengan bentuk mesin, atau berbahasa lain = fail', () => {
    // Kolom PERUBAHAN diganti kepala mesin "Uraian": bukan daftar manual ID:29 maupun daftar mesin.
    const broken = manualControlSheetBody('ID', { rev: ['Rev', 'Tanggal', 'Penyusun', 'Uraian', 'Status'] });
    expect(statusOf('CS-04', buildTerbit('ID', { controlSheet: broken }), pairFor('ID'))).toBe('fail');
    // Satu parameter bentuk (controlSheet.columns.form) untuk ketiga tabel: revisi manual + rantai mesin = fail.
    const mixed = manualControlSheetBody('EN', { ver: [...TXT.EN.ver] });
    const r = check('CS-04', buildTerbit('EN', { controlSheet: mixed }), pairFor('EN'));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/verification/);
    // Kepala manual ID di dokumen EN.
    const foreign = manualControlSheetBody('EN', { rev: [...MANUAL.ID.rev] });
    expect(statusOf('CS-04', buildTerbit('EN', { controlSheet: foreign }), pairFor('EN'))).toBe('fail');
    // Distribusi manual tanpa kolom KEMBALI (EN:62).
    const short = manualControlSheetBody('EN', { dist: ['Copy', 'Holder', 'Medium'] });
    expect(statusOf('CS-04', buildTerbit('EN', { controlSheet: short }), pairFor('EN'))).toBe('fail');
  });

  it('CS-04 (C25): DOCX bentuk manual lulus seluruh aturan structure_a yang berlaku (CS-07, CS-10 membaca kolom yang sama)', () => {
    const index = buildRuleIndex({ structure_a: rules, structure_b: [], language: [], clash: [] });
    for (const lang of ['ID', 'EN'] as const) {
      const rep = runConformance({ docx: buildTerbit(lang, { controlSheet: manualControlSheetBody(lang) }), pair: pairFor(lang), index, implementedOnly: true });
      const bad = rep.outcomes.filter((o) => o.module === 'structure_a' && o.applicable && o.status !== 'pass').map((o) => `${o.id}:${o.status}`);
      expect(bad).toEqual(['CS-10:na']);
      const held = buildTerbit(lang, {
        controlSheet: manualControlSheetBody(lang, { bandR: lang === 'ID' ? 'SALINAN 2 · PENGGUNAAN INTERNAL GSP' : 'COPY 2 · GSP INTERNAL USE', distRows: [['2', 'Kepala Gardu', '', '']] }),
      });
      expect(statusOf('CS-10', held, pairFor(lang, 'TERBIT', { hasCopyControl: true }))).toBe('pass');
    }
  });

  it('CS-07: riwayat revisi tanpa baris data = fail', () => {
    const body = controlSheetBody('ID').replace(textTable([[...TXT.ID.rev], ['A', '2026-11-04', 'Terbit pertama', 'A. Pratama']]), textTable([[...TXT.ID.rev]]));
    expect(statusOf('CS-07', buildTerbit('ID', { controlSheet: body }), pairFor('ID'))).toBe('fail');
  });

  it('CS-10: salinan induk tanpa nomor = na; SALINAN 2 tanpa pemegang = fail; dengan pemegang = pass', () => {
    expect(statusOf('CS-10', buildTerbit('ID'), pairFor('ID'))).toBe('na');
    const missing = buildTerbit('ID', { controlSheet: controlSheetBody('ID', { bandR: 'SALINAN 2 · PENGGUNAAN INTERNAL GSP' }) });
    expect(statusOf('CS-10', missing, pairFor('ID', 'TERBIT', { hasCopyControl: true }))).toBe('fail');
    const held = buildTerbit('ID', { controlSheet: controlSheetBody('ID', { bandR: 'SALINAN 2 · PENGGUNAAN INTERNAL GSP', distRows: [['1', 'Manajer Aset'], ['2', 'Kepala Gardu']] }) });
    expect(statusOf('CS-10', held, pairFor('ID', 'TERBIT', { hasCopyControl: true }))).toBe('pass');
  });
});

describe('TR perilaku tier', () => {
  it('TR-01: tier sampul SERAH untuk pasangan TERBIT = fail', () => {
    expect(statusOf('TR-01', buildTerbit('ID'), pairFor('ID', 'SERAH'))).toBe('fail');
  });

  it('TR-01: blok kendali tanpa medan tier: MCP = na, R08 = fail', () => {
    const rows = [
      ['Nomor dokumen', '001/GSP/STD/XI/2026', 'Revisi', 'A · 4 November 2026'],
      ['Penyusun', 'Divisi Engineering PT GSP', 'Klasifikasi', 'TERBATAS'],
    ];
    const docx = buildTerbit('ID', { cover: { control: controlBlock(rows) } });
    expect(statusOf('TR-01', docx, pairFor('ID', 'TERBIT', { producedBy: 'mcp' }))).toBe('na');
    expect(statusOf('TR-01', docx, pairFor('ID', 'TERBIT', { producedBy: 'r08' }))).toBe('fail');
  });

  it('TR-02: NOTA dengan sampul (pita segel) = fail', () => {
    expect(statusOf('TR-02', buildNota('ID', { leadBody: band(TXT.ID.bandL, TXT.ID.bandR) }), pairFor('ID', 'NOTA'))).toBe('fail');
  });

  it('TR-02: NOTA dengan medan TOC, kicker lembar kendali, atau blok tanda tangan = fail', () => {
    const n = pairFor('ID', 'NOTA');
    expect(statusOf('TR-02', buildNota('ID', { bodyExtra: tocField() }), n)).toBe('fail');
    expect(statusOf('TR-02', buildNota('ID', { bodyExtra: para('Lembar Kendali') }), n)).toBe('fail');
    expect(statusOf('TR-02', buildNota('ID', { bodyExtra: textTable([[...TXT.ID.sig], ['', '', ''], ['A', 'B', 'C']]) }), n)).toBe('fail');
  });

  it('TR-02: NOTA yang seksi pertamanya bukan interior = fail', () => {
    expect(statusOf('TR-02', buildNota('EN', { leadWrapper: true }), pairFor('EN', 'NOTA'))).toBe('fail');
  });

  it('TR-03: tanpa daftar isi, tanpa tanda tangan, atau lembar kendali sebelum sampul = fail', () => {
    const ID = pairFor('ID');
    expect(statusOf('TR-03', buildTerbit('ID', { toc: null }), ID)).toBe('fail');
    const noSig = controlSheetBody('ID').replace(textTable([[...TXT.ID.sig], ['', '', ''], ['A. Pratama', 'B. Santoso', 'C. Wibowo']]), '');
    expect(noSig).not.toBe(controlSheetBody('ID'));
    expect(statusOf('TR-03', buildTerbit('ID', { controlSheet: noSig }), ID)).toBe('fail');
    expect(statusOf('TR-03', buildTerbit('ID', { wrapperOrder: ['controlSheet', 'cover', 'toc'] }), ID)).toBe('fail');
  });

  it('TR-04: nilai tier EN "ISSUED" = fail', () => {
    const rows = TXT.EN.controlRows.map((r) => r.map((c) => (c === 'TERBIT' ? 'ISSUED' : c)));
    expect(statusOf('TR-04', buildTerbit('EN', { cover: { control: controlBlock(rows) } }), pairFor('EN'))).toBe('fail');
  });

  it('TR-08: TOC hanya tingkat 1 = fail; tanpa medan TOC = fail', () => {
    expect(statusOf('TR-08', buildTerbit('ID', { toc: tocBody('ID', '1-1') }), pairFor('ID'))).toBe('fail');
    expect(statusOf('TR-08', buildTerbit('ID', { toc: band(TXT.ID.bandL, TXT.ID.bandR) + para('Daftar Isi') }), pairFor('ID'))).toBe('fail');
  });
});
