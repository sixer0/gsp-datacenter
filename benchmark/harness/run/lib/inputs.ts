/**
 * Muat masukan benchmark (S97): doc.json (S93), profil templat (S95, lewat
 * `loadResolvedProfileFile` S49 tanpa DB), indeks figur S94 dengan verifikasi
 * sha256 setiap berkas aset, lalu substitusi figur (D-14): blok `image`
 * doc.json untuk figur chart/diagram/simbol diganti blok S94 ber-spec, dengan
 * caption/sumber/kunci/format dari doc.json dipertahankan apa adanya (C1).
 *
 * Murni baca: tidak menulis berkas apa pun.
 *
 * SR-34: doc `studio.doc/v1` atau `studio.doc/v2` dan templat profil v1 atau
 * `studio.template/v2`; versi dideteksi dari isi berkas dan dicatat. Seam v2
 * yang belum ada (skema doc v2, pemuat templat v2) dikumpulkan di `notReady`
 * (langkah ingest NOT_READY), bukan galat masukan. Substitusi figur v2 hanya
 * membawa medan isi (`id`, `caption`, `source`, `keyRow`; tanpa medan tampilan
 * dan tanpa `x`, kontrak v2 §2.4); figur dipetakan lewat `id` (pid) blok.
 * RQ-9: spec S94 dipetakan ke `ChartV2` / `DiagramSpecV2` lewat adaptor murni
 * adapt-v1 (`figures_v2.ts`), bukan dibawa apa adanya.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { ResolvedTemplate, StudioDocV1 } from "../../../../src/lib/studio/contract";
import { STUDIO_MAX_ASSET_BYTES } from "../../../../src/lib/studio/contract/env";
import type { SkeletonInput } from "../../../../src/lib/studio/services/compose";
import { loadResolvedProfileFile } from "../../../../src/lib/studio/services/templates";
import { REPO_ROOT, type FigureMode, type SchemaRequest } from "./config";
import { mapFigureSpecToV2, type FigureSpecV2Mapping } from "./figures_v2";
import {
  DOC_V2_SEAM,
  TEMPLATE_V2_LOADER_EXPORT,
  TEMPLATE_V2_SEAM,
  detectDocSchema,
  detectTemplateSchema,
  docV2SchemaRegistered,
  versionOfDoc,
  versionOfTemplate,
  type DocSchemaId,
  type SchemaVersion,
  type TemplateSchemaId,
  type V2Seam,
} from "./schema";

/** Batas baca doc.json (S93 = 4,3 MB). */
const MAX_DOC_BYTES = 64 * 1024 * 1024;

export const ENGINE_KINDS = ["chart", "diagram", "symbolSheet"] as const;
export type EngineKind = (typeof ENGINE_KINDS)[number];

export interface FigureIndexEntry {
  id: string;
  placement: number;
  page: number;
  bigPage: boolean;
  kind: "chart" | "diagram" | "raster" | "symbolSheet" | "device";
  sha256: string;
  asset: string;
  path?: string;
  spec?: string;
  block?: string;
  figure?: string;
  mediaName?: string;
  widthMm?: number;
  heightMm?: number;
}

export interface FigureIndex {
  schema?: string;
  bigPages: number[];
  figures: FigureIndexEntry[];
  counts?: Record<string, number>;
  media?: Array<{ media: string; sha256: string; asset: string }>;
}

export interface AssetCheck {
  /** id figur (`bm-fig-NN`) atau media docx. */
  id: string;
  file: string;
  expected: string;
  actual: string | null;
  ok: boolean;
  /** sha256 di `doc.assets[id]` (bila ada) sama dengan indeks. */
  docAssetOk: boolean | null;
  note?: string;
}

export interface Substitution {
  id: string;
  kind: EngineKind;
  page: number;
  bigPage: boolean;
  figure: string | null;
  /** Pointer JSON blok di doc.json. */
  pointer: string | null;
  status: "SUBSTITUTED" | "KEPT_RASTER" | "NOT_FOUND" | "BLOCK_INVALID";
  /** Sumber figur mesin: id spec S94 (`spec.id`) atau `dialect:<d>` lembar simbol. */
  specId?: string | null;
  /** Path berkas spec S94 (chart/diagram) relatif akar repo. */
  specPath?: string | null;
  specSha256?: string | null;
  /** v2: `id` (pid) blok figur sesudah substitusi; dipakai memetakan blok snapshot ke figur. */
  pid?: string | null;
  /** RQ-9 (v2): medan spec S94 yang dibuang/diganti nama oleh pemetaan ke ChartV2/DiagramSpecV2. */
  v2Mapping?: Pick<FigureSpecV2Mapping, "stripped" | "renamed">;
  note?: string;
}

