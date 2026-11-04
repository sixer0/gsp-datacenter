/**
 * S20: CLI harness konformitas DATUM (dipanggil dari `score.ts`).
 *
 * Tunggal:
 *   npx tsx benchmark/datum_conformance/score.ts --docx <f> --template <slug> --language ID|EN
 *       --tier NOTA|TERBIT|SERAH [--clash <json>] [--coverage <json>] --out <dir>
 *       [--bfix <docx>] [--spec <json>] [--type-code <KODE>] [--kicker <teks>]
 *       [--produced-by mcp|r08] [--copy-control] [--agent-revision-text] [--implemented-only]
 * Batch:
 *   npx tsx benchmark/datum_conformance/score.ts --manifest <json> --out <dir> [--implemented-only]
 *   Manifest: { "coverage"?: <json>, "entries": [ { "docx", "template", "language", "tier",
 *     "clash"?, "coverage"?, "bfix"?, "spec"?, "typeCode"?, "kicker"?, "producedBy"?,
 *     "copyControl"?, "agentRevisionText"? } ] }  (path relatif terhadap folder manifest)
 *
 * Exit: 0 semua PASS; 1 ada FAIL; 2 salah pakai atau masukan tak terbaca.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RuleIndex } from "../rules";
import type { Lang, Tier } from "../rules/types";
import { readClashFile } from "./clash";
import { readCoverageFile, type CoverageResult } from "./coverage";
import { DocxDocument } from "./docx";
import { resolvePair } from "./pairs";
import { renderBatchMarkdown, reportBaseName, writeReport, type BatchSummaryEntry } from "./report";
import { runConformance, type ConformanceReport } from "./score";

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export interface EntrySpec {
  readonly docx: string;
  readonly template: string;
  readonly language: Lang;
  readonly tier: Tier;
  readonly clash?: string;
  readonly coverage?: string;
  readonly bfix?: string;
  readonly spec?: string;
  readonly typeCode?: string;
  readonly kicker?: string;
  readonly producedBy?: "mcp" | "r08";
  readonly copyControl?: boolean;
  readonly agentRevisionText?: boolean;
}

export type CliArgs =
  | { readonly mode: "single"; readonly entry: EntrySpec; readonly out: string; readonly implementedOnly: boolean }
  | { readonly mode: "batch"; readonly manifest: string; readonly out: string; readonly implementedOnly: boolean }
  | { readonly mode: "help" };

const VALUE_FLAGS = new Set(["docx", "template", "language", "tier", "clash", "coverage", "out", "bfix", "spec", "type-code", "kicker", "produced-by", "manifest"]);
const BOOL_FLAGS = new Set(["copy-control", "agent-revision-text", "implemented-only", "help"]);
const TIERS: readonly Tier[] = ["NOTA", "TERBIT", "SERAH"];
const LANGS: readonly Lang[] = ["ID", "EN"];

function asLang(v: unknown, where: string): Lang {
  const u = String(v ?? "").toUpperCase();
  if (!(LANGS as readonly string[]).includes(u)) throw new UsageError(`${where}: language harus ID atau EN (diterima "${String(v)}")`);
  return u as Lang;
}

function asTier(v: unknown, where: string): Tier {
  const u = String(v ?? "").toUpperCase();
  if (!(TIERS as readonly string[]).includes(u)) throw new UsageError(`${where}: tier harus NOTA, TERBIT, atau SERAH (diterima "${String(v)}")`);
  return u as Tier;
}

function asProducedBy(v: unknown, where: string): "mcp" | "r08" | undefined {
  if (v === undefined) return undefined;
  if (v !== "mcp" && v !== "r08") throw new UsageError(`${where}: produced-by harus mcp atau r08`);
  return v;
}

export function parseCliArgs(argv: readonly string[]): CliArgs {
  const vals = new Map<string, string>();
  const bools = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new UsageError(`argumen tak dikenal: ${a}`);
    const k = a.slice(2);
    if (BOOL_FLAGS.has(k)) bools.add(k);
    else if (VALUE_FLAGS.has(k)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new UsageError(`--${k} butuh nilai`);
      vals.set(k, v);
      i++;
    } else throw new UsageError(`bendera tak dikenal: --${k}`);
  }
  if (bools.has("help")) return { mode: "help" };
  const out = vals.get("out");
  if (!out) throw new UsageError("--out wajib");
  const implementedOnly = bools.has("implemented-only");
  if (vals.has("manifest")) return { mode: "batch", manifest: vals.get("manifest")!, out, implementedOnly };
  for (const k of ["docx", "template", "language", "tier"]) if (!vals.has(k)) throw new UsageError(`--${k} wajib (atau --manifest)`);
  return {
    mode: "single",
    out,
    implementedOnly,
    entry: {
      docx: vals.get("docx")!,
      template: vals.get("template")!,
      language: asLang(vals.get("language"), "--language"),
      tier: asTier(vals.get("tier"), "--tier"),
      clash: vals.get("clash"),
      coverage: vals.get("coverage"),
      bfix: vals.get("bfix"),
      spec: vals.get("spec"),
      typeCode: vals.get("type-code"),
      kicker: vals.get("kicker"),
      producedBy: asProducedBy(vals.get("produced-by"), "--produced-by"),
      copyControl: bools.has("copy-control"),
      agentRevisionText: bools.has("agent-revision-text"),
    },
  };
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (e) {
    throw new UsageError(`${file}: tidak dapat dibaca sebagai JSON (${(e as Error).message})`);
  }
}

export function parseManifest(file: string): { entries: EntrySpec[] } {
  const data = readJson(file);
  if (!data || typeof data !== "object" || !Array.isArray((data as Record<string, unknown>).entries)) {
    throw new UsageError(`${file}: manifest butuh larik "entries"`);
  }
  const root = data as Record<string, unknown>;
  const dir = path.dirname(path.resolve(file));
  const rel = (v: unknown) => (typeof v === "string" && v ? path.resolve(dir, v) : undefined);
  const sharedCoverage = rel(root.coverage);
  const entries = (root.entries as unknown[]).map((raw, i): EntrySpec => {
    const where = `${file} entries[${i}]`;
    if (!raw || typeof raw !== "object") throw new UsageError(`${where}: harus objek`);
    const e = raw as Record<string, unknown>;
    if (typeof e.docx !== "string" || typeof e.template !== "string") throw new UsageError(`${where}: docx dan template wajib`);
    return {
      docx: rel(e.docx)!,
      template: e.template,
      language: asLang(e.language, where),
      tier: asTier(e.tier, where),
      clash: rel(e.clash),
      coverage: rel(e.coverage) ?? sharedCoverage,
      bfix: rel(e.bfix),
      spec: rel(e.spec),
      typeCode: typeof e.typeCode === "string" ? e.typeCode : undefined,
      kicker: typeof e.kicker === "string" ? e.kicker : undefined,
      producedBy: asProducedBy(e.producedBy, where),
      copyControl: e.copyControl === true,
      agentRevisionText: e.agentRevisionText === true,
    };
  });
  return { entries };
}

export interface CliDeps {
  readonly index?: RuleIndex;
  readonly now?: () => string;
  readonly log?: (s: string) => void;
  readonly error?: (s: string) => void;
}

/** Menilai satu entri; masukan tak terbaca melempar (ditangkap pemanggil). */
export function scoreEntry(e: EntrySpec, opts: { implementedOnly: boolean; index?: RuleIndex; generatedAt: string }): ConformanceReport {
  const { pair, warnings } = resolvePair(e);
  const docx = DocxDocument.fromFile(e.docx);
  const bfix = e.bfix ? DocxDocument.fromFile(e.bfix) : undefined;
  const spec = e.spec ? readJson(e.spec) : undefined;
  const clash = e.clash ? readClashFile(e.clash) : null;
  const coverage: CoverageResult | null = e.coverage ? readCoverageFile(e.coverage, { template: e.template, language: e.language }) : null;
  return runConformance({ docx, pair, bfix, spec, clash, coverage, index: opts.index, implementedOnly: opts.implementedOnly, warnings, generatedAt: opts.generatedAt });
}

