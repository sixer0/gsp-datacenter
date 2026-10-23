# render-env/semibold-bundle (S99, F-001): bundel fon SemiBold per job

Menutup F-001 tanpa mengubah fon sistem: wajah SemiBold Plex didaftarkan (fontTools 4.63.0) sebagai gaya
**Bold** keluarga yang diminta DOCX, lalu **ditanam ke salinan DOCX per job** sebelum `soffice --convert-to pdf`.
LibreOffice 24.2 (Windows) mengaktifkan fon tertanam secara privat per proses dan memakainya di atas fon Bold
per-user terpasang. Tidak ada tulis HKCU, pasang/hapus fon, atau `AddFontResource` dari skrip ini.

| Berkas | Fungsi |
|---|---|
| `build_bundle.py` | Bangun `fonts/<set>/` + `bundle_manifest.json` (nama keluarga, gaya, bobot, sha256 sumber dan hasil) |
| `bundle_tools.py` | `prep-docx` (salinan DOCX: ganti slot tertanam / tulis ulang nama / tanam fon tambahan), `pdf-fonts` |
| `calibrate_bundle.mjs` | Kalibrasi satu kandidat: BM.docx -> persiapan -> soffice (profil sementara, batas waktu, tree-kill) -> `../compare_cal.py` -> `out/<kandidat>.json` |

Set fon: `same` (nama keluarga persis DOCX, dipakai rekomendasi), `renamed` (`S99 <keluarga>`), `graft` dan
`symfix` (percobaan glif fallback). Sumber Plex: `datum-revl/assets/fonts` (byte-identik dengan fon tertanam
BM.docx). Nama PostScript dipertahankan sehingga PDF menanam `IBMPlex*-SemiBold` seperti acuan.

## Pemakaian

```
VENV -I -B render-env/semibold-bundle/build_bundle.py
node render-env/semibold-bundle/calibrate_bundle.mjs --candidate docx-embed [--keep-pdf] [--ui-sans "<daftar>"]
```

## Hasil kalibrasi (BM.docx -> PDF lokal lawan BM.pdf, metode CAL; 2026-10-23)

| Kandidat | Teks identik | SSIM rata / min | Hlm >= 0,98 | Fon tebal di PDF |
|---|---|---|---|---|
| baseline (konfigurasi B) | 101/102 | 0,9815 / 0,5341 | 88 | `*-Bold` |
| profile-fonts (`user/fonts` profil) | 101/102 | 0,9815 / 0,5341 | 88 | `*-Bold` (folder diabaikan LO Windows) |
| brand-shadow, rename-shadow (`-env:BRAND_BASE_DIR` bayangan) | - | - | - | soffice macet, batas waktu 400 s + tree-kill |
| **docx-embed** (rekomendasi) | 101/102 | **0,9999 / 0,9965** | **102** | `*-SemiBold` |
| rename-embed | 101/102 | 0,9999 / 0,9965 | 102 | `*-SemiBold` |
| docx-embed-graft | 99/102 | 1,0000 / 0,9992 | 102 | `*-SemiBold`, tanpa fallback |
| docx-embed-symfix | 101/102 | 0,9999 / 0,9965 | 102 | `*-SemiBold` (OpenSymbol tertanam tidak menang) |
| docx-embed + `--ui-sans` (DejaVu Sans; Inter;DejaVu Sans) | 101/102 | 0,9999 / 0,9965 | 102 | tidak berpengaruh |

Sisa satu halaman (18) bukan F-001: tiga glif `│` (U+2502) di run IBM Plex Serif jatuh ke fallback OpenSymbol
(lebar 0,36 em) di Windows, sedangkan acuan (fontconfig Linux) memakai DejaVu Sans (0,60 em), sehingga urutan
ekstraksi teks berbeda. Menanam glif ke Plex Serif (`graft`) menyamakan visual tetapi menggabungkan glif ke span
yang sama, sehingga urutan ekstraksi berbeda dari acuan di hlm 18, 24, 93.
