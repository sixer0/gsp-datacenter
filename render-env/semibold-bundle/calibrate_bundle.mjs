#!/usr/bin/env node
// Kalibrasi kandidat bundel SemiBold (S99, F-001): BM.docx -> (persiapan per kandidat) -> soffice
// (profil sementara, batas waktu, tree-kill) -> bandingkan ke BM.pdf (render-env/compare_cal.py).
// Tidak menulis HKCU, tidak memasang fon, tidak memanggil AddFontResource; profil default LO tidak dipakai.
//
// Pakai: node render-env/semibold-bundle/calibrate_bundle.mjs --candidate <id> [--keep-pdf] [--timeout-ms n] [--ui-sans "<daftar fon>"]
// Kandidat:
//   baseline        konfigurasi B apa adanya (pembanding)
//   profile-fonts   bundel `same` di <UserInstallation>/user/fonts/ (hipotesis folder fon profil)
//   brand-shadow    bundel `same` di share/fonts/truetype milik pohon bayangan BRAND_BASE_DIR
//                   (junction ke instalasi LO; LO memuatnya privat per proses) via -env:BRAND_BASE_DIR
//   docx-embed      salinan DOCX dengan fon tertanam Plex diganti wajah bundel `same`
//   docx-embed-graft  seperti docx-embed dengan set `graft` (glif fallback U+2502, U+03C6, U+221A di Plex Serif Regular)
//   docx-embed-symfix seperti docx-embed dengan set `symfix` + "OpenSymbol" tertanam (U+2502 = glif DejaVu Sans)
//   rename-shadow   salinan DOCX dengan nama fon `S99 <keluarga>` + bundel `renamed` lewat pohon bayangan
//   rename-embed    salinan DOCX dengan nama fon `S99 <keluarga>` + bundel `renamed` tertanam
// Opsi --ui-sans "<daftar>": profil per job diisi registrymodifications.xcu yang menimpa
//   VCL DefaultFonts['en']/UI_SANS (urutan fallback glif pertama LO di Windows); keluaran diberi akhiran +uisans-<slug>.
// Keluaran: out/<kandidat>.json (+ out/<kandidat>.pdf bila --keep-pdf). Exit 0 hasil tertulis, 1 galat, 2 salah pakai.
import {
  copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync,
  symlinkSync, unlinkSync, writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_PYTHON, DEFAULT_SOFFICE_PATH, RENDER_ENV_DIR, run } from "../lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const BM_DIR = "C:\\Users\\TRIAL\\workspace\\Manual DATUM GSP";
const BM_BASE = "Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA";
const CANDIDATES = ["baseline", "profile-fonts", "brand-shadow", "docx-embed", "docx-embed-graft", "docx-embed-symfix", "rename-shadow", "rename-embed"];
const PY = process.env.STUDIO_RENDER_ENV_PYTHON || DEFAULT_PYTHON;

