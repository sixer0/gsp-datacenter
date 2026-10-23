/**
 * P-10 Waterfall — batang mengambang dari awal ke akhir (Tabel 8.1).
 *
 * Acuan: pustakachart `v91_waterfall` (PC:1175-1194, PENUH): titik pertama = awal dari
 * nol, sisanya selisih yang mengambang di atas kumulatif, batang TOTAL dihitung di ujung.
 * - Mode eksplisit (spec galeri S94): `points[].sub` = "total" | "subtotal" | "delta";
 *   batang total selalu dari nol; total yang tidak sama dengan kumulatif dilaporkan REPORT
 *   `chart.kind.P-10.total` lalu kumulatif disetel ke nilai total.
 * - Mode implisit (PC): `endsGroundedAtZero` (default benar) = titik pertama total dari nol
 *   dan batang "TOTAL" kumulatif ditambahkan; salah = semua batang selisih, tanpa TOTAL.
 * - `signedDeltaLabels` (default benar): label selisih bertanda ("+18", "-16").
 * Warna: total ink700 (awal implisit ink900, PC), turun peran limitExceeded (alert), aksen
 * peran accent. Batang naik: gaya `datum` = token signal seperti PC:1178 (S79 E3, IP-41a);
 * bila ada batang beraksen eksplisit, naik memakai peran improving (verd) agar aksen tetap
 * satu subjek (P7-06, Tabel 7.5). Batang naik signal membawa `data-rule="sign"` (warna aturan
 * tanda, seperti P-15; bukan subjek aksen lint 26). Gaya `gallery` = improving (verd), sama
 * dengan panel galeri.
 * Fon gaya `datum` minimal 6,5 pt (label kategori dan nilai) = ukuran tick `style_ax` PC:136
 * (S79 E1); gaya `gallery` mengikuti ukuran panel galeri.
 * Garis dasar nol selalu digambar (CH-01).
 */
import type { ChartCanvas, ResolvedTemplate, StudioChartV1, SvgResult } from "../../../contract";
import { fmt } from "../../bind";
import { figureLabel, requireCategorical } from "../core/guards";
import { kindKey } from "../core/palette";
import { decimalsFor, linearScale, niceDomain } from "../core/scale";
import { escAttr, num, ptToMm, textWidthMm } from "../core/svg";
import {
  accentHint,
  assertAccentCount,
  axisStroke,
  beginP2,
  finishP2,
  gridLines,
  hintMatches,
  kindBool,
  reportIssue,
  tickFont,
  yAxis,
} from "./common";

const CODE = "P-10" as const;

interface Step {
  label: string;
  kind: "total" | "delta";
  value: number;
  from: number;
  to: number;
  accent: boolean;
  /** Total awal implisit (PC: INK900). */
  start: boolean;
}

