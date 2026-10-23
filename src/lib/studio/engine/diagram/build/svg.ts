/**
 * Rakitan SVG diagram (S30): port `build_svg` (`HS/datum_diagram.py`
 * :1115-1360) dan `_label_pos`/`_mid_label` (:1375-1407) di atas primitif
 * core S26 (Sheet, nodeSvg, edgePathSvg, hopSvg, edgeLabelSvg, diagramDefs,
 * svgText, lineSvg, diagramColourValues, tokenFloorChecks).
 *
 * Urutan elemen = Python: deklarasi, root mm, komentar generator, komentar
 * apparatus (page), defs, kertas, lajur, garis kehidupan, zona, semua jalur
 * konektor, busur lompatan, pita knockout + label tepi, simpul, kaki apparatus
 * (caption/KEY/SUMBER). Atribut `data-mark` (node/link) ditambahkan core
 * setelah atribut Python. Deterministik: tanpa jam, acak, atau I/O.
 */
import type { DiagramFamily, LayoutFn, LintIssue, RoutedEdge, StudioDiagramV1, SvgResult } from "../../../contract";
import {
  APPARATUS_REQUIRED_COMMENT,
  checksRunOf,
  DASH_PATTERNS,
  DiagramDefect,
  diagramDefs,
  snapCeil,
  drawsSvgKeyRow,
  edgeLabelSvg,
  edgePathSvg,
  escText,
  estTextMm,
  footReserveMm,
  generatorComment,
  hopSvg,
  LATTICE_Y,
  LIMITS,
  lineSvg,
  nodeSvg,
  paperRectSvg,
  polylineD,
  pt2mm,
  pyFixed,
  pyInt,
  pyNum,
  role,
  Sheet,
  STROKE_HAIR,
  svgColourValues,
  svgText,
  tokenFloorChecks,
  TRACK,
  colourOf,
  type DiagramGrid,
  resolveDiagramGrid,
  type SheetNode,
  type ValidateSpecOptions,
} from "../core";
import { routeSequenceMessages, type SequenceLayout } from "../layout-b";
import { placeDiagram, type Placement } from "./place";
import { crossingHops, routePlaced, type HoppedEdge } from "./route";

/**
 * Laporan rakitan (HS `report`) di atas `SvgResult.report`.
 *
 * Basis tiap id di `checksRun` (S84 #14): DATUM-25 dan DATUM-37-lebar diukur
 * pada keluaran (SVG terpancar / geometri ter-snap); DATUM-32 ditegakkan detur
 * rute; DATUM-27/28 adalah cek KONSTRUKSI atas konstanta token (bukan pemindaian
 * keluaran); DATUM-29/30 dan DATUM-36 memeriksa string yang baru dipancarkan
 * fungsi ini sendiri (cek konstruksi, nyaris tautologis). Id `checksRun` tetap
 * = Python demi paritas laporan.
 */
export interface DiagramBuildReport {
  checksRun: string[];
  issues: LintIssue[];
  colourValues: string[];
  nColour: number;
  nHops: number;
  nNodes: number;
  nEdges: number;
  apparatus: "page" | "figure";
  family: DiagramFamily;
}

export interface DiagramSvgResult extends SvgResult {
  report: DiagramBuildReport;
}

/**
 * Opsi rakit. `grid` (D-245) = nilai turunan templat (`grid.allowedFigureWidthsMm`,
 * `grid.textBlockHeightMm`, `grid.latticeXMm`); absen = A4 128/166/247.
 */
export interface DiagramBuildOptions {
  release: boolean;
  grid?: DiagramGrid;
}

/** Ketergantungan rakitan (disuntik untuk uji; bawaan = `validateSpec` core I16 + `DIAGRAM_LAYOUTS` D01). */
export interface DiagramBuildDeps {
  validate: (s: StudioDiagramV1, opts: ValidateSpecOptions) => LintIssue[];
  layouts: Readonly<Record<DiagramFamily, LayoutFn>>;
}

// ------------------------------------------------------------- label tepi
type Seg = readonly [readonly [number, number], readonly [number, number]];
const segLen = (s: Seg): number => Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]);

function segsOf(pts: RoutedEdge["points"]): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push([pts[i], pts[i + 1]]);
  return out;
}

