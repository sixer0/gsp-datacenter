/**
 * DC-14: bagian murni layanan retrieval (validasi filter R21/R22, kursor,
 * pembentuk WHERE terparameter). Tanpa DB.
 */
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { StudioEngineError } from "@/lib/studio/contract/errors";
import {
  contractFilterIssues,
  contractWhere,
  dateOnly,
  decodeSearchCursor,
  encodeSearchCursor,
  isCalendarDate,
  missingRequiredOf,
  parseContractQuery,
  parseSearchQuery,
  searchConditions,
  searchFilterIssues,
  splitList,
} from "@/lib/studio/services/query";

const DOC_ID = "cmvjwg7mp0000v12csv4n257p";

function sp(q: string): URLSearchParams {
  return new URLSearchParams(q);
}

function issuesOf(fn: () => unknown): Array<{ pointer: string; keyword: string }> {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(StudioEngineError);
    const err = e as StudioEngineError;
    expect(err.code).toBe("SCHEMA_INVALID");
    return err.details as Array<{ pointer: string; keyword: string }>;
  }
  throw new Error("expected SCHEMA_INVALID");
}

describe("DC-14 parseContractQuery (R21)", () => {
  it("menerima filter lengkap yang sah", () => {
    const f = parseContractQuery(
      sp("mission=MIS-1&docKey=lap-kerja&docNumber=000-GSP&kind=agentWorkReport&status=complete,%20blocked,complete&cardId=t_ac989baa&owner=coder-execution&taskRef=DC-14&dueAfter=2026-10-01&dueBefore=2026-10-31&take=10&cursor=" + DOC_ID),
    );
    expect(f).toEqual({
      mission: "MIS-1",
      docKey: "lap-kerja",
      docNumber: "000-GSP",
      kind: "agentWorkReport",
      status: ["complete", "blocked"],
      cardId: "t_ac989baa",
      owner: "coder-execution",
      taskRef: "DC-14",
      dueAfter: "2026-10-01",
      dueBefore: "2026-10-31",
      take: 10,
      cursor: DOC_ID,
    });
  });

  it("filter kosong sah (bawaan diputus layanan)", () => {
    expect(parseContractQuery(sp(""))).toEqual({});
  });

  it("parameter tak dikenal dan ganda -> SCHEMA_INVALID /query/<nama>", () => {
    const iss = issuesOf(() => parseContractQuery(sp("foo=1&status=draft&status=complete")));
    expect(iss.map((i) => [i.pointer, i.keyword])).toEqual([
      ["/query/foo", "additionalProperties"],
      ["/query/status", "duplicate"],
    ]);
  });

  it("nilai tidak sah per medan", () => {
    const iss = issuesOf(() =>
      parseContractQuery(sp("kind=other&status=done&cardId=T_AC989BAA&owner=Coder&taskRef=-x&dueBefore=2026-02-30&take=201&cursor=x")),
    );
    const ptrs = iss.map((i) => i.pointer);
    for (const p of ["kind", "status", "cardId", "owner", "taskRef", "dueBefore", "take", "cursor"]) expect(ptrs).toContain(`/query/${p}`);
  });

  it("status melebihi C45.statusListMax ditolak", () => {
    const iss = contractFilterIssues({ status: Array(9).fill("draft") });
    expect(iss.some((i) => i.pointer === "/query/status" && i.keyword === "length")).toBe(true);
  });

  it("take bukan bilangan bulat ditolak", () => {
    expect(issuesOf(() => parseContractQuery(sp("take=1.5")))[0].pointer).toBe("/query/take");
    expect(issuesOf(() => parseContractQuery(sp("take=0")))[0].pointer).toBe("/query/take");
  });

  it("mission > 120 dan docNumber > 80 ditolak", () => {
    const iss = issuesOf(() => parseContractQuery(sp(`mission=${"m".repeat(121)}&docNumber=${"d".repeat(81)}`)));
    expect(iss.map((i) => i.pointer).sort()).toEqual(["/query/docNumber", "/query/mission"]);
  });
});

describe("DC-14 contractWhere", () => {
  it("hanya ber-contractKind; cardId lewat has (GIN @>); tenggat inklusif UTC", () => {
    const w = contractWhere({ status: ["complete"], cardId: "t_ac989baa", dueAfter: "2026-10-01", dueBefore: "2026-10-31" });
    expect(w.contractKind).toEqual({ not: null });
    expect(w.contractStatus).toEqual({ in: ["complete"] });
    expect(w.contractCardIds).toEqual({ has: "t_ac989baa" });
    expect(w.contractDueOn).toEqual({ gte: new Date("2026-10-01T00:00:00.000Z"), lte: new Date("2026-10-31T00:00:00.000Z") });
  });

  it("kind dan prafilter docNumber", () => {
    const w = contractWhere({ kind: "agentWorkReport" }, ["a"]);
    expect(w.contractKind).toBe("agentWorkReport");
    expect(w.id).toEqual({ in: ["a"] });
  });

  it("dateOnly dan missingRequiredOf", () => {
    expect(dateOnly(new Date("2026-10-30T00:00:00.000Z"))).toBe("2026-10-30");
    expect(dateOnly(null)).toBeNull();
    expect(missingRequiredOf({ missingRequired: ["record"] })).toEqual(["record"]);
    expect(missingRequiredOf({ missingRequired: [1] })).toEqual([]);
    expect(missingRequiredOf(null)).toEqual([]);
  });
});

