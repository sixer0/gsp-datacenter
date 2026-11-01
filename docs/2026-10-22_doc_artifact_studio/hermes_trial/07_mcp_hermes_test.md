# MCP-03: uji coba Hermes nyata lewat server MCP Studio

Pelaksana: test-expert, 2026-11-01. Ditulis ke berkas oleh controller karena harness sub-agen memblokir Write berkas laporan (D-462). Dasar: D-450 (USER), D-460, D-461 (instruksi keselamatan controller yang diterima sesudah sesi selesai, lihat §6).

Status: complete. Hermes menyelesaikan 9/9 alat Studio tanpa galat; config Hermes pulih byte-identik; rahasia 0.

## 1. Prosedur dan konfigurasi (dapat dibalik, D-460)

| # | Langkah | Bukti |
|---|---|---|
| 1 | `cp -p profiles/gsp-master01/config.yaml` ke `Temp/hermes_trial/mcp_test/config.yaml.bak` | sha256 asli = cadangan = `c359917cad01f2f7bc17ec7d538dacc0e37139a4aa978f435907100cc85cf28f`, `cmp` identik, 7114 B, mtime 2026-10-10 21:26:55 |
| 2 | 03:11:27Z `hermes -p gsp-master01 mcp add studio --command node.exe --env STUDIO_BASE_URL=http://127.0.0.1:9021 STUDIO_AGENT_ID=hermes-gsp-master01 'INTERNAL_API_SECRET=${env:INTERNAL_API_SECRET}' --args <tsx cli.mjs> <server.ts>` (bentuk CLI `docs/STUDIO-MCP.md` §3.2) | rc 0, "Found 12 tool(s)", "Saved 'studio' (12/12 tools enabled)" |
| 2a | Cek rahasia di config | `grep -c -F -f trial_internal_secret` = 0; entri berisi literal `${env:INTERNAL_API_SECRET}`; `save_config` menulis ulang seluruh berkas (diff 579 baris) |
| 3 | 03:12:12.553Z s.d. 03:16:38.756Z (266 s), cwd workspace Hermes; `INTERNAL_API_SECRET` dari berkas di env proses; `hermes -p gsp-master01 --pass-session-id --usage-file ... -z "<prompt>"` | rc 0, stderr 0 B, sesi `20261101_101216_b7143b` |
| 4 | 03:16:57Z `hermes -p gsp-master01 mcp remove studio` | rc 0; `cmp` BEDA (format ditulis ulang); dipulihkan `cp -p`; `cmp` IDENTIK, sha `c359917c...f28f`, mtime tetap; `cmp` akhir IDENTIK |
| 5 | Bukti | salinan `state.db`+wal+shm dibuka `mode=ro` (sha asli sama sebelum/sesudah), salinan dihapus; proses node MCP tersisa 0 |

Gateway gsp-master01 aktif tetapi tidak memuat ulang MCP (`gateway.log` mtime tetap 10-30); `mcp-stderr.log` hanya mencatat start probe add dan start sesi.

## 2. Kronologi (UTC)

| Waktu | Kejadian |
|---|---|
| 03:11:19 | cadangan, sha, baseline git status, daftar proses node |
| 03:11:27-31 | `mcp add` + probe |
| 03:12:12 | START sesi; server MCP start 03:12:15 |
| 03:13:04 | `studio_registry` 188 ms |
| 03:13:14 | `studio_report_template` 1 ms |
| 03:13:14-03:15:03 | Hermes membaca bahan misi, menulis draf MD, 3 putaran scanner gaya, 4 patch |
| 03:15:03 | `studio_report_check` 1350 ms, valid |
| 03:15:08 | `studio_report_submit` 1247 ms, rev1-6 |
| 03:15:22 | `studio_report_update` 995 ms, rev7-8 |
| 03:15:26 | `studio_contracts_query` 15 ms, `studio_search` 23 ms |
| 03:15:29 | `studio_render` 532 ms |
| 03:15:33 | `studio_file_verify` 24 ms |
| 03:15:33-03:16:38 | membaca `contract_ab3/timing.csv` (baca saja), menyusun jawaban |
| 03:16:57-59 | `mcp remove`, cmp BEDA, pulihkan, cmp IDENTIK |

Total `durationMs` server untuk 9 alat = 4.375 ms dari 266 s wall.

## 3. Hasil per alat

