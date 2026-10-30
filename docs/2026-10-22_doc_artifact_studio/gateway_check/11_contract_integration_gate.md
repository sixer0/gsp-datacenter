# 11 Gerbang integrasi document contract (DC-31)

- Pelaksana: verifier (skill `verification-before-completion`), 2026-10-30. Hanya verifikasi; tidak ada kode produksi yang diubah.
- Acuan: blueprint `identification/07_document_contract_blueprint.md` baris DC-31 (:318) + §3.1 (:491-505); register `masterplan/05_document_contract_specs.md` BA-31 (:1199), §5.6, §9, §10, §11, §13, AC-11..AC-24 (:1271-1288); keputusan D-361..D-391 (`decisions/decisions.md`, 31 entri; D-391 membuka gerbang ini).
- Lingkungan: repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1` branch `v2.1` (HEAD `c2620b3` + perubahan kerja belum di-commit); DEV `http://127.0.0.1:9021` (sudah di-restart controller, tidak disentuh); DB `.env` = `gsp_agent_hq_v21` (dicek tanpa mencetak URL); rahasia uji hanya lewat substitusi shell; `agentId` = `controller-gate-dc31`.

## Vonis

| Cek | Vonis |
|---|---|
| 1 tsc repo | PASS |
| 2 eslint area Studio | PASS |
| 3 suite unit studio | PASS |
| 4 regresi benchmark `convert_v2 --check` | PASS |
| 5 asap alur inti :9021 | PASS |
| 6 penelusuran syarat | CAUTION (1 Medium, 1 Low; sisanya LULUS atau BELUM-DAPAT-DICEK milik baris lanjut) |
| **Keseluruhan** | **CAUTION**: semua kriteria DC-31 blueprint terpenuhi (tsc 0, eslint 0, suite hijau, asap lulus dengan correlation id). Satu penyimpangan urutan evaluasi terhadap register §5.6 (M1) perlu baris berpemilik sebelum DC-35/DC-36 mengunci uji |

## 1. tsc

`npx tsc --noEmit` -> keluaran kosong, `TSC_EXIT=0`.

## 2. eslint

`npx eslint src/lib/studio src/app/api/studio src/components/studio src/app/studio scripts/studio` -> keluaran kosong, `ESLINT_EXIT=0`.

## 3. Suite unit studio

`npx vitest run tests/unit/studio` -> `Test Files 128 passed (128)`, `Tests 2953 passed | 1 skipped (2954)`, `VITEST_EXIT=0` (durasi 127,70 s). Naik dari 119 berkas / 2874 uji di D-380.

## 4. Regresi benchmark

Skrip yang dipakai gerbang D-360/D-225: `benchmark/extract/convert_v2.ts --check` (mode cek = regenerasi di memori, tanpa tulis; `convert_v2.ts:34`). Dijalankan 3 kali: `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check`.

| Run | Exit | Hasil |
|---|---|---|
| 1, 2, 3 | 0, 0, 0 | `SAME benchmark/manual000/doc.v2.json sha256=79290e07…`; `SAME …/template.v2.json sha256=882057c5…`; `SAME …/datum-manual-000.preset.json sha256=a951b149…` |

Sha identik dengan rujukan D-271/D-287 (doc.v2 `79290e07`, template.v2 `882057c5`, preset `a951b149`). Manual 000 SAME x3.

## 5. Asap alur inti di :9021

Dokumen uji di misi `2026-10-30_dc31_gate`. Bentuk badan mengikuti `docs/STUDIO-AGENT-GUIDE.md` §1.1 dan register 05 §5.8.

