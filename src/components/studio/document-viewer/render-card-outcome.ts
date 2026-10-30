/*
 * Pembantu awam hasil "Buat berkas" (FIX-HZ1; D-325, friksi Hermes C1).
 *
 * - `pdfNotReadyOf(e)`: 503 PDF_ENGINE_UNAVAILABLE tahap preflight (server menolak
 *   SEBELUM pekerjaan dibuat; `details.stage = "preflight"`) -> judul, alasan, dan
 *   penyebab dalam bahasa awam + `suggestedFormats` untuk tombol "Buat tanpa PDF".
 *   Teks `details.reason`/`causes[].message` dari server TIDAK ditampilkan di
 *   permukaan utama (memuat istilah teknis); penyebab dipetakan dari `causes[].code`.
 * - `outcomeOf(res)`: penanda hasil sebagian R17 (`partial`, `failedFormats`) ->
 *   kalimat awam ("PDF belum berhasil dibuat; berkas lain sudah siap").
 *
 * Murni (tanpa React) agar dapat diuji di Node dan dipakai `render-card.tsx` serta
 * `completeness-tab.tsx`.
 */
import type { StudioOutputFormat } from "@/lib/studio/contract/enums";
import { isStudioApiError } from "@/components/studio/shared/http";

export type DocFormat = "pdf" | "docx" | "html";

/** Nama format pendek untuk kalimat (label pilihan di kartu Buat berkas). */
export const FORMAT_SHORT: Readonly<Record<StudioOutputFormat, string>> = {
  PDF: "PDF",
  DOCX: "Word",
  HTML: "Halaman web",
  SVG: "Gambar",
  PNG: "Gambar",
};

const DOC_FORMAT_CODE: Readonly<Record<DocFormat, StudioOutputFormat>> = { pdf: "PDF", docx: "DOCX", html: "HTML" };

export interface PdfNotReadyView {
  title: string;
  /** Alasan + akibat + saran, satu paragraf. */
  body: string;
  /** Penyebab awam (tanpa duplikat). */
  causes: string[];
  /** Format siap pakai tanpa pdf (kosong bila server tidak menyarankan). */
  suggestedFormats: Array<"docx" | "html">;
  /** Label tombol saran, mis. "Buat tanpa PDF (Word, Halaman web)". */
  suggestLabel: string | null;
  retryAfterSec: number | null;
  /** Untuk Info teknis (ADMIN). */
  technical: { code: string; causeCodes: string; checkedAt: string };
}

