/*
 * Pemeriksaan awal isian spesifikasi artefak di peramban (S62; teks layar
 * FIX-4b sesuai kamus UX-01 §1.2). Bukan pengganti validasi
 * server (ajv + by-construction di R09); hanya menangkap kesalahan umum lebih
 * awal: JSON rusak, `$schema` salah, medan wajib dari JSON Schema registri,
 * medan asing bila skema menutupnya, serta aturan ringkas kontrak §3.5-3.8.
 */

import { DIAGRAM_EDGE_KINDS, DIAGRAM_FAMILIES } from "@/lib/studio/contract/enums";
import type { ChartDef } from "@/lib/studio/contract/types/params";
import { ARTIFACT_SCHEMA_BY_KIND, type ArtifactKindKey, type JsonSchemaDoc } from "./api";
import { SHA_PLACEHOLDER } from "./spec-templates";

export interface ClientIssue {
  pointer: string;
  message: string;
  /** Kode chart alternatif untuk jenis drawn=false. */
  alternatives?: string[];
}

export interface ClientCheck {
  spec: Record<string, unknown> | null;
  issues: ClientIssue[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** Posisi baris:kolom dari pesan JSON.parse ("position N"), bila ada. */
function jsonErrorWhere(text: string, message: string): string {
  const m = /position (\d+)/i.exec(message);
  if (!m) return "";
  const pos = Number(m[1]);
  const before = text.slice(0, pos);
  const line = before.split("\n").length;
  const col = pos - before.lastIndexOf("\n");
  return ` (baris ${line}, kolom ${col})`;
}

function checkChart(spec: Record<string, unknown>, charts: readonly ChartDef[] | null, out: ClientIssue[]) {
  const kind = spec.kind;
  if (typeof kind === "string" && kind !== "composite" && charts) {
    const def = charts.find((c) => c.code === kind);
    if (!def) {
      out.push({ pointer: "/kind", message: `Kode grafik "${kind}" tidak ada di katalog.` });
    } else if (!def.drawn) {
      out.push({
        pointer: "/kind",
        message: `${def.code} (${def.name}) belum dapat digambar Studio.`,
        alternatives: [...(def.alternatives ?? [])],
      });
    } else if (isObj(spec.data) && def.dataShape && spec.data.shape !== def.dataShape) {
      out.push({ pointer: "/data/shape", message: `Bentuk data ${def.code} harus "${def.dataShape}".` });
    }
  }
  if (kind !== "composite" && spec.data === undefined) out.push({ pointer: "/data", message: "Isian data wajib diisi untuk grafik tunggal." });
  if (kind === "composite" && !isObj(spec.composite)) out.push({ pointer: "/composite", message: "Grafik gabungan butuh isian composite." });
  if (typeof spec.title === "string" && !spec.title.trim().endsWith(".")) out.push({ pointer: "/title", message: "Judul harus satu kalimat diakhiri titik." });
  if (spec.widthMm !== undefined && spec.widthMm !== 128 && spec.widthMm !== 166) out.push({ pointer: "/widthMm", message: "Lebar hanya 128 atau 166 mm." });
  if (typeof spec.heightMm === "number" && spec.heightMm > 247) out.push({ pointer: "/heightMm", message: "Tinggi maksimum 247 mm." });
}

function checkDiagram(spec: Record<string, unknown>, out: ClientIssue[]) {
  if (typeof spec.family === "string" && !(DIAGRAM_FAMILIES as readonly string[]).includes(spec.family)) {
    out.push({ pointer: "/family", message: `Keluarga harus salah satu: ${DIAGRAM_FAMILIES.join(", ")}.` });
  }
  if (typeof spec.id === "string" && !/\d+\.\d+/.test(spec.id)) out.push({ pointer: "/id", message: 'Id harus memuat nomor gambar, mis. "Gambar 3.2".' });
  if (typeof spec.title === "string" && !spec.title.trim().endsWith(".")) out.push({ pointer: "/title", message: "Judul harus diakhiri titik." });
  if (spec.width_mm !== undefined && spec.width_mm !== 128 && spec.width_mm !== 166) out.push({ pointer: "/width_mm", message: "Lebar hanya 128 atau 166 mm." });
  if (spec.sources !== undefined && (!Array.isArray(spec.sources) || spec.sources.length === 0)) out.push({ pointer: "/sources", message: "Minimal satu sumber." });
  const ids = new Set<string>();
  if (Array.isArray(spec.nodes)) {
    if (spec.nodes.length === 0) out.push({ pointer: "/nodes", message: "Minimal satu simpul." });
    spec.nodes.forEach((n, i) => {
      if (!isObj(n)) return out.push({ pointer: `/nodes/${i}`, message: "Simpul harus objek." });
      if (!nonEmpty(n.id)) out.push({ pointer: `/nodes/${i}/id`, message: "Id simpul wajib." });
      else if (ids.has(String(n.id))) out.push({ pointer: `/nodes/${i}/id`, message: `Id simpul "${String(n.id)}" ganda.` });
      else ids.add(String(n.id));
      if (!nonEmpty(n.label)) out.push({ pointer: `/nodes/${i}/label`, message: "Label simpul wajib." });
      if (!isObj(n.class)) out.push({ pointer: `/nodes/${i}/class`, message: "Medan class wajib (boleh {})." });
    });
  }
  if (Array.isArray(spec.edges)) {
    spec.edges.forEach((e, i) => {
      if (!isObj(e)) return out.push({ pointer: `/edges/${i}`, message: "Sisi harus objek." });
      for (const end of ["from", "to"] as const) {
        if (!ids.has(String(e[end]))) out.push({ pointer: `/edges/${i}/${end}`, message: `Simpul "${String(e[end])}" tidak ada.` });
      }
      if (!(DIAGRAM_EDGE_KINDS as readonly unknown[]).includes(e.kind)) out.push({ pointer: `/edges/${i}/kind`, message: `Jenis sisi: ${DIAGRAM_EDGE_KINDS.join(", ")}.` });
      if (typeof e.label !== "string") out.push({ pointer: `/edges/${i}/label`, message: 'Label sisi wajib (boleh "").' });
    });
  }
}

function checkImage(spec: Record<string, unknown>, hasFile: boolean, out: ClientIssue[]) {
  const a = spec.asset;
  if (isObj(a)) {
    if (a.kind !== "raster") out.push({ pointer: "/asset/kind", message: 'Nilai asset.kind harus "raster".' });
    if (a.mime !== "image/png" && a.mime !== "image/jpeg") out.push({ pointer: "/asset/mime", message: "MIME hanya image/png atau image/jpeg." });
    if (a.sha256 === SHA_PLACEHOLDER) out.push({ pointer: "/asset/sha256", message: "Pilih berkas gambar; sidik berkas diisi otomatis." });
    else if (typeof a.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(a.sha256)) out.push({ pointer: "/asset/sha256", message: "Sidik berkas harus 64 karakter heksadesimal huruf kecil." });
    if (!hasFile && !nonEmpty(a.path) && !nonEmpty(a.dataBase64)) out.push({ pointer: "/asset", message: "Lampirkan berkas, atau isi asset.path / asset.dataBase64." });
  }
  if (spec.widthMm !== undefined && !(typeof spec.widthMm === "number" && spec.widthMm > 0)) out.push({ pointer: "/widthMm", message: "Lebar harus angka positif (mm)." });
}

function checkHtml(spec: Record<string, unknown>, out: ClientIssue[]) {
  if (isObj(spec.template) && !nonEmpty(spec.template.slug)) out.push({ pointer: "/template/slug", message: "Pilih templat." });
  const s = spec.source;
  if (isObj(s)) {
    if (s.kind === "document" && !nonEmpty(s.documentId)) out.push({ pointer: "/source/documentId", message: "Isi id dokumen sumber." });
    else if (s.kind === "artifact" && !nonEmpty(s.artifactId)) out.push({ pointer: "/source/artifactId", message: "Isi id artefak sumber." });
    else if (s.kind === "inline" && !isObj(s.document)) out.push({ pointer: "/source/document", message: "Sumber langsung butuh isi dokumen lengkap." });
    else if (!["document", "artifact", "inline"].includes(String(s.kind))) out.push({ pointer: "/source/kind", message: "Jenis sumber: document, artifact, atau inline." });
  }
  for (const k of ["html", "css", "js", "script", "rawHtml"]) {
    if (k in spec) out.push({ pointer: `/${k}`, message: "Kode halaman mentah tidak diterima; halaman web dirakit dari templat." });
  }
}

/** Periksa teks editor untuk jenis artefak terpilih. */
export function checkSpecText(
  text: string,
  kind: ArtifactKindKey,
  ctx: { schema: JsonSchemaDoc | null; charts: readonly ChartDef[] | null; hasFile: boolean },
): ClientCheck {
  const issues: ClientIssue[] = [];
  if (!text.trim()) return { spec: null, issues: [{ pointer: "", message: "Isian kosong." }] };
  if (/^\s*(```\s*mermaid|graph\s+(TD|LR|TB|RL|BT)\b|flowchart\s|sequenceDiagram)/i.test(text)) {
    return { spec: null, issues: [{ pointer: "", message: "Diagram berbentuk teks Mermaid ditolak. Pakai bentuk diagram Studio seperti contoh." }] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { spec: null, issues: [{ pointer: "", message: `Isian tidak dapat dibaca${jsonErrorWhere(text, msg)}. Periksa tanda kurung, koma, dan tanda kutip.` }] };
  }
  if (!isObj(parsed)) return { spec: null, issues: [{ pointer: "", message: "Spesifikasi harus berupa objek {…}." }] };

  const expected = ARTIFACT_SCHEMA_BY_KIND[kind];
  if (parsed.$schema !== expected) issues.push({ pointer: "/$schema", message: `Nilai $schema harus "${expected}".` });

  const schema = ctx.schema;
  if (schema) {
    for (const r of schema.required ?? []) {
      if (!(r in parsed)) issues.push({ pointer: `/${r}`, message: `Medan wajib "${r}" belum ada.` });
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const k of Object.keys(parsed)) {
        if (!(k in schema.properties)) issues.push({ pointer: `/${k}`, message: `Medan "${k}" tidak dikenal skema.` });
      }
    }
  }

  if (kind === "CHART") checkChart(parsed, ctx.charts, issues);
  else if (kind === "DIAGRAM") checkDiagram(parsed, issues);
  else if (kind === "IMAGE") checkImage(parsed, ctx.hasFile, issues);
  else checkHtml(parsed, issues);

  return { spec: parsed, issues };
}
