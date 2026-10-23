// @ts-check
/**
 * Satu definisi "render-env siap" (FIX-8, temuan review M8; 01_specs.md §8.4).
 *
 * Dipakai bersama oleh layanan `engine/soffice/readiness.ts` (S92) dan skrip
 * `render-env/check_readiness.mjs` (S91), sehingga keduanya tidak bisa lagi
 * berbeda pendapat. Modul ini murni: tidak menjalankan proses dan tidak
 * menulis apa pun. Pengumpulan fakta (menjalankan `soffice --version`,
 * `reg.exe query`, enumerasi fon sesi) tetap di masing-masing pemanggil,
 * lalu fakta itu dinilai oleh `evaluateReadiness`.
 *
 * Siap = SEMUA berikut:
 *  1. manifest terbaca, JSON sah, skema `studio.render-env/v1`, `soffice.path`
 *     dan `fonts[]` lengkap, `soffice.version` manifest = versi wajib;
 *  2. biner soffice ada dan `--version` = versi wajib (24.2.3.2);
 *  3. setiap fon `required`: berkas ada, sha256 cocok, nilai HKCU bernama
 *     `hkcuValueName` (tanpa beda huruf besar/kecil, REG_SZ/REG_EXPAND_SZ)
 *     MENUNJUK berkas itu (data absolut dibandingkan utuh; nama berkas saja
 *     dibandingkan ke basename, D-36);
 *  4. keluarga GDI (nameID 1, dipotong 31 karakter) setiap fon `required`
 *     termuat di sesi (kondisi F2 S91 / D-35). Cek ini tidak bisa dilewati
 *     tanpa kehilangan status siap.
 *
 * Pesan `errors` tidak memuat path absolut server (L13): berkas disebut lewat
 * basename. Path lengkap hanya ada di `details` (untuk log server / stderr skrip).
 */
import { existsSync } from "node:fs";
import path from "node:path";

export const HKCU_FONTS_KEY = "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";

/** Batas panjang nama keluarga GDI (LOGFONT.lfFaceName = 32 termasuk NUL). */
const GDI_FACE_MAX = 31;

// ── Biner sistem Windows dengan path absolut (L-03) ─────────────────────────

/**
 * Path absolut biner di `%SystemRoot%\System32`. Tidak pernah bergantung pada
 * PATH atau direktori kerja (resolusi Windows mencari cwd lebih dulu, CWE-427).
 * `SystemRoot` yang bukan path drive absolut diabaikan (jatuh ke C:\Windows).
 * @param {...string} segments
 * @returns {string}
 */
export function systemBinary(...segments) {
  const root = process.env.SystemRoot ?? process.env.SYSTEMROOT;
  const base = typeof root === "string" && /^[A-Za-z]:\\[^"<>|?*]*$/.test(root.trim()) ? root.trim() : "C:\\Windows";
  return path.win32.join(base, "System32", ...segments);
}

export function regExePath() {
  return systemBinary("reg.exe");
}

export function taskkillExePath() {
  return systemBinary("taskkill.exe");
}

export function powershellExePath() {
  return systemBinary("WindowsPowerShell", "v1.0", "powershell.exe");
}

/** Argumen tetap `reg.exe` untuk membaca daftar fon HKCU (hanya baca). */
export const REG_QUERY_ARGS = Object.freeze(["query", HKCU_FONTS_KEY]);

/**
 * Argumen tetap PowerShell untuk enumerasi keluarga fon sesi (GDI+
 * InstalledFontCollection; mencakup fon per-user yang termuat). Hanya membaca.
 */
export const SESSION_FAMILIES_ARGS = Object.freeze([
  "-NoProfile",
  "-NonInteractive",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "[Console]::OutputEncoding=[Text.Encoding]::UTF8;" +
    "Add-Type -AssemblyName System.Drawing;" +
    "(New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }",
]);

// ── Pengurai ────────────────────────────────────────────────────────────────

/**
 * @param {string} text isi manifest (BOM diizinkan)
 * @param {string} schema skema wajib
 * @returns {{ manifest: any, error: string | null }}
 */
export function parseManifest(text, schema) {
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return { manifest: null, error: "render-env manifest is not valid JSON" };
  }
  if (!parsed || typeof parsed !== "object" || parsed.schema !== schema) {
    return { manifest: null, error: `render-env manifest schema must be ${schema}` };
  }
  if (!parsed.soffice || typeof parsed.soffice.path !== "string" || !Array.isArray(parsed.fonts)) {
    return { manifest: null, error: "render-env manifest missing soffice.path or fonts[]" };
  }
  const bad = parsed.fonts.find(
    (/** @type {any} */ f) =>
      !f ||
      typeof f.family !== "string" ||
      typeof f.style !== "string" ||
      typeof f.file !== "string" ||
      typeof f.sha256 !== "string" ||
      typeof f.hkcuValueName !== "string" ||
      typeof f.required !== "boolean",
  );
  if (bad !== undefined) return { manifest: null, error: "render-env manifest has a malformed fonts[] entry" };
  return { manifest: parsed, error: null };
}

