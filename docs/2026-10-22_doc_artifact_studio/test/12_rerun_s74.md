# SR-43 Jalankan ulang S74: uji unit route dan layanan Studio (Prisma di-mock)

Baris: SR-43 (fase uji akhir, sesudah gerbang SR-39 D-239). Agen: test-expert. Skill: tdd. Tanggal: 2026-10-23.
Status: needs-review (lanjutan D-275, §10). Angka akhir api + fix1: 432 lulus / 1 gagal (433) di 8 berkas; api saja 393/0 (§9). Kegagalan tersisa satu uji fix1 (F-SR43-3, pemilik SR-12).
Riwayat: sebelum SR-43 229/77 (306), lalu run pertama SR-43 380/8 (388). Kedelapan kegagalan run pertama tertutup oleh FIX-S (D-261). Sesudah FIX-S, 7 uji ingest menjadi usang karena D-247; uji itu diperbarui dan ditambah 5 uji RENDER_FIELD (§9). Kode produksi (`src/**`, `prisma/**`) tidak diubah.

## 1. Strategi uji

- Seam yang diuji sama dengan S74 (`test/s74_unit_api.md` §1): handler `src/app/api/studio/**`, layanan ingest/templates/revisions, `getStudioCaller`, peta galat. SR-43 menambah satu seam layanan, yaitu `gateHtmlArtifact` (`services/render/artifact.ts:314`, diekspor dan dipakai R09 `prepare.ts:42`). Alasannya: dokumen yang dirender adalah keluaran seam ini (`artifact.ts:395-403`).
- Hal yang menyebabkan 77 kegagalan sebelum SR-43:
  - (a) 7 ekspektasi lama yang diubah oleh D-134.
  - (b) R-13 dari D-146.
  - (c) API templat v2 dari D-189/SR-61.
  - (d) Fixture S74 yang usang terhadap jalur struktur v2. Kasusnya: ingest v1 lewat adaptor (D-179/D-210), kerangka SR-06, tulis baris M14-M18 (D-183), kelengkapan (D-131), dan sunting v2 (D-196). Fixture lama berakhir di `unmocked prisma call` atau `TypeError` (500).
- Perbaikan fixture. Semua berada di area eksklusif `tests/unit/studio/api/**`:
  - `_studio.ts`: kolom v2 versi/templat (`skeletonSha256`, `slots`, `isPreset`) dan proyeksi `select` bersarang.
  - `studioDoc` kini memuat `front.controlSheet` secara bawaan. Opsi `minimal` mempertahankan bentuk §3 panduan.
  - Helper baru `installStructureWrites` (R04), `installMemoryStore` + `STRUCTURE_MODELS` (subset kueri Prisma dalam memori), dan `clearDbCalls` (`_prisma.ts`).
  - Di `revisions.test.ts`, revisi 1 kini ditulis oleh ingest nyata (persist ADMIN) ke penyimpanan memori. Cara lama, yaitu snapshot dryRun yang dirakit tangan, ditinggalkan. Akibatnya jalur PATCH v2 berjalan ujung ke ujung tanpa DB.
- Dikecualikan, sama dengan S74: DB nyata (SR-49), mesin render (`renderRevision`/`renderArtifact` ditiru), multipart aset, dan rollback transaksi nyata. Rollback tidak dapat ditiru oleh Prisma tiruan, jadi diuji di SR-49/SR-53.
- Folder `tests/unit/studio/api-structure/` milik SR-45 tidak disentuh. Filter `npx vitest run tests/unit/studio/api` (tanpa garis miring) ikut menyeret folder itu (515 uji). Karena itu semua angka di laporan ini memakai `tests/unit/studio/api/`.
- Runner: Vitest 4.1.11, `vitest.config.ts` (include `tests/**`). Repo tidak punya provider cakupan.

## 2. Berkas uji

