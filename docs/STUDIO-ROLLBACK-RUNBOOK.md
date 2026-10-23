# Runbook Rollback Doc Artifact Studio (basis data)

Runbook ini hanya digladikan di `gsp_agent_hq_v21_uji`. Agen AI DILARANG menjalankannya pada DB produksi `gsp_agent_hq`. Rollback produksi hanya oleh pemilik sistem dengan persetujuan tertulis, setelah cadangan penuh dan gladi ulang pada salinan produksi.

Runbook ini menurunkan skema basis data Doc Artifact Studio, lalu memulihkannya bila perlu. Isinya
mengikuti dua gladi yang lulus di `gsp_agent_hq_v21_uji`: rollback SQL (SR-53, D-260) dan
cadangan/pemulihan `pg_dump`/`pg_restore` (D-285); laporan
`docs/2026-10-22_doc_artifact_studio/test/08_rollback_rehearsal.md` §2-§3 dan §9. Rollback hanya
menyentuh objek Studio. Tabel HQ lain, tipe `Role`, ekstensi `pg_trgm`, dan migrasi
`20261023150000_worker_trace_baseline` tidak disentuh.

**Peringatan.** Tingkat 2 menghapus SELURUH data Studio secara permanen: templat, dokumen,
revisi, job render, aset, dan identitas pid. Langkah cadangan (seksi 4) WAJIB sebelum tingkat 2,
dan sangat dianjurkan sebelum tingkat 1. Tanpa cadangan, data Studio tidak dapat dikembalikan;
`migrate deploy` hanya membangun ulang tabel kosong.

## 0. Berkas SQL resmi

Kedua berkas berisi teks yang digladikan apa adanya (dibandingkan sha256 dengan gladi). Jangan
menyunting berkasnya. Perubahan apa pun membuat sha berbeda dan menggugurkan bukti gladi.

| Tingkat | Berkas | Isi | sha256 |
|---|---|---|---|
| 1 | `prisma/rollback/01_rollback_studio_structure_delta.sql` | delta struktur (migrasi `20261023200000_add_studio_structure`): 9 tabel, 14 kolom, 2 indeks, 3 tipe, 1 baris `_prisma_migrations` | `10549a93000c6d944f100c587cf16fd502eebbf46f09cf9f0eb2e49383f0294f` |
| 2 | `prisma/rollback/02_rollback_studio_base.sql` | Studio asli (migrasi `20261022120000_add_studio`): 9 tabel, 11 tipe, 1 baris `_prisma_migrations` | `a28a7a15c12caaa156954f767f1249110ed4521f1bd24d44f159c98bed8fe8e1` |

Sumber teks: blueprint `identification/05_structural_sections_blueprint.md:187-210` (tingkat 1,
= register `03_structural_sections_specs.md` §3.5) dan `masterplan/01_specs.md` §1.4 (tingkat 2).
Berkas sengaja berada di `prisma/rollback/`, bukan di `prisma/migrations/`, agar Prisma tidak
membacanya sebagai migrasi.

Keduanya berbentuk `BEGIN; ... COMMIT;` tanpa `CASCADE`: bila ada ketergantungan tak terduga,
pernyataan gagal dan seluruh transaksi dibatalkan.

**Urutan wajib:** tingkat 1 sebelum tingkat 2. Tabel delta merujuk tabel Studio asli lewat kunci
asing, jadi `DROP TABLE` tingkat 2 tanpa `CASCADE` gagal selama tabel delta masih ada.

## 1. Larangan

- Runbook ini hanya digladikan di `gsp_agent_hq_v21_uji`. Agen AI DILARANG menjalankannya pada DB produksi `gsp_agent_hq`. Rollback produksi hanya oleh pemilik sistem dengan persetujuan tertulis, setelah cadangan penuh dan gladi ulang pada salinan produksi. (D-02)
- Jangan menjalankan `prisma migrate dev`, `prisma db push`, atau `npm run db:push` di basis data
  mana pun (D-21).
- Jangan menjalankan perintah apa pun di runbook ini tanpa `STUDIO_RB_URL` (seksi 2). Perintah
  Prisma tanpa `DATABASE_URL` eksplisit membaca `.env` repo, yang menunjuk DB dev
  `gsp_agent_hq_v21`, bukan DB yang Anda periksa.
