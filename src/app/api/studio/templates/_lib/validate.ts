/**
 * Validasi masukan R01/R02 (01_specs.md §6.2, M01-M02) sebelum layanan S49.
 *
 * Urutan galat: bentuk (400 SCHEMA_INVALID, `details` berpointer) ->
 * catatan perubahan (400 CHANGE_NOTE_REQUIRED) -> hak override (KT-16, lewat
 * `assertOverrideRights` S11: 403 PARAM_CLASS_K_FORBIDDEN, 400
 * PARAM_CLASS_T_READONLY, 422 PARAM_UNKNOWN_KEY) -> nilai override (400).
 * Layanan S49 tetap menegakkan aturan yang sama (pertahanan berlapis).
 */
import type { StudioCaller } from "@/lib/studio/contract/auth";
import { ROLE_KEYS, STUDIO_TEMPLATE_KINDS, STUDIO_TIERS, type StudioTemplateKind } from "@/lib/studio/contract/enums";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import type { RoleFormatMap } from "@/lib/studio/contract/engine";
import type {
  CreateTemplateInput,
  CreateTemplateVersionInput,
  ValidationIssue,
} from "@/lib/studio/contract/types/api";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { SectionPlan } from "@/lib/studio/contract/types/params";
import { assertOverrideRights, validateParamValue } from "@/lib/studio/engine/tokens";
import { ALL_PARAMS, PARAMS_BY_KEY } from "@/lib/studio/params";
import { getSectionType } from "@/lib/studio/registry/sections";
import { isPlainObject, issue, ptr } from "@/lib/studio/http";

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 64;
const NAME_MAX = 200;
const DESCRIPTION_MAX = 4000;
const CHANGE_NOTE_MAX = 4000;
const ID_MAX = 64;
const AGENT_ID_MAX = 80;

const ROLE_KEY_SET: ReadonlySet<string> = new Set(ROLE_KEYS);
const TIER_SET: ReadonlySet<string> = new Set(STUDIO_TIERS);
const KIND_SET: ReadonlySet<string> = new Set(STUDIO_TEMPLATE_KINDS);
const PLAN_LISTS = ["required", "optional", "forbidden"] as const;

export type Validated<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] } | { ok: false; changeNoteMissing: true };

function checkOverrides(v: unknown, issues: ValidationIssue[]): Record<string, ParamValue> {
  if (v === undefined) return {};
  if (!isPlainObject(v)) {
    issues.push(issue("/overrides", "type", "overrides must be an object of parameter key -> value"));
    return {};
  }
  if (Object.keys(v).length > ALL_PARAMS.length) {
    issues.push(issue("/overrides", "maxProperties", `overrides may not exceed ${ALL_PARAMS.length} keys`));
  }
  return v as Record<string, ParamValue>;
}

function checkRoleFormats(v: unknown, issues: ValidationIssue[]): RoleFormatMap | undefined {
  if (v === undefined || v === null) return undefined;
  if (!isPlainObject(v)) {
    issues.push(issue("/roleFormats", "type", "roleFormats must be an object keyed by role"));
    return undefined;
  }
  for (const [role, fmt] of Object.entries(v)) {
    if (!ROLE_KEY_SET.has(role)) issues.push(issue(ptr("roleFormats", role), "propertyNames", "unknown role key"));
    else if (!isPlainObject(fmt)) issues.push(issue(ptr("roleFormats", role), "type", "role format must be an object"));
  }
  return v as RoleFormatMap;
}

function checkSectionPlan(v: unknown, issues: ValidationIssue[]): SectionPlan | undefined {
  if (v === undefined || v === null) return undefined;
  if (!isPlainObject(v)) {
    issues.push(issue("/sectionPlan", "type", "sectionPlan must be an object keyed by tier"));
    return undefined;
  }
  for (const [tier, plan] of Object.entries(v)) {
    if (!TIER_SET.has(tier)) {
      issues.push(issue(ptr("sectionPlan", tier), "propertyNames", `tier must be one of ${STUDIO_TIERS.join(", ")}`));
      continue;
    }
    if (!isPlainObject(plan)) {
      issues.push(issue(ptr("sectionPlan", tier), "type", "tier plan must be an object"));
      continue;
    }
    for (const list of PLAN_LISTS) {
      const arr = plan[list];
      if (!Array.isArray(arr)) {
        issues.push(issue(ptr("sectionPlan", tier, list), "type", `${list} must be an array of section keys`));
        continue;
      }
      arr.forEach((key, i) => {
        if (typeof key !== "string" || !getSectionType(key)) {
          issues.push(issue(ptr("sectionPlan", tier, list, i), "enum", "unknown section key"));
        }
      });
    }
    if (plan.requiredPresets !== undefined && !isPlainObject(plan.requiredPresets)) {
      issues.push(issue(ptr("sectionPlan", tier, "requiredPresets"), "type", "requiredPresets must be an object"));
    }
  }
  return v as SectionPlan;
}

function optionalString(v: unknown, pointer: string, max: number, issues: ValidationIssue[]): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || v.length > max) {
    issues.push(issue(pointer, "type", `must be a string of at most ${max} characters`));
    return undefined;
  }
  return v.trim() || undefined;
}

/** Catatan perubahan wajib (CHANGE_NOTE_REQUIRED). */
function changeNoteOf(v: unknown, issues: ValidationIssue[]): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  if (v.length > CHANGE_NOTE_MAX) {
    issues.push(issue("/changeNote", "maxLength", `changeNote may not exceed ${CHANGE_NOTE_MAX} characters`));
  }
  return v.trim();
}