/** Versi skema masukan yang terdeteksi dari isi berkas (SR-34). */
export interface InputSchemas {
  doc: DocSchemaId;
  docVersion: SchemaVersion;
  template: TemplateSchemaId;
  templateVersion: SchemaVersion;
}

export interface LoadedInputs {
  /** Bentuk v1 atau v2 (lihat `schema.doc`); tipe v1 dipakai sampai kontrak v2 (SR-04) mendarat. */
  doc: StudioDocV1;
  docSha256: string;
  docBytes: number;
  schema: InputSchemas;
  /** null hanya bila pemuat templat v2 belum ada (`notReady`); ingest lalu NOT_READY. */
  template: ResolvedTemplate | null;
  /**
   * FIX-B (B-1, D-241): kerangka kanonik berkas `studio.template/v2` (SR-06) untuk
   * ingest v2 tanpa DB. null = templat v1 (ingest memakai jalurnya sendiri). Tanpa
   * ini ingest jatuh ke kerangka implisit (toc AUTO) dan menolak entri daftar isi.
   */
  skeleton: SkeletonInput | null;
  templateInfo: { file: string; sha256: string; slug: string | undefined; droppedDerived: unknown; ignoredFields: unknown; skeletonSha256: string | null };
  index: FigureIndex;
  indexSha256: string;
  assetChecks: AssetCheck[];
  substitutions: Substitution[];
  /** Masalah masukan yang membuat run tidak sah (exit 2). */
  fatal: string[];
  /** Temuan yang tidak menghentikan run. */
  warnings: string[];
  /** Seam v2 yang belum tersedia (langkah ingest NOT_READY, exit 1). */
  notReady: V2Seam[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function sha256Hex(b: Uint8Array | string): string {
  return createHash("sha256").update(b).digest("hex");
}

export function repoRel(abs: string): string {
  const r = path.relative(REPO_ROOT, abs);
  return r.startsWith("..") || path.isAbsolute(r) ? abs : r.split(path.sep).join("/");
}

function readCapped(file: string, cap: number, what: string): Buffer {
  const st = statSync(file);
  if (!st.isFile()) throw new Error(`${what} bukan berkas: ${file}`);
  if (st.size > cap) throw new Error(`${what} ${st.size} byte melebihi batas ${cap}: ${file}`);
  return readFileSync(file);
}

function readJson(file: string, cap: number, what: string): { raw: Buffer; data: unknown } {
  const raw = readCapped(file, cap, what);
  try {
    return { raw, data: JSON.parse(raw.toString("utf8").replace(/^﻿/, "")) };
  } catch (e) {
    throw new Error(`${what} bukan JSON sah (${file}): ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Path indeks S94 relatif akar repo (`benchmark/...`) atau direktori indeks. */
function resolveIndexPath(rel: string, indexDir: string): string {
  const fromRepo = path.resolve(REPO_ROOT, rel);
  return existsSync(fromRepo) ? fromRepo : path.resolve(indexDir, rel);
}

/** Byte aset figur dengan sha256 terverifikasi (dipakai fallback raster). */
export function readVerifiedAsset(entry: FigureIndexEntry, indexFile: string): Uint8Array {
  const file = resolveIndexPath(entry.asset, path.dirname(indexFile));
  const b = readCapped(file, STUDIO_MAX_ASSET_BYTES, `aset ${entry.id}`);
  const got = sha256Hex(b);
  if (got !== entry.sha256.toLowerCase()) throw new Error(`aset ${entry.id}: sha256 ${got} != indeks ${entry.sha256}`);
  return new Uint8Array(b);
}

function parseIndex(data: unknown): FigureIndex {
  if (!isRecord(data) || !Array.isArray(data.figures)) throw new Error("indeks figur tanpa larik `figures`");
  const figures: FigureIndexEntry[] = [];
  for (const [i, f] of data.figures.entries()) {
    if (!isRecord(f) || typeof f.id !== "string" || typeof f.sha256 !== "string" || typeof f.asset !== "string" || typeof f.kind !== "string") {
      throw new Error(`indeks figur entri ${i} tidak lengkap (id, kind, sha256, asset)`);
    }
    figures.push(f as unknown as FigureIndexEntry);
  }
  const bigPages = Array.isArray(data.bigPages) ? data.bigPages.filter((n): n is number => Number.isInteger(n)) : [];
  return {
    schema: typeof data.schema === "string" ? data.schema : undefined,
    bigPages,
    figures,
    counts: isRecord(data.counts) ? (data.counts as Record<string, number>) : undefined,
    media: Array.isArray(data.media) ? (data.media as FigureIndex["media"]) : undefined,
  };
}

/** Cari semua blok `image` ber-`asset` = id; kembalikan wadah + kunci untuk penggantian. */
function findImageBlocks(root: unknown, id: string): Array<{ parent: Record<string, unknown> | unknown[]; key: string | number; pointer: string }> {
  const hits: Array<{ parent: Record<string, unknown> | unknown[]; key: string | number; pointer: string }> = [];
  const walk = (node: unknown, ptr: string, parent: Record<string, unknown> | unknown[] | null, key: string | number | null): void => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${ptr}/${i}`, node, i));
      return;
    }
    if (!isRecord(node)) return;
    if (node.type === "image" && node.asset === id && parent !== null && key !== null) {
      hits.push({ parent, key, pointer: ptr });
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === "x" || k === "assets") continue;
      if (v !== null && typeof v === "object") walk(v, `${ptr}/${k}`, node, k);
    }
  };
  walk(root, "", null, null);
  return hits;
}