| Berkas | Sebelum lulus/gagal | Sesudah lulus/gagal | Perubahan SR-43 |
|---|---|---|---|
| `auth.test.ts` | 40/1 | 41/0 | requester `agent:` (D-134) |
| `http-errors.test.ts` | 111/1 | 166/0 | 41 -> 68 kode, ditambah 27 literal register |
| `ingest.test.ts` | 16/41 | 58/1 | fixture v2, overrides v1 dibuang (KD-26), D-131, EC06 |
| `artifacts.test.ts` | 19/3 | 22/3 | overrides inline dibuang (KD-26), uji gerbang render baru |
| `revisions.test.ts` | 9/20 | 25/4 | penyimpanan memori, jalur PATCH v2 (D-196) |
| `templates.test.ts` | 17/11 | 51/0 | D-146, D-189/SR-61, lapis D-168 |
| `client-log.test.ts` | 17/0 | 17/0 | - |
| `_env.ts`, `_prisma.ts`, `_studio.ts` | - | - | helper fixture v2 (lihat §1) |

## 3. Inventaris ekspektasi yang diubah (alasan + keputusan)

| Kasus (berkas) | Lama | Baru | Dasar |
|---|---|---|---|
| requester agent (`auth:165-171`) | `aaa…` | `agent:aaa…` | D-134 (S87 L-02), `file_requests.md:105` |
| createdBy R04 google/agent (`ingest:84-88`) | `gsp-analis` | `google:agen@gsp.test` / `agent:gsp-analis` | D-134 L-02 |
| createdBy PATCH (`revisions`), R01 (`templates`) | `gsp-analis` | `agent:gsp-analis` | D-134 L-02 |
| render gagal setelah ingest (`ingest`) | `BY_CONSTRUCTION_FAILED` | `RENDER_FAILED` | D-134 (S85 R-09), `file_requests.md:106` |
| jumlah kode galat (`http-errors:114`) | 41 | 68 (+3 FIX-1, +24 EC01-EC24, literal per kode) | D-134; register 03 §11.2 `:808-831`; `file_requests.md:107,155` |
| `?import=profile` non-ADMIN x3 | `PARAM_CLASS_K_FORBIDDEN` | `FORBIDDEN` | D-146 (R-13 IP-43b) |
| kanonik diubah USER (route) | `PARAM_CLASS_K_FORBIDDEN` | `FORBIDDEN` (+ uji layanan `CANONICAL_ADMIN_ONLY`) | D-146 |
| R02 v1 datar non-ADMIN ubah K x3 + PATCH | `PARAM_CLASS_K_FORBIDDEN` | `FORBIDDEN` `V1_FLAT_ADMIN_ONLY` | D-189/SR-61, `file_requests.md:170` |
| aturan K per kunci berubah | route | layanan `createTemplateVersion` (uji baru) | D-146 ("K hanya bila kunci K berubah") |
| R01 USER/agent kunci B berlapis internal | 201 | 403 `PARAM_SURFACE_FORBIDDEN` (x3); B esensial `doc.language` -> 201 | D-189, EC12, lapis D-168 |
| layanan USER: K tetap + B | B internal -> v2 | B esensial -> v2; B internal -> 403 `PARAM_SURFACE_FORBIDDEN` | D-189 / D-134 (lapis per kunci berubah) |
| ROUTE F-S74-1 (USER v1 K tetap + B) | 201 | 403 `V1_FLAT_ADMIN_ONLY`; ADMIN v1 -> 201 | D-189 menggantikan skenario F-S74-1 |
| uji v2 baru | - | v2 `isPreset` non-ADMIN 403 `PRESET_ADMIN_ONLY` x3; overrides datar + template 400; R01 `?preset=x` 400 x3, `?preset=1` 200 + filter; R02 `?expert=x` 400 x2; proyeksi GET non-ADMIN (overrides esensial, roleFormats `{}`, resolvedParams utuh) x3; ADMIN lengkap | D-189, D-166 |
| doc.overrides K non-ADMIN R04 x3 | 403 K | 201, REPORT `INLINE_FORMAT_STRIPPED`, K tidak masuk snapshot | register KD-26 `:119`, AD-09 `:1008`; D-179, D-210 |
| doc.overrides T ADMIN R04 | 400 T | 201, dibuang | KD-26 (kebijakan bawaan strip) |
| R08 USER override K | `valid:false` keyword K | `valid:true` + REPORT, tanpa tulis | KD-26 |
| R09 inline K non-ADMIN x3 | 403 K | 201 | KD-26 (gerbang inline = ingest dryRun) |
| snapshot `x` ADMIN | `{lintEnforcement}` | `lintEnforcement` + `adaptReportV1` | D-210 |
| dokumen minimal tanpa lembar kendali (baru) | - | 201 INCOMPLETE, `renderRefused DOCUMENT_INCOMPLETE`, render tidak dipanggil | D-131, KD-27 |
| tier NOTA judul pertanyaan | doc bawaan | `minimal: true` (lembar kendali tidak aktif di NOTA) | D-131/kerangka implisit |
| PATCH v2: job | `job-1` (render otomatis) | `job: null`, render tidak dipanggil | D-196 ("R06 v2 merender hanya bila `render` diminta"), KD-27 |
| PATCH v2: kunci optimistik | `{currentRevisionNo:2}` | `{currentRevisionNo:2, completeness:'COMPLETE'}` | D-131 / SR-11 |
| PATCH v2: daftar tulis | 3 tulis | advisory + revisi + M14-M17 + M06 rev2 + updateMany; tanpa update/delete revisi lama | D-183, D-196, D-202 |
| 400/404/403 tanpa tulis | `dbWrites()=[]` | tulis data `[]` (advisory xact lock bukan tulis data) | D-202 |
| balapan updateMany count 0 | revisi tidak dibuat | 409 dilempar di dalam `$transaction` (rollback nyata = SR-49) | D-196 (urutan commit v2) |
| PPN 10 % PATCH | 422, tanpa transaksi | 422, tanpa tulis data | D-90/IP-30; register §11.1 butir 9 |
| fixture registri (baru) | - | lapis B_KEY/K_KEY internal, E_KEY esensial | D-168 |

