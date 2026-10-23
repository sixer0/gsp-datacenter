/**
 * S97 (H07, `01_specs.md` §11): runner benchmark Manual DATUM 000 end-to-end
 * TANPA DB.
 *
 *   npx tsx benchmark/harness/run/run_benchmark.ts --doc benchmark/manual000/doc.json \
 *       --template benchmark/manual000/template.json --out benchmark/out/<run-id>
 *
 * Langkah: muat (doc + profil `loadResolvedProfileFile` + indeks figur S94,
 * sha256 diverifikasi) -> ingest dry-run mode laporan (D-55) -> figur mesin
 * Node (PNG 300 dpi; raster dari aset) -> DOCX -> PDF (soffice S92) ->
 * bm_compare.py (S96) -> run_summary.json + run_report.md. CLI render S67
 * (H01) belum ada saat S97 ditulis, sehingga mesin dipanggil langsung lewat
 * kontrak §8.2 (urutan sama dengan layanan render S51, tanpa Prisma).
 *
 * FIX-5 (D-118, R03/R04/R20): bawaan = RUN RESMI (chart/diagram dirender
 * mesin dari spec S94, tanpa pengganti raster); raster acuan hanya lewat
 * `--diagnosis-raster` / `--figure-fallback raster` dan berlabel DIAGNOSIS;
 * `--with-diagnosis-raster` menambah run diagnosis terpisah. Figur, templat +
 * override, dan lint memakai fungsi layanan `services/render`.
 *
 * SR-34: `--schema auto|v1|v2`; bawaan auto = doc.v2.json + template.v2.json
 * bila keduanya ada, selain itu masukan v1 dengan peringatan. Versi skema doc
 * dan templat dicatat di ringkasan (`inputSchema`) dan laporan.
 *
 * Exit: 0 hanya run resmi ber-PASS D-17; 1 PASS-DEGRADED / tidak lulus / tidak
 * lengkap / NOT_READY / run diagnosis; 2 salah pakai, masukan tidak terbaca,
 * atau galat internal.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  BM_COMPARE,
  HELP,
  PYTHON_ENV,
  REPO_ROOT,
  RUN_KIND_LABEL,
  UsageError,
  compactPages,
  diagnosisConfig,
  parseConfig,
  type RunConfig,
} from "./lib/config";
import { ENGINE_KINDS, loadInputs, repoRel, type LoadedInputs } from "./lib/inputs";
import { newState, runPipeline, type StepRecord } from "./lib/pipeline";
import { buildSummary, inputSchemaOf, writeReports, type DiagnosisSection, type RunSummary } from "./lib/report";
import { RunLog } from "./lib/runlog";

const DEFAULT_FIGURE_PAGES = "9,12,19,35,37,38,40,42,50,51,54-61";
const ENGINE_KIND_SET: ReadonlySet<string> = new Set(ENGINE_KINDS);

function print(s: string): void {
  process.stdout.write(`${s}\n`);
}

/** Rencana langkah (dicetak `--dry-run` dan disimpan di ringkasan). */
function plan(cfg: RunConfig, inputs: LoadedInputs, figurePages: string): Array<{ step: StepRecord["id"]; action: string }> {
  const sub = inputs.substitutions.filter((s) => s.status === "SUBSTITUTED").length;
  return [
    {
      step: "ingest",
      action: inputs.notReady.length
        ? `NOT_READY (${inputs.schema.doc} + ${inputs.schema.template}): ${inputs.notReady.map((n) => `${n.message} (${n.owner})`).join("; ")}`
        : `ingestDocument dryRun ${inputs.schema.doc}, enforcement=report (D-55), templat ${inputs.schema.template} ${inputs.templateInfo.file} di memori, aset dari ${repoRel(cfg.figureIndex)}`,
    },
    {
      step: "figures",
      action: `[${cfg.runKind}] templateForDoc (applyDocOverrides) + preloadAssetBytes; buildFigures layanan render: ${sub} figur mesin (chart/diagram dari spec S94, lembar simbol dari dialek) -> SVG -> PNG 300 dpi; figur lain raster dari aset; figur mesin gagal: ${cfg.figureFallback === "raster" ? "raster acuan (DIAGNOSIS, maks PASS-DEGRADED)" : "hilang (vonis FAIL)"}`,
    },
    { step: "docx", action: `assembleDocx (S20, RenderContext layanan: templat ber-override + assetBytes) -> ${repoRel(cfg.out)}/<nama DATUM>.docx` },
    { step: "pdf", action: cfg.skipPdf ? "dilewati (--skip-pdf)" : `checkRenderEnvReadiness + convertDocxToPdf (S92, jobId ${cfg.runId})` },
    { step: "lint", action: "lintAfterRender layanan render (tier meta.tier, SVG mesin + cek tambahan; tanpa HTML; tidak menahan berkas)" },
    {
      step: "compare",
      action: cfg.skipCompare
        ? "dilewati (--skip-compare)"
        : `${cfg.python} -I -B ${BM_COMPARE} --docx --pdf --ref-docx <BM.docx> --ref-pdf <BM.pdf> --out ${repoRel(cfg.out)}/compare --figure-pages ${figurePages}`,
    },
    { step: "report", action: `${repoRel(cfg.out)}/run_summary.json + run_report.md + run_log.jsonl` },
    ...(cfg.withDiagnosisRaster ? [{ step: "report" as const, action: `run diagnosis raster terpisah -> ${repoRel(diagnosisConfig(cfg).out)} (seksi laporan terpisah, tidak memengaruhi vonis)` }] : []),
  ];
}

