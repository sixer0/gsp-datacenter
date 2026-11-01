"use client";

/**
 * Editor templat `/studio/templates/[id]` (SR-29; UX-01 §3a, W3; blueprint 05
 * §2.3, §2.12). Langkah: Gaya > Pengaturan > Susunan dokumen (SR-28) > Simpan
 * versi, dipilih lewat `?langkah=gaya|pengaturan|simpan`.
 *
 * - Gaya: pilih satu gaya (preset); ganti gaya yang sudah diatur = konfirmasi K-1.
 * - Pengaturan: kenop esensial global berlabel awam (R03 `kind=essentials`)
 *   + pratinjau langsung di samping (jeda 600 ms); "Pengaturan lanjutan"
 *   terlipat HANYA ADMIN (D-163 T-1).
 * - Simpan versi: SATU POST gabungan `studio.template/v2` (preset + esensial +
 *   kerangka) ke R02 (D-163 T-2); kerangka diambil dari draf Susunan dokumen
 *   (SR-28, `template-draft.ts`) bila ada.
 * - Mode gaya (ADMIN, templat `isPreset`): editor lengkap seluruh kunci.
 * Perubahan belum disimpan: draf `localStorage`, `beforeunload`, dan
 * konfirmasi K-6 untuk tautan keluar editor.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, History, Info } from "lucide-react";
import type { RoleFormatMap } from "@/lib/studio/contract/engine";
import type { ParamValue } from "@/lib/studio/contract/types/common";
import type { StudioTemplateV2 } from "@/lib/studio/contract/types/v2/template";
import { Button, Panel, Pill, Skeleton } from "@/components/ui/kit";
import { TemplatePreviewPane } from "@/components/studio/template-preview";
import { ConfirmDialog } from "@/components/studio/shared/dialog";
import { errorMessages } from "@/components/studio/shared/error-messages";
import { ErrorView } from "@/components/studio/shared/error-view";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { formatDateTime } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { AdvancedSettingsPanel, PresetModeEditor } from "./advanced-panel";
import {
  getEssentials,
  getParamRegistry,
  getSkeleton,
  getTemplateDetail,
  listPresets,
  saveTemplateVersionV2,
  type EssentialKnob,
  type PresetItem,
  type TemplateDetailV2,
} from "./api";
import { CreateTemplateDialog, type CopySource } from "./create-template-dialog";
import { EssentialKnobRow } from "./essential-knob";
import {
  changeSummary,
  definitionOf,
  editabilityOf,
  groupKnobs,
  knobKey,
  knobOverridden,
  knobValue,
  omitKey,
  splitBySurface,
  toTemplateV2,
  type ParamRecord,
  type TemplateDefinition,
} from "./model";
import { SaveVersion } from "./save-version";
import { StylePicker } from "./style-picker";
import { clearTemplateDraft, readTemplateDraft, writeTemplateDraft } from "./template-draft";
import { TemplateStepper, type TemplateStepId, type TemplateStepStatus } from "./template-stepper";
import { valuesEqual } from "./values";

export type EditorStep = "gaya" | "pengaturan" | "simpan";

const EMPTY: ParamRecord = {};

const fetchParams = (signal: AbortSignal) => getParamRegistry(signal);

interface EditorData {
  detail: TemplateDetailV2;
  knobs: EssentialKnob[];
  presets: PresetItem[];
  /** Kerangka R19 bila R02 belum membawa `definition`. */
  skeleton: Awaited<ReturnType<typeof getSkeleton>>;
}

async function loadEditor(id: string, versionNo: number | undefined, signal: AbortSignal): Promise<EditorData> {
  const [detail, essentials, presets] = await Promise.all([getTemplateDetail(id, versionNo, signal), getEssentials(signal), listPresets(signal)]);
  const needSkeleton = !Array.isArray(detail.definition?.skeleton?.slots);
  const skeleton = needSkeleton ? await getSkeleton(id, versionNo, signal) : null;
  return { detail, knobs: Array.isArray(essentials.global) ? essentials.global : [], presets: Array.isArray(presets.items) ? presets.items : [], skeleton };
}

