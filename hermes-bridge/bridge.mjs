#!/usr/bin/env node
/**
 * GSP Agent Headquarter ↔ Brahma bridge.
 *
 * Runs on the Mac mini where Brahma lives. Talks to the shared Postgres
 * (the same DATABASE_URL the website uses) — nothing is exposed to the
 * internet. Two jobs:
 *
 *   PULL  (Brahma → website): mirror the kanban board into HermesTask,
 *         cron list + health into DataStore, and emit activity events.
 *   PUSH  (website → Brahma): pick up AgentRequest rows that are `queued`
 *         (safe) or `approved` (human-approved side-effecting), run them
 *         through the `hermes` CLI, and write results back.
 *
 * Requires: the `hermes` binary on PATH, and env DATABASE_URL.
 * Optional env: HERMES_BOARD (default "default"), BRIDGE_POLL_MS (5000),
 *               BRIDGE_MIRROR_MS (30000), HERMES_BIN (default "hermes").
 */
import pg from "pg";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
// NAT-R3 pilot (kartu t_ebc486c1): hard-gate prapenyampaian gerbang naturalisasi.
import { gateForDelivery } from "./gate_transport.mjs";

const execFileP = promisify(execFile);
const HERMES = process.env.HERMES_BIN || "hermes";
const BOARD = process.env.HERMES_BOARD || "default";
const POLL_MS = Number(process.env.BRIDGE_POLL_MS || 5000);
const MIRROR_MS = Number(process.env.BRIDGE_MIRROR_MS || 30000);
const RUN_TIMEOUT_MS = Number(process.env.BRIDGE_RUN_TIMEOUT_MS || 1800000);
const RESULT_MAX = Number(process.env.BRIDGE_RESULT_MAX || 200000);
const WIKI_DIR = process.env.HERMES_WIKI || path.join(os.homedir(), ".hermes", "wiki");
const BRIEF_HOUR = Number(process.env.BRIEF_HOUR || 8);   // local hour to auto-generate the daily brief
const BRIEF_PROMPT =
  "You are the operator's chief of staff. Produce today's brief. Read your memory wiki open-loops " +
  "your memory wiki), the kanban board, and recent activity. Output ONLY valid JSON (no prose, no code fences) " +
  'in exactly this shape: {"greeting":"one warm line","summary":"2-3 sentences on where things stand",' +
  '"sections":[{"label":"Needs your decision","items":["..."]},{"label":"Top priorities","items":["..."]},' +
  '{"label":"Recently shipped","items":["..."]},{"label":"Next actions","items":["..."]}]}. ' +
  "Keep every item short, concrete, and specific. Omit a section if it has nothing.";
let lastBriefDate = null;

const DB_URL = process.env.DATABASE_URL || "";
if (!DB_URL) { console.error("DATABASE_URL is required (use the direct postgres:// URL, not a prisma:// Accelerate URL)"); process.exit(1); }
if (DB_URL.startsWith("prisma://") || DB_URL.startsWith("prisma+")) {
  console.error("DATABASE_URL is a Prisma Accelerate URL; the bridge needs a DIRECT postgres:// connection string (e.g. POSTGRES_URL).");
  process.exit(1);
}
// Cloud Postgres (Prisma Postgres/Neon/Supabase/RDS) needs SSL; localhost doesn't.
const isLocal = /@(localhost|127\.0\.0\.1)/.test(DB_URL);
const pool = new pg.Pool({ connectionString: DB_URL, max: 4, ssl: isLocal ? undefined : { rejectUnauthorized: process.env.DB_SSL_NO_VERIFY !== '1' } });

const log = (...a) => console.log(new Date().toISOString(), ...a);
const q = (text, params) => pool.query(text, params);

// HARD TIMEOUT: execFile timeout TIDAK selalu mematikan proses di Windows —
// child bisa survive & menahan pipe sehingga promise tidak pernah resolve
// (insiden 28-08-2026: bridge "up" 18:14 tapi loop antrean baru jalan 22:41
//  karena mirrorTick pertama menggantung menunggu hermes CLI yang hang).
// Strategi: spawn manual + Promise.race + taskkill /T (tree-kill) saat timeout,
// lalu reject supaya pemanggil selalu selesai dalam waktu bounded.
async function hermes(args, { timeout = 30000, maxOut = 1024 * 1024 } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(HERMES, args, { windowsHide: true });
    let stdout = "", stderr = "", settled = false;
    const MAX_OUT = maxOut; // SEC-007: cap stdout (default 1MB; pemanggil besar boleh naikkan — fix TRIAGE-0309)
    const killTree = () => {
      try { execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], () => {}); } catch { /* sudah mati */ }
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      killTree();
      reject(new Error(`hermes CLI timeout after ${timeout}ms: ${args.join(" ").slice(0, 120)}`));
    }, timeout);
    child.stdout.on("data", (d) => { if (stdout.length < MAX_OUT) stdout += d; }); // SEC-007
    child.stderr.on("data", (d) => { if (stderr.length < 8192) stderr += d; }); // SEC-007
    child.on("error", (e) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else {
        const err = new Error(`Command failed: ${HERMES} ${args.join(" ").slice(0, 120)} (exit ${code})`);
        err.stderr = (stderr || stdout.slice(-600)); // SEC-007: stderr asli didahulukan
        reject(err);
      }
    });
  });
}

async function emit(kind, title, { detail = null, agent = "brahma", level = "info", meta = null } = {}) {
  await q(
    `INSERT INTO "AgentEvent" (id, kind, title, detail, agent, level, meta, "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7, now())`,
    [randomUUID(), kind, title.slice(0, 200), detail, agent, level, meta ? JSON.stringify(meta) : null]
  );
}

