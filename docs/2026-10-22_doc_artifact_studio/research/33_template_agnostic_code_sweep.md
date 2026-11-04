---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-04
agent: data-analyst
step: S03 (blueprint identification/02_structured_datum_rev_a.md)
document: research/33_template_agnostic_code_sweep.md
type: mixed
confidence: HIGH
binding: U4 / D-595, D-590, D-596 (Q-C), RQ-4, RQ-8, AC-7, AC-10
mode: baca-saja (tanpa suntingan kode, tanpa akses DB)
status: complete
---

# S03: Sweep kode agnostik-templat (U4)

## 1. Source Tasks

| Sumber | Yang dipakai |
|---|---|
| `identification/02_structured_datum_rev_a.md` §0 (U4), §1 tantangan 2-4, §4, baris S03, S06-S09, Execution Profile | lingkup sweep, kepemilikan berkas per baris, larangan ubah bawaan registri |
| `decisions/decisions.md:601` (D-595) | sweep wajib: slug/kode jenis tertulis keras, string pembungkus ID di luar tabel teks, duplikasi seed kontrak vs baru, duplikasi format per bahasa; disposisi per temuan |
| `decisions/decisions.md:602` (D-596 Q-C) | label angka chart di dokumen EN ditunda: chart di luar lingkup |
| `research/30_datum_rev_a_template_gap.md:138-146, 201-205` | titik awal temuan teks pembungkus dan angka |

S01 (register nama) berjalan sejajar (edge C); sweep ini tidak bergantung pada nilai register, hanya pada letak kode.

## 2. Exploration & Collection Summary (metodologi)

- Repo dibaca apa adanya di `C:\Users\TRIAL\gsp-swarm-hq-v2.1` (asumsi: working tree = HEAD 3566486 cabang v2.1; tidak diverifikasi dengan perintah git karena sesi ini baca-saja tanpa shell).
- Pencarian (ripgrep) di `src/`, `scripts/`, `prisma/`: literal slug (`datum-*`, `laporan-kerja-agen`, `*-preset`), `startsWith("datum`, perbandingan `typeCode`/kode jenis, perbandingan tier, kata pembungkus Indonesia di literal string engine, `language === "EN"`, `new Register(`, impor `fmt`/`withUnit`, regex pemisah angka (`\.\d{3}`, `,\d+`).
- Setiap temuan dibaca langsung di berkasnya (baris dikutip di tabel). Perilaku runtime (penolakan R08, prioritas parameter slot) TIDAK dijalankan; yang bersifat dugaan diberi label **hipotesis**.
- Alternatif yang dipertimbangkan untuk tiap refaktor dicatat di §6 (Rekomendasi).

## 3. Overview

Inti mesin sudah sebagian besar agnostik templat: 0 percabangan pada kode jenis dokumen (grep `typeCode ===` dan `=== "<kode>"` = 0 hasil), perilaku tier dikendalikan data (`slot.tiers`, `doc.defaultTier`), dan teks pembungkus utama sudah berpusat di `src/lib/studio/engine/front/texts.ts:21-32, 120-129`. Sisa pelanggaran U4 terkonsentrasi di:

1. klien MCP (`scripts/studio/mcp/write-client-run.ts`, `write-client.ts`): satu cabang slug, satu awalan slug, tabel label kedua, dan himpunan slot depan tetap yang tidak membaca kerangka templat;
2. teks pembungkus ID yang masih tertulis di luar `texts.ts` (lembar kendali, pita segel, cap terbit, kata register, label bab di kepala halaman DOCX);
3. seed: jalur `--contract-templates` belum berbentuk helper bersama sehingga jalur `--doc-type-templates` akan tersalin bila tidak diekstrak;
4. konvensi angka ID sebagai konstanta tunggal di `bind/format.ts` dan regex pemisah ID tersalin di 3 berkas lint.

Ada empat temuan di luar sweep murni yang berdampak ke baris hilir dan butuh keputusan controller (§7): (a) klien MCP selalu mengirim slot sampul/lembar kendali/tanda tangan sehingga templat tier NOTA berisiko ditolak; (b) label aparatus DOCX (SUMBER, KUNCI, PROVENANS, Turunan, MEMENUHI) hanya ID; (c) label caption "Tabel/Gambar N.M" juga identitas alamat API; (d) titik konstruksi `Register` ada 7, bukan 5.

**Hitungan:** 69 temuan = 27 refaktor, 26 pertahankan, 16 di luar lingkup.

| Kategori | Refaktor | Pertahankan | Di luar lingkup | Jumlah |
|---|---|---|---|---|
| (a) slug / kode jenis / asumsi per-templat | 3 | 11 | 4 | 18 |
| (b) string pembungkus ID di luar tabel teks | 9 | 7 | 6 | 22 |
| (c) duplikasi jalur seed | 5 | 5 | 0 | 10 |
| (d) format angka per bahasa + lint | 10 | 3 | 6 | 19 |
| **Total** | **27** | **26** | **16** | **69** |

## 4. Requirements (yang diuji sweep ini)

| ID | Kebutuhan | Sumber |
|---|---|---|
| SW-1 | Tidak ada cabang pada slug templat atau kode jenis; tidak ada fungsi per templat; tidak ada blok seed tersalin | U4, D-595, RQ-8, AC-10 |
| SW-2 | Satu tabel spec seed untuk templat baru; satu tabel teks/lokal berkunci bahasa | U4, RQ-8 |
| SW-3 | Refaktor mempertahankan keluaran ID byte-identik; bawaan registri yang masuk `paramsSha256` tidak diubah | RQ-4, AC-7, blueprint §1 tantangan 2 |
| SW-4 | Daftar refaktor terbatas pada area yang disentuh templat baru plus duplikasi jelas | D-595, baris S03 |

## 5. Key Findings

Setiap baris: Lokasi (file:baris) | Temuan | Disposisi | Target atau alasan | Keyakinan. Bukti = lokasi itu sendiri (dibaca di sesi ini). Singkatan: `L` = `src/lib/studio`, `M` = `scripts/studio/mcp`, `SEED` = `prisma/seed-studio.ts`.

### 5.1 (a) Slug templat, kode jenis, dan asumsi per-templat

