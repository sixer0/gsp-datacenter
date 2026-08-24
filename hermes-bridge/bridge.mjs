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
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const execFileP = promisify(execFile);
const HERMES = process.env.HERMES_BIN || "hermes";
const BOARD = process.env.HERMES_BOARD || "default";
const POLL_MS = Number(process.env.BRIDGE_POLL_MS || 5000);
const MIRROR_MS = Number(process.env.BRIDGE_MIRROR_MS || 30000);
const RUN_TIMEOUT_MS = Number(process.env.BRIDGE_RUN_TIMEOUT_MS || 1800000);
const WIKI_DIR = process.env.HERMES_WIKI || path.join(os.homedir(), ".hermes", "wiki");
const BRIEF_HOUR = Number(process.env.BRIEF_HOUR || 8);   // local hour to auto-generate the daily brief
const BRIEF_PROMPT =
  "You are the operator's chief of staff. Produce today's brief. Read your memory wiki open-loops " +
  "(~/.hermes/wiki), the kanban board, and recent activity. Output ONLY valid JSON (no prose, no code fences) " +
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
const pool = new pg.Pool({ connectionString: DB_URL, max: 4, ssl: isLocal ? undefined : { rejectUnauthorized: false } });

const log = (...a) => console.log(new Date().toISOString(), ...a);
const q = (text, params) => pool.query(text, params);

