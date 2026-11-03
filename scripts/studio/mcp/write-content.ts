/**
 * IMPL-W (D-521/D-522): jalur tulis minimal. Agen hanya mengirim ISI tersusun (judul bagian + blok: string =
 * paragraf, larik baris = tabel); mesin di modul ini menyusun teks Markdown laporan kerja yang SUDAH dipahami
 * konverter `studio-report` (md-report), lalu alat `studio_write` mengirimnya lewat jalur submit yang sama
 * (semua aturan keamanan D-480..D-493 berlaku apa adanya). Murni: tanpa I/O, tanpa jaringan.
 *
 * Perbaikan otomatis yang aman (setiap perbaikan = satu peringatan): judul bagian dipetakan ke bab kontrak lewat
 * alias registri + alias tambahan + kecocokan kata utuh; tabel ber-kolom status dikenali sebagai tabel butir kerja
 * (kunci stabil dibangkitkan bila kosong, nama kolom dan status butir dinormalkan); record diisi (Owner dari agentId,
 * Status bawaan draft, ReportedAt hari ini). Ditolak hanya yang tidak dapat disimpulkan aman: bab wajib tanpa isi.
 */
import { createHash } from "node:crypto";
import { getContractKindDef } from "../../../src/lib/studio/registry/contracts";
import { CONTRACT_ACTOR_PATTERN, CONTRACT_KEY_PATTERN } from "../../../src/lib/studio/contract/env";
import { mdReportRules, MD_REPORT_DEFAULT_KIND } from "../../../src/lib/studio/services/draft/md-report";
import { normalizeHeading } from "../../../src/lib/studio/services/import/contract/parse";
import { McpToolError } from "./safety";
import type { ToolWarning } from "./tool-kit";

// ── Bentuk masukan ──────────────────────────────────────────────────────

export type Cell = string | number;
export type Rows = Cell[][];
export interface ChartInput {
  type?: string;
  categories: Cell[];
  series: Array<{ name: string; values: Array<number | null> }>;
  caption?: string;
  source?: string;
  unit?: string;
}
export type Block = string | Rows | { table: Rows; caption?: string; source?: string } | { chart: ChartInput } | { list: string[]; ordered?: boolean };
export interface SectionInput {
  heading: string;
  blocks: Block[];
}

export const isRows = (b: unknown): b is Rows => Array.isArray(b) && b.every((r) => Array.isArray(r));
const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

// ── Sanitasi teks (struktur Markdown milik mesin, bukan isi) ────────────

/** Garis horizontal (sama dengan `HR_LINE_RE` serializer md-report). */
const HR_LINE_RE = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
/** Paragraf yang dibaca importer sebagai caption/sumber (sama dengan `CAPTIONISH_RE` md-report). */
const CAPTIONISH_RE = /^(?:\*{1,2}|_{1,2})?(?:Tabel|Table|Gambar|Figure|Fig|Sumber|Source)\b/i;
/**
 * Awal baris berbentuk `Kunci: nilai` (lebih luas dari `KV_RE` generator dan pembaca kunci alat `agentId:`/`basis:`/
 * `mission:`): nilai kosong dan awalan daftar/kutipan ikut, agar tidak satu pun baris paragraf menjadi medan record.
 */
const KEYISH_RE = /^(?:[-*>+]\s*)*\*{0,2}[A-Za-zÀ-ÿ_][\wÀ-ÿ /.-]{0,40}?\*{0,2}\s*:/;

/**
 * M-1 (review 13, D-529): satu aturan escape awal baris setara `guardLineStart` serializer server (`md-report.ts`), plus
 * pagar kode, penanda konflik, `Kunci:` yang lebih luas, dan SETIAP `|` (findTables mengenali tabel tanpa `|` awal).
 * Masukan: satu baris teks (spasi awal dibuang: indentasi 4 spasi = blok kode).
 */
