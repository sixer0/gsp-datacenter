---
task_slug: doc_artifact_studio
dokumen: log eksekusi deploy produksi v2.1 (metode geser port)
tanggal: 2026-11-04
agent: coder-execution (DEPLOY-EXEC)
source_plan: docs/2026-10-22_doc_artifact_studio/deploy/01_production_deploy_plan.md
keputusan: D-579, D-580, D-581, D-582, D-583, D-584, D-585
status: complete (v2.1 melayani 9011 sejak 2026-11-04 16:59:17; dua penghentian gladi sebelumnya karena lingkungan fon, lihat bagian lanjutan)
---

# Log Eksekusi Deploy Produksi Swarm HQ v2.1

Rahasia, `DATABASE_URL`, kata sandi, dan nilai `.env` tidak pernah dicetak; perintah di bawah memakai variabel (`$PROD_DB_URL`, `$CLONE_DB_URL`) yang dimuat tanpa gema. Zona waktu mesin: WIB (SEAST).

## Pilihan yang disetujui (D-582)

Metode geser port (D-580); Q-1 opsi B; Q-2 Manual 000 ikut; Q-8 keenam migrasi lewat satu `prisma migrate deploy`; Q-9 DB uji `gsp_agent_hq_v21_seedtest` boleh dibuat dan dihapus; Q-10 `STUDIO_WORKSPACE_ROOT=C:/Users/TRIAL/gsp-studio-workspace-prod`; Q-5 standby 9041 tetap hidup; Q-6/Q-7 tidak termasuk (tanpa MCP, tanpa skill, tanpa push). Tag di gsp-datacenter: tidak ada; HEAD gsp-datacenter dicatat di log.

## Langkah

