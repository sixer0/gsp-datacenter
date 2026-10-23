---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-10-23
agent: task-architect
document: identification/05_structural_sections_blueprint.md (adendum; tidak menggantikan 02_structured.md, hanya menambah baris SR/IP/RQ)
scale_category: Refactor (Refaktor besar lintas lapis; skala Besar)
blueprint_state: refinement pass berdasar kode yang sudah ada (grounded, Glob/Read sesi ini); baris implementasi + Execution Profile wajib
binding_decisions: D-06, D-17, D-21, D-24, D-62, D-90, D-98, D-118, D-119, D-121, D-123, D-127, D-128, D-131, D-133, D-134..D-138, prinsip inti user (§0), keputusan user penyederhanaan parameter (§2.3)
status: needs-review (menunggu persetujuan user lewat Plan Mode; 0 keputusan terbuka untuk user, 5 keputusan untuk controller di bawah D-18)
---

# Blueprint Adendum: Dokumen Terstruktur yang Dapat Dikonfigurasi per Section (Doc Artifact Studio, Swarm HQ v2.1)

Singkatan path: `<task>` = `docs/2026-10-22_doc_artifact_studio`. Semua path relatif ke akar repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1`. `L` = `src/lib/studio`. `API` = `src/app/api/studio`. `UI` = `src/components/studio`. Format tabel langkah dan Execution Profile sama dengan `identification/02_structured.md`.

## 0. Prinsip inti (pembuka; setiap keputusan desain diuji terhadapnya)

> "konten isi dokumen itu dinamis urusan agent. yang kita bentuk disini adalah tools untuk konversi konten menjadi output yang standarisasi. jadi agent tidak perlu mikirin bagaimana cara membuat outputnya lagi. agent cuma kirim konten data dan read/edit via api" (user, diteruskan controller 2026-10-23)

> "722 parameter sekarang berarti perlu di refactor juga ... harus bisa di ringkas. user gak mau terlalu rumit isi banyak2 parameter" (user, diteruskan controller 2026-10-23)

Konsekuensi yang mengikat:
- **(a) Kontrak JSON v2 = data konten murni** per slot, bab, section, dan paragraf. Tidak boleh ada satu pun keputusan tampilan, penomoran, tata letak, atau gaya.
- **(b) Semua keputusan keluaran milik templat dan mesin.** Ini mencakup gaya, penomoran bab/gambar/tabel, header, daftar isi, tanda tangan, pemenggalan, ukuran figur, wajah huruf (termasuk glif simbol provenans), dan format DOCX/PDF/HTML.
- **(c) API agen hanya empat hal:** kirim konten, baca (struktur, status kelengkapan, isi per id), sunting (per id paragraf, bab, atau slot), dan minta render. Respons dan galat ringkas, terstruktur, dan dapat diteruskan apa adanya ke controller agen.
- **(d) Apa pun yang memaksa agen memahami format keluaran adalah cacat desain.**
- **(e) Pengguna templat hanya melihat preset dan parameter esensial.** Mereka memilih satu preset gaya dan mengatur paling banyak sekitar 60 kenop esensial (maksimal 8 per jenis slot). Ratusan kunci rinci tetap ada di mesin, tetapi tersembunyi sebagai lanjutan, turunan, atau internal.

Uji prinsip atas keputusan blueprint ini:

| Keputusan | Vonis | Alasan |
|---|---|---|
| Medan tampilan v1 (`format`, `setup`, `layout`, `widthTw`, `borders`, `cellFormats`, `colsTw`, `fieldFormats`, `numberSeparator`, `spacer`/`device`) | Dihapus dari v2 | (a). Untuk v1 diatur `ingest.inlineFormat` (D-138) |
| Ukuran figur (`widthMm`, lebar 128/166) | Dihapus dari v2 | (b). Lebar dari templat per jenis figur |
| Properti run tipografis (`caps`, `smallCaps`, `u`, `face`, `faceRole`, `szHalfPt`, `color`, `spacingTw`) | Dihapus dari v2 | (a). Tersisa penanda makna `strong`, `em`, `code`, `sup`, `sub`, `tab`, `br` |
| Glif simbol provenans (■ ◈ ◇ △; di v1 `faceRole: "symbolGlyph"`, 42 run di `benchmark/manual000/doc.json`, Grep) | Dideteksi mesin | (b). Compose memecah run pada karakter dari parameter `render.run.symbolGlyphs` |
| Label dan nomor (`kicker` "BAB n", `Section.number`, `Caption.label`, `Caption.separator`) | Dihapus dari v2 | (b). Mesin menomori dari posisi |
| Kunci bab (`"key": "3"`) | Dipertahankan | Identitas isi, bukan tampilan. Label dibangkitkan mesin |
| `structure` (urutan dan penghapusan slot opsional) | Dipertahankan, opsional | Pengecualian yang disahkan user (D-127 butir 1). Bawaan = kerangka templat |
| Jenis chart (`code`) dan data | Dipertahankan | Pilihan analitis = isi. Gaya, warna, ukuran milik mesin; `highlight` = penekanan makna |
| `meta` saat membuat dokumen | Diperkecil ke `title` | Medan lain jatuh ke default templat (`doc.*`) |
| `docKey` | Opsional | Bawaan = slug templat |
| Parameter apa pun di kiriman agen | Tidak ada | (a)(e). Agen tidak pernah mengirim parameter. Templat = preset + esensial, diatur manusia |
| 722 parameter datar di editor templat | Diganti tiga lapis | (e). Lihat §2.3 |
| Respons berisi alamat, pid, label artefak, dan kelengkapan | Dipertahankan | (c) baca |
| Galat struktur (`SLOT_*`) | Dipertahankan | Hanya muncul bila agen mengirim `structure`/slot yang salah; pesan dalam bahasa isi |

## 1. Konteks (naratif, bukan instruksi delegasi)

### 1.1 Permintaan dan keputusan yang mengikat

Sumber: `identification/04_structural_sections_original.md`, D-127, D-128, D-131, D-133, D-138, §0.

1. **Kerangka templat (D-127 butir 1).** Templat memberi kerangka bawaan berurutan berisi slot. Setiap slot adalah satu jenis section dengan konfigurasi sendiri yang tersimpan, dan parameter dikelompokkan per jenis section. JSON boleh menghapus slot opsional dan mengubah urutan. Slot wajib tetap wajib. Slot tak dikenal ditolak.
2. **Format input per jenis section, konten saja (D-127 butir 2, D-119, §0).** Slot konten berisi array berulang bab, lalu section, lalu paragraf/blok. Setiap bab memakai parameter yang sama.
3. **DB ternormalisasi penuh (D-127 butir 3).** Ada slot kerangka per versi templat dan konfigurasi per slot. Dokumen disimpan sebagai revisi, section dokumen, bab, sub-section, dan paragraf/blok. Alamat C.S.P tetap dan revisi berversi (D-06). Migrasi aditif tanpa DROP, diff dikurangi baseline + shadow DB. `migrate dev`/`db push` dilarang (D-21).
4. **Use case (D-128).** Contoh: bab 3 misi A. Satu bab dikirim ke dokumen misi:
   - Dokumen dibuat dengan kerangka bawaan bila belum ada, atau bab di-upsert sebagai revisi bila sudah ada.
   - Kiriman idempoten berdasarkan sha.
   - Gambar/tabel menempati posisi urut, dan penomoran berjalan otomatis.
   - Render bisa dokumen penuh atau bab saja.
5. **Kiriman parsial dan sunting per id (D-131):**
   - Kiriman parsial selalu diterima.
   - Render penuh ditolak selama slot wajib belum lengkap, dengan galat terstruktur yang dapat diteruskan.
   - Setiap respons memuat kelengkapan.
   - Bab berbeda secara paralel tidak saling 409.
   - Dokumen lengkap boleh langsung dirender penuh saat disunting.
   - Sunting per paragraf memakai id stabil.
6. **Uji ditahan (D-133).** Gelombang implementasi hanya memakai gerbang ringan. Semua uji, review, paritas, benchmark, dan E2E pindah ke satu fase akhir. Paralelisasi dimaksimalkan. Persetujuan blueprint ini adalah satu-satunya jeda.
7. **Tampilan inline (D-138).** Tampilan inline dibuang dan dicatat REPORT. Perilakunya diatur `ingest.inlineFormat` (K; `strip` bawaan, `reject`, `allow` hanya ADMIN/harness). Medan tampilan deprecated di v1 dan dihapus di v2. `SpacerBlock` deprecated.
8. **Penyederhanaan parameter (keputusan user).** Ada tiga lapis: preset gaya, parameter esensial per slot dan global, serta lanjutan yang tersembunyi. Duplikat dan turunan dipangkas. Hitungan sebelum dan sesudah dilaporkan per lapis.

### 1.2 Tantangan arsitektur

1. **Mesin render stabil di atas `NormDocSnapshot` v1.** `engine/docx/assemble/units.ts:23-54` membuat satu seksi Word per unit. Strateginya:
   - Bentuk internal blok (Block v1) dipertahankan.
   - Ditambahkan `studio.norm/v2` yang membawa `slotKey`, `sectionType`, dan kerangka.
   - Perakit membuat `RenderContext` per unit dengan parameter hasil resolusi slot.
   - Renderer blok, pembungkus, tabel, dan figur tidak berubah.
   - Compose memetakan konten v2 ke bentuk internal.
2. **Parameter datar dan terlalu banyak.**
   - `ALL_PARAMS` (`params/index.ts:37`) berisi 685 parameter katalog ditambah R-01..R-37 (`params/render.ts:242-248`), sehingga totalnya sekitar 722. Semuanya tampil di editor templat.
   - Pin hitungan usang (`params/index.ts:23-24`).
   - Namespace kunci sejajar dengan jenis section (`cover.*`, `controlSheet.*`, `chapter.*`, `table.*`, `caption.*`, `device.*`; Grep `params/page.ts`, `params/apparatus.ts`) dan registri section memuat `paramRefs` (`registry/sections.ts:44`, `:63`, `:115`), sehingga pengelompokan per jenis murah.
   - Mekanisme preset sudah ada setengah jalan: `StudioTemplateVersion.baseVersionId` membentuk rantai pewarisan, dan resolusinya adalah default registri, lalu rantai versi dasar, lalu override sendiri (D-62).
3. **Kerangka hari ini hanya `sectionPlan` per tier** (`contract/types/params.ts:167-181`, `registry/sections.ts:666-713`). Skema v1 tetap (`contract/types/doc.ts:20-39`). DB: blob templat, snapshot, dan `StudioBlock` datar (`prisma/schema.prisma:818-840`).
4. **Kiriman paralel** membalik cek `baseRevisionNo` global (01_specs §4.2 butir 5) menjadi cek per lingkup dengan serialisasi kunci advisory.
5. **Identitas stabil**: `blockId` stabil tetapi belum unik per dokumen dan belum punya riwayat. Diperlukan tabel identitas.
6. **Benchmark D-17**: `doc.json` konten-saja v1 (RT-01) masih memuat 42 run `faceRole` glif dan 212 penanda `b`/`i` (Grep). Konversi ke v2 harus mempertahankan 4.544 unit teks (D-26) dan profil Manual 000 harus menjadi preset tanpa mengubah nilai efektif.

### 1.3 Kategori skala

Ini Refaktor besar. Postur verifikasinya (D-133):
- Implementasi memakai gerbang ringan: tsc seluruh repo dengan galat diatribusikan, eslint area, migrasi tanpa DROP, dan satu asap fungsi bila perlu.
- Satu fase akhir menjalankan uji, review, paritas, benchmark, E2E, security, lalu verifier.

### 1.4 Asumsi (dapat dikoreksi; dibawa ke SR-01)

| ID | Asumsi | Dasar |
|---|---|---|
| AS-1 | "Index section" = Daftar Isi (`toc`, S03). Indeks Aturan (`ruleIndex`) tersedia sebagai jenis slot opsional | `registry/sections.ts:70-81`, `:426-437` |
| AS-2 | Tanda tangan GSP DATUM dirender di dalam lembar kendali (IP-03, D-66). Di kerangka ia menjadi slot `signature` dengan kenop esensial "penempatan" | `engine/docx/assemble/index.ts:194-207` |
| AS-3 | Perangkat halaman F1-F7 bukan slot aliran. Mereka adalah kelompok parameter yang boleh ditimpa per slot | `registry/sections.ts:466-557` |
| AS-4 | Kunci bab ditetapkan agen; penomoran artefak per bab mengikuti kunci | 01_specs §4.1 |
| AS-5 | Bentuk internal blok = Block v1; v2 = subset semantik yang dipetakan compose | `contract/types/doc.ts:494-505` |
| AS-6 | Snapshot JSON per revisi tetap disimpan sebagai cache render; sumber kebenaran = tabel ternormalisasi, dijaga sha256 rekonstruksi | KD-03; D-06 |
| AS-7 | Preset gaya = templat bertanda `isPreset`. Versinya menjadi `baseVersionId` versi templat yang memakainya (rantai D-62). Tidak perlu tabel nilai baru | `prisma/schema.prisma:710-734` |
| AS-8 | Kenop esensial v2.1 hanya memetakan ke kunci rinci yang sudah ada atau ke turunan T baru di engine/tokens. Kenop yang butuh perilaku mesin baru gugur dari v2.1 dan dicatat | Batas lingkup |

### 1.5 Batasan (mengikat)

- Hanya repo ini dan DB `gsp_agent_hq_v21` (+ `_uji`, `_shadow`).
- Migrasi memakai prosedur D-21/D-24 butir 4-5: baseline, diff dikurangi baseline, 0 DROP, hanya `Studio*`, `migrate deploy`, dan hitungan baris tabel lama identik.
- `WorkerTrace` tidak disentuh.
- Revisi lama dan versi templat lama tidak diubah (D-06, D-62). Migrasi templat membuat versi baru dengan `paramsSha256` efektif yang sama.
- Rollback hanya digladikan di `_uji`.
- Push hanya dengan izin user.

### 1.6 Kontinuitas

- Semua baris perbaikan sudah mendarat: RT-01 (D-138), FIX-1 (D-134), FIX-5 (D-129), FIX-6 (D-130), FIX-8 (D-132, D-135), IP-39a sebagian (D-136), dan IP-39b (D-137).
- FIX-3 dihentikan (D-133).
- Sisa backlog menjadi IP-41..IP-43 dan RQ-1..RQ-6 (`file_requests.md:115-121`).
- FIX-2 dan FIX-4 belum pernah diluncurkan (§3).
- Baris F2 (S75, S77, S98, S80, S82, S81) dan S88 dijalankan sebagai SR-49..SR-54 dan SR-58 (diperluas).

## 2. Ringkasan desain

### 2.1 Konsep

**Preset gaya** (templat `isPreset`, hanya ADMIN yang mengubah) adalah paket nilai lengkap seluruh kunci rinci.

**Templat** adalah:
- satu preset (dipilih sekali);
- nilai kenop esensial global;
- **kerangka** slot berurutan. Setiap slot = jenis section dengan sifat wajib, kunci posisi, berulang, mode isi, dan tier, ditambah nilai kenop esensial slot. Override lanjutan hanya ADMIN.

**Dokumen** adalah rangkaian revisi:
- Instans slot, lalu bab, sub-section, dan blok berpid.
- Agen mengirim konten, membaca, menyunting per id, dan meminta render.
- **Compose** memvalidasi terhadap kerangka, memetakan konten ke bentuk internal, membangun snapshot `studio.norm/v2`, dan menghitung kelengkapan.
- Mesin merakit unit per slot dengan parameter efektif slot.

### 2.2 Model data (Prisma; aditif; migrasi `20261023200000_add_studio_structure`)

Model baru (9). Semua `id String @id @default(cuid())`; `createdAt DateTime @default(now())` bila disebut. Nama dan kolom dikunci SR-01.

| ID | Model | Kolom (nama: tipe, atribut) | Unik / indeks | Relasi |
|---|---|---|---|---|
| M10 | `StudioTemplateSlot` | `templateVersionId: String`; `slotKey: String` (pola `^[a-z][a-zA-Z0-9]{0,31}$`); `sectionTypeKey: String`; `label: String`; `position: Int`; `required: Boolean @default(false)`; `positionLocked: Boolean @default(false)`; `repeatable: Boolean @default(false)`; `minItems: Int?`; `maxItems: Int?`; `contentMode: StudioSlotContentMode`; `tiers: StudioTier[]` (kosong = semua); `admits: String[]`; `configSha256: String`; `createdAt` | `@@unique([templateVersionId, slotKey])`, `@@unique([templateVersionId, position])`, `@@index([sectionTypeKey])` | `templateVersion` (Cascade); `sectionType StudioSectionType` (`sectionTypeKey` ke `key`, Restrict); `params`, `roleFormats`, `docSections` |
| M11 | `StudioTemplateSlotParam` | `slotId: String`; `paramKey: String`; `value: Json`; `paramClass: StudioParamClass` (B atau K; T ditolak); `surface: String` (`essential`/`advanced`, salinan saat tulis) | `@@unique([slotId, paramKey])`, `@@index([paramKey])` | `slot` (Cascade) |
| M12 | `StudioTemplateSlotRoleFormat` | `slotId: String`; `roleKey: String`; `format: Json` | `@@unique([slotId, roleKey])` | `slot` (Cascade) |
| M13 | `StudioAsset` | `sha256: String @unique`; `mime: String`; `bytes: Int`; `widthPx: Int`; `heightPx: Int`; `relPath: String @unique`; `missionFolder: String?`; `createdBy: String`; `createdAt` | `@@index([missionFolder])` | `blocks` |
| M14 | `StudioDocSection` | `revisionId: String`; `templateSlotId: String?` (null = kerangka implisit revisi lama); `slotKey: String`; `sectionTypeKey: String`; `position: Int`; `filled: Boolean`; `payload: Json?`; `payloadSha256: String`; `lastFilledBy: String?`; `lastFilledAt: DateTime?`; `lastFilledRevisionNo: Int?` | `@@unique([revisionId, slotKey])`, `@@unique([revisionId, position])`, `@@index([templateSlotId])` | `revision` (Cascade); `templateSlot` (Restrict); `sectionType` (Restrict); `chapters`, `blocks` |
| M15 | `StudioDocChapter` | `revisionId: String`; `docSectionId: String`; `identityId: String`; `chapterKey: String`; `position: Int`; `partKey: String?`; `title: Json`; `shortTitle: String?`; `contentSha256: String`; `lastFilledBy: String?`; `lastFilledAt: DateTime?`; `lastFilledRevisionNo: Int?` | `@@unique([revisionId, chapterKey])`, `@@unique([docSectionId, position])`, `@@index([revisionId, contentSha256])`, `@@index([identityId])` | `revision`, `docSection` (Cascade); `identity` (Restrict); `subsections`, `blocks` |
| M16 | `StudioDocSubsection` | `revisionId: String`; `chapterId: String`; `identityId: String`; `sectionNo: Int` (0 = intro); `title: Json?`; `contentSha256: String` | `@@unique([chapterId, sectionNo])`, `@@index([identityId])` | `revision`, `chapter` (Cascade); `identity` (Restrict); `blocks` |
| M17 | `StudioDocBlock` | `revisionId: String`; `docSectionId: String`; `chapterId: String?`; `subsectionId: String?`; `identityId: String`; `pid: String`; `address: String?`; `artifactLabel: String?`; `ordinal: Int`; `paraNo: Int?`; `type: String`; `content: Json` (konten v2 apa adanya); `textPlain: String @db.Text`; `contentSha256: String`; `assetId: String?` | `@@unique([revisionId, ordinal])`, `@@unique([revisionId, pid])`, `@@unique([revisionId, address])`, `@@index([subsectionId, paraNo])`, `@@index([identityId])`, `@@index([revisionId, artifactLabel])`, `@@index([revisionId, type])`, `@@index([assetId])` | `revision`, `docSection`, `chapter`, `subsection` (Cascade); `identity`, `asset` (Restrict) |
| M18 | `StudioDocIdentity` | `documentId: String`; `pid: String` (pola `^[a-z0-9][a-z0-9-]{2,63}$`; dari klien atau `p-` + 10 base32); `kind: String` (`CHAPTER`, `SUBSECTION`, `BLOCK`); `createdRevisionNo: Int`; `retiredRevisionNo: Int?`; `createdBy: String`; `createdAt` | `@@unique([documentId, pid])`, `@@index([documentId, kind])` | `document` (Cascade); `chapters`, `subsections`, `blocks` |

Kolom tambahan (ADD COLUMN dengan default):

| Model | Kolom baru | Catatan |
|---|---|---|
| `StudioTemplate` | `isPreset: Boolean @default(false)`; `@@index([isPreset])` | Preset gaya (AS-7). Versi preset hanya dibuat ADMIN |
| `StudioTemplateVersion` | `skeletonSha256: String?`; relasi `slots` | null = versi lama, kerangka implisit |
| `StudioDocument` | `missionDocKey: String?`; `completeness: StudioCompleteness @default(COMPLETE)`; relasi `identities`; `@@unique([missionFolder, missionDocKey])` | |
| `StudioRevision` | `schemaId: String @default("studio.doc/v1")`; `structureSha256: String?`; `completeness: StudioCompleteness @default(COMPLETE)`; `completenessReport: Json?`; `changeScope: String?`; relasi `docSections`, `docChapters`, `docSubsections`, `docBlocks` | |
| `StudioRenderJob` | `scopeKind: StudioRenderScopeKind @default(DOCUMENT)`; `scopeKey: String?` | |
| `StudioOutputFile` | `scopeKind: StudioRenderScopeKind @default(DOCUMENT)`; `scopeKey: String?`; `draft: Boolean @default(false)` | |
| `StudioSectionType` | relasi `templateSlots`, `docSections` | |

Enum baru (3): `StudioSlotContentMode { AUTO INPUT MIXED }`, `StudioRenderScopeKind { DOCUMENT CHAPTER SLOT }`, `StudioCompleteness { INCOMPLETE COMPLETE }`.

Penjaga migrasi (SR-03):
- 0 DROP.
- `CREATE TABLE` = 9 dan `CREATE TYPE` = 3, semuanya berawalan `"Studio`.
- `ALTER TABLE` hanya ADD pada `Studio*`.
- `migrate status` up to date.
- Hitungan baris 7 tabel lama + 9 tabel Studio identik sebelum dan sesudah.

