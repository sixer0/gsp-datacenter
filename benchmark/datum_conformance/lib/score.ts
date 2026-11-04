/**
 * S20: mesin skor konformitas DATUM Rev A.
 *
 * - Skor = PASS / (PASS + FAIL + UNEXERCISED) atas aturan TERUKUR yang berlaku (research/32 §0.3).
 *   NA keluar penyebut; penyebut 0 = gagal; ambang >= 85,0 % dengan aritmetika bilangan bulat
 *   (tanpa pembulatan ke atas, research/31 §8).
 * - Aturan katalog yang berlaku tetapi belum diimplementasikan = UNEXERCISED (bawaan), agar
 *   gerbang tidak lolos dengan modul yang belum lengkap; `implementedOnly` mengeluarkannya.
 * - Gerbang kritis: semua CR-* yang berlaku harus PASS; NA kritis tidak sah, UNEXERCISED = FAIL.
 * - Bentrok = kegagalan detektor X-* + bentrok PDF (G-01..G-06, JSON S24). Ambang 0 (D-593).
 * - Putusan PASS hanya bila skor >= 85, kritis lulus, cakupan >= 85, dan bentrok = 0 (D-592, D-593).
 */
import { isApplicable, type CatalogEntry } from "../catalog";
import { defaultRuleIndex, type RuleIndex } from "../rules";
import type { PairContext, RuleContext, RuleStatus } from "../rules/types";
import { countByKind, type ClashKind, type ClashResult } from "./clash";
import type { CoverageResult } from "./coverage";
import type { DocxDocument } from "./docx";
import { buildLayout } from "./layout";

export const SCHEMA = "datum-conformance/v1";
export const SCORE_THRESHOLD = 85;
export const COVERAGE_THRESHOLD = 85;

export type OutcomeStatus = RuleStatus | "not_applicable" | "not_implemented";

export interface RuleOutcome {
  readonly id: string;
  readonly family: string;
  readonly title: string;
  readonly citation: string;
  readonly critical: boolean;
  readonly kind: CatalogEntry["kind"];
  readonly module: CatalogEntry["module"];
  readonly applicable: boolean;
  readonly implemented: boolean;
  readonly status: OutcomeStatus;
  /** Status asli dari modul bila harness mengubahnya (mis. NA kritis -> fail). */
  readonly rawStatus?: RuleStatus;
  readonly evidence: string;
  readonly part?: string;
  readonly location?: string;
  readonly observed?: string;
  readonly error?: string;
}

export interface ScoreSummary {
  readonly passed: number;
  readonly failed: number;
  readonly unexercised: number;
  readonly na: number;
  readonly denominator: number;
  /** Nilai persen penuh (untuk tampilan pakai `percentDisplay`). */
  readonly percent: number;
  /** Satu desimal, dipotong (bukan dibulatkan ke atas). */
  readonly percentDisplay: string;
  readonly threshold: number;
  readonly ok: boolean;
}

export interface ConformanceReport {
  readonly schema: typeof SCHEMA;
  readonly generatedAt: string;
  readonly input: {
    readonly docx: string | null;
    readonly docxSha256: string;
    readonly bfix: string | null;
    readonly bfixSha256: string | null;
    readonly spec: boolean;
    readonly pair: PairContext;
    readonly implementedOnly: boolean;
    readonly warnings: readonly string[];
    /** Ringkasan klasifikasi seksi R0 (indeks seksi berbasis 0). */
    readonly structure: StructureSummary;
  };
  readonly rules: {
    readonly catalogMeasurable: number;
    readonly implemented: number;
    readonly applicableMeasurable: number;
    readonly unimplementedApplicable: readonly string[];
  };
  readonly score: ScoreSummary & { readonly byFamily: Readonly<Record<string, { passed: number; denominator: number }>> };
  readonly critical: { readonly required: readonly string[]; readonly passed: readonly string[]; readonly failed: readonly string[]; readonly ok: boolean };
  readonly clash: {
    readonly xFailures: readonly string[];
    /** Detektor X-* yang berlaku tetapi belum terlatih (belum diimplementasi atau UNEXERCISED). */
    readonly xUnverified: readonly string[];
    readonly pdf: null | { readonly file: string; readonly source: string | null; readonly pages: number; readonly count: number; readonly byKind: Readonly<Record<ClashKind, number>> };
    readonly total: number;
    readonly ok: boolean;
  };
  readonly coverage: { readonly percent: number | null; readonly covered?: number; readonly applicable?: number; readonly source: string | null; readonly note?: string; readonly threshold: number; readonly ok: boolean };
  readonly verdict: "PASS" | "FAIL";
  readonly reasons: readonly string[];
  readonly outcomes: readonly RuleOutcome[];
}

