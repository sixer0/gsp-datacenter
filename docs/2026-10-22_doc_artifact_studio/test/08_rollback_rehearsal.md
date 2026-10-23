# SR-53 Gladi rollback (S82) di `gsp_agent_hq_v21_uji`

Baris: SR-53 (blueprint 05:794; masukan SR-01 `03_structural_sections_specs.md` §3.5, `01_specs.md` §1.4, D-21). Agen: test-expert, skill `tdd`. Tanggal: 2026-10-23.
Status: **complete**. Kedua rollback lolos dengan urutan benar; hitungan baris tabel lama identik tabel per tabel; `_uji` dipulihkan ke keadaan terkini (7/7 migrasi, data Studio SR-49 identik byte per baris).

## 1. Strategi uji

- **Lingkup:** DB `gsp_agent_hq_v21_uji` saja (penulis tunggal setelah SR-49; klaim di `delegation_progress/file_claims.md`). Tidak ada perubahan kode, `.env`, maupun DB lain. DATABASE_URL hanya di lingkungan proses anak lewat `tests/integration/studio/uji-run.mjs` (URL disaring, tidak dicetak). Setiap skrip pembantu menolak berjalan bila `current_database() <> 'gsp_agent_hq_v21_uji'`.
- **Skrip rollback resmi:** tidak ada berkas rollback di `prisma/migrations/**` (sengaja, `01_specs.md:102`). Teks SQL diambil **apa adanya** secara mekanis (awk/sed, bukan diketik ulang) dari:
  - delta: blueprint `05_structural_sections_blueprint.md:187-210` (= `03_specs §3.5`), 23 baris, sha256 `10549a93000c6d94…`;
  - Studio asli: `01_specs.md` §1.4, 24 baris, sha256 `a28a7a15c12caaa1…`.
  Keduanya ber-`BEGIN; … COMMIT;` dan dijalankan sesuai §1.4: `npx prisma db execute --file <salinan sementara> --schema prisma/schema.prisma` (DATABASE_URL = `_uji`).
- **Penguat uji (bukan bagian prosedur):** tabel lama `_uji` semuanya 0 baris sesudah SR-49, sehingga "hitungan identik" akan trivial (0 = 0). Maka sebelum gladi disisipkan 27 baris penanda `id LIKE 'sr53-s%'` di 6 tabel lama D-21 (AgentRequest 3, HermesTask 4, IlSearchDoc 5, WorkerTrace 6, HermesMemory 2, OrchestrationRecord 7) dan dihapus lagi di akhir. Selain hitungan, setiap tabel dibandingkan dengan `md5(string_agg(row::text ORDER BY row::text))`.
- **Cadangan data:** sebelum gladi, 18 tabel Studio dicadangkan ke JSON (urutan FK topologis dari `pg_constraint`) agar data SR-49 dapat dikembalikan sesudah `migrate deploy`.
- **Pengecualian:** `WebUiUser` tidak diberi baris penanda (tabel kredensial; tetap dibandingkan pada 0 baris). DB `gsp_agent_hq_v21`, `_shadow`, produksi tidak disentuh.

## 2. Urutan tahap dan bukti

