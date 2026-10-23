// SR-52 bantu debug: jalankan U1-U3 saja (tanpa peramban), lalu bersihkan fixture.
import { newRun, cleanup, residue } from "./lib/fixtures.mjs";
import { recorder } from "./lib/report.mjs";
import { runU1, runU2, runU3 } from "./flows/agent.mjs";
const run = { ...newRun(), createdAssets: [] };
const { results, check } = recorder();
const log = {};
try {
  await runU1(run, check, log);
  if (process.env.SR52_STOP !== "u1") { await runU2(run, check, log); await runU3(run, check, log); }
} catch (e) { console.error("ERR", e); }
finally {
  if (process.env.SR52_KEEP !== "1") { console.log("cleanup", await cleanup(run, run.createdAssets)); console.log("residue", await residue(run, run.createdAssets)); }
  else console.log("KEEP", run.documentId, run.mission, run.createdAssets);
  console.log(`HASIL ${results.filter((r) => r.ok).length}/${results.length}`);
}
