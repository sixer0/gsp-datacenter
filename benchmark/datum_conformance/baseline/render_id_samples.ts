/**
 * S05 (datum rev A, AC-7): baseline keluaran Indonesia (ID) yang dapat dirender ulang.
 *
 * Merender sampel dokumen GSP DATUM berbahasa Indonesia lewat jalur render tanpa DB
 * milik pohon kerja SASARAN (`<root>/scripts/parity/run/render_cli.ts`: compose v2 murni
 * `mergeSubmission` -> `composeV2` -> `renderSnapshot`), lalu mencetak sha256 per berkas.
 * Baris lanjutan (S19) menjalankan skrip yang sama pada pohon yang sudah disunting dan
 * membandingkan dengan `--compare <dir baseline>`.
 *
 * Skrip ini sengaja HANYA memakai modul bawaan Node: kode Studio yang dipanggil selalu
 * kode pohon `--root`, bukan kode pohon tempat skrip ini berada.
 *
 *   npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root <repo> --out <dir>
 *       [--inputs <dir inputs beku>] [--compare <dir baseline>] [--runs <n>]
 *
 *   --root     akar repo yang dirender (pohon kerja, worktree tag, salinan rilis)
 *   --out      direktori keluaran (dibuat; subdir `cases/` dikosongkan setiap run)
 *   --inputs   pakai masukan beku (mis. `<baseline>/inputs`) alih-alih membangkitkan ulang
 *              dari `<root>/benchmark/manual000/template.json`; WAJIB untuk banding byte bila
 *              baris lain mengubah profil Manual 000
 *   --compare  banding `<out>/hashes.json` dengan `<dir>/hashes.json`; exit 1 bila ada DIFF
 *   --runs     render setiap kasus n kali (bawaan 2) dan gagal bila sha berbeda antar run
 *
 * Kasus (bahasa ID, tanggal terbit tetap 2026-11-04, benih pid tetap):
 *   a_terbit_<profil>  dokumen TERBIT 7 slot: sampul, lembar kendali, tanda tangan, daftar isi,
 *                      2 bab, referensi, lampiran; derivasi register (Rp 1.250.000,50 dari
 *                      v = 1250000.5, dec 2, unit "Rp") + tabel
 *   b_nota_<profil>    isi yang sama pada tier NOTA (slot sampul/lembar kendali/tanda tangan/
 *                      daftar isi tidak aktif di NOTA menurut kerangka DATUM, jadi tidak dikirim)
 *   profil: datum_gsp  = profil Manual 000 (`benchmark/manual000/template.json`) tanpa override
 *                        `lint.enforcement*` + 4 nilai Δ preset GSP DATUM (seed-studio.ts
 *                        `toDatumGspProfile` + `PRESET_MIGRATIONS`), kerangka 7 slot DATUM
 *           datum_kanonik = preset kanonik (default registri), kerangka 7 slot DATUM
 *
 * Normalisasi: TIDAK ADA pada byte DOCX/HTML. Determinisme dijamin oleh masukan: `meta.issueDate`
 * eksplisit (tanpa "hari ini"), `--pid-seed` tetap, mtime ZIP = issueDate (mesin). Medan yang
 * memang berubah per run (durationMs, jobId, path absolut) hanya ada di `render_report.json` /
 * `render_log.jsonl`, yang tidak di-hash. `--runs` membuktikan determinisme setiap kali.
 *
 * Exit: 0 sukses (dan SAME semua bila --compare), 1 render gagal / tidak deterministik / DIFF,
 * 2 salah pakai.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCHEMA = "datum-id-baseline/v1";
const PID_SEED = "s05-datum-id-baseline";
const FORMATS = "docx,html";

// ── Argumen ──────────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`argumen tak dikenal: ${a}`);
    const k = a.slice(2);
    if (k === "help") {
      out.set("help", "1");
      continue;
    }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Error(`--${k} butuh nilai`);
    out.set(k, v);
    i++;
  }
  return out;
}

const sha256 = (b: Uint8Array | string): string => createHash("sha256").update(b).digest("hex");
const writeJson = (file: string, v: unknown): void => writeFileSync(file, `${JSON.stringify(v, null, 2)}\n`, "utf8");
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));

// ── Masukan sampel ───────────────────────────────────────────────────────

const t = (text: string) => ({ text });

/** Kerangka 7 slot GSP DATUM (register 03 §6.1 SL-01..SL-07 = seed `SKELETON_SLOTS`). */
function datumSlots(): unknown[] {
  return [
    { slotKey: "cover", sectionType: "cover", label: "Sampul", position: 1, required: true, positionLocked: true, repeatable: false, contentMode: "MIXED", tiers: ["TERBIT", "SERAH"], admits: [], essentials: {} },
    { slotKey: "controlSheet", sectionType: "controlSheet", label: "Lembar Kendali", position: 2, required: true, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: ["TERBIT", "SERAH"], admits: [], essentials: {} },
    { slotKey: "signature", sectionType: "signatureBlock", label: "Tanda Tangan", position: 3, required: true, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: ["TERBIT", "SERAH"], admits: [], essentials: { "slot.placement": "inControlSheet" } },
    { slotKey: "toc", sectionType: "toc", label: "Daftar Isi", position: 4, required: true, positionLocked: false, repeatable: false, contentMode: "AUTO", tiers: ["TERBIT", "SERAH"], admits: [], essentials: {} },
    { slotKey: "content", sectionType: "chapter", label: "Isi", position: 5, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: "INPUT", tiers: [], admits: ["paragraph", "table", "derivation", "list", "aside"], essentials: {} },
    { slotKey: "references", sectionType: "sourceRegister", label: "Referensi", position: 6, required: false, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: [], admits: [], essentials: {} },
    { slotKey: "appendices", sectionType: "appendix", label: "Lampiran", position: 7, required: false, positionLocked: true, repeatable: true, contentMode: "INPUT", tiers: [], admits: ["paragraph", "table", "derivation", "list", "aside"], essentials: {} },
  ];
}

