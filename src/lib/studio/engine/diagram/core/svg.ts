/**
 * Primitif SVG diagram Garis A (port `_esc`, `_svg_text`, `_shape_svg`, defs
 * arsiran/kepala panah, jalur konektor, lompatan silang, pita knockout label;
 * `datum_diagram.py:1040-1112, 1214-1231, 1271-1322, 1410-1421`).
 *
 * Teks tetap teks nyata berfon IBM Plex (tidak dikonturkan). Angka ditulis
 * seperti `"%s" % round(x, n)` Python (lihat `pyfmt.ts`). Urutan atribut =
 * urutan Python; atribut peran tanda (`data-mark`, 01_specs.md §3.5 N2)
 * ditambahkan SETELAH atribut Python pada elemen tanda: bentuk simpul
 * `data-mark="node"`, jalur konektor `data-mark="link"` + `data-series=<jenis>`.
 * Opsi `dataMarks: false` menghasilkan keluaran Python murni.
 */
import type { DiagramEdgeKind, FaceRole } from "../../../contract";
import { tspanLines } from "../../chart/core/textfit";
import { diagramFitActive } from "../fit/state";
import { nodeTextLayout, type TextBlockLayout } from "../fit/text";
import { type PyNumber, pyLen, pyNum, pyStr, pyStrNum } from "./pyfmt";
import type { SheetNode } from "./sheet";
import { nodeStrokeToken } from "./sheet";
import { xmlCommentText, xmlEscapeText } from "./xml";
import {
  DASH_PATTERNS,
  DIAGRAM_TOKENS,
  EDGE_KINDS,
  EDGE_KIND_NAMES_SORTED,
  FACES,
  INK_TEXT,
  LATTICE_Y,
  LIMITS,
  MARKS,
  PAPER,
  STROKE_HAIR,
  STROKE_PRIMARY,
  colourOf,
  estTextMm,
  faceOf,
  pt2mm,
  role,
  snap,
} from "./tokens";

/**
 * Escape isi teks seperti `_esc` Python (&, <, >), ditambah pembuangan
 * karakter yang tidak sah di XML 1.0 (IP-39b, S84 #4; Python meneruskannya
 * sehingga SVG rusak — deviasi yang disengaja, keluaran sama untuk teks sah).
 */
export function escText(s: unknown): string {
  return xmlEscapeText(pyStr(s), false);
}

/**
 * Escape nilai atribut: `_esc` Python ditambah `"` (Python tidak meng-escape
 * kutip sehingga id berkutip menghasilkan XML rusak; selain kasus itu identik).
 */
