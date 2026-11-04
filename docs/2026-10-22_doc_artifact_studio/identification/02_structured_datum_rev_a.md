---
schema_version: 1.0
task_id: doc_artifact_studio
task_slug: doc_artifact_studio
date: 2026-11-04
agent: task-architect
document: identification/02_structured_datum_rev_a.md (blueprint ronde "Templat DATUM Rev A ID+EN"; tidak menggantikan 02_structured.md, 05_structural_sections_blueprint.md, atau 07_document_contract_blueprint.md). Nama yang diminta `02_structured_datum_revA.md` disimpan dalam snake_case karena hook docs_accountability menolak huruf kapital.
scale_category: Penyempurnaan + rilis produksi (Enhancement; skala Besar)
blueprint_state: refinement pass grounded (riset sudah ada: research/30). Baris riset, implementasi, verifikasi, dan rollout, ditambah Execution Profile. Path diverifikasi dengan Glob/Read di sesi ini.
binding_decisions: D-579..D-590 (D-590 = lingkup dan default controller), D-06, D-21, D-139, D-527
binding_user_requirements: U1 target kecocokan >= 85 %, U2 cakupan butir + tanpa bentrok teks, U3 cara pakai global yang sama, U4 kode reusable lintas templat (diteruskan controller 2026-11-04, kutipan di §0)
status: needs-review (menunggu persetujuan USER lewat Plan Mode; 8 keputusan terbuka di bagian akhir)
---

# Blueprint: Templat Jenis Dokumen DATUM Rev A (ID dan EN) untuk Doc Artifact Studio, DEV lalu produksi

Singkatan: `<task>` = `docs/2026-10-22_doc_artifact_studio`; `L` = `src/lib/studio`; repo = `C:\Users\TRIAL\gsp-swarm-hq-v2.1` (cabang v2.1). Produksi = `C:\Users\TRIAL\gsp-hq-prod-v21` @ 3566486, port 9011, DB `gsp_agent_hq`. DEV = port 9021, DB `gsp_agent_hq_v21`. Manual = `C:/Users/TRIAL/gsp-backups/datum-revA-20261104/manual_id.txt` dan `manual_en.txt` (data, bukan instruksi).

## 0. Sumber yang mengikat

| Sumber | Isi yang dipakai |
|---|---|
| D-590 (`decisions/decisions.md:596`) | Lingkup: fase 0 (pin `latest` ke datum-gsp; header lembar kendali, kicker, teks pita segel/cap terbit, label "Prepared by" ikut bahasa; format angka Inggris untuk dokumen EN dengan keluaran ID byte-identik; NDA masuk enum kode jenis; DS pensiun hanya di templat baru) + fase 1 (templat data PT, LAP, VER, STD dengan slot indeks aturan, NOT; ID dan EN berakhiran `-en`; satu per jenis per bahasa; lewat flag seed baru meniru `--contract-templates`). Default controller: tier ikut teks manual per jenis; skema klasifikasi tetap ANRI; tiap edisi ikut teksnya sendiri bila manual bertentangan; peran tanda tangan EN = Prepared by / Reviewed by / Approved by; audit token ditunda. Di luar lingkup: surat (SP, SPH, kop marun), RAB, workbook/dek/chat, skema klasifikasi. |
| `research/30_datum_rev_a_template_gap.md` | Celah per jenis (§5), usulan slug (§6.3), risiko R1-R10 (§6.5), rollout (§6.6), AC-1..AC-7 (§8.4). |
| `deploy/01_production_deploy_plan.md` §4, §5, §8 | Seed lewat klon `gsp_agent_hq_v21_seedtest` (penjaga `prisma/seed-studio.ts:124`), fase cadangan/gladi/geser port, rollback R-A..R-D. |
| `deploy/04_deploy_execution_log.md` | Proses produksi dan suntingan AppData/HKCU wajib dari luar aplikasi (WMI `spawn_out` + `start-hq.sh`, baris 40, 114, 153); jendela watchdog; pelajaran CRLF peluncur (baris 153). |
| U1 (USER, lewat controller) | "target kecocokan dengan datum minimal 85%": skor terukur >= 85 % per pasangan templat x bahasa, ditambah 4 aturan kritis wajib lulus (penandaan klasifikasi, pola nomor dokumen, konvensi angka, bahasa teks pembungkus). |
| U2 (USER, lewat controller) | "ah kalau tidak bisa diukur, cek dengan point coverage dan tidak ada bentrok text": butir yang tidak terukur masuk matriks cakupan (>= 85 % dari butir yang berlaku; di luar lingkup wajib beralasan dan keluar dari penyebut); 0 bentrok teks di PDF setiap sampel. |
| U3 (USER, lewat controller) | "metode penggunaannya gunakan cara global yang sama, metadata dan json data seperti template laporan dan dokumen kajian yang sudah ada": hanya slug `template` yang berubah; tanpa medan payload baru, skema slot baru, alat MCP baru, atau how-to per jenis. |
| U4 (USER, lewat controller) | "sweep code agar reuseable dengan berbagai template kecuali memang harus ada fungsi yang benar2 berbeda": tanpa percabangan slug/jenis, tanpa fungsi per templat, tanpa blok seed tersalin; satu tabel spec seed; satu tabel teks/lokal per bahasa. |

## 1. Tantangan arsitektur (hasil grounding sesi ini)

1. **`latest` dihitung di proses MCP Hermes, bukan di server.** `resolveTemplate` memilih slug `datum-*` terbaru menurut `updatedAt` (`scripts/studio/mcp/write-client-run.ts:24-35`). Server MCP Hermes berjalan dari checkout produksi lama (`hermes_studio_register_prompt.md:13`: args `C:\Users\TRIAL\gsp-hq-prod-v21\scripts\studio\mcp\server.ts`). Akibatnya, bila 10 baris templat baru masuk produksi sementara MCP Hermes masih memakai kode lama, `latest` langsung pindah ke templat baru. Urutan produksi WAJIB: tukar kode, lalu arahkan ulang MCP Hermes, baru impor data. Rollback WAJIB mengarsipkan templat baru (kolom `StudioTemplate.archived`, `prisma/schema.prisma:696`; filter `archived !== true` di `write-client-run.ts:29`) sebelum kode lama dipulihkan.
2. **Keluaran ID byte-identik.** Bawaan registri `wrapper.header` dan `device.issueStamp.format` (`L/params/page.ts:339, 439`) masuk `paramsSha256` templat lama, jadi bawaan itu TIDAK diubah. Pemilihan teks EN dilakukan di tabel teks: bila nilai parameter sama dengan bawaan registri dan bahasa EN, pakai entri EN. Pola ini sudah dipakai untuk kicker bab (`L/engine/front/texts.ts:102-104`, O-1).
3. **Teks pembungkus ID masih tersebar.** Kepala kolom lembar kendali tertulis keras di `L/services/compose/front.ts:30-32`; kicker lembar kendali = label slot (`front.ts:75-76`); fallback pita segel tertulis keras di `L/engine/docx/wrapper/render.ts:324`; label MCP ID/EN ada di tabel terpisah `scripts/studio/mcp/write-client.ts:104-105` ("Author", "Prepared", "Checked"). U4 menuntut satu tabel per bahasa, dengan tabel di `texts.ts:21-32` sebagai pusatnya.
4. **Format angka.** Pemisah ID tertulis sebagai konstanta (`L/engine/bind/format.ts:13-16`), dipakai oleh `register.ts:130-157` (termasuk `"Rp " +` di baris 153), `derivation.ts`, dan `audit.ts`, ditambah sekitar 40 modul chart. `Register` dibuat di 5 titik (`L/services/render/pure/render.ts:351`, `L/services/render/artifact.ts:455`, `L/services/ingest/checks.ts:137, 191`, `L/engine/lint/structure/checks-d.ts:83`). Lingkup ronde ini adalah angka terikat register (lapisan bind). Label chart tetap konvensi ID dan diputus sebagai keputusan terbuka Q-C, sehingga manifest clean-SVG tidak tersentuh.
5. **NDA.** Enum `doc.typeCode` belum memuat NDA dan masih memuat DS (`L/params/governance-language.ts:114-116`). Nilai bawaan tidak boleh berubah. Templat baru memakai daftar Rev A tanpa DS dan dengan NDA, jadi seed baru bergantung pada perubahan enum. Kode lama (3566486) yang membaca daftar bermuatan NDA hanya dicek di gladi, sebagai jalur rollback.
6. **Paritas pemakaian untuk NOTA (U3).** Slot sampul sampai TOC dilarang untuk tier NOTA (`L/services/compose/structure.ts:265`, `SLOT_FORBIDDEN_FOR_TIER`). Pembanding paritas yang benar untuk `datum-nota` adalah `datum-gsp` dengan `meta.tier = NOTA` hari ini, bukan dokumen TERBIT. Bila ternyata berbeda, itu dicatat sebagai risiko. Tidak ada input baru yang dirancang.
7. **Slot indeks aturan STD.** Jenis slot `ruleIndex` sah dengan mode bawaan AUTO (`L/registry/slots.ts:37, 92`; section `L/registry/sections.ts:427`). Agen tidak menulis input baru. Bila pembangkitan AUTO ternyata butuh input, baris terkait berhenti `needs-review`.
8. **Alat geometri teks PDF.** `package.json` hanya memuat `fflate` (baris 24) dan `playwright-core` (baris 33). Tidak ada pdfjs/pdf-parse di `node_modules`, dan `pdftoppm` tidak terpasang (`research/30:27`). Karena itu ada baris inventaris S04. Dependensi baru = keputusan USER (Q-E) dengan satu baris penulis lockfile.
9. **Gladi tidak boleh menulis ke workspace produksi.** `.env` checkout baru = `.env` produksi yang memuat `STUDIO_WORKSPACE_ROOT` produksi (`deploy/04:31`). Instans gladi di klon wajib memakai workspace sementara.
10. **Port standby.** 9041 kini dipakai standby kode lama `gsp-datacenter` (`decisions.md:592`, D-586). Build v2.1 3566486 yang menjadi rollback butuh port loopback lain, atau 9041 dialihkan. Keputusan Q-A.
11. **Ketidakkonsistenan manual** (medan blok kendali `ID:2486` vs `ID:15-18`; penomoran lembar `ID:2510` vs `EN:2582`): tiap edisi ikut teksnya sendiri (D-590). Aturan skor mengutip edisinya.

