/**
 * Rute konektor (S30): port `route_edges` (:930), `_side_of` (:837), `_anchor`
 * (:852), `_rect_hit` (:870), `_blocked` (:968), `_detour` (:983) dan
 * `add_crossing_hops` (:1019) dari `HS/datum_diagram.py`.
 *
 * P5: jangkar dikipas pada sisi kotak, jalur ortogonal, detur mengelilingi
 * kotak tak terkait (gagal = DATUM-32), lompatan silang r 0,9 mm. Konektor
 * memakai sisi kotak simpul (bukan port simbol S31), sama seperti Python.
 * Simpul diiterasi dalam urutan sisip `Sheet.nodes` (dict Python): simpul
 * penghalang pertama menentukan detur.
 */
import type { DiagramEdge, RoutedEdge, StudioDiagramV1 } from "../../../contract";
import { DiagramDefect, LATTICE_Y, polylineD, snap, type Sheet, type SheetNode } from "../core";

type Pt = readonly [number, number];
type Side = "bottom" | "top" | "right" | "left";
const OPP: Readonly<Record<Side, Side>> = { bottom: "top", top: "bottom", right: "left", left: "right" };

/** Jalur dengan lompatan silang: titik pusat (x, y) pada lintasan horizontal jalur ini. */
export interface HoppedEdge extends RoutedEdge {
  hops: ReadonlyArray<readonly [number, number]>;
}

function sideOf(a: SheetNode, b: SheetNode): Side {
  const acx = a.x + a.w / 2.0;
  const acy = a.y + a.h / 2.0;
  const bcx = b.x + b.w / 2.0;
  const bcy = b.y + b.h / 2.0;
  const dx = bcx - acx;
  const dy = bcy - acy;
  // Rel bus selebar lembar: cabang lewat sisi horizontal (P2/E-17).
  if (a.spec.shape === "bus") return bcy > acy ? "bottom" : "top";
  // FIX-B2: edge simpul -> rel keluar dari sisi simpul yang MENGHADAP rel
  // (rel di bawah = bottom). Python `_side_of` :869-870 membaliknya ("top"
  // bila rel di bawah), sehingga pencatu rel hilir dirute menembus simpulnya
  // sendiri; tidak ada fixture Garis A dengan edge simpul -> rel.
  if (b.spec.shape === "bus") return bcy > acy ? "bottom" : "top";
  if (Math.abs(dy) >= Math.abs(dx)) return dy > 0 ? "bottom" : "top";
  return dx > 0 ? "right" : "left";
}

/** Jangkar dikipas; tap rel bus mendarat di garis tengah rel (E-17). */
function anchor(node: SheetNode, side: Side, slot: number, slots: number): Pt {
  const frac = (slot + 1.0) / (slots + 1.0);
  if (node.spec.shape === "bus" && (side === "bottom" || side === "top")) {
    return [node.x + node.w * frac, node.y + node.h / 2.0];
  }
  if (side === "bottom") return [node.x + node.w * frac, node.y + node.h];
  if (side === "top") return [node.x + node.w * frac, node.y];
  if (side === "right") return [node.x + node.w, node.y + node.h * frac];
  return [node.x, node.y + node.h * frac];
}

function rectHit(p: Pt, q: Pt, node: SheetNode, pad = 0.05): boolean {
  const x1 = node.x + pad;
  const y1 = node.y + pad;
  const x2 = node.x + node.w - pad;
  const y2 = node.y + node.h - pad;
  const [ax, ay] = p;
  const [bx, by] = q;
  if (Math.abs(ay - by) < 1e-9) return Math.min(ax, bx) < x2 && Math.max(ax, bx) > x1 && y1 < ay && ay < y2;
  if (Math.abs(ax - bx) < 1e-9) return Math.min(ay, by) < y2 && Math.max(ay, by) > y1 && x1 < ax && ax < x2;
  const steps = 24; // diagonal pendek: sampling
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sx = ax + (bx - ax) * t;
    const sy = ay + (by - ay) * t;
    if (x1 < sx && sx < x2 && y1 < sy && sy < y2) return true;
  }
  return false;
}

