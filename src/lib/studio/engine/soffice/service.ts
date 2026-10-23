/**
 * Layanan konversi DOCX -> PDF lewat LibreOffice headless (S92, 01_specs.md §8.4; D-15, KT-17).
 *
 * - Kesiapan render-env dicek sebelum job (cache C15); tidak siap ->
 *   `PDF_ENGINE_UNAVAILABLE`. PDF tidak pernah dibuat lewat Chromium.
 * - Profil per job `-env:UserInstallation=file:///<root>/tmp/<jobId>/lo-profile`;
 *   profil default user tidak pernah dipakai; `tmp/<jobId>` dihapus di `finally`.
 *   Bila path workspace melewati ambang aman Windows (paths.ts, IP-33), profil
 *   dan berkas antara memakai direktori sementara pendek `%TEMP%/gso-XXXXXX`;
 *   bila itu pun terlalu panjang -> `PDF_CONVERT_FAILED` tanpa menjalankan soffice.
 * - Semafor `STUDIO_SOFFICE_MAX_INSTANCES` (<= 2) + antrean FIFO berbatas panjang
 *   dan lama tunggu (penuh -> `RENDER_QUEUE_FULL` 503, FIX-8/M-03).
 * - Batas waktu `STUDIO_SOFFICE_TIMEOUT_MS` + tree-kill -> `RENDER_TIMEOUT`.
 * - Sukses = exit 0 DAN PDF ada, > 0 byte, diawali `%PDF-`; selain itu
 *   `PDF_CONVERT_FAILED` dengan 2 KB stderr terakhir (path absolut disamarkan;
 *   ekor utuh hanya di log server, L13).
 */
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStudioEnv, isPathInside } from "../../contract/env";
import { StudioEngineError } from "../../contract/errors";
import { sofficeLog } from "./log";
import { PathTooLongError, prepareSofficeWorkDir, type SofficeWorkLayout } from "./paths";
import { runBounded } from "./process";
import { getReadinessState, profileUrl, resetReadinessCache } from "./readiness";

const JOB_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const PDF_MAGIC = "%PDF-";
const FILE_NAME_MAX = 120;
const FORBIDDEN_NAME_CHARS = new Set(['<', '>', ':', '"', "/", "\\", "|", "?", "*"]);

// ── Semafor FIFO berbatas (FIX-8, S87 M-03) ──────────────────────────────
// Antrean tunggu dibatasi panjang DAN lama tunggu. Penuh atau menunggu terlalu
// lama -> `RENDER_QUEUE_FULL` (503, `details.retryAfterSec` -> header
// Retry-After di route) tanpa menjalankan soffice. Pelengkap gerbang layanan
// FIX-1 (`services/render/admission.ts`) untuk pemanggil engine langsung.
// Env opsional: STUDIO_SOFFICE_MAX_QUEUED (bawaan 4, 0 = tanpa antrean),
// STUDIO_SOFFICE_QUEUE_WAIT_MS (bawaan 2 x STUDIO_SOFFICE_TIMEOUT_MS),
// STUDIO_RENDER_QUEUE_RETRY_AFTER_SEC (bawaan 30, sama dengan gerbang FIX-1).
export const SOFFICE_MAX_QUEUED_DEFAULT = 4;
export const SOFFICE_QUEUE_RETRY_AFTER_SEC_DEFAULT = 30;

interface Waiter {
  grant: () => void;
}

let active = 0;
const waiters: Waiter[] = [];
const activeJobs = new Set<string>();

