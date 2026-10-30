Laporan selesai, 886 kata, scanner gaya kanal chat VERDICT PASS, A1/A2 nol. Berkas: C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/LAPORAN-UJI-STUDIO-2026-10-30.md (jejak mentah: *.json respons, timing.log, full_rev10.docx, rail_test.docx di folder yang sama). Catatan kepatuhan: repo tidak saya tulis (selisih decisions.md adalah catatan D-320 controller pukul 09:22:56, satu menit sebelum uji mulai); rahasia tidak pernah tercetak; vonis sub-yang-saya-sangka-gepeng saya tarik setelah bukti byte menunjukkan rasio display sama dengan rasio native.

================ LAPORAN UJI COBA DOC ARTIFACT STUDIO v2.1 (DEV 9021) ================

A. RINGKASAN
Menghemat waktu untuk kelas pekerjaan ini, belum untuk kelas utama saya. End-to-end nyata `298 s` (09:23:26-09:28:24 WIB) termasuk membaca panduan 1.307 baris; konversi `35 s`; sisanya unggah, validate, kirim, slot, render, patch, render ulang. Builder lokal untuk extract setara: `10-15 menit`, tapi tanpa lint 110 cek, tanpa ledger revisi, tanpa idempoten. Untuk dokumen penuh 84 halaman builder lokal tetap unggul karena Studio belum menghasilkan PDF dan rail bukti belum terwujud. Vonis jujur: belum jalur utama; kandidat kuat setelah tiga perbaikan di G.

B. LANGKAH DIJALANKAN
| Langkah | Hasil |
|---|---|
| GET templates + skeleton `datum-gsp` | 200, corr `ffa70053` |
| POST assets FIG-02.png (sha256 cocok registri) | 201, corr `755dc596` |
| POST validate bab 3 dan 4 | 200 valid=true, corr `703fa978`, `875f4a25` |
| POST chapters PARALEL | 2x 201, wall `0,78 s`, corr `8e686568` (rev 1), `5c57f698` (rev 2) |
| PATCH setOutline {3,4} | 200, corr `421dcfa8` |
| POST slots (cover, controlSheet, signature, references) paralel | 4x 201, `0,86 s`, rev 4-7, COMPLETE |
| Render chapter bab 3 | 200 `3,5 s`; DOCX+HTML ok, PDF gagal, corr `66a23244` |
| Render document | 200 `1,6 s`; DOCX sha16 `21e031ad`, HTML `2893ca2f`, PDF gagal, corr `10b365c2` |
| Unduh + cek X-Studio-Sha256 | 3/3 cocok byte |
| PATCH pid `p-m1m7wa9k3s` (94 jadi 93 menit) | 200 rev 8, corr `b17d8175` |
| Resubmit bab 4 identik | 201 rev 9, TIDAK unchanged, membatalkan rev 8, corr `0486a787` |
| PATCH ulang + render rev 10 | corr `0df6d6eb`, `44fbf4cf`; diff pid rev 8 vs 10: `12/12` identik, stabilitas terbukti |
| Probe DISPLAY_FIELD via validate | valid=false, checkId dan pointer benar |
| Resubmit bab 3 tak tersentuh | 200 unchanged=true, idempoten terbukti |
| PATCH medan `rail` + render rev 11 | corr `834f38cd`, `c9e31d5d`; hasil inline "■ TERUKUR", `framePr` tetap 0 |

Kegagalan sendiri: slots pertama memakai path salah (`documents/{id}/slots`), server menjawab 404 body kosong tanpa `x-correlation-id` maupun kode galat.

