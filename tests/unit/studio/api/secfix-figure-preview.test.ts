// SEC-FIX (D-501 M-1 + L-1, D-502 Low 10/11): pratinjau figur
// - M-1: kardinalitas data dibatasi SEBELUM render (blok inline: skema v2 maxItems -> 400; figur tersimpan / produk
//   matriks / total panel / diagram: pra-cek route -> 422 BY_CONSTRUCTION_FAILED FIGURE_CAPACITY), cepat (< 1 s);
//   render lewat renderGate() (antrean penuh -> 503 RENDER_QUEUE_FULL + Retry-After).
// - L-1: kuota (bucket render) ditagih SEBELUM validasi skema: badan tidak sah berulang -> 429.
// - Laporan: INTENT_APPLIED = info (layoutIssueCount tidak naik karena topN), dan kode/arah/jumlah butir yang
//   DIRENDER (sesudah AUTO_ORIENT/topN) dilaporkan di samping masukan.
/* eslint-disable @typescript-eslint/no-explicit-any -- badan JSON bebas bentuk */
import './_env';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const loader = vi.hoisted(() => ({ loadFigureContext: vi.fn() }));
vi.mock('@/lib/prisma', async () => (await import('./_prisma')).prismaModule());
vi.mock('@/app/api/studio/documents/[id]/figures/preview/_lib/load', () => loader);

import { dbWrites, resetDb } from './_prisma';
import { jsonOf, params, req } from './_studio';
import { EMPTY_CHART_TEMPLATE } from '@/lib/studio/engine/chart/core';
import { resetRenderRateLimiter } from '@/lib/studio/http/render-guard';
import { renderGate, resetRenderGate } from '@/lib/studio/services/render';
import { INFO_CODES } from '@/app/api/studio/documents/[id]/figures/preview/_lib/figure';
import { POST } from '@/app/api/studio/documents/[id]/figures/preview/route';

