---
type: verification
task_slug: doc_artifact_studio
row: SR-58 (S88 diperluas)
agent: verifier
skill: verification-before-completion
date: 2026-10-23
status: needs-review
verdict: VERIFIED-WITH-NOTES
---

# SR-58 Verifikasi menyeluruh akhir: Doc Artifact Studio

## Vonis keseluruhan: VERIFIED-WITH-NOTES

- Semua 14 kriteria SC punya vonis dan bukti, dan tidak ada yang FAIL. Rinciannya: 9 PASS, 3 PASS-DENGAN-KEPUTUSAN-USER (SC-9, SC-11, SC-12 dengan catatan), 1 PASS-SEBAGIAN (SC-10, jalur multipart belum diuji), dan SC-13 PASS dengan catatan.
- Kriteria utama D-17 (benchmark Manual 000) LULUS dengan keputusan USER D-289. Bukti tersimpan `benchmark/out/fixb2/official3`. DOCX-nya direproduksi byte-identik oleh kode saat ini (lihat SC-11).
- Bukti segar pukul 14:11-14:20 WIB semuanya hijau: tsc, eslint, vitest 1999/1999, migrate status, convert_v2 --check, selftest pembanding 35/35, login 200, dan route Studio tanpa sesi 401.
- Catatan yang menahan status `needs-review`:
  - Satu temuan HIGH lama masih terbuka: F-055 (FIX-2), yang memang dijadwalkan ke loop sesudah SR-58.
  - Dua sub-kriteria §7 belum terbukti: `datum_lint.py` VERDICT PASS dan lint HTML 37.
  - Reklasifikasi §7.3 menjadi DIAGNOSIS diputus controller, bukan user.
  - Delta sesudah pukul 10:05 belum direview ulang secara independen.
  - Lima butir masih menunggu keputusan user.

## 1. Lingkup verifikasi

| Butir | Isi |
|---|---|
| Kriteria | SC-1..SC-14 (`identification/05_structural_sections_blueprint.md:979-996`); §7.1-§7.3 (`identification/02_structured.md:427-460`); pemetaan baris F2 (`05:706`, `05:799`, `05:1042`); permintaan USER di `identification/04_structural_sections_original.md` dan baris "User" di `decisions/decisions.md` |
| Dibaca | Blueprint 05, 02 §7, intake 04, decisions (D-17, D-119, D-123, D-127, D-128, D-131, D-139, D-140, D-153, D-158, D-161, D-242, D-245, D-247, D-251, D-255, D-257, D-261, D-289..D-304), `findings/findings_register.md`, `delegation_progress/integration_backlog.md`, laporan `test/{01,03,06,07,08,09,11,12,13,14,15,16,17}`, `gateway_check/{07,08,08b,09,09b,10,10b}`, `review/document_review_doc2*.md` |
| Bukti tersimpan yang diperiksa langsung | `benchmark/out/fixb2/official3/{compare/bm_report.json,run_summary.json,run_report.md}`, `tests/integration/studio/out/{00_suite_run.log,32_v21_recon_readonly.log}`, `tests/e2e/studio/out/session/{results.json,console.json}`, `tests/perf/out/sr54/probe/{m000,m000e}/`, kode `src/**`, `prisma/migrations/**`, `prisma/rollback/**` |
| Tidak dijalankan ulang (sesuai brief) | benchmark, paritas, E2E, integrasi DB, kinerja |
| Batasan | VERIFY-ONLY: tidak ada kode atau dokumen lain yang diubah. Satu efek samping perlu dicatat: `npx vitest run tests/unit/studio` ikut menjalankan `tests/unit/studio/api-structure/**`, yang menulis fixture ber-RUN_ID ke DB `gsp_agent_hq_v21` lalu membersihkannya sendiri (asersi sisa 0, `test/14_api_structure.md` §1). Suite lulus, jadi asersi pembersihan juga lulus |

## 2. Bukti segar (dijalankan verifier, 2026-10-23)

