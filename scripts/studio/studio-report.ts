/**
 * CLI laporan kerja agen satu perintah (U-01, D-419; panduan §17.4-§17.9).
 *
 *   npx tsx <repo>/scripts/studio/studio-report.ts submit <draf.md> [opsi]
 *   npx tsx <repo>/scripts/studio/studio-report.ts update <documentId> <draf.md> [opsi]
 *
 * submit: blok draf (I63 `extractDraft`, diperiksa lokal lebih dulu seperti `draft-check`) dikirim
 *   berurutan: `studio.slot/v2` -> R13, `studio.chapter/v2` -> R12, `studio.doc/v2` -> R04. Blok
 *   sesudah blok buat-dokumen yang menarget `mission.folder` + `docKey` sama (aturan simulasi
 *   berurutan `services/draft`, U-05a) dikirim dengan `target: { documentId }` dokumen yang baru
 *   dibuat. Lalu kelengkapan R15, render R17 (bawaan HTML), unduh R10 ke memori (sha256 dicocokkan)
 *   dan HEAD R10 `?verify=1`.
 * update: basis dibaca lewat R20 (isi + `revisionNo`); setiap blok bab/slot diarahkan ke
 *   `target: { documentId }`, `baseRevisionNo` diisi otomatis bila tidak ditulis, dan hanya blok
 *   yang isinya berbeda dari basis yang dikirim. Lalu kelengkapan, render, dan verifikasi.
 *
 * Badan kiriman dan berkas unduhan HANYA di memori: tanpa berkas sementara dan tanpa curl. Berkas
 * hanya ditulis untuk `--out <dir>` (berkas final, nama dari header `X-Studio-Final-Filename`) dan
 * `--timing <csv>` (baris berwaktu mesin, header 20 kolom protokol research/11 §5.1, RFC 4180).
 * Rahasia dibaca dari env `INTERNAL_API_SECRET`, dikirim hanya sebagai header `x-internal-secret`,
 * tidak pernah dicetak atau ditulis; pengalihan (3xx) tidak diikuti agar rahasia tidak diteruskan.
 *
 * Klien HTTP bersama `./_http-client` (R2-F2 #6): batas waktu, peta galat 3xx/401/429/5xx, `code`
 * server, dan cid sama dengan `draft-check --remote`; studio-report memakai pengalihan `manual`.
 *
 * Kode keluar: 0 sukses; 1 galat isi (draf tidak lolos cek lokal, server menolak kiriman 4xx,
 * sha/verifikasi berkas tidak cocok); 2 galat lingkungan/pemakaian (argumen, rahasia, jaringan,
 * 3xx, 401, 429, 5xx, berkas --out/--timing, nama final di luar FINAL_FILENAME_PATTERN);
 * 3 dokumen belum lengkap (INCOMPLETE) dan `--require-complete` diberikan.
 * Kiriman terputus (R2-F2 #5): galat sesudah ada blok yang tersimpan di server tetap memakai kode
 * keluar penyebabnya (1 atau 2) dan membawa `progress` (documentId, docNumber, revisionNo terakhir,
 * langkah yang sudah tersimpan, langkah gagal, `allBlocksSent`, cara melanjutkan) di stderr dan di
 * `fatal.progress` `--json`. Lanjutkan dengan menjalankan ulang perintah yang sama (idempoten: blok
 * yang sudah tersimpan dijawab `unchanged`) atau `update <documentId> <draf.md>`.
 */
import "./_repo-alias";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DraftCheckResultV2 } from "../../src/lib/studio/contract";
import { FINAL_FILENAME_PATTERN, studioRoutePath, type StudioRouteId } from "../../src/lib/studio/contract/env";
import {
  checkDraftLimits,
  draftCreateTargetOf,
  draftLimitMessage,
  dryRunInputOf,
  extractDraft,
  sequentialCreateSources,
  type ExtractedDraftBlock,
} from "../../src/lib/studio/services/draft";
import { CONTRACT_KIND_DEFS } from "../../src/lib/studio/registry/contracts";
import { checkDraftLocal } from "./draft-check";
import { httpFailureOf, normalizeBaseUrl, studioRequest, StudioUnreachableError, type HttpFetch, type HttpReply, type HttpResponseLike } from "./_http-client";

export type { HttpFetch, HttpResponseLike } from "./_http-client";

const NAME = "studio-report";

const USAGE = [
  "pemakaian: npx tsx scripts/studio/studio-report.ts submit <draf.md> [opsi]",
  "           npx tsx scripts/studio/studio-report.ts update <documentId> <draf.md> [opsi]",
].join("\n");

const HELP = [
  USAGE,
  "",
  "Mengirim laporan kerja dari draf Markdown (panduan §17.9) sampai berkas HTML terverifikasi,",
  "tanpa curl dan tanpa berkas sementara.",
  "",
  "  submit    kirim semua blok draf berurutan (blok pembuat dokumen lebih dulu), lalu kelengkapan,",
  "            render HTML, unduh ke memori, dan verifikasi sha256",
  "  update    perbarui dokumen yang ada: basis dibaca dari server, baseRevisionNo diisi otomatis,",
  "            hanya bab/slot yang berubah yang dikirim; lalu render dan verifikasi",
  "",
  "Opsi:",
  "  --remote <url>       server Studio (bawaan: env HQ_URL), mis. http://127.0.0.1:9021",
  "  --agent-id <id>      agentId untuk blok tanpa medan agentId dan untuk render (1..80 karakter)",
  "  --mission <folder>   (submit) ganti folder misi target blok pembuat dokumen dan blok sesudahnya",
  "  --out <dir>          simpan berkas final ke <dir> dengan nama dari server (hanya nama yang lolos",
  "                       pola nama final C51); tanpa opsi ini tidak ada berkas yang ditulis",
  "  --timing <csv>       tambahkan baris waktu (header 20 kolom protokol, RFC 4180) ke <csv>;",
  "                       kolom konteks dari env STUDIO_TIMING_RUN_ID, STUDIO_TIMING_ARM,",
  "                       STUDIO_TIMING_REPORT_ID, STUDIO_TIMING_ORDER, STUDIO_TIMING_SESSION_ID",
  "  --step <id>          step_id baris waktu (bawaan: submit atau update)",
  "  --require-complete   keluar 3 bila dokumen belum lengkap (tanpa opsi ini: render dilewati, keluar 0)",
  "  --allow-example      izinkan blok yang menarget misi atau docKey contoh registri (bawaan: ditolak,",
  "                       kode EXAMPLE_TARGET, keluar 2, sebelum kiriman pertama)",
  "  --json               keluaran mesin (JSON); galat dicetak { \"ok\": false, \"fatal\": { ... } }",
  "  -h, --help           tampilkan bantuan ini",
  "",
  "Rahasia dibaca dari env INTERNAL_API_SECRET dan tidak pernah dicetak.",
  "Kode keluar: 0 sukses, 1 galat isi, 2 galat lingkungan atau pemakaian, 3 dokumen belum lengkap",
  "(--require-complete). Galat sesudah ada blok yang tersimpan tetap keluar 1 atau 2 dan mencetak",
  "documentId, revisionNo terakhir, langkah yang tersimpan, dan langkah yang gagal (--json: fatal.progress);",
  "lanjutkan dengan menjalankan ulang perintah yang sama (idempoten) atau update <documentId> <draf.md>.",
].join("\n");

