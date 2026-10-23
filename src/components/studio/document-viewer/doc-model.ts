/*
 * Model data halaman Dokumen Studio (SR-30; UX-01 §3b-§3d, W5-W9).
 *
 * Modul murni (tanpa React, tanpa fetch): bentuk respons route yang dipakai UI
 * dan pemetaan ke istilah layar awam (§1.2). Bentuk respons diketik dari kode
 * route yang sudah mendarat (2026-10-23) dan register 03 §12, karena curl
 * bersesi tidak tersedia untuk baris ini (curl tanpa sesi: semua route 401):
 *   R04 GET  src/app/api/studio/documents/route.ts
 *   R05 GET  src/app/api/studio/documents/[id]/route.ts
 *   R07 GET  src/app/api/studio/documents/[id]/revisions/route.ts (RevisionSummary[])
 *   R14 GET  src/app/api/studio/documents/[id]/structure/route.ts
 *   R15 GET  src/app/api/studio/documents/[id]/completeness/route.ts
 *   R16      src/app/api/studio/documents/[id]/paragraphs/[pid]/route.ts
 *   R17 POST src/app/api/studio/documents/[id]/render/_lib/handler.ts
 *   R18 POST src/app/api/studio/assets/route.ts
 *   R20 GET  src/app/api/studio/documents/[id]/content/route.ts
 * Kunci teknis (pid, slotKey, alamat, kode) tidak pernah dikembalikan sebagai
 * label layar; hanya untuk Info teknis (ADMIN) dan URL.
 */
import type {
  BlockV2,
  ChapterV2,
  CompletenessReportV2,
  DocMeta,
  InlineV2,
  NormSkeletonV2,
  OutlineEntryV2,
  RunV2,
  SlotNodeV2,
  StudioDocV2Resolved,
} from "@/lib/studio/contract";
import type { AddressNode, DocumentSummary, OutputFileDto, RenderJobDto, RevisionSummary, TemplateSummary } from "@/lib/studio/contract/types/api";
import type { StudioCompleteness, StudioRenderScopeKind } from "@/lib/studio/contract/enums";
import {
  changeScopeLabel as sharedChangeScopeLabel,
  chapterLabel,
  missingLabel,
  missingLabels,
  slotLabel,
  type ChangeScopeResolvers,
} from "@/components/studio/shared/labels";

// ── Bentuk respons route ─────────────────────────────────────────────────

export interface DocumentListItem extends DocumentSummary {
  docKey: string | null;
  completeness: { status: StudioCompleteness; missingRequired: string[] };
}

/** R04 GET. */
export interface DocumentListResponse {
  documents: DocumentListItem[];
  nextCursor: string | null;
}

/** R05 GET. */
export interface DocumentDetail {
  document: DocumentSummary & { docKey: string | null; completeness: StudioCompleteness };
  revision: RevisionSummary & { schemaId: string; changeScope: string | null; completeness: StudioCompleteness };
  tree: AddressNode[];
  slots: SlotNodeV2[];
  completeness: CompletenessReportV2 | null;
  outputs: OutputFileDto[];
  lint: unknown;
}

/** R14 GET. */
export interface StructureResponse {
  revisionNo: number;
  skeleton: NormSkeletonV2 | null;
  order: string[];
  outlines: Record<string, OutlineEntryV2[] | null>;
  meta: DocMeta | null;
  templateVersion: { slug: string; versionNo: number } | null;
  completeness: CompletenessReportV2 | null;
}

/** R15 GET. */
export interface CompletenessResponse {
  documentId: string;
  completeness: CompletenessReportV2;
}

/** R20 GET tanpa parameter. */
export interface ContentResponse {
  document: { id: string; docNumber: string };
  revisionNo: number;
  content: StudioDocV2Resolved;
}

/** Entri riwayat pid (R16 `?history=1`). */
export interface PidHistoryEntry {
  revisionNo: number;
  changeScope: string | null;
  by: string;
  at: string;
  contentSha256: string | null;
  address: string | null;
  retired: boolean;
}