// ── Orchestration telemetry: catat/rekam edge interaksi lintas profil ──────
async function recordOrch({ from, to, kind = "delegate", status = "running", taskId = null, taskTitle = null, message = null, artifactPath = null, runId = null }) {
  await q(
    `INSERT INTO "OrchestrationRecord" (id, "runId", "fromAgent", "toAgent", kind, status, "taskId", "taskTitle", message, "artifactPath", meta, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NULL, now(), now())`,
    [randomUUID(), runId, from, to, kind, status, taskId, taskTitle ? taskTitle.slice(0, 300) : null,
     message ? message.slice(0, 1000) : null, artifactPath ? artifactPath.slice(0, 500) : null]
  );
}
async function closeOrch(runId, status, message = null, artifactPath = null) {
  const res = await q(
    `UPDATE "OrchestrationRecord" SET status=$2, message=COALESCE($3, message), "artifactPath"=COALESCE($4, "artifactPath"), "updatedAt"=now()
     WHERE "runId"=$1 AND status='running'`,
    [runId, status, message ? message.slice(0, 1000) : null, artifactPath ? artifactPath.slice(0, 500) : null]
  );
  return res.rowCount > 0;
}
// AgentState live status (dipakai halaman Agents — merge dengan ROSTER statis)
async function setAgentState(id, { status, currentTask = null, action = null }) {
  const existing = await q(`SELECT * FROM "AgentState" WHERE id=$1`, [id]);
  const row = existing.rows[0];
  const recent = (row?.recentActivity ? row.recentActivity : []).slice(0, 19);
  const recentActivity = action ? [{ timestamp: new Date().toISOString(), action }, ...recent] : recent;
  const tasksCompleted = (row?.tasksCompleted || 0) + (action ? 1 : 0);
  await q(
    `INSERT INTO "AgentState" (id, name, emoji, role, status, "lastActive", "tasksCompleted", "totalCost", "currentTask", "recentActivity", "updatedAt")
     VALUES ($1,$2,$3,$4,$5, now(), $6, 0, $7, $8, now())
     ON CONFLICT (id) DO UPDATE SET
       status=EXCLUDED.status, "lastActive"=now(),
       "tasksCompleted"=EXCLUDED."tasksCompleted",
       "currentTask"=EXCLUDED."currentTask",
       "recentActivity"=EXCLUDED."recentActivity", "updatedAt"=now()`,
    [id, row?.name || id, row?.emoji || null, row?.role || null, status, tasksCompleted, currentTask, JSON.stringify(recentActivity)]
  );
}

// Status semantik workflow dari respons agent (kontrak fleet: STATUS: complete|blocked|needs-review|failed)
// Aturan asignor (teguran user 29-08-2026): HANYA asignor yang boleh menyatakan
// task done — asignee TIDAK PERNAH self-claim DONE, termasuk via marker
// "STATUS: complete". Semua penyelesaian agent → needs-review (review gate).
function semanticStatus(result) {
  const t = (result || "").trim();
  const m = t.match(/STATUS:\s*(complete|blocked|needs-review|failed|rejected)/i);
  if (m) {
    const s = m[1].toLowerCase();
    return s === "complete" || s === "needs-review" ? "needs-review" : s;
  }
  if (/RT_BYPASS|KODE:\s*BLOCKED|^BLOCKED[:：]/im.test(t)) return "blocked";
  if (/NEEDS[-\s_]?REVIEW/i.test(t)) return "needs-review";
  if (/^FAILED[:：]/im.test(t) || /^ERROR[:：]/im.test(t)) return "failed";
  // DEFAULT: hasil tanpa STATUS eksplisit dianggap perlu review (DONE hanya oleh asignor)
  return "needs-review";
}

async function setStore(key, data) {
  await q(
    `INSERT INTO "DataStore" (key, data, "updatedAt") VALUES ($1,$2, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, "updatedAt" = now()`,
    [key, JSON.stringify(data)]
  );
}

