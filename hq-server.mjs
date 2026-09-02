// hq-server.mjs — production HTTPS server untuk Agent HQ.
// SEC-001 (30-08): bind sempit 127.0.0.1 + IP Tailscale (LAN/WAN tertutup).
// HQ-BIND-002 (02-09, keputusan user): default bind 0.0.0.0 supaya akses remote
// (Tailscale/LAN) tidak bergantung IP statis yang bisa berubah; autostart
// (gsp-ecosystem-start.sh) dan hq_restart.mjs mewarisi default ini. Middleware
// auth NextAuth tetap AKTIF (NODE_ENV=production); firewall rule "GSP Agent HQ
// 9011" aktif semua profil. Bila perlu mempersempit lagi, set env HQ_HOSTS.
// Jalankan: node hq-server.mjs   (dari C:/Users/TRIAL/gsp-datacenter)
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import next from "next/dist/server/next.js";

process.env.NODE_ENV = "production";

const PORT = parseInt(process.env.HQ_PORT || "9011", 10);
// HQ-BIND-002 (02-09): default 0.0.0.0 (semua interface). HQ_HOSTS tetap dihormati
// untuk pembatasan eksplisit, mis. HQ_HOSTS="127.0.0.1,100.x.y.z" node hq-server.mjs
const HOSTS = (process.env.HQ_HOSTS || "0.0.0.0").split(",").map((s) => s.trim());
const KEY = "certs/hq-key.pem";
const CRT = "certs/hq-cert.pem";

const app = next({ dev: false, port: PORT, hostname: HOSTS[0] });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const handler = (req, res) => {
    handle(req, res).catch((e) => {
      console.error("request error:", e);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  };
  const tls = existsSync(KEY) && existsSync(CRT)
    ? { key: readFileSync(KEY), cert: readFileSync(CRT) } : null;
  let first = true;
  for (const host of HOSTS) {
    const server = tls ? createHttpsServer(tls, handler) : createServer(handler);
    server.on("error", (e) => console.error(`listener ${host} error:`, e.message));
    if (first) { server.listen(PORT, host, () => { console.log(`HQ production: ${tls ? "https" : "http"}://${host}:${PORT} (NODE_ENV=production)`); }); first = false; }
    else { try { server.listen(PORT, host, () => console.log(`HQ production: +${host}:${PORT}`)); } catch (e) { console.error(`bind ${host} gagal:`, e.message); } }
  }
});
