# INT-M coder-execution: IP-31 (F-042) + IP-30

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (1 siklus perbaikan: TS2322 banner), security-review-gate. Klaim INT-M di file_claims.md.

Berkas: baru `engine/bind/reproduction.ts` (`hasBenchmarkMarker`, `isVerbatimDerivation`, `isVerbatimReproduction(doc, block)`, `BENCHMARK_MARKER_KEY`), `services/ingest/trust.ts` (`isBenchmarkTrusted`, `stripBenchmarkMarkers`, `BENCHMARK_MARKER_STRIPPED`); ubah `engine/bind/index.ts` (ekspor), `services/ingest/index.ts` (opsi `trustedHarness`, pembuangan penanda sebelum validasi skema), `engine/html/tables/reproduction.ts` + `derivation.ts` (pakai predikat bind; ekspor lama dipertahankan sebagai delegasi), `services/revisions/index.ts` (IP-30).

IP-31: penanda `x.benchmark` dan padanan D-34 `x.enforcement` dihormati hanya bila `caller.kind === "ADMIN_SESSION"` atau `opts.trustedHarness === true` (hanya kode server; route membentuk opsi literal, grep `trustedHarness` di src/app kosong). Pemanggil lain: kunci dibuang dari salinan dokumen (asli tidak dimutasi) sebelum skema; opsi `enforcement:"report"` diabaikan; log warn `BENCHMARK_MARKER_STRIPPED` (callerKind, requester, agentId, pointer) + temuan REPORT `BENCHMARK_MARKER_STRIPPED` di `lint.checks` dan banner (tidak mengubah status rilis). Snapshot tersimpan pemanggil lain tidak membawa penanda, jadi turunan verbatim HTML/DOCX tidak aktif untuknya.
IP-30: `patchBlock` meresolusi templat terpin lebih dulu lalu `byConstructionChecks(nextDoc, tpl)`.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/(services/(ingest|revisions)|engine/(bind|html))"` -> kosong (grep exit 1); total 21 galat, semuanya src/app pra-ada (F-014).
- `npx eslint src/lib/studio/services/ingest src/lib/studio/services/revisions src/lib/studio/engine/bind src/lib/studio/engine/html` -> exit 0.

Cek data (harness scratch tsx, dryRun kecuali b3/b4; templat = `template.json` via `loadResolvedProfileFile` dengan `lint.enforcementOverride` profil DIBUANG di memori, lihat temuan 1; indeks aset S94):
- a1 ADMIN_SESSION / a2 INTERNAL_AGENT+trustedHarness: valid=true, 29 unit, 561 blok, diturunkan D-34 = DATUM-04@2.4, @11.1, G3@13.2.2, @13.3.2, DATUM-09 x7 (1.4.2, 4.8.4, 8.3.2, 8.6.1, 11.2.2, 16.1.2, 16.3.2) = D-90; snapshot membawa penanda.
- b1 USER_SESSION / b2 INTERNAL_AGENT (+ enforcement:"report"): valid=false, 11 isu (DATUM-04 x2, G3 x2, DATUM-09 x7), notice "Penanda benchmark dibuang (/document/x/benchmark[, opts.enforcement]) ... pemanggil USER_SESSION diperlakukan sebagai dokumen biasa (F-042)", log BENCHMARK_MARKER_STRIPPED.
- b3 USER / b4 agent non-dryRun: `BY_CONSTRUCTION_FAILED` http 422 "11 pelanggaran by-construction", 11 detail sama; dokumen asli tidak dimutasi.
- c render_cli (harness tepercaya) `--formats html`: status=SUCCEEDED exit=0, 9.954.671 byte, sha256 54095e22...56e9 = identik INT-F (perilaku HTML tidak berubah), unit 29 (cover 1, controlSheet 1, toc 1, part 5, chapter 17, appendix 4), verbatim 2. Negatif doc tanpa penanda: FAILED HTML_RENDER_FAILED exit 1.

Keputusan (dicatat controller): (1) `x.enforcement` diperlakukan sebagai penanda benchmark (efek D-34 identik) dan ikut dibuang; (2) penanda tersimpan dari ingest ADMIN tetap berlaku untuk revisi/render berikutnya (kepercayaan melekat saat ingest); (3) peringatan di hasil = LintIssue status REPORT (kontrak IngestResult tanpa medan warnings; jalur 400 skema hanya log).

Permintaan lintas pemilik: INT-B/engine/docx `figures/derivation.ts` mengganti salinan `isBenchmarkReproduction`/`isVerbatimDerivation` dengan `isVerbatimReproduction(ctx.snapshot?.doc, d)` dari `engine/bind` (tidak blocking). lint/scan `isBenchmarkDoc` (S44/INT-C) tetap membaca dokumen; aman karena ingest membuang penanda lebih dulu.

Temuan:
1. MAYOR (kebijakan): profil `benchmark/manual000/template.json` kini memuat `lint.enforcementOverride` {DATUM-04, G3, DATUM-09: release}; setiap pemanggil yang memakai templat itu (termasuk USER) lolos tanpa penanda. Dengan profil asli b1-b4 valid. Putuskan apakah templat benchmark dibatasi ADMIN.
2. MINOR: run harness pertama (non-dryRun USER, profil asli) mencapai persistensi dan gagal FK `StudioDocument_templateId_fkey` (transaksi rollback, tidak ada baris); aset beralamat-isi benchmark mungkin ditulis ulang idempoten ke `data/studio-workspace` assets.
3. INFO: `hasText` bind memakai teks mentah untuk `Inline.text` (HTML lama mem-parse md-lite); beda hanya untuk judul/penutup berisi penanda md-lite saja. `doc.x.lintEnforcement` (D-70) tetap dapat ditulis pemanggil mana pun (G1/DATUM-11 tidak dapat dilepas) - masukan S87.
Review direkomendasikan (S87 security + senior-code-reviewer: services/ingest/trust.ts, index.ts, engine/bind/reproduction.ts).