D-130, D-137, D-215: tidak ada ekspektasi suite api yang tersentuh. Bukti: `grep -lE "tokens|743|774|DATUM-25|IBM Plex|chart-smoke" tests/unit/studio/api/*.ts` hasilnya kosong. Uji usang itu milik SR-42.

## 4. Cakupan dan celah

- Handler: 19 handler diuji untuk 401, sama dengan S74. Uji perilaku baru mencakup R01 GET, R02 GET (v2), R01/R02 POST v2 (gerbang route), dan jalur PATCH v2 ujung ke ujung (replace, insertAfter, identik, 404, 409, 403, 422).
- Celah (dengan alasan):
  - Simpan v2 sukses oleh non-ADMIN (R01/R02 POST v2 201). Kasus ini membutuhkan paket `studio.template/v2` lengkap ditambah tulis slot, dan sudah menjadi lingkup SR-45 (R01/R02/R19 v2).
  - Render berlingkup lewat PATCH `render`. `renderScope` nyata ada di luar seam S74.
  - Rollback transaksi. Uji hanya mengunci bahwa galat dilempar di dalam transaksi. Rollback nyata diuji di SR-49/SR-53.
  - Cakupan baris tidak diukur karena repo tidak punya `@vitest/coverage-*`.

## 5. Cara menjalankan

```
npx vitest run tests/unit/studio/api/
npx vitest run tests/unit/studio/api/ --reporter=verbose
```

Sebelum SR-43 (2026-10-23, `npx vitest run tests/unit/studio/api`, exit 1, folder api-structure belum ada):

```
 Test Files  6 failed | 1 passed (7)
      Tests  77 failed | 229 passed (306)
```
Kelompok galat (reporter json): 23x `Cannot read properties of undefined (reading 'id')` (kerangka SR-06), 11x 500->201, 11x 500->422, 8x `FORBIDDEN` vs `PARAM_CLASS_K_FORBIDDEN`, 6x 500->200, 1x `toHaveLength(41)` mendapat 68, dan lainnya.