| # | Perintah | Keluaran (dikutip) | Vonis |
|---|---|---|---|
| E1 | `npx tsc --noEmit -p .` | keluaran kosong, `EXIT=0` | PASS |
| E2 | `npx eslint src/lib/studio src/app/api/studio src/components/studio src/app/studio` | keluaran kosong, `EXIT=0` | PASS |
| E3 | `npx vitest run tests/unit/studio` | `Test Files  61 passed (61)` / `Tests  1999 passed (1999)` / `Start at 14:11:26` / `EXIT=0` | PASS |
| E4 | `npx prisma migrate status` (URL disaring) | `Datasource "db": PostgreSQL database "gsp_agent_hq_v21", schema "public" at "localhost:5433"` / `7 migrations found in prisma/migrations` / `Database schema is up to date!` / `EXIT=0` | PASS |
| E5 | `npx tsx benchmark/extract/convert_v2.ts --check` | `SAME benchmark/manual000/doc.v2.json sha256=79290e07…`, `SAME …template.v2.json sha256=882057c5…`, `SAME …datum-manual-000.preset.json sha256=a951b149…`, `"symbolGlyphs":"■◈◇△σ○≥≤→"`, `"dropped":{…"symbolGlyphRuns":42…}`, `EXIT=0` | PASS |
| E6 | `<venv hermes>\python.exe -I -B scripts/parity/compare/selftest_compare.py` (interpreter bawaan repo `scripts/parity/run/lib/python.ts:14`) | `selftest_compare: 35/35 lulus`, `EXIT=0` | PASS |
| E7 | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9021/login` | `200` | PASS |
| E8 | curl tanpa sesi: GET `/api/studio/{templates,documents,artifacts}`; POST `/api/studio/documents/x/render`, `/api/studio/chapters`; POST `/api/studio/documents` dengan `x-internal-secret: wrong` | semuanya `401`; badan `{"error":"Unauthorized"}` | PASS |
| E9 | `sha256sum` official3 dan probe SR-54 | official3 DOCX `952f65d63c77f615…`; `tests/perf/out/sr54/probe/m000e/…RevA.docx` (13:53:47) `952f65d63c77f615…` (identik). `find src prisma benchmark/harness benchmark/manual000 scripts/parity -newer <docx m000e>` = kosong | PASS (official3 dapat direproduksi oleh kode saat ini) |
| E10 | Migrasi `prisma/migrations/20261023200000_add_studio_structure/migration.sql` | `DROP: 0`; 9 `CREATE TABLE` (StudioTemplateSlot, …SlotParam, …SlotRoleFormat, StudioAsset, StudioDocSection, StudioDocChapter, StudioDocSubsection, StudioDocBlock, StudioDocIdentity); 3 `CREATE TYPE` (StudioSlotContentMode, StudioRenderScopeKind, StudioCompleteness); `ALTER TABLE` hanya pada tabel `Studio*` | PASS |
| E11 | Hitung statis `ESSENTIAL_KNOBS` (`src/lib/studio/registry/essentials.ts:185-568`) | total 30; global 8, chapter 7, cover 7, appendix 3, toc 2, controlSheet 1, signatureBlock 1, sourceRegister 1; `ESSENTIAL_MAX_PER_GROUP = 8`, `ESSENTIAL_MAX_TOTAL = 60` (`:182-183`) | PASS |
| E12 | Pemeriksaan HTML Manual 000 tersimpan (`tests/perf/out/sr54/probe/m000e/…RevA.html`) | `script=0`, src/href `http(s)://` = 0, CSP `default-src 'none'; script-src 'none'; …` | PASS (sebagian §7.3 HTML) |

## 3. Tabel kriteria SC-1..SC-14