/** HS `_mid_label`: titik tengah segmen terpanjang (maks pertama). */
function midLabel(pts: RoutedEdge["points"]): [number, number] {
  const segs = segsOf(pts);
  if (!segs.length) return [0, 0];
  let best = segs[0];
  for (const s of segs.slice(1)) if (segLen(s) > segLen(best)) best = s;
  return [(best[0][0] + best[1][0]) / 2.0, (best[0][1] + best[1][1]) / 2.0];
}

/**
 * HS `_label_pos`: titik tengah tiap segmen (terpanjang dulu, urut stabil),
 * pilih yang pertama di luar kotak simpul mana pun (diperbesar setengah kotak
 * label); semua bertabrakan = titik tengah terpanjang.
 */
function labelPos(pts: RoutedEdge["points"], nodes: readonly SheetNode[], lw: number, lh: number): [number, number] {
  const segs = segsOf(pts);
  if (!segs.length) return [0.0, 0.0];
  const order = segs.map((_, i) => i).sort((a, b) => segLen(segs[b]) - segLen(segs[a]) || a - b);
  const padX = lw / 2.0 + 0.8;
  const padY = lh / 2.0 + 0.4;
  for (const i of order) {
    const [[ax, ay], [bx, by]] = segs[i];
    const mx = (ax + bx) / 2.0;
    const my = (ay + by) / 2.0;
    const hit = nodes.some((nd) => nd.x - padX <= mx && mx <= nd.x + nd.w + padX && nd.y - padY <= my && my <= nd.y + nd.h + padY);
    if (!hit) return [mx, my];
  }
  return midLabel(pts);
}

// ------------------------------------------------------- D-290 lembar graph
/**
 * D-290 (FIX-B2 siklus 3): keluarga graph memakai margin lembar = kotak pembatas
 * SEMUA unsur + rem tetap `GRAPH_SHEET_PAD_BASELINES` baseline, bukan tepi tetap
 * Garis A (atas 2 kisi, bawah 2 kisi). Unsur: simpul (termasuk tag di dalamnya),
 * titik rute konektor, pita knockout label konektor (posisi = `labelPos`),
 * zona kepercayaan (+/- 2 kisi seperti gambar zona), lalu kaki aparatus (KEY /
 * caption / SUMBER) di bawah isi. Isi digeser vertikal kelipatan kisi (simpul
 * tetap di kisi); geser negatif = turun (mis. zona di tepi atas). Rem 1 baseline
 * = satu langkah kisi vertikal: menampung setengah tebal garis, busur lompatan
 * r 0,9 mm, dan kepala/ekor glif teks di tepi. Acuan: BM Gambar 3.1 (g31) tanpa
 * tepi atas dan sekitar 2 mm di bawah isi.
 */
export const GRAPH_SHEET_PAD_BASELINES = 1;

interface GraphFit {
  paths: RoutedEdge[];
  /** Tepi bawah isi setelah geser (kelipatan kisi ke atas). */
  contentBottom: number;
  pad: number;
}

function graphFit(s: StudioDiagramV1, sheet: Sheet, paths: readonly RoutedEdge[]): GraphFit {
  const pad = LATTICE_Y * GRAPH_SHEET_PAD_BASELINES;
  const nodes = [...sheet.nodes.values()];
  const ys: number[] = [];
  for (const nd of nodes) ys.push(nd.y, nd.y + nd.h);
  const railMm = pt2mm(role("evidence_rail").size);
  for (const p of paths) {
    for (const [, y] of p.points) ys.push(y);
    // pita knockout `labelKnockoutSvg`: y = my - 1,15 size, tinggi 1,7 size; my = labelPos - pt2mm(1,2)
    const [, ly] = labelPos(p.points, nodes, estTextMm(p.label, "evidence_rail"), railMm * 1.4);
    const my = ly - pt2mm(1.2);
    ys.push(my - railMm * 1.15, my - railMm * 1.15 + railMm * 1.7);
  }
  for (const z of s.zones ?? []) {
    const members = (z.members ?? []).map((m) => sheet.nodes.get(m)).filter((m): m is SheetNode => m !== undefined);
    if (!members.length) continue; // zona tanpa anggota = cacat P5 saat digambar
    ys.push(Math.min(...members.map((m) => m.y)) - LATTICE_Y * 2, Math.max(...members.map((m) => m.y + m.h)) + LATTICE_Y * 2);
  }
  const minY = ys.length ? Math.min(...ys) : sheet.top;
  const maxY = ys.length ? Math.max(...ys) : sheet.top;
  const dy = Math.floor((minY - pad) / LATTICE_Y + 1e-9) * LATTICE_Y;
  for (const nd of nodes) nd.y -= dy;
  const shifted = paths.map((p) => {
    const points = p.points.map(([x, y]) => [x, y - dy] as [number, number]);
    return { ...p, points, d: polylineD(points) };
  });
  return { paths: shifted, contentBottom: snapCeil(maxY - dy - 1e-9, LATTICE_Y), pad };
}

