---
task_id: UI-04
task_slug: doc_artifact_studio
row: UI-04 (UI-04a..UI-04e + Low murah)
date: 2026-11-01
agent: coder-execution
source_plan: docs/2026-10-22_doc_artifact_studio/decisions/decisions.md (D-464); gateway_check/17_review_ui.md
status: complete
---

# Implementation Report: UI-04 perbaikan teks/label UI Studio (review UI-03)

Skill: `frontend-design` (gaya yang ada, tanpa desain baru), `dry-run-verify-fix`. Hanya teks/label/tooltip UI: kunci, nilai enum, tipe, data, API, kontrak, mesin tidak berubah (`convert_v2 --check` SAME x3).

## Executed Steps
| Step | Task | Status | Notes |
|---|---|---|---|
| UI-04a | H-1 daftar isi | selesai | Bukti mesin: `engine/docx/wrapper/pages.ts:384-405` (statis: kolom halaman literal atau PAGEREF), `:408-447` (medan TOC + PAGEREF), HTML `engine/html/blocks/wrapper.ts:485-507` (tabel 3 kolom apa pun mode; mode tidak dibaca) |
| UI-04b | M-1 satuan | selesai | 12 param tanpa satuan kini mempertahankan "(mm)/(derajat)"; pair/range menampilkan satuan turunan di samping kotak |
| UI-04c | M-2 ID mentah | selesai | `title="ID: <mentah>"` di semua permukaan nama agen/misi; kalimat `title`/`aria`/alasan memuat "(ID: ...)" |
| UI-04d | M-3 klaim admin | selesai | Tidak ada kanal pemberitahuan (hanya `apiLog` di `render-env/route.ts:106,118`); teks diganti kalimat yang benar |
| UI-04e | M-4 teks tepi sampul | selesai | Bantuan mengikuti `page.ts:313-330` (medan tanpa "nomor"; penempatan sampul + pembatas) |
| Low | L-1, L-3, L-4, L-8 | selesai | L-2, L-5, L-6, L-7, L-9 ditunda (lihat Issues) |

## Changes Made
| File | Change Type | Description |
|---|---|---|
| src/lib/studio/registry/essentials.ts | modify | EK-toc-01 label/bantuan/opsi (H-1); EK-cover-06 bantuan (M-4) |
| src/lib/studio/params/render.ts | modify | label `render.toc.mode` = "Bentuk daftar isi di Word"; `render.rail.renderer` istilah (L-1) |
| src/lib/studio/params/page.ts | modify | L-1: label Datum Rule -> "garis penanda", Rel bukti -> "kolom catatan bukti", string punggung -> "teks tepi sampul", kicker -> "teks jenis dokumen" (hanya argumen label) |
| src/lib/studio/params/color-type.ts | modify | L-1: "Wajah huruf" -> "Jenis huruf" (P4T-02..05), P4T-15, color.wrapper.meta (hanya label) |
| src/components/studio/template-editor/param-labels.ts | modify | `paramDisplayLabel(key,label,shownUnit?)` buang akhiran hanya bila satuan sama tampil; `derivedUnit()` baru |
| src/components/studio/template-editor/param-editor.tsx | modify | kirim `unitOf(def.type)` ke label |
| src/components/studio/template-editor/param-control.tsx | modify | TwoNumberControl: satuan turunan tampil + aria "Lebar (mm)" |
| src/components/studio/section-composer/advanced-panel.tsx | modify | label mempertahankan satuan (nilai mentah) |
| src/components/studio/shared/labels.ts | modify | `rawIdTitle`, `withRawId`, `actorLabelWithId` |
| src/components/studio/shared/raw-id.tsx | add | `ActorName`, `MissionName` (span + title ID mentah) |
| completeness-tab.tsx, completeness-rail.tsx, history-tab.tsx, paragraph-history.tsx, document-list.tsx, meta-panel.tsx, studio-home.tsx, gallery.tsx, playground/panels.tsx, playground/playground.tsx, template-list.tsx, version-history.tsx, model.ts | modify | M-2 ID mentah; rail aria-label = hitung bagian wajib (L-3); studio-home M-3 |
| src/components/studio/render-status/index.tsx | modify | M-3 kalimat |
| src/components/studio/template-editor/role-formats-editor.tsx | modify | L-4 pesan batas jarak baris mengikuti aturan baris |
| src/components/studio/template-preview/index.tsx | modify | L-8 buang `aria-pressed` (teks tombol berganti) |
| tests/unit/studio/ui04/ui04-text-fixes.test.ts | add | 14 uji (H-1, M-1 probe 0/12 hilang, M-2 permukaan, M-3, M-4, L-1, L-3) |

