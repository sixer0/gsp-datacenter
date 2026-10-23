"use client";

/*
 * Buat artefak dari contoh + isian spesifikasi (S62; tab "Buat" untuk SEMUA
 * pengguna, D-164 T-6): pilih jenis -> isian berisi contoh (bentuk dari
 * kontrak, isian wajib dari skema R03) -> pemeriksaan awal di peramban ->
 * POST R09 -> status pembuatan berkas (sinkron) + berkas.
 * FIX-4b: data lewat `useStudioQuery`/`requestJson` bersama, jeda coba ulang
 * lewat `useCooldown` bersama (3, 6, 12 dtk; maks 3; S86 R10), galat
 * `StudioApiError` bersama, label kamus UX-01 §1.2; kode teknis di Info teknis.
 */

import { useId, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileUp, LogIn, RotateCcw, Send } from "lucide-react";
import { DIAGRAM_FAMILIES, type DiagramFamily, type StudioOutputFormat } from "@/lib/studio/contract/enums";
import { STUDIO_ROUTES } from "@/lib/studio/contract/env";
import type { ArtifactCreateRequest, StudioArtifactSpec } from "@/lib/studio/contract/types/api";
import type { ChartDef } from "@/lib/studio/contract/types/params";
import { Button, Panel, Pill } from "@/components/ui/kit";
import { reportClientError } from "@/components/studio/shared/client-log";
import { loginHref } from "@/components/studio/shared/error-view";
import { InfoTeknis } from "@/components/studio/shared/info-teknis";
import { FILE_JOB_LABEL, FILE_JOB_TONE, FORMAT_LABEL } from "@/components/studio/shared/labels";
import { useCooldown } from "@/components/studio/shared/use-cooldown";
import { useStudioQuery } from "@/components/studio/shared/use-studio-query";
import {
  ARTIFACT_SCHEMA_BY_KIND,
  StudioApiError,
  alternativesOf,
  getJson,
  isStudioApiError,
  postArtifact,
  postErrorMessage,
  postIssuesOf,
  schemaUrl,
  src,
  type ArtifactCreateResponse,
  type ArtifactKindKey,
  type JsonSchemaDoc,
  type TemplateListResponse,
} from "./api";
import type { UseChoice } from "./catalog";
import { inputCls } from "./gallery";
import { FAMILY_LABEL, GROUP_LABEL, GROUP_ORDER, KIND_HINT, KIND_LABEL, SHAPE_LABEL } from "./labels";
import { ArtifactPreview, FileList } from "./preview";
import { chartTemplate, diagramTemplate, htmlTemplate, imageTemplate, pretty } from "./spec-templates";
import { checkSpecText } from "./validate";

const KINDS: readonly ArtifactKindKey[] = ["CHART", "DIAGRAM", "IMAGE", "HTML"];
const FORMATS_BY_KIND: Record<ArtifactKindKey, readonly StudioOutputFormat[]> = {
  CHART: ["SVG", "PNG"],
  DIAGRAM: ["SVG", "PNG"],
  IMAGE: ["PNG"],
  HTML: ["HTML", "PDF"],
};
const DEFAULT_CHART = "P-01";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function buildTemplate(kind: ArtifactKindKey, code: string, family: DiagramFamily, charts: readonly ChartDef[] | null, slug: string): string {
  if (kind === "CHART") {
    const def = charts?.find((c) => c.code === code && c.drawn);
    if (def) return pretty(chartTemplate(def));
    return pretty({ $schema: "studio.chart/v1", kind: code, title: "Judul grafik.", source: "Sumber: ...", widthMm: 166, data: {} });
  }
  if (kind === "DIAGRAM") return pretty(diagramTemplate(family));
  if (kind === "IMAGE") return pretty(imageTemplate());
  return pretty(htmlTemplate(slug));
}

async function sha256Hex(file: File): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("crypto.subtle unavailable (secure context required)");
  const digest = await subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function imageSize(file: File): Promise<{ w: number; h: number } | null> {
  try {
    const bmp = await createImageBitmap(file);
    const out = { w: bmp.width, h: bmp.height };
    bmp.close();
    return out;
  } catch {
    return null;
  }
}

