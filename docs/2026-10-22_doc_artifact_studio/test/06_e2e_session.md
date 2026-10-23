# 06 Sesi E2E Studio (SR-52, S80 diperluas)

Status: needs-review (sesi lengkap berjalan; 87 PASS / 8 FAIL dari 95 cek; 8 FAIL = 5 temuan produk baru, nol kegagalan uji yang belum terpetakan).
Run akhir: 2026-10-23T04:14:00Z, 227 s, server dev v2.1 `http://127.0.0.1:9021`, DB `gsp_agent_hq_v21`.
Bukti mentah: `tests/e2e/studio/out/session/results.json`, `console.json`, 55 tangkapan `NN_*.png`, log `tests/e2e/studio/out/session.log`.

## 1. Strategi uji

**Lingkup.** Satu sesi Chromium terskrip (tanpa interaksi manual) yang menjalankan alur UI A, N, T, K, E, G, P, Y dan alur API agen U1, U2, U3 dari blueprint SR-52 (`identification/05_structural_sections_blueprint.md:793`), ditambah kriteria UX A1-A16 (`masterplan/04_studio_ux_spec.md:816-835`) yang bisa diuji di peramban. Build hanya lewat `POST /api/studio/documents/{id}/render` (D-247); kiriman dan PATCH yang membawa `render` diuji sebagai kasus negatif.

**Kerangka.** `playwright-core` 1.62.1 (dependensi repo) + Chromium headless `ms-playwright/chromium-1243`; skrip Node ESM `.mjs`, bukan Vitest, karena butuh server hidup dan menulis fixture (config Vitest hanya memuat `tests/**/*.test.ts`, jadi berkas ini tidak ikut `npm test`). Aksesibilitas: `axe-core` (ada di `node_modules`) disuntik per halaman, tag wcag2a/2aa/21a/21aa/22aa. Isi DOCX diperiksa dengan `fflate`.

**Kredensial (hanya jalur uji sah, host lokal).**
- ADMIN uji dibuat oleh skrip seed proyek `scripts/seed-webui-admin.mjs` (username `e2e-sr52-a-<acak>`, profil unik).
- USER uji dibuat lewat jalur fixture proyek `POST /api/brahma/rbac/signup` (jalur yang sama dengan `scripts/verify_login_hq.mjs`).
- Kata sandi dibangkitkan acak per run, hanya di memori proses, tidak dicetak dan tidak disimpan; kedua akun dihapus di akhir. Login dilakukan lewat form `/login` (tanpa cookie palsu).
- API agen memakai header `x-internal-secret` (panduan agen §2) yang dibaca dari `.env` di dalam proses (`tests/e2e/studio/lib/env.mjs`), tanpa pernah dicetak. Sebelum menulis apa pun, skrip memastikan `DATABASE_URL` menunjuk `gsp_agent_hq_v21` (`assertV21`).

**Fixture dan pembersihan.** Dokumen misi `2026-10-23_e2e_sr52_<acak>` (templat `datum-gsp`), 2 aset PNG unik, templat salinan milik USER (slug `e2e-sr52-...`, 3 versi), dua akun uji. Semua dihapus di akhir (dokumen berkaskade ke revisi/identitas/berkas/job; berkas render dan aset di `data/studio-workspace` ikut dihapus). Dokumen 000/001/002 hanya dibaca.

**Dikecualikan, dengan alasan.**
- A10 (konflik dua sesi pada paragraf yang sama): tidak dijalankan di sesi ini. `SCOPE_CONFLICT` sudah diuji di tingkat API oleh SR-45. Tambah konteks kedua bila controller memintanya.
- A13 (galat render dipaksa): butuh komponen yang sengaja melempar galat, artinya mengubah kode produksi. Di luar wewenang baris uji.
- A2 dan A16 (grep string JSX dan modul `shared/`): pemeriksaan statis milik SR-56. Di sini A2 hanya dicek di permukaan Riwayat (E.*.9).
- A5 seret tetikus: urut ulang diuji lewat keyboard (Alt+Panah). Seret dengan react-dnd tidak diuji.
- A12 bagian "tercatat di log DB": `client-log` menulis ke log berkas jsonl, bukan DB. Hanya pesan layar dan hitung mundur yang diuji.

**Catatan lingkungan.** Selama run pertama, baris lain sedang menyunting `src/**` (mtime 10:13-10:16 WIB). Server dev mengompilasi ulang dan sempat memberi 404 sementara (lihat §6). Angka di laporan ini berasal dari run akhir, saat tidak ada galat semacam itu. Blueprint menyebut port 9011, tetapi brief dan D-275 menetapkan :9021; port 9011 tidak disentuh.

## 2. Ringkasan berkas uji

