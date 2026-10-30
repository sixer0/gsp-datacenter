---
task_id: FIX-HZ3
task_slug: doc_artifact_studio
row: FIX-HZ3 (D-327; penutup batch Hermes)
date: 2026-10-30
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-327)
status: complete
---

# FIX-HZ3: perender rel `datum-gsp` = `framePr` (HS rev B), Manual 000 tetap `table3col`

Skill: dry-run-verify-fix. DB: `gsp_agent_hq_v21` (dicek `current_database()`; DATABASE_URL dari `.env` repo, tidak dicetak). Penulis tunggal templat/preset selama baris ini (klaim di `file_claims.md`). Rahasia uji dibaca lewat env proses, tidak dicetak (grep log: 0 kemunculan). Skrip dan log ada di scratchpad sesi `.../scratchpad/fixhz3/` (bukan repo).

## Ringkasan

- `prisma/seed-studio.ts` (sha `f8e8e45e…` -> `afa33a74…`, +17/-8, tulis lewat salinan kerja + rename; dua rapikan komentar lewat Edit). Spesifikasi preset GSP DATUM: `decided[render.rail.renderer] = "framePr"` dan entri Δ beralasan baru (D-327: templat GSP mencerminkan datum-house-style fleet, HS rev B / G-RAIL rev B; baseline v1 `table3col` warisan profil Manual 000 BM.docx T013; turunan `render.rail.colsTw` kelas T BUKAN Δ). Penjaga TIDAK dilonggarkan. `deltaValueMismatch` tetap menuntut nilai baru = keputusan, `diffOutsideDelta` tetap 0, dan proyeksi di luar Δ tetap sama di kedua sisi. Komentar kepala diperbarui. Spesifikasi Manual 000 dan `benchmark/manual000/**` tidak disentuh.
- DB v21: `datum-gsp-preset` v2 (`21f4e1e7…`, changedKeys 1) dan `datum-gsp` v3 (`cmvue8khb000hv1us9qwwbkyf`, `21f4e1e7…`, kerangka `396a4ad1` = v2, rel `framePr`, 787 kunci). Jalan kedua dan jalan ketiga `unchanged`. Kanonik preset v1 / templat v6 `unchanged` (penjaga persis `38c776de`).
- Fixture baru di v3 lewat endpoint :9021, scope chapter karena fixture INCOMPLETE. DOCX memuat `w:framePr` ×3 dengan bentuk HS rev B `<w:framePr w:w="1814" w:wrap="none" w:hAnchor="margin" w:x="7597"/>`, tabel rel 1x3 = 0, `w:anchorH` = 0, inang `w:right="2154"` ×3. HTML memakai `data-rail-mode="A"` dengan 3 `st-rail-line`. Fixture dibersihkan: semua tabel Studio* kembali sama dengan hitungan sebelum, berkas dan folder disk dihapus.

## Langkah dan bukti

| # | Langkah | Perintah | Hasil |
|---|---|---|---|
| 0 | Keadaan awal + dry-run kode lama | `state.ts`; `npx tsx prisma/seed-studio.ts --presets-and-skeletons --dry-run` | exit 0; 4× `unchanged` (keadaan RESEED D-273 utuh); datum-gsp v1/v2 dan preset v1 = `table3col` |
| 1 | Dry-run kode baru | `--presets-and-skeletons --dry-run` | exit 0; preset GSP `new-version` v2, templat `new-version` v3; penjaga ok; `state` sebelum = sesudah (`cmp` identik, 0 commit) |
| 2 | Nyata | `--presets-and-skeletons` | exit 0; preset v2 + templat v3 dibuat; penjaga ok (lihat tabel Δ) |
| 3 | Jalan kedua | sama | exit 0; Kanonik `unchanged` ×2, GSP preset v2 `unchanged`, templat v3 `unchanged` |
| 4 | Jalan akhir (berkas final sesudah rapikan komentar) | dry-run + nyata | exit 0 keduanya; `unchanged` ×4; `state_final` = `state_after` (cmp) |
| 5 | Render fixture | `render_smoke.ts` (POST /api/studio/chapters templat datum-gsp -> POST /render docx,html -> GET /api/studio/files/{id}) | `RESULT pass=9 fail=0`; job SUCCEEDED (draft, scope chapter) |
| 6 | Manual 000 | `npx tsx benchmark/extract/convert_v2.ts --check` ×3 | setiap jalan SAME ×3 (doc.v2 `79290e07…`, template.v2 `882057c5…`, preset `a951b149…`); `git status benchmark/` kosong; DB `datum-manual-000` v1-v4 + preset v1-v2 identik dengan keadaan awal (rel `table3col`) |

### Penjaga GSP (keluaran seed, jalan nyata)