function formatSeconds(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return null;
  return `${(ms / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} dtk`;
}

type Submit =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "done"; result: ArtifactCreateResponse }
  | { state: "error"; error: StudioApiError };

export function CreateArtifactPanel({
  charts,
  initial,
  onCreated,
}: {
  charts: readonly ChartDef[] | null;
  initial: UseChoice | null;
  onCreated: () => void;
}) {
  const ids = useId();
  const pathname = usePathname();
  const [kind, setKind] = useState<ArtifactKindKey>(initial?.kind ?? "CHART");
  const [code, setCode] = useState<string>(initial?.kind === "CHART" ? initial.code : DEFAULT_CHART);
  const [family, setFamily] = useState<DiagramFamily>(initial?.kind === "DIAGRAM" ? initial.family : "layered");
  const [slug, setSlug] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [mission, setMission] = useState("");
  const [formats, setFormats] = useState<StudioOutputFormat[]>([]);
  const [submit, setSubmit] = useState<Submit>({ state: "idle" });
  const cd = useCooldown();

  const schemaKey = schemaUrl(kind);
  const schemaQ = useStudioQuery<JsonSchemaDoc>(schemaKey, (s) => getJson(schemaKey, "schema", s), { source: src("schema") });
  const templatesKey = kind === "HTML" ? STUDIO_ROUTES.R01 : null;
  const templatesQ = useStudioQuery<TemplateListResponse>(templatesKey, (s) => getJson(STUDIO_ROUTES.R01, "templates", s), {
    source: src("templates"),
  });

  // Isian belum disunting = contoh yang diturunkan dari pilihan (text === null).
  const template = buildTemplate(kind, code, family, charts, slug);
  const value = text ?? template;
  const dirty = text !== null && text !== template;

  const check = useMemo(
    () => checkSpecText(value, kind, { schema: schemaQ.data ?? null, charts, hasFile: Boolean(file) }),
    [value, kind, schemaQ.data, charts, file],
  );

  const chartDef = charts?.find((c) => c.code === code) ?? null;
  const drawnCharts = charts?.filter((c) => c.drawn) ?? [];
  const busy = submit.state === "sending";

  const resetEditor = () => {
    setText(null);
    setSubmit({ state: "idle" });
  };
  const choose = (fn: () => void) => {
    fn();
    if (!dirty) setText(null);
  };

  const onFile = async (f: File | null) => {
    setFile(f);
    setFileNote(null);
    if (!f) return;
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setFileNote("Berkas harus PNG atau JPEG.");
      return;
    }
    try {
      const [sha, size] = await Promise.all([sha256Hex(f), imageSize(f)]);
      const parsed = JSON.parse(value) as Record<string, unknown>;
      const asset = (parsed.asset && typeof parsed.asset === "object" ? parsed.asset : {}) as Record<string, unknown>;
      parsed.asset = {
        ...asset,
        kind: "raster",
        mime: f.type,
        sha256: sha,
        ...(size ? { widthPx: size.w, heightPx: size.h } : {}),
      };
      setText(pretty(parsed));
      setFileNote(size ? `${f.name}: ${size.w} x ${size.h} px, sidik berkas diisi otomatis.` : `${f.name}: sidik berkas diisi otomatis.`);
    } catch (err) {
      if (!(err instanceof SyntaxError)) reportClientError(`studio.ui.${src("image-file")}`, err, { mime: f.type, bytes: f.size });
      setFileNote(
        err instanceof SyntaxError
          ? "Perbaiki isian spesifikasi dulu agar data gambar dapat diisi otomatis."
          : "Berkas tidak dapat dibaca. Coba berkas lain.",
      );
    }
  };

  const err = submit.state === "error" ? submit.error : null;
  const retryBlocked = Boolean(err?.retryable) && (cd.secondsLeft > 0 || cd.exhausted);
  const canSend = !busy && !retryBlocked && Boolean(check.spec) && check.issues.length === 0;

  const send = async () => {
    if (!canSend || !check.spec) return;
    // Setelah galat sementara, setiap kirim ulang memakai satu jatah coba ulang.
    if (err?.retryable && !cd.trigger()) return;
    const body: ArtifactCreateRequest = {
      spec: check.spec as unknown as StudioArtifactSpec,
      ...(mission.trim() ? { mission: { folder: mission.trim() } } : {}),
      ...(formats.length > 0 ? { formats } : {}),
    };
    setSubmit({ state: "sending" });
    try {
      const result = await postArtifact(body, kind === "IMAGE" ? file : null);
      setSubmit({ state: "done", result });
      cd.reset();
      onCreated();
    } catch (e) {
      const apiErr = isStudioApiError(e)
        ? e
        : new StudioApiError({ status: 0, code: "NETWORK", message: String(e), url: STUDIO_ROUTES.R09, method: "POST" });
      // Galat API sudah dicatat requestJson; galat lain dicatat di sini.
      if (!isStudioApiError(e)) reportClientError(`studio.ui.${src("create")}`, e, { kind });
      setSubmit({ state: "error", error: apiErr });
      if (apiErr.retryable) {
        cd.arm();
        if (apiErr.retryAfterSec) cd.holdFor(apiErr.retryAfterSec);
      }
    }
  };

  const editorId = `${ids}-editor`;
  const issuesId = `${ids}-issues`;
  const errIssues = err ? postIssuesOf(err) : [];
  const errAlternatives = err ? alternativesOf(err) : [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* Kolom kiri: pilihan jenis dan amplop */}
      <div className="space-y-4">
        <Panel className="space-y-4 p-4">
          <fieldset>
            <legend className="eyebrow mb-2 block">Jenis artefak</legend>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <label
                  key={k}
                  className={`cursor-pointer rounded-[10px] border px-3 py-2 text-[12.5px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                    kind === k
                      ? "border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                      : "border-[var(--line)] text-[var(--text-2)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${ids}-kind`}
                    value={k}
                    checked={kind === k}
                    onChange={() =>
                      choose(() => {
                        setKind(k);
                        setFormats([]);
                        setFile(null);
                        setFileNote(null);
                      })
                    }
                    className="sr-only"
                  />
                  <span className="font-medium">{KIND_LABEL[k]}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-2)]">{KIND_HINT[kind]}</p>
          </fieldset>

          {kind === "CHART" && (
            <div>
              <label htmlFor={`${ids}-code`} className="eyebrow mb-1 block">
                Jenis grafik
              </label>
              <select id={`${ids}-code`} className={inputCls} value={code} onChange={(e) => choose(() => setCode(e.target.value))}>
                {!drawnCharts.some((c) => c.code === code) && <option value={code}>{code}</option>}
                {GROUP_ORDER.map((g) => {
                  const items = drawnCharts.filter((c) => c.group === g);
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={g} label={`${g} · ${GROUP_LABEL[g]}`}>
                      {items.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {chartDef && (
                <div className="mt-2 space-y-1 text-[12px] text-[var(--text-2)]">
                  <p>{chartDef.fn}</p>
                  {chartDef.dataShape && <p>Bentuk data: {SHAPE_LABEL[chartDef.dataShape]}</p>}
                </div>
              )}
            </div>
          )}

          {kind === "DIAGRAM" && (
            <div>
              <label htmlFor={`${ids}-family`} className="eyebrow mb-1 block">
                Keluarga diagram
              </label>
              <select
                id={`${ids}-family`}
                className={inputCls}
                value={family}
                onChange={(e) => choose(() => setFamily(e.target.value as DiagramFamily))}
              >
                {DIAGRAM_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {FAMILY_LABEL[f]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === "IMAGE" && (
            <div>
              <label htmlFor={`${ids}-file`} className="eyebrow mb-1 block">
                Berkas gambar (PNG/JPEG)
              </label>
              <input
                id={`${ids}-file`}
                type="file"
                accept="image/png,image/jpeg"
                aria-describedby={`${ids}-file-note`}
                onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                className={`block w-full text-[12.5px] text-[var(--text-2)] file:mr-3 file:rounded-[8px] file:border file:border-[var(--line)] file:bg-[var(--surface-2)] file:px-3 file:py-1.5 file:text-[12px] file:text-[var(--text)] ${FOCUS}`}
              />
              <p id={`${ids}-file-note`} className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--text-2)]" aria-live="polite">
                <FileUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {fileNote ?? "Resolusi efektif minimum 150 dpi pada lebar yang diminta."}
              </p>
            </div>
          )}

          {kind === "HTML" && (
            <div>
              <label htmlFor={`${ids}-slug`} className="eyebrow mb-1 block">
                Templat
              </label>
              <select
                id={`${ids}-slug`}
                className={inputCls}
                value={slug}
                onChange={(e) => choose(() => setSlug(e.target.value))}
                disabled={!templatesQ.data}
              >
                <option value="">{templatesQ.isLoading ? "Memuat templat…" : "Pilih templat"}</option>
                {(templatesQ.data?.templates ?? [])
                  .filter((t) => !t.archived)
                  .map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
              </select>
              {templatesQ.error && (
                <p role="alert" className="mt-1 text-[12px] text-[var(--warn)]">
                  Daftar templat gagal dimuat; isi kode templat langsung di isian spesifikasi.
                </p>
              )}
              <p className="mt-1 text-[12px] text-[var(--text-2)]">Halaman web hanya dirakit dari templat; kode halaman mentah ditolak.</p>
            </div>
          )}
        </Panel>

        <Panel className="space-y-4 p-4">
          <div>
            <label htmlFor={`${ids}-mission`} className="eyebrow mb-1 block">
              Folder misi (opsional)
            </label>
            <input
              id={`${ids}-mission`}
              className={inputCls}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              placeholder="2026-10-22_nama-misi"
              autoComplete="off"
            />
          </div>
          <fieldset>
            <legend className="eyebrow mb-1 block">Format berkas</legend>
            <div className="flex flex-wrap gap-3">
              {FORMATS_BY_KIND[kind].map((f) => (
                <label key={f} className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-2)]">
                  <input
                    type="checkbox"
                    checked={formats.includes(f)}
                    onChange={(e) => setFormats((cur) => (e.target.checked ? [...cur, f] : cur.filter((x) => x !== f)))}
                  />
                  {FORMAT_LABEL[f]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-2)]">Kosongkan untuk format bawaan jenis ini.</p>
          </fieldset>
        </Panel>
      </div>

      {/* Kolom kanan: isian, pemeriksaan, hasil */}
      <div className="space-y-4">
        <Panel className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={editorId} className="eyebrow">
              Spesifikasi {KIND_LABEL[kind].toLowerCase()} <span className="font-mono normal-case">({ARTIFACT_SCHEMA_BY_KIND[kind]})</span>
            </label>
            <div className="flex items-center gap-2">
              {dirty && <span className="text-[11.5px] text-[var(--text-2)]">Disunting</span>}
              <Button size="sm" onClick={resetEditor} disabled={!dirty}>
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Kembalikan contoh
              </Button>
            </div>
          </div>
          <textarea
            id={editorId}
            value={value}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={22}
            aria-describedby={issuesId}
            aria-invalid={check.issues.length > 0}
            className={`${inputCls} min-h-[360px] resize-y font-mono text-[12px] leading-[1.55] ${FOCUS}`}
          />
          {dirty && kind !== "IMAGE" && (
            <p className="text-[11.5px] text-[var(--text-2)]">
              Mengganti jenis tidak menimpa suntingan; klik Kembalikan contoh untuk contoh jenis terpilih.
            </p>
          )}
          <div id={issuesId} aria-live="polite">
            {schemaQ.error && (
              <p className="text-[12px] text-[var(--warn)]">Bentuk baku jenis ini gagal dimuat; pemeriksaan isian wajib dilewati.</p>
            )}
            {check.issues.length === 0 ? (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--up)]">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Lolos pemeriksaan awal. Pemeriksaan lengkap dilakukan saat membuat.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--warn)]">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> {check.issues.length} masalah perlu diperbaiki:
                </p>
                <ul className="max-h-48 space-y-1 overflow-auto text-[12px] text-[var(--text-2)]">
                  {check.issues.map((i, n) => (
                    <li key={n}>
                      <code className="font-mono text-[var(--text-2)]">{i.pointer || "/"}</code> {i.message}
                      {i.alternatives && i.alternatives.length > 0 && (
                        <span>
                          {" "}
                          Alternatif:{" "}
                          {i.alternatives.map((a, k) => (
                            <span key={a}>
                              {k > 0 && ", "}
                              <button
                                type="button"
                                className={`rounded text-[var(--accent)] underline-offset-2 hover:underline ${FOCUS}`}
                                onClick={() => {
                                  setKind("CHART");
                                  setCode(a);
                                  setText(null);
                                }}
                              >
                                {a}
                              </button>
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="primary" onClick={() => void send()} disabled={!canSend}>
              <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {busy ? "Membuat artefak…" : err?.retryable && cd.secondsLeft > 0 ? `Coba lagi (${cd.secondsLeft} dtk)` : "Buat artefak"}
            </Button>
            {err?.retryable && cd.exhausted && (
              <span className="text-[12px] text-[var(--text-2)]">Masih gagal. Muat ulang halaman atau hubungi admin.</span>
            )}
          </div>
        </Panel>

        {err && (
          <Panel className="space-y-2 p-4">
            <div role="alert" className="flex items-start gap-2 text-[13px] text-[var(--text-2)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" strokeWidth={2} aria-hidden />
              <span>{postErrorMessage(err)}</span>
            </div>
            {err.status === 401 && (
              <Button size="sm" href={loginHref(pathname, "tab=buat")}>
                <LogIn className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Masuk lagi
              </Button>
            )}
            {errAlternatives.length > 0 && (
              <p className="text-[12px] text-[var(--text-2)]">
                Alternatif:{" "}
                {errAlternatives.map((a, k) => (
                  <span key={a}>
                    {k > 0 && ", "}
                    <button
                      type="button"
                      className={`rounded text-[var(--accent)] underline-offset-2 hover:underline ${FOCUS}`}
                      onClick={() => {
                        setKind("CHART");
                        setCode(a);
                        setText(null);
                        setSubmit({ state: "idle" });
                      }}
                    >
                      {a}
                    </button>
                  </span>
                ))}
              </p>
            )}
            {errIssues.length > 0 && (
              <ul className="max-h-56 space-y-1 overflow-auto text-[12px] text-[var(--text-2)]">
                {errIssues.map((i, n) => (
                  <li key={n}>
                    <code className="font-mono text-[var(--text-2)]">{i.path || "/"}</code> {i.message}
                  </li>
                ))}
              </ul>
            )}
            <InfoTeknis
              items={{
                Kode: String(err.code),
                Status: err.status,
                "Id korelasi": err.correlationId,
                Pemeriksaan: errIssues.map((i) => i.checkId).filter(Boolean).join(", "),
              }}
            />
          </Panel>
        )}

        {submit.state === "done" && <CreateResult result={submit.result} />}
      </div>
    </div>
  );
}

function CreateResult({ result }: { result: ArtifactCreateResponse }) {
  const { artifact, outputs, job, errors } = result;
  const duration = formatSeconds(job?.durationMs);
  const failedFormats = [...new Set(errors.map((e) => (e.format ? (FORMAT_LABEL[e.format] ?? e.format) : "berkas")))];
  return (
    <Panel className="space-y-3 p-4">
      <div role="status" className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--text)]">Artefak dibuat: {artifact.title}</span>
        {job && <Pill tone={FILE_JOB_TONE[job.status]}>{FILE_JOB_LABEL[job.status]}</Pill>}
        {duration && <span className="num text-[12px] text-[var(--text-2)]">{duration}</span>}
      </div>
      {errors.length > 0 && <p className="text-[12px] text-[var(--warn)]">Sebagian berkas gagal dibuat: {failedFormats.join(", ")}.</p>}
      <ArtifactPreview files={outputs} title={artifact.title} />
      <FileList files={outputs} title={artifact.title} />
      <InfoTeknis
        items={{
          Id: artifact.id,
          Label: artifact.label,
          "Id pembuatan": job?.id,
          Galat: errors.map((e) => `${e.code}${e.format ? ` (${e.format})` : ""}${e.message ? `: ${e.message}` : ""}`).join(" | "),
        }}
      />
    </Panel>
  );
}
