/**
 * Tipe hasil dan penyaji Markdown laporan paritas (H05, S67).
 */

export const VERDICTS = ["FAIL", "NODE_ERROR", "REF_ERROR", "COMPARE_ERROR", "NOT_READY", "DIAGNOSIS", "NO_REFERENCE", "SKIPPED", "PASS"] as const;
export type Verdict = (typeof VERDICTS)[number];

/** Keparahan untuk agregasi (besar = lebih buruk). */
export const SEVERITY: Readonly<Record<Verdict, number>> = {
  FAIL: 8,
  NODE_ERROR: 7,
  REF_ERROR: 7,
  COMPARE_ERROR: 7,
  NOT_READY: 5,
  DIAGNOSIS: 2,
  NO_REFERENCE: 2,
  SKIPPED: 1,
  PASS: 0,
};

/** Vonis yang membuat exit 1 (NOT_READY hanya dengan --strict). */
export const FAILING: ReadonlySet<Verdict> = new Set<Verdict>(["FAIL", "NODE_ERROR", "REF_ERROR", "COMPARE_ERROR"]);

export interface FormatResult {
  format: string;
  /** Kelas paritas research/06 §6.2 (null bila tidak ada pembanding). */
  class: string | null;
  verdict: Verdict;
  /** "compare" = compare.py; "lint" = vonis dari lint Node (CC/HT tanpa acuan); "registry" = drawn=false. */
  mode: "compare" | "lint" | "registry" | "none";
  sheet?: number;
  ref?: string;
  node?: string;
  compareReport?: string;
  compareExit?: number | null;
  failedGates?: string[];
  /** SR46-P2: jumlah cek gagal (gerbang + diagnosis) dari CompareReport `failedChecks`; tidak mengubah vonis. */
  failedChecks?: number;
  /** "CLEAN" (0 cek gagal) atau "DIFF". */
  checkLevel?: "CLEAN" | "DIFF";
  thresholds?: string[];
  note?: string;
}

/** Label tampilan vonis: DIAGNOSIS membawa jumlah cek gagal, mis. `DIAGNOSIS(0)` lawan `DIAGNOSIS(14)` (SR46-P2). */
export function verdictLabel(r: Pick<FormatResult, "verdict" | "failedChecks">): string {
  return r.verdict === "DIAGNOSIS" && typeof r.failedChecks === "number" ? `DIAGNOSIS(${r.failedChecks})` : r.verdict;
}

export interface StepInfo {
  exitCode: number | null;
  status: string;
  report?: string;
  errorCode?: string;
  message?: string;
  durationMs: number;
}

export interface FixtureResult {
  id: string;
  kind: string;
  code?: string;
  file: string;
  workDir: string;
  verdict: Verdict;
  formats: FormatResult[];
  ref: StepInfo | null;
  node: StepInfo | null;
  lint?: { releaseStatus: string; banner: string } | null;
  notes: string[];
  durationMs: number;
}

export interface RunSummary {
  schema: "studio.parity.summary/v1";
  tool: "scripts/parity/run/run_parity.ts";
  correlationId: string;
  startedAt: string;
  finishedAt: string;
  fixturesDir: string;
  outDir: string;
  only: string | null;
  formats: string[];
  python: string;
  strict: boolean;
  counts: {
    fixtures: number;
    skippedFiles: number;
    byVerdict: Record<string, number>;
    formatsByVerdict: Record<string, number>;
    /** SR46-P2: format bervonis DIAGNOSIS menurut tingkat (CLEAN = 0 cek gagal, DIFF = >= 1). */
    diagnosisByLevel: Record<string, number>;
  };
  skipped: Array<{ file: string; reason: string }>;
  fixtures: Array<
    Pick<FixtureResult, "id" | "kind" | "code" | "verdict" | "workDir"> & {
      formats: Record<string, Verdict>;
      /** SR46-P2: jumlah cek gagal per format yang dibandingkan compare.py. */
      failedChecks?: Record<string, number>;
    }
  >;
  exitCode: number;
  durationMs: number;
}

export function worst(list: readonly Verdict[]): Verdict {
  let w: Verdict = "SKIPPED";
  let first = true;
  for (const v of list) {
    if (first || SEVERITY[v] > SEVERITY[w]) w = v;
    first = false;
  }
  return w;
}

