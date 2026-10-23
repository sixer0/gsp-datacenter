/**
 * JSON Schema 2020-12 `studio.chart/v1` (01_specs.md §3.5, §3.10).
 * `data` wajib bila kind != "composite"; `composite` wajib bila kind = "composite".
 * Kode drawn=false lolos skema dan ditolak renderer (422 CHART_KIND_NOT_DRAWN).
 */
import { CHART_CODES } from "../enums";
import { commonRef, JSON_SCHEMA_DIALECT, STUDIO_SCHEMA_URL_BASE } from "./common.schema";
import { DIAGRAM_SCHEMA_ID } from "./diagram.schema";

export const CHART_SCHEMA_ID = `${STUDIO_SCHEMA_URL_BASE}/studio.chart/v1.json`;

function chartRef(def: string): { $ref: string } {
  return { $ref: `${CHART_SCHEMA_ID}#/$defs/${def}` };
}

const str = { type: "string", minLength: 1, maxLength: 200 } as const;
const num = { type: "number" } as const;
const bool = { type: "boolean" } as const;

function obj(properties: Record<string, unknown>, required: readonly string[]) {
  return { type: "object", properties, required: [...required], additionalProperties: false } as const;
}

function shapeVariant(shape: string, properties: Record<string, unknown>, required: readonly string[]) {
  return obj({ shape: { const: shape }, ...properties }, ["shape", ...required]);
}

/** Properti yang dipakai bersama spec penuh dan panel komposit. */
const CHART_COMMON_PROPERTIES = {
  id: { type: "string", maxLength: 64 },
  // D-271: batas atas = blok teks turunan kertas (`grid.textBlockHeightMm`), ditegakkan gerbang by-construction (DATUM-33).
  heightMm: { type: "number", exclusiveMinimum: 0 },
  unit: { type: "string", maxLength: 40 },
  dec: { enum: [0, 1, 2, 3] },
  apparatus: { enum: ["page", "figure"] },
  inDocument: bool,
  note: { type: "string", maxLength: 2000 },
  data: chartRef("ChartData"),
  params: { type: "object", additionalProperties: commonRef("ParamValue") },
  style: { enum: ["datum", "gallery"] },
  limit: num,
  limitLabel: { type: "string", maxLength: 200 },
  /** Delta S03-d1 (D-58); alias `params.accentPoint`/`accentGroup`/`accentSeries`. */
  accent: {
    type: "object",
    properties: { point: { type: ["string", "number"] }, group: str, series: str },
    minProperties: 1,
    additionalProperties: false,
  },
  /** Delta IP-41d (D-113): metadata tak-tergambar (asal transkripsi, catatan, seriesNames: ASUMSI); renderer mengabaikan. */
  x: { type: "object", additionalProperties: true },
} as const;