/** Medan blok doc.json yang dipertahankan (teks verbatim dan format terukur). */
const KEEP_FIELDS = ["blockId", "format", "runDefaults", "fieldFormats", "caption", "keyRow", "source", "widthMm", "heightMm", "paragraphFormat"] as const;

/** Medan isi blok figur v2 yang dipertahankan (§2.4: tanpa medan tampilan, tanpa ukuran). */
const KEEP_FIELDS_V2 = ["caption", "keyRow", "source"] as const;

/**
 * Blok figur mesin bentuk v2: `id` (pid) blok doc dipertahankan, atau id figur
 * S94 bila blok tanpa `id`; caption/sumber/kunci = konten blok doc. Chart/diagram
 * dari `mapping` (spec S94 -> ChartV2 / DiagramSpecV2, RQ-9), lembar simbol dari
 * dialek. Tanpa `x`, `format`, `widthMm`, `cols` (tampilan milik templat).
 */
function mergeFigureBlockV2(
  docBlock: Record<string, unknown>,
  s94: Record<string, unknown>,
  entry: FigureIndexEntry,
  mapping: FigureSpecV2Mapping | null,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { type: s94.type, id: typeof docBlock.id === "string" && docBlock.id ? docBlock.id : entry.id };
  if (s94.type === "symbolSheet") merged.dialect = s94.dialect;
  else Object.assign(merged, mapping?.fields ?? {});
  for (const k of KEEP_FIELDS_V2) if (docBlock[k] !== undefined) merged[k] = docBlock[k];
  return merged;
}

function mergeFigureBlock(docBlock: Record<string, unknown>, s94: Record<string, unknown>, entry: FigureIndexEntry, spec: unknown): Record<string, unknown> {
  const merged: Record<string, unknown> = { type: s94.type };
  for (const k of KEEP_FIELDS) if (docBlock[k] !== undefined) merged[k] = docBlock[k];
  if (s94.type === "symbolSheet") {
    merged.dialect = s94.dialect;
    if (s94.cols !== undefined) merged.cols = s94.cols;
  } else {
    merged.spec = spec;
  }
  merged.x = {
    ...(isRecord(docBlock.x) ? docBlock.x : {}),
    benchmarkFigure: { id: entry.id, kind: entry.kind, fallbackAsset: entry.id, block: entry.block ?? null },
  };
  return merged;
}

export interface LoadInputsArgs {
  doc: string;
  template: string;
  figureIndex: string;
  figures: FigureMode;
  /** `--schema` (SR-34): v1/v2 = versi isi berkas wajib cocok; auto = keduanya diterima. */
  schemaRequest?: SchemaRequest;
}

export function loadInputs(i: LoadInputsArgs): Promise<LoadedInputs> {
  return loadInputsImpl(i);
}

type TemplateLoad = { template: ResolvedTemplate; slug: string | undefined; droppedDerived: unknown; ignoredFields: unknown; skeleton?: SkeletonInput };

/**
 * Templat tanpa DB: profil v1 lewat `loadResolvedProfileFile` (S49); v2 lewat
 * pemuat `TEMPLATE_V2_LOADER_EXPORT` layanan templat bila sudah diekspor (SR-07).
 * Profil v1 TIDAK pernah dipakai untuk berkas v2 (esensial/kerangka akan
 * diabaikan diam-diam). null = seam v2 belum ada.
 */
