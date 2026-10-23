/**
 * Uji regresi FIX-B (B-1, D-241): ingest dryRun NYATA atas masukan benchmark v2
 * bawaan (`doc.v2.json` + `template.v2.json`) lewat pemuat masukan runner.
 *
 *   npx tsx benchmark/harness/run/selftest_ingest_v2.ts
 *
 * Celah yang ditutup: dry-run runner hanya memeriksa skema JSON, sehingga runner
 * yang tidak meneruskan kerangka templat berkas lolos selftest padahal ingest
 * resmi jatuh ke kerangka implisit (toc AUTO) dan menolak entri daftar isi
 * (`SLOT_INPUT_NOT_ACCEPTED`). Tanpa DB (dryRun, templat di memori). Membaca
 * berkas benchmark; exit 0 = lulus, 1 = gagal.
 */
import assert from "node:assert/strict";
import path from "node:path";
import type { StudioCaller } from "../../../src/lib/studio/contract";
import { DEFAULT_DOC_V2, DEFAULT_FIGURE_INDEX, DEFAULT_TEMPLATE_V2, REPO_ROOT } from "./lib/config";
import { loadInputs } from "./lib/inputs";

const CALLER: StudioCaller = { kind: "INTERNAL_AGENT", requester: "benchmark-selftest-fixb", canWriteClassK: false };
const abs = (p: string) => path.join(REPO_ROOT, p);

async function main(): Promise<number> {
  const inputs = await loadInputs({
    doc: abs(DEFAULT_DOC_V2),
    template: abs(DEFAULT_TEMPLATE_V2),
    figureIndex: abs(DEFAULT_FIGURE_INDEX),
    figures: "engine",
    schemaRequest: "v2",
  });
  const cases: Array<[string, () => Promise<void> | void]> = [
    ["masukan v2 termuat tanpa fatal/notReady", () => {
      assert.deepEqual(inputs.fatal, []);
      assert.equal(inputs.schema.docVersion, "v2");
      assert.ok(inputs.template, "templat v2 terselesaikan");
    }],
    ["kerangka berkas templat ikut (bukan implisit) dan toc MIXED", () => {
      assert.ok(inputs.skeleton, "skeleton ada");
      assert.equal(inputs.skeleton.implicit, false);
      assert.match(inputs.skeleton.skeletonSha256, /^[0-9a-f]{64}$/);
      assert.equal(inputs.templateInfo.skeletonSha256, inputs.skeleton.skeletonSha256);
      const toc = inputs.skeleton.skeleton.slots.filter((s) => s.sectionType === "toc");
      assert.ok(toc.length > 0, "slot toc ada");
      assert.ok(toc.every((s) => s.contentMode === "MIXED"), `toc contentMode ${toc.map((s) => s.contentMode).join(",")}`);
    }],
    ["ingest dryRun nyata (kerangka diteruskan seperti pipeline) -> valid", async () => {
      const ingest = await import("../../../src/lib/studio/services/ingest");
      ingest.setIngestLogSink(() => undefined);
      const r = await ingest.ingestDocument({ document: inputs.doc }, CALLER, {
        dryRun: true,
        enforcement: "report",
        trustedHarness: true,
        template: inputs.template!,
        ...(inputs.skeleton ? { skeleton: inputs.skeleton } : {}),
        assetIndexPath: abs(DEFAULT_FIGURE_INDEX),
      });
      const first = r.issues.slice(0, 3).map((i) => `${i.pointer} ${i.message}`).join(" | ");
      assert.equal(r.valid, true, `ingest valid (isu ${r.issues.length}: ${first})`);
      assert.ok(r.snapshot, "snapshot ada");
    }],
  ];
  let failed = 0;
  for (const [name, fn] of cases) {
    try {
      await fn();
      process.stdout.write(`ok    ${name}\n`);
    } catch (e) {
      failed++;
      process.stdout.write(`GAGAL ${name}: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }
  process.stdout.write(`${cases.length - failed}/${cases.length} lulus\n`);
  return failed ? 1 : 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`selftest_ingest_v2 gagal dijalankan: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
    process.exitCode = 1;
  },
);