/** R16 GET. */
export interface ParagraphResponse {
  pid: string;
  kind: "BLOCK" | "SUBSECTION" | "CHAPTER" | string;
  address: string | null;
  type: string;
  content: BlockV2 | Record<string, unknown>;
  revisionNo: number;
  history?: PidHistoryEntry[];
}

export type RenderJobScoped = RenderJobDto & { scope: { kind: StudioRenderScopeKind; key?: string }; draft: boolean };

/** R16 PATCH 200. */
export interface PatchPidResponse {
  revision: { revisionNo: number; changeScope?: string };
  pid: string;
  newPid?: string;
  address: string | null;
  addressMap: Record<string, string>;
  rebased: boolean;
  baseRevisionNo: number;
  appliedOnRevisionNo: number;
  completeness: CompletenessReportV2;
  job?: RenderJobScoped;
  outputs?: OutputFileDto[];
  /** Sisa usang (D-247: R16 tidak lagi merender); tidak diisi server. */
  renderRefused?: { code: "DOCUMENT_INCOMPLETE"; allowedScopes: Array<"chapter" | "slot">; forwardToController: string };
}

/** R17 POST 200. */
export interface RenderResponse {
  job: RenderJobScoped;
  outputs: OutputFileDto[];
  completeness: CompletenessReportV2;
}

/** R07 GET. */
export interface RevisionsResponse {
  revisions: RevisionSummary[];
}

/** R18 POST. */
export interface AssetResponse {
  asset: { sha256: string; mime: string; widthPx: number; heightPx: number; bytes: number; createdAt: string };
  created: boolean;
}

/** R01 GET. */
export interface TemplatesResponse {
  templates: Array<TemplateSummary & { isPreset?: boolean; restricted?: boolean }>;
}

/**
 * Badan PATCH R16 (register §12). Sengaja TANPA medan `render`: sejak D-247
 * server menolaknya (`RENDER_FIELD`); berkas dibuat lewat R17 sesudah simpan.
 */
export interface PatchPidBody {
  op: "replace" | "insertBefore" | "insertAfter" | "delete" | "move";
  baseRevisionNo: number;
  block?: BlockV2;
  to?: { before?: string; after?: string; section?: { chapterKey: string; sectionNo: number; at: number } };
  change: { what: string; why: string; impact: string };
}

/** Detail 409 `SCOPE_CONFLICT` (register §11.3). */
export interface ScopeConflictDetails {
  pid?: string;
  baseRevisionNo?: number;
  changedInRevisionNo?: number;
  changedBy?: string;
  currentContent?: BlockV2 | Record<string, unknown>;
}

export function scopeConflictOf(details: unknown): ScopeConflictDetails {
  if (!details || typeof details !== "object" || Array.isArray(details)) return {};
  const d = details as Record<string, unknown>;
  return {
    pid: typeof d.pid === "string" ? d.pid : undefined,
    baseRevisionNo: typeof d.baseRevisionNo === "number" ? d.baseRevisionNo : undefined,
    changedInRevisionNo: typeof d.changedInRevisionNo === "number" ? d.changedInRevisionNo : undefined,
    changedBy: typeof d.changedBy === "string" ? d.changedBy : undefined,
    currentContent: d.currentContent && typeof d.currentContent === "object" ? (d.currentContent as Record<string, unknown>) : undefined,
  };
}

/** Laporan kelengkapan dari `details` 409 `DOCUMENT_INCOMPLETE` (bila ada). */
export function incompleteReportOf(details: unknown): CompletenessReportV2 | null {
  if (!details || typeof details !== "object") return null;
  const c = (details as { completeness?: unknown }).completeness;
  if (!c || typeof c !== "object") return null;
  const r = c as Partial<CompletenessReportV2>;
  return Array.isArray(r.missingRequired) && Array.isArray(r.slots) ? (r as CompletenessReportV2) : null;
}

// ── Kelengkapan -> rel + teks awam ───────────────────────────────────────

/** Slot berbab utama (sectionType `chapter`) dari laporan. */
export function chapterSlotOf(report: Pick<CompletenessReportV2, "slots">): string | null {
  return report.slots.find((s) => s.sectionType === "chapter")?.slotKey ?? null;
}

