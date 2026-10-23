#!/usr/bin/env node
// Cek kesiapan render-env (S91, 01_specs.md §8.4). HANYA MEMBACA: tidak menulis HKCU,
// tidak memuat fon, tidak memakai profil LibreOffice.
// Pakai: node render-env/check_readiness.mjs [--manifest <manifest.json>] [--skip-session]
//   --skip-session  lewati enumerasi keluarga fon sesi (lebih cepat, untuk diagnosis);
//                   hasilnya SELALU ready=false karena kesiapan tidak terbukti (M8).
// Keluaran: RenderEnvReadiness (src/lib/studio/contract/render-env.ts) sebagai JSON di stdout;
// pesan galat per baris di stderr, ditambah rincian path lengkap. Exit 0 siap, 3 tidak siap,
// 2 salah pakai.
//
// Definisi "siap" TIDAK ditulis di sini: skrip ini hanya mengumpulkan fakta lalu memanggil
// `evaluateReadiness` dari src/lib/studio/engine/soffice/readiness-rules.mjs, modul yang sama
// dengan yang dipakai layanan engine/soffice (FIX-8, temuan M8).
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  evaluateReadiness,
  parseManifest,
  readFontNamesFromBuffer,
  resolveChromiumPath,
  resolveFontFile,
  resolveSofficePath,
} from "../src/lib/studio/engine/soffice/readiness-rules.mjs";
import {
  DEFAULT_CHROMIUM_PATH,
  DEFAULT_SOFFICE_PATH,
  EXIT,
  MANIFEST_PATH,
  REPO_ROOT,
  SCHEMA,
  SOFFICE_VERSION,
  listSessionFamilies,
  readHkcuFontValues,
  sha256Text,
  sofficeVersion,
} from "./lib.mjs";

function usage(msg, code = EXIT.USAGE) {
  process.stderr.write(`${msg}\nPakai: node render-env/check_readiness.mjs [--manifest <manifest.json>] [--skip-session]\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const o = { manifest: MANIFEST_PATH, session: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage("Cek kesiapan render-env (hanya membaca).", EXIT.READY);
    else if (a === "--manifest") {
      if (!argv[i + 1]) usage("--manifest butuh nilai");
      o.manifest = path.resolve(argv[++i]);
    } else if (a === "--skip-session") o.session = false;
    else usage(`argumen tidak dikenal: ${a}`);
  }
  return o;
}

function errMsg(err) {
  return String(err?.message ?? err);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // 1. Manifest.
  let manifestFacts;
  try {
    const text = readFileSync(opts.manifest, "utf8");
    const parsed = parseManifest(text, SCHEMA);
    manifestFacts = { manifest: parsed.manifest, sha256: sha256Text(text), error: parsed.error };
  } catch (err) {
    manifestFacts = { manifest: null, sha256: null, error: "render-env manifest not readable", detail: `${opts.manifest}: ${errMsg(err)}` };
  }
  const manifest = manifestFacts.manifest;

  // 2. soffice: biner + `--version` (tanpa profil).
  const sofficePath = resolveSofficePath({
    explicit: process.env.SOFFICE_PATH ? path.resolve(process.env.SOFFICE_PATH) : null,
    manifest,
    manifestPath: opts.manifest,
    fallback: DEFAULT_SOFFICE_PATH,
  });
  const sv = await sofficeVersion(sofficePath);
  const soffice = {
    path: sofficePath,
    found: sv.found,
    version: sv.found ? sv.version : null,
    failure: !sv.found ? null : sv.timedOut ? "timeout" : sv.spawnFailed ? "could not be started" : null,
  };

  // 3. Chromium: hanya dilaporkan.
  const chromiumPath = resolveChromiumPath({ explicit: process.env.STUDIO_CHROMIUM_PATH ?? null, manifest, fallback: DEFAULT_CHROMIUM_PATH });

  // 4. Fakta fon, registri HKCU, keluarga sesi.
  const fonts = [];
  let registry = { values: null, error: null };
  let session = { families: null, error: null, skipped: !opts.session };
  if (manifest) {
    for (const entry of manifest.fonts) {
      const abs = resolveFontFile(entry.file, opts.manifest, REPO_ROOT);
      let buf = null;
      try {
        buf = readFileSync(abs);
      } catch {
        buf = null;
      }
      let gdiFamily = null;
      let namesError = null;
      if (buf) {
        try {
          gdiFamily = readFontNamesFromBuffer(buf).gdiFamily || null;
        } catch (err) {
          namesError = errMsg(err);
        }
      }
      fonts.push({
        entry,
        abs,
        fileExists: buf !== null,
        sha256: buf ? createHash("sha256").update(buf).digest("hex") : null,
        gdiFamily,
        namesError,
      });
    }
    try {
      registry = { values: await readHkcuFontValues(), error: null };
    } catch (err) {
      registry = { values: null, error: "reg.exe query failed", detail: errMsg(err) };
    }
    if (opts.session) {
      try {
        session = { families: await listSessionFamilies(), error: null, skipped: false };
      } catch (err) {
        session = { families: null, error: "enumeration failed", skipped: false, detail: errMsg(err) };
      }
    }
  }

  const { readiness, details } = evaluateReadiness({
    checkedAt: new Date().toISOString(),
    required: { schema: SCHEMA, sofficeVersion: SOFFICE_VERSION },
    manifestPath: opts.manifest,
    manifest: manifestFacts,
    soffice,
    chromiumFound: existsSync(chromiumPath),
    fonts,
    registry,
    session,
  });

  process.stdout.write(`${JSON.stringify(readiness, null, 2)}\n`);
  for (const e of readiness.errors) process.stderr.write(`TIDAK SIAP: ${e}\n`);
  for (const d of details) process.stderr.write(`  rincian: ${d}\n`);
  process.exit(readiness.ready ? EXIT.READY : EXIT.NOT_READY);
}

main().catch((err) => {
  process.stderr.write(`GAGAL: ${err?.stack ?? err}\n`);
  process.exit(EXIT.NOT_READY);
});
