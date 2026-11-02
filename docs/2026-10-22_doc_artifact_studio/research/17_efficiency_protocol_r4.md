---
schema_version: 1.0
task_id: doc_artifact_studio
task_row: R4-P (D-475 decisions.md:480; dasar protokol r3 research/15 termasuk §20 dan §21, aturan asal-usul research/13 §17.1 yang diwarisi r3 E-01 lalu diganti D-442; hasil research/16; verifikasi verification/04; uji MCP hermes_trial/07, 08; uji dokumen awal hermes_trial/02, 03)
date: 2026-11-02
agent: data-analyst
type: performance
confidence: MEDIUM (desain dan aturan diturunkan dari data r3, uji MCP-03/MCP-05, dan uji dokumen awal yang dibaca langsung; kandidat bahan dicek Grep atas state.db dan state.db-wal profil gsp-master01 pada 2026-11-02; nama alat dokumen MCP, nama toolset, format log, dan dukungan timing di server MCP belum ada karena baris MCP-D1 berjalan paralel, sehingga semula ditandai menunggu MCP-D1; seluruh tanda sudah diselesaikan controller 2026-11-02 (D-490); ambang U-DOC adalah usulan controller, bukan keputusan USER)
inputs: decisions.md D-415..D-475 (:420-480); research/15 (utuh, §1-§21); research/16 (utuh); verification/04_final_verification.md (§0, §2 B dan D, §3); hermes_trial/01_interview_answer.md, 02_trial_brief.md, 02_trial_feedback.md, 03_retrial_brief.md, 03_retrial_feedback.md, 06_contract_trial3_brief.md, 06_trial3_harness.md, 07_mcp_hermes_test.md, 08_mcp_hermes_retest.md (utuh); docs/STUDIO-MCP.md (Grep §2-§6); Temp/hermes_trial/harness_ab3/ab3.py:40-119 dan Grep definisi subperintah (baca saja); state.db dan state.db-wal profil gsp-master01 (Grep baca saja); workspace Hermes docs/ (Glob, Grep, Read; baca saja)
inherits: research/15 (r3) seluruhnya, termasuk amandemen §20 dan §21, kecuali butir yang tercantum di §5 tabel perubahan. research/13 dan research/11 tetap berlaku lewat research/15
plan_draft: dilewati (baris dok saja; perubahan alat dimiliki MCP-D1 dan HARNESS4, lembar fakta dimiliki FACTS4)
status: complete
---

# R4-P: Protokol uji efisiensi putaran 4 (U-DOC dokumen klien, U-REP laporan kerja MCP lawan Markdown)

## 0. Ringkasan keputusan desain

| # | Keputusan | Alasan singkat | Bagian |
|---|---|---|---|
| K4-1 | U-DOC memakai **bahan yang sama untuk kedua arm, urutan B lalu A** | n = 1 per arm: bahan berbeda membuat selisih bahan tercampur penuh ke rasio waktu; mutu hanya bisa dibandingkan apel-ke-apel bila bahan sama; urutan B dulu membuat efek belajar isi menguntungkan arm A (builder lama), jadi kemiringan merugikan B seperti r3 | §6.5 |
| K4-2 | Bahan U-DOC utama: cuplikan laporan riset NearLink (`2026-10-19_nearlink-research-plan/output/manuscript.md`); cadangan: analisa DaoCloud (`2026-10-30_dao-cloud-fit-analysis/analysis/03_fit-report.md`) | Path berkas 0 kemunculan di state.db dan state.db-wal; tidak pernah dipakai di uji Studio; deliverable DATUM nyata bertabel dan bergambar | §6.4 |
| K4-3 | Ambang U-DOC = **usulan controller**, terpisah dari D-422 | D-422 diputuskan USER untuk laporan kerja; dokumen klien berbeda jenis kerja, garis dasar, nilai klaim, dan ukuran sampel | §6.8 |
| K4-4 | U-REP 3 pasangan baru (R-10, R-11, R-12), minimal 2 bila slot panjang gagal kriteria; urutan silang r3 | Lembar R-7..R-9 kini dikenal Hermes; desain silang r3 dipertahankan | §7.4, §7.5 |
| K4-5 | U-REP arm A = **MD bebas sungguhan**: prompt arm A tidak memuat skema laporan arm B | Celah r3: arm A menyalin skema brief §1 sehingga G_A = 0 dan FD_A turun (research/16 G3-6, KF-9) | §7.2 |
| K4-6 | Batas fase KE-1 arm B U-REP diambil dari log sesi (ts_result alat MCP submit/update) | Alat MCP tidak menulis `timing.csv` seperti `studio-report --timing`; ambang D-422 tidak berubah | §7.6 |
| K4-7 | Aturan asal-usul KE-5 = D-442, ditambah dua preseden r3 yang **dikodifikasi sebelum uji**: profil Chromium milik server DEV dikecualikan dengan bukti induk proses; berkas sesaat yang terbukti di log dihitung (ketat) | Aturan tidak boleh diubah sesudah hasil terlihat (D-458) | §7.7 |
| K4-8 | Prosedur MCP per sesi: cadangkan config Hermes, `mcp add` (rahasia hanya `${env:...}`, `STUDIO_MCP_FILE_ROOTS` sandbox per run), sesi, `mcp remove`, pulihkan dari cadangan, `cmp` dua kali; gagal pulih = semua sesi berhenti | Pelajaran D-462 dan D-469: `mcp remove` menulis ulang config sehingga `cmp` selalu beda sebelum dipulihkan | §8 |

## 1. Source Tasks

| Sumber | Isi yang dipakai |
|---|---|
| D-475 (`decisions.md:480`) | USER menyetujui Putaran 4: (1) laporan kerja: pengecil token MCP lalu satu uji berwaktu MCP lawan Markdown yang sah, protokol r3 sebagai dasar, fakta baru; (2) dokumen klien: alat dokumen di MCP lalu Hermes membuat satu dokumen klien nyata lewat MCP dibanding builder lokalnya. Batas: produksi/9011/`~/gsp-datacenter` tidak disentuh, rahasia tidak dicetak, konfigurasi Hermes hanya sementara dan dipulihkan byte-identik, proses USER tidak dihentikan, batas loop 3 siklus per kriteria |
| D-422 (`:427`) | Ambang KE-1 laporan kerja dipisah: (a) median r1 <= 1,00; (b) median r2 <= 0,70 dan tidak ada pasangan > 1,00 |
| D-442 (`:447`) | Isolasi host informatif; KE-5 hanya menghitung berkas yang terbukti disentuh run lewat log sesi; caveat beban wajib |
| D-456, D-458 (`:461`, `:463`) | Positif palsu profil Chromium server DEV dikonfirmasi dengan bukti induk proses; berkas `/tmp` sesaat R9B dihitung mentah (vonis ketat TIDAK EFEKTIF, sensitivitas NETRAL); siklus 3 dari 3 untuk KE-1 |
| D-460..D-470 (`:465-475`) | Server MCP Studio, prosedur `mcp add`/`remove` yang dapat dibalik, sandbox `STUDIO_MCP_FILE_ROOTS`, penanda data tak tepercaya, basis diingat sesi, uji konflik dua penulis |
| D-472 (`:477`) dan verifikasi 04 | Teknis/MCP PASS; efisiensi tidak tercapai; KE-7 gagal oleh satu fakta (R9-F07); byte tulis B/A median 1,060 |
| research/16 §8-§9 | Friksi F-1..F-10 dan usulan U-23..U-30; U-28 (harness mengisi `docs_b.csv`, arm A tanpa skema arm B) |
| hermes_trial/01, 02, 03 | Builder lokal Hermes dan klaim waktu awal (298 s Studio lawan 10-15 menit builder lokal) |
| hermes_trial/07, 08 | Uji MCP nyata: 9/9 alat, token input per panggilan sekitar 100 ribu, config ditulis ulang oleh `mcp add`/`remove` |

## 2. Exploration & Collection Summary (Tier 2)

| Fakta | Bukti | Mengapa penting | Cara verifikasi |
|---|---|---|---|
| Builder lokal Hermes = skrip Python deterministik kelas `DatumDocx` (skill `datum-house-style` v2.1.0, python-docx) yang membaca token gaya; figur dari registri aset lewat `render_aset.py`; chart matplotlib; gerbang ASSERT byte (G-RAIL rev B, G-DQ-1..16); PDF lewat Word COM; scanner gaya `scan_ai_footprint.py` | `01_interview_answer.md:12-15`; contoh nyata `2026-10-27-penawaran-heimdall-dasar/work/build_docx.py` + `assert_gate.py` (Glob) | Mendefinisikan arm A U-DOC | Read |
| Angka "builder lokal 10-15 menit" adalah taksiran Hermes, bukan pengukuran; Studio 298 s ujung-ke-ujung (termasuk membaca panduan 1.307 baris dan konversi 35 s) | `02_trial_feedback.md:6`; diulang `03_retrial_feedback.md:23` | U-DOC adalah pembandingan terukur pertama; klaim lama tidak boleh dipakai sebagai garis dasar | Read |
| Keluhan termahal Hermes: perakitan chrome, penomoran dan TOC yang bergeser, revisi kecil menuntut rebuild penuh | `01_interview_answer.md:22-27`, `:30` | Dasar segmen T2 (revisi) di U-DOC dan alasan ambang revisi | Read |
| Alat MCP tidak menulis baris `timing.csv`; CLI `studio-report` menulisnya lewat `--timing` | `STUDIO-MCP.md:177-188` (daftar alat tanpa opsi timing); research/15 §7 baris Timing | Batas fase KE-1 arm B harus dari log sesi atau log server MCP (K4-6) | Grep |
| `mcp add`/`mcp remove` menulis ulang seluruh `config.yaml`; sesudah `remove` `cmp` BEDA lalu dipulihkan dari cadangan sehingga IDENTIK (dua kali) | `07_mcp_hermes_test.md:13-15`; `08_mcp_hermes_retest.md:12`, `:16`; P-6 `:92` | Prosedur §8 wajib memulihkan dari cadangan, bukan mengandalkan `remove` | Read |
| Rujukan `${env:...}` yang tidak terisi kini dianggap rahasia kosong (`SECRET_MISSING`) | `STUDIO-MCP.md:45`; `08_mcp_hermes_retest.md:14` | Galat lingkungan dipisah dari galat agen (KE-3, §7.6) | Read |
| Token input per panggilan MCP sekitar 100 ribu (MCP-05), lawan sekitar 55-66 ribu per panggilan arm B CLI uji ketiga | `08_mcp_hermes_retest.md:64-76`; `07_mcp_hermes_test.md:74` | Pendamping token TK-1 untuk menilai pengecil token MCP-D1 | Read |
| Arm A r3 meniru skema brief §1, sehingga G_A = 0 dan FD_A turun | research/16 `:64`, `:434`, `:450`; U-28 `:416` | K4-5 | Read |
| Admin `docs_b.csv` membebani agen 17-81 s per run sesudah S3 | research/16 F-10 `:399` | HARNESS4 mengisi `docs_b.csv` (E4-08) | Read |
| R9B menyimpan respons R20 ke `/tmp` selama sekitar 6 s; dihitung mentah | research/16 `:273-275`; D-458 `decisions.md:463` | Aturan berkas sesaat dikodifikasi sebelum uji (K4-7) | Read |
| Profil Chromium `playwright_chromiumdev_profile-*` milik server DEV (induk proses = `next start-server`) memicu positif palsu postcheck | research/16 `:255-266`; D-456 `:461` | Aturan pengecualian `render_server` dikodifikasi sebelum uji (K4-7) | Read |
| Misi dokumen klien yang diorkestrasi gsp-master01 sangat dikenal profil: `ctxwin` 259, `demsexp` 832, `eosda-kajian` 633, `gsdi-demo-drilldown\|GSDSI-DRILLDOWN` 356, `adint-corpus-desc\|ADINT-CORPUS-ANATOMY` 169, `fteoy-schengen\|SCHENGEN-DRILL` 529, `adint-prisma\|ADINT-PRISMA-MANUAL` 1385, `swarm-enhance-formic\|RENGNAS-SWARM` 532, `gamedev-manual-1027\|GAMEDEV-MANUAL` 431 | Grep hitung baris atas `.../profiles/gsp-master01/state.db` (2026-11-02) | Kriteria 0 kemunculan untuk bahan U-DOC harus di tingkat path berkas, seperti r3 kriteria 7; tingkat misi dicatat sebagai risiko | Grep |
| Kontrol positif Grep atas path berkas langsung: `t_c6721813` = 216 (r3: 210; D-423: 206) | Grep `state.db` | Grep atas path berkas membaca biner; angka 0 sah | Grep |