const USAGE = `pakai:
  npx tsx benchmark/datum_conformance/score.ts --docx <f> --template <slug> --language ID|EN --tier NOTA|TERBIT|SERAH [--clash <json>] [--coverage <json>] --out <dir>
     [--bfix <docx>] [--spec <json>] [--type-code <KODE>] [--kicker <teks>] [--produced-by mcp|r08] [--copy-control] [--agent-revision-text] [--implemented-only]
  npx tsx benchmark/datum_conformance/score.ts --manifest <json> --out <dir> [--implemented-only]`;

function summaryLine(r: ConformanceReport, name = reportBaseName(r.input.pair)): string {
  return `${name}: ${r.verdict} | skor ${r.score.percentDisplay} % (${r.score.passed}/${r.score.denominator}) | kritis ${r.critical.passed.length}/${r.critical.required.length} | cakupan ${r.coverage.percent === null ? "?" : r.coverage.percent.toFixed(1)} | bentrok ${r.clash.total}${r.clash.pdf ? "" : " (PDF ?)"}`;
}

export async function runCli(argv: readonly string[], deps: CliDeps = {}): Promise<number> {
  const log = deps.log ?? ((s: string) => console.log(s));
  const error = deps.error ?? ((s: string) => console.error(s));
  const now = deps.now ?? (() => new Date().toISOString());
  let args: CliArgs;
  try {
    args = parseCliArgs(argv);
  } catch (e) {
    error(`${(e as Error).message}\n${USAGE}`);
    return 2;
  }
  if (args.mode === "help") {
    log(USAGE);
    return 0;
  }
  const generatedAt = now();
  if (args.mode === "single") {
    try {
      const r = scoreEntry(args.entry, { implementedOnly: args.implementedOnly, index: deps.index, generatedAt });
      const files = writeReport(r, args.out);
      log(summaryLine(r));
      for (const why of r.reasons) log(`  - ${why}`);
      log(`laporan: ${files.json}\n         ${files.md}`);
      return r.verdict === "PASS" ? 0 : 1;
    } catch (e) {
      error(`galat: ${(e as Error).message}`);
      return 2;
    }
  }
  let manifest: { entries: EntrySpec[] };
  try {
    manifest = parseManifest(args.manifest);
  } catch (e) {
    error(`galat: ${(e as Error).message}`);
    return 2;
  }
  const used = new Map<string, number>();
  const summary: BatchSummaryEntry[] = [];
  let anyError = false;
  let anyFail = false;
  for (const e of manifest.entries) {
    let name = reportBaseName({ slug: e.template, language: e.language });
    const n = (used.get(name) ?? 0) + 1;
    used.set(name, n);
    if (n > 1) name = `${name}_${n}`;
    try {
      const r = scoreEntry(e, { implementedOnly: args.implementedOnly, index: deps.index, generatedAt });
      const files = writeReport(r, args.out, name);
      log(summaryLine(r, name));
      if (r.verdict !== "PASS") anyFail = true;
      summary.push({
        name,
        docx: e.docx,
        verdict: r.verdict,
        score: `${r.score.percentDisplay} % (${r.score.passed}/${r.score.denominator})`,
        critical: `${r.critical.passed.length}/${r.critical.required.length}`,
        coverage: r.coverage.percent,
        clashes: r.clash.total,
        reasons: r.reasons,
        json: files.json,
      });
    } catch (err) {
      anyError = true;
      error(`${name}: galat: ${(err as Error).message}`);
      summary.push({ name, docx: e.docx, verdict: "ERROR", reasons: [(err as Error).message] });
    }
  }
  mkdirSync(args.out, { recursive: true });
  writeFileSync(path.join(args.out, "summary.json"), `${JSON.stringify({ schema: "datum-conformance-batch/v1", generatedAt, manifest: path.resolve(args.manifest), entries: summary }, null, 2)}\n`);
  writeFileSync(path.join(args.out, "summary.md"), renderBatchMarkdown(summary, generatedAt));
  log(`ringkasan: ${path.join(args.out, "summary.json")}`);
  return anyError ? 2 : anyFail ? 1 : 0;
}
