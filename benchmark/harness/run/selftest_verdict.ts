/**
 * Uji mandiri FIX-5 (D-118, R03, R20) tanpa DB, browser, atau berkas:
 *
 *   npx tsx benchmark/harness/run/selftest_verdict.ts
 *
 * Memeriksa aturan vonis/exit (`decideVerdict`) dan bawaan CLI (`parseConfig`):
 * run resmi = bawaan; pengganti raster atau raster acuan tidak pernah PASS dan
 * tidak pernah exit 0; figur mesin hilang = FAIL; python dari
 * STUDIO_HARNESS_PYTHON. Exit 0 = semua kasus lulus, 1 = ada yang gagal.
 *
 * SR-34: pemilihan skema masukan (`--schema auto|v1|v2`, bawaan v2 bila berkas
 * ada, jatuh ke v1 dengan peringatan), deteksi `$schema` doc/templat, dan
 * HELP memuat flag v2. Keberadaan berkas disuntik (tanpa I/O).
 *
 * RQ-9: pemetaan spec S94 -> ChartV2 / DiagramSpecV2 (`figures_v2.ts`, adaptor
 * murni adapt-v1) pada spec sintetis di memori.
 */
import assert from "node:assert/strict";
import {
  DEFAULT_DOC_V1,
  DEFAULT_DOC_V2,
  DEFAULT_TEMPLATE_V1,
  DEFAULT_TEMPLATE_V2,
  HELP,
  PYTHON_ENV,
  UsageError,
  parseConfig,
} from "./lib/config";
import { mapFigureSpecToV2 } from "./lib/figures_v2";
import { decideVerdict } from "./lib/report";
import { detectDocSchema, detectTemplateSchema } from "./lib/schema";

const posix = (p: string): string => p.split("\\").join("/");
const V2_ALL = (): boolean => true;
const V2_NONE = (p: string): boolean => !posix(p).includes(".v2.");