## 3. Overview (Tier 1, 5W1H)

- **Apa**: dua uji pada Putaran 4. U-DOC: apakah membuat satu dokumen klien lewat MCP Studio setidaknya setara builder DOCX lokal Hermes dalam waktu dan mutu, dan lebih murah saat revisi. U-REP: apakah laporan kerja lewat MCP Studio (sesudah pengecil token MCP-D1) memenuhi KE-1 D-422 terhadap Markdown bebas, sambil mempertahankan gerbang keras r3.
- **Siapa**: USER (pemutus adopsi dan ambang U-DOC), controller (prosedur MCP, isolasi informatif, harness, kunci, ekspor log), Hermes `gsp-master01` (pelaku), MCP-D1 (alat dokumen, toolset, hasil ringkas), FACTS4 (lembar fakta dan bahan dokumen), HARNESS4 (runner), analis dan verifier sesudah uji.
- **Kapan**: sesudah MCP-D1, review dan security MCP-D1, FACTS4, dan HARNESS4 selesai, lalu DEV dibekukan pada commit yang dicatat. U-REP lebih dulu (9 sesi), lalu U-DOC (2 sesi inti, ditambah sesi opsional).
- **Di mana**: DEV `http://127.0.0.1:9021` beku; workspace Hermes untuk folder run; `Temp/hermes_trial/` untuk berkas uji, sandbox, controller, dan harness.
- **Mengapa (rantai bukti)**: r3 membuktikan komposisi MD-native setara (token keluaran B/A 1,206; susun B/A 0,938) tetapi KE-1 gagal karena biaya tetap per langkah (start `npx tsx`, check, salin basis) dan penelusuran rute (research/16 `:37`, KF-3 `:428`). MCP menghapus start proses per langkah dan basis manual (MCP-05 `08:139`), tetapi menambah beban token per giliran (`08:76`). Untuk dokumen klien, klaim Studio lebih cepat hanya berupa taksiran (`02:6`).
- **Bagaimana**: desain berpasangan r3 untuk U-REP (sesi baru per run, urutan silang, log sesi sebagai sumber utama langkah); satu pasangan bahan-sama berurutan B lalu A untuk U-DOC, dengan pemisahan fase agar efek belajar isi terlihat.
- **Alternatif yang ditolak**: lihat §6.5 (U-DOC) dan §7.2 (U-REP).
- **Asumsi dan celah**: §17.

## 4. Requirements

| ID | Persyaratan | Sumber |
|---|---|---|
| R4-1 | U-DOC: satu dokumen klien nyata dibuat dua cara (arm A builder lokal, arm B MCP Studio: buat dokumen, impor bab Markdown, isi slot, kelengkapan, render, unduh) | D-475 butir 2 |
| R4-2 | Bahan U-DOC baru, belum dipakai di uji Studio, 0 kemunculan di state.db pada tingkat yang ditetapkan; kandidat dan cadangan | Penugasan R4-P |
| R4-3 | Urutan arm dan pilihan bahan sama/berbeda diputuskan dengan alasan bias | Penugasan R4-P |
| R4-4 | Metrik U-DOC: waktu ujung-ke-ujung, langkah/tool call, token masuk/keluar, galat, mutu keluaran (lint/kelengkapan, perbandingan isi dengan sumber), jejak berkas | Penugasan R4-P |
| R4-5 | Vonis dan ambang U-DOC sebagai usulan controller, dengan penjelasan mengapa D-422 tidak otomatis berlaku | Penugasan R4-P |
| R4-6 | U-REP: 2-3 pasangan dengan lembar FACTS4 baru, arm A MD bebas, arm B MCP toolset laporan, urutan silang, KE-1 D-422, KE lain seperti r3, KE-2/KE-6 dari log sesi, aturan asal-usul, isolasi informatif D-442 | D-475 butir 1 |
| R4-7 | Prosedur MCP per sesi dengan pemulihan config byte-identik | D-475; D-462, D-469 |
| R4-8 | Daftar persiapan FACTS4 dan HARNESS4 (perubahan dari ab3), tidak ditulis sekarang | Penugasan R4-P |
| R4-9 | Opsi alat yang belum pasti semula ditandai menunggu MCP-D1; diselesaikan D-490 | Penugasan R4-P |

## 5. Perubahan terhadap protokol r3 (dicatat sebagai keputusan)

| ID | Butir r3 | Perubahan | Alasan dan bukti | Jenis |
|---|---|---|---|---|
| E4-01 | §7, §21.6 alur arm B | Arm B U-REP = server MCP Studio, toolset laporan `STUDIO_MCP_TOOLSETS=reports` (9 alat, `STUDIO-MCP.md` §4.2). CLI `studio-report`, `npx`, `curl`, dan HTTP langsung dilarang di arm B | D-475 butir 1; vonis Hermes MCP-05 `08:154` | skenario |
| E4-02 | brief 06 §1 (berlaku kedua arm) | Prompt arm A hanya memuat bagian umum brief; bagian jalur arm B (skema kepala, bab, tabel, Rujukan) hanya masuk prompt run arm B, W, M, dan Q | research/16 G3-6 `:450`, U-28 `:416` | skenario; ambang tetap |
| E4-03 | §6.1 batas fase arm B | Akhir S1/S2/S3 arm B = `ts_result` pesan tool hasil pemanggilan MCP `studio_report_submit` (S1) atau `studio_report_update` (S2, S3) yang ok, terakhir sebelum penanda `trial-log mark S1/S2/S3`. Silang: log server MCP (per panggilan `durationMs`, `mcpCallId`) dan penanda `trial-log`. Arm A tidak berubah (`t_end` baris `trial-log step edit` terakhir di fase itu) | Alat MCP tidak menulis timing (§2); jam sama (research/16 AS-2 `:443`) | sumber; ambang D-422 tetap |
| E4-04 | §6.2 KE-2 | Tidak berubah. Satu pemanggilan alat MCP = 1, termasuk `get_prompt`, `read_resource`, `list_*`. Penanda `trial-log mark` tidak dihitung | Konsistensi r3 | definisi; ambang tetap |
| E4-05 | §21.7 KE-3 | `G_B,4xx` = hasil alat MCP `ok:false` yang membawa status HTTP 4xx server berkode skema/kontrak. `G_B,klien` = kode penjaga klien MCP (`BASE_CONFLICT`, `BASIS_MISSING`, `PATH_*`, `OUT_EXISTS`, kerabatnya; daftar final dari kode `scripts/studio/mcp/*.ts`: `BASE_CONFLICT`, `BASIS_MISSING`, `BASIS_REBASED`, `DOCUMENT_OWNED_BY_OTHER`, `REPORT_CHANGED_BY_OTHER`, `AGENT_ID_LOCKED`, `INVALID_ARGUMENT`, `PATH_INVALID`, `PATH_OUTSIDE_ROOTS`, `PATH_PROTECTED`, `FILE_UNREADABLE`, `FILE_WRITE_DISABLED`, `OUT_EXISTS`, `OUT_NAME_UNSAFE`, `OUT_UNWRITABLE`, `OVERWRITE_CONFLICT`, `SHA_MISMATCH`, `SHA_UNAVAILABLE`, `CHAPTER_INVALID`, `TOOL_INACTIVE`, `TOOL_UNKNOWN`). `G_B,draft` = `studio_report_check` tidak valid dan galat konversi lokal. Kelompok baru `G_env` (`SECRET_MISSING`, `FILE_WRITE_DISABLED` akibat konfigurasi controller, kegagalan server MCP start) tidak dihitung ke arm B; run diberi tanda `env_galat` | Pola §21.7 r3; galat lingkungan bukan galat agen | definisi; ambang tetap |
| E4-06 | §21.4 KE-5 | Kelas baru `unduhan_mcp` (berkas di sandbox run dengan nama lolos C51 dan sha cocok server) = pengecualian (2). Berkas lain di sandbox dihitung menurut aturan D-442. Dua preseden r3 dikodifikasi (§7.7) | D-456, D-458 | definisi sebelum uji; ambang tetap |
| E4-07 | §6.4 KE-6 | `studio_registry`, `get_prompt studio_laporan_kerja`, dan `read_resource studio://resep/*` = FL utama (padanan panduan dan registri r3). `studio_report_template` = FL_tpl (D-437, tetap terpisah). Sensitivitas FL + FL_tpl wajib | Konsistensi pola dasar r3 (panduan dan registri = FL) | definisi; ambang tetap |
| E4-08 | brief 06 §8 | `docs_b.csv` diisi harness dari R05 sesudah END, bukan oleh agen | research/16 F-10 `:399`, U-28 | prosedur |
| E4-09 | §9.2 sesi Q | Arm B menjawab lewat alat MCP (`studio_contracts_query`, `studio_search`, `studio_document_get`); sesi Q memakai pendaftaran MCP toolset laporan | E4-01 | skenario |
| E4-10 | §8 lembar fakta | Lembar baru R-10, R-11, R-12 (FACTS4). W dipakai ulang byte-identik (sha D-404). M dipakai ulang byte-identik r3 (owner `gsp-skill-manager`) bila tetap sah | §7.4 | skenario |
| E4-11 | (baru) | Prosedur MCP per sesi dan sandbox per run (§8) | D-462, D-469 | prosedur |
| E4-12 | (baru) | Pendamping token TK-1 (token input per `api_call`) dilaporkan, tidak menentukan vonis | §2 baris token | pelaporan |
| E4-13 | §9.1 | Misi `2026-11-02_hermes-contract-ab4`, folder `contract_ab4/`, `controller_ab4/`, `harness_ab4/` (§9) | Pemisahan dari ab3 | lingkungan |
| E4-14 | brief 06 §5 | Kalimat "semua fakta masuk" diperjelas "termasuk tanggal dan angka", untuk kedua arm | verifikasi 04 E-1 (R9-F07 hilang) `:131` | kejelasan brief; ambang tetap |