| Langkah | Permintaan | Hasil (ringkas) | x-correlation-id |
|---|---|---|---|
| a | `GET /api/studio/registry?kind=contracts` | 200; `items` = 1 (`agentWorkReport`, `active`, `laporan-kerja-agen`, NOTA); status `draft,complete,partial,blocked,needs-review`; outline 1..5 wajib; `defaultFormats ["HTML"]`; kerangka record/content wajib, references opsional. Tanpa rahasia -> 401 | `dd3e58fe-1168-41ec-bdf2-accdcbf3fdac` |
| b1 | `POST /api/studio/slots` (amplop buat: mission+docKey+template+meta, slot `record`, status `partial`, owner `verifier`, `reportedAt 2026-10-30T21:00+07:00`, `cardIds ["t_249c6b84"]`, 2 items, 1 evidence) | 201; dokumen A `cmvuz4mn70001v1jgoom5m4qw` (`001/GSP/LAP/X/2026`), rev 1 `create;slot:record`; INCOMPLETE, missing `content:1..5`, `expectedSource: outline` | `1fa54718-4b04-4ff1-88d8-c12481a59e75` |
| b2 | 5 x `POST /api/studio/chapters` paralel (bab 1..5) | semua 201 (rev 2..6); bab 4 (rev 6) -> COMPLETE, `fullRenderAllowed: true` | bab1 `668674e3-3a1d-41b7-a684-a48ca5f36d7c`, bab2 `e681b8cd-c471-4cbf-8053-4ef11d61dc1e`, bab3 `e767b643-7c30-463b-8264-7f3157235d53`, bab4 `e90ce494-66d6-400b-a912-dc8c64fc5905`, bab5 `27ccb480-1c58-42d3-b45d-aecddbc612e3` |
| b3 | `GET …/completeness` | 200; COMPLETE rev 6; slot `record:FILLED, content:FILLED, references:OPTIONAL_EMPTY` | `b8d22f2f-53e0-45ae-b09c-d7165a596d4b` |
| c1 | slot record `status: "selesai"` | 400 `SCHEMA_INVALID`, `checkId CONTRACT_ENUM`, pointer `/payload/status` | `bc4d83c8-3e47-4fd5-9adc-6810169104c5` |
| c1b | `cardIds ["t_249C6B8"]` | 400 `SCHEMA_INVALID`, `CONTRACT_PATTERN`, `/payload/cardIds/0` | `c370066e-bfff-468c-9255-4aab7f818569` |
| c2 | `refs[0]` = dokumen A + pid `p-zzzzzzzzzz` | 422 `CONTRACT_REF_PID_NOT_FOUND`, details `{pointer:/payload/refs/0/pid, documentId, pid}` | `adf1e3cd-2487-4e78-aa3a-a083ee837306` |
| c2b | `refs[0].documentId` tak ada | 422 `CONTRACT_REF_NOT_FOUND`, `reason: DOCUMENT` | `04f05eef-724c-4e61-8d33-83cb98dc071a` |
| c-0tulis | `GET …/completeness` sesudah c1..c2b | rev tetap 6 (0 revisi tertulis) | `0261e652-30cb-4c10-b908-83fdae10d34c` |
| c3 | dokumen B `cmvuz5jlk0020v1jg9vekh7rp` (`002/GSP/LAP/X/2026`): record + bab 1,2,4,5 | buat 201; sesudah bab 5: INCOMPLETE, `missingRequired ["content:3"]` | buat `1f734aa4-9328-45f5-b434-7e3fe3f11b08`; bab5 `f642b2af-b6b3-424b-985b-f4e28f84b2f8` |
| c3b | render penuh B (`scope: document`) | 409 `DOCUMENT_INCOMPLETE`; header kuota bucket `render` | `a9ca5987-e669-4c27-a028-1d17b2ee0136` |
| c-ext | `payload.label`; `reportedAt 2026-02-30` (base 7); item key ganda (base 7) | 400 `DISPLAY_FIELD`; 400 `SCHEMA_INVALID/CONTRACT_DATE`; 422 `CONTRACT_ITEM_KEY_DUPLICATE` positions [1,3]; rev A tetap 7 | `392ba709-5994-4561-b7b3-9e5ebefdb0ec`, `21815ce5-dd7b-426e-a7f9-d11591b5a17e`, `911d5ae8-3d3d-4d1f-9247-4b8bf2649de8` |
| d1 | slot record A: status `complete`, verdict PASS, item 1 `done`, `refs` ke B pid `p-pznnphrywf` (`rel evidence`), base 6 | 201; rev 7 `slot:record`; COMPLETE | `9bbbbd75-6caf-42f3-95c9-e0598f942781` |
| d2 | kirim ulang identik | 200 `unchanged: true`, rev 7 | `5ee1c046-1e85-4e69-bb90-0054f5ca324e` |
| e1 | R21 `?status=complete&mission=…` | 200; 1 hasil = A, `status complete`, `revisionNo 7`, `cardIds ["t_249c6b84","t_5943d415"]` (gabungan cardIds + items.key sesuai MX09); header `x-studio-quota-bucket: query`, `remaining 119` | `0ca159e4-2d10-439f-8b96-0e7a4579d97b` |
| e2 | R21 `?status=partial&mission=…` (status lama) | 200; 0 hasil (cermin mengikuti revisi terbaru) | `442e14a6-1f65-45d0-8cf9-1b0185b5dfa2` |
| e3 | R21 `?cardId=t_249c6b84&mission=…`; `?cardId=t_5943d415` | 200; A dan B ditemukan; `matchedItems` untuk `t_5943d415` = A `done` pid `p-xmj2r84b3e`, B `running` | `117631ea-2d36-420d-9b77-91d62c21f7d9`, `077f5022-1b3a-4867-9489-b381f2235b67` |
| e4 | R21 `?status=selesai`; `?foo=1`; tanpa rahasia | 400 `SCHEMA_INVALID` `/query/status`; 400 `/query/foo`; 401 | `2a4de33a-70d5-4cf6-a645-f980a3321e7c`, `7f35b4dd-7926-46a7-a38a-32e65fd6455e` |
| e5 | R22 `?q=kelopaksenja31` (kata unik bab 3 A) | 200; 1 hit: `documentId` A, `pid p-h4dz2q9ypt`, `address 3.1.1`, `chapterKey 3`, `revisionNo 7`, snippet bertanda; header kuota `query` | `242a85fb-f830-49e9-9d01-70282757195c` |
| e6 | R22 `?q=t_5943d415&type=contractItem&documentId=A` | 200; hit `address F:record/1`, `type contractItem`, pid `p-xmj2r84b3e` | `d57d8fd3-d5a6-4671-9e50-cd45b9e3a130` |
| e7 | R22 `q=a`; `revisionNo` tanpa `documentId`; tanpa rahasia | 400 `/query/q`; 400 `/query/revisionNo`; 401 | `4038451b-74c1-442e-bb4e-5d635b33c935`, `68a2922e-d4e4-47b6-a7bb-25dc71c8e64e` |
| f1 | R17 `POST …/render` `{scope: document}` TANPA `formats` | 200 SUCCEEDED; `outputs` = 1, `format HTML` (KD-41); `finalFileName 001-GSP-LAP-X-2026_rev7_20261030T125539Z_ba290f88.html` = regex C51 true; createdAt `2026-10-30T12:55:39.099Z` -> stamp detik terpotong benar; header kuota `render` | `a8bf9165-f83d-4c81-b80a-291f8b7e9819` |
| f2 | R10 `GET /api/studio/files/cmvuz6j4q0042v1jg2zvzz9ib` | 200; `content-disposition: attachment; filename="<nama final>"; filename*=UTF-8''<nama final>`; `x-studio-final-filename` sama; `x-studio-sha256 ba290f88e85e…`; sha256 berkas unduhan lokal = `ba290f88e85e33d4…` (2.585.677 byte) -> sha8 cocok | `05a3503e-47be-41e5-8dd9-8b88e08597d6` |
| f3 | R10 `HEAD ?verify=1` | 200; header sama + `x-studio-sha256-verified: true`; `size_download=0` (tanpa badan) | `9d4d253e-dbad-4d8a-af5e-e00d1c2b5a70` |
| f4 | `?name=datum`; `?name=bad`; R10 tanpa rahasia | Content-Disposition nama DATUM, header final tetap; 400 `/query/name`; 401 | `7d28517f-9ab1-4b4e-a57b-f866d6953e7f` |
| f5 | U-2 regresi: HEAD berkas dokumen non-kontrak `003/GSP/KT/X/2026` rev 10 (`cmvuig0d900a9v11grhc3tw4r`) | Content-Disposition tetap nama DATUM; `x-studio-final-filename 003-GSP-KT-X-2026_rev10_20261030T050707Z_7ab38298.docx`; verified true | `90f08dd7-3737-4dfd-8c76-a6e54518b80d` |
| g1 | R23 `POST /api/studio/drafts/check` draf MD (kepala lengkap + blok json slot record `needs-review`) | 200 `valid: true`, header terurai, blok 1 `line 6 endLine 9`, `issues []`; bucket `validate`; rev A tetap 7 | `0f39df40-8409-423d-8214-9510300fc66f` |
| g2 | R23 draf sama dengan status `selesai` | 200 `valid: false`, blok isu `CONTRACT_ENUM` | `7c0f7f25-b65c-4667-8076-b3f21ebaf695` |
| g3 | R23 tanpa rahasia | 401 | - |
| kuota lain | importer `POST /import/markdown` (tanpa tulis); R08 `POST /validate` | 200 + `x-studio-quota-bucket: import` (59) / `validate` (112) | `fe4efc81-14e2-46d5-9d66-0d4392788de1`, `1f89bcb8-6845-4b63-b7ff-083d9c614269` |