// ── Kanban: kartu task nyata untuk dispatch ber-profil ───────────────────
// Board Hermes (SQLite) adalah sumber task asli; mirrorKanban menyinkronkannya
// ke HermesTask → TaskBoard di dashboard. Setiap dispatch via HQ membuat satu
// kartu (assignee = profil target), lalu ditutup complete/block saat selesai.
//
// FIX 31-08-2026 (insiden t_4db40b42 / t_5aab0b7f, kartu t_7f20950d):
//  D1. DEDUP: satu misi tidak boleh punya dua kartu. Sebelum membuat kartu,
//      scan board untuk kartu non-terminal ber-assignee sama yang body-nya
//      menyebut artefak kontrak yang sama (path docs/... dari prompt). Kalau
//      ketemu → pakai kartu itu (reuse), JANGAN buat baru. Tambahan lapis
//      kedua: --idempotency-key turunan id request, agar retry request yang
//      sama tidak pernah membuat kartu kembar.
//  D2. EKSEKUSI GANDA: dispatcher gateway mengklaim SETIAP kartu ready yang
//      ber-assignee dan men-spawn worker. Dulu bridge membuat kartu ready
//      BER-ASSIGNEE lalu menjalankan prompt-nya sendiri via `hermes -z` →
//      dua worker satu misi, saling timpa artefak. Sekarang:
//      • kartu milik bridge dibuat TANPA assignee (dispatcher skip) dan
//        dieksekusi bridge sendiri;
//      • kartu kontrak (hermesTaskId / hasil dedup) yang ber-assignee
//        dibiarkan menjadi milik dispatcher — bridge TIDAK menjalankan
//        prompt-nya, melainkan mendaftarkan reconciler yang menunggu kartu
//        selesai lalu menyalin hasilnya ke AgentRequest.
function extractContractPaths(text) {
  // Path artefak kontrak: token docs/<...>.md dsb. dari body kartu / prompt.
  const out = new Set();
  if (!text) return out;
  const re = /(?:^|[\s"'`(=])((?:docs|workspace|library|analysis|collection|memory)\/[^\s"'`,;)]+\.(?:md|json|csv|pdf|docx|xlsx|pptx))/gim;
  let m;
  while ((m = re.exec(text)) !== null) out.add(m[1].replace(/[.]+$/, "").toLowerCase());
  return out;
}

async function findExistingMissionCard(profile, prompt, title) {
  // Dedup: kartu non-terminal yang berbagi path artefak kontrak dengan misi
  // ini. Kartu dianggap "milik profil" jika assignee-nya sama ATAU body-nya
  // ber-tag profile=<profil> (kartu buatan bridge tidak ber-assignee).
  const want = extractContractPaths(`${prompt || ""}\n${title || ""}`);
  if (!want.size) return null;
  try {
    const out = await hermes(["kanban", "--board", BOARD, "list", "--json"], { timeout: 45000 });
    const tasks = JSON.parse(out || "[]");
    const arr = Array.isArray(tasks) ? tasks : tasks.tasks || [];
    for (const t of arr) {
      if (!t || !t.id) continue;
      if (["done", "archived"].includes(t.status)) continue;
      const body = t.body || "";
      const owned = (t.assignee || "") === (profile || "") ||
        (profile && body.includes(`profile=${profile}`));
      if (!owned) continue;
      const have = extractContractPaths(`${body}\n${t.title || ""}`);
      for (const p of want) if (have.has(p)) return t;
    }
  } catch (e) { log("dedup scan failed:", e.message.split("\n")[0]); }
  return null;
}

async function kanbanCardState(taskId) {
  try {
    const out = await hermes(["kanban", "--board", BOARD, "show", taskId, "--json"], { timeout: 30000 });
    const d = JSON.parse(out || "{}");
    return d.task || null;
  } catch { return null; }
}

async function createKanbanCard(r) {
  // Kartu kontrak sudah ada (hermesTaskId) → pakai kartu itu, JANGAN buat duplikat
  if (r.hermesTaskId) {
    log("kanban contract card:", r.hermesTaskId, "untuk", r.id);
    return r.hermesTaskId;
  }
  // D1: dedup misi — board mungkin sudah punya kartu untuk artefak yang sama
  // (mis. kartu kontrak yang dibuat controller sebelum dispatch tanpa hermesTaskId).
  const dup = await findExistingMissionCard(r.profile, r.prompt, r.title);
  if (dup) {
    log("kanban dedup: reuse kartu", dup.id, "untuk request", r.id, "(artefak kontrak sama)");
    return dup.id;
  }
  try {
    // STA13-B1 (SERAH-TERIMA-ASIGNOR-1013): oper pencipta kartu = profil penugasan
    // AgentRequest agar gerbang ACK gsp_deleg_watch _owner() menunjuk penugas sejati,
    // bukan 'user'. Flag hanya bila r.profile terisi (guard risiko 02#S6 baris l2).
    const argv = ["kanban", "--board", BOARD, "create", "--json", r.title.slice(0, 140),
       "--body", `HQ dispatch ${r.id} · profile=${r.profile}`,
       "--idempotency-key", `hq-${r.id}`];
    if (r.profile) argv.push("--created-by", r.profile);
    const out = await hermes(argv, { timeout: 20000 });
    const parsed = JSON.parse(out || "{}");
    if (parsed && parsed.id) {
      log("kanban card:", parsed.id, "for", r.id);
      return parsed.id;
    }
  } catch (e) { log("kanban create failed:", e.message.split("\n")[0]); }
  return null;
}
async function closeKanbanCard(requestId, taskId, orchStatus, result) {
  try {
    let t = null;
    if (taskId) {
      // kartu kontrak eksplisit (hermesTaskId / kartu yang dibuat bridge)
      t = { id: taskId };
    } else {
      const out = await hermes(["kanban", "--board", BOARD, "list", "--json"], { timeout: 45000 });
      const tasks = JSON.parse(out || "[]");
      t = (Array.isArray(tasks) ? tasks : []).find((x) => (x.body || "").includes(requestId));
    }
    if (!t || !t.id) return;
    // NB: sengaja TANPA --force. Jika kartu ternyata punya run worker yang
    // masih hidup (dispatcher spawn / controller lain), guard premature-close
    // engine menolak penutupan dan error-nya di-log — keputusan penutup
    // dikembalikan ke pemilik run, bukan ditimpa bridge (insiden 31-08-2026).
    if (orchStatus === "done") {
      await hermes(["kanban", "--board", BOARD, "complete", t.id, "--result", (result || "").slice(0, 300)], { timeout: 45000 });
    } else if (orchStatus === "needs-review") {
      // REVIEW GATE: kartu masuk antrean review asignor (native kanban review flow) —
      // hanya asignor yang mempromosikan ke done via request-changes/approve.
      await hermes(["kanban", "--board", BOARD, "request-review", t.id, "--summary", (result || "").slice(0, 280)], { timeout: 45000 });
    } else {
      await hermes(["kanban", "--board", BOARD, "block", t.id], { timeout: 45000 });
    }
    log("kanban close:", t.id, orchStatus);
  } catch (e) { log("kanban close failed:", e.message.split("\n")[0]); }
}

// ── D2 reconciler: kartu kontrak dikerjakan dispatcher, bukan bridge ─────
// Bridge TIDAK menjalankan prompt untuk kartu ber-assignee; ia menunggu kartu
// mencapai status terminal lalu menyalin hasilnya ke AgentRequest.
const CARD_POLL_MS = Number(process.env.BRIDGE_CARD_POLL_MS || 30000);
async function awaitCardCompletion(r, cardId, toAgent) {
  const deadline = Date.now() + RUN_TIMEOUT_MS + 10 * 60 * 1000;
  log("defer: kartu", cardId, "dikerjakan dispatcher (bukan bridge) untuk request", r.id);
  // Serahkan prompt lengkap HQ ke worker dispatcher lewat komentar —
  // worker membaca worker_context (title+body+comments) saat diklaim.
  try {
    const prompt = (r.prompt || "").trim();
    if (prompt) {
      await hermes(["kanban", "--board", BOARD, "comment", cardId,
        `PROMPT DISPATCH HQ ${r.id} (dialihkan ke dispatcher; isi untuk worker):\n${prompt}`,
        "--author", "hq-bridge", "--max-len", "12000"], { timeout: 30000 });
    }
  } catch (e) { log("defer comment failed:", e.message.split("\n")[0]); }
  let lastStatus = null;
  while (Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, CARD_POLL_MS));
    const card = await kanbanCardState(cardId);
    if (!card) continue;
    lastStatus = card.status;
    if (!["done", "blocked", "review", "archived", "triage"].includes(card.status)) continue;
    const resultText = card.result
      || (card.status === "blocked" ? `Kartu ${cardId} diblokir: ${card.block_kind || "tanpa alasan"}` : "")
      || `Kartu ${cardId} berakhir di status ${card.status} tanpa result.`;
    const sem = card.status === "done" ? "done"
      : card.status === "review" ? (r.kind === "instant" ? "done" : "needs-review")
      : card.status === "blocked" ? "blocked" : "failed";
    // NAT-R3 hard-gate prapenyampaian pada jalur defer (kartu t_ebc486c1): hasil
    // kartu dispatcher juga dipindai sebelum disalin ke AgentRequest/komentar.
    let delivery = resultText;
    let gateHeld = false;
    let gateVerdict = "off";
    try {
      const g = await gateForDelivery(r, resultText, log);
      delivery = g.delivery; gateHeld = !!g.held; gateVerdict = g.verdict;
      if (g.event) {
        await emit("gate", `Gate ${g.verdict}: ${r.title}`, {
          level: g.event.level, detail: g.event.detail,
          meta: { requestId: r.id, verdict: g.verdict, holdPath: g.holdPath || null, deferred: true },
        }).catch((e) => log("gate emit err", r.id, e.message.split("\n")[0]));
      }
    } catch (e) {
      log("gate fail-open (defer):", r.id, (e.message || "error").split("\n")[0]);
      delivery = resultText + `\n\n[catatan gerbang NAT-R3: gerbang error (${String(e.message || "").slice(0, 120)}); dikirim dengan catatan sesuai batas desain fail-open.]`;
      gateVerdict = "error";
    }
    const semFinal = gateHeld ? "needs-review" : sem;
    await q(`UPDATE "AgentRequest" SET status=$2, result=$3, "finishedAt"=now(), "updatedAt"=now() WHERE id=$1`,
      [r.id, semFinal, trimResult(delivery)]);
    await emit("run", `Kartu dispatcher selesai (${gateHeld ? "tertahan gerbang" : sem}): ${r.title}`, {
      level: gateHeld || sem === "needs-review" || sem === "done" ? (gateHeld ? "warn" : "up") : "warn",
      detail: delivery.slice(0, 400),
      meta: { requestId: r.id, orchStatus: semFinal, cardId, deferred: true, gate: gateVerdict },
    });
    await closeOrch(r.id, semFinal, delivery.slice(0, 400));
    await setAgentState(toAgent, { status: "idle", currentTask: null, action: `Kartu ${cardId} ${card.status}: ${r.title.slice(0, 80)}` });
    log("defer done:", cardId, card.status, "→ request", r.id, semFinal, "gate=" + gateVerdict);
    return;
  }
  const msg = `Kartu ${cardId} tidak mencapai status terminal dalam batas waktu (status terakhir: ${lastStatus || "?"}).`;
  await q(`UPDATE "AgentRequest" SET status='failed', error=$2, "finishedAt"=now(), "updatedAt"=now() WHERE id=$1`, [r.id, msg]);
  await emit("run", `Defer timeout: ${r.title}`, { level: "warn", detail: msg, meta: { requestId: r.id, cardId } });
  await closeOrch(r.id, "failed", msg);
  await setAgentState(toAgent, { status: "idle", currentTask: null, action: `Timeout kartu ${cardId}: ${r.title.slice(0, 80)}` });
  log("defer timeout:", cardId, "request", r.id);
}

