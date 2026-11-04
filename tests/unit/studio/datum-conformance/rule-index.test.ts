/**
 * S20: katalog aturan (research/32) dan indeks aturan yang terkabel ke 4 modul stub.
 * Nilai harapan jumlah per pasangan diambil dari research/32 §1 dan §16 (sumber independen).
 */
import { describe, expect, it } from 'vitest';
import {
  CATALOG_BY_ID,
  COVERAGE_ONLY_CODES,
  DATUM_CATALOG,
  OUT_OF_SCOPE_COVERAGE,
  catalogApplicable,
} from '../../../../benchmark/datum_conformance/catalog';
import { RULE_MODULES, RuleIndexError, buildRuleIndex, defaultRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import { defineRule, pass } from '../../../../benchmark/datum_conformance/rules/types';
import type { Rule } from '../../../../benchmark/datum_conformance/rules/types';

const measurable = DATUM_CATALOG.filter((r) => r.kind === 'measurable');

describe('katalog DATUM Rev A (research/32)', () => {
  it('76 aturan terukur, 4 kritis CR-1..CR-4, 5 detektor bentrok X-01..X-05', () => {
    expect(measurable).toHaveLength(76);
    expect(measurable.filter((r) => r.critical).map((r) => r.id)).toEqual(['CR-1', 'CR-2', 'CR-3', 'CR-4']);
    expect(DATUM_CATALOG.filter((r) => r.kind === 'clash').map((r) => r.id)).toEqual(['X-01', 'X-02', 'X-03', 'X-04', 'X-05']);
  });

  it('jumlah terukur per keluarga = ringkasan §1', () => {
    const fam = (codes: string[]) => measurable.filter((r) => codes.includes(r.family)).length;
    expect(fam(['CR'])).toBe(4);
    expect(fam(['CV'])).toBe(16);
    expect(fam(['CS'])).toBe(6);
    expect(fam(['RH', 'RB'])).toBe(11);
    expect(fam(['SB', 'IS'])).toBe(6);
    expect(fam(['GF', 'DV'])).toBe(15);
    expect(fam(['NU'])).toBe(4);
    expect(fam(['TR'])).toBe(5);
    expect(fam(['NC'])).toBe(1);
    expect(fam(['AC6'])).toBe(1);
    expect(fam(['LB'])).toBe(7);
  });

  it('penyebut maksimum per pasangan = §16 (T/S ID 72, T/S EN 74, NOTA ID 35, NOTA EN 36)', () => {
    const n = (tier: 'NOTA' | 'TERBIT' | 'SERAH', language: 'ID' | 'EN') =>
      catalogApplicable(DATUM_CATALOG, { tier, language, typeCode: 'STD' }).filter((r) => r.kind === 'measurable').length;
    expect(n('TERBIT', 'ID')).toBe(72);
    expect(n('SERAH', 'ID')).toBe(72);
    expect(n('TERBIT', 'EN')).toBe(74);
    expect(n('SERAH', 'EN')).toBe(74);
    expect(n('NOTA', 'ID')).toBe(35);
    expect(n('NOTA', 'EN')).toBe(36);
  });

  it('39 butir cakupan-saja (4 di luar lingkup) dan tidak ada yang tumpang dengan kode terukur', () => {
    expect(COVERAGE_ONLY_CODES).toHaveLength(39);
    expect([...OUT_OF_SCOPE_COVERAGE].sort()).toEqual(['CL-04', 'GF-16', 'NC-08', 'TR-06']);
    for (const c of COVERAGE_ONLY_CODES) expect(CATALOG_BY_ID.has(c)).toBe(false);
  });

  it('setiap entri bersitasi dan dimiliki satu modul', () => {
    for (const r of DATUM_CATALOG) {
      expect(r.citation.length).toBeGreaterThan(0);
      expect(['structure_a', 'structure_b', 'language', 'clash']).toContain(r.module);
    }
    expect(CATALOG_BY_ID.get('CR-1')!.module).toBe('structure_b');
    expect(CATALOG_BY_ID.get('CV-01')!.module).toBe('structure_a');
    expect(CATALOG_BY_ID.get('X-02')!.module).toBe('language');
  });
});

describe('indeks aturan', () => {
  const ok = defineRule('CV-01', () => pass('ok'));

  it('indeks bawaan terkabel ke 4 modul stub dan terbangun', () => {
    expect(Object.keys(RULE_MODULES).sort()).toEqual(['clash', 'language', 'structure_a', 'structure_b']);
    const idx = defaultRuleIndex();
    expect(idx.rules.length).toBe(Object.values(RULE_MODULES).reduce((a, m) => a + m.length, 0));
  });

  it('defineRule mengambil metadata dari katalog', () => {
    expect(ok.family).toBe('CV');
    expect(ok.module).toBe('structure_a');
    expect(ok.critical).toBe(false);
    expect(ok.applicability.tiers).toEqual(['TERBIT', 'SERAH']);
    expect(() => defineRule('ZZ-99', () => pass('x'))).toThrow(/katalog/);
  });

  it('menolak id ganda, id di luar katalog, butir cakupan-saja, modul salah, dan metadata menyimpang', () => {
    const unknown = { ...ok, id: 'ZZ-01' } as Rule;
    const coverage = { ...ok, id: 'CV-14' } as Rule;
    const drift = { ...defineRule('CR-3', () => pass('x')), critical: false } as Rule;
    const run = () =>
      buildRuleIndex({ structure_a: [ok, ok, unknown, coverage], structure_b: [defineRule('CR-2', () => pass('x'))], language: [drift], clash: [] });
    expect(run).toThrow(RuleIndexError);
    try {
      run();
    } catch (e) {
      const msgs = (e as RuleIndexError).problems.join('\n');
      expect(msgs).toMatch(/CV-01.*ganda/);
      expect(msgs).toMatch(/ZZ-01.*katalog/);
      expect(msgs).toMatch(/CV-14.*cakupan-saja/);
      expect(msgs).toMatch(/CR-2.*modul/);
      expect(msgs).toMatch(/CR-3.*critical/);
    }
  });

  it('urutan aturan indeks = urutan katalog', () => {
    const idx = buildRuleIndex({
      structure_a: [defineRule('CV-02', () => pass('')), ok],
      structure_b: [defineRule('CR-1', () => pass(''))],
      language: [],
      clash: [],
    });
    expect(idx.rules.map((r) => r.id)).toEqual(['CR-1', 'CV-01', 'CV-02']);
    expect(idx.implemented.has('CV-02')).toBe(true);
  });
});