Sesudah SR-43 (`npx vitest run tests/unit/studio/api/`, exit 1, tiga run identik):

```
 Test Files  3 failed | 4 passed (7)
      Tests  8 failed | 380 passed (388)
   Duration  14.95s
```
Kegagalan sesudah: `revisions.test.ts:266` (x4), `ingest.test.ts:128` (x1), `artifacts.test.ts:104` (x3).

Gerbang tambahan:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `tests/unit/studio/api/`. tsconfig memuat `**/*.ts`.
- `npx eslint tests/unit/studio/api/`: 129 `no-explicit-any`. Polanya adalah tiruan argumen Prisma `({ data }: any)` yang sudah dipakai S74. eslint pada area uji tidak termasuk gerbang D-133 (D-133 hanya untuk area produksi).

## 6. Catatan CI

- `tests/unit/studio/fix1/` mengimpor `../api/_env`, `_prisma`, dan `_studio`. Perubahan helper diperiksa dengan cara berikut: helper asli direkonstruksi sementara, lalu fix1 dijalankan dengan helper asli dan dengan helper baru. Hasilnya 25 gagal / 13 lulus (asli) dan 14 gagal / 24 lulus (baru). `comm` atas daftar gagal menunjukkan 0 kegagalan baru. Sisa kegagalan fix1 adalah uji usang milik pemilik fix1, di luar area SR-43.
- Suite deterministik: tiga run berturut-turut menghasilkan 380/8.
- Filter folder wajib diakhiri garis miring (`tests/unit/studio/api/`). Tanpa garis miring, suite api-structure milik SR-45 ikut terjalankan.
- Log JSONL ditulis ke `%TEMP%\gsp-studio-s74-<pid>`. Saat ini ada 216 direktori seperti itu, dibuat oleh banyak run dari beberapa agen. SR-43 tidak menghapusnya karena pemiliknya tidak dapat dipisahkan. Direktori itu dapat dibersihkan setelah job CI.

## 7. Kegagalan dan pemetaan pemilik

### F-SR43-1 (MAYOR, keamanan: CAUTION, untuk user). Override kelas K pemanggil tak tepercaya diterapkan saat render HTML artefak inline (R09). Pemilik: SR-15 (`services/render/**`) bersama SR-12

- Uji: `artifacts.test.ts:104` (x3 user/google/agent). Kasusnya: `gateHtmlArtifact` mengembalikan `inlineDoc.overrides['naming.underscore.allowed'] = true`.
- Rantai kode:
  - Gerbang = ingest dryRun. Sejak SR-12, ingest membuang overrides v1 (KD-26), sehingga pemanggil menerima 201. Sebelumnya 403.
  - Namun `render/artifact.ts:342` mengembalikan `b.doc`. `b.doc` hanya membuang penanda benchmark/penegakan dan masih membawa `overrides`.
  - `artifact.ts:403` lalu memanggil `templateForDoc(baseTpl, inline)`, yang menjalankan `common.ts:142-153` `applyDocOverrides` tanpa cek hak kelas.
- Probe sesi ini (berkas debug sudah dihapus): untuk USER, `applyDocOverrides(gate.baseTpl, gate.inlineDoc)` menghasilkan `naming.underscore.allowed` sebelum `false`, sesudah `true`, issues `[]`.
- Spec juga tersimpan verbatim beserta overrides (`studioArtifact.create` data), sehingga render ulang membawa override yang sama.
- Ini melanggar KT-16 dan §7 butir 1 ("K oleh USER atau agent ditolak"), serta KD-26 (overrides v1 dibuang untuk pemanggil tak tepercaya).
- Arah perbaikan (untuk pemilik): render memakai dokumen hasil kebijakan `ingest.inlineFormat`, atau gerbang mengupas `overrides` bagi pemanggil tak tepercaya.
- Status register: belum ada (dicek pada `findings_register.md` F-001..F-067).

### F-065 (sudah tercatat, bukan temuan baru). R06 PATCH dokumen v2 melewati gerbang by-construction. Pemilik: FIX-S / SR-14

