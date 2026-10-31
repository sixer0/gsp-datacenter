---
task_id: doc_artifact_studio
task_row: HARNESS2 (D-421 decisions.md:426; prasyarat P-5 research/13 §9)
date: 2026-10-31
agent: coder-execution
status: complete
inputs: research/13_contract_efficiency_protocol_r2.md (C-01..C-11, §6, §8); research/11 §5.1, §5.3; hermes_trial/05_contract_retrial_brief.md; scripts/studio/studio-report.ts (baca saja)
amended: R2-08 (2026-10-31; D-422, D-423) oleh data-analyst. Yang diubah: nama env identitas (§3.2 langkah 4, §4), aturan cache tsx (§3.2 langkah 0, L-9), urutan runner ditegaskan (§3.2), prompt W (§3.2 langkah 1), status L-1, L-2, L-6, serta L-9..L-11 baru (§6). Kode ab2.py tidak diubah
---

# Runner uji ulang kontrak A/B (HARNESS2): cara pakai

Runner ini milik controller dan berada di LUAR repo. Isinya `trial-log` (dipanggil Hermes), `run-session`, `snapshot`, `freeze`, dan `csvcheck` (dijalankan controller). Hanya pustaka standar Python, tanpa dependensi baru.

## 1. Berkas

Folder: `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab2/`

| Berkas | Isi |
|---|---|
| `ab2.py` | satu berkas alat (protokol 13 §8.1 "satu berkas alat beku"); semua subperintah |
| `bin/trial-log` | pembungkus Git Bash (`MSYS_NO_PATHCONV=1`, lalu `python -I ab2.py trial-log ...`) |
| `bin/trial-log.cmd` | pembungkus cmd.exe, isi sama |
| `smoke_test.sh` | uji asap run palsu `TEST` (folder terisolasi, dibersihkan sendiri) |
| `state/` | kunci tulis (`timing.lock`, `retrieval.lock`), `current_run.json`, penanda `pre_<run>.marker` |

Python yang dipakai pembungkus: `C:/Users/TRIAL/AppData/Local/Python/pythoncore-3.14-64/python.exe` (cadangan: `python` di PATH). sha256 `ab2.py`, `bin/trial-log`, dan `bin/trial-log.cmd` masuk ke `freeze.sha256` (§3.1), jadi perubahan alat sesudah freeze menggagalkan cek sebelum sesi.

Keluaran:

| Path | Penulis |
|---|---|
| `contract_ab2/timing.csv` | baris `src=harness` (START sesi), `trial-log` (Hermes), `studio-report --timing` |
| `contract_ab2/retrieval.csv` | `trial-log answer` |
| `contract_ab2/sessions/<run>_{stdout,stderr}.txt`, `<run>_meta.txt`, `usage_<run>.json` | `run-session` / hermes |
| `contract_ab2/sessions/snap_<run>_{pre,post,diff}.json`, `disk_<run>_{pre,post}.txt`, `disk_<run>_new_S3S4.txt`, `grep_<run>.txt` | `snapshot` |
| `controller_ab2/freeze.sha256`, `controller_ab2/precheck_<run>.txt`, `controller_ab2/leak_<run>.txt` (hanya bila ada temuan) | `freeze` / `run-session` |

`freeze.sha256` dan `precheck_*` sengaja ditaruh di `controller_ab2/`, bukan di `contract_ab2/sessions/`, karena isinya menyebut path kunci Q (D-416 butir f). Path freeze bisa diganti dengan env `TRIAL_FREEZE_FILE`.

## 2. Format data

- `timing.csv`: header 20 kolom byte-identik dengan `11:192-213`. Kutipan RFC 4180 (modul `csv` Python, `QUOTE_MINIMAL`), pemisah baris LF (C-01). CR/LF di dalam medan diganti ` / `, sehingga satu baris data selalu satu baris fisik. Header dicek sebelum setiap tulis. Berkas yang header-nya lain atau tidak diakhiri LF ditolak tanpa diubah (aturannya sama dengan `TimingSink.open` di `studio-report`).
- `seq` = 1 + jumlah baris run itu di berkas (aturan yang sama dengan `studio-report`). `inv` = nomor pemanggilan `trial-log` dalam run.
- `note` dari `trial-log`: `src=trial-log;inv=<n>;act=<0|1>;idsrc=<env|state>[;kunci lain][;msg=<catatan Hermes>]`. Arti kunci:
  - `act=1`: baris mewakili aksi agen yang dihitung KE-2 (`step`, `get`).
  - `act=0`: penanda yang tidak dihitung (`mark`, `qmark`, `answer`), sesuai RK-2.
  - `format_lookup` ditambahkan otomatis bila catatan memuatnya.
  - Kunci lain: `marker=hermes`, `qmark=Q1A`, `secret_src=env|file`, `sha_ok=true|false` (HEAD `?verify=1`), `final_name=...`, `code_missing`, `refused=...`, `dir`, `msys_conv_fixed`.