| ID | Lokasi | Temuan | Disposisi | Target / alasan | Keyakinan |
|---|---|---|---|---|---|
| A-01 | `M/write-client-run.ts:24-35` (filter awalan `t.slug.startsWith("datum-")` baris 29, urut `updatedAt` baris 31) | `template: "latest"` = templat `datum-*` terbaru menurut `updatedAt`; cabang awalan slug | **Refaktor** | S10: satu konstanta bernama (`datum-gsp`, D-590) sebagai satu-satunya literal; filter awalan dan urutan dihapus | HIGH |
| A-02 | `M/write-client-run.ts:204` | `if (template === "laporan-kerja-agen") throw ...` = cabang slug | **Refaktor** | S10 (pemilik berkas): ganti dengan keanggotaan pada data registri kontrak, mis. himpunan `CONTRACT_KIND_DEFS[*].templateSlug` (`L/registry/contracts.ts:390`, sudah diimpor seed di `SEED:100`). Tanpa jaringan, pesan galat sama persis | HIGH |
| A-03 | `M/write-client-run.ts:270` | `isRecord(sections.record)` mendeteksi dokumen laporan kerja dari bentuk isi | Pertahankan | Deteksi struktural slot `record` kerangka kontrak (berlaku untuk semua jenis kontrak), bukan slug | HIGH |
| A-04 | `M/write-client-run.ts:234, 295-301`; `M/write-client.ts:133-176, 523, 543` | Klien selalu menyusun dan mengirim slot `cover`, `controlSheet`, `signature` tanpa membaca kerangka atau tier templat. Slot itu bertier `["TERBIT","SERAH"]` (`SEED:571-573`) dan server menolak slot nonaktif untuk tier dokumen (`L/services/compose/structure.ts:264-265`, `SLOT_FORBIDDEN_FOR_TIER`). Meta MCP tidak punya medan tier (`M/write-client.ts:22-24`), jadi tier = bawaan templat (`L/services/compose/merge.ts:85`) | **Refaktor** (ke data templat) | Bukan S06-S09. Klien memilih slot yang dikirim dari kerangka + tier bawaan templat (R02 sudah dibaca `M/doc-tools.ts:416-420, 459`). Keputusan controller D-1 (§7). Hipotesis: preflight R08 `datum-nota`/`datum-nota-en` gagal `CONTENT_INVALID`; belum dijalankan | HIGH (kode), MEDIUM (dampak runtime) |
| A-05 | `SEED:1178-1192` (`CONTRACT_TEMPLATES`, seed `laporan-kerja-agen`) | Slug, nama, label slot menyalin `L/registry/contracts.ts:390-398` | Pertahankan | Duplikasi berpenjaga: dicocokkan dengan registri sebelum tulis (`SEED:1199-1215`); jalur kontrak tidak disentuh templat baru. S09 menjadikannya masukan helper bersama tanpa mengubah isinya | HIGH |
| A-06 | `SEED:126, 146, 529-567` (`CANONICAL_SLUG`, `DATUM_GSP_SLUG`, `PRESET_MIGRATIONS`) | Konstanta slug lama dan tabel migrasi preset | Pertahankan | Sudah berbentuk tabel spec; jalur SR-36 lama yang dibekukan AC-3 | HIGH |
| A-07 | `SEED:263-302` (impor `datum-manual-000`), `SEED:304-360` (impor `datum-gsp`), `SEED:1042-1132` (`importManual000V2`) | Fungsi impor per templat | Pertahankan | Perilaku memang berbeda: impor dari berkas profil dengan provenans, hak ADMIN, dan penjaga sendiri; tidak dipakai templat baru; menyentuhnya berisiko AC-3 | HIGH |
| A-08 | `SEED:893` | Petunjuk galat bercabang `spec.templateSlug === DATUM_GSP_SLUG` | Di luar lingkup | Hanya teks pesan galat di jalur lama | HIGH |
| A-09 | `src/components/studio/shared/labels.ts:314-327` | `BUILTIN_TEMPLATE_DESCRIPTION` berkunci 7 slug lama; `labels.ts:319` = `SEED:149`, `labels.ts:321` = `SEED:1184` | Pertahankan (beku) | Penyelamat deskripsi DB lama berjargon; mengubah deskripsi DB = versi/`updatedAt` baru (AC-3). Templat baru TIDAK ditambahkan ke peta ini: deskripsi awam ditulis di tabel spec S26 dan lewat fallback `labels.ts:326` | HIGH |
| A-10 | `src/components/studio/playground/examples-v2.ts:28`; `playground.tsx:108` | `DEFAULT_TEMPLATE_SLUG = "datum-gsp"` untuk playground UI | Pertahankan | Satu konstanta bernama, nilainya sama dengan pin S10; penyatuan lintas `scripts/` dan `src/components` opsional | HIGH |
| A-11 | `L/services/templates/profile.ts:46, 48, 670, 784-803`; `L/services/templates/index.ts:411, 1262-1279, 1328`; `L/services/templates/import.ts:172-181` | `DATUM_CANONICAL_SLUG`, `MANUAL000_SLUG` | Pertahankan | Akar pewarisan registri (perilaku memang berbeda: basis semua profil); Manual 000 hanya seed/parity | HIGH |
| A-12 | `L/registry/contracts.ts:206, 390-392` | Slug dan kode jenis `LAP` di registri kontrak | Pertahankan | Registri kontrak adalah tabel data jenis kontrak | HIGH |
| A-13 | `M/smoke-documents.ts:87`, `M/smoke-figures.ts:40`, `M/measure.ts:60`, `M/server.ts:163`, `scripts/studio/md2chapter.ts:56, 69`, `scripts/parity/run/render_cli.ts:34-36`, `scripts/parity/run/lib/template.ts:17-18`, `scripts/parity/run/lib/content_only.ts:50, 162`, `scripts/parity/run/check_doc_fixtures.ts:80, 157-158, 178` | Bawaan CLI, teks bantuan, fixture benchmark | Di luar lingkup | Alat dev/benchmark, bukan perilaku templat saat runtime | HIGH |
| A-14 | `L/params/governance-language.ts:114-116`; `L/params/structure.ts:94` | Daftar kode jenis bawaan dan enum; bawaan `doc.defaultTypeCode` "KT" | Pertahankan | Bawaan registri; nilai masuk `paramsSha256` (§5.5). S11 hanya menambah NDA ke `enum` baris 116 | HIGH |
| A-15 | `L/services/compose/merge.ts:84` | Cadangan literal "KT" menyalin bawaan registri | Di luar lingkup | Bukan cabang; perilaku tidak berubah | HIGH |
| A-16 | `L/engine/tokens/grid.ts:424-432`; `L/engine/lint/structure/checks-d.ts:126, 141, 644`; `L/engine/lint/structure/checks-slots.ts:267, 286`; `L/services/render/figures.ts:186`; `L/services/ingest/checks.ts:159`; `L/services/templates/profile.ts:157` | Cabang tier (NOTA/TERBIT/SERAH) | Pertahankan | Perilaku memang berbeda per tier (aturan manual), dikendalikan data `doc.defaultTier`/`meta.tier`, bukan slug | HIGH |
| A-17 | `SEED:569-578` (`SKELETON_SLOTS`, label ID) | Kerangka 7 slot berlabel ID | Pertahankan (data) | Data templat. S26 wajib memakainya ulang lewat overlay label EN + sisipan `ruleIndex` untuk STD, bukan menyalin 10 larik slot | HIGH |
| A-18 | `src/components/studio/template-preview/sample-document.ts:24`; `src/components/studio/playground/example.ts:155` | Sampel UI ber-`typeCode` "KT" | Di luar lingkup | Contoh UI statis | HIGH |

