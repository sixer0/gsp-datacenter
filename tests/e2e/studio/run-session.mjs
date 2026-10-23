// SR-52 (S80 diperluas): satu sesi E2E terskrip terhadap server dev v2.1 http://127.0.0.1:9021.
// Alur: A, N, T, K, E, G, P, Y + API agen U1-U3 + kriteria UX A1-A16 yang relevan.
// Menjalankan: node tests/e2e/studio/run-session.mjs   (bukan bagian `npm test`: butuh server hidup dan menulis fixture)
// Keluaran: tests/e2e/studio/out/session/{NN_*.png, results.json, console.json}
// Fixture: pengguna uji + dokumen misi + templat salinan berprefiks e2e-sr52-, dihapus di akhir (0 sisa).
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { BASE } from "./lib/api.mjs";
import { launch, newContext } from "./lib/browser.mjs";
import { withDb, fingerprint } from "./lib/db.mjs";
import { newRun, createUsers, cleanup, residue, tableCounts } from "./lib/fixtures.mjs";
import { recorder, writeAtomic } from "./lib/report.mjs";
import { runU1, runU2, runU3 } from "./flows/agent.mjs";
import * as ui from "./flows/ui.mjs";
import { makePng } from "./lib/png.mjs";

const OUT = resolve(import.meta.dirname, "out/session");
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) rmSync(resolve(OUT, f), { force: true });

const READONLY_DOCS = [ui.DOC_000, ui.DOC_001, "cmvjwkogg0011v1cgk6lnj26m"];
const run = { ...newRun(), createdAssets: [] };
run.uiPng = makePng(200, 140, run.tag + "f0e1d2");
const { results, check } = recorder();
const sink = [];
const ctx = { check, sink, outDir: OUT, shots: [], log: [], base: BASE };
const apiLog = {};
const t0 = Date.now();
let browser;
let pre, preCounts, post, postCounts, cleanupReport, residueReport;

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(`${name}.X`, `alur ${name} selesai tanpa pengecualian`, false, String(e?.stack ?? e).split("\n").slice(0, 14).join(" / "));
  }
}

