/**
 * Pemeriksaan kontrak lokal draf (register 05 §5.6 langkah 6b, §11.3 mode lokal; DC-23 per D-375):
 * setiap payload `contractRecord` di blok diperiksa I54 `checkContractRecord` (`services/contracts`,
 * satu sumber aturan dengan gerbang R08), menggantikan cek `items[].key` lokal CLI DC-22
 * (`TODO(DC-07)`). Murni: tanpa DB.
 *
 * Urutan pemanggil I54: `issues` (400, checkId CH-01..CH-04) lebih dulu; bila kosong, galat 422
 * EC27 `CONTRACT_ITEM_KEY_DUPLICATE` dengan `positions` BERBASIS 1 (register §13.1, NV-10).
 *
 * Jenis kontrak: mode lokal tidak mengetahui `contractKind` templat dokumen (butuh DB). Tahap 1
 * hanya mendaftarkan satu jenis (C58 `agentWorkReport`, E44), yang setnya identik dengan enum skema
 * tahap 1; bila jenis kedua didaftarkan, pemilihan jenis lokal harus ditinjau ulang.
 */
import { CONTRACT_KINDS, type ContractKind } from "../../contract/enums";
import type { ValidationIssue } from "../../contract/types/api";
import type { ContractRecordPayloadV2 } from "../../contract/types/v2/contract";
import { checkContractRecord } from "../contracts";

/** Jenis kontrak yang dipakai pemeriksaan lokal (satu-satunya jenis tahap 1). */
export const LOCAL_CONTRACT_KIND: ContractKind = CONTRACT_KINDS[0];

export type DraftContractIssue = ValidationIssue & { details?: Record<string, unknown> };

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Payload `contractRecord` di blok beserta pointernya (slot v2: `/payload`; doc v2: `/sections/<slot>`). */
function contractPayloads(value: Record<string, unknown>): Array<{ pointer: string; payload: Record<string, unknown> }> {
  const out: Array<{ pointer: string; payload: Record<string, unknown> }> = [];
  if (value.$schema === "studio.slot/v2" && isRecord(value.payload) && value.payload.type === "contractRecord") {
    out.push({ pointer: "/payload", payload: value.payload });
  }
  if (value.$schema === "studio.doc/v2" && isRecord(value.sections)) {
    for (const [slot, p] of Object.entries(value.sections)) {
      if (isRecord(p) && p.type === "contractRecord") out.push({ pointer: `/sections/${slot.replace(/~/g, "~0").replace(/\//g, "~1")}`, payload: p });
    }
  }
  return out;
}

/**
 * Isu I54 untuk semua payload `contractRecord` di satu blok (urutan payload, lalu urutan medan).
 * Isu CH-xx: `keyword` = `checkId`. EC27: `keyword` `CONTRACT_ITEM_KEY_DUPLICATE`,
 * `details = { key, positions }` (1-based).
 */
export function draftContractIssues(value: Record<string, unknown>, kind: ContractKind = LOCAL_CONTRACT_KIND): DraftContractIssue[] {
  const out: DraftContractIssue[] = [];
  for (const { pointer, payload } of contractPayloads(value)) {
    const r = checkContractRecord(payload as unknown as ContractRecordPayloadV2, kind, { pointer });
    if (r.issues.length > 0) {
      for (const i of r.issues) out.push({ pointer: i.pointer, keyword: i.checkId, message: i.message, checkId: i.checkId });
      continue;
    }
    if (r.error) {
      const { key, positions } = r.error.details;
      out.push({
        pointer: r.error.details.pointer,
        keyword: r.error.code,
        message: `Kunci butir "${key}" ganda pada posisi ${positions.join(", ")}`,
        details: { key, positions },
      });
    }
  }
  return out;
}
