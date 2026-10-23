/*
 * Kamus istilah layar Studio — sumber tunggal label (FIX-4a; UX-01 §1.2, P3).
 *
 * Menggabungkan label yang tersebar di `document-viewer/labels.ts`,
 * `revision/labels.ts`, dan `artifact-gallery/labels.ts`. Modul lama tetap ada
 * sampai baris pemiliknya bermigrasi (SR-28..31, FIX-4b); modul baru wajib
 * memakai berkas ini. Kunci teknis (pid, slotKey, kode galat) hanya boleh
 * tampil di `InfoTeknis` (ADMIN).
 */
import type { StudioOutputFormat, StudioReleaseStatus, StudioTier } from "@/lib/studio/contract/enums";
import type { CompletenessSummary } from "@/lib/studio/contract/types/v2";

export type PillTone = "neutral" | "up" | "down" | "warn" | "accent";

// ── Istilah umum ─────────────────────────────────────────────────────────

export const TERMS = {
  template: "Templat",
  style: "Gaya",
  settings: "Pengaturan",
  advancedSettings: "Pengaturan lanjutan",
  skeleton: "Susunan dokumen",
  slot: "Bagian",
  sectionType: "Jenis bagian",
  required: "Wajib",
  optional: "Opsional",
  positionLocked: "Posisi tetap",
  repeatable: "Bisa berisi banyak bab",
  tier: "Tingkat terbitan",
  chapter: "Bab",
  subsection: "Subbab",
  number: "Nomor",
  documentVersion: "Versi dokumen",
  makeFile: "Buat berkas",
  fileInProgress: "Berkas sedang dibuat",
  fileReady: "Berkas siap",
  fullFile: "Berkas lengkap",
  chapterDraft: "Draf bab",
  sectionDraft: "Draf bagian",
  filledBy: "Diisi oleh",
  mission: "Misi",
  changeWhat: "Apa yang diubah",
  changeWhy: "Mengapa",
  changeImpact: "Dampaknya",
  open: "Buka",
  download: "Unduh",
  technicalInfo: "Info teknis",
  developerTools: "Alat developer",
  system: "Sistem",
  artifactGallery: "Galeri artefak",
} as const;

// ── Kelengkapan (blueprint §2.6) ─────────────────────────────────────────

export const COMPLETENESS_STATUS_LABEL: Record<"COMPLETE" | "INCOMPLETE", string> = {
  COMPLETE: "Lengkap",
  INCOMPLETE: "Belum lengkap",
};

export const SLOT_STATE_LABEL: Record<"FILLED" | "AUTO_READY" | "EMPTY" | "PARTIAL" | "OPTIONAL_EMPTY" | "OMITTED", string> = {
  FILLED: "Terisi",
  AUTO_READY: "Otomatis",
  EMPTY: "Belum diisi",
  PARTIAL: "Sebagian",
  OPTIONAL_EMPTY: "Opsional, kosong",
  OMITTED: "Tidak dipakai",
};

export const SLOT_STATE_TONE: Record<keyof typeof SLOT_STATE_LABEL, PillTone> = {
  FILLED: "up",
  AUTO_READY: "accent",
  EMPTY: "down",
  PARTIAL: "warn",
  OPTIONAL_EMPTY: "neutral",
  OMITTED: "neutral",
};

export const CONTENT_MODE_LABEL: Record<"AUTO" | "INPUT" | "MIXED", string> = {
  AUTO: "Dibuat otomatis",
  INPUT: "Diisi agen",
  MIXED: "Otomatis, dapat dilengkapi agen",
};

// ── Terbitan, pemeriksaan, berkas ────────────────────────────────────────

export const TIER_LABEL: Record<StudioTier, string> = {
  NOTA: "Nota",
  TERBIT: "Terbit",
  SERAH: "Serah",
};

export const TIER_HINT: Record<StudioTier, string> = {
  NOTA: "Catatan internal",
  TERBIT: "Terbitan resmi",
  SERAH: "Serah terima",
};

export const RELEASE_LABEL: Record<StudioReleaseStatus, string> = {
  PASS: "Lolos pemeriksaan",
  FAIL: "Ada masalah standar",
  PENDING: "Sedang diperiksa",
  NOT_RUN: "Belum diperiksa",
};

