# DC-38 Gladi migrasi + rollback delta kontrak di `gsp_agent_hq_v21_uji`

Baris: DC-38 (blueprint `identification/07_document_contract_blueprint.md:325`; register `masterplan/05_document_contract_specs.md` §7.3-§7.5; D-21 prosedur migrasi, D-365 migrasi terpasang di v21; klaim `delegation_progress/file_claims.md:1066`). Agen: test-expert, skill `tdd`. Tanggal: 2026-10-30, 20:09-20:12 WIB.

**Vonis: LULUS.** Rollback 0 galat; 3 tabel, 8 kolom, 19 indeks, 4 FK, kolom `tsv` GENERATED + GIN hilang tanpa menyentuh objek lain; 53 tabel lama hitungan baris + isi (md5) identik; `migrate deploy` ulang memulihkan semua objek delta dengan definisi identik; `migrate status` up to date. `_uji` ditinggalkan di keadaan terkini (8/8 migrasi).

## 1. Strategi uji

- **Lingkup:** DB `gsp_agent_hq_v21_uji` saja. Tidak ada perubahan kode, migrasi, rollback, `.env`, maupun DB lain (`gsp_agent_hq_v21`, `gsp_agent_hq`, `~/gsp-datacenter` tidak disentuh; `migrate dev`/`db push` tidak dipakai).
- **URL tanpa mencetak rahasia:** preseden `test/08_rollback_rehearsal.md` §1/§9. Perintah Prisma lewat `node tests/integration/studio/uji-run.mjs -- <perintah>` (membaca `.env`, mengganti nama DB menjadi `_uji` di dalam proses, DATABASE_URL hanya di lingkungan proses anak, keluaran disaring). Skrip pembantu memakai `ujiUrl()` yang sama dan menolak berjalan bila `current_database() <> 'gsp_agent_hq_v21_uji'`.
- **Berkas yang digladikan (apa adanya, tanpa salinan):** `prisma/migrations/20261030220000_add_studio_contract/migration.sql` sha256 `4992bcdf14744d65…` (= `checksum` di `_prisma_migrations`); `prisma/rollback/03_rollback_studio_contract_delta.sql` sha256 `994ccb666d83385d…`.
- **Penguat (bukan bagian prosedur), pola SR-53:** tabel lama `_uji` non-Studio berisi 0 baris, sehingga "hitungan identik" akan trivial. Sebelum rollback disisipkan 27 baris penanda `id LIKE 'dc38-s%'` di 6 tabel lama (AgentRequest 3, HermesTask 4, IlSearchDoc 5, WorkerTrace 6, HermesMemory 2, OrchestrationRecord 7), dan **data kontrak penanda** agar rollback menghapus tabel/kolom delta yang BERISI: 1 `StudioContractRecord`, 2 `StudioContractItem`, 1 `StudioDocRef`, 6 kolom kontrak 1 `StudioDocument`, `contractKind` 1 `StudioTemplate`. Semua penanda hilang/dihapus di akhir.
- **Pembanding per tabel:** hitungan baris + `md5(string_agg(to_jsonb(row) - kolom_delta ORDER BY …))` ("md5 lama", tanpa 8 kolom delta) dan md5 baris penuh; plus himpunan kolom (`information_schema.columns`), indeks + definisinya (`pg_indexes`), constraint (`pg_constraint`), tipe.
- **Langkah §7.5 "hapus baris `_prisma_migrations`":** sudah termuat di berkas rollback (`DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261030220000_add_studio_contract';` di dalam `BEGIN … COMMIT`), jadi tidak ada penghapusan manual terpisah.
- **Rollback data seed (opsional §7.5):** tidak berlaku. Di `_uji` `StudioTemplate.slug='laporan-kerja-agen'` = 0 dan `StudioSectionType.key='contractRecord'` = 0 (kueri 20:11), sehingga tidak dijalankan dan tidak ada berkas keluaran yatim.
- `pg_stat_activity` sesi lain di `_uji`: 0 pada awal (20:09) dan akhir (20:11).

## 2. Urutan tahap dan bukti