const OUTSIDE = { id: "<luar lembar>" } as const;

function blocked(pts: readonly Pt[], ends: readonly [string, string], nodes: readonly SheetNode[], W: number): SheetNode | typeof OUTSIDE | null {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    for (const [px, py] of [a, b]) {
      if (px < -1e-6 || px > W + 1e-6 || py < -1e-6) return OUTSIDE;
    }
    for (const nd of nodes) {
      if (nd.id === ends[0] || nd.id === ends[1]) continue;
      if (rectHit(a, b, nd)) return nd;
    }
  }
  return null;
}

function manhattan(c: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i + 1 < c.length; i++) sum += Math.abs(c[i + 1][0] - c[i][0]) + Math.abs(c[i + 1][1] - c[i][1]);
  return sum;
}

/** HS `_detour`: hingga 6 percobaan; kandidat bersih terpendek (min pertama); gagal = DATUM-32. */
/** `lx` = kisi horizontal lembar (`Sheet.colMm`; A4 = `LATTICE_X`, D-245). */
function detour(pts: readonly Pt[], ends: readonly [string, string], nodes: readonly SheetNode[], W: number, lx: number): Pt[] {
  let cur: Pt[] = [...pts];
  for (let attempt = 0; attempt < 6; attempt++) {
    const hit = blocked(cur, ends, nodes, W);
    if (hit === null) return cur;
    if (!("y" in hit)) break; // luar lembar: tidak ada kotak untuk dikelilingi
    const start = cur[0];
    const end = cur[cur.length - 1];
    const pad = snap(LATTICE_Y * 2, LATTICE_Y);
    const below = snap(hit.y + hit.h + pad, LATTICE_Y);
    const above = snap(hit.y - pad, LATTICE_Y);
    const right = snap(hit.x + hit.w + pad, lx);
    const left = snap(hit.x - pad, lx);
    const cands: Pt[][] = [];
    for (const cy of [below, above]) {
      if (cy >= 0) {
        cands.push([start, [start[0], cy], [end[0], cy], end]);
        cands.push([start, [start[0], cy], [right, cy], [right, end[1]], end]);
        cands.push([start, [start[0], cy], [left, cy], [left, end[1]], end]);
      }
    }
    for (const cx of [right, left]) {
      if (cx >= 0) cands.push([start, [cx, start[1]], [cx, end[1]], end]);
    }
    const ok = cands.filter((c) => blocked(c, ends, nodes, W) === null);
    if (!ok.length) break;
    let best = ok[0];
    let bestLen = manhattan(best);
    for (const c of ok.slice(1)) {
      const len = manhattan(c);
      if (len < bestLen) {
        best = c;
        bestLen = len;
      }
    }
    cur = best;
  }
  const hit = blocked(cur, ends, nodes, W);
  if (hit === null) return cur;
  throw new DiagramDefect(
    `DATUM-32: konektor ${ends[0]}->${ends[1]} terpaksa menembus kotak tak terkait '${hit.id}' dan detur gagal (P5/P8)`,
    { checkId: "DATUM-32" },
  );
}

/** Python `list.index(e)`: indeks elemen pertama yang sama nilainya. */
function indexOfEdge(list: readonly DiagramEdge[], e: DiagramEdge): number {
  return list.findIndex((x) => x === e || (x.from === e.from && x.to === e.to && x.kind === e.kind && x.label === e.label));
}

function nodeOf(sheet: Sheet, id: string): SheetNode {
  const n = sheet.nodes.get(id);
  if (!n) throw new DiagramDefect(`konektor merujuk simpul yang tidak ditempatkan: ${id} (P1/P8)`, { checkId: "DATUM-24" });
  return n;
}

