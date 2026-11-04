/**
 * S20: konteks pasangan dari register (research/31 §1), laporan JSON/MD per templat, dan CLI
 * (`score.ts`, mode tunggal dan batch manifest).
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../../../../benchmark/datum_conformance/catalog';
import { parseCliArgs, runCli, UsageError } from '../../../../benchmark/datum_conformance/lib/cli';
import { DocxDocument } from '../../../../benchmark/datum_conformance/lib/docx';
import { PAIR_REGISTER, resolvePair } from '../../../../benchmark/datum_conformance/lib/pairs';
import { renderMarkdown, reportBaseName, writeReport } from '../../../../benchmark/datum_conformance/lib/report';
import { runConformance } from '../../../../benchmark/datum_conformance/lib/score';
import { buildRuleIndex } from '../../../../benchmark/datum_conformance/rules';
import { buildDocx, p } from './_docx_kit';

const tmp = mkdtempSync(path.join(os.tmpdir(), 's20-cli-'));
const docxFile = path.join(tmp, 'sampel.docx');
writeFileSync(docxFile, buildDocx({ sections: [{ body: p('isi') }] }));
const clashFile = path.join(tmp, 'clash.json');
writeFileSync(clashFile, JSON.stringify({ pdf: 'sampel.pdf', pages: 2, clashes: [] }));
const covFile = path.join(tmp, 'cov.json');
writeFileSync(covFile, JSON.stringify({ pairs: [{ template: 'datum-standar', language: 'ID', percent: 90 }, { template: 'datum-nota-en', language: 'EN', percent: 90 }] }));

const ALL = { tiers: ['NOTA', 'TERBIT', 'SERAH'] as const, languages: ['ID', 'EN'] as const, types: 'all' as const };
const CAT: CatalogEntry[] = [
  { id: 'A-01', family: 'A', title: 'satu | dua', citation: 'ID:1; EN:1', applicability: ALL, critical: true, kind: 'measurable', module: 'structure_a' },
];
const PASS_INDEX = buildRuleIndex(
  { structure_a: [{ ...CAT[0], check: () => ({ status: 'pass', evidence: 'baris\nkedua', part: 'word/document.xml' }) }], structure_b: [], language: [], clash: [] },
  CAT,
);
const EMPTY_PROD = buildRuleIndex({ structure_a: [], structure_b: [], language: [], clash: [] });
const quiet = { log: () => {}, error: () => {} };

describe('register pasangan (research/31 §1)', () => {
  it('10 templat Rev A + datum-gsp (kalibrasi), EN = slug ID + -en', () => {
    expect(Object.keys(PAIR_REGISTER)).toHaveLength(11);
    expect(PAIR_REGISTER['datum-proposal-teknis']).toEqual({ language: 'ID', typeCode: 'PT', tier: 'SERAH', kicker: 'PROPOSAL TEKNIS' });
    expect(PAIR_REGISTER['datum-nota-en']).toEqual({ language: 'EN', typeCode: 'NOT', tier: 'NOTA', kicker: 'INTERNAL NOTE' });
    expect(PAIR_REGISTER['datum-gsp']).toEqual({ language: 'ID', typeCode: 'KT', tier: 'TERBIT', kicker: '' });
  });

  it('nilai CLI menang, selisih dengan register dicatat sebagai peringatan', () => {
    const r = resolvePair({ template: 'datum-laporan', language: 'ID', tier: 'SERAH' });
    expect(r.pair).toMatchObject({ slug: 'datum-laporan', typeCode: 'LAP', tier: 'SERAH', kicker: 'LAPORAN', producedBy: 'mcp' });
    expect(r.warnings.join(' ')).toMatch(/tier/);
    const lang = resolvePair({ template: 'datum-laporan-en', language: 'ID', tier: 'TERBIT' });
    expect(lang.warnings.join(' ')).toMatch(/bahasa/);
  });

  it('slug di luar register butuh --type-code; kicker bawaan kosong', () => {
    expect(() => resolvePair({ template: 'manual-000', language: 'ID', tier: 'TERBIT' })).toThrow(/type-code/);
    const r = resolvePair({ template: 'manual-000', language: 'ID', tier: 'TERBIT', typeCode: 'STD', producedBy: 'r08', copyControl: true });
    expect(r.pair).toMatchObject({ typeCode: 'STD', kicker: '', producedBy: 'r08', hasCopyControl: true });
  });
});

describe('laporan', () => {
  const docx = DocxDocument.fromFile(docxFile);
  const { pair } = resolvePair({ template: 'datum-standar', language: 'ID', tier: 'TERBIT' });
  const report = runConformance({
    docx,
    pair,
    index: PASS_INDEX,
    clash: { pdf: 'sampel.pdf', pages: 2, clashes: [], source: clashFile },
    coverage: { percent: 90, source: covFile },
    generatedAt: '2026-11-04T00:00:00.000Z',
  });

  it('nama berkas laporan per templat x bahasa, aman untuk sistem berkas', () => {
    expect(reportBaseName(pair)).toBe('datum-standar_ID');
    expect(reportBaseName({ ...pair, slug: '../x y' })).toBe('.._x_y_ID');
  });

  it('JSON dan MD ditulis; JSON = laporan apa adanya', () => {
    const out = path.join(tmp, 'rep');
    const files = writeReport(report, out);
    expect(files.json).toBe(path.join(out, 'datum-standar_ID.json'));
    const back = JSON.parse(readFileSync(files.json, 'utf8'));
    expect(back).toEqual(JSON.parse(JSON.stringify(report)));
    expect(back.schema).toBe('datum-conformance/v1');
    expect(Object.keys(back).sort()).toEqual(
      ['clash', 'coverage', 'critical', 'generatedAt', 'input', 'outcomes', 'reasons', 'rules', 'schema', 'score', 'verdict'].sort(),
    );
    expect(existsSync(files.md)).toBe(true);
  });

  it('MD memuat putusan, skor, kritis, bentrok, cakupan, dan tabel aturan dengan sel teraman', () => {
    const md = renderMarkdown(report);
    expect(md).toMatch(/^# Konformitas DATUM Rev A: datum-standar \(ID, TERBIT\)/);
    expect(md).toMatch(/Putusan: \*\*PASS\*\*/);
    expect(md).toMatch(/Skor terukur \| 100\.0 % \(1\/1\)/);
    expect(md).toMatch(/## Aturan kritis/);
    expect(md).toMatch(/## Bentrok teks/);
    expect(md).toMatch(/## Cakupan butir/);
    expect(md).toContain('| A-01 | A | satu \\| dua | ya | pass | baris kedua |');
  });
});

