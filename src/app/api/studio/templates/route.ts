/**
 * R01 `/api/studio/templates` (01_specs.md §6.2, S54; SR-61: register
 * 03_structural_sections_specs.md §12 R01, blueprint 05 §2.3/§2.11, D-163 T-1/T-2, D-166).
 *
 * GET  `?kind=&archived=0|1&preset=0|1`  -> 200 `{ templates: TemplateSummary[] }` (+ `isPreset`,
 *      `restricted`). `preset=1` = hanya preset gaya, `preset=0` = tanpa preset, tak diisi = semua
 *      (menggantikan usulan blueprint `?kind=preset`; deviasi diterima D-166).
 * POST v2 `{ slug, name, kind, description?, isPreset? (ADMIN), changeNote, template: StudioTemplateV2,
 *      expertMode? }` -> 201 `{ template, version, skeletonSha256 }`: preset + esensial + lanjutan
 *      (hanya ADMIN, D-163 T-1) + kerangka dalam SATU transaksi layanan (SR-07).
 * POST v1 datar `CreateTemplateInput` -> 201 `{ template, version }` (tetap; kunci non-esensial
 *      hanya ADMIN -> 403 PARAM_SURFACE_FORBIDDEN untuk pemanggil lain).
 * POST `?import=profile` + profil JSON   -> 201 `{ template, version }` (hanya ADMIN_SESSION;
 *      bentuk `benchmark/manual000/template.json`, S95)
 *
 * Galat: 400 SCHEMA_INVALID/JSON_MALFORMED/CHANGE_NOTE_REQUIRED/PARAM_CLASS_T_READONLY,
 * 403 PARAM_CLASS_K_FORBIDDEN (kunci kelas K) / PARAM_SURFACE_FORBIDDEN (lapis lanjutan/internal/
 * turunan) / FORBIDDEN (peran: impor atau preset baru non-ADMIN), 404 TEMPLATE_NOT_FOUND (preset v2),
 * 409 TEMPLATE_SLUG_EXISTS, 413 PAYLOAD_TOO_LARGE,
 * 422 PARAM_UNKNOWN_KEY/SLOT_PARAM_SCOPE_INVALID/SLOT_DUPLICATE.
 */
import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getStudioCaller, type StudioCaller } from "@/lib/studio/contract/auth";
import { STUDIO_TEMPLATE_KINDS, type StudioTemplateKind } from "@/lib/studio/contract/enums";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import type { CreateTemplateInput, ValidationIssue } from "@/lib/studio/contract/types/api";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { StudioTemplateV2 } from "@/lib/studio/contract/types/v2/template";
import { ESSENTIAL_FIELD_PATHS, isEssentialFieldPath } from "@/lib/studio/registry/essentials";
import {
  createTemplate,
  createTemplateV2,
  isAdminCaller,
  listTemplates,
  surfaceOfKey,
  type CreateTemplateV2Input,
  type TemplateListQueryV2,
} from "@/lib/studio/services/templates";
import { apiLog, failure, isPlainObject, issue, json, ptr, readJsonBody, reject, reqCtx, schemaInvalid, type ReqCtx } from "@/lib/studio/http";
import {
  agentIdOf,
  assertOverridesAllowed,
  parseCreateTemplate,
  parseProfileImport,
  SLUG_MAX,
  SLUG_PATTERN,
  type Validated,
} from "./_lib/validate";

export const dynamic = "force-dynamic";

const ROUTE = "/api/studio/templates";
const SOURCE = "studio.api.templates";
const KIND_SET: ReadonlySet<string> = new Set(STUDIO_TEMPLATE_KINDS);
const BOOL_QUERY = ["0", "1", "true", "false"];
const TEMPLATE_V2_SCHEMA = "studio.template/v2";
const NAME_MAX = 200;
const DESCRIPTION_MAX = 4000;
const CHANGE_NOTE_MAX = 4000;

function boolQuery(v: string | null): boolean | undefined {
  if (v === null || v === "") return undefined;
  return v === "1" || v === "true";
}

