/**
 * Tulis dan baca berkas keluaran Studio (S52, I42 `writeOutput`; pembaca untuk
 * route files S57).
 *
 * Tulis: guard traversal -> mkdir -> realpath direktori di dalam akar ->
 * tulis ke `<akar>/tmp/storage/<acak>.tmp` (flag `wx`) -> rename atomik ke
 * tujuan (retry singkat EPERM/EBUSY Windows) -> sha256 + bytes -> upsert
 * `StudioOutputFile` per `relPath` (unik; render ulang revisi yang sama
 * menimpa baris dan berkasnya).
 *
 * Prisma dimuat MALAS (D-155/IP-48): `@/lib/prisma` membuat klien saat modul
 * dievaluasi dan `@prisma/client` memuat `.env` saat diimpor, sedangkan modul
 * ini ikut terimpor oleh jalur tanpa DB (orkestrator render murni, CLI, runner)
 * lewat `services/storage`. Klien baru dimuat pada panggilan DB pertama;
 * `import type` tetap boleh (terhapus saat kompilasi).
 */
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient, StudioOutputFile } from "@prisma/client";
import type { OutputFileScope, StudioOutputFileDto, StudioOutputFormat, WriteOutputInput } from "../../contract";
import { studioRoutePath } from "../../contract/env";
import { STUDIO_OUTPUT_FORMATS, STUDIO_OUTPUT_ROLES, STUDIO_RELEASE_STATUSES } from "../../contract/enums";
import { StudioEngineError } from "../../contract/errors";
import { errorFields, storageLog } from "./log";
import { assertRealInsideRoot, assertSafeSegment, DOCS_DIR, resolveSafe, storageRoot, toRelPath } from "./paths";

let cachedDb: Promise<PrismaClient> | null = null;

/** Klien Prisma proses (singleton `@/lib/prisma`), dimuat saat pertama dipakai (D-155). */
function db(): Promise<PrismaClient> {
  cachedDb ??= import("@/lib/prisma").then((m) => m.prisma);
  return cachedDb;
}

const RENAME_RETRIES = 5;
const RENAME_RETRY_MS = 50;
/** Kolom `bytes` = Int Postgres. */
const MAX_FILE_BYTES = 2_147_483_647;

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Lingkup render satu berkas: tipe kontrak (IP-48), diekspor ulang untuk pemakai lama. */
export type { OutputFileScope };

/**
 * DTO berkas keluaran + lingkup (SR-30/IP-54, D-212): `draft` (render parsial
 * dokumen INCOMPLETE, D-186) dan `scope` dari kolom `StudioOutputFile`. Kini
 * medan kontrak `OutputFileDto` (IP-48); alias dipertahankan untuk pemakai lama.
 */
export type StoredOutputFileDto = StudioOutputFileDto;

/** Lingkup dari kolom baris; DOCUMENT (bawaan DB) tanpa `key`. */
export function outputFileScope(row: Pick<StudioOutputFile, "scopeKind" | "scopeKey">): OutputFileScope {
  const kind = row.scopeKind;
  return kind !== "DOCUMENT" && row.scopeKey ? { kind, key: row.scopeKey } : { kind };
}

export function toOutputFileDto(row: StudioOutputFile): StoredOutputFileDto {
  return {
    id: row.id,
    documentId: row.documentId,
    revisionId: row.revisionId,
    artifactId: row.artifactId,
    renderJobId: row.renderJobId,
    format: row.format,
    role: row.role,
    figureLabel: row.figureLabel,
    relPath: row.relPath,
    fileName: row.fileName,
    bytes: row.bytes,
    sha256: row.sha256,
    mime: row.mime,
    lintVerdict: row.lintVerdict,
    createdAt: row.createdAt.toISOString(),
    url: studioRoutePath("R10", { id: row.id }),
    draft: row.draft,
    scope: outputFileScope(row),
  };
}

function badInput(message: string, field: string): Error {
  // Pelanggaran invarian pemanggil (bug internal, bukan masukan user) -> 500 lewat studioErrorFrom.
  return new TypeError(`writeOutput: ${message} (${field})`);
}

/** Invarian M08 (§1.2): tepat satu dari revisionId/artifactId; documentId wajib bila revisionId. */
function checkInput(i: WriteOutputInput): void {
  const hasRev = typeof i.revisionId === "string" && i.revisionId !== "";
  const hasArt = typeof i.artifactId === "string" && i.artifactId !== "";
  if (hasRev === hasArt) throw badInput("exactly one of revisionId/artifactId is required", "revisionId|artifactId");
  if (hasRev && !i.documentId) throw badInput("documentId is required with revisionId", "documentId");
  if (!(STUDIO_OUTPUT_FORMATS as readonly string[]).includes(i.format)) throw badInput("unknown format", "format");
  if (!(STUDIO_OUTPUT_ROLES as readonly string[]).includes(i.role)) throw badInput("unknown role", "role");
  if (i.lintVerdict !== undefined && !(STUDIO_RELEASE_STATUSES as readonly string[]).includes(i.lintVerdict)) {
    throw badInput("unknown lintVerdict", "lintVerdict");
  }
  const base = typeof i.mime === "string" ? mimeBase(i.mime) : null;
  if (base === null) throw badInput(`invalid mime ${JSON.stringify(i.mime)}`, "mime");
  if (base !== OUTPUT_MIME_BASE[i.format]) {
    throw badInput(`mime ${base} does not match format ${i.format} (expected ${OUTPUT_MIME_BASE[i.format]})`, "mime");
  }
}

