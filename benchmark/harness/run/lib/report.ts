/**
 * Laporan run benchmark (S97): `run_summary.json` + `run_report.md`.
 *
 * Vonis D-17 diambil dari bm_report.json S96 (sumber tunggal angka); runner
 * hanya merangkum: per kriteria, per halaman, per paragraf (diff BM1), per
 * figur di 18 halaman figur besar, plus langkah dan modul NOT_READY.
 *
 * FIX-5 (D-118, R03): vonis memperhitungkan sumber figur. Figur
 * chart/diagram/simbol yang tidak berasal dari mesin (pengganti raster atau
 * raster acuan) menurunkan PASS menjadi PASS-DEGRADED; figur mesin yang hilang
 * = FAIL; hanya run RESMI ber-PASS yang exit 0. BM4 juga dilaporkan tanpa
 * halaman berfigur raster pengganti. Run diagnosis raster (opsional) disajikan
 * di seksi terpisah dan tidak memengaruhi vonis.
 *
 * SR-34: skema ringkasan `s97.run-summary/v3` = v2 + `inputSchema` (versi
 * skema doc/templat yang dipakai, permintaan `--schema`, peringatan jatuh ke
 * v1, seam v2 NOT_READY); laporan Markdown menampilkannya di kepala.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { RUN_KIND_LABEL, type RunConfig, type RunKind, type SchemaRequest } from "./config";
import type { LoadedInputs } from "./inputs";
import { repoRel } from "./inputs";
import { isEngineKind, type FigureRecord, type PipelineState, type StepRecord } from "./pipeline";

export const SUMMARY_SCHEMA = "s97.run-summary/v3";
const D17 = {
  BM1: "unit teks identik berurutan >= 98 %",
  BM2: "jumlah unsur per jenis selisih <= 2 % (halaman, bab, lampiran, tabel, gambar)",
  BM3: "halaman teks identik >= 98 % (min 100/102)",
  BM4: "SSIM rata-rata seluruh halaman >= 0,95 (halaman/figur di bawah ambang = diagnosis)",
} as const;
type Criterion = keyof typeof D17;
const CRITERIA = Object.keys(D17) as Criterion[];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const rec = (v: unknown): Record<string, unknown> => (isRecord(v) ? v : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export interface CriterionVerdict {
  status: "PASS" | "FAIL" | "NOT-RUN";
  rule: string;
  value: unknown;
  threshold: unknown;
}

export type OverallVerdict = "PASS" | "PASS-DEGRADED" | "FAIL" | "INCOMPLETE";

/** BM4 dengan dan tanpa halaman yang memuat figur chart/diagram/simbol non-mesin (R03). */
export interface Bm4Split {
  substitutedPages: number[];
  all: { pages: number; ssimMean: number | null };
  withoutSubstitutedPages: { pages: number; ssimMean: number | null };
  substitutedPagesOnly: { pages: number; ssimMean: number | null };
}

/** Ringkasan run diagnosis raster terpisah (`--with-diagnosis-raster`). */
export interface DiagnosisSection {
  label: string;
  runId: string;
  out: string;
  summary: string | null;
  verdict: OverallVerdict | "NOT-RUN";
  exitCode: number;
  criteria: Record<string, CriterionVerdict> | null;
  bm4Split: Bm4Split | null;
  steps: Array<{ id: string; status: string }>;
  error?: string;
}

/** Versi skema masukan run (SR-34). */
export interface InputSchemaRecord {
  requested: SchemaRequest;
  /** Versi berkas bawaan yang dipakai untuk --doc/--template yang tidak diberikan. */
  defaults: "v1" | "v2";
  doc: string;
  docVersion: "v1" | "v2";
  template: string;
  templateVersion: "v1" | "v2";
  docFrom: "arg" | "default";
  templateFrom: "arg" | "default";
  fallbackWarning: string | null;
  notReady: Array<{ module: string; owner: string; message: string }>;
}

export function inputSchemaOf(cfg: RunConfig, inputs: LoadedInputs): InputSchemaRecord {
  return {
    requested: cfg.schema.requested,
    defaults: cfg.schema.defaults,
    doc: inputs.schema.doc,
    docVersion: inputs.schema.docVersion,
    template: inputs.schema.template,
    templateVersion: inputs.schema.templateVersion,
    docFrom: cfg.schema.docFrom,
    templateFrom: cfg.schema.templateFrom,
    fallbackWarning: cfg.schema.fallbackWarning,
    notReady: inputs.notReady.map((n) => ({ ...n })),
  };
}

