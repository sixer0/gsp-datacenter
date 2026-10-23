// SR-52: klien API agen (jalur x-internal-secret, panduan agen §2). Nilai rahasia tidak pernah dicetak.
import { envValue } from "./env.mjs";

export const BASE = process.env.SR52_BASE_URL || "http://127.0.0.1:9021";

export async function agent(method, path, body, { headers = {}, raw = false } = {}) {
  const h = { "x-internal-secret": envValue("INTERNAL_API_SECRET"), ...headers };
  let payload;
  if (body !== undefined && !raw) {
    h["content-type"] = "application/json";
    payload = JSON.stringify(body);
  } else if (raw) payload = body;
  const t0 = Date.now();
  const r = await fetch(BASE + path, { method, headers: h, body: payload, redirect: "manual" });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, ms: Date.now() - t0, corr: r.headers.get("x-correlation-id"), headers: r.headers };
}

export async function agentBytes(path) {
  const r = await fetch(BASE + path, { headers: { "x-internal-secret": envValue("INTERNAL_API_SECRET") } });
  return { status: r.status, headers: r.headers, bytes: Buffer.from(await r.arrayBuffer()) };
}
