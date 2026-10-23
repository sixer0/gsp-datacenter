/**
 * Pembacaan permintaan R09 POST (`ArtifactCreateRequest`, 01_specs.md §6.2).
 *
 * Dua bentuk badan:
 * 1. `application/json`: `{ agentId?, spec, mission?, formats? }`, maks
 *    `STUDIO_MAX_JSON_BYTES` (413 `PAYLOAD_TOO_LARGE`).
 * 2. `multipart/form-data` (aset raster, hanya `studio.image/v1`): medan
 *    `request` = teks JSON permintaan lengkap (atau medan terpisah `spec`,
 *    `mission`, `formats` sebagai teks JSON dan `agentId` teks), plus medan
 *    berkas `file` (maks `STUDIO_MAX_ASSET_BYTES`, 413 `ASSET_TOO_LARGE`).
 *    Seluruh badan multipart dibatasi `IMAGE_MAX_MULTIPART_BYTES` S53
 *    (`assertMultipartLength` dari header sebelum dibaca, D-61).
 *
 * Badan dibaca dengan batas byte yang ditegakkan saat streaming (juga untuk
 * badan chunked tanpa `content-length`) lewat helper bersama
 * `@/lib/studio/http` (IP-08). Galat dilempar sebagai StudioEngineError;
 * route memetakannya lewat `failure`.
 */
import { STUDIO_MAX_ASSET_BYTES, STUDIO_MAX_JSON_BYTES } from "@/lib/studio/contract/env";
import { STUDIO_OUTPUT_FORMATS, type StudioOutputFormat } from "@/lib/studio/contract/enums";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import type { ValidationIssue } from "@/lib/studio/contract/types/api";
import type { StudioMissionRef } from "@/lib/studio/contract/types/doc";
import { assertJsonContentType, isPlainObject, issue, parseJsonText, readBodyBytes } from "@/lib/studio/http";
import { isMultipart, readMultipartForm } from "@/lib/studio/http/multipart";

/** Skema artefak mandiri yang diterima R09 (studio.doc/v1 lewat R04). */
export const ARTIFACT_SCHEMA_IDS = ["studio.chart/v1", "studio.diagram/v1", "studio.image/v1", "studio.html/v1"] as const;
export type ArtifactSchemaId = (typeof ARTIFACT_SCHEMA_IDS)[number];

const MAX_AGENT_ID_CHARS = 80;
const MAX_MISSION_REF_CHARS = 200;
const ENVELOPE_KEYS = new Set(["agentId", "spec", "mission", "formats"]);
const MISSION_KEYS = new Set(["folder", "agentRequestId", "hermesTaskId"]);

export interface ArtifactUpload {
  /** Bagian berkas; tipe klien diabaikan (S53 mendeteksi dari magic bytes). */
  file: Blob;
  bytes: number;
}

export interface ParsedArtifactRequest {
  agentId?: string;
  spec: Record<string, unknown>;
  schemaId: ArtifactSchemaId;
  mission?: StudioMissionRef;
  /** Huruf besar, unik; kosong = default jenis artefak. */
  formats: StudioOutputFormat[];
  upload?: ArtifactUpload;
}

function tooLarge(limit: number): StudioEngineError {
  return new StudioEngineError("PAYLOAD_TOO_LARGE", `Request body exceeds ${limit} bytes`);
}

function textField(form: FormData, name: string): string | undefined {
  const v = form.get(name);
  if (v === null) return undefined;
  if (typeof v !== "string") throw new StudioEngineError("SCHEMA_INVALID", `Form field '${name}' must be text`, [issue(`/${name}`, "type", "must be a text field")]);
  return v;
}

async function readMultipart(req: Request, contentType: string): Promise<{ envelope: unknown; upload?: ArtifactUpload }> {
  // D-61 (S53): tolak dari header sebelum membaca badan; batas sama ditegakkan saat streaming.
  const form = await readMultipartForm(req, contentType);

  let envelope: unknown;
  const requestText = textField(form, "request");
  if (requestText !== undefined) {
    if (Buffer.byteLength(requestText, "utf8") > STUDIO_MAX_JSON_BYTES) throw tooLarge(STUDIO_MAX_JSON_BYTES);
    envelope = parseJsonText(requestText, "Form field 'request'");
  } else {
    const specText = textField(form, "spec");
    if (specText === undefined) {
      throw new StudioEngineError("SCHEMA_INVALID", "Multipart request needs a 'request' or 'spec' field", [
        issue("/spec", "required", "must have required property 'spec'"),
      ]);
    }
    if (Buffer.byteLength(specText, "utf8") > STUDIO_MAX_JSON_BYTES) throw tooLarge(STUDIO_MAX_JSON_BYTES);
    const e: Record<string, unknown> = { spec: parseJsonText(specText, "Form field 'spec'") };
    const missionText = textField(form, "mission");
    if (missionText !== undefined) e.mission = parseJsonText(missionText, "Form field 'mission'");
    const formatsText = textField(form, "formats");
    if (formatsText !== undefined) e.formats = parseJsonText(formatsText, "Form field 'formats'");
    const agentId = textField(form, "agentId");
    if (agentId !== undefined) e.agentId = agentId;
    envelope = e;
  }

  const files = form.getAll("file");
  if (files.length > 1) {
    throw new StudioEngineError("SCHEMA_INVALID", "Only one 'file' part is accepted", [issue("/file", "maxItems", "must have at most 1 file")]);
  }
  const f = files[0];
  if (f === undefined) return { envelope };
  if (typeof f === "string") {
    throw new StudioEngineError("SCHEMA_INVALID", "Form field 'file' must be a file", [issue("/file", "type", "must be a file part")]);
  }
  if (f.size > STUDIO_MAX_ASSET_BYTES) {
    throw new StudioEngineError("ASSET_TOO_LARGE", `Asset exceeds ${STUDIO_MAX_ASSET_BYTES} bytes`);
  }
  return { envelope, upload: { file: f, bytes: f.size } };
}

