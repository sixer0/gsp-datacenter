# Referensi API — GSP Agent Headquarter

Seluruh endpoint berada di `src/app/api/**/route.ts` (Next.js App Router). Dokumentasi ini
mengelompokkan endpoint per domain, dengan contoh request/response untuk endpoint utama.

---

## 1. Autentikasi & Otorisasi

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth (Google OAuth). Callback: `/api/auth/callback/google` |
| `/api/auth/login` | POST | Login manual (dev/RBAC) |
| `/api/brahma/rbac/login` | POST | Login RBAC WebUI (username/password) |
| `/api/brahma/rbac/signup` | POST | Signup user RBAC (role USER, pin ke profil baru) |
| `/api/brahma/rbac` | GET/POST | Daftar/kelola user RBAC (admin) |
| `/api/brahma/rbac/users/[id]` | GET/PUT/DELETE | Detail/edit/hapus user RBAC |

**Skema auth middleware** (`src/middleware.ts`):
- Dev mode → bypass. Header `x-internal-secret: <INTERNAL_API_SECRET>` → lolos.
- Selain itu butuh sesi NextAuth JWT; API → `401`, halaman → redirect `/login`.

---

## 2. Agents (roster)

### `GET /api/agents`
Daftar agen fleet. Menggabungkan **roster statis** (`src/app/api/agents/route.ts`) dengan
**user WebUI dinamis** (tabel `WebUiUser`, role USER di-scope ke profil sendiri).

Contoh respons (terpotong):
```json
[
  {
    "id": "gsp-vendor-crawler-orchestrator",
    "profile": "gsp-vendor-crawler-orchestrator",
    "name": "Vendor Crawler Orchestrator",
    "emoji": "\ud83d\udd78\ufe0f",
    "role": "Controller",
    "model": "deepseek/deepseek-v4-flash-0731",
    "level": 3,
    "group": "CONTROLLER"
  }
]
```

---

## 3. Brahma Control Hub (`/api/brahma/*`)

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/brahma/activity` | GET | Activity feed (dari `AgentEvent`) |
| `/api/brahma/briefing` | GET | Daily brief hari ini (`Brief`) |
| `/api/brahma/briefing/settings` | GET/PUT | Pengaturan brief (jam, dsb.) |
| `/api/brahma/cost` | GET | Ringkasan biaya agen |
| `/api/brahma/crons` | GET | Daftar cron (dimirror dari Hermes via `DataStore`) |
| `/api/brahma/health` | GET | Status kesehatan bridge/agen |
| `/api/brahma/memory` | GET/POST | Memori: GET baca, POST simpan (dispatch ke librarian `gsp-librarian`) |
| `/api/brahma/requests` | GET | Daftar `AgentRequest` (riwayat dispatch) |
| `/api/brahma/requests/[id]` | GET/PUT | Detail request; PUT untuk approve/reject/update status |
| `/api/brahma/tasks` | GET | Tugas kanban yang dimirror (`HermesTask`) |
| `/api/brahma/dispatch` | POST | **Kirim tugas baru ke agen** (lihat contoh di bawah) |

### `POST /api/brahma/dispatch`
Membuat `AgentRequest` baru.

```json
{
  "title": "Riset kompetitor",
  "prompt": "Analisis 5 kompetitor teratas dan buat ringkasan 500 kata.",
  "profile": "gsp-data-analyst",
  "sideEffecting": false
}
```

- `sideEffecting: false` → status `queued` (dijalankan bridge).
- `sideEffecting: true` → status `awaiting_approval` (menunggu approval di inbox).
- `profile` kosong/`null` → profil default (`brahma`).

---

## 4. Information Library

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/information-library` | GET | Entri memori gabungan: scope `wiki` (HermesMemory) + `workspace` (file `.md` shared GSP workspace) + `vault` (staging librarian). Param: `scope`, `type`, `q`, `statusCounts` |
| `/api/information-library/file` | GET | Baca file dari workspace/vault (`?path=…`), proteksi path traversal (403) |

Contoh respons `GET /api/information-library?scope=all` (terpotong):
```json
{
  "entries": [
    {
      "id": "docs/2026-08-24_riset",
      "scope": "workspace",
      "type": "doc",
      "title": "Riset Kompetitor",
      "path": "docs/2026-08-24_riset/README.md",
      "files": ["data.json", "corpus.md"]
    }
  ],
  "statusCounts": { "active": 10, "archived": 2 }
}
```

---

## 5. Orkestrasi

### `GET /api/orchestration`
Graf + timeline telemetry lintas profil (dari `OrchestrationRecord`). Mendukung filter
`fromAgent`, `toAgent`, `status`, `kind`, `runId`.

