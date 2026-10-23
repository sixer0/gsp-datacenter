# S62 coder-execution: UI galeri artefak

- Status: complete (penjaga lolos; uji integrasi terhadap HQ hidup ditunda ke S80 alur G: tidak ada HQ v2.1 yang berjalan; 9010 = hermes dashboard, 9011 milik S80).
- Skills: frontend-integration, dry-run-verify-fix.
- Berkas (12, semua baru): `src/app/studio/artifacts/{page,loading,error}.tsx`; `src/components/studio/artifact-gallery/{index,api,labels,spec-templates,validate}.ts`, `{preview,gallery,catalog,create-panel,artifact-studio}.tsx`.
- Halaman `/studio/artifacts`, 3 tab di URL (`?tab=galeri|katalog|buat`):
  - Galeri: filter jenis/misi (ke R09) + kode chart (klien), paging `nextCursor`, kartu pratinjau SVG/PNG sebagai `<img>` dari R10 `?inline=1`, HTML di `<iframe sandbox="">` tanpa allow-scripts, dialog detail (`<dialog>` modal), unduh `?download=1`.
  - Katalog dari R03: 58 chart tergambar per kelompok P/H/K/W/S/G (fungsi, pakai, hindari, bentuk data + medan), 18 drawn=false bertanda + tautan alternatif, 9 keluarga diagram, 41 simbol per dialek; tombol "Pakai" membuka tab Buat.
  - Buat: pilih jenis (chart per kode, diagram per keluarga, gambar + unggah PNG/JPEG dengan sha256/ukuran px diisi otomatis, HTML + slug dari R01) -> textarea JSON berisi templat -> validasi klien ringan (JSON, `$schema`, `required`/`additionalProperties` dari skema R03, aturan §3.5-3.8, Mermaid DATUM-31, drawn=false + alternatif) -> POST R09 (JSON atau multipart `request`+`file`) -> status job, galat render, pratinjau, berkas.
- Galat: lapis S60 (`StudioApiError`, `reportClientError` JSON berkolom tetap, `LoadError` coba ulang 3/6/12 dtk maks 3); POST: pesan awam per kode + `details` pointer/checkId + alternatif; coba ulang POST berbatas dengan hitung mundur; `error.tsx` batas galat segmen.
- Bentuk respons diketik dari kode S57 yang sudah mendarat: GET `{ artifacts: (ArtifactSummary & { outputs })[], nextCursor }`, POST 201 `{ artifact, outputs, job, errors, lint? }` (render sinkron), R10 `inline=1`/`download=1`; R03 `{ kind, count, items, meta }`.

## Bukti
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/(app/studio/artifacts|components/studio/artifact-gallery)"` -> kosong (exit 1).
- `npx eslint src/app/studio/artifacts src/components/studio/artifact-gallery` -> exit 0 tanpa keluaran.
- Skrip tsx sementara (ajv 2020 + `STUDIO_SCHEMA_LOAD_ORDER` + `STUDIO_AJV_OPTIONS`): `templates=67 schemaFail=0 clientFail=0` (58 chart tergambar + 9 keluarga diagram); templat image dan html lolos skema; kasus negatif tertangkap (DF-01 -> alternatif P-01, JSON rusak berposisi, Mermaid).
- Registri (tsx): CHART_REGISTRY 76 (drawn 58: P15 H9 K12 W10 S8 G4; 18 DF), SYMBOL_IDS 41 (iec 16, isa 12, mil 6, sec 7).

## Permintaan lintas pemilik
- `file_requests.md`: S57 `artifacts/_lib/dto.ts` tambah `chartCode` pada butir daftar (blocking: tidak). Sampai ada, filter kode chart tidak mencocokkan apa pun dan UI memberi tahu.

## Temuan
- Repo belum punya endpoint log galat klien; log klien = konsol JSON berkolom tetap (sama dengan S60; F-031/D-71 menjadwalkan `/api/studio/client-log`).
- Tidak menyentuh berkas di luar area; mengimpor read-only `document-viewer/{api,feedback,labels}` (S60) dan `ui/kit`.
