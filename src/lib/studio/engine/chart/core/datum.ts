/**
 * engine/chart/core — gaya "datum": port langsung datumchart.py Rev L (RL, Garis B),
 * keluarga `bar`, `column`, `threshold` (DC:73-243). Kelas paritas CA (research/06 §6.2):
 * urutan dan jenis elemen identik dengan DC, geometri sama dalam mm (DC menulis px 96 dpi;
 * di sini 1 satuan pengguna = 1 mm, sehingga koordinat = px DC / 3,7795275591).
 *
 * Penyimpangan yang disengaja (dicatat di catatan S32):
 * - ukuran huruf ditulis dalam pt FISIK (angka font-size DC dibaca sebagai pt, §6.4-N1);
 *   lebar garis dan jarak putus tetap px DC yang dikonversi ke mm;
 * - `sub` (pita label kedua kolom) aktif bila ADA titik ber-`sub`; DC membaca kunci
 *   tingkat atas `spec.sub` untuk tinggi tetapi `x.sub` per titik untuk gambar (DC:86, 218);
 * - huruf kapital diterapkan SEBELUM escape (DC meng-escape lalu mengapitalkan, yang
 *   merusak entitas `&amp;`);
 * - nilai negatif ditolak (CH-01) karena DC menggambar lebar negatif;
 * - P-01: parameter sort/accent/valueLabel registri berlaku (lihat prepare.ts);
 *   `valueLabel: "barEnd"` = kolom nilai tetap DC:179-182, `inside` = di dalam ujung batang.
 */
import type { ChartCanvas, ResolvedTemplate, StudioChartV1, SvgResult } from "../../../contract";
import { fmt } from "../../bind";
import { apparatusMarker, figureApparatus, noteLine } from "./apparatus";
import type { CorePrep } from "./prepare";
import { axisDomain } from "./scale";
import { SvgDoc, dcPx, textWidthMm } from "./svg";

/** Taksiran tinggi DC `tinggi()` (DC:76-92), mm. */
export function datumHeightMm(spec: StudioChartV1, family: "bar" | "column" | "threshold"): number {
  const pts = spec.data?.shape === "categorical" ? spec.data.points : [];
  const n = pts.length;
  let badan = family === "column" ? 46 + (pts.some((p) => p.sub !== undefined && p.sub !== "") ? 12 : 0) : n * 7.2 + 6;
  if (spec.note) badan += 6;
  if (family === "threshold") badan += 5;
  return badan + (spec.apparatus === "figure" ? 22 : 0);
}

/** `puncak` DC:139-140: maks |nilai| (dan |limit| bila limit bukan 0/None) x 1,14, atau 1. */
function peak(prep: CorePrep): number {
  const vals = prep.pts.map((p) => Math.abs(p.value));
  if (prep.limit) vals.push(Math.abs(prep.limit));
  return Math.max(...vals) * 1.14 || 1;
}

