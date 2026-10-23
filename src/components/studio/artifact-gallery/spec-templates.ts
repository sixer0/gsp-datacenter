/*
 * Templat JSON awal per jenis artefak (S62). Bentuk mengikuti kontrak §3.5-3.8
 * (`studio.chart/v1`, `studio.diagram/v1`, `studio.image/v1`, `studio.html/v1`);
 * contoh data chart dipilih dari `ChartDef.dataShape` registri. Nilai contoh
 * hanya ilustrasi dan harus diganti pengguna.
 */

import type { DiagramFamily } from "@/lib/studio/contract/enums";
import type { ChartData, ChartDataShape, StudioChartV1 } from "@/lib/studio/contract/types/chart";
import type { DiagramNode, StudioDiagramV1 } from "@/lib/studio/contract/types/diagram";
import type { StudioHtmlV1 } from "@/lib/studio/contract/types/html";
import type { StudioImageV1 } from "@/lib/studio/contract/types/image";
import type { ChartDef } from "@/lib/studio/contract/types/params";

/** Penanda sha256 yang diganti otomatis saat berkas gambar dipilih. */
export const SHA_PLACEHOLDER = "isi-otomatis-saat-berkas-dipilih";

const flowSpec = (): StudioDiagramV1 => ({
  $schema: "studio.diagram/v1",
  family: "flow",
  id: "Gambar 1.1",
  title: "Alur persetujuan contoh.",
  classification: "TERBATAS",
  width_mm: 166,
  sources: ["Sumber: prosedur contoh tim analis."],
  nodes: [
    { id: "n1", label: "Ajukan", class: { col: 0 } },
    { id: "n2", label: "Tinjau", shape: "diamond", class: { col: 1 } },
    { id: "n3", label: "Setujui", class: { col: 2, accent: true } },
  ],
  edges: [
    { from: "n1", to: "n2", kind: "control", label: "kirim" },
    { from: "n2", to: "n3", kind: "control", label: "lolos" },
  ],
});

export function exampleData(shape: ChartDataShape): ChartData {
  switch (shape) {
    case "categorical":
      return {
        shape,
        points: [
          { label: "Jakarta", value: 42 },
          { label: "Surabaya", value: 35, accent: true },
          { label: "Bandung", value: 28 },
          { label: "Medan", value: 21 },
          { label: "Makassar", value: 17 },
        ],
      };
    case "series":
      return {
        shape,
        categories: ["2022", "2023", "2024", "2025"],
        series: [
          { name: "Pendapatan", values: [120, 135, 150, 172], accent: true },
          { name: "Biaya", values: [96, 104, 111, 120] },
        ],
      };
    case "xy":
      return {
        shape,
        points: [
          { x: 1.2, y: 14, size: 3, group: "A" },
          { x: 2.4, y: 19, size: 5, group: "A" },
          { x: 3.1, y: 23, size: 2, group: "B" },
          { x: 4.0, y: 31, size: 6, group: "B", accent: true },
          { x: 5.6, y: 35, size: 4, group: "B" },
        ],
      };
    case "matrix":
      return {
        shape,
        rows: ["Wilayah 1", "Wilayah 2", "Wilayah 3"],
        cols: ["T1", "T2", "T3", "T4"],
        values: [
          [12, 15, 18, 20],
          [8, 9, 14, 16],
          [5, 7, 6, 11],
        ],
      };
    case "intervals":
      return {
        shape,
        items: [
          { label: "Desain", start: "2026-01-05", end: "2026-02-13", group: "Fase 1" },
          { label: "Pengadaan", start: "2026-02-02", end: "2026-04-10", group: "Fase 1" },
          { label: "Instalasi", start: "2026-04-13", end: "2026-06-26", group: "Fase 2" },
          { label: "Serah terima", start: "2026-06-30", end: "2026-06-30", milestone: true },
        ],
      };
    case "graph":
      return {
        shape,
        nodes: [
          { id: "a", label: "Pemasok", value: 40 },
          { id: "b", label: "Gudang", value: 35 },
          { id: "c", label: "Proyek A", value: 20 },
          { id: "d", label: "Proyek B", value: 15 },
        ],
        links: [
          { from: "a", to: "b", value: 35 },
          { from: "b", to: "c", value: 20 },
          { from: "b", to: "d", value: 15 },
        ],
      };
    case "distribution":
      return {
        shape,
        groups: [
          { name: "Tim A", values: [12, 14, 15, 15, 17, 18, 21, 24] },
          { name: "Tim B", values: [9, 11, 13, 16, 16, 19, 20, 22] },
          { name: "Tim C", values: [14, 15, 16, 18, 19, 19, 23, 27] },
        ],
      };
    case "tiles":
      return {
        shape,
        tiles: [
          { code: "JK", row: 0, col: 1, value: 42, label: "DKI Jakarta" },
          { code: "JB", row: 0, col: 2, value: 31, label: "Jawa Barat" },
          { code: "JT", row: 1, col: 2, value: 24, label: "Jawa Tengah" },
          { code: "JI", row: 1, col: 3, value: 28, label: "Jawa Timur" },
        ],
      };
    case "ohlc":
      return {
        shape,
        points: [
          { t: "2026-03-02", o: 100, h: 106, l: 98, c: 104 },
          { t: "2026-03-03", o: 104, h: 108, l: 101, c: 102 },
          { t: "2026-03-04", o: 102, h: 105, l: 97, c: 99 },
          { t: "2026-03-05", o: 99, h: 103, l: 96, c: 103 },
        ],
      };
    case "sets":
      return {
        shape,
        sets: [
          { name: "Pelanggan A", size: 120 },
          { name: "Pelanggan B", size: 90 },
        ],
        overlaps: [{ sets: ["Pelanggan A", "Pelanggan B"], size: 35 }],
      };
    case "steps":
      return { shape, spec: flowSpec() };
  }
}

