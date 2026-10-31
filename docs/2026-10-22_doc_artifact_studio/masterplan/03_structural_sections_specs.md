---
type: requirements
confidence: medium-high
task_id: doc_artifact_studio
step: SR-01
agent: data-analyst
date: 2026-10-23
status: complete
amended: 2026-10-30 DC-32 (data-analyst); rujukan register masterplan/05_document_contract_specs.md, §19; D-361..D-381. 2026-10-31 DOC-FIX-B (document-specialist; review DC-42 F-01/F-02, review kode DC-40 L1/L2; D-383, D-385, D-387, D-388, D-395, D-403)
binding: D-06, D-21, D-98, D-127, D-128, D-131, D-133, D-134, D-138, D-139, D-140, D-141; blueprint identification/05 §0-§2 dan §4; dua pesan controller 2026-10-23 (pembuatan dokumen baru; ukuran kertas)
inputs: identification/05_structural_sections_blueprint.md, masterplan/01_specs.md, decisions/decisions.md, prisma/schema.prisma, src/lib/studio/contract/**, src/lib/studio/params/{render,page,color-type,governance-language,apparatus}.ts, src/lib/studio/services/render/pure/**, src/lib/studio/registry/{sections,lint}.ts, benchmark/manual000/doc.json, benchmark/manual000/figures/specs/*.chart.json
---

# 03 Spesifikasi Refaktor Struktur: Dokumen Terstruktur per Section (SR-01)

Dokumen ini adalah **register nama tunggal** untuk semua baris SR/IP/RQ di blueprint adendum 05. Baris B1/B2 merujuk nama di sini dan tidak membuat nama baru tanpa `file_requests.md`.

Amandemen DOC-5 (DC-32, D-363): nama fase document contract (baris DC-03..DC-48 blueprint `identification/07_document_contract_blueprint.md`) didefinisikan **sekali** di register `masterplan/05_document_contract_specs.md` (prefiks lanjutan di 05 §0.2). Register ini hanya merujuknya: entri ringkas di tempat yang terdampak (§0.1, §4.3, §4.6, §5.1, §6.2, §11.1, §11.2, §12, §16, §17.3, §18) dan indeks rujukan di §19. Isi 05 tidak disalin. Bila 03, 05, dan kode berbeda untuk nama 05, yang berlaku adalah kode dan keputusan D-xxx, lalu register 05; ketidakcocokan dicatat di §19.3.

## 0. Aturan baca dan sumber

### 0.1 Aturan register

- Setiap nama kode baru **didefinisikan tepat satu kali**, di baris tabel register yang berawalan ID. Di tempat lain nama hanya dirujuk.
- Tipe pembantu yang muncul di tanda tangan I44-I52 tetapi tidak berID di sini (`StructureRows`, `ComposeInput`, `MergeResult`, `CompletenessInput`, `ParamChange`, `ResolvedTarget`, `PatchPidResult`, `StructureResult`, `PidHistoryEntry`, `RenderScopeResult`, `StudioAssetRow`, `StructureInput`) adalah tipe internal modul pemilik, tidak diekspor dari kontrak.
- Contoh E1-E3 blueprint memakai sha terpotong (`sha256:9c1e0b7d…`); fixture ajv SR-04 wajib memakai 64 heksa penuh (C27).
- Prefiks ID dalam dokumen ini (tidak bentrok dengan 01_specs):

| Prefiks | Isi | Rentang |
|---|---|---|
| `PT-` | Uji penerimaan prinsip §0 | PT-01..PT-09 |
| `KD-` | Keputusan desain (lanjutan 01_specs KD-01..KD-06) | KD-07..KD-28 |
| `M` | Model Prisma baru | M10..M18 |
| `MX` | Kolom/relasi tambahan pada model lama | MX01..MX07 |
| `E` | Enum (lanjutan E01..E25) | E26..E43 |
| `SID` | Id skema kontrak | SID01..SID06 |
| `T2-` | Tipe TypeScript kontrak v2 | T2-01..T2-60, T2-60a..T2-60c |
| `DF-` | Medan tampilan terlarang (DISPLAY_FIELD) | DF-01..DF-71 (DF-72, DF-73: register 05 §5.5) |
| `VF-` | Medan v1 berganti nama (V1_FIELD) | VF-01..VF-14 |
| `SL-` | Slot kerangka bawaan | SL-01..SL-07 (SL-08..SL-10 templat `laporan-kerja-agen`: register 05 §6.3) |
| `EC` | Kode galat baru | EC01..EC24 (EC25..EC28: register 05 §13.1; rujukan §11.2) |
| `R` | Route (R01..R11 lama, R12..R20 baru; R21..R23 register 05 §9) | R01..R20 (+ R21..R23 dirujuk di §12) |
| `R-` | ParamDef kontrak baru (lanjutan R-01..R-37) | R-38..R-52 |
| `PC-` | Perubahan ParamDef lama | PC-01..PC-07 |
| `DV-` | DeriveFnId baru | DV-01..DV-04 |
| `LD-` | LintDef baru | LD-01..LD-04 |
| `C` | Konstanta (lanjutan C01..C17) | C18..C33, C32a, C33a..C33c |
| `I` | Antarmuka modul (lanjutan I01..I43) | I44..I53 |
| `AD-` | Baris adaptor v1→v2 tingkat atas | AD-01..AD-16 |
| `RK-` | Risiko | RK-01..RK-17 |
| `KC-` | Butir keputusan controller (lanjutan KC-1..KC-5) | KC-6..KC-11 |
| `AC-` | Kriteria penerimaan spesifikasi | AC-1..AC-10 |

- Path singkat: `<task>` = `docs/2026-10-22_doc_artifact_studio`, `L` = `src/lib/studio`, `API` = `src/app/api/studio`.
- Penanda bukti: `file:baris`. Klaim tanpa sumber diberi label **hipotesis**.

### 0.2 Sumber yang dibaca

| Sumber | Dipakai untuk | Bukti |
|---|---|---|
| Blueprint 05 §0-§2, §4, baris SR-01..SR-61 | lingkup, nama usulan, kriteria SC-1..SC-14 | `identification/05_structural_sections_blueprint.md:18-695, 711-800, 979-996` |
| D-127, D-128, D-131, D-138, D-139, D-140, D-141 | aturan pengguna yang mengikat | `decisions/decisions.md:132,133,136,143,144,145,146` |
| D-06, D-21, D-98, D-133, D-134 | revisi berversi, prosedur migrasi, gerbang kepercayaan, uji ditahan, FIX-1 | `decisions/decisions.md:157,26,103,138,139` |
| Model Studio dan gaya SQL Prisma | delta M10-M18, nama indeks/FK | `prisma/schema.prisma:610-926`; `prisma/migrations/20261022120000_add_studio/migration.sql:79,81,273,318` |
| Medan tingkat atas v1 | tabel adaptor | `L/contract/schema/doc.schema.ts:111-133` (13 properti dokumen), `:140-151` (3 properti permintaan); `L/contract/types/doc.ts:13-39` |
| Kode galat yang ada | 44 kode, peta HTTP | `L/contract/enums.ts:253-304`; `L/contract/errors.ts:18-67` |
| Alamat | perluasan `F:<slotKey>` | `L/contract/address.ts:20,39` |
| Snapshot v1 | dasar norm/v2 | `L/contract/types/model.ts:7-36` |
| Konstanta route dan skema | perluasan C16, C17 | `L/contract/env.ts:55-88` |
| Parameter render R-01..R-37 | penomoran R-38+ | `L/params/render.ts:14-37, 86-107, 219-257` |
| Grid dan ukuran halaman | rantai ukuran kertas | `L/params/page.ts:60-130`; `L/registry/lint.ts:161-173` (G2 128/166) |
| Orkestrator tanpa DB IP-43a | antarmuka SR-15/SR-33 | `L/services/render/pure/index.ts:8-17`; `pure/render.ts:61-93, 160` |
| `paramsSha256` | penjaga migrasi templat | `L/services/templates/profile.ts:584` |
| Peran paragraf retoris dipakai lint | KD-16 | Grep `"(identity\|anchor\|pivot\|closingAction)"` di `L/engine`: `lint/structure/checks-d.ts`, `lint/language/prose.ts`, `docx/blocks/text.ts`, `docx/wrapper/render.ts` |
| Komposit galeri benchmark | R-50, R-51 | `benchmark/manual000/figures/specs/bm-fig-17..21.chart.json:11-15` (`style gallery`, `columns 3`, `gapMm 4.3`); `L/engine/chart/core/composite.ts:29,64-65` |
| Halaman depan benchmark | KD-18, KD-19 | `benchmark/manual000/doc.json:22-238` (cover `kicker`, `control`, `colophon`, `identityString`; tabel riwayat 5 kolom ber-`widthTw`) |
| Batas piksel | dipakai ulang, bukan nama baru | `L/services/images/decode.ts:14,16` (`IMAGE_MAX_SIDE_PX`, `IMAGE_MAX_PIXELS`) |
| Register 05 dan kode kontrak (DC-32, 2026-10-30) | rujukan §19; hitungan 73 / 73 / 14 | `masterplan/05_document_contract_specs.md` §5.4-§5.7, §6.1-§6.3, §9, §10, §12, §13, §14.3; `L/contract/enums.ts:263-349, 436-452, 503`; `L/contract/errors.ts:96-99`; `L/contract/schema/v2/forbidden.ts:21-73, 96-141`; `L/registry/sections.ts:471-483, 666, 669`; `L/registry/slots.ts:29-40, 94`; `L/contract/env.ts:79-81, 172-183`; `decisions/decisions.md:366-386` (D-361..D-381) |

Kelengkapan data: cukup untuk spesifikasi. Dua hal tidak dapat diverifikasi dengan alat agen ini dan diberi label hipotesis: perilaku `ON DELETE RESTRICT` pada cascade bertemu (KD-07) dan nilai F4 (E38). Keduanya punya langkah verifikasi.

## 1. Prinsip §0 sebagai uji penerimaan

Setiap keputusan di dokumen ini diuji terhadap prinsip §0 (D-139, D-140). Uji di bawah wajib lulus di fase akhir (SR-44, SR-55, SR-58).

| ID | Prinsip | Uji (terukur) | Pemilik bukti |
|---|---|---|---|
| PT-01 | (a) Konten murni | Untuk setiap nama di DF-01..DF-71, sisipkan medan itu di lokasi yang disebut ke E1. Hasil: 400 `SCHEMA_INVALID` dengan issue `checkId: "DISPLAY_FIELD"` untuk 100% kasus | SR-44 |
| PT-02 | (a) | Pindai statis objek skema SID01, SID02, SID03 (rekursif): 0 properti bernama salah satu DF global (§5.1) | SR-04, SR-55 |
| PT-03 | (b) Penomoran milik mesin | Kiriman E1, E2 tidak memuat label, nomor, atau ukuran. Keluaran memuat `Gambar 3.1` di alamat `3.2.3` dan `Tabel 2.1` di `2.1.2` | SR-08, SR-15 |
| PT-04 | (c) Empat kata kerja | Route yang dipakai agen ⊆ {kirim: R04 POST, R12, R13, R18 POST; baca: R04 GET, R05, R06 GET, R15, R16 GET, R20; sunting: R06 PATCH, R14 PATCH, R16 PATCH; render: R17}. Setiap respons 2xx route itu memuat `completeness` (kecuali R18) | SR-45 |
| PT-05 | (c) Dapat diteruskan | Setiap 4xx membawa `{error, code, details}`; `error` berbahasa Indonesia. `DOCUMENT_INCOMPLETE` dan kelengkapan INCOMPLETE memuat `forwardToController` yang menyebut nomor dokumen, revisi, label slot hilang, kunci bab hilang, dan endpoint berikutnya | SR-45 |
| PT-06 | (d) Agen tidak memahami format | Skema SID01-SID03 memiliki 0 properti `params`, `overrides`, `essentials`, `advanced`, `roleFormats`; 0 nama properti berpola kunci parameter `^[a-z]+(\.[a-zA-Z0-9]+)+$` | SR-55 |
| PT-07 | (e) Permukaan ringkas | Esensial total ≤ 60, ≤ 8 per jenis slot dan ≤ 8 global (R03 `kind=essentials`); GET R02 oleh USER tanpa `?expert=1` hanya memuat `preset` + `essentials` | SR-59, SR-45 |
| PT-08 | (a) | E0, E1, E2, E3 (permintaan), contoh panduan SR-35, dan `doc.v2.json` lolos ajv SID01-SID03 dan memuat 0 medan DF/VF | SR-04, SR-32, SR-35 |
| PT-09 | (b) Satu sumber ukuran halaman | Grep `11906\|16838\|A4_PORTRAIT_TW\|A4_MM` di `L/engine/**` dan `L/params/render.ts` = 0 kemunculan sebagai nilai fallback; DOCX `w:pgSz`, HTML `@page`, dan grid membaca nilai turunan `page.sizeMm` (PC-01) | SR-16, SR-17, SR-60 |

## 2. Keputusan desain (tier 1)

Format: keputusan, alternatif yang ditolak, alasan dan bukti.

| ID | Keputusan | Alternatif ditolak | Alasan dan bukti |
|---|---|---|---|
| KD-07 | Relasi M15/M16/M17 → M18 memakai `onDelete: NoAction` (bukan Restrict seperti tulisan blueprint) | Restrict | Penghapusan `StudioDocument` (DB uji, SR-49/SR-53) meng-cascade ke revisi lalu ke M15-M17 **dan** ke M18 dalam satu pernyataan. `RESTRICT` dicek seketika, `NO ACTION` dicek di akhir pernyataan. **Hipotesis** (perilaku PostgreSQL, tidak dapat dijalankan di sesi ini): Restrict dapat gagal tergantung urutan cascade. Verifikasi: SR-53 menghapus satu dokumen uji berbaris M14-M18 di `_uji` |
| KD-08 | Slot yang dihapus lewat `structure` (OMITTED) = tidak ada baris M14 untuk slot aktif itu | Kolom `omitted` baru | M14 di blueprint tidak punya kolom itu (`05:156`); ketiadaan baris cukup dan tidak menambah kolom di luar yang dikunci |
| KD-09 | Payload slot tak-berulang disimpan di `M14.payload`, ditambah baris M17 untuk alamat (§4.6). Payload slot berulang = `RepeatableSlotMetaV2` (`outline`, `parts`) atau null | Semua slot hanya di M17 | Payload slot bukan blok; alamat `F:references/1` (E1, `05:383`) butuh baris M17 per entri |
| KD-10 | `StudioRevision.schemaId` = id skema **permintaan asal** (`studio.doc/v1` untuk kiriman yang diadaptasi). Jalur render ditentukan `snapshot.schema` (`studio.norm/v1` atau `studio.norm/v2`) | schemaId = skema snapshot | Asal kiriman tetap terlacak (REPORT `SCHEMA_V1_ADAPTED`); snapshot menentukan mesin |
| KD-11 | Dokumen mematok versi templat lewat `templateVersionId` revisi terbaru. Revisi berikutnya menyalin patokan itu. Patokan hanya berubah lewat op struktur `templateVersion`. Tidak ada salinan parameter ke dokumen | Kolom patokan baru di M04; salinan nilai | Kolom `StudioRevision.templateVersionId` sudah ada (`schema.prisma:793`); versi templat tak dapat diubah (D-62), jadi patokan versi = salinan beku efektif (pesan controller butir 1) |
| KD-12 | Kiriman v1 lewat R04 membuat dokumen dengan `missionDocKey = null` | `missionDocKey` = slug templat | Perilaku v1 = setiap POST membuat dokumen baru. Unik `(missionFolder, missionDocKey)` akan menolak dokumen v1 kedua di misi yang sama. NULL tidak bentrok di unik PostgreSQL |
| KD-13 | Sha lingkup (bab, section, blok, payload slot) dihitung **tanpa** medan `id` (`stripIds`) | Termasuk id | Kiriman ulang identik dengan atau tanpa pid dari R20 harus `unchanged` (§2.5 blueprint) |
| KD-14 | Semua kontrak v2 memakai `$schema` (termasuk `studio.template/v2`, `studio.skeleton/v1`). Snapshot norm tetap memakai `schema` | `schema` di template v2 (tulisan blueprint `05:288`) | Konsisten dengan `studio.doc/v1` (`doc.schema.ts:112`); norm/v1 memakai `schema` (`model.ts:8`) |
| KD-15 | Kemajuan bab di kelengkapan = `chapters: Record<slotKey, ChapterProgressV2>` | Medan tetap `content` (contoh E2/E3) | Templat bisa punya dua slot berulang (`content`, `appendices`) dan nama slot bebas. Contoh E0 di §7.3 memakai bentuk ini |
| KD-16 | Peran paragraf v2 = `body`, `lede`, `note`, `subheading` **ditambah** `identity`, `anchor`, `pivot`, `closingAction` | Hanya 4 peran (tulisan blueprint `05:328`) | Keempat peran retoris adalah makna, bukan tampilan, dan dibaca lint struktur/bahasa (`engine/lint/structure/checks-d.ts`, `engine/lint/language/prose.ts`). Membuangnya mematikan cek lint. Peran halaman depan (`kicker`, `pageTitle`, `blockHeading`, `addressLine`, `title`, `standfirst`, `scopeLine`, `methodStatement`) dilarang di blok (DF-61) |
| KD-17 | Penekanan chart = `highlight` (daftar label/nama/indeks; kategori + tepat satu seri = satu titik dalam seri, D-136; aturan lengkap di catatan chart §4.3); `accent` di data dilarang (VF-12). Tata letak komposit dari parameter R-50/R-51; gaya komposit selalu `gallery` | `accent` di data; `columns`/`gapMm` di kiriman | §0 (a). Mesin sudah memaksa komposit bergaya galeri (`composite.ts:133,161`); benchmark 5 komposit seragam 3 kolom/4,3 mm (dipin preset Manual 000) |
| KD-18 | Sampul v2 menerima isi opsional `tagline`, `control`, `colophon`, `identityString`; bila absen, mesin membangkitkannya dari `meta` + parameter (mode MIXED) | Hanya dibangkitkan mesin | Benchmark memuat teks itu sebagai unit teks (`doc.json:26-218`); 4.544 unit harus identik (D-26, SR-32). Isi ini adalah teks, bukan tampilan |
| KD-19 | Daftar lembar kendali (`revisionHistory`, `verificationChain`, `distribution`) menerima baris bertipe **atau** `TableV2` konten-saja | Hanya baris bertipe | Benchmark punya tabel riwayat 5 kolom dengan kepala sendiri (`doc.json:238-300`); baris bertipe 4 medan akan kehilangan sel |
| KD-20 | Penjaga migrasi templat = sha256 proyeksi `resolvedParams` baru **pada himpunan kunci versi lama** sama dengan `paramsSha256` lama; kunci baru R-38..R-52 bernilai default/turunan | `paramsSha256` penuh sama | `paramsSha256 = sha256(stableStringify(resolvedParams))` (`profile.ts:584`). Setiap kunci baru mengubah hash penuh, jadi penjaga penuh mustahil lulus |
| KD-21 | `essentials` dan `advanced` di kontrak templat dikunci per **kunci parameter rinci**. Kenop (EssentialKnobDef) hanya mengelompokkan kunci untuk UI dan boleh mencakup lebih dari satu kunci | Dikunci per id kenop | Penyimpanan tetap `overrides` datar (D-62, tanpa tabel nilai baru, AS-7); kenop "Ukuran kertas" mencakup `page.size` + `page.orientation` |
| KD-22 | Pembangkit pid lewat antarmuka `PidAllocator` (T2-55): acak kriptografis di layanan DB; deterministik (benih) di jalur murni CLI/uji | Selalu acak | Render CLI harus byte-identik antar-run (paritas, SR-33) |
| KD-23 | R06 (PATCH per alamat) memetakan alamat di revisi `baseRevisionNo` ke pid, lalu menjalankan op per pid dengan cek lingkup pid (`SCOPE_CONFLICT`). `REVISION_CONFLICT` tetap di enum, tetapi tidak lagi dikirim R06 setelah SR-14 | Cek revisi global | D-131 butir 4 (sunting paralel lingkup berbeda tidak 409) |
| KD-24 | `ASSET_NOT_FOUND` = 422 (rujukan aset di kiriman). GET R18 untuk sha tak dikenal = 404 `FILE_NOT_FOUND` | 422/404 untuk satu kode | `STUDIO_ERROR_HTTP` memetakan satu status per kode (`errors.ts:18`) |
| KD-25 | Ukuran halaman satu sumber: `page.size` + `page.orientation` (+ `page.customSizeMm` lanjutan) → `page.sizeMm` (kelas T) → twip `round(mm × 1440 / 25,4)` untuk DOCX, mm untuk HTML `@page` dan grid. Tidak ada fallback A4 di mesin | `pageSizeTw` di `render.section.*` | Pesan controller "paper size". Fallback A4 terbaca di `params/render.ts:12,91,102` (sesi ini); lokasi lain dilaporkan controller: `engine/docx/package/section.ts:25,74,89,108`, `engine/docx/wrapper/render.ts:407-408`, `engine/tokens/grid.ts:143` |
| KD-26 | `overrides` dan semua medan tampilan v1 tunduk pada `ingest.inlineFormat` (R-38): `strip` membuang + REPORT, `reject` 422, `allow` (hanya ADMIN/harness) membuat snapshot internal = dokumen v1 asli apa adanya | `overrides` tetap diterapkan untuk v1 | §0 (a)(e): agen tidak pernah mengirim parameter; D-138 |
| KD-27 | DIGANTIKAN D-247 (keputusan user): kiriman dan sunting (R04, R06, R12, R13, R14, R16) tidak pernah merender; medan `render` di badannya = 400 `SCHEMA_INVALID` `checkId: "RENDER_FIELD"` (pointer `/render`, pesan menunjuk `POST /api/studio/documents/{id}/render`). Respons kiriman memuat `completeness` (+ `fullRenderAllowed`), tanpa `job`/`outputs`/`renderRefused`. Build hanya R17 (dan render ulang R07); keduanya menjawab 409 `DOCUMENT_INCOMPLETE` untuk render penuh revisi INCOMPLETE. Teks asli: kiriman merender bila `render` diisi dan memuat `renderRefused` saat INCOMPLETE | 409 untuk kiriman | D-131 butir 1 (kiriman parsial selalu diterima) |
| KD-28 | Pembuatan eksplisit (R04 `studio.doc/v2` tanpa `sections`) dan implisit (kiriman bab/slot pertama ke target misi baru) menghasilkan revisi 1 dengan bentuk awal yang sama (§7) | Dua jalur berbeda | Pesan controller butir 3 |

## 3. Register data Prisma

### 3.1 Model baru (9)

Semua model: `id String @id @default(cuid())`. Urutan kolom = urutan tulis di schema.prisma. `onUpdate` semua relasi = `Cascade` (bawaan Prisma, sama dengan migrasi lama `migration.sql:318`).

| ID | Model | Kolom (nama: tipe, atribut) | Unik / indeks | Relasi (nama medan: model, fields → references, onDelete) |
|---|---|---|---|---|
| M10 | `StudioTemplateSlot` | `templateVersionId: String`; `slotKey: String` (pola C18); `sectionTypeKey: String`; `label: String`; `position: Int`; `required: Boolean @default(false)`; `positionLocked: Boolean @default(false)`; `repeatable: Boolean @default(false)`; `minItems: Int?`; `maxItems: Int?`; `contentMode: StudioSlotContentMode`; `tiers: StudioTier[]` (kosong = semua tier); `admits: String[]`; `configSha256: String`; `createdAt: DateTime @default(now())` | `@@unique([templateVersionId, slotKey])`, `@@unique([templateVersionId, position])`, `@@index([sectionTypeKey])` | `templateVersion: StudioTemplateVersion` (`templateVersionId` → `id`, Cascade); `sectionType: StudioSectionType` (`sectionTypeKey` → `key`, Restrict); `params: StudioTemplateSlotParam[]`; `roleFormats: StudioTemplateSlotRoleFormat[]`; `docSections: StudioDocSection[]` |
| M11 | `StudioTemplateSlotParam` | `slotId: String`; `paramKey: String`; `value: Json`; `paramClass: StudioParamClass` (B atau K; T ditolak layanan); `surface: String` (`essential` atau `advanced`, salinan saat tulis) | `@@unique([slotId, paramKey])`, `@@index([paramKey])` | `slot: StudioTemplateSlot` (`slotId` → `id`, Cascade) |
| M12 | `StudioTemplateSlotRoleFormat` | `slotId: String`; `roleKey: String` (E23 `RoleKey`); `format: Json` (`{para?, run?}` seperti roleFormats templat) | `@@unique([slotId, roleKey])` | `slot: StudioTemplateSlot` (`slotId` → `id`, Cascade) |
| M13 | `StudioAsset` | `sha256: String @unique`; `mime: String` (`image/png` atau `image/jpeg`); `bytes: Int`; `widthPx: Int`; `heightPx: Int`; `relPath: String @unique` (C33c); `missionFolder: String?`; `createdBy: String`; `createdAt: DateTime @default(now())` | `@@index([missionFolder])` | `blocks: StudioDocBlock[]` |
| M14 | `StudioDocSection` | `revisionId: String`; `templateSlotId: String?` (null = kerangka implisit); `slotKey: String`; `sectionTypeKey: String`; `position: Int` (posisi di dokumen, 1..n kontigu); `filled: Boolean`; `payload: Json?`; `payloadSha256: String`; `lastFilledBy: String?`; `lastFilledAt: DateTime?`; `lastFilledRevisionNo: Int?` | `@@unique([revisionId, slotKey])`, `@@unique([revisionId, position])`, `@@index([templateSlotId])` | `revision: StudioRevision` (`revisionId` → `id`, Cascade); `templateSlot: StudioTemplateSlot?` (`templateSlotId` → `id`, Restrict); `sectionType: StudioSectionType` (`sectionTypeKey` → `key`, Restrict); `chapters: StudioDocChapter[]`; `blocks: StudioDocBlock[]` |
| M15 | `StudioDocChapter` | `revisionId: String`; `docSectionId: String`; `identityId: String`; `chapterKey: String`; `position: Int` (urutan kunci dalam slot); `partKey: String?`; `title: Json` (`InlineV2`); `shortTitle: String?`; `contentSha256: String`; `lastFilledBy: String?`; `lastFilledAt: DateTime?`; `lastFilledRevisionNo: Int?` | `@@unique([revisionId, chapterKey])`, `@@unique([docSectionId, position])`, `@@index([revisionId, contentSha256])`, `@@index([identityId])` | `revision: StudioRevision` (Cascade); `docSection: StudioDocSection` (Cascade); `identity: StudioDocIdentity` (NoAction, KD-07); `subsections: StudioDocSubsection[]`; `blocks: StudioDocBlock[]` |
| M16 | `StudioDocSubsection` | `revisionId: String`; `chapterId: String`; `identityId: String`; `sectionNo: Int` (0 = intro bab); `title: Json?` (null untuk intro); `contentSha256: String` | `@@unique([chapterId, sectionNo])`, `@@index([identityId])` | `revision: StudioRevision` (Cascade); `chapter: StudioDocChapter` (Cascade); `identity: StudioDocIdentity` (NoAction); `blocks: StudioDocBlock[]` |
| M17 | `StudioDocBlock` | `revisionId: String`; `docSectionId: String`; `chapterId: String?`; `subsectionId: String?`; `identityId: String`; `pid: String`; `address: String?`; `artifactLabel: String?`; `ordinal: Int`; `paraNo: Int?`; `type: String`; `content: Json` (konten v2 apa adanya, tanpa `id`); `textPlain: String @db.Text`; `contentSha256: String`; `assetId: String?` | `@@unique([revisionId, ordinal])`, `@@unique([revisionId, pid])`, `@@unique([revisionId, address])`, `@@index([subsectionId, paraNo])`, `@@index([identityId])`, `@@index([revisionId, artifactLabel])`, `@@index([revisionId, type])`, `@@index([assetId])` | `revision: StudioRevision` (Cascade); `docSection: StudioDocSection` (Cascade); `chapter: StudioDocChapter?` (Cascade); `subsection: StudioDocSubsection?` (Cascade); `identity: StudioDocIdentity` (NoAction); `asset: StudioAsset?` (`assetId` → `id`, Restrict) |
| M18 | `StudioDocIdentity` | `documentId: String`; `pid: String` (pola C19); `kind: String` (E30); `createdRevisionNo: Int`; `retiredRevisionNo: Int?`; `createdBy: String`; `createdAt: DateTime @default(now())` | `@@unique([documentId, pid])`, `@@index([documentId, kind])` | `document: StudioDocument` (`documentId` → `id`, Cascade); `chapters: StudioDocChapter[]`; `subsections: StudioDocSubsection[]`; `blocks: StudioDocBlock[]` |

Invarian layanan (bukan DB):
- M14: `filled = true` hanya bila payload tak-berulang terisi, atau slot berulang punya ≥ 1 bab. `payloadSha256 = sha256Hex(stableStringify(stripIds(payload ?? null)))`.
- M15-M17: hanya untuk slot berulang (`chapter`, `appendix`) kecuali baris M17 slot tak-berulang (§4.6), yang `chapterId` dan `subsectionId`-nya null.
- M17: `address` tidak pernah null untuk baris v2 (tidak ada spacer/device di v2). Nullable hanya demi bentuk M06.
- Penyimpanan per revisi = salinan penuh M14-M17 (R6 blueprint). M18 per dokumen, tidak disalin.

### 3.2 Kolom dan relasi tambahan pada model lama

| ID | Model | Tambahan (nama: tipe, atribut) | Indeks/unik baru | Catatan |
|---|---|---|---|---|
| MX01 | `StudioTemplate` | `isPreset: Boolean @default(false)` | `@@index([isPreset])` | Preset gaya (AS-7). Hanya ADMIN membuat/mengubah |
| MX02 | `StudioTemplateVersion` | `skeletonSha256: String?`; relasi `slots: StudioTemplateSlot[]` | - | null = versi lama, kerangka implisit (§6.3) |
| MX03 | `StudioDocument` | `missionDocKey: String?`; `completeness: StudioCompleteness @default(COMPLETE)`; relasi `identities: StudioDocIdentity[]` | `@@unique([missionFolder, missionDocKey])` | `completeness` = cermin revisi terbaru |
| MX04 | `StudioRevision` | `schemaId: String @default("studio.doc/v1")`; `structureSha256: String?`; `completeness: StudioCompleteness @default(COMPLETE)`; `completenessReport: Json?`; `changeScope: String?`; relasi `docSections: StudioDocSection[]`, `docChapters: StudioDocChapter[]`, `docSubsections: StudioDocSubsection[]`, `docBlocks: StudioDocBlock[]` | - | Tata bahasa `changeScope` di §9.5 |
| MX05 | `StudioRenderJob` | `scopeKind: StudioRenderScopeKind @default(DOCUMENT)`; `scopeKey: String?` | - | `scopeKey` = kunci bab (CHAPTER), slotKey (SLOT), null (DOCUMENT) |
| MX06 | `StudioOutputFile` | `scopeKind: StudioRenderScopeKind @default(DOCUMENT)`; `scopeKey: String?`; `draft: Boolean @default(false)` | - | |
| MX07 | `StudioSectionType` | relasi `templateSlots: StudioTemplateSlot[]`, `docSections: StudioDocSection[]` | - | Tanpa SQL |

Jumlah kolom SQL baru pada tabel lama: 1 + 1 + 2 + 5 + 2 + 3 = **14**.

### 3.3 Enum Prisma baru (3)

| ID | Nama | Nilai | Cermin TS di `L/contract/enums.ts` |
|---|---|---|---|
| E26 | `StudioSlotContentMode` | `AUTO`, `INPUT`, `MIXED` | `STUDIO_SLOT_CONTENT_MODES` |
| E27 | `StudioRenderScopeKind` | `DOCUMENT`, `CHAPTER`, `SLOT` | `STUDIO_RENDER_SCOPE_KINDS` |
| E28 | `StudioCompleteness` | `INCOMPLETE`, `COMPLETE` | `STUDIO_COMPLETENESS_STATUSES` |

### 3.4 SQL migrasi yang diharapkan (`20261023200000_add_studio_structure`)

SR-03 menghasilkan berkas lewat prosedur D-21 (01_specs §2 langkah 1-12; baseline sebelum edit, shadow DB, diff dikurangi baseline). Teks di bawah adalah **bentuk yang diharapkan**, bukan untuk disalin; penjaga adalah hitungan.

Urutan pernyataan Prisma: CreateEnum, AlterTable, CreateTable, CreateIndex, AddForeignKey.

```sql
-- CreateEnum (3)
CREATE TYPE "StudioSlotContentMode" AS ENUM ('AUTO', 'INPUT', 'MIXED');
CREATE TYPE "StudioRenderScopeKind" AS ENUM ('DOCUMENT', 'CHAPTER', 'SLOT');
CREATE TYPE "StudioCompleteness" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- AlterTable (6 pernyataan, 14 ADD COLUMN)
ALTER TABLE "StudioDocument" ADD COLUMN "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE', ADD COLUMN "missionDocKey" TEXT;
ALTER TABLE "StudioOutputFile" ADD COLUMN "draft" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "scopeKey" TEXT, ADD COLUMN "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT';
ALTER TABLE "StudioRenderJob" ADD COLUMN "scopeKey" TEXT, ADD COLUMN "scopeKind" "StudioRenderScopeKind" NOT NULL DEFAULT 'DOCUMENT';
ALTER TABLE "StudioRevision" ADD COLUMN "changeScope" TEXT, ADD COLUMN "completeness" "StudioCompleteness" NOT NULL DEFAULT 'COMPLETE', ADD COLUMN "completenessReport" JSONB, ADD COLUMN "schemaId" TEXT NOT NULL DEFAULT 'studio.doc/v1', ADD COLUMN "structureSha256" TEXT;
ALTER TABLE "StudioTemplate" ADD COLUMN "isPreset" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudioTemplateVersion" ADD COLUMN "skeletonSha256" TEXT;

-- CreateTable (9)
CREATE TABLE "StudioTemplateSlot" ("id" TEXT NOT NULL, "templateVersionId" TEXT NOT NULL, "slotKey" TEXT NOT NULL, "sectionTypeKey" TEXT NOT NULL, "label" TEXT NOT NULL, "position" INTEGER NOT NULL, "required" BOOLEAN NOT NULL DEFAULT false, "positionLocked" BOOLEAN NOT NULL DEFAULT false, "repeatable" BOOLEAN NOT NULL DEFAULT false, "minItems" INTEGER, "maxItems" INTEGER, "contentMode" "StudioSlotContentMode" NOT NULL, "tiers" "StudioTier"[], "admits" TEXT[], "configSha256" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StudioTemplateSlot_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioTemplateSlotParam" ("id" TEXT NOT NULL, "slotId" TEXT NOT NULL, "paramKey" TEXT NOT NULL, "value" JSONB NOT NULL, "paramClass" "StudioParamClass" NOT NULL, "surface" TEXT NOT NULL, CONSTRAINT "StudioTemplateSlotParam_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioTemplateSlotRoleFormat" ("id" TEXT NOT NULL, "slotId" TEXT NOT NULL, "roleKey" TEXT NOT NULL, "format" JSONB NOT NULL, CONSTRAINT "StudioTemplateSlotRoleFormat_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioAsset" ("id" TEXT NOT NULL, "sha256" TEXT NOT NULL, "mime" TEXT NOT NULL, "bytes" INTEGER NOT NULL, "widthPx" INTEGER NOT NULL, "heightPx" INTEGER NOT NULL, "relPath" TEXT NOT NULL, "missionFolder" TEXT, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StudioAsset_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocSection" ("id" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "templateSlotId" TEXT, "slotKey" TEXT NOT NULL, "sectionTypeKey" TEXT NOT NULL, "position" INTEGER NOT NULL, "filled" BOOLEAN NOT NULL, "payload" JSONB, "payloadSha256" TEXT NOT NULL, "lastFilledBy" TEXT, "lastFilledAt" TIMESTAMP(3), "lastFilledRevisionNo" INTEGER, CONSTRAINT "StudioDocSection_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocChapter" ("id" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "docSectionId" TEXT NOT NULL, "identityId" TEXT NOT NULL, "chapterKey" TEXT NOT NULL, "position" INTEGER NOT NULL, "partKey" TEXT, "title" JSONB NOT NULL, "shortTitle" TEXT, "contentSha256" TEXT NOT NULL, "lastFilledBy" TEXT, "lastFilledAt" TIMESTAMP(3), "lastFilledRevisionNo" INTEGER, CONSTRAINT "StudioDocChapter_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocSubsection" ("id" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "chapterId" TEXT NOT NULL, "identityId" TEXT NOT NULL, "sectionNo" INTEGER NOT NULL, "title" JSONB, "contentSha256" TEXT NOT NULL, CONSTRAINT "StudioDocSubsection_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocBlock" ("id" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "docSectionId" TEXT NOT NULL, "chapterId" TEXT, "subsectionId" TEXT, "identityId" TEXT NOT NULL, "pid" TEXT NOT NULL, "address" TEXT, "artifactLabel" TEXT, "ordinal" INTEGER NOT NULL, "paraNo" INTEGER, "type" TEXT NOT NULL, "content" JSONB NOT NULL, "textPlain" TEXT NOT NULL, "contentSha256" TEXT NOT NULL, "assetId" TEXT, CONSTRAINT "StudioDocBlock_pkey" PRIMARY KEY ("id"));
CREATE TABLE "StudioDocIdentity" ("id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "pid" TEXT NOT NULL, "kind" TEXT NOT NULL, "createdRevisionNo" INTEGER NOT NULL, "retiredRevisionNo" INTEGER, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StudioDocIdentity_pkey" PRIMARY KEY ("id"));
```

Indeks yang diharapkan (30; `_key` = `CREATE UNIQUE INDEX`, `_idx` = `CREATE INDEX`):

| Tabel | Nama indeks |
|---|---|
| `StudioTemplate` (lama) | `StudioTemplate_isPreset_idx` |
| `StudioDocument` (lama) | `StudioDocument_missionFolder_missionDocKey_key` |
| M10 | `StudioTemplateSlot_templateVersionId_slotKey_key`, `StudioTemplateSlot_templateVersionId_position_key`, `StudioTemplateSlot_sectionTypeKey_idx` |
| M11 | `StudioTemplateSlotParam_slotId_paramKey_key`, `StudioTemplateSlotParam_paramKey_idx` |
| M12 | `StudioTemplateSlotRoleFormat_slotId_roleKey_key` |
| M13 | `StudioAsset_sha256_key`, `StudioAsset_relPath_key`, `StudioAsset_missionFolder_idx` |
| M14 | `StudioDocSection_revisionId_slotKey_key`, `StudioDocSection_revisionId_position_key`, `StudioDocSection_templateSlotId_idx` |
| M15 | `StudioDocChapter_revisionId_chapterKey_key`, `StudioDocChapter_docSectionId_position_key`, `StudioDocChapter_revisionId_contentSha256_idx`, `StudioDocChapter_identityId_idx` |
| M16 | `StudioDocSubsection_chapterId_sectionNo_key`, `StudioDocSubsection_identityId_idx` |
| M17 | `StudioDocBlock_revisionId_ordinal_key`, `StudioDocBlock_revisionId_pid_key`, `StudioDocBlock_revisionId_address_key`, `StudioDocBlock_subsectionId_paraNo_idx`, `StudioDocBlock_identityId_idx`, `StudioDocBlock_revisionId_artifactLabel_idx`, `StudioDocBlock_revisionId_type_idx`, `StudioDocBlock_assetId_idx` |
| M18 | `StudioDocIdentity_documentId_pid_key`, `StudioDocIdentity_documentId_kind_idx` |

Kunci asing yang diharapkan (20; semua `ON UPDATE CASCADE`):

| # | Nama FK | Ke | ON DELETE |
|---|---|---|---|
| 1 | `StudioTemplateSlot_templateVersionId_fkey` | `StudioTemplateVersion("id")` | CASCADE |
| 2 | `StudioTemplateSlot_sectionTypeKey_fkey` | `StudioSectionType("key")` | RESTRICT |
| 3 | `StudioTemplateSlotParam_slotId_fkey` | `StudioTemplateSlot("id")` | CASCADE |
| 4 | `StudioTemplateSlotRoleFormat_slotId_fkey` | `StudioTemplateSlot("id")` | CASCADE |
| 5 | `StudioDocSection_revisionId_fkey` | `StudioRevision("id")` | CASCADE |
| 6 | `StudioDocSection_templateSlotId_fkey` | `StudioTemplateSlot("id")` | RESTRICT |
| 7 | `StudioDocSection_sectionTypeKey_fkey` | `StudioSectionType("key")` | RESTRICT |
| 8 | `StudioDocChapter_revisionId_fkey` | `StudioRevision("id")` | CASCADE |
| 9 | `StudioDocChapter_docSectionId_fkey` | `StudioDocSection("id")` | CASCADE |
| 10 | `StudioDocChapter_identityId_fkey` | `StudioDocIdentity("id")` | NO ACTION |
| 11 | `StudioDocSubsection_revisionId_fkey` | `StudioRevision("id")` | CASCADE |
| 12 | `StudioDocSubsection_chapterId_fkey` | `StudioDocChapter("id")` | CASCADE |
| 13 | `StudioDocSubsection_identityId_fkey` | `StudioDocIdentity("id")` | NO ACTION |
| 14 | `StudioDocBlock_revisionId_fkey` | `StudioRevision("id")` | CASCADE |
| 15 | `StudioDocBlock_docSectionId_fkey` | `StudioDocSection("id")` | CASCADE |
| 16 | `StudioDocBlock_chapterId_fkey` | `StudioDocChapter("id")` | CASCADE |
| 17 | `StudioDocBlock_subsectionId_fkey` | `StudioDocSubsection("id")` | CASCADE |
| 18 | `StudioDocBlock_identityId_fkey` | `StudioDocIdentity("id")` | NO ACTION |
| 19 | `StudioDocBlock_assetId_fkey` | `StudioAsset("id")` | RESTRICT |
| 20 | `StudioDocIdentity_documentId_fkey` | `StudioDocument("id")` | CASCADE |

Penjaga isi `migration.sql` (SR-03; dihitung dengan Grep/`Select-String`, keluaran dikutip):

| Cek | Nilai lulus |
|---|---|
| `DROP` | 0 |
| `CREATE TABLE` | 9, semua nama berawalan `"Studio` |
| `CREATE TYPE` | 3, semua berawalan `"Studio` |
| `CREATE INDEX` + `CREATE UNIQUE INDEX` | 30, semua `ON "Studio…` |
| `ADD CONSTRAINT` | 20, semua `FOREIGN KEY`, tabel sumber dan sasaran berawalan `"Studio` |
| `ADD COLUMN` | 14, hanya pada 6 tabel `Studio*` lama di MX01-MX06 |
| Penyebutan `WorkerTrace`, `IlSearchDoc`, `Role`, `pg_trgm` | 0 |

### 3.5 Rollback SQL delta

Teks blueprint `05:187-210` dipakai apa adanya. Sejak DOC-2 (D-260, IP-69) teks ini juga tersimpan byte-identik sebagai `prisma/rollback/01_rollback_studio_structure_delta.sql` (sha256 `10549a93000c6d944f100c587cf16fd502eebbf46f09cf9f0eb2e49383f0294f`, = sha gladi SR-53) dan rollback Studio asli `01_specs` §1.4 sebagai `prisma/rollback/02_rollback_studio_base.sql` (sha256 `a28a7a15c12caaa156954f767f1249110ed4521f1bd24d44f159c98bed8fe8e1`); prosedur, cadangan data wajib, dan pemulihan: `docs/STUDIO-ROLLBACK-RUNBOOK.md`. Verifikasi SR-01: setiap objek yang disebut adalah objek delta §3.1-§3.4, dan tidak ada objek lain.

| Pernyataan rollback | Objek delta yang dicocokkan |
|---|---|
| 9 `DROP TABLE IF EXISTS` (urutan anak sebelum induk: M17, M16, M15, M14, M18, M13, M12, M11, M10) | M10-M18. Indeks dan FK tabel ini ikut terhapus |
| `StudioOutputFile` DROP COLUMN `scopeKind`, `scopeKey`, `draft` | MX06 (3) |
| `StudioRenderJob` DROP COLUMN `scopeKind`, `scopeKey` | MX05 (2) |
| `StudioRevision` DROP COLUMN `schemaId`, `structureSha256`, `completeness`, `completenessReport`, `changeScope` | MX04 (5) |
| `DROP INDEX "StudioDocument_missionFolder_missionDocKey_key"` lalu `StudioDocument` DROP COLUMN `missionDocKey`, `completeness` | MX03 (indeks + 2 kolom) |
| `StudioTemplateVersion` DROP COLUMN `skeletonSha256` | MX02 (1) |
| `DROP INDEX "StudioTemplate_isPreset_idx"` lalu `StudioTemplate` DROP COLUMN `isPreset` | MX01 (indeks + 1 kolom) |
| 3 `DROP TYPE IF EXISTS` (setelah kolom pemakainya hilang) | E26-E28 |
| `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261023200000_add_studio_structure'` | baris buku migrasi delta |

Hasil cocok: 9 tabel + 14 kolom + 2 indeks tabel lama + 3 tipe + 1 baris buku = semua objek delta, 0 objek lain. Tidak ada pernyataan yang menyebut M01-M09 sebagai tabel yang dihapus, `WorkerTrace`, atau tipe E01-E11. Rollback hanya digladikan di `_uji` (SR-53, `05:118`).

Cek sesudah rollback (SR-53): `SELECT count(*) FROM pg_tables WHERE tablename IN (<9 nama M10-M18>)` = 0; `SELECT count(*) FROM pg_type WHERE typname IN ('StudioSlotContentMode','StudioRenderScopeKind','StudioCompleteness')` = 0; kolom MX01-MX06 tidak ada di `information_schema.columns`; hitungan baris 9 tabel M01-M09 + 7 tabel lama sama sebelum dan sesudah.

## 4. Kontrak v2

### 4.1 Id skema

| ID | `$schema` / `schema` | Peran | `$id` | Berkas skema (SR-04) |
|---|---|---|---|---|
| SID01 | `studio.doc/v2` | Dokumen konten (R04 POST, R08) | `${STUDIO_SCHEMA_BASE_URL}/studio.doc/v2.json` | `L/contract/schema/v2/doc.schema.ts` |
| SID02 | `studio.chapter/v2` | Kiriman satu bab (R12, R08) | `…/studio.chapter/v2.json` | `L/contract/schema/v2/chapter.schema.ts` |
| SID03 | `studio.slot/v2` | Kiriman satu slot tak-berulang (R13, R08) | `…/studio.slot/v2.json` | `L/contract/schema/v2/slot.schema.ts` |
| SID04 | `studio.template/v2` | Isi versi templat (R01, R02; bukan untuk agen) | `…/studio.template/v2.json` | `L/contract/schema/v2/template.schema.ts` |
| SID05 | `studio.skeleton/v1` | Kerangka templat mandiri (R19) | `…/studio.skeleton/v1.json` | `L/contract/schema/v2/skeleton.schema.ts` |
| SID06 | `studio.norm/v2` | Snapshot ternormalisasi internal (kolom `StudioRevision.snapshot`; tidak dipublikasikan) | - | tipe saja, `L/contract/types/v2/norm.ts` |

`$defs` bersama v2: `${STUDIO_SCHEMA_BASE_URL}/common/v2.json` (C32), berkas `L/contract/schema/v2/common.schema.ts`. Tipe TS: `L/contract/types/v2/{common,doc,chapter,slot,template,norm,completeness,api}.ts`. Opsi ajv sama dengan v1 (01_specs §3.10). Semua objek `additionalProperties: false`.

`STUDIO_SCHEMA_IDS` (C17) diperluas dengan SID01-SID05 (5 → 10). SID06 tidak masuk C17 (sama seperti `studio.norm/v1`).

### 4.2 Bentuk bersama v2 (`types/v2/common.ts`)

| ID | Nama | Definisi |
|---|---|---|
| T2-01 | `RunV2` | `{ t: string; strong?: boolean; em?: boolean; code?: boolean; sup?: boolean; sub?: boolean }` (`sup` dan `sub` tidak boleh keduanya true) \| `{ tab: true }` \| `{ br: "line" }` |
| T2-02 | `InlineV2` | `{ text: string }` (md-lite KS-03) \| `{ runs: RunV2[] }` (oneOf) |
| T2-03 | `CaptionV2` | `= InlineV2` |
| T2-04 | `SourceV2` | `InlineV2 & { provenance?: ProvenanceMark[] }` |
| T2-05 | `RailLineV2` | `{ kind: "mark" \| "source" \| "note"; mark?: ProvenanceMark } & Partial<InlineV2>` |
| T2-06 | `AssetInputV2` | `{ assetRef: string /* C27 */ }` \| `{ mime: "image/png" \| "image/jpeg"; dataBase64: string }` |
| T2-07 | `DocMetaV2` | Semua medan `DocMeta` v1 (`types/doc.ts:47-68`) **opsional**, pola/enum sama: `title`, `docNumber`, `rev`, `typeCode`, `tier`, `classification`, `language`, `author`, `issueDate`, `custodian`, `audience`, `basis`, `subject`, `urgency`, `issueNumber`, `copyControl` |
| T2-08 | `DocTargetV2` | `{ documentId?: string; docNumber?: string; mission?: StudioMissionRef; docKey?: string /* C23 */ }`. Tepat satu cara: `documentId`, atau `docNumber`, atau `mission.folder` (+ `docKey` opsional). Selain itu 400 `DOC_TARGET_AMBIGUOUS` |
| T2-09 | `ChangeV2` | `{ what: string; why: string; impact: string }` (sama dengan `ChangeFields`, `types/api.ts:183`) |
| T2-10 | `RenderRequestV2` | `{ scope?: RenderScopeName /* E40 */; key?: string; formats?: Array<"docx" \| "pdf" \| "html">; figures?: Array<"svg" \| "png">; revisionNo?: number }` |
| T2-11 | `OutlineEntryV2` | `{ key: string; title?: InlineV2 }` |
| T2-12 | `PartV2` | `{ id: string /* ^P[1-9][0-9]?$ */; title: InlineV2; lede?: InlineV2 }`. Label "Bagian I" dibangkitkan mesin |

### 4.3 Blok v2 (`types/v2/doc.ts`)

Medan bersama setiap blok: `type`, `id?` (pid, C19). Tidak ada medan lain di luar tabel ini.

| ID | Tipe | `type` | Medan khusus |
|---|---|---|---|
| T2-13 | `ParagraphV2` | `paragraph` | `InlineV2`; `role?: ParagraphRoleV2` (E36, bawaan `body`); `rail?: RailLineV2[]` |
| T2-14 | `ListV2` | `list` | `ordered?: boolean` (bawaan false); `items: Array<InlineV2 & { rail?: RailLineV2[] }>` (min 1) |
| T2-15 | `AsideV2` | `aside` | `variant: "generic" \| "doctrine" \| "story" \| "quickCheck" \| "ifInDoubt"`; `label?: InlineV2` (bawaan dari varian); `body: InlineV2[]` |
| T2-16 | `MonoBlockV2` | `monoBlock` | `label: InlineV2`; `lines: InlineV2[]` |
| T2-17 | `AssumptionInlineV2` | `assumptionInline` | `InlineV2`; `asmId: string` (pola P5-63); `impact: string` |
| T2-18 | `TableV2` | 11 nilai `TABLE_BLOCK_TYPES` | `caption?: CaptionV2`; `columns: ColumnV2[]` (1..20); `rows: RowV2[]`; `source?: SourceV2`; `preset?: string` |
| T2-19 | `ColumnV2` | - | `{ role?: "text" \| "numeral" \| "id" \| "unit" \| "glyph"; unit?: string }` |
| T2-20 | `RowV2` | - | `{ kind?: "header" \| "body" \| "group" \| "total"; cells: CellV2[] }` |
| T2-21 | `CellV2` | - | Salah satu dari `text`, `runs`, `paragraphs: InlineV2[]`, atau tidak satu pun (sel kosong); plus `gridSpan?: int ≥ 1`; `vMerge?: "restart" \| "continue"`; `nested?: TableV2` (kedalaman 1); `nestedIndex?: int ≥ 0` |
| T2-22 | `DerivationV2` | `derivation` | `title: InlineV2`; `intro?: InlineV2`; `lines: Array<{ label: InlineV2; value?: InlineV2 \| { registerKey: string; dec?: 0\|1\|2\|3 }; mark?: ProvenanceMark }>`; `result?: { label: InlineV2; expr: string; registerKey: string; tol?: number }`; `verdict?: { label: InlineV2; registerKey: string; limit: number; direction?: "lessOrEqual" \| "greaterOrEqual" }`; `closing: InlineV2`. Label "Turunan D-C.n" dibangkitkan mesin |
| T2-23 | `ChartV2` | `chart` | `code: ChartCode \| "composite"`; tepat satu dari `data: ChartDataV2`, `panels: ChartPanelV2[]` (1..24, wajib bila `code = "composite"`; batas 24 sejak RQ-11/D-227, sebelumnya 12), `artifactId: string`; `highlight?: Array<string \| number>` (1..64 butir: label titik, nama seri, id simpul, kode petak, atau indeks 0-based; aturan sorotan di catatan chart di bawah tabel); `unit?: string`; `dec?: 0\|1\|2\|3`; `limit?: { value: number; label?: string }`; `note?: string`; `caption: CaptionV2`; `source: SourceV2`; `keyRow?: InlineV2` |
| T2-24 | `ChartDataV2` | - | Union `ChartData` v1 (`types/chart.ts`) dengan medan `accent` dihapus dari setiap varian; varian `steps` memakai `spec: DiagramSpecV2`. Medan DATA opsional tambahan (RQ-11, D-223/D-227): `categorical.points[].target?: number` (sasaran per baris dalam satuan data, mis. P-09); `xy.divider?: { x?: number; y?: number }` (garis bagi kuadran dalam satuan data, minimal satu sumbu, mis. P-13); `distribution.binEdges?: number[]` (2..201 tepi bin tempat data terkelompok, mis. S-01); `distribution.sectors?: integer` (4..72 sektor arah tempat data terkelompok, mis. S-08) |
| T2-25 | `ChartPanelV2` | - | `{ name: string; code: ChartCode; data: ChartDataV2; highlight?: Array<string \| number>; unit?: string; dec?: 0\|1\|2\|3; limit?: { value: number; label?: string }; caption?: string; axisNote?: string }`. `limit` = ambang panel (DATA, RQ-11/D-223), bentuk sama dengan `ChartV2.limit`; `highlight` mengikuti aturan yang sama dengan T2-23 |
| T2-26 | `DiagramV2` | `diagram` | Tepat satu dari `spec: DiagramSpecV2` atau `artifactId: string`; `caption: CaptionV2`; `source: SourceV2`; `keyRow?: InlineV2` |
| T2-27 | `DiagramSpecV2` | - | `StudioDiagramV1` (`01_specs §3.6`) tanpa `$schema`, `id`, `title`, `width_mm`, `apparatus`, `source`: tersisa `family`, `classification?`, `labels_verified?`, `sources?`, `nodes`, `edges?`, `zones?`, `legend?`, `notes?`, `per_row?` |
| T2-28 | `ImageV2` | `image` | `asset: string` (kunci `assets` kiriman, pola C26, atau rujukan langsung C27); `caption: CaptionV2`; `source: SourceV2`; `keyRow?: InlineV2` |
| T2-29 | `SymbolSheetV2` | `symbolSheet` | `dialect: SymbolDialect`; `caption: CaptionV2`; `source: SourceV2`; `keyRow?: InlineV2` |
| T2-30 | `BlockV2` | - | Union T2-13..T2-18, T2-22, T2-23, T2-26, T2-28, T2-29 (21 nilai `type`, diskriminator `type`) |
| T2-31 | `ChapterV2` | - | `{ key: string; id?: string; title: InlineV2; shortTitle?: string /* ≤ 80 */; partId?: string; intro?: BlockV2[]; sections: SectionV2[] }`. `key` wajib: C33a untuk slot `chapter`, C33b untuk slot `appendix` (selain itu 422 `CHAPTER_KEY_INVALID`) |
| T2-32 | `SectionV2` | - | `{ id?: string; title: InlineV2; blocks: BlockV2[] }` |

**Catatan chart (RQ-11, D-136/D-223/D-227).**

1. Aturan `highlight` (T2-23, T2-25): bentuk `categorical` dan `xy` menyorot butir yang labelnya cocok atau indeks 0-based; bentuk `series`: nama seri saja = seluruh seri, nama kategori saja = kategori itu, nama kategori + tepat satu nama seri = SATU titik di dalam seri itu (D-136); bentuk `distribution`: butir pertama; angka = indeks grup, kecuali S-08: angka SELALU indeks sektor 0-based (jumlah sektor = `sectors`, bawaan mesin 36 bila data tanpa `sectors`; compose meneruskan angka sebagai `accent.point`, mesin radial membacanya sebagai indeks sektor); bentuk lain: butir pertama (maks satu aksen, KD-17).
2. Padanan v1 untuk adaptor dan harness, bukan medan v2: `params.accentCategory` (P-14) → nama kategori di `highlight`; `params.accentSectorDeg` (S-08) → indeks sektor di `highlight` (sudut / (360 / `sectors`)); `accent {point, series}` (P-03) → `highlight: [kategori, seri]`. `accent` (atau, tanpa `accent`, `params.accentPoint`/`accentGroup`/`accentSeries`) adalah sumber sorotan utama dan selalu dipetakan; `accentCategory` dan `accentSectorDeg` hanya dipakai bila sumber utama itu tidak menghasilkan sorotan (`highlight` masih kosong).
3. Sengaja TIDAK diterima karena tampilan (domain sumbu, warna, label bawaan mesin): `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel`. Mesin menurunkan domain dari data, label arah S-08 dan label median S-01 dibangkitkan mesin; domain sumbu per jenis chart yang perlu dipatok = ParamDef templat `chart.kind.<KODE>.*` (D-215; P-13/P-14/S-01 ditambahkan FIX-A D-268, IP-59 ditutup). Validator menolaknya `400 SCHEMA_INVALID` dengan `checkId: "DISPLAY_FIELD"`, pointer menunjuk medan itu: DF-63 (`ChartV2`), DF-64 (`ChartPanelV2`), DF-65 (varian `ChartDataV2`) (§5.1, D-229/D-230). `widthClass` pada figur dan panel komposit juga DISPLAY_FIELD (DF-66..DF-70), demikian pula `max` di objek `limit` (DF-71). `params` di blok chart tetap DF-40 (`DISPLAY_FIELD`), `accent` di data tetap VF-12 (`V1_FIELD`).
4. Lebar figur (chart, diagram, image, symbolSheet) bukan medan konten: satu kelas lebar per JENIS figur di templat (`chart.widthClass`, `diagram.widthClass`, `image.widthClass`, `symbolSheet.widthClass`: `text` atau `full`), mm diturunkan `figureWidthFromClass` ke `<jenis>.widthMm` berlingkup dokumen; tidak ada pengecualian per figur (D-139, D-224/D-225).
5. Amandemen DOC-5 `chart.custom` (register 05 §12, KD-47, AM-03; D-368, D-374): `ChartV2.code` menerima `"custom"` dengan `form` (T2-66 `ChartCustomFormV2`: `mark`, `orientation`, `stacked`), hanya pada `ChartV2`, tidak pada `ChartPanelV2`. Kombinasi `form` × bentuk data `categorical`/`series`/`xy` dipetakan ke kode tergambar CU-01..CU-09 (C59; C60 = 9; I68); di luar tabel = 422 `CHART_CUSTOM_FORM_UNSUPPORTED` (EC28); salah susun `form` = 400 checkId `CHART_CUSTOM_FORM` (CH-05); rupa di `form` = `DISPLAY_FIELD` DF-73. CU-01 mempertahankan urutan data agen (D-368). `CHART_REGISTRY_COUNT` tetap 76. Kode: `L/contract/types/v2/doc.ts:181-183`, `L/registry/charts.ts:1449`.

Artefak tersimpan (`artifactId`) dirujuk lewat R09. Medan tampilan pada spec artefak (`widthMm`, `heightMm`, `style`, `params`, `apparatus`, `composite.columns`, `composite.gapMm`) **diabaikan** saat dirender di dalam dokumen v2; lebar dan gaya dari templat (§0 butir b).

### 4.4 Payload slot (`types/v2/slot.ts`)

Diskriminator `type` = `sectionType` slot. Slot berulang memakai T2-39/T2-40 di `studio.doc/v2` saja (bab tunggal lewat SID02).

| ID | Tipe | `type` | Medan | Mode yang menerima isi |
|---|---|---|---|---|
| T2-33 | `CoverPayloadV2` | `cover` | `tagline?: InlineV2`; `titleLines?: InlineV2[]` (1..4); `standfirst?: InlineV2`; `scopeLine?: InlineV2`; `addressLine?: InlineV2`; `control?: Array<[InlineV2, InlineV2, InlineV2, InlineV2]>`; `colophon?: { left: InlineV2; right: InlineV2 }`; `identityString?: InlineV2`. Medan absen dibangkitkan dari `meta` + parameter (KD-18) | INPUT, MIXED |
| T2-34 | `ControlSheetPayloadV2` | `controlSheet` | `title?: InlineV2`; `revisionHistory?: RevisionEntryV2[] \| TableV2`; `verificationChain?: VerificationEntryV2[] \| TableV2`; `methodStatement?: InlineV2`; `distribution?: DistributionEntryV2[] \| TableV2` | INPUT, MIXED |
| T2-35 | `RevisionEntryV2` | - | `{ rev: string; date: string /* YYYY-MM-DD */; what: string; by: string }` | - |
| T2-36 | `VerificationEntryV2` | - | `{ layer: string; role: string; name: string; date?: string }` | - |
| T2-37 | `DistributionEntryV2` | - | `{ copy: string; holder: string }` | - |
| T2-38 | `SignaturePayloadV2` | `signatureBlock` | `roles: Array<{ role: InlineV2; holder: InlineV2; date?: InlineV2 }>` (1..8) | INPUT, MIXED |
| T2-39 | `ContentSlotPayloadV2` | `chapter` | `outline?: OutlineEntryV2[]`; `parts?: PartV2[]`; `chapters?: ChapterV2[]` | INPUT |
| T2-40 | `AppendixSlotPayloadV2` | `appendix` | `outline?: OutlineEntryV2[]`; `chapters?: ChapterV2[]` | INPUT |
| T2-41 | `TocPayloadV2` | `toc` | `entries?: Array<{ level: "part" \| "chapter" \| "appendix"; label?: InlineV2; title: InlineV2; page: string }>` (hanya bila slot MIXED; pada AUTO setiap medan selain `type` = 422 `SLOT_INPUT_NOT_ACCEPTED`) | MIXED (entries) |
| T2-42 | `SourceRegisterPayloadV2` | `sourceRegister` | `entries: Array<{ id: string /* ^[A-Za-z0-9][A-Za-z0-9-]{0,31}$ */; citation: InlineV2; kind?: string /* ≤ 40 */; url?: string /* format uri */; accessed?: string /* YYYY-MM-DD */ }>` (1..500) | INPUT, MIXED |
| T2-43 | `RuleIndexPayloadV2` | `ruleIndex` | hanya `type` | AUTO |
| T2-44 | `SlotPayloadV2` | - | Union T2-33, T2-34, T2-38, T2-41, T2-42, T2-43 (slot tak-berulang) | - |
| T2-45 | `RepeatableSlotMetaV2` | - | `{ outline?: OutlineEntryV2[]; parts?: PartV2[] }` (isi `M14.payload` slot berulang, KD-09) | - |

### 4.5 Dokumen dan kiriman

| ID | Tipe | Bentuk |
|---|---|---|
| T2-46 | `StudioDocV2` (SID01) | `{ $schema: "studio.doc/v2"; agentId?: string /* ≤ 80 */; template: { slug: string; version?: number }; mission?: StudioMissionRef; docKey?: string; meta: DocMetaV2 /* title wajib */; structure?: { order: string[] }; sections?: { [slotKey: string]: SlotPayloadV2 \| ContentSlotPayloadV2 \| AppendixSlotPayloadV2 }; register?: Record<string, RegisterEntry>; assets?: Record<string, AssetInputV2>; x?: Record<string, unknown>; change?: ChangeV2 }`. `sections` absen = dokumen kosong berkerangka (§7). Amandemen DOC-2 (D-247, D-261): tanpa `render` (D-247; dikirim = 400 `RENDER_FIELD`). Ke dokumen yang ADA: `target: { documentId }` + `baseRevisionNo?` (D-232 SUB-1; dipisah route sebelum skema SID01, bukan medan skema) = upsert per slot dan per kunci bab dalam satu revisi `document;<lingkup…>`; `target.docNumber`/`mission`/`docKey` atau target + `mission.folder`/`docKey` = 400 `DOC_TARGET_AMBIGUOUS` |
| T2-47 | `StudioChapterV2` (SID02) | `{ $schema: "studio.chapter/v2"; agentId?: string; target: DocTargetV2; template?: { slug: string; version?: number }; meta?: DocMetaV2; slot?: string /* bawaan: slot berulang aktif pertama */; chapter: ChapterV2; register?: Record<string, RegisterEntry>; assets?: Record<string, AssetInputV2>; baseRevisionNo?: number; change?: ChangeV2 }`. Tanpa `render` (D-247) |
| T2-48 | `StudioSlotV2` (SID03) | `{ $schema: "studio.slot/v2"; agentId?: string; target: DocTargetV2; template?: { slug: string; version?: number }; meta?: DocMetaV2; slot: string; payload: SlotPayloadV2; register?: Record<string, RegisterEntry>; assets?: Record<string, AssetInputV2>; baseRevisionNo?: number; change?: ChangeV2 }`. Tanpa `render` (D-247) |
| T2-49 | `StudioDocV2Resolved` | Bentuk internal hasil gabung: `StudioDocV2` tanpa `agentId`, `change`, `render`; `template.version` terisi (patokan); `meta` = `DocMeta` lengkap (§7.2); setiap bab/section/blok punya `id`; `assets` hanya bentuk `{ assetRef }`. Disimpan di `NormDocSnapshotV2.source` dan dikembalikan R20 |

Aturan bentuk tambahan:
- `structure.order` = daftar slotKey aktif berurutan. Slot opsional aktif yang tidak disebut = OMITTED. Validasi di §11 (EC01-EC04).
- `x` hanya di tingkat dokumen SID01. Gerbang kepercayaan D-98/D-134 berlaku apa adanya (`x.benchmark`, `x.enforcement`, `x.lintEnforcement`).
- Register: kiriman bab/slot boleh membawa `register`. Penggabungan per kunci; kunci yang sama dengan nilai berbeda menimpa (penulis terakhir menang) dan tercatat `register:<kunci>` di `changeScope`. Risiko RK-07.

### 4.6 Snapshot `studio.norm/v2` (SID06, `types/v2/norm.ts`)

```ts
export interface NormSlotV2 {            // T2-50
  slotKey: string; sectionType: string; label: string;
  position: number;                     // posisi dokumen; 0 bila tidak aktif/OMITTED
  required: boolean; repeatable: boolean; contentMode: "AUTO" | "INPUT" | "MIXED";
  active: boolean; omitted: boolean; state: StudioSlotState /* E29 */;
}
export interface NormSkeletonV2 {        // T2-51
  templateVersionId: string; skeletonSha256: string; implicit: boolean; slots: NormSlotV2[];
}
export interface NormUnitV2 extends NormUnit {   // T2-52; NormUnitKind + "slot"
  slotKey: string; sectionType: string; placeholder?: boolean;   // placeholder = slot kosong pada draf
}
export interface NormBlockV2 extends NormBlock { // T2-53; blockId = pid
  pid: string; slotKey: string; assetSha256?: string;
}
export interface NormDocSnapshotV2 {     // T2-54
  schema: "studio.norm/v2";
  doc: StudioDocV1;                      // bentuk internal hasil compose (mesin tidak berubah); chapters boleh []
  source: StudioDocV2Resolved;           // konten v2 tergabung (T2-49)
  skeleton: NormSkeletonV2;
  units: NormUnitV2[];
  blocks: NormBlockV2[];
  numbering: Record<string, string>;     // pid -> "Tabel 3.1" | "Gambar 3.1" | "Turunan D-3.1"
  register: Record<string, RegisterEntry>;
}
export type AnyNormSnapshot = NormDocSnapshot | NormDocSnapshotV2;
```

Aturan:
- `NormUnitKind` diperluas dengan `"slot"` untuk slot tak-berulang yang tidak punya jenis unit v1 (`signatureBlock` berdiri sendiri, `sourceRegister`, `ruleIndex`).
- Perencanaan unit: urut posisi slot dokumen. Slot berulang `chapter` → unit `part` (kunci `P<n>`) sebelum bab pertama bagian itu, lalu unit `chapter` per kunci urut numerik. Slot `appendix` → unit `appendix` per huruf urut. `signatureBlock` dengan `slot.placement = "inControlSheet"` tidak membuat unit (dirender di unit `controlSheet`). Slot opsional kosong tidak membuat unit. Pada render draf, slot wajib kosong di dalam lingkup membuat unit `placeholder: true`.
- Alamat baris slot (M17): slot tak-berulang terisi → satu baris `F:<slotKey>`, `type` = sectionType. Pengecualian `sourceRegister` → satu baris per entri `F:<slotKey>/<n>` (n 1-based), `type = "sourceRegisterEntry"`. Slot AUTO tanpa payload → tidak ada baris.
- Amandemen DOC-5 pid butir (register 05 §5.7, KD-34; D-376, D-380): slot `contractRecord` terisi → satu baris `F:<slotKey>` (slot `record`: `F:record`) bertipe `contractRecord`, ditambah satu baris per butir `F:record/<n>` (n 1-based, urutan `items`) bertipe `contractItem`. Pid butir diwarisi per `key` lintas revisi; butir baru mendapat pid bangkitan (§10); butir yang hilang dipensiunkan. Pola sama dengan pengecualian `sourceRegister` di atas; tata bahasa alamat tidak berubah (AC-7). Compose sudah membangun blok `F:<slotKey>/<n>` (`L/services/compose/contract-record.ts:9, 56-58`); baris M17 dan pewarisan pid per `key` milik DC-09 (D-376; sementara pid butir berbasis indeks, D-380).
  - Amandemen DOC-FIX-B (F-02, L1; D-383, D-403): kalimat "sementara pid butir berbasis indeks" di atas adalah keadaan per DC-32 dan kini tidak berlaku. Baris M17 butir dan pewarisan pid per `key` sudah di kode: `inheritItemPids` (`L/services/structure/rows.ts:219-237`, dipanggil `:410`) mewarisi pid dari baris `contractItem` revisi sebelumnya pada slot yang sama; butir baru mendapat pid dari allocator (`freshItemPid`, `rows.ts:245-249`). Format pid butir baru berbeda per jalur (perilaku diketahui, register 05 §5.7): jalur kiriman/commit memakai `dbPidAllocator` (`L/services/structure/pid.ts:121-127`, pid acak `p-…`), sedangkan compose tanpa allocator memakai pid deterministik dari alamat `slot-record-<n>` (`L/services/compose/snapshot.ts:192-195`, `L/services/compose/pids.ts:52-55`).
- Alamat bab: tata bahasa 01_specs §4.1 tetap; bab di slot berulang mana pun memakai `chap`. Kunci bab unik per revisi lintas slot (unik M15). `front` di tata bahasa diperluas menjadi `"F:" slotKey [ "/" posint ]`; empat kunci lama tetap sah (`address.ts:39`).
- Penomoran artefak per kunci bab (01_specs §4.1): tabel ber-caption → `Tabel C.n`; chart/diagram/image/symbolSheet → `Gambar C.n`; derivation → `Turunan D-C.n`.
- `snapshotSha256 = sha256Hex(stableStringify(snapshot))`. Compose deterministik: tanpa cap waktu selain `meta.issueDate`. Rekonstruksi dari M14-M18 → compose ulang → sha sama (SC-5).
- `structureSha256 = sha256Hex(stableStringify({ skeletonSha256, slots: [{ slotKey, position, omitted }], outlines: { [slotKey]: OutlineEntryV2[] | null } }))`.

### 4.7 Templat v2 dan kerangka (`types/v2/template.ts`)

```ts
export interface TemplateSlotDef {       // T2-56
  slotKey: string; sectionType: string; label: string; position: number;
  required: boolean; positionLocked: boolean; repeatable: boolean; minItems?: number; maxItems?: number;
  contentMode: "AUTO" | "INPUT" | "MIXED"; tiers: Array<"NOTA" | "TERBIT" | "SERAH">; admits: string[];
  essentials: Record<string, ParamValue>;   // kunci rinci berlapis essential, maks 8 kenop jenis slot
  advanced?: Record<string, ParamValue>;    // ADMIN atau mode ahli
  roleFormats?: Record<string, unknown>;    // RoleKey -> {para?, run?}; ADMIN
}
export interface StudioSkeletonV1 {      // T2-57 (SID05)
  $schema: "studio.skeleton/v1"; slots: TemplateSlotDef[];
}
export interface StudioTemplateV2 {      // T2-58 (SID04)
  $schema: "studio.template/v2";
  preset?: { slug: string; version?: number };  // wajib kecuali templat isPreset
  essentials: Record<string, ParamValue>;       // kenop esensial global (kunci rinci)
  advanced?: Record<string, ParamValue>;        // ADMIN / mode ahli
  roleFormats?: Record<string, unknown>;        // ADMIN
  skeleton: { slots: TemplateSlotDef[] };
}
export interface EssentialKnobDef {      // T2-59 (isi oleh SR-59/SR-05 di L/registry/essentials.ts)
  id: string;                            // "EK-G01".."EK-G08" global; "EK-<sectionType>-01".. per jenis slot
  scope: "global" | string;              // "global" atau kunci registri section
  label: string;                         // bahasa awam
  keys: readonly string[];               // kunci rinci yang ditulis kenop (KD-21)
  control: "enum" | "bool" | "number" | "text" | "color" | "asset";
  options?: ReadonlyArray<{ value: ParamValue; label: string }>;
  class: "B" | "K";
}
```

Validasi kerangka (simpan templat/R19; galat 400 `SCHEMA_INVALID` dengan `checkId` E41 kecuali disebut lain):
- `slotKey` sesuai C18 dan unik (ganda = 422 `SLOT_DUPLICATE`); `position` unik 1..n kontigu (`SKELETON_POSITION`).
- `sectionType` ∈ C33 `SLOT_SECTION_TYPES` (`SKELETON_SECTION_TYPE`); paling banyak satu slot per sectionType `chapter` dan satu per `appendix`.
- `repeatable = true` hanya untuk `chapter`, `appendix` (`SKELETON_REPEATABLE`); `minItems`/`maxItems` hanya pada slot berulang, `minItems ≤ maxItems`.
- `contentMode` sah per sectionType: `toc`, `ruleIndex`: AUTO \| MIXED; `cover`: INPUT \| MIXED; `chapter`, `appendix`: INPUT; `controlSheet`, `signatureBlock`, `sourceRegister`: INPUT \| MIXED (`SKELETON_CONTENT_MODE`).
- `admits` tidak kosong hanya untuk `chapter`/`appendix`, subset `CONTENT_BLOCK_TYPES` (`SKELETON_ADMITS`).
- Kunci di `essentials`/`advanced` slot harus bercakupan sah untuk slot (§13.5), selain itu 422 `SLOT_PARAM_SCOPE_INVALID`.
- `configSha256` (M10) = `sha256Hex(stableStringify(<TemplateSlotDef slot itu>))`; `skeletonSha256` (MX02) = `sha256Hex(stableStringify(slots urut position))`.

Pemetaan ke DB: versi templat v2 = `baseVersionId` = versi preset (`preset.slug` + `version`, bawaan terbaru); `overrides` = `essentials` ∪ `advanced` (datar, seperti sekarang); `roleFormats` = templat; slot → M10, kunci slot → M11 (`surface` sesuai lapis), roleFormats slot → M12. Satu transaksi (SR-07).

## 5. Medan terlarang

### 5.1 DISPLAY_FIELD (checkId `DISPLAY_FIELD`, 400 `SCHEMA_INVALID`)

Pesan issue: `"medan tampilan tidak diterima; tampilan diatur templat"`. Deteksi: galat ajv `additionalProperties` (atau `enum` untuk nilai `type`/`role`) yang nama/nilai/lokasinya cocok tabel ini. Dua konstanta (C29, C30): `DISPLAY_FIELDS_GLOBAL` (nama dilarang di objek mana pun dalam payload v2) dan `DISPLAY_FIELDS_BY_LOCATION`.

**Global (nama tidak sah di mana pun dalam SID01-SID03):**

| ID | Medan | Asal v1 |
|---|---|---|
| DF-01 | `face` | RunProps |
| DF-02 | `faceRole` | RunProps |
| DF-03 | `szHalfPt` | RunProps |
| DF-04 | `color` | RunProps |
| DF-05 | `caps` | RunProps |
| DF-06 | `smallCaps` | RunProps |
| DF-07 | `spacingTw` | RunProps |
| DF-08 | `u` | RunProps |
| DF-09 | `vertAlign` | RunProps (pakai `sup`/`sub`) |
| DF-10 | `field` | Run `PAGE`/`NUMPAGES` |
| DF-11 | `format` | BlockCommon, item, sel, spacer, rail, caption, source |
| DF-12 | `runDefaults` | BlockCommon |
| DF-13 | `fieldFormats` | BlockCommon, Chapter, TocSpec, PartSpec |
| DF-14 | `headingFormat` | Section |
| DF-15 | `signRowFormat` | SignatureBlock |
| DF-16 | `paragraphFormat` | FigureCommon |
| DF-17 | `labelProps` | Caption |
| DF-18 | `setup` | FrontPage, Chapter, PartSpec, TocSpec |
| DF-19 | `layout` | TableBlock |
| DF-20 | `widthTw` | ColumnSpec, Cell |
| DF-21 | `widthMm` | ColumnSpec, FigureCommon, chart spec, DeviceBlock |
| DF-22 | `heightMm` | FigureCommon, chart spec, DeviceBlock |
| DF-23 | `width_mm` | diagram spec |
| DF-24 | `colsTw` | ControlBlock, Colophon, SignatureBlock, TocSpec, DeviceBlock, registerBlock |
| DF-25 | `cellFormats` | Colophon, SignatureBlock, DeviceBlock, registerBlock |
| DF-26 | `firstRowCell` | ControlBlock |
| DF-27 | `rowCell` | ControlBlock |
| DF-28 | `borders` | Cell, layout |
| DF-29 | `marginsTw` | Cell |
| DF-30 | `shading` | Cell |
| DF-31 | `vAlign` | Cell |
| DF-32 | `cantSplit` | Row |
| DF-33 | `repeatHeader` | Row |
| DF-34 | `sourcePlacement` | TableBlock |
| DF-35 | `rowOrder` | SignatureBlock |
| DF-36 | `numberSeparator` | Section |
| DF-37 | `apparatus` | chart/diagram spec |
| DF-38 | `inDocument` | chart spec |
| DF-39 | `gapMm` | ChartComposite |
| DF-40 | `params` | chart spec, permintaan |
| DF-41 | `overrides` | dokumen (parameter) |
| DF-42 | `kicker` | Chapter, ControlSheetData, TocSpec, CoverData (di sampul lihat VF-13) |
| DF-43 | `number` | Section |
| DF-44 | `separator` | Caption |
| DF-45 | `align` | ColumnSpec |
| DF-46 | `marker` | ListItem |
| DF-47 | `style` | chart spec (di `list` lihat VF-11) |
| DF-48 | `mode` | FrontPage, TocSpec, HeaderFooterSpec |
| DF-49 | `sealBand` | TocSpec |
| DF-50 | `showChapterList` | PartSpec |
| DF-51 | `styleId` | HeaderFooterSpec |
| DF-52 | `trailingFormat` | registerBlock |

**Per lokasi (nama sah di tempat lain, atau terlarang khusus di lokasi itu):**

| ID | Lokasi (objek v2) | Medan/nilai terlarang | Keterangan |
|---|---|---|---|
| DF-53 | `CaptionV2` | `label` | label "Tabel n.m" milik mesin |
| DF-54 | `ChartV2` | `columns` | tata letak komposit = R-50 |
| DF-55 | `ChartV2` | `title` | judul = `caption` |
| DF-56 | `PartV2` | `label`, `order`, `body`, `chapterKeys` | label milik mesin; keanggotaan bab lewat `ChapterV2.partId` |
| DF-57 | `SymbolSheetV2` | `cols` | jumlah kolom lembar = parameter `symbol.*` |
| DF-58 | `TocPayloadV2` | `title`, `note` | judul/catatan = kenop templat |
| DF-59 | `ControlSheetPayloadV2` | `kicker` | kicker = label slot |
| DF-60 | setiap `BlockV2` | `type` bernilai `spacer` atau `device` | primitif tata letak (KS-05) tidak ada di v2 |
| DF-61 | `ParagraphV2.role` | nilai `kicker`, `pageTitle`, `blockHeading`, `addressLine`, `title`, `standfirst`, `scopeLine`, `methodStatement` | peran halaman depan (KD-16) |
| DF-62 | `RailLineV2` | `label` | label rel = templat |
| DF-63 | `ChartV2` | `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel` | sumbu, skala, warna, dan label grafik diatur templat |
| DF-64 | `ChartPanelV2` | `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel` | sumbu, skala, warna, dan label panel diatur templat |
| DF-65 | `ChartDataV2` (setiap varian) | `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel` | data grafik hanya berisi nilai; rupa diatur templat |
| DF-66 | `ImageV2` | `widthClass` | lebar gambar = parameter templat image.widthClass |
| DF-67 | `SymbolSheetV2` | `widthClass` | lebar lembar simbol = parameter templat symbolSheet.widthClass |
| DF-68 | `ChartV2` | `widthClass` | lebar grafik = parameter templat chart.widthClass |
| DF-69 | `DiagramV2` | `widthClass` | lebar diagram = parameter templat diagram.widthClass |
| DF-70 | `ChartPanelV2` | `widthClass` | lebar panel grafik komposit = parameter templat chart.widthClass |
| DF-71 | `ChartLimit` (objek `limit` di `ChartV2` dan `ChartPanelV2`) | `max` | garis ambang hanya berisi nilai dan label; skala sumbu diatur templat |

DF-63..DF-65 memakai satu daftar `CHART_DISPLAY_HINTS` = `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel` (petunjuk tampilan chart v1 yang sengaja tidak diterima, catatan chart §4.3 butir 3; D-227, D-229). DF-66..DF-69 menutup `widthClass` di tiap jenis figur dan DF-70 di panel komposit (IP-63); DF-71 menolak `max` di objek `limit` (IP-63); `widthMm` sudah DF-21. Hitungan: 71 entri = 52 global + 19 per lokasi (DF-53..DF-71). Pesan issue tetap pesan DISPLAY_FIELD di atas. Kolom Keterangan DF-63..DF-71 = `reason` di `forbidden.ts` apa adanya; DF-53..DF-62 sengaja memakai gaya register dengan rujukan (mis. DF-54 "R-50", DF-61 "KD-16"), maknanya sama dengan `reason` kode tetapi tidak harfiah.

Amandemen DOC-5 (register 05 §5.5, AM-12; D-363, D-367): DF-72 (lokasi `ContractRecordPayloadV2`, juga `ContractItemV2`, `ContractEvidenceV2`, `ContractRefV2`: `label`, `columns`, `order`, `heading`) dan DF-73 (`ChartCustomFormV2`: `palette`, `axis`, `max`, `width`, `height`, `legend`) didefinisikan di register 05. Hitungan kode kini **73 = 52 global (C29) + 21 per lokasi (C30, DF-53..DF-73)**: Grep `^  "[A-Za-z_]+", // DF-\d+$` di `L/contract/schema/v2/forbidden.ts` = 52 (baris 22-73); Grep `^  "DF-\d+": ` = 21 (baris 98-136). Medan global tetap berlaku di objek kontrak (05 §5.5). Nama kode `DisplayFieldLocationRule.alsoAt` (`forbidden.ts:80, 132`) belum tercatat di register 05 (D-367: dicatat saat DC-33).

