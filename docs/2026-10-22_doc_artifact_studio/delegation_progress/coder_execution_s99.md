# S99 coder-execution: bundel fon SemiBold (F-001), 2026-10-23

Status: complete (perbaikan nyata pada visual; target 102/102 teks TIDAK tercapai, sisa 1 hlm bukan F-001).

Berkas (semua NEW, area `render-env/semibold-bundle/**`): `build_bundle.py`, `bundle_tools.py`, `calibrate_bundle.mjs`,
`README.md`, `bundle_manifest.json`, `fonts/{same,renamed,graft,symfix}/*.ttf` (69 wajah, fontTools 4.63.0), `out/*.json` (9), `out/docx-embed.pdf`.

| Kandidat | Teks identik | SSIM rata / min | Hlm >= 0,98 | Fon tebal PDF |
|---|---|---|---|---|
| baseline B (ulang) | 101/102 | 0,9815 / 0,5341 | 88 | *-Bold |
| (a) profile-fonts `user/fonts` | 101/102 | 0,9815 / 0,5341 | 88 | *-Bold (diabaikan) |
| (a') `-env:BRAND_BASE_DIR` bayangan (2 varian) | - | - | - | soffice macet, timeout 400 s + tree-kill |
| **(c) docx-embed** | 101/102 | **0,9999 / 0,9965** | **102** | *-SemiBold |
| rename-embed | 101/102 | 0,9999 / 0,9965 | 102 | *-SemiBold |
| graft (glif fallback ke Plex Serif) | 99/102 | 1,0000 / 0,9992 | 102 | *-SemiBold |
| symfix (OpenSymbol tertanam) / `--ui-sans` xcu profil | 101/102 | 0,9999 / 0,9965 | 102 | tanpa efek |

Temuan:
1. Akar F-001 terkonfirmasi lebih tajam: fon tertanam BM.docx (slot embedBold) bernama keluarga `IBM Plex Serif SemiBold` dll.,
   jadi tidak pernah cocok dengan permintaan `IBM Plex Serif` tebal. Wajah tertanam berlabel keluarga persis + gaya Bold
   (bobot 700) MENANG atas Bold per-user terpasang (fon tertanam diaktifkan privat per proses oleh LO).
2. (b) Tidak ada opsi konfigurasi LO yang memaksa prioritas fon tertanam; prioritas sudah berlaku bila nama keluarga cocok.
3. Sisa hlm 18 (temuan baru, MINOR): 3 glif U+2502 di run Plex Serif jatuh ke OpenSymbol (0,36 em) di Windows, acuan
   memakai DejaVu Sans (0,60 em); urutan ekstraksi teks berbeda. Tiga upaya perbaikan (graft, symfix, ui-sans) gagal; batas 3 siklus.
4. INFO lisensi (hipotesis, belum dicek ke OFL.txt lokal): IBM Plex OFL 1.1 dengan Reserved Font Name "Plex"; bundel adalah
   versi modifikasi (label name/OS/2) yang tetap memakai nama Plex: aman untuk pemakaian internal, perlu ditinjau bila didistribusikan.

Keputusan untuk controller: adopsi docx-embed di worker render (S92) = tanam set `fonts/same` ke salinan DOCX per job
(ganti slot tertanam Plex; DOCX tanpa slot perlu entri baru). Butuh pemilik S92/engine DOCX; S99 tidak menyunting area itu.
Permintaan: `.gitignore` + `/render-env/semibold-bundle/out/` (file_requests.md).
Penjaga: py_compile OK; `--help` exit 0 (3 skrip); `node --check` OK; `npx eslint render-env/semibold-bundle/calibrate_bundle.mjs` exit 0;
kalibrasi segar docx-embed: "halaman ref=102 lokal=102 teks identik=101 SSIM rata=0.9999 min=0.9965 >=0,98=102".
Larangan dipatuhi: tanpa tulis HKCU, tanpa pasang/hapus fon, tanpa AddFontResource; profil LO sementara per job; tidak ada soffice tersisa.
Review direkomendasikan (lingkup S83 MINOR): `render-env/semibold-bundle/**`.