async function loadTemplate(file: string, schema: TemplateSchemaId): Promise<TemplateLoad | null> {
  if (schema === "template-profile/v1") return loadResolvedProfileFile(file, { repoRoot: REPO_ROOT });
  const templates = (await import("../../../../src/lib/studio/services/templates")) as unknown as Record<string, unknown>;
  const loader = templates[TEMPLATE_V2_LOADER_EXPORT];
  if (typeof loader !== "function") return null;
  const r: unknown = await (loader as (f: string, o: { repoRoot: string }) => Promise<unknown>)(file, { repoRoot: REPO_ROOT });
  if (!isRecord(r) || !isRecord(r.template)) throw new Error(`${TEMPLATE_V2_LOADER_EXPORT} tidak mengembalikan { template }`);
  // FIX-B (B-1): kerangka berkas templat wajib ikut ke ingest (bukan kerangka implisit).
  if (!isRecord(r.skeleton) || typeof r.skeletonSha256 !== "string") {
    throw new Error(`${TEMPLATE_V2_LOADER_EXPORT} tidak mengembalikan { skeleton, skeletonSha256 } untuk ${repoRel(file)}`);
  }
  const template = r.template as unknown as ResolvedTemplate;
  return {
    template,
    slug: typeof r.slug === "string" ? r.slug : undefined,
    droppedDerived: r.droppedDerived ?? [],
    ignoredFields: r.ignoredFields ?? [],
    skeleton: {
      templateVersionId: template.versionId,
      skeleton: r.skeleton as unknown as SkeletonInput["skeleton"],
      skeletonSha256: r.skeletonSha256,
      implicit: false,
    },
  };
}