| Waktu | Langkah | Perintah (disensor) | Hasil |
|---|---|---|---|
| 16:29:19 | Pra-0 keadaan awal | netstat; git rev-parse HEAD (baca) | 9011=PID 20468 (node hq-server.mjs, induk nohup 1344, dari gsp-datacenter), 9012=24832, 9010=18068, 9021=10664 (DEV, tidak disentuh), 5433=6616; 9031/9041 bebas. gsp-datacenter HEAD 0f3236767225ac5ca9607ce79f8bfd07e3dcb7b1 (ilfix-f1, tanpa berkas terlacak berubah). v2.1 HEAD 3566486 (branch v2.1). |
| 16:29:19 | Pra-0 identitas DB | db_guard $PROD_DB_URL gsp_agent_hq | OK: gsp_agent_hq |
| 16:29:47 | 1.1 Dump penuh | db_guard && pg_dump --format=custom --file=$BK/gsp_agent_hq_20261104-1629.dump $PROD_DB_URL | exit 0. BK=C:/Users/TRIAL/gsp-backups/deploy-v21-20261104-1629 (di luar repo) |
| 16:29:47 | 1.2 Verifikasi dump | pg_restore --list ... | grep -c 'TABLE DATA'; sha256sum > SHA256SUMS | 34 TABLE DATA; ukuran 2.469.690 byte; sha256 f348b7035cc07d77b13c062045f4d9beee8cef48ee1b684ec9904f3dc845a5d0 |
| 16:29:47 | 1.3 Hitungan sebelum | psql -At -F'|' -f counts.sql > counts_before.txt | 34 baris; non-nol: AgentEvent 1655, AgentRequest 761, AgentState 50, DataStore 5, HermesMemory 879, HermesTask 2680, Idea 1, OrchestrationRecord 685, WebUiUser 10, WorkerTrace 1488, _prisma_migrations 2 (sama dengan rencana §1.5) |
| 16:29:47 | 1.4 Keadaan kode lama | cat .next/BUILD_ID; git rev-parse HEAD (baca-saja) | BUILD_ID YlQORfqeqTxSBWv93p8Cb; HEAD 0f3236767225ac5ca9607ce79f8bfd07e3dcb7b1; tidak ada tag dibuat di gsp-datacenter |
| 16:30:35 | 0.2 Tag rilis (repo v2.1) | git -C gsp-swarm-hq-v2.1 tag prod-v2.1-20261104 3566486 | OK -> 35664867a77c. Tag prod-ilfix-f1-pre-v21 TIDAK dibuat (arahan: catat HEAD 0f32367 di log, tanpa tag) |
| 16:30:35 | 0.3 Checkout terpisah | git clone --no-hardlinks gsp-swarm-hq-v2.1 C:/Users/TRIAL/gsp-hq-prod-v21; git checkout -b prod-v21 3566486 | HEAD 35664867a77cda578cf9aa9c5529c6ba65ef25af, status bersih. Folder DEV v2.1 (9021) tidak dibuild |
| 16:30:35 | 0.4 Env + sertifikat | cp gsp-datacenter/.env $NEW/.env; cp certs/hq-key.pem hq-cert.pem $NEW/certs/; printf STUDIO_WORKSPACE_ROOT >> $NEW/.env | 16 nama prod (prefiks byte-identik dengan .env prod) + STUDIO_WORKSPACE_ROOT=C:/Users/TRIAL/gsp-studio-workspace-prod (folder dibuat, tidak di dalam SHARED_WORKSPACE). git status bersih; check-ignore: .env, certs/ diabaikan |
| 16:31:36 | 0.5 Dependensi | cd $NEW && npm ci | exit 0; 645 paket; postinstall root 'prisma generate' sukses (Prisma Client 6.19.2). npm 11.16 melewati skrip install dependensi (allow-scripts): @prisma/client, @prisma/engines, esbuild, prisma, sharp, unrs-resolver; dicek: query_engine-windows.dll.node, schema-engine-windows.exe, @img/sharp-win32-x64 ada, identik dengan repo DEV. 34 vulnerabilities npm audit (dicatat, tidak diubah) |
| 16:32:31 | 0.6 Build produksi | cd $NEW && npm run build | exit 0; 'Compiled successfully in 7.7s', 61 halaman statis; BUILD_ID fzDk38CCDe9s5uz60zImC; 1 peringatan Turbopack (pola file lebar storage/mission.ts:61, hanya relevan untuk tracing standalone; tidak dipakai) |
| 16:32:31 | 0.6b Typecheck | cd $NEW && npx tsc --noEmit | exit 0 (bukti segar pada checkout produksi) |
| 16:32:31 | 0.7 Lingkungan render | ls chrome.exe (ms-playwright chromium-1234) soffice.com | keduanya ada |
| 16:32:55 | 2.1 Klon produksi | CREATE DATABASE gsp_agent_hq_v21_seedtest; db_guard; pg_restore --no-owner --dbname=$CLONE_DB_URL dump; counts -> counts_clone.txt; diff | restore exit 0; diff counts_before vs counts_clone KOSONG (34 tabel identik) |
| 16:33:23 | 2.2 Migrasi klon | cd $NEW && db_guard && DATABASE_URL=$CLONE_DB_URL npx prisma migrate deploy; ... migrate status | exit 0; 6x 'Applying migration' (20260927154000, 20260927170000, 20261022120000, 20261023150000, 20261023200000, 20261030220000); status 'Database schema is up to date!', Datasource gsp_agent_hq_v21_seedtest |
| 16:33:23 | 2.3 Drift pasca-migrasi (tinjauan, tidak diterapkan) | prisma migrate diff --from-url $CLONE_DB_URL --to-schema-datamodel prisma/schema.prisma --script > $BK/clone_post_migrate_drift.sql | LULUS: hanya 7 pernyataan SQL-tangan yang diharapkan: DROP INDEX ilsearchdoc_source_idx/trgm_body/trgm_title/tsv_gin, DROP INDEX StudioDocBlock_tsv_idx, ALTER IlSearchDoc.tsv dan StudioDocBlock.tsv DROP DEFAULT. Tidak ada yang lain |
| 16:35:18 | 2.4 Seed klon | DATABASE_URL=$CLONE_DB_URL npx tsx prisma/seed-studio.ts: (1) --import-benchmark --import-datum-gsp (2) --presets-and-skeletons --import-manual000-v2 (3) --contract-templates (4)=(2) ulang (5)=(3) ulang | Semua exit 0, 0 log error/warn; database=gsp_agent_hq_v21_seedtest di semua log. Jalan 1-3: created; jalan 4: 6x outcome unchanged, tanpa kode tulis; jalan 5: unchanged. Klon: StudioSectionType 52, StudioTemplate 7, StudioTemplateVersion 10, StudioTemplateSlot 43, StudioTemplateSlotParam 55, 16 tabel Studio lain 0 |
| 16:35:00 | 2.5a Peluncur terlepas | tulis `$BK/start-hq.sh` (nohup node hq-server.mjs; HQ_PORT/HQ_HOSTS opsional; override nama DB dihitung dari .env folder target, tidak muncul di cmdline) dan `$BK/spawn-detached.ps1` (Invoke-CimMethod Win32_Process Create, `bash.exe -lc` tersembunyi) | Proses dibuat di luar pohon proses dan paket aplikasi sesi agen, meniru autostart (`bash -lc` tersembunyi) |
| 16:35:18 | 2.5b Kode baru 9031 + kode lama 9041 (loopback) pada klon | spawn-detached: `start-hq.sh $NEW $ECO/hq-v21-gladi.log 9031 127.0.0.1 gsp_agent_hq_v21_seedtest`; `start-hq.sh gsp-datacenter $ECO/hq-9041-gladi.log 9041 127.0.0.1 gsp_agent_hq_v21_seedtest` | 9031 PID 7876, 9041 PID 20828, keduanya `/login` 200. pg_stat_activity + pemilik soket (`netstat -ano`): 7876 dan 20828 hanya terhubung ke gsp_agent_hq_v21_seedtest; 20468 (prod 9011) dan 22680 ke gsp_agent_hq |
| 16:36:18 | 2.5c Smoke kode baru (9031, klon) | §7 S-1..S-10 (`curl -sk`, header x-internal-secret dimuat tanpa gema) | S-1 /login 200, / 307; S-2 200; S-3 200; S-4 400 REGISTRY_KIND_UNKNOWN tanpa `?kind` (perintah rencana kurang parameter), dengan `?kind=sections` 200, count 52 = LULUS; S-5 200 (datum-kanonik, datum-gsp, kedua preset, datum-manual-000*, laporan-kerja-agen); **S-6 200 tetapi `readiness.ready=false`: 10 dari 22 fon "font not registered in HKCU" = GAGAL**; S-7 200 valid:false + issues; S-8 404 ROUTE_NOT_FOUND; S-9 200; S-10 /studio 307 ke /login?next=%2Fstudio |
| 16:38:00 | 2.5d Kode lama (9041) pada klon termigrasi (§2.4) | `/login`; `/api/brahma/health`; `/api/information-library?q=test` | 200; 200; 200. Respons IL sama dengan kode baru: 48.047.390 byte, 8.756 entri, kunci sama (entries, domainCounts, projectCounts, typeCounts, statusCounts, total, lastSync). Kompatibilitas mundur TERBUKTI |
| 16:37:00 | 2.5e Diagnosis S-6 | `reg query HKCU\...\Fonts` dari shell agen (sandbox dan non-sandbox) vs dari proses buatan WMI (= lingkungan nyata autostart/watchdog); `$BK/regtest.mjs` memakai `parseRegQuery` kode produksi; `$BK/realview.sh` | Shell agen: 22/22 nilai. Lingkungan nyata: 12/22 (parser kode: 16 nilai, Mono-Italic undefined). 10 nilai TIDAK ADA di hive nyata: DejaVu Sans Book, IBMPlexMono-Italic, IBMPlexMono-SemiBold, IBMPlexMono-SemiBoldItalic, IBMPlexSans-Italic, IBMPlexSans-SemiBoldItalic, IBMPlexSansCond-Italic, IBMPlexSansCond-SemiBold, IBMPlexSansCond-SemiBoldItalic, Inter-Regular (semua "(TrueType)"). Berkas .ttf kesepuluhnya ADA di disk nyata. Hipotesis (belum dibuktikan langsung): virtualisasi registri paket MSIX aplikasi Claude; tulisan HKCU sesi agen sebelumnya masuk hive privat paket. Dampak: `service.ts:166` dan `render.ts:310` menolak PDF dengan PDF_ENGINE_UNAVAILABLE pada proses produksi; DOCX/HTML tidak terdampak. Bukti D-35 "ready=true 22/22" diukur dari dalam paket |
| 16:41:00 | 2.6 Ekspor data Studio dari klon | `db_guard klon && pg_dump --format=custom --data-only -t <21 tabel Studio> --file=$BK/studio_seed_from_clone_20261104-1629.dump $CLONE_DB_URL` | Percobaan pertama gagal karena salah kutip di perintah saya ("no matching tables"); berkas kosong buatan saya dan baris SHA-nya dihapus. Ulang dengan array argumen: exit 0, peringatan FK melingkar StudioTemplateVersion (diharapkan), 21 TABLE DATA, sha256 27a84db7b94796362edbc064012cf3e63483cc0177f0068d142eee6bd99478ca; `studio_counts_clone.txt` 21 baris |
| 16:42:00 | 2.7 Hentikan instans gladi | `taskkill //PID 7876 //T //F`; `taskkill //PID 20828 //T //F` (keduanya dibuat sesi ini, cmdline `node hq-server.mjs` dan waktu buat 16:35 diverifikasi) | SUCCESS keduanya; 9031/9041 bebas; 9011 tetap PID 20468, `/login` 200 |
| 16:43:00 | STOP (aturan 2) | - | Gladi S-6 GAGAL, jadi BERHENTI sebelum menyentuh DB produksi. Fase 3, fase 4, dan pembaruan peluncur TIDAK dijalankan |
| 16:43:30 | Verifikasi tidak tersentuh | psql: count `_prisma_migrations`, tabel `Studio%`, `pg_trgm`; counts.sql vs counts_before; `git status` gsp-datacenter (baca) | `_prisma_migrations` 2; tabel Studio 0; pg_trgm 0; diff hitungan KOSONG; gsp-datacenter 0 berkas terlacak berubah, 55 untracked (sama), HEAD 0f32367 |

