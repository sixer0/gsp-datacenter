/**
 * Argumen CLI runner benchmark (S97, H07 `01_specs.md` §11) dan nilai bawaan.
 *
 * FIX-5 (D-118, R03): bawaan = RUN RESMI (figur chart/diagram dirender mesin
 * dari spec S94, tanpa pengganti raster). Raster acuan hanya lewat flag
 * eksplisit dan run-nya berlabel DIAGNOSIS.
 *
 * SR-34: masukan v2 (`doc.v2.json` + `template.v2.json`, dibuat SR-32) menjadi
 * bawaan bila kedua berkas ada; bila belum, runner jatuh ke masukan v1 dengan
 * peringatan eksplisit. `--schema v1|v2` memaksa satu versi; v1 tetap jalan.
 */
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { SchemaVersion } from "./schema";

export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

export const DEFAULT_DOC_V1 = "benchmark/manual000/doc.json";
export const DEFAULT_TEMPLATE_V1 = "benchmark/manual000/template.json";
/** Masukan benchmark v2 (SR-32): konten murni `studio.doc/v2` + `studio.template/v2`. */
export const DEFAULT_DOC_V2 = "benchmark/manual000/doc.v2.json";
export const DEFAULT_TEMPLATE_V2 = "benchmark/manual000/template.v2.json";
/** Nama lama (FIX-5): bawaan v1. */
export const DEFAULT_DOC = DEFAULT_DOC_V1;
export const DEFAULT_TEMPLATE = DEFAULT_TEMPLATE_V1;
export const DEFAULT_FIGURE_INDEX = "benchmark/manual000/figures/index.json";
export const DEFAULT_OUT_PARENT = "benchmark/out";
export const BM_COMPARE = "benchmark/harness/compare/bm_compare.py";
/**
 * Interpreter VENV pembanding (R20): `--python` > env `STUDIO_HARNESS_PYTHON`
 * (satu variabel untuk runner benchmark dan paritas) > nilai bawaan mesin ini.
 */
export const PYTHON_ENV = "STUDIO_HARNESS_PYTHON";
export const DEFAULT_PYTHON = "C:\\Users\\TRIAL\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe";
const BM_DIR = "C:\\Users\\TRIAL\\workspace\\Manual DATUM GSP";
const BM_STEM = "Manual_Komprehensif_DATUM_GSP_000-GSP-STD-X-2026_RevA";
export const DEFAULT_REF_DOCX = path.join(BM_DIR, `${BM_STEM}.docx`);
export const DEFAULT_REF_PDF = path.join(BM_DIR, `${BM_STEM}.pdf`);
/** Batas waktu pembanding Python (BM3/BM4 102 halaman). */
export const DEFAULT_COMPARE_TIMEOUT_MS = 30 * 60 * 1000;
/** Subdirektori run diagnosis raster tambahan (`--with-diagnosis-raster`). */
export const DIAGNOSIS_SUBDIR = "diagnosis_raster";

export type FigureMode = "engine" | "raster";
export type SchemaRequest = "auto" | "v1" | "v2";

/**
 * Pemilihan versi skema masukan (SR-34). `defaults` = versi berkas bawaan yang
 * dipakai untuk `--doc`/`--template` yang tidak diberikan; versi sebenarnya
 * dideteksi dari isi berkas saat dimuat (`lib/schema.ts`).
 */
export interface SchemaSelection {
  requested: SchemaRequest;
  defaults: SchemaVersion;
  docFrom: "arg" | "default";
  templateFrom: "arg" | "default";
  /** Peringatan jatuh ke v1 karena berkas v2 bawaan belum ada (null = tidak jatuh). */
  fallbackWarning: string | null;
}
export type FigureFallback = "raster" | "none";

