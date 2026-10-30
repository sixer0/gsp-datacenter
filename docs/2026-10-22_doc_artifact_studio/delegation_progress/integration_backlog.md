# Backlog pass integrasi (controller) — sambungan antar-baris setelah G1

Penulis: controller. Setiap butir menjadi baris integrasi IP-nn dengan pemilik area eksklusif. Sumber: findings_register, file_requests, decisions.

| ID | Area pemilik | Isi | Sumber |
|---|---|---|---|
| IP-01 | `services/render` + `services/storage` | Bug MIME HTML: keluaran HTML gagal `FILE_MISSING_ON_DISK` "invalid mime" (job PARTIAL nyata) — selaraskan daftar MIME/ekstensi; uji asap render DOCX+PDF+HTML | F-032 (MAYOR) |
| IP-02 | `benchmark/manual000/figures/**` (S94) + `engine/diagram/build` (S30) | (a) `bm-fig-23` (DATUM-35) dan `bm-fig-38` (DATUM-24) gagal dibangun; (b) panel galeri memakai kunci params PENDEK (`sort`, `upColour`, `labelsBothSides`, …) yang diabaikan renderer → ubah ke kunci penuh `chart.kind.<KODE>.<nama>` untuk SEMUA 58 panel; (c) P-06 `sort: "natural"`, P-11 `chart.zeroBaseline=false`; validasi ulang `validate_figures.ts` + render asap setiap panel | F-025 (MAYOR), D-63, D-77 |
| IP-03 | `engine/docx/assemble` (S20) | Permintaan S18: penamaan media seragam `fig-<sha32>`, tanda tangan di dalam lembar kendali, paragraf pemisah seksi per unit; pakai `pPrInner`/`rPrXml` bila perlu | F-027, D-66 |
| IP-04 | `services/render` (S51) | Adopsi kode galat baru `RENDER_FAILED`/`STORAGE_WRITE_FAILED`; `lintRenderedWith(renderLintLimitsFromParams(tpl.params))`; `applyDocOverrides` (parameter render = ingest); `readImageAsset` S53 | F-030, D-52, D-63, D-64, D-61 |
| IP-05 | `engine/browser` (S25), `engine/html/assemble` (S24) | Adopsi `BROWSER_UNAVAILABLE`, `HTML_RENDER_FAILED` | F-030 |
| IP-06 | `services/ingest` (S48), `engine/lint/scan` (S44) | Keputusan 422 memakai `isIngestBlocking` S46 (override penegakan) | D-70 |
| IP-07 | kontrak (S03-d2) | ParamDef `lint.enforcementOverride`; kode galat FORBIDDEN generik (S102 memakai UNAUTHORIZED untuk 403); selaraskan `01_specs.md` §5.7, §6.3, §8.1, §8.2 I40 | D-70, D-72, F-030 |
| IP-08 | `src/lib/studio/http/` (baru) + route S54-S57, S102 | Satukan helper route (batas body, log JSONL, pemetaan galat, correlation id) | F-024 |
| IP-09 | `src/app/api/studio/client-log` (baru) + helper klien UI | Endpoint log galat klien; UI S58-S62/S100-S102 memakainya | F-031 |
| IP-10 | `src/app/api/studio/validate` (S55) + `template-preview` (S101) | Medan `roleFormats` di body validate; pane meneruskan draf | F-028 |
| IP-11 | `src/app/api/studio/artifacts/_lib/dto.ts` (S57) | Tambah `chartCode` ke item daftar artefak (filter galeri S62) | permintaan S62 |
| IP-12 | `prisma/seed-studio.ts` (S70) | Seed membandingkan kanonik terbaru / `ensureCanonicalTemplate`; impor templat `datum-manual-000` ke DB v21 | F-029, D-63 |
| IP-13 | `engine/docx/wrapper` (S18) + `benchmark/manual000/template.json` | Rotasi 90° string punggung; profil benchmark `device.spine.placements` tanpa "pembatas"; satukan parser markup pembungkus dengan `parseMdLite` | F-026, F-027 |
| IP-14 | `engine/diagram/layout-c` (S29) | Multi-bus sld di balik parameter (default = Python) + tolak eksplisit | F-022 |
| IP-15 | `engine/docx/tables` (S17) | Satukan `ooxml.ts` dengan `package/xml.ts` S14 | D-51 |
| IP-16 | `src/lib/studio/assets/fonts` | Teks lisensi OFL (Plex, Inter) + lisensi DejaVu/Bitstream Vera | F-017 |
| IP-17 | `src/app/**` lama (6 berkas) | 21 galat tsc pra-ada | F-014 |
| IP-18 | `tests/unit/agent-roster.test.ts` | 4 test lama gagal | F-004 |
| IP-19 | `prisma/schema.prisma` + `docs/ARCHITECTURE.md` | Model `WorkerTrace` hasil introspeksi + baseline migrasi tanpa DROP; mutakhirkan dokumen | F-003 |
| IP-20 | `engine/docx/fonts` (S15) | ADOPSI docx-embed S99: bila profil `boldFace: "semibold"`, tanam wajah SemiBold yang DIBERI NAMA keluarga yang diminta (gaya Bold, weight 700) dari `render-env/semibold-bundle/fonts/renamed/` (atau bangun saat runtime dengan aturan yang sama) — bukan berkas SemiBold asli; `.gitignore` `/render-env/semibold-bundle/out/` | F-001, D-74 |
| IP-21 | Controller | Hentikan dev server sisa `next dev -p 3217` | D-70 |
| IP-22 | Controller | Bersihkan data uji di DB v21 sebelum fase final: dokumen `cmvju4s5e0001v1eotkl4womc`, `cmvjugnl00001v170gct9wfj0` (nomor 001/002), 1 artefak P-01, job/berkas terkait, berkas di `data/studio-workspace`; atau biarkan dan pakai DB uji `gsp_agent_hq_v21_uji` (KT-04) untuk S75 | F-035 |
| IP-23 | kontrak (S03-d2) + `services/templates` (S49) + `template-editor` (S58) | Medan opsional `order` di `SectionPlan` (urutan antar-status hilang saat muat ulang); registri mengekspor daftar wajib per tier (S59 menyalin `CANONICAL_REQUIRED_BY_TIER`); S58 membaca `?paramFilter=` | permintaan S59 |
| IP-24 | `services/ingest` (S48) | Diagnosis: `resolvedParams["doc.typeCode"]` kanonik v2 memuat STD tetapi ingest menolak STD (daftar P3-20 KT..DS) — kemungkinan ingest memakai daftar statis/registri lama; selaraskan ke parameter templat yang di-resolve | F-036 |
| IP-25 | `engine/chart/core` (S32) + `registry/charts.ts` (S09) + resolusi params di `engine/chart/family-*/**` (hanya bagian alias) | Lint DATUM-26 menghitung subjek per `data-accent-group` (bukan per `series#index`) dan melewati sel `data-rule` (S34 F1); toleransi DATUM-28 1e-3 pt (S34 F2); menghitung tanda `data-accent="series"` sebagai satu subjek; tambah `accentSeries` ke `ACCENT_HINT_KEYS`; `estimateHeightMm` default memakai tinggi acuan per keluarga yang diekspor (`P1_REFERENCE_HEIGHT_MM`, `K1_REFERENCE_HEIGHT_MM` 50/50/58/58, `S1_REFERENCE_HEIGHT_MM` 54/56/54/56, `H1_REFERENCE_HEIGHT_MM` 66/66/72/60/64, dst.); `colorFamily` menghitung rona antara kertas dan warna palet sebagai keluarga warna itu (S35); entri registri `chart.kind.S-03/S-04.bandwidth`, `chart.kind.S-02.whisker` (S41), K-08 `grid`/`icon`/`caption`, K-11 `accentLink`, K-12 `widths` (S38); fixture S63 H-01..H-05 menyetel `heightMm` acuan; SERAGAMKAN kebijakan alias params (D-87): satu resolver di core (kunci penuh menang, alias pendek = nama registri kode yang sama diterima + REPORT `PARAM_ALIAS`, lainnya `PARAM_IGNORED`) dipakai semua keluarga (S32 & S40 kini mengabaikan alias, keluarga lain menerima); entri registri W-07 `todayAt`/`todayLabel`, W-08 `riskyTypes`/`highlightWindow` (S40); tinggi acuan `W2_REFERENCE_HEIGHT_MM` 62/62/40; core mengenali `accentSeries`, `accent.point`; subjek aksen = grup/seri (S37, S42: `data-index` grup + `data-obs`; periksa P-05 S33 yang memberi `data-index` per observasi) agar cek CB1 (d) ±3 mm tercapai — perluas untuk keluarga lain yang mengekspor tinggi acuan | D-77 |
| IP-26 | `engine/html/**` (S21-S24) | Benchmark doc.json gagal render HTML: blok turunan tanpa `result()` (bentuk reproduksi S93) dan pembungkus lampiran — padanan perbaikan INT-B di sisi HTML | F-037, D-79 |
| IP-27 | `engine/browser` (S25) | PNG Node 2-3 px lebih besar dari acuan (gerbang ukuran PNG gagal untuk CA, DG, SY) — diagnosis pembulatan ukuran mm→px vs acuan Python (Chromium Python `set_content` / matplotlib) | F-038 |
| IP-28 | `services/ingest` (S48), `services/images` (S53) | Entri bebas-Prisma untuk CLI/harness (klien Prisma dibuat tanpa dipakai) | F-038 |
| IP-29 | `scripts/parity/reference/fig` (S65) | Acuan K-01 gagal untuk data apa pun (`pustakachart.py:421` `np.sum(generator)` TypeError di numpy terpasang) — tambalan in-process adapter (skill read-only), dicatat di `ref_report.patches` | F-039, INT-L |
| IP-30 | `services/revisions` (S50) | Teruskan `tpl` ke `byConstructionChecks(doc, tpl, opts)` di `revisions/index.ts` (signature baru INT-C) agar penegakan per tier/profil berlaku saat sunting | D-90 |
| IP-31 | `services/ingest` (S48) + `engine/bind` (S12) + pemakai di `engine/html/tables/reproduction.ts` (INT-F) & `engine/docx/**` (INT-B) | KEAMANAN KEBIJAKAN: penanda `doc.x.benchmark` hanya dihormati bila pemanggil ADMINISTRATOR atau mode harness/CLI (tanpa sesi HTTP); ingest MEMBUANG penanda dari pemanggil lain + log; predikat reproduksi verbatim dipindah ke `engine/bind` (satu sumber) dan dipakai HTML + DOCX | F-042, D-91 |
| IP-32 | `engine/lint/render` (S45) | `renderLintLimitsFromParams` NaN (reduce Math.min) → cek 25/28/33 tidak pernah FAIL; lalu hapus tambalan lokal `LINT_LIMITS_REPAIRED` di services/render | F-044, INT-O |
| IP-33 | `engine/soffice` (S92) | Path profil/keluaran soffice > MAX_PATH → soffice menggantung 180 s; pakai direktori sementara pendek + gagal cepat | F-045, INT-O |
| IP-34 | `engine/docx/**` (S18/S19), `engine/html/**` (S24) | Renderer belum membaca `ctx.assetBytes` (HTML hanya `dataBase64`) — pakai sumber byte aset tunggal | F-046 |
| IP-35 | `services/ingest`, `services/templates`, `engine/lint/structure/enforcement.ts` | Templat terbatas (profil melepas cek penolak → hanya ADMIN/harness, 403 lainnya) + `doc.x.lintEnforcement` hanya bagi pemanggil tepercaya | F-047, INT-P |
| IP-36 | `services/render` (S51) | Hapus tambalan lokal `repairLimits`/`LINT_LIMITS_REPAIRED` di `services/render/lint.ts` (tidak lagi terpicu sejak INT-O) | D-100 |
| IP-37 | Diagnosis baca-saja (catatan sendiri) → perbaikan menyusul di area pemilik | BM4 halaman 26, 40, 87 SSIM < 0,95 (min 0,698) pada garis dasar INT-B — tentukan sebab per halaman (figur, fon, aliran halaman) dan area kode pemiliknya | D-101 |
| IP-38 | `engine/docx/wrapper/xml.ts` + `engine/docx/blocks/props.ts` | Satukan serializer sisa dengan `package/xml.ts` (pasca IP-15); DOCX benchmark harus byte-identik sebelum/sesudah. Setelah INT-Q mendarat | D-101 |
| IP-39 | `engine/chart/**` + `registry/charts.ts` | Petunjuk tergambar panel galeri yang belum didukung (index.json `panelParamsMoved`; file_requests baris IP-02): domain sumbu `axis` [min,maks], `valueLabel`, `seriesLabelsInPlot`, `pointRoles`, `trendColour`, `colTicks`, `labelEnds`, `axesUnlabelled`, `totalLabels`/`totalsFromLabel`, `segmentValueLabels`, `sideLabels`, dst. → ParamDef/CHART_DATA_HINT_KEYS + implementasi; panel memakai kunci penuh. SETELAH S73/S84 | D-113 |
| IP-40 | kontrak `chart.schema.ts` (S03-d4 aditif) | Medan metadata panel tak-tergambar `x` (asal transkripsi, catatan) pada ChartPanelSpec/panel komposit. SETELAH S73/S84 | D-113 |
| IP-41 | `engine/chart/**`, `engine/lint/render/**`, `registry/charts.ts`, `contract/schema/chart.schema.ts`, `benchmark/manual000/figures/**` | Sisa IP-39a (D-136): S79 fon dasar P-10/K-07, peran warna P-10/K-07/K-09/H-07, label Gantt W-07, level kontur H-06 (MaxNLocator), parser busur lint H-08, IP-39 ParamDef petunjuk tergambar + pindah dari `panelParamsMoved`, IP-40 medan `x` | D-136 |
| IP-42 | `engine/symbols/**` + `services/render/figures.ts` + `benchmark/manual000/figures/**` | Opsi lembar simbol isi-pas RL Garis B (`fit`, aditif) diteruskan render; spec S94 width fig-25/38 + tinggi | D-137 |
| IP-43 | sisa FIX-1 | R-10, R-11, R-13, R-22, permintaan FIX-5 (orkestrator render tanpa DB, komposit tanpa templat), sisa L-06 `fonts.ts` | D-134 |
| IP-44 | `engine/docx/package/header-footer.ts` + params P4S-11/P4S-13 (via SR-05/SR-59) | Blok register footer: huruf tebal dari parameter P4S-13 `boldFields` (bukan hardcode BM); nilai BM disematkan di preset; bawaan P4S-11 memakai `{org}` | D-151 | selesai (SR-16 D-197, IP-50 D-211; G-2 SR-39) |
| IP-45 | `benchmark/manual000/figures/tools/**` | Sinkronkan generator `diagrams.py`/`build_figures.py` dengan spec fig-25/fig-38 hasil IP-42c (regenerasi tidak boleh membalik); IP-41e sekalian membersihkan 8 PARAM_ALIAS aksen bm-fig-17..21 | D-154 |
| IP-46 | `src/app/login/**` (HQ non-Studio; izin controller) | Halaman login menghormati `?next=` agar kembali ke halaman Studio asal | D-164 |
| IP-47 | `services/images/**` | Validasi pola `missionFolder` (register §7.2) di layanan aset — satu sumber dengan route R18; hapus salinan datar `assets/<sha>` setelah pembaca pindah ke `relPath` (D-175) | D-175, D-176 | terbuka — loop perbaikan (G-1 SR-39) |
| IP-48 | `contract/types` (RenderContext) + `services/{storage,ingest,images}` | Lebarkan `RenderContext.snapshot` ke `AnyNormSnapshot` (hapus cast SR-15); impor Prisma malas agar `services/render/pure` tidak memuat `.env` saat impor | D-155, D-186 |
| IP-49 | `src/middleware.ts` (auth HQ; izin controller) | Saat mengalihkan ke `/login`, sertakan `?next=<jalur asal>` (jalur relatif saja) agar IP-46 berfungsi; masuk cakupan SR-57 | D-192 |
| IP-50 | `engine/docx/{package/index.ts,wrapper/formats.ts}`, `engine/tokens/**` (ekspor), `engine/html/**` (alias P4S-13) | Pembersihan pasca-SR-16/17: hapus re-export `A4_PORTRAIT_TW`; ekspor `pageSizeFromPaper` + hapus alias `pageSizeFromKnob` (D-172); `textWidthTw` via `resolveUnitSetup` tanpa literal 166; alias P4S-13 sisi HTML | D-197 |
| SR-35b | `docs/STUDIO-AGENT-GUIDE.md`, `docs/API-REFERENCE.md` | Setelah N1/folder misi diperbaiki: contoh folder misi kembali ke pola IL nyata `YYYY-MM-DD_<misi>`; catatan R19 diperbarui (SR-26 sudah mendarat) | D-205 |
| IP-51 | `src/app/api/studio/validate/**` + `services/submit` (dryRun) | R08 validasi bab/slot v2 dengan pratinjau kelengkapan pasca-gabung (dryRun kiriman parsial) | D-207 | ditutup (D-272) |
| IP-54 | `src/app/api/studio/{documents/route.ts,assets/route.ts}`, `services/revisions` (`listRevisions`), `services/storage/files.ts` (`toOutputFileDto`) | Polesan API untuk UI SR-30: ringkasan slot + berkas terakhir di R04 GET; `changeScope`/`completeness`/`schemaId` di R07; `draft` + `scope` di DTO berkas; R18 GET pratinjau aset inline | D-212 |
| IP-55 | `services/render/common.ts`, `services/ingest/**` (lokasi `applyDocOverrides`) | Pindahkan `applyDocOverrides` ke modul daun agar impor `services/render/pure` tidak memuat Prisma/.env; pelebaran `RenderContext.snapshot` ke `AnyNormSnapshot` (utang tipe) | D-222 | terbuka — loop perbaikan (G-1 SR-39) |

