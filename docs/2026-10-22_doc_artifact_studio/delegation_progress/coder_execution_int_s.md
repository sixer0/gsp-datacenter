# INT-S coder-execution: relabel fon berbasis nama keluarga (F-049, D-104), 2026-10-23

Status: complete.

Berkas: `src/lib/studio/engine/docx/fonts/{relabel,plan,index}.ts`; baru `src/lib/studio/assets/fonts/renamed/IBMPlexSansCond-{Regular,Italic}.ttf` (byte-identik `render-env/semibold-bundle/fonts/same/`, cmp OK, sha cc28ffc6.../125399c2...); `src/lib/studio/assets/manifest.json` (+10 entri `fonts/renamed/*` kind font + licenseFile LICENSE-IBM-Plex, appliesTo lisensi Plex 16->26, count 29->39; prefiks lama round-trip byte-identik); uji baru `tests/unit/studio/docx-fonts-family.test.ts`.

Pekerjaan:
- Tabel name (fontTools VENV, 17 wajah `same` + 19 kanonik): hanya Sans Cond regular/italic kanonik bernama keluarga beda ("IBM Plex Sans Condensed" != "IBM Plex Sans Cond"). Serif/Mono/Sans/Inter/DejaVu regular/italic: nama sudah cocok -> berkas kanonik tetap, tidak disalin.
- `RelabelSlot` = 4 slot; `RELABEL_FACES` +2 (Sans Cond regular/italic, sha + sourceSha dikunci = bundle_manifest S99 faces 8-9). `relabelWeight/relabelItalic`: bobot/gaya wajib per slot (bold 700, lain 400).
- `plan.ts` `chooseAuto`: `semibold` + slot tebal -> wajah berlabel dulu (IP-20 tetap); selain itu `pickFace`, dan bila nameID 1/16 berkas != keluarga diminta -> wajah berlabel bila ada. `files` eksplisit tidak diubah. `relabelSemibold:false` mematikan semua relabel.

Uji (vitest, seam `planEmbeddedFontsDetailed`, 4 profil: kanonik, benchmark, masing-masing +/- aset kanonik):
- SEBELUM perbaikan GAGAL 2/3: kanonik 10 wajah salah nama (mis. "IBM Plex Sans Cond/regular -> IBMPlexSansCond-Regular.ttf [IBM Plex Sans Condensed]", "IBM Plex Serif/bold -> IBMPlexSerif-SemiBold.ttf [IBM Plex Serif SemiBold]"); benchmark regular sha d3057856... != cc28ffc6.... Keluaran: `Temp/hq_v21_clone/ints/red_before_fix.txt`.
- SESUDAH: `npx vitest run tests/unit/studio/` -> 3/3 passed.

Penjaga: `npx tsc --noEmit -p tsconfig.json` -> 0 baris (repo penuh; grep area kosong). `npx eslint src/lib/studio/engine/docx/fonts tests/unit/studio/docx-fonts-family.test.ts` -> exit 0.

Benchmark (render_cli + template.json -> DOCX sha 6515797f... (2 render identik) -> soffice 1 instans, profil `ints/prof`, 9 s -> bm_compare VENV): BM1 PASS 100,0 % (4544/4544) | BM2 PASS (102 hlm, 17 bab, 4 lampiran, 151 tabel, 52 figur) | BM3 PASS 101/102 (hlm 18 = F-033) | BM4 PASS SSIM rata 0,999193, min 0,982436 (hlm 1). Hlm < 0,95: tidak ada; < 0,98: tidak ada (102/102 >= 0,98). Hlm 26/40/87 = 0,99995/0,99987/0,99995. Hitung fon PDF Sans Cond = acuan persis (Regular 27.890, SemiBold 14.306). fontTable: 14 wajah, semua nameID1 = nama `w:font`.
Fixture kanonik (render_cli default docx,pdf,html): memo, tables, serah_handover, terbit_report -> SUCCEEDED. HTML memo sha 53bedc64... identik sebelum/sesudah perubahan manifest.

Keputusan untuk dicatat controller:
- KEPUTUSAN-1 (perubahan perilaku profil KANONIK): aturan nama keluarga berlaku juga untuk slot bold kebijakan `canonical`. Fixture kanonik kini menanam SemiBold berlabel Bold (d1ead554 dst.) untuk Serif/Mono/Sans bold, bukan berkas "X SemiBold" yang namanya tak pernah cocok (sebelumnya LO memakai Bold terpasang). Teks tebal kanonik jadi SemiBold (sesuai classNote R-08 "slot Bold = wajah SemiBold"). Bila tidak dikehendaki: batasi koreksi ke slot regular/italic (1 baris di `chooseAuto`).
- sha256 DOCX benchmark berubah f697804e... -> 6515797f... (word/fonts/*, sesuai D-104 untuk INT-Q).
- Manifest: entri berlabel ber-kind "font"; konsumen docx mengecualikan `fonts/renamed/`, HTML memilih kanonik (rank/kunci) -> HTML tidak berubah (dibuktikan sha).
Temuan: F-034 berlaku juga untuk 2 wajah baru (Modified Version RFN "Plex", internal). Permintaan lintas pemilik: tidak ada. Review direkomendasikan: `engine/docx/fonts/**`.