Ambang tidak berubah: KE-1 D-422, KE-2 advisori `median <= 1,00`, KE-3, KE-4 (C-05), KE-5, KE-6, KE-7, gerbang keras D-362, dan aturan vonis `11:178-180` sama dengan research/15. Siklus: KE-1 sudah di siklus 3 dari 3 (D-458). Uji U-REP ini adalah uji baru atas keputusan USER D-475, bukan siklus keempat yang dibuka controller; hasil apa pun tidak membuka siklus berikutnya tanpa keputusan USER baru.

## 6. U-DOC: dokumen klien, builder lokal lawan MCP Studio

### 6.1 Pertanyaan dan lingkup

Pertanyaan: untuk satu dokumen klien bergaya DATUM dengan isi yang sudah ada (bab Markdown), apakah jalur MCP Studio (arm B) setidaknya setara builder lokal Hermes (arm A) untuk build pertama, lebih murah untuk revisi kecil, dan tidak lebih buruk mutunya?

Lingkup: isi diberikan verbatim, jadi yang diukur adalah perakitan dokumen (sampul, lembar kendali, daftar isi, penomoran, tabel, gambar, header/footer, rail), verifikasi, dan revisi. Komposisi isi tidak diukur. Format wajib hanya DOCX. PDF tidak diminta di kedua arm: Word COM arm A lambat dan serial (`01:25`), sedangkan PDF DEV pernah mati karena fon per-pengguna (`03:21`). Format tambahan yang dihasilkan alat secara otomatis dicatat, tidak dinilai.

### 6.2 Arm A: builder lokal yang biasa

Isi arm A (dari `01_interview_answer.md:12-15` dan contoh `penawaran-heimdall-dasar/work/build_docx.py`):
- skrip Python baru di folder run yang memakai kelas `DatumDocx` (skill `datum-house-style`);
- figur dari bahan (atau registri aset bila Hermes biasa memakainya);
- gerbang byte biasa Hermes (G-RAIL, G-DQ) dan sha256 keluaran.

Batas arm A:
- Hermes tidak boleh menjalankan atau menyalin skrip build misi lain, termasuk misi asal NearLink, karena itu mengukur penyalinan, bukan builder.
- Scanner gaya dan naturalisasi tidak dijalankan di kedua arm, karena isi tidak boleh disunting. MCP-03 menunjukkan gerbang gaya Hermes memakan dua putaran sunting (`07:128`) dan itu bukan biaya perakitan.
- Server MCP tidak terdaftar di sesi arm A (config asli; §8 langkah A-0).

### 6.3 Arm B: MCP Studio (toolset dokumen)

Langkah fungsional dengan nama alat dan parameter persis (toolset `documents`, 11 alat, `STUDIO-MCP.md` §4):

| # | Langkah | Alat MCP (D-475 butir 2) |
|---|---|---|
| B-1 | Pilih templat DATUM terbaru, lihat kerangka slot | `studio_templates_list`, lalu `studio_template_get` (`slug`, `version`): `requiredInput`, `fill` |
| B-2 | Buat dokumen dari templat (misi U-DOC, judul dari `meta.md`) | `studio_document_create` (`template`, `mission`, `docKey` `ud1-<run>`, `title`, `meta`); idempoten per agentId |
| B-3 | Impor bab Markdown `md/v1`: dry-run dulu, lalu kirim | `studio_chapter_import_markdown` (`documentId`, `markdown` atau `path` di akar `STUDIO_MCP_FILE_ROOTS`); tanpa `submit` = dry-run, `submit: true` = kirim (basis sesi atau `baseRevisionNo`) |
| B-4 | (dihapus) Gambar foto | Tidak ada alat aset MCP; gambar dikeluarkan dari KEDUA arm (D-481) |
| B-5 | Isi slot wajib (sampul, lembar kendali, tanda tangan, rujukan bila diminta) | `studio_slot_fill` (`documentId`, `slot`, `payload`, basis sesi atau `baseRevisionNo`, `change`) |
| B-6 | Operasi struktur/outline bila perlu | `studio_document_structure` (`op=get`, atau `reorder`/`omitSlot`/`setOutline`/`setMeta` dengan `baseRevisionNo` + `change`) |
| B-7 | Kelengkapan dan lint | `studio_document_status` (`missingRequired`, `nextSteps`, `fullRenderAllowed`, ringkasan lint) |
| B-8 | Render DOCX | `studio_render` dengan `formats: ["docx"]` (per panggilan; tanpa `formats` = bawaan templat yang dapat memuat pdf) |
| B-9 | Unduh dan verifikasi ke sandbox | `studio_file_verify` dengan `downloadDir` = sandbox run (`STUDIO-MCP.md:187`) |
| B-10 (S2) | Revisi: sunting paragraf (pid) atau kirim ulang bab berbasis, render ulang, unduh, verifikasi | Tidak ada alat sunting per pid di MCP; revisi = impor ulang bab berubah (`studio_chapter_import_markdown`, `submit: true`, basis sesi/`baseRevisionNo`), lalu render dan `studio_file_verify` (`downloadDir`) |

Pemakaian CLI, `npx`, `curl`, atau HTTP langsung di arm B dicatat sebagai penyimpangan; run tetap dinilai dengan tanda.

### 6.4 Bahan: kriteria, kandidat, cadangan

Kriteria (pola r3 §8.2, disesuaikan untuk dokumen klien):
1. Deliverable dokumen nyata di `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/`, bukan `backup*`, bertanggal sebelum 2026-11-02, ada naskah Markdown sumber dan ada keluaran DOCX atau naskah gabungan.
2. Bukan bahan uji Studio sebelumnya: EOS360-1028 (uji 1 dan 2, `03:6`), OSINT-DEEP-1031 (MCP-03, `07:113`), ADINT-CORPUS-1031 (MCP-05, `08:60`), sumber R-1..R-9, W, M. Alur cerita juga tidak boleh sama (mis. EOSRAY-1009, vendor RayVision yang sama dengan EOS360).
3. Ada minimal 4 bagian, minimal 2 tabel, dan sebaiknya gambar, supaya penomoran, TOC, dan rail teruji.
4. Ukuran cuplikan sekitar 250-320 baris MD (setara 12-18 halaman), supaya satu sesi selesai dalam batas runner.
5. **0 kemunculan di `state.db` dan `state.db-wal` gsp-master01 untuk path berkas sumber berkualifikasi misi dan cardId utama.** Kemunculan tingkat misi dicatat sebagai risiko (pola r3 §8.2 butir 7). Alasannya: semua misi dokumen klien yang diorkestrasi gsp-master01 dikenal profil ratusan kali (§2), sehingga 0 di tingkat misi tidak dapat dicapai untuk dokumen nyata.
6. Tidak muncul di folder uji Studio sebelumnya (`Temp/hermes_trial/**`) maupun dokumen tugas sebagai bahan uji.

| Peran | Bahan | Ciri | Kriteria 5 (path / kartu / misi) | Kriteria 6 | Catatan |
|---|---|---|---|---|---|
| **Utama** | `2026-10-19_nearlink-research-plan/output/manuscript.md` (1.732 baris; cuplikan) | Deliverable DATUM kanal K2, bahasa Inggris, penulis gsp-thinker (`00_outline.md:4`); FM.1 tabel lembar kendali (`manuscript.md:3-16`), FM.2 ringkasan eksekutif (`:17-85`), FM.3 dengan dua figur registri (`:86-113`; PNG di `output/figures/`), Chapter 1 (`:116-207`), Chapter 6 dengan tabel ancaman 21 baris x 6 kolom (`:974-1041`, tabel `:988-1010`, `:1020-1024`), Chapter 10 (`:1247-1268`) | path `nearlink-research-plan.{1,3}output.{1,3}(manuscript\|10_manuscript\|11_manuscript)` 0; `t_6649838b` 0; wal `nearlink\|t_6649838b` 0; misi `nearlink` 14 (state.db) | `Temp/hermes_trial` 0 berkas; dokumen tugas hanya menyebut folder sebagai contoh korpus (`research/02_codebase_map.md:433`), bukan bahan uji | Cuplikan FM.1 + FM.2 + FM.3 + Ch 1 + Ch 6 + Ch 10 sekitar 290 baris. Isi bahasa Inggris dengan chrome templat berbahasa Indonesia: berlaku sama untuk kedua arm |
| Cadangan 1 | `2026-10-30_dao-cloud-fit-analysis/analysis/03_fit-report.md` (119 baris) | Analisa kecocokan mitra, bahasa Indonesia, 10 bab + lampiran, 4 tabel, vonis berskor | path `dao-cloud-fit-analysis.{1,3}analysis.{1,3}03_fit-report` 0; tanpa cardId di berkas; wal 0; misi/merek `DAO-CLOUD-FIT\|dao-cloud-fit-analysis\|DaoCloud` 10 | Folder misi pernah di-`ls` (bukan dibaca) oleh Hermes saat memilih bahan MCP-05 (`mcp_test2/session_calls_readable.txt:9`), lalu tidak dipakai | Tanpa gambar; klasifikasi internal TERBATAS (hanya ke DEV lokal); di bawah pita ukuran |
| Cadangan 2 | `2026-10-27-analisa-penawaran-heimdall/output/LAPORAN-ANALISA-HEIMDALL.md` (394 baris) | Analisa harga penawaran, tabel berat, tanpa gambar | basename + `t_65167b7b` 0; `t_095fc748` 1; misi `heimdall` 7; wal 0 | 0 | Hanya bila TIDAK dipakai U-REP sebagai R-12 (§7.4; satu bahan hanya untuk satu uji) |

Ditolak (kriteria 2 atau 5): CTXWIN-1009 (path `ctxwin-explainer.{1,3}output.{1,3}naskah` 4; misi 259), EOSDA-KAJIAN (path 3; misi 633), DEMSEXP-1008 (path 13; misi 832), ADINT-CORPUS-DESC (misi 169; garis korpus yang sama dengan bahan MCP-05), GSDI-DRILLDOWN (misi 356), EOSRAY-1009 (alur cerita RayVision), EOS360-1028, OSINT-DEEP-1031, ADINT-CORPUS-1031 (bahan uji sebelumnya), PENAWARAN-HEIMDALL-DASAR (sumber verbatim berkoordinat 386 baris dengan tata letak tabel khusus, `work/konten-rincian.md:1-40`; tidak mewakili impor bab Markdown), FTEOY, GAMEDEV, SWARM-ENHANCE, ADINT-PRISMA (misi 431-1385).