export function escAttr(s: unknown): string {
  return escText(s).replace(/"/g, "&quot;");
}

export interface SvgMarkOptions {
  /** Tambah atribut peran tanda (default true). */
  dataMarks?: boolean;
  /** Indeks tanda dalam gambar (`data-index`). */
  index?: number;
}

export interface SvgTextOptions {
  /** Peran tipografi token (`type.scale_pt`), default `caption`. */
  role?: string;
  /** Nama token warna interior (menimpa warna peran). */
  colourToken?: string;
  /** Warna heks langsung (menimpa token; di luar Garis A). */
  fill?: string;
  /** Default `middle` (Python). */
  anchor?: "start" | "middle" | "end";
  upper?: boolean;
  /** Tracking em; `null`/tidak ada = tracking peran. */
  track?: number | null;
  weight?: number;
  /** Ukuran pt (menimpa ukuran peran; di luar Garis A). */
  sizePt?: number;
  /** Wajah (menimpa wajah peran; di luar Garis A). */
  faceRole?: FaceRole;
}

const FACE_ROLE_KEY: Readonly<Record<FaceRole, string>> = {
  serif: "serif",
  condensed: "condensed",
  mono: "mono",
  workbookUi: "workbook_ui",
  symbolGlyph: "mono",
};

/** Teks SVG nyata berfon Plex (`_svg_text`). */
export function svgText(x: PyNumber, y: PyNumber, text: unknown, opts: SvgTextOptions = {}): string {
  const roleName = opts.role ?? "caption";
  const r = role(roleName);
  const sizePt = opts.sizePt ?? r.size;
  const size = pt2mm(sizePt);
  const face = opts.faceRole ? FACES[FACE_ROLE_KEY[opts.faceRole]] : faceOf(roleName);
  const col = opts.fill ?? colourOf(opts.colourToken || r.colour || INK_TEXT);
  let txt = pyStr(text);
  if (opts.upper || r.upper) txt = txt.toUpperCase();
  let ls = "";
  const tr = opts.track !== undefined && opts.track !== null ? opts.track : r.track_em;
  if (tr) ls = ` letter-spacing="${pyNum(pt2mm(sizePt) * tr, 3)}"`;
  const w = opts.weight || r.weight || 400;
  return (
    `<text x="${pyNum(x, 2)}" y="${pyNum(y, 2)}" font-family="${escAttr(face)}" font-size="${pyNum(size, 3)}" ` +
    `font-weight="${w}" fill="${col}" text-anchor="${opts.anchor ?? "middle"}"${ls}>${escText(txt)}</text>`
  );
}

/**
 * Teks berbaris (FIG-02b): SATU `<text>` dengan `<tspan x dy>` per baris (multiset teks tetap
 * satu entri per label, D-482/D-491). Satu baris = keluaran `svgText` biasa.
 */
export function svgTextLines(b: TextBlockLayout, opts: SvgTextOptions = {}): string {
  if (b.lines.length <= 1) return svgText(b.x, b.y, b.lines[0] ?? "", opts);
  const shell = svgText(b.x, b.y, "", opts);
  const x = Number(pyNum(b.x, 2));
  const lines = opts.upper || role(opts.role ?? "caption").upper ? b.lines.map((l) => l.toUpperCase()) : b.lines;
  return `${shell.slice(0, -"</text>".length)}${tspanLines(lines, x, Number(b.lineMm.toFixed(3)))}</text>`;
}

function markAttrs(kind: "node" | "link", opts: SvgMarkOptions, series?: string): string {
  if (opts.dataMarks === false) return "";
  let a = ` data-mark="${kind}"`;
  if (series !== undefined) a += ` data-series="${escAttr(series)}"`;
  if (opts.index !== undefined) a += ` data-index="${opts.index}"`;
  return a;
}

const r2 = (v: number): string => pyNum(v, 2);

/** Isian simpul: arsiran 45 (aksen), 135 (sekunder), atau none. */
export function nodeFill(nd: Pick<SheetNode, "spec">): string {
  const c = nd.spec.class ?? {};
  if (c.accent) return "url(#datum-hatch45)";
  if (c.secondary) return "url(#datum-hatch135)";
  return "none";
}

/**
 * Bentuk simpul (`_shape_svg`): 10 bentuk P3; bentuk tak dikenal jatuh ke box.
 * Hanya `stadium` beradius.
 */
export function shapeSvg(
  nd: SheetNode,
  strokeToken: string,
  fill: string,
  opts: SvgMarkOptions & { strokeW?: number } = {},
): string {
  const shape = nd.spec.shape ?? "box";
  const { x, y, w, h } = nd;
  const sw = opts.strokeW ?? STROKE_PRIMARY;
  const col = colourOf(strokeToken);
  const common = `data-node="${escAttr(nd.id)}" fill="${fill}" stroke="${col}" stroke-width="${pyStrNum(sw)}"${markAttrs("node", opts)}`;
  switch (shape) {
    case "stadium": {
      const rr = h / 2.0;
      return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rr)}" ry="${r2(rr)}" ${common}/>`;
    }
    case "diamond": {
      const pts = `${r2(x + w / 2)},${r2(y)} ${r2(x + w)},${r2(y + h / 2)} ${r2(x + w / 2)},${r2(y + h)} ${r2(x)},${r2(y + h / 2)}`;
      return `<polygon points="${pts}" ${common}/>`;
    }
    case "parallelogram": {
      const k = w * 0.18;
      const pts = `${r2(x + k)},${r2(y)} ${r2(x + w)},${r2(y)} ${r2(x + w - k)},${r2(y + h)} ${r2(x)},${r2(y + h)}`;
      return `<polygon points="${pts}" ${common}/>`;
    }
    case "hexagon": {
      const k = w * 0.22;
      const pts =
        `${r2(x + k)},${r2(y)} ${r2(x + w - k)},${r2(y)} ${r2(x + w)},${r2(y + h / 2)} ` +
        `${r2(x + w - k)},${r2(y + h)} ${r2(x + k)},${r2(y + h)} ${r2(x)},${r2(y + h / 2)}`;
      return `<polygon points="${pts}" ${common}/>`;
    }
    case "cylinder": {
      const ry = h * 0.16;
      return (
        `<path d="M${r2(x)} ${r2(y + ry)} a${r2(w / 2)} ${r2(ry)} 0 0 0 ${r2(w)} 0 ` +
        `L${r2(x + w)} ${r2(y + h - ry)} a${r2(w / 2)} ${r2(ry)} 0 0 1 -${r2(w)} 0 Z" ${common}/>`
      );
    }
    case "circle":
      return `<circle cx="${r2(x + w / 2)}" cy="${r2(y + h / 2)}" r="${r2(Math.min(w, h) / 2)}" ${common}/>`;
    case "bus":
      // P3: rel berat, garis tebal penuh lebar (Python tidak memberi data-node).
      return `<line x1="${r2(x)}" y1="${r2(y + h / 2)}" x2="${r2(x + w)}" y2="${r2(y + h / 2)}" stroke="${col}" stroke-width="${r2(STROKE_PRIMARY * 3)}"${markAttrs("node", opts)}/>`;
    case "doubled":
      return (
        `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" ${common}/>` +
        `<rect x="${r2(x + 1.2)}" y="${r2(y + 1.2)}" width="${r2(w - 2.4)}" height="${r2(h - 2.4)}" fill="none" stroke="${col}" stroke-width="${r2(STROKE_HAIR)}"/>` +
        `<line x1="${r2(x + 1.2)}" y1="${r2(y + h / 2)}" x2="${r2(x + w - 1.2)}" y2="${r2(y + h / 2)}" stroke="${col}" stroke-width="${r2(STROKE_HAIR)}"/>`
      );
    case "shadowed": {
      const off = snap(LATTICE_Y / 2, 0.1);
      return (
        `<rect x="${r2(x + off)}" y="${r2(y + off)}" width="${r2(w)}" height="${r2(h)}" fill="none" stroke="${colourOf("ink200")}" stroke-width="${r2(STROKE_HAIR)}"/>` +
        `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" ${common}/>`
      );
    }
    default:
      return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" ${common}/>`;
  }
}