| IP-56 | FIX-4b | 7 berkas revision tanpa pemakai (edit-workspace, revision-viewer, revisions-workspace, block-editor, change-dialog, inline-editor, rerender-panel) + document-viewer/api.ts hanya internal | Review SR-55 menilai; hapus hanya dengan persetujuan pengguna | ditutup (D-251) |
| IP-57 | FIX-4b | Adaptor rel SR-30 `doc-model.toRailSummary` dan SR-31 `rail-summary.ts` masih menerima medan `content` usang | Loop perbaikan: rapikan ke `CompletenessSummary` murni | ditutup (D-252) |
| IP-58 | FIX-4b | Skrip glosarium belum mengecualikan isi InfoTeknis (4 hit `FixHint.technical` hints.ts:49/98/113) | Loop perbaikan: pengecualian §1.2 di skrip | ditutup (D-252) |
| IP-59 | RQ-11 | `axis` chart P-13/P-14/S-01 tanpa ParamDef, hilang di v2 | Loop perbaikan: ParamDef templat pola IP-41c | ditutup (D-268) |
| IP-60 | RQ-11 | Register 03 T2-24/T2-25, STUDIO-AGENT-GUIDE, API-REFERENCE §12 belum memuat limit/target/divider/binEdges/sectors + aturan sorot | Baris DOC-1 sebelum SR-39 | ditutup (D-233) |
| IP-61 | DOC-1 | Emoji lama di `docs/API-REFERENCE.md:38` | Loop perbaikan (dokumen) | ditutup (D-234) |
| IP-62 | DOC-1 | Skrip SR-35 yang mem-parse tabel §15 STUDIO-AGENT-GUIDE perlu dijalankan ulang setelah tabel kunci templat RQ-8 ditambahkan | SR-55 / loop perbaikan | ditutup (D-244) |
| IP-63 | DOC-1 review | `widthClass` di ChartPanelV2 dan `max` di `limit` ditolak SCHEMA_INVALID tanpa `checkId` | Loop perbaikan: entri DF pola FIX-5 + teks register | ditutup (D-261) |
| IP-64 | SUB-1 | `target` R04 diteruskan lewat AsyncLocalStorage; ganti parameter eksplisit lewat 4 sisipan `services/ingest/**` (patch di file_requests) | Loop perbaikan | ditutup (D-261) |
| IP-65 | SUB-1 | Register/panduan/API-REFERENCE belum mendokumentasikan `target.documentId`/`baseRevisionNo` pada R04 `studio.doc/v2` | Loop perbaikan (dokumen, tulis atomik) | DOC-2 berjalan |
| IP-66 | SR-38 | Kiriman bertarget `studio.doc/v2` menolak 409 META_CONFLICT walau medan meta dokumen null (subject 000) | Loop perbaikan: isi-bila-kosong, konflik hanya bila keduanya terisi dan beda | ditutup (D-261) |
| IP-67 | SR-45 | Semua agen internal berbagi satu bucket rate-limit | Siklus 2: bucket per identitas agen | terbuka |
| FIX-V | FIX-U M5 + IP-51 | R08 validate menerima draf templat (template/skeleton ke ingest dryRun) + HTML norm/v2; pratinjau templat pindah ke v2 | Siklus 2 | ditutup (D-272) |
| IP-68 | FIX-R | `services/render/prepare.ts` menyimpan spec artefak verbatim beserta overrides (disaring saat render) | Security ulang menilai; siklus 2 bila perlu | terbuka |
| FIX-W | FIX-FIG | Kontrak 128|166 → turunan; cadangan literal sisa; grid diagram di render/artifact.ts + CLI lib/render.ts:870; regenerasi doc.v2.json pasca D-247 | Siklus 2 setelah FIX-S | ditutup (D-271) |
| IP-69 | SR-53 | Skrip rollback resmi (delta struktur + §1.4) belum ada di repo; runbook wajib cadangan data Studio sebelum rollback §1.4 | DOC-2 (runbook + skrip SQL di prisma/rollback/) | terbuka |
| IP-70 | RESEED | Templat Kanonik/GSP di v21 menyimpan 774 kunci (registri 784; 10 kunci baru = bawaan), peringatan `registryInSync false` | Seed menyinkronkan kunci registri baru pada versi templat berikut | terbuka |
| IP-71 | FIX-X | Cek lebar/tinggi figur v1 saat kirim belum untuk jalur legacy v1 tepercaya dan artefak R09 | Siklus berikut | terbuka |
| IP-72 | FIX-A | Entri mati `axis` di `CHART_DATA_HINT_KEYS` (`engine/chart/core/params.ts`) | Siklus berikut / review | terbuka |
| IP-73 | SR-51 | Laporan ukuran raster runner = indeks (M-1) | Siklus berikut | terbuka |
| IP-74 | SR-56b M3b | Pipeline benchmark merakit DOCX sendiri, bukan `renderSnapshot` murni | Siklus berikut | terbuka |
| IP-75 | SR-56b N5 | Berkas yatim `components/studio/playground/rail-summary.ts` | Dihapus atas persetujuan USER (D-317) | ditutup |
| IP-76 | SR-56b N7 | Lebar tabel preset Manual 000 tetap untuk A4 (hipotesis) | Diterima: preset khusus benchmark A4 | dicatat |
| IP-77 | SR-56b N8 | Skrip glosarium belum di uji/CI | Siklus berikut | terbuka |
| IP-78 | FIX-A2 | CLI `--template manual-000` → lembar simbol 128 mm (preset v2 menetapkan full 166); dugaan CLI memuat template.json v1 | Siklus berikut (CLI) | terbuka |
| IP-79 | FIX-A2 | `engine/html/blocks/semantic.ts:19` mengimpor dari mesin DOCX | Siklus berikut | terbuka |
| IP-80 | FIX-Z | Spec diagram terkomposisi dengan `keyRowOnPage` tidak lolos skema `{not:{}}` bila divalidasi ulang (kini tidak divalidasi di render) | Bila validasi ulang ditambahkan, buang medan internal sebelum validasi | dicatat |
| IP-81 | SR-47 | Lint artefak DATUM-32 `dg_rack` FAIL (build PASS; identik Python sejak S78) | Presisi lint, siklus berikut | terbuka |
| IP-82 | SR-47 | 6 label diagram menempel simpul 0,43 mm (koridor 2 L, fallback labelPos) | Mesin diagram, siklus berikut | terbuka |
| IP-83 | SR-47 | Famili layered belum punya fixture positif yang lolos DATUM-25 | Korpus fixture, siklus berikut | terbuka |
| IP-84 | FIX-SERAH | ruleIndex WAJIB tanpa entri tetap seksi penanda | Siklus berikut | terbuka |
| IP-85 | FIX-SERAH | Sampul HTML tanpa logo S13 bawaan (pra-ada) | Siklus berikut | terbuka |
| IP-86 | FIX-SERAH | Label bagian bawaan dibangun dari digit id | Siklus berikut | terbuka |
| IP-87 | FIX-H P3 | CLI `lib/render.ts:805` composeV2 tanpa info aset → peringatan ASSET_INFO_MISSING (gambar tetap tertanam) | Siklus berikut (CLI) | terbuka |
| IP-88 | FIX-H | Skrip kontrol SR-50 belum meneruskan `gate=true` | Siklus berikut | terbuka |
| IP-89 | SR-54 | Rasterisasi figur berurutan + jeda D-265 = 43-50% waktu render; optimasi paralel/penggunaan ulang browser tanpa kehilangan determinisme | Siklus berikut | terbuka |
| IP-90 | DL-1 | Lint Studio tidak sejalan HS: DATUM-05 hanya fon Office, DATUM-09/10 hanya tabel bercaption, DATUM-14 NOT_RUN; DATUM-32 ×3 `/svgs/3` Manual 000 | Presisi cakupan lint Studio | terbuka |
| IP-91 | FIX-2 | Templat EN yang sengaja mengeset "BAB {n}" tak terbedakan dari bawaan (jadi CHAPTER) | Kenop eksplisit bahasa kicker | terbuka |
| IP-92 | FIX-2 M10 | Label bab/lampiran di TOC + daftar bab pembatas bagian belum mengikuti pola kicker | Siklus berikut | terbuka |
| IP-93 | SR-56c C3 | Urutan unsur sampul tersalin 4 tempat + cek perangkat ganda | Siklus berikut | terbuka |
| IP-94 | SR-56c C4 | `engine/front/texts.ts` mengimpor dari mesin DOCX | Siklus berikut | terbuka |
| IP-95 | SR-56c C5 | Penerimaan bus hilir sld bergantung urutan tepi (`sld.ts:107-145`) | Siklus berikut | terbuka |
| IP-96 | SR-56c C7 | Pratinjau templat mengulang langkah simpan di lapisan route | Siklus berikut | terbuka |
| IP-97 | SR-56c C9 | Baseline 13,5 pt tertanam di `compare_dg_d242.py:30` | Siklus berikut | terbuka |
| IP-98 | SR-56c C10 | Selftest paritas FAIL bukan SKIP bila paket Python hilang | Siklus berikut | terbuka |
| IP-99 | FIX-F | Kapitalisasi string punggung HTML vs DOCX belum diperiksa (DOCX kapital lewat format run) | Siklus berikut | terbuka |
| IP-100 | FIX-H6 | Metode salah pada route Studio yang ada → 405 Next tanpa badan/correlation id | Handler 405 JSON per route atau middleware | terbuka |
| IP-101 | FIX-H2 | Sunting struktur (setOutline/reorder) yang ditimpa kiriman dokumen tanpa base belum dilindungi | Siklus berikut | terbuka |
| IP-102 | FIX-HZ1 | `docx-determinism` sekali gagal saat agen lain merender bersamaan (terpisah lulus) — pantau flaky | Siklus berikut | terbuka |
| IP-103 | FIX-HZ1 | `history-tab.tsx` belum menampilkan status render baru (503/partial) | Siklus berikut | terbuka |
| IP-104 | review batch Hermes | C5/C6 duplikasi id jangkar + kunci bab TOC, C7 dua tabel teks penyebab PDF, C8 literal geometri chart | Siklus berikut | terbuka |
| IP-105 | DOC-3b | R09 artefak tanpa preflight PDF 503 (hanya penanda partial) | Siklus berikut | terbuka |
| IP-106 | review 09e | Impor HTML→DOCX, heuristik buang indentasi 2154, literal 8.2 | Siklus berikut | terbuka |
- IB-DC-1 (2026-10-30, D-363): setelah marker DC-05, satukan duplikat konstanta: `services/render/final-name.ts` (C51-C53 + tipe FinalFileNameParts T2-74) dan `http/quota.ts` (C48/C49/E53 bila didefinisikan lokal DC-19) beralih ke impor dari `contract/**`; tanpa re-export ganda. Pemilik: controller atau baris B3 yang menyentuh berkas itu (DC-18/DC-20).
