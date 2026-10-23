/**
 * Gerbang by-construction BERSAMA untuk setiap penulisan konten v2 (SR-55 H1 /
 * F-065, FIX-S; D-34, D-98, D-131, D-134, A10).
 *
 * Satu fungsi, dipanggil atas snapshot norm/v2 HASIL GABUNG sebelum revisi
 * ditulis:
 *  - R04 ingest (`ingest/v2.ts` `runPipeline`, juga dryRun/validate);
 *  - R12/R13 kiriman bab/slot dan R04 bertarget/misi (`submit/pipeline.ts`
 *    `applyInLock`, di dalam transaksi berkunci sebelum `studioRevision.create`);
 *  - R16 sunting pid, R06 PATCH alamat dokumen v2, dan R14 op struktur
 *    (`revisions/v2/commit.ts` `commitV2Revision`, di dalam transaksi).
 *
 * Isi gerbang (sama dengan R04 sejak S48/INT-C/FIX-1):
 *  1. intrinsik: G1 + DATUM-10 (`tableChecks`), cacat entri register DATUM-11 dan
 *     audit turunan D03 (`bindRegister`; rujukan kunci tak terdaftar dinilai lint
 *     struktur DATUM-11 + kelayakan render, seperti R04);
 *  2. `runGate`: 32 cek `blocksIngest` registri (28 DATUM + G1-G3, N1) lewat
 *     `byConstructionChecks` + `runLint({ stage: "ingest" })`, keputusan penahan
 *     satu sumber `ingestPolicy` (override profil, `x.lintEnforcement` tepercaya,
 *     D-34 benchmark tepercaya);
 *  3. `renderFeasibilityBlockers` (D03 turunan tak terbangun; integritas).
 *
 * Kepercayaan: pemanggil membuang penanda tersimpan/terkirim untuk penulis tidak
 * tepercaya SEBELUM memanggil (D-134 R-01), jadi mode "report" (D-34) hanya dapat
 * berasal dari penanda/opsi milik pemanggil tepercaya.
 *
 * D-131 (kiriman parsial selalu diterima): cek yang FAIL-nya bergantung pada
 * kelengkapan dokumen (`COMPLETENESS_DEPENDENT_CHECKS`: LD-01 slot wajib kosong,
 * LD-02 celah kunci bab) TIDAK PERNAH menahan selama dokumen belum lengkap, juga
 * bila profil templat menaikkannya ke "block"; temuannya tetap tercatat di
 * laporan lint (peringatan) dan menentukan status rilis/render penuh. Semua cek
 * lain menilai sifat elemen yang ADA (ketiadaan isi = tanpa temuan), sehingga
 * berlaku penuh pada kiriman parsial.
 *
 * Ukuran figur medan v1 (D-271, FIX-X): `v1FigureSizeIssues` menilai lebar/tinggi
 * figur `studio.doc/v1` terhadap grid TURUNAN templat terpatok saat ingest, sebelum
 * adaptor SR-09 membuang medan ukuran (lebar v2 milik templat), sehingga lebar di luar
 * himpunan turunan ditolak dini dengan kode yang sama (422 `BY_CONSTRUCTION_FAILED`).
 */
import type {
  DocMeta,
  LintIssue,
  LintReport,
  NormDocSnapshot,
  NormDocSnapshotV2,
  ParamMap,
  ResolvedTemplate,
  StudioTier,
  ValidationIssue,
} from "../../contract";
import { StudioEngineError } from "../../contract/errors";
import { allowedWidthsText, figureLimits, isAllowedWidth, type FigureLimits } from "../../engine/chart/core/guards";
import { bindRegister, renderFeasibilityBlockers, tableChecks } from "./checks";
import { resolveIngestEnforcement, runGate, type IngestEnforcement } from "./gate";
import { isObject, joinPointer } from "./util";

/** Cek lint yang FAIL-nya hanya karena isi belum dikirim (D-131): tidak menahan selama INCOMPLETE. */
export const COMPLETENESS_DEPENDENT_CHECKS: ReadonlySet<string> = new Set(["SLOT_CONTENT_MISSING", "CONTENT_CHAPTER_GAP"]);

/** Catatan detail untuk cek bergantung kelengkapan yang ditunda. */
export const DEFERRED_UNTIL_COMPLETE_NOTE = "ditunda sampai dokumen lengkap (D-131)";

