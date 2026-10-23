# S07 coder-execution: params/apparatus.ts

Status: complete (penjaga lulus; tanpa uji, sesuai D-07/D-08).

Berkas: `src/lib/studio/params/apparatus.ts` (diisi dari stub S03; ekspor `PARAMS_APPARATUS`, `PARAMS_APPARATUS_COUNT = 111` tetap).

Angka: 111 = P5 68 + P6 43; id urut P5-01..68 dan P6-01..43 sama dengan katalog; 111 id dan 111 key unik; kelas B 11, K 91, T 9 (semua T punya `derive`); 0 default null; seluruh default enum anggota `enum`.

Penjaga (perintah, keluaran):
- tsx hitung: `length 111 COUNT 111 P5 68 P6 43`.
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/params` -> kosong (grep exit 1); total galat repo 21, semuanya pra-ada di luar area.
- `npx eslint src/lib/studio/params/apparatus.ts` -> exit 0, tanpa keluaran.

Keputusan:
- D-31 / K-07 / KT-09: P5-08 `table.zebra.colour` default `zebra15` (bukan ink100); conflictRef K-07.
- T042: glif ■ ◈ ◇ △ (P5-30/32/34/36) conflictRef K-18, catatan fon DejaVu Sans (R-14). Warna P5-31/33/35/37 = ink900, signal, ink400, alert, `rek: true`; P5-37 conflictRef K-19.
- K-14: P6-04 `classification.codeInDocNumber` enum SR/R/T/B default "T", conflictRef K-14, kelas sebagai medan terpisah.
- K-29: P6-43 conflictRef K-29, tiers TERBIT+SERAH. P5-46/47/67/68 tiers SERAH.

Temuan / pilihan pelaksana (tidak memblokir):
- P5-54/55 (Admiralty A-F, 1-6): katalog bertipe enum dengan default "A-F"/"1-6" (bukan anggota enum); disimpan type `list` berisi skala, `enum` = anggota.
- P5-04 default "decimal" (manual: rata kanan dan desimal; enum right/decimal). P5-14 default 128 (kolom teks; 166 = rentang penuh, mengikuti railMode).
- P6-21 default 10 (batas bawah pita 10-15 %; manual tidak menyebut nilai tunggal). P6-25 `vat.dppFactor` string "11/12" (consumer derive `vatEffective` harus mem-parse pecahan; P6-26 default 11).
- P6-06 doubleEnvelope dan P6-07 numberedCopyControl bool true berlaku untuk level SR/R saja (catatan di classNote).
- Pola regex P5-48/63/65 diturunkan dari contoh (D-6.1, ASM-PWR-01); P5-61 default "konservatif" (daftar terbuka).

Permintaan lintas pemilik: tidak ada. File requests: tidak ada.
