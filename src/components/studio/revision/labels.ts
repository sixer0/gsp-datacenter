/**
 * Label dan pesan berbahasa awam untuk komponen sunting dan riwayat (S61;
 * diselaraskan FIX-4b dengan kamus UX-01 §1.2: "nomor" bukan "alamat",
 * "versi" bukan "revisi", "buat berkas" bukan "render").
 * Aturan nomor yang dapat disunting mengikuti D-54: paragraf bab.subbab.nomor,
 * label tabel/gambar, sel `Tabel C.n/baris.kolom`; bab, subbab, halaman depan,
 * pembatas bagian, butir, dan keterangan ditolak.
 */
import { parseAddress, type ParsedAddress } from "@/lib/studio/contract/address";
import type { StudioReleaseStatus, StudioRenderJobStatus } from "@/lib/studio/contract/enums";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { issuesOf as sharedIssuesOf, isStudioApiError, type StudioIssue } from "@/components/studio/shared/http";
import {
  FILE_JOB_LABEL,
  FILE_JOB_TONE,
  RELEASE_LABEL as SHARED_RELEASE_LABEL,
  RELEASE_TONE,
  formatBytes,
  formatDateTime,
  type PillTone,
} from "@/components/studio/shared/labels";

export type EditableKind = "block" | "artifact" | "cell";

export type AddressCheck =
  | { ok: true; parsed: Extract<ParsedAddress, { kind: EditableKind }> }
  | { ok: false; reason: string };

const KIND_LABEL: Record<ParsedAddress["kind"], string> = {
  front: "halaman depan",
  part: "pembatas bagian",
  chapter: "judul bab",
  section: "judul subbab",
  block: "paragraf",
  item: "butir di dalam paragraf",
  artifact: "label tabel atau gambar",
  artifactSub: "keterangan atau sumber tabel/gambar",
  cell: "sel tabel",
};

const EXAMPLES = "Contoh: 3.2.4 (bab.subbab.paragraf), Tabel 3.1, Gambar 2.4, Turunan D-3.1, Tabel 3.1/2.3 (baris.kolom).";

/** Periksa nomor di sisi klien sebelum memanggil API. */
export function checkEditableAddress(raw: string): AddressCheck {
  const s = raw.trim();
  if (!s) return { ok: false, reason: "Isi nomor terlebih dahulu, misalnya 3.2.4, Tabel 3.1, atau Tabel 3.1/2.3." };
  const p = parseAddress(s);
  if (!p) return { ok: false, reason: `Nomor "${s}" tidak dikenali. ${EXAMPLES}` };
  if (p.kind === "block" || p.kind === "artifact" || p.kind === "cell") return { ok: true, parsed: p };
  return {
    ok: false,
    reason: `Nomor "${s}" menunjuk ${KIND_LABEL[p.kind]}, yang belum dapat disunting. Yang dapat disunting: paragraf (mis. 3.2.4), label tabel atau gambar (mis. Tabel 3.1), dan sel tabel (mis. Tabel 3.1/2.3).`,
  };
}

/** Pesan khusus layar ini; kode lain jatuh ke katalog bersama (`shared/error-messages`). */
const CODE_MESSAGE: Partial<Record<string, string>> = {
  ADDRESS_INVALID: "Nomor paragraf tidak dikenali.",
  ADDRESS_NOT_FOUND: "Nomor ini tidak ada di versi dokumen ini (atau sel tertutup gabungan sel).",
  REVISION_NOT_FOUND: "Versi dokumen ini tidak ditemukan.",
  CHANGE_FIELDS_REQUIRED: "Apa yang diubah, mengapa, dan dampaknya wajib diisi.",
  REVISION_CONFLICT: "Dokumen sudah diubah orang lain sejak paragraf ini dimuat.",
  RENDER_IN_PROGRESS: "Berkas versi ini masih dibuat. Tunggu sampai selesai lalu coba lagi.",
  BY_CONSTRUCTION_FAILED: "Perubahan melanggar aturan standar dokumen.",
  SCHEMA_INVALID: "Isian belum sesuai bentuk dokumen.",
  TEMPLATE_NOT_FOUND: "Versi templat yang dipakai versi dokumen ini tidak ditemukan.",
};

/** Pesan ramah pengguna untuk galat apa pun (tanpa stack/teks mentah server). */
export function friendlyError(e: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string {
  if (isStudioApiError(e)) return CODE_MESSAGE[String(e.code)] ?? errorMessages(e).body;
  return fallback;
}

/** Isu validasi dari `details` (bentuk `pointer` kontrak maupun `path`). */
export function issuesOf(details: unknown): StudioIssue[] {
  return sharedIssuesOf(details);
}

/** Pesan awam untuk satu isu validasi server (kata kunci khusus diterjemahkan). */
export function issueText(i: StudioIssue): string {
  if (i.keyword === "noChange") return "Isi sama dengan versi terkini; tidak ada perubahan untuk disimpan.";
  if (i.keyword === "addressKind") return "Bagian ini tidak dapat disunting (hanya paragraf, label tabel/gambar, dan sel tabel).";
  if (i.path === "/cell/gridSpan") return "Sel pengganti wajib mempertahankan gabungan sel asal.";
  return i.message;
}

type Labelled = { text: string; tone: PillTone };

export const RELEASE_LABEL = Object.fromEntries(
  (Object.keys(SHARED_RELEASE_LABEL) as StudioReleaseStatus[]).map((k) => [k, { text: SHARED_RELEASE_LABEL[k], tone: RELEASE_TONE[k] }]),
) as Record<StudioReleaseStatus, Labelled>;

export const JOB_LABEL = Object.fromEntries(
  (Object.keys(FILE_JOB_LABEL) as StudioRenderJobStatus[]).map((k) => [k, { text: FILE_JOB_LABEL[k], tone: FILE_JOB_TONE[k] }]),
) as Record<StudioRenderJobStatus, Labelled>;

/** "23 Okt 2026, 09:12" (formatter bersama). */
export function fmtDate(iso: string | null | undefined): string {
  return formatDateTime(iso);
}

export function fmtBytes(n: number): string {
  return formatBytes(n);
}