/** Kode chart per figur mesin (spec tunggal atau panel komposit). */
function chartCodesByFigure(doc: unknown): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!isRec(n)) return;
    if (n.type === "chart" && isRec(n.spec)) {
      const spec = n.spec;
      const x = isRec(n.x) && isRec(n.x.benchmarkFigure) ? String(n.x.benchmarkFigure.id) : String(spec.id ?? "?");
      const panels = isRec(spec.composite) && Array.isArray(spec.composite.panels) ? spec.composite.panels : [];
      const codes = spec.kind === "composite" ? panels.map((p) => (isRec(p) && isRec(p.spec) ? String(p.spec.kind) : "?")) : [String(spec.kind)];
      out.set(x, codes);
      return;
    }
    for (const [k, v] of Object.entries(n)) if (k !== "x" && k !== "assets" && v !== null && typeof v === "object") walk(v);
  };
  walk(doc);
  return out;
}

async function preflight(cfg: RunConfig, inputs: LoadedInputs): Promise<Record<string, unknown>> {
  const { getStudioEnv } = await import("../../../src/lib/studio/contract/env");
  const env = getStudioEnv();
  const files: Record<string, { path: string; exists: boolean }> = {};
  const add = (k: string, p: string) => (files[k] = { path: p, exists: existsSync(p) });
  add("python", cfg.python);
  add("bmCompare", path.join(REPO_ROOT, BM_COMPARE));
  add("refDocx", cfg.refDocx);
  add("refPdf", cfg.refPdf);
  add("soffice", env.sofficePath);
  add("renderEnvManifest", env.renderEnvManifestPath);
  add("chromium", env.chromiumPath);
  let coverage: unknown = null;
  // Figur chart yang panelnya memakai renderer keluarga belum terisi -> NOT_READY saat run.
  const expectedNotReady: Array<{ figure: string; missing: string[] }> = [];
  try {
    const { dispatchCoverage } = await import("../../../src/lib/studio/contract/dispatch");
    const cov = dispatchCoverage();
    coverage = cov;
    const missing = new Set(cov.charts);
    for (const [figure, codes] of chartCodesByFigure(inputs.doc)) {
      const m = codes.filter((c) => missing.has(c));
      if (m.length) expectedNotReady.push({ figure, missing: m });
    }
  } catch (e) {
    coverage = { error: e instanceof Error ? e.message : String(e) };
  }
  // Skema doc (v1/v2) atas dokumen SESUDAH substitusi figur (murni baca).
  let schema: { id: string; valid: boolean; issues: number; first: unknown[] } | { id: string; notReady: string } | { id: string; error: string };
  const docSchemaId = inputs.schema.doc;
  const docSeam = inputs.notReady.find((n) => n.owner.includes("SR-04"));
  if (docSeam) schema = { id: docSchemaId, notReady: `${docSeam.message} (${docSeam.owner})` };
  else {
    try {
      const { validateSchema } = await import("../../../src/lib/studio/services/ingest");
      const issues = validateSchema(docSchemaId, inputs.doc);
      schema = { id: docSchemaId, valid: issues.length === 0, issues: issues.length, first: issues.slice(0, 5) };
    } catch (e) {
      schema = { id: docSchemaId, error: e instanceof Error ? e.message : String(e) };
    }
  }
  const outState = existsSync(cfg.out) ? (readdirSync(cfg.out).length > 0 ? "ada dan TIDAK kosong (run akan ditolak)" : "ada, kosong") : "belum ada (akan dibuat)";
  return { files, schema, dispatchCoverage: coverage, expectedNotReady, out: { path: repoRel(cfg.out), state: outState } };
}

