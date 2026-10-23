# SR-45 Uji API struktur (R12-R20, R01/R02/R19 v2, R18 multipart, R08 dry-run)

Baris: SR-45 (fase uji akhir) dan lanjutan D-305 (celah M-5 SR-58). Agen: test-expert. Skill: tdd. Tanggal: 2026-10-23.

Status: complete. Hasil run terakhir: 150 lulus, 0 gagal, 0 dilewati, di 9 berkas.

Kasus E2, E3a, E3b, dan E3c ada dan lulus. E3c mengikuti D-247: render penuh lewat R17.

Tiga kegagalan run pertama (D-247 x2, F-065) kini lulus setelah FIX-S diterima (D-261). Ekspektasinya diperketat ke kontrak D-261/D-275.

Ringkasan revisi laporan:

| Versi | Hasil | Catatan |
|---|---|---|
| v1 | 129/132 | 3 gagal, dipetakan ke FIX-S |
| v2 | 150/150 | Ditambah multipart R18 (14 kasus), R08 dry-run (4 kasus), dan ekspektasi D-261/D-275 |

## 1. Strategi uji

**Lingkup.** Handler route dipanggil langsung dengan `NextRequest`, mengikuti pola S74. Bedanya, Prisma tidak di-mock: uji memakai DB nyata `gsp_agent_hq_v21` (brief butir 5).

Route yang diuji:
- R12, R13, R14 GET/PATCH, R15, R16 GET/PATCH, R17, R20.
- R18 dalam bentuk JSON dan multipart.
- R08 dry-run kiriman bab.
- R05 GET, R07 GET, R04 GET/POST v2 (target SUB-1).
- R01 GET/POST, R02 GET/POST/PATCH, R19 GET/POST.

**Pengaman DB (`_db.ts`):**
- `current_database()` harus `gsp_agent_hq_v21`; selain itu uji tidak berjalan.
- Sidik dokumen 000/001/002 diambil sebelum dan sesudah tiap berkas, lalu dibandingkan.
- Pembersihan hanya menyentuh fixture milik RUN_ID run itu:
  - folder misi `2099-01-01_sr45-fx-<run>-*`;
  - requester yang memuat RUN_ID;
  - slug `sr45-fx-*-<run>`;
  - sha PNG acak yang dibangkitkan uji.
- Sisa fixture diharuskan 0 untuk dokumen, aset, templat, dan job.

**Identitas.** Cookie `gsp_hq_session` (HMAC), JWT NextAuth, dan header `x-internal-secret`. Semuanya ditandatangani dengan secret UJI di dalam proses. Tidak berlaku di server :9021.

**Kuota D-255.** Batas diturunkan lewat env uji `STUDIO_ASSET_QUOTA_BYTES_PER_DAY = 1 MiB`. Nilai ini dibaca per panggilan (`asset-store.ts:101-106`) dan dipulihkan di `afterEach`.
- Berkas terbesar yang ditulis ke disk sekitar 480 KB.
- Bagian 20 MiB + 1 hanya ada di memori. Server menolaknya dengan 413 sebelum menulis.

**Pengecualian:**
- Render PDF.
- 503 `RENDER_QUEUE_FULL`, karena butuh antrean penuh nyata.
- Kuota ember agen internal 2 GiB. Ember ini dibagi semua agen di DB, jadi diuji dengan ember USER milik run.

**Runner.** Vitest 4.1.11 (`vitest.config.ts`: `tests/**`, `fileParallelism: false`). Repo tidak punya konfigurasi cakupan baris.

**Sumber ekspektasi:**
- Blueprint 05 §2.5-§2.7.
- Register 03 §7, §8.4 (KD-15), §9, §11, §12.
- D-61, D-134, D-163 T-1, D-232/D-235/D-237.
- D-247/D-261 (`render` di badan -> 400 `SCHEMA_INVALID` dengan `checkId: RENDER_FIELD`).
- D-255 (kuota).
- D-272 (R08 dry-run READ ONLY).
- D-275 (pointer isu by-construction relatif badan `/chapter/...` + `mergedPointer`).

## 2. Berkas uji (`tests/unit/studio/api-structure/`)