| Kunci Δ | lama (baseline v1) | baru (v3) | matchesDecision |
|---|---|---|---|
| device.registerBlock.boldFields | ["nomor dokumen","nomor lembar"] | 5 medan BM | true |
| symbol.sheet.fit | null | true | true |
| table.widthClass | null | "full" | true |
| render.rail.renderer (BARU) | "table3col" | "framePr" | true |

`ok: true`, legacyKeys 721, `deltaValueMismatch` [], `diffOutsideDelta` [], `missingLegacyKeys` [], proyeksi di luar Δ `8f4423d5…` lama = baru. Proyeksi di luar Δ dulu `aa942872` (SR-36/RESEED). Sha berubah karena himpunan kunci proyeksi kini kurang satu (Δ bertambah), bukan karena nilai berubah. `measuredCorrections` = `source-changed` (sama dengan FIX-SEED). `newKeysNonDefault` = image.widthMm, symbol.sheet.fit, symbolSheet.widthMm, table.widthClass. Dua `widthMm` adalah turunan T dari kelas lebar. `render.rail.colsTw` tetap `[7257,340,1814]` (bukan Δ). Karena itu chip framePr ber-x 7257+340 = 7597 dan ber-w 1814, sama dengan bentuk yang dikunci uji FIX-H4.

### Hitungan DB (sebelum -> sesudah)

StudioTemplateVersion 16 -> 18, StudioTemplateSlot 52 -> 66, StudioTemplateSlotParam 64 -> 81. Semua tabel Studio* lain tetap, termasuk StudioRevision 18, StudioDocument 4, StudioRenderJob 10, dan StudioOutputFile 25.

## Dokumen yang tersemat ke versi lama

Revisi tetap menunjuk versi templatnya. Dokumen Hermes `002/GSP/KT/X/2026` (id `cmvucp1d70002v13c945whd78`, rev 11) dan 001/002 STD tetap di `datum-gsp` v2/v1 (`table3col`). Baris ini tidak mengubahnya. Dokumen baru dengan `template.slug: "datum-gsp"` otomatis memakai v3. Cara naik versi untuk dokumen lama memakai op R14 `templateVersion`, pola yang sama dengan RESEED dokumen 000:

`PATCH /api/studio/documents/{id}/structure` dengan badan `{ "op": "templateVersion", "versionNo": 3, "baseRevisionNo": <revisi kini>, "change": { "what": …, "why": "D-327 rel framePr HS rev B", "impact": "tampilan rel saja; isi dibawa apa adanya" } }`. Hasilnya revisi baru yang tersemat ke v3. Setelah itu render ulang dengan `POST …/render`. Untuk Hermes, `baseRevisionNo` = 11 dan hasilnya rev 12. Keputusan menaikkan dokumen Hermes ada pada controller/USER.

## Test Results

| Uji | Perintah | Hasil |
|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` (berkas final) | exit 0, 0 baris |
| Lint | `npx eslint prisma/seed-studio.ts` (berkas final) | exit 0, 0 baris |
| Unit studio | `npx vitest run tests/unit/studio` | 78 berkas: 76 lulus / 2 gagal; 2169 lulus, 6 gagal, 1 skip. 6 kegagalan BUKAN milik baris ini (tidak ada uji unit yang mengimpor seed atau DB; grep `prisma\|seed-studio` = 0): 5 di `fixhz2-decorative-d16.test.ts` (berkas uji baru FIX-HZ2; `engine/lint/structure/checks-d.ts` sedang diubah) dan 1 jangkar `docx-determinism` `a4e6ff62` -> `aeb65a3d` (berkas mesin DOCX `blocks/media.ts`, `blocks/primitives.ts`, `wrapper/media.ts` berubah di pohon kerja selama baris ini = area FIX-HZ2) |

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| 6 uji unit gagal | 0 (di luar area) | Pekerjaan FIX-HZ2 yang berjalan paralel (lint D16 + mesin media DOCX) | Diserahkan ke FIX-HZ2 | Tidak untuk FIX-HZ3 |
| Kanonik tetap 774 kunci + warn `registryInSync false` | 0 | IP-70 (D-273) | Tidak berubah. GSP v3 kini menyimpan registri final (787 kunci) sebagai efek samping versi baru | Tidak |

## Issues & Decisions

| Butir | Keputusan / catatan |
|---|---|
| Verifikasi render | Memakai fixture baru, bukan dokumen Hermes. Dokumen Hermes tidak dinaikkan versinya, sehingga tidak ada revisi atau job baru pada dokumen uji pengguna |
| Δ hanya kunci keputusan | `render.rail.colsTw` (T) tidak dimasukkan. Nilai baseline dipertahankan dan dibandingkan |
| PDF | Tidak diminta (env PDF belum siap). Formats docx,html |

## Next Steps

- Controller/USER: putuskan apakah dokumen Hermes dinaikkan ke v3 lewat R14 (cara di atas).
- Review direkomendasikan (`senior-code-reviewer`, lingkup: diff `prisma/seed-studio.ts` spesifikasi preset GSP).
