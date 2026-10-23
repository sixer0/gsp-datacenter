/**
 * FIX-2 (F-055 H1, D-46, D-116): teks bawaan halaman pembungkus, SATU sumber
 * untuk perakit DOCX (`docx/wrapper/pages.ts`, `docx/blocks/structure.ts`) dan
 * renderer HTML (`html/blocks/wrapper.ts`, `html/blocks/text.ts`).
 *
 * Teks di sini hanya dipakai bila konten tidak mengirim teksnya sendiri (mode
 * auto, D-139: teks bawaan milik templat + mesin). Nilainya sama persis dengan
 * keluaran DOCX sebelum FIX-2, sehingga DOCX tetap byte-identik; HTML kini
 * memakai fungsi yang sama dan tidak bisa menyimpang lagi
 * (uji `tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts`).
 *
 * Huruf kapital tampilan (mis. kicker berhuruf besar) adalah urusan format
 * peran (`caps` -> `w:caps` / `text-transform`), bukan teks sumber (D-46).
 */
import type { DocMeta, ParamMap } from "../../contract";
import { dateParts, longDate, pNum, pStr, pStrList, ROMAN_MONTHS, roman } from "../docx/wrapper/formats";

export type WrapperLang = "ID" | "EN";

/** Tabel teks bawaan pembungkus per bahasa (dulu tabel `L` di `docx/wrapper/pages.ts`). */
export const WRAPPER_TEXT = {
  controlKicker: { ID: "Lembar Kendali", EN: "Control Sheet" },
  revision: { ID: "Riwayat revisi", EN: "Revision history" },
  verification: { ID: "Rantai verifikasi", EN: "Verification chain" },
  method: { ID: "Pernyataan metode", EN: "Method statement" },
  distribution: { ID: "Distribusi terkendali", EN: "Controlled distribution" },
  tocKicker: { ID: "Daftar Isi", EN: "Contents" },
  chapter: { ID: "Bab", EN: "Chapter" },
  appendix: { ID: "Lampiran", EN: "Appendix" },
  part: { ID: "Bagian", EN: "Part" },
  tocPlaceholder: { ID: "Perbarui medan untuk menyusun daftar isi.", EN: "Update fields to build the table of contents." },
} as const satisfies Readonly<Record<string, Readonly<Record<WrapperLang, string>>>>;

/** Blok lembar kendali mode auto, urutan tetap (BM p#12..p#21). */
export type ControlSheetBlockKind = "revision" | "verification" | "method" | "distribution";

export const CONTROL_SHEET_BLOCK_ORDER: readonly ControlSheetBlockKind[] = ["revision", "verification", "method", "distribution"];

/**
 * Judul blok lembar kendali: huruf berurutan HANYA untuk blok yang ada
 * (`index` = urutan di antara blok yang dirender), pemisah titik tengah.
 */
export function controlSheetBlockHeading(index: number, kind: ControlSheetBlockKind, lang: WrapperLang): string {
  return `${String.fromCharCode(65 + index)} · ${WRAPPER_TEXT[kind][lang]}`;
}

/** Kicker bawaan halaman lembar kendali. */
export function controlSheetKickerText(lang: WrapperLang): string {
  return WRAPPER_TEXT.controlKicker[lang];
}

/** Kicker bawaan halaman daftar isi (tanpa judul bawaan; judul = kenop `render.toc.title`, RQ-8). */
export function tocKickerText(lang: WrapperLang): string {
  return WRAPPER_TEXT.tocKicker[lang];
}

/** Label bab/lampiran bawaan di daftar isi dan daftar bab pembatas bagian: "Bab 1" / "Lampiran A". */
export function chapterLabelText(key: string, appendix: boolean, lang: WrapperLang): string {
  return `${(appendix ? WRAPPER_TEXT.appendix : WRAPPER_TEXT.chapter)[lang]} ${key}`;
}

/** Pola sah (string memuat `{n}`) atau undefined. */
function validPattern(v: unknown): string | undefined {
  return typeof v === "string" && v.includes("{n}") ? v : undefined;
}

/**
 * Kicker bawaan pembuka lampiran (blok `appendix`): pola `appendix.kicker.pattern`
 * bila diset templat (FIX-2 siklus 2, O-2), selain itu "Lampiran A" / "Appendix A".
 */