function cell(s: string | undefined | null): string {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function fmtKey(r: FormatResult): string {
  return r.sheet && r.sheet > 1 ? `${r.format}#${r.sheet}` : r.format;
}

export function fixtureMarkdown(f: FixtureResult): string {
  const lines: string[] = [];
  lines.push(`# Paritas fixture ${f.id}`, "");
  lines.push(`- Jenis: ${f.kind}${f.code ? ` (${f.code})` : ""}`);
  lines.push(`- Berkas: \`${f.file}\``);
  lines.push(`- Vonis: **${f.verdict}**`);
  lines.push(`- Acuan Python: ${f.ref ? `${f.ref.status} (exit ${f.ref.exitCode ?? "-"}, ${f.ref.durationMs} ms)${f.ref.errorCode ? ` ${f.ref.errorCode}` : ""}` : "tidak dijalankan"}`);
  lines.push(`- Node: ${f.node ? `${f.node.status} (exit ${f.node.exitCode ?? "-"}, ${f.node.durationMs} ms)${f.node.errorCode ? ` ${f.node.errorCode}` : ""}` : "tidak dijalankan"}`);
  if (f.lint) lines.push(`- Lint Node: ${f.lint.releaseStatus} - ${f.lint.banner}`);
  lines.push("", "| Format | Kelas | Mode | Vonis | Gerbang gagal | Catatan |", "|---|---|---|---|---|---|");
  for (const r of f.formats) {
    lines.push(`| ${cell(fmtKey(r))} | ${cell(r.class ?? "-")} | ${r.mode} | ${verdictLabel(r)} | ${cell((r.failedGates ?? []).join(", ") || "-")} | ${cell(r.note ?? "")} |`);
  }
  if (f.notes.length > 0) {
    lines.push("", "Catatan:");
    for (const n of f.notes) lines.push(`- ${n}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function summaryMarkdown(s: RunSummary, results: readonly FixtureResult[]): string {
  const lines: string[] = [];
  lines.push("# Ringkasan harness paritas", "");
  lines.push(`- Run: \`${s.correlationId}\` (${s.startedAt} - ${s.finishedAt}, ${Math.round(s.durationMs / 1000)} s)`);
  lines.push(`- Fixture: \`${s.fixturesDir}\`${s.only ? `, filter \`${s.only}\`` : ""}; format: ${s.formats.join(", ")}`);
  lines.push(`- Keluaran: \`${s.outDir}\`; Python: \`${s.python}\``);
  lines.push(`- Exit: ${s.exitCode}${s.strict ? " (strict: NOT_READY dihitung gagal)" : ""}`, "");
  lines.push("## Hitungan", "", "| Vonis | Fixture | Format |", "|---|---|---|");
  for (const v of VERDICTS) {
    const a = s.counts.byVerdict[v] ?? 0;
    const b = s.counts.formatsByVerdict[v] ?? 0;
    if (a || b) lines.push(`| ${v} | ${a} | ${b} |`);
  }
  lines.push(`| Total | ${s.counts.fixtures} | ${Object.values(s.counts.formatsByVerdict).reduce((x, y) => x + y, 0)} |`, "");
  const lv = s.counts.diagnosisByLevel ?? {};
  if (Object.keys(lv).length > 0) {
    lines.push(`Format DIAGNOSIS menurut tingkat (SR46-P2): CLEAN (0 cek gagal) ${lv.CLEAN ?? 0}, DIFF (>= 1 cek gagal) ${lv.DIFF ?? 0}.`, "");
  }
  lines.push("## Per fixture", "", "| Fixture | Jenis | Kode | Vonis | Per format |", "|---|---|---|---|---|");
  for (const f of results) {
    const per = f.formats.map((r) => `${fmtKey(r)}=${verdictLabel(r)}`).join(", ") || "-";
    lines.push(`| ${cell(f.id)} | ${f.kind} | ${cell(f.code ?? "-")} | ${f.verdict} | ${cell(per)} |`);
  }
  if (s.skipped.length > 0) {
    lines.push("", "## Berkas dilewati", "", "| Berkas | Alasan |", "|---|---|");
    for (const k of s.skipped) lines.push(`| ${cell(k.file)} | ${cell(k.reason)} |`);
  }
  lines.push("");
  return lines.join("\n");
}