| Berkas | Isi | Lulus |
|---|---|---|
| `submit.test.ts` | E2, idempotensi, pembaruan; galat R12/R13; E3a, SCOPE_CONFLICT, E3b; D-247/D-261 (`render` di bab -> 400 `RENDER_FIELD`); R15/R07; SLOT_UNKNOWN, SLOT_TYPE_MISMATCH; lampiran; R14 renumber/change; R17 422/404; R04 GET; F-065 + D-275 (422 `BY_CONSTRUCTION_FAILED` DATUM-04, pointer `/chapter/sections/0...`, `mergedPointer`) | 24 |
| `pid.test.ts` | COMPLETE: R05, R14; R20 round-trip (dengan dan tanpa pid -> `unchanged`); E3c (replace base usang lalu R17 DOCX tidak draf); D-247/D-261 PATCH+render 400; op pid insertAfter/replace-ke-gambar/move/delete; SCOPE_CONFLICT pid; PID_NOT_FOUND; CHANGE_FIELDS_REQUIRED; history; render bab | 19 |
| `auth.test.ts` | Anonim 401 di 18 handler + penjaga cakupan ekspor; secret salah dan cookie rusak 401; 4 identitas 201/200; PT-07 | 42 |
| `templates.test.ts` | PRESET_READONLY, PRESET_ADMIN_ONLY, PARAM_SURFACE_FORBIDDEN (R01 v1, R02, R19, `expertMode`), pembawaan lapis lanjutan, SLOT_PARAM_SCOPE_INVALID, PARAM_CLASS_T_READONLY | 15 |
| `trust.test.ts` | SUB-1 R04 `target.documentId`; F-064 (gerbang 403 + pengupasan `x.lintEnforcement`) | 18 |
| `assets.test.ts` | R18 JSON (201/200, GET, 404); FIX-1 piksel 413 dan GIF 415; aset di R12 (assetRef, ASSET_NOT_FOUND, 415, 413); JSON > 5 MiB 413 | 11 |
| `multipart.test.ts` (baru) | R18 multipart: anonim 401; sah 201 (MIME dari magic bytes, tanpa path); dedupe 200 (multipart ulang dan JSON lalu multipart); `?mission=`; tanpa `file`, dua `file`, field non-berkas 400; GIF dan SVG/teks bernama `.png` 415; bagian > 20 MiB 413; `Content-Length` > batas 413 (D-61); 5 nama berbahaya; kuota D-255 | 14 |
| `dryrun.test.ts` (baru) | R08 dry-run bab (D-272): pratinjau misi baru, pratinjau = kiriman nyata, pelanggaran DATUM-04 valid:false, DOCUMENT_NOT_FOUND, RENDER_FIELD | 4 |
| `rate.test.ts` | FIX-1 429 + Retry-After, satu ember agen | 3 |

## 3. Inventaris kasus kunci (tambahan v2; kasus v1 tetap lulus)

| Kasus | Kategori | Masukan | Diharapkan | Aktual | Status |
|---|---|---|---|---|---|
| Multipart sah | unggah | USER, PNG 7x3, tipe bagian `application/octet-stream` | 201, `mime: image/png`, tanpa path, `createdBy: user:<run>` | sesuai | PASS |
| Dedupe | idempotensi | byte sama diunggah ulang (Google); JSON lalu multipart (agen) | 200 `created:false`, 1 baris | sesuai | PASS |
| Anonim | auth | multipart tanpa identitas | 401, tanpa baris | sesuai | PASS |
| Bentuk | validasi | tanpa `file`, dua `file`, `file` berupa teks | 400 SCHEMA_INVALID `/file` | sesuai | PASS |
| Tipe | 415 | GIF berlabel `image/png`; SVG berskrip bernama `.png` | 415 ASSET_TYPE_UNSUPPORTED, tanpa baris | sesuai | PASS |
| Ukuran berkas | 413 | bagian 20 MiB + 1 (memori) | 413 ASSET_TOO_LARGE, tanpa path | sesuai | PASS |
| Ukuran header | 413 (D-61) | `Content-Length` 22 MiB, badan kecil | 413 sebelum badan dibaca, tanpa baris | sesuai | PASS |
| Traversal | keamanan | nama `../../../../evil.png`, `..\..\..\evil.png`, `/etc/passwd`, `C:\Windows\evil.png`, `a/../../evil\0.png` | nama berkas tidak dipakai: `relPath = assets/<sha2>/<sha>.png`, tanpa `evil` di respons, tanpa berkas di luar workspace | sesuai | PASS |
| Kuota D-255 | 429 | batas 1 MiB, 3 PNG unik ~480 KB | ke-3: 429 RATE_LIMITED + `Retry-After` + `{reason: asset_quota_exceeded, bucket: caller, quotaBytes, windowHours: 24}`, tanpa baris; sha lama 200; peminta lain 201 | sesuai | PASS |
| R08 dry-run | D-272 | bab ke misi baru / ke dokumen ada | `submitPreview` sama dengan kiriman nyata berikutnya; 0 baris, 0 job | sesuai | PASS |
| R08 pelanggaran | D-272/D-275 | judul pertanyaan TERBIT; id asing; `render` | valid:false; DATUM-04 `/chapter/...`; DOCUMENT_NOT_FOUND; RENDER_FIELD | sesuai | PASS |
| D-247 bab/pid | D-261 | `render` di badan R12/R16 | 400 SCHEMA_INVALID `checkId: RENDER_FIELD`, 0 tulis | sesuai (sebelumnya 201/200, v1 FAIL) | PASS |
| F-065 R12 | D-261/D-275 | judul pertanyaan, tier TERBIT | 422 BY_CONSTRUCTION_FAILED, pointer `/chapter/sections/0...`, `mergedPointer` | sesuai (sebelumnya 201, v1 FAIL) | PASS |