/*
 * Rel kelengkapan menerima `CompletenessReportV2` langsung (FIX-U, IP-57);
 * adaptor `toRailSummary` lama sudah dihapus. Label kekurangan memakai satu
 * pemeta bersama `shared/labels.missingLabel` (L5).
 */

export { missingLabel, missingLabels };

/** Ringkasan kekurangan dari daftar ringkas R04 (tanpa label templat): pakai label bawaan. */
export function briefMissingLabels(missing: readonly string[]): string[] {
  return missing.map((raw) => {
    const i = raw.indexOf(":");
    if (i > 0) return chapterLabel(raw.slice(i + 1));
    if (raw === "content") return "Bab pertama";
    return slotLabel(raw);
  });
}

/** Teks "Salin ringkasan kekurangan" (W6), disusun klien dari label awam. */
export function missingSummaryText(title: string, docNumber: string, report: CompletenessReportV2): string {
  const missing = missingLabels(report);
  if (missing.length === 0) return `${title} (${docNumber}) sudah lengkap pada versi ${report.revisionNo}.`;
  return `${title} (${docNumber}) belum lengkap pada versi ${report.revisionNo}. Belum ada: ${missing.join(", ")}.`;
}

// ── Inline v2 -> teks/run ────────────────────────────────────────────────

export function isRunsInline(i: unknown): i is { runs: RunV2[] } {
  return !!i && typeof i === "object" && Array.isArray((i as { runs?: unknown }).runs);
}

export function isTextInline(i: unknown): i is { text: string } {
  return !!i && typeof i === "object" && typeof (i as { text?: unknown }).text === "string";
}

/** Teks polos InlineV2 (tanpa penanda). */
export function inlinePlain(i: InlineV2 | null | undefined): string {
  if (!i) return "";
  if (isTextInline(i)) return i.text;
  if (isRunsInline(i)) {
    return i.runs
      .map((r) => ("t" in r ? r.t : "tab" in r ? "\t" : "\n"))
      .join("");
  }
  return "";
}

/** Run tampilan (sudah diurai) untuk dirender React. */
export interface DisplayRun {
  t: string;
  strong?: boolean;
  em?: boolean;
  code?: boolean;
  sup?: boolean;
  sub?: boolean;
  br?: boolean;
  tab?: boolean;
}

/** md-lite Garis A (KS-03) disederhanakan untuk tampilan tinjau: `**tebal**`, `*miring*`, `` `kode` ``. */
const MD_LITE_RE = /(\*\*.+?\*\*|`[^`]+`|\*[^*\n]+\*)/;

export function displayRuns(i: InlineV2 | null | undefined): DisplayRun[] {
  if (!i) return [];
  if (isRunsInline(i)) {
    return i.runs.map((r) => {
      if ("tab" in r) return { t: "\t", tab: true };
      if ("br" in r) return { t: "\n", br: true };
      return { t: r.t, strong: r.strong, em: r.em, code: r.code, sup: r.sup, sub: r.sub };
    });
  }
  if (!isTextInline(i)) return [];
  const out: DisplayRun[] = [];
  for (const tok of i.text.split(MD_LITE_RE)) {
    if (!tok) continue;
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) out.push({ t: tok.slice(2, -2), strong: true });
    else if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) out.push({ t: tok.slice(1, -1), code: true });
    else if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) out.push({ t: tok.slice(1, -1), em: true });
    else out.push({ t: tok });
  }
  return out;
}

// ── Teks sunting <-> run ─────────────────────────────────────────────────
//
// Editor memakai penanda ringan yang dapat dibalik tanpa kehilangan:
//   **tebal**  *miring*  `kode`  ^superskrip^  ~subskrip~
// Penanda menyalakan/mematikan sifat (boleh bertumpuk); `\` meloloskan
// karakter penanda. Baris baru = pindah baris, tab = tab. Hasil selalu
// `{ runs }` (penanda makna v2), bukan md-lite, agar tidak ada tafsir ganda.

type Flag = "strong" | "em" | "code" | "sup" | "sub";

const MARK_OF: Record<Flag, string> = { strong: "**", em: "*", code: "`", sup: "^", sub: "~" };
const FLAG_ORDER: Flag[] = ["strong", "em", "code", "sup", "sub"];
const ESCAPABLE = /[\\*`^~]/g;

function escapeText(t: string): string {
  return t.replace(ESCAPABLE, (c) => `\\${c}`);
}

export function runsToEditorText(i: InlineV2 | null | undefined): string {
  if (!i) return "";
  if (isTextInline(i)) {
    // md-lite: penanda tebal/miring/kode sama dengan editor; karakter lain diloloskan.
    return displayRuns(i)
      .map((r) => {
        const body = escapeText(r.t);
        if (r.strong) return `**${body}**`;
        if (r.em) return `*${body}*`;
        if (r.code) return `\`${body}\``;
        return body;
      })
      .join("");
  }
  if (!isRunsInline(i)) return "";
  let out = "";
  for (const r of i.runs) {
    if ("tab" in r) {
      out += "\t";
      continue;
    }
    if ("br" in r) {
      out += "\n";
      continue;
    }
    const flags = FLAG_ORDER.filter((f) => r[f]);
    out += flags.map((f) => MARK_OF[f]).join("") + escapeText(r.t) + [...flags].reverse().map((f) => MARK_OF[f]).join("");
  }
  return out;
}