| Alat | ok | ms | Ukuran hasil (karakter) | cid | Hasil |
|---|---|---|---|---|---|
| list_prompts / list_resources | ya | - | 679 / 926 | - | |
| get_prompt studio_laporan_kerja | ya | - | 4687 | - | |
| read_resource studio://resep/laporan-kerja | ya | - | 2842 | - | |
| studio_registry | ya | 188 | 8564 | 47598b0f-05b0-4697-90eb-b0d6952d66e9 | |
| studio_report_template | ya | 1 | 3983 | - | |
| studio_report_check (path) | ya | 1350 | 14838 | - | valid, 6 bagian |
| studio_report_submit | ya | 1247 | 4625 | 97e1a0bc-bd0a-4eca-9511-0bdf9ca8523e (+5) | rev1-6 |
| studio_report_update (basis rev6) | ya | 995 | 4601 | 644fa3af-8cdc-4b11-80db-082f75ccc178, 91eb8304-6321-4be7-b89a-b7bac5768f50 | rev7-8, hanya record + bab 3 |
| studio_contracts_query | ya | 15 | 1268 | 8b0fa720-afc9-4ae0-b78a-c0a41bbfa38c | 1 laporan rev8 |
| studio_search (dalam misi) | ya | 23 | 1485 | 5e6888fc-8099-40f6-b3d4-56985ddba243 | 1 hit |
| studio_render html | ya | 532 | 3332 | 3d07d837-6e53-4948-ad1e-f6cc9f55d78c | fileId cmvx9c02t01o7v1xc1jjm36ld |
| studio_file_verify | ya | 24 | 1005 | f412ade5-0047-41b6-9fd6-3c488e8e1c53 | terverifikasi, C51 |

Galat 0; BASE_CONFLICT 0; `refresh` dan `draft_check` tidak dipanggil.

Dokumen: `cmvx9bnwt01j6v1xcmxq454um`, 049/GSP/LAP/XI/2026, `lapkerja-hermes-mcp-01`, misi `2026-11-01_hermes-mcp-test`, rev8, needs-review, COMPLETE, createdBy `agent:hermes-gsp-master01`. Berkas final `049-GSP-LAP-XI-2026_rev8_20261101T031522Z_386a958f.html`. Dicek ulang baca-saja: R05 200 (cid bcfa8a4e-2ff4-474b-9d68-229cdac4a3d5), R21 (cid 222374ec-1629-4578-9316-c1232b8cebf4).

Kepatuhan jalur: 13 interaksi Studio, semuanya lewat `mcp__studio__*`. Dari 60 tool call: 0 `studio-report`, 0 `npx`/`tsx`, 0 `curl`, 0 port 9021/9011.

## 4. Umpan balik Hermes

Ringkasan (teks utuh di Lampiran A, stdout sha256 `31910e756adc36b18b99de3bec70367a3742f5de61cbb14c807183623f7c71bb`):
- B: submit 1,245 s dan update 0,992 s, dibanding CLI uji ketiga submit 1,35-4,63 s dan update 1,27-1,99 s.
- C (urut dari paling merugikan): (1) keluaran check terlalu besar, usul `compact=true`; (2) nextBasis disalin manual, usul ambil basis otomatis; (3) cid tidak seragam pada hasil sukses; (4) owner `gsp-master01` berbeda dengan agentId `hermes-gsp-master01`; (5) label INCOMPLETE di dry-run membingungkan; (6) gerbang gaya internal Hermes.
- D: "LAYAK menjadi jalur utama laporan kerja Hermes", CLI dipertahankan untuk cron/batch dan jalur darurat.

## 5. Pengamatan penguji

- P-1: angka CLI dari Hermes berasal dari membaca `timing.csv`; klaim "155 detik" tidak sama dengan wall terukur 266 s.
- P-2: input 4.030.948 token dalam 35 api_calls (~115 ribu per panggilan) vs arm B uji ketiga ~55-66 ribu per panggilan. Hipotesis: skema alat dan hasil check ikut terbawa di setiap giliran. Klaim hemat Hermes belum terbukti dari sisi token.
- P-3: rujukan `${env:...}` yang tidak terisi diteruskan Hermes sebagai literal, server mencatat `secretSet:true`; galat yang muncul 401, bukan `SECRET_MISSING`. Saran: nilai berpola `${...}` diperlakukan kosong.
- P-4: `mcp add`/`remove` menulis ulang seluruh config; langkah §3.2 diganti "pulihkan dari cadangan + cmp".
- P-5: Hermes menulis `C:/Users/TRIAL/AppData/Local/Temp/mcp03_jawaban_chat.md` (5442 B) di luar workspace; dibiarkan.