/**
 * Jenis run (D-118, R03): OFFICIAL = figur chart/diagram/simbol dirender mesin
 * dari spec S94 tanpa pengganti (satu-satunya jenis yang boleh exit 0);
 * DIAGNOSIS_RASTER = semua figur dari raster acuan BM.docx;
 * DIAGNOSIS_FALLBACK = mesin, dengan raster acuan sebagai pengganti figur gagal.
 */
export type RunKind = "OFFICIAL" | "DIAGNOSIS_RASTER" | "DIAGNOSIS_FALLBACK";

export const RUN_KIND_LABEL: Record<RunKind, string> = {
  OFFICIAL: "RESMI (chart/diagram dirender mesin dari spec S94, lembar simbol dari mesin, foto/logo/ilustrasi dari raster aset)",
  DIAGNOSIS_RASTER: "DIAGNOSIS (raster acuan)",
  DIAGNOSIS_FALLBACK: "DIAGNOSIS (raster acuan sebagai pengganti figur mesin yang gagal)",
};

export function runKindOf(figures: FigureMode, fallback: FigureFallback): RunKind {
  if (figures === "raster") return "DIAGNOSIS_RASTER";
  return fallback === "raster" ? "DIAGNOSIS_FALLBACK" : "OFFICIAL";
}

