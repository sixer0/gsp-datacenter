---
row: SR-06
agent: coder-execution
date: 2026-10-23
status: complete
---

# SR-06 Layanan kerangka (`src/lib/studio/services/skeleton/**`)

- Berkas baru: `index.ts` (barrel), `pure.ts` (tanpa DB, untuk SR-33), `access.ts` (checkTemplateWrite per kunci berubah, urutan 1-7 §13.5, aturan per kenop D-170/D-171 lewat `isEssentialFieldPath`), `skeleton.ts` (kanonik + configSha256/skeletonSha256, `implicitSkeleton`, `validateSkeleton` SKELETON_*/SLOT_DUPLICATE/scope/T, `skeletonEssentials`, `skeletonParamChanges`), `resolve.ts` (`resolveSlotParams`/`resolveSkeletonSlots`: berlapis registri <- preset <- templat <- slot -> `deriveLayered` SEKALI, pinPolicy reference D-169; jalur cepat tanpa DB = timpa kunci slot + `computeDerivedWith` + skala tab R-30), `repository.ts` (`getSkeleton`, `getTemplateSkeleton` untuk R19 GET, `loadTemplateLayers`, `resolveSlotsForVersion`, `writeSkeleton(tx, …)` M10-M12 + MX02), `log.ts` (JSONL harian `logs/skeleton/`).
- Gerbang: tsc repo 9 galat, 0 di `services/skeleton` (sisanya milik baris paralel: submit/structure/revisions route, templates/index.ts `loadResolvedTemplateV2File` SR-07, assemble/index.ts `hostCellRole` SR-16, render/scope.ts SR-15); `npx eslint src/lib/studio/services/skeleton` exit 0.
- Asap (`tsx`, DB `gsp_agent_hq_v21`, current_database dicek): 40 PASS / 0 FAIL. Kerangka implisit datum-kanonik v5 NOTA/TERBIT/SERAH = urutan `orderedPlanSections` (TERBIT: cover, controlSheet, toc, signature, content, appendices, references, ruleIndex). Per kenop: USER `slot.setup.startOnNewPage` OK, `slot.setup.marginTw` 403 PARAM_SURFACE_FORBIDDEN, ADMIN marginTw OK, `pageSizeTw` 400, `page.size` di slot 422 SLOT_PARAM_SCOPE_INVALID, preset 403 PRESET_READONLY, K 403. Tulis kerangka GSP 7 slot di transaksi rollback: sha tulis = baca ulang, tulis ulang 409 VERSION_CONFLICT, hitungan sebelum = sesudah (slot 0, versi 8, templat 3).

## Keputusan untuk controller
1. Urutan kerangka implisit = `orderedPlanSections` minus forbidden minus non-C33 (verifikasi blueprint), BUKAN teks register §6.3 "order lalu required lalu optional" (beda nyata di TERBIT/SERAH: signature sebelum content). Usul amandemen register §6.3.
2. PUTUSAN controller (diterapkan): tulis kunci turunan (dihitung/beracuan) selain ADMIN-pada-preset -> 400 PARAM_CLASS_T_READONLY di tahap 4 (D-165 KT-4); 403 PARAM_SURFACE_FORBIDDEN hanya lanjutan/internal oleh non-ADMIN. Asap ulang 43 PASS / 0 FAIL (USER page.sizeMm 400, USER artifact.tier lanjutan 403, kenop medan OK); tsc 0 di area, eslint 0. Butir 1, 3, 4 diterima controller.
3. `expertMode` tidak membuka lanjutan bagi USER (D-163 T-1); dicatat `details.expertModeIgnored`.
4. M11 satu baris per kunci: nilai `essentials` + `advanced` kunci sama digabung dangkal; `surface` simpan = essential bila lapis registri essential atau objek hanya berisi medan kenop `medan`, selain itu advanced. Kerangka implisit: `positionLocked = false`, `admits` = bawaan jenis slot (register tidak menyebut).
5. `getSkeleton(versionId, { tier })`: tier implisit bawaan `doc.defaultTier` versi lalu TERBIT (tanda tangan I44 diperluas opsi).

## Temuan
- datum-gsp v1: override lama `page.sizeMm`, `grid.textColumnMm`, `table.columnWidthSumMm`, `type.baselinePt` kini kelas T -> dilewati resolusi (log `SLOT_PARAM_SKIPPED`, sekali per versi); migrasi milik SR-36 (PC-01/PC-02). paramsSha256 tersimpan != resolveParams ulang (sejalan SR-60: penjaga = proyeksi kunci lama).
- `writeSkeleton` hanya untuk versi BARU tanpa slot; izin (`checkTemplateWrite`) dipanggil SR-07/SR-26 sebelum transaksi.
- Permintaan lintas pemilik: tidak ada.