/** Rencana sumber per figur (dicetak `--dry-run`): mesin (spec S94/dialek) atau raster aset. */
function figurePlan(inputs: LoadedInputs): Array<{ id: string; kind: string; page: number; source: "mesin" | "raster"; spec: string | null; mm: string; note?: string }> {
  const sub = new Map(inputs.substitutions.map((s) => [s.id, s]));
  return inputs.index.figures.map((f) => {
    const s = sub.get(f.id);
    const engine = s?.status === "SUBSTITUTED";
    const mm = typeof f.widthMm === "number" && typeof f.heightMm === "number" ? `${f.widthMm} x ${Math.round(f.heightMm * 1000) / 1000}` : "-";
    const row: { id: string; kind: string; page: number; source: "mesin" | "raster"; spec: string | null; mm: string; note?: string } = {
      id: f.id,
      kind: f.kind,
      page: f.page,
      source: engine ? "mesin" : "raster",
      spec: engine ? `${s?.specId ?? "?"}${s?.specPath ? ` (${s.specPath}, sha256 ${String(s.specSha256).slice(0, 12)})` : ""}` : null,
      mm,
    };
    if (s && s.status !== "SUBSTITUTED") row.note = `${s.status}${s.note ? `: ${s.note}` : ""}`;
    return row;
  });
}