export function editorTextToRuns(text: string): RunV2[] {
  const runs: RunV2[] = [];
  const state: Record<Flag, boolean> = { strong: false, em: false, code: false, sup: false, sub: false };
  let buf = "";
  const flush = () => {
    if (!buf) return;
    const r: { t: string; strong?: boolean; em?: boolean; code?: boolean; sup?: boolean; sub?: boolean } = { t: buf };
    for (const f of FLAG_ORDER) if (state[f]) r[f] = true;
    // `sup` dan `sub` tidak boleh keduanya (T2-01): sub dibuang bila bentrok.
    if (r.sup && r.sub) delete r.sub;
    runs.push(r);
    buf = "";
  };
  const toggle = (f: Flag) => {
    flush();
    state[f] = !state[f];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\" && i + 1 < text.length && /[\\*`^~]/.test(text[i + 1])) {
      buf += text[i + 1];
      i++;
    } else if (c === "*" && text[i + 1] === "*") {
      toggle("strong");
      i++;
    } else if (c === "*") toggle("em");
    else if (c === "`") toggle("code");
    else if (c === "^") toggle("sup");
    else if (c === "~") toggle("sub");
    else if (c === "\n") {
      flush();
      runs.push({ br: "line" });
    } else if (c === "\t") {
      flush();
      runs.push({ tab: true });
    } else buf += c;
  }
  flush();
  return runs;
}

/** Inline dari teks editor; teks tanpa penanda tetap `runs` satu run. */
export function editorTextToInline(text: string): InlineV2 {
  const runs = editorTextToRuns(text);
  return { runs: runs.length ? runs : [{ t: "" }] };
}

// ── Blok ─────────────────────────────────────────────────────────────────

/** Jenis blok yang dapat disunting teksnya di tempat (T-13: tabel/grafik tidak). */
export function isEditableText(block: BlockV2): boolean {
  return block.type === "paragraph" || block.type === "list";
}

export function isImageBlock(block: BlockV2): block is Extract<BlockV2, { type: "image" }> {
  return block.type === "image";
}

/** Teks editor untuk blok yang dapat disunting. Daftar: satu butir per baris. */
export function blockEditorText(block: BlockV2): string {
  if (block.type === "paragraph") return runsToEditorText(block as InlineV2);
  if (block.type === "list") return block.items.map((it) => runsToEditorText(it).replace(/\n/g, " ")).join("\n");
  return "";
}

/**
 * Blok baru dari teks editor; medan non-tampilan lain dipertahankan (role,
 * rail, ordered). Pid tidak dikirim di `block` (pid tetap pada replace).
 */