function envInt(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

/** Batas antrean (dibaca per panggilan agar uji/ops bisa mengubah env tanpa restart). */
export function sofficeQueueLimits(): { maxQueued: number; maxWaitMs: number; retryAfterSec: number } {
  return {
    maxQueued: envInt("STUDIO_SOFFICE_MAX_QUEUED", SOFFICE_MAX_QUEUED_DEFAULT, 0),
    maxWaitMs: envInt("STUDIO_SOFFICE_QUEUE_WAIT_MS", getStudioEnv().sofficeTimeoutMs * 2, 1),
    retryAfterSec: envInt("STUDIO_RENDER_QUEUE_RETRY_AFTER_SEC", SOFFICE_QUEUE_RETRY_AFTER_SEC_DEFAULT, 1),
  };
}

function queueFullError(reason: "queue_full" | "wait_timeout", max: number, limits: ReturnType<typeof sofficeQueueLimits>, jobId: string): StudioEngineError {
  const context = { reason, active, queued: waiters.length, max, maxQueued: limits.maxQueued, maxWaitMs: limits.maxWaitMs };
  sofficeLog({ level: "warn", message: `soffice queue rejected job (${reason})`, code: "RENDER_QUEUE_FULL", correlationId: jobId, context });
  return new StudioEngineError(
    "RENDER_QUEUE_FULL",
    reason === "queue_full" ? "PDF render queue is full; retry later" : "PDF render queue wait exceeded; retry later",
    { jobId, retryAfterSec: limits.retryAfterSec, ...context },
  );
}

function acquireSlot(max: number, limits: ReturnType<typeof sofficeQueueLimits>, jobId: string): Promise<void> {
  if (active < max) {
    active++;
    return Promise.resolve();
  }
  if (waiters.length >= limits.maxQueued) return Promise.reject(queueFullError("queue_full", max, limits, jobId));
  return new Promise((resolve, reject) => {
    const w: Waiter = {
      grant: () => {
        clearTimeout(timer);
        active++;
        resolve();
      },
    };
    const timer = setTimeout(() => {
      const idx = waiters.indexOf(w);
      if (idx < 0) return; // sudah diberi slot
      waiters.splice(idx, 1);
      reject(queueFullError("wait_timeout", max, limits, jobId));
    }, limits.maxWaitMs);
    waiters.push(w);
  });
}

function releaseSlot(max: number): void {
  active = Math.max(0, active - 1);
  while (active < max && waiters.length > 0) {
    const next = waiters.shift();
    next?.grant();
  }
}

/** Status antrean (S51 memakainya untuk `StudioRenderJob.status = QUEUED`). */
export function sofficeQueueState(): { active: number; queued: number; max: number; maxQueued: number } {
  return { active, queued: waiters.length, max: getStudioEnv().sofficeMaxInstances, maxQueued: sofficeQueueLimits().maxQueued };
}

// ── Validasi masukan ─────────────────────────────────────────────────────

/** Nama berkas aman (tanpa pemisah path / karakter terlarang / kendali), tanpa ekstensi. */
export function safeBaseName(fileName: string): string {
  let s = fileName.replace(/\.(docx|pdf)$/i, "");
  s = Array.from(s)
    .map((ch) => (FORBIDDEN_NAME_CHARS.has(ch) || ch.charCodeAt(0) < 0x20 ? " " : ch))
    .join("");
  s = s.replace(/\s+/g, " ").trim().slice(0, FILE_NAME_MAX).replace(/[. ]+$/, "").replace(/^[.\- ]+/, "");
  return s || "document";
}

function assertJobDir(root: string, jobId: string): string {
  if (!JOB_ID_RE.test(jobId)) {
    throw new StudioEngineError("PATH_OUTSIDE_ROOT", "jobId must match [A-Za-z0-9_-]{1,100}", { jobId: jobId.slice(0, 120) });
  }
  const tmpRoot = path.resolve(root, "tmp");
  const jobDir = path.resolve(tmpRoot, jobId);
  if (jobDir === tmpRoot || !isPathInside(jobDir, tmpRoot)) {
    throw new StudioEngineError("PATH_OUTSIDE_ROOT", "soffice job directory escapes workspace tmp root");
  }
  return jobDir;
}

/**
 * Samarkan path absolut server (drive, UNC, `file:///`) di teks yang bisa sampai
 * ke klien (L13). Segmen boleh berspasi selama diikuti pemisah path lagi
 * ("C:\Program Files\LibreOffice\program\soffice.bin" utuh menjadi `<path>`).
 */
export function redactServerPaths(text: string): string {
  return text.replace(/(?:file:\/{2,3})?(?:[A-Za-z]:|\\\\[^\\\s]+)[\\/](?:[^\\/\r\n"'<>|]*[\\/])*[^\\/\r\n"'<>|\s]*/g, "<path>");
}

function startsWithPdfMagic(buf: Uint8Array): boolean {
  if (buf.length < PDF_MAGIC.length) return false;
  for (let k = 0; k < PDF_MAGIC.length; k++) if (buf[k] !== PDF_MAGIC.charCodeAt(k)) return false;
  return true;
}

// ── Konversi ─────────────────────────────────────────────────────────────

export async function convertDocxToPdfImpl(
  docx: Uint8Array,
  i: { jobId: string; fileName: string },
): Promise<{ pdf: Uint8Array; durationMs: number }> {
  if (!(docx instanceof Uint8Array) || docx.length < 4 || docx[0] !== 0x50 || docx[1] !== 0x4b) {
    throw new StudioEngineError("PDF_CONVERT_FAILED", "input is not a DOCX (ZIP) package", { jobId: i.jobId });
  }
  const env = getStudioEnv();
  const jobDir = assertJobDir(env.workspaceRoot, i.jobId);

  const { readiness, sofficePath } = await getReadinessState();
  if (!readiness.ready) {
    throw new StudioEngineError("PDF_ENGINE_UNAVAILABLE", "PDF render environment is not ready", {
      errors: readiness.errors,
      checkedAt: readiness.checkedAt,
    });
  }

  if (activeJobs.has(i.jobId)) {
    throw new StudioEngineError("RENDER_IN_PROGRESS", "a soffice conversion for this jobId is already running", { jobId: i.jobId });
  }
  activeJobs.add(i.jobId);
  const max = env.sofficeMaxInstances;
  const queuedAt = Date.now();
  let slotHeld = false;
  let work: SofficeWorkLayout | null = null;
  try {
    const limits = sofficeQueueLimits();
    if (active >= max && waiters.length < limits.maxQueued) {
      sofficeLog({ level: "info", message: "soffice job queued", code: "SOFFICE_QUEUED", correlationId: i.jobId, context: { active, queued: waiters.length + 1, max, maxQueued: limits.maxQueued } });
    }
    await acquireSlot(max, limits, i.jobId);
    slotHeld = true;
    const queueWaitMs = Date.now() - queuedAt;

    const base = safeBaseName(i.fileName);
    try {
      work = await prepareSofficeWorkDir(jobDir, base);
    } catch (e) {
      if (!(e instanceof PathTooLongError)) throw e;
      sofficeLog({ level: "error", message: e.message, code: "PDF_CONVERT_FAILED", correlationId: i.jobId, stack_trace: e.stack, context: { reason: "PATH_TOO_LONG", ...e.lengths } });
      throw new StudioEngineError("PDF_CONVERT_FAILED", `soffice not started: ${e.message}`, { jobId: i.jobId, reason: "PATH_TOO_LONG", ...e.lengths });
    }
    if (work.short) {
      sofficeLog({ level: "warn", message: "workspace path too long for soffice; short temp directory used", code: "SOFFICE_SHORT_WORKDIR", correlationId: i.jobId, context: { jobDirChars: jobDir.length, workDir: work.dir } });
    }
    const { profileDir, outDir, inFile, outFile } = work;
    await writeFile(inFile, docx);

    const args = [
      "--headless",
      "--norestore",
      "--nologo",
      "--nodefault",
      "--nolockcheck",
      `-env:UserInstallation=${profileUrl(profileDir)}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outDir,
      inFile,
    ];
    // Tanpa `cwd` job: direktori kerja Win32 dibatasi MAX_PATH; semua path dikirim absolut.
    const r = await runBounded(sofficePath, args, { timeoutMs: env.sofficeTimeoutMs });
    const ctx = { exitCode: r.code, durationMs: r.durationMs, queueWaitMs, inputBytes: docx.length };

    if (r.spawnError) {
      resetReadinessCache();
      sofficeLog({ level: "error", message: `soffice spawn failed: ${r.spawnError.message}`, code: "PDF_ENGINE_UNAVAILABLE", correlationId: i.jobId, stack_trace: r.spawnError.stack, context: { ...ctx, sofficePath } });
      // spawnError.message memuat path biner: hanya ke log (di atas), pesan klien memakai kode errno.
      const errno = (r.spawnError as NodeJS.ErrnoException).code ?? "spawn error";
      throw new StudioEngineError("PDF_ENGINE_UNAVAILABLE", `soffice could not be started (${errno})`, { jobId: i.jobId });
    }
    if (r.timedOut) {
      sofficeLog({ level: "error", message: "soffice timed out; process tree killed", code: "RENDER_TIMEOUT", correlationId: i.jobId, context: { ...ctx, timeoutMs: env.sofficeTimeoutMs } });
      throw new StudioEngineError("RENDER_TIMEOUT", `soffice exceeded ${env.sofficeTimeoutMs} ms`, { jobId: i.jobId, timeoutMs: env.sofficeTimeoutMs });
    }

    let pdf: Uint8Array | null = null;
    try {
      pdf = new Uint8Array(await readFile(outFile));
    } catch {
      pdf = null;
    }
    if (r.code !== 0 || !pdf || pdf.length === 0 || !startsWithPdfMagic(pdf)) {
      const reason =
        r.code !== 0 ? `exit ${r.code}` : !pdf ? "PDF not produced" : pdf.length === 0 ? "PDF is empty" : "output lacks %PDF- header";
      sofficeLog({ level: "error", message: `soffice conversion failed: ${reason}`, code: "PDF_CONVERT_FAILED", correlationId: i.jobId, context: { ...ctx, stderrTail: r.stderrTail } });
      throw new StudioEngineError("PDF_CONVERT_FAILED", `soffice conversion failed: ${reason}`, {
        jobId: i.jobId,
        exitCode: r.code,
        stderr: redactServerPaths(r.stderrTail || r.stdoutTail),
      });
    }

    sofficeLog({ level: "info", message: "soffice conversion ok", code: "PDF_CONVERTED", correlationId: i.jobId, context: { ...ctx, pdfBytes: pdf.length } });
    return { pdf, durationMs: r.durationMs };
  } catch (e) {
    if (!(e instanceof StudioEngineError)) {
      const err = e instanceof Error ? e : new Error(String(e));
      sofficeLog({ level: "error", message: `soffice job I/O failed: ${err.message}`, code: "PDF_CONVERT_FAILED", correlationId: i.jobId, stack_trace: err.stack });
      throw new StudioEngineError("PDF_CONVERT_FAILED", "soffice job I/O failed", { jobId: i.jobId });
    }
    throw e;
  } finally {
    for (const dir of work?.short ? [work.dir, jobDir] : [jobDir]) {
      await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }).catch((e: unknown) =>
        sofficeLog({ level: "warn", message: "soffice job dir cleanup failed", correlationId: i.jobId, context: { jobDir: dir, detail: String(e) } }),
      );
    }
    activeJobs.delete(i.jobId);
    if (slotHeld) releaseSlot(max);
  }
}