| Tahap | Perintah | Hasil (dikutip) |
|---|---|---|
| T0 status awal | `uji-run.mjs -- npx prisma migrate status` | `Datasource "db": PostgreSQL database "gsp_agent_hq_v21_uji"` ... `7 migrations found in prisma/migrations` / `Database schema is up to date!` |
| T1 snapshot sebelum | `sr53.mjs snap s1_before` | 53 tabel; Studio 18 tabel, 14 tipe; delta: 9 tabel, 3 tipe, 14 kolom, 2 indeks; 7 baris `_prisma_migrations` |
| T2 rollback delta | `prisma db execute --file rollback_delta.sql` | `Script executed successfully.` exit 0 |
| T3 cek delta hilang LEBIH DULU | `sr53.mjs snap s2_after_delta` | 44 tabel; delta: **0 tabel, 0 tipe, 0 kolom, 0 indeks**; Studio asli **masih 9 tabel, 11 tipe** (StudioArtifact, StudioBlock, StudioDocument, StudioOutputFile, StudioRenderJob, StudioRevision, StudioSectionType, StudioTemplate, StudioTemplateVersion) |
| T3 status | `migrate status` (exit 1, sesuai harapan) | `7 migrations found` / `Following migration have not yet been applied:` / `20261023200000_add_studio_structure` |
| T3 isi kolom asli | `projcheck.mjs` (baris kini vs cadangan, hanya kolom yang tersisa) | 6/6 tabel `isi kolom asli identik`; kolom hilang: StudioTemplate 12→11, TemplateVersion 15→14, Document 19→17, Revision 22→17, RenderJob 16→14, OutputFile 18→15 (total 14 = MX01-MX06) |
| T4 rollback Studio asli | `prisma db execute --file rollback_studio.sql` | `Script executed successfully.` exit 0 (tanpa CASCADE, tidak ada ketergantungan tak terduga) |
| T5 cek Studio hilang | `sr53.mjs snap s3_after_studio` | 35 tabel; `pg_tables LIKE 'Studio%'` = **0**; `pg_type LIKE 'Studio%'` = **0**; tipe `Role` tetap ada |
| T5 status | `migrate status` (exit 1, sesuai harapan) | `Following migrations have not yet been applied:` / `20261022120000_add_studio` / `20261023200000_add_studio_structure` (`20261023150000_worker_trace_baseline` tetap terapan) |
| T6 pulihkan struktur | `uji-run.mjs -- npx prisma migrate deploy` | `Applying migration 20261022120000_add_studio` / `Applying migration 20261023200000_add_studio_structure` / `All migrations have been successfully applied.` exit 0 |
| T6 status | `migrate status` | `7 migrations found in prisma/migrations` / `Database schema is up to date!` exit 0 |
| T7 pulihkan data | `sr53.mjs restore` lalu `sentinel.mjs delete` | 18 tabel Studio diisi ulang dari cadangan (total 3.454 baris); 27 baris penanda dihapus |
| T8 snapshot akhir | `sr53.mjs cmp s0_before s5_final all` | `tabel dibandingkan=53 hitungan beda=0`; 52/53 tabel md5 identik; `_prisma_migrations` 7 = 7 (md5 beda hanya karena `started_at/finished_at` 2 baris yang diterapkan ulang; checksum tetap `c5b6b2fcf98b…` add_studio, `abff9bacda61…` structure = sha256 `migration.sql`) |

## 3. Hitungan baris per tabel

Kolom: s1 = sebelum (dengan penanda), s2 = sesudah rollback delta, s3 = sesudah rollback Studio, s4 = sesudah `migrate deploy` (sebelum isi ulang), s0/s5 = keadaan SR-49 awal / akhir. md5: s1 vs s2 / s1 vs s3 / s0 vs s5 ("-" = tabel tidak ada pada tahap itu).

