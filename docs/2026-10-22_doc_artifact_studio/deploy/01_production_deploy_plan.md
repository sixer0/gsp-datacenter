---
task_slug: doc_artifact_studio
dokumen: rencana deploy produksi v2.1 (metode geser port)
tanggal: 2026-11-04
penulis: coder-execution (DEPLOY-PLAN), baca-saja terhadap produksi
status: draf, menunggu persetujuan eksplisit pengguna sebelum perubahan produksi apa pun
metode: keputusan pengguna "geser original 9011 ke 9041 dulu, kemudian yang dikerjakan sekarang geser ke 9011"
---

# Rencana Deploy Produksi Swarm HQ v2.1 (Doc Artifact Studio), metode geser port

## Ringkasan

- **Metode (keputusan pengguna):** kode produksi lama di `C:\Users\TRIAL\gsp-datacenter` TIDAK disentuh (tanpa merge, checkout, build, atau tag). Server lama dijalankan ulang dari folder yang sama di port **9041**. Build v2.1 dijalankan di port **9011** dari checkout terpisah yang baru, `C:\Users\TRIAL\gsp-hq-prod-v21`. Rollback berarti menghentikan proses baru dan menjalankan proses lama lagi di 9011.
- **Basis data bersama `gsp_agent_hq`:** keenam migrasi yang tertunda murni aditif. Tidak ada DROP, ALTER TYPE, atau SET NOT NULL, dan tidak ada ALTER yang berdampak pada tabel non-Studio yang terisi. Kode lama di 9041 tetap aman dengan skema baru (bukti di §2 dan §3). Perubahan DB boleh tetap ada setelah rollback.
- **Temuan yang mengubah asumsi brief:** `IlSearchDoc` dan ekstensi `pg_trgm` **BELUM ada** di produksi. Migrasi `20260927154000` benar-benar membuat keduanya, jadi tidak cukup ditandai lewat `resolve`. Kolom `AgentRequest.requestedBy` dan tabel `WorkerTrace` sudah ada dan identik, sehingga dua migrasinya tidak melakukan apa-apa (no-op karena `IF NOT EXISTS`).
- **Penghalang seed:** `prisma/seed-studio.ts:124` menolak DB `gsp_agent_hq` (`ALLOWED_DATABASES`). Seed produksi perlu keputusan pengguna. Rekomendasi: seed dijalankan pada klon produksi bernama `gsp_agent_hq_v21_seedtest` (nama ini diizinkan penjaga), lalu data 21 tabel Studio disalin ke produksi dalam satu transaksi (§4, opsi B). Opsi A adalah perubahan kode berupa opt-in penjaga.
- **Risiko terbesar setelah deploy:** watchdog cron Hermes (tiap 3 jam) dan autostart logon (`gsp-ecosystem-start.sh`, dipicu restart mingguan **Senin 2026-11-09 05:00**) selalu menjalankan kode LAMA dari `gsp-datacenter` di 9011. Tanpa memperbarui peluncur itu, reboot berikutnya diam-diam mengembalikan produksi ke kode lama (§9, R-01).
- **Perkiraan downtime 9011:** sekitar 20-40 detik saat pergantian proses. Build, migrasi, dan seed dikerjakan sebelumnya tanpa downtime, sementara kode lama tetap melayani.

## Rincian

### 1. Keadaan produksi saat ini (bukti baca-saja, 2026-11-04 ~16:00 WIB)

Semua kueri berjalan dengan `PGOPTIONS=-c default_transaction_read_only=on`. Koneksi: `current_database()=gsp_agent_hq`, server 17.11, `transaction_read_only=on`, peran `postgres` (superuser).

#### 1.1 Proses dan port

| Port | PID | Proses | Asal |
|---|---|---|---|
| 9011 (0.0.0.0, HTTPS) | 20468 | `node hq-server.mjs`, induk `nohup.exe` PID 1344, dibuat 2026-11-02 17:34:54 | `gsp-ecosystem-start.sh` baris 119-121 (`cd gsp-datacenter && nohup node hq-server.mjs >> gsp-ecosystem/hq.log`) |
| 9012 | 24832 | Brahma WebUI | autostart / watchdog |
| 9010 (127.0.0.1) | 18068 | Hermes dashboard | autostart |
| 9021 (127.0.0.1) | 10664 | DEV `next dev -p 9021` dari repo v2.1 (peluncur `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/dev9021.js`) | DEV, DB `gsp_agent_hq_v21` |
| 5433 | 6616 | PostgreSQL 17 | layanan Windows |
| **9041** | - | **bebas** (tidak ada LISTENING) | - |
| 9031 | - | bebas (diusulkan untuk gladi, §5 fase 2) | - |

`HQ_PORT` dan `HQ_HOSTS` tidak diatur di `.env` maupun di skrip autostart. Nilai bawaan `hq-server.mjs` dipakai: 9011 dan `0.0.0.0`. Env aplikasi dibaca Next dari `C:\Users\TRIAL\gsp-datacenter\.env` (cwd proses). TLS memakai `certs/hq-key.pem` dan `certs/hq-cert.pem` relatif terhadap cwd. Sertifikat self-signed punya SAN `localhost`, `127.0.0.1`, `100.102.23.27`, berlaku sampai 2028-11-28. Folder `certs/` di-gitignore, jadi harus disalin ke checkout baru.

Build yang berjalan: `.next/BUILD_ID` bertanggal 2026-09-27 16:58. Setelah itu hanya dua berkas src yang berubah sampai HEAD 0f32367 (`src/app/api/brahma/requests/[id]/route.ts`, `src/lib/agent-roster.ts`). Instans 9041 memakai `.next` yang sama tanpa build ulang, sehingga perilakunya identik dengan yang berjalan sekarang.

#### 1.2 Repo produksi

`gsp-datacenter`: branch `ilfix-f1`, HEAD `0f32367`, tidak ada berkas terlacak yang berubah, ada 55 entri untracked (`Temp/`, `*.json`, `*.py`, `tmp_*.cjs`, dan lain-lain), remote `origin` GitHub. Dengan metode geser port, folder ini **tidak diubah sama sekali**.

#### 1.3 `_prisma_migrations` produksi

| migration_name | finished_at | applied_steps_count |
|---|---|---|
| `0_init` | 2026-08-31 11:45:13 | 0 (baseline di-resolve) |
| `20260831120000_webuiuser_hermesprofile_unique` | 2026-08-31 11:45:15 | 1 |

`prisma migrate status` (dari repo v2.1, `DATABASE_URL` produksi, exit 1) mencantumkan 6 migrasi tertunda. Keluaran lengkap (URL disensor): `deploy/02_prod_migrate_status_20261104.txt`.

#### 1.4 Objek per migrasi tertunda: sudah ada atau belum

