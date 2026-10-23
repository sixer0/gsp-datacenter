# IP-41d coder-execution (override model D-184)
Status: complete
- chart.schema.ts: `x: { type: "object", additionalProperties: true }` di CHART_COMMON_PROPERTIES (berlaku ChartPanelSpec dan spec penuh; panel komposit lewat spec: ChartPanelSpec).
- types/chart.ts: `x?: Record<string, unknown>` pada StudioChartV1 (ChartPanelSpec mewarisi via Omit). Renderer tidak diubah (tidak membaca x).
- tsc seluruh repo: 72 galat, 0 di src/lib/studio/contract (galat di services/templates/index.ts dst = baris paralel, tidak disentuh).
- ajv (skrip scratch ip41d_ajv.ts): spec tanpa x OK, dengan x OK, x non-objek ditolak, komposit panel tanpa/dengan x OK, kunci asing zz tetap ditolak; exit 0.
