/**
 * FIX-H6 (D-321/D-322; uji Hermes friksi C6): jawaban 404 JSON untuk path
 * `/api/studio/*` yang tidak ada.
 *
 * Sebelumnya Next menjawab 404 berbadan kosong tanpa `code` maupun
 * `x-correlation-id`, sehingga agen yang salah path (mis.
 * `POST /api/studio/documents/{id}/slots`) tidak tahu route yang benar.
 * Kini badan berbentuk §6.1 + medan agen:
 *   `{ error, code: "ROUTE_NOT_FOUND", message, hint, correlationId, details: { method, path, suggestion? } }`.
 *
 * `hint` berasal dari daftar kecil pemetaan salah-umum (regex terhadap path
 * relatif `/api/studio`), bukan pencocokan kabur. Tanpa kecocokan, `hint`
 * menyebut sumber daya Studio yang ada.
 *
 * FIX-HR2 (D-332 C9): `ROUTE_NOT_FOUND` kini anggota enum kontrak
 * `StudioErrorCode` dengan status di `STUDIO_ERROR_HTTP` (404), sehingga klien
 * bertipe mengenalnya. `HEAD` dijawab 404 dengan header yang sama TANPA badan
 * (RFC 9110 §9.3.2). Hanya runtime node.
 *
 * FIX-CLI (D-340, review DOC-3 m-5): `message`/`error`/`hint` berbahasa Indonesia awam,
 * konsisten dengan pesan Studio lain. Kode `ROUTE_NOT_FOUND`, kunci badan, `details.suggestion`,
 * route, dan contoh badan JSON di dalam `hint` tidak diubah (tetap persis, agar dapat disalin).
 */
import { STUDIO_ERROR_HTTP } from "@/lib/studio/contract/errors";
import type { StudioErrorCode } from "@/lib/studio/contract/enums";
import { NO_STORE, json, reqCtx } from "./context";
import { apiLog } from "./log";

export const ROUTE_NOT_FOUND_CODE = "ROUTE_NOT_FOUND" as const satisfies StudioErrorCode;
const ROUTE_NOT_FOUND_STATUS = STUDIO_ERROR_HTTP[ROUTE_NOT_FOUND_CODE];
export const ROUTE_NOT_FOUND_ROUTE = "/api/studio/[[...notfound]]";
const SOURCE = "studio.api.route-not-found";
const STUDIO_PREFIX = "/api/studio";
const PATH_ECHO_MAX = 200;

/** Sumber daya tingkat atas Studio (register 03 §12, R01-R20). */
export const STUDIO_RESOURCES: readonly string[] = [
  "GET|POST /api/studio/templates",
  "GET|POST /api/studio/documents",
  "POST /api/studio/chapters",
  "POST /api/studio/slots",
  "POST /api/studio/validate",
  "GET /api/studio/registry",
  "GET|POST /api/studio/assets",
  "GET|POST /api/studio/artifacts",
  "GET /api/studio/files/{id}",
  "GET /api/studio/render-env",
  "POST /api/studio/client-log",
];

export interface RouteSuggestion {
  /** Route yang benar, mis. `POST /api/studio/slots`. */
  route: string;
  /** Kalimat petunjuk untuk agen (Indonesia; route dan contoh JSON apa adanya). */
  hint: string;
}

