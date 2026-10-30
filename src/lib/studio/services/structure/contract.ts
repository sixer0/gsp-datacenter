/**
 * Persistensi kontrak di dalam transaksi commit v2 (DC-09; register 05 §7.1 M19-M21,
 * §7.2 MX08/MX09, §7.6 aturan tulis; 03 §9.1 butir 4).
 *
 * - `templateContractKind`: jenis kontrak templat terpatok (MX08) untuk compose dan tulis.
 * - `writeContractRows`: SESUDAH `writeRevisionRows` (baris M14/M17 revisi sudah ada),
 *   tulis M19 (1) + M20 (n butir) + M21 (m rujukan) dari I56 bila slot `contractRecord`
 *   terisi, lalu kembalikan kolom cermin MX09 untuk digabung ke pembaruan
 *   `StudioDocument` pemanggil. Slot kosong: tanpa M19, cermin = `contractKind` saja.
 *   Dokumen non-kontrak (`contractKind` null): tanpa tulis, tanpa cermin.
 *
 * M19-M21 adalah turunan payload M14 dan tidak dipakai rekonstruksi (03 §4.6).
 */
import type { Prisma } from "@prisma/client";
import { StudioEngineError } from "../../contract/errors";
import type { ContractRecordPayloadV2, SubmitWarningV2 } from "../../contract/types/v2/contract";
import { CONTRACT_RECORD_SECTION_TYPE, isContractKind } from "../../registry/contracts";
import { createPrismaContractRefReader } from "../contracts/prisma-reader";
import { projectContractRows } from "../contracts/project";
import { resolveContractRefs, type ResolvedContractRef } from "../contracts/refs";
import { logStructureError, newCorrelationId, structureLog } from "./log";
import { CONTRACT_ITEM_ROW_TYPE } from "./rows";
import type { StructureRows } from "./types";

type Tx = Prisma.TransactionClient;

/** Kolom MX09 yang ditulis ke `StudioDocument` (cermin revisi terbaru). */
export interface ContractMirrorUpdate {
  contractKind: string;
  contractStatus: string | null;
  contractOwner: string | null;
  contractTaskRef: string | null;
  contractDueOn: Date | null;
  contractCardIds: string[];
}

export interface WriteContractRowsInput {
  documentId: string;
  revisionId: string;
  revisionNo: number;
  /** MX08 templat terpatok; null/undefined = dokumen non-kontrak (tanpa perubahan). */
  contractKind: string | null | undefined;
  /** Baris revisi yang baru ditulis (sumber payload M14 dan pid butir M17). */
  rows: StructureRows;
  /**
   * Rujukan yang SUDAH di-resolve gerbang (I55 langkah 9a, `gate.contract.refs`) di
   * transaksi yang sama; diberikan = tanpa kueri I55 kedua. Absen = resolve di sini.
   */
  resolvedRefs?: ReadonlyArray<{ slotKey: string; resolved: readonly ResolvedContractRef[] }>;
  correlationId?: string;
}

export interface WriteContractRowsResult {
  /** null = dokumen non-kontrak; pemanggil tidak menyentuh MX09. */
  mirror: ContractMirrorUpdate | null;
  counts: { records: number; items: number; refs: number };
  /** Peringatan I55 (pid sasaran pensiun, CW-01). */
  warnings: SubmitWarningV2[];
}

/**
 * MX08 hanya bila kerangka memuat slot `contractRecord` (dokumen non-kontrak: tanpa kueri,
 * D-382); selain itu null.
 */
export async function skeletonContractKind(
  db: Tx,
  templateVersionId: string,
  slots: ReadonlyArray<{ sectionType: string }>,
): Promise<string | null> {
  if (!slots.some((s) => s.sectionType === CONTRACT_RECORD_SECTION_TYPE)) return null;
  return templateContractKind(db, templateVersionId);
}

