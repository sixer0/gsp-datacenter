/**
 * S21: nilai harapan modul structure_a (CV, CS, TR) per bahasa, diambil dari register nama S01
 * (`research/31_datum_rev_a_names_register.md`) dan katalog S02 (`research/32` §3, §4, §9).
 *
 * Satu tabel per bahasa; aturan memilih baris lewat `ctx.pair.language`, tidak pernah lewat slug
 * templat. Kicker sampul tidak ada di sini: nilainya datang dari `ctx.pair.kicker` (register 31 §1
 * lewat `lib/pairs.ts`).
 */
import type { Lang, Tier } from "./types";

export type CoverField = "number" | "rev" | "author" | "custodian" | "audience" | "tier";
export type ControlBlockKind = "revision" | "verification" | "method" | "distribution";

export interface StructureAExpect {
  /** Kicker lembar kendali (31 §4.2; `ID:23`, `EN:23`). */
  readonly controlSheetKicker: string;
  /** Judul blok lembar kendali, pola `<huruf> · <judul>` (31 §4.2; `texts.ts:23-26, 43-45`). */
  readonly blockTitles: Readonly<Record<ControlBlockKind, string>>;
  /** Kepala kolom tabel lembar kendali (31 §4.2). */
  readonly columns: Readonly<Record<Exclude<ControlBlockKind, "method">, readonly string[]>>;
  /**
   * Label blok kendali sampul per medan (31 §4.1 mode auto dan §4.3 label klien MCP).
   * EN `author` menerima label sekarang (`Author`) dan target (`Prepared by`): CV-13 memetakan medan,
   * kebenaran label sendiri dinilai LB-01 (modul language).
   */
  readonly coverLabels: Readonly<Record<CoverField, readonly string[]>>;
  /** Peran tanda tangan (31 §4.3; sekarang dan target D-590), dipakai untuk mengenali blok tanda tangan. */
  readonly signatureRoles: readonly string[];
}

export const STRUCTURE_A_EXPECT: Readonly<Record<Lang, StructureAExpect>> = {
  ID: {
    controlSheetKicker: "Lembar Kendali",
    blockTitles: {
      revision: "Riwayat revisi",
      verification: "Rantai verifikasi",
      method: "Pernyataan metode",
      distribution: "Distribusi terkendali",
    },
    columns: {
      revision: ["Rev", "Tanggal", "Uraian", "Oleh"],
      verification: ["Lapis", "Peran", "Nama", "Tanggal"],
      distribution: ["Salinan", "Pemegang"],
    },
    coverLabels: {
      number: ["Nomor dokumen"],
      rev: ["Revisi"],
      author: ["Penyusun"],
      custodian: ["Kustodian"],
      audience: ["Ditujukan kepada"],
      tier: ["Tier"],
    },
    signatureRoles: ["Disusun", "Diperiksa", "Disetujui"],
  },
  EN: {
    controlSheetKicker: "Control Sheet",
    blockTitles: {
      revision: "Revision history",
      verification: "Verification chain",
      method: "Method statement",
      distribution: "Controlled distribution",
    },
    columns: {
      revision: ["Rev", "Date", "Change", "Prepared by"],
      verification: ["Layer", "Role", "Name", "Date"],
      distribution: ["Copy", "Holder"],
    },
    coverLabels: {
      number: ["Document number"],
      rev: ["Revision"],
      author: ["Prepared by", "Author"],
      custodian: ["Custodian"],
      audience: ["Addressed to"],
      tier: ["Tier"],
    },
    signatureRoles: ["Prepared by", "Reviewed by", "Approved by", "Prepared", "Checked", "Approved"],
  },
};

/** Urutan blok lembar kendali (research/32 CS-03; `texts.ts:37-45`). */
export const CONTROL_BLOCK_ORDER: readonly ControlBlockKind[] = ["revision", "verification", "method", "distribution"];

/** Urutan medan inti blok kendali sampul (research/32 CV-13; `page.ts:368-377`). */
export const COVER_CORE_ORDER: readonly CoverField[] = ["number", "rev", "author", "custodian", "audience"];
export const COVER_REQUIRED_FIELDS: readonly CoverField[] = ["number", "rev", "author"];

/** Nama tier tetap Indonesia di kedua bahasa (research/32 TR-04; `EN:447`). */
export const TIER_NAMES: readonly Tier[] = ["NOTA", "TERBIT", "SERAH"];

/** Baris alamat sampul, sah di ID dan EN (31 §4.6; `page.ts:401`). */
export const COVER_ADDRESS =
  "Divisi Engineering & Technical Intelligence · Jl. Bangka Raya No. 27, Pela Mampang, Jakarta Selatan 12720 · Tel. (021) 22715320";

/** Kolofon kiri, sah di ID dan EN (31 §4.6; `page.ts:444-445`; `texts.ts:202-210`). */
export const COLOPHON_LEFT = "PT GEMILANG SATRIA PERKASA · NIB 9120208940517";

/** Nomor salinan di sel kanan pita segel (research/32 CS-10). */
export const COPY_NUMBER_RE = /\b(SALINAN|COPY)\s+(\d+)\b/;

// Geometri sampul (research/32 §3; 1 mm = 36.000 EMU, 1 mm = 56,693 tw).
export const LOGO_CX_MIN = 1_584_000;
export const LOGO_CX_MAX = 1_656_000;
export const LOGO_CX_TOL = 3_600;
export const RULE_CX = 5_976_000;
export const RULE_CX_TOL = 18_000;
/** Tinggi Datum Rule < 10 mm. */
export const RULE_CY_MAX = 360_000;
/** Margin kiri sampul 24 mm = 1361 tw, toleransi 0,5 mm (CV-18). */
export const COVER_LEFT_TW = 1361;
export const COVER_LEFT_TOL = 28;

/**
 * Penanda wajah fon (R0 "Fon", research/32 §0.4): Seri = memuat `IBM Plex Serif`, Mono = memuat
 * `IBM Plex Mono`. Wajah Cond memakai predikat bersama `isCondFont` di `./fonts` (B-1, D-602).
 */
export const SERIF_FONT_MARKERS: readonly string[] = ["IBM Plex Serif"];
export const MONO_FONT_MARKERS: readonly string[] = ["IBM Plex Mono"];
