// Pustaka bersama render-env (S91): hanya membaca lingkungan.
// Kontrak: docs/2026-10-22_doc_artifact_studio/masterplan/01_specs.md §8.4,
// tipe di src/lib/studio/contract/render-env.ts.
// Larangan: tidak pernah menulis HKCU, tidak pernah memuat fon (AddFontResource),
// tidak pernah memakai profil default LibreOffice.
// FIX-8: definisi "siap" (M8), pengurai registri/nama fon/keluarga sesi, dan path
// absolut biner sistem `%SystemRoot%\System32\...` (L-03) berasal dari SATU modul
// yang juga dipakai layanan engine/soffice:
// src/lib/studio/engine/soffice/readiness-rules.mjs.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HKCU_FONTS_KEY,
  REG_QUERY_ARGS,
  SESSION_FAMILIES_ARGS,
  familyLoaded,
  gdiFaceName,
  parseRegQuery,
  parseSessionFamilies,
  parseSofficeVersion,
  powershellExePath,
  readFontNamesFromBuffer,
  regExePath,
  registryPointsTo,
  taskkillExePath,
} from "../src/lib/studio/engine/soffice/readiness-rules.mjs";

export { HKCU_FONTS_KEY, familyLoaded, gdiFaceName, registryPointsTo };

export const RENDER_ENV_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(RENDER_ENV_DIR, "..");
export const MANIFEST_PATH = path.join(RENDER_ENV_DIR, "manifest.json");
export const OUT_DIR = path.join(RENDER_ENV_DIR, "out");

export const SCHEMA = "studio.render-env/v1";
export const SOFFICE_VERSION = "24.2.3.2";
export const CHROMIUM_REVISION = "1234";
export const CHROMIUM_VERSION = "151.0.7922.34";
export const EXIT = { READY: 0, FAIL: 1, USAGE: 2, NOT_READY: 3 };

export const DEFAULT_SOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.com";
export const DEFAULT_CHROMIUM_PATH =
  "C:\\Users\\TRIAL\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";
export const USER_FONT_DIR = "C:\\Users\\TRIAL\\AppData\\Local\\Microsoft\\Windows\\Fonts";
export const DEFAULT_PYTHON = "C:\\Users\\TRIAL\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe";

export function sha256File(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Jalankan proses tanpa shell, argumen array, dengan batas waktu dan tree-kill
 * (`%SystemRoot%\System32\taskkill.exe /PID <pid> /T /F`, pola hermes-bridge/bridge.mjs).
 * Kembalian: { code, stdout, stderr, timedOut }.
 */
export function run(cmd, args, { timeoutMs = 30000, cwd, env } = {}) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let child;
    try {
      child = spawn(cmd, args, { cwd, env, windowsHide: true, shell: false });
    } catch (err) {
      resolve({ code: null, stdout, stderr: String(err?.message ?? err), timedOut });
      return;
    }
    const timer = setTimeout(() => {
      timedOut = true;
      treeKill(child.pid);
    }, timeoutMs);
    child.stdout?.on("data", (d) => (stdout += d.toString("utf8")));
    child.stderr?.on("data", (d) => (stderr += d.toString("utf8")));
    const finish = (code, extraErr) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr: extraErr ? `${stderr}${extraErr}` : stderr, timedOut });
    };
    child.on("error", (err) => finish(null, String(err?.message ?? err)));
    child.on("close", (code) => finish(code));
  });
}

export function treeKill(pid) {
  if (!pid) return;
  try {
    spawn(taskkillExePath(), ["/PID", String(pid), "/T", "/F"], { windowsHide: true, shell: false, stdio: "ignore" });
  } catch {
    // proses mungkin sudah selesai; tidak ada yang perlu dilakukan
  }
}

/** Versi soffice dari `--version` (tanpa profil; perintah ini tidak membuat profil user). */
export async function sofficeVersion(sofficePath) {
  if (!existsSync(sofficePath)) return { found: false, version: null, raw: "" };
  const r = await run(sofficePath, ["--version"], { timeoutMs: 60000 });
  return {
    found: true,
    version: parseSofficeVersion(`${r.stdout}\n${r.stderr}`),
    raw: r.stdout.trim(),
    timedOut: r.timedOut,
    code: r.code,
    spawnFailed: r.code === null && !r.timedOut,
  };
}

/**
 * Baca nilai di HKCU\...\Fonts lewat `%SystemRoot%\System32\reg.exe query` (argumen tetap,
 * hanya baca). Kembalian: Map nama nilai (huruf asli) -> data. Pengurai bersama `parseRegQuery`.
 */
export async function readHkcuFonts() {
  return new Map([...(await readHkcuFontValues())].map(([name, v]) => [name, v.data]));
}

/** Seperti `readHkcuFonts`, tetapi menyertakan tipe nilai (REG_SZ/REG_EXPAND_SZ/...). */
export async function readHkcuFontValues() {
  const r = await run(regExePath(), [...REG_QUERY_ARGS], { timeoutMs: 20000 });
  if (r.code !== 0) throw new Error(`reg.exe query gagal (exit ${r.code}${r.timedOut ? ", timeout" : ""}): ${r.stderr.trim()}`);
  return parseRegQuery(r.stdout);
}

/**
 * Nama dari tabel `name` sfnt (pengurai bersama `readFontNamesFromBuffer`).
 * Dipakai untuk keluarga GDI (nameID 1) dan keluarga/gaya tipografis (16/17, jatuh ke 1/2).
 */
export function readFontNames(file) {
  try {
    return readFontNamesFromBuffer(readFileSync(file));
  } catch (err) {
    throw new Error(`tabel name tidak terbaca: ${file}: ${err?.message ?? err}`);
  }
}

/**
 * Enumerasi keluarga fon yang termuat di sesi (GDI+ InstalledFontCollection, mencakup fon
 * per-user dan fon yang dimuat ke sesi) lewat PowerShell path absolut. Hanya membaca;
 * tidak memuat fon apa pun.
 */
export async function listSessionFamilies() {
  const r = await run(powershellExePath(), [...SESSION_FAMILIES_ARGS], { timeoutMs: 60000 });
  if (r.code !== 0 || r.timedOut) {
    throw new Error(`enumerasi fon sesi gagal (exit ${r.code}${r.timedOut ? ", timeout" : ""}): ${r.stderr.trim().slice(-500)}`);
  }
  return parseSessionFamilies(r.stdout);
}

export function readManifest(file = MANIFEST_PATH) {
  const text = readFileSync(file, "utf8");
  return { manifest: JSON.parse(text), sha256: sha256Text(text), text };
}