/** Nilai Δ preset GSP DATUM (prisma/seed-studio.ts PRESET_MIGRATIONS[datum-gsp].decided di tag prod-v2.1-20261104). */
const GSP_DECIDED: Readonly<Record<string, unknown>> = {
  "device.registerBlock.boldFields": ["nomor dokumen", "revisi", "nomor lembar", "jumlah lembar", "klasifikasi"],
  "symbol.sheet.fit": true,
  "table.widthClass": "full",
  "render.rail.renderer": "framePr",
};
const GSP_DROPPED_OVERRIDE_PREFIX = "lint.enforcement";

/** Profil preset `datum-gsp` dari profil Manual 000 pohon sasaran (murni; tanpa DB). */
function datumGspPreset(root: string): Record<string, unknown> {
  const src = readJson(path.join(root, "benchmark", "manual000", "template.json")) as Record<string, unknown>;
  const overrides = Object.fromEntries(Object.entries((src.overrides ?? {}) as Record<string, unknown>).filter(([k]) => !k.startsWith(GSP_DROPPED_OVERRIDE_PREFIX)));
  return {
    base: src.base,
    slug: "datum-gsp",
    name: "GSP DATUM",
    kind: "DOCUMENT",
    overrides: { ...overrides, ...GSP_DECIDED },
    ...(src.roleFormats ? { roleFormats: src.roleFormats } : {}),
    ...(src.sectionPlan ? { sectionPlan: src.sectionPlan } : {}),
    ...(src.assets ? { assets: src.assets } : {}),
    changeNote: "S05 baseline: Manual 000 tanpa lint.enforcement* + Δ GSP DATUM",
  };
}

function templateV2(presetSlug: string | null): Record<string, unknown> {
  return {
    $schema: "studio.template/v2",
    ...(presetSlug ? { preset: { slug: presetSlug } } : {}),
    essentials: { "doc.language": "ID" },
    skeleton: { slots: datumSlots() },
  };
}

const REGISTER = {
  biaya_material: { v: 1000000.25, dec: 2, unit: "Rp", mark: "TERUKUR", src: "RAB pemeliharaan 2026 butir 1" },
  biaya_jasa: { v: 250000.25, dec: 2, unit: "Rp", mark: "TERUKUR", src: "RAB pemeliharaan 2026 butir 2" },
  biaya_total: { v: 1250000.5, dec: 2, unit: "Rp", mark: "DITURUNKAN", src: "Jumlah butir 1 dan 2" },
};