export function guardLine(raw: string): string {
  let out = raw.replace(/^\s+/, "").replace(/\s+$/, "");
  out = out.replace(/(?<!\\)\|/g, "\\|");
  // R-1 (siklus 2): komentar HTML dibuang konverter (menelan teks) -> setiap `<!--` dinetralkan.
  out = out.replace(/<!--/g, "<\\!--");
  // `:` di awal = baris pemisah tabel (`:--`) -> di-escape seperti penanda blok lain.
  if (/^[#>+=|:-]/.test(out) || HR_LINE_RE.test(out) || /^(?:`{3,}|~{3,}|<{7})/.test(out)) out = `\\${out}`;
  else {
    const m = /^(\d{1,9})([.)])/.exec(out);
    if (m) out = `${m[1]}\\${m[2]}${out.slice(m[0].length)}`;
  }
  const kv = KEYISH_RE.exec(out);
  if (kv) {
    const k = kv[0].length - 1;
    out = `${out.slice(0, k)}\\${out.slice(k)}`;
  }
  if (CAPTIONISH_RE.test(out)) out = out.replace(/(?<!\\)([.:])/g, "\\$1");
  return out;
}

/** Satu paragraf: setiap baris lewat {@link guardLine}; peringatan bila ada baris yang berubah. */
export function paragraphLines(s: string, warn: (w: ToolWarning) => void, where: string): string[] {
  const lines = s.replace(/\r\n?/g, "\n").split("\n");
  const out = lines.map(guardLine);
  // Escape `\:` / `\.` tidak terlihat di hasil (tanpa peringatan); peringatan hanya bila awal baris atau `|` berubah.
  if (out.some((l, i) => l.replace(/\\([:.])/g, "$1") !== lines[i].trim())) warn({ code: "TEXT_ESCAPED", message: `${where}: baris yang menyerupai struktur (judul, tabel, pagar, daftar, Kunci: nilai) di dalam teks di-escape agar tetap teks` });
  return out;
}

export function cellText(c: unknown): string {
  return String(c ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\\?\|/g, "\\|")
    .trim();
}

export function tableLines(rows: Rows, warn: (w: ToolWarning) => void, where: string): string[] {
  const width = Math.max(1, rows[0]?.length ?? 1);
  let padded = false;
  const norm = rows.map((r) => {
    if (r.length === width) return r;
    padded = true;
    return r.length > width ? r.slice(0, width) : [...r, ...Array.from({ length: width - r.length }, () => "")];
  });
  if (padded) warn({ code: "TABLE_ROW_PADDED", message: `${where}: baris tabel disamakan lebarnya dengan baris judul (${width} kolom)` });
  const line = (r: Cell[]) => `| ${r.map(cellText).join(" | ")} |`;
  return [line(norm[0]), `|${" --- |".repeat(width)}`, ...norm.slice(1).map(line)];
}

// ── Judul bagian -> bab kontrak laporan kerja ───────────────────────────

/** Alias tambahan (Inggris/Indonesia umum) di atas alias registri; nilai = kunci bab outline. */
const EXTRA_HEADINGS: Readonly<Record<string, string>> = {
  summary: "1", "executive summary": "1", ikhtisar: "1", overview: "1", abstrak: "1", "ringkasan pekerjaan": "1",
  details: "2", "work done": "2", work: "2", pekerjaan: "2", "rincian pekerjaan": "2", "uraian kerja": "2", tasks: "2", "butir kerja": "2", "work items": "2", kegiatan: "2", aktivitas: "2", progress: "2", kemajuan: "2",
  evidence: "3", proof: "3", artifacts: "3", outputs: "3", "hasil uji": "3", tests: "3", testing: "3", pengujian: "3", validasi: "3", validation: "3",
  issues: "4", "open issues": "4", risks: "4", risiko: "4", kendala: "4", masalah: "4", hambatan: "4", blockers: "4", problems: "4",
  "next steps": "5", next: "5", rencana: "5", "rencana berikut": "5", "tindak lanjut": "5", "follow up": "5", "follow-up": "5", plan: "5", "langkah selanjutnya": "5", selanjutnya: "5",
};

export interface ChapterMap {
  /** kunci bab -> judul outline kanonik. */
  titles: Map<string, string>;
  required: string[];
  /** alias ternormalisasi -> kunci bab. */
  aliases: Map<string, string>;
}

let chapterMapCache: ChapterMap | null = null;
export function workReportChapters(): ChapterMap {
  if (chapterMapCache !== null) return chapterMapCache;
  const def = getContractKindDef(MD_REPORT_DEFAULT_KIND);
  if (!def) throw new McpToolError("INTERNAL_ERROR", "registri kontrak laporan kerja tidak tersedia");
  const titles = new Map(def.outline.map((o) => [o.chapterKey, o.title] as [string, string]));
  const aliases = new Map<string, string>();
  for (const c of mdReportRules().chapters) for (const t of c.titles) aliases.set(normalizeHeading(t), c.key);
  for (const [t, k] of Object.entries(EXTRA_HEADINGS)) if (!aliases.has(normalizeHeading(t))) aliases.set(normalizeHeading(t), k);
  chapterMapCache = { titles, required: def.outline.filter((o) => o.required).map((o) => o.chapterKey), aliases };
  return chapterMapCache;
}

const stripNumber = (h: string) => h.replace(/^\s*(?:bab|chapter|bagian)?\s*[([]?(?:\d{1,3}|[A-Za-z])[.)\]:]\s+/i, "").trim();

/**
 * Kunci bab untuk satu judul: alias persis (registri/tambahan) -> tanpa perubahan judul; kata utuh alias di dalam
 * judul dan hanya satu bab yang cocok -> judul diganti judul outline (peringatan). null = bab tambahan.
 */
export function mapHeading(heading: string, m: ChapterMap): { key: string | null; heading: string; how: "exact" | "alias" | "words" | "none" } {
  const bare = stripNumber(heading);
  const n = normalizeHeading(bare);
  const exact = m.aliases.get(n);
  if (exact !== undefined) {
    const viaExtra = EXTRA_HEADINGS[bare.toLowerCase()] !== undefined && !mdReportRules().chapters.some((c) => c.titles.includes(n));
    return viaExtra ? { key: exact, heading: m.titles.get(exact) ?? bare, how: "alias" } : { key: exact, heading: bare, how: "exact" };
  }
  const words = ` ${n.replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim()} `;
  const hits = new Set<string>();
  for (const [alias, key] of m.aliases) {
    const a = alias.replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
    if (a.length >= 4 && words.includes(` ${a} `)) hits.add(key);
  }
  if (hits.size === 1) {
    const key = [...hits][0];
    return { key, heading: m.titles.get(key) ?? bare, how: "words" };
  }
  return { key: null, heading: bare, how: "none" };
}

// ── Tabel butir kerja ───────────────────────────────────────────────────

const COLUMN_ALIASES: Readonly<Record<string, "key" | "judul" | "status" | "owner" | "bukti">> = {
  key: "key", kunci: "key", id: "key", kode: "key", code: "key", no: "key", "#": "key", kartu: "key", card: "key", "item id": "key",
  judul: "judul", title: "judul", butir: "judul", item: "judul", task: "judul", tugas: "judul", pekerjaan: "judul", nama: "judul", name: "judul", kegiatan: "judul", deskripsi: "judul", description: "judul",
  status: "status", state: "status", keadaan: "status", progress: "status",
  owner: "owner", pemilik: "owner", assignee: "owner", agen: "owner", agent: "owner", pic: "owner", "penanggung jawab": "owner",
  bukti: "bukti", evidence: "bukti", artefak: "bukti", artifact: "bukti", berkas: "bukti", file: "bukti",
};

const ITEM_STATUS_ALIASES: Readonly<Record<string, string>> = {
  done: "done", selesai: "done", complete: "done", completed: "done", finished: "done", ok: "done", beres: "done", tuntas: "done", sudah: "done", lulus: "done", pass: "done", passed: "done",
  running: "running", berjalan: "running", "in progress": "running", "in-progress": "running", ongoing: "running", sedang: "running", proses: "running", wip: "running", dikerjakan: "running",
  todo: "todo", "to do": "todo", belum: "todo", pending: "todo", open: "todo", sisa: "todo", planned: "todo",
  ready: "ready", siap: "ready",
  review: "review", ditinjau: "review", tinjau: "review",
  blocked: "blocked", terhambat: "blocked", blokir: "blocked", macet: "blocked",
  cancelled: "cancelled", canceled: "cancelled", batal: "cancelled", dibatalkan: "cancelled",
};

const KEY_RE = new RegExp(CONTRACT_KEY_PATTERN);
const ACTOR_RE = new RegExp(CONTRACT_ACTOR_PATTERN);

/** Kunci butir stabil dari judul (sama selama judul sama): `K-` + 8 heksa sha256. */
export function stableKey(seed: string): string {
  return `K-${createHash("sha256").update(seed.trim().toLowerCase(), "utf8").digest("hex").slice(0, 8)}`;
}

/**
 * Tabel ber-kolom status (+ kunci atau judul) = tabel butir kerja: nama kolom dinormalkan ke nama yang dibaca
 * konverter, kolom `key` disisipkan bila tidak ada, kunci kosong/tak sah dibangkitkan/dirapikan, status butir
 * dipetakan ke kode registri. Tabel lain dikembalikan apa adanya.
 */
export function repairItemTable(rows: Rows, warn: (w: ToolWarning) => void, where: string, used: Set<string>): Rows {
  if (rows.length < 2) return rows;
  const roles = rows[0].map((h) => COLUMN_ALIASES[String(h).trim().toLowerCase()] ?? null);
  const statusIdx = roles.indexOf("status");
  let keyIdx = roles.indexOf("key");
  const titleIdx = roles.indexOf("judul");
  if (statusIdx < 0 || (keyIdx < 0 && titleIdx < 0)) return rows;
  let out: Rows = rows.map((r) => [...r]);
  const renamed = rows[0].filter((h, i) => roles[i] !== null && String(h).trim().toLowerCase() !== roles[i]);
  out[0] = out[0].map((h, i) => roles[i] ?? h);
  if (renamed.length > 0) warn({ code: "ITEM_COLUMNS_RENAMED", message: `${where}: kolom tabel butir dinormalkan (${renamed.map(String).join(", ")})` });
  if (keyIdx < 0) {
    out = out.map((r, i) => [i === 0 ? "key" : "", ...r]);
    keyIdx = 0;
    warn({ code: "ITEM_KEY_COLUMN_ADDED", message: `${where}: tabel butir tanpa kolom kunci; kolom key ditambahkan dengan kunci stabil dari judul` });
  }
  const t = titleIdx < 0 ? -1 : titleIdx + (roles.indexOf("key") < 0 ? 1 : 0);
  const s = statusIdx + (roles.indexOf("key") < 0 ? 1 : 0);
  const generated: string[] = [];
  const fixed: string[] = [];
  const unknown: string[] = [];
  for (let i = 1; i < out.length; i++) {
    const r = out[i];
    let key = String(r[keyIdx] ?? "").trim();
    if (key !== "" && !KEY_RE.test(key)) {
      const repaired = key.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[^A-Za-z0-9]+/, "").slice(0, 64);
      if (repaired !== "" && KEY_RE.test(repaired)) fixed.push(`${key} -> ${repaired}`);
      key = KEY_RE.test(repaired) ? repaired : "";
    }
    if (key === "") {
      const seed = t >= 0 && String(r[t] ?? "").trim() !== "" ? String(r[t]) : r.filter((_, j) => j !== keyIdx && j !== s).join(" ");
      key = stableKey(seed === "" ? `${where}#${i}` : seed);
      generated.push(key);
    }
    let k = key;
    for (let n = 2; used.has(k.toLowerCase()); n++) k = `${key}-${n}`;
    used.add(k.toLowerCase());
    r[keyIdx] = k;
    const raw = String(r[s] ?? "").trim().toLowerCase();
    const st = ITEM_STATUS_ALIASES[raw];
    if (st !== undefined) r[s] = st;
    else unknown.push(String(r[s] ?? ""));
    const ownerIdx = out[0].indexOf("owner");
    if (ownerIdx >= 0 && typeof r[ownerIdx] === "string") {
      const o = (r[ownerIdx] as string).trim().toLowerCase().replace(/\s+/g, "-");
      if (ACTOR_RE.test(o)) r[ownerIdx] = o;
    }
  }
  if (generated.length > 0) warn({ code: "ITEM_KEY_GENERATED", message: `${where}: ${generated.length} butir tanpa kunci diberi kunci stabil (${generated.slice(0, 5).join(", ")})` });
  if (fixed.length > 0) warn({ code: "ITEM_KEY_REPAIRED", message: `${where}: kunci butir dirapikan (${fixed.slice(0, 5).join("; ")})` });
  if (unknown.length > 0) warn({ code: "ITEM_STATUS_UNKNOWN", message: `${where}: status butir tidak dikenal (${unknown.slice(0, 5).join(", ")}); baris tetap di teks tetapi tidak masuk record. Pakai done, running, ready, todo, review, blocked, cancelled` });
  return out;
}

