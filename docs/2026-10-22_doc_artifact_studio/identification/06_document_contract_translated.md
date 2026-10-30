# Intake 06 (terjemahan maksud): Document contract berformat JSON tunggal

## Maksud

Hermes, agen utama ekosistem swarm/HQ, kini menulis document contract antar-agen (kontrak misi, laporan fase, blueprint gelombang, laporan selesai, dan sejenisnya) sebagai berkas Markdown dengan format yang berbeda-beda. Pemilik sistem ingin semua document contract ditulis dan disimpan dalam SATU format JSON yang sama dengan document output Studio (kontrak konten v2: dokumen → slot/bab → section → blok). Tujuannya:

- Hermes tidak perlu berpikir ulang soal format, dan aturannya jelas serta tervalidasi mesin.
- Kontrak tersimpan di DB sampai tingkat paragraf, dengan pid dan riwayat revisi, sehingga dapat di-query (retrieval berdasarkan misi, jenis, status, kartu kanban, dan teks).
- Manusia dan klien membaca proyeksi HTML (atau PDF) bergaya DATUM yang dihasilkan mesin yang sama.

## Lingkup

1. Jenis kontrak sebagai templat Studio (mis. kontrak misi, laporan fase, blueprint gelombang, laporan selesai), masing-masing dengan kerangka slot berisi bagian wajibnya.
2. Medan terstruktur yang dibutuhkan agen, di dalam kontrak yang SAMA (bukan skema terpisah): status enum tertutup, `cardIds` kanban, rujukan ke dokumen/paragraf lain (documentId+pid), tanggal, dan penanggung jawab.
3. Endpoint query/retrieval untuk kontrak dan dokumen (filter + teks penuh atas baris paragraf), dengan hak akses yang benar.
4. Berkas final di disk dengan nama beridentitas waktu yang dapat dicek ke sistem, usulan `<nomorDokumen>_rev<n>_<YYYYMMDDTHHMMSSZ>_<sha8>.<ext>`. Berkas itu diunduh lewat API oleh agen atau librarian; Studio tidak menulis ke workspace bersama.
5. Draf dan checkpoint: berkas MD berisi kepala ringkas untuk manusia ditambah blok ```json yang siap divalidasi (dry-run R08) dan dikirim apa adanya. Disertai alat bantu ekstrak + validate.
6. Transisi: generator dari MD lama ke kontrak JSON (memakai importer MD), uji banding pada 3 misi nyata Hermes, panduan agen, dan uji coba Hermes.
7. Tambahan dari uji ulang Hermes: header `X-Studio-Quota-Remaining` dan kelas `chart.custom` berbatas.

## Hasil yang diharapkan

Hermes membuat dan memperbarui kontrak lewat API dalam format yang sama dengan dokumen output, tanpa versi mentah di disk. Kontrak dapat dicari dan dirujuk per paragraf, dan manusia membaca HTML bergaya DATUM. Efisiensi terukur dibanding alur MD lama: waktu, jumlah langkah, dan kesalahan format.

## Batasan

- Produksi `gsp_agent_hq`, port 9011, dan `~/gsp-datacenter` tidak disentuh; pengembangan di branch v2.1 dan DB `gsp_agent_hq_v21`.
- Prinsip D-139 berlaku: agen hanya mengirim konten, tampilan milik templat.
- Migrasi DB aditif tanpa DROP (prosedur D-21).
- Push hanya dengan izin.

## Skala

Besar (Penyempurnaan dengan fitur baru lintas kontrak, DB, API, mesin, panduan, dan uji coba agen). Blueprint penuh via task-architect wajib disetujui lewat Plan Mode sebelum implementasi.
