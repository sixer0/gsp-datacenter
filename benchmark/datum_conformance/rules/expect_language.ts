/**
 * S23: tabel harapan bahasa untuk modul aturan `language` (satu-satunya sumber nilai per bahasa).
 *
 * Semua nilai dikutip dari register S01 (`research/31`) dan katalog S02 (`research/32`); aturan
 * di `language.ts` hanya membaca tabel ini menurut `pair.language` dan `pair.typeCode`, tidak
 * pernah bercabang pada slug templat.
 *
 * Kosakata dipakai dua arah: sebagai harapan untuk bahasa dokumen, dan sebagai daftar penanda
 * bahasa lain untuk CR-4, AC6-03, dan detektor bentrok X-01.
 */
import type { Lang } from "./types";

/** Token bahasa: kata/frasa utuh, peka huruf (research/31 §6 semantik 1-2). */
export interface LangToken {
  readonly text: string;
  /** `register` = hanya dihitung di sel tabel register (mis. `OF`, research/31 §6 daftar cermin). */
  readonly where?: "register";
}

const tok = (...xs: string[]): LangToken[] => xs.map((text) => ({ text }));

/** Daftar tertutup kode jenis Rev A tanpa DS dengan NDA, urutan Tabel 3.1 (research/31 §3.1). */
export const TYPE_CODES: readonly string[] = ["PT", "KT", "RAB", "SPH", "SP", "BA", "NDA", "DEK", "LAP", "MAT", "STD", "NOT", "MOD", "VER"];

