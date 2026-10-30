/**
 * Env dan konstanta Studio (01_specs.md §7.1, C01-C17) serta `getStudioEnv`.
 *
 * Penjaga KT-03 / §14.1 butir 6: `STORAGE_ROOT_FORBIDDEN` bila akar Studio sama
 * dengan atau berada di dalam `SHARED_WORKSPACE` produksi. Pengecualian: bila
 * `SHARED_WORKSPACE` sendiri berada di dalam `data/` repo (sandbox uji E2E S80),
 * keduanya boleh menunjuk akar yang sama.
 *
 * Modul ini sengaja tanpa impor statis modul Node agar konstanta (C07-C17)
 * aman diimpor komponen klien; `node:path` diambil saat `getStudioEnv` /
 * `isPathInside` dipanggil (khusus server).
 */
import { StudioEngineError } from "./errors";

function nodePath(): typeof import("node:path") {
  return process.getBuiltinModule("node:path");
}

// ── Env (default) ────────────────────────────────────────────────────────
/** C01 */
export const DEFAULT_SOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.com";
/** C02 — relatif `process.cwd()` = akar repo. */
export const DEFAULT_STUDIO_WORKSPACE_ROOT = "data/studio-workspace";
/** C03 — revisi 1234 = playwright-core@1.62.1 browsers.json. */
export const DEFAULT_STUDIO_CHROMIUM_PATH =
  "C:\\Users\\TRIAL\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";
/** C04 */
export const DEFAULT_STUDIO_RENDER_ENV_MANIFEST = "render-env/manifest.json";
/** C05 — hipotesis untuk 102 halaman; S81 mengukur. */
export const DEFAULT_STUDIO_SOFFICE_TIMEOUT_MS = 180000;
/** C06 — A3; nilai > 2 di-clamp ke 2. */
export const DEFAULT_STUDIO_SOFFICE_MAX_INSTANCES = 2;
export const STUDIO_SOFFICE_MAX_INSTANCES_CAP = 2;

// ── Konstanta ────────────────────────────────────────────────────────────
/** C07 — per operasi halaman. */
export const STUDIO_CHROMIUM_TIMEOUT_MS = 30000;
/** C08 */
export const STUDIO_RENDER_JOB_TIMEOUT_MS = 600000;
/** C09 — 5 MiB. */
export const STUDIO_MAX_JSON_BYTES = 5242880;
/** C10 — 20 MiB per aset. */
export const STUDIO_MAX_ASSET_BYTES = 20971520;
/** C11 */
export const STUDIO_MAX_ASSETS_PER_DOC = 200;
/** C12 */
export const STUDIO_MAX_BLOCKS_PER_DOC = 20000;
/** C13 — per tabel. */
export const STUDIO_MAX_TABLE_CELLS = 5000;
/** C14 — per run. */
export const STUDIO_MAX_RUN_CHARS = 20000;
/** C15 — cek render-env di-cache 5 menit. */
export const STUDIO_READINESS_CACHE_MS = 300000;

/** C16 — satu sumber path route R01-R11 (§6.2) untuk UI/S68 (+R12-R20 SR-04, +R21-R23 DC-05). */
export const STUDIO_ROUTES = {
  R01: "/api/studio/templates",
  R02: "/api/studio/templates/[id]",
  R03: "/api/studio/registry",
  R04: "/api/studio/documents",
  R05: "/api/studio/documents/[id]",
  R06: "/api/studio/documents/[id]/blocks/[address]",
  R07: "/api/studio/documents/[id]/revisions",
  R08: "/api/studio/validate",
  R09: "/api/studio/artifacts",
  R10: "/api/studio/files/[id]",
  R11: "/api/studio/render-env",
  // Delta SR-04 (register §12): route struktur v2 R12-R20.
  R12: "/api/studio/chapters",
  R13: "/api/studio/slots",
  R14: "/api/studio/documents/[id]/structure",
  R15: "/api/studio/documents/[id]/completeness",
  R16: "/api/studio/documents/[id]/paragraphs/[pid]",
  R17: "/api/studio/documents/[id]/render",
  R18: "/api/studio/assets",
  R19: "/api/studio/templates/[id]/skeleton",
  R20: "/api/studio/documents/[id]/content",
  // Delta DC-05 (AM-06; register 05 §9): retrieval kontrak, teks penuh, cek draf.
  R21: "/api/studio/contracts",
  R22: "/api/studio/search",
  R23: "/api/studio/drafts/check",
} as const;
export type StudioRouteId = keyof typeof STUDIO_ROUTES;

