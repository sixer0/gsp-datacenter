/**
 * Tata letak swimlane (S28, I18): port persis HS `layout_swimlane`
 * (`datum_diagram.py:535-562`). Lajur = akuntabilitas (P2 swimlane).
 *
 * Nilai yang dikembalikan adalah keadaan lembar Python tepat setelah mesin
 * layout (sebelum lintasan snap/clamp `build_svg` :1124-1136, milik S30).
 * Spek masukan tidak dimutasi (Python menulis `n["_lane_i"]`; di sini peta lokal).
 */
import type { DiagramBox, DiagramNode, DiagramSheet, LayoutResult, StudioDiagramV1 } from "../../../contract";
import { StudioEngineError } from "../../../contract/errors";
import { baselineStepMm, latticeOf, nodeSize, pyStr, sheetHeight, snap, textUnitsHeightMm } from "./geometry";

export interface SwimlaneLayout extends LayoutResult {
  family: "swimlane";
  /** Pita lajur: x = 0, w = lebar lembar (Python menyimpan y/h saja). */
  lanes: Record<string, DiagramBox>;
  /** Urutan lajur kemunculan pertama (kunci numerik di `Record` JS diurutkan ulang; pakai ini untuk menggambar). */
  laneOrder: string[];
  /** Nama lajur per id simpul (pengganti `_lane_i`). */
  nodeLane: Record<string, string>;
  /** `sheet.gutter_w`: lebar parit label lajur (mm). */
  gutterMm: number;
}

const NO_LANE = "tanpa lajur";

function laneName(n: DiagramNode): string {
  const cls = (n.class ?? {}) as Record<string, unknown>;
  // Python: str(n.get("class", {}).get("lane", "tanpa lajur")) — null menjadi "None".
  return Object.prototype.hasOwnProperty.call(cls, "lane") && cls.lane !== undefined ? pyStr(cls.lane) : NO_LANE;
}

export function layoutSwimlane(s: StudioDiagramV1, sheet: DiagramSheet): SwimlaneLayout {
  const L = latticeOf(sheet);
  const specNodes = s.nodes ?? [];
  if (!specNodes.length) {
    throw new StudioEngineError("BY_CONSTRUCTION_FAILED", "DIAGRAM DEFECT: swimlane tanpa simpul (P1 nodes[])");
  }

  const lanes: string[] = [];
  const li = new Map<string, number>();
  const nodeLane: Record<string, string> = {};
  for (const n of specNodes) {
    const ln = laneName(n);
    if (!li.has(ln)) {
      li.set(ln, lanes.length);
      lanes.push(ln);
    }
    nodeLane[n.id] = ln;
  }
  const gutter = snap(L.x * 3, L.x);
  const perLane = new Map<string, DiagramNode[]>(lanes.map((ln) => [ln, []]));
  for (const n of specNodes) perLane.get(nodeLane[n.id])!.push(n);

  const nodes: Record<string, DiagramBox> = {};
  const laneBoxes: Record<string, DiagramBox> = {};
  const laneList: DiagramBox[] = [];
  // D-242: satu baseline (HS memakai pt sebagai mm di sini: 13,5 -> 14,2875 mm).
  const laneStep = baselineStepMm(1, L);
  let y = L.top;
  for (const ln of lanes) {
    const group = perLane.get(ln)!;
    const hs = group.map((n) => nodeSize(n, L)[1]);
    const lh = hs.length ? Math.max(...hs) : textUnitsHeightMm(3, L); // D-242: 3 unit x 1 baseline
    let x = gutter + L.x;
    for (const n of group) {
      const [nw, nh] = nodeSize(n, L);
      // Python: id ganda menimpa entri sebelumnya (validate_spec menolaknya lebih dulu).
      nodes[n.id] = { x, y: y + (lh - nh) / 2.0, w: nw, h: nh };
      x += nw + L.x;
    }
    const box: DiagramBox = { x: 0, y, w: L.W, h: lh };
    laneBoxes[ln] = box;
    laneList.push(box);
    y += lh + laneStep;
  }

  return {
    family: "swimlane",
    nodes,
    lanes: laneBoxes,
    laneOrder: lanes,
    nodeLane,
    gutterMm: gutter,
    widthMm: L.W,
    heightMm: sheetHeight(L, Object.values(nodes), laneList),
  };
}
