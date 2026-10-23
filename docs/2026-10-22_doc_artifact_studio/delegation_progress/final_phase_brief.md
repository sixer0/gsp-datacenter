# Brief bersama fase uji akhir (SR-40..SR-58)

Berlaku untuk setiap baris fase akhir sejak gerbang SR-39 GATE PASS (D-239). Brief per baris hanya menambah area, tujuan dan kriteria lulus.

## Konteks wajib dibaca

- Blueprint: `identification/05_structural_sections_blueprint.md` (baris SR-xx milikmu; kriteria SC-1..SC-14 di bagian Verifikasi).
- Keputusan: `decisions/decisions.md`, terutama D-119, D-127, D-128, D-131, D-133, D-139 (prinsip konten-saja), D-141, lalu D-160..D-239.
- Register: `masterplan/03_structural_sections_specs.md` (kontrak, 68+ kode galat, route R01-R20, DF-01..DF-69).
- Backlog dan temuan: `delegation_progress/integration_backlog.md`, `findings/findings_register.md` (jangan laporkan ulang temuan yang sudah tercatat sebagai baru; rujuk ID-nya).

## Aturan

1. Agen uji/review/verifikasi TIDAK mengubah kode produksi (`src/**`, `prisma/**`). Kegagalan dipetakan ke baris pemilik (SR-xx/IP-xx/RQ-xx) dan diserahkan ke loop perbaikan.
2. Klaim berkas di `delegation_progress/file_claims.md` (prefiks ID baris) sebelum menulis. Satu penulis per berkas.
3. Tulis atomik: tulis ke berkas sementara lalu rename (insiden F-063).
4. Vitest: config hanya memuat `tests/**`; jalankan `npx vitest run tests/unit/studio/<folder>` (bukan `src/...`). Baseline: 123 gagal / 1008 lulus (uji usang pra-ada, D-239).
5. DB: hanya `gsp_agent_hq_v21` (baca, fixture sementara dibersihkan 0 sisa), `gsp_agent_hq_v21_uji` (uji integrasi/rollback), `gsp_agent_hq_v21_shadow`. DB produksi `gsp_agent_hq` dan `~/gsp-datacenter` tidak disentuh. `prisma migrate dev` dan `db push` dilarang. Jangan `prisma generate` selama server dev :9021 hidup (laporkan needs-review bila perlu).
6. Port: server dev v2.1 di `http://127.0.0.1:9021`. Port 9011 dan PID 19956 (HQ produksi) tidak disentuh.
7. Rahasia: jangan mencetak isi `.env`, baris `DATABASE_URL`, kata sandi, atau cookie. Jangan memalsukan cookie sesi. Login E2E hanya dengan kredensial uji dari berkas seed/fixture proyek di host lokal.
8. HKCU registry tidak disentuh. Skill DATUM (HS/RL) baca-saja. Tanpa emoji di deliverable.
9. Temuan keamanan CAUTION/FAIL tidak pernah ditutup sebagai "risiko diterima"; tandai untuk user.
10. Bukti: setiap klaim membawa perintah + keluaran ringkas atau `file:baris`. Laporan akhir ke controller maksimal 5 baris: status, angka utama, path laporan, kegagalan teratas per baris pemilik.