export function appendixOpenerKickerText(key: string, lang: WrapperLang, appendixPattern?: unknown): string {
  const p = validPattern(appendixPattern);
  return p ? p.replace("{n}", key) : chapterLabelText(key, true, lang);
}

/** Pola bawaan registri P4A-04 `chapter.kicker.pattern`. */
export const CHAPTER_KICKER_PATTERN_DEFAULT = "BAB {n}";
/** Padanan EN pola bawaan (FIX-2 siklus 2, O-1). */
export const CHAPTER_KICKER_PATTERN_EN = "CHAPTER {n}";

/**
 * Kicker bawaan pembuka bab (blok `chapter`): pola P4A-04 `chapter.kicker.pattern`
 * (wajib memuat `{n}`, cadangan "BAB {n}"). Dokumen EN dengan pola bawaan (absen atau
 * sama dengan bawaan registri) = "CHAPTER {n}"; pola lain yang diset templat menang
 * (O-1). Catatan: templat yang sengaja mengeset "BAB {n}" tidak bisa dibedakan dari
 * bawaan registri yang sudah teresolusi. Bab di unit lampiran memakai
 * `appendix.kicker.pattern` atau kata lampiran (menurut bahasa) yang diturunkan dari
 * pola bab; deteksi huruf besar dipertahankan dari DOCX S16 (lihat uji FIX-2).
 */
export function chapterKickerText(chapterPattern: unknown, appendixPattern: unknown, key: string, appendix: boolean, lang: WrapperLang): string {
  const given = validPattern(chapterPattern) ?? CHAPTER_KICKER_PATTERN_DEFAULT;
  const base = lang === "EN" && given === CHAPTER_KICKER_PATTERN_DEFAULT ? CHAPTER_KICKER_PATTERN_EN : given;
  let p = base;
  if (appendix) {
    const ap = validPattern(appendixPattern);
    if (ap) p = ap;
    else {
      const word = WRAPPER_TEXT.appendix[lang];
      p = base.replace(/^[^\s{]+/, base === base.toUpperCase() ? word.toUpperCase() : word);
    }
  }
  return p.replace("{n}", key);
}

// ── Sampul mode auto: blok kendali dan kolofon (FIX-2 siklus 2, O-3) ─────

/** Label medan blok kendali P4V-12 per bahasa (dulu `CONTROL_FIELD_LABELS` di `docx/wrapper/pages.ts`). */
export const CONTROL_FIELD_LABELS: Readonly<Record<string, Readonly<Record<WrapperLang, string>>>> = {
  "NOMOR DOKUMEN": { ID: "Nomor dokumen", EN: "Document number" },
  REVISI: { ID: "Revisi", EN: "Revision" },
  PENYUSUN: { ID: "Penyusun", EN: "Author" },
  KUSTODIAN: { ID: "Kustodian", EN: "Custodian" },
  "DITUJUKAN KEPADA": { ID: "Ditujukan kepada", EN: "Addressed to" },
  TIER: { ID: "Tier", EN: "Tier" },
  DASAR: { ID: "Dasar", EN: "Basis" },
  BAHASA: { ID: "Bahasa", EN: "Language" },
};

/**
 * Baris blok kendali sampul auto (meta + P4V-12 `cover.controlBlock.fields`): pasangan
 * label/nilai berurutan, dua pasangan per baris, medan kosong dilewati, baris terakhir
 * dipadatkan dengan sel kosong. undefined = tidak ada medan berisi.
 */
export function controlBlockRowsText(meta: DocMeta, params: ParamMap, lang: WrapperLang): Array<[string, string, string, string]> | undefined {
  const values: Record<string, string | undefined> = {
    "NOMOR DOKUMEN": meta.docNumber,
    REVISI: `${meta.rev} · ${longDate(meta.issueDate, lang)}`,
    PENYUSUN: meta.author,
    KUSTODIAN: meta.custodian,
    "DITUJUKAN KEPADA": meta.audience,
    TIER: meta.tier,
    DASAR: meta.basis,
    BAHASA: meta.language === "EN" ? (lang === "EN" ? "English" : "Inggris") : lang === "EN" ? "Indonesian" : "Indonesia",
  };
  const pairs: Array<[string, string]> = [];
  for (const f of pStrList(params, "cover.controlBlock.fields", Object.keys(CONTROL_FIELD_LABELS))) {
    const v = values[f];
    const label = CONTROL_FIELD_LABELS[f];
    if (!label || !v || v.trim() === "") continue;
    pairs.push([label[lang], v]);
  }
  if (pairs.length === 0) return undefined;
  const rows: Array<[string, string, string, string]> = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const right = pairs[i + 1] ?? ["", ""];
    rows.push([pairs[i][0], pairs[i][1], right[0], right[1]]);
  }
  return rows;
}

