// SEC-FIX M-1 (D-501): `maxItems` skema v2 chart/diagram = batas route pratinjau (`FIGURE_LIMITS`), dan tidak ada
// fixture paritas, seed, atau benchmark yang melampauinya (batas tidak memecah kiriman nyata yang sudah ada).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBlockV2 } from '@/lib/studio/services/revisions/v2/body';
import { chartCapacityIssues, diagramCapacityIssues, FIGURE_LIMITS } from '@/app/api/studio/documents/[id]/figures/preview/_lib/limits';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fixture JSON bebas bentuk
type Json = Record<string, any>;
const L = FIGURE_LIMITS;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const chart = (data: Json) => ({ type: 'chart', code: 'P-02', caption: { text: 'Grafik' }, source: { text: 'Uji' }, data });
const diagram = (n: number, e: number) => ({
  type: 'diagram',
  caption: { text: 'Diagram' },
  source: { text: 'Uji' },
  spec: {
    family: 'graph', classification: 'TERBATAS', sources: ['s'],
    nodes: range(n).map((i) => ({ id: `n${i}`, label: `N${i}`, class: {} })),
    edges: range(e).map((i) => ({ from: `n${i % n}`, to: `n${(i + 1) % n}`, kind: 'flow', label: '' })),
  },
});
const maxItemsAt = (block: unknown) => validateBlockV2(block, '/b').filter((i) => i.keyword === 'maxItems').map((i) => i.pointer);

/** [bentuk data di batas, bentuk data batas+1, pointer yang diharapkan]. */
const CASES: Array<[string, (n: number) => Json, number, string]> = [
  ['categorical.points', (n) => ({ shape: 'categorical', points: range(n).map((i) => ({ label: `K${i}`, value: i })) }), L.items, '/b/data/points'],
  ['series.categories', (n) => ({ shape: 'series', categories: range(n).map((i) => `K${i}`), series: [{ name: 'A', values: range(Math.min(n, L.items)) }] }), L.items, '/b/data/categories'],
  ['series.series', (n) => ({ shape: 'series', categories: ['a'], series: range(n).map((i) => ({ name: `S${i}`, values: [1] })) }), L.series, '/b/data/series'],
  ['xy.points', (n) => ({ shape: 'xy', points: range(n).map((i) => ({ x: i, y: i })) }), L.xyPoints, '/b/data/points'],
  ['matrix.rows', (n) => ({ shape: 'matrix', rows: range(n).map((i) => `r${i}`), cols: ['c'], values: [] }), L.items, '/b/data/rows'],
  ['intervals.items', (n) => ({ shape: 'intervals', items: range(n).map((i) => ({ label: `T${i}`, start: i, end: i + 1 })) }), L.items, '/b/data/items'],
  ['graph.nodes', (n) => ({ shape: 'graph', nodes: range(n).map((i) => ({ id: `n${i}`, label: `N${i}` })), links: [] }), L.graphNodes, '/b/data/nodes'],
  ['distribution.groups', (n) => ({ shape: 'distribution', groups: range(n).map((i) => ({ name: `G${i}`, values: [1] })) }), L.distributionGroups, '/b/data/groups'],
  ['distribution.values', (n) => ({ shape: 'distribution', groups: [{ name: 'G', values: range(n) }] }), L.distributionValues, '/b/data/groups/0/values'],
  ['tiles.tiles', (n) => ({ shape: 'tiles', tiles: range(n).map((i) => ({ code: `t${i}`, row: 0, col: i })) }), L.items, '/b/data/tiles'],
  ['ohlc.points', (n) => ({ shape: 'ohlc', points: range(n).map((i) => ({ t: `${i}`, o: 1, h: 2, l: 0, c: 1 })) }), L.items, '/b/data/points'],
  ['sets.sets', (n) => ({ shape: 'sets', sets: range(n).map((i) => ({ name: `S${i}`, size: 1 })), overlaps: [] }), L.sets, '/b/data/sets'],
];

