// FIX-F C6 (D-313; aturan D-288 satu aparatus, D-145/RQ-10): blok diagram dokumen yang MERUJUK artefak
// (`spec: { artifactId }`) dan membawa `keyRow` dicetak halaman dengan baris KUNCI, jadi SVG artefak tidak
// boleh menggambar baris KEY lagi (dulu hanya spec inline yang ditandai compose). Artefak mandiri / blok
// tanpa keyRow tetap menggambar KEY. Sinyal dipasang pada salinan saat build (spec artefak tidak diubah).
import { describe, expect, it, vi } from 'vitest';
import type { NormBlock, NormDocSnapshot, StudioDiagramV1 } from '@/lib/studio/contract';
import { buildDiagramSvg } from '@/lib/studio/engine/diagram/build';
import { clone, parityDiagramSpecs } from './_helpers';

// prepareFigureStore merasterisasi lewat Chromium; uji hanya memeriksa SVG yang dibangun `svgFor`.
vi.mock('@/lib/studio/engine/docx/figures', () => ({
  prepareFigureStore: async (snap: { blocks: NormBlock[] }, opts: { svgFor: (b: NormBlock) => Promise<unknown> }) => {
    const out: unknown[] = [];
    for (const b of snap.blocks) out.push(await opts.svgFor(b));
    return { results: out };
  },
}));

const { buildFigures, diagramSpecForBlock } = await import('@/lib/studio/services/render/figures');
const { InlineSpecReader, createDetachedJob } = await import('@/lib/studio/services/render/pure/job');

const GRAPH = parityDiagramSpecs().find((s) => s.spec.family === 'graph')!.spec as unknown as StudioDiagramV1;
const ART: StudioDiagramV1 = { ...clone(GRAPH), apparatus: 'page', legend: [...((GRAPH.legend ?? []) as string[]), 'garis penuh isi'] } as StudioDiagramV1;
const KEY = { runs: [{ t: 'garis penuh isi' }] };

function block(id: string, content: Record<string, unknown>): NormBlock {
  return { blockId: id, type: 'diagram', content, address: null, unitKey: '1' } as unknown as NormBlock;
}

async function svgsOf(blocks: NormBlock[]): Promise<string[]> {
  const snapshot = { doc: { meta: { issueDate: '2026-10-23', tier: 'NOTA' } }, numbering: {}, blocks } as unknown as NormDocSnapshot;
  const r = await buildFigures({
    snapshot,
    tpl: { params: {} } as never,
    tier: 'NOTA',
    job: createDetachedJob(['HTML']) as never,
    reader: new InlineSpecReader({ 'art-1': { kind: 'DIAGRAM', spec: ART } }),
  });
  return r.svgs.map((s) => s.svg);
}

describe('FIX-F C6: keyRowOnPage untuk diagram yang merujuk artefak', () => {
  it('diagramSpecForBlock: hanya rujukan artefak + keyRow yang ditandai; spec artefak tidak dimutasi', () => {
    const marked = diagramSpecForBlock(ART, { spec: { artifactId: 'art-1' }, keyRow: KEY });
    expect(marked.keyRowOnPage).toBe(true);
    expect(ART.keyRowOnPage).toBeUndefined();
    expect(diagramSpecForBlock(ART, { spec: { artifactId: 'art-1' } })).toBe(ART);
    // spec inline: tanda milik compose (D-288), tidak ditambah di sini
    expect(diagramSpecForBlock(ART, { spec: ART, keyRow: KEY })).toBe(ART);
  });

  it('buildFigures: blok artefak dengan keyRow tidak menggambar baris KEY di SVG; tanpa keyRow tetap', async () => {
    const [withKey, without] = await svgsOf([
      block('b1', { spec: { artifactId: 'art-1' }, keyRow: KEY }),
      block('b2', { spec: { artifactId: 'art-1' } }),
    ]);
    expect(without).toContain('KEY  ');
    expect(withKey).not.toContain('KEY  ');
    // sama dengan spec inline yang ditandai compose
    expect(withKey).toBe(buildDiagramSvg({ ...ART, keyRowOnPage: true }, { release: false }).svg);
  });

  it('artefak mandiri (render/artifact.ts, tanpa baris KUNCI halaman) tetap menggambar KEY', () => {
    expect(buildDiagramSvg(ART, { release: false }).svg).toContain('KEY  ');
  });
});
