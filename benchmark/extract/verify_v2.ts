/**
 * SR-32 data guard for the v2 benchmark inputs (no DB, no render; read-only).
 *
 *   G1 doc.v2.json valid against studio.doc/v2 (contract ajv, STUDIO_SCHEMA_LOAD_ORDER + STUDIO_AJV_OPTIONS), issues
 *      classified with classifySchemaV2Errors (DISPLAY_FIELD / V1_FIELD = 0); key scan for C29 display-field names.
 *   G2 template.v2.json valid against studio.template/v2; loadResolvedTemplateV2File resolves the preset file
 *      datum-manual-000.preset.json; skeleton = 6 slots (no references), toc MIXED; template advanced = 0.
 *   G3 JSON text conservation: every inline text of doc.json (machine labels excluded: caption label/separator, section
 *      number, kicker, rail label, part label, toc kicker/title/note, apparatus label run) appears in doc.v2.json in the
 *      same order per region (front regions compared as multisets). Rendered S96 units (4544) are compared by
 *      benchmark/extract/units_v2.py on DOCX renders.
 *   G4 effective values: template.v2.json (SR-07 loader -> SR-60 deriveLayered; per slot via SR-06
 *      resolveSkeletonSlots with layers) vs the KT-5 baseline built like the SR-36 guard (template.json via
 *      loadResolvedProfileFile + stated values of now class-T overrides) projected on the LEGACY keys (registry minus
 *      the 21 structure keys plus grid.marginBottomMm, research/09 §8.2): sha of the projection; diff keys must equal
 *      the preset's meta.intendedDelta; roleFormats differ only by rail.mark.labelRunByMark.
 *
 * Usage: npx tsx --tsconfig tsconfig.json benchmark/extract/verify_v2.ts [--json <out.json>]
 * Exit: 0 all guards pass, 1 a guard failed, 2 input error.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { STUDIO_AJV_OPTIONS, STUDIO_SCHEMA_LOAD_ORDER, type ResolvedTemplate } from "../../src/lib/studio/contract";
import { DOC_V2_SCHEMA_ID } from "../../src/lib/studio/contract/schema/v2/doc.schema";
import { TEMPLATE_V2_SCHEMA_ID } from "../../src/lib/studio/contract/schema/v2/template.schema";
import { classifySchemaV2Errors, DISPLAY_FIELDS_GLOBAL } from "../../src/lib/studio/contract/schema/v2/forbidden";
import { sha256Hex, stableStringify } from "../../src/lib/studio/services/ingest/util";
import { loadResolvedProfileFile, loadResolvedTemplateV2File, readTemplateProfileFile } from "../../src/lib/studio/services/templates/import";
import { templateLayerOf } from "../../src/lib/studio/services/templates/v2";
import { resolveSkeletonSlots } from "../../src/lib/studio/services/skeleton/pure";
import { ALL_PARAMS, PARAMS_STRUCTURE } from "../../src/lib/studio/params";

const REPO = path.resolve(__dirname, "..", "..");
const DIR = path.join(REPO, "benchmark", "manual000");
const F = {
  docV1: path.join(DIR, "doc.json"),
  docV2: path.join(DIR, "doc.v2.json"),
  tplV1: path.join(DIR, "template.json"),
  tplV2: path.join(DIR, "template.v2.json"),
  preset: path.join(DIR, "datum-manual-000.preset.json"),
};

/** Intended differences on LEGACY keys = preset `meta.intendedDelta` (key + reason + BM evidence, convert_v2.ts). */
function intendedDelta(): string[] {
  const meta = (readJson(F.preset) as Obj).meta;
  const list = isObj(meta) && Array.isArray(meta.intendedDelta) ? meta.intendedDelta : [];
  return list.map((d) => (isObj(d) ? String(d.key) : "")).filter(Boolean).sort();
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

interface Guard {
  id: string;
  pass: boolean;
  detail: Record<string, unknown>;
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
}

// ── G1/G2 schema ─────────────────────────────────────────────────────────

function ajv(): Ajv2020 {
  const a = new Ajv2020({ ...STUDIO_AJV_OPTIONS });
  for (const s of STUDIO_SCHEMA_LOAD_ORDER) a.addSchema(s as object);
  return a;
}

function displayKeyScan(root: unknown): Record<string, number> {
  const names = new Set<string>(DISPLAY_FIELDS_GLOBAL);
  const hits: Record<string, number> = {};
  const walk = (o: unknown, inX: boolean): void => {
    if (Array.isArray(o)) o.forEach((x) => walk(x, inX));
    else if (isObj(o)) {
      for (const [k, v] of Object.entries(o)) {
        // `x` (AD-16, trust gate) and diagram/chart data payloads are data, not display fields.
        const skip = inX || k === "x" || k === "spec" || k === "data";
        if (!skip && names.has(k)) hits[k] = (hits[k] ?? 0) + 1;
        walk(v, skip);
      }
    }
  };
  walk(root, false);
  return hits;
}

// ── G3 text conservation ─────────────────────────────────────────────────

const norm = (s: string): string => s.replace(/\s+/g, " ").trim();

function runText(runs: unknown[]): string {
  return runs
    .map((r) => (isObj(r) ? (typeof r.t === "string" ? r.t : "tab" in r ? "\t" : "br" in r ? "\n" : "") : ""))
    .join("");
}

/** v1 -> v2 field renames (register §14.2/§14.3) used only to order object keys alike on both sides. */
const SORT_NAME: Readonly<Record<string, string>> = { runningHeadTitle: "shortTitle", kicker: "tagline" };

/**
 * Inline texts: arrays in order, object keys in (renamed) alphabetical order so that v1 and v2 serialisations with
 * a different key order compare alike. `skip(key, parent)` excludes machine labels / display data.
 */
function texts(root: unknown, skip: (key: string, parent: Obj) => boolean): string[] {
  const out: string[] = [];
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (isObj(o)) {
      if (Array.isArray(o.runs)) {
        const t = norm(runText(o.runs));
        if (t) out.push(t);
      } else if (typeof o.text === "string") {
        const t = norm(o.text);
        if (t) out.push(t);
      }
      const keys = Object.keys(o).sort((a, b) => (SORT_NAME[a] ?? a).localeCompare(SORT_NAME[b] ?? b));
      for (const k of keys) {
        if (k === "runs" || k === "text" || k === "x") continue;
        if (skip(k, o)) continue;
        walk(o[k]);
      }
    }
  };
  walk(root);
  return out;
}

