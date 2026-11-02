/**
 * SEC-FIX2 N-1 (D-506): render artefak mandiri R09 (`renderArtifactImpl`) menjalankan cek kapasitas figur yang sama
 * dengan pratinjau/render dokumen SEBELUM job dibuat dan sebelum mesin dipanggil. Spec v1 besar yang tersimpan
 * (sebelum `maxItems` v1 ada) ditolak cepat dengan 422 `BY_CONSTRUCTION_FAILED` + `details.checkId = FIGURE_CAPACITY`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  row: null as unknown,
  createRenderJob: vi.fn(() => {
    throw new Error('job tidak boleh dibuat untuk figur di atas batas');
  }),
}));

vi.mock('@/lib/studio/services/render/db', () => ({
  db: async () => ({ studioArtifact: { findUnique: async () => h.row } }),
}));
vi.mock('@/lib/studio/services/render/job', async (orig) => ({ ...(await orig<object>()), createRenderJob: h.createRenderJob }));

const { renderArtifactImpl } = await import('@/lib/studio/services/render/artifact');
const { StudioEngineError } = await import('@/lib/studio/contract/errors');

const caller = { kind: 'ADMIN_SESSION', requester: 'uji', agentId: null } as never;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const artifact = (kind: 'CHART' | 'DIAGRAM', spec: unknown) => ({
  id: 'art-1', kind, spec, title: 'Uji', label: null, missionFolder: 'm', createdAt: new Date('2026-11-02'), createdBy: 'uji', templateVersion: null,
});
const chartV1 = (n: number) => ({
  $schema: 'studio.chart/v1', kind: 'P-02', title: 'Beban', source: 'Uji', widthMm: 166,
  data: { shape: 'categorical', points: range(n).map((i) => ({ label: `K${String(i).padStart(6, '0')}`, value: ((i * 37) % 101) + 1 })) },
});
const diagramV1 = (zones: number) => ({
  $schema: 'studio.diagram/v1', family: 'graph', id: 'Gambar 1.1', title: 'Alur.', classification: 'TERBATAS', width_mm: 166, sources: ['s'],
  nodes: range(5).map((i) => ({ id: `n${i}`, label: `N${i}`, class: {} })), edges: [],
  zones: range(zones).map((i) => ({ id: `z${i}`, label: `Z${i}`, members: ['n0'] })),
});

async function rejection(fn: () => Promise<unknown>): Promise<{ err: InstanceType<typeof StudioEngineError>; ms: number }> {
  const t0 = performance.now();
  try {
    await fn();
  } catch (err) {
    if (err instanceof StudioEngineError) return { err, ms: performance.now() - t0 };
    throw err;
  }
  throw new Error('tidak ditolak');
}

beforeEach(() => {
  h.createRenderJob.mockClear();
});

describe('SEC-FIX2 N-1: R09 render artefak memeriksa kapasitas sebelum job/mesin', () => {
  it('artefak CHART v1 P-02 3000 titik -> BY_CONSTRUCTION_FAILED FIGURE_CAPACITY < 1 s, tanpa job', async () => {
    h.row = artifact('CHART', chartV1(3000));
    const { err, ms } = await rejection(() => renderArtifactImpl('art-1', ['SVG'], caller));
    expect(err.code).toBe('BY_CONSTRUCTION_FAILED');
    expect(err.details).toMatchObject({ checkId: 'FIGURE_CAPACITY', issues: [expect.objectContaining({ pointer: '/data/points', keyword: 'maxItems', actual: 3000 })] });
    expect(h.createRenderJob).not.toHaveBeenCalled();
    expect(ms).toBeLessThan(1000);
  });

  it('artefak DIAGRAM v1 dengan 10000 zona -> FIGURE_CAPACITY tanpa job (bukan OOM)', async () => {
    h.row = artifact('DIAGRAM', diagramV1(10000));
    const { err, ms } = await rejection(() => renderArtifactImpl('art-1', ['SVG'], caller));
    expect(err.code).toBe('BY_CONSTRUCTION_FAILED');
    expect((err.details as { issues: Array<{ pointer: string }> }).issues.map((i) => i.pointer)).toContain('/zones');
    expect(h.createRenderJob).not.toHaveBeenCalled();
    expect(ms).toBeLessThan(1000);
  });

  it('artefak dalam batas lolos cek kapasitas dan sampai ke pembuatan job', async () => {
    h.row = artifact('CHART', chartV1(12));
    await expect(renderArtifactImpl('art-1', ['SVG'], caller)).rejects.toThrow('job tidak boleh dibuat');
    expect(h.createRenderJob).toHaveBeenCalledTimes(1);
  });
});
