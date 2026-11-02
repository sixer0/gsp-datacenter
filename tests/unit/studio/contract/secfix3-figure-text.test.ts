// SEC-FIX3 (D-508) N-5: teks blok figur v2 yang menjadi teks spec mesin (caption -> judul, source -> sumber) dinilai
// dengan batas render yang SAMA (`FIGURE_BOUNDS`) saat kiriman: R04 ingest, R08 dry-run, R12/R13 kiriman bab/slot,
// R16 PATCH blok/bab. Ditolak 400 `SCHEMA_INVALID` `checkId: "FIGURE_TEXT"` ber-pointer ke medan blok, dengan
// petunjuk panjang maksimum. Caption tabel tetap 20000 (tidak berubah).
import { describe, expect, it } from 'vitest';
import { schemaIssues } from '@/app/api/studio/chapters/_shared/submit-kit';
import { validateV2 } from '@/app/api/studio/validate/_shared/v2-kit';
import { FIGURE_BOUNDS } from '@/lib/studio/contract/schema/figure-bounds';
import { figureInlinePlain } from '@/lib/studio/contract/schema/v2/figure-text';
import { inlineV2Plain } from '@/lib/studio/services/compose/inline';
import { validateV2Against } from '@/lib/studio/services/ingest/validate';
import { validateBlockV2, validateChapterV2 } from '@/lib/studio/services/revisions/v2/body';

type Json = Record<string, unknown>;
const T = FIGURE_BOUNDS.diagramText;
const txt = (n: number) => 'a'.repeat(n);
const runsOf = (n: number) => ({ runs: [{ t: txt(n - 1) }, { tab: true }] });

const diagramSpec = (extra: Json = {}) => ({
  family: 'graph',
  classification: 'TERBATAS',
  nodes: [{ id: 'a', label: 'A', class: {} }, { id: 'b', label: 'B', class: {} }],
  ...extra,
});
const diagram = (caption: Json, extra: Json = {}) => ({ type: 'diagram', caption, source: { text: 'Uji' }, spec: diagramSpec(), ...extra });
const chartData = { shape: 'categorical', points: [{ label: 'A', value: 3 }, { label: 'B', value: 2 }] };
const chart = (caption: Json, extra: Json = {}) => ({ type: 'chart', code: 'P-02', caption, source: { text: 'Uji' }, data: chartData, ...extra });
const table = (caption: Json) => ({
  type: 'table',
  caption,
  columns: [{ role: 'id' }, { role: 'numeral' }],
  rows: [{ kind: 'header', cells: [{ text: 'Unit' }, { text: 'Skor' }] }, { cells: [{ text: 'A' }, { text: '4' }] }],
  source: { text: 'Inspeksi', provenance: ['TERUKUR'] },
});
const chapterBody = (block: Json) => ({
  $schema: 'studio.chapter/v2',
  target: { documentId: 'cmsecfix3doc00000000000001' },
  chapter: { key: '1', title: { text: 'Bab' }, sections: [{ title: { text: 'Bagian' }, blocks: [block] }] },
});
const docBody = (block: Json) => ({
  $schema: 'studio.doc/v2',
  template: { slug: 'laporan-kerja' },
  meta: { title: 'Uji SEC-FIX3' },
  sections: { content: { type: 'chapter', chapters: [chapterBody(block).chapter] } },
});
const B = '/chapter/sections/0/blocks/0';
const fig = (issues: Array<{ checkId?: string; pointer: string; message: string }>) => issues.filter((i) => i.checkId === 'FIGURE_TEXT');

