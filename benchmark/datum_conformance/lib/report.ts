/**
 * S20: laporan konformitas per templat x bahasa (JSON = `ConformanceReport` apa adanya, MD = ringkasan
 * yang dapat dibaca) dan ringkasan batch.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PairContext } from "../rules/types";
import { CLASH_KIND_CODES, CLASH_KINDS } from "./clash";
import type { ConformanceReport } from "./score";

export function reportBaseName(pair: Pick<PairContext, "slug" | "language">): string {
  return `${pair.slug.replace(/[^A-Za-z0-9._-]/g, "_")}_${pair.language}`;
}

/** Sel tabel Markdown: tanpa baris baru, `|` di-escape. */
export function mdCell(s: string | number | null | undefined): string {
  return String(s ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

const pct = (v: number | null) => (v === null ? "tidak diketahui" : `${v.toFixed(1)} %`);

export function renderMarkdown(r: ConformanceReport): string {
  const p = r.input.pair;
  const L: string[] = [];
  L.push(`# Konformitas DATUM Rev A: ${p.slug} (${p.language}, ${p.tier})`);
  L.push("");
  L.push(`Putusan: **${r.verdict}**`);
  if (r.reasons.length) {
    L.push("");
    for (const why of r.reasons) L.push(`- ${why}`);
  }
  L.push("");
  L.push("| Ukuran | Nilai | Ambang | Lulus |");
  L.push("|---|---|---|---|");
  L.push(`| Skor terukur | ${r.score.percentDisplay} % (${r.score.passed}/${r.score.denominator}) | >= ${r.score.threshold} % | ${r.score.ok ? "ya" : "tidak"} |`);
  L.push(`| Aturan kritis | ${r.critical.passed.length}/${r.critical.required.length} | semua | ${r.critical.ok ? "ya" : "tidak"} |`);
  L.push(`| Cakupan butir | ${pct(r.coverage.percent)} | >= ${r.coverage.threshold} % | ${r.coverage.ok ? "ya" : "tidak"} |`);
  L.push(`| Bentrok teks | ${r.clash.total}${r.clash.pdf ? "" : " (PDF belum diperiksa)"} | 0 | ${r.clash.ok ? "ya" : "tidak"} |`);
  L.push("");
  L.push("## Masukan");
  L.push("");
  L.push("| Medan | Nilai |");
  L.push("|---|---|");
  L.push(`| DOCX | ${mdCell(r.input.docx)} |`);
  L.push(`| sha256 | ${r.input.docxSha256} |`);
  L.push(`| Kode jenis / kicker | ${mdCell(p.typeCode)} / ${mdCell(p.kicker || "(kosong)")} |`);
  L.push(`| Sampel | producedBy=${p.producedBy}, copyControl=${p.hasCopyControl}, agentRevisionText=${p.agentRevisionText} |`);
  L.push(`| B-FIX | ${mdCell(r.input.bfix ?? "-")} |`);
  L.push(`| Spec templat | ${r.input.spec ? "ada" : "-"} |`);
  L.push(`| Mode | ${r.input.implementedOnly ? "hanya aturan terimplementasi" : "aturan belum terimplementasi = UNEXERCISED"} |`);
  const st = r.input.structure;
  L.push(
    `| Struktur (R0) | ${st.sections} seksi; sampul ${st.cover ?? "-"}, lembar kendali ${st.controlSheet ?? "-"}, daftar isi ${st.toc ?? "-"}; pembungkus [${st.wrappers.join(", ")}]; interior ${st.interiors.length}; pita segel ${st.sealBandTables}; footer register ${st.registerFooters.length} |`,
  );
  L.push(`| Dibuat | ${r.generatedAt} |`);
  for (const w of r.input.warnings) L.push(`| Peringatan | ${mdCell(w)} |`);
  L.push("");
  L.push("## Skor per keluarga");
  L.push("");
  L.push(`Aturan terukur katalog ${r.rules.catalogMeasurable}, terimplementasi ${r.rules.implemented}, berlaku untuk pasangan ini ${r.rules.applicableMeasurable}.`);
  if (r.rules.unimplementedApplicable.length) L.push(`Belum terimplementasi (berlaku): ${r.rules.unimplementedApplicable.join(", ")}.`);
  L.push("");
  L.push("| Keluarga | Lulus | Penyebut |");
  L.push("|---|---|---|");
  for (const [fam, v] of Object.entries(r.score.byFamily)) L.push(`| ${fam} | ${v.passed} | ${v.denominator} |`);
  L.push("");
  L.push("## Aturan kritis");
  L.push("");
  L.push("| Kode | Status | Bukti |");
  L.push("|---|---|---|");
  for (const id of r.critical.required) {
    const o = r.outcomes.find((x) => x.id === id);
    L.push(`| ${id} | ${o?.status ?? "-"} | ${mdCell(o?.evidence)} |`);
  }
  L.push("");
  L.push("## Bentrok teks");
  L.push("");
  L.push(`Detektor teks pembungkus gagal: ${r.clash.xFailures.length ? r.clash.xFailures.join(", ") : "tidak ada"}.`);
  if (r.clash.xUnverified.length) L.push(`Detektor belum terlatih: ${r.clash.xUnverified.join(", ")}.`);
  if (r.clash.pdf) {
    L.push(`PDF ${mdCell(r.clash.pdf.file)} (${r.clash.pdf.pages} halaman): ${r.clash.pdf.count} bentrok.`);
    L.push("");
    L.push("| Jenis | Kode | Jumlah |");
    L.push("|---|---|---|");
    for (const k of CLASH_KINDS) L.push(`| ${k} | ${CLASH_KIND_CODES[k]} | ${r.clash.pdf.byKind[k]} |`);
  } else {
    L.push("Hasil bentrok PDF tidak diberikan.");
  }
  L.push("");
  L.push("## Cakupan butir");
  L.push("");
  L.push(
    r.coverage.percent === null
      ? `Tidak diketahui${r.coverage.note ? ` (${mdCell(r.coverage.note)})` : ""}.`
      : `${r.coverage.percent.toFixed(1)} %${r.coverage.applicable !== undefined ? ` (${r.coverage.covered}/${r.coverage.applicable})` : ""} dari ${mdCell(r.coverage.source)}.`,
  );
  L.push("");
  L.push("## Hasil per aturan");
  L.push("");
  L.push("| Kode | Keluarga | Butir | Kritis | Status | Bukti |");
  L.push("|---|---|---|---|---|---|");
  for (const o of r.outcomes) {
    if (!o.applicable) continue;
    L.push(`| ${o.id} | ${o.family} | ${mdCell(o.title)} | ${o.critical ? "ya" : "-"} | ${o.status} | ${mdCell(o.evidence)} |`);
  }
  const notApplicable = r.outcomes.filter((o) => !o.applicable).map((o) => o.id);
  if (notApplicable.length) {
    L.push("");
    L.push(`Tidak berlaku untuk pasangan ini: ${notApplicable.join(", ")}.`);
  }
  L.push("");
  return L.join("\n");
}

export interface WrittenReport {
  readonly json: string;
  readonly md: string;
}

export function writeReport(r: ConformanceReport, outDir: string, baseName = reportBaseName(r.input.pair)): WrittenReport {
  mkdirSync(outDir, { recursive: true });
  const json = path.join(outDir, `${baseName}.json`);
  const md = path.join(outDir, `${baseName}.md`);
  writeFileSync(json, `${JSON.stringify(r, null, 2)}\n`);
  writeFileSync(md, renderMarkdown(r));
  return { json, md };
}

export interface BatchSummaryEntry {
  readonly name: string;
  readonly docx: string;
  readonly verdict: "PASS" | "FAIL" | "ERROR";
  readonly score?: string;
  readonly critical?: string;
  readonly coverage?: number | null;
  readonly clashes?: number;
  readonly reasons: readonly string[];
  readonly json?: string;
}

export function renderBatchMarkdown(entries: readonly BatchSummaryEntry[], generatedAt: string): string {
  const L = ["# Ringkasan konformitas DATUM Rev A", "", `Dibuat ${generatedAt}.`, "", "| Pasangan | Putusan | Skor | Kritis | Cakupan | Bentrok | Alasan |", "|---|---|---|---|---|---|---|"];
  for (const e of entries) {
    L.push(
      `| ${mdCell(e.name)} | ${e.verdict} | ${e.score ?? "-"} | ${e.critical ?? "-"} | ${e.coverage == null ? "-" : `${e.coverage.toFixed(1)} %`} | ${e.clashes ?? "-"} | ${mdCell(e.reasons.join("; "))} |`,
    );
  }
  L.push("");
  return L.join("\n");
}