- Jangan menjalankan rollback saat server HQ masih menulis ke basis data. Gladi tidak menguji
  rollback di bawah tulis bersamaan.
- Jangan mencetak isi `STUDIO_RB_URL` ke log, terminal bersama, riwayat shell, atau dokumen.

## 2. Satu URL target dan penjaga basis data

Semua perintah dijalankan di **Git Bash** (sintaks kutip `-t '"Nama"'` dan fungsi shell di bawah
khusus bash; PowerShell dan cmd memakai kutip yang berbeda).

1. Masukkan URL target sekali, tanpa gema ke layar dan tanpa masuk riwayat, lalu tetapkan nama DB
   yang diharapkan:

   ```bash
   read -rsp "URL basis data target: " STUDIO_RB_URL; echo; export STUDIO_RB_URL
   export STUDIO_RB_DB=gsp_agent_hq_v21_uji
   ```

   Bila URL memuat parameter khas Prisma (mis. `?schema=public`), buang parameter itu: libpq
   (`psql`, `pg_dump`, `pg_restore`) menolak parameter yang tidak dikenalnya.

   Semua perintah dijalankan dari root repo (jalur `prisma/rollback/...` relatif terhadapnya).
   Cadangan `.dump` berisi SELURUH data basis data dan berkas `counts*` tidak di-ignore git:
   JANGAN menyimpannya di root repo atau di folder mana pun di dalam repo. Tetapkan folder kerja
   di LUAR repo (contoh `C:\Users\<user>\studio-rollback\`) dan pastikan ia memang di luar repo:

   ```bash
   export STUDIO_RB_DIR="/c/Users/<user>/studio-rollback"
   mkdir -p "$STUDIO_RB_DIR"
   case "$(cd "$STUDIO_RB_DIR" && pwd -P)/" in "$(git rev-parse --show-toplevel)/"*) echo "BERHENTI: STUDIO_RB_DIR di dalam repo";; *) echo "OK: $STUDIO_RB_DIR di luar repo";; esac
   ```

   Ganti `<user>` dengan nama pengguna Windows. Semua berkas cadangan dan hitungan di bawah
   ditulis ke `$STUDIO_RB_DIR`.
2. Pakai binari PostgreSQL dengan versi mayor yang sama dengan server. Di host ini alat tidak ada
   di PATH; terpasang PostgreSQL 17 dan 18, server 17.11, jadi pakai 17:

   ```bash
   export PATH="/c/Program Files/PostgreSQL/17/bin:$PATH"
   psql --version
   psql "$STUDIO_RB_URL" -At -c "SELECT current_setting('server_version');"
   ```

   Angka mayor kedua keluaran harus sama (gladi: 17.11 dan 17.11).
3. Definisikan penjaga. Penjaga memakai URL yang SAMA dengan semua perintah berikutnya dan
   berhenti bila nama DB tidak sesuai atau bila DB itu produksi:

   ```bash
   rb_guard() {
     local got
     got=$(psql "$STUDIO_RB_URL" -At -c "SELECT current_database();") || { echo "BERHENTI: koneksi gagal"; return 1; }
     if [ "$got" = "gsp_agent_hq" ]; then echo "BERHENTI: DB produksi gsp_agent_hq"; return 1; fi
     if [ "$got" != "$STUDIO_RB_DB" ]; then echo "BERHENTI: DB $got, diharapkan $STUDIO_RB_DB"; return 1; fi
     echo "OK: $got"
   }
   rb_guard
   ```

   Setiap perintah destruktif di bawah ditulis `rb_guard && <perintah>`, jadi tidak berjalan bila
   penjaga gagal. Perintah Prisma selalu diberi `DATABASE_URL="$STUDIO_RB_URL"` di depan; nilai
   lingkungan proses diutamakan di atas `.env`. Sebagai cek kedua, baris
   `Datasource "db": PostgreSQL database "<nama>"` pada keluaran `migrate status` harus memuat
   nama yang sama dengan `STUDIO_RB_DB`.

## 3. Prasyarat

1. Hentikan server HQ (atau setidaknya semua route `/api/studio/*` dan pekerja render).
2. Pastikan berkas SQL utuh:

   ```bash
   sha256sum prisma/rollback/01_rollback_studio_structure_delta.sql prisma/rollback/02_rollback_studio_base.sql
   ```

   Kedua nilai harus sama dengan tabel seksi 0.
3. Catat status migrasi awal:

   ```bash
   rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate status
   ```

   Harapan: `Datasource "db": PostgreSQL database "<STUDIO_RB_DB>"`, semua migrasi di
   `prisma/migrations` terapan, `Database schema is up to date!`.
4. Simpan kueri hitungan baris sebagai `$STUDIO_RB_DIR/counts.sql`, lalu rekam hitungan dalam format yang dapat
   dibandingkan dengan `diff` (tanpa perataan kolom):

   ```bash
   cat > "$STUDIO_RB_DIR/counts.sql" <<'SQL'
   SELECT table_name,
          (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS rows
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
   ORDER BY table_name;
   SQL
   rb_guard && psql "$STUDIO_RB_URL" -At -F '|' -f "$STUDIO_RB_DIR/counts.sql" > "$STUDIO_RB_DIR/counts_before.txt"
   ```

## 4. Langkah 1: cadangan (WAJIB sebelum tingkat 2)

1. Tetapkan stempel waktu berkas cadangan sekali (dipakai lagi saat pemulihan; di sesi shell lain,
   setel `STUDIO_RB_TS` ke stempel pada nama berkas `$STUDIO_RB_DIR/backup_*.dump`), lalu buat cadangan penuh
   (format custom, satu berkas):

   ```bash
   export STUDIO_RB_TS=$(date +%Y%m%d-%H%M)
   rb_guard && pg_dump --format=custom --file="$STUDIO_RB_DIR/backup_${STUDIO_RB_DB}_${STUDIO_RB_TS}.dump" "$STUDIO_RB_URL"
   ```

2. Cadangan data Studio saja (untuk pemulihan data Studio tanpa memutar balik tabel HQ lain):

   ```bash
   rb_guard && pg_dump --format=custom --data-only \
     -t '"StudioTemplate"' -t '"StudioTemplateVersion"' -t '"StudioSectionType"' \
     -t '"StudioDocument"' -t '"StudioRevision"' -t '"StudioBlock"' -t '"StudioArtifact"' \
     -t '"StudioOutputFile"' -t '"StudioRenderJob"' -t '"StudioTemplateSlot"' \
     -t '"StudioTemplateSlotParam"' -t '"StudioTemplateSlotRoleFormat"' -t '"StudioAsset"' \
     -t '"StudioDocSection"' -t '"StudioDocChapter"' -t '"StudioDocSubsection"' \
     -t '"StudioDocBlock"' -t '"StudioDocIdentity"' \
     --file="$STUDIO_RB_DIR/backup_studio_data_${STUDIO_RB_DB}_${STUDIO_RB_TS}.dump" "$STUDIO_RB_URL"
   ```

   Nama tabel bercampur huruf besar, jadi setiap nama diberi tanda kutip ganda di dalam tanda kutip
   tunggal. Daftar ini = 18 model Studio di `prisma/schema.prisma` (9 asli + 9 delta).

   Peringatan berikut DIHARAPKAN dan bukan galat: `there are circular foreign-key constraints on
   this table: StudioTemplateVersion` / `You might not be able to restore the dump without using
   --disable-triggers`. `StudioTemplateVersion` merujuk dirinya sendiri, jadi pemulihan data-saja
   membutuhkan `--disable-triggers` (seksi 7).
3. Periksa cadangan dapat dibaca:

   ```bash
   pg_restore --list "$STUDIO_RB_DIR/backup_studio_data_${STUDIO_RB_DB}_${STUDIO_RB_TS}.dump" | grep -c "TABLE DATA"
   ```

   Harapan: `18` (gladi: 18; cadangan penuh di DB uji: 53).
4. Berkas di disk (`STUDIO_WORKSPACE_ROOT`, bawaan `data/studio-workspace`: keluaran render, aset,
   log) TIDAK dihapus SQL rollback. Arsipkan folder itu bila basis data akan dipulihkan ke titik
   cadangan, agar baris `StudioOutputFile`/`StudioAsset` dan berkasnya tetap cocok. Langkah arsip
   ini belum digladikan (workspace DB uji berada di direktori sementara).

## 5. Langkah 2: rollback tingkat 1 (delta struktur)

```bash
rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma db execute --file prisma/rollback/01_rollback_studio_structure_delta.sql --schema prisma/schema.prisma
```

Harapan: `Script executed successfully.`

Verifikasi sebelum melanjutkan (tiga angka, harapan `0`, `0`, `9`):

```bash
rb_guard && psql "$STUDIO_RB_URL" -At \
  -c "SELECT count(*) FROM pg_tables WHERE tablename IN ('StudioTemplateSlot','StudioTemplateSlotParam','StudioTemplateSlotRoleFormat','StudioAsset','StudioDocSection','StudioDocChapter','StudioDocSubsection','StudioDocBlock','StudioDocIdentity');" \
  -c "SELECT count(*) FROM pg_type WHERE typname IN ('StudioSlotContentMode','StudioRenderScopeKind','StudioCompleteness');" \
  -c "SELECT count(*) FROM pg_tables WHERE tablename IN ('StudioTemplate','StudioTemplateVersion','StudioSectionType','StudioDocument','StudioRevision','StudioBlock','StudioArtifact','StudioOutputFile','StudioRenderJob');"
rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate status
```

`migrate status` kini mencantumkan `20261023200000_add_studio_structure` sebagai belum diterapkan
(exit 1 memang diharapkan pada tahap ini).

Berhenti di sini bila tujuannya hanya membuang delta struktur. Kode aplikasi versi refaktor
struktur membutuhkan tabel delta, jadi server tidak boleh dijalankan dengan kode itu sampai seksi 7.

## 6. Langkah 3: rollback tingkat 2 (seluruh Studio)

Hanya bila cadangan seksi 4 sudah ada dan terperiksa.

```bash
rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma db execute --file prisma/rollback/02_rollback_studio_base.sql --schema prisma/schema.prisma
```

Verifikasi (harapan `0`, `0`, `1`; tipe `Role` milik HQ tetap ada):

```bash
rb_guard && psql "$STUDIO_RB_URL" -At \
  -c "SELECT count(*) FROM pg_tables WHERE tablename LIKE 'Studio%';" \
  -c "SELECT count(*) FROM pg_type WHERE typname LIKE 'Studio%';" \
  -c "SELECT count(*) FROM pg_type WHERE typname = 'Role';"
rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate status
```

`migrate status` kini mencantumkan `20261022120000_add_studio` dan
`20261023200000_add_studio_structure` sebagai belum diterapkan;
`20261023150000_worker_trace_baseline` tetap terapan.

Bandingkan hitungan baris:

```bash
rb_guard && psql "$STUDIO_RB_URL" -At -F '|' -f "$STUDIO_RB_DIR/counts.sql" > "$STUDIO_RB_DIR/counts_after_t2.txt"
diff "$STUDIO_RB_DIR/counts_before.txt" "$STUDIO_RB_DIR/counts_after_t2.txt"
```

Harapan: baris tabel `Studio*` hilang; di antara tabel non-Studio hanya `_prisma_migrations`
berubah, berkurang tepat 2 (1 per tingkat).

## 7. Pemulihan

Pilih satu opsi.

**Opsi A, penuh** (server berhenti sejak cadangan, tidak ada tulis HQ sesudahnya). Tidak perlu
`migrate deploy` lebih dulu: `--clean` membangun ulang seluruh skema, termasuk
`_prisma_migrations`. Opsi ini juga memutar balik tabel HQ lain ke titik cadangan.

```bash
rb_guard && pg_restore --clean --if-exists --dbname="$STUDIO_RB_URL" "$STUDIO_RB_DIR/backup_${STUDIO_RB_DB}_${STUDIO_RB_TS}.dump"
rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate status
```

Gladi: 53/53 tabel hitungan dan md5 identik dengan sebelum rollback; skema identik.

**Opsi B, data Studio saja** (tabel HQ lain tidak diputar balik). Wajib dua langkah, berurutan:

1. Bangun ulang struktur Studio dengan migrasi resmi:

   ```bash
   rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate deploy
   rb_guard && DATABASE_URL="$STUDIO_RB_URL" npx prisma migrate status
   ```

   Harapan: `Applying migration 20261022120000_add_studio` (bila tingkat 2 dijalankan),
   `Applying migration 20261023200000_add_studio_structure`, `All migrations have been
   successfully applied.`, lalu `Database schema is up to date!`. Prisma menerapkan migrasi
   tertunda yang lebih tua walau `worker_trace_baseline` (lebih baru) sudah terapan; checksum
   migrasi sama dengan sebelumnya karena isi `migration.sql` tidak berubah.
2. Isi data Studio. `--disable-triggers` WAJIB karena kunci asing melingkar
   `StudioTemplateVersion` (seksi 4 butir 2) dan membutuhkan hak superuser:

   ```bash
   rb_guard && pg_restore --data-only --single-transaction --disable-triggers --dbname="$STUDIO_RB_URL" "$STUDIO_RB_DIR/backup_studio_data_${STUDIO_RB_DB}_${STUDIO_RB_TS}.dump"
   ```

   Tanpa hak superuser, pakai Opsi A, atau isi tabel menurut urutan kunci asing dengan baris
   `StudioTemplateVersion` diurutkan agar rujukan ke dirinya sendiri sudah ada (cara gladi SR-53
   pertama, lewat JSON).

   Gladi: 53 tabel 0 beda hitungan, 52/53 md5 identik (`_prisma_migrations` hanya berbeda waktu
   terapan 2 baris).

Verifikasi akhir untuk kedua opsi:

```bash
rb_guard && psql "$STUDIO_RB_URL" -At -F '|' -f "$STUDIO_RB_DIR/counts.sql" > "$STUDIO_RB_DIR/counts_restored.txt"
diff "$STUDIO_RB_DIR/counts_before.txt" "$STUDIO_RB_DIR/counts_restored.txt"
```

Harapan: tidak ada beda. Lalu jalankan server HQ, baca satu dokumen contoh
(`GET /api/studio/documents/[id]/content`), dan pastikan revisinya terekonstruksi.

## 8. Bila sesuatu gagal

| Gejala | Arti | Tindakan |
|---|---|---|
| `rb_guard` mencetak `BERHENTI` | URL menunjuk DB lain, DB produksi, atau koneksi gagal | jangan lanjut; periksa `STUDIO_RB_URL` dan `STUDIO_RB_DB` |
| `migrate status` menyebut nama DB lain | `DATABASE_URL` tidak diteruskan | ulangi dengan `DATABASE_URL="$STUDIO_RB_URL"` di depan perintah |
| `db execute` gagal di tengah | transaksi dibatalkan; tidak ada perubahan | baca pesan galat (biasanya ketergantungan tak terduga), jangan menambah `CASCADE`; laporkan |
| tingkat 2 gagal karena kunci asing | tingkat 1 belum dijalankan | jalankan tingkat 1 dulu |
| `pg_restore --data-only` gagal karena kunci asing | `--disable-triggers` tidak dipakai atau tanpa hak superuser | pakai `--disable-triggers` sebagai superuser, atau Opsi A |
| `migrate deploy` menolak karena drift | skema berbeda dari riwayat migrasi | jangan memakai `migrate dev`/`db push`; bandingkan dengan `prisma migrate diff` lalu eskalasi |
| `diff` hitungan menunjukkan tabel non-Studio berubah | ada penulis lain saat rollback, atau DB salah | hentikan, pulihkan dengan Opsi A, selidiki |

## 9. Rujukan

- Keputusan: D-02 (produksi `gsp_agent_hq` tidak disentuh), D-21 (aturan migrasi), D-260 (gladi
  rollback SQL lulus, IP-69), D-285 (gladi cadangan/pemulihan lulus, RB-1..RB-8), D-286 (revisi
  runbook ini).
- Gladi: `docs/2026-10-22_doc_artifact_studio/test/08_rollback_rehearsal.md` (urutan T0-T8,
  hitungan per tabel, sha teks SQL; §9 gladi `pg_dump`/`pg_restore`).
- Spesifikasi: `masterplan/01_specs.md` §1.4, register `03_structural_sections_specs.md` §3.5.
