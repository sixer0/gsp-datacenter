/**
 * SEC-FIX lanjutan (D-505): batas kapasitas figur juga berlaku di render dokumen penuh (`buildFigures`), bukan
 * hanya di rute pratinjau. Figur tersimpan sebelum batas ada (atau rujukan artefak) tidak boleh membekukan proses HQ.
 */
import { describe, expect, it, vi } from 'vitest';
import type { NormBlock, NormDocSnapshot } from '@/lib/studio/contract';

vi.mock('@/lib/studio/engine/docx/figures', () => ({
  prepareFigureStore: async (snap: { blocks: NormBlock[] }, opts: { svgFor: (b: NormBlock) => Promise<unknown> }) => {
    const out: unknown[] = [];
    for (const b of snap.blocks) out.push(await opts.svgFor(b));
    return { results: out };
  },
}));

const { buildFigures } = await import('@/lib/studio/services/render/figures');
const { InlineSpecReader, createDetachedJob } = await import('@/lib/studio/services/render/pure/job');

const chartSpec = (n: number) => ({
  $schema: 'studio.chart/v1',
  kind: 'P-02',
  title: 'Uji kapasitas',
  source: 'Sumber uji',
  widthMm: 166,
  data: { shape: 'categorical', points: Array.from({ length: n }, (_, i) => ({ label: `K${i}`, value: i + 1 })) },
});

async function run(n: number) {
  const job = createDetachedJob(['HTML']);
  const addError = vi.spyOn(job, 'addError');
  const blocks = [{ blockId: 'b1', type: 'chart', content: { spec: { artifactId: 'art-1' } }, address: '6.1.1', unitKey: '6' }] as unknown as NormBlock[];
  const snapshot = { doc: { meta: { issueDate: '2026-11-02', tier: 'NOTA' } }, numbering: {}, blocks } as unknown as NormDocSnapshot;
  const t0 = performance.now();
  const r = await buildFigures({
    snapshot,
    tpl: { params: {} } as never,
    tier: 'NOTA',
    job: job as never,
    reader: new InlineSpecReader({ 'art-1': { kind: 'CHART', spec: chartSpec(n) } }),
  });
  return { r, addError, ms: performance.now() - t0 };
}

describe('SEC-FIX lanjutan: batas kapasitas di render dokumen penuh', () => {
  it('artefak chart 5000 kategori ditolak cepat dengan FIGURE_CAPACITY, tanpa render', async () => {
    const { r, addError, ms } = await run(5000);
    expect(r.svgs).toHaveLength(0);
    expect(addError).toHaveBeenCalledTimes(1);
    expect(addError.mock.calls[0][0]).toBe('BY_CONSTRUCTION_FAILED');
    expect(String(addError.mock.calls[0][1])).toMatch(/topN|pisah|bagi/i);
    expect(ms).toBeLessThan(1000);
  });

  it('chart dalam batas tetap dirender', async () => {
    const { r, addError } = await run(12);
    expect(addError).not.toHaveBeenCalled();
    expect(r.svgs).toHaveLength(1);
  });
});