export function chartTemplate(def: ChartDef): StudioChartV1 {
  const shape: ChartDataShape = def.dataShape ?? "categorical";
  return {
    $schema: "studio.chart/v1",
    kind: def.code,
    id: "Gambar 1.1",
    title: `${def.name} data contoh.`,
    source: "Sumber: data contoh tim analis.",
    widthMm: 166,
    unit: "unit",
    dec: 0,
    data: exampleData(shape),
  };
}

function diagramNodes(family: DiagramFamily): DiagramNode[] {
  switch (family) {
    case "swimlane":
      return [
        { id: "n1", label: "Terima order", class: { lane: "Penjualan", col: 0 } },
        { id: "n2", label: "Cek stok", class: { lane: "Gudang", col: 1 } },
        { id: "n3", label: "Kirim", class: { lane: "Gudang", col: 2, accent: true } },
      ];
    case "rack":
      return [
        { id: "n1", label: "Switch inti", u: 1, class: { row: 42 } },
        { id: "n2", label: "Server aplikasi", u: 2, class: { row: 38 } },
        { id: "n3", label: "UPS", u: 3, class: { row: 4, accent: true } },
      ];
    case "graph":
    case "sequence":
      return [
        { id: "n1", label: "Klien", class: { col: 0, row: 0 } },
        { id: "n2", label: "Gerbang API", class: { col: 1, row: 0, accent: true } },
        { id: "n3", label: "Basis data", shape: "cylinder", class: { col: 2, row: 0 } },
      ];
    case "flow":
      return flowSpec().nodes;
    default:
      return [
        { id: "n1", label: "Lapisan aplikasi", class: { tier: 0 } },
        { id: "n2", label: "Lapisan layanan", class: { tier: 1, accent: true } },
        { id: "n3", label: "Lapisan data", shape: "cylinder", class: { tier: 2 } },
      ];
  }
}

export function diagramTemplate(family: DiagramFamily): StudioDiagramV1 {
  return {
    $schema: "studio.diagram/v1",
    family,
    id: "Gambar 1.1",
    title: "Arsitektur contoh.",
    classification: "TERBATAS",
    width_mm: 166,
    sources: ["Sumber: dokumentasi contoh tim analis."],
    nodes: diagramNodes(family),
    edges: [
      { from: "n1", to: "n2", kind: "data", label: "permintaan" },
      { from: "n2", to: "n3", kind: "data", label: "kueri" },
    ],
  };
}

export function imageTemplate(): StudioImageV1 {
  return {
    $schema: "studio.image/v1",
    id: "Gambar 1.1",
    title: "Foto lokasi contoh.",
    source: "Sumber: dokumentasi lapangan tim.",
    asset: { kind: "raster", mime: "image/png", sha256: SHA_PLACEHOLDER },
    widthMm: 166,
    dpiMin: 150,
  };
}

export function htmlTemplate(slug = ""): StudioHtmlV1 {
  return {
    $schema: "studio.html/v1",
    template: { slug },
    source: { kind: "document", documentId: "" },
    options: { paged: true, embedFonts: true, previewLabel: true },
  };
}

export const pretty = (v: unknown) => JSON.stringify(v, null, 2);
