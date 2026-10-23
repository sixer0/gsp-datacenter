# S52 Layanan penyimpanan dan tautan misi (coder-execution)

Status: complete. Area: `src/lib/studio/services/storage/**` (5 berkas, 803 baris): `index.ts` (barel I42), `paths.ts` (nama DATUM, docDir/figureDir/artifactDir/jobTmpDir, resolveSafe), `files.ts` (writeOutput, readStoredFile, readOutputFile, toOutputFileDto), `mission.ts` (assertMissionRefs), `log.ts` (storageLog, setStorageLogSink, createLayoutLogSink).

Penjaga: `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/services/storage` = kosong (exit 1; total repo 26 galat di area lain). `npx eslint src/lib/studio/services/storage` exit 0 tanpa keluaran.

Asap (tsx, akar sandbox di scratchpad, DB `gsp_agent_hq_v21`): `datumFileName("Manual_Komprehensif DATUM GSP","000/GSP/STD-X-2026","A",".DOCX")` = `Manual Komprehensif DATUM GSP 000-GSP-STD-X-2026 RevA.docx`; judul 200 karakter -> stem 120; 11 path jahat (`..`, absolut, UNC, drive, `//`, `.`, `:`, CON, titik/spasi akhir, kosong, junction keluar akar) -> PATH_OUTSIDE_ROOT; writeOutput pulang-pergi sha256 cocok disk, upsert relPath id sama, readOutputFile verifySha true, id tak ada FILE_NOT_FOUND, berkas hilang FILE_MISSING_ON_DISK; FK gagal -> P2003, berkas baru yatim dibuang, log error; tmp/storage kosong. Baris uji StudioArtifact dihapus (cleanup rows=0).

## Keputusan (untuk register)
1. `docDir`/`artifactDir` mengembalikan path RELATIF akar (pemisah `/`), sesuai `WriteOutputInput.relDir`.
2. `writeOutput` hanya menerima relDir di bawah `docs/`; tulis atomik lewat `<akar>/tmp/storage/<uuid>.tmp` + rename (retry EPERM/EBUSY); `StudioOutputFile` di-upsert per `relPath` (render ulang menimpa; sha beda -> log warn `STORAGE_OUTPUT_REPLACED`). Pelanggaran invarian M08 = TypeError (500, bug pemanggil).
3. Format salah `mission.folder` -> MISSION_REF_NOT_FOUND; issueDate/docNumber/ext/revisionNo salah -> SCHEMA_INVALID.
4. Keberadaan folder misi: `stat` HANYA-BACA `SHARED_WORKSPACE/docs/<folder>` atau `<akar>/docs/<folder>`; bila `SHARED_WORKSPACE` tidak disetel, diterima dengan log warn `MISSION_FOLDER_UNVERIFIED` (akar sandbox). Tidak pernah menulis SHARED_WORKSPACE (KT-03).
5. Nama DATUM: bila >120, JUDUL yang dipotong agar `<nomor> Rev<X>` utuh; awalan `Rev` pada argumen rev tidak digandakan.
6. Log: sink default layanan = console + JSONL `<akar>/logs/storage/` (pola sink default S92), dapat dialihkan `setStorageLogSink`. `createLayoutLogSink({relDir, fileName?})` untuk `setSofficeLogSink`/`setBrowserLogSink` menulis `<relDir>/Log Render.jsonl` di dalam tata letak §7.2, malas (tanpa berkas bila tak dipanggil).
7. Ekspor tambahan untuk S51/S53/S57: `readOutputFile(id,{verifySha})`, `readStoredFile`, `figureDir`, `artifactDir`, `jobTmpDir`, `datumPlainName`, `sha256Hex`, `toOutputFileDto`.

Permintaan lintas pemilik: tidak ada. Temuan: tidak ada. Review direkomendasikan (S85/S87: guard traversal, sajian berkas).
