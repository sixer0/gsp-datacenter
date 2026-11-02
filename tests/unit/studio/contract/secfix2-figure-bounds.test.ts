// SEC-FIX2 (D-506): N-2 batas skema = batas cek kapasitas untuk larik figur baru (zona, anggota, legenda, catatan,
// sumber, panel v1, params v1); N-3 sel matriks dari isi `values`; batas generik (larik apa pun, string, byte,
// kedalaman); dan tidak ada fixture paritas, seed, contoh UI, benchmark, perf, atau prisma yang melampauinya.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIAGRAM_FAMILIES } from '@/lib/studio/contract/enums';
import { validateSchema } from '@/lib/studio/services/ingest';
import { validateBlockV2 } from '@/lib/studio/services/revisions/v2/body';
import { CHART_REGISTRY } from '@/lib/studio/registry/charts';
import { chartTemplate, diagramTemplate } from '@/components/studio/artifact-gallery/spec-templates';
import { SAMPLE_DOCUMENT } from '@/components/studio/template-preview/sample-document';
import {
  chartCapacityIssues,
  diagramCapacityIssues,
  FIGURE_LIMITS,
  figureBytesIssues,
} from '@/lib/studio/services/render/figure-limits';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- fixture JSON bebas bentuk
type Json = Record<string, any>;
const L = FIGURE_LIMITS;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const BOUND_KW = new Set(['maxItems', 'maxLength', 'maxProperties']);
const bounds = (issues: Array<{ keyword: string; pointer: string }>) => issues.filter((i) => BOUND_KW.has(i.keyword)).map((i) => i.pointer);
const ptrs = (issues: Array<{ pointer: string }>) => issues.map((i) => i.pointer);

const nodes = (n: number) => range(n).map((i) => ({ id: `n${i}`, label: `N${i}`, class: {} }));
const diagramSpec = (extra: Json) => ({ family: 'graph', classification: 'TERBATAS', sources: ['s'], nodes: nodes(3), ...extra });
const v2Diagram = (extra: Json) => ({ type: 'diagram', caption: { text: 'Diagram' }, source: { text: 'Uji' }, spec: diagramSpec(extra) });
const zones = (n: number, m = 1) => range(n).map((i) => ({ id: `z${i}`, label: `Z${i}`, members: range(m).map((j) => `n${j % 3}`) }));

/** [nama, pembuat medan spec(N), batas, pointer cek kapasitas]. */
const DIAGRAM_CASES: Array<[string, (n: number) => Json, number, string]> = [
  ['zones', (n) => ({ zones: zones(n) }), L.diagramZones, '/zones'],
  ['zones[].members', (n) => ({ zones: [{ id: 'z', label: 'Z', members: range(n).map(() => 'n0') }] }), L.zoneMembers, '/zones/0/members'],
  ['legend', (n) => ({ legend: range(n).map((i) => `L${i}`) }), L.diagramLegend, '/legend'],
  ['notes', (n) => ({ notes: range(n).map((i) => `C${i}`) }), L.diagramNotes, '/notes'],
  ['sources', (n) => ({ sources: range(n).map((i) => `S${i}`) }), L.diagramSources, '/sources'],
];

describe('SEC-FIX2 N-2: larik diagram baru -- skema v2 dan cek kapasitas sepakat (N lolos, N+1 ditolak keduanya)', () => {
  for (const [name, mk, limit, pointer] of DIAGRAM_CASES) {
    it(`${name}: ${limit} lolos; ${limit + 1} ditolak`, () => {
      expect(bounds(validateBlockV2(v2Diagram(mk(limit)), '/b'))).toEqual([]);
      expect(diagramCapacityIssues(diagramSpec(mk(limit)))).toEqual([]);
      expect(bounds(validateBlockV2(v2Diagram(mk(limit + 1)), '/b'))).toContain(`/b/spec${pointer}`);
      expect(ptrs(diagramCapacityIssues(diagramSpec(mk(limit + 1))))).toContain(pointer);
    });
  }

  it(`total anggota zona > ${L.zoneMembersTotal} ditolak cek kapasitas; spec lama \`source\` larik juga dihitung`, () => {
    expect(diagramCapacityIssues(diagramSpec({ zones: zones(L.diagramZones, 4) }))).toEqual([]);
    expect(ptrs(diagramCapacityIssues(diagramSpec({ zones: zones(L.diagramZones, 5) })))).toEqual(['/zones']);
    expect(ptrs(diagramCapacityIssues(diagramSpec({ source: range(L.diagramSources + 1).map((i) => `S${i}`) })))).toEqual(['/source']);
  });

  it('bentuk chart `steps` memakai cek diagram yang sama (zona di dalam data.spec)', () => {
    expect(ptrs(chartCapacityIssues({ data: { shape: 'steps', spec: diagramSpec({ zones: zones(L.diagramZones + 1) }) } }))).toContain('/data/spec/zones');
  });
});

