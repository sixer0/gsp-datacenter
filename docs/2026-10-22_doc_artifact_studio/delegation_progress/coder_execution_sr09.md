# SR-09 coder-execution: adaptor v1 ke v2 (I46)

Status: complete (2026-10-23). Skills: backend-execution, dry-run-verify-fix. Gerbang D-133: tidak menjalankan suite uji.

## Berkas (baru, modul murni: tanpa DB, berkas, atau jam)
- `src/lib/studio/services/adapt-v1/index.ts`: `adaptV1(req, policy, trusted, opts?) -> { doc, internal?, report, assetPaths? }`, `effectiveInlinePolicy`, `ADAPT_V1_SLOT_KEYS`; AD-01..AD-16.
- `adapt-v1/front.ts`: §14.2 cover (auto dan explicit), controlSheet, toc, signature.
- `adapt-v1/blocks.ts`: §14.3 bab, section, 21 blok, tabel, chart (accent/params ke highlight, composite ke panels), diagram.
- `adapt-v1/inline.ts`: run b/i ke strong/em, vertAlign ke sup/sub, mono ke code; glif dan field dibuang.
- `adapt-v1/ids.ts`: blockId ke pid C19, kunci aset ke C26 (kebab).
- `adapt-v1/report.ts`: `AdaptRecorder`, `INLINE_FORMAT_FIELDS`, `countInlineFormat`.

## Bukti
- `npx tsc --noEmit -p tsconfig.json`: 0 galat di adapt-v1. Ada 9 galat di luar area dari baris paralel yang belum selesai: submit-kit.ts (services/submit), content/route.ts dan paragraphs/[pid]/route.ts (services/structure, revisions.patchPid/pidHistory), documents/route.ts, services/templates/index.ts (3).
- `npx eslint src/lib/studio/services/adapt-v1`: exit 0.
- Asap (ajv `STUDIO_SCHEMA_LOAD_ORDER` + `classifySchemaV2Errors`): doc_nota_memo, doc_nota_tables, doc_serah_handover, doc_terbit_report, dan benchmark doc.json, kelimanya v2Schema=VALID. Hasil deterministik. Benchmark: 17 bab, 4 lampiran, b->strong 212 dan symbolGlyphRuns 42 (cocok dengan §14.3). Varian tocMixed tetap VALID (26 entri). Kasus sintetis (aset path, composite, field, spacer/device, pid duplikat) VALID.
- reject: 422 INLINE_FORMAT_REJECTED (memo 1, serah 2, terbit 1, benchmark 268 dari x blok). nota_tables diterima. allow tepercaya menghasilkan internal = v1 asli. allow tak tepercaya dijalankan sebagai strip.

## Keputusan (butuh pencatatan controller)
1. Kelas kebijakan `ingest.inlineFormat` hanya mencakup medan bertanda "(R-38)" di §14.3 dan AD-09: format, runDefaults, fieldFormats, labelProps, headingFormat, paragraphFormat, signRowFormat, trailingFormat, properti fon run, x blok, dan overrides. Medan tata letak (widthMm, setup, kicker, label, dan sejenisnya) selalu dibuang dan hanya dihitung di `stripped`. Tanpa pembatasan ini, setiap v1 berfigur (widthMm wajib) akan ditolak.
2. `x` tingkat blok dibuang (§14.3 R-38). Benchmark kehilangan jejak `x.bm`/`figureRef` (268 blok); kunci aset bm-fig-NN tetap ada (permintaan SR-34).
3. Tambahan (+) pada I46: `opts.tocMixed` (adaptor tidak tahu mode slot) dan `assetPaths` (aset ber-path; adaptor murni tidak membaca berkas, jadi SR-12 yang menyimpan M13).
4. controlSheet explicit (tidak dirinci register): pageTitle ke title, methodStatement apa adanya, tabel dipetakan lewat preset lalu urutan. signatureBlock di badan explicit menjadi slot signature bila front.signature absen.
5. pid atau kunci aset yang tidak sah dinormalisasi ke kebab-case. pid yang tidak bisa dinormalisasi atau ganda dibuang (compose membangkitkan pid baru) dan dicatat di `renamed`.

## Permintaan dan temuan
- SR-12: panggil `adaptV1` sesudah gerbang kepercayaan. Petakan `allow` ke `trusted`, simpan aset `assetPaths`, dan teruskan `report` ke lint SCHEMA_V1_ADAPTED. Pakai `countInlineFormat(report) > 0` untuk INLINE_FORMAT_STRIPPED. Galat persisten dicatat pemanggil.
- Batasan: chart v1 `{artifactId}` tidak membawa `code`, sehingga ChartV2 tanpa `code` akan gagal skema. Layanan perlu mengisinya dari artefak (R09). Tidak ada di fixture.
