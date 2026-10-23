/**
 * engine/chart/core — aparatus figur: penanda aparatus halaman, caption + SUMBER,
 * baris KUNCI, label langsung (S32).
 *
 * - `apparatus: "page"` (default, DC:146-150): halaman/dokumen mencetak caption dan
 *   SUMBER; SVG membawa komentar mesin `DATUM-APPARATUS-REQUIRED` agar lint rilis tidak
 *   membaca figur benar sebagai figur tanpa aparatus (lint 29, 30).
 * - `apparatus: "figure"`: SVG mandiri mencetak caption (`<id>   <judul>`) dan
 *   `SUMBER  <sumber>` sendiri (DC:235-240).
 * - Baris KUNCI menggantikan kotak legenda (CH-04, P7-13 "direct"): label "KUNCI"
 *   berhuruf kapital lalu petak warna + nama seri dalam satu baris, tanpa bingkai.
 */
import type { StudioChartV1 } from "../../../contract";
import type { ChartPalette } from "./palette";
import { SvgDoc, escText, midBaseline, ptToMm, textWidthMm } from "./svg";

/** Pita aparatus "figure" gaya galeri/keluarga (mm). DC memakai 22 mm (DC:91). */
export const FIGURE_APPARATUS_BAND_MM = 10;
export const KEY_ROW_HEIGHT_MM = 4.2;

export function apparatusMarker(doc: SvgDoc, spec: Pick<StudioChartV1, "id" | "title" | "source">): void {
  // Isi komentar mengikuti DC:148-149 (esc tanpa kutip); "--" dinetralkan SvgDoc.comment.
  doc.comment(`DATUM-APPARATUS-REQUIRED: caption=${escText(spec.id ?? "")} ${escText(spec.title ?? "")} | source=${escText(spec.source ?? "")}`);
}

/** Caption + SUMBER di dasar kanvas (apparatus "figure"), posisi DC:236-240. */
export function figureApparatus(doc: SvgDoc, spec: StudioChartV1, pal: ChartPalette, heightMm: number): void {
  doc.text(0, heightMm - 6, `${spec.id ?? ""}   ${spec.title}`, { sizePt: 7.0, fill: pal.ink900 });
  doc.text(0, heightMm - 1.6, `SUMBER  ${spec.source}`, { sizePt: 6.2, fill: pal.ink400 });
}

/** Catatan kaki di dalam figur, tengah (DC:229-231). */
export function noteLine(doc: SvgDoc, note: string, widthMm: number, yMm: number, pal: ChartPalette): void {
  doc.text(widthMm / 2, yMm, note, { sizePt: 6.2, fill: pal.ink400, anchor: "middle" });
}

export interface KeyItem {
  label: string;
  color: string;
}

/**
 * Baris KUNCI di (x, y = garis dasar teks). Mengembalikan lebar terpakai (mm).
 * Dekorasi: tidak membawa `data-mark`; dibungkus `<g data-key="row">`.
 */
export function keyRow(doc: SvgDoc, x: number, y: number, items: readonly KeyItem[], pal: ChartPalette, sizePt = 6.2): number {
  const sw = ptToMm(sizePt) * 0.9;
  const track = 0.15;
  doc.open('data-key="row"');
  doc.text(x, y, "KUNCI", { sizePt, fill: pal.ink400, bold: true, caps: true, trackMm: track });
  let cx = x + textWidthMm("KUNCI", sizePt, "struct", track) + 2.4;
  for (const it of items) {
    doc.rect(cx, y - sw, sw, sw, it.color);
    cx += sw + 1.0;
    doc.text(cx, y, it.label, { sizePt, fill: pal.ink700 });
    cx += textWidthMm(it.label, sizePt) + 3.0;
  }
  doc.close();
  return cx - x;
}

/** Garis dasar teks yang tegak-tengah pada pita setinggi `bandMm` mulai `top`. */
export function centredBaseline(top: number, bandMm: number, sizePt: number): number {
  return midBaseline(top + bandMm / 2, sizePt);
}
