# coder-execution UX-01: spesifikasi UX Studio (baris desain, D-161)

Status: complete (baris desain; tanpa perubahan kode). Skills: frontend-design, design-taste-frontend (aturan lanskap/hero tidak berlaku untuk UI produk; dipakai: anti-slop warna/ikon/tombol, kenop VARIANCE 3 / MOTION 2 / DENSITY 5).

Berkas (area eksklusif, klaim prefiks UX-01 di `file_claims.md`):
- `masterplan/04_studio_ux_spec.md` (baru, 837 baris)
- `delegation_progress/coder_execution_ux01.md` (catatan ini)

Isi spesifikasi:
- §1 prinsip P1-P10, kamus istilah layar beserta daftar kata terlarang, dan dua tanda visual: Rel kelengkapan (pita per bagian dari `completeness`) dan Lembar baca (permukaan terang lokal Studio, token `--studio-*`, kontras dihitung).
- §2 peta rute (tanpa rute baru wajib; `/edit` dan `/revisions*` dialihkan ke tab), matriks USER vs ADMIN, dan navigasi satu sumber `STUDIO_NAV` dengan medan `audience`.
- §3 empat alur: (a) templat (Gaya, Pengaturan dengan pratinjau langsung, Susunan, Simpan versi); (b) dokumen per misi + buat dokumen kosong D-153 + Buat berkas dengan alasan bila nonaktif; (c) Lembar baca + sunting di tempat + ganti jadi gambar + konflik + riwayat; (d) Buka = pratinjau, Unduh = attachment.
- §4 wireframe ASCII 12 layar (W1-W12).
- §5 pola status, katalog kode galat ke teks awam (15 baris), dan konfirmasi aksi berisiko K-1..K-10.
- §6 pedoman komponen: kit HQ, 12 modul `shared/`, error boundary per segmen, a11y WCAG 2.2 AA, responsif, dan log klien.
- §7 pemetaan ke SR-28/29/30/31 dan FIX-4 (usul dipecah 4a fondasi / 4b migrasi), serta tabel penutupan S86 R05-R17 + SEC-1/2/3.
- §8 T-1..T-13 keputusan/pertanyaan terbuka.
- §9 kriteria penerimaan A1-A16 untuk SR-52/SR-56.

Verifikasi (tanpa perintah validasi kode, karena ini baris dokumen):
- 12 wireframe (`grep -c '^### W[0-9]'` = 12, syarat ≥ 6).
- Rujukan `berkas:baris` dicek ulang dengan `sed -n`. Empat rujukan dikoreksi (`studio-subnav.tsx:25`, `layout.tsx:10`, `labels.ts:67`, `command-palette.tsx:30`).
- Kontras dihitung dari hex token. Klaim awal `--text-3` 4,6:1 dikoreksi menjadi sekitar 3,7:1 terhadap `--surface-1`, sehingga aturan pemakaian `--text-3` diperketat.
- Tidak ada berkas kode yang diubah.

Keputusan untuk controller (rinci di spek §8): T-1 mode ahli (usul: lanjutan khusus ADMIN di v2.1), T-2 simpan gabungan R02+R19, T-6 tab Buat galeri untuk ADMIN, T-7 notifikasi tanpa pustaka baru, T-8/T-10 berkas HQ bersama (`kit.tsx`, `sidebar.tsx`, `command-palette.tsx`, `contract/ui.ts`) untuk FIX-4a, T-9 pemecahan FIX-4a/4b + dependensi SR-28..31 pada FIX-4a, T-11 pengalihan rute lama, T-12 lembar baca terang (selera user), T-13 tabel kompleks tidak disunting di tempat.
