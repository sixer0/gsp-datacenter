# S101 coder-execution: pratinjau langsung templat (U71 TemplatePreviewPane)

Status: complete (penjaga lolos; uji UI di peramban dengan sesi login belum, menunggu S58 memasang + S80 E2E).

Berkas (area `src/components/studio/template-preview/**`):
- `index.tsx` U71 `TemplatePreviewPane` (ekspor, nama, props kontrak dipertahankan; props tambahan opsional `defaultTier`, `draftRoleFormats`, `onResult`, `className`) + ekspor ulang util untuk S58.
- `sample-document.ts` `SAMPLE_DOCUMENT` (sampul, lembar kendali, daftar isi, bab, 2 seksi, paragraf + rel bukti, daftar, tabel bersumber, chart P-01, turunan ber-register) + `withDraft`.
- `api.ts` klien: `fetchTemplateRef` (GET templates/[id] -> slug), `postValidatePreview`, `fetchParamRegistry`, `PreviewApiError`, log galat terstruktur.
- `preview-html.ts` `listPreviewUnits`, `previewSrcDoc` (pilihan halaman = unit `section[data-unit-key]`, DOMParser inert).
- `param-tools.ts` `searchParams`, `groupParams` (bab manual -> namespace, hitung B/K/T), `PARAM_CLASS_BADGE`, `isParamEditable`, `paramKeyFromPointer`, `resetParamToParent`, `isOverriddenFromParent`, `changedKeys`.

Perilaku: debounce `debounceMs` (600 ms), AbortController membatalkan permintaan lama, iframe `sandbox=""` (tanpa allow-scripts) + srcdoc, status aria-live, isu validasi dengan kunci parameter, ringkasan lint, tier NOTA/TERBIT/SERAH, halaman; coba lagi berbatas 3/6/12 s untuk jaringan/5xx; 401 -> tautan masuk.

Bukti:
- Handler route nyata (DB v2.1, `x-internal-secret`, log ke scratchpad): GET templates 200 `datum-kanonik` v1; GET [id] 200 `{template,version,versions}`, 404 TEMPLATE_NOT_FOUND; validate?preview=html contoh 200 `valid:true` 3 tier, HTML 2.56 MB, unit F:cover, F:controlSheet, F:toc, 1; override K/tak dikenal -> `valid:false` pointer `/document/overrides/<kunci>`; badan rusak 400 JSON_MALFORMED.
- Chromium (playwright-core): 4 unit terbaca, srcdoc unit "1" hanya memuat unit 1, kunci tak dikenal -> HTML utuh, 0 pageerror. Util: 13 kelompok bab (707 parameter), pencarian kunci/label benar, K=289.
- `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/components/studio/template-preview"` -> kosong (exit 1). `npx eslint src/components/studio/template-preview` -> exit 0.

Keputusan: (K1) typeCode contoh `KT` (STD ditolak daftar tertutup P3-20 templat kanonik). (K2) klien data lokal di area sendiri (tidak mengimpor `document-viewer/api.ts` milik S60). (K3) belum ada endpoint log galat klien; log JSON ke konsol seperti S60.
Permintaan: file_requests.md baris S101 (roleFormats draf dalam dry-run), tidak blocking.
Temuan: registri params kini 707 (D-56 mencatat 698; Renderer 34). Review recommended: index.tsx (hooks/abort/sandbox).
