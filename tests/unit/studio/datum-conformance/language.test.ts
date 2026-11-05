/**
 * S23: modul aturan bahasa dan angka (research/32 §2 CR-2..CR-4, §8 NU, §10 NC-04, §11 AC6-03,
 * §12 LB, §13 X-01..X-05). Seam: `rules` dari `rules/language.ts`, dijalankan lewat
 * `runConformance` dengan indeks yang hanya memuat modul ini (bukan `defaultRuleIndex`).
 *
 * Sampel sintetis meniru bentuk keluaran mesin Studio (baseline S05 dan register research/31);
 * nilai harapan diambil dari register, bukan dari kode modul.
 */
import { describe, expect, it } from 'vitest';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { runConformance, type ConformanceReport } from '../../../../benchmark/datum_conformance/lib/score';
import { buildRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import { LANGUAGE_EXPECTATIONS } from '../../../../benchmark/datum_conformance/rules/expect_language';
import { STRUCTURE_A_EXPECT } from '../../../../benchmark/datum_conformance/rules/expect_structure_a';
import { rules } from '../../../../benchmark/datum_conformance/rules/language';
import type { Lang, PairContext, Tier } from '../../../../benchmark/datum_conformance/rules/types';
import { buildDocx, p, tbl } from './_docx_kit';

const INDEX = buildRuleIndex({ structure_a: [], structure_b: [], language: rules, clash: [] });
const SEAL = '<w:shd w:val="clear" w:color="auto" w:fill="6E1420"/>';
const CAPS = '<w:caps/><w:b/>';
const NB = '\u00A0';

interface Texts {
  seal: [string, string];
  kicker: string;
  labels: { number: string; rev: string; author: string; tier: string; lang: string };
  langValue: string;
  revValue: string;
  stamp: string;
  spine: string;
  csKicker: string;
  blocks: [string, string];
  revHead: string[];
  firstIssue: string;
  verHead: string[];
  role: string;
  sign: string;
  toc: string;
  tocEntry: string;
  chapterKicker: string;
  head: string;
  reg: [string, string, string, string];
  caption: string;
  source: string;
  money: string;
}

const ID_TEXTS: Texts = {
  seal: ['KLASIFIKASI · TERBATAS', 'SALINAN INDUK · PENGGUNAAN INTERNAL GSP'],
  kicker: 'STANDAR',
  labels: { number: 'Nomor dokumen', rev: 'Revisi', author: 'Penyusun', tier: 'Tier', lang: 'Bahasa' },
  langValue: 'Indonesia',
  revValue: 'A · 4 Desember 2026',
  stamp: '// 20261204 ID T -- TERBITAN 1',
  spine: 'STD · Pengelolaan aset · ID · REV A · XII · 2026',
  csKicker: 'Lembar Kendali',
  blocks: ['A · Riwayat revisi', 'B · Rantai verifikasi'],
  revHead: ['Rev', 'Tanggal', 'Uraian', 'Oleh'],
  firstIssue: 'Terbit pertama',
  verHead: ['Lapis', 'Peran', 'Nama', 'Tanggal'],
  role: 'Penyusun',
  sign: 'Disusun',
  toc: 'Daftar Isi',
  tocEntry: 'Bab 1\tLingkup\t',
  chapterKicker: 'Bab 1',
  head: 'PT Gemilang Satria Perkasa · Pengelolaan aset · Bab 1 · Lingkup',
  reg: [`GSP${NB}·${NB}017/GSP/STD/XII/2026`, `REV${NB}A${NB}·${NB}04-XII-2026`, `LEMBAR${NB}{P}${NB}DARI${NB}{N}`, 'TERBATAS'],
  caption: 'Tabel 1.1   ',
  source: 'SUMBER',
  money: 'Rp 1.250.000,50',
};

const EN_TEXTS: Texts = {
  seal: ['CLASSIFICATION · TERBATAS', 'MASTER COPY · GSP INTERNAL USE'],
  kicker: 'STANDARD',
  labels: { number: 'Document number', rev: 'Revision', author: 'Prepared by', tier: 'Tier', lang: 'Language' },
  langValue: 'English',
  revValue: 'A · 4 December 2026',
  stamp: '// 20261204 EN T -- ISSUE 1',
  spine: 'STD · Asset management · EN · REV A · XII · 2026',
  csKicker: 'Control Sheet',
  blocks: ['A · Revision history', 'B · Verification chain'],
  revHead: ['Rev', 'Date', 'Change', 'Prepared by'],
  firstIssue: 'First issue',
  verHead: ['Layer', 'Role', 'Name', 'Date'],
  role: 'Prepared by',
  sign: 'Prepared by',
  toc: 'Contents',
  tocEntry: 'Chapter 1\tScope\t',
  chapterKicker: 'Chapter 1',
  head: 'PT Gemilang Satria Perkasa · Asset management · Chapter 1 · Scope',
  reg: [`GSP${NB}·${NB}017/GSP/STD/XII/2026`, `REV${NB}A${NB}·${NB}04-XII-2026`, `SHEET${NB}{P}${NB}OF${NB}{N}`, 'TERBATAS'],
  caption: 'Table 1.1   ',
  source: 'SOURCE',
  money: 'IDR 1,250,000.50',
};

const TEXTS: Record<Lang, Texts> = { ID: ID_TEXTS, EN: EN_TEXTS };

function capsP(text: string): string {
  return p(text, CAPS);
}

/** Sel register; `{P}`/`{N}` menjadi medan PAGE/NUMPAGES. */
function regCell(text: string): string {
  const runs = text
    .split(/(\{P\}|\{N\})/)
    .filter((s) => s !== '')
    .map((s) =>
      s === '{P}'
        ? '<w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple>'
        : s === '{N}'
          ? '<w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>1</w:t></w:r></w:fldSimple>'
          : `<w:r><w:t xml:space="preserve">${s}</w:t></w:r>`,
    )
    .join('');
  return `<w:tc><w:p>${runs}</w:p></w:tc>`;
}

function registerFooter(cells: readonly string[]): string {
  return `<w:tbl><w:tblPr/><w:tblGrid>${cells.map(() => '<w:gridCol w:w="2350"/>').join('')}</w:tblGrid><w:tr>${cells.map(regCell).join('')}</w:tr></w:tbl><w:p/>`;
}

interface SampleOptions {
  tier?: Tier;
  /** Penimpaan teks per kunci (bentuk sumber). */
  over?: Partial<Texts>;
  /** C25: baris data riwayat revisi dan rantai verifikasi (bawaan = bentuk mesin). */
  revRow?: string[];
  verRow?: string[];
}

function sample(lang: Lang, opts: SampleOptions = {}): DocxDocument {
  const t: Texts = { ...TEXTS[lang], ...opts.over };
  const tier = opts.tier ?? 'TERBIT';
  const interior = {
    header: p(t.head.replace(/$/, '\tTERBATAS')),
    footer: registerFooter(t.reg),
    body:
      capsP(t.chapterKicker) +
      p('Lingkup') +
      p(`Biaya total ${t.money} sesuai pagu.`) +
      `<w:p><w:r><w:rPr>${CAPS}</w:rPr><w:t xml:space="preserve">${t.caption}</w:t></w:r><w:r><w:t>Rincian biaya</w:t></w:r></w:p>` +
      tbl([
        ['Butir', 'Biaya'],
        ['Material', t.money],
      ]) +
      `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${t.source}</w:t></w:r><w:r><w:t xml:space="preserve"> RAB 2026.</w:t></w:r></w:p>`,
  };
  if (tier === 'NOTA') return DocxDocument.fromBytes(buildDocx({ sections: [interior] }), { path: `${lang}-nota.docx` });
  const sealBand = tbl([t.seal], '', SEAL);
  const cover = {
    header: '',
    footer: '',
    body:
      sealBand +
      p('Divisi Engineering &amp; Technical Intelligence · Jl. Bangka Raya No. 27, Pela Mampang, Jakarta Selatan 12720 · Tel. (021) 22715320') +
      capsP(t.kicker) +
      p('Judul', '<w:sz w:val="50"/>') +
      tbl([
        [t.labels.number, '017/GSP/STD/XII/2026', t.labels.rev, t.revValue],
        [t.labels.author, 'Tim GSP', t.labels.tier, tier],
        [t.labels.lang, t.langValue, '', ''],
      ]) +
      tbl([['PT GEMILANG SATRIA PERKASA · NIB 9120208940517', t.stamp]]) +
      capsP(t.spine),
  };
  const control = {
    header: '',
    footer: '',
    body:
      sealBand +
      capsP(t.csKicker) +
      p(t.csKicker) +
      p(t.blocks[0]) +
      tbl([t.revHead, opts.revRow ?? ['A', '2026-12-04', t.firstIssue, 'Tim GSP']]) +
      p(t.blocks[1]) +
      tbl([t.verHead, opts.verRow ?? ['1', t.role, 'A. Pratama', '']]) +
      tbl([[t.sign], [''], ['A. Pratama']]),
  };
  const toc = {
    header: '',
    footer: '',
    body: sealBand + capsP(t.toc) + '<w:p><w:fldSimple w:instr="TOC \\o &quot;1-2&quot; \\h \\z \\u"><w:r><w:t>x</w:t></w:r></w:fldSimple></w:p>' + p(t.tocEntry),
  };
  return DocxDocument.fromBytes(buildDocx({ sections: [cover, control, toc, interior] }), { path: `${lang}.docx` });
}

function bfix(lang: Lang, over?: string[]): DocxDocument {
  const values = over ?? (lang === 'ID' ? ['1.250.000,5', 'Rp 1.385.946.000', '25 %', '0,5'] : ['1,250,000.5', 'IDR 1,385,946,000', '25 %', '0.5']);
  return DocxDocument.fromBytes(
    buildDocx({ sections: [{ body: tbl([['fx.decimal', 'fx.money', 'fx.pct', 'fx.small'], values]) }] }),
    { path: `bfix-${lang}.docx` },
  );
}

const SPEC_CODES = ['PT', 'KT', 'RAB', 'SPH', 'SP', 'BA', 'NDA', 'DEK', 'LAP', 'MAT', 'STD', 'NOT', 'MOD', 'VER'];

function spec(lang: Lang, over: Record<string, unknown> = {}): unknown {
  const slug = lang === 'ID' ? 'datum-standar' : 'datum-standar-en';
  return {
    schema: 'datum-template-spec/v1',
    templates: [
      {
        slug,
        params: {
          'doc.typeCode': SPEC_CODES,
          'doc.defaultTypeCode': 'STD',
          'doc.defaultTier': 'TERBIT',
          'doc.language': lang,
          'cover.kicker.text': lang === 'ID' ? 'STANDAR' : 'STANDARD',
          ...over,
        },
      },
    ],
  };
}

function pair(lang: Lang, over: Partial<PairContext> = {}): PairContext {
  return {
    slug: lang === 'ID' ? 'datum-standar' : 'datum-standar-en',
    language: lang,
    tier: 'TERBIT',
    typeCode: 'STD',
    kicker: lang === 'ID' ? 'STANDAR' : 'STANDARD',
    producedBy: 'mcp',
    agentRevisionText: false,
    hasCopyControl: false,
    ...over,
  };
}

interface RunOpts {
  pair?: Partial<PairContext>;
  bfix?: DocxDocument | null;
  spec?: unknown;
}

function run(doc: DocxDocument, lang: Lang, o: RunOpts = {}): ConformanceReport {
  return runConformance({
    docx: doc,
    pair: pair(lang, o.pair),
    index: INDEX,
    implementedOnly: true,
    bfix: o.bfix === null ? undefined : (o.bfix ?? bfix(lang)),
    spec: 'spec' in o ? o.spec : spec(lang),
    generatedAt: '2026-11-04T00:00:00.000Z',
  });
}

function status(r: ConformanceReport, id: string): string {
  const o = r.outcomes.find((x) => x.id === id);
  if (!o) throw new Error(`hasil ${id} tidak ada`);
  return o.status;
}

function outcome(r: ConformanceReport, id: string) {
  return r.outcomes.find((x) => x.id === id)!;
}

describe('modul language: pendaftaran', () => {
  it('memuat semua kode milik modul language di katalog', () => {
    expect(rules.map((r) => r.id).sort()).toEqual(
      [
        'AC6-03', 'CR-2', 'CR-3', 'CR-4', 'LB-01', 'LB-02', 'LB-03', 'LB-06', 'LB-09', 'LB-10', 'LB-11',
        'NC-04', 'NU-02', 'NU-03', 'NU-05', 'NU-07', 'X-01', 'X-02', 'X-03', 'X-04', 'X-05',
      ].sort(),
    );
  });
});

describe('dokumen baik lolos', () => {
  for (const lang of ['ID', 'EN'] as const) {
    it(`TERBIT ${lang}: semua aturan bahasa PASS, gerbang kritis bahasa lulus, 0 bentrok X`, () => {
      const r = run(sample(lang), lang);
      const bad = r.outcomes.filter((o) => o.module === 'language' && o.applicable && o.status !== 'pass');
      expect(bad.map((o) => `${o.id}: ${o.status} ${o.evidence}`)).toEqual([]);
      expect(r.clash.xFailures).toEqual([]);
      expect(r.clash.xUnverified).toEqual([]);
      expect(r.critical.failed.filter((c) => c !== 'CR-1')).toEqual([]);
    });

    it(`NOTA ${lang}: aturan NOTA yang berlaku PASS`, () => {
      const r = run(sample(lang, { tier: 'NOTA' }), lang, { pair: { tier: 'NOTA' }, spec: spec(lang, { 'doc.defaultTier': 'NOTA' }) });
      const bad = r.outcomes.filter((o) => o.module === 'language' && o.applicable && o.status !== 'pass');
      expect(bad.map((o) => `${o.id}: ${o.status} ${o.evidence}`)).toEqual([]);
    });
  }
});

describe('CR-4 bahasa teks pembungkus (kritis)', () => {
  it('DOCX EN berlabel ID gagal CR-4, gagal gerbang kritis, dan skor turun', () => {
    const good = run(sample('EN'), 'EN');
    const bad = run(
      sample('EN', {
        over: {
          labels: { ...EN_TEXTS.labels, author: 'Penyusun' },
          csKicker: 'Lembar Kendali',
          reg: [EN_TEXTS.reg[0], EN_TEXTS.reg[1], `LEMBAR${NB}{P}${NB}DARI${NB}{N}`, 'TERBATAS'],
        },
      }),
      'EN',
    );
    expect(status(bad, 'CR-4')).toBe('fail');
    expect(outcome(bad, 'CR-4').evidence).toMatch(/Penyusun/);
    expect(outcome(bad, 'CR-4').evidence).toMatch(/LEMBAR/);
    expect(bad.critical.ok).toBe(false);
    expect(bad.critical.failed).toContain('CR-4');
    expect(bad.verdict).toBe('FAIL');
    expect(bad.score.passed).toBeLessThan(good.score.passed);
  });

  it('EN dengan label aparatus ID (Tabel, SUMBER) gagal CR-4, AC6-03, dan LB-09 (D-598 F-2)', () => {
    const r = run(sample('EN', { over: { caption: 'Tabel 1.1   ', source: 'SUMBER' } }), 'EN');
    expect(status(r, 'CR-4')).toBe('fail');
    expect(outcome(r, 'CR-4').evidence).toMatch(/Tabel|SUMBER/);
    expect(status(r, 'AC6-03')).toBe('fail');
    expect(status(r, 'LB-09')).toBe('fail');
  });

  it('EN dengan Rp di isi gagal CR-4 (daftar inti berlaku di seluruh teks)', () => {
    const r = run(sample('EN', { over: { money: 'Rp 1,250,000.50' } }), 'EN');
    expect(status(r, 'CR-4')).toBe('fail');
    expect(outcome(r, 'CR-4').evidence).toMatch(/Rp/);
  });

  it('EN tanpa penanda wajib (cap terbit TERBITAN) gagal CR-4', () => {
    const r = run(sample('EN', { over: { stamp: '// 20261204 EN T -- TERBITAN 1' } }), 'EN');
    expect(status(r, 'CR-4')).toBe('fail');
  });

  it('ID dengan token cermin EN di pembungkus (kicker Contents) gagal CR-4', () => {
    const r = run(sample('ID', { over: { toc: 'Contents' } }), 'ID');
    expect(status(r, 'CR-4')).toBe('fail');
    expect(outcome(r, 'CR-4').evidence).toMatch(/Contents/);
  });

  it('ID: kata Inggris di isi agen (bukan pembungkus) tidak menggagalkan CR-4', () => {
    const r = run(sample('ID', { over: { money: 'Rp 1.250.000,50 (Contents of the annex)' } }), 'ID');
    expect(status(r, 'CR-4')).toBe('pass');
  });
});

describe('CR-2 pola nomor dokumen (kritis)', () => {
  const withNumber = (lang: Lang, n: string) =>
    sample(lang, { over: { reg: [`GSP${NB}·${NB}${n}`, TEXTS[lang].reg[1], TEXTS[lang].reg[2], 'TERBATAS'] } });

  it('kode jenis DS gagal CR-2', () => {
    const r = run(withNumber('ID', '017/GSP/DS/XII/2026'), 'ID');
    expect(status(r, 'CR-2')).toBe('fail');
    expect(outcome(r, 'CR-2').evidence).toMatch(/DS/);
    expect(r.critical.failed).toContain('CR-2');
  });

  it('awalan klasifikasi R/ gagal CR-2', () => {
    const r = run(withNumber('ID', 'R/017/GSP/STD/XII/2026'), 'ID');
    expect(status(r, 'CR-2')).toBe('fail');
  });

  it('kode sah tetapi bukan kode pasangan gagal CR-2 dan NU-02', () => {
    const r = run(withNumber('ID', '017/GSP/LAP/XII/2026'), 'ID');
    expect(status(r, 'CR-2')).toBe('fail');
    expect(status(r, 'NU-02')).toBe('fail');
  });

  it('NDA dan XXX sah', () => {
    const r = run(withNumber('ID', 'XXX/GSP/NDA/XII/2026'), 'ID', { pair: { typeCode: 'NDA' } });
    expect(outcome(r, 'CR-2').evidence).not.toMatch(/tidak cocok pola/);
  });
});

describe('CR-3 konvensi angka (kritis)', () => {
  it('B-FIX EN berpemisah ID gagal CR-3', () => {
    const r = run(sample('EN'), 'EN', { bfix: bfix('EN', ['1.250.000,5', 'IDR 1,385,946,000', '25 %', '0.5']) });
    expect(status(r, 'CR-3')).toBe('fail');
    expect(outcome(r, 'CR-3').evidence).toMatch(/1,250,000\.5|1\.250\.000,5/);
  });

  it('B-FIX ID berpemisah EN gagal CR-3', () => {
    const r = run(sample('ID'), 'ID', { bfix: bfix('ID', ['1,250,000.5', 'Rp 1.385.946.000', '25 %', '0,5']) });
    expect(status(r, 'CR-3')).toBe('fail');
  });

  it('tanpa B-FIX: UNEXERCISED, dihitung gagal kritis oleh harness', () => {
    const r = run(sample('ID'), 'ID', { bfix: null });
    const o = outcome(r, 'CR-3');
    expect(o.rawStatus).toBe('unexercised');
    expect(o.status).toBe('fail');
  });

  it('sampel EN dengan angka berkonvensi ID gagal CR-3 walau B-FIX benar', () => {
    const r = run(sample('EN', { over: { money: 'IDR 1.250.000,50' } }), 'EN');
    expect(status(r, 'CR-3')).toBe('fail');
  });

  it('sampel ID dengan Rp menempel gagal CR-3', () => {
    const r = run(sample('ID', { over: { money: 'Rp1.250.000,50' } }), 'ID');
    expect(status(r, 'CR-3')).toBe('fail');
  });
});

describe('NU: penomoran', () => {
  it('NU-03 tanpa --spec: UNEXERCISED', () => {
    const r = run(sample('ID'), 'ID', { spec: undefined });
    expect(status(r, 'NU-03')).toBe('unexercised');
  });

  it('NU-03: spec dengan DS atau tanpa NDA gagal', () => {
    const withDs = run(sample('ID'), 'ID', { spec: spec('ID', { 'doc.typeCode': ['KT', 'PT', 'RAB', 'SPH', 'SP', 'BA', 'DS', 'STD'] }) });
    expect(status(withDs, 'NU-03')).toBe('fail');
    expect(outcome(withDs, 'NU-03').evidence).toMatch(/DS/);
  });

  it('NU-03: baris spec untuk slug pasangan tidak ada = gagal', () => {
    const r = run(sample('ID'), 'ID', { spec: { schema: 'datum-template-spec/v1', templates: [] } });
    expect(status(r, 'NU-03')).toBe('fail');
  });

  it('NU-03: kicker atau bahasa spec menyimpang dari pasangan = gagal', () => {
    const r = run(sample('EN'), 'EN', { spec: spec('EN', { 'doc.language': 'ID' }) });
    expect(status(r, 'NU-03')).toBe('fail');
  });

  it('NU-02: kode string punggung berbeda dari kode nomor gagal, dan dilaporkan bentrok X-02', () => {
    const r = run(sample('ID', { over: { spine: 'LAP · Pengelolaan aset · ID · REV A · XII · 2026' } }), 'ID');
    expect(status(r, 'NU-02')).toBe('fail');
    expect(status(r, 'X-02')).toBe('fail');
    expect(r.clash.xFailures).toContain('X-02');
  });

  it('NU-05: revisi berdesimal gagal', () => {
    const r = run(sample('ID', { over: { reg: [ID_TEXTS.reg[0], `REV${NB}1.1${NB}·${NB}04-XII-2026`, ID_TEXTS.reg[2], 'TERBATAS'] } }), 'ID');
    expect(status(r, 'NU-05')).toBe('fail');
  });

  it('NU-07: bulan nomor berbeda dari tanggal register gagal', () => {
    const r = run(sample('ID', { over: { reg: [ID_TEXTS.reg[0], `REV${NB}A${NB}·${NB}04-XI-2026`, ID_TEXTS.reg[2], 'TERBATAS'] } }), 'ID');
    expect(status(r, 'NU-07')).toBe('fail');
  });
});

describe('NC-04 dan label bahasa', () => {
  it('NC-04: nama bulan ID di dokumen EN gagal', () => {
    const r = run(sample('EN', { over: { revValue: 'A · 4 Desember 2026' } }), 'EN');
    expect(status(r, 'NC-04')).toBe('fail');
  });

  it('LB-01: label Author (EN lama) gagal', () => {
    const r = run(sample('EN', { over: { labels: { ...EN_TEXTS.labels, author: 'Author' } } }), 'EN');
    expect(status(r, 'LB-01')).toBe('fail');
  });

  it('LB-02: judul daftar isi bahasa lain gagal', () => {
    const r = run(sample('EN', { over: { toc: 'Daftar Isi' } }), 'EN');
    expect(status(r, 'LB-02')).toBe('fail');
  });

  it('LB-03: kicker bab BAB di dokumen EN gagal; tanpa kicker bab = NA', () => {
    expect(status(run(sample('EN', { over: { chapterKicker: 'Bab 1' } }), 'EN'), 'LB-03')).toBe('fail');
    expect(status(run(sample('ID', { over: { chapterKicker: '' } }), 'ID'), 'LB-03')).toBe('na');
  });

  it('LB-03 (G-FIX1, D-606 LB-08): kicker lampiran ANNEX di dokumen EN lulus (EN:223-247); APPENDIX tetap lulus; LAMPIRAN di EN dan ANNEX di ID gagal', () => {
    expect(status(run(sample('EN', { over: { chapterKicker: 'Annex A' } }), 'EN'), 'LB-03')).toBe('pass');
    expect(status(run(sample('EN', { over: { chapterKicker: 'Appendix A' } }), 'EN'), 'LB-03')).toBe('pass');
    expect(status(run(sample('EN', { over: { chapterKicker: 'Lampiran A' } }), 'EN'), 'LB-03')).toBe('fail');
    expect(status(run(sample('ID', { over: { chapterKicker: 'Annex A' } }), 'ID'), 'LB-03')).toBe('fail');
  });

  it('LB-06: peran tanda tangan EN lama (Prepared) gagal; sampel r08 = NA', () => {
    expect(status(run(sample('EN', { over: { sign: 'Prepared' } }), 'EN'), 'LB-06')).toBe('fail');
    expect(status(run(sample('EN'), 'EN', { pair: { producedBy: 'r08' } }), 'LB-06')).toBe('na');
  });

  it('LB-10: catatan revisi ID di dokumen EN gagal; teks revisi agen = NA', () => {
    expect(status(run(sample('EN', { over: { firstIssue: 'Terbit pertama' } }), 'EN'), 'LB-10')).toBe('fail');
    expect(status(run(sample('EN'), 'EN', { pair: { agentRevisionText: true } }), 'LB-10')).toBe('na');
  });

  it('LB-11: peran rantai verifikasi ID di dokumen EN gagal', () => {
    expect(status(run(sample('EN', { over: { role: 'Penyusun' } }), 'EN'), 'LB-11')).toBe('fail');
  });
});

/**
 * C25 (D-635 (5)): lembar kendali bentuk manual. Riwayat revisi REV/TANGGAL/PENYUSUN/PERUBAHAN/STATUS (`ID:29`)
 * dan REV/DATE/PREPARED BY/CHANGE/STATUS (`EN:29`): catatan revisi di kolom ke-4. Rantai verifikasi
 * LAPIS/METODE/OBJEK/HASIL (`ID:39`) dan LAYER/METHOD/OBJECT/RESULT (`EN:38`): tanpa kolom peran.
 */
const MANUAL_HEADS: Record<Lang, { rev: string[]; ver: string[]; status: string }> = {
  ID: { rev: ['Rev', 'Tanggal', 'Penyusun', 'Perubahan', 'Status'], ver: ['Lapis', 'Metode', 'Objek', 'Hasil'], status: 'Berlaku' },
  EN: { rev: ['Rev', 'Date', 'Prepared by', 'Change', 'Status'], ver: ['Layer', 'Method', 'Object', 'Result'], status: 'In force' },
};

function manualSample(lang: Lang, o: { note?: string; verHead?: string[]; verRow?: string[] } = {}): DocxDocument {
  const m = MANUAL_HEADS[lang];
  return sample(lang, {
    over: { revHead: m.rev, verHead: o.verHead ?? m.ver },
    revRow: ['A', '2026-12-04', 'Tim GSP', o.note ?? TEXTS[lang].firstIssue, m.status],
    verRow: o.verRow ?? ['1', '', '', ''],
  });
}

describe('C25 bentuk manual lembar kendali (LB-10, LB-11)', () => {
  for (const lang of ['ID', 'EN'] as const) {
    it(`${lang}: DOCX bentuk manual lolos semua aturan bahasa (LB-11 NA), 0 bentrok X, gerbang kritis lulus`, () => {
      const r = run(manualSample(lang), lang);
      const bad = r.outcomes.filter((o) => o.module === 'language' && o.applicable && o.status !== 'pass' && o.id !== 'LB-11');
      expect(bad.map((o) => `${o.id}: ${o.status} ${o.evidence}`)).toEqual([]);
      expect(status(r, 'LB-10')).toBe('pass');
      expect(status(r, 'LB-11')).toBe('na');
      expect(outcome(r, 'LB-11').evidence).toMatch(lang === 'ID' ? /ID:39/ : /EN:38/);
      expect(r.clash.xFailures).toEqual([]);
      expect(r.critical.failed.filter((c) => c !== 'CR-1')).toEqual([]);
    });

    it(`${lang}: bentuk mesin tetap PASS untuk LB-10 dan LB-11`, () => {
      const r = run(sample(lang), lang);
      expect(status(r, 'LB-10')).toBe('pass');
      expect(status(r, 'LB-11')).toBe('pass');
    });
  }

  it('LB-10: kolom perubahan dicari per kepala; catatan salah di kolom PERUBAHAN/CHANGE tetap gagal', () => {
    expect(status(run(manualSample('EN', { note: 'Terbit pertama' }), 'EN'), 'LB-10')).toBe('fail');
    expect(status(run(manualSample('ID', { note: 'First issue' }), 'ID'), 'LB-10')).toBe('fail');
    // Tanpa kepala kolom perubahan yang dikenal: gagal beralasan, bukan membaca indeks tetap.
    const noChange = sample('ID', { over: { revHead: ['Rev', 'Tanggal', 'Catatan', 'Oleh'] } });
    const r = run(noChange, 'ID');
    expect(status(r, 'LB-10')).toBe('fail');
    expect(outcome(r, 'LB-10').evidence).toMatch(/kolom/);
  });

  it('kepala manual modul language = kepala manual structure_a (CS-04), per bahasa', () => {
    for (const lang of ['ID', 'EN'] as const) {
      const a = STRUCTURE_A_EXPECT[lang];
      const e = LANGUAGE_EXPECTATIONS[lang];
      expect(e.manualVerificationHeads).toEqual(a.manualColumns.verification);
      expect(e.manualVerificationHeads).toEqual(MANUAL_HEADS[lang].ver);
      expect(a.manualColumns.revision).toEqual(MANUAL_HEADS[lang].rev);
      // Kolom perubahan: ke-3 bentuk mesin, ke-4 bentuk manual (ID:29, EN:29).
      expect(e.revisionChangeHeads).toContain(a.columns.revision[2]);
      expect(e.revisionChangeHeads).toContain(a.manualColumns.revision[3]);
    }
  });

  it('LB-11: N/A hanya bila kepala rantai = daftar manual utuh; kepala lain tanpa peran tetap gagal', () => {
    const partial = manualSample('EN', { verHead: ['Layer', 'Method', 'Name', 'Date'] });
    expect(status(run(partial, 'EN'), 'LB-11')).toBe('fail');
    expect(status(run(sample('EN', { over: { role: 'Penyusun' } }), 'EN'), 'LB-11')).toBe('fail');
  });
});

describe('detektor bentrok X-01..X-05 (bentrok, bukan skor)', () => {
  it('X-01: label campur bahasa di pembungkus terdeteksi dan tidak masuk skor', () => {
    const r = run(sample('ID', { over: { blocks: ['A · Revision history', 'B · Rantai verifikasi'] } }), 'ID');
    expect(status(r, 'X-01')).toBe('fail');
    expect(r.clash.xFailures).toContain('X-01');
    expect(r.clash.ok).toBe(false);
    const measurableIds = r.outcomes.filter((o) => o.kind === 'measurable').map((o) => o.id);
    expect(measurableIds).not.toContain('X-01');
  });

  it('X-03: kicker sampul memuat dua nama jenis', () => {
    const r = run(sample('ID', { over: { kicker: 'LAPORAN · STANDAR' } }), 'ID');
    expect(status(r, 'X-03')).toBe('fail');
    expect(status(r, 'X-02')).toBe('fail');
  });

  it('X-04: klasifikasi berbeda antara pita segel dan register', () => {
    const r = run(sample('ID', { over: { seal: ['KLASIFIKASI · RAHASIA', ID_TEXTS.seal[1]] } }), 'ID');
    expect(status(r, 'X-04')).toBe('fail');
  });

  it('X-05: kode bahasa cap terbit bertentangan dengan bahasa pembungkus', () => {
    const r = run(sample('ID', { over: { stamp: '// 20261204 EN T -- TERBITAN 1' } }), 'ID');
    expect(status(r, 'X-05')).toBe('fail');
  });
});

describe('regresi kalibrasi Manual 000', () => {
  it('kata label aparatus di dalam prosa agen bukan label (tanpa X-01, LB-09 tetap PASS)', () => {
    const r = run(sample('ID', { over: { money: 'Rp 1.250.000,50 (SOURCE, SHEET n OF N; aturan numeral Inggris)' } }), 'ID');
    expect(status(r, 'X-01')).toBe('pass');
    expect(status(r, 'LB-09')).toBe('pass');
  });

  it('cap terbit dengan em dash (U+2014) tidak memenuhi penanda " -- TERBITAN " CR-4', () => {
    const r = run(sample('ID', { over: { stamp: '// 20261204 ID T — TERBITAN 1' } }), 'ID');
    expect(status(r, 'CR-4')).toBe('fail');
    expect(outcome(r, 'CR-4').evidence).toMatch(/TERBITAN/);
    expect(status(r, 'X-05')).toBe('pass');
  });

  it('cap terbit dan kolofon kiri dalam satu paragraf bertab tetap dikenali', () => {
    const r = run(sample('ID', { over: { stamp: 'PT GEMILANG SATRIA PERKASA\t// 20261204 ID T -- TERBITAN 1' } }), 'ID');
    expect(status(r, 'CR-4')).toBe('pass');
  });

  it('NU-02: jenis string punggung yang bukan kode dilaporkan apa adanya', () => {
    const r = run(sample('ID', { over: { spine: 'MANUAL · DATUM TERPADU · ID · REV A · XII · 2026' } }), 'ID');
    expect(status(r, 'NU-02')).toBe('fail');
    expect(outcome(r, 'NU-02').evidence).toMatch(/MANUAL/);
  });
});