## 6. Penelusuran syarat

### 6.1 Kriteria blueprint §3.1

| Kode | Vonis | Bukti |
|---|---|---|
| KS-1 Migrasi aditif | LULUS sebagian; gladi rollback BELUM-DAPAT-DICEK (DC-38) | Grep `prisma/migrations/20261030220000_add_studio_contract/migration.sql`: DROP 0, CREATE TABLE 3 (non-Studio 0), CREATE TYPE 0, CREATE INDEX 19 (nama non-Studio 0), ADD CONSTRAINT 4 (semua FK antar Studio*, :132-141), ADD COLUMN 8; `IlSearchDoc/pg_trgm/WorkerTrace/"Role"` 0. `npx prisma migrate status` -> `gsp_agent_hq_v21` "8 migrations found", "Database schema is up to date!". Hitungan baris tabel lama tidak diukur di sini |
| KS-2 Format tunggal | LULUS | Kontrak = templat `laporan-kerja-agen` di `studio.slot/v2`/`studio.chapter/v2` (langkah b); `payload.label` -> 400 `DISPLAY_FIELD` (cid `392ba709…`) |
| KS-3 Medan tervalidasi | LULUS (kode); lihat M1 untuk urutan | enum 400 `CONTRACT_ENUM`, pola 400 `CONTRACT_PATTERN`, tanggal 400 `CONTRACT_DATE`, ref 422 EC25/EC26, key ganda 422 EC27; rev tidak bertambah (6 lalu 7 tetap) |
| KS-4 Kerangka wajib | LULUS | B tanpa bab 3: INCOMPLETE `content:3`; render penuh 409 `DOCUMENT_INCOMPLETE` (cid `a9ca5987…`) |
| KS-5 Retrieval | LULUS sebagian (asap); presisi/recall fixture + p95 BELUM-DAPAT-DICEK (DC-36, DC-39) | R21 status baru ditemukan, status lama 0 hasil, cardId menemukan A+B; R22 memuat documentId + pid + address |
| KS-6 Akses | LULUS sebagian; security BELUM (DC-41) | Tanpa rahasia: R03, R21, R22, R23, R10 = 401 |
| KS-7 Nama final | LULUS untuk keluaran asap; 0 tulis workspace bersama BELUM (DC-43) | 1/1 `finalFileName` cocok C51; sha8 = awal sha256 berkas unduhan; R05 `?rev=7` `outputs[].finalFileName` sama; AC-18 bolak-balik true |
| KS-8 Draf/checkpoint | LULUS sebagian; lihat L1 | R23 0 tulis (rev A tetap 7); CLI `draft-check --remote --json` vs R23: draf tidak valid identik penuh; draf valid identik kecuali `completenessPreview.slots[record].lastFilledBy/lastFilledAt` |
| KS-9 Header kuota | LULUS pada 2xx/409 untuk 4 bucket; 429 BELUM-DAPAT-DICEK (DC-36; tidak menghabiskan kuota DEV) | query (R21/R22), render (R17 200 dan 409), validate (R23, R08), import |
| KS-10 chart.custom | LULUS registri; render/paritas SVG BELUM (DC-35) | CU-01..CU-09 -> P-01,P-02,P-03,K-01,W-01,W-04,W-05,H-01,H-04; `CHART_REGISTRY_COUNT` 76 |
| KS-11 Non-regresi | LULUS untuk suite + convert_v2; sha DOCX Manual 000 tidak dirender ulang di gerbang ini (BELUM-DAPAT-DICEK; D-380 mencatat sebelum = sesudah lewat render_cli) | suite 128/128 berkas; `convert_v2 --check` SAME x3; U-2 dokumen non-kontrak tetap nama DATUM (f5) |