/**
 * Versi dari keluaran `soffice --version` ("LibreOffice 24.2.3.2 ...").
 * @param {string} text
 * @returns {string | null}
 */
export function parseSofficeVersion(text) {
  const m = /LibreOffice\s+(\d+\.\d+\.\d+\.\d+)/.exec(text) ?? /(\d+\.\d+\.\d+\.\d+)/.exec(text);
  return m ? m[1] : null;
}

/**
 * Baris nilai `reg.exe query`: "    <nama>    REG_<TIPE>    <data>".
 * Kunci Map = nama asli (huruf asli dipertahankan untuk build_manifest).
 * @param {string} stdout
 * @returns {Map<string, { type: string, data: string }>}
 */
export function parseRegQuery(stdout) {
  const values = new Map();
  for (const line of stdout.split(/\r?\n/)) {
    const m = /^ {4}(.+?) {4}(REG_[A-Z_]+)(?: {4}(.*))?$/.exec(line);
    if (m) values.set(m[1].trim(), { type: m[2], data: (m[3] ?? "").trim() });
  }
  return values;
}

/**
 * Nama nilai registri tidak membedakan huruf besar/kecil.
 * @param {Map<string, { type: string, data: string }>} values
 * @param {string} name
 */
export function lookupRegValue(values, name) {
  const direct = values.get(name);
  if (direct) return direct;
  const want = name.trim().toLowerCase();
  for (const [k, v] of values) if (k.toLowerCase() === want) return v;
  return undefined;
}

/**
 * Ganti `%NAMA%` dengan variabel lingkungan (REG_EXPAND_SZ); yang tidak dikenal dibiarkan.
 * @param {string} s
 */
function expandEnv(s) {
  return s.replace(/%([^%]+)%/g, (whole, name) => {
    const key = Object.keys(process.env).find((k) => k.toLowerCase() === String(name).toLowerCase());
    const v = key ? process.env[key] : undefined;
    return v ?? whole;
  });
}

/**
 * Apakah data nilai registri menunjuk ke berkas fon. Data absolut dibandingkan
 * utuh (tanpa beda huruf besar/kecil); data berupa nama berkas saja dibandingkan
 * ke basename (entri lama per-user tanpa path, research/05, D-36).
 * @param {string | undefined | null} data
 * @param {string} file
 */
export function registryPointsTo(data, file) {
  if (!data) return false;
  const expanded = expandEnv(data);
  const norm = (/** @type {string} */ p) => path.win32.normalize(p).toLowerCase();
  if (path.win32.isAbsolute(expanded)) return norm(expanded) === norm(file);
  return expanded.toLowerCase() === path.win32.basename(file).toLowerCase();
}

/**
 * Nama dari tabel `name` sfnt (platform 3 Windows, encoding 1/0, bahasa 0x0409
 * diutamakan). Dipakai untuk keluarga GDI (nameID 1) dan keluarga/gaya
 * tipografis (16/17, jatuh ke 1/2). Melempar bila tabel tidak ada.
 * @param {Uint8Array} bytes
 */