### 5.2 V1_FIELD (checkId `V1_FIELD`, 400 `SCHEMA_INVALID`)

Pesan: `"medan v1 tidak diterima di v2; pakai <pengganti>"`. Prioritas: V1_FIELD diperiksa sebelum DISPLAY_FIELD (C31 `V1_FIELD_RENAMES`).

| ID | Lokasi | Medan v1 | Pengganti v2 |
|---|---|---|---|
| VF-01 | blok, bab, section | `blockId` | `id` |
| VF-02 | `RunV2` | `b` | `strong` |
| VF-03 | `RunV2` | `i` | `em` |
| VF-04 | `ChapterV2` | `runningHeadTitle` | `shortTitle` |
| VF-05 | dokumen | `front` | `sections.<slotKey>` |
| VF-06 | dokumen | `parts` | `sections.<slot chapter>.parts` |
| VF-07 | dokumen | `chapters` | `sections.<slot chapter>.chapters` |
| VF-08 | dokumen | `appendices` | `sections.<slot appendix>.chapters` |
| VF-09 | dokumen | `outputs` | `POST /api/studio/documents/{id}/render (formats) sesudah kiriman tersimpan` (pesan `forbidden.ts`; sebelum D-247: `render.formats`) |
| VF-10 | `CaptionV2`, `SourceV2` | `inline` | `text` atau `runs` langsung |
| VF-11 | `ListV2` | `style` | `ordered` |
| VF-12 | `ChartDataV2` | `accent` | `highlight` di blok chart |
| VF-13 | `CoverPayloadV2` | `kicker` | `tagline` |
| VF-14 | `ChartV2` dan setiap `BlockV2` | `spec` (di chart) dan `x` (di blok) | medan chart langsung di blok (`spec` hanya sah di `DiagramV2`); `x` hanya di tingkat dokumen |

