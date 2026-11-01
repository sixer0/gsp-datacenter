---
task_id: UI-02
task_slug: doc_artifact_studio
row: UI-02
date: 2026-11-01
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/review/ui_audit_studio.md (§4) + decisions D-449, D-459
status: complete
---

# Laporan Implementasi: UI-02 perbaikan UI Studio sesuai audit UI-01

Skill: `diagnosing-bugs` (UA-M02), gaya design system yang ada (token `--text/--line/--accent`, `Pill`, `Panel`; tanpa design system baru), `dry-run-verify-fix`.

## Executed Steps

| Step | Task | Status | Notes |
|---|---|---|---|
| 1 | Baca audit, keputusan, kode Studio | selesai | §4 P1/P2/P3 + tabel L01-L43 |
| 2 | Diagnosis UA-M02 (loop umpan balik Playwright) | selesai | akar di mesin render -> temuan berpemilik (lihat di bawah); mesin TIDAK diubah |
| 3 | P1 | selesai | UA-M01, UA-M03, UA-M05, UA-M12, L26, L01/L05/L07-L10 (+L03/L04/L06/L11 bantuan) |
| 4 | P2 | selesai (sebagian ditunda) | UA-M06, UA-M07, UA-M04 (ringkas), UA-M10/L41-L43, L21, L23-L25 |
| 5 | P3 murah | selesai | L12-L20, L22, L27-L40 (termasuk batas skema L33/L34 dan medan smallCaps L36), UA-m01/m03/m05/m06/m07/m08/m09/m10/m12/m13/m15 |
| 6 | Uji ui02 + gerbang | selesai | tsc 0, eslint 0, vitest studio hijau, convert_v2 --check SAME x3 |
| 7 | Audit Playwright ulang + perbandingan | selesai | `C:/Users/TRIAL/AppData/Local/Temp/ui_audit/after/` |

## Diagnosis UA-M02 (sampul pratinjau DATUM-kanonik bertumpuk)

- Loop (merah): `node AppData/Local/Temp/ui02_js/m02_probe.js` (simpan `previewHtml` respons `validate?preview=html` untuk templat kanonik `cmvjtout…` dan non-kanonik `cmvuxaybr…`) lalu `m02_measure.js` (ukur sampul tanpa server). Gejala terukur: `span.st-cover-title-line` font 25,33 px dengan line-height 18 px -> baris judul bertumpuk (top 238 vs 256, tinggi 36), kicker (top 229) menimpa judul, semua teks `IBM Plex Serif` cadangan, `.st-spine` hanya `writing-mode` tanpa posisi.
- Diferensial: HTML kanonik 3 elemen ber-`style` dari 90 elemen ber-`data-role` (hanya `wrapper.sealBand`); HTML non-kanonik 19/19 ber-style. Badan permintaan UI keduanya tanpa `roleFormats` -> lapisan UI/pratinjau BUKAN penyebab (server mengambil format peran dari preset).
- Akar: `src/lib/studio/engine/html/blocks/style.ts:30-33` `roleFormat()` hanya membaca `ctx.tpl.roleFormats[role]` tanpa turunan katalog, sedangkan DOCX memakai `resolveRoleFormat` (`engine/tokens/index.ts:151-153`, katalog `type.scale.*` + overlay). Preset `datum-kanonik-preset` v1 tidak membawa `roleFormats` eksplisit (murni katalog) -> HTML tanpa gaya peran; `<h1 class="st-h st-cover-title">` (`engine/html/blocks/wrapper.ts:308`) tanpa gaya jatuh ke bawaan peramban 2em + line-height badan. Templat GSP DATUM (preset v2 ber-roleFormats) tidak terdampak, dan templat non-kanonik yang diaudit tidak punya sampul (diferensial audit terkacau).
- Pratinjau dan render nyata memakai perakit yang sama (`engine/html/assemble/index.ts:196 assembleBody`, flag `preview`) -> HTML berkas dokumen ber-preset kanonik juga terdampak (DEV belum punya dokumen bertemplat kanonik untuk bukti langsung; hipotesis lanjutan berlabel).
- Status: **temuan berpemilik mesin render (engine/html/blocks)**, tidak diperbaiki di UI-02. Usulan untuk pemilik mesin: `roleFormat()` HTML memakai `resolveRoleFormat` (paritas DOCX), lalu gerbang `convert_v2 --check` + paritas HTML Manual 000.

## Changes Made

