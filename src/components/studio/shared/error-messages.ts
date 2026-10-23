/*
 * Katalog pesan galat awam Studio (FIX-4a; UX-01 §5.2, P10).
 *
 * Satu peta kode API -> { judul, penjelasan, tindakan }. Pesan per modul yang
 * lama (mis. `template-editor/api.ts` CODE_MESSAGES) dipindah ke sini saat
 * modulnya bermigrasi (SR-28..31, FIX-4b). Kode mentah, pesan server mentah,
 * dan correlationId hanya tampil di Info teknis (ADMIN).
 *
 * Setiap pesan menyebut apa yang terjadi, akibatnya, dan satu tindakan.
 */
import { isStudioApiError } from "./http";

/** Tindakan yang dapat ditawarkan layar; layar memetakan ke tombol/tautan. */
export type ErrorActionKind =
  | "retry"
  | "login"
  | "reload-latest"
  | "view-completeness"
  | "make-chapter-draft"
  | "revert-setting"
  | "make-copy"
  | "open-existing"
  | "reupload"
  | "back-to-documents"
  | "contact-admin";

export interface ErrorAction {
  kind: ErrorActionKind;
  label: string;
}

export interface StudioErrorMessage {
  /** Judul pendek di layar. */
  title: string;
  /** Penjelasan + akibat, satu-dua kalimat. */
  body: string;
  actions: ErrorAction[];
  /** Layak dicoba ulang dengan jeda (jaringan, 5xx, 429, 503). */
  retryable: boolean;
  /** Detik tunggu dari Retry-After bila ada. */
  retryAfterSec: number | null;
  /** Kode yang dipakai mencari katalog (untuk Info teknis). */
  code: string;
}

/** Konteks opsional untuk melengkapi teks (semua sudah label awam). */
export interface ErrorMessageContext {
  /** Daftar kekurangan berlabel awam, mis. ["Lembar kendali", "Bab 4"]. */
  missing?: readonly string[];
  /** Nama pengubah (id agen apa adanya, T-4). */
  changedBy?: string | null;
  /** Nomor versi tempat perubahan terjadi. */
  changedInVersion?: number | null;
  /** Nama benda yang dimuat untuk 404 ("Dokumen", "Templat", "Berkas"). */
  subject?: string;
}

type Entry = {
  title: string;
  body: string | ((ctx: ErrorMessageContext, e: { retryAfterSec: number | null }) => string);
  actions?: ErrorAction[];
  retryable?: boolean;
};

const A = {
  retry: { kind: "retry", label: "Coba lagi" },
  login: { kind: "login", label: "Masuk lagi" },
  reloadLatest: { kind: "reload-latest", label: "Muat versi terbaru" },
  viewCompleteness: { kind: "view-completeness", label: "Lihat kelengkapan" },
  chapterDraft: { kind: "make-chapter-draft", label: "Buat draf bab ini" },
  revert: { kind: "revert-setting", label: "Kembalikan" },
  copy: { kind: "make-copy", label: "Buat salinan" },
  openExisting: { kind: "open-existing", label: "Buka dokumen yang ada" },
  reupload: { kind: "reupload", label: "Unggah ulang" },
  backToDocuments: { kind: "back-to-documents", label: "Kembali ke Dokumen" },
} as const satisfies Record<string, ErrorAction>;