### 6.2 Kriteria penerimaan register 05 (AC-11..AC-24)

Hitungan lewat skrip tsx sementara di luar repo (`C:/Users/TRIAL/AppData/Local/Temp/claude/dc31/counts.ts`, mengimpor modul repo).

| AC | Vonis | Bukti |
|---|---|---|
| AC-11 | LULUS | `STUDIO_ERROR_CODES` 73; `STUDIO_ERROR_HTTP` 73 kunci; EC25..EC28 = 422 |
| AC-12 | LULUS | `SCHEMA_V2_CHECK_IDS` 14 (CH-01..CH-06 ada); DF global 52 + per lokasi 21 = 73 |
| AC-13 | LULUS (statis + migrate status); hitungan baris BELUM (DC-38) | lihat KS-1 |
| AC-14 | BELUM-DAPAT-DICEK | gladi rollback milik DC-38 |
| AC-15 | LULUS (tidak langsung) | NV-01..NV-12 ada di `tests/unit/studio/contract/dc05-contract-delta.test.ts`, `contracts/dc07-contract-service.test.ts`, `ingest/dc08-contract-gate.test.ts`, semua hijau di suite; asap c1/c2/c-ext memberi kode yang sama |
| AC-16 | LULUS | `SECTION_REGISTRY` 52 (pin 52), DOCUMENT 30, `contractRecord` = S30; `SLOT_KINDS` 9; R03 `kind=sections` 52 |
| AC-17 | LULUS | `STUDIO_ROUTES` R21 `/api/studio/contracts`, R22 `/api/studio/search`, R23 `/api/studio/drafts/check`; berkas route ada |
| AC-18 | LULUS | contoh FN di-parse lalu diformat identik; keluaran asap cocok C51 |
| AC-19 | LULUS sebagian | DX-1..DX-8 di `draft/dc21-extract-draft.test.ts` hijau; CLI `--remote` = R23 untuk 2 draf langsung (bukan 3), dengan catatan L1 |
| AC-20 | LULUS | lihat KS-10 |
| AC-21 | LULUS | langkah a |
| AC-22 | LULUS sebagian | `GET /api/studio/templates`: 7 templat, tepat 1 ber-`contractKind` (`laporan-kerja-agen`/`agentWorkReport`); jalan kedua seed tidak dijalankan (menulis DB) |
| AC-23 | LULUS | `common.schema.ts:686-708`: `type` + 13 medan CF-02..CF-13, `obj(...)` tertutup, wajib `type,status,reportedAt` |
| AC-24 | BELUM-DAPAT-DICEK | milik DC-32 |

