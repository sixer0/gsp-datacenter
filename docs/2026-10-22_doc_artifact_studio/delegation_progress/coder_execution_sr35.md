# Catatan coder-execution SR-35 (panduan agent v2 + API-REFERENCE seksi Studio)

Status: complete. Tanggal 2026-10-23. Skills: dry-run-verify-fix, writing-clearly-and-concisely.

Berkas (klaim SR-35 di `file_claims.md`):
- `docs/STUDIO-AGENT-GUIDE.md` ditulis ulang (1.120 baris): prinsip §0 (D-139) di halaman pertama; agen hanya slug templat; alur kirim, baca kelengkapan, sunting per pid, minta render; E0, E2 (bab 3 misi A, gambar 3.2.3 = Gambar 3.1, tabel 3.3.2), E3a (dua agen, rebase), E3b (409 + `forwardToController`, `renderRefused`), E3c (PATCH pid + render penuh), paragraf menjadi gambar (D-131), SCOPE_CONFLICT; aset (unggah vs base64, batas); alamat C.S.P/F:slot dan pid; 68 kode galat + tindakan (403 FORBIDDEN templat terbatas, 429/503 Retry-After); masa berlaku v1 (KC-1, sampai v2.2, `ingest.inlineFormat`); bagian pengguna templat (preset + 30 kenop esensial); peta route R01-R20.
- `docs/API-REFERENCE.md` hanya seksi 12 Studio (diganti): prinsip, auth, galat, batas, kelengkapan, `SubmitResultV2`, tabel 31 baris metode R01-R20 (kolom ID + status tetap/berubah/baru), route internal `client-log`. Seksi 1-11 tidak disentuh. Akhir baris CRLF dipertahankan.

Bukti (sesi ini, skrip scratchpad `sr35_verify_docs.ts`, `NODE_PATH=<repo>/node_modules npx tsx ...`): SEMUA LULUS (31 PASS), exit 0.
- 14 contoh permintaan agen lolos validator kontrak (ajv `STUDIO_SCHEMA_LOAD_ORDER` + `classifySchemaV2Errors` untuk doc/chapter/slot v2; `$defs` common/v2 untuk PATCH pid dan aset; `parseRenderBody` R17; `parseStructurePatch` R14), 0 medan tampilan/parameter (52 `DISPLAY_FIELDS_GLOBAL` + overrides/params/x).
- 1 contoh negatif ditolak `DISPLAY_FIELD` pointer `/chapter/sections/0/blocks/0/widthMm`.
- 10 respons: JSON sah; semua teks `message`/`forwardToController`/`nextSteps` = keluaran `computeCompleteness` nyata (SR-11, WIB).
- Route: panduan 20/20 = `STUDIO_ROUTES`; API-REFERENCE 20/20 id, 31 baris metode; client-log ada.
- Galat: 68/68 `STUDIO_ERROR_CODES`, HTTP = `STUDIO_ERROR_HTTP`. Kenop: 30/30 id + label = `registry/essentials.ts`.
- Kontrol negatif (salinan bermutasi: `overrides`, `widthMm` di render, HTTP salah, label kenop salah) -> 4 FAIL, exit 1.

Keputusan (untuk controller):
1. Folder misi contoh `2026-10-23-misi-a` (tanda hubung), bukan `2026-10-23_misi_a` register: garis bawah memicu `N1` (blocksIngest TERBIT/SERAH, `registry/lint.ts:189-200`).
2. Label pemanggil `agent:<agentId>` di `by`/`lastFilledBy`/`changedBy`/teks (kode `revisions/v2/commit.ts:202` menulis requester); contoh register memakai id polos.
3. Nomor contoh `014/GSP/KT/X/2026` (typeCode bawaan KT, register §7.3), bukan `LAP`.
4. pid contoh memakai alfabet Crockford (`p-d1g5j8n3mq`, `p-g2k7n4v9wx`); register memakai `l`/`u` yang tak pernah dibangkitkan.
5. JSON v1 tanpa contoh JSON di panduan (hanya pemetaan), agar panduan bebas medan tampilan.

Temuan: R19 route belum ada (SR-26); R06/R07 route masih bentuk S56 (tanpa pid/render/kelengkapan, `REVISION_CONFLICT`) - dicatat di API-REFERENCE sebagai status kode. Permintaan lintas pemilik: tidak ada.
