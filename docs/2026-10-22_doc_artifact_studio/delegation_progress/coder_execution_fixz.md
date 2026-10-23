---
task_id: FIX-Z
row: FIX-Z (D-283, D-290)
date: 2026-10-23
agent: coder-execution (tier D)
status: complete
---
# FIX-Z

## Perubahan
| Berkas | Perubahan |
|---|---|
| contract/types/diagram.ts | `StudioDiagramV1.keyRowOnPage?: boolean` (INTERNAL compose) |
| contract/schema/diagram.schema.ts | properti `keyRowOnPage: { not: {} }` + deskripsi "INTERNAL compose": SELALU ditolak pada masukan agen (artefak v1 lewat `validateSchema`, dokumen v1 via `$ref`); v2 memakai `DIAGRAM_SPEC_V2` yang memilih medan eksplisit (tidak memuatnya). Catatan: akibatnya spec terkomposisi BERTANDA tidak lolos skema bila kelak divalidasi ulang (kini tidak divalidasi di jalur render) |
| contract/types/v2/api.ts | `SubmitResultV2` tanpa `job`/`outputs`/`renderRefused`; impor mati dihapus |
| paragraphs/[pid]/route.ts | komentar kepala R16 tanpa render dalam kiriman (D-247) |
| services/ingest/v2.ts | medan tipe `IngestResultV2.renderRefused` dihapus (tak dibaca route) |
| services/ingest/repository.ts | nilai `renderRefused` pada `persistAdaptedV1` dihapus (route `documents/route.ts:384` tidak membacanya; respons identik) |
| components/studio/document-viewer/doc-model.ts | `renderRefused` tipe lokal (sisa usang `PatchResult`, tidak diisi server; perilaku reader-tab tidak berubah) |
| components/studio/playground/panels.tsx | blok `renderRefused`/`job`/`outputs`, baris "Id job", `OutputList`, impor mati dihapus (selalu kosong sejak D-247) |
| tests/unit/studio/figures/diagram-keyrow-schema.test.ts (baru) | 3 uji: skema artefak menolak, tipe memuat, spec v2 menolak + compose tanpa keyRow tidak membawanya |

## Bukti
- `npx tsc --noEmit -p .` exit 0; eslint berkas disentuh 0.
- `npx vitest run tests/unit/studio`: 60 berkas, 1987/1987 lulus.
- Pemakai di luar area yang membaca medan: `reader-tab.tsx:379-380` membaca `r.renderRefused`/`r.job` dari `PatchResult` (bukan `SubmitResultV2`), tidak disentuh (milik FIX-U2).