const v1Chart = (extra: Json) => ({ $schema: 'studio.chart/v1', kind: 'P-02', title: 'Beban', source: 'Uji', widthMm: 166, ...extra });
const cat = (n: number) => ({ shape: 'categorical', points: range(n).map((i) => ({ label: `K${i}`, value: i })) });

describe('SEC-FIX2 N-1/N-2: skema chart v1 (artefak R09) berbatas sama dengan cek kapasitas', () => {
  it(`data v1: ${L.items} kategori lolos, ${L.items + 1} ditolak skema v1 dan cek kapasitas`, () => {
    expect(bounds(validateSchema('studio.chart/v1', v1Chart({ data: cat(L.items) })))).toEqual([]);
    expect(bounds(validateSchema('studio.chart/v1', v1Chart({ data: cat(L.items + 1) })))).toEqual(['/data/points']);
    expect(ptrs(chartCapacityIssues(v1Chart({ data: cat(L.items + 1) })))).toEqual(['/data/points']);
  });

  it(`panel komposit v1: ${L.panels + 1} panel ditolak skema v1 dan cek kapasitas`, () => {
    const panel = { name: 'p', code: 'P-02', spec: { kind: 'P-02', data: cat(2) } };
    const comp = (n: number) => v1Chart({ kind: 'composite', composite: { columns: 3, panels: range(n).map(() => panel) } });
    expect(bounds(validateSchema('studio.chart/v1', comp(L.panels)))).toEqual([]);
    expect(bounds(validateSchema('studio.chart/v1', comp(L.panels + 1)))).toEqual(['/composite/panels']);
    expect(ptrs(chartCapacityIssues(comp(L.panels + 1)))).toContain('/composite/panels');
  });

  it(`params v1 bebas bentuk berbatas: larik > ${L.paramItems}, kunci > ${L.paramProperties}`, () => {
    const big = range(L.paramItems + 1);
    expect(bounds(validateSchema('studio.chart/v1', v1Chart({ data: cat(3), params: { binEdges: range(L.paramItems) } })))).toEqual([]);
    expect(bounds(validateSchema('studio.chart/v1', v1Chart({ data: cat(3), params: { binEdges: big } })))).toEqual(['/params/binEdges']);
    expect(ptrs(chartCapacityIssues(v1Chart({ data: cat(3), params: { binEdges: big } })))).toEqual(['/params/binEdges']);
    const keys = Object.fromEntries(range(L.paramProperties + 1).map((i) => [`k${i}`, 1]));
    expect(bounds(validateSchema('studio.chart/v1', v1Chart({ data: cat(3), params: keys })))).toEqual(['/params']);
    expect(ptrs(chartCapacityIssues(v1Chart({ data: cat(3), params: keys })))).toEqual(['/params']);
  });
});

describe('SEC-FIX2 N-3: sel matriks dihitung dari isi `values`', () => {
  const rows = (n: number) => range(n).map((i) => `r${i}`);
  const values = (r: number, c: number) => range(r).map(() => range(c).map((j) => j % 9));
  it('rows/cols 10x10 yang dideklarasikan dengan values 200x200 ditolak (40000 sel > 5000)', () => {
    const issues = chartCapacityIssues({ data: { shape: 'matrix', rows: rows(10), cols: rows(10), values: values(200, 200) } });
    expect(issues).toContainEqual(expect.objectContaining({ pointer: '/data/values', actual: 40000, limit: L.matrixCells }));
    expect(chartCapacityIssues({ data: { shape: 'matrix', rows: rows(10), cols: rows(10), values: values(10, 10) } })).toEqual([]);
  });
  it('values 71x71 (5041 sel) ditolak, 70x70 (4900) lolos; baris values > 200 juga ditolak', () => {
    expect(ptrs(chartCapacityIssues({ data: { shape: 'matrix', rows: rows(10), cols: rows(10), values: values(71, 71) } }))).toEqual(['/data/values']);
    expect(chartCapacityIssues({ data: { shape: 'matrix', rows: rows(70), cols: rows(70), values: values(70, 70) } })).toEqual([]);
    expect(ptrs(chartCapacityIssues({ data: { shape: 'matrix', rows: rows(2), cols: rows(1), values: values(201, 1) } }))).toEqual(['/data/values']);
  });
});