export const chartSchema = {
  $schema: JSON_SCHEMA_DIALECT,
  $id: CHART_SCHEMA_ID,
  title: "studio.chart/v1",
  type: "object",
  properties: {
    $schema: { const: "studio.chart/v1" },
    kind: { enum: [...CHART_CODES, "composite"] },
    title: { type: "string", minLength: 1, maxLength: 300 },
    source: { type: "string", minLength: 1, maxLength: 1000 },
    // D-245 H1: lebar sah = turunan kertas (A4 128/166); keanggotaan ditegakkan mesin chart (G2).
    widthMm: { type: "number", exclusiveMinimum: 0 },
    ...CHART_COMMON_PROPERTIES,
    composite: chartRef("ChartComposite"),
  },
  required: ["$schema", "kind", "title", "source", "widthMm"],
  additionalProperties: false,
  if: { properties: { kind: { const: "composite" } }, required: ["kind"] },
  then: { properties: { composite: true }, required: ["composite"] },
  else: { properties: { data: true }, required: ["data"] },
  $defs: {
    ChartData: {
      type: "object",
      properties: { shape: { type: "string" } },
      required: ["shape"],
      discriminator: { propertyName: "shape" },
      oneOf: [
        shapeVariant(
          "categorical",
          {
            points: {
              type: "array",
              minItems: 1,
              items: obj({ label: str, value: num, accent: bool, sub: { type: "string", maxLength: 200 } }, ["label", "value"]),
            },
          },
          ["points"],
        ),
        shapeVariant(
          "series",
          {
            categories: { type: "array", minItems: 1, items: str },
            series: {
              type: "array",
              minItems: 1,
              items: obj(
                { name: str, values: { type: "array", items: { type: ["number", "null"] } }, accent: bool },
                ["name", "values"],
              ),
            },
          },
          ["categories", "series"],
        ),
        shapeVariant(
          "xy",
          {
            points: {
              type: "array",
              minItems: 1,
              items: obj(
                { x: num, y: num, size: num, label: { type: "string", maxLength: 200 }, group: str, accent: bool },
                ["x", "y"],
              ),
            },
          },
          ["points"],
        ),
        shapeVariant(
          "matrix",
          {
            rows: { type: "array", minItems: 1, items: str },
            cols: { type: "array", minItems: 1, items: str },
            values: { type: "array", items: { type: "array", items: num } },
          },
          ["rows", "cols", "values"],
        ),
        shapeVariant(
          "intervals",
          {
            items: {
              type: "array",
              minItems: 1,
              items: obj(
                {
                  label: str,
                  start: { type: ["number", "string"] },
                  end: { type: ["number", "string"] },
                  group: str,
                  milestone: bool,
                },
                ["label", "start", "end"],
              ),
            },
          },
          ["items"],
        ),
        shapeVariant(
          "graph",
          {
            nodes: {
              type: "array",
              minItems: 1,
              items: obj({ id: str, label: str, value: num, group: str }, ["id", "label"]),
            },
            links: { type: "array", items: obj({ from: str, to: str, value: num }, ["from", "to"]) },
          },
          ["nodes", "links"],
        ),
        shapeVariant(
          "distribution",
          {
            groups: {
              type: "array",
              minItems: 1,
              items: obj({ name: str, values: { type: "array", items: num } }, ["name", "values"]),
            },
          },
          ["groups"],
        ),
        shapeVariant(
          "tiles",
          {
            tiles: {
              type: "array",
              minItems: 1,
              items: obj(
                { code: str, row: { type: "integer" }, col: { type: "integer" }, value: num, label: str },
                ["code", "row", "col"],
              ),
            },
            flows: { type: "array", items: obj({ from: str, to: str, value: num }, ["from", "to", "value"]) },
            dots: { type: "array", items: obj({ tile: str, dx: num, dy: num, label: str }, ["tile"]) },
          },
          ["tiles"],
        ),
        shapeVariant(
          "ohlc",
          {
            points: {
              type: "array",
              minItems: 1,
              items: obj({ t: str, o: num, h: num, l: num, c: num }, ["t", "o", "h", "l", "c"]),
            },
          },
          ["points"],
        ),
        shapeVariant(
          "sets",
          {
            sets: { type: "array", minItems: 1, items: obj({ name: str, size: num }, ["name", "size"]) },
            overlaps: {
              type: "array",
              items: obj({ sets: { type: "array", minItems: 2, items: str }, size: num }, ["sets", "size"]),
            },
          },
          ["sets", "overlaps"],
        ),
        shapeVariant("steps", { spec: { $ref: DIAGRAM_SCHEMA_ID } }, ["spec"]),
      ],
    },
    ChartPanelSpec: {
      type: "object",
      properties: { kind: { enum: [...CHART_CODES] }, ...CHART_COMMON_PROPERTIES },
      required: ["kind"],
      additionalProperties: false,
    },
    ChartComposite: {
      type: "object",
      properties: {
        columns: { enum: [1, 2, 3] },
        gapMm: { type: "number", minimum: 0, maximum: 50 },
        panels: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              name: str,
              code: { enum: [...CHART_CODES] },
              caption: { type: "string", maxLength: 300 },
              axisNote: { type: "string", maxLength: 200 },
              spec: chartRef("ChartPanelSpec"),
            },
            required: ["name", "code", "spec"],
            additionalProperties: false,
          },
        },
      },
      required: ["columns", "panels"],
      additionalProperties: false,
    },
  },
} as const;