export interface ByConstructionInput {
  /** Snapshot norm/v2 hasil gabung (keluaran `composeV2`). */
  snapshot: NormDocSnapshotV2;
  /** Templat terpatok dokumen (versi yang juga dipakai render). */
  tpl: ResolvedTemplate;
  tier: StudioTier;
  /** true bila kelengkapan revisi yang akan ditulis = COMPLETE. */
  complete: boolean;
  /** Opsi penegakan pemanggil TEPERCAYA (D-34); pemanggil tidak tepercaya: undefined. */
  enforcement?: IngestEnforcement;
  /** Temuan intrinsik tambahan pemanggil (mis. P3-20 mode report ingest). */
  intrinsic?: readonly LintIssue[];
  /** Temuan REPORT gerbang kepercayaan untuk ditempel ke laporan lint. */
  notices?: readonly LintIssue[];
  /** Prefiks pointer register (bawaan `/register`). */
  registerPointer?: string;
  correlationId: string;
}

export interface ByConstructionResult {
  lint: LintReport;
  /** Penahan (422 `BY_CONSTRUCTION_FAILED`). */
  blocking: ValidationIssue[];
  /** Penahan yang diturunkan D-34 (pemanggil tepercaya, benchmark). */
  downgraded: LintIssue[];
  /** Penahan bergantung kelengkapan yang ditunda selama INCOMPLETE (D-131). */
  deferred: LintIssue[];
  enforcement: IngestEnforcement;
}

/** Jalankan gerbang by-construction atas snapshot hasil gabung (tanpa I/O, tanpa lempar). */
export function evaluateByConstruction(i: ByConstructionInput): ByConstructionResult {
  // Lint scan membaca bentuk v1 (doc/units/blocks); struktur SR-18 membaca norm/v2 apa adanya.
  const view = i.snapshot as unknown as NormDocSnapshot;
  const enforcement = resolveIngestEnforcement(i.snapshot.doc, i.enforcement);
  const registerPointer = i.registerPointer ?? "/register";
  const bind = bindRegister(view, new Map(), i.tier, registerPointer);
  // DATUM-11 rujukan kunci dinilai lint struktur (a11) + kelayakan render; DATUM-11 cacat
  // entri (pointer di bawah register) tetap di sini karena jalur bab/slot tidak menormalisasi register lebih dulu.
  const entryPrefix = joinPointer(registerPointer, "");
  const bindIssues = bind.issues.filter((x) => x.checkId !== "DATUM-11" || (x.pointer ?? "").startsWith(entryPrefix));
  const intrinsic: LintIssue[] = [...(i.intrinsic ?? []), ...tableChecks(view, new Map()), ...bindIssues];
  const gate = runGate({ doc: i.snapshot.doc, snapshot: view, tpl: i.tpl, tier: i.tier, intrinsic, enforcement, correlationId: i.correlationId });
  for (const n of i.notices ?? []) {
    gate.lint.checks.push(n);
    gate.lint.banner = gate.lint.banner ? `${gate.lint.banner} ${n.detail ?? n.checkId}` : (n.detail ?? n.checkId);
  }

  const deferred: LintIssue[] = [];
  let blocking = gate.blocking;
  if (!i.complete) {
    blocking = gate.blocking.filter((b) => !COMPLETENESS_DEPENDENT_CHECKS.has(b.checkId ?? ""));
    for (const c of gate.lint.checks) {
      if (c.status !== "FAIL" || !COMPLETENESS_DEPENDENT_CHECKS.has(c.checkId)) continue;
      c.detail = c.detail ? `${c.detail} [${DEFERRED_UNTIL_COMPLETE_NOTE}]` : DEFERRED_UNTIL_COMPLETE_NOTE;
      deferred.push(c);
    }
  }
  const feasibility = renderFeasibilityBlockers(view, new Map(), i.snapshot.doc);
  return { lint: gate.lint, blocking: [...blocking, ...feasibility], downgraded: gate.downgraded, deferred, enforcement };
}

/**
 * P3-20: kode jenis dokumen dalam daftar tertutup parameter templat `doc.typeCode`
 * (cek meta pembuatan; R04 dan pembuatan lewat kiriman bab/slot). Mode reject:
 * pemanggil menolak 400 `SCHEMA_INVALID`; mode report (D-34 tepercaya): temuan FAIL.
 */
export function typeCodeIssue(meta: Pick<DocMeta, "typeCode">, slug: string, tpl: Pick<ResolvedTemplate, "params" | "versionNo">, ptr: string): ValidationIssue | null {
  const allowed = tpl.params["doc.typeCode"];
  if (!Array.isArray(allowed) || allowed.length === 0 || allowed.includes(meta.typeCode)) return null;
  return {
    pointer: `${ptr}/meta/typeCode`,
    keyword: "enum",
    message: `typeCode "${meta.typeCode}" tidak dalam daftar tertutup templat ${slug} v${tpl.versionNo} (P3-20): ${allowed.join(", ")}`,
    checkId: "P3-20",
  };
}

function mmText(v: number): string {
  return String(Math.round(v * 100) / 100);
}