export function blockFromEditor(original: BlockV2 | null, text: string): BlockV2 {
  if (original?.type === "list") {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const items = (lines.length ? lines : [""]).map((l, idx) => {
      const prevRail = original.items[idx]?.rail;
      return { ...editorTextToInline(l), ...(prevRail ? { rail: prevRail } : {}) };
    });
    return { type: "list", ...(original.ordered !== undefined ? { ordered: original.ordered } : {}), items };
  }
  const base: Record<string, unknown> = {};
  if (original?.type === "paragraph") {
    if (original.role) base.role = original.role;
    if (original.rail) base.rail = original.rail;
  }
  return { ...base, type: "paragraph", ...editorTextToInline(text) } as BlockV2;
}

/** Hapus `id` (pid) dari blok sebelum dikirim sebagai isi pengganti. */
export function withoutId<T extends object>(b: T): T {
  const copy = { ...(b as Record<string, unknown>) };
  delete copy.id;
  return copy as T;
}

// ── Penomoran dan lingkup perubahan ──────────────────────────────────────

/** Peta pid -> nomor/label dari pohon R05 (nomor dokumen, bukan "alamat"). */
export interface NumberIndex {
  number: Map<string, string>;
  artifactLabel: Map<string, string>;
}

export function buildNumberIndex(slots: readonly SlotNodeV2[]): NumberIndex {
  const number = new Map<string, string>();
  const artifactLabel = new Map<string, string>();
  for (const s of slots) {
    for (const c of s.chapters ?? []) {
      number.set(c.pid, c.address || c.key);
      for (const sec of c.sections) {
        number.set(sec.pid, sec.address);
        for (const b of sec.blocks) {
          if (b.address) number.set(b.pid, b.address);
          if (b.artifactLabel) artifactLabel.set(b.pid, b.artifactLabel);
        }
      }
    }
  }
  return { number, artifactLabel };
}

/** Label satu nomor tercatat: "3.2.2" -> "Paragraf 3.2.2"; "F:controlSheet" -> "Lembar kendali". */
export function numberLabel(addr: string, slotLabels?: ReadonlyMap<string, string>): string {
  if (addr.startsWith("F:")) {
    const key = addr.slice(2).split("/")[0];
    return slotLabels?.get(key) ?? slotLabel(key);
  }
  const parts = addr.split(".");
  if (parts.length >= 3) return `Paragraf ${addr}`;
  if (parts.length === 2) return `Subbab ${addr}`;
  return /^[A-Z]$/.test(addr) ? `Lampiran ${addr}` : chapterLabel(addr);
}

/** Lingkup awam dari daftar nomor yang berubah (R07 `changedAddresses`). */
export function changedLabel(addrs: readonly string[], slotLabels?: ReadonlyMap<string, string>): string {
  if (addrs.length === 0) return "Dokumen";
  if (addrs.length === 1) return numberLabel(addrs[0], slotLabels);
  const first = addrs.slice(0, 2).map((a) => numberLabel(a, slotLabels));
  return addrs.length > 2 ? `${first.join(", ")} dan ${addrs.length - 2} lainnya` : first.join(", ");
}

/** Penerjemah kode lingkup untuk label bersama (`shared/labels.ts`). */
export function scopeResolvers(slotLabels?: ReadonlyMap<string, string>, numbers?: ReadonlyMap<string, string>): ChangeScopeResolvers {
  return {
    slotLabels,
    pid: (pid) => {
      const n = numbers?.get(pid);
      return n ? numberLabel(n, slotLabels) : null;
    },
    address: (addr) => numberLabel(addr, slotLabels),
  };
}

/** Lingkup awam dari `changeScope` (tata bahasa register §9.5); pemeta di `shared/labels.ts`. */
export function changeScopeLabel(scope: string | null | undefined, slotLabels?: ReadonlyMap<string, string>, numbers?: ReadonlyMap<string, string>): string | null {
  return sharedChangeScopeLabel(scope, scopeResolvers(slotLabels, numbers));
}

/** Ringkas `addressMap` jadi kalimat "Penomoran bergeser: 3.2.3 menjadi 3.2.4". */
export function shiftSentence(map: Record<string, string> | undefined): string | null {
  if (!map) return null;
  const pairs = Object.entries(map).filter(([a, b]) => a && b && a !== b && !a.startsWith("F:"));
  if (pairs.length === 0) return null;
  const shown = pairs.slice(0, 3).map(([a, b]) => `${a} menjadi ${b}`);
  return `Penomoran bergeser: ${shown.join(", ")}${pairs.length > 3 ? `, dan ${pairs.length - 3} lainnya` : ""}.`;
}