## 6. Kerangka

### 6.1 Kerangka bawaan GSP DATUM (seed SR-36)

Semua `minItems`/`maxItems` null kecuali disebut. `admits` slot berulang = 21 nilai `CONTENT_BLOCK_TYPES` (`enums.ts:89-98`).

| ID | pos | slotKey | sectionType | label | required | tiers | positionLocked | repeatable | contentMode | Kenop slot bawaan |
|---|---|---|---|---|---|---|---|---|---|---|
| SL-01 | 1 | `cover` | `cover` | Sampul | true | TERBIT, SERAH | true | false | MIXED | - |
| SL-02 | 2 | `controlSheet` | `controlSheet` | Lembar Kendali | true | TERBIT, SERAH | false | false | INPUT | - |
| SL-03 | 3 | `signature` | `signatureBlock` | Tanda Tangan | true | TERBIT, SERAH | false | false | INPUT | `slot.placement = "inControlSheet"` |
| SL-04 | 4 | `toc` | `toc` | Daftar Isi | true | TERBIT, SERAH | false | false | AUTO | - |
| SL-05 | 5 | `content` | `chapter` | Isi | true | (semua) | false | true, `minItems 1` | INPUT | - |
| SL-06 | 6 | `references` | `sourceRegister` | Referensi | false | (semua) | false | false | INPUT | - |
| SL-07 | 7 | `appendices` | `appendix` | Lampiran | false | (semua) | true | true | INPUT | - |

