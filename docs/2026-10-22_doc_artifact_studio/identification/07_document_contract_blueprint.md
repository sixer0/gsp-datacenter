---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-10-30
agent: task-architect
document: identification/07_document_contract_blueprint.md (adendum fase "Document contract berformat JSON tunggal"; tidak menggantikan 02_structured.md atau 05_structural_sections_blueprint.md)
scale_category: Penyempurnaan (Enhancement; skala Besar)
blueprint_state: refinement pass grounded (Glob/Read sesi ini atas kode, skema DB, keputusan, laporan Hermes, korpus kontrak Hermes); baris riset + implementasi + Execution Profile
binding_decisions: D-06, D-18, D-19, D-21, D-133, D-139, D-247, D-261, D-272, D-275, D-320..D-349
intake: identification/06_document_contract_original.md, identification/06_document_contract_translated.md
status: needs-review (menunggu persetujuan user lewat Plan Mode; 4 keputusan terbuka untuk USER, 6 untuk controller)
---

# Blueprint Adendum: Document Contract Berformat JSON Tunggal (Doc Artifact Studio, Swarm HQ v2.1)

Singkatan path: `<task>` = `docs/2026-10-22_doc_artifact_studio`. Semua path relatif ke akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`. `L` = `src/lib/studio`. `API` = `src/app/api/studio`. Workspace Hermes = `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/` (hanya dibaca; Hermes menulis sendiri di sana saat uji coba).

## 0. Prinsip pembuka (diuji untuk setiap keputusan)

> "konten isi dokumen itu dinamis urusan agent ... agent cuma kirim konten data dan read/edit via api" (D-139)

> "diseragamkan saja format json antara document contract dan document output. jadi hermes tidak perlu effort untuk thinking lagi" (intake 06 butir 3, D-344)

Konsekuensi yang mengikat fase ini:
- (a) **Satu format.** Document contract adalah dokumen Studio biasa (`studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`). Tidak ada skema kontrak terpisah. Jenis kontrak = templat Studio yang kerangka slotnya memuat bagian wajib.
- (b) **Medan terstruktur = konten.** Status, kartu, rujukan, tanggal, dan penanggung jawab adalah data. Label, urutan tampil, tabel, dan gaya milik templat dan mesin.
- (c) **Tanpa versi mentah di disk (D-345).** Sumber kebenarannya JSON di DB. Di disk hanya ada berkas final hasil generate yang diunduh lewat API, dengan nama beridentitas waktu. Studio tidak menulis ke workspace bersama (D-322 H3).
- (d) **Draf dan checkpoint (D-346)** berupa berkas MD dengan kepala ringkas dan blok berpagar `json` berisi payload siap kirim. Payload itu divalidasi mesin sebelum dikirim.

Uji prinsip atas keputusan desain blueprint ini (difinalkan DC-02):

| Keputusan | Vonis D-139 | Alasan |
|---|---|---|
| Slot baru `contractRecord` berisi `status`, `owner`, `initiator`, `opened`, `due`, `cardIds`, `refs`, `items[]` | Lulus | Semuanya data. Label "Status", "Penanggung jawab", dan tata letak tabel fakta berasal dari templat/registri |
| Set status tertutup per jenis kontrak | Lulus | Kode ASCII adalah data. Label bahasa tampil dari templat |
| `refs[]` = `documentId`/`docNumber` + `pid` + `rel` | Lulus | Alamat isi (Hermes B2: "alamat antardokumen via documentId+pid, bukan path") |
| Outline bab wajib per jenis kontrak (kerangka templat) | Lulus | Struktur milik templat. Agen hanya mengisi bab |
| Nama berkas final `<nomorDokumen>_rev<n>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>` | Lulus | Metadata unduhan dari mesin. Agen tidak mengirimnya |
| Kepala draf MD (judul, tujuan, langkah berikut, basis) | Lulus | Tidak pernah dikirim ke API. Ekstraktor hanya mengambil blok `json` |
| `chart.custom` = `code: "custom"` + `form` berbatas (mark, orientasi, tumpuk) + data | Lulus bersyarat | Pilihan analitis termasuk isi, setara `code` preset. Warna, ukuran, sumbu, dan gaya tetap milik templat. Medan tampilan apa pun tetap ditolak `DISPLAY_FIELD` |
| Header `X-Studio-Quota-Remaining` | Lulus | Metadata respons, bukan kontrak |

## 1. Konteks (naratif, bukan instruksi delegasi)

### 1.1 Permintaan dan keputusan yang mengikat

Sumber: intake 06 (kutipan USER apa adanya), D-341, D-344, D-345, D-346, D-348.

1. Hermes saat ini menulis kontrak antar-agen sebagai MD dengan format berbeda-beda, puluhan berkas per misi (`hermes_trial/01_interview_answer.md:5`). Bukti dari korpus (Glob sesi ini):
   - Ada 463 berkas `contract*.md` di bawah workspace Hermes.
   - `2026-09-05-pendalaman-expo-standard/contract.md:3` menulis status sebagai `**Status:** berjalan`, dan tabel kartunya berkolom `id, judul, assignee, fase, dep, status, bukti` (`:25`).
   - `2026-10-30_hermes-retrial/contract.md:3,10` memakai baris kepala lain dan tabel kartu tanpa kolom `fase`/`dep`.
   - `PHASE-REPORTS.md:4-9` memakai pola `[FASE] RINGKAS ARTEFAK JALUR RENCANA ESTIMASI`.
2. Konsultasi B Hermes (`hermes_trial/03_retrial_feedback.md:41-44`):
   - Pindah lebih dulu: kontrak misi, PHASE-REPORTS/LAPOR-FASE, blueprint gelombang, dan artefak klien.
   - Tetap MD: draf/checkpoint, register data, komentar papan, dan input gerbang deterministik.
   - Syarat Hermes: JSON sebagai sumber kebenaran, HTML sebagai proyeksi DATUM, enum status tertutup, documentId+pid, diff lewat ledger revisi, `cardIds`, dan nol edit manual HTML.
   - Risiko yang Hermes sebut: dua sumber kebenaran, latensi, ekstraktor untuk scanner, kuota render, dan retensi DB.
3. D-345/D-346: tanpa versi mentah di disk; nama final beridentitas waktu; draf/checkpoint berupa MD yang isinya JSON.
4. Tambahan dari uji ulang (`03_retrial_feedback.md:30-31`): header `X-Studio-Quota-Remaining` dan kelas `chart.custom` berbatas.
5. Batasan: produksi `gsp_agent_hq`, port 9011, dan `~/gsp-datacenter` tidak disentuh. Pengembangan di DB `gsp_agent_hq_v21` (+ `_uji`, `_shadow`) dan DEV 9021. Migrasi aditif tanpa DROP dengan prosedur D-21 (`migrate dev`/`db push` dilarang). Push hanya dengan izin user.

### 1.2 Tantangan arsitektur (grounded)

1. **Tempat medan terstruktur.**
   - Union payload slot tak-berulang ada di `L/contract/types/v2/slot.ts:100-106`. Jenis slot sah ada di `L/registry/slots.ts:25-34` (8 jenis).
   - Pin hitungan section type: `L/registry/sections.ts:646-649` (`SECTION_REGISTRY_COUNT = 51`, kelompok 29/7/15). Baris DB `StudioSectionType` di-seed dan dirujuk FK `Restrict` dari `StudioTemplateSlot` (`prisma/schema.prisma:1019`).
   - Akibatnya, slot baru `contractRecord` menuntut registri, seed, compose, kelengkapan, dan dua perakit. Biaya ini sengaja diambil: slot dapat diperbarui sendiri lewat R13 (`studio.slot/v2`, `slot.ts:115-129`) tanpa menyentuh `meta` dan tanpa 409 dengan bab.
   - Alternatif `meta.cardIds` (usul literal Hermes) ditolak. `DocMetaV2` (`types/v2/common.ts:32-49`) adalah metadata cetak bergaya v1. Status per fase tidak boleh memaksa sunting meta dokumen, dan butir kartu (`items[]`) tidak muat di meta.
2. **Retrieval.**
   - Kolom filter misi dan `hermesTaskId` sudah ada dan terindeks (`schema.prisma:774-776`, `:790-793`). GET /documents sudah memfilter `mission`, `docKey`, `hermesTaskId` (`API/documents/route.ts:5`, `:204-218`). Belum ada jenis, status, atau kartu.
   - Teks paragraf ada di `StudioDocBlock.textPlain @db.Text` (`schema.prisma:1162`), salinan penuh per revisi (R6), jadi kueri harus dibatasi ke revisi terkini.
   - Preseden FTS repo:
     - Migrasi `20260927154000_add_ilsearchdoc/migration.sql:8`: `pg_trgm` terpasang.
     - Migrasi yang sama `:29-36`: kolom `tsvector GENERATED ALWAYS ... STORED` dengan konfigurasi `simple` + indeks GIN.
     - `schema.prisma:556-577`: kolom dipetakan `Unsupported("tsvector")` dan drift Prisma dicatat.
3. **Nama berkas.**
   - `fileName` hari ini adalah nama DATUM untuk manusia (`L/services/render/naming.ts:51-61`, DATUM-38). Berkas disajikan R10 lewat id dengan header sha (`API/files/[id]/route.ts:51-58`).
   - Nama final cukup dihitung dari baris `StudioOutputFile` (`revisionId`, `createdAt`, `sha256`, `format`; `schema.prisma:893-923`) ditambah `docNumber` dan `revisionNo`. Tidak perlu kolom atau tulisan baru ke disk.
4. **Kuota.** `RateLimitResult.remaining` sudah dihitung (`L/http/rate-limit.ts:7-12`) tetapi tidak diekspos. Ada tiga bucket: render (`L/http/render-guard.ts:35`), validate/pratinjau (`API/validate/_shared/validate-rate.ts:35`), dan import (`API/import/markdown/_lib/import-rate.ts:31`).
5. **chart.custom.** `ChartV2.code` = `ChartCode | "composite"` (`types/v2/doc.ts:174-194`). Kode adalah enum tertutup P/H/K/W/S/G + DF (`L/contract/enums.ts:126-148`), dan registri chart memakai pin 76 (`L/registry/charts.ts:1359`).
6. **Identitas pemanggil.** `agentId` hanya label klaim pemegang rahasia internal bersama, bukan identitas (`L/contract/auth.ts:16-19`, `:130-132`). Ini relevan untuk "penulis tunggal kontrak" (U-3).
7. **Pekerjaan berjalan.** FIX-R1 (rel K2, `engine/docx`), FIX-T2 (TOC, `engine/docx`), dan DOC-4 (panduan) sedang berjalan (D-342, D-343, D-347, D-349). Blueprint ini dibuat paralel (D-348), sehingga baris yang menyentuh berkas yang sama menunggu (P-1).

### 1.3 Kategori skala dan postur verifikasi

Penyempurnaan skala Besar. Fitur baru lintas kontrak, DB, layanan, API, mesin, panduan, dan uji coba agen.

Postur verifikasi mengikuti D-133:
- Implementasi memakai gerbang ringan per baris: tsc seluruh repo dengan galat diatribusikan ke area, eslint area, dan satu asap fungsi.
- Satu gerbang integrasi (DC-31) membuka fase akhir.
- Fase akhir berisi uji unit/API, banding 3 misi, gladi rollback, kinerja, E2E, review kode, security, review dokumen, uji coba Hermes, metrik efisiensi, lalu verifier.

### 1.4 Asumsi (dapat dikoreksi; dibawa ke DC-02)

| ID | Asumsi | Dasar |
|---|---|---|
| AS-1 | Kontrak ditulis lewat endpoint kiriman yang ada: R04 buat dokumen, R13 slot `record`, R12 bab, R16 PATCH pid. Tidak ada route tulis baru | §0 (c) panduan; D-247 render terpisah |
| AS-2 | Kebijakan baca Studio: semua pemanggil terautentikasi membaca semua dokumen. Query mewarisi kebijakan ini; DC-41 menilainya | `API/documents/route.ts:204-218` tanpa filter pemilik |
| AS-3 | Butir kontrak dikunci `key` (umumnya id kartu `t_xxxxxxxx`). Pembaruan status = kirim ulang payload slot `record` (idempoten sha, `baseRevisionNo`) | `contract.md:27-41` korpus; D-324 |
| AS-4 | FTS memakai konfigurasi `simple` untuk teks campuran ID/EN, dengan `pg_trgm` sebagai cadangan pencarian sebagian | preseden IlSearchDoc |
| AS-5 | Format bawaan templat kontrak = HTML (proyeksi manusia/klien). DOCX/PDF tetap dapat diminta | D-341, D-344 |
| AS-6 | Kode status berupa ASCII huruf kecil. Label tampil berasal dari templat | D-139 |
| AS-7 | Profil Hermes `gsp-master01`, konfigurasi dan kredensial Hermes tidak diubah, rahasia uji DEV dipakai | D-320, D-334 |
| AS-8 | Scanner gaya Hermes membaca teks dari R20 (`GET content`, JSON sumber kebenaran), bukan dari HTML. Ekstraktor HTML tidak dibuat (KC-6) | Hermes B4 "scanner butuh ekstraktor HTML resmi" |

### 1.5 Prasyarat (gerbang beralasan, bukan baris)

- **P-1:** DC-13 (`engine/docx/assemble`) baru mulai setelah controller menerima FIX-R1 dan FIX-T2. DC-33 (`docs/STUDIO-AGENT-GUIDE.md`) baru mulai setelah DOC-4 diterima. Alasannya: berkas yang sama sedang ditulis pemilik lain (satu penulis per berkas).
- **P-2:** Controller me-restart DEV 9021 sebelum DC-31, DC-43, dan DC-45. Kode server dibekukan selama DC-45 (pelajaran D-340).
- **P-3:** PDF di DEV tetap menunggu USER keluar-masuk sesi Windows (D-322). Fase ini tidak bergantung pada PDF (HTML bawaan).

### 1.6 Kontinuitas

Fase ini melanjutkan:
- importer `md/v1` (D-328, D-337), yang dipakai generator;
- `?shape=submission` R20 (D-347), yang dipakai alur pulih kontrak;
- preflight 503 dan urutan galat (D-325, D-336);
- 409 `PATCHED_PIDS_OVERWRITTEN` (D-324), yang melindungi suntingan kontrak;
- bucket import (D-337).

`masterplan/02_plan.md` tidak disentuh.

## 2. Ringkasan desain (usulan; DC-02 menguncinya di register `masterplan/05_document_contract_specs.md`)

### 2.1 Jenis kontrak = templat Studio

| contractKind | Slug templat (usulan) | Tier | Kerangka (slotKey: sectionType) | Outline bab wajib (usulan; dari korpus DC-01) |
|---|---|---|---|---|
| `missionContract` | `kontrak-misi` | NOTA | `record`: contractRecord (wajib); `content`: chapter (wajib); `references`: sourceRegister (opsional) | tujuan, acuan, keputusan, catatan-eksekusi, verifikasi, penutupan |
| `phaseReport` | `laporan-fase` | NOTA | `record` (wajib); `content` (satu bab per fase, berulang) | per bab: ringkas, artefak, jalur, rencana, estimasi (dicek kelengkapan bila register menetapkannya) |
| `waveBlueprint` | `blueprint-gelombang` | NOTA | `record` (wajib, `items[]` = langkah/kartu); `content` | konteks, langkah, risiko |
| `completionReport` | `laporan-selesai` | NOTA | `record` (wajib); `content` | hasil, bukti, deviasi, serah |

Artefak yang dibaca klien tetap menjadi dokumen output biasa di templat yang ada (`datum-gsp`). Cakupan tahap 1 = U-1.

Set status (usulan; DC-01 mengukur kosakata nyata korpus, DC-02 mengunci):

| Lingkup | Kode |
|---|---|
| `missionContract` | `draft`, `running`, `blocked`, `closed`, `cancelled` |
| `phaseReport` | `draft`, `issued`, `corrected` |
| `waveBlueprint` | `draft`, `approved`, `superseded` |
| `completionReport` | `draft`, `issued`, `accepted`, `rejected` |
| butir (`items[].status`) | `todo`, `ready`, `running`, `review`, `done`, `blocked`, `cancelled` |

### 2.2 Payload `contractRecord` (konten murni, `additionalProperties: false`)

```json
{
  "$schema": "studio.slot/v2",
  "target": { "mission": { "folder": "2026-10-30_hermes-retrial" }, "docKey": "kontrak-misi" },
  "slot": "record",
  "baseRevisionNo": 3,
  "payload": {
    "type": "contractRecord",
    "status": "running",
    "owner": "gsp-master01",
    "initiator": "user",
    "opened": "2026-10-30",
    "due": "2026-11-02",
    "cardIds": ["t_249c6b84"],
    "refs": [{ "documentId": "cmvui0qun000qv11gtygb1mk9", "pid": "p-8rj0w4aw6r", "rel": "evidence" }],
    "items": [
      { "key": "t_5943d415", "title": { "text": "STD-REF: ukur instance + peta sha modul" }, "status": "ready",
        "owner": "gsp-data-analyst", "phase": "M1", "dependsOn": ["t_ce0ba66b"], "evidence": { "text": "research/03.md" } }
    ]
  }
}
```

Aturan validasi (galat `CONTRACT_*` difinalkan DC-02):
- `status` harus berada dalam set jenis templat.
- `cardIds` dan `items[].key` mengikuti pola dari korpus (usulan `^t_[0-9a-f]{8}$`, dengan pengecualian kunci non-kartu bila register mengizinkan).
- Tanggal memakai `YYYY-MM-DD` atau UTC ISO.
- `owner` mengikuti pola id agen/pengguna.
- `refs[].documentId` harus ada (422). `pid` harus ada di identitas dokumen, dan pid yang sudah pensiun menghasilkan peringatan (KC-3).
- `rel` adalah enum tertutup (mis. `evidence`, `supersedes`, `basis`, `output`).

### 2.3 Model data (Prisma, aditif; nama migrasi dikunci DC-02)

| ID | Objek | Isi (usulan) |
|---|---|---|
| M19 | `StudioContractRecord` | per revisi (salinan penuh, R6): `revisionId @unique`, `documentId`, `contractKind`, `status`, `owner?`, `initiator?`, `openedOn?`, `dueOn?`, `cardIds String[]` (GIN) |
| M20 | `StudioContractItem` | `recordId`, `revisionId`, `itemKey`, `position`, `status`, `owner?`, `phase?`, `dueOn?`, `cardIds String[]` (GIN), `titlePlain` |
| M21 | `StudioDocRef` | `revisionId`, `fromDocumentId`, `fromScope` (record/butir), `targetDocumentId`, `targetPid?`, `targetRevisionNo?`, `rel` |
| kolom | `StudioTemplate.contractKind String?` + indeks | null = templat dokumen output |
| kolom | `StudioDocument.contractKind?`, `contractStatus?`, `contractCardIds String[]` + indeks | cermin revisi terbaru (preseden `completeness`, `schema.prisma:782`) |
| kolom | `StudioDocBlock.tsv` `Unsupported("tsvector")` GENERATED `to_tsvector('simple', "textPlain")` STORED + GIN | SQL tangan, preseden `20260927154000` |

Penjaga migrasi:
- 0 DROP.
- Semua `CREATE TABLE` dan `CREATE INDEX` berawalan `Studio`.
- `ALTER TABLE` hanya ADD.
- `migrate status` up to date.
- Hitungan baris tabel lama identik.
- Rollback SQL delta disimpan di register dan digladikan DC-38 di `_uji`.

### 2.4 API (baru dan berubah)

| Route | Isi |
|---|---|
| R21 `GET /api/studio/contracts` | filter `mission`, `kind`, `status`, `cardId`, `owner`, `dueBefore`/`dueAfter`, `take`, `cursor`. Hasil per dokumen: `documentId`, `docNumber`, `title`, `kind`, `status`, `revisionNo`, `cardIds`, `owner`, `due`, `completeness`, `updatedAt` |
| R22 `GET /api/studio/search` | `q` wajib (batas panjang di register), filter `mission`, `kind`, `documentId`, `type`. Hasil: `documentId`, `docNumber`, `revisionNo`, `pid`, `address`, `slotKey`, `chapterKey`, `snippet`, `rank`. Revisi terkini (KC-4) |
| R23 `POST /api/studio/drafts/check` | badan teks MD berbatas. Ekstrak blok `json` lalu dry-run R08 per blok. Hasil: `blocks[{index, line, schema, valid, issues, payload}]`. 0 tulis DB |
| R03 `GET /api/studio/registry?kind=contracts` | jenis, kerangka, outline wajib, set status, alias generator |
| R10 `GET /api/studio/files/{id}` | header `X-Studio-Final-Filename` selalu. Content-Disposition mengikuti U-2 |
| R17 render | `outputs[].finalFileName` |
| Bucket validate/pratinjau, import, render, query | `X-Studio-Quota-Remaining` + `X-Studio-Quota-Bucket` pada 2xx dan 429 |

Semua route baru memakai `requireSession` + `getStudioCaller`. Tanpa sesi = 401. Galat terstruktur memakai `x-correlation-id` (pola D-323).

### 2.5 Nama berkas final

```
<docNumberSafe>_rev<revisionNo>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>
contoh: 003-GSP-KT-X-2026_rev12_20261030T125800Z_55d324b1.html
regex usulan: ^[A-Za-z0-9.-]{1,80}_rev[1-9][0-9]*_[0-9]{8}T[0-9]{6}Z_[0-9a-f]{8}\.(docx|pdf|html)$
```

- `docNumberSafe`: `/` dan karakter di luar `[A-Za-z0-9.-]` diganti `-`.
- Waktu diambil dari `StudioOutputFile.createdAt` (waktu render, UTC).
- `sha8` = 8 heksa awal sha256 berkas.

Agen atau librarian mengunduh lewat API lalu menyimpan berkas di folder misinya sendiri. Kebenaran berkas dicek ke sistem dengan `?verify=1` atau dengan mencocokkan sha8 dan `revisionNo` ke R07/R10.

### 2.6 Draf dan checkpoint MD

````
# DRAF Kontrak Misi RETRIAL-STUDIO-DEV-1030
tujuan: uji ulang Studio dan konsultasi document contract
langkah-berikut: kirim slot record lalu bab 1-3
basis: cmvui0qun000qv11gtygb1mk9@rev3

```json
{ "$schema": "studio.slot/v2", "target": { "documentId": "cmvui0qun000qv11gtygb1mk9" }, "slot": "record", "payload": { "type": "contractRecord", "status": "running" } }
```
````

- Kunci kepala tetap dan huruf kecil.
- Satu blok atau lebih; setiap blok berisi satu payload v2 utuh.
- Teks lain diabaikan ekstraktor.
- Validasi lewat CLI `draft-check` (lokal atau `--remote` R08) atau R23.
- Payload dikirim apa adanya (`--emit`).

### 2.7 Generator MD lama ke kontrak JSON

Generator memakai importer `md/v1` (`L/services/import/markdown.ts`) untuk prosa, ditambah tabel alias per jenis di registri:
- judul `##` dipetakan ke kunci outline;
- kosakata status MD (mis. `berjalan`, `done`, `closed-as-cancelled`) dipetakan ke kode;
- tabel kartu dipetakan ke `items[]` dan `cardIds`.