describe('SEC-FIX3 N-5: teks figur v2 dinilai batas render saat kiriman', () => {
  it('R12 kiriman bab: caption diagram 301 ditolak dengan pointer dan petunjuk; 300 lolos', () => {
    const bad = fig(schemaIssues('chapter', chapterBody(diagram({ text: txt(T.title + 1) }))));
    expect(bad.map((i) => i.pointer)).toEqual([`${B}/caption`]);
    expect(bad[0].message).toContain(`maks ${T.title} karakter`);
    expect(bad[0].message).toContain('persingkat caption diagram');
    expect(schemaIssues('chapter', chapterBody(diagram({ text: txt(T.title) })))).toEqual([]);
  });

  it('R12: caption tabel dengan panjang sama (dan 5000) tetap diterima', () => {
    expect(schemaIssues('chapter', chapterBody(table({ text: txt(T.title + 1) })))).toEqual([]);
    expect(schemaIssues('chapter', chapterBody(table({ text: txt(5000) })))).toEqual([]);
  });

  it('R08 dry-run (validateV2 bab dan dokumen): caption diagram 301 ditolak', () => {
    expect(fig(validateV2('studio.chapter/v2', chapterBody(diagram({ text: txt(T.title + 1) })), '/spec')).map((i) => i.pointer)).toEqual([`/spec${B}/caption`]);
    const docIssues = fig(validateV2('studio.doc/v2', docBody(diagram({ text: txt(T.title + 1) }))));
    expect(docIssues.map((i) => i.pointer)).toEqual(['/sections/content/chapters/0/sections/0/blocks/0/caption']);
  });

  it('R04 ingest (validateV2Against studio.doc/v2): caption diagram runs 301 ditolak', () => {
    expect(fig(validateV2Against('studio.doc/v2', docBody(diagram(runsOf(T.title + 1))))).length).toBe(1);
    expect(fig(validateV2Against('studio.doc/v2', docBody(diagram(runsOf(T.title)))))).toEqual([]);
  });

  it('R16 PATCH blok/bab: caption diagram 301 ditolak, pointer badan PATCH', () => {
    expect(fig(validateBlockV2(diagram({ text: txt(T.title + 1) }))).map((i) => i.pointer)).toEqual(['/block/caption']);
    const ch = chapterBody(diagram({ text: txt(T.title + 1) })).chapter;
    expect(fig(validateChapterV2(ch)).map((i) => i.pointer)).toEqual(['/chapter/sections/0/blocks/0/caption']);
    expect(validateBlockV2(table({ text: txt(T.title + 1) }))).toEqual([]);
  });

  it('sumber diagram: teks source > batas sumber dan total spec.sources > batas total ditolak', () => {
    expect(fig(validateBlockV2(diagram({ text: 'D' }, { source: { text: txt(T.source + 1) } }))).map((i) => i.pointer)).toEqual(['/block/source']);
    const sources = [txt(600), txt(600)];
    expect(fig(validateBlockV2(diagram({ text: 'D' }, { spec: diagramSpec({ sources }) }))).map((i) => i.pointer)).toEqual(['/block/spec/sources']);
  });

  it('chart: caption > batas string spec ditolak; chart steps memakai batas judul diagram', () => {
    expect(fig(validateBlockV2(chart({ text: txt(FIGURE_BOUNDS.stringChars + 1) }))).map((i) => i.pointer)).toEqual(['/block/caption']);
    expect(validateBlockV2(chart({ text: txt(T.title + 1) }))).toEqual([]);
    const steps = chart({ text: txt(T.title + 1) }, { code: 'G-01', data: { shape: 'steps', spec: diagramSpec() } });
    expect(fig(validateBlockV2(steps)).map((i) => i.pointer)).toEqual(['/block/caption']);
  });

  it('figur rujukan artifactId tidak dinilai (judul dari artefak v1 berbatas skema)', () => {
    const ref = { type: 'diagram', caption: { text: txt(T.title + 1) }, source: { text: 'Uji' }, artifactId: 'cmsecfix3art00000000000001' };
    expect(fig(validateBlockV2(ref))).toEqual([]);
  });

  it('teks polos kontrak = teks polos compose (judul diagram/chart), termasuk tab dan baris baru', () => {
    const samples = [{ text: 'Judul' }, { runs: [{ t: 'A' }, { tab: true }, { t: 'B' }, { br: 'line' }, { t: 'C', strong: true }] }, { runs: [] }];
    for (const i of samples) expect(figureInlinePlain(i)).toBe(inlineV2Plain(i as never));
    expect(figureInlinePlain(samples[1])).toBe('A\tB\nC');
  });
});