- Slot aktif untuk dokumen bila `tiers` kosong atau memuat tier dokumen. NOTA: SL-01..SL-04 tidak aktif.
- `positionLocked`: himpunan slot aktif sebelum slot itu di `structure.order` harus sama dengan himpunan slot aktif sebelum slot itu di kerangka.
- `datum-manual-000` memakai SL-01..SL-05 dan SL-07 (6 slot). Mode `toc` Manual 000 diputus SR-32 (AUTO, atau MIXED bila daftar isi statis benchmark harus dipertahankan; RK-02).

### 6.2 Slot kerangka bertipe lain

`ruleIndex` (Indeks Aturan, AS-1) tersedia sebagai jenis slot opsional AUTO; tidak ada di kerangka bawaan.

Amandemen DOC-5 (register 05 §6.1-§6.3, AM-01, AM-10, AM-11; D-371, D-376): jenis slot ke-9 `contractRecord` (C33 8 → 9). Section type S30 "Catatan Kontrak" (DOCUMENT, INTERIOR; `SECTION_REGISTRY_COUNT` 51 → 52, `DOCUMENT` 29 → 30; `L/registry/sections.ts:471-483, 666, 669`). `SLOT_KINDS`: `contentMode` INPUT saja, tak-berulang, satu per kerangka (`singlePerSkeleton`), `implicitSlotKey` `record` (`L/registry/slots.ts:94`). **`activeTiers: []`** (D-371; `sections.ts:480` `NONE`): slot ini tidak pernah lahir dari kerangka implisit §6.3 atau rencana kanonik; hanya hadir lewat kerangka eksplisit templat ber-`contractKind` (templat `laporan-kerja-agen`, SL-08..SL-10, register 05 §6.3), dan aktivasinya membaca `slot.tiers` templat (D-376). Validasi kerangka tambahan: checkId `SKELETON_CONTRACT_RECORD` (CH-06). Tidak ada di kerangka bawaan GSP DATUM §6.1.

### 6.3 Kerangka implisit (versi templat lama, `skeletonSha256 = null`)

`implicitSkeleton(sectionPlan, tier)` (I44) membentuk kerangka per tier dokumen: untuk setiap kunci di `sectionPlan[tier].order` (lalu required, lalu optional) yang termasuk C33, buat slot dengan `slotKey` = kunci registri, kecuali `signatureBlock` → `signature`, `chapter` → `content`, `appendix` → `appendices`, `sourceRegister` → `references`; `required` = ada di `required` tier itu; `tiers = []`; `contentMode` bawaan per sectionType: `cover` MIXED, `toc` AUTO, `ruleIndex` AUTO, lainnya INPUT; `chapter` `repeatable` + `minItems 1`; `appendix` `repeatable`; label = `SectionTypeDef.name`. `M14.templateSlotId = null`, `NormSkeletonV2.implicit = true`. Kunci `forbidden` tidak menjadi slot.

## 7. Pembuatan dokumen baru (pesan controller butir 1-4)

### 7.1 Aturan

1. **Patokan versi.** Dokumen baru mematok satu versi templat (versi diminta, atau `latestVersionNo`). Versi tidak berubah (D-62), jadi patokan = salinan beku efektif. Perubahan templat sesudahnya tidak memengaruhi dokumen, kecuali op struktur `templateVersion` eksplisit (R14). Tidak ada salinan parameter ke dokumen (KD-11).
2. **Instansiasi kosong.** Revisi 1 membuat satu baris M14 untuk **setiap slot kerangka yang aktif untuk tier dokumen dan tidak di-OMIT** oleh `structure`: `filled = false`, `payload = null`, `payloadSha256 = sha256Hex("null")`, tanpa M15-M17. State awal: wajib INPUT → `EMPTY`; AUTO atau MIXED → `AUTO_READY`; opsional INPUT → `OPTIONAL_EMPTY`; wajib berulang → `EMPTY`.
3. **Dua jalur, satu bentuk.**
   - (a) Eksplisit: `POST /api/studio/documents` (R04) dengan `studio.doc/v2` berisi `template` + `meta.title` (+ `mission`, `docKey`, `structure` opsional) dan tanpa `sections` → 201 dokumen kosong berkerangka + kelengkapan.
   - (b) Implisit: kiriman bab (R12) atau slot (R13) pertama ke target misi/nomor yang belum ada → dokumen dibuat dengan bentuk revisi 1 yang sama, lalu kiriman diterapkan **di revisi yang sama** (revisi 1, `changeScope = "create;chapter:<k>"` atau `"create;slot:<slotKey>"`).
   - (c) R04 `studio.doc/v2` dengan `sections` → revisi 1 = bentuk kosong + semua section yang dikirim.
4. **`structure` opsional saat pembuatan** untuk menghapus slot opsional atau mengubah urutan (D-127), divalidasi EC01-EC04.
5. **Target misi.** `missionDocKey = docKey ?? template.slug` bila `mission.folder` ada (jalur v2); null bila tanpa misi atau jalur v1 (KD-12). Bila `(missionFolder, missionDocKey)` sudah ada: R04 v2 = kiriman ke dokumen itu (upsert per slot dan per kunci bab; slot/bab yang tidak disebut tetap); R12/R13 = kiriman biasa.

### 7.2 Meta bawaan

| Medan `DocMeta` | Sumber bila tidak dikirim |
|---|---|
| `title` | wajib saat membuat (400 `META_REQUIRED_FOR_CREATE`) |
| `docNumber` | sekuens HQ (KT-05 c, KD-04) |
| `rev` | parameter `doc.revision` (P3-22) |
| `typeCode` | parameter `doc.defaultTypeCode` (R-48) |
| `tier` | parameter `doc.defaultTier` (R-49) |
| `classification` | parameter `classification.level` (P6-02) |
| `language` | parameter `doc.language` (P3-23) |
| `author` | `agentId` kiriman, atau requester sesi (`getRequester`) |
| `issueDate` | tanggal pembuatan revisi 1, zona Asia/Jakarta, `YYYY-MM-DD`; tetap sampai `setMeta` |
| lainnya | absen |

### 7.3 Contoh pembuatan kosong (E0)

Permintaan:

```json
{ "$schema": "studio.doc/v2",
  "template": { "slug": "datum-gsp" },
  "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" },
  "docKey": "laporan-survei",
  "meta": { "title": "Laporan Survei Gardu Induk Cikupa" } }
```

Respons 201:

```json
{ "document": { "id": "cmw1doc…", "docNumber": "014/GSP/KT/X/2026", "missionFolder": "2026-10-23_misi_a", "docKey": "laporan-survei",
                "template": { "slug": "datum-gsp", "versionNo": 2 }, "tier": "TERBIT" },
  "created": true, "unchanged": false, "rebased": false,
  "revision": { "revisionNo": 1, "changeScope": "create", "changeAuto": true },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 1, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "label": "Sampul", "sectionType": "cover", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "controlSheet", "label": "Lembar Kendali", "sectionType": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "signature", "label": "Tanda Tangan", "sectionType": "signatureBlock", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "toc", "label": "Daftar Isi", "sectionType": "toc", "state": "AUTO_READY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "content", "label": "Isi", "sectionType": "chapter", "state": "EMPTY", "required": true, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "references", "label": "Referensi", "sectionType": "sourceRegister", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null },
      { "slotKey": "appendices", "label": "Lampiran", "sectionType": "appendix", "state": "OPTIONAL_EMPTY", "required": false, "lastFilledBy": null, "lastFilledAt": null, "lastFilledRevisionNo": null } ],
    "chapters": {
      "content": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [], "minItems": 1 },
      "appendices": { "expected": [], "expectedSource": "contiguous", "present": [], "missing": [] } },
    "missingRequired": ["controlSheet", "signature", "content"],
    "nextSteps": [
      "Kirim isi Lembar Kendali, Tanda Tangan: POST /api/studio/slots",
      "Kirim bab pertama: POST /api/studio/chapters",
      "Opsional: tetapkan daftar bab yang direncanakan: PATCH /api/studio/documents/cmw1doc…/structure {op: setOutline}" ],
    "message": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap pada revisi 1: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan, Isi. Render penuh ditolak; render bab/slot tersedia sebagai draf.",
    "forwardToController": "Dokumen 014/GSP/KT/X/2026 (misi 2026-10-23_misi_a) dibuat kosong pada revisi 1. Isi wajib belum ada: Lembar Kendali, Tanda Tangan, Isi. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots) serta bab (POST /api/studio/chapters), lalu minta render penuh." } }
```

Baris DB sesudahnya: 1 `StudioDocument` (`completeness = INCOMPLETE`, `missionDocKey = "laporan-survei"`), 1 `StudioRevision` (`schemaId = "studio.doc/v2"`, `changeScope = "create"`), 7 `StudioDocSection` (`filled = false`), 0 baris M15-M18, 0 `StudioBlock`.

## 8. Kelengkapan (`services/completeness`, I48)

### 8.1 State slot (E29)

Dihitung untuk setiap slot kerangka yang aktif untuk tier dokumen, urut posisi dokumen. Slot tidak aktif tidak dicantumkan.

| Kondisi (dievaluasi berurutan) | State |
|---|---|
| Slot opsional aktif tanpa baris M14 | `OMITTED` |
| `contentMode = AUTO` | `AUTO_READY` |
| `contentMode = MIXED`, `filled = false` | `AUTO_READY` |
| Tak-berulang, `filled = true` | `FILLED` |
| Tak-berulang INPUT, `filled = false`, wajib | `EMPTY` |
| Tak-berulang INPUT, `filled = false`, opsional | `OPTIONAL_EMPTY` |
| Berulang, 0 bab | wajib: `EMPTY`; opsional: `OPTIONAL_EMPTY` |
| Berulang, ≥ 1 bab, `missing` tidak kosong atau jumlah < `minItems` | `PARTIAL` |
| Berulang, ≥ 1 bab, `missing` kosong dan jumlah ≥ `minItems` | `FILLED` |

### 8.2 Kemajuan bab (`ChapterProgressV2`)

- `expectedSource = "outline"` bila `M14.payload.outline` ada: `expected` = kunci outline.
- Selain itu `"contiguous"`: slot `chapter` → `"1".."max"` (max = kunci numerik terbesar yang ada; 0 bab = `[]`); slot `appendix` → `"A"..huruf terbesar`.
- `present` = `[{ key, pid, by, at, revisionNo }]` dari M15 (`lastFilledBy`, `lastFilledAt` ISO 8601 UTC, `lastFilledRevisionNo`).
- `missing` = `expected` − kunci yang ada.
- Bab di luar `expected` (outline) tetap diterima dan tercantum di `present`.

### 8.3 Status, pesan, langkah

- `missingRequired`: untuk setiap slot wajib `EMPTY` tak-berulang → `slotKey`; untuk slot wajib berulang → `"<slotKey>:<key>"` per kunci `missing`, dan `slotKey` saja bila 0 bab atau jumlah < `minItems` tanpa kunci hilang.
- `status = "COMPLETE"` ⟺ `missingRequired` kosong. `fullRenderAllowed = status === "COMPLETE"`.
- Templat teks (bahasa Indonesia; bagian kosong dihilangkan; daftar dipisah `", "`; waktu `HH:MM WIB` zona Asia/Jakarta):
  - `message` INCOMPLETE: `Dokumen {docNumber} ({misi}) belum lengkap pada revisi {n}: isi wajib belum ada untuk {label slot}; bab belum ada {kunci}. Render penuh ditolak; render bab/slot tersedia sebagai draf.` dengan `{misi}` = `misi {folder}, {docKey}`.
  - `message` COMPLETE: `Dokumen {docNumber} lengkap pada revisi {n}; render penuh tersedia.`
  - `forwardToController` (hanya INCOMPLETE): `Dokumen {docNumber} (misi {folder}) belum lengkap pada revisi {n}. Isi wajib belum ada: {label slot}. Bab belum ada: {kunci}. Terakhir mengisi: {lingkup} oleh {by} pukul {HH:MM WIB}. Langkah berikut: {langkah}, lalu minta render penuh.` (revisi 1 tanpa isi: `dibuat kosong pada revisi 1`, tanpa bagian "Terakhir mengisi").
  - `nextSteps`: `Kirim isi {label slot}: POST /api/studio/slots`; `Kirim bab {kunci}: POST /api/studio/chapters` (0 bab: `Kirim bab pertama: …`; slot lampiran: `Kirim lampiran {kunci}: POST /api/studio/chapters {"slot":"<slotKey>"}`); tanpa outline pada slot berulang wajib: `Opsional: tetapkan daftar bab yang direncanakan: PATCH /api/studio/documents/{id}/structure {op: setOutline}`; COMPLETE: `Minta render penuh: POST /api/studio/documents/{id}/render {scope: "document"}`.

### 8.4 Bentuk (`types/v2/completeness.ts`)

```ts
export interface SlotStatusV2 {          // T2-60a
  slotKey: string; label: string; sectionType: string; state: StudioSlotState; required: boolean;
  lastFilledBy: string | null; lastFilledAt: string | null; lastFilledRevisionNo: number | null;
}
export interface ChapterProgressV2 {     // T2-60b
  expected: string[]; expectedSource: "outline" | "contiguous";
  present: Array<{ key: string; pid: string; by: string; at: string; revisionNo: number }>;
  missing: string[]; minItems?: number; maxItems?: number;
}
export interface CompletenessReportV2 {  // T2-60 (juga isi kolom StudioRevision.completenessReport)
  status: "INCOMPLETE" | "COMPLETE"; revisionNo: number; fullRenderAllowed: boolean;
  slots: SlotStatusV2[]; chapters: Record<string, ChapterProgressV2>;
  missingRequired: string[]; nextSteps: string[]; message: string; forwardToController?: string;
}
```

Kelengkapan ikut di setiap respons kirim, sunting, struktur, dan render (R04, R05, R12-R17, R20) dan di GET R04 per dokumen. `StudioDocument.completeness` dan `StudioRevision.completeness` = `status`.

## 9. Konkurensi

### 9.1 Kunci dan transaksi

1. Setiap penulisan dokumen berjalan dalam satu transaksi interaktif Prisma (`timeout` = C28 `STUDIO_SUBMIT_TX_TIMEOUT_MS`) yang pertama-tama memanggil `SELECT pg_advisory_xact_lock(hashtext($1))` dengan `$1 = 'studio-doc:' || documentId` (C24 `STUDIO_LOCK_DOC_PREFIX`).
2. Pembuatan lewat misi: kunci `'studio-mdoc:' || missionFolder || ':' || docKey` (C25 `STUDIO_LOCK_MISSION_DOC_PREFIX`) **sebelum** cek keberadaan. Urutan kunci tetap: `studio-mdoc` → `studio-docno` (KD-04) → `studio-doc`. Tidak ada urutan lain (bebas deadlock).
3. Pelanggaran unik `(missionFolder, missionDocKey)` (Prisma P2002) di dalam transaksi diulang **sekali** sebagai jalur "dokumen sudah ada". Tidak pernah 409.
4. Di dalam kunci: baca revisi terbaru `n`, terapkan lingkup, tulis `n+1` (salinan penuh M14-M17 + baris lingkup baru), perbarui `StudioDocument.currentRevisionNo`, `completeness`, commit.
5. Job render dibuat **setelah** commit untuk `revisionNo` tertentu. Batas FIX-1/FIX-8 (429 `RATE_LIMITED`, 503 `RENDER_QUEUE_FULL`) berlaku.

