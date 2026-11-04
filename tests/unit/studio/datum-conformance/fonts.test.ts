/**
 * B-1: satu penanda wajah Cond bersama untuk modul structure_a dan structure_b.
 * Seam: `isCondFont` dari `rules/fonts.ts`. Harapan dari R0 "Fon" (research/32 §0.4) dan D-602
 * (alias `IBM Plex Sans Cond`, Manual 000 ID:4430), bukan dari kode penanda.
 */
import { describe, expect, it } from 'vitest';
import { isCondFont } from '../../../../benchmark/datum_conformance/rules/fonts';

describe('isCondFont (penanda Cond bersama)', () => {
  it.each(['IBM Plex Sans Condensed', 'IBM Plex Sans Cond'])('menerima %s', (name) => {
    expect(isCondFont(name)).toBe(true);
  });

  it.each(['Arial', 'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono', 'Calibri', 'IBM Plex Sans Conduit', ''])('menolak %j', (name) => {
    expect(isCondFont(name)).toBe(false);
  });

  it('menolak nama kosong atau tidak ada', () => {
    expect(isCondFont(undefined)).toBe(false);
  });
});
