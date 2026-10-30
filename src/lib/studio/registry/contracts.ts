/**
 * Registri jenis kontrak (C58 `CONTRACT_KIND_DEFS`; register
 * masterplan/05_document_contract_specs.md §1.2, §1.3, §4, §6.3, §6.4, §16; DC-06).
 *
 * - Satu entri per jenis aktif E44 (`CONTRACT_KINDS`); tahap 1 = `agentWorkReport`
 *   (CK-01). Jenis dicadangkan CK-02..CK-05 tidak masuk registri (§1.2).
 * - Outline bab wajib tinggal di sini, bukan ParamDef `slot.outline` (KD-31);
 *   `params/structure.ts` tidak disentuh (BA-06).
 * - Menambah jenis tanpa migrasi (§1.3): tambah anggota E44 lalu satu entri di
 *   `DEFS` di bawah. `satisfies Record<ContractKind, …>` membuat tsc gagal bila
 *   anggota E44 tidak punya entri, sehingga registri tidak bisa tertinggal.
 *
 * Bentuk entri = T2-73 `ContractKindDefV2` (R03 `kind=contracts`, DC-28).
 * Modul murni, aman untuk klien: hanya konstanta kontrak.
 */
import {
  CONTRACT_EVIDENCE_KINDS,
  CONTRACT_KINDS,
  CONTRACT_REF_RELS,
  type AgentWorkReportStatus,
  type ContractItemStatus,
  type ContractKind,
  type ContractVerdict,
} from "../contract/enums";
import {
  CARD_ID_PATTERN,
  CONTRACT_ACTOR_PATTERN,
  CONTRACT_DEFAULT_RENDER_FORMATS,
  CONTRACT_KEY_PATTERN,
  CONTRACT_LIMITS,
  CONTRACT_REPORTED_AT_PATTERN,
  FINAL_FILENAME_PATTERN,
} from "../contract/env";
import type { ContractKindDefV2 } from "../contract/types/v2/contract";

/** sectionType slot catatan kontrak (§6.1, §6.2). */
export const CONTRACT_RECORD_SECTION_TYPE = "contractRecord" as const;

/*
 * Tata bahasa tujuan alias generator (`aliases.headings`, `lineLabels`,
 * `headerKeys`; dibaca DC-24):
 *   `content:<chapterKey>`  bab slot `content` (kunci CO, §4.4)
 *   `references`            slot `references` (SL-10)
 *   `<medan CF>`            medan payload `contractRecord` (status, owner, ...)
 *   `a+b`                   beberapa tujuan sekaligus (GL-03: bab 3 + `evidence[]`)
 * Kondisi khusus yang tidak muat di peta (dipegang generator, §16):
 *   GF-07 `created` -> `reportedAt` hanya bila GF-05/GF-06 absen;
 *   GF-10 `kartu`   -> `cardIds` bila cocok C34, selain itu `taskRef`;
 *   GL-12 `[FASE] <misi> | <dari> -> <ke> | HH:MM` dan GL-13 `## YYYY-MM-DD HH:MM`
 *   adalah pola baris (bukan label), dicocokkan generator.
 */

/** GA-01..GA-54 (§16.2): judul `##` ternormalisasi -> tujuan. */
const AGENT_WORK_REPORT_HEADINGS: Readonly<Record<string, string>> = {
  ringkasan: "content:1",
  "ringkasan eksekutif": "content:1",
  "ringkasan eksekusi": "content:1",
  "ringkasan tugas": "content:1",
  status: "content:1",
  kesimpulan: "content:1",
  verdict: "content:1",
  vonis: "content:1",
  "vonis akhir": "content:1",
  putusan: "content:1",
  perubahan: "content:2",
  "changes made": "content:2",
  "executed steps": "content:2",
  "langkah analisa": "content:2",
  berkas: "content:2",
  "berkas diubah": "content:2",
  isi: "content:2",
  keputusan: "content:2",
  "keputusan / deviasi": "content:2",
  temuan: "content:2",
  "strategi uji": "content:2",
  bukti: "content:3",
  artefak: "content:3",
  "artefak terbit (ukur disk nyata, cetakan alat)": "content:3",
  verifikasi: "content:3",
  verification: "content:3",
  "test results": "content:3",
  "hasil check": "content:3",
  "bukti verifikasi": "content:3",
  "perintah dan keluaran": "content:3",
  "gerbang (diukur pada state akhir disk, bukan ingatan)": "content:3",
  "tabel vonis": "content:3",
  "bukti reproduksi": "content:3",
  "tabel check": "content:3",
  "cara menjalankan": "content:3",
  "persistent issues": "content:4",
  "issues & decisions": "content:4",
  blocker: "content:4",
  "blocker & flag": "content:4",
  "catatan / blocker": "content:4",
  keterbatasan: "content:4",
  "batas klaim": "content:4",
  "temuan untuk controller": "content:4",
  "permintaan lintas pemilik": "content:4",
  "keputusan (untuk dicatat controller)": "content:4",
  "butir terbuka": "content:4",
  "analisis cakupan dan celah": "content:4",
  "next steps": "content:5",
  rekomendasi: "content:5",
  kartu_lanjutan_saran: "content:5",
  penutup: "content:5",
  "catatan ci": "content:5",
  referensi: "references",
  "N referensi": "references",
};

