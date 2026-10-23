# S05 coder-execution: params/color-type.ts

Status: complete (penjaga lolos). Berkas: `src/lib/studio/params/color-type.ts` (satu-satunya yang ditulis) + catatan ini.

Angka (tsx, impor langsung): count 134 = target 134; P4C 35, P4T 99 (dasar 18 + skala 67 + prosa 14); id unik 134, key unik 134; hex semua `^[0-9A-F]{6}$` tanpa "#"; origin semua "catalog".
Penjaga: `tsc --noEmit | grep studio/params/color-type` kosong; `npx eslint src/lib/studio/params/color-type.ts` exit 0.

Nilai [REK]: P4C-10..16, 27..29 (dan semua kolom warna skala) sudah sama dengan research/04 T031/T033; `rek: true`. Caption = ink700 (K-08); kepala halaman weight 400 (K-05).

Keputusan (butuh dicatat controller):
1. K-07: hitungan wajib tetap 134, jadi token `color.interior.zebra15` TIDAK dibuat sebagai ParamDef ke-135. `color.role.zebra` (P4C-30) default tokenRef "zebra15"; ink100 (P4C-13) dipertahankan untuk pita workbook. Nilai hex zebra15 belum ada: S11 (mesin token) harus menurunkannya; hipotesis D9D9D9 (rona 15 % ink900 di atas FCFCFB), diberi label hipotesis di classNote.
2. K-31: P4T-07 `type.role.reading.weights` bertipe map `{weights:[400,600], styles:["italic"]}` (menjaga 18); P4T-06/08/09 list int.
3. P4T-X06 default "condensed 400" (G-01, KT-10); P4T-X08 gapRef G-01.
4. Wrapper P4C-01..07 diberi `tiers: [TERBIT, SERAH]` (turunan dari "sampul dilepas di NOTA", katalog §5; berlabel DITURUNKAN di sumber).
5. Wajah condensed `IBM Plex Sans Condensed`; render.ts R-08 masih memakai 'IBM Plex Sans Cond' (milik S03, baris profil S95 yang menimpa).

Temuan untuk pemilik lain: P5-08 `table.zebra.colour` (S07) default katalog ink100; selaras K-07 sebaiknya "zebra15". Tidak ada permintaan blocking; tidak ada galat tsc di area lain yang disentuh.
