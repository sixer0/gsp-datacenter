// DC-29 — CH-06 `SKELETON_CONTRACT_RECORD` di jalur simpan templat v2 (register 05 §5.4, §6.3).
// Seam: createTemplateV2InTx / createTemplateVersionV2InTx dengan transaksi palsu (tanpa DB).
// Kerangka lolos CH-06 + SR-06 berhenti di pencarian preset (TEMPLATE_NOT_FOUND) karena DB palsu
// kosong; itu bukti CH-06 dan validateSkeleton tidak menolak.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { CONTENT_BLOCK_TYPES, type StudioCaller, type StudioTemplateV2, type TemplateSlotDef } from "@/lib/studio/contract";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import { getContractKindDef } from "@/lib/studio/registry/contracts";
import { contractRecordSkeletonIssues } from "@/lib/studio/registry/slots";
import { validateSkeleton } from "@/lib/studio/services/skeleton";
import { createTemplateV2InTx, createTemplateVersionV2InTx, setTemplatesLogSink } from "@/lib/studio/services/templates";

const ADMIN: StudioCaller = { kind: "ADMIN_SESSION", requester: "uji-dc29", canWriteClassK: true };
const USER: StudioCaller = { kind: "USER_SESSION", requester: "uji-dc29-user", canWriteClassK: false } as StudioCaller;

/** SL-08..SL-10 persis register 05 §6.3 (sama dengan spesifikasi seed `laporan-kerja-agen`). */
const LAPORAN_SLOTS: TemplateSlotDef[] = [
  { slotKey: "record", sectionType: "contractRecord", label: "Catatan Laporan", position: 1, required: true, positionLocked: true, repeatable: false, contentMode: "INPUT", tiers: [], admits: [], essentials: {} },
  { slotKey: "content", sectionType: "chapter", label: "Isi Laporan", position: 2, required: true, positionLocked: false, repeatable: true, minItems: 1, contentMode: "INPUT", tiers: [], admits: [...CONTENT_BLOCK_TYPES], essentials: {} },
  { slotKey: "references", sectionType: "sourceRegister", label: "Referensi", position: 3, required: false, positionLocked: false, repeatable: false, contentMode: "INPUT", tiers: [], admits: [], essentials: {} },
];

const CHAPTER_ONLY: TemplateSlotDef[] = [{ ...LAPORAN_SLOTS[1], position: 1 }];

function tpl(slots: TemplateSlotDef[]): StudioTemplateV2 {
  return { $schema: "studio.template/v2", preset: { slug: "datum-gsp-preset", version: 2 }, essentials: {}, skeleton: { slots } };
}

/** Transaksi palsu: semua pencarian kosong kecuali templat sasaran versi (bila diberikan). */
function fakeTx(template?: Record<string, unknown>) {
  return {
    studioTemplate: {
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => template ?? null),
    },
    studioTemplateVersion: { findUnique: vi.fn(async () => null), findFirst: vi.fn(async () => null) },
  } as never;
}

async function caught(p: Promise<unknown>): Promise<StudioEngineError> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(StudioEngineError);
    return e as StudioEngineError;
  }
  throw new Error("diharapkan galat");
}

function issuesOf(e: StudioEngineError): Array<{ pointer: string; keyword: string; checkId?: string }> {
  return ((e.details as { issues?: unknown[] } | undefined)?.issues ?? []) as Array<{ pointer: string; keyword: string; checkId?: string }>;
}

const create = (slots: TemplateSlotDef[], contractKind?: string | null, caller: StudioCaller = ADMIN) =>
  createTemplateV2InTx(fakeTx(), { slug: "laporan-uji", name: "Laporan Uji", kind: "DOCUMENT", changeNote: "uji DC-29", template: tpl(slots), ...(contractKind !== undefined ? { contractKind } : {}) }, caller);

beforeAll(() => setTemplatesLogSink(() => {}));
afterAll(() => setTemplatesLogSink(null));

describe("DC-29 kerangka laporan-kerja-agen (register §6.3)", () => {
  it("sama dengan kerangka ringkas registri C58 agentWorkReport", () => {
    const def = getContractKindDef("agentWorkReport");
    expect(def?.templateSlug).toBe("laporan-kerja-agen");
    expect(def?.tier).toBe("NOTA");
    expect(def?.typeCode).toBe("LAP");
    expect(LAPORAN_SLOTS.map((s) => ({ slotKey: s.slotKey, sectionType: s.sectionType, label: s.label, required: s.required, repeatable: s.repeatable }))).toEqual(def?.skeleton);
    expect(CONTENT_BLOCK_TYPES).toHaveLength(21);
  });

  it("lolos CH-06 dengan contractKind agentWorkReport dan lolos validateSkeleton (SR-06)", () => {
    expect(contractRecordSkeletonIssues(LAPORAN_SLOTS, "agentWorkReport")).toEqual([]);
    expect(validateSkeleton({ slots: LAPORAN_SLOTS }).slots.map((s) => s.slotKey)).toEqual(["record", "content", "references"]);
  });
});

