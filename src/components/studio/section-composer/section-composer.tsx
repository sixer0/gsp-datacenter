"use client";

/*
 * Susunan dokumen — langkah 3 editor templat (SR-28; UX-01 W4, alur 3a
 * langkah 3-4, §5.3 K-2/K-3/K-6; blueprint §2.12; D-127, D-163 T-1/T-2,
 * D-165/D-170).
 *
 * - Data: R02 (definisi + nilai efektif templat) dan R19 (kerangka) lewat klien
 *   bersama editor templat (SR-29); R03 jenis bagian + kenop esensial; R08
 *   pemeriksaan susunan.
 * - Draf disimpan di draf templat bersama (`template-draft.ts`, localStorage)
 *   sehingga pindah ke langkah Gaya/Pengaturan tidak kehilangan perubahan dan
 *   SATU "Simpan versi" mengirim gabungan esensial + kerangka lewat R02 (T-2).
 * - Satu tindakan utama per layar: "Simpan versi n" (P6).
 * - Pengaturan lanjutan hanya ADMIN (T-1); USER tidak merender panelnya.
 * - Tanpa pengaturan per bab (blueprint §2.12).
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Plus, TriangleAlert } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui/kit";
import { ConfirmDialog } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { isAbortError, isStudioApiError } from "@/components/studio/shared/http";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { sectionTypeLabel, TIER_LABEL } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import {
  getSkeleton as getTemplateSkeleton,
  getTemplateDetail,
  saveTemplateVersionV2,
  type SkeletonResponse,
  type TemplateDetailV2,
} from "@/components/studio/template-editor/api";
import { countChangedKeys, definitionOf, editabilityOf, toTemplateV2 } from "@/components/studio/template-editor/model";
import { SaveVersion } from "@/components/studio/template-editor/save-version";
import { clearTemplateDraft, readTemplateDraft, writeTemplateDraft, type TemplateDraft } from "@/components/studio/template-editor/template-draft";
import { TemplateStepper, type TemplateStepId } from "@/components/studio/template-editor/template-stepper";
import type { TemplateSlotDef } from "@/lib/studio/contract/types/v2/template";
import { checkSkeletonRemote, getEssentials, getSlotKinds, type EssentialsCatalog, type EssentialKnobSpec, type SlotKindDef } from "./api";
import { AddSectionDialog } from "./add-section-dialog";
import { SectionCard } from "./section-card";
import { StructureCheck, type RemoteState } from "./structure-check";
import {
  checkStructure,
  insertIndex,
  lockedPlace,
  moveSlot,
  newSlot,
  sameValue,
  slotIndexFromPointer,
  slotsFromSkeleton,
  summarizeChanges,
  toSkeleton,
  type Slot,
  type StructureIssue,
} from "./model";

export interface SectionComposerProps {
  templateId: string;
}

const NO_KNOBS: readonly EssentialKnobSpec[] = [];

// ── Layar sentuh: seret dinonaktifkan (pakai menu), UX-01 §6.6 ───────────

function subscribeCoarse(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function coarseSnapshot(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}
function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeCoarse, coarseSnapshot, () => false);
}

function nameOf(s: Slot): string {
  return s.label?.trim() || sectionTypeLabel(s.sectionType);
}

// ── Pembungkus muat ──────────────────────────────────────────────────────

export function SectionComposer({ templateId }: SectionComposerProps) {
  const viewer = useViewer();
  const detailQ = useStudioQuery(`sr28:template:${templateId}`, (s) => getTemplateDetail(templateId, undefined, s), {
    source: "section-composer.template",
  });
  const skelQ = useStudioQuery(`sr28:skeleton:${templateId}`, (s) => getTemplateSkeleton(templateId, undefined, s), {
    source: "section-composer.skeleton",
  });
  const kindsQ = useStudioQuery("sr28:registry:slots", (s) => getSlotKinds(s), { source: "section-composer.section-kinds" });
  const essQ = useStudioQuery("sr28:registry:essentials", (s) => getEssentials(s), { source: "section-composer.essentials" });

  const { refetch: refetchDetail } = detailQ;
  const { refetch: refetchSkel } = skelQ;
  const reload = useCallback(() => {
    refetchDetail();
    refetchSkel();
  }, [refetchDetail, refetchSkel]);

  if ((detailQ.isLoading && !detailQ.data) || (skelQ.isLoading && skelQ.data === undefined)) return <ComposerLoading />;

  const failed = detailQ.error && !detailQ.data ? detailQ : skelQ.error && skelQ.data === undefined ? skelQ : null;
  if (failed) {
    return (
      <ErrorView
        error={failed.error}
        title="Susunan dokumen tidak dapat dimuat"
        context={{ subject: "Templat" }}
        onRetry={() => void failed.retry()}
        cooldown={failed.cooldown}
        actions={
          <Button href="/studio/templates" variant="ghost" className="whitespace-nowrap">
            Kembali ke Templat
          </Button>
        }
      />
    );
  }
  const detail = detailQ.data;
  if (!detail) return <ComposerLoading />;

  const skeleton = skelQ.data ?? null;
  const rawSlots: TemplateSlotDef[] | null = skeleton?.skeleton?.slots ?? detail.definition?.skeleton?.slots ?? null;
  if (!rawSlots) {
    return (
      <EmptyState
        title="Susunan dokumen templat ini belum dapat dibaca"
        hint="Server belum mengirim susunan bagian untuk templat ini. Coba lagi sebentar lagi atau hubungi admin."
        action={
          <Button variant="ghost" onClick={reload} className="whitespace-nowrap">
            Coba lagi
          </Button>
        }
      />
    );
  }

  const versionNo = detail.version.versionNo;
  const sha = skeleton?.skeletonSha256 ?? detail.skeletonSha256 ?? "";
  return (
    <ComposerEditor
      key={`${versionNo}:${sha}`}
      templateId={templateId}
      detail={detail}
      skeleton={skeleton}
      baseSlots={slotsFromSkeleton({ $schema: "studio.skeleton/v1", slots: rawSlots })}
      kinds={kindsQ.data ?? []}
      kindsFailed={!!kindsQ.error && !kindsQ.data}
      essentials={essQ.data ?? null}
      essentialsFailed={!!essQ.error && !essQ.data}
      onRetryEssentials={() => void essQ.retry()}
      isAdmin={viewer.isAdmin}
      viewerLoading={viewer.loading}
      username={viewer.viewer?.username ?? null}
      onSaved={reload}
    />
  );
}

function ComposerLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat susunan dokumen" className="space-y-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-9 w-full max-w-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────

type ConfirmState = { kind: "remove"; slotKey: string } | { kind: "optional"; slotKey: string } | { kind: "leave"; href: string } | null;

interface EditorProps {
  templateId: string;
  detail: TemplateDetailV2;
  skeleton: SkeletonResponse | null;
  baseSlots: Slot[];
  kinds: readonly SlotKindDef[];
  kindsFailed: boolean;
  essentials: EssentialsCatalog | null;
  essentialsFailed: boolean;
  onRetryEssentials: () => void;
  isAdmin: boolean;
  viewerLoading: boolean;
  username: string | null;
  onSaved: () => void;
}

function ComposerEditor(props: EditorProps) {
  const { templateId, detail, skeleton, baseSlots, kinds, essentials, isAdmin, username } = props;
  const router = useRouter();
  const { notify, announce } = useNotice();
  const coarse = useCoarsePointer();
  const versionNo = detail.version.versionNo;
  const inherited = detail.version.resolvedParams ?? null;
  const templateName = detail.template.name;

  // Draf bersama editor templat (dibaca sekali saat dipasang; versi lain dibuang).
  const [initialDraft] = useState<TemplateDraft | null>(() => readTemplateDraft(templateId, versionNo));
  const [slots, setSlots] = useState<Slot[]>(() =>
    initialDraft?.slots && initialDraft.slots.length > 0 ? slotsFromSkeleton({ $schema: "studio.skeleton/v1", slots: initialDraft.slots }) : baseSlots,
  );
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [cardNotice, setCardNotice] = useState<{ slotKey: string; text: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saveError, setSaveError] = useState<{ text: string; conflict: boolean; issues: StructureIssue[] } | null>(null);
  const [drag, setDrag] = useState<{ from: number; over: number | null; pos: "before" | "after" } | null>(null);
  const cardRefs = useRef(new Map<string, HTMLLIElement>());
  const saveRef = useRef<HTMLDivElement>(null);

  const editability = props.viewerLoading
    ? { canEdit: false, reason: null as string | null, offerCopy: false }
    : editabilityOf(detail.template, { isAdmin, username }, false);
  const readOnly = !editability.canEdit;
  const isPreset = detail.template.isPreset === true;

  const kindByType = useMemo(() => new Map<string, SlotKindDef>(kinds.map((k) => [k.sectionType, k])), [kinds]);
  const knobsFor = useCallback((t: string) => essentials?.bySectionType[t] ?? NO_KNOBS, [essentials]);
  const baseByKey = useMemo(() => new Map(baseSlots.map((s) => [s.slotKey, s])), [baseSlots]);

  // ── Perubahan + draf ──
  const slotChanges = useMemo(() => summarizeChanges(baseSlots, slots, knobsFor, inherited), [baseSlots, slots, knobsFor, inherited]);
  const dirty = !sameValue(toSkeleton(slots).slots, toSkeleton(baseSlots).slots);
  const otherChanges = useMemo(() => {
    const out: string[] = [];
    if (!initialDraft) return out;
    if (initialDraft.preset && !sameValue(initialDraft.preset, detail.definition?.preset)) {
      out.push(initialDraft.presetName ? `Gaya: diganti menjadi ${initialDraft.presetName}` : "Gaya diganti");
    }
    if (initialDraft.essentials) {
      const n = countChangedKeys(detail.definition?.essentials ?? {}, initialDraft.essentials);
      if (n > 0) out.push(`${n.toLocaleString("id-ID")} pengaturan dokumen diubah di langkah Pengaturan`);
    }
    if (isAdmin && initialDraft.advanced) {
      const n = countChangedKeys(detail.definition?.advanced ?? {}, initialDraft.advanced);
      if (n > 0) out.push(`${n.toLocaleString("id-ID")} pengaturan lanjutan dokumen diubah`);
    }
    return out;
  }, [initialDraft, detail.definition, isAdmin]);
  const changes = useMemo(() => [...otherChanges, ...slotChanges], [otherChanges, slotChanges]);

  useEffect(() => {
    if (readOnly) return;
    if (dirty) writeTemplateDraft(templateId, { baseVersionNo: versionNo, slots: toSkeleton(slots).slots });
    else if (readTemplateDraft(templateId, versionNo)?.slots) writeTemplateDraft(templateId, { baseVersionNo: versionNo, slots: undefined });
  }, [dirty, slots, templateId, versionNo, readOnly]);

  // Pemulihan draf: beri tahu sekali.
  const restored = useRef(!!initialDraft?.slots && initialDraft.slots.length > 0 && !sameValue(initialDraft.slots, toSkeleton(baseSlots).slots));
  useEffect(() => {
    if (!restored.current) return;
    restored.current = false;
    notify({
      message: "Perubahan susunan yang belum disimpan dipulihkan dari browser ini.",
      tone: "info",
      durationMs: 8000,
      action: { label: "Buang draf", onClick: () => setSlots(baseSlots) },
    });
  }, [notify, baseSlots]);

  // Penjaga tinggalkan halaman (K-6): muat ulang/tutup tab.
  useEffect(() => {
    if (!dirty || readOnly) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty, readOnly]);

  // ── Pemeriksaan susunan ──
  const localIssues = useMemo(() => checkStructure(slots, kinds.length ? kindByType : null), [slots, kinds.length, kindByType]);
  const skeletonJson = useMemo(() => JSON.stringify(toSkeleton(slots)), [slots]);
  const [remote, setRemote] = useState<{ key: string; state: RemoteState } | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      checkSkeletonRemote(JSON.parse(skeletonJson), ctrl.signal).then(
        (r) => {
          const current = (JSON.parse(skeletonJson) as { slots: Slot[] }).slots;
          const issues: StructureIssue[] = r.issues.map((i) => {
            const idx = slotIndexFromPointer(i.pointer);
            const s = idx !== undefined ? current[idx] : undefined;
            return s
              ? { level: "error", index: idx, message: `${nameOf(s)}: isian bagian ini belum sesuai aturan susunan.` }
              : { level: "error", message: "Susunan belum sesuai bentuk yang diterima Studio." };
          });
          const unique = issues.filter((x, n) => issues.findIndex((y) => y.message === x.message) === n);
          setRemote({
            key: skeletonJson,
            state: r.valid ? { status: "ok" } : { status: "invalid", issues: unique, raw: r.issues.map((i) => `${i.pointer} ${i.message}`).join("; ") },
          });
        },
        (e: unknown) => {
          if (isAbortError(e)) return;
          setRemote({ key: skeletonJson, state: { status: "unavailable" } });
        },
      );
    }, 900);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [skeletonJson]);
  const remoteState = useMemo<RemoteState>(() => (remote && remote.key === skeletonJson ? remote.state : { status: "checking" }), [remote, skeletonJson]);

  const problemsByIndex = useMemo(() => {
    const m = new Map<number, string[]>();
    const all = [...localIssues.filter((i) => i.level === "error"), ...(remoteState.status === "invalid" ? remoteState.issues : []), ...(saveError?.issues ?? [])];
    for (const i of all) {
      if (i.index === undefined) continue;
      const arr = m.get(i.index) ?? [];
      if (!arr.includes(i.message)) arr.push(i.message);
      m.set(i.index, arr);
    }
    return m;
  }, [localIssues, remoteState, saveError]);
  const hasBlockingIssue = localIssues.some((i) => i.level === "error") || remoteState.status === "invalid";

  // ── Tindakan ──
  const focusCard = useCallback((slotKey: string) => {
    window.requestAnimationFrame(() => cardRefs.current.get(slotKey)?.focus());
  }, []);

  const focusIndex = useCallback(
    (index: number) => {
      const s = slots[index];
      if (!s) return;
      cardRefs.current.get(s.slotKey)?.scrollIntoView({ block: "center", behavior: "smooth" });
      focusCard(s.slotKey);
    },
    [slots, focusCard],
  );

  const move = (from: number, to: number) => {
    if (readOnly) return;
    const s = slots[from];
    if (!s) return;
    const r = moveSlot(slots, from, to);
    if (!r.ok) {
      const lockedIdx = r.lockedIndex >= 0 ? r.lockedIndex : from;
      const locked = slots[lockedIdx];
      const text =
        lockedIdx === from
          ? `${nameOf(s)} ${lockedPlace(from, slots.length)}; posisinya tetap sehingga tidak dapat dipindah.`
          : `Tidak dapat dipindah ke sana: ${nameOf(locked)} ${lockedPlace(lockedIdx, slots.length)}.`;
      setCardNotice({ slotKey: s.slotKey, text });
      announce(text);
      return;
    }
    if (to === from || r.slots === slots) return;
    setSlots(r.slots);
    setCardNotice(null);
    setSaveError(null);
    const at = r.slots.indexOf(s);
    announce(`${nameOf(s)} dipindah ke posisi ${at + 1} dari ${r.slots.length}`);
    focusCard(s.slotKey);
  };

  const patch = (slotKey: string, next: Slot) => {
    setSlots((xs) => xs.map((x) => (x.slotKey === slotKey ? next : x)));
    setSaveError(null);
  };

  const setRequired = (slotKey: string, next: boolean) => {
    const s = slots.find((x) => x.slotKey === slotKey);
    if (!s) return;
    if (!next && baseByKey.get(slotKey)?.required) {
      setConfirm({ kind: "optional", slotKey });
      return;
    }
    patch(slotKey, { ...s, required: next });
  };

  const remove = (slotKey: string) => {
    const idx = slots.findIndex((x) => x.slotKey === slotKey);
    const s = slots[idx];
    if (!s) return;
    const next = slots.filter((x) => x.slotKey !== slotKey);
    setSlots(next);
    setConfirm(null);
    setSaveError(null);
    setCardNotice(null);
    announce(`${nameOf(s)} dihapus dari susunan`);
    const neighbor = next[Math.min(idx, next.length - 1)];
    if (neighbor) focusCard(neighbor.slotKey);
  };

  const add = (kind: SlotKindDef, label: string) => {
    const s = newSlot(kind, slots, label);
    const at = insertIndex(slots);
    const next = [...slots];
    next.splice(at, 0, s);
    setSlots(next);
    setExpanded((e) => new Set(e).add(s.slotKey));
    setSaveError(null);
    announce(`${nameOf(s)} ditambahkan di posisi ${at + 1} dari ${next.length}`);
    focusCard(s.slotKey);
  };

  const onDragStart = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (readOnly || coarse || slots[index]?.positionLocked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slots[index].slotKey);
    setDrag({ from: index, over: null, pos: "before" });
  };
  const onDragOver = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const pos: "before" | "after" = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
    if (drag.over !== index || drag.pos !== pos) setDrag({ ...drag, over: index, pos });
  };
  const onDrop = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    if (!drag) return;
    let to = drag.pos === "before" ? index : index + 1;
    if (drag.from < to) to -= 1;
    const from = drag.from;
    setDrag(null);
    move(from, to);
  };

  // ── Simpan (langkah 4; R02 gabungan, D-163 T-2) ──
  const save = async (changeNote: string) => {
    setSaveError(null);
    try {
      const essentialKeys = new Set((essentials?.global ?? []).flatMap((k) => [...k.keys]));
      const def = definitionOf(detail, skeleton, essentialKeys, isAdmin);
      const draft = readTemplateDraft(templateId, versionNo);
      const merged = {
        ...def,
        preset: draft?.preset ?? def.preset,
        essentials: draft?.essentials ?? def.essentials,
        advanced: isAdmin && draft?.advanced ? draft.advanced : def.advanced,
        advancedLoaded: def.advancedLoaded || (isAdmin && !!draft?.advanced),
        roleFormats: isAdmin && draft?.roleFormats ? draft.roleFormats : def.roleFormats,
        slots: toSkeleton(slots).slots,
      };
      const res = await saveTemplateVersionV2(templateId, {
        baseVersionNo: versionNo,
        changeNote,
        template: toTemplateV2(merged, { isAdmin, isPreset }),
      });
      clearTemplateDraft(templateId);
      const saved = typeof res?.version?.versionNo === "number" ? res.version.versionNo : versionNo + 1;
      notify({ message: `Versi ${saved.toLocaleString("id-ID")} disimpan` });
      announce(`Versi ${saved} disimpan`);
      props.onSaved();
    } catch (e) {
      const m = errorMessages(e, { subject: "Templat" });
      const raw = isStudioApiError(e) && Array.isArray(e.details) ? (e.details as Array<{ pointer?: unknown; path?: unknown }>) : [];
      const issues: StructureIssue[] = [];
      for (const it of raw) {
        const ptr = typeof it?.pointer === "string" ? it.pointer : typeof it?.path === "string" ? it.path : undefined;
        const idx = slotIndexFromPointer(ptr);
        if (idx !== undefined && slots[idx]) issues.push({ level: "error", index: idx, message: `${nameOf(slots[idx])}: ditolak saat menyimpan (${m.title.toLowerCase()}).` });
      }
      setSaveError({ text: `${m.title}. ${m.body}`, conflict: isStudioApiError(e) && e.code === "VERSION_CONFLICT", issues });
      throw e;
    }
  };

  const onStepNavigate = (step: TemplateStepId): boolean => {
    if (step === "susunan") return true;
    if (step === "simpan") {
      saveRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      window.requestAnimationFrame(() => saveRef.current?.querySelector<HTMLElement>("textarea")?.focus());
      return true;
    }
    return false; // Gaya/Pengaturan: draf bersama terbawa, tidak perlu konfirmasi.
  };

  const confirmSlot = confirm && confirm.kind !== "leave" ? slots.find((s) => s.slotKey === confirm.slotKey) : undefined;
  const blockedReason = props.viewerLoading
    ? "Memeriksa hak ubah…"
    : readOnly
      ? editability.reason ?? "Susunan ini hanya dapat dibaca."
    : hasBlockingIssue
      ? "Perbaiki masalah di Pemeriksaan susunan lebih dulu."
      : null;

  return (
    <div className="space-y-6">
      {/* Kepala: remah roti + stepper */}
      <div className="space-y-3">
        <nav aria-label="Remah roti" className="text-[12.5px] text-[var(--text-2)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/studio/templates"
                onClick={(e) => {
                  if (dirty && !readOnly && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    setConfirm({ kind: "leave", href: "/studio/templates" });
                  }
                }}
                className="hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Templat
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/studio/templates/${encodeURIComponent(templateId)}`}
                className="hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {templateName}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-[var(--text)]">
              Susunan dokumen
            </li>
          </ol>
        </nav>
        <TemplateStepper
          templateId={templateId}
          current="susunan"
          statuses={{
            gaya: initialDraft?.preset ? "berubah" : undefined,
            pengaturan: initialDraft?.essentials ? "berubah" : undefined,
            susunan: dirty ? "berubah" : hasBlockingIssue ? "perhatian" : undefined,
          }}
          onNavigate={onStepNavigate}
        />
      </div>

      {readOnly && editability.reason && (
        <p className="flex items-start gap-2 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-3 text-[13px] text-[var(--text-2)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{editability.reason}</span>
        </p>
      )}
      {isAdmin && isPreset && (
        <p className="flex items-start gap-2 rounded-[10px] border border-[color-mix(in_srgb,var(--warn)_40%,var(--line))] px-4 py-3 text-[13px] text-[var(--text)]">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
          <span>Mengubah gaya: {templateName}. Perubahan gaya memengaruhi semua templat yang memakainya saat mereka menyimpan versi berikutnya.</span>
        </p>
      )}
      {(skeleton?.implicit ?? detail.implicit) && (
        <p className="flex items-start gap-2 text-[12.5px] text-[var(--text-2)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Susunan ini disusun dari pengaturan bagian versi lama. Simpan versi untuk menetapkannya sebagai susunan templat.</span>
        </p>
      )}

      {/* Daftar bagian */}
      <section aria-labelledby="judul-susunan" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 id="judul-susunan" className="text-[19px] font-semibold tracking-[-0.015em] text-[var(--text)]">
              Susunan dokumen
            </h1>
            <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
              {readOnly
                ? "Urutan bagian dalam dokumen yang dibuat dari templat ini."
                : coarse
                  ? "Urutan bagian dalam dokumen. Pakai menu di tiap bagian untuk menaikkan atau menurunkan."
                  : "Urutan bagian dalam dokumen. Seret untuk mengurutkan, atau fokus pada bagian lalu tekan Alt dan panah atas/bawah."}
            </p>
          </div>
          {!readOnly && (
            <Button variant="ghost" onClick={() => setAddOpen(true)} className="whitespace-nowrap">
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Tambah bagian
            </Button>
          )}
        </div>

        {props.essentialsFailed && (
          <p role="alert" className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--down)]">
            Pengaturan bagian belum dapat dimuat; urutan dan sakelar Wajib tetap dapat diubah.
            <button
              type="button"
              onClick={props.onRetryEssentials}
              className="rounded-md px-1.5 py-0.5 text-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Coba lagi
            </button>
          </p>
        )}

        {slots.length === 0 ? (
          <EmptyState
            title="Susunan masih kosong"
            hint="Tambahkan bagian, misalnya Sampul, Isi, dan Lampiran. Dokumen dari templat ini akan tersusun menurut urutan di sini."
            action={
              !readOnly ? (
                <Button variant="ghost" onClick={() => setAddOpen(true)} className="whitespace-nowrap">
                  Tambah bagian
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ol className="space-y-2" aria-label="Bagian dokumen berurutan">
            {slots.map((s, i) => (
              <SectionCard
                key={s.slotKey}
                ref={(el) => {
                  if (el) cardRefs.current.set(s.slotKey, el);
                  else cardRefs.current.delete(s.slotKey);
                }}
                slot={s}
                index={i}
                total={slots.length}
                kind={kindByType.get(s.sectionType)}
                knobs={knobsFor(s.sectionType)}
                inherited={inherited}
                isAdmin={isAdmin}
                readOnly={readOnly}
                expanded={expanded.has(s.slotKey)}
                dragEnabled={!coarse}
                notice={cardNotice?.slotKey === s.slotKey ? cardNotice.text : null}
                problems={problemsByIndex.get(i) ?? []}
                dropHint={drag && drag.over === i && drag.from !== i ? drag.pos : null}
                onToggleExpand={() =>
                  setExpanded((e) => {
                    const n = new Set(e);
                    if (n.has(s.slotKey)) n.delete(s.slotKey);
                    else n.add(s.slotKey);
                    return n;
                  })
                }
                onMove={(d) => move(i, i + d)}
                onRequiredChange={(n) => setRequired(s.slotKey, n)}
                onPatch={(next) => patch(s.slotKey, next)}
                onRemove={() => setConfirm({ kind: "remove", slotKey: s.slotKey })}
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                onDrop={onDrop(i)}
                onDragEnd={() => setDrag(null)}
              />
            ))}
          </ol>
        )}
      </section>

      <StructureCheck local={localIssues} remote={remoteState} labels={slots.map(nameOf)} onFocusSlot={focusIndex} />

      <div id="simpan-versi" ref={saveRef} className="scroll-mt-6 space-y-2">
        {saveError?.conflict && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={props.onSaved} className="whitespace-nowrap">
              Muat versi terbaru
            </Button>
          </div>
        )}
        <SaveVersion changes={changes} currentVersionNo={versionNo} onSave={save} error={saveError?.text ?? null} blockedReason={blockedReason} />
      </div>

      <InfoTeknis
        items={{
          Templat: detail.template.slug,
          Versi: versionNo,
          "Sidik susunan": skeleton?.skeletonSha256 ?? detail.skeletonSha256 ?? null,
          "Susunan implisit": String(skeleton?.implicit ?? detail.implicit ?? false),
          "Jenis bagian dimuat": props.kindsFailed ? "gagal" : kinds.length,
        }}
      />

      <AddSectionDialog open={addOpen} kinds={kinds} slots={slots} onAdd={add} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={confirm?.kind === "remove" && !!confirmSlot}
        title="Hapus bagian?"
        description={
          confirmSlot
            ? `Hapus bagian ${nameOf(confirmSlot)} dari susunan? Dokumen yang sudah ada tidak terpengaruh; dokumen baru tidak akan punya bagian ini.`
            : ""
        }
        confirmLabel="Hapus bagian"
        onConfirm={() => {
          if (confirmSlot) remove(confirmSlot.slotKey);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === "optional" && !!confirmSlot}
        title="Jadikan opsional?"
        description={
          confirmSlot
            ? `${nameOf(confirmSlot)} wajib di susunan versi ${versionNo.toLocaleString("id-ID")}${
                confirmSlot.tiers.length ? ` untuk terbitan ${confirmSlot.tiers.map((t) => TIER_LABEL[t]).join(", ")}` : ""
              }. Jadikan opsional? Dokumen bisa dinyatakan lengkap tanpa bagian ini.`
            : ""
        }
        confirmLabel="Jadikan opsional"
        onConfirm={() => {
          if (confirmSlot) patch(confirmSlot.slotKey, { ...confirmSlot, required: false });
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === "leave"}
        title="Tinggalkan halaman?"
        description="Ada perubahan yang belum disimpan. Tinggalkan halaman? Draf disimpan di browser ini."
        confirmLabel="Tinggalkan"
        cancelLabel="Tetap di sini"
        onConfirm={() => {
          const href = confirm?.kind === "leave" ? confirm.href : "/studio/templates";
          setConfirm(null);
          router.push(href);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