async function dryRun(cfg: RunConfig, inputs: LoadedInputs, loadStep: StepRecord, figurePages: string, log: RunLog): Promise<number> {
  const pre = await preflight(cfg, inputs);
  const figs = figurePlan(inputs);
  const engineKindsRaster = figs.filter((f) => ENGINE_KIND_SET.has(f.kind) && f.source === "raster").length;
  const out = {
    mode: "dry-run",
    runKind: cfg.runKind,
    runLabel: RUN_KIND_LABEL[cfg.runKind],
    runId: cfg.runId,
    correlationId: log.correlationId,
    inputSchema: inputSchemaOf(cfg, inputs),
    load: loadStep,
    inputs: {
      doc: { path: repoRel(cfg.doc), sha256: inputs.docSha256, bytes: inputs.docBytes, slug: inputs.doc.template?.slug ?? null },
      template: inputs.templateInfo,
      templateResolved: inputs.template
        ? { templateId: inputs.template.templateId, versionNo: inputs.template.versionNo, params: Object.keys(inputs.template.params).length, roleFormats: Object.keys(inputs.template.roleFormats).length }
        : null,
      figureIndex: { path: repoRel(cfg.figureIndex), sha256: inputs.indexSha256, figures: inputs.index.figures.length, counts: inputs.index.counts ?? null, bigPages: inputs.index.bigPages },
      python: { path: cfg.python, source: cfg.pythonSource },
      overrides: Object.keys(inputs.doc.overrides ?? {}).length,
    },
    assets: {
      checked: inputs.assetChecks.length,
      ok: inputs.assetChecks.filter((a) => a.ok && a.docAssetOk !== false).length,
      failed: inputs.assetChecks.filter((a) => !a.ok || a.docAssetOk === false),
    },
    substitutions: inputs.substitutions.map((s) => `${s.id} ${s.kind} hlm ${s.page}${s.bigPage ? " (besar)" : ""}: ${s.status}${s.specId ? ` spec ${s.specId}` : ""}${s.note ? ` (${s.note})` : ""}`),
    figures: figs,
    engineKindsFromRaster: engineKindsRaster,
    preflight: pre,
    plan: plan(cfg, inputs, figurePages),
    warnings: inputs.warnings,
    fatal: inputs.fatal,
  };
  if (cfg.json) print(JSON.stringify(out, null, 2));
  else {
    print(`run_benchmark --dry-run ${cfg.runId}`);
    print(`  jenis run ${RUN_KIND_LABEL[cfg.runKind]}`);
    const sch = out.inputSchema;
    print(`  skema    doc ${sch.doc}, templat ${sch.template} (--schema ${sch.requested}; berkas bawaan ${sch.defaults})`);
    if (sch.fallbackWarning) print(`  PERINGATAN: ${sch.fallbackWarning}`);
    for (const n of inputs.notReady) print(`  NOT_READY v2: ${n.module}: ${n.message} (${n.owner})`);
    print(`  doc      ${out.inputs.doc.path} sha256 ${inputs.docSha256} (${inputs.docBytes} byte); override dokumen ${out.inputs.overrides}`);
    const tr = out.inputs.templateResolved;
    print(`  template ${inputs.templateInfo.file} sha256 ${inputs.templateInfo.sha256} -> ${tr ? `params ${tr.params}, roleFormats ${tr.roleFormats}` : "belum terselesaikan (NOT_READY)"}`);
    print(`  index    ${out.inputs.figureIndex.path} figur ${inputs.index.figures.length} ${JSON.stringify(inputs.index.counts ?? {})}`);
    print(`  python   ${cfg.python} (sumber ${cfg.pythonSource}; env ${PYTHON_ENV})`);
    print(`  aset     sha256 cocok ${out.assets.ok}/${out.assets.checked}`);
    for (const f of out.assets.failed) print(`    GAGAL ${f.id} ${f.file} ${f.actual ?? "(tak terbaca)"} != ${f.expected}`);
    print(`  substitusi figur mesin (${cfg.figures}):`);
    for (const s of out.substitutions) print(`    ${s}`);
    print(`  sumber figur (mesin ${figs.filter((f) => f.source === "mesin").length}, raster ${figs.filter((f) => f.source === "raster").length}; chart/diagram/simbol dari raster ${engineKindsRaster}):`);
    for (const f of figs) print(`    ${f.id} ${f.kind} hlm ${f.page} ${f.source}${f.spec ? ` spec ${f.spec}` : ""} ${f.mm} mm${f.note ? ` [${f.note}]` : ""}`);
    print("  preflight:");
    for (const [k, v] of Object.entries(pre.files as Record<string, { path: string; exists: boolean }>)) print(`    ${v.exists ? "ada  " : "TIDAK"} ${k} ${v.path}`);
    print(`    skema doc sesudah substitusi ${JSON.stringify(pre.schema)}`);
    print(`    dispatchCoverage (renderer belum terisi) ${JSON.stringify(pre.dispatchCoverage)}`);
    const exp = pre.expectedNotReady as Array<{ figure: string; missing: string[] }>;
    for (const e of exp) print(`    perkiraan NOT_READY ${e.figure}: panel ${e.missing.join(",")} (keluarga chart belum terisi; pengganti ${cfg.figureFallback})`);
    print(`    out ${JSON.stringify(pre.out)}`);
    print("  rencana langkah:");
    for (const p of out.plan) print(`    [${p.step}] ${p.action}`);
    if (cfg.runKind === "OFFICIAL" && engineKindsRaster > 0) print(`  PERINGATAN: ${engineKindsRaster} figur chart/diagram/simbol tidak tersubstitusi -> vonis paling tinggi PASS-DEGRADED`);
    for (const w of inputs.warnings) print(`  peringatan: ${w}`);
    for (const f of inputs.fatal) print(`  FATAL: ${f}`);
  }
  // Seam v2 belum ada: rencana dicetak, tetapi run nyata akan NOT_READY (exit 1).
  return inputs.fatal.length ? 2 : inputs.notReady.length ? 1 : 0;
}