/** Grafik di laporan kerja (tanpa figur) -> tabel data kategori x seri, keterangan sebagai paragraf. */
export function chartRows(c: ChartInput): Rows {
  return [["kategori", ...c.series.map((s) => s.name)], ...c.categories.map((cat, i) => [cat, ...c.series.map((s) => (s.values[i] === null || s.values[i] === undefined ? "" : s.values[i] as number))])];
}

// ── Record laporan kerja dari meta ──────────────────────────────────────

const META_RECORD_KEYS: Readonly<Record<string, "status" | "owner" | "verdict" | "initiator" | "taskRef" | "reportedAt" | "cardIds" | "title">> = {
  status: "status", owner: "owner", pemilik: "owner", "penanggung jawab": "owner", verdict: "verdict", vonis: "verdict",
  initiator: "initiator", "pemberi tugas": "initiator", taskref: "taskRef", task: "taskRef", "rujukan tugas": "taskRef", row: "taskRef",
  reportedat: "reportedAt", tanggal: "reportedAt", date: "reportedAt", "waktu lapor": "reportedAt", cardids: "cardIds", kartu: "cardIds",
  title: "title", judul: "title",
};

/** Status laporan tambahan (bahasa sehari-hari) di atas alias registri. */
const RECORD_STATUS_EXTRA: Readonly<Record<string, string>> = {
  selesai: "complete", done: "complete", finished: "complete", tuntas: "complete", lengkap: "complete",
  sebagian: "partial", parsial: "partial", terhambat: "blocked", macet: "blocked", draf: "draft", review: "needs-review", tinjau: "needs-review", "perlu review": "needs-review",
};

