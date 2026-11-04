/**
 * S20: skor konformitas (research/32 §0.3, research/31 §8; D-592, D-593).
 * Seam: `runConformance` dan `computeScore`. Katalog sintetis dipakai agar hitungan harapan
 * berasal dari kasus uji, bukan dari katalog produksi.
 */
import { describe, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../../../../benchmark/datum_conformance/catalog';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { computeScore, runConformance } from '../../../../benchmark/datum_conformance/lib/score';
import { buildRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import type { PairContext, Rule, RuleResult } from '../../../../benchmark/datum_conformance/rules/types';
import { buildDocx, p } from './_docx_kit';

const DOC = DocxDocument.fromBytes(buildDocx({ sections: [{ body: p('isi') }] }), { path: 'x.docx' });

const PAIR: PairContext = {
  slug: 'datum-standar',
  language: 'ID',
  tier: 'TERBIT',
  typeCode: 'STD',
  kicker: 'STANDAR',
  producedBy: 'mcp',
  agentRevisionText: false,
  hasCopyControl: false,
};

const ALL = { tiers: ['NOTA', 'TERBIT', 'SERAH'] as const, languages: ['ID', 'EN'] as const, types: 'all' as const };

function entry(id: string, over: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    id,
    family: id.split('-')[0],
    title: id,
    citation: `ID:${id}`,
    applicability: ALL,
    critical: false,
    kind: 'measurable',
    module: 'structure_a',
    ...over,
  };
}

function rule(e: CatalogEntry, result: RuleResult | (() => RuleResult)): Rule {
  return { ...e, check: typeof result === 'function' ? result : () => result };
}

const CLEAN_CLASH = { pdf: 'x.pdf', pages: 3, clashes: [] };
const GOOD_COVERAGE = { percent: 90, source: 'cov.json' };

describe('computeScore', () => {
  it('skor = lulus / (lulus + gagal + unexercised); NA keluar penyebut', () => {
    const s = computeScore([
      { status: 'pass' },
      { status: 'pass' },
      { status: 'fail' },
      { status: 'unexercised' },
      { status: 'na' },
      { status: 'not_applicable' },
    ]);
    expect(s.passed).toBe(2);
    expect(s.denominator).toBe(4);
    expect(s.percent).toBe(50);
    expect(s.ok).toBe(false);
  });

  it('ambang >= 85,0 tanpa pembulatan ke atas: 17/20 lulus, 1699/2000 (84,95) gagal; penyebut 0 gagal', () => {
    const mk = (pass: number, total: number) =>
      computeScore(Array.from({ length: total }, (_, i) => ({ status: i < pass ? ('pass' as const) : ('fail' as const) })));
    expect(mk(17, 20).ok).toBe(true);
    expect(mk(17, 20).percentDisplay).toBe('85.0');
    const low = mk(1699, 2000);
    expect(low.ok).toBe(false);
    expect(low.percentDisplay).toBe('84.9');
    const zero = computeScore([]);
    expect(zero.ok).toBe(false);
    expect(zero.percent).toBe(0);
  });
});

describe('runConformance: keberlakuan, kritis, bentrok, putusan', () => {
  it('aturan di luar tier/bahasa/jenis pasangan tidak dijalankan dan keluar penyebut', () => {
    const notaOnly = vi.fn(() => ({ status: 'fail' as const, evidence: 'x' }));
    const enOnly = vi.fn(() => ({ status: 'fail' as const, evidence: 'x' }));
    const kt = vi.fn(() => ({ status: 'fail' as const, evidence: 'x' }));
    const cat = [
      entry('A-01'),
      entry('A-02', { applicability: { ...ALL, tiers: ['NOTA'] } }),
      entry('A-03', { applicability: { ...ALL, languages: ['EN'] } }),
      entry('A-04', { applicability: { ...ALL, types: ['KT'] } }),
    ];
    const idx = buildRuleIndex(
      { structure_a: [rule(cat[0], { status: 'pass', evidence: 'ok' }), rule(cat[1], notaOnly), rule(cat[2], enOnly), rule(cat[3], kt)], structure_b: [], language: [], clash: [] },
      cat,
    );
    const r = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(notaOnly).not.toHaveBeenCalled();
    expect(enOnly).not.toHaveBeenCalled();
    expect(kt).not.toHaveBeenCalled();
    expect(r.outcomes.filter((o) => o.status === 'not_applicable').map((o) => o.id)).toEqual(['A-02', 'A-03', 'A-04']);
    expect(r.score.denominator).toBe(1);
    expect(r.score.percent).toBe(100);
    expect(r.verdict).toBe('PASS');
    expect(r.reasons).toEqual([]);
  });

  it('gerbang kritis: NA kritis tidak sah (= gagal), UNEXERCISED kritis = gagal, belum diimplementasi = gagal', () => {
    const cat = [
      entry('CR-1', { critical: true }),
      entry('CR-2', { critical: true }),
      entry('CR-3', { critical: true }),
      entry('CR-4', { critical: true }),
      entry('CR-9', { critical: true, applicability: { ...ALL, tiers: ['NOTA'] } }),
      ...Array.from({ length: 30 }, (_, i) => entry(`B-${String(i).padStart(2, '0')}`)),
    ];
    const idx = buildRuleIndex(
      {
        structure_a: [
          rule(cat[0], { status: 'pass', evidence: 'ok' }),
          rule(cat[1], { status: 'na', evidence: 'tak ada nomor' }),
          rule(cat[2], { status: 'unexercised', evidence: 'tanpa B-FIX' }),
          ...cat.slice(5).map((c) => rule(c, { status: 'pass', evidence: 'ok' })),
        ],
        structure_b: [],
        language: [],
        clash: [],
      },
      cat,
    );
    const r = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(r.critical.required).toEqual(['CR-1', 'CR-2', 'CR-3', 'CR-4']);
    expect(r.critical.passed).toEqual(['CR-1']);
    expect(r.critical.failed).toEqual(['CR-2', 'CR-3', 'CR-4']);
    expect(r.critical.ok).toBe(false);
    const cr2 = r.outcomes.find((o) => o.id === 'CR-2')!;
    expect(cr2.status).toBe('fail');
    expect(cr2.rawStatus).toBe('na');
    expect(r.outcomes.find((o) => o.id === 'CR-4')!.implemented).toBe(false);
    // 31 lulus dari 34 berlaku = 91,1 %: skor lolos, putusan tetap FAIL karena gerbang kritis
    expect(r.score.denominator).toBe(34);
    expect(r.score.ok).toBe(true);
    expect(r.verdict).toBe('FAIL');
    expect(r.reasons.join(' ')).toMatch(/kritis/);
  });

  it('aturan katalog yang belum diimplementasi = UNEXERCISED; mode implementedOnly mengeluarkannya', () => {
    const cat = [entry('A-01'), entry('A-02')];
    const idx = buildRuleIndex({ structure_a: [rule(cat[0], { status: 'pass', evidence: 'ok' })], structure_b: [], language: [], clash: [] }, cat);
    const strict = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(strict.score.denominator).toBe(2);
    expect(strict.rules.unimplementedApplicable).toEqual(['A-02']);
    const loose = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE, implementedOnly: true });
    expect(loose.score.denominator).toBe(1);
    expect(loose.outcomes.find((o) => o.id === 'A-02')!.status).toBe('not_implemented');
  });

  it('aturan yang melempar galat dicatat gagal beserta pesannya', () => {
    const cat = [entry('A-01')];
    const idx = buildRuleIndex(
      { structure_a: [rule(cat[0], () => { throw new Error('bug modul'); })], structure_b: [], language: [], clash: [] },
      cat,
    );
    const r = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(r.outcomes[0].status).toBe('fail');
    expect(r.outcomes[0].error).toBe('bug modul');
  });

  it('jumlah bentrok = kegagalan X-* + bentrok PDF; X-* tidak masuk skor', () => {
    const cat = [entry('A-01'), entry('X-01', { kind: 'clash', family: 'X', module: 'language' }), entry('X-02', { kind: 'clash', family: 'X', module: 'language' })];
    const idx = buildRuleIndex(
      {
        structure_a: [rule(cat[0], { status: 'pass', evidence: 'ok' })],
        structure_b: [],
        language: [rule(cat[1], { status: 'fail', evidence: 'ID+EN' }), rule(cat[2], { status: 'pass', evidence: 'satu kode' })],
        clash: [],
      },
      cat,
    );
    const clash = {
      pdf: 'x.pdf',
      pages: 4,
      clashes: [
        { page: 1, kind: 'overlap' as const, bbox: [0, 0, 1, 1] as [number, number, number, number], text: 'a', detail: 'd' },
        { page: 2, kind: 'overflow' as const, bbox: [0, 0, 1, 1] as [number, number, number, number], text: 'b', detail: 'd' },
      ],
    };
    const r = runConformance({ docx: DOC, pair: PAIR, index: idx, clash, coverage: GOOD_COVERAGE });
    expect(r.score.denominator).toBe(1);
    expect(r.clash.xFailures).toEqual(['X-01']);
    expect(r.clash.pdf?.count).toBe(2);
    expect(r.clash.pdf?.byKind).toMatchObject({ overlap: 1, overflow: 1, clipped: 0 });
    expect(r.clash.total).toBe(3);
    expect(r.clash.ok).toBe(false);
    expect(r.verdict).toBe('FAIL');
  });

  it('putusan FAIL beralasan bila JSON bentrok PDF atau cakupan tidak diberikan, atau cakupan < 85', () => {
    const cat = [entry('A-01')];
    const idx = buildRuleIndex({ structure_a: [rule(cat[0], { status: 'pass', evidence: 'ok' })], structure_b: [], language: [], clash: [] }, cat);
    const none = runConformance({ docx: DOC, pair: PAIR, index: idx });
    expect(none.verdict).toBe('FAIL');
    expect(none.clash.pdf).toBeNull();
    expect(none.coverage.percent).toBeNull();
    expect(none.reasons.join('\n')).toMatch(/bentrok PDF/);
    expect(none.reasons.join('\n')).toMatch(/cakupan/);
    const low = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: { percent: 84.9, source: 'c.json' } });
    expect(low.verdict).toBe('FAIL');
    expect(low.coverage.ok).toBe(false);
  });

  it('detektor X-* yang belum diimplementasi membuat cek bentrok belum terverifikasi', () => {
    const cat = [entry('A-01'), entry('X-01', { kind: 'clash', family: 'X', module: 'language' })];
    const idx = buildRuleIndex({ structure_a: [rule(cat[0], { status: 'pass', evidence: 'ok' })], structure_b: [], language: [], clash: [] }, cat);
    const r = runConformance({ docx: DOC, pair: PAIR, index: idx, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(r.clash.xUnverified).toEqual(['X-01']);
    expect(r.clash.ok).toBe(false);
    expect(r.verdict).toBe('FAIL');
  });

  it('laporan memuat ringkasan struktur DOCX (R0) walau tanpa aturan', () => {
    const empty = buildRuleIndex({ structure_a: [], structure_b: [], language: [], clash: [] });
    const r = runConformance({ docx: DOC, pair: PAIR, index: empty });
    expect(r.input.structure).toEqual({
      sections: 1,
      cover: null,
      controlSheet: null,
      toc: null,
      wrappers: [0],
      interiors: [],
      sealBandTables: 0,
      registerFooters: [],
    });
  });

  it('katalog produksi dengan modul kosong: penyebut T/S ID = 72, skor 0, 4 kritis gagal', () => {
    const empty = buildRuleIndex({ structure_a: [], structure_b: [], language: [], clash: [] });
    const r = runConformance({ docx: DOC, pair: PAIR, index: empty, clash: CLEAN_CLASH, coverage: GOOD_COVERAGE });
    expect(r.rules.catalogMeasurable).toBe(76);
    expect(r.rules.applicableMeasurable).toBe(72);
    expect(r.score.denominator).toBe(72);
    expect(r.score.passed).toBe(0);
    expect(r.critical.failed).toEqual(['CR-1', 'CR-2', 'CR-3', 'CR-4']);
    expect(r.verdict).toBe('FAIL');
  });
});
