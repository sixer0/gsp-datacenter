# INT-K (IP-16, IP-17, IP-19) - coder-execution

Status: complete (IP-16, IP-19); IP-17 19/21 tertutup di area ini, 2 sisa TS2305 dialihkan ke INT-R (pesan controller).

## IP-16 lisensi fon (F-017)
- Baru: `src/lib/studio/assets/fonts/LICENSE-IBM-Plex.txt`, `LICENSE-Inter.txt`, `LICENSE-DejaVu.txt`. Teks OFL 1.1 disalin terprogram dari `C:\Program Files\LibreOffice\license.txt` baris 7632-7692 (indentasi dirapikan saja); pemberitahuan hak cipta Plex/Inter dikutip dari nameID 0/14 berkas .ttf (fontTools VENV); DejaVu = salinan byte-identik `matplotlib/mpl-data/fonts/ttf/LICENSE_DEJAVU` (VENV hermes).
- `manifest.json`: +3 entri `kind: "license"` (sha256, bytes, appliesTo 16/1/2), `licenseFile` pada 19 entri fon, label lisensi DejaVu dikoreksi, count 26 -> 29. Konsumen (`docx/fonts/catalog.ts`, `html/base/fonts.ts`) memfilter `kind === "font"`.
- Sisa: RFN "Plex" tidak ada di salinan lokal (berkas hulu IBM tidak tersedia) - ditulis dengan atribusi + URL hulu untuk diverifikasi.

## IP-17 tsc lama (F-014)
- Sebelum (tsconfig sementara hanya 6 berkas, karena galat sintaks TS1005 `engine/docx/assemble/media.ts` milik baris lain menghentikan tsc di fase parse): 21 galat. Sesudah: 2 (TS2305 `provisionLeanProfile`, butuh deklarasi di `scripts/ensure-profile-complete.d.mts` -> INT-R). tsc repo penuh sesudah: 2 galat, keduanya itu.
- Perubahan: propose `attachments` bertipe; user-access `role: Role` (Prisma); orchestration `type Record` lokal -> `OrchRecord` (membayangi Record bawaan), `OrchStats` menggantikan `useState<any>`, cast `byPair`; information-library `variant="secondary"` -> `"ghost"` (runtime sudah btn-ghost), `prefill?.revisionNo`.
- Keputusan: dispatch-kpi `<SectionHeader>teks</SectionHeader>` -> `title="teks"` (children diabaikan komponen; judul kini TAMPIL - perubahan visual kecil yang disengaja); orchestration prop `hint` (tak didukung, tak pernah dirender) dipindah ke komentar JSX.
- eslint 6 berkas: exit 0 (0 error; 3 error pra-ada diperbaiki: 2 prefer-const, 1 no-explicit-any; 5 warning unused-vars pra-ada dibiarkan).

## IP-19 WorkerTrace (F-003)
- `db pull --print` dengan skema sementara di `C:\Users\TRIAL\AppData\Local\Temp\intk_pull\` (schema.prisma repo tak tersentuh, sha sama). Blok model disalin aditif ke `prisma/schema.prisma` (+17 baris; prefiks lama byte-identik sha 2a30c3a4..., CRLF dipertahankan).
- D-24: baseline 5 (drift IlSearchDoc) subset dari penuh 7; migrasi = 2 (CREATE TABLE + CREATE INDEX WorkerTrace), DROP 0, non-WorkerTrace 0. Diff DB nyata -> schema: 0 baris WorkerTrace. Deviasi: SQL diberi `IF NOT EXISTS` (idempoten untuk DB lama/baru).
- `prisma/migrations/20261023150000_worker_trace_baseline/migration.sql` (sha 24360790...), `migrate resolve --applied` di v21; `migrate status`: 6 migrations, up to date; diff migrations->schema pasca = baseline (AFTER_EQUALS_BASELINE). Hitungan baris sebelum = sesudah (WorkerTrace 1488, AgentRequest 757, HermesTask 2680, IlSearchDoc 18186, HermesMemory 878, WebUiUser 9, OrchestrationRecord 681). `prisma generate` dijalankan (klien kini punya `workerTrace`).
- `docs/ARCHITECTURE.md` §6: klaim "tanpa migrations / db push" diganti prosedur migrasi + larangan migrate dev/db push.

## Temuan
- Berkas `fonts/renamed/IBMPlex*-Bold*.ttf` (IP-20/S99) adalah Modified Version yang tetap memakai nama "Plex"; OFL syarat 3 melarang RFN pada versi termodifikasi tanpa izin IBM - perlu keputusan sebelum distribusi.
- `sed -i` di Git Bash mengubah CRLF -> LF seluruh berkas (terjadi di sini, sudah dipulihkan); peringatkan baris lain.
