# DC-47d Verifikasi Akhir Menyeluruh (pra-presentasi USER)

- Verifier: `verifier` (tier R), 2026-11-01 11:20-12:10 WIB. Skill: `verification-before-completion`.
- Dasar: keputusan D-419..D-471 (`decisions/decisions.md`), mandat otonom D-448/D-449/D-450.
- Objek: repo `C:\Users\TRIAL\gsp-swarm-hq-v2.1` branch v2.1, HEAD `97f5e80` ditambah perubahan yang belum di-commit (UI-02/UI-04, ENG-01, MCP-01..06, DOC-R4, dokumen). DEV `http://127.0.0.1:9021`.
- Peran: verifier hanya memverifikasi. Tidak ada kode produksi yang diubah. Skrip probe dan keluaran ditaruh di luar repo (`C:/Users/TRIAL/AppData/Local/Temp/dc47d_*`). Rahasia hanya dibaca dari berkas lewat env proses atau `fs.readFileSync`, dan tidak pernah dicetak.

## 0. Vonis

| Bagian | Vonis | Ringkas |
|---|---|---|
| A. Gerbang teknis | **PASS** | tsc 0 (juga `--incremental false`), eslint 0, vitest 169 berkas 3605 lulus / 1 skip / 0 gagal, convert_v2 SAME x3, DOCX benchmark tidak berubah, HTML kanonik `dc6dd8bc` -> `b66c5125` dengan teks dan CSS SAME, migrate up to date (8), audit: 1 paket baru beradvisori (body-parser, sudah diterima) |
| B. MCP | **PASS** | smoke 18/18 dan smoke-conflict 7/7 ke DEV dengan exit 0. Empat probe review 16 diulang independen: UNC 0 panggilan fs (21/21), PATH_PROTECTED 4/4, rahasia 0 di 54 keluaran + stderr, penanda data tak tepercaya 3/3 alat |
| C. UI | **PASS** | 24/24 halaman 200; konsol hanya 401 `/api/auth/me` (sama dengan baseline, 0 galat baru); sampel 10 label: 8 sesuai kode, 2 Low |
| D. Metrik tertunda uji ketiga | **Dihitung 7/7** | Butir 1, 2, 4, 5, 6, 7 sesuai harapan. Butir 3 (KF penuh) menemukan satu fakta hilang di arm B, jadi KE-7 "KF_B = 100%" **GAGAL** (sebelumnya "LULUS sementara"). Vonis gabungan tidak berubah |
| E. Konsistensi dokumen | **PASS dengan catatan** | Lebih dari 100 klaim dicek. 3 ketidaksesuaian Low (API-REF tanpa R05, rujukan D- di STUDIO-MCP, register 05 R03 tanpa `examples`) |
| F. Penelusuran | **PASS dengan catatan** | 11/11 permintaan USER TERPENUHI secara proses. Tujuan efisiensi TIDAK tercapai. Temuan review tertutup atau tercatat, kecuali review 14 Low #10-#14 (sisa D-434 L-1) dan 15c Low R7/R8 yang masih tanpa disposisi. Rahasia 0 di repo |

**Teknis / UI / MCP: PASS** (0 High, 0 Medium; 6 Low). Layak dipresentasikan.

**Tujuan efisiensi: TIDAK TERCAPAI.** Vonis terkunci D-458 tetap: **TIDAK EFEKTIF (ketat)**, sensitivitas **NETRAL**. KE-1 GAGAL (siklus 3/3). Temuan baru DC-47d: KE-7 GAGAL karena KF_B 106/107. KE-7 bukan gerbang keras, jadi vonis gabungan tidak bergeser. Byte tulis agen B/A median 1,060, artinya menulis tidak lebih murah.