- Uji: `revisions.test.ts:266` (x4 user/google/agent/admin). Masukan PPN 10 % pada tier TERBIT dengan templat kanonik menghasilkan 200, padahal seharusnya 422 DATUM-19.
- Kode: `services/revisions/index.ts:360` meneruskan dokumen v2 ke `patchAddressV2` SEBELUM gerbang jalur v1 (`:445` dst.). `revisions/v2/commit.ts:150-171` hanya memanggil `assertTemplateUsable` dan `validateStructure`.
- Akibatnya uji "ADMIN + templat terbatas + PPN -> 200" lulus secara hampa sampai F-065 tertutup.

### F-SR43-2 (MINOR, kontrak galat). Kiriman v1 tier NOTA yang membawa `front.controlSheet` -> 422 `SLOT_UNKNOWN`, padahal register EC06 meminta `SLOT_FORBIDDEN_FOR_TIER`. Pemilik: SR-12 (ingest meneruskan kerangka yang sudah tersaring tier) / SR-08

- Uji: `ingest.test.ts:128`.
- Kode: `compose/structure.ts:78` (`SLOT_UNKNOWN`) aktif lebih dulu karena kerangka implisit untuk NOTA tidak memuat slot itu. Cabang `:227` (`SLOT_FORBIDDEN_FOR_TIER`) tidak pernah tercapai.
- Kontrak: register 03 §11.2 EC06 `:813` ("isi untuk slot tidak aktif pada tier dokumen", details `slotKey`, `tier`, `activeTiers`).
- Catatan kompatibilitas: dokumen v1 NOTA yang membawa `front.controlSheet` dulu diterima, sekarang ditolak 422.

## 8. Rekomendasi

1. Controller menyajikan F-SR43-1 ke user sebagai temuan keamanan CAUTION (aturan brief 9), lalu merutekannya ke SR-15/SR-12. Setelah diperbaiki, `artifacts.test.ts` harus 25/25.
2. Penutupan F-065 (FIX-S) harus membuat `revisions.test.ts` 29/29. Saat itu uji ADMIN-terbatas tidak lagi lulus secara hampa.
3. F-SR43-2 dirutekan ke SR-12 (kode galat EC06) dan dicatat di findings register.
4. Pemilik fix1 memperbarui 14 uji fix1 yang usang. Helper `installMemoryStore`/`installStructureWrites` dapat dipakai ulang untuk itu.
5. Cakupan baris dapat diukur bila controller menyetujui dependensi `@vitest/coverage-v8`.

## Berkas yang ditulis SR-43

- `tests/unit/studio/api/_prisma.ts`, `_studio.ts`, `auth.test.ts`, `http-errors.test.ts`, `ingest.test.ts`, `artifacts.test.ts`, `revisions.test.ts`, `templates.test.ts`
- `docs/2026-10-22_doc_artifact_studio/test/12_rerun_s74.md` (laporan ini)
- `delegation_progress/file_claims.md` (tambah 2 baris klaim SR-43)

## 9. Lanjutan D-247 / D-261 (keputusan USER: build hanya lewat endpoint render)

Pemicu: pesan controller (D-247 butir 1, D-261) dan `file_requests.md:228`. R04 v1 tidak lagi merender. `render` di badan kiriman v2 dan PATCH ditolak 400 `SCHEMA_INVALID` dengan `checkId: RENDER_FIELD`.

Run sebelum lanjutan (`npx vitest run tests/unit/studio/api/`, sesudah FIX-S, exit 1):

```
 Test Files  1 failed | 6 passed (7)
      Tests  7 failed | 381 passed (388)
```
Ketujuh kegagalan ada di `ingest.test.ts`, dan semuanya akibat D-247:
- `:81` x4 (render dipanggil),
- `:142` (renderRefused),
- `:320` (503 PDF),
- `:335` (errors RENDER_FAILED).

