# S59 coder-execution: UI penyusun section

Status: complete (penjaga lolos; uji E2E browser milik S80).

Berkas (area eksklusif S59, 12):
- `src/app/studio/templates/[id]/sections/page.tsx` (halaman server, boundary + Suspense)
- `src/components/studio/section-composer/`: `index.ts`, `section-composer.tsx` (induk: muat, tier, cari, simpan), `section-list.tsx` (grup 29/7/15, status W/O/T, seret-lepas + tombol naik/turun + Alt+Panah, live region), `section-detail.tsx` (unsur, status lintas tier, preset, parameter terkait + tautan S58), `preview-pane.tsx` (POST validate `?preview=html`, iframe `sandbox=""`), `save-dialog.tsx` (catatan wajib, ringkasan perubahan), `model.ts` (murni: draf/rencana, kunci, urutan, rujukan parameter), `skeleton.ts` (kerangka `studio.doc/v1`), `api.ts`, `use-cooldown-retry.ts` (3/6/12 d, maks 3), `error-boundary.tsx`.

Bukti:
- `npx tsc --noEmit -p tsconfig.json | grep -E "src/(app/studio/templates/\[id\]/sections|components/studio/section-composer)"` -> kosong (grep exit 1). Total 25 galat repo di luar area (6 berkas pra-ada 21 + `engine/chart/family-k1/common.ts` 4).
- `npx eslint "src/app/studio/templates/[id]/sections" src/components/studio/section-composer` -> exit 0.
- Handler route nyata via tsx (DB v21, x-internal-secret): sections 200 count 51; params 200; templates 200 (1 kanonik v1); detail 200; 404 TEMPLATE_NOT_FOUND; simpan tanpa catatan 400 CHANGE_NOTE_REQUIRED; plan salah 400 SCHEMA_INVALID berpointer; simpan sebagai INTERNAL_AGENT ke kanonik 403 PARAM_CLASS_K_FORBIDDEN (tanpa tulis DB).
- Kerangka -> POST validate preview: NOTA/TERBIT/SERAH kanonik `valid:true`, previewHtml 2,44-2,46 MB, 0 `<script`; draf TERBIT diubah (list dipindah, aside terlarang, table wajib) `valid:true`.
- Logika (12 PASS): cermin wajib == `CANONICAL_REQUIRED_BY_TIER`; pulang-pergi rencana kanonik identik; `validateSectionPlan` layanan 0 isu untuk rencana hasil UI; kehilangan urutan lintas status terdeteksi.

Keputusan:
1. Urutan disimpan sebagai urutan anggota tiap larik SectionPlan (kontrak tanpa medan urutan); muat = merge berpemutus indeks registri; UI memperingatkan bila selang-seling lintas status tidak tersimpan.
2. Wajib registri per tier = cermin `CANONICAL_REQUIRED_BY_TIER` (profile.ts tidak aman-klien); forbidden dinonaktifkan; opsional boleh dengan peringatan. Tak aktif di tier / tak renderable dikunci terlarang.
3. Simpan = POST R02 dengan `overrides` versi terbaru apa adanya (lapisan penuh), `baseVersionNo` = latestVersionNo; tombol simpan nonaktif untuk profil kanonik bila sesi bukan ADMINISTRATOR.
4. Pratinjau memakai format versi tersimpan + susunan draf; figur jadi paragraf penanda; perangkat halaman lewat mode kepala/kaki + device datumRule.
5. Tautan parameter: `/studio/templates/{id}?version=n&paramFilter=<rujukan,...>`.

Permintaan (file_requests.md, tidak blocking): medan `order` SectionPlan; ekspor wajib-per-tier di registri; S58 membaca `paramFilter`.
Temuan: (a) HQ belum punya endpoint log galat klien (sama dengan S58/S60/S61; kini konsol JSON berkolom); (b) INFO: `resolvedParams["doc.typeCode"]` dari GET templat kanonik memuat STD, tetapi ingest P3-20 menolak STD (daftar KT..DS) -> kerangka memakai butir pertama; penyebab belum didiagnosis (hipotesis: beda resolusi GET vs `resolveTemplate`).