## 2. Kebutuhan (RQ) dan kriteria terima (AC)

| ID | Kebutuhan |
|---|---|
| RQ-1 | 10 templat data: PT, LAP, VER, STD (+ `ruleIndex` AUTO), NOT, masing-masing ID dan EN (`-en`), turunan `datum-gsp-preset` versi terbaru, lewat `--doc-type-templates`. |
| RQ-2 | Dokumen EN tanpa teks pembungkus Indonesia; angka terikat register mengikuti §6.7/§6.8 (1,250,000.5; IDR). |
| RQ-3 | `template: "latest"` selalu `datum-gsp`. |
| RQ-4 | 7 templat lama dan dokumen yang ada tidak berubah; keluaran ID byte-identik. |
| RQ-5 (U1) | Skor terukur >= 85 % per templat x bahasa, dengan 4 aturan kritis lulus semua. |
| RQ-6 (U2) | Cakupan butir yang tidak terukur >= 85 % dari butir yang berlaku; 0 bentrok teks pada PDF setiap sampel. |
| RQ-7 (U3) | Pemakaian identik: `studio_write`/`studio_edit`/R08 dengan `meta` + JSON konten yang sama; hanya slug yang berubah; bawaan (typeCode, tier, bahasa, kicker, label pembungkus) dari templat; override lewat meta tetap berlaku. |
| RQ-8 (U4) | Kode templat-agnostik: tanpa cabang slug/jenis, tanpa fungsi per templat, tanpa blok seed tersalin; satu tabel spec; satu tabel teks dan angka per bahasa. |
| RQ-9 | `docs/STUDIO-HOWTO-DOCUMENT.md` dan `docs/hermes-skills/gsp-studio-write/SKILL.md` memuat tabel slug (jenis x bahasa -> slug + bawaan) tanpa instruksi pakai baru; salinan terpasang di Hermes disegarkan dari luar aplikasi. |

| ID | Kriteria terima (diukur) |
|---|---|
| AC-1 | `--doc-type-templates`: `--dry-run` 0 tulis; jalan pertama 10 created; jalan ulang `unchanged`; penjaga gagal bila templat lain atau section type berubah. |
| AC-2 | Setiap templat baru: `restricted=false`, `contractKind` null, `archived=false`, `baseVersionId` = versi terbaru `datum-gsp-preset`. |
| AC-3 | Snapshot 7 templat lama (slug, latestVersionNo, updatedAt, paramsSha256, skeletonSha256, jumlah versi) identik di DEV, klon, dan produksi. |
| AC-4 | `latest` = `datum-gsp`: uji unit, smoke MCP DEV, gladi, produksi, dan sesi Hermes nyata. |
| AC-5 | Sampel per templat lolos R08 dengan kode jenis bawaannya; render DOCX dan PDF berhasil. |
| AC-6 | Render EN tidak memuat: Lembar Kendali, KLASIFIKASI, SALINAN INDUK, TERBITAN, Tanggal, Uraian, Oleh, Pemegang, LEMBAR, Penyusun, Rp. Angka register tampil 1,250,000.5 dengan IDR. |
| AC-7 | Keluaran ID byte-identik: hash baseline S05 = hash sesudah perubahan; `npx tsx benchmark/extract/convert_v2.ts --check` = SAME; `tests/unit/studio/figures/clean-svg-manifest.test.ts` hijau; suite studio penuh hijau. |
| AC-8 | Konformitas per pasangan, di DEV, gladi, dan produksi: terukur >= 85 % dan 4/4 aturan kritis lulus; cakupan >= 85 %; 0 bentrok teks; laporan per templat di `<task>/verification/`. |
| AC-9 | Uji paritas pemakaian hijau (satu JSON kajian identik ke datum-gsp dan 10 templat: valid, tanpa issue/peringatan baru, selisih hanya keluaran milik templat). Pada smoke MCP, selisih payload antarpanggilan = medan `template` saja. |
| AC-10 | Review kode: 0 cabang slug/jenis baru dan 0 kode per-templat ganda (temuan = pemblokir produksi). Review keamanan PASS, atau CAUTION yang diputus USER. |
| AC-11 | Tabel slug di dokumen = register S01; sha256 salinan skill Hermes = sumber repo. |
| AC-12 | Produksi: cadangan terverifikasi (sha256, `pg_restore --list`); impor satu transaksi; delta hitungan = ekspor; perintah RB-1/RB-2 siap; RB-1 sudah digladikan di klon. |

## 3. Asumsi dan batasan

- Ronde ini tidak menambah migrasi Prisma. S43 memverifikasi `migrate status` up to date. Bila ada migrasi tertunda: BERHENTI dan laporkan.
- Tidak ada dependensi npm baru tanpa keputusan USER (Q-E). `package.json`/`package-lock.json` tidak punya baris penulis.
- Semua proses produksi, suntingan peluncur (`C:/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh` terverifikasi ada), konfigurasi/skill Hermes (AppData), dan registri dijalankan dari luar aplikasi lewat WMI seperti di `deploy/04`.
- Jendela tukar port: hindari menit :55-:05 pada jam kelipatan 3 dan Senin dini hari dekat 05:00 (`deploy/01` §5 fase 4).
- Penjaga DB seed (`ALLOWED_DATABASES`, `prisma/seed-studio.ts:124`) tidak diubah. Produksi hanya menerima baris salinan dari klon.
- Baris tidak meng-commit. Commit dan tag hanya di S41. File milik controller (`status_tasks.md`, `README.md`, `decisions/decisions.md`, `implementation/99_implementation_report.md`, `report/report.md`) tidak ditulis baris mana pun.

## 4. Register nama (kesepakatan awal; S01 menulis versi definitif dengan sitasi)

| Jenis | Slug ID | Slug EN | Kode | Catatan |
|---|---|---|---|---|
| Proposal teknis | `datum-proposal-teknis` | `datum-proposal-teknis-en` | PT | tier ikut teks manual (`ID:647`, `EN:450`) |
| Laporan | `datum-laporan` | `datum-laporan-en` | LAP | TERBIT kecuali manual menyatakan lain |
| Laporan verifikasi/uji | `datum-laporan-verifikasi` | `datum-laporan-verifikasi-en` | VER | `ID:659`, `ID:3969-3972` |
| Standar/SOP | `datum-standar` | `datum-standar-en` | STD | 8 slot: + `ruleIndex` AUTO sebelum lampiran |
| Nota internal | `datum-nota` | `datum-nota-en` | NOT | NOTA (`ID:406-412`) |