export async function GET(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);

  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const archived = sp.get("archived");
  const preset = sp.get("preset");
  const issues: ValidationIssue[] = [];
  if (kind !== null && kind !== "" && !KIND_SET.has(kind)) {
    issues.push(issue("/query/kind", "enum", `kind must be one of ${STUDIO_TEMPLATE_KINDS.join(", ")}`));
  }
  if (archived !== null && archived !== "" && !BOOL_QUERY.includes(archived)) {
    issues.push(issue("/query/archived", "enum", "archived must be 0, 1, true or false"));
  }
  if (preset !== null && preset !== "" && !BOOL_QUERY.includes(preset)) {
    issues.push(issue("/query/preset", "enum", "preset must be 0 (exclude style presets) or 1 (style presets only)"));
  }
  if (issues.length) return schemaInvalid(issues, ctx);

  const q: TemplateListQueryV2 = {};
  if (kind) q.kind = kind as StudioTemplateKind;
  // Default spesifikasi `archived=0`: templat aktif saja.
  q.archived = boolQuery(archived) === true;
  const presetFilter = boolQuery(preset);
  if (presetFilter !== undefined) q.preset = presetFilter;

  try {
    const rows = await listTemplates(q);
    // Respons R01 SR-61: `isPreset` selalu boolean (penanda preset di daftar); filter diulang
    // di route sebagai pertahanan berlapis terhadap layanan.
    const templates = rows
      .map((t) => ({ ...t, isPreset: t.isPreset === true }))
      .filter((t) => presetFilter === undefined || t.isPreset === presetFilter);
    return json({ templates }, 200, ctx);
  } catch (e) {
    return failure(e, ctx, { op: "GET templates", context: { kind: q.kind ?? null, archived: q.archived, preset: presetFilter ?? null } });
  }
}

function optionalText(v: unknown, pointer: string, max: number, issues: ValidationIssue[]): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || v.length > max) {
    issues.push(issue(pointer, "type", `must be a string of at most ${max} characters`));
    return undefined;
  }
  return v.trim() || undefined;
}

/**
 * Amplop POST v2 (register §12 R01). Bentuk `template` (ajv SID04, aturan kerangka SKELETON_*)
 * divalidasi layanan SR-07 (`parseTemplateV2`, 400 SCHEMA_INVALID berpointer `/template/...`);
 * route hanya memeriksa medan amplop dan `$schema`.
 */
function parseCreateTemplateV2(body: Record<string, unknown>): Validated<CreateTemplateV2Input> {
  const issues: ValidationIssue[] = [];
  const slug = body.slug;
  if (typeof slug !== "string" || slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) {
    issues.push(issue("/slug", "pattern", `slug must match ${SLUG_PATTERN.source} (max ${SLUG_MAX})`));
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > NAME_MAX) issues.push(issue("/name", "minLength", `name is required (max ${NAME_MAX})`));
  const kind = body.kind;
  if (typeof kind !== "string" || !KIND_SET.has(kind)) {
    issues.push(issue("/kind", "enum", `kind must be one of ${STUDIO_TEMPLATE_KINDS.join(", ")}`));
  }
  const description = optionalText(body.description, "/description", DESCRIPTION_MAX, issues);
  if (body.isPreset !== undefined && typeof body.isPreset !== "boolean") issues.push(issue("/isPreset", "type", "isPreset must be a boolean"));
  if (body.expertMode !== undefined && typeof body.expertMode !== "boolean") issues.push(issue("/expertMode", "type", "expertMode must be a boolean"));
  if (body.overrides !== undefined) {
    issues.push(issue("/overrides", "not", "studio.template/v2 carries parameters in template.essentials/advanced, not flat overrides"));
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
      slug: slug as string,
      name,
      kind: kind as StudioTemplateKind,
      ...(description !== undefined ? { description } : {}),
      ...(body.isPreset !== undefined ? { isPreset: body.isPreset as boolean } : {}),
      ...(body.expertMode !== undefined ? { expertMode: body.expertMode as boolean } : {}),
      changeNote,
      template: template as unknown as StudioTemplateV2,
    },
  };
}

/**
 * v1 datar oleh non-ADMIN (register §12 R01: "kunci non-esensial hanya ADMIN"): setiap kunci
 * override harus berlapis `essential`, atau objek yang hanya memuat medan kenop esensial bertipe
 * `medan` (lapis PER KENOP, D-170/D-171). Selain itu 403 PARAM_SURFACE_FORBIDDEN. Kunci tak dikenal
 * sudah ditolak `assertOverridesAllowed` (422) sebelum cek ini.
 */
function assertV1EssentialOnly(overrides: Record<string, ParamValue>, caller: StudioCaller): void {
  if (isAdminCaller(caller)) return;
  const blocked: Array<{ key: string; surface: string; pointer: string }> = [];
  for (const [key, value] of Object.entries(overrides)) {
    const surface = surfaceOfKey(key);
    if (surface === undefined || surface === "essential") continue;
    if (surface !== "internal" && ESSENTIAL_FIELD_PATHS.has(key) && isPlainObject(value)) {
      const fields = Object.keys(value);
      if (fields.length > 0 && fields.every((f) => isEssentialFieldPath(key, f))) continue;
    }
    blocked.push({ key, surface, pointer: ptr("overrides", key) });
  }
  if (blocked.length === 0) return;
  const first = blocked[0];
  throw new StudioEngineError(
    "PARAM_SURFACE_FORBIDDEN",
    `${first.key}: pengaturan ${first.surface === "derived" ? "turunan" : "lanjutan"} hanya dapat diubah peran ADMINISTRATOR${blocked.length > 1 ? ` (+${blocked.length - 1} kunci lain)` : ""}`,
    { keys: blocked.map((b) => b.key), surface: first.surface, items: blocked },
  );
}