### 5.2 (b) String pembungkus Indonesia di luar tabel teks `texts.ts`

| ID | Lokasi | Temuan | Disposisi | Target / alasan | Keyakinan |
|---|---|---|---|---|---|
| B-01 | `L/services/compose/front.ts:29-32` | Kepala kolom lembar kendali `["Rev","Tanggal","Uraian","Oleh"]`, `["Lapis","Peran","Nama","Tanggal"]`, `["Salinan","Pemegang"]` | **Refaktor** | S06: pindah ke tabel di `L/engine/front/texts.ts` (entri ID persis); S13 entri EN; S14 kabel bahasa. Catatan: `controlSheetFront` tidak menerima meta/bahasa (`front.ts:71`), pemanggilnya `L/services/compose/snapshot.ts:427` (berkas di luar kepemilikan S14, lihat D-5) | HIGH |
| B-02 | `L/services/compose/front.ts:74-76` | Kicker dan judul bawaan lembar kendali = label slot; menimpa kicker berbahasa mesin (`L/engine/docx/wrapper/pages.ts:285`) | **Refaktor** | S14: pola O-1 (`texts.ts:102-104`): label slot dipakai apa adanya kecuali sama dengan `WRAPPER_TEXT.controlKicker.ID` dan bahasa EN, lalu `controlSheetKickerText("EN")`. Templat EN membawa label slot EN sendiri (data S26) | HIGH |
| B-03 | `L/params/page.ts:334-344` | Bawaan `device.issueStamp.format` "-- TERBITAN {n}" | Pertahankan | Masuk `paramsSha256`; EN dipilih di tabel teks (S13) bila nilai = bawaan registri | HIGH |
| B-04 | `L/params/page.ts:434-443` | Bawaan `wrapper.header` "KLASIFIKASI · {kelas}" / "SALINAN INDUK · PENGGUNAAN INTERNAL GSP" | Pertahankan | Sama dengan B-03 | HIGH |
| B-05 | `L/engine/docx/wrapper/render.ts:321-327` | Cadangan literal pasangan pita segel menyalin `page.ts:439` | **Refaktor** | S06: helper bersama di `texts.ts` (mis. `sealBandTextsOf(meta, params, lang)`); cadangan dibaca dari bawaan registri `PARAMS_BY_KEY.get("wrapper.header").default` (preseden `L/engine/symbols/primitives.ts:22`), bukan literal kedua | HIGH |
| B-06 | `L/engine/front/texts.ts:190` | Cadangan literal format cap terbit menyalin `page.ts:339` | **Refaktor** | S06: baca bawaan registri seperti B-05; S13 menambah entri EN | HIGH |
| B-07 | `L/engine/html/blocks/device.ts:143-160` | Pita segel HTML: cadangan = `meta.classification` / `meta.copyControl`; tanpa literal ID; berbeda dari pola `wrapper.header` DOCX | Pertahankan | Tidak ada teks ID yang bocor; HTML = pratinjau, PDF dari DOCX (`L/engine/html/base/index.ts:5`). Menyamakan dengan DOCX mengubah HTML ID (bertentangan dengan verifikasi S15 "HTML ID byte-sama"). Bagian HTML S15 cukup tanpa perubahan | HIGH |
| B-08 | `M/write-client.ts:103-107` | Tabel label MCP kedua (ID/EN). Entri `number`, `rev`, `author`, `custodian`, `audience`, `basis` identik dengan `CONTROL_FIELD_LABELS` (`texts.ts:120-129`); `sheet` = `WRAPPER_TEXT.controlKicker` (`texts.ts:22`); `by` tidak dipakai (grep `L.by` = 0) | **Refaktor** | S12: label diambil dari `texts.ts`; entri yang belum ada (`classification`, `made`, `checked`, `approved`, `first`) ditambahkan ke tabel `texts.ts` oleh S13. Kompatibilitas: `M/write-meta.ts:18, 34-56, 66` membaca balik label lama; label EN lama ("Author", "Checked", "Prepared", "Approved") harus tetap dikenali (risiko R-3, D-6) | HIGH |
| B-09 | `M/write-client.ts:445, 455` | Judul bab cadangan `Bab ${key}` untuk judul kosong, juga di dokumen EN | **Refaktor** | S12: `chapterLabelText(key, false, lang)` (`texts.ts:70-72`); keluaran ID sama persis | HIGH |
| B-10 | `L/engine/docx/package/header-footer.ts:96` | Kata "Chapter"/"Bab"/"Appendix"/"Lampiran" menyalin `WRAPPER_TEXT.chapter/appendix` | **Refaktor** | `chapterLabelText(unit.key, unit.kind === "appendix", lang)`, keluaran identik. Berkas tidak dimiliki baris mana pun: usul perluasan S06 (D-7) | HIGH |
| B-11 | `L/engine/docx/package/header-footer.ts:164`; `L/engine/html/base/markup.ts:129` | `REGISTER_WORDS_EN` (LEMBAR->SHEET, DARI->OF) tersalin di DOCX dan HTML | **Refaktor** | Satu tabel `REGISTER_WORDS` berkunci bahasa di `texts.ts`, dipakai kedua renderer; ID tetap tanpa terjemahan. Perluasan S06 (D-7) | HIGH |
| B-12 | `header-footer.ts:154, 160, 162, 175-188`; `markup.ts:105-118, 123, 125, 127` | Cadangan sel register, sel organisasi lama, pemisah NBSP, alias medan tebal tersalin DOCX/HTML (dan menyalin `page.ts:254`) | Di luar lingkup | Netral bahasa; tidak diubah templat baru; ID byte-identik tetap | HIGH |
| B-13 | `L/engine/front/texts.ts:145` | Nama bahasa "English/Inggris/Indonesian/Indonesia" ditulis sebaris, tidak di tabel | **Refaktor** | S13 (pemilik `texts.ts`): pindah ke entri tabel; keluaran sama | HIGH |
| B-14 | `L/engine/front/texts.ts:123` | `PENYUSUN` EN = "Author"; manual EN "Prepared by" (`research/30:145`) | Pertahankan (sudah di tabel) | Bukan refaktor; nilai EN diganti S13 sesuai register S01 | HIGH |
| B-15 | `L/engine/docx/figures/defaults.ts:36-42`; `L/engine/docx/figures/figure.ts:171, 200-246`; `L/engine/docx/tables/render.ts:376-389`; `L/engine/docx/figures/derivation.ts:69, 101`; `L/engine/bind/derivation.ts:193` | Label aparatus DOCX hanya ID: "SUMBER", "PROVENANS", "KUNCI", "Turunan", vonis "MEMENUHI"/"TIDAK MEMENUHI". Padanan HTML sudah dwibahasa (`L/engine/html/tables/style.ts:248-253`) | Di luar lingkup S06-S09 | Perubahan perilaku (bukan refaktor) di luar daftar D-590. Dokumen EN bertabel/berfigur akan memuat teks ID: berisiko "bentrok dua bahasa" D-593 di S36. Keputusan controller D-2 | HIGH |
| B-16 | `L/services/ingest/normalize.ts:276-277`; `L/contract/address.ts:13, 63-65`; `L/engine/lint/structure/checks-d.ts:761`; `L/engine/docx/tables/render.ts:440`; `L/engine/docx/figures/figure.ts:130-134` | Label caption "Tabel N.M"/"Gambar N.M" dibangkitkan tanpa melihat bahasa dan sekaligus tata bahasa alamat API (`studio_edit`) | Di luar lingkup | Mengubah label = mengubah kontrak alamat (dilarang U3). Lokalisasi tampilan saja = perilaku baru. Keputusan controller D-3 | HIGH |
| B-17 | `L/engine/html/base/markup.ts:70, 78-79`; `L/engine/html/base/shell.ts:290-294`; `L/engine/html/blocks/text.ts:267`; `L/services/import/markdown.ts:557` | HTML pratinjau: kepala halaman memakai pola "BAB {n}" mentah (EN tercetak "BAB 1"); pasangan ID/EN sebaris di luar tabel | Di luar lingkup | Hanya pratinjau HTML (PDF dari DOCX); pasangan sebaris sudah dwibahasa. Kandidat konsolidasi ke `texts.ts` di ronde lain | HIGH |
| B-18 | `L/params/page.ts:450-511` (`controlSheet.revisionHistory.columns`, `.verificationChain`, `.distribution.columns`, `.signatures.*`) | Parameter kolom lembar kendali didefinisikan tetapi tidak dibaca mesin (grep: hanya `page.ts`) | Di luar lingkup | Mengonsumsinya mengubah keluaran ID (bawaan "REV, TANGGAL, PENYUSUN, PERUBAHAN, STATUS" berbeda dari B-01) | HIGH |
| B-19 | `L/engine/docx/package/header-footer.ts:111` vs `L/engine/front/texts.ts:164` | Cadangan entitas berbeda huruf ("PT Gemilang Satria Perkasa" vs "PT GEMILANG SATRIA PERKASA") | Di luar lingkup | String berbeda; menyatukan mengubah byte ID | HIGH |
| B-20 | `L/engine/docx/wrapper/formats.ts:459-478` (`MONTHS_ID`, `MONTHS_EN`, `longDate`) | Tabel bulan per bahasa di luar `texts.ts` | Pertahankan | Satu sumber tanggal berkunci bahasa; `texts.ts:16` mengimpornya | HIGH |
| B-21 | `L/engine/front/alt-text.ts:50-53`; `L/engine/html/tables/style.ts:248-253` | Tabel kata alt-text dan label aparatus HTML berkunci bahasa | Pertahankan | Sudah berkunci bahasa dan benar untuk EN; konsolidasi opsional | HIGH |
| B-22 | `L/params/page.ts:396-405` (`cover.addressLine`) | Bawaan alamat berbahasa Indonesia | Pertahankan | Nama diri/alamat, data templat; masuk `paramsSha256` | MEDIUM |