export interface StructureSummary {
  readonly sections: number;
  readonly cover: number | null;
  readonly controlSheet: number | null;
  readonly toc: number | null;
  readonly wrappers: readonly number[];
  readonly interiors: readonly number[];
  readonly sealBandTables: number;
  readonly registerFooters: readonly string[];
}

export interface ConformanceInput {
  readonly docx: DocxDocument;
  readonly pair: PairContext;
  /** Bawaan: indeks 4 modul terpasang. */
  readonly index?: RuleIndex;
  readonly bfix?: DocxDocument;
  readonly spec?: unknown;
  readonly clash?: ClashResult | null;
  readonly coverage?: CoverageResult | null;
  readonly implementedOnly?: boolean;
  readonly warnings?: readonly string[];
  /** ISO 8601; bawaan waktu sekarang. */
  readonly generatedAt?: string;
}

export function computeScore(outcomes: readonly { status: OutcomeStatus }[]): ScoreSummary {
  let passed = 0;
  let failed = 0;
  let unexercised = 0;
  let na = 0;
  for (const o of outcomes) {
    if (o.status === "pass") passed++;
    else if (o.status === "fail") failed++;
    else if (o.status === "unexercised") unexercised++;
    else if (o.status === "na") na++;
  }
  const denominator = passed + failed + unexercised;
  const ok = denominator > 0 && passed * 100 >= SCORE_THRESHOLD * denominator;
  const percent = denominator > 0 ? (passed * 100) / denominator : 0;
  const tenths = denominator > 0 ? Math.floor((passed * 1000) / denominator) : 0;
  return {
    passed,
    failed,
    unexercised,
    na,
    denominator,
    percent,
    percentDisplay: `${Math.floor(tenths / 10)}.${tenths % 10}`,
    threshold: SCORE_THRESHOLD,
    ok,
  };
}