| File | Change Type | Description |
|---|---|---|
| src/components/studio/template-preview/preview-html.ts | modify | `maxPageWidthMm`, `fitZoom`, `previewSrcDoc(html, unit, zoom)` menyisipkan `html{zoom}` (iframe tetap tanpa skrip) |
| src/components/studio/template-preview/index.tsx | modify | ResizeObserver di induk, tombol "Ukuran asli (100%) / Sesuaikan lebar", teks bantuan tingkat terbitan (UA-m12) |
| src/components/studio/document-viewer/doc-model.ts | modify | `changedLabel` dedup setelah pemetaan; `isAutoChangeWhy`; `fileFormatsNote` |
| src/components/studio/document-viewer/history-tab.tsx | modify | "Mengapa" bawaan otomatis disembunyikan (mentah ke Info teknis), tombol versi lama dalam menu "Tindakan", "Status saat itu: …" |
| src/components/studio/shared/completeness-text.ts | add | `requiredProgress`/`progressText` ("6/6 bagian wajib terisi · 1 opsional kosong") |
| src/components/studio/shared/completeness-rail.tsx, document-viewer/document-list.tsx | modify | satu indikator (tanpa "Lengkap" ganda), legenda bilah, nama pelaku ber-tooltip |
| src/components/studio/shared/labels.ts | modify | `agentDisplayName`, seed -> "Sistem (bawaan)", `templateDescription` (peta awam 7 templat bawaan) |
| src/components/studio/template-editor/role-format-labels.ts | add | format jarak baris per lineRule, label enum/peran/kelompok peran |
| src/components/studio/template-editor/role-formats-editor.tsx | modify | L26-L40: label dinamis jarak baris, batas skema (lineTw 20-1440, ukuran 4-72 pt, jarak antarhuruf -200..400), Kapital kecil, label awam utama + kunci kecil |
| src/components/studio/template-editor/param-labels.ts | add | label tanpa akhiran satuan, label enum dari kenop esensial, Lebar/Tinggi, rentang tanpa ∞, nama kelompok |
| src/components/studio/template-editor/param-control.tsx, param-editor.tsx, shared.tsx, param-rules.ts | modify | L12-L20, L23-L25: kelas awam, "diubah di templat", Info teknis per baris, "Nilai gaya"/"Kembalikan ke nilai gaya", alasan kunci awam |
| src/components/studio/section-composer/advanced-panel.tsx | modify | cari juga label, label + kunci kecil, placeholder "Tanpa batas" |
| src/lib/studio/registry/essentials.ts | modify | L01, L03-L11 label/bantuan/opsi (nilai simpan tidak berubah) |
| src/lib/studio/params/{page,render,color-type,structure,apparatus,figure,governance-language}.ts | modify | HANYA `label`: 14 kunci disamakan dengan label kenop (L21) + 8 jargon (L22) |
| src/components/studio/template-editor/{model,template-list,style-picker,template-editor,template-stepper}.tsx/ts | modify | "#B45309", `creatorLabel` via actorLabel, deskripsi awam line-clamp-2 (asli di tooltip), teks pratinjau, isyarat geser ponsel |
| src/components/studio/document-viewer/{completeness-tab,output-files,studio-home,studio-subnav,create-document-dialog,reader/reader-tab}.tsx, render-status/index.tsx, artifact-gallery/{gallery,create-panel}.tsx, playground/{playground,controls}.tsx, src/app/studio/layout.tsx | modify | jam tanpa inisial, format berkas nyata, pesan mesin cetak konsisten, H1 non-admin, spasi heading, `lang="id"` wadah Studio, placeholder, "tab Buat artefak" |
| prisma/seed-studio.ts | modify | HANYA teks `description` (6) -> kalimat awam; seed TIDAK dijalankan (data DEV tidak diubah; UI memetakan) |
| tests/unit/studio/ui02/ui02-history-and-names.test.ts, ui02-config-labels.test.ts | add | 28 uji |

## Test Results

| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0 | 109 berkas src/components/studio dalam daftar |
| Lint | `npx eslint src/app/studio src/components/studio src/lib/studio/registry src/lib/studio/params tests/unit/studio/ui02 prisma/seed-studio.ts` | rc 0, 0 pesan | |
| Unit ui02 | `npx vitest run tests/unit/studio/ui02` | 2 berkas, 28 lulus | dedup riwayat, jarak baris, nama tampilan, label, skala, kelengkapan |
| Unit studio penuh | `npx vitest run tests/unit/studio` | 165 berkas, 3554 lulus, 1 skip, 0 gagal | termasuk uji lama `actorLabel('agent:analis-01') = 'Agen analis-01'` |
| Render tidak berubah | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 | doc.v2 79290e07…, template.v2 882057c5…, preset a951b149… |
| Visual | `node AppData/Local/Temp/ui02_js/rerun/{shoot,interact,steps}.js` (dari `C:/Users/TRIAL`) | 24 halaman 200, overflow-x 0 | konsol: hanya 401 /api/auth/me (2/halaman, sama dengan sebelum); interact `errs []` |

## Verification

- UA-M01: `after/x_template_preview_iframe.png` + `_mobile.png` vs sebelum: halaman A4 utuh dalam panel 384/322 px ("Diperkecil 46%").
- UA-M03/M04/m15: `after/_cmp_revs.png`; teks halaman riwayat "Catatan Laporan, Catatan Laporan" 3 -> 0, "Kiriman agen (otomatis)" 16 -> 0, "Status saat itu" 0 -> 15; tinggi halaman 3207 -> 2703 px.
- UA-M05/M06/m13: `after/_cmp_docs.png`; "hermes-gsp-master01" 9 -> 0, "GSP Master 01" 0 -> 6, "bagian wajib terisi" 0 -> 21, legenda tampil.
- UA-M07/M06: `after/_cmp_tpls.png`; "673 parameter|lint.enforcementOverride|CK-01" 3 -> 0, "seed-studio" 4 -> 0.
- UA-M12: home "hubungi admin" 1 -> 0; Sistem "halaman Sistem" 1 -> 0.
- Kenop esensial: teks editor memuat "Kolom catatan bukti", "Garis penanda", "#B45309", "Nota = catatan internal".
- Permukaan khusus admin (format per peran, Pengaturan lanjutan, panel bagian) tidak dapat ditangkap (401 /api/auth/me, rahasia internal bukan sesi): diverifikasi lewat tsc/eslint + uji unit fungsi label.

## Persistent Issues

| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| UA-M02 sampul kanonik bertumpuk | diagnosis 1 (akar terbukti) | `engine/html/blocks/style.ts` tanpa turunan katalog roleFormats | temuan berpemilik mesin render; tidak diubah | Tidak untuk UI-02 |

## Issues & Decisions

| Step | Issue / Decision | Resolution |
|---|---|---|
| P2 UA-M06 | Uji lama mengunci `actorLabel('agent:analis-01') = 'Agen analis-01'` | Hanya prefiks runtime `hermes-` dibuang + profil `gsp-*` dibaca sebagai nama; ID lain apa adanya (registri `/api/agents` tidak punya nama tampilan lebih baik) |
| P2 UA-M06 | Judul misi tidak ada sumbernya | Slug misi tetap via `missionLabel` (ditunda; perlu sumber judul misi) |
| P2 UA-M07 | Deskripsi DB DEV berbeda dari seed (mis. datum-kanonik) | Seed TIDAK dijalankan (menghindari efek versi); peta tampilan di UI + teks seed diperbarui untuk instalasi baru |
| P2 L21 | Satu sumber label | Label registri `params/*.ts` diselaraskan dengan kenop (teks saja; kunci/nilai/tipe tidak berubah); convert_v2 SAME |
| P2 L23-L24 | Usulan audit `enumLabels`/`pairLabels` di `ParamDef` = perubahan kontrak | Tidak menambah medan kontrak; peta di UI (`param-labels.ts`) dari kenop esensial |
| P3 | Ditunda | UA-M04 pengelompokan kiriman beruntun; UA-M07 thumbnail gaya; UA-M08 sisa (grup bab katalog); UA-M11 formulir artefak terstruktur; UA-m02 sidebar shell (di luar cakupan); UA-m04 hanya-baca ganda; UA-m11 satuan dari tipe registri (rentang kini di teks bantuan); UA-m14 kapitalisasi label slot (data kerangka); UA-m16 tombol editor paragraf; `lang` root `src/app/layout.tsx` (di luar kepemilikan; diganti `lang="id"` pada wadah Studio) |

## Next Steps

- Pemilik mesin render: perbaikan UA-M02 (`roleFormat` HTML -> `resolveRoleFormat`).
- Verifikasi visual permukaan admin dengan sesi admin sah.
- review recommended (lingkup: src/components/studio/template-editor/*, template-preview/*, labels.ts, registri label params).