Aturan gambar: bila MCP-D1 tidak menyediakan alat aset, gambar dikeluarkan dari bahan kedua arm (FM.3 tanpa dua baris figur), dan keputusan itu dikunci sebelum freeze. Gambar tidak boleh ada di satu arm saja.

Bahan revisi (S2, [skenario], disusun FACTS4/DOCPREP): `revisi.md` berisi tiga perubahan kecil, yaitu satu angka di satu paragraf badan, satu sel tabel ancaman, dan satu kalimat baru di akhir Chapter 10. Setiap perubahan punya token cek.

### 6.5 Desain urutan dan pilihan bahan (keputusan K4-1)

**Keputusan: bahan sama untuk kedua arm; urutan arm B (sesi 1) lalu arm A (sesi 2).**

Alasan:
1. Satu dokumen per arm berarti n = 1. Dengan bahan berbeda, selisih bahan (jumlah tabel, gambar, panjang bab) masuk penuh ke rasio waktu dan tidak dapat diimbangi oleh urutan silang, berbeda dengan r3 yang punya tiga pasangan.
2. Perbandingan isi dengan sumber (Q-1, Q-2) hanya setara bila bahan sama.
3. Efek belajar isi (membaca bahan, memetakan bab ke struktur) menguntungkan sesi kedua. Dengan B lebih dulu, keuntungan itu jatuh ke arm A, yaitu alat lama yang sudah dikuasai Hermes. Kemiringan ini merugikan B, sama dengan prinsip r3 (`research/15 §9.2`, "kemiringan merugikan B dipertahankan"). Bila B tetap menang, kesimpulannya konservatif.

Mitigasi:
- sesi baru per arm;
- arm A dilarang membuka folder run arm B, sandbox B, dan dokumen Studio B (daftar tolak `trial-log get`, HARNESS4 H4-12), dan server MCP tidak terdaftar di sesi A;
- isi verbatim sehingga yang dipelajari hanya pemetaan struktur;
- fase "baca bahan" dilaporkan terpisah, dengan sensitivitas UD-S2 "rakit saja" (§6.9).

Alternatif yang ditolak:
- (a) bahan berbeda tetapi setara per arm: selisih bahan tidak dapat dipisahkan dari selisih alat pada n = 1;
- (b) bahan sama, urutan A lalu B: efek belajar menguntungkan B dan menggelembungkan kemenangan B;
- (c) dua pasangan silang dengan dua bahan: dua kali biaya dan butuh dua dokumen klien setara. Ini ditawarkan sebagai **perluasan opsional** DA2 (arm A) lalu DB2 (arm B) atas cadangan 1, hanya untuk memperkirakan efek urutan, informatif, atas keputusan controller.

### 6.6 Langkah sesi

| Langkah | Isi | Penanda |
|---|---|---|
| S0 | `trial-log mark START <RUN>`; baca `source/` lewat `trial-log get` | START harness = awal T |
| S1 | Rakit dokumen lengkap, render/build DOCX, verifikasi (arm A: gerbang byte + sha256; arm B: kelengkapan + lint + render + unduh terverifikasi) | `trial-log mark S1 <RUN>` tepat sesudah DOCX S1 terverifikasi = akhir T1 |
| S2 | Terapkan `revisi.md`, build/render ulang, verifikasi | `trial-log mark S2 <RUN>` = akhir T2 |
| S3 | `trial-log mark END <RUN> --note "docx=<path>"`; tulis `feedback_<run>.md` dan `format_<run>.txt` (sesudah END, di luar waktu) | END |

Sesi: WD (opsional, arm B, bahan sintetis satu bab, uji asap jalur MCP dokumen, prosedur §8, dan harness; tidak dinilai), DB (arm B), DA (arm A), opsional DA2/DB2, opsional DF (umpan balik akhir tanpa waktu: membaca `feedback_DB.md`, `feedback_DA.md`, dan kedua DOCX final, lalu memberi vonis).

### 6.7 Metrik U-DOC

| ID | Metrik | Definisi | Sumber |
|---|---|---|---|
| UD-T1 | Waktu build pertama | START harness sampai `t_end` penanda `mark S1` | `timing.csv` |
| UD-T2 | Waktu revisi | `mark S1` sampai `mark S2` | `timing.csv` |
| UD-T | Ujung-ke-ujung | START harness sampai END; ditambah `wall_s` sesi | `timing.csv`, meta |
| UD-F | Pecahan fase | baca bahan, rakit (tulis skrip atau panggilan alat), build/render, verifikasi, galat dan pulih, lain; atribusi selang ke aksi pengakhir (aturan research/16 §4.1.5) | `<run>_toolcalls.csv` |
| UD-N | Langkah | jumlah tool call dalam [START, END], aturan r3 §6.2 (penanda tidak dihitung) | `<run>_toolcalls.csv` |
| UD-K | Token | masuk, keluar, penalaran, `api_calls`, masuk per panggilan | `usage_<run>.json` |
| UD-G | Galat | arm A: skrip keluar bukan 0, gerbang byte gagal, traceback; arm B: hasil alat `ok:false` per kode (HTTP 4xx/5xx, penjaga klien, lingkungan); dipisah pulih/tidak pulih | log sesi, log server MCP |
| UD-Q1 | Kesetiaan isi | (a) cakupan paragraf: porsi paragraf sumber yang ada di teks DOCX sesudah normalisasi (NFC, spasi diringkas, penanda MD dibuang); (b) multiset token angka dan ID rujukan (`[X-C-nn]`, `SEC-nn`, sha16) dari sumber 100% ada; (c) angka di DOCX yang tidak ada di sumber = 0; (d) tabel: jumlah baris dan isi sel sama | `docxcheck` HARNESS4 atas DOCX final |
| UD-Q2 | Kelengkapan struktur | semua bagian cuplikan dengan urutan benar; sampul (judul, nomor, klasifikasi); lembar kendali; TOC ada; header/footer ada; tabel berketerangan; gambar berketerangan dengan alt tidak generik (bukan "Picture N", temuan `02:42`) | `docxcheck` |
| UD-Q3 | Lint | arm B: laporan lint Studio (rilis, FAIL per aturan), setiap FAIL diklasifikasi `isi_sumber` (mis. paragraf > 150 kata di sumber, pola `02:41`) atau `rakitan_alat`; arm A: hasil gerbang byte Hermes (dilaporkan agen) + `docxcheck` token gaya (A4, margin 24/20 mm, badan 9,5 pt sesuai `02:38`, gaya judul, field TOC). `datum_lint` dijalankan controller atas kedua DOCX bila alat tersedia [cek controller: lokasi `datum_lint` di skill] | lint Studio, `docxcheck` |
| UD-Q4 | Stabilitas revisi | teks DOCX S2 di luar empat perubahan identik dengan DOCX S1; token RV-1..RV-3 ada dan data Gambar 6.1 = Rev 1 (RV-4) | `docxcheck` diff S1/S2 |
| UD-Q5 | Nama dan sha | arm B: nama final C51 dan sha unduhan = server; arm A: sha256 yang dilaporkan agen = sha berkas | `timing.csv`, sandbox, berkas |
| UD-Q6 | Gambar 6.1 (D-498) | (a) ada di bab 6 sesudah Table 6.1, berketerangan dan bersumber, berbasis data (arm B blok `chart`; arm A grafik buatan builder); (b) data = `gambar.md` di S1 dan = RV-4 di S2 (21 baris SEC, kategori dan seri sesuai); (c) cacat tata letak: arm B `layoutIssueCount` dari `studio_figure_preview` pada S1 dan S2 + inspeksi controller atas PNG/EMF di DOCX; arm A inspeksi controller dengan daftar periksa yang sama (teks bertumpuk, terpotong, keluar bingkai, legenda menimpa) | `docxcheck`, `studio_figure_preview`, inspeksi |
| UD-J | Jejak berkas | snapshot S1-S4 (pola r3): jumlah dan byte berkas baru per kelas (`docx_final`, `skrip_build`, `antara`, `unduhan_mcp`, `draf`, `lainnya`) dengan aturan asal-usul §7.7 | snapshot, postcheck |

### 6.8 Ambang dan vonis U-DOC (USULAN CONTROLLER, belum disetujui USER)

Mengapa ambang KE-1 D-422 tidak otomatis berlaku:
1. D-422 diputuskan USER untuk laporan kerja agen pada uji ulang R2 (`decisions.md:427`), dengan rumus protokol 11/13 yang berlingkup laporan kerja.
2. Jenis kerjanya berbeda. Laporan kerja didominasi komposisi isi oleh agen; dokumen klien di sini didominasi perakitan dan tata letak dari isi yang sudah jadi.
3. Garis dasarnya berbeda. MD bebas adalah biaya menulis minimum. Builder lokal adalah alur berat yang memuat perakitan chrome, sumber cacat terbesar menurut Hermes (`01:22`).
4. Klaim nilainya berbeda. Studio mengambil alih chrome, rail, penomoran, TOC, dan rebuild per bagian (`01:34-38`), sehingga harapan wajarnya justru lebih cepat, terutama saat revisi.
5. Ukuran sampelnya berbeda: satu pasangan, bukan median tiga pasangan.

Usulan (dikunci dan dicatat controller di `decisions.md` sebelum sesi DB; dilaporkan dengan label "usulan controller" sampai USER mengonfirmasi):

| ID | Ambang usulan | Jenis | Alasan |
|---|---|---|---|
| UD-1a | T1_B / T1_A <= 1,00 | waktu | Adopsi netral: bila setara, Studio tetap menambah lint, ledger revisi, dan idempotensi (`02:6`) |
| UD-1b | T2_B / T2_A <= 0,70 | waktu | Kebutuhan utama Hermes adalah rebuild per bagian (`01:30`); klaim "revisi lebih murah" menuntut hemat minimal 30%. Angka sama dengan D-422 (b) demi konsistensi, tetapi dasarnya terpisah dan perlu keputusan sendiri |
| UD-2 | Q1 (a) >= 99% paragraf, (b) 100%, (c) 0, (d) tabel sama; Q2 semua butir ada; Q6 (a) dan (b) | KERAS untuk arm B | Dokumen klien yang kehilangan isi tidak layak kirim |
| UD-3 | FAIL lint Studio berkelas `rakitan_alat` = 0, cacat `docxcheck` B <= A, dan cacat tata letak Gambar 6.1 (Q6 c) B <= A | mutu | FAIL karena isi sumber dicatat, tidak dihukum |
| UD-4 | UD-N B / A <= 1,00 | advisori | Pola KE-2 |
| UD-5 | Galat tidak pulih arm B = 0 | KERAS | Arm yang tidak menghasilkan DOCX gagal |
| UD-6 | 0 berkas payload/respons mentah arm B (aturan §7.7) dan UD-Q5 B 100% | KERAS | Pola KE-5 |
| UD-7 | Token masuk B/A dan masuk per panggilan | informatif | Menilai pengecil token MCP-D1 |