Catatan waktu: kolom Waktu adalah saat entri dicatat; beberapa entri dicatat bersamaan sesudah langkahnya selesai (urutan sesuai eksekusi).

## Hasil

**Status: needs-review (BERHENTI pada aturan 2).** Gladi fase 2 gagal di satu cek (S-6 kesiapan render-env). DB produksi, port 9011/9041, dan peluncur tidak diubah. Produksi tetap kode lama (PID 20468 di 9011, `gsp-datacenter` 0f32367).

| Butir | Keadaan |
|---|---|
| Port 9011 | Kode lama, PID 20468 (tidak disentuh), `/login` 200 |
| Port 9041 / 9031 | Bebas (instans gladi dihentikan) |
| DB produksi `gsp_agent_hq` | Tidak berubah: `_prisma_migrations` 2 baris, 0 tabel Studio, tanpa `pg_trgm`, hitungan identik dengan cadangan |
| Cadangan | `C:/Users/TRIAL/gsp-backups/deploy-v21-20261104-1629/gsp_agent_hq_20261104-1629.dump`, 2.469.690 byte, sha256 `f348b7035cc07d77b13c062045f4d9beee8cef48ee1b684ec9904f3dc845a5d0`, `pg_restore --list` 34 TABLE DATA |
| Checkout baru | `C:/Users/TRIAL/gsp-hq-prod-v21`, branch `prod-v21` @ 3566486, `.env` produksi + `STUDIO_WORKSPACE_ROOT`, sertifikat, `npm ci` + build OK (BUILD_ID `fzDk38CCDe9s5uz60zImC`), tsc 0, git bersih |
| Tag | `prod-v2.1-20261104` ke 3566486 di repo v2.1 (lokal, tidak di-push). Tidak ada tag di gsp-datacenter |
| DB uji | `gsp_agent_hq_v21_seedtest` DIBIARKAN (sudah termigrasi 8/8 dan diseed) agar gladi ulang S-6 cepat. Hapus bila tidak dilanjutkan: `psql "${PROD_DB_URL%/*}/postgres" -c 'DROP DATABASE "gsp_agent_hq_v21_seedtest"'` |
| Seed siap salin | `studio_seed_from_clone_20261104-1629.dump` (21 TABLE DATA) dan `studio_counts_clone.txt` di folder cadangan |
| Peluncur persisten | Tidak diubah |
| Berkas buatan sesi ini di luar repo | folder cadangan (dump, SHA256SUMS, counts*, `start-hq.sh`, `spawn-detached.ps1`, `regtest.*`, `realview.*`), `C:/Users/TRIAL/gsp-studio-workspace-prod/` (kosong), `$ECO/hq-v21-gladi.log(.pid)`, `$ECO/hq-9041-gladi.log(.pid)` |

