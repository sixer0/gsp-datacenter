/**
 * SEC-FIX2 lanjutan (D-507): pembuatan artefak R09 (`prepareArtifact`) menjalankan cek kapasitas figur penuh,
 * termasuk batas gabungan yang tidak dapat dinyatakan skema (mis. total teks sumber diagram). Tanpa ini artefak
 * yang lolos `maxItems` per larik tersimpan lalu baru ditolak saat render (figur yang tidak pernah dapat dirender).
 */
import { describe, expect, it } from 'vitest';
import { StudioEngineError } from '@/lib/studio/contract/errors';
import { prepareArtifact } from '@/app/api/studio/artifacts/_lib/prepare';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const diagram = (sources: string[]) => ({
  $schema: 'studio.diagram/v1', family: 'graph', id: 'Gambar 1.1', title: 'Alur.', classification: 'TERBATAS', width_mm: 166,
  sources,
  nodes: range(3).map((i) => ({ id: `n${i}`, label: `N${i}`, class: {} })),
  edges: [],
});
const req = (spec: Record<string, unknown>) =>
  ({ schemaId: 'studio.diagram/v1', spec, formats: ['SVG'] }) as unknown as Parameters<typeof prepareArtifact>[0];

describe('SEC-FIX2 lanjutan: kapasitas saat artefak dibuat', () => {
  it('total teks sumber 3 x 600 karakter (tiap butir lolos skema) -> FIGURE_CAPACITY saat dibuat', async () => {
    let err: unknown;
    try {
      await prepareArtifact(req(diagram(range(3).map((i) => `${i}`.padEnd(600, 'x')))), { correlationId: 'uji' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(StudioEngineError);
    expect((err as InstanceType<typeof StudioEngineError>).code).toBe('BY_CONSTRUCTION_FAILED');
    expect((err as InstanceType<typeof StudioEngineError>).details).toMatchObject({ checkId: 'FIGURE_CAPACITY' });
  });

  it('diagram dalam batas tetap diterima', async () => {
    const p = await prepareArtifact(req(diagram(['Sumber uji, 2026.'])), { correlationId: 'uji' });
    expect(p.kind).toBe('DIAGRAM');
  });
});
