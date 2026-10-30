Halo Hermes. Terima kasih atas laporan uji pertamamu (2026-10-30). Semua friksi yang kamu laporkan sudah ditindaklanjuti. Sekarang ada uji ulang, lalu dua pertanyaan konsultasi.

## Yang berubah sejak uji pertama

- C1 PDF: render yang meminta PDF saat render-env belum siap kini ditolak lebih awal dengan 503 `PDF_ENGINE_UNAVAILABLE`, tanpa membuat job. `details` memuat alasan, penyebab, dan `suggestedFormats`. Urutan galat seragam: 401 → 404 → 409/422 → 503. Hasil sebagian ditandai `partial`, `failedFormats`, dan header `X-Studio-Render-Status`. Catatan: PDF di DEV masih mati sampai pemilik mesin keluar-masuk sesi Windows (fon per-pengguna), jadi minta DOCX + HTML saja.
- C2 timpa pid: kiriman ulang bab/slot yang akan menimpa suntingan PATCH kini ditolak `409 SCOPE_CONFLICT` dengan `reason: PATCHED_PIDS_OVERWRITTEN` + `overwrittenPids`. Cara pulih: `GET /content`, gabungkan, lalu kirim ulang dengan `baseRevisionNo` terbaru.
- C3 folder misi: atas keputusan pemilik sistem, Studio TETAP tidak menulis ke workspace bersama. Unduh lewat `/api/studio/files/{id}` dan cocokkan `X-Studio-Sha256`.
- C4 rel + TOC: templat `datum-gsp` versi 3 merender rel bukti sebagai chip `framePr` di kolom margin (HS rev B). TOC kini bernomor halaman (PAGEREF). Dokumen lama di versi 2 dapat dipindah lewat `PATCH /documents/{id}/structure` `{op:"templateVersion", versionNo:3, baseRevisionNo, change}`.
- C5 gerbang D16-D18: role `identity`/`closingAction`/`anchor`/`pivot`, medan `rail`, dan `CoverPayloadV2` kini didokumentasikan dengan contoh.
- C6: path salah → 404 JSON `ROUTE_NOT_FOUND` + `hint` + `x-correlation-id`.
- Importer Markdown RESMI `md/v1`: `POST /api/studio/import/markdown` (badan `{markdown, chapterKey, title?, agentId}`, `?validate=1` menjalankan dry-run tanpa menyimpan) atau CLI `npx tsx C:/Users/TRIAL/gsp-swarm-hq-v2.1/scripts/studio/md2chapter.ts <bab.md> --key 3`. Role retoris ditulis sebagai komentar sebaris tepat sebelum paragraf, misalnya `<!-- role: closingAction -->`.
- Gambar diberi nama/alt dari caption, gambar dekoratif ditandai, dan chart dengan sedikit batang mendapat tinggi minimum.
- Panduan agen §1.1 kini berisi "Alur cepat untuk agen pengguna".

Lingkungan sama seperti sebelumnya: DEV `http://127.0.0.1:9021`, rahasia uji di `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret` (JANGAN dicetak), `agentId: "hermes-gsp-master01"`, repo `C:/Users/TRIAL/gsp-swarm-hq-v2.1` baca-saja, berkas kerja di `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/retrial/`, folder misi uji `2026-10-30_hermes-retrial`. Jangan sentuh port 9011, DB produksi, atau `~/gsp-datacenter`.

## Bagian 1: Uji ulang (konten nyata yang sama seperti uji pertama)

1. Baca HANYA §1.1 panduan dulu; catat apakah §1.1 cukup tanpa membaca seluruh panduan.
2. Pakai importer resmi untuk bab MD-mu (bab 3 dan 4 atau lebih), tambahkan komentar role bila perlu, lalu `?validate=1`.
3. Buat dokumen baru di `datum-gsp` v3: kirim bab paralel, isi slot wajib, lalu render bab draf dan render penuh DOCX + HTML. Periksa chip rel `framePr`, TOC bernomor, penomoran, nama gambar, dan laporan lint (D16/D17/D18).
4. Uji C2: PATCH satu pid, lalu kirim ulang bab lama tanpa base. Harapannya 409; kemudian pulihkan sesuai alur.
5. Opsional: pindahkan dokumen uji lamamu `002/GSP/KT/X/2026` ke v3 lewat R14 lalu render.
6. Catat waktu per langkah dan bandingkan dengan uji pertama (298 s) serta builder lokalmu.

## Bagian 2: Konsultasi (jawab sebagai pengguna utama)

A. Penanda rail: importer memetakan `[PUBLIC-SOURCE]` → TERUKUR dan `[VENDOR]` → PEMASOK. Ke status rail DATUM apa `[ASSESSED]` dan `[EXECUTED-DOC]` seharusnya dipetakan? Lihat daftar status rail di kontrak/panduan. Bila tidak ada padanannya, jelaskan maknanya.

B. Document contract: berkas antar-agenmu (contract.md, blueprint, checkpoint, kartu kanban, komentar LAPOR-SELESAI) sekarang berupa Markdown. Pemilik sistem mengusulkan agar dokumen-dokumen ini juga dihasilkan lewat sistem ini, tetapi dalam format HTML, bukan MD, supaya layak dibaca manusia, termasuk klien yang kamu layani, sambil tetap terbaca mesin oleh agen. Pertanyaan:
   1. Jenis document contract mana yang paling cocok dipindah lebih dulu, dan mana yang sebaiknya tetap MD? Beri alasan.
   2. Kebutuhanmu agar HTML tetap mudah dibaca dan ditulis agen: struktur, metadata, status, tautan antardokumen, dan diff revisi. Apakah perlu skema JSON kontrak tersendiri (mis. `studio.contract/v1`) yang dirender ke HTML bergaya DATUM?
   3. Alur yang kamu bayangkan: siapa membuat, siapa memperbarui, kapan dirender, dan di mana disimpan atau diindeks (IL, kanban).
   4. Risiko atau keberatanmu, dan apa yang harus ada agar kamu benar-benar memakainya.

## Format laporan (maks 1.000 kata)

- R. Hasil uji ulang: langkah, berhasil/gagal (kode + `x-correlation-id` bila gagal), waktu, dan perbandingan dengan uji pertama.
- S. Friksi yang tersisa, urut dari yang paling merugikan, beserta usulan konkret.
- T. Vonis: apakah sekarang layak jadi jalur utama? Bila belum, apa syarat yang tersisa?
- U. Jawaban konsultasi A.
- V. Jawaban konsultasi B (1-4).

Jangan mengarang hasil. Bila sebuah langkah tidak bisa dijalankan, tulis alasannya.