| Tabel | Kelas | s0 | s1 | s2 | s3 | s4 | s5 | md5 |
|---|---|---|---|---|---|---|---|---|
| AgentRequest | lama | 0 | 3 | 3 | 3 | 3 | 0 | = / = / = |
| HermesTask | lama | 0 | 4 | 4 | 4 | 4 | 0 | = / = / = |
| IlSearchDoc | lama | 0 | 5 | 5 | 5 | 5 | 0 | = / = / = |
| WorkerTrace | lama | 0 | 6 | 6 | 6 | 6 | 0 | = / = / = |
| HermesMemory | lama | 0 | 2 | 2 | 2 | 2 | 0 | = / = / = |
| OrchestrationRecord | lama | 0 | 7 | 7 | 7 | 7 | 0 | = / = / = |
| 28 tabel lama lain (Account, AgentBusMessage, AgentEvent, AgentState, Article, BattleRoyaleBot, Brief, ClientPulseAlert, ClientPulseAnalysis, ClientPulseChat, ClientPulseClient, ClientPulseMessage, ContentCalendar, ContentRequest, DataStore, Draft, Idea, LongformScript, Mission, SavedTitle, Session, TweetMetric, User, VerificationToken, WebUiUser, YoutubeFeedback, YoutubeIdea, YoutubeScript) | lama | 0 | 0 | 0 | 0 | 0 | 0 | = / = / = (masing-masing) |
| _prisma_migrations | buku | 7 | 7 | 6 | 5 | 7 | 7 | turun hanya baris migrasi yang di-rollback |
| StudioSectionType | Studio asli | 51 | 51 | 51 | - | 0 | 51 | = / - / = |
| StudioBlock | Studio asli | 1155 | 1155 | 1155 | - | 0 | 1155 | = / - / = |
| StudioArtifact | Studio asli | 0 | 0 | 0 | - | 0 | 0 | = / - / = |
| StudioTemplate | Studio asli | 6 | 6 | 6 | - | 0 | 6 | kolom asli = / - / = |
| StudioTemplateVersion | Studio asli | 14 | 14 | 14 | - | 0 | 14 | kolom asli = / - / = |
| StudioDocument | Studio asli | 5 | 5 | 5 | - | 0 | 5 | kolom asli = / - / = |
| StudioRevision | Studio asli | 15 | 15 | 15 | - | 0 | 15 | kolom asli = / - / = |
| StudioRenderJob | Studio asli | 11 | 11 | 11 | - | 0 | 11 | kolom asli = / - / = |
| StudioOutputFile | Studio asli | 21 | 21 | 21 | - | 0 | 21 | kolom asli = / - / = |
| StudioTemplateSlot, …SlotParam, …SlotRoleFormat, StudioAsset, StudioDocSection, StudioDocChapter, StudioDocSubsection, StudioDocBlock, StudioDocIdentity | delta | 40, 49, 0, 26, 85, 87, 367, 1008, 514 | sama | - | - | 0 | sama dengan s0 | - / - / = |

Kesimpulan kriteria: (a) urutan hilang benar: tabel/tipe/kolom/indeks delta = 0 di T3 sementara 9 tabel + 11 tipe Studio asli masih ada, baru hilang di T5; (b) 35 tabel non-Studio identik hitungan + md5 pada T3 dan T5 (`hitungan beda=0` di luar `_prisma_migrations`), 9 tabel Studio asli identik hitungan pada T3 (3 tabel md5 identik, 6 tabel isi kolom asli identik); (c) `migrate status` dikutip di T0, T3, T5, T6 dan konsisten dengan isi `_prisma_migrations`; (d) `_uji` dipulihkan: 7/7 terapan, up to date, 53/53 tabel hitungan sama dengan keadaan SR-49.

## 4. Analisis cakupan dan celah

- Dicakup: rollback delta (9 tabel, 14 kolom, 2 indeks, 3 tipe, 1 baris buku), rollback Studio asli (9 tabel, 11 tipe, 1 baris buku), keutuhan tabel lama, konsistensi `migrate status`, re-apply lewat `migrate deploy` setelah rollback di tengah riwayat (`worker_trace_baseline` tetap terapan; Prisma menerapkan dua migrasi tertunda yang lebih tua tanpa keluhan).
- Tidak dicakup: rollback di `gsp_agent_hq_v21` (di luar lingkup; hanya digladikan di `_uji`), rollback saat server aplikasi aktif menulis (konkurensi), volume data produksi (tabel lama `_uji` hanya berisi baris penanda).
- Catatan operasional (bukan cacat produk): rollback §1.4 menghapus seluruh data Studio secara permanen; pemulihan pada gladi ini memakai cadangan JSON yang dibuat SR-53, bukan bagian prosedur §1.4. Untuk pemakaian nyata, cadangan data Studio sebelum rollback perlu dijadikan langkah eksplisit.
- Catatan alat: isi ulang pertama gagal dan di-ROLLBACK otomatis (`null value in column "value" of relation "StudioTemplateSlotParam"`): `json_populate_recordset` mengubah JSON `null` di kolom `jsonb NOT NULL` menjadi SQL NULL. Skrip diperbaiki (kolom jsonb NOT NULL dibaca `(e->'kol')::jsonb`); jalan kedua lulus dengan md5 identik. Tidak ada dampak pada produk.

