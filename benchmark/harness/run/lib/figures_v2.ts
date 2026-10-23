/**
 * RQ-9 (sisa SR-32/IP-53; D-216, D-217): spec figur S94 (`studio.chart/v1`,
 * `studio.diagram/v1`) -> isi blok figur `studio.doc/v2` saat substitusi runner.
 *
 * Pemetaan TIDAK ditulis ulang di sini: runner memanggil adaptor murni
 * `services/adapt-v1` (SR-09, register 03 §14.3 baris `chart.spec`/`diagram.spec`)
 * pada amplop v1 satu-blok, lalu mengambil medan isi blok hasilnya. Satu sumber
 * pemetaan dengan ingest v1 -> v2:
 * - chart: `kind` -> `code`; `data` (`accent` -> `highlight`); `composite.panels[]`
 *   -> `panels[]`; `unit`, `dec`, `note`, `limit`. Dibuang: `$schema`, `id`,
 *   `title`, `source`, `widthMm`, `heightMm`, `apparatus`, `inDocument`, `style`,
 *   `params`, `composite.columns`/`gapMm` (tampilan/ukuran milik templat, RK-10).
 * - diagram: `DiagramSpecV2` (T2-27) tanpa `$schema`, `id`, `title`, `width_mm`,
 *   `apparatus`, `source`; `u` simpul tetap (data peralatan, D-172).
 *
 * Caption/sumber/kunci blok v2 TIDAK diambil dari spec: tetap konten blok doc
 * (`mergeFigureBlockV2`). Lebar figur dari templat (`chart.output.widthMm`,
 * `diagram.widthMm`; kelas lebar image/symbolSheet RQ-8), bukan dari spec.
 *
 * Murni: tanpa I/O; masukan sama -> keluaran sama.
 */
import type { StudioIngestRequest } from "../../../../src/lib/studio/contract";
import { adaptV1 } from "../../../../src/lib/studio/services/adapt-v1";

export type FigureSpecKind = "chart" | "diagram";

export interface FigureSpecV2Mapping {
  /** Medan isi blok v2 hasil pemetaan (chart: `code`, `data`|`panels`, `highlight`, ...; diagram: `spec`). */
  fields: Record<string, unknown>;
  /** Medan spec S94 yang dibuang adaptor (nama medan -> jumlah), untuk jejak laporan. */
  stripped: Record<string, number>;
  /** Penggantian nama oleh adaptor (mis. `accent->highlight`). */
  renamed: Record<string, number>;
}

/** Medan blok v2 milik pemetaan spec (selain id, caption, source, keyRow). */
const CHART_FIELDS = ["code", "data", "panels", "artifactId", "highlight", "unit", "dec", "limit", "note"] as const;
const DIAGRAM_FIELDS = ["spec", "artifactId"] as const;

/** Inline v1 pengisi untuk medan wajib amplop; tidak masuk keluaran. */
const FILLER = { text: "-" } as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type AdaptOut = { block: Record<string, unknown> | undefined; stripped: Record<string, number>; renamed: Record<string, number> };

/** Amplop ingest v1 satu bab / satu section / satu blok untuk adaptor murni. */
function adaptOne(block: Record<string, unknown>): AdaptOut {
  const req = {
    document: {
      $schema: "studio.doc/v1",
      chapters: [{ key: "1", title: FILLER, sections: [{ title: FILLER, blocks: [block] }] }],
    },
  } as unknown as StudioIngestRequest;
  const { doc, report } = adaptV1(req, "strip", true);
  const content = doc.sections?.content as { chapters?: Array<{ sections?: Array<{ blocks?: unknown[] }> }> } | undefined;
  const out = content?.chapters?.[0]?.sections?.[0]?.blocks?.[0];
  return { block: isRecord(out) ? out : undefined, stripped: { ...report.stripped }, renamed: { ...report.renamed } };
}

const FIGURE_FILLER = { caption: { inline: FILLER }, source: { inline: FILLER } } as const;
let fillerReport: AdaptOut | null = null;

/** Hitungan REPORT dikurangi kontribusi amplop pengisi (caption/sumber/judul), agar jejak hanya memuat spec. */
function minusFiller(r: Record<string, number>, filler: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(r)) {
    const n = v - (filler[k] ?? 0);
    if (n > 0) out[k] = n;
  }
  return out;
}

/**
 * Petakan spec S94 ke isi blok figur v2 lewat `adaptV1` (kebijakan `strip`,
 * tepercaya: harness CLI D-129). Melempar bila adaptor tidak menghasilkan blok
 * yang diharapkan (pemanggil menandai substitusi BLOCK_INVALID).
 */
export function mapFigureSpecToV2(kind: FigureSpecKind, spec: Record<string, unknown>): FigureSpecV2Mapping {
  // Garis dasar pengisi: blok tanpa spec (lembar simbol) dalam amplop yang sama.
  fillerReport ??= adaptOne({ type: "symbolSheet", dialect: "iec", ...FIGURE_FILLER });
  const r = adaptOne({ type: kind, ...FIGURE_FILLER, spec });
  if (!r.block || r.block.type !== kind) throw new Error(`adaptor v1->v2 tidak menghasilkan blok ${kind} dari spec S94`);
  const fields: Record<string, unknown> = {};
  for (const k of kind === "chart" ? CHART_FIELDS : DIAGRAM_FIELDS) if (r.block[k] !== undefined) fields[k] = r.block[k];
  if (kind === "chart" ? fields.code === undefined : fields.spec === undefined) throw new Error(`blok ${kind} v2 hasil adaptor tanpa ${kind === "chart" ? "code" : "spec"}`);
  return { fields, stripped: minusFiller(r.stripped, fillerReport.stripped), renamed: minusFiller(r.renamed, fillerReport.renamed) };
}