| SC | Kriteria | Vonis | Bukti |
|---|---|---|---|
| SC-1 | Migrasi aditif | PASS | E10 (0 DROP, 9 tabel + 3 tipe `Studio*`); E4 (up to date). Hitungan tabel lama: `test/08_rollback_rehearsal.md` T8 `tabel dibandingkan=53 hitungan beda=0`; §3 35 tabel non-Studio identik hitungan + md5. Gladi runbook: §9 `53/53 md5 identik` |
| SC-2 | Cakupan parameter | PASS | `tests/unit/studio/structure/params-surface.test.ts:171` (`K 403, T 400, SURFACE 403, PRESET 403, SCOPE 422`); `tests/unit/studio/api-structure/templates.test.ts:176-183` (`422 SLOT_PARAM_SCOPE_INVALID`); keduanya ikut E3 |
| SC-3 | Kerangka templat | PASS | `test/01_integration_db.md` F2 (`kanonik v6, gsp v2, manual-000 v3; 3/3 guard ok`); E2E `results.json` K.4 `HTTP 201 versi=1:396a4ad1,2:396a4ad1,3:232a3305` (versi lama tetap); K 403 / T 400 di `params-surface.test.ts:171`; PRESET_READONLY di `templates.test.ts:78-91` |
| SC-4 | Validasi struktur | PASS | `test/13_unit_structure.md` §2: `slot-rules.test.ts` 34 kasus (10 SLOT_* + BLOCK_TYPE_NOT_ADMITTED + CHAPTER_KEY_INVALID, negatif + positif) dan `error-codes.test.ts` 52; lulus di E3 |
| SC-5 | DB ternormalisasi, sha rekonstruksi | PASS (catatan M-6) | `tests/integration/studio/out/00_suite_run.log`: `Tests  25 passed \| 1 skipped (26)`; F8 15/15 (`test/01:11`); v21 baca-saja `32_v21_recon_readonly.log` (`OK 000 r1..r5 … exp = act`); `skeleton-reconstruction.test.ts` (SC-5 + 2 negatif) lulus di E3 |
| SC-6 | Kompatibilitas mundur | PASS (catatan M-6) | `test/01:13` (F5: DOCX/HTML byte-identik + tanda isi PDF 4/4 revisi lama); F3 backfill idempoten (`test/01:49-52`); `adapt-v1.test.ts` 37 kasus termasuk 4 fixture paritas v1 (E3) |
| SC-7 | Kiriman parsial (D-128) | PASS | E2E U1.1 `HTTP 201 … rev=1 scope=create;chapter:3`; U1.2 `HTTP 200 unchanged=true rev=1`; U1.3 `HTTP 201 rev=2 scope=chapter:3`; U1.4 `{"address":"3.2.3",…"type":"image","artifactLabel":"Gambar 3.1"}`; U1.8 render bab draf `job=SUCCEEDED draft=true`; integrasi F7 `changedAddresses 8 alamat 3.x saja` (`test/01:63`) |
| SC-8 | Paralel + kelengkapan (D-131) | PASS | U2.1 `bab3 HTTP 201 rev=4 rebased=true; bab5 HTTP 201 rev=3`; U2.5 `HTTP 409 code=DOCUMENT_INCOMPLETE`; U2.6 `forwardToController="Dokumen 002/GSP/KT/X/2026 … belum lengkap …"`; U1.1b kelengkapan ada di respons; SCOPE_CONFLICT 409 (`test/01:63`; `src/lib/studio/contract/errors.ts:87,91`) |
| SC-9 | Baca + sunting per pid | PASS-DENGAN-KEPUTUSAN-USER (D-247) | U3.5 GET content pid sama; U3.6 PATCH `pid tetap, alamat 3.2.2`; U3.8-U3.9 geser `addressMap`, pid ikut; U1.5 paragraf menjadi gambar (pid diwarisi). Butir "sunting memicu render penuh" diganti D-247 USER ("Hanya endpoint"): U3.7 PATCH ber-`render` menghasilkan 400; U3.11 render penuh lewat endpoint `200 SUCCEEDED draft=false`; E.edit.2 UI `PATCH=200 … render=200` |
| SC-10 | Aset | PASS-SEBAGIAN | `api-structure/assets.test.ts:35` (201, lalu ulang 200 `created:false`, idempoten), `:60,:75` 413, `:82` 415, `:100` 422, `:91` assetRef ke aset menghasilkan `Gambar 3.1`; E2E U1.0 `HTTP 201`. **Jalur multipart belum diuji** (M-5) |
| SC-11 | Benchmark D-17 | PASS-DENGAN-KEPUTUSAN-USER (D-289) | `official3/compare/bm_report.json`: BM1 `pct 100.0 (4544/4544)`; BM2 `pages 102/102, chapters 17/17, appendices 4/4, tables 151/151, figures 52/52`; BM3 `pagesIdentical 99 of 102, pagesDiffering [18,19,20]` (mentah `pass:false`; diterima USER D-289: hlm 18 F-033, hlm 19-20 K-2/D-257); BM4 `ssimMean 0.96707`. `run_summary.json`: `"figures":"engine","figureFallback":"none"`, `figureSources {"mesin":15,"raster":37,"missing":0,"engineKindsNotFromEngine":0}`. Reproduksi kode kini: E9 |
| SC-12 | Security | PASS (catatan M-2, L-1) | S87 CAUTION disajikan, USER memutus "Perbaiki semua" (D-123). SR-57 siklus 1 CAUTION disajikan, USER memutus "Perbaiki semua" (D-247). F-068 CAUTION, USER memutus "Perbaiki" (D-251). SR-57 siklus 2 `Vonis: PASS. 0 High, 0 Medium, 4 Low baru` (`gateway_check/10b_security_rerun2.md:14`). Tidak ada FAIL |
| SC-13 | Kontrak bebas tampilan (§0) | PASS (catatan L-3) | `display-field.test.ts` 167 kasus DF-01..DF-71 dan `render-field.test.ts` 13 (`test/13` §2), lulus di E3. grep `doc.v2.json`: `setup/format/layout/style/faceRole/fontSize/font/color/render/params/overrides/roleFormats` = 0. Glif dideteksi mesin (E5: `symbolGlyphRuns` agen dibuang 42, `symbolGlyphs` mesin) |
| SC-14 | Permukaan parameter ringkas | PASS | E11 (30 ≤ 60; maksimal 8 per lingkup, yaitu global 8). Payload registri `kind=essentials` memuat `maxPerGroup/maxTotal/withinLimits` (`src/app/api/studio/registry/route.ts:190-205`). E2E T.1 `Halaman:3, Tampilan:2, Isi:3`; T.2 USER `summary lanjutan=0`; T.5 ADMIN `lanjutan=1 open=[false]`; `templates.test.ts:113-121` 403 PARAM_SURFACE_FORBIDDEN; migrasi nilai efektif `test/01:48` F2 (`proyeksi 723 kunci = 38c776de… = paramsSha256 v5`); hitungan per lapis di `research/09_param_surface_design.md` |

