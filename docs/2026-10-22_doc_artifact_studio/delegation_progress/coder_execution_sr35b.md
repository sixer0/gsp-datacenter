# Catatan coder-execution SR-35b (koreksi panduan agent; D-205, D-217, D-201)

Status: complete. Tanggal 2026-10-23.

Perubahan (klaim SR-35b di `file_claims.md`):
- `docs/STUDIO-AGENT-GUIDE.md`: 17 kemunculan `2026-10-23-misi-a` -> `2026-10-23_misi_a` (contoh permintaan, respons, `message`, `forwardToController`, curl aset); paragraf "pakai tanda hubung / memicu N1" diganti: folder misi berpola IL `YYYY-MM-DD_<misi>`, path infrastruktur, tidak diuji N1 (D-80, D-217). Langkah "Atur kerangka" dan baris peta R19 kini merujuk GET (kerangka + esensial slot) dan POST (versi baru; 403, 422 `SLOT_PARAM_SCOPE_INVALID`, 409).
- `docs/API-REFERENCE.md` (seksi 12 saja, CRLF dipertahankan): baris R19 GET/POST disesuaikan header `skeleton/route.ts` (`advancedIncluded`, proyeksi non-ADMIN, `agentId` ditolak, galat 404/413/403/422); catatan "R19 belum ada" diganti "R19 ada".

Bukti (scratchpad): `sr35b_gen_completeness.ts` (folder baru) -> `sr35b_completeness.json` (computeCompleteness nyata); `sr35_verify_docs.ts <json>` -> SEMUA LULUS (31 PASS), exit 0: 14 contoh agen lolos validator kontrak v2, 10 respons = keluaran layanan, route 20/20, galat 68/68, kenop 30/30. grep `misi-a` = 0 di kedua berkas. Catatan: menjalankan skrip tanpa argumen JSON menghasilkan 7 FAIL palsu (pembanding lama); hasil sah memakai JSON baru.