Delapan kegagalan run pertama (§7) kini lulus:
- F-SR43-1: `artifacts.test.ts` 25/25.
- F-065: `revisions.test.ts` 29/29 sebelum uji baru.
- F-SR43-2: `ingest.test.ts:128` lulus (`SLOT_FORBIDDEN_FOR_TIER`).

Ketiganya ditutup oleh FIX-S (D-261), tanpa ekspektasi yang dilunakkan.

| Uji (berkas) | Lama | Baru | Dasar |
|---|---|---|---|
| R04 v1 sukses x4 (`ingest`) | render dipanggil `['DOCX']` | 201, `job: null`, `outputs: []`, `completeness {COMPLETE, fullRenderAllowed: true}`, tanpa `renderRefused`, render tidak dipanggil | D-247 (1), D-261 |
| dokumen minimal tanpa lembar kendali | `renderRefused DOCUMENT_INCOMPLETE` | 201, `completeness {INCOMPLETE, fullRenderAllowed: false}` (menyebut Lembar Kendali), `job: null`, tanpa `renderRefused`, render tidak dipanggil | D-247 menggantikan sebagian KD-27/D-131 |
| hanya PDF + mesin PDF tidak siap | 503 `PDF_ENGINE_UNAVAILABLE` | 201, `job: null`, `outputs: []`, `fullRenderAllowed: true`, render tidak dipanggil | D-247, `file_requests.md:228` ("tanpa 503 PDF/antrean") |
| mesin render melempar | 201 + errors `RENDER_FAILED` | 201, errors kosong, `job: null`, render tidak dipanggil | D-247 |
| BARU: R04 `studio.doc/v2` + `render` x4 identitas | - | 400 `SCHEMA_INVALID`, issue `checkId RENDER_FIELD` pointer `/render`, pesan memuat `/render`, tanpa tulis DB | D-247, D-261 |
| BARU: R06 PATCH + `render` (`revisions`) | - | 400 `SCHEMA_INVALID` `checkId RENDER_FIELD`, tanpa tulis data, tanpa render | D-261 (R06 tercantum) |

Run sesudah lanjutan (`npx vitest run tests/unit/studio/api/`, exit 0, dua run identik):

```
 Test Files  7 passed (7)
      Tests  393 passed (393)
   Duration  14.77s
```
Per berkas (reporter json): artifacts 25/0, auth 41/0, client-log 17/0, http-errors 166/0, ingest 63/0, revisions 30/0, templates 51/0. Gerbang tsc: `npx tsc --noEmit -p tsconfig.json` memberi 0 galat di `tests/unit/studio/api/`.

Pembaruan rekomendasi §8:
- Butir 1-3 tertutup oleh FIX-S (D-261).
- F-SR43-2 tetap perlu dicatat di findings register sebagai DITUTUP (FIX-S).
- Butir 4 (14 uji usang fix1) dan butir 5 (provider cakupan) tetap berlaku.

## 10. Lanjutan D-275: `tests/unit/studio/fix1/**` (area diperluas, klaim `file_claims.md`)

Pemicu: pesan controller (D-275). Sejak D-247, fix1 berisi 14 uji usang untuk render dan PATCH. Bagian ini juga memeriksa D-255 (kuota/429) bila relevan. fix1 mengimpor helper `../api/_env`, `_prisma`, dan `_studio` (lihat §6).

Run sebelum (`npx vitest run tests/unit/studio/fix1/`, exit 1): `Tests  14 failed | 24 passed (38)`.

