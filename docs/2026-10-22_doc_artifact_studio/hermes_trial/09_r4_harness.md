# 09 r4: Runner uji putaran 4 (HARNESS4)

Status: siap untuk freeze, kecuali tanda `[menunggu FIG-03]` di brief U-DOC. Ditulis controller 2026-11-02 (D-494), sesudah tiga agen macet tanpa progres pada bagian MCP.

## 1. Berkas

| Berkas | Isi |
|---|---|
| `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/harness_ab4/ab4.py` | Runner utama (turunan `ab3.py`): trial-log, run-session, snapshot, freeze, isolation-check, toolcalls (kenali alat MCP), postcheck, csvcheck |
| `harness_ab4/ab4_mcp.py` (baru, 480 baris) | Bagian MCP protokol r4 §8: `mcp-baseline`, `mcp-status`, `mcp-unblock`, `mcp-wrap`, `make-prompt`, `phases` |
| `harness_ab4/selftest/fake_hermes.py` + `.cmd` | Hermes palsu untuk uji asap; menolak berjalan atas config asli |

`ab4.py` diubah sedikit: perintah baru di `main`, A-0 + penjaga `MCP_WRAP_REQUIRED` di awal `run-session`, `ab4_mcp.py` masuk `TOOL_FILES` (ikut freeze). Cadangan sebelum perubahan: scratchpad sesi `ab4.py.pre-mcp`.

## 2. Perintah baru

| Perintah | Fungsi |
|---|---|
| `mcp-baseline [--force]` | Baca saja: sha256 + hitung `studio` config Hermes -> `controller_ab4/mcpcfg/baseline.json`. Menolak config yang memuat entri studio atau rahasia |
| `mcp-status` | A-0 sekarang (sha dan hitung studio = baseline, rahasia 0) + status blokir. Keluar 0 hanya bila bersih |
| `mcp-unblock --reason "..."` | Buka blokir `MCP_RESTORE_FAILED` hanya bila config sudah = baseline; alasan dicatat di `mcpcfg/unblock_log.md` |
| `mcp-wrap <RUN> --mcp <toolset> [--agent ID] -- <argumen run-session>` | A-0, M-1 cadangan + cmp, M-2 sandbox kosong, M-3 `mcp add` (toolset, akar `SB;<akar baca>` per D-490, cek "Found N tool(s)", rahasia 0, rujukan `${env:INTERNAL_API_SECRET}`), M-4 run-session, M-5 `mcp remove`, M-6 pulih `cp -p` + cmp + sha, toolcalls, M-7 cmp kedua, M-8 hitung proses node `mcp/server.ts` (tidak dihentikan), M-9 log stderr server -> `controller_ab4/mcpcalls/<run>_mcpcalls.csv` + cek semua `fileWrites` di `SB` + daftar sandbox, M-10 pindai rahasia |
| `make-prompt <RUN> --brief <brief>` | Prompt per run: kepala run + bagian brief untuk arm itu. Menolak brief yang masih memuat `[menunggu ...]`, dan menolak prompt arm A yang memuat nama alat `studio_*` |
| `phases <RUN>` | Batas fase: U-REP arm B dari `ts_result` panggilan MCP `studio_report_submit`/`studio_report_update` yang `ok` (E4-03); lainnya dari `trial-log mark` di `timing.csv` |

Kode keluar `mcp-wrap`: 0 lulus; 1 sesi gagal; 2 M-3 gagal (config tetap dipulihkan); 3 insiden keselamatan (tulis di luar sandbox atau rahasia ditemukan); 4 `MCP_RESTORE_FAILED` (semua sesi berikut diblokir). Galat tak terduga apa pun di dalam sesi tetap melewati M-5..M-7.

`run-session` tanpa `mcp-wrap` untuk run ber-MCP (W, R10B, R11B, R12B, M, Q, WD, DB, DB2) ditolak `MCP_WRAP_REQUIRED`. Sesi non-MCP menjalankan A-0 dulu.

## 3. Urutan controller per run

