// W3.2: unit test proyeksi payload anonim /api/garden.
import { describe, it, expect } from 'vitest';
import { projectGardenPublic } from '@/lib/garden-public';

describe('projectGardenPublic (W3.2 whitelist anonim)', () => {
  it('mempertahankan field publik tanaman', () => {
    const out = projectGardenPublic({
      version: 3,
      lastUpdated: '2026-08-31T00:00:00Z',
      plants: [
        { id: 'p1', name: 'Monstera', emoji: '🌿', location: 'indoor', waterSchedule: 'mingguan', waterDays: [1, 4], img: 'u', tip: 't', addedBy: 'budi', addedAt: '2026-08-01' },
      ],
    } as const) as { plants: Record<string, unknown>[]; version: number };
    expect(out.version).toBe(3);
    expect(out.plants[0].name).toBe('Monstera');
    expect(out.plants[0].addedBy).toBe('budi');
  });

  it('membuang field tak dikenal di tanaman maupun level atas', () => {
    const out = projectGardenPublic({
      version: 1,
      lastUpdated: 'x',
      secretNote: 'rahasia keluarga',
      apiToken: 'tok-123',
      plants: [{ id: 'p1', name: 'A', privateNotes: 'jangan bocor', ownerId: 'user-uuid' }],
    }) as Record<string, unknown> & { plants: Record<string, unknown>[] };
    expect(out.secretNote).toBeUndefined();
    expect(out.apiToken).toBeUndefined();
    expect(out.plants[0].privateNotes).toBeUndefined();
    expect(out.plants[0].ownerId).toBeUndefined();
    expect(out.plants[0].name).toBe('A');
  });

  it('payload rusak/bukan objek → kerangka kosong (fail-closed)', () => {
    for (const bad of [null, undefined, 42, 'string', [1, 2]]) {
      expect(projectGardenPublic(bad)).toEqual({ version: 0, lastUpdated: null, plants: [] });
    }
  });

  it('plants bukan array → plants kosong', () => {
    const out = projectGardenPublic({ version: 2, plants: { hack: true } }) as { plants: unknown[] };
    expect(out.plants).toEqual([]);
  });
});