async function hermes(args, { timeout = 30000 } = {}) {
  const { stdout } = await execFileP(HERMES, args, { timeout, maxBuffer: 8 * 1024 * 1024 });
  return stdout;
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
function semanticStatus(result) {
  const t = (result || "").trim();
  const m = t.match(/STATUS:\s*(complete|blocked|needs-review|failed|rejected)/i);
  if (m) {
    const s = m[1].toLowerCase();
    return s === "complete" ? "done" : s;
  }
  if (/RT_BYPASS|KODE:\s*BLOCKED|^BLOCKED[:：]/im.test(t)) return "blocked";
  if (/NEEDS[-\s_]?REVIEW/i.test(t)) return "needs-review";
  if (/^FAILED[:：]/im.test(t) || /^ERROR[:：]/im.test(t)) return "failed";
  return "done";
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
async function createKanbanCard(r) {
  // Kartu kontrak sudah ada (hermesTaskId) → pakai kartu itu, JANGAN buat duplikat
  if (r.hermesTaskId) {
    log("kanban contract card:", r.hermesTaskId, "untuk", r.id);
    return r.hermesTaskId;
  }
  try {
    const out = await hermes(
      ["kanban", "--board", BOARD, "create", "--json", r.title.slice(0, 140),
       "--assignee", r.profile, "--body", `HQ dispatch ${r.id}`],
      { timeout: 20000 }
    );
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
      const out = await hermes(["kanban", "--board", BOARD, "list", "--json"], { timeout: 15000 });
      const tasks = JSON.parse(out || "[]");
      t = (Array.isArray(tasks) ? tasks : []).find((x) => (x.body || "").includes(requestId));
    }
    if (!t || !t.id) return;
    if (orchStatus === "done") {
      await hermes(["kanban", "--board", BOARD, "complete", t.id, "--result", (result || "").slice(0, 300)], { timeout: 15000 });
    } else {
      await hermes(["kanban", "--board", BOARD, "block", t.id], { timeout: 15000 });
    }
    log("kanban close:", t.id, orchStatus);
  } catch (e) { log("kanban close failed:", e.message.split("\n")[0]); }
}

/* ─────────────── PULL: mirror Brahma → Postgres ─────────────── */
async function mirrorKanban() {
  let tasks = [];
  try {
    // NB: this Brahma CLI wants --board BEFORE the subcommand.
    const out = await hermes(["kanban", "--board", BOARD, "list", "--json"], { timeout: 15000 });
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
    const out = await hermes(["cron", "list", "--all"], { timeout: 15000 });
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
      const out = await hermes(args, { timeout: 15000 });
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
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm = {}; let body = md;
  if (m) {
    body = m[2];
    for (const line of m[1].split("\n")) {
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
    const rel = path.relative(WIKI_DIR, file);
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
  if (seen.size) await q(`DELETE FROM "HermesMemory" WHERE id <> ALL($1::text[])`, [[...seen]]);
  else await q(`DELETE FROM "HermesMemory"`);
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
  if (now.getHours() >= s.hour && lastBriefDate !== today) {
    lastBriefDate = today;
    try { await generateBriefing(); } catch (e) { log("daily brief err", e.message); }
  }
}

/* ─────────────── PUSH: run website requests via Brahma ─────────────── */
async function runRequest(r) {
  await q(`UPDATE "AgentRequest" SET status='running', "startedAt"=now(), "updatedAt"=now() WHERE id=$1`, [r.id]);
  await emit("run", `Started: ${r.title}`, { level: "info", meta: { requestId: r.id, kind: r.kind, profile: r.profile || null } });
  // Orchestration telemetry: dispatch brahma → profile (hanya jika target profil diisi)
  const isProfile = !!(r.profile && r.profile !== "default" && r.profile !== "brahma");
  const fromAgent = "brahma";
  const toAgent = isProfile ? r.profile : "brahma";
  if (isProfile) {
    await recordOrch({
      from: fromAgent, to: toAgent, kind: "dispatch", status: "running",
      runId: r.id, taskId: r.id, taskTitle: r.title,
    });
    await setAgentState(toAgent, { status: "running", currentTask: r.title.slice(0, 200) });
    const kanbanCardId = await createKanbanCard(r); // kartu task nyata di board kanban (assignee = profil)
    if (kanbanCardId && !r.hermesTaskId) {
      // simpan id kartu agar closeKanbanCard bisa menutupnya tanpa cari-by-body
      await q(`UPDATE "AgentRequest" SET "hermesTaskId"=$1, "updatedAt"=now() WHERE id=$2`, [kanbanCardId, r.id]).catch(() => {});
    }
  }
  try {
    let result = "";
    if (r.kind === "oneshot" || r.kind === "chat") {
      result = (await hermes([...(isProfile ? ["-p", r.profile] : []), "-z", r.prompt || r.title], { timeout: RUN_TIMEOUT_MS })).trim();
    } else if (r.kind === "kanban") {
      result = (await hermes(["kanban", "--board", BOARD, "create", "--json", r.title], { timeout: 20000 })).trim();
    } else if (r.kind.startsWith("cron.")) {
      const op = r.kind.split(".")[1];
      const a = JSON.parse(r.prompt || "{}");
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
    await q(`UPDATE "AgentRequest" SET status='done', result=$2, "finishedAt"=now(), "updatedAt"=now() WHERE id=$1`,
      [r.id, result.slice(0, 8000)]);
    await emit("run", `Done: ${r.title}`, { level: "up", detail: result.slice(0, 400), meta: { requestId: r.id } });
    if (isProfile) {
      // status semantik dari respons agent (blocked/needs-review/failed → edge ikut berubah)
      const sem = semanticStatus(result);
      const orchStatus = sem === "done" ? "done" : sem;
      await closeOrch(r.id, orchStatus, result.slice(0, 400));
      await closeKanbanCard(r.id, r.hermesTaskId || kanbanCardId, orchStatus, result); // tutup kartu kanban (done/blocked)
      await setAgentState(toAgent, {
        status: "idle",
        currentTask: null,
        action: `${orchStatus === "done" ? "Selesai" : `Selesai (${orchStatus})`}: ${r.title.slice(0, 80)}`,
      });
      if (orchStatus !== "done") {
        await emit("run", `${orchStatus === "blocked" ? "Blocked" : "Needs attention"}: ${r.title}`, {
          level: orchStatus === "blocked" ? "warn" : "warn",
          detail: result.slice(0, 400),
          meta: { requestId: r.id, orchStatus },
        });
      }
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
  const { rows } = await q(
    `SELECT * FROM "AgentRequest" WHERE status IN ('queued','approved') ORDER BY "createdAt" ASC LIMIT 3`
  );
  for (const r of rows) await runRequest(r);
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

async function main() {
  log(`brahma-bridge up · board=${BOARD} · poll=${POLL_MS}ms · mirror=${MIRROR_MS}ms`);
  await emit("status", "Bridge connected", { level: "up" });
  await mirrorTick();
  setInterval(() => mirrorTick().catch((e) => log("mirror loop", e.message)), MIRROR_MS);
  // queue loop
  const tick = async () => { try { await processQueue(); } catch (e) { log("queue loop", e.message); } finally { setTimeout(tick, POLL_MS); } };
  tick();
}
main().catch((e) => { console.error("fatal", e); process.exit(1); });
