/**
 * SR-41 (sisa FIX-3, D-138/D-139): fixture dokumen paritas menjadi KONTEN SAJA.
 *
 * Logika konversi: `lib/content_only.ts` (sama dengan generator korpus `src/docs.ts`).
 * Untuk setiap `tests/parity/fixtures/doc/<stem>.json` (studio.doc/v1):
 *
 *  1. `overrides` dokumen (tampilan, DF-41) dipindah ke profil templat pendamping
 *     `<stem>.template.json` (`{ base: "datum-kanonik", overrides }`), yang dipungut
 *     penemuan fixture (`lib/fixtures.ts` sidecar) untuk render paritas.
 *  2. Medan tampilan v1 dibuang secara rakus TERPANDU ADAPTOR: sebuah medan/elemen
 *     dihapus hanya bila (a) dokumen tetap lolos skema v1 (`validateDocV1`),
 *     (b) jumlah `stripped` + `dropped` REPORT `SCHEMA_V1_ADAPTED` turun, dan
 *     (c) dokumen v2 hasil adaptor TIDAK berubah (stableStringify identik). Syarat (c)
 *     menjamin tidak ada konten yang hilang: yang dibuang hanyalah yang memang
 *     dibuang adaptor. Sisa yang tidak dapat dibuang (wajib skema v1) dilaporkan.
 *  3. Salinan v2 `doc/v2/<stem>.json` = keluaran `adaptV1` (kebijakan strip, pemanggil
 *     tidak tepercaya), wajib lolos `validateV2Against("studio.doc/v2")` dengan 0 isu
 *     (termasuk 0 `DISPLAY_FIELD` DF-01..DF-69).
 *
 * Idempoten. Tulis atomik (berkas sementara lalu rename, F-063).
 *
 *   npx tsx scripts/parity/run/content_only_doc_fixtures.ts [--fixtures tests/parity/fixtures] [--check]
 *
 * `--check`: tidak menulis; exit 1 bila ada berkas yang akan berubah.
 * Exit: 0 sukses | 1 gagal/berbeda | 2 salah pakai.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { StudioDocV1 } from "../../../src/lib/studio/contract";
import { errMessage, findRepoRoot, parseArgs } from "./lib/common";
import { toContentOnlyDoc } from "./lib/content_only";

const SOURCE = "parity.content_only_doc_fixtures";

interface Outcome {
  file: string;
  removed: string[];
  movedOverrides: string[];
  prunedAssets: string[];
  before: number;
  after: number;
  residual: { stripped: Record<string, number>; dropped: Record<string, number> };
  v2Issues: number;
  displayFieldIssues: number;
  changed: string[];
}

function writeAtomic(abs: string, text: string): void {
  mkdirSync(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.${process.pid}.tmp`;
  writeFileSync(tmp, text, "utf8");
  renameSync(tmp, abs);
}

function jsonText(v: unknown): string {
  return `${JSON.stringify(v, null, 2)}\n`;
}

function processFixture(dir: string, name: string, check: boolean): Outcome {
  const abs = path.join(dir, name);
  const stem = name.replace(/\.json$/i, "");
  const doc = JSON.parse(readFileSync(abs, "utf8").replace(/^﻿/, "")) as StudioDocV1;
  const templateAbs = path.join(dir, `${stem}.template.json`);
  const prev = existsSync(templateAbs) ? (JSON.parse(readFileSync(templateAbs, "utf8").replace(/^﻿/, "")) as Record<string, unknown>) : undefined;
  const r = toContentOnlyDoc(doc, stem, prev);
  const displayFieldIssues = r.v2Issues.filter((i) => (i as unknown as { checkId?: string }).checkId === "DISPLAY_FIELD").length;
  const outputs: Array<[string, string]> = [[abs, jsonText(r.doc)], [path.join(dir, "v2", name), jsonText(r.v2)]];
  if (r.template) outputs.push([templateAbs, jsonText(r.template)]);
  const changed: string[] = [];
  for (const [file, text] of outputs) {
    const cur = existsSync(file) ? readFileSync(file, "utf8") : null;
    if (cur === text) continue;
    changed.push(path.relative(dir, file).split(path.sep).join("/"));
    if (!check) writeAtomic(file, text);
  }
  return {
    file: name,
    removed: r.removed,
    prunedAssets: r.prunedAssets,
    movedOverrides: Object.keys((doc as { overrides?: Record<string, unknown> }).overrides ?? {}).sort(),
    before: r.before,
    after: r.after,
    residual: r.residual,
    v2Issues: r.v2Issues.length,
    displayFieldIssues,
    changed,
  };
}

function main(argv: readonly string[]): number {
  let args;
  try {
    args = parseArgs(argv, { values: ["fixtures"], flags: ["check"] });
  } catch (err) {
    process.stderr.write(`content_only_doc_fixtures: salah pakai: ${errMessage(err)}\n`);
    return 2;
  }
  const repoRoot = findRepoRoot();
  const dir = path.resolve(args.values.get("fixtures") ?? path.join(repoRoot, "tests", "parity", "fixtures"), "doc");
  const check = args.flags.has("check");
  let bad = 0;
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json") && !/\.(template|ref)\.json$/i.test(n)).sort()) {
    const o = processFixture(dir, name, check);
    const residualText = JSON.stringify(o.residual);
    process.stdout.write(
      `${o.file}: stripped+dropped ${o.before} -> ${o.after}; dibuang ${o.removed.length} medan/elemen; overrides->templat [${o.movedOverrides.join(", ")}]; aset tak dirujuk dibuang [${o.prunedAssets.join(", ")}]; ` +
        `sisa ${residualText}; v2 isu ${o.v2Issues} (DISPLAY_FIELD ${o.displayFieldIssues}); ${o.changed.length ? `${check ? "AKAN BERUBAH" : "ditulis"}: ${o.changed.join(", ")}` : "tidak berubah"}\n`,
    );
    if (o.v2Issues > 0) bad++;
    if (check && o.changed.length > 0) bad++;
  }
  return bad > 0 ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: "error", source: SOURCE, message: errMessage(err), stack_trace: err instanceof Error ? err.stack : undefined })}\n`);
  process.exitCode = 1;
}
