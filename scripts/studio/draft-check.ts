/**
 * CLI pemeriksa draf/checkpoint MD (DC-22, register 05 §11.3-§11.4).
 *
 *   npx tsx scripts/studio/draft-check.ts <berkas.md> [--remote <baseUrl>] [--emit <n>] [--json]
 *
 * Opsi:
 *   --remote <baseUrl>   setiap blok dikirim apa adanya ke R08 `POST /api/studio/validate` (dry-run,
 *                        tanpa tulis DB) dengan header `x-internal-secret` dari env `INTERNAL_API_SECRET`
 *                        (D-334); basis `<documentId>@rev<n>` dibandingkan dengan revisi terkini dokumen
 *                        (R05) -> peringatan DR-08 `DRAFT_BASIS_STALE`
 *   --emit <n>           cetak teks blok ke-n (1-based) persis seperti tertulis (byte-identik), untuk
 *                        dikirim apa adanya
 *   --json               cetak hasil T2-70 `DraftCheckResultV2` (bentuk respons R23)
 *
 * Lokal (bawaan): batas C54 (DR-09/DR-10) -> I63 `extractDraft` (DR-01..DR-07) -> skema v2 per blok
 * (validator yang sama dengan R08: `validateV2`, ajv bersama + `classifySchemaV2Errors`) -> pemeriksaan
 * murni §5.6 langkah 6b (I54 `checkContractRecord`: set jenis, pola, tanggal, `items[].key` unik
 * dengan posisi berbasis 1; D-375). Tanpa DB dan tanpa jaringan; DR-08 dan EC25/EC26 tidak diperiksa.
 *
 * Kode keluar: 0 semua blok valid dan tanpa isu error; 1 ada isu error, blok tidak valid, atau draf
 * melebihi batas C54; 2 galat pemakaian/berkas/jaringan.
 * Nilai rahasia tidak pernah dicetak maupun ditulis ke berkas.
 */
import fs from "node:fs";
import type { DraftCheckResultV2 } from "../../src/lib/studio/contract";
import { STUDIO_ROUTES } from "../../src/lib/studio/contract/env";
import {
  checkDraftLimits,
  completeDraftCheck,
  draftContractIssues,
  draftLimitMessage,
  extractDraft,
  finalizeDraftResult,
  prepareDraftCheck,
  rejectedDryRun,
  toDraftCheckResult,
  type DraftDryRunOutcome,
} from "../../src/lib/studio/services/draft";
import { isV2SubmissionSchema, validateV2 } from "../../src/app/api/studio/validate/_shared/v2-kit";

const USAGE = "pemakaian: npx tsx scripts/studio/draft-check.ts <berkas.md> [--remote <baseUrl>] [--emit <n>] [--json]";

const HELP = [
  USAGE,
  "",
  "Memeriksa satu draf/checkpoint Markdown: kepala (judul, tujuan, langkah-berikut, basis) dan setiap",
  "blok ```json berisi kiriman studio.doc/v2, studio.chapter/v2, atau studio.slot/v2.",
  "",
  "  --remote <baseUrl>   periksa setiap blok di server lewat dry-run POST /api/studio/validate",
  "                       (tidak menyimpan apa pun); rahasia dibaca dari env INTERNAL_API_SECRET.",
  "                       Juga memeriksa apakah basis draf sudah tertinggal dari revisi terkini.",
  "  --emit <n>           cetak isi blok ke-n persis seperti tertulis, mis. --emit 1 > blok1.json",
  "  --json               cetak hasil lengkap sebagai JSON",
  "  -h, --help           tampilkan bantuan ini",
  "",
  "Tanpa --remote pemeriksaan berjalan lokal: tanpa server dan tanpa basis data.",
  "",
  "Kode keluar: 0 lolos, 1 ada isu galat atau blok tidak valid, 2 galat pemakaian, berkas, atau jaringan.",
].join("\n");

const REMOTE_TIMEOUT_MS = 30_000;

/** Galat pemakaian/berkas/jaringan (kode keluar 2). */
export class DraftCheckUsageError extends Error {}

