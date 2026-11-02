// FIG-03b — POST /api/studio/documents/[id]/figures/preview: pratinjau SATU figur, baca saja.
// Bagian 1 memakai mesin chart/diagram ASLI atas snapshot sintetis (tanpa DB): cari blok (pid/alamat/label),
// isu lint + suggest, SVG tidak ikut bawaan, blok inline disusun dengan parameter slot tersimpan.
// Bagian 2: route dengan pemuat revisi di-mock: 401, 400 skema, 200 bentuk ringkas, penolakan mesin = 200
// rendered:false, 422 sasaran bukan figur, header korelasi, dan NOL tulis Prisma.
/* eslint-disable @typescript-eslint/no-explicit-any -- badan JSON bebas bentuk */
import './_env';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const loader = vi.hoisted(() => ({ loadFigureContext: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/app/api/studio/documents/[id]/figures/preview/_lib/load', () => loader);

import { dbWrites, resetDb } from './_prisma';
import { jsonOf, params, req } from './_studio';
import { EMPTY_CHART_TEMPLATE } from '@/lib/studio/engine/chart/core';
import { resetRenderRateLimiter } from '@/lib/studio/http/render-guard';
import { composeInlineBlock, findFigureBlock, renderFigure } from '@/app/api/studio/documents/[id]/figures/preview/_lib/figure';
import { POST } from '@/app/api/studio/documents/[id]/figures/preview/route';
import { clone, parityDiagramSpecs } from '../figures/_helpers';

const DOC = 'cmvdoc0000000000000fig03b';
const LONG = ['Pembangkit Listrik Tenaga Uap Suralaya', 'Gardu Induk Tegangan Ekstra Tinggi Cilegon', 'Saluran Udara Tegangan Tinggi Bogor Baru', 'Pusat Pengatur Beban Jawa Bali', 'Unit Induk Distribusi Jakarta Raya', 'Unit Pelaksana Transmisi Durikosambi', 'Pembangkit Listrik Tenaga Gas Muara Karang', 'Gardu Distribusi Kawasan Industri Pulogadung'];
const points = (labels: string[]) => labels.map((label, i) => ({ label, value: 10 + i * 7 }));
const chartSpec = (labels: string[]) => ({ $schema: 'studio.chart/v1', kind: 'P-02', title: 'Beban', source: 'Uji', widthMm: 166, id: 'Gambar 1.1', data: { shape: 'categorical', points: points(labels) } });
const DIAGRAM = { $schema: 'studio.diagram/v1', family: 'flow', id: 'Gambar 1.2', title: 'Alur.', classification: 'TERBATAS', width_mm: 166, sources: ['sumber'], nodes: [{ id: 'a', label: 'A', class: {} }] };

function snapshot(o: { compose?: boolean } = {}): any {
  return {
    schema: 'studio.norm/v2',
    doc: { meta: { title: 'Uji', classification: 'TERBATAS' }, chapters: [] },
    units: [],
    skeleton: { slots: [] },
    numbering: {},
    register: {},
    blocks: [
      { blockId: 'para-001', pid: 'para-001', slotKey: 'content', address: '1.1.1', ordinal: 1, unitKey: '1', type: 'paragraph', content: {}, textPlain: '', contentSha256: '' },
      { blockId: 'fig-chart-1', pid: 'fig-chart-1', slotKey: 'content', address: '1.1.2', artifactLabel: 'Gambar 1.1', ordinal: 2, unitKey: '1', type: 'chart', content: { type: 'chart', spec: chartSpec(LONG) }, textPlain: '', contentSha256: '' },
      { blockId: 'fig-diag-1', pid: 'fig-diag-1', slotKey: 'content', address: '1.1.3', artifactLabel: 'Gambar 1.2', ordinal: 3, unitKey: '1', type: 'diagram', content: { type: 'diagram', spec: DIAGRAM }, textPlain: '', contentSha256: '' },
    ],
    ...(o.compose === false ? {} : { compose: { v: 1, skeleton: { slots: [] }, tier: 'TERBIT', params: { 'chart.output.widthMm': 128 }, slotParams: { content: { 'chart.output.widthMm': 166 } } } }),
  };
}

const inlineChart = (labels: string[]) => ({ type: 'chart', code: 'P-02', data: { shape: 'categorical', points: points(labels) }, caption: { text: 'Beban unit' }, source: { text: 'Uji' } });

describe('FIG-03b figure.ts (mesin asli)', () => {
  it('findFigureBlock: pid, alamat blok, label Gambar; paragraf -> 422 BLOCK_TYPE_NOT_ADMITTED; tak ada -> 404', () => {
    const s = snapshot();
    expect(findFigureBlock(s, { pid: 'fig-chart-1' }).address).toBe('1.1.2');
    expect(findFigureBlock(s, { address: '1.1.3' }).type).toBe('diagram');
    expect(findFigureBlock(s, { address: 'Gambar 1.1' }).pid).toBe('fig-chart-1');
    expect(() => findFigureBlock(s, { address: '1.1.1' })).toThrow(expect.objectContaining({ code: 'BLOCK_TYPE_NOT_ADMITTED' }));
    expect(() => findFigureBlock(s, { pid: 'nope-123' })).toThrow(expect.objectContaining({ code: 'PID_NOT_FOUND' }));
    expect(() => findFigureBlock(s, { address: '9.1.1' })).toThrow(expect.objectContaining({ code: 'ADDRESS_NOT_FOUND' }));
  });

  it('chart padat: isu AUTO_ORIENT/LABEL_GUTTER, suggest terisi bila ada, tanpa svg bawaan; label pendek = isu lebih sedikit', async () => {
    const s = snapshot();
    const crowded = await renderFigure(findFigureBlock(s, { pid: 'fig-chart-1' }), EMPTY_CHART_TEMPLATE, { inline: false, withSvg: false });
    const codes = crowded.issues.map((i) => i.checkId);
    expect(codes).toEqual(expect.arrayContaining(['AUTO_ORIENT', 'LABEL_GUTTER']));
    expect(crowded).toMatchObject({ type: 'chart', code: 'P-02', pid: 'fig-chart-1', label: 'Gambar 1.1', inline: false, data: { shape: 'categorical', items: 8 } });
    expect(crowded.data!.maxLabelChars).toBeGreaterThan(30);
    expect(crowded.size.widthMm).toBe(166);
    expect(crowded.size.svgBytes).toBeGreaterThan(500);
    expect('svg' in crowded).toBe(false);
    for (const i of crowded.issues) expect(i.suggest === null || typeof i.suggest === 'string').toBe(true);
    const orient = crowded.issues.find((i) => i.checkId === 'AUTO_ORIENT')!;
    expect(orient).toMatchObject({ suggestSource: 'hint', info: false });
    expect(orient.suggest).toMatch(/labelShort|orientation/);
    expect(crowded.issues.find((i) => i.checkId === 'AUTO_FIT')).toMatchObject({ info: true });
    expect(crowded.layoutIssueCount).toBeLessThan(crowded.issueCount);
    const short = await renderFigure(composeInlineBlock(s, inlineChart(LONG.map((_, i) => `U${i + 1}`)) as any, findFigureBlock(s, { pid: 'fig-chart-1' })), EMPTY_CHART_TEMPLATE, { inline: true, withSvg: true });
    expect(short.issueCount).toBeLessThan(crowded.issueCount);
    expect(short.issues.map((i) => i.checkId)).not.toContain('AUTO_ORIENT');
    expect(short.svg).toMatch(/^<svg|<\?xml/);
    expect(short).toMatchObject({ inline: true, pid: 'fig-chart-1', address: '1.1.2', label: 'Gambar 1.1' });
  });

  it('inline: lebar dari parameter slot sasaran (166) atau parameter dokumen (128); snapshot tanpa konteks compose -> SCHEMA_INVALID', async () => {
    const s = snapshot();
    const atSlot = composeInlineBlock(s, inlineChart(['A', 'B']) as any, { pid: 'fig-chart-1', slotKey: 'content', artifactLabel: 'Gambar 1.1' });
    expect((atSlot.content as any).spec.widthMm).toBe(166);
    expect((atSlot.content as any).spec.id).toBe('Gambar 1.1');
    const docLevel = composeInlineBlock(s, inlineChart(['A', 'B']) as any, null);
    expect((docLevel.content as any).spec.widthMm).toBe(128);
    expect(() => composeInlineBlock(snapshot({ compose: false }), inlineChart(['A']) as any, null)).toThrow(expect.objectContaining({ code: 'SCHEMA_INVALID' }));
  });

  it('diagram bercacat (dg_topology, FIG-02b): report.geometry ikut isu dengan suggest mesin, AUTO_FIT = info', async () => {
    const spec = clone(parityDiagramSpecs().find((x) => x.file === 'dg_topology.json')!.spec);
    const s = snapshot();
    s.blocks[2].content.spec = spec;
    const r = await renderFigure(findFigureBlock(s, { pid: 'fig-diag-1' }), EMPTY_CHART_TEMPLATE, { inline: false, withSvg: false });
    const geo = r.issues.filter((i) => i.suggestSource === 'engine');
    expect(geo.length).toBeGreaterThan(0);
    expect(r.issues.map((i) => i.checkId)).toEqual(expect.arrayContaining(['AUTO_FIT', 'ZONE_LABEL_CLAMP']));
    expect(r.issues.find((i) => i.checkId === 'AUTO_FIT')).toMatchObject({ info: true, status: 'REPORT' });
    for (const i of geo) expect(typeof i.suggest).toBe('string');
  });

  it('diagram: dirender lewat buildDiagramSvg (release:false), kode = keluarga', async () => {
    const r = await renderFigure(findFigureBlock(snapshot(), { pid: 'fig-diag-1' }), EMPTY_CHART_TEMPLATE, { inline: false, withSvg: false });
    expect(r).toMatchObject({ type: 'diagram', code: 'flow', data: null });
    expect(r.size.heightMm).toBeGreaterThan(0);
  });
});

describe('FIG-03b route POST figures/preview', () => {
  beforeEach(() => {
    resetDb();
    resetRenderRateLimiter();
    loader.loadFigureContext.mockReset();
    loader.loadFigureContext.mockResolvedValue({ documentId: DOC, revisionNo: 3, currentRevisionNo: 4, snapshot: snapshot(), template: EMPTY_CHART_TEMPLATE });
  });
  const call = async (body: unknown, auth: 'agent' | 'none' = 'agent') => POST(await req(`/api/studio/documents/${DOC}/figures/preview`, { auth, body }), params({ id: DOC }));

  it('tanpa sesi -> 401, pemuat tidak dipanggil', async () => {
    const res = await call({ pid: 'fig-chart-1' }, 'none');
    expect(res.status).toBe(401);
    expect(loader.loadFigureContext).not.toHaveBeenCalled();
  });

  it('badan tak sah -> 400 SCHEMA_INVALID (kunci asing, pid+address, tanpa sasaran, blok bukan figur) tanpa memuat revisi', async () => {
    for (const body of [{ pid: 'fig-chart-1', render: true }, { pid: 'fig-chart-1', address: '1.1.2' }, {}, { block: { type: 'paragraph' } }, { address: 'F:cover' }, { pid: 'fig-chart-1', revisionNo: 0 }]) {
      const res = await call(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect((await jsonOf(res)).code).toBe('SCHEMA_INVALID');
    }
    expect(loader.loadFigureContext).not.toHaveBeenCalled();
  });

  it('200 ringkas: isu + size, tanpa svg; svg:true menyertakan svg; revisionNo diteruskan; x-correlation-id; nol tulis DB', async () => {
    const res = await call({ address: 'Gambar 1.1', revisionNo: 3 });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-correlation-id')).toBeTruthy();
    const b = await jsonOf(res);
    expect(b).toMatchObject({ documentId: DOC, revisionNo: 3, currentRevisionNo: 4, rendered: true, figure: { pid: 'fig-chart-1', type: 'chart' } });
    expect(b.figure.svg).toBeUndefined();
    expect(b.figure.issues.map((i: any) => i.checkId)).toContain('AUTO_ORIENT');
    expect(loader.loadFigureContext).toHaveBeenCalledWith(DOC, 3);
    const withSvg = await jsonOf(await call({ pid: 'fig-chart-1', svg: true }));
    expect(withSvg.figure.svg).toContain('<svg');
    expect(dbWrites()).toEqual([]);
  });

  it('blok inline di posisi sasaran -> rendered dengan inline:true; sasaran paragraf -> 422 BLOCK_TYPE_NOT_ADMITTED', async () => {
    const b = await jsonOf(await call({ pid: 'fig-chart-1', block: inlineChart(['A', 'B', 'C']) }));
    expect(b.figure).toMatchObject({ inline: true, pid: 'fig-chart-1', data: { items: 3 } });
    const res = await call({ address: '1.1.1' });
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).code).toBe('BLOCK_TYPE_NOT_ADMITTED');
  });

  it('penolakan mesin (kode chart tak dikenal) -> 200 rendered:false + error code', async () => {
    const s = snapshot();
    s.blocks[1].content.spec.kind = 'Z-99';
    loader.loadFigureContext.mockResolvedValue({ documentId: DOC, revisionNo: 3, currentRevisionNo: 3, snapshot: s, template: EMPTY_CHART_TEMPLATE });
    const res = await call({ pid: 'fig-chart-1' });
    expect(res.status).toBe(200);
    const b = await jsonOf(res);
    expect(b.rendered).toBe(false);
    expect(b.error.code).toBe('CHART_KIND_UNKNOWN');
    expect(b.target).toMatchObject({ pid: 'fig-chart-1', type: 'chart' });
  });
});