## 5. Cara menjalankan ulang

```
node tests/integration/studio/uji-run.mjs -- npx prisma migrate status
node <tmp>/sr53.mjs backup ; node <tmp>/sentinel.mjs insert ; node <tmp>/sr53.mjs snap s1_before
node tests/integration/studio/uji-run.mjs -- npx prisma db execute --file <tmp>/rollback_delta.sql --schema prisma/schema.prisma
node <tmp>/sr53.mjs snap s2_after_delta ; node <tmp>/sr53.mjs cmp s1_before s2_after_delta old
node tests/integration/studio/uji-run.mjs -- npx prisma db execute --file <tmp>/rollback_studio.sql --schema prisma/schema.prisma
node <tmp>/sr53.mjs snap s3_after_studio ; node <tmp>/sr53.mjs cmp s1_before s3_after_studio nonstudio
node tests/integration/studio/uji-run.mjs -- npx prisma migrate deploy
node <tmp>/sr53.mjs restore ; node <tmp>/sentinel.mjs delete ; node <tmp>/sr53.mjs cmp s0_before s5_final all
```

Alternatif pemulihan tanpa cadangan: `node tests/integration/studio/uji-run.mjs reset` (DROP/CREATE `_uji`, data SR-49 dibangun ulang lewat suite).

## 6. Catatan CI

Butuh PostgreSQL lokal :5433 dan pembungkus `uji-run.mjs`; tidak cocok untuk CI tanpa DB. Tidak ada uji flaky; seluruh tahap deterministik.

## 7. Masalah dan keterbatasan

- Skrip pembantu (`sr53.mjs`, `sentinel.mjs`, `projcheck.mjs`, `mig.mjs`, salinan SQL, snapshot `snap_*.json`, cadangan JSON) disimpan di direktori sementara sesi, bukan di repo. Hasil per tahap tercatat di tabel §2-§3.
- Temuan produk baru: tidak ada.

## 8. Rekomendasi

1. Tambahkan langkah "cadangkan data Studio (atau `pg_dump -t 'Studio*'`)" sebelum rollback §1.4 bila suatu saat dijalankan di v21; rollback ini destruktif terhadap data Studio.
2. Simpan teks rollback sebagai berkas di `docs/` (bukan hanya blok kode di spesifikasi) agar dapat dieksekusi apa adanya dan diverifikasi sha256-nya; gladi ini memakai sha `10549a93…` (delta) dan `a28a7a15…` (Studio asli).

## 9. Lanjutan D-283: gladi runbook `docs/STUDIO-ROLLBACK-RUNBOOK.md` (pg_dump/pg_restore)

Tanggal 2026-10-23, 10:12-10:20 WIB. DB `gsp_agent_hq_v21_uji` saja; DATABASE_URL hanya di lingkungan proses anak (pembungkus sesi membaca `.env` lewat `uji-run.mjs ujiUrl()`, keluaran disaring, URL tidak dicetak; URL tanpa parameter kueri sehingga tidak perlu dipangkas). Alat: `C:\Program Files\PostgreSQL\17\bin` (pg_dump/pg_restore/psql 17.11 = versi server 17.11). Perintah runbook dijalankan persis di bash; placeholder diisi `<db>` = `gsp_agent_hq_v21_uji`, `<YYYYMMDD-HHMM>` = `20261023-1015`, `--dbname=...` = `--dbname="$DATABASE_URL"`. Penguat yang sama dengan §1: 27 baris penanda di 6 tabel lama, dihapus di akhir. Pembanding: snapshot hitungan + md5 per tabel (`sr53.mjs`) sebelum (r1) dan sesudah.

Catatan keadaan awal: `_uji` sudah di-reset dan suite SR-49 dijalankan ulang oleh pihak lain antara gladi pertama dan gladi ini (`_prisma_migrations.finished_at` 10:03:43 WIB, `tests/integration/studio/out/00_suite_run.log` 10:06; StudioRenderJob 11 → 14, md5 semua tabel Studio berubah). Saat gladi, `pg_stat_activity` di `_uji` = 0 sesi lain. Pembanding gladi ini = keadaan yang ditemukan (r0), bukan keadaan §3.