/** D-290: cek otomatis, semua koordinat y yang dipancarkan berada di [0, H] (graph). */
function assertInsideSheet(svg: string, H: number): void {
  const bad: string[] = [];
  const check = (v: number, what: string) => {
    if (v < -1e-6 || v > H + 1e-6) bad.push(`${what}=${pyFixed(v, 3)}`);
  };
  for (const m of svg.matchAll(/\s(y|y1|y2|cy)="(-?[\d.]+)"/g)) check(Number(m[2]), m[1]);
  for (const m of svg.matchAll(/<rect [^>]*?\sy="(-?[\d.]+)"[^>]*?\sheight="([\d.]+)"/g)) check(Number(m[1]) + Number(m[2]), "rect bawah");
  // titik M/L jalur (busur lompatan A r 0,9 mm berpusat di jalur dan sudah tercakup rem)
  for (const m of svg.matchAll(/\sd="([^"]+)"/g)) {
    for (const q of m[1].matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)) check(Number(q[2]), "path y");
  }
  if (bad.length) {
    throw new DiagramDefect(`DATUM-37-tinggi: unsur keluar lembar graph (tinggi ${pyFixed(H, 3)} mm): ${bad.slice(0, 5).join(", ")} (P8, D-290)`, {
      checkId: "DATUM-37-tinggi",
    });
  }
}

// ------------------------------------------------------------------ rute
/** Rute keluarga: sequence = baris waktu (layout-b `routeSequenceMessages`), lainnya = `route_edges`. */
export function routeFor(s: StudioDiagramV1, p: Placement): { paths: RoutedEdge[]; msgEnd?: number } {
  if (s.family === "sequence") {
    const lay = p.layout as SequenceLayout;
    if (!Array.isArray(lay.lifelines) || typeof lay.msgY !== "number") {
      throw new DiagramDefect("tata letak sequence tanpa garis kehidupan/baris waktu (P2)", { checkId: "P2-sequence-time-vertical" });
    }
    const run = routeSequenceMessages(s, lay);
    return { paths: run.paths.map((e) => ({ ...e, d: e.d ?? polylineD(e.points) })), msgEnd: run.msgEnd };
  }
  return { paths: routePlaced(s, p.sheet) };
}

function sourcesOf(s: StudioDiagramV1): string[] {
  if (Array.isArray(s.sources) && s.sources.length) return s.sources.map(String);
  const src: unknown = s.source;
  if (src === undefined || src === null) return [];
  return Array.isArray(src) ? src.map(String) : [String(src)];
}

