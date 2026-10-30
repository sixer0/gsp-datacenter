Jejak orkestrasi lengkap: kartu `t_249c6b84` tertutup L2, kontrak + PHASE-REPORTS di `docs/2026-10-30_hermes-retrial/`, countersign verifier PASS (dua angka draf dikoreksi ke cetakan alat sebelum serah). Gerbang naturalisasi: scanner kanal chat VERDICT PASS, em dash dan middle dot nol, panjang 1000 kata. Laporan final tersimpan di `C:/Users/TRIAL/workspace/gsp-hermes/workspace/docs/2026-10-30_hermes-retrial/LAPORAN-RETRIAL-STUDIO-DEV-1030.md`. Berikut isinya.

---

LAPORAN RETRIAL DOC ARTIFACT STUDIO v2.1 (DEV 9021) | RETRIAL-STUDIO-DEV-1030
Pemanggil: Swarm (`hermes-gsp-master01`). Materi sama seperti uji pertama (EOS360-1028 bab 3 subset, bab 4 penuh). Dokumen baru `003/GSP/KT/X/2026` v3, folder misi `2026-10-30_hermes-retrial`. Jejak: folder kontrak dan `Temp/hermes_trial/retrial/` (timing.csv 34 baris).

## R. Hasil uji ulang

| # | Langkah | Hasil | API |
|---|---|---|---|
| 1 | Baca HANYA §1.1 | 27 baris; cukup jadi daftar periksa bagi agen berpengalaman; agen baru tetap butuh §5.6 (medan `target`), §3 (patok versi), §5.4 (slot) | <1 m |
| 2 | Importer md/v1 `?validate=1` | bab3 200 `b3824348` valid=true; bab4 200 `8982587e` valid=true; 0 isu; dropped hanya NUMBERING; 1 peringatan `UNMAPPED_MARKER` (`[ASSESSED]`) sesuai spesifikasi | 0,3 s |
| 3 | Create v3 + bab paralel + outline + 4 slot | create 201 corr `c6cf8be4` (v3 sejak lahir); bab 2x 201 wall 0,36 s (corr `446d5aad`, `cced0129`); setOutline 400 `88945ba9` lalu 200 `3f968324`; slot 4x 201 (corr `87e94871`, `0dcfef03`, `66990b22`, `6d92c941`); COMPLETE | 3,4 s |
| 4 | Render draf bab 3 | 200 corr `02c75119`, job SUCCEEDED, draft=true, partial=false | 1,7 s |
| 5 | Render penuh DOCX+HTML | 200 corr `082e5070`, X-Studio-Render-Status SUCCEEDED; unduhan cocok: DOCX sha16 `55d324b1`, HTML `be9e8a86` (header = janji = lokal) | 1,0 s |
| 6 | Cek byte | framePr=2 (x=7597 w=1814 twips, persis kanal DatumDocx rev B), chip hanya utk rail eksplisit; TETAPI 26 paragraf prosa ikut menyempit `w:right=2154` (38 mm) tanpa chip, melanggar K2 rev B; TOC PAGEREF=2 hanya level bab, bagian tak muncul (janji §3 mencakup bagian); penomoran Tabel 3.1/Gambar 3.1 benar; nama objek dari caption, nol "Picture N", dekoratif berlabel; chart 2 batang kini 128x32 mm (uji pertama 20,4) | <1 s |
| 7 | Lint + D16-D18 | GET documents/{id}: 110 cek; D16/D17/D18 PASS (terpenuhi dari panduan §5.4/§5.7); rilis FAIL oleh 8 paragraf materi saya sendiri >150 kata (C-SG-L2-09), gerbang bekerja benar ke naskah saya | 1 panggilan |
| 8 | Uji C2 | PATCH pid `p-8rj0w4aw6r` op `replace` 200 corr `fa4a2c53`; resubmit bab lama tanpa base = 409 SCOPE_CONFLICT reason PATCHED_PIDS_OVERWRITTEN dengan overwrittenPids (address 4.3.1, editedInRevision 9), corr `baa74179`; pemulihan GET content lalu kirim dengan `baseRevisionNo` level atas: 200 unchanged corr `74f0d8a2`, nilai "93 menit" bertahan, rail utuh. Jerat: `id` hasil GET content ditolak skema kiriman (400 `16a0202a`) | 0,5 s |
| 9 | L5 migrasi dok lama `002/GSP/KT/X/2026` | structure 200 `73657ac8`; PATCH templateVersion 200 `6577363e` rev 12; render 200 `16d1a3f7`; old_v3.docx: framePr=2, PAGEREF=2 | 2,0 s |
| 10 | Probe C1/C6 | PDF eksplisit: 503 PDF_ENGINE_UNAVAILABLE corr `46255ba2`, jobCreated=false, suggestedFormats [docx, html], causes FONTS_NOT_LOADED_IN_SESSION; bawaan templat pun kena preflight (`53d68d52`); path salah: 404 ROUTE_NOT_FOUND + hint + corr `c1111a23` | 0,7 s |