### 9.2 Cek dasar per lingkup

| Lingkup | Sha pembanding | Konflik bila |
|---|---|---|
| Bab `chapter:<k>` | `M15.contentSha256` kunci k | `baseRevisionNo` diisi dan sha kunci k di revisi terbaru ≠ sha di revisi `baseRevisionNo` |
| Slot `slot:<slotKey>` | `M14.payloadSha256` | sama |
| Pid `pid:<pid>` (R16, R06) | `M17/M15/M16.contentSha256` identitas + id induk (section/bab) | sha atau induk berubah, atau identitas dipensiunkan, di revisi > `baseRevisionNo`; juga untuk pid jangkar (`insertBefore/After`, `move`) |
| Struktur `structure:<op>` | `StudioRevision.structureSha256` | berubah sejak `baseRevisionNo` |
| Meta | nilai `DocMeta` | `setMeta` dengan `baseRevisionNo` lama dan medan yang sama berubah |

- Kiriman bab/slot tanpa `baseRevisionNo`: tanpa cek (penulis terakhir menang untuk lingkup sama); `rebased = false`.
- Dengan `baseRevisionNo < n` dan tanpa konflik: diterapkan di atas `n`, respons `rebased: true, baseRevisionNo, appliedOnRevisionNo: n`.
- PATCH (R06, R14, R16) wajib `baseRevisionNo` dan `change` (D-06).
- Konflik → 409 `SCOPE_CONFLICT` (details §11.3).

### 9.3 Idempotensi

Kiriman bab/slot dengan sha lingkup (KD-13) sama dengan revisi terbaru, tanpa perubahan register, dan aset yang sudah ada → 200 `{created: false, unchanged: true, revision: {revisionNo: n}}`, tanpa revisi baru dan tanpa job (kecuali `render` diminta: job dibuat untuk revisi `n`).

### 9.4 Penomoran

Penomoran artefak per kunci bab sehingga bab tak berurutan tidak saling menggeser. Urutan unit = urutan slot, lalu kunci. Daftar isi dan nomor halaman dihitung di render penuh. Rujukan prosa tidak ditulis ulang (A9). Penomoran ulang kunci hanya lewat op `renumberChapters` (ADMIN).

### 9.5 Tata bahasa `changeScope`

```
changeScope = scope *( ";" scope )
scope       = "create" | "document" | "chapter:" key | "slot:" slotKey | "pid:" pid
            | "address:" address | "structure:" op | "meta" | "register:" regKey | "rebase"
```

Contoh: `create;chapter:3`, `slot:controlSheet`, `pid:p-d1g5j8l3mn`, `structure:reorder`. Teks `change` otomatis (`changeAuto = true`): `what = "Kiriman {scope} oleh {agentId atau requester}"`, `why = "Kiriman agen (otomatis)"`, `impact = "{changeScope}"`.

## 10. Identitas pid

| Aspek | Aturan |
|---|---|
| Pola | C19 `^[a-z0-9][a-z0-9-]{2,63}$` |
| Bentuk bangkitan | C20 `"p-"` + C22 (10) karakter dari C21 (base32 Crockford huruf kecil `0123456789abcdefghjkmnpqrstvwxyz`; 50 bit acak `crypto.randomBytes`) |
| Pid bab | id klien, atau `bab-<kunci>` (slot `chapter`) / `lamp-<kunci huruf kecil>` (slot `appendix`) bila belum pernah dipakai dokumen ini (termasuk pid pensiun), atau `bab-<kunci>-<m>` / `lamp-<kunci>-<m>` dengan m = 2, 3, … terkecil yang bebas |
| Pid section dan blok | id klien, atau pewarisan posisi, atau bangkitan |
| Deterministik | T2-55 `PidAllocator` = `{ next(kind: StudioIdentityKind, hint: string): string }`; jalur murni memakai benih: `"p-" + crockford(sha256(seed + ":" + ordinal))[0..10]` |
| Keunikan | `@@unique([documentId, pid])` (M18), termasuk pid pensiun |
| Pensiun | Identitas yang tidak ada di revisi n+1 mendapat `retiredRevisionNo = n+1`. Pid pensiun tidak dapat dipakai ulang (422 `PID_CONFLICT`). PATCH ke pid pensiun = 404 `PID_NOT_FOUND` dengan `details.retiredRevisionNo` |
| Pencocokan kiriman bab tanpa id | (1) Pid klien eksplisit diklaim lebih dulu: pid aktif di bab yang sama → identitas itu; pid aktif di bab/slot lain → 422 `PID_CONFLICT`; pid belum ada → identitas baru dengan pid itu. (2) Section ke-i bab baru mewarisi pid section ke-i bab lama (`sectionNo` sama; intro = 0) yang belum diklaim. (3) Di dalam section yang dicocokkan, blok ke-j mewarisi pid blok ke-j lama yang belum diklaim, tanpa memandang tipe. (4) Sisa blok baru → pid bangkitan. (5) Sisa blok lama → pensiun |
| Sunting per pid | Op per jenis identitas: BLOCK: `replace` (tipe boleh berubah), `insertBefore`, `insertAfter`, `delete`, `move`; SUBSECTION: `replace` (SectionV2), `insertBefore`, `insertAfter`, `delete`; CHAPTER: `replace` (ChapterV2, kunci sama), `delete`. Op lain: 400 `SCHEMA_INVALID` `checkId: "PID_OP_KIND"`. `replace` mempertahankan pid; sisipan → `newPid` |
| Riwayat | `GET …/paragraphs/[pid]?history=1`: `[{ revisionNo, changeScope, by, at, contentSha256, address, retired }]` dari baris per revisi |
| Tulis ganda `StudioBlock` (M06) | Setiap baris M17 juga ditulis ke M06: `blockId = pid`, `address`, `chapterKey` (kunci bab atau `"F"`), `sectionNo`, `paraNo`, `type`, `content` = isi internal `NormBlock.content`, `textPlain`, `contentSha256` = sha isi internal |

## 11. Kode galat

### 11.1 Urutan evaluasi

1. Transport: 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 400 `JSON_MALFORMED`.
2. Skema (400 `SCHEMA_INVALID`, issue `DISPLAY_FIELD`/`V1_FIELD`/`RENDER_FIELD`/`SKELETON_*`/`PID_OP_KIND`; `RENDER_FIELD` = `render` di badan R04/R06/R12/R13/R14/R16, D-247).
3. Target dan templat: 400 `DOC_TARGET_AMBIGUOUS`, 404 `DOCUMENT_NOT_FOUND`, 400 `META_REQUIRED_FOR_CREATE`, 404 `TEMPLATE_NOT_FOUND`, 404 `MISSION_REF_NOT_FOUND`, 409 `TEMPLATE_MISMATCH`, 409 `META_CONFLICT` (hanya bila medan meta terisi di kedua sisi dan berbeda; medan kosong diisi, lingkup `meta`, IP-66), 409 `DOC_NUMBER_EXISTS`.
4. Gerbang kepercayaan D-98/D-134 (403 `FORBIDDEN` templat terbatas; penanda dibuang + REPORT).
5. `ingest.inlineFormat` (v1 saja): 422 `INLINE_FORMAT_REJECTED`; `strip` → REPORT `INLINE_FORMAT_STRIPPED`.
6. Struktur (422): `SLOT_*`, `BLOCK_TYPE_NOT_ADMITTED`, `CHAPTER_KEY_INVALID`.
7. Di dalam kunci: lingkup dan pid (409 `SCOPE_CONFLICT`, 404 `PID_NOT_FOUND`, 422 `PID_CONFLICT`). Kepemilikan pid diperiksa SEBELUM cek idempoten sha (D-252 O-1): kiriman identik yang membawa pid milik lingkup lain = 422, bukan 200 `unchanged`.
8. Aset: 413 `ASSET_TOO_LARGE`, 415 `ASSET_TYPE_UNSUPPORTED`, 422 `ASSET_NOT_FOUND`.
9. By-construction (422 `BY_CONSTRUCTION_FAILED`, `CHART_KIND_*`, `DATUM-31`, `DATUM-39`). Satu gerbang bersama (`services/ingest/by-construction.ts`) untuk R04 dan, di dalam transaksi sebelum commit, R12/R13/R16/R06/R14 (D-261); LD-01/LD-02 tidak menahan selama INCOMPLETE (D-131). Pointer isu kiriman bab = badan (`/chapter/...`), slot = `/payload`, lokasi dokumen tergabung di `mergedPointer` (D-275). DATUM-04 = judul berakhiran `?` (D-263/D-269). Revisi yang tidak terekonstruksi dari barisnya = 500 internal, transaksi dibatalkan (D-258).
10. Simpan.
11. Render: hanya R17 (dan R07) → 409 `DOCUMENT_INCOMPLETE` untuk render penuh revisi INCOMPLETE; kiriman dan sunting tidak merender (D-247, KD-27 digantikan).
12. Lint rilis (tidak menahan berkas, A10).

Amandemen DOC-3 (batch Hermes): (a) path `/api/studio/*` yang tidak ada → `404 { error, code: "ROUTE_NOT_FOUND", message, hint, correlationId, details: { method, path, suggestion? } }` + `x-correlation-id` lewat route catch-all `src/app/api/studio/[[...notfound]]/route.ts` (GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD; tanpa sesi tetap 401); `ROUTE_NOT_FOUND` kini anggota `STUDIO_ERROR_CODES` (69 kode; `STUDIO_ERROR_HTTP` 404, D-336), PUT juga 404 JSON, HEAD 404 tanpa badan; metode salah pada route yang ada = 405 tanpa badan dari Next (JSON 405 → IP-100) (D-323). (b) Kiriman bab/slot (dan R04 bertarget) tanpa `baseRevisionNo` terbaru yang akan menimpa pid hasil PATCH sesudah kiriman terakhir lingkup itu → 409 `SCOPE_CONFLICT` `reason: PATCHED_PIDS_OVERWRITTEN`, diperiksa sesudah cek idempoten dan sebelum cek dasar §9.2, juga di dry-run R08 (D-324, `services/submit/overwrite.ts`). (c) R17/R07: pdf di format efektif + render-env tidak siap → 503 `PDF_ENGINE_UNAVAILABLE` preflight tanpa job; urutan R17 dan R07 seragam untuk `formats` apa pun: 401 → 400 badan → 429 laju → 503 `RENDER_QUEUE_FULL` → 404 → 409 `DOCUMENT_INCOMPLETE`/422 → 503 preflight (D-336, menggantikan urutan bergantung format D-331); R09 tanpa gerbang PDF. (d) D16 `evidenceRail` NOT_APPLICABLE hanya bila `device.evidenceRail.enabled = false` berasal dari lapis yang dikendalikan ADMIN (preset, templat terbatas, kunci lanjutan); bila kelak dapat ditulis USER, D16 tetap ketat (D-335).

Amandemen DOC-5 (register 05 §5.6; D-363, D-375, D-382): langkah 2 menambah checkId CH-01..CH-05 (`CONTRACT_ENUM`, `CONTRACT_PATTERN`, `CONTRACT_DATE`, `CONTRACT_REF_TARGET`, `CHART_CUSTOM_FORM`) serta DF-72/DF-73 (400 `SCHEMA_INVALID`); langkah 6b (murni, sebelum kunci) I54 → 422 `CONTRACT_ITEM_KEY_DUPLICATE`; langkah 9a (dalam transaksi, sebelum by-construction) I55 → 422 `CONTRACT_REF_NOT_FOUND` / `CONTRACT_REF_PID_NOT_FOUND`, pid pensiun = peringatan `CONTRACT_REF_PID_RETIRED` di `warnings` (AM-08); langkah 9 by-construction → 422 `CHART_CUSTOM_FORM_UNSUPPORTED`. Dry-run R08 menjalankan langkah yang sama. Dokumen tanpa slot `contractRecord`: nol isu baru (D-382).

Amandemen DOC-FIX-B (F-01, L2; register 05 §5.6 amandemen DOC-FIX-B; D-374, D-395): dua bagian amandemen DOC-5 di atas digantikan. (1) Langkah 6b tidak "sebelum kunci": I54 berjalan DI DALAM kunci dokumen, sesudah gabung struktur (`mergeSubmission`, termasuk `PID_CONFLICT` dan `ASSET_NOT_FOUND` dari gabung) dan sebelum langkah 7 (cek idempoten, FIX-H2 `PATCHED_PIDS_OVERWRITTEN`, cek dasar §9.2) (`L/services/submit/pipeline.ts:840`, `:869`, lalu `:873`, `:894`, `:921`). (2) EC28 `CHART_CUSTOM_FORM_UNSUPPORTED` bukan isu langkah 9: kode ini dilempar compose (`L/engine/chart/core/custom.ts:59-63`, lewat `composeV2` `pipeline.ts:926-939`) sesudah langkah 7 dan SEBELUM langkah 9a (I55) dan gerbang by-construction (`pipeline.ts:980`). Urutan kontrak yang berlaku: 2 (CH-01..CH-05, DF-72/DF-73) → 6 gabung → 6b I54 (400 checkId CH / 422 EC27) → 7 → compose (422 EC28) → 9a I55 (422 EC25/EC26, CW-01) → 9. Urutan sama di jalur sunting (`L/services/revisions/v2/commit.ts:211`, `:215-228`, `:251`) dan R04 dokumen baru (`L/services/ingest/v2.ts:579`). Akibat bagi agen: kiriman yang memuat rujukan salah sekaligus bentuk `chart.custom` tak didukung menerima EC28 lebih dulu, bukan EC25/EC26.

Setiap galat: `{ error: <pesan Indonesia yang menyebut perbaikan dalam bahasa isi>, code, details }`.

### 11.2 Register kode baru (24; ditambahkan ke `STUDIO_ERROR_CODES` dan `STUDIO_ERROR_HTTP`, 44 → 68)

| ID | Kode | HTTP | Kondisi | Contoh `details` |
|---|---|---|---|---|
| EC01 | `SLOT_UNKNOWN` | 422 | slotKey di `structure`, `sections`, `slot` atau op di luar kerangka versi templat dokumen | `{ "slotKey": "lampiranX", "known": ["cover","controlSheet","signature","toc","content","references","appendices"] }` |
| EC02 | `SLOT_REQUIRED_MISSING` | 422 | `structure.order` tanpa slot wajib aktif, atau `omitSlot` slot wajib (isi kosong bukan galat: INCOMPLETE) | `{ "missing": ["controlSheet"] }` |
| EC03 | `SLOT_DUPLICATE` | 422 | kunci ganda di `structure.order` atau di kerangka | `{ "slotKey": "content", "positions": [5, 6] }` |
| EC04 | `SLOT_POSITION_LOCKED` | 422 | slot `positionLocked` berpindah (§6.1) | `{ "slotKey": "cover", "expectedBefore": [], "actualBefore": ["toc"] }` |
| EC05 | `SLOT_TYPE_MISMATCH` | 422 | `type` payload ≠ sectionType slot; `/chapters` ke slot tak-berulang; templateVersion mengubah sectionType slot berisi | `{ "slotKey": "signature", "expected": "signatureBlock", "actual": "controlSheet" }` |
| EC06 | `SLOT_FORBIDDEN_FOR_TIER` | 422 | isi untuk slot tidak aktif pada tier dokumen | `{ "slotKey": "cover", "tier": "NOTA", "activeTiers": ["TERBIT","SERAH"] }` |
| EC07 | `SLOT_INPUT_NOT_ACCEPTED` | 422 | isi ke slot AUTO di luar medan yang diizinkan, atau `entries` toc pada slot AUTO | `{ "slotKey": "toc", "contentMode": "AUTO", "fields": ["entries"] }` |
| EC08 | `SLOT_ITEMS_OUT_OF_RANGE` | 422 | jumlah bab > `maxItems` | `{ "slotKey": "appendices", "maxItems": 5, "count": 6 }` |
| EC09 | `BLOCK_TYPE_NOT_ADMITTED` | 422 | jenis blok di luar `admits` slot | `{ "slotKey": "content", "pointer": "/chapter/sections/0/blocks/2", "type": "symbolSheet" }` |
| EC10 | `SLOT_USE_CHAPTER_ENDPOINT` | 422 | slot berulang dikirim lewat `/slots` | `{ "slotKey": "content", "use": "POST /api/studio/chapters" }` |
| EC11 | `SLOT_PARAM_SCOPE_INVALID` | 422 | simpan templat/kerangka: kunci di slot di luar cakupan slot (§13.5) | `{ "slotKey": "content", "paramKey": "page.size", "scope": "document" }` |
| EC12 | `PARAM_SURFACE_FORBIDDEN` | 403 | kunci lanjutan oleh non-ADMIN tanpa `expertMode`; kunci internal/turunan oleh non-ADMIN; pin turunan di templat non-preset | `{ "keys": ["render.table.columnProfiles"], "surface": "advanced" }` |
| EC13 | `PRESET_READONLY` | 403 | ubah versi templat `isPreset` oleh non-ADMIN | `{ "templateSlug": "datum-gsp-preset" }` |
| EC14 | `INLINE_FORMAT_REJECTED` | 422 | v1 bertampilan saat `ingest.inlineFormat = "reject"` | `{ "fields": [{ "pointer": "/document/chapters/0/sections/0/blocks/1/format", "field": "format" }] }` |
| EC15 | `DOC_TARGET_AMBIGUOUS` | 400 | target tidak tepat satu cara | `{ "given": ["documentId", "mission"] }` |
| EC16 | `META_REQUIRED_FOR_CREATE` | 400 | dokumen belum ada dan `template` atau `meta.title` absen | `{ "missing": ["meta.title"] }` |
| EC17 | `META_CONFLICT` | 409 | medan `meta` yang dikirim berbeda dari medan yang SUDAH terisi di dokumen; medan kosong diisi tanpa galat (IP-66; ubah nilai terisi lewat `setMeta`) | `{ "fields": { "title": { "current": "A", "sent": "B" } } }` |
| EC18 | `TEMPLATE_MISMATCH` | 409 | dokumen ada dengan slug templat lain, atau `template.version` ≠ versi patokan | `{ "pinned": { "slug": "datum-gsp", "versionNo": 2 }, "sent": { "slug": "datum-kanonik" } }` |
| EC19 | `SCOPE_CONFLICT` | 409 | §9.2 | §11.3 |
| EC20 | `PID_NOT_FOUND` | 404 | pid tidak dikenal atau pensiun | `{ "pid": "p-zz", "retiredRevisionNo": 7 }` |
| EC21 | `PID_CONFLICT` | 422 | pid klien bentrok (milik lingkup lain atau pensiun) | `{ "pid": "s1-tujuan-1", "ownerScope": "chapter:1" }` |
| EC22 | `ASSET_NOT_FOUND` | 422 | `assetRef`/kunci aset tak dikenal (KD-24) | `{ "asset": "foto-pmt2", "pointer": "/chapter/sections/1/blocks/2/asset" }` |
| EC23 | `DOCUMENT_INCOMPLETE` | 409 | render penuh (R17 atau R07) pada revisi INCOMPLETE | §11.3 |
| EC24 | `CHAPTER_KEY_INVALID` | 422 | kunci bab tidak sesuai C33a/C33b untuk sectionType slot, atau bentrok dengan kunci di slot berulang lain | `{ "slotKey": "appendices", "key": "3", "pattern": "^[A-Z]$" }` |

Kode lama yang dipakai ulang tanpa perubahan: `SCHEMA_INVALID`, `PARAM_CLASS_K_FORBIDDEN`, `PARAM_CLASS_T_READONLY`, `PARAM_UNKNOWN_KEY`, `ASSET_TOO_LARGE`, `ASSET_TYPE_UNSUPPORTED`, `FORBIDDEN`, `DOCUMENT_NOT_FOUND`, `TEMPLATE_NOT_FOUND`, `MISSION_REF_NOT_FOUND`, `DOC_NUMBER_EXISTS`, `VERSION_CONFLICT`, `CHANGE_FIELDS_REQUIRED`, `CHANGE_NOTE_REQUIRED`, `ADDRESS_INVALID`, `ADDRESS_NOT_FOUND`, `FILE_NOT_FOUND`, `RATE_LIMITED`, `RENDER_QUEUE_FULL`.

Amandemen DOC-5 (register 05 §13.1, AM-05; D-363, D-367): empat kode berikut **didefinisikan di register 05**; baris di bawah hanya rujukan dengan nama identik. `STUDIO_ERROR_CODES` / `STUDIO_ERROR_HTTP` kini **73** = 44 lama + 24 (EC01-EC24) + `ROUTE_NOT_FOUND` (D-336) + 4 (EC25-EC28).

| ID | Kode | HTTP | Definisi dan pemeriksa |
|---|---|---|---|
| EC25 | `CONTRACT_REF_NOT_FOUND` | 422 | register 05 §13.1; I55 (langkah 9a) |
| EC26 | `CONTRACT_REF_PID_NOT_FOUND` | 422 | register 05 §13.1; I55 (langkah 9a) |
| EC27 | `CONTRACT_ITEM_KEY_DUPLICATE` | 422 | register 05 §13.1; I54 (langkah 6b) |
| EC28 | `CHART_CUSTOM_FORM_UNSUPPORTED` | 422 | register 05 §13.1; compose, sesudah langkah 7 dan sebelum langkah 9a (Amandemen DOC-FIX-B, F-01; semula tertulis "by-construction (langkah 9)") |

Cara hitung (DC-32, 2026-10-30): Grep `^  "[A-Z][A-Z0-9_-]+",$` di `L/contract/enums.ts`; baris yang jatuh di dalam `STUDIO_ERROR_CODES` (`enums.ts:263-349`) = 264-299 (36) + 301-304 (4) + 307 (1) + 311-313 (3) + 316-339 (24) + 342 (1) + 345-348 (4) = **73**. HTTP 422 keempat kode: `L/contract/errors.ts:96-99`. checkId `SCHEMA_V2_CHECK_IDS` (E41) kini 14 (`enums.ts:437-444` + `446-451`; CH-01..CH-06 register 05 §5.4).

### 11.3 Details terstruktur

```json
// SCOPE_CONFLICT kiriman yang akan menimpa suntingan PATCH (D-324)
{ "scope": "chapter:4", "reason": "PATCHED_PIDS_OVERWRITTEN", "baseRevisionNo": null, "referenceRevisionNo": 2,
  "latestRevisionNo": 3, "changedInRevisionNo": 3, "changedBy": "agent:gsp-analis-02",
  "overwrittenPids": [{ "pid": "p-d1g5j8n3mq", "address": "4.1.2", "editedInRevision": 3, "editedBy": "agent:gsp-analis-02" }],
  "readContent": "GET /api/studio/documents/{id}/content", "forwardToController": "…" }
// PDF_ENGINE_UNAVAILABLE preflight R17/R07 (D-325), + header Retry-After: 300
{ "stage": "preflight", "jobCreated": false, "reason": "…", "causes": [{ "code": "FONTS_NOT_LOADED_IN_SESSION", "message": "…", "count": 17 }],
  "retryable": true, "requiresOperatorAction": true, "retryAfterSec": 300, "requestedFormats": ["docx", "pdf"],
  "suggestedFormats": ["docx"], "statusEndpoint": "GET /api/studio/render-env", "checkedAt": "…" }
// SCOPE_CONFLICT
{ "scope": "pid:p-d1g5j8l3mn", "pid": "p-d1g5j8l3mn", "baseRevisionNo": 7, "changedInRevisionNo": 8,
  "changedBy": "gsp-analis-02", "currentContent": { "type": "paragraph", "id": "p-d1g5j8l3mn", "text": "…" } }
// DOCUMENT_INCOMPLETE
{ "completeness": { /* CompletenessReportV2 */ }, "allowedScopes": ["chapter", "slot"], "forwardToController": "…" }
// RENDER_FIELD (400 SCHEMA_INVALID, D-247; menggantikan renderRefused KD-27)
[{ "pointer": "/render", "keyword": "additionalProperties", "checkId": "RENDER_FIELD",
   "message": "render tidak diterima di kiriman atau sunting; build dokumen lewat POST /api/studio/documents/{id}/render sesudah kiriman tersimpan (…)" }]
// BY_CONSTRUCTION_FAILED pada kiriman bab (D-275): pointer badan + mergedPointer
[{ "pointer": "/chapter/sections/0/title", "mergedPointer": "<lokasi di dokumen tergabung>", "checkId": "DATUM-04", "keyword": "byConstruction", "message": "…" }]
```

### 11.4 Lint rilis baru (`L/registry/lint.ts`, kelompok D; tidak menahan berkas)

| ID | `LintDef.id` | Status | Tier | `module` |
|---|---|---|---|---|
| LD-01 | `SLOT_CONTENT_MISSING` | FAIL bila ada slot wajib `EMPTY`/`PARTIAL` di revisi yang dirilis | NOTA, TERBIT, SERAH | structure |
| LD-02 | `CONTENT_CHAPTER_GAP` | FAIL (TERBIT, SERAH) / REPORT (NOTA) bila `chapters.*.missing` tidak kosong | semua | structure |
| LD-03 | `SCHEMA_V1_ADAPTED` | REPORT; `details` = `AdaptReportV1` (§14.3) | semua | structure |
| LD-04 | `INLINE_FORMAT_STRIPPED` | REPORT; hitungan per nama medan | semua | scan |