/** Nama entitas bawaan kolofon bila `org.entityName` absen. */
export const ORG_ENTITY_DEFAULT = "PT GEMILANG SATRIA PERKASA";

/**
 * String punggung bawaan P4S-24 (`device.spine.fields`: jenis, subjek, bahasa, revisi, bulan, tahun),
 * dipisah " · ". FIX-F lanjutan (D-314): satu sumber DOCX (`docx/wrapper/render.ts` `spineText`) dan HTML
 * (`html/blocks/device.ts` `spineText`); bulan = angka Romawi seperti DOCX sebelumnya (DOCX byte-identik),
 * bukan nama bulan. Huruf kapital tampilan = format peran (`caps`), bukan teks sumber (D-46).
 */
export function spineTextOf(meta: DocMeta, params: ParamMap): string {
  const d = dateParts(meta.issueDate);
  const values: Record<string, string | undefined> = {
    jenis: meta.typeCode,
    subjek: meta.subject,
    bahasa: meta.language,
    revisi: `REV ${meta.rev}`,
    bulan: d ? ROMAN_MONTHS[d.m - 1] : undefined,
    tahun: d ? String(d.y) : undefined,
  };
  return pStrList(params, "device.spine.fields", ["jenis", "subjek", "bahasa", "revisi", "bulan", "tahun"])
    .map((f) => values[f])
    .filter((v): v is string => !!v && v.trim() !== "")
    .join(" · ");
}

/** Cap terbit P4V-14 `device.issueStamp.format` (dulu isi `issueStampText` DOCX `wrapper/render.ts`). */
export function issueStampTextOf(meta: DocMeta, params: ParamMap): string {
  const fmt = pStr(params, "device.issueStamp.format") ?? "// {YYYYMMDD} {BAHASA} {KELAS} -- TERBITAN {n}";
  const d = dateParts(meta.issueDate);
  const ymd = d ? `${d.y}${String(d.m).padStart(2, "0")}${String(d.d).padStart(2, "0")}` : meta.issueDate.replace(/-/g, "");
  const n = meta.issueNumber ?? pNum(params, "device.issueStamp.issueNumber") ?? 1;
  return fmt
    .replace(/\{YYYYMMDD\}/g, ymd)
    .replace(/\{BAHASA\}/g, meta.language)
    .replace(/\{KELAS\}/g, meta.classification.trim().charAt(0).toUpperCase())
    .replace(/\{n\}/g, String(n));
}

/** Kolofon sampul auto P4V-13: kiri = entitas + "NIB …" (dipisah " · "), kanan = cap terbit. */
export function colophonTexts(meta: DocMeta, params: ParamMap): { left: string; right: string } {
  const fields = pStrList(params, "cover.colophon.fields", ["entitas", "NIB", "cap terbit", "klasifikasi"]);
  const left: string[] = [];
  if (fields.includes("entitas")) left.push(pStr(params, "org.entityName") ?? ORG_ENTITY_DEFAULT);
  if (fields.includes("NIB")) {
    const nib = pStr(params, "org.nib");
    if (nib) left.push(`NIB ${nib}`);
  }
  return { left: left.join(" · "), right: fields.includes("cap terbit") ? issueStampTextOf(meta, params) : "" };
}

/** Label bagian bawaan dari id bagian (angka di id, cadangan 1): "Bagian I" / "Part I". */
export function defaultPartLabelText(partId: string, lang: WrapperLang): string {
  return `${WRAPPER_TEXT.part[lang]} ${roman(Number(String(partId).replace(/\D/g, "")) || 1)}`;
}