/** GL-01..GL-11 (§16.3): label baris K1 -> tujuan. GL-12/GL-13 = pola baris (lihat atas). */
const AGENT_WORK_REPORT_LINE_LABELS: Readonly<Record<string, string>> = {
  "RINGKAS:": "content:1",
  "JALUR:": "content:2",
  "ARTEFAK:": "content:3+evidence",
  "HAMBAT:": "content:4",
  "LIMIT:": "content:4",
  "RENCANA:": "content:5",
  "ESTIMASI:": "content:5",
  "STATUS:": "status",
  "CATATAN:": "content:2",
  "GERBANG:": "content:3",
  "RUJUKAN:": "content:3",
};

/** GF-01..GF-11 (§16.4): kunci kepala (huruf kecil) -> medan. */
const AGENT_WORK_REPORT_HEADER_KEYS: Readonly<Record<string, string>> = {
  status: "status",
  agent: "owner",
  profil: "owner",
  writer: "owner",
  date: "reportedAt",
  tanggal: "reportedAt",
  created: "reportedAt",
  row: "taskRef",
  task_id: "taskRef",
  kartu: "cardIds",
  verdict: "verdict",
  vonis: "verdict",
};

/** GS-01..GS-05 (§16.5; dicocokkan huruf kecil). Nilai tanpa alias = CW-02, tidak ditebak (KD-42). */
const AGENT_WORK_REPORT_STATUS_ALIASES: Readonly<Record<string, AgentWorkReportStatus>> = {
  complete: "complete",
  completed: "complete",
  draft: "draft",
  "working-draft": "draft",
  partial: "partial",
  "partial-handoff": "partial",
  blocked: "blocked",
  "needs-review": "needs-review",
  perlu_revisi: "needs-review",
};

/** GI-01..GI-07 (§16.5; dicocokkan huruf kecil). */
const CONTRACT_ITEM_STATUS_ALIASES: Readonly<Record<string, ContractItemStatus>> = {
  done: "done",
  selesai: "done",
  complete: "done",
  running: "running",
  berjalan: "running",
  ready: "ready",
  todo: "todo",
  sisa: "todo",
  review: "review",
  blocked: "blocked",
  cancelled: "cancelled",
  "closed-as-cancelled": "cancelled",
};

/** GV-01..GV-04 (§16.5; vonis dicocokkan apa adanya, huruf besar). */
const CONTRACT_VERDICT_ALIASES: Readonly<Record<string, ContractVerdict>> = {
  PASS: "PASS",
  CAUTION: "CAUTION",
  FAIL: "FAIL",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  "NEEDS-REVIEW": "NEEDS_REVIEW",
};

