/**
 * Cek kesiapan render-env (S92, 01_specs.md §8.4; KT-17).
 *
 * Definisi "siap" ada di SATU tempat: `readiness-rules.mjs` (FIX-8, M8), dipakai
 * juga oleh skrip `render-env/check_readiness.mjs`. Modul ini hanya
 * mengumpulkan fakta: manifest S91, `soffice --version` (dengan profil
 * sementara sendiri: profil default user tidak pernah disentuh), nilai
 * `HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts` (lewat
 * `%SystemRoot%\System32\reg.exe query`, argumen tetap; HKCU tidak pernah
 * ditulis), sha256 dan tabel `name` setiap fon, serta keluarga fon yang termuat
 * di sesi (PowerShell `InstalledFontCollection`, hanya baca). Hasil di-cache
 * `STUDIO_READINESS_CACHE_MS` (C15).
 *
 * `errors` tidak memuat path absolut server (L13); path lengkap hanya ke log.
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getStudioEnv, STUDIO_READINESS_CACHE_MS } from "../../contract/env";
import {
  RENDER_ENV_SCHEMA,
  RENDER_ENV_SOFFICE_VERSION,
  type RenderEnvManifest,
  type RenderEnvReadiness,
} from "../../contract/render-env";
import { sofficeLog } from "./log";
import { PathTooLongError, prepareProbeProfileDir } from "./paths";
import { runBounded } from "./process";
import {
  evaluateReadiness,
  HKCU_FONTS_KEY,
  parseManifest,
  parseRegQuery,
  parseSessionFamilies,
  parseSofficeVersion,
  powershellExePath,
  readFontNamesFromBuffer,
  regExePath,
  REG_QUERY_ARGS,
  resolveChromiumPath,
  resolveFontFile,
  resolveSofficePath,
  SESSION_FAMILIES_ARGS,
  type ReadinessFacts,
} from "./readiness-rules.mjs";

export { HKCU_FONTS_KEY };

const VERSION_TIMEOUT_MS = 60000;
const REG_TIMEOUT_MS = 15000;
const SESSION_TIMEOUT_MS = 60000;
/** Daftar fon/keluarga bisa > 2 KB: ekor diperbesar ke 1 MiB. */
const LIST_TAIL_BYTES = 1024 * 1024;

export interface ReadinessState {
  readiness: RenderEnvReadiness;
  /** Path soffice absolut yang dipakai cek ini (dan konversi berikutnya). */
  sofficePath: string;
}

let cache: { state: ReadinessState; at: number } | null = null;
let inFlight: Promise<ReadinessState> | null = null;

function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Profil LibreOffice sebagai URL `file:///...` (pathToFileURL meng-enkode spasi). */
export function profileUrl(dir: string): string {
  return pathToFileURL(dir).href;
}

async function loadManifest(manifestPath: string): Promise<ReadinessFacts["manifest"]> {
  let raw: Buffer;
  try {
    raw = await readFile(manifestPath);
  } catch (e) {
    return { manifest: null, sha256: null, error: "render-env manifest not readable", detail: `${manifestPath}: ${String(e)}` };
  }
  const parsed = parseManifest(raw.toString("utf8"), RENDER_ENV_SCHEMA);
  return { manifest: parsed.manifest, sha256: sha256(raw), error: parsed.error };
}

/** Alasan singkat tanpa path (spawnError.message bisa memuat path biner). */
function failureReason(r: { timedOut: boolean; spawnError: Error | null; code: number | null }): string {
  if (r.timedOut) return "timeout";
  if (r.spawnError) return `could not be started (${(r.spawnError as NodeJS.ErrnoException).code ?? "spawn error"})`;
  return `exit ${r.code ?? "none"}`;
}