function contentSections(): Record<string, unknown> {
  return {
    content: {
      type: "chapter",
      outline: [{ key: "1" }, { key: "2" }],
      chapters: [
        {
          key: "1",
          title: t("Lingkup Kajian"),
          sections: [
            {
              title: t("Tujuan"),
              blocks: [
                { type: "paragraph", text: "Kajian ini menghitung biaya pemeliharaan peralatan 150 kV di Gardu Induk Cikupa untuk tahun anggaran 2026." },
                { type: "list", ordered: true, items: [{ text: "Inventaris peralatan primer." }, { text: "Rekapitulasi biaya material dan jasa." }] },
              ],
            },
          ],
        },
        {
          key: "2",
          title: t("Rekapitulasi Biaya"),
          sections: [
            {
              title: t("Derivasi Biaya Total"),
              blocks: [
                { type: "paragraph", runs: [{ t: "Biaya total pemeliharaan " }, { t: "tidak melampaui", strong: true }, { t: " pagu anggaran." }] },
                {
                  type: "derivation",
                  title: t("Biaya pemeliharaan 2026"),
                  lines: [
                    { label: t("Biaya material"), value: { registerKey: "biaya_material" } },
                    { label: t("Biaya jasa"), value: { registerKey: "biaya_jasa" } },
                  ],
                  result: { label: t("Biaya total"), expr: "biaya_material + biaya_jasa", registerKey: "biaya_total" },
                  verdict: { label: t("Terhadap pagu"), registerKey: "biaya_total", limit: 1500000 },
                  closing: t("Bila harga material naik lebih dari 20 %, pagu terlampaui."),
                },
                {
                  type: "table",
                  caption: t("Rincian biaya pemeliharaan"),
                  columns: [{ role: "text" }, { role: "numeral", unit: "Rp" }],
                  rows: [
                    { kind: "header", cells: [t("Butir"), t("Biaya")] },
                    { cells: [t("Material"), t("1.000.000,25")] },
                    { cells: [t("Jasa"), t("250.000,25")] },
                    { cells: [t("Jumlah"), t("1.250.000,50")] },
                  ],
                  source: { text: "RAB pemeliharaan 2026", provenance: ["TERUKUR"] },
                },
              ],
            },
          ],
        },
      ],
    },
    references: { type: "sourceRegister", entries: [{ id: "r1", citation: t("SPLN T5.008:2019"), kind: "dokumen" }] },
    appendices: {
      type: "appendix",
      chapters: [{ key: "A", title: t("Data Pendukung"), sections: [{ title: t("Catatan RAB"), blocks: [{ type: "paragraph", text: "Harga satuan mengikuti daftar harga 2026." }] }] }],
    },
  };
}

function sampleDoc(tier: "TERBIT" | "NOTA", slug: string): Record<string, unknown> {
  const meta = {
    title: "Kajian Biaya Pemeliharaan Gardu Induk Cikupa",
    docNumber: "017/GSP/KT/XI/2026",
    rev: "A",
    typeCode: "KT",
    tier,
    classification: "TERBATAS",
    language: "ID",
    author: "Tim Kajian GSP",
    issueDate: "2026-11-04",
    subject: "Biaya pemeliharaan GI Cikupa",
  };
  const front =
    tier === "NOTA"
      ? {}
      : {
          cover: { type: "cover", titleLines: [t("Kajian Biaya Pemeliharaan"), t("Gardu Induk Cikupa 150 kV")], standfirst: t("Rekapitulasi biaya material dan jasa tahun 2026.") },
          controlSheet: {
            type: "controlSheet",
            revisionHistory: [{ rev: "A", date: "2026-11-04", what: "Terbit pertama", by: "Tim Kajian GSP" }],
            verificationChain: [{ layer: "1", role: "Penyusun", name: "A. Pratama" }],
            methodStatement: t("Rekapitulasi dari RAB pemeliharaan 2026."),
            distribution: [{ copy: "1", holder: "Manajer Aset" }],
          },
          signature: { type: "signatureBlock", roles: [{ role: t("Disusun"), holder: t("A. Pratama"), date: t("2026-11-04") }] },
          toc: { type: "toc" },
        };
  return {
    $schema: "studio.doc/v2",
    agentId: "s05-baseline",
    template: { slug },
    mission: { folder: "2026-11-04_s05-baseline" },
    docKey: "kajian-biaya",
    meta,
    sections: { ...front, ...contentSections() },
    register: REGISTER,
  };
}

interface CaseDef {
  id: string;
  doc: string;
  template: string;
}

const CASES: readonly CaseDef[] = [
  { id: "a_terbit_datum_gsp", doc: "a_terbit_datum_gsp.doc.v2.json", template: "datum_gsp.template.v2.json" },
  { id: "b_nota_datum_gsp", doc: "b_nota_datum_gsp.doc.v2.json", template: "datum_gsp.template.v2.json" },
  { id: "a_terbit_datum_kanonik", doc: "a_terbit_datum_kanonik.doc.v2.json", template: "datum_kanonik.template.v2.json" },
  { id: "b_nota_datum_kanonik", doc: "b_nota_datum_kanonik.doc.v2.json", template: "datum_kanonik.template.v2.json" },
];

