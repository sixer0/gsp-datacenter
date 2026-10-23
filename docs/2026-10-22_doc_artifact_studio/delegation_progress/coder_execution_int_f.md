# INT-F coder-execution: IP-26 (F-037 sisi HTML) + IP-05 bagian HTML

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix (0 siklus perbaikan). Klaim: `INT-F src/lib/studio/engine/html/**` + catatan ini (file_claims.md).

Berkas: baru `engine/html/tables/reproduction.ts`; ubah `engine/html/tables/derivation.ts` (gerbang reproduksi sebelum `buildDerivationBlock`), `engine/html/tables/index.ts` (ekspor aditif), `engine/html/assemble/index.ts` (IP-05).

IP-26: turunan dirender verbatim HANYA bila (1) `doc.x.benchmark === true` atau objek (penanda yang sama dengan D-34 `isBenchmarkDoc` ingest, tanpa cabang `x.enforcement`) DAN (2) turunan verbatim murni: tanpa `result`, tanpa `verdict`, semua nilai baris Inline (bukan `registerKey`), `title` dan `closing` berteks. Selain itu jalur `buildDerivationBlock` S12 tetap (tanpa result() = ditolak). Tata letak C8: judul runs verbatim (C1, tanpa prefiks "Turunan"), [intro], tabel uraian | nilai + glif tanda (kolom nilai 32 mm), penutup; format `fieldFormats` (G-06) lalu jejak `x.titleFormat`/`x.closingFormat`, lalu peran. Log info `RENDER_DERIVATION_VERBATIM` per blok; atribut `data-renderer="verbatim" data-reproduction="benchmark"`. Pembuka lampiran: HTML sudah lolos tanpa perubahan (4 unit appendix dirender, 0 st-missing).

IP-05: `HtmlAssembleError` kini turunan `StudioEngineError` dengan code `HTML_RENDER_FAILED` (500); `reason` lokal tetap (+ `ASSEMBLY_FAILED` baru); `details` = {reason, address?, blockType?, causeCode?} tanpa stack; galat asli di `cause` (tak-enumerable). `assembleHtml` membungkus galat tak terduga di batas modul menjadi `HTML_RENDER_FAILED`; log galat mode artefak membawa code itu. Pemetaan INT-A (`htmlErrorCodeOf` instanceof) tetap berlaku.

Penjaga:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/html"` -> kosong (grep exit 1).
- `npx eslint src/lib/studio/engine/html` -> exit 0.

Cek data (render_cli S67, `--template benchmark/manual000/template.json` = `loadResolvedProfileFile` S49, indeks figur S94 `figures/index.json` 67 sumber):
- Sebelum: FAILED `BY_CONSTRUCTION_FAILED` "D-4.1 ... blok derivasi tanpa satu pun baris result()".
- Sesudah: SUCCEEDED exit 0; HTML 9.954.671 byte, sha256 54095e22...56e9 (2 render identik); unit 29 (cover 1, controlSheet 1, toc 1, part 5, chapter 17, appendix 4); `enforceStandalone` 0 pelanggaran (idempoten); turunan verbatim 2 (D-4.1 @4.6.2, D-6.1 @6.4.2); data-figure 24, placeholder figur 0, st-missing 0, script 0; engineLog tanpa warn/error.
- Negatif: doc tanpa `x.benchmark` -> FAILED `HTML_RENDER_FAILED` "...blok derivasi tanpa satu pun baris result()"; doc bertanda tetapi baris `registerKey` -> FAILED `HTML_RENDER_FAILED` "besaran grid.inner tidak terdaftar pada register". `studioErrorFrom` -> 500 `{code:"HTML_RENDER_FAILED", details:{reason:"RENDERER_FAILED", causeCode:"BY_CONSTRUCTION_FAILED", ...}}`.

Keputusan (untuk dicatat controller):
1. Penanda reproduksi = `doc.x.benchmark` (true/objek) + bentuk verbatim murni; INT-B sebaiknya memakai predikat yang sama di DOCX (bentuk data = doc.json S93 apa adanya).
2. Galat by-construction di mode artefak keluar sebagai `HTML_RENDER_FAILED` 500 (penyebab di `details.causeCode`), bukan 422.

Temuan (tidak blocking): `x.benchmark` dapat ditulis caller mana pun; ingest D-34 sudah memberinya efek turun-gerbang. Usulan: ingest (INT-C/S48) menolak atau membuang `x.benchmark` dari caller non-admin, atau predikat bersama di `engine/bind` (S12) agar HTML/DOCX satu sumber.
Permintaan lintas pemilik: tidak ada yang blocking. Review direkomendasikan (lingkup `engine/html/tables/reproduction.ts`, `engine/html/assemble/index.ts`).