async function querySofficeVersion(sofficePath: string): Promise<ReadinessFacts["soffice"]> {
  if (!existsSync(sofficePath)) return { path: sofficePath, found: false, version: null, failure: null };
  let tmpDir = path.join(getStudioEnv().workspaceRoot, "tmp", `readiness-${randomUUID()}`);
  try {
    // IP-33: profil di bawah ambang aman Windows, selain itu %TEMP%/gso-XXXXXX.
    let probe: Awaited<ReturnType<typeof prepareProbeProfileDir>>;
    try {
      probe = await prepareProbeProfileDir(tmpDir);
    } catch (e) {
      if (!(e instanceof PathTooLongError)) throw e;
      return { path: sofficePath, found: true, version: null, failure: `not run: ${e.message}` };
    }
    tmpDir = probe.dir;
    const r = await runBounded(
      sofficePath,
      ["--headless", "--norestore", "--nologo", "--nodefault", "--nolockcheck", `-env:UserInstallation=${profileUrl(probe.profileDir)}`, "--version"],
      { timeoutMs: VERSION_TIMEOUT_MS },
    );
    if (r.spawnError || r.timedOut) {
      return { path: sofficePath, found: true, version: null, failure: failureReason(r), detail: r.spawnError?.message ?? null };
    }
    return { path: sofficePath, found: true, version: parseSofficeVersion(r.stdoutTail + "\n" + r.stderrTail), failure: null };
  } finally {
    await rm(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch((e: unknown) =>
      sofficeLog({ level: "warn", message: "readiness temp dir cleanup failed", context: { tmpDir, detail: String(e) } }),
    );
  }
}

async function queryRegistry(): Promise<ReadinessFacts["registry"]> {
  if (process.platform !== "win32") return { values: null, error: "requires Windows" };
  const r = await runBounded(regExePath(), REG_QUERY_ARGS, { timeoutMs: REG_TIMEOUT_MS, tailBytes: LIST_TAIL_BYTES });
  if (r.code !== 0) return { values: null, error: `reg.exe query ${failureReason(r)}`, detail: r.spawnError?.message ?? (r.stderrTail.trim() || null) };
  return { values: parseRegQuery(r.stdoutTail), error: null };
}

async function querySessionFamilies(): Promise<ReadinessFacts["session"]> {
  if (process.platform !== "win32") return { families: null, error: "requires Windows", skipped: false };
  const r = await runBounded(powershellExePath(), SESSION_FAMILIES_ARGS, { timeoutMs: SESSION_TIMEOUT_MS, tailBytes: LIST_TAIL_BYTES });
  if (r.code !== 0 || r.timedOut) {
    return { families: null, error: failureReason(r), skipped: false, detail: r.spawnError?.message ?? (r.stderrTail.trim().slice(-500) || null) };
  }
  return { families: parseSessionFamilies(r.stdoutTail), error: null, skipped: false };
}

async function fontFacts(manifest: RenderEnvManifest, manifestPath: string): Promise<ReadinessFacts["fonts"]> {
  const out: ReadinessFacts["fonts"] = [];
  for (const entry of manifest.fonts) {
    const abs = resolveFontFile(entry.file, manifestPath, process.cwd());
    let buf: Buffer | null = null;
    try {
      buf = await readFile(abs);
    } catch {
      buf = null;
    }
    let gdiFamily: string | null = null;
    let namesError: string | null = null;
    if (buf) {
      try {
        gdiFamily = readFontNamesFromBuffer(buf).gdiFamily || null;
      } catch (e) {
        namesError = e instanceof Error ? e.message : String(e);
      }
    }
    out.push({ entry, abs, fileExists: buf !== null, sha256: buf ? sha256(buf) : null, gdiFamily, namesError });
  }
  return out;
}

async function runCheck(): Promise<ReadinessState> {
  const env = getStudioEnv();
  const manifestPath = env.renderEnvManifestPath;
  const manifest = await loadManifest(manifestPath);
  const m = manifest.manifest;
  const sofficePath = resolveSofficePath({
    explicit: process.env.SOFFICE_PATH?.trim() ? env.sofficePath : null,
    manifest: m,
    manifestPath,
    fallback: env.sofficePath,
  });
  const chromiumPath = resolveChromiumPath({
    explicit: process.env.STUDIO_CHROMIUM_PATH?.trim() ? env.chromiumPath : null,
    manifest: m,
    fallback: env.chromiumPath,
  });
  const [soffice, registry, session, fonts] = await Promise.all([
    querySofficeVersion(sofficePath),
    m ? queryRegistry() : Promise.resolve<ReadinessFacts["registry"]>({ values: null, error: null }),
    m ? querySessionFamilies() : Promise.resolve<ReadinessFacts["session"]>({ families: null, error: null, skipped: false }),
    m ? fontFacts(m, manifestPath) : Promise.resolve<ReadinessFacts["fonts"]>([]),
  ]);

  const { readiness, details } = evaluateReadiness({
    checkedAt: new Date().toISOString(),
    required: { schema: RENDER_ENV_SCHEMA, sofficeVersion: RENDER_ENV_SOFFICE_VERSION },
    manifestPath,
    manifest,
    soffice,
    chromiumFound: existsSync(chromiumPath),
    fonts,
    registry,
    session,
  });
  sofficeLog({
    level: readiness.ready ? "info" : "error",
    message: readiness.ready ? "render-env ready" : "render-env not ready",
    code: readiness.ready ? "RENDER_ENV_READY" : "PDF_ENGINE_UNAVAILABLE",
    // Log server memuat path lengkap (details); `errors` yang sampai ke API tidak.
    context: { manifestSha256: readiness.manifestSha256, sofficeVersion: soffice.version, errors: readiness.errors, details },
  });
  return { readiness, sofficePath };
}

/** Cek (cache C15; `force` melewati cache). Panggilan bersamaan berbagi satu cek. */
export async function getReadinessState(opts?: { force?: boolean }): Promise<ReadinessState> {
  const now = Date.now();
  if (!opts?.force && cache && now - cache.at < STUDIO_READINESS_CACHE_MS) return cache.state;
  if (inFlight) return inFlight;
  inFlight = runCheck()
    .then((state) => {
      cache = { state, at: Date.now() };
      return state;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Untuk uji: lupakan cache kesiapan. */
export function resetReadinessCache(): void {
  cache = null;
}