| Langkah runbook | Perintah (persis) | Hasil (dikutip) |
|---|---|---|
| §2.2 DB tujuan | `psql "$DATABASE_URL" -c "SELECT current_database();"` | `gsp_agent_hq_v21_uji` |
| §2.3 sha berkas | `sha256sum prisma/rollback/01_… 02_…` | `10549a93000c6d94…`, `a28a7a15c12caaa1…` = tabel §0 runbook |
| §2.4 status awal | `npx prisma migrate status` | `7 migrations found` / `Database schema is up to date!` exit 0 |
| §2.5 hitungan | kueri `query_to_xml` runbook → `counts_before.txt` | 53 baris tabel, exit 0 |
| §3.1 cadangan penuh | `pg_dump --format=custom --file=backup_<db>_<ts>.dump "$DATABASE_URL"` | exit 0, 2.317.243 byte |
| §3.2 cadangan data Studio | `pg_dump --format=custom --data-only -t '"StudioTemplate"' … (18 tabel) --file=backup_studio_data_<db>_<ts>.dump "$DATABASE_URL"` | exit 0, 2.184.830 byte; peringatan: `there are circular foreign-key constraints on this table: StudioTemplateVersion` / `You might not be able to restore the dump without using --disable-triggers` |
| §3.3 periksa cadangan | `pg_restore --list … \| grep -c "TABLE DATA"` | `18` (cadangan penuh: `53`) |
| §4 tingkat 1 | `npx prisma db execute --file prisma/rollback/01_rollback_studio_structure_delta.sql --schema prisma/schema.prisma` | `Script executed successfully.`; kueri verifikasi runbook: `0`, `0`, `9`; status: `Following migration have not yet been applied: 20261023200000_add_studio_structure` (exit 1, sesuai runbook) |
| §4 cek tabel | snapshot r2 vs r1 | 35 tabel lama + 9 Studio asli hitungan identik; 3 Studio asli md5 identik, 6 berubah karena kolom delta hilang; `_prisma_migrations` 7 → 6 |
| §5 tingkat 2 | `npx prisma db execute --file prisma/rollback/02_rollback_studio_base.sql --schema prisma/schema.prisma` | `Script executed successfully.`; verifikasi: `0`, `0`, `1`; status: `add_studio` + `add_studio_structure` belum diterapkan (exit 1) |
| §5 bandingkan hitungan | kueri §2.5 → `counts_after_t2.txt`, dibandingkan dengan `counts_before.txt` | 35 tabel non-Studio: hanya `_prisma_migrations` 7 → 5 (tepat -2, sesuai runbook); snapshot md5 r3 vs r1: 34 tabel lama md5 identik |
| §6.1 struktur | `npx prisma migrate deploy` ; `npx prisma migrate status` | `Applying migration 20261022120000_add_studio` / `Applying migration 20261023200000_add_studio_structure` / `All migrations have been successfully applied.`; `Database schema is up to date!` exit 0 |
| §6.2 data Studio saja | `pg_restore --data-only --single-transaction --disable-triggers --dbname="$DATABASE_URL" backup_studio_data_<db>_<ts>.dump` | exit 0; snapshot r4 vs r1: `tabel dibandingkan=53 hitungan beda=0`, **52/53 md5 identik** (`_prisma_migrations` beda hanya karena waktu terapan 2 baris) |
| §6.2 opsi penuh (tambahan) | `pg_restore --clean --if-exists --dbname="$DATABASE_URL" backup_<db>_<ts>.dump` | exit 0; snapshot r5 vs r1: **53/53 hitungan + md5 identik** (termasuk `_prisma_migrations`); `pg_dump --schema-only` sekarang vs `pg_restore --schema-only` dari cadangan: identik (di luar token `\restrict` acak); status up to date |
| Akhir | hapus 27 baris penanda; snapshot r6 vs r0; `migrate status` | `tabel dibandingkan=53 hitungan beda=0`, 53/53 md5 identik dengan keadaan awal; `Database schema is up to date!` exit 0. `_uji` dipulihkan |