async function loadInputsImpl(i: LoadInputsArgs): Promise<LoadedInputs> {
  const fatal: string[] = [];
  const warnings: string[] = [];
  const notReady: V2Seam[] = [];
  const req = i.schemaRequest ?? "auto";

  // Dokumen v1/v2 (versi dari `$schema`).
  const docRead = readJson(i.doc, MAX_DOC_BYTES, "doc");
  const docSchema = detectDocSchema(docRead.data);
  if (!docSchema) fatal.push(`doc ${repoRel(i.doc)} bukan studio.doc/v1 atau studio.doc/v2`);
  else if (req !== "auto" && versionOfDoc(docSchema) !== req) fatal.push(`--schema ${req}: doc ${repoRel(i.doc)} berisi ${docSchema}`);
  const doc = docRead.data as StudioDocV1;
  if (docSchema === "studio.doc/v2" && !(await docV2SchemaRegistered())) notReady.push(DOC_V2_SEAM);

  // Templat tanpa DB: profil v1 (S49) atau studio.template/v2.
  const tplRead = readJson(i.template, MAX_DOC_BYTES, "templat");
  const tplRaw = tplRead.raw;
  const tplSchema = detectTemplateSchema(tplRead.data) ?? "template-profile/v1";
  if (req !== "auto" && versionOfTemplate(tplSchema) !== req) fatal.push(`--schema ${req}: templat ${repoRel(i.template)} berisi ${tplSchema}`);
  const loaded = await loadTemplate(i.template, tplSchema);
  if (!loaded) notReady.push(TEMPLATE_V2_SEAM);
  const schema: InputSchemas = {
    doc: docSchema ?? "studio.doc/v1",
    docVersion: versionOfDoc(docSchema ?? "studio.doc/v1"),
    template: tplSchema,
    templateVersion: versionOfTemplate(tplSchema),
  };
  if (docSchema && schema.docVersion !== schema.templateVersion) {
    warnings.push(`versi skema campuran: doc ${schema.doc}, templat ${schema.template} (--schema ${req})`);
  }
  const slug = isRecord(doc) && isRecord(doc.template) ? String(doc.template.slug ?? "") : "";
  if (loaded?.slug && slug && loaded.slug !== slug) warnings.push(`slug profil ${loaded.slug} berbeda dari doc.template.slug ${slug}`);

  // Indeks figur S94 + verifikasi sha256.
  const idxRead = readJson(i.figureIndex, MAX_DOC_BYTES, "indeks figur");
  const index = parseIndex(idxRead.data);
  const indexDir = path.dirname(i.figureIndex);
  const shaCache = new Map<string, string | null>();
  const shaOf = (file: string): string | null => {
    if (!shaCache.has(file)) {
      try {
        shaCache.set(file, sha256Hex(readCapped(file, STUDIO_MAX_ASSET_BYTES, "aset")));
      } catch {
        shaCache.set(file, null);
      }
    }
    return shaCache.get(file) ?? null;
  };
  const docAssets = isRecord(doc.assets) ? (doc.assets as Record<string, { sha256?: string; assetRef?: string }>) : {};
  // IP-53: aset v2 membawa `assetRef: "sha256:<hex>"` (studio.doc/v2), v1 membawa `sha256`.
  const docAssetSha = (a: { sha256?: string; assetRef?: string }): string =>
    String(a.sha256 ?? (typeof a.assetRef === "string" && a.assetRef.startsWith("sha256:") ? a.assetRef.slice(7) : "")).toLowerCase();
  const assetChecks: AssetCheck[] = [];
  for (const f of index.figures) {
    const file = resolveIndexPath(f.asset, indexDir);
    const actual = shaOf(file);
    const expected = f.sha256.toLowerCase();
    const da = docAssets[f.id];
    const docAssetOk = da ? docAssetSha(da) === expected : null;
    const c: AssetCheck = { id: f.id, file: repoRel(file), expected, actual, ok: actual === expected, docAssetOk };
    if (actual === null) c.note = "berkas tidak ada / tidak terbaca";
    if (!c.ok) fatal.push(`aset ${f.id}: sha256 ${actual ?? "(tak terbaca)"} != indeks ${expected} (${c.file})`);
    if (docAssetOk === false) fatal.push(`aset ${f.id}: sha256 doc.assets berbeda dari indeks S94`);
    assetChecks.push(c);
  }
  for (const m of index.media ?? []) {
    const file = resolveIndexPath(m.asset, indexDir);
    const actual = shaOf(file);
    const ok = actual === m.sha256.toLowerCase();
    assetChecks.push({ id: m.media, file: repoRel(file), expected: m.sha256.toLowerCase(), actual, ok, docAssetOk: null });
    if (!ok) fatal.push(`media ${m.media}: sha256 ${actual ?? "(tak terbaca)"} != indeks ${m.sha256}`);
  }
  // Setiap kunci doc.assets harus tercakup indeks (sumber byte ingest).
  const indexed = new Set(index.figures.map((f) => f.id));
  for (const k of Object.keys(docAssets)) if (!indexed.has(k)) warnings.push(`doc.assets["${k}"] tidak ada di indeks S94 (byte dicari ingest dari sumber lain)`);

  // Substitusi figur mesin (D-14).
  const substitutions: Substitution[] = [];
  for (const f of index.figures) {
    if (!(ENGINE_KINDS as readonly string[]).includes(f.kind)) continue;
    const kind = f.kind as EngineKind;
    const base: Omit<Substitution, "status" | "pointer"> = { id: f.id, kind, page: f.page, bigPage: f.bigPage, figure: f.figure ?? null };
    const hits = findImageBlocks(doc, f.id);
    if (hits.length !== 1) {
      substitutions.push({ ...base, pointer: null, status: "NOT_FOUND", note: `${hits.length} blok image ber-asset ${f.id}` });
      warnings.push(`figur ${f.id}: ${hits.length} blok image ber-asset (harus 1); tetap raster`);
      continue;
    }
    const hit = hits[0];
    if (i.figures === "raster") {
      substitutions.push({ ...base, pointer: hit.pointer, status: "KEPT_RASTER", note: "--figures raster" });
      continue;
    }
    if (!f.block) {
      substitutions.push({ ...base, pointer: hit.pointer, status: "BLOCK_INVALID", note: "indeks tanpa path blok" });
      warnings.push(`figur ${f.id}: indeks tanpa path blok S94; tetap raster`);
      continue;
    }
    let s94: unknown;
    try {
      s94 = readJson(resolveIndexPath(f.block, indexDir), MAX_DOC_BYTES, `blok ${f.id}`).data;
    } catch (e) {
      substitutions.push({ ...base, pointer: hit.pointer, status: "BLOCK_INVALID", note: e instanceof Error ? e.message : String(e) });
      warnings.push(`figur ${f.id}: blok S94 tidak terbaca; tetap raster`);
      continue;
    }
    const okShape =
      isRecord(s94) &&
      s94.type === kind &&
      (kind === "symbolSheet" ? typeof s94.dialect === "string" : isRecord(s94.spec));
    if (!okShape) {
      substitutions.push({ ...base, pointer: hit.pointer, status: "BLOCK_INVALID", note: `blok S94 bukan ${kind} lengkap` });
      warnings.push(`figur ${f.id}: blok S94 bukan ${kind} lengkap; tetap raster`);
      continue;
    }
    const s94Block = s94 as Record<string, unknown>;
    // D-118: chart/diagram dirender dari BERKAS spec S94 (`index.spec`); spec di
    // blok S94 hanya salinan. Selisih = peringatan, berkas spec yang menang.
    let spec: unknown = s94Block.spec;
    let specPath: string | null = null;
    let specSha256: string | null = null;
    let specId: string | null = kind === "symbolSheet" ? `dialect:${String(s94Block.dialect)}` : null;
    if (kind !== "symbolSheet") {
      if (!f.spec) {
        substitutions.push({ ...base, pointer: hit.pointer, status: "BLOCK_INVALID", note: "indeks tanpa path spec S94" });
        warnings.push(`figur ${f.id}: indeks tanpa path spec S94; tetap raster`);
        continue;
      }
      try {
        const specFile = resolveIndexPath(f.spec, indexDir);
        const r = readJson(specFile, MAX_DOC_BYTES, `spec ${f.id}`);
        spec = r.data;
        specPath = repoRel(specFile);
        specSha256 = sha256Hex(r.raw);
      } catch (e) {
        substitutions.push({ ...base, pointer: hit.pointer, status: "BLOCK_INVALID", note: e instanceof Error ? e.message : String(e) });
        warnings.push(`figur ${f.id}: spec S94 tidak terbaca; tetap raster`);
        continue;
      }
      if (!isRecord(spec)) {
        substitutions.push({ ...base, pointer: hit.pointer, specPath, specSha256, status: "BLOCK_INVALID", note: "spec S94 bukan objek JSON" });
        warnings.push(`figur ${f.id}: spec S94 bukan objek JSON; tetap raster`);
        continue;
      }
      specId = typeof spec.id === "string" ? spec.id : null;
      if (JSON.stringify(spec) !== JSON.stringify(s94Block.spec)) warnings.push(`figur ${f.id}: spec di blok S94 berbeda dari ${specPath}; berkas spec yang dipakai`);
    }
    // RQ-9: doc v2 menerima isi ChartV2 / DiagramSpecV2, bukan spec S94 mentah.
    let mapping: FigureSpecV2Mapping | null = null;
    if (schema.docVersion === "v2" && kind !== "symbolSheet") {
      try {
        mapping = mapFigureSpecToV2(kind, spec as Record<string, unknown>);
      } catch (e) {
        substitutions.push({ ...base, pointer: hit.pointer, specPath, specSha256, status: "BLOCK_INVALID", note: e instanceof Error ? e.message : String(e) });
        warnings.push(`figur ${f.id}: spec S94 tidak terpetakan ke ${kind} v2; tetap raster`);
        continue;
      }
    }
    const docBlock = (hit.parent as Record<string | number, unknown>)[hit.key] as Record<string, unknown>;
    const merged = schema.docVersion === "v2" ? mergeFigureBlockV2(docBlock, s94Block, f, mapping) : mergeFigureBlock(docBlock, s94Block, f, spec);
    (hit.parent as Record<string | number, unknown>)[hit.key] = merged;
    const pid = schema.docVersion === "v2" && typeof merged.id === "string" ? merged.id : null;
    substitutions.push({
      ...base,
      pointer: hit.pointer,
      status: "SUBSTITUTED",
      specId,
      specPath,
      specSha256,
      ...(pid ? { pid } : {}),
      ...(mapping ? { v2Mapping: { stripped: mapping.stripped, renamed: mapping.renamed } } : {}),
    });
  }

  return {
    doc,
    docSha256: sha256Hex(docRead.raw),
    docBytes: docRead.raw.length,
    schema,
    template: loaded?.template ?? null,
    skeleton: loaded?.skeleton ?? null,
    templateInfo: {
      file: repoRel(i.template),
      sha256: sha256Hex(tplRaw),
      slug: loaded?.slug,
      droppedDerived: loaded?.droppedDerived ?? null,
      ignoredFields: loaded?.ignoredFields ?? null,
      skeletonSha256: loaded?.skeleton?.skeletonSha256 ?? null,
    },
    index,
    indexSha256: sha256Hex(idxRead.raw),
    assetChecks,
    substitutions,
    fatal,
    warnings,
    notReady,
  };
}
