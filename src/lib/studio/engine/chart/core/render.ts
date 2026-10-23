/**
 * engine/chart/core — `renderChart` (I22): titik masuk render chart tunggal dan komposit.
 *
 * Alur: komposit -> renderComposite; kode tak dikenal -> CHART_KIND_UNKNOWN; drawn=false
 * -> CHART_KIND_NOT_DRAWN (+ alternatives); penjaga spec (G2, N1, 10, 36, 30, 33);
 * renderer dari CHART_RENDERERS (dibaca di badan fungsi); kanvas mm selebar spec (anggota
 * himpunan lebar figur turunan templat, `figureLimits`; A4 = 128/166) dengan tinggi
 * taksiran <= blok teks turunan; lint keluaran digabung ke `report`. Deterministik:
 * masukan sama -> SVG sama.
 *
 * Kunci `params` diselesaikan SATU resolver (`./params`, IP-25/D-87) sebelum tinggi dan
 * renderer: alias pendek sah -> kunci penuh (REPORT PARAM_ALIAS), lainnya PARAM_IGNORED.
 */
import type { ResolvedTemplate, StudioChartV1, SvgResult } from "../../../contract";
import { FIGURE_APPARATUS_BAND_MM } from "./apparatus";
import { chartCanvas, finalizeChart } from "./canvas";
import { EMPTY_CHART_TEMPLATE, compositeHeightMm, renderComposite } from "./composite";
import { coreHeightMm, isCoreCode } from "./families";
import { assertChartSpec, defect, figureLabel, figureLimits } from "./guards";
import { referenceHeightMm } from "./heights";
import { chartRendererFor, drawnChartDef } from "./lookup";
import { resolveChartParams, runChartRenderer } from "./params";

/** Rasio tinggi bawaan keluarga tanpa `heightMm` (mm per mm lebar). */
export const DEFAULT_HEIGHT_RATIO = 0.5;

/**
 * Tinggi kanvas (mm) yang akan dipakai renderChart. Komposit: tata letak kisi; inti:
 * taksiran DC; keluarga lain: `spec.heightMm`, lalu tinggi acuan kode
 * (`CHART_REFERENCE_HEIGHT_MM`, paritas CB1 (d)), lalu lebar x 0,5; ditambah pita
 * aparatus figure bila tinggi tidak diset spec.
 */
export function estimateHeightMm(spec: StudioChartV1): number {
  if (spec.kind === "composite") return compositeHeightMm(spec);
  if (isCoreCode(spec.kind)) return coreHeightMm(spec, spec.kind);
  if (spec.heightMm !== undefined) return spec.heightMm;
  const base = referenceHeightMm(spec.kind) ?? Math.round(spec.widthMm * DEFAULT_HEIGHT_RATIO * 10) / 10;
  return base + (spec.apparatus === "figure" ? FIGURE_APPARATUS_BAND_MM : 0);
}

export function renderChart(input: StudioChartV1, tpl: ResolvedTemplate = EMPTY_CHART_TEMPLATE): SvgResult {
  if (input.kind === "composite") return renderComposite(input, tpl);
  const def = drawnChartDef(input.kind);
  const limits = figureLimits(tpl.params);
  assertChartSpec(input, limits);
  const renderer = chartRendererFor(def);
  const resolved = resolveChartParams(input, def.code);
  const spec = resolved.spec;
  const h = estimateHeightMm(spec);
  if (h > limits.maxHeightMm + 1e-9) {
    throw defect(
      "DATUM-33",
      `${figureLabel(spec)} — perkiraan tinggi ${h.toFixed(0)} mm melampaui blok teks ${limits.maxHeightMm} mm; pisah gambarnya atau kurangi kategorinya`,
      { heightMm: h, maxHeightMm: limits.maxHeightMm },
    );
  }
  const res = runChartRenderer(renderer, resolved, chartCanvas(spec.widthMm, h, limits), tpl);
  return finalizeChart(res, spec, tpl);
}