| Migrasi | Objek | Ada di produksi? | Bukti |
|---|---|---|---|
| `20260927154000_add_ilsearchdoc` | ekstensi `pg_trgm` | **TIDAK** (hanya `plpgsql`; `pg_trgm` 1.6 tersedia di `pg_available_extensions`) | `pg_extension` |
| | tabel `IlSearchDoc` (12 kolom + `tsv` generated) | **TIDAK** | `information_schema.columns` 0 baris |
| | indeks `ilsearchdoc_tsv_gin`, `ilsearchdoc_trgm_body`, `ilsearchdoc_trgm_title`, `ilsearchdoc_source_idx` | **TIDAK** | `pg_indexes` 0 baris |
| `20260927170000_agentrequest_requestedby_backfill` | kolom `AgentRequest.requestedBy` TEXT NULL tanpa default | **YA, identik** (text, nullable, tanpa default; terisi 757/761) | `information_schema.columns` |
| `20261022120000_add_studio` | 11 enum `Studio*`, 9 tabel `Studio*`, indeks, FK | TIDAK (0 tabel dan 0 tipe `Studio%`) | `pg_tables`, `pg_type` |
| `20261023150000_worker_trace_baseline` | tabel `WorkerTrace` (7 kolom), `WorkerTrace_pkey`, `WorkerTrace_task_id_idx` | **YA, identik**: id/task_id text NOT NULL, profile/outcome text, started_at/ended_at timestamp(6), source text NOT NULL default `'mirror'`, kedua indeks sama | `information_schema.columns`, `pg_indexes` |
| `20261023200000_add_studio_structure` | 3 enum, 9 tabel, kolom tambahan di tabel Studio | TIDAK | - |
| `20261030220000_add_studio_contract` | 3 tabel kontrak, kolom kontrak, `StudioDocBlock.tsv` + GIN | TIDAK | - |

Enum `public` yang ada hanya `Role`. Indeks `WebUiUser_hermesProfile_key` ada (sesuai migrasi 20260831 yang sudah diterapkan).

#### 1.5 Hitungan baris produksi (34 tabel dasar, DB 24 MB)

`AgentEvent` 1655, `AgentRequest` 761, `AgentState` 50, `DataStore` 5, `HermesMemory` 879, `HermesTask` 2680, `Idea` 1, `OrchestrationRecord` 685, `WebUiUser` 10, `WorkerTrace` 1488, `_prisma_migrations` 2. Sisanya 0: Account, AgentBusMessage, Article, BattleRoyaleBot, Brief, ClientPulse* (5), ContentCalendar, ContentRequest, Draft, LongformScript, Mission, SavedTitle, Session, TweetMetric, User, VerificationToken, Youtube* (3).

Tabel yang terdampak migrasi: `AgentRequest` (761, tanpa perubahan nyata), `WorkerTrace` (1488, tanpa perubahan nyata). Tabel baru (`IlSearchDoc`, 21 tabel Studio) mulai dari 0 baris.

Koneksi: `max_connections` 100, terpakai 18 (4 ke `gsp_agent_hq`). Ruang cukup untuk dua instans Next.

### 2. Pendekatan migrasi (aditif, non-destruktif)

#### 2.1 Pemindaian destruktif (mekanis, komentar diabaikan)

| Migrasi | sha256 (12) | DROP | ALTER TYPE | SET NOT NULL | ALTER pada tabel non-Studio |
|---|---|---|---|---|---|
| 20260927154000_add_ilsearchdoc | c7613e6d06e0 | 0 | 0 | 0 | 1: `ADD COLUMN tsv` pada `IlSearchDoc` yang baru dibuat di skrip yang sama |
| 20260927170000_agentrequest_requestedby_backfill | 1418407b4960 | 0 | 0 | 0 | 1: `ADD COLUMN IF NOT EXISTS` (no-op di produksi) |
| 20261022120000_add_studio | c5b6b2fcf98b | 0 | 0 | 0 | 0 |
| 20261023150000_worker_trace_baseline | 24360790485a | 0 | 0 | 0 | 0 (`CREATE ... IF NOT EXISTS`, no-op) |
| 20261023200000_add_studio_structure | abff9bacda61 | 0 | 0 | 0 | 0 (kolom `NOT NULL DEFAULT` hanya pada tabel Studio yang kosong) |
| 20261030220000_add_studio_contract | 4992bcdf1474 | 0 | 0 | 0 | 0 |

Dua migrasi milik branch produksi byte-identik antara `0f32367` dan v2.1 (`git diff --quiet` lolos). Perubahan `prisma/schema.prisma` dari 0f32367 ke HEAD: +701 / -0 baris, berisi model dan enum Studio plus model `WorkerTrace`.

#### 2.2 Diff skema yang ditinjau

`deploy/03_prod_to_v21_datamodel_diff.sql` (sha256 `d114ff68db4bd92d93792bb4d7b10e131dcad2604089627d96a4781c74905bdf`, 825 baris) dihasilkan dengan `prisma migrate diff --from-url <prod> --to-schema-datamodel prisma/schema.prisma --script` (baca-saja). Isinya: 22 CREATE TABLE (21 Studio + `IlSearchDoc`), 14 CREATE TYPE, 80 CREATE INDEX, 38 ADD CONSTRAINT (FK). Tidak ada DROP, ALTER COLUMN, SET NOT NULL, RENAME, TRUNCATE, atau DELETE. Tidak ada pernyataan untuk `AgentRequest` maupun `WorkerTrace`, karena keduanya sudah sesuai datamodel.

**Pernyataan destruktif yang ditandai: tidak ada.**

Skrip diff ini **hanya untuk tinjauan, JANGAN dieksekusi.** Isinya tidak memuat SQL tangan dari migrasi: `CREATE EXTENSION pg_trgm`, kolom generated `tsv`, dan indeks GIN `ilsearchdoc_*` serta `StudioDocBlock_tsv_idx`. Jalur resmi adalah `migrate deploy` atas berkas migrasi (D-21).

#### 2.3 Keputusan per migrasi

| Migrasi | Tindakan | Alasan |
|---|---|---|
| 20260927154000_add_ilsearchdoc | `prisma migrate deploy` | Objek belum ada. `CREATE EXTENSION` butuh hak superuser atau pemilik DB (peran `postgres`: superuser) |
| 20260927170000_agentrequest_requestedby_backfill | `prisma migrate deploy` (no-op, tercatat dengan checksum) | Kolom identik (§1.4). Alternatif setara: `prisma migrate resolve --applied` |
| 20261022120000_add_studio | `prisma migrate deploy` | Objek baru |
| 20261023150000_worker_trace_baseline | `prisma migrate deploy` (no-op) | `IF NOT EXISTS` tidak membandingkan struktur, tetapi struktur sudah diverifikasi identik kolom demi kolom (§1.4). Alternatif setara: `resolve --applied` sesuai komentar berkas |
| 20261023200000_add_studio_structure | `prisma migrate deploy` | Objek baru dan kolom pada tabel kosong |
| 20261030220000_add_studio_contract | `prisma migrate deploy` | Objek baru |

Satu perintah `npx prisma migrate deploy` menerapkan keenamnya berurutan. Rantai yang sama (tanpa migrasi kontrak) sudah lulus di DB segar `gsp_agent_hq_v21_seedtest` (log scratchpad `10_migrate.log`: 7 migrasi "successfully applied"). Gladi pada klon produksi (§5 fase 2) menguji rantai 8 migrasi lengkap terhadap data produksi nyata.