Vonis U-DOC:
- **LEBIH BAIK**: semua KERAS (UD-2, UD-5, UD-6) lulus, UD-1a dan UD-1b lulus, dan UD-3 lulus.
- **SETARA**: semua KERAS lulus, tetapi salah satu dari UD-1a, UD-1b, atau UD-3 gagal.
- **LEBIH BURUK**: salah satu KERAS arm B gagal.

Bila arm A gagal UD-2 atau UD-5, hal itu dilaporkan sebagai temuan builder; vonis B tetap dihitung terhadap waktu A yang tercatat. Confidence vonis dibatasi LOW-MEDIUM (n = 1), dan vonis disebut "satu pasangan".

### 6.9 Sensitivitas U-DOC (tidak menentukan vonis)

- UD-S1: T1 dari START Hermes (tanpa pra-START).
- UD-S2: "rakit saja", yaitu T1 dikurangi fase baca bahan di kedua arm. Ini memperlihatkan efek belajar isi akibat urutan B lalu A.
- UD-S3: T1 arm B dikurangi durasi server render/unduh yang tercatat di log server MCP (padanan batas r3 "kiriman terakhir").
- UD-S4: caveat beban host (pola research/15 §21.3), termasuk label `beban_tinggi`.
- UD-S5: bila perluasan opsional DA2/DB2 dijalankan, rasio pasangan kedua dan rerata dua pasangan.

## 7. U-REP: laporan kerja berwaktu, MCP lawan Markdown

### 7.1 Pertanyaan

Sesudah pengecil token MCP-D1, apakah laporan kerja lewat MCP Studio (arm B) memenuhi KE-1 D-422 terhadap Markdown bebas (arm A), sambil mempertahankan gerbang keras r3?

### 7.2 Arm A: MD bebas

- Prompt arm A memuat bagian umum brief, lembar fakta, folder run, dan pencatatan. Prompt tidak memuat skema kepala, bab wajib, tabel butir, maupun nama alat Studio (E4-02).
- Instruksi: tulis laporan kerja Markdown seperti kebiasaan sendiri.
- Akibat yang diharapkan: G_A dan FD_A kembali mengukur MD bebas, sehingga KE-3 dan KE-6 dapat membedakan lagi.
- Alternatif yang ditolak: (a) mempertahankan skema untuk kedua arm, yang meneruskan celah G3-6; (b) memberi arm A templat MD terpisah, yang berarti garis dasar bukan lagi MD bebas.

### 7.3 Arm B: MCP toolset laporan

| Langkah | Alat (STUDIO-MCP §4, `:177-188`) | Catatan ukur |
|---|---|---|
| S1-a (opsional) | `studio_report_template` (mission, docKey) | FL_tpl |
| S1-b | Tulis/isi laporan MD di folder run | `trial-log step edit` |
| S1-c | `studio_report_check` (path laporan) | `G_B,draft` bila tidak valid |
| S1-d | `studio_report_submit` | Akhir S1 = `ts_result` panggilan ok terakhir (E4-03); basis diingat sesi |
| S2 | Sunting bagian yang berubah, `studio_report_update` | Basis dari ingatan sesi (`basisFromSession`); tidak perlu menyalin baris basis |
| S3 | Sunting, `studio_report_update` dengan kelengkapan wajib + render, lalu unduh ke sandbox dan verifikasi | `studio_report_update` (`documentId`, `path`, `requireComplete: true`) merender (R17) dan memverifikasi sha (R10 HEAD) tanpa menulis berkas; unduhan terpisah lewat `studio_file_verify` (`downloadDir` di sandbox); S4 tercakup |
| M | Alur sama; M2 memakai agentId `hermes-gsp-verifier01` | Argumen `agentId` per panggilan menang atas `STUDIO_AGENT_ID` (kunci mati bawaan, `STUDIO-MCP.md` §2); laporan adopsi milik pihak lain memicu `REPORT_CHANGED_BY_OTHER` -> refresh lalu update |

Larangan arm B (penyimpangan bila terjadi, run tetap dinilai dengan tanda): CLI `studio-report`, `npx`, `curl`, HTTP langsung ke 9021, `overwrite:true` tanpa alasan, menulis hasil alat ke berkas.

### 7.4 Lembar fakta FACTS4: kandidat dan cadangan

Kriteria = research/15 §8.2 butir 1-7, dengan pembaruan:
- butir 1: bertanggal sebelum 2026-11-02;
- butir 2: menambah misi uji ketiga dan sumber R-7..R-9 (`2026-10-08_vctl-1007-lib2`, `2026-10-15_smart-deck-htmlpdf`, `2026-10-10-rafif-revb-1010`, `2026-10-31_hermes-contract-ab3`), misi uji MCP (`2026-11-01_hermes-mcp-test`, `2026-11-01_hermes-mcp-retest`, OSINT-DEEP-1031, ADINT-CORPUS-1031), dan bahan U-DOC (§6.4), supaya kedua uji saling lepas;
- butir 6: owner ketiga laporan berbeda satu sama lain dan berbeda dari owner M (`gsp-skill-manager`).

Angka di bawah dari Grep atas path berkas `state.db` dan `state.db-wal` gsp-master01, 2026-11-02, baca saja.

| Slot | Path (relatif `workspace/docs/`) | Kepala, owner, kartu | Baris | Kriteria 7 (utama / sekunder / misi) | Risiko |
|---|---|---|---|---|---|
| R-10 (pelaksana pendek) | `2026-10-23_vsv-post2-kurasi/laporan-kurasi.md` | Frontmatter `:1-13`; `author_profile: gsp-librarian` `:4`; `status: needs-review` `:5`; `task_ref: t_68512e06` `:6` | 66 | path + `t_68512e06` 0; wal 0 / `t_c25f9f38` 1 (r3 juga 1) / `vsv-post2-kurasi\|VSV-POST-2` 2 | Cadangan R-7 r3 yang tidak dipakai; owner sama dengan R-7 r3 (kriteria 6 bagian "sebaiknya") |
| R-11 (verifier sedang) | `2026-10-11-korpus-lanjutan-1011/verification/CS-RR3-CHAIN.md` | Frontmatter `:1-8`; `author_profile: gsp-thinker` `:4` (peran gsp-pm-verifier `:13`); `status: complete` `:5`; `task_ref: t_4b4069db` `:6` | 66 | basename + `t_4b4069db` 0; wal 0 / `t_6145749f`, `t_fda23cbb` 0 (Grep gabungan dengan `t_c25f9f38` = 1, yaitu milik R-10) / `korpus-lanjutan-1011` sekitar 25 | Seperti r3 §8.4: tenant `KORPUS-LANJUTAN-1011` pernah menjadi token lembar uji 2; `source_refs: [R-1, R-2, R-3, R-4]` (`:7`) bentrok dengan penamaan lembar, jadi FACTS4 wajib membuangnya. Di bawah pita 80 |
| R-12 (panjang) | `2026-10-15_webloc-product-deepdive/verification/01_verifier-report.md` | Frontmatter `:1-11`; kartu `t_be3fd6ab` `:3`; peran gsp-verifier, kendaraan gsp-worker-fast `:5`; tanggal 2026-10-15 `:6` | 231 | path + `t_be3fd6ab` 0; wal kartu + basename 0 / sekunder belum dicek / `webloc` 1.960 (state.db) dan 4 (wal) | Keakraban tingkat misi sangat tinggi (risiko dilaporkan; isi hanya dari lembar) |
| Cadangan R-12 | `2026-10-27-analisa-penawaran-heimdall/output/LAPORAN-ANALISA-HEIMDALL.md` | Frontmatter `:1-10`; `t_65167b7b` `:4`; gsp-worker peran document-writer `:5` | 394 | basename + `t_65167b7b` 0; wal 0 / `t_095fc748` 1 / `heimdall` 7 | +58% di atas pita; keakraban misi rendah. Bila dipakai, U-DOC kehilangan cadangan 2 |

Cadangan R-10 dan R-11 belum ditemukan dalam batas sesi ini (tanpa shell; banyak kandidat r3 §8.5 gagal kriteria 7). FACTS4 mencari dengan kriteria yang sama dan tidak boleh menurunkan kriteria 7. Bila slot panjang tidak terisi, U-REP berjalan dengan 2 pasangan (R-10, R-11), dan median KE-1 = rerata dua rasio. Aturan (b) "tidak ada pasangan > 1,00" tetap berlaku. Owner: gsp-librarian, gsp-thinker, gsp-worker-fast (atau gsp-worker bila cadangan), sehingga kunci Q4 tunggal.

### 7.5 Urutan

| order | run | catatan |
|---|---|---|
| 0 | W (B) | Pemanasan jalur MCP laporan, prosedur §8, gerbang W research/13 §6.5; tidak dinilai |
| 1-2 | R10B lalu R10A | B dulu |
| 3-4 | R11A lalu R11B | A dulu |
| 5-6 | R12B lalu R12A | B dulu |
| 7 | M (B) | Dua agentId; tidak dinilai waktu |
| - | controller | Dry-run R08 isi tersimpan, SQL MU-1, R20 per revisi, penyelesaian kunci Q, `freeze --force` tercatat |
| 8 | Q | Q1 A-B, Q2 B-A, Q3 A-B, Q4 B-A, Q5 A-B |

Kemiringan merugikan B dipertahankan (`11:283`). Bila hanya 2 pasangan, urutan menjadi W, R10B, R10A, R11A, R11B, M, Q.

### 7.6 Metrik dan ambang U-REP

| Metrik | Definisi r4 | Ambang (tidak berubah) |
|---|---|---|
| KE-1 | T1 = START harness sampai akhir S1; T2 = akhir S1 sampai akhir S3. Arm A: `t_end` `trial-log step edit` terakhir fase (r3). Arm B: E4-03. Sensitivitas wajib r3 1-5 ditambah 6: arm B dikurangi durasi render/unduh di dalam panggilan submit/update (log server MCP: `durationMs` per panggilan alat, bukan per langkah internal; sensitivitas 6 memakai durasi panggilan submit/update dikurangi durasi render R17 hanya bila dapat dipisahkan, selain itu TIDAK-DAPAT-DIHITUNG) | D-422: (a) median r1 <= 1,00; (b) median r2 <= 0,70 DAN maks r2 <= 1,00 |
| KE-2 | N_agent dari `<run>_toolcalls.csv` (E4-04); silang CSV | median <= 1,00 (advisori) |
| KE-3 | `G_B,stored` (dry-run R08 isi tersimpan), `G_B,4xx`, `G_B,klien`, `G_B,draft`, `G_env` (E4-05); `G_A` checker mekanis atas MD bebas; sensitivitas Σ(4xx + klien) | r3 / research/11 `:100-104` |
| KE-4 | Skor dan median L_q dari log sesi Q (E4-09); silang `retrieval.csv` | B 5/5 KERAS DAN median L_q(B) <= median L_q(A) |
| KE-5 | D_raw,B dengan aturan §7.7; F_name, F_sha atas unduhan sandbox | D_raw,B = 0 KERAS; F_name = F_sha = 100% |
| KE-6 | FD dari artefak + `format_<run>.txt`; FL utama dan FL_tpl dari log sesi (E4-07); sensitivitas FL + FL_tpl | FD_B <= 2 tiap laporan DAN median FL_B <= median FL_A |
| KE-7 | K_B dan KF pencocok token per fakta (manifest FACTS4), termasuk status transien lewat R20 per revisi | K_B 100% KERAS; KF_B = 100%; KF_B >= KF_A |
| MU-1/MU-2 | SQL baca-saja dan proksi R05 (pola verifikasi 04 D1) | deskriptif |
| TK-1 (pendamping) | Token masuk per `api_call`, token masuk total, token keluaran; B/A per pasangan; banding MCP-05 (sekitar 100 ribu per panggilan) dan r3 CLI (55-66 ribu) | Informatif. Usulan controller (bukan KE): median masuk per panggilan B/A <= 1,25 sebagai tanda pengecil token MCP-D1 bekerja |