/** Satu run penuh (resmi atau diagnosis) ke `cfg.out`. Mengembalikan null bila masukan tidak sah (exit 2). */
async function executeRun(
  cfg: RunConfig,
  argv: readonly string[],
): Promise<{ summary: RunSummary; files: { json: string; md: string }; code: number } | { code: number; error: string }> {
  const startedAt = new Date();
  const log = new RunLog(randomUUID());
  log.log("info", "benchmark.run", `run ${cfg.runId} dimulai (${cfg.runKind})${cfg.dryRun ? " (dry-run)" : ""}`, { context: { argv: [...argv], runKind: cfg.runKind } });

  // 1) Muat masukan.
  const t0 = Date.now();
  let inputs: LoadedInputs;
  try {
    inputs = await loadInputs({ doc: cfg.doc, template: cfg.template, figureIndex: cfg.figureIndex, figures: cfg.figures, schemaRequest: cfg.schema.requested });
  } catch (e) {
    const msg = `masukan tidak dapat dimuat: ${e instanceof Error ? e.message : String(e)}`;
    log.log("error", "benchmark.run.load", msg, { code: "INPUT_UNREADABLE", err: e });
    return { code: 2, error: msg };
  }
  const loadStep: StepRecord = {
    id: "load",
    title: "Muat doc (v1/v2) + templat (tanpa DB) + indeks figur S94 (sha256) + spec S94",
    status: inputs.fatal.length ? "FAILED" : "OK",
    durationMs: Date.now() - t0,
    detail: {
      schema: inputs.schema,
      docSha256: inputs.docSha256,
      template: inputs.templateInfo,
      figures: inputs.index.figures.length,
      assetsChecked: inputs.assetChecks.length,
      assetsOk: inputs.assetChecks.filter((a) => a.ok).length,
      substituted: inputs.substitutions.filter((s) => s.status === "SUBSTITUTED").length,
    },
  };
  if (inputs.fatal.length) loadStep.message = inputs.fatal.slice(0, 5).join("; ");
  // SR-34: jatuh ke v1 selalu terlihat (RunLog menggemakan warn ke stderr) dan tercatat di laporan.
  if (cfg.schema.fallbackWarning) log.log("warn", "benchmark.run.load", `PERINGATAN: ${cfg.schema.fallbackWarning}`, { code: "SCHEMA_V2_FALLBACK_V1" });
  log.log("info", "benchmark.run.load", `skema masukan doc ${inputs.schema.doc}, templat ${inputs.schema.template}`, { context: { schema: inputs.schema, requested: cfg.schema.requested } });
  for (const w of inputs.warnings) log.log("warn", "benchmark.run.load", w);
  for (const f of inputs.fatal) log.log("error", "benchmark.run.load", f, { code: "INPUT_INVALID" });
  const figurePages = cfg.figurePages ?? (inputs.index.bigPages.length ? compactPages(inputs.index.bigPages) : DEFAULT_FIGURE_PAGES);

  // 2) Dry-run: cetak rencana, tidak menulis berkas.
  if (cfg.dryRun) return { code: await dryRun(cfg, inputs, loadStep, figurePages, log), error: "" };

  if (inputs.fatal.length) return { code: 2, error: inputs.fatal.slice(0, 3).join("; ") };

  // 3) Direktori run (harus baru/kosong) + log tahan lama.
  if (existsSync(cfg.out) && readdirSync(cfg.out).length > 0) {
    const msg = `direktori keluaran sudah berisi: ${cfg.out}`;
    log.log("error", "benchmark.run", msg, { code: "OUT_NOT_EMPTY" });
    return { code: 2, error: msg };
  }
  mkdirSync(cfg.out, { recursive: true });
  const logPath = log.attach(cfg.out);

  const st = newState();
  st.steps.push(loadStep);
  let internal = false;
  try {
    await runPipeline(cfg, inputs, figurePages, st, log);
  } catch (e) {
    log.log("error", "benchmark.run", `galat internal pipeline: ${e instanceof Error ? e.message : String(e)}`, { code: "RUNNER_INTERNAL", err: e });
    internal = true;
  }
  st.steps.push({ id: "report", title: "run_summary.json + run_report.md", status: "OK" });
  const summary = buildSummary({ cfg, inputs, st, figurePages, startedAt, correlationId: log.correlationId, logPath, logCounts: { ...log.levelCounts() } });
  if (internal) summary.exitCode = 2;
  const files = writeReports(cfg.out, summary);
  log.log(summary.exitCode === 0 ? "info" : "warn", "benchmark.run", `run ${cfg.runId} (${cfg.runKind}) selesai: ${summary.verdict.overall}, exit ${summary.exitCode}`, {
    code: "RUN_FINISHED",
    context: { summary: repoRel(files.json), reasons: summary.verdict.reasons },
  });
  return { summary, files, code: summary.exitCode };
}