### 9.1 Perintah runbook yang salah atau kurang (runbook tidak diubah)

| # | Seksi | Masalah | Usulan |
|---|---|---|---|
| RB-1 | §3.2, §6.2 | `pg_dump --data-only` memperingatkan FK melingkar pada `StudioTemplateVersion` (rujukan ke dirinya sendiri). Jalur cadangan "isi tabel menurut urutan kunci asing" tanpa `--disable-triggers` dapat gagal untuk baris yang saling merujuk di tabel yang sama | Sebut peringatan ini sebagai hal yang diharapkan; nyatakan `--disable-triggers` (superuser) praktis wajib untuk opsi data-saja; tanpa superuser, pakai opsi penuh atau urutkan baris di dalam tabel |
| RB-2 | §2.5, §5 | Keluaran `psql` bawaan berformat rata kolom; lebar kolom berubah saat tabel Studio hilang sehingga `diff counts_before.txt counts_after.txt` menandai semua baris berbeda. Perintah penyimpan berkas juga tidak ditulis | Tulis perintah lengkap: `psql "$DATABASE_URL" -At -F '|' -f counts.sql > counts_before.txt` (atau `--csv`) agar bisa dibandingkan dengan `diff`/`join` |
| RB-3 | §2.2, §2.5, §4, §5 | Hanya "jalankan lewat psql"; perintah psql konkret tidak ditulis | `psql "$DATABASE_URL" -At -c "SELECT current_database();"`, dan `-f <berkas>.sql` untuk blok verifikasi |
| RB-4 | §6.2 | `--dbname=...` placeholder tanpa nilai | `--dbname="$DATABASE_URL"` (terbukti bekerja) |
| RB-5 | §3, §6 | Lokasi dan versi alat tidak disebut. Di host ini `pg_dump`/`pg_restore`/`psql` tidak ada di PATH; terpasang PostgreSQL 17 dan 18. Dipakai 17 (= server 17.11). Hipotesis, belum diuji: pg_restore 18 terhadap server 17 bisa memancarkan pengaturan yang tidak dikenal server | Tambah prasyarat: pakai binari dengan major sama dengan server (`SELECT current_setting('server_version')`); di host ini `C:\Program Files\PostgreSQL\17\bin` |
| RB-6 | §3.2 | Sintaks kutip `-t '"Nama"'` hanya benar di bash/POSIX; host Windows. Di PowerShell atau cmd penulisan kutipnya berbeda | Nyatakan runbook dijalankan di Git Bash, atau beri varian PowerShell |
| RB-7 | §6 | Opsi "Penuh" tidak butuh §6.1 lebih dulu (`--clean` membangun ulang seluruh skema dan `_prisma_migrations`); urutan §6.1 lalu §6.2 tetap bekerja (terbukti), tetapi runbook tidak menyebutnya | Jelaskan bahwa §6.1 wajib hanya untuk opsi data-saja |
| RB-8 | §3.4 | Arsip `STUDIO_WORKSPACE_ROOT` tidak digladikan (workspace `_uji` ada di direktori sementara uji) | Tidak ada perubahan; dicatat sebagai celah gladi |

Yang terbukti benar apa adanya: sha256 berkas SQL, kedua `db execute`, semua kueri verifikasi §4/§5 (nilai 0/0/9 dan 0/0/1), harapan `migrate status` per tahap, `_prisma_migrations` -2, `grep -c "TABLE DATA"` = 18, `migrate deploy` menerapkan migrasi lama yang tertunda, serta pemulihan data-saja dan penuh.

Berkas kerja (di luar repo, data uji saja): `C:\Users\TRIAL\AppData\Local\Temp\sr53\rb\` (dua `.dump`, `counts_before.txt`, `counts_after_t2.txt`, `step2-6*.txt`, `cmp_*.txt`, `schema_*.sql`).
