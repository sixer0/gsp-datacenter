/**
 * Pratinjau HTML snapshot `studio.norm/v2` untuk R08 (FIX-V, FIX-U M5; D-247 tanpa build:
 * tanpa job, tanpa berkas, tanpa figur raster). Perakit sadar slot SR-17 (`assembleHtml`
 * dengan `RenderContext.slots`) = jalur yang sama dengan render v2 (`services/render`),
 * mode pratinjau (blok gagal diganti pengganti + log).
 *
 * - `versionSlots`: nilai efektif per slot satu versi templat tersimpan, resolusi berlapis
 *   sama dengan `resolveSlotsForVersion`; `roleFormats` dari templat pemanggil (draf
 *   roleFormats v1 IP-10 ikut berlaku di tingkat slot).
 * - `buildPreviewHtmlV2`: rakit HTML pratinjau dari snapshot + templat + slot.
 */
import type { NormDocSnapshot, NormDocSnapshotV2, RenderContext, ResolvedSlot, ResolvedTemplate, StudioTier } from "@/lib/studio/contract";
import { registerForSnapshot } from "@/lib/studio/engine/bind";
import { assembleHtml } from "@/lib/studio/engine/html/assemble";
import { getSkeleton, loadTemplateLayers, resolveSkeletonSlots } from "@/lib/studio/services/skeleton";
import { apiLog, type ReqCtx } from "@/lib/studio/http";

/** Nilai efektif per slot aktif versi templat tersimpan (lapis preset + templat dari DB). */
export async function versionSlots(tpl: Pick<ResolvedTemplate, "roleFormats">, templateVersionId: string, tier: StudioTier): Promise<ReadonlyMap<string, ResolvedSlot>> {
  const [layers, read] = await Promise.all([loadTemplateLayers(templateVersionId), getSkeleton(templateVersionId, { tier })]);
  return resolveSkeletonSlots({ params: layers.params, roleFormats: tpl.roleFormats }, read.skeleton.slots, layers.presetPins, {
    layers: layers.layers,
    tier: read.tier ?? tier,
  }).slots;
}

/**
 * HTML pratinjau snapshot norm/v2. `draft` = penanda draf (`render.draft.marker`), dipakai
 * untuk pratinjau kiriman yang belum lengkap; pratinjau templat memakai `false`.
 */
export async function buildPreviewHtmlV2(i: {
  snapshot: NormDocSnapshotV2;
  tpl: ResolvedTemplate;
  slots: ReadonlyMap<string, ResolvedSlot>;
  draft: boolean;
  ctx: ReqCtx;
}): Promise<string> {
  // Kontrak mengetik RenderContext.snapshot sebagai v1; perakit memilih jalur v2 dari `schema`
  // (cast satu tempat, pola `engineSnapshot` services/render/common).
  const snapshot = i.snapshot as unknown as NormDocSnapshot;
  const rctx: RenderContext = {
    snapshot,
    tpl: i.tpl,
    register: registerForSnapshot(snapshot),
    fixedDate: snapshot.doc.meta.issueDate,
    figures: { get: () => undefined },
    slots: i.slots,
    draft: i.draft,
    log: (e) => {
      if (e.level === "error" || e.level === "warn") {
        apiLog({ ...i.ctx, level: e.level, message: `preview v2: ${e.message}`, code: "PREVIEW_RENDER_LOG" });
      }
    },
  };
  return assembleHtml(rctx, { preview: true });
}