const CAUSE_TEXT: Readonly<Record<string, string>> = {
  FONTS_NOT_LOADED_IN_SESSION: "Huruf untuk PDF sudah terpasang di server tetapi belum aktif. Admin server perlu keluar lalu masuk kembali ke akun Windows server.",
  FONTS_NOT_REGISTERED: "Huruf untuk PDF di server belum lengkap. Admin server perlu memeriksanya.",
  FONT_FILES_MISSING: "Huruf untuk PDF di server belum lengkap. Admin server perlu memeriksanya.",
  FONT_FILES_CHANGED: "Huruf untuk PDF di server berbeda dari yang seharusnya. Admin server perlu memeriksanya.",
  FONT_FILES_UNREADABLE: "Huruf untuk PDF di server tidak terbaca. Admin server perlu memeriksanya.",
  FONT_REGISTRY_UNREADABLE: "Daftar huruf di server tidak terbaca. Admin server perlu memeriksanya.",
  PDF_ENGINE_MISSING: "Program pembuat PDF belum terpasang di server. Admin server perlu memasangnya.",
  PDF_ENGINE_VERSION: "Program pembuat PDF di server perlu diperiksa admin.",
  RENDER_ENV_MANIFEST: "Pengaturan pembuat PDF di server perlu diperiksa admin.",
  SESSION_FONT_CHECK_FAILED: "Server belum bisa memeriksa kesiapan pembuat PDF. Coba lagi beberapa menit lagi.",
  READINESS_CHECK_FAILED: "Server belum bisa memeriksa kesiapan pembuat PDF. Coba lagi beberapa menit lagi.",
};
const CAUSE_FALLBACK = "Pembuat PDF di server belum siap. Admin server perlu memeriksanya.";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} dan ${names[names.length - 1]}`;
}

/** Nama awam daftar format (`["docx","html"]` -> "Word dan Halaman web"). */
export function formatNames(formats: readonly string[]): string {
  const names = formats.map((f) => FORMAT_SHORT[(DOC_FORMAT_CODE[f as DocFormat] ?? f.toUpperCase()) as StudioOutputFormat] ?? f);
  return joinNames([...new Set(names)]);
}

/** 503 preflight PDF -> tampilan awam; null untuk galat lain. */
export function pdfNotReadyOf(e: unknown): PdfNotReadyView | null {
  if (!isStudioApiError(e) || e.code !== "PDF_ENGINE_UNAVAILABLE") return null;
  const d = isRecord(e.details) ? e.details : null;
  if (!d || d.stage !== "preflight") return null;
  const causeCodes = Array.isArray(d.causes) ? d.causes.map((c) => (isRecord(c) && typeof c.code === "string" ? c.code : "OTHER")) : [];
  const causes = [...new Set((causeCodes.length ? causeCodes : ["OTHER"]).map((c) => CAUSE_TEXT[c] ?? CAUSE_FALLBACK))];
  const suggestedFormats = Array.isArray(d.suggestedFormats)
    ? d.suggestedFormats.filter((f): f is "docx" | "html" => f === "docx" || f === "html")
    : [];
  const names = suggestedFormats.length ? formatNames(suggestedFormats) : "";
  const body =
    "Pembuat PDF di server belum siap, jadi PDF tidak bisa dibuat sekarang. Tidak ada yang berubah pada dokumen." +
    (names ? ` Anda tetap bisa membuat ${names} sekarang, lalu mencoba PDF lagi nanti.` : " Coba lagi beberapa menit lagi.");
  const retryAfterSec = e.retryAfterSec ?? (typeof d.retryAfterSec === "number" ? d.retryAfterSec : null);
  return {
    title: "PDF belum bisa dibuat sekarang",
    body,
    causes,
    suggestedFormats,
    suggestLabel: names ? `Buat tanpa PDF (${names.replace(" dan ", ", ")})` : null,
    retryAfterSec,
    technical: {
      code: "PDF_ENGINE_UNAVAILABLE (preflight)",
      causeCodes: causeCodes.join(", "),
      checkedAt: typeof d.checkedAt === "string" ? d.checkedAt : "-",
    },
  };
}

/** Bentuk minimal respons R17 yang dibaca (medan FIX-H1 opsional untuk server lama). */
export interface RenderOutcomeInput {
  job: { status: string; errors?: ReadonlyArray<{ format?: StudioOutputFormat | null }> };
  partial?: boolean;
  failedFormats?: readonly StudioOutputFormat[];
}

export interface RenderOutcomeView {
  partial: boolean;
  failed: boolean;
  /** Nama format yang gagal (awam). */
  failedNames: string[];
  /** Kalimat ringkas untuk layar; kosong bila semua siap. */
  text: string;
}

/** Penanda hasil sebagian -> kalimat awam. */
export function outcomeOf(res: RenderOutcomeInput): RenderOutcomeView {
  const status = res.job.status;
  const partial = res.partial ?? status === "PARTIAL";
  const failed = status === "FAILED";
  const fromErrors = (res.job.errors ?? []).map((x) => x.format).filter((f): f is StudioOutputFormat => !!f);
  const codes = res.failedFormats && res.failedFormats.length ? res.failedFormats : fromErrors;
  const failedNames = [...new Set(codes.map((f) => FORMAT_SHORT[f] ?? f))];
  let text = "";
  if (failed) text = failedNames.length ? `${joinNames(failedNames)} gagal dibuat.` : "Berkas gagal dibuat.";
  else if (partial) {
    text = failedNames.length
      ? `${joinNames(failedNames)} belum berhasil dibuat; berkas lain sudah siap di tab Berkas.`
      : "Sebagian berkas belum berhasil dibuat; berkas lain sudah siap di tab Berkas.";
  }
  return { partial, failed, failedNames, text };
}