export function renderDatum(spec: StudioChartV1, canvas: ChartCanvas, tpl: ResolvedTemplate, prep: CorePrep): SvgResult {
  void tpl;
  const W = canvas.widthMm;
  const H = canvas.heightMm;
  const { pal, pts, dec, unit, limit } = prep;
  const puncak = peak(prep);
  const issues: SvgResult["report"]["issues"] = [];
  // Petunjuk `axis` P-11 (IP-41c): batang bermula di tepi kiri domain [lo, hi]; tanpa
  // petunjuk tetap DC `lebar * v / puncak` (byte-identik).
  let lo = 0;
  let span = puncak;
  if (prep.axis) {
    const ad = axisDomain([...pts.map((p) => p.value), ...(limit !== null ? [limit] : [])], { zero: prep.zero }, prep.axis);
    lo = ad.dom.min;
    span = ad.dom.max - ad.dom.min || 1;
    if (ad.widened) issues.push({ checkId: "AXIS_DOMAIN", status: "REPORT", detail: ad.widened });
    if (lo > 0) issues.push({ checkId: "CH-01", status: "REPORT", detail: `domain threshold ${lo}..${ad.dom.max} tidak bermula nol (petunjuk axis)` });
  }
  const doc = new SvgDoc(W, H, `data-chart="${prep.code}" data-style="datum"`, prep.minFontPt);
  if ((spec.apparatus ?? "page") === "page") apparatusMarker(doc, spec);
  doc.paper(pal.paper);

  const D = "data" as const;
  const series = spec.unit ? spec.unit : "nilai";

  if (prep.family === "bar" || prep.family === "threshold") {
    const kiri = 22;
    const kanan = W - 24;
    const lebar = kanan - kiri;
    let y = 3;
    const tb = 4.4;
    const jarak = 7.2;
    pts.forEach((x, i) => {
      const v = x.value;
      const L = (lebar * (v - lo)) / span;
      const lewat = limit !== null && v > limit;
      const warna = lewat ? prep.overColour : x.accent ? pal.role.accent : pal.ink700;
      const tinta = lewat ? prep.overColour : x.accent ? pal.role.accent : pal.ink900;
      doc.text(kiri - 2.2, y + tb * 0.78, x.label, { face: D, sizePt: 6.6, fill: pal.ink400, anchor: "end" });
      doc.rect(kiri, y, L, tb, warna, { mark: { mark: "bar", series, index: i } });
      if (prep.valueLabel !== "none") {
        const s = fmt(v, dec);
        const fits = L >= textWidthMm(s, 6.8, "data") + 2;
        if (prep.valueLabel === "inside" && fits) {
          doc.text(kiri + L - 1.0, y + tb * 0.78, s, { face: D, sizePt: 6.8, fill: pal.paper, anchor: "end", attrs: ' data-label="value"' });
        } else {
          doc.text(W - 1.5, y + tb * 0.78, s, { face: D, sizePt: 6.8, fill: tinta, anchor: "end", attrs: ' data-label="value"' });
        }
      }
      y += jarak;
    });
    const dasar = y - jarak + tb + 1.4;
    doc.open('data-axis="y"');
    doc.line(kiri, 3, kiri, dasar, pal.ink900, dcPx(1.1));
    doc.close();
    if (limit !== null) {
      const xl = kiri + (lebar * (limit - lo)) / span;
      doc.line(xl, 2, xl, dasar, pal.role.limitExceeded, dcPx(0.9), { dashMm: [dcPx(3), dcPx(2)], attrs: ' data-limit="line"' });
      if (prep.limitLabelled) {
        // Nama batas dikapitalkan, angka dan satuan tidak (DC:192-193: "m" bukan "M").
        doc.text(xl, dasar + 3.4, (prep.limitLabel ?? "BATAS").toUpperCase(), {
          sizePt: 6.2,
          fill: pal.role.limitExceeded,
          anchor: "end",
          bold: true,
          trackMm: dcPx(0.6),
        });
        doc.text(xl + 1.4, dasar + 3.4, fmt(limit, dec) + (unit ? ` ${unit}` : ""), {
          face: D,
          sizePt: 6.2,
          fill: pal.role.limitExceeded,
          anchor: "start",
        });
      }
    }
    if (unit) doc.text(W - 1.5, dasar + 3.4, unit, { face: D, sizePt: 6.2, fill: pal.ink400, anchor: "end" });
  } else {
    const hasSub = pts.some((p) => p.sub !== undefined && p.sub !== "");
    const dasar = H - (hasSub ? 10 : 6);
    const atas = 6;
    const kiri = 4;
    const lebar = W - 8;
    const langkah = lebar / pts.length;
    const lk = Math.min(langkah * 0.52, 14);
    pts.forEach((x, i) => {
      const v = x.value;
      const h = ((dasar - atas) * v) / puncak;
      const cx = kiri + langkah * (i + 0.5);
      const warna = x.accent ? pal.role.accent : pal.ink700;
      doc.rect(cx - lk / 2, dasar - h, lk, h, warna, { mark: { mark: "column", series, index: i } });
      if (prep.columnValueLabels) {
        doc.text(cx, dasar - h - 1.6, fmt(v, dec), {
          face: D,
          sizePt: 6.8,
          fill: x.accent ? pal.role.accent : pal.ink900,
          anchor: "middle",
          attrs: ' data-label="value"',
        });
      }
      doc.text(cx, dasar + 3.6, x.label, { sizePt: 6.4, fill: pal.ink400, anchor: "middle", caps: true, trackMm: dcPx(0.5) });
      if (x.sub) doc.text(cx, dasar + 7.2, x.sub, { face: D, sizePt: 6.0, fill: pal.ink400, anchor: "middle" });
    });
    doc.open('data-axis="x"');
    doc.line(kiri, dasar, W - kiri, dasar, pal.ink900, dcPx(1.1));
    doc.close();
    if (unit) doc.text(kiri, atas - 1.6, unit, { face: D, sizePt: 6.2, fill: pal.ink400, anchor: "start" });
  }

  if (spec.note) noteLine(doc, spec.note, W, H - 1.6, pal);
  if (spec.apparatus === "figure") figureApparatus(doc, spec, pal, H);

  return {
    svg: doc.toString(),
    widthMm: W,
    heightMm: H,
    report: { checksRun: [...new Set(issues.map((i) => i.checkId))], issues },
  };
}