const REPORTED_AT_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2}| ?WIB)?)?$/;

export interface WorkReportInput {
  mission: string;
  docKey: string;
  title: string | null;
  meta: Record<string, string>;
  sections: SectionInput[];
  agentId: string | null;
  /** epoch ms (tanggal ReportedAt bawaan, zona +07:00). */
  now: number;
}

export interface BuiltReport {
  markdown: string;
  warnings: ToolWarning[];
  /** kunci bab per bagian masukan (null = bab tambahan). */
  chapters: Array<string | null>;
  /** M-1: judul `##` yang ditulis mesin (urut) untuk cek pasca-konversi. */
  headings: string[];
  /** R-1 (siklus 2): teks paragraf yang diharapkan per judul (urut), untuk mendeteksi teks yang tertelan konversi. */
  paragraphs: string[][];
  /** M-1: kunci butir (huruf kecil) dari tabel butir yang disusun mesin. */
  itemKeys: Set<string>;
  /** M-1: medan record kepala yang ditulis mesin (nama medan kontrak -> nilai). */
  recordFields: Record<string, string>;
}

const HEADER_FIELD: Readonly<Record<string, string>> = { Status: "status", Owner: "owner", ReportedAt: "reportedAt", Verdict: "verdict", Initiator: "initiator", TaskRef: "taskRef", CardIds: "cardIds" };
function fieldsOf(header: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of header) {
    const k = l.indexOf(":");
    const f = HEADER_FIELD[l.slice(0, k)];
    if (f !== undefined) out[f] = l.slice(k + 1).trim();
  }
  return out;
}