// ── Pemeriksaan lokal ───────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * §5.6 langkah 6b: I54 `checkContractRecord` atas setiap payload `contractRecord` blok (D-375,
 * menggantikan cek `items[].key` lokal DC-22). `positions` EC27 berbasis 1. Nama lama dipertahankan
 * sebagai ekspor CLI.
 */
export const contractStructureIssues = draftContractIssues;

/** Hasil T2-70 lokal: I63 + skema v2 per blok + langkah 6b. Blok dengan isu ekstraksi galat tidak diperiksa lebih lanjut. */
export function checkDraftLocal(markdown: string): DraftCheckResultV2 {
  const ex = extractDraft(markdown);
  const result = toDraftCheckResult(ex);
  for (const b of result.blocks) {
    if (!b.valid || !isV2SubmissionSchema(b.schema) || !isRecord(b.payload)) continue;
    const schemaIssues = validateV2(b.schema, b.payload);
    b.issues = schemaIssues.length > 0 ? schemaIssues : contractStructureIssues(b.payload);
    b.valid = b.issues.length === 0;
  }
  return finalizeDraftResult(result);
}

// ── Pemeriksaan remote (R08) ────────────────────────────────────────────

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export interface RemoteOptions {
  baseUrl: string;
  secret: string;
  fetchImpl?: FetchLike;
}

function normalizeBaseUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new DraftCheckUsageError(`--remote harus URL http(s) yang sah, mis. http://127.0.0.1:9021 (diberikan "${raw}")`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new DraftCheckUsageError("--remote harus memakai http:// atau https://");
  return u.origin + u.pathname.replace(/\/+$/, "");
}

async function call(opts: RemoteOptions, path: string, init: { method: string; body?: string }): Promise<{ status: number; body: unknown; retryAfter: string | null }> {
  const f = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const headers: Record<string, string> = { "x-internal-secret": opts.secret, accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await f(`${opts.baseUrl}${path}`, { ...init, headers, signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) });
  } catch (e) {
    const why = e instanceof Error ? (e.name === "TimeoutError" ? `tidak menjawab dalam ${REMOTE_TIMEOUT_MS / 1000} detik` : e.message) : String(e);
    throw new DraftCheckUsageError(`server ${opts.baseUrl} tidak dapat dihubungi: ${why}`);
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text === "" ? null : JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: res.status, body, retryAfter: res.headers.get("retry-after") };
}

function serverFailure(path: string, r: { status: number; body: unknown; retryAfter: string | null }): DraftCheckUsageError {
  if (r.status === 401) return new DraftCheckUsageError("server menolak rahasia (401): periksa env INTERNAL_API_SECRET");
  if (r.status === 429) return new DraftCheckUsageError(`batas laju server tercapai (429)${r.retryAfter ? `; coba lagi dalam ${r.retryAfter} detik` : ""}`);
  const msg = isRecord(r.body) && typeof r.body.error === "string" ? `: ${r.body.error}` : "";
  return new DraftCheckUsageError(`server menjawab ${r.status} untuk ${path}${msg}`);
}

/** Revisi terkini dokumen lewat R05 (DR-08); 404 = dokumen tidak ditemukan (tidak dapat dicek). */
async function currentRevisionNo(documentId: string, opts: RemoteOptions): Promise<number | null> {
  const path = `${STUDIO_ROUTES.R05.replace("[id]", encodeURIComponent(documentId))}`;
  const r = await call(opts, path, { method: "GET" });
  if (r.status === 404) return null;
  if (r.status !== 200) throw serverFailure(path, r);
  const doc = isRecord(r.body) && isRecord(r.body.document) ? r.body.document : null;
  const current = doc && typeof doc.currentRevisionNo === "number" ? doc.currentRevisionNo : null;
  if (current === null) throw new DraftCheckUsageError(`jawaban ${path} tidak memuat document.currentRevisionNo`);
  return current;
}

