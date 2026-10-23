/**
 * P-14 Arrow chart — dumbbell berpanah: arah perubahan sama penting dengan besarnya
 * (Tabel 8.1). TANPA ACUAN Python (kelas paritas CC; research/06 §6.3 cek khusus: "panah
 * per kategori = 2 titik berpasangan; arah sesuai tanda selisih").
 * - Data `series`: kategori = baris; seri pertama = kondisi awal, seri kedua = kondisi
 *   akhir. Seri ketiga dan seterusnya diabaikan (REPORT). Nilai null pada salah satu ujung
 *   = baris tanpa panah (REPORT).
 * - Satu panah per kategori: batang `data-mark="segment"` dari awal ke akhir dengan
 *   `data-from`, `data-to`, `data-direction` (up | down | flat); kepala panah = dekorasi.
 *   Awal = akhir -> titik `data-mark="point"`.
 * - Domain: `params.axis` [min, max] bila ada, selain itu domain rapi data (posisi; tanpa
 *   paksaan nol karena panjang panah, bukan panjang batang, yang dibaca).
 * - Aksen satu kategori: `accent.point`, `params.accentPoint`, atau `params.accentCategory`.
 * - Gaya `gallery` (Gambar 8.1): panah ink700, aksen peran accent, label kategori kiri,
 *   sumbu x bertick. Gaya `datum`: panah ink900, kisi x, label nilai mono di kedua ujung,
 *   baris "awal -> akhir" di atas plot.
 */
import type { ChartCanvas, ResolvedTemplate, StudioChartV1, SvgResult } from "../../../contract";
import { StudioEngineError } from "../../../contract/errors";
import { fmt } from "../../bind";
import { figureLabel } from "../core/guards";
import { kindKey } from "../core/palette";
import { decimalsFor, linearScale, niceDomain } from "../core/scale";
import { escAttr, num, textWidthMm } from "../core/svg";
import {
  accentHint,
  asRange,
  assertAccentCount,
  beginP2,
  finishP2,
  gridLines,
  hint,
  hintMatches,
  kindParam,
  mid,
  reportIssue,
  requireSeries,
  xAxis,
} from "./common";

const CODE = "P-14" as const;
const HEAD_LEN_MM = 1.5;
const HEAD_HALF_MM = 0.65;