export function TemplateEditor({
  templateId,
  versionNo,
  step,
  paramFilter,
}: {
  templateId: string;
  versionNo?: number;
  step: EditorStep;
  paramFilter?: readonly string[];
}) {
  const { viewer, isAdmin, loading: viewerLoading } = useViewer();
  const fetcher = useCallback((signal: AbortSignal) => loadEditor(templateId, versionNo, signal), [templateId, versionNo]);
  const q = useStudioQuery(`template-editor:${templateId}:${versionNo ?? "latest"}`, fetcher, { source: "template-editor.load" });

  if (q.error && !q.data) {
    return (
      <ErrorView
        error={q.error}
        title="Templat tidak dapat dimuat"
        context={{ subject: "Templat" }}
        onRetry={() => q.retry()}
        cooldown={q.cooldown}
        actions={<Button href="/studio/templates">Kembali ke Templat</Button>}
      />
    );
  }
  if (!q.data || viewerLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Memuat templat">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  const d = q.data;
  return (
    <EditorBody
      key={`${d.detail.version.id}:${isAdmin ? "a" : "u"}`}
      data={d}
      step={step}
      isAdmin={isAdmin}
      username={viewer?.username ?? null}
      viewingOld={versionNo !== undefined && versionNo !== d.detail.template.latestVersionNo}
      refreshing={q.isRefreshing}
      onSaved={() => q.refetch()}
      paramFilter={paramFilter}
    />
  );
}

function stepHref(id: string, s: EditorStep): string {
  return `/studio/templates/${encodeURIComponent(id)}?langkah=${s}`;
}

function EditorBody({
  data,
  step: initialStep,
  isAdmin,
  username,
  viewingOld,
  refreshing,
  onSaved,
  paramFilter,
}: {
  data: EditorData;
  step: EditorStep;
  isAdmin: boolean;
  username: string | null;
  viewingOld: boolean;
  refreshing: boolean;
  onSaved: () => void;
  paramFilter?: readonly string[];
}) {
  const router = useRouter();
  const { notify, announce } = useNotice();
  const { detail, knobs, presets } = data;
  const { template, version } = detail;
  const isPreset = template.isPreset === true;
  const edit = editabilityOf(template, { isAdmin, username }, viewingOld);
  const readOnly = !edit.canEdit;

  const essentialKeys = useMemo(() => new Set(knobs.map(knobKey)), [knobs]);
  const loadedDef = useMemo(() => definitionOf(detail, data.skeleton, essentialKeys, isAdmin), [detail, data.skeleton, essentialKeys, isAdmin]);

  const [step, setStep] = useState<EditorStep>(initialStep);
  const [def, setDef] = useState<TemplateDefinition>(() => {
    if (readOnly) return loadedDef;
    const draft = readTemplateDraft(template.id, version.versionNo);
    if (!draft) return loadedDef;
    return {
      ...loadedDef,
      preset: draft.preset ?? loadedDef.preset,
      essentials: draft.essentials ?? loadedDef.essentials,
      advanced: draft.advanced ?? loadedDef.advanced,
      roleFormats: draft.roleFormats ?? loadedDef.roleFormats,
      slots: draft.slots ?? loadedDef.slots,
    };
  });
  const [roleDraft, setRoleDraft] = useState<RoleFormatMap>(() => (def.roleFormats as RoleFormatMap | undefined) ?? version.roleFormats ?? {});
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [advErrors, setAdvErrors] = useState(0);

  // ── Nilai bawaan gaya (gaya dimuat dan gaya draf) ─────────────────────
  const presetBySlug = useMemo(() => new Map(presets.map((p) => [p.slug, p])), [presets]);
  const loadedPresetSlug = loadedDef.preset?.slug ?? null;
  const draftPresetSlug = def.preset?.slug ?? null;
  const loadedPresetQ = usePresetValues(loadedPresetSlug);
  const draftPresetQ = usePresetValues(draftPresetSlug);
  const loadedBaseline = loadedPresetQ.data ?? version.resolvedParams ?? EMPTY;
  const baseline = draftPresetQ.data ?? (draftPresetSlug === loadedPresetSlug ? loadedBaseline : EMPTY);
  const presetName = (slug: string | null) => (slug ? (presetBySlug.get(slug)?.name ?? slug) : null);

  // ── Perubahan ─────────────────────────────────────────────────────────
  const slotsChanged = !valuesEqual(def.slots, loadedDef.slots);
  const roleFormatsChanged = isPreset && isAdmin && !valuesEqual(roleDraft, version.roleFormats ?? {});
  // Mode gaya (ADMIN): satu lapis datar (esensial ∪ lanjutan), dibagi ulang per lapis registri saat simpan.
  const presetMode = isPreset && isAdmin;
  const [presetLayer, setPresetLayer] = useState<ParamRecord>(() => ({ ...def.essentials, ...def.advanced }));
  const loadedPresetLayer = useMemo(() => ({ ...loadedDef.essentials, ...loadedDef.advanced }), [loadedDef]);
  const paramsQ = useStudioQuery(presetMode ? "template-editor:params" : null, fetchParams, { source: "template-editor.params" });
  const presetDefs = useMemo(() => (paramsQ.data ? new Map(paramsQ.data.map((d) => [d.key, d])) : null), [paramsQ.data]);
  const changes = useMemo(() => {
    const lines = changeSummary({
      knobs,
      before: { essentials: loadedDef.essentials, baseline: loadedBaseline, presetName: presetName(loadedPresetSlug), advanced: loadedDef.advanced },
      after: { essentials: def.essentials, baseline, presetName: presetName(draftPresetSlug), advanced: def.advanced },
    });
    if (slotsChanged) lines.push("Susunan dokumen diubah");
    if (roleFormatsChanged) lines.push("Format teks per peran diubah");
    return lines;
    // presetName bergantung pada presetBySlug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knobs, loadedDef, loadedBaseline, def, baseline, slotsChanged, roleFormatsChanged, presetBySlug, loadedPresetSlug, draftPresetSlug]);
  const activeChanges = presetMode ? presetChanges(presetLayer, loadedPresetLayer, roleFormatsChanged) : changes;
  const dirty = !readOnly && activeChanges.length > 0;

  // Draf ke localStorage (dibaca juga oleh Susunan dokumen, SR-28).
  useEffect(() => {
    if (readOnly || presetMode) return;
    if (!dirty) {
      clearTemplateDraft(template.id);
      return;
    }
    writeTemplateDraft(template.id, {
      baseVersionNo: version.versionNo,
      preset: def.preset,
      presetName: presetName(draftPresetSlug),
      essentials: def.essentials,
      ...(isAdmin && def.advancedLoaded ? { advanced: def.advanced } : {}),
      ...(slotsChanged && def.slots ? { slots: def.slots } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, presetMode, dirty, def, template.id, version.versionNo, isAdmin, slotsChanged, draftPresetSlug]);

  // K-6: beforeunload + tautan keluar editor.
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const base = `/studio/templates/${encodeURIComponent(template.id)}`;
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Pindah langkah (termasuk Susunan dokumen) aman: draf tersimpan di browser.
      if (url.pathname === base || url.pathname.startsWith(`${base}/`)) return;
      e.preventDefault();
      setLeaveHref(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [template.id]);

  const goStep = useCallback(
    (s: EditorStep) => {
      setStep(s);
      router.replace(stepHref(template.id, s), { scroll: false });
    },
    [router, template.id],
  );

  // ── Tindakan ──────────────────────────────────────────────────────────
  const setKnob = (k: EssentialKnob, v: ParamValue) => setDef((p) => ({ ...p, essentials: { ...p.essentials, [knobKey(k)]: v } }));
  const resetKnob = (k: EssentialKnob) => setDef((p) => ({ ...p, essentials: omitKey(p.essentials, knobKey(k)) }));
  const applyPreset = (slug: string) => {
    setDef((p) => ({ ...p, preset: { slug }, essentials: {} }));
    setPendingPreset(null);
    announce(`Gaya diganti ke ${presetName(slug) ?? "gaya baru"}. Pengaturan mengikuti gaya ini.`);
  };
  const choosePreset = (slug: string) => {
    if (slug === draftPresetSlug) return;
    if (Object.keys(def.essentials).length > 0) setPendingPreset(slug);
    else applyPreset(slug);
  };

  const noSlots = !def.slots || def.slots.length === 0;
  const blockedReason = readOnly
    ? edit.reason
    : noSlots
      ? "Susunan dokumen templat ini belum dapat dibaca. Muat ulang halaman atau hubungi admin."
      : !isPreset && !def.preset
        ? "Pilih gaya dokumen lebih dulu di langkah Gaya."
        : advErrors > 0
          ? "Perbaiki isian pengaturan lanjutan yang belum sesuai."
          : null;

  // Isi yang AKAN disimpan; FIX-V (M5): pratinjau v2 memakai draf yang sama persis.
  const saveSource: TemplateDefinition = useMemo(
    () =>
      presetMode
        ? {
            ...def,
            ...(presetDefs ? splitBySurface(presetLayer, presetDefs) : { essentials: {}, advanced: presetLayer }),
            advancedLoaded: true,
            roleFormats: roleFormatsChanged ? (roleDraft as Record<string, unknown>) : undefined,
          }
        : def,
    [presetMode, def, presetDefs, presetLayer, roleFormatsChanged, roleDraft],
  );
  const previewTemplate = useMemo(() => toTemplateV2(saveSource, { isAdmin, isPreset }), [saveSource, isAdmin, isPreset]);

  const save = async (changeNote: string) => {
    setSaveError(null);
    try {
      const body = toTemplateV2(saveSource, { isAdmin, isPreset });
      const res = await saveTemplateVersionV2(template.id, { baseVersionNo: version.versionNo, changeNote, template: body });
      clearTemplateDraft(template.id);
      dirtyRef.current = false;
      notify({ message: `Versi ${res.version.versionNo.toLocaleString("id-ID")} disimpan`, tone: "success" });
      router.replace(stepHref(template.id, "pengaturan"), { scroll: false });
      onSaved();
    } catch (e) {
      setSaveError(errorMessages(e, { subject: "Templat" }).body);
      throw e;
    }
  };

  const statuses: Partial<Record<TemplateStepId, TemplateStepStatus>> = {
    gaya: draftPresetSlug !== loadedPresetSlug ? "berubah" : draftPresetSlug || isPreset ? "selesai" : "perhatian",
    pengaturan: changes.some((c) => !c.startsWith("Gaya:") && c !== "Susunan dokumen diubah") ? "berubah" : undefined,
    susunan: slotsChanged ? "berubah" : !def.slots ? "perhatian" : undefined,
  };

  const copySource: CopySource = { name: template.name, presetSlug: loadedPresetSlug, essentials: loadedDef.essentials, slots: loadedDef.slots };

  return (
    <div className="space-y-5">
      {/* Kepala */}
      <header className="space-y-3">
        <nav aria-label="Remah roti" className="text-[12.5px] text-[var(--text-2)]">
          <Link href="/studio/templates" className="hover:text-[var(--text)] hover:underline">
            Templat
          </Link>
          <span aria-hidden className="mx-1.5">
            /
          </span>
          <span className="text-[var(--text)]">{template.name}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-[var(--text)]">{isPreset ? `Mengubah gaya: ${template.name}` : template.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[var(--text-2)]">
              <span>
                Versi {version.versionNo.toLocaleString("id-ID")} · {formatDateTime(version.createdAt)}
              </span>
              {!isPreset && <span>· Gaya: {presetName(draftPresetSlug) ?? "belum diketahui"}</span>}
              {template.isCanonical && <Pill tone="accent">Kanonik</Pill>}
              {isPreset && <Pill tone="accent">Gaya</Pill>}
              {isAdmin && template.restricted && <Pill tone="warn">Terbatas</Pill>}
              {dirty && <Pill tone="warn">Ada perubahan</Pill>}
              {refreshing && <span aria-live="polite">Memperbarui…</span>}
            </p>
          </div>
          <Button href={`/studio/templates/${encodeURIComponent(template.id)}/versions`} size="sm">
            <History className="h-4 w-4" strokeWidth={2} aria-hidden />
            Riwayat versi
          </Button>
        </div>
        {!isPreset && <TemplateStepper templateId={template.id} current={step} statuses={statuses} onNavigate={(s) => (s === "susunan" ? false : (goStep(s), true))} />}
      </header>

      {isPreset && isAdmin && !viewingOld && (
        <div role="note" className="flex items-start gap-2 rounded-[12px] border border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--warn)_10%,transparent)] px-4 py-3 text-[13px] text-[var(--text)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
          Perubahan gaya memengaruhi semua templat yang memakainya saat mereka menyimpan versi berikutnya.
        </div>
      )}

      {readOnly && edit.reason && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-1)] px-4 py-3">
          <p className="flex items-start gap-2 text-[13px] text-[var(--text)]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2} aria-hidden />
            {edit.reason}
          </p>
          <div className="flex gap-2">
            {viewingOld && (
              <Button size="sm" href={`/studio/templates/${encodeURIComponent(template.id)}`}>
                Kembali ke versi terbaru
              </Button>
            )}
            {edit.offerCopy && (
              <Button size="sm" onClick={() => setCopyOpen(true)}>
                <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
                Buat salinan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mode gaya (ADMIN) */}
      {isPreset ? (
        isAdmin ? (
          <div className="space-y-5">
            <PresetModeEditor
              draft={presetLayer}
              loaded={loadedPresetLayer}
              parentValues={version.resolvedParams ?? EMPTY}
              parentLabel="nilai gaya saat ini"
              computed={version.resolvedParams ?? EMPTY}
              onChange={setPresetLayer}
              onErrors={setAdvErrors}
              readOnly={readOnly}
              refFilter={paramFilter}
              roleFormatsLoaded={version.roleFormats ?? {}}
              roleFormatsDraft={roleDraft}
              onRoleFormatsChange={setRoleDraft}
            />
            <SaveVersion
              changes={activeChanges}
              currentVersionNo={version.versionNo}
              onSave={save}
              error={saveError}
              blockedReason={
                readOnly
                  ? edit.reason
                  : noSlots
                    ? "Susunan dokumen gaya ini belum dapat dibaca. Muat ulang halaman atau hubungi admin."
                    : !presetDefs
                      ? "Daftar pengaturan gaya masih dimuat."
                      : advErrors > 0
                        ? "Perbaiki isian yang belum sesuai."
                        : null
              }
            />
          </div>
        ) : (
          <SettingsStep
            templateId={template.id}
            versionNo={version.versionNo}
            knobs={knobs}
            def={def}
            baseline={baseline}
            isAdmin={false}
            readOnly
            onKnob={setKnob}
            onReset={resetKnob}
            previewTemplate={previewTemplate}
          />
        )
      ) : step === "gaya" ? (
        <Panel className="space-y-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text)]">Gaya dokumen</h2>
            <p className="mt-1 text-[12.5px] text-[var(--text-2)]">Gaya menentukan rupa dokumen: huruf, warna, tata letak halaman. Pilih satu gaya; pengaturan di langkah berikutnya menyesuaikan gaya itu.</p>
          </div>
          <StylePicker presets={presets} value={draftPresetSlug} onChange={choosePreset} isAdmin={isAdmin} name={`style-${template.id}`} disabled={readOnly} />
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => goStep("pengaturan")}>
              Lanjut ke Pengaturan
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </Panel>
      ) : step === "pengaturan" ? (
        <div className="space-y-4">
          <SettingsStep
            templateId={template.id}
            versionNo={version.versionNo}
            knobs={knobs}
            def={def}
            baseline={baseline}
            isAdmin={isAdmin}
            readOnly={readOnly}
            onKnob={setKnob}
            onReset={resetKnob}
            previewTemplate={previewTemplate}
            advanced={
              isAdmin && def.advancedLoaded ? (
                <AdvancedSettingsPanel
                  draft={def.advanced}
                  loaded={loadedDef.advanced}
                  parentValues={baseline}
                  parentLabel="bawaan gaya"
                  computed={version.resolvedParams ?? EMPTY}
                  onChange={(next) => setDef((p) => ({ ...p, advanced: next }))}
                  onErrors={setAdvErrors}
                  readOnly={readOnly}
                  refFilter={paramFilter}
                />
              ) : null
            }
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button href={`/studio/templates/${encodeURIComponent(template.id)}/sections`}>Lanjut ke Susunan dokumen</Button>
            {!readOnly && (
              <Button variant="primary" onClick={() => goStep("simpan")} className="whitespace-nowrap">
                Simpan versi…
              </Button>
            )}
          </div>
        </div>
      ) : (
        <SaveVersion
          changes={changes}
          currentVersionNo={version.versionNo}
          onSave={save}
          error={saveError}
          blockedReason={blockedReason}
          secondary={<Button onClick={() => goStep("pengaturan")}>Kembali ke Pengaturan</Button>}
        />
      )}

      <InfoTeknis
        items={{
          "Id templat": template.id,
          Slug: template.slug,
          "Gaya (slug)": draftPresetSlug,
          "Nomor versi": version.versionNo,
          "Sidik parameter": version.paramsSha256,
          "Sidik susunan": detail.skeletonSha256 ?? version.skeletonSha256 ?? null,
          "Susunan implisit": detail.implicit === undefined ? undefined : detail.implicit ? "ya" : "tidak",
          Pembuat: template.createdBy,
        }}
      />

      <ConfirmDialog
        open={pendingPreset !== null}
        title="Ganti gaya?"
        description={`Ganti ke gaya ${presetName(pendingPreset) ?? ""}? ${Object.keys(def.essentials).length.toLocaleString("id-ID")} pengaturan yang Anda ubah akan kembali ke nilai gaya baru. Versi tersimpan tidak berubah.`}
        confirmLabel="Ganti gaya"
        tone="default"
        onConfirm={() => {
          if (pendingPreset) applyPreset(pendingPreset);
        }}
        onCancel={() => setPendingPreset(null)}
      />
      <ConfirmDialog
        open={leaveHref !== null}
        title="Tinggalkan halaman?"
        description="Ada perubahan yang belum disimpan. Tinggalkan halaman? Draf disimpan di browser ini."
        confirmLabel="Tinggalkan"
        cancelLabel="Tetap di sini"
        onConfirm={() => {
          const href = leaveHref;
          setLeaveHref(null);
          dirtyRef.current = false;
          if (href) router.push(href);
        }}
        onCancel={() => setLeaveHref(null)}
      />
      {copyOpen && <CreateTemplateDialog open onClose={() => setCopyOpen(false)} presets={presets} isAdmin={isAdmin} copyFrom={copySource} />}
    </div>
  );
}

function presetChanges(layer: ParamRecord, loaded: ParamRecord, roleFormatsChanged: boolean): string[] {
  const keys = new Set([...Object.keys(layer), ...Object.keys(loaded)]);
  let n = 0;
  for (const k of keys) if (!valuesEqual(layer[k], loaded[k])) n += 1;
  const out: string[] = [];
  if (n > 0) out.push(`${n.toLocaleString("id-ID")} pengaturan gaya diubah`);
  if (roleFormatsChanged) out.push("Format teks per peran diubah");
  return out;
}

/** Nilai efektif gaya (R02 `resolvedParams` versi terbaru gaya), dimuat per slug dan dibagi antar-komponen. */
function usePresetValues(slug: string | null) {
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const d = await getTemplateDetail(slug ?? "", undefined, signal);
    return (d.version.resolvedParams ?? {}) as ParamRecord;
  }, [slug]);
  return useStudioQuery(slug ? `template-editor:preset-values:${slug}` : null, fetcher, { source: "template-editor.preset-values" });
}

// ── Langkah Pengaturan ──────────────────────────────────────────────────

function SettingsStep({
  templateId,
  versionNo,
  knobs,
  def,
  baseline,
  isAdmin,
  readOnly,
  onKnob,
  onReset,
  advanced,
  previewTemplate,
}: {
  templateId: string;
  versionNo: number;
  knobs: readonly EssentialKnob[];
  def: TemplateDefinition;
  baseline: ParamRecord;
  isAdmin: boolean;
  readOnly: boolean;
  onKnob: (k: EssentialKnob, v: ParamValue) => void;
  onReset: (k: EssentialKnob) => void;
  advanced?: ReactNode;
  /** FIX-V (M5): draf `studio.template/v2` yang akan disimpan; pratinjau lewat jalur v2. */
  previewTemplate?: StudioTemplateV2;
}) {
  const groups = useMemo(() => groupKnobs(knobs), [knobs]);
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-4">
        <Panel className="p-5">
          <h2 className="text-[15px] font-semibold text-[var(--text)]">Pengaturan</h2>
          <p className="mt-1 text-[12.5px] text-[var(--text-2)]">Berlaku untuk seluruh dokumen yang memakai templat ini. Pratinjau ikut berubah.</p>
          {knobs.length === 0 ? (
            <p className="mt-4 text-[13px] text-[var(--text-2)]">Daftar pengaturan belum tersedia. Muat ulang halaman atau hubungi admin.</p>
          ) : (
            groups.map((g) => (
              <section key={g.id} aria-labelledby={`grp-${g.id}`} className="mt-5">
                <h3 id={`grp-${g.id}`} className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-2)]">
                  {g.title}
                </h3>
                <div className="divide-y divide-[var(--line)]">
                  {g.knobs.map((k) => (
                    <EssentialKnobRow
                      key={k.id}
                      knob={k}
                      value={knobValue(k, def.essentials, baseline)}
                      baseline={baseline[knobKey(k)]}
                      overridden={knobOverridden(k, def.essentials, baseline)}
                      locked={k.class === "K" && !isAdmin}
                      readOnly={readOnly}
                      onChange={(v) => onKnob(k, v)}
                      onReset={() => onReset(k)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </Panel>
        {advanced}
      </div>
      <div className="lg:sticky lg:top-4">
        <TemplatePreviewPane
          templateId={templateId}
          versionNo={versionNo}
          essentials={def.essentials}
          advanced={isAdmin ? def.advanced : undefined}
          draftOverrides={EMPTY}
          {...(previewTemplate ? { draftTemplate: previewTemplate } : {})}
        />
      </div>
    </div>
  );
}