/**
 * D-271 (FIX-X): ukuran figur medan v1 terhadap grid TURUNAN templat terpatok
 * (D-158/D-245 H1), dinilai saat ingest SEBELUM adaptor membuang medan ukuran v1.
 * Cek dan kode sama dengan penjaga mesin yang menolak spec yang sama saat render:
 *  - chart `spec.widthMm` anggota `grid.allowedFigureWidthsMm` (G2, `assertChartSpec`);
 *  - chart `spec.heightMm` dan `spec.composite.panels[].spec.heightMm` dalam
 *    (0, `grid.textBlockHeightMm`] (DATUM-33; skema v1 hanya `exclusiveMinimum 0`);
 *  - diagram `spec.width_mm` anggota himpunan yang sama (P1-width_mm, `validateSpec`).
 * Rujukan artefak (`spec.artifactId`) dan aset raster (`image`, K-2) tidak dinilai.
 * Batas dari `figureLimits` (nilai turunan templat; kunci absen = bawaan registri,
 * pola evaluator lint FIX-FIG keputusan 3; tak terbaca = BY_CONSTRUCTION_FAILED).
 * Tanpa I/O; pemanggil menolak 422 `BY_CONSTRUCTION_FAILED` (`details` = hasil ini).
 */
export function v1FigureSizeIssues(doc: unknown, params: ParamMap, ptr: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let limits: FigureLimits | undefined;
  const lim = (): FigureLimits => (limits ??= figureLimits(params));
  const push = (pointer: string, checkId: string, detail: string): void => {
    issues.push({ pointer, keyword: "byConstruction", message: `${checkId}: ${detail}`, checkId });
  };
  const height = (spec: Record<string, unknown>, p: string, fid: string): void => {
    const h = spec.heightMm;
    if (typeof h !== "number" || (h > 0 && h <= lim().maxHeightMm)) return;
    push(joinPointer(p, "heightMm"), "DATUM-33", `${fid} — tinggi ${h} mm di luar (0, ${mmText(lim().maxHeightMm)}] mm (grid.textBlockHeightMm templat)`);
  };
  const visit = (node: unknown, p: string): void => {
    if (Array.isArray(node)) {
      node.forEach((x, i) => visit(x, joinPointer(p, i)));
      return;
    }
    if (!isObject(node)) return;
    const spec = node.spec;
    const figure = (node.type === "chart" || node.type === "diagram") && isObject(spec) && !("artifactId" in spec);
    if (figure) {
      const sp = joinPointer(p, "spec");
      if (node.type === "chart") {
        const fid = typeof spec.id === "string" ? spec.id : "(tanpa nomor)";
        const w = spec.widthMm;
        if (typeof w === "number" && !isAllowedWidth(w, lim())) {
          push(joinPointer(sp, "widthMm"), "G2", `${fid} — lebar ${w} mm bukan ${allowedWidthsText(lim())} (grid.allowedFigureWidthsMm templat)`);
        }
        height(spec, sp, fid);
        const panels = isObject(spec.composite) && Array.isArray(spec.composite.panels) ? spec.composite.panels : [];
        panels.forEach((panel, i) => {
          if (isObject(panel) && isObject(panel.spec)) height(panel.spec, joinPointer(sp, "composite", "panels", i, "spec"), `${fid} panel ${i + 1}`);
        });
      } else {
        const w = spec.width_mm;
        if (typeof w === "number" && !isAllowedWidth(w, lim())) {
          const fid = typeof spec.id === "string" ? spec.id : "(tanpa nomor)";
          push(joinPointer(sp, "width_mm"), "P1-width_mm", `${fid} — width_mm ${w} bukan ${allowedWidthsText(lim())} (grid.allowedFigureWidthsMm templat)`);
        }
      }
    }
    for (const [k, v] of Object.entries(node)) if (!(figure && k === "spec")) visit(v, joinPointer(p, k));
  };
  visit(doc, ptr);
  return issues;
}

/** Galat 422 kontrak untuk penahan gerbang (bentuk sama dengan R04: `details` = daftar issue). */
export function byConstructionError(blocking: readonly ValidationIssue[]): StudioEngineError {
  return new StudioEngineError("BY_CONSTRUCTION_FAILED", `${blocking.length} pelanggaran by-construction`, [...blocking]);
}

/**
 * `evaluateByConstruction` lalu lempar 422 `BY_CONSTRUCTION_FAILED` bila ada
 * penahan. Dipanggil jalur tulis di dalam transaksi sebelum commit; `onDowngrade`
 * mencatat penurunan D-34 ke log tahan lama pemanggil.
 */
export function assertByConstruction(
  i: ByConstructionInput,
  onDowngrade?: (r: ByConstructionResult) => void,
): ByConstructionResult {
  const r = evaluateByConstruction(i);
  if (r.blocking.length > 0) throw byConstructionError(r.blocking);
  if (r.downgraded.length > 0) onDowngrade?.(r);
  return r;
}