/* ─────────────── PULL: mirror Brahma → Postgres ─────────────── */
async function mirrorKanban() {
  let tasks = [];
  try {
    // NB: this Brahma CLI wants --board BEFORE the subcommand.
    // TRIAGE-0309: output list 970 kartu = ~1,5MB > cap lama 1MB -> JSON terpotong
    // ("Unterminated string ... position 1109774") dan mirror mati sejak 02-09.
    // Cap dinaikkan ke 8MB khusus panggilan mirror ini.
    const out = await hermes(["kanban", "--board", BOARD, "list", "--json"], { timeout: 45000, maxOut: 8 * 1024 * 1024 });
    const parsed = JSON.parse(out || "[]");
    tasks = Array.isArray(parsed) ? parsed : parsed.tasks || [];
  } catch (e) { log("kanban list failed:", e.message.split("\n")[0]); return; }

  const seen = new Set();
  for (const t of tasks) {
    const id = String(t.id ?? t.task_id ?? "");
    if (!id) continue;
    seen.add(id);
    await q(
      `INSERT INTO "HermesTask" (id, board, title, assignee, status, priority, result, "updatedAt", "syncedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now())
       ON CONFLICT (id) DO UPDATE SET
         title=EXCLUDED.title, assignee=EXCLUDED.assignee, status=EXCLUDED.status,
         priority=EXCLUDED.priority, result=EXCLUDED.result, "syncedAt"=now()`,
      [id, BOARD, String(t.title ?? "untitled").slice(0, 300), t.assignee ?? null,
       String(t.status ?? "todo"), t.priority != null ? Number(t.priority) : null,
       t.result ? String(t.result).slice(0, 2000) : null]
    );
  }
  // prune tasks that vanished from the board
  if (seen.size) {
    await q(`DELETE FROM "HermesTask" WHERE board=$1 AND id <> ALL($2::text[])`, [BOARD, [...seen]]);
  } else {
    await q(`DELETE FROM "HermesTask" WHERE board=$1`, [BOARD]);
  }
}

async function mirrorCrons() {
  try {
    const out = await hermes(["cron", "list", "--all"], { timeout: 45000 });
    const lines = out.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    await setStore("hermes-crons", { jobs: lines, raw: out.slice(0, 8000), syncedAt: new Date().toISOString() });
  } catch (e) { log("cron list failed:", e.message.split("\n")[0]); }
}