Vonis gabungan menurut `11:178-180` seperti r3. Caveat beban wajib (research/15 §21.3).

### 7.7 Aturan asal-usul KE-5 (berlaku sejak sebelum sesi pertama)

1. **Dasar D-442**: berkas baru S3/S4 dihitung ke D_raw,B hanya bila ada bukti sentuh (langsung atau tak langsung) di log sesi run + turunan (research/15 §21.4). Log tak terbaca berarti ragu, dan ragu dihitung. S1/S2 dihitung dengan bukti tingkat folder.
2. **Sensitivitas aturan lama**: research/13 §17.1 (dihitung kecuali bukti A dan B) dilaporkan berdampingan.
3. **Pengecualian `render_server` (kodifikasi D-456/D-458)**: berkas di `Temp/playwright_chromiumdev_profile-*` dikecualikan bila (a) proses `chrome.exe` pemilik `--user-data-dir` itu berinduk proses server DEV yang tercatat di daftar putih host, (b) tidak ada tool call sesi yang menyebut chrome, playwright, atau folder profil, dan (c) berkas tidak cocok pola payload. Bukti (a) wajib dari `<run>_host_pre/post.txt`. Tanpa salah satu bukti, berkas diadili dengan aturan 1.
4. **Berkas sesaat (kodifikasi D-458)**: berkas yang terbukti dibuat di log sesi (pengalihan `>` atau `-o` ke berkas, `write_file`, unduhan) lalu dihapus sebelum snapshot post dihitung ke D_raw,B bila isinya respons API, badan kiriman, atau hasil alat. Bila isinya tidak dapat diperiksa, berkas dihitung (ketat). Sensitivitas tanpa berkas sesaat dilaporkan. HARNESS4 mendaftar kandidatnya dari argumen tool call (H4-9).
5. **Unduhan MCP**: berkas sandbox dengan nama lolos C51 dan sha cocok server = `unduhan_mcp` (pengecualian 2). Berkas `.md` hasil `studio_report_refresh` (`outPath`/`write`) di sandbox = draf, sah hanya bila lulus `check` dan terkirim.
6. **Draf sah**: laporan MD di folder run atau sandbox yang lulus `studio-report check --remote` (postcheck controller) dan isinya terkirim lewat `studio_report_submit/update` (argumen `path` = berkas itu, atau `markdown` dengan sha isi sama dengan berkas pada saat panggilan).

### 7.8 Isolasi host informatif (D-442)

Sama dengan research/15 §21.2-§21.3: H-1..H-9 dicatat per run, tidak menunda; daftar izin layanan selalu-hidup tetap; caveat beban dan sensitivitas 5 wajib. Tambahan r4:
- H-9 mencakup baris MCP-D1, review, atau agen controller lain. Tidak ada yang berjalan selama jendela run.
- Catat jadwal cron gsp-master01 (H-6) dan mtime `gateway.log` sebelum `mcp add` dan sesudah pemulihan, karena sesi cron atau gateway yang membaca config di dalam jendela dapat memuat server `studio` (risiko RK4-3).

## 8. Prosedur MCP per sesi (milik controller; HARNESS4 `mcp-wrap`)

`P` = `C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01/config.yaml`; `B` = `controller_ab4/mcpcfg/<run>/config.yaml.bak`; `SB` = sandbox run.

| # | Langkah | Cek lulus | Gagal |
|---|---|---|---|
| A-0 (semua sesi) | sha256 `P` sama dengan baseline tercatat (MCP-05: `c359917c...f28f`, `08:11`) dan tidak memuat entri `studio` | sama; `grep -c studio` = nilai baseline | Jangan mulai; pulihkan dari cadangan terakhir; `needs-review` |
| M-1 | `cp -p P B`; sha256 keduanya; `cmp P B` | identik | Berhenti |
| M-2 | Buat `SB` kosong: `contract_ab4/sandbox/<run>/` (U-REP) atau `doc_ud1/sandbox/<run>/` (U-DOC) | 0 entri | Berhenti |
| M-3 | `hermes -p gsp-master01 mcp add studio --command node.exe --env STUDIO_BASE_URL=http://127.0.0.1:9021 STUDIO_AGENT_ID=hermes-gsp-master01 'INTERNAL_API_SECRET=${env:INTERNAL_API_SECRET}' STUDIO_MCP_FILE_ROOTS=<SB> STUDIO_MCP_TOOLSETS=<toolset> --args <tsx cli.mjs> <server.ts>` (bentuk `STUDIO-MCP.md:129-138`; `--args` opsi terakhir) | rc 0; "Found N tool(s)" dengan N = jumlah alat toolset (`reports` 9, `documents` 11, `query` 3); `grep -c -F -f <berkas rahasia> P` = 0; entri memuat literal `${env:INTERNAL_API_SECRET}` dan `STUDIO_MCP_FILE_ROOTS` = `SB;<akar baca>` (D-490: akar baca dan tulis sama di server; U-REP akar baca = folder run, U-DOC = `doc_ud1/source/`; M-9 menegakkan semua `fileWrites` di `SB`) | Pulihkan (M-6), berhenti |
| M-4 | `run-session <RUN>` (rahasia hanya di env proses Hermes; probe `mcp add` tanpa env memberi `secret_missing`, sesuai rancangan `08:14`) | sesi rc 0 | Catat; tetap jalankan M-5..M-7 |
| M-5 | `hermes -p gsp-master01 mcp remove studio` | rc 0 | Tetap M-6 |
| M-6 | `cp -p B P`; `cmp B P`; sha256 `P` = sha `B`; `grep -c studio P` = baseline | identik | Kode `MCP_RESTORE_FAILED`: SEMUA sesi berikut berhenti, `needs-review` USER |
| M-7 | `cmp B P` kedua sesudah ekspor `toolcalls` (pelajaran D-469: cmp dua kali) | identik | Sama dengan M-6 |
| M-8 | Proses node `mcp\server.ts` tersisa = 0. Bila tersisa, catat pid dan tunggu; proses USER tidak dihentikan, dan proses milik sesi uji ini hanya dihentikan dengan keputusan tercatat | 0 | Catat |
| M-9 | Log server MCP: semua `fileWrites` di bawah `SB`; isi `SB` didaftar (nama, ukuran, sha) ke `sessions/<run>_sandbox.txt` | 100% di `SB` | Penyimpangan keselamatan, ke USER |
| M-10 | Pindai rahasia atas `P`, log server MCP potongan run, keluaran sesi, dan salinan state.db | 0 | Insiden, ke USER |

Toolset per sesi: U-REP arm B, W, M, dan Q = toolset laporan; U-DOC WD, DB, DB2 = toolset `documents` (memuat `studio_document_get`, `studio_document_status`, `studio_file_verify`); Q = `query`. Sesi arm A (U-REP dan U-DOC) tidak menjalankan M-1..M-10, hanya A-0.

## 9. Misi, folder, freeze

| Unsur | U-REP | U-DOC |
|---|---|---|
| Misi | `2026-11-02_hermes-contract-ab4` | `2026-11-02_hermes-doc-ud1` |
| Folder run Hermes | `workspace/docs/<misi>/<run>/` (`w/`, `r10b/`, `r10a/`, ...) | `workspace/docs/<misi>/<run>/` (`da/`; arm B tanpa berkas wajib di sini) |
| Folder kerja | `Temp/hermes_trial/contract_ab4/` (`facts/`, `queries/`, `sessions/`, `sandbox/`, `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_<run>.txt`) | `Temp/hermes_trial/doc_ud1/` (`source/`, `sandbox/`, `sessions/`, `timing.csv`, `format_<run>.txt`, `feedback_<run>.md`) |
| Controller | `Temp/hermes_trial/controller_ab4/` (`answers/`, `freeze.sha256`, `toolcalls/`, `mcpcalls/`, `mcpcfg/`, `host_log.md`, `host_whitelist.txt`) | sama (subfolder `ud1/`) |
| Harness | `Temp/hermes_trial/harness_ab4/` (`ab4.py`, `bin/trial-log`, `bin/trial-log.cmd`, `smoke_test.sh`) | sama |
| docKey arm B | `lapkerja-<run>`; W `lapkerja-w`; M `lapkerja-m` | judul dari `meta.md`; docKey `ud1-<run>` (dokumen klien memakai mission + docKey, `studio_document_create`) |

Bila uji berjalan di tanggal lain, controller mengganti tanggal misi secara konsisten di brief, prompt, konstanta HARNESS4, `Q.md`, dan kunci sebelum freeze, lalu mencatatnya. Freeze baku r3 §10 berlaku: hanya `ab4.py freeze`, path absolut, termasuk `contract_ab4/facts/*`, `queries/*`, `controller_ab4/answers/*`, `doc_ud1/source/*`, dan berkas alat. Cek bawaan lulus di setiap sesi.

## 10. Daftar persiapan FACTS4 dan DOCPREP (tidak ditulis sekarang)

FACTS4 (U-REP):
1. Cek ulang kriteria 7 tepat sebelum membekukan: Grep atas path berkas `state.db` dan `state.db-wal` langsung, untuk basename atau path berkualifikasi, semua cardId sumber, dan nama misi. Hitungan dikutip di manifest. CardId utama atau path > 0 berarti pakai cadangan.
2. Cari cadangan R-10 dan R-11 dengan kriteria §7.4, dan putuskan R-12 utama lawan cadangan dengan alasan tercatat (pita ukuran lawan keakraban misi).
3. Bekukan sumber ke `controller_ab4/freeze_sources.sha256` (path absolut) dan catat sha di `decisions.md`.
4. `contract_ab4/facts/R-10.md`, `R-11.md`, `R-12.md` dengan pola r3 §8.7 butir 3-5:
   - daftar bernomor, kelompok F-awal/F-upd1/F-upd2, pembaruan sebagian;
   - fakta `absen` eksplisit;
   - fakta [skenario]: initiator `gsp-master01`, status S1/S2, status penutupan, rujukan R-12 ke satu bagian bukti R-10 untuk Q5;
   - jumlah fakta dalam pita ±15%;
   - buang `source_refs: [R-1..R-4]` R-11 dari lembar.