/** Isi segmen dinamis `[id]`/`[address]`/`[pid]` (dienkode `encodeURIComponent`, §4.1). */
export function studioRoutePath(id: StudioRouteId, params: { id?: string; address?: string; pid?: string } = {}): string {
  return STUDIO_ROUTES[id]
    .replace("[id]", encodeURIComponent(params.id ?? ""))
    .replace("[address]", encodeURIComponent(params.address ?? ""))
    .replace("[pid]", encodeURIComponent(params.pid ?? ""));
}

/** C17 — 5 id skema §3 + SID01-SID05 kontrak v2 (delta SR-04; SID06 norm/v2 tidak dipublikasikan). */
export const STUDIO_SCHEMA_IDS = [
  "studio.doc/v1",
  "studio.chart/v1",
  "studio.diagram/v1",
  "studio.image/v1",
  "studio.html/v1",
  "studio.doc/v2",
  "studio.chapter/v2",
  "studio.slot/v2",
  "studio.template/v2",
  "studio.skeleton/v1",
] as const;
export type StudioSchemaId = (typeof STUDIO_SCHEMA_IDS)[number];
export const STUDIO_SCHEMA_BASE_URL = "https://hq.gsp.local/studio/schema";
export const STUDIO_COMMON_SCHEMA_ID = "common/v1";

// ── Delta SR-04: konstanta struktur v2 (register §16.1, C18-C33c) ──────────
// C29-C31 ada di schema/v2/forbidden.ts; C32a dan C33 milik L/registry/slots.ts (SR-05).
/** C18 */
export const SLOT_KEY_PATTERN = "^[a-z][a-zA-Z0-9]{0,31}$";
/** C19 */
export const PID_PATTERN = "^[a-z0-9][a-z0-9-]{2,63}$";
/** C20 */
export const PID_GENERATED_PREFIX = "p-";
/** C21 — base32 Crockford huruf kecil. */
export const PID_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
/** C22 */
export const PID_RANDOM_LENGTH = 10;
/** C23 — maks 64 karakter. */
export const DOC_KEY_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";
/** C24 — kunci advisory `pg_advisory_xact_lock(hashtext('studio-doc:' || documentId))`. */
export const STUDIO_LOCK_DOC_PREFIX = "studio-doc:";
/** C25 — kunci pembuatan `'studio-mdoc:' || missionFolder || ':' || docKey`. */
export const STUDIO_LOCK_MISSION_DOC_PREFIX = "studio-mdoc:";
/** C26 — kunci peta `assets` kiriman v2. */
export const ASSET_KEY_PATTERN = "^[a-z0-9][a-z0-9-]{0,63}$";
/** C27 — rujukan aset langsung. */
export const ASSET_REF_PATTERN = "^sha256:[0-9a-f]{64}$";
/** C28 */
export const STUDIO_SUBMIT_TX_TIMEOUT_MS = 60000;
/** C32 */
export const STUDIO_COMMON_V2_SCHEMA_ID = "common/v2";
/** C33a — kunci bab slot `chapter`. */
export const CHAPTER_KEY_NUMERIC_PATTERN = "^[1-9][0-9]{0,2}$";
/** C33b — kunci bab slot `appendix`. */
export const CHAPTER_KEY_LETTER_PATTERN = "^[A-Z]$";
/** C33c — `relPath` M13 = `assets/<sha256[0..2]>/<sha256>.<png|jpg>` relatif `STUDIO_WORKSPACE_ROOT`. */
export const STUDIO_ASSET_REL_DIR = "assets";