// ------------------------------------------------------------------ rakit
export function buildDiagramSvgWith(s: StudioDiagramV1, opts: DiagramBuildOptions, deps: DiagramBuildDeps): DiagramSvgResult {
  // D-245: grid turunan templat (lebar sah, tinggi maks, kisi X); absen = A4.
  const grid = resolveDiagramGrid(opts.grid);
  // validate_spec + gerbang rilis (I16): pelanggaran pertama = cacat, seperti Python.
  const vIssues = deps.validate(s, opts.grid ? { release: opts.release, grid: opts.grid } : { release: opts.release });
  const fail = vIssues.find((i) => i.status === "FAIL");
  if (fail) throw new DiagramDefect(fail.detail ?? fail.checkId, { checkId: fail.checkId, pointer: fail.pointer });
  const ran = checksRunOf(vIssues);
  const issues: LintIssue[] = [];
  if (!opts.release && s.labels_verified !== true) {
    issues.push({ checkId: "P1-labels_verified", status: "NOT_RUN", detail: "draft: release=false, gerbang labels_verified tidak dijalankan" });
  }

  const sheet = new Sheet(Number(s.width_mm), undefined, grid.latticeXMm);
  const place = placeDiagram(s, sheet, deps.layouts);
  ran.push("DATUM-37-lebar");
  const W = sheet.widthMm;

  const { paths, msgEnd } = routeFor(s, place);
  if (s.family === "sequence") {
    sheet.msgEnd = msgEnd;
    ran.push("P2-sequence-time-vertical");
  }
  // D-290: graph = lembar pas kotak pembatas semua unsur + rem tetap.
  const fit = s.family === "graph" ? graphFit(s, sheet, paths) : undefined;
  const hopped: HoppedEdge[] = crossingHops(fit ? fit.paths : paths);
  ran.push("DATUM-32"); // ditegakkan detur rute (gagal = lempar)

  ran.push(...tokenFloorChecks()); // DATUM-28, DATUM-27

  sheet.foot = footReserveMm(s);
  const H = fit ? fit.contentBottom + sheet.foot + fit.pad : sheet.height();
  if (H > grid.maxHeightMm + 1e-6) {
    throw new DiagramDefect(`DATUM-33: tinggi gambar ${pyFixed(H, 2)} mm melewati blok teks ${pyFixed(grid.maxHeightMm, 1)} mm (P8)`, {
      checkId: "DATUM-33",
    });
  }
  ran.push("DATUM-33");

  const apparatus = s.apparatus ?? "page";
  const nodes = [...sheet.nodes.values()];
  sheet.add(generatorComment(String(s.family)));
  if (apparatus === "page") sheet.add(APPARATUS_REQUIRED_COMMENT);
  sheet.addAll(diagramDefs());
  sheet.add(paperRectSvg(W, H));

  // lajur akuntabilitas + pemisah rambut (P2 swimlane), urutan kemunculan lajur
  const gutter = sheet.gutterW ?? 0;
  for (const lane of sheet.lanes) {
    sheet.add(lineSvg(pyInt(0), lane.y, W, lane.y, "ink200", STROKE_HAIR));
    sheet.add(svgText(0.5, lane.y + pt2mm(role("table_header").size) + LATTICE_Y / 2.0, lane.name, {
      role: "table_header",
      colourToken: "ink400",
      anchor: "start",
    }));
    if (gutter) sheet.add(lineSvg(gutter, lane.y, gutter, lane.y + lane.h, "ink200", STROKE_HAIR));
  }
  for (const ll of sheet.lifelines) {
    sheet.add(lineSvg(ll.x, ll.top, ll.x, H - LATTICE_Y, "ink200", STROKE_HAIR, DASH_PATTERNS.dashed));
  }

  // zona kepercayaan: penutupan garis putus + tab label, tanpa isian (P5)
  for (const z of s.zones ?? []) {
    const members = (z.members ?? []).map((m) => sheet.nodes.get(m)).filter((m): m is SheetNode => m !== undefined);
    if (!members.length) throw new DiagramDefect(`zona '${String(z.id)}' tanpa anggota dikenal (P5 trust zone)`, { checkId: "P5-zone" });
    const zx = Math.min(...members.map((m) => m.x)) - sheet.colMm / 2;
    const zy = Math.min(...members.map((m) => m.y)) - LATTICE_Y * 2;
    const zw = Math.max(...members.map((m) => m.x + m.w)) - zx + sheet.colMm / 2;
    const zh = Math.max(...members.map((m) => m.y + m.h)) - zy + LATTICE_Y * 2;
    sheet.add(
      `<rect x="${pyNum(zx, 2)}" y="${pyNum(zy, 2)}" width="${pyNum(zw, 2)}" height="${pyNum(zh, 2)}" fill="none" ` +
        `stroke="${colourOf("ink400")}" stroke-width="${pyNum(STROKE_HAIR, 2)}" stroke-dasharray="${DASH_PATTERNS.dashed}"/>`,
    );
    const label = z.label !== undefined ? z.label : z.id !== undefined ? z.id : "zona";
    sheet.add(svgText(zx + 1.0, zy + pt2mm(5.0), label, { role: "table_header", colourToken: "ink400", anchor: "start" }));
  }

  // konektor: semua jalur + busur dulu, baru pita knockout dan label (garis tak menimpa teks)
  const labels: Array<[number, number, string, RoutedEdge["kind"]]> = [];
  const railMm = pt2mm(role("evidence_rail").size);
  hopped.forEach((p, i) => {
    sheet.add(edgePathSvg(p.points, p.kind, { index: i }));
    const lw = estTextMm(p.label, "evidence_rail");
    const [mx, my] = labelPos(p.points, nodes, lw, railMm * 1.4);
    labels.push([mx, my - pt2mm(1.2), p.label, p.kind]);
  });
  for (const p of hopped) for (const [hx, hy] of p.hops) sheet.add(hopSvg(hx, hy, p.kind));
  for (const [mx, my, lab, kind] of labels) sheet.addAll(edgeLabelSvg(mx, my, lab, kind, W));

  // simpul + label + glif asal + tag
  nodes.forEach((nd, i) => sheet.addAll(nodeSvg(nd, { index: i })));

  // apparatus figure: SVG memikul caption, baris KUNCI dan SUMBER sendiri (P6)
  const caption = `${s.id}  ${s.title}`;
  // D-288: baris KEY tidak digambar bila halaman mencetak baris KUNCI figur ini (satu aparatus).
  const hasLegend = drawsSvgKeyRow(s);
  const keyLine = (y: number): string =>
    svgText(pyInt(0), y, "KEY  " + (s.legend ?? []).map(String).join("  ·  "), {
      role: "table_header",
      colourToken: "ink400",
      anchor: "start",
      track: TRACK.micro_label_wider,
    });
  // Baris kaki terbawah = tepi isi + cadangan kaki (= H - 2 kisi pada lembar Garis A).
  let foot = fit ? fit.contentBottom + sheet.foot : H - LATTICE_Y * 2;
  if (apparatus === "figure") {
    sheet.add(svgText(pyInt(0), foot, caption, { role: "caption", colourToken: "ink700", anchor: "start" }));
    foot -= LATTICE_Y;
    if (hasLegend) {
      sheet.add(keyLine(foot));
      foot -= LATTICE_Y;
    }
    sheet.add(svgText(pyInt(0), foot, "SUMBER  " + sourcesOf(s).join("; "), { role: "source_line", colourToken: "ink400", anchor: "start" }));
  } else if (hasLegend) {
    sheet.add(keyLine(foot));
  }
  if (fit) sheet.fixHeight(H); // akar SVG memakai tinggi lembar pas (D-290)
  const svg = sheet.toSvg();
  if (fit) assertInsideSheet(svg, H);

  // DATUM-25 dari SVG NYATA (IP-39b, S84 #2): semua fill/stroke tercetak di luar
  // <defs> + definisi yang dirujuk, kertas dibuang. DEVIASI SENGAJA dari Garis A,
  // yang menghitung dari model token tidak lengkap (label ink900 dan garis luar
  // shadowed ink200 tak terhitung) sehingga 6 warna bisa lulus batas 5.
  const used = svgColourValues(svg);
  if (used.length > LIMITS.max_colour_values) {
    throw new DiagramDefect(
      `DATUM-25: ${used.length} nilai warna dalam satu gambar, maksimum ${LIMITS.max_colour_values} (temuan E-16: plafon ini nyata) (P5/P8)`,
      { checkId: "DATUM-25" },
    );
  }
  ran.push("DATUM-25");

  // DATUM-29/30 pada keluaran sendiri; caption dibandingkan dalam bentuk ter-escape.
  if (apparatus === "figure") {
    if (!svg.includes("SUMBER") || !svg.includes(escText(caption))) {
      throw new DiagramDefect("DATUM-29/30: apparatus figure tanpa caption bernomor atau baris SUMBER di SVG (P6/P8)", { checkId: "DATUM-29/30" });
    }
  } else if (!svg.includes("DATUM-APPARATUS-REQUIRED")) {
    throw new DiagramDefect("DATUM-36 kewajiban apparatus tidak tercatat pada apparatus page (P6)", { checkId: "DATUM-36" });
  }
  ran.push("DATUM-29/30");

  return {
    svg,
    widthMm: W,
    heightMm: H,
    report: {
      checksRun: ran,
      issues,
      colourValues: used,
      nColour: used.length,
      nHops: hopped.reduce((a, p) => a + p.hops.length, 0),
      nNodes: nodes.length,
      nEdges: paths.length,
      apparatus,
      family: s.family,
    },
  };
}
