# 27 — Protokol uji efisiensi putaran 5 (jalur tulis minimal Studio)

Status: dikunci controller 2026-11-03 sebelum run pertama r5 (D-521..D-528). Protokol ini MEWARISI seluruh definisi, metrik, dan aturan `research/17_efficiency_protocol_r4.md` kecuali yang diubah di bawah. Analis menerapkan r4 §6.6-6.9 dan §7.5-7.8 apa adanya dengan delta ini.

## 1. Pertanyaan

Apakah jalur tulis minimal Studio (`studio_write` + `studio_edit`, toolset `write`: agen hanya menyusun isi sebagai larik paragraf/tabel, mesin mengurus bentuk dan format) membuat biaya menulis Hermes setara Markdown, sambil mempertahankan keunggulan retrieval dan mutu dokumen?

Arahan USER (D-521, D-523): "efforttnya tidak boleh banyak berubah. enginenya yang harus bekerja"; "konsepnya harus sama dengan pembuatan dokumen output".

## 2. Delta terhadap r4

| # | r4 | r5 | Dasar |
|---|---|---|---|
| P5-1 | Arm B U-REP toolset `reports` (9 alat), laporan MD berkepala + `studio_report_*` | Arm B toolset `write` (6 alat): `studio_write` (isi per bagian) lalu `studio_edit` (cari-ganti); tidak ada berkas laporan di disk | D-522 |
| P5-2 | Arm B U-DOC toolset `documents` (13 alat), slot/bab/struktur manual | Arm B toolset `write`: `studio_write` dengan `template` + `meta` + `sections` (tabel, `{chart}`), mesin mengurus sampul, nomor tabel/gambar, keterangan | D-523 |
| P5-3 | Arm B menandai `mark S1..S3` sesudah submit/update, arm A `step edit --step` | KEDUA arm hanya `step edit --step S1..S3` (pencatatan simetris); batas fase arm B dari `ts_result` panggilan `studio_write`/`studio_edit` yang `ok`, arm A dari edit terakhir per label (D-519) | Temuan r4 KE-2 |
| P5-4 | Galat MCP dari teks hasil alat (`mcp_ok`, cacat) | Galat MCP dari log server (`mcp_galat_server`, `mcp_galat_kode` di meta) | D-520, D-523 |
| P5-5 | Pemanasan WD memakai bahan nyata | WD memakai bahan sintetis `doc_ud2/warmup/` | D-520, D-527 |
| P5-6 | Sesi DF memakai brief generik | DF = hanya bagian Umpan balik brief U-DOC, tanpa membuat dokumen | D-520, D-528 |
| P5-7 | Brief R12B menyuruh alat di luar toolset | Toolset `write` memuat `studio_search`, `studio_contracts_query`, `studio_document_get` | D-520 |
| P5-8 | Kunci Q5 tanpa aturan rujukan tingkat bab | Aturan rujukan kasar D-525 ditulis di kunci sebelum run | D-525 |
| P5-9 | Draf bab U-DOC di sandbox ambigu | Arm B tidak menyimpan draf apa pun di disk (brief §3); unduhan final saja | D-525 |
| P5-10 | Misi r4 | Misi `2026-11-03_hermes-contract-ab5`, `2026-11-03_hermes-doc-ud2`; folder `contract_ab5`, `doc_ud2`, `controller_ab5`; misi dan folder r4 ditolak `trial-log get` | D-527 |

## 3. Ambang (tidak berubah)

- U-REP KE-1 (D-422): (a) median r1 <= 1,00; (b) median r2 <= 0,70 DAN maks r2 <= 1,00. Gerbang KERAS dan metrik lain sama dengan r4 §7.6.
- U-DOC (dikonfirmasi USER, D-525): UD-1a T1_B/T1_A <= 1,00; UD-1b T2_B/T2_A <= 0,70; UD-2, UD-5, UD-6 KERAS; UD-3 mutu termasuk UD-Q6 (c); vonis LEBIH BAIK / SETARA / LEBIH BURUK sama dengan r4 §6.8.
- G_B,stored diukur langsung dengan R20 `shape=submission` lalu R08 dry-run (skrip `controller_ab4/dc45d/ke3_dryrun.py`, disalin untuk r5), bukan proxy (D-525/D-526).

## 4. Ancaman validitas yang diketahui sejak awal

- Fakta FACTS4 dan bahan U-DOC sama dengan r4: kedua arm sudah pernah melihatnya di r4 (setara bagi keduanya). Brief melarang membuka sesi atau berkas r4.
- n = 3 pasangan U-REP, 1-2 pasangan U-DOC; confidence dibatasi seperti r4.
- Jalur tulis baru dibangun hari yang sama; galat alat baru dicatat sebagai temuan, bukan disembunyikan.
