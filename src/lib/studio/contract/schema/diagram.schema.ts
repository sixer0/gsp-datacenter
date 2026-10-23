/**
 * JSON Schema 2020-12 `studio.diagram/v1` (01_specs.md §3.6, §3.10).
 * Bentuk = SPEC_FIELDS Garis A; aturan isi (id memuat `\d+\.\d+`, judul
 * diakhiri titik, rujukan edge ke simpul ada, tolak Mermaid DATUM-31) ditegakkan
 * `validateSpec`/`loadSpec` (I16), bukan skema.
 */
import { DIAGRAM_EDGE_KINDS, DIAGRAM_FAMILIES, DIAGRAM_SHAPES, PROVENANCE_MARKS } from "../enums";
import { JSON_SCHEMA_DIALECT, STUDIO_SCHEMA_URL_BASE } from "./common.schema";

export const DIAGRAM_SCHEMA_ID = `${STUDIO_SCHEMA_URL_BASE}/studio.diagram/v1.json`;

const str = { type: "string", minLength: 1, maxLength: 300 } as const;
const strList = { type: "array", items: { type: "string", maxLength: 1000 } } as const;

export const diagramSchema = {
  $schema: JSON_SCHEMA_DIALECT,
  $id: DIAGRAM_SCHEMA_ID,
  title: "studio.diagram/v1",
  type: "object",
  properties: {
    $schema: { const: "studio.diagram/v1" },
    family: { enum: [...DIAGRAM_FAMILIES] },
    id: { type: "string", minLength: 1, maxLength: 64 },
    title: str,
    classification: { type: "string", minLength: 1, maxLength: 64 },
    // D-245 H1: lebar sah = turunan kertas (A4 128/166); keanggotaan ditegakkan mesin diagram (P1-width_mm).
    width_mm: { type: "number", exclusiveMinimum: 0 },
    apparatus: { enum: ["page", "figure"] },
    labels_verified: { type: "boolean" },
    sources: { type: "array", minItems: 1, items: { type: "string", minLength: 1, maxLength: 1000 } },
    source: { type: "string", maxLength: 1000 },
    nodes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1, maxLength: 64 },
          label: str,
          sub: { type: "string", maxLength: 300 },
          shape: { enum: [...DIAGRAM_SHAPES] },
          mark: { enum: [...PROVENANCE_MARKS] },
          tag: { type: "string", maxLength: 64 },
          u: { type: "number", minimum: 0 },
          external: { type: "boolean" },
          class: {
            type: "object",
            properties: {
              tier: { type: "integer", minimum: 0 },
              lane: { type: ["integer", "string"] },
              col: { type: "integer", minimum: 0 },
              row: { type: "integer", minimum: 0 },
              accent: { type: "boolean" },
              secondary: { type: "boolean" },
              external: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
        required: ["id", "label", "class"],
        additionalProperties: false,
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string", minLength: 1, maxLength: 64 },
          to: { type: "string", minLength: 1, maxLength: 64 },
          kind: { enum: [...DIAGRAM_EDGE_KINDS] },
          label: { type: "string", maxLength: 300 },
        },
        required: ["from", "to", "kind", "label"],
        additionalProperties: false,
      },
    },
    zones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1, maxLength: 64 },
          label: str,
          members: { type: "array", items: { type: "string", minLength: 1, maxLength: 64 } },
        },
        required: ["id", "label", "members"],
        additionalProperties: false,
      },
    },
    legend: strList,
    notes: strList,
    per_row: { type: "integer", minimum: 1, maximum: 20 },
    // Delta S03-d2 (D-89): opt-in multi-rel layout-c; aditif.
    sld: {
      type: "object",
      properties: { multiBus: { type: "boolean" } },
      additionalProperties: false,
    },
    // INTERNAL compose (D-288): diisi `services/compose/blocks.ts`, bukan medan agen.
    // `not: {}` = selalu ditolak pada masukan agen (artefak v1, dokumen v1); spec
    // terkomposisi tidak divalidasi ulang di jalur render.
    keyRowOnPage: { not: {}, description: "INTERNAL compose: not an agent field; always rejected on agent input" },
  },
  required: ["$schema", "family", "id", "title", "classification", "width_mm", "sources", "nodes"],
  additionalProperties: false,
} as const;