/** Satu blok ke R08; isu R08 apa adanya (T2-71). */
async function dryRunBlock(text: string, opts: RemoteOptions): Promise<DraftDryRunOutcome> {
  const path = STUDIO_ROUTES.R08;
  const r = await call(opts, path, { method: "POST", body: text });
  if (r.status === 200 && isRecord(r.body) && typeof r.body.valid === "boolean") {
    return {
      valid: r.body.valid,
      issues: Array.isArray(r.body.issues) ? r.body.issues : [],
      ...(r.body.submitPreview !== undefined ? { submitPreview: r.body.submitPreview } : {}),
      ...(r.body.completenessPreview !== undefined ? { completenessPreview: r.body.completenessPreview } : {}),
    };
  }
  if (r.status === 401 || r.status === 429 || r.status >= 500 || !isRecord(r.body)) throw serverFailure(path, r);
  // 4xx lain (403 templat terbatas, 400, 413): blok ditolak server; galat dicatat sebagai isu blok (D-373).
  return rejectedDryRun(
    typeof r.body.code === "string" ? r.body.code : `HTTP_${r.status}`,
    typeof r.body.error === "string" ? r.body.error : `server menjawab ${r.status}`,
    r.body.details,
  );
}

/**
 * Hasil T2-70 dengan dry-run R08 per blok (bentuk respons R23) + DR-08. Orkestrasi sama dengan
 * R23 (`services/draft/check.ts`, AC-19); hanya transportnya HTTP.
 */
export async function checkDraftRemote(markdown: string, opts: RemoteOptions): Promise<DraftCheckResultV2> {
  const o: RemoteOptions = { ...opts, baseUrl: normalizeBaseUrl(opts.baseUrl) };
  return completeDraftCheck(markdown, prepareDraftCheck(markdown), {
    currentRevisionNo: (documentId) => currentRevisionNo(documentId, o),
    dryRun: (block) => dryRunBlock(block.text, o),
  });
}

// ── Keluaran ────────────────────────────────────────────────────────────

export function exitCodeOf(result: DraftCheckResultV2): 0 | 1 {
  return result.valid ? 0 : 1;
}

function where(i: { line?: number; column?: number }): string {
  if (i.line === undefined) return "";
  return i.column === undefined ? `baris ${i.line} ` : `baris ${i.line} kolom ${i.column} `;
}

function issueLine(i: unknown): string {
  if (!isRecord(i)) return `      ${JSON.stringify(i)}`;
  const pointer = typeof i.pointer === "string" && i.pointer !== "" ? i.pointer : "/";
  return `      ${pointer} ${String(i.keyword ?? i.code ?? "")}: ${String(i.message ?? "")}`;
}

/** Laporan untuk manusia (Bahasa Indonesia). */
export function formatHuman(file: string, result: DraftCheckResultV2, remote: string | null): string {
  const h = result.header;
  const out: string[] = [];
  out.push(`draft-check: ${file}${remote ? ` (remote ${remote})` : " (lokal)"}`);
  out.push(`  judul: ${h.title ?? "-"}`);
  out.push(`  tujuan: ${h.tujuan ?? "-"}`);
  out.push(`  langkah-berikut: ${h.langkahBerikut ?? "-"}`);
  out.push(`  basis: ${h.basis ?? "-"}`);
  for (const i of result.issues) {
    out.push(`  [${i.severity === "error" ? "galat" : "peringatan"}] ${where(i)}${i.code}: ${i.message}`);
  }
  for (const b of result.blocks) {
    out.push(`  blok ${b.index} (baris ${b.line}-${b.endLine}) ${b.schema ?? "tanpa $schema"}: ${b.valid ? "valid" : "TIDAK VALID"}`);
    for (const i of b.issues.slice(0, 20)) out.push(issueLine(i));
    if (b.issues.length > 20) out.push(`      ... ${b.issues.length - 20} isu lain (pakai --json untuk daftar lengkap)`);
  }
  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warnings = result.issues.length - errors;
  const invalid = result.blocks.filter((b) => !b.valid).length;
  out.push(
    `hasil: ${result.valid ? "LOLOS" : "TIDAK LOLOS"} (galat ${errors}, peringatan ${warnings}, blok ${result.blocks.length}, blok tidak valid ${invalid})`,
  );
  return `${out.join("\n")}\n`;
}

// ── CLI ──────────────────────────────────────────────────────────────────