export function renderWaterfall(spec: StudioChartV1, canvas: ChartCanvas, tpl: ResolvedTemplate): SvgResult {
  const ctx = beginP2(spec, canvas, tpl, CODE);
  const { pal, doc, style, W, H } = ctx;
  const pts = requireCategorical(spec, CODE, ctx.maxAccent);
  const ah = accentHint(spec, CODE);
  const grounded = kindBool(spec, tpl, CODE, "endsGroundedAtZero", true);
  const signed = kindBool(spec, tpl, CODE, "signedDeltaLabels", true);
  const dec = spec.dec ?? 0;
  const unit = spec.unit ?? "";
  const tol = 0.5 * Math.pow(10, -dec);

  const isTotal = (s?: string): boolean => s !== undefined && /^(sub)?total$/i.test(s.trim());
  const explicit = pts.some((p) => p.sub !== undefined && /^((sub)?total|delta)$/i.test(p.sub.trim()));
  const steps: Step[] = [];
  let cum = 0;
  pts.forEach((p, i) => {
    const acc = p.accent || hintMatches(ah.point, p.label, i);
    const total = explicit ? isTotal(p.sub) : grounded && i === 0;
    if (total) {
      if (explicit && i > 0 && Math.abs(cum - p.value) > tol) {
        reportIssue(ctx, kindKey(CODE, "total"), `${figureLabel(spec)} — total "${p.label}" ${fmt(p.value, dec)} tidak sama dengan kumulatif ${fmt(cum, dec)}`);
      }
      steps.push({ label: p.label, kind: "total", value: p.value, from: 0, to: p.value, accent: acc, start: !explicit });
      cum = p.value;
    } else {
      steps.push({ label: p.label, kind: "delta", value: p.value, from: cum, to: cum + p.value, accent: acc, start: false });
      cum += p.value;
    }
  });
  if (!explicit && grounded) steps.push({ label: "TOTAL", kind: "total", value: cum, from: 0, to: cum, accent: false, start: false });
  assertAccentCount(spec, CODE, steps.filter((s) => s.accent).length, ctx.maxAccent, "batang");

  const dom = niceDomain(steps.flatMap((s) => [s.from, s.to]), { zero: true });
  const series = unit || "nilai";
  const VAL = ctx.pt(style === "gallery" ? 6.4 : 6.5);
  const LBL = ctx.pt(style === "gallery" ? 6.4 : 6.5);
  const tf = tickFont(ctx);
  const tdec = decimalsFor(dom.step);
  const labelOf = (s: Step): string =>
    s.kind === "delta" && signed && s.value > 0 ? `+${fmt(s.value, dec)}` : fmt(s.value, dec);

  // Tata letak: galeri tanpa sumbu y; datum sumbu y bertick + kisi + label satuan (PC).
  const tickW = style === "datum" ? Math.max(...dom.ticks.map((t) => textWidthMm(fmt(t, tdec), tf.sizePt, tf.face))) : 0;
  const unitBand = style === "datum" && unit ? ptToMm(ctx.pt(6.8)) + 1.2 : 0;
  const left = style === "datum" ? unitBand + tickW + 1.6 : 0.5;
  const right = W - 0.5;
  const longest = Math.max(...steps.map((s) => textWidthMm(s.label, LBL)));
  const labelBand = style === "datum" ? Math.min(14, longest * Math.sin((15 * Math.PI) / 180) + 4.2) : 4.8;
  const top = 3.6;
  const bottom = H - ctx.footBand - labelBand;
  const sy = linearScale(dom.min, dom.max, bottom, top);
  const n = steps.length;
  const stepW = (right - left) / n;
  const cw = Math.min(stepW * 0.55, 14);

  if (style === "datum") {
    gridLines(ctx, false, dom.ticks.map(sy), left, right);
    yAxis(ctx, { at: left, from: top, to: bottom, scale: sy, ticks: dom.ticks, label: (v) => fmt(v, tdec) });
    if (unit) {
      const yc = (top + bottom) / 2;
      const x = ptToMm(ctx.pt(6.8));
      doc.text(x, yc, unit, { sizePt: ctx.pt(6.8), fill: pal.ink700, anchor: "middle", attrs: ` transform="rotate(-90 ${num(x)} ${num(yc)})"` });
    }
  }

  // Batang naik (S79 E3): datum tanpa aksen eksplisit = signal (PC:1178), selain itu improving.
  const rise = style === "datum" && !steps.some((s) => s.accent) ? pal.signal : pal.role.improving;
  steps.forEach((s, i) => {
    const cx = left + stepW * (i + 0.5);
    const yTop = sy(Math.max(s.from, s.to));
    const yBot = sy(Math.min(s.from, s.to));
    const dir = s.kind === "total" ? "total" : s.value >= 0 ? "up" : "down";
    const fill = s.accent
      ? pal.role.accent
      : s.kind === "total"
        ? s.start
          ? pal.ink900
          : pal.ink700
        : s.value >= 0
          ? rise
          : pal.role.limitExceeded;
    // Warna naik signal = aturan tanda nilai, bukan subjek aksen (lint 26 melewati `data-rule`).
    const rule = fill === pal.signal && !s.accent ? ' data-rule="sign"' : "";
    doc.rect(cx - cw / 2, yTop, cw, yBot - yTop, fill, {
      mark: { mark: "column", series, index: i },
      attrs: ` data-step="${dir}" data-category="${escAttr(s.label)}"${rule}`,
    });
    doc.text(cx, yTop - 1.0, labelOf(s), { face: "data", sizePt: VAL, fill: pal.ink900, anchor: "middle", attrs: ' data-label="value"' });
    if (style === "gallery") {
      doc.text(cx, bottom + 3.6, s.label, { sizePt: LBL, fill: pal.ink400, anchor: "middle" });
    } else {
      const y = bottom + 3.0;
      doc.text(cx + cw / 2, y, s.label, { sizePt: LBL, fill: pal.ink700, anchor: "end", attrs: ` transform="rotate(-15 ${num(cx + cw / 2)} ${num(y)})"` });
    }
  });

  // Garis dasar nol (PC: axhline ink400; galeri: sumbu hitam).
  const st = axisStroke(ctx);
  doc.open('data-axis="x"');
  doc.line(left, sy(0), right, sy(0), st.color, st.width, { attrs: ' data-zero="1"' });
  doc.close();
  if (unit && style === "gallery") doc.text(right, 2.4, unit, { sizePt: ctx.pt(6.0), fill: pal.ink400, anchor: "end" });
  return finishP2(ctx);
}