### 5.3 (c) Duplikasi jalur seed `--contract-templates` lawan `--doc-type-templates`

Jalur baru (RQ-1) = templat turunan versi terbaru `datum-gsp-preset` + lapis jenis/bahasa + kerangka slot, tanpa `contractKind`. Bentuknya sama dengan `ensureContractTemplate` minus CH-06 dan `contractKind`.

| ID | Lokasi | Temuan | Disposisi | Target / alasan | Keyakinan |
|---|---|---|---|---|---|
| C-01 | `SEED:1247-1308` (`ensureContractTemplate`) | Alur: preset + versi terbaru (1249-1252), esensial global (1253), lapis (1254), `splitBySurface` (1255), esensial slot (1256-1261), CH-06 (1262-1264), `ensureSkeletonVersion` (1265-1275), cek simpan (1276-1287), laporan (1288-1307). Semua kecuali CH-06/`contractKind` dibutuhkan jalur baru | **Refaktor** | S09: ekstrak `ensureDerivedTemplate(tx, spec)` dengan spec `{ slug, name, description, presetSlug, slots, layer, slotOverrides?, contractKind: string \| null, changeNote }`. CH-06 dijalankan bila `spec.contractKind !== null` (keputusan dari data, bukan slug) | HIGH |
| C-02 | `SEED:1256-1261` vs `SEED:618-627` (isi baris 620-625) | Loop esensial slot dari preset tersalin dua kali | **Refaktor** | S09: `presetSlotEssentials(slots, presetEffective, slotOverrides?)`; `buildSkeletonSlots` menjadi pembungkus. Wajib menerima override per slot: `cover.kicker.text` adalah esensial lingkup `cover` (`L/registry/essentials.ts:367-376`); hipotesis: nilai lapis templat untuk kunci berlingkup slot tertutup nilai slot dari preset (`L/services/compose/snapshot.ts:168` memakai parameter slot bila ada) | HIGH (duplikasi), MEDIUM (prioritas) |
| C-03 | `SEED:1217-1223` (`contractTemplateLayer`) | Lapis dihitung dari definisi kontrak | **Refaktor** | S09: menjadi adaptor kontrak yang menghasilkan `layer`; helper generik menerima `layer: ParamRecord` dari spec. Jalur baru: lapis dari tabel spec S26 (daftar kode Rev A tanpa DS dengan NDA, tier, kode bawaan, bahasa, label) | HIGH |
| C-04 | `SEED:1310-1368` (`runContractTemplates`) | Runner transaksi berpenjaga: cek ulang DB (1317-1318), snapshot sebelum/sesudah (1319, 1325-1328), section type (1320-1322, 1329-1330), hitungan (1331-1335, `contractTemplates` khusus), penjaga (1336-1349), dry-run (1350-1357, 1361-1367). Cek DB dan tangkap dry-run juga tersalin di `SEED:1140-1141, 1148, 1152-1158` | **Refaktor** | S09: `runGuardedTemplateTx(db, { label, targets, dryRun, build, counts })`; `--contract-templates` memanggilnya dengan perilaku dan log sama | HIGH |
| C-05 | `SEED:1134-1159` (`runPresetFlags`) | Runner preset/kerangka memakai boilerplate serupa (cek DB, dry-run) | Pertahankan | Penjaga berbeda (sha terproyeksi §8.2 per laporan); jalur SR-36/SR-38 dibekukan AC-3; verifikasi S09 hanya mencakup `--contract-templates` | HIGH |
| C-06 | `SEED:1283-1287` (`storedOk`) | Cek simpan memakai `t.contractKind === spec.kind` | **Refaktor** | S09: `(t.contractKind ?? null) === (spec.contractKind ?? null)` + cek AC-2: `restricted=false` (`templateRestriction`, preseden `SEED:721`), `archived=false`, `baseVersionId` = id versi preset terbaru (dilaporkan `SEED:1296`, belum dicek) | HIGH |
| C-07 | `SEED:724-774` (`ensureSkeletonVersion`) | Sudah dipakai bersama jalur SR-36 dan kontrak | Pertahankan | Catatan: `contractKind` hanya dikirim bila truthy (756) dan hanya dicek bila terdefinisi (761); jalur baru mengirim `undefined`, penjaga null ada di C-06 | HIGH |
| C-08 | `SEED:54-66, 1421-1433, 1502-1503` | Dispatch flag, daftar flag yang boleh `--dry-run` | Pertahankan | Titik sentuh S27 (flag baru + daftar dry-run baris 1428-1429), bukan duplikasi | HIGH |
| C-09 | `SEED:1235-1245` (`snapshotTemplates`) | Sidik templat selain sasaran | Pertahankan | Sudah generik (parameter `exclude`); dipakai ulang runner C-04 | HIGH |
| C-10 | `SEED:1320-1322` (`seedSectionTypes` di dalam transaksi) | FK slot -> section type dalam transaksi yang sama | Pertahankan | Dipakai ulang di runner; `ruleIndex` sudah ada di registri section (`L/registry/sections.ts:427`) | HIGH |