| Uji (`fix1.test.ts`) | Lama | Baru | Dasar |
|---|---|---|---|
| fixture `installPersist` | revisi tiruan tanpa baris | `installStructureWrites` (revisi + M14-M18 di transaksi) | D-183, D-210 |
| fixture `setupDoc` (R06/R07) | snapshot dryRun dirakit tangan | ingest nyata (persist) ke `installMemoryStore`, lalu `clearDbCalls` | D-196, D-210 |
| M-03 N+1 POST -> 429 | gagal 404 (fixture) | tetap 429 `RATE_LIMITED` (lulus dengan fixture baru) | D-134 M-03 (laju R04 tetap ada) |
| FIX-8 antrean penuh pada R04 | 503 `RENDER_QUEUE_FULL` | 201, `job: null`, `outputs: []`, render tidak dipanggil; 503 tetap diuji di R07 dan gerbang render | D-247, D-261, `file_requests.md:228` |
| R-01 user/agent penanda + turunan verbatim | 422 D03 | sama (lulus dengan fixture v2; gerbang bersama FIX-S) | D-134 R-01, D-261 H1 |
| R-01 ADMIN snapshot `x` | `toEqual({benchmark:true})` | `toMatchObject({benchmark:true})` (ditambah `adaptReportV1`) | D-210 |
| R-01 USER snapshot `x` | `toEqual({catatan})` | `catatan` tetap; `benchmark`/`lintEnforcement` tidak ada | D-134 R-01, D-210 |
| R-02 override dokumen melepas DATUM-04 (ADMIN 200, USER 403) | PATCH | ingest dryRun ADMIN dan USER: override dibuang (REPORT `INLINE_FORMAT_STRIPPED`), DATUM-04 tetap menahan, `valid:false` | KD-26 `:119`, AD-09 `:1008`, D-179, D-210 |
| M-05 versi templat terbatas non-ADMIN x3 (route) | `TEMPLATE_RESTRICTED` | `FORBIDDEN` `V1_FLAT_ADMIN_ONLY`; ditambah uji layanan USER -> `FORBIDDEN TEMPLATE_RESTRICTED` | D-189/SR-61; D-134 M-05 |
| M-05 templat tidak terbatas, USER kelas B | route 201 (kunci internal) | layanan USER `doc.language` -> versi 2; route v1 USER -> 403 `V1_FLAT_ADMIN_ONLY` | D-189, lapis D-168 |
| R-09 render tak bertipe pada R04 | 201 + errors `RENDER_FAILED` | 201, `job: null`, render tidak dipanggil; `errorCodeOf(Error)` = `RENDER_FAILED`, `errorCodeOf(StudioEngineError)` = kodenya | D-247; D-134 R-09 |

D-255 (kuota aset 429, perbandingan rahasia waktu-konstan): tidak ada uji fix1 yang bergantung pada keduanya. Uji `secretEquals` masih lulus.

Run sesudah (`npx vitest run tests/unit/studio/fix1 tests/unit/studio/api/`, exit 1, dua run identik):

```
 Test Files  1 failed | 7 passed (8)
      Tests  1 failed | 432 passed (433)
   Duration  20.50s
```
Rincian: fix1 39/1 (40), api 393/0. Gerbang tambahan:
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di `tests/unit/studio/{api,fix1}/`.
- `npx eslint tests/unit/studio/fix1/`: 0 masalah.

### F-SR43-3 (MINOR, regresi details diagnostik). Isu `ASSET_TOO_LARGE` `pixel_limit` dari aset dokumen kehilangan `widthPx`/`heightPx`. Pemilik: SR-12 (`services/ingest/assets-v2.ts`)

- Uji: `fix1.test.ts:140`. Ekspektasi tetap sesuai FIX-1 S87 M-02 (D-134: "helper sama dengan artefak"), yaitu `{ keyword: 'assetTooLarge', reason: 'pixel_limit', widthPx: 30000, heightPx: 30000 }`.
- Kode:
  - `decodeImageDetailed` masih memberi `widthPx`/`heightPx` (`services/images/decode.ts:108-115`).
  - Jalur v1 lama meneruskannya (`ingest/assets.ts:75-82`).
  - Jalur v2 hanya menyalin `reason` (`ingest/assets-v2.ts:90-104`).
- Tidak ada keputusan yang membuang kedua medan ini. D-143/IP-43d hanya membuang `actual` dari galat integritas fon.
- Status 413 dan kodenya benar. Hanya details diagnostik yang hilang.
- Status register: belum ada (`findings_register.md`, grep `widthPx|pixel_limit|assets-v2` kosong).
