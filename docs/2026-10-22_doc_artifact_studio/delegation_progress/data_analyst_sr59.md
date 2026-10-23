# SR-59 — Desain permukaan parameter (data-analyst)

Status: complete (docs only; tidak ada perubahan kode). Tanggal: 2026-10-23.

## Berkas ditulis (area eksklusif)
- `research/09_param_surface_design.md` (NEW)
- `delegation_progress/data_analyst_sr59.md` (catatan ini)
- `file_claims.md` TIDAK ditulis (klaim di-append controller).

## Masukan dibaca
- Blueprint 05: baris SR-59 (:723), §0, §2.3.
- research/08 (SR-02).
- D-139, D-140, D-147, D-151, D-156, D-158, D-162.
- `src/lib/studio/params/*` (7 berkas).
- `engine/tokens/{grid,index,merge}.ts`, `services/templates/profile.ts`.
- `benchmark/manual000/template.json`, `prisma/seed-studio.ts`.
- UX spec W3.
- Grep pembaca kunci di `src/lib/studio/engine`.
- SR-01 (`masterplan/03_structural_sections_specs.md`) belum ada saat analisis. Nama kunci baru sementara (KT-13).

## Hasil
- Lapis: 722 lama + 17 baru = 739.
  - E 21 / L 317 / T 72 (44 T-hitung + 28 T-acuan) / I 329.
  - Sebelum: 722 datar; T 36.
- Kenop esensial: 28.
  - Global 8, Sampul 7, Lembar kendali 1, Tanda tangan 1, Daftar isi 2, Konten 5, Referensi 1, Lampiran 3.
  - 21 dari 36 usulan blueprint gugur (AS-8).
- Ada 11 DeriveFnId baru. Bug 247 dibalik: margin bawah = masukan, blok = H − atas − bawah.
- Preset: 45 dari 87 override Manual 000 = bawaan/turunan. Sisa 42 = 15 L + 14 sematan TA + 10 I + 2 kenop E + `table.widthClass` full.
- Penjaga sha: sha penuh pasti berubah (kunci baru). Bukti SR-36 memakai sha terproyeksi ke kunci lama, dengan Δ = {P4S-13} untuk GSP/M000.

## Keputusan terbuka
KT-1..KT-15 di §14 research/09. Yang paling mendesak:
- KT-5: baseline sha sebelum/sesudah impor template.json.
- KT-6: perluasan enum P4S-13.
- KT-4: semantik T-acuan.
- KT-10: medan `slot.setup`.