### 5.4 (d) Format angka per bahasa dan pemisah di lint

| ID | Lokasi | Temuan | Disposisi | Target / alasan | Keyakinan |
|---|---|---|---|---|---|
| D-01 | `L/engine/bind/format.ts:13-18` | Konvensi ID sebagai konstanta tunggal (ribuan ".", desimal ",", satuan mendahului `["Rp","USD","EUR","SGD"]`) | **Refaktor** | S07: tabel per bahasa (entri ID = konstanta sekarang); ekspor lama tetap sebagai alias entri ID (diekspor ulang `L/engine/bind/index.ts:9-15`). S16 menambah entri EN | HIGH |
| D-02 | `L/engine/bind/format.ts:75-82, 90-103` | `groupThousands` dan `fmt` membaca konstanta ID | **Refaktor** | S07: baca entri tabel (ID bawaan), tanda tangan `fmt(v, dec)` tidak berubah; S16 menambah jalur berparameter bahasa | HIGH |
| D-03 | `L/engine/bind/format.ts:128-132` | `withUnit`: daftar satuan mendahului ID | **Refaktor** | S07/S16: daftar dan alias mata uang dari tabel (EN: IDR menggantikan Rp sesuai register S01) | HIGH |
| D-04 | `L/engine/bind/register.ts:127-158, 180-186` | `format`, `u`, `rp` ("Rp " tertulis keras baris 153), `pct` (" %" baris 157), `knownForms` tanpa konvensi bahasa. `rp`/`pct` tanpa pemanggil di `src/` (grep) | **Refaktor** | S17: Register menerima konvensi (bawaan ID); mata uang dari tabel. Spasi persen EN diputus S01 | HIGH |
| D-05 | `L/engine/bind/derivation.ts:140, 145, 167-168, 174, 191` | Baris derivasi memformat lewat `fmt`/`withUnit` ID | **Refaktor** | S17 melalui konvensi Register. Label vonis baris 193 = B-15 | HIGH |
| D-06 | `L/engine/bind/audit.ts:11-31` | `BIND_NUMBER_PATTERN_SOURCE` hanya pemisah ID; `knownForms` lewat `fmt` ID. Dokumen EN: "1,250" cocok cabang kedua pola (baris 20), jadi angka EN terdaftar akan dilaporkan tak tertelusur (hipotesis dari pembacaan regex; audit bawaan hanya aktif SERAH, `checks-d.ts:126`) | **Refaktor** | S17: pola dan bentuk dikenal per bahasa (varian EN hanya untuk dokumen EN) | HIGH (kode), MEDIUM (dampak) |
| D-07 | Titik `new Register(`: `L/services/render/pure/render.ts:351`, `L/services/render/artifact.ts:455`, `L/services/ingest/checks.ts:137, 191`, `L/engine/lint/structure/checks-d.ts:83`, **ditambah** `src/app/api/studio/validate/_shared/preview-v2.ts:44`, `src/app/api/studio/validate/route.ts:128` | Ada 7 titik, bukan 5 (blueprint §1 tantangan 4, baris S18). Empat titik memakai ungkapan identik `new Register(snapshot.register ?? {})` | **Refaktor** | S17: satu pabrik di `bind` (mis. `registerFor(snapshot)` membaca `snapshot.doc.meta.language`); S18 mengganti 7 titik. Kepemilikan S18 perlu ditambah 2 berkas `validate` (D-4); tanpa itu pratinjau EN tetap berangka ID | HIGH |
| D-08 | `L/services/ingest/checks.ts:124-136, 183-190` | Loop normalisasi entri register tersalin | Di luar lingkup | Netral bahasa | HIGH |
| D-09 | `L/engine/lint/structure/text.ts:7-14, 126` | `parseDatumNumber` dan regex pasangan terbilang memuat pemisah ID tertulis | **Refaktor** | S08: bagian angka regex dibangun dari entri ID tabel `format.ts` (byte-identik). Terbilang = aturan bahasa Indonesia (SG-L4-05), tetap ID. Tanda tangan tidak berubah karena pemanggil ada di `checks-d.ts` (milik S18) | HIGH |
| D-10 | `L/engine/lint/structure/checks-a.ts:240-246` (`PURE_NUMBER`) | Regex sel angka murni berpemisah ID | **Refaktor** | S08: pola dari tabel (ID bawaan), byte-identik. Varian EN = perubahan perilaku, ditunda; hipotesis: "1,250,000,000.25" tidak terdeteksi angka di dokumen EN | HIGH |
| D-11 | `L/engine/lint/language/checks.ts:49-51` | `fmt` lint: `toFixed` + `replace(".", ",")` | **Refaktor** | S08: pemisah desimal dari entri ID tabel; semantik `toFixed` dipertahankan (pesan lint operator berbahasa Indonesia; ganti ke half-even mengubah teks pesan) | HIGH |
| D-12 | `L/engine/lint/language/tokenize.ts:19, 96` | Koma di antara dua digit tidak dihitung koma kalimat | Pertahankan | Berlaku benar untuk kedua konvensi (koma ribuan EN juga di antara digit) | HIGH |
| D-13 | `L/engine/lint/render/index.ts:94-100` | `NUMERIC_TEXT` membaca nilai parameter bertitik desimal | Pertahankan | Parsing nilai mesin, bukan konvensi dokumen | HIGH |
| D-14 | `L/engine/lint/structure/checks-d.ts:134, 151, 212, 261, 267` | Konsumen audit dan `parseDatumNumber` | Di luar lingkup S08 | Berkas milik S18 (Execution Profile S08 melarang menyentuhnya); kabel bahasa oleh S17/S18 | HIGH |
| D-15 | `L/engine/docx/tables/widths.ts:12` (`NUM_TOKEN_SOURCE`) | Token angka berpemisah titik untuk lebar kolom (port verbatim HS) | Di luar lingkup | Heuristik tata letak port Python; mengubahnya berisiko byte ID. Risiko R-6: angka EN tidak dikenali penghitung lebar minimum | HIGH |
| D-16 | `M/write-client.ts:275` (`NUMERAL`) | Deteksi kolom angka menerima `[.,]` keduanya | Pertahankan | Netral bahasa | HIGH |
| D-17 | `L/services/import/contract/parse.ts:374` (`BYTES_RE`) | Regex ukuran berkas berpemisah titik | Di luar lingkup | Impor laporan kerja kontrak, bukan templat dokumen | HIGH |
| D-18 | `L/engine/docx/package/header-footer.ts:79` vs `L/engine/docx/wrapper/formats.ts:459` | `ROMAN_MONTHS` tersalin | Di luar lingkup | Netral bahasa | HIGH |
| D-19 | 39 modul chart (daftar di §5.6) | Mengimpor `fmt`/`withUnit` dari `bind` | Di luar lingkup | D-596 Q-C: label angka chart EN ditunda; manifest clean-SVG tidak disentuh | HIGH |