const PASS4 = ["PASS", "PASS", "PASS", "PASS"] as const;
const cases: Array<[string, () => void]> = [
  ["resmi, kriteria lulus, semua figur mesin -> PASS exit 0", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "OFFICIAL", missing: 0, notFromEngine: 0, blocking: false, compareExit2: false });
    assert.equal(v.overall, "PASS");
    assert.equal(v.exitCode, 0);
  }],
  ["resmi, figur mesin hilang -> FAIL exit 1 walau kriteria lulus", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "OFFICIAL", missing: 1, notFromEngine: 0, blocking: true, compareExit2: false });
    assert.equal(v.overall, "FAIL");
    assert.equal(v.exitCode, 1);
  }],
  ["diagnosis pengganti, fallback 1, kriteria lulus -> PASS-DEGRADED exit 1", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "DIAGNOSIS_FALLBACK", missing: 0, notFromEngine: 1, blocking: false, compareExit2: false });
    assert.equal(v.overall, "PASS-DEGRADED");
    assert.equal(v.exitCode, 1);
  }],
  ["diagnosis raster acuan, kriteria lulus -> PASS-DEGRADED exit 1", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "DIAGNOSIS_RASTER", missing: 0, notFromEngine: 15, blocking: false, compareExit2: false });
    assert.equal(v.overall, "PASS-DEGRADED");
    assert.equal(v.exitCode, 1);
  }],
  ["resmi, figur chart tidak tersubstitusi (raster) -> PASS-DEGRADED exit 1", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "OFFICIAL", missing: 0, notFromEngine: 1, blocking: false, compareExit2: false });
    assert.equal(v.overall, "PASS-DEGRADED");
    assert.equal(v.exitCode, 1);
  }],
  ["diagnosis pengganti tanpa fallback terpakai -> tetap exit 1 (bukan run resmi)", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "DIAGNOSIS_FALLBACK", missing: 0, notFromEngine: 0, blocking: false, compareExit2: false });
    assert.equal(v.exitCode, 1);
  }],
  ["kriteria gagal + fallback -> FAIL", () => {
    const v = decideVerdict({ criteria: ["PASS", "FAIL", "PASS", "PASS"], runKind: "DIAGNOSIS_FALLBACK", missing: 0, notFromEngine: 2, blocking: false, compareExit2: false });
    assert.equal(v.overall, "FAIL");
    assert.equal(v.exitCode, 1);
  }],
  ["kriteria tidak dijalankan -> INCOMPLETE exit 1", () => {
    const v = decideVerdict({ criteria: ["NOT-RUN", "NOT-RUN", "NOT-RUN", "NOT-RUN"], runKind: "OFFICIAL", missing: 0, notFromEngine: 0, blocking: false, compareExit2: false });
    assert.equal(v.overall, "INCOMPLETE");
    assert.equal(v.exitCode, 1);
  }],
  ["resmi PASS tetapi langkah NOT_READY -> exit 1", () => {
    const v = decideVerdict({ criteria: PASS4, runKind: "OFFICIAL", missing: 0, notFromEngine: 0, blocking: true, compareExit2: false });
    assert.equal(v.exitCode, 1);
  }],
  ["bawaan CLI = run resmi (engine, fallback none)", () => {
    const c = parseConfig([], {});
    assert.ok(c);
    assert.equal(c.runKind, "OFFICIAL");
    assert.equal(c.figures, "engine");
    assert.equal(c.figureFallback, "none");
  }],
  ["--diagnosis-raster = DIAGNOSIS_RASTER; --figure-fallback raster = DIAGNOSIS_FALLBACK", () => {
    assert.equal(parseConfig(["--diagnosis-raster"], {})?.runKind, "DIAGNOSIS_RASTER");
    assert.equal(parseConfig(["--figures", "raster"], {})?.runKind, "DIAGNOSIS_RASTER");
    assert.equal(parseConfig(["--figure-fallback", "raster"], {})?.runKind, "DIAGNOSIS_FALLBACK");
  }],
  ["--official menolak opsi raster; --with-diagnosis-raster hanya untuk run resmi", () => {
    assert.throws(() => parseConfig(["--official", "--figure-fallback", "raster"], {}), UsageError);
    assert.throws(() => parseConfig(["--official", "--diagnosis-raster"], {}), UsageError);
    assert.throws(() => parseConfig(["--diagnosis-raster", "--with-diagnosis-raster"], {}), UsageError);
    assert.equal(parseConfig(["--official", "--with-diagnosis-raster"], {})?.withDiagnosisRaster, true);
  }],
  [`python: --python > env ${PYTHON_ENV} > bawaan (R20)`, () => {
    const env = { [PYTHON_ENV]: "C:\\venv\\python.exe" };
    const a = parseConfig([], env);
    assert.equal(a?.pythonSource, "env");
    assert.ok(a?.python.endsWith("python.exe"));
    assert.equal(parseConfig(["--python", "C:\\x\\py.exe"], env)?.pythonSource, "arg");
    assert.equal(parseConfig([], {})?.pythonSource, "default");
  }],
  ["SR-34 auto + kedua berkas v2 ada -> bawaan v2, tanpa peringatan", () => {
    const c = parseConfig([], {}, V2_ALL);
    assert.ok(c);
    assert.equal(c.schema.requested, "auto");
    assert.equal(c.schema.defaults, "v2");
    assert.ok(posix(c.doc).endsWith(DEFAULT_DOC_V2));
    assert.ok(posix(c.template).endsWith(DEFAULT_TEMPLATE_V2));
    assert.equal(c.schema.fallbackWarning, null);
  }],
  ["SR-34 auto + berkas v2 belum ada -> jatuh ke v1 dengan peringatan", () => {
    const c = parseConfig([], {}, V2_NONE);
    assert.ok(c);
    assert.equal(c.schema.defaults, "v1");
    assert.ok(posix(c.doc).endsWith(DEFAULT_DOC_V1));
    assert.ok(posix(c.template).endsWith(DEFAULT_TEMPLATE_V1));
    assert.match(c.schema.fallbackWarning ?? "", /doc\.v2\.json.*JATUH KE MASUKAN v1/);
  }],
  ["SR-34 auto + hanya satu berkas v2 -> tetap v1 (keduanya wajib)", () => {
    const c = parseConfig([], {}, (p) => !posix(p).endsWith(DEFAULT_TEMPLATE_V2));
    assert.equal(c?.schema.defaults, "v1");
    assert.ok(c?.schema.fallbackWarning);
  }],
  ["SR-34 --schema v2 tanpa berkas -> UsageError; dengan berkas -> v2", () => {
    assert.throws(() => parseConfig(["--schema", "v2"], {}, V2_NONE), UsageError);
    assert.equal(parseConfig(["--schema", "v2"], {}, V2_ALL)?.schema.defaults, "v2");
    // --doc/--template eksplisit: berkas bawaan v2 tidak dipakai, tidak wajib ada.
    const c = parseConfig(["--schema", "v2", "--doc", "x/doc.v2.json", "--template", "x/template.v2.json"], {}, V2_NONE);
    assert.equal(c?.schema.docFrom, "arg");
    assert.ok(posix(c?.doc ?? "").endsWith("x/doc.v2.json"));
  }],
  ["SR-34 --schema v1 -> masukan v1 walau berkas v2 ada; nilai --schema tidak sah ditolak", () => {
    const c = parseConfig(["--schema", "v1"], {}, V2_ALL);
    assert.equal(c?.schema.defaults, "v1");
    assert.ok(posix(c?.doc ?? "").endsWith(DEFAULT_DOC_V1));
    assert.equal(c?.schema.fallbackWarning, null);
    assert.throws(() => parseConfig(["--schema", "v3"], {}, V2_ALL), UsageError);
  }],
  ["SR-34 auto + --doc dan --template eksplisit -> tanpa peringatan jatuh", () => {
    const c = parseConfig(["--doc", "a.json", "--template", "b.json"], {}, V2_NONE);
    assert.equal(c?.schema.fallbackWarning, null);
  }],
  ["SR-34 deteksi skema doc/templat", () => {
    assert.equal(detectDocSchema({ $schema: "studio.doc/v1" }), "studio.doc/v1");
    assert.equal(detectDocSchema({ $schema: "studio.doc/v2" }), "studio.doc/v2");
    assert.equal(detectDocSchema({ $schema: "studio.chapter/v2" }), null);
    assert.equal(detectDocSchema([]), null);
    assert.equal(detectTemplateSchema({ schema: "studio.template/v2", preset: { slug: "x" } }), "studio.template/v2");
    assert.equal(detectTemplateSchema({ $schema: "studio.template/v2" }), "studio.template/v2");
    assert.equal(detectTemplateSchema({ base: "datum-kanonik", meta: {} }), "template-profile/v1");
    assert.equal(detectTemplateSchema("x"), null);
  }],
  ["SR-34 --help memuat flag v2", () => {
    for (const t of ["--schema auto|v1|v2", DEFAULT_DOC_V2, DEFAULT_TEMPLATE_V2, "studio.doc/v2", "studio.template/v2"]) assert.ok(HELP.includes(t), t);
    assert.equal(parseConfig(["--help"], {}, V2_ALL), null);
  }],
  ["RQ-9 chart S94 komposit -> ChartV2 (code + panels + highlight, tanpa medan ukuran/tampilan)", () => {
    const spec = {
      $schema: "studio.chart/v1", kind: "composite", id: "Gambar 8.1", title: "t", source: "s", widthMm: 166, heightMm: 220,
      apparatus: "page", inDocument: true, style: "gallery", note: "catatan",
      composite: {
        columns: 3, gapMm: 4.3,
        panels: [
          { name: "Bar urut", code: "P-01", spec: { kind: "P-01", id: "P-01", style: "gallery", heightMm: 44, dec: 0, params: { "chart.kind.P-01.sort": "valueDesc" },
            data: { shape: "categorical", points: [{ label: "A", value: 2, accent: true }, { label: "B", value: 1 }] } } },
          { name: "Grouped", code: "P-03", axisNote: "x / y", spec: { kind: "P-03", accent: { series: "real" },
            data: { shape: "series", categories: ["K1"], series: [{ name: "real", values: [1] }] } } },
        ],
      },
    };
    const m = mapFigureSpecToV2("chart", spec);
    assert.deepEqual(Object.keys(m.fields).sort(), ["code", "note", "panels"]);
    assert.equal(m.fields.code, "composite");
    const panels = m.fields.panels as Array<Record<string, unknown>>;
    assert.equal(panels.length, 2);
    assert.deepEqual(panels[0], { name: "Bar urut", code: "P-01", data: { shape: "categorical", points: [{ label: "A", value: 2 }, { label: "B", value: 1 }] }, highlight: ["A"], dec: 0 });
    assert.deepEqual(panels[1].highlight, ["real"]);
    assert.equal(panels[1].axisNote, "x / y");
    for (const k of ["id", "title", "widthMm", "heightMm", "apparatus", "inDocument", "style", "columns", "gapMm"]) assert.ok((m.stripped[k] ?? 0) >= 1, k);
    assert.equal(m.renamed["accent->highlight"], 2);
    assert.equal(m.stripped.caption, undefined); // pengisi amplop tidak bocor ke jejak; $schema dikonsumsi adaptor tanpa hitungan
  }],
  ["RQ-9 chart S94 tunggal -> ChartV2 data + limit {value,label}", () => {
    const m = mapFigureSpecToV2("chart", { $schema: "studio.chart/v1", kind: "P-11", widthMm: 128, limit: 55, limitLabel: "batas", unit: "dB(A)",
      data: { shape: "categorical", points: [{ label: "x", value: 50 }] } });
    assert.deepEqual(m.fields, { code: "P-11", data: { shape: "categorical", points: [{ label: "x", value: 50 }] }, unit: "dB(A)", limit: { value: 55, label: "batas" } });
  }],
  ["RQ-9 diagram S94 -> DiagramSpecV2 (buang $schema/id/title/width_mm/apparatus; u simpul tetap, D-172)", () => {
    const m = mapFigureSpecToV2("diagram", {
      $schema: "studio.diagram/v1", family: "rack", id: "9.1", title: "t", width_mm: 166, apparatus: "page", classification: "TERBATAS",
      nodes: [{ id: "n1", label: "Server", u: 2 }], edges: [], legend: ["l"],
    });
    assert.deepEqual(m.fields, { spec: { family: "rack", classification: "TERBATAS", nodes: [{ id: "n1", label: "Server", u: 2 }], edges: [], legend: ["l"] } });
    for (const k of ["id", "title", "width_mm", "apparatus"]) assert.equal(m.stripped[k], 1, k);
    assert.deepEqual(m.renamed, {});
  }],
];

let failed = 0;
for (const [name, fn] of cases) {
  try {
    fn();
    process.stdout.write(`ok    ${name}\n`);
  } catch (e) {
    failed++;
    process.stdout.write(`GAGAL ${name}: ${e instanceof Error ? e.message : String(e)}\n`);
  }
}
process.stdout.write(`${cases.length - failed}/${cases.length} lulus\n`);
process.exitCode = failed ? 1 : 0;