Penyimpanan per revisi = salinan penuh (R6).

Rollback SQL delta (disimpan SR-01; digladikan SR-53 di `_uji` sebelum rollback 01_specs §1.4):

```sql
BEGIN;
DROP TABLE IF EXISTS "StudioDocBlock";
DROP TABLE IF EXISTS "StudioDocSubsection";
DROP TABLE IF EXISTS "StudioDocChapter";
DROP TABLE IF EXISTS "StudioDocSection";
DROP TABLE IF EXISTS "StudioDocIdentity";
DROP TABLE IF EXISTS "StudioAsset";
DROP TABLE IF EXISTS "StudioTemplateSlotRoleFormat";
DROP TABLE IF EXISTS "StudioTemplateSlotParam";
DROP TABLE IF EXISTS "StudioTemplateSlot";
ALTER TABLE "StudioOutputFile" DROP COLUMN IF EXISTS "scopeKind", DROP COLUMN IF EXISTS "scopeKey", DROP COLUMN IF EXISTS "draft";
ALTER TABLE "StudioRenderJob" DROP COLUMN IF EXISTS "scopeKind", DROP COLUMN IF EXISTS "scopeKey";
ALTER TABLE "StudioRevision" DROP COLUMN IF EXISTS "schemaId", DROP COLUMN IF EXISTS "structureSha256", DROP COLUMN IF EXISTS "completeness", DROP COLUMN IF EXISTS "completenessReport", DROP COLUMN IF EXISTS "changeScope";
DROP INDEX IF EXISTS "StudioDocument_missionFolder_missionDocKey_key";
ALTER TABLE "StudioDocument" DROP COLUMN IF EXISTS "missionDocKey", DROP COLUMN IF EXISTS "completeness";
ALTER TABLE "StudioTemplateVersion" DROP COLUMN IF EXISTS "skeletonSha256";
DROP INDEX IF EXISTS "StudioTemplate_isPreset_idx";
ALTER TABLE "StudioTemplate" DROP COLUMN IF EXISTS "isPreset";
DROP TYPE IF EXISTS "StudioSlotContentMode";
DROP TYPE IF EXISTS "StudioRenderScopeKind";
DROP TYPE IF EXISTS "StudioCompleteness";
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261023200000_add_studio_structure';
COMMIT;
```

### 2.3 Permukaan parameter: preset, esensial, lanjutan (keputusan user penyederhanaan)

**Lapis permukaan.** Lapis ini terpisah dari kelas B/K/T: kelas mengatur siapa boleh menulis, lapis mengatur di mana kunci tampil.

| Lapis | Isi | Siapa mengubah | Tampil di |
|---|---|---|---|
| (a) Preset gaya | Paket nilai lengkap SELURUH kunci rinci. Usulan: "DATUM Kanonik" (dari `datum-kanonik`), "GSP DATUM" (dari `datum-gsp`), "DATUM Manual 000" (dari `datum-manual-000`, terbatas). Dipilih SATU kali per templat | ADMIN (editor lengkap) | Pemilih preset di editor templat |
| (b) Esensial | Kenop sedikit dan bermakna per jenis slot (maksimal 8) dan global dokumen (maksimal 8); target total maksimal sekitar 60 | Pemilik templat (kelas B); kenop kelas K hanya ADMIN | Default UI, panduan, API templat |
| (c) Lanjutan | Semua kunci rinci lain yang masih boleh ditimpa | ADMIN atau mode ahli | Panel terlipat "Lanjutan" |
| Turunan | Kunci yang dihitung dari kenop dasar (ukuran fon dasar, grid, warna aksen) kecuali preset menyematkan nilai | Tidak ada (dihitung). Preset boleh menyematkan nilai terukur, mis. Manual 000 | Hanya baca di mode ahli |
| Internal | Kunci paket/mesin (`render.docx.*`, `render.png.dpi`, `ingest.inlineFormat`, `lint.enforcementOverride`, dan sejenisnya) | ADMIN di preset | Tidak di editor templat |

**Hitungan sebelum dan sesudah** (sebelum = terhitung; sesudah = target, angka final dihitung SR-59 dari modul):

| Lapis | Sebelum | Sesudah (target) |
|---|---|---|
| Tampil di editor templat | sekitar 722 (685 katalog + R-01..R-37) | Esensial maksimal sekitar 60 (usulan di bawah: 37) |
| Lanjutan (terlipat, ADMIN/ahli) | 0 (semua datar) | Sisa setelah esensial, turunan, internal (dihitung SR-59) |
| Turunan (T + T-tersemat-preset) | Kelas T yang ada (dihitung SR-59) | Bertambah oleh kunci yang dapat diturunkan dari ukuran fon dasar, warna aksen, grid (daftar duplikat/turunan SR-59) |
| Internal | 0 | `render.docx.*`, paket, lint, ingest (dihitung SR-59) |

**Usulan kenop esensial** (SR-59 memfinalkan pemetaannya ke kunci rinci; kenop tanpa pemetaan atau turunan yang sah gugur, AS-8):

| Lingkup | Kenop esensial (usulan) | Jumlah |
|---|---|---|
| Global dokumen | Ukuran kertas; bahasa; klasifikasi bawaan; warna aksen (turunan peran warna); ukuran fon dasar (turunan skala tipografi); kerapatan margin (turunan grid); logo organisasi; rel bukti (otomatis/aktif/mati) | 8 |
| Sampul (`cover`) | Tampilkan logo; tampilkan subjudul/standfirst; tampilkan baris cakupan; tampilkan pita segel; tampilkan string punggung | 5 |
| Lembar kendali (`controlSheet`) | Tampilkan rantai verifikasi; tampilkan distribusi; tampilkan pernyataan metode; judul halaman | 4 |
| Tanda tangan (`signatureBlock`) | Penempatan (di lembar kendali/terpisah); tata letak (baris/kotak); tampilkan baris tanggal; jumlah kolom | 4 |
| Daftar isi (`toc`) | Judul; kedalaman (bab / bab + section); tampilkan bagian; nomor halaman (medan/statis) | 4 |
| Konten (`chapter`) | Bab mulai halaman baru; kepala berjalan aktif; tampilkan kicker bab; tampilkan Datum Rule bab; posisi caption (atas/bawah); tampilkan baris SUMBER | 6 |
| Referensi (`sourceRegister`) | Judul; urutan (sesuai kiriman/abjad); tampilkan URL | 3 |
| Lampiran (`appendix`) | Mulai halaman baru; judul pembuka | 2 |
| Total | | 36 |

Penomoran per bab bukan kenop (selalu per bab, §2.6 butir 5).

**Cakupan kunci rinci** (masih dibutuhkan mesin; SR-02):

| Cakupan | Aturan | Dapat ditimpa per slot |
|---|---|---|
| `document` | P1, P3, P11-P16, PA-PD; `page`, `grid`, `layout`, `rules`, `color`, `type`, `org`, `doc`, `classification`, `numerals`, `units`, `currency`, `conventions`, `time`, `numbers`, `terbilang`, `lint`, `threshold`; `render.docx.*`, `render.run.*`; `ingest.inlineFormat` | Tidak (422 `SLOT_PARAM_SCOPE_INVALID`) |
| `section:<kunci registri>` | `cover.*`, `controlSheet.*`, P4K-05..06, `toc.*`/`render.toc.*`, `part.*`, `chapter.*`, `render.section.numberSeparator`, `table.*`/`render.table.*`, `specTable.*`, `aside.*`, `derivation.*`, `render.list.*`, `figure.*`, `chart.*`, `diagram.*`, `symbol.*`, `map.*`, `boq`/`ahs`/`vat` | Ya, pada slot yang `sectionType`/`admits`-nya memuat jenis itu |
| `section:<perangkat>` | `device.*`, `runningHead.*` | Ya |
| `shared:<kelompok>` | `caption.*`, `source.*`, `artifact.*`, `marks.*` | Ya, bila slot menerima anggota kelompok |
| `slot` (kontrak baru, `params/structure.ts`) | `slot.setup`, `slot.placement`, `slot.placeholderText`; plus `render.draft.marker`, `render.run.symbolGlyphs` (cakupan document) dan kenop turunan baru (`color.accent`, `type.baseSizePt`, `grid.marginDensity` bila belum ada) | Sesuai cakupan masing-masing |

**Urutan resolusi nilai efektif per unit:**
1. Default registri.
2. Versi preset (rantai `baseVersionId`).
3. Esensial templat (global).
4. Lanjutan templat (ADMIN).
5. Esensial slot (M11 `surface=essential`).
6. Lanjutan slot (M11 `surface=advanced`, ADMIN).
7. Kunci turunan dihitung ulang dari kenop. Kunci yang disematkan preset tetap memakai nilai sematan.
8. Kelas T dihitung ulang (engine/tokens).

**Format** diselesaikan dengan urutan:
1. Format blok (hanya v1 `allow` tepercaya).
2. roleFormats slot (M12).
3. roleFormats templat.
4. roleFormats preset.
5. Turunan katalog.
6. Gaya Normal.

**Kelas:**
- Esensial B dapat diubah pemilik templat.
- K hanya ADMIN (403 `PARAM_CLASS_K_FORBIDDEN`; cek pada kunci yang berubah, D-134).
- T read-only (400).
- Lanjutan dari non-ADMIN di luar mode ahli: 403 `PARAM_SURFACE_FORBIDDEN`.

**Kontrak templat v2** (`studio.template/v2`; dipakai editor templat dan R01/R02/R19; agen tidak memakainya):

```ts
interface StudioTemplateV2 {
  schema: "studio.template/v2";
  preset: { slug: string; version?: number };
  essentials: Record<string, ParamValue>;            // kenop esensial global
  advanced?: Record<string, ParamValue>;             // ADMIN / mode ahli
  skeleton: { slots: TemplateSlotDef[] };
}
interface TemplateSlotDef {
  slotKey: string; sectionType: string; label: string; position: number;
  required: boolean; positionLocked: boolean; repeatable: boolean; minItems?: number; maxItems?: number;
  contentMode: "AUTO" | "INPUT" | "MIXED"; tiers: Array<"NOTA" | "TERBIT" | "SERAH">; admits: string[];
  essentials: Record<string, ParamValue>;            // maksimal 8 kenop jenis slot
  advanced?: Record<string, ParamValue>;             // ADMIN / mode ahli
}
```

Kerangka bawaan GSP DATUM (seed SR-36/SR-38):

| pos | slotKey | sectionType | wajib (tier) | posisi terkunci | berulang | mode |
|---|---|---|---|---|---|---|
| 1 | `cover` | `cover` | TERBIT, SERAH | ya (pertama) | tidak | MIXED (otomatis dari `meta`) |
| 2 | `controlSheet` | `controlSheet` | TERBIT, SERAH | tidak | tidak | INPUT |
| 3 | `signature` | `signatureBlock` | TERBIT, SERAH | tidak | tidak | INPUT |
| 4 | `toc` | `toc` | TERBIT, SERAH | tidak | tidak | AUTO |
| 5 | `content` | `chapter` | semua tier | tidak | ya, `minItems 1` | INPUT |
| 6 | `references` | `sourceRegister` | tidak | tidak | tidak | INPUT |
| 7 | `appendices` | `appendix` | tidak | ya (terakhir) | ya | INPUT |

Kenop slot `signature`: penempatan = di lembar kendali. `datum-manual-000` memakai slot 1-5 dan 7. Untuk NOTA, slot 1-4 tidak aktif.

**Migrasi templat lama ke preset + override (SR-36, SR-38):**
1. Untuk setiap templat lama, buat preset dari `resolvedParams` versi terbaru. Nilai terukur disematkan pada kunci yang kini turunan.
2. Buat versi templat baru = `baseVersionId` preset + esensial (nilai kenop yang dibaca dari preset) + kerangka.
3. Penjaga: `paramsSha256` efektif versi baru = versi lama. Hitungan override yang tersisa dilaporkan (target 0 lanjutan untuk kanonik dan gsp).

### 2.4 Kontrak `studio.doc/v2` (konten murni; contoh E1 GSP DATUM)

Aturan bentuk:
- `structure` opsional (pengecualian D-127; bawaan = kerangka).
- `sections` dikunci per `slotKey`; `type` harus sama dengan `sectionType` slot.
- **Run**: `{ "t": "…" }` dengan penanda makna opsional `strong`, `em`, `code`, `sup`, `sub`; atau `{ "tab": true }`; atau `{ "br": "line" }`. Teks `text` md-lite tetap diterima (KS-03).
- **Paragraf**: `role` hanya `body` (bawaan), `lede`, `note`, `subheading`.
- **Daftar**: `ordered: true/false`.
- **Tabel**: `columns[]` = `{role: text/numeral/id/unit/glyph, unit?}`; `rows[].kind` = `header`/`body`/`group`/`total`; `preset` semantik.
- **Figur**: `caption` = Inline; `source` = Inline + `provenance?`; `keyRow?`.
- **Gambar**: `asset`.
- **Chart**: `code` + `data` + `highlight?`.
- **Diagram**: spec Garis A tanpa medan ukuran/warna.
- **Bab**: `{key, id?, title, shortTitle?, partId?, intro?, sections}`.
- **Section**: `{id?, title, blocks}`.
- `id` = pid opsional.
- Tidak ada parameter apa pun.
- `additionalProperties: false`. Medan tampilan memberi 400 `SCHEMA_INVALID` dengan issue `checkId: "DISPLAY_FIELD"` dan pesan "medan tampilan tidak diterima; tampilan diatur templat".

```json
{
  "$schema": "studio.doc/v2",
  "template": { "slug": "datum-gsp" },
  "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" },
  "meta": { "title": "Laporan Survei Gardu Induk Cikupa", "docNumber": "014/GSP/LAP/X/2026", "tier": "TERBIT", "subject": "Survei GI Cikupa" },
  "sections": {
    "cover": { "type": "cover", "titleLines": [{ "text": "Survei Gardu Induk Cikupa" }, { "text": "Kondisi Peralatan 150 kV" }],
      "standfirst": { "text": "Kondisi peralatan primer dan rekomendasi pemeliharaan." } },
    "controlSheet": { "type": "controlSheet",
      "revisionHistory": [{ "rev": "A", "date": "2026-10-23", "what": "Terbit pertama", "by": "Tim Survei" }],
      "verificationChain": [{ "layer": "1", "role": "Penyusun", "name": "A. Pratama" }],
      "methodStatement": { "text": "Pengukuran langsung di lapangan; lihat Bab 1." },
      "distribution": [{ "copy": "1", "holder": "Manajer Proyek" }] },
    "signature": { "type": "signatureBlock", "roles": [
      { "role": { "text": "Disusun" }, "holder": { "text": "A. Pratama" }, "date": { "text": "2026-10-23" } },
      { "role": { "text": "Diperiksa" }, "holder": { "text": "B. Santoso" } },
      { "role": { "text": "Disetujui" }, "holder": { "text": "C. Wijaya" } } ] },
    "toc": { "type": "toc" },
    "content": { "type": "chapter",
      "outline": [{ "key": "1" }, { "key": "2" }],
      "chapters": [
        { "key": "1", "title": { "text": "Lingkup Survei" }, "sections": [
          { "title": { "text": "Tujuan" }, "blocks": [
            { "type": "paragraph", "id": "s1-tujuan-1", "text": "Survei mendata kondisi peralatan 150 kV." } ] } ] },
        { "key": "2", "title": { "text": "Temuan Utama" }, "sections": [
          { "title": { "text": "Transformator Daya" }, "blocks": [
            { "type": "paragraph", "runs": [ { "t": "Suhu minyak TD-1 " }, { "t": "di atas batas", "strong": true }, { "t": " operasi normal." } ] },
            { "type": "table", "caption": { "text": "Suhu minyak transformator" },
              "columns": [{ "role": "text" }, { "role": "numeral", "unit": "°C" }],
              "rows": [ { "kind": "header", "cells": [{ "text": "Unit" }, { "text": "Suhu" }] },
                        { "cells": [{ "text": "TD-1" }, { "text": "68" }] } ],
              "source": { "text": "Pengukuran lapangan 2026-10-20", "provenance": ["TERUKUR"] } } ] } ] } ] },
    "references": { "type": "sourceRegister", "entries": [
      { "id": "r1", "citation": { "text": "SPLN T5.008:2019 Pemeliharaan Trafo Tenaga" }, "kind": "dokumen" } ] },
    "appendices": { "type": "appendix", "chapters": [
      { "key": "A", "title": { "text": "Data Mentah" }, "sections": [
        { "title": { "text": "Log Suhu" }, "blocks": [ { "type": "paragraph", "text": "Log 24 jam terlampir." } ] } ] } ] }
  }
}
```

