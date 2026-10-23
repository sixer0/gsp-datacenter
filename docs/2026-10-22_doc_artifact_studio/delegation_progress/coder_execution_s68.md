# S68 coder-execution: panduan agent + seksi Studio API-REFERENCE (D-67)

Status: complete. Skills: none (brief).

## Berkas
- NEW `docs/STUDIO-AGENT-GUIDE.md` (15 seksi: tujuan, auth `x-internal-secret` + `agentId` tanpa nilai rahasia, alur minimal, struktur `studio.doc/v1`, contoh per blok paragraph text/runs/rail, list, aside, table, chart, diagram, image + assets, derivation + register, artefak chart/diagram/image/html, dry-run, alamat C.S.P, PATCH apa/mengapa/dampak + 409, riwayat/render ulang, unduh, 30+ kode galat + tindakan, batas, tier/status rilis, praktik baik, peta route).
- MODIFY `docs/API-REFERENCE.md`: hanya seksi baru `## 12. Studio` di akhir (`git diff --numstat` = 40 tambah, 0 hapus).

## Penjaga (skrip scratch, tidak di repo)
- Route: filesystem 18 metode-route (11 path) vs API-REFERENCE seksi 12 = 18 baris, hilang 0, lebih 0; vs panduan seksi 15 = 18, hilang 0, lebih 0.
- Contoh JSON: 22 fence, 22 bertanda, ajv (Ajv2020, `STUDIO_SCHEMA_LOAD_ORDER`, `STUDIO_AJV_OPTIONS`) PASS 22/22; semantik chart 3 (kode drawn, bentuk data = registri) + diagram 2 (`loadSpec`+`validateSpec`) gagal 0; kontrol negatif 4/4 ditolak.
- Tambahan: `ingestDocument` dryRun (DB v21 baca saja, `STUDIO_WORKSPACE_ROOT` scratch, tidak ada berkas tertulis): contoh minimal NOTA valid (rilis NOT_RUN), kerangka TERBIT valid rilis PASS; rakitan 10 blok contoh + register + aset valid=true di NOTA dan TERBIT (sisa lint FAIL non-penahan: C-26c/C-27 metrik bahasa teks pendek, D09 labels_verified, D20 Admiralty — didokumentasikan).

## Keputusan
- K1: contoh `mission.folder` memakai tanda hubung (`2026-10-23-kajian-...`), bukan garis bawah.
- K2: panduan mencantumkan perbedaan huruf format: ingest `render.formats` huruf kecil, R07 huruf besar peka huruf, R09 bebas huruf.

## Temuan (untuk register controller)
- F1: §7.2 dan skema `MissionRef` menerima `YYYY-MM-DD_<misi>`, tetapi lint DATUM-38/N1 menandai garis bawah di folder dan MENAHAN ingest TERBIT/SERAH (422; terbukti dry-run). Folder cadangan `<issueDate>_studio` juga bergaris bawah. Perlu keputusan: ubah pola/cadangan ke `-` atau kecualikan folder misi dari DATUM-38.
- F2: R11 `refresh=1` non-admin mengembalikan 403 dengan `code: "UNAUTHORIZED"` (kontrak tidak punya kode terlarang generik).
- F3: ketidakseragaman huruf `formats` antar route (K2) — kandidat penyeragaman di S85.
- Review recommended (S86): akurasi panduan terhadap handler.
