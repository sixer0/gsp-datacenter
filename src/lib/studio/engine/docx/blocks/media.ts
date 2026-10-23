/**
 * Gambar inline untuk perangkat teks (S16): Datum Rule bab (K-24), Datum Rule
 * 166 dan logo (`device`, K-01/K-04). Pola `wp:inline` BM.docx (research/07 §7).
 *
 * Konvensi relasi media (diajukan ke S20 lewat file_requests): fragmen
 * menulis `r:embed="{{media:<nama>}}"`; perakit mengganti placeholder dengan
 * rId relasi `word/media/<nama>` dan menghapus duplikat nama. Namespace
 * `wp`/`a`/`pic`/`r` dideklarasikan lokal di fragmen agar tidak bergantung
 * pada akar dokumen. Id `wp:docPr` deterministik per blok (ordinal x 100 + n);
 * perakit boleh menomori ulang berurutan.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { docAssetBytes } from "../../bind";
import type { BlockEnv } from "./env";
import { escapeXml, int } from "./xml";

export const MEDIA_REL_PLACEHOLDER_RE = /\{\{media:([^}]+)\}\}/g;

export function mediaRelPlaceholder(name: string): string {
  return `{{media:${name}}}`;
}

const EMU_PER_MM = 36000;
const NS_WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export interface LoadedImage {
  name: string;
  data: Uint8Array;
  contentType: "image/png" | "image/jpeg";
  widthPx?: number;
  heightPx?: number;
}

function sniff(data: Uint8Array): "image/png" | "image/jpeg" | undefined {
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  return undefined;
}

/** Ukuran piksel PNG dari IHDR; JPEG tidak diurai (ukuran wajib dari spesifikasi). */
function pngSize(data: Uint8Array): { w: number; h: number } | undefined {
  if (data.length < 24) return undefined;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const w = dv.getUint32(16);
  const h = dv.getUint32(20);
  return w > 0 && h > 0 ? { w, h } : undefined;
}

/**
 * Muat aset gambar: aset templat (`tpl.assets[key].absPath`, jenis raster/base)
 * lalu aset dokumen lewat sumber byte tunggal `docAssetBytes` (IP-34:
 * `ctx.assetBytes` per sha256, cadangan `dataBase64`). `undefined` + log warn
 * bila tidak tersedia; pemanggil memakai cadangan.
 */
export function loadImageAsset(env: BlockEnv, key: string): LoadedImage | undefined {
  let data: Uint8Array | undefined;
  let sha: string | undefined;
  const tplAsset = env.ctx.tpl.assets[key];
  if (tplAsset && tplAsset.kind !== "font") {
    try {
      data = new Uint8Array(readFileSync(tplAsset.absPath));
      sha = tplAsset.sha256;
    } catch (e) {
      env.warn(`aset templat "${key}" tidak terbaca (${e instanceof Error ? e.message : String(e)})`, "FILE_MISSING_ON_DISK");
      return undefined;
    }
  } else {
    const src = docAssetBytes(env.ctx, key, env.block.address ?? undefined);
    if (src?.bytes) {
      data = src.bytes;
      sha = src.ref.sha256;
    } else if (src?.invalidBase64) {
      env.warn(`aset dokumen "${key}": dataBase64 bukan base64 yang sah`, "ASSET_TYPE_UNSUPPORTED");
      return undefined;
    } else if (src) {
      env.warn(`aset dokumen "${key}" tanpa byte (assetBytes/dataBase64; path relatif tidak diselesaikan di modul blok)`, "FILE_NOT_FOUND");
      return undefined;
    }
  }
  if (!data) {
    env.warn(`aset gambar "${key}" tidak ada di templat maupun dokumen`, "FILE_NOT_FOUND");
    return undefined;
  }
  const contentType = sniff(data);
  if (!contentType) {
    env.warn(`aset "${key}" bukan PNG/JPEG`, "ASSET_TYPE_UNSUPPORTED");
    return undefined;
  }
  const digest = (sha && /^[0-9a-f]{16,}$/i.test(sha) ? sha : createHash("sha256").update(data).digest("hex")).toLowerCase();
  const ext = contentType === "image/png" ? "png" : "jpeg";
  const size = contentType === "image/png" ? pngSize(data) : undefined;
  return { name: `studio-${digest.slice(0, 16)}.${ext}`, data, contentType, widthPx: size?.w, heightPx: size?.h };
}

/** Tinggi mm: eksplisit, atau dari rasio piksel. */
export function imageHeightMm(img: LoadedImage, widthMm: number, heightMm?: number): number | undefined {
  if (heightMm !== undefined && heightMm > 0) return heightMm;
  if (img.widthPx && img.heightPx) return (widthMm * img.heightPx) / img.widthPx;
  return undefined;
}

/** Run `w:drawing` berisi `wp:inline` untuk gambar yang sudah didaftarkan ke env. */
export function inlineDrawingRun(env: BlockEnv, img: LoadedImage, widthMm: number, heightMm: number, rPr = ""): string {
  env.addMedia({ name: img.name, data: img.data, contentType: img.contentType });
  const id = env.nextDrawingId();
  const cx = int(widthMm * EMU_PER_MM);
  const cy = int(heightMm * EMU_PER_MM);
  const name = escapeXml(img.name);
  return (
    `<w:r>${rPr}<w:drawing>` +
    `<wp:inline xmlns:wp="${NS_WP}" distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${id}" name="Picture ${id}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="${NS_A}" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="${NS_A}"><a:graphicData uri="${NS_PIC}">` +
    `<pic:pic xmlns:pic="${NS_PIC}">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip xmlns:r="${NS_R}" r:embed="${escapeXml(mediaRelPlaceholder(img.name))}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  );
}