| Berkas | Isi |
|---|---|
| `tests/e2e/studio/run-session.mjs` | Orkestrator sesi: preflight (sidik 000/001/002, hitungan 15 tabel), fixture, alur UI + API, pembersihan, postflight, `results.json`/`console.json` |
| `tests/e2e/studio/flows/ui.mjs` | Alur A, N, T, K, E (+A6-A9, A11), G, P, Y, A12, A14, A15 |
| `tests/e2e/studio/flows/agent.mjs` | U1, U2, U3 (API agen, bentuk E2/E3a/E3b/E3c panduan) |
| `tests/e2e/studio/lib/{env,db,api,browser,fixtures,png,report}.mjs` | Pembaca .env tanpa cetak, akses DB v21 + sidik, klien API agen, peluncur Chromium + perekam konsol, fixture + pembersihan 0 sisa, PNG unik, perekam hasil |
| `tests/e2e/studio/agent-only.mjs` | Pembantu: U1-U3 saja tanpa peramban (`SR52_STOP=u1`, `SR52_KEEP=1` untuk debug) |
| `tests/e2e/studio/explore.mjs` | Pembantu: snapshot aria + tangkapan per halaman untuk menyusun selektor |
| `tests/e2e/studio/out/session/**` | Keluaran run akhir (55 PNG, `results.json`, `console.json`) |

## 3. Inventaris kasus uji (run akhir, 95 cek)

