# benchmark/harness/run (S97, H07; FIX-5; SR-34)

End-to-end runner for the Manual DATUM 000 benchmark (D-12..D-17, D-118), without a database.

```
npx tsx benchmark/harness/run/run_benchmark.ts --official --out benchmark/out/<run-id>      # official run (default mode)
npx tsx benchmark/harness/run/run_benchmark.ts --official --with-diagnosis-raster --out benchmark/out/<run-id>
npx tsx benchmark/harness/run/run_benchmark.ts --diagnosis-raster --out benchmark/out/<run-id>   # DIAGNOSIS (raster acuan) only
npx tsx benchmark/harness/run/run_benchmark.ts --dry-run      # load + sha256 + per-figure source plan, writes nothing
npx tsx benchmark/harness/run/selftest_verdict.ts             # verdict/exit and CLI default self-test (no DB, no browser)
npx tsx benchmark/harness/run/selftest_ingest_v2.ts           # FIX-B: real dryRun ingest of doc.v2 + template.v2 with the template skeleton (no DB; reads benchmark files)
npx tsx benchmark/harness/run/run_benchmark.ts --schema v1 --dry-run    # force the v1 inputs (doc.json + template.json)
npx tsx benchmark/harness/run/run_benchmark.ts --schema v2 --doc <doc.v2.json> --template <template.v2.json> --dry-run
npx tsx benchmark/harness/run/run_benchmark.ts --help
```

Run from the repo root.

## Input schema (SR-34)

| `--schema` | Default inputs | Rule |
|---|---|---|
| `auto` (default) | `benchmark/manual000/doc.v2.json` + `template.v2.json` when BOTH exist (SR-32), else `doc.json` + `template.json` | Falling back to v1 prints a warning on stderr and in the dry-run, logs `SCHEMA_V2_FALLBACK_V1`, and is repeated in `run_summary.json` (`inputSchema.fallbackWarning`, `warnings`) and `run_report.md` |
| `v2` | v2 files; a missing default v2 file is a usage error (exit 2) | Content must be `studio.doc/v2` / `studio.template/v2` |
| `v1` | v1 files (legacy path, still supported) | Content must be `studio.doc/v1` / template profile v1 (S95) |

`--doc` / `--template` override either default. The schema version is detected from the file content (`$schema` of the doc;
`schema: "studio.template/v2"` of the template, otherwise template profile v1) and recorded in `run_summary.json`
(`inputSchema`, summary schema `s97.run-summary/v3`) and at the top of `run_report.md`. v2 seams that have not landed yet
make the ingest step `NOT_READY` (exit 1) instead of silently using the v1 path: the `studio.doc/v2` schema in the contract
(SR-04, ingest dispatch SR-12) and a DB-less template v2 loader exported by `services/templates` as
`loadResolvedTemplateV2File` (SR-07). v2 engine figures keep only content fields (`id`, `caption`, `source`, `keyRow`) and
are mapped to the S94 index by their `id` (pid).

RQ-9: for a v2 doc the S94 spec is not carried verbatim. `lib/figures_v2.ts` maps it to `ChartV2` (`code`, `data` or
`panels`, `highlight`, `unit`, `dec`, `limit`, `note`) or `DiagramV2.spec` (`DiagramSpecV2`) by calling the pure adaptor
`services/adapt-v1` on a one-block v1 envelope, so the runner and ingest share one mapping (register 03 §14.3). Size and
display fields (`$schema`, `id`, `title`, `widthMm`/`width_mm`, `heightMm`, `apparatus`, `style`, `params`,
`composite.columns`/`gapMm`) are dropped and counted per figure in `substitutions[].v2Mapping`; figure width comes from
the template width knobs. Caption, source and key row stay the doc block's content.

## Run kinds (D-118, review R03)

| Kind | Flags | Figures | Best verdict | Exit 0 possible |
|---|---|---|---|---|
| OFFICIAL (default) | none, or `--official` | chart/diagram rendered by the engine from the S94 spec files (`figures/specs/*.json`), symbol sheets by the engine from their dialect, photos/logos/illustrations/devices from raster assets; no substitute | PASS | yes, only this kind |
| DIAGNOSIS (raster acuan) | `--diagnosis-raster` (= `--figures raster`) | every figure from the original BM.docx media | PASS-DEGRADED | no |
| DIAGNOSIS (raster acuan as substitute) | `--figure-fallback raster` | engine; a failed engine figure is replaced by its reference raster (`FALLBACK_RASTER`) | PASS-DEGRADED | no |

Verdict rules (`decideVerdict` in `lib/report.ts`): an engine figure that fails with no substitute (`MISSING`) makes the
verdict FAIL; any chart/diagram/symbol figure not drawn by the engine (substitute, or reference raster) turns a passing
criteria set into PASS-DEGRADED; only an OFFICIAL run with PASS and no FAILED/NOT_READY step exits 0.
`--with-diagnosis-raster` adds a separate raster run in `<out>/diagnosis_raster`; its BM1-BM4 appear in their own report
section and never change the official verdict or exit code. BM4 is also reported with and without the pages that hold a
substituted figure.

## Steps

| Step | What | Module |
|---|---|---|
| load | doc (v1 or v2, SR-34), template profile v1 via `loadResolvedProfileFile` (S49, in memory), figure index S94 with sha256 of every asset; the `image` blocks of the 15 engine figures (5 chart, 6 diagram, 4 symbol sheets) are replaced by the S94 blocks, with the chart/diagram spec read from the S94 spec file (id, path, sha256 reported), keeping caption/source/key/format from doc.json verbatim (D-14, C1) | `lib/inputs.ts` |
| ingest | `ingestDocument` dryRun, `enforcement: "report"`, `trustedHarness: true` (server CLI, IP-31/F-042, D-98), asset bytes injected into the snapshot as `dataBase64` (no workspace writes) | `services/ingest` |
| figures | production render functions (R04): `templateForDoc` (= `applyDocOverrides`), `preloadAssetBytes`, `buildFigures` with a DB-less `RenderJobHandle`; failed engine figures are reported per figure (source, spec id, size mm) | `services/render` |
| docx | `assembleDocx` (S20) with the production `RenderContext` (overridden template, `assetBytes`) | `engine/docx/assemble` |
| pdf | `checkRenderEnvReadiness` + `convertDocxToPdf` (S92, per-job profile) | `engine/soffice` |
| lint | `lintAfterRender` (tier `meta.tier`, engine SVG reports + extra checks, no HTML); informational, never holds files | `services/render/lint` |
| compare | `PYTHON -I -B benchmark/harness/compare/bm_compare.py` (S96), argument array, cwd = `<out>/compare`; `PYTHON` = `--python`, else env `STUDIO_HARNESS_PYTHON` (R20), else the hermes VENV | S96 |
| report | `run_summary.json` (schema `s97.run-summary/v3`, incl. `inputSchema`) + `run_report.md` (run label, input schema, D-17 per criterion, BM4 split, per page, per paragraph, per figure, NOT_READY modules, optional diagnosis section) + `run_log.jsonl` (incl. the render job log) | `lib/report.ts` |

A stub module (`StudioNotImplemented`), a missing chart family renderer, an unready render-env, or a
missing browser marks its step `NOT_READY`; the runner does not crash. Exit: 0 = official run, D-17 pass;
1 = PASS-DEGRADED / fail / incomplete / NOT_READY / diagnosis run; 2 = usage error, unreadable input or internal error.
`benchmark/out/` must be gitignored (owner S69).