Medan lain LintDef: `stage: "build"`, `hqMode: ["S"]`, `partial: false`, `ruleRef: "D-131"` (LD-01, LD-02) atau `"D-138"` (LD-03, LD-04), `blocksIngest: false`.

## 12. Route R01-R20 (+ R21-R23, register 05)

Semua route: `export const dynamic = "force-dynamic"`, `requireSession`, `getStudioCaller`, gerbang kepercayaan D-98/D-134, rate limit FIX-1, helper `L/http/**` (baca saja). `STUDIO_ROUTES` (C16) diperluas R12-R20; `studioRoutePath` menerima `params.pid`.

| ID | Path | Metode | Status | Permintaan | Respons sukses | Galat khusus |
|---|---|---|---|---|---|---|
| R01 | `/api/studio/templates` | GET | berubah | `?kind=&archived=0&preset=1` (`preset=1` = hanya `isPreset`, `preset=0` = tanpa preset; menggantikan usulan blueprint `?kind=preset` yang bentrok dengan filter `kind` jenis templat) | 200 `{ templates: TemplateSummary[] }` + `isPreset`, `restricted` | - |
| R01 | `/api/studio/templates` | POST | berubah | v2: `{ slug, name, kind, description?, isPreset? (ADMIN), changeNote, template: StudioTemplateV2, expertMode?: boolean }`; v1 datar (01_specs R01) tetap, kunci non-esensial hanya ADMIN | 201 `{ template, version, skeletonSha256 }` | 409 `TEMPLATE_SLUG_EXISTS`; 403 `PARAM_CLASS_K_FORBIDDEN`, `PARAM_SURFACE_FORBIDDEN`, `FORBIDDEN`; 400 `PARAM_CLASS_T_READONLY`, `CHANGE_NOTE_REQUIRED`; 422 `PARAM_UNKNOWN_KEY`, `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE` |
| R02 | `/api/studio/templates/[id]` | GET | berubah | `?version=n&expert=1` | 200 `{ template, version, versions, definition: StudioTemplateV2 }`; `advanced` dan roleFormats hanya ADMIN atau `expert=1` | 404 `TEMPLATE_NOT_FOUND` |
| R02 | `/api/studio/templates/[id]` | POST | berubah | v2: `{ baseVersionNo, changeNote, template: StudioTemplateV2, expertMode? }`; v1 datar tetap (ADMIN) | 201 `{ version, skeletonSha256 }` | 409 `VERSION_CONFLICT`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN`; 400 `PARAM_CLASS_T_READONLY`, `CHANGE_NOTE_REQUIRED`; 422 `SLOT_PARAM_SCOPE_INVALID` |
| R03 | `/api/studio/registry` | GET | berubah | `?kind=` + nilai baru `presets`, `essentials`, `slots`, `paramScopes`; `kind=schema&schemaId=` menerima SID01-SID05 | 200 `{ kind, items }` / JSON Schema. `essentials` = `{ global: EssentialKnobDef[], bySectionType: Record<string, EssentialKnobDef[]> }`; `slots` = C33 + aturan mode; `paramScopes` = `PARAM_SCOPE` | 400 `REGISTRY_KIND_UNKNOWN` |
| R04 | `/api/studio/documents` | GET | berubah | `?mission=&docKey=&agentRequestId=&hermesTaskId=&take=&cursor=` | 200 `{ documents: Array<DocumentSummary & { docKey, completeness: { status, missingRequired } }>, nextCursor }` | - |
| R04 | `/api/studio/documents` | POST | berubah | v1 `StudioIngestRequest` (adaptor, AD-01..AD-16) atau v2 `StudioDocV2` (§7); v2 ke dokumen yang ada: `target: { documentId }` + `baseRevisionNo?` (D-232); `render` = 400 `RENDER_FIELD` (D-247) | 201 v2: `SubmitResultV2` (T2-60c) tanpa build; 200 `unchanged`; v1: respons v1 + `completeness`, `job: null`, `outputs: []` (tanpa build, D-247) | 400 `SCHEMA_INVALID` (`RENDER_FIELD`), `META_REQUIRED_FOR_CREATE`, `DOC_TARGET_AMBIGUOUS`; 403; 404 `TEMPLATE_NOT_FOUND`, `MISSION_REF_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`; 409 `DOC_NUMBER_EXISTS`, `TEMPLATE_MISMATCH`, `META_CONFLICT`, `SCOPE_CONFLICT`; 422 `SLOT_*`, `INLINE_FORMAT_REJECTED`, `BY_CONSTRUCTION_FAILED`, `PID_CONFLICT`, `ASSET_NOT_FOUND`; 413 `ASSET_TOO_LARGE`; 429 |
| R05 | `/api/studio/documents/[id]` | GET | berubah | `?rev=n` | 200 `{ document, revision, tree: AddressNode[] (tetap), slots: SlotNodeV2[], completeness, outputs }`; `SlotNodeV2 = { slotKey, sectionType, label, state, address, pid?, chapters?: [{ key, pid, address, title, sections: [{ sectionNo, pid, address, title, blocks: [{ pid, address, type, artifactLabel? }] }] }] }` | 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | GET | tetap | `?rev=n` | 200 `{ address, blockId, pid, type, content, revisionNo }` | 400 `ADDRESS_INVALID`; 404 `ADDRESS_NOT_FOUND` |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | PATCH | berubah | `{ baseRevisionNo, op, block?, cell?, change }` (`render` = 400 `RENDER_FIELD`, D-247); alamat dipetakan ke pid di revisi `baseRevisionNo` (KD-23) | kode saat ini (tanpa build, D-247): dokumen v2: 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness, job: null, outputs: [] }`, konflik = 409 `SCOPE_CONFLICT`; dokumen v1: 200 `{ revision, addressMap, job: null, outputs: [] }`, konflik = 409 `REVISION_CONFLICT` (`services/revisions/index.ts:356-364`, `v2/service.ts:389-449`) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`RENDER_FIELD`); 409 `SCOPE_CONFLICT` (v2) / `REVISION_CONFLICT` (v1); 404 `ADDRESS_NOT_FOUND`; 422 (termasuk `BY_CONSTRUCTION_FAILED`, D-261) |
| R07 | `/api/studio/documents/[id]/revisions` | GET | tetap | - | 200 `{ revisions: RevisionSummary[] }` + `completeness`, `changeScope`, `schemaId` per revisi | 404 |
| R07 | `/api/studio/documents/[id]/revisions` | POST | berubah | `{ revisionNo, formats? }` | 200 `{ job, outputs, identical, partial, failedFormats, errors }` + header `X-Studio-Render-Status` (D-331) | 404; 409 `RENDER_IN_PROGRESS`; 409 `DOCUMENT_INCOMPLETE` bila revisi itu INCOMPLETE; 503 `PDF_ENGINE_UNAVAILABLE` preflight tanpa job + `Retry-After` (404/409 didahulukan, D-331) |
| R08 | `/api/studio/validate` | POST | berubah | v1 `StudioIngestRequest`, SID01, SID02, SID03, atau `{ schemaId, spec }`; `?preview=html`; SID01 boleh membawa `draftTemplate { template: StudioTemplateV2, base?: { slug, version? } }` (D-272; skema lain = `valid:false` pointer `/draftTemplate`) | 200 `{ valid, issues, lint, completenessPreview?: CompletenessReportV2, submitPreview?, previewHtml?, previewError? }`. SID02/SID03 = dry-run kiriman parsial SR-13 dalam transaksi READ ONLY tanpa kunci, tanpa tulis, tanpa build: `completenessPreview` pasca-gabung, `submitPreview { documentId \| null, docNumber, created, unchanged, rebased, revisionNo, changeScope, chapter? \| slot? }`; galat 4xx layanan (`BY_CONSTRUCTION_FAILED`, `SCOPE_CONFLICT`, `DOCUMENT_NOT_FOUND`, `TEMPLATE_MISMATCH`, `RENDER_FIELD`, …) = `valid:false` dengan isu sama dengan kiriman nyata, termasuk `details` galat apa adanya (mis. `overwrittenPids`, D-331); `previewHtml` = dokumen tergabung (penanda draf bila INCOMPLETE); draf templat: isu ber-pointer `/draftTemplate/template/...`, HTML norm/v2. Dokumen v1 dan v2 kini mendapat HTML pratinjau norm/v2 | 400 `JSON_MALFORMED`; 403 `FORBIDDEN` (templat terbatas, termasuk preset/dasar/hasil draf terbatas untuk pemanggil tak tepercaya, D-98); 413; 429 `RATE_LIMITED` (setiap panggilan R08 dihitung di kuota validasi tersendiri, bawaan 120 per 60 detik per identitas, env `STUDIO_VALIDATE_RATE_LIMIT`/`STUDIO_VALIDATE_RATE_WINDOW_MS`; `?preview=html` juga dihitung di kuota render 30 per 60 detik) (FIX-S2, D-290). Draf yang mengubah kunci di luar hak simpan = `valid:false`, isu `keyword` = kode galat simpan (mis. `PARAM_CLASS_K_FORBIDDEN`) berpointer kunci draf |
| R09 | `/api/studio/artifacts` | GET, POST | tetap | 01_specs R09 | 01_specs R09; POST 201 kini juga `partial`, `failedFormats` + header `X-Studio-Render-Status` (D-325) | 01_specs R09 |
| R10 | `/api/studio/files/[id]` | GET | tetap | 01_specs R10 | 01_specs R10 | 01_specs R10 |
| R11 | `/api/studio/render-env` | GET | tetap | 01_specs R11 | 01_specs R11 | 01_specs R11 |
| R12 | `/api/studio/chapters` | POST | baru | `StudioChapterV2` (SID02) | 201 `SubmitResultV2` (dokumen baru atau revisi n+1), tanpa build (D-247); 200 `unchanged` | 400 `SCHEMA_INVALID` (`RENDER_FIELD`), `DOC_TARGET_AMBIGUOUS`, `META_REQUIRED_FOR_CREATE`; 403 `FORBIDDEN` (templat terpatok terbatas, non-ADMIN, D-235); 404 `DOCUMENT_NOT_FOUND`; 409 `SCOPE_CONFLICT`, `TEMPLATE_MISMATCH`, `META_CONFLICT`; 422 `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `SLOT_ITEMS_OUT_OF_RANGE`, `BLOCK_TYPE_NOT_ADMITTED`, `CHAPTER_KEY_INVALID`, `PID_CONFLICT`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED` (pointer `/chapter/...` + `mergedPointer`, D-275); 413; 415; 429 |
| R13 | `/api/studio/slots` | POST | baru | `StudioSlotV2` (SID03) | 201 `SubmitResultV2`, tanpa build; 200 `unchanged` | seperti R12 (isu by-construction ber-pointer `/payload`) + 422 `SLOT_USE_CHAPTER_ENDPOINT`, `SLOT_INPUT_NOT_ACCEPTED`, `SLOT_UNKNOWN` |
| R14 | `/api/studio/documents/[id]/structure` | GET | baru | `?rev=n` | 200 `{ revisionNo, skeleton: NormSkeletonV2, order: string[], outlines, meta, templateVersion: { slug, versionNo }, completeness }` | 404 |
| R14 | `/api/studio/documents/[id]/structure` | PATCH | baru | `{ op: StructureOp (E33), baseRevisionNo, change, …}`: `reorder {order}`; `omitSlot {slot}`; `restoreSlot {slot, position?}`; `setOutline {slot?, outline: OutlineEntryV2[] \| null}`; `setMeta {meta: DocMetaV2}`; `renumberChapters {slot?, map: Record<string,string>}` (ADMIN); `templateVersion {versionNo}` | 200 `{ revision, addressMap?, completeness }` (tanpa build; `render` = 400 `RENDER_FIELD`) | 403 `FORBIDDEN` (renumber non-ADMIN; `templateVersion` bila versi SAAT INI terbatas, non-ADMIN, N-01); 409 `SCOPE_CONFLICT`, `DOC_NUMBER_EXISTS`; 422 `BY_CONSTRUCTION_FAILED` (D-261); 422 `SLOT_UNKNOWN`, `SLOT_REQUIRED_MISSING`, `SLOT_DUPLICATE`, `SLOT_POSITION_LOCKED`, `SLOT_TYPE_MISMATCH`, `SLOT_FORBIDDEN_FOR_TIER`, `CHAPTER_KEY_INVALID`; 400 `CHANGE_FIELDS_REQUIRED` |
| R15 | `/api/studio/documents/[id]/completeness` | GET | baru | `?rev=n` | 200 `{ documentId, completeness: CompletenessReportV2 }` | 404 |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | GET | baru | `?rev=n&history=1` | 200 `{ pid, kind, address, type, content (v2 + id), revisionNo, history? }` | 404 `PID_NOT_FOUND` |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | PATCH | baru | `{ op: PidOp (E34), baseRevisionNo, block?, section?, chapter?, to?: { before?: pid; after?: pid; section?: { chapterKey, sectionNo, at } }, change }` (`render` = 400 `RENDER_FIELD`, D-247) | 200 `{ revision, pid, newPid?, address, addressMap, rebased, baseRevisionNo, appliedOnRevisionNo, completeness }` (tanpa build) | 400 `CHANGE_FIELDS_REQUIRED`, `SCHEMA_INVALID` (`PID_OP_KIND`, `DISPLAY_FIELD`, `RENDER_FIELD`); 404 `PID_NOT_FOUND`; 409 `SCOPE_CONFLICT`; 422 `PID_CONFLICT`, `BLOCK_TYPE_NOT_ADMITTED`, `ASSET_NOT_FOUND`, `BY_CONSTRUCTION_FAILED` (D-261) |
| R17 | `/api/studio/documents/[id]/render` | POST | baru | `{ scope: "document" \| "chapter" \| "slot", key?, formats?, figures?, revisionNo? }` | 200 `{ job: RenderJobDto & { scope: { kind, key? }, draft }, outputs, completeness, partial, failedFormats, errors }` + header `X-Studio-Render-Status: SUCCEEDED\|PARTIAL\|FAILED` (hasil sebagian tetap 200, D-325) | 409 `DOCUMENT_INCOMPLETE` (scope document); 404 `DOCUMENT_NOT_FOUND`, `ADDRESS_NOT_FOUND` (kunci bab tidak ada), `REVISION_NOT_FOUND`; 422 `SLOT_UNKNOWN`; 429; 503 `PDF_ENGINE_UNAVAILABLE` preflight (tanpa job, §11.3, `Retry-After: 300`), `RENDER_QUEUE_FULL` |
| R18 | `/api/studio/assets` | POST | baru | multipart `file` atau `{ mime, dataBase64 }`; `?mission=` opsional | 201 `{ asset: AssetDtoV2, created: true }`; 200 `{ asset, created: false }` (sha sudah ada). `AssetDtoV2 = { sha256, mime, widthPx, heightPx, bytes, createdAt }` (tanpa path) | 413 `ASSET_TOO_LARGE`, `PAYLOAD_TOO_LARGE`; 415 `ASSET_TYPE_UNSUPPORTED`; 400 `SCHEMA_INVALID`; 429 `RATE_LIMITED` (60/menit, atau kuota byte aset baru 24 jam bergulir: 512 MiB per pengguna sesi, 2 GiB satu ember untuk semua pemegang rahasia internal; `Retry-After`, D-255); 500 `STORAGE_WRITE_FAILED` (ruang disk sesudah tulis < 2 GiB) |
| R18 | `/api/studio/assets` | GET | baru | `?sha256=` (satu) atau `?mission=&take=` (daftar) | 200 `{ asset }` / `{ assets }` | 404 `FILE_NOT_FOUND` (KD-24) |
| R19 | `/api/studio/templates/[id]/skeleton` | GET | baru | `?version=n` | 200 `{ template: TemplateSummary, versionNo, skeleton: StudioSkeletonV1, skeletonSha256, implicit, essentials: { global: EssentialKnobDef[], bySlot: Record<string, EssentialKnobDef[]> } }` | 404 |
| R19 | `/api/studio/templates/[id]/skeleton` | POST | baru | `StudioSkeletonV1 & { baseVersionNo, changeNote, expertMode? }` (simpan = versi baru dengan parameter templat sama) | 201 `{ version, skeletonSha256 }` | 409 `VERSION_CONFLICT`; 403 `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN`, `PARAM_CLASS_K_FORBIDDEN`, `FORBIDDEN`; 400 `PARAM_CLASS_T_READONLY`, `CHANGE_NOTE_REQUIRED`, `SCHEMA_INVALID` (`SKELETON_*`); 422 `SLOT_PARAM_SCOPE_INVALID`, `SLOT_DUPLICATE`, `PARAM_UNKNOWN_KEY` |
| - | `/api/studio/import/markdown` | POST | baru (D-328) | `{ markdown, chapterKey, title?, agentId?, target?, template?, meta?, slot? }`; `?validate=1` (wajib `target`) = `dryRunChapter` R08 | 200 `{ chapter, submission?, report: { importer: "md/v1", warnings, dropped, mapping }, validation, dryRun? }`; hanya konversi (tanpa simpan/render); CLI `scripts/studio/md2chapter.ts` byte-identik | 400 `SCHEMA_INVALID`, `JSON_MALFORMED`; 401; 403; 413 `PAYLOAD_TOO_LARGE` + `details.reason` (`MD_TOO_LONG` 1.000.000 karakter, `MD_TOO_MANY_LINES` 200.000, `MD_TOO_MANY_BLOCKS` 50.000, `MD_TABLE_TOO_WIDE` 100 kolom; badan 4 MiB); 415; 422 `CHAPTER_KEY_INVALID`; 429 (ember impor 60/60 s + ember validasi R08 untuk `?validate=1`; D-337) |
| R20 | `/api/studio/documents/[id]/content` | GET | baru | `?slot=&chapter=&rev=n`; `?shape=content\|submission` (D-347: `submission` = badan siap kirim + `baseRevisionNo` + `submitTo` + `editHints`) | 200 `{ document: { id, docNumber }, revisionNo, slot?, content }`; tanpa parameter = `StudioDocV2Resolved` penuh; `slot` = payload slot; `slot` + `chapter` = `ChapterV2` dengan `id` di bab, section, blok | 400 `SCHEMA_INVALID` (`/query/shape` bukan `content\|submission`, `shape=submission` tanpa `chapter`/`slot`, `/query/agentId` di luar 1..80); 404 `DOCUMENT_NOT_FOUND`, `REVISION_NOT_FOUND`, `ADDRESS_NOT_FOUND`; 422 `SLOT_UNKNOWN`, `SLOT_USE_CHAPTER_ENDPOINT` (`shape=submission` pada slot berulang tanpa `chapter`, `details.chapters`) |
| R21 | `/api/studio/contracts` | GET | baru (rujukan register 05 §9.1; DC-15, D-372) | filter `mission`, `docKey`, `docNumber`, `kind`, `status`, `cardId`, `owner`, `taskRef`, `dueBefore`, `dueAfter`, `take`, `cursor` | 200 `{ contracts: ContractSummaryV2[], nextCursor }` | 400 `SCHEMA_INVALID` (pointer `/query/<nama>`); 401; 429 `RATE_LIMITED` (bucket `query`) |
| R22 | `/api/studio/search` | GET | baru (rujukan register 05 §9.2; DC-16, D-372) | `q` wajib + `mission`, `kind`, `documentId`, `revisionNo`, `type`, `slotKey`, `take`, `cursor` | 200 `{ hits: SearchHitV2[], nextCursor, query }` (hit ber-`pid` + `address`) | 400 `SCHEMA_INVALID`; 401; 429 `RATE_LIMITED` (bucket `query`) |
| R23 | `/api/studio/drafts/check` | POST | baru (rujukan register 05 §9.3; DC-23, D-378, D-381) | `{ markdown, agentId? }` | 200 `DraftCheckResultV2` (T2-70); dry-run R08 per blok, 0 tulis DB, tanpa render | 400; 401; 413 `PAYLOAD_TOO_LARGE` (`details.reason` `DRAFT_TOO_LONG` / `DRAFT_TOO_MANY_BLOCKS`); 415; 429 `RATE_LIMITED` (bucket `validate`, satu tagihan per blok, KD-43) |

T2-60c `SubmitResultV2`: `{ document: { id, docNumber, missionFolder, docKey, template: { slug, versionNo }, tier }; created; unchanged; rebased; baseRevisionNo?; appliedOnRevisionNo?; revision: { revisionNo, changeScope, changeAuto }; chapter?: { slotKey, chapterKey, pid, sha256, blocks: Array<{ address, pid, type, artifactLabel? }> }; slot?: { slotKey, pid?, sha256, address }; completeness: CompletenessReportV2 }`. Amandemen DOC-2 (D-247, D-261): `job`, `outputs`, `renderRefused` tidak lagi diisi kiriman (D-247); medan opsional itu masih ada di tipe kontrak `types/v2/api.ts` sebagai sisa usang.

Berkas draf: `…/rev-<n>/bab-<kunci>/` (CHAPTER slot chapter), `…/rev-<n>/lamp-<kunci>/` (CHAPTER slot appendix), `…/rev-<n>/slot-<slotKey>/` (SLOT). Nama berkas: dasar DATUM + ` Bab <k>` / ` Lampiran <k>` / ` <label slot>`; `StudioOutputFile.draft = true`; penanda `render.draft.marker`.

Amandemen DOC-5 (register 05 §9.4-§9.6, §10, AM-06, AM-07, AM-09, AM-14..AM-16; D-364, D-366, D-367, D-372, D-380):
- `STUDIO_ROUTES` (C16) memuat R21-R23 (`L/contract/env.ts:79-81`); berkas `API/contracts/route.ts`, `API/search/route.ts`, `API/drafts/check/route.ts` ada (Glob 2026-10-30).
- Header kuota: `X-Studio-Quota-Remaining` (C48) dan `X-Studio-Quota-Bucket` (C49) (`env.ts:172, 174`); bucket E53 `render`, `validate`, `import`, `query` (`enums.ts:503`); aturan QH-01..QH-06 (header ada pada setiap respons sesudah tagihan, tidak pada 401; dua bucket → sisa terkecil). Terpasang di R07, R08, R09, R17, impor markdown (DC-19, D-366) dan R21/R22 (D-372).
- Nama berkas final: `<docNumberSafe>_rev<revisionNo>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>` (FN-01..FN-08; `FINAL_FILENAME_PATTERN` C51; artefak `rev0` + awalan `ART-` C53; `env.ts:176-183`), dihitung saat baca tanpa kolom baru (KD-39). Header `X-Studio-Final-Filename` (C50) di R10, HEAD R10, `?name=final|datum` (E57), `OutputFileDto.finalFileName` (AM-09), dan format bawaan HTML dokumen ber-`contractKind` di R17 (C40, KD-41) adalah spesifikasi register 05 yang dikerjakan DC-18/DC-20 (D-380); per Grep 2026-10-30 `API/files/[id]/route.ts` baru mengekspor `GET` (:32). Nama berkas draf di atas (dasar DATUM) tidak berubah.
- R03 `?kind=contracts` (AM-07) diserahkan ke DC-28 (D-367).

Amandemen DOC-FIX-B (F-02; D-387, D-388, D-403, D-407): tiga butir di atas memuat keadaan per DC-32 dan diperbarui sesuai kode.
- Header kuota: selain route yang disebut di atas, R04 POST, R12, R13, R06 PATCH, R16 PATCH, dan R14 PATCH (bucket `render`) serta R23 (bucket `validate`) kini dibungkus `withQuotaHeaders` (FIX-QA, D-403; contoh `API/documents/route.ts:405`, `API/documents/[id]/structure/route.ts:107`, `API/chapters/_shared/submit-kit.ts`, `API/drafts/check/route.ts`). Daftar bucket per route dan aturan bucket per agen ada di register 05 §9.6 amandemen DOC-FIX-B.
- Nama berkas final: R10 `HEAD` dan `?name=final|datum` SUDAH di kode (DC-18/DC-20, D-387): `API/files/[id]/route.ts` mengekspor `GET` dan `HEAD` (`:89`); `?name=` di luar E57 → 400 `SCHEMA_INVALID` `/query/name` (`route.ts:49-53`). Kalimat "baru mengekspor `GET` (:32)" di atas adalah sejarah per DC-32.
- R03 `?kind=contracts` SUDAH di kode (DC-28, D-388): `contractsPayload` (`API/registry/route.ts:276-292`, dipanggil `:445-446`) mengembalikan jenis kontrak berstatus `active`; parameter lain → 400 `SCHEMA_INVALID` `/query/<nama>`.

## 13. Parameter

### 13.1 ParamDef kontrak baru (`L/params/structure.ts`, `origin: "contract"`, `group: "R"`)

`namespace` = segmen pertama kunci. `surface` dan `scope` dicatat di `PARAM_SURFACE` / `PARAM_SCOPE` (§13.5).