## 4. Kriteria §7 (`02_structured.md`)

| Kode | Vonis | Bukti |
|---|---|---|
| BM-1..BM-4 | sama dengan SC-11 | `official3` (§3). SSIM per figur 18 halaman: `bm_report.json BM4.perFigure`, `inputs.figurePages` 18 halaman |
| BM-0 lingkungan | PASS (bukti lama + run resmi) | `run_summary.json` `notReady []`, langkah `pdf OK (engine/soffice)`; kalibrasi konfigurasi B 101/102 SSIM 0,9815 (D-28) dan perbaikan registri fon (D-35) |
| 7.2-1 templat sedetail manual | PASS-DENGAN-KEPUTUSAN-USER (D-140) | Hitungan "tepat 673 ParamDef" digantikan permukaan berlapis (D-140; registri kini 784 kunci, IP-70). Ubah membuat versi baru (K.4). Turunan grid/lebar figur: SR-56b H1 TERTUTUP, probe 8/8 (`09b:35`). K 403 USER (`params-surface.test.ts:171`) |
| 7.2-2 JSON ke keluaran | PASS-DENGAN-KEPUTUSAN-USER (D-247) | Build hanya lewat R17 (D-247): U1.8/U3.11 DOCX+PDF; HTML (E12); SVG/PNG figur (`official3/figures/`); Manual 000 dari doc + templat (official3) |
| 7.2-3 section | PASS (bukti sebagian) | Registri 51 (`src/lib/studio/registry/sections.ts:2,5`); Manual 000 terpetakan (BM1 100%); D16 SERAH tetap FAIL bila perangkat dimatikan (D-302). Render 29 jenis section tidak diulang di fase akhir |
| 7.2-4 penyimpanan per misi | PASS-SEBAGIAN | sha disk = DB (`test/01:45` F1 `4/4 SUCCEEDED, disk = DB`); unduhan PDF sha cocok header (U3.12). Tampilan folder misi di `GET /api/information-library` tidak dibuktikan di fase akhir |
| 7.2-5 alamat + revisi | PASS | `tests/unit/studio/api/revisions.test.ts:3` (PATCH tanpa apa/mengapa/dampak menghasilkan 400) dan `http-errors.test.ts:33-34` (E3); PATCH menghasilkan n+1 (U3.6 rev=10); render ulang revisi lama identik (`test/01` F5/F8) |
| 7.2-6 agen POST + standar | PASS | E8; SR-57 `17 route x GET/POST tanpa sesi = 401` (`10_security_rerun.md:28`); satu gerbang `BY_CONSTRUCTION_FAILED` 422 (`10b:31`); panduan `docs/STUDIO-AGENT-GUIDE.md`; skema lewat registri `kind=schema` (`registry/route.ts:80`) |
| 7.2-7 port + paritas | PASS-SEBAGIAN | Harness berjalan untuk semua format (SR-46/47/48/50; FIX-H D-303; E6 35/35). **`datum_lint.py` VERDICT PASS atas DOCX Node TERBIT/SERAH tidak dibuktikan** (M-3) |
| 7.3 DOCX | PASS-DENGAN-KEPUTUSAN-CONTROLLER (D-120, wewenang D-18) | `test/15` ringkasan: 8/8 DIAGNOSIS, Node-Node dan acuan-acuan 0 cek gagal 16/16, sha Node 8/8 deterministik. `datumcheck.py` A2-A5 / `datum_lint.py` tidak dibuktikan (M-3) |
| 7.3 PDF | PASS-DENGAN-KEPUTUSAN-CONTROLLER (D-299 PD-1) | `test/03` ringkasan: mentah §7.3 `FAIL 9/9`; kontrol mesin sama 18/18 (teks 100%, SSIM 1,0); `datum_figur.py` 0 cacat 18/18; Plex tertanam; BM4 0,96707 lawan PDF NAS |
| 7.3 HTML | PASS-SEBAGIAN | E12; `tests/unit/studio/renderers/html-css-csp.test.ts:51,56` (CSP `connect-src 'none'`, tanpa `<script`). Lint 37 (luapan A4) dan pemindai teks tidak dibuktikan di fase akhir (`test/03:79` "Kelas HT tidak diuji") |
| 7.3 SVG diagram + simbol | PASS-DENGAN-KEPUTUSAN-USER (D-242) | `test/16` ringkasan: simbol 45/45 (geometri 0,0, SSIM 1,0), fit 4/4; diagram kelas D-242 9 PASS, `dg_rack` FAIL pra-ada (DATUM-32, identik Python, IP-81), `dg_layered_good` 422 disengaja (D-137) |
| 7.3 PNG diagram | PASS-DENGAN-KEPUTUSAN-CONTROLLER (di bawah D-242 USER) | D-303: toleransi PNG DG 4 px pada kelas D-242 resmi (`compare_dg_d242.py`) |
| 7.3 chart | PASS-DENGAN-KEPUTUSAN-CONTROLLER (D-296, D-303) | Sesudah FIX-H: 46/46 DIAGNOSIS/PASS; P-01/P-02/P-11/W-02 berlabel DIAGNOSIS "F-007 px/pt acuan"; lint saja 12/12 (`test/17` ringkasan). Laporan `test/17` masih memuat angka mentah 52/58 (M-1) |
| S81 (ambang asal) | PASS | `test/07` ringkasan: dokumen 32 hlm p95 12.910 ms < 60 s; figur p95 3.404-3.895 ms < 5 s |
| SR-54 bab 15 s | PASS-DENGAN-KEPUTUSAN-CONTROLLER (D-304) | Job p95 14.557 ms LULUS; wall CLI p95 15.919 ms gagal tipis. Metrik "waktu job" diputus D-304 |