export const RELEASE_TONE: Record<StudioReleaseStatus, PillTone> = {
  PASS: "up",
  FAIL: "down",
  PENDING: "accent",
  NOT_RUN: "neutral",
};

export const FORMAT_LABEL: Record<StudioOutputFormat, string> = {
  DOCX: "Word (.docx)",
  PDF: "PDF",
  HTML: "Halaman web (.html)",
  SVG: "Gambar (.svg)",
  PNG: "Gambar (.png)",
};

/** Status pembuatan berkas (job) dalam bahasa tindakan yang sama: "Buat berkas". */
export const FILE_JOB_LABEL: Record<"QUEUED" | "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED", string> = {
  QUEUED: "Menunggu giliran",
  RUNNING: "Berkas sedang dibuat",
  SUCCEEDED: "Berkas siap",
  PARTIAL: "Sebagian berkas siap",
  FAILED: "Berkas gagal dibuat",
};

export const FILE_JOB_TONE: Record<keyof typeof FILE_JOB_LABEL, PillTone> = {
  QUEUED: "neutral",
  RUNNING: "accent",
  SUCCEEDED: "up",
  PARTIAL: "warn",
  FAILED: "down",
};

// ── Bagian dan jenis isi ─────────────────────────────────────────────────

/** Label jenis bagian/blok (diperluas dari `document-viewer/labels.ts`; "Seksi" -> "Subbab"). */
const SECTION_TYPE_LABEL: Record<string, string> = {
  cover: "Sampul",
  controlSheet: "Lembar kendali",
  signature: "Tanda tangan",
  signatureBlock: "Tanda tangan",
  toc: "Daftar isi",
  content: "Isi",
  body: "Isi",
  sources: "Daftar sumber",
  sourceRegister: "Daftar sumber",
  bibliography: "Daftar sumber",
  appendix: "Lampiran",
  appendices: "Lampiran",
  partDivider: "Pembatas bagian",
  glossary: "Glosarium",
  chapter: "Bab",
  section: "Subbab",
  paragraph: "Paragraf",
  list: "Daftar",
  aside: "Catatan",
  note: "Catatan",
  monoBlock: "Blok kode",
  assumptionInline: "Asumsi",
  table: "Tabel",
  specTable: "Tabel spesifikasi",
  registerTable: "Tabel register",
  exampleWrongRight: "Contoh salah/benar",
  ruleTable: "Tabel aturan",
  checklist: "Daftar periksa",
  ruleIndex: "Indeks aturan",
  referenceScale: "Skala acuan",
  financialTable: "Tabel keuangan",
  derivation: "Turunan",
  chart: "Grafik",
  diagram: "Diagram",
  image: "Gambar",
  symbolSheet: "Lembar simbol",
  device: "Perangkat",
};

/** Label awam jenis bagian/blok; kunci tak dikenal -> "Bagian lain" (kunci mentah tidak tampil). */
export function sectionTypeLabel(type: string | null | undefined): string {
  if (!type) return "Bagian";
  return SECTION_TYPE_LABEL[type] ?? "Bagian lain";
}

/**
 * Label bagian: `label` dari templat (M10) bila ada, selain itu dari kunci
 * bagian yang dikenal. Kunci mentah tidak pernah ditampilkan.
 */
export function slotLabel(slotKey: string, label?: string | null): string {
  if (label && label.trim()) return label.trim();
  return SECTION_TYPE_LABEL[slotKey] ?? "Bagian lain";
}

/** "Bab 4" dari kunci bab. */
export function chapterLabel(key: string | number): string {
  return `Bab ${key}`;
}

// ── Label kekurangan kelengkapan (L5: satu pemeta untuk rel, penampil, Alat developer) ──

const REPEATABLE_TYPES: ReadonlySet<string> = new Set(["chapter", "appendix"]);

/** "Bab 4", atau "Lampiran A" untuk bagian berjenis lampiran. */
export function repeatItemLabel(slot: { sectionType?: string } | undefined, key: string): string {
  return slot?.sectionType === "appendix" ? `Lampiran ${key}` : chapterLabel(key);
}

export type MissingLabelSource = Pick<CompletenessSummary, "slots"> & Partial<Pick<CompletenessSummary, "chapters">>;