Waktu API kumulatif 12,88 s dari 34 panggilan (termasuk probe dan kegagalan sendiri); inti create sampai render penuh ±7 s. Bandingkan uji pertama 298 s end-to-end (konversi bespoke 35 s di dalamnya) dan builder lokal 10-15 menit; sesi retrial membentang ~602 s karena jeda pikir dan probe. Kegagalan sendiri (bukan server): op `replaceBlock` (400 `c6adb1d6`), setOutline bawa `$schema`, kode chart di luar enum (400 `b02139a6`).

## S. Friksi tersisa (paling merugikan dulu)
1. Rail rev B tidak konforman K2 karena semua paragraf badan menerima indentasi 38 mm meski tanpa chip, padahal prosa tanpa provenans seharusnya penuh 166 mm. Usul: `w:ind right` hanya pada host chip plus ASSERT G-RAIL-3 saat render.
2. TOC hanya level bab, bagian dan lampiran tak ber-PAGEREF meski §3 menjanjikannya. Usul: entri per section dengan bookmark per heading dua.
3. Jerat pemulihan §5.3: medan `id` hasil `GET /content` ditolak `studio.chapter/v2` saat dikirim balik; alur baca-gabung-kirim membentur 400. Usul: terima `id` blok saat kiriman atau mode `submission` di GET content; catat bahwa hasil sah bisa 200 unchanged.
4. Badan op struktur berbeda dari kiriman biasa (tanpa `$schema`/`target`) tetapi §1.1 tidak menyebut; contoh hanya di §9.4.
5. Kuota `?validate=1` berbagi dengan R08, dan `?preview=html` berbagi kuota render. Usul: header `X-Studio-Quota-Remaining`.
6. Chart terkunci enum preset (P-01..W-16); data lain harus menumpang kode preset. Usul: kelas `chart.custom` berbatas bentuk.
7. PDF DEV masih menunggu sign-in operator (fail-fast 503 sudah benar).

## T. Vonis
Layak jadi jalur utama kelas susun-draf-terverifikasi (bab paralel + lint + ledger revisi + proteksi pid): enam friksi uji pertama tertutup ber-bukti, mata konversi MD hilang. BELUM untuk rilis DATUM penuh sampai tiga syarat sempit: konformansi K2 rail (S1), TOC per bagian (S2), PDF hidup di lingkungan sasaran. Setelah itu pindah penuh; builder lokal jadi cadangan.

## U. Konsultasi A
`[ASSESSED]` tidak punya padanan satu-satu. Resep dua-kasar usulan saya: penilaian kualitatif naik ke `ASUMSI` plus baris `source`/`note` landasan, pembacaan dengan derivasi angka terlihat naik ke `DITURUNKAN`. Perilaku importer sekarang (UNMAPPED_MARKER, teks utuh, tidak menebak) sudah benar; cukup tuliskan resep ini di §5.6. `[EXECUTED-DOC]` bukan derajat provenans melainkan identitas instrumen, padanannya `kind: "source"` dengan teks dokumen dan tanggal, bukan mark kelima. Menambah mark menuntut enum `common/v2`, kanal DatumDocx, dan gerbang G-RAIL fleet, tidak sepadan. `[GSP-STATEMENT]` cukup `note` berprefiks leksikon tetap.

## V. Konsultasi B
1. Pindah dulu: contract.md misi, PHASE-REPORTS/LAPOR-FASE, blueprint yang dilepas ke gelombang, dan artefak dibaca klien. Tetap MD: 01/draf/checkpoint, register data, komentar papan, serta berkas input gerbang deterministik (scanner, lock-guard).
2. Ya pada skema `studio.contract/v1`: sumber kebenaran JSON, HTML hanya proyeksi bergaya DATUM. Syarat mesin-layak berupa enum status tertutup, alamat antardokumen via documentId+pid (bukan path), diff lewat ledger revisi yang terbukti di C2, `meta.cardIds[]` sebagai jangkar papan, dan nol edit manual HTML.
3. Alur: controller menerbitkan kontrak saat buka misi (tier NOTA ringan) dan memperbaruinya per fase lewat patch pid, worker tidak menulis kontrak karena refleksi derived dari papan, render on-demand saat fase, serah, atau permintaan, hasil unduh dipromosikan gsp-librarian ke IL, dan papan menyimpan documentId+revisionNo.
4. Risiko: dua sumber kebenaran bila contract.md disk masih hidup (syarat API satu-satunya penulis), latensi loop antar-agen, scanner gaya yang butuh ekstraktor HTML resmi, kuota render untuk dokumen proses, dan retensi DB. Saya pakai penuh bila tersedia endpoint kontrak, batch hemat kuota, dan ekstraktor HTML. Transisi lewat generator md2kontrak dengan uji banding tiga misi pertama.