const LABEL_RE = /^(SUMBER|KUNCI)$/;

/** v1: drop the apparatus label run (machine label in v2, D-145). */
function stripV1Labels(root: unknown): void {
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (isObj(o)) {
      for (const f of ["source", "keyRow"]) {
        const v = o[f];
        const inl = isObj(v) && isObj(v.inline) ? v.inline : v;
        if (isObj(inl) && Array.isArray(inl.runs) && inl.runs.length > 1) {
          const first = inl.runs[0];
          if (isObj(first) && typeof first.t === "string" && LABEL_RE.test(first.t.trim())) inl.runs.shift();
        }
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(root);
}

function v1Skip(key: string, parent: Obj): boolean {
  if (["kicker", "number", "separator", "numberSeparator", "page", "setup", "format", "mode"].includes(key)) return true;
  if (key === "label" && ("inline" in parent || "kind" in parent || "chapterKeys" in parent)) return true; // caption, rail line, part
  return false;
}

function v2Skip(key: string): boolean {
  return key === "page" || key === "spec" || key === "data";
}

function textConservation(docV1: Obj, docV2: Obj): Guard {
  const v1 = JSON.parse(JSON.stringify(docV1)) as Obj;
  stripV1Labels(v1);
  const front = (v1.front ?? {}) as Obj;
  const toc = isObj(front.toc) ? { entries: front.toc.entries } : {};
  const s2 = (docV2.sections ?? {}) as Obj;
  const content = (s2.content ?? {}) as Obj;
  const regions: Array<{ id: string; ordered: boolean; a: string[]; b: string[] }> = [
    // cover.kicker is content in v1 (renamed tagline, §14.2); every other kicker is a machine/template label.
    { id: "cover", ordered: false, a: texts(front.cover, (k, p) => k !== "kicker" && v1Skip(k, p)), b: texts(s2.cover, v2Skip) },
    { id: "controlSheet", ordered: false, a: texts(front.controlSheet, v1Skip), b: texts(s2.controlSheet, v2Skip) },
    { id: "signature", ordered: true, a: texts(front.signature, v1Skip), b: texts(s2.signature, v2Skip) },
    { id: "toc", ordered: true, a: texts(toc, v1Skip), b: texts(s2.toc, v2Skip) },
    { id: "parts", ordered: true, a: texts(v1.parts, v1Skip), b: texts(content.parts, v2Skip) },
    { id: "chapters", ordered: true, a: texts(v1.chapters, v1Skip), b: texts(content.chapters, v2Skip) },
    { id: "appendices", ordered: true, a: texts(v1.appendices, v1Skip), b: texts(((s2.appendices ?? {}) as Obj).chapters, v2Skip) },
  ];
  const detail: Record<string, unknown> = {};
  let pass = true;
  let total = 0;
  for (const r of regions) {
    const a = r.ordered ? r.a : [...r.a].sort();
    const b = r.ordered ? r.b : [...r.b].sort();
    const eq = a.length === b.length && a.every((t, i) => t === b[i]);
    let firstDiff: unknown = null;
    if (!eq) {
      const i = a.findIndex((t, k) => t !== b[k]);
      const at = i < 0 ? Math.min(a.length, b.length) : i;
      firstDiff = { index: at, v1: a[at]?.slice(0, 120) ?? null, v2: b[at]?.slice(0, 120) ?? null };
    }
    pass &&= eq;
    total += a.length;
    detail[r.id] = { v1: r.a.length, v2: r.b.length, equal: eq, ...(firstDiff ? { firstDiff } : {}) };
  }
  detail.totalInlineTexts = total;
  return { id: "G3_textConservation", pass, detail };
}

// ── G4 effective values ──────────────────────────────────────────────────

function legacyKeys(): string[] {
  const structure = new Set(PARAMS_STRUCTURE.map((p) => p.key));
  const keys = ALL_PARAMS.map((p) => p.key).filter((k) => !structure.has(k));
  keys.push("grid.marginBottomMm");
  return [...new Set(keys)].sort();
}

const pick = (p: Readonly<Record<string, unknown>>, keys: readonly string[]): Obj => Object.fromEntries(keys.map((k) => [k, p[k] ?? null]));
const proj = (p: Readonly<Record<string, unknown>>, keys: readonly string[]): string => sha256Hex(stableStringify(pick(p, keys)));

async function effectiveValues(): Promise<Guard[]> {
  const v1 = await loadResolvedProfileFile(F.tplV1, { repoRoot: REPO });
  const v2 = await loadResolvedTemplateV2File(F.tplV2, { repoRoot: REPO });
  // KT-5 baseline as the SR-36 guard builds it: template.json resolved in memory, and the measured value the profile
  // states for an override that is class T now (dropped by the reader, e.g. P5-14 = 166) used as that key's baseline.
  const P1 = { ...(v1.template.params as Record<string, unknown>) };
  const rawOverrides = ((readJson(F.tplV1) as Obj).overrides ?? {}) as Obj;
  for (const key of v1.droppedDerived) if (key in rawOverrides) P1[key] = rawOverrides[key];
  const P2 = v2.template.params as Record<string, unknown>;
  const LEGACY = legacyKeys();
  const INTENDED_DELTA = intendedDelta();
  const diff = LEGACY.filter((k) => stableStringify(P1[k] ?? null) !== stableStringify(P2[k] ?? null));
  const rest = LEGACY.filter((k) => !INTENDED_DELTA.includes(k));
  const show = (v: unknown): unknown => (k(v).length > 200 ? `${k(v).slice(0, 200)}…` : v);
  const k = (v: unknown): string => stableStringify(v ?? null);
  const g4: Guard = {
    id: "G4_effectiveValuesLegacy",
    pass: INTENDED_DELTA.length > 0 && proj(P1, rest) === proj(P2, rest) && stableStringify(diff) === stableStringify(INTENDED_DELTA),
    detail: {
      baselineStatedDerived: v1.droppedDerived.filter((key) => key in rawOverrides),
      loader: { presetSlug: v2.preset.slug, presetFile: v2.preset.file ? path.relative(REPO, v2.preset.file).replace(/\\/g, "/") : null, droppedDerived: v2.droppedDerived, ignoredFields: v2.ignoredFields },
      legacyKeys: LEGACY.length,
      projLegacy: { templateJson: proj(P1, LEGACY), templateV2: proj(P2, LEGACY) },
      projLegacyMinusDelta: { keys: rest.length, templateJson: proj(P1, rest), templateV2: proj(P2, rest), equal: proj(P1, rest) === proj(P2, rest) },
      diffKeys: diff,
      intendedDelta: INTENDED_DELTA,
      deltaValues: Object.fromEntries(diff.map((key) => [key, { templateJson: show(P1[key]), templateV2: show(P2[key]) }])),
      fullParamsSha256: { templateJson: v1.template.versionId, templateV2: v2.template.versionId, keys: { templateJson: Object.keys(P1).length, templateV2: Object.keys(P2).length } },
      newKeysV2: Object.fromEntries(
        PARAMS_STRUCTURE.map((p) => p.key)
          .filter((key) => k(P2[key]) !== k(P1[key]))
          .map((key) => [key, show(P2[key])]),
      ),
    },
  };

  // roleFormats: only rail.mark differs (labelRunByMark, D-144).
  const r1 = (v1.template as ResolvedTemplate).roleFormats as Record<string, unknown>;
  const r2 = (v2.template as ResolvedTemplate).roleFormats as Record<string, unknown>;
  const roles = [...new Set([...Object.keys(r1), ...Object.keys(r2)])].sort();
  const roleDiff = roles.filter((r) => k(r1[r]) !== k(r2[r]));
  const rail2 = (r2["rail.mark"] ?? {}) as Obj;
  const { labelRunByMark, ...railRest } = rail2;
  const gRoles: Guard = {
    id: "G4_roleFormats",
    pass: stableStringify(roleDiff) === stableStringify(["rail.mark"]) && k(railRest) === k(r1["rail.mark"]) && isObj(labelRunByMark),
    detail: { roles: roles.length, roleDiff, labelRunByMark },
  };

  // SR-06 per-slot resolution with layers (registry <- preset <- template <- slot, deriveLayered once).
  const preset = await readTemplateProfileFile(F.preset);
  const layer = templateLayerOf(v2.definition);
  const { slots, issues } = resolveSkeletonSlots(v2.template, v2.skeleton.slots, undefined, {
    layers: { preset: preset.profile.overrides, template: layer },
  });
  const perSlot: Record<string, unknown> = {};
  let slotPass = issues.length === 0;
  for (const [key, s] of slots) {
    const p = s.params as Record<string, unknown>;
    const d = LEGACY.filter((x) => k(p[x]) !== k(P2[x]));
    const eq = proj(p, rest) === proj(P1, rest);
    slotPass &&= eq && d.length === 0;
    perSlot[key] = { projLegacyMinusDelta: proj(p, rest), equalTemplateJson: eq, diffVsDocumentLevel: d };
  }
  const gSlots: Guard = { id: "G4_slotsLayered", pass: slotPass, detail: { slots: slots.size, issues, perSlot } };
  return [g4, gRoles, gSlots];
}

// ── main ─────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const out = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : undefined;
  let docV1: Obj, docV2: Obj, tplV2: Obj;
  try {
    docV1 = readJson(F.docV1) as Obj;
    docV2 = readJson(F.docV2) as Obj;
    tplV2 = readJson(F.tplV2) as Obj;
  } catch (e) {
    console.error(`input error: ${(e as Error).message}`);
    return 2;
  }
  const guards: Guard[] = [];
  const a = ajv();

  const vDoc = a.getSchema(DOC_V2_SCHEMA_ID);
  const vTpl = a.getSchema(TEMPLATE_V2_SCHEMA_ID);
  if (!vDoc || !vTpl) {
    console.error("schema studio.doc/v2 or studio.template/v2 not registered");
    return 2;
  }
  const docOk = vDoc(docV2) as boolean;
  const docIssues = classifySchemaV2Errors("studio.doc/v2", docV2, vDoc.errors);
  const scan = displayKeyScan(docV2);
  guards.push({
    id: "G1_docSchemaV2",
    pass: docOk && docIssues.length === 0 && Object.keys(scan).length === 0,
    detail: {
      valid: docOk,
      issues: docIssues.length,
      displayField: docIssues.filter((i) => i.checkId === "DISPLAY_FIELD").length,
      v1Field: docIssues.filter((i) => i.checkId === "V1_FIELD").length,
      firstIssues: docIssues.slice(0, 5),
      displayKeyScan: scan,
    },
  });

  const tplOk = vTpl(tplV2) as boolean;
  const slots = ((tplV2.skeleton as Obj | undefined)?.slots ?? []) as Obj[];
  guards.push({
    id: "G2_templateSchemaV2",
    pass:
      tplOk &&
      slots.length === 6 &&
      !slots.some((s) => s.sectionType === "sourceRegister") &&
      slots.find((s) => s.sectionType === "toc")?.contentMode === "MIXED" &&
      tplV2.advanced === undefined &&
      isObj(tplV2.preset) &&
      tplV2.preset.slug === "datum-manual-000",
    detail: {
      valid: tplOk,
      errors: (vTpl.errors ?? []).slice(0, 5),
      slots: slots.map((s) => `${String(s.position)}:${String(s.slotKey)}/${String(s.sectionType)}/${String(s.contentMode)}`),
      essentials: Object.keys((tplV2.essentials ?? {}) as Obj),
      advancedKeys: Object.keys((tplV2.advanced ?? {}) as Obj).length,
    },
  });

  guards.push(textConservation(docV1, docV2));
  try {
    guards.push(...(await effectiveValues()));
  } catch (e) {
    guards.push({ id: "G4_effectiveValuesLegacy", pass: false, detail: { error: (e as Error).message, code: (e as { code?: string }).code } });
  }

  for (const g of guards) console.log(`${g.pass ? "PASS" : "FAIL"} ${g.id} ${JSON.stringify(g.detail)}`);
  if (out) writeFileSync(out, `${JSON.stringify({ guards }, null, 2)}\n`, "utf8");
  return guards.every((g) => g.pass) ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`verify_v2: ${(e as Error).stack ?? String(e)}`);
    process.exit(2);
  },
);