## 5. Pemetaan baris F2 asli ke SR

| F2 | SR | Laporan | Status akhir |
|---|---|---|---|
| S75 | SR-49 | `test/01_integration_db.md` | complete, rerun D-275 `25 passed \| 1 skipped` (log 10:06) |
| S77 | SR-50 | `test/03_parity_pdf.md` | diterima D-299 (PD = DIAGNOSIS, kontrol mesin sama 18/18) |
| S80 | SR-52 | `test/06_e2e_session.md` | `results.json` 13:05 `pass 94 / total 95`; gagal hanya A14.1 sidebar HQ (F-073, di luar lingkup). Laporan md masih 87/95 (M-1) |
| S81 | SR-54 | `test/07_performance.md` | diterima D-304 |
| S82 | SR-53 | `test/08_rollback_rehearsal.md` | complete (gladi §1.4 + runbook §9) |
| S88 | SR-58 | berkas ini | VERIFIED-WITH-NOTES |
| S98 | SR-51 | `test/09_benchmark_manual000.md` | Run lulus = `benchmark/out/fixb2/official3` (D-293). Laporan md masih memuat official2 FAIL (M-1) |

## 6. Permintaan USER: terpenuhi + bukti

| Permintaan (sumber) | Vonis | Bukti |
|---|---|---|
| Konsep konten saja (D-139, D-119) | Terpenuhi | SC-13; `doc.v2.json` tanpa medan tampilan (catatan L-3) |
| Struktur slot yang dapat dikonfigurasi: kerangka/indeks/tanda tangan/konten/referensi (04; D-127) | Terpenuhi | Tabel slot (E10); K.1 `7 bagian, Sampul posisi tetap`; SC-3 |
| DB ternormalisasi sampai per paragraf (04; D-127 (2)) | Terpenuhi | E10 (StudioDocSection/Chapter/Subsection/Block/Identity); SC-5 |
| Bab 3 misi A + posisi gambar (04; D-128) | Terpenuhi | U1.3-U1.6, U1.9 `idx(3.2.2)=244 idx(Gambar 3.1)=294 idx(3.2.4)=388` |
| Kiriman parsial paralel + pesan jelas ke controller (04; D-131) | Terpenuhi | SC-8 (U2.1, U2.5, U2.6) |
| Sunting per pid (04; D-131 (6)) | Terpenuhi | SC-9 (U3.5-U3.10) |
| Render hanya lewat endpoint (D-247) | Terpenuhi | `contract/schema/v2/forbidden.ts:185` `RENDER_FIELD`; U1.7, U3.7 400; `10b:39` (grep pemanggil render: hanya R17 + R07 eksplisit) |
| Ukuran kertas (D-158) | Terpenuhi | `essentials.ts` EK-G01 `page.size` {A4, A3, A5, Letter, Legal, F4}; T.3 kenop "Ukuran kertas"; SR-56b H1 TERTUTUP probe 8/8 |
| UI ramah (D-161) | Terpenuhi, dengan sisa di luar lingkup | E2E 94/95; axe Studio 0 serius (D-297); sisa A14.1 = sidebar HQ (F-073, menunggu user) |
| Penyederhanaan parameter (D-140) | Terpenuhi | SC-14 |
| Dokumen baru = salinan templat dengan data kosong (D-153) | Terpenuhi | `test/01:58` F7 `201, 004 rev 1 INCOMPLETE` (dokumen kosong berkerangka); U1.1b `missing=[controlSheet, signature, content:1, content:2]` |
| Ambang benchmark (D-17) + BM3 (D-289) | Terpenuhi dengan keputusan user | SC-11 |