/** Tanggal hari ini di zona WIB (+07:00), YYYY-MM-DD. */
export const wibDate = (now: number): string => new Date(now + 7 * 3600_000).toISOString().slice(0, 10);

function recordLines(input: WorkReportInput, warn: (w: ToolWarning) => void): { header: string[]; title: string | null } {
  const v: Partial<Record<string, string>> = {};
  const unknown: string[] = [];
  for (const [k, raw] of Object.entries(input.meta)) {
    const f = META_RECORD_KEYS[k.trim().toLowerCase()];
    const val = String(raw).replace(/\s+/g, " ").trim();
    if (f === undefined) unknown.push(k);
    else if (val !== "") v[f] = val;
  }
  if (unknown.length > 0) warn({ code: "META_IGNORED", message: `meta tidak dipakai laporan kerja: ${unknown.slice(0, 8).join(", ")} (dikenal: status, owner, verdict, initiator, taskRef, reportedAt, cardIds, title)` });
  const def = getContractKindDef(MD_REPORT_DEFAULT_KIND);
  const statuses = { ...RECORD_STATUS_EXTRA, ...(def?.aliases.statuses ?? {}) } as Record<string, string>;
  let status = v.status !== undefined ? statuses[v.status.toLowerCase()] : undefined;
  if (status === undefined) {
    warn({ code: "STATUS_DEFAULTED", message: v.status !== undefined ? `meta.status "${v.status}" tidak dikenal; dipakai draft (pilihan: draft, complete, partial, blocked, needs-review)` : "meta.status tidak diisi; dipakai draft (isi meta.status: complete bila pekerjaan selesai)" });
    status = "draft";
  }
  let owner = v.owner?.toLowerCase().replace(/\s+/g, "-") ?? null;
  if (owner !== null && !ACTOR_RE.test(owner)) {
    warn({ code: "OWNER_INVALID", message: `meta.owner "${v.owner}" bukan id agen (huruf kecil, angka, . _ -); diganti agentId` });
    owner = null;
  }
  if (owner === null && input.agentId !== null) {
    const a = input.agentId.trim().toLowerCase();
    if (ACTOR_RE.test(a)) owner = a;
  }
  let reportedAt = v.reportedAt ?? null;
  if (reportedAt !== null && !REPORTED_AT_RE.test(reportedAt)) {
    warn({ code: "REPORTED_AT_DEFAULTED", message: `meta.reportedAt "${reportedAt}" bukan YYYY-MM-DD; dipakai tanggal hari ini` });
    reportedAt = null;
  }
  const header = [`Status: ${status}`, ...(owner !== null ? [`Owner: ${owner}`] : []), `ReportedAt: ${reportedAt ?? wibDate(input.now)}`];
  for (const [f, label] of [["verdict", "Verdict"], ["initiator", "Initiator"], ["taskRef", "TaskRef"], ["cardIds", "CardIds"]] as const) if (v[f] !== undefined) header.push(`${label}: ${v[f]}`);
  return { header, title: v.title ?? null };
}