### 5.5 Bawaan registri yang TIDAK boleh berubah (masuk `paramsSha256`)

`paramsSha256 = sha256(stableStringify(resolvedParams))` (`L/services/templates/profile.ts:582`); perubahan bawaan juga membuat kanonik terdeteksi tidak sinkron (`SEED:1374-1375`). Metadata validasi (`enum`, `range`) bukan nilai, jadi penambahan NDA ke `enum` (S11) aman selama daftar bawaan tetap.

| Kunci | Lokasi | Nilai bawaan yang dibekukan |
|---|---|---|
| `device.issueStamp.format` | `L/params/page.ts:339` | `// {YYYYMMDD} {BAHASA} {KELAS} -- TERBITAN {n}` |
| `wrapper.header` | `L/params/page.ts:439` | `["KLASIFIKASI · {kelas}", "SALINAN INDUK · PENGGUNAAN INTERNAL GSP"]` |
| `device.registerBlock.cells` | `L/params/page.ts:254` | `["GSP · {nomor}", "REV · {tanggal}", "LEMBAR {n} DARI {N}", "{kelas}"]` |
| `runningHead.fields` | `L/params/page.ts:521` | `["entitas", "jenis dokumen", "BAB {n}", "judul bab"]` |
| `chapter.kicker.pattern` | `L/params/page.ts:533` | `BAB {n}` |
| `cover.controlBlock.fields`, `cover.colophon.fields`, `cover.elementOrder` | `L/params/page.ts:354-378, 389, 426, 430` | token ID (kunci internal, diterjemahkan lewat `CONTROL_FIELD_LABELS`) |
| `cover.addressLine`, `cover.kicker.text`, `org.entityName`, `org.nib` | `L/params/page.ts:401, 414, 444, 445` | nilai sekarang |
| `controlSheet.*` (P4K-01..06) | `L/params/page.ts:456, 467-472, 485, 495, 506` | nilai sekarang (tidak dikonsumsi, B-18) |
| `doc.typeCode` (nilai) | `L/params/governance-language.ts:114` | `["KT","PT","RAB","SPH","SP","BA","DS","STD"]` (enum baris 116 boleh +NDA) |
| `doc.language`, `doc.defaultTypeCode`, `doc.defaultTier`, `render.toc.title` | `L/params/governance-language.ts:124`; `L/params/structure.ts:94, 97`; `L/params/render.ts:268` | `ID`, `KT`, `TERBIT`, `null` |

