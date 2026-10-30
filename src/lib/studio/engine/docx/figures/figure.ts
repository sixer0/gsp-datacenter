/**
 * Renderer DOCX blok figur `chart`, `diagram`, `image`, `symbolSheet` (S19).
 *
 * Urutan paragraf (BM research/07 §3 dan §7; DT-15 caption di atas, SUMBER di
 * bawah):
 *   1. caption (K-29): run label "Gambar n.m" + pemisah, lalu satu kalimat
 *   2. paragraf gambar (K-32): `wp:inline` berukuran mm tepat, spasi baris
 *      auto (melepas spasi tepat badan, P9-51) + keepNext
 *      (symbolSheet/diagram berlembar banyak: satu paragraf per lembar)
 *   3. baris KUNCI opsional (K-33)
 *   4. baris SUMBER + PROVENANS (K-34, border atas ink200)
 *
 * Sumber bitmap:
 *   - chart/diagram/symbolSheet: PNG 300 dpi dari `ctx.figures` (diisi
 *     `prepareFigureStore` lewat layanan browser S25 sebelum perakitan);
 *   - image: `ctx.figures` bila ada, selain itu aset raster bersha256.
 * Media dideduplikasi menurut sha256 dengan nama part deterministik.
 */
import type {
  Caption,
  ChartBlock,
  DiagramBlock,
  DocxBlockRenderer,
  DocxFragment,
  FigureCommon,
  ImageBlock,
  Inline,
  NormBlock,
  ParamMap,
  ProvenanceMark,
  RenderContext,
  Run,
  RunProps,
  SourceLine,
  SymbolSheetBlock,
} from "../../../contract";
import { facesInXml, hfRunXml, inlinePlain, runOwnProps } from "../package/xml";
import {
  DEFAULT_CAPTION_SEPARATOR,
  FIGURE_LABELS,
  FIGURE_LABEL_SPACING,
  defaultGlyphRun,
  figureRole,
  markGlyph,
  mergePara,
  mergeRun,
} from "./defaults";
import { type FigureAltInput, figureAltText, stripSourceLabel } from "../../front/alt-text";
import { failRender, warnRender } from "./log";
import { type FigureImage, type FigureMediaEntry, addMedia, figureImageFromBytes, figureMediaRelId, resolveRasterAsset } from "./media";
import { DOCPR_ID_BASE, drawingParagraphXml, inlineRunsXml, paragraphXml, textRun } from "./ooxml";
import { RASTER_DPI_FLOOR, classDerivedWidth, rasterPlacedWidthMm } from "../../tokens/raster-width";

export type FigureBlockType = "chart" | "diagram" | "image" | "symbolSheet";
type FigureBlock = ChartBlock | DiagramBlock | ImageBlock | SymbolSheetBlock;

/**
 * Lebar figur sah TURUNAN (D-158/D-245 H1): `grid.allowedFigureWidthsMm` efektif
 * (kolom teks, bentang penuh; A4 = 128/166). Aset raster boleh selain ini.
 */
const FIGURE_WIDTHS_PARAM = "grid.allowedFigureWidthsMm";
/** DATUM-33: tinggi figur <= `diagram.maxHeightMm` (P9-45) / blok teks turunan `grid.textBlockHeightMm` (A4 247). */
const MAX_HEIGHT_PARAMS = ["diagram.maxHeightMm", "grid.textBlockHeightMm"] as const;
/** Toleransi keanggotaan lebar sah (mm). */
const WIDTH_TOLERANCE_MM = 0.005;
/** DATUM-39: dpi efektif minimum aset raster (= batas bawah R-65 `image.rasterDpi`, 150). */
const MIN_RASTER_DPI = RASTER_DPI_FLOOR;
/** Batas jumlah lembar per blok (penjaga loop `#n`). */
const MAX_SHEETS = 64;