export function runConformance(input: ConformanceInput): ConformanceReport {
  const index = input.index ?? defaultRuleIndex();
  const pair = input.pair;
  const implementedOnly = input.implementedOnly ?? false;
  const q = { tier: pair.tier, language: pair.language, typeCode: pair.typeCode };
  // Tata letak selalu dibangun: DOCX yang tidak terurai gagal di sini (galat masukan), bukan per aturan.
  const layout = buildLayout(input.docx);
  const bfixLayout = input.bfix ? buildLayout(input.bfix) : undefined;
  const context: RuleContext = { docx: input.docx, pair, layout, bfix: input.bfix, bfixLayout, spec: input.spec };

  const outcomes: RuleOutcome[] = [];
  for (const entry of index.catalog) {
    const base = {
      id: entry.id,
      family: entry.family,
      title: entry.title,
      citation: entry.citation,
      critical: entry.critical,
      kind: entry.kind,
      module: entry.module,
    };
    const applicable = isApplicable(entry, q);
    const rule = index.byId.get(entry.id);
    if (!applicable) {
      outcomes.push({ ...base, applicable, implemented: !!rule, status: "not_applicable", evidence: `tidak berlaku untuk ${pair.tier}/${pair.language}/${pair.typeCode}` });
      continue;
    }
    if (!rule) {
      outcomes.push({
        ...base,
        applicable,
        implemented: false,
        status: implementedOnly && !entry.critical ? "not_implemented" : "unexercised",
        evidence: `aturan belum diimplementasikan (modul ${entry.module})`,
      });
      continue;
    }
    try {
      const r = rule.check(context);
      if (entry.critical && r.status !== "pass" && r.status !== "fail") {
        const why = r.status === "na" ? "NA tidak sah untuk aturan kritis" : "aturan kritis tanpa bukti terlatih";
        outcomes.push({ ...base, applicable, implemented: true, status: "fail", rawStatus: r.status, evidence: `${why}: ${r.evidence}`, part: r.part, location: r.location, observed: r.observed });
      } else {
        outcomes.push({ ...base, applicable, implemented: true, status: r.status, evidence: r.evidence, part: r.part, location: r.location, observed: r.observed });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      outcomes.push({ ...base, applicable, implemented: true, status: "fail", evidence: `galat saat memeriksa aturan: ${msg}`, error: msg });
    }
  }

  const measurable = outcomes.filter((o) => o.kind === "measurable");
  const score = computeScore(measurable);
  const byFamily: Record<string, { passed: number; denominator: number }> = {};
  for (const o of measurable) {
    if (o.status !== "pass" && o.status !== "fail" && o.status !== "unexercised") continue;
    const f = (byFamily[o.family] ??= { passed: 0, denominator: 0 });
    f.denominator++;
    if (o.status === "pass") f.passed++;
  }

  const criticalOutcomes = measurable.filter((o) => o.critical && o.applicable);
  const critical = {
    required: criticalOutcomes.map((o) => o.id),
    passed: criticalOutcomes.filter((o) => o.status === "pass").map((o) => o.id),
    failed: criticalOutcomes.filter((o) => o.status !== "pass").map((o) => o.id),
    ok: criticalOutcomes.every((o) => o.status === "pass"),
  };

  const xOutcomes = outcomes.filter((o) => o.kind === "clash" && o.applicable);
  const xFailures = xOutcomes.filter((o) => o.status === "fail").map((o) => o.id);
  const xUnverified = xOutcomes.filter((o) => o.status === "unexercised" || o.status === "not_implemented").map((o) => o.id);
  const pdf = input.clash
    ? { file: input.clash.pdf, source: input.clash.source ?? null, pages: input.clash.pages, count: input.clash.clashes.length, byKind: countByKind(input.clash.clashes) }
    : null;
  const total = xFailures.length + (pdf?.count ?? 0);
  const clash = { xFailures, xUnverified, pdf, total, ok: total === 0 && pdf !== null && xUnverified.length === 0 };

  const cov = input.coverage ?? null;
  const coverage = {
    percent: cov?.percent ?? null,
    covered: cov?.covered,
    applicable: cov?.applicable,
    source: cov?.source ?? null,
    note: cov?.note,
    threshold: COVERAGE_THRESHOLD,
    ok: cov?.percent != null && cov.percent >= COVERAGE_THRESHOLD,
  };

  const reasons: string[] = [];
  if (!score.ok) {
    reasons.push(
      score.denominator === 0
        ? "skor terukur: penyebut 0 (tidak ada aturan terukur yang berlaku)"
        : `skor terukur ${score.percentDisplay} % < ${SCORE_THRESHOLD} % (${score.passed}/${score.denominator})`,
    );
  }
  if (!critical.ok) reasons.push(`aturan kritis gagal: ${critical.failed.join(", ")}`);
  if (pdf === null) reasons.push("hasil bentrok PDF tidak diberikan (--clash); 0 bentrok belum terbukti");
  if (xUnverified.length) reasons.push(`detektor bentrok belum terlatih: ${xUnverified.join(", ")}`);
  if (total > 0) reasons.push(`bentrok teks = ${total} (X-*: ${xFailures.length}, PDF: ${pdf?.count ?? 0})`);
  if (coverage.percent === null) reasons.push(`cakupan butir tidak diketahui${cov?.note ? ` (${cov.note})` : " (--coverage tidak diberikan)"}`);
  else if (!coverage.ok) reasons.push(`cakupan butir ${coverage.percent.toFixed(1)} % < ${COVERAGE_THRESHOLD} %`);

  const implementedIds = new Set(index.implemented);
  const applicableMeasurable = measurable.filter((o) => o.applicable);
  return {
    schema: SCHEMA,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    input: {
      docx: input.docx.path ?? null,
      docxSha256: input.docx.sha256,
      bfix: input.bfix?.path ?? null,
      bfixSha256: input.bfix?.sha256 ?? null,
      spec: input.spec !== undefined,
      pair,
      implementedOnly,
      warnings: input.warnings ?? [],
      structure: {
        sections: layout.sections.length,
        cover: layout.cover?.index ?? null,
        controlSheet: layout.controlSheet?.index ?? null,
        toc: layout.toc?.index ?? null,
        wrappers: layout.wrappers.map((s) => s.index),
        interiors: layout.interiors.map((s) => s.index),
        sealBandTables: layout.sealBandTables.length,
        registerFooters: [...layout.registerTables.keys()],
      },
    },
    rules: {
      catalogMeasurable: index.catalog.filter((c) => c.kind === "measurable").length,
      implemented: implementedIds.size,
      applicableMeasurable: applicableMeasurable.length,
      unimplementedApplicable: outcomes.filter((o) => o.applicable && !o.implemented).map((o) => o.id),
    },
    score: { ...score, byFamily },
    critical,
    clash,
    coverage,
    verdict: reasons.length === 0 ? "PASS" : "FAIL",
    reasons,
    outcomes,
  };
}