| Tahap | Perintah | Hasil (dikutip) |
|---|---|---|
| T0 status awal | `uji-run.mjs -- npx prisma migrate status` | `Datasource "db": PostgreSQL database "gsp_agent_hq_v21_uji"` / `8 migrations found` / `Following migration have not yet been applied:` / `20261030220000_add_studio_contract` |
| T0 snapshot | `dc38.mjs snap s0_predeploy` | 53 tabel, 3.467 baris; delta 0 tabel/0 kolom/0 indeks/0 FK; `_prisma_migrations` 7 |
| T1 skema terbaru | `uji-run.mjs -- npx prisma migrate deploy` | `Applying migration \`20261030220000_add_studio_contract\`` / `All migrations have been successfully applied.` exit 0 |
| T1 status | `migrate status` | `8 migrations found in prisma/migrations` / `Database schema is up to date!` exit 0 |
| T1 snapshot | `dc38.mjs snap s1_deployed`; `cmp s0 s1` | 56 tabel; delta **3 tabel, 8 kolom, 19 indeks, 4 FK**; `StudioDocBlock.tsv` `is_generated=ALWAYS`, ekspresi `to_tsvector('simple'::regconfig, "left"(COALESCE("textPlain", ''::text), 100000))`; `CREATE INDEX "StudioDocBlock_tsv_idx" ON public."StudioDocBlock" USING gin (tsv)`; `tsv` terisi 1.008/1.008 baris. 53 tabel lama: hitungan beda hanya `_prisma_migrations 7 -> 8`, md5 lama identik 52/52. Objek baru: 48 kolom (40 di 3 tabel baru + 8 delta), 22 indeks (19 + 3 pkey), 7 constraint (4 FK + 3 PK), 0 tipe, 0 definisi indeks lama berubah |
| T2 penanda | `sentinel.mjs insert`; `contract_sentinel.mjs`; `snap s2_before_rollback` | 27 baris tabel lama; `{"record":1,"items":2,"refs":1,"documentUpdated":1,"templateUpdated":1}`; 3.499 baris |
| T3 rollback | `uji-run.mjs -- npx prisma db execute --file prisma/rollback/03_rollback_studio_contract_delta.sql --schema prisma/schema.prisma` (20:10:42) | `Script executed successfully.` exit 0 (tanpa CASCADE, tidak ada ketergantungan tak terduga, walau tabel/kolom delta berisi data) |
| T3 cek §7.5 | `check.mjs` (kueri dikutip di §3) | tabel M19-M21 `0`; 8 kolom MX08-MX10 `0`; indeks delta `0`; FK delta `0`; kolom GENERATED di StudioDocBlock `0`; baris migrasi `0`; `pg_tables` `53` |
| T3 snapshot | `snap s3_after_rollback`; `cmp s2 s3` | 53 tabel, 3.494 baris (= 3.499 - 4 baris kontrak - 1 baris buku). Hilang TEPAT: 3 tabel (40 kolom), 8 kolom delta, 22 indeks (19 delta + 3 pkey), 7 constraint (4 FK + 3 PK); ditambah 0, tipe berubah 0, definisi indeks lain berubah 0. 53 tabel tersisa: hitungan beda hanya `_prisma_migrations 8 -> 7`; md5 lama identik 52/52 |
| T3 status | `migrate status` | `Following migration have not yet been applied:` / `20261030220000_add_studio_contract` exit 1 (sesuai harapan) |
| T4 deploy ulang | `uji-run.mjs -- npx prisma migrate deploy` | `Applying migration \`20261030220000_add_studio_contract\`` / `All migrations have been successfully applied.` exit 0 |
| T4 status | `migrate status` | `8 migrations found in prisma/migrations` / `Database schema is up to date!` exit 0 |
| T4 cek | `check.mjs`; `snap s4_redeployed`; `cmp s2 s4` | tabel `3`, kolom `8`, indeks pola delta `22` (19 + 3 pkey), FK `4`, GENERATED `1`, baris migrasi `1` (checksum `4992bcdf…`), `pg_tables` `56`; kolom/indeks/constraint/tipe/definisi indeks **identik dengan s2** (0 ditambah, 0 hilang, 0 berubah); `tsv` terisi 1.008; 53 tabel lama hitungan identik, md5 lama identik; 3 tabel kontrak 0 baris (data penanda kontrak hilang, sesuai rancangan rollback) |
| T5 akhir | `sentinel.mjs delete`; `snap s5_final`; `cmp s1 s5` | 27 baris penanda dihapus; `compared=56 countDiff=0`; md5 baris PENUH identik 55/56 (termasuk `tsv` dan kolom kontrak); `_prisma_migrations` beda hanya `finished_at` baris `20261030220000_add_studio_contract`; definisi 8 kolom delta (tipe, GENERATED, ekspresi) identik s1 = s5 |

## 3. Kueri cek sesudah rollback (T3) dan sesudah deploy ulang (T4)