function paramNum(p: ParamMap, key: string): number | undefined {
  const v = p[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Lebar figur sah efektif; absen/tidak sah = BY_CONSTRUCTION_FAILED (tanpa cadangan literal A4). */
function allowedFigureWidths(block: NormBlock, ctx: RenderContext): number[] {
  const v = ctx.tpl.params[FIGURE_WIDTHS_PARAM];
  const out = Array.isArray(v) ? v.filter((w): w is number => typeof w === "number" && Number.isFinite(w) && w > 0) : [];
  if (out.length === 0 || (Array.isArray(v) && out.length !== v.length)) {
    failRender(ctx, "BY_CONSTRUCTION_FAILED", `Lebar figur sah tidak terbaca: ${FIGURE_WIDTHS_PARAM} wajib ada di parameter templat`, block.address ?? undefined, {
      key: FIGURE_WIDTHS_PARAM,
    });
  }
  return out;
}

/** Tinggi figur maksimum efektif; absen = BY_CONSTRUCTION_FAILED (tanpa cadangan literal 247). */
function maxFigureHeight(block: NormBlock, ctx: RenderContext): number {
  for (const key of MAX_HEIGHT_PARAMS) {
    const v = paramNum(ctx.tpl.params, key);
    if (v !== undefined && v > 0) return v;
  }
  return failRender(ctx, "BY_CONSTRUCTION_FAILED", `Tinggi figur maksimum tidak terbaca: ${MAX_HEIGHT_PARAMS.join(" / ")} wajib ada di parameter templat`, block.address ?? undefined, {
    keys: [...MAX_HEIGHT_PARAMS],
  });
}

function mmList(ws: readonly number[]): string {
  return ws.map((w) => String(Math.round(w * 100) / 100)).join("/");
}

function paramStr(p: ParamMap, key: string): string | undefined {
  const v = p[key];
  return typeof v === "string" ? v : undefined;
}

/** Kunci pencarian FigureStore untuk blok: label artefak, penomoran, blockId, alamat. */
export function figureStoreKeys(block: NormBlock, numbering: Readonly<Record<string, string>>): string[] {
  const keys = [block.artifactLabel, numbering[block.blockId], block.blockId, block.address ?? undefined];
  return [...new Set(keys.filter((k): k is string => typeof k === "string" && k.length > 0))];
}

/** Kunci lembar ke-n (n >= 2) satu figur: `<kunci>#<n>`. */
export function sheetKey(key: string, n: number): string {
  return n <= 1 ? key : `${key}#${n}`;
}

function asFigureBlock(block: NormBlock, type: FigureBlockType, ctx: RenderContext): FigureBlock {
  const c = block.content as Partial<FigureBlock> | null;
  if (!c || typeof c !== "object" || c.type !== type || !c.caption || !c.source || typeof c.widthMm !== "number") {
    failRender(ctx, "BY_CONSTRUCTION_FAILED", `Blok ${block.blockId} bukan blok ${type} yang lengkap (caption, source, widthMm)`, block.address ?? undefined);
  }
  return c as FigureBlock;
}

// ── Caption, KUNCI, SUMBER ───────────────────────────────────────────────

function captionLabel(block: NormBlock, cap: Caption, ctx: RenderContext): string {
  const numbered = block.artifactLabel ?? ctx.snapshot.numbering[block.blockId];
  if (cap.label && numbered && cap.label !== numbered) {
    warnRender(ctx, "caption.label", `Label caption "${cap.label}" berbeda dari hasil penomoran "${numbered}"`, block.address ?? undefined);
  }
  const label = cap.label ?? numbered;
  if (!label) {
    failRender(ctx, "BY_CONSTRUCTION_FAILED", `Figur ${block.blockId} tanpa label caption (penomoran belum dijalankan)`, block.address ?? undefined);
  }
  return label;
}

/** DT-15 / P5-19: caption satu kalimat. Hanya dicatat; lint 30 yang memutuskan. */
function checkOneSentence(text: string, block: NormBlock, ctx: RenderContext): void {
  const sentences = text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length > 1) {
    warnRender(ctx, "DT-15", `Caption ${block.blockId} memuat ${sentences.length} kalimat; DT-15 meminta satu`, block.address ?? undefined);
  }
}

export function captionXml(block: NormBlock, cap: Caption, ctx: RenderContext, runDefaults?: RunProps): string {
  const p = ctx.tpl.params;
  const role = figureRole(ctx.tpl, "caption");
  const label = captionLabel(block, cap, ctx);
  const sep = cap.separator ?? paramStr(p, "render.caption.separator") ?? DEFAULT_CAPTION_SEPARATOR;
  checkOneSentence(inlinePlain(cap.inline), block, ctx);
  const runs =
    textRun(label + sep, mergeRun(role.labelRun, cap.labelProps), p) +
    inlineRunsXml(cap.inline, mergeRun(role.run, runDefaults), p);
  return paragraphXml(mergePara(role.para, cap.format), runs);
}

/** Buang label awal yang sudah ditulis penulis ("KUNCI ...", "SUMBER ..."). */
function stripLeadingLabel(text: string, label: string): string {
  const re = new RegExp(`^\\s*${label}\\b[\\s:]*`);
  return text.replace(re, "");
}

/** Run label aparatus figur di bentuk `runs`: teks hanya "KUNCI", "SUMBER" atau "PROVENANS" (+ spasi/titik dua). */
const LABEL_RUN_RE = new RegExp(`^\\s*(?:${FIGURE_LABELS.key}|${FIGURE_LABELS.source}|${FIGURE_LABELS.provenance})\\s*:?\\s*$`);

function isLabelRun(r: Run): boolean {
  return "t" in r && LABEL_RUN_RE.test(r.t);
}

/**
 * Inline aparatus (KUNCI/SUMBER) berbentuk `runs` (RQ-3, permintaan RT-01):
 * run label ("KUNCI  ", "SUMBER  ", "   PROVENANS ") memakai `labelRun` peran
 * (spacingTw 12 dari templat), run lain memakai `run` peran. Properti milik run
 * tetap menang (dokumen verbatim membawa format lengkap, keluaran tidak
 * berubah); face XOR faceRole lewat `mergeRun`.
 */
function apparatusRunsXml(i: Inline, base: RunProps, label: RunProps, p: ParamMap): string {
  if (!("runs" in i)) return inlineRunsXml(i, base, p);
  return (i.runs as readonly Run[])
    .map((r) => (isLabelRun(r) ? textRun((r as { t: string }).t, mergeRun(label, runOwnProps(r)), p) : hfRunXml(r, base, p)))
    .join("");
}

export function keyRowXml(keyRow: FigureCommon["keyRow"], ctx: RenderContext, runDefaults?: RunProps): string {
  if (!keyRow) return "";
  const p = ctx.tpl.params;
  const role = figureRole(ctx.tpl, "figure.keyRow");
  const base = mergeRun(role.run, runDefaults);
  // C1 (D-44): bentuk `runs` lengkap, label "KUNCI  " disediakan penulis (sama dengan
  // baris SUMBER berbentuk runs) dan memakai `labelRun` peran (RQ-3); label hanya
  // ditambahkan untuk `text`.
  if (!("text" in keyRow)) return paragraphXml(role.para, apparatusRunsXml(keyRow, base, mergeRun(role.labelRun), p));
  const labelXml = textRun(FIGURE_LABELS.key + FIGURE_LABEL_SPACING.keyAfter, mergeRun(role.labelRun), p);
  return paragraphXml(role.para, labelXml + textRun(stripLeadingLabel(inlinePlain(keyRow), FIGURE_LABELS.key), base, p));
}

function provenanceMarksXml(marks: readonly ProvenanceMark[], ctx: RenderContext, base: RunProps): string {
  const p = ctx.tpl.params;
  const role = figureRole(ctx.tpl, "figure.source");
  return marks
    .map((m, i) => {
      const glyphProps = mergeRun(base, defaultGlyphRun(ctx.tpl), role.glyphRun?.[m]);
      return (i > 0 ? textRun(" · ", base, p) : "") + textRun(markGlyph(p, m), glyphProps, p) + textRun(` ${m}`, base, p);
    })
    .join("");
}

/**
 * Baris SUMBER: `"SUMBER  " + teks [+ "   PROVENANS " + teks]`. Teks polos
 * dipecah pada kata PROVENANS (label tebal); `provenance[]` ditulis sebagai
 * glif + nama tanda bila teks belum memuat segmen PROVENANS. Bentuk `runs`:
 * label disediakan penulis, run label memakai `labelRun` peran (RQ-3).
 */
export function sourceLineXml(src: SourceLine, ctx: RenderContext, address: string | undefined, runDefaults?: RunProps): string {
  const p = ctx.tpl.params;
  const role = figureRole(ctx.tpl, "figure.source");
  const label = mergeRun(role.labelRun);
  const base = mergeRun(role.run, runDefaults);
  const para = mergePara(role.para, src.format);
  if ("runs" in src.inline) {
    let xml = apparatusRunsXml(src.inline, base, label, p);
    if (src.provenance?.length && !inlinePlain(src.inline).includes(FIGURE_LABELS.provenance)) {
      xml += textRun(FIGURE_LABEL_SPACING.provenanceBefore + FIGURE_LABELS.provenance + FIGURE_LABEL_SPACING.provenanceAfter, label, p);
      xml += provenanceMarksXml(src.provenance, ctx, base);
    }
    return paragraphXml(para, xml);
  }
  const text = stripLeadingLabel(inlinePlain(src.inline), FIGURE_LABELS.source);
  if (text.trim().length === 0) {
    failRender(ctx, "BY_CONSTRUCTION_FAILED", "Baris SUMBER figur kosong (DT-15, lint 29)", address);
  }
  const segments = text.split(new RegExp(`\\s*\\b${FIGURE_LABELS.provenance}\\b\\s*`));
  let xml = textRun(FIGURE_LABELS.source + FIGURE_LABEL_SPACING.sourceAfter, label, p) + textRun(segments[0], base, p);
  for (const seg of segments.slice(1)) {
    xml += textRun(FIGURE_LABEL_SPACING.provenanceBefore + FIGURE_LABELS.provenance + FIGURE_LABEL_SPACING.provenanceAfter, label, p);
    xml += textRun(seg, base, p);
  }
  if (segments.length === 1 && src.provenance?.length) {
    xml += textRun(FIGURE_LABEL_SPACING.provenanceBefore + FIGURE_LABELS.provenance + FIGURE_LABEL_SPACING.provenanceAfter, label, p);
    xml += provenanceMarksXml(src.provenance, ctx, base);
  } else if (segments.length === 1 && p["source.provenanceField.required"] !== false) {
    warnRender(ctx, "P5-23", "Baris SUMBER figur tanpa medan PROVENANS", address);
  }
  return paragraphXml(para, xml);
}

// ── Bitmap ───────────────────────────────────────────────────────────────

interface Sheet {
  img: FigureImage;
  widthMm: number;
  heightMm: number;
}

function placedHeight(block: FigureBlock, widthMm: number, storeW: number | undefined, storeH: number | undefined, img: FigureImage, sheetIndex: number): number {
  if (block.heightMm !== undefined && sheetIndex === 0) return (block.heightMm * widthMm) / block.widthMm;
  if (storeW && storeH && storeW > 0) return (storeH * widthMm) / storeW;
  return (img.heightPx * widthMm) / img.widthPx;
}

/**
 * Lebar tempatan satu lembar. Gambar raster pada snapshot v2 (lebar dari kelas
 * templat): aturan ukuran asli K-2 (D-242, `engine/tokens/raster-width`) — tidak diperbesar
 * melewati lebar aslinya pada resolusi templat; lebar kelas = batas atas. Figur
 * vektor (chart/diagram/symbolSheet) digambar mesin tepat selebar blok (D-245 H1).
 */
function placedWidth(fb: FigureBlock, img: FigureImage, ctx: RenderContext): number {
  if (fb.type !== "image" || !classDerivedWidth(ctx.snapshot)) return fb.widthMm;
  return rasterPlacedWidthMm(fb.widthMm, img.widthPx, ctx.tpl.params);
}

/** Ambil lembar PNG dari FigureStore (kunci figur, lalu `#2`, `#3`, ...). */
function sheetsFromStore(block: NormBlock, fb: FigureBlock, ctx: RenderContext): Sheet[] {
  const address = block.address ?? undefined;
  for (const key of figureStoreKeys(block, ctx.snapshot.numbering)) {
    const first = ctx.figures.get(key);
    if (!first) continue;
    const out: Sheet[] = [];
    for (let n = 1; n <= MAX_SHEETS; n++) {
      const e = n === 1 ? first : ctx.figures.get(sheetKey(key, n));
      if (!e) break;
      if (!e.png) {
        failRender(ctx, "BY_CONSTRUCTION_FAILED", `Figur "${key}" lembar ${n} belum dirasterisasi ke PNG (jalankan prepareFigureStore)`, address);
      }
      const img = figureImageFromBytes(e.png, ctx, address, `Figur "${key}" lembar ${n}`);
      const widthMm = placedWidth(fb, img, ctx);
      out.push({ img, widthMm, heightMm: placedHeight(fb, widthMm, e.widthMm, e.heightMm, img, n - 1) });
    }
    return out;
  }
  return [];
}

function figureSheets(block: NormBlock, fb: FigureBlock, ctx: RenderContext): Sheet[] {
  const fromStore = sheetsFromStore(block, fb, ctx);
  if (fromStore.length > 0) return fromStore;
  if (fb.type === "image") {
    const img = resolveRasterAsset(fb.asset, ctx, block.address ?? undefined);
    const widthMm = placedWidth(fb, img, ctx);
    return [{ img, widthMm, heightMm: placedHeight(fb, widthMm, undefined, undefined, img, 0) }];
  }
  failRender(
    ctx,
    "BY_CONSTRUCTION_FAILED",
    `Figur ${fb.type} ${block.blockId} tidak ada di FigureStore (kunci: ${figureStoreKeys(block, ctx.snapshot.numbering).join(", ")})`,
    block.address ?? undefined,
  );
}

/** dpi efektif dari piksel nyata terhadap lebar tempatan (mm). */
export function effectiveDpi(widthPx: number, widthMm: number): number {
  return widthPx / (widthMm / 25.4);
}

/**
 * DATUM-39 (F-043, D-94): `true` bila raster benar-benar kurang resolusi.
 * Rasterisasi Node (engine/browser, aturan acuan `raster.py`) memotong klip ke
 * px CSS bulat lalu menskalakan dpi/96, sehingga PNG kehilangan < 1 px CSS
 * (= minDpi/96 px perangkat, ditambah 1 px pembulatan) — mis. 24 mm = 281 px
 * (297,4 dpi), 128 mm = 1509 px (299,4 dpi). Lolos bila kekurangan piksel
 * dalam toleransi itu ATAU dpi efektif >= 99 % minimum (ambang lama, 297 dpi
 * untuk 300); selain itu peringatan.
 */
export function rasterDpiShortfall(widthPx: number, widthMm: number, minDpi: number): boolean {
  if (!(widthPx > 0) || !(widthMm > 0) || !(minDpi > 0)) return false;
  if (effectiveDpi(widthPx, widthMm) >= minDpi * 0.99) return false;
  const idealPx = (widthMm / 25.4) * minDpi;
  return idealPx - widthPx > minDpi / 96 + 1;
}

function guardSheet(block: NormBlock, fb: FigureBlock, s: Sheet, ctx: RenderContext): void {
  const address = block.address ?? undefined;
  if (!(s.widthMm > 0) || !(s.heightMm > 0) || !Number.isFinite(s.heightMm)) {
    failRender(ctx, "BY_CONSTRUCTION_FAILED", `Ukuran figur ${block.blockId} tidak sah: ${s.widthMm} x ${s.heightMm} mm`, address);
  }
  if (fb.type !== "image") {
    const allowed = allowedFigureWidths(block, ctx);
    if (!allowed.some((w) => Math.abs(fb.widthMm - w) <= WIDTH_TOLERANCE_MM)) {
      warnRender(ctx, "DATUM-31", `Lebar ${fb.type} ${fb.widthMm} mm bukan ${mmList(allowed)} mm`, address);
    }
  }
  const maxH = maxFigureHeight(block, ctx);
  if (s.heightMm > maxH) {
    warnRender(ctx, "DATUM-33", `Tinggi figur ${s.heightMm.toFixed(2)} mm melebihi blok teks ${maxH} mm`, address);
  }
  const minDpi =
    fb.type === "image" ? MIN_RASTER_DPI : (paramNum(ctx.tpl.params, "chart.output.rasterDpiForWord") ?? paramNum(ctx.tpl.params, "render.png.dpi") ?? 300);
  if (rasterDpiShortfall(s.img.widthPx, s.widthMm, minDpi)) {
    const dpi = effectiveDpi(s.img.widthPx, s.widthMm);
    warnRender(ctx, "DATUM-39", `dpi efektif ${dpi.toFixed(1)} < ${minDpi} (${s.img.widthPx} px pada ${s.widthMm} mm)`, address);
  }
}

function fileNameFor(block: NormBlock, fb: FigureBlock, ctx: RenderContext, label: string, ext: string, n: number): string {
  if (fb.type === "image") {
    const ref = ctx.snapshot.doc.assets?.[fb.asset];
    const base = ref?.path?.split(/[\\/]/).pop();
    if (base && n === 0) return base;
  }
  return `${label}${n > 0 ? ` ${n + 1}` : ""}.${ext}`;
}

/** Masukan teks alternatif figur (FIX-H8): label, caption, sumber polos, bahasa, petunjuk jenis. */
function figureAltInput(fb: FigureBlock, ctx: RenderContext, label: string): FigureAltInput {
  let kindHint: string | undefined;
  if (fb.type === "chart" && fb.spec && "kind" in fb.spec && typeof fb.spec.kind === "string") kindHint = fb.spec.kind;
  else if (fb.type === "symbolSheet") kindHint = fb.dialect;
  else if (fb.type === "image") kindHint = ctx.snapshot.doc.assets?.[fb.asset]?.path;
  return {
    type: fb.type,
    label,
    caption: inlinePlain(fb.caption.inline),
    source: stripSourceLabel(inlinePlain(fb.source.inline)),
    language: ctx.snapshot.doc.meta?.language,
    kindHint,
  };
}

// ── Renderer ─────────────────────────────────────────────────────────────

function renderFigure(type: FigureBlockType): DocxBlockRenderer {
  return (block: NormBlock, ctx: RenderContext): DocxFragment => {
    const fb = asFigureBlock(block, type, ctx);
    const role = figureRole(ctx.tpl, "figure.paragraph");
    const label = captionLabel(block, fb.caption, ctx);
    const media: FigureMediaEntry[] = [];
    const sheets = figureSheets(block, fb, ctx);
    const paraFormat = mergePara(role.para, fb.format, fb.paragraphFormat);
    const altBase = figureAltInput(fb, ctx, label);

    let pictures = "";
    sheets.forEach((s, i) => {
      guardSheet(block, fb, s, ctx);
      const name = addMedia(media, s.img);
      const docPrId = DOCPR_ID_BASE + block.ordinal * 16 + i;
      // FIX-H8: nama/judul/deskripsi objek dari nomor + caption (+ sumber), bukan "Picture n".
      const alt = figureAltText({ ...altBase, sheet: { index: i + 1, count: sheets.length } });
      pictures += drawingParagraphXml(paraFormat, {
        relId: figureMediaRelId(name),
        docPrId,
        docPrName: alt.name,
        descr: alt.descr,
        title: alt.title,
        fileName: fileNameFor(block, fb, ctx, label, name.endsWith(".png") ? "png" : "jpg", i),
        widthMm: s.widthMm,
        heightMm: s.heightMm,
      });
    });

    const xml =
      captionXml(block, fb.caption, ctx, fb.runDefaults) +
      pictures +
      keyRowXml(fb.keyRow, ctx, fb.runDefaults) +
      sourceLineXml(fb.source, ctx, block.address ?? undefined, fb.runDefaults);
    return { xml, media, facesUsed: facesInXml(xml) };
  };
}

export const renderChartFigure = renderFigure("chart");
export const renderDiagramFigure = renderFigure("diagram");
export const renderImageFigure = renderFigure("image");
export const renderSymbolSheetFigure = renderFigure("symbolSheet");