/**
 * Label awam satu entri `missingRequired` kontrak: "content:4" -> "Bab 4",
 * "appendices:A" -> "Lampiran A"; bagian berulang tanpa satu pun entri ->
 * "Bab pertama" / "<label lampiran> (minimal satu)".
 */
export function missingLabel(raw: string, summary: MissingLabelSource): string {
  const i = raw.indexOf(":");
  const slotKey = i > 0 ? raw.slice(0, i) : raw;
  const slot = summary.slots.find((s) => s.slotKey === slotKey);
  if (i > 0) return repeatItemLabel(slot, raw.slice(i + 1));
  const repeatable =
    slot !== undefined &&
    (REPEATABLE_TYPES.has(slot.sectionType ?? "") || slot.repeatable === true || summary.chapters?.[slotKey] !== undefined);
  if (slot && repeatable) {
    return slot.sectionType === "appendix" ? `${slotLabel(slot.slotKey, slot.label)} (minimal satu)` : "Bab pertama";
  }
  return slotLabel(slotKey, slot?.label);
}

/** Label kekurangan awam untuk seluruh `missingRequired`. */
export function missingLabels(summary: Pick<CompletenessSummary, "missingRequired"> & MissingLabelSource): string[] {
  return summary.missingRequired.map((raw) => missingLabel(raw, summary));
}

/** "Paragraf 3.2.2" — nomor dokumen, bukan "alamat". */
export function paragraphLabel(number: string): string {
  return `Paragraf ${number}`;
}

export function versionLabel(n: number | null | undefined): string {
  return n === null || n === undefined ? "Versi -" : `Versi ${n.toLocaleString("id-ID")}`;
}

// ── Pelaku dan lingkup perubahan (A2: kode mentah tidak tampil di permukaan utama) ──

/**
 * Label awam pelaku revisi: "agent:analis-01" -> "Agen analis-01",
 * "user:budi" -> "budi", kosong/"system" -> "Sistem". Nilai tanpa prefiks apa adanya.
 */
export function actorLabel(by: string | null | undefined): string {
  const s = (by ?? "").trim();
  if (!s || s.toLowerCase() === "system" || s.toLowerCase() === "sistem") return "Sistem";
  const i = s.indexOf(":");
  if (i <= 0) return s;
  const kind = s.slice(0, i).toLowerCase();
  const who = s.slice(i + 1).trim();
  if (kind === "agent") return who ? `Agen ${who}` : "Agen";
  if (kind === "user") return who || "Pengguna";
  if (kind === "system") return "Sistem";
  return who || s;
}

/** Satu bagian tata bahasa `changeScope` (register §9.5). */
const CHANGE_SCOPE_PART_RE = /^(?:create|document|meta|rebase|(?:chapter|slot|pid|address|structure|register):[^\s;]+)$/;

/** True bila teks seluruhnya kode lingkup mentah, mis. "create;chapter:3". */
export function isChangeScopeCode(text: string | null | undefined): boolean {
  const s = (text ?? "").trim();
  return s.length > 0 && s.split(";").every((p) => CHANGE_SCOPE_PART_RE.test(p.trim()));
}

export interface ChangeScopeResolvers {
  /** Label bagian dari templat (kunci bagian -> label). */
  slotLabels?: ReadonlyMap<string, string>;
  /** Label paragraf dari id paragraf; null bila tidak diketahui. */
  pid?: (pid: string) => string | null;
  /** Label nomor dokumen (mis. "3.2.2" -> "Paragraf 3.2.2"). */
  address?: (address: string) => string;
}

