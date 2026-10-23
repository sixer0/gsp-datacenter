# S14 coder-execution: engine/docx/package (I03)

Status: complete (penjaga lolos; uji suite milik S72 fase final).

Berkas (8, area eksklusif `src/lib/studio/engine/docx/package/`): index.ts (6 ekspor §8.2 tetap + buildDocxPackage), xml.ts, zip.ts, base.ts, parts.ts, section.ts, header-footer.ts, fonts.ts.

Isi: basis `assets/base/default.docx` (aset templat kind "base" > manifest S13, sha256 diverifikasi) -> disalin theme/webSettings/numbering/customXml + 8 entri fontTable; styles.xml minimal (docDefaults R-06, Normal R-07, Header/Footer, TableNormal, NoList, DefaultParagraphFont); settings urutan CT_Settings (R-01..R-05); core.xml created=modified=issueDate; sectPr BM (A4, 1474/1361/1361/1134/737/737, cols, docGrid 360, titlePg); header/footer empty | runningHead (tab kanan = lebar teks, garis bawah C3CBD1) | registerBlock (tabel 4 sel 2948/2381/2381/1701, fldSimple PAGE/NUMPAGES) | custom; wadah fon (fontTable embed*/fontKey, rels, odttf); ZIP fflate urutan tetap, mtime lokal fixedDate 12:00, level tetap.

Antarmuka untuk S20: `buildSectionPackage(ctx, {firstRelId})` (1 pasang header{n}/footer{n} per unit, rId9.., sectPr per unit, facesUsed), `sectionBreakParagraphXml`, `resolveUnitSetup`, `FIRST_FREE_REL_ID`=9 (rId1..8 dicadangkan paket), `facesInXml`.

Bukti:
- `npx tsc --noEmit -p tsconfig.json | grep src/lib/studio/engine/docx/package` -> kosong (exit 1); total repo 21 galat pra-ada di luar Studio.
- `npx eslint src/lib/studio/engine/docx/package` -> exit 0, tanpa keluaran.
- Smoke tsx (29 unit, 3 fon): sha256 65e74a1c...271d identik 2x dan di TZ Asia/Jakarta, America/Los_Angeles, Pacific/Kiritimati, America/Sao_Paulo; tanggal entri ZIP {(2026,10,8,12,0,0)}.
- VENV python-docx: 29 seksi, 77 entri, 0 XML gagal parse, pgMar = BM, odttf font2 magic 00010000 setelah de-obfuscation.
- soffice 24.2.3.2 profil sementara: PDF 29 hlm, hlm 5 "PT GEMILANG SATRIA PERKASA · MANUAL DATUM · BAB 1 ... LEMBAR 5 DARI 29 TERBATAS".
- Penolakan teruji: rId cadangan, fixedDate 1970, bagian hasil-bangkit dari pemanggil, path traversal, GUID salah (semua BY_CONSTRUCTION_FAILED).

Keputusan/deviasi (untuk register controller):
1. stylesWithEffects.xml dan thumbnail.jpeg basis tidak disalin (styles minimal; thumbnail templat menyesatkan); rId4 dibiarkan kosong.
2. Elemen rPr/pPr/tcPr/settings ditulis urutan skema ECMA-376 (BM python-docx tidak berurutan); isi dan nilai sama.
3. tblW blok register = jumlah kolom (9411); BM menulis 9412 dan tcW/tblW ganda (GS-01, tidak direplikasi).
4. Teks kiri running head bawaan: org.entityName ?? "PT Gemilang Satria Perkasa", `runningHead.docLabel` ?? meta.subject ?? meta.title, label Bab/Lampiran, runningHeadTitle ?? judul. Kunci `runningHead.docLabel`, `org.shortName` (bawaan "GSP"), `type.face.<role>` belum ada di katalog: usulan param (tidak blocking; S93 dapat memberi `left` eksplisit).
5. Byte odttf: dipakai dari `parts` bila pemanggil menyediakan `partName`; bila tidak, `obfuscateFont` S15 dipanggil (stub S03 melempar sampai S15 mendarat).
6. Pemisah blok register memakai spasi biasa (pola BM), bukan NBSP P4S-12.

Permintaan lintas pemilik: tidak ada. Temuan: tidak ada blocker.
