---
row: FIX-R
date: 2026-10-23
agent: coder-execution
status: complete
source: D-250 (F-068, F-069), test/12_rerun_s74.md (F-SR43-1, F-SR43-2)
---

# FIX-R: override inline R09 (F-068) dan EC06 kerangka implisit (F-069)

## Perubahan (area eksklusif, tulis atomik tmp -> rename)

| Berkas | Jenis | Isi |
|---|---|---|
| `src/lib/studio/services/render/common.ts` | ubah | `gateInlineDocOverrides(base, doc, caller, {trusted, pointer})` + `InlineOverrideGate`. Merangkai sumber aturan ingest yang sudah ada (tanpa salinan): `effectiveInlinePolicy` (adapt-v1, `allow` hanya tepercaya), `checkOverrideRights` (engine/tokens, sama dengan `ingest/v2.ts:636`), `checkTemplateWrite` (skeleton/access: K, T, PARAM_SURFACE_FORBIDDEN per peran, D-134). Selain `allow` efektif semua override dikupas (KD-26, D-179, D-210), juga bagi ADMIN bila kebijakan `strip`. |
| `src/lib/studio/services/render/artifact.ts` | ubah | `gateHtmlArtifact` memanggil `gateInlineDocOverrides` untuk SEMUA pemanggil sebelum mengupas penanda; `HtmlArtifactGate.overridesStripped` baru; `renderHtmlArtifact` mencatat peringatan job `INLINE_FORMAT_STRIPPED` dengan pointer kunci. `templateForDoc` hanya menerima dokumen yang sudah digerbang. |
| `src/lib/studio/services/compose/structure.ts` | ubah | Kerangka implisit (per tier, §6.3): slotKey implisit registri (`SLOT_KINDS.implicitSlotKey`) yang absen -> 422 `SLOT_FORBIDDEN_FOR_TIER` `{slotKey, tier, activeTiers}` (EC06), di isi slot dan `structure.order`. Kerangka eksplisit tetap `SLOT_UNKNOWN` untuk kunci absen. `activeTiers` = tier aktif registri tanpa tier dokumen (kerangka implisit tidak membawa rencana tier lain). |

## Bukti

- `npx vitest run tests/unit/studio/api/`: sebelum 8 gagal / 380 lulus; sesudah **4 gagal / 384 lulus (388)**. `artifacts.test.ts:104` x3 dan `ingest.test.ts:128` lulus. Sisa 4 = `revisions.test.ts:266` x4 (F-065, milik FIX-S).
- Probe (vitest di scratchpad, fixture `tests/unit/studio/api/_studio.ts`, `templateForDoc(gate.baseTpl, gate.inlineDoc).params`), format [sebelum, sesudah]:
  - USER, kebijakan strip, `naming.underscore.allowed` (K): [false, false], dikupas.
  - ADMIN, strip: [false, false], dikupas (sama dengan ingest).
  - USER, templat `allow`: [false, false], dikupas (allow diturunkan ke strip).
  - ADMIN, `allow`: [false, true], jalur tepercaya tetap bekerja.
  - harness + USER, `allow`, `type.scale.chapterTitle.face` (B, lapis advanced): [condensed, condensed], dikupas (PARAM_SURFACE_FORBIDDEN).
  - ADMIN, `allow`, kunci advanced yang sama: [condensed, serif].
- `npx eslint` 3 berkas area: exit 0.
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di berkas area. Repo saat ini 27 galat di luar area, keduanya diubah agen lain pukul 08:30: `src/lib/studio/services/ingest/v2.ts:222,226,227` (`ResolvedTemplate.slug`, FIX-S) dan `tests/integration/studio/studio-db.integration.test.ts` (24x TS18048). Gerbang "tsc repo 0" belum terpenuhi karena kedua berkas itu.
- `npx vitest run tests/unit/studio/structure/`: lulus (termasuk `slot-rules.test.ts`). Gagal di `api-structure/` (8) disebabkan pekerjaan FIX-S yang sedang berjalan (`withDocV2Targeting is not a function` di `documents/route.ts:319`, medan render D-247), bukan oleh berkas FIX-R.

## Issues & Decisions

| Butir | Keputusan / catatan |
|---|---|
| Satu sumber aturan | Ingest (area FIX-S) masih menulis 2 baris parse kebijakan `ingest.inlineFormat` sendiri (`ingest/v2.ts:628-629`). Helper FIX-R mengulang parse 2 baris itu karena ingest bukan area FIX-R. Usul: FIX-S/pemilik ingest memakai `gateInlineDocOverrides` atau memindahkan parse ke `adapt-v1`. |
| Lapis vs ingest | Saringan lapis (`checkTemplateWrite`) lebih ketat daripada ingest v1 `allow` (ingest hanya `checkOverrideRights`). Akibatnya harness dengan peran non-ADMIN di bawah `allow` kehilangan kunci advanced saat render inline, padahal ingest menyimpannya. Ini disengaja sesuai brief ("di luar permukaan peran pemanggil"). |
| Spec artefak tersimpan | `prepare.ts` tetap menyimpan spec verbatim beserta `overrides`. Render ulang selalu lewat `gateHtmlArtifact`, jadi override yang dikupas tidak pernah diterapkan. Penyimpanan verbatim di luar area FIX-R. |
| Kompatibilitas F-069 | Kiriman v1 NOTA yang membawa `front.controlSheet` tetap 422; yang berubah hanya kodenya (`SLOT_UNKNOWN` -> `SLOT_FORBIDDEN_FOR_TIER`). |

## Berkas sementara

Tidak ada sisa `.fixr.tmp`. Probe hanya di scratchpad sesi, tidak di repo.