- Baris START harness: `step_id=S0`, `scenario_marker`, `START`, `note=src=harness;inv=0;act=0;dry_run=<0|1>;prompt_sha16=...`. `t_start_utc` sama dengan `start_epoch` di meta.
- Baris `studio-report` (R2-08): `note` tanpa `src=`, `via=`, atau `inv=`. Ada satu baris `step_kind=api` per HTTP (`action` = `<METODE> <route>`, `note` = `blok <n> <bagian>`, `basis`, `kelengkapan`, `render`, `unduh`, atau `verify`), ditambah tepat satu baris `step_kind=tool` per pemanggilan (`action` = `studio-report submit|update`, `note` = nama berkas draf), yang ditulis terakhir. Aturan hitung KE-2 untuk baris ini ada di protokol 13 §6.2.
- `session_id` di CSV = id harness `h-<RUN>-<UTC>`. Id sesi Hermes yang nyata diambil dari `usage_<run>.json` dan dicatat di meta sebagai `hermes_session_id`.
- `retrieval.csv`: header `11:236` (13 kolom). `t_start_utc` diambil dari `qmark START` kueri itu, `t_end_utc` dari `qmark END` (atau saat `answer` bila END belum ada). `expected_sha256`, `precision`, `recall`, dan `correct` dibiarkan kosong untuk diisi controller.
- Penulisan atomik: kunci eksklusif lintas proses (`msvcrt.locking`) atas `state/timing.lock`, lalu satu `write` + `fsync`. `answer` mengambil kunci timing lalu kunci retrieval.
- Rahasia: setiap medan disensor menjadi `[REDACTED]` bila memuat nilai rahasia. `csvcheck` dan `run-session` memindai berkas keluaran dan hanya melaporkan path, bukan nilainya.

## 3. Perintah controller

Semua perintah dijalankan dari Git Bash. Singkatan:

```bash
PY="C:/Users/TRIAL/AppData/Local/Python/pythoncore-3.14-64/python.exe"
AB2PY="C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab2/ab2.py"
```

### 3.1 Sekali, sesudah FACTS2 selesai (P-6)

```bash
"$PY" -I "$AB2PY" freeze              # sha256 contract_ab2/facts/*, contract_ab2/queries/*, controller_ab2/answers/* + berkas alat
"$PY" -I "$AB2PY" freeze --check      # cek ulang; juga mengecek facts/W.md = sha D-404 884dc89f...9138
sha256sum -c C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/controller_ab2/freeze.sha256   # cek mandiri (path absolut)
```

`freeze` menolak menimpa berkas yang sudah ada. Berkas baru di folder yang dibekukan (mis. `Q_key_resolved.md` sesudah run M) membuat cek gagal dengan tanda `BARU`. Untuk menambahkannya, jalankan `freeze --force` hanya sesudah keputusan tercatat di `decisions.md`.

### 3.2 Per run (order 0-8: W, R4B, R4A, R5A, R5B, R6B, R6A, M, Q)

Urutan per run sama dengan protokol 13: (cache tsx hangat) -> cek freeze -> `snapshot pre` -> sesi Hermes -> `snapshot post`. Cek freeze dan kedua snapshot dijalankan di dalam `run-session` (`ab2.py:962-972` dan langkah 9 di bawah). Langkah 0 dijalankan controller sebelum `run-session`, sehingga berkas cache yang muncul jatuh sebelum penanda pre dan tidak masuk S3.