/** Glif asal (mono, amber/signal; pitfall warisan: jangan tukar wajah). */
export function markGlyphSvg(nd: SheetNode): string {
  const mk = nd.spec.mark;
  const glyph = mk ? MARKS[mk] : "";
  return (
    `<text x="${r2(nd.x + nd.w - pt2mm(1.5))}" y="${r2(nd.y + pt2mm(role("caption").size))}" ` +
    `font-family="${escAttr(FACES.mono)}" font-size="${pyNum(pt2mm(role("register_block").size), 3)}" ` +
    `fill="${colourOf("signal")}" text-anchor="end">${escText(glyph)}</text>`
  );
}

/**
 * Semua elemen satu simpul, urutan `build_svg`: bentuk, label (caption ink900),
 * sub (source_line), glif asal, tag (table_header ink400 rata kiri).
 */
export function nodeSvg(nd: SheetNode, opts: SvgMarkOptions = {}): string[] {
  const n = nd.spec;
  const out: string[] = [shapeSvg(nd, nodeStrokeToken(nd), nodeFill(nd), { ...opts, strokeW: STROKE_PRIMARY })];
  const cx = nd.x + nd.w / 2.0;
  const cy = nd.y + nd.h / 2.0;
  const capMm = pt2mm(role("caption").size);
  // FIG-02b: hanya saat fit dan hanya bila label tidak muat satu baris (atau rel bus).
  const fit = diagramFitActive() ? nodeTextLayout(nd) : null;
  if (fit) {
    out.push(svgTextLines(fit.label, { role: "caption", colourToken: "ink900" }));
    if (fit.sub) out.push(svgTextLines(fit.sub, { role: "source_line" }));
    else if (n.sub) out.push(svgText(cx, cy + capMm, n.sub, { role: "source_line" }));
  } else {
    out.push(svgText(cx, cy, n.label, { role: "caption", colourToken: "ink900" }));
    if (n.sub) out.push(svgText(cx, cy + capMm, n.sub, { role: "source_line" }));
  }
  if (n.mark) out.push(markGlyphSvg(nd));
  if (n.tag) {
    out.push(svgText(nd.x + pt2mm(1.5), nd.y + capMm, n.tag, { role: "table_header", colourToken: "ink400", anchor: "start" }));
  }
  return out;
}

