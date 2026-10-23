/**
 * R02 `/api/studio/templates/[id]` (01_specs.md §6.2, D-24 butir 2, S54; SR-61: register
 * 03_structural_sections_specs.md §12 R02, blueprint 05 §2.3/§2.11, D-163 T-1/T-2).
 *
 * GET   `?version=n&expert=0|1` -> 200 `{ template, version, versions: VersionSummary[],
 *       definition: StudioTemplateV2 | null, skeletonSha256, implicit, advancedIncluded }`.
 *       Non-ADMIN: `definition` hanya preset + esensial (+ kerangka dengan esensial slot);
 *       lanjutan dan roleFormats (templat, slot, `version.roleFormats`) hanya ADMIN;
 *       `version.overrides` dipangkas ke kunci esensial; `resolvedParams` (nilai efektif,
 *       baca saja) tetap untuk pratinjau. `expert=1` tidak membuka lanjutan bagi USER (D-163 T-1).
 * POST  v2 `{ baseVersionNo, changeNote, template: StudioTemplateV2, expertMode? }` -> 201
 *       `{ template, version, skeletonSha256 }`: SATU paket gabungan preset + esensial +
 *       lanjutan (ADMIN) + kerangka = SATU versi (D-163 T-2), satu transaksi layanan (SR-07).
 * POST  v1 datar `CreateTemplateVersionInput` (simpan = versi baru) -> 201 `{ version }`: tetap,
 *       HANYA ADMIN (non-ADMIN 403 FORBIDDEN `V1_FLAT_ADMIN_ONLY`).
 * PATCH alias POST: templat tak berubah, setiap suntingan menjadi versi baru.
 *
 * Galat: 400 SCHEMA_INVALID/JSON_MALFORMED/CHANGE_NOTE_REQUIRED/PARAM_CLASS_T_READONLY,
 * 403 PRESET_READONLY (versi preset gaya oleh non-ADMIN) / PARAM_SURFACE_FORBIDDEN (lapis
 * lanjutan/internal/turunan) / PARAM_CLASS_K_FORBIDDEN (kunci kelas K yang berubah) /
 * FORBIDDEN (peran: ubah profil kanonik atau templat terbatas non-ADMIN, v1 datar non-ADMIN),
 * 404 TEMPLATE_NOT_FOUND, 409 VERSION_CONFLICT, 413 PAYLOAD_TOO_LARGE,
 * 422 PARAM_UNKNOWN_KEY/SLOT_PARAM_SCOPE_INVALID/SLOT_DUPLICATE.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller, type StudioCaller } from "@/lib/studio/contract/auth";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { StudioTemplateV2, TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import {
  createTemplateVersion,
  createTemplateVersionV2,
  getTemplateV2,
  isAdminCaller,
  type CreateTemplateVersionV2Input,
  type TemplateDetailV2,
} from "@/lib/studio/services/templates";
import {
  apiLog,
  failure,
  isPlainObject,
  issue,
  json,
  positiveIntParam,
  readJsonBody,
  reject,
  reqCtx,
  schemaInvalid,
  type ReqCtx,
} from "@/lib/studio/http";
import { agentIdOf, assertOverrideValues, parseCreateVersion, type Validated } from "../_lib/validate";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/templates/[id]";
const SOURCE = "studio.api.templates.id";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const BOOL_QUERY = ["0", "1", "true", "false"];
const TEMPLATE_V2_SCHEMA = "studio.template/v2";
const CHANGE_NOTE_MAX = 4000;

type RouteCtx = { params: Promise<{ id: string }> };

/** Slot kerangka tanpa lapis lanjutan dan roleFormats (pemanggil non-ADMIN). */
function essentialSlot(slot: TemplateSlotDef): TemplateSlotDef {
  const { advanced: _advanced, roleFormats: _roleFormats, ...rest } = slot;
  void _advanced;
  void _roleFormats;
  return rest;
}

/**
 * Proyeksi respons GET untuk non-ADMIN (PT-07, D-163 T-1): definisi hanya preset + esensial
 * (+ kerangka berisi esensial slot); `version.roleFormats` dikosongkan. Layanan SR-07 sudah
 * memangkas lanjutan (`includeAdvanced: false`); proyeksi ini pertahanan berlapis yang idempoten.
 */
