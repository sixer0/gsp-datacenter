/**
 * Predikat wajah fon bersama untuk modul structure_a dan structure_b (B-1).
 *
 * Cond: R0 menulis "memuat `Condensed`" (research/32 §0.4 "Fon"). Mesin menanam wajah yang sama
 * dengan nama keluarga pendek `IBM Plex Sans Cond` (Manual 000, datum-gsp; D-602) dan nama panjang
 * `IBM Plex Sans Condensed` (datum-kanonik); keduanya diterima sebagai wajah Plex terkondensasi.
 * Satu sumber ini menggantikan daftar penanda `COND_FONT_MARKERS` di structure_a dan fungsi
 * `isCondFont` di structure_b, agar kedua modul tidak berselisih tentang nama wajah.
 */
export function isCondFont(name: string | undefined): boolean {
  return !!name && (name.includes("Condensed") || /\bIBM Plex Sans Cond\b/.test(name));
}