/** Pola garis per jenis konektor (`stroke-dasharray` atau null untuk solid). */
export function edgeDash(kind: DiagramEdgeKind): string | null {
  return DASH_PATTERNS[EDGE_KINDS[kind].pattern];
}

/** Tebal garis konektor: aksen 1,6x primer. */
export function edgeStrokeWidth(kind: DiagramEdgeKind): number {
  return kind === "accent" ? STROKE_PRIMARY * 1.6 : STROKE_PRIMARY;
}

/** Atribut `d` polilinear "M x y L x y ..." (dibulatkan 2 desimal). */
export function polylineD(pts: ReadonlyArray<readonly [number, number]>): string {
  return `M ${pts.map(([px, py]) => `${r2(px)} ${r2(py)}`).join(" L ")}`;
}

/** Jalur konektor (6 jenis, pola garis ISO 128-2, kepala panah per jenis). */
export function edgePathSvg(
  pts: ReadonlyArray<readonly [number, number]>,
  kind: DiagramEdgeKind,
  opts: SvgMarkOptions = {},
): string {
  const meta = EDGE_KINDS[kind];
  const dash = DASH_PATTERNS[meta.pattern];
  let attrs = `fill="none" stroke="${colourOf(meta.colour)}" stroke-width="${r2(edgeStrokeWidth(kind))}"`;
  if (dash) attrs += ` stroke-dasharray="${dash}"`;
  return `<path d="${polylineD(pts)}" ${attrs} marker-end="url(#head-${kind})"${markAttrs("link", opts, kind)}/>`;
}

/** Kepala panah satu jenis (P4: solid terisi, open bergaris). */
export function edgeMarkerSvg(kind: DiagramEdgeKind): string {
  const meta = EDGE_KINDS[kind];
  const col = colourOf(meta.colour);
  if (meta.head === "solid") {
    return `<marker id="head-${kind}" markerWidth="4" markerHeight="4" refX="3.4" refY="1.6" orient="auto"><path d="M0,0 L3.6,1.6 L0,3.2 Z" fill="${col}"/></marker>`;
  }
  return `<marker id="head-${kind}" markerWidth="4" markerHeight="4" refX="3.4" refY="1.6" orient="auto"><path d="M0,0 L3.6,1.6 L0,3.2" fill="none" stroke="${col}" stroke-width="0.35"/></marker>`;
}

/** Pola arsiran 45/135 derajat (isian diagram tahan fotokopi). */
export function hatchPatternSvg(angle: 45 | 135): string {
  return (
    `<pattern id="datum-hatch${angle}" width="1.6" height="1.6" patternUnits="userSpaceOnUse" ` +
    `patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="1.6" stroke="${colourOf("ink400")}" stroke-width="0.3"/></pattern>`
  );
}

/** Blok `<defs>` sebagai baris-baris terpisah (urutan Python: arsiran, kepala panah terurut). */
export function diagramDefs(): string[] {
  return ["<defs>", hatchPatternSvg(45), hatchPatternSvg(135), ...EDGE_KIND_NAMES_SORTED.map(edgeMarkerSvg), "</defs>"];
}