5. `W.md` = salinan byte-identik W (sha D-404). Prompt W menyebut misi ab4, `w/`, dan `lapkerja-w`.
6. `M.md`: pakai ulang M r3 byte-identik (sha `1d499e48...966bb3`, D-440) bila owner `gsp-skill-manager` tidak muncul di lembar R-10..R-12 dan istilah Q3 tidak ada di M. Bila gagal, buat turunan yang hanya mengganti baris owner, dengan diff tercatat.
7. Tabel token KE-7 per fakta di manifest, termasuk fakta tanggal (pelajaran R9-F07), dibekukan sebelum uji.
8. `contract_ab4/queries/Q.md`: Q1 status laporan satu kartu R-12; Q2 laporan berstatus `complete`; Q3 paragraf dengan istilah unik R-12; Q4 laporan owner tertentu; Q5 bagian bukti R-10 yang dirujuk R-12. Kunci `controller_ab4/answers/Q_key.md` di luar folder Hermes.
9. Manifest `hermes_trial/10_contract_trial4_facts_manifest.md`.
10. FACTS4 tidak menulis `freeze.sha256` runner.

DOCPREP (U-DOC, pemilik FACTS4 atau baris tersendiri):
1. Cek ulang kriteria 5 dan 6 (§6.4) untuk bahan utama, termasuk kartu penulis manuskrip (`NL-W4-M1`, `NL-W4-M2`, `NL-W4-MRG` beserta cardId-nya bila tercantum).
2. Salin rentang baris cuplikan secara byte ke `doc_ud1/source/bab-01.md` ... beserta `urutan.md`; catat rentang dan sha per berkas. Rentang yang memecah tabel dilarang.
3. Salin PNG figur yang dirujuk (atau keluarkan figur bila MCP-D1 tanpa alat aset, §6.4), lalu tulis `meta.md` (judul, nomor dokumen placeholder, klasifikasi, penyusun, tanggal, revisi) sebagai [skenario] tercatat.
4. `revisi.md`: tiga perubahan [skenario] dengan token cek.
5. Tabel acuan `docxcheck`: daftar paragraf ternormalisasi, multiset angka dan ID rujukan, tabel (baris x kolom), figur dan keterangan, token revisi. Dibekukan sebelum uji.
6. Bahan sintetis WD (satu bab, satu tabel) tanpa isi nyata.
7. Manifest `hermes_trial/10_doc_trial_material_manifest.md`.

## 11. Daftar persiapan HARNESS4 (perubahan dari ab3; tidak ditulis sekarang)

| # | Perubahan | Dasar |
|---|---|---|
| H4-1 | Salin `ab3.py` menjadi `ab4.py`; konstanta misi U-REP dan U-DOC, `contract_ab4`, `controller_ab4`, `doc_ud1`; tabel `RUNS` (pola `ab3.py:85-90`): W, R10B, R10A, R11A, R11B, R12B, R12A, M, Q, WD, DB, DA, DA2, DB2, DF, TEST | §7.5, §6.6 |
| H4-2 | Subperintah `mcp-wrap <RUN>`: langkah §8 A-0, M-1..M-10 di sekitar `run-session`; meta `mcp_cfg_sha_pre`, `mcp_cfg_sha_restore`, `mcp_cmp_1`, `mcp_cmp_2`, `mcp_tools_found`, `mcp_toolset`, `mcp_sandbox`; keluar 4 `MCP_RESTORE_FAILED` yang memblokir sesi berikut sampai controller mencatat keputusan | §8; D-462, D-469 |
| H4-3 | Sandbox per run dibuat kosong, didaftar sesudah sesi ke `sessions/<run>_sandbox.txt` | §8 M-2, M-9 |
| H4-4 | Tangkap log stderr server MCP per run (offset sebelum/sesudah), ekstrak per panggilan ke `controller_ab4/mcpcalls/<run>_mcpcalls.csv`: `ts`, `tool`, `ok`, `code`, `http_status`, `durationMs`, `mcpCallId`, `correlationIds`, `fileWrites` (format log: stderr satu baris JSON per kejadian `event: "tool_call"` dengan `tool`, `mcpCallId`, `ok`, `durationMs`, `code`/`correlationId`/`httpStatus` bila galat, `correlationIds`, `fileWrites`; `scripts/studio/mcp/server.ts:111-122`) | E4-03, E4-05 |
| H4-5 | `toolcalls`: kenali nama alat MCP (`mcp__studio__*`, `mcp_studio_*`); tambahkan kolom `mcp_ok`, `mcp_code` yang diurai dari isi hasil tanpa menyalin isi | KE-3 tanpa membaca isi manual (research/15 §21.7 sumber) |
| H4-6 | Ekstraksi batas fase arm B dari `toolcalls` + penanda `trial-log mark S1/S2/S3`; `trial-log mark` menerima label S1, S2, S3 selain START/END [cek kode `ab3.py` `cmd_trial_log`] | E4-03, §6.6 |
| H4-7 | Bila MCP-D1 menyediakan timing sisi server (env `STUDIO_TIMING_*`), pakai sebagai silang; jangan jadikan sumber utama tanpa keputusan tercatat (MCP-D1 tidak menambah env timing; hanya `durationMs` per panggilan) | E4-03 |
| H4-8 | `postcheck` arm B MCP: `studio-report check --remote` atas laporan MD di folder run/sandbox; kelas `unduhan_mcp`; kelas `render_server` dengan bukti pid (§7.7 butir 3) | §7.7 |
| H4-9 | Pemindai berkas sesaat: argumen tool call dengan `>`, `>>`, `-o`, `--output`, `tee`, `write_file` di luar folder run/sandbox dicocokkan dengan perintah hapus berikutnya; daftar `berkas_sesaat_terbukti` | §7.7 butir 4 |
| H4-10 | `docs_b.csv` diisi harness dari R05 sesudah END run B (header ditulis) | E4-08 |
| H4-11 | `docxcheck <docx> --ref <acuan>`: pustaka standar saja (zipfile + xml), mengekstrak paragraf, tabel, gambar (alt, keterangan), field TOC, header/footer, sectPr (ukuran kertas, margin), styles (ukuran badan); menghitung UD-Q1..Q4 | §6.7 |
| H4-12 | Daftar tolak `trial-log get`: ab3 dan sebelumnya, `controller_ab4/`, `contract_ab4/queries/` di luar Q, folder misi asal bahan U-DOC dan sumber R-10..R-12, dan pada sesi DA/DA2: folder `db/`, `db2/`, `doc_ud1/sandbox/DB*`, serta HTTP ke dokumen Studio arm B | §6.5 |
| H4-13 | Meta token: `input_per_call`, `output_tokens`, `reasoning_tokens`, `api_calls` dari `usage_<run>.json` | TK-1, UD-K |
| H4-14 | Freeze: tambah `doc_ud1/source/*`, `ab4.py`, `bin/*`, `smoke_test.sh` | §9 |
| H4-15 | Uji asap: `mcp-wrap` atas SALINAN config palsu (config Hermes asli tidak disentuh), gagal pulih memicu kode 4, sandbox, parser log MCP palsu, `docxcheck` atas DOCX contoh, pemindai berkas sesaat | r3 HS-9 |
| H4-16 | Cache tsx server MCP dipanaskan sebelum W dan WD (server dijalankan lewat tsx, `STUDIO-MCP.md:129-138`) | Pola r3 §6.3 |

## 12. Prasyarat sebelum sesi pertama (gerbang controller)

| # | Prasyarat | Pemilik |
|---|---|---|
| P4-1 | MCP-D1 selesai (alat dokumen, toolset, hasil ringkas), review + security PASS atau risiko diterima USER tercatat | MCP-D1, review |
| P4-2 | Brief `09_r4_doc_trial_brief.md` dan `09_r4_report_trial_brief.md` bersih dari tanda menunggu MCP-D1 (selesai D-490); nama alat persis tertulis | controller / baris penyelaras |
| P4-3 | FACTS4 + DOCPREP beku; kriteria dicek ulang; aturan gambar diputuskan | FACTS4 |
| P4-4 | HARNESS4 H4-1..H4-16, uji asap PASS | controller |
| P4-5 | DEV dibekukan pada commit pasca-MCP-D1; HEAD dicatat; cache tsx dipanaskan | controller |
| P4-6 | Freeze baku lulus (`ab4.py freeze --check`, `sha256sum -c`) | controller |
| P4-7 | Dicatat di `decisions.md` sebelum sesi pertama: E4-01..E4-14, aturan §7.7, ambang UD (label usulan controller, atau keputusan USER bila sudah ditanyakan), keputusan K4-1, pilihan R-12 | controller |
| P4-8 | Baseline sha config Hermes dicatat dan sama sebelum setiap sesi (§8 A-0) | controller |
| P4-9 | Lingkungan arm A U-DOC dicek tanpa menjalankan Hermes: skill `datum-house-style` dan python-docx tersedia di profil (keberadaan berkas) | controller |
| P4-10 | H-9: tidak ada agen controller lain selama jendela run | controller |

## 13. Key Findings

| # | Temuan | Confidence | Evidence | Implication |
|---|---|---|---|---|
| KF-1 | Arm A U-DOC terdefinisi jelas: DatumDocx + registri aset + gerbang byte + sha; PDF lewat COM | HIGH | `01_interview_answer.md:12-15`; `penawaran-heimdall-dasar/work/build_docx.py` | Brief A menyebut alur ini dan melarang menyalin skrip misi lain |
| KF-2 | Klaim "builder lokal 10-15 menit" tidak pernah diukur | HIGH | `02_trial_feedback.md:6`; `03_retrial_feedback.md:23` | U-DOC adalah pengukuran pertama; klaim lama tidak dipakai sebagai garis dasar |
| KF-3 | Alat MCP tidak menulis timing, sehingga batas KE-1 arm B harus dari log sesi | HIGH | `STUDIO-MCP.md:177-188`; research/15 §7 | E4-03; HARNESS4 H4-4..H4-7 |
| KF-4 | `mcp add/remove` menulis ulang config; pemulihan dari cadangan + `cmp` dua kali terbukti dua kali | HIGH | `07:13-15`; `08:12`, `:16` | Prosedur §8 dengan kode `MCP_RESTORE_FAILED` |
| KF-5 | Token masuk per panggilan MCP sekitar 100 ribu, lawan 55-66 ribu CLI | HIGH | `08:64-76`; `07:74` | TK-1 pendamping; sasaran MCP-D1 |
| KF-6 | Garis dasar arm A r3 bukan MD bebas | HIGH | research/16 `:450`, `:434` | E4-02: prompt arm A tanpa skema |
| KF-7 | 0 kemunculan tingkat misi tidak dapat dicapai untuk dokumen klien orkestrasi gsp-master01; NearLink hanya 14 di tingkat misi dan 0 di tingkat path/kartu | HIGH | Grep state.db (§2, §6.4) | Kriteria 5 di tingkat path + kartu; misi = risiko tercatat |
| KF-8 | Preseden asal-usul r3 (profil Chromium, berkas sesaat) belum tertulis sebagai aturan | HIGH | D-456 `:461`; D-458 `:463` | §7.7 dikodifikasi sebelum uji |
| KF-9 | KE-7 r3 gagal oleh satu fakta tanggal | HIGH | verifikasi 04 `:77`, `:131` | E4-14 dan tabel token tanggal di manifest |
| KF-10 | Siklus KE-1 sudah 3 dari 3; D-475 adalah izin USER untuk satu uji baru | HIGH | D-458 `:463`; D-475 `:480` | Hasil apa pun tidak membuka siklus berikut tanpa USER |