export function renderArrow(spec: StudioChartV1, canvas: ChartCanvas, tpl: ResolvedTemplate): SvgResult {
  const ctx = beginP2(spec, canvas, tpl, CODE);
  const { pal, doc, style, W, H } = ctx;
  const fid = figureLabel(spec);
  const sd = requireSeries(spec, CODE);
  if (sd.series.length < 2) {
    throw new StudioEngineError("SCHEMA_INVALID", `${fid} — P-14 membutuhkan 2 seri (awal, akhir); diterima ${sd.series.length}`, { code: CODE });
  }
  if (sd.series.length > 2) {
    reportIssue(ctx, kindKey(CODE, "series"), `${fid} — ${sd.series.length - 2} seri setelah dua pertama diabaikan`);
  }
  const [s0, s1] = sd.series;
  const ah = accentHint(spec, CODE);
  const accent = sd.categories.map((c, i) => hintMatches(ah.point, c, i));
  assertAccentCount(spec, CODE, accent.filter(Boolean).length, ctx.maxAccent, "kategori");

  const rows = sd.categories.map((label, i) => ({ label, a: s0.values[i], b: s1.values[i] }));
  rows.forEach((r, i) => {
    if (r.a === null || r.b === null) reportIssue(ctx, kindKey(CODE, "missing"), `${fid} — kategori "${r.label}" (${i}) tanpa nilai awal/akhir; panah tidak digambar`);
  });
  const vals = rows.flatMap((r) => [r.a, r.b]).filter((v): v is number => v !== null);
  if (vals.length === 0) throw new StudioEngineError("SCHEMA_INVALID", `${fid} — P-14 tanpa pasangan nilai`, { code: CODE });
  // Domain = parameter templat `chart.kind.P-14.axis` (alias `axis` dipindah resolver; IP-59/FIX-A).
  const range = asRange(spec, kindParam(spec, tpl, CODE, "axis") ?? hint(spec, "axis"), "params.axis");
  const dom = niceDomain(range ?? vals, { zero: false });
  const lo = range ? range[0] : dom.min;
  const hi = range ? range[1] : dom.max;
  const ticks = dom.ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);
  const tdec = decimalsFor(dom.step);
  const dec = spec.dec ?? 0;

  const LBL = ctx.pt(6.4);
  const VAL = ctx.pt(6.0);
  const labelW = Math.max(...rows.map((r) => textWidthMm(r.label, LBL)));
  const valPad = style === "datum" ? Math.max(...vals.map((v) => textWidthMm(fmt(v, dec), VAL, "data"))) + 1.2 : 0;
  const x0 = Math.min(Math.max(labelW + 1.8, 6), W * 0.4) + valPad;
  const x1 = W - Math.max(1.0, textWidthMm(fmt(hi, tdec), 6.5) / 2 + 0.3) - valPad;
  const sx = linearScale(lo, hi, x0, x1);
  const top = style === "gallery" ? 0.8 : 4.6;
  const base = H - ctx.footBand - 5.4;
  const step = (base - 1.0 - top) / rows.length;

  if (style === "datum") {
    gridLines(ctx, true, ticks.map(sx), top, base);
    doc.text(x0, 2.8, `${s0.name} → ${s1.name}`, { sizePt: ctx.pt(6.4), fill: pal.ink700, attrs: ' data-key="row"' });
  }
  const series = `${s0.name}→${s1.name}`;
  const width = style === "gallery" ? 0.45 : 0.5;
  rows.forEach((r, i) => {
    const yc = top + step * (i + 0.5);
    doc.text(x0 - 1.2 - valPad, mid(yc, LBL), r.label, { sizePt: LBL, fill: pal.ink400, anchor: "end" });
    if (r.a === null || r.b === null) return;
    const color = accent[i] ? pal.role.accent : style === "gallery" ? pal.ink700 : pal.ink900;
    const xa = sx(r.a);
    const xb = sx(r.b);
    const dir = r.b > r.a ? "up" : r.b < r.a ? "down" : "flat";
    const meta = ` data-category="${escAttr(r.label)}" data-from="${num(r.a)}" data-to="${num(r.b)}" data-direction="${dir}"`;
    doc.open(`data-arrow="${i}"`);
    if (dir === "flat") {
      doc.circle(xa, yc, 0.7, color, { mark: { mark: "point", series, index: i }, attrs: meta });
    } else {
      const sgn = dir === "up" ? 1 : -1;
      const len = Math.abs(xb - xa);
      const head = Math.min(HEAD_LEN_MM, len * 0.6);
      const shaftEnd = xb - sgn * head * 0.85;
      doc.line(xa, yc, shaftEnd, yc, color, width, { mark: { mark: "segment", series, index: i }, attrs: `${meta} stroke-linecap="round"` });
      const hb = xb - sgn * head;
      doc.path(`M${num(xb)} ${num(yc)} L${num(hb)} ${num(yc - HEAD_HALF_MM)} L${num(hb)} ${num(yc + HEAD_HALF_MM)} Z`, color, {
        attrs: ' data-arrowhead="1"',
      });
    }
    if (style === "datum") {
      const left = Math.min(r.a, r.b);
      const right = Math.max(r.a, r.b);
      doc.text(sx(left) - 1.0, mid(yc, VAL), fmt(left, dec), { face: "data", sizePt: VAL, fill: pal.ink700, anchor: "end", attrs: ' data-label="value"' });
      if (dir !== "flat") {
        doc.text(sx(right) + 1.0, mid(yc, VAL), fmt(right, dec), { face: "data", sizePt: VAL, fill: pal.ink700, anchor: "start", attrs: ' data-label="value"' });
      }
    }
    doc.close();
  });

  xAxis(ctx, { at: base, from: x0, to: x1, scale: sx, ticks, label: (v) => fmt(v, tdec), tickMarks: style === "gallery" });
  return finishP2(ctx);
}
