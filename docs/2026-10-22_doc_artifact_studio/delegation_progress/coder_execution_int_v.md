# INT-V coder-execution (D-108): sinkron hitungan registri parameter

Status: complete (2026-10-23). Hitungan nyata (skrip tsx impor modul): CATALOG_PARAMS 685 (115+134+91+111+135+99), renderer kontrak 35, ALL_PARAMS 720; origin catalog 685 / contract 35.
Berkas diubah: params/index.ts (konstanta 673->685, komentar 87->99), services/templates/index.ts baris 628 (teks: katalog 685 + renderer 35), masterplan/01_specs.md (7 angka + catatan "Revisi d3 (INT-V, D-108)").
docs/STUDIO-AGENT-GUIDE.md dan docs/API-REFERENCE.md: tidak memuat angka hitungan registri (grep kosong), tidak diubah. Tidak ada test yang memakai konstanta.
Seed: `npx tsx prisma/seed-studio.ts` (mode normal) ke gsp_agent_hq_v21: outcome `unchanged`, datum-kanonik v4 (dibuat 18:30 sebelum run ini), 12 kunci chart baru ada di resolvedParams v4 (v1-v3 tidak). Kunci: chart.kind.S-02.whisker, S-03.bandwidth, S-04.bandwidth, K-08.grid/icon/caption, K-11.accentLink, K-12.widths, W-07.todayAt/todayLabel, W-08.riskyTypes/highlightWindow.
Bukti: tsc repo 0 galat; eslint 2 berkas kode exit 0.
Temuan (di luar area, tidak diubah): komentar angka lama 698/673+25 di src/app/api/studio/registry/route.ts:6, src/components/studio/template-preview/api.ts:145, src/lib/studio/params/render.ts:5 (673).