Meta yang tidak dikirim jatuh ke default templat `doc.*`. Tanpa `docNumber`, nomor diterbitkan sekuens (KT-05 c). Alamat yang dihasilkan: `F:cover`, `F:controlSheet`, `F:signature`, `F:toc`, `1`, `1.1`, `1.1.1`, `2.1.2` (= `Tabel 2.1`), `F:references/1`, `A.1.1`.

### 2.5 Kiriman parsial: `studio.chapter/v2` dan `studio.slot/v2` (use case D-128, contoh E2)

`POST /api/studio/chapters` memilih target dengan tepat satu cara:
- `documentId`;
- `docNumber`; atau
- `mission.folder` + `docKey` opsional (bawaan = slug templat).

`template` + `meta.title` wajib hanya bila dokumen belum ada. Gambar di posisi ke-3 section 3.2 mendapat alamat `3.2.3` dan label `Gambar 3.1`.

```json
{
  "$schema": "studio.chapter/v2",
  "agentId": "gsp-analis-01",
  "target": { "mission": { "folder": "2026-10-23_misi_a", "hermesTaskId": "ht_7f3a" }, "docKey": "laporan-survei" },
  "template": { "slug": "datum-gsp" },
  "meta": { "title": "Laporan Survei Gardu Induk Cikupa" },
  "chapter": {
    "key": "3",
    "title": { "text": "Analisis Kondisi Peralatan" },
    "sections": [
      { "title": { "text": "Metode Penilaian" }, "blocks": [
        { "type": "paragraph", "text": "Penilaian memakai skor kondisi 1 sampai 5 per peralatan." },
        { "type": "paragraph", "text": "Skor diberikan dari inspeksi visual dan uji tahanan isolasi." } ] },
      { "title": { "text": "Kondisi Pemutus Tenaga" }, "blocks": [
        { "type": "paragraph", "text": "Tiga pemutus tenaga diperiksa pada 2026-10-20." },
        { "type": "paragraph", "text": "PMT-2 menunjukkan korosi pada terminal sisi beban." },
        { "type": "image", "asset": "foto-pmt2",
          "caption": { "text": "Korosi pada terminal PMT-2" },
          "source": { "text": "Foto lapangan 2026-10-20", "provenance": ["TERUKUR"] } },
        { "type": "paragraph", "text": "Korosi ini menurunkan tahanan kontak dan perlu pembersihan." } ] },
      { "title": { "text": "Ringkasan Skor" }, "blocks": [
        { "type": "paragraph", "text": "Tabel berikut merangkum skor kondisi." },
        { "type": "table", "caption": { "text": "Skor kondisi pemutus tenaga" },
          "columns": [{ "role": "id" }, { "role": "numeral" }],
          "rows": [ { "kind": "header", "cells": [{ "text": "Unit" }, { "text": "Skor" }] },
                    { "cells": [{ "text": "PMT-1" }, { "text": "4" }] },
                    { "cells": [{ "text": "PMT-2" }, { "text": "2" }] } ],
          "source": { "text": "Inspeksi 2026-10-20", "provenance": ["TERUKUR"] } } ] } ]
  },
  "assets": { "foto-pmt2": { "assetRef": "sha256:9c1e0b7d…" } },
  "render": { "scope": "chapter", "formats": ["docx", "pdf"] }
}
```

`slot` bawaan `/chapters` = slot berulang pertama (`content`). Untuk lampiran: `"slot": "appendices"`.

Aset:
- Base64: `"foto-pmt2": { "mime": "image/png", "dataBase64": "iVBORw0KGgo…" }` (sha dihitung server).
- Unggahan terpisah: `POST /api/studio/assets` (multipart `file` atau `{mime, dataBase64}`), menghasilkan 201 `{asset: {sha256, mime, widthPx, heightPx, bytes}}`, atau 200 bila sudah ada.

Batas:
- `STUDIO_MAX_JSON_BYTES` 5 MiB (D-125).
- Piksel FIX-1 M-02 (D-134): sisi maksimal 20.000 px dan 80 MP; terlampaui 413 `ASSET_TOO_LARGE`.
- Tipe selain PNG/JPEG: 415 `ASSET_TYPE_UNSUPPORTED`.
- `assetRef` tak dikenal: 422 `ASSET_NOT_FOUND`.

Respons 201 (dokumen baru, revisi 1). Respons hanya memuat lingkup yang dikirim ditambah kelengkapan:

```json
{
  "document": { "id": "cmw1doc…", "docNumber": "014/GSP/LAP/X/2026", "missionFolder": "2026-10-23_misi_a", "docKey": "laporan-survei", "template": { "slug": "datum-gsp", "versionNo": 2 } },
  "created": true, "unchanged": false, "rebased": false,
  "revision": { "revisionNo": 1, "changeScope": "chapter:3", "changeAuto": true },
  "chapter": { "slotKey": "content", "chapterKey": "3", "pid": "bab-3", "sha256": "5b0c…",
    "blocks": [
      { "address": "3.1.1", "pid": "p-a7k2m9q4xz", "type": "paragraph" },
      { "address": "3.1.2", "pid": "p-b3n8r1t6yw", "type": "paragraph" },
      { "address": "3.2.1", "pid": "p-c9d4f2h7jk", "type": "paragraph" },
      { "address": "3.2.2", "pid": "p-d1g5j8l3mn", "type": "paragraph" },
      { "address": "3.2.3", "pid": "p-e6h2k9p4qr", "type": "image", "artifactLabel": "Gambar 3.1" },
      { "address": "3.2.4", "pid": "p-f8j3m6s1tv", "type": "paragraph" },
      { "address": "3.3.1", "pid": "p-g2k7n4u9wx", "type": "paragraph" },
      { "address": "3.3.2", "pid": "p-h5m1q8v3yz", "type": "table", "artifactLabel": "Tabel 3.1" } ] },
  "completeness": {
    "status": "INCOMPLETE", "revisionNo": 1, "fullRenderAllowed": false,
    "slots": [
      { "slotKey": "cover", "state": "AUTO_READY" },
      { "slotKey": "controlSheet", "state": "EMPTY", "required": true },
      { "slotKey": "signature", "state": "EMPTY", "required": true },
      { "slotKey": "toc", "state": "AUTO_READY" },
      { "slotKey": "content", "state": "PARTIAL", "required": true },
      { "slotKey": "references", "state": "OPTIONAL_EMPTY" },
      { "slotKey": "appendices", "state": "OPTIONAL_EMPTY" } ],
    "content": { "expected": ["1", "2", "3"], "expectedSource": "contiguous",
                 "present": [{ "key": "3", "by": "gsp-analis-01", "at": "2026-10-23T09:12:04Z", "revisionNo": 1 }],
                 "missing": ["1", "2"] },
    "missingRequired": ["controlSheet", "signature", "content:1", "content:2"],
    "nextSteps": [
      "Kirim isi Lembar Kendali dan Tanda Tangan: POST /api/studio/slots",
      "Kirim bab 1 dan 2: POST /api/studio/chapters",
      "Opsional: tetapkan daftar bab yang direncanakan: PATCH /api/studio/documents/cmw1doc…/structure {op: setOutline}" ],
    "message": "Dokumen 014/GSP/LAP/X/2026 (misi 2026-10-23_misi_a, laporan-survei) belum lengkap: isi wajib belum ada untuk Lembar Kendali, Tanda Tangan; bab belum ada 1, 2. Render penuh ditolak; render bab tersedia sebagai draf."
  },
  "job": { "id": "cmw1job…", "scope": { "kind": "CHAPTER", "key": "3" }, "status": "SUCCEEDED", "formats": ["DOCX", "PDF"], "draft": true },
  "outputs": [ { "id": "cmw1f1…", "format": "DOCX", "fileName": "Laporan Survei Gardu Induk Cikupa 014 RevA Bab 3.docx", "draft": true } ]
}
```

Perilaku kiriman ulang dan pembaruan:
- Kiriman ulang identik: 200 `{created:false, unchanged:true, revision:{revisionNo:1}}` tanpa revisi baru.
- Bab 3 berubah: 201 revisi n+1, `changeScope:"chapter:3"`, `changedAddresses` hanya bab 3.
- Pencocokan pid tanpa `id` agen: posisi sama dalam section sama mewarisi pid, blok tambahan mendapat pid baru, dan blok yang hilang dipensiunkan.

`POST /api/studio/slots` (`studio.slot/v2`) memakai target dan `render` yang sama dengan `{ "slot": "controlSheet", "payload": { "type": "controlSheet", … } }`. Slot berulang yang dikirim ke sini mendapat 422 `SLOT_USE_CHAPTER_ENDPOINT`.

**Baca isi:** `GET /api/studio/documents/[id]/content?slot=content&chapter=3` mengembalikan isi dalam bentuk kiriman v2 ditambah pid di setiap bab, section, dan blok, untuk baca, ubah, dan kirim balik.

### 2.6 Kelengkapan, render penuh, sunting per id (D-131; contoh E3)

**Kelengkapan** (`services/completeness`):

| State slot | Arti |
|---|---|
| `FILLED` | Slot INPUT/MIXED berisi |
| `AUTO_READY` | Slot AUTO, atau MIXED tanpa isi, yang dapat dibangkitkan |
| `EMPTY` | Slot wajib INPUT tanpa isi |
| `PARTIAL` | Slot berulang wajib yang sebagian bab-nya ada |
| `OPTIONAL_EMPTY` | Slot opsional tanpa isi |
| `OMITTED` | Slot opsional yang dihapus lewat `structure` |

- `COMPLETE` bila tidak ada `EMPTY` wajib, `content.missing` kosong, dan `minItems` terpenuhi.
- Bab yang diharapkan: `outline`; tanpa outline, `1..max` (kontigu).
- Ringkasan kelengkapan ikut di setiap respons kirim, sunting, render, dan struktur.
- `GET /api/studio/documents/[id]/completeness` dan `GET /api/studio/documents?mission=` memuatnya.

**Render penuh hanya untuk COMPLETE:**
- Render penuh pada dokumen INCOMPLETE: 409 `DOCUMENT_INCOMPLETE`.
- Render `chapter`/`slot` selalu boleh, sebagai draf (`draft = true`, penanda `render.draft.marker` dari preset).
- Dokumen COMPLETE + sunting atau kiriman yang membawa `render.scope = "document"` langsung memicu render penuh.

Contoh E3a: agen 1 mengirim bab 3 dan agen 2 mengirim bab 5 bersamaan ke dokumen berisi bab 1-2 dan outline 1-5 (revisi 4). Keduanya diterima:

```json
// respons agen 1
{ "created": false, "unchanged": false, "rebased": false, "revision": { "revisionNo": 5, "changeScope": "chapter:3" },
  "completeness": { "status": "INCOMPLETE", "fullRenderAllowed": false,
    "slots": [ { "slotKey": "cover", "state": "EMPTY", "required": true }, { "slotKey": "controlSheet", "state": "EMPTY", "required": true } ],
    "content": { "expected": ["1","2","3","4","5"], "missing": ["4","5"] },
    "missingRequired": ["cover", "controlSheet", "content:4", "content:5"] } }
// respons agen 2 (berbasis revisi 4, digabung di atas revisi 5)
{ "created": false, "unchanged": false, "rebased": true, "baseRevisionNo": 4, "appliedOnRevisionNo": 5,
  "revision": { "revisionNo": 6, "changeScope": "chapter:5" },
  "completeness": { "status": "INCOMPLETE", "fullRenderAllowed": false,
    "slots": [ { "slotKey": "cover", "state": "EMPTY", "required": true }, { "slotKey": "controlSheet", "state": "EMPTY", "required": true } ],
    "content": { "expected": ["1","2","3","4","5"], "missing": ["4"] },
    "missingRequired": ["cover", "controlSheet", "content:4"] } }
```

(Contoh memakai templat yang sampulnya INPUT. Pada kerangka GSP bawaan, sampul MIXED dan berstatus `AUTO_READY`.)

Contoh E3b: render penuh saat INCOMPLETE menghasilkan 409:

```json
{ "error": "Dokumen belum lengkap; render penuh ditolak", "code": "DOCUMENT_INCOMPLETE",
  "details": {
    "completeness": { "status": "INCOMPLETE", "revisionNo": 6,
      "missingRequired": ["cover", "controlSheet", "content:4"],
      "slots": [ { "slotKey": "controlSheet", "state": "EMPTY", "required": true, "lastFilledBy": null } ],
      "content": { "present": [ { "key": "1", "by": "gsp-analis-03", "at": "2026-10-23T08:40:11Z" },
                                { "key": "2", "by": "gsp-analis-03", "at": "2026-10-23T08:41:02Z" },
                                { "key": "3", "by": "gsp-analis-01", "at": "2026-10-23T09:12:04Z" },
                                { "key": "5", "by": "gsp-analis-02", "at": "2026-10-23T09:12:05Z" } ],
                   "missing": ["4"] } },
    "allowedScopes": ["chapter", "slot"],
    "forwardToController": "Dokumen 014/GSP/LAP/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 6. Isi wajib belum ada: Sampul, Lembar Kendali. Bab belum ada: 4. Terakhir mengisi: bab 5 oleh gsp-analis-02 pukul 09:12. Langkah berikut: kirim Sampul dan Lembar Kendali (POST /api/studio/slots) serta bab 4 (POST /api/studio/chapters), lalu minta render penuh." } }
```

Contoh E3c: setelah COMPLETE (revisi 9), PATCH satu paragraf by pid lalu render penuh:

```json
// PATCH /api/studio/documents/cmw1doc…/paragraphs/p-d1g5j8l3mn
{ "op": "replace", "baseRevisionNo": 7,
  "block": { "type": "paragraph", "text": "PMT-2 menunjukkan korosi berat pada terminal sisi beban dan sisi sumber." },
  "change": { "what": "Perbarui temuan PMT-2", "why": "Hasil inspeksi ulang 2026-10-22", "impact": "Paragraf 3.2.2 saja" },
  "render": { "scope": "document", "formats": ["docx", "pdf"] } }
// 200
{ "revision": { "revisionNo": 10, "changeScope": "pid:p-d1g5j8l3mn" }, "pid": "p-d1g5j8l3mn", "address": "3.2.2",
  "rebased": true, "baseRevisionNo": 7, "appliedOnRevisionNo": 9, "addressMap": {},
  "completeness": { "status": "COMPLETE", "fullRenderAllowed": true },
  "job": { "id": "cmw1job9…", "scope": { "kind": "DOCUMENT" }, "status": "SUCCEEDED", "formats": ["DOCX", "PDF"], "draft": false } }
```

Operasi PATCH per pid:

| `op` | Kebutuhan | Hasil |
|---|---|---|
| `replace` | `block` | Isi diganti, tipe boleh berubah (paragraf menjadi gambar, juga sebaliknya); pid tetap |
| `insertBefore` / `insertAfter` | `block` | Respons memuat `newPid` dan `addressMap` |
| `delete` | - | Pid dipensiunkan |
| `move` | `to: {before?, after?, section?: {chapterKey, sectionNo, at}}` | Lintas section/bab; respons memuat `addressMap` |

- `change` wajib di PATCH (D-06).
- Konflik hanya bila pid sasaran/jangkar berubah sejak `baseRevisionNo`: 409 `SCOPE_CONFLICT` `{pid, baseRevisionNo, changedInRevisionNo, changedBy, currentContent}`.
- Pid tidak dikenal 404 `PID_NOT_FOUND`. Pid klien yang bentrok 422 `PID_CONFLICT`.
- PATCH per alamat C.S.P (R06) tetap tersedia.

**Konkurensi:**
1. Setiap penulisan berjalan dalam satu transaksi dengan `pg_advisory_xact_lock(hashtext('studio-doc:' || documentId))`. Pembuatan dokumen memakai `hashtext('studio-mdoc:' || missionFolder || ':' || docKey)` + unik `(missionFolder, missionDocKey)`. Balapan pembuatan diulang sekali di dalam transaksi, tidak pernah 409.
2. Di dalam kunci: baca revisi terbaru n, terapkan lingkup, tulis n+1, lalu commit. Revisi bertambah per kiriman.
3. `baseRevisionNo` hanya dicek untuk lingkup sama; sha berbeda menghasilkan 409 `SCOPE_CONFLICT`. Lingkup berbeda digabung (`rebased: true`).
4. Job render dibuat setelah commit untuk revisi tertentu. Batas FIX-1/FIX-8 (429, 503) berlaku.
5. Penomoran artefak per kunci bab, sehingga bab tak berurutan tidak saling menggeser. Urutan unit = urutan slot, lalu kunci. Daftar isi dan nomor halaman dihitung di render penuh. Rujukan prosa tidak ditulis ulang (A9). Penomoran ulang kunci hanya lewat op struktur `renumberChapters` (ADMIN).

### 2.7 Aturan validasi (urutan evaluasi)

Urutan evaluasi: skema (400) → gerbang kepercayaan D-98/D-134 → `ingest.inlineFormat` (v1) → struktur (422) → aset → by-construction (422) → simpan → render → lint rilis. Setiap galat membawa `message` berbahasa Indonesia yang menyebut perbaikan dalam bahasa isi.