### Lulus di gladi

Migrasi 6/6 pada klon data produksi nyata; drift hanya SQL-tangan yang diharapkan; seed 5 jalan (2 jalan ulang `unchanged`); smoke S-1, S-2, S-3, S-4 (dengan `?kind=sections`), S-5, S-7, S-8, S-9, S-10; kode lama berjalan normal pada skema baru (respons IL sama).

### Gagal di gladi: S-6

Proses yang dijalankan seperti autostart/watchdog (di luar paket aplikasi Claude) hanya melihat 12 dari 22 nilai registri fon HKCU yang diwajibkan `render-env/manifest.json`. Akibatnya `readiness.ready=false` dan render PDF Studio ditolak (`PDF_ENGINE_UNAVAILABLE`). Berkas fon ada; yang hilang hanya 10 nilai registri. Ini masalah lingkungan mesin, bukan kode, dan juga akan terjadi pada v2.1 yang dinyalakan autostart setelah reboot Senin.

### Keputusan yang dibutuhkan (controller ke USER)

1. **Perbaiki lingkungan lalu lanjutkan (rekomendasi).** Pengguna menjalankan 10 perintah `reg add` di bawah dari jendela cmd yang dibuka dari menu Start (BUKAN terminal di dalam aplikasi Claude, yang kemungkinan ikut tervirtualisasi). Setelah itu DEPLOY-EXEC dijalankan ulang: gladi diulang mulai 2.5 (klon dan ekspor seed sudah siap), lalu fase 3-4 dan peluncur.
2. **Terima risiko:** deploy tanpa PDF (DOCX/HTML tetap jalan), fon diperbaiki kemudian. Butuh keputusan eksplisit karena S-6 adalah cek gladi.
3. **Batalkan:** hapus DB uji (perintah di atas); checkout baru boleh dibiarkan.

Perintah perbaikan (per-pengguna, HKCU, tanpa admin; jalankan di cmd biasa):

```bat
set K=HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts
set D=C:\Users\TRIAL\AppData\Local\Microsoft\Windows\Fonts
reg add "%K%" /v "DejaVu Sans Book (TrueType)" /t REG_SZ /d "%D%\DejaVuSans.ttf" /f
reg add "%K%" /v "IBMPlexMono-Italic (TrueType)" /t REG_SZ /d "%D%\IBMPlexMono-Italic.ttf" /f
reg add "%K%" /v "IBMPlexMono-SemiBold (TrueType)" /t REG_SZ /d "%D%\IBMPlexMono-SemiBold.ttf" /f
reg add "%K%" /v "IBMPlexMono-SemiBoldItalic (TrueType)" /t REG_SZ /d "%D%\IBMPlexMono-SemiBoldItalic.ttf" /f
reg add "%K%" /v "IBMPlexSans-Italic (TrueType)" /t REG_SZ /d "%D%\IBMPlexSans-Italic.ttf" /f
reg add "%K%" /v "IBMPlexSans-SemiBoldItalic (TrueType)" /t REG_SZ /d "%D%\IBMPlexSans-SemiBoldItalic.ttf" /f
reg add "%K%" /v "IBMPlexSansCond-Italic (TrueType)" /t REG_SZ /d "%D%\IBMPlexSansCond-Italic.ttf" /f
reg add "%K%" /v "IBMPlexSansCond-SemiBold (TrueType)" /t REG_SZ /d "%D%\IBMPlexSansCond-SemiBold.ttf" /f
reg add "%K%" /v "IBMPlexSansCond-SemiBoldItalic (TrueType)" /t REG_SZ /d "%D%\IBMPlexSansCond-SemiBoldItalic.ttf" /f
reg add "%K%" /v "Inter-Regular (TrueType)" /t REG_SZ /d "%D%\Inter-Regular.ttf" /f
```

Verifikasi dari lingkungan nyata (oleh agen): jalankan `$BK/realview.sh` lewat `spawn-detached.ps1`; harapannya 22 nilai.

### Catatan untuk eksekusi lanjutan

- Proses produksi harus dibuat di luar paket aplikasi Claude (`spawn-detached.ps1` + `start-hq.sh`, atau terminal pengguna sendiri), sesuai catatan rencana §5.
- Perintah S-4 di rencana perlu `?kind=sections` (tanpa itu, 400 `REGISTRY_KIND_UNKNOWN` adalah perilaku yang benar).
- Peringatan untuk `gsp-datacenter/scripts/hq_restart.mjs` belum ditulis karena swap belum terjadi.
- Rollback: tidak diperlukan (produksi tidak berubah).