Lapis bersama: `doc.typeCode` = PT, KT, RAB, SPH, SP, BA, NDA, DEK, LAP, MAT, STD, NOT, MOD, VER (tanpa DS). Lapis EN: `doc.language` EN, label slot EN, `cover.kicker.text` EN, `render.toc.title` "Contents". Pita segel dan cap terbit TIDAK ditimpa templat. Keduanya mengikuti bahasa lewat tabel teks (tantangan 2), sehingga dokumen EN di `datum-gsp` ikut benar. Konstanta default `latest` = `datum-gsp`, satu literal bernama di satu tempat (disposisi sweep: "pertahankan, alasan D-590").

## 5. Gerbang dan rencana rollback

| Gerbang | Kapan | Isi |
|---|---|---|
| G0 | sebelum S01 | Persetujuan blueprint ini (Plan Mode), dicatat controller. |
| G-FIX | S36, S45, S52 gagal | Loop perbaikan terbatas: baris perbaikan baru (S/M) per temuan, maks. 3 siklus per kriteria, lalu eskalasi ke USER. |
| G-SEC | S39 CAUTION/FAIL, S24 butuh dependensi | Diteruskan ke USER via AskUserQuestion; FAIL tidak pernah di-override. |
| G1 | sesudah S38-S40 | USER menyetujui perubahan produksi: commit/tag, checkout r2, cadangan, klon, gladi, ekspor, impor data (S50), 10 dokumen smoke produksi (S51). |
| G2 | sesudah S46 | USER menyetujui restart: tukar port (S47), peluncur (S48), repoint MCP + restart gateway Hermes (S49). |

| Tingkat | Kapan | Langkah |
|---|---|---|
| RB-0 | sebelum G2 | Produksi belum berubah (hanya cadangan dan klon). Tidak ada tindakan. |
| RB-1 data | sesudah S50 | Satu transaksi `UPDATE "StudioTemplate" SET archived = true WHERE slug IN (<10 slug>)`. Reversibel. Templat tersembunyi dari daftar dan `latest`; dokumen yang sudah dibuat tetap terbaca. Menghapus baris hanya dengan persetujuan eksplisit USER. |
| RB-2 kode | sesudah S47 | RB-1 dulu bila baris baru sudah ada (tantangan 1). Lalu hentikan r2 di 9011, jalankan `gsp-hq-prod-v21` (3566486) di 9011 dari luar aplikasi, pulihkan peluncur dari `.bak-<tanggal>`, pulihkan config MCP Hermes dari cadangan, dan restart gateway satu per satu. |
| RB-3 | upaya terakhir | `pg_restore` dump S43 dengan HQ dan bridge dihentikan. Semua tulisan sesudah cadangan hilang (`deploy/01` §8 R-D). |

## Structured Task Breakdown

