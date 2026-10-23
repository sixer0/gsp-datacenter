#!/usr/bin/env node
// Kalibrasi ulang render-env (S91): BM.docx -> soffice (profil sementara, batas waktu,
// tree-kill; perintah persis 01_specs.md §8.4) -> render-env/out/bm_config_b.pdf ->
// bandingkan ke BM.pdf dengan compare_cal.py (metode CAL, modul S66).
// Pakai: node render-env/calibrate.mjs [--docx <BM.docx>] [--ref-pdf <BM.pdf>] [--timeout-ms <n>]
// Target (blueprint S91): 102 halaman, >= 101/102 teks identik, SSIM rata-rata >= 0,98.
// Exit 0 target tercapai, 1 tidak tercapai atau galat, 2 salah pakai.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PYTHON, DEFAULT_SOFFICE_PATH, EXIT, OUT_DIR, RENDER_ENV_DIR, run } from "./lib.mjs";

const BM_DIR = "C:\\Users\\TRIAL\\workspace\\Manual DATUM GSP";
const BM_BASE = "Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA";
const TARGET = { pages: 102, textIdenticalPages: 101, ssimMean: 0.98 };

function usage(msg, code = EXIT.USAGE) {
  process.stderr.write(
    `${msg}\nPakai: node render-env/calibrate.mjs [--docx <BM.docx>] [--ref-pdf <BM.pdf>] [--timeout-ms <n>]\n`,
  );
  process.exit(code);
}

function parseArgs(argv) {
  const o = {
    docx: path.join(BM_DIR, `${BM_BASE}.docx`),
    refPdf: path.join(BM_DIR, `${BM_BASE}.pdf`),
    timeoutMs: 300000,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === "--help" || a === "-h") usage("Kalibrasi ulang render-env konfigurasi B.", EXIT.READY);
    else if (a === "--docx" && v) {
      o.docx = path.resolve(v);
      i++;
    } else if (a === "--ref-pdf" && v) {
      o.refPdf = path.resolve(v);
      i++;
    } else if (a === "--timeout-ms" && v && /^\d+$/.test(v)) {
      o.timeoutMs = Number(v);
      i++;
    } else usage(`argumen tidak dikenal atau tanpa nilai sah: ${a}`);
  }
  for (const f of [o.docx, o.refPdf]) if (!existsSync(f)) usage(`berkas tidak ada: ${f}`);
  return o;
}

async function convert(docx, timeoutMs) {
  const soffice = process.env.SOFFICE_PATH || DEFAULT_SOFFICE_PATH;
  const root = mkdtempSync(path.join(os.tmpdir(), "s91-render-env-"));
  const t0 = Date.now();
  try {
    const inDir = path.join(root, "in");
    const outDir = path.join(root, "out");
    mkdirSync(inDir);
    mkdirSync(outDir);
    const inFile = path.join(inDir, "bm.docx");
    copyFileSync(docx, inFile);
    const profile = pathToFileURL(path.join(root, "lo-profile")).href; // file:///C:/...
    const args = [
      "--headless",
      "--norestore",
      "--nologo",
      "--nodefault",
      "--nolockcheck",
      `-env:UserInstallation=${profile}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outDir,
      inFile,
    ];
    const r = await run(soffice, args, { timeoutMs });
    const pdf = path.join(outDir, "bm.pdf");
    if (r.timedOut) throw new Error(`soffice melewati batas waktu ${timeoutMs} ms (tree-kill dijalankan)`);
    const ok = r.code === 0 && existsSync(pdf) && statSync(pdf).size > 0 && readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-";
    if (!ok) throw new Error(`konversi soffice gagal (exit ${r.code}): ${r.stderr.slice(-2048)}`);
    mkdirSync(OUT_DIR, { recursive: true });
    const dest = path.join(OUT_DIR, "bm_config_b.pdf");
    copyFileSync(pdf, dest);
    return { pdf: dest, seconds: (Date.now() - t0) / 1000, soffice };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const conv = await convert(opts.docx, opts.timeoutMs);
  process.stdout.write(`konversi: ${conv.pdf} (${conv.seconds.toFixed(1)} s, ${conv.soffice})\n`);

  const python = process.env.STUDIO_RENDER_ENV_PYTHON || DEFAULT_PYTHON;
  const outJson = path.join(OUT_DIR, "calibration.json");
  const cmp = await run(
    python,
    ["-I", "-B", path.join(RENDER_ENV_DIR, "compare_cal.py"), "--ref", opts.refPdf, "--pdf", conv.pdf, "--out", outJson],
    { timeoutMs: 600000, cwd: OUT_DIR },
  );
  if (cmp.code !== 0) throw new Error(`compare_cal.py gagal (exit ${cmp.code}${cmp.timedOut ? ", timeout" : ""}): ${cmp.stderr.slice(-2048)}`);
  process.stdout.write(cmp.stdout);

  const cal = JSON.parse(readFileSync(outJson, "utf8"));
  const checks = [
    [`halaman lokal = ${TARGET.pages}`, cal.nodePages === TARGET.pages && cal.refPages === TARGET.pages, `${cal.nodePages}/${cal.refPages}`],
    [`teks identik >= ${TARGET.textIdenticalPages}/${TARGET.pages}`, cal.textIdenticalPages >= TARGET.textIdenticalPages, `${cal.textIdenticalPages}`],
    [`SSIM rata-rata >= ${TARGET.ssimMean}`, cal.ssimMean >= TARGET.ssimMean, cal.ssimMean.toFixed(4)],
  ];
  for (const [name, pass, val] of checks) process.stdout.write(`${pass ? "LULUS" : "GAGAL"} ${name}: ${val}\n`);
  process.stdout.write(`teks berbeda di halaman: ${cal.textMismatchPages.join(", ") || "-"}\n`);
  process.stdout.write(`halaman SSIM < 0,98: ${cal.lowSsimPages.length}; hasil: ${outJson}\n`);
  process.exit(checks.every((c) => c[1]) ? EXIT.READY : EXIT.FAIL);
}

main().catch((err) => {
  process.stderr.write(`GAGAL: ${err?.message ?? err}\n`);
  process.exit(EXIT.FAIL);
});