const DOC = 'cmvdoc000000000000secfix1';
const pts = (n: number, long = false) => Array.from({ length: n }, (_, i) => ({ label: long ? `Unit pembangkit wilayah barat nomor ${i + 1}` : `K${i + 1}`, value: ((i * 37) % 101) + 1 }));
const chartSpec = (n: number, extra: Record<string, unknown> = {}) => ({ $schema: 'studio.chart/v1', kind: 'P-02', title: 'Beban', source: 'Uji', widthMm: 166, id: 'Gambar 1.1', data: { shape: 'categorical', points: pts(n) }, ...extra });
const DIAGRAM = (n: number) => ({
  $schema: 'studio.diagram/v1', family: 'graph', id: 'Gambar 1.2', title: 'Graf.', classification: 'TERBATAS', width_mm: 166, sources: ['sumber'],
  nodes: Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: `Simpul ${i}`, class: { col: i % 4, row: Math.floor(i / 4) } })),
  edges: Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}`, kind: 'flow', label: '' })),
});

const FLOW = { $schema: 'studio.diagram/v1', family: 'flow', id: 'Gambar 1.2', title: 'Alur.', classification: 'TERBATAS', width_mm: 166, sources: ['sumber'], nodes: [{ id: 'a', label: 'A', class: {} }] };

function snapshot(chart: unknown = chartSpec(8), diagram: unknown = FLOW): any {
  return {
    schema: 'studio.norm/v2',
    doc: { meta: { title: 'Uji', classification: 'TERBATAS' }, chapters: [] },
    units: [], skeleton: { slots: [] }, numbering: {}, register: {},
    blocks: [
      { blockId: 'fig-chart-1', pid: 'fig-chart-1', slotKey: 'content', address: '1.1.2', artifactLabel: 'Gambar 1.1', ordinal: 2, unitKey: '1', type: 'chart', content: { type: 'chart', spec: chart }, textPlain: '', contentSha256: '' },
      { blockId: 'fig-diag-1', pid: 'fig-diag-1', slotKey: 'content', address: '1.1.3', artifactLabel: 'Gambar 1.2', ordinal: 3, unitKey: '1', type: 'diagram', content: { type: 'diagram', spec: diagram }, textPlain: '', contentSha256: '' },
    ],
    compose: { v: 1, skeleton: { slots: [] }, tier: 'TERBIT', params: { 'chart.output.widthMm': 166 }, slotParams: {} },
  };
}
const ctxWith = (s: any) => ({ documentId: DOC, revisionNo: 3, currentRevisionNo: 3, snapshot: s, template: EMPTY_CHART_TEMPLATE });
const inline = (n: number, extra: Record<string, unknown> = {}) => ({ type: 'chart', code: 'P-02', data: { shape: 'categorical', points: pts(n) }, caption: { text: 'Beban' }, source: { text: 'Uji' }, ...extra });
const call = async (body: unknown) => POST(await req(`/api/studio/documents/${DOC}/figures/preview`, { auth: "agent", body }), params({ id: DOC }));

beforeEach(() => {
  resetDb();
  resetRenderRateLimiter();
  resetRenderGate();
  loader.loadFigureContext.mockReset();
  loader.loadFigureContext.mockResolvedValue(ctxWith(snapshot()));
});
afterEach(() => {
  delete process.env.STUDIO_RENDER_MAX_CONCURRENT;
  delete process.env.STUDIO_RENDER_MAX_QUEUED;
  resetRenderGate();
});

describe('SEC-FIX M-1: batas kardinalitas sebelum render', () => {
  it('blok inline 5000 kategori (probe peninjau) -> 400 SCHEMA_INVALID maxItems, cepat, tanpa memuat revisi', async () => {
    const t0 = Date.now();
    const res = await call({ block: inline(5000) });
    const ms = Date.now() - t0;
    expect(res.status).toBe(400);
    const b = await jsonOf(res);
    expect(b.code).toBe('SCHEMA_INVALID');
    expect(JSON.stringify(b.details)).toContain('/block/data/points');
    expect(JSON.stringify(b.details)).toContain('maxItems');
    expect(ms).toBeLessThan(1000);
    expect(loader.loadFigureContext).not.toHaveBeenCalled();
  });

  it('blok inline tepat di batas (200 kategori) tetap lolos skema dan dirender', async () => {
    const res = await call({ block: inline(200, { topN: 10 }) });
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).rendered).toBe(true);
  });

  it('figur TERSIMPAN 5000 kategori (dibuat sebelum batas skema) -> 422 BY_CONSTRUCTION_FAILED FIGURE_CAPACITY, < 1 s, tanpa render', async () => {
    loader.loadFigureContext.mockResolvedValue(ctxWith(snapshot(chartSpec(5000))));
    const t0 = Date.now();
    const res = await call({ pid: 'fig-chart-1' });
    const ms = Date.now() - t0;
    expect(res.status).toBe(422);
    const b = await jsonOf(res);
    expect(b.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(b.details).toMatchObject({ checkId: 'FIGURE_CAPACITY' });
    expect(b.details.issues[0]).toMatchObject({ pointer: '/data/points', keyword: 'maxItems', limit: 200, actual: 5000 });
    expect(b.error).toMatch(/topN/);
    expect(ms).toBeLessThan(1000);
    expect(dbWrites()).toEqual([]);
  });

  it('matriks: sel baris x kolom di atas batas -> 422 walau tiap sumbu di bawah batas', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => `B${i}`);
    const cols = Array.from({ length: 100 }, (_, i) => `K${i}`);
    const spec = { $schema: 'studio.chart/v1', kind: 'H-06', title: 'Peta', source: 'Uji', widthMm: 166, data: { shape: 'matrix', rows, cols, values: rows.map(() => cols.map(() => 1)) } };
    loader.loadFigureContext.mockResolvedValue(ctxWith(snapshot(spec)));
    const res = await call({ pid: 'fig-chart-1' });
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).details.issues.map((i: any) => i.pointer)).toContain('/data/values');
  });

  it('diagram tersimpan 60 simpul -> 422 FIGURE_CAPACITY tanpa render (graf 48 simpul = 8-12 s di mesin)', async () => {
    loader.loadFigureContext.mockResolvedValue(ctxWith(snapshot(chartSpec(8), DIAGRAM(60))));
    const t0 = Date.now();
    const res = await call({ pid: 'fig-diag-1' });
    expect(res.status).toBe(422);
    expect((await jsonOf(res)).details.issues[0]).toMatchObject({ pointer: '/nodes', limit: 24, actual: 60 });
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('render lewat renderGate(): antrean penuh -> 503 RENDER_QUEUE_FULL + Retry-After, tanpa render', async () => {
    process.env.STUDIO_RENDER_MAX_CONCURRENT = '1';
    process.env.STUDIO_RENDER_MAX_QUEUED = '0';
    resetRenderGate();
    let release!: () => void;
    const busy = renderGate().run(() => new Promise<void>((r) => (release = r)));
    const res = await call({ pid: 'fig-chart-1' });
    expect(res.status).toBe(503);
    expect((await jsonOf(res)).code).toBe('RENDER_QUEUE_FULL');
    expect(res.headers.get('retry-after')).toBeTruthy();
    release();
    await busy;
    expect((await call({ pid: 'fig-chart-1' })).status).toBe(200);
    expect(renderGate().stats().running).toBe(0);
  });
});

describe('SEC-FIX L-1: tagihan kuota sebelum validasi skema', () => {
  it('31 badan tidak sah dalam satu jendela -> 30 x 400 lalu 429 RATE_LIMITED (validasi tidak gratis)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await call({ pid: 'fig-chart-1', render: true })).status);
    expect(statuses.slice(0, 30).every((s) => s === 400)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(loader.loadFigureContext).not.toHaveBeenCalled();
  });

  it('agentId bukan string -> 400 tanpa tagihan (sama dengan R16 PATCH)', async () => {
    const res = await call({ pid: 'fig-chart-1', agentId: 5 });
    expect(res.status).toBe(400);
  });
});

describe('SEC-FIX laporan pratinjau: info dan hasil render', () => {
  it('INTENT_APPLIED (dan CAPACITY_ADAPT) = info: topN yang diterapkan tidak menaikkan layoutIssueCount', async () => {
    expect(INFO_CODES.has('INTENT_APPLIED')).toBe(true);
    expect(INFO_CODES.has('CAPACITY_ADAPT')).toBe(true);
    const b = await jsonOf(await call({ block: inline(12, { topN: 5 }) }));
    const applied = b.figure.issues.filter((i: any) => i.checkId === 'INTENT_APPLIED');
    expect(applied.length).toBeGreaterThan(0);
    for (const i of applied) expect(i.info).toBe(true);
    expect(b.figure.layoutIssueCount).toBe(b.figure.issues.filter((i: any) => !i.info).length);
  });

  it('topN: masukan 12 butir, dirender 6 (5 + Lainnya); kode masukan = kode render bila tanpa putar', async () => {
    const b = await jsonOf(await call({ block: inline(12, { topN: 5 }) }));
    expect(b.figure.data).toMatchObject({ shape: 'categorical', items: 12 });
    expect(b.figure.rendered).toMatchObject({ code: 'P-02', orientation: 'vertical', items: 6 });
  });

  it('AUTO_ORIENT: masukan P-02 label panjang, dirender P-01 horizontal; kode masukan tetap P-02', async () => {
    const b = await jsonOf(await call({ block: { ...inline(8), data: { shape: 'categorical', points: pts(8, true) } } }));
    expect(b.figure.issues.map((i: any) => i.checkId)).toContain('AUTO_ORIENT');
    expect(b.figure.code).toBe('P-02');
    expect(b.figure.rendered).toMatchObject({ code: 'P-01', orientation: 'horizontal', items: 8 });
  });

  it('orientation horizontal (maksud) -> dirender P-01; diagram -> rendered null', async () => {
    const b = await jsonOf(await call({ block: inline(6, { orientation: 'horizontal' }) }));
    expect(b.figure.rendered).toMatchObject({ code: 'P-01', orientation: 'horizontal', items: 6 });
    const d = await jsonOf(await call({ pid: 'fig-diag-1' }));
    expect(d.figure.rendered).toBeNull();
  });
});