function generateInputs(root: string, dir: string): void {
  writeJson(path.join(dir, "datum-gsp.preset.json"), datumGspPreset(root));
  writeJson(path.join(dir, "datum_gsp.template.v2.json"), templateV2("datum-gsp"));
  writeJson(path.join(dir, "datum_kanonik.template.v2.json"), templateV2(null));
  writeJson(path.join(dir, "a_terbit_datum_gsp.doc.v2.json"), sampleDoc("TERBIT", "datum-gsp"));
  writeJson(path.join(dir, "b_nota_datum_gsp.doc.v2.json"), sampleDoc("NOTA", "datum-gsp"));
  writeJson(path.join(dir, "a_terbit_datum_kanonik.doc.v2.json"), sampleDoc("TERBIT", "datum-kanonik"));
  writeJson(path.join(dir, "b_nota_datum_kanonik.doc.v2.json"), sampleDoc("NOTA", "datum-kanonik"));
}

// ── Render ───────────────────────────────────────────────────────────────

interface FileHash {
  case: string;
  format: string;
  file: string;
  bytes: number;
  sha256: string;
}

/** Info per kasus dari render_report.json (tidak dibanding sebagai byte; dicatat untuk diagnosis selisih). */
interface CaseInfo {
  case: string;
  composeSnapshotSha256: string | null;
  slots: string[];
  composeWarnings: number;
  lint: { tier: string | null; releaseStatus: string | null; fail: string[] };
}
const caseInfos: CaseInfo[] = [];

function renderCase(root: string, inputs: string, c: CaseDef, outDir: string): FileHash[] {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
  const cli = path.join(root, "scripts", "parity", "run", "render_cli.ts");
  const args = [tsx, cli, "--doc", path.join(inputs, c.doc), "--template", path.join(inputs, c.template), "--out", outDir, "--formats", FORMATS, "--pid-seed", PID_SEED];
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`${c.id}: render_cli tidak dapat dijalankan: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${c.id}: render_cli exit ${r.status}\n${(r.stderr ?? "").slice(-4000)}`);
  const report = readJson(path.join(outDir, "render_report.json")) as {
    files?: Array<{ format: string; path: string }>;
    job?: { status?: string };
    compose?: { snapshotSha256?: string; slots?: string[]; warnings?: unknown[] };
    lint?: { tier?: string; releaseStatus?: string; checks?: Array<{ checkId: string; status: string }> };
  };
  if (!caseInfos.some((i) => i.case === c.id)) {
    caseInfos.push({
      case: c.id,
      composeSnapshotSha256: report.compose?.snapshotSha256 ?? null,
      slots: report.compose?.slots ?? [],
      composeWarnings: report.compose?.warnings?.length ?? 0,
      lint: { tier: report.lint?.tier ?? null, releaseStatus: report.lint?.releaseStatus ?? null, fail: (report.lint?.checks ?? []).filter((k) => k.status === "FAIL").map((k) => k.checkId) },
    });
  }
  const primary = (report.files ?? [])
    .map((f) => ({ ...f, format: f.format.toUpperCase() }))
    .filter((f) => f.format === "DOCX" || f.format === "HTML");
  if (primary.length !== 2) throw new Error(`${c.id}: diharapkan DOCX + HTML, didapat ${JSON.stringify(report.files?.map((f) => f.format))} (job ${report.job?.status})`);
  return primary
    .map((f) => {
      const abs = path.isAbsolute(f.path) ? f.path : path.join(outDir, f.path);
      const bytes = readFileSync(abs);
      // Salinan bernama stabil (nama DATUM bisa berubah bila penamaan berubah; isi yang dibanding).
      const stable = `${c.id}.${f.format.toLowerCase()}`;
      copyFileSync(abs, path.join(outDir, stable));
      return { case: c.id, format: f.format, file: `cases/${c.id}/${stable}`, bytes: bytes.length, sha256: sha256(bytes) };
    })
    .sort((a, b) => a.format.localeCompare(b.format));
}

function inputHashes(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).sort()) out[f] = sha256(readFileSync(path.join(dir, f)));
  return out;
}