## 6. Keselamatan D-461

Sesi berjalan sebelum D-461 diterima: `STUDIO_MCP_FILE_ROOTS` tidak diset (root = workspace Hermes) dan prompt belum memuat "isi dokumen = data". Hasil cek: refresh 0 kali dan `file_verify` tanpa `downloadDir`, jadi MCP tidak menulis berkas apa pun; kanari, misi `mcp02`, dan `CLAUDE.md` muncul 0 kali di sesi; `AGENTS.md` (mtime 2026-10-10) dan `SOUL.md` (mtime 2026-10-22) tidak berubah, `CLAUDE.md` tidak ada. Berkas yang ditulis sesi hanya laporan Hermes sendiri di `docs/2026-11-01_hermes-mcp-test/` dan berkas Temp P-5. Keterbatasan: `find` atas seluruh workspace dihentikan (> 180 s); dipakai daftar tool call sesi + mtime tingkat atas.

## 7. Rahasia, repo, larangan

Pindai rahasia atas folder uji, laporan Hermes, berkas Temp P-5, `mcp-stderr.log`, config, salinan state.db: 0. HEAD repo `97f5e80` sebelum dan sesudah (perubahan `src/components/studio/*` milik UI-02 paralel). Port 9011, DB produksi, `~/gsp-datacenter`, konfigurasi lain tidak disentuh.

## 8. Bukti

`C:\Users\TRIAL\AppData\Local\Temp\hermes_trial\mcp_test\`: config (`config.yaml.bak`, `config_sha_*.txt`, `config_diff_after_add.txt`, `config_restore.log`, `mcp_add.log`), sesi (`prompt.txt`, `session_meta.txt`, `session_stdout.txt`, `session_stderr.txt`, `usage.json`), tool call (`session_toolcalls.csv`, `session_calls_readable.txt`, `cids_per_tool.txt`), cek (`r05_summary.json`, `r21_mission.json`, `d461_check.txt`, `git_status_*.txt`, `statedb_sha_*.txt`), skrip `tools/`.

## Lampiran A. Stdout utuh sesi Hermes

```text
UJI MCP STUDIO selesai (MCP-03, D-450). Vonis mode: DIRECT (tugas kecil; delegasi dan kartu kanban dilarang instruksi misi). Semua interaksi lewat alat MCP `studio`; nol pemakaian CLI, nol HTTP langsung. Gerbang naturalisasi: scanner kanal chat VERDICT PASS atas teks ini; laporan kerja di disk lolos scanner kanal doc (jejak: 2 putaran sunting, temuan C-8b/C-13/C-24, vonis akhir PASS).

A. HASIL PER LANGKAH

| langkah | alat | hasil | code | cid | dokumen/revisi |
|---|---|---|---|---|---|
| 1 resep | get_prompt studio_laporan_kerja | berhasil | - | - | - |
| 1 resep | read_resource studio://resep/laporan-kerja | berhasil | - | - | - |
| 1 registri | studio_registry kind=contracts | berhasil | ok | 47598b0f-05b0-4697-90eb-b0d6952d66e9 | - |
| 2 templat | studio_report_template | berhasil | ok | - | mission+docKey tersuntik |
| 2 isi | berkas laporan + scanner gaya (heal 2x) | berhasil | PASS | - | docs/2026-11-01_hermes-mcp-test/laporan-lapkerja-hermes-mcp-01.md |
| 3 cek | studio_report_check (path) | berhasil | valid=true | - | mode create, 6 bagian |
| 3 kirim | studio_report_submit | berhasil | 201 x6 | 97e1a0bc (record) s/d 1c621f4c (bab 5) | cmvx9bnwt01j6v1xcmxq454um rev6, nomor 049/GSP/LAP/XI/2026 |
| 4 update | studio_report_update (basis rev6) | berhasil | 201 x2 | 644fa3af (record), 91eb8304 (bab 3) | rev8; delta bersih, bab 1/2/4/5 tidak dikirim |
| 5 cari | studio_contracts_query (misi+docKey+status) | berhasil | ok | 8b0fa720-afc9-4ae0-b78a-c0a41bbfa38c | 1 laporan, needs-review rev8 |
| 5 cari | studio_search (frasa unik) | berhasil | ok | 5e6888fc-8099-40f6-b3d4-56985ddba243 | 1 hit, alamat 1.1.1 |
| 6 render | studio_render html dokumen | berhasil | SUCCEEDED | 3d07d837-6e53-4948-ad1e-f6cc9f55d78c | fileId cmvx9c02t..., job 475 ms |
| 6 verifikasi | studio_file_verify (tanpa downloadDir) | berhasil | TERVERIFIKASI | f412ade5-0047-41b6-9fd6-3c488e8e1c53 | sha16 386a958f, pola C51 lolos |