## Temuan

### High
Tidak ada.

### Medium
- **M1 Urutan evaluasi kiriman menyimpang dari register 05 §5.6 / 03 §11.1.** Register menempatkan `CONTRACT_DATE` (pasca-ajv, langkah 2) dan EC27 (langkah 6b, "murni, sebelum kunci") sebelum `SCOPE_CONFLICT` (langkah 7, di dalam kunci). Teramati: dengan `baseRevisionNo` basi (6, terkini 7), kiriman `reportedAt 2026-02-30` -> 409 `SCOPE_CONFLICT` (cid `af969ff2-a985-409b-8e92-d654c81d93c5`), item key ganda -> 409 `SCOPE_CONFLICT` (cid `74f07022-a92d-471f-b847-6dcfd2136f32`), sedangkan enum (ajv) dengan base basi tetap 400 `CONTRACT_ENUM` (cid `62fe6789-e7e0-47ed-993f-45057fe39035`). Dry-run R08 sama (cid `1c524883-959c-4511-a702-c64dc0e49fe4`: isu `SCOPE_CONFLICT`, bukan `CONTRACT_DATE`). Sebab: I54 `checkContractRecord` dipanggil di gerbang by-construction (`src/lib/studio/services/ingest/by-construction.ts:257`; komentar :43-45 menyebutnya "langkah 6b" tetapi gerbang ini berjalan di transaksi sesudah cek lingkup). Dampak: tanpa korupsi data dan kode galat benar bila base terkini; agen dengan base basi + payload salah butuh satu putaran ekstra (409 lalu 400/422), menambah hitungan 4xx KE-3. Usulan baris berpemilik: pindahkan I54 ke jalur murni sebelum kunci, atau amandemen register yang menyatakan urutan nyata; DC-35/DC-36 menguji urutan itu.