Dilarang di DB mana pun: `prisma migrate dev`, `prisma db push`, `npm run db:push` (D-21; runbook §1).

#### 2.4 Kompatibilitas mundur dengan kode lama di 9041 (DB dipakai bersama)

| Perubahan | Dampak pada kode lama (`ilfix-f1`, build 09-27) | Penilaian |
|---|---|---|
| `IlSearchDoc` + `pg_trgm` dibuat (kosong) | `src/app/api/information-library/route.ts` sudah mengkueri `IlSearchDoc` dengan fallback penuh ke LIKE bila tabel tidak ada, kosong, galat, atau 0 kandidat (baris 7-14, 203-247). Sekarang kueri itu galat lalu fallback. Sesudah migrasi kueri sukses tanpa kandidat lalu fallback. Respons tetap sama. Tidak ada penulis/sinkron `IlSearchDoc` di kedua repo (grep), jadi tabel tetap kosong | Aman |
| `AgentRequest.requestedBy` | no-op | Aman |
| `WorkerTrace` | no-op | Aman |
| 21 tabel dan 14 enum `Studio*` baru | Klien Prisma lama tidak mengenalnya dan tidak menyentuhnya | Aman |
| Kolom tambahan pada tabel Studio | Hanya tabel Studio | Aman |
| hermes-bridge (`gsp-datacenter/hermes-bridge`, kode lama, akses DB langsung) | v2.1 tidak mengubah `hermes-bridge/` (`git diff --stat 0f32367 HEAD -- hermes-bridge` kosong). Bridge tidak memakai port 9011 | Aman, tetap berjalan |
| Dua instans Next aktif bersamaan | Tidak ada penjadwal dalam proses di `src/` (tidak ada `setInterval`/`cron.schedule` di lib server; brief dan mirror ada di bridge). Pool koneksi lazy, ruang 82 koneksi | Aman |

**Catatan:** penilaian "perubahan DB boleh tetap ada setelah rollback" bertumpu pada tabel di atas. Gladi fase 2 langkah 2.5 memverifikasinya secara nyata dengan menjalankan kode lama terhadap klon yang sudah dimigrasi.

### 3. Cara DEV `gsp_agent_hq_v21` disiapkan (acuan)

- D-02: `.env` produksi disalin lalu DB dipisah. Klon `pg_dump` 22-10 21:29 berisi 34 tabel / 8.176 baris identik. Dump ada di `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/gsp_agent_hq_20261022.dump`.
- D-21/D-24: `WorkerTrace` tanpa riwayat migrasi dibuat baseline `20261023150000` (idempoten). Migrasi baru dibuat dengan `migrate diff` lalu diterapkan `migrate deploy`.
- Seed (D-86, D-126, D-213, D-231, D-267, D-273, D-282, D-385): `prisma/seed-studio.ts` dengan flag bertahap. Uji DB segar (`tests/integration/studio/uji-run.mjs fresh-seed`, `:100-117`) menjalankan `migrate deploy`, lalu `--import-benchmark --import-datum-gsp`, lalu `--presets-and-skeletons --import-manual000-v2` dua kali (jalan kedua `unchanged`). Templat kontrak `--contract-templates` diseed di v21 (D-385).
- Peluncur DEV `dev9021.js` mengisi env `NEXTAUTH_URL`, `PORT`, dan lima rahasia DEV sendiri dari `dev_secrets.json`: `INTERNAL_API_SECRET`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `WEBUI_RBAC_TOKEN`, `CLIENT_PULSE_ADMIN_SECRET` (D-320, D-334). Produksi memakai `.env` produksi, bukan nilai DEV.

### 4. Seed dan data Studio di produksi

#### 4.1 Langkah seed dan sifatnya

| Langkah | Perintah (`npx tsx prisma/seed-studio.ts ...`) | Isi | Idempoten | Status untuk produksi |
|---|---|---|---|---|
| S-1 | (selalu, tanpa flag) | 52 `StudioSectionType` + templat `datum-kanonik` | Ya (`unchanged` pada jalan ulang) | **WAJIB** |
| S-2 | `--import-datum-gsp` | templat `datum-gsp` (prasyarat preset GSP) | Ya | **WAJIB** (`--presets-and-skeletons` gagal tanpanya, `seed-studio.ts:893`) |
| S-3 | `--import-benchmark` | templat `datum-manual-000` (benchmark, terbatas) | Ya | Opsional, tetapi termasuk jalur segar yang teruji |
| S-4 | `--presets-and-skeletons` | preset `datum-kanonik-preset` dan `datum-gsp-preset` + versi berkerangka 7 slot (kontrak v2 content-only) | Ya, satu transaksi + penjaga | **WAJIB** |
| S-5 | `--import-manual000-v2` | preset Manual 000 (terbatas) + `datum-manual-000` berkerangka | Ya | Opsional (benchmark/paritas) |
| S-6 | `--contract-templates` | section type `contractRecord` + templat `laporan-kerja-agen` (laporan kerja agen via MCP) | Ya, satu transaksi + penjaga | **WAJIB** bila Hermes/MCP memakai laporan kerja. Butuh preset GSP |
| - | `--import-samples` | dokumen sampel + render berkas | - | **JANGAN** di produksi |
| - | `--dry-run` | bersama S-4/S-5/S-6, 0 tulis | - | dipakai di gladi |

Seed templat hanya menulis tabel Studio dan tidak menulis berkas (hanya `--import-samples` yang merender).

#### 4.2 Penghalang: penjaga DB seed

`prisma/seed-studio.ts:72-73, 124, 190-192` hanya mengizinkan `gsp_agent_hq_v21`, `gsp_agent_hq_v21_uji`, dan `gsp_agent_hq_v21_seedtest`. Selain itu skrip melempar galat sebelum menulis apa pun. Keputusan pengguna diperlukan (Q-1):

- **Opsi B (direkomendasikan, tanpa ubah kode):** pulihkan dump produksi ke `gsp_agent_hq_v21_seedtest` (nama ini diizinkan), jalankan `migrate deploy` dan seed S-1..S-6 di sana, lalu salin data 21 tabel Studio dari klon ke produksi dengan `pg_dump --data-only` / `pg_restore --data-only --single-transaction --disable-triggers` (§5 langkah 2.6 dan 3.3). Penjaga tetap menolak produksi sesuai niat D-02, dan data yang masuk produksi sudah diverifikasi lebih dulu di klon. Tabel Studio produksi kosong, jadi tidak ada bentrok ID (cuid teks, tanpa sekuens). `pg_dump` tidak mengekspor kolom generated (`tsv`).
- **Opsi A:** baris kode baru, misalnya env opt-in `STUDIO_SEED_ALLOW_DB=gsp_agent_hq` yang wajib sama dengan `current_database()` plus flag `--confirm-db=gsp_agent_hq`, dengan log terstruktur. Perubahan ini menyentuh penjaga keamanan, sehingga perlu review dan uji, dan harus masuk ke commit final sebelum deploy.
- Opsi C: tanpa seed. HQ lain berfungsi, tetapi Studio tidak dapat membuat dokumen. Tidak disarankan.

