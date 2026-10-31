/* eslint-disable @typescript-eslint/no-explicit-any -- uji: payload kontrak diubah bebas-bentuk */
// FIX-QB / FIX-R40-3 (review DC-40 #3, #5; register 05 §5.6 langkah 6b, AC-19): satu validator hari
// kalender (`contracts/dates.ts isCalendarDay`) dipakai impor, filter R21, dan nama final; satu pemeta
// isu I54 + aturan penekanan EC27 (`summarizeContractChecks`) dipakai gerbang (R08/R12/R13) dan draf
// lokal (CLI), sehingga blok `studio.doc/v2` dengan > 1 payload memberi isu yang SAMA di kedua mode.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkContractRecord, isCalendarDay, summarizeContractChecks } from '@/lib/studio/services/contracts';
import { checkContractTargets, type ContractRecordTarget } from '@/lib/studio/services/ingest/by-construction';
import { draftContractIssues, LOCAL_CONTRACT_KIND } from '@/lib/studio/services/draft';
import { parseReportedAt } from '@/lib/studio/services/import/contract/parse';
import { isCalendarDate } from '@/lib/studio/services/query/filters';
import { parseFinalFileName } from '@/lib/studio/services/render/final-name';

const ROOT = path.resolve(__dirname, '../../../..');
const SERVICES = path.join(ROOT, 'src/lib/studio/services');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Register 05 §5.8 contoh 1 (tanpa refs: I54 murni). */
function payload(): Record<string, any> {
  return {
    type: 'contractRecord',
    status: 'complete',
    owner: 'data-analyst',
    initiator: 'controller',
    taskRef: 'DC-02',
    reportedAt: '2026-10-30T19:30+07:00',
    cardIds: ['t_249c6b84'],
    items: [
      { key: 't_5943d415', title: { text: 'Kunci kosakata status dari korpus' }, status: 'done' },
      { key: 'DC-03', title: { text: 'Protokol metrik efisiensi' }, status: 'ready' },
    ],
  };
}

const withIssue = () => ({ ...payload(), status: 'running' });
const withDup = (key = 'DC-03') => {
  const p = payload();
  p.items = [...p.items, { key, title: { text: 'Ganda' }, status: 'ready' }];
  return p;
};

/** Blok doc/v2 dua payload + target gerbang yang setara (pointer sama dengan mode lokal). */
function twoPayloads(a: Record<string, any>, b: Record<string, any>) {
  const block = { $schema: 'studio.doc/v2', template: { slug: 'laporan-kerja-agen' }, meta: { title: 'x' }, sections: { record: a, record2: b } };
  const targets: ContractRecordTarget[] = [
    { slotKey: 'record', kind: LOCAL_CONTRACT_KIND, payload: a as any, pointer: '/sections/record' },
    { slotKey: 'record2', kind: LOCAL_CONTRACT_KIND, payload: b as any, pointer: '/sections/record2' },
  ];
  return { block, targets };
}

/** Isu gerbang (400 isu atau 422 EC27) dalam bentuk isu draf lokal. */
function gateAsDraft(targets: ContractRecordTarget[]) {
  const g = checkContractTargets(targets);
  if (g.issues.length > 0) return g.issues;
  if (!g.error) return [];
  const d = g.error.details as { pointer: string; key: string; positions: number[] };
  return [{ pointer: d.pointer, keyword: g.error.code, message: g.error.message, details: { key: d.key, positions: d.positions } }];
}