function projectForNonAdmin(detail: TemplateDetailV2): TemplateDetailV2 {
  let definition: StudioTemplateV2 | null = null;
  if (detail.definition) {
    const { advanced: _advanced, roleFormats: _roleFormats, skeleton, ...head } = detail.definition;
    void _advanced;
    void _roleFormats;
    definition = { ...head, skeleton: { slots: (skeleton?.slots ?? []).map(essentialSlot) } };
  }
  return { ...detail, version: { ...detail.version, roleFormats: {} }, definition, advancedIncluded: false };
}

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);

  const { id } = await params;
  if (!ID_PATTERN.test(id)) {
    return reject(ctx, "TEMPLATE_NOT_FOUND", "Template not found");
  }
  const sp = new URL(req.url).searchParams;
  const versionNo = positiveIntParam(sp.get("version"));
  const issues: ValidationIssue[] = [];
  if (Number.isNaN(versionNo)) issues.push(issue("/query/version", "type", "version must be a positive integer"));
  const expert = sp.get("expert");
  if (expert !== null && expert !== "" && !BOOL_QUERY.includes(expert)) {
    issues.push(issue("/query/expert", "enum", "expert must be 0, 1, true or false"));
  }
  if (issues.length) return schemaInvalid(issues, ctx);

  let admin = false;
  try {
    const caller = await getStudioCaller(req);
    admin = isAdminCaller(caller);
    // Lanjutan + roleFormats hanya ADMIN; `expert=1` USER diterima tetapi tidak membuka lapis (D-163 T-1).
    const detail = await getTemplateV2(id, versionNo ?? undefined, { includeAdvanced: admin });
    return json(admin ? detail : projectForNonAdmin(detail), 200, ctx);
  } catch (e) {
    return failure(e, ctx, { op: "GET template", context: { templateId: id, versionNo, admin, expertRequested: expert === "1" || expert === "true" } });
  }
}

/**
 * Amplop POST v2 (register §12 R02; D-163 T-2). Bentuk `template` (ajv SID04, SKELETON_*)
 * divalidasi layanan SR-07; route memeriksa medan amplop dan `$schema`.
 */
function parseCreateVersionV2(body: Record<string, unknown>): Validated<CreateTemplateVersionV2Input> {
  const issues: ValidationIssue[] = [];
  const baseVersionNo = body.baseVersionNo;
  if (typeof baseVersionNo !== "number" || !Number.isInteger(baseVersionNo) || baseVersionNo < 1) {
    issues.push(issue("/baseVersionNo", "type", "baseVersionNo must be a positive integer (the version being edited)"));
  }
  if (body.expertMode !== undefined && typeof body.expertMode !== "boolean") issues.push(issue("/expertMode", "type", "expertMode must be a boolean"));
  for (const flat of ["overrides", "roleFormats", "sectionPlan"] as const) {
    if (body[flat] !== undefined) {
      issues.push(issue(`/${flat}`, "not", `studio.template/v2 carries ${flat} inside template; flat v1 fields are not accepted with template`));
    }
  }
  const template = body.template;
  if (!isPlainObject(template)) issues.push(issue("/template", "type", "template must be a studio.template/v2 object"));
  else if (template.$schema !== TEMPLATE_V2_SCHEMA) issues.push(issue("/template/$schema", "const", `template.$schema must be "${TEMPLATE_V2_SCHEMA}"`));
  const changeNote = typeof body.changeNote === "string" ? body.changeNote.trim() : "";
  if (changeNote.length > CHANGE_NOTE_MAX) issues.push(issue("/changeNote", "maxLength", `changeNote may not exceed ${CHANGE_NOTE_MAX} characters`));

  if (issues.length) return { ok: false, issues };
  if (!changeNote) return { ok: false, changeNoteMissing: true };
  return {
    ok: true,
    value: {
      baseVersionNo: baseVersionNo as number,
      changeNote,
      template: template as unknown as StudioTemplateV2,
      ...(body.expertMode !== undefined ? { expertMode: body.expertMode as boolean } : {}),
    },
  };
}

