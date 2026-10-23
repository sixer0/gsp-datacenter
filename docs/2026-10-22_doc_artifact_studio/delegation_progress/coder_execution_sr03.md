# SR-03 delta Prisma + migrasi struktur - coder-execution

Status: complete (dengan catatan generate EPERM, lihat bawah).

- Klaim di-append ke `file_claims.md` (prefiks SR-03) sebelum menulis.
- Baseline diff sebelum edit: 5 pernyataan drift IlSearchDoc (sama S03/INT-K). Skema pra-edit sha `97ac0717…`, pasca `0e0972ae…` (CRLF dipertahankan; 0 baris lama dihapus; satu penyelarasan spasi yang sempat berubah di relasi StudioDocument dipulihkan agar murni aditif).
- Edit: 3 enum + 9 model M10-M18 di akhir berkas (setelah WorkerTrace); 14 kolom + 2 indeks/unik + relasi balik di 7 model lama, sesuai register SR-01 §3.1-3.3 (KD-07 NoAction untuk FK identitas).
- Pengurangan baseline: skrip pertama memecah blok di baris kosong sebelum `CONSTRAINT …_pkey` (Prisma menyisipkan baris kosong di CREATE TABLE) sehingga merusak indentasi; diganti pengurangan teks per blok baseline (tiap blok ditemukan tepat sekali) agar keluaran byte-identik dengan diff penuh.
- `migration.sql` sha `abff9bac…a45d`, 77 blok; penjaga: DROP 0, CREATE TABLE 9, CREATE TYPE 3, indeks 30 dan FK 20 sama nama dengan register, ADD COLUMN 14, semua objek `Studio*`.
- `migrate deploy` ke v21 (cek .env tanpa mencetak password; tidak ada DATABASE_URL di shell) → applied; `migrate status` up to date (7 migrasi); diff ulang = baseline; hitungan 16 tabel identik.
- `prisma generate`: berkas klien ditulis ulang, rename DLL mesin gagal EPERM karena `next dev` PID 26588 memegang `query_engine-windows.dll.node` (diidentifikasi via modul proses). Biner identik, klien fungsional (probe delegasi baru OK). Berkas `.tmp` sisa dua percobaan dihapus. Tindak lanjut controller: restart dev server lalu `npx prisma generate`.
- tsc repo penuh: exit 0, 0 galat.
- Tidak menyentuh `gsp_agent_hq` produksi; tidak memakai `migrate dev`/`db push`.
