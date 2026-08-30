// verify_login_hq.mjs — verifikasi kontrak login terpadu HQ (V1-V5), 30-08-2026.
// Akun uji dibuat via rbac/signup (token) lalu DIHAPUS di akhir (V6).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const ROOT = resolve(import.meta.dirname, "..");
const BASE = "https://localhost:9011";

// baca .env (strip CRLF/quotes)
const env = {};
for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const RBAC = env.WEBUI_RBAC_TOKEN;
const INT = env.INTERNAL_API_SECRET;
if (!RBAC || !INT) { console.error("token env tidak ketemu"); process.exit(2); }

const TESTUSER = "hqtest3008";
const TESTPASS = "SwarmTest!2026";
let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
  cond ? pass++ : fail++;
}
async function j(path, opts = {}) {
  const r = await fetch(BASE + path, { ...opts });
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body, headers: r.headers };
}

// ── setup: buat akun uji via rbac/signup ────────────────────────────────────
let su = await j("/api/brahma/rbac/signup", {
  method: "POST",
  headers: { "content-type": "application/json", "x-rbac-token": RBAC },
  body: JSON.stringify({ username: TESTUSER, password: TESTPASS, displayName: "HQ Test", hermesProfile: "hq-test-3008" }),
});
if (su.status === 409) su = { status: 201 }; // sudah ada dari run sebelumnya
check("setup signup akun uji", su.status === 201, `HTTP ${su.status}`);

// ── V1: login HQ password salah → 401; throttle >10 → 429 ──────────────────
let v1 = await j("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: TESTUSER, password: "wrongpass123" }) });
check("V1a login salah → 401", v1.status === 401, `HTTP ${v1.status}`);
let got429 = false, codes = [];
for (let i = 0; i < 12; i++) {
  const r = await j("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: TESTUSER, password: "wrongpass123" }) });
  codes.push(r.status);
  if (r.status === 429) { got429 = true; break; }
}
check("V1b throttle → 429 setelah >10", got429, codes.join(","));

// throttle per-IP: IP berbeda (via x-forwarded-for) tidak terpengaruh
let v1c = await j("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" }, body: JSON.stringify({ username: TESTUSER, password: "wrongpass123" }) });
check("V1c throttle per-IP (IP lain → 401 bukan 429)", v1c.status === 401, `HTTP ${v1c.status}`);

// ── V2: login benar → cookie → / 200, /api/auth/me user ────────────────────
let v2 = await j("/api/auth/login", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" }, body: JSON.stringify({ username: TESTUSER, password: TESTPASS }) });
const setc = v2.headers.get("set-cookie") || "";
check("V2a login benar → 200 + cookie gsp_hq_session", v2.status === 200 && setc.includes("gsp_hq_session") && /httponly/i.test(setc), `HTTP ${v2.status}`);
const cookie = setc.split(";")[0];
let page = await fetch(BASE + "/", { headers: { cookie } });
check("V2b GET / dgn cookie → 200 (bukan 307)", page.status === 200, `HTTP ${page.status}`);
let me = await j("/api/auth/me", { headers: { cookie } });
check("V2c /api/auth/me → user uji", me.status === 200 && me.body?.user?.username === TESTUSER, JSON.stringify(me.body?.user));

// ── V3: cookie palsu / kedaluwarsa → ditolak ────────────────────────────────
let fake = await j("/api/auth/me", { headers: { cookie: "gsp_hq_session=" + Buffer.from(JSON.stringify({ u: "admin", r: "ADMIN", p: "default", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") + ".AAAA" } });
check("V3a cookie palsu → 401", fake.status === 401, `HTTP ${fake.status}`);
let anon = await fetch(BASE + "/tasks");
check("V3b halaman tanpa sesi → redirect /login", anon.status === 200 && anon.url.includes("/login") || [302, 307].includes(anon.status), `HTTP ${anon.status} url=${anon.url}`);
let apiAnon = await j("/api/user-access");
check("V3c API tanpa sesi → 401", apiAnon.status === 401, `HTTP ${apiAnon.status}`);

// ── V4: jalur WebUI pulih — rbac/login dgn x-rbac-token ─────────────────────
let v4 = await j("/api/brahma/rbac/login", { method: "POST", headers: { "content-type": "application/json", "x-rbac-token": RBAC }, body: JSON.stringify({ username: TESTUSER, password: TESTPASS }) });
check("V4a rbac/login token+password benar → 200", v4.status === 200, `HTTP ${v4.status}`);
let v4b = await j("/api/brahma/rbac/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: TESTUSER, password: TESTPASS }) });
check("V4b rbac/login tanpa token → 401 (guard handler)", v4b.status === 401, `HTTP ${v4b.status}`);

// ── V5: x-internal-secret tetap diterima; logout hapus cookie ───────────────
let v5 = await j("/api/brahma/requests", { headers: { "x-internal-secret": INT } });
check("V5a x-internal-secret → bukan 401", v5.status !== 401, `HTTP ${v5.status}`);
let lo = await j("/api/auth/logout", { method: "POST", headers: { cookie } });
const loCookie = (lo.headers.get("set-cookie") || "").includes("gsp_hq_session=;") || /max-age=0/i.test(lo.headers.get("set-cookie") || "");
check("V5b logout → cookie dicabut", lo.status === 200 && loCookie, lo.headers.get("set-cookie"));

// ── V6: cleanup akun uji ────────────────────────────────────────────────────
const users = await j("/api/brahma/rbac/users", { headers: { "x-rbac-token": RBAC } });
const rec = (users.body?.users || users.body || []).find?.((u) => u.username === TESTUSER);
if (rec?.id) {
  const del = await j(`/api/user-access/${rec.id}`, { method: "DELETE", headers: { cookie } });
  check("V6 hapus akun uji", del.status < 300, `HTTP ${del.status}`);
} else {
  check("V6 hapus akun uji (user tidak ditemukan — cek manual)", false, `users HTTP ${users.status}`);
}

console.log(`\nHASIL: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
