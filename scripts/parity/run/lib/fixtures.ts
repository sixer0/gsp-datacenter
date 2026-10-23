/**
 * Penemuan fixture korpus S63 (`tests/parity/fixtures/**`) berdasarkan isi:
 *
 * - `$schema` studio.doc/v1 | studio.chart/v1 | studio.diagram/v1 | studio.image/v1;
 * - simbol: objek `{id|symbol}` atau `{sheet}`; larik id simbol, atau
 *   `{symbols: [...]}` / `{ids: [...]}` (dipecah menjadi satu fixture per id).
 *
 * Berkas pendamping (opsional, di samping fixture `<stem>.json`):
 * `<stem>.template.json` (profil templat dokumen), `<stem>.snapshot.svg` /
 * `<stem>.snapshot.png` (snapshot beku kelas CC). Salinan v2 dokumen
 * `doc/v2/<stem>.json` (SR-41) memakai `<stem>.template.json` di sampingnya,
 * atau bila tidak ada, milik pasangan v1 `doc/<stem>.template.json`.
 * Berkas `*.template.json`, `*.ref.json`, dan nama berawalan `_` tidak dianggap
 * fixture; JSON lain yang tidak dikenali dilaporkan SKIPPED beserta alasannya.
 *
 * Direktori `garis_a/` (salinan byte-identik sumber Garis A, F-S78-2) TIDAK PERNAH
 * dipungut, terlepas dari isi `manifest.json`: berkasnya dilaporkan SKIPPED.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { detectKind, type InputKind } from "./render";

const SYMBOL_ID_RE = /^[a-z]{3}:[a-z0-9_-]+$/i;

export interface Fixture {
  /** Id stabil: path relatif posix tanpa `.json` (+ `#<id simbol>`). */
  id: string;
  kind: InputKind;
  /** Path berkas spec, atau id simbol langsung (fixture pecahan larik). */
  input: string;
  file: string;
  /** Kode chart / keluarga diagram / id simbol (bila ada). */
  code?: string;
  template?: string;
  snapshotSvg?: string;
  snapshotPng?: string;
  /** Nama direktori kerja pendek dan aman. */
  workName: string;
}

export interface SkippedFile {
  file: string;
  reason: string;
}

/** Nama direktori salinan sumber Garis A (bukan fixture kontrak; F-S78-2, D-117). */
export const GARIS_A_DIR = "garis_a";

function walk(dir: string, out: string[], garisA?: string[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith("_") || e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (garisA && e.name.toLowerCase() === GARIS_A_DIR) walk(abs, garisA);
      else walk(abs, out, garisA);
    } else if (e.isFile() && e.name.toLowerCase().endsWith(".json")) out.push(abs);
  }
}

function workName(id: string): string {
  const clean = id.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  if (clean.length <= 60) return clean || "fixture";
  const h = createHash("sha256").update(id).digest("hex").slice(0, 8);
  return `${clean.slice(0, 50)}_${h}`;
}

/** Glob sederhana: `**` lintas segmen, `*` dan `?` dalam segmen. Pola tanpa `/` juga dicocokkan ke nama dasar. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else re += "[^/]*";
    } else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

export function matchesOnly(f: Fixture, glob: string | undefined): boolean {
  if (!glob) return true;
  const re = globToRegExp(glob.replace(/\\/g, "/"));
  const cands = [f.id, `${f.id.split("#")[0]}.json`, f.code ?? ""];
  if (!glob.includes("/")) cands.push(f.id.split("/").pop() ?? f.id);
  return cands.some((c) => c !== "" && re.test(c));
}

function sidecar(file: string, suffix: string): string | undefined {
  const p = file.replace(/\.json$/i, suffix);
  return existsSync(p) && statSync(p).isFile() ? p : undefined;
}

/** Templat pendamping; salinan v2 `<dir>/v2/<stem>.json` mewarisi `<dir>/<stem>.template.json` (SR-41). */
function templateSidecar(file: string): string | undefined {
  const own = sidecar(file, ".template.json");
  if (own) return own;
  const dir = path.dirname(file);
  if (path.basename(dir).toLowerCase() !== "v2") return undefined;
  return sidecar(path.join(path.dirname(dir), path.basename(file)), ".template.json");
}

