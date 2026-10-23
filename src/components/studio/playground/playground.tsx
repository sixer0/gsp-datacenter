"use client";

/*
 * Alat developer Studio (SR-31; UX-01 W11; D-161): alat ADMIN untuk menguji
 * kiriman agen v2 tanpa memengaruhi alur kerja harian.
 *
 * - Hanya ADMIN di UI (`useViewer`); USER melihat layar "khusus admin".
 *   Penegakan tetap di server.
 * - Mode: Kirim dokumen (R04) / Kirim bab (R12) / Kirim bagian (R13) /
 *   Unggah aset (R18). Contoh E1/E2/Lembar kendali + minimal dari skema
 *   registri (`useSchemaExamples`).
 * - Validasi (R08 dry-run) menampilkan masalah per baris, pemeriksaan standar,
 *   dan kelengkapan sesudah kirim (rel bersama). "Kirim ke Studio" adalah
 *   kiriman nyata dengan konfirmasi K-10 (`usePlaygroundActions`).
 * - Draf editor + panel disimpan di peramban (`useDraftAutosave`).
 * S86 R09: komponen ini hanya merangkai; logika ada di hook dan `payload.ts`.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { FileUp, RotateCcw, Send, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { STUDIO_MAX_JSON_BYTES } from "@/lib/studio/contract/env";
import { Button, EmptyState, Panel, Pill, SectionHeader, Skeleton } from "@/components/ui/kit";
import { ConfirmDialog } from "@/components/studio/shared/dialog";
import { ErrorView } from "@/components/studio/shared/error-view";
import { formatBytes, missionLabel } from "@/components/studio/shared/labels";
import { useNotice } from "@/components/studio/shared/notice";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import { useViewer } from "@/components/studio/shared/use-viewer";
import { fetchTemplates } from "./api";
import { AssetPanel } from "./asset-panel";
import { ModeSwitch, SubmissionPanel } from "./controls";
import { DEFAULT_DOC_KEY, DEFAULT_TEMPLATE_SLUG, defaultMissionFolder, type ExampleId } from "./examples-v2";
import { JsonEditor, type JsonEditorHandle } from "./json-editor";
import { lineForPointer, parseEditorJson, pointerLines, type JsonSyntaxError } from "./json-locate";
import { ActionError, IssueList, PreviewFrame, SubmitResultPanel, ValidationPanel, type EditorIssue } from "./panels";
import { describeTarget, firstAssetKey, isRecord, overrideErrors, utf8Length, withAssetRef } from "./payload";
import { EMPTY_OVERRIDES, isJsonMode, modeFromSchema, modeMeta, type JsonMode, type PlaygroundMode, type PlaygroundOverrides } from "./types";
import { useDraftAutosave } from "./use-draft-autosave";
import { usePlaygroundActions, type PreparedSubmission } from "./use-playground-actions";
import { useSchemaExamples } from "./use-schema-examples";

/** Pintu peran: ADMIN -> alat; USER -> layar khusus admin (W11). */
export function DeveloperTools() {
  const { isAdmin, loading, error } = useViewer();
  if (loading) {
    return (
      <div aria-busy="true" className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }
  if (error) return <ErrorView error={error} title="Peran Anda tidak dapat diperiksa" />;
  if (!isAdmin) {
    return (
      <Panel>
        <EmptyState
          title="Halaman ini khusus admin"
          hint="Dokumen dikirim oleh agen; Anda dapat meninjaunya di Dokumen."
          action={
            <Button variant="primary" href="/studio/documents">
              Buka Dokumen
            </Button>
          }
        />
      </Panel>
    );
  }
  return <PlaygroundWorkspace />;
}

function PlaygroundWorkspace() {
  const [mode, setMode] = useState<PlaygroundMode>("doc");
  const [texts, setTexts] = useState<Partial<Record<JsonMode, string>>>({});
  const [overrides, setOverrides] = useState<PlaygroundOverrides>(EMPTY_OVERRIDES);
  const [exampleIds, setExampleIds] = useState<Record<JsonMode, ExampleId>>({ doc: "e1", chapter: "e2", slot: "slot-control-sheet" });
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [activeIssue, setActiveIssue] = useState<number | null>(null);
  const [preview, setPreview] = useState(true);
  const [confirmSend, setConfirmSend] = useState<PreparedSubmission | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const editorRef = useRef<JsonEditorHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify, announce } = useNotice();
  const examples = useSchemaExamples();
  const revealSyntax = useCallback((e: JsonSyntaxError) => {
    setHighlightLine(e.line);
    editorRef.current?.revealLine(e.line);
  }, []);
  const actions = usePlaygroundActions({ onSyntaxError: revealSyntax });
  const templatesQ = useStudioQuery("playground.templates", fetchTemplates, { source: "playground.templates" });

  const jsonMode: JsonMode | null = isJsonMode(mode) ? mode : null;
  const meta = modeMeta(mode);
  const text = jsonMode ? (texts[jsonMode] ?? "") : "";
  const bytes = useMemo(() => utf8Length(text), [text]);
  const overLimit = bytes > STUDIO_MAX_JSON_BYTES;
  const fieldErrors = overrideErrors(jsonMode ?? "doc", overrides);

  const exampleCtx = useCallback(() => {
    const canonical = templatesQ.data?.templates.find((t) => t.kind === "DOCUMENT" && t.isCanonical)?.slug;
    return {
      templateSlug: overrides.templateSlug || canonical || DEFAULT_TEMPLATE_SLUG,
      missionFolder: overrides.missionFolder.trim() || defaultMissionFolder(),
      docKey: overrides.docKey.trim() || DEFAULT_DOC_KEY,
    };
  }, [overrides.templateSlug, overrides.missionFolder, overrides.docKey, templatesQ.data]);

  const loadExample = useCallback(
    async (m: JsonMode, id: ExampleId) => {
      const next = await examples.build(m, id, exampleCtx());
      if (next === null) return;
      setTexts((prev) => ({ ...prev, [m]: next }));
      setHighlightLine(null);
      setActiveIssue(null);
      actions.clearIssues();
      announce(`Contoh dimuat ke editor ${modeMeta(m).label}.`);
    },
    [examples, exampleCtx, actions, announce],
  );

  const draft = useDraftAutosave(
    { mode, texts, overrides },
    {
      onRestore: (d) => {
        setMode(d.mode);
        setTexts(d.texts);
        setOverrides(d.overrides);
        notify({ message: `Draf dipulihkan dari peramban ini.`, tone: "info" });
      },
      onEmpty: () => void loadExample("doc", "e1"),
    },
  );

  const setText = (v: string) => {
    if (!jsonMode) return;
    setTexts((prev) => ({ ...prev, [jsonMode]: v }));
    actions.clearSyntaxError();
  };

  const switchMode = (m: PlaygroundMode) => {
    if (m === mode) return;
    setMode(m);
    setHighlightLine(null);
    setActiveIssue(null);
    if (isJsonMode(m) && texts[m] === undefined) void loadExample(m, exampleIds[m]);
  };

  // ── Masalah -> baris editor ────────────────────────────────────────────
  const editorIssues: EditorIssue[] = useMemo(() => {
    const set = actions.issues;
    if (!set || set.mode !== jsonMode) return [];
    const lines = pointerLines(text);
    return set.items.map((it) => ({ ...it, line: lineForPointer(lines, it.pointer) }));
  }, [actions.issues, jsonMode, text]);

  const revealPointer = (pointer: string) => {
    const line = lineForPointer(pointerLines(text), pointer);
    if (line === null) return;
    setHighlightLine(line);
    editorRef.current?.revealLine(line);
  };

  // ── Aksi ───────────────────────────────────────────────────────────────
  const onValidate = async () => {
    if (!jsonMode || actions.busy) return;
    const res = await actions.validate(jsonMode, text, overrides, preview);
    if (!res) return;
    setActiveIssue(null);
    setHighlightLine(null);
    announce(res.valid ? "Kiriman valid." : `Kiriman tidak valid: ${res.issues.length} masalah.`);
  };

  const onRequestSend = () => {
    if (!jsonMode || actions.busy) return;
    const prepared = actions.prepare(jsonMode, text, overrides, "submit");
    if (prepared) setConfirmSend(prepared);
  };

  const onSend = async (prepared: PreparedSubmission) => {
    setConfirmSend(null);
    const res = await actions.submit(prepared);
    if (res) notify({ message: res.unchanged ? "Tidak ada perubahan" : `Disimpan sebagai versi ${res.revision.revisionNo}`, tone: "success" });
  };

  const onPickJson = async (file: File) => {
    if (file.size > STUDIO_MAX_JSON_BYTES) {
      notify({ message: `Berkas ${file.name} melebihi batas ${formatBytes(STUDIO_MAX_JSON_BYTES)}.`, tone: "warn" });
      return;
    }
    let raw = "";
    try {
      raw = await file.text();
    } catch {
      notify({ message: `Berkas ${file.name} tidak dapat dibaca.`, tone: "warn" });
      return;
    }
    const parsed = parseEditorJson(raw);
    const detected = parsed.ok && isRecord(parsed.value) ? modeFromSchema(parsed.value.$schema) : null;
    const target = detected ?? jsonMode ?? "doc";
    setMode(target);
    setTexts((prev) => ({ ...prev, [target]: parsed.ok ? JSON.stringify(parsed.value, null, 2) + "\n" : raw }));
    // Templat dan tingkat kembali ke "Ikuti JSON" agar isi berkas tidak tertimpa diam-diam.
    setOverrides((o) => ({ ...o, templateSlug: "", tier: "" }));
    actions.clearIssues();
    if (!parsed.ok) revealSyntax(parsed.error);
    notify({ message: parsed.ok ? `Berkas ${file.name} dimuat ke ${modeMeta(target).label}.` : `Berkas ${file.name} dimuat; JSON tidak valid di baris ${parsed.error.line}.`, tone: parsed.ok ? "info" : "warn" });
  };

  const onFormat = () => {
    const parsed = parseEditorJson(text);
    if (!parsed.ok) return revealSyntax(parsed.error);
    setText(JSON.stringify(parsed.value, null, 2) + "\n");
    setHighlightLine(null);
  };

  const requestExample = () => {
    if (!jsonMode || examples.busy) return;
    if (text.trim() !== "") setConfirmReplace(true);
    else void loadExample(jsonMode, exampleIds[jsonMode]);
  };

  const chapterAssetKey = firstAssetKey(texts.chapter ?? "");
  const onUseAsset = (assetRef: string) => {
    if (!chapterAssetKey) return;
    const next = withAssetRef(texts.chapter ?? "", chapterAssetKey, assetRef);
    if (next === null) return;
    setTexts((prev) => ({ ...prev, chapter: next }));
    setMode("chapter");
    notify({ message: `assetRef dipasang ke aset "${chapterAssetKey}" di Kirim bab.`, tone: "success" });
  };

  const validation = actions.validation && actions.validation.mode === jsonMode ? actions.validation : null;
  const stale = validation !== null && validation.text !== text;
  const submitResult = actions.submitResult && actions.submitResult.mode === jsonMode ? actions.submitResult.result : null;
  const target = confirmSend ? describeTarget(confirmSend.body) : null;
  const targetText = target?.documentId
    ? `dokumen ${target.documentId}`
    : target?.docNumber
      ? `dokumen ${target.docNumber}`
      : target?.missionFolder
        ? missionLabel(target.missionFolder)
        : "dokumen di JSON";
  const vCd = actions.cooldowns.validate;
  const sCd = actions.cooldowns.submit;
  const blockedBusy = actions.busy !== null || overLimit;

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Alat developer"
        title="Uji kiriman agen tanpa memengaruhi alur kerja"
        action={<Pill tone="accent">Khusus admin</Pill>}
      />
      <p className="-mt-2 text-[12.5px] text-[var(--text-2)]">Validasi tidak menyimpan apa pun. Semua kiriman nyata tercatat dan membuat versi dokumen baru.</p>

      <div className="space-y-2">
        <ModeSwitch mode={mode} onChange={switchMode} />
        <p className="text-[12px] text-[var(--text-2)]">{meta.hint}</p>
      </div>

      {mode === "asset" ? (
        <>
          {actions.failure?.action === "asset" && <ActionError failure={actions.failure} cooldown={actions.cooldowns.asset} />}
          <AssetPanel
            busy={actions.busy === "asset"}
            cooldown={actions.cooldowns.asset}
            missionFolder={overrides.missionFolder.trim()}
            result={actions.assetResult}
            onUpload={(f) => void actions.upload(f, fieldErrors.missionFolder ? "" : overrides.missionFolder.trim())}
            onUseInChapter={onUseAsset}
            useTargetKey={chapterAssetKey}
          />
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="pg-example" className="mb-1 block text-[11.5px] text-[var(--text-2)]">
                  Contoh
                </label>
                <select
                  id="pg-example"
                  value={exampleIds[mode]}
                  onChange={(e) => setExampleIds((p) => ({ ...p, [mode]: e.target.value as ExampleId }))}
                  className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[12.5px] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  {examples.options(mode).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={requestExample} ariaDisabled={examples.busy} className="whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {examples.busy ? "Memuat..." : "Muat contoh"}
              </Button>
              <Button size="sm" onClick={onFormat}>
                <WandSparkles className="h-3.5 w-3.5" aria-hidden />
                Rapikan
              </Button>
              <Button size="sm" onClick={() => fileRef.current?.click()} className="whitespace-nowrap">
                <FileUp className="h-3.5 w-3.5" aria-hidden />
                Unggah .json
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                tabIndex={-1}
                aria-label="Pilih berkas JSON"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onPickJson(f);
                }}
              />
              <Button size="sm" onClick={draft.clear} className="whitespace-nowrap">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Hapus draf lokal
              </Button>
              <span className={`ml-auto text-[11.5px] num ${overLimit ? "text-[var(--down)]" : "text-[var(--text-2)]"}`}>
                {formatBytes(bytes)} / {formatBytes(STUDIO_MAX_JSON_BYTES)}
                {draft.status === "saved" ? " · draf tersimpan di peramban" : draft.status === "unavailable" ? " · draf tidak dapat disimpan" : ""}
              </span>
            </div>
            {examples.error ? <ErrorView variant="inline" error={examples.error} title="Contoh tidak dapat dibangkitkan dari skema registri" /> : null}

            <JsonEditor
              ref={editorRef}
              id="studio-playground-editor"
              label={`Editor JSON ${meta.schemaId ?? ""}`}
              value={text}
              onChange={setText}
              highlightLine={highlightLine}
              invalid={actions.syntaxError !== null || overLimit}
              describedBy={actions.syntaxError ? "studio-playground-syntax" : undefined}
            />
            {actions.syntaxError && (
              <p id="studio-playground-syntax" role="alert" className="text-[12.5px] text-[var(--down)]">
                JSON tidak valid di baris {actions.syntaxError.line}, kolom {actions.syntaxError.column}: {actions.syntaxError.message}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void onValidate()} ariaDisabled={blockedBusy || vCd.secondsLeft > 0 || vCd.exhausted} className="whitespace-nowrap">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {actions.busy === "validate" ? "Memvalidasi..." : vCd.secondsLeft > 0 ? `Validasi (${vCd.secondsLeft} dtk)` : "Validasi"}
              </Button>
              <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-2)]">
                <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
                Sertakan pratinjau HTML
              </label>
              <Button variant="primary" onClick={onRequestSend} ariaDisabled={blockedBusy || sCd.secondsLeft > 0 || sCd.exhausted} className="ml-auto whitespace-nowrap">
                <Send className="h-4 w-4" aria-hidden />
                {actions.busy === "submit" ? "Mengirim..." : sCd.secondsLeft > 0 ? `Kirim ke Studio (${sCd.secondsLeft} dtk)` : "Kirim ke Studio"}
              </Button>
            </div>
            {actions.failure && actions.failure.action !== "asset" && (
              <ActionError failure={actions.failure} cooldown={actions.cooldowns[actions.failure.action]} />
            )}
            <IssueList
              issues={editorIssues}
              activeIndex={activeIssue}
              onSelect={(i) => {
                setActiveIssue(i);
                const line = editorIssues[i]?.line ?? null;
                setHighlightLine(line);
                if (line !== null) editorRef.current?.revealLine(line);
              }}
              title={actions.issues?.title ?? "Masalah"}
            />
          </div>

          <SubmissionPanel mode={mode} overrides={overrides} onChange={setOverrides} errors={fieldErrors} templatesQ={templatesQ} />
        </div>
      )}

      {jsonMode && validation && <ValidationPanel result={validation.result} stale={stale} onPointer={revealPointer} />}

      {jsonMode && submitResult && <SubmitResultPanel result={submitResult} />}

      {jsonMode && validation?.result.previewHtml && (
        <section aria-label="Pratinjau HTML" className="space-y-2">
          <SectionHeader label="Pratinjau HTML" title="Rakitan mode pratinjau (tanpa figur raster)" />
          {stale && <p className="text-[11.5px] text-[var(--warn)]">Pratinjau dari versi JSON sebelumnya.</p>}
          <PreviewFrame html={validation.result.previewHtml} />
        </section>
      )}

      <ConfirmDialog
        open={confirmReplace}
        title="Ganti isi editor dengan contoh?"
        description={`Isi editor ${meta.label} saat ini akan diganti. Draf peramban ikut diperbarui.`}
        confirmLabel="Ganti isi editor"
        tone="default"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={async () => {
          setConfirmReplace(false);
          if (jsonMode) await loadExample(jsonMode, exampleIds[jsonMode]);
        }}
      />
      <ConfirmDialog
        open={confirmSend !== null}
        title="Kirim ke Studio?"
        description={`Kirim ke Studio sebagai kiriman nyata untuk ${targetText}? Ini membuat versi dokumen baru.`}
        confirmLabel="Kirim"
        tone="default"
        onCancel={() => setConfirmSend(null)}
        onConfirm={async () => {
          if (confirmSend) await onSend(confirmSend);
        }}
      />
    </div>
  );
}