/** Paragraf yang dihasilkan satu blok (string dipecah baris kosong; keterangan tabel/grafik = satu paragraf). */
function expectedParagraphs(b: Block): string[] {
  if (typeof b === "string") return b.trim().split(/\n\s*\n/).map((x) => x.trim()).filter((x) => x !== "");
  if (isRows(b)) return [];
  const o = b as unknown as Record<string, unknown>;
  if (isObj(o) && isRows(o.table)) return typeof o.caption === "string" && o.caption.trim() !== "" ? [o.caption.trim()] : [];
  if (isObj(o) && isObj(o.chart)) {
    const c = o.chart as unknown as ChartInput;
    const cap = [c.caption, c.source !== undefined ? `Sumber: ${c.source}` : undefined].filter((x): x is string => typeof x === "string" && x.trim() !== "");
    return cap.length > 0 ? [cap.join(". ")] : [];
  }
  return [];
}

/** Satu blok -> baris Markdown laporan kerja (paragraf, tabel, daftar, grafik sebagai tabel). */
function blockLines(b: Block, warn: (w: ToolWarning) => void, where: string, used: Set<string>): string[] {
  if (typeof b === "string") return b.trim() === "" ? [] : paragraphLines(b.trim(), warn, where);
  if (isRows(b)) return b.length === 0 ? [] : tableLines(repairItemTable(b, warn, where, used), warn, where);
  const o = b as unknown as Record<string, unknown>;
  if (isObj(o) && isRows(o.table)) {
    const rows = o.table as Rows;
    const cap = typeof o.caption === "string" && o.caption.trim() !== "" ? ["", ...paragraphLines(o.caption.trim(), warn, where)] : [];
    return rows.length === 0 ? cap : [...tableLines(repairItemTable(rows, warn, where, used), warn, where), ...cap];
  }
  if (isObj(o) && isObj(o.chart)) {
    const c = o.chart as unknown as ChartInput;
    warn({ code: "CHART_AS_TABLE", message: `${where}: laporan kerja tidak memuat figur; data grafik ditulis sebagai tabel` });
    const cap = [c.caption, c.source !== undefined ? `Sumber: ${c.source}` : undefined].filter((x): x is string => typeof x === "string" && x.trim() !== "");
    return [...tableLines(chartRows(c), warn, where), ...(cap.length > 0 ? ["", ...paragraphLines(cap.join(". "), warn, where)] : [])];
  }
  if (isObj(o) && Array.isArray(o.list)) {
    const items = (o.list as unknown[]).map((x) => String(x).replace(/\s+/g, " ").trim()).filter((x) => x !== "");
    const guarded = items.map(guardLine);
    if (guarded.some((g, i) => g !== items[i])) warn({ code: "TEXT_ESCAPED", message: `${where}: butir daftar yang menyerupai struktur di-escape agar tetap teks` });
    return guarded.map((x, i) => (o.ordered === true ? `${i + 1}. ${x}` : `- ${x}`));
  }
  throw new McpToolError("INVALID_ARGUMENT", `${where}: blok tidak dikenal (string = paragraf, larik baris = tabel, {table}, {chart}, {list})`);
}