/** Validasi amplop (bukan isi spec; isi spec = validateSchema S48). */
function checkEnvelope(body: unknown): Omit<ParsedArtifactRequest, "upload"> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(body)) {
    throw new StudioEngineError("SCHEMA_INVALID", "Request body must be a JSON object", [issue("", "type", "must be object")]);
  }
  for (const k of Object.keys(body)) {
    if (!ENVELOPE_KEYS.has(k)) issues.push(issue(`/${k}`, "additionalProperties", "must NOT have additional properties"));
  }

  let agentId: string | undefined;
  if (body.agentId !== undefined) {
    if (typeof body.agentId !== "string" || body.agentId.length > MAX_AGENT_ID_CHARS) {
      issues.push(issue("/agentId", "type", `must be a string of at most ${MAX_AGENT_ID_CHARS} characters`));
    } else if (body.agentId.trim()) {
      agentId = body.agentId.trim();
    }
  }

  let schemaId: ArtifactSchemaId | undefined;
  const spec = body.spec;
  if (!isPlainObject(spec)) {
    issues.push(issue("/spec", spec === undefined ? "required" : "type", spec === undefined ? "must have required property 'spec'" : "must be object"));
  } else if (!(ARTIFACT_SCHEMA_IDS as readonly unknown[]).includes(spec.$schema)) {
    issues.push(issue("/spec/$schema", "enum", `must be one of ${ARTIFACT_SCHEMA_IDS.join(", ")} (documents go to /api/studio/documents)`));
  } else {
    schemaId = spec.$schema as ArtifactSchemaId;
  }

  let mission: StudioMissionRef | undefined;
  if (body.mission !== undefined) {
    if (!isPlainObject(body.mission)) {
      issues.push(issue("/mission", "type", "must be object"));
    } else {
      const m: StudioMissionRef = {};
      for (const [k, v] of Object.entries(body.mission)) {
        if (!MISSION_KEYS.has(k)) {
          issues.push(issue(`/mission/${k}`, "additionalProperties", "must NOT have additional properties"));
        } else if (typeof v !== "string" || !v.trim() || v.length > MAX_MISSION_REF_CHARS) {
          issues.push(issue(`/mission/${k}`, "type", `must be a non-empty string of at most ${MAX_MISSION_REF_CHARS} characters`));
        } else {
          m[k as keyof StudioMissionRef] = v.trim();
        }
      }
      if (Object.keys(m).length > 0) mission = m;
    }
  }

  const formats: StudioOutputFormat[] = [];
  if (body.formats !== undefined) {
    if (!Array.isArray(body.formats)) {
      issues.push(issue("/formats", "type", "must be array"));
    } else {
      body.formats.forEach((f, i) => {
        const up = typeof f === "string" ? f.trim().toUpperCase() : "";
        if (!(STUDIO_OUTPUT_FORMATS as readonly string[]).includes(up)) {
          issues.push(issue(`/formats/${i}`, "enum", `must be one of ${STUDIO_OUTPUT_FORMATS.join(", ")}`));
        } else if (formats.includes(up as StudioOutputFormat)) {
          issues.push(issue(`/formats/${i}`, "uniqueItems", "must NOT have duplicate items"));
        } else {
          formats.push(up as StudioOutputFormat);
        }
      });
    }
  }

  if (issues.length > 0 || !schemaId) {
    throw new StudioEngineError("SCHEMA_INVALID", "Request does not match the expected shape", issues);
  }
  return { agentId, spec: spec as Record<string, unknown>, schemaId, mission, formats };
}

/** Baca dan periksa amplop R09 POST (JSON atau multipart). */
export async function readArtifactRequest(req: Request): Promise<ParsedArtifactRequest> {
  const contentType = req.headers.get("content-type") || "";
  if (isMultipart(contentType)) {
    const { envelope, upload } = await readMultipart(req, contentType);
    const parsed = checkEnvelope(envelope);
    if (upload && parsed.schemaId !== "studio.image/v1") {
      throw new StudioEngineError("SCHEMA_INVALID", "A 'file' part is only accepted for studio.image/v1", [
        issue("/file", "not", "file upload is only valid with spec.$schema = studio.image/v1"),
      ]);
    }
    return upload ? { ...parsed, upload } : parsed;
  }
  assertJsonContentType(req); // S87 L-07: selain multipart wajib JSON (415)
  const raw = await readBodyBytes(req, STUDIO_MAX_JSON_BYTES);
  const body = parseJsonText(new TextDecoder("utf-8").decode(raw), "Request body");
  return checkEnvelope(body);
}