0. **Cache tsx (R2-08; protokol 13 §6.5, D-423).** Pilih satu cara sebelum run W, catat di `decisions.md`, dan pakai sama untuk semua run.
   - Cara utama: panaskan cache. Pemanggilan berasal dari folder workspace Hermes dengan path absolut, sama seperti pemanggilan Hermes. Panggilan kedua harus tidak menambah berkas.

     ```bash
     TSXC=C:/Users/TRIAL/AppData/Local/Temp/tsx-TRIAL      # folder cache menurut laporan R2-01
     cd C:/Users/TRIAL/workspace/gsp-hermes/workspace
     for f in studio-report draft-check; do npx tsx "C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/$f.ts" --help >/dev/null; done
     n1=$(find "$TSXC" -type f | wc -l)
     for f in studio-report draft-check; do npx tsx "C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/$f.ts" --help >/dev/null; done
     n2=$(find "$TSXC" -type f | wc -l); echo "tsx_cache $n1 -> $n2"   # harus sama
     ```

   - Alternatif: `export TSX_DISABLE_CACHE=1` di shell controller sebelum `run-session`. Env ini diwarisi sesi Hermes karena env anak disalin dari env controller (`ab2.py:977`). Konsekuensinya: setiap pemanggilan CLI mentranspilasi ulang (waktu arm B bertambah, belum diukur).
   - Perintah di atas belum dijalankan di baris R2-08. Kode yang mungkin dimuat secara dinamis tidak terjamin ikut hangat. Run W (tidak dinilai) memakai seluruh alur CLI, jadi kemunculan `tsx_cache` di diff W adalah tanda pemanasan belum lengkap. Snapshot sendiri tidak mengecualikan `tsx-*`; label `tsx_cache` diberikan DC-46b (L-9).
1. Tulis prompt sesi ke `contract_ab2/sessions/prompt_<RUN>.txt`. Prompt tidak boleh memuat rahasia (`run-session` menolak dengan `SECRET_IN_PROMPT`). **Prompt W wajib menyebut** misi `2026-10-31_hermes-contract-ab2`, folder `w/` di bawahnya, dan `docKey` `lapkerja-w`, karena baris 1 `facts/W.md` (byte-identik, sha D-404) masih menyebut misi uji 1 (manifest 05 RK-F2). Keputusan ini dicatat di `decisions.md`.
2. Jalankan:

```bash
"$PY" -I "$AB2PY" run-session R4B        # arm/report/order otomatis dari tabel protokol 13 §7.3
```

Urutan kerja `run-session`:

1. Cek freeze. Bila gagal, sesi tidak dimulai (`FREEZE_FAILED`, rincian di `controller_ab2/precheck_<run>.txt`).
2. `snapshot pre`.
3. Rahasia dibaca dari env `INTERNAL_API_SECRET`, atau dari berkas `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret` bila env kosong. Nilainya hanya masuk env proses anak dan tidak pernah dicetak.
4. Env proses anak diisi (`ab2.py:976-986`):
   - Identitas run, dua set dengan nilai sama. `TRIAL_RUN_ID`, `TRIAL_ARM`, `TRIAL_REPORT_ID`, `TRIAL_ORDER`, `TRIAL_SESSION_ID` dibaca `trial-log` (`ab2.py:225`). `STUDIO_TIMING_RUN_ID`, `STUDIO_TIMING_ARM`, `STUDIO_TIMING_REPORT_ID`, `STUDIO_TIMING_ORDER`, `STUDIO_TIMING_SESSION_ID` dibaca `studio-report.ts` (`timingContext`, baris 772-785). Protokol 13 §8.1 sudah diselaraskan dengan pembagian ini (R2-08).
   - Lingkungan: `INTERNAL_API_SECRET`, `HQ_URL=http://127.0.0.1:9021` (dibaca `studio-report` sebagai bawaan `--remote`), `STUDIO_TIMING_CSV=<timing.csv>`, `TRIAL_TIMING_CSV`, `TRIAL_LOG`, dan `PATH` yang diawali `harness_ab2/bin`. `STUDIO_TIMING_CSV` tidak dibaca `studio-report`. Berkas timing CLI hanya ditentukan opsi `--timing`, jadi brief 05 §6 meminta Hermes selalu memberi `--timing` (L-10).
5. `state/current_run.json` ditulis dengan `active=true`.
6. Baris `scenario_marker,START,src=harness` ditulis, lalu tepat sesudahnya dijalankan:
   `C:/Users/TRIAL/AppData/Local/hermes/bin/hermes.exe -p gsp-master01 --pass-session-id --usage-file contract_ab2/sessions/usage_<RUN>.json -z "<isi prompt>"`
7. stdout/stderr disimpan utuh. Sesudah hermes selesai, `current_run.json` diubah ke `active=false`.
8. `<RUN>_meta.txt` ditulis. Kuncinya: `start_utc`, `end_utc`, `exit_code`, `wall_s`, `start_epoch`, `end_epoch`, `harness_session_id`, `hermes_session_id`, `dry_run`, `freeze_check`, `repo_head`, `prompt_sha256`, `usage_file`, `cmd` (tanpa isi prompt), `secret_src`, `secret_leak_check`, dan dua hitungan pola diff.
9. `snapshot post` + diff.

