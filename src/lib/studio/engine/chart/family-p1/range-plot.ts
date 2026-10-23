/**
 * P-07 Range plot — batang rentang minimum sampai maksimum (fokus pada lebar celah).
 *
 * Data `distribution`: tiap grup -> rentang min..maks nilainya (galeri menyimpan [min, maks]).
 * Acuan: pustakachart `v09_range` (PC:282, kelas CB1, data literal acuan): grup di sumbu x,
 * garis rentang ink400 0,8 pt, titik sampel ink900 ms 2,4 pt, kotak rerata ms 6 pt, label
 * "min-maks <satuan>" mono, gridline y. Penyimpangan disengaja: kotak rerata ink700, signal
 * hanya untuk grup beraksen (acuan memberi signal ke setiap grup = lebih dari satu aksen,
 * melanggar DATUM-26).
 * Galeri (Gambar 8.1 panel P-07): batang rentang mendatar konteks utama ink400, satu grup
 * aksen signal, label grup di kiri, sumbu x bertick.
 *
 * Registri tidak memuat parameter khusus P-07.
 */
import { fmt, withUnit } from "../../bind";
import { ptToMm, textWidthMm } from "../core/svg";
import {
  type P1Ctx,
  GRID_MM,
  HAIR_MM,
  SPINE_MM,
  TYPE_PT,
  accentHint,
  assertAccentCount,
  axisX,
  axisY,
  gridY,
  hintMiss,
  labelGutter,
  linearScale,
  mid,
  pt,
  requireDistribution,
  resolveTarget,
  tickWidth,
  valueDomain,
} from "./common";

export function renderRangePlot(ctx: P1Ctx): void {
  const { pal, doc, W, style } = ctx;
  const groups = requireDistribution(ctx).map((g) => ({
    ...g,
    lo: Math.min(...g.values),
    hi: Math.max(...g.values),
    mean: g.values.reduce((a, b) => a + b, 0) / g.values.length,
  }));
  const names = groups.map((g) => g.name);
  let accentGroup = -1;
  const hint = accentHint(ctx.spec);
  if (hint) {
    accentGroup = resolveTarget(hint.target ?? hint.series, names);
    if (accentGroup < 0) hintMiss(ctx, JSON.stringify(hint));
  }
  assertAccentCount(ctx, new Set(accentGroup >= 0 ? [names[accentGroup]] : []));
  const dom = valueDomain(groups.flatMap((g) => [g.lo, g.hi]), false);

  if (style === "gallery") {
    const T = TYPE_PT.gallery;
    const labelPt = pt(ctx, T.label);
    const x0 = labelGutter(ctx, names, labelPt, 0.3) + 1.0;
    const x1 = W - Math.max(1.0, tickWidth(dom, T.tick, "struct") / 2 + 0.3);
    const top = 0.8;
    const base = ctx.bottom - 4.6;
    const sx = linearScale(dom.min, dom.max, x0, x1);
    const step = (base - top) / groups.length;
    const bh = Math.min(1.1, step * 0.3);
    groups.forEach((g, gi) => {
      const yc = top + step * (gi + 0.5);
      doc.text(x0 - 2.0, mid(yc, labelPt), g.name, { sizePt: labelPt, fill: pal.ink400, anchor: "end" });
      const xa = sx(g.lo);
      // Rentang nol tetap terlihat sebagai garis selebar garis rambut.
      doc.rect(xa, yc - bh / 2, Math.max(sx(g.hi) - xa, HAIR_MM), bh, gi === accentGroup ? pal.role.accent : pal.role.contextMain, {
        mark: { mark: "interval", series: g.name, index: gi },
      });
    });
    axisX(ctx, dom, sx, base, x0, x1, { colour: pal.role.textAxis, widthMm: HAIR_MM, sizePt: T.tick, face: "struct" });
    return;
  }

  // Gaya datum (resep v09_range, vertikal).
  const T = TYPE_PT.datum;
  const top = 6.0;
  const base = ctx.bottom - 5.2;
  const x0 = 0.5 + tickWidth(dom, T.tick, "data") + 1.6;
  const x1 = W - 0.5;
  const sy = linearScale(dom.min, dom.max, base, top);
  gridY(ctx, dom, sy, x0, x1, pal.ink200);
  const step = (x1 - x0) / groups.length;
  const rPt = 1.2 * (25.4 / 72);
  const sq = 6 * (25.4 / 72);
  groups.forEach((g, gi) => {
    const gx = x0 + step * (gi + 0.5);
    doc.line(gx, sy(g.lo), gx, sy(g.hi), pal.ink400, Math.max(GRID_MM, 0.8 * (25.4 / 72)), { mark: { mark: "interval", series: g.name, index: gi } });
    g.values.forEach((v, vi) => doc.circle(gx, sy(v), rPt, pal.ink900, { mark: { mark: "point", series: g.name, index: gi }, attrs: ` data-obs="${vi}"` }));
    doc.rect(gx - sq / 2, sy(g.mean) - sq / 2, sq, sq, gi === accentGroup ? pal.role.accent : pal.ink700, {
      mark: { mark: "point", series: `${g.name} rerata`, index: gi },
    });
    const s = withUnit(`${fmt(g.lo, ctx.dec)}-${fmt(g.hi, ctx.dec)}`, ctx.unit);
    // Label rentang di kanan penanda; dipindah ke kiri bila melewati tepi kanvas.
    const right = gx + sq / 2 + 1.0 + textWidthMm(s, pt(ctx, T.value), "data") <= W - 0.3;
    doc.text(right ? gx + sq / 2 + 1.0 : gx - sq / 2 - 1.0, sy(g.hi) - 0.8, s, {
      face: "data",
      sizePt: pt(ctx, T.value),
      fill: pal.ink700,
      anchor: right ? "start" : "end",
      attrs: ' data-label="value"',
    });
    doc.text(gx, base + 3.6, g.name, { sizePt: pt(ctx, T.label), fill: pal.ink700, anchor: "middle" });
  });
  axisY(ctx, dom, sy, x0, top, base, { colour: pal.ink400, widthMm: SPINE_MM, sizePt: T.tick, face: "data" });
  doc.open('data-axis="x"');
  doc.line(x0, base, x1, base, pal.ink400, SPINE_MM);
  doc.close();
  if (ctx.unit) doc.text(x0, top - ptToMm(T.title) - 0.4, ctx.unit, { sizePt: pt(ctx, T.title), fill: pal.ink700 });
}