export interface CliArgs {
  file: string;
  remote: string | null;
  emit: number | null;
  json: boolean;
}

export function parseArgs(argv: readonly string[]): CliArgs | "help" {
  let file: string | null = null;
  let remote: string | null = null;
  let emit: number | null = null;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") return "help";
    if (a === "--json") json = true;
    else if (a === "--remote" || a === "--emit") {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new DraftCheckUsageError(`${a} memerlukan nilai`);
      i++;
      if (a === "--remote") remote = v;
      else {
        if (!/^[1-9][0-9]{0,5}$/.test(v)) throw new DraftCheckUsageError(`--emit memerlukan nomor blok bilangan bulat >= 1 (diberikan "${v}")`);
        emit = Number(v);
      }
    } else if (a.startsWith("--")) throw new DraftCheckUsageError(`opsi tidak dikenal: ${a}`);
    else if (file === null) file = a;
    else throw new DraftCheckUsageError(`argumen tidak terduga: ${a}`);
  }
  if (file === null) throw new DraftCheckUsageError("berkas <berkas.md> belum diberikan");
  if (emit !== null && (json || remote !== null)) throw new DraftCheckUsageError("--emit tidak dapat digabung dengan --json atau --remote");
  return { file, remote, emit, json };
}

export interface CliIo {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  env: Readonly<Record<string, string | undefined>>;
  fetchImpl?: FetchLike;
}

export async function main(argv: readonly string[], io: CliIo): Promise<number> {
  let args: CliArgs | "help";
  try {
    args = parseArgs(argv);
  } catch (e) {
    io.stderr(`draft-check: ${e instanceof Error ? e.message : String(e)}\n${USAGE}\n`);
    return 2;
  }
  if (args === "help") {
    io.stdout(`${HELP}\n`);
    return 0;
  }

  let raw: Buffer;
  try {
    raw = fs.readFileSync(args.file);
  } catch (e) {
    io.stderr(`draft-check: tidak dapat membaca ${args.file}: ${e instanceof Error ? e.message : String(e)}\n`);
    return 2;
  }
  const markdown = raw.toString("utf8");

  const limit = checkDraftLimits(markdown, { bodyBytes: raw.length });
  if (limit !== null) {
    const message = draftLimitMessage(limit);
    if (args.json) io.stdout(`${JSON.stringify({ error: message, code: "PAYLOAD_TOO_LARGE", details: { reason: limit } }, null, 2)}\n`);
    io.stderr(`draft-check: ${limit}: ${message}; pecah draf menjadi beberapa berkas\n`);
    return 1;
  }

  if (args.emit !== null) {
    const ex = extractDraft(markdown);
    const block = ex.blocks[args.emit - 1];
    if (!block) {
      io.stderr(`draft-check: blok ${args.emit} tidak ada; draf memuat ${ex.blocks.length} blok json tertutup\n`);
      return 2;
    }
    io.stdout(block.text);
    const local = checkDraftLocal(markdown).blocks[args.emit - 1];
    if (!local.valid) {
      io.stderr(`draft-check: catatan: blok ${args.emit} tidak valid secara lokal; jalankan tanpa --emit untuk rinciannya\n`);
      return 1;
    }
    return 0;
  }

  let result: DraftCheckResultV2;
  if (args.remote !== null) {
    const secret = io.env.INTERNAL_API_SECRET ?? "";
    if (secret === "") {
      io.stderr("draft-check: --remote memerlukan env INTERNAL_API_SECRET yang terisi\n");
      return 2;
    }
    try {
      result = await checkDraftRemote(markdown, { baseUrl: args.remote, secret, fetchImpl: io.fetchImpl });
    } catch (e) {
      if (e instanceof DraftCheckUsageError) {
        io.stderr(`draft-check: ${e.message}\n`);
        return 2;
      }
      throw e;
    }
  } else {
    result = checkDraftLocal(markdown);
  }

  if (args.json) {
    io.stdout(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    io.stdout(formatHuman(args.file, result, args.remote));
  }
  return exitCodeOf(result);
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
      process.stderr.write(`draft-check: galat tak terduga: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
      process.exitCode = 2;
    },
  );
}
