/**
 * Pemetaan galat layanan (4xx) -> isu R08 `valid:false` (dipindah dari `route.ts`,
 * FIX-HZ1; berkas route Next hanya boleh mengekspor handler).
 */
import type { ValidationIssue } from "@/lib/studio/contract";
import type { StudioEngineError } from "@/lib/studio/contract/errors";
import { isRecord } from "@/lib/studio/http";
import { issuesFromEngineDetails } from "./template-draft";

/**
 * Isu R08 dari galat layanan. FIX-HZ1 (D-324): `details` objek galat (mis. 409
 * `SCOPE_CONFLICT` `reason: PATCHED_PIDS_OVERWRITTEN` + `overwrittenPids` +
 * `forwardToController`) ikut apa adanya seperti badan galat kiriman nyata
 * `{ error, code, details }`, agar dry-run memberi informasi yang sama.
 */
export type ValidateIssue = ValidationIssue & { details?: Record<string, unknown> };

/** Masukan pengguna yang ditolak layanan (4xx) -> isu validasi. */
export function issuesFromError(err: StudioEngineError): ValidateIssue[] {
  const d = err.details;
  if (Array.isArray(d) && d.every((x) => isRecord(x) && typeof x.pointer === "string" && typeof x.message === "string")) {
    return d as ValidationIssue[];
  }
  // Layanan templat/kerangka: `details.issues` (ParamIssue/ValidationIssue).
  if (isRecord(d) && Array.isArray(d.issues) && d.issues.length > 0) return issuesFromEngineDetails(err, "");
  const pointer = isRecord(d) && typeof d.pointer === "string" ? d.pointer : "";
  const checkId = isRecord(d) && typeof d.checkId === "string" ? d.checkId : undefined;
  return [{ pointer, keyword: err.code, message: err.message, ...(checkId ? { checkId } : {}), ...(isRecord(d) ? { details: d } : {}) }];
}