### 5. Langkah eksekusi (fase dan perintah)

Semua perintah dijalankan di **Git Bash** dari terminal pengguna sendiri. Jangan jalankan dari sesi alat agen yang mematikan proses anak saat sesi berakhir. Nilai rahasia tidak pernah dicetak.

#### 5.0 Pembantu env (sekali per shell)

```bash
export PATH="/c/Program Files/PostgreSQL/17/bin:$PATH"
# URL produksi dimuat dari .env tanpa gema (tidak ada query string di URL ini; diverifikasi 2026-11-04)
PROD_DB_URL=$(grep -E '^DATABASE_URL=' /c/Users/TRIAL/gsp-datacenter/.env | head -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']\$//" | tr -d '\r'); export PROD_DB_URL
export CLONE_DB_URL="${PROD_DB_URL%/*}/gsp_agent_hq_v21_seedtest"
db_guard() { # <url> <nama_db_diharapkan>
  local got; got=$(psql "$1" -At -c "select current_database();") || { echo "BERHENTI: koneksi gagal"; return 1; }
  [ "$got" = "$2" ] && echo "OK: $got" || { echo "BERHENTI: DB $got, diharapkan $2"; return 1; }
}
db_guard "$PROD_DB_URL" gsp_agent_hq
export TS=$(date +%Y%m%d-%H%M)
export BK="/c/Users/TRIAL/gsp-backups/deploy-v21-$TS"; mkdir -p "$BK"   # di luar semua repo
export NEW=/c/Users/TRIAL/gsp-hq-prod-v21
export ECO=/c/Users/TRIAL/gsp-ecosystem
```

#### Fase 0: persiapan kode (tanpa dampak produksi, kapan saja)