/** Header 20 kolom timing.csv (protokol research/11 §5.1), persis. */
export const TIMING_HEADER = [
  "run_id",
  "arm",
  "report_id",
  "order",
  "session_id",
  "seq",
  "step_id",
  "step_kind",
  "action",
  "target",
  "http_status",
  "corr_id",
  "t_start_utc",
  "t_end_utc",
  "dur_s",
  "ok",
  "err_code",
  "bytes",
  "sha16",
  "note",
] as const;

// ── Galat ───────────────────────────────────────────────────────────────

/** Kemajuan kiriman yang terputus (R2-F2 #5): apa yang SUDAH tersimpan di server. */
export interface ReportProgress {
  documentId: string;
  docNumber: string | null;
  /** Revisi terakhir yang dilaporkan server untuk langkah yang sudah sukses. */
  revisionNo: number | null;
  /** Langkah yang sudah sukses, mis. `blok 1 (record)`. */
  completedSteps: string[];
  /** Langkah yang gagal, mis. `blok 3 (bab 2)` atau `render R17`. */
  failedStep: string;
  /** true = semua blok sudah terkirim (galat di kelengkapan, render, unduh, atau simpan). */
  allBlocksSent: boolean;
  /** Cara melanjutkan (Bahasa Indonesia). */
  resume: string;
}

export interface ReportErrorInfo {
  httpStatus?: number;
  correlationId?: string;
  pointer?: string;
  step?: string;
  details?: unknown;
  progress?: ReportProgress;
}