export async function POST(req: NextRequest) {
  const denied = await requireSession(req);
  if (denied) return denied;
  const ctx = reqCtx(req, ROUTE, SOURCE);

  const mode = new URL(req.url).searchParams.get("import");
  if (mode !== null && mode !== "profile") {
    return schemaInvalid([issue("/query/import", "enum", "import must be 'profile'")], ctx);
  }
  const isImport = mode === "profile";

  const read = await readJsonBody(req, ctx);
  if (!read.ok) return read.response;

  let caller: StudioCaller;
  try {
    caller = await getStudioCaller(req, agentIdOf(read.value));
  } catch (e) {
    return failure(e, ctx, { op: "POST templates caller" });
  }

  // Impor profil = penulisan profil turunan lengkap (umumnya memuat kelas K): admin saja (KT-16).
  // R-13 (IP-43b): penolakan berbasis peran -> FORBIDDEN (bukan PARAM_CLASS_K_FORBIDDEN).
  if (isImport && !isAdminCaller(caller)) {
    return reject(ctx, "FORBIDDEN", "Template profile import requires an ADMINISTRATOR session", undefined, {
      callerKind: caller.kind,
      requester: caller.requester,
    });
  }

  // studio.template/v2 (D-163 T-2): amplop dengan `template`; v1 datar tanpa `template`.
  if (!isImport && isPlainObject(read.value) && read.value.template !== undefined) {
    return createV2(read.value, caller, ctx);
  }

  const parsed: Validated<CreateTemplateInput> = isImport ? parseProfileImport(read.value) : parseCreateTemplate(read.value);
  if (!parsed.ok) {
    if ("issues" in parsed) return schemaInvalid(parsed.issues, ctx);
    return reject(ctx, "CHANGE_NOTE_REQUIRED", "changeNote is required");
  }
  const input = parsed.value;
  const failOpts = {
    op: isImport ? "POST templates import" : "POST templates",
    context: { slug: input.slug, kind: input.kind, callerKind: caller.kind, overrideKeys: Object.keys(input.overrides).length },
  };

  try {
    assertOverridesAllowed(input.overrides, caller);
    assertV1EssentialOnly(input.overrides, caller);
    const created = await createTemplate(input, caller);
    apiLog({
      ...ctx,
      level: "info",
      message: isImport ? "template profile imported" : "template created",
      context: { templateId: created.template.id, slug: created.template.slug, versionNo: created.version.versionNo, callerKind: caller.kind },
    });
    return json(created, 201, ctx);
  } catch (e) {
    return failure(e, ctx, failOpts);
  }
}

async function createV2(body: Record<string, unknown>, caller: StudioCaller, ctx: ReqCtx): Promise<Response> {
  const parsed = parseCreateTemplateV2(body);
  if (!parsed.ok) {
    if ("issues" in parsed) return schemaInvalid(parsed.issues, ctx);
    return reject(ctx, "CHANGE_NOTE_REQUIRED", "changeNote is required");
  }
  const input = parsed.value;
  // Preset gaya baru = penolakan berbasis PERAN -> FORBIDDEN (D-146); layanan menegakkan ulang.
  if (input.isPreset === true && !isAdminCaller(caller)) {
    return reject(
      ctx,
      "FORBIDDEN",
      "Membuat preset gaya hanya untuk peran ADMINISTRATOR; pilih preset yang ada lalu atur kenop esensial",
      { reason: "PRESET_ADMIN_ONLY" },
      { callerKind: caller.kind, requester: caller.requester, slug: input.slug },
    );
  }
  try {
    const created = await createTemplateV2(input, caller);
    apiLog({
      ...ctx,
      level: "info",
      message: "template created (studio.template/v2)",
      context: {
        templateId: created.template.id,
        slug: created.template.slug,
        versionNo: created.version.versionNo,
        isPreset: created.template.isPreset,
        skeletonSha256: created.skeletonSha256,
        callerKind: caller.kind,
      },
    });
    return json(created, 201, ctx);
  } catch (e) {
    return failure(e, ctx, {
      op: "POST templates v2",
      context: {
        slug: input.slug,
        kind: input.kind,
        isPreset: input.isPreset === true,
        callerKind: caller.kind,
        essentialKeys: isPlainObject(input.template.essentials) ? Object.keys(input.template.essentials).length : null,
        advancedKeys: isPlainObject(input.template.advanced) ? Object.keys(input.template.advanced).length : 0,
        slots: Array.isArray(input.template.skeleton?.slots) ? input.template.skeleton.slots.length : null,
      },
    });
  }
}
