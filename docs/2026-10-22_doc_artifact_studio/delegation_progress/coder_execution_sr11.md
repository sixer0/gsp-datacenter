# SR-11 Layanan kelengkapan (coder-execution) - status: complete

- Berkas (baru, murni, tanpa Prisma/jam sistem): `src/lib/studio/services/completeness/{index,compute,texts,types}.ts`. Ekspor I48: `computeCompleteness(input): CompletenessReportV2`, `completenessTexts(r, ctx)`; tambahan `chapterProgress`, `slotState`, `compareChapterKeys`, tipe `CompletenessInput` (+ Slot/SlotRow/Chapter/TextContext; internal, §0.1).
- Masukan polos: per slot kerangka urut posisi `{slotKey, sectionType, label, required, repeatable, minItems?, maxItems?, contentMode, active, row: M14|null, chapters?: M15[]}` + `revisionNo` + `doc {docId, docNumber, missionFolder?, docKey?}`. Pemanggil SR-12/13/14/15/22 memetakan baris M14/M15 + kerangka ke bentuk ini.
- Aturan: state E29 tabel §8.1 berurutan; kemajuan bab `chapters.<slotKey>` (KD-15, D-172); outline atau kontigu 1..max / A..huruf; `missingRequired` + status §8.3; teks §8.3 (bahasa Indonesia, endpoint dari `studioRoutePath` R12/R13/R14/R17). Laporan dapat ditetapkan ke `CompletenessSummary` (D-164, dijaga kontrak).

## Penjaga (D-133)
- `npx tsc --noEmit -p tsconfig.json`: 1 galat, DI LUAR area: `src/app/api/studio/chapters/_shared/submit-kit.ts(39,43) TS2307 '@/lib/studio/services/submit'` (modul SR-13 belum mendarat; pemilik SR-21/SR-13). 0 galat di `services/completeness`.
- `npx eslint src/lib/studio/services/completeness`: exit 0, 0 temuan.
- Asap (`npx tsx` skrip scratch, bukan suite): 17/17 PASS. E2 saja (bab 3, rev 1) = INCOMPLETE; controlSheet EMPTY, signature EMPTY; content PARTIAL missing ["1","2"]; missingRequired [controlSheet, signature, content:1, content:2]. E0: message, forwardToController, nextSteps identik dengan register §7.3. E3b: missingRequired [cover, controlSheet, content:4], outline. COMPLETE: tanpa forward, references tanpa baris = OMITTED.
- forwardToController E2: "Dokumen 014/GSP/LAP/X/2026 (misi 2026-10-23_misi_a) belum lengkap pada revisi 1. Isi wajib belum ada: Lembar Kendali, Tanda Tangan. Bab belum ada: 1, 2. Terakhir mengisi: bab 3 oleh gsp-analis-01 pukul 16:12 WIB. Langkah berikut: kirim Lembar Kendali dan Tanda Tangan (POST /api/studio/slots) serta bab 1 dan 2 (POST /api/studio/chapters), lalu minta render penuh."

## Keputusan (dicatat controller)
1. Waktu "Terakhir mengisi" = HH:MM WIB (UTC+7) sesuai register §8.3; contoh blueprint E3b menulis 09:12 (jam UTC) -> register menang; contoh panduan perlu diselaraskan (SR-35).
2. Teks mengikuti register §8.3 (bukan varian E2 blueprint: "Kirim bab 1 dan 2", "render bab tersedia"): nextSteps memisah kunci dengan ", "; kalimat langkah di forward memakai "A dan B" / "A, B, dan C".
3. Slot wajib tanpa baris M14 (tidak sah, EC02) diperlakukan sebagai baris kosong (tetap tercatat hilang), bukan OMITTED. Slot OMIT tidak punya entri `chapters`.
4. Outline kosong (`[]`) diperlakukan sebagai tanpa outline (kontigu). Saran setOutline hanya untuk slot berulang wajib tanpa outline saat INCOMPLETE; `{"slot":...}` ditambahkan ke POST /chapters untuk lampiran dan slot berulang selain yang pertama.
5. `lastFilled*` slot berulang = bab terbaru (M14 berulang tidak membawa isi bab).

## Permintaan lintas pemilik
- Tidak ada. Temuan: galat tsc submit-kit (di atas) untuk SR-13/SR-21.