describe("DC-14 parseSearchQuery (R22)", () => {
  it("q dipangkas; type daftar; revisionNo bersama documentId", () => {
    const f = parseSearchQuery(sp(`q=%20%20laporan%20kerja%20&documentId=${DOC_ID}&revisionNo=3&type=paragraph,table&slotKey=bab&take=5`));
    expect(f).toEqual({ q: "laporan kerja", documentId: DOC_ID, revisionNo: 3, type: ["paragraph", "table"], slotKey: "bab", take: 5 });
  });

  it("q kosong / terlalu pendek / terlalu panjang -> /query/q", () => {
    expect(issuesOf(() => parseSearchQuery(sp("")))[0].pointer).toBe("/query/q");
    expect(issuesOf(() => parseSearchQuery(sp("q=%20a%20")))[0].pointer).toBe("/query/q");
    expect(issuesOf(() => parseSearchQuery(sp(`q=${"x".repeat(201)}`)))[0].pointer).toBe("/query/q");
  });

  it("revisionNo tanpa documentId ditolak", () => {
    const iss = issuesOf(() => parseSearchQuery(sp("q=laporan&revisionNo=2")));
    expect(iss).toEqual([expect.objectContaining({ pointer: "/query/revisionNo", keyword: "dependentRequired" })]);
  });

  it("type tak dikenal, > 8 butir, parameter asing", () => {
    expect(searchFilterIssues({ q: "ab", type: ["bogus"] })[0].pointer).toBe("/query/type");
    expect(searchFilterIssues({ q: "ab", type: Array.from({ length: 9 }, (_, i) => `t${i}`) }).some((i) => i.keyword === "length")).toBe(true);
    expect(issuesOf(() => parseSearchQuery(sp("q=ab&mode=x")))[0].pointer).toBe("/query/mode");
  });

  it("type menerima C33, sourceRegisterEntry, contractItem", () => {
    expect(searchFilterIssues({ q: "ab", type: ["cover", "sourceRegisterEntry", "contractItem", "paragraph"] })).toEqual([]);
  });

  it("q berisi kutip/operator lolos validasi (dinetralkan oleh websearch_to_tsquery)", () => {
    expect(parseSearchQuery(sp(`q=${encodeURIComponent(`"laporan' -kerja or t_ac989baa ); DROP TABLE x; --`)}`)).q).toContain("DROP");
  });
});

describe("DC-14 kursor teks penuh", () => {
  it("encode/decode bolak-balik tepat (float8)", () => {
    const c = { r: 0.0607927106320858, id: DOC_ID };
    expect(decodeSearchCursor(encodeSearchCursor(c))).toEqual(c);
  });

  it("kursor rusak ditolak", () => {
    const bad = [
      "",
      "!!!",
      Buffer.from("not json").toString("base64url"),
      Buffer.from(JSON.stringify({ r: -1, id: DOC_ID })).toString("base64url"),
      Buffer.from(JSON.stringify({ r: 1, id: "X" })).toString("base64url"),
      Buffer.from(JSON.stringify({ r: 1, id: DOC_ID, x: 1 })).toString("base64url"),
      Buffer.from(JSON.stringify([1, DOC_ID])).toString("base64url"),
      "a".repeat(201),
    ];
    for (const b of bad) expect(decodeSearchCursor(b)).toBeNull();
    expect(issuesOf(() => parseSearchQuery(sp("q=ab&cursor=abc")))[0].pointer).toBe("/query/cursor");
  });
});

describe("DC-14 searchConditions terparameter", () => {
  it("nilai pengguna hanya di values, tidak di teks SQL", () => {
    const evil = `x'); DROP TABLE "StudioDocument"; --`;
    const conds = searchConditions({ q: "ab", mission: evil, type: ["paragraph", "table"], slotKey: "bab", cursor: encodeSearchCursor({ r: 0.5, id: DOC_ID }) });
    const sql = Prisma.join(conds, " AND ");
    expect(sql.sql).not.toContain("DROP");
    expect(sql.values).toContain(evil);
    expect(sql.values).toEqual(expect.arrayContaining(["paragraph", "table", "bab", 0.5, DOC_ID]));
    expect(sql.sql).toContain(`rv."revisionNo" = d."currentRevisionNo"`);
    expect(sql.sql).toContain("numnode(q.q) > 0");
  });

  it("revisionNo eksplisit menggantikan lingkup revisi terkini", () => {
    const sql = Prisma.join(searchConditions({ q: "ab", documentId: DOC_ID, revisionNo: 2 }), " AND ");
    expect(sql.sql).not.toContain("currentRevisionNo");
    expect(sql.values).toEqual([DOC_ID, 2]);
  });
});

describe("DC-14 pembantu", () => {
  it("isCalendarDate dan splitList", () => {
    expect(isCalendarDate("2026-02-28")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-2-3")).toBe(false);
    expect(splitList(" a, ,b,a ")).toEqual(["a", "b"]);
  });
});