/**
 * Masukan minimal -> laporan kerja MD-native (kepala record + `##` per bagian). Melempar SECTION_MISSING bila bab
 * wajib tidak punya isi (satu-satunya hal yang tidak ditebak).
 */
export function buildWorkReport(input: WorkReportInput): BuiltReport {
  const warnings: ToolWarning[] = [];
  const warn = (w: ToolWarning) => warnings.push(w);
  const m = workReportChapters();
  const { header, title: metaTitle } = recordLines(input, warn);
  const used = new Set<string>();
  const filled = new Set<string>();
  const chapters: Array<string | null> = [];
  const body: string[] = [];
  const headings: string[] = [];
  const paragraphs: string[][] = [];
  const mapped: string[] = [];
  const extra: string[] = [];
  input.sections.forEach((s, i) => {
    const where = `bagian ${i + 1}`;
    const h = mapHeading(s.heading.replace(/\s+/g, " ").trim(), m);
    if (h.how === "alias" || h.how === "words") mapped.push(`"${s.heading.trim()}" -> ${h.heading}`);
    if (h.how === "none") extra.push(s.heading.trim());
    chapters.push(h.key);
    const lines: string[] = [];
    paragraphs.push(s.blocks.flatMap(expectedParagraphs));
    for (const b of s.blocks) {
      const bl = blockLines(b, warn, where, used);
      if (bl.length > 0) lines.push(...bl, "");
    }
    if (lines.length > 0 && h.key !== null) filled.add(h.key);
    const shown = h.heading.replace(/^#+\s*/, "") || `Bagian ${i + 1}`;
    headings.push(shown);
    body.push(`## ${shown}`, "", ...lines);
  });
  if (mapped.length > 0) warn({ code: "HEADING_MAPPED", message: `judul bagian dipetakan ke bab laporan: ${mapped.join("; ")}` });
  if (extra.length > 0) warn({ code: "HEADING_EXTRA", message: `judul tanpa padanan bab laporan, disimpan sebagai bab tambahan: ${extra.join("; ")}` });
  const missing = m.required.filter((k) => !filled.has(k));
  if (missing.length > 0) {
    const names = missing.map((k) => m.titles.get(k) ?? k);
    throw new McpToolError(
      "SECTION_MISSING",
      `bab wajib laporan kerja tanpa isi: ${names.join(", ")}. Tambahkan bagian, mis. { "heading": "${names[0]}", "blocks": ["..."] } (tulis "Tidak ada." bila memang kosong). Tidak ada yang dikirim`,
      { details: { missing: names, required: m.required.map((k) => m.titles.get(k) ?? k) } },
    );
  }
  const title = (input.title ?? metaTitle ?? `Laporan kerja ${input.docKey}`).replace(/\s+/g, " ").trim();
  const markdown = [`# ${title.replace(/^#+\s*/, "")}`, "", `mission: ${input.mission}`, `docKey: ${input.docKey}`, ...header, "", ...body].join("\n").replace(/\n{3,}/g, "\n\n");
  return { markdown: `${markdown.trimEnd()}\n`, warnings, chapters, headings, paragraphs, itemKeys: used, recordFields: fieldsOf(header) };
}