/** MX08 dari versi templat; versi tak ditemukan (kerangka implisit) = null. */
export async function templateContractKind(db: Tx, templateVersionId: string): Promise<string | null> {
  const v = await db.studioTemplateVersion.findUnique({
    where: { id: templateVersionId },
    select: { template: { select: { contractKind: true } } },
  });
  return v?.template.contractKind ?? null;
}

function itemNo(address: string, slotKey: string): number {
  const m = new RegExp(`^F:${slotKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(\\d+)$`).exec(address);
  return m ? Number(m[1]) : Number.NaN;
}

export async function writeContractRows(tx: Tx, input: WriteContractRowsInput): Promise<WriteContractRowsResult> {
  const none: WriteContractRowsResult = { mirror: null, counts: { records: 0, items: 0, refs: 0 }, warnings: [] };
  if (!input.contractKind) return none;
  const correlationId = input.correlationId ?? newCorrelationId();
  const kind = input.contractKind;
  try {
    const section = input.rows.sections.find((s) => s.sectionTypeKey === CONTRACT_RECORD_SECTION_TYPE);
    const payload = section?.filled ? (section.payload as ContractRecordPayloadV2 | null) : null;
    if (!section || !payload) {
      return { ...none, mirror: { contractKind: kind, contractStatus: null, contractOwner: null, contractTaskRef: null, contractDueOn: null, contractCardIds: [] } };
    }
    if (!isContractKind(kind)) {
      throw new StudioEngineError("BY_CONSTRUCTION_FAILED", `Jenis kontrak templat "${kind}" tidak terdaftar`, { checkId: "CONTRACT_KIND", contractKind: kind });
    }

    const slotKey = section.slotKey;
    const itemRows = input.rows.blocks
      .filter((b) => b.chapterKey === null && b.slotKey === slotKey && b.type === CONTRACT_ITEM_ROW_TYPE)
      .sort((a, b) => itemNo(a.address, slotKey) - itemNo(b.address, slotKey));
    const docSection = await tx.studioDocSection.findFirst({ where: { revisionId: input.revisionId, slotKey }, select: { id: true } });
    if (!docSection) throw new StudioEngineError("BY_CONSTRUCTION_FAILED", `Baris slot ${slotKey} revisi ini belum ditulis`, { slotKey, revisionId: input.revisionId });

    const refsIn = payload.refs ?? [];
    const pre = input.resolvedRefs?.find((r) => r.slotKey === slotKey)?.resolved;
    let resolved: readonly ResolvedContractRef[];
    let warnings: SubmitWarningV2[] = [];
    if (refsIn.length === 0) resolved = [];
    else if (pre && pre.length === refsIn.length) resolved = pre;
    else ({ resolved, warnings } = await resolveContractRefs(refsIn, createPrismaContractRefReader({ db: tx, correlationId }), { pointer: `/sections/${slotKey}/refs` }));
    const proj = projectContractRows(payload, {
      documentId: input.documentId,
      revisionNo: input.revisionNo,
      revisionId: input.revisionId,
      docSectionId: docSection.id,
      kind,
      itemPids: itemRows.map((r) => r.pid),
      resolvedRefs: resolved,
    });

    await tx.studioContractRecord.create({
      data: {
        ...proj.record,
        items: proj.items.length > 0 ? { createMany: { data: proj.items } } : undefined,
        refs: proj.refs.length > 0 ? { createMany: { data: proj.refs } } : undefined,
      },
      select: { id: true },
    });
    const counts = { records: 1, items: proj.items.length, refs: proj.refs.length };
    structureLog({
      level: "info",
      message: "contract rows written",
      correlationId,
      context: { documentId: input.documentId, revisionNo: input.revisionNo, contractKind: kind, ...counts, warnings: warnings.length },
    });
    return { mirror: { ...proj.mirror }, counts, warnings };
  } catch (err) {
    logStructureError(correlationId, "writeContractRows failed", err, { documentId: input.documentId, revisionId: input.revisionId });
    throw err;
  }
}
