# Catatan coder-execution SR-31 (Alat developer, W11) — 2026-10-23

Status: complete. Skills: frontend-integration, dry-run-verify-fix. Klaim: `file_claims.md` prefiks SR-31.

Berkas (`src/components/studio/playground/`): tulis ulang `playground.tsx` (gerbang ADMIN `DeveloperTools` + rangkaian), `types.ts`, `api.ts` (tipis di atas `shared/http` `requestJson`; `PlaygroundApiError`/`studioPost`/`useActionGuard` dihapus), `draft.ts` (kunci v2), `hints.ts`, `panels.tsx` (`fileUrl` + `canOpenInline`, rel, Info teknis, respons mentah). Baru: `use-schema-examples.ts`, `use-playground-actions.ts`, `use-draft-autosave.ts`, `examples-v2.ts`, `payload.ts`, `rail-summary.ts`, `controls.tsx`, `asset-panel.tsx`. `src/app/studio/playground/page.tsx` (`studioPageTitle("Alat developer")`). Tetap: `example.ts`, `json-editor.tsx`, `json-locate.ts`.

Isi: mode Kirim dokumen (R04) / Kirim bab (R12) / Kirim bagian (R13) / Unggah aset (R18); contoh E1, E2, Lembar kendali + minimal dari skema registri R03; Validasi R08 (masalah per baris, pemeriksaan standar, kelengkapan sesudah kirim = rel bersama); "Kirim ke Studio" = K-10 `ConfirmDialog`; USER = EmptyState "Halaman ini khusus admin" + [Buka Dokumen]; R15 `STUDIO_SCHEMA_BASE_URL`; R06 `fileUrl`; coba ulang = `useCooldown` bersama.

Angka: `playground.tsx` 1079 baris / 25 useState -> 420 baris / 9 useState (komponen `PlaygroundWorkspace`).

Bukti:
- `npx tsc --noEmit -p tsconfig.json`: area playground 0 galat; repo 100 galat di luar area (section-composer 44, template-editor 50, document-viewer 4, chapters/_shared/submit-kit 1, documents/route 1) = baris lain yang sedang berjalan.
- `npx eslint src/components/studio/playground src/app/studio/playground`: exit 0.
- Skrip scratch `sr31_check.ts` (ajv kontrak, tanpa DB): 22 PASS 0 FAIL (E1/E2/slot lolos SID01-03 sebelum dan sesudah isian panel; target id dokumen tunggal; E1+format -> DISPLAY_FIELD; minimal 3 skema lolos; adaptor rel 6 segmen).
- Asap curl :9021: `/studio/playground` 307 -> `/login?next=%2Fstudio%2Fplayground`; R03 schema 401, R08 401 tanpa sesi.

Keputusan:
1. Mode v1 (chart/diagram/image/html, Render+Simpan v1) dihapus dari alat (D-161: alat ADMIN v2; artefak lewat Galeri).
2. Contoh E1/E2 tanpa `docNumber`/`hermesTaskId` (aman dikirim ulang; HermesTask contoh tidak ada), `docKey` seragam `laporan-survei`, `assetRef` E2 = sha nol (ganti lewat "Pakai di kiriman bab").
3. `classifySchemaV2Errors` tidak dipanggil di klien: validasi skema di server R08/R04 (SR-20) yang memakainya; klien hanya menampilkan isu (tanpa ajv di bundel).
4. Adaptor lokal `rail-summary.ts`: kontrak `chapters.<slotKey>` -> rel bersama bertipe lokal `content` (TODO(SR-04) di `shared/completeness-rail.tsx`, milik FIX-4a/4b).
5. Unggah aset tanpa K-10 (idempoten, tidak membuat versi dokumen).

Temuan: R12/R13 belum dapat dipakai sampai `services/submit` (SR-13) mendarat (tsc `submit-kit.ts` TS2307). Uji browser ADMIN tidak dijalankan (tanpa kredensial; tanpa tulis DB) -> SR-52 E2E.
Permintaan lintas pemilik: FIX-4b — rel bersama menerima `CompletenessSummary` kontrak (lalu hapus `rail-summary.ts`); `shared/http.issuesOf` membaca `pointer` selain `path`.