Contoh entri:
```json
{
  "id": "uuid",
  "runId": "run-2026-08-24-01",
  "fromAgent": "brahma",
  "toAgent": "gsp-data-analyst",
  "kind": "dispatch",
  "status": "done",
  "taskId": "cm…",
  "taskTitle": "Riset kompetitor",
  "message": "Hasil tersimpan di docs/…",
  "artifactPath": "docs/2026-08-24_riset/",
  "meta": { "model": "deepseek/deepseek-v4-flash-0731" }
}
```

---

## 6. Tasks & User Access

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/tasks` | GET/POST | Kanban tasks (mirror `HermesTask`); POST = tambah task (dispatch kind kanban) |
| `/api/user-access` | GET/POST | Daftar/tambah akses user |
| `/api/user-access/[id]` | GET/PUT/DELETE | Detail/edit/hapus akses user |

---

## 7. Content OS (X/Twitter)

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/x-content` | GET/POST | Draf konten X (`Draft`) |
| `/api/x-content/calendar` | GET | Kalender konten (`ContentCalendar`) |
| `/api/x-content/request` | POST | Request pembuatan konten |
| `/api/x-content/tweak` | POST | Revisi/tweak konten |
| `/api/x-content/top-tweets` | GET | Tweet terbaik |
| `/api/x-content/viral-score` | GET/POST | Skor viral |
| `/api/x-content/generate-visual` | POST | Generate visual |
| `/api/x-content/visual` | GET | Ambil visual |
| `/api/x-content/feedback` | POST | Feedback rating |
| `/api/x-content/mark-posted` | POST | Tandai terposting |
| `/api/x-analytics` | GET | Analitik X |
| `/api/trends` | GET | Tren |
| `/api/trends/snipe` | POST | Ambil peluang tren |
| `/api/trends/update` | POST | Update data tren |
| `/api/score` | GET | Skor engagement |
| `/api/scrape-metrics` | GET | Metrik hasil scrape |

## 8. YouTube

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/youtube/ideas` | GET | Daftar ide video (`YoutubeIdea`) |
| `/api/youtube/ideas/generate` | POST | Generate ide baru |
| `/api/youtube/ideas/update` | PUT | Update ide |
| `/api/youtube/ideas/dismiss` | POST | Tolak ide |
| `/api/youtube/scripts` | GET | Daftar skrip (`YoutubeScript`) |
| `/api/youtube/generate` | POST | Generate skrip |
| `/api/youtube/performance` | GET | Performa kanal |
| `/api/youtube/outliers` | GET | Outlier data (dipakai `scanner/outlier-scanner.js`) |
| `/api/youtube-scrape` | GET | Scrape data YouTube |

## 9. Articles & Longform

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/articles` | GET/POST | Artikel (`Article`) |
| `/api/articles/generate-article` | POST | Generate artikel |
| `/api/articles/generate-titles` | POST | Generate judul |
| `/api/articles/generate-qt` | POST | Generate quote-tweet |
| `/api/articles/generate-visuals` | POST | Generate visual |
| `/api/articles/revise` | POST | Revisi artikel |
| `/api/articles/saved-titles` | GET | Judul tersimpan (`SavedTitle`) |
| `/api/articles/scrape` | POST | Scrape sumber artikel |
| `/api/longform` | GET/POST | Skrip longform (`LongformScript`) |
| `/api/longform/generate` | POST | Generate skrip longform |
| `/api/longform/tweak` | POST | Tweak skrip |