### Low
- **L1 KS-8 "hasil CLI dan R23 identik" tidak tercapai secara harfiah.** `completenessPreview.slots[].lastFilledBy` berbeda (`anonymous-internal` dari CLI, yang tidak punya opsi `agentId`, lawan `agent:controller-gate-dc31` dari R23), dan `lastFilledAt` mengikuti jam dry-run. R23 cid `031a0db3-42d9-4fd5-b76a-af3a6985bb3d`. Usulan: DC-36 menetapkan perbandingan tanpa medan volatil, atau CLI menerima `--agent-id`.

## Dokumen uji yang dibuat (DB `gsp_agent_hq_v21`, misi `2026-10-30_dc31_gate`)

| Objek | Id | Catatan |
|---|---|---|
| Dokumen A | `cmvuz4mn70001v1jgoom5m4qw` (`001/GSP/LAP/X/2026`, docKey `laporan-kerja-dc31-a`) | rev 1..7, COMPLETE, status `complete` |
| Dokumen B | `cmvuz5jlk0020v1jg9vekh7rp` (`002/GSP/LAP/X/2026`, docKey `laporan-kerja-dc31-b`) | rev 1..5, INCOMPLETE `content:3`, status `draft` |
| Job render | `cmvuz6hy50040v1jg1yj6rptn` | A rev 7, HTML |
| Berkas keluaran | `cmvuz6j4q0042v1jg2zvzz9ib` | `001-GSP-LAP-X-2026_rev7_20261030T125539Z_ba290f88.html` |

Berkas sementara verifier di luar repo: `C:/Users/TRIAL/AppData/Local/Temp/claude/dc31/` (badan JSON, unduhan HTML, skrip hitung), log `C:/Users/TRIAL/AppData/Local/Temp/claude/dc31_{tsc,eslint,vitest}.txt`. Tidak ada rahasia yang ditulis ke berkas atau keluaran.

## Langkah berikut

1. Controller membuat baris berpemilik untuk M1 (kode atau amandemen register) sebelum DC-35/DC-36 mengunci uji urutan evaluasi.
2. L1 diteruskan ke DC-36 (definisi perbandingan CLI = R23).
3. Butir BELUM-DAPAT-DICEK diteruskan ke pemiliknya: DC-36 (presisi/recall, 429), DC-38 (rollback, hitungan baris), DC-39 (p95), DC-41 (security), DC-43 (0 tulis workspace bersama, sha DOCX Manual 000), DC-32 (AC-24).