Nilai tanpa alias tidak ditebak. Generator mengeluarkan peringatan (`CONTRACT_STATUS_UNMAPPED`, `CONTRACT_HEADING_UNMAPPED`) dan teks tetap utuh, sesuai prinsip importer yang sudah dinilai benar oleh Hermes (`03_retrial_feedback.md:38`).

### 2.8 chart.custom

- Bentuk: `code: "custom"`, `form: { mark: bar / line / point / area, orientation?: vertical / horizontal, stacked?: boolean }`.
- Data hanya `categorical`, `series`, atau `xy`.
- Registri memetakan setiap kombinasi bentuk ke perender keluarga yang sudah ada. Tidak ada perender baru, dan tampilan tetap milik templat.
- Kombinasi bentuk-data yang tidak sah memberi galat terstruktur (kode dari register).

### 2.9 Pemetaan syarat Hermes (konsultasi B) ke desain

| Syarat Hermes | Jawaban desain | Baris |
|---|---|---|
| JSON sumber kebenaran, HTML proyeksi DATUM, nol edit manual HTML | Kontrak = dokumen Studio. HTML bawaan templat kontrak. Nama final memuat sha8 | DC-29, DC-12, DC-17 |
| Enum status tertutup | Set per jenis di registri, ditolak di gerbang by-construction | DC-06, DC-08 |
| Alamat documentId+pid | `refs[]` tervalidasi. R22 mengembalikan pid + alamat | DC-07, DC-16 |
| Diff lewat ledger revisi | Revisi D-06 yang ada (R07, riwayat pid R16) | (ada) |
| `meta.cardIds[]` | `record.cardIds` + `items[].key`, dengan kolom cermin terindeks (deviasi beralasan §1.2 butir 1) | DC-05, DC-09 |
| Endpoint kontrak | R21 + R22 | DC-15, DC-16 |
| Batch hemat kuota | Kiriman per slot `record` + header kuota | DC-19 |
| Ekstraktor untuk scanner | Teks dari R20 (KC-6) | - |
| Dua sumber kebenaran | Aturan panduan "tanpa kontrak mentah di disk" + metrik KE-5 + U-3 | DC-33, DC-46 |
| Transisi lewat md2kontrak + banding 3 misi | Generator + CLI + DC-37 | DC-24, DC-25, DC-37 |