| # | Langkah | Perintah / cek | Waktu |
|---|---|---|---|
| 0.1 | Commit siklus perbaikan final di repo v2.1 (oleh controller), catat `<FINAL_SHA>`. Pastikan `git status` bersih: berkas M/?? yang ada sekarang tidak ikut ke checkout baru bila tidak di-commit | `git -C /c/Users/TRIAL/gsp-swarm-hq-v2.1 status --short` kosong | - |
| 0.2 | Tag di repo v2.1, bukan di gsp-datacenter: rilis dan titik produksi lama (0f32367 adalah leluhur v2.1) | `git -C /c/Users/TRIAL/gsp-swarm-hq-v2.1 tag prod-v2.1-20261104 <FINAL_SHA>` ; `git -C /c/Users/TRIAL/gsp-swarm-hq-v2.1 tag prod-ilfix-f1-pre-v21 0f32367` | 1 mnt |
| 0.3 | Checkout terpisah dan independen. Jangan memakai folder v2.1 karena DEV 9021 (`next dev`) berjalan di sana dan `next build` akan menimpa `.next`-nya | `git clone --no-hardlinks /c/Users/TRIAL/gsp-swarm-hq-v2.1 "$NEW" && git -C "$NEW" checkout -b prod-v21 <FINAL_SHA>` | 1-2 mnt |
| 0.4 | Salin `.env` produksi (tanpa mencetak) + sertifikat; tambahkan env Studio (§6) | `cp /c/Users/TRIAL/gsp-datacenter/.env "$NEW/.env"` ; `mkdir -p "$NEW/certs" && cp /c/Users/TRIAL/gsp-datacenter/certs/hq-key.pem /c/Users/TRIAL/gsp-datacenter/certs/hq-cert.pem "$NEW/certs/"` ; `mkdir -p /c/Users/TRIAL/gsp-studio-workspace-prod && printf '\nSTUDIO_WORKSPACE_ROOT=C:/Users/TRIAL/gsp-studio-workspace-prod\n' >> "$NEW/.env"` ; cek `git -C "$NEW" status --short` tidak menampilkan `.env`/`certs` (keduanya di-gitignore) | 1 mnt |
| 0.5 | Dependensi (butuh akses registry npm; `postinstall` menjalankan `prisma generate`) | `cd "$NEW" && npm ci` | 3-6 mnt |
| 0.6 | Build produksi. Artefak tidak bergantung DB: `DATABASE_URL` dibaca saat runtime, hanya `NEXT_PUBLIC_*` yang ditanam, dan nilainya sama dengan produksi (https://localhost:9011) | `cd "$NEW" && npm run build` → harapan: exit 0, "Compiled successfully". Gagal berarti BERHENTI (produksi tidak tersentuh) | 3-10 mnt |
| 0.7 | Cek lingkungan render | `ls /c/Users/TRIAL/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe "/c/Program Files/LibreOffice/program/soffice.com"` (keduanya ada per 2026-11-04) | 1 mnt |

#### Fase 1: cadangan (WAJIB sebelum menulis ke produksi)

| # | Langkah | Perintah | Harapan |
|---|---|---|---|
| 1.1 | Dump penuh format custom | `db_guard "$PROD_DB_URL" gsp_agent_hq && pg_dump --format=custom --file="$BK/gsp_agent_hq_$TS.dump" "$PROD_DB_URL"` | exit 0 (DB 24 MB, beberapa detik) |
| 1.2 | Verifikasi dump terbaca | `pg_restore --list "$BK/gsp_agent_hq_$TS.dump" \| grep -c "TABLE DATA"` ; `sha256sum "$BK"/*.dump > "$BK/SHA256SUMS"` | `34` |
| 1.3 | Hitungan baris sebelum | simpan `counts.sql` dari runbook §3 butir 4 ke `$BK`, lalu `psql "$PROD_DB_URL" -At -F '\|' -f "$BK/counts.sql" > "$BK/counts_before.txt"` | 34 baris |
| 1.4 | Catat keadaan kode lama | `cat /c/Users/TRIAL/gsp-datacenter/.next/BUILD_ID > "$BK/old_build_id.txt"` ; `git -C /c/Users/TRIAL/gsp-datacenter rev-parse HEAD >> "$BK/old_build_id.txt"` (baca-saja) | 0f32367 |

Pemulihan uji dump terjadi otomatis di fase 2 (restore ke klon dan perbandingan hitungan).

#### Fase 2: gladi pada klon produksi (sangat dianjurkan; tanpa dampak produksi)

| # | Langkah | Perintah | Harapan |
|---|---|---|---|
| 2.1 | Buat klon (DB uji bernama `_seedtest`; bila sudah ada, hapus dulu dengan persetujuan Q-9) | `psql "${PROD_DB_URL%/*}/postgres" -c 'CREATE DATABASE "gsp_agent_hq_v21_seedtest"'` ; `db_guard "$CLONE_DB_URL" gsp_agent_hq_v21_seedtest && pg_restore --no-owner --dbname="$CLONE_DB_URL" "$BK/gsp_agent_hq_$TS.dump"` ; hitungan → `$BK/counts_clone.txt` ; `diff "$BK/counts_before.txt" "$BK/counts_clone.txt"` | diff kosong (kecuali tulisan bridge di sela waktu) |
| 2.2 | Migrasi klon dari checkout baru | `cd "$NEW" && db_guard "$CLONE_DB_URL" gsp_agent_hq_v21_seedtest && DATABASE_URL="$CLONE_DB_URL" npx prisma migrate deploy && DATABASE_URL="$CLONE_DB_URL" npx prisma migrate status` | 6 "Applying migration", lalu "Database schema is up to date!", baris Datasource menyebut `gsp_agent_hq_v21_seedtest` |
| 2.3 | Drift pasca-migrasi (tinjauan, JANGAN diterapkan) | `DATABASE_URL="$CLONE_DB_URL" npx prisma migrate diff --from-url "$CLONE_DB_URL" --to-schema-datamodel prisma/schema.prisma --script > "$BK/clone_post_migrate_drift.sql"` | Hanya pernyataan yang menyentuh SQL tangan: `IlSearchDoc` (tsv, 4 indeks; D-167 "5 pernyataan drift IlSearchDoc") dan `StudioDocBlock` (tsv, `StudioDocBlock_tsv_idx`). Selain itu BERHENTI |
| 2.4 | Seed klon (penjaga mengizinkan nama ini) | `cd "$NEW"` lalu berurutan, masing-masing dengan `DATABASE_URL="$CLONE_DB_URL" npx tsx prisma/seed-studio.ts`: `--import-benchmark --import-datum-gsp` → `--presets-and-skeletons --import-manual000-v2` → `--contract-templates`. Ulangi dua yang terakhir sekali lagi | Exit 0 semua. Jalan ulang: `unchanged`. Log JSON `"database":"gsp_agent_hq_v21_seedtest"`. Bila S-3/S-5 tidak diinginkan (Q-2), hapus flag itu dan uji di sini dulu karena jalur itu tidak teruji |
| 2.5 | Uji kode baru DAN kode lama terhadap klon | Baru, port 9031 loopback: `cd "$NEW" && DATABASE_URL="$CLONE_DB_URL" HQ_PORT=9031 HQ_HOSTS=127.0.0.1 nohup node hq-server.mjs >> "$ECO/hq-v21-gladi.log" 2>&1 &` lalu smoke §7 S-1..S-10 terhadap `https://127.0.0.1:9031`. Lama, port 9041 loopback: `cd /c/Users/TRIAL/gsp-datacenter && DATABASE_URL="$CLONE_DB_URL" HQ_PORT=9041 HQ_HOSTS=127.0.0.1 nohup node hq-server.mjs >> "$ECO/hq-9041-gladi.log" 2>&1 &` lalu `/login`, `/api/brahma/health`, `/api/information-library?q=test` (membuktikan §2.4). Hentikan keduanya setelahnya (taskkill PID listener 9031/9041) | Semua lulus. Env proses mengungguli `.env` (Next tidak menimpa env yang sudah ada) |
| 2.6 | (Opsi B) Ekspor data Studio dari klon | `db_guard "$CLONE_DB_URL" gsp_agent_hq_v21_seedtest && pg_dump --format=custom --data-only -t '"StudioTemplate"' -t '"StudioTemplateVersion"' -t '"StudioSectionType"' -t '"StudioDocument"' -t '"StudioRevision"' -t '"StudioBlock"' -t '"StudioArtifact"' -t '"StudioOutputFile"' -t '"StudioRenderJob"' -t '"StudioTemplateSlot"' -t '"StudioTemplateSlotParam"' -t '"StudioTemplateSlotRoleFormat"' -t '"StudioAsset"' -t '"StudioDocSection"' -t '"StudioDocChapter"' -t '"StudioDocSubsection"' -t '"StudioDocBlock"' -t '"StudioDocIdentity"' -t '"StudioContractRecord"' -t '"StudioContractItem"' -t '"StudioDocRef"' --file="$BK/studio_seed_from_clone_$TS.dump" "$CLONE_DB_URL"` ; `pg_restore --list ... \| grep -c "TABLE DATA"` ; catat hitungan 21 tabel di klon ke `$BK/studio_counts_clone.txt` | `21`. Peringatan FK melingkar `StudioTemplateVersion` diharapkan (runbook §4) |

#### Fase 3: perubahan DB produksi (tanpa downtime; kode lama tetap melayani 9011)

| # | Langkah | Perintah | Harapan |
|---|---|---|---|
| 3.1 | Status awal dari checkout baru (`.env` = produksi) | `cd "$NEW" && db_guard "$PROD_DB_URL" gsp_agent_hq && npx prisma migrate status` | Datasource `gsp_agent_hq`, 6 tertunda (sama dengan §1.3) |
| 3.2 | Terapkan migrasi | `npx prisma migrate deploy && npx prisma migrate status` | 6 diterapkan, "up to date", `_prisma_migrations` = 8 baris. Bila satu migrasi gagal: BERHENTI, jangan `resolve` membabi buta, laporkan (Prisma menandainya gagal; pemulihan dari dump §8) |
| 3.3 | Cek kesehatan 9011 lama segera | `curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:9011/login` ; IL search dengan sesi/rahasia | 200, perilaku tak berubah |
| 3.4 | Seed (Opsi B): salin data Studio | `psql "$PROD_DB_URL" -At -c 'select count(*) from "StudioTemplate"'` → harus 0 ; `db_guard "$PROD_DB_URL" gsp_agent_hq && pg_restore --data-only --single-transaction --disable-triggers --dbname="$PROD_DB_URL" "$BK/studio_seed_from_clone_$TS.dump"` | exit 0, satu transaksi (gagal berarti tidak ada yang tertulis) |
| 3.4' | (Opsi A, bila dipilih) | urutan perintah 2.4 di produksi dengan opt-in baru | exit 0, jalan ulang `unchanged` |
| 3.5 | Verifikasi | hitungan 21 tabel Studio produksi = `$BK/studio_counts_clone.txt` ; hitungan non-Studio dibanding `counts_before.txt` | Studio sama persis. Non-Studio hanya bertambah karena bridge, tidak ada yang berkurang |

#### Fase 4: geser port (downtime ~20-40 detik)

Jendela waktu: hindari menit :55-:05 pada jam 00, 03, 06, 09, 12, 15, 18, 21. Pada jam itu cron watchdog Hermes `19ae9f96d588` (`0 */3 * * *`) menyalakan kode LAMA di 9011 bila port kosong. Hindari juga Senin dini hari dekat 05:00 (restart mingguan).

| # | Langkah | Perintah | Harapan |
|---|---|---|---|
| 4.1 | Jalankan standby lama di 9041, **loopback saja**. Aturan firewall program "Node.js JavaScript Runtime" (Allow, port apa pun, Private/Public) akan membuka 9041 ke LAN bila bind ke `0.0.0.0` | `cd /c/Users/TRIAL/gsp-datacenter && HQ_PORT=9041 HQ_HOSTS=127.0.0.1 nohup node hq-server.mjs >> "$ECO/hq-9041.log" 2>&1 &` ; `curl -sk -o /dev/null -w '%{http_code}\n' https://127.0.0.1:9041/login` | 200. Dua instans lama berjalan sebentar dari `.next` yang sama (hanya baca; cache benign) |
| 4.2 | Identifikasi listener 9011 lama | `netstat -ano -p tcp \| grep -E ':9011\s.*LISTENING'` ; `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=<PID>' \| Select ProcessId,CommandLine,CreationDate"` | `node hq-server.mjs` (PID 20468 per 2026-11-04; cek ulang saat eksekusi) |
| 4.3 | Hentikan 9011 lama (mulai downtime) | `taskkill //PID <PID> //T //F` ; tunggu sampai `netstat` tidak lagi menampilkan LISTENING 9011 | port bebas |
| 4.4 | Jalankan v2.1 di 9011 (bind 0.0.0.0 sama seperti sekarang) | `cd "$NEW" && nohup node hq-server.mjs >> "$ECO/hq-v21.log" 2>&1 &` ; ulangi `curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:9011/login` tiap 2 detik | 200 (akhir downtime). Log: `HQ production: https://0.0.0.0:9011` |
| 4.5 | Smoke §7 | - | semua lulus. Gagal kritis berarti rollback §8 R-A |

### 6. Env dan aset yang diperlukan

#### 6.1 `.env` checkout baru = salinan `gsp-datacenter/.env` (16 nama) + tambahan

Nama yang sudah ada (nilai sama, tidak berubah): `ALLOWED_EMAILS`, `BRIEF_HOUR`, `CRON_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HERMES_BIN`, `HERMES_BOARD`, `HERMES_WIKI`, `INTERNAL_API_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `POSTGRES_URL`, `SHARED_WORKSPACE`, `WEBUI_RBAC_TOKEN`.

`NEXTAUTH_URL` dan `NEXT_PUBLIC_BASE_URL` berbentuk https://localhost:9011, jadi tetap benar karena port 9011 tidak berubah. Rahasia sesi yang sama membuat sesi HQ pengguna (cookie HMAC `NEXTAUTH_SECRET`) tetap sah setelah pergantian.

| Nama baru / opsional | Wajib? | Fungsi | Nilai yang diusulkan / bawaan |
|---|---|---|---|
| `STUDIO_WORKSPACE_ROOT` | Disarankan | Akar keluaran render, aset, dan log JSONL Studio. Tidak boleh sama dengan atau berada di dalam `SHARED_WORKSPACE` (`contract/env.ts:242-255`, `STORAGE_ROOT_FORBIDDEN`) | `C:/Users/TRIAL/gsp-studio-workspace-prod` (sudah dicek: tidak di dalam `SHARED_WORKSPACE`). Bawaan `data/studio-workspace` relatif cwd |
| `STUDIO_CHROMIUM_PATH` | Opsional | Chromium headless untuk PDF/raster (D-11) | bawaan `C:\Users\TRIAL\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe` (ada; playwright-core 1.62.1) |
| `SOFFICE_PATH` | Opsional | LibreOffice | bawaan `C:\Program Files\LibreOffice\program\soffice.com` (ada) |
| `STUDIO_RENDER_ENV_MANIFEST` | Opsional | Manifest kesiapan render | bawaan `render-env/manifest.json` (terlacak git) |
| `STUDIO_SOFFICE_TIMEOUT_MS`, `STUDIO_SOFFICE_MAX_INSTANCES` | Opsional | Batas soffice | 180000, 2 (dibatasi 2) |
| `STUDIO_FONT_CACHE_DIR` | Opsional | Cache wajah fon hasil relabel | bawaan direktori tmp |
| `STUDIO_LAYOUT_LOG_MAX_BYTES` | Opsional | Batas log tata letak | bawaan kode |

Env proses (bukan `.env`): `HQ_PORT` (9041 untuk standby lama; kosong = 9011 untuk v2.1), `HQ_HOSTS` (`127.0.0.1` untuk standby; kosong = `0.0.0.0` untuk v2.1).

Env sisi MCP (hanya bila Hermes MCP didaftarkan, keputusan terpisah Q-6): `STUDIO_BASE_URL`, `INTERNAL_API_SECRET`, `STUDIO_AGENT_ID`, `STUDIO_MCP_LOCK_AGENT_ID`, `STUDIO_MCP_TOOLSETS`, `STUDIO_MCP_FILE_ROOTS`, dan `NODE_EXTRA_CA_CERTS` (lihat R-09).

#### 6.2 Aset berkas

- `src/lib/studio/assets/**`: 40 berkas terlacak git (3,6 MB, 29 fon), ikut checkout. Catatan deploy `docs/STUDIO-MCP.md` §5.z (file tracing `outputFileTracingIncludes`) **hanya berlaku untuk `output: "standalone"`/serverless**. Deploy ini memakai `next()` dari `hq-server.mjs` dengan cwd = akar checkout dan `next.config.ts` tanpa `output: "standalone"`, sehingga aset dibaca langsung relatif cwd. Syaratnya proses selalu dijalankan dengan cwd `$NEW`.
- `certs/hq-key.pem`, `certs/hq-cert.pem`: disalin dari gsp-datacenter (gitignored).
- `render-env/manifest.json`: terlacak.
- Fon sistem Plex HKCU (D-35) sudah terpasang di mesin ini untuk pengguna TRIAL. Proses berjalan sebagai pengguna yang sama.
- Tidak ada folder `data/` produksi yang perlu disalin (`gsp-datacenter/data` hanya berisi `.gitkeep`).

### 7. Smoke test dan kriteria sukses

Rahasia dimuat tanpa gema: `IAS=$(grep -E '^INTERNAL_API_SECRET=' "$NEW/.env" | cut -d= -f2- | tr -d '"\r')`. Untuk pengecekan, `H="x-internal-secret: $IAS"`, lalu `curl -sk -H "$H" ...`. `BASE` = `https://localhost:9011` (atau `https://127.0.0.1:9031` saat gladi).

| ID | Uji | Harapan |
|---|---|---|
| S-1 | `curl -sk -o /dev/null -w '%{http_code}' $BASE/login` dan `$BASE/` (dipakai watchdog) | 200 / 200-307 |
| S-2 | `curl -sk -H "$H" $BASE/api/brahma/health` | 200 JSON status bridge/agen |
| S-3 | `curl -sk -H "$H" $BASE/api/agents` | 200 daftar roster |
| S-4 | `curl -sk -H "$H" $BASE/api/studio/registry` | 200, registri 52 section type |
| S-5 | `curl -sk -H "$H" $BASE/api/studio/templates` | 200 memuat `datum-kanonik`, `datum-gsp`, `datum-kanonik-preset`, `datum-gsp-preset`, `laporan-kerja-agen` (+ `datum-manual-000*` bila S-3/S-5) |
| S-6 | `curl -sk -H "$H" $BASE/api/studio/render-env` | 200; chromium, fon, dan manifest siap |
| S-7 | R08 dry-run tanpa tulis: `curl -sk -H "$H" -H 'content-type: application/json' -d '{"schemaId":"studio.chart/v1","spec":{}}' $BASE/api/studio/validate` | 200 `valid:false` + `issues` (membuktikan route, ajv, auth; R08 tanpa tulis DB/berkas per `validate/route.ts:2`) |
| S-8 | `curl -sk -H "$H" $BASE/api/studio/tidak-ada` | 404 JSON `ROUTE_NOT_FOUND` (D-323) |
| S-9 | `curl -sk -H "$H" "$BASE/api/information-library?q=test"` | 200, bentuk respons sama dengan sebelum deploy (fallback LIKE) |
| S-10 | Peramban: login, lalu `/`, `/brahma`, `/information-library`, `/orchestration`, `/dispatch-kpi`, `/studio` | Semua tampil. Tanpa sesi, redirect ke `/login?next=...` (perubahan middleware IP-49) |
| S-11 | Brahma WebUI 9012: login dan cek RBAC (memanggil `HERMES_WEBUI_RBAC_API_URL` di 9011, `/api/brahma/rbac`, `x-rbac-token`) | berfungsi |
| S-12 | Standby: `curl -sk -o /dev/null -w '%{http_code}' https://127.0.0.1:9041/login`; dari mesin lain 9041 TIDAK terjangkau | 200 lokal |
| S-13 | DB: `npx prisma migrate status` dari `$NEW` → up to date; `_prisma_migrations` 8 baris; hitungan non-Studio tidak berkurang | lulus |
| S-14 | Log: `tail -f "$ECO/hq-v21.log"` selama 10 menit; bridge (`$ECO/bridge.log`) tetap memproses request | tanpa `request error` berulang |

**Kriteria sukses:** S-1..S-14 lulus. Tidak ada kenaikan galat di log 30 menit pertama. Satu siklus dispatch agen nyata lewat bridge selesai normal. Uji tulis Studio end-to-end (membuat dokumen dan render) menulis ke produksi, jadi hanya dilakukan dengan persetujuan terpisah (Q-6), misalnya lewat templat `laporan-kerja-agen`.

### 8. Rencana rollback

| Tingkat | Kapan | Langkah | Waktu |
|---|---|---|---|
| **R-A Kode (utama)** | v2.1 bermasalah | 1) `taskkill //PID <PID listener 9011> //T //F` ; 2) `taskkill //PID <PID listener 9041> //T //F` ; 3) `cd /c/Users/TRIAL/gsp-datacenter && nohup node hq-server.mjs >> "$ECO/hq.log" 2>&1 &` (bawaan 9011, 0.0.0.0, persis seperti autostart) ; 4) S-1, S-2, S-9, S-11 | ~2 mnt, downtime ~20-40 dtk. Tanpa build, `.next` lama dipakai apa adanya |
| R-A' | v2.1 mati sendiri | Watchdog Hermes (maks 3 jam) menyalakan kode LAMA di 9011 dari gsp-datacenter secara otomatis. Ini rollback implisit; ketahui dan pantau | - |
| **R-B DB: biarkan** | setelah R-A | Objek aditif boleh tetap ada: kode lama tidak mengenal tabel Studio, `IlSearchDoc` kosong memicu fallback, dua migrasi no-op (§2.4, dibuktikan di gladi 2.5). Data Studio produksi tetap utuh untuk deploy ulang | 0 |
| R-C DB: buang Studio | hanya bila pemilik memutuskan | `docs/STUDIO-ROLLBACK-RUNBOOK.md`: hanya pemilik sistem dengan persetujuan tertulis, setelah cadangan penuh dan gladi ulang pada salinan produksi (agen AI DILARANG). Urutan wajib: `prisma/rollback/03_rollback_studio_contract_delta.sql` (sha `994ccb66…`) lalu `01_rollback_studio_structure_delta.sql` (`10549a93…`) lalu `02_rollback_studio_base.sql` (`a28a7a15…`). Runbook baru mendokumentasikan tingkat 1 dan 2; tingkat 03 harus dijalankan lebih dulu karena tabel kontrak merujuk tabel struktur (celah dokumentasi, R-12). `IlSearchDoc`, `pg_trgm`, dan baseline `WorkerTrace` tidak disentuh | 20-40 mnt termasuk cadangan dan gladi |
| R-D Pulihkan dump (upaya terakhir) | korupsi data | `pg_restore --clean --if-exists --dbname="$PROD_DB_URL" "$BK/gsp_agent_hq_$TS.dump"` dengan server HQ DAN bridge dihentikan. **Kehilangan data:** semua tulisan sesudah cadangan (`AgentRequest`, `HermesTask`, `AgentEvent` dari bridge) hilang. Ekspor baris-baris itu lebih dulu bila memungkinkan | ~5 mnt + keputusan |

### 9. Risiko dan pertanyaan terbuka

#### 9.1 Risiko

| ID | Risiko | Peluang / dampak | Mitigasi |
|---|---|---|---|
| R-01 | Autostart logon (`gsp-ecosystem-start.sh:114-125`, lewat Startup `gsp-ecosystem-autostart.vbs`) setelah restart mingguan **Senin 2026-11-09 05:00** (tugas `\Auto Restart 0500`) menyalakan kode LAMA di 9011. v2.1 dan 9041 tidak dinyalakan | Tinggi / produksi kembali ke kode lama tanpa sinyal | Q-4: perbarui baris `cd` ke `$NEW` sebelum Senin, atau terima dan nyalakan ulang manual |
| R-02 | Watchdog Hermes `watchdog-webui-hq.py` (cron `0 */3 * * *`) memakai `cwd=C:\Users\TRIAL\gsp-datacenter` saat 9011 mati | Sedang / bentrok saat pergantian (EADDRINUSE) atau rollback implisit | Jendela waktu fase 4; Q-4: ubah cwd ke `$NEW` setelah diterima (konfigurasi persisten, butuh persetujuan) |
| R-03 | `gsp-datacenter/scripts/hq_restart.mjs` (kill listener 9011 + spawn dari gsp-datacenter) dipakai agen atau manusia | Sedang / rollback tak sengaja | Umumkan: restart v2.1 memakai `node $NEW/scripts/hq_restart.mjs` (ROOT = folder skrip, jadi menunjuk `$NEW`) |
| R-04 | Build produksi v2.1 terakhir tercatat 2026-10-23 (S69, D-70); kode sesudahnya belum pernah di-build mode produksi | Sedang / gagal build | Build di fase 0 dan gladi di 9031 sebelum pergantian. Gagal berarti produksi tidak tersentuh |
| R-05 | Perubahan non-Studio ikut aktif: middleware (perbandingan waktu-konstan, `?next=` login), sidebar/palette, `requests/[id]` + roster (perubahan sesudah build 09-27) | Rendah | S-10, S-11 |
| R-06 | Downtime ~20-40 detik: WebUI 9012 (RBAC), agen yang memanggil `https://localhost:9011/api/brahma/*` (mis. `il_rebuild_monitor.py`), dan pengguna Tailscale `100.102.23.27:9011` sempat gagal | Pasti / singkat | Jendela sepi; agen mencoba ulang |
| R-07 | Standby 9041 terbuka ke LAN bila bind `0.0.0.0` (aturan firewall program node.exe) | Sedang | `HQ_HOSTS=127.0.0.1` (fase 4.1). 9041 tidak perlu dijangkau siapa pun selain mesin ini. NextAuth/OAuth di 9041 mengarah ke 9011 (`NEXTAUTH_URL`), jadi 9041 hanya untuk cek API/curl, bukan login interaktif |
| R-08 | Beban CPU/RAM: instans ketiga (9041) + render Chromium/soffice | Rendah | Pantau; hentikan 9041 setelah masa observasi (Q-5) |
| R-09 | MCP Studio ke produksi: 9011 hanya HTTPS self-signed. `STUDIO_BASE_URL` http hanya boleh loopback (`scripts/studio/mcp/config.ts:96`), jadi butuh `https://localhost:9011` + `NODE_EXTRA_CA_CERTS=<path>/certs/hq-cert.pem` di proses MCP | Pasti bila MCP didaftarkan | Bagian keputusan Q-6 |
| R-10 | Salinan `.env` produksi ke folder baru: rahasia bertambah satu lokasi | Rendah | `.env` dan `certs/` di-gitignore (cek fase 0.4); jangan di-commit/push |
| R-11 | Sumber kode produksi kini klon lokal `prod-v21` tanpa remote yang di-push | Rendah | Q-7: push branch/tag ke origin (keputusan terpisah) |
| R-12 | Runbook rollback belum memuat tingkat kontrak (`03_...sql`) dan larangan produksi membuat rollback DB hanya oleh pemilik | Rendah (R-B cukup) | Revisi runbook sebelum R-C dibutuhkan |
| R-13 | Satu migrasi gagal di tengah `migrate deploy` | Rendah (lulus di klon fase 2) | Berhenti, pulihkan dari dump (R-D) atau perbaiki lalu `resolve`, keduanya dengan keputusan |

#### 9.2 Pertanyaan untuk pengguna

| ID | Keputusan | Rekomendasi |
|---|---|---|
| Q-1 | Cara seed produksi: Opsi B (seed di klon `_seedtest`, salin data 21 tabel Studio) / Opsi A (ubah kode penjaga + review) / C (tanpa seed) | B |
| Q-2 | Sertakan templat benchmark Manual 000 (S-3 + S-5, terbatas)? | Ya, karena itu jalur segar yang teruji. Bila tidak, uji kombinasi tanpa Manual 000 di klon dulu |
| Q-3 | Jendela waktu pergantian (hindari :55-:05 jam kelipatan 3 dan Senin dini hari) | jam kerja sepi, mis. hh:20-hh:40 |
| Q-4 | Perbarui peluncur persisten ke `$NEW` (`gsp-ecosystem-start.sh` baris `cd`, `watchdog-webui-hq.py` `cwd`, opsional standby 9041 di autostart), dan kapan | Setelah 24 jam observasi, **sebelum Senin 2026-11-09 05:00** |
| Q-5 | Lama hidup standby 9041 (loopback) | Sampai Q-4 selesai dan observasi lulus, lalu hentikan |
| Q-6 | Pendaftaran MCP Hermes ke produksi dan pemasangan skill Studio untuk Hermes, serta uji tulis Studio end-to-end di produksi | Keputusan terpisah setelah deploy stabil (R-09) |
| Q-7 | Push `prod-v21` / tag ke origin GitHub, dan nasib branch `ilfix-f1` + 55 berkas untracked di gsp-datacenter (tidak disentuh metode ini, tidak dihapus) | Push ditunda ke keputusan terpisah; gsp-datacenter dibiarkan apa adanya sebagai sumber rollback |
| Q-8 | Dua migrasi milik branch produksi ikut diterapkan: `IlSearchDoc` + `pg_trgm` dibuat kosong (FTS IL tetap mati karena tidak ada sinkron), `requestedBy` no-op. Setuju? | Ya. Aditif dan diperlukan agar rantai migrasi lengkap |
| Q-9 | Izin membuat DB uji `gsp_agent_hq_v21_seedtest` (dan menghapusnya bila sudah ada atau sesudah gladi) | Ya. DB uji sementara, bukan produksi |
| Q-10 | Lokasi `STUDIO_WORKSPACE_ROOT` produksi | `C:/Users/TRIAL/gsp-studio-workspace-prod` |

### 10. Perkiraan waktu total

| Fase | Waktu | Dampak produksi |
|---|---|---|
| 0 Persiapan kode | 10-20 mnt | tidak ada |
| 1 Cadangan | 2-5 mnt | tidak ada (baca) |
| 2 Gladi klon | 20-40 mnt | tidak ada |
| 3 Migrasi + seed produksi | 5-10 mnt | tidak ada downtime; DB berubah aditif |
| 4 Geser port + smoke | 10-20 mnt | downtime ~20-40 dtk |
| Observasi | 24 jam | - |
| Rollback R-A | ~2 mnt | downtime ~20-40 dtk |

### 11. Bukti dan berkas

- `deploy/02_prod_migrate_status_20261104.txt`: keluaran `prisma migrate status` produksi (URL disensor), exit 1, 6 tertunda.
- `deploy/03_prod_to_v21_datamodel_diff.sql`: diff baca-saja prod ke datamodel v2.1, 0 pernyataan destruktif. Hanya untuk tinjauan, jangan dieksekusi.
- Sumber: `hq-server.mjs` (port/host/TLS), `C:/Users/TRIAL/gsp-ecosystem/gsp-ecosystem-start.sh:114-125`, `C:/Users/TRIAL/AppData/Local/hermes/scripts/watchdog-webui-hq.py` (cron `19ae9f96d588`), `gsp-datacenter/scripts/hq_restart.mjs`, `prisma/seed-studio.ts:72-73,124,190-192,1417-1433`, `tests/integration/studio/uji-run.mjs:100-117`, `src/lib/studio/contract/env.ts:20-35,236-268`, `src/app/api/information-library/route.ts:7-14,203-247`, `src/middleware.ts:98-131`, `docs/STUDIO-ROLLBACK-RUNBOOK.md`, `docs/STUDIO-MCP.md` §2, §5.z.
- Pemeriksaan baca-saja yang dijalankan 2026-11-04: `psql` dengan `default_transaction_read_only=on` (identitas DB, `_prisma_migrations`, `pg_extension`, `information_schema`, `pg_indexes`, `pg_type`, hitungan baris, `max_connections`), `prisma migrate status`, `prisma migrate diff --script`, `netstat`, `Get-CimInstance Win32_Process`, `schtasks /query`, `Get-NetFirewallRule`, `git status/log/diff` (baca) di kedua repo. Tidak ada tulisan ke `gsp_agent_hq`, tidak ada perubahan di `gsp-datacenter`, tidak ada proses yang dihentikan.