1. Sekali: `ab4.py mcp-baseline` (sudah: sha `c359917c...f28f`, studio 0, sama dengan nilai MCP-05 di protokol).
2. Sesudah FIG-03 dan brief U-DOC bersih: `ab4.py freeze`, lalu `ab4.py freeze --check`.
3. Per run, urutan protokol §7.5 (U-REP) dan §6.6 (U-DOC):
   - `ab4.py make-prompt <RUN> --brief <brief suite>`
   - arm A dan DF: `INTERNAL_API_SECRET=... ab4.py run-session <RUN>`
   - arm B, W, M, Q, WD: `INTERNAL_API_SECRET=... ab4.py mcp-wrap <RUN> --mcp <toolset tabel RUNS> --`
   - M2 memakai agentId `hermes-gsp-verifier01` lewat argumen alat (brief), bukan `--agent`.
   - `ab4.py phases <RUN>`, `ab4.py postcheck <RUN>`
4. Sebelum run berikut: `ab4.py mcp-status` harus keluar 0.

## 4. Bukti uji asap (2026-11-02, semua atas SALINAN config di `selftest/w/`)

| Uji | Hasil |
|---|---|
| `py_compile` + `-W error` kedua berkas | OK |
| Pindai nama tak terdefinisi (AST) `ab4.py` | 0 (sesudah perbaikan `AB3`) |
| `mcp-baseline` + `mcp-status` atas config ASLI (baca saja) | sha `c359917cad01f2f7...`, studio 0, A-0 OK; mtime config tetap 10-10 21:26 |
| Siklus penuh `mcp-wrap TEST --mcp reports -- --dry-run` | A-0 OK, M-1 identik, M-3 found 9/9 rahasia 0, run-session exit 0, M-6 cmp identik, M-7 identik, M-8 0, M-9 2 panggilan, M-10 0, rc 0; salinan config identik dengan asli |
| Tulis di luar sandbox (log palsu `Desktop/bocor.html`) | M-9 `tulis_luar_sandbox=1`, rc 3; config tetap pulih identik |
| Galat tak terduga di dalam sesi (sebelum perbaikan) | Menemukan dua bug warisan (`RUNS` 5 kolom dibongkar 3; `AB3`) dan celah pemulihan; sesudah perbaikan galat apa pun tetap melewati M-5..M-7 (diuji dengan prompt hilang: rc 1, config identik) |
| Pemulihan gagal paksa (config hanya-baca) | M-6 `SALIN_GAGAL:PermissionError`, rc 4, berkas blokir ditulis |
| Sesi berikut saat blokir | `mcp-wrap W` dan `run-session R10A` ditolak `MCP_RESTORE_FAILED` |
| `mcp-unblock` | Ditolak `A0_FAILED` selama config != baseline; diterima sesudah dipulihkan tangan; `mcp-status` rc 0 |
| `make-prompt` brief laporan | TEST (B) 6/8 bagian, TESTA dan R10A (A) 5/8 tanpa `studio_*`, Q 7/8 |
| `make-prompt` brief dokumen | Ditolak `BRIEF_PENDING`: `[menunggu FIG-03: grafik/diagram]` (diharapkan) |
| `phases` sintetis | R10B: submit gagal `BASIS_MISSING` dilewati, S1/S2/S3 = submit ok + 2 update; R10A dari mark START/S1/S2 |
| Folder uji asli | 16/16 sha FACTS4 OK; tidak ada berkas baru di `controller_ab4`, `contract_ab4`, `doc_ud1` selain `mcpcfg/baseline.json` |

## 5. Batas yang diketahui

- Hermes asli belum pernah dijalankan lewat `mcp-wrap`; bentuk keluaran `mcp add` ("Found N tool(s)") dan lokasi log stderr MCP (`profiles/gsp-master01/logs/mcp-stderr.log`) diambil dari uji MCP-05. Run W (pemanasan) adalah uji nyata pertama; bila M-3 atau M-9 tidak cocok, berhenti dan perbaiki sebelum R10B.
- Folder run U-REP (akar baca) belum dibuat sebelum sesi agar snapshot pra-START tidak berubah; server MCP menerima akar yang belum ada.
- `toolcalls` pada `--dry-run` memberi peringatan `SESSION_NOT_FOUND` (tidak ada sesi Hermes); bukan galat.
- `freeze` belum dijalankan; menunggu FIG-03 dan brief U-DOC bersih.
