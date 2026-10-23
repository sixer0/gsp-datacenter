"use client";

/*
 * Context halaman dokumen (SR-30; UX-01 §6.3): kepala (R05 terbaru + R14) dimuat
 * SEKALI dan dibagikan ke keempat tab. Tab Baca memuat isinya sendiri secara
 * malas. Pembaruan otomatis 30 s hanya bila tab peramban terlihat dan pengguna
 * tidak sedang menyunting (§3b); perubahan kelengkapan diumumkan lewat
 * wilayah aria-live tunggal (`useNotice().announce`).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CompletenessReportV2 } from "@/lib/studio/contract";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery, type StudioQueryResult } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { getDocument, getStructure } from "./doc-api";
import { buildNumberIndex, slotLabelMap, type DocumentDetail, type NumberIndex, type StructureResponse } from "./doc-model";

export type DocTab = "baca" | "kelengkapan" | "berkas" | "riwayat";
export const DOC_TABS: ReadonlyArray<{ id: DocTab; label: string }> = [
  { id: "baca", label: "Baca & sunting" },
  { id: "kelengkapan", label: "Kelengkapan" },
  { id: "berkas", label: "Berkas" },
  { id: "riwayat", label: "Riwayat" },
];

export interface DocNavigation {
  tab?: DocTab;
  /** `null` = kembali ke versi terbaru. */
  versi?: number | null;
  /** Paragraf terpilih (URL saja). `null` = hapus. */
  p?: string | null;
  /** Bagian/bab yang dituju di tab Baca ("slotKey" atau "slotKey:bab"). */
  target?: string | null;
}

export interface DocPageState {
  id: string;
  tab: DocTab;
  /** Versi lama yang sedang dilihat (baca saja); `null` = terbaru. */
  versi: number | null;
  selectedPid: string | null;
  target: string | null;
  detail: StudioQueryResult<DocumentDetail>;
  structure: StudioQueryResult<StructureResponse>;
  report: CompletenessReportV2 | null;
  slotLabels: Map<string, string>;
  numbers: NumberIndex;
  latestRevisionNo: number | null;
  isAdmin: boolean;
  /** Ada sunting yang belum disimpan (menahan pembaruan otomatis). */
  editing: boolean;
  setEditing: (v: boolean) => void;
  /** Muat ulang kepala + memberi tanda isi agar dimuat ulang. */
  refreshAll: () => void;
  /** Penanda berubah setiap `refreshAll` (dipakai tab Baca/Berkas). */
  refreshTick: number;
  navigate: (n: DocNavigation) => void;
}

const DocContext = createContext<DocPageState | null>(null);

export function useDocPage(): DocPageState {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error("useDocPage di luar DocPageProvider");
  return ctx;
}

const AUTO_REFRESH_MS = 30_000;

function filledKeys(r: CompletenessReportV2 | null): Map<string, string> {
  const m = new Map<string, string>();
  if (!r) return m;
  for (const s of r.slots) if (s.state === "FILLED") m.set(s.slotKey, s.lastFilledBy ?? "");
  for (const [slotKey, prog] of Object.entries(r.chapters ?? {})) for (const p of prog.present) m.set(`${slotKey}:${p.key}`, p.by);
  return m;
}

export function DocPageProvider({
  id,
  tab,
  versi,
  selectedPid,
  target,
  navigate,
  children,
}: {
  id: string;
  tab: DocTab;
  versi: number | null;
  selectedPid: string | null;
  target: string | null;
  navigate: (n: DocNavigation) => void;
  children: ReactNode;
}) {
  const { isAdmin } = useViewer();
  const { announce } = useNotice();
  const [editing, setEditing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const detail = useStudioQuery(`doc:${id}`, (signal) => getDocument(id, null, signal), { source: "documents.detail" });
  const structure = useStudioQuery(`doc-structure:${id}`, (signal) => getStructure(id, null, signal), { source: "documents.structure" });
  const { refetch: refetchDetail } = detail;
  const { refetch: refetchStructure } = structure;

  const refreshAll = useCallback(() => {
    refetchDetail();
    refetchStructure();
    setRefreshTick((n) => n + 1);
  }, [refetchDetail, refetchStructure]);

  // Pembaruan otomatis 30 s: hanya tab terlihat, tanpa sunting aktif.
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && !editingRef.current) refetchDetail();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refetchDetail]);

  const report = detail.data?.completeness ?? structure.data?.completeness ?? null;

  // Umumkan bagian/bab yang baru terisi sejak muatan sebelumnya.
  const prevReport = useRef<CompletenessReportV2 | null>(null);
  useEffect(() => {
    const prev = prevReport.current;
    prevReport.current = report;
    if (!prev || !report || report.revisionNo <= prev.revisionNo) return;
    const before = filledKeys(prev);
    const labels = slotLabelMap(report);
    const fresh: string[] = [];
    for (const [k, by] of filledKeys(report)) {
      if (before.has(k)) continue;
      const i = k.indexOf(":");
      const name = i > 0 ? `Bab ${k.slice(i + 1)}` : labels.get(k) ?? "Satu bagian";
      fresh.push(by ? `${name} baru saja diisi oleh ${by}` : `${name} baru saja diisi`);
    }
    if (fresh.length) announce(fresh.slice(0, 3).join(". "));
  }, [report, announce]);

  const value = useMemo<DocPageState>(() => {
    const d = detail.data;
    return {
      id,
      tab,
      versi,
      selectedPid,
      target,
      detail,
      structure,
      report,
      slotLabels: slotLabelMap(report, d?.slots),
      numbers: buildNumberIndex(d?.slots ?? []),
      latestRevisionNo: d?.document.currentRevisionNo ?? null,
      isAdmin,
      editing,
      setEditing,
      refreshAll,
      refreshTick,
      navigate,
    };
  }, [id, tab, versi, selectedPid, target, detail, structure, report, isAdmin, editing, refreshAll, refreshTick, navigate]);

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>;
}