/**
 * Tipe media dasar per format keluaran (huruf kecil, tanpa parameter). MIME
 * yang dikirim pemanggil boleh membawa parameter (mis. `text/html;
 * charset=utf-8`, dipakai apa adanya sebagai `Content-Type` R10), tetapi tipe
 * dasarnya wajib cocok dengan format (F-032: regex lama menolak parameter
 * sehingga keluaran HTML tidak pernah tersimpan).
 */
export const OUTPUT_MIME_BASE: Readonly<Record<StudioOutputFormat, string>> = {
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PDF: "application/pdf",
  HTML: "text/html",
  SVG: "image/svg+xml",
  PNG: "image/png",
};

const MIME_TOKEN = "[A-Za-z0-9!#$&^_.+-]+";
/** RFC 9110 §8.3.1: `type/subtype *( OWS ";" OWS name=value )`; nilai token atau quoted-string sederhana. */
const MIME_RE = new RegExp(`^(${MIME_TOKEN})\\/(${MIME_TOKEN})((?:[ \\t]*;[ \\t]*${MIME_TOKEN}=(?:${MIME_TOKEN}|"[^"\\\\\\r\\n]*"))*)[ \\t]*$`);
const MAX_MIME_CHARS = 255;

/** Tipe dasar huruf kecil (`type/subtype`) dari MIME sah, atau `null` bila tidak sah. */
export function mimeBase(mime: string): string | null {
  if (mime.length === 0 || mime.length > MAX_MIME_CHARS) return null;
  const m = MIME_RE.exec(mime);
  return m ? `${m[1]}/${m[2]}`.toLowerCase() : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt >= RENAME_RETRIES || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) throw err;
      await sleep(RENAME_RETRY_MS * (attempt + 1));
    }
  }
}