## 7. Keamanan: CAUTION/FAIL dan butir yang menunggu user

Semua CAUTION sudah disajikan ke user dan diputus "perbaiki": D-123 (S87), D-247 (SR-57 siklus 1, termasuk N-01 dan F-065), dan D-251 (F-068). Tidak ada risiko CAUTION/FAIL yang diterima tanpa user. SR-57 siklus 2 = PASS.

Masih menunggu user:

| ID | Pokok | Bukti |
|---|---|---|
| F-072 / S2-04 | Kuota aset lunak + ember agen internal bersama (Low). Ditandai "diterima controller D-255", yang bertentangan dengan D-19 | `findings_register.md` F-072 "menunggu user"; `10b` S2-04 "diterima controller D-255, bukan user" |
| F-073 | Kontras sidebar HQ 2,35:1 (di luar lingkup Studio) | `results.json` A14.1 `color-contrast(serious,7)` W1-W9; D-297 |
| IP-75 | Berkas yatim `components/studio/playground/rail-summary.ts`, dihapus hanya dengan izin user | `integration_backlog.md` IP-75 "menunggu user" |
| F-034 | Lisensi fon: RFN "Plex" pada wajah modifikasi, distribusi ke luar | `findings_register.md` F-034 KEPUTUSAN-USER |
| D-304 | Proses yatim (`find.exe`, `python -`): penghentian ditolak pengklasifikasi izin dan dilaporkan ke user | `decisions.md` D-304 |

