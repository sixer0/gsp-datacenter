---
task_id: ENG-01
task_slug: doc_artifact_studio
row: ENG-01
date: 2026-11-01
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-463)
status: complete
---

# Implementation Report: ENG-01, fallback format peran HTML yang setara dengan DOCX (UA-M02)

Skill yang dipakai: `diagnosing-bugs` (loop merah, uji regresi dulu), `backend-execution` (jalur galat: log render + cadangan), `dry-run-verify-fix`.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Loop merah | selesai | e1 + templat kanonik: `cover.titleFirst` tanpa `style` (70 elemen ber-peran, hanya 3 bergaya); Manual 000: 71 dari 71 bergaya |
| 2 | Peta resolver DOCX per jalur pemanggil | selesai | Blok isi DOCX (`blocks/env.ts` role) = `resolveRoleFormat` (templat > katalog). Halaman pembungkus DOCX (`wrapper/pages.ts` + `render.ts`, termasuk pembuka lampiran) = `wrapper/formats.ts` roleFormat (templat > katalog > benchmark, dengan turunan TOC FIX-TL). Peran sampul tidak ada di katalog, jadi lapisan benchmark wajib ada. |
| 3 | Perbaikan | selesai | HTML memanggil resolver DOCX yang sama (impor, tanpa salinan logika). Rantai dipilih per lingkup: `wrapperScope`/`blockScope` |
| 4 | Celah lanjutan yang terbuka karena fallback | selesai | Kelas `st-face-*` tidak punya aturan CSS. Sebelum perbaikan kelas ini hampir tidak pernah muncul (0 di Manual 000, 1 di nota_memo). `runStyle` kini menulis keluarga peran `type.face.<peran>` inline (setara rFonts DOCX) |
| 5 | Uji regresi + 2 asersi usang | selesai | eng01 (6 uji) merah tanpa perbaikan (4 gagal) dan hijau dengan perbaikan |
| 6 | Gerbang | selesai | lihat Test Results |
| 7 | DEV + Playwright | selesai | sampul sebelum/sesudah |

## Changes Made

| File | Change Type | Description |
|---|---|---|
| src/lib/studio/engine/html/blocks/style.ts | modify | `roleFormat(ctx, role)`: lingkup pembungkus + peran pembungkus memakai DOCX `wrapper/formats` roleFormat; selain itu `tokens.resolveRoleFormat`. Galat resolusi dicatat ke log render `RENDER_ROLE_FORMAT_FALLBACK` (warn), lalu format templat saja dipakai. Fungsi baru `wrapperScope`/`blockScope` (WeakMap, konteks dasar tidak diubah). `runStyle(p, delta, tpl?)` menulis `font-family` keluarga peran untuk `faceRole` |
| src/lib/studio/engine/html/blocks/wrapper.ts | modify | Renderer cover/controlSheet/toc/partDivider/signatureBlock berjalan dalam `wrapperScope`. Unsur `body[]` selain paragraf didelegasikan dengan `blockScope` (setara DOCX `delegateBlock`; spacer tanpa peran). `tocCellHtml`: `own` = sub-objek yang ditulis templat, `parent` = format efektif (setara FIX-TL DOCX) |
| src/lib/studio/engine/html/blocks/text.ts | modify | `renderAppendix` dalam `wrapperScope` (setara DOCX `renderAppendixOpener`); `runStyle(..., ctx.tpl)` |
| src/lib/studio/engine/html/blocks/common.ts | modify | `el()`: `runStyle(run, 0, ctx.tpl)` |
| tests/unit/studio/renderers/eng01-role-format-fallback.test.ts | add | Paritas HTML dengan XML DOCX (ukuran, spasi baris tepat, tebal, warna, wajah) untuk judul sampul, standfirst, kicker dan judul halaman depan, judul blok kendali, dan judul bab (rantai blok, bukan benchmark). Juga menguji bahwa roleFormats templat menang per sub-objek, dan bahwa gaya judul Manual 000 sama byte dengan keluaran sebelum perbaikan |
| tests/unit/studio/renderers/fixserah-front-apparatus.test.ts | modify | Hanya 2 regex yang mengunci HTML kanonik tanpa gaya pada `toc.partLabel`/`wrapper.kicker`. Kini kelas dan `style` opsional diterima |
| tests/unit/studio/renderers/fixtl-toc-levels-roles.test.ts | modify | Hanya 1 asersi: section kanonik `calc(1em - 1pt)` diganti menjadi ukuran bab efektif - 1 pt (sama dengan asersi Manual 000 dan DOCX) |

Resolver DOCX (`docx/wrapper/formats.ts`, `tokens/index.ts`) hanya diimpor dan tidak diubah. Tidak ada berkas DOCX yang berubah.

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Unit studio penuh | `npx vitest run tests/unit/studio` | 167 berkas, 3586 lulus / 1 dilewati / 0 gagal | sudah termasuk paritas teks HTML=DOCX (fix2-wrapper-text-parity dll.) |
| Regresi eng01 | `npx vitest run tests/unit/studio/renderers/eng01-role-format-fallback.test.ts` | 6/6 | tanpa perbaikan: 4 gagal, 2 lulus (prasyarat + Manual 000 tetap) |
| Typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | |
| Lint | `npx eslint src/lib/studio/engine tests/unit/studio/renderers` | 0 galat | 1 peringatan lama di fixf-spine-text.test.ts (bukan milik baris ini). `npx eslint` seluruh repo: 295 galat lama di src/app, src/components, tests/unit/studio/api, tidak satu pun di berkas baris ini |
| convert_v2 | `npx tsx --tsconfig tsconfig.json benchmark/extract/convert_v2.ts --check` | SAME x3 | doc.v2 79290e07…, template.v2 882057c5…, preset a951b149… |

