/**
 * Bangun korpus fixture paritas S63 ke `tests/parity/fixtures/`.
 *
 *   npx tsx tests/parity/fixtures/src/build_fixtures.ts [--hs <folder datum-house-style>]
 *
 * Menulis (deterministik, JSON 2 spasi + LF):
 *   doc/*.json        studio.doc/v1 konten-saja (4 berkas, 3 tier; SR-41 D-243)
 *   doc/*.template.json profil tampilan pendamping (override dokumen, mis. layout.railMode)
 *   doc/v2/*.json     salinan studio.doc/v2 (0 medan tampilan DF-01..DF-69)
 *   chart/*.json      studio.chart/v1 per kode beracuan Python (46)
 *   diagram/*.json    studio.diagram/v1 9 keluarga (+ varian), diagram/garis_a/* salinan apa adanya
 *   symbol/*.json     daftar 41 simbol + lembar per dialek (4)
 *   manifest.json     id, jenis, berkas, kelas paritas research/06, acuan
 * Sumber Garis A (HS) hanya dibaca.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CHART_BY_CODE } from "../../../../src/lib/studio/registry/charts";
import { CHART_FIXTURES } from "./charts";
import { DOC_FIXTURES } from "./docs";
import { AUTHORED_DIAGRAMS, GARIS_A_SOURCES, contractFromGarisA } from "./diagrams";
import { DEFAULT_HS_DIR } from "./paths";
import { SYMBOL_COUNTS, SYMBOL_LIST, SYMBOL_SHEETS } from "./symbols";

const FIXTURE_ROOT = path.resolve(__dirname, "..");
const HS_FIXTURE_SUBDIR = "fixtures_diagram";

export interface ManifestEntry {
  id: string;
  kind: "doc" | "docV2" | "docTemplate" | "chart" | "diagram" | "symbol" | "symbolSheet";
  file: string;
  schema?: string;
  parityClass: string[];
  reference: string;
  referenceCli: string;
  tier?: string;
  code?: string;
  dataShape?: string;
  form?: string;
  family?: string;
  dialect?: string;
  symbol?: string;
  sha256: string;
  bytes: number;
  notes?: string;
}

function sha(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Tulis atomik (berkas sementara lalu rename; F-063). */
function writeAtomic(abs: string, data: string | Buffer): void {
  mkdirSync(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, abs);
}