describe('SEC-FIX2: batas generik setiap larik/string, byte, kedalaman', () => {
  it(`larik tak dikenal > ${L.anyArray}, string > ${L.stringChars}, kedalaman > ${L.depth}`, () => {
    expect(ptrs(chartCapacityIssues({ data: { ...cat(3), extra: range(L.anyArray + 1) } }))).toEqual(['/data/extra']);
    expect(ptrs(chartCapacityIssues({ data: cat(3), note: 'a'.repeat(L.stringChars + 1) }))).toEqual(['/note']);
    let deep: unknown = 1;
    for (let i = 0; i < L.depth + 5; i++) deep = [deep];
    expect(chartCapacityIssues({ data: cat(3), params: { deep } }).map((i) => i.keyword)).toContain('maxDepth');
  });

  it('metadata `x` (objek) tidak dihitung batas elemen/string, tetapi ikut batas byte', () => {
    expect(chartCapacityIssues({ data: cat(3), x: { note: 'a'.repeat(L.stringChars + 1), list: range(L.anyArray + 1) } })).toEqual([]);
    const huge = { data: cat(3), x: { blob: 'a'.repeat(L.figureBytes) } };
    expect(chartCapacityIssues(huge)).toEqual([expect.objectContaining({ keyword: 'maxBytes', limit: L.figureBytes })]);
  });

  it(`blok figur > ${L.figureBytes} byte ditolak (caption/sumber ikut dihitung; UTF-8)`, () => {
    expect(figureBytesIssues({ caption: { text: 'é'.repeat(L.figureBytes / 2) } }).map((i) => i.keyword)).toEqual(['maxBytes']);
    expect(figureBytesIssues({ caption: { text: 'a'.repeat(1000) } })).toEqual([]);
  });

  it(`total elemen larik > ${L.totalElements} ditolak (komposit xy: 16 panel x 2000 titik)`, () => {
    const xy = { shape: 'xy', points: range(L.xyPoints).map((i) => ({ x: i, y: i })) };
    const issues = chartCapacityIssues({ composite: { panels: range(16).map(() => ({ spec: { data: xy } })) } });
    expect(issues.map((i) => i.message)).toEqual([expect.stringContaining('total elemen larik')]);
  });
});

// ── Fixture nyata, seed, dan contoh UI tidak melampaui batas ──────────────────────────────────────────────────
const REPO = path.resolve(__dirname, '../../../..');
const DIRS = ['tests/parity/fixtures', 'benchmark', 'tests/perf', 'tests/fixtures', 'prisma', 'tests/unit/studio', 'tests/e2e', 'scripts/studio'];

function jsonFiles(dir: string, out: string[] = []): string[] {
  let names: string[] = [];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const n of names) {
    if (n === 'node_modules') continue;
    const p = path.join(dir, n);
    const st = statSync(p);
    if (st.isDirectory()) jsonFiles(p, out);
    else if (n.endsWith('.json') && st.size < 30e6) out.push(p);
  }
  return out;
}

/** Periksa setiap akar figur di nilai JSON; kembalikan jumlah akar yang diperiksa. */
function scan(v: unknown, where: string, over: string[]): number {
  if (Array.isArray(v)) return v.reduce((n: number, x) => n + scan(x, where, over), 0);
  if (typeof v !== 'object' || v === null) return 0;
  const o = v as Json;
  const report = (what: string, list: Array<{ pointer: string; message?: string }>) => list.forEach((i) => over.push(`${where} ${what}: ${i.pointer} ${i.message ?? ''}`));
  if (o.$schema === 'studio.chart/v1' || o.$schema === 'studio.diagram/v1') {
    const isChart = o.$schema === 'studio.chart/v1';
    report('skema v1', validateSchema(o.$schema, o).filter((i) => BOUND_KW.has(i.keyword)));
    report('kapasitas', isChart ? chartCapacityIssues(o) : diagramCapacityIssues(o));
    return 1;
  }
  if ((o.type === 'chart' || o.type === 'diagram') && o.caption !== undefined) {
    if (o.spec === undefined || (o.spec && typeof o.spec.$schema !== 'string' && o.spec.artifactId === undefined)) {
      // Blok v2 (konten murni): batas skema v2 + byte blok.
      if (o.data !== undefined || o.panels !== undefined || (o.spec && o.spec.family)) report('skema v2', validateBlockV2(o, '/b').filter((i) => BOUND_KW.has(i.keyword)));
    }
    report('byte blok', figureBytesIssues(o));
    if (o.spec && typeof o.spec === 'object') scan(o.spec, where, over);
    if (o.data) report('kapasitas', chartCapacityIssues({ data: o.data }));
    if (o.spec && typeof o.spec.family === 'string') report('kapasitas', diagramCapacityIssues(o.spec));
    if (Array.isArray(o.panels)) report('kapasitas', chartCapacityIssues({ composite: { panels: o.panels.map((p: Json) => ({ spec: { data: p?.data } })) } }));
    return 1;
  }
  if (typeof o.family === 'string' && Array.isArray(o.nodes)) {
    report('kapasitas', diagramCapacityIssues(o));
    return 1;
  }
  if (typeof o.shape === 'string') {
    report('kapasitas', chartCapacityIssues({ data: o }));
    return 1;
  }
  return Object.values(o).reduce((n: number, x) => n + scan(x, where, over), 0);
}