## Test Results
| Test Type | Command | Result | Notes |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit -p .` | rc 0 | seluruh repo 0 galat (termasuk MCP-04/ENG-01 saat ini) |
| Lint | `npx eslint src/app/studio src/components/studio src/lib/studio/registry src/lib/studio/params tests/unit/studio/ui02 tests/unit/studio/ui04` | rc 0 | |
| Unit ui02+ui04 | `npx vitest run tests/unit/studio/ui02 tests/unit/studio/ui04` | 3 berkas, 42/42 lulus | ui02 28 + ui04 14 |
| Unit Studio | `npx vitest run tests/unit/studio` | 168 berkas lulus; 3600 lulus / 1 skip / 0 gagal | siklus 1 gagal 1 (`api-structure/fixf-completeness-filler-label.test.ts` mengunci literal `Diisi oleh ${actorLabel(s.lastFilledBy)}`) -> bentuk teks dipertahankan, ID lewat `title` pada `<p>` |
| Render tak berubah | `npx tsx benchmark/extract/convert_v2.ts --check` | SAME x3 | doc.v2 79290e07…, template.v2 882057c5…, preset a951b149… |

## Verification
- Tangkapan sesudah (DEV 127.0.0.1:9021, `next dev` dari repo; rahasia lewat `context.route` pw_common, tidak dicetak): `C:/Users/TRIAL/AppData/Local/Temp/ui_audit/after_ui04/` — 11 layar x desktop/ponsel + `x_t1_sections_toc.png` (kenop "Bentuk daftar isi di Word"), `x_t1_sections_spine.png`, `x_document_tab_kelengkapan.png`; data `audit_ui04.json`, `audit_ui04_b.json`. Semua HTTP 200, 0 galat konsol; teks "diberi tahu"/"tanpa nomor halaman" tidak ada di layar mana pun; elemen `title="ID: ..."`: beranda 13, templat 4, versi 6, dokumen 36, riwayat 17, kelengkapan 5.
- Batas: viewer DEV = USER, editor parameter (admin) tidak tampil, sehingga `page.customSizeMm` hanya terverifikasi lewat uji (probe registri 0 label kehilangan satuan) — keterbatasan sama dengan UI-02. Panel status admin (render-status) juga hanya lewat uji teks sumber.

## Persistent Issues
| Issue | Attempts | Root Cause | Current Status | Blocking? |
|---|---|---|---|---|
| - | - | - | - | Tidak |

## Issues & Decisions
| Step | Issue / Decision | Resolution |
|---|---|---|
| H-1 | Label kenop "Tampilkan teks tepi sampul" dipertahankan (dikunci uji ui02); bantuan menjelaskan pembatas | M-4 diselesaikan di bantuan |
| M-1 | `paramDisplayLabel` tanpa argumen ke-3 = perilaku UI-02 (uji ui02 tetap) | pemanggil editor/panel lanjutan memberi satuan tampil |
| L-2 | "Selalu tampil (kolom 32 mm)" dikunci literal oleh `ui02-config-labels.test.ts:56` (bukan milik UI-04) | DITUNDA: perlu izin ubah uji ui02 |
| L-5 | Hipotesis kaskade DOCX belum dikonfirmasi | DITUNDA |
| L-6 | Dedup deskripsi templat UI vs seed + peta kelompok | DITUNDA (refaktor, bukan teks) |
| L-7 | Iframe pratinjau dimuat ulang saat skala berubah | DITUNDA (perilaku, bukan teks) |
| L-9 | Pindah `param-labels.ts` ke `shared/`; komentar/judul uji engine basi | DITUNDA (engine milik ENG-01; refaktor) |

## Next Steps
- Review recommended (senior-code-reviewer) atas diff UI-04; keputusan controller untuk L-2 (ubah asersi ui02).