Opsi:

| Opsi | Arti |
|---|---|
| `--prompt-file P` | ganti lokasi prompt |
| `--timeout S` | batas waktu sesi dalam detik (bawaan: tanpa batas) |
| `--arm/--report/--order` | untuk run di luar tabel |
| `--studio-timing-env NAMA\|none` | ganti nama env `STUDIO_TIMING_CSV` atau matikan. Tidak berpengaruh pada `studio-report`, yang hanya membaca `--timing` (L-10) |
| `--hq-url` | ganti URL DEV; host non-loopback dan port 9011 ditolak |
| `--hermes`, `--profile` | ganti binary atau profil hermes |
| `--skip-freeze-check` | lewati cek freeze; dicatat `freeze_check=SKIPPED` di meta, gunakan hanya dengan keputusan tercatat |
| `--dry-run [--fake-agent skrip.sh] [--bash path]` | hermes diganti perintah echo, atau skrip agen palsu yang dijalankan Git Bash |

Pengaman `run-session`:

- `RUN_EXISTS`: meta run itu sudah ada. Run tidak diulang diam-diam (13 §10.3); pindahkan berkas lama sesudah keputusan tercatat.
- `RUN_ACTIVE`: ada sesi lain yang masih berjalan.
- `PROMPT_MISSING`: berkas prompt tidak ada atau kosong.
- `SECRET_MISSING`: rahasia tidak ditemukan di env maupun berkas.

### 3.3 Snapshot terpisah dan validasi CSV

```bash
"$PY" -I "$AB2PY" snapshot pre  R4B     # biasanya dipanggil oleh run-session
"$PY" -I "$AB2PY" snapshot post R4B
"$PY" -I "$AB2PY" csvcheck              # header byte-identik, 20/13 kolom, LF akhir, seq ganda, rahasia
```

Cakupan snapshot sesuai protokol 13 §6.5:

| Set | Root | Cara |
|---|---|---|
| S1 | `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab2/` | listing penuh (sha256 + byte) pre dan post |
| S2 | `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/` | listing penuh pre dan post |
| S3 | `C:/Users/TRIAL/AppData/Local/Temp/` di luar S2 | pasca-run: berkas dengan `mtime` atau `birthtime` lebih baru dari penanda pre (padanan `find -newer`; `birthtime` ditambahkan supaya berkas salinan yang mempertahankan mtime tetap tertangkap) |
| S4 | `C:/Users/TRIAL/workspace/gsp-hermes/workspace/` di luar `docs/` | sama dengan S3 |

Grep pola `contractRecord|studio\.(slot|chapter)/v2|"baseRevisionNo"|"chapterKey"` dijalankan atas setiap berkas yang ditambah, berubah, atau lebih baru, bila berkas itu teks dan berukuran di bawah 5 MB. `grep_<run>.txt` hanya memuat path, hitungan per pola, dan nomor baris, tanpa isi.

Setiap entri diff diberi `controller_owned`:

- `contract_ab2/{facts,queries,sessions}/`
- `timing.csv`, `retrieval.csv`, `docs_b.csv`, `format_*.txt`
- `harness_ab2/`, `controller_ab2/`
- `Temp/claude/` (keluaran Claude Code milik controller)

`summary.pattern_hits_not_controller` adalah kandidat butir (b) D_raw,B. `summary.s3_pattern_hits` dipakai untuk uji asap run W: hasilnya harus 0 sesudah pengecualian controller dan sesudah entri `Temp/tsx-*/` berlabel `tsx_cache` (protokol 13 §6.5) dikeluarkan. Klasifikasi DC-01 K2-K9, label `tsx_cache`, dan pengecualian draf yang lolos draft-check dikerjakan DC-46b.

## 4. Perintah untuk Hermes (disalin ke prompt atau brief)

`trial-log` tersedia di PATH sesi yang diluncurkan `run-session`. Bila tidak ada di PATH, pakai path absolut `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab2/bin/trial-log`, atau `bin/trial-log.cmd` di cmd.exe. Identitas run diambil dari env `TRIAL_*` sesi (cadangan `state/current_run.json`); tanpa identitas, alat menolak berjalan (`IDENTITY_MISSING`). Setiap pemanggilan menambah tepat satu baris ke `timing.csv`.