describe('SEC-FIX M-1: maxItems skema v2 = FIGURE_LIMITS route pratinjau', () => {
  for (const [name, mk, limit, pointer] of CASES) {
    it(`${name}: ${limit} lolos skema dan route; ${limit + 1} ditolak keduanya (maxItems ${pointer})`, () => {
      expect(maxItemsAt(chart(mk(limit))), name).toEqual([]);
      expect(chartCapacityIssues({ data: mk(limit) }), name).toEqual([]);
      expect(maxItemsAt(chart(mk(limit + 1))), name).toContain(pointer);
      expect(chartCapacityIssues({ data: mk(limit + 1) }).map((i) => `/b${i.pointer}`), name).toContain(pointer);
    });
  }

  it(`diagram: ${L.diagramNodes} simpul / ${L.diagramEdges} tepi lolos; lebih ditolak skema dan route`, () => {
    expect(maxItemsAt(diagram(L.diagramNodes, L.diagramEdges))).toEqual([]);
    expect(maxItemsAt(diagram(L.diagramNodes + 1, L.diagramEdges + 1))).toEqual(expect.arrayContaining(['/b/spec/nodes', '/b/spec/edges']));
    expect(diagramCapacityIssues(diagram(L.diagramNodes + 1, 0).spec).map((i) => i.pointer)).toEqual(['/nodes']);
  });

  it('batas produk/total hanya di route: sel matriks, total nilai distribusi, total butir panel komposit', () => {
    const rows = range(100).map((i) => `r${i}`);
    expect(chartCapacityIssues({ data: { shape: 'matrix', rows, cols: rows, values: [] } }).map((i) => i.pointer)).toEqual(['/data/values']);
    const groups = range(5).map((g) => ({ name: `G${g}`, values: range(L.distributionValues) }));
    expect(chartCapacityIssues({ data: { shape: 'distribution', groups } }).map((i) => i.message)).toEqual([expect.stringContaining('total nilai distribusi')]);
    const panel = { spec: { data: { shape: 'categorical', points: range(L.items).map((i) => ({ label: `K${i}`, value: i })) } } };
    expect(chartCapacityIssues({ composite: { panels: [panel, panel, panel, panel] } }).map((i) => i.pointer)).toEqual(['/composite/panels']);
  });
});

// ── Fixture nyata tidak melampaui batas ────────────────────────────────────────────────────────────────────────
const REPO = path.resolve(__dirname, '../../../..');
const DIRS = ['tests/parity/fixtures', 'benchmark/manual000', 'tests/perf', 'tests/fixtures', 'prisma'];

function jsonFiles(dir: string, out: string[] = []): string[] {
  let names: string[] = [];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const n of names) {
    const p = path.join(dir, n);
    const st = statSync(p);
    if (st.isDirectory()) jsonFiles(p, out);
    else if (n.endsWith('.json') && st.size < 20e6) out.push(p);
  }
  return out;
}

function visit(v: unknown, hit: (o: Json) => void): void {
  if (Array.isArray(v)) return v.forEach((x) => visit(x, hit));
  if (typeof v !== 'object' || v === null) return;
  hit(v as Json);
  for (const x of Object.values(v)) visit(x, hit);
}

describe('SEC-FIX M-1: fixture paritas, seed, dan benchmark di bawah batas', () => {
  const files = DIRS.flatMap((d) => jsonFiles(path.join(REPO, d)));

  it(`semua data chart, panel komposit, dan diagram di ${DIRS.join(', ')} lolos batas route`, () => {
    const over: string[] = [];
    let seen = 0;
    for (const f of files) {
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(f, 'utf8'));
      } catch {
        continue;
      }
      const rel = path.relative(REPO, f);
      visit(doc, (o) => {
        const report = (issues: Array<{ pointer: string; message: string }>) => issues.forEach((i) => over.push(`${rel}: ${i.pointer} ${i.message}`));
        if (typeof o.shape === 'string') {
          seen++;
          report(chartCapacityIssues({ data: o }));
        }
        if (typeof o.family === 'string' && Array.isArray(o.nodes)) {
          seen++;
          report(diagramCapacityIssues(o));
        }
        if (o.composite && Array.isArray(o.composite.panels)) report(chartCapacityIssues({ composite: o.composite }));
        if (Array.isArray(o.panels) && o.panels.some((p: Json) => p && typeof p === 'object' && p.data)) {
          report(chartCapacityIssues({ composite: { panels: o.panels.map((p: Json) => ({ spec: { data: p.data } })) } }));
        }
      });
    }
    expect(seen).toBeGreaterThan(100);
    expect(over).toEqual([]);
  });

  it('blok figur v2 benchmark (bm-fig-*.block.json: 48 kategori, 600 titik xy) lolos skema v2 tanpa maxItems', () => {
    const dir = path.join(REPO, 'benchmark/manual000/figures/blocks');
    const blocks = readdirSync(dir).filter((n) => n.endsWith('.block.json'));
    expect(blocks.length).toBeGreaterThan(20);
    for (const n of blocks) {
      const b = JSON.parse(readFileSync(path.join(dir, n), 'utf8'));
      expect(maxItemsAt(b), n).toEqual([]);
    }
  });
});