| ID | Kunci | Label | Tipe | Default | Kelas | Cakupan | Lapis |
|---|---|---|---|---|---|---|---|
| R-38 | `ingest.inlineFormat` | Kebijakan tampilan inline kiriman v1 | enum `strip`, `reject`, `allow` | `"strip"` | K | `document` | internal |
| R-39 | `render.draft.marker` | Penanda render draf | object `{ text: string; placement: "header" \| "footer" }` | `{ "text": "DRAF", "placement": "header" }` | B | `document` | internal |
| R-40 | `render.run.symbolGlyphs` | Karakter yang dipecah ke wajah simbol | list string (1 karakter per butir) | `["■","◈","◇","△"]` | B | `document` | internal |
| R-41 | `slot.setup` | Pengaturan seksi slot | object `SectionSetup` tanpa `pageSizeTw` (`pageSizeTw` = 400 `PARAM_CLASS_T_READONLY`, pointer `/pageSizeTw`) | `{}` | B | `slot` | advanced |
| R-42 | `slot.placement` | Penempatan tanda tangan | enum `standalone`, `inControlSheet` (berlaku hanya untuk sectionType `signatureBlock`) | `"inControlSheet"` | B | `slot` | essential |
| R-43 | `slot.placeholderText` | Teks pengganti slot kosong pada draf | string (`{label}` diganti label slot) | `"[{label} belum diisi]"` | B | `slot` | advanced |
| R-44 | `page.size` | Ukuran kertas | enum E38 | `"A4"` | B | `document` | essential |
| R-45 | `page.orientation` | Orientasi halaman | enum E39 | `"portrait"` | B | `slot` | essential |
| R-46 | `page.customSizeMm` | Ukuran kertas kustom (mm) | pair `[lebar, tinggi]` atau null (bila diisi menimpa `page.size`) | `null` | B | `document` | advanced |
| R-47 | `grid.marginDensity` | Kerapatan margin | enum E43 | `"standard"` | B | `document` | essential |
| R-48 | `doc.defaultTypeCode` | Kode jenis dokumen bawaan | string (anggota `doc.typeCode`) | `"KT"` | B | `document` | advanced |
| R-49 | `doc.defaultTier` | Tier dokumen bawaan | enum `NOTA`, `TERBIT`, `SERAH` | `"TERBIT"` | B | `document` | advanced |
| R-50 | `chart.composite.columns` | Kolom panel chart komposit | int 1..3 | `3` | B | `section:chart` | advanced |
| R-51 | `chart.composite.gapMm` | Celah panel chart komposit (mm) | mm ≥ 0 | `4` (= `COMPOSITE_DEFAULT_GAP_MM`, `composite.ts:29`); preset Manual 000 menyematkan 4,3 | B | `section:chart` | advanced |
| R-52 | `render.table.columnProfiles` | Profil lebar kolom tabel per `preset` tabel | map `presetName → { colsTw: number[] }` | `{}` | B | `section:table` | advanced (aktif hanya bila KC-6 diterima) |

Amandemen DOC-4 (FIX-TL, D-351/D-352/D-355): R-66 `toc.levels` "Kedalaman daftar isi", int 1..3, bawaan 2, kelas B, lapis lanjutan (ADMIN), cakupan `section:toc` (`params/render.ts:325-334`, `registry/essentials.ts:100`, `registry/slots.ts:171`): 1 = bagian, bab, lampiran; 2 = + section; 3 = cadangan (entri sama dengan 2, medan Word `\o "1-3"`); entri TOC eksplisit tidak terpengaruh. Peran format baru E23 `RoleKey`: `toc.sectionLabel`, `toc.sectionTitle`, `toc.sectionPage` (indentasi tingkat 2, 1 pt lebih kecil) dan `toc.appendixLabel`, `toc.appendixTitle`, `toc.appendixPage` (dipakai hanya bila templat menyetelnya, selain itu peran bab); jumlah `ROLE_KEYS` kini 76. Jumlah parameter terdaftar kini 788 (`ALL_PARAM_COUNT`; render 45 = R-01..R-37, R-59..R-66).

### 13.2 Perubahan ParamDef lama

| ID | Kunci (ID lama) | Perubahan | Alasan |
|---|---|---|---|
| PC-01 | `page.sizeMm` (P4G-01) | kelas B → T, `derive: "pageSizeFromPaper"` (DV-01), lapis derived | KD-25; pesan controller butir 1 |
| PC-02 | `grid.textColumnMm` (P4G-03) | kelas B → T, `derive: "textColumnFromPage"` (DV-02), lapis derived | pesan controller butir 4 |
| PC-03 | `grid.innerMarginMm` (P4G-02), `grid.outerMarginMm` (P4G-06), `grid.topBottomMarginMm` (P4G-12) | kelas tetap B, `derive: "marginsFromDensity"` (DV-03), lapis derived (preset boleh menyematkan) | kenop kerapatan margin |
| PC-04 | `grid.rederiveForNonA4` (P4G-17) | tetap T; lapis internal; perilakunya tercakup DV-02 | satu sumber |
| PC-05 | `render.section.wrapper` (R-09), `render.section.interior` (R-10) | default tanpa `pageSizeTw`; `pageSizeTw` tersimpan diabaikan mesin (dimigrasi ke `page.customSizeMm` bila ≠ turunan) | KD-25 (`render.ts:91,102`) |
| PC-06 | `type.scale.*.size` selain `type.scale.body.size` | lapis derived, `derive: "typeScaleFromBase"` (DV-04); daftar final SR-59 | kenop ukuran fon dasar = `type.scale.body.size` (tidak ada kunci `type.baseSizePt` baru) |
| PC-07 | `color.interior.signal` (P4C-14) | lapis essential sebagai kenop "Warna aksen" (tidak ada kunci `color.accent` baru; peran warna merujuk token `signal`, `color-type.ts:113,206`) | kunci sudah ada |

### 13.3 DeriveFnId baru (`types/params.ts`, SR-04)

| ID | DeriveFnId | Masukan | Keluaran | Rumus |
|---|---|---|---|---|
| DV-01 | `pageSizeFromPaper` | `page.size`, `page.customSizeMm`, `page.orientation` (global) | `page.sizeMm` | `customSizeMm ?? PAPER_SIZE_MM[size]`; landscape menukar lebar/tinggi |
| DV-02 | `textColumnFromPage` | `page.sizeMm`, `grid.innerMarginMm`, `grid.outerMarginMm`, `grid.gutterMm`, `grid.evidenceRailMm`, `layout.railMode` | `grid.textColumnMm` | moda A: `W − inner − outer − gutter − rail`; moda B: `W − inner − outer` |
| DV-03 | `marginsFromDensity` | `grid.marginDensity`, `page.sizeMm` | tiga margin | `standard` = nilai dasar (24/20/26 mm untuk A4; disematkan preset); `compact` = ×0,75, `wide` = ×1,25, dibulatkan 0,5 mm; untuk kertas non-A4 margin dalam/luar diskalakan `W/210`, atas-bawah `H/297` |
| DV-04 | `typeScaleFromBase` | `type.scale.body.size` | `type.scale.*.size` turunan | rasio terhadap 9,5 pt dari nilai registri, dibulatkan 0,1 pt; preset menyematkan nilai terukur |

Turunan yang sudah ada tetap: `grid.fullSpanMm` (`fullSpan`), `grid.allowedFigureWidthsMm` (`allowedFigureWidths` = `[textColumn, fullSpan]`), `grid.pageWidthCheck`. Guard tabel G2 (`registry/lint.ts:161-173`) membaca `grid.allowedFigureWidthsMm`, bukan 128/166 tetap. Catatan: pesan controller menyebut "DATUM-31"; di 01_specs §3.6 DATUM-31 = Mermaid, sedangkan cek lebar yang terbaca di registri adalah G2.

### 13.4 Rantai ukuran kertas dan invarian

`page.size` + `page.orientation` (+ `page.customSizeMm`) → `page.sizeMm` (DV-01) → margin (DV-03) → `grid.textColumnMm` (DV-02) → `grid.fullSpanMm` → `grid.allowedFigureWidthsMm`. Satu sumber untuk DOCX `w:pgSz`/`w:pgMar`, HTML `@page`, PDF (DOCX → soffice, D-15), grid, dan lebar figur.

- Twip: `tw = round(mm × 1440 / 25,4)`. Orientasi landscape: `w:pgSz w:orient="landscape"` dan lebar/tinggi ditukar.
- Slot boleh menimpa `page.orientation` (cakupan `slot`, kenop esensial slot "Orientasi halaman" untuk `chapter` dan `appendix`). Ukuran kertas hanya global.
- Kenop global "Ukuran kertas" (EssentialKnobDef) mencakup `page.size` + `page.orientation` (satu kenop, KD-21).

Invarian uji (SR-60, SR-16, SR-17):

| Masukan | `page.sizeMm` | `w:pgSz` (w × h) | `grid.textColumnMm` | `grid.allowedFigureWidthsMm` |
|---|---|---|---|---|
| A4, portrait, standard, moda A | [210, 297] | 11906 × 16838 | 128 | [128, 166] |
| A4, portrait, standard, moda B | [210, 297] | 11906 × 16838 | 166 | [166] |
| A4 landscape (slot lampiran) | [297, 210] | 16838 × 11906, orient landscape | dihitung dari W = 297 | turunan |
| Letter, portrait | [215,9, 279,4] | 12240 × 15840 | turunan | turunan |

Pemilik perubahan mesin: SR-60 (`L/engine/tokens/**`, termasuk `grid.ts:143` `A4_MM`), SR-16 (`engine/docx/assemble/**`), SR-17 (`engine/html/assemble/**`), SR-05 (`params/structure.ts`, `params/index.ts`), SR-59 (lapis). Berkas tanpa pemilik di blueprint: `L/params/page.ts`, `L/params/render.ts`, `L/engine/docx/package/section.ts`, `L/engine/docx/wrapper/render.ts`, `L/engine/html/base/params.ts` → KC-7.

### 13.5 Cakupan, lapis, izin, resolusi

Tata bahasa cakupan (E32): `document` \| `section:<kunci registri section>` \| `shared:<kelompok>` \| `slot`. Kelompok `shared` (C32a `SHARED_PARAM_GROUP_MEMBERS`): `caption`, `source`, `artifact` → 11 jenis tabel + 4 jenis figur; `marks` → 21 jenis blok isi.

Kunci boleh di M11 sebuah slot ⟺ cakupan `slot`; atau `section:X` dengan X = sectionType slot, atau X ∈ `admits` slot, atau X jenis PAGE_DEVICE (`runningHead`, `registerBlock`, `sealBand`, `spineString`, `evidenceRail`, `datumRule`, `issueStampColophon`); atau `shared:G` dengan anggota G ∩ `admits` tidak kosong. Selain itu 422 `SLOT_PARAM_SCOPE_INVALID`.

Lapis (E31): `essential`, `advanced`, `derived`, `internal`. Sumber: `PARAM_SURFACE` (`L/registry/essentials.ts`) dan `PARAM_SCOPE` (`L/registry/slots.ts`); `ParamDef` mendapat medan opsional `surface?: ParamSurface` dan `scope?: string` yang diisi agregasi `params/index.ts` dari kedua peta (satu sumber).

Izin tulis per kunci yang **berubah** (D-134), berurutan:

| Urutan | Cek | Galat |
|---|---|---|
| 1 | Templat `isPreset` dan pemanggil bukan ADMIN | 403 `PRESET_READONLY` |
| 2 | Templat terbatas/kanonik dan pemanggil bukan ADMIN (IP-43b, D-98) | 403 `FORBIDDEN` |
| 3 | Kunci tidak ada di registri | 422 `PARAM_UNKNOWN_KEY` |
| 4 | Kelas T | 400 `PARAM_CLASS_T_READONLY` |
| 5 | Kunci di slot di luar cakupan | 422 `SLOT_PARAM_SCOPE_INVALID` |
| 6 | Kelas K dan pemanggil bukan ADMIN | 403 `PARAM_CLASS_K_FORBIDDEN` |
| 7 | Lapis `advanced` dan pemanggil bukan ADMIN tanpa `expertMode: true`; lapis `internal` dan bukan ADMIN; lapis `derived` kecuali ADMIN pada templat `isPreset` (sematan) | 403 `PARAM_SURFACE_FORBIDDEN` |

`expertMode` adalah tanda kesadaran pengguna, bukan otorisasi; kelas K tetap ADMIN.

Urutan resolusi nilai efektif per unit (I44 `resolveSlotParams`): (1) default registri → (2) versi preset (rantai `baseVersionId`) → (3) esensial templat → (4) lanjutan templat → (5) esensial slot (M11 `surface=essential`) → (6) lanjutan slot (M11 `surface=advanced`) → (7) kunci lapis derived dihitung ulang dari kenop, kecuali kunci yang disematkan versi preset → (8) kelas T dihitung ulang (`engine/tokens`). Format: format blok (hanya v1 `allow` tepercaya) → roleFormats slot (M12) → roleFormats templat → roleFormats preset → turunan katalog → gaya Normal.

### 13.6 Migrasi templat lama (SR-36, SR-38)

1. Preset dari `resolvedParams` versi terbaru tiap templat lama; nilai terukur disematkan pada kunci yang kini derived.
2. Kunci yang berubah kelas: override `page.sizeMm` lama → `page.size` + `page.orientation` bila cocok E38, selain itu `page.customSizeMm`; override `grid.textColumnMm` lama dibuang bila sama dengan turunan, selain itu dilaporkan (RK-04); `pageSizeTw` di R-09/R-10 → PC-05.
3. Versi baru = `baseVersionId` preset + esensial + kerangka. Penjaga KD-20: `sha256Hex(stableStringify(pick(resolvedParamsBaru, keys(resolvedParamsLama)))) === paramsSha256Lama`. Kunci R-38..R-52 bernilai default/turunan dan dilaporkan terpisah.

## 14. Adaptor v1 → v2 (`services/adapt-v1`, I46)

### 14.1 Setiap medan tingkat atas v1 (16 = 3 permintaan + 13 dokumen)

| ID | Medan v1 | Lokasi | Tujuan v2 | Aturan |
|---|---|---|---|---|
| AD-01 | `agentId` | `StudioIngestRequest` | `agentId` | apa adanya |
| AD-02 | `document` | `StudioIngestRequest` | tingkat atas `StudioDocV2` | dokumen diratakan |
| AD-03 | `render` | `StudioIngestRequest` | (dibuang) | DIGANTIKAN D-247: v1 tidak build; `render` dan `outputs` v1 dibuang adaptor dan dihitung `report.stripped.render` / `report.stripped.outputs`; respons `job: null`, `outputs: []`. Teks asli: v1 selalu meminta render dokumen |
| AD-04 | `$schema` | dokumen | `$schema` | `"studio.doc/v1"` → `"studio.doc/v2"`; `StudioRevision.schemaId = "studio.doc/v1"` (KD-10) |
| AD-05 | `template` | dokumen | `template` | apa adanya |
| AD-06 | `mission` | dokumen | `mission` | apa adanya; `missionDocKey = null` (KD-12) |
| AD-07 | `meta` | dokumen | `meta` | apa adanya (`DocMeta` ⊂ `DocMetaV2`) |
| AD-08 | `register` | dokumen | `register` | apa adanya |
| AD-09 | `overrides` | dokumen | - | tunduk R-38: `strip` dibuang + REPORT; `reject` 422; `allow` tepercaya dipertahankan di snapshot internal (KD-26) |
| AD-10 | `front` | dokumen | `sections.cover`, `sections.controlSheet`, `sections.toc`, `sections.signature` | §14.2 |
| AD-11 | `parts` | dokumen | `sections.content.parts` + `ChapterV2.partId` | `{ id, title, lede }`; `chapterKeys` → `partId` setiap bab; `label`, `body`, `setup`, `order`, `fieldFormats`, `showChapterList` dibuang (tampilan) |
| AD-12 | `chapters` | dokumen | `sections.content.chapters` | §14.3; `key` absen → nomor posisi 1-based sebagai string |
| AD-13 | `appendices` | dokumen | `sections.appendices.chapters` | seperti AD-12; `key` absen → huruf posisi `A`.. |
| AD-14 | `assets` | dokumen | `assets` | `dataBase64` → `{ mime, dataBase64 }`; `path` → server membaca berkas di bawah akar aset, menyimpan M13, menjadi `{ assetRef: "sha256:<hex>" }`; `sha256` saja → `{ assetRef }` (harus ada di M13, selain itu 422 `ASSET_NOT_FOUND`) |
| AD-15 | `outputs` | dokumen | `render.formats` | bila `render.formats` absen |
| AD-16 | `x` | dokumen | `x` | apa adanya; gerbang kepercayaan D-98/D-134 |

Cara cek kelengkapan: properti dokumen di `L/contract/schema/doc.schema.ts:112-133` = 13 (`$schema`, `template`, `mission`, `meta`, `register`, `overrides`, `front`, `parts`, `chapters`, `appendices`, `assets`, `outputs`, `x`) dan properti permintaan di `:141-150` = 3 (`agentId`, `document`, `render`); 16 baris AD = 16 properti (§18).

### 14.2 Halaman depan

| v1 | v2 |
|---|---|
| `front.cover` (`mode auto`, `data: CoverData`) | `CoverPayloadV2`: `kicker` → `tagline`; `titleLines`, `standfirst`, `scopeLine`, `addressLine`, `identityString` apa adanya; `control.rows` → `control`; `colophon.{left,right}` → `colophon`; `colsTw`/`cellFormats`/`firstRowCell`/`rowCell`/`setup`/`mode` dibuang (tampilan) |
| `front.cover` (`mode explicit`, `body`) | `strip`: paragraf ber-`role` `title` → `titleLines`, `standfirst`, `scopeLine`, `addressLine`, `kicker` → `tagline`; `controlBlock` → `control`; `colophon` → `colophon`; item lain dibuang + REPORT. `allow`: snapshot internal = v1 asli |
| `front.controlSheet` (`data: ControlSheetData`) | `ControlSheetPayloadV2`: `title`; `revisionHistory`, `verificationChain`, `distribution` (TableBlock) → `TableV2` (§14.3 tabel); `methodStatement`; `kicker` dibuang (REPORT bila teks ≠ label slot) |
| `front.toc` (`TocSpec`) | `TocPayloadV2`: `entries` (mode static) dipertahankan **hanya** bila slot toc MIXED, selain itu dibuang + REPORT; `kicker`, `title`, `note`, `sealBand`, `setup`, `colsTw`, `fieldFormats`, `mode` dibuang |
| `front.signature` (`SignatureBlock`) | `SignaturePayloadV2`: `roles` apa adanya; `signRowFormat`, `colsTw`, `rowOrder`, `cellFormats` dibuang |

### 14.3 Bab, section, blok, run

| v1 | v2 |
|---|---|
| `Chapter.blockId` | `id` |
| `Chapter.kicker`, `setup`, `fieldFormats` | dibuang |
| `Chapter.runningHeadTitle` | `shortTitle` |
| `Chapter.intro` | `intro` (spacer/device dibuang) |
| `Section.blockId` | `id` |
| `Section.number`, `numberSeparator`, `headingFormat` | dibuang |
| `SpacerBlock`, `DeviceBlock` | dibuang; hitungan di REPORT `SCHEMA_V1_ADAPTED` |
| `BlockCommon.blockId` | `id` |
| `BlockCommon.format`, `runDefaults`, `fieldFormats`, `x` | dibuang (R-38) |
| `paragraph.role` peran halaman depan (DF-61) | `body` + REPORT |
| `paragraph.rail[].label`, `.format` | dibuang |
| `list.style` | `ordered = (style === "number")` |
| `list.items[].marker`, `.format` | dibuang |
| `aside.body[].format`, `monoBlock.lines[].format` | dibuang |
| `TableBlock.layout`, `sourcePlacement`, `format`, `x` | dibuang |
| `ColumnSpec.widthTw`, `widthMm`, `align` | dibuang (RK-01) |
| `Row.cantSplit`, `repeatHeader` | dibuang |
| `Cell.widthTw`, `borders`, `marginsTw`, `shading`, `vAlign` | dibuang; `paragraphs[].format` dibuang |
| `Caption` `{label, separator, inline, labelProps, format}` | `CaptionV2` = `inline` |
| `SourceLine` `{inline, provenance, format}` | `SourceV2` = `inline` + `provenance` |
| `FigureCommon.widthMm`, `heightMm`, `paragraphFormat` | dibuang (RK-10) |
| `chart.spec` (`StudioChartV1`) | `ChartV2`: `kind` → `code`; `data` → `data` dengan `accent: true` → `highlight` (label/nama/id/kode, atau indeks bila tanpa label); `unit`, `dec`, `note` apa adanya; `limit`/`limitLabel` → `limit: {value, label}`; `composite.panels[]` → `panels[]` (`spec.data` → `data`, `spec.limit`/`spec.limitLabel` → `limit: {value, label}`, `caption`, `axisNote`); `params` pembawa DATA (RQ-11, D-223) → `data`: P-09 `targets`/`target` → `points[].target`, P-13 `divider` → `divider`, S-01 `binEdges` → `binEdges`, S-08 `sectors` → `sectors`; sorotan `params.accentCategory` (P-14) dan `params.accentSectorDeg` (S-08, sebagai indeks sektor) → `highlight` bila belum ada sorotan dari `accent`; sisa `params` (mis. `axis`, `max`, `belowTargetColour`, `compassLabels`, `medianLabel`) dibuang dan dihitung; `title`, `id`, `source`, `widthMm`, `heightMm`, `apparatus`, `inDocument`, `params`, `style`, `composite.columns`, `composite.gapMm` dibuang |
| `chart.spec` `{ artifactId }` | `artifactId` |
| `diagram.spec` | `DiagramV2.spec` (T2-27) atau `artifactId` |
| `image.asset` | `asset` (kunci yang sama) |
| `symbolSheet.cols` | dibuang |
| `derivation.id` | dibuang (label milik mesin) |
| Run `b` / `i` | `strong` / `em` (212 penanda di benchmark, `05:91`) |
| Run `vertAlign` superscript / subscript | `sup` / `sub` |
| Run `faceRole: "mono"` | `code: true` |
| Run `faceRole: "symbolGlyph"` | dibuang; teks tetap; mesin mendeteksi ulang dengan `render.run.symbolGlyphs` (42 run di benchmark) |
| Run `field` | run dibuang + REPORT |
| Run `face`, `szHalfPt`, `color`, `caps`, `smallCaps`, `spacingTw`, `u` | dibuang (R-38) |

`AdaptReportV1` (isi LD-03; didefinisikan di sini): `{ schema: "studio.doc/v1"; policy: "strip" \| "reject" \| "allow"; stripped: Record<string, number>; dropped: { spacer: number; device: number; symbolGlyphRuns: number; fieldRuns: number; frontItems: number; tocEntries: number }; renamed: Record<string, number> }`.

## 15. Antarmuka modul

| ID | Modul (`L/services/...`) | Pemilik | Ekspor (tanda tangan) |
|---|---|---|---|
| I44 | `skeleton/index.ts` | SR-06 | `getSkeleton(templateVersionId: string): Promise<{ skeleton: StudioSkeletonV1; skeletonSha256: string; implicit: boolean }>`; `implicitSkeleton(plan: SectionPlan, tier: StudioTier): StudioSkeletonV1`; `skeletonSha256(s: StudioSkeletonV1): string`; `resolveSlotParams(tpl: ResolvedTemplate, slot: TemplateSlotDef, presetPins: ReadonlySet<string>): ResolvedSlot`; `checkTemplateWrite(caller: StudioCaller, tpl: { isPreset: boolean; restricted: boolean }, changes: ParamChange[]): void` (melempar §13.5) |
| I45 | `compose/index.ts` (murni) | SR-08 | `validateStructure(skeleton: NormSkeletonV2, tier: StudioTier, input: StructureInput): void`; `composeV2(input: ComposeInput): ComposeResult` (`{ snapshot: NormDocSnapshotV2; rows: StructureRows }`); `mergeSubmission(current: StudioDocV2Resolved, sub: StudioDocV2 \| StudioChapterV2 \| StudioSlotV2): MergeResult` (`{ doc, scopes: string[], changed: boolean }`); `scopeSha256(x: unknown): string`; `stripIds<T>(x: T): T` |
| I46 | `adapt-v1/index.ts` (murni) | SR-09 | `adaptV1(req: StudioIngestRequest, policy: InlineFormatPolicy, trusted: boolean): { doc: StudioDocV2; internal?: StudioDocV1; report: AdaptReportV1 }` |
| I47 | `structure/index.ts` | SR-10 | `writeRevisionRows(tx, revisionId: string, rows: StructureRows): Promise<void>`; `readRows(revisionId: string): Promise<StructureRows>`; `rebuildSnapshot(revisionId: string): Promise<NormDocSnapshotV2>` (cek sha rekonstruksi); `projectContent(revisionId: string, q: { slot?: string; chapter?: string }): Promise<unknown>`; `dbPidAllocator(tx, documentId: string): PidAllocator` |
| I48 | `completeness/index.ts` (murni) | SR-11 | `computeCompleteness(input: CompletenessInput): CompletenessReportV2`; `completenessTexts(r: CompletenessReportV2, ctx: { docId; docNumber; missionFolder?; docKey? }): Pick<CompletenessReportV2, "message" \| "nextSteps" \| "forwardToController">` |
| I49 | `submit/index.ts` | SR-13 | `submitDocumentV2(caller, body: StudioDocV2): Promise<SubmitResultV2>`; `submitChapter(caller, body: StudioChapterV2): Promise<SubmitResultV2>`; `submitSlot(caller, body: StudioSlotV2): Promise<SubmitResultV2>`; `withDocumentLock<T>(target: ResolvedTarget, fn: (tx) => Promise<T>): Promise<T>` |
| I50 | `revisions/` (tambahan) | SR-14 | `patchPid(caller, documentId, pid, body): Promise<PatchPidResult>`; `patchStructure(caller, documentId, body): Promise<StructureResult>`; `pidHistory(documentId, pid): Promise<PidHistoryEntry[]>` |
| I51 | `render/` (tambahan, selain `pure/`, `figures.ts`) | SR-15 | `renderScope(caller, documentId, req: { scope: RenderScopeName; key?; formats?; figures?; revisionNo? }): Promise<RenderScopeResult>` |
| I52 | `images/` (tambahan) | SR-19 | `storeAsset(caller, input: AssetInputV2 \| { file: Uint8Array; mime?: string }, missionFolder?: string): Promise<{ asset: AssetDtoV2; created: boolean }>`; `resolveAssetRef(ref: string): Promise<StudioAssetRow>` |
| I53 | `render/pure` (IP-43a) dipakai | IP-43a (tulis), SR-15/SR-33 (pakai) | Lihat §15.1 |