## 10. Client Pulse

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/client-pulse` | GET | Papan kesehatan klien (klien, chat, analisis, alert) |
| `/api/client-pulse/map-chat` | POST | Petakan Telegram chat ke klien (admin, `CLIENT_PULSE_ADMIN_SECRET`) |

## 11. Lainnya

| Endpoint | Metode | Keterangan |
|---|---|---|
| `/api/agent-bus` | GET/POST | Bus pesan antar-agen (`AgentBusMessage`) |
| `/api/agent-chat` | POST | Chat ke agen |
| `/api/cache/clear` | POST | Bersihkan cache |
| `/api/cron/x-stats` | GET | Cron Vercel harian statistik X (dilindungi `CRON_SECRET`) |
| `/api/garden` | GET | Data garden (publik) |
| `/api/home` | GET | Data dashboard home |
| `/api/ideas` | GET/POST | Papan ide (`Idea`) |
| `/api/watchlist-radar` | GET | Watchlist radar |
| `/api/watchlist-radar/update` | POST | Update watchlist |

---

## Catatan Umum

- **Auth:** kecuali endpoint yang di-skip middleware (auth, garden, statis), semua butuh sesi.
- **Internal:** route internal membaca header `x-internal-secret` atau query `?secret=` (`CRON_SECRET`).
- **Format:** seluruh API JSON; error standar `{ "error": "…" }` dengan status HTTP sesuai.
- **Lokasi kode:** tiap file `route.ts` mendokumentasikan perilaku spesifiknya — referensi ini
  adalah peta; file adalah sumber kebenaran.

---

## 12. Studio (`/api/studio/*`)

Doc Artifact Studio mengubah ISI terstruktur menjadi DOCX/PDF/HTML/SVG/PNG bergaya DATUM, dengan
revisi bernomor, kelengkapan per slot, dan penyuntingan per pid. **Prinsip (D-139):** agen hanya
mengirim konten (`studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`) dan membaca/menyunting
lewat API; semua keputusan tampilan milik templat dan mesin. Agen menyebut templat dengan slug,
tidak pernah dengan parameter; medan tampilan ditolak `400 SCHEMA_INVALID`
(`checkId: "DISPLAY_FIELD"`). **Build hanya lewat R17 (D-247):** kiriman (R04, R12, R13) dan sunting
(R06, R14, R16) tidak pernah membangun berkas; medan `render` di badannya ditolak
`400 SCHEMA_INVALID` `checkId: "RENDER_FIELD"` (pointer `/render`, pesan menunjuk
`POST /api/studio/documents/{id}/render`). Panduan agent lengkap (contoh E0, E2, E3a-E3c tervalidasi, alamat,
pid, galat): `docs/STUDIO-AGENT-GUIDE.md`. Kontrak: `src/lib/studio/contract/**`; konstanta route
`STUDIO_ROUTES` (`contract/env.ts`); skema JSON: `GET /api/studio/registry?kind=schema`.

**Auth (semua route, termasuk GET):** `requireSession` di baris pertama handler. Sesi NextAuth,
cookie `gsp_hq_session`, atau header `x-internal-secret: <INTERNAL_API_SECRET>` (agent; kirim
`agentId` di badan sebagai label). Anonim → `401 {"error":"Unauthorized"}`. `createdBy`,
`requestedBy`, dan `lastFilledBy` berprefiks jenis pemanggil: `user:<username>`,
`google:<email>`, `agent:<agentId>`, atau `anonymous-internal`. `agentId` hanya label klaim.

**Galat:** `{ "error": "<pesan Indonesia yang menyebut perbaikan>", "code": "<StudioErrorCode>",
"details"?: ... }`; `details` validasi = `[{ pointer, keyword, message, checkId? }]` dengan
`checkId` `DISPLAY_FIELD`, `V1_FIELD`, `RENDER_FIELD`, `SKELETON_*`, `PID_OP_KIND`, atau id cek
by-construction, plus `mergedPointer` opsional (kiriman bab/slot: `pointer` relatif badan
`/chapter/...` atau `/payload`, `mergedPointer` = lokasi di dokumen tergabung). 68 kode di
`STUDIO_ERROR_CODES`, HTTP di `STUDIO_ERROR_HTTP` (`contract/errors.ts`). Urutan evaluasi:
transport (413 `PAYLOAD_TOO_LARGE` > 5 MiB, 415 `UNSUPPORTED_MEDIA_TYPE`, 400 `JSON_MALFORMED`,
JSON > 64 tingkat 400 `SCHEMA_INVALID` `maxDepth`) → skema → target/templat → gerbang kepercayaan
(templat TERBATAS bagi non-ADMIN: `403 FORBIDDEN`, `details.reason = "TEMPLATE_RESTRICTED"`;
`x.benchmark`/`x.enforcement`/`x.lintEnforcement` pemanggil tak tepercaya dibuang + REPORT
`BENCHMARK_MARKER_STRIPPED`/`ENFORCEMENT_OVERRIDE_STRIPPED`) → `ingest.inlineFormat` (v1) →
struktur 422 → lingkup/pid (kepemilikan pid sebelum cek idempoten) → aset → by-construction 422
(satu gerbang untuk R04, R12, R13, R16, R06, R14) → simpan → lint rilis (tidak menahan berkas).
Meta kiriman mengisi medan yang masih kosong; `409 META_CONFLICT` hanya bila medan terisi di kedua
sisi dan berbeda. `lastFilledBy` = identitas pemanggil. Setiap respons non-401 membawa `x-correlation-id`.

**Konten figur v2 (ringkas; rinci di panduan agent seksi 4.1):** setiap figur (`image`, `chart`,
`diagram`, `symbolSheet`) wajib `caption` dan `source` (`ImageV2.source` wajib, D-222). Chart:
tepat satu dari `data`, `panels` (komposit, 1..24 panel `{ name, code, data, highlight?, unit?,
dec?, limit?, caption?, axisNote? }`), atau `artifactId`; `limit` blok/panel `{ value, label? }`;
medan data opsional `points[].target` (`categorical`), `divider { x?, y? }` (`xy`), `binEdges`
dan `sectors` (`distribution`); `highlight` 1..64 butir, bentuk `series` dengan nama kategori +
tepat satu nama seri = satu titik di dalam seri itu. Domain sumbu, warna, label bawaan mesin, dan
lebar figur bukan medan konten: `axis`, `max`, `belowTargetColour`, `compassLabels`,
`medianLabel` (blok, panel, atau data chart), `widthClass` (figur mana pun dan panel komposit),
`max` di `limit`, dan `params` (chart) → `400 SCHEMA_INVALID` `checkId: "DISPLAY_FIELD"` berpointer
medan (DF-63..DF-71, D-229, IP-63); domain sumbu per jenis chart = parameter templat
`chart.kind.<KODE>.axis` (D-268); lebar figur dalam mm diturunkan dari ukuran kertas; `accent`
di data → `checkId: "V1_FIELD"`.
Lebar figur = satu kelas per jenis figur di templat (`chart.widthClass`, `diagram.widthClass`,
`image.widthClass`, `symbolSheet.widthClass`: `text`|`full`; mm turunan hanya-baca), judul dan
catatan daftar isi = kunci templat `render.toc.title`/`render.toc.note` (D-139, D-224).

**Batas render (FIX-1):** kiriman, PATCH, render, render ulang, artefak, dan
validate `?preview=html` dihitung per identitas (bawaan 30 per 60 detik; env
`STUDIO_RENDER_RATE_LIMIT`, `STUDIO_RENDER_RATE_WINDOW_MS`) → `429 RATE_LIMITED` + `Retry-After`.
R08 juga punya kuota validasi tersendiri untuk SETIAP panggilan (bawaan 120 per 60 detik;
`STUDIO_VALIDATE_RATE_LIMIT`, `STUDIO_VALIDATE_RATE_WINDOW_MS`).
Antrean render berbatas (bawaan 2 berjalan + 8 menunggu; env `STUDIO_RENDER_MAX_CONCURRENT`,
`STUDIO_RENDER_MAX_QUEUED`) → `503 RENDER_QUEUE_FULL` + `Retry-After` (R17, R07, dan R09 artefak; kiriman isi
tidak memakai antrean). Unggah aset R18: 60 per menit per pemanggil; kuota byte aset BARU (unggah
dan `assets` base64) 512 MiB per pengguna sesi per 24 jam bergulir, satu ember 2 GiB untuk semua
pemegang rahasia internal (`STUDIO_ASSET_QUOTA_BYTES_PER_DAY`,
`STUDIO_ASSET_QUOTA_INTERNAL_BYTES_PER_DAY`) → `429 RATE_LIMITED` + `Retry-After`; ruang disk
sesudah tulis < 2 GiB (`STUDIO_ASSET_MIN_FREE_BYTES`) → `500 STORAGE_WRITE_FAILED`.

**Kelengkapan dan render (D-131):** setiap respons kirim, sunting, struktur, dan render memuat
`completeness` (`CompletenessReportV2`: `status`, `slots[]`, `chapters.<slotKey>`,
`missingRequired`, `nextSteps`, `message`, `forwardToController` bila INCOMPLETE; waktu teks dalam
WIB). Render `chapter`/`slot` selalu boleh (draf); render penuh hanya untuk revisi COMPLETE: R17/R07
→ `409 DOCUMENT_INCOMPLETE` `{ completeness, allowedScopes, forwardToController }`. Kiriman dan
sunting selalu disimpan bila sah dan memuat `completeness.fullRenderAllowed`; agen memutuskan
kapan memanggil R17.

`SubmitResultV2` (R04 v2, R12, R13): `{ document: { id, docNumber, missionFolder, docKey,
template: { slug, versionNo }, tier }, created, unchanged, rebased, baseRevisionNo?,
appliedOnRevisionNo?, revision: { revisionNo, changeScope, changeAuto }, chapter?: { slotKey,
chapterKey, pid, sha256, blocks: [{ address, pid, type, artifactLabel? }] }, slot?: { slotKey, pid?,
sha256, address }, completeness }` (tanpa `job`/`outputs`/`renderRefused`; medan opsional itu masih
ada di tipe kontrak sebagai sisa usang). Kiriman ulang identik → `200`
`unchanged: true` tanpa revisi baru.

Status kolom: **tetap** = perilaku lama; **berubah** = diperluas refaktor struktur; **baru** =
route struktur v2 (R12-R20).

| ID | Endpoint | Metode | Status | Permintaan | Respons sukses | Galat khusus |
|---|---|---|---|---|---|---|
| R01 | `/api/studio/templates` | GET | berubah | `?kind=DOCUMENT\|CHART\|DIAGRAM\|IMAGE\|HTML&archived=0\|1&preset=0\|1` (`preset=1` hanya preset gaya) | 200 `{ templates }` + `isPreset`, `restricted` | 400 `SCHEMA_INVALID` |
| R01 | `/api/studio/templates` | POST | berubah | v2 `{ slug, name, kind, description?, isPreset? (ADMIN), changeNote, template: studio.template/v2, expertMode? }`; v1 datar tetap (kunci non-esensial hanya ADMIN); `?import=profile` hanya ADMIN | 201 `{ template, version, skeletonSha256 }` (v1: `{ template, version }`) | 400 `SCHEMA_INVALID`, `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PARAM_CLASS_K_FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`, `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND` (preset); 409 `TEMPLATE_SLUG_EXISTS`; 413; 422 `PARAM_UNKNOWN_KEY`, `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE` |
| R02 | `/api/studio/templates/[id]` | GET | berubah | `?version=n&expert=0\|1` | 200 `{ template, version, versions, definition: studio.template/v2 \| null, skeletonSha256, implicit, advancedIncluded }`; lanjutan dan roleFormats hanya ADMIN | 400 `SCHEMA_INVALID`; 404 `TEMPLATE_NOT_FOUND` |
| R02 | `/api/studio/templates/[id]` | POST | berubah | v2 `{ baseVersionNo, changeNote, template: studio.template/v2, expertMode? }` (satu versi baru); v1 datar hanya ADMIN | 201 `{ template, version, skeletonSha256 }` (v1: `{ version }`) | 400 `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN` (terbatas, kanonik, v1 non-ADMIN); 404; 409 `VERSION_CONFLICT`; 413; 422 `PARAM_UNKNOWN_KEY`, `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE` |
| R02 | `/api/studio/templates/[id]` | PATCH | tetap | alias POST (badan sama) | sama dengan POST | sama dengan POST |
| R03 | `/api/studio/registry` | GET | berubah | `?kind=sections\|params\|charts\|diagram\|symbols\|lint\|roles\|schema\|presets\|essentials\|slots\|paramScopes`; params: `class`, `group`, `surface`, `scopeKind`, `sectionType`; schema: `schemaId=studio.doc/v2\|studio.chapter/v2\|studio.slot/v2\|studio.template/v2\|studio.skeleton/v1\|common/v2\|studio.doc/v1\|...`, `download=1` | 200 `{ kind, count, items, meta? }`; `essentials` + `global`, `bySectionType`, `fieldPaths`; atau `application/schema+json` | 400 `REGISTRY_KIND_UNKNOWN` |
| R04 | `/api/studio/documents` | GET | berubah | `?mission=&docKey=&agentRequestId=&hermesTaskId=&archived=0\|1&take=(maks 200)&cursor=` | 200 `{ documents: [... + docKey, completeness: { status, missingRequired }], nextCursor }` | - |
| R04 | `/api/studio/documents` | POST | berubah | `studio.doc/v2` (tanpa `sections` = dokumen kosong berkerangka E0; dengan `sections` = upsert per slot dan per kunci bab); ke dokumen yang ADA: `target: { documentId }` + `baseRevisionNo?` (satu revisi `document;<lingkup…>`, slot/bab yang tidak dikirim tetap; D-232); atau v1 `StudioIngestRequest` `{ agentId?, document: studio.doc/v1 }` lewat adaptor sampai v2.2; `render` di badan v2 = 400 `RENDER_FIELD` (D-247) | v2: 201 `SubmitResultV2` tanpa build, 200 `unchanged`; v1: 201 `{ document, revision, outputs: [], job: null, releaseStatus, lint, errors, addresses, url, completeness }` (tanpa build; `render`/`outputs` v1 dibuang adaptor, `stripped.render`/`stripped.outputs`) | 400 `SCHEMA_INVALID` (`RENDER_FIELD`; `studio.chapter/v2`/`studio.slot/v2` di sini: pointer `/$schema`), `META_REQUIRED_FOR_CREATE`, `DOC_TARGET_AMBIGUOUS` (target selain `documentId`, atau target + `mission.folder`/`docKey`); 403 `FORBIDDEN` (termasuk templat terpatok terbatas, non-ADMIN), `PARAM_CLASS_K_FORBIDDEN` (v1); 404 `TEMPLATE_NOT_FOUND`, `MISSION_REF_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`; 409 `DOC_NUMBER_EXISTS`, `TEMPLATE_MISMATCH`, `META_CONFLICT`, `SCOPE_CONFLICT`; 413 `ASSET_TOO_LARGE`; 415; 422 `SLOT_*`, `INLINE_FORMAT_REJECTED`, `BY_CONSTRUCTION_FAILED`, `PID_CONFLICT`, `ASSET_NOT_FOUND`; 429 |
| R05 | `/api/studio/documents/[id]` | GET | berubah | `?rev=n` | 200 `{ document, revision, tree, slots: SlotNodeV2[], completeness, outputs, lint }`; `SlotNodeV2` = slot → bab → section → blok dengan `address`, `pid`, `artifactLabel?` | 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | GET | tetap | alamat dienkode URL (`3.2.4`, `Tabel%203.1%2F2.3`, `F%3Areferences%2F1`); `?rev=n` | 200 `{ address, blockId, pid, type, content, revisionNo }` | 400 `ADDRESS_INVALID`; 404 `ADDRESS_NOT_FOUND`, `DOCUMENT_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | PATCH | berubah | `{ baseRevisionNo, op: replace\|insertBefore\|insertAfter\|delete, block?, cell?, change: { what, why, impact }, agentId? }` (`render` = 400 `RENDER_FIELD`, D-247); alamat dipetakan ke pid pada `baseRevisionNo` | dokumen v2: 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness, job: null, outputs: [] }`, konflik = 409 `SCOPE_CONFLICT`; dokumen v1: 200 `{ revision, addressMap, job: null, outputs: [] }`, konflik = 409 `REVISION_CONFLICT` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`RENDER_FIELD`), `ADDRESS_INVALID`; 403 `FORBIDDEN`; 404 `ADDRESS_NOT_FOUND`; 409 `SCOPE_CONFLICT` (v2), `REVISION_CONFLICT` (v1); 422 `BY_CONSTRUCTION_FAILED`; 429 |
| R07 | `/api/studio/documents/[id]/revisions` | GET | tetap | `?to=b` atau `?from=a&to=b` (diff) | 200 `{ revisions }` (+ `completeness`, `changeScope`, `schemaId` per revisi) atau `{ revisions, diff }` | 400 `SCHEMA_INVALID`; 404 |
| R07 | `/api/studio/documents/[id]/revisions` | POST | berubah | `{ revisionNo, formats?: DOCX\|PDF\|HTML\|SVG\|PNG[], agentId? }` (render ulang tanpa revisi baru) | 200 `{ job, outputs, identical }` | 400; 404; 409 `RENDER_IN_PROGRESS`, `DOCUMENT_INCOMPLETE` (revisi INCOMPLETE); 429; 503 |
| R08 | `/api/studio/validate` | POST | berubah | `studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`, v1 `StudioIngestRequest`, atau `{ schemaId, spec }`; `?preview=html`; `studio.doc/v2` boleh membawa `draftTemplate { template: studio.template/v2, base?: { slug, version? } }` (pratinjau templat; skema lain = `valid:false` `/draftTemplate`) | 200 `{ valid, issues, lint, completenessPreview?, submitPreview?, previewHtml?, previewError? }`. Bab/slot v2 = dry-run kiriman nyata (gabung, cek dasar, gerbang by-construction) dalam transaksi baca-saja tanpa kunci, tanpa tulis, tanpa build: `completenessPreview` pasca-gabung, `submitPreview { documentId\|null, docNumber, created, unchanged, rebased, revisionNo, changeScope, chapter?\|slot? }`; galat 4xx layanan (`BY_CONSTRUCTION_FAILED`, `SCOPE_CONFLICT`, `DOCUMENT_NOT_FOUND`, `TEMPLATE_MISMATCH`, `RENDER_FIELD`, …) = `valid:false` berisu sama dengan kiriman nyata; `previewHtml` = dokumen tergabung (penanda draf bila INCOMPLETE); dokumen v1 dan v2 mendapat HTML pratinjau norm/v2; isu draf templat ber-pointer `/draftTemplate/template/...` | 400 `JSON_MALFORMED`; 403 `FORBIDDEN` (templat terbatas; juga preset/dasar/hasil draf terbatas untuk pemanggil tak tepercaya); 413; 415; 429 `RATE_LIMITED` (setiap panggilan R08 dihitung di kuota validasi tersendiri, bawaan 120 per 60 detik per identitas, env `STUDIO_VALIDATE_RATE_LIMIT`/`STUDIO_VALIDATE_RATE_WINDOW_MS`; `?preview=html` juga dihitung di kuota render 30 per 60 detik) |
| R09 | `/api/studio/artifacts` | GET | tetap | `?kind=chart\|diagram\|image\|html&mission=&take=(1..200)&cursor=` | 200 `{ artifacts, nextCursor }` | 400 `SCHEMA_INVALID` |
| R09 | `/api/studio/artifacts` | POST | tetap | figur mandiri di luar dokumen: JSON `{ agentId?, spec: chart\|diagram\|image\|html v1, mission?, formats? }` atau multipart `request` + `file` | 201 `{ artifact, outputs, job, errors, lint? }` | 400; 403 `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `ARTIFACT_NOT_FOUND`, `MISSION_REF_NOT_FOUND`; 413 `ASSET_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`, `UNSUPPORTED_MEDIA_TYPE`; 422 `CHART_KIND_NOT_DRAWN`, `CHART_KIND_UNKNOWN`, `DATUM-31`, `DATUM-39`, `BY_CONSTRUCTION_FAILED`; 429; 503 |
| R10 | `/api/studio/files/[id]` | GET | tetap | `?download=1` (bawaan), `?inline=1`, `?verify=1` | 200 berkas (`Content-Disposition`, `Cache-Control: no-store`, `X-Studio-Sha256`) | 404 `FILE_NOT_FOUND`; 403 `PATH_OUTSIDE_ROOT`; 410 `FILE_MISSING_ON_DISK` |
| R11 | `/api/studio/render-env` | GET | tetap | `?jobs=1&take=1..200&status=...&log=0..100&refresh=1` (`refresh` hanya ADMIN) | 200 `{ readiness, fonts, queue, manifest, viewer, refreshed, jobs?, jobCounts? }` | 400 `SCHEMA_INVALID`; 403 `FORBIDDEN` (refresh non-ADMIN) |
| R12 | `/api/studio/chapters` | POST | baru | `studio.chapter/v2` `{ agentId?, target: { documentId \| docNumber \| mission (+docKey) }, template?, meta?, slot?, chapter, register?, assets?, baseRevisionNo?, change? }` (`render` = 400 `RENDER_FIELD`, D-247); dokumen misi belum ada → dibuat berkerangka pada revisi yang sama | 201 `SubmitResultV2` tanpa build (`changeScope` `create;chapter:<k>` atau `chapter:<k>`); 200 `unchanged` | 400 `SCHEMA_INVALID` (`RENDER_FIELD`), `DOC_TARGET_AMBIGUOUS`, `META_REQUIRED_FOR_CREATE`; 403 `FORBIDDEN`; 404 `DOCUMENT_NOT_FOUND`; 409 `SCOPE_CONFLICT`, `TEMPLATE_MISMATCH`, `META_CONFLICT`; 413; 415; 422 `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `SLOT_ITEMS_OUT_OF_RANGE`, `BLOCK_TYPE_NOT_ADMITTED`, `CHAPTER_KEY_INVALID`, `PID_CONFLICT`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED` (pointer badan `/chapter/...` + `mergedPointer`); 429 |
| R13 | `/api/studio/slots` | POST | baru | `studio.slot/v2` `{ agentId?, target, template?, meta?, slot, payload: { type, ... }, register?, assets?, baseRevisionNo?, change? }` (`render` = 400 `RENDER_FIELD`) | 201 `SubmitResultV2` tanpa build (`changeScope` `slot:<slotKey>`, `slot.address` `F:<slotKey>`); 200 `unchanged` | seperti R12 (isu by-construction ber-pointer `/payload`), ditambah 422 `SLOT_USE_CHAPTER_ENDPOINT` (`details.use`), `SLOT_INPUT_NOT_ACCEPTED`, `SLOT_UNKNOWN` |
| R14 | `/api/studio/documents/[id]/structure` | GET | baru | `?rev=n` | 200 `{ revisionNo, skeleton, order, outlines, meta, templateVersion: { slug, versionNo }, completeness }` (revisi v1: `skeleton: null`) | 404 |
| R14 | `/api/studio/documents/[id]/structure` | PATCH | baru | `{ op, baseRevisionNo, change, agentId?, ... }` (`render` = 400 `RENDER_FIELD`): `reorder {order}`, `omitSlot {slot}`, `restoreSlot {slot, position?}`, `setOutline {slot?, outline \| null}`, `setMeta {meta}`, `renumberChapters {slot?, map}` (ADMIN), `templateVersion {versionNo}` | 200 `{ revision, addressMap?, completeness }` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`RENDER_FIELD`); 403 `FORBIDDEN` (renumber non-ADMIN; `templateVersion` bila versi saat ini terbatas, non-ADMIN); 409 `SCOPE_CONFLICT`, `DOC_NUMBER_EXISTS`; 422 `SLOT_UNKNOWN`, `SLOT_REQUIRED_MISSING`, `SLOT_DUPLICATE`, `SLOT_POSITION_LOCKED`, `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `CHAPTER_KEY_INVALID`, `BY_CONSTRUCTION_FAILED` |
| R15 | `/api/studio/documents/[id]/completeness` | GET | baru | `?rev=n` | 200 `{ documentId, completeness: CompletenessReportV2 }` | 404 |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | GET | baru | `?rev=n&history=1` | 200 `{ pid, kind, address, type, content (v2 + id), revisionNo, history? }` | 404 `PID_NOT_FOUND` (`details.retiredRevisionNo` bila pensiun) |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | PATCH | baru | `{ op: replace\|insertBefore\|insertAfter\|delete\|move, baseRevisionNo, block?, section?, chapter?, to?: { before?, after?, section?: { chapterKey, sectionNo, at } }, change, agentId? }` (`render` = 400 `RENDER_FIELD`, D-247) | 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness }` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`PID_OP_KIND`, `DISPLAY_FIELD`, `RENDER_FIELD`); 403 `FORBIDDEN`; 404 `PID_NOT_FOUND`; 409 `SCOPE_CONFLICT` (`details`: `scope, pid, baseRevisionNo, changedInRevisionNo, changedBy, currentContent`); 422 `PID_CONFLICT`, `BLOCK_TYPE_NOT_ADMITTED`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED`; 429 |
| R17 | `/api/studio/documents/[id]/render` | POST | baru | `{ scope: document\|chapter\|slot, key? (wajib chapter/slot, dilarang document), formats?: docx\|pdf\|html[], figures?: svg\|png[], revisionNo?, agentId? }` | 200 `{ job: RenderJobDto + { scope: { kind, key? }, draft }, outputs, completeness }` | 400 `SCHEMA_INVALID`; 404 `DOCUMENT_NOT_FOUND`, `ADDRESS_NOT_FOUND` (kunci bab), `REVISION_NOT_FOUND`; 409 `DOCUMENT_INCOMPLETE` `{ completeness, allowedScopes, forwardToController }`; 422 `SLOT_UNKNOWN`; 429; 503 (keduanya `Retry-After`) |
| R18 | `/api/studio/assets` | POST | baru | multipart `file`, atau JSON `{ mime: image/png\|image/jpeg, dataBase64 }`; `?mission=` opsional | 201 `{ asset: { sha256, mime, widthPx, heightPx, bytes, createdAt }, created: true }`; 200 `{ asset, created: false }` (sha sudah ada); tanpa path | 400 `SCHEMA_INVALID`, `JSON_MALFORMED`; 413 `ASSET_TOO_LARGE` (> 20 MiB, sisi > 20.000 px, > 80 MP), `PAYLOAD_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`, `UNSUPPORTED_MEDIA_TYPE`; 429 `RATE_LIMITED` (60/menit, atau kuota byte aset baru 24 jam bergulir: 512 MiB per pengguna sesi, 2 GiB satu ember bersama pemegang rahasia internal; `Retry-After`); 500 `STORAGE_WRITE_FAILED` (ruang disk sesudah tulis < 2 GiB) |
| R18 | `/api/studio/assets` | GET | baru | `?sha256=<heks\|sha256:heks>` atau `?mission=&take=(1..200)` | 200 `{ asset }` atau `{ assets }` | 404 `FILE_NOT_FOUND` |
| R19 | `/api/studio/templates/[id]/skeleton` | GET | baru | `?version=n` | 200 `{ template, versionNo, skeleton: studio.skeleton/v1, skeletonSha256, implicit, essentials: { global, bySlot }, advancedIncluded }`; lapis lanjutan dan roleFormats slot hanya untuk ADMIN, selain itu kenop esensial tampil sebagai proyeksi | 404 `TEMPLATE_NOT_FOUND` |
| R19 | `/api/studio/templates/[id]/skeleton` | POST | baru | `studio.skeleton/v1` + `{ baseVersionNo, changeNote, expertMode? }` (simpan = versi baru, parameter tingkat templat dibawa utuh, hanya kerangka diganti; `agentId` di badan ditolak) | 201 `{ version, skeletonSha256 }` | 400 `SCHEMA_INVALID` (`SKELETON_*`), `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND`; 409 `VERSION_CONFLICT`; 413 `PAYLOAD_TOO_LARGE`; 422 `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE`, `PARAM_UNKNOWN_KEY` |
| R20 | `/api/studio/documents/[id]/content` | GET | baru | `?slot=&chapter=&rev=n` | 200 `{ document: { id, docNumber }, revisionNo, slot?, content }`; tanpa parameter = isi v2 penuh; `slot` = payload slot; `slot` + `chapter` = bab dengan `id` (pid) di bab, section, blok | 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `ADDRESS_NOT_FOUND`; 422 `SLOT_UNKNOWN` |

Catatan status kode per 2026-10-23 (tabel di atas = target register
`docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md` §12):
- R19: ada di `src/app/api/studio/templates/[id]/skeleton/route.ts` (SR-26): GET kerangka + esensial slot, POST versi baru.
- R06 dan R07: berkas route masih bentuk S56. R06 GET belum mengembalikan `pid`. R06 PATCH pada
  dokumen v2 memetakan alamat ke pid dan menjalankan jalur sunting pid (respons R16 ditambah
  `job: null`, `outputs: []`; konflik `409 SCOPE_CONFLICT`); pada dokumen v1 tetap
  `{ revision, addressMap, job: null, outputs: [] }` dan `409 REVISION_CONFLICT`. Batas `change`
  R06 = 4.000 (cek route). R07 POST memeriksa kelengkapan di layanan render, bukan di route.

**Route internal UI (bukan untuk agen):**

| Endpoint | Metode | Permintaan | Respons | Galat |
|---|---|---|---|---|
| `/api/studio/client-log` | POST | `{ level: error\|warn\|info, message, route?, correlationId?, source?, code?, status?, stack?, detail?, timestamp? }` (maks 16 KiB) | 202 `{ accepted: true, correlationId }`; ditulis ke log JSONL Studio (`source: studio.client`), rahasia disaring | 400 `JSON_MALFORMED`, `SCHEMA_INVALID`; 401; 413 `PAYLOAD_TOO_LARGE`; 429 (> 30 entri per menit per sesi, `Retry-After`, badan tanpa `code`) |