describe('FIX-R40-3 satu isCalendarDay', () => {
  it('hanya satu definisi isCalendarDay di src/lib/studio/services; salinan lama hilang', () => {
    const defs: string[] = [];
    const oldCopies: string[] = [];
    for (const f of walk(SERVICES)) {
      const s = fs.readFileSync(f, 'utf8');
      if (/function\s+isCalendarDay\s*\(/.test(s)) defs.push(path.relative(ROOT, f).replace(/\\/g, '/'));
      if (/getUTCDate\(\)\s*===\s*d\b/.test(s)) oldCopies.push(path.relative(ROOT, f).replace(/\\/g, '/'));
    }
    expect(defs).toEqual(['src/lib/studio/services/contracts/dates.ts']);
    expect(oldCopies).toEqual([]);
  });

  it('aturan kalender (kabisat, batas bulan, tahun 0000-0099)', () => {
    expect(isCalendarDay(2024, 2, 29)).toBe(true);
    expect(isCalendarDay(2026, 2, 29)).toBe(false);
    expect(isCalendarDay(1900, 2, 29)).toBe(false);
    expect(isCalendarDay(2000, 2, 29)).toBe(true);
    expect(isCalendarDay(2026, 4, 31)).toBe(false);
    expect(isCalendarDay(2026, 13, 1)).toBe(false);
    expect(isCalendarDay(2026, 1, 0)).toBe(false);
    expect(isCalendarDay(50, 1, 1)).toBe(true);
  });

  it('pemakai impor / filter R21 / nama final memakai aturan yang sama (2026-02-30 ditolak)', () => {
    expect(parseReportedAt('2026-02-28')?.value).toBe('2026-02-28');
    expect(parseReportedAt('2026-02-30')).toBeNull();
    expect(parseReportedAt('2024-02-29 10:00 WIB')?.value).toBe('2024-02-29T10:00+07:00');
    expect(isCalendarDate('2026-02-28')).toBe(true);
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(parseFinalFileName('DOC_rev1_20260228T235959Z_0123abcd.pdf')).not.toBeNull();
    expect(parseFinalFileName('DOC_rev1_20260230T000000Z_0123abcd.pdf')).toBeNull();
    expect(parseFinalFileName('DOC_rev1_20260228T240000Z_0123abcd.pdf')).toBeNull();
  });
});

describe('FIX-R40-3 satu pemeta isu I54 + aturan EC27', () => {
  it('summarizeContractChecks: isu CH dari semua payload menekan EC27; tanpa isu -> EC27 pertama saja', () => {
    const issue = checkContractRecord(withIssue() as any, LOCAL_CONTRACT_KIND, { pointer: '/a' });
    const dup1 = checkContractRecord(withDup('DC-03') as any, LOCAL_CONTRACT_KIND, { pointer: '/b' });
    const dup2 = checkContractRecord(withDup('t_5943d415') as any, LOCAL_CONTRACT_KIND, { pointer: '/c' });
    const s1 = summarizeContractChecks([dup1, issue]);
    expect(s1.duplicate).toBeUndefined();
    expect(s1.issues).toEqual([{ pointer: '/a/status', keyword: 'CONTRACT_ENUM', message: expect.any(String), checkId: 'CONTRACT_ENUM' }]);
    const s2 = summarizeContractChecks([dup1, dup2]);
    expect(s2.issues).toEqual([]);
    expect(s2.duplicate).toEqual({
      code: 'CONTRACT_ITEM_KEY_DUPLICATE',
      message: 'Kunci butir "DC-03" ganda pada posisi 2, 3',
      details: { pointer: '/b/items/2/key', key: 'DC-03', positions: [2, 3] },
    });
    expect(summarizeContractChecks([])).toEqual({ issues: [] });
  });

  it('pemeta tunggal: hanya services/contracts/issues.ts merakit pesan EC27', () => {
    const hits = walk(path.join(ROOT, 'src')).filter((f) => fs.readFileSync(f, 'utf8').includes('ganda pada posisi ${'));
    expect(hits.map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))).toEqual(['src/lib/studio/services/contracts/issues.ts']);
  });

  const cases: Array<[string, Record<string, any>, Record<string, any>]> = [
    ['isu CH di payload 1 + EC27 di payload 2', withIssue(), withDup()],
    ['EC27 di payload 1 + isu CH di payload 2', withDup(), withIssue()],
    ['EC27 di kedua payload (hanya yang pertama)', withDup('DC-03'), withDup('t_5943d415')],
    ['isu CH di kedua payload', withIssue(), { ...payload(), reportedAt: '2026-02-30' }],
    ['kedua payload sah', payload(), payload()],
  ];
  for (const [name, a, b] of cases) {
    it(`blok doc/v2 dua payload, lokal = gerbang R08: ${name}`, () => {
      const { block, targets } = twoPayloads(a, b);
      const local = draftContractIssues(block);
      expect(local).toEqual(gateAsDraft(targets));
    });
  }

  it('EC27 + isu CH di payload lain: hanya isu CH (400 didahulukan, seperti R08)', () => {
    const { block } = twoPayloads(withIssue(), withDup());
    const local = draftContractIssues(block);
    expect(local.map((i) => i.keyword)).toEqual(['CONTRACT_ENUM']);
  });
});
