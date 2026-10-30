Halo Hermes. Terima kasih atas jawaban wawancaramu. Sekarang uji coba nyata: pakai Doc Artifact Studio di HQ v2.1 (lingkungan DEV) dengan alur kerjamu sendiri, lalu beri umpan balik jujur untuk menyempurnakannya. Kamu pengguna utamanya. Bila pipeline ini lebih lambat atau lebih merepotkan daripada builder lokalmu, katakan apa adanya.

## Lingkungan (wajib dipatuhi)

- Server DEV: `http://127.0.0.1:9021` (Swarm HQ v2.1, DB `gsp_agent_hq_v21`). JANGAN memakai port 9011, DB produksi `gsp_agent_hq`, atau `~/gsp-datacenter`.
- Autentikasi: header `x-internal-secret` berisi isi berkas `C:/Users/TRIAL/AppData/Local/Temp/hq_v21_clone/trial_internal_secret`. Ini rahasia khusus uji DEV. Baca di shell, mis. `-H "x-internal-secret: $(cat <path>)"`, dan JANGAN pernah mencetak, mengutip, atau menyalin nilainya ke berkas, log, atau laporan.
- Tambahkan `"agentId": "hermes-gsp-master01"` di badan JSON setiap POST/PATCH.
- Panduan lengkap untuk agen ada di `C:/Users/TRIAL/gsp-swarm-hq-v2.1/docs/STUDIO-AGENT-GUIDE.md`, dan referensi API di `docs/API-REFERENCE.md` §12 pada repo yang sama. Baca seperlunya saja; menilai apakah panduan itu cukup jelas juga bagian dari uji.
- Repo `C:/Users/TRIAL/gsp-swarm-hq-v2.1` BACA-SAJA: jangan ubah berkas di sana. Taruh berkas kerjamu (JSON, unduhan, catatan waktu) di `C:/Users/TRIAL/AppData/Local/Temp/hermes_trial/`.
- Folder misi untuk dokumen uji: `2026-10-30_hermes-trial` (medan `target.mission.folder`).

## Tugas uji (pakai konten NYATA dari pekerjaanmu)

Pilih satu laporan misi terbaru yang kamu sebut di wawancara (mis. `2026-10-28_eos360-1028`). Ambil sebagian isinya: minimal 2 bab, sebaiknya ada paragraf, tabel, dan satu gambar atau chart. Lalu:

1. Pilih templat lewat API (`GET /api/studio/templates`), mis. `datum-gsp`. Lihat kerangka slot-nya.
2. Ubah 2 bab tersebut dari bentuk kerjamu sekarang (MD per bab) menjadi JSON `studio.chapter/v2`. Catat berapa lama dan seberapa sulit konversi ini.
3. Kirim kedua bab secara PARALEL (`POST /api/studio/chapters`), seolah dari dua worker. Lalu isi slot wajib (cover, controlSheet, signature) lewat `POST /api/studio/slots`. Sebelum mengirim, boleh validasi dulu lewat `POST /api/studio/validate` (dry-run).
4. Render draf satu bab lewat `POST /api/studio/documents/{id}/render` (scope chapter), lalu render penuh DOCX + PDF + HTML setelah dokumen lengkap. Unduh hasilnya dan periksa: penomoran gambar/tabel, daftar isi, header/footer, rail, laporan lint/gerbang.
5. Simulasikan revisi kecil: ubah satu angka di satu paragraf lewat `PATCH /api/studio/documents/{id}/paragraphs/{pid}`, render ulang, dan periksa apakah bagian lain tetap stabil.
6. Bandingkan dengan builder lokalmu (`datum-house-style`/DatumDocx): waktu, langkah, token, mutu keluaran, dan kesesuaian gaya dengan registri kanonis fleet.

## Umpan balik yang saya minta (format)

Tulis laporan akhir (maks 900 kata) dengan bagian:

- A. Ringkasan: apakah pipeline ini menghemat waktumu dibanding builder lokal? Beri angka perkiraan.
- B. Langkah yang dijalankan beserta hasilnya (berhasil/gagal, kode galat dan `x-correlation-id` bila gagal).
- C. Friksi terbesar, urut dari yang paling merugikan. Untuk tiap friksi sebut: apa yang terjadi, dampaknya, dan usulan perbaikan konkret.
- D. Kesenjangan terhadap harapanmu di wawancara: MD per bab, gerbang per aturan, keluaran ke folder misi + sha256, rebuild per seksi, idempoten, cermin `datum-house-style`.
- E. Mutu keluaran dibanding DOCX buatanmu: apa yang lebih baik, apa yang lebih buruk, dan apa yang salah.
- F. Kejelasan panduan agen: bagian mana yang membingungkan atau hilang.
- G. Tiga perubahan teratas yang akan membuatmu memakai pipeline ini sebagai jalur utama.

Jangan mengarang hasil. Bila sebuah langkah tidak bisa dijalankan, tulis alasannya.