```bash
trial-log mark START R4B                          # aksi pertama
trial-log get C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/facts/R-4.md    # baca lembar fakta (dicatat, isi ke layar)
trial-log step edit --target C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab2/r4a/laporan.md --step S1
trial-log step read --target C:/Users/TRIAL/gsp-swarm-hq-v2.1/docs/STUDIO-AGENT-GUIDE.md --note format_lookup
trial-log step cmd --note "grep -rn t_4ead3a56 r4a/"
trial-log get "/api/studio/registry?kind=contracts" --note format_lookup   # GET DEV; badan hanya ke stdout
trial-log get "/api/studio/files/<id>?verify=1" --head --step S4            # HEAD; sha_ok tercatat
trial-log mark END R4B --note "md_baru=r4a/laporan.md"                     # sesudah S4 terverifikasi
# sesi Q
trial-log qmark START Q1 A        # juga diterima: trial-log qmark Q1A START
trial-log answer Q1 A r6a/laporan.md:8 --tool-call "grep -rn t_4ca26027 r4a r5a r6a"
trial-log qmark END Q1 A
```

Arm B, satu pemanggilan CLI per langkah (identitas baris dari env `STUDIO_TIMING_*`, berkas dari `--timing`):

```bash
npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts submit r4b/draf.md --timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv --step S1
npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts update <documentId> r4b/draf.md --timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv --step S2
npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/studio-report.ts update <documentId> r4b/draf.md --timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv --step S3 --require-complete --out C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-31_hermes-contract-ab2/r4b
```

Aturan `get`:

- Argumen `/api/...` atau `http://127.0.0.1:9021/...` menjadi permintaan HTTP ke DEV. Header `x-internal-secret` diambil dari env (cadangan: berkas rahasia). Host non-loopback dan port 9011 ditolak, dan penolakan tetap dicatat sebagai baris `ok=0`.
- Ringkasan `HTTP <status> cid=<x-correlation-id> code=<code atas>` dicetak ke stderr.
- Badan respons hanya ditulis ke stdout, tidak pernah ke disk.
- Argumen berupa path lokal: isinya dibaca ke stdout dan dicatat sebagai `read`.
- Path yang ditolak: berkas rahasia, `controller_ab2/`, `contract_ab/` (bahan uji 1), `harness_ab2/state/`, dan `contract_ab2/queries/` di luar run Q.

Exit code: 0 = berhasil; 1 = baris tercatat dengan `ok=0`; 2 = pemakaian salah atau ditolak.

Alat API utama arm B tetap `studio-report ... --timing C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/contract_ab2/timing.csv`. Identitas barisnya datang dari env `STUDIO_TIMING_*` yang diisi `run-session`.

## 5. Uji asap (bukti 2026-10-31)

```bash
bash C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab2/smoke_test.sh   # KEEP=1 untuk menyimpan artefak
```

Hasil: `RINGKASAN: PASS=45 FAIL=0`, diikuti `artefak TEST dihapus`. Uji memakai folder terisolasi lewat env `TRIAL_AB2_DIR`, `TRIAL_CTRL_DIR`, `TRIAL_STATE_DIR`, dan `TRIAL_S1_ROOT`, sehingga `contract_ab2/` nyata tidak disentuh. Hermes tidak dipanggil: dipakai `--dry-run` dengan agen palsu, dan satu run mode echo.

Yang dibuktikan:

- **Freeze**: `freeze` dan `freeze --check` OK, `sha256sum -c` lulus untuk path `C:/`, freeze menolak menimpa, W sama dengan sha D-404, dan fakta yang diubah membuat sesi tidak dimulai (`FREEZE_FAILED`, tanpa meta).
- **Identitas**: `trial-log` tanpa identitas keluar dengan exit 2.
- **Agen palsu**: 22 kode keluar sesuai harapan, termasuk:
  - GET DEV 200 dengan cid;
  - 404 dengan `ROUTE_NOT_FOUND` dan cid;
  - penolakan port 9011, host non-loopback, `queries/`, `controller_ab2/`, dan berkas rahasia;
  - `qmark END` tanpa START tercatat `ok=0`;
  - `mark END` dengan run yang salah tercatat `RUN_ID_MISMATCH`.