function gitHead(root: string): string | null {
  const r = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main(argv: readonly string[]): number {
  let args: Map<string, string>;
  try {
    args = parseArgs(argv);
    if (args.has("help")) {
      process.stdout.write("npx tsx benchmark/datum_conformance/baseline/render_id_samples.ts --root <repo> --out <dir> [--inputs <dir>] [--compare <dir>] [--runs <n>]\n");
      return 0;
    }
    if (!args.get("root") || !args.get("out")) throw new Error("--root dan --out wajib");
  } catch (err) {
    process.stderr.write(`render_id_samples: salah pakai: ${(err as Error).message}\n`);
    return 2;
  }
  const root = path.resolve(args.get("root") as string);
  const out = path.resolve(args.get("out") as string);
  const runs = Math.max(1, Number(args.get("runs") ?? "2") || 2);
  if (!existsSync(path.join(root, "scripts", "parity", "run", "render_cli.ts"))) {
    process.stderr.write(`render_id_samples: ${root} bukan akar repo Studio (render_cli.ts tidak ada)\n`);
    return 2;
  }

  const inputs = path.join(out, "inputs");
  const frozen = args.get("inputs");
  mkdirSync(out, { recursive: true });
  if (frozen && path.resolve(frozen) === inputs) {
    // Masukan beku = direktori keluaran sendiri: pakai apa adanya.
  } else {
    rmSync(inputs, { recursive: true, force: true });
    mkdirSync(inputs, { recursive: true });
    if (frozen) for (const f of readdirSync(frozen)) copyFileSync(path.join(frozen, f), path.join(inputs, f));
    else generateInputs(root, inputs);
  }

  const files: FileHash[] = [];
  let failed = false;
  for (const c of CASES) {
    try {
      const first = renderCase(root, inputs, c, path.join(out, "cases", c.id));
      for (let i = 2; i <= runs; i++) {
        const again = renderCase(root, inputs, c, path.join(out, "cases", `${c.id}__run${i}`));
        for (const h of first) {
          const o = again.find((x) => x.format === h.format);
          if (!o || o.sha256 !== h.sha256) {
            failed = true;
            process.stderr.write(`NONDETERMINISTIC ${c.id} ${h.format}: run1 ${h.sha256} run${i} ${o?.sha256 ?? "-"}\n`);
          }
        }
        rmSync(path.join(out, "cases", `${c.id}__run${i}`), { recursive: true, force: true });
      }
      files.push(...first);
    } catch (err) {
      failed = true;
      process.stderr.write(`RENDER_FAILED ${(err as Error).message}\n`);
    }
  }

  const summary = {
    schema: SCHEMA,
    root,
    gitHead: gitHead(root),
    pidSeed: PID_SEED,
    formats: FORMATS,
    runsPerCase: runs,
    normalisations: [] as string[],
    inputs: inputHashes(inputs),
    files,
    cases: caseInfos,
  };
  writeJson(path.join(out, "hashes.json"), summary);
  writeFileSync(path.join(out, "hashes.sha256"), files.map((f) => `${f.sha256}  ${f.file}\n`).join(""), "utf8");
  for (const f of files) process.stdout.write(`${f.sha256}  ${f.file}  (${f.bytes} B)\n`);

  const cmp = args.get("compare");
  if (cmp) {
    const base = readJson(path.join(path.resolve(cmp), "hashes.json")) as typeof summary;
    for (const [k, v] of Object.entries(base.inputs)) {
      if (summary.inputs[k] !== v) process.stdout.write(`INPUT-DIFF ${k} baseline ${v} now ${summary.inputs[k] ?? "-"}\n`);
    }
    let diff = 0;
    for (const b of base.files) {
      const n = files.find((f) => f.case === b.case && f.format === b.format);
      const same = n?.sha256 === b.sha256;
      if (!same) diff++;
      process.stdout.write(`${same ? "SAME" : "DIFF"} ${b.case} ${b.format} baseline ${b.sha256} now ${n?.sha256 ?? "-"}\n`);
    }
    for (const b of base.cases ?? []) {
      const n = caseInfos.find((i) => i.case === b.case);
      if (n && n.composeSnapshotSha256 !== b.composeSnapshotSha256) process.stdout.write(`INFO compose snapshot ${b.case} baseline ${b.composeSnapshotSha256} now ${n.composeSnapshotSha256}
`);
    }
    for (const n of files) if (!base.files.some((b) => b.case === n.case && b.format === n.format)) process.stdout.write(`EXTRA ${n.case} ${n.format} ${n.sha256}\n`);
    process.stdout.write(`compare: ${base.files.length - diff}/${base.files.length} SAME\n`);
    if (diff > 0) failed = true;
  }
  return failed ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