## Structured Task Breakdown

Catatan baca:
- Kolom sama dengan `02_structured.md` dan `05_structural_sections_blueprint.md`. Depends On berlabel `:B` (build) atau `:C` (contract).
- "tsc" = `npx tsc --noEmit -p tsconfig.json` seluruh repo dengan galat diatribusikan ke area. "eslint" = `npx eslint <area>`. "asap" = satu skrip fungsi; data uji dibersihkan atau memakai transaksi-rollback.
- Catatan baris ditulis di `delegation_progress/<agent>_dcNN.md`.
- Urutan nomor tidak sama dengan urutan gelombang.

| Step | Task Description | Agent_to_Invoke | Skills_to_Load | Expected Output | Depends On | Verification | Phase |
|---|---|---|---|---|---|---|---|
| DC-01 | Inventaris korpus kontrak MD Hermes (baca-saja, workspace Hermes): jumlah berkas per jenis (contract*.md, PHASE-REPORTS.md, LAPOR-FASE*, blueprint 02_*), frekuensi judul `##`, kosakata status pada baris kepala dan kolom status tabel kartu, kolom tabel kartu, pola id kartu, medan kepala; 5 contoh berpath per jenis | data-collector | - | NEW <task>/research/10_contract_corpus_inventory.md | none | setiap angka dapat diulang dengan perintah yang dikutip; 0 berkas ditulis di workspace Hermes | research |
| DC-02 | Tulis register nama dan konstanta + spesifikasi document contract dengan §2 blueprint ini sebagai usulan: tabel vonis D-139, jenis kontrak (slug, contractKind, kerangka, outline wajib, set status), payload contractRecord, M19-M21 + kolom + SQL migrasi + rollback delta, FTS, route R21-R23 + R03 kind=contracts, nama final, draf MD, header kuota, chart.custom, kode galat, tabel alias generator. Masukan: DC-01, intake 06, D-341..D-349, register 03 | data-analyst | - | NEW <task>/masterplan/05_document_contract_specs.md | DC-01:B | setiap nama, kode, route, kolom, dan enum bernama tepat sekali; tabel vonis D-139 mencakup setiap medan baru; SQL rollback hanya menyebut objek delta | masterplan |
| DC-03 | Protokol metrik efisiensi Hermes: rumus waktu, langkah, galat format, retrieval, disk; arm A (alur MD lama) lawan arm B (JSON API) pada skenario sama; format timing.csv; ambang final KE-1..KE-7; pilih 3 misi nyata untuk banding dengan alasan | data-analyst | - | NEW <task>/research/11_contract_efficiency_protocol.md | DC-01:B, DC-02:C | setiap metrik punya rumus, sumber data, dan ambang; 3 path misi banding terverifikasi ada | research |
| DC-04 | Delta Prisma + migrasi aditif kontrak lewat prosedur D-21: baseline sebelum edit, shadow DB, migrate diff dikurangi drift baseline, SQL tangan tsvector GENERATED + GIN mengikuti preseden 20260927154000, migrate deploy v21, generate. Masukan: register DC-02 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS prisma/schema.prisma (aditif); NEW under prisma/migrations/: migrasi kontrak | DC-02:B | prisma validate exit 0; migration.sql 0 DROP dan hanya objek berawalan Studio; migrate status up to date dan hitungan baris tabel lama identik | implementation |
| DC-05 | Delta kontrak v2, penulis tunggal contract/**: tipe + JSON Schema payload contractRecord, ChartV2 code custom + form berbatas, enum jenis kontrak dan set status, kode galat baru + peta HTTP, konstanta route dan header; tulis marker landing | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/contract/ (aditif); NEW <task>/implementation/06_document_contract_landed.md | DC-02:B | tsc 0; contoh register lolos ajv dan varian bermedan tampilan ditolak DISPLAY_FIELD; jumlah kode galat sama dengan register | implementation |
| DC-06 | Registri kontrak: jenis slot contractRecord, section type baru + pin hitungan, registri jenis kontrak baru (kerangka, outline wajib, set status, alias generator), parameter kerangka slot.outline, ekspor index | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/registry/slots.ts, src/lib/studio/registry/sections.ts, src/lib/studio/registry/index.ts, src/lib/studio/params/structure.ts; NEW under src/lib/studio/registry/: contracts | DC-02:B, DC-05:C | tsc 0; skrip hitung: pin SECTION_REGISTRY_COUNT dan kelompok sama dengan panjang array; setiap jenis kontrak berkerangka dan bersatus sesuai register | implementation |
| DC-07 | Layanan kontrak baru: validasi payload terhadap jenis (status dalam set, pola cardId, tanggal, penanggung jawab, kunci butir unik), resolusi rujukan documentId/docNumber + pid ke StudioDocIdentity (baca saja), proyeksi baris M19-M21 dari payload | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: contracts | DC-05:B, DC-06:C, DC-04:C | tsc; eslint area bersih; asap murni: 12 kasus negatif register memberi kode benar | implementation |
| DC-08 | Kaitkan validasi kontrak ke gerbang tunggal by-construction untuk R04, R12, R13, R16, R06, R14 dan dry-run R08 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/ingest/by-construction.ts | DC-05:B, DC-07:C | tsc; eslint area bersih; asap R08: status di luar set dan rujukan tak ada memberi issue berkode register, dokumen non-kontrak tanpa issue baru | implementation |
| DC-09 | Persistensi kontrak: tulis baris M19-M21 + kolom cermin StudioDocument di dalam transaksi commit v2 (salinan penuh per revisi) | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/structure/ atau src/lib/studio/services/revisions/v2/commit.ts (satu berkas hook, dideklarasikan sebelum menulis) | DC-04:B, DC-07:C | tsc; eslint area bersih; asap transaksi-rollback v21: 1 record, n butir, m rujukan, cek rekonstruksi lulus, 0 baris tersisa | implementation |
| DC-10 | Compose: petakan payload contractRecord ke bentuk internal (unit interior berisi tabel fakta + tabel butir, label dari templat/registri) dengan alamat F:slotKey | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/compose/ | DC-05:B, DC-06:C | tsc; eslint area bersih; asap: contoh kontrak misi register menjadi snapshot norm/v2 dengan unit contractRecord dan alamat F:record | implementation |
| DC-11 | Kelengkapan: outline wajib dari kerangka templat (slot.outline) menghasilkan bab diharapkan dan hilang; slot contractRecord wajib | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/completeness/ | DC-05:B, DC-06:C | tsc; eslint area bersih; asap: kontrak misi tanpa bab keputusan berstatus INCOMPLETE dengan bab itu di daftar hilang | implementation |
| DC-12 | Perakit HTML: unit slot contractRecord bergaya DATUM dari templat | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/html/assemble/ | DC-05:B, DC-10:C | tsc; eslint area bersih; asap: HTML kontrak contoh 0 pelanggaran enforceStandalone dan memuat semua cardId | implementation |
| DC-13 | Perakit DOCX: unit slot contractRecord tanpa mengubah jalur dokumen lain; mulai setelah FIX-R1 dan FIX-T2 diterima (P-1) | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/assemble/units.ts, src/lib/studio/engine/docx/assemble/index.ts | DC-05:B, DC-10:C | tsc; eslint area bersih; asap: DOCX kontrak contoh terbangun dan sha DOCX Manual 000 tidak berubah | implementation |
| DC-14 | Layanan retrieval baru: filter kontrak (misi, jenis, status, cardId, penanggung jawab, rentang tenggat) atas kolom cermin; teks penuh atas StudioDocBlock revisi terkini (tsvector simple, websearch_to_tsquery terparameter, cuplikan, take dan kursor berbatas) | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: query | DC-04:B, DC-05:C | tsc; eslint area bersih; asap transaksi-rollback v21: 6 kueri fixture sesuai harapan dan q berisi kutip atau operator tanpa galat | implementation |
| DC-15 | Route R21 GET /api/studio/contracts: filter + kursor, sesi wajib, bucket query dengan header kuota | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/: contracts | DC-05:B, DC-14:C, DC-19:C | tsc; eslint area bersih; asap handler: tanpa sesi 401, filter status 200, parameter tak dikenal 400 | implementation |
| DC-16 | Route R22 GET /api/studio/search: teks penuh paragraf mengembalikan documentId, revisionNo, pid, alamat, cuplikan | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/: search | DC-05:B, DC-14:C, DC-19:C | tsc; eslint area bersih; asap handler: tanpa sesi 401, q kosong atau melebihi batas 400, hasil memuat pid | implementation |
| DC-17 | Modul murni nama berkas final (nomor dokumen tersanitasi, revisionNo, waktu render UTC dari baris berkas, sha8) + parser balik | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/render/: modul nama final | DC-02:B | tsc; eslint area bersih; asap: contoh register diformat lalu di-parse kembali identik | implementation |
| DC-18 | R10 files: header X-Studio-Final-Filename selalu dan nama final di Content-Disposition sesuai keputusan U-2 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/files/[id]/route.ts, src/app/api/studio/files/_lib/serve.ts | DC-17:B | tsc; eslint area bersih; asap :9021: header cocok regex register dan sha8 sama dengan awal sha256 berkas | implementation |
| DC-19 | Header kuota: helper baru X-Studio-Quota-Remaining + X-Studio-Quota-Bucket, dipasang pada bucket validate/pratinjau, import, render untuk respons 2xx dan 429 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/http/: helper kuota; EXISTS src/lib/studio/http/render-guard.ts, src/app/api/studio/validate/_shared/validate-rate.ts, src/app/api/studio/import/markdown/_lib/import-rate.ts | DC-02:B | tsc; eslint area bersih; asap :9021: tiga bucket mengembalikan sisa yang menurun satu per panggilan dan 429 bersisa 0 | implementation |
| DC-20 | Respons render R17 memuat finalFileName per keluaran | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/documents/[id]/render/_lib/ | DC-17:B | tsc; eslint area bersih; asap: render HTML kontrak mengembalikan outputs[].finalFileName yang cocok regex | implementation |
| DC-21 | Ekstraktor draf/checkpoint murni: kepala ringkas (judul, tujuan, langkah berikut, basis) + satu atau lebih blok berpagar json menjadi payload v2 bernomor baris; galat DRAFT_* | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: draft | DC-02:B, DC-05:C | tsc; eslint area bersih; asap murni: 8 kasus register (tanpa blok, JSON rusak di baris n, dua blok, skema tak dikenal) | implementation |
| DC-22 | CLI draft-check: ekstrak + validasi skema lokal atau --remote dry-run R08; --emit mencetak payload siap kirim; exit nonzero bila gagal | coder-execution | backend-execution, dry-run-verify-fix | NEW under scripts/studio/: draft-check | DC-21:B | tsc; asap: draf contoh valid exit 0 dan draf rusak exit 1 dengan nomor baris | implementation |
| DC-23 | Route R23 POST /api/studio/drafts/check: teks MD berbatas, ekstrak + dry-run R08, bucket validate, tanpa tulis DB | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/: drafts | DC-21:B, DC-19:C, DC-08:C | tsc; eslint area bersih; asap: hasil identik dengan CLI --remote untuk 3 draf dan 0 baris DB baru | implementation |
| DC-24 | Generator MD lama ke kontrak JSON: kepala ke contractRecord (alias status dari registri; tak terpetakan menjadi peringatan, tidak ditebak), tabel kartu ke butir dan cardIds, judul ## ke bab outline lewat alias, prosa lewat importer md/v1 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/import/: contract | DC-05:B, DC-06:B | tsc; eslint area bersih; asap: 3 kontrak contoh korpus menjadi studio.doc/v2 yang lolos validasi lokal dengan 0 status ditebak | implementation |
| DC-25 | CLI md2contract dengan opsi --kind, --mission, --doc-number, --strict; keluaran byte-identik antar-run | coder-execution | backend-execution, dry-run-verify-fix | NEW under scripts/studio/: md2contract | DC-24:B | tsc; asap: dua run byte-identik dan --strict exit nonzero bila ada peringatan | implementation |
| DC-26 | Registri chart.custom: bentuk berbatas (mark, orientasi, tumpuk) dipetakan ke perender keluarga yang ada beserta batasan bentuk data; pin hitungan | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/registry/charts.ts | DC-05:B | tsc; skrip: setiap bentuk custom terpetakan ke kode tergambar yang ada dan pin sama dengan panjang array | implementation |
| DC-27 | Mesin chart.custom: dispatch code custom ke perender keluarga lewat registri; lint chart menerima custom | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/chart/core/ (berkas lain di engine/chart dideklarasikan sebelum menulis) | DC-05:B, DC-26:B | tsc; eslint area bersih; asap: setiap bentuk custom menghasilkan SVG valid dan SVG chart preset pada sapuan paritas byte-identik | implementation |
| DC-28 | R03 registri kind=contracts (jenis, kerangka, outline wajib, set status, alias) agar agen membaca enum tanpa menebak | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/registry/route.ts | DC-06:B | tsc; eslint area bersih; asap handler: kind=contracts 200 memuat semua jenis dan set status register | implementation |
| DC-29 | Seed: baris section type contractRecord + templat jenis kontrak (kerangka NOTA, preset GSP DATUM, contractKind, format bawaan HTML) dengan penjaga idempoten | coder-execution | backend-execution, dry-run-verify-fix | EXISTS prisma/seed-studio.ts | DC-06:B, DC-04:C | tsc; dry-run seed 0 tulis dengan rencana sesuai register; templat lama tidak berubah (penjaga sha) | implementation |
| DC-30 | Jalankan seed nyata di v21 lalu jalankan kedua kalinya | coder-execution | dry-run-verify-fix | data DB gsp_agent_hq_v21 (tanpa berkas) | DC-29:B, DC-04:B | exit 0; jalan kedua unchanged; hitungan templat kontrak dan section type sama dengan register | implementation |
| DC-31 | Gerbang integrasi pembuka fase akhir setelah controller restart DEV 9021: tsc repo, eslint area Studio, suite unit studio, asap alur inti (buat kontrak, perbarui status lewat slot, query, cari, render HTML, unduh nama final) | verifier | verification-before-completion | NEW <task>/gateway_check/11_contract_integration_gate.md | DC-07:B, DC-08:B, DC-09:B, DC-10:B, DC-11:B, DC-12:B, DC-13:B, DC-14:B, DC-15:B, DC-16:B, DC-17:B, DC-18:B, DC-19:B, DC-20:B, DC-21:B, DC-22:B, DC-23:B, DC-24:B, DC-25:B, DC-26:B, DC-27:B, DC-28:B, DC-29:B, DC-30:B | tsc 0 dan eslint 0; suite unit studio hijau; asap alur inti lulus dengan correlation id dikutip | gateway_check |
| DC-32 | Perbarui register 03 dengan rujukan ke register 05, slot contractRecord, kode galat baru, route R21-R23 | data-analyst | - | EXISTS <task>/masterplan/03_structural_sections_specs.md | DC-05:B, DC-06:B | setiap nama baru di register 03 identik dengan register 05; hitungan kode galat sama dengan enums.ts | masterplan |
| DC-33 | Panduan agen, bab baru Document contract: buka misi, perbarui per fase, laporan fase, query dan cari, render HTML, unduh nama final, draf/checkpoint MD + draft-check, md2contract, header kuota, chart.custom; mulai setelah DOC-4 diterima (P-1) | document-specialist | document-quality-standards | EXISTS docs/STUDIO-AGENT-GUIDE.md | DC-31:B | setiap contoh JSON lolos draft-check --remote (keluaran dikutip); setiap route dan kode yang disebut ada di kode; glossary-check 0 | implementation |
| DC-34 | API-REFERENCE: R21-R23, R03 kind=contracts, header kuota, X-Studio-Final-Filename, kode galat baru | document-specialist | document-quality-standards | EXISTS docs/API-REFERENCE.md | DC-31:B | tabel route sama dengan ekspor route nyata; setiap kode galat baru tercantum dengan HTTP benar | implementation |
| DC-35 | Uji unit: layanan kontrak, ekstraktor draf, nama final, generator (golden 3 kontrak), registri chart.custom | test-expert | tdd | NEW under tests/unit/studio/: contract | DC-31:B | uji baru hijau; setiap kode galat register punya kasus negatif; suite studio penuh hijau | test |
| DC-36 | Uji API + DB: R21, R22, R23, header R10, header kuota, R08 contractRecord, persistensi M19-M21 + rekonstruksi dengan transaksi-rollback v21 | test-expert | tdd | NEW under tests/unit/studio/: api-contract | DC-31:B | hijau pada dua run identik; 0 baris uji tersisa; setiap route baru 401 tanpa sesi | test |
| DC-37 | Uji banding 3 misi nyata Hermes: md2contract, R08, kirim ke DEV 9021, render HTML; bandingkan unit teks, cardId, entri keputusan MD lawan proyeksi JSON | test-expert | tdd | NEW <task>/test/19_contract_md_parity.md | DC-31:B, DC-03:B | per misi unit teks, cardId, dan keputusan terjaga 100 persen; 0 status ditebak; fixture 0 sisa | test |
| DC-38 | Gladi migrasi + rollback SQL delta di gsp_agent_hq_v21_uji | test-expert | tdd | NEW <task>/test/20_contract_rollback_rehearsal.md | DC-31:B | rollback 0 galat; objek delta hilang lalu kembali setelah deploy ulang; hitungan baris tabel lama identik | test |
| DC-39 | Kinerja retrieval: filter + teks penuh pada volume v21 dan data sintetis 10x di _uji; p95 latensi dan EXPLAIN | test-expert | tdd | NEW <task>/test/21_contract_query_performance.md | DC-38:B | p95 server di bawah ambang register; EXPLAIN memakai indeks GIN tanpa seq scan pada tabel blok | test |
| DC-40 | Review kode delta fase: kontrak, registri, layanan contracts/query/draft/import contract, route baru, unit perakit, chart.custom, migrasi | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/12_review_document_contract.md | DC-31:B | verdict PASS/CAUTION/FAIL; setiap temuan berlokasi file:baris; setiap temuan High/Medium diusulkan sebagai baris baru berpemilik | gateway_check |
| DC-41 | Security review: kebijakan baca query/search lintas misi, injeksi FTS, batas ukuran R23, enumerasi rujukan documentId+pid, injeksi header nama final, kuota | security-review | security-review-gate | NEW <task>/gateway_check/13_security_document_contract.md | DC-31:B | verdict PASS/CAUTION/FAIL; setiap temuan berbukti probe; CAUTION/FAIL disiapkan untuk keputusan user | gateway_check |
| DC-42 | Review dokumen: panduan agen, API-REFERENCE, register 03 | document-reviewer | document-quality-standards | NEW <task>/review/document_review_dc1.md | DC-32:B, DC-33:B, DC-34:B | minimal 30 klaim sampel dicek terhadap kode; vonis D-139; verdict | verification |
| DC-43 | Sesi E2E terskrip tunggal di :9021: alur U1-U5 (kontrak, status, query, draf, unduh) + HTML kontrak dibuka di Chromium | test-expert | tdd, webapp-testing | NEW <task>/test/22_contract_e2e_session.md | DC-31:B | U1-U5 lulus; 0 galat konsol pada HTML kontrak; fixture 0 sisa | test |
| DC-44 | Brief uji coba Hermes: arm A (MD lama) dan arm B (JSON API) pada skenario sama, langkah, timing.csv, umpan balik terstruktur, larangan (port 9011, konfigurasi Hermes, rahasia DEV) | data-analyst | - | NEW <task>/hermes_trial/04_contract_trial_brief.md | DC-03:B, DC-33:C | setiap metrik protokol DC-03 punya langkah ukur; setiap endpoint di brief ada di panduan | test |
| DC-45 | Jalankan uji coba Hermes (gsp-master01) di DEV 9021 sesuai brief dengan server dibekukan selama uji (D-340); kumpulkan jawaban, timing.csv, dan jejak korelasi | test-expert | - | NEW <task>/hermes_trial/04_contract_trial_report.md | DC-44:B, DC-43:B, DC-40:B, DC-41:B, DC-42:B | jawaban Hermes tersimpan utuh; timing.csv kedua arm ada; 0 perubahan kode server selama uji | test |
| DC-46 | Analisis metrik efisiensi arm A lawan arm B: waktu, langkah, galat format, retrieval, disk; vonis per ambang; temuan menjadi baris baru | data-analyst | - | NEW <task>/research/12_contract_efficiency_results.md | DC-45:B | setiap angka dikutip dari timing.csv atau log; vonis per ambang KE-1..KE-7 | test |
| DC-47 | Verifikasi akhir fase: kriteria KS dan KE dengan bukti segar, gerbang intake 06, keputusan tercatat, temuan tertutup atau terdaftar | verifier | verification-before-completion | NEW <task>/verification/02_document_contract_verification.md | DC-35:B, DC-36:B, DC-37:B, DC-38:B, DC-39:B, DC-40:B, DC-41:B, DC-42:B, DC-43:B, DC-46:B | setiap kriteria berbukti perintah atau berkas; 0 klaim tanpa bukti | verification |
| DC-48 | Commit lokal branch v2.1 tanpa push, dengan pindai rahasia atas tambahan | git-specialist | finishing-a-development-branch | commit lokal di branch v2.1 | DC-47:B | commit ada di log; pindai rahasia bersih; 0 push | report |

## Execution Profile

| Step | Ownership area (exact paths) | Size | Dep kind | Model | Checks | Review |
|---|---|---|---|---|---|---|
| DC-01 | docs only: research/10; baca-saja workspace Hermes (C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/, Glob sesi ini: 463 contract*.md) | M | none | sonnet (inventaris hitung ulang) | 2 | batched |
| DC-02 | docs only: NEW under <task>/masterplan/ (induk ada; 05 belum ada): register penulis tunggal | M | DC-01:B | inherit | 3 | batched |
| DC-03 | docs only: NEW under <task>/research/ (induk ada; 11 belum ada) | S | DC-01:B, DC-02:C | inherit | 2 | batched |
| DC-04 | db: EXISTS: prisma/schema.prisma (Read sesi ini); NEW under prisma/migrations/ (induk ada, 7 migrasi): migrasi kontrak; penulis tunggal migrate deploy v21 + _shadow | M | DC-02:B | inherit | 3 | batched |
| DC-05 | shared contract: EXISTS: src/lib/studio/contract/ (Glob sesi ini); penulis tunggal contract/** | M | DC-02:B | inherit | 3 | batched |
| DC-06 | registry: EXISTS: src/lib/studio/registry/slots.ts, src/lib/studio/registry/sections.ts, src/lib/studio/registry/index.ts, src/lib/studio/params/structure.ts (Glob sesi ini); NEW under src/lib/studio/registry/: contracts (dicek tidak ada) | M | DC-02:B, DC-05:C | inherit | 3 | batched |
| DC-07 | server: NEW under src/lib/studio/services/: contracts (dicek tidak ada) | M | DC-05:B, DC-06:C, DC-04:C | inherit | 3 | batched |
| DC-08 | server: EXISTS: src/lib/studio/services/ingest/by-construction.ts (Glob sesi ini) | S | DC-05:B, DC-07:C | inherit | 3 | batched |
| DC-09 | server: EXISTS: src/lib/studio/services/structure/ atau src/lib/studio/services/revisions/v2/commit.ts (Glob sesi ini; satu berkas hook dideklarasikan ke klaim gelombang) | M | DC-04:B, DC-07:C | inherit | 3 | batched |
| DC-10 | server: EXISTS: src/lib/studio/services/compose/ (Glob sesi ini) | M | DC-05:B, DC-06:C | inherit | 3 | batched |
| DC-11 | server: EXISTS: src/lib/studio/services/completeness/ (Glob sesi ini) | S | DC-05:B, DC-06:C | inherit | 3 | batched |
| DC-12 | engine html: EXISTS: src/lib/studio/engine/html/assemble/ (Glob sesi ini) | M? | DC-05:B, DC-10:C | inherit | 3 | batched |
| DC-13 | engine docx: EXISTS: src/lib/studio/engine/docx/assemble/units.ts, src/lib/studio/engine/docx/assemble/index.ts (Glob sesi ini); menunggu P-1 | M? | DC-05:B, DC-10:C | inherit | 3 | batched |
| DC-14 | server: NEW under src/lib/studio/services/: query (dicek tidak ada) | M | DC-04:B, DC-05:C | inherit | 3 | batched |
| DC-15 | api: NEW under src/app/api/studio/: contracts (dicek tidak ada) | S | DC-05:B, DC-14:C, DC-19:C | inherit | 3 | batched |
| DC-16 | api: NEW under src/app/api/studio/: search (dicek tidak ada) | S | DC-05:B, DC-14:C, DC-19:C | inherit | 3 | batched |
| DC-17 | server: NEW under src/lib/studio/services/render/ (induk ada; berkas nama final belum ada); berkas lain di render/ tidak disentuh | S | DC-02:B | inherit | 3 | batched |
| DC-18 | api: EXISTS: src/app/api/studio/files/[id]/route.ts, src/app/api/studio/files/_lib/serve.ts (Read/Glob sesi ini) | S | DC-17:B | inherit | 3 | batched |
| DC-19 | http: NEW under src/lib/studio/http/ (induk ada; helper kuota belum ada); EXISTS: src/lib/studio/http/render-guard.ts, src/app/api/studio/validate/_shared/validate-rate.ts, src/app/api/studio/import/markdown/_lib/import-rate.ts (Glob sesi ini); penulis tunggal http/** | S | DC-02:B | inherit | 3 | batched |
| DC-20 | api: EXISTS: src/app/api/studio/documents/[id]/render/_lib/ (Glob sesi ini) | S | DC-17:B | inherit | 3 | batched |
| DC-21 | server: NEW under src/lib/studio/services/: draft (dicek tidak ada) | S | DC-02:B, DC-05:C | inherit | 3 | batched |
| DC-22 | scripts: NEW under scripts/studio/ (induk ada; hanya glossary-check.ts dan md2chapter.ts): draft-check | S | DC-21:B | inherit | 2 | batched |
| DC-23 | api: NEW under src/app/api/studio/: drafts (dicek tidak ada) | S | DC-21:B, DC-19:C, DC-08:C | inherit | 3 | batched |
| DC-24 | server: NEW under src/lib/studio/services/import/ (induk ada; subfolder contract belum ada); berkas md/v1 baca saja | M | DC-05:B, DC-06:B | inherit | 3 | batched |
| DC-25 | scripts: NEW under scripts/studio/: md2contract (dicek tidak ada) | S | DC-24:B | inherit | 2 | batched |
| DC-26 | registry: EXISTS: src/lib/studio/registry/charts.ts (Glob sesi ini); penulis tunggal pin chart | S | DC-05:B | inherit | 2 | batched |
| DC-27 | engine chart: EXISTS: src/lib/studio/engine/chart/core/ (Glob sesi ini); berkas lain engine/chart dideklarasikan | M? | DC-05:B, DC-26:B | inherit | 3 | batched |
| DC-28 | api: EXISTS: src/app/api/studio/registry/route.ts (Glob sesi ini) | S | DC-06:B | inherit | 3 | batched |
| DC-29 | seed: EXISTS: prisma/seed-studio.ts (Glob sesi ini); penulis tunggal seed | M | DC-06:B, DC-04:C | inherit | 3 | batched |
| DC-30 | data DB v21: eksekusi seed (tanpa berkas); penulis permanen tunggal data v21 di gelombangnya | S | DC-29:B, DC-04:B | sonnet (perintah tetap, exit) | 3 | batched |
| DC-31 | docs only: gateway_check/11; membaca seluruh delta | M | DC-07:B, DC-08:B, DC-09:B, DC-10:B, DC-11:B, DC-12:B, DC-13:B, DC-14:B, DC-15:B, DC-16:B, DC-17:B, DC-18:B, DC-19:B, DC-20:B, DC-21:B, DC-22:B, DC-23:B, DC-24:B, DC-25:B, DC-26:B, DC-27:B, DC-28:B, DC-29:B, DC-30:B | inherit (agen verifikasi) | 3 | n/a |
| DC-32 | docs: EXISTS: <task>/masterplan/03_structural_sections_specs.md (Glob sesi ini) | S | DC-05:B, DC-06:B | inherit | 2 | batched |
| DC-33 | docs: EXISTS: docs/STUDIO-AGENT-GUIDE.md (Grep sesi ini); menunggu P-1 (DOC-4) | M | DC-31:B | inherit | 3 | batched |
| DC-34 | docs: EXISTS: docs/API-REFERENCE.md (Glob sesi ini) | S | DC-31:B | inherit | 2 | batched |
| DC-35 | test: NEW under tests/unit/studio/: contract (dicek tidak ada) | M | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-36 | test: NEW under tests/unit/studio/: api-contract (dicek tidak ada); asap transaksi-rollback v21 | M | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-37 | docs only: test/19; fixture dokumen uji di DEV 9021 (dibersihkan); workspace Hermes baca saja | M | DC-31:B, DC-03:B | inherit (agen verifikasi) | 3 | n/a |
| DC-38 | docs only: test/20; penulis tunggal _uji di gelombangnya | S | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-39 | docs only: test/21; _uji setelah DC-38 | S | DC-38:B | inherit (agen verifikasi) | 2 | n/a |
| DC-40 | docs only: gateway_check/12 | M | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-41 | docs only: gateway_check/13 | M | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-42 | docs only: review/document_review_dc1 | M | DC-32:B, DC-33:B, DC-34:B | inherit (agen verifikasi) | 3 | n/a |
| DC-43 | docs only: test/22; Chromium; fixture DEV 9021 (dibersihkan) | M | DC-31:B | inherit (agen verifikasi) | 3 | n/a |
| DC-44 | docs only: hermes_trial/04 brief | S | DC-03:B, DC-33:C | inherit | 2 | batched |
| DC-45 | docs only: hermes_trial/04 laporan; DEV 9021 beku; Hermes menulis di workspace-nya sendiri | M | DC-44:B, DC-43:B, DC-40:B, DC-41:B, DC-42:B | inherit (agen verifikasi) | 3 | n/a |
| DC-46 | docs only: research/12 | S | DC-45:B | inherit | 2 | batched |
| DC-47 | docs only: verification/02 | M | DC-35:B, DC-36:B, DC-37:B, DC-38:B, DC-39:B, DC-40:B, DC-41:B, DC-42:B, DC-43:B, DC-46:B | inherit (agen verifikasi) | 2 | n/a |
| DC-48 | git: indeks dan commit branch v2.1 (tanpa berkas kode) | S | DC-47:B | sonnet (operasi git mekanis) | 3 | batched |

### Shared resources (single-writer)

| Sumber daya | Satu-satunya penulis | Catatan |
|---|---|---|
| `prisma/schema.prisma`, folder migrasi baru, `migrate deploy` v21, `gsp_agent_hq_v21_shadow` | DC-04 | Prosedur D-21; `migrate dev`/`db push` dilarang |
| `src/lib/studio/contract/**` (termasuk `enums.ts`, `errors.ts`) | DC-05 | Baca saja setelah marker. Permintaan perubahan lewat `file_requests.md` |
| `src/lib/studio/registry/{slots,sections,index,contracts}.ts`, `src/lib/studio/params/structure.ts` (pin SECTION_REGISTRY_COUNT) | DC-06 | |
| `src/lib/studio/registry/charts.ts` (pin CHART_REGISTRY_COUNT) | DC-26 | Gelombang berbeda dari DC-06 |
| `src/lib/studio/http/**` | DC-19 | Route baru memakai helper lewat tepi C |
| `src/lib/studio/services/render/` | DC-17 (berkas baru saja) | Berkas render lain tidak dimiliki fase ini |
| `src/lib/studio/services/import/**` | DC-24 (subfolder baru) | Berkas `md/v1` baca saja |
| `src/lib/studio/engine/docx/assemble/**` | DC-13, setelah FIX-R1/FIX-T2 | P-1 |
| `src/lib/studio/engine/html/assemble/**` | DC-12 | |
| `src/lib/studio/engine/chart/**` | DC-27 | |
| `prisma/seed-studio.ts` | DC-29 | |
| Data permanen `gsp_agent_hq_v21` | DC-04 (DDL), lalu DC-30 (seed) | Asap transaksi-rollback DC-09, DC-14, DC-36 menyisakan 0 baris. Fixture DEV DC-37 dan DC-43 dibersihkan |
| `gsp_agent_hq_v21_uji` | DC-38, lalu DC-39 | Berurutan |
| Server DEV 9021 | Controller (restart sebelum DC-31, DC-43, DC-45) | Kode beku selama DC-45 |
| Chromium | DC-43 | |
| `docs/STUDIO-AGENT-GUIDE.md` | DC-33, setelah DOC-4 | P-1 |
| `docs/API-REFERENCE.md` | DC-34 | |
| `<task>/masterplan/03_structural_sections_specs.md` | DC-32 | |
| `scripts/studio/` | DC-22 (draft-check), DC-25 (md2contract) | Berkas baru saling lepas |
| Workspace Hermes | Baca saja (DC-01, DC-37). Hermes sendiri menulis saat DC-45 | Konfigurasi Hermes tidak diubah |
| Berkas controller (`status_tasks.md`, `README.md`, `decisions/decisions.md`, `findings/`, `implementation/99_*`, `report/`, `delegation_progress/driver_rules.md`, `file_ownership.md`) | Controller | Tidak dimiliki baris mana pun |

### Gelombang, batch, jalur kritis

Gelombang logis dari tepi B:

| Tingkat | Baris | Lebar |
|---|---|---|
| L0 | DC-01 | 1 |
| L1 | DC-02, DC-03 | 2 |
| L2 | DC-04, DC-05, DC-06, DC-17, DC-19, DC-21 | 6 |
| L3 | DC-07, DC-08, DC-09, DC-10, DC-11, DC-12, DC-13, DC-14, DC-15, DC-16, DC-18, DC-20, DC-22, DC-23, DC-24, DC-26, DC-28, DC-29, DC-32 | 19 |
| L4 | DC-25, DC-27, DC-30 | 3 |
| L5 | DC-31 | 1 |
| L6 | DC-33, DC-34, DC-35, DC-36, DC-37, DC-38, DC-40, DC-41, DC-43, DC-44 | 10 |
| L7 | DC-39, DC-42 | 2 |
| L8 | DC-45 | 1 |
| L9 | DC-46 | 1 |
| L10 | DC-47 | 1 |
| L11 | DC-48 | 1 |

Batch peluncuran. Plafon default 4. Batch yang lebih lebar hanya dipakai bila syarat `wave_and_mediation.md` terpenuhi dan dicatat controller di `decisions/decisions.md`:

| Batch | Baris | Lebar | Catatan |
|---|---|---|---|
| B0 | DC-01 | 1 | Segera setelah persetujuan |
| B1 | DC-02, DC-03 | 2 | Register menjadi syarat B2 |
| B2 | DC-04, DC-05, DC-06, DC-17, DC-19, DC-21 | 6 | Area saling lepas. Marker DC-05 membuka B3 |
| B3a | DC-07, DC-08, DC-09, DC-10, DC-11, DC-14, DC-24, DC-29 | 8 | Layanan dan seed |
| B3b | DC-12, DC-13, DC-15, DC-16, DC-18, DC-20, DC-22, DC-23, DC-26, DC-28, DC-32 | 11 | Mulai saat slot B3a kosong. DC-13 menunggu P-1 |
| B4 | DC-25, DC-27, DC-30 | 3 | |
| B5 | DC-31 | 1 | Pembuka fase akhir (D-133) |
| B6 | DC-33, DC-34, DC-35, DC-36, DC-37, DC-38, DC-40, DC-41, DC-43, DC-44 | 10 | Chromium 1 (DC-43); `_uji` 1 (DC-38) |
| B7 | DC-39, DC-42 | 2 | Lalu loop perbaikan temuan B6 (maksimal 3 siklus per kriteria; setiap temuan menjadi baris baru berpemilik) |
| B8 | DC-45 | 1 | Server DEV dibekukan |
| B9-B11 | DC-46, DC-47, DC-48 | 1 | Push hanya atas izin user |

Jalur kritis (tepi B, 12 tingkat): DC-01 → DC-02 → DC-06 → DC-24 → DC-25 → DC-31 → DC-33 → DC-42 → DC-45 → DC-46 → DC-47 → DC-48.

Ada jalur paralel sama panjang:
- DC-01 → DC-02 → DC-05 → DC-26 → DC-27 → DC-31 → ...
- DC-02 → DC-06 → DC-29 → DC-30 → DC-31.

Cara memperpendek:
1. DC-45 boleh C pada DC-42 bila review dokumen tidak menemukan cacat Major. Hemat satu tingkat. Verifikasi DC-47 tetap menunggu DC-42.
2. Bila CPU di bawah 85 persen, B3a dan B3b digabung (lebar 19) dengan mediasi aktif.
3. DC-44 sudah C pada DC-33, sehingga brief ditulis paralel dengan panduan.

Alasan tepi gerbang:
- DC-33 dan DC-34 B pada DC-31: contoh dijalankan terhadap DEV yang lolos gerbang. Pelajaran DOC-3/D-340: dokumen yang ditulis sebelum perilaku stabil harus ditulis ulang.
- Baris uji dan review B pada DC-31 mengikuti pola fase akhir D-133.
- DC-45 B pada DC-40, DC-41, dan DC-42: Hermes harus menguji kode dan panduan yang sudah lolos review, dan server tidak boleh berubah di tengah uji (D-340).
- DC-39 B pada DC-38: `_uji` hanya punya satu penulis.

### Pernyataan biaya (estimasi)

- **Baris:** 48, terdiri dari S 23 dan M 25. Tiga di antaranya `M?` (DC-12, DC-13, DC-27) karena perakit dan mesin chart belum dibaca sampai tingkat fungsi. Tidak ada L.
- **Model:** 3 sonnet dan 45 inherit. Baris sonnet:
  - DC-01: inventaris yang dapat dihitung ulang.
  - DC-30: perintah seed tetap, dicek lewat exit code dan jalan kedua.
  - DC-48: operasi git.
  
  Semua agen verifikasi (verifier, test-expert, senior-code-reviewer, security-review, document-reviewer) inherit.
- **Gelombang:** 12 tingkat logis (L0-L11) dalam 12 batch peluncuran. Tingkat terlebar L3 = 19; batch terlebar B3b = 11.
- **Jalur kritis:** DC-01 → DC-02 → DC-06 → DC-24 → DC-25 → DC-31 → DC-33 → DC-42 → DC-45 → DC-46 → DC-47 → DC-48.
- **Tiga baris termahal:**
  - DC-02: register penuh, menjadi kosakata seluruh fase.
  - DC-05: kontrak penulis tunggal, ditunggu semua baris B3.
  - DC-14: retrieval FTS + filter dengan kueri terparameter dan batas kinerja.
- **Grounding:**
  - EXISTS = 27 entri path pada 19 baris (DC-04, 05, 06, 08, 09, 10, 11, 12, 13, 18, 19, 20, 26, 27, 28, 29, 32, 33, 34). Semuanya terverifikasi Glob/Read/Grep sesi ini.
  - NEW-under = 15 baris (DC-04, 06, 07, 14, 15, 16, 17, 19, 21, 22, 23, 24, 25, 35, 36). Induknya terverifikasi dan targetnya terkonfirmasi tidak ada lewat Glob.
  - UNKNOWN = 0. DC-09 dan DC-27 menyebut induk EXISTS, dan berkas pastinya dideklarasikan ke klaim gelombang.
  - docs only = 15 baris (DC-01, 02, 03, 31, 37-47 kecuali tidak ada tumpang). Data DB 1 baris (DC-30), git 1 baris (DC-48).

## 3. Kriteria keberhasilan terukur

### 3.1 Teknis (diukur fase akhir)

| Kode | Kriteria | Ambang / bukti | Baris |
|---|---|---|---|
| KS-1 | Migrasi aditif | 0 DROP; objek hanya `Studio*`; migrate status up to date; hitungan baris tabel lama identik; rollback digladikan di `_uji` | DC-04, DC-38 |
| KS-2 | Format tunggal | Kontrak = `studio.doc/v2` + templat jenis, 0 skema terpisah; medan tampilan di contractRecord ditolak `DISPLAY_FIELD` | DC-05, DC-35 |
| KS-3 | Medan terstruktur tervalidasi | Status di luar set, pola cardId salah, dan rujukan tak ada memberi kode register dengan 0 tulis DB | DC-08, DC-36 |
| KS-4 | Kerangka wajib | Kontrak tanpa slot/bab wajib = INCOMPLETE dengan daftar hilang; render penuh 409 `DOCUMENT_INCOMPLETE` | DC-11, DC-36 |
| KS-5 | Retrieval | R21 presisi dan recall 100 persen pada fixture; R22 memuat documentId + pid + alamat; p95 server di bawah ambang register (usulan 500 ms) pada v21 | DC-36, DC-39 |
| KS-6 | Akses | Route baru 401 tanpa sesi; kebijakan baca sama dengan GET /documents; security tanpa FAIL dan CAUTION disajikan ke user | DC-36, DC-41 |
| KS-7 | Nama final | 100 persen keluaran punya `finalFileName` yang cocok regex; sha8 = awal sha256; Studio 0 tulis ke workspace bersama | DC-18, DC-20, DC-43 |
| KS-8 | Draf/checkpoint | Hasil CLI dan R23 identik; galat bernomor baris; R23 0 tulis DB | DC-22, DC-23, DC-36 |
| KS-9 | Header kuota | Ada di bucket validate, import, render, query pada 2xx dan 429 | DC-19, DC-36 |
| KS-10 | chart.custom | Bentuk berbatas dirender lewat keluarga yang ada; medan tampilan ditolak; SVG preset sapuan paritas byte-identik | DC-27, DC-35 |
| KS-11 | Non-regresi | Suite unit studio penuh hijau; sha DOCX Manual 000 tidak berubah; perilaku dokumen non-kontrak tidak berubah | DC-13, DC-31 |

### 3.2 Efisiensi Hermes (arm A alur MD lama lawan arm B JSON API, skenario sama; ambang final dikunci DC-03)

| Kode | Metrik | Ambang usulan | Sumber |
|---|---|---|---|
| KE-1 | Waktu siklus kontrak: buka misi, 2 pembaruan status fase, 1 laporan fase, render HTML, unduh final | Median arm B paling banyak 50 persen arm A | timing.csv DC-45 |
| KE-2 | Langkah: panggilan alat + panggilan API + suntingan berkas per siklus | Arm B paling banyak 70 persen arm A | timing.csv, log Hermes |
| KE-3 | Galat format | Arm B: 0 kontrak tersimpan menyimpang skema (by construction) dan paling banyak 1 respons 4xx skema per kontrak setelah membaca panduan. Arm A: deviasi format diukur checker register sebagai baseline | DC-45, DC-46 |
| KE-4 | Retrieval: 5 kueri baku (status kartu X, kontrak berstatus running di misi Y, paragraf memuat istilah Z, keputusan D-n, rujukan documentId+pid) | Arm B benar 5/5 dan lebih cepat dari arm A (grep) | DC-45 |
| KE-5 | Disk | Arm B: 0 berkas kontrak mentah baru di workspace Hermes; 100 persen berkas final bernama pola final dengan sha8 cocok API | listing workspace, R10 |
| KE-6 | Konversi transisi | 3 misi banding: unit teks, cardId, keputusan terjaga 100 persen; 0 status ditebak | DC-37 |
| KE-7 | Vonis Hermes | "Layak jalur utama document contract", atau daftar syarat sempit yang masing-masing menjadi baris baru | DC-45 |

Pembanding acuan dari riwayat:
- Uji pertama end-to-end dokumen output: 298 s.
- Uji ulang: inti create sampai render penuh sekitar 7 s.
- Builder lokal: 10-15 menit (D-321, D-341).

Angka ini tidak dipakai sebagai ambang kontrak. Arm A diukur ulang pada skenario yang sama.

## 4. Risiko utama

| # | Risiko | Kemungkinan / dampak | Mitigasi |
|---|---|---|---|
| R1 | Delta kontrak DC-05 keliru, sehingga 19 baris L3 mengejar sasaran bergerak | Sedang / tinggi | Register tunggal DC-02; contoh wajib lolos ajv; perubahan lewat `file_requests.md` |
| R2 | Dua sumber kebenaran: `contract.md` di disk tetap hidup berdampingan | Tinggi / tinggi | Aturan panduan DC-33; metrik KE-5; U-3 dan U-4; Hermes B4 mensyaratkan API sebagai satu-satunya penulis |
| R3 | Kolom tsvector GENERATED memicu drift Prisma (diff berikutnya ingin menjatuhkan kolom/indeks) | Pasti / sedang | Pola preseden IlSearchDoc: pemetaan `Unsupported`, komentar skema, diff dikurangi baseline, larangan `db push` |
| R4 | Pertumbuhan baris: kontrak dipatch per fase dan disimpan sebagai salinan penuh per revisi (R6) | Tinggi / sedang | Kueri dibatasi ke revisi terkini; DC-39 mengukur volume 10x; retensi ditunda sebagai keputusan terpisah (Hermes B4) |
| R5 | Bentrok berkas dengan perbaikan berjalan (engine/docx, panduan) | Sedang / tinggi | P-1; pemilik tunggal per berkas |
| R6 | Kebocoran lintas misi lewat R22 karena kebijakan baca global (AS-2) | Sedang / sedang | DC-41 menilai; CAUTION/FAIL ke user; filter misi tersedia |
| R7 | Generator salah memetakan format MD yang beragam | Tinggi / sedang | Tidak menebak (peringatan); alias dari korpus DC-01; banding DC-37 |
| R8 | Header kuota menyesatkan karena limiter per proses di memori (`rate-limit.ts:1-5`) | Rendah / rendah | Didokumentasikan sebagai sisa kuota proses ini; satu instans HQ |
| R9 | Latensi loop antar-agen membuat Hermes kembali ke MD | Sedang / tinggi | KE-1/KE-2; kiriman per slot; HTML bawaan murah; uji coba sebelum adopsi |
| R10 | Batch lebar (L3 19, B6 10) membebani host | Tinggi / sedang | Batch B3a/B3b; sinyal CPU; mediasi aktif |
| R11 | chart.custom memperluas permukaan mesin | Sedang / sedang | Hanya memetakan ke perender yang ada; sapuan paritas byte-identik (KS-10) |
| R12 | Server berubah di tengah uji Hermes | Sedang / sedang | P-2; DC-45 B pada review; kode dibekukan |

## Recommendation & Next-Plan Summary

**Urutan yang direkomendasikan:**
1. B0-B1: inventaris korpus, lalu register + protokol metrik.
2. B2: migrasi, kontrak, registri, nama final, header kuota, ekstraktor draf (paralel, area lepas).
3. B3a dan B3b: layanan, route, perakit, generator, chart.custom, seed (gerbang ringan per baris).
4. B4: CLI md2contract, mesin chart.custom, seed nyata.
5. B5: gerbang integrasi DC-31.
6. B6-B7: panduan, API-REFERENCE, uji, banding 3 misi, rollback, kinerja, review kode, security, E2E, brief, review dokumen. Lalu loop perbaikan (maksimal 3 siklus per kriteria; setiap temuan menjadi baris baru).
7. B8: uji coba Hermes dengan server beku.
8. B9-B11: analisis metrik, verifikasi akhir, commit lokal. Push hanya atas izin user.

**Yang butuh persetujuan user:**
- Blueprint ini lewat Plan Mode (gate `BLUEPRINT_NOT_APPROVED`, D-348).
- Empat keputusan U-1..U-4 di bawah.
- Temuan security CAUTION/FAIL dari DC-41 (aturan global; tidak pernah dianggap disetujui di muka).
- Push.

**Keputusan terbuka untuk USER (sedikit dan konkret; rekomendasi dicetak tebal):**

| ID | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| U-1 | Jenis kontrak tahap 1 | (a) 4 jenis: kontrak misi, laporan fase, blueprint gelombang, laporan selesai; artefak klien tetap dokumen output di templat yang ada. (b) Hanya kontrak misi + laporan fase dulu | **(a)**: sesuai urutan Hermes B1. Biaya tambahan per jenis hanya baris registri + seed |
| U-2 | Nama final sebagai nama unduhan bawaan | (a) Jenis kontrak memakai nama final sebagai Content-Disposition bawaan; dokumen output tetap nama DATUM (DATUM-38) dengan `?name=final`; header `X-Studio-Final-Filename` selalu ada. (b) Semua unduhan memakai nama final | **(a)**: nama DATUM tetap untuk deliverable klien, dan identitas waktu selalu tersedia lewat header |
| U-3 | Penegakan penulis tunggal kontrak | (a) Tidak dibatasi teknis di v2.1. Ledger revisi + `lastFilledBy` + peringatan `CONTRACT_WRITER_CHANGED` bila penulis berbeda dari pembuat. (b) Batasi ke pembuat dokumen + ADMIN (403) | **(a)**: `agentId` hanya label di atas rahasia internal bersama (`auth.ts:16-19`), sehingga (b) mudah dielakkan dan memberi rasa aman palsu. Penegakan nyata butuh kredensial per agen (fase lain) |
| U-4 | Transisi korpus kontrak lama (463 berkas) | (a) Maju saja: misi baru memakai JSON, 3 misi banding dikonversi sebagai uji, sisanya tetap arsip MD. (b) Konversi massal lewat md2contract | **(a)**: menghindari ribuan peringatan status tak terpetakan. md2contract tetap tersedia per misi bila dibutuhkan |

**Keputusan untuk controller (wewenang D-18; rekomendasi dicetak tebal):**

| KC | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| KC-1 | Konfigurasi FTS | (a) `simple` + trigram cadangan; (b) `indonesian`/`english` per bahasa dokumen | **(a)**: teks campuran ID/EN, preseden IlSearchDoc |
| KC-2 | Transisi status | (a) Hanya enum tertutup, tanpa aturan transisi; (b) Mesin status per jenis | **(a)**: sesuai syarat Hermes. Aturan transisi menjadi baris baru bila diminta |
| KC-3 | Rujukan pid pensiun | (a) Dokumen tak ada 422, pid pensiun peringatan; (b) Keduanya 422 | **(a)**: rujukan historis tetap sah sebagai bukti |
| KC-4 | Lingkup R22 | (a) Revisi terkini bawaan, `?revisionNo=` eksplisit; (b) Semua revisi | **(a)**: menghindari duplikat salinan penuh per revisi |
| KC-5 | Lebar batch di atas 4 (B2 6, B3a 8, B3b 11, B6 10) | Catat per `wave_and_mediation.md` atau persempit | **Catat dan mediasi**. Persempit bila CPU di atas 85 persen |
| KC-6 | Ekstraktor HTML untuk scanner Hermes | (a) Tidak dibuat; scanner membaca R20 JSON; (b) Endpoint teks dari HTML | **(a)**: JSON adalah sumber kebenaran. HTML hanya proyeksi |

**Catatan untuk controller:**
- Catat persetujuan blueprint, jawaban U-1..U-4, dan setiap override model sebagai keputusan D-nnn saat terjadi.
- Restart DEV 9021 sebelum DC-31, DC-43, dan DC-45.
- Baris yang lahir dari temuan review/security/uji ditambahkan sebagai baris S/M baru (MINOR) dengan pemilik dan cek sendiri.

## Validasi V1-V12 (dihitung sendiri; controller wajib menghitung ulang)

| # | Kriteria | Hasil |
|---|---|---|
| V1 | Tabel ada | PASS: satu tabel `## Structured Task Breakdown` |
| V2 | Tepat 8 kolom | PASS: Step, Task Description, Agent_to_Invoke, Skills_to_Load, Expected Output, Depends On, Verification, Phase |
| V3 | Semua sel terisi | PASS: 48 baris DC-01..DC-48. `-` hanya di Skills_to_Load (DC-01, DC-02, DC-03, DC-32, DC-44, DC-45, DC-46). `none` hanya di Depends On DC-01 |
| V4 | Atomik | PASS (bersama V9): satu area dan satu deliverable per baris. Layanan, route, CLI, perakit HTML/DOCX, registri/mesin chart, dan seed kode/eksekusi dipisah. Nama final dipisah menjadi modul, R10, dan R17 |
| V5 | Agen dan skill dari roster, ada lokal | PASS: agen data-collector, data-analyst, coder-execution, document-specialist, verifier, test-expert, senior-code-reviewer, security-review, document-reviewer, git-specialist (Glob `~/.claude/agents`). Skill backend-execution, dry-run-verify-fix, verification-before-completion, code-review-senior, security-review-gate, document-quality-standards, finishing-a-development-branch (Glob); tdd, webapp-testing (Read SKILL.md, symlink). Tidak ada requesting-code-review, to-issues, to-prd, pair-programming |
| V6 | Phase dari 10 nilai baku | PASS: research 2 (DC-01, DC-03), masterplan 2 (DC-02, DC-32), implementation 29 (DC-04..DC-30, DC-33, DC-34), gateway_check 3 (DC-31, DC-40, DC-41), test 9 (DC-35..DC-39, DC-43..DC-46), verification 2 (DC-42, DC-47), report 1 (DC-48) = 48 |
| V7 | Dependensi ada dan DAG | PASS: semua ID rujukan ada. Tepi ke ID lebih besar hanya C (DC-06→DC-05 lebih kecil; DC-15/DC-16/DC-23→DC-19:C; DC-44→DC-33 lebih kecil). Tepi B selalu ke tingkat lebih rendah (tabel gelombang). Tanpa siklus |
| V8 | Profil lengkap | PASS: 48 baris profil, ID sama, 7 kolom terisi; Shared resources dan pernyataan biaya ada |
| V9 | Ukuran | PASS: baris L = 0; baris dengan lebih dari 3 cek = 0 (maksimal 3, dipisah titik koma); tanpa daftar "also/inherited". DC-19 memegang satu concern (header kuota) di empat berkas yang dideklarasikan |
| V10 | Kepemilikan grounded dan eksklusif | PASS: area per tingkat saling lepas (L2: prisma / contract / registry / render-baru / http / draft; L3: 19 area berbeda per tabel profil); satu penulis per berkas bersama; 27 path EXISTS terverifikasi; 15 induk NEW-under ada dengan target dicek tidak ada |
| V11 | Jenis dependensi | PASS: setiap tepi berlabel B/C dan identik antara Depends On dan Dep kind; gelombang dari tepi B; tepi gerbang beralasan (DC-33/DC-34 pada DC-31, baris uji/review pada DC-31, DC-45 pada review, DC-39 pada DC-38) |
| V12 | Model dan review | PASS: 3 sonnet dengan alasan yang lolos uji tiga (DC-01 inventaris hitung ulang dari korpus tetap; DC-30 perintah seed tetap dicek exit + jalan kedua; DC-48 git dicek log). Agen verifikasi inherit. Review batched atau n/a; tanpa pair |