Konsekuensi desain: pemilihan teks EN dilakukan di tabel teks dengan aturan "nilai parameter = bawaan registri dan bahasa EN -> entri EN" (preseden `texts.ts:102-104`). Bawaan registri dibaca dari `PARAMS_BY_KEY` (preseden `L/engine/symbols/primitives.ts:22`), bukan disalin.

### 5.6 Daftar modul chart (di luar lingkup, D-596 Q-C)

Semua di `L/engine/chart/`: `core/datum.ts:19`, `core/gallery.ts:19`, `family-g/dot-flow.ts:29`, `family-g/tile-map.ts:20`, `family-h1/axes.ts:18`, `family-h1/heatmap.ts:23`, `family-h1/hexbin.ts:21`, `family-h1/ramp.ts:23`, `family-h2/contour.ts:42`, `family-h2/venn.ts:28`, `family-k1/common.ts:21`, `family-k1/pie.ts:27`, `family-k1/stack.ts:24`, `family-k2/funnel.ts:18`, `family-k2/icon-array.ts:17`, `family-k2/marimekko.ts:23`, `family-k2/sankey.ts:32`, `family-k2/treemap.ts:24`, `family-k2/waffle.ts:20`, `family-p1/common.ts:37`, `family-p1/dot-plot.ts:18`, `family-p1/range-plot.ts:15`, `family-p1/slope.ts:19`, `family-p2/arrow.ts:20`, `family-p2/bullet.ts:22`, `family-p2/quadrant.ts:22`, `family-p2/small-multiples.ts:21`, `family-p2/table.ts:21`, `family-p2/waterfall.ts:23`, `family-s1/common.ts:25`, `family-s1/histogram.ts:26`, `family-s2/common.ts:32`, `family-w1/frame.ts:18`, `family-w1/render.ts:18`, `family-w1/timeaxis.ts:16`, `family-w2/barcode.ts:15`, `family-w2/candlestick.ts:17`, `family-w2/horizon.ts:17`, `family-w2/time.ts:12` (baris = baris impor `fmt`). Jumlah 39. S07 harus mempertahankan tanda tangan `fmt(v, dec)` agar modul ini tidak tersentuh.

## 6. Files/Modules Involved dan Implementation Order (daftar refaktor -> baris)

| Baris | Temuan refaktor | Berkas | Syarat byte-identik ID |
|---|---|---|---|
| **S06** | B-01 (tabel kepala kolom, entri ID saja), B-05, B-06 | `L/engine/front/texts.ts`, `L/services/compose/front.ts`, `L/engine/docx/wrapper/render.ts` | entri ID persis; cadangan = bawaan registri yang sama |
| S06 (perluasan, D-7) | B-10, B-11 | `L/engine/docx/package/header-footer.ts`, `L/engine/html/base/markup.ts` | `chapterLabelText` dan `REGISTER_WORDS` menghasilkan string sama. Bila controller tidak memperluas kepemilikan: tunda, dampak perilaku 0 |
| **S07** | D-01, D-02, D-03 (entri ID) | `L/engine/bind/format.ts` (+ uji) | tanda tangan `fmt`/`withUnit` tetap; kasus half-even tidak berubah |
| **S08** | D-09, D-10, D-11 | `L/engine/lint/structure/text.ts`, `L/engine/lint/structure/checks-a.ts`, `L/engine/lint/language/checks.ts` (tidak menyentuh `checks-d.ts`) | regex dari entri ID; `toFixed` dipertahankan; cek grep "0 literal pemisah ganda di lint" terpenuhi |
| **S09** | C-01, C-02, C-03, C-04, C-06 | `prisma/seed-studio.ts` | `--contract-templates --dry-run` di DEV `unchanged`, 0 tulis, log setara |
| S10 | A-01, A-02 | `M/write-client-run.ts` (+ `implw2-client.test.ts`) | pesan galat A-02 sama |
| S12 | B-08, B-09 (+ alias label lama di `M/write-meta.ts`, D-6) | `M/write-client.ts` | label ID byte-sama |
| S13 | B-13 + entri EN (B-01, B-08, B-14, pita segel, cap terbit) | `L/engine/front/texts.ts` | fix2 parity hijau |
| S14 | B-02 + kabel bahasa B-01 (+ `snapshot.ts:427`, D-5) | `L/services/compose/front.ts` | uji compose ID sama |
| S16-S18 | D-02/D-03 EN, D-04, D-05, D-06, D-07 | `bind/*` + 7 titik Register (D-4) | uji bind ID sama |

Urutan yang disarankan sama dengan gelombang blueprint (S06/S07 W2, S09 W3, S08 W6 sesudah S07). Tidak ada refaktor yang menyentuh 39 modul chart atau bawaan registri §5.5.

## 7. Risks dan keputusan controller