| Kode | HTTP | Kondisi |
|---|---|---|
| `SCHEMA_INVALID` | 400 | Gagal skema; medan tampilan memberi issue `checkId: "DISPLAY_FIELD"` |
| `SLOT_UNKNOWN` | 422 | Kunci slot di luar kerangka versi templat |
| `SLOT_REQUIRED_MISSING` | 422 | `structure` diberikan tanpa slot wajib aktif (isi kosong bukan galat: INCOMPLETE) |
| `SLOT_DUPLICATE` | 422 | Kunci ganda di `structure` |
| `SLOT_POSITION_LOCKED` | 422 | Slot terkunci berpindah |
| `SLOT_TYPE_MISMATCH` | 422 | `type` ≠ `sectionType` slot |
| `SLOT_FORBIDDEN_FOR_TIER` | 422 | Isi untuk slot tidak aktif pada tier |
| `SLOT_INPUT_NOT_ACCEPTED` | 422 | Isi dikirim ke slot AUTO di luar medan yang diizinkan |
| `SLOT_ITEMS_OUT_OF_RANGE` | 422 | Jumlah bab melebihi `maxItems` |
| `BLOCK_TYPE_NOT_ADMITTED` | 422 | Jenis blok di luar `admits` slot |
| `SLOT_USE_CHAPTER_ENDPOINT` | 422 | Slot berulang lewat `/slots` |
| `SLOT_PARAM_SCOPE_INVALID` | 422 | Simpan templat: kunci di luar cakupan slot |
| `PARAM_SURFACE_FORBIDDEN` | 403 | Simpan templat: kunci lanjutan/turunan/internal oleh non-ADMIN di luar mode ahli |
| `PRESET_READONLY` | 403 | Ubah versi preset oleh non-ADMIN |
| `PARAM_CLASS_K_FORBIDDEN` / `PARAM_CLASS_T_READONLY` | 403 / 400 | Sama seperti sekarang |
| `INLINE_FORMAT_REJECTED` | 422 | v1 bertampilan saat `reject` (`strip`: REPORT `INLINE_FORMAT_STRIPPED`) |
| `DOC_TARGET_AMBIGUOUS` | 400 | Target tidak tepat satu cara |
| `META_REQUIRED_FOR_CREATE` | 400 | Dokumen belum ada, `template`/`meta.title` absen |
| `META_CONFLICT` | 409 | `meta` berbeda dari dokumen (ubah lewat PATCH structure `setMeta`) |
| `TEMPLATE_MISMATCH` | 409 | Dokumen ada dengan templat lain |
| `SCOPE_CONFLICT` | 409 | §2.6 |
| `PID_NOT_FOUND` / `PID_CONFLICT` | 404 / 422 | §2.6 |
| `ASSET_NOT_FOUND` | 422 / 404 | `assetRef` tak dikenal |
| `DOCUMENT_INCOMPLETE` | 409 | Render penuh pada INCOMPLETE |
| Rilis (lint, tidak menahan berkas, A10) | - | `SLOT_CONTENT_MISSING` (FAIL), `CONTENT_CHAPTER_GAP` (FAIL TERBIT/SERAH, REPORT NOTA), `SCHEMA_V1_ADAPTED`, `INLINE_FORMAT_STRIPPED` (REPORT) |

### 2.8 Kompatibilitas mundur

1. **JSON v1 diterima lewat adaptor:**
   - `front.*` ke slot; `parts`/`chapters` ke `content`; `appendices`; `blockId` ke `id`.
   - `b`/`i` menjadi `strong`/`em`; `faceRole` glif dibuang.
   - Tampilan menurut `ingest.inlineFormat`; spacer/device dibuang + REPORT.
   - REPORT `SCHEMA_V1_ADAPTED`. Masa berlaku KC-1.
2. **Revisi lama:** snapshot `studio.norm/v1` dirender lewat jalur lama. Backfill (SR-37) menambah baris M14-M18 secara idempoten. `StudioBlock` ditulis ganda untuk revisi baru.
3. **Templat lama:** kerangka implisit (`sectionPlan` + `orderedPlanSections`). Seed memigrasi ke preset + esensial + kerangka sebagai versi baru dengan nilai efektif sama (§2.3).
4. **Manual 000:** revisi baru dari `doc.v2.json` (D-126).
5. **API templat v1** (R01/R02 dengan `overrides` datar) tetap diterima untuk ADMIN. Kunci dipetakan ke lapisnya; non-ADMIN hanya boleh esensial (`PARAM_SURFACE_FORBIDDEN`).

### 2.9 Dampak ke mesin render

| Area | Perubahan |
|---|---|
| Snapshot | `studio.norm/v2`: `skeleton {templateVersionId, skeletonSha256, slots[…]}`; `NormUnit` + `slotKey`, `sectionType`; `NormBlock` + `pid`, `slotKey`, `assetSha256?`. v1 tetap valid |
| `services/compose` | Pemetaan v2 ke internal (penanda makna, pemecahan glif, figur tanpa ukuran); penomoran per kunci bab |
| `engine/tokens` | Fungsi turunan baru untuk kenop esensial (warna aksen ke peran warna, ukuran fon dasar ke skala tipografi, kerapatan margin ke grid) dengan penghormatan nilai tersemat preset |
| `services/skeleton` | Resolusi nilai efektif per slot menurut §2.3 (preset, esensial, lanjutan, turunan, T) |
| `services/render` | `slotParams`/`slotRoleFormats` ke `RenderContext`. Lingkup: `DOCUMENT` (hanya COMPLETE), `CHAPTER`, `SLOT`. Lingkup bab: penomoran dari seluruh dokumen lalu filter; nomor halaman lokal; berkas draf `rev-<n>/bab-3/`. Memakai orkestrator tanpa DB IP-43a |
| `engine/docx/assemble` | `planUnits` v1/v2; `RenderContext` per unit; placeholder slot kosong (draf); penempatan tanda tangan dari kenop slot; penanda draf. Renderer lain tidak berubah |
| `engine/html/assemble` | Padanan HTML |
| `engine/lint/structure` | `SLOT_CONTENT_MISSING`, `CONTENT_CHAPTER_GAP`; D16 dari `requiredPresets` slot |

### 2.10 Revisi dan alamat

- `front = "F:" slotKey ["/" posint]` (aditif). Empat kunci lama tetap sah (`contract/address.ts:39`).
- Setiap revisi menyimpan `changeScope` dan `changedAddresses`.
- Kiriman agen tanpa `change` diisi otomatis (`changeAuto`). PATCH wajib `change` (D-06; KC-2).
- Riwayat per pid: `GET …/paragraphs/[pid]?history=1`.

### 2.11 API (baru dan berubah)

| ID | Path | Metode | Status | Inti |
|---|---|---|---|---|
| R01 | `/api/studio/templates` | GET, POST | berubah | POST menerima `studio.template/v2` (preset + esensial + kerangka; lanjutan ADMIN); GET menandai preset; `?kind=preset` |
| R02 | `/api/studio/templates/[id]` | GET, POST | berubah | GET mengembalikan bentuk preset + esensial (+ lanjutan bila ADMIN/ahli); POST versi baru `studio.template/v2`; `PRESET_READONLY`, `PARAM_SURFACE_FORBIDDEN` |
| R03 | `/api/studio/registry` | GET | berubah | `kind=presets`, `kind=essentials` (kenop per jenis slot + global, label awam), `kind=slots`, `kind=paramScopes`; skema `studio.doc/v2`, `studio.chapter/v2`, `studio.slot/v2`, `studio.template/v2` |
| R04 | `/api/studio/documents` | POST, GET | berubah | v1 (adaptor) dan v2; kiriman parsial 201; `renderRefused` untuk render penuh INCOMPLETE; GET `?mission=&docKey=` + kelengkapan |
| R05 | `/api/studio/documents/[id]` | GET | berubah | Pohon slot/bab/section/blok (alamat + pid) + kelengkapan |
| R06 | `/api/studio/documents/[id]/blocks/[address]` | GET, PATCH | tetap | Base-check per lingkup; tulis ternormalisasi |
| R07 | `/api/studio/documents/[id]/revisions` | GET, POST | tetap | Render ulang revisi lama (penuh hanya bila COMPLETE) |
| R08 | `/api/studio/validate` | POST | berubah | doc/chapter/slot v2 + kelengkapan pratinjau |
| R12 | `/api/studio/chapters` | POST | baru | §2.5 |
| R13 | `/api/studio/slots` | POST | baru | §2.5 |
| R14 | `/api/studio/documents/[id]/structure` | GET, PATCH | baru | `reorder`, `omitSlot`, `restoreSlot`, `setOutline`, `setMeta`, `renumberChapters` (ADMIN), `templateVersion` |
| R15 | `/api/studio/documents/[id]/completeness` | GET | baru | §2.6 |
| R16 | `/api/studio/documents/[id]/paragraphs/[pid]` | GET, PATCH | baru | §2.6 |
| R17 | `/api/studio/documents/[id]/render` | POST | baru | `{scope, key?, formats, revisionNo?}`; 409 `DOCUMENT_INCOMPLETE` |
| R18 | `/api/studio/assets` | POST, GET | baru | Unggah idempoten sha |
| R19 | `/api/studio/templates/[id]/skeleton` | GET, POST | baru | Kerangka + esensial per slot; POST = versi baru |
| R20 | `/api/studio/documents/[id]/content` | GET | baru | Isi per slot/bab bentuk v2 + pid |

Semua route memakai `requireSession`, `getStudioCaller`, gerbang kepercayaan D-98/D-134, rate limit FIX-1, dan helper `src/lib/studio/http/**` (read-only).

### 2.12 UI

| Layar | Komponen | Isi |
|---|---|---|
| Editor templat | `UI/template-editor` | Pemilih preset (satu kali), kenop esensial global (maksimal 8, label awam, tanpa kunci rinci), panel "Lanjutan" terlipat (ADMIN/mode ahli), tautan ke Kerangka. Mode preset (ADMIN): editor lengkap semua kunci untuk templat `isPreset` |
| Kerangka templat (`/studio/templates/[id]/sections`) | `UI/section-composer` (ditulis ulang) | Daftar slot; tambah/hapus/urut; wajib/kunci/berulang; per slot hanya kenop esensial jenisnya di depan, lanjutan terlipat; pratinjau R08; simpan = versi baru (R19). Tanpa `setup` per bab (`file_requests.md:120` tertutup) |
| Penampil dokumen | `UI/document-viewer` | Pohon slot/bab/section/blok (alamat + pid); panel kelengkapan; render bab/slot (draf); render penuh hanya COMPLETE |
| Playground | `UI/playground` | Dokumen v2 / Kirim Bab / Kirim Slot / Unggah Aset; contoh E1, E2; validasi + kelengkapan |

### 2.13 Seed, benchmark, panduan agent

- **Seed:**
  - `--presets-and-skeletons` membuat preset "DATUM Kanonik" dan "GSP DATUM" dari versi terbaru, lalu versi baru `datum-kanonik` dan `datum-gsp` = preset + esensial + kerangka. Penjaga: `paramsSha256` efektif sama.
  - `--import-manual000-v2` membuat preset "DATUM Manual 000" (terbatas) dari `template.v2.json`, versi berkerangka `datum-manual-000`, dan revisi baru dokumen 000.
  - Semuanya idempoten. IP-43c menutup S85 R-22.
- **Benchmark:**
  - `doc.v2.json` = konversi `doc.json` lewat adaptor: 4.544 unit identik, 0 medan tampilan, glif dideteksi mesin.
  - `template.v2.json` = rujukan preset Manual 000 (nilai lengkap terukur, termasuk `render.run.symbolGlyphs`) + esensial + kerangka 6 slot.
  - D-17 tetap. Figur mesin (D-118, D-129).
- **Panduan agent:** prinsip §0 di halaman pertama; agen hanya menyebut slug templat dan tidak pernah parameter; kirim/baca/sunting/minta render; E2, E3; `forwardToController`; aset; alamat; kode galat; masa berlaku v1. Bagian untuk pengguna templat menjelaskan preset + kenop esensial saja.

## 3. Integrasi dengan baris yang ada

| Baris | Status | Area tumpang tindih | Aturan dalam adendum ini |
|---|---|---|---|
| RT-01 | mendarat (D-138) | engine docx/html, benchmark | SR-32 memakai `doc.json` konten-saja; permintaan RT-01 = RQ-1..RQ-6; permintaan composer tertutup SR-28 |
| FIX-1, FIX-5, FIX-6, FIX-8, IP-39a, IP-39b | mendarat | - | Sisa = IP-41..IP-43 (B0) |
| FIX-3 | dihentikan (D-133) | `scripts/parity/**`, `tests/parity/fixtures/**` | Tindakan pertama SR-33: pulihkan `scripts/parity/run/lib/render.ts`; sisa = SR-40, SR-41 |
| FIX-2 (S83) | belum diluncurkan | `engine/html/blocks/**`, `engine/docx/wrapper/pages.ts`, `engine/docx/assemble/xml.ts` | KC-3 |
| FIX-4 (S86 UI) | belum diluncurkan | `UI/**` | KC-3 |
| S75, S77, S98, S80, S82, S81, S88 | ditunda | - | SR-49..SR-54, SR-58 |
| S87 ulang (D-123, D-135) | ditunda | - | SR-57 |
| Uji usang (D-130, D-134, D-137, `file_requests.md:100`) | ditunda | `tests/unit/studio/**` | SR-42, SR-43 |
| S85 R-10 / R-11 | butuh keputusan (D-134) | ingest, render | Tertutup oleh desain: penomoran di compose (SR-08); penempatan tanda tangan = kenop slot (SR-16); diverifikasi SR-55 |

## Structured Task Breakdown

Catatan baca:
- Kolom sama dengan `02_structured.md`. Depends On berlabel `:B`/`:C`.
- Gerbang ringan D-133: "tsc" = `npx tsc --noEmit -p tsconfig.json` seluruh repo dengan galat diatribusikan ke area; "eslint" = `npx eslint <area>`.
- Catatan baris di `delegation_progress/<agent>_<id>.md`.
- Urutan nomor ≠ urutan gelombang.