async function saveVersionV2(id: string, body: Record<string, unknown>, caller: StudioCaller, ctx: ReqCtx, method: "POST" | "PATCH"): Promise<Response> {
  const parsed = parseCreateVersionV2(body);
  if (!parsed.ok) {
    if ("issues" in parsed) return schemaInvalid(parsed.issues, ctx);
    return reject(ctx, "CHANGE_NOTE_REQUIRED", "changeNote is required for a new template version");
  }
  const input = parsed.value;
  try {
    // Urutan §11.1 + §13.5 di layanan: bentuk -> 404 -> PRESET_READONLY -> FORBIDDEN (kanonik/
    // terbatas) -> 409 -> kunci yang BERUBAH saja (D-134; lapis per kenop D-170/D-171).
    const created = await createTemplateVersionV2(id, input, caller);
    apiLog({
      ...ctx,
      level: "info",
      message: "template version created (studio.template/v2)",
      context: {
        templateId: id,
        versionNo: created.version.versionNo,
        isPreset: created.template.isPreset,
        skeletonSha256: created.skeletonSha256,
        callerKind: caller.kind,
      },
    });
    return json(created, 201, ctx);
  } catch (e) {
    return failure(e, ctx, {
      op: `${method} template version v2`,
      context: {
        templateId: id,
        baseVersionNo: input.baseVersionNo,
        callerKind: caller.kind,
        essentialKeys: isPlainObject(input.template.essentials) ? Object.keys(input.template.essentials).length : null,
        advancedKeys: isPlainObject(input.template.advanced) ? Object.keys(input.template.advanced).length : 0,
        slots: Array.isArray(input.template.skeleton?.slots) ? input.template.skeleton.slots.length : null,
      },
    });
  }
}

async function saveVersion(req: NextRequest, { params }: RouteCtx, method: "POST" | "PATCH"): Promise<Response> {
  const ctx = reqCtx(req, ROUTE, SOURCE);
  const { id } = await params;
  if (!ID_PATTERN.test(id)) {
    return reject(ctx, "TEMPLATE_NOT_FOUND", "Template not found");
  }

  const read = await readJsonBody(req, ctx);
  if (!read.ok) return read.response;

  let caller: StudioCaller;
  try {
    caller = await getStudioCaller(req, agentIdOf(read.value));
  } catch (e) {
    return failure(e, ctx, { op: `${method} template version caller`, context: { templateId: id } });
  }

  // studio.template/v2 (D-163 T-2): amplop dengan `template`; v1 datar tanpa `template`.
  if (isPlainObject(read.value) && read.value.template !== undefined) {
    return saveVersionV2(id, read.value, caller, ctx, method);
  }

  // v1 datar tetap untuk ADMIN saja (register §12 R02). Penolakan berbasis PERAN -> FORBIDDEN (D-146).
  if (!isAdminCaller(caller)) {
    return reject(
      ctx,
      "FORBIDDEN",
      "Penyimpanan templat bentuk lama (overrides datar) hanya untuk peran ADMINISTRATOR; kirim studio.template/v2 (preset + esensial + kerangka)",
      { reason: "V1_FLAT_ADMIN_ONLY" },
      { templateId: id, callerKind: caller.kind, requester: caller.requester },
    );
  }

  const parsed = parseCreateVersion(read.value);
  if (!parsed.ok) {
    if ("issues" in parsed) return schemaInvalid(parsed.issues, ctx);
    return reject(ctx, "CHANGE_NOTE_REQUIRED", "changeNote is required for a new template version");
  }
  const input = parsed.value;
  const failOpts = {
    op: `${method} template version`,
    context: { templateId: id, baseVersionNo: input.baseVersionNo, overrideKeys: Object.keys(input.overrides).length },
  };

  try {
    // S85 R-05: hanya nilai; hak K/T per kunci yang BERUBAH diperiksa layanan (D-62).
    assertOverrideValues(input.overrides);
    const created = await createTemplateVersion(id, input, caller);
    apiLog({
      ...ctx,
      level: "info",
      message: "template version created",
      context: { templateId: id, versionNo: created.version.versionNo, callerKind: caller.kind },
    });
    return json(created, 201, ctx);
  } catch (e) {
    return failure(e, ctx, failOpts);
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const denied = await requireSession(req);
  if (denied) return denied;
  return saveVersion(req, ctx, "POST");
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const denied = await requireSession(req);
  if (denied) return denied;
  return saveVersion(req, ctx, "PATCH");
}
