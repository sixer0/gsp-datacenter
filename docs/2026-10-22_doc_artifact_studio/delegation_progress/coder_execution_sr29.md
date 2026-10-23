---
row: SR-29
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-29 UI editor templat (UX-01 W2/W3)

- Berkas tulis ulang `src/components/studio/template-editor/`: `api.ts` (shared/http; R01/R02 v2, R03 presets/essentials/params/roles, R19), `template-list.tsx` (W2: tab Templat/Gaya ADMIN, cari, menu admin Impor profil), `template-editor.tsx` (W3: langkah Gaya/Pengaturan/Simpan `?langkah=`, mode gaya ADMIN, K-1, K-6 beforeunload + tautan keluar, draf localStorage), `version-history.tsx` (awam; rincian kunci di Info teknis), `shared.tsx` (dipangkas: inputCls + ClassBadge), `index.ts`. Baru: `model.ts`, `template-draft.ts`, `template-stepper.tsx`, `save-version.tsx`, `create-template-dialog.tsx`, `style-picker.tsx` (gambar mini halaman dari nilai gaya), `essential-knob.tsx`, `advanced-panel.tsx`, `param-ref.ts`. `param-editor.tsx` hanya ganti impor ke `./param-ref` (lepas dari section-composer).
- `template-preview/`: `api.ts` ke shared/http (PreviewApiError lokal dihapus, alias tipe), `index.tsx` menerima `essentials`/`advanced`, label awam (Tingkat terbitan, tanpa kunci/kode/lint di permukaan; itu di Info teknis), coba ulang lewat ErrorView 3/6/12 s, `text-neutral-500` dihapus.
- Halaman: `templates/page.tsx`, `[id]/page.tsx` (+`langkah`, bawaan Pengaturan), `[id]/versions/page.tsx`: `studioPageTitle`, tanpa bungkus `p-6 max-w-*` (R16).
- Komponen bersama untuk SR-28 (sudah dipakai `section-composer.tsx`): `TemplateStepper`, `SaveVersion`, `template-draft` (slot draf ikut simpan gabungan R02, D-163 T-2), `model.ts` (`definitionOf(detail, skeleton, essentialKeys, isAdmin)`, `toTemplateV2`, `editabilityOf`). Mohon API ini dianggap stabil.

## Keputusan (untuk dicatat controller)
- Simpan = SATU R02 POST `studio.template/v2` (preset + esensial + kerangka; lanjutan/roleFormats hanya ADMIN dan hanya bila dimuat — mengirim `{}` akan menghapus lanjutan).
- Hak ubah UI: ADMIN semua; USER hanya templat miliknya (`createdBy` = `user:<nama>`), bukan kanonik/gaya/terbatas; lainnya baca saja + "Buat salinan".
- Dialog Buat templat TANPA "Tingkat terbitan bawaan" (W2): tidak ada kenop esensial untuknya; tingkat dipilih per dokumen (D-153). Slug = nama + 4 karakter acak (hanya di Info teknis).
- Kolom W2 "dipakai N dokumen" dan "n bagian · A4 tegak" tidak ditampilkan (T-5; R01 tanpa agregat).
- Ponsel: pratinjau ditumpuk di bawah kenop (bukan lembar bawah) agar pratinjau tidak dimuat dua kali.

## Bukti (D-133)
- `npx tsc --noEmit -p tsconfig.json`: 5 galat seluruh repo, 0 di area. Di luar area: `benchmark/harness/run/lib/pipeline.ts` (1), `src/components/studio/document-viewer/index.ts` (4, SR-30 berjalan).
- `npx eslint src/components/studio/template-editor src/components/studio/template-preview src/app/studio/templates/page.tsx "src/app/studio/templates/[id]/page.tsx" "src/app/studio/templates/[id]/versions/page.tsx"`: exit 0.
- Asap :9021: `/studio/templates`, `/studio/templates/datum-gsp`, `/versions`, `?langkah=gaya` -> 307 `/login?next=...`; API R01/R02/R03 essentials+presets/R19/validate tanpa sesi -> 401 `{"error":"Unauthorized"}` (route ada). Bentuk respons diketik dari kode route SR-27/SR-61 (tanpa sesi uji).
- Grep glosarium (string tampilan, di luar komentar): 0 kata terlarang di permukaan utama; sisa hit = URL/id/identifier dan isi `InfoTeknis` ("Sidik parameter", ringkasan pemeriksaan standar).
- Grep A16 `class \w+Error extends Error|fetch(` di area: 0.

## Sisa / permintaan
- E2E berperan (A3/A4/A14) di fase uji akhir; uji unit `model.ts` (murni) disarankan untuk SR-4x.