/** Lingkup awam dari `changeScope` ("create;chapter:3" -> "Dokumen dibuat, Bab 3"). */
export function changeScopeLabel(scope: string | null | undefined, r: ChangeScopeResolvers = {}): string | null {
  if (!scope) return null;
  const out: string[] = [];
  for (const raw of scope.split(";")) {
    const part = raw.trim();
    const i = part.indexOf(":");
    const head = i > 0 ? part.slice(0, i) : part;
    const rest = i > 0 ? part.slice(i + 1) : "";
    switch (head) {
      case "create":
        out.push("Dokumen dibuat");
        break;
      case "document":
        out.push("Seluruh dokumen");
        break;
      case "chapter":
        out.push(chapterLabel(rest));
        break;
      case "slot":
        out.push(r.slotLabels?.get(rest) ?? slotLabel(rest));
        break;
      case "pid":
        out.push(r.pid?.(rest) ?? "Satu paragraf");
        break;
      case "address":
        out.push(r.address ? r.address(rest) : `Nomor ${rest}`);
        break;
      case "structure":
        out.push("Susunan dokumen");
        break;
      case "meta":
        out.push("Data dokumen");
        break;
      case "register":
        out.push("Data acuan");
        break;
      case "rebase":
        out.push("Digabung dengan versi terbaru");
        break;
      default:
        break;
    }
  }
  return out.length ? [...new Set(out)].join(", ") : null;
}

/** Teks "Dampaknya": kode lingkup otomatis (kiriman agen) diterjemahkan; teks manusia apa adanya. */
export function changeImpactLabel(impact: string | null | undefined, r: ChangeScopeResolvers = {}): string {
  const s = (impact ?? "").trim();
  if (!s) return "-";
  return isChangeScopeCode(s) ? changeScopeLabel(s, r) ?? s : s;
}

/**
 * Teks "Apa yang diubah" otomatis ("Kiriman bab 3 oleh agent:x",
 * services/submit/change.ts) menjadi awam; teks lain apa adanya.
 */
export function changeWhatLabel(what: string | null | undefined, r: ChangeScopeResolvers = {}): string {
  const s = (what ?? "").trim();
  if (!s) return "-";
  const m = /^Kiriman (.+) oleh (\S+)$/.exec(s);
  if (!m) return s;
  const [, phrase, by] = m;
  const slotPhrase = /^slot (\S+)$/.exec(phrase);
  let scope = phrase;
  if (slotPhrase) scope = (r.slotLabels?.get(slotPhrase[1]) ?? slotLabel(slotPhrase[1])).toLowerCase();
  else if (isChangeScopeCode(phrase)) scope = (changeScopeLabel(phrase, r) ?? phrase).toLowerCase();
  return `Kiriman ${scope} oleh ${actorLabel(by)}`;
}

// ── Format angka, ukuran, tanggal ────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "23 Okt 2026, 09:12" (waktu lokal peramban). Tidak sah -> "-". */
export function formatDateTime(iso: string | number | Date | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "23 Okt 2026". */
export function formatDate(iso: string | number | Date | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return "-";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatNumber(n: number | null | undefined): string {
  return n === null || n === undefined || !Number.isFinite(n) ? "-" : n.toLocaleString("id-ID");
}

export function formatBytes(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB`;
  return `${(n / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Nama misi ramah (UX-01 T-3, D-163): judul misi HQ bila ada; selain itu
 * folder `2026-10-23_misi_a` -> "Misi A · 23 Okt 2026". Folder lain apa adanya
 * dengan garis bawah menjadi spasi.
 */
export function missionLabel(folder: string | null | undefined, title?: string | null): string {
  if (title && title.trim()) return title.trim();
  if (!folder) return "Tanpa misi";
  const m = /^(\d{4})-(\d{2})-(\d{2})_(.+)$/.exec(folder.trim());
  const words = (s: string) =>
    s
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((w, i) => (i === 0 || w.length === 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  if (!m) return words(folder.trim());
  const [, y, mo, d, rest] = m;
  const month = MONTHS[Number(mo) - 1];
  const date = month ? `${Number(d)} ${month} ${y}` : `${d}-${mo}-${y}`;
  return `${words(rest)} · ${date}`;
}

/**
 * Kata yang tidak boleh muncul di string JSX permukaan utama (UX-01 §1.2;
 * diperiksa SR-56 di luar `InfoTeknis`, Alat developer, Pengaturan lanjutan).
 */
export const FORBIDDEN_SURFACE_WORDS = [
  "pid",
  "C.S.P",
  "alamat",
  "slot",
  "slotKey",
  "payload",
  "JSON",
  "sha",
  "kelas K",
  "kelas B",
  "kelas T",
  "override",
  "tier",
  "render",
  "job",
  "registri",
  "AgentRequest",
  "HermesTask",
] as const;
