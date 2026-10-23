---
row: SR-28
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-28 Susunan dokumen (UI `section-composer` tulis ulang, UX-01 W4)

- Berkas (area SR-28): `section-composer/{index.ts, api.ts, model.ts, section-composer.tsx, section-card.tsx, knob-control.tsx, advanced-panel.tsx, add-section-dialog.tsx, structure-check.tsx}` (tulis ulang/baru); DIHAPUS bersama tulis ulang: `error-boundary.tsx` (diganti boundary segmen FIX-4a `templates/[id]/error.tsx`), `preview-pane.tsx`, `save-dialog.tsx`, `section-detail.tsx`, `section-list.tsx`, `skeleton.ts` (setup per bab, RT-01 baris 120 tertutup), `use-cooldown-retry.ts`; `app/studio/templates/[id]/sections/page.tsx` (`studioPageTitle("Susunan dokumen")`, tanpa boundary/padding ganda). Cadangan berkas lama: `C:/Users/TRIAL/AppData/Local/Temp/claude/sr28_old/`.
- Isi: kartu bagian nama awam + cara pengisian + "Dipakai di"; urut lewat seret HTML5 (mati pada `pointer: coarse`), Alt+Panah, menu Naikkan/Turunkan; bagian Posisi tetap tidak dapat dipindah + pesan inline ("Sampul selalu di awal...") + `announce`; sakelar Wajib (K-3 bila bagian wajib di versi dasar dijadikan opsional); ≤ 8 pengaturan jenis bagian dari R03 `kind=essentials` (pemetaan langsung/petaNilai/turunan/anggota/medan; nilai = nilai efektif templat dihapus = ikut gaya; "Kembalikan ke bawaan gaya"; kelas K terkunci non-ADMIN); Pengaturan lanjutan terlipat HANYA ADMIN (posisi tetap, cara pengisian, tingkat terbitan, min/maks bab, kunci rinci dari R03 `paramScopes`); tambah bagian (dialog jenis C33 + deskripsi, jenis yang sudah ada dinonaktifkan) dan hapus (K-2); pemeriksaan susunan = aturan register §4.7 di browser + R08 `studio.skeleton/v1` (jeda 900 ms), tautan ke kartu; langkah 4 memakai `SaveVersion` + `TemplateStepper` + `template-draft` SR-29 (dipakai, tidak disalin); K-6 di remah roti + `beforeunload`; baca saja via `editabilityOf` SR-29; Info teknis ADMIN.
- Simpan: SATU R02 POST `studio.template/v2` gabungan (D-163 T-2) — `definitionOf` + draf langkah Gaya/Pengaturan + `slots` layar -> `toTemplateV2`; tidak memakai R19 POST. R19 GET via `template-editor/api.getSkeleton` (404 diredam -> cadangan `definition.skeleton`).
- Gerbang: `npx tsc --noEmit -p tsconfig.json` -> 20 galat, 0 di area SR-28 (lain: template-editor/version-history 9, document-viewer 6, validate/route 2, templates/[id]/page 1, ingest/index 1, benchmark pipeline 1 — baris paralel). `npx eslint src/components/studio/section-composer src/app/studio/templates/[id]/sections/page.tsx` exit 0, 0 masalah.
- Asap: curl :9021 `/studio/templates/datum-gsp/sections` dan `/x/sections` -> 307 `/login?next=...` (tanpa sesi; tidak login, tidak menulis DB). Logika murni `model.ts` (tsx, tanpa DB): 20 PASS / 0 FAIL (kunci posisi, sisip sebelum Lampiran, anggota/medan/langsung tulis-baca-reset, ringkasan awam, aturan susunan, pointer isu).
- Glosarium: skrip heuristik string/JSX teks (di luar `${}`) atas 18 kata terlarang §1.2 -> `HITS 0` (dua sumber log `.slot-kinds` diganti `.section-kinds`).
- Integrasi: R19 (SR-26) dan R02 v2 (SR-61) belum dapat di-curl dengan sesi; klien diketik dari route/register dan klien SR-29. Uji UI dengan sesi = fase akhir (SR-52 A5).

## Keputusan untuk controller
1. Simpan lewat R02 gabungan (T-2), bukan R19 POST; draf bersama `studio.templateDraft.v1.<id>` dipakai lintas langkah, sehingga pindah langkah dalam editor tidak memicu K-6 (draf terbawa); K-6 hanya saat keluar editor (remah "Templat") dan tutup/muat ulang tab.
2. Kenop `medan` (`slot.setup.startOnNewPage`/`runningHead`) tanpa nilai = aktif (`engine/docx/package/section.ts:47`); "Kembalikan" menghapus medan.
3. K-3 dipicu bila bagian WAJIB di versi yang dimuat dijadikan opsional (preset gaya tidak diketahui dari R19).
4. Tambah bagian: setiap jenis C33 paling banyak satu kali di susunan (kunci bagian unik), disisip sebelum blok Posisi tetap di akhir.
5. `knob-control.tsx` sendiri dipertahankan (EssentialKnobRow SR-29 belum mendukung `multiple`/`available`) -> permintaan ke SR-29.

## Permintaan
- SR-29: dukung `multiple` + `available` di `EssentialKnobRow` (penyatuan); perlakukan `draft.slots` sebagai pengganti utuh `skeleton.slots` saat simpan langkah 4 (file_requests.md, 3 baris SR-28).