## Lanjutan setelah D-584 (perbaikan fon oleh controller atas izin USER)

| Waktu | Langkah | Perintah (disensor) | Hasil |
|---|---|---|---|
| 16:50:04 | R-0 Arahan lanjutan | pesan controller: lanjutkan dari 2.5; jangan pakai -File/-ExecutionPolicy Bypass | Diterima. D-584: USER mengizinkan reg add; controller menjalankan fontfix.bat lewat WMI (fontfix.log: 10x completed successfully) |
| 16:50:04 | R-1 Peluncur tanpa -File | fungsi spawn_out: powershell -NoProfile -NonInteractive -EncodedCommand <Invoke-CimMethod Win32_Process Create, bash.exe -lc tersembunyi>; execution policy tidak diubah, tanpa Bypass | Bekerja (ReturnValue=0) |
| 16:50:04 | R-2 Verifikasi fon independen | spawn_out $BK/realview.sh (lingkungan nyata, di luar aplikasi) | realview.txt baru 16:49:42: 22/22 nilai HKCU (sebelumnya 12), 10 berkas ada. Salinan versi controller: realview_controller_1648.txt |
| 16:53:32 | R-3 Gladi 2.5 ulang: kode baru 9031 pada klon (di luar aplikasi) | spawn_out "$BK/start-hq.sh $NEW $ECO/hq-v21-gladi.log 9031 127.0.0.1 gsp_agent_hq_v21_seedtest" | PID 18448, /login 200 pada percobaan pertama |
| 16:53:32 | R-4 Smoke 9031 | smoke.sh (S-4 kini ?kind=sections) + rincian S-6 | S-1 200/307; S-2 200; S-3 200; S-4 200 count 52; S-5 200, 7 slug: datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen; S-7 200 valid:false; S-8 404 ROUTE_NOT_FOUND; S-9 200 (48.047.390 B); S-10 307 /login?next=%2Fstudio. **S-6: ready=false; 22/22 fon terdaftar dan sha256 cocok, soffice 24.2.3.2 dan chromium ada, tetapi 4 galat 'font family not loaded in session: IBM Plex Serif' (Regular, Italic, Bold, BoldItalic) = GAGAL** |
| 16:53:32 | R-5 Diagnosis S-6 kedua | spawn_out realview2.sh / realfamilies.sh (GDI+ InstalledFontCollection) / realfiles9.sh di lingkungan nyata | Hive HKCU nyata: 9 nilai lama (Plex Serif x4, Sans Condensed x2, Mono Regular/Bold, Sans SemiBold) masih NAMA POLOS (mis. 'IBMPlexSerif-Regular.ttf'); perbaikan path absolut D-35 hanya mendarat di hive tervirtualisasi. Nama polos ditafsirkan relatif C:\Windows\Fonts sehingga tidak dimuat saat logon. Keluarga sesi nyata: ada IBM Plex Mono, Mono SemiBold, Sans, Sans Condensed, Sans Condensed SemiBol, Sans SemiBold SemiBold, Serif SmBld, DejaVu*, Inter; TIDAK ADA 'IBM Plex Serif'. Kesembilan berkas .ttf ada di disk nyata. readiness-rules menerima nama polos untuk 'registered' (D-36), sehingga hanya cek keluarga sesi yang gagal |
| 16:53:32 | R-6 Hentikan instans gladi | taskkill //PID 18448 //T //F (cmdline dan waktu buat 16:50:05 diverifikasi) | SUCCESS; 9031 bebas; 9011 tetap PID 20468 |
| 16:53:32 | R-7 STOP (aturan 2) kedua | - | S-6 masih gagal, jadi BERHENTI sebelum fase 3. DB produksi: _prisma_migrations 2, tabel Studio 0; 9011 /login 200. Perbaikan disiapkan TANPA dijalankan: $BK/fontfix2.bat (reg export cadangan lalu 9x reg add path absolut) dan $BK/fontload_session.sh (AddFontResourceW 9 fon + siaran WM_FONTCHANGE, isi di fontload_session.ps1.txt). Keduanya perubahan lingkungan di luar izin D-584 (yang hanya mencakup 10 reg add), jadi butuh persetujuan |

### Hasil lanjutan: needs-review (berhenti lagi pada aturan 2)

S-6 masih gagal setelah D-584. Pendaftaran fon kini lengkap (22/22), tetapi keluarga "IBM Plex Serif" (4 wajah reguler) tidak dimuat di sesi Windows. Penyebabnya, 9 nilai HKCU lama di hive nyata masih berisi nama berkas polos; perbaikan D-35 hanya mendarat di hive tervirtualisasi aplikasi. Produksi tetap tidak berubah.

Perbaikan yang diusulkan (butuh persetujuan; keduanya dijalankan di luar aplikasi, mis. lewat WMI seperti D-584):