| Step | Task Description | Agent_to_Invoke | Skills_to_Load | Expected Output | Depends On | Verification | Phase |
|---|---|---|---|---|---|---|---|
| S01 | Tulis register nama dan konstanta ronde ini: 10 slug dan nama, kode dan tier bawaan per jenis dengan sitasi manual, kicker ID/EN, label slot EN, judul daftar isi, kepala kolom lembar kendali ID/EN, label PENYUSUN EN, pasangan pita segel dan format cap terbit EN, peran tanda tangan EN, konvensi angka EN, daftar string AC-6, konstanta default `latest`, ambang 85/85/0, 4 aturan kritis, aturan paritas pemakaian U3 | data-analyst | - | NEW <task>/research/31_datum_rev_a_names_register.md | none | setiap nilai bersitasi ID:n/EN:n, D-590, atau research/30; 10 slug unik dan EN berakhiran -en; tidak ada medan payload atau skema slot baru | research |
| S02 | Susun katalog butir manual Rev A: satu baris per butir (kode, sitasi ID:n/EN:n, keluarga, terukur-skrip atau cakupan-saja, berlaku per tier/bahasa/jenis, kritis) untuk keluarga sampul §8.2, lembar kendali, kepala halaman dan blok register, pita segel dan cap terbit, geometri/fon, §3.4, tier, §6.7/§6.8, AC-6, label bahasa | data-analyst | - | NEW <task>/research/32_datum_conformance_rules.md | S01 | setiap butir mengutip baris manual yang ada; 4 aturan kritis ditandai; setiap butir berstatus terukur atau cakupan-saja | research |
| S03 | Sweep kode baca-saja untuk U4: (a) slug/kode jenis tertulis keras di src/, scripts/, prisma/seed (termasuk write-client-run.ts, seed laporan-kerja-agen, labels.ts), (b) string pembungkus ID di luar tabel teks (front.ts:30-32, page.ts:434-443, render.ts:324), (c) duplikasi jalur seed kontrak lawan jalur baru, (d) format angka per bahasa di bind/format.ts dan lint | data-analyst | - | NEW <task>/research/33_template_agnostic_code_sweep.md | S01 | setiap temuan ber-file:baris; setiap temuan berdisposisi refaktor, pertahankan dengan alasan, atau di luar lingkup; daftar refaktor terbatas pada area yang disentuh templat baru | research |
| S04 | Inventaris alat geometri teks PDF yang sudah terpasang di host (node_modules, paket Python, soffice, playwright-core) untuk pemeriksa bentrok teks, tanpa memasang apa pun | data-collector | - | NEW <task>/research/34_pdf_text_geometry_tooling.md | none | setiap alat disertai perintah dan keluarannya; rekomendasi tanpa dependensi baru, atau ditandai butuh keputusan USER | research |
| S05 | Rekam baseline keluaran ID dari tag prod-v2.1-20261104 di worktree terpisah di luar folder kerja: hash suite paritas, convert_v2 --check, manifest clean-SVG, DOCX sampel datum-gsp ID | coder-execution | using-git-worktrees, dry-run-verify-fix | NEW <task>/verification/19_id_baseline_hashes.md | none | worktree di luar folder repo kerja dan dilepas sesudahnya; convert_v2 SAME dan manifest hijau tercatat; hash per berkas tercatat | verification |
| S06 | Refaktor dengan perilaku tetap: kepala kolom lembar kendali (front.ts:30-32) dan fallback pita segel (render.ts:324) dipindah ke tabel teks tunggal di texts.ts; nilai ID tetap persis | coder-execution | tdd, dry-run-verify-fix | edited L/engine/front/texts.ts, L/services/compose/front.ts, L/engine/docx/wrapper/render.ts | S03 | fix2-wrapper-text-parity hijau; suite renderers hijau; 0 string pembungkus ID di luar tabel untuk area ini (grep) | implementation |
| S07 | Refaktor dengan perilaku tetap: konvensi angka menjadi tabel per bahasa di format.ts; entri ID = konstanta sekarang; tanda tangan fmt dan withUnit tidak berubah | coder-execution | tdd, dry-run-verify-fix | edited L/engine/bind/format.ts + uji | S03 | uji format yang ada hijau; kasus paritas Python half-even tidak berubah | implementation |
| S08 | Terapkan butir (d) sweep yang berdisposisi refaktor: duplikasi format angka per bahasa di lint memakai tabel format.ts (complete tanpa perubahan bila tidak ada butir) | coder-execution | tdd, dry-run-verify-fix | edited berkas lint sesuai research/33 | S07, S03 | uji lint bahasa dan struktur hijau; 0 literal pemisah angka ganda di lint (grep) | implementation |
| S09 | Refaktor seed dengan perilaku tetap: helper templat turunan-preset dan runner transaksi berpenjaga diekstrak dari jalur --contract-templates menjadi fungsi bersama yang menerima tabel spec | coder-execution | backend-execution, tdd, dry-run-verify-fix | edited prisma/seed-studio.ts | S03 | --contract-templates --dry-run di DEV unchanged dan 0 tulis; tsc 0; 0 blok seed per-templat tersalin | implementation |
| S10 | P0-1: `template: "latest"` diresolusi ke satu konstanta default bernama (`datum-gsp`, D-590), tidak lagi menurut urutan updatedAt | coder-execution | tdd, dry-run-verify-fix | edited scripts/studio/mcp/write-client-run.ts, tests/unit/studio/mcp/implw2-client.test.ts | S03, S01 | uji baru merah sebelum perubahan dan hijau sesudahnya (templat datum-* yang lebih baru tetap menghasilkan datum-gsp); suite MCP hijau; satu-satunya literal slug = konstanta default | implementation |
| S11 | P0-2: NDA ditambahkan ke enum doc.typeCode tanpa mengubah nilai bawaan | coder-execution | tdd, dry-run-verify-fix | edited L/params/governance-language.ts + uji | none | uji NDA diterima hijau; nilai bawaan dan paramsSha256 kanonik tidak berubah | implementation |
| S12 | Label klien MCP EN mengikuti register (PENYUSUN = Prepared by; peran Prepared by, Reviewed by, Approved by) dan memakai tabel teks bersama bila sweep menandai duplikasi | coder-execution | tdd, dry-run-verify-fix | edited scripts/studio/mcp/write-client.ts + uji sendiri | S06, S01 | label ID byte-sama; label EN = register; suite MCP hijau | implementation |
| S13 | Entri EN dan pemilihan bahasa di tabel texts.ts: kepala kolom lembar kendali, label PENYUSUN, pasangan pita segel dan format cap terbit bawaan (EN hanya bila nilai parameter = bawaan registri) | coder-execution | tdd, dry-run-verify-fix | edited L/engine/front/texts.ts + uji | S06, S01 | keluaran ID byte-sama (fix2 parity); entri EN = register; bawaan registri page.ts tidak diubah | implementation |
| S14 | Lembar kendali: kepala kolom dan kicker mengikuti meta.language lewat tabel teks | coder-execution | tdd, dry-run-verify-fix | edited L/services/compose/front.ts + uji | S13 | uji compose ID byte-sama; lembar kendali EN tanpa Lembar Kendali, Tanggal, Uraian, Oleh, atau Pemegang | implementation |
| S15 | Pita segel DOCX dan HTML memakai bawaan berbahasa dari tabel teks | coder-execution | tdd, dry-run-verify-fix | edited L/engine/docx/wrapper/render.ts, L/engine/html/blocks/device.ts + uji | S13 | DOCX dan HTML ID byte-sama; EN memuat CLASSIFICATION · dan MASTER COPY · GSP INTERNAL USE; copyControl tetap menang | implementation |
| S16 | Entri konvensi EN di tabel angka (ribuan ",", desimal ".", IDR menggantikan Rp) dengan fungsi berparameter bahasa; jalur ID byte-sama | coder-execution | tdd, dry-run-verify-fix | edited L/engine/bind/format.ts + uji | S07, S01 | 1250000.5 EN = 1,250,000.5 dan satuan IDR sesuai register; uji ID tidak berubah | implementation |
| S17 | Lapisan bind: Register, derivation, dan audit menerima konvensi bahasa (bawaan ID); satuan mata uang diambil dari tabel | coder-execution | tdd, dry-run-verify-fix | edited L/engine/bind/register.ts, derivation.ts, audit.ts + uji | S16 | uji bind ID byte-sama; audit menerima varian EN hanya untuk dokumen EN | implementation |
| S18 | Kabel meta.language ke 5 titik konstruksi Register (render/pure/render.ts, render/artifact.ts, ingest/checks.ts x2, lint/structure/checks-d.ts) | coder-execution | backend-execution, tdd, dry-run-verify-fix | edited 4 berkas titik panggil | S17 | render ID byte-sama; dokumen EN merender angka register 1,250,000.5 dengan IDR; tsc 0 | implementation |
| S19 | Gerbang regresi refaktor + fase 0: suite studio penuh, manifest clean-SVG, convert_v2 --check, banding hash baseline S05, tsc, eslint, grep cabang slug/jenis | test-expert | tdd | NEW <task>/verification/20_phase0_regression.md | S05, S06, S08, S09, S10, S11, S12, S14, S15, S18 | suite studio dan manifest hijau; convert_v2 SAME dan hash ID = S05; 0 cabang slug/jenis baru (grep) | test |
| S20 | Harness skor konformitas DATUM: pembaca DOCX (fflate), antarmuka aturan (id, keluarga, sitasi, berlaku, kritis), indeks aturan yang sudah terkabel ke 4 modul stub, skor lulus/berlaku, gerbang kritis, laporan JSON dan MD per templat, CLI | coder-execution | tdd, dry-run-verify-fix | NEW benchmark/datum_conformance/ (harness, indeks, 4 stub) + uji | S02, S01 | uji harness hijau; CLI berjalan pada DOCX Manual 000 dengan 0 aturan; tanpa dependensi baru | implementation |
| S21 | Modul aturan struktur A: sampul §8.2 12 unsur berurutan, blok dan kepala kolom lembar kendali per bahasa, perilaku tier (NOTA tanpa sampul dan lembar kendali) | coder-execution | tdd | NEW modul struktur-A di benchmark/datum_conformance + uji | S20 | setiap aturan mengutip butir S02; DOCX baik lulus dan DOCX yang dimutasi turun skor; uji hijau | implementation |
| S22 | Modul aturan struktur B: kepala halaman dan blok register (SHEET/OF, LEMBAR/DARI), teks pita segel dan cap terbit, geometri halaman, fon, dan ukuran menurut profil templat | coder-execution | tdd | NEW modul struktur-B di benchmark/datum_conformance + uji | S20 | setiap aturan mengutip butir S02; DOCX baik lulus dan DOCX yang dimutasi turun skor; uji hijau | implementation |
| S23 | Modul aturan bahasa dan angka: pola nomor §3.4 dan daftar kode tertutup tanpa DS, konvensi angka/mata uang §6.7/§6.8 per bahasa, tanpa teks pembungkus ID di EN (AC-6), label bahasa (Prepared by, Contents), teks pembungkus kontradiktif (campur bahasa, dua kode jenis atau kicker) dilaporkan sebagai bentrok | coder-execution | tdd | NEW modul bahasa di benchmark/datum_conformance + uji | S20 | setiap aturan mengutip butir S02; DOCX EN berlabel ID turun skor dan gagal kritis; uji hijau | implementation |
| S24 | Modul bentrok teks PDF: kotak teks per halaman yang tumpang-tindih, keluar halaman/margin, terpotong di sel tabel dan blok sampul, atau label yang meluap di blok register, kepala halaman, dan pita segel | coder-execution | tdd, dry-run-verify-fix | NEW modul bentrok di benchmark/datum_conformance + uji | S20, S04 | PDF dengan bentrok sengaja terdeteksi beserta halaman dan koordinat; PDF Manual 000 dilaporkan; bila butuh dependensi baru: needs-review, bukan memasang | implementation |
| S25 | Kalibrasi emas skor dan pemeriksa bentrok pada DOCX/PDF Manual 000 (benchmark/out/fixb/official) dan sampel datum-gsp ID: baseline per keluarga, aturan N/A beserta alasan | test-expert | tdd | NEW <task>/verification/21_datum_conformance_calibration.md | S21, S22, S23, S24 | baseline terukur dan jumlah bentrok per keluarga dilaporkan; DOCX yang dirusak sengaja skornya lebih rendah; daftar N/A beralasan | test |
| S26 | Tabel spec templat sebagai data murni untuk 10 templat ID/EN dari register: lapis jenis/bahasa di atas datum-gsp-preset, kerangka 7 slot ditambah ruleIndex AUTO untuk STD, tanpa medan payload baru | coder-execution | backend-execution, tdd | NEW modul tabel spec di prisma/ + uji | S01, S25 | 10 slug unik dan nilai = register; jenis slot termasuk kerangka datum-gsp-preset ditambah ruleIndex AUTO; lapis EN bebas string AC-6 | implementation |
| S27 | Flag seed --doc-type-templates yang mengiterasi tabel spec lewat helper bersama S09: satu transaksi, --dry-run, idempoten, penjaga (templat lain tak berubah, section type tak tersentuh, restricted=false, contractKind null, basis = versi terbaru datum-gsp-preset) | coder-execution | backend-execution, tdd, dry-run-verify-fix | edited prisma/seed-studio.ts | S26, S09, S11 | dry-run di DEV 0 tulis dengan rencana 10 created; uji penjaga merah bila templat lain berubah; 0 kode per-slug | implementation |
| S28 | Tambah --doc-type-templates dua kali (jalan kedua unchanged) ke jalur fresh-seed uji-run.mjs | coder-execution | dry-run-verify-fix | edited tests/integration/studio/uji-run.mjs | S27 | fresh-seed pada gsp_agent_hq_v21_uji lulus; jalan kedua unchanged | test |
| S29 | Uji paritas pemakaian (U3): satu JSON konten kajian identik (sampel how-to apa adanya) dikirim ke datum-gsp dan ke 10 templat; pembanding datum-nota = datum-gsp dengan tier NOTA | coder-execution | tdd | NEW uji paritas di tests/unit/studio/ | S26, S19 | 11 templat valid tanpa issue atau peringatan baru; selisih hanya keluaran milik templat; meta yang dikirim tetap menang atas bawaan | test |
| S30 | STUDIO-HOWTO-DOCUMENT.md: tabel slug (jenis dokumen x bahasa -> slug + bawaan) dan kalimat latest = datum-gsp; tanpa instruksi pakai baru | coder-execution | dry-run-verify-fix | edited docs/STUDIO-HOWTO-DOCUMENT.md | S01, S10 | tabel = register; uji payload how-to apa adanya hijau; diff hanya tabel dan kalimat latest | implementation |
| S31 | SKILL.md gsp-studio-write: tabel slug yang sama, tanpa instruksi pakai baru | coder-execution | dry-run-verify-fix | edited docs/hermes-skills/gsp-studio-write/SKILL.md | S01 | tabel = register; diff hanya tabel slug | implementation |
| S32 | STUDIO-AGENT-GUIDE.md §3: tabel templat diperluas dengan 10 slug, tanpa instruksi baru | coder-execution | dry-run-verify-fix | edited docs/STUDIO-AGENT-GUIDE.md | S01 | tabel = register; diff hanya tabel §3 | implementation |
| S33 | Matriks cakupan butir (U2) untuk butir cakupan-saja dari S02, per templat x bahasa: tempat cakupan (slot, kunci parameter, label, perilaku mesin file:baris), status, alasan di luar lingkup, persentase | data-analyst | - | NEW <task>/verification/22_datum_point_coverage.md | S02, S26, S19 | setiap butir bersitasi manual dan bukti cakupan; butir di luar lingkup beralasan dan keluar dari penyebut; cakupan per pasangan dihitung | verification |
| S34 | DEV seed di gsp_agent_hq_v21: --doc-type-templates --dry-run, jalan nyata, jalan ulang; snapshot templat lain sebelum dan sesudah | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_rev_a_dev_seed.md | S27, S19, S25 | dry-run 0 tulis; jalan ulang unchanged; snapshot templat lain identik (AC-3) | implementation |
| S35 | DEV render dan smoke MCP: studio_write dengan payload how-to yang sama dan hanya slug yang berubah untuk 10 templat di 9021, render DOCX dan PDF, studio_templates_list, latest | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_rev_a_dev_smoke.md + 20 berkas DOCX/PDF | S34, S30 | 10 dokumen valid R08 dengan kode jenis bawaan dan terender; diff payload antarpanggilan = medan template saja; latest = datum-gsp | test |
| S36 | Gerbang konformitas DEV per templat x bahasa: skor terukur (S20-S23), cakupan (S33), bentrok teks (S24); laporan per templat | test-expert | tdd | NEW <task>/verification/23_datum_conformance_dev.md | S35, S25, S33 | terukur >= 85 % dan 4/4 kritis lulus tiap pasangan; cakupan >= 85 % tiap pasangan; 0 bentrok | verification |
| S37 | Runbook peluncuran produksi (baca-saja terhadap produksi): checkout r2, cadangan, klon, seed klon, gladi 9031 dengan workspace sementara, ekspor baris yang difilter slug, tukar port, peluncur, repoint MCP Hermes, impor satu transaksi, verifikasi, RB-0..RB-3 | coder-execution | dry-run-verify-fix | NEW <task>/deploy/05_datum_rev_a_rollout_plan.md | S36 | setiap perintah memakai db_guard dan variabel tanpa gema; urutan kode -> MCP -> data dan RB-1 sebelum RB-2 tertulis; keadaan produksi bersumber perintah baca-saja | masterplan |
| S38 | Review kode senior atas seluruh perubahan (refaktor, fase 0, seed, uji paritas, skor) dengan cek eksplisit: tidak ada cabang slug/jenis baru dan tidak ada kode per-templat ganda | senior-code-reviewer | code-review-senior | NEW <task>/verification/24_datum_rev_a_code_review.md | S19, S27, S28, S29, S25 | vonis PASS/CAUTION/FAIL dengan file:baris; temuan cabang slug/jenis atau duplikasi ditandai pemblokir produksi; klaim ID byte-identik dinilai dengan bukti | verification |
| S39 | Review keamanan: penjaga seed (ALLOWED_DATABASES tidak berubah), pin latest, pembacaan DOCX/PDF tak tepercaya oleh skor, SQL runbook (transaksi, db_guard, tanpa rahasia), peluncuran proses lewat WMI | security-review | security-review-gate | NEW <task>/verification/25_datum_rev_a_security_review.md | S37, S19, S27, S25 | vonis PASS/CAUTION/FAIL; setiap temuan berbukti file:baris atau baris runbook; CAUTION/FAIL ditandai untuk USER | verification |
| S40 | Verifikasi pra-produksi: AC-1..AC-11 terhadap bukti DEV, lingkup D-590 (masuk dan keluar), tabel slug dokumen = register, runbook konsisten dengan pelajaran deploy/04 | verifier | verification-before-completion | NEW <task>/verification/26_datum_rev_a_preprod_verification.md | S36, S37, S30, S31, S32 | setiap AC berbukti perintah atau berkas; tidak ada butir di luar lingkup ikut masuk; celah dilaporkan sebagai usulan baris baru | verification |
| S41 | Commit perubahan ke cabang v2.1 dan tag lokal prod-v2.1-datum-rev-a-<tanggal>, tanpa push (sesudah G1) | git-specialist | finishing-a-development-branch | commit dan tag di repo v2.1 | S38, S39, S40 | git status bersih; tag menunjuk commit baru; tidak ada push | initialization |
| S42 | Checkout produksi baru C:/Users/TRIAL/gsp-hq-prod-v21-r2 dari tag: clone --no-hardlinks, .env dan certs disalin dari gsp-hq-prod-v21 tanpa dicetak, npm ci, build, tsc | coder-execution | dry-run-verify-fix | NEW C:/Users/TRIAL/gsp-hq-prod-v21-r2 | S41 | build exit 0 dan BUILD_ID tercatat; tsc 0; git status bersih dengan .env/certs diabaikan | initialization |
| S43 | Siapkan klon produksi berseed dari cadangan segar: pg_dump produksi dengan db_guard sebagai sumber klon dan titik RB-3, gsp_agent_hq_v21_seedtest dipulihkan dari dump itu, migrate status dicek, lalu --doc-type-templates dry-run, nyata, dan ulang dari r2 | coder-execution | dry-run-verify-fix | NEW folder C:/Users/TRIAL/gsp-backups/datum-rev-a-<ts>/ + DB klon berseed | S42 | dump terbaca (pg_restore --list) dan sha tercatat; migrate status up to date tanpa migrasi baru; seed klon jalan ulang unchanged dengan 7 templat lama identik | implementation |
| S44 | Gladi di klon dari luar aplikasi dengan STUDIO_WORKSPACE_ROOT sementara: r2 di 9031 (smoke S-1..S-9, render 10 templat lewat MCP r2); kode v2.1 lama di port loopback bebas terhadap klon; gladi RB-1 | coder-execution | dry-run-verify-fix | NEW log gladi dan DOCX/PDF gladi di folder cadangan | S43 | smoke lulus, 10 render OK, dan latest = datum-gsp; kode lama dengan baris baru tetap melayani daftar templat dan datum-gsp; archive menyembunyikan 10 templat dan latest kode lama = datum-gsp | gateway_check |
| S45 | Konformitas gladi: skor terukur, bentrok teks, dan rujukan cakupan untuk 10 render gladi | test-expert | tdd | NEW <task>/verification/27_datum_conformance_rehearsal.md | S44 | terukur >= 85 % dan 4/4 kritis lulus tiap pasangan; cakupan >= 85 % (rujukan S33); 0 bentrok | gateway_check |
| S46 | Ekspor hanya baris baru dari klon (\copy per tabel difilter 10 slug: StudioTemplate, StudioTemplateVersion, StudioTemplateSlot, StudioTemplateSlotParam, ditambah tabel slot lain bila berisi baris milik 10 slug) dengan sha256 dan hitungan; DB klon dihapus sesudah verifikasi | coder-execution | dry-run-verify-fix | NEW berkas ekspor dan SHA256SUMS di folder cadangan | S45 | hitungan per tabel tercatat dan semua baris milik 10 slug; StudioSectionType klon identik dengan produksi; klon dihapus hanya sesudah sha diverifikasi | implementation |
| S47 | Tukar port kode sebelum data (sesudah G2): v2.1 lama di 9011 dihentikan, r2 dijalankan di 9011 dari luar aplikasi, build lama dipertahankan sebagai rollback di port standby yang diputus USER | coder-execution | dry-run-verify-fix | proses r2 di 9011 dan log tukar port | S46 | /login 200 dan downtime tercatat; smoke S-1..S-14 lulus; daftar templat = 7 lama dan latest lewat MCP r2 = datum-gsp | implementation |
| S48 | Peluncur persisten diarahkan ke r2 dari luar aplikasi: baris cd HQ di gsp-ecosystem-start.sh dan cwd HQ di watchdog-webui-hq.py, dengan cadangan .bak-<tanggal> dan EOL asli dipertahankan | coder-execution | dry-run-verify-fix | edited 2 berkas peluncur | S47 | diff = 1 baris per berkas dengan EOL utuh; bash -n dan py_compile OK; cadangan ada | implementation |
| S49 | MCP studio Hermes di 5 profil diarahkan ke r2 (args tsx cli.mjs dan server.ts), cadangan config, restart gateway satu per satu dengan pelajaran D-589 | coder-execution | dry-run-verify-fix | edited config MCP 5 profil Hermes | S47 | 5 profil menunjuk r2 dan rahasia tetap berupa rujukan env; studio_contracts_query ok di setiap gateway yang berjalan; latest dari sesi Hermes = datum-gsp | implementation |
| S50 | Impor baris baru ke produksi dalam satu transaksi: pra-cek slug belum ada dan FK versi preset ada, impor, verifikasi | coder-execution | dry-run-verify-fix | 10 templat baru di gsp_agent_hq | S46, S47, S49 | 7 templat lama identik (AC-3); delta hitungan = ekspor S46; latest MCP = datum-gsp dan daftar = 17 templat | implementation |
| S51 | Smoke render produksi: studio_write dengan payload how-to yang sama dan hanya slug yang berubah untuk 10 templat di 9011, render DOCX dan PDF | coder-execution | dry-run-verify-fix | NEW <task>/implementation/datum_rev_a_prod_smoke.md + 10 dokumen smoke produksi | S50 | 10 dokumen valid dan terender; diff payload = medan template saja; nasib dokumen smoke sesuai keputusan Q-D (tanpa penghapusan) | test |
| S52 | Konformitas produksi pasca-rollout per templat: skor terukur, bentrok teks, rujukan cakupan | test-expert | tdd | NEW <task>/verification/28_datum_conformance_prod.md | S51 | terukur >= 85 % dan 4/4 kritis lulus tiap pasangan; cakupan >= 85 % (rujukan S33); 0 bentrok | verification |
| S53 | Segarkan salinan skill Hermes terpasang dari luar aplikasi: SKILL.md, references/howto-document.md (dari STUDIO-HOWTO-DOCUMENT.md), dan references/howto-report.md, dengan cadangan salinan lama | coder-execution | dry-run-verify-fix | salinan skill gsp-studio-write terpasang diperbarui | S50, S30, S31 | sha256 tiap salinan = sumber repo; cadangan salinan lama ada | implementation |
| S54 | Verifikasi akhir: AC-1..AC-12, kesiapan rollback (perintah RB-1/RB-2, .bak peluncur dan config, build lama dapat dijalankan), observasi log 30 menit, durasi render dibanding DEV, tanpa kebocoran rahasia | verifier | verification-before-completion | NEW <task>/verification/29_datum_rev_a_final_verification.md | S48, S52, S53 | setiap AC berbukti segar; artefak dan perintah rollback ada dan terverifikasi; 0 request error baru dan 0 rahasia di log atau laporan | verification |