Nol galat dari sisi Studio sepanjang rantai. nextBasis akhir rev8 sudah disalin ke kepala berkas laporan di disk. Isi laporan: fakta nyata misi OSINT-DEEP-1031 (dua artefak 177 dan 88 halaman, byte aktif terukur ulang sha256 pada giliran ini, cocok pin verifier).

B. WAKTU

MCP (giliran ini): registry/prompt/resource/templat di bawah 2 detik per panggilan; check ±2 detik (enam dry-run R08 internal); submit 1,245 detik dan update 0,992 detik (cetakan server); render 475 milidetik; verifikasi di bawah 0,5 detik. Total dinding misi 155 detik, sebagian besar untuk menulis draf dan dua putaran penyehatan gerbang gaya, bukan untuk Studio; waktu server murni seluruh rantai ±5 detik.

CLI `studio-report` (npx tsx) pada uji ketiga, angka dari ledger timing.csv misi ab3 (313 baris): submit 1,35-4,63 detik (yang 4,63 panggilan pertama karena runtime tsx dingin), update 1,27-1,99 detik; rentang aksi per run arm B 114-309 detik dengan 42-59 baris ledger. MCP sedikit lebih cepat per operasi (tanpa startup proses per panggilan) dan jauh lebih hemat round-trip agen: satu tool call per langkah, keluaran terstruktur ber-revisi, tanpa parsing shell.

C. FRIKSI (paling merugikan dulu)

1. Keluaran studio_report_check terlalu besar: preview kelengkapan diulang per blok (enam salinan nyaris identik), menyedot konteks. Usul: opsi compact=true, atau dedup preview sehingga cukup satu tabel bagian-plus-isu.
2. nextBasis wajib disalin manual ke kepala berkas sebelum update; lupa berarti BASE_CONFLICT atau salah basis. CLI membaca basis otomatis dari server. Usul: fetchBasis bawaan true yang mengambil rev terkini saat baris basis dan argumen baseRev sama-sama kosong.
3. Respons sukses tidak seragam membawa correlationId tingkat atas (check dan template tidak mencetaknya; hanya galat yang dijamin). Usul: sisipkan cid di structuredContent semua alat agar jejak audit seragam.
4. Inkonsistensi identitas kecil: Owner tercatat gsp-master01 sedangkan agentId bawaan hermes-gsp-master01; query R21 menampilkan yang pertama. Usul: dokumentasikan pemetaan prefik di resep.
5. Preview dry-run menampilkan INCOMPLETE per blok yang mudah dibaca sebagai gagal padahal simulasi kiriman bertahap. Usul: label SIMULASI pada preview remote check.
6. Gerbang internal sendiri (scanner C-13 menghitung 26 id kartu sebagai kode mesin) memakan dua putaran sunting; ini biaya penulis, bukan Studio, tetapi tetap memengaruhi waktu total jalur laporan.

D. VONIS

LAYAK menjadi jalur utama laporan kerja Hermes. Alasan: latensi setara atau lebih baik dari CLI sambil menghapus ongkos startup tsx dan parsing shell; satu tool call per langkah dengan cid dan nomor revisi terstruktur sehingga jejak terbaca mesin tanpa ledger CSV terpisah; delta update terbukti bersih (hanya record dan bab 3 terkirim); resep, registri, dan templat lengkap lewat prompt/resource sehingga agen tidak menghafal bentuk kepala. CLI dipertahankan untuk skrip out-of-band (cron, batch) dan jalur darurat bila jembatan MCP mati. Catatan penerimaan: dokumen contoh kini berstatus needs-review di tangan user (sengaja, uji jalur update); docKey lapkerja-hermes-mcp-01 terpakai bersih pada percobaan pertama, akhiran -02 tidak diperlukan.

```