### 15.1 Antarmuka orkestrator tanpa DB (IP-43a)

Yang sudah ada (`pure/index.ts:8-17`, `pure/render.ts:61-93,160`): `renderSnapshot(snapshot: NormDocSnapshot, template: ResolvedTemplate, opts?: PureRenderOptions): Promise<PureRenderResult>`, dengan `extendContext?: (ctx: RenderContext) => RenderContext`.

Delta aditif (kontrak SR-04; implementasi pure/ oleh pemilik yang ditetapkan KC-10):

| Nama | Perubahan |
|---|---|
| `renderSnapshot` parameter 1 | `NormDocSnapshot` → `AnyNormSnapshot` (T2-54); `asSnapshot` menerima `studio.norm/v2` dengan `doc.chapters` boleh `[]` |
| `PureRenderOptions.scope?` | `RenderScope = { kind: "DOCUMENT" } \| { kind: "CHAPTER"; key: string } \| { kind: "SLOT"; key: string }` (bawaan DOCUMENT; tipe `RenderScope` didefinisikan di sini) |
| `PureRenderOptions.draft?` | `boolean` (bawaan `scope.kind !== "DOCUMENT"`) |
| `PureRenderOptions.slots?` | `ReadonlyMap<string, ResolvedSlot>`; diteruskan ke `RenderContext.slots` (alternatif: lewat `extendContext`, yang sudah ada) |
| `PureRenderOptions.pidSeed?` | `string`; dipakai bila `renderSnapshot` dipanggil lewat jalur compose murni (SR-33) |
| `RenderContext.slots?` | `ReadonlyMap<string, ResolvedSlot>` (kontrak `engine.ts`) |
| `RenderContext.scope?`, `RenderContext.draft?` | seperti di atas |
| `ResolvedSlot` | `{ slotKey: string; sectionType: string; label: string; params: ParamMap; roleFormats: RoleFormatMap; placeholderText: string }` (didefinisikan di sini) |

Jalur CLI (SR-33): `StudioDocV2` + `StudioTemplateV2` atau `ResolvedTemplate` → `implicitSkeleton`/`getSkeleton` lokal → `composeV2` dengan `PidAllocator` deterministik → `renderSnapshot(…, { scope, slots, pidSeed })`. Tanpa `DATABASE_URL`.

## 16. Konstanta dan enum TypeScript

### 16.1 Konstanta (`L/contract/env.ts` kecuali disebut)

| ID | Nama | Nilai |
|---|---|---|
| C18 | `SLOT_KEY_PATTERN` | `"^[a-z][a-zA-Z0-9]{0,31}$"` |
| C19 | `PID_PATTERN` | `"^[a-z0-9][a-z0-9-]{2,63}$"` |
| C20 | `PID_GENERATED_PREFIX` | `"p-"` |
| C21 | `PID_ALPHABET` | `"0123456789abcdefghjkmnpqrstvwxyz"` |
| C22 | `PID_RANDOM_LENGTH` | `10` |
| C23 | `DOC_KEY_PATTERN` | `"^[a-z0-9]+(-[a-z0-9]+)*$"` (maks 64) |
| C24 | `STUDIO_LOCK_DOC_PREFIX` | `"studio-doc:"` |
| C25 | `STUDIO_LOCK_MISSION_DOC_PREFIX` | `"studio-mdoc:"` |
| C26 | `ASSET_KEY_PATTERN` | `"^[a-z0-9][a-z0-9-]{0,63}$"` |
| C27 | `ASSET_REF_PATTERN` | `"^sha256:[0-9a-f]{64}$"` |
| C28 | `STUDIO_SUBMIT_TX_TIMEOUT_MS` | `60000` |
| C29 | `DISPLAY_FIELDS_GLOBAL` | himpunan DF-01..DF-52 (`L/contract/schema/v2/forbidden.ts`) |
| C30 | `DISPLAY_FIELDS_BY_LOCATION` | peta DF-53..DF-71 (berkas sama) |
| C31 | `V1_FIELD_RENAMES` | peta VF-01..VF-14 (berkas sama) |
| C32 | `STUDIO_COMMON_V2_SCHEMA_ID` | `"common/v2"` |
| C32a | `SHARED_PARAM_GROUP_MEMBERS` | §13.5 (`L/registry/slots.ts`) |
| C33 | `SLOT_SECTION_TYPES` | `["cover","controlSheet","signatureBlock","toc","chapter","appendix","sourceRegister","ruleIndex"]` (`L/registry/slots.ts`); + `"contractRecord"` (8 → 9, AM-01 register 05 §6.2, D-371; `slots.ts:29-40`) |
| C33a | `CHAPTER_KEY_NUMERIC_PATTERN` | `"^[1-9][0-9]{0,2}$"` |
| C33b | `CHAPTER_KEY_LETTER_PATTERN` | `"^[A-Z]$"` |
| C33c | `STUDIO_ASSET_REL_DIR` | `"assets"`; `relPath` M13 = `assets/<sha256[0..2]>/<sha256>.<png\|jpg>` relatif `STUDIO_WORKSPACE_ROOT` |

Diperluas tanpa nama baru: C16 `STUDIO_ROUTES` (+R12..R20; +R21..R23 AM-06 register 05), C17 `STUDIO_SCHEMA_IDS` (+SID01..SID05). Konstanta lanjutan C34..C60 (termasuk C48-C53 header kuota dan nama final, C59/C60 `chart.custom`) didefinisikan di register 05 §14.1. Dipakai ulang: `IMAGE_MAX_SIDE_PX` 20000, `IMAGE_MAX_PIXELS` 80.000.000 (`services/images/decode.ts:14,16`), `STUDIO_MAX_JSON_BYTES` (C09).

### 16.2 Enum TS (`L/contract/enums.ts`)

| ID | Konstanta / tipe | Nilai |
|---|---|---|
| E29 | `STUDIO_SLOT_STATES` / `StudioSlotState` | `FILLED`, `AUTO_READY`, `EMPTY`, `PARTIAL`, `OPTIONAL_EMPTY`, `OMITTED` |
| E30 | `STUDIO_IDENTITY_KINDS` / `StudioIdentityKind` | `CHAPTER`, `SUBSECTION`, `BLOCK` |
| E31 | `PARAM_SURFACES` / `ParamSurface` | `essential`, `advanced`, `derived`, `internal` |
| E32 | `PARAM_SCOPE_KINDS` / `ParamScopeKind` | `document`, `section`, `shared`, `slot` |
| E33 | `STRUCTURE_OPS` / `StructureOp` | `reorder`, `omitSlot`, `restoreSlot`, `setOutline`, `setMeta`, `renumberChapters`, `templateVersion` |
| E34 | `PID_OPS` / `PidOp` | `replace`, `insertBefore`, `insertAfter`, `delete`, `move` |
| E35 | `INLINE_FORMAT_POLICIES` / `InlineFormatPolicy` | `strip`, `reject`, `allow` |
| E36 | `PARAGRAPH_ROLES_V2` / `ParagraphRoleV2` | `body`, `lede`, `note`, `subheading`, `identity`, `anchor`, `pivot`, `closingAction` |
| E37 | `RUN_MARKS_V2` / `RunMarkV2` | `strong`, `em`, `code`, `sup`, `sub` |
| E38 | `PAPER_SIZES` / `PaperSize` + `PAPER_SIZE_MM` | `A4` [210, 297], `A3` [297, 420], `A5` [148, 210], `Letter` [215,9, 279,4], `Legal` [215,9, 355,6], `F4` [215, 330] (**hipotesis** nilai lazim Indonesia, KC-11) |
| E39 | `PAGE_ORIENTATIONS` / `PageOrientation` | `portrait`, `landscape` |
| E40 | `RENDER_SCOPE_NAMES` / `RenderScopeName` | `document`, `chapter`, `slot` (API; dipetakan ke E27) |
| E41 | `SCHEMA_V2_CHECK_IDS` | `DISPLAY_FIELD`, `V1_FIELD`, `PID_OP_KIND`, `SKELETON_POSITION`, `SKELETON_SECTION_TYPE`, `SKELETON_REPEATABLE`, `SKELETON_CONTENT_MODE`, `SKELETON_ADMITS`; + CH-01..CH-06 register 05 §5.4 (8 → 14, `enums.ts:437-451`) |
| E42 | `CHAPTER_EXPECTED_SOURCES` | `outline`, `contiguous` |
| E43 | `MARGIN_DENSITIES` / `MarginDensity` | `compact`, `standard`, `wide` |

Enum lanjutan E44..E57 (jenis kontrak, status laporan/butir, vonis, `QUOTA_BUCKETS`, kode peringatan/isu draf, `FINAL_NAME_MODES`, bentuk `chart.custom`) didefinisikan di register 05 §14.2.

## 17. Risiko, butir controller, kriteria penerimaan

### 17.1 Risiko (tambahan atas R1-R14 blueprint)

| ID | Risiko | Kemungkinan / dampak | Bukti | Mitigasi / pemilik |
|---|---|---|---|---|
| RK-01 | Lebar kolom tabel dibuang dari v2 → tabel benchmark dirender dengan lebar templat, BM3/BM4 (D-17) bisa turun | Tinggi / tinggi | `doc.json:242-258` (`widthTw` per kolom); SC-11 | KC-6: profil lebar per `preset` tabel (R-52) atau algoritma lebar otomatis; SR-32/SR-51 mengukur |
| RK-02 | Daftar isi statis benchmark (halaman literal) dan label bangkitan (kicker bab, "Bagian I") harus identik teks untuk 4.544 unit | Sedang / tinggi | `doc.json:849` (`toc mode static`) | Slot toc Manual 000 MIXED (T2-41); SR-32 membandingkan unit teks |
| RK-03 | `RESTRICT` pada FK identitas dapat menggagalkan hapus dokumen | Sedang / sedang | KD-07 (hipotesis) | NoAction; SR-53 menguji hapus dokumen uji |
| RK-04 | `grid.textColumnMm` menjadi T: templat dengan override berbeda dari turunan kehilangan nilai | Rendah / sedang | PC-02 | §13.6 butir 2 melaporkan; preset menyematkan margin |
| RK-05 | Dokumen v1 yang tidak memuat slot wajib (kerangka implisit) kini INCOMPLETE → render penuh ditolak (perubahan perilaku) | Sedang / sedang | KD-27, AD-03 | KC-8; SR-46/SR-49 memeriksa 4 fixture v1 |
| RK-06 | Unik `(missionFolder, missionDocKey)` membuat kiriman v2 kedua tanpa `docKey` ke misi yang sama menjadi pembaruan, bukan dokumen baru | Pasti / rendah | §7.1 butir 5 | Didokumentasikan di panduan SR-35 |
| RK-07 | Register digabung penulis-terakhir-menang lintas bab paralel | Sedang / sedang | §4.5 | Tercatat di `changeScope`; panduan menyarankan kunci register berprefiks bab |
| RK-08 | Satu sumber ukuran halaman menyentuh berkas tanpa pemilik baris | Pasti / sedang | §13.4 | KC-7 |
| RK-09 | Komposit chart: kolom/celah dari parameter; nilai benchmark harus disematkan preset Manual 000 | Sedang / sedang | KD-17 | SR-32 menyematkan R-50 = 3, R-51 = 4,3 |
| RK-10 | Lebar gambar raster dari templat (bukan `widthMm`) → BM4 halaman figur raster | Sedang / sedang | §14.3 | SR-51 melaporkan BM4 dengan/tanpa halaman figur (D-129) |
| RK-11 | Penyimpangan dari blueprint: 4 peran retoris dipertahankan (KD-16) | Pasti / rendah | KD-16 | Dicatat untuk SR-55 |
| RK-12 | `ASSET_NOT_FOUND` satu status (422) | Pasti / rendah | KD-24 | - |
| RK-13 | `$schema` (bukan `schema`) di template v2 | Pasti / rendah | KD-14 | SR-04 mengikuti register ini |
| RK-14 | Kelengkapan memakai `chapters.<slotKey>` (bukan `content`) | Pasti / rendah | KD-15 | Contoh E2/E3 di panduan ditulis ulang SR-35 |
| RK-15 | `L/registry/lint.ts` (LD-01..LD-04) tidak punya pemilik baris | Pasti / sedang | §11.4 | KC-9 |
| RK-16 | Delta `pure/` (IP-43a) dibutuhkan SR-15/SR-33 setelah IP-43a selesai | Pasti / sedang | §15.1 | KC-10 |
| RK-17 | Klaim berkas SR-01 belum masuk `file_claims.md` (penulisan ulang berkas ditolak dua kali karena penulis paralel; agen ini tidak punya alat append) | Pasti / rendah | `delegation_progress/data_analyst_sr01.md` | Controller menambahkan 2 baris klaim |

### 17.2 Butir keputusan controller (D-18)

| KC | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| KC-6 | Lebar kolom tabel v2 | (a) R-52 profil lebar per `preset` tabel di templat; (b) lebar otomatis dari peran kolom saja; (c) terima penurunan BM | **(a)**: tampilan tetap milik templat, agen memilih jenis tabel semantik |
| KC-7 | Pemilik berkas ukuran halaman tanpa baris | (a) tambah ke area SR-16 (`docx/package/section.ts`, `docx/wrapper/render.ts`), SR-17 (`html/base/params.ts`), SR-05 (`params/page.ts`, `params/render.ts`); (b) baris baru | **(a)** dengan klaim berurutan setelah RQ-1/RQ-5/RQ-6 di B0 |
| KC-8 | Dokumen v1 INCOMPLETE | (a) ketat D-131 (render penuh ditolak, `renderRefused`); (b) jalur v1 merender seperti dulu | **(a)**, dengan SR-46 memastikan fixture lengkap |
| KC-9 | Pemilik `L/registry/lint.ts` untuk LD-01..LD-04 | (a) SR-18; (b) SR-05 | **(a)**: satu baris lint |
| KC-10 | Pemilik delta `L/services/render/pure/**` setelah IP-43a | (a) SR-15; (b) IP-43a lanjutan | **(a)** |
| KC-11 | Nilai F4 | (a) 215 × 330 mm; (b) 210 × 330 mm | **(a)** (lazim di Indonesia; hipotesis, dapat dikoreksi pengguna) |

### 17.3 Kriteria penerimaan spesifikasi (diukur SR-03, SR-04, SR-05 dan verifier)

| ID | Kriteria | Ambang |
|---|---|---|
| AC-1 | Schema Prisma setelah SR-03 memuat persis M10-M18, MX01-MX07, E26-E28 dengan nama kolom, tipe, atribut, unik, indeks, relasi §3 | `prisma validate` exit 0; diff nama = 0 |
| AC-2 | migration.sql memenuhi penjaga §3.4 | 0 DROP; 9 / 3 / 30 / 20 / 14 |
| AC-3 | Rollback §3.5 hanya objek delta | 9 tabel, 14 kolom, 2 indeks, 3 tipe, 1 baris buku |
| AC-4 | SR-04: SID01-SID05 terbit; E0, E1, E2, E3 lolos ajv; varian E1 bermedan `format` → `DISPLAY_FIELD`; varian bermedan `blockId` → `V1_FIELD` | keluaran ajv dikutip |
| AC-5 | `STUDIO_ERROR_CODES` = 68 (kini 69 dengan `ROUTE_NOT_FOUND`, D-336; kini 73 dengan EC25-EC28 register 05, D-367, cara hitung §11.2); `STUDIO_ERROR_HTTP` memuat EC01-EC24 dengan HTTP §11.2 | hitungan dikutip |
| AC-6 | `STUDIO_ROUTES` memuat R01-R20 (kini R01-R23, AM-06 register 05); berkas route ada untuk R12-R20 (R21-R23: kriteria register 05) | Glob dikutip |
| AC-7 | `parseAddress` menerima `F:<slotKey>` dan `F:<slotKey>/<n>` serta 4 kunci lama (round-trip) | uji asap SR-04 |
| AC-8 | Registri: R-38..R-52 ada sekali; PC-01..PC-07 diterapkan; DV-01..DV-04 di `DeriveFnId` | skrip hitung SR-05 |
| AC-9 | Invarian §13.4 baris A4 portrait | 11906 × 16838, 128, [128, 166] |
| AC-10 | PT-01..PT-09 | fase akhir |

## 18. Verifikasi register

Hitungan diperiksa dengan Grep atas berkas ini setelah penulisan; keluaran dikutip di `<task>/delegation_progress/data_analyst_sr01.md`.

| Register | Prefiks | Jumlah |
|---|---|---|
| Model baru | M10-M18 | 9 |
| Tambahan model lama | MX01-MX07 | 7 (14 kolom SQL) |
| Enum Prisma | E26-E28 | 3 |
| Enum TS | E29-E43 | 15 |
| Id skema | SID01-SID06 | 6 |
| Tipe kontrak v2 | T2-01-T2-60, T2-60a-T2-60c | 63 |
| Kode galat baru | EC01-EC24 | 24 (total 68; kini 73 dengan `ROUTE_NOT_FOUND` + EC25-EC28 register 05) |
| Route | R01-R20 | 20 ID (R12-R20 baru; R21-R23 dirujuk, definisi register 05) |
| Slot bawaan | SL-01-SL-07 | 7 |
| Param kontrak baru | R-38-R-52 | 15 |
| Perubahan param | PC-01-PC-07 | 7 |
| DeriveFnId baru | DV-01-DV-04 | 4 |
| LintDef baru | LD-01-LD-04 | 4 |
| Medan tampilan | DF-01-DF-71 | 71 (52 global + 19 per lokasi); kode kini 73 dengan DF-72/DF-73 register 05 |
| Medan v1 | VF-01-VF-14 | 14 |
| Adaptor tingkat atas | AD-01-AD-16 | 16 = 3 + 13 properti v1 |
| Konstanta | C18-C33, C32a, C33a-C33c | 20 |
| Antarmuka | I44-I53 | 10 |
| Keputusan | KD-07-KD-28 | 22 |
| Uji prinsip | PT-01-PT-09 | 9 |
| Risiko | RK-01-RK-17 | 17 |
| Butir controller | KC-6-KC-11 | 6 |
| Kriteria penerimaan | AC-1-AC-10 | 10 |

## 19. Rujukan ke register 05 (document contract, DC-32)

Register `masterplan/05_document_contract_specs.md` (DC-02, diterima D-363) adalah register nama tunggal fase document contract. Bagian ini hanya indeks rujukan: nama ditulis identik dengan 05; definisi dan rincian tetap di 05. Asal keputusan D-361..D-381 (`decisions/decisions.md:366-386`).

### 19.1 Indeks rujukan

| Butir | Nama (identik register 05) | Definisi di 05 | Bukti kode (2026-10-30) | Asal |
|---|---|---|---|---|
| Section type dan jenis slot | `contractRecord` S30 "Catatan Kontrak"; C33 8 → 9; `activeTiers: []`; slot bawaan `record` | §6.1, §6.2; AM-01, AM-10, AM-11 | `L/registry/sections.ts:471-483` (`activeTiers: NONE` :480), `:666` (52), `:669` (DOCUMENT 30); `L/registry/slots.ts:29-40, 94` | D-371, D-376 |
| Templat kontrak | `laporan-kerja-agen` (CK-01 `agentWorkReport`, NOTA); SL-08 `record`, SL-09 `content`, SL-10 `references` | §1.2, §6.3 | Amandemen DOC-FIX-B (F-02): seed selesai, `prisma/seed-studio.ts:1180-1184` (flag `--contract-templates`), terpasang di v21 (D-385); semula "seed DC-29/DC-30 berjalan" | D-361, D-363, D-379, D-385 |
| Kode galat HTTP | EC25 `CONTRACT_REF_NOT_FOUND`, EC26 `CONTRACT_REF_PID_NOT_FOUND`, EC27 `CONTRACT_ITEM_KEY_DUPLICATE`, EC28 `CHART_CUSTOM_FORM_UNSUPPORTED` (semua 422) | §13.1; AM-05 | `L/contract/enums.ts:345-348`; `L/contract/errors.ts:96-99` | D-363, D-367, D-374, D-375 |
| checkId `SCHEMA_INVALID` | CH-01 `CONTRACT_ENUM`, CH-02 `CONTRACT_PATTERN`, CH-03 `CONTRACT_DATE`, CH-04 `CONTRACT_REF_TARGET`, CH-05 `CHART_CUSTOM_FORM`, CH-06 `SKELETON_CONTRACT_RECORD` | §5.4; AM-04 | `enums.ts:446-451` | D-367 |
| DISPLAY_FIELD | DF-72, DF-73 | §5.5; AM-12 | `L/contract/schema/v2/forbidden.ts:130-140` | D-367 |
| Route | R21 `/api/studio/contracts` (GET), R22 `/api/studio/search` (GET), R23 `/api/studio/drafts/check` (POST) | §9.1-§9.3; AM-06 | `L/contract/env.ts:79-81`; `API/contracts/route.ts`, `API/search/route.ts`, `API/drafts/check/route.ts` | D-372, D-378, D-381 |
| Header kuota | C48 `X-Studio-Quota-Remaining`, C49 `X-Studio-Quota-Bucket`; E53 `QUOTA_BUCKETS`; QH-01..QH-06 | §9.6; AM-16 | `env.ts:172, 174`; `enums.ts:503` | D-364, D-366, D-372 |
| Nama berkas final | FN-01..FN-08; C50 `X-Studio-Final-Filename`, C51 `FINAL_FILENAME_PATTERN`, C52, C53 `ART-`; I59-I62; E57 `final`/`datum` | §10; AM-09, AM-14, AM-15 | `env.ts:176-183`; Amandemen DOC-FIX-B (F-02): R10 `HEAD` (`API/files/[id]/route.ts:89`) dan `?name=final\|datum` (`route.ts:49-53`) sudah di kode, DC-18/DC-20 selesai (D-387); semula "belum di kode" | D-361 (U-2), D-364, D-380, D-387 |
| `chart.custom` | `ChartV2.code` `"custom"` + `form` (T2-66); CU-01..CU-09; C59, C60 = 9; I68 | §12; AM-03 | `L/contract/types/v2/doc.ts:181-183`; `L/registry/charts.ts:1449` | D-368, D-374 |
| Pid butir | `F:record/<n>` bertipe `contractItem`; pewarisan pid per `key` | §5.7; KD-34 | `L/services/compose/contract-record.ts:9, 56-58`; Amandemen DOC-FIX-B (F-02, L1): baris M17 dan pewarisan per `key` sudah di kode (`L/services/structure/rows.ts:219-237`, `:410`; D-383); format pid butir baru berbeda per jalur (§4.6 amandemen DOC-FIX-B, register 05 §5.7) | D-376, D-380, D-383 |
| Data Prisma | M19-M21, MX08-MX12, migrasi `20261030220000_add_studio_contract` | §7 | migrasi terpasang di v21 | D-365 |

### 19.2 Hitungan terverifikasi (sumber = kode)

| Hitungan | Nilai | Cara hitung |
|---|---|---|
| `STUDIO_ERROR_CODES` | 73 (69 → 73) | Grep `^  "[A-Z][A-Z0-9_-]+",$` di `L/contract/enums.ts`, baris 264-348 di dalam `STUDIO_ERROR_CODES` (`:263-349`): 36 + 4 + 1 + 3 + 24 + 1 + 4 |
| DISPLAY_FIELD (C29 + C30) | 73 (71 → 73) | Grep `^  "[A-Za-z_]+", // DF-\d+$` di `forbidden.ts` = 52; Grep `^  "DF-\d+": ` = 21 |
| `SCHEMA_V2_CHECK_IDS` (E41) | 14 (8 → 14) | Grep yang sama di `enums.ts`: baris 437-444 (8) + 446-451 (6) |
| `SLOT_SECTION_TYPES` (C33) | 9 (8 → 9) | Read `L/registry/slots.ts:29-40` |
| `SECTION_REGISTRY_COUNT` | 52 (DOCUMENT 30) | `L/registry/sections.ts:666, 669` |

### 19.3 Ketidakcocokan nama 03 dan 05 (dicatat; 05 tidak disunting baris ini)

| # | Butir | Register 05 | Kode / keputusan | Register 03 mengikuti | Status (Amandemen DOC-FIX-B, F-02) |
|---|---|---|---|---|---|
| 1 | `contractRecord.activeTiers` | §6.1: "semua tier" | `NONE` (`sections.ts:480`); D-371 opsi (a) `[]` | kode + D-371 (§6.2, §19.1); 05 §6.1 perlu amandemen oleh pemilik 05 | Ditutup: register 05 §6.1 "Amandemen DC-33 (D-371, D-384)" mencatat `NONE` |
| 2 | `DisplayFieldLocationRule.alsoAt` | tidak ada | `forbidden.ts:80, 132` | dirujuk sebagai nama kode (§5.1); pencatatan ke 05 saat DC-33 (D-367) | Ditutup: register 05 §5.5 "Amandemen DC-33 (D-367)" mendefinisikan `alsoAt` |
| 3 | Rujukan baris E41 | `enums.ts:430-439` (§0.3, §5.4) | kini `enums.ts:436-452` | baris kode terkini (bukan beda nama) | Ditutup: register 05 §0.3 dan §5.4 "Amandemen DC-33 (D-384)" |

Amandemen DOC-FIX-B: judul seksi ini ("05 tidak disunting baris ini") berlaku untuk baris DC-32. Register 05 sesudahnya diamandemen DC-33 (D-398) dan DOC-FIX-B, sehingga ketiga ketidakcocokan di atas tidak lagi terbuka.

Nama lain yang dirujuk di §0.1-§18 (EC25-EC28, CH-01..CH-06, DF-72/DF-73, R21-R23, C48-C53, E53, E57, CU-01..CU-09, `F:record/<n>`, `contractItem`, `laporan-kerja-agen`, `record`) identik huruf demi huruf dengan register 05.