C. FRIKSI TERBESAR
1. PDF mati permanen di DEV: `render-env.ready=false`, 17 font per-user "sign in again". Keluaran wajib rantai DATUM tak tercapai; lebih pahit, HTTP 200 dengan job `PARTIAL` mudah terlewat worker. Usul: `503` di awal bila formats memuat pdf dan ready=false; muat font via reg-file yang sudah ada di clone.
2. Kiriman bab menimpa suntingan pid tanpa peringatan: PATCH rev 8 batal oleh resubmit bab yang saya kira identik (isi bab belum berubah, pid 4.3.1 sudah); §5.3 tidak memperingatkan. Risiko nyata kehilangan revisi di tengah gelombang worker. Usul: bandingkan payload dengan state pasca-base per pid, lalu `409 SCOPE_CONFLICT` atau minimal REPORT `PATCHED_PIDS_OVERWRITTEN`.
3. Keluaran tidak mendarat di folder misi: hanya via `/api/studio/files/{id}`, folder `2026-10-30_hermes-trial` tak terbentuk di disk; closeout kami (sha16, commit, changelog) butuh langkah manual. Usul: flag `sink=mission` menulis rev-<n>/ + sidecar `outputs.json` ber-sha256.
4. Rail bukti rev B tidak terwujud: `framePr=0` di seluruh document.xml meski medan `rail` paragraf (ada di skema `ParagraphV2`, nol disebut panduan) saya isi lalu render; keluarannya inline, bukan chip margin kolom 128 mm. TOC statis tanpa nomor halaman. Dokumen Studio belum lolos countersign fleet.
5. Gerbang D16/D17/D18 tak terpenuhi dari panduan: releaseStatus FAIL karena issueStampColophon dan role `identity`/`closingAction` yang tidak ada di tabel blok §4 maupun contoh. Lint sendiri bagus: 110 cek, NOT_RUN jujur beralasan.
6. 404 tanpa korelasi (lihat B); kuota validate berbagi dengan render preview, angkanya mudah terlewat di §5.5.

D. KESENJANGAN HARAPAN WAWANCARA
MD per bab: konversi `35 s` tapi parser bespoke tulisan saya sendiri, tidak ada importer MD resmi. Gerbang per aturan: TERPENUHI, lebih ketat dari saya (E). Folder misi + sha256: BELUM (C3). Rebuild per seksi: ADA (`3,5 s`). Idempoten: TERBUKTI dua arah. Cermin datum-house-style: SEBAGIAN; margin 24/20 dan badan 9,5 pt cocok token, rail chip dan TOC bernomor belum.

E. MUTU KELUARAN vs DOCX BUATAN SAYA
Lebih baik: konsistensi kepala/footer dan pita klasifikasi; penomoran mesin benar dan tahan urutan acak (Tabel 3.1 mendarat di `3.4.2`); SUMBER+PROVENANS tercetak per figur; lint menangkap 8 paragraf melewati plafon 150 kata (C-SG-L2-09) yang build lokal saya loloskan, temuan dua arah: materi ON SIGN saya sendiri punya 8 paragraf di atas plafon fleet.
Lebih buruk/salah: tanpa rail chip margin (C4), TOC tanpa halaman, tanpa PDF; chart P-01 terpasang 128x20,4 mm (rasio sama dengan native, tidak gepeng) namun terbaca tipis untuk dua batang; nama objek aksesibilitas generik ("Picture 1-6"). Rendering role `subheading` tidak diuji.

F. KEJELASAN PANDUAN
Kuat: §0-§1, tabel galat §12 berkolom "tindakan agen", contoh invalid ber-marker. Hilang: bentuk `CoverPayloadV2` (hanya di registry `common/v2`, cara menggali schemaId itu tidak ditulis); medan `rail` dan role `identity`/`anchor`/`pivot`/`closingAction` nihil di panduan padahal gerbang menagihnya; cara memenuhi D16-D18; arti job PARTIAL vs HTTP 200; §5.4 benar soal `/slots` tapi server tidak membantu saat path salah.

G. TIGA PERUBAHAN PEMBUAT JALUR UTAMA
1. Render-env sehat (font) + fail-fast PDF; tanpa ini tidak masuk rantai kami.
2. Wujudkan rail chip rev B dari medan `rail` (framePr + kolom 128 mm) dan TOC bernomor; dokumentasikan `rail` dan role baru di panduan.
3. Proteksi anti-timpa pid pada kiriman bab, plus importer MD resmi ber-versi.

==========================================================================

Tiga hal di luar format yang perlu Bapak ketahui sebagai penyelenggara uji:
1. Dokumen uji `002/GSP/KT/X/2026` (rev 11) masih hidup di DB DEV 9021. Bersihkan kapan pun Anda siap; saya tidak menyentuh DB.
2. Temuan C2 (resubmit bab membatalkan PATCH pid tanpa peringatan) adalah yang paling berbahaya untuk produksi multi-worker, walau friksi C1 yang paling menghambat saya hari ini.
3. Temuan E sisi positifnya nyata: lint Studio menemukan 8 paragraf materi ON SIGN saya yang melanggar plafon fleet. Pipeline ini mengoreksi penulisnya, bukan hanya outputnya, itu kualitas gerbang yang selama ini hanya saya kejar manual.
