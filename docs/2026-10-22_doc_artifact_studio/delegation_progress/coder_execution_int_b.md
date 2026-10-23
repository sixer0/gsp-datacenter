# INT-B coder-execution: integrasi engine/docx (IP-03, IP-20, IP-15, IP-13 + D-79/D-91/D-93/D-98), 2026-10-23

Status: complete (penjaga lulus; kalibrasi nyata = garis dasar, vonis milik S98).

Berkas (area INT-B): `engine/docx/package/xml.ts`, `tables/ooxml.ts`, `figures/{derivation,figure}.ts`, `wrapper/{pages,render,xml,index}.ts`, `assemble/{index,media}.ts`, `blocks/structure.ts`, `fonts/{relabel.ts (baru),plan,catalog,index}.ts`, `src/lib/studio/assets/fonts/renamed/` (8 TTF), `benchmark/manual000/template.json`.

Pekerjaan:
- IP-15: `package/xml.ts` = satu sumber (ragam `XmlFlavor`: PACKAGE vs BODY); `tables/ooxml.ts` jadi pengikat tipis tanpa logika. Bukti: DOCX benchmark sebelum/sesudah sha256 identik (313ac5d0...), diff -rq isi ZIP kosong.
- IP-13: md-lite pembungkus memakai `parseMdLite` S16 (`blocks/runs`); `spineXml` = tabel mengambang 1x1 di margin luar, `textDirection tbRl`, bila `device.spine.rotationDeg`=90 (0 = paragraf mendatar BM); template: `device.spine.placements` = ["margin luar sampul"]. Uji 90 derajat: sampul PDF menampilkan string punggung vertikal di margin kanan.
- IP-03: semua media `fig-<sha32>.<ext>` + `rIdFig<sha32>` (0 relasi media numerik); `signatureBlock` F:signature dilewati bila lembar kendali memuatnya (log SIGNATURE_IN_CONTROL_SHEET; fixture terbit_report: 3 peran, sekali); pemegang sectPr sudah sesuai C10 (pola 29 seksi identik BM, tanpa perubahan); C10 Datum Rule bab: aset `rule128` tidak ada -> dibangkitkan dengan pembangkit S18 (bukan border) -> figur 35 -> 52.
- IP-20: `fonts/relabel.ts` tabel terkunci 8 wajah (Serif/Mono/Sans Cond/Sans x bold/boldItalic) dari set `same` S99 (keluarga persis, Bold 700, PostScript *-SemiBold), sha256 = bundle_manifest; dipakai hanya untuk `boldFace: "semibold"`, dikeluarkan dari pemilihan biasa (kanonik tetap SemiBold asli). DOCX benchmark: odttf bold terde-obfuskasi = d1ead554 / 9584940b / 37d92084 (berlabel).
- D-79/D-91/D-98: turunan verbatim lewat `isVerbatimReproduction` (`engine/bind`), tata letak C8; tanpa penanda -> tetap BY_CONSTRUCTION_FAILED (diuji). Pembuka lampiran menerima isi tanpa `sections` (bentuk normalisasi).
- D-93: template `lint.enforcementOverride` {DATUM-09, DATUM-04, G3: release}.
- Tambahan: keyRow berbentuk runs ditulis verbatim (C1) -> hilangkan "KUNCI KUNCI" (hlm 9, 12); katalog fon menolak non-sfnt (`fonts/PASANG-DULU.txt` membuat `--with-canonical-assets` crash).

Penjaga:
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/docx` -> 0 baris (total repo 2, `src/app/api/user-access/*`, bukan area ini).
- `npx eslint src/lib/studio/engine/docx` -> exit 0.
- template.json: checkOverrideRights ADMIN 0 isu, resolveParams 0 galat, dropped/ignored 0; USER 5 isu K (terkunci).
- Determinisme: dua render DOCX benchmark sha256 sama (f697804e...). 4 fixture doc kanonik SUCCEEDED.

Kalibrasi (render_cli + loadResolvedProfileFile, soffice profil sementara, bm_compare VENV): BM1 100,0 % (4544/4544) | BM2 PASS (102 hlm, 17 bab, 4 lampiran, 151 tabel, 52 figur) | BM3 101/102 (hlm 18 = F-033) | BM4 SSIM rata 0,9809, min 0,698 (hlm 26, 40, 87 < 0,95). Garis dasar awal sesi (setelah D-79): BM2 FAIL figur 35/52, BM3 99/102, BM4 0,959. Figur dari raster indeks aset S94 (`figures/index.json`).

Keputusan/deviasi: set `fonts/renamed` S99 berlabel "S99 <keluarga>" (tidak cocok DOCX) -> dipakai set `same` (aturan D-74), disalin ke folder yang diklaim `assets/fonts/renamed/`; sha256 dikunci di kode, manifest S13 tidak disunting. `pPrInner`/`rPrXml` tidak perlu diekspor ulang. Urutan unescape `facesInXml` diperbaiki (&amp; terakhir).
Temuan: F-033 tetap (kandidat rFonts DejaVu pada U+2502, menyimpang dari runs verbatim); lisensi OFL RFN "Plex" pada wajah berlabel (internal saja); `wrapper/xml.ts`/`blocks/props.ts` masih punya serializer sendiri (di luar IP-15). Permintaan lintas pemilik: tidak ada. Review direkomendasikan: `src/lib/studio/engine/docx/**`.