- **CSV**: diurai ulang secara independen. Header byte-identik, 43 baris × 20 kolom, `seq` 1..43, `inv` 1..42, catatan berkoma dan berkutip dikutip RFC 4180 (`""kutip""`), sensor `[REDACTED]` bekerja, 20 pemanggilan paralel menghasilkan 20 baris utuh tanpa seq ganda, dan `retrieval.csv` 13 kolom.
- **Snapshot**: probe S1 (draf baru), S2 (berkas berpola di `hermes_trial/`), dan S3 (berkas berpola di `%TEMP%`) semuanya terdeteksi. Meta lengkap dengan `secret_leak_check=clean`.

## 6. Batasan dan hal yang perlu dicek controller

| # | Hal | Dampak / tindakan |
|---|---|---|
| L-1 | `studio-report` membaca identitas dari `STUDIO_TIMING_*`, tidak dari `TRIAL_*`; `run-session` mengisi keduanya | **Selesai (R2-08)**: protokol 13 §8.1 kini menyebut `STUDIO_TIMING_*` untuk baris CLI dan `TRIAL_*` untuk `trial-log` |
| L-2 | Baris `studio-report` tidak memuat `src=studio-report`, `via=studio-report`, maupun `inv=` di `note` (contohnya `blok 1 record`, `basis`, `render`). Satu baris `step_kind=tool` per pemanggilan (`studio-report submit\|update`) tetap ada | **Selesai (R2-08)**: protokol 13 §6.2 menetapkan N_agent = 1 per baris `tool`, baris `api` = N_api, dan pengelompokan per rentang waktu baris `tool`. Pilihan ini dicatat sebelum uji |
| L-3 | `studio-report` menulis timing tanpa kunci berkas, dalam satu append di akhir, dengan `seq` dihitung saat dibuka | Aman bila Hermes berjalan berurutan. Pemanggilan `trial-log` di tengah satu pemanggilan `studio-report` dapat menghasilkan seq ganda, yang akan dilaporkan `csvcheck`. Protokol 13 §6.2 mengelompokkan per rentang waktu, bukan seq saja |
| L-4 | Pewarisan env dari proses hermes ke alat terminal Hermes belum diuji (hermes tidak dipanggil) | Cadangannya `state/current_run.json` (`idsrc=state`). Pastikan baris pertama run W memuat `idsrc=env`, atau terima `state`. Bila env tidak sampai, baris CLI memakai identitas bawaan (`run_id` `-`) dan dipetakan lewat jendela run (protokol 13 §8.1, AS-6) |
| L-5 | Git Bash mengubah argumen `/api/...` menjadi `C:/Program Files/Git/api/...` (terbukti di uji asap) | Pembungkus mengisi `MSYS_NO_PATHCONV=1`. Pemanggilan langsung ke `ab2.py` diperbaiki otomatis (`msys_conv_fixed`) |
| L-6 | DEV membalas `GET /api/studio/registry` tanpa `kind` dengan 400 `REGISTRY_KIND_UNKNOWN` (cid 6ea1efab) | **Selesai (R2-08)**: ini memang desain R2-02 (U-07: 400 dengan `details.validKinds` 13 kind dan contoh kueri; asap cid 5c9a601e, D-423), bukan kekurangan P-3 |
| L-7 | S3 mencakup seluruh `%TEMP%` (sekitar 274 ribu berkas; jalan stat sekitar 5 s), termasuk keluaran proses lain | Entri di luar pola didaftar tanpa dihitung (13 §6.5 butir 4) |
| L-8 | `trial-log get` atas unduhan biner menulis badan ke stdout | Unduhan final sebaiknya lewat `studio-report --out` |
| L-9 | Cache transpilasi tsx (`Temp/tsx-TRIAL/<hash>`) ditulis pada eksekusi pertama sesudah sumber berubah, dan memuat literal `studio.slot/v2`. Akibatnya positif palsu pola S3. `snapshot` tidak mengecualikannya | Langkah 0 §3.2 (panaskan cache atau `TSX_DISABLE_CACHE=1`). DC-46b memberi label `tsx_cache` dan tidak menghitungnya di D_raw,B (protokol 13 §6.5) |
| L-10 | `studio-report` tidak membaca env `STUDIO_TIMING_CSV`; berkas timing hanya dari `--timing` (`studio-report.ts:69-71`, `:803`) | Brief 05 §6 meminta `--timing` di setiap pemanggilan. Pemanggilan tanpa `--timing` tidak menulis baris dan dihitung dari log sesi (protokol 13 §6.2) |
| L-11 | `draft-check` tidak menulis timing | Hermes mencatatnya lewat `trial-log step cmd` (brief 05 §6). Bila tidak tercatat, dihitung dari log sesi (protokol 13 §6.2) |