export function readFontNamesFromBuffer(bytes) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = buf.readUInt16BE(4);
  let off = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString("latin1", rec, rec + 4) === "name") {
      off = buf.readUInt32BE(rec + 8);
      break;
    }
  }
  if (off < 0) throw new Error("font has no name table");
  const count = buf.readUInt16BE(off + 2);
  const strOff = off + buf.readUInt16BE(off + 4);
  /** @type {Map<number, { score: number, value: string }>} */
  const best = new Map();
  for (let i = 0; i < count; i++) {
    const r = off + 6 + i * 12;
    const platformID = buf.readUInt16BE(r);
    const encodingID = buf.readUInt16BE(r + 2);
    const languageID = buf.readUInt16BE(r + 4);
    const nameID = buf.readUInt16BE(r + 6);
    const length = buf.readUInt16BE(r + 8);
    const start = strOff + buf.readUInt16BE(r + 10);
    let value;
    let score;
    if (platformID === 3 && (encodingID === 1 || encodingID === 0)) {
      const be = buf.subarray(start, start + length);
      const le = Buffer.alloc(be.length);
      for (let j = 0; j + 1 < be.length; j += 2) {
        le[j] = be[j + 1];
        le[j + 1] = be[j];
      }
      value = le.toString("utf16le");
      score = languageID === 0x0409 ? 3 : 2;
    } else if (platformID === 1 && encodingID === 0) {
      value = buf.toString("latin1", start, start + length);
      score = 1;
    } else continue;
    const cur = best.get(nameID);
    if (!cur || score > cur.score) best.set(nameID, { score, value });
  }
  const get = (/** @type {number} */ id) => best.get(id)?.value ?? "";
  return {
    gdiFamily: get(1),
    subfamily: get(2),
    fullName: get(4),
    family: get(16) || get(1),
    style: get(17) || get(2),
  };
}

/** Nama keluarga GDI seperti yang dilaporkan enumerasi (dipotong 31 karakter).
 * @param {string} name */
export function gdiFaceName(name) {
  return name.length > GDI_FACE_MAX ? name.slice(0, GDI_FACE_MAX) : name;
}

/**
 * Apakah keluarga GDI `expected` termuat. Cocok persis, atau keluarga
 * terenumerasi diawali `expected + " "` yang bukan keluarga milik fon manifest
 * lain (GDI+ kadang menambah kata gaya, mis. "IBM Plex Sans SemiBold SemiBold").
 * @param {Set<string>} families
 * @param {string} expected
 * @param {Set<string>} otherExpected
 */
export function familyLoaded(families, expected, otherExpected) {
  const want = gdiFaceName(expected);
  if (families.has(want)) return true;
  for (const f of families) {
    if (f.startsWith(`${want} `) && !otherExpected.has(f)) return true;
  }
  return false;
}