/** Galat yang menghentikan perintah; `exitCode` 1 isi, 2 lingkungan/pemakaian, 3 INCOMPLETE. */
export class ReportError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly exitCode: 1 | 2 | 3,
    readonly info: ReportErrorInfo = {},
  ) {
    super(message);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ── Timing (RFC 4180) ───────────────────────────────────────────────────

/**
 * Netralisasi injeksi formula spreadsheet (R2-F2 #8, OWASP CSV injection): teks yang diawali
 * `=`, `+`, `-`, `@`, tab, atau CR diberi awalan `'`. Pengecualian yang tidak dapat menjadi formula:
 * bilangan desimal bertanda minus (`-1.5`) dan penanda kosong `-` (bawaan kolom konteks).
 */
export function csvNeutralize(s: string): string {
  if (!/^[=+\-@\t\r]/.test(s)) return s;
  return /^-(?:[0-9]+(?:\.[0-9]+)?)?$/.test(s) ? s : `'${s}`;
}

/** Satu medan CSV: dinetralkan ({@link csvNeutralize}), lalu dikutip RFC 4180 bila memuat koma, kutip ganda, CR, atau LF. */
export function csvField(v: string | number | null | undefined): string {
  const s = csvNeutralize(v === null || v === undefined ? "" : String(v));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Pengurai CSV RFC 4180 minimal (medan berkutip boleh memuat koma dan baris baru). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export interface TimingContext {
  runId: string;
  arm: string;
  reportId: string;
  order: string;
  sessionId: string;
  stepId: string;
}

export interface TimingEvent {
  kind: "api" | "tool" | "edit";
  action: string;
  target: string;
  httpStatus?: number;
  correlationId?: string;
  tStart: number;
  tEnd: number;
  ok: boolean;
  errCode?: string;
  bytes?: number;
  sha16?: string;
  note?: string;
}

const secs = (ms: number): string => (ms / 1000).toFixed(3);

/** Baris CSV (tanpa LF) untuk satu peristiwa; `seq` diberikan pemanggil. */
export function timingRow(ctx: TimingContext, seq: number, e: TimingEvent): string {
  const cells: Array<string | number | undefined> = [
    ctx.runId,
    ctx.arm,
    ctx.reportId,
    ctx.order,
    ctx.sessionId,
    seq,
    ctx.stepId,
    e.kind,
    e.action,
    e.target,
    e.httpStatus,
    e.correlationId,
    secs(e.tStart),
    secs(e.tEnd),
    ((e.tEnd - e.tStart) / 1000).toFixed(3),
    e.ok ? 1 : 0,
    e.errCode,
    e.bytes,
    e.sha16,
    e.note,
  ];
  return cells.map((c) => csvField(c)).join(",");
}

export interface FsLike {
  existsSync(p: string): boolean;
  readFileSync(p: string, enc: "utf8"): string;
  appendFileSync(p: string, data: string): void;
  mkdirSync(p: string, opts: { recursive: true }): unknown;
  writeFileSync(p: string, data: Uint8Array, opts: { flag: "wx" }): void;
  readFileSyncBuffer?(p: string): Buffer;
}

/** Berkas timing: dibuka (header dicek) SEBELUM kiriman pertama, ditulis sekali di akhir. */
export class TimingSink {
  private events: TimingEvent[] = [];
  private constructor(
    private readonly file: string,
    private readonly ctx: TimingContext,
    private readonly fsx: FsLike,
    private readonly needsHeader: boolean,
    private nextSeq: number,
  ) {}

  static open(file: string, ctx: TimingContext, fsx: FsLike): TimingSink {
    let text = "";
    try {
      text = fsx.existsSync(file) ? fsx.readFileSync(file, "utf8") : "";
    } catch (e) {
      throw new ReportError(`tidak dapat membaca berkas timing ${file}: ${e instanceof Error ? e.message : String(e)}`, "TIMING_UNREADABLE", 2);
    }
    const rows = parseCsv(text.replace(/^﻿/, ""));
    if (rows.length > 0 && rows[0].join(",") !== TIMING_HEADER.join(",")) {
      throw new ReportError(`baris pertama ${file} bukan header 20 kolom protokol; berkas tidak diubah`, "TIMING_HEADER_MISMATCH", 2);
    }
    // run_id tertulis dalam bentuk ternetralisasi (#8), jadi dibandingkan dalam bentuk yang sama.
    const runIdCell = csvNeutralize(ctx.runId);
    const prior = rows.slice(1).filter((r) => r.length > 1 && r[0] === runIdCell).length;
    if (text !== "" && !/\n$/.test(text)) {
      throw new ReportError(`berkas timing ${file} tidak diakhiri baris baru; berkas tidak diubah`, "TIMING_HEADER_MISMATCH", 2);
    }
    return new TimingSink(file, ctx, fsx, rows.length === 0, prior + 1);
  }

  add(e: TimingEvent): void {
    this.events.push(e);
  }

  /** Tambahkan semua baris (append-only) dalam satu tulis. */
  flush(): number {
    if (this.events.length === 0) return 0;
    const lines = this.events.map((e) => timingRow(this.ctx, this.nextSeq++, e));
    const data = `${this.needsHeader ? `${TIMING_HEADER.join(",")}\n` : ""}${lines.join("\n")}\n`;
    try {
      this.fsx.appendFileSync(this.file, data);
    } catch (e) {
      throw new ReportError(`tidak dapat menulis berkas timing ${this.file}: ${e instanceof Error ? e.message : String(e)}`, "TIMING_UNWRITABLE", 2);
    }
    const n = this.events.length;
    this.events = [];
    return n;
  }
}

// ── Klien HTTP (badan hanya di memori; `./_http-client`) ─────────────────

interface CallResult {
  status: number;
  headers: HttpResponseLike["headers"];
  body: unknown;
  bytes?: Buffer;
  correlationId?: string;
}

/** Pointer pertama dari badan galat `{ error, code, details }` (details = isu[] / { issues } / { pointer }). */
export function firstPointer(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const d = body.details;
  const fromList = (l: unknown): string | undefined => (Array.isArray(l) && isRecord(l[0]) && typeof l[0].pointer === "string" ? l[0].pointer : undefined);
  return fromList(d) ?? (isRecord(d) ? (fromList(d.issues) ?? (typeof d.pointer === "string" ? d.pointer : undefined)) : undefined) ?? fromList(body.issues);
}

export class StudioClient {
  constructor(
    private readonly baseUrl: string,
    private readonly secret: string,
    private readonly fetchImpl: HttpFetch,
    private readonly timing: TimingSink | null,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Satu panggilan lewat klien bersama (pengalihan `manual`: rahasia tidak diteruskan); galat HTTP
   * dipetakan `httpFailureOf` ke {@link ReportError} (badan galat tidak pernah memuat rahasia).
   */
  async call(
    method: "GET" | "POST" | "HEAD",
    routePath: string,
    opts: { json?: unknown; binary?: boolean; label: string; target: string; step: string; note?: string; okStatuses?: number[] },
  ): Promise<CallResult> {
    const action = `${method} ${opts.label}`;
    const t0 = this.now();
    let reply: HttpReply;
    try {
      reply = await studioRequest({ baseUrl: this.baseUrl, secret: this.secret, fetchImpl: this.fetchImpl, redirect: "manual" }, method, routePath, {
        body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
        binary: opts.binary,
        okStatuses: opts.okStatuses,
      });
    } catch (e) {
      if (!(e instanceof StudioUnreachableError)) throw e;
      this.timing?.add({ kind: "api", action, target: opts.target, tStart: t0, tEnd: this.now(), ok: false, errCode: e.code, note: opts.note });
      throw new ReportError(e.message, e.code, 2, { step: opts.step });
    }
    const t1 = this.now();
    const failure = reply.ok ? null : httpFailureOf(reply, action);
    const { correlationId, bytes } = reply;
    this.timing?.add({
      kind: "api",
      action,
      target: opts.target,
      httpStatus: reply.status,
      correlationId,
      tStart: t0,
      tEnd: t1,
      ok: reply.ok,
      errCode: failure?.code,
      ...(bytes ? { bytes: bytes.length, sha16: sha256Hex(bytes).slice(0, 16) } : {}),
      note: opts.note,
    });
    if (failure === null) return { status: reply.status, headers: reply.headers, body: reply.body, bytes, correlationId };
    const info: ReportErrorInfo = {
      httpStatus: failure.httpStatus,
      correlationId: failure.correlationId,
      pointer: firstPointer(reply.body),
      step: opts.step,
      ...(failure.details !== undefined ? { details: failure.details } : {}),
    };
    throw new ReportError(failure.message, failure.code, failure.environmental ? 2 : 1, info);
  }
}

export function sha256Hex(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

// ── Rencana kiriman ─────────────────────────────────────────────────────

const ROUTE_OF: Record<string, StudioRouteId> = { "studio.slot/v2": "R13", "studio.chapter/v2": "R12", "studio.doc/v2": "R04" };

export interface StepResult {
  block: number;
  schema: string;
  /** `record`, `bab 1`, atau `dokumen`. */
  part: string;
  route: string;
  status: number | null;
  revisionNo: number | null;
  created: boolean;
  unchanged: boolean;
  /** update: tidak dikirim karena isi sama dengan basis. */
  skipped: boolean;
  correlationId: string | null;
}

function partOf(v: Record<string, unknown>): string {
  if (v.$schema === "studio.slot/v2") return typeof v.slot === "string" ? v.slot : "slot";
  if (v.$schema === "studio.chapter/v2") return isRecord(v.chapter) && typeof v.chapter.key === "string" ? `bab ${v.chapter.key}` : "bab";
  return "dokumen";
}

/** Ganti folder misi target blok (bab/slot `target.mission`, doc `mission`). */
function withMission(v: Record<string, unknown>, folder: string): Record<string, unknown> {
  if (v.$schema === "studio.doc/v2") return isRecord(v.mission) ? { ...v, mission: { ...v.mission, folder } } : v;
  const t = v.target;
  if (!isRecord(t) || !isRecord(t.mission)) return v;
  return { ...v, target: { ...t, mission: { ...t.mission, folder } } };
}

/** Target `{ documentId }` menggantikan target misi/nomor (bab/slot saja). */
function withDocumentTarget(v: Record<string, unknown>, documentId: string): Record<string, unknown> {
  return { ...v, target: { documentId } };
}

/** Perbandingan struktural tanpa urutan kunci; medan `id` (pid) diabaikan. */
export function sameContent(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => sameContent(x, b[i]));
  }
  if (isRecord(a) && isRecord(b)) {
    const ka = Object.keys(a).filter((k) => k !== "id" && a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => k !== "id" && b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && sameContent(a[k], b[k]));
  }
  return a === b;
}

/** Isi basis R20 untuk blok bab/slot (null = tidak ada di basis). */
export function baseContentFor(v: Record<string, unknown>, resolved: unknown): unknown {
  if (!isRecord(resolved) || !isRecord(resolved.sections)) return null;
  if (v.$schema === "studio.slot/v2") return typeof v.slot === "string" ? (resolved.sections[v.slot] ?? null) : null;
  if (v.$schema === "studio.chapter/v2" && isRecord(v.chapter)) {
    const key = v.chapter.key;
    const slots = typeof v.slot === "string" ? [resolved.sections[v.slot]] : Object.values(resolved.sections);
    for (const s of slots) {
      if (isRecord(s) && Array.isArray(s.chapters)) {
        const hit = s.chapters.find((c) => isRecord(c) && c.key === key);
        if (hit !== undefined) return hit;
      }
    }
  }
  return null;
}

function draftPayloadOf(v: Record<string, unknown>): unknown {
  return v.$schema === "studio.slot/v2" ? v.payload : v.chapter;
}

// ── Perintah ────────────────────────────────────────────────────────────

export interface CliArgs {
  command: "submit" | "update";
  documentId: string | null;
  file: string;
  remote: string | null;
  agentId: string | null;
  mission: string | null;
  out: string | null;
  timing: string | null;
  step: string | null;
  requireComplete: boolean;
  /** D-427: izinkan target misi/docKey contoh registri. */
  allowExample: boolean;
  json: boolean;
}

const usageErr = (m: string) => new ReportError(m, "USAGE_ERROR", 2);

export function parseArgs(argv: readonly string[]): CliArgs | "help" {
  if (argv.some((a) => a === "-h" || a === "--help")) return "help";
  const pos: string[] = [];
  const v: Record<string, string> = {};
  let requireComplete = false;
  let allowExample = false;
  let json = false;
  const valued = new Set(["--remote", "--agent-id", "--mission", "--out", "--timing", "--step"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") json = true;
    else if (a === "--require-complete") requireComplete = true;
    else if (a === "--allow-example") allowExample = true;
    else if (valued.has(a)) {
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) throw usageErr(`${a} memerlukan nilai`);
      if (a in v) throw usageErr(`${a} diberikan lebih dari sekali`);
      v[a] = val;
      i++;
    } else if (a.startsWith("--")) throw usageErr(`opsi tidak dikenal: ${a}`);
    else pos.push(a);
  }
  const command = pos[0];
  if (command !== "submit" && command !== "update") throw usageErr(command === undefined ? "perintah belum diberikan (submit atau update)" : `perintah tidak dikenal: ${command}`);
  const need = command === "submit" ? 2 : 3;
  if (pos.length < need) throw usageErr(command === "submit" ? "berkas <draf.md> belum diberikan" : "update memerlukan <documentId> dan <draf.md>");
  if (pos.length > need) throw usageErr(`argumen tidak terduga: ${pos[need]}`);
  const agentId = v["--agent-id"] ?? null;
  if (agentId !== null && (agentId.length < 1 || agentId.length > 80)) throw usageErr("--agent-id harus 1..80 karakter");
  if (command === "update" && v["--mission"] !== undefined) throw usageErr("--mission hanya berlaku untuk submit");
  const documentId = command === "update" ? pos[1] : null;
  if (documentId !== null && !/^[A-Za-z0-9_-]{1,64}$/.test(documentId)) throw usageErr(`documentId tidak sah: "${documentId}"`);
  return {
    command,
    documentId,
    file: command === "submit" ? pos[1] : pos[2],
    remote: v["--remote"] ?? null,
    agentId,
    mission: v["--mission"] ?? null,
    out: v["--out"] ?? null,
    timing: v["--timing"] ?? null,
    step: v["--step"] ?? null,
    requireComplete,
    allowExample,
    json,
  };
}

export interface RenderInfo {
  fileId: string;
  format: string;
  finalFileName: string;
  bytes: number;
  sha256: string;
  sha16: string;
  verified: boolean;
  savedTo: string | null;
}

export interface ReportResult {
  ok: true;
  command: "submit" | "update";
  documentId: string;
  docNumber: string | null;
  revisionNo: number | null;
  completeness: { status: string; missingRequired: unknown[] };
  steps: StepResult[];
  render: RenderInfo | null;
  /** Mengapa render dilewati (dokumen belum lengkap). */
  renderSkipped: string | null;
  timingRows: number;
  wallSeconds: number;
}

interface Ctx {
  args: CliArgs;
  client: StudioClient;
  fsx: FsLike;
  timing: TimingSink | null;
  now: () => number;
}

function readDraft(file: string, fsx: FsLike): { markdown: string; bytes: number } {
  let raw: Buffer;
  try {
    raw = fsx.readFileSyncBuffer ? fsx.readFileSyncBuffer(file) : fs.readFileSync(file);
  } catch (e) {
    throw new ReportError(`tidak dapat membaca ${file}: ${e instanceof Error ? e.message : String(e)}`, "FILE_UNREADABLE", 2);
  }
  return { markdown: raw.toString("utf8"), bytes: raw.length };
}

/** Batas C54 + cek lokal `draft-check` (skema v2, kontrak); isu galat pertama -> galat isi (1). */
function checkLocally(markdown: string, bytes: number): ExtractedDraftBlock[] {
  const limit = checkDraftLimits(markdown, { bodyBytes: bytes });
  if (limit !== null) throw new ReportError(`${limit}: ${draftLimitMessage(limit)}`, "PAYLOAD_TOO_LARGE", 1, { details: { reason: limit } });
  const local: DraftCheckResultV2 = checkDraftLocal(markdown);
  if (!local.valid) {
    const top = local.issues.find((i) => i.severity === "error");
    if (top) throw new ReportError(`draf tidak lolos cek lokal: ${top.message}${top.line !== undefined ? ` (baris ${top.line})` : ""}`, top.code, 1, { step: "draft-check" });
    const bad = local.blocks.find((b) => !b.valid);
    const issue = bad && isRecord(bad.issues[0]) ? bad.issues[0] : undefined;
    throw new ReportError(
      `blok ${bad?.index} (baris ${bad?.line}) tidak lolos cek lokal: ${issue && typeof issue.message === "string" ? issue.message : "tidak valid"}; jalankan draft-check untuk rinciannya`,
      issue && typeof issue.keyword === "string" ? issue.keyword : "DRAFT_INVALID",
      1,
      { step: `blok ${bad?.index}`, ...(issue && typeof issue.pointer === "string" ? { pointer: issue.pointer } : {}) },
    );
  }
  return extractDraft(markdown).blocks;
}

// ── Penjaga target contoh registri (D-427) ─────────────────────────────

/** Folder misi + docKey yang ditulis badan kiriman (bab/slot: `target`; doc: tingkat atas). */
function missionTargetOf(v: Record<string, unknown>): { folder: string | null; docKey: string | null } {
  const holder = v.$schema === "studio.doc/v2" ? v : isRecord(v.target) ? v.target : {};
  const folder = isRecord(holder.mission) && typeof holder.mission.folder === "string" ? holder.mission.folder : null;
  return { folder, docKey: typeof holder.docKey === "string" ? holder.docKey : null };
}

/**
 * Folder misi dan docKey yang dipakai contoh registri `items[].examples` (R03 `kind=contracts`),
 * dibaca dari modul registri murni `CONTRACT_KIND_DEFS` (bukan disalin), sehingga penjaga ikut
 * berubah bila contoh berubah.
 */
export function registryExampleTargets(): { folders: ReadonlySet<string>; docKeys: ReadonlySet<string> } {
  const folders = new Set<string>();
  const docKeys = new Set<string>();
  for (const def of CONTRACT_KIND_DEFS) {
    const ex = def.examples as unknown;
    if (!isRecord(ex)) continue;
    const bodies = [ex.record, ...(isRecord(ex.chapters) ? Object.values(ex.chapters) : [])];
    for (const b of bodies) {
      if (!isRecord(b)) continue;
      const t = missionTargetOf(b);
      if (t.folder !== null) folders.add(t.folder);
      if (t.docKey !== null) docKeys.add(t.docKey);
    }
  }
  return { folders, docKeys };
}

/**
 * D-427: tolak (keluar 2, sebelum kiriman pertama) blok yang menarget misi ATAU docKey contoh
 * registri, kecuali `--allow-example`. Pada submit, `--mission` diterapkan lebih dulu (folder efektif).
 */
function guardExampleTargets(args: CliArgs, blocks: ExtractedDraftBlock[]): void {
  if (args.allowExample) return;
  const { folders, docKeys } = registryExampleTargets();
  blocks.forEach((b, i) => {
    let value = b.value as Record<string, unknown>;
    if (args.command === "submit" && args.mission !== null) value = withMission(value, args.mission);
    const t = missionTargetOf(value);
    const hits = [
      ...(t.folder !== null && folders.has(t.folder) ? [`misi "${t.folder}"`] : []),
      ...(t.docKey !== null && docKeys.has(t.docKey) ? [`docKey "${t.docKey}"`] : []),
    ];
    if (hits.length === 0) return;
    throw new ReportError(
      `blok ${i + 1} menarget ${hits.join(" dan ")} milik contoh registri; ganti dengan folder misi dan docKey laporan Anda sendiri (atau --mission <folder>), atau tambahkan --allow-example bila memang disengaja. Tidak ada yang dikirim`,
      "EXAMPLE_TARGET",
      2,
      { step: `blok ${i + 1}` },
    );
  });
}

function docOf(body: unknown): { id: string; docNumber: string | null } | null {
  const d = isRecord(body) && isRecord(body.document) ? body.document : null;
  return d && typeof d.id === "string" ? { id: d.id, docNumber: typeof d.docNumber === "string" ? d.docNumber : null } : null;
}

async function sendBlock(ctx: Ctx, index: number, value: Record<string, unknown>, documentHint: string | null): Promise<{ step: StepResult; doc: { id: string; docNumber: string | null } | null }> {
  const schema = String(value.$schema);
  const routeId = ROUTE_OF[schema];
  const route = studioRoutePath(routeId);
  const part = partOf(value);
  const r = await ctx.client.call("POST", route, { json: value, label: route, target: documentHint ?? routeId, step: `blok ${index} (${part})`, note: `blok ${index} ${part}` });
  const body = r.body;
  const revisionNo = isRecord(body) && isRecord(body.revision) && typeof body.revision.revisionNo === "number" ? body.revision.revisionNo : null;
  return {
    doc: docOf(body),
    step: {
      block: index,
      schema,
      part,
      route: `POST ${route}`,
      status: r.status,
      revisionNo,
      created: isRecord(body) && body.created === true,
      unchanged: isRecord(body) && body.unchanged === true,
      skipped: false,
      correlationId: r.correlationId ?? null,
    },
  };
}

const stepLabel = (s: StepResult): string => `blok ${s.block} (${s.part})`;

/**
 * Kemajuan yang sudah tersimpan (R2-F2 #5). `remaining` = masih ada blok yang belum terkirim.
 * null bila belum ada blok yang tersimpan (tidak ada yang perlu dilanjutkan) atau dokumen tidak dikenal.
 */
function progressOf(
  ctx: Ctx,
  doc: { id: string; docNumber: string | null } | null,
  steps: StepResult[],
  e: ReportError,
  remaining: boolean,
): ReportProgress | null {
  const sent = steps.filter((s) => !s.skipped);
  if (doc === null || (remaining && sent.length === 0)) return null;
  const revisionNo = [...steps].reverse().find((s) => s.revisionNo !== null)?.revisionNo ?? null;
  const file = ctx.args.file;
  const rerun = ctx.args.command === "submit" ? `studio-report submit ${file}` : `studio-report update ${doc.id} ${file}`;
  const resume = remaining
    ? `perbaiki penyebabnya lalu jalankan ulang "${rerun}" dengan opsi yang sama (idempoten: blok yang sudah tersimpan dijawab unchanged atau dilewati)${ctx.args.command === "submit" ? `, atau "studio-report update ${doc.id} ${file}"` : ""}`
    : `semua blok sudah tersimpan; jalankan ulang "${rerun}" dengan opsi yang sama untuk kelengkapan, render, dan verifikasi`;
  return {
    documentId: doc.id,
    docNumber: doc.docNumber,
    revisionNo,
    completedSteps: sent.map(stepLabel),
    failedStep: e.info.step ?? "-",
    allBlocksSent: !remaining,
    resume,
  };
}

/** Galat blok sesudah ada blok yang tersimpan -> galat yang sama (kode keluar tetap) + `progress`; selain itu apa adanya. */
function interrupted(ctx: Ctx, e: unknown, doc: { id: string; docNumber: string | null } | null, steps: StepResult[]): unknown {
  if (!(e instanceof ReportError) || e.info.progress !== undefined) return e;
  const progress = progressOf(ctx, doc, steps, e, true);
  return progress === null ? e : new ReportError(e.message, e.code, e.exitCode, { ...e.info, progress });
}

async function runSubmit(ctx: Ctx, blocks: ExtractedDraftBlock[], markdown: string): Promise<{ documentId: string; docNumber: string | null; steps: StepResult[] }> {
  const sources = sequentialCreateSources(extractDraft(markdown));
  const createdDoc = new Map<number, string>();
  const steps: StepResult[] = [];
  let primary: { id: string; docNumber: string | null } | null = null;
  for (let i = 0; i < blocks.length; i++) {
    const index = i + 1;
    let value = dryRunInputOf(blocks[i], ctx.args.agentId ?? undefined).value;
    if (ctx.args.mission !== null) value = withMission(value, ctx.args.mission);
    const src = sources.get(index);
    const target = src !== undefined ? createdDoc.get(src) : undefined;
    if (target !== undefined) value = withDocumentTarget(value, target);
    let sent: Awaited<ReturnType<typeof sendBlock>>;
    try {
      sent = await sendBlock(ctx, index, value, target ?? primary?.id ?? null);
    } catch (e) {
      throw interrupted(ctx, e, primary, steps);
    }
    const { step, doc } = sent;
    steps.push(step);
    if (doc !== null) {
      primary ??= doc;
      if (draftCreateTargetOf(blocks[i].value as Record<string, unknown>) !== null) createdDoc.set(index, doc.id);
    }
  }
  if (primary === null) throw new ReportError("server tidak mengembalikan document.id untuk kiriman mana pun", "REMOTE_BAD_RESPONSE", 2);
  return { documentId: primary.id, docNumber: primary.docNumber, steps };
}

async function runUpdate(ctx: Ctx, documentId: string, blocks: ExtractedDraftBlock[]): Promise<{ documentId: string; docNumber: string | null; steps: StepResult[] }> {
  const r20 = studioRoutePath("R20", { id: documentId });
  const base = await ctx.client.call("GET", r20, { label: "/api/studio/documents/{id}/content", target: documentId, step: "basis R20", note: "basis" });
  const baseRev = isRecord(base.body) && typeof base.body.revisionNo === "number" ? base.body.revisionNo : null;
  if (baseRev === null) throw new ReportError(`jawaban ${r20} tidak memuat revisionNo`, "REMOTE_BAD_RESPONSE", 2, { correlationId: base.correlationId });
  const resolved = isRecord(base.body) ? base.body.content : null;
  const doc = docOf(base.body) ?? { id: documentId, docNumber: null };
  const steps: StepResult[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const index = i + 1;
    let value = dryRunInputOf(blocks[i], ctx.args.agentId ?? undefined).value;
    if (value.$schema === "studio.doc/v2") {
      throw new ReportError(`blok ${index} studio.doc/v2 tidak didukung update; kirim perubahan sebagai blok bab atau slot`, "UPDATE_DOC_BLOCK_UNSUPPORTED", 1, { step: `blok ${index}` });
    }
    value = withDocumentTarget(value, documentId);
    if (value.baseRevisionNo === undefined) value = { ...value, baseRevisionNo: baseRev };
    const part = partOf(value);
    if (sameContent(draftPayloadOf(value), baseContentFor(value, resolved))) {
      steps.push({ block: index, schema: String(value.$schema), part, route: "-", status: null, revisionNo: baseRev, created: false, unchanged: true, skipped: true, correlationId: null });
      continue;
    }
    try {
      steps.push((await sendBlock(ctx, index, value, documentId)).step);
    } catch (e) {
      throw interrupted(ctx, e, doc, steps);
    }
  }
  return { documentId, docNumber: doc.docNumber, steps };
}

function agentIdForRender(ctx: Ctx, blocks: ExtractedDraftBlock[]): string | undefined {
  if (ctx.args.agentId !== null) return ctx.args.agentId;
  for (const b of blocks) if (isRecord(b.value) && typeof b.value.agentId === "string") return b.value.agentId;
  return undefined;
}

const FINAL_FILENAME_RE = new RegExp(FINAL_FILENAME_PATTERN);

/**
 * Nama final boleh disimpan `--out` hanya bila lolos C51 `FINAL_FILENAME_PATTERN` (satu sumber
 * kebenaran dengan server; R2-F2 #9) dan merupakan nama berkas tunggal (tanpa pemisah path).
 */
export function safeFinalName(name: string): boolean {
  return FINAL_FILENAME_RE.test(name) && path.basename(name) === name;
}

async function renderAndVerify(ctx: Ctx, documentId: string, agentId: string | undefined): Promise<{ render: RenderInfo; revisionNo: number | null }> {
  const r17 = studioRoutePath("R17", { id: documentId });
  const rendered = await ctx.client.call("POST", r17, {
    json: { ...(agentId !== undefined ? { agentId } : {}), scope: "document" },
    label: "/api/studio/documents/{id}/render",
    target: documentId,
    step: "render R17",
    note: "render",
  });
  const outputs = isRecord(rendered.body) && Array.isArray(rendered.body.outputs) ? rendered.body.outputs.filter(isRecord) : [];
  const primaryOut =
    outputs.find((o) => o.role === "PRIMARY" && o.format === "HTML" && (!isRecord(o.scope) || o.scope.kind === "DOCUMENT")) ?? outputs.find((o) => o.role === "PRIMARY") ?? outputs[0];
  if (!primaryOut || typeof primaryOut.id !== "string") {
    throw new ReportError("render tidak menghasilkan berkas utama", "RENDER_NO_OUTPUT", 1, { correlationId: rendered.correlationId, step: "render R17", details: isRecord(rendered.body) ? rendered.body.errors : undefined });
  }
  const job = isRecord(rendered.body) && isRecord(rendered.body.job) ? rendered.body.job : null;
  const revisionNo = job && typeof job.revisionNo === "number" ? job.revisionNo : null;
  const fileId = primaryOut.id;
  const r10 = studioRoutePath("R10", { id: fileId });
  const dl = await ctx.client.call("GET", r10, { binary: true, label: "/api/studio/files/{id}", target: fileId, step: "unduh R10", note: "unduh" });
  const bytes = dl.bytes ?? Buffer.alloc(0);
  const sha = sha256Hex(bytes);
  const finalFileName = dl.headers.get("x-studio-final-filename") ?? (typeof primaryOut.finalFileName === "string" ? primaryOut.finalFileName : "");
  const expected = [dl.headers.get("x-studio-sha256"), typeof primaryOut.sha256 === "string" ? primaryOut.sha256 : null].filter((s): s is string => s !== null && s !== "");
  if (expected.some((s) => s.toLowerCase() !== sha)) {
    throw new ReportError(`sha256 berkas unduhan (${sha.slice(0, 16)}) tidak cocok dengan catatan server (${expected[0].slice(0, 16)})`, "SHA_MISMATCH", 1, { correlationId: dl.correlationId, step: "unduh R10" });
  }
  const head = await ctx.client.call("HEAD", `${r10}?verify=1`, { label: "/api/studio/files/{id}?verify=1", target: fileId, step: "verifikasi R10", note: "verify" });
  const verified = head.headers.get("x-studio-sha256-verified") === "true";
  const headName = head.headers.get("x-studio-final-filename");
  if (!verified) throw new ReportError("server melaporkan X-Studio-Sha256-Verified bukan true (isi disk berbeda dari catatan)", "VERIFY_FAILED", 1, { correlationId: head.correlationId, step: "verifikasi R10" });
  if (finalFileName === "" || (headName !== null && headName !== finalFileName)) {
    throw new ReportError(`nama final tidak konsisten (unduh "${finalFileName}", verify "${headName ?? "-"}")`, "VERIFY_FAILED", 1, { correlationId: head.correlationId, step: "verifikasi R10" });
  }

  let savedTo: string | null = null;
  if (ctx.args.out !== null) savedTo = saveFinal(ctx, finalFileName, bytes, sha);
  return {
    revisionNo,
    render: { fileId, format: String(primaryOut.format ?? "HTML"), finalFileName, bytes: bytes.length, sha256: sha, sha16: sha.slice(0, 16), verified, savedTo },
  };
}

function saveFinal(ctx: Ctx, finalFileName: string, bytes: Buffer, sha: string): string {
  const dir = ctx.args.out as string;
  if (!safeFinalName(finalFileName)) {
    throw new ReportError(
      `nama final dari server tidak cocok dengan pola nama final C51 (<docNumberSafe>_rev<n>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>); berkas tidak disimpan: "${finalFileName}"`,
      "OUT_NAME_UNSAFE",
      2,
      { step: "simpan" },
    );
  }
  const dest = path.join(dir, finalFileName);
  const t0 = ctx.now();
  try {
    ctx.fsx.mkdirSync(dir, { recursive: true });
    ctx.fsx.writeFileSync(dest, bytes, { flag: "wx" });
  } catch (e) {
    const exists = isRecord(e) && e.code === "EEXIST";
    if (!(exists && ctx.fsx.readFileSyncBuffer && sha256Hex(ctx.fsx.readFileSyncBuffer(dest)) === sha)) {
      throw new ReportError(
        exists ? `${dest} sudah ada dengan isi berbeda; tidak ditimpa` : `tidak dapat menyimpan ${dest}: ${e instanceof Error ? e.message : String(e)}`,
        exists ? "OUT_EXISTS" : "OUT_UNWRITABLE",
        2,
        { step: "simpan" },
      );
    }
  }
  ctx.timing?.add({ kind: "edit", action: "save", target: finalFileName, tStart: t0, tEnd: ctx.now(), ok: true, bytes: bytes.length, sha16: sha.slice(0, 16) });
  return dest;
}

export interface CliIo {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  env: Readonly<Record<string, string | undefined>>;
  fetchImpl?: HttpFetch;
  fs?: FsLike;
  now?: () => number;
}

/** fs nyata: hanya baca draf/timing, tambah timing, dan tulis berkas final --out. */
export const REAL_FS: FsLike = {
  existsSync: (p) => fs.existsSync(p),
  readFileSync: (p, enc) => fs.readFileSync(p, enc),
  appendFileSync: (p, d) => fs.appendFileSync(p, d, "utf8"),
  mkdirSync: (p, o) => fs.mkdirSync(p, o),
  writeFileSync: (p, d, o) => fs.writeFileSync(p, d, o),
  readFileSyncBuffer: (p) => fs.readFileSync(p),
};

function timingContext(args: CliArgs, env: CliIo["env"]): TimingContext {
  const pick = (k: string, d: string) => {
    const s = env[k];
    return s === undefined || s === "" ? d : s;
  };
  return {
    runId: pick("STUDIO_TIMING_RUN_ID", "-"),
    arm: pick("STUDIO_TIMING_ARM", "B"),
    reportId: pick("STUDIO_TIMING_REPORT_ID", "-"),
    order: pick("STUDIO_TIMING_ORDER", ""),
    sessionId: pick("STUDIO_TIMING_SESSION_ID", "-"),
    stepId: args.step ?? args.command,
  };
}

/** Jalankan satu perintah; galat dilempar sebagai {@link ReportError}. */
export async function runReport(args: CliArgs, io: CliIo): Promise<ReportResult> {
  const fsx = io.fs ?? REAL_FS;
  const now = io.now ?? Date.now;
  const t0 = now();
  const secret = io.env.INTERNAL_API_SECRET ?? "";
  if (secret === "") throw new ReportError("env INTERNAL_API_SECRET belum diisi", "SECRET_MISSING", 2);
  const rawUrl = args.remote ?? io.env.HQ_URL ?? "";
  if (rawUrl === "") throw usageErr("berikan --remote <url> atau env HQ_URL");
  let baseUrl: string;
  try {
    baseUrl = normalizeBaseUrl(rawUrl);
  } catch (e) {
    throw usageErr(e instanceof Error ? e.message : String(e));
  }
  const { markdown, bytes } = readDraft(args.file, fsx);
  const timing = args.timing !== null ? TimingSink.open(args.timing, timingContext(args, io.env), fsx) : null;
  const client = new StudioClient(baseUrl, secret, io.fetchImpl ?? (globalThis.fetch as unknown as HttpFetch), timing, now);
  const ctx: Ctx = { args, client, fsx, timing, now };
  let result: ReportResult | null = null;
  let toolOk = false;
  let toolErr: string | undefined;
  let docForTiming = "-";
  let sent: Awaited<ReturnType<typeof runSubmit>> | null = null;
  try {
    const blocks = checkLocally(markdown, bytes);
    guardExampleTargets(args, blocks);
    sent = args.command === "submit" ? await runSubmit(ctx, blocks, markdown) : await runUpdate(ctx, args.documentId as string, blocks);
    docForTiming = sent.documentId;
    const r15 = studioRoutePath("R15", { id: sent.documentId });
    const comp = await client.call("GET", r15, { label: "/api/studio/documents/{id}/completeness", target: sent.documentId, step: "kelengkapan R15", note: "kelengkapan" });
    const report = isRecord(comp.body) && isRecord(comp.body.completeness) ? comp.body.completeness : null;
    const completeness = {
      status: report && typeof report.status === "string" ? report.status : "UNKNOWN",
      missingRequired: report && Array.isArray(report.missingRequired) ? report.missingRequired : [],
    };
    const lastRev = [...sent.steps].reverse().find((s) => s.revisionNo !== null)?.revisionNo ?? null;
    let render: RenderInfo | null = null;
    let renderSkipped: string | null = null;
    let revisionNo = report && typeof report.revisionNo === "number" ? report.revisionNo : lastRev;
    if (completeness.status !== "COMPLETE") {
      if (args.requireComplete) {
        throw new ReportError(`dokumen ${sent.documentId} belum lengkap (${completeness.status}); kurang: ${completeness.missingRequired.join(", ") || "-"}`, "DOCUMENT_INCOMPLETE", 3, {
          correlationId: comp.correlationId,
          details: { documentId: sent.documentId, revisionNo, completeness },
        });
      }
      renderSkipped = `dokumen belum lengkap (${completeness.status}); render penuh dilewati`;
    } else {
      const rv = await renderAndVerify(ctx, sent.documentId, agentIdForRender(ctx, blocks));
      render = rv.render;
      revisionNo = rv.revisionNo ?? revisionNo;
    }
    toolOk = true;
    result = { ok: true, command: args.command, documentId: sent.documentId, docNumber: sent.docNumber, revisionNo, completeness, steps: sent.steps, render, renderSkipped, timingRows: 0, wallSeconds: (now() - t0) / 1000 };
    return result;
  } catch (e) {
    toolErr = e instanceof ReportError ? e.code : "INTERNAL_ERROR";
    // Galat sesudah semua blok terkirim (kelengkapan, render, unduh, simpan): kode keluar tetap, `progress` ditambahkan (#5).
    if (sent !== null && e instanceof ReportError && e.exitCode !== 3 && e.info.progress === undefined) {
      const progress = progressOf(ctx, { id: sent.documentId, docNumber: sent.docNumber }, sent.steps, e, false);
      if (progress !== null) throw new ReportError(e.message, e.code, e.exitCode, { ...e.info, progress });
    }
    throw e;
  } finally {
    if (timing) {
      timing.add({ kind: "tool", action: `${NAME} ${args.command}`, target: docForTiming !== "-" ? docForTiming : path.basename(args.file), tStart: t0, tEnd: now(), ok: toolOk, errCode: toolErr, note: path.basename(args.file) });
      try {
        const rows = timing.flush();
        if (result) result.timingRows = rows;
      } catch (flushErr) {
        // Galat perintah asli lebih penting; galat tulis timing tetap dilaporkan.
        if (toolOk) throw flushErr;
        io.stderr(`${NAME}: peringatan: ${flushErr instanceof Error ? flushErr.message : String(flushErr)}
`);
      }
    }
  }
}

// ── Keluaran ────────────────────────────────────────────────────────────

export function formatHuman(r: ReportResult): string {
  const out: string[] = [];
  out.push(`${NAME} ${r.command}: dokumen ${r.documentId}${r.docNumber ? ` (${r.docNumber})` : ""}`);
  for (const s of r.steps) {
    if (s.skipped) out.push(`  blok ${s.block} ${s.part}: tidak berubah dari basis rev${s.revisionNo}, tidak dikirim`);
    else {
      const what = s.created ? "dokumen dibuat" : s.unchanged ? "tidak berubah" : "revisi baru";
      out.push(`  blok ${s.block} ${s.part} -> ${s.route}: ${s.status} rev${s.revisionNo ?? "-"} (${what})${s.correlationId ? ` cid ${s.correlationId}` : ""}`);
    }
  }
  out.push(`  kelengkapan: ${r.completeness.status}${r.completeness.missingRequired.length > 0 ? ` (kurang: ${r.completeness.missingRequired.join(", ")})` : ""}`);
  if (r.renderSkipped) out.push(`  render: ${r.renderSkipped}`);
  out.push("hasil:");
  out.push(`  documentId: ${r.documentId}`);
  out.push(`  revisionNo: ${r.revisionNo ?? "-"}`);
  if (r.render) {
    out.push(`  sha16: ${r.render.sha16}`);
    out.push(`  nama final: ${r.render.finalFileName}`);
    out.push(`  verifikasi: sha256 cocok, X-Studio-Sha256-Verified ${r.render.verified ? "true" : "false"} (${r.render.bytes} bita)`);
    out.push(`  disimpan: ${r.render.savedTo ?? "tidak (pakai --out <dir> untuk menyimpan)"}`);
  }
  out.push(`  kelengkapan: ${r.completeness.status}`);
  out.push(`  waktu: ${r.wallSeconds.toFixed(3)} s`);
  return `${out.join("\n")}\n`;
}

function formatError(e: ReportError): string {
  const lines = [`${NAME}: galat ${e.code}${e.info.httpStatus ? ` (HTTP ${e.info.httpStatus})` : ""}${e.info.step ? ` pada ${e.info.step}` : ""}: ${e.message}`];
  if (e.info.pointer !== undefined) lines.push(`  pointer: ${e.info.pointer === "" ? "/" : e.info.pointer}`);
  if (e.info.correlationId) lines.push(`  x-correlation-id: ${e.info.correlationId}`);
  const p = e.info.progress;
  if (p) {
    lines.push(`  dokumen: ${p.documentId}${p.docNumber ? ` (${p.docNumber})` : ""}, revisionNo terakhir: ${p.revisionNo ?? "-"}`);
    lines.push(`  sudah tersimpan: ${p.completedSteps.length > 0 ? p.completedSteps.join(", ") : "-"}`);
    lines.push(`  langkah gagal: ${p.failedStep}`);
    lines.push(`  lanjutkan: ${p.resume}`);
  }
  return `${lines.join("\n")}\n`;
}

function fatalJson(e: ReportError): string {
  const { httpStatus, correlationId, pointer, step, details, progress } = e.info;
  return `${JSON.stringify(
    {
      ok: false,
      exitCode: e.exitCode,
      fatal: {
        code: e.code,
        message: e.message,
        ...(httpStatus !== undefined ? { httpStatus } : {}),
        ...(correlationId !== undefined ? { correlationId } : {}),
        ...(pointer !== undefined ? { pointer } : {}),
        ...(step !== undefined ? { step } : {}),
        ...(details !== undefined ? { details } : {}),
        ...(progress !== undefined ? { progress } : {}),
      },
    },
    null,
    2,
  )}\n`;
}

export async function main(argv: readonly string[], io: CliIo): Promise<number> {
  const wantsJson = argv.includes("--json");
  const fail = (e: ReportError, usage = false): number => {
    io.stderr(`${formatError(e)}${usage ? `${USAGE}\n` : ""}`);
    if (wantsJson) io.stdout(fatalJson(e));
    return e.exitCode;
  };
  let args: CliArgs | "help";
  try {
    args = parseArgs(argv);
  } catch (e) {
    return fail(e instanceof ReportError ? e : usageErr(String(e)), true);
  }
  if (args === "help") {
    io.stdout(wantsJson ? `${JSON.stringify({ help: HELP }, null, 2)}\n` : `${HELP}\n`);
    return 0;
  }
  try {
    const result = await runReport(args, io);
    io.stdout(args.json ? `${JSON.stringify(result, null, 2)}\n` : formatHuman(result));
    return 0;
  } catch (e) {
    if (e instanceof ReportError) return fail(e);
    return fail(new ReportError(`galat tak terduga: ${e instanceof Error ? e.message : String(e)}`, "INTERNAL_ERROR", 2));
  }
}

// Dijalankan langsung (tsx, CJS); saat diimpor uji (vitest ESM) `require` mungkin tidak ada.
if (typeof require !== "undefined" && require.main === module) {
  main(process.argv.slice(2), {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    env: process.env,
  }).then(
    (code) => {
      process.exitCode = code;
    },
    (e: unknown) => {
      process.stderr.write(`${NAME}: galat tak terduga: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exitCode = 2;
    },
  );
}