| ID | Kategori | Kasus / harapan | Aktual (dipersingkat) | Status |
|---|---|---|---|---|
| FX.1 | fixture | fixture pengguna uji dibuat (ADMIN via scripts/seed-webui-admin.mjs, USER via rbac/signup) | Created admin 'e2e-sr52-a-c40434' (id=…) profile=e2e-sr52-a-c40434; USER HTTP 201 | PASS |
| A.1 | A masuk | halaman Studio tanpa sesi dialihkan ke /login?next=<tujuan> | http://127.0.0.1:9021/login?next=%2Fstudio%2Fdocuments%3Fstatus%3Dbelum | PASS |
| A.2 | A masuk | USER masuk -> kembali ke /studio/documents?status=belum (safeNext) | http://127.0.0.1:9021/studio/documents?status=belum | PASS |
| A.3 | A masuk | sesi USER sah (/api/auth/me role USER) | role=USER | PASS |
| A.4 | A masuk | ADMIN masuk dengan next=//evil.example -> tetap origin sama, ke / | http://127.0.0.1:9021/ | PASS |
| A.5 | A masuk | sesi ADMIN sah (/api/auth/me role ADMINISTRATOR) | role=ADMINISTRATOR | PASS |
| N.1 | N navigasi | A1 subnav USER = Beranda, Dokumen, Templat, Galeri artefak (tanpa Alat developer/Sistem) | ["Beranda","Dokumen","Templat","Galeri artefak"] | PASS |
| N.2 | N navigasi | A1 subnav ADMIN = urutan USER + Alat developer, Sistem | ["Beranda","Dokumen","Templat","Galeri artefak","Alat developer","Sistem"] | PASS |
| N.3 | N navigasi | sidebar grup Studio: USER 4 entri, ADMIN 6 entri, urutan sama dengan subnav | USER=["Beranda","Dokumen","Templat","Galeri artefak"] ADMIN=["Beranda","Dokumen","Templat","Galeri artefak","Alat developer","Sistem"] | PASS |
| N.4 | N navigasi | judul halaman seragam '<Halaman> · Studio · GSP Swarm HQ' | {"/studio":"Beranda · Studio · GSP Swarm HQ","/studio/documents":"Dokumen · Studio · GSP Swarm HQ","/studio/templates":"Templat · Studio · GSP Swarm HQ","/studio/artifacts":"Galeri artefak · Studio · GSP Swarm HQ","/studio/system":"Sistem · | PASS |
| N.5 | N navigasi | palet: USER tanpa 'Studio: Alat developer/Sistem', ADMIN dengan keduanya; ada 'Buat dokumen untuk misi' | USER=["Studio: Beranda","Studio: Dokumen","Studio: Templat","Studio: Galeri artefak","Studio: Buat dokumen untuk misi…"] ADMIN=["Studio: Beranda","Studio: Dokumen","Studio: Templat","Studio: Galeri artefak","Studio: Alat developer","Studio: | PASS |
| T.1 | T templat | USER: hanya kenop esensial berkelompok (Halaman/Tampilan/Isi), tiap kelompok <= 8 (A3) | Halaman:3, Tampilan:2, Isi:3 | PASS |
| T.2 | T templat | USER: 'Pengaturan lanjutan' tidak dirender (A3, SC-14) | summary lanjutan=0 | PASS |
| T.3 | T templat | USER: kenop 'Ukuran kertas' tampil di esensial | ["Ukuran kertas","Orientasi","Kerapatan margin","Warna aksen","Ukuran huruf dasar","Bahasa","Klasifikasi bawaan","Rel bukti"] | PASS |
| T.4 | T templat | USER pada templat bukan miliknya: kenop baca saja + ajakan 'Buat salinan' | disabled=true | PASS |
| T.5 | T templat | ADMIN: panel 'Pengaturan lanjutan' ada dan terlipat (details tertutup) | lanjutan=1 open=[false] | PASS |
| T.6 | T templat | ADMIN: esensial sama dengan USER (<= 8 per kelompok, 'Ukuran kertas' ada) | Halaman:3, Tampilan:2, Isi:3 | PASS |
| T.7 | T templat | ADMIN: membuka panel lanjutan menampilkan kontrol lanjutan | kontrol=4 | PASS |
| T.8 | T templat | Warna aksen: swatch sama dengan nilai tertulis | {"value":"#000000","label":"B45309"} | FAIL |
| T.9 | T templat | USER 'Buat salinan' (modal <dialog>) -> templat baru milik USER, langkah Pengaturan | http://127.0.0.1:9021/studio/templates/cmvkghc0w034xv1mks6rdwexs?langkah=pengaturan | PASS |
| T.10 | T templat | USER di templat miliknya: 'Ukuran kertas' dapat diubah, lanjutan tetap tidak dirender, kenop kelas K terkunci dengan alasan awam | paperEnabled=true lanjutan=0 kLocked=1 | PASS |
| T.11 | T templat | pratinjau templat v2 (FIX-V): ubah 'Ukuran kertas' -> POST /api/studio/validate dengan draftTemplate studio.template/v2 berisi F4 | request=true keys=$schema,template,meta,sections,draftTemplate resp=200 valid=true | PASS |
| T.12 | T templat | A4: pratinjau diperbarui <= 2 s setelah perubahan kenop (jeda 600 ms + render) | 945 ms; 'Diperbarui pukul 11.14.29.' -> 'Diperbarui pukul 11.14.47.' | PASS |
| T.13 | T templat | langkah Simpan menampilkan perubahan awam 'Ukuran kertas: A4 jadi F4' | Ukuran kertas: A4 jadi F4 | PASS |
| T.14 | T templat | simpan versi -> versi 2 baru, versi 1 tetap (sidik berbeda) | HTTP 201 versi=1:f674134d,2:d5fa5ffa | PASS |
| K.1 | K kerangka | susunan: 7 bagian, Sampul posisi tetap di awal, Lampiran posisi tetap di akhir | ["1. Sampul, posisi tetap selalu di awal","2. Lembar Kendali, tekan Alt dan panah atas atau bawah untuk memindah","3. Tanda Tangan, tekan Alt dan panah atas atau bawah untuk memindah","4. Daftar Isi, tekan Alt dan panah atas atau bawah untu | PASS |
| K.2 | K kerangka | A5 urut ulang dengan keyboard saja (Alt+Panah atas): Referensi naik ke posisi 5 | ["1. Sampul, posisi tetap selalu di awal","2. Lembar Kendali, tekan Alt dan panah atas atau bawah untuk memindah","3. Tanda Tangan, tekan Alt dan panah atas atau bawah untuk memindah","4. Daftar Isi, tekan Alt dan panah atas atau bawah untu | PASS |
| K.3 | K kerangka | A5 bagian posisi tetap (Sampul) tidak berpindah + pesan inline | pesan='Sampul selalu di awal; posisinya tetap sehingga tidak dapat dipindah.' | PASS |
| K.4 | K kerangka | A5/SC-3 simpan susunan -> versi 3 baru, versi sebelumnya tetap ada | HTTP 201 versi=1:396a4ad1,2:396a4ad1,3:232a3305 | PASS |
| U1.0 | U1 API | unggah aset PNG -> 201 created | HTTP 201 created=true | PASS |
| U1.1 | U1 API | kiriman pertama bab 3 membuat dokumen (201, created, revisi 1) | HTTP 201 doc=002/GSP/KT/X/2026 rev=1 scope=create;chapter:3 corr=60c6e9fb-be23-4e35-8ec3-0a3368bedacf | PASS |
| U1.1b | U1 API | respons kiriman memuat kelengkapan INCOMPLETE + fullRenderAllowed=false | missing=["controlSheet","signature","content:1","content:2"] | PASS |
| U1.2 | U1 API | kiriman ulang identik -> 200 unchanged tanpa revisi baru | HTTP 200 unchanged=true rev=1 | PASS |
| U1.3 | U1 API | gambar menggantikan paragraf 3.2.3 -> 201 revisi 2, changeScope chapter:3 | HTTP 201 rev=2 scope=chapter:3 changed=null | PASS |
| U1.4 | U1 API | blok 3.2.3 = image berlabel 'Gambar 3.1' | {"address":"3.2.3","pid":"p-rkm0hn48eb","type":"image","artifactLabel":"Gambar 3.1"} | PASS |
| U1.5 | U1 API | pid paragraf 3.2.3 diwarisi blok gambar (pid tetap di posisi yang sama) | paragraf=p-rkm0hn48eb gambar=p-rkm0hn48eb | PASS |
| U1.6 | U1 API | tabel 3.3.2 berlabel 'Tabel 3.1' (penomoran mesin) | {"address":"3.3.2","pid":"p-73b7hrrzf6","type":"table","artifactLabel":"Tabel 3.1"} | PASS |
| U1.7 | U1 API | kiriman dengan medan render -> 400 RENDER_FIELD, revisi tetap 2 (D-247) | HTTP 400 code=SCHEMA_INVALID rev=2 | PASS |
| U1.8 | U1 API | render bab 3 lewat endpoint -> 200, job SUCCEEDED, draft=true, DOCX+PDF | HTTP 200 job=SUCCEEDED draft=true scope={"kind":"CHAPTER","key":"3"} outputs=DOCX:Laporan Survei Uji E2E c40434 002-GSP-KT-X-2026 RevA Bab 3.docx / PDF:Laporan Survei Uji E2E c40434 002-GSP-KT-X-2026 RevA Bab 3.pdf 5255 ms | PASS |
| U1.9 | U1 API | DOCX draf bab 3 memuat 'Gambar 3.1' di antara paragraf 3.2.2 dan 3.2.4 | HTTP 200 bytes=2009321 idx(3.2.2)=244 idx(Gambar 3.1)=294 idx(3.2.4)=388 draftMark=true | PASS |
| U1.10 | U1 API | DOCX draf bertanda DRAF | DRAF=true | PASS |
| E.incomplete.1 | E penampil | A8 tab Baca: lembar bernomor (Bab 3, 3.2, 'Gambar 3.1'), bukan JSON/pohon alamat | GambarLabel=true | PASS |
| E.incomplete.2 | E penampil | A8 paragraf dapat difokus untuk disunting (tabindex + label Enter) | paragraf tersunting=6 | PASS |
| E.incomplete.3 | E penampil | A7 'Berkas lengkap' pada dokumen belum lengkap: aria-disabled (tetap fokus), klik membuka daftar kekurangan | aria-disabled=true disabled=false kekurangan='Belum dapat membuat berkas lengkap Bagian wajib berikut belum terisi. Agen akan mengisinya, atau minta pengisian lewat controller. Lembar Kendali Tanda Tangan B' | PASS |
| E.incomplete.4 | E penampil | A7 tidak ada POST render scope document dari UI | POST render=0 | PASS |
| E.incomplete.5 | E penampil | A6 rel kelengkapan cocok dengan R15 (segmen = bagian aktif, bab berulang dirinci) | segmen=9 slot=7 babDiharapkan=3 | PASS |
| E.incomplete.9 | E penampil | A2 tab Riwayat tanpa kode lingkup mentah (mis. 'chapter:3', 'create;chapter:3') di permukaan utama | kode mentah=["chapter:3","create;chapter:3"]; label pelaku berprefiks 'agent:'=2 | FAIL |
| E.incomplete.6 | E penampil | A11 tautan berkas lewat fileUrl (?download=1 / ?inline=1), Word hanya Unduh | hrefs=2 /api/studio/files/cmvkgi0lm038hv1mkcov2vf7t?download=1 /api/studio/files/cmvkgi0le038fv1mkmi6l181h?download=1 | PASS |
| E.incomplete.7 | E penampil | tab Berkas: draf bab 3 PDF + Word 'Bertanda DRAF' | Draf bab 3 Versi 2 · 23 Okt 2026, 11:14 Draf bab 3 PDF · Bertanda DRAF di setiap halaman · 53,7 KB · 23 Okt 2026, 11:15 Buka Unduh Draf bab 3 Word (.docx) · Ber | PASS |
| E.incomplete.8 | E penampil | A11 Buka PDF = dialog pratinjau (inline), Unduh = attachment | dialog=DIALOG inline='inline; filename="Laporan Surv' unduh='attachment; filename="Laporan ' (HTTP 200) | PASS |
| U2.1 | U2 API | bab 3 dan bab 5 dikirim paralel (base sama) -> keduanya 201, tanpa 409 | bab3 HTTP 201 rev=4 rebased=true; bab5 HTTP 201 rev=3 rebased=false; base=2; 356 ms | PASS |
| U2.2 | U2 API | dua revisi berurutan base+1, base+2; satu kiriman rebased | revs=3,4 | PASS |
| U2.3 | U2 API | bab 3 setelah kiriman paralel tetap memuat 'Gambar 3.1' di 3.2.3 dengan pid sama | {"address":"3.2.3","pid":"p-rkm0hn48eb","type":"image","artifactLabel":"Gambar 3.1"} | PASS |
| U2.4 | U2 API | kelengkapan terakhir INCOMPLETE; bab hilang 1,2,4 + controlSheet, signature | missing=["controlSheet","signature","content:1","content:2","content:4"] | PASS |
| U2.5 | U2 API | render penuh lewat endpoint -> 409 DOCUMENT_INCOMPLETE | HTTP 409 code=DOCUMENT_INCOMPLETE allowed=["chapter","slot"] | PASS |
| U2.6 | U2 API | 409 memuat details.forwardToController (teks) + details.completeness | forwardToController="Dokumen 002/GSP/KT/X/2026 (misi 2026-10-23_e2e_sr52_c40434) belum lengkap pada revisi 4. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Bab belum ada: 1, 2, 4. Terakhir mengisi: bab 3 oleh e2e-sr52-analis-01 pukul 1 | PASS |
| U2.7 | U2 API | render ditolak tidak menulis revisi | rev=4 | PASS |
| U3.1 | U3 API | isi slot Lembar Kendali -> 201 | HTTP 201 code= addr=F:controlSheet  | PASS |
| U3.2 | U3 API | isi slot Tanda Tangan -> 201 | HTTP 201 code= addr=F:signature | PASS |
| U3.3 | U3 API | bab 1, 2, 4 dikirim paralel -> semua 201 | HTTP 201 rev=9; HTTP 201 rev=8; HTTP 201 rev=7 | PASS |
| U3.4 | U3 API | kelengkapan COMPLETE, fullRenderAllowed=true, missingRequired kosong | status=COMPLETE rev=9 missing=[] | PASS |
| U3.5 | U3 API | GET content bab 3 = bentuk kiriman + pid (pid 3.2.2 = pid respons kiriman) | HTTP 200 pid=p-ymtgq80gh9 expected=p-ymtgq80gh9 | PASS |
| U3.6 | U3 API | PATCH replace pid paragraf -> 200, pid tetap, alamat 3.2.2 | HTTP 200 pid=p-ymtgq80gh9 addr=3.2.2 rev=10 scope=pid:p-ymtgq80gh9 code= | PASS |
| U3.7 | U3 API | PATCH dengan medan render -> 400 RENDER_FIELD (D-247) | HTTP 400 code=SCHEMA_INVALID | PASS |
| U3.8 | U3 API | PATCH insertBefore -> 200 dengan newPid + addressMap | HTTP 200 newPid=p-s8jb4vgkqz addressMap={"3.2.1":"3.2.2","3.2.2":"3.2.3","3.2.3":"3.2.4","3.2.4":"3.2.5"} | PASS |
| U3.9 | U3 API | setelah bergeser: pid paragraf sama kini di 3.2.3, gambar (pid sama) di 3.2.4 | idx(pid)=2 idx(image)=3 imagePid=p-rkm0hn48eb | PASS |
| U3.10 | U3 API | pohon dokumen: gambar di 3.2.4 tetap 'Gambar 3.1' | label=Gambar 3.1 | PASS |
| U3.11 | U3 API | render penuh lewat endpoint pada dokumen COMPLETE -> 200 SUCCEEDED, draft=false | HTTP 200 job=SUCCEEDED draft=false rev=11 outputs=DOCX:Laporan Survei Uji E2E c40434 002-GSP-KT-X-2026 RevA.docx / PDF:Laporan Survei Uji E2E c40434 002-GSP-KT-X-2026 RevA.pdf 6767 ms code= | PASS |
| U3.12 | U3 API | unduh PDF penuh: %PDF, sha cocok header X-Studio-Sha256 | HTTP 200 bytes=151630 disp=attachment; filename="Laporan Survei Uji shaHeader=ad0b4c2825ee sha=ad0b4c2825ee | PASS |
| E.complete.1 | E penampil | A8 tab Baca: lembar bernomor (Bab 3, 3.2, 'Gambar 3.1'), bukan JSON/pohon alamat | GambarLabel=true | PASS |
| E.complete.2 | E penampil | A8 paragraf dapat difokus untuk disunting (tabindex + label Enter) | paragraf tersunting=11 | PASS |
| E.complete.3 | E penampil | dokumen COMPLETE: 'Berkas lengkap' aktif (tanpa aria-disabled) | aria-disabled=null | PASS |
| E.complete.9 | E penampil | A2 tab Riwayat tanpa kode lingkup mentah (mis. 'chapter:3', 'create;chapter:3') di permukaan utama | kode mentah=["chapter:1","chapter:2","chapter:4","slot:signature","slot:controlSheet","chapter:3"]; label pelaku berprefiks 'agent:'=11 | FAIL |
| E.complete.6 | E penampil | A11 tautan berkas lewat fileUrl (?download=1 / ?inline=1), Word hanya Unduh | hrefs=2 /api/studio/files/cmvkgicy903c4v1mkarwhc1i8?download=1 /api/studio/files/cmvkgicy203c2v1mkzenfmgxq?download=1 | PASS |
| E.complete.7 | E penampil | tab Berkas: berkas lengkap terbaru tercantum | Berkas lengkap Versi 11 · 23 Okt 2026, 11:15 Laporan Survei Uji E2E c40434 PDF · 148,1 KB · 23 Okt 2026, 11:15 Buka Unduh Laporan Survei Uji E2E c40434 Word (.d | PASS |
| E.complete.8 | E penampil | A11 Buka PDF = dialog pratinjau (inline), Unduh = attachment | dialog=DIALOG inline='inline; filename="Laporan Surv' unduh='attachment; filename="Laporan ' (HTTP 200) | PASS |
| E.edit.1 | E penampil | A8 sunting via UI (Enter pada paragraf): lembar Apa/Mengapa/Dampak wajib (kosong ditolak) -> PATCH pid 200 -> versi baru | editor=true sheet3=true kosongDitolak=true PATCH=200 rev 11->12 pid=p-crq41kfxs6 | PASS |
| E.A9.menu | E penampil | menu 'Tindakan lain' paragraf dapat diklik tetikus pada 1440 px (tidak tertutup panel Daftar isi) | kotak menuitem x=389..619; elemen di titik tengah = aside 'Daftar isiSampul (otomat' | FAIL |
| E.A9 | E penampil | A9 ganti paragraf jadi gambar via UI: unggah + keterangan -> PATCH 200, pid sama kini image, tanpa medan ukuran; penomoran Gambar 3.1/3.2 dibangkitkan mesin | unggah=201 PATCH=200 pid=p-zamdn2bm53 type=image medanUkuran=0 label="artifactLabel":"Gambar 3.1","artifactLabel":"Gambar 3.2" | PASS |
| E.edit.2 | E penampil | D-247 lewat UI: centang 'Buat ulang berkas lengkap' -> PATCH TANPA medan render lalu POST /render scope document | checkbox=true PATCH=400 code=SCHEMA_INVALID patchMemuatRender=true render=tidak dipanggil job=- rev 13->13 pesan='Isian belum sesuai. Isian tidak dapat disimpan. Periksa medan yang ditandai, atau hubungi admin dan sertakan kode di Info tekn | FAIL |
| E.list.1 | E penampil | A6 daftar dokumen dikelompokkan per misi (grup fixture + 'Tanpa misi') | ["E2E SR52 C40434 · 23 OKT 2026","TANPA MISI"] | PASS |
| E.ro.1 | E penampil | dokumen 000 (templat terbatas) terbuka untuk dibaca USER tanpa galat | STUDIO DOKUMEN Dokumen berstandar DATUM untuk misi HQ. Beranda Dokumen Templat Galeri artefak Dokumen Manual Komprehensi | PASS |
| G.1 | G galeri | Galeri: tab Galeri, Katalog jenis, Buat artefak tampil untuk USER (D-164 T-6) | ["Galeri","Katalog jenis","Buat artefak"] | PASS |
| P.1 | P alat developer | Alat developer via URL oleh USER -> layar 'khusus admin' | mplat Galeri artefak Halaman ini khusus admin Dokumen dikirim oleh agen; Anda dapat meninjaunya di Dokumen. Buka Dokumen | PASS |
| P.2 | P alat developer | Alat developer ADMIN: 4 mode kiriman; Validasi contoh E1 -> R08 200 dengan completenessPreview | mode=4 HTTP 200 valid=true keys=valid,issues,lint,completenessPreview,previewHtml | PASS |
| Y.1 | Y sistem | Sistem: USER satu kartu status ringkas; ADMIN panel penuh + 'Periksa ulang kesiapan' | USER='t berkas Word dan PDF. Mesin cetak siap Berkas dibuat normal. Diperiksa 23 Okt 2026, 11:12' ADMIN memuat Huruf terpasang=true | PASS |
| A15.1 | A15 ponsel | 400 px: tanpa gulir horizontal halaman (scrollWidth <= clientWidth) | {"/studio":{"sw":400,"cw":400},"/studio/documents":{"sw":400,"cw":400},"/studio/documents/cmvkghw8l037rv1mkbdkhfe1t":{"sw":400,"cw":400},"/studio/templates/cmvjwg7mp0000v12csv4n257p?langkah=pengaturan":{"sw":400,"cw":400},"/studio/artifacts | PASS |
| A15.2 | A15 ponsel | 400 px: tabel Kelengkapan menjadi kartu (tabel tidak tampil) | table visible=false | PASS |
| A14.1 | A14 a11y | axe: 0 pelanggaran serius/kritis di W1-W9 (halaman utuh termasuk sidebar HQ) | W1:color-contrast(serious,11); W2:color-contrast(serious,9); W3:color-contrast(serious,8); W4:color-contrast(serious,10); W5:color-contrast(serious,8); W6:color-contrast(serious,10); W7:color-contrast(serious,8); W8:color-contrast(serious,8 | FAIL |
| A14.2 | A14 a11y | axe: 0 pelanggaran serius/kritis pada area Studio saja (di luar sidebar HQ) | W1:color-contrast(4); W2:color-contrast(2); W3:color-contrast(1); W4:color-contrast(3); W5:color-contrast(1); W6:color-contrast(3); W7:color-contrast(1); W8:color-contrast(1); W9:color-contrast(2) | FAIL |
| A12.1 | A12 galat jaringan | API dokumen diputus: pesan awam + tombol/hitung mundur coba ulang (tanpa jargon teknis) | STUDIO DOKUMEN Dokumen berstandar DATUM untuk misi HQ. Beranda Dokumen Templat Galeri artefak Dokumen Dokumen misi yang diisi agen. Pantau kelengkapan, tinjau isi, dan buat berkas. Buat dokumen Cari misi atau judul Statu | PASS |
| FX.2 | fixture | pembersihan fixture: 0 sisa (dokumen, pengguna, aset, templat salinan, folder misi) | {"cleanup":{"documents":1,"outputFilesOnDisk":4,"assets":2,"assetFiles":2,"users":2,"missionDirs":0,"templates":1,"templateVersions":3},"residue":{"documents":0,"users":0,"templates":0,"assets":0,"renderJobsOrphan":0,"missionDir":0}} | PASS |
| FX.3 | fixture | dokumen 000/001/002 baca-saja: sidik sebelum = sesudah | {"cmvjwkth00027v1cgd8wn9y7h":"000/GSP/STD/X/2026 rev=5 revs=5 out=12 jobs=4","cmvjwkilc0001v1cgo9fzklem":"001/GSP/KT/X/2026 rev=1 revs=1 out=3 jobs=1","cmvjwkogg0011v1cgk6lnj26m":"002/GSP/STD/X/2026 rev=1 revs=1 out=3 jobs=1"} | PASS |
| FX.4 | fixture | hitungan baris tabel Studio + WebUiUser sebelum = sesudah | {"StudioDocument":3,"StudioRevision":7,"StudioOutputFile":18,"StudioRenderJob":6,"StudioAsset":26,"StudioArtifact":0,"StudioTemplate":6,"StudioTemplateVersion":16,"StudioDocIdentity":448,"StudioBlock":1520,"StudioDocBlock":1385,"StudioDocSe | PASS |
| CON.1 | konsol | galat konsol nol di luar uji galat jaringan sengaja (A12) | 1 tak terduga; 2 sengaja (A12) | FAIL |

## 4. Analisis cakupan

| Alur / kriteria | Cek | Hasil |
|---|---|---|
| A masuk + `?next=` | A.1-A.5 | PASS. Tautan dalam `/studio/documents?status=belum` kembali tepat setelah masuk; `next=//evil.example` jatuh ke `/` di origin yang sama |
| N navigasi (A1) | N.1-N.5 | PASS. Subnav, sidebar, dan palet untuk dua peran; judul `<Halaman> · Studio · GSP Swarm HQ` |
| T editor templat (A3, A4, SC-14) | T.1-T.14 | 13 PASS, 1 FAIL (T.8, F3). USER hanya melihat esensial 3/2/3 kenop dan lanjutan tidak dirender; ADMIN melihat lanjutan terlipat; "Ukuran kertas" ada; pratinjau v2 (R08 `draftTemplate`) 954 ms; simpan versi 2 dengan versi 1 utuh |
| K kerangka (A5, SC-3) | K.1-K.4 | PASS. Urut ulang dengan keyboard; Sampul posisi tetap + pesan inline; simpan versi 3 |
| U1 (SC-7) | U1.0-U1.10 | PASS. Gambar menggantikan paragraf 3.2.3 dan mewarisi pid-nya, berlabel `Gambar 3.1`; DOCX draf bab memuat `Gambar 3.1` di antara 3.2.2 dan 3.2.4 dan bertanda DRAF; `render` di badan kiriman ditolak `RENDER_FIELD` |
| U2 (SC-8) | U2.1-U2.7 | PASS. Bab 3 dan bab 5 paralel: 201/201 tanpa 409, satu `rebased`; render penuh 409 `DOCUMENT_INCOMPLETE` dengan `forwardToController`; tidak ada revisi baru |
| U3 (SC-9) | U3.1-U3.12 | PASS. Slot wajib terisi sehingga status COMPLETE; PATCH pid mempertahankan pid; insertBefore menggeser alamat, pid tetap, `Gambar 3.1` tetap; render penuh SUCCEEDED `draft=false`; sha PDF = `X-Studio-Sha256` |
| E penampil (A6-A9, A11) | E.incomplete.*, E.complete.*, E.edit.*, E.A9*, E.list.1, E.ro.1 | 5 FAIL (F1, F2, F4×2, ditambah CON.1 akibat F1); selebihnya PASS. A7 popover kekurangan tanpa POST render; A8 sunting dengan Apa/Mengapa/Dampak; A9 (jalur keyboard) PASS; A11 inline/attachment PASS |
| G galeri | G.1 | PASS. Tab "Buat artefak" tampil untuk USER (D-164) |
| P alat developer + pratinjau FIX-V | P.1, P.2, T.11 | PASS. USER melihat layar "khusus admin"; R08 ADMIN memberi `completenessPreview` + `previewHtml` |
| Y sistem | Y.1 | PASS. USER satu kartu; ADMIN panel penuh |
| A12 | A12.1 | PASS. Pesan awam "Daftar dokumen tidak dapat dimuat" + "Coba lagi (n dtk)" (tangkapan 55) |
| A14 | A14.1, A14.2 | FAIL (F5). Kontras warna |
| A15 | A15.1, A15.2 | PASS. 400 px tanpa gulir horizontal; tabel kelengkapan menjadi kartu |
| Fixture / baca-saja | FX.1-FX.4 | PASS. 0 sisa; sidik 000/001/002 identik; hitungan 15 tabel sebelum = sesudah |

**Celah dan remediasi.** A10 bisa ditambah sebagai dua konteks USER yang menyunting pid yang sama. A13 butuh pengait uji di kode produksi, jadi keputusannya milik controller. A5 seret tetikus bisa ditambah dengan `dragTo`. A2 dan A16 statis milik SR-56.

## 5. Cara menjalankan

```bash
# prasyarat: server dev v2.1 hidup di :9021, .env menunjuk gsp_agent_hq_v21
node tests/e2e/studio/run-session.mjs          # sesi penuh (~4 menit); exit 1 bila ada FAIL
node tests/e2e/studio/agent-only.mjs            # U1-U3 saja (~1 menit), fixture dibersihkan
SR52_BASE_URL=http://127.0.0.1:9021 SR52_CHROMIUM=<chrome.exe> node tests/e2e/studio/run-session.mjs
```

Hasil run akhir: `HASIL: 87 PASS / 8 FAIL (95 cek, 55 tangkapan, 227 s)`. Run hanya-API sebelumnya (`agent-only.mjs`): `HASIL 31/31`.

## 6. Catatan CI dan uji tak stabil

- Tidak termasuk `npm test`: butuh server hidup, menulis fixture ke DB v21, dan memakai Chromium.
- Cookie `gsp_hq_session` bertanda `Secure`. `APIRequestContext` Playwright tidak mengirimnya lewat http (`/api/auth/me` menjadi 401), padahal peramban mengirimnya ke 127.0.0.1. Karena itu panggilan API bersesi memakai `fetch` di dalam halaman (`pageFetch`).
- Dev server yang mengompilasi ulang saat baris lain menyunting `src/**` memberi 404 sementara: `/api/auth/me` di run 1, dan `Templat tidak ditemukan: cmvkehpc1...` di run 2 (id itu tidak ada di DB). Keduanya tidak muncul lagi di run 3-13. Jalankan sesi saat tidak ada suntingan berjalan.
- Galat hidrasi `/login` (`style={{caret-color:"transparent"}}`) disebabkan tangkapan layar Playwright yang menyembunyikan caret sebelum hidrasi selesai. Itu artefak uji, sudah ditangani dengan `caret: "initial"`, dan tidak muncul lagi.
- Dialog native `beforeunload` (penjaga perubahan belum disimpan setelah E.edit.2 gagal) diterima otomatis dan dicatat di `results.json.log`.
- Nomor dokumen fixture selalu `002/GSP/KT/X/2026` di setiap run: nomor dipakai ulang setelah dokumen dihapus, jadi sekuens tidak terbuang.

## 7. Masalah diketahui dan batasan

- **Konsol.** Galat tak terduga = 1 (run akhir), yaitu `400` PATCH paragraf pada E.edit.2 akibat F1 (`console.json`). Galat sengaja = 2 (A12 memutus API). Peringatan `[studio-ui]` menyertai keduanya. Halaman lain 0 galat.
- Fixture menulis log operasional jsonl (`data/studio-workspace/logs/api/*`, korelasi tercatat). Log ini tahan lama dan bukan fixture DB, jadi tidak dihapus.
- Folder `tests/e2e/studio/out/` tidak ada di `.gitignore`. Itu berkas bersama dan di luar area klaim SR-52; keputusan untuk mengabaikannya ada di controller.

## 8. Rekomendasi: temuan baru dan baris pemilik

Tidak ada temuan di bawah yang sudah tercatat di `findings/findings_register.md` atau `integration_backlog.md` (dicek dengan grep).

| ID usulan | Tingkat | Pemilik | Temuan | Bukti |
|---|---|---|---|---|
| SR52-F1 | Mayor (regresi D-247) | SR-30 | Jika "Buat ulang berkas lengkap" dicentang pada lembar perubahan, UI mengirim `render:{scope:"document"}` di badan PATCH (`reader/reader-tab.tsx:369`). Server menolaknya dengan `400 SCHEMA_INVALID` `RENDER_FIELD`, suntingan tidak tersimpan, dan pengguna hanya melihat "Isian belum sesuai". Perbaikan: PATCH tanpa `render`, lalu `POST /render {scope:"document"}` bila `completeness.fullRenderAllowed` | E.edit.2; `console.json`; tangkapan 37-38 |
| SR52-F2 | Mayor (pemakaian, a11y) | SR-30 | Pada lebar ≥ lg, menu "Tindakan lain" paragraf (`reader-tab.tsx:154` `absolute right-0 w-60` di talang `:222` `absolute -left-9`) terbuka di x 389-619, di bawah panel "Daftar isi" (`aside`). Panel itu menangkap klik, sehingga menu tak terlihat dan tak bisa diklik tetikus pada 1440 px. Hanya jalur keyboard yang berfungsi | E.A9.menu (titik tengah menuitem = `aside`); tangkapan 32 |
| SR52-F3 | Minor | SR-29 | Kenop "Warna aksen" (`template-editor/essential-knob.tsx:167`) hanya menerima `#RRGGBB`, sedangkan nilai registri `hex` = `B45309` tanpa `#`. Akibatnya swatch tampil hitam padahal teks menulis B45309, dan perubahan akan menulis `#RRGGBB` (format berbeda dari registri) | T.8; tangkapan 08 dan 11 |
| SR52-F4 | Minor (A2) | SR-30 (history-tab), asal di `services/submit/change.ts:60` (`impact = changeScope`, register §9.5) | Tab Riwayat menampilkan "Dampaknya" mentah (`chapter:3`, `create;chapter:3`, `slot:signature`) dan label pelaku `agent:<id>` di permukaan utama USER | E.incomplete.9, E.complete.9; tangkapan 21 dan 26 |
| SR52-F5 | Sedang (A14) | FIX-4a/UX-01 (token `--text-3` pada teks kecil Studio); sidebar HQ di luar Studio (pra-ada) | axe `color-contrast` serius di W1-W9. Di area Studio 1-4 node per halaman: eyebrow "Studio Dokumen" (`src/app/studio/layout.tsx:28`) 3,85:1; judul panel Beranda 3,69:1; pil "Posisi tetap", "Opsional, kosong", "Milik Anda" 3,33:1. Di sidebar HQ, label grup 2,35:1 | A14.1, A14.2; `results.json.axe` |

**Pengamatan (tidak dijadikan cek gagal).** Lembar baca menampilkan kartu "Gambar · Tampilan lengkap tersedia setelah berkas dibuat" untuk blok gambar bahkan setelah render penuh, padahal aset ada. UX §3c meminta gambar mini dari aset (SR-30). Kepala dokumen COMPLETE menulis "Lengkap: 9 dari 11 bagian"; angka itu menghitung 2 bagian opsional yang kosong.

**Langkah berikut.** Perbaiki F1 dan F2 (SR-30) lebih dulu, karena keduanya memblokir alur sunting nyata. Setelah itu jalankan ulang `node tests/e2e/studio/run-session.mjs`. Hasil yang diharapkan: E.edit.2, E.A9.menu, dan CON.1 berubah PASS.