export const ROMAN_MONTHS: readonly string[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Pola nomor dokumen CR-2 (research/32 §2 CR-2 butir 2). Grup: 1 kode, 2 bulan Romawi, 3 tahun. */
export const DOC_NUMBER_RE = new RegExp(`^(?:\\d{3,}|XXX)/GSP/(${TYPE_CODES.join("|")})/(${ROMAN_MONTHS.join("|")})/(\\d{4})$`);

/** Bentuk longgar nomor untuk diagnosis (kode apa pun, awalan apa pun). */
export const DOC_NUMBER_LOOSE_RE = /^(?:([A-Z]{1,2})\/)?(\d+|X+)\/([A-Z]+)\/([A-Z]+)\/([IVX]+)\/(\d{4})$/;

/** Awalan klasifikasi lama yang dilarang di depan nomor (research/32 §2 CR-2 butir 3). */
export const FORBIDDEN_NUMBER_PREFIXES: readonly string[] = ["SR", "R", "T", "B"];

/** Kicker sampul per kode jenis (research/31 §1); dipakai X-02/X-03. */
export const KICKERS_BY_TYPE: Readonly<Record<string, Readonly<Record<Lang, string>>>> = {
  PT: { ID: "PROPOSAL TEKNIS", EN: "TECHNICAL PROPOSAL" },
  LAP: { ID: "LAPORAN", EN: "REPORT" },
  VER: { ID: "LAPORAN VERIFIKASI", EN: "VERIFICATION REPORT" },
  STD: { ID: "STANDAR", EN: "STANDARD" },
  NOT: { ID: "NOTA INTERNAL", EN: "INTERNAL NOTE" },
};

export interface NumberConvention {
  /** Pola terlarang pada teks sumber (research/32 §2 CR-3 butir 2/3). */
  readonly forbidden: readonly { readonly re: RegExp; readonly why: string; readonly exemptByAllowLine?: boolean }[];
  /** Baris yang membebaskan pola `exemptByAllowLine` (ID: lampiran berkonvensi Inggris, `ID:2005-2006`). */
  readonly allowIdrLine?: string;
  /** String harapan fiksur B-FIX (research/32 §10), byte-exact. */
  readonly bfixExpected: readonly string[];
}

export interface LanguageExpectation {
  /** Kata sel ke-3 register (research/31 §4.5). */
  readonly registerWords: readonly [string, string];
  /** Awalan sel kiri pita segel dan teks sel kanan bawaan (research/31 §4.4). */
  readonly sealLeftPrefix: string;
  readonly sealRightDefault: string;
  /** Kata cap terbit sesudah ` -- ` (research/31 §4.4). */
  readonly issueWord: string;
  readonly controlSheetKicker: string;
  readonly tocTitle: string;
  /** Label penyusun blok kendali (research/31 §4.1, §4.3). */
  readonly preparerLabel: string;
  readonly revisionLabel: string;
  readonly numberLabel: string;
  /** Himpunan label blok kendali sampul sah: mode auto §4.1 ∪ klien MCP §4.3. */
  readonly coverControlLabels: readonly string[];
  /** Peran tanda tangan klien MCP (research/31 §4.3; D-590). */
  readonly signatureRoles: readonly string[];
  /** Peran rantai verifikasi klien MCP (research/31 §4.3). */
  readonly verificationRoles: readonly string[];
  /** Catatan revisi bawaan klien MCP (research/31 §4.3). */
  readonly firstIssueNote: string;
  /** Kepala kolom pertama tabel rantai verifikasi (research/31 §4.2). */
  readonly verificationHead: string;
  /**
   * C25 (D-635 (5)): kepala kolom catatan perubahan riwayat revisi, bentuk mesin (research/31 §4.2:
   * `Uraian`/`Change`, kolom ke-3) dan bentuk manual (`ID:29` PERUBAHAN, `EN:29` CHANGE, kolom ke-4).
   */
  readonly revisionChangeHeads: readonly string[];
  /** C25: kepala rantai verifikasi bentuk manual tanpa kolom peran (`ID:39` LAPIS/METODE/OBJEK/HASIL; `EN:38`). */
  readonly manualVerificationHeads: readonly string[];
  /** Kata kicker pembuka bab dan lampiran, teks tampak (research/31 §4.5; texts.ts:89-104). */
  readonly chapterKickerWords: readonly string[];
  /** Kata depan keterangan artefak, teks tampak tanpa beda besar-kecil (research/32 LB-09). */
  readonly artifactWords: readonly string[];
  /** Run label sumber/provenans/kunci, kapital (research/32 LB-09). */
  readonly runLabels: readonly string[];
  /** Label aparatus untuk deteksi bahasa (D-598 F-2): kata artefak + label run + tag vonis. */
  readonly apparatus: readonly LangToken[];
  /** Nama bulan tanggal panjang (formats.ts:461-462; research/32 NC-04). */
  readonly months: readonly string[];
  /**
   * Token bahasa ini yang bila muncul di dokumen bahasa lain = gagal kritis CR-4, beserta lingkupnya:
   * `document` = seluruh teks (daftar inti AC-6), `wrapper` = lokasi pembungkus saja (daftar cermin).
   */
  readonly criticalTokens: readonly LangToken[];
  readonly criticalScope: "document" | "wrapper";
  /** Token perluasan bahasa ini di lokasi pembungkus dokumen bahasa lain (AC6-03, tidak kritis). */
  readonly extensionTokens: readonly LangToken[];
  /** true bila label aparatus bahasa LAIN di dokumen bahasa ini dihitung di CR-4 (brief S23, D-598 F-2). */
  readonly foreignApparatusCritical: boolean;
  readonly numbers: NumberConvention;
}

// Pengecualian umum CR-3 butir 1, dibuang sebelum pola angka diterapkan.
export const NUMBER_SCAN_EXCLUSIONS: readonly RegExp[] = [
  /\d{2}-(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)-\d{4}/g,
  /\d{4}-\d{2}-\d{2}/g,
  /\/\/ \d{8}/g,
  /\bv\d+(?:\.\d+)+/g,
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/g,
];

export const LANGUAGE_EXPECTATIONS: Readonly<Record<Lang, LanguageExpectation>> = {
  ID: {
    registerWords: ["LEMBAR", "DARI"],
    sealLeftPrefix: "KLASIFIKASI · ",
    sealRightDefault: "SALINAN INDUK · PENGGUNAAN INTERNAL GSP",
    issueWord: "TERBITAN",
    controlSheetKicker: "Lembar Kendali",
    tocTitle: "Daftar Isi",
    preparerLabel: "Penyusun",
    revisionLabel: "Revisi",
    numberLabel: "Nomor dokumen",
    coverControlLabels: ["Nomor dokumen", "Revisi", "Penyusun", "Kustodian", "Ditujukan kepada", "Tier", "Dasar", "Bahasa", "Klasifikasi"],
    signatureRoles: ["Disusun", "Diperiksa", "Disetujui"],
    verificationRoles: ["Penyusun", "Diperiksa", "Disetujui"],
    firstIssueNote: "Terbit pertama",
    verificationHead: "Lapis",
    revisionChangeHeads: ["Uraian", "Perubahan"],
    manualVerificationHeads: ["Lapis", "Metode", "Objek", "Hasil"],
    chapterKickerWords: ["BAB", "LAMPIRAN"],
    artifactWords: ["TABEL", "GAMBAR", "TURUNAN"],
    runLabels: ["SUMBER", "PROVENANS", "KUNCI"],
    apparatus: tok("Tabel", "Gambar", "Turunan", "SUMBER", "PROVENANS", "KUNCI", "MEMENUHI", "TIDAK MEMENUHI"),
    months: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
    // research/31 §6 daftar inti AC-6.
    criticalTokens: tok("Lembar Kendali", "KLASIFIKASI", "SALINAN INDUK", "TERBITAN", "Tanggal", "Uraian", "Oleh", "Pemegang", "LEMBAR", "Penyusun", "Rp"),
    criticalScope: "document",
    // research/31 §6 daftar perluasan (label aparatus F-2 termasuk).
    extensionTokens: tok(
      "Lapis", "Peran", "Nama", "Salinan", "Disusun", "Diperiksa", "Disetujui", "Terbit pertama", "Diolah oleh", "Daftar Isi",
      "Bab", "Lampiran", "Bagian", "DARI", "Riwayat revisi", "Rantai verifikasi", "Pernyataan metode", "Distribusi terkendali",
      "Nomor dokumen", "Revisi", "Kustodian", "Ditujukan kepada", "Dasar", "Bahasa", "Klasifikasi", "Tabel", "Gambar", "Turunan",
      "SUMBER", "PROVENANS", "KUNCI",
    ),
    foreignApparatusCritical: false,
    numbers: {
      forbidden: [
        { re: /\bRp(?=\d)/g, why: "Rp menempel pada angka (ID:1932-1934)" },
        { re: /(?<![\d.,])\d{1,3}(?:,\d{3}){2,}(?!\d)/g, why: "pemisah ribuan koma (konvensi EN)" },
        { re: /(?<![\d.,])\d{1,3},\d{3}\.\d+/g, why: "ribuan koma dengan desimal titik (konvensi EN)" },
        { re: /\bIDR\b/g, why: "IDR di dokumen ID", exemptByAllowLine: true },
      ],
      allowIdrLine: "This annex uses English conventions",
      bfixExpected: ["1.250.000,5", "Rp 1.385.946.000", "25 %", "0,5"],
    },
  },
  EN: {
    registerWords: ["SHEET", "OF"],
    sealLeftPrefix: "CLASSIFICATION · ",
    sealRightDefault: "MASTER COPY · GSP INTERNAL USE",
    issueWord: "ISSUE",
    controlSheetKicker: "Control Sheet",
    tocTitle: "Contents",
    preparerLabel: "Prepared by",
    revisionLabel: "Revision",
    numberLabel: "Document number",
    coverControlLabels: ["Document number", "Revision", "Prepared by", "Custodian", "Addressed to", "Tier", "Basis", "Language", "Classification"],
    signatureRoles: ["Prepared by", "Reviewed by", "Approved by"],
    verificationRoles: ["Prepared by", "Reviewed by", "Approved by"],
    firstIssueNote: "First issue",
    verificationHead: "Layer",
    revisionChangeHeads: ["Change"],
    manualVerificationHeads: ["Layer", "Method", "Object", "Result"],
    // G-FIX1 (D-606) LB-08: mesin mencetak ANNEX (EN:223-247, EN:4326); APPENDIX tetap kata Inggris yang sah untuk LB-03.
    chapterKickerWords: ["CHAPTER", "ANNEX", "APPENDIX"],
    artifactWords: ["TABLE", "FIGURE", "DERIVATION"],
    runLabels: ["SOURCE", "PROVENANCE", "KEY"],
    apparatus: tok("Table", "Figure", "Derivation", "SOURCE", "PROVENANCE", "KEY", "COMPLIES", "DOES NOT COMPLY"),
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    // research/31 §6 daftar cermin (lokasi pembungkus dokumen ID saja; OF hanya di sel register).
    criticalTokens: [
      ...tok("CLASSIFICATION", "MASTER COPY", "ISSUE", "SHEET"),
      { text: "OF", where: "register" },
      ...tok("Control Sheet", "Contents", "Prepared by", "Reviewed by", "Approved by", "Author", "Chapter", "Appendix", "Revision history", "Verification chain", "Controlled distribution"),
    ],
    criticalScope: "wrapper",
    extensionTokens: [],
    foreignApparatusCritical: true,
    numbers: {
      forbidden: [
        { re: /\bRp\b/g, why: "Rp di dokumen EN (EN:2024-2025)" },
        { re: /(?<![\d.,])\d{1,3}(?:\.\d{3}){2,}(?!\d)/g, why: "pemisah ribuan titik (konvensi ID)" },
        { re: /(?<![\d.,])\d{1,3}\.\d{3},\d+/g, why: "ribuan titik dengan desimal koma (konvensi ID)" },
        { re: /(?<![\d.,])\d+,\d{1,2}(?!\d)/g, why: "koma desimal (konvensi ID)" },
        { re: /\bIDR(?=\d)/g, why: "IDR menempel pada angka (EN:2030)" },
      ],
      bfixExpected: ["1,250,000.5", "IDR 1,385,946,000", "25 %", "0.5"],
    },
  },
};

/** Bahasa lain (dua bahasa ronde ini). */
export function otherLang(lang: Lang): Lang {
  return lang === "ID" ? "EN" : "ID";
}

/** Peran tanda tangan lama klien MCP (EN sebelum S12/S13), dikenali agar LB-06 gagal beralasan. */
export const LEGACY_SIGNATURE_ROLES: readonly string[] = ["Prepared", "Checked", "Approved"];

/** Kepala kolom pertama tabel riwayat revisi (sama di kedua bahasa, research/31 §4.2). */
export const REVISION_TABLE_HEAD = "Rev";