function list(items: readonly string[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items.join(", ");
}

/** Katalog per kode (§5.2) + kode lama kontrak v1 yang masih dipakai route. */
export const ERROR_CATALOG: Readonly<Record<string, Entry>> = {
  DOCUMENT_INCOMPLETE: {
    title: "Dokumen belum lengkap",
    body: (c) =>
      c.missing && c.missing.length
        ? `Berkas lengkap butuh semua bagian wajib. Belum ada: ${list(c.missing)}.`
        : "Berkas lengkap butuh semua bagian wajib terisi lebih dulu.",
    actions: [A.chapterDraft, A.viewCompleteness],
  },
  SCOPE_CONFLICT: {
    title: "Paragraf ini sudah diubah orang lain",
    body: (c) =>
      c.changedBy
        ? `Paragraf ini sudah diubah oleh ${c.changedBy}${c.changedInVersion ? ` (versi ${c.changedInVersion})` : ""} sejak Anda mulai menyunting.`
        : "Paragraf ini sudah diubah sejak Anda mulai menyunting. Bandingkan dulu sebelum menyimpan.",
    actions: [A.reloadLatest],
  },
  PID_NOT_FOUND: {
    title: "Paragraf ini sudah tidak ada",
    body: "Paragraf mungkin dihapus atau dipindah di versi terbaru.",
    actions: [A.reloadLatest],
  },
  ASSET_NOT_FOUND: {
    title: "Gambar tidak ditemukan",
    body: "Unggah ulang gambar lalu simpan lagi.",
    actions: [A.reupload],
  },
  SCHEMA_INVALID: {
    title: "Isian belum sesuai",
    body: "Isian tidak dapat disimpan. Periksa medan yang ditandai, atau hubungi admin dan sertakan kode di Info teknis.",
  },
  JSON_MALFORMED: {
    title: "Isian tidak dapat dibaca",
    body: "Server tidak dapat membaca isian ini. Muat ulang halaman lalu coba lagi.",
  },
  PARAM_CLASS_K_FORBIDDEN: {
    title: "Pengaturan ini dikunci admin",
    body: "Pengaturan yang menjaga standar DATUM hanya dapat diubah admin. Kembalikan ke nilai sebelumnya untuk menyimpan.",
    actions: [A.revert],
  },
  PARAM_SURFACE_FORBIDDEN: {
    title: "Pengaturan lanjutan khusus admin",
    body: "Hapus perubahan pada pengaturan lanjutan atau minta admin menyimpannya.",
    actions: [A.revert],
  },
  PARAM_CLASS_T_READONLY: {
    title: "Pengaturan ini dihitung otomatis",
    body: "Nilai ini dihitung dari pengaturan lain dan tidak dapat diubah langsung. Kembalikan ke nilai sebelumnya.",
    actions: [A.revert],
  },
  PARAM_UNKNOWN_KEY: {
    title: "Ada pengaturan yang tidak dikenal",
    body: "Salah satu pengaturan tidak dikenal oleh versi Studio ini. Muat ulang halaman lalu coba lagi.",
  },
  PRESET_READONLY: {
    title: "Gaya hanya dapat diubah admin",
    body: "Pilih gaya lain atau minta admin mengubah gaya ini.",
  },
  FORBIDDEN: {
    title: "Hanya admin yang dapat mengubah ini",
    body: "Templat kanonik dijaga admin. Buat salinan untuk menyesuaikan.",
    actions: [A.copy],
  },
  CANONICAL_ADMIN_ONLY: {
    title: "Hanya admin yang dapat mengubah ini",
    body: "Templat kanonik dijaga admin. Buat salinan untuk menyesuaikan.",
    actions: [A.copy],
  },
  SLOT_POSITION_LOCKED: {
    title: "Posisi bagian ini tetap",
    body: "Sampul selalu di awal dan Lampiran selalu di akhir.",
  },
  SLOT_REQUIRED_MISSING: {
    title: "Susunan belum valid",
    body: "Ada bagian wajib yang belum ada di susunan. Lihat bagian yang ditandai.",
  },
  SLOT_DUPLICATE: {
    title: "Susunan belum valid",
    body: "Ada bagian yang muncul dua kali di susunan. Lihat bagian yang ditandai.",
  },
  SLOT_PARAM_SCOPE_INVALID: {
    title: "Susunan belum valid",
    body: "Ada pengaturan yang tidak berlaku untuk bagian itu. Lihat bagian yang ditandai.",
  },
  META_CONFLICT: {
    title: "Dokumen untuk misi ini sudah ada",
    body: "Sudah ada dokumen dengan kunci yang sama untuk misi ini.",
    actions: [A.openExisting],
  },
  TEMPLATE_MISMATCH: {
    title: "Dokumen untuk misi ini sudah ada",
    body: "Dokumen misi ini sudah dibuat dengan templat lain.",
    actions: [A.openExisting],
  },
  CHANGE_FIELDS_REQUIRED: {
    title: "Keterangan perubahan belum lengkap",
    body: "Isi Apa yang diubah, Mengapa, dan Dampaknya sebelum menyimpan.",
  },
  CHANGE_NOTE_REQUIRED: {
    title: "Catatan perubahan wajib diisi",
    body: "Tulis singkat apa yang berubah di versi ini, lalu simpan lagi.",
  },
  VERSION_CONFLICT: {
    title: "Sudah ada versi yang lebih baru",
    body: "Orang lain menyimpan versi baru saat Anda mengubah. Muat versi terbaru lalu terapkan perubahan Anda lagi.",
    actions: [A.reloadLatest],
  },
  REVISION_CONFLICT: {
    title: "Sudah ada versi dokumen yang lebih baru",
    body: "Dokumen berubah saat Anda menyunting. Muat versi terbaru lalu terapkan perubahan Anda lagi.",
    actions: [A.reloadLatest],
  },
  DOCUMENT_NOT_FOUND: {
    title: "Dokumen tidak ditemukan",
    body: "Mungkin tautannya salah atau dokumen dipindah.",
    actions: [A.backToDocuments],
  },
  TEMPLATE_NOT_FOUND: {
    title: "Templat tidak ditemukan",
    body: "Mungkin tautannya salah atau templat sudah diarsipkan.",
  },
  REVISION_NOT_FOUND: {
    title: "Versi dokumen tidak ditemukan",
    body: "Versi ini tidak ada. Buka versi terbaru dokumen.",
    actions: [A.reloadLatest],
  },
  FILE_NOT_FOUND: {
    title: "Berkas tidak ditemukan",
    body: "Berkas ini tidak tersedia lagi. Buat berkas baru dari halaman dokumen.",
  },
  FILE_MISSING_ON_DISK: {
    title: "Berkas tidak tersedia lagi",
    body: "Berkas ini sudah tidak tersimpan. Buat berkas baru dari halaman dokumen.",
  },
  PAYLOAD_TOO_LARGE: {
    title: "Isian terlalu besar",
    body: "Data yang dikirim melebihi batas. Perkecil isian lalu coba lagi.",
  },
  ASSET_TOO_LARGE: {
    title: "Gambar terlalu besar",
    body: "Ukuran atau resolusi gambar melebihi batas. Pakai gambar yang lebih kecil.",
    actions: [A.reupload],
  },
  ASSET_TYPE_UNSUPPORTED: {
    title: "Jenis berkas tidak didukung",
    body: "Pakai gambar PNG, JPG, atau SVG.",
    actions: [A.reupload],
  },
  UNSUPPORTED_MEDIA_TYPE: {
    title: "Jenis isian tidak didukung",
    body: "Server menolak bentuk isian ini. Muat ulang halaman lalu coba lagi.",
  },
  RENDER_IN_PROGRESS: {
    title: "Berkas sedang dibuat",
    body: "Pembuatan berkas sebelumnya belum selesai. Tunggu sampai selesai lalu coba lagi.",
    retryable: true,
  },
  RATE_LIMITED: {
    title: "Terlalu banyak permintaan",
    body: (_c, e) => (e.retryAfterSec ? `Tunggu ${e.retryAfterSec} detik lalu coba lagi.` : "Tunggu sebentar lalu coba lagi."),
    retryable: true,
  },
  RENDER_QUEUE_FULL: {
    title: "Mesin cetak sedang tidak siap",
    body: "Perubahan Anda sudah tersimpan. Berkas akan bisa dibuat setelah mesin siap.",
    retryable: true,
  },
  PDF_ENGINE_UNAVAILABLE: {
    title: "Mesin cetak sedang tidak siap",
    body: "Perubahan Anda sudah tersimpan. Berkas akan bisa dibuat setelah mesin siap.",
    retryable: true,
  },
  BROWSER_UNAVAILABLE: {
    title: "Mesin cetak sedang tidak siap",
    body: "Perubahan Anda sudah tersimpan. Berkas akan bisa dibuat setelah mesin siap.",
    retryable: true,
  },
  UNAUTHORIZED: {
    title: "Sesi Anda berakhir",
    body: "Masuk lagi untuk melanjutkan. Draf sunting tetap tersimpan di browser ini.",
    actions: [A.login],
  },
  NETWORK: {
    title: "Tidak dapat terhubung ke Studio",
    body: "Periksa koneksi Anda. Studio akan bisa dicoba lagi setelah hitung mundur.",
    retryable: true,
  },
  TIMEOUT: {
    title: "Studio terlalu lama menjawab",
    body: "Permintaan tidak selesai tepat waktu. Coba lagi setelah hitung mundur.",
    retryable: true,
  },
  BAD_RESPONSE: {
    title: "Jawaban Studio tidak dapat dibaca",
    body: "Studio mengirim jawaban yang tidak terduga. Coba lagi, atau hubungi admin bila berulang.",
    retryable: true,
  },
  RENDER_BOUNDARY: {
    title: "Bagian halaman ini gagal ditampilkan",
    body: "Data Anda tidak berubah. Coba tampilkan lagi; bila berulang, muat ulang halaman atau hubungi admin.",
    retryable: true,
  },
};

const STATUS_FALLBACK: Record<string, Entry> = {
  "403": {
    title: "Anda tidak memiliki akses",
    body: "Tindakan ini hanya untuk peran tertentu. Hubungi admin bila Anda membutuhkannya.",
  },
  "404": {
    title: "Tidak ditemukan",
    body: "Mungkin tautannya salah atau isinya sudah dipindah.",
  },
  "409": {
    title: "Ada perubahan yang bertabrakan",
    body: "Data berubah saat Anda bekerja. Muat versi terbaru lalu coba lagi.",
    actions: [A.reloadLatest],
  },
  "4xx": {
    title: "Permintaan tidak dapat diproses",
    body: "Studio menolak permintaan ini. Periksa isian lalu coba lagi.",
  },
  "429": ERROR_CATALOG.RATE_LIMITED,
  "503": ERROR_CATALOG.RENDER_QUEUE_FULL,
  "5xx": {
    title: "Studio sedang bermasalah",
    body: "Terjadi gangguan di server Studio. Coba lagi setelah hitung mundur.",
    retryable: true,
  },
};

const UNKNOWN: Entry = {
  title: "Terjadi kesalahan tak terduga",
  body: "Coba lagi. Bila berulang, muat ulang halaman atau hubungi admin.",
  retryable: true,
};

function entryFor(code: string, status: number): { entry: Entry; key: string } {
  const byCode = ERROR_CATALOG[code];
  if (byCode) return { entry: byCode, key: code };
  if (status === 401) return { entry: ERROR_CATALOG.UNAUTHORIZED, key: "UNAUTHORIZED" };
  const s = String(status);
  if (STATUS_FALLBACK[s]) return { entry: STATUS_FALLBACK[s], key: code || s };
  if (status >= 500) return { entry: STATUS_FALLBACK["5xx"], key: code || s };
  if (status >= 400) return { entry: STATUS_FALLBACK["4xx"], key: code || s };
  return { entry: UNKNOWN, key: code || "UNKNOWN" };
}

/**
 * Ubah galat apa pun (StudioApiError, galat render, objek `{status, code}`)
 * menjadi pesan awam. Tidak pernah mengembalikan pesan server mentah.
 */
export function errorMessages(err: unknown, ctx: ErrorMessageContext = {}): StudioErrorMessage {
  let code = "";
  let status = 0;
  let retryAfterSec: number | null = null;
  if (isStudioApiError(err)) {
    code = String(err.code);
    status = err.status;
    retryAfterSec = err.retryAfterSec;
  } else if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.code === "string") code = o.code;
    if (typeof o.status === "number") status = o.status;
    if (typeof o.retryAfterSec === "number") retryAfterSec = o.retryAfterSec;
    // Galat render React (Error biasa tanpa status/kode) -> pesan boundary.
    if (!code && !status && err instanceof Error) code = "RENDER_BOUNDARY";
  }
  const { entry, key } = entryFor(code, status);
  const body = typeof entry.body === "function" ? entry.body(ctx, { retryAfterSec }) : entry.body;
  const retryable =
    entry.retryable ?? (isStudioApiError(err) ? err.retryable : status === 0 || status === 429 || status >= 500);
  const actions = [...(entry.actions ?? [])];
  if (retryable && !actions.some((a) => a.kind === "retry")) actions.push(A.retry);
  return { title: entry.title, body, actions, retryable, retryAfterSec, code: key };
}