export interface RunSummary {
  schema: typeof SUMMARY_SCHEMA;
  /** SR-34: versi skema doc/templat masukan. */
  inputSchema: InputSchemaRecord;
  tool: string;
  runKind: RunKind;
  /** Label run: "RESMI ..." atau "DIAGNOSIS (raster acuan)". */
  runLabel: string;
  official: boolean;
  runId: string;
  correlationId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  mode: Record<string, unknown>;
  inputs: Record<string, unknown>;
  assets: { checked: number; ok: number; failed: unknown[] };
  substitutions: LoadedInputs["substitutions"];
  steps: StepRecord[];
  notReady: PipelineState["notReady"];
  ingest: PipelineState["ingest"];
  outputs: PipelineState["outputs"];
  figures: PipelineState["figures"];
  figureSources: { mesin: number; raster: number; missing: number; engineKindsNotFromEngine: number };
  render: PipelineState["render"];
  lint: PipelineState["lint"];
  verdict: { overall: OverallVerdict; criteriaOverall: OverallVerdict; reasons: string[]; source: string | null; criteria: Record<Criterion, CriterionVerdict> };
  bm4Split: Bm4Split | null;
  diagnosis: DiagnosisSection | null;
  perPage: Array<{ page: number; textIdentical: boolean | null; ssim: number | null; bigPage: boolean; missingIn?: unknown }>;
  perParagraph: Record<string, unknown> | null;
  bigPageFigures: Array<Record<string, unknown>>;
  compare: Record<string, unknown> | null;
  warnings: string[];
  log: { path: string | null; counts: Record<string, number> };
  exitCode: number;
}

function criteriaFrom(report: Record<string, unknown> | null): Record<Criterion, CriterionVerdict> {
  const crit = rec(report?.criteria);
  const out = {} as Record<Criterion, CriterionVerdict>;
  for (const k of CRITERIA) {
    const r = rec(report?.[k]);
    const s = crit[k];
    const status: CriterionVerdict["status"] = s === "PASS" || s === "FAIL" ? s : "NOT-RUN";
    let value: unknown = null;
    if (k === "BM1") value = r.pct !== undefined ? { pct: r.pct, unitsIdenticalInOrder: r.unitsIdenticalInOrder, unitsTotal: r.unitsTotal } : null;
    if (k === "BM2") value = r.perType ?? null;
    if (k === "BM3") value = r.pct !== undefined ? { pagesIdentical: r.pagesIdentical, of: r.of, pct: r.pct } : null;
    if (k === "BM4") value = r.ssimMean !== undefined ? { ssimMean: r.ssimMean, ssimMin: r.ssimMin, pagesBelowThreshold: r.pagesBelowThreshold } : null;
    out[k] = { status, rule: D17[k], value, threshold: r.threshold ?? null };
  }
  return out;
}

function perPageFrom(report: Record<string, unknown> | null, bigPages: ReadonlySet<number>): RunSummary["perPage"] {
  const text = new Map<number, Record<string, unknown>>();
  for (const p of arr(rec(report?.BM3).perPage)) if (isRecord(p) && typeof p.page === "number") text.set(p.page, p);
  const ssim = new Map<number, number | null>();
  for (const p of arr(rec(report?.BM4).perPage)) if (isRecord(p) && typeof p.page === "number") ssim.set(p.page, typeof p.ssim === "number" ? p.ssim : null);
  const pages = [...new Set([...text.keys(), ...ssim.keys()])].sort((a, b) => a - b);
  return pages.map((page) => {
    const t = text.get(page);
    const row: RunSummary["perPage"][number] = {
      page,
      textIdentical: t && typeof t.textIdentical === "boolean" ? t.textIdentical : null,
      ssim: ssim.get(page) ?? null,
      bigPage: bigPages.has(page),
    };
    if (t?.missingIn !== undefined) row.missingIn = t.missingIn;
    return row;
  });
}