1. `cmd.exe /c C:\Users\TRIAL\gsp-backups\deploy-v21-20261104-1629\fontfix2.bat`: mengekspor kunci fon HKCU sebagai cadangan (`hkcu_fonts_before_fontfix2.reg`), lalu mengubah 9 nilai ke path absolut. Ini membuat fon dimuat pada logon berikutnya.
2. `bash -lc C:/Users/TRIAL/gsp-backups/deploy-v21-20261104-1629/fontload_session.sh`: memuat 9 fon ke sesi berjalan sekarang (AddFontResourceW + WM_FONTCHANGE), tanpa logout. Alternatifnya logout/login, tetapi itu mematikan semua proses pengguna, termasuk HQ produksi.

Setelah itu: verifikasi `realfamilies.sh` (harus ada "IBM Plex Serif"), lalu ulangi gladi 2.5. Server baru membaca kesiapan sekali per 5 menit (cache), jadi instans gladi dijalankan SESUDAH fon dimuat.

## Lanjutan setelah D-585 (perbaikan fon kedua oleh controller)

| Waktu | Langkah | Perintah (disensor) | Hasil |
|---|---|---|---|
| 16:57:25 | T-1 Verifikasi fon sesi independen | baca fontload_session2.log; spawn_out $BK/realfamilies.sh (lingkungan nyata) | 9 fon added=1 + WM_FONTCHANGE; realfamilies.txt baru 16:56:12 memuat 'IBM Plex Serif' (juga Mono, Mono SemiBold, Sans, Sans Condensed, Sans SemiBold, Serif SmBld) |
| 16:57:25 | T-2 Gladi 2.5 baru: kode baru 9031 pada klon (di luar aplikasi, cache kesiapan segar) | spawn_out "$BK/start-hq.sh $NEW $ECO/hq-v21-gladi.log 9031 127.0.0.1 gsp_agent_hq_v21_seedtest" | PID 32008, /login 200 |
| 16:57:25 | T-3 Smoke 9031 | smoke.sh S-1..S-10 + rincian S-6 | SEMUA LULUS. S-1 200/307; S-2 200; S-3 200; S-4 200 count 52; S-5 200, 7 slug; **S-6 200 ready=true, 22/22 terdaftar, 22/22 sha256, soffice 24.2.3.2, chromium ada, errors []**; S-7 200 valid:false; S-8 404 ROUTE_NOT_FOUND; S-9 200; S-10 307 /login?next=%2Fstudio. Kode lama 9041 pada klon sudah lulus di 2.5d (tidak berubah sejak itu) |
| 16:57:25 | T-4 Hentikan instans gladi | taskkill //PID 32008 //T //F (cmdline/waktu diverifikasi) | SUCCESS. Gladi fase 2 LULUS seluruhnya -> lanjut fase 3 |
| 16:58:42 | 3.1 Status awal produksi | cd $NEW && db_guard $PROD_DB_URL gsp_agent_hq && npx prisma migrate status | Datasource gsp_agent_hq; 6 tertunda (sama dengan §1.3), exit 1 (wajar) |
| 16:58:42 | 3.2 Migrasi produksi | db_guard && npx prisma migrate deploy; npx prisma migrate status | exit 0; 6x Applying (16:57:39-16:57:40); 'All migrations have been successfully applied'; status 'Database schema is up to date!'; _prisma_migrations 8 baris, semua finished_at terisi, rolled_back_at kosong |
| 16:58:42 | 3.3 Kesehatan 9011 lama | curl /login; /api/brahma/health; /api/information-library?q=test (x-internal-secret) | 200; 200; IL 200, 48.050.666 B, 8.757 entri, kunci sama (fallback LIKE bekerja dengan IlSearchDoc kosong) |
| 16:58:42 | 3.4 Salin data Studio (opsi B) | sha256sum -c SHA256SUMS (OK x2); cek StudioTemplate=0, StudioSectionType=0; db_guard && pg_restore --data-only --single-transaction --disable-triggers --dbname=$PROD_DB_URL studio_seed_from_clone_20261104-1629.dump | exit 0, satu transaksi |
| 16:58:42 | 3.5 Verifikasi | counts.sql -> counts_after_seed.txt; diff studio_counts_clone vs studio_counts_prod; banding non-Studio | 21 tabel Studio IDENTIK dengan klon: SectionType 52, Template 7, TemplateVersion 10, TemplateSlot 43, TemplateSlotParam 55, 16 lainnya 0. Non-Studio: hanya _prisma_migrations 2->8, tidak ada yang berkurang. 56 tabel (34 + 21 Studio + IlSearchDoc). pg_trgm ada; IlSearchDoc 0. Templat: lihat T-5 |
| 16:58:54 | T-5 Templat produksi | psql select slug from StudioTemplate | datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen |
| 17:01:00 | 4.1 Standby lama 9041 (loopback, DB produksi) | spawn_out "$BK/start-hq.sh /c/Users/TRIAL/gsp-datacenter $ECO/hq-9041.log 9041 127.0.0.1 -" | PID 31428 di 127.0.0.1:9041; /login 200; /api/brahma/health 200; terhubung ke DB produksi |
| 17:01:00 | 4.2 Identifikasi listener 9011 | netstat; Get-CimInstance Win32_Process ProcessId=20468 | PID 20468, induk 1344 (nohup), dibuat 2026-11-02 17:34:54, cmdline node hq-server.mjs, tanpa anak; sesuai rencana |
| 17:01:00 | 4.3 Hentikan 9011 lama | taskkill //PID 20468 //T //F (16:59:15.4) | SUCCESS; port bebas pada cek pertama |
| 17:01:00 | 4.4 Jalankan v2.1 di 9011 | spawn_out "$BK/start-hq.sh $NEW $ECO/hq-v21.log - - -" (tanpa HQ_PORT/HQ_HOSTS = 9011, 0.0.0.0; DB dari .env = produksi) | PID 35600 di 0.0.0.0:9011; log 'HQ production: https://0.0.0.0:9011'; /login 200 pada 16:59:17 -> downtime sekitar 2 detik |
| 17:01:00 | 4.5 Smoke §7 produksi | smoke.sh terhadap https://localhost:9011 + RBAC + standby + DB | S-1 /login 200, / 307, juga 200 via IP LAN; S-2 200; S-3 200; S-4 200 count 52; S-5 200, 7 slug; S-6 ready=true (22/22, errors []); S-7 200 valid:false; S-8 404 ROUTE_NOT_FOUND; S-9 200 (48.050.666 B); S-10 tanpa sesi: /, /brahma, /information-library, /orchestration, /dispatch-kpi, /studio semua 307 ke /login?next=... (login interaktif peramban butuh kredensial pengguna, TIDAK dilakukan agen); S-11 /api/brahma/rbac dengan x-rbac-token 200 (10 pengguna), tanpa token 401, WebUI 9012 /health 200; S-12 9041 /login 200 lokal, via IP LAN tidak terjangkau (000), listener 127.0.0.1 saja; S-13 migrate status up to date, _prisma_migrations 8, tidak ada tabel non-Studio berkurang. Tidak ada kegagalan kritis -> rollback TIDAK diperlukan |
| 17:04:25 | 5.1 Peluncur: cadangan + gsp-ecosystem-start.sh | spawn_out $BK/launcher_edit.sh (di luar aplikasi): cp -p ke .bak-20261104-deploy (keduanya); sed baris cd HQ seksi 6 saja (match=1) | start.sh: baris 119 'cd gsp-datacenter' diganti 'cd C:/Users/TRIAL/gsp-hq-prod-v21' + 2 baris komentar (rollback ke .bak; larangan gsp-datacenter/scripts/hq_restart.mjs, pakai $NEW/scripts/hq_restart.mjs). Baris 60 hermes-bridge tidak disentuh. bash -n OK. LF dipertahankan (127->129 baris). sha baru 3fc38f68...; cadangan ae866b35... Skrip yang sama berhenti aman di watchdog (match=0, tidak ada perubahan) |
| 17:04:25 | 5.2 Peluncur: watchdog-webui-hq.py | launcher_edit2.sh (berhenti aman, match=0: escape backslash grep); launcher_edit3.sh (grep -F, sed -i) -> sed MSYS mengubah seluruh CRLF jadi LF (efek samping, isi lain sama); launcher_edit4.sh: watchdog_edit.py (python -I) menulis ulang dari cadangan secara byte-exact | Akhir: hanya baris cwd HQ (123) diganti 'C:\Users\TRIAL\gsp-hq-prod-v21' + 1 baris komentar; CRLF utuh (CR 177/LF 177); diff --strip-trailing-cr = 1 baris -> 2 baris; compile OK; sha baru d84a5d71...; cadangan b9580498... (identik dengan asli). cwd/env bridge (gsp-datacenter/hermes-bridge, gsp-datacenter/.env) tidak disentuh. Edit dilakukan di luar aplikasi karena AppData tervirtualisasi untuk proses aplikasi; tampilan nyata dan tampilan aplikasi diverifikasi sama |
| 17:04:25 | 5.3 hq_restart.mjs lama | tidak diedit (gsp-datacenter tidak boleh diubah) | Didokumentasikan di komentar start.sh baris 120 dan di log ini: gsp-datacenter/scripts/hq_restart.mjs membunuh listener 9011 lalu menyalakan KODE LAMA dari gsp-datacenter di 9011 (rollback diam-diam). Untuk restart v2.1 pakai: node C:/Users/TRIAL/gsp-hq-prod-v21/scripts/hq_restart.mjs (ROOT = folder skrip). Standby 9041 TIDAK dimasukkan ke autostart (Q-4 opsional; tidak diminta) |
| 17:04:25 | 5.4 S-14 log (5 menit pertama) | grep hq-v21.log, hq-9041.log, bridge.log | hq-v21.log: 0 'request error' (satu-satunya kecocokan 'error' adalah 'errors':[] pada RENDER_ENV_READY; satu warn ROUTE_NOT_FOUND dari smoke S-8). hq-9041.log: 0 'request error'. bridge.log: 'kanban list failed: Unterminated string in JSON' tiap ~30 dtk SUDAH ADA sejak 2026-09-02 (129.607 baris 'kanban list failed' sejak 2026-08-24), tidak terkait deploy; tidak ada AgentRequest baru sejak 2026-10-25 sehingga siklus dispatch nyata tidak teramati |
| 17:09:48 | 6.1 Hapus DB uji | cek pg_stat_activity seedtest = 0; DROP DATABASE "gsp_agent_hq_v21_seedtest" (Q-9) | DROP DATABASE; tersisa: gsp_agent_hq, gsp_agent_hq_v21, gsp_agent_hq_v21_shadow, gsp_agent_hq_v21_uji, ilfix_uji, jira_clone, postgres, template0/1 (tidak ada yang lain disentuh) |
| 17:09:48 | 6.2 Observasi 10 menit + keadaan akhir | netstat; curl; grep request error; git status (baca) | 17:09: 9011 PID 35600 (v2.1, 0.0.0.0) /login 200, / 307; 9041 PID 31428 (lama, 127.0.0.1) /login 200; 0 'request error' di hq-v21.log dan hq-9041.log; $NEW bersih @3566486; gsp-datacenter 0 berkas terlacak berubah @0f32367; 9010/9012/9021 tidak berubah. S-14 LULUS |