## 4. Analisis cakupan

**Tercakup:** semua route di §1. R18 kini mencakup JSON dan multipart. Kriteria tercakup:
- SC-10 (multipart: celah M-5 ditutup).
- SC-2, SC-3 (T), SC-7.
- PT-04, PT-07.

**Celah dan remediasi:**
- 503 `RENDER_QUEUE_FULL`: perlu seam antrean.
- Kuota ember agen internal 2 GiB: ember ini dibagi semua agen; ujinya butuh DB terisolasi `_uji`.
- `STORAGE_WRITE_FAILED` (ruang disk minimum): butuh seam `freeBytes`, sudah tercakup uji unit FIX-SEC.
- `PID_CONFLICT`.
- R06 PATCH alamat: dimiliki S74/SR-43.
- R14 `reorder`/`omitSlot`/`restoreSlot`/`setMeta`/`templateVersion`: F-066 dimiliki SR-57.
- Balapan pembuatan dokumen misi yang sama.
- Render PDF.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/api-structure
npx eslint tests/unit/studio/api-structure
npx tsc --noEmit -p tsconfig.json --incremental false
```

Keluaran run terakhir (2026-10-23):

```
 Test Files  9 passed (9)
      Tests  150 passed (150)
   Duration  19.79s
```

- eslint: exit 0. tsc: 0 galat di `api-structure`.
- Sisa global v21 sesudah run (skrip Prisma read-only): `docs 0, assets 0, templates 0, jobs 0`.
- Sidik 000/001/002 sama sebelum dan sesudah di tiap berkas (9/9).
- Dokumen 000 kini rev 5, `updatedAt` 2026-10-23T02:39Z. Perubahan ini dibuat baris lain di antara sesi uji, bukan oleh SR-45.

## 6. Catatan CI

- Suite butuh `.env` yang menunjuk `gsp_agent_hq_v21`; bila tidak, suite menolak berjalan. Jangan dijalankan di CI tanpa DB uji; untuk CI, arahkan ke `gsp_agent_hq_v21_uji`.
- Flaky lama sudah diperbaiki. Penyebabnya proses lain menjalankan `tests/unit/studio` bersamaan. Kini fixture dan identitas dibatasi RUN_ID.
- Hitungan tabel global tidak di-assert, karena agen paralel menulis ke v21. Yang di-assert: sidik 000/001/002 dan sisa fixture = 0.
- Kuota D-255 dihitung per requester dalam jendela 24 jam bergulir. Uji memakai requester USER yang unik per run, sehingga run berulang tidak saling memenuhi kuota.
- Workspace ada di `%TEMP%\gsp-studio-sr45-<run>`. Dibersihkan sesudah run.

## 7. Masalah dan keterbatasan

| ID | Temuan | Bukti | Pemilik / status |
|---|---|---|---|
| K-1 | D-247: `render` di badan R12/R16 masih diterima (v1) | `submit.test.ts`, `pid.test.ts` kini PASS dengan `RENDER_FIELD` | FIX-S, ditutup (D-261) |
| K-2 | F-065: R12 melewati gerbang by-construction (v1) | `submit.test.ts` kini PASS; pointer `/chapter/...` (D-275) | FIX-S/FIX-Y, ditutup |
| O-1 | R18 dan R19 menolak `agentId` di badan, sehingga atribusi agen tercatat `anonymous-internal` | uji aset/templat | terkait F-067 N-04 |
| O-2 | Laju FIX-1 dan kuota aset agen internal = satu ember bersama (`render-guard.ts:56-57`, `asset-store.ts` ember internal) | `rate.test.ts` | IP-67 (D-255) |
| O-3 | Respons 413 ASSET_TOO_LARGE R18 tanpa `details`, karena route memakai `stripDetails` (`assets/route.ts`, catch POST). Register §11.3 tidak mewajibkannya | `assets.test.ts`, `multipart.test.ts` | SR-25, Minor |
| O-4 | Contoh blueprint E2/E3 memakai `completeness.content`, sedangkan register KD-15 memakai `chapters.content`. Uji mengikuti register | `types/v2/completeness.ts:42` | DOC |
| O-5 | Nama berkas multipart tidak ditolak, tetapi diabaikan seluruhnya: jalur beralamat sha256, sehingga traversal tidak mungkin. Uji membuktikan nama berbahaya tidak memengaruhi `relPath`, respons, maupun sistem berkas. Bila "ditolak" (4xx) diinginkan sebagai kebijakan, itu perubahan produk | `multipart.test.ts` 5 kasus | Putusan controller |

## 8. Rekomendasi

1. Putuskan O-5: mengabaikan nama berkas sudah aman, jadi penolakan 4xx bersifat opsional.
2. Putuskan O-1 bersama F-067 N-04.
3. Tambah uji 503 antrean dan `PID_CONFLICT`.
4. Uji ember internal 2 GiB di DB `_uji` terisolasi.