describe('CLI', () => {
  it('parseCliArgs: mode tunggal, bendera boolean, dan galat pakai', () => {
    const a = parseCliArgs(['--docx', 'a.docx', '--template', 'datum-standar', '--language', 'id', '--tier', 'terbit', '--out', 'o', '--copy-control']);
    expect(a.mode).toBe('single');
    if (a.mode === 'single') {
      expect(a.entry.language).toBe('ID');
      expect(a.entry.tier).toBe('TERBIT');
      expect(a.entry.copyControl).toBe(true);
    }
    expect(parseCliArgs(['--manifest', 'm.json', '--out', 'o']).mode).toBe('batch');
    expect(() => parseCliArgs(['--docx', 'a.docx'])).toThrow(UsageError);
    expect(() => parseCliArgs(['--docx', 'a', '--template', 't', '--language', 'XX', '--tier', 'TERBIT', '--out', 'o'])).toThrow(/language/);
    expect(() => parseCliArgs(['--bogus'])).toThrow(UsageError);
  });

  it('tunggal: exit 0 bila PASS, laporan tertulis', async () => {
    const out = path.join(tmp, 'single');
    const code = await runCli(
      ['--docx', docxFile, '--template', 'datum-standar', '--language', 'ID', '--tier', 'TERBIT', '--clash', clashFile, '--coverage', covFile, '--out', out],
      { ...quiet, index: PASS_INDEX },
    );
    expect(code).toBe(0);
    expect(JSON.parse(readFileSync(path.join(out, 'datum-standar_ID.json'), 'utf8')).verdict).toBe('PASS');
  });

  it('tunggal dengan modul kosong: exit 1 (FAIL), penyebut 72', async () => {
    const out = path.join(tmp, 'empty');
    const code = await runCli(['--docx', docxFile, '--template', 'datum-standar', '--language', 'ID', '--tier', 'TERBIT', '--out', out], {
      ...quiet,
      index: EMPTY_PROD,
    });
    expect(code).toBe(1);
    const r = JSON.parse(readFileSync(path.join(out, 'datum-standar_ID.json'), 'utf8'));
    expect(r.score.denominator).toBe(72);
  });

  it('masukan tak terbaca: exit 2', async () => {
    const code = await runCli(['--docx', path.join(tmp, 'tidak-ada.docx'), '--template', 'datum-standar', '--language', 'ID', '--tier', 'TERBIT', '--out', tmp], {
      ...quiet,
      index: PASS_INDEX,
    });
    expect(code).toBe(2);
  });

  it('batch manifest: path relatif terhadap manifest, ringkasan JSON/MD, exit 1 bila ada FAIL', async () => {
    const manifest = path.join(tmp, 'manifest.json');
    writeFileSync(
      manifest,
      JSON.stringify({
        coverage: 'cov.json',
        entries: [
          { docx: 'sampel.docx', template: 'datum-standar', language: 'ID', tier: 'TERBIT', clash: 'clash.json' },
          { docx: 'sampel.docx', template: 'datum-nota-en', language: 'EN', tier: 'NOTA' },
        ],
      }),
    );
    const out = path.join(tmp, 'batch');
    const code = await runCli(['--manifest', manifest, '--out', out], { ...quiet, index: PASS_INDEX });
    expect(code).toBe(1);
    const sum = JSON.parse(readFileSync(path.join(out, 'summary.json'), 'utf8'));
    expect(sum.entries.map((e: { name: string; verdict: string }) => [e.name, e.verdict])).toEqual([
      ['datum-standar_ID', 'PASS'],
      ['datum-nota-en_EN', 'FAIL'],
    ]);
    expect(existsSync(path.join(out, 'summary.md'))).toBe(true);
    expect(existsSync(path.join(out, 'datum-nota-en_EN.md'))).toBe(true);
  });
});
