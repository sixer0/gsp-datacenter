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

**Server MCP Studio.** Server MCP `studio` (jalur utama laporan kerja agen ber-MCP) membungkus route
Studio yang sama di bagian ini, bukan API terpisah: kontrak, autentikasi, kuota, dan galatnya identik.
Daftar alat dan pemetaan alat ke route (R03, R04, R05, R08, R10, R12, R13, R15, R17, R20 sampai R22; `studio_document_get` memakai R20 untuk `view=content` dan R05 untuk `view=summary`): `docs/STUDIO-MCP.md`.

**Auth (semua route, termasuk GET):** `requireSession` di baris pertama handler. Sesi NextAuth,
cookie `gsp_hq_session`, atau header `x-internal-secret: <INTERNAL_API_SECRET>` (agent; kirim
`agentId` di badan sebagai label). Anonim → `401 {"error":"Unauthorized"}`. `createdBy`,
`requestedBy`, dan `lastFilledBy` berprefiks jenis pemanggil: `user:<username>`,
`google:<email>`, `agent:<agentId>`, atau `anonymous-internal`. `agentId` hanya label klaim.

**Galat:** `{ "error": "<pesan Indonesia yang menyebut perbaikan>", "code": "<StudioErrorCode>",
"details"?: ... }` (`error` = string; kode mesin di `code` tingkat atas, bukan `error.code`; id korelasi di header `x-correlation-id`, semua galat selain 401 dan 405 tanpa badan); `details` validasi = `[{ pointer, keyword, message, checkId? }]` dengan
`checkId` `DISPLAY_FIELD`, `V1_FIELD`, `RENDER_FIELD`, `SKELETON_*`, `PID_OP_KIND`, atau id cek
by-construction, plus `mergedPointer` opsional (kiriman bab/slot: `pointer` relatif badan
`/chapter/...` atau `/payload`, `mergedPointer` = lokasi di dokumen tergabung). 73 kode di
`STUDIO_ERROR_CODES` (`contract/enums.ts`), HTTP di `STUDIO_ERROR_HTTP` (`contract/errors.ts`). Urutan evaluasi:
transport (413 `PAYLOAD_TOO_LARGE` > 5 MiB, 415 `UNSUPPORTED_MEDIA_TYPE`, 400 `JSON_MALFORMED`,
JSON > 64 tingkat 400 `SCHEMA_INVALID` `maxDepth`) → skema (termasuk `checkId` kontrak
`CONTRACT_ENUM`, `CONTRACT_PATTERN`, `CONTRACT_DATE`, `CONTRACT_REF_TARGET`, `CHART_CUSTOM_FORM`,
`SKELETON_CONTRACT_RECORD`; R12/R13 lalu 400 `DOC_TARGET_AMBIGUOUS`) → laju 429 (bucket
`render`; pada R04 POST v2 laju diperiksa sebelum skema) → gerbang kepercayaan (`x.benchmark`/`x.enforcement`/`x.lintEnforcement` pemanggil tak
tepercaya dibuang + REPORT `BENCHMARK_MARKER_STRIPPED`/`ENFORCEMENT_OVERRIDE_STRIPPED`) →
templat/aset kiriman di luar transaksi (404 `TEMPLATE_NOT_FOUND`) → target di dalam kunci (404
`DOCUMENT_NOT_FOUND`; jalur buat: 400 `META_REQUIRED_FOR_CREATE` → templat TERBATAS bagi non-ADMIN
`403 FORBIDDEN` `details.reason = "TEMPLATE_RESTRICTED"` → 409 `META_CONFLICT` → 409
`DOC_NUMBER_EXISTS`; dokumen yang ada: 403 bila templat tersemat terbatas) → `ingest.inlineFormat`
(v1) → gabung struktur di dalam kunci (409 `TEMPLATE_MISMATCH`/`META_CONFLICT`, 422 `SLOT_*`,
`CHAPTER_KEY_INVALID`, `ASSET_NOT_FOUND`, `PID_CONFLICT`; kepemilikan pid sebelum cek idempoten) →
catatan kontrak murni sesudah gabung (400 `SCHEMA_INVALID` `CONTRACT_*` termasuk tanggal kalender,
lalu 422 `CONTRACT_ITEM_KEY_DUPLICATE`) → idempoten 200 `unchanged` → cek lingkup 409
`SCOPE_CONFLICT` (pid PATCH tertimpa, basis basi) / 404 `REVISION_NOT_FOUND` → susun (compose) 422
`CHART_CUSTOM_FORM_UNSUPPORTED` → rujukan kontrak dalam transaksi (422
`CONTRACT_REF_NOT_FOUND`/`CONTRACT_REF_PID_NOT_FOUND`; pid pensiun = peringatan
`CONTRACT_REF_PID_RETIRED` di `warnings`) → by-construction 422 `BY_CONSTRUCTION_FAILED` (satu
gerbang untuk R04, R12, R13, R16, R06, R14) → simpan → lint rilis (tidak menahan berkas). Urutan
dari `services/submit/pipeline.ts` (`applyInLock`) dan `ingest/v2.ts`; galat isi langkah susun,
rujukan, dan by-construction baru muncul sesudah 409 lingkup. Langkah kontrak = register
`05_document_contract_specs.md` §5.6; bila register dan kode berbeda, kode yang berlaku.
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
validate `?preview=html` dihitung per identitas, atau per identitas + `agentId` bila badan membawanya
(lihat paragraf header kuota; bawaan 30 per 60 detik; env
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

**Header kuota (DC-19, D-366, D-372):** `X-Studio-Quota-Remaining` (sisa bilangan bulat ≥ 0) dan
`X-Studio-Quota-Bucket` (`render`|`validate`|`import`|`query`, `QUOTA_BUCKETS`) dipasang pada
setiap respons yang dihasilkan SESUDAH tagihan bucket (2xx, 4xx, 429, 5xx) di semua route berkuota
(dibungkus `withQuotaHeaders`, QH-03; FIX-QA D-403): bucket `render` = R04 POST, R12, R13, R06/R14/R16
PATCH, R17, R07 POST, R09 POST, R08 `?preview=html`, `figures/preview` POST (FIG-03b); `validate` = R08, R23,
`/import/markdown?validate=1`; `import` = `/import/markdown`; `query` = R21 dan R22 (satu limiter
bersama). Jadi `201`/`200` kiriman dan PATCH, serta 409/422 yang muncul sesudah tagihan, juga membawa
header. Penolakan sebelum tagihan TIDAK membawa header dan tidak memakan kuota: 401, dan 400/413/415
validasi badan atau query yang diperiksa route sebelum tagihan (mis. skema dan `DOC_TARGET_AMBIGUOUS`
R12/R13, badan PATCH R14 dan R06, query R21/R22, badan R23). Permintaan yang menagih dua bucket (R08
`?preview=html`, impor `?validate=1`) melaporkan bucket dengan sisa terkecil (seri = urutan
`QUOTA_BUCKETS`); 429 → `X-Studio-Quota-Remaining: 0` + `Retry-After`. **Kunci per agen (FIX-SEC
L-4, D-402/D-407, D-411), lewat `checkBucketRate`; kunci mengikuti pemanggil yang diteruskan route:**
bucket `render` dan `validate` dipecah per agen karena route-nya menagih sesudah membaca `agentId`
badan; bucket `import` dan `query` selalu per identitas karena route menagih tanpa `agentId`
(importer menagih `import` sebelum badan dibaca; R21/R22 GET tidak berbadan). Pemanggil tanpa
`agentId` = satu kunci per identitas terautentikasi (perilaku lama); pemanggil dengan
`agentId` badan pada bucket `render`/`validate` = kunci identitas + `agentId`, ditambah plafon per identitas F x batas bucket per
jendela (env `STUDIO_QUOTA_AGENT_CEILING_FACTOR`, bilangan bulat 1..64, bawaan 4; dibaca setiap
tagihan), sehingga rotasi `agentId` berhenti di plafon; header = sisa terkecil agen/plafon (sisa
plafon tepat bila jendela slot sejajar, selisih < F bila tidak). Bucket `query` bawaan 120 per 60
detik (env `STUDIO_QUERY_RATE_LIMIT`, `STUDIO_QUERY_RATE_WINDOW_MS`). Nilai = sisa limiter memori
proses ini, bukan kuota global antar-proses.

**Laporan kerja agen dan dokumen kontrak (D-361, register 05):** jenis kontrak tahap 1 hanya
`agentWorkReport` (templat `laporan-kerja-agen`, slot `record` berjenis `contractRecord`); definisi
jenis, status, vonis, kerangka, dan batas dibaca dari R03 `?kind=contracts`, dicari lewat R21 dan
R22, dan draf MD diperiksa lewat R23 tanpa tulis. Kode galat kontrak (semua 422,
`STUDIO_ERROR_HTTP`): `CONTRACT_REF_NOT_FOUND` (`refs[n]` ke dokumen yang tidak ada: `details: { pointer,
documentId | docNumber (medan yang dikirim), reason: "DOCUMENT" }`; atau `revisionNo` di atas revisi
terkini: `details: { pointer (.../revisionNo), documentId, revisionNo, currentRevisionNo, reason:
"REVISION" }`), `CONTRACT_REF_PID_NOT_FOUND` (`pid` tidak pernah ada di dokumen sasaran; `details:
{ pointer, documentId, pid }`), `CONTRACT_ITEM_KEY_DUPLICATE` (`items[].key` ganda; `details: {
pointer, key, positions }`, `positions` berbasis 1), dan `CHART_CUSTOM_FORM_UNSUPPORTED` (kombinasi
`form` × bentuk data `chart.custom` di luar CU-01..CU-09; `details: { pointer, form, dataShape,
supported }`, `pointer` dilengkapi dari sumber kiriman bila bloknya ditemukan). Peringatan non-penahan
`{ code, pointer, message, details? }` (`SubmitWarningV2`, kode `CONTRACT_WARNING_CODES`) muncul di
medan opsional `warnings` pada `SubmitResultV2`, R08 `submitPreview.warnings` (bab/slot), R08
`warnings` tingkat atas (`studio.doc/v2`, FIX-QB D-403), dan respons PATCH R06/R14/R16 (D-386,
D-389); medan hanya ada bila tidak kosong. Setiap `OutputFileDto` (R05 `outputs`, R07, R09, R17) memuat
`finalFileName` wajib: `<docNumberSafe>_rev<revisionNo>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>`
(`FINAL_FILENAME_PATTERN`; artefak = `ART-<artifactId>_rev0_...`), misalnya
`003-GSP-KT-X-2026_rev12_20261030T125800Z_55d324b1.html`. Berkas lokal dicocokkan dengan
`HEAD /api/studio/files/{id}?verify=1` (header `X-Studio-Final-Filename` sama dan
`X-Studio-Sha256-Verified: true`), atau tanpa id lewat R21 `?docNumber=<docNumberSafe>` lalu R05
`?rev=<revisionNo>` dan `outputs[].finalFileName`.

**Render: gagal cepat PDF dan hasil sebagian (D-322, D-325, D-331):** bila `formats` memuat `pdf`
(eksplisit atau bawaan templat) dan render-env tidak siap, R17 dan R07 menjawab
`503 PDF_ENGINE_UNAVAILABLE` + `Retry-After: 300` SEBELUM job dibuat; `details = { stage:
"preflight", jobCreated: false, reason, causes: [{ code, message, count }], retryable: true,
requiresOperatorAction, retryAfterSec, requestedFormats, suggestedFormats (tanpa pdf),
statusEndpoint: "GET /api/studio/render-env", checkedAt }`; kode `causes`:
`FONTS_NOT_LOADED_IN_SESSION`, `FONTS_NOT_REGISTERED`, `FONT_FILES_MISSING`, `FONT_FILES_CHANGED`,
`FONT_FILES_UNREADABLE`, `FONT_REGISTRY_UNREADABLE`, `SESSION_FONT_CHECK_FAILED`,
`PDF_ENGINE_MISSING`, `PDF_ENGINE_VERSION`, `RENDER_ENV_MANIFEST`, `READINESS_CHECK_FAILED`,
`OTHER`. Urutan R17 dan R07 seragam untuk `formats` apa pun: 401 → 400 badan → 429 laju → 503
`RENDER_QUEUE_FULL` → 404 (dokumen, revisi, kunci bab) → 409 `DOCUMENT_INCOMPLETE`/422 → 503
preflight (D-336). R09 tidak memakai gerbang PDF. Respons sukses R17 (200), R07 (200), dan R09
(201) memuat `partial` (true = job PARTIAL), `failedFormats` (huruf besar), `errors`, dan header
`X-Studio-Render-Status: SUCCEEDED|PARTIAL|FAILED`; kode HTTP tidak berubah untuk hasil sebagian,
jadi klien wajib membaca `partial`/`failedFormats`.

**Path atau metode salah (D-323):** path `/api/studio/*` yang tidak ada (GET, POST, PUT, PATCH, DELETE, OPTIONS;
HEAD = 404 tanpa badan) → `404 { error, code: "ROUTE_NOT_FOUND", message, hint, correlationId, details: { method, path,
suggestion? } }` + `x-correlation-id`, tercatat di log JSONL; `hint` menunjuk route dan bentuk badan
yang benar untuk salah-umum (mis. `POST /documents/{id}/slots` → `POST /api/studio/slots` +
`target.documentId`). `ROUTE_NOT_FOUND` anggota enum kontrak `STUDIO_ERROR_CODES` (D-336; kini 73 kode). Tanpa sesi tetap 401.
Metode salah pada route yang ada → `405` tanpa badan (dari Next); metode tiap route = kolom Metode
tabel di bawah.

**Kiriman yang akan menimpa suntingan PATCH (D-324):** kiriman bab/slot (R12, R13, dan R04 bertarget)
tanpa `baseRevisionNo` terbaru yang akan menimpa pid yang disunting lewat PATCH sesudah kiriman
terakhir lingkup itu → `409 SCOPE_CONFLICT` `details: { scope, reason: "PATCHED_PIDS_OVERWRITTEN",
baseRevisionNo, referenceRevisionNo, latestRevisionNo, changedInRevisionNo, changedBy,
overwrittenPids: [{ pid, address, editedInRevision, editedBy }], conflictingScopes?, readContent,
forwardToController }`, 0 tulis. Pulih: `GET .../content`, gabungkan, kirim ulang dengan
`baseRevisionNo = latestRevisionNo`. Kiriman identik tetap 200 `unchanged`.

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
sha256, address }, completeness, warnings? }` (tanpa `job`/`outputs`/`renderRefused`; medan opsional itu masih
ada di tipe kontrak sebagai sisa usang). Kiriman ulang identik → `200`
`unchanged: true` tanpa revisi baru.

Status kolom: **tetap** = perilaku lama; **berubah** = diperluas refaktor struktur atau kontrak
dokumen; **baru** = route struktur v2 (R12-R20) atau route kontrak dokumen (R21-R23, D-361).
Metode tiap baris = ekspor `GET`/`POST`/`PATCH`/`HEAD` berkas `src/app/api/studio/**/route.ts`
(dicek ulang 2026-10-31).

| ID | Endpoint | Metode | Status | Permintaan | Respons sukses | Galat khusus |
|---|---|---|---|---|---|---|
| R01 | `/api/studio/templates` | GET | berubah | `?kind=DOCUMENT\|CHART\|DIAGRAM\|IMAGE\|HTML&archived=0\|1&preset=0\|1` (`preset=1` hanya preset gaya) | 200 `{ templates }` + `isPreset`, `restricted` | 400 `SCHEMA_INVALID` |
| R01 | `/api/studio/templates` | POST | berubah | v2 `{ slug, name, kind, description?, isPreset? (ADMIN), changeNote, template: studio.template/v2, expertMode? }`; v1 datar tetap (kunci non-esensial hanya ADMIN); `?import=profile` hanya ADMIN | 201 `{ template, version, skeletonSha256 }` (v1: `{ template, version }`) | 400 `SCHEMA_INVALID`, `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PARAM_CLASS_K_FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`, `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND` (preset); 409 `TEMPLATE_SLUG_EXISTS`; 413; 422 `PARAM_UNKNOWN_KEY`, `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE` |
| R02 | `/api/studio/templates/[id]` | GET | berubah | `?version=n&expert=0\|1` | 200 `{ template, version, versions, definition: studio.template/v2 \| null, skeletonSha256, implicit, advancedIncluded }`; lanjutan dan roleFormats hanya ADMIN | 400 `SCHEMA_INVALID`; 404 `TEMPLATE_NOT_FOUND` |
| R02 | `/api/studio/templates/[id]` | POST | berubah | v2 `{ baseVersionNo, changeNote, template: studio.template/v2, expertMode? }` (satu versi baru); v1 datar hanya ADMIN | 201 `{ template, version, skeletonSha256 }` (v1: `{ version }`) | 400 `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN` (terbatas, kanonik, v1 non-ADMIN); 404; 409 `VERSION_CONFLICT`; 413; 422 `PARAM_UNKNOWN_KEY`, `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE` |
| R02 | `/api/studio/templates/[id]` | PATCH | tetap | alias POST (badan sama) | sama dengan POST | sama dengan POST |
| R03 | `/api/studio/registry` | GET | berubah | `?kind=sections\|params\|charts\|diagram\|symbols\|lint\|roles\|schema\|presets\|essentials\|slots\|paramScopes\|contracts`; params: `class`, `group`, `surface`, `scopeKind`, `sectionType`; schema: `schemaId=studio.doc/v2\|studio.chapter/v2\|studio.slot/v2\|studio.template/v2\|studio.skeleton/v1\|common/v2\|studio.doc/v1\|...`, `download=1`; `contracts` tanpa parameter lain; `kind` wajib (tanpa `kind` = 400) | 200 `{ kind, count, items, meta? }`; `essentials` + `global`, `bySectionType`, `fieldPaths`; atau `application/schema+json`; `contracts` = 200 `{ kind: "contracts", count, items: ContractKindDefV2[] (hanya jenis aktif; tahap 1 `agentWorkReport`: kerangka, outline wajib, status, vonis, status butir, refRels, evidenceKinds, pola, batas, label, alias, defaultFormats, examples), meta: { kinds, templateSlugs } }`; `items[0].examples` = `ContractKindExamplesV2 { howTo: string[], record: studio.slot/v2 beramplop buat, chapters: { "1".."5": studio.chapter/v2 } }` (setiap badan lolos dry-run R08; tanpa ID dokumen atau pid nyata: semua blok menarget misi + docKey contoh yang sama, `refs` tidak ada; dasar templat draf panduan agen §17.0); tanpa header kuota | 400 `REGISTRY_KIND_UNKNOWN` tanpa `kind` atau `kind` tak dikenal: `details` = larik satu isu (01 §6.2) `[{ pointer: "/query/kind", keyword: "required"\|"enum", message, received (string ≤ 64 atau `null`), validKinds: string[13], examples: string[] }]` (R2-F1, D-426: bentuk objek sementara R2-02 dikembalikan ke larik); 400 `SCHEMA_INVALID` `/query/<nama>` (parameter lain bersama `kind=contracts`, `details` tetap larik isu) |
| R04 | `/api/studio/documents` | GET | berubah | `?mission=&docKey=&agentRequestId=&hermesTaskId=&archived=0\|1&take=(maks 200)&cursor=` | 200 `{ documents: [... + docKey, completeness: { status, missingRequired }], nextCursor }` | - |
| R04 | `/api/studio/documents` | POST | berubah | `studio.doc/v2` (tanpa `sections` = dokumen kosong berkerangka E0; dengan `sections` = upsert per slot dan per kunci bab); ke dokumen yang ADA: `target: { documentId }` + `baseRevisionNo?` (satu revisi `document;<lingkup…>`, slot/bab yang tidak dikirim tetap; D-232); atau v1 `StudioIngestRequest` `{ agentId?, document: studio.doc/v1 }` lewat adaptor sampai v2.2; `render` di badan v2 = 400 `RENDER_FIELD` (D-247) | v2: 201 `SubmitResultV2` tanpa build, 200 `unchanged`; v1: 201 `{ document, revision, outputs: [], job: null, releaseStatus, lint, errors, addresses, url, completeness }` (tanpa build; `render`/`outputs` v1 dibuang adaptor, `stripped.render`/`stripped.outputs`) | 400 `SCHEMA_INVALID` (`RENDER_FIELD`; `studio.chapter/v2`/`studio.slot/v2` di sini: pointer `/$schema`), `META_REQUIRED_FOR_CREATE`, `DOC_TARGET_AMBIGUOUS` (target selain `documentId`, atau target + `mission.folder`/`docKey`); 403 `FORBIDDEN` (termasuk templat terpatok terbatas, non-ADMIN), `PARAM_CLASS_K_FORBIDDEN` (v1); 404 `TEMPLATE_NOT_FOUND`, `MISSION_REF_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`; 409 `DOC_NUMBER_EXISTS`, `TEMPLATE_MISMATCH`, `META_CONFLICT`, `SCOPE_CONFLICT`; 413 `ASSET_TOO_LARGE`; 415; 422 `SLOT_*`, `INLINE_FORMAT_REJECTED`, `BY_CONSTRUCTION_FAILED`, `PID_CONFLICT`, `ASSET_NOT_FOUND`; 429 |
| R05 | `/api/studio/documents/[id]` | GET | berubah | `?rev=n` | 200 `{ document, revision, tree, slots: SlotNodeV2[], completeness, outputs, lint }`; `SlotNodeV2` = slot → bab → section → blok dengan `address`, `pid`, `artifactLabel?`; setiap `outputs[]` memuat `finalFileName` | 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | GET | tetap | alamat dienkode URL (`3.2.4`, `Tabel%203.1%2F2.3`, `F%3Areferences%2F1`); `?rev=n` | 200 `{ address, blockId, pid, type, content, revisionNo }` | 400 `ADDRESS_INVALID`; 404 `ADDRESS_NOT_FOUND`, `DOCUMENT_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | PATCH | berubah | `{ baseRevisionNo, op: replace\|insertBefore\|insertAfter\|delete, block?, cell?, change: { what, why, impact }, agentId? }` (`render` = 400 `RENDER_FIELD`, D-247); alamat dipetakan ke pid pada `baseRevisionNo` | dokumen v2: 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness, warnings?, job: null, outputs: [] }`, konflik = 409 `SCOPE_CONFLICT`; dokumen v1: 200 `{ revision, addressMap, job: null, outputs: [] }`, konflik = 409 `REVISION_CONFLICT` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`RENDER_FIELD`), `ADDRESS_INVALID`; 403 `FORBIDDEN`; 404 `ADDRESS_NOT_FOUND`; 409 `SCOPE_CONFLICT` (v2), `REVISION_CONFLICT` (v1); 422 `BY_CONSTRUCTION_FAILED`; 429 |
| R07 | `/api/studio/documents/[id]/revisions` | GET | tetap | `?to=b` atau `?from=a&to=b` (diff) | 200 `{ revisions }` (+ `completeness`, `changeScope`, `schemaId` per revisi) atau `{ revisions, diff }` | 400 `SCHEMA_INVALID`; 404 |
| R07 | `/api/studio/documents/[id]/revisions` | POST | berubah | `{ revisionNo, formats?: DOCX\|PDF\|HTML\|SVG\|PNG[], agentId? }` (render ulang tanpa revisi baru) | 200 `{ job, outputs, identical, partial, failedFormats, errors }` (`outputs[].finalFileName`) + `X-Studio-Render-Status` + header kuota `render` | 400; 404; 409 `RENDER_IN_PROGRESS`, `DOCUMENT_INCOMPLETE` (revisi INCOMPLETE); 429; 503 `PDF_ENGINE_UNAVAILABLE` preflight (tanpa job, `Retry-After`), `RENDER_QUEUE_FULL` |
| R08 | `/api/studio/validate` | POST | berubah | `studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`, v1 `StudioIngestRequest`, atau `{ schemaId, spec }`; `?preview=html`; `studio.doc/v2` boleh membawa `draftTemplate { template: studio.template/v2, base?: { slug, version? } }` (pratinjau templat; skema lain = `valid:false` `/draftTemplate`) | 200 `{ valid, issues, lint, warnings?, completenessPreview?, submitPreview?, previewHtml?, previewError? }` + header kuota `validate` (atau bucket bersisa terkecil bila `?preview=html`); `submitPreview.warnings?` (bab/slot) dan `warnings?` tingkat atas (`studio.doc/v2`) = peringatan kontrak yang akan muncul di kiriman nyata; isu dari galat layanan membawa `details` apa adanya (mis. `SCOPE_CONFLICT` + `overwrittenPids`, D-331). Bab/slot v2 = dry-run kiriman nyata (gabung, cek dasar, gerbang by-construction) dalam transaksi baca-saja tanpa kunci, tanpa tulis, tanpa build: `completenessPreview` pasca-gabung, `submitPreview { documentId\|null, docNumber, created, unchanged, rebased, revisionNo, changeScope, chapter?\|slot? }`; galat 4xx layanan (`BY_CONSTRUCTION_FAILED`, `SCOPE_CONFLICT`, `DOCUMENT_NOT_FOUND`, `TEMPLATE_MISMATCH`, `RENDER_FIELD`, …) = `valid:false` berisu sama dengan kiriman nyata; `previewHtml` = dokumen tergabung (penanda draf bila INCOMPLETE); dokumen v1 dan v2 mendapat HTML pratinjau norm/v2; isu draf templat ber-pointer `/draftTemplate/template/...` | 400 `JSON_MALFORMED`; 403 `FORBIDDEN` (templat terbatas; juga preset/dasar/hasil draf terbatas untuk pemanggil tak tepercaya); 413; 415; 429 `RATE_LIMITED` (setiap panggilan R08 dihitung di kuota validasi tersendiri, bawaan 120 per 60 detik per identitas, env `STUDIO_VALIDATE_RATE_LIMIT`/`STUDIO_VALIDATE_RATE_WINDOW_MS`; `?preview=html` juga dihitung di kuota render 30 per 60 detik) |
| R09 | `/api/studio/artifacts` | GET | tetap | `?kind=chart\|diagram\|image\|html&mission=&take=(1..200)&cursor=` | 200 `{ artifacts, nextCursor }` | 400 `SCHEMA_INVALID` |
| R09 | `/api/studio/artifacts` | POST | tetap | figur mandiri di luar dokumen: JSON `{ agentId?, spec: chart\|diagram\|image\|html v1, mission?, formats? }` atau multipart `request` + `file` | 201 `{ artifact, outputs, job, errors, lint?, partial, failedFormats }` (`outputs[].finalFileName` = `ART-<artifactId>_rev0_...`) + `X-Studio-Render-Status` + header kuota `render` | 400; 403 `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `ARTIFACT_NOT_FOUND`, `MISSION_REF_NOT_FOUND`; 413 `ASSET_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`, `UNSUPPORTED_MEDIA_TYPE`; 422 `CHART_KIND_NOT_DRAWN`, `CHART_KIND_UNKNOWN`, `DATUM-31`, `DATUM-39`, `BY_CONSTRUCTION_FAILED`; 429; 503 |
| R10 | `/api/studio/files/[id]` | GET | berubah | `?download=1` (bawaan), `?inline=1`, `?verify=1`, `?name=final\|datum` (sekali; menimpa nama bawaan di `Content-Disposition`) | 200 berkas (`Content-Disposition`, `Cache-Control: no-store`, `X-Studio-Sha256`, `X-Studio-Sha256-Verified: true\|false` bila `?verify=1`); `X-Studio-Final-Filename` = nama final pada SETIAP berkas (dokumen apa pun dan artefak); nama di `Content-Disposition` bawaan = nama final (`attachment; filename="<nama>"; filename*=UTF-8''<nama>`) bila dokumen pemilik ber-`contractKind`, selain itu nama DATUM `fileName` (D-387); tanpa header kuota | 400 `SCHEMA_INVALID` `/query/name` (nilai selain `final`/`datum` atau berulang); 404 `FILE_NOT_FOUND`; 403 `PATH_OUTSIDE_ROOT`; 410 `FILE_MISSING_ON_DISK` |
| R10 | `/api/studio/files/[id]` | HEAD | baru | parameter sama dengan GET (termasuk `?verify=1`, `?name=`) | status dan header sama dengan GET (termasuk `X-Studio-Final-Filename`, `X-Studio-Sha256-Verified`), tanpa badan; dipakai mencocokkan berkas lokal tanpa mengunduh | status sama dengan GET, tanpa badan |
| R11 | `/api/studio/render-env` | GET | tetap | `?jobs=1&take=1..200&status=...&log=0..100&refresh=1` (`refresh` hanya ADMIN) | 200 `{ readiness, fonts, queue, manifest, viewer, refreshed, jobs?, jobCounts? }` | 400 `SCHEMA_INVALID`; 403 `FORBIDDEN` (refresh non-ADMIN) |
| R12 | `/api/studio/chapters` | POST | baru | `studio.chapter/v2` `{ agentId?, target: { documentId \| docNumber \| mission (+docKey) }, template?, meta?, slot?, chapter, register?, assets?, baseRevisionNo?, change? }` (`render` = 400 `RENDER_FIELD`, D-247); dokumen misi belum ada → dibuat berkerangka pada revisi yang sama | 201 `SubmitResultV2` tanpa build (`changeScope` `create;chapter:<k>` atau `chapter:<k>`); 200 `unchanged` | 400 `SCHEMA_INVALID` (`RENDER_FIELD`), `DOC_TARGET_AMBIGUOUS`, `META_REQUIRED_FOR_CREATE`; 403 `FORBIDDEN`; 404 `DOCUMENT_NOT_FOUND`; 409 `SCOPE_CONFLICT`, `TEMPLATE_MISMATCH`, `META_CONFLICT`; 413; 415; 422 `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `SLOT_ITEMS_OUT_OF_RANGE`, `BLOCK_TYPE_NOT_ADMITTED`, `CHAPTER_KEY_INVALID`, `PID_CONFLICT`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED` (pointer badan `/chapter/...` + `mergedPointer`); 429 |
| R13 | `/api/studio/slots` | POST | baru | `studio.slot/v2` `{ agentId?, target, template?, meta?, slot, payload: { type, ... }, register?, assets?, baseRevisionNo?, change? }` (`render` = 400 `RENDER_FIELD`) | 201 `SubmitResultV2` tanpa build (`changeScope` `slot:<slotKey>`, `slot.address` `F:<slotKey>`); 200 `unchanged` | seperti R12 (isu by-construction ber-pointer `/payload`), ditambah 422 `SLOT_USE_CHAPTER_ENDPOINT` (`details.use`), `SLOT_INPUT_NOT_ACCEPTED`, `SLOT_UNKNOWN` |
| R14 | `/api/studio/documents/[id]/structure` | GET | baru | `?rev=n` | 200 `{ revisionNo, skeleton, order, outlines, meta, templateVersion: { slug, versionNo }, completeness }` (revisi v1: `skeleton: null`) | 404 |
| R14 | `/api/studio/documents/[id]/structure` | PATCH | baru | `{ op, baseRevisionNo, change, agentId?, ... }` (`render` = 400 `RENDER_FIELD`): `reorder {order}`, `omitSlot {slot}`, `restoreSlot {slot, position?}`, `setOutline {slot?, outline \| null}`, `setMeta {meta}`, `renumberChapters {slot?, map}` (ADMIN), `templateVersion {versionNo}` | 200 `{ revision, addressMap?, rebased, baseRevisionNo, appliedOnRevisionNo, completeness, warnings? }` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`RENDER_FIELD`); 403 `FORBIDDEN` (renumber non-ADMIN; `templateVersion` bila versi saat ini terbatas, non-ADMIN); 409 `SCOPE_CONFLICT`, `DOC_NUMBER_EXISTS`; 422 `SLOT_UNKNOWN`, `SLOT_REQUIRED_MISSING`, `SLOT_DUPLICATE`, `SLOT_POSITION_LOCKED`, `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `CHAPTER_KEY_INVALID`, `BY_CONSTRUCTION_FAILED` |
| R15 | `/api/studio/documents/[id]/completeness` | GET | baru | `?rev=n` | 200 `{ documentId, completeness: CompletenessReportV2 }` | 404 |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | GET | baru | `?rev=n&history=1` | 200 `{ pid, kind, address, type, content (v2 + id), revisionNo, history? }` | 404 `PID_NOT_FOUND` (`details.retiredRevisionNo` bila pensiun) |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | PATCH | baru | `{ op: replace\|insertBefore\|insertAfter\|delete\|move, baseRevisionNo, block?, section?, chapter?, to?: { before?, after?, section?: { chapterKey, sectionNo, at } }, change, agentId? }` (`render` = 400 `RENDER_FIELD`, D-247) | 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness, warnings? }` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`PID_OP_KIND`, `DISPLAY_FIELD`, `RENDER_FIELD`); 403 `FORBIDDEN`; 404 `PID_NOT_FOUND`; 409 `SCOPE_CONFLICT` (`details`: `scope, pid, baseRevisionNo, changedInRevisionNo, changedBy, currentContent`); 422 `PID_CONFLICT`, `BLOCK_TYPE_NOT_ADMITTED`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED`; 429 |
| R17 | `/api/studio/documents/[id]/render` | POST | baru | `{ scope: document\|chapter\|slot, key? (wajib chapter/slot, dilarang document), formats?: docx\|pdf\|html[], figures?: svg\|png[], revisionNo?, agentId? }`; dokumen ber-`contractKind` tanpa `formats` dan `figures` → hanya HTML (`CONTRACT_DEFAULT_RENDER_FORMATS`), dokumen lain → bawaan lama (snapshot/orkestrator) | 200 `{ job: RenderJobDto + { scope: { kind, key? }, draft }, outputs, completeness, partial, failedFormats, errors }` + `X-Studio-Render-Status` + header kuota `render` (juga pada 4xx/5xx sesudah tagihan); setiap `outputs[]` memuat `finalFileName` | 400 `SCHEMA_INVALID`; 404 `DOCUMENT_NOT_FOUND`, `ADDRESS_NOT_FOUND` (kunci bab), `REVISION_NOT_FOUND`; 409 `DOCUMENT_INCOMPLETE` `{ completeness, allowedScopes, forwardToController }`; 422 `SLOT_UNKNOWN`; 429; 503 `PDF_ENGINE_UNAVAILABLE` preflight (tanpa job; `details.stage = "preflight"`, `suggestedFormats`), `RENDER_QUEUE_FULL` (semua `Retry-After`) |
| - | `/api/studio/documents/[id]/figures/preview` | POST | baru (FIG-03b) | `{ pid? \| address? (3.1.4 atau Gambar 3.1), block? (fragmen v2 chart/diagram, divalidasi seperti R16), revisionNo?, svg?: boolean, agentId? }`; tepat satu dari `pid`/`address`, atau `block` (+ salah satunya = dirender di posisi itu); kunci lain ditolak | 200 `{ documentId, revisionNo, currentRevisionNo, rendered: true, figure: { type, code, pid, address, label, inline, size: { widthMm, heightMm, svgBytes }, issues[] (maks 40: checkId, status, detail, suggest, suggestSource engine\|hint, info; chart = `report.issues`, diagram = `report.issues` + `report.geometry` FIG-02b), issueCount, layoutIssueCount (tanpa isu `info`: `DATUM-36`, `FIGURE_LIMITS_DEFAULT`, `PARAM_ALIAS`, `AUTO_FIT`, `INTENT_APPLIED`, `CAPACITY_ADAPT`), checksRun, data: { shape, items, maxLabelChars }\|null (MASUKAN), rendered: { code, orientation horizontal\|vertical\|null, shape, items, maxLabelChars }\|null (chart: yang DIRENDER sesudah `orientation`/AUTO_ORIENT/`topN`/`labelShort`; diagram null), svg? (hanya `svg: true`) } }`; 200 `{ rendered: false, target, error: { code, message, details? } }` bila mesin menolak figur. BACA SAJA: tanpa job, berkas, atau baris DB (D-322); jalur render sama dengan render dokumen (templat tersemat + override dokumen; blok inline disusun dengan konteks compose snapshot). SEC-FIX (D-501): kuota `render` ditagih SEBELUM validasi skema; batas kardinalitas SEBELUM render (blok inline: `maxItems` skema v2, mis. kategori/titik berlabel 200, seri 24, titik xy 2000, simpul diagram 24; spec terselesaikan: batas sama + sel matriks 5000, total nilai distribusi 20000, total butir panel komposit 600); render lewat antrean render berbatas (`renderGate`) | 400 `SCHEMA_INVALID` (termasuk `maxItems`); 404 `DOCUMENT_NOT_FOUND`/`REVISION_NOT_FOUND`/`PID_NOT_FOUND`/`ADDRESS_NOT_FOUND`; 422 `BLOCK_TYPE_NOT_ADMITTED` (sasaran bukan chart/diagram); 422 `BY_CONSTRUCTION_FAILED` `details: { checkId: "FIGURE_CAPACITY", issues: [{ pointer, keyword: "maxItems", limit, actual, message }] }` (figur melampaui batas, tanpa render; pesan menyarankan `topN` atau pecah gambar); 429 (bucket `render`); 503 `RENDER_QUEUE_FULL` + `Retry-After` |
| R18 | `/api/studio/assets` | POST | baru | multipart `file`, atau JSON `{ mime: image/png\|image/jpeg, dataBase64 }`; `?mission=` opsional | 201 `{ asset: { sha256, mime, widthPx, heightPx, bytes, createdAt }, created: true }`; 200 `{ asset, created: false }` (sha sudah ada); tanpa path | 400 `SCHEMA_INVALID`, `JSON_MALFORMED`; 413 `ASSET_TOO_LARGE` (> 20 MiB, sisi > 20.000 px, > 80 MP), `PAYLOAD_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`, `UNSUPPORTED_MEDIA_TYPE`; 429 `RATE_LIMITED` (60/menit, atau kuota byte aset baru 24 jam bergulir: 512 MiB per pengguna sesi, 2 GiB satu ember bersama pemegang rahasia internal; `Retry-After`); 500 `STORAGE_WRITE_FAILED` (ruang disk sesudah tulis < 2 GiB) |
| R18 | `/api/studio/assets` | GET | baru | `?sha256=<heks\|sha256:heks>` atau `?mission=&take=(1..200)` | 200 `{ asset }` atau `{ assets }` | 404 `FILE_NOT_FOUND` |
| R19 | `/api/studio/templates/[id]/skeleton` | GET | baru | `?version=n` | 200 `{ template, versionNo, skeleton: studio.skeleton/v1, skeletonSha256, implicit, essentials: { global, bySlot }, advancedIncluded }`; lapis lanjutan dan roleFormats slot hanya untuk ADMIN, selain itu kenop esensial tampil sebagai proyeksi | 404 `TEMPLATE_NOT_FOUND` |
| R19 | `/api/studio/templates/[id]/skeleton` | POST | baru | `studio.skeleton/v1` + `{ baseVersionNo, changeNote, expertMode? }` (simpan = versi baru, parameter tingkat templat dibawa utuh, hanya kerangka diganti; `agentId` di badan ditolak) | 201 `{ version, skeletonSha256 }` | 400 `SCHEMA_INVALID` (`SKELETON_*`), `CHANGE_NOTE_REQUIRED`, `PARAM_CLASS_T_READONLY`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN`; 404 `TEMPLATE_NOT_FOUND`; 409 `VERSION_CONFLICT`; 413 `PAYLOAD_TOO_LARGE`; 422 `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE`, `PARAM_UNKNOWN_KEY` |
| - | `/api/studio/import/markdown` | POST | baru (D-328) | `{ markdown, chapterKey, title?, agentId?, target?, template?, meta?, slot? }`; `?validate=1` (wajib `target`) = dry-run R08 atas amplop | 200 `{ chapter, submission? (bila target), report: { importer: "md/v1", warnings, dropped, mapping }, validation, dryRun? }`; `dryRun.issues[].details` apa adanya (mis. `overwrittenPids`); role retoris lewat komentar `<!-- role: X -->` sebelum paragraf (peringatan `ROLE_UNKNOWN`, `ROLE_MARKER_UNATTACHED`, `ROLE_MARKER_INLINE`); tidak menyimpan, tidak merender | 400 `SCHEMA_INVALID`, `JSON_MALFORMED`; 401; 403 (dry-run templat terbatas); 413 `PAYLOAD_TOO_LARGE` (badan > 4 MiB, atau `details.reason` `MD_TOO_LONG` > 1.000.000 karakter, `MD_TOO_MANY_LINES` > 200.000, `MD_TOO_MANY_BLOCKS` > 50.000, `MD_TABLE_TOO_WIDE` > 100 kolom); 415; 422 `CHAPTER_KEY_INVALID`; 429 + `Retry-After` (header kuota `import`, atau bucket bersisa terkecil bila `?validate=1`; kuota impor 60/60 s, env `STUDIO_IMPORT_RATE_LIMIT`/`STUDIO_IMPORT_RATE_WINDOW_MS`; `?validate=1` juga kuota validasi R08) |
| R20 | `/api/studio/documents/[id]/content` | GET | baru | `?slot=&chapter=&rev=n` | 200 `{ document: { id, docNumber }, revisionNo, slot?, content }`; `?shape=submission` (dengan `chapter` atau `slot` tak-berulang, `agentId?`) = 200 `{ document, revisionNo, slot, shape, submitTo, submission, editHints }`, `submission` badan siap kirim (`target.documentId`, `baseRevisionNo` = revisi dibaca, pid utuh; tanpa ubahan → `unchanged`; slot kosong → `null`) (D-347); tanpa parameter = isi v2 penuh; `slot` = payload slot; `slot` + `chapter` = bab dengan `id` (pid) di bab, section, blok | 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `ADDRESS_NOT_FOUND`; 422 `SLOT_UNKNOWN`, `SLOT_USE_CHAPTER_ENDPOINT` (`shape=submission` pada slot berulang tanpa `chapter`); 400 `SCHEMA_INVALID` (`/query/shape`) |
| R21 | `/api/studio/contracts` | GET | baru (D-372) | `?mission=` (1..120, cocok tepat `missionFolder`) `&docKey=` (pola docKey, maks 64) `&docNumber=` (1..80; cocok `docNumber` tepat ATAU bentuk aman `docNumberSafe` nama final) `&kind=agentWorkReport&status=a,b` (1..8 butir dari `draft`, `complete`, `partial`, `blocked`, `needs-review`) `&cardId=t_<8 heksa>&owner=` (huruf kecil/angka/`._-`, maks 64) `&taskRef=` (huruf/angka/`._-`, maks 64) `&dueBefore=&dueAfter=` (`YYYY-MM-DD` sah, inklusif) `&take=` (1..200, bawaan 50) `&cursor=` (id dokumen dari `nextCursor`) `&includeArchived=0\|1` (bawaan `0`: dokumen terarsip dikecualikan; `1` = sertakan); setiap parameter paling banyak sekali; nilai ber-byte NUL ditolak | 200 `{ contracts: ContractSummaryV2[], nextCursor: string \| null }`; butir = `{ documentId, docNumber, title, kind, status, owner, taskRef, cardIds, dueOn, revisionNo, completeness: { status, missingRequired }, missionFolder, docKey, updatedAt, matchedItems? }` (nilai kosong = `null`; `status: null` = slot `record` belum terisi; `matchedItems: [{ key, status, pid, title }]` hanya bila `cardId` diisi); hanya dokumen ber-`contractKind`, urutan `updatedAt DESC, id DESC`; tanpa tulis DB; setiap 200 menulis log baca JSONL `logs/query` (identitas, filter dipotong, jumlah hasil, cid; D-402/D-407); header kuota `query` | 400 `SCHEMA_INVALID` pointer `/query/<nama>` (parameter tak dikenal, ganda, atau tidak sah; `includeArchived` selain `0`/`1`; byte NUL keyword `pattern`; sebelum tagihan, tanpa header kuota); 429 `RATE_LIMITED` (bucket `query`, `Retry-After`) |
| R22 | `/api/studio/search` | GET | baru (D-372) | `?q=` (wajib, 2..200 karakter sesudah dipangkas) `&mission=` (1..120) `&kind=agentWorkReport&documentId=` (`^[a-z0-9]{20,40}$`) `&revisionNo=` (≥ 1, hanya bersama `documentId`) `&type=a,b` (1..8 butir dari `CONTENT_BLOCK_TYPES`, jenis slot, `sourceRegisterEntry`, `contractItem`) `&slotKey=&take=` (1..100, bawaan 20) `&cursor=` (string opak dari `nextCursor`) `&includeArchived=0\|1` (bawaan `0`: dokumen terarsip dikecualikan, juga bersama `documentId`; `1` = sertakan); nilai ber-byte NUL ditolak | 200 `{ hits: SearchHitV2[], nextCursor: string \| null, query: { q, config: "simple" } }`; hit = `{ documentId, docNumber, title, kind, revisionNo, pid, address, slotKey, chapterKey, type, snippet, rank }` (teks penuh paragraf v2 revisi terkini; `snippet` menandai kata cocok dengan `[[`…`]]`); `q` yang hanya tanda baca → `hits: []`; kueri terparameter, tanpa tulis DB; setiap 200 menulis log baca JSONL `logs/query` (`q` dipotong, tanpa isi cuplikan); header kuota `query` | 400 `SCHEMA_INVALID` (`/query/q` kosong atau melebihi batas, `/query/revisionNo` tanpa `documentId`, parameter tak dikenal atau ganda, `includeArchived` selain `0`/`1`, byte NUL; sebelum tagihan, tanpa header kuota); 429 `RATE_LIMITED` (bucket `query`, `Retry-After`) |
| R23 | `/api/studio/drafts/check` | POST | baru (D-378) | JSON `{ markdown: string, agentId?: string (1..80) }`, kunci lain ditolak; batas: badan ≤ 4 MiB (4.194.304 byte), `markdown` ≤ 2.000.000 karakter, ≤ 20 blok `json`; setiap blok berisi JSON sah di-dry-run seperti R08 dalam transaksi READ ONLY (agentId dry-run = `agentId` payload blok, selain itu `agentId` badan, D-393) | 200 `DraftCheckResultV2 { valid, header: { title, tujuan, langkahBerikut, basis }, issues: [{ code, severity, line?, column?, blockIndex?, message }], blocks: [{ index, line, endLine, schema, valid, issues, payload, submitPreview?, completenessPreview? }] }` untuk setiap masukan dalam batas; isu ekstraksi `DRAFT_NO_JSON_BLOCK`, `DRAFT_FENCE_UNCLOSED`, `DRAFT_JSON_MALFORMED`, `DRAFT_BLOCK_NOT_OBJECT`, `DRAFT_SCHEMA_UNKNOWN` (error), `DRAFT_HEADER_INCOMPLETE`, `DRAFT_BASIS_INVALID`, `DRAFT_BASIS_STALE` (warning) = isi `issues`, bukan status HTTP; 0 tulis DB, tanpa render; blok bab/slot sesudah blok buat-dokumen ber-`mission.folder` + `docKey` sama di-dry-run sebagai bagian dokumen yang akan dibuat (simulasi berurutan U-05a, layanan bersama dengan CLI); hasil sama dengan CLI `scripts/studio/draft-check.ts --remote --json --with-payload` (tanpa `--with-payload` CLI menghilangkan `blocks[].payload`); header kuota `validate` pada setiap 200 (tagihan = satu per dry-run yang dijalankan, minimal satu: satu per blok di muka (FIX-SEC L-2) ditambah satu tepat sebelum setiap dry-run ulang bersimulasi, sehingga bab/slot sesudah blok buat-dokumen yang belum ada dihitung dua kali; R2-F2 #7, D-429) | 400 `JSON_MALFORMED`, `SCHEMA_INVALID` (kunci tak dikenal, tipe); 413 `PAYLOAD_TOO_LARGE` `details.reason` `DRAFT_TOO_LONG` (badan atau `markdown`) atau `DRAFT_TOO_MANY_BLOCKS`; 415 `UNSUPPORTED_MEDIA_TYPE`; 429 `RATE_LIMITED` (bucket `validate` ditagih satu per blok sebelum dry-run pertama, minimal satu per panggilan; satu tagihan ditolak = tanpa dry-run apa pun; tagihan dry-run ulang yang ditolak = 429 tanpa dry-run ulang itu; `Retry-After`) |

Catatan status kode per 2026-10-23 (tabel di atas = target register
`docs/2026-10-22_doc_artifact_studio/masterplan/03_structural_sections_specs.md` §12):
- R19: ada di `src/app/api/studio/templates/[id]/skeleton/route.ts` (SR-26): GET kerangka + esensial slot, POST versi baru.
- R06 dan R07: berkas route masih bentuk S56. R06 GET belum mengembalikan `pid`. R06 PATCH pada
  dokumen v2 memetakan alamat ke pid dan menjalankan jalur sunting pid (respons R16 ditambah
  `job: null`, `outputs: []`; konflik `409 SCOPE_CONFLICT`); pada dokumen v1 tetap
  `{ revision, addressMap, job: null, outputs: [] }` dan `409 REVISION_CONFLICT`. Batas `change`
  R06 = 4.000 (cek route). R07 POST memeriksa kelengkapan di layanan render, bukan di route.
- Kontrak dokumen per 2026-10-30 (target register
  `docs/2026-10-22_doc_artifact_studio/masterplan/05_document_contract_specs.md` §9, §10, §13):
  R21 `contracts/route.ts`, R22 `search/route.ts`, R23 `drafts/check/route.ts`, R10 `GET`+`HEAD`
  `files/[id]/route.ts`, R03 `kind=contracts` di `registry/route.ts`; kode galat EC25-EC28 di
  `contract/enums.ts` + `contract/errors.ts` (73 kode, semua EC25-EC28 = 422). Medan `warnings`
  R16/R06/R14 adalah tambahan kode di luar register (D-386, D-389).
- Per 2026-10-31: FIX-QA (D-403) membungkus R04 POST, R12, R13, R06/R14/R16 PATCH dengan
  `withQuotaHeaders`, sehingga catatan lama "header kuota kiriman/PATCH hanya pada 429" tidak berlaku
  lagi; FIX-QB (D-403) menambah `warnings` tingkat atas R08 cabang `studio.doc/v2`; FIX-SEC
  (D-402, D-407) menambah `includeArchived`, penolakan byte NUL, log baca R21/R22, tagihan R23
  max(1, blok), dan kunci kuota per agen + `STUDIO_QUOTA_AGENT_CEILING_FACTOR`. Risiko M-2
  (`draft-check --remote` mengirim rahasia ke URL apa pun dan mengikuti redirect) diterima USER
  tanpa perubahan kode; panduan agen seksi 17.9 membatasi pemakaian `--remote` ke server lokal.
- Per 2026-10-31 (R2, D-419/D-423): CLI baru `scripts/studio/studio-report.ts submit <draf.md>` dan
  `update <documentId> <draf.md>` mengirim laporan kerja dari draf MD tanpa curl dan tanpa berkas badan:
  R13/R12/R04 berurutan, R15, R17 (HTML), R10 unduh ke memori + `HEAD ?verify=1`; `update` membaca
  basis R20 dan hanya mengirim blok yang berubah; pengalihan 3xx tidak diikuti; kode keluar 0/1/2/3;
  `--timing` (20 kolom, RFC 4180, env `STUDIO_TIMING_*`) hanya untuk uji. `draft-check`: simulasi
  berurutan (berlaku juga di R23), `--json` selalu JSON (galat fatal `{ fatal: { code, message } }`),
  dapat dijalankan dari cwd mana pun, `blocks[].payload` hanya dengan `--with-payload`. R03
  `kind=contracts` menyajikan `examples` (R2-02) dan `REGISTRY_KIND_UNKNOWN` membawa `details` larik satu isu berisi `validKinds` + `examples` (R2-F1).
  CLI bukan route; tabel route di atas tidak berubah. Resep agen: panduan seksi 17.0.
- Per 2026-10-31 (R2-F2, D-427/D-429): klien HTTP bersama `scripts/studio/_http-client.ts` untuk
  kedua CLI (batas waktu 60 s; 3xx `REMOTE_REDIRECT`, 401 `REMOTE_UNAUTHORIZED`, 429 `RATE_LIMITED`;
  pengalihan: `studio-report` `manual`, `draft-check` tetap `follow`). `studio-report`: blok yang
  menarget misi atau `docKey` contoh registri (`2026-10-31_misi_contoh`, `laporan-kerja-penulis`)
  ditolak `EXAMPLE_TARGET` keluar 2 sebelum kiriman pertama kecuali `--allow-example`; kiriman yang
  terputus sesudah ada blok tersimpan tetap keluar 1/2 dan membawa `fatal.progress` { documentId,
  docNumber, revisionNo, completedSteps, failedStep, allBlocksSent, resume } (lanjut: jalankan ulang
  perintah yang sama, idempoten, atau `update <documentId>`); 401 kini `REMOTE_UNAUTHORIZED` (dulu
  `HTTP_401` atau `code` server); `--out` hanya menyimpan nama yang lolos pola nama final C51, selain
  itu `OUT_NAME_UNSAFE` keluar 2; sel `--timing` berawalan formula diberi `'`. `draft-check`: batas
  waktu 30 -> 60 s; galat fatal dari jawaban server membawa `details` { httpStatus, serverCode?,
  correlationId? }. R23: tagihan per dry-run (baris R23 di atas).
- Per 2026-11-01 (R3, D-436/D-439/D-440/D-441/D-443): `studio-report` menerima laporan MD biasa
  (tanpa blok json) di `submit`/`update`; perintah baru `template` (placeholder `<isi: ...>`, laporan
  berplaceholder ditolak `TEMPLATE_PLACEHOLDER`) dan `check <laporan.md> [--remote]` (konversi +
  dry-run R08, nol tulis). `update` wajib basis (`basis: <documentId>@rev<n>` dicetak submit/update,
  atau `--base-rev`; tanpa basis `BASIS_MISSING`), mengirim hanya bagian yang diubah sejak basis
  (R20 `?rev=n`), dan menolak bagian yang juga diubah pihak lain (`BASE_CONFLICT`, tanpa kiriman);
  opsi `--section`, `--force-latest`, `--doc-key`, `--format`. Butir kerja harus tabel (record yang
  akan kehilangan items/evidence/refs ditolak `RECORD_FIELDS_DROPPED`); `## Rujukan` tabel ->
  `record.refs`; `Initiator:` dipetakan; `--agent-id` menang atas `agentId:` kepala. CLI bukan route;
  tabel route tidak berubah. Resep agen: panduan seksi 17.0.

**Route internal UI (bukan untuk agen):**

| Endpoint | Metode | Permintaan | Respons | Galat |
|---|---|---|---|---|
| `/api/studio/client-log` | POST | `{ level: error\|warn\|info, message, route?, correlationId?, source?, code?, status?, stack?, detail?, timestamp? }` (maks 16 KiB) | 202 `{ accepted: true, correlationId }`; ditulis ke log JSONL Studio (`source: studio.client`), rahasia disaring | 400 `JSON_MALFORMED`, `SCHEMA_INVALID`; 401; 413 `PAYLOAD_TOO_LARGE`; 429 (> 30 entri per menit per sesi, `Retry-After`, badan tanpa `code`) |