describe('SEC-FIX2: fixture paritas, seed, contoh UI, benchmark, perf, prisma di bawah batas baru', () => {
  it(`semua spec/blok figur JSON di ${DIRS.join(', ')} lolos skema v1/v2 (batas) dan cek kapasitas`, () => {
    const over: string[] = [];
    let seen = 0;
    for (const f of DIRS.flatMap((d) => jsonFiles(path.join(REPO, d)))) {
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(f, 'utf8'));
      } catch {
        continue;
      }
      seen += scan(doc, path.relative(REPO, f), over);
    }
    expect(seen).toBeGreaterThan(120);
    expect(over).toEqual([]);
  });

  it('templat artefak UI (semua kode chart terdaftar + semua keluarga diagram) dan dokumen contoh lolos', () => {
    const over: string[] = [];
    let seen = 0;
    for (const def of CHART_REGISTRY) seen += scan(chartTemplate(def), `chartTemplate(${def.code})`, over);
    for (const fam of DIAGRAM_FAMILIES) seen += scan(diagramTemplate(fam), `diagramTemplate(${fam})`, over);
    seen += scan(SAMPLE_DOCUMENT, 'SAMPLE_DOCUMENT', over);
    expect(seen).toBeGreaterThan(CHART_REGISTRY.length);
    expect(over).toEqual([]);
  });
});

describe('SEC-FIX2: panjang teks diagram yang masuk loop tata letak mesin', () => {
  const T = L.diagramText;
  const s = (n: number) => 'a'.repeat(n);
  it(`judul > ${T.title}, label simpul/sub/tepi/zona > ${T.label}, legenda/catatan > ${T.item} ditolak (pointer per medan)`, () => {
    const spec = diagramSpec({
      title: s(T.title + 1),
      nodes: [{ id: 'n0', label: s(T.label + 1), sub: s(T.label + 1), class: {} }],
      edges: [{ from: 'n0', to: 'n0', kind: 'flow', label: s(T.label + 1) }],
      zones: [{ id: 'z', label: s(T.label + 1), members: ['n0'] }],
      legend: [s(T.item + 1)],
      notes: [s(T.item + 1)],
    });
    expect(ptrs(diagramCapacityIssues(spec)).sort()).toEqual(
      ['/edges/0/label', '/legend/0', '/nodes/0/label', '/nodes/0/sub', '/notes/0', '/title', '/zones/0/label'].sort(),
    );
    expect(diagramCapacityIssues(diagramSpec({ title: s(T.title), nodes: [{ id: 'n0', label: s(T.label), class: {} }] }))).toEqual([]);
  });

  it(`total karakter sumber > ${T.sourcesTotal} ditolak (biaya graph ~kubik menurut total teks sumber)`, () => {
    expect(diagramCapacityIssues(diagramSpec({ sources: [s(T.sourcesTotal / 2), s(T.sourcesTotal / 2)] }))).toEqual([]);
    const over = diagramCapacityIssues(diagramSpec({ sources: [s(T.sourcesTotal / 2), s(T.sourcesTotal / 2 + 1)] }));
    expect(over.map((i) => [i.pointer, i.keyword])).toEqual([['/sources', 'maxLength']]);
  });
});

describe('SEC-FIX2: panjang teks data chart (spec tersimpan melewati skema)', () => {
  it(`string data > ${L.chartDataChars} ditolak, juga di panel komposit; tepat ${L.chartDataChars} lolos`, () => {
    const pts = (len: number) => ({ shape: 'categorical', points: [{ label: 'a'.repeat(len), value: 1 }] });
    expect(chartCapacityIssues({ data: pts(L.chartDataChars) })).toEqual([]);
    expect(ptrs(chartCapacityIssues({ data: pts(L.chartDataChars + 1) }))).toEqual(['/data/points/0/label']);
    expect(ptrs(chartCapacityIssues({ composite: { panels: [{ spec: { data: pts(L.chartDataChars + 1) } }] } }))).toEqual(['/composite/panels/0/spec/data/points/0/label']);
  });
});