try {
  pre = await withDb((c) => fingerprint(c, READONLY_DOCS));
  preCounts = await tableCounts();
  const u = await createUsers(run);
  check("FX.1", "fixture pengguna uji dibuat (ADMIN via scripts/seed-webui-admin.mjs, USER via rbac/signup)", u.adminOk && u.userStatus === 201, `${u.adminLog}; USER HTTP ${u.userStatus}`);

  browser = await launch();
  const userCtx = await newContext(browser, "USER", sink);
  const adminCtx = await newContext(browser, "ADMIN", sink);
  const userPage = await userCtx.newPage();
  const adminPage = await adminCtx.newPage();
  // Dialog native hanya diharapkan dari penjaga `beforeunload` (perubahan belum disimpan); terima agar navigasi lanjut, catat.
  for (const [role, pg] of [["USER", userPage], ["ADMIN", adminPage]]) pg.on("dialog", (d) => { ctx.log.push(`dialog native ${d.type()} (${role}) di fase ${sink.phase}`); d.accept().catch(() => {}); });

  await step("A", () => ui.flowA(ctx, { userPage, adminPage, run }));
  await step("N", () => ui.flowN(ctx, { userPage, adminPage }));
  await step("T", () => ui.flowT(ctx, { userPage, adminPage, run }));
  await step("K", () => ui.flowK(ctx, { userPage, run }));
  sink.phase = "U1";
  await step("U1", () => runU1(run, check, apiLog));
  await step("E-incomplete", () => ui.flowE(ctx, { page: userPage, role: "user", run, stage: "incomplete" }));
  sink.phase = "U2";
  await step("U2", () => runU2(run, check, apiLog));
  sink.phase = "U3";
  await step("U3", () => runU3(run, check, apiLog));
  await step("E-complete", () => ui.flowE(ctx, { page: adminPage, role: "admin", run, stage: "complete" }));
  await step("E-edit", () => ui.flowEditUi(ctx, { page: userPage, run }));
  await step("E-readonly", () => ui.flowReadOnlyDocs(ctx, { userPage }));
  await step("GPY", () => ui.flowGPY(ctx, { userPage, adminPage }));
  const storageState = await userCtx.storageState();
  await step("A15", () => ui.flowA15(ctx, { browser, storageState, run, newContext }));
  await step("A14", () => ui.flowAxe(ctx, { page: userPage, run }));
  const a12Ctx = await newContext(browser, "USER-A12", sink, { storageState });
  await step("A12", async () => ui.flowA12(ctx, { page: await a12Ctx.newPage() }));
  await a12Ctx.close();
  await userCtx.close();
  await adminCtx.close();
} catch (e) {
  check("RUN.X", "sesi berjalan tanpa pengecualian", false, String(e?.stack ?? e).split("\n").slice(0, 4).join(" / "));
} finally {
  await browser?.close().catch(() => {});
  cleanupReport = await cleanup(run, run.createdAssets).catch((e) => ({ error: e.message }));
  residueReport = await residue(run, run.createdAssets).catch((e) => ({ error: e.message }));
  post = await withDb((c) => fingerprint(c, READONLY_DOCS)).catch((e) => ({ error: e.message }));
  postCounts = await tableCounts().catch((e) => ({ error: e.message }));
  const resZero = residueReport && Object.values(residueReport).every((v) => v === 0);
  check("FX.2", "pembersihan fixture: 0 sisa (dokumen, pengguna, aset, templat salinan, folder misi)", resZero, JSON.stringify({ cleanup: cleanupReport, residue: residueReport }));
  check("FX.3", "dokumen 000/001/002 baca-saja: sidik sebelum = sesudah", JSON.stringify(pre) === JSON.stringify(post), JSON.stringify(Object.fromEntries(Object.entries(post ?? {}).map(([k, v]) => [k, `${v?.doc?.docNumber} rev=${v?.doc?.currentRevisionNo} revs=${v?.revisions?.n} out=${v?.outputs} jobs=${v?.jobs}`]))));
  const diff = Object.keys(preCounts ?? {}).filter((k) => preCounts[k] !== postCounts?.[k]).map((k) => `${k}:${preCounts[k]}->${postCounts?.[k]}`);
  check("FX.4", "hitungan baris tabel Studio + WebUiUser sebelum = sesudah", diff.length === 0, diff.join(", ") || JSON.stringify(postCounts));
  const consoleErrors = sink.filter((s) => s.kind === "pageerror" || s.kind === "console.error" || s.kind.startsWith("http.5"));
  const unexpected = consoleErrors.filter((s) => !/^A12/.test(s.phase));
  check("CON.1", "galat konsol nol di luar uji galat jaringan sengaja (A12)", unexpected.length === 0, `${unexpected.length} tak terduga; ${consoleErrors.length - unexpected.length} sengaja (A12)`);
  writeAtomic(resolve(OUT, "console.json"), sink);
  writeAtomic(resolve(OUT, "results.json"), {
    base: BASE, startedAt: new Date(t0).toISOString(), durationSec: Math.round((Date.now() - t0) / 1000),
    run: { tag: run.tag, mission: run.mission, docNumber: run.docNumber, users: [run.admin.username, run.user.username] },
    pass: results.filter((r) => r.ok).length, total: results.length, results, api: apiLog, axe: ctx.axe ?? null, shots: ctx.shots, log: ctx.log,
    preflight: { fingerprint: pre, counts: preCounts }, postflight: { fingerprint: post, counts: postCounts, cleanup: cleanupReport, residue: residueReport },
  });
  console.log(`HASIL: ${results.filter((r) => r.ok).length} PASS / ${results.filter((r) => !r.ok).length} FAIL (${results.length} cek, ${ctx.shots.length} tangkapan, ${Math.round((Date.now() - t0) / 1000)} s)`);
  process.exitCode = results.every((r) => r.ok) ? 0 : 1;
}