// ── Berkas ───────────────────────────────────────────────────────────────

export type FileGroupKind = "full" | "chapterDraft" | "appendixDraft" | "slotDraft" | "figure";

export interface FileGroupInfo {
  kind: FileGroupKind;
  /** "Berkas lengkap", "Draf bab 3", "Draf bagian Lembar kendali", "Gambar". */
  label: string;
  draft: boolean;
}

/**
 * Golongan berkas dari tata letak path draf (register §12: `rev-<n>/bab-<k>/`,
 * `lamp-<k>/`, `slot-<slotKey>/`). DTO belum membawa `draft` (permintaan ke
 * pemilik storage dicatat).
 */
export function fileGroupOf(f: Pick<OutputFileDto, "relPath" | "role">, slotLabels?: ReadonlyMap<string, string>): FileGroupInfo {
  if (f.role === "FIGURE") return { kind: "figure", label: "Gambar dalam dokumen", draft: false };
  const m = /(?:^|\/)(bab|lamp|slot)-([^/]+)\//.exec(f.relPath.replace(/\\/g, "/"));
  if (!m) return { kind: "full", label: "Berkas lengkap", draft: false };
  const key = m[2];
  if (m[1] === "bab") return { kind: "chapterDraft", label: `Draf bab ${key}`, draft: true };
  if (m[1] === "lamp") return { kind: "appendixDraft", label: `Draf lampiran ${key.toUpperCase()}`, draft: true };
  return { kind: "slotDraft", label: `Draf bagian ${slotLabels?.get(key) ?? slotLabel(key)}`, draft: true };
}

/** Peta slotKey -> label layar dari laporan kelengkapan / pohon. */
export function slotLabelMap(report: CompletenessReportV2 | null, slots?: readonly SlotNodeV2[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of slots ?? []) m.set(s.slotKey, slotLabel(s.slotKey, s.label));
  for (const s of report?.slots ?? []) m.set(s.slotKey, slotLabel(s.slotKey, s.label));
  return m;
}

// ── Pembuatan dokumen (D-153) ────────────────────────────────────────────

/** Pola folder misi (sama dengan layanan storage `MISSION_FOLDER_RE`). */
export const MISSION_FOLDER_RE = /^\d{4}-\d{2}-\d{2}[_-][a-z0-9][a-z0-9_-]{0,80}$/;

/** Kunci dokumen misi dari judul (C23 `^[a-z0-9]+(-[a-z0-9]+)*$`, maks 64). */
export function docKeyFromTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return base || `dokumen-${Date.now().toString(36)}`;
}

// ── Isi dokumen ──────────────────────────────────────────────────────────

/** Bab dari payload slot berulang di isi R20. */
export function chaptersOf(content: StudioDocV2Resolved | undefined, slotKey: string): ChapterV2[] {
  const p = content?.sections?.[slotKey] as { chapters?: ChapterV2[] } | undefined;
  return Array.isArray(p?.chapters) ? p.chapters : [];
}

/** Payload slot tak-berulang (apa adanya) dari isi R20. */
export function slotPayloadOf(content: StudioDocV2Resolved | undefined, slotKey: string): Record<string, unknown> | null {
  const p = content?.sections?.[slotKey];
  return p && typeof p === "object" ? (p as unknown as Record<string, unknown>) : null;
}

/** Cari blok ber-pid di isi R20 (untuk sunting dan riwayat). */
export function findBlock(content: StudioDocV2Resolved | undefined, pid: string): BlockV2 | null {
  for (const payload of Object.values(content?.sections ?? {})) {
    const chapters = (payload as { chapters?: ChapterV2[] }).chapters;
    if (!Array.isArray(chapters)) continue;
    for (const c of chapters) {
      for (const b of c.intro ?? []) if (b.id === pid) return b;
      for (const s of c.sections) for (const b of s.blocks) if (b.id === pid) return b;
    }
  }
  return null;
}