/** Tujuan yang sudah ada tidak boleh symlink/direktori (cegah tulis menembus tautan). */
async function assertWritableTarget(abs: string): Promise<boolean> {
  try {
    const st = await lstat(abs);
    if (st.isSymbolicLink() || !st.isFile()) {
      throw new StudioEngineError("PATH_OUTSIDE_ROOT", "Target is not a regular file", { reason: "target_not_regular" });
    }
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

/** I42: tulis atomik + catat `StudioOutputFile`. */
export async function writeOutput(i: WriteOutputInput): Promise<StoredOutputFileDto> {
  checkInput(i);
  assertSafeSegment(i.fileName);
  const relDir = toRelPath(i.relDir);
  if (relDir.split("/")[0] !== DOCS_DIR) {
    throw new StudioEngineError("PATH_OUTSIDE_ROOT", "Output directory must be under docs/", { reason: "not_docs_layout" });
  }
  const relPath = `${relDir}/${i.fileName}`;
  const absPath = resolveSafe(relPath);
  const absDir = path.dirname(absPath);
  const data = typeof i.data === "string" ? Buffer.from(i.data, "utf8") : i.data;
  if (data.byteLength > MAX_FILE_BYTES) throw badInput("file too large for bytes column", "data");
  const sha256 = sha256Hex(data);

  const tmpDir = resolveSafe("tmp/storage");
  const tmpFile = path.join(tmpDir, `${randomUUID()}.tmp`);
  let wroteTmp = false;
  let existedBefore = false;
  try {
    await mkdir(absDir, { recursive: true });
    await assertRealInsideRoot(absDir);
    await mkdir(tmpDir, { recursive: true });
    await assertRealInsideRoot(tmpDir);
    existedBefore = await assertWritableTarget(absPath);
    await writeFile(tmpFile, data, { flag: "wx" });
    wroteTmp = true;
    await renameWithRetry(tmpFile, absPath);
    wroteTmp = false;
  } catch (err) {
    if (wroteTmp) await rm(tmpFile, { force: true }).catch(() => undefined);
    if (!(err instanceof StudioEngineError)) {
      storageLog({
        level: "error",
        message: "output file write failed",
        code: "STORAGE_WRITE_FAILED",
        correlationId: i.renderJobId,
        ...errorFields(err),
        context: { ...errorFields(err).context, relPath },
      });
    }
    throw err;
  }

  const fields = {
    documentId: i.documentId ?? null,
    revisionId: i.revisionId ?? null,
    artifactId: i.artifactId ?? null,
    renderJobId: i.renderJobId ?? null,
    format: i.format,
    role: i.role,
    figureLabel: i.figureLabel ?? null,
    fileName: i.fileName,
    bytes: data.byteLength,
    sha256,
    mime: i.mime,
    lintVerdict: i.lintVerdict ?? "PENDING",
  } as const;

  try {
    const prisma = await db();
    const prev = await prisma.studioOutputFile.findUnique({ where: { relPath }, select: { sha256: true } });
    const row = await prisma.studioOutputFile.upsert({
      where: { relPath },
      create: { relPath, ...fields },
      update: { ...fields },
    });
    if (prev && prev.sha256 !== sha256) {
      storageLog({
        level: "warn",
        message: "output file replaced with different content",
        code: "STORAGE_OUTPUT_REPLACED",
        correlationId: i.renderJobId,
        context: { relPath, previousSha256: prev.sha256, sha256 },
      });
    }
    storageLog({
      level: "info",
      message: "output file stored",
      code: "STORAGE_OUTPUT_WRITTEN",
      correlationId: i.renderJobId,
      context: { id: row.id, relPath, bytes: row.bytes, sha256 },
    });
    return toOutputFileDto(row);
  } catch (err) {
    // Berkas baru tanpa baris DB = yatim: dibuang. Berkas lama (ditimpa) dibiarkan.
    if (!existedBefore) await rm(absPath, { force: true }).catch(() => undefined);
    storageLog({
      level: "error",
      message: existedBefore ? "output file DB record failed (replaced file kept on disk)" : "output file DB record failed (new file removed)",
      code: "STORAGE_DB_FAILED",
      correlationId: i.renderJobId,
      ...errorFields(err),
      context: { ...errorFields(err).context, relPath },
    });
    throw err;
  }
}

// ── Baca (S57) ───────────────────────────────────────────────────────────

export interface StoredFile {
  absPath: string;
  bytes: number;
  data: Buffer;
}

/**
 * Baca berkas dengan guard yang sama (lexical + realpath). Berkas tidak ada /
 * bukan berkas biasa -> `FILE_MISSING_ON_DISK` (410).
 */
export async function readStoredFile(relPath: string): Promise<StoredFile> {
  const absPath = resolveSafe(relPath);
  try {
    const st = await lstat(absPath);
    if (!st.isSymbolicLink() && !st.isFile()) {
      throw new StudioEngineError("FILE_MISSING_ON_DISK", "Stored file is missing on disk", { relPath });
    }
    // Symlink diterima hanya bila target nyatanya tetap di dalam akar.
    await assertRealInsideRoot(absPath);
    const data = await readFile(absPath);
    return { absPath, bytes: data.byteLength, data };
  } catch (err) {
    if (err instanceof StudioEngineError) throw err;
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR" || code === "EISDIR") {
      storageLog({ level: "warn", message: "stored file missing on disk", code: "FILE_MISSING_ON_DISK", context: { relPath } });
      throw new StudioEngineError("FILE_MISSING_ON_DISK", "Stored file is missing on disk", { relPath });
    }
    storageLog({ level: "error", message: "stored file read failed", code: "STORAGE_READ_FAILED", ...errorFields(err), context: { ...errorFields(err).context, relPath } });
    throw err;
  }
}

/**
 * Untuk R10 `/api/studio/files/[id]`: baris DB -> berkas di disk (guard sama).
 * `FILE_NOT_FOUND` (404) bila baris tidak ada; `FILE_MISSING_ON_DISK` (410)
 * bila berkas hilang; `verifySha` opsional membandingkan sha256 (selisih ->
 * log warn, berkas tetap dikembalikan dengan `shaMatches: false`).
 */
export async function readOutputFile(
  id: string,
  opts: { verifySha?: boolean } = {},
): Promise<{ file: StoredOutputFileDto; absPath: string; data: Buffer; shaMatches?: boolean }> {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
    throw new StudioEngineError("FILE_NOT_FOUND", "File not found");
  }
  const row = await (await db()).studioOutputFile.findUnique({ where: { id } });
  if (!row) throw new StudioEngineError("FILE_NOT_FOUND", "File not found");
  const stored = await readStoredFile(row.relPath);
  const file = toOutputFileDto(row);
  if (!opts.verifySha) return { file, absPath: stored.absPath, data: stored.data };
  const shaMatches = sha256Hex(stored.data) === row.sha256;
  if (!shaMatches) {
    storageLog({ level: "warn", message: "stored file sha256 differs from DB", code: "STORAGE_SHA_MISMATCH", context: { id, relPath: row.relPath } });
  }
  return { file, absPath: stored.absPath, data: stored.data, shaMatches };
}

/** Path absolut akar (untuk diagnosa/UI status; tidak membocorkan ke klien). */
export function storageRootPath(): string {
  return storageRoot();
}