function diagnosisSection(cfg: RunConfig, r: Awaited<ReturnType<typeof executeRun>>): DiagnosisSection {
  const base = { label: RUN_KIND_LABEL[cfg.runKind], runId: cfg.runId, out: repoRel(cfg.out) };
  if (!("summary" in r)) return { ...base, summary: null, verdict: "NOT-RUN", exitCode: r.code, criteria: null, bm4Split: null, steps: [], error: r.error };
  const s = r.summary;
  return {
    ...base,
    summary: repoRel(r.files.json),
    verdict: s.verdict.overall,
    exitCode: s.exitCode,
    criteria: s.verdict.criteria,
    bm4Split: s.bm4Split,
    steps: s.steps.map((x) => ({ id: x.id, status: x.status })),
  };
}

async function main(argv: readonly string[]): Promise<number> {
  let cfg: RunConfig | null;
  try {
    cfg = parseConfig(argv);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`run_benchmark: ${e.message}\n\n${HELP}\n`);
      return 2;
    }
    throw e;
  }
  if (cfg === null) {
    print(HELP);
    return 0;
  }
  // Nilai bawaan env Studio (SOFFICE_PATH, workspace, manifest) relatif cwd = akar repo.
  process.chdir(REPO_ROOT);

  const r = await executeRun(cfg, argv);
  if (cfg.dryRun || !("summary" in r)) {
    if (!("summary" in r) && r.error) process.stderr.write(`run_benchmark: ${r.error}\n`);
    return r.code;
  }
  const summary = r.summary;

  // Run diagnosis raster terpisah (opsional): angkanya tidak menyentuh vonis/exit run resmi.
  if (cfg.withDiagnosisRaster) {
    const dcfg = diagnosisConfig(cfg);
    let d: Awaited<ReturnType<typeof executeRun>>;
    try {
      d = await executeRun(dcfg, argv);
    } catch (e) {
      d = { code: 2, error: e instanceof Error ? e.message : String(e) };
    }
    summary.diagnosis = diagnosisSection(dcfg, d);
    writeReports(cfg.out, summary);
  }

  if (cfg.json) print(JSON.stringify(summary, null, 2));
  else {
    const c = summary.verdict.criteria;
    print(`jenis run ${summary.runLabel}`);
    const sch = summary.inputSchema;
    print(`skema masukan doc ${sch.doc}, templat ${sch.template} (--schema ${sch.requested}; berkas bawaan ${sch.defaults})${sch.fallbackWarning ? " - JATUH KE v1" : ""}`);
    print(`vonis ${summary.verdict.overall} | BM1 ${c.BM1.status} | BM2 ${c.BM2.status} | BM3 ${c.BM3.status} | BM4 ${c.BM4.status} | exit ${summary.exitCode}`);
    if (summary.verdict.reasons.length) print(`alasan ${summary.verdict.reasons.join("; ")}`);
    const fs = summary.figureSources;
    print(`figur mesin ${fs.mesin}, raster ${fs.raster}, hilang ${fs.missing}; chart/diagram/simbol bukan dari mesin ${fs.engineKindsNotFromEngine}`);
    print(`langkah ${summary.steps.map((s) => `${s.id}:${s.status}`).join(" ")}`);
    if (summary.notReady.length) print(`NOT_READY ${summary.notReady.map((n) => `${n.step}:${n.module}`).join(", ")}`);
    if (summary.diagnosis) print(`${summary.diagnosis.label}: ${summary.diagnosis.verdict} (terpisah, tidak memengaruhi vonis) ${summary.diagnosis.summary ?? summary.diagnosis.error ?? ""}`);
    print(`laporan ${repoRel(r.files.json)} | ${repoRel(r.files.md)}`);
  }
  return summary.exitCode;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`run_benchmark: galat tak tertangani: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
    process.exitCode = 2;
  },
);
