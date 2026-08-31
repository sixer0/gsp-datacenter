/**
 * W3.2 (F-SEC-006 sisa, 31-08-2026): proyeksi payload anonim /api/garden.
 *
 * Blob garden adalah dashboard tanaman bersama (konsumen eksternal: dashboard
 * Marwa membaca jsonblob yang sama). Handler GET tidak boleh jadi proxy mentah:
 * field apa pun yang kelak masuk blob (catatan pribadi, tautan privat, token)
 * otomatis TERFILTER dari jalur anonim. Daftar putih = tepat field yang dirender
 * halaman /garden (src/app/garden/page.tsx interface Plant).
 */
export const PUBLIC_PLANT_FIELDS = [
  'id', 'name', 'emoji', 'location', 'waterSchedule', 'waterDays',
  'img', 'tip', 'addedBy', 'addedAt',
] as const;

export function projectGardenPublic(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    // bentuk tak dikenal → jangan bocorkan apa pun
    return { version: 0, lastUpdated: null, plants: [] };
  }
  const d = data as Record<string, unknown>;
  const plants = Array.isArray(d.plants) ? d.plants : [];
  return {
    version: typeof d.version === 'number' ? d.version : 0,
    lastUpdated: typeof d.lastUpdated === 'string' ? d.lastUpdated : null,
    plants: plants.map((p) => {
      const out: Record<string, unknown> = {};
      if (typeof p === 'object' && p !== null) {
        for (const f of PUBLIC_PLANT_FIELDS) {
          if (f in (p as Record<string, unknown>)) out[f] = (p as Record<string, unknown>)[f];
        }
      }
      return out;
    }),
  };
}