| Step | Task Description | Agent_to_Invoke | Skills_to_Load | Expected Output | Depends On | Verification | Phase |
|---|---|---|---|---|---|---|---|
| SR-01 | Tulis register nama dan konstanta + spesifikasi refaktor struktur: prinsip §0 sebagai uji penerimaan, model M10-M18 dan kolom tambahan, 3 enum, SQL migrasi dan rollback delta, kontrak doc/chapter/slot v2 (daftar medan tampilan terlarang), template v2, norm v2, kode galat §2.7, route R01-R20, kelengkapan, konkurensi, identitas pid, parameter kontrak baru, tabel adaptor v1→v2, antarmuka IP-43a. Masukan: blueprint ini, 01_specs, D-127/D-128/D-131/D-138 | data-analyst | - | NEW <task>/masterplan/03_structural_sections_specs.md | none | setiap model, kolom, enum, kode, route, id skema, slot bawaan, dan parameter baru bernama tepat sekali di register; SQL rollback hanya menyebut objek delta; tabel adaptor mencakup setiap medan tingkat atas v1 | masterplan |
| SR-02 | Peta cakupan kunci rinci: setiap kunci `ALL_PARAMS` (hitungan dari modul) diberi tepat satu cakupan menurut §2.3 dengan hitungan per cakupan dan kelas B/K/T. Masukan: `L/params/**`, `L/registry/sections.ts` | data-analyst | - | NEW <task>/research/08_param_slot_scope_map.md | SR-01:C | setiap kunci tepat satu cakupan (0 tanpa cakupan, 0 ganda); jumlah per cakupan = total dari modul | research |
| SR-59 | Desain permukaan parameter: setiap kunci diberi satu lapis (esensial/lanjutan/turunan/internal); daftar duplikat dan kunci yang dapat diturunkan dari kenop dasar; kenop esensial final per jenis slot dan global dengan pemetaan ke kunci rinci atau fungsi turunan (kenop tanpa pemetaan gugur, AS-8); isi 3 preset; hitungan sebelum/sesudah per lapis. Masukan: SR-02, §2.3, `benchmark/manual000/template.json`, templat seed | data-analyst | - | NEW <task>/research/09_param_surface_design.md | SR-02:B | setiap kunci tepat satu lapis dan hitungan per lapis sama dengan total dari modul; esensial total maksimal 60 dan maksimal 8 per jenis slot; setiap kenop esensial terpetakan ke kunci rinci atau fungsi turunan bernama | research |
| SR-03 | Delta Prisma + migrasi aditif `20261023200000_add_studio_structure` lewat prosedur D-21 (baseline sebelum edit, shadow DB, diff dikurangi baseline, deploy v21, generate). Masukan: SR-01 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS prisma/schema.prisma (aditif); NEW under prisma/migrations/: migrasi struktur; NEW <task>/implementation/04_structure_migration_landed.md | SR-01:B | prisma validate exit 0; migration.sql 0 DROP, 9 CREATE TABLE, 3 CREATE TYPE, semua objek berawalan Studio; migrate status up to date di v21 dan hitungan baris tabel lama identik | implementation |
| SR-04 | Kontrak v2 (penulis tunggal contract/**): tipe dan JSON Schema doc/chapter/slot v2 konten murni (issue DISPLAY_FIELD), template v2 (preset + esensial + kerangka), norm v2, ringkasan kelengkapan, medan `surface` pada ParamDef, kode galat baru, alamat `F:<slotKey>`, konstanta route; tulis marker. Masukan: SR-01 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/contract/ (aditif); NEW <task>/implementation/05_structure_contract_landed.md | SR-01:B | tsc 0 galat; E1, E2, E3 lolos ajv dan varian E1 bermedan `format` ditolak DISPLAY_FIELD (keluaran dikutip); parseAddress round-trip 4 kunci F: lama + F:references | implementation |
| SR-05 | Transkripsi registri struktur dan permukaan: `PARAM_SCOPE` (research/08), `PARAM_SURFACE` dan definisi kenop esensial berlabel awam (research/09), jenis slot dan `admits`, parameter kontrak baru di `params/structure.ts`, agregat dan pin hitungan `params/index.ts`, ekspor `registry/index.ts`. Masukan: SR-02, SR-59 | coder-execution | dry-run-verify-fix | NEW under src/lib/studio/registry/: slots.ts, essentials.ts; NEW under src/lib/studio/params/: structure.ts; EXISTS src/lib/studio/params/index.ts, src/lib/studio/registry/index.ts | SR-02:B, SR-59:B, SR-04:C | skrip hitung: setiap kunci ALL_PARAMS punya tepat satu cakupan dan satu lapis sesuai research/08 dan 09; tsc 0 galat | implementation |
| SR-60 | Fungsi turunan kenop esensial di engine/tokens: warna aksen ke peran warna, ukuran fon dasar ke skala tipografi, kerapatan margin ke grid, dengan penghormatan nilai tersemat preset; DeriveFnId baru lewat file_requests ke SR-04 bila perlu. Masukan: research/09 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/tokens/ | SR-59:B, SR-05:C | tsc; eslint area bersih; asap: resolusi preset GSP DATUM tanpa kenop diubah menghasilkan paramsSha256 sama dengan datum-gsp terbaru | implementation |
| SR-06 | Layanan kerangka: baca/tulis kerangka versi (M10-M12), kerangka implisit dari sectionPlan, resolusi nilai efektif per slot (preset, esensial, lanjutan, turunan, T via engine/tokens), cek K/T/cakupan/lapis per slot. Masukan: kontrak §2.3 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: skeleton | SR-03:B, SR-04:B, SR-05:C, SR-60:C | tsc; eslint area bersih; asap: kerangka implisit datum-kanonik terbaru sama dengan urutan orderedPlanSections | implementation |
| SR-07 | Kaitkan layanan templat ke preset dan kerangka: versi = baseVersionId preset + esensial + lanjutan (ADMIN) + kerangka dalam satu transaksi, `isPreset` dan PRESET_READONLY, PARAM_SURFACE_FORBIDDEN, skeletonSha256, impor profil membawa kerangka. Masukan: SR-06 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/templates/ | SR-04:B, SR-06:C, IP-43b:B, RQ-4:B | tsc; eslint area bersih; asap: simpan versi preset + esensial + kerangka dalam transaksi yang di-rollback (0 baris tersisa) | implementation |
| SR-08 | Layanan compose (murni): validasi struktur §2.7, pemetaan konten v2 ke bentuk internal (penanda makna, pemecahan glif `render.run.symbolGlyphs`, figur tanpa ukuran), snapshot norm/v2 (alamat, pid, penomoran per kunci bab), penggabungan kiriman bab/slot, sha lingkup. Masukan: kontrak §2.4-2.6, §2.9 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: compose | SR-04:B, SR-05:C, SR-06:C, SR-11:C | tsc; eslint area bersih; asap: E1 menjadi snapshot dengan alamat 1.1.1, Tabel 2.1, F:references/1 dan 10 kasus negatif SLOT_* memberi kode benar | implementation |
| SR-09 | Adaptor v1→v2: front/parts/chapters/appendices ke slot, blockId ke id, b/i ke strong/em, buang faceRole glif, kebijakan `ingest.inlineFormat` (strip/reject/allow tepercaya) dengan REPORT, buang spacer/device. Masukan: kontrak, D-138 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: adapt-v1 | SR-04:B, SR-08:C | tsc; eslint area bersih; asap: 4 fixture doc v1 dan benchmark doc.json teradaptasi lolos skema v2 | implementation |
| SR-10 | Repositori struktur: tulis revisi ke M14-M18 (salinan penuh) + tulis ganda StudioBlock, identitas pid per dokumen, baca balik menjadi snapshot dengan cek sha256 rekonstruksi, proyeksi baca isi bentuk v2 per slot/bab. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: structure | SR-03:B, SR-04:B, SR-08:C | tsc; eslint area bersih; asap transaksi-rollback di v21: sha256 snapshot rekonstruksi E1 sama, proyeksi bab 2 sama dengan kiriman ditambah pid, 0 baris tersisa | implementation |
| SR-11 | Layanan kelengkapan: state slot, bab diharapkan/ada/hilang dengan penulis dan waktu, status, `nextSteps`, `message`, `forwardToController`. Masukan: kontrak §2.6 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: completeness | SR-04:B, SR-06:C | tsc; eslint area bersih; asap: dokumen berisi E2 saja = INCOMPLETE dengan controlSheet, signature kosong dan bab 1, 2 hilang | implementation |
| SR-12 | Ingest v2: dispatch per `$schema` (v1 adaptor, v2), gerbang kepercayaan, compose, aset, simpan lewat repositori, default meta dari templat, kelengkapan di hasil, kiriman parsial diterima. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/ingest/ | SR-04:B, SR-08:C, SR-09:C, SR-10:C, SR-11:C, SR-19:C | tsc; eslint area bersih; asap dryRun: E1 valid dan fixture v1 memo valid dengan REPORT SCHEMA_V1_ADAPTED | implementation |
| SR-13 | Layanan kiriman parsial: bab dan slot ke dokumen misi (buat-atau-revisi, docKey bawaan), kunci advisory dokumen dan pembuatan, idempoten sha, base-check per lingkup dan rebase, pencocokan pid, change otomatis, permintaan render lingkup. Masukan: kontrak §2.5-2.6 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/: submit | SR-03:B, SR-04:B, SR-08:C, SR-10:C, SR-11:C, SR-15:C | tsc; eslint area bersih; asap transaksi-rollback: bab 3 dan bab 5 dari dua transaksi bersamaan keduanya diterima dan kiriman ulang identik unchanged | implementation |
| SR-14 | Layanan revisi: op per pid (replace termasuk ganti tipe, insertBefore/After, delete, move), PATCH alamat menulis baris ternormalisasi, op struktur (reorder, omit/restore, outline, meta, renumberChapters, templateVersion), riwayat pid. Masukan: kontrak §2.6, §2.10 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/revisions/ | SR-04:B, SR-08:C, SR-10:C, SR-11:C | tsc; eslint area bersih; asap transaksi-rollback: replace pid menghasilkan revisi n+1 dengan pid dan alamat sama, move menghasilkan addressMap | implementation |
| SR-15 | Layanan render: lingkup DOCUMENT/CHAPTER/SLOT, gerbang COMPLETE (DOCUMENT_INCOMPLETE), nilai efektif per slot ke RenderContext, berkas draf dan jalur `rev-n/bab-k/`, kolom scope; memakai orkestrator tanpa DB IP-43a. Masukan: kontrak §2.9 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/render/ (kecuali pure/ milik IP-43a dan figures.ts milik IP-42b) | SR-04:B, SR-06:C, SR-10:C, SR-11:C, SR-16:C, SR-17:C, IP-43a:C | tsc; eslint area bersih; asap: render penuh dokumen INCOMPLETE ditolak DOCUMENT_INCOMPLETE dan render bab E2 menghasilkan DOCX draf berlabel Gambar 3.1 | implementation |
| SR-16 | Perakit DOCX sadar slot: planUnits v1/v2, RenderContext per unit dengan nilai efektif slot, placeholder slot kosong pada draf, penempatan tanda tangan dari kenop slot, penanda draf; jalur v1 tidak berubah. Masukan: kontrak §2.9 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/assemble/index.ts, units.ts, numbering.ts (bind.ts milik RQ-1, xml.ts tidak disentuh) | SR-04:B, RQ-1:B | tsc; eslint area bersih; asap: DOCX snapshot E1 dirakit dengan satu seksi per slot dan header sampul kosong dari slot.setup | implementation |
| SR-17 | Perakit HTML sadar slot: padanan SR-16 (nilai per unit, kelas CSS per slot, penanda draf). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/html/assemble/ | SR-04:B, RQ-5:B | tsc; eslint area bersih; asap: HTML E1 dirakit dengan 0 pelanggaran enforceStandalone | implementation |
| SR-18 | Lint struktur: SLOT_CONTENT_MISSING dan CONTENT_CHAPTER_GAP per tier, D16 dari requiredPresets slot. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/lint/structure/ | SR-04:B, SR-05:C, SR-11:C | tsc; eslint area bersih; asap: dokumen TERBIT berisi E2 saja berstatus rilis FAIL dengan SLOT_CONTENT_MISSING | implementation |
| SR-19 | Layanan gambar: simpan StudioAsset (dedupe sha256, dimensi, batas M-02), `resolveAssetRef`. Masukan: kontrak, D-61, D-134 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/images/ | SR-03:B, SR-04:B | tsc; eslint area bersih; asap transaksi-rollback: PNG uji diunggah dua kali menghasilkan satu baris StudioAsset | implementation |
| SR-20 | Route dokumen dan validasi: POST documents (v1/v2, parsial, `renderRefused`), GET documents (docKey, kelengkapan), GET documents/[id] (pohon slot + pid), POST validate (doc/chapter/slot v2). Masukan: kontrak §2.11 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/documents/route.ts, src/app/api/studio/documents/[id]/route.ts, src/app/api/studio/validate/route.ts | SR-04:B, SR-11:C, SR-12:C | tsc; eslint area bersih; asap handler: anonim 401, validate E1 valid:true, v2 bermedan format 400 DISPLAY_FIELD | implementation |
| SR-21 | Route kiriman parsial R12 `/api/studio/chapters` dan R13 `/api/studio/slots`. Masukan: kontrak §2.5 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/: chapters, slots | SR-04:B, SR-13:C | tsc; eslint area bersih; asap handler di v21: agen POST E2 201 lalu ulang 200 unchanged, baris uji dihapus (0 sisa) | implementation |
| SR-22 | Route R14 `/documents/[id]/structure` (GET, PATCH) dan R15 `/documents/[id]/completeness` (GET). Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/documents/[id]/: structure, completeness | SR-04:B, SR-11:C, SR-14:C | tsc; eslint area bersih; asap handler: reorder slot terkunci 422 SLOT_POSITION_LOCKED | implementation |
| SR-23 | Route baca/sunting isi: R16 `/documents/[id]/paragraphs/[pid]` (GET + riwayat, PATCH op per pid) dan R20 `/documents/[id]/content`. Masukan: kontrak §2.5-2.6 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/documents/[id]/: paragraphs, content | SR-04:B, SR-10:C, SR-14:C | tsc; eslint area bersih; asap handler: pid tak dikenal 404 PID_NOT_FOUND dan GET content tanpa sesi 401 | implementation |
| SR-24 | Route R17 `/documents/[id]/render` (lingkup, 409 DOCUMENT_INCOMPLETE terstruktur). Masukan: kontrak §2.6 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/documents/[id]/: render | SR-04:B, SR-15:C | tsc; eslint area bersih; asap handler: render penuh INCOMPLETE 409 dengan details.completeness dan forwardToController | implementation |
| SR-25 | Route R18 `/api/studio/assets` (unggah multipart/base64 idempoten, GET per sha). Masukan: kontrak §2.5 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/: assets | SR-04:B, SR-19:C | tsc; eslint area bersih; asap handler: multipart PNG 201, ulang 200 sha sama, melebihi batas 413 | implementation |
| SR-26 | Route R19 `/templates/[id]/skeleton` (GET kerangka + esensial slot, POST simpan = versi baru). Masukan: kontrak §2.3 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/app/api/studio/templates/[id]/: skeleton | SR-04:B, SR-06:C, SR-07:C | tsc; eslint area bersih; asap handler: USER kirim kunci lanjutan slot 403 PARAM_SURFACE_FORBIDDEN, kunci cakupan document di slot 422 SLOT_PARAM_SCOPE_INVALID | implementation |
| SR-27 | Route registri R03: kind `presets`, `essentials`, `slots`, `paramScopes`, skema v2 dan template v2. Masukan: kontrak | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/registry/route.ts | SR-04:B, SR-05:C | tsc; eslint area bersih; asap handler: kind=essentials mengembalikan maksimal 8 kenop per jenis slot dan schemaId=studio.chapter/v2 200 | implementation |
| SR-61 | Route templat R01/R02 `studio.template/v2`: preset + esensial + kerangka, lanjutan hanya ADMIN/ahli, PRESET_READONLY, `?kind=preset`, API v1 datar tetap untuk ADMIN. Masukan: kontrak §2.3, §2.11 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/app/api/studio/templates/route.ts, src/app/api/studio/templates/[id]/route.ts | SR-04:B, SR-07:C, IP-43b:B | tsc; eslint area bersih; asap handler: USER ubah versi preset 403 PRESET_READONLY dan GET templat tanpa ADMIN hanya memuat preset + esensial | implementation |
| SR-28 | UI Kerangka templat: tulis ulang section-composer menjadi editor slot (tambah, hapus, urut, sakelar, kenop esensial jenis slot di depan, lanjutan terlipat ADMIN/ahli, pratinjau, simpan versi via R19); tanpa setup per bab. Masukan: kontrak §2.12 | coder-execution | frontend-integration, dry-run-verify-fix | EXISTS src/components/studio/section-composer/, src/app/studio/templates/[id]/sections/page.tsx | SR-04:B, SR-26:C, SR-27:C | tsc; eslint area bersih; klaim = berkas tertulis | implementation |
| SR-29 | UI editor templat: pemilih preset, kenop esensial global berlabel awam, panel Lanjutan terlipat (ADMIN/ahli), mode preset ADMIN (editor lengkap), tautan ke Kerangka. Masukan: kontrak §2.12 | coder-execution | frontend-integration, dry-run-verify-fix | EXISTS src/components/studio/template-editor/ | SR-04:B, SR-27:C, SR-61:C | tsc; eslint area bersih; klaim = berkas tertulis | implementation |
| SR-30 | UI penampil dokumen: pohon slot/bab/section/blok dengan alamat dan pid, panel kelengkapan, render bab/slot draf, render penuh aktif hanya COMPLETE. Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | EXISTS src/components/studio/document-viewer/, src/app/studio/documents/[id]/page.tsx | SR-04:B, SR-20:C, SR-22:C, SR-23:C, SR-24:C | tsc; eslint area bersih; klaim = berkas tertulis | implementation |
| SR-31 | UI playground v2: mode Dokumen v2, Kirim Bab, Kirim Slot, Unggah Aset; contoh E1/E2; validasi dengan kelengkapan. Masukan: kontrak | coder-execution | frontend-integration, dry-run-verify-fix | EXISTS src/components/studio/playground/, src/app/studio/playground/page.tsx | SR-04:B, SR-20:C, SR-21:C, SR-25:C | tsc; eslint area bersih; klaim = berkas tertulis | implementation |
| SR-32 | Benchmark v2: doc.json ke doc.v2.json lewat adaptor (0 medan tampilan, glif dideteksi mesin) dan template.json ke template.v2.json (nilai preset Manual 000 lengkap + esensial + kerangka 6 slot), skrip konversi. Masukan: SR-05, SR-09 | coder-execution | dry-run-verify-fix | NEW under benchmark/manual000/: doc.v2.json, template.v2.json, skrip konversi | SR-05:B, SR-09:B, SR-08:C | doc.v2.json lolos skema v2 dan 4.544 unit teks berurutan identik dengan doc.json; nilai efektif template.v2.json sama dengan template.json (sha dikutip) | implementation |
| SR-33 | CLI render v2: tindakan pertama periksa keadaan `run/lib/render.ts` yang ditinggal FIX-3; lalu render_cli menerima doc/chapter v2, template v2, `--scope`, memakai orkestrator tanpa DB. Masukan: kontrak, D-133 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS scripts/parity/run/render_cli.ts, scripts/parity/run/lib/render.ts | SR-04:B, SR-08:C, SR-15:C, IP-43a:C | tsc; eslint area bersih; asap: render_cli E1 dengan scope chapter:2 exit 0 (keluaran dikutip) | implementation |
| SR-34 | Runner benchmark v2: flag dan bawaan doc.v2.json + template.v2.json, v1 tetap, laporan mencatat versi skema. Masukan: SR-33 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS benchmark/harness/run/ | SR-33:C | tsc; eslint area bersih; selftest_verdict lulus dan --help memuat flag v2 | implementation |
| SR-35 | Panduan agent v2 dan seksi API-REFERENCE: prinsip §0 di awal, agen tanpa parameter, kirim/baca/sunting/minta render, E2/E3, forwardToController, sunting per pid, aset dan batas, alamat, kode galat, masa berlaku v1; bagian pengguna templat hanya preset + esensial. Masukan: kontrak, route | coder-execution | dry-run-verify-fix | EXISTS docs/STUDIO-AGENT-GUIDE.md, docs/API-REFERENCE.md | SR-04:B, SR-20:C, SR-21:C, SR-22:C, SR-23:C, SR-24:C, SR-25:C | setiap route baru/berubah tercantum dengan metode, contoh, dan kode galat; setiap contoh JSON agen lolos ajv skema v2 tanpa satu pun medan tampilan atau parameter (keluaran dikutip) | implementation |
| SR-36 | Seed preset dan kerangka: flag `--presets-and-skeletons` (preset DATUM Kanonik dan GSP DATUM dari versi terbaru, versi baru datum-kanonik dan datum-gsp = preset + esensial + kerangka) dan flag `--import-manual000-v2` (dijalankan SR-38); jalankan flag pertama di v21. Masukan: SR-05, SR-06, SR-07, research/09 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS prisma/seed-studio.ts (+ baris seed DB v21) | SR-03:B, SR-05:B, SR-06:B, SR-07:B, IP-43c:B, SR-32:C | seed dua kali tanpa duplikat; paramsSha256 efektif versi baru = versi lama untuk kedua templat (dikutip); hitungan esensial dan lanjutan tersisa per templat dikutip | implementation |
| SR-37 | Backfill: skrip idempoten menulis baris M14-M18 untuk setiap revisi lama dari snapshot via adaptor dan kerangka implisit; jalankan di v21. Masukan: SR-09, SR-10 | coder-execution | backend-execution, dry-run-verify-fix | NEW under prisma/: skrip backfill struktur (+ baris DB v21) | SR-03:B, SR-09:B, SR-10:B, SR-11:B | dijalankan dua kali tanpa duplikat; setiap revisi lama punya baris dengan sha256 rekonstruksi = snapshotSha256; snapshot lama tidak berubah | implementation |
| SR-38 | Jalankan `seed-studio --import-manual000-v2` di v21 dan laporkan keluaran: preset DATUM Manual 000, versi berkerangka datum-manual-000, revisi baru dokumen 000 (D-126). Masukan: SR-36 | coder-execution | dry-run-verify-fix | docs only: catatan delegation_progress (penulis DB v21 tunggal saat jalan) | SR-12:B, SR-32:B, SR-36:B, SR-37:B | exit 0 dengan nomor versi dan revisi dikutip; job render SUCCEEDED; revisi lama dokumen 000 tetap terbaca | implementation |
| IP-41a | Sisa S79 di mesin chart (D-136): fon dasar P-10/K-07 minimal 6,5 pt, peran warna P-10/K-07/K-09/H-07, label Gantt W-07 di dalam grup sumbu, level kontur H-06 (MaxNLocator). Masukan: test/05_parity_chart.md, D-122, D-136 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/chart/ | none | tsc; eslint area bersih; asap: 58 jenis chart bawaan dirender tanpa galat | implementation |
| IP-41b | Parser busur lint render H-08: busur SVG tidak dibaca sebagai tali busur (DATUM-32). Masukan: D-122 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/lint/render/ | none | tsc; eslint area bersih; asap: SVG H-08 bawaan tanpa temuan DATUM-32 | implementation |
| IP-41c | IP-39: ParamDef `chart.kind.*` untuk petunjuk tergambar dari `panelParamsMoved` beserta implementasinya, pin hitungan. Masukan: integration_backlog IP-39, D-113 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/registry/charts.ts, src/lib/studio/engine/chart/, src/lib/studio/params/index.ts (hanya pin hitungan) | IP-41a:B, SR-05:B | tsc; eslint area bersih; setiap petunjuk panelParamsMoved punya ParamDef berlapis lanjutan (hitungan dikutip) | implementation |
| IP-41d | IP-40: medan metadata `x` opsional pada spec panel chart (aditif). Masukan: D-113 | coder-execution | dry-run-verify-fix | EXISTS src/lib/studio/contract/schema/chart.schema.ts | SR-04:B | tsc 0 galat; spec chart dengan dan tanpa x lolos ajv | implementation |
| IP-41e | Pindahkan petunjuk `panelParamsMoved` ke params kunci penuh di spec chart galeri benchmark. Masukan: IP-41c | coder-execution | dry-run-verify-fix | EXISTS benchmark/manual000/figures/index.json (+ specs/*.chart.json) | IP-41c:B | 0 panelParamsMoved tersisa di index.json; validate_figures lulus (keluaran dikutip) | implementation |
| IP-42a | Opsi lembar simbol isi-pas `fit` (port RL Garis B, aditif). Masukan: D-137 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/symbols/ | none | tsc; eslint area bersih; asap: lembar simbol fit setinggi isi (< 247 mm, dikutip) | implementation |
| IP-42b | Teruskan opsi `fit` dari blok symbolSheet di penyiapan figur render. Masukan: IP-42a | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/render/figures.ts | IP-42a:C | tsc; eslint area bersih; asap: opsi fit sampai ke mesin simbol | implementation |
| IP-42c | Spec benchmark fig-25 dan fig-38: lebar sesuai BM bila sah, tinggi direstrukturisasi bila mungkin (D-137 opsi D). Masukan: D-137, BM | coder-execution | dry-run-verify-fix | EXISTS benchmark/manual000/figures/specs/bm-fig-25.diagram.json, specs/bm-fig-38.diagram.json, blocks/bm-fig-25.block.json, blocks/bm-fig-38.block.json | IP-42a:C | validate_figures lulus untuk fig-25 dan fig-38; lebar sesuai BM dikutip | implementation |
| IP-43a | Orkestrator render tanpa DB dan render komposit tanpa templat (permintaan FIX-5, D-134): fungsi murni snapshot + templat ke berkas, dipakai SR-15 dan SR-33. Masukan: D-129, D-134 | coder-execution | backend-execution, dry-run-verify-fix | NEW under src/lib/studio/services/render/: pure | none | tsc; eslint area bersih; asap: render DOCX fixture memo tanpa DATABASE_URL exit 0 | implementation |
| IP-43b | S85 R-13: penolakan berbasis peran memakai FORBIDDEN, PARAM_CLASS_K_FORBIDDEN hanya untuk kunci kelas K. Masukan: gateway_check/04 R-13 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/templates/index.ts, src/app/api/studio/templates/route.ts | none | tsc; eslint area bersih; asap: non-ADMIN ubah kanonik 403 FORBIDDEN | implementation |
| IP-43c | S85 R-22: seed melaporkan section type DB di luar registri tanpa menghapus dan path profil dari lokasi skrip. Masukan: gateway_check/04 R-22 | coder-execution | dry-run-verify-fix | EXISTS prisma/seed-studio.ts | none | tsc 0 galat; seed dijalankan dari luar akar repo menemukan profil (keluaran dikutip) | implementation |
| IP-43d | S87 L-06 sisa: buang `actual` dari details galat integritas fon HTML. Masukan: file_requests.md:109 | coder-execution | dry-run-verify-fix | EXISTS src/lib/studio/engine/html/base/fonts.ts | none | tsc; eslint area bersih; asap: galat integritas fon tanpa medan actual | implementation |
| RQ-1 | Permintaan RT-01: gabung run di package/xml.ts menghormati face XOR faceRole, lalu hapus pengikatan wajah sementara assemble/bind.ts. Masukan: file_requests.md:115 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/package/xml.ts, src/lib/studio/engine/docx/assemble/bind.ts | none | tsc; eslint area bersih; asap: run faceRole tanpa face tidak mewarisi base.face | implementation |
| RQ-2 | Permintaan RT-01 tabel DOCX: symbolGlyphByRole asli (hapus cermin hostCellRole), labelRun peran untuk label SUMBER/PROVENANS, lebar tabel bawaan dari render.table.layout.widthTw. Masukan: file_requests.md:116 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/tables/render.ts | none | tsc; eslint area bersih; asap: label SUMBER memakai labelRun spacingTw 12 dan lebar tabel bawaan 9412 | implementation |
| RQ-3 | Permintaan RT-01 figur DOCX: label KUNCI/SUMBER/PROVENANS memakai labelRun peran figure.keyRow/figure.source. Masukan: file_requests.md:117 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/figures/ | none | tsc; eslint area bersih; asap: label KUNCI figur memakai labelRun | implementation |
| RQ-4 | Permintaan RT-01 validator roleFormats: terima labelRunByMark, rightCell, firstRowCell, signatureCell. Masukan: file_requests.md:118 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/services/templates/profile.ts | none | tsc; eslint area bersih; asap: roleFormats dengan keempat medan diterima | implementation |
| RQ-5 | Permintaan RT-01 paritas HTML konten-saja: spacer peran afterBlock/afterList, render.run.strong, symbolGlyphByRole, warna label rel dari glyphRun. Masukan: file_requests.md:119 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/html/ (kecuali assemble/ dan base/fonts.ts) | none | tsc; eslint area bersih; asap: HTML doc.json konten-saja memuat spacer peran dan strong | implementation |
| RQ-6 | Permintaan RT-01 blok register footer: pola teks sel dari parameter templat (NBSP sesuai BM). Masukan: file_requests.md:121 | coder-execution | backend-execution, dry-run-verify-fix | EXISTS src/lib/studio/engine/docx/package/header-footer.ts | none | tsc; eslint area bersih; asap: sel blok register memakai NBSP dari parameter | implementation |
| SR-39 | Gerbang refaktor selesai (pembuka fase akhir, D-133): semua baris implementasi tercatat diterima, tsc seluruh repo, eslint src/lib/studio dan src/app/api/studio, migrate status. Masukan: laporan baris | verifier | verification-before-completion | NEW <task>/gateway_check/07_refactor_complete_gate.md | SR-03:B, SR-04:B, SR-05:B, SR-06:B, SR-07:B, SR-08:B, SR-09:B, SR-10:B, SR-11:B, SR-12:B, SR-13:B, SR-14:B, SR-15:B, SR-16:B, SR-17:B, SR-18:B, SR-19:B, SR-20:B, SR-21:B, SR-22:B, SR-23:B, SR-24:B, SR-25:B, SR-26:B, SR-27:B, SR-28:B, SR-29:B, SR-30:B, SR-31:B, SR-32:B, SR-33:B, SR-34:B, SR-35:B, SR-36:B, SR-37:B, SR-38:B, SR-60:B, SR-61:B, IP-41a:B, IP-41b:B, IP-41c:B, IP-41d:B, IP-41e:B, IP-42a:B, IP-42b:B, IP-42c:B, IP-43a:B, IP-43b:B, IP-43c:B, IP-43d:B, RQ-1:B, RQ-2:B, RQ-3:B, RQ-4:B, RQ-5:B, RQ-6:B | setiap baris punya laporan dan keputusan penerimaan (ID D dikutip); tsc seluruh repo 0 dan eslint dua area 0; migrate status up to date | gateway_check |
| SR-40 | Sisa FIX-3 bagian pembanding: F-050 (tanda), F-S78-1 (hitung warna), F-051 (klasifikasi tanda matplotlib, zero-baseline, angka label), F-056 (fon tertanam) dengan kasus selftest. Masukan: D-117, D-118, D-122 | coder-execution | receiving-code-review, dry-run-verify-fix | EXISTS scripts/parity/compare/ | SR-39:B | py_compile lulus; selftest_compare lulus; setiap aturan F-050, F-S78-1, F-051, F-056 punya kasus selftest | test |
| SR-41 | Sisa FIX-3 bagian fixture: fixture doc v1 menjadi konten-saja + salinan v2 tanpa medan tampilan, perbaikan DATUM-20/22/23 fixture serah/terbit (D-126), penemuan fixture tanpa garis_a, fixture hop persilangan dan K-08 maksimal 100 unit, S76-H3/H4. Masukan: D-117, D-120, D-126, D-138 | coder-execution | receiving-code-review, dry-run-verify-fix | EXISTS tests/parity/fixtures/doc/, scripts/parity/run/ (kecuali render_cli.ts) | SR-39:B, SR-40:C | setiap fixture doc lolos validator v1 dan v2; check_doc_fixtures exit 0; penemuan fixture tidak memungut garis_a | test |
| SR-42 | Perbarui dan jalankan uji usang S71/S72/S73 (D-130 tokens dan jangkar determinisme, D-137 DATUM-25 dan 5 uji S73, D-138 konten-saja), lalu jalankan suite engine-core, renderers, figures. Masukan: test/s71, s72, s73 | test-expert | tdd | EXISTS tests/unit/studio/engine-core/, tests/unit/studio/renderers/, tests/unit/studio/figures/; NEW <task>/test/11_rerun_s71_s73.md | SR-39:B | suite dijalankan dan keluaran dikutip; setiap ekspektasi yang diubah punya alasan dan rujukan D; kegagalan dipetakan ke baris pemilik | test |
| SR-43 | Perbarui dan jalankan uji S74 (7 ekspektasi D-134, R-13 IP-43b, API templat v2) dan suite api. Masukan: test/s74_unit_api.md | test-expert | tdd | EXISTS tests/unit/studio/api/; NEW <task>/test/12_rerun_s74.md | SR-39:B | suite dijalankan dan keluaran dikutip; setiap ekspektasi yang diubah punya alasan; kegagalan dipetakan ke baris pemilik | test |
| SR-44 | Uji unit struktur dan permukaan: 10 aturan SLOT_*, DISPLAY_FIELD untuk setiap medan tampilan terlarang, adaptor v1→v2, pemetaan glif, kelengkapan, identitas pid, cakupan dan lapis parameter, urutan resolusi preset/esensial/lanjutan/turunan, kerangka implisit, sha rekonstruksi. Masukan: kontrak | test-expert | tdd | NEW under tests/unit/studio/: structure; NEW <task>/test/13_unit_structure.md | SR-39:B | suite dijalankan dan keluaran dikutip; setiap kode §2.7 dan setiap medan tampilan terlarang punya kasus negatif; kegagalan dipetakan ke baris pemilik | test |
| SR-45 | Uji API struktur baru: R12-R20 dan R01/R02/R19 v2 (anonim 401, 3 jalur auth), kiriman bab paralel tanpa 409, SCOPE_CONFLICT, DOCUMENT_INCOMPLETE, op pid, baca isi round-trip, aset dan batas, PRESET_READONLY, PARAM_SURFACE_FORBIDDEN. Masukan: kontrak | test-expert | tdd | NEW under tests/unit/studio/: api-structure; NEW <task>/test/14_api_structure.md | SR-39:B | suite dijalankan dan keluaran dikutip; kasus E2, E3a, E3b, E3c ada dan lulus atau dipetakan; kegagalan dipetakan ke baris pemilik | test |
| SR-46 | Jalankan ulang S76 paritas DOCX (diagnosis DX D-120) atas fixture v1 dan v2. Masukan: harness SR-40/41 | test-expert | tdd | NEW <task>/test/15_rerun_parity_docx.md | SR-40:B, SR-41:B | N fixture dijalankan dan keluaran dikutip; vonis per fixture; kegagalan dipetakan ke baris pemilik | test |
| SR-47 | Jalankan ulang S78 paritas diagram dan simbol (kelas paritas DATUM-25 D-137, fit IP-42). Masukan: harness | test-expert | tdd | NEW <task>/test/16_rerun_parity_diagram.md | SR-40:B, SR-41:B | 10 diagram dan 45 simbol dijalankan; vonis per fixture; kegagalan dipetakan ke baris pemilik | test |
| SR-48 | Jalankan ulang S79 paritas chart setelah IP-39a dan IP-41 (KT-02). Masukan: harness, garis dasar tests/parity/out/s79 | test-expert | tdd | NEW <task>/test/17_rerun_parity_chart.md | SR-40:B, SR-41:B | 58 kode dijalankan; vonis per kode terhadap KT-02 dan selisih terhadap garis dasar D-122; kegagalan dipetakan ke baris pemilik | test |
| SR-49 | S75 diperluas: integrasi di gsp_agent_hq_v21_uji (deploy kedua migrasi), ingest v1/v2, kiriman parsial, render lingkup dan penuh, rekonstruksi snapshot dari tabel, backfill, migrasi templat ke preset dengan nilai efektif sama, render ulang revisi lama identik. Masukan: fixture | test-expert | tdd | NEW under tests/: integration/studio; NEW <task>/test/01_integration_db.md | SR-39:B | suite dijalankan di _uji dan keluaran dikutip; sha256 rekonstruksi = snapshotSha256 untuk setiap revisi uji dan render ulang revisi lama identik; DB produksi tidak tersentuh (nama DB dikutip) | test |
| SR-50 | S77 paritas PDF mesin sama (soffice kedua sisi). Masukan: harness | test-expert | tdd | NEW <task>/test/03_parity_pdf.md | SR-40:B, SR-41:B | N fixture dijalankan dan keluaran dikutip; vonis terhadap §7.3 02_structured; kegagalan dipetakan ke baris pemilik | test |
| SR-51 | S98 benchmark Manual 000 atas doc.v2.json + template.v2.json (preset Manual 000), run resmi figur mesin (D-118, D-129), diagnosis raster terpisah. Masukan: runner SR-34 | test-expert | tdd | NEW <task>/test/09_benchmark_manual000.md | SR-39:B | BM1 minimal 98 persen dan BM2 selisih maks 2 persen dikutip; BM3 minimal 100/102; BM4 minimal 0,95 dengan halaman dan figur di bawah ambang terdaftar | test |
| SR-52 | S80 E2E diperluas, satu sesi terskrip: alur A, T (preset + esensial; lanjutan terlipat untuk USER), E, G, N, P, Y + K (kerangka) + U1 (bab 3 misi A dengan gambar, render bab draf) + U2 (bab 3 dan 5 paralel, render penuh ditolak) + U3 (isi slot, PATCH pid, render penuh). Masukan: HQ hidup 9011 | test-expert | tdd, webapp-testing | NEW under tests/: e2e/studio; NEW <task>/test/06_e2e_session.md | SR-39:B | semua alur dijalankan dengan tangkapan layar; galat konsol nol; kegagalan dipetakan ke baris pemilik | test |
| SR-53 | S82 gladi rollback di _uji: rollback delta struktur lalu rollback Studio asli. Masukan: SR-01, 01_specs §1.4 | test-expert | tdd | NEW <task>/test/08_rollback_rehearsal.md | SR-49:B | tabel/tipe/kolom baru hilang lebih dulu lalu tabel Studio; hitungan baris tabel lama identik; migrate status konsisten dan keluaran dikutip | test |
| SR-54 | S81 kinerja lewat CLI: dokumen 30 halaman, Manual 000, render bab 10 halaman (ambang usul 15 s), chart, diagram; host tenang. Masukan: CLI SR-33 | test-expert | tdd | NEW <task>/test/07_performance.md | SR-39:B | angka p50/p95 dikutip dari keluaran; vonis terhadap ambang | test |
| SR-55 | Review kode delta struktur: migrasi, kontrak (uji prinsip §0), registri struktur dan permukaan, engine/tokens turunan, layanan skeleton/templates/compose/adapt-v1/structure/completeness/ingest/submit/revisions/render/images, lint struktur, route R01-R20, seed, backfill, IP-43a/b/c. Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/08_review_structural_services.md | SR-39:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| SR-56 | Review kode delta mesin, UI, benchmark, CLI, dokumen: perakit DOCX/HTML, UI SR-28..SR-31, SR-32..SR-35, IP-41, IP-42, IP-43d, RQ-1..RQ-6. Masukan: diff area | senior-code-reviewer | code-review-senior | NEW <task>/gateway_check/09_review_structural_engine_ui.md | SR-39:B | vonis PASS/CAUTION/FAIL per modul; setiap temuan punya berkas:baris dan baris pemilik | gateway_check |
| SR-57 | Security review ulang S87 (D-123, D-135) diperluas: route R01-R20 baru/berubah, kunci advisory, unggah aset dan batas, gerbang kepercayaan pada kiriman parsial dan PATCH pid, lapis parameter dan preset (eskalasi hak), ingest.inlineFormat. Masukan: diff area | security-review | security-review-gate | NEW <task>/gateway_check/10_security_rerun.md | SR-39:B | vonis PASS/CAUTION/FAIL; 5 Medium + 7 Low D-121 terverifikasi tertutup; temuan baru punya berkas:baris dan tingkat, CAUTION/FAIL ditandai untuk user | gateway_check |
| SR-58 | S88 diperluas: verifikasi menyeluruh terhadap §7 02_structured dan SC-1..SC-14 adendum ini, dengan bukti segar dari SR-42..SR-57; petakan baris F2 asli ke SR. Masukan: semua laporan fase akhir | verifier | verification-before-completion | NEW <task>/verification/01_verification.md | SR-42:B, SR-43:B, SR-44:B, SR-45:B, SR-46:B, SR-47:B, SR-48:B, SR-49:B, SR-50:B, SR-51:B, SR-52:B, SR-53:B, SR-54:B, SR-55:B, SR-56:B, SR-57:B | setiap kriteria punya vonis dan bukti; nol klaim tanpa sumber; status S75, S77, S80, S81, S82, S88, S98 dipetakan ke SR | verification |

## Execution Profile

Penanda path:
- `EXISTS:` diverifikasi Glob/Read sesi ini.
- `NEW under <induk>`: induk ada dan target dikonfirmasi tidak ada. Dasarnya:
  - Glob `services/*/index.ts` hanya 6 layanan.
  - `API/**/route.ts` tanpa chapters, slots, assets, structure, completeness, paragraphs, content, render, skeleton.
  - `registry/` tanpa slots.ts/essentials.ts; `params/` tanpa structure.ts.
  - `benchmark/manual000/*.json` tanpa v2.
  - `prisma/*.ts` hanya seed.ts dan seed-studio.ts.
  - `tests/unit/studio/` hanya api, engine-core, figures, renderers.
  - `<task>/research` 01-07; `<task>/gateway_check` 02-06; `<task>/test` 02, 04, 05, s71-s74; `<task>/implementation` 01-03 + berkas fix/ip/rt.
- Nama berkas di dalam area ditetapkan eksekutor dan diklaim di `file_claims.md`.

Singkatan: G = gerbang ringan D-133 (tsc seluruh repo teratribusi, eslint area). Alur E2E: A agen, T templat, E edit, G galeri, N navigasi, P playground, Y status sistem, K kerangka, U1-U3 use case.

| Step | Ownership area (exact paths) | Size | Dep kind | Model | Checks | Review |
|---|---|---|---|---|---|---|
| SR-01 | docs only: <task>/masterplan/03_structural_sections_specs.md (register nama, penulis tunggal) | M | none | inherit | 3 | batched |
| SR-02 | docs only: <task>/research/08_param_slot_scope_map.md | M | SR-01:C | inherit | 2 | batched |
| SR-59 | docs only: <task>/research/09_param_surface_design.md | M | SR-02:B | inherit | 3 | batched |
| SR-03 | shared DB schema, penulis tunggal: EXISTS: prisma/schema.prisma; NEW under prisma/migrations/: migrasi struktur; marker <task>/implementation/04_structure_migration_landed.md; DB v21 + shadow | M (risiko tertinggi) | SR-01:B | inherit | 3 | batched |
| SR-04 | shared contract, penulis tunggal: EXISTS: src/lib/studio/contract/index.ts, contract/address.ts, contract/enums.ts, contract/types/doc.ts, contract/types/model.ts, contract/schema/doc.schema.ts (+ berkas baru di contract/types dan contract/schema); marker <task>/implementation/05_structure_contract_landed.md | M | SR-01:B | inherit | 3 | batched |
| SR-05 | registri struktur dan permukaan, penulis tunggal pin hitungan: NEW under src/lib/studio/registry/: slots.ts, essentials.ts; NEW under src/lib/studio/params/: structure.ts; EXISTS: src/lib/studio/params/index.ts, src/lib/studio/registry/index.ts | M | SR-02:B, SR-59:B, SR-04:C | sonnet (transkripsi peta research) | 2 | batched |
| SR-60 | EXISTS: src/lib/studio/engine/tokens/ | M | SR-59:B, SR-05:C | inherit | 3 G + asap | batched |
| SR-06 | NEW under src/lib/studio/services/: skeleton | M | SR-03:B, SR-04:B, SR-05:C, SR-60:C | inherit | 3 G + asap | batched |
| SR-07 | EXISTS: src/lib/studio/services/templates/ | S | SR-04:B, SR-06:C, IP-43b:B, RQ-4:B | inherit | 3 G + asap | batched |
| SR-08 | NEW under src/lib/studio/services/: compose | M | SR-04:B, SR-05:C, SR-06:C, SR-11:C | inherit | 3 G + asap | batched |
| SR-09 | NEW under src/lib/studio/services/: adapt-v1 | M | SR-04:B, SR-08:C | inherit | 3 G + asap | batched |
| SR-10 | NEW under src/lib/studio/services/: structure; pengguna DB v21 (transaksi-rollback) | M | SR-03:B, SR-04:B, SR-08:C | inherit | 3 G + asap | batched |
| SR-11 | NEW under src/lib/studio/services/: completeness | S | SR-04:B, SR-06:C | inherit | 3 G + asap | batched |
| SR-12 | EXISTS: src/lib/studio/services/ingest/ | M | SR-04:B, SR-08:C, SR-09:C, SR-10:C, SR-11:C, SR-19:C | inherit | 3 G + asap | batched |
| SR-13 | NEW under src/lib/studio/services/: submit; pengguna DB v21 (transaksi-rollback) | M | SR-03:B, SR-04:B, SR-08:C, SR-10:C, SR-11:C, SR-15:C | inherit | 3 G + asap | batched |
| SR-14 | EXISTS: src/lib/studio/services/revisions/ | M | SR-04:B, SR-08:C, SR-10:C, SR-11:C | inherit | 3 G + asap | batched |
| SR-15 | EXISTS: src/lib/studio/services/render/ (tanpa pure/ dan figures.ts) | M | SR-04:B, SR-06:C, SR-10:C, SR-11:C, SR-16:C, SR-17:C, IP-43a:C | inherit | 3 G + asap | batched |
| SR-16 | EXISTS: src/lib/studio/engine/docx/assemble/index.ts, assemble/units.ts, assemble/numbering.ts | M | SR-04:B, RQ-1:B | inherit | 3 G + asap | batched |
| SR-17 | EXISTS: src/lib/studio/engine/html/assemble/ | M | SR-04:B, RQ-5:B | inherit | 3 G + asap | batched |
| SR-18 | EXISTS: src/lib/studio/engine/lint/structure/ | S | SR-04:B, SR-05:C, SR-11:C | inherit | 3 G + asap | batched |
| SR-19 | EXISTS: src/lib/studio/services/images/ | S | SR-03:B, SR-04:B | inherit | 3 G + asap | batched |
| SR-20 | EXISTS: src/app/api/studio/documents/route.ts, src/app/api/studio/documents/[id]/route.ts, src/app/api/studio/validate/route.ts | M | SR-04:B, SR-11:C, SR-12:C | inherit | 3 G + asap | batched |
| SR-21 | NEW under src/app/api/studio/: chapters, slots | M | SR-04:B, SR-13:C | inherit | 3 G + asap | batched |
| SR-22 | NEW under src/app/api/studio/documents/[id]/: structure, completeness | S | SR-04:B, SR-11:C, SR-14:C | inherit | 3 G + asap | batched |
| SR-23 | NEW under src/app/api/studio/documents/[id]/: paragraphs, content | S | SR-04:B, SR-10:C, SR-14:C | inherit | 3 G + asap | batched |
| SR-24 | NEW under src/app/api/studio/documents/[id]/: render | S | SR-04:B, SR-15:C | inherit | 3 G + asap | batched |
| SR-25 | NEW under src/app/api/studio/: assets | S | SR-04:B, SR-19:C | inherit | 3 G + asap | batched |
| SR-26 | NEW under src/app/api/studio/templates/[id]/: skeleton | S | SR-04:B, SR-06:C, SR-07:C | inherit | 3 G + asap | batched |
| SR-27 | EXISTS: src/app/api/studio/registry/route.ts | S | SR-04:B, SR-05:C | inherit | 3 G + asap | batched |
| SR-61 | EXISTS: src/app/api/studio/templates/route.ts, src/app/api/studio/templates/[id]/route.ts (setelah IP-43b) | S | SR-04:B, SR-07:C, IP-43b:B | inherit | 3 G + asap | batched |
| SR-28 | EXISTS: src/components/studio/section-composer/, src/app/studio/templates/[id]/sections/page.tsx | M | SR-04:B, SR-26:C, SR-27:C | inherit | 3 G + klaim; E2E K | batched |
| SR-29 | EXISTS: src/components/studio/template-editor/ | S | SR-04:B, SR-27:C, SR-61:C | inherit | 3 G + klaim; E2E T | batched |
| SR-30 | EXISTS: src/components/studio/document-viewer/, src/app/studio/documents/[id]/page.tsx | M | SR-04:B, SR-20:C, SR-22:C, SR-23:C, SR-24:C | inherit | 3 G + klaim; E2E U1-U3 | batched |
| SR-31 | EXISTS: src/components/studio/playground/, src/app/studio/playground/page.tsx | M | SR-04:B, SR-20:C, SR-21:C, SR-25:C | inherit | 3 G + klaim; E2E P | batched |
| SR-32 | NEW under benchmark/manual000/: doc.v2.json, template.v2.json, skrip konversi | M | SR-05:B, SR-09:B, SR-08:C | inherit | 2; BM | batched |
| SR-33 | EXISTS: scripts/parity/run/render_cli.ts, scripts/parity/run/lib/render.ts | S | SR-04:B, SR-08:C, SR-15:C, IP-43a:C | inherit | 3 G + asap | batched |
| SR-34 | EXISTS: benchmark/harness/run/ | S | SR-33:C | inherit | 3 G + selftest | batched |
| SR-35 | EXISTS: docs/STUDIO-AGENT-GUIDE.md, docs/API-REFERENCE.md (penulis tunggal keduanya) | M | SR-04:B, SR-20:C, SR-21:C, SR-22:C, SR-23:C, SR-24:C, SR-25:C | inherit | 2 | batched |
| SR-36 | EXISTS: prisma/seed-studio.ts; eksekusi seed DB v21 (penulis DB tunggal di batch) | M | SR-03:B, SR-05:B, SR-06:B, SR-07:B, IP-43c:B, SR-32:C | inherit | 3 | batched |
| SR-37 | NEW under prisma/: skrip backfill struktur; eksekusi DB v21 (setelah SR-36, diserialisasi controller) | M | SR-03:B, SR-09:B, SR-10:B, SR-11:B | inherit | 3 | batched |
| SR-38 | docs only: catatan delegation_progress; runtime DB v21 + akar sandbox (penulis tunggal saat jalan); pengguna soffice | S | SR-12:B, SR-32:B, SR-36:B, SR-37:B | sonnet (jalankan perintah, laporkan) | 3 | batched |
| IP-41a | EXISTS: src/lib/studio/engine/chart/ | M | none | inherit | 3 G + asap | batched |
| IP-41b | EXISTS: src/lib/studio/engine/lint/render/ | S | none | inherit | 3 G + asap | batched |
| IP-41c | EXISTS: src/lib/studio/registry/charts.ts, src/lib/studio/engine/chart/, src/lib/studio/params/index.ts (pin hitungan saja) | M | IP-41a:B, SR-05:B | inherit | 3 | batched |
| IP-41d | EXISTS: src/lib/studio/contract/schema/chart.schema.ts (setelah SR-04 melepas contract) | S | SR-04:B | inherit | 2 | batched |
| IP-41e | EXISTS: benchmark/manual000/figures/index.json (+ specs/*.chart.json) | S | IP-41c:B | inherit | 2; BM | batched |
| IP-42a | EXISTS: src/lib/studio/engine/symbols/ | M | none | inherit | 3 G + asap | batched |
| IP-42b | EXISTS: src/lib/studio/services/render/figures.ts | S | IP-42a:C | inherit | 3 G + asap | batched |
| IP-42c | EXISTS: benchmark/manual000/figures/specs/bm-fig-25.diagram.json, specs/bm-fig-38.diagram.json, blocks/bm-fig-25.block.json, blocks/bm-fig-38.block.json | S | IP-42a:C | inherit | 2; BM | batched |
| IP-43a | NEW under src/lib/studio/services/render/: pure | M | none | inherit | 3 G + asap | batched |
| IP-43b | EXISTS: src/lib/studio/services/templates/index.ts, src/app/api/studio/templates/route.ts | S | none | inherit | 3 G + asap | batched |
| IP-43c | EXISTS: prisma/seed-studio.ts | S | none | inherit | 2 | batched |
| IP-43d | EXISTS: src/lib/studio/engine/html/base/fonts.ts | S | none | inherit | 3 G + asap | batched |
| RQ-1 | EXISTS: src/lib/studio/engine/docx/package/xml.ts, src/lib/studio/engine/docx/assemble/bind.ts | S | none | inherit | 3 G + asap | batched |
| RQ-2 | EXISTS: src/lib/studio/engine/docx/tables/render.ts | M | none | inherit | 3 G + asap; BM | batched |
| RQ-3 | EXISTS: src/lib/studio/engine/docx/figures/ | S | none | inherit | 3 G + asap; BM | batched |
| RQ-4 | EXISTS: src/lib/studio/services/templates/profile.ts | S | none | inherit | 3 G + asap | batched |
| RQ-5 | EXISTS: src/lib/studio/engine/html/ (kecuali assemble/ dan base/fonts.ts) | M | none | inherit | 3 G + asap | batched |
| RQ-6 | EXISTS: src/lib/studio/engine/docx/package/header-footer.ts | S | none | inherit | 3 G + asap | batched |
| SR-39 | docs only: <task>/gateway_check/07_refactor_complete_gate.md | S | SR-03:B, SR-04:B, SR-05:B, SR-06:B, SR-07:B, SR-08:B, SR-09:B, SR-10:B, SR-11:B, SR-12:B, SR-13:B, SR-14:B, SR-15:B, SR-16:B, SR-17:B, SR-18:B, SR-19:B, SR-20:B, SR-21:B, SR-22:B, SR-23:B, SR-24:B, SR-25:B, SR-26:B, SR-27:B, SR-28:B, SR-29:B, SR-30:B, SR-31:B, SR-32:B, SR-33:B, SR-34:B, SR-35:B, SR-36:B, SR-37:B, SR-38:B, SR-60:B, SR-61:B, IP-41a:B, IP-41b:B, IP-41c:B, IP-41d:B, IP-41e:B, IP-42a:B, IP-42b:B, IP-42c:B, IP-43a:B, IP-43b:B, IP-43c:B, IP-43d:B, RQ-1:B, RQ-2:B, RQ-3:B, RQ-4:B, RQ-5:B, RQ-6:B | inherit (agen verifikasi) | 3 | n/a |
| SR-40 | EXISTS: scripts/parity/compare/ | M | SR-39:B | inherit | 3 | batched |
| SR-41 | EXISTS: tests/parity/fixtures/doc/, scripts/parity/run/ (tanpa render_cli.ts) | M | SR-39:B, SR-40:C | inherit | 3 | batched |
| SR-42 | EXISTS: tests/unit/studio/engine-core/, tests/unit/studio/renderers/, tests/unit/studio/figures/; docs: <task>/test/11_rerun_s71_s73.md | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-43 | EXISTS: tests/unit/studio/api/; docs: <task>/test/12_rerun_s74.md | S | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-44 | NEW under tests/unit/studio/: structure; docs: <task>/test/13_unit_structure.md | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-45 | NEW under tests/unit/studio/: api-structure; docs: <task>/test/14_api_structure.md | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-46 | docs only: <task>/test/15_rerun_parity_docx.md (biner ke tests/parity/out/sr46) | S | SR-40:B, SR-41:B | inherit (agen verifikasi) | 3 | n/a |
| SR-47 | docs only: <task>/test/16_rerun_parity_diagram.md (biner ke tests/parity/out/sr47); pengguna Chromium | S | SR-40:B, SR-41:B | inherit (agen verifikasi) | 3 | n/a |
| SR-48 | docs only: <task>/test/17_rerun_parity_chart.md (biner ke tests/parity/out/sr48); pengguna Chromium | M | SR-40:B, SR-41:B | inherit (agen verifikasi) | 3 | n/a |
| SR-49 | NEW under tests/: integration/studio; docs: <task>/test/01_integration_db.md; DB _uji (penulis tunggal, lalu SR-53); pengguna soffice | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-50 | docs only: <task>/test/03_parity_pdf.md; pengguna soffice | S | SR-40:B, SR-41:B | inherit (agen verifikasi) | 3 | n/a |
| SR-51 | docs only: <task>/test/09_benchmark_manual000.md (biner ke benchmark/out); pengguna soffice | M | SR-39:B | inherit (agen verifikasi) | 3; BM | n/a |
| SR-52 | NEW under tests/: e2e/studio; docs: <task>/test/06_e2e_session.md; port 9011, pengguna Chromium + soffice | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-53 | docs only: <task>/test/08_rollback_rehearsal.md; DB _uji (setelah SR-49) | S | SR-49:B | inherit (agen verifikasi) | 3 | n/a |
| SR-54 | docs only: <task>/test/07_performance.md; pengguna soffice, host tenang | S | SR-39:B | inherit (agen verifikasi) | 2 | n/a |
| SR-55 | docs only: <task>/gateway_check/08_review_structural_services.md | M | SR-39:B | inherit (agen verifikasi) | 2 | n/a |
| SR-56 | docs only: <task>/gateway_check/09_review_structural_engine_ui.md | M | SR-39:B | inherit (agen verifikasi) | 2 | n/a |
| SR-57 | docs only: <task>/gateway_check/10_security_rerun.md | M | SR-39:B | inherit (agen verifikasi) | 3 | n/a |
| SR-58 | docs only: <task>/verification/01_verification.md | M | SR-42:B, SR-43:B, SR-44:B, SR-45:B, SR-46:B, SR-47:B, SR-48:B, SR-49:B, SR-50:B, SR-51:B, SR-52:B, SR-53:B, SR-54:B, SR-55:B, SR-56:B, SR-57:B | inherit (agen verifikasi) | 3 | n/a |

### Shared resources (single-writer)

| Sumber daya | Satu-satunya penulis | Catatan |
|---|---|---|
| `prisma/schema.prisma`, folder migrasi baru, `migrate deploy` v21, `_shadow` | SR-03 | D-21 |
| `src/lib/studio/contract/**` | SR-04, kemudian IP-41d (setelah marker) | Read-only setelah marker; DeriveFnId baru dari SR-60 lewat `file_requests.md` |
| `src/lib/studio/params/index.ts` (agregat + pin) | SR-05 di B2a; IP-41c di B3 (pin saja) | Beda batch |
| `src/lib/studio/registry/index.ts`, `registry/slots.ts`, `registry/essentials.ts`, `params/structure.ts` | SR-05 | |
| `src/lib/studio/engine/tokens/**` | SR-60 | |
| `src/lib/studio/services/templates/**` | IP-43b (`index.ts`) dan RQ-4 (`profile.ts`) di B0, lalu SR-07 di B2 | Per berkas di B0 |
| `src/app/api/studio/templates/route.ts` | IP-43b (B0), lalu SR-61 (B2b) | Berurutan |
| `src/lib/studio/services/render/**` | SR-15 (selain `pure/` dan `figures.ts`); IP-43a (`pure/`); IP-42b (`figures.ts`) | Per berkas |
| `src/lib/studio/engine/docx/assemble/**` | RQ-1 (`bind.ts`, B0), SR-16 (`index.ts`, `units.ts`, `numbering.ts`, B2b) | `xml.ts` tak dimiliki (KC-3) |
| `src/lib/studio/engine/html/**` | RQ-5 (selain `assemble/`, `base/fonts.ts`), IP-43d (`base/fonts.ts`), SR-17 (`assemble/`) | |
| `src/lib/studio/http/**` | Tidak ada (read-only) | Lewat `file_requests.md` |
| `prisma/seed-studio.ts` + eksekusi seed | IP-43c (B0), lalu SR-36 (B3); `--import-manual000-v2` oleh SR-38 | Berurutan |
| Data DB `gsp_agent_hq_v21` | Penulis permanen SR-36, lalu SR-37, lalu SR-38 (serial); asap transaksi-rollback SR-07, SR-10, SR-13, SR-14, SR-19, SR-21 | Asap 0 baris tersisa |
| `gsp_agent_hq_v21_uji` | SR-49, lalu SR-53 | Berurutan |
| `benchmark/manual000/` | SR-32 (doc.v2.json, template.v2.json, skrip); IP-41e (`figures/index.json`, `specs/*.chart.json`); IP-42c (berkas fig-25/fig-38) | Berkas saling lepas |
| `scripts/parity/run/**` | SR-33 (implementasi); SR-41 (fase akhir, selain render_cli.ts) | Beda fase |
| `docs/STUDIO-AGENT-GUIDE.md`, `docs/API-REFERENCE.md` | SR-35 | |
| LibreOffice soffice | Runtime SR-38 (B4); SR-49, SR-51 (B6); SR-50, SR-52 (B7); SR-54 (B8 sendirian) | Maksimal 2 bersamaan |
| Chromium | SR-47, SR-48, SR-52 (B7) | Maksimal 3 bersamaan |
| Port 9011 / HQ hidup | SR-52 | Controller me-restart HQ sebelum SR-52 |
| Berkas controller (`status_tasks.md`, `README.md`, `decisions/decisions.md`, `findings/`, `implementation/99_*`, `report/`, `delegation_progress/driver_rules.md`, `file_ownership.md`) | Controller | |

### Gelombang, batch, jalur kritis

Gelombang logis dari tepi B:

| Tingkat | Baris |
|---|---|
| L0 | SR-01, SR-02, SR-34, IP-41a, IP-41b, IP-42a, IP-42b, IP-42c, IP-43a, IP-43b, IP-43c, IP-43d, RQ-1..RQ-6 (18) |
| L1 | SR-03, SR-04, SR-59 (3) |
| L2 | SR-05, SR-06..SR-31, SR-33, SR-35, SR-60, SR-61, IP-41d (32) |
| L3 | SR-32, SR-36, SR-37, IP-41c (4) |
| L4 | SR-38, IP-41e (2) |
| L5 | SR-39 |
| L6 | SR-40..SR-45, SR-49, SR-51, SR-52, SR-54..SR-57 (14) |
| L7 | SR-46, SR-47, SR-48, SR-50, SR-53 (5) |
| L8 | SR-58 |

Batch peluncuran (plafon 20 subagen; controller memediasi klaim dan mencatat lebar di atas 4):

| Batch | Baris | Lebar | Catatan |
|---|---|---|---|
| B0 (segera setelah persetujuan) | SR-01, SR-02, SR-34, IP-41a, IP-41b, IP-42a, IP-42b, IP-42c, IP-43a, IP-43b, IP-43c, IP-43d, RQ-1..RQ-6 | 18 | Spesifikasi bersamaan dengan backlog kode berarea lepas |
| B1 (landing kontrak + desain permukaan) | SR-03, SR-04, SR-59 | 3 | Marker 04 dan 05 menjadi syarat B2 |
| B2a | SR-05, SR-06..SR-15, SR-18..SR-26 | 20 | Registri, layanan, lint, route; tepi C antarbaris |
| B2b | SR-16, SR-17, SR-27..SR-31, SR-33, SR-35, SR-60, SR-61, IP-41d | 12 | Mulai saat slot B2a kosong |
| B3 | SR-32, SR-36, SR-37, IP-41c | 4 | SR-36 lalu SR-37 untuk DB |
| B4 | SR-38, IP-41e | 2 | |
| B5 | SR-39 | 1 | Pembuka fase akhir (D-133) |
| B6 | SR-40..SR-45, SR-49, SR-51, SR-55, SR-56, SR-57 | 11 | soffice 2 (SR-49, SR-51) |
| B7 | SR-46, SR-47, SR-48, SR-50, SR-52, SR-53 | 6 | soffice 2 (SR-50, SR-52); Chromium 3 |
| B8 | SR-54 | 1 | Host tenang |
| B9 | SR-58 | 1 | Lalu loop perbaikan (maksimal 3 siklus per kriteria), termasuk FIX-2/FIX-4 (KC-3), lalu commit lokal (S89) |

Jalur kritis (tepi B): SR-01 → SR-04 → SR-09 → SR-32 → SR-38 → SR-39 → SR-40 → SR-46 → SR-58 (9 tingkat). Jalur paralel sama panjang: SR-01 → SR-02 → SR-59 → SR-05 → SR-32 dan SR-39 → SR-49 → SR-53 → SR-58.

Cara memperpendek:
1. SR-39 cukup C pada SR-38. Hemat satu tingkat.
2. Bila CPU di bawah 85 persen, B2a dan B2b digabung (lebar 32) dengan mediasi aktif.

### Pernyataan biaya (estimasi)

- Baris: 79, terdiri dari S 35 dan M 44. Tidak ada L.
- Model: 2 sonnet (SR-05 transkripsi peta, SR-38 jalankan perintah) dan 77 inherit. Semua agen verifikasi inherit.
- Gelombang: 9 tingkat logis (L0-L8) dan 11 batch. Tingkat logis terlebar L2 = 32. Batch terlebar B2a = 20 (plafon).
- Jalur kritis: SR-01 → SR-04 → SR-09 → SR-32 → SR-38 → SR-39 → SR-40 → SR-46 → SR-58.
- Tiga baris termahal:
  - SR-04: kontrak v2 konten murni + template v2, penulis tunggal, semua baris B2 menunggu.
  - SR-08: compose, yaitu 10 aturan, pemetaan konten, snapshot v2, penggabungan.
  - SR-59: desain permukaan untuk sekitar 722 kunci dengan pemetaan kenop dan isi 3 preset.
- Grounding:
  - EXISTS = 70 entri path pada 44 baris, semuanya terverifikasi Glob/Read sesi ini.
  - NEW-under = 22 baris (SR-03, SR-04, SR-05, SR-06, SR-08, SR-09, SR-10, SR-11, SR-13, SR-21..SR-26, SR-32, SR-37, IP-43a, SR-44, SR-45, SR-49, SR-52); induk terverifikasi dan target terkonfirmasi tidak ada.
  - UNKNOWN = 0.
  - docs only = 16 baris.

## 4. Kriteria penerimaan struktural (diukur di fase akhir; SR-58)

| Kode | Kriteria | Ambang / bukti | Baris |
|---|---|---|---|
| SC-1 | Migrasi aditif | 0 DROP; 9 tabel + 3 tipe `Studio*`; migrate status up to date; hitungan baris tabel lama identik | SR-03, SR-53 |
| SC-2 | Cakupan parameter | Setiap kunci punya tepat satu cakupan; di luar cakupan slot ditolak 422 | SR-05, SR-44, SR-45 |
| SC-3 | Kerangka templat | 3 templat seed berkerangka; simpan kerangka = versi baru, versi lama tetap; K oleh USER 403, T 400 | SR-36, SR-38, SR-45, SR-52 K |
| SC-4 | Validasi struktur | Setiap kode §2.7 punya kasus negatif yang lulus | SR-44 |
| SC-5 | DB ternormalisasi | sha256 snapshot rekonstruksi dari M14-M18 = `snapshotSha256` untuk revisi baru dan lama | SR-44, SR-49 |
| SC-6 | Kompatibilitas mundur | Fixture v1 lolos via adaptor; render ulang revisi lama identik; backfill idempoten | SR-37, SR-46, SR-49 |
| SC-7 | Kiriman parsial (D-128) | Kiriman pertama membuat dokumen (201); ulang identik 200 `unchanged`; pembaruan n+1 dengan `changedAddresses` hanya bab itu; render bab berlabel `Gambar 3.1` di `3.2.3` | SR-45, SR-49, SR-52 U1 |
| SC-8 | Paralel dan kelengkapan (D-131) | Dua bab berbeda bersamaan diterima tanpa 409; lingkup sama = 409 `SCOPE_CONFLICT`; render penuh INCOMPLETE = 409 `DOCUMENT_INCOMPLETE` dengan `forwardToController`; setiap respons memuat kelengkapan | SR-45, SR-52 U2 |
| SC-9 | Baca dan sunting per id | GET content = bentuk kiriman + pid; op per pid; pid tetap saat bergeser; paragraf ke gambar; COMPLETE + sunting memicu render penuh | SR-45, SR-52 U3 |
| SC-10 | Aset | Multipart dan base64; idempoten sha; 413/415/422 sesuai batas; blok berelasi ke `StudioAsset` | SR-45, SR-57 |
| SC-11 | Benchmark (D-17) | doc.v2 + preset Manual 000: BM1 minimal 98 persen, BM2 maksimal 2 persen, BM3 minimal 100/102, BM4 minimal 0,95, figur mesin | SR-51 |
| SC-12 | Security | SR-57 tanpa FAIL; CAUTION disajikan ke user | SR-57 |
| SC-13 | Kontrak agen bebas tampilan (§0) | Skema v2 menolak setiap medan tampilan (DISPLAY_FIELD); E1, E2, contoh panduan, doc.v2.json tanpa medan tampilan atau parameter; glif benchmark benar tanpa `faceRole` dari agen | SR-44, SR-35, SR-32, SR-51 |
| SC-14 | Permukaan parameter ringkas | Esensial total maksimal 60 dan maksimal 8 per jenis slot (registri kind=essentials dikutip); editor templat untuk USER hanya menampilkan preset + esensial, lanjutan terlipat dan 403 untuk USER; hitungan sebelum/sesudah per lapis dilaporkan; migrasi templat lama ke preset + esensial dengan `paramsSha256` efektif sama | SR-59, SR-36, SR-45, SR-52 T |

## 5. Risiko

| # | Risiko | Kemungkinan / dampak | Mitigasi |
|---|---|---|---|
| R1 | Kontrak v2 (SR-04) keliru sehingga 32 baris B2 mengejar sasaran bergerak | Sedang / tinggi | SR-01 register tunggal; E1-E3 wajib lolos ajv; perubahan lewat `file_requests.md` |
| R2 | Integrasi baru teruji di fase akhir (D-133) | Tinggi / sedang | Asap fungsi per baris kunci; tsc per baris; SR-39 gerbang |
| R3 | Jalur v1 berubah tanpa sengaja | Sedang / tinggi | Cabang norm/v1 dipertahankan; SC-6; RQ sengaja mengubah keluaran (tercatat) |
| R4 | Balapan kiriman paralel | Sedang / tinggi | Kunci advisory; unik `(missionFolder, missionDocKey)`; asap SR-13; uji E3a |
| R5 | Ambiguitas cakupan dan lapis parameter | Sedang / sedang | Cakupan `shared:`/`section:<perangkat>`; SR-02/SR-59 wajib 0 tanpa cakupan/lapis |
| R6 | Pertumbuhan baris: salinan penuh per revisi | Pasti / rendah | Diterima v2.1 (KD-03); copy-on-write ditunda |
| R7 | Drift snapshot vs tabel | Rendah / tinggi | Cek sha rekonstruksi saat tulis; SC-5 |
| R8 | Konversi benchmark, deteksi glif, atau preset Manual 000 mengubah hasil | Sedang / tinggi | SR-32 cek unit teks dan nilai efektif sama; set glif dari 42 run doc.json; SR-51 |
| R9 | Nomor halaman lokal render bab membingungkan | Sedang / rendah | Berkas draf + penanda; KC-4 |
| R10 | FIX-3 berhenti di tengah suntingan | Pasti / sedang | Tindakan pertama SR-33; sisa di SR-40/SR-41 |
| R11 | Batch 20 baris membebani CPU | Tinggi / sedang | Sinyal CPU; B2a/B2b dapat dipersempit |
| R12 | Medan tampilan menyusup lewat jalur lain (chart spec, meta) | Sedang / sedang | Uji prinsip §0 di SR-01 dan SR-55; SC-13 |
| R13 | Kenop turunan (warna aksen, fon dasar, margin) mengubah nilai efektif templat lama | Sedang / tinggi | Preset menyematkan nilai terukur; penjaga `paramsSha256` sama di SR-36/SR-60; kenop tanpa pemetaan sah gugur (AS-8) |
| R14 | Esensial terlalu sedikit untuk kebutuhan nyata pengguna | Sedang / rendah | Lanjutan tetap tersedia lewat mode ahli/ADMIN; daftar esensial dapat ditambah sebagai versi registri (MINOR) |

## Recommendation & Next-Plan Summary

**Urutan yang direkomendasikan:**
1. B0, segera setelah persetujuan: spesifikasi SR-01, SR-02, runner SR-34, dan 12 baris backlog (IP-41a/b, IP-42a/b/c, IP-43a/b/c/d, RQ-1..RQ-6), paralel karena area lepas.
2. B1: migrasi SR-03, kontrak SR-04, desain permukaan SR-59.
3. B2a dan B2b: 32 baris implementasi dengan gerbang ringan.
4. B3 dan B4: benchmark v2, seed preset + kerangka, backfill, impor Manual 000.
5. B5: gerbang SR-39.
6. Fase akhir B6-B9.
7. Loop perbaikan (maksimal 3 siklus), termasuk FIX-2 dan FIX-4.
8. Commit lokal. Push hanya atas izin user.

**Yang butuh persetujuan user:** blueprint ini lewat Plan Mode (satu-satunya jeda, D-133). Temuan security CAUTION/FAIL dari SR-57 akan disajikan ke user. Tidak ada keputusan lain yang wajib dari user. Daftar kenop esensial final (SR-59) dilaporkan ke user sebagai informasi dan dapat dikoreksi tanpa mengubah blueprint.

**Keputusan untuk controller (wewenang D-18; rekomendasi dicetak tebal):**

| KC | Pertanyaan | Opsi | Rekomendasi |
|---|---|---|---|
| KC-1 | Masa berlaku JSON v1 | (a) diterima lewat adaptor dengan REPORT sampai v2.2; (b) ditolak setelah refaktor | **(a)**: fixture paritas, harness, dan agen lama tetap jalan |
| KC-2 | `change` pada kiriman agen | (a) opsional, diisi otomatis; PATCH tetap wajib; (b) wajib di semua | **(a)**: kiriman paralel tetap ringan (§0 c); D-06 terpenuhi |
| KC-3 | FIX-2 (S83) dan FIX-4 (S86) | (a) loop perbaikan fase akhir setelah SR-56; (b) di B2 dengan pembagian berkas §3 | **(a)**: berkas tetangga sedang ditulis ulang |
| KC-4 | Nomor halaman render bab | (a) lokal petikan + penanda draf; (b) meneruskan nomor dari dokumen penuh | **(a)**: render bab harus tersedia saat INCOMPLETE |
| KC-5 | Snapshot JSON per revisi | (a) cache render dengan cek sha rekonstruksi; (b) hanya tabel | **(a)**: menjaga D-06 tanpa mengubah mesin |

**Catatan untuk controller:**
- Saat SR-49..SR-54 dan SR-58 mendarat, tutup S75, S77, S98, S80, S82, S81, S88.
- Catat lebar batch di atas 4 (B0 18, B2a 20, B2b 12, B6 11, B7 6) di `decisions/decisions.md`.
- `masterplan/02_plan.md` tidak disentuh.

## Validasi V1-V12 (dihitung sendiri; controller wajib menghitung ulang)

| # | Kriteria | Hasil |
|---|---|---|
| V1 | Tabel ada | PASS: satu tabel `## Structured Task Breakdown` |
| V2 | Tepat 8 kolom | PASS: Step, Task Description, Agent_to_Invoke, Skills_to_Load, Expected Output, Depends On, Verification, Phase |
| V3 | Semua sel terisi | PASS: 79 baris (SR-01..SR-61, IP-41a..e, IP-42a..c, IP-43a..d, RQ-1..RQ-6). `-` hanya di Skills_to_Load (SR-01, SR-02, SR-59). `none` di Depends On (SR-01, IP-41a, IP-41b, IP-42a, IP-43a, IP-43b, IP-43c, IP-43d, RQ-1..RQ-6) |
| V4 | Atomik | PASS (bersama V9): satu area, satu deliverable per baris; layanan dipecah per modul; route per folder; desain permukaan (SR-59), turunan mesin (SR-60), dan route templat (SR-61) sebagai baris sendiri; IP/RQ bukan tempelan |
| V5 | Agen dan skill dari roster, ada lokal | PASS: agen coder-execution, data-analyst, verifier, test-expert, senior-code-reviewer, security-review (Glob `~/.claude/agents`); skill backend-execution, frontend-integration, dry-run-verify-fix, verification-before-completion, code-review-senior, security-review-gate (Glob), tdd, webapp-testing (Read SKILL.md); receiving-code-review untuk SR-40/SR-41 (tindak lanjut temuan). Tidak ada requesting-code-review, to-issues, to-prd, pair-programming |
| V6 | Phase dari 10 nilai baku | PASS: masterplan 1, research 2 (SR-02, SR-59), implementation 56, gateway_check 4 (SR-39, SR-55, SR-56, SR-57), test 15 (SR-40..SR-54), verification 1 (= 79) |
| V7 | Dependensi ada dan DAG | PASS: semua ID rujukan ada. Tepi ke ID lebih besar: C (SR-06→SR-60, SR-08→SR-11, SR-12→SR-19, SR-13→SR-15, SR-15→SR-16/SR-17, SR-29→SR-61, SR-36→SR-32) dan B ke baris tanpa dependensi balik (SR-05→SR-59, SR-07→IP-43b/RQ-4, SR-16→RQ-1, SR-17→RQ-5, SR-36→IP-43c, SR-61→IP-43b). SR-59 hanya bergantung SR-02; SR-60 hanya SR-59, SR-05. Tanpa siklus |
| V8 | Profil lengkap | PASS: 79 baris profil, ID sama, 7 kolom terisi; Shared resources dan pernyataan biaya ada |
| V9 | Ukuran | PASS: baris L = 0; baris dengan lebih dari 3 cek = 0; tanpa daftar "also/inherited". SR-21, SR-22, SR-23, SR-61 memegang dua path route satu concern |
| V10 | Kepemilikan grounded dan eksklusif | PASS: area per batch saling lepas (pembagian per berkas di services/templates, templates/route.ts berurutan IP-43b lalu SR-61, services/render, engine/docx/assemble, engine/html, benchmark/manual000); satu penulis per berkas bersama per batch; EXISTS 70 path terverifikasi; induk NEW-under ada |
| V11 | Jenis dependensi | PASS: setiap tepi berlabel B/C dan identik antara Depends On dan Dep kind; gelombang dari tepi B. Tepi gerbang beralasan: SR-39 (pembuka fase akhir, D-133), SR-38 B pada SR-37 (penulisan DB serial), SR-07/SR-61 B pada IP-43b/RQ-4 (berkas sama), SR-05 B pada SR-59 (peta lapis harus ada sebelum transkripsi) |
| V12 | Model dan review | PASS: 2 sonnet dengan alasan dan lolos uji tiga (SR-05 keluaran ditentukan research/08 dan 09 dan dicek skrip hitung; SR-38 perintah tetap, dicek exit code dan baris DB); agen verifikasi inherit; review batched atau n/a; tanpa pair |
