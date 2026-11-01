---
task_id: doc_artifact_studio
task_row: HARNESS3 + H3-F (D-432 decisions.md:437, D-437 :442, D-440 :445; protokol research/15 §5, §6.2, §6.3, §9, §10, §11 HS-1..HS-9); penyelarasan dok R3-H (D-441 :446, D-442 :447, D-443 :448; protokol research/15 §21)
date: 2026-10-31
agent: coder-execution
amended_by: R3-H (2026-11-01, data-analyst, dok saja): isolasi informatif D-442, postcheck MD-native memakai `studio-report check`, pemanasan cache dan prompt W/M; lihat §9. Kode `ab3.py` milik H3-G; butir yang belum dilaporkan H3-G ditandai [menunggu H3-G]
status: complete
inputs: research/15_contract_efficiency_protocol_r3.md (utuh); hermes_trial/05_retrial_harness.md (utuh); Temp/hermes_trial/harness_ab2/ab2.py + bin/ + smoke_test.sh (baca saja); skema state.db dan kanban.db (dibaca dari SALINAN)
---

# Runner uji ketiga kontrak A/B (HARNESS3): cara pakai

Runner ini milik controller dan berada di LUAR repo. Isinya disalin dari `harness_ab2/ab2.py` lalu disesuaikan dengan protokol r3. Hanya pustaka standar Python (termasuk `sqlite3`), tanpa dependensi baru. Hermes sungguhan tidak dipanggil selama pembuatan dan uji asap.

## 1. Berkas