/** Id dokumen/templat dari path hanya disalin ke petunjuk bila bentuknya aman. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

function idOr(raw: string | undefined, placeholder: string): string {
  return raw && SAFE_ID.test(raw) ? raw : placeholder;
}

interface Rule {
  re: RegExp;
  build: (m: RegExpMatchArray) => RouteSuggestion;
}

// Urutan penting: aturan khusus `documents/{id}/...` sebelum aturan umum.
const RULES: readonly Rule[] = [
  {
    re: /^\/documents\/([^/]+)\/slots(?:\/.*)?$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: "POST /api/studio/slots",
        hint: `Slot dikirim ke POST /api/studio/slots dengan badan { "target": { "documentId": "${id}" }, "slot": "<slotKey>", "payload": { ... } } (studio.slot/v2); id dokumen ditaruh di target.documentId, bukan di path. Slot berulang (bab) memakai POST /api/studio/chapters.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/chapters(?:\/.*)?$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: "POST /api/studio/chapters",
        hint: `Bab dikirim ke POST /api/studio/chapters dengan badan { "target": { "documentId": "${id}" }, "chapter": { ... } } (studio.chapter/v2); id dokumen ditaruh di target.documentId, bukan di path.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:renders|build|builds|export|exports|generate|outputs?|pdf|docx|html)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: `POST /api/studio/documents/${id}/render`,
        hint: `Buat berkas keluaran dengan POST /api/studio/documents/${id}/render dan badan { "scope": "document", "formats": ["docx", "pdf", "html"] }; berkasnya lalu diambil lewat GET /api/studio/files/{fileId}.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:validate|validation|lint|check)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: "POST /api/studio/validate",
        hint: `Uji kiriman tanpa menyimpan (dry-run) dengan POST /api/studio/validate memakai badan studio.chapter/v2 atau studio.slot/v2 yang sama dengan "target": { "documentId": "${id}" }; untuk melihat kekurangan revisi yang tersimpan pakai GET /api/studio/documents/${id}/completeness.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:history|versions)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return { route: `GET /api/studio/documents/${id}/revisions`, hint: `Riwayat revisi ada di GET /api/studio/documents/${id}/revisions.` };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/revisions\/([^/]+)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      const rev = /^\d{1,9}$/.test(m[2] ?? "") ? m[2] : "{n}";
      return {
        route: `GET /api/studio/documents/${id}?rev=${rev}`,
        hint: `Baca satu revisi dengan GET /api/studio/documents/${id}?rev=${rev} (atau /content?rev=${rev}); render ulang revisi itu dengan POST /api/studio/documents/${id}/revisions dan badan { "revisionNo": ${rev === "{n}" ? "<n>" : rev} }.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:outline|skeleton|toc|order|meta)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: `GET|PATCH /api/studio/documents/${id}/structure`,
        hint: `Struktur dokumen (urutan, kerangka, meta) dibaca dengan GET dan diubah dengan PATCH /api/studio/documents/${id}/structure ({ "op": "reorder"|"setOutline"|"setMeta"|..., "baseRevisionNo", "change" }).`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:blocks|paragraphs)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: `GET|PATCH /api/studio/documents/${id}/paragraphs/{pid}`,
        hint: `Satu blok dituju lewat /api/studio/documents/${id}/paragraphs/{pid} atau /api/studio/documents/${id}/blocks/{address}; seluruh isi dibaca lewat GET /api/studio/documents/${id}/content.`,
      };
    },
  },
  {
    re: /^\/documents\/([^/]+)\/(?:assets|images|uploads?)$/i,
    build: () => ({
      route: "POST /api/studio/assets",
      hint: "Unggah gambar dengan POST /api/studio/assets (multipart `file` atau { mime, dataBase64 }), lalu rujuk sha256 yang dikembalikan di isi bab atau slot.",
    }),
  },
  {
    re: /^\/(?:slot|slots\/.+)$/i,
    build: () => ({
      route: "POST /api/studio/slots",
      hint: 'Pakai POST /api/studio/slots (jamak, tanpa sub-path); kunci slot ditaruh di badan: { "target": { "documentId": "{id}" }, "slot": "<slotKey>", "payload": { ... } }.',
    }),
  },
  {
    re: /^\/(?:chapter|chapters\/.+)$/i,
    build: () => ({
      route: "POST /api/studio/chapters",
      hint: 'Pakai POST /api/studio/chapters (jamak, tanpa sub-path); kunci bab ditaruh di badan: { "target": { "documentId": "{id}" }, "chapter": { "key": "...", ... } }.',
    }),
  },
  {
    re: /^\/(?:document|doc|docs)(?:\/(.*))?$/i,
    build: (m) => ({
      route: m[1] ? `/api/studio/documents/${idOr(m[1].split("/")[0], "{id}")}` : "GET|POST /api/studio/documents",
      hint: "Nama sumber daya dokumen berbentuk jamak: /api/studio/documents dan /api/studio/documents/{id}.",
    }),
  },
  {
    re: /^\/templates\/([^/]+)\/(?:versions|history)$/i,
    build: (m) => {
      const id = idOr(m[1], "{id}");
      return {
        route: `GET /api/studio/templates/${id}`,
        hint: `Daftar versi templat ada di GET /api/studio/templates/${id} (medan "versions"); pilih satu dengan ?version=n. Kerangka slot ada di GET /api/studio/templates/${id}/skeleton.`,
      };
    },
  },
  {
    re: /^\/(?:template|tpl)(?:\/.*)?$/i,
    build: () => ({ route: "GET|POST /api/studio/templates", hint: "Nama sumber daya templat berbentuk jamak: /api/studio/templates dan /api/studio/templates/{id}." }),
  },
  {
    re: /^\/(?:render|renders|build|export)(?:\/.*)?$/i,
    build: () => ({
      route: "POST /api/studio/documents/{id}/render",
      hint: 'Render dilakukan per dokumen: POST /api/studio/documents/{id}/render dengan { "scope": "document", "formats": [...] }. Kiriman isi tidak pernah memicu render (D-247).',
    }),
  },
  {
    re: /^\/(?:schema|schemas)(?:\/.*)?$/i,
    build: () => ({
      route: "GET /api/studio/registry?kind=schema&schemaId={schemaId}",
      hint: "JSON Schema tersedia di GET /api/studio/registry?kind=schema&schemaId={schemaId}; GET /api/studio/registry?kind=slots memuat aturan slot.",
    }),
  },
  {
    re: /^\/(?:asset|images?|uploads?)(?:\/.*)?$/i,
    build: () => ({ route: "GET|POST /api/studio/assets", hint: "Gambar dikelola lewat /api/studio/assets (POST untuk mengunggah, GET ?sha256= untuk membaca metadata)." }),
  },
  {
    re: /^\/artifact(?:\/.*)?$/i,
    build: () => ({ route: "GET|POST /api/studio/artifacts", hint: "Nama sumber daya artefak berbentuk jamak: /api/studio/artifacts." }),
  },
  {
    re: /^\/(?:file|files)$/i,
    build: () => ({ route: "GET /api/studio/files/{id}", hint: "Berkas diambil satu per satu dengan GET /api/studio/files/{fileId} (id berasal dari keluaran render)." }),
  },
  {
    re: /^\/completeness$/i,
    build: () => ({ route: "GET /api/studio/documents/{id}/completeness", hint: "Kelengkapan diperiksa per dokumen: GET /api/studio/documents/{id}/completeness." }),
  },
  {
    re: /^\/(?:log|logs|client-logs|error|errors)$/i,
    build: () => ({ route: "POST /api/studio/client-log", hint: "Galat di sisi klien dikirim ke POST /api/studio/client-log." }),
  },
  {
    re: /^\/(?:health|env|renderenv|render_env|status)$/i,
    build: () => ({ route: "GET /api/studio/render-env", hint: "Kesiapan mesin render ada di GET /api/studio/render-env." }),
  },
];

/** Path relatif terhadap `/api/studio` (tanpa garis miring akhir; `/` bila kosong). */
export function studioRelativePath(pathname: string): string {
  let p = pathname;
  if (p.toLowerCase().startsWith(STUDIO_PREFIX)) p = p.slice(STUDIO_PREFIX.length);
  p = p.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return p === "" ? "/" : p.startsWith("/") ? p : `/${p}`;
}