function perParagraphFrom(report: Record<string, unknown> | null): Record<string, unknown> | null {
  const b = rec(report?.BM1);
  if (b.pct === undefined) return null;
  const diffs = arr(b.diffs).filter(isRecord);
  const byOp: Record<string, number> = {};
  for (const d of diffs) byOp[String(d.op)] = (byOp[String(d.op)] ?? 0) + 1;
  const texts = (v: unknown) => arr(v).filter(isRecord).map((u) => ({ kind: u.kind, loc: u.loc, text: u.text }));
  return {
    unitsRef: b.unitsRef,
    unitsOut: b.unitsOut,
    unitsIdenticalInOrder: b.unitsIdenticalInOrder,
    pct: b.pct,
    byKind: b.byKind ?? null,
    diffCount: b.diffCount ?? diffs.length,
    diffsByOp: byOp,
    /** Contoh 100 diff pertama; daftar lengkap di bm_report.json. */
    diffsSample: diffs.slice(0, 100).map((d) => ({ op: d.op, refRange: d.refRange, outRange: d.outRange, ref: texts(d.ref), out: texts(d.out) })),
  };
}

function bigPageFiguresFrom(report: Record<string, unknown> | null, inputs: LoadedInputs, st: PipelineState, perPage: RunSummary["perPage"]): Array<Record<string, unknown>> {
  const perFig = arr(rec(report?.BM4).perFigure).filter(isRecord);
  const pageRow = new Map(perPage.map((p) => [p.page, p]));
  const figRec = new Map(st.figures.map((f) => [f.id, f]));
  return inputs.index.bigPages.map((page) => {
    const figs = inputs.index.figures
      .filter((f) => f.page === page)
      .map((f) => ({ id: f.id, kind: f.kind, figure: f.figure ?? null, mode: figRec.get(f.id)?.mode ?? (st.figures.length ? "RASTER" : "NOT-RUN"), error: figRec.get(f.id)?.error }));
    return {
      page,
      textIdentical: pageRow.get(page)?.textIdentical ?? null,
      pageSsim: pageRow.get(page)?.ssim ?? null,
      figures: figs,
      perFigureSsim: perFig.filter((f) => f.page === page).map((f) => ({ figure: f.figure, bboxRef: f.bboxRef, ssim: f.ssim })),
    };
  });
}

/**
 * Vonis akhir dan kode keluar (D-17 + D-118). Murni; diuji oleh
 * `selftest_verdict.ts`.
 */
export function decideVerdict(i: {
  criteria: readonly CriterionVerdict["status"][];
  runKind: RunKind;
  /** Figur mesin tanpa keluaran dan tanpa pengganti. */
  missing: number;
  /** Figur chart/diagram/simbol dari raster acuan (FALLBACK_RASTER atau RASTER). */
  notFromEngine: number;
  /** Langkah FAILED/NOT_READY (atau langkah figur tidak berjalan). */
  blocking: boolean;
  compareExit2: boolean;
}): { overall: OverallVerdict; criteriaOverall: OverallVerdict; exitCode: number; reasons: string[] } {
  const criteriaOverall: OverallVerdict =
    i.criteria.length > 0 && i.criteria.every((s) => s === "PASS") ? "PASS" : i.criteria.some((s) => s === "FAIL") ? "FAIL" : "INCOMPLETE";
  const reasons: string[] = [];
  let overall: OverallVerdict = criteriaOverall;
  if (i.missing > 0) {
    overall = "FAIL";
    reasons.push(`${i.missing} figur mesin gagal dirender tanpa pengganti`);
  } else if (i.notFromEngine > 0) {
    reasons.push(`${i.notFromEngine} figur chart/diagram/simbol dari raster acuan, bukan mesin`);
    if (criteriaOverall === "PASS") overall = "PASS-DEGRADED";
  }
  if (i.blocking) reasons.push("ada langkah FAILED/NOT_READY");
  if (i.runKind !== "OFFICIAL") reasons.push(`run ${i.runKind}: bukan run resmi, tidak pernah exit 0`);
  const exitCode = i.compareExit2 ? 2 : overall === "PASS" && !i.blocking && i.runKind === "OFFICIAL" ? 0 : 1;
  return { overall, criteriaOverall, exitCode, reasons };
}