/** HS `route_edges` atas lembar tertempat (keluarga selain sequence). */
export function routePlaced(s: StudioDiagramV1, sheet: Sheet): RoutedEdge[] {
  const edges = s.edges ?? [];
  const nodes = [...sheet.nodes.values()];
  const grouped = new Map<string, DiagramEdge[]>();
  const gk = (id: string, side: Side) => `${side}\u0000${id}`;
  const push = (k: string, e: DiagramEdge) => {
    const g = grouped.get(k);
    if (g) g.push(e);
    else grouped.set(k, [e]);
  };
  for (const e of edges) {
    const sa = sideOf(nodeOf(sheet, e.from), nodeOf(sheet, e.to));
    push(gk(e.from, sa), e);
    push(gk(e.to, OPP[sa]), e);
  }
  const stub = snap(LATTICE_Y, LATTICE_Y);
  const out: RoutedEdge[] = [];
  for (const e of edges) {
    const a = nodeOf(sheet, e.from);
    const b = nodeOf(sheet, e.to);
    const sa = sideOf(a, b);
    const sb = OPP[sa];
    const ga = grouped.get(gk(e.from, sa))!;
    const gb = grouped.get(gk(e.to, sb))!;
    const p = anchor(a, sa, indexOfEdge(ga, e), ga.length);
    const q = anchor(b, sb, indexOfEdge(gb, e), gb.length);
    let pts: Pt[];
    if (sa === "bottom" || sa === "top") {
      const pa: Pt = [p[0], p[1] + (sa === "bottom" ? stub : -stub)];
      // E-17: stub target arah balik dari batas (masuk dari luar).
      const pb: Pt = [q[0], q[1] + (sb === "bottom" ? stub : -stub)];
      const midy = snap((pa[1] + pb[1]) / 2.0, LATTICE_Y);
      pts = [p, pa, [pa[0], midy], [pb[0], midy], pb, q];
    } else {
      const pa: Pt = [p[0] + (sa === "right" ? stub : -stub), p[1]];
      const pb: Pt = [q[0] + (sb === "right" ? stub : -stub), q[1]];
      const midx = snap((pa[0] + pb[0]) / 2.0, sheet.colMm);
      pts = [p, pa, [midx, pa[1]], [midx, pb[1]], pb, q];
    }
    pts = detour(pts, [e.from, e.to], nodes, sheet.widthMm, sheet.colMm);
    out.push({ from: e.from, to: e.to, kind: e.kind, label: e.label, points: pts, d: polylineD(pts) });
  }
  return out;
}

/**
 * HS `add_crossing_hops`: lintasan horizontal jalur i melompati lintasan
 * vertikal jalur j > i. Lompatan dicatat pada jalur i dalam urutan Python
 * (i, j, segmen q, segmen p) sehingga urutan gambar busur setara.
 */
export function crossingHops(paths: readonly RoutedEdge[]): HoppedEdge[] {
  const hops: Array<Array<readonly [number, number]>> = paths.map(() => []);
  for (let i = 0; i < paths.length; i++) {
    const pp = paths[i].points;
    for (let j = i + 1; j < paths.length; j++) {
      const qp = paths[j].points;
      for (let t = 0; t + 1 < qp.length; t++) {
        const [cx, cy] = qp[t];
        const [dx, dy] = qp[t + 1];
        for (let u = 0; u + 1 < pp.length; u++) {
          const [ax, ay] = pp[u];
          const [bx, by] = pp[u + 1];
          const hor = Math.abs(ay - by) < 1e-9;
          const ver = Math.abs(cx - dx) < 1e-9;
          if (!(hor && ver)) continue;
          if (Math.min(ax, bx) < cx && cx < Math.max(ax, bx) && Math.min(cy, dy) < ay && ay < Math.max(cy, dy)) {
            hops[i].push([cx, ay]);
          }
        }
      }
    }
  }
  return paths.map((p, i) => ({ ...p, d: p.d ?? polylineD(p.points), hops: hops[i] }));
}