| Kueri | T3 | T4 |
|---|---|---|
| `select current_database()` | `gsp_agent_hq_v21_uji` | `gsp_agent_hq_v21_uji` |
| `select count(*) from pg_tables where schemaname='public' and tablename in ('StudioContractRecord','StudioContractItem','StudioDocRef')` | 0 | 3 |
| `select count(*) from information_schema.columns where table_schema='public' and (table_name,column_name) in (('StudioTemplate','contractKind'),('StudioDocument','contractKind'),('StudioDocument','contractStatus'),('StudioDocument','contractOwner'),('StudioDocument','contractTaskRef'),('StudioDocument','contractDueOn'),('StudioDocument','contractCardIds'),('StudioDocBlock','tsv'))` | 0 | 8 |
| `select count(*) from pg_indexes where schemaname='public' and (indexname like 'StudioContract%' or indexname like 'StudioDocRef%' or indexname='StudioDocBlock_tsv_idx' or indexname like 'StudioDocument_contract%' or indexname='StudioTemplate_contractKind_idx')` | 0 | 22 (19 delta + 3 pkey) |
| `select count(*) from pg_constraint where contype='f' and conname in (4 nama FK §7.3)` | 0 | 4 |
| `select count(*) from information_schema.columns where table_schema='public' and table_name='StudioDocBlock' and is_generated='ALWAYS'` | 0 | 1 |
| `select count(*) from "_prisma_migrations" where migration_name='20261030220000_add_studio_contract'` | 0 | 1 |
| `select count(*) from pg_tables where schemaname='public'` | 53 | 56 |

## 4. Hitungan baris per tabel

s0 = sebelum deploy, s1 = sesudah deploy, s2 = sebelum rollback (dengan penanda), s3 = sesudah rollback, s4 = sesudah deploy ulang, s5 = akhir (penanda dihapus). md5 = md5 lama: s0/s1, s2/s3, s2/s4, s1/s5 ("=" identik, "x" beda, "-" tabel tidak ada).

| Tabel | s0 | s1 | s2 | s3 | s4 | s5 | md5 |
|---|---|---|---|---|---|---|---|
| AgentRequest | 0 | 0 | 3 | 3 | 3 | 0 | = / = / = / = |
| HermesMemory | 0 | 0 | 2 | 2 | 2 | 0 | = / = / = / = |
| HermesTask | 0 | 0 | 4 | 4 | 4 | 0 | = / = / = / = |
| IlSearchDoc | 0 | 0 | 5 | 5 | 5 | 0 | = / = / = / = |
| OrchestrationRecord | 0 | 0 | 7 | 7 | 7 | 0 | = / = / = / = |
| WorkerTrace | 0 | 0 | 6 | 6 | 6 | 0 | = / = / = / = |
| StudioAsset | 26 | 26 | 26 | 26 | 26 | 26 | = / = / = / = |
| StudioBlock | 1155 | 1155 | 1155 | 1155 | 1155 | 1155 | = / = / = / = |
| StudioDocBlock (delta `tsv`) | 1008 | 1008 | 1008 | 1008 | 1008 | 1008 | = / = / = / = |
| StudioDocChapter | 87 | 87 | 87 | 87 | 87 | 87 | = / = / = / = |
| StudioDocIdentity | 514 | 514 | 514 | 514 | 514 | 514 | = / = / = / = |
| StudioDocSection | 85 | 85 | 85 | 85 | 85 | 85 | = / = / = / = |
| StudioDocSubsection | 367 | 367 | 367 | 367 | 367 | 367 | = / = / = / = |
| StudioDocument (delta 6 kolom) | 5 | 5 | 5 | 5 | 5 | 5 | = / = / = / = |
| StudioOutputFile | 21 | 21 | 21 | 21 | 21 | 21 | = / = / = / = |
| StudioRenderJob | 17 | 17 | 17 | 17 | 17 | 17 | = / = / = / = |
| StudioRevision | 15 | 15 | 15 | 15 | 15 | 15 | = / = / = / = |
| StudioSectionType | 51 | 51 | 51 | 51 | 51 | 51 | = / = / = / = |
| StudioTemplate (delta `contractKind`) | 6 | 6 | 6 | 6 | 6 | 6 | = / = / = / = |
| StudioTemplateSlot | 40 | 40 | 40 | 40 | 40 | 40 | = / = / = / = |
| StudioTemplateSlotParam | 49 | 49 | 49 | 49 | 49 | 49 | = / = / = / = |
| StudioTemplateVersion | 14 | 14 | 14 | 14 | 14 | 14 | = / = / = / = |
| 30 tabel lain 0 baris di semua tahap (Account, AgentBusMessage, AgentEvent, AgentState, Article, BattleRoyaleBot, Brief, ClientPulseAlert, ClientPulseAnalysis, ClientPulseChat, ClientPulseClient, ClientPulseMessage, ContentCalendar, ContentRequest, DataStore, Draft, Idea, LongformScript, Mission, SavedTitle, Session, StudioArtifact, StudioTemplateSlotRoleFormat, TweetMetric, User, VerificationToken, WebUiUser, YoutubeFeedback, YoutubeIdea, YoutubeScript) | 0 | 0 | 0 | 0 | 0 | 0 | = (masing-masing) |
| StudioContractRecord (delta) | - | 0 | 1 | - | 0 | 0 | - / - / x / = |
| StudioContractItem (delta) | - | 0 | 2 | - | 0 | 0 | - / - / x / = |
| StudioDocRef (delta) | - | 0 | 1 | - | 0 | 0 | - / - / x / = |
| _prisma_migrations (buku) | 7 | 8 | 8 | 7 | 8 | 8 | turun/naik hanya baris migrasi kontrak |