/** Saran route untuk path salah-umum, atau null bila tidak ada pemetaan. */
export function suggestStudioRoute(pathname: string): RouteSuggestion | null {
  const rel = studioRelativePath(pathname);
  // Regex tanpa peka huruf untuk nama sumber daya; id diambil dari path asli.
  for (const rule of RULES) {
    const m = rel.match(rule.re);
    if (m) return rule.build(m);
  }
  return null;
}

function genericHint(): string {
  return `Route Studio ini tidak ada. Sumber daya Studio yang tersedia: ${STUDIO_RESOURCES.join("; ")}. Sub-route dokumen ada di bawah /api/studio/documents/{id}/ (revisions, structure, completeness, content, render, paragraphs/{pid}, blocks/{address}).`;
}

function clip(s: string, max = PATH_ECHO_MAX): string {
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

/**
 * Respons 404 JSON + `x-correlation-id` untuk path Studio yang tidak ada.
 * Pemanggil (route catch-all) wajib sudah lolos `requireSession`.
 */
export function routeNotFound(req: Request): Response {
  const ctx = reqCtx(req, ROUTE_NOT_FOUND_ROUTE, SOURCE);
  let pathname = "/api/studio";
  try {
    pathname = new URL(req.url).pathname;
  } catch {
    /* URL tak terbaca: pakai prefiks saja */
  }
  const path = clip(pathname);
  const suggestion = suggestStudioRoute(pathname);
  const message = `Route Studio tidak ditemukan untuk ${ctx.method} ${path}`;
  const hint = suggestion ? suggestion.hint : genericHint();

  apiLog({
    ...ctx,
    level: "warn",
    message,
    code: ROUTE_NOT_FOUND_CODE,
    status: ROUTE_NOT_FOUND_STATUS,
    context: { path, ...(suggestion ? { suggestion: suggestion.route } : {}) },
  });

  const res = json(
    {
      error: message,
      code: ROUTE_NOT_FOUND_CODE,
      message,
      hint,
      correlationId: ctx.correlationId,
      details: { method: ctx.method, path, ...(suggestion ? { suggestion: suggestion.route } : {}) },
    },
    ROUTE_NOT_FOUND_STATUS,
    ctx,
    NO_STORE,
  );
  // HEAD: status + header sama dengan GET, tanpa badan.
  return ctx.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
}