## Hasil akhir: complete

| Butir | Keadaan |
|---|---|
| Port 9011 | **v2.1**, PID 35600, bind 0.0.0.0, cwd `C:\Users\TRIAL\gsp-hq-prod-v21` (branch `prod-v21` @ 3566486, tag `prod-v2.1-20261104` di repo v2.1, BUILD_ID `fzDk38CCDe9s5uz60zImC`), log `C:\Users\TRIAL\gsp-ecosystem\hq-v21.log` |
| Port 9041 | Standby kode lama, PID 31428, bind 127.0.0.1 saja, cwd `C:\Users\TRIAL\gsp-datacenter` (@0f32367, BUILD_ID `YlQORfqeqTxSBWv93p8Cb`), DB produksi, log `hq-9041.log`. Tetap hidup (Q-5) |
| Downtime | sekitar 2 detik (16:59:15.4 sampai 16:59:17) |
| Migrasi produksi | 6 diterapkan lewat satu `prisma migrate deploy`: 20260927154000_add_ilsearchdoc, 20260927170000_agentrequest_requestedby_backfill, 20261022120000_add_studio, 20261023150000_worker_trace_baseline, 20261023200000_add_studio_structure, 20261030220000_add_studio_contract. `_prisma_migrations` 8 baris; status up to date |
| Data Studio produksi | StudioSectionType 52, StudioTemplate 7, StudioTemplateVersion 10, StudioTemplateSlot 43, StudioTemplateSlotParam 55, 16 tabel Studio lain 0. Templat: datum-gsp, datum-gsp-preset, datum-kanonik, datum-kanonik-preset, datum-manual-000, datum-manual-000-preset, laporan-kerja-agen |
| Smoke | S-1..S-9 LULUS; S-10 sisi server LULUS (login interaktif peramban belum, butuh kredensial pengguna); S-11 RBAC LULUS; S-12 LULUS; S-13 LULUS; S-14 10 menit LULUS |
| Peluncur | `gsp-ecosystem-start.sh` (cadangan `.bak-20261104-deploy`) dan `watchdog-webui-hq.py` (cadangan `.bak-20261104-deploy`) diarahkan ke `gsp-hq-prod-v21`; bridge tetap dari gsp-datacenter |
| Cadangan | `C:\Users\TRIAL\gsp-backups\deploy-v21-20261104-1629\gsp_agent_hq_20261104-1629.dump` (2.469.690 B, sha256 f348b703...45a5d0) |
| DB uji | `gsp_agent_hq_v21_seedtest` dihapus |

