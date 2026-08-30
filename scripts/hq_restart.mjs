// hq_restart.mjs — restart HQ production (node hq-server.mjs) secara bersih.
// Dipakai utk deploy perubahan login terpadu 30-08. Bunuh proses hq-server lama
// (termasuk child), lalu spawn baru detached dengan log append.
import { execSync, spawnSync, spawn } from "node:child_process";
import { openSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "hq-prod.out.log");
const ERR = resolve(ROOT, "hq-prod.err.log");

// 1. temukan PID yang LISTEN di port 9011 (HQ production), verifikasi cmdline-nya
function findPids() {
  const out = execSync("netstat -ano -p tcp", { encoding: "utf8", windowsHide: true });
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (line.includes("LISTENING") && /:(9011)\s/.test(line)) {
      const m = line.trim().match(/(\d+)\s*$/);
      if (m) pids.add(parseInt(m[1], 10));
    }
  }
  return [...pids];
}

const pids = findPids();
for (const pid of pids) {
  console.log(`kill tree PID ${pid} (listener 9011)`);
  spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true });
}
if (!pids.length) console.log("tidak ada proses hq-server berjalan");

// 2. tunggu port 9011 bebas
const { createConnection } = await import("node:net");
async function portOpen() {
  return new Promise((res) => {
    const s = createConnection({ host: "127.0.0.1", port: 9011 });
    s.on("connect", () => { s.destroy(); res(true); });
    s.on("error", () => res(false));
    setTimeout(() => { s.destroy(); res(false); }, 1000);
  });
}
for (let i = 0; i < 20 && (await portOpen()); i++) {
  await new Promise((r) => setTimeout(r, 500));
}

// 3. spawn baru detached (pola watchdog: DETACHED_PROCESS saja)
const DETACHED = 0x00000008;
const child = spawn(
  process.execPath,
  ["hq-server.mjs"],
  { cwd: ROOT, detached: true, stdio: ["ignore", openSync(OUT, "a"), openSync(ERR, "a")], windowsHide: true, creationFlags: DETACHED }
);
child.unref();
console.log(`spawned hq-server PID ${child.pid}`);

// 4. tunggu sehat (HTTPS self-signed)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let ok = false;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const r = await fetch("https://localhost:9011/login", { method: "GET" });
    if (r.status < 500) { ok = true; break; }
  } catch {}
}
console.log(ok ? "HQ SEHAT (port 9011 merespons)" : "HQ BELUM SEHAT dalam 60s");
process.exit(ok ? 0 : 1);