describe("DC-29 CH-06 di createTemplateV2 (simpan templat baru)", () => {
  it("kerangka laporan + contractKind terdaftar: CH-06 lolos, berhenti di preset (DB kosong)", async () => {
    const e = await caught(create(LAPORAN_SLOTS, "agentWorkReport"));
    expect(e.code).toBe("TEMPLATE_NOT_FOUND");
  });

  it("kerangka tanpa slot contractRecord tanpa contractKind: CH-06 tidak berlaku (templat non-kontrak tidak berubah)", async () => {
    const e = await caught(create(CHAPTER_ONLY));
    expect(e.code).toBe("TEMPLATE_NOT_FOUND");
  });

  it("slot contractRecord pada templat tanpa contractKind: 400 SCHEMA_INVALID checkId SKELETON_CONTRACT_RECORD", async () => {
    const e = await caught(create(LAPORAN_SLOTS));
    expect(e.code).toBe("SCHEMA_INVALID");
    expect(e.httpStatus).toBe(400);
    expect(issuesOf(e)).toEqual([expect.objectContaining({ pointer: "/template/skeleton/slots/0", keyword: "dependentRequired", checkId: "SKELETON_CONTRACT_RECORD" })]);
  });

  it("dua slot contractRecord: CH-06 maxContains pada slot kedua (sebelum aturan SR-06)", async () => {
    const dup = { ...LAPORAN_SLOTS[0], slotKey: "record2", position: 4 };
    const e = await caught(create([...LAPORAN_SLOTS, dup], "agentWorkReport"));
    expect(e.code).toBe("SCHEMA_INVALID");
    expect(issuesOf(e)).toEqual([expect.objectContaining({ pointer: "/template/skeleton/slots/3", keyword: "maxContains", checkId: "SKELETON_CONTRACT_RECORD" })]);
  });

  it("slot contractRecord berulang: CH-06 const", async () => {
    const e = await caught(create([{ ...LAPORAN_SLOTS[0], repeatable: true }, LAPORAN_SLOTS[1]], "agentWorkReport"));
    expect(e.code).toBe("SCHEMA_INVALID");
    expect(issuesOf(e)).toEqual([expect.objectContaining({ pointer: "/template/skeleton/slots/0", keyword: "const", checkId: "SKELETON_CONTRACT_RECORD" })]);
  });

  it("contractKind tidak terdaftar: 400 SCHEMA_INVALID pada /contractKind", async () => {
    const e = await caught(create(LAPORAN_SLOTS, "jenisFiktif"));
    expect(e.code).toBe("SCHEMA_INVALID");
    expect(issuesOf(e)[0]?.pointer).toBe("/contractKind");
  });

  it("templat jenis kontrak oleh non-ADMIN: 403 FORBIDDEN", async () => {
    const e = await caught(create(LAPORAN_SLOTS, "agentWorkReport", USER));
    expect(e.code).toBe("FORBIDDEN");
    expect((e.details as { reason?: string }).reason).toBe("CONTRACT_TEMPLATE_ADMIN_ONLY");
  });
});

describe("DC-29 CH-06 di createTemplateVersionV2 (simpan versi / R19 kerangka)", () => {
  const base = { id: "t1", slug: "templat-uji", isPreset: false, isCanonical: false, latestVersionNo: 1 };
  const version = (contractKind: string | null) =>
    createTemplateVersionV2InTx(fakeTx({ ...base, contractKind }), "t1", { baseVersionNo: 1, changeNote: "uji DC-29", template: tpl(LAPORAN_SLOTS) }, ADMIN);

  it("templat tanpa contractKind: slot contractRecord ditolak CH-06", async () => {
    const e = await caught(version(null));
    expect(e.code).toBe("SCHEMA_INVALID");
    expect(issuesOf(e)[0]).toEqual(expect.objectContaining({ pointer: "/template/skeleton/slots/0", checkId: "SKELETON_CONTRACT_RECORD" }));
  });

  it("templat ber-contractKind agentWorkReport: CH-06 lolos (galat berikutnya bukan SCHEMA_INVALID)", async () => {
    const e = await caught(version("agentWorkReport"));
    expect(e.code).not.toBe("SCHEMA_INVALID");
  });
});
