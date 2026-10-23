# S50 coder-execution: services/revisions (G1c)

Status: complete (penjaga lulus; uji perilaku di fase final S74/S75).

## Berkas (area src/lib/studio/services/revisions/)
- index.ts: I40 getBlock, patchBlock, listRevisions (terbaru dulu), rerenderRevision; ekstra openRevision, diffRevisions, diffSnapshots, changedAddressesOf, setRevisionLogSink.
- locate.ts: penelusur doc C.S.P (seksi 0 = intro, spacer/device tidak dihitung), stampBlockIds, locateCell (sadar gridSpan, vMerge continue = tak beralamat), butir list/aside/monoBlock/derivation, sub caption/source/key.
- diff.ts: diff per blockId (added/removed/changed/moved + addressMap alamat dan label artefak).
- rows.ts: StudioBlock dari snapshot (hanya beralamat), RevisionSummary. canonical.ts: JSON kanonik + sha256. log.ts: sink JSONL harian `<STUDIO_WORKSPACE_ROOT>/logs/revisions/` + correlationId.

## Penjaga
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/lib/studio/services/revisions"` -> kosong (grep exit 1).
- `npx eslint src/lib/studio/services/revisions` -> exit 0. Cek runtime tsx helper (alamat, sel, diff, baris) sesuai harapan.

## Keputusan
1. PATCH: change apa/mengapa/dampak di-trim, kosong -> 400 CHANGE_FIELDS_REQUIRED; baseRevisionNo != current -> 409; balapan dijaga updateMany(where currentRevisionNo) dalam $transaction + P2002 -> 409 REVISION_CONFLICT.
2. Alamat yang dapat di-PATCH: C.S.P, label artefak (dipetakan lewat snapshot), sel Tabel C.n/r.c (hanya replace, gridSpan/vMerge wajib sama). Bab/seksi/F:/P:/butir/sub -> 400 SCHEMA_INVALID (di luar lingkup v1).
3. replace mempertahankan blockId; sisipan mendapat `b_`+16 heks sha256(docNumber|revN|op|alamat); blockId snapshot dipasang ke doc sebelum normalisasi ulang agar identitas tidak bergeser.
4. Revisi baru memakai templateVersionId induk; docRev = meta.rev (tidak dinaikkan otomatis); sunting tanpa perubahan -> 400 SCHEMA_INVALID.
5. Render sesudah PATCH: format dari doc.outputs, lalu format PRIMARY revisi induk, lalu DOCX; gagal render dicatat, revisi tetap komit (job null).
6. rerender: 409 RENDER_IN_PROGRESS bila job QUEUED/RUNNING; identical = sha256 keluaran baru = render pertama revisi itu (format|role|figureLabel), min 1 dibandingkan, tanpa galat (PDF non-deterministik membuat false secara jujur).

## Permintaan / temuan
- S56: `rerenderRevision(docId, revNo, formats?, caller?)` — teruskan caller sebagai argumen ke-4 (kontrak I40 tanpa caller; requestedBy jadi anonymous-internal bila absen). Kandidat delta kontrak S03-d1.
- S48: baris StudioBlock revisi 1 sebaiknya sama aturannya dengan `blockRowsFromSnapshot` (chapterKey/sectionNo/paraNo dari alamat; tabel = alamat C.S.P + artifactLabel). getBlock juga menerima baris artefak yang alamatnya = label.
- Bergantung runtime pada S48 normalize/validateSchema, S49 resolveTemplate, S44 byConstructionChecks, S51 renderRevision (stub sampai mendarat).