function writeJson(rel: string, value: unknown): { sha256: string; bytes: number } {
  const abs = path.join(FIXTURE_ROOT, rel);
  const text = JSON.stringify(value, null, 2) + "\n";
  writeAtomic(abs, Buffer.from(text, "utf8"));
  return { sha256: sha(text), bytes: Buffer.byteLength(text) };
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): void {
  const hsDir = argValue("--hs") ?? process.env.DATUM_HS_DIR ?? DEFAULT_HS_DIR;
  const entries: ManifestEntry[] = [];
  const sources: Array<{ file: string; origin: string; sha256: string; bytes: number; note: string }> = [];

  // (a) dokumen
  for (const d of DOC_FIXTURES) {
    const w = writeJson(d.file, d.doc);
    entries.push({
      id: d.id,
      kind: "doc",
      file: d.file,
      schema: "studio.doc/v1",
      parityClass: ["DX", "PD", "HT"],
      reference: "DX/PD: adapter S64 scripts/parity/reference/doc/ref_doc.py (DatumDocx Garis A) lalu soffice; HT: tanpa acuan Python (lint + snapshot)",
      referenceCli: "H02",
      tier: d.tier,
      ...w,
      notes: d.notes,
    });
    if (d.templateFile && d.template) {
      const tw = writeJson(d.templateFile, d.template);
      entries.push({
        id: `${d.id}-template`,
        kind: "docTemplate",
        file: d.templateFile,
        parityClass: [],
        reference: `profil tampilan pendamping ${d.file} (dipungut penemuan fixture sebagai <stem>.template.json)`,
        referenceCli: "H01 --template",
        tier: d.tier,
        ...tw,
        notes: `override dokumen dipindah ke templat (D-138/D-139): ${Object.keys(d.template.overrides).sort().join(", ")}`,
      });
    }
    const vw = writeJson(d.v2File, d.v2);
    entries.push({
      id: `${d.id}-v2`,
      kind: "docV2",
      file: d.v2File,
      schema: "studio.doc/v2",
      parityClass: ["DX", "PD", "HT"],
      reference: `DX/PD: acuan Python dari pasangan v1 ${d.file} (ref_doc.py hanya membaca v1); HT: tanpa acuan Python`,
      referenceCli: "H02",
      tier: d.tier,
      ...vw,
      notes: `salinan studio.doc/v2 dari ${d.file} lewat adaptor SR-09 (SR-41)`,
    });
  }

  // (b) diagram: salinan Garis A apa adanya + versi kontrak + spec tambahan
  for (const g of GARIS_A_SOURCES) {
    const srcPath = path.join(hsDir, HS_FIXTURE_SUBDIR, g.source);
    if (!existsSync(srcPath)) throw new Error(`Sumber Garis A tidak ada: ${srcPath} (beri --hs)`);
    const bytes = readFileSync(srcPath);
    writeAtomic(path.join(FIXTURE_ROOT, g.copy), bytes);
    sources.push({
      file: g.copy,
      origin: `HS/${HS_FIXTURE_SUBDIR}/${g.source}`,
      sha256: sha(bytes),
      bytes: bytes.length,
      note: "salinan byte-identik Garis A; bukan fixture kontrak (tanpa $schema, memuat _provenans)",
    });
    const { spec, provenance } = contractFromGarisA(JSON.parse(bytes.toString("utf8")) as Record<string, unknown>);
    const w = writeJson(g.file, spec);
    entries.push({
      id: g.id,
      kind: "diagram",
      file: g.file,
      schema: "studio.diagram/v1",
      parityClass: ["DG"],
      reference: "HS datum_diagram.build_svg (Garis A)",
      referenceCli: "H03 --kind diagram",
      family: g.family,
      ...w,
      notes: `versi kontrak dari ${g.copy}: $schema ditambah, _provenans dipindah ke sini. Provenans: ${provenance ?? "-"}`,
    });
  }
  for (const d of AUTHORED_DIAGRAMS) {
    const w = writeJson(d.file, d.spec);
    entries.push({
      id: d.id,
      kind: "diagram",
      file: d.file,
      schema: "studio.diagram/v1",
      parityClass: ["DG"],
      reference: "HS datum_diagram.build_svg (Garis A)",
      referenceCli: "H03 --kind diagram",
      family: d.family,
      ...w,
      ...(d.notes ? { notes: d.notes } : {}),
    });
  }

  // (c) chart per kode beracuan
  for (const c of CHART_FIXTURES) {
    const def = CHART_BY_CODE.get(c.code);
    if (!def) throw new Error(`kode ${c.code} tidak ada di registri`);
    const file = `chart/${c.code.toLowerCase().replace("-", "")}.json`;
    const w = writeJson(file, c.spec);
    const ref = def.pyRef.kind === "none" ? "none" : `${def.pyRef.kind}:${def.pyRef.ref ?? "?"}`;
    entries.push({
      id: `chart-${c.code}`,
      kind: "chart",
      file,
      schema: "studio.chart/v1",
      parityClass: [def.parityClass ?? "CC"],
      reference: ref,
      referenceCli: "H03 --kind chart",
      code: c.code,
      dataShape: def.dataShape,
      ...(def.pyRef.form ? { form: def.pyRef.form } : {}),
      ...w,
      ...(c.notes ? { notes: c.notes } : {}),
    });
  }

  // (d) simbol: daftar 41 + lembar per dialek
  const listFile = "symbol/symbols.json";
  const lw = writeJson(listFile, { ids: SYMBOL_LIST, counts: SYMBOL_COUNTS, total: SYMBOL_LIST.length });
  for (const id of SYMBOL_LIST) {
    entries.push({
      id: `sy-${id.replace(":", "-")}`,
      kind: "symbol",
      file: listFile,
      parityClass: ["SY"],
      reference: "HS datumsimbol.symbol_svg; port mm RL datum_symbols.render",
      referenceCli: `H03 --kind symbol --spec ${id}`,
      dialect: id.split(":")[0],
      symbol: id,
      ...lw,
    });
  }
  for (const s of SYMBOL_SHEETS) {
    const w = writeJson(s.file, s.spec);
    entries.push({
      id: s.id,
      kind: "symbolSheet",
      file: s.file,
      parityClass: ["SY"],
      reference: "HS datumsimbol.sheet_svg",
      referenceCli: "H03 --kind symbol",
      dialect: s.dialect,
      ...w,
    });
  }

  const count = (k: ManifestEntry["kind"]) => entries.filter((e) => e.kind === k).length;
  const manifest = {
    $schema: "studio.parity.fixtures/v1",
    row: "S63",
    generatedBy: "tests/parity/fixtures/src/build_fixtures.ts",
    validatedBy: "tests/parity/fixtures/src/validate_fixtures.ts",
    dataNote: "Data ilustratif netral (sintetis), bukan data klien.",
    parityClasses: "research/06_chart_map_parity_matrix.md 6.2 (CA, CB1, CB2, CC, DG, SY, DX, PD, HT)",
    counts: {
      doc: count("doc"),
      docV2: count("docV2"),
      docTemplate: count("docTemplate"),
      chart: count("chart"),
      diagram: count("diagram"),
      symbol: count("symbol"),
      symbolSheet: count("symbolSheet"),
      sources: sources.length,
    },
    fixtures: entries,
    sources,
  };
  writeJson("manifest.json", manifest);
  console.log(`fixture tertulis: ${JSON.stringify(manifest.counts)} -> ${FIXTURE_ROOT}`);
}

main();