// ── Delta DC-05: konstanta document contract (register 05 §14.1, C34-C57) ──
// C46/C47 milik L/http/quota.ts (DC-19); C58 milik L/registry/contracts.ts (DC-06);
// C59/C60 milik L/registry/charts.ts (DC-26).
/** C34 — kartu kanban `t_` + 8 heksa (inv §4 K1 :290). */
export const CARD_ID_PATTERN = "^t_[0-9a-f]{8}$";
/** C35 — butir `key`, `taskRef`, `dependsOn`, `evidence.item` (label non-heksa). */
export const CONTRACT_KEY_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$";
/** C36 — pelaku (agen/profil), huruf kecil (CA-1). */
export const CONTRACT_ACTOR_PATTERN = "^[a-z0-9][a-z0-9._-]{0,63}$";
/** C37 — `reportedAt`: tanggal, atau tanggal + waktu ber-zona (detik dan milidetik opsional). */
export const CONTRACT_REPORTED_AT_PATTERN =
  "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])(T([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,3})?)?(Z|[+-]([01]\\d|2[0-3]):[0-5]\\d))?$";
/** C38 — awalan sha256 bukti (8..64 heksa kecil). */
export const CONTRACT_SHA_PREFIX_PATTERN = "^[0-9a-f]{8,64}$";
/** C39 — batas larik dan panjang teks rujukan payload `contractRecord`. */
export const CONTRACT_LIMITS = { cardIds: 64, items: 500, dependsOn: 32, refs: 100, evidence: 200, refText: 500 } as const;
/** C40 — format bawaan render dokumen ber-contractKind tanpa `formats`/`figures` (KD-41). */
export const CONTRACT_DEFAULT_RENDER_FORMATS = ["HTML"] as const;
/** C41 — konfigurasi teks penuh Postgres. */
export const STUDIO_FTS_CONFIG = "simple";
/** C42 — potongan `textPlain` untuk kolom `tsv` (KD-37). */
export const STUDIO_FTS_MAX_CHARS = 100000;
/** C43 — batas R22. */
export const SEARCH_LIMITS = { qMin: 2, qMax: 200, takeDefault: 20, takeMax: 100 } as const;
/** C44 — opsi `ts_headline` cuplikan R22. */
export const SEARCH_SNIPPET_OPTIONS = "MaxWords=30, MinWords=10, ShortWord=2, MaxFragments=2, StartSel=[[, StopSel=]]";
/** C45 — batas R21 (selaras `documents/route.ts:81-82`). */
export const CONTRACT_QUERY_LIMITS = { takeDefault: 50, takeMax: 200, statusListMax: 8 } as const;
/** C48 — sisa kuota bucket (QH-02). */
export const STUDIO_QUOTA_REMAINING_HEADER = "X-Studio-Quota-Remaining";
/** C49 — nama bucket E53 yang dilaporkan (QH-02, QH-04). */
export const STUDIO_QUOTA_BUCKET_HEADER = "X-Studio-Quota-Bucket";
/** C50 — nama final berkas pada setiap respons R10 (FN-06). */
export const STUDIO_FINAL_FILENAME_HEADER = "X-Studio-Final-Filename";
/** C51 — `<docNumberSafe>_rev<n>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>` (FN-01). */
export const FINAL_FILENAME_PATTERN =
  "^([A-Za-z0-9](?:[A-Za-z0-9.-]{0,78}[A-Za-z0-9])?)_rev(0|[1-9][0-9]{0,5})_([0-9]{8}T[0-9]{6}Z)_([0-9a-f]{8})\\.(docx|pdf|html|svg|png)$";