| ID | Risiko / celah | Bukti | Dampak | Usulan |
|---|---|---|---|---|
| D-1 | Klien MCP mengirim slot depan tetap untuk semua templat (A-04) | `M/write-client-run.ts:295-301`; `SEED:571-573`; `L/services/compose/structure.ts:264-265` | `datum-nota`/`datum-nota-en` lewat `studio_write` berisiko ditolak: U3/AC-9/S35 gagal | Baris baru atau perluasan S10/S12: pilih slot dari kerangka + tier bawaan (data R02). Perlu sebelum S29/S35 |
| D-2 | Label aparatus DOCX hanya ID (B-15) | `L/engine/docx/figures/defaults.ts:37-42`; `L/engine/docx/tables/render.ts:382-389`; `L/engine/bind/derivation.ts:193` | Dokumen EN memuat SUMBER/KUNCI/PROVENANS/Turunan/MEMENUHI: bentrok dua bahasa (D-593), turun skor aturan bahasa (S23) | Baris fase 0 baru: entri EN di `texts.ts` dan pemilihan bahasa di DOCX (ID byte-sama), atau catat di luar lingkup dengan alasan |
| D-3 | "Tabel/Gambar N.M" di dokumen EN (B-16) | `L/services/ingest/normalize.ts:276-277`; `L/contract/address.ts:63-65` | Sama dengan D-2; label juga identitas alamat | Lokalisasi tampilan saja (alamat tetap) sebagai baris baru, atau di luar lingkup beralasan |
| D-4 | Titik Register 7, bukan 5 (D-7) | `src/app/api/studio/validate/_shared/preview-v2.ts:44`; `src/app/api/studio/validate/route.ts:128` | Pratinjau EN berangka ID; kepemilikan S18 tidak lengkap | Tambahkan 2 berkas ke kepemilikan S18; pabrik Register di S17 |
| D-5 | S14 butuh `L/services/compose/snapshot.ts:427` untuk meneruskan bahasa | `front.ts:71`; `snapshot.ts:427` | S14 tidak bisa selesai tanpa menyentuh berkas di luar kepemilikannya | Deklarasikan `snapshot.ts` (satu baris) di kepemilikan S14 |
| D-6 (R-3) | Ubah label EN MCP memutus pembacaan balik dokumen EN lama | `M/write-meta.ts:18, 34-56, 66` | `studio_edit` meta dokumen EN lama tidak lagi mengenali penyusun/pemeriksa | S12 mempertahankan label EN lama sebagai alias baca; tambah `write-meta.ts` ke kepemilikan S12 atau ekspor himpunan alias dari `write-client.ts` |
| D-7 | B-10/B-11 di berkas tanpa pemilik | `header-footer.ts:96, 164`; `markup.ts:129` | Duplikasi tersisa bila tidak diambil | Perluas S06 atau tunda (tanpa dampak perilaku) |
| R-1 | Override per slot untuk kunci berlingkup slot (C-02) | `L/registry/essentials.ts:367-376`; `L/services/compose/snapshot.ts:168` | Hipotesis: `cover.kicker.text` EN di lapis templat tertutup nilai slot dari preset | Spec S26 menyediakan `slotOverrides`; S27 menguji nilai efektif slot `cover` |
| R-2 | Cadangan bawaan dibaca dari `PARAMS_BY_KEY` di `texts.ts` yang juga dipakai renderer HTML | preseden `L/engine/symbols/primitives.ts:22`, `L/engine/tokens/index.ts:30` | Hipotesis: ukuran bundel klien; registri sudah diimpor engine | Terima (preseden ada); alternatif: konstanta bernama diekspor dari `page.ts` (butuh pemilik `page.ts`) |
| R-4 | Transaksi 10 templat vs `PRESET_TX_TIMEOUT_MS` 180 s | `SEED:482` | Dry-run/jalan nyata bisa melewati batas waktu | S27/S34 mencatat durasi; naikkan hanya dengan alasan |
| R-5 | HTML pita segel berbeda dari DOCX sejak sebelum ronde ini | `device.ts:146-147` vs `render.ts:324` | Bukan regresi; menyamakan mengubah HTML ID | Pertahankan (B-07) |
| R-6 | Penghitung lebar kolom tidak mengenali angka EN | `L/engine/docx/tables/widths.ts:12` | Hipotesis: kolom angka sempit di DOCX EN dapat terpotong (bentrok teks S24) | Dipantau S24/S36; perbaikan = baris baru |

## 8. Acceptance Criteria (artefak S03)

| Kriteria | Status |
|---|---|
| Setiap temuan ber-file:baris | Terpenuhi (69/69) |
| Setiap temuan berdisposisi refaktor (dengan target), pertahankan (dengan alasan), atau di luar lingkup (dengan alasan) | Terpenuhi |
| Daftar refaktor terbatas pada area yang disentuh templat baru plus duplikasi jelas | Terpenuhi: 27 refaktor, semuanya di lembar kendali, pita segel/cap terbit, label bab/register, klien MCP, seed, bind, atau 3 berkas lint; 0 di chart |
| Bawaan registri yang memengaruhi `paramsSha256` dicatat dan dibekukan | Terpenuhi (§5.5) |
| Tidak ada suntingan kode atau akses DB | Terpenuhi (hanya baca + satu berkas ini) |

## 9. Recommendations

1. **S06**: buat entri tabel kepala kolom lembar kendali dan helper pita segel/cap terbit di `texts.ts`. Cadangan dibaca dari bawaan registri (`PARAMS_BY_KEY`), bukan literal ketiga. Alternatif yang ditolak: mengonsumsi `controlSheet.*.columns` (B-18), karena mengubah keluaran ID.
2. **S07**: tabel `NUMBER_CONVENTIONS` (atau nama setara) dengan satu entri ID; ekspor konstanta lama tetap sebagai alias. Alternatif yang ditolak: parameter templat baru untuk pemisah, karena menambah kunci registri dan mengubah `paramsSha256` kanonik.
3. **S08**: hanya `text.ts`, `checks-a.ts`, `language/checks.ts`; pola dibangun dari entri ID. Varian EN untuk lint ditunda karena itu perubahan perilaku.
4. **S09**: tiga helper (`presetSlotEssentials`, `ensureDerivedTemplate`, `runGuardedTemplateTx`) dengan spec yang memuat `contractKind: string | null` dan `slotOverrides`. Jalur kontrak menjadi pemanggil pertama; `--doc-type-templates` (S27) menjadi pemanggil kedua yang mengiterasi satu tabel spec S26. Tidak ada `if (slug ...)`.
5. **S26**: tabel spec = data murni per (jenis x bahasa): slug, nama, deskripsi awam, lapis parameter, overlay label slot di atas `SKELETON_SLOTS`, sisipan `ruleIndex` untuk STD, `slotOverrides`. Jangan menambah entri ke `BUILTIN_TEMPLATE_DESCRIPTION`.
6. Controller memutus D-1 sampai D-7 sebelum gelombang yang terdampak: D-1 sebelum S29/S35, D-2/D-3 sebelum S23/S36, D-4 sebelum S18, D-5 sebelum S14, D-6 sebelum S12, D-7 sebelum S06.
7. Review senior (S38) memakai grep: `startsWith("datum`, `=== "laporan-kerja-agen"`, `"KLASIFIKASI · `, `"SALINAN INDUK`, `"Rp "`, `\.\d{3}` di `src/lib/studio/engine/lint`. Sasaran: 0 hasil di luar `texts.ts`, `format.ts`, dan `page.ts`.

### Asumsi dan celah

- Asumsi: baris yang dikutip = working tree saat dibaca (HEAD tidak diverifikasi lewat git).
- Celah: dampak runtime A-04, C-02 (prioritas parameter slot), D-06, D-10, dan R-6 belum dijalankan; semuanya berlabel hipotesis dan harus dibuktikan oleh uji di baris pemiliknya.
- Tidak dinilai: `tests/` (bukan lingkup sweep), dokumen `docs/` (S30-S32).