## 8. Temuan (celah berbukti) per keparahan

### High

| ID | Temuan | Bukti | Pemilik |
|---|---|---|---|
| H-1 | F-055 (S83 H1): teks bawaan pembungkus HTML berbeda dari DOCX di 4 tempat. Belum ada baris FIX-2 yang dijalankan, dan statusnya pada kode kini belum diverifikasi ulang | `findings_register.md` F-055 "DIJADWALKAN"; `05:704` "belum diluncurkan"; `05:955` B9 (loop sesudah SR-58); tidak ada `delegation_progress/coder_execution_fix2.md` | FIX-2 (loop B9) |

### Medium

| ID | Temuan | Bukti |
|---|---|---|
| M-1 | Laporan fase akhir tidak mencerminkan keadaan final: `test/09` (official2 FAIL; run lulus official3 hanya di D-293), `test/06` (87/95 lawan `results.json` 94/95), `test/17` (52/58 lawan FIX-H 46/46), `test/12` (needs-review 432/1) dan `test/14` (needs-review 129/3) lawan E3 1999/1999 | §5; header masing-masing laporan |
| M-2 | Delta sesudah review 10:04-10:05 (SR-55b, SR-56b, SR-57 siklus 2) belum direview kode/security independen. Delta itu: FIX-S2 10:25 (gerbang hak R08 S2-01/S2-03), FIX-A2 10:20, FIX-Z 12:54, FIX-B2 12:54, FIX-U2 13:08, FIX-C2 13:20, FIX-SERAH 13:28. Cek kode singkat: S2-03 `validate/route.ts:50-55,439-440`, S2-01 `template-draft.ts:200` (ada, belum diuji dinamis oleh reviewer) | `ls` mtime `delegation_progress/coder_execution_fix*.md`; `gateway_check/{08b,09b,10b}` 10:04-10:05 |
| M-3 | §7.2-7 (`datum_lint.py` VERDICT PASS untuk TERBIT/SERAH) dan §7.3 DOCX (`datumcheck.py` A2-A5) tanpa bukti fase akhir | grep `datum_lint` di `test/`, `gateway_check/`, `delegation_progress/` hanya cocok di `coder_execution_fixl.md`, `_s44.md`, dan JSON baseline; tidak ada VERDICT atas DOCX Node |
| M-4 | Kriteria §7.3 (DOCX D-120, PDF D-299 PD-1, chart CA D-296/D-303, PNG DG 4 px) diturunkan menjadi DIAGNOSIS oleh controller (wewenang D-18). Tidak ada baris "User" yang menyajikannya ke user | `decisions.md` D-120, D-296, D-299, D-303 (kolom "Controller") |
| M-5 | SC-10: jalur unggah multipart R18 belum diuji (hanya JSON base64) | grep `multipart\|FormData` di `tests/e2e/studio`, `tests/unit/studio`, `tests/integration/studio` = 0 berkas; `test/14` §1 "Unggahan multipart R18 tidak diuji" |
| M-6 | Suite integrasi DB (SR-49, log 10:06) sudah lebih tua dari FIX-S2/FIX-Z/FIX-SERAH. SC-5/SC-6 pada kode kini hanya didukung tidak langsung: uji unit SC-5 (E3) dan DOCX M000 v2 yang identik (E9). Selain itu FIX-SERAH sengaja mengubah DOCX v2 berslot opsional kosong (D-302), sehingga render ulang revisi v2 lama sesudah perubahan mesin tidak lagi byte-identik dengan render aslinya | `tests/integration/studio/out/00_suite_run.log` (10:06); D-302 |

