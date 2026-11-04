/**
 * S22: nilai harapan modul structure_b (research/32 §2 CR-1, §5, §6, §7; research/31 §4.4, §4.5).
 *
 * Satu-satunya tempat string per bahasa dan konstanta geometri/warna/fon modul ini. Aturan
 * memilih entri lewat `pair.language`, tidak pernah lewat slug templat (D-595).
 */
import type { Lang } from "./types";

/** U+00A0 dan U+2014 ditulis lewat kode titik agar tidak bergantung pada penyunting. */
export const NBSP = String.fromCharCode(0xa0);
export const EM_DASH = String.fromCharCode(0x2014);

export interface LanguageExpect {
  /** Awalan sel kiri pita segel sebelum klasifikasi (research/31 §4.4). */
  readonly sealLeftPrefix: string;
  /** Sel kanan pita segel bawaan (bila tanpa `meta.copyControl`). */
  readonly sealRight: string;
  /** Kata blok register sel 3 (research/31 §4.5): `LEMBAR n DARI N` / `SHEET n OF N`. */
  readonly sheetWord: string;
  readonly ofWord: string;
  /** Kata bab di running head (`BAB <kunci>` / `CHAPTER <kunci>`, research/32 RH-01). */
  readonly chapterWord: string;
  /** Format cap terbit (research/32 IS-01). */
  readonly issueStamp: RegExp;
}

export const LANG_EXPECT: Readonly<Record<Lang, LanguageExpect>> = {
  ID: {
    sealLeftPrefix: "KLASIFIKASI · ",
    sealRight: "SALINAN INDUK · PENGGUNAAN INTERNAL GSP",
    sheetWord: "LEMBAR",
    ofWord: "DARI",
    chapterWord: "BAB",
    issueStamp: /^\/\/ (\d{8}) (ID|EN) ([A-Z]) -- TERBITAN (\d+)$/,
  },
  EN: {
    sealLeftPrefix: "CLASSIFICATION · ",
    sealRight: "MASTER COPY · GSP INTERNAL USE",
    sheetWord: "SHEET",
    ofWord: "OF",
    chapterWord: "CHAPTER",
    issueStamp: /^\/\/ (\d{8}) (ID|EN) ([A-Z]) -- ISSUE (\d+)$/,
  },
};

/**
 * Kicker pembuka bab dari kedua bahasa (pola LB-03), tanpa beda besar-kecil agar kicker yang
 * kehilangan caps tetap dikenali dan gagal di GF-07; bahasanya sendiri dinilai LB-03 (S23).
 */
export const CHAPTER_KICKER = /^(BAB|CHAPTER) (\S+)$/i;

/** Skema ANRI (research/32 CR-1 butir 2; `src/lib/studio/params/apparatus.ts:277`). */
export const ANRI_LEVELS: readonly string[] = ["BIASA", "TERBATAS", "RAHASIA", "SANGAT RAHASIA"];
/** Padanan Inggris (EG-50 EN:627-634) dan derajat kecepatan (DT-28e) yang dilarang di lokasi klasifikasi. */
export const FORBIDDEN_CLASSIFICATION: readonly string[] = [
  "RESTRICTED",
  "CONFIDENTIAL",
  "SECRET",
  "TOP SECRET",
  "OFFICIAL",
  "UNCLASSIFIED",
  "SEGERA",
  "SANGAT SEGERA",
  "KILAT",
  "URGENT",
];

/** `<org>` bawaan sel 1 register (`header-footer.ts:271`). */
export const REGISTER_ORG = "GSP";
/** Entitas running head (`header-footer.ts:111`); dibandingkan tanpa beda besar-kecil. */
export const RUNNING_HEAD_ENTITY = "PT GEMILANG SATRIA PERKASA";
export const REGISTER_DATE = /^\d{2}-(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)-\d{4}$/;
export const ROMAN_MONTHS: readonly string[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Warna (research/32 §0.4, toleransi +-3 per kanal lewat `colorNear`). */
export const COLOR = {
  seal: "6E1420",
  ink900: "101418",
  ink400: "6B7783",
  ink200: "C3CBD1",
  signal: "B45309",
  sealText: "F4F5F6",
} as const;

/** Warna pensiun (GF-12). */
export const RETIRED_COLORS: readonly string[] = ["1A2B4A", "C9A84C"];

/** Geometri dalam twip / EMU (research/32 §7; 1 mm = 56,693 tw = 36.000 EMU). */
export const GEOMETRY = {
  pageW: 11906,
  pageH: 16838,
  pageTol: 2,
  marginLeft: 1361,
  marginRight: 1134,
  marginTol: 28,
  interiorTop: 1474,
  interiorBottom: 1361,
  interiorHeader: 737,
  interiorFooter: 737,
  hfTol: 57,
  /** Lebar teks 166 mm. */
  textWidth: 9411,
  textWidthTol: 28,
  /** Batas lebar unsur (GF-10): 166,5 mm dalam EMU dan twip, `pct` 100 %. */
  maxExtentEmu: 5_994_000,
  maxTableTw: 9439,
  maxTablePct: 5000,
  /** Lebar gambar isi 128 / 166 mm (GF-11) dan Datum Rule 128 mm (DV-01). */
  figureWidthsEmu: [4_608_000, 5_976_000] as readonly number[],
  datumRuleEmu: 4_608_000,
  emuTol: 18_000,
  /** Tinggi pita segel 5 mm (SB-02). */
  sealBandHeight: 283,
  sealBandHeightTol: 28,
} as const;

/** Garis (w:sz garis = 1/8 pt): RH-03 0,26 mm = 6, RB-05 atas 0,35 mm = 8, bawah 0,20 mm = 5/6, lantai GF-09 = 5. */
export const RULE_SIZE = {
  runningHead: 6,
  registerTop: 8,
  registerBottom: [5, 6] as readonly number[],
  tol: 1,
  floor: 5,
} as const;

/** Ukuran run (setengah poin): badan 9,5 pt = 19, kicker bab 6,8 pt = 14 (GF-06, GF-07). */
export const RUN_SIZE = { body: 19, chapterKicker: 14, tol: 1 } as const;
/** Spasi baris badan 13,5 pt = 270 tw (GF-06). */
export const BODY_LINE = { line: 270, tol: 5, rules: ["exact", "atLeast"] as readonly string[] } as const;

/** Fon yang dilarang sebagai fon badan (GF-04). */
export const BANNED_FONTS = /^(calibri|times new roman|aptos|arial)\b/i;

/** Kelas wajah Plex (research/32 §0.4 "Fon"). */
export function isSerifFont(name: string | undefined): boolean {
  return !!name && name.includes("IBM Plex Serif");
}
