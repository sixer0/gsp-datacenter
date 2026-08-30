// hq-server.mjs — production HTTPS server untuk Agent HQ (fix SEC-001, 30-08-2026)
// Ganti `next dev -H 0.0.0.0 --experimental-https`: bind 127.0.0.1 + NODE_ENV=production
// sehingga middleware auth AKTIF. Akses jarak jauh lewat Tailscale tetap bisa ke port ini
// karena Tailscale IP terikat di host — bila ingin hanya localhost, ubah HOST.
// Jalankan: node hq-server.mjs   (dari C:/Users/TRIAL/gsp-datacenter)
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync, existsSync } from "node:fs";
import next from "next/dist/server/next.js";

process.env.NODE_ENV = "production";

const PORT = parseInt(process.env.HQ_PORT || "9011", 10);
// SEC-001: TIDAK lagi bind 0.0.0.0. Loopback untuk mesin ini + IP Tailscale untuk
// akses jarak jauh yang sah; LAN/WAN tertutup. Auth NextAuth tetap aktif (production).
const HOSTS = (process.env.HQ_HOSTS || "127.0.0.1,100.102.23.27").split(",").map((s) => s.trim());
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