## 5. Kriteria DC-38

| Kriteria (blueprint :325) | Bukti | Status |
|---|---|---|
| rollback 0 galat | T3 `Script executed successfully.` exit 0 | LULUS |
| objek delta hilang | T3 §3: 0/0/0/0/0/0; cmp s2/s3 hanya objek delta yang hilang | LULUS |
| objek delta kembali setelah deploy ulang | T4 §3: 3/8/22/4/1/1; cmp s2/s4 skema identik; s1/s5 definisi kolom identik | LULUS |
| hitungan baris tabel lama identik | §4: 53 tabel lama identik s2 = s3 = s4 dan s1 = s5 (hitungan + md5) | LULUS |
| `migrate status` up to date | T4 dan T1 `Database schema is up to date!` exit 0 | LULUS |

## 6. Cakupan dan celah

- Dicakup: rollback dengan tabel/kolom delta berisi data, keutuhan 53 tabel lama (hitungan + isi), keutuhan objek skema non-delta, idempotensi `migrate deploy` setelah baris buku dihapus, regenerasi `tsv` (md5 baris penuh StudioDocBlock s1 = s5).
- Tidak dicakup: rollback di `gsp_agent_hq_v21` (di luar lingkup, belum pernah dijalankan; D-365), rollback saat server aplikasi menulis (konkurensi), rollback data seed (tidak ada seed kontrak di `_uji`), volume v21 (tabel non-Studio `_uji` hanya berisi penanda).
- Catatan operasional (bukan cacat produk): rollback menghapus data kontrak secara permanen (penanda kontrak 4 baris + 7 nilai kolom tidak kembali setelah deploy ulang, sesuai rancangan). Bila dijalankan di v21, cadangan `pg_dump -t '"StudioContract*"' -t '"StudioDocRef"'` + kolom kontrak `StudioDocument`/`StudioTemplate` perlu menjadi langkah eksplisit, seperti rekomendasi runbook 08 §8.
- Temuan produk baru: tidak ada.

## 7. Cara menjalankan ulang

```
node tests/integration/studio/uji-run.mjs -- npx prisma migrate status
node tests/integration/studio/uji-run.mjs -- npx prisma migrate deploy
node <tmp>/dc38.mjs snap s1 ; node <tmp>/sentinel.mjs insert ; node <tmp>/contract_sentinel.mjs ; node <tmp>/dc38.mjs snap s2
node tests/integration/studio/uji-run.mjs -- npx prisma db execute --file prisma/rollback/03_rollback_studio_contract_delta.sql --schema prisma/schema.prisma
node <tmp>/check.mjs ; node <tmp>/dc38.mjs snap s3 ; node <tmp>/dc38.mjs cmp s2 s3
node tests/integration/studio/uji-run.mjs -- npx prisma migrate deploy
node tests/integration/studio/uji-run.mjs -- npx prisma migrate status
node <tmp>/check.mjs ; node <tmp>/sentinel.mjs delete ; node <tmp>/dc38.mjs snap s5 ; node <tmp>/dc38.mjs cmp s1 s5
```

`<tmp>` = direktori scratchpad sesi (`…\scratchpad\dc38\`: `dc38.mjs`, `sentinel.mjs` turunan SR-53, `contract_sentinel.mjs`, `check.mjs`, `snap_*.json`, `cmp_*.txt`, `check_s3.txt`, `check_s4.txt`); data uji saja, di luar repo.

## 8. CI dan keterbatasan

Butuh PostgreSQL lokal :5433 dan `uji-run.mjs`; tidak cocok untuk CI tanpa DB. Tidak ada uji flaky; semua tahap deterministik. Keadaan akhir `_uji`: 8/8 migrasi, up to date, data identik dengan s1 (keadaan sesudah deploy pertama). DC-39 dapat memakai `_uji` setelah ini.