## 14. Files/Modules Involved

| Berkas | Peran | Pemilik |
|---|---|---|
| `research/17_efficiency_protocol_r4.md` (ini) | Protokol r4 | data-analyst |
| `hermes_trial/09_r4_doc_trial_brief.md`, `09_r4_report_trial_brief.md` | Brief Hermes | data-analyst (penyelaras sesudah MCP-D1) |
| `scripts/studio/mcp/` (repo) | Alat dokumen, toolset, hasil ringkas | MCP-D1 |
| `docs/STUDIO-MCP.md` | Daftar alat, prosedur Hermes §3.2 | MCP-D1 |
| `Temp/hermes_trial/harness_ab4/ab4.py` + `bin/` + `smoke_test.sh` | Runner | controller (HARNESS4) |
| `Temp/hermes_trial/contract_ab4/`, `controller_ab4/`, `doc_ud1/` | Data uji | FACTS4, controller |
| `hermes_trial/10_contract_trial4_facts_manifest.md`, `10_doc_trial_material_manifest.md` | Manifest | FACTS4 |
| `profiles/gsp-master01/config.yaml` (Hermes) | Hanya sementara per sesi, dipulihkan byte-identik | controller |

## 15. Implementation Order

1. MCP-D1 (paralel, sedang berjalan), lalu review + security MCP-D1.
2. Penyelaras brief: ganti semua tanda menunggu MCP-D1 di brief dan protokol dari laporan MCP-D1 dan kode.
3. FACTS4 + DOCPREP (§10) dan HARNESS4 (§11), paralel karena kepemilikan saling lepas.
4. Catat keputusan P4-7; bila memungkinkan, tanyakan ambang UD ke USER.
5. Bekukan DEV, panaskan cache, freeze baku.
6. U-REP: W, R10B ... Q (§7.5), dengan `mcp-wrap` untuk run B, W, M, Q.
7. U-DOC: WD (opsional), DB, DA, opsional DA2/DB2 dan DF.
8. Analisis (data-analyst), verifikasi (verifier), commit lokal; push hanya atas izin USER.

## 16. Risks

| # | Risiko | Mitigasi |
|---|---|---|
| RK4-1 | Pemulihan config gagal atau terlupa, sehingga Hermes membawa server `studio` permanen | §8 M-6/M-7, kode 4 memblokir sesi berikut, A-0 sebelum setiap sesi |
| RK4-2 | Rahasia tertulis ke config atau log | Hanya `${env:...}`; pindai M-3 dan M-10 |
| RK4-3 | Sesi cron/gateway gsp-master01 memuat server `studio` selama jendela pendaftaran | Catat jadwal cron dan mtime `gateway.log` (§7.8); jendela pendaftaran sesingkat mungkin |
| RK4-4 | Efek belajar isi U-DOC menguntungkan A | Urutan B lalu A disengaja (konservatif); UD-S2 "rakit saja" |
| RK4-5 | n = 1 U-DOC | Vonis "satu pasangan", confidence LOW-MEDIUM; opsi DA2/DB2 |
| RK4-6 | Alat dokumen MCP-D1 tidak mencakup aset atau sunting paragraf | Aturan gambar §6.4; brief menyebut friksi tanpa mengakali; langkah B-10 dapat memakai kirim ulang bab berbasis |
| RK4-7 | Keakraban misi R-12 (webloc 1.960) | Isi hanya dari lembar; risiko dilaporkan; cadangan Heimdall |
| RK4-8 | MD bebas arm A membuat kunci Q arm A lebih sulit dibangun | Kunci diselesaikan controller dari berkas akhir, seperti r3 |
| RK4-9 | Toolset salah sehingga arm B memuat alat lebih banyak dari perlu (token) | M-3 cek jumlah alat per toolset |
| RK4-10 | Analisis mengubah aturan sesudah hasil terlihat | Semua definisi E4 dan §7.7 dicatat sebelum sesi pertama (P4-7) |

## 17. Asumsi dan celah (Tier 1)

| ID | Asumsi/celah | Dampak bila keliru |
|---|---|---|
| AS4-1 | Jam state.db = jam `timing.csv` (terbukti r3, `research/16:443`) | Batas arm B bergeser; penanda `mark` sebagai penyelaras |
| AS4-2 | Log server MCP mencatat per panggilan dengan `mcpCallId` dan `durationMs` (terkonfirmasi `server.ts:111-122`) | Tanpa itu, sensitivitas 6 KE-1 dan UD-S3 TIDAK-DAPAT-DIHITUNG |
| AS4-3 | Toolset membatasi daftar alat, sehingga token skema turun | TK-1 tidak membaik; dilaporkan apa adanya |
| AS4-4 | `datum_lint` dapat dijalankan atas DOCX arbitrer | Bila tidak, UD-Q3 arm A memakai `docxcheck` dan laporan gerbang agen saja |
| AS4-5 | Builder arm A tidak memerlukan Word COM untuk DOCX | Bila memerlukan, dicatat sebagai friksi arm A |
| G4-1 | Analis tanpa shell: hitungan Grep tidak mencakup Grep kartu sekunder R-12 dan kartu penulis NearLink | FACTS4 dan DOCPREP mengulang |
| G4-2 | Cadangan R-10/R-11 belum ada | Desain 2 pasangan sebagai jalan keluar |
| G4-3 | Ambang UD belum disetujui USER | Label "usulan controller" pada setiap vonis U-DOC |

## 18. Acceptance Criteria (R4-P)

- [x] U-DOC: arm A disebut dari laporan uji awal (skrip builder DOCX lokal DatumDocx), arm B langkah MCP lengkap (§6.2, §6.3; tanda MCP-D1 diselesaikan D-490).
- [x] Bahan U-DOC baru dengan kriteria, hitungan state.db, kandidat, dan dua cadangan (§6.4).
- [x] Keputusan urutan dan bahan beralasan bias, beserta alternatif yang ditolak (§6.5).
- [x] Metrik U-DOC mencakup waktu, langkah, token, galat, mutu, dan jejak berkas (§6.7).
- [x] Ambang U-DOC sebagai usulan controller, dengan alasan D-422 tidak otomatis berlaku (§6.8).
- [x] U-REP: kandidat FACTS4 dengan hitungan state.db, arm A MD bebas, arm B MCP, urutan silang, KE-1 D-422 terpisah, KE lain r3, KE-2/KE-6 dari log sesi, aturan asal-usul, isolasi D-442 (§7).
- [x] Prosedur MCP per sesi dengan pemulihan byte-identik (§8).
- [x] Daftar persiapan FACTS4/DOCPREP dan HARNESS4 (§10, §11).
- [x] Plan draft dilewati dengan alasan (frontmatter).

## 19. Recommendations

1. Controller mencatat K4-1..K4-8, E4-01..E4-14, dan §7.7 di `decisions.md` sebelum FACTS4 dan HARNESS4 diluncurkan.
2. Tanyakan ambang UD-1a/UD-1b ke USER lewat AskUserQuestion bersama laporan MCP-D1. Bila tidak ditanyakan, catat sebagai usulan controller dan pertahankan labelnya di analisis.
3. Luncurkan FACTS4 dan HARNESS4 paralel sesudah MCP-D1 menetapkan nama toolset dan format log, karena H4-4 dan H4-5 bergantung padanya.
4. Brief tidak memuat ambang KE maupun UD (sama dengan r3).
5. Siapkan pertanyaan USER untuk setiap hasil sebelum uji: U-REP (adopsi MCP sebagai jalur laporan, hentikan klaim waktu, atau desain ulang) dan U-DOC (adopsi untuk dokumen klien, adopsi hanya untuk revisi, atau tetap builder lokal).

## 20. Collection Log

1. Read utuh: `decisions.md:420-481`; research/15; research/16; brief 06; harness 06; 01_interview_answer; 02_trial_brief; 02_trial_feedback; 03_retrial_brief; 03_retrial_feedback; 07_mcp_hermes_test; 08_mcp_hermes_retest. Read bagian: verification/04 `:48-87` dan Grep heading/temuan; `ab3.py:40-119` dan Grep definisi subperintah; manuscript NearLink `:1-130` dan Grep heading/tabel; `00_outline.md:1-60`; kepala laporan-kurasi, CS-RR3-CHAIN, webloc verifier, manual-ktx v1, Heimdall, DaoCloud fit-report, CTXWIN naskah, konten-rincian Heimdall-dasar.
2. Grep `STUDIO-MCP.md` (nama alat, env, prosedur §3.2).
3. Grep hitung atas path berkas `C:/Users/TRIAL/AppData/Local/hermes/profiles/gsp-master01/state.db` dan `state.db-wal` (2026-11-02): kontrol `t_c6721813` 216; nilai per kandidat seperti dikutip di §2, §6.4, §7.4.
4. Glob workspace Hermes: `*/output/*.docx`, `**/naskah*.md`, folder kandidat, `verification/*.md` (hitung baris). Grep `Temp/hermes_trial` dan dokumen tugas untuk nama kandidat.
5. Catatan rujukan: penugasan menyebut "r3 §17 asal-usul". Di research/15, §17 adalah Acceptance Criteria; aturan asal-usul yang diwarisi r3 adalah research/13 §17.1 (r3 E-01), yang lalu diganti D-442 (r3 §21.4). Protokol ini memakai keduanya sesuai §7.7.
6. Tidak ada perintah shell, tidak ada tulisan ke workspace Hermes, Temp, DB, config Hermes, atau repo selain tiga berkas dok R4-P.

## Tanda menunggu MCP-D1 (diselesaikan 2026-11-02, D-490)

§5 E4-01, E4-05; §6.3 B-1..B-8, B-10; §7.3 S3 dan M; §7.6 KE-1 sensitivitas 6; §8 M-3 jumlah alat, toolset, dan akar berkas; §9 docKey dokumen klien; §11 H4-4, H4-7; §17 AS4-2: semuanya diganti fakta dari `docs/STUDIO-MCP.md` dan `scripts/studio/mcp/*.ts`. Tanda FIG-03 di brief U-DOC juga diselesaikan (D-498: Gambar 6.1 berbasis data + RV-4, alat `studio_figure_preview`/`studio_figure_revise`).