function mean(xs: readonly number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/** BM4 terbagi: semua halaman, tanpa halaman figur non-mesin, dan hanya halaman itu. */
export function bm4SplitFrom(perPage: RunSummary["perPage"], figures: readonly FigureRecord[]): Bm4Split | null {
  const withSsim = perPage.filter((p): p is typeof p & { ssim: number } => typeof p.ssim === "number");
  if (withSsim.length === 0) return null;
  const sub = new Set(figures.filter((f) => isEngineKind(f.kind) && f.mode !== "ENGINE" && f.page > 0).map((f) => f.page));
  const keep = withSsim.filter((p) => !sub.has(p.page));
  const only = withSsim.filter((p) => sub.has(p.page));
  return {
    substitutedPages: [...sub].sort((a, b) => a - b),
    all: { pages: withSsim.length, ssimMean: mean(withSsim.map((p) => p.ssim)) },
    withoutSubstitutedPages: { pages: keep.length, ssimMean: mean(keep.map((p) => p.ssim)) },
    substitutedPagesOnly: { pages: only.length, ssimMean: mean(only.map((p) => p.ssim)) },
  };
}

export function buildSummary(i: {
  cfg: RunConfig;
  inputs: LoadedInputs;
  st: PipelineState;
  figurePages: string;
  startedAt: Date;
  correlationId: string;
  logPath: string | null;
  logCounts: Record<string, number>;
}): RunSummary {
  const { cfg, inputs, st } = i;
  const report = st.compare?.report ?? null;
  const criteria = criteriaFrom(report);
  const statuses = CRITERIA.map((k) => criteria[k].status);
  const perPage = perPageFrom(report, new Set(inputs.index.bigPages));
  const blocking = st.steps.some((s) => s.status === "FAILED" || s.status === "NOT_READY");
  const compareFailed = st.steps.find((s) => s.id === "compare")?.status === "FAILED";
  const engineFigs = st.figures.filter((f) => isEngineKind(f.kind));
  const missing = engineFigs.filter((f) => f.mode === "MISSING").length;
  const notFromEngine = engineFigs.filter((f) => f.mode === "FALLBACK_RASTER" || f.mode === "RASTER").length;
  // Langkah figur tidak berjalan: figur mesin belum terbukti, run tidak boleh PASS.
  const figuresRan = st.figures.length > 0;
  const v = decideVerdict({
    criteria: statuses,
    runKind: cfg.runKind,
    missing,
    notFromEngine,
    blocking: blocking || !figuresRan,
    compareExit2: compareFailed && st.compare?.exitCode === 2,
  });
  if (!figuresRan) v.reasons.push("langkah figur tidak menghasilkan catatan figur");
  const exitCode = v.exitCode;
  const finished = new Date();
  const failedAssets = inputs.assetChecks.filter((a) => !a.ok || a.docAssetOk === false);
  return {
    schema: SUMMARY_SCHEMA,
    inputSchema: inputSchemaOf(cfg, inputs),
    tool: "run_benchmark (S97, H07; FIX-5; SR-34)",
    runKind: cfg.runKind,
    runLabel: RUN_KIND_LABEL[cfg.runKind],
    official: cfg.runKind === "OFFICIAL",
    runId: cfg.runId,
    correlationId: i.correlationId,
    startedAt: i.startedAt.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - i.startedAt.getTime(),
    mode: { runKind: cfg.runKind, figures: cfg.figures, figureFallback: cfg.figureFallback, skipPdf: cfg.skipPdf, skipCompare: cfg.skipCompare, db: false },
    inputs: {
      doc: { path: repoRel(cfg.doc), sha256: inputs.docSha256, bytes: inputs.docBytes },
      template: inputs.templateInfo,
      figureIndex: { path: repoRel(cfg.figureIndex), sha256: inputs.indexSha256, figures: inputs.index.figures.length, bigPages: inputs.index.bigPages },
      refDocx: cfg.refDocx,
      refPdf: cfg.refPdf,
      python: cfg.python,
      pythonSource: cfg.pythonSource,
      figurePages: i.figurePages,
    },
    assets: { checked: inputs.assetChecks.length, ok: inputs.assetChecks.length - failedAssets.length, failed: failedAssets },
    substitutions: inputs.substitutions,
    steps: st.steps,
    notReady: st.notReady,
    ingest: st.ingest,
    outputs: st.outputs,
    figures: st.figures,
    figureSources: {
      mesin: st.figures.filter((f) => f.source === "mesin").length,
      raster: st.figures.filter((f) => f.source === "raster").length,
      missing,
      engineKindsNotFromEngine: notFromEngine,
    },
    render: st.render,
    lint: st.lint,
    verdict: { overall: v.overall, criteriaOverall: v.criteriaOverall, reasons: v.reasons, source: st.compare?.reportJson ?? null, criteria },
    bm4Split: bm4SplitFrom(perPage, st.figures),
    diagnosis: null,
    perPage,
    perParagraph: perParagraphFrom(report),
    bigPageFigures: bigPageFiguresFrom(report, inputs, st, perPage),
    compare: st.compare
      ? {
          exitCode: st.compare.exitCode,
          dir: st.compare.dir,
          reportJson: st.compare.reportJson,
          reportMd: st.compare.reportMd,
          stdout: st.compare.stdoutFile,
          stderr: st.compare.stderrFile,
          timedOut: st.compare.timedOut,
          error: st.compare.error,
          bm2: report ? rec(report.BM2) : null,
        }
      : null,
    warnings: cfg.schema.fallbackWarning ? [cfg.schema.fallbackWarning, ...inputs.warnings] : inputs.warnings,
    log: { path: i.logPath ? repoRel(i.logPath) : null, counts: i.logCounts },
    exitCode,
  };
}

const esc = (s: unknown): string => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const fmt = (v: unknown): string => (v === null || v === undefined ? "-" : typeof v === "number" ? String(Math.round(v * 10000) / 10000) : esc(v));

export function renderMarkdown(s: RunSummary): string {
  const L: string[] = [];
  L.push(`# Laporan run benchmark Manual DATUM 000 (${s.runId})`, "");
  L.push(`Jenis run: **${s.runLabel}**${s.official ? "" : " - angka run ini BUKAN bukti mutu figur mesin (D-118)"}`, "");
  const sch = s.inputSchema;
  L.push(`Skema masukan: doc **${sch.doc}**, templat **${sch.template}** (--schema ${sch.requested}; berkas bawaan ${sch.defaults}; doc dari ${sch.docFrom === "arg" ? "--doc" : "bawaan"}, templat dari ${sch.templateFrom === "arg" ? "--template" : "bawaan"}).`, "");
  if (sch.fallbackWarning) L.push(`**PERINGATAN:** ${sch.fallbackWarning}.`, "");
  for (const n of sch.notReady) L.push(`**NOT_READY v2:** ${n.module}: ${n.message} (${n.owner}).`, "");
  L.push(`Vonis D-17: **${s.verdict.overall}** (kriteria saja: ${s.verdict.criteriaOverall}) | exit ${s.exitCode} | ${s.startedAt} -> ${s.finishedAt} (${Math.round(s.durationMs / 1000)} s) | tanpa DB`, "");
  if (s.verdict.reasons.length) L.push(`Alasan vonis: ${s.verdict.reasons.join("; ")}.`, "");
  const src = s.figureSources;
  L.push(`Sumber figur: mesin ${src.mesin}, raster ${src.raster}, hilang ${src.missing}; chart/diagram/simbol bukan dari mesin: ${src.engineKindsNotFromEngine}.`, "");
  L.push(`Sumber angka: ${s.verdict.source ?? "(bm_compare tidak dijalankan / gagal)"}. Log: ${s.log.path ?? "-"} (info ${s.log.counts.info ?? 0}, warn ${s.log.counts.warn ?? 0}, error ${s.log.counts.error ?? 0}).`, "");

  L.push("## Kriteria D-17", "", "| Kriteria | Aturan | Status | Nilai |", "|---|---|---|---|");
  for (const k of CRITERIA) {
    const c = s.verdict.criteria[k];
    let v = "-";
    const val = rec(c.value);
    if (k === "BM1" && c.value) v = `${fmt(val.pct)} % (${fmt(val.unitsIdenticalInOrder)}/${fmt(val.unitsTotal)})`;
    if (k === "BM2" && c.value) v = Object.entries(val).map(([t, r]) => `${t} ${fmt(rec(r).out)}/${fmt(rec(r).ref)}`).join("; ");
    if (k === "BM3" && c.value) v = `${fmt(val.pagesIdentical)}/${fmt(val.of)} (${fmt(val.pct)} %)`;
    if (k === "BM4" && c.value) v = `rata-rata ${fmt(val.ssimMean)}, min ${fmt(val.ssimMin)}`;
    L.push(`| ${k} | ${esc(c.rule)} | ${c.status} | ${v} |`);
  }
  L.push("");
  if (s.bm4Split) {
    const b = s.bm4Split;
    L.push("BM4 terbagi (R03):", "", "| Cakupan | Halaman | SSIM rata-rata |", "|---|---|---|");
    L.push(`| semua halaman | ${b.all.pages} | ${fmt(b.all.ssimMean)} |`);
    L.push(`| tanpa halaman berfigur raster pengganti | ${b.withoutSubstitutedPages.pages} | ${fmt(b.withoutSubstitutedPages.ssimMean)} |`);
    L.push(`| hanya halaman itu (${b.substitutedPages.join(", ") || "-"}) | ${b.substitutedPagesOnly.pages} | ${fmt(b.substitutedPagesOnly.ssimMean)} |`);
    L.push("");
  }
  if (s.diagnosis) {
    const d = s.diagnosis;
    L.push(`## ${d.label} - run terpisah, tidak memengaruhi vonis di atas`, "");
    L.push(`Run ${d.runId} di ${d.out}; ringkasan ${d.summary ?? "-"}; vonis ${d.verdict}, exit ${d.exitCode}${d.error ? `; galat: ${esc(d.error)}` : ""}.`, "");
    L.push(`Langkah: ${d.steps.map((x) => `${x.id}:${x.status}`).join(" ") || "-"}.`, "");
    if (d.criteria) {
      L.push("| Kriteria | Status | Nilai |", "|---|---|---|");
      for (const k of CRITERIA) {
        const c = d.criteria[k];
        if (c) L.push(`| ${k} | ${c.status} | ${esc(JSON.stringify(c.value))} |`);
      }
      L.push("");
    }
    if (d.bm4Split) L.push(`BM4 diagnosis: semua ${fmt(d.bm4Split.all.ssimMean)}; tanpa halaman figur raster acuan ${fmt(d.bm4Split.withoutSubstitutedPages.ssimMean)}.`, "");
  }

  L.push("## Langkah", "", "| Langkah | Status | Modul | Durasi ms | Catatan |", "|---|---|---|---|---|");
  for (const st of s.steps) L.push(`| ${st.id} | ${st.status} | ${esc(st.module ?? "")} | ${fmt(st.durationMs)} | ${esc(st.code ? `${st.code}: ` : "")}${esc(st.message ?? "")} |`);
  L.push("");
  L.push("## Modul NOT_READY", "");
  if (s.notReady.length === 0) L.push("Tidak ada.", "");
  else {
    L.push("| Langkah | Modul | Kode | Figur | Pesan |", "|---|---|---|---|---|");
    for (const n of s.notReady) L.push(`| ${n.step} | ${esc(n.module)} | ${esc(n.code ?? "")} | ${esc(n.figure ?? "")} | ${esc(n.message)} |`);
    L.push("");
  }

  if (s.render || s.lint) {
    L.push("## Render layanan (R04)", "");
    if (s.render) L.push(`Templat + override dokumen lewat templateForDoc/applyDocOverrides: ${s.render.overrides} override; tier ${s.render.tier}; job tanpa DB ${s.render.job}.`);
    if (s.lint) L.push(`Lint pasca-render (lintAfterRender, tanpa HTML): ${s.lint.releaseStatus} tier ${s.lint.tier}; ${s.lint.checks} cek, FAIL ${s.lint.fail}.`);
    L.push("");
  }

  if (s.ingest) {
    L.push("## Ingest (mode laporan D-55)", "");
    L.push(`valid ${s.ingest.valid}; status rilis ${s.ingest.releaseStatus ?? "-"}; lint ${s.ingest.lint?.releaseStatus ?? "-"}; unit ${s.ingest.units}; blok ${s.ingest.blocks}; isu ${s.ingest.issuesTotal}.`);
    L.push(`Penahan diturunkan: ${s.ingest.downgraded.length ? s.ingest.downgraded.join(", ") : "tidak ada"}.`, "");
    const fails = (s.ingest.lint?.checks ?? []).filter((c) => c.status === "FAIL");
    if (fails.length) {
      L.push("| Cek lint FAIL | Alamat | Rincian |", "|---|---|---|");
      for (const c of fails.slice(0, 60)) L.push(`| ${esc(c.checkId)} | ${esc(c.address ?? c.pointer ?? "")} | ${esc(c.detail ?? "")} |`);
      L.push("");
    }
  }

  L.push("## Keluaran", "");
  for (const o of s.outputs) L.push(`- ${o.kind.toUpperCase()}: ${o.path} (${o.bytes} byte, sha256 ${o.sha256})`);
  if (s.outputs.length === 0) L.push("- tidak ada");
  L.push("", `Aset: ${s.assets.ok}/${s.assets.checked} sha256 cocok.`, "");

  L.push(`## Per figur (${s.figures.length} penempatan)`, "", "| Figur | Jenis | Hlm | Besar | Sumber | Mode | Spec | Ukuran mm | Lembar | Rincian |", "|---|---|---|---|---|---|---|---|---|---|");
  const mm = (f: FigureRecord) => (typeof f.widthMm === "number" && typeof f.heightMm === "number" ? `${fmt(f.widthMm)} x ${fmt(f.heightMm)}` : "-");
  for (const f of s.figures) {
    const spec = f.specId ? `${f.specId}${f.specPath ? ` (${f.specPath})` : ""}` : "-";
    L.push(`| ${f.id} ${esc(f.figure ?? "")} | ${f.kind} | ${f.page} | ${f.bigPage ? "ya" : ""} | ${f.source ?? "HILANG"} | ${f.mode} | ${esc(spec)} | ${mm(f)} | ${f.sheets} | ${esc(f.error ?? f.files.join(", "))} |`);
  }
  if (s.figures.length === 0) L.push("| - | - | - | - | - | langkah figur tidak berjalan | - | - | - | - |");
  L.push("");

  L.push("## Per figur di 18 halaman figur besar (diagnosis BM4)", "", "| Hlm | Teks identik | SSIM halaman | Figur (mode) | SSIM per figur |", "|---|---|---|---|---|");
  for (const b of s.bigPageFigures) {
    const figs = arr(b.figures).map((f) => `${rec(f).id} ${rec(f).kind} (${rec(f).mode})`).join("; ");
    const ss = arr(b.perFigureSsim).map((f) => fmt(rec(f).ssim)).join(", ");
    L.push(`| ${b.page} | ${fmt(b.textIdentical)} | ${fmt(b.pageSsim)} | ${esc(figs)} | ${ss || "-"} |`);
  }
  L.push("");

  L.push("## Per halaman", "");
  if (s.perPage.length === 0) L.push("Tidak tersedia (PDF tidak dibandingkan).", "");
  else {
    const bad = s.perPage.filter((p) => p.textIdentical === false || (p.ssim ?? 0) < 0.95);
    L.push(`${s.perPage.length} halaman; ${bad.length} dengan teks beda atau SSIM < 0,95 (semua halaman di run_summary.json).`, "");
    L.push("| Hlm | Teks identik | SSIM | Besar |", "|---|---|---|---|");
    for (const p of bad) L.push(`| ${p.page} | ${fmt(p.textIdentical)} | ${fmt(p.ssim)} | ${p.bigPage ? "ya" : ""} |`);
    L.push("");
  }

  L.push("## Per paragraf (BM1)", "");
  const pp = s.perParagraph;
  if (!pp) L.push("Tidak tersedia (DOCX tidak dibandingkan).", "");
  else {
    L.push(`Unit acuan ${fmt(pp.unitsRef)}, keluaran ${fmt(pp.unitsOut)}, identik berurutan ${fmt(pp.unitsIdenticalInOrder)} (${fmt(pp.pct)} %); diff ${fmt(pp.diffCount)} ${JSON.stringify(pp.diffsByOp)}.`, "");
    const sample = arr(pp.diffsSample).slice(0, 40);
    if (sample.length) {
      L.push("| Op | Acuan | Keluaran |", "|---|---|---|");
      const cell = (v: unknown) => arr(v).map((u) => `[${rec(u).kind}] ${String(rec(u).text ?? "").slice(0, 160)}`).join(" / ");
      for (const d of sample) L.push(`| ${esc(rec(d).op)} | ${esc(cell(rec(d).ref))} | ${esc(cell(rec(d).out))} |`);
      L.push("", "Daftar lengkap dengan konteks: bm_report.json / bm_report.md di folder compare.", "");
    }
  }

  if (s.warnings.length) {
    L.push("## Peringatan masukan", "");
    for (const w of s.warnings) L.push(`- ${w}`);
    L.push("");
  }
  return `${L.join("\n")}\n`;
}

export function writeReports(dir: string, s: RunSummary): { json: string; md: string } {
  const json = path.join(dir, "run_summary.json");
  const md = path.join(dir, "run_report.md");
  writeFileSync(json, `${JSON.stringify(s, null, 2)}\n`, "utf8");
  writeFileSync(md, renderMarkdown(s), "utf8");
  return { json, md };
}