Folder: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/`

| Berkas | Isi | sha256 (2026-10-31, sesudah H3-F dan uji asap) |
|---|---|---|
| `ab3.py` | satu berkas alat beku; subperintah `trial-log`, `run-session`, `isolation-check`, `snapshot`, `freeze`, `toolcalls`, `postcheck`, `csvcheck` | `2fc827a06029f6c3d382d17d01730a672be3ad0527b352964e20fb0c8a4da5ec` (BASI sesudah H3-G, lihat catatan) |
| `bin/trial-log` | pembungkus Git Bash (`MSYS_NO_PATHCONV=1`, lalu `python -I ab3.py trial-log ...`) | `fc60c2d63459b683b8f182cf4b6c2e358a49c4befffb1220616a9e4761b08caf` |
| `bin/trial-log.cmd` | pembungkus cmd.exe | `aa5145fdb569bcd49a44950bc516abe852daaeede9c18f1f80e6dcf3d4e1f994` |
| `smoke_test.sh` | uji asap run palsu `TEST` (folder terisolasi `_smoke_TEST`, dibersihkan sendiri) | `5d10ffa2a63ba2cb6260a8678de00c3becaf6bd78bf22aa5245d26573e025521` |
| `state/` | dibuat saat run pertama: kunci tulis, `current_run.json`, penanda `pre_<run>.marker` | - |

> R3-H: `ab3.py` sudah disunting H3-G sesudah sha di atas diambil (kode D-442 terlihat di `ab3.py:7`, `:1766`, `:1812-1832`, `:2048-2066`, `:2165-2167`). Sha `ab3.py` di tabel ini tidak lagi menggambarkan berkas di disk. [menunggu H3-G: sha final ketiga berkas alat dan `smoke_test.sh`, serta hasil uji asap sesudah H3-G.]

sha ketiga berkas alat masuk ke `controller_ab3/freeze.sha256`. Perubahan alat sesudah freeze menggagalkan cek sebelum sesi.

Python: `C:/Users/TRIAL/AppData/Local/Python/pythoncore-3.14-64/python.exe` (cadangan pembungkus: `python` di PATH).

## 2. Perubahan dari ab2 (HARNESS2)

| # | Perubahan | Dasar |
|---|---|---|
| 1 | **Freeze berkas yang sama.** `freeze_file()` tetap `controller_ab3/freeze.sha256`, tanpa env override (`TRIAL_FREEZE_FILE` dihapus, dan dibuang dari env anak). `freeze` menulis baris `<sha256> *C:/<path absolut>` untuk `contract_ab3/facts/*`, `contract_ab3/queries/*`, `controller_ab3/answers/*`, `ab3.py`, `bin/trial-log`, `bin/trial-log.cmd`, ditambah `controller_ab3/freeze.origin.json` (penulis, sha berkas freeze, waktu). Cek (`freeze --check` dan bawaan `run-session`) menolak baris yang bukan format baku atau berpath relatif (`FORMAT`), berkas hilang/berubah, target baru (`BARU`), berkas alat yang tidak dibekukan, berkas freeze yang tidak ditulis `ab3.py freeze` atau diubah sesudahnya (`ASAL-USUL TIDAK COCOK`), dan W yang berbeda dari sha D-404. Perbandingan path tidak peka huruf besar-kecil. Precheck dan meta mencatat `freeze_file` dan `freeze_sha256`. Ini menutup cacat r2 (D-432). | §10; D-432 |
| 2 | **`isolation-check` (H-1..H-9)** dipanggil `run-session` sesudah cek freeze dan sebelum `snapshot pre`. **Bawaan sesudah H3-G (D-442): INFORMATIF**: cek dijalankan, hasil dan beban host dicatat (`<run>_host_pre.txt`, `host_log.md`, meta), run tetap dimulai tanpa tunda (`ab3.py:1812-1832`). Mode ketat `--strict-isolation` (perilaku H3-F): bila gagal, tunda 300 s, maksimal 6 kali tunda (paling banyak 7 kali cek, 30 menit tunggu), lalu exit 3 `ISOLATION_FAILED`; `--force-isolation-skip "<alasan>"` (wajib >= 8 karakter) hanya bermakna pada mode ketat. Pemantau 30 s menulis `<run>_host_during.csv`. Sesudah `snapshot post`, H-1, H-4, H-5, H-8 diulang ke `<run>_host_post.txt` | §5.2-§5.5; HS-5; D-442; protokol §21.2 |
| 3 | **Folder aktif pra-START.** `snapshot pre` menulis `<run>_active_dirs_pre.txt` (folder di `%TEMP%` dan workspace Hermes dengan berkas berubah <= 60 menit, di luar `hermes_trial/` dan `tsx-TRIAL/`) tepat sebelum penanda pre. Diff memberi `folder_aktif_pra=1|0` pada setiap entri S3/S4 | §5.4; D-435; HS-6 |
| 4 | **`toolcalls <RUN>`**: menyalin `state.db`, `state.db-wal`, dan `state.db-shm` profil gsp-master01 ke `controller_ab3/statedb_tmp/<RUN>/` (pembacaan berkas biasa; db asli tidak pernah dibuka sqlite). Salinan dibuka `mode=ro` (bukan `immutable`), sehingga baris yang masih di WAL ikut terbaca. Tool call sesi diekspor ke `controller_ab3/toolcalls/<RUN>_toolcalls.csv`, CSV diverifikasi, lalu salinan dihapus. `run-session` menjalankannya otomatis sesudah sesi Hermes sungguhan | §6.2; HS-7 |
| 5 | Jalur ab3: misi `2026-10-31_hermes-contract-ab3`, `contract_ab3/`, `controller_ab3/`, tabel run W, R7B, R7A, R8A, R8B, R9B, R9A, M, Q. Env `STUDIO_TIMING_*` dan `TRIAL_*` sama dengan r2. Env folder untuk uji asap: `TRIAL_AB3_DIR` (menggantikan `TRIAL_AB2_DIR`), `TRIAL_CTRL_DIR`, `TRIAL_STATE_DIR`, `TRIAL_S1_ROOT` | §9.1, §9.2; HS-1 |
| 6 | `trial-log step --target` dan `get <path>` menerima path relatif. Path diselesaikan terhadap cwd; bila tidak ada di sana tetapi ada di bawah folder misi (S1), dipakai yang itu. Yang dicatat path absolut, dengan catatan `rel=<asli>;rel_base=cwd|s1` | HS-3; laporan 05 `:6` |
| 7 | Daftar tolak `get`: berkas rahasia, `controller_ab3/`, `contract_ab/`, `contract_ab2/`, `controller_ab/`, `controller_ab2/`, folder misi ab dan ab2, `harness_ab3/state/`, `harness_ab2/state/`, `contract_ab3/queries/` di luar run Q | §9.1; HS-4 |
| 8 | `--skip-freeze-check` kini butuh alasan (`--skip-freeze-check "<alasan>"`). Alasan dicatat di meta (`freeze_skip_reason`) dan `host_log.md` | §10.7 |
| 9 | **H3-F: daftar izin layanan selalu-hidup** di `isolation-check` (D-440). Layanan yang menyala terus tidak lagi menggagalkan H-1, H-6, H-7. Sesudah H3-G (D-442) semua cek informatif pada mode bawaan, sehingga daftar izin hanya memisahkan layanan yang diizinkan dari beban lain di catatan (`isolation_allowlist_kena_pre/post`). Rincian di §5.1 | D-440; D-442 |
| 10 | **H3-F: `toolcalls` menyertakan sesi turunan secara bawaan** (`parent_session_id`: delegasi/kompresi). `--no-children` mengecualikannya; `--include-children` (r2) tetap diterima tanpa efek. Meta menambah `toolcalls_turunan_disertakan` | D-440 (keputusan: sub-sesi = kerja run itu, untuk KE-2/KE-6) |
| 11 | **HS-8 `postcheck <RUN>`** (arm B): draft-check `--remote` ulang atas draf JSON, `studio-report check --remote` atas laporan MD-native (H3-G), `classify` berkas baru S3/S4, ringkasan ke `sessions/<RUN>_postcheck.json`. Rincian di §4.4 | D-440; D-441; protokol §6.3, §6.5 E-11, §21.5; HS-8 |
| 12 | **H3-G: isolasi informatif** (D-442). Opsi baru `run-session --strict-isolation` mengembalikan perilaku tunda/gagal; meta menambah `isolation_mode` (`informatif(D-442)` atau `ketat(--strict-isolation)`) dan `host_post_cpu`, `host_post_disk`, `host_post_free_mb` (`ab3.py:1757`, `:1766`, `:1957`, `:1966-1968`). [menunggu H3-G: laporan dan uji asap] | D-442 |
| 13 | **H3-G: postcheck MD-native = `studio-report check <laporan.md> --remote <url> --json`** (hanya periksa, tanpa kiriman dan tanpa tulis berkas; `ab3.py:2048-2066`). `--md-update-check` DIHAPUS: kini keluar 2 `USAGE` (`ab3.py:2165-2167`), karena `update` menulis ke server (D-441) | D-441; D-442; D-443 |

## 3. Format data baru

| Berkas | Isi |
|---|---|
| `contract_ab3/sessions/<run>_host_pre.txt` | satu blok per percobaan cek: baris ringkas `=== isolation-check pre run=<run> percobaan=<n> ... -> LULUS / GAGAL H-x,...`, ambang yang dipakai, lalu `H-k LULUS/GAGAL/NA: ringkasan` + rincian berindentasi. Baris perintah proses disensor (nilai rahasia + pola `token/secret/key/password=...`) dan dipotong 200 karakter. Pada mode informatif biasanya satu blok per run |
| `contract_ab3/sessions/<run>_host_post.txt` | sama, subset H-1, H-4, H-5, H-8 |
| `contract_ab3/sessions/<run>_host_during.csv` | `t_utc,cpu_pct,disk_pct,free_mem_mb,n_proc_luar_whitelist,n_berkas_baru_temp,n_berkas_baru_workspace`; satu sampel saat START, lalu tiap `--monitor-interval` s, ditambah satu sampel penutup. Berkas baru dihitung sejak penanda pre. Temp di luar `hermes_trial/`, `tsx-TRIAL/`, `claude/`; workspace di luar folder misi S1. Hanya hitungan |
| `contract_ab3/sessions/<run>_active_dirs_pre.txt` | `folder<TAB>mtime_terbaru_utc<TAB>jumlah_berkas_60_menit` (§5.4) |
| `controller_ab3/toolcalls/<run>_toolcalls.csv` | RFC 4180, LF, header `msg_id,role,ts_call,tool_call_id,function_name,arguments,ts_result,result_len,token_count` (9 kolom, §6.2). Satu baris per tool call (urutan larik dalam pesan dipertahankan, AS3-2). Pesan assistant tanpa tool call tetap satu baris dengan kolom tool kosong, supaya token per segmen (§6.1) dapat dihitung. `ts_*` = epoch detik 3 desimal (jam yang sama dengan `timing.csv`). `arguments` disensor `[REDACTED]`, CR/LF menjadi ` / `. Isi hasil tool tidak disalin, hanya `result_len` |
| `controller_ab3/host_log.md` | satu baris per kejadian: cek gagal pada mode informatif (run tetap dimulai), percobaan gagal + tunda (mode ketat), lulus sesudah tunda, batas tunda habis, skip beserta alasan |
| `controller_ab3/freeze.origin.json` | `written_by`, `freeze_file`, `freeze_sha256`, `t_utc`, `n_targets`, `ab3_sha256`, `force` |
| `controller_ab3/precheck_<run>.txt` | hasil cek freeze per run; baris pertama `freeze_file=...`, lalu `freeze_sha256=...` |

Kunci meta baru (`<run>_meta.txt`): `freeze_file`, `freeze_sha256`, `freeze_skip_reason`, `host_bersih` (ya/tidak), `tunda_kali`, `isolation_percobaan`, `isolation_mode` (H3-G), `isolation_gagal`, `isolation_skip_reason` (hanya mode ketat), `host_cpu_pre`, `host_disk_pre`, `host_free_mb_pre`, `host_post`, `host_post_cpu`, `host_post_disk`, `host_post_free_mb` (H3-G), `isolation_allowlist`, `isolation_allowlist_kena_pre`, `isolation_allowlist_kena_post`, `host_cpu_rerata_selama`, `host_disk_rerata_selama`, `host_n_sampel_selama`, `host_maks_proc_luar_selama`, `host_maks_berkas_baru_temp_selama`, `active_dirs_pre`, `diff_s3s4_folder_aktif_pra`. Kunci yang ditambahkan `toolcalls` (atau `BELUM` / `GAGAL:<kode>`): `toolcalls_csv`, `toolcalls_session_id`, `toolcalls_sessions`, `toolcalls_turunan_ada`, `toolcalls_turunan_ids`, `toolcalls_sumber` (session/window), `toolcalls_turunan_disertakan` (ya / tidak (--no-children)), `toolcalls_n_msg`, `toolcalls_n_call`, `toolcalls_n_call_jendela_harness`, `toolcalls_copy_s`, `toolcalls_src`. Kunci yang ditambahkan `postcheck`: `postcheck_utc`, `postcheck_draf` (lulus+terkirim/jumlah draf), `postcheck_lainnya`, `postcheck_asal_usul_D435`, `postcheck_file`.

Semua berkas di atas termasuk `controller_owned` dalam snapshot (`contract_ab3/sessions/`, `controller_ab3/`, `harness_ab3/`).

## 4. Perintah controller (Git Bash)

```bash
PY="C:/Users/TRIAL/AppData/Local/Python/pythoncore-3.14-64/python.exe"
AB3PY="C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/ab3.py"
CTRL="C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab3"
```

### 4.1 Sekali sebelum run W (P3-5, P3-7, P3-9, P3-10)

1. Uji asap ulang. Hasil siklus H3-F `RINGKASAN: PASS=90 FAIL=0`, lalu `artefak TEST dihapus` [menunggu H3-G: jumlah uji sesudah H3-G]:

   ```bash
   bash C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/smoke_test.sh     # KEEP=1 untuk menyimpan artefak
   ```

2. Daftar putih host `controller_ab3/host_whitelist.txt`. Satu entri per baris, `#` = komentar:

   ```text
   pid 12345  server DEV :9021
   cmd (?i)claude.*\.exe          # sesi Claude Code controller (regex atas CommandLine)
   name chrome.exe                # hanya dengan keputusan tercatat
   wsl docker-desktop             # distro WSL yang boleh Running
   temp C:/Users/TRIAL/AppData/Local/Temp/DiagOutputDir/   # prefiks %TEMP% milik controller/OS yang tercatat
   ```

   Proses harness sendiri beserta leluhur dan keturunannya (PowerShell cek, hermes yang diluncurkan `run-session`) otomatis dikecualikan. Layanan selalu-hidup (hermes gateway, dashboard, penjadwal cron, WSL) sudah diizinkan oleh daftar izin bawaan alat (§5.1) dan TIDAK perlu masuk berkas ini. Pada mode informatif (D-442) daftar putih tidak lagi menentukan apakah run dimulai; ia memisahkan proses milik controller (sesi Claude Code beserta server MCP-nya, server DEV :9021 dan anak-anaknya) dari beban lain di catatan, sehingga dianjurkan diisi dengan alasan tercatat sebelum W. Proses USER lain (`hq-server.mjs`, `server.py` :9136-:9139, `gsp-brahma`, `watch_cards.py`, pekerja kanban Hermes) tidak dihentikan controller (D-442) dan tetap tercatat sebagai beban host. Pekerja kanban yang sedang berjalan bukan layanan: ia tidak pernah diizinkan.
3. Opsional: `controller_ab3/host_config.json` untuk mengubah ambang prosedur (dengan alasan tercatat; P3-9). Kunci dan bawaannya: `{"cpu_max": 30, "disk_max": 50, "recent_min": 15, "cron_window_min": 30, "crash_min": 60, "active_min": 60, "samples": 5, "sample_interval_s": 2, "kanban_db": "C:/Users/TRIAL/AppData/Local/hermes/kanban.db", "allowlist": true}`. `"allowlist": false` mematikan daftar izin bawaan (mode ketat protokol asli); `isolation-check --no-allowlist` melakukan hal yang sama untuk satu pemanggilan. Pada mode informatif `cpu_max`/`disk_max` hanya menentukan label LULUS/GAGAL H-8 di catatan; label `beban_tinggi` analisis memakai ambang yang sama atas rerata selama run (protokol §21.3).
4. Uji kering prosedur isolasi (P3-10; sudah dijalankan pada H3-F, temuan di §8 L3-10). Exit 0 = semua cek lulus; exit 1 = ada cek yang gagal. Perintah ini hanya melapor dan tidak memblokir apa pun (`ab3.py:1458-1469`):

   ```bash
   "$PY" -I "$AB3PY" isolation-check                  # cetak saja
   "$PY" -I "$AB3PY" isolation-check --run W          # tambahkan ke contract_ab3/sessions/W_host_pre.txt
   "$PY" -I "$AB3PY" isolation-check --post --run W   # subset H-1,H-4,H-5,H-8
   ```

5. Sesudah FACTS3 selesai dan alat final (H3-G): freeze baku (§10).

   ```bash
   "$PY" -I "$AB3PY" freeze                 # menolak menimpa; tulis freeze.sha256 + freeze.origin.json
   "$PY" -I "$AB3PY" freeze --check         # exit 0
   sha256sum -c "$CTRL/freeze.sha256"       # exit 0 (path absolut C:/)
   ```

### 4.2 Per run (W, R7B, R7A, R8A, R8B, R9B, R9A, M, lalu Q)

0. Cache tsx dipanaskan ulang sesudah server dibekukan pada commit R3 final (cara harness 05 §3.2 langkah 0): `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts --help` (memuat seluruh graf impor, termasuk `services/draft/md-report`) dan `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts template --mission 2026-10-31_hermes-contract-ab3 --doc-key lapkerja-w` (tanpa server, rahasia, maupun berkas; protokol §6.3).
1. Tulis prompt ke `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/sessions/prompt_<RUN>.txt`, tanpa rahasia. Prompt W dan prompt M wajib menyebut misi `2026-10-31_hermes-contract-ab3` (D-440). Prompt W juga menyebut folder `w/` dan `docKey` `lapkerja-w` (§8.6). Prompt M juga menyebut folder `m/`, `docKey` `lapkerja-m`, dan bahwa langkah M2 memakai `--agent-id hermes-gsp-verifier01` (brief 06 §5).
2. Bila ada sub-agen controller yang masih berjalan, tulis namanya satu per baris di `controller_ab3/agents_active.txt`. Pada mode informatif H-9 yang gagal tidak menahan run, tetapi tetap pelanggaran kewajiban controller dan dilaporkan sebagai penyimpangan (protokol §21.2). Kosongkan sebelum run.
3. Jalankan:

   ```bash
   "$PY" -I "$AB3PY" run-session R7B --timeout 2700
   ```

   Urutan kerja `run-session`:
   1. validasi: meta belum ada, tidak ada run aktif, prompt ada, rahasia ada dan tidak ada di prompt;
   2. cek freeze bawaan atas `controller_ab3/freeze.sha256` (gagal: exit 1 `FREEZE_FAILED`, rincian `controller_ab3/precheck_<RUN>.txt`, tanpa cek host);
   3. `isolation-check` H-1..H-9: bawaan informatif (dicatat, tanpa tunda); dengan `--strict-isolation` tunda lalu `ISOLATION_FAILED`;
   4. `snapshot pre` + `<RUN>_active_dirs_pre.txt`;
   5. baris START harness, lalu `hermes.exe -p gsp-master01 --pass-session-id --usage-file contract_ab3/sessions/usage_<RUN>.json -z "<prompt>"`, sambil pemantau host berjalan;
   6. `snapshot post` + diff, lalu host post;
   7. cek kebocoran rahasia, lalu meta;
   8. `toolcalls <RUN>` (sesi + turunan).

   `postcheck <RUN>` tidak dipanggil otomatis; controller menjalankannya sesudah tiap run arm B (§4.4).

   Opsi:

   | Opsi | Arti |
   |---|---|
   | `--timeout S` | batas sesi dalam detik |
   | `--strict-isolation` | (H3-G) mode ketat protokol §5.3: tunda dan `ISOLATION_FAILED`; hanya atas keputusan USER tercatat (bawaan informatif, D-442) |
   | `--isolation-wait S` / `--isolation-max-delays N` | bawaan 300 / 6 (protokol §5.3); hanya berlaku dengan `--strict-isolation`. Diubah hanya untuk uji |
   | `--force-isolation-skip "<alasan>"` | hanya bermakna dengan `--strict-isolation`: jalan pada host tidak bersih atas keputusan USER (label `host_bersih=tidak`) |
   | `--monitor-interval S` | bawaan 30; `0` mematikan pemantau (meta `host_cpu_rerata_selama=PEMANTAU-MATI`). Jangan dimatikan pada uji ketiga: caveat beban wajib (protokol §21.3) |
   | `--skip-freeze-check "<alasan>"` | hanya dengan keputusan tercatat; dilaporkan sebagai penyimpangan |
   | `--no-toolcalls` | jangan ekspor otomatis (jalankan `toolcalls` manual sebelum run berikut) |
   | `--prompt-file`, `--arm/--report/--order`, `--studio-timing-env NAMA\|none`, `--hq-url`, `--hermes`, `--profile`, `--dry-run [--fake-agent skrip.sh] [--bash path]` | sama dengan r2. `--hq-url` menolak host non-loopback dan port 9011 |

   Kode keluar: 0 = sesi exit 0; 1 = sesi gagal/timeout atau `FREEZE_FAILED`; 2 = pemakaian salah atau pengaman (`RUN_EXISTS`, `RUN_ACTIVE`, `PROMPT_MISSING`, `SECRET_MISSING`, `SECRET_IN_PROMPT`); 3 = `ISOLATION_FAILED` (hanya mode ketat; needs-review USER dengan isi `<RUN>_host_pre.txt`).
4. Bila `toolcalls` otomatis gagal (meta `toolcalls_n_call=GAGAL:<kode>`), misalnya karena `hermes_session_id` tidak ada di `usage_<RUN>.json`:

   ```bash
   "$PY" -I "$AB3PY" toolcalls R7B --list-sessions 5                # sesi terbaru di salinan (id, waktu, jumlah pesan)
   "$PY" -I "$AB3PY" toolcalls R7B --session-id <id> [--force]      # --force hanya untuk menimpa CSV lama, keputusan tercatat
   "$PY" -I "$AB3PY" toolcalls R7B --session-id <id> --verify-source   # tambah cek sha sumber sebelum/sesudah (+3 hash 1 GB)
   ```

   Tanpa `--session-id` dan tanpa id di meta, alat memakai satu-satunya sesi yang punya pesan di jendela `start_epoch..end_epoch` (`toolcalls_sumber=window`). Bila ada lebih dari satu sesi, keluar dengan `SESSION_AMBIGUOUS`. Bawaannya (D-440) sesi itu ditambah SEMUA sesi turunannya (`parent_session_id`, misalnya delegasi atau kompresi), karena sub-sesi adalah kerja run itu. Jumlah dan id turunan dicatat (`toolcalls_turunan_ada`, `toolcalls_turunan_ids`, `toolcalls_sessions`, `toolcalls_turunan_disertakan=ya`). `--no-children` mengecualikannya (dicatat `tidak (--no-children)`, perlu `--force` bila CSV sudah ada); `--include-children` dari r2 tetap diterima tanpa efek.
5. Sesudah M, sebelum Q: tulis `controller_ab3/answers/Q_key_resolved.md`, salin `freeze.sha256` ke `freeze_preQ.sha256`, lalu `"$PY" -I "$AB3PY" freeze --force` (keputusan tercatat; versi lama juga disalin otomatis ke `freeze.sha256.bak-<UTC>`), lalu `freeze --check` dan `sha256sum -c`.

### 4.3 Lain-lain

```bash
"$PY" -I "$AB3PY" snapshot pre  R7B     # biasanya dipanggil run-session
"$PY" -I "$AB3PY" snapshot post R7B
"$PY" -I "$AB3PY" csvcheck              # timing.csv 20 kolom, retrieval.csv 13 kolom, LF, seq ganda, rahasia
```

Cakupan S1-S4 sama dengan r2, dengan S1 = `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab3/`. `summary.s3s4_folder_aktif_pra` menghitung entri S3/S4 di folder yang aktif sebelum START. Tanda itu hanya bukti (B) aturan asal-usul lama (research/13 §17.1); aturan KE-5 uji ketiga mengikuti D-442 (protokol §21.4).

### 4.4 `postcheck <RUN>` (HS-8, arm B; dijalankan controller sesudah `run-session`)

```bash
"$PY" -I "$AB3PY" postcheck R7B                      # draf JSON: draft-check --remote; MD-native: studio-report check --remote
"$PY" -I "$AB3PY" postcheck R7B --hq-url http://127.0.0.1:9021 --session-id <id> --profile-dir <dir> --max-files 40 --timeout 240 --no-provenance
```

`--md-update-check` dihapus H3-G: keluar 2 `USAGE` (`ab3.py:2165-2167`; D-441: `update` menulis ke server).

Syarat: `<RUN>_meta.txt` berarm B (arm lain: exit 2 `NOT_ARM_B`) dan `snap_<RUN>_diff.json` ada. `--hq-url` menolak port 9011 dan host non-loopback. Rahasia dibaca di dalam proses dari `INTERNAL_API_SECRET` atau `hq_v21_clone/trial_internal_secret`, hanya diteruskan ke env proses anak (bukan baris perintah), dan keluaran anak disensor. Kode keluar: 0 = semua draf lulus+terkirim dan 0 berkas `lainnya`; 1 = ada temuan (draf gagal, tidak terperiksa, atau `lainnya`); 2 = pemakaian/lingkungan.

| Langkah | Cara |
|---|---|
| Kandidat draf | berkas `.md` berstatus `added`/`changed` di S1 (folder misi) pada diff run |
| Draf JSON (ada blok ```json ber-`$schema` studio.*) | `npx tsx <repo>/scripts/studio/draft-check.ts <f> --remote <url> --json`; diringkas: `valid`, jumlah blok, jumlah isu error/warning, kode isu (tanpa payload) |
| Laporan MD-native | `npx tsx <repo>/scripts/studio/studio-report.ts check <f> --remote <url> --json` (D-441, H3-G; `ab3.py:2048-2066`). Hanya periksa: konversi seperti submit/update (baris `basis:` di kepala = mode update), cek lokal, penjaga target contoh, lalu dry-run R08 per bagian (GET R05 + POST `/api/studio/validate`, tidak menyimpan apa pun). Tidak menulis berkas: `--out`, `--timing`, `--step` ditolak keluar 2 (`studio-report.ts:685-687`). Diringkas: `valid` (keluar 0 dan `ok=true`), `format`, `mode`, jumlah bagian, jumlah dan kode isu (tanpa payload), `remote_dijalankan`. Draft-check tetap tidak menerima MD-native (`DRAFT_NO_JSON_BLOCK`) |
| Draf sah | lulus cek DAN ada baris `tool` `studio-report submit/update` ok=1 dengan `note` = basename berkas di `timing.csv` run itu (bukti (b) §6.3) |
| Klasifikasi berkas baru S3/S4 | berurutan: `controller` (`controller_owned` snapshot); `unduhan_final_C51` (nama cocok regex C51; `sha8_cocok` = 8 hex pertama sha256 isi); `tsx_cache` (`%TEMP%/tsx-*/`); `draf_sah` (path yang sama dengan draf lulus+terkirim); `asal_usul_D435`; sisanya `lainnya` (dengan alasan dan `pola_payload` bila ada) |
| `asal_usul_D435` | HANYA bila bukti (A) dan (B) terpenuhi (research/13 §17.1): (A) SALINAN `state.db` (+wal+shm, dibuka `mode=ro`) memuat 0 rujukan di `tool_calls`/`content`/`tool_name` seluruh pesan sesi run + turunannya ke basename, nama folder induk (kecuali akar `Temp`/`workspace`/`docs`), dan setiap cardId `t_xxxxxxxx` di isi berkas; (B) `folder_aktif_pra=1` (folder induk aktif sebelum START). Gugur (berkas tetap dihitung, `lainnya`) bila: log sesi tak terbaca / sesi tak ada, bukti A atau B tidak ada, atau sesi memuat tool call berpath dinamis (`tempfile`, `mkstemp`, `uuid`, ...) dan isi berkas memuat token lembar fakta run itu (atau tak terbaca). Bukti per berkas disimpan: kata cari, jumlah, jumlah sesi/pesan/tool call. **R3-H:** protokol §21.4 (D-442) membalik arah beban bukti: berkas S3/S4 dihitung ke KE-5 hanya bila ada bukti sentuh di log sesi. Kelas `asal_usul_D435` tetap dipakai sebagai sensitivitas aturan lama. Kelas D-442 (`terbukti_run`, dengan bukti token fakta dihitung tanpa syarat B) belum ada di kode (`ab3.py:2129-2159`) [menunggu H3-G] |

Keluaran `contract_ab3/sessions/<RUN>_postcheck.json` (termasuk `controller_owned`): `drafts[]` (path, format, hasil cek, `terkirim_timing_csv`, kelas), `classify.kelas` (hitungan per kelas), `classify.entries[]` (semua kelas kecuali `controller` dan `tsx_cache`, yang hanya dihitung + 5 contoh), `classify.provenance_log`, `ringkas`. Tanpa isi berkas atau payload. Meta menerima kunci `postcheck_*` (§3). Tugas HS-8 lain (R20 revisi S1/S2, SQL MU-1, checker G_A) tetap dikerjakan controller terpisah (§8 L3-2).

## 5. Isi cek host (baca saja)

Pada mode bawaan sesudah H3-G (D-442) kolom "Lulus bila" adalah label hasil yang dicatat, bukan syarat mulai run.

| Cek | Cara di `ab3.py` | Lulus bila |
|---|---|---|
| H-1 | satu panggilan PowerShell `Get-CimInstance Win32_Process` (JSON); nama `hermes, python(w), node, bash, WINWORD, EXCEL, POWERPNT, chrome, msedge, wsl(host)` | 0 proses di luar daftar putih controller, pohon proses harness, dan daftar izin layanan selalu-hidup (§5.1) |
| H-2 | SALINAN `kanban.db` (+wal/shm bila ada) di `controller_ab3/statedb_tmp/_kanban_<pid>/` dibuka `mode=ro`: `tasks.status='running'` dan `task_runs.status='running' AND ended_at IS NULL`; salinan dihapus | 0 dan 0. Bila db tidak ada/tak terbaca: `NA` (AS3-4; H-1/H-3 menjadi pengganti). Db asli tidak dibuka sqlite, karena `kanban.db` dalam mode WAL dan pembukaan `mode=ro` langsung dapat membuat `-wal/-shm` di folder Hermes |
| H-3 | berkas di `hermes/kanban/workspaces` dengan mtime/birthtime <= `recent_min` | 0 |
| H-4 | idem `%TEMP%` di luar `hermes_trial/`, `tsx-TRIAL/`, `claude/`; prefiks `temp` daftar putih dihitung terpisah | 0 di luar prefiks tercatat |
| H-5 | idem workspace Hermes, di luar folder misi S1 (dilacak snapshot S1; milik run, bukan proses lain) | 0 |
| H-6 | membaca `hermes/cron/jobs.json` dan `hermes/profiles/*/cron/jobs.json` (JSON, baca saja; CLI hermes tidak dipanggil). Job `enabled` dan tidak `paused` dengan `next_run_at <= sekarang + cron_window_min` (termasuk yang terlambat), atau interval <= jendela | 0 jatuh tempo, ATAU (daftar izin hidup) jatuh tempo dicatat saja |
| H-7 | `wsl.exe -l -v` (distro `Running` di luar daftar putih `wsl`), `Temp/wsl-crashes` <= `crash_min` | 0 distro di luar daftar putih dan 0 dump; daftar izin hidup: distro Running diizinkan, dump yang ditulis dalam `recent_min` tetap GAGAL, dump lebih tua hanya dicatat |
| H-8 | `Win32_PerfFormattedData_PerfOS_Processor` / `PerfDisk_PhysicalDisk` `_Total`, `samples` x `sample_interval_s` (tidak bergantung bahasa Windows), memori bebas, 10 proses ber-CPU tertinggi | CPU rerata < `cpu_max`, disk rerata < `disk_max` |
| H-9 | `controller_ab3/agents_active.txt` (atestasi controller) | berkas tidak ada atau tanpa entri |

### 5.1 Daftar izin layanan selalu-hidup (H3-F, D-440)

Prinsip: yang diizinkan hanya KEBERADAAN layanan yang menyala terus. Tidak ada yang diizinkan dari pekerjaan: pekerja kanban (`hermes.exe -p <profil> --cli ... chat -q`), sesi chat, dan setiap proses di luar daftar tetap terhitung. Daftar ada di kode (`ALWAYS_ON`, `ab3.py`), dicatat di setiap `<run>_host_pre.txt` (baris `daftar izin ...`, jumlah kena per grup, dan baris `diizinkan[grup] n= pid=`) dan di meta (`isolation_allowlist`, `isolation_allowlist_kena_pre/post`).

| Grup | Cocok bila | Cek yang dilonggarkan |
|---|---|---|
| `hermes-gateway` | baris perintah `hermes_cli.main [--profile X] gateway run` (python venv + anak `uv`) | H-1 |
| `hermes-gateway-bridge` | `hermes-agent/scripts/whatsapp-bridge/bridge.js` | H-1 |
| `hermes-dashboard` | `hermes[.exe] dashboard --port ...` | H-1 |
| `hermes-cron` | `hermes cron tick`/`status`. Penjadwal sendiri hidup di dalam gateway, jadi tidak ada proses terpisah | H-1; H-6: job jatuh tempo dicatat (`JATUH TEMPO (diizinkan)`), tidak menggagalkan |
| `wsl` | nama proses `wsl*` (`wsl`, `wslhost`, `wslservice`, ...), `vmmem*`, `vmwp`, `vmcompute` | H-1; H-7: distro Running dicatat; dump crash lama (lebih tua dari `recent_min`, masih dalam `crash_min`) dicatat |

Pada mode ketat (`--strict-isolation`) tetap WAJIB (tidak dilonggarkan): 0 berkas baru/berubah oleh proses lain dalam `recent_min` (bawaan 15 menit) di `%TEMP%` (di luar `hermes_trial/`, `tsx-TRIAL/`, `claude/`, dan prefiks `temp` daftar putih) dan di workspace Hermes (di luar folder misi S1); dump crash WSL yang ditulis dalam `recent_min` (termasuk berkas baru `%TEMP%`); CPU rerata < `cpu_max` dan disk rerata < `disk_max`; H-2 (0 kartu kanban running) dan H-3 (0 berkas baru di folder kerja kanban); H-9. Pada mode informatif (bawaan, D-442) butir yang sama dicatat tetapi tidak menahan run. Pemantau 30 s (`<run>_host_during.csv`) memakai daftar izin yang sama untuk kolom `n_proc_luar_whitelist`. Daftar izin ketat: `host_config.json` `"allowlist": false` atau `isolation-check --no-allowlist`.

Satu cek penuh berlangsung sekitar 25 s pada host ini, didominasi penjelajahan `%TEMP%` dan 10 s sampel beban.

## 6. Perintah untuk Hermes (disalin ke prompt atau brief 06)

`trial-log` ada di PATH sesi yang diluncurkan `run-session`. Bila tidak ada, pakai path absolut `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/bin/trial-log`, atau `bin/trial-log.cmd` di cmd.exe. Setiap pemanggilan menambah tepat satu baris ke `contract_ab3/timing.csv`. Tanpa identitas run (env `TRIAL_*` atau `state/current_run.json` aktif), alat keluar dengan exit 2 `IDENTITY_MISSING`.

```bash
trial-log mark START R7B                                         # aksi pertama
trial-log get C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/facts/R-7.md
trial-log step edit --target C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab3/r7a/laporan.md --step S1
trial-log step edit --target r7a/laporan.md --step S2           # path relatif diterima (cwd, cadangan folder misi); tercatat absolut
trial-log step read --target C:/Users/TRIAL/gsp-swarm-hq-v2.1/docs/STUDIO-AGENT-GUIDE.md --note format_lookup
trial-log step cmd --note "grep -rn t_469ed5fe r7a/"
trial-log get "/api/studio/registry?kind=contracts" --note format_lookup     # GET DEV; badan hanya ke stdout
trial-log get "/api/studio/files/<id>?verify=1" --head --step S4
trial-log mark END R7B --note "md_baru=r7a/laporan.md"
# sesi Q
trial-log qmark START Q1 A
trial-log answer Q1 A r9a/laporan.md:8 --tool-call "grep -rn t_0053d245 r7a r8a r9a"
trial-log qmark END Q1 A
```

Arm B memakai `studio-report` dengan `--timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab3/timing.csv` di setiap pemanggilan `submit`/`update`. Identitas baris diambil dari env `STUDIO_TIMING_*` yang diisi `run-session`, sama seperti r2 (L-10 harness 05: `studio-report` tidak membaca env `STUDIO_TIMING_CSV`). Alur arm B dan opsi persisnya (template -> isi -> `check` -> `submit` -> salin baris `basis:` -> `update` delta) ada di brief 06 §6 dan protokol §21.6. `template` dan `check` menolak `--timing`/`--step` (keluar 2; `studio-report.ts:676-678`, `:685-687`), sehingga keduanya hanya tampak di log sesi (`<run>_toolcalls.csv`).

Aturan `get`: badan respons hanya ke stdout; ringkasan `HTTP <status> cid=<..> code=<..>` ke stderr; host non-loopback dan port 9011 ditolak (baris `ok=0`); path yang ditolak tercantum di §2 butir 7. Exit code: 0 = berhasil; 1 = baris tercatat dengan `ok=0`; 2 = pemakaian salah atau ditolak.

## 7. Uji asap (bukti 2026-10-31)

> R3-H: bukti di bawah adalah keadaan H3-F. Butir yang menyebut mode kering, `valid=null` MD-native, dan `--md-update-check` sudah digantikan H3-G (§2 butir 12-13). [menunggu H3-G: hasil uji asap sesudah isolasi informatif dan postcheck `studio-report check`.]

```bash
bash C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab3/smoke_test.sh
```

Hasil siklus akhir (H3-F): `RINGKASAN: PASS=90 FAIL=0`, `artefak TEST dihapus`. Sebelum H3-F: 71/71 (dijalankan ulang sebelum perubahan, lulus). Satu uji lama diganti karena keputusan D-440 membalik perilaku bawaannya: "toolcalls bawaan: hanya sesi itu" menjadi "bawaan = sesi + turunan", ditambah uji `--no-children` dan `--include-children`. Siklus H3-F: 89/90 pada percobaan pertama (satu uji sintetis salah menganggap `utime` dapat memundurkan birthtime Windows), 90/90 sesudah uji diperbaiki. Hermes dan server Studio tidak dipanggil di uji asap. Siklus 1: 67/70, karena dua asumsi uji yang keliru dan satu perbaikan alat (pemantau kini mengambil sampel penutup). Siklus 2: 70/70. Uji memakai folder terisolasi (`harness_ab3/_smoke_TEST`, `hermes_trial/ab3_TEST_s1`, `Temp/ab3_TEST_*`). `contract_ab3/` dan `controller_ab3/` nyata, yang sedang diisi FACTS3, tidak disentuh. Hermes tidak dipanggil (`--dry-run` + agen palsu).

Yang dibuktikan:

- **Freeze (perubahan 1)**:
  - `freeze` menulis 7 target, termasuk 3 berkas alat berpath absolut.
  - Keluaran `freeze` dan cek sama-sama menunjuk `controller_ab3/freeze.sha256`.
  - `sha256sum -c` lulus; `freeze` menolak menimpa; W sama dengan sha D-404.
  - Freeze yang ditulis ulang berpath relatif (gaya FACTS2 r2) gagal dengan `FORMAT` + `ASAL-USUL TIDAK COCOK`; sesudah dipulihkan, lulus lagi.
  - Meta TEST: `freeze_check=OK` tanpa skip, dan `freeze_sha256` sama dengan `sha256sum` berkas freeze.
  - Fakta diubah: `run-session` exit 1 `FREEZE_FAILED`, tanpa meta dan tanpa `host_pre` (cek freeze berjalan lebih dulu). Precheck menyebut `freeze_file` yang sama dan `R-7.md: GAGAL`.
- **Isolasi (perubahan 2)**:
  - `isolation-check` mendeteksi probe baru `Temp/ab3_TEST_probe_iso.txt` (H-4 GAGAL, path terdaftar); probe lalu dihapus.
  - `run-session` pada host kotor tanpa skip: 2 percobaan (1 tunda), lalu exit 3 `ISOLATION_FAILED`, tanpa meta dan tanpa snapshot. `host_log.md` mencatat tunda dan batas habis.
  - `--force-isolation-skip` dengan alasan pendek ditolak (`USAGE`). Dengan alasan sah, meta mencatat `host_bersih=tidak`, alasan, `tunda_kali=0`, beban pre, 2 sampel selama run, dan `host_post`.
  - `host_pre` memuat H-1..H-9 dan `host_post` memuat 4 cek. `host_during.csv` 7 kolom.
- **Folder aktif (perubahan 3)**: folder `Temp/ab3_TEST_active` yang diisi sebelum START tercatat di `active_dirs_pre`. Berkas baru di sana selama run mendapat `folder_aktif_pra=1`. Probe berpola di folder baru mendapat `folder_aktif_pra=0` dan tetap masuk `s3_pattern_hits`.
- **toolcalls (perubahan 4)**, atas db asli profil gsp-master01 (955 MB + WAL 16 MB):
  - `sha256sum` independen atas `state.db`, `-wal`, `-shm` identik sebelum dan sesudah; `--verify-source` melaporkan ketiganya TIDAK BERUBAH.
  - Salinan memakan 0,3 s dan `statedb_tmp/` terhapus sesudah verifikasi.
  - CSV: header 9 kolom RFC 4180, `ts_result >= ts_call`, tanpa nilai rahasia.
  - `ts_call` terbaru lebih baru dari mtime `state.db`, jadi baris WAL ikut terbaca.
  - Meta TEST diperbarui, `toolcalls_sessions=1`. Penimpaan tanpa `--force` ditolak (`TOOLCALLS_EXISTS`).
  - Sesi uji diambil dari `--list-sessions`. CSV-nya berada di folder uji dan sudah dihapus.
- **Jalur dan trial-log (perubahan 5-7)**:
  - Path relatif `r_test/rel.md` dicatat absolut dengan `rel_base=s1` atau `rel_base=cwd`.
  - `get` ditolak untuk `QUERIES_BEFORE_Q`, `CONTROLLER_DIR`, `TRIAL2_MATERIAL`, `TRIAL2_CONTROLLER`, `TRIAL2_MISSION`, `TRIAL1_MISSION`, `SECRET_FILE`, dan port 9011.
  - `TRIAL_FREEZE_FILE` dari env controller tidak sampai ke env agen.
  - `csvcheck` VALID. Parse ulang independen: `timing.csv` TEST 26 baris x 20 kolom, `seq` berurutan, sensor `[REDACTED]`, 10 pemanggilan paralel utuh, kutip RFC 4180.

Tambahan H3-F yang dibuktikan:

- **Daftar izin**, uji sintetis atas daftar proses: gateway (2 bentuk baris perintah), bridge, dashboard, `wsl.exe`, `wslhost` diizinkan; pekerja kanban `hermes.exe -p gsp-worker --cli`, skrip python lain, `node bridge.mjs`, dan `hermes_cli.main -p x chat -q "tulis gateway run"` tetap terhitung; mode ketat menghitung semuanya; pohon proses harness tetap dikecualikan. H-6 (job jatuh tempo: LULUS dengan daftar izin, GAGAL ketat), H-7 (dump baru GAGAL, dump lama dicatat, ketat GAGAL), H-5 (berkas luar GAGAL, folder misi dikecualikan) diuji dengan folder dan jadwal buatan. `isolation-check` mencetak status daftar izin HIDUP/MATI; meta TEST memuat `isolation_allowlist*`.
- **toolcalls**: bawaan = 1 + `toolcalls_turunan_ada` sesi pada sesi uji nyata (51 turunan), `--no-children` = 1 sesi, `--include-children` sama dengan bawaan.
- **postcheck**, dengan `npx` palsu (`TRIAL_NPX`, hanya uji): draf JSON lulus+terkirim = `draf_sah`; draf gagal = `lainnya`; MD-native tanpa mode kering = tak tersedia; `update` hanya dengan `--md-update-check`, hanya untuk berkas yang tidak lebih baru dari kiriman, tanpa `--timing`; mode kering dipakai bila `--help` mengiklankannya; rahasia sampai ke env anak dan tidak ada di keluaran maupun JSON; `during.txt` di folder aktif = `asal_usul_D435` (A=0 rujukan dari salinan `state.db` nyata, B=1); probe berpola di folder baru = `lainnya` + `pola_payload`; unduhan C51 dengan sha8 cocok; port 9011, meta tidak ada, dan arm A ditolak (exit 2).
- **postcheck nyata** (di luar uji asap, folder sementara): draf JSON dari `studio-report template --format json` atas `http://127.0.0.1:9021` = `valid=true`, 6 blok, 0 isu, `draf_sah`; laporan MD-native dari `template` = `valid=null` ("tanpa mode kering"). `draft-check` atas MD-native menghasilkan `DRAFT_NO_JSON_BLOCK` (exit 1), sehingga memang tidak dipakai untuk MD-native.

## 8. Batasan dan hal yang perlu dicek controller

| # | Hal | Dampak / tindakan |
|---|---|---|
| L3-1 | Pada host ini cek pra-run hari ini gagal di H-1 (sekitar 108 proses terpantau, termasuk 3 `hermes.exe` gateway), H-2 (1 kartu running), H-3, H-4 (log Diagnostics WINWORD, jejak RdClient), H-5, H-6 (4 job `sysman-*` gsp-system-manager + 1 `hl-nas-watchdog` jatuh tempo <= 30 menit), dan H-7 (docker-desktop dan Ubuntu-24.04 Running; 1 dump crash node). H-8 lulus (CPU sekitar 8%, disk sekitar 1%) | Daftar putih (§4.1 butir 2) dan penjadwalan diputuskan controller/USER sebelum W (P3-10). Runner hanya melapor (dan pada mode ketat menunda); ia tidak mematikan cron, gateway, atau proses apa pun (§5.1). R3-H: D-442 menjadikan cek informatif |
| L3-2 | HS-8 sebagian diimplementasikan: `postcheck` mencakup draft-check (draf JSON), `studio-report check` (MD-native, H3-G), dan `classify` S3/S4. Belum: R20 revisi S1/S2, SQL MU-1 sesudah M, checker G_A sesudah R9A | Dikerjakan controller terpisah (protokol §6.5 E-11). Laporan MD-native kini diperiksa tanpa efek server, sehingga tidak lagi otomatis berkelas `lainnya` karena "cek tak tersedia" |
| L3-3 | Pemantau selama run menjelajah `%TEMP%` (sekitar 270 ribu berkas) dan workspace tiap 30 s, ditambah satu panggilan PowerShell | Beban tambahan kecil yang sama untuk kedua arm. `--monitor-interval 0` mematikannya (dicatat di meta), tetapi jangan dipakai di uji ketiga (caveat beban wajib, protokol §21.3) |
| L3-4 | `toolcalls` kini menyertakan sesi turunan secara bawaan (D-440). Sesi uji di smoke punya 51 turunan, sehingga CSV bisa jauh lebih besar dari sesi tunggal | N_agent tetap dihitung analis dengan jendela [START, END] (§6.2), sehingga turunan di luar jendela tidak masuk. `--no-children` hanya untuk pembanding |
| L3-5 | `token_count` pesan assistant kosong pada sampel `state.db` yang dilihat | Token per segmen = TIDAK-TERSEDIA (AS3-3); token sesi dari `usage_<run>.json` |
| L3-6 | Salinan db + wal + shm tidak atomik. Bila Hermes menulis saat penyalinan, salinan dapat sedikit tertinggal | Sesi run sudah selesai saat `toolcalls` berjalan. Bila kueri gagal, jalankan ulang (`--force`). `--verify-source` memperingatkan bila sumber berubah selama penyalinan |
| L3-7 | Isi `<run>_host_pre.txt` (baris perintah proses, disensor dan dipotong) berada di `contract_ab3/sessions/`, yang dapat dibaca Hermes | Sesuai lokasi protokol §5.2. Sensor menutup nilai rahasia dan pola kunci/token |
| L3-8 | Sesudah freeze, perubahan `ab3.py`, `bin/trial-log`, atau `bin/trial-log.cmd` menggagalkan cek. Sha di §1 adalah keadaan sesudah uji asap H3-F dan sudah basi untuk `ab3.py` | Freeze diambil sesudah versi final (H3-G); sha alat terekam di `freeze.sha256` dan `freeze.origin.json` |
| L3-9 | L-3 sampai L-11 harness 05 (kunci timing `studio-report`, pewarisan env, konversi MSYS, cache tsx, `draft-check` tanpa timing) tetap berlaku | Lihat `05_retrial_harness.md` §6 |
| L3-10 | Pada host ini, setelah daftar izin, `isolation-check` TETAP GAGAL (2026-10-31 sekitar 21:50 WIB): H-1 (masih sekitar 64 proses di luar daftar), H-2/H-3 (kartu kanban `t_e5354c07` assignee `gsp-worker` sedang berjalan dan menulis di `kanban/workspaces/t_e5354c07/`), H-4 (berkas baru oleh proses lain di `%TEMP%`: jejak RdClient `DiagOutputDir`, log `Diagnostics/WINWORD`, folder acak, `wake_recheck_*`; dump crash WSL node), H-5 (cron `sysman-gateway-monitor` dan `sysman-wake-round-guard` menulis `docs/2026-10-31_gateway-watch-round/ronde-*.md` kira-kira tiap 10 menit, kartu OSINT menulis `docs/2026-10-31_osint-deep-paper-1031/`). H-6, H-7, H-8, H-9 lulus | Yang tersisa di H-1 adalah proses di luar tiga kategori izin: sesi Claude Code dan server MCP-nya (`3dsmax-mcp`, `blender-mcp`, `autocad-mcp`, `ezdxf-mcp`, bash controller), server DEV :9021 (`dev9021.js`, `next dev`, Chromium Playwright), `hq-server.mjs` (:9011), `server.py` hermes-venv (:9136-:9139), `gsp-brahma` (:9012), `node bridge.mjs`, `watch_cards.py`, dan pekerja kanban (`hermes.exe -p gsp-worker --cli`, anak bash dan python-nya). **Diputuskan USER D-442**: uji ketiga tetap dijalankan di host sibuk; H-1..H-5 informatif dan dicatat per run (beban host pre/post); controller tidak menghentikan proses USER. Temuan ini kini masuk caveat beban di analisis (protokol §21.3), tidak menahan run |
| L3-11 | `postcheck` memakai `npx tsx` (tsx dari cache/instalasi lokal) dan menulis ke cache tsx (`%TEMP%/tsx-TRIAL`, dikecualikan) | Jalankan sesudah `snapshot post`; panggilan `postcheck` sendiri tidak mengubah diff run |
| L3-12 | (R3-H) Kode H3-G menjadikan SEMUA cek H-1..H-9 informatif pada mode bawaan (`ab3.py:1812-1832`), sedangkan D-442 menyebut H-1..H-5 | Protokol §21.2 mengusulkan H-6..H-8 informatif dan H-9 tetap kewajiban controller (pelanggaran = penyimpangan); perlu konfirmasi controller (protokol §21.9 K-1) |
| L3-13 | (R3-H) KE-5 uji ketiga mengikuti D-442: berkas S3/S4 dihitung hanya bila terbukti disentuh run lewat log sesi. `postcheck` masih mengklasifikasi dengan arah lama (`asal_usul_D435`, ragu = dihitung) dan menghitung bukti token fakta hanya bila B=1 (`ab3.py:2152-2158`) | [menunggu H3-G]: kelas `terbukti_run` per berkas (bukti sentuh langsung dan tak langsung, independen dari B). Sampai ada, controller menghitung kelas D-442 dari `A_rujukan` di `postcheck.json` dan kueri token terpisah atas salinan `state.db` (protokol §21.4) |
| L3-14 | (R3-H) Laporan arm B akhir memuat baris `basis:` dari S2 (brief 06 §6: basis tidak disalin sesudah S3), sehingga `check` berjalan pada mode update dengan basis lebih lama dari revisi terkini | Hipotesis: R08 validate tidak memeriksa jendela revisi (Grep `baseRevisionNo` di `src/app/api/studio/validate` = 0). Bila postcheck W menunjukkan isu karena basis, controller mencatatnya; brief tidak diubah selama uji (protokol §21.5) |

## 9. Perubahan R3-H (2026-11-01)

Baris dok R3-H (data-analyst) menyelaraskan berkas ini dengan D-441, D-442, D-443 dan kode `ab3.py` H3-G yang terlihat di disk (baca saja). Kode tidak diubah. Bagian yang disunting: frontmatter; §1 (catatan sha basi); §2 butir 2, 9, 11, dan butir baru 12-13; §3 (catatan mode informatif, kunci meta H3-G); §4.1 butir 1-5; §4.2 butir 0-3, tabel opsi, kode keluar; §4.3 paragraf akhir; §4.4 (perintah, MD-native, `asal_usul_D435`); §5 (kalimat pengantar) dan §5.1 (paragraf "tetap WAJIB"); §6 paragraf arm B; §7 (catatan); §8 L3-1, L3-2, L3-3, L3-8, L3-10, dan butir baru L3-12..L3-14; bagian ini. Teks lain tidak berubah.

Menunggu H3-G: sha final berkas alat dan uji asap (§1, §4.1 butir 1, §7); laporan H3-G yang mengonfirmasi `--strict-isolation`, kunci meta baru, dan postcheck `studio-report check` (§2 butir 12-13); kelas KE-5 D-442 di `postcheck` (L3-13).