/** @param {string} stdout keluaran `SESSION_FAMILIES_ARGS` */
export function parseSessionFamilies(stdout) {
  return new Set(
    stdout
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

// ── Resolusi path (sama untuk skrip dan layanan) ────────────────────────────

/**
 * soffice: path eksplisit (`SOFFICE_PATH`) > manifest (relatif folder manifest) > bawaan.
 * @param {{ explicit?: string | null, manifest: any, manifestPath: string, fallback: string }} i
 */
export function resolveSofficePath(i) {
  if (i.explicit && i.explicit.trim()) return i.explicit.trim();
  if (i.manifest && typeof i.manifest.soffice?.path === "string") {
    return path.resolve(path.dirname(i.manifestPath), i.manifest.soffice.path);
  }
  return i.fallback;
}

/**
 * Chromium: path eksplisit (`STUDIO_CHROMIUM_PATH`) > manifest > bawaan. Hanya dilaporkan.
 * @param {{ explicit?: string | null, manifest: any, fallback: string }} i
 */
export function resolveChromiumPath(i) {
  if (i.explicit && i.explicit.trim()) return i.explicit.trim();
  const m = i.manifest?.chromium?.executablePath;
  return typeof m === "string" && m ? m : i.fallback;
}

/**
 * Berkas fon: absolut apa adanya; relatif dicoba terhadap folder manifest lalu `cwd`.
 * @param {string} file
 * @param {string} manifestPath
 * @param {string} cwd
 */
export function resolveFontFile(file, manifestPath, cwd) {
  if (path.isAbsolute(file)) return file;
  const byManifest = path.resolve(path.dirname(manifestPath), file);
  if (existsSync(byManifest)) return byManifest;
  return path.resolve(cwd, file);
}

// ── Penilaian ───────────────────────────────────────────────────────────────

/**
 * @typedef {object} ReadinessFacts
 * @property {string} checkedAt
 * @property {{ schema: string, sofficeVersion: string }} required
 * @property {string} manifestPath
 * @property {{ manifest: any, sha256: string | null, error: string | null, detail?: string | null }} manifest
 * @property {{ path: string, found: boolean, version: string | null, failure: string | null, detail?: string | null }} soffice
 * @property {boolean} chromiumFound
 * @property {Array<{ entry: any, abs: string, fileExists: boolean, sha256: string | null, gdiFamily: string | null, namesError?: string | null }>} fonts
 * @property {{ values: Map<string, { type: string, data: string }> | null, error: string | null, detail?: string | null }} registry
 * @property {{ families: Set<string> | null, error: string | null, skipped: boolean, detail?: string | null }} session
 */

/**
 * Nilai fakta menjadi `RenderEnvReadiness` + rincian path untuk log.
 * @param {ReadinessFacts} f
 */
export function evaluateReadiness(f) {
  /** @type {Array<{ message: string, detail: string | null }>} */
  const issues = [];
  const add = (/** @type {string} */ message, /** @type {string | null | undefined} */ detail) =>
    issues.push({ message, detail: detail ?? null });

  const manifest = f.manifest.manifest;
  if (f.manifest.error) add(f.manifest.error, f.manifest.detail ?? `manifest: ${f.manifestPath}`);
  if (manifest && manifest.soffice?.version !== f.required.sofficeVersion) {
    add(`render-env manifest soffice.version ${String(manifest.soffice?.version ?? "missing")} != required ${f.required.sofficeVersion}`, null);
  }

  // soffice
  const versionOk = f.soffice.found && f.soffice.version === f.required.sofficeVersion;
  if (!f.soffice.found) add("soffice binary not found (check SOFFICE_PATH or manifest soffice.path)", `soffice: ${f.soffice.path}`);
  else if (f.soffice.failure) add(`soffice --version failed: ${f.soffice.failure}`, f.soffice.detail);
  else if (!versionOk) add(`soffice version ${f.soffice.version ?? "unknown"} != required ${f.required.sofficeVersion}`, null);

  // fon
  /** @type {Array<{ family: string, style: string, fileExists: boolean, sha256Ok: boolean, registered: boolean }>} */
  const fonts = [];
  if (manifest) {
    if (f.registry.error) add(`HKCU font registry not readable: ${f.registry.error}`, f.registry.detail);
    const reg = f.registry.values;
    for (const x of f.fonts) {
      const e = x.entry;
      const sha256Ok = x.fileExists && x.sha256 !== null && x.sha256 === String(e.sha256).toLowerCase();
      const value = reg ? lookupRegValue(reg, e.hkcuValueName) : undefined;
      const typeOk = value !== undefined && (value.type === "REG_SZ" || value.type === "REG_EXPAND_SZ");
      const registered = typeOk && registryPointsTo(value?.data, x.abs);
      fonts.push({ family: e.family, style: e.style, fileExists: x.fileExists, sha256Ok, registered });
      if (!e.required) continue;
      const label = `${e.family} ${e.style} (${path.win32.basename(x.abs)})`;
      if (!x.fileExists) {
        add(`font file missing: ${label}`, `font file: ${x.abs}`);
        continue;
      }
      if (!sha256Ok) add(`font sha256 mismatch: ${label}`, `font file: ${x.abs}`);
      if (reg && !registered) {
        add(
          `font not registered in HKCU: ${label}: value "${e.hkcuValueName}" ${value === undefined ? "absent" : typeOk ? "points to another file" : `has type ${value.type}`}`,
          value === undefined ? null : `HKCU "${e.hkcuValueName}" = ${value.data}; expected ${x.abs}`,
        );
      }
      if (x.namesError) add(`font name table not readable: ${label}`, `${x.abs}: ${x.namesError}`);
    }

    // keluarga GDI termuat di sesi
    if (f.session.skipped) add("session font check skipped; readiness not established", null);
    else if (f.session.error) add(`session font enumeration failed: ${f.session.error}`, f.session.detail);
    else if (f.session.families) {
      const gdiByFont = f.fonts.filter((x) => x.gdiFamily);
      const allExpected = new Set(gdiByFont.map((x) => gdiFaceName(/** @type {string} */ (x.gdiFamily))));
      for (const x of gdiByFont) {
        if (!x.entry.required) continue;
        const gdi = /** @type {string} */ (x.gdiFamily);
        const others = new Set([...allExpected].filter((n) => n !== gdiFaceName(gdi)));
        if (!familyLoaded(f.session.families, gdi, others)) {
          add(`font family not loaded in session: "${gdi}" (${path.win32.basename(x.abs)}); sign in again so per-user fonts load`, null);
        }
      }
    }
  }

  const readiness = {
    ready: issues.length === 0 && manifest !== null && f.soffice.found && versionOk,
    checkedAt: f.checkedAt,
    manifestSha256: f.manifest.sha256,
    soffice: { found: f.soffice.found, version: f.soffice.version, versionOk },
    chromium: { found: f.chromiumFound },
    fonts,
    errors: issues.map((i) => i.message),
  };
  return {
    readiness,
    details: issues.filter((i) => i.detail).map((i) => `${i.message} -- ${i.detail}`),
  };
}
