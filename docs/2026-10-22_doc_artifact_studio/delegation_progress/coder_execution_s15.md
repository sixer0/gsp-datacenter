# S15 coder-execution: DOCX penanaman fon (engine/docx/fonts)

Status: complete (penjaga lulus; uji formal milik S72).

Berkas (area eksklusif `src/lib/studio/engine/docx/fonts/`): `index.ts` (stub I04 diisi; tanda tangan persis §8.2), `obfuscate.ts`, `sfnt.ts`, `catalog.ts`, `plan.ts`. Klaim di `file_claims.md` (S15 fonts/** + catatan ini).

Rancangan:
- `obfuscateFont`: XOR 32 byte awal dengan 16 byte GUID terbalik (port RL `obfuscate()`); simetris (`deobfuscateFont`). GUID tidak sah = BY_CONSTRUCTION_FAILED; fon < 32 byte = ASSET_TYPE_UNSUPPORTED.
- `planEmbeddedFonts`: konfigurasi R-08 `render.docx.embedFonts` (`{family | role, slots, boldFace?, files?}`), R-04 false = rencana kosong. Hanya keluarga di `facesUsed` (cocok ternormalisasi; nama fontTable = nama `w:rFonts`). Wajah dikenali dari tabel sfnt (nameID 16/1/6, OS/2 weight/italic), bukan nama berkas. `boldFace`: `canonical` (default) = Bold 700 lalu SemiBold 600; `semibold` = SemiBold lalu Bold. `files` menetapkan berkas per slot. `role` diselesaikan dari `type.face.<role>`.
- Urutan: R-08 lalu wajah terpakai tak tercantum yang ada di katalog (mis. Inter; opsi `embedUnlisted`, default true); slot regular/bold/italic/boldItalic; `word/fonts/fontN.odttf`, `rIdN` dari 1 (pola BM). GUID = UUIDv5-gaya dari sha256(domain, keluarga, slot, sha256 isi): deterministik.
- Katalog: aset templat kind "font"; cadangan manifest S13; sha256 terkunci diverifikasi (mismatch = BY_CONSTRUCTION_FAILED). Opsi `sources` untuk menanam versi terkunci render-env (F-019).
- Penulisan fontTable.xml/rels/content type tetap di S14 `package/fonts.ts` (sudah memanggil `obfuscateFont`); konstanta `ODTTF_CONTENT_TYPE`, `FONT_RELATIONSHIP_TYPE` diekspor.

Bukti:
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/engine/docx/(fonts|package)"` -> kosong (exit 1).
- `npx eslint src/lib/studio/engine/docx/fonts` -> exit 0, tanpa keluaran.
- Kesetaraan BM.docx (skrip tsx scratch): 18 odttf dide-obfuskasi dengan `w:fontKey` -> magic 00010000 semua; sha256 = TTF aset repo 17/18 (font2 = IBMPlexSerif-SemiBold.ttf 07866ea3..., font17 = DejaVuSans.ttf ae7b7855...); font18 DejaVu Sans Bold tidak ada di aset repo. Obfuskasi ulang = byte BM identik 18/18.
- Rencana untuk wajah BM (Serif, Mono, Sans Cond, DejaVu, Courier, Symbol): 13 fon, slot bold Plex = SemiBold (600), dua kali panggil identik; Courier/Symbol dilewati (tidak di katalog).

Temuan untuk controller:
- T-1: BM menanam 18 berkas (termasuk IBM Plex Sans x4 dan DejaVu Sans Bold); default R-08 hanya 13 dan aset S13 tidak punya DejaVuSans-Bold.ttf -> reproduksi 18/18 butuh profil S95 (tambah Plex Sans) dan aset DejaVu Bold (S13). Tidak menghalangi.
- T-2: keputusan `embedUnlisted` default true (memenuhi blueprint "Inter bila dirujuk"); minta konfirmasi controller.
Permintaan lintas pemilik: tidak ada.