export interface RunConfig {
  doc: string;
  template: string;
  schema: SchemaSelection;
  figureIndex: string;
  out: string;
  runId: string;
  refDocx: string;
  refPdf: string;
  python: string;
  /** Asal nilai `python`: argumen, env STUDIO_HARNESS_PYTHON, atau bawaan. */
  pythonSource: "arg" | "env" | "default";
  figurePages: string | null;
  figures: FigureMode;
  figureFallback: FigureFallback;
  runKind: RunKind;
  /** Run diagnosis raster tambahan di `<out>/diagnosis_raster` (hanya run resmi). */
  withDiagnosisRaster: boolean;
  skipPdf: boolean;
  skipCompare: boolean;
  compareTimeoutMs: number;
  dryRun: boolean;
  json: boolean;
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export const HELP = `run_benchmark.ts (S97, H07; FIX-5; SR-34) - runner benchmark Manual DATUM 000 tanpa DB

Pemakaian:
  npx tsx benchmark/harness/run/run_benchmark.ts [--schema auto|v1|v2] [--doc <doc>] [--template <template>]
      [--out benchmark/out/<run-id>] [opsi]

Alur: muat doc.json + profil templat (loadResolvedProfileFile, tanpa DB) + indeks figur S94
(sha256 diverifikasi) -> ingest/normalisasi dry-run mode laporan (D-55: penahan blocksIngest
diturunkan) -> templat + override dokumen (templateForDoc/applyDocOverrides layanan render)
-> figur lewat buildFigures layanan render (chart/diagram dari spec S94, lembar simbol) ->
PNG 300 dpi, raster dari aset -> DOCX (mesin Node) -> PDF (layanan soffice S92, profil per
job) -> lint pasca-render (lintAfterRender layanan render) -> bm_compare.py (S96, H06) ->
run_summary.json + run_report.md (vonis D-17 per kriteria, per halaman, per paragraf, per
figur dengan sumber/spec/ukuran mm, modul NOT_READY).

Mode run (D-118, R03):
  (bawaan) / --official     RUN RESMI: chart/diagram dirender mesin dari spec S94, lembar simbol
                            dari mesin, foto/logo/ilustrasi dari raster aset; tanpa pengganti.
                            Figur mesin gagal = vonis FAIL, exit 1. Hanya run resmi yang boleh
                            exit 0.
  --diagnosis-raster        DIAGNOSIS (raster acuan): semua figur memakai media asli BM.docx
                            (= --figures raster). Vonis paling tinggi PASS-DEGRADED, exit 1.
  --with-diagnosis-raster   setelah run resmi, jalankan juga run diagnosis raster terpisah di
                            <out>/${DIAGNOSIS_SUBDIR}; angkanya disajikan TERPISAH di laporan dan
                            tidak memengaruhi vonis/exit run resmi
  --figures engine|raster   bentuk lama: engine (bawaan) atau raster (= --diagnosis-raster)
  --figure-fallback none|raster
                            none (bawaan): figur mesin gagal = figur hilang, vonis FAIL;
                            raster: DIAGNOSIS, figur gagal diganti raster acuan
                            (FALLBACK_RASTER), vonis paling tinggi PASS-DEGRADED, exit 1

Skema masukan (SR-34):
  --schema auto|v1|v2       auto (bawaan): masukan v2 (${DEFAULT_DOC_V2} +
                            ${DEFAULT_TEMPLATE_V2}) bila KEDUA berkas ada; bila belum,
                            jatuh ke masukan v1 (${DEFAULT_DOC_V1} +
                            ${DEFAULT_TEMPLATE_V1}) dengan PERINGATAN.
                            v2: paksa v2 (berkas bawaan v2 wajib ada; isi doc harus studio.doc/v2).
                            v1: paksa v1 (jalur lama, tetap didukung).
                            Versi skema doc dan templat yang dipakai dicatat di run_summary.json
                            (medan inputSchema) dan run_report.md.
  --doc <path>              dokumen studio.doc/v1 atau studio.doc/v2 (bawaan menurut --schema)
  --template <path>         templat: profil v1 (S95) atau studio.template/v2 (bawaan menurut --schema)
                            Seam v2 yang belum ada (skema studio.doc/v2 SR-04/SR-12, pemuat templat
                            v2 SR-07) = langkah ingest NOT_READY, exit 1.

Opsi:
  --figure-index <path>     indeks figur S94 (bawaan ${DEFAULT_FIGURE_INDEX})
  --out <dir>               direktori run (bawaan ${DEFAULT_OUT_PARENT}/<run-id>); harus baru atau kosong
  --run-id <id>             id run [A-Za-z0-9_-] (bawaan bm-<UTC stamp>-<acak>)
  --ref-docx <path>         BM.docx acuan (bawaan folder Manual DATUM GSP)
  --ref-pdf <path>          BM.pdf acuan
  --python <path>           interpreter VENV untuk bm_compare.py (dijalankan -I -B);
                            bawaan env ${PYTHON_ENV}, lalu VENV hermes
  --figure-pages <list>     halaman diagnosis figur (bawaan bigPages indeks S94)
  --skip-pdf                lewati konversi PDF (pembanding mode parsial)
  --skip-compare            lewati bm_compare.py
  --compare-timeout-ms <n>  batas waktu pembanding (bawaan ${DEFAULT_COMPARE_TIMEOUT_MS})
  --dry-run                 hanya muat masukan, verifikasi sha256 aset, cetak rencana langkah dan
                            sumber tiap figur; tidak menulis berkas apa pun
  --json                    cetak ringkasan JSON ke stdout
  -h, --help                bantuan ini

Vonis: PASS | PASS-DEGRADED (kriteria lulus, tetapi ada figur chart/diagram/simbol dari
raster acuan) | FAIL (kriteria gagal, atau figur mesin hilang) | INCOMPLETE.
Exit: 0 hanya run RESMI dengan vonis PASS; 1 PASS-DEGRADED / tidak lulus / tidak lengkap
      (termasuk langkah NOT_READY) / run diagnosis; 2 salah pakai atau masukan tidak terbaca.`;

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

const RUN_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

/** Parse argv. Mengembalikan null bila `--help` (pemanggil mencetak HELP, exit 0). */
export function parseConfig(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = process.env,
  exists: (absPath: string) => boolean = existsSync,
): RunConfig | null {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: false,
      strict: true,
      options: {
        schema: { type: "string" },
        doc: { type: "string" },
        template: { type: "string" },
        "figure-index": { type: "string" },
        out: { type: "string" },
        "run-id": { type: "string" },
        "ref-docx": { type: "string" },
        "ref-pdf": { type: "string" },
        python: { type: "string" },
        "figure-pages": { type: "string" },
        figures: { type: "string" },
        "figure-fallback": { type: "string" },
        official: { type: "boolean" },
        "diagnosis-raster": { type: "boolean" },
        "with-diagnosis-raster": { type: "boolean" },
        "skip-pdf": { type: "boolean" },
        "skip-compare": { type: "boolean" },
        "compare-timeout-ms": { type: "string" },
        "dry-run": { type: "boolean" },
        json: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (e) {
    throw new UsageError(e instanceof Error ? e.message : String(e));
  }
  const v = parsed.values as Record<string, string | boolean | undefined>;
  if (v.help) return null;
  const str = (k: string): string | undefined => (typeof v[k] === "string" ? (v[k] as string) : undefined);
  const abs = (p: string) => path.resolve(REPO_ROOT, p);

  const runId = str("run-id") ?? `bm-${stamp(new Date())}-${randomBytes(3).toString("hex")}`;
  if (!RUN_ID_RE.test(runId)) throw new UsageError(`--run-id harus cocok [A-Za-z0-9_-]{1,80}: ${runId}`);

  const official = v.official === true;
  const diagRaster = v["diagnosis-raster"] === true;
  if (official && diagRaster) throw new UsageError("--official dan --diagnosis-raster tidak boleh bersamaan");
  const figures = str("figures") ?? (diagRaster ? "raster" : "engine");
  if (figures !== "engine" && figures !== "raster") throw new UsageError(`--figures harus engine|raster, bukan ${figures}`);
  if (diagRaster && figures !== "raster") throw new UsageError("--diagnosis-raster bertentangan dengan --figures engine");
  // Bawaan baru (D-118): tanpa pengganti raster; pengganti hanya lewat flag eksplisit.
  const fallback = str("figure-fallback") ?? "none";
  if (fallback !== "raster" && fallback !== "none") throw new UsageError(`--figure-fallback harus none|raster, bukan ${fallback}`);
  const runKind = runKindOf(figures, fallback);
  if (official && runKind !== "OFFICIAL") throw new UsageError("--official menuntut --figures engine --figure-fallback none (run resmi D-118)");
  const withDiag = v["with-diagnosis-raster"] === true;
  if (withDiag && runKind !== "OFFICIAL") throw new UsageError("--with-diagnosis-raster hanya untuk run resmi");

  const pages = str("figure-pages") ?? null;
  if (pages !== null && !/^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/.test(pages)) {
    throw new UsageError(`--figure-pages tidak sah: ${pages} (contoh 9,12,54-61)`);
  }
  let timeout = DEFAULT_COMPARE_TIMEOUT_MS;
  const t = str("compare-timeout-ms");
  if (t !== undefined) {
    timeout = Number(t);
    if (!Number.isInteger(timeout) || timeout < 1000) throw new UsageError(`--compare-timeout-ms harus bilangan bulat >= 1000: ${t}`);
  }
  const schema = selectSchema(str("schema"), str("doc"), str("template"), abs, exists);
  const pyArg = str("python");
  const pyEnv = env[PYTHON_ENV]?.trim() || undefined;

  return {
    doc: abs(str("doc") ?? (schema.defaults === "v2" ? DEFAULT_DOC_V2 : DEFAULT_DOC_V1)),
    template: abs(str("template") ?? (schema.defaults === "v2" ? DEFAULT_TEMPLATE_V2 : DEFAULT_TEMPLATE_V1)),
    schema,
    figureIndex: abs(str("figure-index") ?? DEFAULT_FIGURE_INDEX),
    out: abs(str("out") ?? path.join(DEFAULT_OUT_PARENT, runId)),
    runId,
    refDocx: path.resolve(str("ref-docx") ?? DEFAULT_REF_DOCX),
    refPdf: path.resolve(str("ref-pdf") ?? DEFAULT_REF_PDF),
    python: path.resolve(pyArg ?? pyEnv ?? DEFAULT_PYTHON),
    pythonSource: pyArg ? "arg" : pyEnv ? "env" : "default",
    figurePages: pages,
    figures,
    figureFallback: fallback,
    runKind,
    withDiagnosisRaster: withDiag,
    skipPdf: v["skip-pdf"] === true,
    skipCompare: v["skip-compare"] === true,
    compareTimeoutMs: timeout,
    dryRun: v["dry-run"] === true,
    json: v.json === true,
  };
}

/**
 * Pilih versi berkas bawaan (SR-34). auto: v2 bila kedua berkas bawaan v2 ada,
 * selain itu v1 dengan peringatan (hanya bila ada berkas bawaan yang dipakai).
 * v2 eksplisit: berkas bawaan v2 yang dipakai wajib ada (UsageError, exit 2).
 */
function selectSchema(
  req: string | undefined,
  docArg: string | undefined,
  tplArg: string | undefined,
  abs: (p: string) => string,
  exists: (absPath: string) => boolean,
): SchemaSelection {
  const requested = req ?? "auto";
  if (requested !== "auto" && requested !== "v1" && requested !== "v2") throw new UsageError(`--schema harus auto|v1|v2, bukan ${requested}`);
  const docFrom = docArg ? "arg" : "default";
  const templateFrom = tplArg ? "arg" : "default";
  const base = { requested, docFrom, templateFrom, fallbackWarning: null } as const;
  if (requested === "v1") return { ...base, defaults: "v1" };
  // Berkas bawaan v2 yang benar-benar dipakai (tidak ditimpa --doc/--template).
  const usedV2 = [docArg ? null : DEFAULT_DOC_V2, tplArg ? null : DEFAULT_TEMPLATE_V2].filter((p): p is string => p !== null);
  if (requested === "v2") {
    const missing = usedV2.filter((p) => !exists(abs(p)));
    if (missing.length) {
      throw new UsageError(`--schema v2: berkas v2 bawaan belum ada: ${missing.join(", ")} (dibuat SR-32); berikan --doc/--template v2 atau pakai --schema v1`);
    }
    return { ...base, defaults: "v2" };
  }
  const missingV2 = [DEFAULT_DOC_V2, DEFAULT_TEMPLATE_V2].filter((p) => !exists(abs(p)));
  if (missingV2.length === 0) return { ...base, defaults: "v2" };
  const usedV1 = [docArg ? null : DEFAULT_DOC_V1, tplArg ? null : DEFAULT_TEMPLATE_V1].filter((p): p is string => p !== null);
  const fallbackWarning = usedV1.length
    ? `berkas v2 bawaan belum ada (${missingV2.join(", ")}; dibuat SR-32): JATUH KE MASUKAN v1 (${usedV1.join(", ")}); run ini BUKAN benchmark v2`
    : null;
  return { ...base, defaults: "v1", fallbackWarning };
}

/** Konfigurasi run diagnosis raster turunan run resmi (`--with-diagnosis-raster`). */
export function diagnosisConfig(cfg: RunConfig): RunConfig {
  return {
    ...cfg,
    runId: `${cfg.runId}-diag-raster`.slice(0, 80),
    out: path.join(cfg.out, DIAGNOSIS_SUBDIR),
    figures: "raster",
    figureFallback: "none",
    runKind: "DIAGNOSIS_RASTER",
    withDiagnosisRaster: false,
  };
}

/** Halaman figur "9,12,54-61" dari daftar angka (rentang berurutan dipadatkan). */
export function compactPages(pages: readonly number[]): string {
  const s = [...new Set(pages)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j - i >= 2 ? `${s[i]}-${s[j]}` : s.slice(i, j + 1).join(","));
    i = j + 1;
  }
  return out.join(",");
}