### Perintah rollback (R-A + peluncur)

Jalankan dari Git Bash di LUAR aplikasi Claude (terminal pengguna sendiri). Proses yang dinyalakan dari dalam aplikasi bisa mati bersama aplikasi.

```bash
# 1) hentikan v2.1 di 9011 dan standby di 9041 (cek PID dulu: netstat -ano -p tcp | grep -E ':(9011|9041)\s.*LISTENING')
taskkill //PID 35600 //T //F
taskkill //PID 31428 //T //F
# 2) jalankan kode lama di 9011 persis seperti autostart
cd /c/Users/TRIAL/gsp-datacenter && nohup node hq-server.mjs >> /c/Users/TRIAL/gsp-ecosystem/hq.log 2>&1 &
curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:9011/login   # harapan 200
# 3) kembalikan peluncur persisten
cp -p /c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh.bak-20261104-deploy /c/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh
cp -p /c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py.bak-20261104-deploy /c/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py
```

DB tidak perlu diputar balik (R-B): objek baru aditif dan kode lama terbukti berjalan di skema baru (gladi 2.5d, 3.3, standby 9041). Pemulihan dump penuh (R-D) hanya upaya terakhir sesuai rencana §8.

### Catatan

- Restart v2.1: `node C:/Users/TRIAL/gsp-hq-prod-v21/scripts/hq_restart.mjs`. JANGAN `gsp-datacenter/scripts/hq_restart.mjs`, karena skrip itu menyalakan kode lama di 9011.
- Pada sesi ini proses produksi dibuat lewat WMI (`spawn_out` + `$BK/start-hq.sh`) supaya bertahan setelah sesi agen berakhir dan melihat registri/berkas nyata.
- Perbaikan lingkungan (D-584, D-585): 10 nilai fon HKCU ditambahkan, 9 nilai diubah ke path absolut (cadangan `hkcu_fonts_before_fontfix2.reg`), dan 9 fon dimuat ke sesi. Setelah logon berikutnya (mis. restart Senin 05:00) fon termuat dari registri.
- Belum: login peramban interaktif (S-10) dan satu siklus dispatch agen nyata (tidak ada AgentRequest baru sejak 2026-10-25). Q-6/Q-7 tetap di luar lingkup (tanpa MCP, skill, atau push).
- Galat bridge `kanban list failed` sudah ada sejak 2026-09-02, tidak terkait deploy.