## Execution Profile

| Step | Ownership area (exact paths) | Size | Dep kind | Model | Checks | Review |
|---|---|---|---|---|---|---|
| S01 | docs only: NEW under <task>/research/ (verified): names register | M | none | inherit | 3 | batched |
| S02 | docs only: NEW under <task>/research/ (verified): rule catalog | M | S01:C | inherit | 3 | batched |
| S03 | docs only: NEW under <task>/research/ (verified): code sweep; baca-saja terhadap kode | M | S01:C | inherit | 3 | batched |
| S04 | docs only: NEW under <task>/research/ (verified): tooling inventory; baca-saja terhadap host | S | none | sonnet (mechanical tooling inventory) | 2 | batched |
| S05 | docs only: NEW under <task>/verification/ (verified); git worktree sementara di folder scratch di luar repo (executor declares) | S | none | sonnet (run commands, record hashes) | 3 | batched |
| S06 | wrapper text single source: EXISTS: src/lib/studio/engine/front/texts.ts; EXISTS: src/lib/studio/services/compose/front.ts; EXISTS: src/lib/studio/engine/docx/wrapper/render.ts; EXISTS: tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | M | S03:B | inherit | 3 | gate |
| S07 | number table: EXISTS: src/lib/studio/engine/bind/format.ts (+ uji format, executor declares) | S | S03:B | inherit | 2 | gate |
| S08 | lint number dedupe: UNKNOWN - executor declares (berkas dari research/33; tidak menyentuh lint/structure/checks-d.ts) | S | S07:B, S03:B | inherit | 2 | gate |
| S09 | seed shared helper: EXISTS: prisma/seed-studio.ts (sole writer di gelombang ini) | M | S03:B | inherit | 3 | gate |
| S10 | latest pin: EXISTS: scripts/studio/mcp/write-client-run.ts; EXISTS: tests/unit/studio/mcp/implw2-client.test.ts | S | S03:B, S01:C | inherit | 3 | gate |
| S11 | enum: EXISTS: src/lib/studio/params/governance-language.ts (+ uji, executor declares) | S | none | sonnet (specified enum addition) | 2 | gate |
| S12 | MCP labels: EXISTS: scripts/studio/mcp/write-client.ts; berkas uji baru sendiri (executor declares) | S | S06:B, S01:C | inherit | 3 | gate |
| S13 | EN text entries: EXISTS: src/lib/studio/engine/front/texts.ts; EXISTS: tests/unit/studio/renderers/fix2-wrapper-text-parity.test.ts | M | S06:B, S01:B | inherit | 3 | gate |
| S14 | control sheet: EXISTS: src/lib/studio/services/compose/front.ts (+ uji compose, executor declares) | S | S13:B | inherit | 2 | gate |
| S15 | seal band: EXISTS: src/lib/studio/engine/docx/wrapper/render.ts; EXISTS: src/lib/studio/engine/html/blocks/device.ts | S | S13:B | inherit | 3 | gate |
| S16 | EN number entry: EXISTS: src/lib/studio/engine/bind/format.ts | S | S07:B, S01:B | inherit | 2 | gate |
| S17 | bind layer: EXISTS: src/lib/studio/engine/bind/register.ts; EXISTS: src/lib/studio/engine/bind/derivation.ts; EXISTS: src/lib/studio/engine/bind/audit.ts | M | S16:B | inherit | 2 | gate |
| S18 | wiring: EXISTS: src/lib/studio/services/render/pure/render.ts; EXISTS: src/lib/studio/services/render/artifact.ts; EXISTS: src/lib/studio/services/ingest/checks.ts; EXISTS: src/lib/studio/engine/lint/structure/checks-d.ts | M | S17:B | inherit | 3 | gate |
| S19 | docs only: NEW under <task>/verification/ (verified); menjalankan suite, tanpa menyunting kode | M | S05:B, S06:B, S08:B, S09:B, S10:B, S11:B, S12:B, S14:B, S15:B, S18:B | inherit (verification agent) | 3; gate flows: suite, manifest, convert_v2 | n/a |
| S20 | scorer harness: NEW under benchmark/ (verified parent; datum_conformance confirmed absent): harness, rule index (sole writer), 4 stub modules; uji (executor declares) | M | S02:B, S01:C | inherit | 3 | gate |
| S21 | NEW under benchmark/datum_conformance (dibuat S20): modul struktur-A + uji sendiri; tidak menyentuh indeks | M | S20:B | inherit | 3 | gate |
| S22 | NEW under benchmark/datum_conformance (dibuat S20): modul struktur-B + uji sendiri | M | S20:B | inherit | 3 | gate |
| S23 | NEW under benchmark/datum_conformance (dibuat S20): modul bahasa/angka + uji sendiri | M | S20:B | inherit | 3 | gate |
| S24 | NEW under benchmark/datum_conformance (dibuat S20): modul bentrok PDF + uji sendiri | M? | S20:B, S04:B | inherit | 3 | gate |
| S25 | docs only: NEW under <task>/verification/ (verified); membaca benchmark/out/fixb/official/*.docx (verified) | M | S21:B, S22:B, S23:B, S24:B | inherit (verification agent) | 3 | n/a |
| S26 | spec table: NEW under prisma/ (verified parent): modul tabel spec + uji sendiri | M | S01:B, S25:C | inherit | 3 | gate |
| S27 | seed flag: EXISTS: prisma/seed-studio.ts (sole writer di gelombang ini) | M | S26:B, S09:B, S11:B | inherit | 3 | gate |
| S28 | EXISTS: tests/integration/studio/uji-run.mjs; DB gsp_agent_hq_v21_uji (sole user) | S | S27:B | sonnet (specified harness edit) | 2 | gate |
| S29 | NEW under tests/unit/studio/ (verified parent): uji paritas pemakaian (in-memory atau DEV baca-saja) | M | S26:B, S19:B | inherit | 3 | gate |
| S30 | EXISTS: docs/STUDIO-HOWTO-DOCUMENT.md | S | S01:B, S10:C | inherit | 3 | batched |
| S31 | EXISTS: docs/hermes-skills/gsp-studio-write/SKILL.md | S | S01:B | sonnet (table from register) | 2 | batched |
| S32 | EXISTS: docs/STUDIO-AGENT-GUIDE.md | S | S01:B | sonnet (table from register) | 2 | batched |
| S33 | docs only: NEW under <task>/verification/ (verified) | M | S02:B, S26:B, S19:B | inherit | 3 | batched |
| S34 | docs only: NEW under <task>/implementation/; DB gsp_agent_hq_v21 (sole writer di gelombang ini) | S | S27:B, S19:B, S25:B | inherit | 3 | batched |
| S35 | docs only: NEW under <task>/implementation/; dokumen DEV via MCP 9021 (sole writer DB DEV di gelombang ini) | M | S34:B, S30:C | inherit | 3; gate flows: 10 render + latest | batched |
| S36 | docs only: NEW under <task>/verification/ (verified) | M | S35:B, S25:B, S33:B | inherit (verification agent) | 3 | n/a |
| S37 | docs only: NEW under <task>/deploy/ (verified); baca-saja terhadap produksi | M | S36:B | inherit | 3 | batched |
| S38 | docs only: NEW under <task>/verification/ (verified) | M | S19:B, S27:B, S28:B, S29:B, S25:B | inherit (verification agent) | 3 | n/a |
| S39 | docs only: NEW under <task>/verification/ (verified) | M | S37:B, S19:B, S27:B, S25:B | inherit (verification agent) | 3 | n/a |
| S40 | docs only: NEW under <task>/verification/ (verified) | M | S36:B, S37:B, S30:B, S31:B, S32:B | inherit (verification agent) | 3 | n/a |
| S41 | git: index, commit, dan tag repo v2.1 (sole writer) | S | S38:B, S39:B, S40:B | sonnet (mechanical commit and tag) | 3 | batched |
| S42 | NEW under C:/Users/TRIAL (verified parent; gsp-hq-prod-v21-r2 confirmed absent): checkout r2 | S | S41:B | sonnet (run build, report output) | 3 | batched |
| S43 | NEW under C:/Users/TRIAL/gsp-backups (verified parent): folder cadangan; DB klon gsp_agent_hq_v21_seedtest (sole writer); dump produksi baca-saja | M | S42:B | inherit | 3 | batched |
| S44 | NEW under folder cadangan (dibuat S43): log dan render gladi; port 9031 dan port gladi lama; DB klon | M | S43:B | inherit | 3 | batched |
| S45 | docs only: NEW under <task>/verification/ (verified) | S | S44:B | inherit (verification agent) | 3 | n/a |
| S46 | NEW under folder cadangan (dibuat S43): berkas ekspor; DB klon (export, lalu drop) | S | S45:B | inherit | 3 | batched |
| S47 | runtime: port 9011 dan port standby; tanpa suntingan berkas repo | M | S46:B | inherit | 3 | batched |
| S48 | launchers: EXISTS: C:/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh; UNKNOWN - executor declares: watchdog-webui-hq.py (AppData, dilihat dari luar aplikasi) | S | S47:B | inherit | 3 | batched |
| S49 | UNKNOWN - executor declares: config.yaml 5 profil Hermes (AppData, dilihat dari luar aplikasi); gateway Hermes | M | S47:B | inherit | 3 | batched |
| S50 | runtime: DB gsp_agent_hq (sole writer); impor baris S46 | M | S46:B, S47:B, S49:B | inherit | 3 | batched |
| S51 | docs only: NEW under <task>/implementation/; dokumen smoke produksi via MCP 9011 | S | S50:B | inherit | 3 | batched |
| S52 | docs only: NEW under <task>/verification/ (verified) | M | S51:B | inherit (verification agent) | 3 | n/a |
| S53 | UNKNOWN - executor declares: folder skill gsp-studio-write terpasang di Hermes (AppData, dilihat dari luar aplikasi) | S | S50:B, S30:B, S31:B | sonnet (copy files and hash) | 2 | batched |
| S54 | docs only: NEW under <task>/verification/ (verified) | M | S48:B, S52:B, S53:B | inherit (verification agent) | 3 | n/a |

### Shared resources

| Resource | Only writer (per gelombang) | Note |
|---|---|---|
| prisma/seed-studio.ts | S09 (W3), lalu S27 (W7) | B edge S09 -> S27; tidak pernah bersamaan |
| src/lib/studio/engine/front/texts.ts dan fix2-wrapper-text-parity.test.ts | S06 (W2), lalu S13 (W3) | tabel teks tunggal per bahasa (U4) |
| src/lib/studio/services/compose/front.ts | S06 (W2), lalu S14 (W4) | |
| src/lib/studio/engine/docx/wrapper/render.ts | S06 (W2), lalu S15 (W5) | |
| src/lib/studio/engine/bind/format.ts | S07 (W2), lalu S16 (W3) | |
| tests/unit/studio/mcp/implw2-client.test.ts | S10 | S12 menulis uji di berkas sendiri |
| src/lib/studio/engine/lint/structure/checks-d.ts | S18 (W5) | S08 (W6) dilarang menyentuhnya |
| Indeks aturan benchmark/datum_conformance | S20 | S21-S24 hanya menulis modulnya sendiri (stub sudah terkabel) |
| tests/integration/studio/uji-run.mjs + DB gsp_agent_hq_v21_uji | S28 | |
| package.json / package-lock.json | tidak ada | Kebutuhan dependensi = needs-review + keputusan USER (Q-E), lalu satu baris penulis baru |
| DB DEV gsp_agent_hq_v21 | S34 (W8), lalu S35 (W9) | S09/S27 dry-run = 0 tulis |
| Metadata git repo v2.1 | S05 (worktree, W6), S41 (commit/tag, W13) | Baris lain tidak meng-commit |
| DB produksi gsp_agent_hq | S43 (dump baca), S50 (impor), S51 (dokumen smoke) | berurutan lewat B edge |
| DB klon gsp_agent_hq_v21_seedtest | S43 (buat/seed), S44 (gladi + archive), S46 (ekspor + drop) | |
| Port 9031 dan port gladi kode lama | S44 | dicek bebas saat eksekusi |
| Port 9011 dan port standby | S47 | keputusan Q-A |
| Peluncur gsp-ecosystem-start.sh dan watchdog-webui-hq.py | S48 | dari luar aplikasi; EOL dipertahankan |
| Config MCP 5 profil Hermes + gateway | S49 | restart satu per satu (D-589) |
| Folder skill Hermes terpasang | S53 | |
| C:/Users/TRIAL/gsp-hq-prod-v21 (build v2.1 lama = rollback) | tidak ada (baca-saja; sumber .env/certs) | |
| C:/Users/TRIAL/gsp-datacenter | tidak ada | |
| File milik controller | controller | tidak dimiliki baris mana pun |

### Gelombang (dari B edge, plafon 4)

| Gelombang | Baris |
|---|---|
| W1 | S01, S02, S03, S04 |
| W2 | S06, S07, S20, S11 |
| W3 | S13, S16, S09, S21 |
| W4 | S17, S14, S22, S26 |
| W5 | S18, S15, S23, S24 |
| W6 | S10, S12, S08, S05 |
| W7 | S19, S25, S27, S30 |
| W8 | S28, S29, S33, S34 |
| W9 | S35, S38, S31, S32 |
| W10 | S36 |
| W11 | S37 |
| W12 | S39, S40 |
| G1 | persetujuan USER: perubahan produksi |
| W13-W18 | S41, S42, S43, S44, S45, S46 (berurutan) |
| G2 | persetujuan USER: restart |
| W19 | S47 |
| W20 | S48, S49 |
| W21 | S50 |
| W22 | S51, S53 |
| W23 | S52 |
| W24 | S54 |

**Edge C yang dilonggarkan.** S02 dan S03 (C pada S01) berjalan bersama S01; verifikasinya menunggu S01. S26 (C pada S25) dikodekan sebelum kalibrasi selesai.

**Alasan setiap B edge ke gerbang:**
- S34 -> S25: USER meminta skor ada sebelum templat masuk DB, dan hasil kalibrasi bisa mengubah nilai register.
- S34 -> S19: seed DEV memakai kode fase 0 (validasi enum NDA, render EN), dan byte-identitas ID harus sudah terbukti sebelum DB DEV berubah.
- S29 dan S33 -> S19: uji paritas dan matriks cakupan menilai perilaku mesin sesudah fase 0. Bila dinilai sebelum gerbang lulus, hasilnya basi.
- S41 -> S38, S39, S40: USER mewajibkan review keamanan dan review kode senior sebelum produksi, dan temuan "cabang slug/jenis" memblokir produksi (U4).
- S47 -> S46: tukar port hanya sesudah gladi dan ekspor lulus, sehingga gagal gladi berarti produksi tidak tersentuh.
- S50 -> S49: impor data hanya sesudah MCP Hermes memakai kode yang mengunci `latest` (tantangan 1).

### Pernyataan biaya (perkiraan, berlabel perkiraan)

- **Baris:** 54 total = 22 S + 32 M (S24 bertanda M? karena ketersediaan alat PDF belum diketahui). 0 baris L. 0 baris dengan lebih dari 3 cek.
- **Model:** 9 sonnet (S04, S05, S11, S28, S31, S32, S41, S42, S53), 45 inherit. Semua baris agen entri dan agen verifikasi inherit.
- **Gelombang:** 24 gelombang eksekusi ditambah 2 gerbang USER (G1, G2). Terlebar 4 (W1-W9).
- **Jalur kritis:** S02 -> S20 -> S21..S24 -> S25 -> S34 -> S35 -> S36 -> S37 -> S39 -> S41 -> S42 -> S43 -> S44 -> S45 -> S46 -> S47 -> S49 -> S50 -> S51 -> S52 -> S54. Jalur kode S03 -> S07 -> S16 -> S17 -> S18 -> S19 berjalan sejajar dengan sisa 0-1 gelombang.
- **Yang memperpendek:** (1) plafon dinaikkan untuk S21-S24 dalam satu gelombang sesudah S20 (syarat `wave_and_mediation.md` terpenuhi: area terpisah, indeks milik S20), hemat sekitar 2 gelombang; (2) S31/S32 tidak berada di jalur kritis; (3) S43-S46 (cadangan, gladi, ekspor) boleh dijalankan sesudah G1 sementara review keamanan dibahas, asalkan G1 sudah diberikan.
- **Tiga baris termahal:** S24 (pemeriksa bentrok PDF, alat belum pasti), S20 (harness skor), S44 (gladi di luar aplikasi dengan dua instans dan 10 render).
- **Perkiraan usaha:** S sekitar 5-20 menit agen, M sekitar 20-45 menit. Total sekitar 22-26 jam-agen. Waktu dinding sekitar 12-16 jam eksekusi di luar waktu tunggu USER pada G0/G1/G2 dan loop G-FIX. Sekitar 9-11 juta token (perkiraan kasar dari tabel ukuran).
- **Grounding:** EXISTS = 18 baris (semua path diverifikasi dengan Glob/Read sesi ini: texts.ts, front.ts, docx/wrapper/render.ts, html/blocks/device.ts, bind/format.ts, register.ts, derivation.ts, audit.ts, render/pure/render.ts, render/artifact.ts, ingest/checks.ts, lint/structure/checks-d.ts, governance-language.ts, write-client-run.ts, write-client.ts, implw2-client.test.ts, fix2-wrapper-text-parity.test.ts, prisma/seed-studio.ts, uji-run.mjs, tiga dokumen docs/, gsp-ecosystem-start.sh). NEW-under = 11 baris (S20-S24, S26, S29, S42, S43, S44, S46; induk terverifikasi atau dibuat oleh baris hulu). UNKNOWN = 3 baris penuh (S08, S49, S53) + 1 sebagian (S48 watchdog). Sisanya docs only atau runtime.

## Recommendation & Next-Plan Summary

**Urutan gelombang yang disarankan.** Spesifikasi dan sweep (W1), refaktor perilaku-tetap (W2-W3), perubahan fase 0 per bahasa (W3-W6), lalu harness skor dan modul aturan yang berjalan sejajar (W2-W5), gerbang regresi dan kalibrasi (W7), seed dan uji paritas (W7-W8), DEV seed, render, dan gerbang konformitas (W8-W10). Sesudah itu runbook, review kode, review keamanan, dan verifikasi pra-produksi (W11-W12), lalu G1, cadangan, klon, gladi, dan ekspor (W13-W18), lalu G2, tukar kode, repoint MCP Hermes, impor data (W19-W21), smoke dan konformitas produksi, penyegaran skill Hermes, dan verifikasi akhir (W22-W24).

**Risiko utama.**
1. Pembajakan `latest` lewat kode MCP lama di checkout `gsp-hq-prod-v21`. Mitigasi: urutan kode -> MCP -> data, dan RB-1 sebelum RB-2.
2. Regresi byte ID. Mitigasi: baseline S05 dan gerbang S19; bawaan registri tidak diubah.
3. Paritas NOTA (`SLOT_FORBIDDEN_FOR_TIER`). Mitigasi: pembanding = datum-gsp dengan tier NOTA; bila berbeda, dicatat sebagai risiko dan tidak dirancang input baru.
4. `ruleIndex` AUTO ternyata butuh input. Mitigasi: baris berhenti `needs-review`.
5. Tidak ada alat geometri teks PDF terpasang. Mitigasi: S04, lalu Q-E.
6. Kode lama membaca baris bermuatan NDA saat rollback. Mitigasi: cek di S44 dan RB-1 archive.
7. Virtualisasi AppData/HKCU di dalam aplikasi. Mitigasi: semua langkah produksi dan Hermes lewat WMI.
8. Gladi menulis ke workspace produksi. Mitigasi: STUDIO_WORKSPACE_ROOT sementara.
9. Efek samping restart gateway Hermes (pencocokan awalan, D-589). Mitigasi: satu per satu dan diverifikasi.
10. Skor salah kalibrasi (baseline datum-gsp ID di bawah 85 %). Mitigasi: S25 menahan seed sampai controller memutus.
11. Label chart di dokumen EN tetap berformat ID. Ini di luar lingkup kecuali Q-C diputus lain.

**Yang butuh persetujuan USER.** G0 (blueprint ini), G1 (perubahan produksi termasuk 10 dokumen smoke dan penghapusan DB klon), G2 (tukar port, peluncur, repoint dan restart gateway Hermes), serta temuan keamanan CAUTION/FAIL dan dependensi baru bila S24 membutuhkannya.

**Keputusan terbuka.**

| ID | Keputusan | Rekomendasi |
|---|---|---|
| Q-A | Build lama mana yang menjadi standby rollback, dan di port berapa (9041 kini dipakai gsp-datacenter, D-586) | v2.1 3566486 di port loopback bebas yang dicek saat eksekusi; gsp-datacenter 9041 dipensiunkan atau dipertahankan sesuai keputusan USER |
| Q-B | Checkout baru `gsp-hq-prod-v21-r2` dengan repoint MCP Hermes, atau perbarui `gsp-hq-prod-v21` di tempat | Checkout baru (build lama tetap utuh sebagai rollback, sesuai arahan "old v2.1 build stays as rollback") |
| Q-C | Label angka chart di dokumen EN (sekitar 40 modul chart memakai `fmt`) | Tunda ke ronde berikut; matriks cakupan menandainya "sebagian tercakup" |
| Q-D | 10 dokumen smoke produksi: biarkan atau arsipkan (tanpa penghapusan) sesudah S52 | Arsipkan |
| Q-E | Bila tidak ada alat PDF terpasang: tambah dependensi dev (lockfile + review keamanan) atau ukur geometri dari render HTML Chromium | Putus sesudah S04 |
| Q-F | Baris S32 (STUDIO-AGENT-GUIDE.md §3) berada di luar dua berkas yang disebut USER | Pertahankan (panduan lama hanya mencantumkan 3 slug, `research/30` R10) |
| Q-G | Tier bawaan per jenis hasil S01 dari teks manual (D-590 default) | Sajikan tabel S01 ke USER bersama G1 untuk koreksi |
| Q-H | Pecahan issue | Tidak perlu; bila diinginkan, USER mengetik `/to-issues` sendiri |
