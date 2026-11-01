/**
 * UI-02 (audit UI-01 §3.3, L26-L40): label awam editor "Format teks per peran".
 * Hanya teks tampilan; nilai yang disimpan tetap nilai kontrak (`ParaFormat`, `RunProps`).
 *
 * Batas angka mengikuti skema kontrak `contract/schema/common.schema.ts`:
 * `lineTw` 20-1440, `szHalfPt` 8-144 (= 4-72 pt), `spacingTw` -200..400 (= -10..20 pt),
 * `outlineLvl` 0-8, spasi sebelum/sesudah >= 0.
 */

/** 1 baris tunggal pada `lineRule=auto` = 240 (w:line per 240-an baris). */
export const LINE_AUTO_UNIT = 240;
const TW_PER_PT = 20;

const NUM = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const NUM1 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export type LineRule = "auto" | "exact" | "atLeast";

/**
 * Arti nilai `lineTw` untuk manusia (L26). `lineRule` kosong = diwarisi; Word memakai
 * `auto` bila aturan tidak ditulis, jadi tampilan kelipatan baris.
 * - auto: 240 -> "1,0 baris", 360 -> "1,5 baris"
 * - exact: 240 -> "tepat 12 pt"; atLeast: 240 -> "minimal 12 pt"
 */
export function formatLineSpacing(lineTw: number, lineRule: unknown): string {
  if (!Number.isFinite(lineTw)) return "";
  if (lineRule === "exact") return `tepat ${NUM.format(lineTw / TW_PER_PT)} pt`;
  if (lineRule === "atLeast") return `minimal ${NUM.format(lineTw / TW_PER_PT)} pt`;
  return `${NUM1.format(lineTw / LINE_AUTO_UNIT)} baris`;
}

/** Satuan tampil di samping kotak angka jarak baris (L26). */
export function lineSpacingUnit(lineRule: unknown): string {
  return lineRule === "exact" || lineRule === "atLeast" ? "tw (1/20 pt)" : "per 240 = 1 baris";
}

/** Twip -> teks pt ("(12 pt)"), dipakai untuk spasi/inden. */
export function twToPtLabel(tw: number): string {
  return `${NUM.format(tw / TW_PER_PT)} pt`;
}

/** Label opsi enum per medan (L27, L28, L31, L35). Kunci = nilai kontrak. */
export const ROLE_ENUM_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  lineRule: { auto: "Kelipatan baris", exact: "Tepat", atLeast: "Minimal" },
  jc: { left: "Kiri", right: "Kanan", center: "Tengah", both: "Rata kiri-kanan" },
  faceRole: {
    serif: "Baca (serif)",
    condensed: "Struktural (condensed)",
    mono: "Data (mono)",
    workbookUi: "UI lembar kerja",
    symbolGlyph: "Simbol",
  },
  u: { single: "Satu garis", none: "Tanpa garis" },
  vertAlign: { superscript: "Superskrip", subscript: "Subskrip" },
};

export function roleEnumLabel(field: string, value: string): string {
  return ROLE_ENUM_LABELS[field]?.[value] ?? value;
}

/** Bagian run teks (L37); kunci kontrak tampil kecil sebagai info sekunder. */
export const RUN_PART_LABELS: Readonly<Record<string, string>> = {
  run: "Teks utama",
  labelRun: "Teks label",
  numberRun: "Teks nomor",
  markerRun: "Teks penanda",
};

/**
 * Label awam peran (L38): label registri `?kind=roles` bila ada, selain itu kunci
 * peran dibaca sebagai kalimat ("cover.kicker" -> "Cover kicker") agar tetap terbaca.
 */
export function roleDisplayLabel(role: string, roleLabels: Readonly<Record<string, string>>): string {
  const l = roleLabels[role];
  if (l && l.trim()) return l.trim();
  const words = role
    .replace(/\./g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return words ? words[0].toUpperCase() + words.slice(1) : role;
}

/** Nama kelompok peran (prefiks kunci) dalam bahasa Indonesia (L38). */
export const ROLE_GROUP_LABELS: Readonly<Record<string, string>> = {
  body: "Badan teks",
  chapter: "Bab",
  section: "Subbab",
  part: "Bagian",
  cover: "Sampul",
  wrapper: "Pembungkus",
  front: "Halaman depan",
  toc: "Daftar isi",
  list: "Daftar",
  table: "Tabel",
  controlTable: "Tabel kendali",
  figure: "Gambar",
  caption: "Keterangan",
  signature: "Tanda tangan",
  header: "Kepala halaman",
  footer: "Kaki halaman",
  appendix: "Lampiran",
  rail: "Kolom catatan bukti",
  spacer: "Ruang kosong",
  unit: "Unit halaman",
  colophon: "Kolofon",
  sourceRegister: "Daftar sumber",
  controlSheet: "Lembar kendali",
  cell: "Sel tabel",
  aside: "Catatan samping",
  derivation: "Turunan perhitungan",
  monoBlock: "Blok teks mono",
};

export function roleGroupLabel(prefix: string): string {
  return ROLE_GROUP_LABELS[prefix] ?? prefix;
}
