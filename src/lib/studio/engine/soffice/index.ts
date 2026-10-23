/**
 * Modul engine/soffice (I15, 01_specs.md §8.2 dan §8.4), diisi S92.
 * Tanda tangan dua ekspor pertama adalah kontrak; sisanya ekspor tambahan
 * (aditif) untuk S51/uji.
 */
import type { RenderEnvReadiness } from "../../contract";
import { getReadinessState } from "./readiness";
import { convertDocxToPdfImpl } from "./service";

/** Cek kesiapan render-env (cache C15; `force` melewati cache). Tidak melempar. */
export async function checkRenderEnvReadiness(opts?: { force?: boolean }): Promise<RenderEnvReadiness> {
  return (await getReadinessState(opts)).readiness;
}

/** Melempar StudioEngineError PDF_ENGINE_UNAVAILABLE / PDF_CONVERT_FAILED / RENDER_TIMEOUT. */
export async function convertDocxToPdf(
  docx: Uint8Array,
  i: { jobId: string; fileName: string },
): Promise<{ pdf: Uint8Array; durationMs: number }> {
  return convertDocxToPdfImpl(docx, i);
}

export { sofficeQueueLimits, sofficeQueueState, safeBaseName } from "./service";
export { resetReadinessCache } from "./readiness";
export { setSofficeLogSink, type SofficeLogEntry, type SofficeLogSink } from "./log";
