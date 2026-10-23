#!/usr/bin/env node
// Penyusun render-env/manifest.json (S91) dari lingkungan TERPASANG (konfigurasi B,
// research/05). Hanya membaca soffice, berkas fon, dan HKCU; menulis satu berkas: manifest.
// Pakai: node render-env/build_manifest.mjs [--calibration <json>] [--out <manifest.json>]
//   --calibration  keluaran calibrate.mjs (default render-env/out/calibration.json)
// Exit: 0 manifest tertulis, 1 lingkungan tidak lengkap, 2 salah pakai.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  CHROMIUM_REVISION,
  CHROMIUM_VERSION,
  DEFAULT_CHROMIUM_PATH,
  DEFAULT_SOFFICE_PATH,
  EXIT,
  MANIFEST_PATH,
  OUT_DIR,
  SCHEMA,
  SOFFICE_VERSION,
  USER_FONT_DIR,
  readFontNames,
  readHkcuFonts,
  registryPointsTo,
  sha256File,
  sofficeVersion,
} from "./lib.mjs";

// Fon konfigurasi B. 16 Plex = isi datum-revl/assets/fonts (PASANG-DULU.txt); DejaVuSans dan
// Inter-Regular per research/05:18; empat wajah Bold lama ikut wajib karena konfigurasi B
// bergantung padanya (tanpa Bold = konfigurasi C, 98/102 teks, SSIM 0,9706; research/05:33).
const FONT_FILES = [
  "IBMPlexMono-Italic.ttf",
  "IBMPlexMono-Regular.ttf",
  "IBMPlexMono-SemiBold.ttf",
  "IBMPlexMono-SemiBoldItalic.ttf",
  "IBMPlexSans-Italic.ttf",
  "IBMPlexSans-Regular.ttf",
  "IBMPlexSans-SemiBold.ttf",
  "IBMPlexSans-SemiBoldItalic.ttf",
  "IBMPlexSansCond-Italic.ttf",
  "IBMPlexSansCond-Regular.ttf",
  "IBMPlexSansCond-SemiBold.ttf",
  "IBMPlexSansCond-SemiBoldItalic.ttf",
  "IBMPlexSerif-Italic.ttf",
  "IBMPlexSerif-Regular.ttf",
  "IBMPlexSerif-SemiBold.ttf",
  "IBMPlexSerif-SemiBoldItalic.ttf",
  "DejaVuSans.ttf",
  "Inter-Regular.ttf",
  "IBMPlexMono-Bold.ttf",
  "IBMPlexSerif-Bold.ttf",
  "IBMPlexSerif-BoldItalic.ttf",
  "IBMPlexSansCondensed-Bold.ttf",
];

function usage(msg) {
  process.stderr.write(`${msg}\nPakai: node render-env/build_manifest.mjs [--calibration <json>] [--out <manifest.json>]\n`);
  process.exit(EXIT.USAGE);
}

function parseArgs(argv) {
  const o = { calibration: path.join(OUT_DIR, "calibration.json"), out: MANIFEST_PATH };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage("Menyusun manifest render-env dari lingkungan terpasang.");
    else if (a === "--calibration" || a === "--out") {
      if (!argv[i + 1]) usage(`${a} butuh nilai`);
      o[a.slice(2)] = path.resolve(argv[++i]);
    } else usage(`argumen tidak dikenal: ${a}`);
  }
  return o;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const errors = [];

  const sofficePath = process.env.SOFFICE_PATH || DEFAULT_SOFFICE_PATH;
  const sv = await sofficeVersion(sofficePath);
  if (!sv.found) errors.push(`soffice tidak ada: ${sofficePath}`);
  else if (sv.version !== SOFFICE_VERSION) errors.push(`versi soffice ${sv.version ?? "?"} != ${SOFFICE_VERSION}`);

  const chromiumPath = process.env.STUDIO_CHROMIUM_PATH || DEFAULT_CHROMIUM_PATH;
  if (!existsSync(chromiumPath)) errors.push(`chromium tidak ada: ${chromiumPath}`);

  const reg = await readHkcuFonts();
  const fonts = [];
  for (const name of FONT_FILES) {
    const file = path.win32.join(USER_FONT_DIR, name);
    if (!existsSync(file)) {
      errors.push(`fon tidak ada: ${file}`);
      continue;
    }
    const valueNames = [...reg].filter(([, data]) => registryPointsTo(data, file)).map(([k]) => k);
    if (valueNames.length !== 1) {
      errors.push(`fon ${name}: ${valueNames.length} nilai HKCU menunjuk berkas ini (harus 1): ${valueNames.join("; ")}`);
      continue;
    }
    const n = readFontNames(file);
    fonts.push({
      family: n.family,
      style: n.style,
      file,
      sha256: sha256File(file),
      hkcuValueName: valueNames[0],
      required: true,
    });
  }

  if (!existsSync(opts.calibration)) errors.push(`hasil kalibrasi tidak ada: ${opts.calibration} (jalankan calibrate.mjs dulu)`);
  if (errors.length) {
    for (const e of errors) process.stderr.write(`GAGAL: ${e}\n`);
    process.exit(EXIT.FAIL);
  }
  const cal = JSON.parse(readFileSync(opts.calibration, "utf8"));

  const manifest = {
    schema: SCHEMA,
    config: "B",
    createdAt: new Date().toISOString(),
    soffice: { path: sofficePath, version: SOFFICE_VERSION },
    chromium: { executablePath: chromiumPath, revision: CHROMIUM_REVISION, version: CHROMIUM_VERSION },
    fonts,
    calibration: {
      pages: cal.nodePages,
      textIdenticalPages: cal.textIdenticalPages,
      ssimMean: cal.ssimMean,
      pagesSsimGe098: cal.pagesSsimGe098,
      at: cal.at,
    },
  };
  writeFileSync(opts.out, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`manifest tertulis: ${opts.out} (${fonts.length} fon, soffice ${sv.version})\n`);
}

main().catch((err) => {
  process.stderr.write(`GAGAL: ${err?.stack ?? err}\n`);
  process.exit(EXIT.FAIL);
});