/**
 * Komentar generator (padanan baris komentar Python; bukan elemen). Nilai yang
 * disisipkan lewat `xmlCommentText`: tidak pernah memuat "--" (S84 #3), walau
 * `family` di jalur build sudah tervalidasi ke enum keluarga.
 */
export function generatorComment(family: string): string {
  const fam = xmlCommentText(escText(family));
  const tok = xmlCommentText(escText(DIAGRAM_TOKENS.sourceName));
  return `<!-- generator studio engine/diagram (port datum_diagram.py v2.0.0 Garis A, rebuild DHS-RB-04) | family=${fam} | token=${tok} -->`;
}

/** Komentar kewajiban apparatus page (P6, dilaporkan lint cek 36). */
export const APPARATUS_REQUIRED_COMMENT =
  "<!-- DATUM-APPARATUS-REQUIRED: caption, source dan baris kunci dicetak oleh halaman, bukan oleh SVG ini (P6, lint cek 36) -->";

/** Latar kertas penuh lembar. */
export function paperRectSvg(widthMm: number, heightMm: number): string {
  return `<rect x="0" y="0" width="${pyNum(widthMm, 3)}" height="${pyNum(heightMm, 3)}" fill="${PAPER}"/>`;
}

/** Garis lurus bertoken (pemisah lajur, parit, garis kehidupan). */
export function lineSvg(
  x1: PyNumber,
  y1: PyNumber,
  x2: PyNumber,
  y2: PyNumber,
  colourToken: string,
  strokeW: number,
  dash?: string | null,
): string {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<line x1="${pyNum(x1, 2)}" y1="${pyNum(y1, 2)}" x2="${pyNum(x2, 2)}" y2="${pyNum(y2, 2)}" stroke="${colourOf(colourToken)}" stroke-width="${r2(strokeW)}"${d}/>`;
}

/** Lompatan silang pada lintasan horizontal (r = 0,9 mm). */
export function hopSvg(hx: number, hy: number, kind: DiagramEdgeKind): string {
  const r = LIMITS.hop_radius_mm;
  return (
    `<path d="M ${r2(hx - r)} ${r2(hy)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(hx + r)} ${r2(hy)}" ` +
    `fill="none" stroke="${colourOf(EDGE_KINDS[kind].colour)}" stroke-width="${r2(STROKE_PRIMARY)}"/>`
  );
}

/** Pita kertas pemutus garis di belakang label tepi (`_label_knockout`; my = garis dasar). */
export function labelKnockoutSvg(mx: number, my: number, text: unknown, sheetW: number, kwMm?: number): string {
  const r = role("evidence_rail");
  const size = pt2mm(r.size);
  const tr = r.track_em;
  // Python memakai pt2mm(size) atas size yang sudah mm (dipertahankan untuk paritas).
  const lw = estTextMm(text, "evidence_rail") + (tr ? pt2mm(size) * tr * pyLen(pyStr(text)) : 0.0);
  // FIG-02b: saat fit, lebar pita = lebar mono terukur 0,6 em + 1,6 (`fit/labels.ts knockWidthMm`).
  const kw = kwMm ?? lw + 1.6;
  const kh = size * 1.7;
  const kx = Math.min(Math.max(mx - kw / 2.0, 0.0), Math.max(0.0, sheetW - kw));
  const ky = my - size * 1.15;
  return `<rect x="${r2(kx)}" y="${r2(ky)}" width="${r2(kw)}" height="${r2(kh)}" fill="${PAPER}"/>`;
}

/** Label konektor: pita knockout lalu teks evidence_rail berwarna jenis. */
export function edgeLabelSvg(mx: number, my: number, label: unknown, kind: DiagramEdgeKind, sheetW: number, kwMm?: number): string[] {
  return [
    labelKnockoutSvg(mx, my, label, sheetW, kwMm),
    svgText(mx, my, label, { role: "evidence_rail", colourToken: EDGE_KINDS[kind].colour, anchor: "middle" }),
  ];
}