## Verification

SHA benchmark, diukur sebelum dan sesudah di pohon kerja yang sama dengan `npx tsx scripts/parity/run/render_cli.ts --doc <doc> --template <tpl> --formats docx,html`:

| Templat | DOCX sebelum = sesudah | HTML sebelum | HTML sesudah |
|---|---|---|---|
| Manual 000 v1 (`doc.json` + `template.json`) | `38b489b97677a98d…` SAME | `e05a18f24291311e…` | `e05a18f24291311e…` SAME |
| Manual 000 v2 (`doc.v2.json` + `template.v2.json`) | `5cbdc81e7214624b…` SAME | `abdbc9a2c76f1e1f…` | `abdbc9a2c76f1e1f…` SAME |
| DATUM-kanonik (`doc.json` + `datum-kanonik`) | `fa14e5b4c0ea14a8…` SAME | `dc6dd8bcc83a9903…` | `b66c51258ef10de1…` (berubah, perbaikan sah D-463) |

- Diff HTML kanonik hanya menyentuh gaya peran. Dibandingkan sebelum dan sesudah: teks polos SAME, kerangka tag non-span tanpa atribut style/class SAME, blok `<style>` SAME. Yang berubah hanya `style`/`class` pada elemen ber-peran dan span run turunannya, ditambah span pembungkus `calc(1em - 1pt)` TOC section yang hilang dan span penanda daftar yang kini bergaya katalog. Pemeriksaan yang sama pada e1 kanonik dan 4 fixture paritas memberi hasil SAME untuk ketiga kriteria. e1 dengan Manual 000 byte-identik.
- DEV `http://127.0.0.1:9021/studio/templates/cmvjtout80000v1cgddcka87a` (DATUM-kanonik, `validate` 200). Pratinjau sebelum (HTML pratinjau DEV yang disimpan UI-02): kedua baris judul 25,33 px dengan line-height 18 px, top 238 dan 256 (baris bertumpuk), kicker menimpa judul, wajah IBM Plex Serif. Pratinjau sesudah: 32 px (24 pt) dengan line-height 38,67 px (29 pt), top 318 dan 356 (tidak bertumpuk), kicker berakhir di 309 sebelum judul di 318, wajah IBM Plex Sans Condensed 600. Tangkapan layar: `C:/Users/TRIAL/AppData/Local/Temp/ui_audit/after/eng01_before_cover.png`, `eng01_after_cover.png`, `eng01_after_dev_template_page.png`. Skrip: `C:/Users/TRIAL/AppData/Local/Temp/eng01_js/cover_shots.js`. Rahasia dibaca dari env `ENG01_SECRET` (substitusi `$(cat …)`, tidak dicetak), dan header hanya dipasang lewat `context.route` untuk `http://127.0.0.1:9021/`.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| Tangkapan "sebelum" bukan dari server yang berjalan | 0 | DEV `next dev` memuat ulang otomatis. Membalik berkas mesin bersama selama agen paralel bekerja berisiko | "Sebelum" memakai HTML pratinjau DEV pra-perbaikan yang disimpan UI-02 (`Temp/ui02_js/out/canon.html`), dirender dengan harness yang sama | Tidak |
| Tabel HTML (`html/tables`) di dalam halaman pembungkus memakai rantai katalog, sedangkan DOCX `frontTableXml` memakai rantai pembungkus | 0 | Pemilik berkas berbeda (`html/tables/style.ts` `role()`). Di luar gejala UA-M02 | Tercatat, tidak diubah | Tidak |
| Run sebaris md-lite (`inline.ts` runHtml, mis. kode dengan `faceRole: mono`) tetap hanya mendapat kelas `st-face-*` tanpa aturan CSS | 0 | Celah lama: runHtml tidak menerima konteks templat | Tercatat (1 elemen di nota_memo sebelum perbaikan) | Tidak |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| 2 | Hanya `resolveRoleFormat` tidak cukup: `cover.titleFirst` tidak ada di katalog `ROLE_SPECS`, dan DOCX mengisinya dari benchmark pembungkus | Rantai dipilih per jalur pemanggil, sama dengan DOCX: halaman pembungkus = `wrapper/formats` roleFormat, blok isi = `resolveRoleFormat`. Memilih per peran ditolak karena akan memberi benchmark ke `body.paragraph`/`chapter.title` interior, padahal DOCX tidak |
| 3 | Resolver bersama | Tidak diekstrak. HTML mengimpor fungsi DOCX yang sudah ada (HTML sudah mengimpor `docx/wrapper/toc-refs` dan `docx/blocks/rail`), jadi satu sumber tanpa duplikasi dan tanpa sentuhan DOCX |
| 4 | Wajah peran (font-family) di luar teks harfiah brief | Diperbaiki karena fallback menghasilkan 14 sampai 112 kelas `st-face-*` per dokumen tanpa aturan CSS, sehingga judul tetap serif. Penulisan inline hanya menyentuh elemen ber-faceRole, jadi Manual 000 tetap byte-identik. Mohon controller menerima atau menolak secara eksplisit |
| 5 | 2 berkas uji milik baris lama (FIX-SERAH, FIX-TL) mengunci keluaran HTML kanonik pra-perbaikan | Hanya asersi itu yang diubah ke nilai paritas DOCX, dan sudah dideklarasikan di file_claims. Asersi DOCX di berkas itu tidak disentuh |

## Next Steps

- review recommended (lingkup: `src/lib/studio/engine/html/blocks/{style,wrapper,text,common}.ts`, `tests/unit/studio/renderers/eng01-role-format-fallback.test.ts`, 2 asersi di fixserah/fixtl).
- Opsional, baris lanjutan: rantai pembungkus untuk tabel HTML di halaman depan (`html/tables`), dan aturan wajah untuk run md-lite.
