/**
 * S20: penyerapan JSON bentrok PDF (kontrak S24) dan JSON cakupan (S33).
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLASH_KIND_CODES,
  ClashInputError,
  countByKind,
  parseClashResult,
  readClashFile,
} from '../../../../benchmark/datum_conformance/lib/clash';
import { CoverageInputError, parseCoverage, readCoverageFile } from '../../../../benchmark/datum_conformance/lib/coverage';

const tmp = mkdtempSync(path.join(os.tmpdir(), 's20-inputs-'));

const VALID = {
  pdf: 'out/datum-standar.pdf',
  pages: 12,
  clashes: [
    { page: 3, kind: 'overlap', bbox: [10, 20, 30, 40.5], text: 'LEMBAR', detail: 'tumpang dengan TERBATAS' },
    { page: 12, kind: 'clipped', bbox: [0, 0, 1, 1], text: 'x', detail: 'sel tabel' },
  ],
};

describe('JSON bentrok PDF', () => {
  it('membaca berkas sah (termasuk BOM) dan menghitung per jenis', () => {
    const f = path.join(tmp, 'clash.json');
    writeFileSync(f, '\uFEFF' + JSON.stringify(VALID));
    const r = readClashFile(f);
    expect(r.pdf).toBe('out/datum-standar.pdf');
    expect(r.pages).toBe(12);
    expect(r.source).toBe(f);
    expect(r.clashes[0].bbox).toEqual([10, 20, 30, 40.5]);
    expect(countByKind(r.clashes)).toEqual({ overlap: 1, out_of_page: 0, out_of_margin: 0, clipped: 1, overflow: 0 });
  });

  it('kontrak nol bentrok sah', () => {
    expect(parseClashResult({ pdf: 'a.pdf', pages: 1, clashes: [] }).clashes).toEqual([]);
  });

  it.each([
    ['akar larik', []],
    ['tanpa pages', { pdf: 'a', clashes: [] }],
    ['pages pecahan', { pdf: 'a', pages: 1.5, clashes: [] }],
    ['clashes bukan larik', { pdf: 'a', pages: 1, clashes: {} }],
    ['jenis tak dikenal', { ...VALID, clashes: [{ ...VALID.clashes[0], kind: 'smudge' }] }],
    ['halaman di luar rentang', { ...VALID, clashes: [{ ...VALID.clashes[0], page: 13 }] }],
    ['halaman 0', { ...VALID, clashes: [{ ...VALID.clashes[0], page: 0 }] }],
    ['bbox 3 angka', { ...VALID, clashes: [{ ...VALID.clashes[0], bbox: [1, 2, 3] }] }],
    ['bbox bukan angka', { ...VALID, clashes: [{ ...VALID.clashes[0], bbox: [1, 2, 3, 'x'] }] }],
    ['text absen', { ...VALID, clashes: [{ page: 1, kind: 'overlap', bbox: [0, 0, 1, 1], detail: 'd' }] }],
  ])('menolak bentuk menyimpang: %s', (_label, data) => {
    expect(() => parseClashResult(data, 'uji.json')).toThrow(ClashInputError);
  });

  it('berkas bukan JSON = galat, bukan "0 bentrok"', () => {
    const f = path.join(tmp, 'bad.json');
    writeFileSync(f, '{pdf:');
    expect(() => readClashFile(f)).toThrow(/bukan JSON/);
    expect(() => readClashFile(path.join(tmp, 'tidak-ada.json'))).toThrow(ClashInputError);
  });

  it('setiap jenis terpetakan ke kode detektor G research/32 §13', () => {
    expect(CLASH_KIND_CODES).toEqual({ overlap: 'G-01', out_of_page: 'G-02', out_of_margin: 'G-03', clipped: 'G-04/G-05', overflow: 'G-06' });
  });
});

describe('JSON cakupan', () => {
  const pair = { template: 'datum-standar', language: 'ID' };

  it('bentuk percent, covered/applicable, dan pairs', () => {
    expect(parseCoverage({ percent: 91.4 }, pair).percent).toBe(91.4);
    const c = parseCoverage({ covered: 30, applicable: 35 }, pair);
    expect(c.percent).toBeCloseTo(85.714, 2);
    const pairs = { pairs: [{ template: 'datum-standar', language: 'EN', percent: 70 }, { template: 'datum-standar', language: 'id', covered: 34, applicable: 35 }] };
    expect(parseCoverage(pairs, pair).covered).toBe(34);
    const missing = parseCoverage(pairs, { template: 'datum-nota', language: 'ID' });
    expect(missing.percent).toBeNull();
    expect(missing.note).toMatch(/datum-nota/);
  });

  it('penyebut 0 = tidak diketahui; nilai tak sah ditolak', () => {
    expect(parseCoverage({ covered: 0, applicable: 0 }, pair).percent).toBeNull();
    expect(() => parseCoverage({ percent: 120 }, pair)).toThrow(CoverageInputError);
    expect(() => parseCoverage({ covered: 5, applicable: 4 }, pair)).toThrow(CoverageInputError);
    expect(() => parseCoverage({ foo: 1 }, pair)).toThrow(CoverageInputError);
  });

  it('membaca dari berkas', () => {
    const f = path.join(tmp, 'cov.json');
    writeFileSync(f, JSON.stringify({ percent: 88 }));
    expect(readCoverageFile(f, pair)).toEqual({ percent: 88, covered: undefined, applicable: undefined, source: f });
  });
});