// Parse `hermes insights` output (terminal box-drawing text) into structured data.
// Returns { period, overview, totalCost, totalTokens, unknownSessions, byModel, byPlatform, raw, syncedAt }.
function parseInsights(out) {
  const strip = (s) => String(s ?? "").replace(/,/g, "").trim();
  const num = (s) => { const n = parseFloat(strip(s).replace(/[^0-9.+\-]/g, "")); return Number.isFinite(n) ? n : null; };
  const section = (title) => {
    const i = out.indexOf(title);
    if (i < 0) return "";
    const rest = out.slice(i + title.length);
    return rest.split("\n").slice(1).join("\n");
  };
  const rows = (title) => {
    const body = section(title).split("\n");
    const items = [];
    for (const line of body) {
      const m = line.match(/^\s*([A-Za-z0-9][A-Za-z0-9._\-\/ ]*?)\s+([\d,]+(?:\.[\d]+)?)\s+([\d,]+(?:\.[\d]+)?)\s*$/);
      if (m) items.push({ name: m[1].trim(), a: num(m[2]), b: num(m[3]) });
      else if (items.length && /\S/.test(line)) break;
    }
    return items;
  };

  const period = (out.match(/Period:\s*(.+)/) || [])[1]?.trim() ?? null;
  const costLine = (out.match(/Estimated:\s*[~$]*([\d.,]+)/) || [])[1];
  const totalCost = num(costLine);
  const totalTokens = num((out.match(/Total tokens:\s*([\d.,]+)/) || [])[1]);
  const unknown = (out.match(/Unknown:\s*([\d.,]+)/) || [])[1];
  const unknownSessions = num(unknown);
  const g = (label) => num((out.match(new RegExp(label + ":\\s*([\\d.,]+)")) || [])[1]);
  const overview = {
    sessions: g("Sessions"),
    messages: g("Messages"),
    toolCalls: g("Tool calls"),
    userMessages: g("User messages"),
    inputTokens: g("Input tokens"),
    outputTokens: g("Output tokens"),
    totalTokens,
  };
  const byModel = rows("Models Used").map((r) => ({ model: r.name, sessions: r.a, tokens: r.b }));
  // Platforms: name, sessions, messages, tokens (3 numeric columns).
  const platBody = section("Platforms").split("\n");
  const byPlatform = [];
  for (const line of platBody) {
    const m = line.match(/^\s*(\S+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s*$/);
    if (m) byPlatform.push({ platform: m[1], sessions: num(m[2]), messages: num(m[3]), tokens: num(m[4]) });
    else if (byPlatform.length && /\S/.test(line)) break;
  }
  const byTool = rows("Top Tools").map((r) => ({ tool: r.name, calls: r.a, pct: r.b }));
  const summary = out.trim().slice(0, 6000);
  return { period, overview, totalCost, totalTokens, unknownSessions, byModel, byPlatform, byTool, summary, syncedAt: new Date().toISOString() };
}

async function mirrorCost() {
  for (const args of [["insights", "--days", "7"], ["insights"]]) {
    try {
      const out = await hermes(args, { timeout: 45000 });
      await setStore("hermes-cost", parseInsights(out));
      return;
    } catch { /* try next arg shape */ }
  }
}

async function mirrorHealth() {
  let online = false, gateway = "unknown", detail = "";
  try {
    const out = await hermes(["status"], { timeout: 12000 });
    detail = out.slice(0, 4000);
    online = /online|running|connected/i.test(out);
    gateway = /gateway[^\n]*(running|online)/i.test(out) ? "running" : "stopped";
  } catch (e) { detail = e.message.split("\n")[0]; }
  await setStore("hermes-health", { online, gateway, detail, lastSeen: new Date().toISOString() });
}

/* ─────────────── Memory Wiki (warm tier: git-tracked markdown) ─────────────── */
function parseEntry(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const fm = {}; let body = md;
  if (m) {
    body = m[2];
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!kv) continue;
      const v = kv[2].trim();
      if (v.startsWith("[") && v.endsWith("]")) fm[kv[1]] = v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      else fm[kv[1]] = v === "null" || v === "" ? null : v;
    }
  }
  return { fm, body: body.trim() };
}
function walkMd(dir, out = []) {
  let items = [];
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) { if (it.name !== ".git") walkMd(full, out); }
    else if (it.name.endsWith(".md") && it.name !== "INDEX.md") out.push(full);
  }
  return out;
}
async function mirrorWiki() {
  if (!fs.existsSync(WIKI_DIR)) return;
  const seen = new Set();
  for (const file of walkMd(WIKI_DIR)) {
    const rel = path.relative(WIKI_DIR, file).replace(/\\/g, "/");
    const id = rel.replace(/\.md$/, "");
    seen.add(id);
    let raw = ""; try { raw = fs.readFileSync(file, "utf8"); } catch { continue; }
    const { fm, body } = parseEntry(raw);
    await q(
      `INSERT INTO "HermesMemory" (id, path, type, title, status, confidence, provenance, tags, links, body, "validFrom", "validTo", "updatedAt", "syncedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now(), now())
       ON CONFLICT (id) DO UPDATE SET path=EXCLUDED.path, type=EXCLUDED.type, title=EXCLUDED.title,
         status=EXCLUDED.status, confidence=EXCLUDED.confidence, provenance=EXCLUDED.provenance,
         tags=EXCLUDED.tags, links=EXCLUDED.links, body=EXCLUDED.body,
         "validFrom"=EXCLUDED."validFrom", "validTo"=EXCLUDED."validTo", "syncedAt"=now()`,
      [id, rel, fm.type || "fact", fm.title || id, fm.status || "active", fm.confidence || null,
       fm.provenance || null, Array.isArray(fm.tags) ? fm.tags : [], Array.isArray(fm.links) ? fm.links : [],
       body, fm.valid_from || null, fm.valid_to || null]
    );
  }
  // SEC-008: hasil walk kosong padahal ada data sebelumnya = sinyal error I/O,
  // BUKAN perintah wipe. Prune hanya bila seen non-kosong.
  if (seen.size) await q(`DELETE FROM "HermesMemory" WHERE id <> ALL($1::text[])`, [[...seen]]);
}
function writeWikiEntry(e) {
  const rel = e.path || `${e.type || "note"}s/${e.id}.md`;
  const full = path.join(WIKI_DIR, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const lines = [
    "---", `id: ${e.id}`, `type: ${e.type || "note"}`, `title: ${e.title}`,
    `status: ${e.status || "active"}`,
    e.confidence ? `confidence: ${e.confidence}` : null,
    `provenance: ${e.provenance || "dashboard"}`,
    `tags: [${(e.tags || []).join(", ")}]`, `links: [${(e.links || []).join(", ")}]`,
    `updated: ${now}`, "---", "", e.body || "", "",
  ].filter((l) => l !== null);
  fs.writeFileSync(full, lines.join("\n"), "utf8");
  return rel;
}
async function gitCommitWiki(msg) {
  try {
    if (!fs.existsSync(path.join(WIKI_DIR, ".git"))) await execFileP("git", ["-C", WIKI_DIR, "init"]).catch(() => {});
    await execFileP("git", ["-C", WIKI_DIR, "add", "-A"]).catch(() => {});
    await execFileP("git", ["-C", WIKI_DIR, "commit", "-m", msg]).catch(() => {});
  } catch { /* ignore */ }
}

/* ─────────────── Chief-of-staff daily brief ─────────────── */
// Brief settings live in DataStore "hermes-briefing-settings" so the dashboard
// can turn auto-generation on/off, pick the hour, and customise the prompt.
// Env BRIEF_HOUR / BRIEF_PROMPT remain fallbacks.
const BRIEF_SETTINGS_KEY = "hermes-briefing-settings";
async function getBriefSettings() {
  const fallback = {
    enabled: true,
    hour: BRIEF_HOUR,
    prompt: BRIEF_PROMPT,
    updatedAt: null,
  };
  try {
    const { rows } = await q(`SELECT data FROM "DataStore" WHERE key=$1`, [BRIEF_SETTINGS_KEY]);
    if (!rows[0]?.data) return fallback;
    const d = rows[0].data;
    const h = Number(d.hour);
    return {
      enabled: d.enabled !== false,
      hour: Number.isInteger(h) && h >= 0 && h <= 23 ? h : BRIEF_HOUR,
      prompt: typeof d.prompt === "string" && d.prompt.trim() ? d.prompt : BRIEF_PROMPT,
      updatedAt: d.updatedAt ?? null,
    };
  } catch { return fallback; }
}

async function generateBriefing() {
  const s = await getBriefSettings();
  const raw = (await hermes(["-z", s.prompt], { timeout: RUN_TIMEOUT_MS })).trim();
  let brief;
  try {
    const jsonStr = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const m = jsonStr.match(/\{[\s\S]*\}/);
    brief = JSON.parse(m ? m[0] : jsonStr);
  } catch { brief = { summary: raw.slice(0, 1500), sections: [] }; }
  brief.generatedAt = new Date().toISOString();
  await setStore("hermes-briefing", brief);
  await emit("status", "Daily brief generated", { level: "up" });
}
async function maybeDailyBrief() {
  const s = await getBriefSettings();
  if (!s.enabled) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (now.getHours() < s.hour) return;
  if (lastBriefDate === today) return;
  // Guard PERSISTEN (harian): jangan generate ulang jika brief hari ini sudah ada.
  // Sumber kebenaran = DataStore "hermes-briefing".generatedAt — bertahan lintas restart.
  // (Sebelumnya hanya variabel in-memory `lastBriefDate` → tiap restart bridge, brief
  //  ter-generate lagi — bug nyata 24-08-2026: 3x "Daily brief generated" dalam sehari.)
  try {
    const { rows } = await q(`SELECT data FROM "DataStore" WHERE key=$1`, ["hermes-briefing"]);
    const last = rows[0]?.data?.generatedAt;
    if (typeof last === "string" && last.slice(0, 10) === today) {
      lastBriefDate = today;
      return;
    }
  } catch { /* query gagal → lanjut generate (fallback lama) */ }
  lastBriefDate = today;
  try { await generateBriefing(); } catch (e) { log("daily brief err", e.message); }
}

/* ─────────────── PUSH: run website requests via Brahma ─────────────── */
// Potong hasil panjang TANPA merusak JSON: kalau hasil dimulai '{', cari '}' di
// belakang yang membuat JSON tetap valid (parse-check backward, maks 4000 char).
// Fix 26-08-2026: cap lama 8000 membuat JSON Ask Librarian terpotong di tengah
// → UI tidak bisa render tabel. Cap baru 60000 + trim aman JSON.
// Rebrand 28-08-2026: buang baris banner engine dari output CLI sebelum
// ditampilkan di UI (header '⚕ Hermes/Hermes Agent vX', footer install dir,
// 'Resume this session', dsb). Reply bersih mulai dari baris pertama konten.
function stripEngineBanner(text) {
  const lines = String(text || "").split("\n");
  const bannerRe = /^\s*(?:[│┃]?\s*)?(?:\u2695\s*)?(?:Hermes|Swarm)\s*(?:Agent)?\s*(?:v[0-9][^\n]*)?$/i;
  const noiseRe = /^\s*(?:[│┃]?\s*)?(?:Install directory:|Resume this session|Session:|Messages:|Title:|Duration:|--continue|Upstream|Local\b)/i;
  const kept = lines.filter((l) => !bannerRe.test(l) && !noiseRe.test(l));
  return kept.join("\n").trim();
}

function trimResult(result) {
  result = stripEngineBanner(result);
  if (result.length <= RESULT_MAX) return result;
  const capped = result.slice(0, RESULT_MAX);
  if (!capped.trimStart().startsWith("{")) return capped;
  const startIdx = Math.max(0, capped.length - 4000);
  for (let i = capped.length - 1; i >= startIdx; i--) {
    if (capped[i] === "}") {
      const candidate = capped.slice(0, i + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch { /* masih terpotong — cari '}' sebelumnya */ }
    }
  }
  return capped;
}

async function runRequest(r) {
  await q(`UPDATE "AgentRequest" SET status='running', "startedAt"=now(), "updatedAt"=now() WHERE id=$1`, [r.id]);
  return runRequestClaimed(r);
}
// SEC-005: varian untuk request yang SUDAH diklaim atomik oleh lane (status sudah 'running').
async function runRequestClaimed(r) {
  await emit("run", `Started: ${r.title}`, { level: "info", meta: { requestId: r.id, kind: r.kind, profile: r.profile || null } });
  // Orchestration telemetry: dispatch <inisiator> → profile (hanya jika target profil diisi)
  // FIX 02-09-2026 (temuan #4): dulu hardcode "brahma" untuk SEMUA request,
  // padahal dispatch bisa berasal dari login user lain (WebUI/HQ) atau profil
  // lain. requestedBy diisi oleh rute pembuat request (sesi RBAC / agentId).
  const isProfile = !!(r.profile && r.profile !== "default" && r.profile !== "brahma");
  const fromAgent = r.requestedBy || "brahma";
  const toAgent = isProfile ? r.profile : "brahma";
  // Scope fungsi (bukan blok if pertama) agar bisa dipakai di blok if kedua
  // (bug 24-08-2026: ReferenceError "kanbanCardId is not defined" → AgentRequest
  //  tercatat failed walau agent sudah selesai & menghasilkan result).
  let kanbanCardId = null;
  let deferredToDispatcher = false;
  if (isProfile) {
    await recordOrch({
      from: fromAgent, to: toAgent, kind: "dispatch", status: "running",
      runId: r.id, taskId: r.id, taskTitle: r.title,
    });
    await setAgentState(toAgent, { status: "running", currentTask: r.title.slice(0, 200) });
    kanbanCardId = await createKanbanCard(r); // kartu task nyata di board kanban (assignee = profil)
    if (kanbanCardId && !r.hermesTaskId) {
      // simpan id kartu agar closeKanbanCard bisa menutupnya tanpa cari-by-body
      await q(`UPDATE "AgentRequest" SET "hermesTaskId"=$1, "updatedAt"=now() WHERE id=$2`, [kanbanCardId, r.id]).catch(() => {});
    }
    // D2: satu kartu = satu eksekutor. Kartu ber-assignee adalah milik
    // dispatcher Hermes (ia mengklaim & men-spawn worker sendiri); kartu
    // "HQ dispatch <id>" tanpa assignee adalah milik eksekusi bridge untuk
    // request <id>. Kalau bridge ikut menjalankan prompt yang sudah dipunyai
    // pemegang lain, satu misi dikerjakan dua proses dan artefak saling timpa
    // (insiden 31-08-2026). Aturan:
    //  • assignee terisi (non-terminal)      → defer ke dispatcher
    //  • HQ-card request lain                → defer ke eksekusi pemiliknya
    //  • kartu sudah terminal (retry)        → salin hasilnya, jangan jalankan
    //  • selain itu (kartu baru milik kita)  → bridge eksekusi sendiri
    if (kanbanCardId && (r.kind === "oneshot" || r.kind === "chat" || r.kind === "instant")) {
      const card = await kanbanCardState(kanbanCardId);
      if (card) {
        const body = card.body || "";
        const terminal = ["done", "archived", "blocked", "review", "triage"].includes(card.status);
        const isHqCard = /HQ dispatch /.test(body);
        const isOurHqCard = body.includes(r.id);
        if (terminal) {
          deferredToDispatcher = true; // reconciler menyalin hasil terminal langsung
        } else if (card.assignee || (isHqCard && !isOurHqCard)) {
          deferredToDispatcher = true;
        }
      }
    }
  }
  if (deferredToDispatcher) {
    // Jalur defer: jangan jalankan prompt di bridge; biarkan pemegang kartu
    // (dispatcher/eksekusi lain) menyelesaikannya, lalu salin hasil ke
    // AgentRequest lewat reconciler.
    awaitCardCompletion(r, kanbanCardId, toAgent).catch((e) =>
      log("defer reconciler err", r.id, e.message.split("\n")[0]));
    return;
  }
  try {
    let result = "";
    if (r.kind === "oneshot" || r.kind === "chat" || r.kind === "instant") {
      result = (await hermes([...(isProfile ? ["-p", r.profile] : []), "-z", r.prompt || r.title], { timeout: RUN_TIMEOUT_MS })).trim();
    } else if (r.kind === "kanban") {
      // STA13-B1 (SERAH-TERIMA-ASIGNOR-1013): jalur create kedua — oper profil
      // penugasan sebagai pencipta kartu (flag hanya bila r.profile terisi).
      const kbArgv = ["kanban", "--board", BOARD, "create", "--json", r.title];
      if (r.profile) kbArgv.push("--created-by", r.profile);
      result = (await hermes(kbArgv, { timeout: 20000 })).trim();
    } else if (r.kind.startsWith("cron.")) {
      const op = r.kind.split(".")[1];
      const a = JSON.parse(r.prompt || "{}");
      // SEC-010: validasi bentuk agar nilai user tak bisa jadi flag CLI / schedule rusak
      const safeId = (v) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(v));
      const safeSched = (v) => (typeof v === "string" && /^[0-9*,\/-]{1,64}$/.test(v) || /^every \d+[smhd]$/.test(v || ""));
      if (["run","pause","resume","remove","edit"].includes(op) && !safeId(a.id || a.name))
        throw new Error("cron op: id/name tidak valid");
      if (op === "create" && !safeSched(a.schedule))
        throw new Error("cron create: schedule tidak valid");
      const argv =
        op === "create" ? ["cron", "create", a.schedule, a.prompt || a.name].filter(Boolean)
        : op === "run"    ? ["cron", "run", a.id || a.name]
        : op === "pause"  ? ["cron", "pause", a.id || a.name]
        : op === "resume" ? ["cron", "resume", a.id || a.name]
        : op === "remove" ? ["cron", "remove", a.id || a.name]
        : op === "edit"   ? ["cron", "edit", a.id || a.name]
        : null;
      if (!argv) throw new Error(`unknown cron op ${op}`);
      result = (await hermes(argv, { timeout: 20000 })).trim();
      await mirrorCrons();
    } else if (r.kind === "memory.write") {
      const e = JSON.parse(r.prompt || "{}");
      const rel = writeWikiEntry(e);
      await gitCommitWiki(`wiki: update ${rel} (via dashboard)`);
      await mirrorWiki();
      result = `wrote ${rel}`;
    } else if (r.kind === "briefing.generate") {
      await generateBriefing();
      lastBriefDate = new Date().toISOString().slice(0, 10);
      result = "brief updated";
    } else {
      throw new Error(`unknown kind ${r.kind}`);
    }
    // REVIEW GATE (teguran user 29-08-2026): asignee tidak pernah self-claim DONE.
    // oneshot/chat (hasil kerja agent) → selalu needs-review; hanya asignor yang
    // bisa menutup done via PATCH /api/brahma/requests/[id] action=force-done.
    // Operasi infra deterministik (kanban/cron/memory.write/briefing) tetap done otomatis.
    const infraKind = !["oneshot", "chat", "nat-r3-test"].includes(r.kind);
    // ASK-INST (03-09): kind "instant" = tanya-jawab read-only utk user (Ask
    // Librarian). Dijalankan spt oneshot di askLane tapi penyelesaiannya
    // LANGSUNG done tanpa review gate: gerbang review itu utk hasil KERJA agen,
    // bukan utk jawaban yang diminta user saat itu juga. Scanner NAT-R3 ikut
    // di-noop-kan utk kind ini (lihat gate_transport.mjs).
    const isInstant = r.kind === "instant";
    // NAT-R3 hard-gate prapenyampaian (kartu t_ebc486c1): keluaran agent dipindai
    // scanner SEBELUM ditulis ke AgentRequest / kartu / event. Keluaran gagal
    // ditahan (berkas gate-hold + indeks + event gate), yang terkirim hanyalah
    // notice tertahan; error scanner fallback kirim-dengan-catatan (fail-open).
    let delivery = result;
    let gateHeld = false;
    let gateVerdict = "off";
    if (!infraKind) {
      const cleaned = trimResult(result); // yang tersimpan ke DB adalah hasil strip banner
      try {
        const g = await gateForDelivery(r, cleaned, log);
        delivery = g.held ? g.delivery : cleaned; gateHeld = !!g.held; gateVerdict = g.verdict;
        if (g.event) {
          await emit("gate", `Gate ${g.verdict}: ${r.title}`, {
            level: g.event.level, detail: g.event.detail,
            meta: { requestId: r.id, verdict: g.verdict, holdPath: g.holdPath || null },
          }).catch((e) => log("gate emit err", r.id, e.message.split("\n")[0]));
        }
      } catch (e) {
        log("gate fail-open:", r.id, (e.message || "error").split("\n")[0]);
        delivery = cleaned + `\n\n[catatan gerbang NAT-R3: gerbang error (${String(e.message || "").slice(0, 120)}); dikirim dengan catatan sesuai batas desain fail-open.]`;
        gateVerdict = "error";
      }
    }
    const sem = (infraKind || isInstant) ? "done" : (gateHeld ? "needs-review" : semanticStatus(result));
    await q(`UPDATE "AgentRequest" SET status=$2, result=$3, "finishedAt"=now(), "updatedAt"=now() WHERE id=$1`,
      [r.id, sem, trimResult(delivery)]);
    await emit("run", `${gateHeld ? "Tertahan gerbang naturalisasi" : sem === "needs-review" ? "Awaiting review" : sem === "done" ? "Done" : sem === "blocked" ? "Blocked" : "Needs attention"}: ${r.title}`, {
      level: gateHeld ? "warn" : sem === "needs-review" || sem === "done" ? "up" : "warn",
      detail: delivery.slice(0, 400),
      meta: { requestId: r.id, orchStatus: sem, gate: gateVerdict },
    });
    if (isProfile) {
      await closeOrch(r.id, sem, delivery.slice(0, 400));
      await closeKanbanCard(r.id, r.hermesTaskId || kanbanCardId, sem, delivery); // done=complete, needs-review=request-review, blocked/failed=block
      await setAgentState(toAgent, {
        status: "idle",
        currentTask: null,
        action: `${gateHeld ? "Keluaran tertahan gerbang naturalisasi" : sem === "needs-review" ? "Menunggu review asignor" : sem === "done" ? "Selesai" : `Selesai (${sem})`}: ${r.title.slice(0, 80)}`,
      });
    }
  } catch (e) {
    const msg = (e.stderr || e.message || "error").toString().split("\n")[0].slice(0, 600);
    await q(`UPDATE "AgentRequest" SET status='failed', error=$2, "finishedAt"=now(), "updatedAt"=now() WHERE id=$1`, [r.id, msg]);
    await emit("run", `Failed: ${r.title}`, { level: "down", detail: msg, meta: { requestId: r.id } });
    if (isProfile) {
      await closeOrch(r.id, "failed", msg);
      await setAgentState(toAgent, { status: "idle", currentTask: null, action: `Gagal: ${r.title.slice(0, 80)}` });
    }
    log("request failed:", r.id, msg);
  }
}

async function processQueue() {
  // Main lane: SATU request per iterasi dengan PICK ULANG tiap selesai.
  // Request Ask Librarian TIDAK diproses di sini (ada askLane paralel agar
  // pertanyaan user dijawab seketika tanpa menunggu antrean rebuild selesai).
  for (;;) {
    const { rows } = await q(
      `UPDATE "AgentRequest" SET status='running', "startedAt"=now(), "updatedAt"=now()
       WHERE id = (SELECT id FROM "AgentRequest"
                   WHERE status IN ('queued','approved') AND kind <> 'instant' AND title NOT LIKE 'Ask Librarian%'
                   ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
       RETURNING *`
    ); // SEC-005: klaim atomik anti double-process lintas instance
    if (!rows.length) break;
    await runRequestClaimed(rows[0]);
    await new Promise((res) => setTimeout(res, 300));
  }
}

async function askLane() {
  // Jalur paralel Ask Librarian + kind "instant": diproses seketika (1 request per waktu),
  // tanpa mengganggu antrean rebuild di main lane.
  for (;;) {
    try {
      const { rows } = await q(
        `UPDATE "AgentRequest" SET status='running', "startedAt"=now(), "updatedAt"=now()
         WHERE id = (SELECT id FROM "AgentRequest"
                     WHERE status IN ('queued','approved') AND (kind = 'instant' OR title LIKE 'Ask Librarian%')
                     ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
         RETURNING *`
      ); // SEC-005b: askLane atomik + sertakan 'approved' (bug: ask sideEffecting stuck permanen)
      if (!rows.length) { await new Promise((res) => setTimeout(res, POLL_MS)); continue; }
      await runRequestClaimed(rows[0]);
      await new Promise((res) => setTimeout(res, 300));
    } catch (e) {
      log("ask lane err", e.message);
      await new Promise((res) => setTimeout(res, POLL_MS));
    }
  }
}

/* ─────────────── loops ─────────────── */
async function mirrorTick() {
  try { await mirrorKanban(); } catch (e) { log("mirrorKanban err", e.message); }
  try { await mirrorCrons(); } catch (e) { log("mirrorCrons err", e.message); }
  try { await mirrorHealth(); } catch (e) { log("mirrorHealth err", e.message); }
  try { await mirrorWiki(); } catch (e) { log("mirrorWiki err", e.message); }
  try { await mirrorCost(); } catch (e) { log("mirrorCost err", e.message); }
  try { await maybeDailyBrief(); } catch (e) { log("maybeDailyBrief err", e.message); }
}

async function recoverZombies() {
  // Insiden 28-08-2026: request tertinggal status 'running' selamanya ketika
  // bridge mati/restart/mesin mati di tengah eksekusi — antrean terlihat
  // "running tanpa diproses". Saat start, tandai semua running sebagai failed
  // (zombie) supaya bisa di-retry user; bridge lama punya logika ini lalu hilang.
  try {
    const { rows } = await q(
      `UPDATE "AgentRequest" SET status='failed', error='zombie running — bridge restart saat proses berjalan; silakan dispatch ulang', "finishedAt"=now(), "updatedAt"=now() WHERE status='running' RETURNING id, title`
    );
    if (rows.length) log("recovered zombie running requests:", rows.map((r) => r.id).join(","));
  } catch (e) { log("recoverZombies err", e.message); }
  // Edge orkestrasi yang tertinggal 'running' padahal request parent sudah terminal
  // (audit 29-08-2026: 3 edge gsp-librarian menggantung sejak 24-08) — tutup agar
  // halaman /orchestration tidak menampilkan edge zombie.
  try {
    const { rows: z } = await q(
      `UPDATE "OrchestrationRecord" o SET status='failed',
         message = COALESCE(o.message,'') || ' [zombie edge ditutup recoverZombies: parent request terminal]',
         "updatedAt" = now()
       WHERE o.status='running' AND EXISTS (
         SELECT 1 FROM "AgentRequest" r WHERE r.id = o."runId" AND r.status <> 'running'
       ) RETURNING o."runId"`
    );
    if (z.length) log("recovered zombie orchestration edges:", z.map((r) => r.runId).join(","));
  } catch (e) { log("recoverZombies orch err", e.message); }
}

async function main() {
  log(`swarm-bridge up · board=${BOARD} · poll=${POLL_MS}ms · mirror=${MIRROR_MS}ms`);
  // URUTAN STARTUP (fix 28-08-2026): dulu `await mirrorTick()` berada SEBELUM
  // pendaftaran loop antrean. Jika mirror pertama menggantung (hermes CLI hang),
  // setInterval & loop antrean TIDAK PERNAH terdaftar — bridge hidup tapi tidak
  // memproses apa pun berjam-jam. Sekarang: loop antrean + ask lane + mirror
  // interval didaftarkan dulu, lalu mirror pertama berjalan tanpa memblokir.
  await emit("status", "Bridge connected", { level: "up" });
  await recoverZombies();
  // queue loop — main lane (rebuild & dispatch biasa)
  const tick = async () => { try { await processQueue(); } catch (e) { log("queue loop", e.message); } finally { setTimeout(tick, POLL_MS); } };
  tick();
  // ask lane — jalur paralel responsif utk Ask Librarian
  askLane().catch((e) => { log("ask lane fatal", e.message); });
  // mirror loop — periodik, tidak boleh memblokir startup
  setInterval(() => mirrorTick().catch((e) => log("mirror loop", e.message)), MIRROR_MS);
  mirrorTick().catch((e) => log("mirror first tick", e.message));
}
main().catch((e) => { console.error("fatal", e); process.exit(1); });
