// SR-52: pembaca .env tanpa mencetak nilai apa pun. Nilai hanya dipakai di proses.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "../../../..");

let cache = null;
export function envValue(key) {
  if (!cache) {
    cache = {};
    for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) cache[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  const v = cache[key];
  if (!v) throw new Error(`env ${key} tidak tersedia`);
  return v;
}

/** Pastikan DATABASE_URL menunjuk gsp_agent_hq_v21 (bukan produksi). Tidak mencetak URL. */
export function assertV21() {
  const url = envValue("DATABASE_URL");
  const db = new URL(url).pathname.replace(/^\//, "");
  if (db !== "gsp_agent_hq_v21") throw new Error(`DATABASE_URL bukan gsp_agent_hq_v21 (db=${db})`);
  return url;
}
