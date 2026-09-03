// GATE-NAT-CHAN rekonsiliasi: status AgentRequest + kartu kanban utk 26 entri gate-hold.
const fs = require("fs");
const path = require("path");
const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const m = /^DATABASE_URL="?([^"\n]+)"?$/m.exec(env);
if (!m) { console.error("DATABASE_URL tidak ditemukan di ../.env"); process.exit(1); }
const { Client } = require("pg");
(async () => {
  const idx = fs.readFileSync(path.join(__dirname, "gate-hold", "gate-hold.ndjson"), "utf8")
    .split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const rel = new Set(fs.existsSync(path.join(__dirname, "gate-hold", "gate-release.ndjson"))
    ? fs.readFileSync(path.join(__dirname, "gate-hold", "gate-release.ndjson"), "utf8")
        .split("\n").filter(Boolean).map((l) => JSON.parse(l).requestId)
    : []);
  const ids = idx.map((r) => r.requestId);
  const c = new Client({ connectionString: m[1] });
  await c.connect();
  const { rows } = await c.query(
    'SELECT id, status, kind, "hermesTaskId" FROM "AgentRequest" WHERE id = ANY($1::text[])', [ids]);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  // kartu kanban via sqlite bawaan node
  let cardStatus = {};
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(process.env.LOCALAPPDATA + "/hermes/kanban.db", { readOnly: true });
    for (const r of rows) {
      if (!r.hermesTaskId) continue;
      const row = db.prepare("SELECT id,status FROM tasks WHERE id=?").get(r.hermesTaskId);
      cardStatus[r.hermesTaskId] = row ? row.status : "TIDAK-ADA-KARTU";
    }
    db.close();
  } catch (e) { cardStatus = { _err: e.message }; }
  for (const r of idx) {
    const q = byId[r.requestId];
    console.log([
      r.at.slice(0,10),
      r.requestId,
      q ? q.status : "TIDAK-ADA-DB",
      q && q.kind ? q.kind : "-",
      rel.has(r.requestId) ? "RELEASED" : "HELD",
      q && q.hermesTaskId ? q.hermesTaskId + "=" + (cardStatus[q.hermesTaskId] ?? "?") : "-",
      (r.title || "").slice(0, 44),
    ].join(" | "));
  }
  if (cardStatus._err) console.log("sqlite err:", cardStatus._err);
  await c.end();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