/**
 * Berkas sumber non-kontrak yang didaftarkan `manifest.json` (`sources[].file`, mis. salinan Garis A
 * `diagram/garis_a/*`): bukan fixture, dilewati dengan alasan (F-S78-2).
 */
export function manifestSources(root: string): Set<string> {
  const out = new Set<string>();
  const m = path.join(root, "manifest.json");
  if (!existsSync(m)) return out;
  try {
    const data = JSON.parse(readFileSync(m, "utf8").replace(/^﻿/, "")) as { sources?: Array<{ file?: unknown }> };
    for (const s of data.sources ?? []) if (typeof s?.file === "string") out.add(s.file.replace(/\\/g, "/"));
  } catch {
    // manifest rusak: tidak ada pengecualian; berkasnya sendiri dilaporkan SKIPPED oleh penemuan.
  }
  return out;
}

export function discoverFixtures(root: string): { fixtures: Fixture[]; skipped: SkippedFile[] } {
  const files: string[] = [];
  const garisA: string[] = [];
  walk(root, files, garisA);
  files.sort();
  const fixtures: Fixture[] = [];
  const skipped: SkippedFile[] = [];
  for (const file of garisA.sort()) {
    skipped.push({ file: path.relative(root, file).split(path.sep).join("/"), reason: `direktori ${GARIS_A_DIR}/: salinan sumber Garis A, bukan fixture kontrak (F-S78-2)` });
  }
  const sources = manifestSources(root);
  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (/\.(template|ref)\.json$/i.test(rel)) continue;
    if (sources.has(rel)) {
      skipped.push({ file: rel, reason: "manifest.sources: salinan sumber, bukan fixture kontrak (F-S78-2)" });
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
    } catch (err) {
      skipped.push({ file: rel, reason: `JSON tidak sah: ${err instanceof Error ? err.message : String(err)}` });
      continue;
    }
    const id = rel.replace(/\.json$/i, "");
    const base = { file, template: templateSidecar(file), snapshotSvg: sidecar(file, ".snapshot.svg"), snapshotPng: sidecar(file, ".snapshot.png") };
    const list = Array.isArray(data)
      ? data
      : data && typeof data === "object" && !("$schema" in data)
        ? ((data as Record<string, unknown>).symbols ?? (data as Record<string, unknown>).ids)
        : undefined;
    if (Array.isArray(list)) {
      const ids = list.filter((v): v is string => typeof v === "string" && SYMBOL_ID_RE.test(v));
      if (ids.length === 0 || ids.length !== list.length) {
        skipped.push({ file: rel, reason: "larik bukan daftar id simbol dialek:nama" });
        continue;
      }
      for (const sid of ids) {
        const fid = `${id}#${sid}`;
        fixtures.push({ ...base, id: fid, kind: "symbol", input: sid, code: sid, workName: workName(fid) });
      }
      continue;
    }
    const det = detectKind(data);
    if (!det) {
      skipped.push({ file: rel, reason: "bukan studio.doc|chart|diagram|image/v1 maupun simbol {id|sheet}" });
      continue;
    }
    const o = data as Record<string, unknown>;
    const code =
      det.kind === "chart" ? String(o.kind ?? "") : det.kind === "diagram" ? String(o.family ?? "") : det.kind === "symbol" ? String(o.id ?? o.symbol ?? `sheet:${String(o.sheet === true ? o.dialect : o.sheet)}`) : undefined;
    fixtures.push({ ...base, id, kind: det.kind, input: file, ...(code ? { code } : {}), workName: workName(id) });
  }
  // Nama kerja unik (pemotongan dapat bertabrakan secara teori).
  const seen = new Map<string, number>();
  for (const f of fixtures) {
    const n = (seen.get(f.workName) ?? 0) + 1;
    seen.set(f.workName, n);
    if (n > 1) f.workName = `${f.workName}_${n}`;
  }
  return { fixtures, skipped };
}