/** C52 — panjang maks `docNumberSafe` (FN-02). */
export const FINAL_DOC_NUMBER_MAX = 80;
/** C53 — awalan nama final berkas artefak (FN-03). */
export const FINAL_ARTIFACT_PREFIX = "ART-";
/** C54 — batas R23 / CLI draf (413 DR-09/DR-10). */
export const DRAFT_LIMITS = { bodyBytes: 4194304, maxChars: 2000000, maxBlocks: 20 } as const;
/** C55 — kunci kepala draf MD (§11.1). */
export const DRAFT_HEADER_KEYS = ["tujuan", "langkah-berikut", "basis"] as const;
/** C56 — `basis` draf: `<documentId>@rev<n>` atau `baru`. */
export const DRAFT_BASIS_PATTERN = "^(?:([a-z0-9]{20,40})@rev([1-9][0-9]{0,5})|baru)$";
/** C57 — `$schema` blok draf yang diterima. */
export const DRAFT_ACCEPTED_SCHEMAS = ["studio.doc/v2", "studio.chapter/v2", "studio.slot/v2"] as const;

// ── getStudioEnv ─────────────────────────────────────────────────────────

export interface StudioEnv {
  /** Absolut. */
  sofficePath: string;
  /** Absolut. */
  workspaceRoot: string;
  /** Absolut. */
  chromiumPath: string;
  /** Absolut. */
  renderEnvManifestPath: string;
  sofficeTimeoutMs: number;
  /** 1..2. */
  sofficeMaxInstances: number;
}

let cached: StudioEnv | null = null;

function samePath(a: string, b: string): boolean {
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** true bila `child` sama dengan atau berada di dalam `parent` (keduanya absolut). */
export function isPathInside(child: string, parent: string): boolean {
  if (samePath(child, parent)) return true;
  const path = nodePath();
  const rel = path.relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function envPath(name: string, fallback: string, cwd: string): string {
  const path = nodePath();
  const raw = process.env[name];
  const v = raw && raw.trim() ? raw.trim() : fallback;
  return path.resolve(cwd, v);
}

/** Baca env sekali (di-cache). Melempar STORAGE_ROOT_FORBIDDEN (KT-03). */
export function getStudioEnv(): StudioEnv {
  if (cached) return cached;
  const path = nodePath();
  const cwd = process.cwd();
  const workspaceRoot = envPath("STUDIO_WORKSPACE_ROOT", DEFAULT_STUDIO_WORKSPACE_ROOT, cwd);

  const sharedRaw = process.env.SHARED_WORKSPACE;
  if (sharedRaw && sharedRaw.trim()) {
    const shared = path.resolve(cwd, sharedRaw.trim());
    const repoData = path.resolve(cwd, "data");
    const sharedIsSandbox = isPathInside(shared, repoData);
    if (!sharedIsSandbox && isPathInside(workspaceRoot, shared)) {
      throw new StudioEngineError(
        "STORAGE_ROOT_FORBIDDEN",
        "STUDIO_WORKSPACE_ROOT must not equal or be inside SHARED_WORKSPACE",
      );
    }
  }

  const maxInstances = Math.min(
    STUDIO_SOFFICE_MAX_INSTANCES_CAP,
    envInt("STUDIO_SOFFICE_MAX_INSTANCES", DEFAULT_STUDIO_SOFFICE_MAX_INSTANCES),
  );

  cached = {
    sofficePath: envPath("SOFFICE_PATH", DEFAULT_SOFFICE_PATH, cwd),
    workspaceRoot,
    chromiumPath: envPath("STUDIO_CHROMIUM_PATH", DEFAULT_STUDIO_CHROMIUM_PATH, cwd),
    renderEnvManifestPath: envPath("STUDIO_RENDER_ENV_MANIFEST", DEFAULT_STUDIO_RENDER_ENV_MANIFEST, cwd),
    sofficeTimeoutMs: envInt("STUDIO_SOFFICE_TIMEOUT_MS", DEFAULT_STUDIO_SOFFICE_TIMEOUT_MS),
    sofficeMaxInstances: Math.max(1, maxInstances),
  };
  return cached;
}

/** Untuk uji: lupakan cache sehingga env dibaca ulang. */
export function resetStudioEnvCache(): void {
  cached = null;
}
