/**
 * H01 - CLI render Node tanpa DB (S67; masterplan/01_specs.md §11; v2 SR-33,
 * register 03 §15.1).
 *
 *   npx tsx scripts/parity/run/render_cli.ts --doc <doc.json> [--template <template.json|slug>]
 *       --out <dir> [--formats docx,pdf,html,svg,png] [--json]
 *       [--scope document|chapter:<k>|slot:<key>] [--base <doc.v2.json>] [--pid-seed <s>]
 *       [--asset-index <index.json>] [--with-canonical-assets] [--no-validate]
 *
 * Masukan: StudioDocV1, studio.doc/v2, studio.chapter/v2 (bab tunggal, opsional
 * digabung ke --base), spec studio.chart/v1, studio.diagram/v1, studio.image/v1,
 * atau simbol (`{"id":"iec:breaker"}`, `{"sheet":"iec","cols":3}`, atau id langsung).
 * Dokumen dirender lewat orkestrator tanpa DB `renderSnapshot` (IP-43a); v2 lewat
 * compose murni SR-08 dengan pid deterministik dan nilai efektif per slot dari
 * kerangka templat (resolusi murni setara layanan, FIX-C D-245). Lembar simbol
 * membaca `symbol.sheet.fit` dari --template (D-147).
 * Keluaran: `<dir>/<nama DATUM>.<ext>` (+ `<dir>/figur/` untuk SVG/PNG figur
 * dokumen), `<dir>/render_report.json`
 * (`{ files: [{format, path, sha256, bytes}], lint, job: {status, errorCode?}, durationMs, ... }`)
 * dan log JSONL `<dir>/render_log.jsonl`.
 * Exit: 0 sukses, 1 galat render (lint FAIL tidak menggagalkan; modul stub =
 * job NOT_READY), 2 salah pakai, 3 PDF_ENGINE_UNAVAILABLE.
 */
import path from "node:path";
import { errMessage, findRepoRoot, parseArgs, UsageError } from "./lib/common";
import { formatScope, parseScope, renderToDir } from "./lib/render";

const HELP = `Pemakaian:
  npx tsx scripts/parity/run/render_cli.ts --doc <input.json> --out <dir> [opsi]

Opsi:
  --doc <path|id>            studio.doc/v1 | studio.doc/v2 | studio.chapter/v2 | studio.chart|diagram|image/v1
                             | simbol {id|sheet} | id simbol
  --template <path|slug>     berkas profil { base: "datum-kanonik", overrides, roleFormats, sectionPlan },
                             berkas studio.template/v2 (masukan v2), atau slug luring:
                             datum-kanonik, datum-manual-000 (default: kanonik)
  --scope <lingkup>          document (bawaan) | chapter:<kunci> | slot:<slotKey>; selain document = draf
  --base <doc.v2.json>       dokumen studio.doc/v2 tempat kiriman studio.chapter/v2 digabung
  --pid-seed <teks>          benih pid deterministik jalur v2 (bawaan sha256 masukan)
  --out <dir>                direktori keluaran (dibuat bila belum ada)
  --formats <list>           docx,pdf,html,svg,png (default: doc.outputs atau docx,pdf,html; figur svg,png)
  --json                     cetak render_report.json ke stdout
  --asset-index <path>       indeks aset raster (default <dir doc>/figures/index.json bila ada)
  --with-canonical-assets    sertakan aset kanonik src/lib/studio/assets di templat
  --no-validate              lewati validasi skema JSON v1 (isu tidak menahan render)
  --help                     tampilkan bantuan ini

Exit: 0 sukses | 1 galat render (lint FAIL tidak) | 2 salah pakai | 3 PDF_ENGINE_UNAVAILABLE
Tanpa DB: templat dari berkas/slug luring, spec figur inline, aset dari dataBase64/indeks/berkas.`;

async function main(argv: readonly string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }
  let args;
  let scope;
  try {
    args = parseArgs(argv, {
      values: ["doc", "template", "out", "formats", "asset-index", "scope", "base", "pid-seed"],
      flags: ["json", "with-canonical-assets", "no-validate"],
    });
    if (!args.values.get("doc")) throw new UsageError("--doc wajib");
    if (!args.values.get("out")) throw new UsageError("--out wajib");
    scope = parseScope(args.values.get("scope"));
  } catch (err) {
    process.stderr.write(`render_cli: salah pakai: ${errMessage(err)}\n${HELP}\n`);
    return 2;
  }
  const doc = args.values.get("doc") as string;
  const out = path.resolve(args.values.get("out") as string);
  const repoRoot = findRepoRoot();
  const template = args.values.get("template");
  const assetIndex = args.values.get("asset-index");
  // Konstanta env Studio (STUDIO_WORKSPACE_ROOT relatif) diselesaikan dari akar repo.
  const absDoc = /^[a-z]{3}:[a-z0-9_-]+$/i.test(doc) && !doc.includes("/") && !doc.includes("\\") ? doc : path.resolve(doc);
  const absTpl = template && /[\\/.]/.test(template) ? path.resolve(template) : template;
  const absIdx = assetIndex ? path.resolve(assetIndex) : undefined;
  const base = args.values.get("base");
  const absBase = base ? path.resolve(base) : undefined;
  process.chdir(repoRoot);

  const report = await renderToDir({
    input: absDoc,
    outDir: out,
    repoRoot,
    template: absTpl,
    formats: args.values.get("formats")?.split(","),
    assetIndex: absIdx,
    withCanonicalAssets: args.flags.has("with-canonical-assets"),
    validate: !args.flags.has("no-validate"),
    scope,
    base: absBase,
    pidSeed: args.values.get("pid-seed"),
  });
  if (args.flags.has("json")) process.stdout.write(`${JSON.stringify(report, null, 1)}\n`);
  else {
    const files = report.files.map((f) => `${f.format}:${path.basename(f.path)}`).join(", ") || "-";
    process.stdout.write(
      `render_cli: status=${report.job.status} scope=${formatScope(scope)}${report.job.errorCode ? ` (${report.job.errorCode})` : ""} exit=${report.exitCode} ` +
        `lint=${report.lint?.releaseStatus ?? "-"} files=[${files}] report=${path.join(out, "render_report.json")}\n`,
    );
    for (const e of report.errors.slice(0, 10)) process.stderr.write(`  [${e.code}] ${e.message}\n`);
  }
  return report.exitCode;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", source: "parity.render_cli", message: errMessage(err), stack_trace: err instanceof Error ? err.stack : undefined })}\n`);
    process.exitCode = 1;
  });