function usage(msg, code = 2) {
  process.stderr.write(`${msg}\nPakai: node calibrate_bundle.mjs --candidate <${CANDIDATES.join("|")}> [--keep-pdf] [--timeout-ms n]\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const o = { candidate: null, keepPdf: false, timeoutMs: 400000, uiSans: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === "--help" || a === "-h") usage("Kalibrasi kandidat bundel SemiBold (S99).", 0);
    else if (a === "--candidate" && CANDIDATES.includes(v)) { o.candidate = v; i++; }
    else if (a === "--keep-pdf") o.keepPdf = true;
    else if (a === "--ui-sans" && /^[A-Za-z0-9 ;-]{1,200}$/.test(v ?? "")) { o.uiSans = v; i++; }
    else if (a === "--timeout-ms" && /^\d+$/.test(v ?? "")) { o.timeoutMs = Number(v); i++; }
    else usage(`argumen tidak dikenal atau tanpa nilai sah: ${a}`);
  }
  if (!o.candidate) usage("--candidate wajib");
  return o;
}

async function py(args, timeoutMs = 600000) {
  const r = await run(PY, ["-I", "-B", ...args], { timeoutMs, cwd: OUT });
  if (r.code !== 0) throw new Error(`python ${path.basename(args[0])} gagal (exit ${r.code}${r.timedOut ? ", timeout" : ""}): ${r.stderr.slice(-2048)}`);
  return r.stdout;
}

/** Pohon bayangan BRAND_BASE_DIR: junction ke setiap entri instalasi LO, share/ nyata berisi junction + fonts/truetype. */
function buildShadow(root, sofficePath, fontDir) {
  const lo = path.resolve(path.dirname(sofficePath), "..");
  const shadow = path.join(root, "lo-brand");
  mkdirSync(path.join(shadow, "share", "fonts", "truetype"), { recursive: true });
  for (const e of readdirSync(lo, { withFileTypes: true })) {
    if (e.name === "share") continue;
    const src = path.join(lo, e.name);
    if (e.isDirectory()) symlinkSync(src, path.join(shadow, e.name), "junction");
    else copyFileSync(src, path.join(shadow, e.name));
  }
  for (const e of readdirSync(path.join(lo, "share"), { withFileTypes: true })) {
    const src = path.join(lo, "share", e.name);
    if (e.name === "fonts") continue;
    if (e.isDirectory()) symlinkSync(src, path.join(shadow, "share", e.name), "junction");
    else copyFileSync(src, path.join(shadow, "share", e.name));
  }
  for (const f of readdirSync(fontDir)) copyFileSync(path.join(fontDir, f), path.join(shadow, "share", "fonts", "truetype", f));
  return shadow;
}

function xcuUiSans(value) {
  const esc = value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<item oor:path="/org.openoffice.VCL/DefaultFonts/org.openoffice.VCL:LocalizedDefaultFonts['en']"><prop oor:name="UI_SANS" oor:op="fuse"><value>${esc}</value></prop></item>
</oor:items>
`;
}

function unlinkJunctions(shadow) {
  for (const dir of [shadow, path.join(shadow, "share")]) {
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir)) {
      const p = path.join(dir, e);
      if (lstatSync(p).isSymbolicLink()) unlinkSync(p);
    }
  }
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const docx = path.join(BM_DIR, `${BM_BASE}.docx`);
  const refPdf = path.join(BM_DIR, `${BM_BASE}.pdf`);
  for (const f of [docx, refPdf]) if (!existsSync(f)) usage(`berkas tidak ada: ${f}`);
  const soffice = process.env.SOFFICE_PATH || DEFAULT_SOFFICE_PATH;
  const setDir = (s) => path.join(HERE, "fonts", s);
  for (const s of ["same", "renamed", "graft", "symfix"]) if (!existsSync(setDir(s))) usage(`bundel belum dibangun: ${setDir(s)} (jalankan build_bundle.py)`);
  mkdirSync(OUT, { recursive: true });

  const root = mkdtempSync(path.join(os.tmpdir(), "s99-"));
  const t0 = Date.now();
  const tag = o.uiSans ? `${o.candidate}+uisans-${o.uiSans.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` : o.candidate;
  const meta = { candidate: tag, soffice, uiSans: o.uiSans };
  try {
    const inDir = path.join(root, "in");
    const outDir = path.join(root, "out");
    mkdirSync(inDir);
    mkdirSync(outDir);
    const inFile = path.join(inDir, "bm.docx");
    const profileDir = path.join(root, "lo-profile");
    const extra = [];
    const c = o.candidate;
    if (c.startsWith("docx-embed") || c === "rename-shadow" || c === "rename-embed") {
      const mode = c.startsWith("docx-embed") ? "embed" : c === "rename-shadow" ? "rename" : "rename-embed";
      const set = { "docx-embed": "same", "docx-embed-graft": "graft", "docx-embed-symfix": "symfix" }[c] ?? "renamed";
      const extraFonts = c === "docx-embed-symfix" ? ["--extra-font", `OpenSymbol=${path.join(setDir(set), "OpenSymbol.ttf")}`] : [];
      meta.prep = JSON.parse(await py([path.join(HERE, "bundle_tools.py"), "prep-docx", "--in", docx, "--out", inFile, "--mode", mode, "--set-dir", setDir(set), ...extraFonts]));
    } else copyFileSync(docx, inFile);
    if (o.uiSans) {
      // Profil per job: fallback glif Windows (WinGlyphFallbackSubstititution) mencoba UI_SANS lokal dulu
      // (VCL.xcu DefaultFonts); ditimpa lewat lapisan user registrymodifications.xcu, bukan registri Windows.
      mkdirSync(path.join(profileDir, "user"), { recursive: true });
      writeFileSync(path.join(profileDir, "user", "registrymodifications.xcu"), xcuUiSans(o.uiSans));
    }
    if (c === "profile-fonts") cpSync(setDir("same"), path.join(profileDir, "user", "fonts"), { recursive: true });
    if (c === "brand-shadow" || c === "rename-shadow") {
      const shadow = buildShadow(root, soffice, setDir(c === "brand-shadow" ? "same" : "renamed"));
      extra.push(`-env:BRAND_BASE_DIR=${pathToFileURL(shadow).href}`);
      meta.brandBaseDir = shadow;
    }
    const args = ["--headless", "--norestore", "--nologo", "--nodefault", "--nolockcheck",
      `-env:UserInstallation=${pathToFileURL(profileDir).href}`, ...extra,
      "--convert-to", "pdf", "--outdir", outDir, inFile];
    const r = await run(soffice, args, { timeoutMs: o.timeoutMs });
    const pdf = path.join(outDir, "bm.pdf");
    if (r.timedOut) throw new Error(`soffice melewati batas waktu ${o.timeoutMs} ms (tree-kill dijalankan)`);
    const ok = r.code === 0 && existsSync(pdf) && statSync(pdf).size > 0 && readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-";
    if (!ok) throw new Error(`konversi soffice gagal (exit ${r.code}): ${r.stderr.slice(-2048)}`);
    meta.convertSeconds = (Date.now() - t0) / 1000;

    const outJson = path.join(OUT, `${tag}.json`);
    process.stdout.write(await py([path.join(RENDER_ENV_DIR, "compare_cal.py"), "--ref", refPdf, "--pdf", pdf, "--out", outJson]));
    const pdfFonts = JSON.parse(await py([path.join(HERE, "bundle_tools.py"), "pdf-fonts", "--pdf", pdf]));
    if (o.keepPdf) copyFileSync(pdf, path.join(OUT, `${tag}.pdf`));
    const cal = JSON.parse(readFileSync(outJson, "utf8"));
    const summary = {
      ...meta,
      pages: cal.nodePages,
      textIdenticalPages: cal.textIdenticalPages,
      ssimMean: cal.ssimMean,
      ssimMin: cal.ssimMin,
      pagesSsimGe098: cal.pagesSsimGe098,
      textMismatchPages: cal.textMismatchPages,
      pdfFonts: pdfFonts.map((f) => f.name),
    };
    writeFileSync(outJson, JSON.stringify({ summary, ...cal }, null, 2) + "\n");
    process.stdout.write(`${tag}: teks identik ${cal.textIdenticalPages}/${cal.refPages}, SSIM rata ${cal.ssimMean.toFixed(4)} min ${cal.ssimMin.toFixed(4)}, fon PDF ${summary.pdfFonts.join(" ")}\n`);
  } finally {
    // Lepas junction dulu (unlink, tidak mengikuti tautan) agar rmSync tidak pernah menyentuh instalasi LO.
    unlinkJunctions(path.join(root, "lo-brand"));
    rmSync(root, { recursive: true, force: true });
  }
}

main().catch((err) => {
  process.stderr.write(`GAGAL: ${err?.message ?? err}\n`);
  process.exit(1);
});
