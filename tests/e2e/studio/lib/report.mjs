// SR-52: perekam hasil cek (id, flow, nama, lulus, detail) + penulis results.json.
import { writeFileSync, renameSync } from "node:fs";

export function recorder() {
  const results = [];
  const check = (id, name, ok, detail = "") => {
    results.push({ id, name, ok: !!ok, detail: String(detail).slice(0, 2500) });
    console.log(`${ok ? "PASS" : "FAIL"} | ${id} | ${name}${detail ? " | " + String(detail).slice(0, 400) : ""}`);
  };
  return { results, check };
}

export function writeAtomic(path, data) {
  writeFileSync(path + ".tmp", typeof data === "string" ? data : JSON.stringify(data, null, 2));
  renameSync(path + ".tmp", path);
}