const DEFS = {
  // CK-01 (§1.2, §6.3, §6.4).
  agentWorkReport: {
    kind: "agentWorkReport",
    stage: "active",
    templateSlug: "laporan-kerja-agen",
    tier: "NOTA",
    typeCode: "LAP",
    // SL-08..SL-10 (§6.3).
    skeleton: [
      { slotKey: "record", sectionType: CONTRACT_RECORD_SECTION_TYPE, label: "Catatan Laporan", required: true, repeatable: false },
      { slotKey: "content", sectionType: "chapter", label: "Isi Laporan", required: true, repeatable: true },
      { slotKey: "references", sectionType: "sourceRegister", label: "Referensi", required: false, repeatable: false },
    ],
    // CO-01..CO-05 (§4.4, E50).
    outline: [
      { chapterKey: "1", outlineKey: "ringkasan", title: "Ringkasan", required: true },
      { chapterKey: "2", outlineKey: "rincian", title: "Rincian kerja", required: true },
      { chapterKey: "3", outlineKey: "bukti", title: "Bukti", required: true },
      { chapterKey: "4", outlineKey: "isu", title: "Isu terbuka", required: true },
      { chapterKey: "5", outlineKey: "lanjut", title: "Langkah berikut", required: true },
    ],
    // CS-01..CS-05 (§4.1, E45).
    statuses: [
      { code: "draft", label: "Draf" },
      { code: "complete", label: "Selesai" },
      { code: "partial", label: "Sebagian" },
      { code: "blocked", label: "Terhambat" },
      { code: "needs-review", label: "Perlu tinjauan" },
    ],
    // CI-01..CI-07 (§4.2, E46).
    itemStatuses: [
      { code: "todo", label: "Belum mulai" },
      { code: "ready", label: "Siap" },
      { code: "running", label: "Berjalan" },
      { code: "review", label: "Ditinjau" },
      { code: "done", label: "Selesai" },
      { code: "blocked", label: "Terhambat" },
      { code: "cancelled", label: "Dibatalkan" },
    ],
    // CD-01..CD-04 (§4.3, E47): label tampil = kode apa adanya.
    verdicts: [
      { code: "PASS", label: "PASS" },
      { code: "CAUTION", label: "CAUTION" },
      { code: "FAIL", label: "FAIL" },
      { code: "NEEDS_REVIEW", label: "NEEDS_REVIEW" },
    ],
    refRels: CONTRACT_REF_RELS,
    evidenceKinds: CONTRACT_EVIDENCE_KINDS,
    patterns: {
      cardId: CARD_ID_PATTERN,
      key: CONTRACT_KEY_PATTERN,
      actor: CONTRACT_ACTOR_PATTERN,
      reportedAt: CONTRACT_REPORTED_AT_PATTERN,
      finalFileName: FINAL_FILENAME_PATTERN,
    },
    limits: { ...CONTRACT_LIMITS },
    // Label tampil (§6.4, CA-2); agen tidak pernah mengirim label (CV-14).
    labels: {
      fields: {
        status: "Status",
        verdict: "Vonis",
        owner: "Penanggung jawab",
        initiator: "Pemberi tugas",
        taskRef: "Rujukan tugas",
        reportedAt: "Waktu lapor",
        due: "Tenggat",
        phase: "Fase",
        cardIds: "Kartu",
      },
      itemColumns: ["Kunci", "Judul", "Status", "Penanggung jawab", "Fase", "Tenggat", "Bergantung pada"],
      evidenceColumns: ["Jenis", "Rujukan", "sha256", "Ukuran", "Baris", "Kode keluar", "Butir", "Catatan"],
      refColumns: ["Hubungan", "Dokumen", "Paragraf", "Revisi"],
    },
    aliases: {
      headings: AGENT_WORK_REPORT_HEADINGS,
      lineLabels: AGENT_WORK_REPORT_LINE_LABELS,
      headerKeys: AGENT_WORK_REPORT_HEADER_KEYS,
      statuses: AGENT_WORK_REPORT_STATUS_ALIASES,
      itemStatuses: CONTRACT_ITEM_STATUS_ALIASES,
      verdicts: CONTRACT_VERDICT_ALIASES,
    },
    defaultFormats: CONTRACT_DEFAULT_RENDER_FORMATS,
  },
} as const satisfies Record<ContractKind, ContractKindDefV2>;

/** C58 — registri jenis kontrak, urutan E44. Tahap 1 = 1 entri. */
export const CONTRACT_KIND_DEFS: readonly ContractKindDefV2[] = CONTRACT_KINDS.map((k): ContractKindDefV2 => DEFS[k]);

export const CONTRACT_KIND_DEF_BY_KIND: ReadonlyMap<string, ContractKindDefV2> = new Map(CONTRACT_KIND_DEFS.map((d) => [d.kind, d]));

/** Jenis kontrak terdaftar (anggota E44 dengan entri C58). */
export function isContractKind(v: unknown): v is ContractKind {
  return typeof v === "string" && CONTRACT_KIND_DEF_BY_KIND.has(v);
}

/** Entri C58 satu jenis; `undefined` bila jenis tidak terdaftar. */
export function getContractKindDef(kind: string): ContractKindDefV2 | undefined {
  return CONTRACT_KIND_DEF_BY_KIND.get(kind);
}

/** Kunci bab wajib (CO) satu jenis, urut outline; kosong bila jenis tidak terdaftar (dipakai kelengkapan §6.5). */
export function requiredOutlineChapterKeys(kind: string): string[] {
  return (getContractKindDef(kind)?.outline ?? []).filter((o) => o.required).map((o) => o.chapterKey);
}