/** agentId opsional (maks 80) untuk `requester` pemanggil mesin. */
export function agentIdOf(body: unknown): string | null {
  if (!isPlainObject(body)) return null;
  const a = body.agentId;
  return typeof a === "string" && a.trim() ? a.trim().slice(0, AGENT_ID_MAX) : null;
}

/** Badan POST /api/studio/templates. */
export function parseCreateTemplate(body: unknown): Validated<CreateTemplateInput> {
  if (!isPlainObject(body)) return { ok: false, issues: [issue("", "type", "body must be a JSON object")] };
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
  const description = optionalString(body.description, "/description", DESCRIPTION_MAX, issues);
  const baseVersionId = optionalString(body.baseVersionId, "/baseVersionId", ID_MAX, issues);
  const overrides = checkOverrides(body.overrides, issues);
  const roleFormats = checkRoleFormats(body.roleFormats, issues);
  const sectionPlan = checkSectionPlan(body.sectionPlan, issues);
  const changeNote = changeNoteOf(body.changeNote, issues);

  if (issues.length) return { ok: false, issues };
  if (changeNote === null) return { ok: false, changeNoteMissing: true };
  return {
    ok: true,
    value: {
      slug: slug as string,
      name,
      kind: kind as StudioTemplateKind,
      description,
      baseVersionId,
      overrides,
      roleFormats,
      sectionPlan,
      changeNote,
    },
  };
}

/** Badan POST/PATCH /api/studio/templates/[id] (simpan = versi baru). */
export function parseCreateVersion(body: unknown): Validated<CreateTemplateVersionInput> {
  if (!isPlainObject(body)) return { ok: false, issues: [issue("", "type", "body must be a JSON object")] };
  const issues: ValidationIssue[] = [];
  const baseVersionNo = body.baseVersionNo;
  if (typeof baseVersionNo !== "number" || !Number.isInteger(baseVersionNo) || baseVersionNo < 1) {
    issues.push(issue("/baseVersionNo", "type", "baseVersionNo must be a positive integer (the version being edited)"));
  }
  const overrides = checkOverrides(body.overrides, issues);
  const roleFormats = checkRoleFormats(body.roleFormats, issues);
  const sectionPlan = checkSectionPlan(body.sectionPlan, issues);
  const changeNote = changeNoteOf(body.changeNote, issues);

  if (issues.length) return { ok: false, issues };
  if (changeNote === null) return { ok: false, changeNoteMissing: true };
  return { ok: true, value: { overrides, roleFormats, sectionPlan, changeNote, baseVersionNo: baseVersionNo as number } };
}

/**
 * Profil templat JSON (bentuk `benchmark/manual000/template.json`, S95):
 * `{ base?, meta: { slug, name, kind, description? }, overrides, roleFormats?, sectionPlan?, changeNote }`.
 * Dipetakan ke CreateTemplateInput; `base` berupa slug, bukan id versi, jadi
 * tidak diteruskan sebagai `baseVersionId` (pewarisan DATUM-kanonik oleh S49).
 */
export function parseProfileImport(body: unknown): Validated<CreateTemplateInput> {
  if (!isPlainObject(body)) return { ok: false, issues: [issue("", "type", "profile must be a JSON object")] };
  if (!isPlainObject(body.meta)) return { ok: false, issues: [issue("/meta", "required", "profile.meta { slug, name, kind } is required")] };
  const meta = body.meta;
  const res = parseCreateTemplate({
    slug: meta.slug,
    name: meta.name,
    kind: meta.kind,
    description: meta.description,
    overrides: body.overrides,
    roleFormats: body.roleFormats,
    sectionPlan: body.sectionPlan,
    changeNote: body.changeNote,
  });
  if (!res.ok && "issues" in res) {
    // Pointer badan profil: slug/name/kind/description ada di bawah /meta.
    const metaKeys = new Set(["/slug", "/name", "/kind", "/description"]);
    return { ok: false, issues: res.issues.map((i) => (metaKeys.has(i.pointer) ? { ...i, pointer: "/meta" + i.pointer } : i)) };
  }
  return res;
}

/**
 * Hak override (KT-16) + nilai override per tipe parameter. Melempar
 * StudioEngineError dengan kode §6.3; `details` berisi isu berpointer.
 */
export function assertOverridesAllowed(overrides: Record<string, ParamValue>, caller: StudioCaller): void {
  assertOverrideRights(overrides, caller.kind, ALL_PARAMS);
  assertOverrideValues(overrides);
}

/**
 * Nilai override per tipe parameter SAJA (S85 R-05). Route R02 (versi baru)
 * memakai ini; hak kelas K/T diserahkan ke layanan (`createTemplateVersion`
 * memeriksa hanya kunci yang BERUBAH, D-62), karena editor selalu mengirim
 * seluruh lapisan override termasuk kunci K milik ADMIN yang tidak diubah.
 * Kunci tak dikenal dilewati di sini (layanan menolaknya).
 */
export function assertOverrideValues(overrides: Record<string, ParamValue>): void {
  const issues: ValidationIssue[] = [];
  for (const [key, value] of Object.entries(overrides)) {
    const def = PARAMS_BY_KEY.get(key);
    if (!def) continue; // sudah ditolak assertOverrideRights
    const problem = validateParamValue(def, value);
    if (problem) issues.push(issue(ptr("overrides", key), "type", problem));
  }
  if (issues.length) throw new StudioEngineError("SCHEMA_INVALID", "Override value does not match its parameter type", issues);
}