### Low

| ID | Temuan | Bukti |
|---|---|---|
| L-1 | F-072 diterima controller (D-255) sebelum diputus user; kini berstatus menunggu user | §7 |
| L-2 | Register/backlog basi. F-047, F-053, F-056, F-057 masih "DIJADWALKAN" padahal ditutup D-102/D-134/D-240/D-129. IP-69 "terbuka" padahal `prisma/rollback/01_rollback_studio_structure_delta.sql` dan `02_rollback_studio_base.sql` ada dan sudah digladikan (`test/08` §9). `status_tasks.md` terakhir 07:58 | `ls prisma/rollback/`; `findings_register.md`; `integration_backlog.md` IP-69 |
| L-3 | `doc.v2.json` akar `/x/figures` memuat 52 entri `widthMm/heightMm/cx/cy/placement` (provenans harness). Akar `x` diizinkan skema (`contract/schema/v2/doc.schema.ts:45`) dan tidak dibaca mesin (grep `x.figures` di `src/` = 0). Secara harfiah belum "tanpa medan tampilan" | skrip pemindai JSON verifier: 104 kemunculan, semuanya `/x/figures/*` |
| L-4 | §7.3 HTML: lint 37 (luapan A4) dan pemindai teks tidak dibuktikan di fase akhir | `test/03:79` |
| L-5 | Risiko laten terbuka: S2-02 (IP-68), IP-67 (ember agen), IP-81 (`dg_rack` DATUM-32) | `10b` §3; `integration_backlog.md` |
| L-6 | §7.2-4 tampilan folder misi di `GET /api/information-library` dan §7.2-3 render 29 jenis section tidak diulang di fase akhir | grep `information-library` di `test/*.md` = 0 |

## 9. Catatan remediasi (untuk controller; verifier tidak memperbaiki)

1. H-1: jalankan FIX-2 (loop B9), atau verifikasi ulang empat titik F-055 pada kode kini, lalu tutup register dengan bukti.
2. M-2: review kode + security singkat atas delta sesudah 10:05 (FIX-S2, FIX-U2, FIX-Z, FIX-SERAH, FIX-C2, FIX-A2, FIX-B2). Tambahkan uji permanen untuk N-01 (I-1 `10b`) dan untuk gerbang R16/R06/R14 (N6 `08b:65`).
3. M-3/L-4: jalankan `datum_lint.py` (VENV hermes `-I`) atas DOCX Node fixture TERBIT/SERAH, juga `datumcheck.py` A2-A5 dan lint 37 HTML, lalu kutip VERDICT-nya.
4. M-4: sajikan ringkasan reklasifikasi §7.3 menjadi DIAGNOSIS ke user, lalu catat keputusannya.
5. M-5: tambahkan uji multipart R18 (201, ulang 200, 413 byte, 415 magic bytes).
6. M-6: jalankan ulang `node tests/integration/studio/uji-run.mjs suite` pada kode final sebelum commit S89.
7. M-1/L-2: mutakhirkan `test/09`, `test/06`, `test/17`, `test/12`, `test/14` (atau tambahkan adendum), register temuan, dan backlog IP-69.

## 10. Langkah berikut

- Controller menyajikan lima butir di §7 dan M-4 ke user lewat AskUserQuestion.
- Loop perbaikan B9 (maksimal 3 siklus per kriteria): H-1, M-2, M-3, M-5, M-6.
- Commit lokal S89 sesudah butir di atas diputus. Pohon kerja kini belum di-commit: `git status --short` 43 entri, HEAD `0f32367`.