**Keseluruhan: needs-review (CAUTION).** Teknis bersih. Hasil efisiensi negatif dan satu sisa disposisi (review 14 #10-#14) harus disajikan ke USER apa adanya.

## 1. Verification Scope

A gerbang teknis; B MCP (smoke + 4 probe keamanan review 16); C UI (audit Playwright + 10 label); D metrik tertunda research/16 §12 butir 1-7; E konsistensi panduan §1.1/§17.0, API-REF §12, `docs/STUDIO-MCP.md`, register 05 (`masterplan/05_document_contract_specs.md`); F penelusuran permintaan USER sejak D-419, temuan review 14/15/15b/15c/16/17/ui_audit, dan pindai rahasia.

Di luar lingkup: produksi `gsp_agent_hq`/9011 (tidak disentuh); audit kerentanan paket lama (next/next-auth, pra-ada).

## 2. Checks

### A. Gerbang teknis (Syntax / Regression)

| # | Perintah | Keluaran | Hasil |
|---|---|---|---|
| A1 | `npx tsc --noEmit` | tanpa keluaran, `exit=0` (5,2 s, inkremental) | PASS |
| A1b | `npx tsc --noEmit --incremental false` | tanpa keluaran, `exit=0` (15,7 s) | PASS |
| A2 | `npx eslint src/lib/studio src/app/api/studio src/components/studio src/app/studio scripts/studio` | tanpa keluaran, `exit=0` | PASS |
| A3 | `npx vitest run tests/unit/studio` | `Test Files 169 passed (169)`, `Tests 3605 passed \| 1 skipped (3606)`, `exit=0` (= D-470) | PASS |
| A4 | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | `SAME doc.v2.json sha256=79290e07…`, `SAME template.v2.json sha256=882057c5…`, `SAME datum-manual-000.preset.json sha256=a951b149…`, `CONVERT_EXIT=0` | PASS |
| A5 | `render_cli.ts --formats docx,html`, pohon kerja vs ekspor `git archive 97f5e80` (di Temp) | Pohon kerja: kanonik DOCX `fa14e5b4c0ea14a8` / HTML `b66c51258ef10de1`; Manual 000 v1 `38b489b97677a98d` / `e05a18f24291311e`; v2 `5cbdc81e7214624b` / `abdbc9a2c76f1e1f`. HEAD: kanonik DOCX `fa14e5b4c0ea14a8` (SAME) / HTML `dc6dd8bcc83a9903`. Manual 000 = nilai di `coder_execution_fixr1.md`/`fixhr2.md` | PASS. ENG-01 terkonfirmasi: hanya HTML kanonik berubah |
| A5b | Diff HTML kanonik HEAD vs kini (python, tag dibuang) | `text_same True` (191.019 karakter), `style_same True`, delta tag hanya `span +28` | PASS (diff gaya saja, sesuai D-465) |
| A6 | `npx prisma migrate status` (URL disaring) | `8 migrations found`, `Database schema is up to date!`, exit 0 | PASS |
| A7 | `npm audit --omit=dev --json` + diff lockfile vs HEAD | Total 25 (4 critical, 11 high), mayoritas pra-ada (next, next-auth, prisma). Lockfile +58 paket (SDK 1.32.1 tree); satu-satunya paket baru beradvisori: `body-parser@2.3.0` GHSA-27r3 (DoS badan terkompresi). `qs` 6.15.0 -> 6.16.1 | PASS dengan catatan: body-parser tak terjangkau di stdio (D-461) dan ditunda tercatat (D-466 L-5) |
| A8 | `package.json` diff | `+"@modelcontextprotocol/sdk": "1.32.1"` (tepat); terpasang `1.32.1` | PASS |

### B. MCP (Integration / Safety)

| # | Perintah / probe | Keluaran | Hasil |
|---|---|---|---|
| B1 | `smoke.ts --mission 2026-11-01_dc47d --agent-id verify-dc47d` (env `STUDIO_MCP_FILE_ROOTS=Temp/dc47d_roots` kosong) | `SMOKE_EXIT=0`, 18 baris `LULUS`, `SEMUA LULUS (7.2 s)`. Server `gsp-studio 1.1.1`, 12 alat; dok `cmvxbzo2j02gbv1xcydyr7ada` 059/GSP/LAP/XI/2026 rev6 COMPLETE verified=true; update delta bab 1 rev7; basis sesi; OUT_EXISTS; BASIS_MISSING (`correlationSource mcp`); search `untrusted=true`; file_verify C51=true; `secret_hits=0` | PASS |
| B2 | `smoke-conflict.ts` (misi + agen sama) | `SMOKE2_EXIT=0`, 7/7 `LULUS`: dok `cmvxbzz7h02jiv1xctf87zoxf`; A basis lama -> `BASE_CONFLICT; konflik ["bab 3"]; revisi dokumen 7 (tidak ada kiriman A)`; refresh; update rev9; `bab 3 memuat tulisan B: true; tulisan A: true`; `secret_hits=0` | PASS |
| B3 | Probe P1 (in-process `resolveAllowedPath` + spy NodeFs; 7 path UNC/perangkat/ADS/CON x 3 tujuan) | 21/21 `PATH_INVALID; fsCalls=0` | PASS (UNC 0 panggilan fs) |
| B4 | Probe P2 stdio: UNC lewat `studio_report_check.path`, `studio_report_refresh.outPath`, `studio_file_verify.downloadDir` | ketiganya `PATH_INVALID` "path UNC/perangkat ditolak" | PASS |
| B5 | Probe P3: refresh `outPath` = `<roots>/CLAUDE.md`, `AGENTS.md`, `.claude/x.md`, `x.instructions.md` dengan `overwrite:true`; plus di luar akar | 4/4 `PATH_PROTECTED; exists_after=false`; luar akar `PATH_OUTSIDE_ROOTS; exists_after=false`; isi akar sesudah: hanya `smoke-20261101042943.md` | PASS |
| B6 | Probe P4: penanda data tak tepercaya | `studio_search untrusted=true markerInText=true closeTag=true notice=true`; `studio_contracts_query untrusted=true marker=true`; `studio_document_get summary untrusted=true marker=true` | PASS |
| B7 | Probe P5: pindai rahasia | `secret occurrences in 54 outputs + 13 stderr lines: 0`; stdout probe `secret_in_probe_stdout=0` | PASS |

Skrip probe: `C:/Users/TRIAL/AppData/Local/Temp/dc47d_probe/probe.ts`, keluaran `out.txt`.

### C. UI (Behavioral)

| # | Perintah | Keluaran | Hasil |
|---|---|---|---|
| C1 | Salinan `ui_audit_js/shoot.js` + `pw_common.js` (identik; hanya `OUT` diarahkan ke `Temp/dc47d_ui/out/` agar bukti lama tidak tertimpa), dijalankan dari `C:/Users/TRIAL`. Rahasia hanya lewat `context.route` ke origin 9021 | `done`, `UI_EXIT=0`; 24/24 (12 rute x 1440/390) status 200; `unlabeled=0`, `noalt=0`, `overflowX=0`, `cuids=0` di semua halaman | PASS |
| C2 | Konsol | Hanya `HTTP 401 /api/auth/me` + pesan konsol terkait (48+48 = 2 per halaman), sama dengan baseline UI-01 | PASS (0 galat baru) |
| C3 | `document_revisions` `unnamed=30` (baseline UI-01: 0) | Ditelusuri: tombol berteks ("Lihat versi ini", "Bandingkan dengan terbaru", "Buat berkas dari versi ini") ada di dalam `<details>` "Tindakan" yang tertutup (`history-tab.tsx:45-55`, `:122-137`, baru di UI-02). `innerText` kosong untuk isi details yang tertutup, jadi ini positif palsu heuristik (15 revisi lama x 2) | PASS (bukan cacat) |
| C4 | Sampel 10 label konfigurasi vs kode | (1) `render.toc.mode` "Bentuk daftar isi di Word"; kedua opsi memuat nomor halaman (`essentials.ts:407-414` vs `docx/wrapper/pages.ts:384-405` 3 kolom + PAGEREF) OK. (2) `classification.level` "Klasifikasi bawaan" (`merge.ts:86`: kiriman menang, param = bawaan) OK. (3) Jarak baris "1,0 baris"/"tepat x pt" (`role-format-labels.ts:22-34` vs `docx/assemble/xml.ts:131` bawaan `auto`) OK. (4) `page.customSizeMm` satuan mm (`param-control.tsx:224`) OK. (5) `grid.evidenceRailMm` "Lebar kolom catatan bukti (mm)" OK. (6) `chapter.kicker.pattern` "Label nomor bab" bawaan `BAB {n}` OK. (7) `cover.kicker.text` "Teks jenis dokumen" OK. (8) `caption.required` "Keterangan tabel wajib, di atas tabel" OK. (9) `layout.railMode` opsi A "Selalu tampil (kolom selebar Rel bukti)" (`essentials.ts:296`) memakai istilah lama, padahal kenop lebarnya kini bernama "Lebar kolom catatan bukti" -> **Low L-6**. (10) `device.spine.*` "teks tepi sampul", padahal penempatan juga `pembatas` (`page.ts:324-331`) -> **Low L-6** | 8/10 OK, 2 Low |

### D. Metrik tertunda uji ketiga (research/16 §12 butir 1-7)

| Butir | Metode | Hasil | Harapan §12 | Dampak pada vonis |
|---|---|---|---|---|
| 1 MU-1 | Prisma `$transaction` + `SET TRANSACTION READ ONLY` (`transaction_read_only = on`), SQL §12 (URL dari `.env`, db dipastikan `gsp_agent_hq_v21`, tidak dicetak) | 041 16/1, 042 (R7B) 17/1, 043 (R8B) 18/1, 044 (R9B) 14/1, 045 (M) 16/2 (`hermes-gsp-master01`, `hermes-gsp-verifier01`) | 16/17/18/14/16; 1/1/1/1/2 | Cocok. MU-1 kini persis (sebelumnya TIDAK-DAPAT-DIHITUNG). Deskriptif, tanpa dampak |
| 2 R20 per revisi | `GET .../content?rev=n&slot=record` (header rahasia, `secret_in_out 0`) | R7B r6 B1 running, B2-4 todo, status draft; r11 B1-3 done, B4 running; r17 semua done, complete. R8B r6 sama dengan S1; r12 B1-2 done, B3 running, B4 todo, partial; r18 done, needs-review. R9B r6 = S1; r8 B1-3 done, B4 running; r14 done, complete | Fakta [skenario] R7-F13/F15/F33/F39, R8-F13/F15/F36/F46, R9-F12/F14/F29/F37 | Status butir 36/36 cocok; status laporan akhir 3/3 cocok; S1 "sedang berjalan" dipetakan ke `draft` 3/3. W-14 terpenuhi. Tanpa dampak |
| 3 KF penuh | Pencocok token manifest 06 §5 (NFC, spasi diringkas, `*`/`` ` ``/`_` dibuang, huruf kecil; padanan ATAU; bentuk digit) atas A = `r7a/r8a/r9a/laporan.md`, B = isi R20 revisi akhir (rev17/18/14) dan MD-native B | Jenis literal + angka: **A 105/107 (98,1%)**: R8-F06 ditulis "22:00 sampai 22:25", R8-F23 ditulis "K16-K18", keduanya hadir secara makna (ajudikasi manual 107/107). **B 106/107 (99,1%)**: R9-F07 (tanggal laporan `2026-10-11`) tidak ada di isi server R9B maupun MD R9B (dicek juga `11-10-2026`/`11 Oktober`/`Oktober`/`tanggal`: 0). Token hilang akibat HTML_INLINE: 0 (B_server = B_md) | KF_B = 100% | **KE-7 GAGAL** pada syarat KF_B = 100%. KF_B >= KF_A lulus ketat (99,1 >= 98,1), gagal bila range A diterima (99,1 < 100). KE-7 bukan gerbang keras (K_B 100% tetap lulus), jadi vonis gabungan tetap TIDAK EFEKTIF ketat / NETRAL sensitivitas |
| 4 Byte tulis agen | `toolcalls/<run>_toolcalls.csv`, jumlah `len(content)` write_file + `len(new_string)` patch dalam [mark START, mark END] | W 3.198; R7A 13.658 / R7B 12.048 (B/A 0,882); R8A 16.754 / R8B 21.921 (1,308; R8B write_file penuh 3x); R9A 11.053 / R9B 11.714 (1,060); M 4.131. **Median B/A 1,060** | - | Deskriptif. Menegaskan D-456/D-458: MD-native menghapus beban JSON uji 2, tetapi arm B tidak menulis lebih sedikit. Tanpa dampak ambang |
| 5 Checker G_A | `python -I Temp/dc47b/ga_checker.py` atas tiga MD arm A | `G_A ketat=0 longgar=0` x3 (sensitivitas `literal_regexA_all` 2/1/1) | Σ G_A = 0 | Cocok dengan research/16. KE-3 tetap LULUS |
| 6 Hasil `check` | Salinan `state.db` + wal + shm (sha wal salinan = asli `605fe064…`), `mode=ro` | 4/4 `VALID`, `dry-run R08: semua bagian valid`, exit 0; 1 peringatan `CONTRACT_STATUS_UNMAPPED` (update R9B, sudah tercatat F6) | VALID, 0 isu | Cocok (0 galat). Tanpa dampak |
| 7 W 85 berkas | perintah §12 butir 7 (juga untuk R7B/R8B/R9B/M) | `85 0`; R7B `8 0`; R8B/R9B/M `0 0` | `85 0` | Cocok. Ajudikasi profil Chromium (D-456/D-458) terkonfirmasi |

Butir 8 (`/tmp/r20_r7b.json` R9B) tidak dapat diperiksa karena berkas sudah dihapus. Butir ini tetap dihitung mentah sesuai D-458, jadi vonis ketat TIDAK EFEKTIF bertahan.

### E. Konsistensi dokumen (Intent Alignment, lebih dari 25 klaim)

| Dokumen | Klaim dicek | Cocok | Bukti / selisih |
|---|---|---|---|
| `docs/STUDIO-MCP.md` | 12 nama alat, 1 prompt, 3 URI resource, 5 env, 15 kode galat, versi server 1.1.1, SDK 1.32.1, batas 4 MiB / 8 MiB, 8 pemetaan teks CLI -> MCP, UNC di akar -> CONFIG_INVALID, https non-loopback, daftar nama terlindung | 50/50 kode | `tools.ts` (grep `name: "studio_*"` = 12), `resources.ts`, `config.ts:24` `MCP_SERVER_VERSION = "1.1.1"`, `config.ts:27,29`, `config.ts:80,94`, `cli-text.ts:14-38`, `safety.ts:147-149`. Selisih **L-4**: kepala dokumen menyebut "D-461, D-462 (MCP-04, versi 1.1.0)" dan "D-469 (MCP-06, versi 1.1.1)", padahal MCP-04 diterima di D-466 dan MCP-06 di D-470 (D-469 = MCP-05) |
| Panduan §1.1 butir 9 + §17.0 | 9 nama alat + prompt; 45 token opsi CLI / kode / perintah di §17.0 (baris 1794-1960) | 55/55 | 44 token ada di `studio-report.ts`/`md-report.ts`/`_http-client.ts`; `CONTRACT_FIELD_UNMAPPED` di `contract/enums.ts`; `STUDIO_MCP_FILE_ROOTS` di `mcp/config.ts`; `PSIKOTES` adalah contoh taskRef |
| API-REF §12 (catatan MCP) | daftar route yang dibungkus | 0/1 | **L-3**: daftar "R03, R04, R08, R10, R12, R13, R15, R17, R20 sampai R22" tidak memuat R05, padahal `studio_document_get view=summary` memanggil `studioRoutePath("R05"` (`tools.ts`) dan STUDIO-MCP §4 menyebut "R20 / R05". API-REF :481 `examples` R2-02 cocok |
| Register 05 | R03 §9.4 | 1/2 | `REGISTRY_KIND_UNKNOWN` cocok `registry/route.ts:113,124`. **L-5**: `items[].examples` (R2-02) tidak disebut (`grep -c examples` = 0), dan kind absen -> 400 (U-07) tidak dinyatakan |

### F. Penelusuran (Completeness)

| Permintaan USER | Status | Bukti |
|---|---|---|
| D-419 perbaikan efisiensi R2 + uji ulang | TERPENUHI (proses) | R2 D-423..D-430, commit e723afb (D-431), uji ulang 9/9 D-432, analisis D-433 |
| D-422 KE-1 dipisah (a) <= 1,00, (b) <= 0,70 + tanpa pasangan > 1,00 | TERPENUHI | research/16 §0 memakai kedua segmen (r1 median 1,476; r2 median 0,922 maks 1,615) |
| D-425 keamanan R2: terima #1/#2, perbaiki #7/#8/#9 | TERPENUHI | D-429 (#7 tagihan per dry-run, #8 awalan `'`, #9 OUT_NAME_UNSAFE); `OUT_NAME_UNSAFE` ada di CLI (grep E) |
| D-435 NETRAL + aturan asal-usul, lanjut R3 | TERPENUHI | D-436/D-437, uji ketiga D-456 |
| D-439 lost update + placeholder templat | TERPENUHI | D-454 R1 tertutup; diuji ulang langsung lewat jalur MCP (B2: tulisan B tetap); `TEMPLATE_PLACEHOLDER` di CLI; uji r3fix* lulus dalam A3 |
| D-442 isolasi: catat beban, andalkan asal-usul | TERPENUHI | D-445 isolasi informatif; research/16 §4.5; D 7 (`85 0`) |
| U-1..U-4 (tetap berlaku) | TERJAGA | U-1: R03 `kind=contracts` 200 dengan satu jenis `agentWorkReport`; U-2: file_verify C51=true (B1); U-3: `STUDIO_MCP_LOCK_AGENT_ID` mati bawaan (`config.ts:84`); U-4: tidak ada konversi korpus (tanpa bukti sebaliknya) |
| D-448 otonom; tanpa push; rahasia tidak dicetak | TERPENUHI | `git status -sb`: `v2.1...origin/v2.1 [ahead 7]` (tidak di-push); rahasia 0 di repo (lihat di bawah) |
| D-449 audit UI + label konfigurasi | TERPENUHI (dengan tunda tercatat) | UI-01/02/03/04 (D-459, D-463, D-464, D-467, D-468); C1-C4 |
| D-449/D-450 MCP + uji Hermes | TERPENUHI | D-460, D-462, D-469, D-470; `hermes_trial/07_*.md`, `08_*.md` ada; config Hermes kini sha `c359917cad01f2f7` (= cadangan) tanpa entri `studio` (grep 0) |
| Tujuan efisiensi (dasar R2/R3) | **TIDAK TERCAPAI** | D-458 TIDAK EFEKTIF ketat / NETRAL; KE-1 GAGAL 3/3 siklus; KE-7 GAGAL (D3); byte tulis B/A 1,060 (D4) |

Temuan review:

| Review | Status | Bukti |
|---|---|---|
| 14 (R2-07) | #1/#2 diterima USER (D-425); #3/#4 tertutup (D-427); #5-#9 tertutup (D-429). **#10-#14 (Low) tanpa disposisi**: sudah ditandai D-434 L-1 dan belum ditutup (grep `#10-#14` hanya di D-418/D-434) | **L-1** |
| 15 (R3-03) | #1-#5, #7, #10, #12-#14 tertutup; #8/#9 sebagian; #11 ditunda tercatat (D-443); #6 uji ditambah (D-446) | OK |
| 15b | N1-N11 tertutup (D-452) | OK |
| 15c | R1/R2 tertutup (D-454); R3 keterbatasan tercatat (D-453/D-454); R4/R5 diterima tercatat (D-454); R6 (aturan `own` di panduan) gugur karena pengecualian dihapus dan panduan diperbarui (`coder_execution_r3_f3.md:23`). **R7/R8 (Low) tanpa disposisi eksplisit**; R8 sebagian lewat r3fix3 7 uji | **L-1** |
| 16 (MCP-02) | M-1..M-3 tertutup dan diuji ulang di B3-B7; L-1..L-4, L-7 tertutup; L-6 sebagian; L-5 (body-parser) dan sisa L-6 ditunda tercatat (D-466) | OK |
| 17 (UI-03) | H-1, M-1..M-4, L-1, L-3, L-4, L-8 tertutup (D-467); L-2 tertutup (D-468); L-5/L-6/L-7/L-9 ditunda tercatat | OK (lihat L-6) |
| ui_audit | P1/P2/P3 tertutup; tunda tercatat (D-463); UA-M02 tertutup lewat ENG-01 (D-465, A5) | OK |

Pindai rahasia (nilai dibaca ke variabel shell, tidak dicetak): `docs_files_with_secret=0`, `scripts_src_tests_files=0`, `tracked_or_untracked_nonignored=0`. Pola `INTERNAL_API_SECRET=<20+>`: 0. URL `postgresql://u:*@`/`user:*@` di 3 berkas lama adalah placeholder (panjang sandi 1/4/4, nilai contoh). Keluaran smoke/probe/R20: 0.

## 3. Issues Found

### High
Tidak ada.

### Medium
Tidak ada untuk kode/UI/MCP. Untuk tujuan efisiensi, satu temuan wajib disajikan:
- **E-1 (efisiensi, temuan baru DC-47d)**: KF penuh arm B 106/107. R9B tidak menulis R9-F07 (tanggal laporan `2026-10-11`) di isi server rev14 maupun MD-nya. Akibatnya KE-7 di research/16 §0 berubah dari "LULUS sementara" ke **GAGAL**. Vonis gabungan tidak berubah karena KE-7 bukan gerbang keras dan KE-1 sudah gagal.

### Low
- **L-1** Review 14 Low #10-#14 masih tanpa disposisi (dibawa dari D-434 L-1); review 15c Low R7/R8 juga tanpa disposisi eksplisit di D-454.
- **L-2** `status_tasks.md` dan `findings/findings_register.md` belum memuat baris R2/R3/MCP/UI/ENG (dibawa dari D-434 L-2; tail `status_tasks.md` berhenti di "Refaktor struktur").
- **L-3** API-REF §12 (catatan MCP) tidak memuat R05.
- **L-4** `docs/STUDIO-MCP.md` baris 6-7: rujukan keputusan tidak tepat (MCP-04 = D-466, MCP-06 = D-470).
- **L-5** Register 05 §9.4 R03 tidak memuat `items[].examples` (R2-02) dan tidak menyebut perilaku kind absen -> 400 (U-07).
- **L-6** Istilah label: `essentials.ts:296` "kolom selebar Rel bukti" tidak cocok dengan nama kenop baru "Lebar kolom catatan bukti (mm)". Kenop `device.spine.*` diberi nama "teks tepi sampul", padahal penempatannya juga mencakup `pembatas` (`page.ts:324-331`).

Observasi (bukan cacat): `body-parser@2.3.0` GHSA-27r3 masuk lewat SDK -> express; tak terjangkau di stdio (D-461) dan ditunda tercatat (D-466). Heuristik audit UI `unnamed=30` di tab Riwayat adalah positif palsu (C3). Smoke `studio_draft_check` mencetak "isu 0" saat valid=false; ini hipotesis: skrip asap membaca medan `issues` yang tidak ada di bentuk ringkas, dan tidak diverifikasi lebih lanjut.

## 4. Remediation Notes (untuk controller; verifier tidak memperbaiki)

- E-1: perbarui narasi KE-7 di presentasi (dan bila perlu catatan tambahan research/16 oleh pemiliknya) dengan angka D3. Vonis D-458 tetap.
- L-1: catat disposisi review 14 #10-#14 dan 15c R7/R8 (perbaiki / terima / tunda) di `decisions.md`.
- L-2: tambahkan baris R2/R3/MCP/UI/ENG ke `status_tasks.md` dan register temuan (berkas controller).
- L-3/L-4/L-5: koreksi satu baris di masing-masing dokumen (API-REF tambah R05; STUDIO-MCP rujukan D-466/D-470; register 05 §9.4 `examples` + kind absen).
- L-6: samakan istilah opsi A `layout.railMode` dengan "kolom catatan bukti". Pertimbangkan nama spine yang mencakup pembatas.

## 5. Next Steps

1. Controller menyajikan ke USER: teknis/UI/MCP PASS; efisiensi TIDAK EFEKTIF (ketat) / NETRAL (sensitivitas) dengan KE-1 dan KE-7 GAGAL serta dua sensitivitas (FL_tpl, berkas `/tmp` R9B); opsi lanjut sesuai research/16 §12 butir 9 (Studio sebagai indeks tanya-jawab di atas MD lewat MCP; satu siklus alat U-23/U-24 tanpa klaim KE-1; atau berhenti).
2. Tutup L-1..L-6 (semuanya perubahan dokumen/teks kecil) sebelum commit lokal. Push tetap menunggu USER (D-448).
3. Fixture DEV yang dibuat verifikasi ini (misi `2026-11-01_dc47d`): dok `cmvxbzo2j02gbv1xcydyr7ada` (059) dan `cmvxbzz7h02jiv1xctf87zoxf`. Dibiarkan seperti D-408.

## 6. Bukti mentah (di luar repo)

`C:/Users/TRIAL/AppData/Local/Temp/dc47d_tsc.txt`, `dc47d_tsc_full.txt`, `dc47d_eslint.txt`, `dc47d_vitest.txt`, `dc47d_conv.txt`, `dc47d_smoke.txt`, `dc47d_smoke2.txt`, `dc47d_probe/{probe.ts,out.txt}`, `dc47d_ui/out/audit_dc47d.json` (+ 24 PNG), `dc47d_metrics/{mu1.js,r20.js,r20_out.json,kf.js,canon_head.html,canon_now.html}`, `dc47d_head/` (ekspor HEAD untuk A5).
